import { dbQuery } from '../database/connection';
import { Mood } from '../types';
import { SupabaseDataService } from './supabaseDataService';
import { formatDateYMD, subtractDays } from '../utils/date';
import {
  computeInsights,
  INSIGHT_WINDOW_DAYS,
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

    if (history.length === 0) {
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
    const moodCounts: Record<string, number> = {};

    // Process ASC to let later entries win for dayMoods
    for (let i = history.length - 1; i >= 0; i--) {
      const row = history[i];
      const dateStr = formatDateYMD(new Date(row.created_at));
      uniqueDays.add(dateStr);
      dayMoods[dateStr] = row.mood as Mood; // last entry wins
      moodCounts[row.mood] = (moodCounts[row.mood] || 0) + 1;
    }

    const totalDaysTracked = uniqueDays.size;

    // Streak calculation — one mercy day per streak (see computeStreaks).
    const { currentStreak, longestStreak } = computeStreaks(uniqueDays);

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

  /**
   * Generate insights based on mood history patterns.
   */
  async getInsights(precomputedStats?: MoodStats): Promise<MoodInsight[]> {
    const now = new Date();
    // Extend the window by a day on each side so entries near local midnight
    // aren't clipped by the UTC boundary; computeInsights re-buckets by local
    // calendar day. Mirrors getStats().
    const endDate = new Date(now.getTime() + 86400000).toISOString();
    const startDate = new Date(now.getTime() - INSIGHT_WINDOW_DAYS * 86400000).toISOString();

    const history = await this.supabaseData.getMoodHistory(startDate, endDate);

    // Reuse pre-computed stats if the caller already has them to avoid a
    // redundant full-table Supabase fetch for the streak figure.
    const stats = precomputedStats ?? await this.getStats();

    return computeInsights(history, stats.currentStreak, now);
  }
}

export const moodHistoryService = new MoodHistoryService();
