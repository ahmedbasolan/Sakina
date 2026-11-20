/**
 * The widget's timeline: 30 days of finished entries the Swift widget only
 * has to draw (spec: docs/superpowers/specs/2026-11-11-square-widget-design.md,
 * "Data: what the app writes for the widget").
 *
 * Pure on purpose: no AsyncStorage, no native module, no service import. That
 * is why the two date helpers below exist here instead of being borrowed from
 * dailyVerseService (which drags AsyncStorage in at import time).
 * widgetService.test.ts pins `dateKeyOf` to `formatDateKey` so the two can
 * never disagree about what day it is.
 *
 * Shape of a snapshot:
 *   - one entry per boundary (00:00, Fajr, Dhuhr, Maghrib) per day;
 *   - days 1–7 use the user's real state and prayer times;
 *   - days 8–30 use clock times with "not checked in" and no Journey, because
 *     Journey progress that old is not trusted;
 *   - one closing entry at the start of day 31 holding the day-time gentle
 *     line, so a widget that is never refreshed again settles on a line that
 *     is right at any hour.
 *
 * Entries are fixed instants. If the phone changes time zone while the app
 * stays closed they keep firing at the old zone's instants until the app next
 * comes to the foreground and rewrites them — accepted, like the prayer card.
 */
import type { ScheduledPrayer } from '../../../supabase/functions/_shared/liveActivityPlan';
import { LOCKED_STATE, WIDGET_COPY, widgetStateFor, type Moment, type WidgetInputs, type WidgetState } from './widgetState';

/** UserDefaults key in the App Group. Must match SharedStore.swift and WidgetSnapshotStore.swift. */
export const WIDGET_SNAPSHOT_KEY = 'sakina.widget.snapshot.v1';
/** Days that use the user's real state and prayer times. */
export const WIDGET_REAL_DAYS = 7;
/** Days the snapshot covers before its closing entry. */
export const WIDGET_TOTAL_DAYS = 30;

/** The three boundaries of one local day, epoch seconds. */
export interface DayTimes {
  dateKey: string;
  fajr: number;
  dhuhr: number;
  maghrib: number;
}

export interface WidgetEntry {
  /** Epoch seconds from which `state` is shown. */
  at: number;
  state: WidgetState;
}

export interface WidgetSnapshot {
  version: 1;
  /** Sorted by `at`, strictly increasing. */
  entries: WidgetEntry[];
}

/** The LOCAL calendar date as "YYYY-MM-DD" (same rule as dailyVerseService.formatDateKey). */
export function dateKeyOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function localDate(dateKey: string, offsetDays = 0, hour = 0): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  // Built from year/month/day in local time, so a DST change inside the span
  // cannot shift a day by an hour.
  return new Date(y, m - 1, d + offsetDays, hour);
}

/** dateKey + `offset` calendar days, in local time. */
export function addDays(dateKey: string, offset: number): string {
  return dateKeyOf(localDate(dateKey, offset));
}

/** Epoch seconds of 00:00 local on `dateKey`. */
export function localMidnight(dateKey: string): number {
  return Math.floor(localDate(dateKey).getTime() / 1000);
}

/** The fallback for a day with no usable prayer times: 05:00, 12:00, 18:00 local. */
export function clockDayTimes(dateKey: string): DayTimes {
  const at = (hour: number) => Math.floor(localDate(dateKey, 0, hour).getTime() / 1000);
  return { dateKey, fajr: at(5), dhuhr: at(12), maghrib: at(18) };
}

/**
 * Groups a prayer schedule by the local day each prayer falls on. A day is
 * returned only when Fajr, Dhuhr and Maghrib are all present (buildSchedule
 * skips a prayer whose time it could not parse).
 */
export function dayTimesFromSchedule(schedule: ScheduledPrayer[]): Map<string, DayTimes> {
  const partial = new Map<string, Partial<DayTimes>>();
  for (const prayer of schedule) {
    const field =
      prayer.name === 'Fajr' ? 'fajr' : prayer.name === 'Dhuhr' ? 'dhuhr' : prayer.name === 'Maghrib' ? 'maghrib' : null;
    if (!field) continue;
    const dateKey = dateKeyOf(new Date(prayer.at * 1000));
    const day = partial.get(dateKey) ?? { dateKey };
    day[field] = prayer.at;
    partial.set(dateKey, day);
  }
  const out = new Map<string, DayTimes>();
  for (const [dateKey, day] of partial) {
    if (day.fajr !== undefined && day.dhuhr !== undefined && day.maghrib !== undefined) {
      out.set(dateKey, { dateKey, fajr: day.fajr, dhuhr: day.dhuhr, maghrib: day.maghrib });
    }
  }
  return out;
}

/** Real times only when they sit in order inside their own day; else clock times. */
function timesFor(dateKey: string, real: Map<string, DayTimes>): DayTimes {
  const candidate = real.get(dateKey);
  if (candidate) {
    const start = localMidnight(dateKey);
    const end = localMidnight(addDays(dateKey, 1));
    // Comparisons with NaN are false, so a non-number falls through too.
    if (start < candidate.fajr && candidate.fajr < candidate.dhuhr && candidate.dhuhr < candidate.maghrib && candidate.maghrib < end) {
      return candidate;
    }
  }
  return clockDayTimes(dateKey);
}

export function lockedSnapshot(): WidgetSnapshot {
  return { version: 1, entries: [{ at: 0, state: LOCKED_STATE }] };
}

/**
 * Every entry the widget will show from 00:00 on `todayKey`. `real` holds the
 * prayer-time boundaries for the days that have them.
 */
export function buildWidgetSnapshot(inputs: WidgetInputs, todayKey: string, real: Map<string, DayTimes>): WidgetSnapshot {
  if (!inputs.pro) return lockedSnapshot();

  const beyondHorizon: WidgetInputs = { ...inputs, checkIn: null, mood: null, journey: null };
  const entries: WidgetEntry[] = [];
  for (let i = 0; i < WIDGET_TOTAL_DAYS; i++) {
    const dateKey = addDays(todayKey, i);
    const dayInputs = i < WIDGET_REAL_DAYS ? inputs : beyondHorizon;
    const times = timesFor(dateKey, i < WIDGET_REAL_DAYS ? real : new Map());
    const boundaries: Array<[number, Moment]> = [
      [localMidnight(dateKey), 'night'],
      [times.fajr, 'morning'],
      [times.dhuhr, 'afternoon'],
      [times.maghrib, 'evening'],
    ];
    for (const [at, moment] of boundaries) {
      entries.push({ at, state: widgetStateFor(dayInputs, dateKey, moment) });
    }
  }
  entries.push({
    at: localMidnight(addDays(todayKey, WIDGET_TOTAL_DAYS)),
    state: { kind: 'gentle', text: WIDGET_COPY.gentleDay },
  });
  return { version: 1, entries };
}
