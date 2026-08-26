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
    // The user's own numbers, checkable on screen.
    expect(card!.description).toContain('4 days you checked in, you met 4');
  });

  it('never calls logged days "your last N days" when they are not consecutive', () => {
    // THE BUG: totalDays counts LOGGED days. Four grateful check-ins spread
    // across a month rendered as "4 of your last 4 days" — telling a sporadic
    // user they were grateful every recent day. The old copy passed the test
    // above only because those four ages (0,1,2,3) happen to be consecutive.
    const rows = [0, 9, 18, 27].map((age) => row(age, 'Grateful'));
    const card = find(rows, 'Shukr Champion');
    expect(card).toBeDefined();
    expect(card!.description).not.toMatch(/your last \d+ days/i);
    expect(card!.description).toContain('4 days you checked in');
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

  it('never claims the day beat every other weekday — a tie disproves it', () => {
    // THE BUG: the copy said "more than any other day of the week", but the
    // loop only ranks days that clear MIN_WEEKDAY_SAMPLE/MIN_WEEKDAY_HEAVY_DAYS
    // and breaks ties on `Object.entries` order. Here two weekdays are BOTH
    // 3/3 heavy — both fully qualifying, exactly tied — so whichever is named,
    // the superlative is false about the other.
    const tied = [
      row(1, 'Sad'), row(8, 'Sad'), row(15, 'Sad'), // weekday A, 3/3 heavy
      row(3, 'Tired'), row(10, 'Tired'), row(17, 'Tired'), // weekday B, 3/3 heavy
      row(4, 'Calm'), row(5, 'Grateful'), row(6, 'Hopeful'),
      row(11, 'Calm'), row(12, 'Grateful'),
    ];
    const card = find(tied, 'Pattern Detected');
    expect(card).toBeDefined();
    expect(card!.description).not.toMatch(/more than any other day/i);
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

describe('computeInsights — the 30-day claim is self-enforced', () => {
  it('drops rows outside the window rather than trusting the caller', () => {
    // Every string says "in the last 30 days", so the window has to be applied
    // here — a caller passing a wider range would otherwise make that a lie.
    const rows = [
      ...[0, 1, 2].map((a) => row(a, 'Grateful' as Mood)),
      row(45, 'Sad'), row(60, 'Sad'), // far outside the window
    ];
    const card = find(rows, 'Shukr Champion');
    expect(card).toBeDefined();
    expect(card!.description).toContain('3 days you checked in');
  });

  it('ignores future-dated rows from the caller\'s boundary padding', () => {
    const rows = [...[0, 1, 2].map((a) => row(a, 'Grateful' as Mood)), row(-1, 'Sad')];
    expect(find(rows, 'Shukr Champion')!.description).toContain('3 days you checked in');
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

  it('never quotes a clause of an ayah under a bare ayah number', () => {
    // The gratitude card used to render: Allah promises: "If you are grateful,
    // I will surely increase you." [14:7] — a fragment cited as the whole ayah,
    // dropping "but if you deny, indeed My punishment is severe". CLAUDE.md's
    // "Quoting Quran Text" rule 1 forbids exactly this; rule 3 says swap the
    // verse rather than cut it, which is why the card now carries 2:152 whole.
    const rows = [0, 1, 2, 3].map((age) => row(age, 'Grateful' as Mood));
    const card = find(rows, 'Shukr Champion')!;
    expect(card.description).not.toContain('I will surely increase you');
    expect(card.description).not.toMatch(/\[14:7\]/);
  });
});

// ── Low-sample-size insights ────────────────────────────────────────
// The weekday pattern needs ~3 weeks of history and the trend needs ~4, so a
// new subscriber used to see only a streak card restating the free hero plus
// two raw counts — the paid section was thinnest exactly when the purchase had
// to justify itself. These two are honest at 5 days. They are still GATED:
// firing early is worthless if the claim is noise.

describe('computeInsights — time of day', () => {
  /** A row `ageDays` before NOW at a specific local hour. */
  const at = (ageDays: number, mood: Mood, hour: number) => {
    const d = new Date(NOW);
    d.setDate(d.getDate() - ageDays);
    d.setHours(hour, 0, 0, 0);
    return { content_id: 'c', angle_id: 'a', mood, created_at: d.toISOString() };
  };

  it('names the band most check-ins land in, with the counts behind it', () => {
    const rows = [
      at(1, 'Calm', 19), at(2, 'Hopeful', 20), at(3, 'Calm', 18),
      at(4, 'Hopeful', 19), at(5, 'Calm', 20), at(6, 'Hopeful', 17),
    ];
    const card = find(rows, 'When You Check In');
    expect(card).toBeDefined();
    expect(card!.description).toContain('6 of your 6');
    expect(card!.description).toContain('evening');
  });

  it('stays silent below the day floor', () => {
    const rows = [at(1, 'Calm', 19), at(2, 'Calm', 19), at(3, 'Calm', 19), at(4, 'Calm', 19)];
    expect(titles(rows)).not.toContain('When You Check In');
  });

  it('stays silent when no band dominates — an even spread is not a pattern', () => {
    const rows = [
      at(1, 'Calm', 8), at(2, 'Hopeful', 9), at(3, 'Calm', 10),
      at(4, 'Hopeful', 14), at(5, 'Calm', 15), at(6, 'Hopeful', 13),
      at(7, 'Calm', 19), at(8, 'Hopeful', 20), at(9, 'Calm', 18),
    ];
    expect(titles(rows)).not.toContain('When You Check In');
  });
});

describe('computeInsights — recovery after a heavy day', () => {
  it('counts heavy days whose next calendar day was lighter', () => {
    const rows = [
      row(10, 'Sad'), row(9, 'Grateful'),
      row(8, 'Angry'), row(7, 'Calm'),
      row(6, 'Tired'), row(5, 'Hopeful'),
    ];
    const card = find(rows, 'After the Heavy Days');
    expect(card).toBeDefined();
    expect(card!.description).toContain('3 of the 3');
  });

  it('requires consecutive calendar days, not merely the next day you logged', () => {
    // Heavy on 10/8/6 with the lighter day always TWO days later: no pairs.
    const rows = [
      row(10, 'Sad'), row(8, 'Grateful'),
      row(6, 'Angry'), row(4, 'Calm'),
      row(2, 'Tired'), row(0, 'Hopeful'),
    ];
    expect(titles(rows)).not.toContain('After the Heavy Days');
  });

  it('stays silent when the heavy days mostly did not lift', () => {
    // Reporting "your hard days rarely lift" back to someone is not an insight,
    // it is a verdict. The card is deliberately one-directional.
    const rows = [
      row(10, 'Sad'), row(9, 'Angry'),
      row(8, 'Tired'), row(7, 'Sad'),
      row(6, 'Lonely'), row(5, 'Guilty'),
    ];
    expect(titles(rows)).not.toContain('After the Heavy Days');
  });
});

describe('computeInsights — ranking', () => {
  it('ranks the streak card last: it restates a number the free hero already shows', () => {
    const rows = [
      row(0, 'Grateful'), row(1, 'Grateful'), row(2, 'Grateful'),
      row(3, 'Calm'), row(4, 'Hopeful'), row(5, 'Sad'), row(6, 'Tired'),
    ];
    const list = titles(rows, 7);
    const streakIdx = list.findIndex((t) => t.endsWith('-Day Streak'));
    expect(streakIdx).toBeGreaterThan(-1);
    expect(streakIdx).toBe(list.length - 1);
  });

  it('keeps Shukr Champion ahead of the restatements when cards compete', () => {
    const rows = [
      row(0, 'Grateful'), row(1, 'Grateful'), row(2, 'Grateful'),
      row(3, 'Calm'), row(4, 'Hopeful'), row(5, 'Sad'), row(6, 'Tired'),
    ];
    const list = titles(rows, 7);
    expect(list).toContain('Shukr Champion');
    expect(list.indexOf('Shukr Champion')).toBeLessThan(
      list.findIndex((t) => t.endsWith('-Day Streak')),
    );
  });

  it('never renders more cards than the section can carry', () => {
    const rows = Array.from({ length: 25 }, (_, i) =>
      row(i, (['Grateful', 'Sad', 'Calm', 'Angry', 'Hopeful'] as Mood[])[i % 5]),
    );
    expect(computeInsights(rows, 20, NOW).length).toBeLessThanOrEqual(5);
  });
});

// ── Tier-aware analysis window ──────────────────────────────────────
// Pro browses 90 days of history but its insights used to analyse only 30, so
// the section could stay silent about a pattern sitting in months the user
// could see on the calendar. The window is now passed in. Note the insight
// section is premium-only in the first place — this widens what a subscriber
// gets, it does not hand anything to the free tier.
describe('computeInsights — the window is a parameter, not a constant', () => {
  it('counts days a wider window reaches that the default would drop', () => {
    // Six Tuesdays spread across ~10 weeks: invisible at 30 days, a real
    // sample at 90.
    const rows = [
      // Six distinct moods so Emotional Awareness can form at 90 days.
      row(7, 'Sad'), row(14, 'Angry'), row(21, 'Grateful'),
      row(28, 'Sad'), row(35, 'Calm'), row(42, 'Hopeful'),
      row(49, 'Grateful'), row(56, 'Tired'),
    ];

    const narrow = computeInsights(rows, 0, NOW);
    const wide = computeInsights(rows, 0, NOW, 90);

    // At 30 days only the first four rows survive the filter.
    expect(narrow.find((i) => i.title === 'Building Your Picture')?.description)
      .toContain('4 days');
    // At 90 all eight do, which is what lets a weekday sample form at all.
    expect(wide.find((i) => i.title === 'Emotional Awareness')?.description)
      .toContain('8 days');
  });

  it('states the window it actually used rather than a hardcoded 30', () => {
    const rows = [
      // Multiples of 7 share a weekday: three heavy days on ONE weekday...
      row(7, 'Sad'), row(14, 'Sad'), row(21, 'Sad'),
      // ...against five light days on five OTHER weekdays, all beyond 30 days
      // so the pattern is reachable only with the wider window.
      row(30, 'Calm'), row(31, 'Hopeful'), row(32, 'Grateful'),
      row(33, 'Calm'), row(34, 'Hopeful'),
    ];
    const card = computeInsights(rows, 0, NOW, 90).find(
      (i) => i.title === 'Pattern Detected',
    );
    expect(card).toBeDefined();
    expect(card!.description).toContain('in the last 90 days');
    expect(card!.description).not.toContain('30 days');
  });

  it('keeps the trend on its own two-week halves however wide the window', () => {
    // "Lately" must mean lately. A 90-day window must NOT stretch the trend
    // comparison into 45-day halves — that would be a different claim wearing
    // the same words.
    const rows = [
      row(0, 'Grateful'), row(1, 'Calm'), row(2, 'Hopeful'), row(3, 'Grateful'),
      row(15, 'Sad'), row(16, 'Angry'), row(17, 'Tired'), row(18, 'Lonely'),
    ];
    const card = computeInsights(rows, 0, NOW, 90).find(
      (i) => i.title === 'Lighter Lately',
    );
    expect(card).toBeDefined();
    expect(card!.description).toContain('of 4 days');
  });

  it('falls back to the default when handed a non-finite window', () => {
    const rows = [row(1, 'Grateful'), row(200, 'Sad')];
    const out = computeInsights(rows, 0, NOW, Infinity);
    expect(out.find((i) => i.title === 'Building Your Picture')?.description)
      .toContain('1 day');
  });
});
