/**
 * Shared date utilities — single source of truth for date formatting.
 *
 * All YYYY-MM-DD strings across the app must go through these helpers so
 * that timezone and DST edge-cases are fixed in exactly one place.
 */

/**
 * Format a Date as a local-timezone "YYYY-MM-DD" string.
 * Uses calendar fields (getFullYear / getMonth / getDate) rather than
 * toISOString(), which returns UTC and will produce the wrong date for
 * users in negative UTC offsets after midnight local time.
 */
export function formatDateYMD(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Return today's date as "YYYY-MM-DD" in local timezone.
 */
function todayYMD(): string {
  return formatDateYMD(new Date());
}

/**
 * Return yesterday's date as "YYYY-MM-DD" in local timezone.
 * Uses setDate arithmetic so DST transitions (23h / 25h days) are handled correctly.
 */
function yesterdayYMD(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateYMD(d);
}

/**
 * Subtract `days` calendar days from a date and return the result.
 * Safe across DST boundaries.
 */
export function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Format a Date as a local-timezone "DD-MM-YYYY" string.
 * Used for the Aladhan coordinates API endpoint path which requires this format.
 */
export function formatDateDMY(date: Date = new Date()): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

/**
 * Return `date`'s 1-indexed day of the year (Jan 1 = 1).
 *
 * Reads only the local calendar fields (year/month/date) and diffs them as
 * UTC midnights, rather than dividing a raw local-time millisecond gap by
 * 86400000 — UTC has no DST, so this can't be thrown off by a transition
 * between Jan 1 and `date`. Used for deterministic day-based rotation
 * (content that should pick a different variant each calendar day); not
 * meant for anything requiring calendar-accurate leap-year day counts.
 */
export function dayOfYear(date: Date): number {
  const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const utcStartOfYear = Date.UTC(date.getFullYear(), 0, 1);
  return Math.floor((utcDate - utcStartOfYear) / (1000 * 60 * 60 * 24)) + 1;
}
