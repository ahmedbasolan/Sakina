/**
 * Verse snapshot for the prayer Live Activity card.
 *
 * The app writes this JSON into shared storage; the Swift extension reads it
 * and must reproduce `pickVerse` exactly. It never leaves the phone.
 *
 * Verse text is copied UNCHANGED from its source — no trimming, slicing or
 * normalising (CLAUDE.md, "Quoting Quran Text"). The card renders the complete
 * ayah; fitting it into the slot is the renderer's job, not this file's.
 */
import type { Content } from '../../types';
import type { ScheduledPrayer } from '../../../supabase/functions/_shared/liveActivityPlan';
import {
  formatDateKey,
  getDailyVerseForDateSync,
  type DailyVerse,
} from '../dailyVerseService';

export interface CardVerse {
  arabic: string;
  english: string;
  ref: string;
  dateKey: string;
}

export interface VerseSnapshot {
  version: 1;
  /** The verse picked for the user's mood, scoped to the day it was chosen. */
  mood: CardVerse | null;
  /** Today plus the next six calendar days: the fallback for any day. */
  daily: CardVerse[];
  timeFormat: '12h' | '24h';
  /**
   * The same schedule the server was sent (five salah a day, epoch seconds,
   * strictly increasing), so the card's prayer board can show every time of
   * the next prayer's day. Absent before the first sync; the card then shows
   * only the next prayer's time. Optional, so an older reader ignores it.
   */
  prayers?: ScheduledPrayer[];
}

/** Days of daily verses carried in the snapshot (today + 6). */
const DAILY_DAYS = 7;

/**
 * A Content becomes a card verse only when it is a Quran item carrying the
 * complete Arabic, its English and a citation. Hadith, Dua, Dhikr and Sunnah
 * items are never shown on the card.
 */
export function toCardVerse(content: Content, dateKey: string): CardVerse | null {
  if (content.type !== 'Quran') return null;
  if (!content.arabicText || !content.englishTranslation || !content.source) return null;
  return {
    arabic: content.arabicText,
    english: content.englishTranslation,
    ref: content.source,
    dateKey,
  };
}

function dailyToCardVerse(v: DailyVerse): CardVerse {
  return { arabic: v.arabic, english: v.translation, ref: v.ref, dateKey: v.dateKey };
}

/** dateKey + `offset` calendar days, in local time (DST-safe: builds by y/m/d). */
function addDays(dateKey: string, offset: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return formatDateKey(new Date(y, m - 1, d + offset));
}

/**
 * `today` is the verse Home shows today and becomes `daily[0]` as-is. The six
 * days after it use the date-hash selection (`getDailyVerseForDateSync`).
 */
export function buildVerseSnapshot(args: {
  mood: CardVerse | null;
  today: DailyVerse;
  timeFormat: '12h' | '24h';
  prayers?: ScheduledPrayer[] | null;
}): VerseSnapshot {
  const daily: CardVerse[] = [dailyToCardVerse(args.today)];
  for (let i = 1; i < DAILY_DAYS; i++) {
    daily.push(dailyToCardVerse(getDailyVerseForDateSync(addDays(args.today.dateKey, i))));
  }
  const snapshot: VerseSnapshot = { version: 1, mood: args.mood, daily, timeFormat: args.timeFormat };
  if (args.prayers && args.prayers.length > 0) snapshot.prayers = args.prayers;
  return snapshot;
}

/**
 * Reference behaviour for the Swift renderer: the mood verse if it was chosen
 * for exactly this day, else that day's daily verse, else null (the renderer
 * then shows no verse rather than a stale one).
 */
export function pickVerse(s: VerseSnapshot, dateKey: string): CardVerse | null {
  if (s.mood && s.mood.dateKey === dateKey) return s.mood;
  return s.daily.find((v) => v.dateKey === dateKey) ?? null;
}
