import { dbQuery } from '../database/schema';
import { Mood } from '../types';
import { SupabaseDataService } from './supabaseDataService';

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

export interface MoodInsight {
  type: 'pattern' | 'trend' | 'streak' | 'tip';
  title: string;
  description: string;
  icon: string; // emoji
}

const POSITIVE_MOODS: Mood[] = ['Grateful', 'Hopeful', 'Calm'];

// ── Service ─────────────────────────────────────────────────────────
export class MoodHistoryService {
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
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    // We'll fetch the last year of history for stats to avoid huge payloads
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

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
      const d = new Date(row.created_at);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      uniqueDays.add(dateStr);
      dayMoods[dateStr] = row.mood as Mood; // last entry wins
      moodCounts[row.mood] = (moodCounts[row.mood] || 0) + 1;
    }

    const totalDaysTracked = uniqueDays.size;

    // Streak calculation
    const sortedDays = Array.from(uniqueDays).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(today.getTime() - 86400000);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

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

    if (sortedDays.includes(todayStr) || sortedDays.includes(yesterdayStr)) {
      currentStreak = 1;
      const startDay = sortedDays.includes(todayStr) ? todayStr : yesterdayStr;
      let checkDate = new Date(startDay + 'T00:00:00');

      while (true) {
        checkDate = new Date(checkDate.getTime() - 86400000);
        const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (sortedDays.includes(checkStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

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
  async getInsights(): Promise<MoodInsight[]> {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const history = await this.supabaseData.getMoodHistory(startDate, endDate);
    const insights: MoodInsight[] = [];

    if (history.length === 0) {
      insights.push({
        type: 'tip',
        title: 'Start Your Journey',
        description:
          'Select a mood on the home screen to begin tracking your emotional patterns. The more you use it, the better your insights become.',
        icon: '✦',
      });
      return insights;
    }

    const dayOfWeekCounts: Record<number, Record<string, number>> = {};
    for (const row of history) {
      const dow = new Date(row.created_at).getDay();
      if (!dayOfWeekCounts[dow]) dayOfWeekCounts[dow] = {};
      dayOfWeekCounts[dow][row.mood] = (dayOfWeekCounts[dow][row.mood] || 0) + 1;
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const negativeMoods = ['Overwhelmed', 'Sad', 'Angry', 'Tired', 'Lonely'];

    let worstDay = -1;
    let worstDayNegCount = 0;
    for (const [dow, moods] of Object.entries(dayOfWeekCounts)) {
      const negCount = Object.entries(moods)
        .filter(([m]) => negativeMoods.includes(m))
        .reduce((sum, [, c]) => sum + c, 0);
      if (negCount > worstDayNegCount) {
        worstDayNegCount = negCount;
        worstDay = parseInt(dow, 10);
      }
    }

    if (worstDay >= 0 && worstDayNegCount >= 2) {
      insights.push({
        type: 'pattern',
        title: 'Pattern Detected',
        description: `You tend to feel more difficult emotions on ${dayNames[worstDay]}s. Consider scheduling extra self-care or dhikr on these days.`,
        icon: '🔍',
      });
    }

    const twoWeeksAgoMs = Date.now() - 14 * 86400000;
    const recentRows = history.filter((r) => new Date(r.created_at).getTime() >= twoWeeksAgoMs);
    const olderRows = history.filter((r) => new Date(r.created_at).getTime() < twoWeeksAgoMs);

    if (recentRows.length >= 3 && olderRows.length >= 3) {
      const recentPositive = recentRows.filter((r) => POSITIVE_MOODS.includes(r.mood as Mood)).length / recentRows.length;
      const olderPositive = olderRows.filter((r) => POSITIVE_MOODS.includes(r.mood as Mood)).length / olderRows.length;

      if (recentPositive > olderPositive + 0.1) {
        const improvement = Math.round((recentPositive - olderPositive) * 100);
        insights.push({
          type: 'trend',
          title: 'Positive Trend',
          description: `Your positive mood ratio has improved by ${improvement}% compared to the previous weeks. The guidance is working — keep going!`,
          icon: '📈',
        });
      } else if (olderPositive > recentPositive + 0.1) {
        insights.push({
          type: 'trend',
          title: 'Be Gentle With Yourself',
          description:
            'Your recent moods have been heavier than usual. Remember: tests are a sign that Allah wants to elevate you. Stay consistent with your dhikr.',
          icon: '🤲',
        });
      }
    }

    const stats = await this.getStats();
    if (stats.currentStreak >= 3) {
      insights.push({
        type: 'streak',
        title: `${stats.currentStreak}-Day Streak`,
        description: `You've checked in for ${stats.currentStreak} consecutive days. Consistency is key — the Prophet ﷺ said: "The most beloved deeds to Allah are the most consistent, even if small."`,
        icon: '🔥',
      });
    }

    const uniqueMoods = new Set(history.map((r) => r.mood));
    if (uniqueMoods.size >= 5) {
      insights.push({
        type: 'tip',
        title: 'Emotional Awareness',
        description: `You've experienced ${uniqueMoods.size} different moods this month. This awareness is itself an act of wisdom — knowing your heart is the first step to healing it.`,
        icon: '💡',
      });
    }

    const gratefulCount = history.filter((r) => r.mood === 'Grateful').length;
    if (gratefulCount >= 3) {
      insights.push({
        type: 'tip',
        title: 'Shukr Champion',
        description: `You've felt grateful ${gratefulCount} times this month. Allah promises: "If you are grateful, I will surely increase you." [14:7]`,
        icon: '✨',
      });
    }

    return insights.slice(0, 4);
  }
}

export const moodHistoryService = new MoodHistoryService();
