import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { PrayerContext } from '../types';
import { getUserLocation } from './locationStorage';
import { logServiceError, logNetworkError } from './errorLoggingService';
import { formatDateYMD } from '../utils/date';
import { withRetry, AXIOS_RETRY_CONFIG } from './retryUtils';

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export type TimeFormat = '12h' | '24h';

/**
 * Formats a prayer time for display. Strips any trailing timezone suffix the
 * Aladhan API appends (e.g. "05:24 (BST)" → "05:24"), then renders in the
 * requested clock format ("19:07" for 24h, "7:07 PM" for 12h).
 */
export const formatPrayerTime = (time?: string | null, format: TimeFormat = '24h'): string => {
  const clean = (time ?? '').split(' ')[0]; // drop "(BST)" style suffix
  if (format === '24h' || !clean.includes(':')) return clean;

  const [hStr, m] = clean.split(':');
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return clean;
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
};

/** Formats minutes-remaining into a compact "2h 15m" / "45m" countdown. */
export const formatCountdown = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ── Calculation-method mapping ──────────────────────────────────────────────
// Region-appropriate Aladhan calculation methods, keyed by normalised country
// name. IDs verified against https://api.aladhan.com/v1/methods. Countries
// not listed fall back to Muslim World League (3) — the most widely accepted
// general method. (Previously everything used ISNA (2), a North-America
// convention that produces noticeably wrong times in the Gulf.)
const METHOD_BY_COUNTRY: Record<string, number> = {
  uae: 8, 'united arab emirates': 8, oman: 8, bahrain: 8, yemen: 8, // Gulf Region
  'saudi arabia': 4, ksa: 4, // Umm Al-Qura, Makkah
  kuwait: 9,
  qatar: 10,
  egypt: 5, // Egyptian General Authority
  pakistan: 1, india: 1, bangladesh: 1, afghanistan: 1, // Karachi
  turkey: 13, 'türkiye': 13, // Diyanet
  singapore: 11,
  france: 12,
  russia: 14,
  malaysia: 17, // JAKIM
  indonesia: 20, // KEMENAG
  tunisia: 18, algeria: 19, morocco: 21, jordan: 23,
  usa: 2, 'united states': 2, us: 2, canada: 2, // ISNA
};

export function getCalculationMethodForCountry(country: string): number {
  return METHOD_BY_COUNTRY[country.trim().toLowerCase()] ?? 3;
}

export interface PrayerTimesData {
  timings: PrayerTimings;
  date: {
    readable: string;
    hijri: {
      day: string;
      month: { en: string; ar: string };
      year: string;
      designation: { abbreviated: string };
    };
  };
  meta: {
    method: {
      name: string;
    };
    timezone: string;
  };
}

class PrayerTimesService {
  private static instance: PrayerTimesService;
  private readonly BASE_URL = 'https://api.aladhan.com/v1/timingsByCity';

  private constructor() { }

  public static getInstance(): PrayerTimesService {
    if (!PrayerTimesService.instance) {
      PrayerTimesService.instance = new PrayerTimesService();
    }
    return PrayerTimesService.instance;
  }

  /**
   * Fetches prayer times for a specific city and country.
   * Uses day-based caching for offline support.
   */
  public async getTimingsByCity(
    city: string,
    country: string,
    method?: number,
  ): Promise<PrayerTimesData> {
    // Region-appropriate default unless the caller explicitly overrides.
    const resolvedMethod = method ?? getCalculationMethodForCountry(country);
    // Use local calendar date (not UTC) so users in UTC+4/+5 don't see
    // yesterday's prayer times for several hours after local midnight.
    // Cache keys include the method so a mapping change can never serve
    // times computed with a different convention.
    const today = formatDateYMD();
    // Normalize user-supplied city/country so special characters can't produce
    // unexpected AsyncStorage keys or break the startsWith pruning logic.
    const safeCity = city.replace(/[^a-zA-Z0-9\-]/g, '_').slice(0, 50);
    const safeCountry = country.replace(/[^a-zA-Z0-9\-]/g, '_').slice(0, 10);
    const cacheKey = `@prayer_timings_${safeCity}_${safeCountry}_m${resolvedMethod}_${today}`;
    // Cross-day fallback key — stores the most recently successful response
    // regardless of date, so first-launch / day-rollover with no connectivity
    // still has something to show rather than a complete blank.
    const fallbackKey = `@prayer_timings_${safeCity}_${safeCountry}_m${resolvedMethod}_fallback`;

    try {
      // 1. Serve today's cached data if available
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) return JSON.parse(cachedData);

      // 2. Fetch with exponential back-off retry (3 attempts, up to 8s max)
      const data = await withRetry(
        async () => {
          const response = await axios.get(this.BASE_URL, { params: { city, country, method: resolvedMethod } });
          if (response.data.code === 200) return response.data.data;
          throw new Error(response.data.status || 'Failed to fetch prayer times');
        },
        'PrayerTimesService.getTimingsByCity',
        AXIOS_RETRY_CONFIG,
      );

      // 3. Persist today's data + update cross-day fallback
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      await AsyncStorage.setItem(fallbackKey, JSON.stringify(data));
      // Drop previous days' per-date caches so AsyncStorage doesn't accumulate
      // one stale entry per city/method/day forever. Today's keys and the
      // cross-day fallback keys are preserved.
      this.pruneStaleTimingCaches(today).catch(() => {});
      return data;
    } catch (error: any) {
      logNetworkError(this.BASE_URL, 'GET', error instanceof Error ? error : new Error(String(error)), { city, country });

      // 4. Cross-day stale fallback — better than throwing and showing nothing
      const stale = await AsyncStorage.getItem(fallbackKey);
      if (stale) {
        console.warn('[PrayerTimes] Network unavailable — using stale cached timings');
        return JSON.parse(stale);
      }

      throw new Error(error.message || 'Network error fetching prayer times');
    }
  }

  /**
   * Remove `@prayer_timings_*` caches from previous days. Keeps any key for
   * `today` and the date-less `_fallback` keys (the offline safety net). Best
   * effort — failures here must never affect the prayer-times fetch.
   */
  private async pruneStaleTimingCaches(today: string): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const stale = keys.filter(
      (k) =>
        k.startsWith('@prayer_timings_') &&
        !k.endsWith('_fallback') &&
        !k.endsWith(`_${today}`),
    );
    if (stale.length) await AsyncStorage.multiRemove(stale);
  }

  /**
   * Convenience method to get context without passing timings manually.
   * Reads the user's saved location, falling back to London/UK.
   */
  public async getCurrentPrayerContext(): Promise<PrayerContext> {
    try {
      const savedLocation = await getUserLocation();
      const city = savedLocation?.city || 'London';
      const country = savedLocation?.country || 'UK';
      const data = await this.getTimingsByCity(city, country);
      return this.determineContextFromTimings(data.timings);
    } catch (error) {
      logServiceError('PrayerTimesService', 'getCurrentPrayerContext', error instanceof Error ? error : new Error(String(error)));
      return 'general';
    }
  }

  /**
   * Determines the current spiritual "context" based on prayer timings.
   */
  /** Convert "HH:MM" (or "HH:MM suffix") to total minutes since midnight. */
  private parseTimeToMinutes(timeStr: string): number {
    const cleanTime = timeStr.split(' ')[0]; // strip " (GST)" style suffixes
    const [hours, minutes] = cleanTime.split(':').map(Number);
    return hours * 60 + minutes;
  }

  public determineContextFromTimings(timings: PrayerTimings): PrayerContext {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const parseTime = (t: string) => this.parseTimeToMinutes(t);

    const fajr = parseTime(timings.Fajr);
    const sunrise = parseTime(timings.Sunrise);
    const dhuhr = parseTime(timings.Dhuhr);
    const asr = parseTime(timings.Asr);
    const maghrib = parseTime(timings.Maghrib);
    const isha = parseTime(timings.Isha);

    // 1. Pre-Fajr (Tahajjud window: 2 hours before Fajr)
    if (currentTime >= fajr - 120 && currentTime < fajr) {
      return 'fajr_pre';
    }

    // 2. Post-Fajr (Fajr until Sunrise - Morning Adhkar window)
    if (currentTime >= fajr && currentTime < sunrise) {
      return 'fajr_post';
    }

    // 3. Dhuhr Window (30 mins before until Asr)
    if (currentTime >= dhuhr - 30 && currentTime < asr) {
      return 'dhuhr';
    }

    // 4. Asr Window (Until 30 mins before Maghrib)
    if (currentTime >= asr && currentTime < maghrib - 30) {
      return 'asr';
    }

    // 5. Pre-Maghrib (30 mins before Maghrib - Evening Adhkar prep)
    if (currentTime >= maghrib - 30 && currentTime < maghrib) {
      return 'maghrib_pre';
    }

    // 6. Post-Maghrib (Maghrib to Isha)
    if (currentTime >= maghrib && currentTime < isha) {
      return 'maghrib_post';
    }

    // 7. Night (Isha until Isha + 120 mins - reflection window)
    if (currentTime >= isha && currentTime <= isha + 120) {
      return 'isha';
    }

    return 'general';
  }

  /**
   * Returns details about the next upcoming prayer.
   */
  public getNextPrayerInfo(timings: PrayerTimings): { name: string; time: string; minutesRemaining: number } {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const parseTime = (t: string) => this.parseTimeToMinutes(t);

    const prayerOrder: (keyof PrayerTimings)[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    for (const key of prayerOrder) {
      const prayerTime = parseTime(timings[key]);
      if (prayerTime > currentTime) {
        return {
          name: key,
          time: timings[key],
          minutesRemaining: prayerTime - currentTime,
        };
      }
    }

    // If all prayers today have passed, the next prayer is Fajr tomorrow
    const fajrTime = parseTime(timings.Fajr);
    return {
      name: 'Fajr',
      time: timings.Fajr,
      minutesRemaining: (1440 - currentTime) + fajrTime,
    };
  }

  /**
   * Formats minutes remaining into "2h 15m" style.
   */
  public formatCountdown(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
}

export default PrayerTimesService;
