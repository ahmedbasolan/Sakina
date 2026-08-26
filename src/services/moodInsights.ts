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
  /**
   * MaterialCommunityIcons glyph name — NOT an emoji. Emoji rendered through
   * a <Text> render per-platform and clashed with the app's icon set; the
   * insight cards are the one place they had survived.
   */
  icon: string;
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

// Low-sample gates. The weekday pattern needs ~3 weeks of history and the
// trend ~4, which left a brand-new subscriber with nothing but restatements.
// These two are honest at 5 days — still gated, because firing early is
// worthless if the claim is noise.
const MIN_TIME_OF_DAY_DAYS = 5; // below this, when you check in is not a habit yet
const MIN_TIME_BAND_DAYS = 3; // the winning band must rest on ≥3 real days
const TIME_BAND_SHARE = 0.4; // and hold ≥40% of them, well clear of an even 25% spread
const MIN_RECOVERY_PAIRS = 3; // heavy day + next calendar day both logged
const MIN_RECOVERY_LIFTED = 2;
const RECOVERY_SHARE = 0.5;

// At most this many cards. Was 4, which dropped Shukr Champion — the warmest
// card — first whenever everything qualified.
const MAX_CARDS = 5;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Coarse enough that a check-in an hour either side lands in the same band.
// `night` wraps midnight, which is why this is a function and not a range map.
function bandOfHour(hour: number): string {
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 16) return 'afternoon';
  if (hour >= 17 && hour <= 20) return 'evening';
  return 'night';
}

/** The local calendar day after `dateStr` (YYYY-MM-DD). */
function nextDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return formatDateYMD(d);
}

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
  /**
   * How many days back to analyse. Defaults to INSIGHT_WINDOW_DAYS; a paid
   * caller passes its wider browse window so the insights speak for the same
   * span the calendar will actually open. Non-finite falls back to the
   * default — "the last Infinity days" is not a sentence, and an unbounded
   * window would silently let a year of data answer a "lately" question.
   */
  windowDays: number = INSIGHT_WINDOW_DAYS,
): MoodInsight[] {
  const window = Number.isFinite(windowDays) ? windowDays : INSIGHT_WINDOW_DAYS;
  // 1. Dedup to one representative mood per LOCAL day. getMoodHistory returns
  //    DESC (newest first); walking it in reverse lets the latest entry of a
  //    day win, matching getStats/getMoodCalendar.
  // Keeps the representative row itself, not just its mood: the time-of-day
  // card needs that day’s hour, and it must be the SAME entry the mood came
  // from or the two would describe different check-ins.
  const dayMood = new Map<string, { mood: Mood; at: string | number }>();
  for (let i = rows.length - 1; i >= 0; i--) {
    const dateStr = formatDateYMD(new Date(rows[i].created_at));
    dayMood.set(dateStr, { mood: rows[i].mood as Mood, at: rows[i].created_at });
  }

  // Apply the window HERE rather than trusting the caller. The weekday string
  // below names `window` explicitly, so the filter that makes it true has to live
  // next to the claim — `moodHistoryService` deliberately over-fetches by a day
  // on each side to survive the UTC boundary, and a future-dated row (ageDays
  // < 0) would otherwise inflate totalDays and could enter a weekday pattern.
  const days = Array.from(dayMood.entries())
    .map(([dateStr, entry]) => ({
      dateStr,
      mood: entry.mood,
      dow: new Date(dateStr + 'T00:00:00').getDay(),
      hour: new Date(entry.at).getHours(),
      ageDays: dayAge(dateStr, now),
    }))
    .filter((d) => d.ageDays >= 0 && d.ageDays < window);
  const totalDays = days.length;

  if (totalDays === 0) {
    return [{
      type: 'tip',
      title: 'Start Your Journey',
      description:
        'Choose a mood on the home screen to begin. Sakina reads your own patterns back to you — the more days you log, the sharper it sees.',
      icon: 'star-outline',
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
      // The copy may only claim what the loop above actually established: this
      // day's heavy RATE beat the pooled baseline. It must NOT claim the day
      // beat every other weekday — days under MIN_WEEKDAY_SAMPLE never entered
      // the comparison at all, and an exact tie between two qualifying days
      // resolves to whichever `Object.entries` yielded first. Both cases used
      // to render as "more than any other day of the week", which was false.
      // (rate > pooled baseline does imply rate > the rest combined, since the
      // baseline is a weighted mean that includes this day — so the weaker
      // claim below is safe.)
      insights.push({
        type: 'pattern',
        title: 'Pattern Detected',
        description: `On ${best.heavy} of your ${best.total} ${dayName}s in the last ${window} days you logged a heavier mood — more often than on your other days. A little extra rest or dhikr on ${dayName}s may help.`,
        icon: 'calendar',
      });
    }
  }

  // ── Recovery: did a heavy day lift the next day? (low sample) ──────
  // Deliberately ONE-DIRECTIONAL. The mirror claim — "your hard days rarely
  // lift" — is a verdict, not an insight, and this screen is opened by people
  // having a bad week. Silence is the correct output there; the trend card
  // above already carries the gentle version of bad news.
  //
  // Pairs are CONSECUTIVE CALENDAR DAYS, not "the next day you happened to log".
  // A heavy Monday followed by a logged Friday says nothing about recovery, and
  // counting it would let sparse logging manufacture the pattern.
  {
    const moodByDay = new Map(days.map((d) => [d.dateStr, d.mood]));
    let pairs = 0;
    let lifted = 0;
    for (const day of days) {
      if (!isHeavy(day.mood)) continue;
      const after = moodByDay.get(nextDay(day.dateStr));
      if (!after) continue;
      pairs++;
      if (isLight(after)) lifted++;
    }
    if (
      pairs >= MIN_RECOVERY_PAIRS &&
      lifted >= MIN_RECOVERY_LIFTED &&
      lifted / pairs >= RECOVERY_SHARE
    ) {
      insights.push({
        type: 'trend',
        title: 'After the Heavy Days',
        description: `${lifted} of the ${pairs} times you logged a heavy day and checked in again the next day, that next day was lighter. Allah says: "For indeed, with hardship will be ease. Indeed, with hardship will be ease." [Surah Ash-Sharh 94:5-6]`,
        icon: 'white-balance-sunny',
      });
    }
  }

  // ── Time of day (low sample) ───────────────────────────────────────
  // Rate-based against a 4-band spread, same discipline as the weekday check:
  // the winning band must hold ≥40% of days, so an even spread across bands
  // (~25% each) never reads as a habit.
  if (totalDays >= MIN_TIME_OF_DAY_DAYS) {
    const perBand: Record<string, number> = {};
    for (const day of days) {
      const band = bandOfHour(day.hour);
      perBand[band] = (perBand[band] || 0) + 1;
    }
    let top: { band: string; count: number } | null = null;
    for (const [band, count] of Object.entries(perBand)) {
      if (top === null || count > top.count) top = { band, count };
    }
    if (
      top &&
      top.count >= MIN_TIME_BAND_DAYS &&
      top.count / totalDays >= TIME_BAND_SHARE
    ) {
      insights.push({
        type: 'pattern',
        title: 'When You Check In',
        description: `${top.count} of your ${totalDays} check-ins came in the ${top.band}. That is when you reach for this most — worth keeping a quiet moment there.`,
        icon: 'clock-outline',
      });
    }
  }
  // ── Recent-vs-prior trend on light days (gated, raw-count copy) ────
  // TREND_HALF_DAYS is deliberately NOT derived from `window`. "Lately" has to
  // keep meaning lately: widening the analysis window to 90 must not stretch
  // this into 45-day halves, which would be a different claim wearing the same
  // words ("your last two weeks").
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
          icon: 'trending-up',
        });
      } else if (priorRate >= recentRate + TREND_MARGIN) {
        insights.push({
          type: 'trend',
          title: 'Be Gentle With Yourself',
          description: `Your last two weeks carried more heavy days (${recent.length - recentLight} of ${recent.length}) than the two before (${prior.length - priorLight} of ${prior.length}). Tests are how Allah raises us — stay close to your dhikr.`,
          icon: 'heart-half-full',
        });
      }
    }
  }



  // ── Gratitude, counted by DAYS not taps (factual, any tier) ───────
  const gratefulDays = days.filter((d) => d.mood === 'Grateful').length;
  if (gratefulDays >= GRATITUDE_MIN_DAYS) {
    insights.push({
      type: 'tip',
      title: 'Shukr Champion',
      // "your last N days" was wrong: totalDays counts LOGGED days, not calendar
      // days, so 4 grateful check-ins spread over a month read as "4 of your
      // last 4 days". And the old 14:7 line quoted one clause of the ayah under
      // a bare [14:7] — the banned pattern in CLAUDE.md's "Quoting Quran Text",
      // dropping "but if you deny, indeed My punishment is severe". Per rule 3
      // the verse is swapped rather than cut: 2:152 is complete here, is short
      // enough for a card, and is already the app's own `quran_2_152` wording.
      description: `Of the ${totalDays} days you checked in, you met ${gratefulDays} with gratitude. Allah says: "So remember Me; I will remember you. And be grateful to Me, and do not be ungrateful to Me." [Surah Al-Baqarah 2:152]`,
      icon: 'hand-heart',
    });
  }

  // ── Emotional awareness (factual, any tier) ───────────────────────
  const uniqueMoods = new Set(days.map((d) => d.mood));
  if (uniqueMoods.size >= EMOTIONAL_AWARENESS_MIN_MOODS) {
    insights.push({
      type: 'tip',
      title: 'Emotional Awareness',
      description: `You've named ${uniqueMoods.size} different feelings across ${totalDays} days. Knowing your own heart is itself a mercy — the first step to tending it.`,
      icon: 'lightbulb-on-outline',
    });
  }
  // ── Streak — LAST on purpose ──────────────────────────────────────
  // The hero card at the top of this same screen already shows the streak
  // number, for free. This card therefore earns its slot only when nothing
  // more specific qualified, which is exactly what ranking it last achieves:
  // with MAX_CARDS cards to fill, a user with real patterns never sees the
  // restatement, and a user with none gets it instead of an empty section.
  if (currentStreak >= STREAK_MIN_DAYS) {
    insights.push({
      type: 'streak',
      title: `${currentStreak}-Day Streak`,
      description: `You've checked in ${currentStreak} days running. The Prophet ﷺ was asked which deeds Allah loves most; he said: "The most regular constant deeds even though they may be few." [Bukhari 6465]`,
      icon: 'fire',
    });
  }
  // Never render an empty screen: reflect the real day count and set an
  // honest expectation rather than a canned platitude.
  if (insights.length === 0) {
    insights.push({
      type: 'tip',
      title: 'Building Your Picture',
      description: `You've logged ${totalDays} ${totalDays === 1 ? 'day' : 'days'} so far. A few more and Sakina can show real patterns in how your heart moves — not guesses.`,
      icon: 'star-outline',
    });
  }

  return insights.slice(0, MAX_CARDS);
}
