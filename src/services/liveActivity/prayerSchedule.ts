import type { PrayerTimings } from '../prayerTimesService';
import type { Salah, ScheduledPrayer } from '../../../supabase/functions/_shared/liveActivityPlan';

const SALAH_ORDER: Salah[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

/** Wall-clock fields of an instant in `timeZone`. */
function localParts(epochMs: number, timeZone: string) {
  const parts: Record<string, number> = {};
  for (const p of formatterFor(timeZone).formatToParts(new Date(epochMs))) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  return parts;
}

/** UTC offset (ms, east positive) of `timeZone` at the given instant. */
function offsetMs(epochMs: number, timeZone: string): number {
  const p = localParts(epochMs, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second); // % 24: some engines print midnight as 24
  return asUtc - Math.floor(epochMs / 1000) * 1000;
}

/**
 * Epoch seconds of a wall-clock time in `timeZone`. `day` may overflow the month
 * (Date.UTC normalises it). The offset is looked up for that date's own instant,
 * and re-checked once so a time just across a DST change resolves correctly.
 */
function zonedToEpochSeconds(
  year: number,
  monthIndex: number,
  day: number,
  minutesOfDay: number,
  timeZone: string,
): number {
  const wallAsUtc = Date.UTC(year, monthIndex, day, 0, minutesOfDay);
  const first = wallAsUtc - offsetMs(wallAsUtc, timeZone);
  const second = wallAsUtc - offsetMs(first, timeZone);
  return Math.floor(second / 1000);
}

/** "05:24 (BST)" -> 324; NaN when it is not a valid HH:MM. */
function parseMinutes(raw: string | undefined | null): number {
  const clean = (raw ?? '').split(' ')[0];
  const m = /^(\d{1,2}):(\d{2})$/.exec(clean);
  if (!m) return NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return NaN;
  return h * 60 + min;
}

/**
 * Converts the app's local HH:MM weekly timings into UTC epoch-second instants
 * for the five salah (Sunrise excluded). Day `i` of `weekly` is `firstDay + i`
 * calendar days in `timeZone`. The result is strictly increasing; a prayer with
 * an unparseable time is skipped.
 */
export function buildSchedule(
  weekly: PrayerTimings[],
  firstDay: Date,
  timeZone: string,
): ScheduledPrayer[] {
  const start = localParts(firstDay.getTime(), timeZone);
  const out: ScheduledPrayer[] = [];
  let lastAt = -Infinity;

  weekly.forEach((timings, i) => {
    let prevMinutes = -1;
    let rolled = 0;
    for (const name of SALAH_ORDER) {
      const minutes = parseMinutes(timings[name]);
      if (Number.isNaN(minutes)) continue;
      // At or before the previous prayer's time-of-day: it is past midnight.
      if (minutes <= prevMinutes) rolled = 1;
      prevMinutes = minutes;
      const at = zonedToEpochSeconds(start.year, start.month - 1, start.day + i + rolled, minutes, timeZone);
      if (at <= lastAt) continue;
      lastAt = at;
      out.push({ name, at });
    }
  });

  return out;
}
