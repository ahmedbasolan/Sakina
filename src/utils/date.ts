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
export function todayYMD(): string {
  return formatDateYMD(new Date());
}

/**
 * Return yesterday's date as "YYYY-MM-DD" in local timezone.
 * Uses setDate arithmetic so DST transitions (23h / 25h days) are handled correctly.
 */
export function yesterdayYMD(): string {
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
