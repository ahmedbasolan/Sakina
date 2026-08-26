/**
 * computeStreaks — streak walk with one "mercy day" (rahma) per streak.
 */
jest.mock('../../database/connection', () => ({ dbQuery: jest.fn() }));
// Named `mock*` so jest allows the hoisted factory to close over it.
const mockGetMoodHistory = jest.fn((_s: string, _e: string): Promise<any[]> =>
  Promise.resolve([]),
);
jest.mock('../supabaseDataService', () => ({
  SupabaseDataService: {
    // Delegate rather than capture: jest hoists this factory above the const
    // below, so referencing the spy directly here binds undefined.
    getInstance: () => ({
      getMoodHistory: (...args: any[]) => (mockGetMoodHistory as any)(...args),
    }),
  },
}));

import { computeStats, computeStreaks, moodHistoryService } from '../moodHistoryService';
import { Mood } from '../../types';

// Fixed "now": 2026-07-10 (local midnight-safe).
const NOW = new Date('2026-07-10T12:00:00');
const days = (...d: string[]) => new Set(d);

describe('computeStreaks', () => {
  it('returns 0/0 for no check-ins', () => {
    expect(computeStreaks(days(), NOW)).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it('counts consecutive days ending today', () => {
    const r = computeStreaks(days('2026-07-08', '2026-07-09', '2026-07-10'), NOW);
    expect(r.currentStreak).toBe(3);
    expect(r.longestStreak).toBe(3);
  });

  it('keeps the streak alive when today is not logged yet (anchor yesterday)', () => {
    const r = computeStreaks(days('2026-07-08', '2026-07-09'), NOW);
    expect(r.currentStreak).toBe(2);
  });

  it('mercy day bridges ONE missed day inside the streak', () => {
    // 6th, 7th, (8th missed), 9th, 10th → 4 counted days, gap forgiven
    const r = computeStreaks(days('2026-07-06', '2026-07-07', '2026-07-09', '2026-07-10'), NOW);
    expect(r.currentStreak).toBe(4);
    // longest must never display below current
    expect(r.longestStreak).toBeGreaterThanOrEqual(4);
  });

  it('mercy day applies at the head: yesterday missed, today still open', () => {
    // 7th, 8th, (9th missed), today not yet logged → streak survives at 2
    const r = computeStreaks(days('2026-07-07', '2026-07-08'), NOW);
    expect(r.currentStreak).toBe(2);
  });

  it('only ONE mercy day per streak — a second gap breaks it', () => {
    // (9th missed → mercy), 8th, (7th missed → breaks), 6th
    const r = computeStreaks(days('2026-07-06', '2026-07-08', '2026-07-10'), NOW);
    expect(r.currentStreak).toBe(2); // 10th + bridged 8th
  });

  it('two consecutive missed days end the streak', () => {
    // 10th logged; 9th and 8th both missed
    const r = computeStreaks(days('2026-07-06', '2026-07-07', '2026-07-10'), NOW);
    expect(r.currentStreak).toBe(1);
  });

  it('last check-in 3+ days ago means no living streak', () => {
    const r = computeStreaks(days('2026-07-05', '2026-07-06', '2026-07-07'), NOW);
    expect(r.currentStreak).toBe(0);
    expect(r.longestStreak).toBe(3);
  });

  it('longestStreak still measures strict historical runs', () => {
    const r = computeStreaks(
      days('2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-07-10'),
      NOW,
    );
    expect(r.longestStreak).toBe(4);
    expect(r.currentStreak).toBe(1);
  });
});

// ── computeStats ────────────────────────────────────────────────────
// These exist because `getStats` counted moods per HISTORY ROW while every
// other surface counted them per DAY. `recordHistory` fires on every
// `getGuidance` call — including refreshes, which Pro makes unlimited — so
// eight refreshes on one angry afternoon wrote eight Angry rows. The paid
// Mood Distribution chart and the free "Top Mood" stat read that raw count,
// while the paid Insights deduped to one mood per day, so the two halves of
// the same screen could contradict each other. Each test below pins one
// consequence of counting days.

/** A history row at a given LOCAL date and hour. */
const at = (dateStr: string, mood: Mood, hour = 12) => ({
  content_id: 'c',
  angle_id: 'a',
  mood,
  created_at: new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00`).toISOString(),
});

/** getMoodHistory returns newest-first; mirror that ordering exactly. */
const newestFirst = (rows: ReturnType<typeof at>[]) =>
  [...rows].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

const statsOf = (rows: ReturnType<typeof at>[]) => computeStats(newestFirst(rows), NOW);

describe('computeStats', () => {
  it('returns zeroed stats when there is no history', () => {
    expect(computeStats([], NOW)).toEqual({
      totalDaysTracked: 0,
      currentStreak: 0,
      longestStreak: 0,
      mostCommonMood: null,
      positivePercentage: 0,
      moodCounts: {},
    });
  });

  it('counts a day once however many times guidance was refreshed', () => {
    const s = statsOf([
      at('2026-07-10', 'Angry', 9),
      at('2026-07-10', 'Angry', 10),
      at('2026-07-10', 'Angry', 11),
      at('2026-07-10', 'Angry', 14),
    ]);
    expect(s.moodCounts).toEqual({ Angry: 1 });
    expect(s.totalDaysTracked).toBe(1);
  });

  it('credits a day to its last mood, matching the calendar cell', () => {
    const s = statsOf([
      at('2026-07-10', 'Angry', 9),
      at('2026-07-10', 'Calm', 21),
    ]);
    expect(s.moodCounts).toEqual({ Calm: 1 });
    expect(s.mostCommonMood).toBe('Calm');
  });

  it('never lets one day of refreshes crown the top mood', () => {
    const s = statsOf([
      at('2026-07-08', 'Angry', 9),
      at('2026-07-08', 'Angry', 10),
      at('2026-07-08', 'Angry', 11),
      at('2026-07-08', 'Angry', 12),
      at('2026-07-08', 'Angry', 13),
      at('2026-07-09', 'Grateful'),
      at('2026-07-10', 'Grateful'),
    ]);
    expect(s.mostCommonMood).toBe('Grateful');
    expect(s.moodCounts).toEqual({ Angry: 1, Grateful: 2 });
  });

  it('totals moodCounts to totalDaysTracked, so distribution bars are shares of days', () => {
    const s = statsOf([
      at('2026-07-06', 'Sad', 8),
      at('2026-07-06', 'Sad', 19),
      at('2026-07-07', 'Tired'),
      at('2026-07-08', 'Grateful', 7),
      at('2026-07-08', 'Grateful', 9),
      at('2026-07-08', 'Grateful', 20),
      at('2026-07-09', 'Calm'),
      at('2026-07-10', 'Hopeful'),
    ]);
    const summed = Object.values(s.moodCounts).reduce((a, b) => a + b, 0);
    expect(summed).toBe(s.totalDaysTracked);
    expect(s.totalDaysTracked).toBe(5);
  });

  it('reports positivePercentage as the share of days ending on a light mood', () => {
    const s = statsOf([
      at('2026-07-07', 'Grateful'),
      at('2026-07-08', 'Calm'),
      at('2026-07-09', 'Angry'),
      at('2026-07-10', 'Sad'),
    ]);
    expect(s.positivePercentage).toBe(50);
  });

  it('keeps positivePercentage unmoved by refreshes on a heavy day', () => {
    const s = statsOf([
      at('2026-07-07', 'Grateful'),
      at('2026-07-08', 'Calm'),
      at('2026-07-09', 'Angry', 9),
      at('2026-07-09', 'Angry', 10),
      at('2026-07-09', 'Angry', 11),
      at('2026-07-10', 'Sad'),
    ]);
    expect(s.positivePercentage).toBe(50);
  });

  it('derives the streak from the day set it built', () => {
    const s = statsOf([
      at('2026-07-08', 'Sad'),
      at('2026-07-09', 'Tired'),
      at('2026-07-10', 'Hopeful'),
    ]);
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
  });
});

// ── getStatsAndInsights ─────────────────────────────────────────────
// The Streak screen used to fire THREE history reads per load: getStats and
// getInsights in one Promise.all, and getInsights then awaiting getStats again
// internally because its `precomputedStats` argument was never passed. Two of
// the three were the same full-range query. Stats and insights are now derived
// from a single fetch, which is safe only because computeInsights applies its
// own 30-day window rather than trusting the caller — the second test pins that
// dependency, since widening this fetch must never widen the insight claims.
describe('getStatsAndInsights', () => {
  const ago = (days: number, mood: string) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return { content_id: 'c', angle_id: 'a', mood, created_at: d.toISOString() };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads history once and derives both results from it', async () => {
    mockGetMoodHistory.mockResolvedValue([
      ago(0, 'Grateful'),
      ago(1, 'Grateful'),
      ago(2, 'Calm'),
    ]);

    const { stats, insights } = await moodHistoryService.getStatsAndInsights();

    expect(mockGetMoodHistory).toHaveBeenCalledTimes(1);
    expect(stats.totalDaysTracked).toBe(3);
    expect(insights.length).toBeGreaterThan(0);
  });

  it('keeps insights on their own 30-day window while stats span the full fetch', async () => {
    mockGetMoodHistory.mockResolvedValue([
      ago(0, 'Grateful'),
      ago(1, 'Grateful'),
      ago(200, 'Sad'),
    ]);

    const { stats, insights } = await moodHistoryService.getStatsAndInsights();

    // Stats see all three days...
    expect(stats.totalDaysTracked).toBe(3);
    // ...but the insight copy may only ever speak for the last 30.
    const building = insights.find((i) => i.title === 'Building Your Picture');
    expect(building?.description).toContain('2 days');
  });
});
