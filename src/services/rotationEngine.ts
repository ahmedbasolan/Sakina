/**
 * RotationEngine — guidance selection orchestrator.
 *
 * Responsibilities (and only these):
 *   1. DB lifecycle (ensureDb)
 *   2. Session-level dedup tracking (same angle / Sunnah not shown twice in one session)
 *   3. Scoring: recency penalty + prayer-context boost
 *   4. Weighted-random selection from the top candidate pool
 *   5. Delegating I/O to ContentRepository, SunnahEnricher, ReflectionRepository
 *
 * All content fetching, Sunnah enrichment, and reflection persistence have
 * been extracted into focused collaborators so this class stays <200 lines.
 */

import { Mood, GuidanceExperience, ContentAngle, PrayerContext } from '../types';
import { getDatabase } from '../database/schema';
import { SupabaseDataService } from './supabaseDataService';
import { ContentRepository } from './contentRepository';
import { SunnahEnricher } from './sunnahEnricher';
import { ReflectionRepository, SavedReflection } from './reflectionRepository';
import PrayerTimesService from './prayerTimesService';
import { logDatabaseError, logServiceError } from './errorLoggingService';

export class RotationEngine {
  private static instance: RotationEngine;

  static getInstance(): RotationEngine {
    if (!RotationEngine.instance) {
      RotationEngine.instance = new RotationEngine();
    }
    return RotationEngine.instance;
  }

  // ── Collaborators ────────────────────────────────────────────────────────
  private contentRepo = ContentRepository.getInstance();
  private sunnahEnricher = SunnahEnricher.getInstance();
  private reflectionRepo = ReflectionRepository.getInstance();
  private supabaseData = SupabaseDataService.getInstance();
  private prayerService = PrayerTimesService.getInstance();

  // ── DB lifecycle ─────────────────────────────────────────────────────────
  private db: any = null;
  private initPromise: Promise<void> | null = null;

  // ── Session dedup ────────────────────────────────────────────────────────
  private sessionShownAngles: Set<string> = new Set();
  private sessionShownSunnahIds: Set<string> = new Set();
  private lastSessionMood: string | null = null;

  private constructor() {}

  private async init(): Promise<void> {
    try {
      this.db = await getDatabase();
    } catch (error) {
      logDatabaseError('RotationEngine.init', error instanceof Error ? error : new Error(String(error)));
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

  // ── Public API ───────────────────────────────────────────────────────────

  async getGuidance(mood: Mood): Promise<GuidanceExperience | null> {
    if (!(await this.ensureDb())) {
      logServiceError('RotationEngine', 'getGuidance', 'Database not available', { mood });
      return null;
    }

    try {
      // Fetch angles, history, and prayer context in parallel — independent sources.
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const [availableAngles, history, prayerContext] = await Promise.all([
        this.contentRepo.fetchForMood(mood),
        this.supabaseData.getRecentHistory(mood, sevenDaysAgo),
        this.prayerService.getCurrentPrayerContext(),
      ]);

      if (availableAngles.length === 0) {
        logServiceError('RotationEngine', 'getGuidance', `No content for mood: ${mood}`, { mood });
        return null;
      }

      // Reset session dedup when mood changes.
      if (this.lastSessionMood !== mood) {
        this.sessionShownAngles.clear();
        this.sessionShownSunnahIds.clear();
        this.lastSessionMood = mood;
      }

      const selected = this.selectAngle(availableAngles, history, prayerContext);

      this.sessionShownAngles.add(selected.id);
      if (selected.contentId) {
        await this.supabaseData.recordHistory(selected.contentId, selected.id, mood);
      }

      return this.buildExperience(selected);
    } catch (error) {
      logServiceError('RotationEngine', 'getGuidance', error instanceof Error ? error : new Error(String(error)), { mood });
      return null;
    }
  }

  async getGuidanceForStep(contentId: string, angleId: string): Promise<GuidanceExperience | null> {
    if (!(await this.ensureDb())) return null;

    try {
      const angle = await this.contentRepo.fetchAngleById(angleId);
      if (!angle) {
        logServiceError('RotationEngine', 'getGuidanceForStep', `Angle not found: ${angleId}`, { angleId });
        return null;
      }
      return this.buildExperience(angle);
    } catch (error) {
      logServiceError('RotationEngine', 'getGuidanceForStep', error instanceof Error ? error : new Error(String(error)), { angleId });
      return null;
    }
  }

  /**
   * Fetch hadith content by ID for prefetch before navigation.
   * Delegates to ContentRepository (already encapsulated behind this facade).
   */
  async getHadithContent(contentId: string): Promise<any | null> {
    try {
      return await this.contentRepo.fetchContentById(contentId);
    } catch (error) {
      console.error(`[RotationEngine] getHadithContent(${contentId}) failed:`, error);
      return null;
    }
  }

  async saveReflection(contentId: string, angleId: string, mood: Mood, reflection: string): Promise<void> {
    await this.reflectionRepo.save(contentId, angleId, mood, reflection);
  }

  async getSavedReflections(): Promise<SavedReflection[]> {
    return this.reflectionRepo.getAll();
  }

  // ── Private: scoring + selection ────────────────────────────────────────

  /**
   * Score every candidate, filter session-shown angles, then pick via
   * weighted-random from the top 20% (minimum pool of 5).
   */
  private selectAngle(
    angles: ContentAngle[],
    history: Map<string, number>,
    prayerContext: PrayerContext,
  ): ContentAngle {
    const scored = angles.map((angle) => {
      let score = (angle as any).relevanceScore ?? 10;

      // Recency penalty — soft rotation
      const lastShown = history.get(`${angle.contentId}-${angle.id}`);
      if (lastShown) {
        const days = (Date.now() - lastShown) / 86_400_000;
        if (days < 1) score -= 15;
        else if (days < 3) score -= 10;
        else if (days < 7) score -= 5;
      }

      // Prayer-context boost
      if (angle.content?.prayerContext?.includes(prayerContext)) {
        score += 50;
      }

      return { angle, score: Math.max(1, score) };
    });

    // Session filter — prefer unseen angles; fall back to full set when exhausted.
    const eligible = scored.filter((s) => !this.sessionShownAngles.has(s.angle.id));
    const pool = eligible.length > 0 ? eligible : scored;

    pool.sort((a, b) => b.score - a.score);
    const topN = Math.max(5, Math.ceil(pool.length * 0.2));
    const topPool = pool.slice(0, Math.min(topN, pool.length));

    return this.weightedRandomSelect(topPool);
  }

  private weightedRandomSelect(scored: { angle: ContentAngle; score: number }[]): ContentAngle {
    if (scored.length === 1) return scored[0].angle;
    const total = scored.reduce((s, item) => s + item.score, 0);
    let rand = Math.random() * total;
    for (const item of scored) {
      rand -= item.score;
      if (rand <= 0) return item.angle;
    }
    return scored[0].angle;
  }

  // ── Private: experience construction ────────────────────────────────────

  private async buildExperience(angle: ContentAngle): Promise<GuidanceExperience> {
    let content = angle.content;

    // If content wasn't pre-fetched (SQLite path for getGuidanceForStep),
    // load it now via ContentRepository.
    if (!content) {
      const fetched = await this.contentRepo.fetchContentById(angle.contentId);
      if (!fetched) throw new Error(`Content not found: ${angle.contentId}`);
      content = fetched;
    }

    const draft: GuidanceExperience = { content, angle: { ...angle } };
    const { experience, chosenSunnahKey } = this.sunnahEnricher.enrich(
      draft,
      this.sessionShownSunnahIds,
    );
    if (chosenSunnahKey) this.sessionShownSunnahIds.add(chosenSunnahKey);
    return experience;
  }
}
