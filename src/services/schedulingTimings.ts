/**
 * The saved location's prayer timings, in the shape the schedulers take, plus
 * the saved clock format. Shared by everything that has to schedule from the
 * saved location with no screen to read it from: the background top-up task
 * and the Live Activity switch.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrayerTimesService from './prayerTimesService';
import type { PrayerTimings } from './prayerTimesService';
import { getUserLocation } from './locationStorage';
import { STORAGE_KEYS } from '../constants';

type TimeFormat = '12h' | '24h';

/**
 * GPS path: per-day timings for the whole week, computed on-device — no
 * network at all, and each of the 7 scheduled days gets its own day's times.
 * City path (no coordinates on file): one day's timings from the (cached,
 * retried) API; callers repeat it across the week (`toWeeklyTimings`).
 * `!== undefined`, not truthiness — a coordinate of exactly 0 is valid.
 */
export async function loadSchedulingTimings(): Promise<PrayerTimings | PrayerTimings[]> {
  const prayerService = PrayerTimesService.getInstance();
  const savedLocation = await getUserLocation();
  const city = savedLocation?.city || 'Dubai';
  const country = savedLocation?.country || 'UAE';

  return savedLocation?.latitude !== undefined && savedLocation?.longitude !== undefined
    ? prayerService.getWeeklyLocalTimings(savedLocation.latitude, savedLocation.longitude, country)
    : (await prayerService.getTimingsByCity(city, country)).timings;
}

/** The clock format AppContext persists, for callers with no React context. */
export async function readTimeFormat(): Promise<TimeFormat> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEYS.timeFormat)) === '12h' ? '12h' : '24h';
  } catch {
    return '24h';
  }
}
