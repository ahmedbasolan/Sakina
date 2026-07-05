/**
 * Mood-history insight generation — deliberately DB-free and pure so every
 * claim is unit-testable without a Supabase or SQLite mock (see
 * `__tests__/moodInsights.test.ts`). `moodHistoryService` fetches the rows and
 * hands them here; nothing in this file touches storage or React Native native
 * modules.
 */
import { Mood } from '../types';
import { formatDateYMD } from '../utils/date';

export interface MoodInsight {
  type: 'pattern' | 'trend' | 'streak' | 'tip';
  title: string;
  description: string;
  icon: string; // emoji
}

// ── Mood classification ─────────────────────────────────────────────
// Every Mood in the type MUST live in exactly one bucket. A mood that falls
// through both lists is silently invisible to pattern/trend detection — the
// original bug where 'Guilty' (the heaviest emotion for a spiritual app)
// counted toward nothing. `moodInsights.test.ts` guards completeness.
export const HEAVY_MOODS: Mood[] = ['Overwhelmed', 'Sad', 'Angry', 'Tired', 'Lonely', 'Guilty'];
export const LIGHT_MOODS: Mood[] = ['Grateful', 'Hopeful', 'Calm'];

// ── Insight precision gates ─────────────────────────────────────────
// Thresholds that decide when a claim is honest vs. noise dressed as a
// pattern. Deliberately conservative: an empty insight beats a false one,
// because the user trusts this screen. Tune against real logs.
export const INSIGHT_WINDOW_DAYS = 30;
const MIN_DAYS_FOR_PATTERNS = 7; // below this, no weekday/trend claims — only facts
const MIN_WEEKDAY_SAMPLE = 3; // a weekday needs ≥3 logged days before it can "trend"
const WEEKDAY_HEAVY_MARGIN = 0.25; // its heavy-rate must beat the overall baseline by this
const MIN_WEEKDAY_HEAVY_DAYS = 2; // and rest on ≥2 actual heavy days, never a lone dot
const TREND_HALF_DAYS = 14; // recent window vs. the 14 days before it
const MIN_TREND_DAYS = 4; // each half needs ≥4 logged days to compare
const TREND_MARGIN = 0.2; // light-day rate must shift by this much to call a trend
const EMOTIONAL_AWARENESS_MIN_MOODS = 5;
const GRATITUDE_MIN_DAYS = 3;
const STREAK_MIN_DAYS = 3;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Whole local calendar days between `dateStr` (YYYY-MM-DD) and today. */
function dayAge(dateStr: string, now: Date): number {
  const day = new Date(dateStr + 'T00:00:00').getTime();
  const today = new Date(formatDateYMD(now) + 'T00:00:00').getTime();
  return Math.round((today - day) / 86400000);
}

/**
 * Derive insights from raw mood history — pure and deterministic.
 *
 * Precision contract, in order:
 *  1. Dedup to ONE representative mood per local day (last entry wins). Every
 *     downstream count means "days," never "taps" — re-picking a mood in one
 *     sitting can no longer inflate a "pattern."
 *  2. Weekday / trend claims are gated behind MIN_DAYS_FOR_PATTERNS and use
 *     RATES vs. a baseline, not raw counts, so the day you happen to log most
 *     can't masquerade as your hardest day.
 *  3. Every claim embeds the user's own numbers ("3 of your 4 Saturdays") so
 *     it reads as about-them and stays verifiable. No causation language.
 */
export function computeInsights(
  rows: Array<{ mood: string; created_at: string | number }>,
  currentStreak: number,
  now: Date = new Date(),
): MoodInsight[] {
  // 1. Dedup to one representative mood per LOCAL day. getMoodHistory returns
  //    DESC (newest first); walking it in reverse lets the latest entry of a
  //    day win, matching getStats/getMoodCalendar.
  const dayMood = new Map<string, Mood>();
  for (let i = rows.length - 1; i >= 0; i--) {
    const dateStr = formatDateYMD(new Date(rows[i].created_at));
    dayMood.set(dateStr, rows[i].mood as Mood);
  }

  const days = Array.from(dayMood.entries()).map(([dateStr, mood]) => ({
    dateStr,
    mood,
    dow: new Date(dateStr + 'T00:00:00').getDay(),
    ageDays: dayAge(dateStr, now),
  }));
  const totalDays = days.length;

  if (totalDays === 0) {
    return [{
      type: 'tip',
      title: 'Start Your Journey',
      description:
        'Choose a mood on the home screen to begin. Sakina reads your own patterns back to you — the more days you log, the sharper it sees.',
      icon: '✦',
    }];
  }

  const insights: MoodInsight[] = [];
  const isHeavy = (m: Mood) => HEAVY_MOODS.includes(m);
  const isLight = (m: Mood) => LIGHT_MOODS.includes(m);

  // ── Weekday heavy-mood pattern (gated, rate-based) ────────────────
  if (totalDays >= MIN_DAYS_FOR_PATTERNS) {
    const perDow: Record<number, { total: number; heavy: number }> = {};
    let heavyTotal = 0;
    for (const day of days) {
      const bucket = (perDow[day.dow] ??= { total: 0, heavy: 0 });
      bucket.total++;
      if (isHeavy(day.mood)) {
        bucket.heavy++;
        heavyTotal++;
      }
    }
    const baseline = heavyTotal / totalDays;

    let best: { dow: number; heavy: number; total: number; rate: number } | null = null;
    for (const [dowStr, bucket] of Object.entries(perDow)) {
      if (bucket.total < MIN_WEEKDAY_SAMPLE || bucket.heavy < MIN_WEEKDAY_HEAVY_DAYS) continue;
      const rate = bucket.heavy / bucket.total;
      if (rate >= baseline + WEEKDAY_HEAVY_MARGIN && (best === null || rate > best.rate)) {
        best = { dow: Number(dowStr), heavy: bucket.heavy, total: bucket.total, rate };
      }
    }
    if (best) {
      const dayName = DAY_NAMES[best.dow];
      insights.push({
        type: 'pattern',
        title: 'Pattern Detected',
        description: `On ${best.heavy} of your ${best.total} ${dayName}s in the last 30 days you logged a heavier mood — more than any other day of the week. A little extra rest or dhikr on ${dayName}s may help.`,
        icon: '🔍',
      });
    }
  }

  // ── Recent-vs-prior trend on light days (gated, raw-count copy) ────
  if (totalDays >= MIN_DAYS_FOR_PATTERNS) {
    const recent = days.filter((d) => d.ageDays >= 0 && d.ageDays < TREND_HALF_DAYS);
    const prior = days.filter((d) => d.ageDays >= TREND_HALF_DAYS && d.ageDays < TREND_HALF_DAYS * 2);
    if (recent.length >= MIN_TREND_DAYS && prior.length >= MIN_TREND_DAYS) {
      const recentLight = recent.filter((d) => isLight(d.mood)).length;
      const priorLight = prior.filter((d) => isLight(d.mood)).length;
      const recentRate = recentLight / recent.length;
      const priorRate = priorLight / prior.length;

      if (recentRate >= priorRate + TREND_MARGIN) {
        insights.push({
          type: 'trend',
          title: 'Lighter Lately',
          description: `Lighter moods rose from ${priorLight} of ${prior.length} days two weeks ago to ${recentLight} of ${recent.length} days recently. Whatever you're leaning on — hold onto it.`,
          icon: '📈',
        });
      } else if (priorRate >= recentRate + TREND_MARGIN) {
        insights.push({
          type: 'trend',
          title: 'Be Gentle With Yourself',
          description: `Your last two weeks carried more heavy days (${recent.length - recentLight} of ${recent.length}) than the two before (${prior.length - priorLight} of ${prior.length}). Tests are how Allah raises us — stay close to your dhikr.`,
          icon: '🤲',
        });
      }
    }
  }

  // ── Streak (from computed stats, honest consistency claim) ────────
  if (currentStreak >= STREAK_MIN_DAYS) {
    insights.push({
      type: 'streak',
      title: `${currentStreak}-Day Streak`,
      description: `You've checked in ${currentStreak} days running. The Prophet ﷺ said the most beloved deeds to Allah are the most consistent, even if small.`,
      icon: '🔥',
    });
  }

  // ── Emotional awareness (factual, any tier) ───────────────────────
  const uniqueMoods = new Set(days.map((d) => d.mood));
  if (uniqueMoods.size >= EMOTIONAL_AWARENESS_MIN_MOODS) {
    insights.push({
      type: 'tip',
      title: 'Emotional Awareness',
      description: `You've named ${uniqueMoods.size} different feelings across ${totalDays} days. Knowing your own heart is itself a mercy — the first step to tending it.`,
      icon: '💡',
    });
  }

  // ── Gratitude, counted by DAYS not taps (factual, any tier) ───────
  const gratefulDays = days.filter((d) => d.mood === 'Grateful').length;
  if (gratefulDays >= GRATITUDE_MIN_DAYS) {
    insights.push({
      type: 'tip',
      title: 'Shukr Champion',
      description: `You met ${gratefulDays} of your last ${totalDays} days with gratitude. Allah promises: "If you are grateful, I will surely increase you." [14:7]`,
      icon: '✨',
    });
  }

  // Never render an empty screen: reflect the real day count and set an
  // honest expectation rather than a canned platitude.
  if (insights.length === 0) {
    insights.push({
      type: 'tip',
      title: 'Building Your Picture',
      description: `You've logged ${totalDays} ${totalDays === 1 ? 'day' : 'days'} so far. A few more and Sakina can show real patterns in how your heart moves — not guesses.`,
      icon: '✦',
    });
  }

  return insights.slice(0, 4);
}
