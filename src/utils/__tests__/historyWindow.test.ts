/**
 * historyWindow — the tier-based cap on how far back a user may BROWSE.
 *
 * The window deliberately matches `INSIGHT_WINDOW_DAYS`' arithmetic (ages
 * 0..N-1, so 30 means today plus the 29 before it). That is the whole
 * justification for the free tier being 30 days: a free user can browse
 * exactly the span their insights already cover, rather than an arbitrary
 * number. If these two ever disagree the free tier stops making sense, so the
 * first test pins the shared convention rather than a literal date.
 *
 * These functions gate a VIEW, never storage — nothing here deletes or
 * withholds a write. See historyWindow.ts.
 */
import {
  earliestVisibleDay,
  earliestVisibleTimestamp,
  isDayVisible,
  isMonthBrowsable,
} from '../historyWindow';

// Fixed "now" — a late-August date so the 30-day window straddles two months
// and the 90-day window straddles four.
const NOW = new Date('2026-08-26T12:00:00');

describe('earliestVisibleDay', () => {
  it('spans windowDays calendar days INCLUDING today, matching the insight window', () => {
    // 30 days = today (age 0) plus the 29 before it → 2026-07-28.
    expect(earliestVisibleDay(30, NOW)).toBe('2026-07-28');
  });

  it('reaches back a full quarter for the 90-day tier', () => {
    expect(earliestVisibleDay(90, NOW)).toBe('2026-05-29');
  });

  it('collapses to today when the window is a single day', () => {
    expect(earliestVisibleDay(1, NOW)).toBe('2026-08-26');
  });

  it('has no boundary when the window is Infinity', () => {
    expect(earliestVisibleDay(Infinity, NOW)).toBeNull();
  });
});

describe('isDayVisible', () => {
  it('shows today', () => {
    expect(isDayVisible('2026-08-26', 30, NOW)).toBe(true);
  });

  it('shows the boundary day itself — the window is inclusive', () => {
    expect(isDayVisible('2026-07-28', 30, NOW)).toBe(true);
  });

  it('hides the day just outside the boundary', () => {
    expect(isDayVisible('2026-07-27', 30, NOW)).toBe(false);
  });

  it('hides a day the free tier cannot reach but the paid tier can', () => {
    expect(isDayVisible('2026-06-15', 30, NOW)).toBe(false);
    expect(isDayVisible('2026-06-15', 90, NOW)).toBe(true);
  });

  it('never shows a future day, however wide the window', () => {
    expect(isDayVisible('2026-08-27', 30, NOW)).toBe(false);
    expect(isDayVisible('2026-08-27', Infinity, NOW)).toBe(false);
  });

  it('shows every past day when the window is Infinity', () => {
    expect(isDayVisible('2019-01-01', Infinity, NOW)).toBe(true);
  });
});

describe('isMonthBrowsable', () => {
  it('allows the current month', () => {
    expect(isMonthBrowsable(2026, 7, 30, NOW)).toBe(true);
  });

  it('allows a month only partly inside the window', () => {
    // July 28–31 are visible, so July is worth opening.
    expect(isMonthBrowsable(2026, 6, 30, NOW)).toBe(true);
  });

  it('blocks a month entirely before the window', () => {
    expect(isMonthBrowsable(2026, 5, 30, NOW)).toBe(false);
  });

  it('opens two more months for the paid tier than the free one', () => {
    for (const month of [5, 6, 7]) {
      expect(isMonthBrowsable(2026, month, 30, NOW)).toBe(month >= 6);
    }
    // 90 days reaches back to 2026-05-30, so May, June, July all open.
    for (const month of [4, 5, 6, 7]) {
      expect(isMonthBrowsable(2026, month, 90, NOW)).toBe(month >= 4);
    }
  });

  it('blocks future months for every tier — there is no data ahead of today', () => {
    expect(isMonthBrowsable(2026, 8, 30, NOW)).toBe(false);
    expect(isMonthBrowsable(2026, 8, Infinity, NOW)).toBe(false);
    expect(isMonthBrowsable(2027, 0, Infinity, NOW)).toBe(false);
  });

  it('crosses the year boundary correctly', () => {
    const january = new Date('2027-01-10T12:00:00');
    // 30 days back from Jan 10 2027 is 2026-12-12, so December is browsable.
    expect(isMonthBrowsable(2026, 11, 30, january)).toBe(true);
    expect(isMonthBrowsable(2026, 10, 30, january)).toBe(false);
  });
});

describe('earliestVisibleTimestamp', () => {
  it('returns local midnight of the boundary day, so SQLite rows on that day survive', () => {
    const ts = earliestVisibleTimestamp(30, NOW);
    expect(ts).toBe(new Date('2026-07-28T00:00:00').getTime());
  });

  it('returns 0 for an Infinity window, matching "no lower bound"', () => {
    expect(earliestVisibleTimestamp(Infinity, NOW)).toBe(0);
  });
});
