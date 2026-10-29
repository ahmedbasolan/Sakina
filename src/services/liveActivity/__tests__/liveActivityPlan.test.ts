import {
  decide,
  nextDueAt,
  MAX_ACTIVE_S,
  MARGIN_S,
  ScheduledPrayer,
} from '../../../../supabase/functions/_shared/liveActivityPlan';

// A fixed UTC day; every instant below is epoch seconds, read as a clock time.
const DAY = Date.UTC(2026, 9, 29) / 1000;
const at = (h: number, m = 0): number => DAY + h * 3600 + m * 60;

const F: ScheduledPrayer = { name: 'Fajr', at: at(5, 0) };
const D: ScheduledPrayer = { name: 'Dhuhr', at: at(12, 15) };
const A: ScheduledPrayer = { name: 'Asr', at: at(15, 40) };
const M: ScheduledPrayer = { name: 'Maghrib', at: at(18, 20) };
const I: ScheduledPrayer = { name: 'Isha', at: at(19, 45) };
const NEXT_F: ScheduledPrayer = { name: 'Fajr', at: at(24 + 5, 0) };
const NEXT_D: ScheduledPrayer = { name: 'Dhuhr', at: at(24 + 12, 15) };

const SCHEDULE = [F, D, A, M, I, NEXT_F, NEXT_D];

describe('decide', () => {
  it('updates silently when the next prayer fits under the cap', () => {
    // Card started at Dhuhr: cap = 12:15 + 8h - 10min = 20:05, Maghrib 18:20 fits.
    const state = { startedAt: D.at, lastActedPrayerAt: D.at };
    expect(decide(state, SCHEDULE, A.at, true)).toEqual([{ kind: 'update', next: M }]);
  });

  it('restarts at a prayer when the next one would pass the cap', () => {
    // Card started at Fajr: cap = 12:50, Asr 15:40 is past it.
    const state = { startedAt: F.at, lastActedPrayerAt: F.at };
    expect(decide(state, SCHEDULE, D.at, true)).toEqual([
      { kind: 'end' },
      { kind: 'start', next: A },
    ]);
  });

  it('never starts off a prayer time', () => {
    const state = { startedAt: null, lastActedPrayerAt: D.at };
    expect(decide(state, SCHEDULE, at(14, 0), true)).toEqual([]);
  });

  it('ends at the cap overnight and starts at Fajr', () => {
    const live = { startedAt: I.at, lastActedPrayerAt: I.at };
    expect(decide(live, SCHEDULE, I.at + 7 * 3600 + 50 * 60, true)).toEqual([{ kind: 'end' }]);

    const none = { startedAt: null, lastActedPrayerAt: I.at };
    expect(decide(none, SCHEDULE, NEXT_F.at, true)).toEqual([{ kind: 'start', next: NEXT_D }]);
  });

  it('a run 40 minutes late does not start a card', () => {
    const late = A.at + 40 * 60;
    const none = { startedAt: null, lastActedPrayerAt: D.at };
    expect(decide(none, SCHEDULE, late, true)).toEqual([]);

    // With a live card the cap allows, it still updates, to Maghrib and never Asr.
    const live = { startedAt: D.at, lastActedPrayerAt: D.at };
    expect(decide(live, SCHEDULE, late, true)).toEqual([{ kind: 'update', next: M }]);
  });

  it('pro lapse ends a live card and starts nothing', () => {
    const live = { startedAt: D.at, lastActedPrayerAt: D.at };
    expect(decide(live, SCHEDULE, A.at, false)).toEqual([{ kind: 'end' }]);

    const none = { startedAt: null, lastActedPrayerAt: D.at };
    expect(decide(none, SCHEDULE, A.at, false)).toEqual([]);
  });

  it('schedule exhausted ends the card', () => {
    const live = { startedAt: NEXT_D.at - 3600, lastActedPrayerAt: NEXT_D.at - 3600 };
    expect(decide(live, SCHEDULE, NEXT_D.at + 60, true)).toEqual([{ kind: 'end' }]);

    const none = { startedAt: null, lastActedPrayerAt: null };
    expect(decide(none, SCHEDULE, NEXT_D.at + 60, true)).toEqual([]);
  });

  it('does nothing between prayers once a prayer has been acted on', () => {
    const live = { startedAt: D.at, lastActedPrayerAt: A.at };
    expect(decide(live, SCHEDULE, A.at + 60, true)).toEqual([]);
  });
});

describe('nextDueAt', () => {
  it('returns the cap when it precedes the next prayer', () => {
    // Started at Isha: cap is 03:35 next day, before next Fajr at 05:00.
    const live = { startedAt: I.at, lastActedPrayerAt: I.at };
    expect(nextDueAt(live, SCHEDULE, I.at + 60)).toBe(I.at + MAX_ACTIVE_S - MARGIN_S);
  });

  it('returns the next prayer when it precedes the cap', () => {
    const live = { startedAt: D.at, lastActedPrayerAt: D.at };
    expect(nextDueAt(live, SCHEDULE, D.at + 60)).toBe(A.at);
    const none = { startedAt: null, lastActedPrayerAt: null };
    expect(nextDueAt(none, SCHEDULE, D.at + 60)).toBe(A.at);
  });

  it('is null when the schedule is exhausted and no card is live', () => {
    const none = { startedAt: null, lastActedPrayerAt: null };
    expect(nextDueAt(none, SCHEDULE, NEXT_D.at + 60)).toBeNull();
  });
});
