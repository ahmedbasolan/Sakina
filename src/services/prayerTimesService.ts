import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinates, CalculationMethod, CalculationParameters, PrayerTimes as AdhanPrayerTimes, PolarCircleResolution, Madhab } from 'adhan';

import { AsrMadhab, PrayerContext } from '../types';
import { getUserLocation } from './locationStorage';
import { logServiceError, logNetworkError } from './errorLoggingService';
import { formatDateYMD, formatDateDMY } from '../utils/date';
import { withRetry, AXIOS_RETRY_CONFIG } from './retryUtils';
import { PreferencesService } from './preferencesService';

/** Resolves the effective Asr school: an explicit override, or the user's saved
 * preference. Read lazily (not cached) so a mid-session settings change takes
 * effect on the next prayer-times fetch without needing a service restart. */
function resolveAsrMadhab(explicit?: AsrMadhab): AsrMadhab {
  return explicit ?? PreferencesService.getInstance().getPreferences().asrMadhab;
}

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
// One entry per supported region, keyed by normalised country name/ISO-2 code.
// Pairs the numeric Aladhan method id (still used by getTimingsByCity — the
// manual city-picker path has no coordinates to compute locally) with the
// equivalent adhan.js CalculationMethod factory (used by the GPS-coordinates
// path below). IDs verified against https://api.aladhan.com/v1/methods;
// adhan.js methods verified against its own METHODS.md.
//
// adhan.js ships 13 built-in methods and doesn't have dedicated ones for
// France, Russia, Tunisia, Algeria, Morocco or Jordan — those fall back to
// Muslim World League (the same generic default Aladhan itself uses for any
// unmapped country) rather than guessing unverified custom angle parameters
// for those authorities. Malaysia/Indonesia map to adhan.js's Singapore
// method, which its own docs state explicitly covers all three.
interface MethodConfig {
  aladhanId: number;
  adhanMethod: () => CalculationParameters;
  label: string;
}

const MWL: MethodConfig = { aladhanId: 3, adhanMethod: CalculationMethod.MuslimWorldLeague, label: 'Muslim World League' };
const GULF: MethodConfig = { aladhanId: 8, adhanMethod: CalculationMethod.Dubai, label: 'Gulf Region' };
const UMM_AL_QURA: MethodConfig = { aladhanId: 4, adhanMethod: CalculationMethod.UmmAlQura, label: 'Umm al-Qura, Makkah' };
const KUWAIT: MethodConfig = { aladhanId: 9, adhanMethod: CalculationMethod.Kuwait, label: 'Kuwait' };
const QATAR: MethodConfig = { aladhanId: 10, adhanMethod: CalculationMethod.Qatar, label: 'Qatar' };
const EGYPTIAN: MethodConfig = { aladhanId: 5, adhanMethod: CalculationMethod.Egyptian, label: 'Egyptian General Authority' };
const KARACHI: MethodConfig = { aladhanId: 1, adhanMethod: CalculationMethod.Karachi, label: 'Karachi' };
const TURKEY: MethodConfig = { aladhanId: 13, adhanMethod: CalculationMethod.Turkey, label: 'Diyanet (Turkey)' };
const SINGAPORE: MethodConfig = { aladhanId: 11, adhanMethod: CalculationMethod.Singapore, label: 'Singapore' };
const MALAYSIA: MethodConfig = { aladhanId: 17, adhanMethod: CalculationMethod.Singapore, label: 'JAKIM (Malaysia)' };
const INDONESIA: MethodConfig = { aladhanId: 20, adhanMethod: CalculationMethod.Singapore, label: 'KEMENAG (Indonesia)' };
const NORTH_AMERICA: MethodConfig = { aladhanId: 2, adhanMethod: CalculationMethod.NorthAmerica, label: 'ISNA' };
const FRANCE_FALLBACK: MethodConfig = { ...MWL, aladhanId: 12 };
const RUSSIA_FALLBACK: MethodConfig = { ...MWL, aladhanId: 14 };
const TUNISIA_FALLBACK: MethodConfig = { ...MWL, aladhanId: 18 };
const ALGERIA_FALLBACK: MethodConfig = { ...MWL, aladhanId: 19 };
const MOROCCO_FALLBACK: MethodConfig = { ...MWL, aladhanId: 21 };
const JORDAN_FALLBACK: MethodConfig = { ...MWL, aladhanId: 23 };

const METHOD_CONFIG_BY_COUNTRY: Record<string, MethodConfig> = {
  uae: GULF, 'united arab emirates': GULF, oman: GULF, bahrain: GULF, yemen: GULF,
  'saudi arabia': UMM_AL_QURA, ksa: UMM_AL_QURA,
  kuwait: KUWAIT,
  qatar: QATAR,
  egypt: EGYPTIAN,
  pakistan: KARACHI, india: KARACHI, bangladesh: KARACHI, afghanistan: KARACHI,
  turkey: TURKEY, 'türkiye': TURKEY,
  singapore: SINGAPORE,
  malaysia: MALAYSIA,
  indonesia: INDONESIA,
  france: FRANCE_FALLBACK,
  russia: RUSSIA_FALLBACK,
  tunisia: TUNISIA_FALLBACK, algeria: ALGERIA_FALLBACK, morocco: MOROCCO_FALLBACK, jordan: JORDAN_FALLBACK,
  usa: NORTH_AMERICA, 'united states': NORTH_AMERICA, us: NORTH_AMERICA, canada: NORTH_AMERICA,
  // ISO-2 aliases returned by expo-location reverseGeocodeAsync
  ae: GULF, om: GULF, bh: GULF, ye: GULF,
  sa: UMM_AL_QURA,
  kw: KUWAIT,
  qa: QATAR,
  eg: EGYPTIAN,
  pk: KARACHI, 'in': KARACHI, bd: KARACHI, af: KARACHI,
  tr: TURKEY,
  sg: SINGAPORE,
  fr: FRANCE_FALLBACK,
  ru: RUSSIA_FALLBACK,
  my: MALAYSIA,
  id: INDONESIA,
  tn: TUNISIA_FALLBACK, dz: ALGERIA_FALLBACK, ma: MOROCCO_FALLBACK, jo: JORDAN_FALLBACK,
  ca: NORTH_AMERICA,
};

function getMethodConfig(country: string): MethodConfig {
  return METHOD_CONFIG_BY_COUNTRY[country.trim().toLowerCase()] ?? MWL;
}

function getCalculationMethodForCountry(country: string): number {
  return getMethodConfig(country).aladhanId;
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

  // Concurrent callers for the same city/method/day share one in-flight
  // fetch instead of each independently retrying. getCurrentPrayerContext
  // (this class's own fallback path) is called from several unrelated
  // places on a single Home mount — useHomeData's prayer fetch,
  // FreemiumService.initialize's syncPrayerWindow, and every
  // fetchWindowGuidance call's own syncPrayerWindow — and without this,
  // each paid its own full 3-attempt/~25s retry cost against the same
  // degraded connection. Stacked back to back, that read as GuidanceScreen
  // "loading endlessly" even though no single call actually hung.
  private inFlightCityFetches = new Map<string, Promise<PrayerTimesData>>();

  // A recent failure for a given key means the endpoint was just
  // unreachable — repeat callers within this cooldown skip straight to the
  // stale fallback (or a fast throw) instead of re-paying the retry tax
  // seconds later. Cleared on the next success. Matches the request-dedup
  // pattern quranService.ts's fetchAndCacheSurah already uses
  // (inFlightSurahFetches), applied here to failures as well as successes.
  private recentCityFetchFailures = new Map<string, number>();
  private static readonly FAILURE_COOLDOWN_MS = 60_000;

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
    madhab?: AsrMadhab,
  ): Promise<PrayerTimesData> {
    // Region-appropriate default unless the caller explicitly overrides.
    const resolvedMethod = method ?? getCalculationMethodForCountry(country);
    // Explicit param wins; otherwise fall back to the user's saved preference.
    const resolvedMadhab = resolveAsrMadhab(madhab);
    // Aladhan's `school` param: 0 = Shafi'i/Standard (also its default), 1 = Hanafi.
    const school = resolvedMadhab === 'hanafi' ? 1 : 0;
    // Use local calendar date (not UTC) so users in UTC+4/+5 don't see
    // yesterday's prayer times for several hours after local midnight.
    // Cache keys include the method and madhab so neither a mapping change
    // nor an Asr-school toggle can ever serve times computed under a
    // different convention.
    const today = formatDateYMD();
    // Normalize user-supplied city/country so special characters can't produce
    // unexpected AsyncStorage keys or break the startsWith pruning logic.
    const safeCity = city.replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 50);
    const safeCountry = country.replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 10);
    const cacheKey = `@prayer_timings_${safeCity}_${safeCountry}_m${resolvedMethod}_s${school}_${today}`;
    // Cross-day fallback key — stores the most recently successful response
    // regardless of date, so first-launch / day-rollover with no connectivity
    // still has something to show rather than a complete blank.
    const fallbackKey = `@prayer_timings_${safeCity}_${safeCountry}_m${resolvedMethod}_s${school}_fallback`;

    const existing = this.inFlightCityFetches.get(cacheKey);
    if (existing) return existing;

    const promise = this.fetchTimingsByCityUncached(cacheKey, fallbackKey, city, country, resolvedMethod, school, today);
    this.inFlightCityFetches.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.inFlightCityFetches.delete(cacheKey);
    }
  }

  private async fetchTimingsByCityUncached(
    cacheKey: string,
    fallbackKey: string,
    city: string,
    country: string,
    resolvedMethod: number,
    school: number,
    today: string,
  ): Promise<PrayerTimesData> {
    // 1. Serve today's cached data if available
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) return JSON.parse(cachedData);

    // A very recent failure for this exact key means the endpoint was just
    // unreachable — go straight to the stale fallback (or fail fast) instead
    // of re-paying the full retry tax seconds later.
    const lastFailure = this.recentCityFetchFailures.get(cacheKey);
    if (lastFailure !== undefined && Date.now() - lastFailure < PrayerTimesService.FAILURE_COOLDOWN_MS) {
      const stale = await AsyncStorage.getItem(fallbackKey);
      if (stale) return JSON.parse(stale);
      throw new Error('Prayer-time service recently unreachable');
    }

    try {
      // 2. Fetch with exponential back-off retry (3 attempts, up to 8s max).
      // `timeout` is required here — axios defaults to no timeout at all, so on
      // a degraded connection each attempt would hang on the OS socket timeout
      // (60s+) instead of failing fast into the retry/backoff loop below. Left
      // unset, 3 attempts could compound into 1-2+ minutes of a silently frozen
      // "Fetching sacred timings…" screen, and since every Home mood tap calls
      // through here too (syncPrayerWindow → getCurrentPrayerContext), it
      // stalled the entire guidance flow, not just this screen.
      const data = await withRetry(
        async () => {
          const response = await axios.get(this.BASE_URL, {
            params: { city, country, method: resolvedMethod, school },
            timeout: 10_000,
          });
          if (response.data.code === 200) return response.data.data;
          throw new Error(response.data.status || 'Failed to fetch prayer times');
        },
        'PrayerTimesService.getTimingsByCity',
        AXIOS_RETRY_CONFIG,
      );

      // 3. Persist today's data + update cross-day fallback
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      await AsyncStorage.setItem(fallbackKey, JSON.stringify(data));
      this.recentCityFetchFailures.delete(cacheKey);
      // Drop previous days' per-date caches so AsyncStorage doesn't accumulate
      // one stale entry per city/method/day forever. Today's keys and the
      // cross-day fallback keys are preserved.
      this.pruneStaleTimingCaches(today).catch(() => {});
      return data;
    } catch (error: any) {
      this.recentCityFetchFailures.set(cacheKey, Date.now());
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
   * Pure, synchronous prayer-timing computation from GPS coordinates via
   * adhan.js — entirely on-device, no network call and no I/O. Shared by
   * getTimingsByCoordinates (which layers the Hijri date on top for display)
   * and getCurrentPrayerContext (which only needs the timings themselves and
   * must never touch the network — it gates every guidance delivery).
   */
  private computeLocalTimings(
    now: Date,
    lat: number,
    lon: number,
    country: string,
    madhab?: AsrMadhab,
  ): { timings: PrayerTimings; methodConfig: MethodConfig; timeZone: string } {
    const methodConfig = getMethodConfig(country);
    const coordinates = new Coordinates(lat, lon);
    const params = methodConfig.adhanMethod();
    // Explicit param wins; otherwise the user's saved Asr-school preference.
    // adhan.js defaults to Shafi'i (shadow = 1x) when madhab is left unset.
    params.madhab = resolveAsrMadhab(madhab) === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
    // Without this, adhan.js defaults to `Unresolved` for true midnight-sun/
    // polar-night conditions (roughly lat >= 66.5°) — sunrise/sunset can't be
    // derived astronomically there, so fajr/isha/sunrise/sunset come back as
    // Invalid Date and fmtTime() below throws. AqrabBalad ("nearest latitude
    // with a valid solar time") is adhan.js's own recommended resolution for
    // this case, matching how most prayer-time calculators handle it.
    params.polarCircleResolution = PolarCircleResolution.AqrabBalad;
    const adhanTimes = new AdhanPrayerTimes(coordinates, now, params);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const fmtTime = (d: Date) => {
      if (Number.isNaN(d.getTime())) {
        throw new Error(`prayerTimesService: adhan.js produced an invalid time for coordinates (${lat}, ${lon})`);
      }
      return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).format(d);
    };

    const timings: PrayerTimings = {
      Fajr: fmtTime(adhanTimes.fajr),
      Sunrise: fmtTime(adhanTimes.sunrise),
      Dhuhr: fmtTime(adhanTimes.dhuhr),
      Asr: fmtTime(adhanTimes.asr),
      Maghrib: fmtTime(adhanTimes.maghrib),
      Isha: fmtTime(adhanTimes.isha),
    };

    return { timings, methodConfig, timeZone };
  }

  /**
   * Computes prayer times by GPS coordinates using adhan.js — entirely
   * on-device, no network call and no caching needed for the times
   * themselves (a fresh, exact computation is as cheap as reading a cache).
   * More accurate than city-name lookup because it skips a second geocoding
   * step server-side; GPS coordinates go straight into the astronomical
   * calculation. Only the Hijri calendar date (decorative/display-only,
   * not itself computable from adhan.js) still touches the network, with
   * its own day-keyed cache + stale fallback.
   */
  public async getTimingsByCoordinates(
    lat: number,
    lon: number,
    country: string,
    madhab?: AsrMadhab,
  ): Promise<PrayerTimesData> {
    const now = new Date();
    const { timings, methodConfig, timeZone } = this.computeLocalTimings(now, lat, lon, country, madhab);

    const hijri = await this.getHijriDateWithBudget(now);
    const readable = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(now);

    return {
      timings,
      date: { readable, hijri },
      meta: { method: { name: methodConfig.label }, timezone: timeZone },
    };
  }

  /**
   * Prayer timings for today plus the next 6 days, each computed from its own
   * date — entirely on-device via adhan.js, no network and no I/O. Feed this
   * to the notification schedulers so every one of the 7 scheduled days fires
   * at that day's own times instead of day-1's (prayer times drift 1–2
   * minutes per day, and the background top-up that used to paper over the
   * drift is deferred aggressively by Android battery managers).
   */
  public getWeeklyLocalTimings(
    lat: number,
    lon: number,
    country: string,
    madhab?: AsrMadhab,
  ): PrayerTimings[] {
    const weekly: PrayerTimings[] = [];
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      weekly.push(this.computeLocalTimings(date, lat, lon, country, madhab).timings);
    }
    return weekly;
  }

  // How long the (decorative) Hijri fetch may delay prayer timings on the
  // coordinates path. Past this, serve the stale cache or a blank while the
  // fetch keeps running in the background to warm the cache for later calls.
  private static readonly HIJRI_BUDGET_MS = 2500;

  // Single writer/reader key for the cross-day Hijri fallback — shared by
  // getHijriDate (writer) and getHijriDateWithBudget (reader) so they can't drift.
  private static readonly HIJRI_FALLBACK_KEY = '@hijri_date_fallback';

  private async getHijriDateWithBudget(date: Date): Promise<PrayerTimesData['date']['hijri']> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // getHijriDate never rejects (it degrades to stale/blank internally), so
    // racing it cannot leave an unhandled rejection behind.
    const fresh = this.getHijriDate(date).finally(() => {
      if (timer !== undefined) clearTimeout(timer);
    });
    const budget = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), PrayerTimesService.HIJRI_BUDGET_MS);
    });
    const winner = await Promise.race([fresh, budget]);
    if (winner) return winner;

    try {
      const stale = await AsyncStorage.getItem(PrayerTimesService.HIJRI_FALLBACK_KEY);
      if (stale) return JSON.parse(stale);
    } catch {
      /* fall through to blank */
    }
    return { day: '', month: { en: '', ar: '' }, year: '', designation: { abbreviated: '' } };
  }

  /**
   * Hijri calendar date for a Gregorian date — the one piece adhan.js can't
   * derive locally. Cached per calendar day (a given Gregorian date always
   * maps to the same Hijri date, no need to refetch) with a date-less
   * fallback key so a fully offline first launch still shows *a* Hijri date
   * rather than nothing. Never throws — Hijri display is decorative, unlike
   * the prayer times above which must always resolve.
   */
  private async getHijriDate(date: Date): Promise<PrayerTimesData['date']['hijri']> {
    const dmy = formatDateDMY(date);
    const cacheKey = `@hijri_date_${dmy}`;
    const fallbackKey = PrayerTimesService.HIJRI_FALLBACK_KEY;

    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);

      const hijri = await withRetry(
        async () => {
          const response = await axios.get(`https://api.aladhan.com/v1/gToH/${dmy}`, { timeout: 10_000 });
          if (response.data.code === 200) return response.data.data.hijri;
          throw new Error(response.data.status || 'Failed to fetch Hijri date');
        },
        'PrayerTimesService.getHijriDate',
        AXIOS_RETRY_CONFIG,
      );

      await AsyncStorage.setItem(cacheKey, JSON.stringify(hijri));
      await AsyncStorage.setItem(fallbackKey, JSON.stringify(hijri));
      return hijri;
    } catch (error) {
      logNetworkError(
        'https://api.aladhan.com/v1/gToH',
        'GET',
        error instanceof Error ? error : new Error(String(error)),
        { dmy },
      );
      // Guard the stale read too — if AsyncStorage itself throws here, this
      // method would reject and break the "never rejects" contract that
      // getHijriDateWithBudget's race relies on.
      try {
        const stale = await AsyncStorage.getItem(fallbackKey);
        if (stale) return JSON.parse(stale);
      } catch {
        /* fall through to blank */
      }
      // Nothing cached yet (offline first launch) — a blank Hijri line beats
      // throwing and losing the prayer times we already computed above.
      return { day: '', month: { en: '', ar: '' }, year: '', designation: { abbreviated: '' } };
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
   * Reads the user's saved location, falling back to Dubai/UAE.
   *
   * This gates every RotationEngine.getGuidance call (every mood tap and
   * "next verse"), so it must never depend on the network when it can be
   * avoided. GPS coordinates are on file for the vast majority of users
   * (onboarding's LocationCompass captures them) — when present, timings are
   * computed locally via adhan.js with zero network I/O. Only when no
   * coordinates were ever saved (manual city entry, or onboarding skipped)
   * does this fall back to the city-name lookup, which is itself already
   * timeout+retry+cached.
   */
  public async getCurrentPrayerContext(): Promise<PrayerContext> {
    try {
      const savedLocation = await getUserLocation();

      if (savedLocation?.latitude !== undefined && savedLocation?.longitude !== undefined) {
        const { timings } = this.computeLocalTimings(
          new Date(),
          savedLocation.latitude,
          savedLocation.longitude,
          savedLocation.country || 'UAE',
        );
        return this.determineContextFromTimings(timings);
      }

      const city = savedLocation?.city || 'Dubai';
      const country = savedLocation?.country || 'UAE';
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
  public parseTimeToMinutes(timeStr: string): number {
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

    // 1. Pre-Fajr (Tahajjud window: 2 hours before Fajr).
    // Use modulo to handle midnight wrap (e.g. Fajr at 01:00 → window starts 23:00 prev day).
    const preFajrStart = (fajr - 120 + 1440) % 1440;
    if (preFajrStart > fajr) {
      if (currentTime >= preFajrStart || currentTime < fajr) return 'fajr_pre';
    } else {
      if (currentTime >= preFajrStart && currentTime < fajr) return 'fajr_pre';
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

    // 7. Night (Isha until the Tahajjud window begins). Runs all the way to
    // preFajrStart (computed above), not a flat +120 minutes — a fixed
    // cutoff left a dead stretch of late night that fell through to the
    // generic 'general' context on longer nights (e.g. Isha 21:00, Fajr
    // 05:00 → preFajrStart 03:00 left 23:00–03:00 uncovered).
    // This window wraps midnight in the typical case (isha in the evening,
    // preFajrStart after midnight), so it needs the same branch as window 1
    // above — without it, a very early Fajr (preFajrStart wraps to a
    // late-evening clock value like 23:00) makes `currentTime < preFajrStart`
    // true for nearly the entire day, wrongly swallowing daytime hours.
    if (isha > preFajrStart) {
      if (currentTime >= isha || currentTime < preFajrStart) return 'isha';
    } else {
      if (currentTime >= isha && currentTime < preFajrStart) return 'isha';
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

    // Sunrise is informational — not a salah — so skip it for the "next prayer" display.
    const prayerOrder: (keyof PrayerTimings)[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

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

}

export default PrayerTimesService;
