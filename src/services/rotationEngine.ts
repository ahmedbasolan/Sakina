import { Mood, GuidanceExperience, ContentAngle } from '../types';
import { getDatabase, dbQuery } from '../database/schema';
import { FreemiumService } from './freemiumService';
import { sunnahContentData } from '../data/sunnahData';

export class RotationEngine {
  private db: any = null;
  private initPromise: Promise<void> | null = null;
  private freemiumService = FreemiumService.getInstance();

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
      console.error('Failed to initialize database in RotationEngine:', error);
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
      console.error('Database not available');
      return null;
    }

    try {
      // 1. Get all content angles for this mood with their relevance scores
      const availableAngles = await this.getAvailableAngles(mood);

      if (availableAngles.length === 0) {
        console.warn(`No curated content found for mood: ${mood}`);
        return null;
      }

      // 2. Fetch history for the last 7 days to apply penalties
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const history = await this.getRecentHistory(mood, sevenDaysAgo);

      // 3. Score all available angles
      const scoredAngles = availableAngles.map((angle) => {
        let score = (angle as any).relevanceScore || 10;

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

        // Boost for "Favorites" (future proofing)
        // if (favorites.has(angle.id)) score += 10;

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
      console.error('Error getting guidance:', error);
      return null;
    }
  }

  private async getAvailableAngles(mood: Mood): Promise<ContentAngle[]> {
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

      return result.map((row: any) => ({
        id: row.id,
        contentId: row.contentId,
        mood: row.mood,
        angle: row.angle,
        action: row.action,
        reflection: row.reflection,
        relevanceScore: row.relevanceScore, // Attached for scoring

        contentType: row.type as any,
        content: {
          id: row.contentId,
          type: row.type,
          primaryText: row.primaryText,
          arabicText: row.arabicText,
          transliteration: row.transliteration,
          englishTranslation: row.englishTranslation,
          source: row.source,
          audioKey: row.audioKey,
          whyThis: row.whyThis,
          propheticPractice: row.propheticPractice ? JSON.parse(row.propheticPractice) : undefined,
          optionalAction: row.optionalAction,
          optionalReflection: row.optionalReflection,
          moods: [],
        },
      }));
    });
  }

  private async getRecentHistory(mood: Mood, cutoff: number): Promise<Map<string, number>> {
    return dbQuery(async (db) => {
      const historyRows = await db.getAllAsync(
        `
        SELECT contentId, angleId, MAX(timestamp) as lastShown
        FROM user_history
        WHERE mood = ? AND timestamp > ?
        GROUP BY contentId, angleId
      `,
        [mood, cutoff],
      );

      const historyMap = new Map<string, number>();
      (historyRows as any[]).forEach((row) => {
        historyMap.set(`${row.contentId}-${row.angleId}`, row.lastShown);
      });
      return historyMap;
    });
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
    await dbQuery(async (db) => {
      const angle = await db.getFirstAsync<any>(
        `
        SELECT contentId FROM content_angles WHERE id = ?
      `,
        [angleId],
      );

      if (!angle) return;

      await db.runAsync(
        `
        INSERT INTO user_history (id, contentId, angleId, mood, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          angle.contentId,
          angleId,
          mood,
          Date.now(),
        ],
      );
    });
  }

  private async buildExperience(angle: ContentAngle): Promise<GuidanceExperience> {
    return dbQuery(async (db) => {
      const content = await db.getFirstAsync<any>(
        `
        SELECT * FROM content WHERE id = ?
      `,
        [angle.contentId],
      );

      if (!content) throw new Error(`Content not found: ${angle.contentId}`);

      const experience: GuidanceExperience = {
        content: {
          id: content.id,
          type: content.type,
          primaryText: content.primaryText,
          arabicText: content.arabicText,
          transliteration: content.transliteration,
          englishTranslation: content.englishTranslation,
          source: content.source,
          audioKey: content.audioKey,
          whyThis: content.whyThis,
          propheticPractice: content.propheticPractice
            ? JSON.parse(content.propheticPractice)
            : undefined,
          optionalAction: content.optionalAction,
          optionalReflection: content.optionalReflection,
          moods: [],
        },
        angle: {
          id: angle.id,
          contentId: angle.contentId,
          mood: angle.mood,
          angle: angle.angle,
          action: angle.action,
          actionArabicText: (angle as any).actionArabicText,
          actionTransliteration: (angle as any).actionTransliteration,
          actionSource: (angle as any).actionSource,
          actionHowTo: (angle as any).actionHowTo,
          actionReward: (angle as any).actionReward,
          reflection: angle.reflection,
        },
      };

      // If there's a relevant Sunnah Dua/Practice, use it as the action
      // CRITICAL: We only use a random Sunnah if the curated angle DOES NOT already have a specific action
      const relevantSunnah = sunnahContentData.filter((d: any) => d.moods.includes(angle.mood));
      if (!experience.angle.action && relevantSunnah.length > 0) {
        const item = relevantSunnah[Math.floor(Math.random() * relevantSunnah.length)];
        return {
          ...experience,
          angle: {
            ...experience.angle,
            action: item.primaryText,
            actionArabicText: item.arabicText,
            actionTransliteration: item.transliteration,
            actionSource: item.source,
            actionHowTo: item.englishTranslation,
            actionReward: item.whyThis,
            actionAudioKey: item.audioKey,
            actionTranslation: item.translation,
          },
        };
      }

      return experience;
    });
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

  async getSavedReflections(): Promise<any[]> {
    return dbQuery(async (db) => {
      const result = await db.getAllAsync(`
        SELECT sr.*, c.primaryText, c.source
        FROM saved_reflections sr
        JOIN content c ON sr.contentId = c.id
        ORDER BY sr.timestamp DESC
      `);

      return result;
    });
  }
}
