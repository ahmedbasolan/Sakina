import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { PrayerContext } from '../types';
import { getUserLocation } from './locationStorage';
import { logServiceError, logNetworkError } from './errorLoggingService';

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
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
    method: number = 2,
  ): Promise<PrayerTimesData> {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `@prayer_timings_${city}_${country}_${today}`;

    try {
      // Check cache first
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const response = await axios.get(`${this.BASE_URL}`, {
        params: {
          city,
          country,
          method,
        },
      });

      if (response.data.code === 200) {
        const data = response.data.data;
        // Save to cache
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
      } else {
        throw new Error(response.data.status || 'Failed to fetch prayer times');
      }
    } catch (error: any) {
      logNetworkError(this.BASE_URL, 'GET', error instanceof Error ? error : new Error(String(error)), { city, country });
      throw new Error(error.response?.data?.data || error.message || 'Network error');
    }
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
  public determineContextFromTimings(timings: PrayerTimings): PrayerContext {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const parseTime = (timeStr: string) => {
      // Remove any non-digit/colon chars (some APIs return "05:01 (GST)")
      const cleanTime = timeStr.split(' ')[0];
      const [hours, minutes] = cleanTime.split(':').map(Number);
      return hours * 60 + minutes;
    };

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

    const parseTime = (timeStr: string) => {
      const cleanTime = timeStr.split(' ')[0];
      const [hours, minutes] = cleanTime.split(':').map(Number);
      return hours * 60 + minutes;
    };

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
