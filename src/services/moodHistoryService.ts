import { dbQuery } from '../database/connection';
import { Mood } from '../types';
import { SupabaseDataService } from './supabaseDataService';
import { formatDateYMD, subtractDays } from '../utils/date';
import {
  computeInsights,
  LIGHT_MOODS,
  MoodInsight,
} from './moodInsights';

// Re-export so existing consumers (the calendar screen) keep importing the
// insight type from moodHistoryService.
export type { MoodInsight };

// ── Types ───────────────────────────────────────────────────────────
export interface MoodDayEntry {
  date: string; // YYYY-MM-DD
  mood: Mood;
  timestamp: number;
  angleId: string;
  contentId: string;
}

export interface MoodDayDetail {
  date: string;
  mood: Mood;
  entries: Array<{
    timestamp: number;
    mood: Mood;
    angleId: string;
    contentId: string;
    contentSource?: string;
    arabicText?: string;
    englishTranslation?: string;
    reflection?: string;
    reflectionText?: string; // User's saved reflection
  }>;
}

export interface MoodStats {
  totalDaysTracked: number;
  currentStreak: number;
  longestStreak: number;
  mostCommonMood: Mood | null;
  positivePercentage: number;
  moodCounts: Record<string, number>;
}

// LIGHT_MOODS is the canonical "positive" bucket; getStats' positive-day math
// reuses it so classification lives in exactly one place (moodInsights.ts).
const POSITIVE_MOODS: Mood[] = LIGHT_MOODS;

/**
 * Streak calculation with one "mercy day" (rahma): a single missed day never
 * breaks the living streak — the chain bridges one gap, once per streak, so a
 * hard day is met with grace instead of a zero. Two consecutive missed days
 * still end it. Exported pure for direct unit testing.
 */
export function computeStreaks(
  daySet: Set<string>,
  now: Date = new Date(),
): { currentStreak: number; longestStreak: number } {
  const sortedDays = Array.from(daySet).sort();

  let longestStreak = 0;
  let tempStreak = sortedDays.length > 0 ? 1 : 0;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1] + 'T00:00:00');
    const curr = new Date(sortedDays[i] + 'T00:00:00');
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  const todayStr = formatDateYMD(now);
  const yesterdayStr = formatDateYMD(subtractDays(now, 1));

  // Anchor the living streak: today, else yesterday (today simply not logged
  // yet — not a miss), else the day before yesterday via the mercy day
  // (yesterday was missed; the chain holds while today is still open).
  let currentStreak = 0;
  let mercyUsed = false;
  let anchor: string | null = null;
  if (daySet.has(todayStr)) {
    anchor = todayStr;
  } else if (daySet.has(yesterdayStr)) {
    anchor = yesterdayStr;
  } else {
    const dayBefore = formatDateYMD(subtractDays(now, 2));
    if (daySet.has(dayBefore)) {
      anchor = dayBefore;
      mercyUsed = true;
    }
  }

  if (anchor) {
    currentStreak = 1;
    let checkDate = new Date(anchor + 'T00:00:00');
    while (true) {
      checkDate = subtractDays(checkDate, 1);
      if (daySet.has(formatDateYMD(checkDate))) {
        currentStreak++;
        continue;
      }
      if (!mercyUsed) {
        const beyond = subtractDays(checkDate, 1);
        if (daySet.has(formatDateYMD(beyond))) {
          mercyUsed = true;
          checkDate = beyond;
          currentStreak++; // count the day on the far side of the gap
          continue;
        }
      }
      break;
    }
  }

  // A mercy-bridged current streak can exceed the strict-consecutive longest;
  // never display current > longest.
  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak };
}

/**
 * Reduce raw mood-history rows to the MoodStats the Streak screen renders.
 * Exported pure for direct unit testing (see `__tests__/moodHistoryService.test.ts`).
 *
 * `rows` arrive newest-first from `getMoodHistory`.
 */
export function computeStats(
  rows: Array<{ mood: string; created_at: string | number }>,
  now: Date = new Date(),
): MoodStats {
  if (rows.length === 0) {
    return {
      totalDaysTracked: 0,
      currentStreak: 0,
      longestStreak: 0,
      mostCommonMood: null,
      positivePercentage: 0,
      moodCounts: {},
    };
  }

  const uniqueDays = new Set<string>();
  const dayMoods: Record<string, Mood> = {};

  // Process ASC to let later entries win for dayMoods
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const dateStr = formatDateYMD(new Date(row.created_at));
    uniqueDays.add(dateStr);
    dayMoods[dateStr] = row.mood as Mood; // last entry wins
  }

  // Count DAYS, not rows. `recordHistory` fires on every `getGuidance` call
  // (rotationEngine.ts) — including refreshes, which Pro makes unlimited — so
  // counting rows let eight refreshes on one angry afternoon read as eight
  // Angry days. That fed both the free "Top Mood" stat and the paid Mood
  // Distribution bars, while the paid Insights already deduped to one mood per
  // day (see computeInsights' precision contract), so the two halves of the
  // Streak screen could contradict each other — and the distortion grew with
  // the very feature the user had paid for. Deriving from `dayMoods` also
  // guarantees the bars sum to totalDaysTracked, which is what makes the
  // chart's percentages honest shares rather than shares of taps.
  const moodCounts: Record<string, number> = {};
  for (const mood of Object.values(dayMoods)) {
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  }

  const totalDaysTracked = uniqueDays.size;

  // Streak calculation — one mercy day per streak (see computeStreaks).
  const { currentStreak, longestStreak } = computeStreaks(uniqueDays, now);

  const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
  const mostCommonMood = sortedMoods.length > 0 ? (sortedMoods[0][0] as Mood) : null;

  let positiveDays = 0;
  for (const dateStr of Object.keys(dayMoods)) {
    if (POSITIVE_MOODS.includes(dayMoods[dateStr])) {
      positiveDays++;
    }
  }
  const positivePercentage =
    totalDaysTracked > 0 ? Math.round((positiveDays / totalDaysTracked) * 100) : 0;

  return {
    totalDaysTracked,
    currentStreak,
    longestStreak,
    mostCommonMood,
    positivePercentage,
    moodCounts,
  };
}

// ── Service ─────────────────────────────────────────────────────────
class MoodHistoryService {
  private supabaseData = SupabaseDataService.getInstance();

  /**
   * Get one mood entry per day for the given month (year, monthIndex 0-based).
   * Uses the LAST mood entry of each day as the representative.
   */
  async getMoodCalendar(year: number, month: number): Promise<Record<string, MoodDayEntry>> {
    const startOfMonth = new Date(year, month, 1).toISOString();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

    const history = await this.supabaseData.getMoodHistory(startOfMonth, endOfMonth);

    // Group by date, keep last entry per day (getMoodHistory returns DESC order)
    const byDate: Record<string, MoodDayEntry> = {};
    // Process in reverse (ASC) to let later entries win
    for (let i = history.length - 1; i >= 0; i--) {
      const row = history[i];
      const d = new Date(row.created_at);
      const dateStr = formatDateYMD(d);
      byDate[dateStr] = {
        date: dateStr,
        mood: row.mood as Mood,
        timestamp: d.getTime(),
        angleId: row.angle_id,
        contentId: row.content_id,
      };
    }
    return byDate;
  }

  /**
   * Get detailed info for a specific day including content and reflections.
   */
  async getDayDetail(dateStr: string): Promise<MoodDayDetail | null> {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    const startOfDay = new Date(year, month, day).toISOString();
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999).toISOString();

    const history = await this.supabaseData.getMoodHistory(startOfDay, endOfDay);
    if (history.length === 0) return null;

    // Fetch static content and user reflections from local SQLite for these entries
    return dbQuery(async (db) => {
      // 1. Fetch static content info
      const contentInfo: Record<string, { source: string; arabicText: string; englishTranslation: string }> = {};
      const anglesInfo: Record<string, { reflection: string }> = {};

      const contentIds = [...new Set(history.map(h => h.content_id))];
      const angleIds = [...new Set(history.map(h => h.angle_id))];

      if (contentIds.length > 0) {
        const placeholders = contentIds.map(() => '?').join(',');
        const cRows = await db.getAllAsync<{ id: string; source: string; arabicText: string; englishTranslation: string }>(
          `SELECT id, source, arabicText, englishTranslation FROM content WHERE id IN (${placeholders})`,
          contentIds,
        );
        cRows.forEach(r => contentInfo[r.id] = r);
      }

      if (angleIds.length > 0) {
        const placeholders = angleIds.map(() => '?').join(',');
        const aRows = await db.getAllAsync<{ id: string; reflection: string }>(
          `SELECT id, reflection FROM content_angles WHERE id IN (${placeholders})`,
          angleIds,
        );
        aRows.forEach(r => anglesInfo[r.id] = r);
      }

      // 2. Fetch user reflections from local SQLite (Privacy policy: always local)
      const startMs = new Date(year, month, day).getTime();
      const endMs = new Date(year, month, day, 23, 59, 59, 999).getTime();

      const reflections = await db.getAllAsync<{ angleId: string; reflection: string }>(
        `SELECT angleId, reflection FROM saved_reflections 
         WHERE timestamp >= ? AND timestamp <= ?`,
        [startMs, endMs],
      );

      const reflectionMap = new Map<string, string>();
      for (const r of reflections) {
        reflectionMap.set(r.angleId, r.reflection);
      }

      // 3. Combine
      const entries = history.map((row) => {
        const timestamp = new Date(row.created_at).getTime();
        const ci = contentInfo[row.content_id];
        const ai = anglesInfo[row.angle_id];

        return {
          timestamp,
          mood: row.mood as Mood,
          angleId: row.angle_id,
          contentId: row.content_id,
          contentSource: ci?.source,
          arabicText: ci?.arabicText,
          englishTranslation: ci?.englishTranslation,
          reflection: ai?.reflection,
          reflectionText: reflectionMap.get(row.angle_id),
        };
      });

      return {
        date: dateStr,
        mood: entries[0].mood,
        entries,
      };
    });
  }

  /**
   * Compute stats from all history data.
   */
  async getStats(): Promise<MoodStats> {
    // Extend window by 1 day on each side so entries near local midnight are
    // never cut off by a UTC boundary mismatch (max timezone offset is ±14 h).
    // formatDateYMD then attributes each entry to the correct LOCAL calendar day.
    const endDate = new Date(Date.now() + 86400000).toISOString();
    const startDate = new Date(Date.now() - 366 * 86400000).toISOString();

    const history = await this.supabaseData.getMoodHistory(startDate, endDate);

    return computeStats(history);
  }

  /**
   * Stats AND insights from a SINGLE history read — what the Streak screen
   * should call.
   *
   * It used to call getStats() and getInsights() side by side in a Promise.all,
   * and getInsights() then awaited getStats() again internally because nothing
   * ever passed its `precomputedStats` argument: three reads per screen open,
   * two of them the identical full-range query, on the most-opened tab.
   *
   * Handing the full-range rows to computeInsights is safe ONLY because it
   * applies its own INSIGHT_WINDOW_DAYS filter instead of trusting its caller
   * ("the 30-day claim is self-enforced" in moodInsights.test.ts). If that ever
   * changes, this method starts making 30-day copy speak for a year of data.
   */
  /**
   * @param insightWindowDays How far back insights may analyse. The caller
   *   passes the tier history window so a subscriber's insights cover the same
   *   span their calendar opens; omitted, computeInsights uses its own default.
   */
  async getStatsAndInsights(
    insightWindowDays?: number,
  ): Promise<{ stats: MoodStats; insights: MoodInsight[] }> {
    const now = new Date();
    // Same padded full-range window getStats uses; see there for the ±1 day.
    const endDate = new Date(now.getTime() + 86400000).toISOString();
    const startDate = new Date(now.getTime() - 366 * 86400000).toISOString();

    const history = await this.supabaseData.getMoodHistory(startDate, endDate);

    const stats = computeStats(history, now);
    const insights = computeInsights(history, stats.currentStreak, now, insightWindowDays);
    return { stats, insights };
  }

  // There is deliberately no standalone getInsights(). It existed with an
  // optional `precomputedStats` argument that no caller ever passed, so every
  // call silently ran a second full-range read on top of its own — the triple
  // fetch getStatsAndInsights now replaces. Anything needing insights should
  // take them from getStatsAndInsights rather than reintroduce that shape.
}

export const moodHistoryService = new MoodHistoryService();
