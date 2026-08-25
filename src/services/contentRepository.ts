/**
 * ContentRepository — single source of truth for fetching ContentAngles.
 *
 * Abstracts the cloud-first / SQLite-fallback pattern that was previously
 * duplicated inside RotationEngine.getAvailableAngles() and
 * RotationEngine.getGuidanceForStep(). RotationEngine now only orchestrates
 * scoring and selection; all I/O lives here.
 */

import { Mood, ContentAngle, Content, ContentType, PrayerContext } from '../types';
import { dbQuery } from '../database/connection';
import { SupabaseDataService } from './supabaseDataService';
import { logServiceError } from './errorLoggingService';

/**
 * Angle-id prefixes that mark an angle as belonging to one journey day.
 *
 * These are excluded from the mood-picker query. They are written in
 * tafsir/scholarly voice for PathStepScreen's Understand/Matters slot, but
 * GuidanceScreen puts `angle.angle` in the direct-address "For Your Heart"
 * card — so serving one there is the wrong voice in the wrong slot, and five
 * of them still carry a visible `[Bukhari 531]`-style tag.
 *
 * This is the single source of truth: `scripts/verify-mood-pools.mjs` parses
 * this array rather than keeping its own copy. It previously hardcoded the
 * same list next to a comment claiming journey angles "are fetched by id,
 * never through the mood join" — which was never true, and the two drifting
 * apart is what hid 28 leaked angles.
 *
 * A new journey only needs its prefix added here.
 */
export const JOURNEY_ANGLE_PREFIXES = ['rizq', 'salah', 'results', 'study', 'imam', 'crisis', 'marriage'];

const JOURNEY_ID_GLOBS = JOURNEY_ANGLE_PREFIXES.map((p) => `q_angle_${p}_*`);

// ── Internal row shapes ────────────────────────────────────────────────────

interface ContentAngleRow {
  id: string;
  contentId: string;
  mood: Mood;
  angle: string;
  angleSource?: string;
  action?: string;
  reflection?: string;
  relevanceScore: number;
  type: string;
  primaryText: string;
  arabicText?: string;
  transliteration?: string;
  englishTranslation?: string;
  source?: string;
  audioKey?: string;
  whyThis?: string;
  propheticPractice?: string;
  optionalAction?: string;
  optionalReflection?: string;
  actionArabicText?: string;
  actionTransliteration?: string;
  actionSource?: string;
  actionHowTo?: string;
  actionReward?: string;
  practiceSteps?: string;
  prayerContext?: string;
}

interface ContentRow {
  id: string;
  type: string;
  primaryText: string;
  arabicText?: string;
  transliteration?: string;
  englishTranslation?: string;
  source?: string;
  audioKey?: string;
  whyThis?: string;
  propheticPractice?: string;
  optionalAction?: string;
  optionalReflection?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Normalise practiceSteps to always be a JSON string or undefined. */
function normalizePracticeSteps(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'string') return raw;
  return JSON.stringify(raw);
}

/** Map a Supabase row to ContentAngle. */
function mapCloudRow(row: any): ContentAngle {
  return {
    id: row.id,
    contentId: row.content_id,
    mood: row.mood as Mood,
    angle: row.angle,
    angleSource: row.angle_source,
    action: row.action,
    actionArabicText: row.action_arabic_text,
    actionTransliteration: row.action_transliteration,
    actionSource: row.action_source,
    actionHowTo: row.action_how_to,
    actionReward: row.action_reward,
    practiceSteps: normalizePracticeSteps(row.practice_steps),
    reflection: row.reflection,
    relevanceScore: row.relevance_score || 10,
    contentType: row.content?.type as ContentType,
    content: row.content
      ? {
          id: row.content.id,
          type: row.content.type as ContentType,
          primaryText: row.content.primary_text || '',
          arabicText: row.content.arabic_text,
          transliteration: row.content.transliteration,
          englishTranslation: row.content.english_translation || '',
          source: row.content.source || '',
          whyThis: row.content.why_this || '',
          propheticPractice: row.content.prophetic_practice
            ? (() => {
                try {
                  return typeof row.content.prophetic_practice === 'string'
                    ? JSON.parse(row.content.prophetic_practice)
                    : row.content.prophetic_practice;
                } catch { return undefined; }
              })()
            : undefined,
          optionalAction: row.content.optional_action,
          optionalReflection: row.content.optional_reflection,
          audioKey: row.content.audio_key,
          prayerContext: row.content.prayer_context as PrayerContext[],
          moods: [],
        }
      : undefined,
  };
}

/** Map a SQLite joined row (from the explicit-column query) to ContentAngle. */
function mapLocalRow(row: ContentAngleRow): ContentAngle {
  return {
    id: row.id,
    contentId: row.contentId,
    mood: row.mood,
    angle: row.angle,
    angleSource: row.angleSource,
    action: row.action,
    actionArabicText: row.actionArabicText,
    actionTransliteration: row.actionTransliteration,
    actionSource: row.actionSource,
    actionHowTo: row.actionHowTo,
    actionReward: row.actionReward,
    practiceSteps: row.practiceSteps,
    reflection: row.reflection,
    relevanceScore: row.relevanceScore,
    contentType: row.type as ContentType,
    content: {
      id: row.contentId,
      type: row.type as ContentType,
      primaryText: row.primaryText || '',
      arabicText: row.arabicText,
      transliteration: row.transliteration,
      englishTranslation: row.englishTranslation || '',
      source: row.source || '',
      audioKey: row.audioKey,
      whyThis: row.whyThis || '',
      prayerContext: (() => { try { return row.prayerContext ? JSON.parse(row.prayerContext) : []; } catch { return []; } })(),
      propheticPractice: (() => { try { return row.propheticPractice ? JSON.parse(row.propheticPractice) : undefined; } catch { return undefined; } })(),
      optionalAction: row.optionalAction,
      optionalReflection: row.optionalReflection,
      moods: [],
    },
  };
}

// ── Repository ─────────────────────────────────────────────────────────────

export class ContentRepository {
  private static instance: ContentRepository;
  private supabaseData = SupabaseDataService.getInstance();

  static getInstance(): ContentRepository {
    if (!ContentRepository.instance) {
      ContentRepository.instance = new ContentRepository();
    }
    return ContentRepository.instance;
  }

  private constructor() {}

  /**
   * Fetch all angles for a given mood.
   *
   * Local-first: SQLite is always populated via seedContent.ts at init time
   * and contains the full, up-to-date whyThis / attribution data.  Supabase
   * is only used as a fallback for content that hasn't been seeded locally
   * (e.g. future admin-only additions pushed before the next app release).
   *
   * We deliberately avoid cloud-first here because the Supabase content table
   * can fall behind local data (e.g. whyThis fields were backfilled locally
   * but not yet re-seeded to Supabase), which would serve stale/empty data
   * to logged-in users.
   */
  async fetchForMood(mood: Mood): Promise<ContentAngle[]> {
    const local = await this.fetchForMoodLocal(mood);
    if (local.length > 0) return local;

    // Cloud fallback — only reached if local has no content for this mood
    try {
      const cloudData = await this.supabaseData.fetchContentByMood(mood);
      if (cloudData && cloudData.length > 0) {
        // Same journey-angle exclusion as the local query. Filtered here rather
        // than in the Supabase call so both paths read from one list.
        const moodOnly = cloudData.filter(
          (row: { id?: string }) =>
            !JOURNEY_ANGLE_PREFIXES.some((p) => row.id?.startsWith(`q_angle_${p}_`)),
        );
        if (moodOnly.length > 0) return moodOnly.map(mapCloudRow);
      }
    } catch (error) {
      logServiceError(
        'ContentRepository',
        'fetchForMood',
        error instanceof Error ? error : new Error(String(error)),
        { mood },
      );
    }
    return [];
  }

  /** SQLite fallback for fetchForMood. */
  private async fetchForMoodLocal(mood: Mood): Promise<ContentAngle[]> {
    return dbQuery(async (db) => {
      // Explicit column aliases avoid the SELECT ca.*, c.* id-collision bug
      // (both tables have an `id` column; SQLite last-write-wins would return
      // content.id in row.id, corrupting session dedup and history recording).
      // Also filters ca.mood = ? so angles written for other moods that happen
      // to be attached to multi-mood content are not returned, and excludes
      // journey angles by id — see JOURNEY_ANGLE_PREFIXES. Without that last
      // clause 28 journey-day angles were selectable from the mood picker,
      // including all seven Salah days, which were 7 of Calm's 23.
      const result = await db.getAllAsync(
        `SELECT
           ca.id             AS id,
           ca.contentId      AS contentId,
           ca.mood           AS mood,
           ca.angle          AS angle,
           ca.angleSource    AS angleSource,
           ca.action         AS action,
           ca.actionArabicText      AS actionArabicText,
           ca.actionTransliteration AS actionTransliteration,
           ca.actionSource   AS actionSource,
           ca.actionHowTo    AS actionHowTo,
           ca.actionReward   AS actionReward,
           ca.practiceSteps  AS practiceSteps,
           ca.reflection     AS reflection,
           c.type            AS type,
           c.primaryText     AS primaryText,
           c.arabicText      AS arabicText,
           c.transliteration AS transliteration,
           c.englishTranslation AS englishTranslation,
           c.source          AS source,
           c.audioKey        AS audioKey,
           c.whyThis         AS whyThis,
           c.propheticPractice  AS propheticPractice,
           c.optionalAction  AS optionalAction,
           c.optionalReflection AS optionalReflection,
           c.prayerContext   AS prayerContext,
           cm.relevanceScore AS relevanceScore
         FROM content_angles ca
         JOIN content c       ON ca.contentId = c.id
         JOIN content_moods cm ON c.id = cm.contentId
         WHERE cm.mood = ?
           AND ca.mood = ?
           ${JOURNEY_ID_GLOBS.map(() => 'AND ca.id NOT GLOB ?').join('\n           ')}
         ORDER BY cm.relevanceScore DESC`,
        [mood, mood, ...JOURNEY_ID_GLOBS],
      );
      return (result as ContentAngleRow[]).map(mapLocalRow);
    });
  }

  /**
   * Fetch a single angle by ID for path-step guidance.
   * Local-first (same rationale as fetchForMood); Supabase as fallback.
   */
  async fetchAngleById(angleId: string): Promise<ContentAngle | null> {
    // SQLite primary
    const row = await dbQuery(async (db) =>
      db.getFirstAsync<any>(`SELECT * FROM content_angles WHERE id = ?`, [angleId]),
    );
    if (row) {
      return {
        id: row.id,
        contentId: row.contentId,
        mood: row.mood,
        angle: row.angle,
        angleSource: row.angleSource,
        action: row.action,
        actionArabicText: row.actionArabicText,
        actionTransliteration: row.actionTransliteration,
        actionSource: row.actionSource,
        actionHowTo: row.actionHowTo,
        actionReward: row.actionReward,
        practiceSteps: row.practiceSteps,
        reflection: row.reflection,
      };
    }

    // Cloud fallback — angle not seeded locally yet
    try {
      const cloudAngle = await this.supabaseData.fetchAngleById(angleId);
      if (cloudAngle) return mapCloudRow(cloudAngle);
    } catch (error) {
      logServiceError(
        'ContentRepository',
        'fetchAngleById',
        error instanceof Error ? error : new Error(String(error)),
        { angleId },
      );
    }
    return null;
  }

  /**
   * Fetch a content row by ID from SQLite.
   * Used by RotationEngine.buildExperience when the angle doesn't already
   * carry its parent content (SQLite fallback path).
   */
  async fetchContentById(contentId: string): Promise<Content | null> {
    const row = await dbQuery(async (db) =>
      db.getFirstAsync<ContentRow>(`SELECT * FROM content WHERE id = ?`, [contentId]),
    );
    if (!row) return null;
    return {
      id: row.id,
      type: row.type as ContentType,
      primaryText: row.primaryText,
      arabicText: row.arabicText,
      transliteration: row.transliteration,
      englishTranslation: row.englishTranslation || '',
      source: row.source || '',
      audioKey: row.audioKey,
      whyThis: row.whyThis || '',
      // Guarded like the other two propheticPractice parses in this file: a
      // single malformed row must degrade to "no practice" rather than throw
      // out of buildExperience and break the whole guidance delivery.
      propheticPractice: (() => {
        try {
          return row.propheticPractice ? JSON.parse(row.propheticPractice) : undefined;
        } catch {
          return undefined;
        }
      })(),
      optionalAction: row.optionalAction,
      optionalReflection: row.optionalReflection,
      moods: [],
    };
  }

  /**
   * Fetch all Quran-type content rows with their mood tags, for the Quran
   * Library screen. Moods are grouped per verse via GROUP_CONCAT.
   */
  async getQuranVerses(): Promise<Content[]> {
    return dbQuery(async (db) => {
      const rows = await db.getAllAsync<any>(`
        SELECT
          c.id, c.type, c.primaryText, c.arabicText, c.transliteration,
          c.englishTranslation, c.source, c.whyThis,
          GROUP_CONCAT(cm.mood, ',') AS moods_csv
        FROM content c
        INNER JOIN content_moods cm ON c.id = cm.contentId
        WHERE c.type = 'Quran'
        GROUP BY c.id
        ORDER BY c.source ASC
      `);
      return rows.map((row): Content => ({
        id: row.id,
        type: row.type as ContentType,
        primaryText: row.primaryText,
        arabicText: row.arabicText ?? undefined,
        transliteration: row.transliteration ?? undefined,
        englishTranslation: row.englishTranslation,
        source: row.source,
        whyThis: row.whyThis,
        moods: row.moods_csv ? (row.moods_csv.split(',') as Mood[]) : [],
      }));
    });
  }
}
