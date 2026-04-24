import { Mood, GuidanceExperience, ContentAngle, ContentType, PrayerContext } from '../types';
import { getDatabase, dbQuery } from '../database/schema';
import { FreemiumService } from './freemiumService';
import { SupabaseDataService } from './supabaseDataService';
import { sunnahContentData } from '../data/sunnahData';
import PrayerTimesService from './prayerTimesService';
import { logDatabaseError, logServiceError, logError, ErrorSeverity } from './errorLoggingService';

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

interface HistoryRow {
  contentId: string;
  angleId: string;
  lastShown: number;
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

export class RotationEngine {
  private db: any = null;
  private initPromise: Promise<void> | null = null;
  private freemiumService = FreemiumService.getInstance();
  private supabaseData = SupabaseDataService.getInstance();
  private prayerTimesService = PrayerTimesService.getInstance();

  // Session-level tracking: prevents same angle from being shown twice in quick succession
  private sessionShownAngles: Set<string> = new Set();
  private lastSessionMood: string | null = null;

  constructor() {
    // Lazy initialization happens in ensureDb()
  }

  private async init(): Promise<void> {
    try {
      this.db = await getDatabase();
    } catch (error) {
      logDatabaseError('initialize database', error instanceof Error ? error : new Error(String(error)));
      this.db = null;
    }
  }

  private async ensureDb(): Promise<boolean> {
    if (this.db) return true;

    if (this.initPromise) {
      await this.initPromise;
      return this.db !== null;
    }

    this.initPromise = this.init();
    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }

    return this.db !== null;
  }

  async getGuidance(
    mood: Mood,
    intensity?: string,
    duration?: string,
  ): Promise<GuidanceExperience | null> {
    const dbReady = await this.ensureDb();
    if (!dbReady) {
      logServiceError('RotationEngine', 'getGuidance', 'Database not available', { mood });
      return null;
    }

    try {
      const availableAngles = await this.getAvailableAngles(mood);

      if (availableAngles.length === 0) {
        logServiceError('RotationEngine', 'getGuidance', `No curated content found for mood: ${mood}`, { mood });
        return null;
      }

      // 2. Fetch history for the last 7 days to apply penalties
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const history = await this.getRecentHistory(mood, sevenDaysAgo);

      // 3. Get current prayer context for boosting
      const currentPrayerContext = await this.prayerTimesService.getCurrentPrayerContext();

      // 4. Score all available angles
      const scoredAngles = availableAngles.map((angle) => {
        let score = (angle as ContentAngle & { relevanceScore?: number }).relevanceScore || 10;

        // Apply penalty for recency (Soft Rotation)
        const lastShown = history.get(`${angle.contentId}-${angle.id}`);
        if (lastShown) {
          const daysSince = (Date.now() - lastShown) / (24 * 60 * 60 * 1000);
          if (daysSince < 1)
            score -= 15; // Heavy penalty for < 24h
          else if (daysSince < 3)
            score -= 10; // Moderate penalty for < 3d
          else if (daysSince < 7) score -= 5; // Light penalty for < 7d
        }

        // Apply Time-Aware Boost: Significant boost if content is tagged for current window
        if (angle.content?.prayerContext && angle.content.prayerContext.length > 0) {
          if (angle.content.prayerContext.includes(currentPrayerContext)) {
            score += 50; // Major boost for context match
          }
        }

        return { angle, score: Math.max(1, score) }; // Minimum score of 1
      });

      // 4. SESSION-LEVEL FILTER: Exclude angles shown in THIS session (Hard exclusion for session only)
      const eligibleScored = scoredAngles.filter(
        (item) => !this.sessionShownAngles.has(item.angle.id) && this.lastSessionMood === mood, // Only check session shown if mood is same
      );

      // If everything in session was used, reset session
      const finalCandidates = eligibleScored.length > 0 ? eligibleScored : scoredAngles;

      // 5. Select from top candidates using weighted randomization
      // We sort and take the top 3-5 to ensure quality remains high
      finalCandidates.sort((a, b) => b.score - a.score);
      const topPoolSize = Math.min(3, finalCandidates.length);
      const topPool = finalCandidates.slice(0, topPoolSize);

      const selectedAngle = this.weightedRandomSelect(topPool);

      // Track in session and record in database
      if (this.lastSessionMood !== mood) {
        this.sessionShownAngles.clear();
        this.lastSessionMood = mood;
      }
      this.sessionShownAngles.add(selectedAngle.id);
      await this.recordSelection(selectedAngle.id, mood);

      return this.buildExperience(selectedAngle);
    } catch (error) {
      logServiceError('RotationEngine', 'getGuidance', error instanceof Error ? error : new Error(String(error)), { mood });
      return null;
    }
  }

  private async getAvailableAngles(mood: Mood): Promise<ContentAngle[]> {
    try {
      // 1. Attempt to fetch from Supabase (Cloud First)
      const cloudData = await this.supabaseData.fetchContentByMood(mood);

      if (cloudData && cloudData.length > 0) {
        return cloudData.map((row: any) => ({
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
          practiceSteps: typeof row.practice_steps === 'string'
            ? row.practice_steps
            : JSON.stringify(row.practice_steps),
          reflection: row.reflection,
          relevanceScore: row.relevance_score || 10,
          contentType: row.content?.type as ContentType,
          content: row.content ? {
            id: row.content.id,
            type: row.content.type as ContentType,
            primaryText: row.content.primary_text || '',
            arabicText: row.content.arabic_text,
            transliteration: row.content.transliteration,
            englishTranslation: row.content.english_translation || '',
            source: row.content.source || '',
            whyThis: row.content.why_this || '',
            propheticPractice: row.content.prophetic_practice
              ? (typeof row.content.prophetic_practice === 'string'
                ? JSON.parse(row.content.prophetic_practice)
                : row.content.prophetic_practice)
              : undefined,
            optionalAction: row.content.optional_action,
            optionalReflection: row.content.optional_reflection,
            audioKey: row.content.audio_key,
            prayerContext: row.content.prayer_context as PrayerContext[],
            moods: [],
          } : undefined,
        }));
      }
    } catch (error) {
      logServiceError('RotationEngine', 'getAvailableAngles', error instanceof Error ? error : new Error(String(error)), { mood });
    }

    // 2. Fallback to Local SQLite (Offline / Guest / Initial state)
    return this.getAvailableAnglesLocal(mood);
  }

  private async getAvailableAnglesLocal(mood: Mood): Promise<ContentAngle[]> {
    return dbQuery(async (db) => {
      const result = await db.getAllAsync(
        `
        SELECT ca.*, c.*, cm.relevanceScore
        FROM content_angles ca
        JOIN content c ON ca.contentId = c.id
        JOIN content_moods cm ON c.id = cm.contentId
        WHERE cm.mood = ?
        ORDER BY cm.relevanceScore DESC
      `,
        [mood],
      );

      return (result as ContentAngleRow[]).map((row) => ({
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
          prayerContext: row.prayerContext ? JSON.parse(row.prayerContext) : [],
          propheticPractice: row.propheticPractice ? JSON.parse(row.propheticPractice) : undefined,
          optionalAction: row.optionalAction,
          optionalReflection: row.optionalReflection,
          moods: [],
        },
      }));
    });
  }

  private async getRecentHistory(mood: Mood, cutoff: number): Promise<Map<string, number>> {
    return this.supabaseData.getRecentHistory(mood, cutoff);
  }

  private weightedRandomSelect(
    scoredAngles: { angle: ContentAngle; score: number }[],
  ): ContentAngle {
    if (scoredAngles.length === 0) throw new Error('Cannot select from empty pool');
    if (scoredAngles.length === 1) return scoredAngles[0].angle;

    const totalScore = scoredAngles.reduce((sum, item) => sum + item.score, 0);
    let random = Math.random() * totalScore;

    for (const item of scoredAngles) {
      random -= item.score;
      if (random <= 0) return item.angle;
    }

    return scoredAngles[0].angle;
  }

  private async recordSelection(angleId: string, mood: Mood): Promise<void> {
    // Look up the contentId from local SQLite (static content)
    const contentId = await dbQuery(async (db) => {
      const angle = await db.getFirstAsync<{ contentId: string }>(
        `SELECT contentId FROM content_angles WHERE id = ?`,
        [angleId],
      );
      return angle?.contentId;
    });

    if (!contentId) return;

    // Record via SupabaseDataService (routes to Supabase or SQLite based on auth)
    await this.supabaseData.recordHistory(contentId, angleId, mood);
  }

  private async buildExperience(angle: ContentAngle): Promise<GuidanceExperience> {
    // Optimization: If content is already pre-fetched (from Supabase), use it immediately
    if (angle.content) {
      const experience: GuidanceExperience = {
        content: angle.content,
        angle: { ...angle }
      };

      return this.enrichExperienceWithSunnah(experience);
    }

    return dbQuery(async (db) => {
      const content = await db.getFirstAsync<ContentRow>(
        `
        SELECT * FROM content WHERE id = ?
      `,
        [angle.contentId],
      );

      if (!content) throw new Error(`Content not found: ${angle.contentId}`);

      const experience: GuidanceExperience = {
        content: {
          id: content.id,
          type: content.type as ContentType,
          primaryText: content.primaryText,
          arabicText: content.arabicText,
          transliteration: content.transliteration,
          englishTranslation: content.englishTranslation || '',
          source: content.source || '',
          audioKey: content.audioKey,
          whyThis: content.whyThis || '',
          propheticPractice: content.propheticPractice
            ? JSON.parse(content.propheticPractice)
            : undefined,
          optionalAction: content.optionalAction,
          optionalReflection: content.optionalReflection,
          moods: [],
        },
        angle: {
          ...angle
        },
      };

      return this.enrichExperienceWithSunnah(experience);
    });
  }

  /**
   * Helper to enrich experience with Sunnah content if the specialized angle 
   * doesn't already have its own action.
   */
  private async enrichExperienceWithSunnah(experience: GuidanceExperience): Promise<GuidanceExperience> {
    const { angle, content } = experience;

    // If there's a relevant Sunnah Dua/Practice, use it as the action
    // CRITICAL: We only use a random Sunnah if the curated angle DOES NOT already have a specific action
    const relevantSunnah = sunnahContentData.filter((d) => d.moods.includes(angle.mood));
    if (!angle.action && relevantSunnah.length > 0) {
      const item = relevantSunnah[Math.floor(Math.random() * relevantSunnah.length)];
      return {
        ...experience,
        angle: {
          ...angle,
          action: item.primaryText,
          actionArabicText: item.arabicText,
          actionTransliteration: item.transliteration,
          actionSource: item.source,
          actionHowTo: item.englishTranslation,
          actionReward: item.whyThis,
          actionAudioKey: item.audioKey,
          actionTranslation: item.translation,
          actionType: item.type,
        },
      };
    }

    // Map action properties from the angle itself if present
    const updatedAngle = {
      ...angle,
      actionHowTo: angle.actionHowTo || angle.actionHowTo,
      actionReward: angle.actionReward || angle.actionReward,
      actionArabicText: angle.actionArabicText || angle.actionArabicText,
      actionTransliteration:
        angle.actionTransliteration || angle.actionTransliteration,
      actionSource: angle.actionSource || angle.actionSource,
    };

    // Determine actionType more intelligently for curated angles
    if (updatedAngle.action) {
      if (updatedAngle.actionType) {
        // Already set by Sunnah injection
      } else if (
        content.type === 'Dua' ||
        content.type === 'Dhikr' ||
        content.type === 'Sunnah Practice'
      ) {
        updatedAngle.actionType = content.type;
      } else if (updatedAngle.actionArabicText) {
        // If there's Arabic text in the action, it's likely a Dua or Dhikr
        updatedAngle.actionType = 'Dua';
      } else if (
        updatedAngle.action.toLowerCase().includes('recite') ||
        updatedAngle.action.toLowerCase().includes('dua')
      ) {
        updatedAngle.actionType = 'Dua';
      } else if (
        updatedAngle.action.toLowerCase().includes('remembrance') ||
        updatedAngle.action.toLowerCase().includes('dhikr')
      ) {
        updatedAngle.actionType = 'Dhikr';
      } else if (
        updatedAngle.action.toLowerCase().includes('practice') ||
        updatedAngle.action.toLowerCase().includes('sunnah')
      ) {
        updatedAngle.actionType = 'Sunnah Practice';
      }
    }

    return {
      ...experience,
      angle: updatedAngle,
    };
  }

  async getGuidanceForStep(contentId: string, angleId: string): Promise<GuidanceExperience | null> {
    const dbReady = await this.ensureDb();
    if (!dbReady) return null;

    try {
      // 1. Try Supabase first
      const cloudAngle = await this.supabaseData.fetchAngleById(angleId);
      if (cloudAngle) {
        const contentAngle: ContentAngle = {
          id: cloudAngle.id,
          contentId: cloudAngle.content_id,
          mood: cloudAngle.mood as Mood,
          angle: cloudAngle.angle,
          angleSource: cloudAngle.angle_source,
          action: cloudAngle.action,
          actionArabicText: cloudAngle.action_arabic_text,
          actionTransliteration: cloudAngle.action_transliteration,
          actionSource: cloudAngle.action_source,
          actionHowTo: cloudAngle.action_how_to,
          actionReward: cloudAngle.action_reward,
          practiceSteps: typeof cloudAngle.practice_steps === 'string'
            ? cloudAngle.practice_steps
            : JSON.stringify(cloudAngle.practice_steps),
          reflection: cloudAngle.reflection,
          content: cloudAngle.content ? {
            id: cloudAngle.content.id,
            type: cloudAngle.content.type as ContentType,
            primaryText: cloudAngle.content.primary_text || '',
            arabicText: cloudAngle.content.arabic_text,
            transliteration: cloudAngle.content.transliteration,
            englishTranslation: cloudAngle.content.english_translation || '',
            source: cloudAngle.content.source || '',
            whyThis: cloudAngle.content.why_this || '',
            propheticPractice: cloudAngle.content.prophetic_practice
              ? (typeof cloudAngle.content.prophetic_practice === 'string'
                ? JSON.parse(cloudAngle.content.prophetic_practice)
                : cloudAngle.content.prophetic_practice)
              : undefined,
            optionalAction: cloudAngle.content.optional_action,
            optionalReflection: cloudAngle.content.optional_reflection,
            audioKey: cloudAngle.content.audio_key,
            moods: [],
          } : undefined,
        };
        return this.buildExperience(contentAngle);
      }

      // 2. Fallback to local SQLite
      const angle = await dbQuery(async (db) => {
        return db.getFirstAsync<any>(`SELECT * FROM content_angles WHERE id = ?`, [angleId]);
      });

      if (!angle) {
        logServiceError('RotationEngine', 'getGuidanceForStep', `Angle not found in any source: ${angleId}`, { angleId });
        return null;
      }

      const contentAngle: ContentAngle = {
        id: angle.id,
        contentId: angle.contentId,
        mood: angle.mood,
        angle: angle.angle,
        angleSource: angle.angleSource,
        action: angle.action,
        actionArabicText: angle.actionArabicText,
        actionTransliteration: angle.actionTransliteration,
        actionSource: angle.actionSource,
        actionHowTo: angle.actionHowTo,
        actionReward: angle.actionReward,
        practiceSteps: angle.practiceSteps,
        reflection: angle.reflection,
      };

      return this.buildExperience(contentAngle);
    } catch (error) {
      logServiceError('RotationEngine', 'getGuidanceForStep', error instanceof Error ? error : new Error(String(error)), { angleId });
      return null;
    }
  }

  async saveReflection(
    contentId: string,
    angleId: string,
    mood: Mood,
    reflection: string,
  ): Promise<void> {
    await dbQuery(async (db) => {
      await db.runAsync(
        `
        INSERT INTO saved_reflections (id, contentId, angleId, mood, reflection, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [
          `reflection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          contentId,
          angleId,
          mood,
          reflection,
          Date.now(),
        ],
      );
    });
  }

  async getSavedReflections(): Promise<
    {
      id: string;
      contentId: string;
      angleId: string;
      mood: string;
      reflection: string;
      timestamp: number;
      primaryText: string;
      source: string;
    }[]
  > {
    return dbQuery(async (db) => {
      const result = await db.getAllAsync(`
        SELECT sr.*, c.primaryText, c.source
        FROM saved_reflections sr
        JOIN content c ON sr.contentId = c.id
        ORDER BY sr.timestamp DESC
      `);

      return result as {
        id: string;
        contentId: string;
        angleId: string;
        mood: string;
        reflection: string;
        timestamp: number;
        primaryText: string;
        source: string;
      }[];
    });
  }
}
