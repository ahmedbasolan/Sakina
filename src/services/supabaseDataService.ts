/**
 * SupabaseDataService — Single abstraction for all Supabase user-data operations.
 *
 * Design:
 *  - Logged-in users → Supabase PostgreSQL (with RLS)
 *  - Guests → Falls back to local SQLite via dbQuery()
 *  - Static content (Quran, angles, paths) always uses local SQLite
 *  - Reflections are ALWAYS local (privacy-first, never synced)
 */

import { supabase } from '../config/supabaseClient';
import { dbQuery } from '../database/schema';
import { Mood, PrayerContext } from '../types';

// ── Supabase Row Types ──────────────────────────────────────────────

export interface SupabaseHistoryRow {
    id: string;
    user_id: string;
    content_id: string;
    angle_id: string;
    mood: string;
    created_at: string;
}

export interface SupabasePathProgressRow {
    id: string;
    user_id: string;
    path_id: string;
    current_day: number;
    start_date: string;
    completed_days: number[];
    is_completed: boolean;
    completed_at: string | null;
}

export interface SupabaseUserProfile {
    id: string;
    display_name: string | null;
    subscription_tier: string;
    subscription_type: string | null;
    subscription_end: string | null;
    is_active: boolean;
    unlocked_bundles: string[];
    created_at: string;
    updated_at: string;
}

// ── Service ─────────────────────────────────────────────────────────

const SYNC_BATCH_SIZE = 50; // rows per flush — caps JS-thread block time

export class SupabaseDataService {
    private static instance: SupabaseDataService;
    // Prevents two concurrent syncPendingHistory runs from double-uploading rows.
    private isSyncing = false;

    static getInstance(): SupabaseDataService {
        if (!SupabaseDataService.instance) {
            SupabaseDataService.instance = new SupabaseDataService();
        }
        return SupabaseDataService.instance;
    }

    private constructor() { }

    // ── Auth helpers ────────────────────────────────────────────────

    /**
     * Returns the current user ID from the cached local session.
     * Uses getSession() (reads from AsyncStorage/memory) rather than getUser()
     * (makes a network request on every call) — avoids 13+ round-trips per
     * guidance session.
     */
    async getUserId(): Promise<string | null> {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.id ?? null;
    }

    /** Returns true if a user is logged in (not guest mode). */
    async isLoggedIn(): Promise<boolean> {
        return (await this.getUserId()) !== null;
    }

    // ══════════════════════════════════════════════════════════════════
    // USER HISTORY
    // ══════════════════════════════════════════════════════════════════

    /**
     * Record a guidance selection in history.
     * - Logged-in + online:  writes to Supabase, then opportunistically flushes
     *                        any rows that were queued while offline.
     * - Logged-in + offline: writes to local SQLite with pending_sync = 1 so
     *                        syncPendingHistory() can upload them later.
     * - Guest:               writes to local SQLite (pending_sync = 0, never synced).
     */
    async recordHistory(contentId: string, angleId: string, mood: Mood): Promise<void> {
        const userId = await this.getUserId();

        if (userId) {
            // ── Supabase path ──
            const { error } = await supabase.from('user_history').insert({
                user_id: userId,
                content_id: contentId,
                angle_id: angleId,
                mood,
            });

            if (error) {
                console.error('[SupabaseDataService] Error recording history:', error.message);
                // Fallback: persist locally and flag for sync when connectivity returns.
                await this.recordHistoryLocal(contentId, angleId, mood, true);
            } else {
                // Write succeeded — we're online. Opportunistically flush any entries
                // that were queued during a previous offline session. Fire-and-forget
                // so the current write path isn't delayed.
                this.syncPendingHistory().catch((e) =>
                    console.warn('[SupabaseDataService] Background pending-sync failed:', e),
                );
            }
        } else {
            // ── Guest path: local only, no sync needed ──
            await this.recordHistoryLocal(contentId, angleId, mood, false);
        }
    }

    /**
     * @param pendingSync  true when called as an offline fallback for a logged-in
     *                     user — marks the row for upload once connectivity returns.
     *                     Always false for guest writes.
     */
    private async recordHistoryLocal(
        contentId: string,
        angleId: string,
        mood: string,
        pendingSync: boolean = false,
    ): Promise<void> {
        await dbQuery(async (db) => {
            await db.runAsync(
                `INSERT INTO user_history (id, contentId, angleId, mood, timestamp, pending_sync) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    contentId,
                    angleId,
                    mood,
                    Date.now(),
                    pendingSync ? 1 : 0,
                ],
            );
        });
    }

    /**
     * Upload any locally-queued history rows (pending_sync = 1) to Supabase,
     * then clear the flag on rows that were successfully uploaded.
     *
     * Called opportunistically from recordHistory whenever a Supabase write
     * succeeds (meaning we're online). Safe to call at app startup too.
     *
     * Rows that fail to upload keep pending_sync = 1 and will be retried on
     * the next online write.
     */
    async syncPendingHistory(): Promise<void> {
        // Concurrency guard — two callers (e.g. back-to-back successful writes
        // on reconnect) must not both SELECT the same pending rows and
        // double-insert them into Supabase.
        if (this.isSyncing) return;
        this.isSyncing = true;

        try {
            const userId = await this.getUserId();
            if (!userId) return;

            // 1. Read up to SYNC_BATCH_SIZE queued rows.
            //    A LIMIT prevents fetching hundreds of rows into memory and
            //    then making hundreds of sequential round-trips in one shot.
            const pendingRows = await dbQuery(async (db) => {
                return db.getAllAsync<{
                    id: string;
                    contentId: string;
                    angleId: string;
                    mood: string;
                    timestamp: number;
                }>(
                    `SELECT id, contentId, angleId, mood, timestamp
                     FROM user_history
                     WHERE pending_sync = 1
                     ORDER BY timestamp ASC
                     LIMIT ${SYNC_BATCH_SIZE}`,
                );
            });

            if (pendingRows.length === 0) return;

            // 2. Batch insert — one network call instead of N.
            const supabaseRows = pendingRows.map((row) => ({
                user_id: userId,
                content_id: row.contentId,
                angle_id: row.angleId,
                mood: row.mood,
                created_at: new Date(row.timestamp).toISOString(),
            }));

            const { error } = await supabase.from('user_history').insert(supabaseRows);

            if (error) {
                // Batch failed — fall back to row-by-row so partial success is possible.
                const syncedIds: string[] = [];
                for (const row of pendingRows) {
                    const { error: rowErr } = await supabase.from('user_history').insert({
                        user_id: userId,
                        content_id: row.contentId,
                        angle_id: row.angleId,
                        mood: row.mood,
                        created_at: new Date(row.timestamp).toISOString(),
                    });
                    if (!rowErr) syncedIds.push(row.id);
                    else console.warn(`[Sync] Row ${row.id} failed:`, rowErr.message);
                }
                if (syncedIds.length > 0) {
                    await dbQuery(async (db) => {
                        const ph = syncedIds.map(() => '?').join(',');
                        await db.runAsync(
                            `UPDATE user_history SET pending_sync = 0 WHERE id IN (${ph})`,
                            syncedIds,
                        );
                    });
                }
                console.log(`[Sync] Batch failed; synced ${syncedIds.length}/${pendingRows.length} rows individually`);
            } else {
                // 3. Batch succeeded — clear all flags in one query.
                const ids = pendingRows.map((r) => r.id);
                await dbQuery(async (db) => {
                    const ph = ids.map(() => '?').join(',');
                    await db.runAsync(
                        `UPDATE user_history SET pending_sync = 0 WHERE id IN (${ph})`,
                        ids,
                    );
                });
                console.log(`[Sync] Uploaded ${pendingRows.length} pending rows`);
            }
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Get recent history for rotation scoring.
     * Returns a Map of "contentId-angleId" → lastShown timestamp.
     */
    async getRecentHistory(mood: Mood, cutoffMs: number): Promise<Map<string, number>> {
        const userId = await this.getUserId();

        if (userId) {
            // ── Supabase path ──
            const cutoffDate = new Date(cutoffMs).toISOString();
            const { data, error } = await supabase
                .from('user_history')
                .select('content_id, angle_id, created_at')
                .eq('user_id', userId)
                .eq('mood', mood)
                .gte('created_at', cutoffDate)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[SupabaseDataService] Error fetching history:', error.message);
                return this.getRecentHistoryLocal(mood, cutoffMs);
            }

            const historyMap = new Map<string, number>();
            if (data) {
                for (const row of data) {
                    const key = `${row.content_id}-${row.angle_id}`;
                    if (!historyMap.has(key)) {
                        historyMap.set(key, new Date(row.created_at).getTime());
                    }
                }
            }
            return historyMap;
        } else {
            // ── Guest/offline path ──
            return this.getRecentHistoryLocal(mood, cutoffMs);
        }
    }

    private async getRecentHistoryLocal(mood: string, cutoffMs: number): Promise<Map<string, number>> {
        return dbQuery(async (db) => {
            const rows = await db.getAllAsync(
                `SELECT contentId, angleId, MAX(timestamp) as lastShown
         FROM user_history
         WHERE mood = ? AND timestamp > ?
         GROUP BY contentId, angleId`,
                [mood, cutoffMs],
            );

            const historyMap = new Map<string, number>();
            for (const row of rows as { contentId: string; angleId: string; lastShown: number }[]) {
                historyMap.set(`${row.contentId}-${row.angleId}`, row.lastShown);
            }
            return historyMap;
        });
    }

    /**
     * Get full history for mood calendar / stats (used by MoodHistoryService).
     */
    async getMoodHistory(
        startDate: string,
        endDate: string,
    ): Promise<{ content_id: string; angle_id: string; mood: string; created_at: string }[]> {
        const userId = await this.getUserId();

        if (userId) {
            const { data, error } = await supabase
                .from('user_history')
                .select('content_id, angle_id, mood, created_at')
                .eq('user_id', userId)
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[SupabaseDataService] Error fetching mood history:', error.message);
                // Fall back to local SQLite so an offline session (where recordHistory
                // already wrote entries locally) still surfaces data in the calendar/stats.
                // NOTE: local entries written during an offline session are not auto-synced
                // back to Supabase when connectivity is restored — a sync queue would be
                // needed for that. This fallback ensures reads are at least consistent with
                // what the offline writes produced.
            } else {
                return data || [];
            }
        }

        // Guest path, or logged-in user with a Supabase read failure:
        return dbQuery(async (db) => {
            const startMs = new Date(startDate).getTime();
            const endMs = new Date(endDate).getTime();

            const rows = await db.getAllAsync(
                `SELECT id, contentId as content_id, angleId as angle_id, mood, timestamp as created_at
         FROM user_history
         WHERE timestamp >= ? AND timestamp <= ?
         ORDER BY timestamp DESC`,
                [startMs, endMs],
            );

            return (rows as { id: string; content_id: string; angle_id: string; mood: string; created_at: number }[]).map(
                (r) => ({
                    id: r.id,
                    content_id: r.content_id,
                    angle_id: r.angle_id,
                    mood: r.mood,
                    created_at: new Date(r.created_at).toISOString(),
                }),
            );
        });
    }

    /**
     * Clear all history (e.g., from a "Clear History" button).
     */
    async clearHistory(): Promise<void> {
        const userId = await this.getUserId();

        if (userId) {
            const { error } = await supabase.from('user_history').delete().eq('user_id', userId);
            if (error) {
                console.error('[SupabaseDataService] Error clearing history:', error.message);
            }
        }

        // Also clear local
        await dbQuery(async (db) => {
            await db.execAsync('DELETE FROM user_history');
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // GUEST → USER MIGRATION
    // ══════════════════════════════════════════════════════════════════

    /**
     * Sync all local SQLite history to Supabase on sign-up.
     * Idempotent: safe to call multiple times. Will skip history insertion if
     * the user already has any rows in Supabase (implies a previous migration
     * or data from another device). Local history is cleared on success so a
     * re-run is a no-op even if the skip-check is bypassed.
     */
    async migrateGuestDataToSupabase(): Promise<{ migratedCount: number }> {
        const userId = await this.getUserId();
        if (!userId) return { migratedCount: 0 };

        try {
            // 0. Idempotency check — if this user already has history in Supabase,
            //    don't re-insert. Just clean up local data below.
            const { count: existingCount, error: countError } = await supabase
                .from('user_history')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (countError) {
                console.error('[Migration] Count check failed, aborting to avoid duplicates:', countError.message);
                return { migratedCount: 0 };
            }

            // alreadyMigrated only when EVERY local row is in Supabase.
            // > 0 incorrectly blocked re-runs after a partial batch failure,
            // permanently orphaning the remaining rows.
            const localHistoryCount = await dbQuery(async (db) => {
                const r = await db.getFirstAsync<{ cnt: number }>(
                    'SELECT COUNT(*) as cnt FROM user_history',
                );
                return r?.cnt ?? 0;
            });
            const alreadyMigrated =
                localHistoryCount === 0 || (existingCount ?? 0) >= localHistoryCount;

            // 1. Migrate user_history (only if this is a fresh account)
            const localHistory = await dbQuery(async (db) => {
                return db.getAllAsync(
                    `SELECT contentId, angleId, mood, timestamp FROM user_history ORDER BY timestamp ASC`,
                );
            });

            let migratedCount = 0;
            let historyInsertSucceeded = true;

            if (!alreadyMigrated && localHistory.length > 0) {
                const supabaseRows = (
                    localHistory as { contentId: string; angleId: string; mood: string; timestamp: number }[]
                ).map((row) => ({
                    user_id: userId,
                    content_id: row.contentId,
                    angle_id: row.angleId,
                    mood: row.mood,
                    created_at: new Date(row.timestamp).toISOString(),
                }));

                // Insert in batches of 100
                const batchSize = 100;
                for (let i = 0; i < supabaseRows.length; i += batchSize) {
                    const batch = supabaseRows.slice(i, i + batchSize);
                    const { error } = await supabase.from('user_history').insert(batch);
                    if (error) {
                        console.error('[Migration] History batch insert error:', error.message);
                        historyInsertSucceeded = false;
                        // Continue remaining batches — partial success is better than none.
                        // The updated alreadyMigrated check above lets the next login resume
                        // from where this left off rather than skipping everything.
                    } else {
                        migratedCount += batch.length;
                    }
                }
            } else if (alreadyMigrated) {
                console.log('[Migration] User already has Supabase history — skipping insert.');
            }

            // 2. Migrate user_path_progress (always upserts — natural key is user+path)
            const localProgress = await dbQuery(async (db) => {
                return db.getAllAsync(`SELECT * FROM user_path_progress`);
            });

            if (localProgress.length > 0) {
                for (const row of localProgress as any[]) {
                    await supabase.from('user_path_progress').upsert({
                        user_id: userId,
                        path_id: row.pathId,
                        current_day: row.currentDay,
                        start_date: new Date(row.startDate).toISOString(),
                        completed_days: row.completedDays ? JSON.parse(row.completedDays) : [],
                        is_completed: Boolean(row.isCompleted),
                        completed_at: row.completedAt ? new Date(row.completedAt).toISOString() : null,
                    });
                }
            }

            // 3. Clear local history after successful migration (or if it was already
            //    migrated). Prevents re-runs from duplicating, and guest state now lives
            //    authoritatively in Supabase for logged-in users.
            if (historyInsertSucceeded && (alreadyMigrated || migratedCount === localHistory.length)) {
                await dbQuery(async (db) => {
                    await db.execAsync('DELETE FROM user_history');
                });
            }

            console.log(`[Migration] Migrated ${migratedCount} history entries to Supabase`);
            return { migratedCount };
        } catch (error) {
            console.error('[Migration] Error migrating guest data:', error);
            return { migratedCount: 0 };
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // PATH PROGRESS
    // ══════════════════════════════════════════════════════════════════

    async recordPathProgress(progress: any): Promise<void> {
        const userId = await this.getUserId();

        if (userId) {
            const { error } = await supabase.from('user_path_progress').upsert({
                user_id: userId,
                path_id: progress.pathId,
                current_day: progress.currentDay,
                start_date: new Date(progress.startDate).toISOString(),
                completed_days: progress.completedDays,
                is_completed: progress.isCompleted,
                completed_at: progress.completedAt ? new Date(progress.completedAt).toISOString() : null,
            });

            if (error) {
                console.error('[SupabaseDataService] Error recording path progress:', error.message);
                await this.recordPathProgressLocal(progress);
            }
        } else {
            await this.recordPathProgressLocal(progress);
        }
    }

    private async recordPathProgressLocal(progress: any): Promise<void> {
        await dbQuery(async (db) => {
            await db.runAsync(
                `INSERT OR REPLACE INTO user_path_progress (id, pathId, currentDay, startDate, completedDays, isCompleted, completedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    progress.pathId,
                    progress.pathId,
                    progress.currentDay,
                    progress.startDate,
                    JSON.stringify(progress.completedDays),
                    progress.isCompleted ? 1 : 0,
                    progress.completedAt || null,
                ],
            );
        });
    }

    async getPathProgress(pathId: string): Promise<any | null> {
        const userId = await this.getUserId();

        if (userId) {
            const { data, error } = await supabase
                .from('user_path_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('path_id', pathId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
                console.error('[SupabaseDataService] Error fetching path progress:', error.message);
                return this.getPathProgressLocal(pathId);
            }

            if (data) {
                return {
                    pathId: data.path_id,
                    currentDay: data.current_day,
                    startDate: new Date(data.start_date).getTime(),
                    completedDays: data.completed_days,
                    isCompleted: data.is_completed,
                    completedAt: data.completed_at ? new Date(data.completed_at).getTime() : null,
                };
            }
        }

        return this.getPathProgressLocal(pathId);
    }

    private async getPathProgressLocal(pathId: string): Promise<any | null> {
        return dbQuery(async (db) => {
            const row = await db.getFirstAsync(`SELECT * FROM user_path_progress WHERE pathId = ?`, [pathId]);
            if (!row) return null;
            const r = row as any;
            return {
                pathId: r.pathId,
                currentDay: r.currentDay,
                startDate: r.startDate,
                completedDays: r.completedDays ? JSON.parse(r.completedDays) : [],
                isCompleted: Boolean(r.isCompleted),
                completedAt: r.completedAt,
            };
        });
    }

    async getAllPathProgress(): Promise<any[]> {
        const userId = await this.getUserId();

        if (userId) {
            const { data, error } = await supabase
                .from('user_path_progress')
                .select('*')
                .eq('user_id', userId);

            if (error) {
                console.error('[SupabaseDataService] Error fetching all path progress:', error.message);
                return this.getAllPathProgressLocal();
            }

            return (data || []).map(d => ({
                pathId: d.path_id,
                currentDay: d.current_day,
                startDate: new Date(d.start_date).getTime(),
                completedDays: d.completed_days,
                isCompleted: d.is_completed,
                completedAt: d.completed_at ? new Date(d.completed_at).getTime() : null,
            }));
        }

        return this.getAllPathProgressLocal();
    }

    private async getAllPathProgressLocal(): Promise<any[]> {
        return dbQuery(async (db) => {
            const rows = await db.getAllAsync(`SELECT * FROM user_path_progress`);
            return (rows as any[]).map(r => ({
                pathId: r.pathId,
                currentDay: r.currentDay,
                startDate: r.startDate,
                completedDays: r.completedDays ? JSON.parse(r.completedDays) : [],
                isCompleted: Boolean(r.isCompleted),
                completedAt: r.completedAt,
            }));
        });
    }

    // ══════════════════════════════════════════════════════════════════
    // USER PROFILE & SUBSCRIPTION
    // ══════════════════════════════════════════════════════════════════

    async getUserProfile(): Promise<SupabaseUserProfile | null> {
        const userId = await this.getUserId();
        if (!userId) return null;

        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('[SupabaseDataService] Error fetching user profile:', error.message);
            return null;
        }

        return data;
    }

    async updateUserProfile(updates: Partial<SupabaseUserProfile>): Promise<void> {
        const userId = await this.getUserId();
        if (!userId) return;

        const { error } = await supabase
            .from('user_profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (error) {
            console.error('[SupabaseDataService] Error updating user profile:', error.message);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // GUIDANCE CONTENT (QURAN, SUNNAH, DUAS)
    // ══════════════════════════════════════════════════════════════════

    /**
     * Fetch guidance content from Supabase filtered by mood.
     * Optionally filters/prioritizes by prayer context if provided.
     */
    async fetchContentByMood(mood: Mood, prayerContext?: PrayerContext): Promise<any[]> {
        // Limit to 50 rows — the rotation engine only uses the top 3 candidates,
        // so fetching the entire table is wasteful as content grows.
        const query = supabase
            .from('content_angles')
            .select(`
                *,
                content:content_id (*)
            `)
            .eq('mood', mood)
            .limit(50);

        const { data, error } = await query;

        if (error) {
            console.error('[SupabaseDataService] Error fetching content by mood:', error.message);
            return [];
        }

        return data || [];
    }

    /**
     * Fetch a specific guidance angle by its ID.
     */
    async fetchAngleById(angleId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('content_angles')
            .select(`
                *,
                content:content_id (*)
            `)
            .eq('id', angleId)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') { // Not found is fine
                console.error('[SupabaseDataService] Error fetching angle by ID:', error.message);
            }
            return null;
        }

        return data;
    }

    /**
     * One-time seeding of static content to Supabase.
     * Should be run from an admin script.
     */
    async seedSupabaseContent(content: any[], angles: any[]): Promise<void> {
        // 1. Clear existing content (Caution: destructuve)
        // In production, you'd use a more surgical approach

        // 2. Batch insert content
        const { error: contentError } = await supabase.from('content').insert(content.map(c => ({
            id: c.id,
            type: c.type,
            primary_text: c.primaryText,
            arabic_text: c.arabicText,
            transliteration: c.transliteration,
            english_translation: c.englishTranslation,
            source: c.source,
            audio_key: c.audioKey,
            why_this: c.whyThis,
            prophetic_practice: c.propheticPractice ? JSON.stringify(c.propheticPractice) : null,
            optional_action: c.optionalAction,
            optional_reflection: c.optionalReflection,
            prayer_context: c.prayerContext || []
        })));

        if (contentError) {
            console.error('[Seeding] Content insert error:', contentError.message);
            return;
        }

        // 3. Batch insert angles
        const { error: angleError } = await supabase.from('content_angles').insert(angles.map(a => ({
            id: a.id,
            content_id: a.contentId,
            mood: a.mood,
            angle: a.angle,
            angle_source: a.angleSource,
            action: a.action,
            action_arabic_text: a.actionArabicText,
            action_transliteration: a.actionTransliteration,
            action_source: a.actionSource,
            action_how_to: a.actionHowTo,
            action_reward: a.actionReward,
            practice_steps: a.practiceSteps ? JSON.parse(a.practiceSteps) : null,
            reflection: a.reflection
        })));

        if (angleError) {
            console.error('[Seeding] Angle insert error:', angleError.message);
        }
    }
}
