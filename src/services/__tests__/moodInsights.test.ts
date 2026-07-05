/**
 * computeInsights — the trust-critical core behind the Mood History "Insights"
 * cards. These tests exist because the old generator over-claimed: it invented
 * a weekday "pattern" from 2 taps, counted raw taps instead of days, and let
 * 'Guilty' fall through classification entirely. Each test below pins one of
 * those precision guarantees.
 */

import {
  computeInsights,
  HEAVY_MOODS,
  LIGHT_MOODS,
} from '../moodInsights';
import { Mood } from '../../types';

// Fixed "now" so day-age math is deterministic. Weekday of NOW is irrelevant
// because tests that care about weekday grouping use 7-day multiples (same
// weekday regardless of NOW).
const NOW = new Date('2026-07-05T12:00:00');

/** A history row `ageDays` before NOW with the given mood. */
function row(ageDays: number, mood: Mood) {
  const d = new Date(NOW);
  d.setDate(d.getDate() - ageDays);
  return { content_id: 'c', angle_id: 'a', mood, created_at: d.toISOString() };
}

const titles = (rows: ReturnType<typeof row>[], streak = 0) =>
  computeInsights(rows, streak, NOW).map((i) => i.title);
const find = (rows: ReturnType<typeof row>[], title: string, streak = 0) =>
  computeInsights(rows, streak, NOW).find((i) => i.title === title);

describe('computeInsights — classification completeness', () => {
  const ALL_MOODS: Mood[] = [
    'Overwhelmed', 'Sad', 'Angry', 'Tired', 'Lonely',
    'Grateful', 'Hopeful', 'Guilty', 'Calm',
  ];

  it('places every Mood in exactly one bucket (no silent fall-through)', () => {
    for (const m of ALL_MOODS) {
      const inHeavy = HEAVY_MOODS.includes(m);
      const inLight = LIGHT_MOODS.includes(m);
      expect(inHeavy || inLight).toBe(true); // classified somewhere
      expect(inHeavy && inLight).toBe(false); // but never both
    }
  });

  it('classifies Guilty as heavy (the mood the old code ignored)', () => {
    expect(HEAVY_MOODS).toContain('Guilty');
  });
});

describe('computeInsights — empty & thin data', () => {
  it('returns the onboarding card when there is no history', () => {
    expect(titles([])).toEqual(['Start Your Journey']);
  });

  it('never claims a weekday pattern below the sample floor', () => {
    // Two heavy days on the same weekday — enough to trip the OLD n>=2 rule —
    // but only 2 total logged days, far under MIN_DAYS_FOR_PATTERNS.
    const rows = [row(7, 'Sad'), row(14, 'Sad')];
    expect(titles(rows)).not.toContain('Pattern Detected');
  });

  it('shows an honest expectation card, reflecting the real day count', () => {
    const card = find([row(1, 'Sad'), row(2, 'Angry')], 'Building Your Picture');
    expect(card).toBeDefined();
    expect(card!.description).toContain('2 days');
  });
});

describe('computeInsights — day dedup (taps never inflate counts)', () => {
  it('collapses many taps on one day to a single day', () => {
    // 5 Grateful taps, all TODAY. gratefulDays must be 1, so Shukr (≥3 days)
    // must NOT fire. Under the old tap-counting logic this wrongly fired.
    const rows = Array.from({ length: 5 }, () => row(0, 'Grateful' as Mood));
    expect(titles(rows)).not.toContain('Shukr Champion');
  });

  it('counts gratitude by distinct days and reports them verifiably', () => {
    const rows = [0, 1, 2, 3].map((age) => row(age, 'Grateful'));
    const card = find(rows, 'Shukr Champion');
    expect(card).toBeDefined();
    // "4 of your last 4 days" — the user's own numbers, checkable on screen.
    expect(card!.description).toContain('4 of your last 4 days');
  });
});

describe('computeInsights — weekday pattern (rate-based, verifiable)', () => {
  // 3 heavy days on one shared weekday (ages 1/8/15) vs. 5 light days on other
  // weekdays. Heavy baseline 3/8 ≈ 0.375; the shared weekday runs 3/3 = 1.0,
  // clearing baseline + margin. 8 total days clears the pattern floor.
  const rows = [
    row(1, 'Sad'), row(8, 'Angry'), row(15, 'Guilty'), // same weekday, all heavy
    row(2, 'Calm'), row(3, 'Grateful'), row(4, 'Hopeful'),
    row(5, 'Calm'), row(6, 'Grateful'),
  ];

  it('fires only when a weekday genuinely exceeds the baseline', () => {
    const card = find(rows, 'Pattern Detected');
    expect(card).toBeDefined();
    expect(card!.description).toContain('3 of your 3');
  });

  it('states the fact, not a lifelong-sounding "you tend to" claim', () => {
    const card = find(rows, 'Pattern Detected');
    expect(card!.description).not.toMatch(/you tend to/i);
  });

  it('honours Guilty as heavy inside the pattern (old bug: ignored it)', () => {
    // A weekday whose only heavy signal IS Guilt. If Guilt were unclassified
    // (the old bug) heavyTotal would be 0, baseline 0, rate 0/3 → no pattern.
    // The card firing proves Guilt now counts as heavy.
    const guiltRows = [
      row(1, 'Guilty'), row(8, 'Guilty'), row(15, 'Guilty'), // shared weekday
      row(2, 'Calm'), row(3, 'Grateful'), row(4, 'Hopeful'),
      row(5, 'Calm'), row(6, 'Grateful'),
    ];
    expect(find(guiltRows, 'Pattern Detected')).toBeDefined();
  });
});

describe('computeInsights — trend uses days, not fake percentages', () => {
  it('reports lighter-lately as raw day counts and drops causation copy', () => {
    // Prior half (ages 14–27): mostly heavy. Recent half (ages 0–13): mostly light.
    const prior = [14, 16, 18, 20].map((a) => row(a, 'Sad'));
    const recent = [1, 3, 5, 7].map((a) => row(a, 'Grateful'));
    const card = find([...prior, ...recent], 'Lighter Lately');
    expect(card).toBeDefined();
    expect(card!.description).toMatch(/\d+ of \d+ days/);
    expect(card!.description).not.toMatch(/guidance is working/i);
    expect(card!.description).not.toMatch(/\d+%/); // no percentage-point mislabel
  });
});

describe('computeInsights — copy honesty', () => {
  it('never says "this month" (window is a rolling 30 days)', () => {
    const rows = ['Sad', 'Angry', 'Tired', 'Grateful', 'Calm', 'Hopeful', 'Lonely']
      .map((m, i) => row(i, m as Mood));
    for (const insight of computeInsights(rows, 5, NOW)) {
      expect(insight.description).not.toMatch(/this month/i);
    }
  });
});
