/**
 * computeStreaks — streak walk with one "mercy day" (rahma) per streak.
 */
jest.mock('../../database/connection', () => ({ dbQuery: jest.fn() }));
jest.mock('../supabaseDataService', () => ({
  SupabaseDataService: { getInstance: () => ({}) },
}));

import { computeStreaks } from '../moodHistoryService';

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
