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
import { dbQuery, clearAllLocalUserData, LOCAL_DATA_OWNER_KEY } from '../database/schema';
import { Mood, PrayerContext } from '../types';
import { withTimeout } from '../utils';

// Supabase client has no built-in request timeout, so a degraded connection
// can otherwise hang far longer than the OS default before falling back to
// local storage. Bounds every history read/write so the app never blocks
// guidance delivery waiting on the network.
const HISTORY_NETWORK_TIMEOUT_MS = 5000;

// Explicit column lists instead of select('*'). RLS already scopes these reads
// to the caller's own rows, so this isn't closing a leak — it pins the response
// shape so a later migration that adds a column (an internal flag, a
// moderation note, anything server-side) doesn't silently start shipping it to
// every client. Keep in sync with the row interfaces below.
const PATH_PROGRESS_COLUMNS =
    'path_id, current_day, start_date, completed_days, is_completed, completed_at';
const USER_PROFILE_COLUMNS =
    'id, display_name, subscription_tier, subscription_type, subscription_end, is_active, unlocked_bundles, created_at, updated_at';

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

    // In-memory cache for getRecentHistory — avoids a Supabase round-trip on
    // every getGuidance call within the same session. Invalidated when a new
    // history entry is recorded for the same mood so recency scoring stays fresh.
    private historyCache = new Map<string, { data: Map<string, number>; cachedAt: number }>();
    private readonly HISTORY_TTL_MS = 30 * 60 * 1000; // 30 min — well under any prayer window

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
        // Invalidate the in-memory cache so the next getGuidance call for this
        // mood includes the entry we're about to write in its recency penalties.
        this.historyCache.delete(mood);

        const userId = await this.getUserId();

        if (userId) {
            // ── Supabase path ──
            try {
                const { error } = await withTimeout(
                    supabase.from('user_history').insert({
                        user_id: userId,
                        content_id: contentId,
                        angle_id: angleId,
                        mood,
                    }),
                    HISTORY_NETWORK_TIMEOUT_MS,
                );

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
            } catch (error) {
                // Timed out or threw outright (e.g. a degraded connection stalling
                // past HISTORY_NETWORK_TIMEOUT_MS) — same fallback as a Postgrest error.
                console.error('[SupabaseDataService] recordHistory network failure:', error);
                await this.recordHistoryLocal(contentId, angleId, mood, true);
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

            // Pending rows are only ever written for a SIGNED-IN user, so they
            // belong to whoever wrote them — upload them only to that account.
            // Requiring a positive ownership match (rather than merely "not
            // someone else") also covers pre-marker installs, where the rows
            // came from some signed-in session we can no longer identify.
            //
            // This closes the window between a SIGNED_IN transition and
            // claimLocalDataForUser finishing: recordHistory calls this
            // opportunistically on every successful write, and dbQuery is a
            // serialized queue, so at app start the claim can sit behind the
            // Quran prefetch while the user is already recording guidance.
            if ((await this.getLocalDataOwner()) !== userId) return;

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
     *
     * Results are cached in memory for HISTORY_TTL_MS. The cache is invalidated
     * when recordHistory writes a new entry for the same mood, so the recency
     * scoring used by getGuidance stays accurate without a network round-trip
     * on every call within the same session.
     */
    async getRecentHistory(mood: Mood, cutoffMs: number): Promise<Map<string, number>> {
        const cached = this.historyCache.get(mood);
        if (cached && Date.now() - cached.cachedAt < this.HISTORY_TTL_MS) {
            return cached.data;
        }

        const userId = await this.getUserId();
        let result: Map<string, number>;

        if (userId) {
            // ── Supabase path ──
            const cutoffDate = new Date(cutoffMs).toISOString();
            let data: { content_id: string; angle_id: string; created_at: string }[] | null;
            try {
                const response = await withTimeout(
                    supabase
                        .from('user_history')
                        .select('content_id, angle_id, created_at')
                        .eq('user_id', userId)
                        .eq('mood', mood)
                        .gte('created_at', cutoffDate)
                        .order('created_at', { ascending: false }),
                    HISTORY_NETWORK_TIMEOUT_MS,
                );
                if (response.error) {
                    console.error('[SupabaseDataService] Error fetching history:', response.error.message);
                    return this.getRecentHistoryLocal(mood, cutoffMs);
                }
                data = response.data;
            } catch (error) {
                // Timed out (degraded connection) or threw outright — this call
                // gates every getGuidance delivery, so it must never stall the
                // guidance flow waiting on the network. Same fallback as an
                // explicit Postgrest error.
                console.error('[SupabaseDataService] getRecentHistory network failure:', error);
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
            result = historyMap;
        } else {
            // ── Guest/offline path ──
            result = await this.getRecentHistoryLocal(mood, cutoffMs);
        }

        this.historyCache.set(mood, { data: result, cachedAt: Date.now() });
        return result;
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
     *
     * For signed-in users the Supabase delete MUST succeed before local rows
     * are removed. If it fails (offline), we throw so the caller can surface an
     * error — continuing to the local DELETE would permanently destroy any rows
     * with pending_sync=1 that haven't been uploaded yet.
     */
    async clearHistory(): Promise<void> {
        const userId = await this.getUserId();

        if (userId) {
            const { error } = await supabase.from('user_history').delete().eq('user_id', userId);
            if (error) {
                console.error('[SupabaseDataService] Error clearing history:', error.message);
                // Do NOT fall through to local delete — pending_sync=1 rows would be
                // lost forever if we wipe them before they reach Supabase.
                throw new Error(error.message);
            }
        }

        // Supabase delete succeeded (or guest — no server copy exists).
        // Safe to clear the local cache now.
        await dbQuery(async (db) => {
            await db.execAsync('DELETE FROM user_history');
        });

        // Invalidate the in-memory history cache too — recordHistory() already
        // does this per-mood on write, but this deletes everything, so without
        // clearing the whole map, getRecentHistory() kept serving the stale,
        // pre-clear cached entries (up to HISTORY_TTL_MS) and rotation
        // continued avoiding "cleared" content.
        this.historyCache.clear();
    }

    // ══════════════════════════════════════════════════════════════════
    // LOCAL DATA OWNERSHIP
    // ══════════════════════════════════════════════════════════════════

    private async getLocalDataOwner(): Promise<string | null> {
        const row = await dbQuery(async (db) =>
            db.getFirstAsync<{ value: string }>('SELECT value FROM kv_store WHERE key = ?', [
                LOCAL_DATA_OWNER_KEY,
            ]),
        );
        return row?.value ?? null;
    }

    private async setLocalDataOwner(userId: string): Promise<void> {
        await dbQuery(async (db) => {
            await db.runAsync('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)', [
                LOCAL_DATA_OWNER_KEY,
                userId,
            ]);
        });
    }

    /**
     * True when local history contains rows that provably came from a
     * SIGNED-IN session rather than guest use: `pending_sync = 1` is only ever
     * written by recordHistory's offline fallback for a logged-in user (guest
     * writes are always 0). Used to protect installs that predate the owner
     * marker, where `getLocalDataOwner()` returns null but the rows are not
     * actually guest data.
     */
    private async hasSignedInOriginRows(): Promise<boolean> {
        const row = await dbQuery(async (db) =>
            db.getFirstAsync<{ n: number }>(
                'SELECT 1 AS n FROM user_history WHERE pending_sync = 1 LIMIT 1',
            ),
        );
        return !!row;
    }

    /**
     * Stamp ownership on a cold boot that already has a session, for installs
     * created before the marker existed. Without it those devices never get a
     * marker until the user happens to sign out and back in, and
     * `syncPendingHistory` — which now requires a positive ownership match —
     * would leave their queued offline rows stranded on the device forever.
     *
     * Only stamps when nothing is awaiting guest migration (`pending_sync = 0`
     * rows). Claiming those for the current user would strand them the other
     * way: `claimLocalDataForUser` would then see an owner and never migrate
     * them. That state (signed in, with a previously failed migration) resolves
     * itself at the next sign-in instead.
     *
     * Never overwrites an existing marker — this is not a way to take ownership
     * of another account's data.
     */
    async ensureLocalDataOwnerStamp(userId: string): Promise<void> {
        if ((await this.getLocalDataOwner()) !== null) return;

        const awaitingMigration = await dbQuery(async (db) =>
            db.getFirstAsync<{ n: number }>(
                'SELECT 1 AS n FROM user_history WHERE pending_sync = 0 LIMIT 1',
            ),
        );
        if (awaitingMigration) return;

        await this.setLocalDataOwner(userId);
    }

    /**
     * Decide what happens to the on-device rows when `userId` signs in, then do
     * it. Call this instead of `migrateGuestDataToSupabase()` — it is the guard
     * that decides whether migrating is even legitimate.
     *
     * Without it, signing out of account A and into account B on the same
     * device uploaded A's leftover history and journey progress under B's
     * user_id: `hasClaimedLocalData` in AuthContext is a ref that resets on app
     * restart, and the migration unconditionally swept every local row.
     *
     * Three outcomes:
     *  - owner === userId  → their own device. Flush pending rows to their
     *    account; never migrate (migration is for unowned data only).
     *  - owner is someone else, or absent but the rows are provably from some
     *    signed-in session → foreign data. Wipe it. Nothing is uploaded.
     *  - owner absent and the rows look like genuine guest use → migrate, the
     *    original intended behaviour.
     *
     * Either way the device ends up stamped with `userId`.
     *
     * What this does NOT catch: an install created before the owner marker
     * existed, where a signed-in user's *path progress* fell back to local but
     * their *history* never did (so there is no pending_sync=1 row to give them
     * away), and the device then changes hands before that user signs in again.
     * `user_path_progress` has no pending flag, so there is no signal to read.
     * The window closes permanently after the first sign-in on the new build,
     * which stamps the marker.
     */
    async claimLocalDataForUser(
        userId: string,
    ): Promise<{ migratedCount: number; wipedForeignData: boolean }> {
        const owner = await this.getLocalDataOwner();

        if (owner === userId) {
            // Returning to their own device — their queued offline rows are
            // still theirs. Push them up rather than leaving them stranded.
            await this.syncPendingHistory();
            return { migratedCount: 0, wipedForeignData: false };
        }

        if (owner !== null || (await this.hasSignedInOriginRows())) {
            // Belongs to a different account. Note this also discards any guest
            // rows created after that account signed out — they share the same
            // tables with no way to tell them apart, and over-deleting is the
            // only safe direction when the alternative is filing one person's
            // spiritual history under another person's name.
            await clearAllLocalUserData();
            await this.setLocalDataOwner(userId);
            return { migratedCount: 0, wipedForeignData: true };
        }

        const { migratedCount } = await this.migrateGuestDataToSupabase();
        await this.setLocalDataOwner(userId);
        return { migratedCount, wipedForeignData: false };
    }

    // ══════════════════════════════════════════════════════════════════
    // GUEST → USER MIGRATION
    // ══════════════════════════════════════════════════════════════════

    /**
     * Do NOT call this directly from a sign-in path — go through
     * `claimLocalDataForUser()`, which decides whether these rows are actually
     * unowned guest data. Called unguarded, this uploads whatever is on the
     * device under whoever just signed in.
     *
     * Sync all local SQLite history and path progress to Supabase on first sign-in.
     * Idempotent: uses upsert + ignoreDuplicates for history (backed by the
     * unique_user_history_entry DB constraint) so partial re-runs skip rows
     * already on the server. Local history is cleared only after all batches
     * succeed; a failed run leaves local rows intact for the next sign-in to retry.
     */
    async migrateGuestDataToSupabase(): Promise<{ migratedCount: number }> {
        const userId = await this.getUserId();
        if (!userId) return { migratedCount: 0 };

        try {
            // 1. Migrate user_history.
            //    Use upsert + ignoreDuplicates so partial re-runs safely skip rows
            //    that were already uploaded — the unique_user_history_entry constraint
            //    (migration 005) guarantees the DB rejects duplicates at rest.
            //    Local rows are cleared only after ALL batches confirm on the server.
            const localHistory = await dbQuery(async (db) => {
                return db.getAllAsync<{ contentId: string; angleId: string; mood: string; timestamp: number }>(
                    `SELECT contentId, angleId, mood, timestamp FROM user_history ORDER BY timestamp ASC`,
                );
            });

            let historyMigrationOk = true;

            if (localHistory.length > 0) {
                const supabaseRows = localHistory.map((row) => ({
                    user_id: userId,
                    content_id: row.contentId,
                    angle_id: row.angleId,
                    mood: row.mood,
                    created_at: new Date(row.timestamp).toISOString(),
                }));

                const batchSize = 100;
                for (let i = 0; i < supabaseRows.length; i += batchSize) {
                    const batch = supabaseRows.slice(i, i + batchSize);
                    const { error } = await supabase
                        .from('user_history')
                        .upsert(batch, {
                            onConflict: 'user_id,content_id,angle_id,created_at',
                            ignoreDuplicates: true,
                        });
                    if (error) {
                        console.error('[Migration] History batch upsert error:', error.message);
                        historyMigrationOk = false;
                    }
                }
            }

            // Only clear local after every batch is confirmed on the server.
            // Keeps pending rows intact on failure so the next sign-in can retry.
            if (historyMigrationOk) {
                await dbQuery(async (db) => {
                    await db.execAsync('DELETE FROM user_history');
                });
            }

            const migratedCount = historyMigrationOk ? localHistory.length : 0;

            // 2. Migrate user_path_progress — merge, don't overwrite.
            //    Fetch server state first; only upsert a path when local is further ahead
            //    (higher currentDay or more completedDays) to prevent regression.
            const localProgress = await dbQuery(async (db) => {
                return db.getAllAsync<any>(`SELECT * FROM user_path_progress`);
            });

            if (localProgress.length > 0) {
                const { data: serverProgress } = await supabase
                    .from('user_path_progress')
                    .select('path_id, current_day, completed_days')
                    .eq('user_id', userId);

                const serverMap = new Map<string, { current_day: number; completed_days: number[] }>();
                for (const sp of (serverProgress ?? [])) {
                    serverMap.set(sp.path_id, {
                        current_day: sp.current_day ?? 1,
                        completed_days: sp.completed_days ?? [],
                    });
                }

                for (const row of localProgress) {
                    // Guarded like the other two completedDays parses in this file:
                    // this loop's own outer try/catch would otherwise abort the ENTIRE
                    // migration (including every other well-formed row still to be
                    // processed) on one malformed value, silently reporting
                    // migratedCount: 0 for a real once-per-signup migration.
                    const localDays: number[] = (() => {
                        try { return row.completedDays ? JSON.parse(row.completedDays) : []; } catch { return []; }
                    })();
                    const server = serverMap.get(row.pathId);
                    // Skip if server is already ahead on both metrics.
                    if (
                        server &&
                        server.current_day >= row.currentDay &&
                        server.completed_days.length >= localDays.length
                    ) {
                        continue;
                    }
                    await supabase.from('user_path_progress').upsert({
                        user_id: userId,
                        path_id: row.pathId,
                        current_day: row.currentDay,
                        start_date: new Date(row.startDate).toISOString(),
                        completed_days: localDays,
                        is_completed: Boolean(row.isCompleted),
                        completed_at: row.completedAt ? new Date(row.completedAt).toISOString() : null,
                    }, { onConflict: 'user_id,path_id' });
                }
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
            }, { onConflict: 'user_id,path_id' });

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
                .select(PATH_PROGRESS_COLUMNS)
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
                completedDays: (() => { try { return r.completedDays ? JSON.parse(r.completedDays) : []; } catch { return []; } })(),
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
                .select(PATH_PROGRESS_COLUMNS)
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
                completedDays: (() => { try { return r.completedDays ? JSON.parse(r.completedDays) : []; } catch { return []; } })(),
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
            .select(USER_PROFILE_COLUMNS)
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
    async fetchContentByMood(mood: Mood, _prayerContext?: PrayerContext): Promise<any[]> {
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
