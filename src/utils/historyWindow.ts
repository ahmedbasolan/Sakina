/**
 * How far back a tier may BROWSE its own history.
 *
 * This gates a view, never storage. Every check-in and every reflection is
 * still written, still synced, and still counted by `computeStats` /
 * `computeStreaks` — a free user's 47-day streak reads 47, not 30. What the
 * window caps is only the months and journal entries the UI will open, so
 * subscribing brings the older months back rather than recovering something
 * that was thrown away. Nothing in this file deletes a row.
 *
 * The arithmetic deliberately matches `INSIGHT_WINDOW_DAYS` in
 * `moodInsights.ts` (ages 0..N-1): a window of 30 is today plus the 29 days
 * before it. That equivalence is the reason the free tier is 30 days rather
 * than an arbitrary number — a free user can browse exactly the span their
 * insights already cover.
 *
 * `Infinity` is a supported window and means "no lower bound", matching the
 * idiom `PREMIUM_LIMITS` already uses for `maxSavedItems` and
 * `refreshesPerPrayerWindow`. The upper bound is not a tier question: no tier
 * can browse past today, because there is no data ahead of it.
 */
import { formatDateYMD, subtractDays } from './date';

/**
 * First local calendar day (YYYY-MM-DD) the window admits, inclusive.
 * `null` when the window is unbounded.
 */
export function earliestVisibleDay(windowDays: number, now: Date = new Date()): string | null {
  if (!Number.isFinite(windowDays)) return null;
  return formatDateYMD(subtractDays(now, windowDays - 1));
}

/** Local-midnight epoch ms of the boundary day — the lower bound for a SQLite
 *  `timestamp >= ?` clause. `0` when the window is unbounded. */
export function earliestVisibleTimestamp(windowDays: number, now: Date = new Date()): number {
  const day = earliestVisibleDay(windowDays, now);
  if (day === null) return 0;
  return new Date(day + 'T00:00:00').getTime();
}

/** Whether a YYYY-MM-DD day is inside the window. Future days never are. */
export function isDayVisible(
  dateStr: string,
  windowDays: number,
  now: Date = new Date(),
): boolean {
  if (dateStr > formatDateYMD(now)) return false;
  const earliest = earliestVisibleDay(windowDays, now);
  return earliest === null || dateStr >= earliest;
}

/**
 * Whether the calendar should open a month (0-based `monthIndex`, matching
 * `Date`). True when the month holds at least one visible day, so a month only
 * partly inside the window still opens.
 */
export function isMonthBrowsable(
  year: number,
  monthIndex: number,
  windowDays: number,
  now: Date = new Date(),
): boolean {
  // Never ahead of the current month — that direction is empty for every tier.
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  if (year > currentYear || (year === currentYear && monthIndex > currentMonth)) return false;

  const earliest = earliestVisibleDay(windowDays, now);
  if (earliest === null) return true;

  // Compare against the month's LAST day: a month whose tail reaches into the
  // window is worth opening even when its first days are outside it.
  const lastDayOfMonth = formatDateYMD(new Date(year, monthIndex + 1, 0));
  return lastDayOfMonth >= earliest;
}
