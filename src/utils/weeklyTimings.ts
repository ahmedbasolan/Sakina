import type { PrayerTimings } from '../services/prayerTimesService';

/**
 * Normalises schedulable input: a single day's timings (the city-lookup
 * path, which only has today's data) is repeated across the week; a weekly
 * array (the GPS path, computed per-day on-device) is used as-is, padded
 * with its last day if short.
 *
 * Shared by the notification schedulers and the Live Activity sync so both
 * treat the city path identically (times drift a minute or two by day 7 and
 * are refreshed on every open).
 */
export function toWeeklyTimings(timings: PrayerTimings | PrayerTimings[]): PrayerTimings[] {
  if (!Array.isArray(timings)) return Array(7).fill(timings);
  if (timings.length === 0) return [];
  if (timings.length >= 7) return timings.slice(0, 7);
  return [...timings, ...Array(7 - timings.length).fill(timings[timings.length - 1])];
}
