/**
 * useHomeData — all data-loading state for HomeScreen.
 *
 * Extracts the 17 useState + useEffect calls that were previously inlined in
 * HomeScreen, keeping the component responsible only for rendering, animations,
 * navigation, and the mood-tap handler (which needs rotationEngine from context
 * and navigation from props — view-layer concerns).
 *
 * Three concern groups:
 *   • Prayer  — timings, context, next prayer, location, Fajr time
 *   • Streak  — days, check-in state, last check-in, banner dismissed
 *   • Content — active path, daily verse, last-open date, pull-to-refresh
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDateYMD, subtractDays } from '../utils/date';
import { Colors } from '../theme/DesignSystem';
import { Mood, PrayerContext } from '../types';
import PrayerTimesService, { PrayerTimings } from '../services/prayerTimesService';
import { getUserLocation } from '../services/locationStorage';
import NotificationService from '../services/notificationService';
import { getDailyVerse, getDailyVerseSync, DailyVerse } from '../services/dailyVerseService';
import { logServiceError } from '../services/errorLoggingService';

// ── Types ─────────────────────────────────────────────────────────────────

export interface ActivePath {
  pathLabel: string;
  stepTitle: string;
  stepFocus?: string;
  currentDay: number;
  totalDays: number;
  color: string;
}

export interface LastCheckin {
  moodId: Mood;
  timestamp: number;
}

// ── Hook ──────────────────────────────────────────────────────────────────

interface UseHomeDataOptions {
  /** Publish streak count to SessionContext so MainNavigator can read it. */
  setStreakCount: (count: number) => void;
}

export function useHomeData({ setStreakCount }: UseHomeDataOptions) {
  const prayerService = PrayerTimesService.getInstance();

  // ── Prayer state ─────────────────────────────────────────────────────────
  const [prayerTimings, setPrayerTimings] = useState<PrayerTimings | null>(null);
  const [prayerContext, setPrayerContext] = useState<PrayerContext>('general');
  const [nextPrayer, setNextPrayer] = useState<{
    name: string;
    time: string;
    minutesRemaining: number;
  } | null>(null);
  const [loadingPrayers, setLoadingPrayers] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentCity, setCurrentCity] = useState('London');
  const [currentCountry, setCurrentCountry] = useState('UK');
  const [fajrTime, setFajrTime] = useState<string | null>(null);

  // ── Streak / mood state ───────────────────────────────────────────────────
  const [streakDays, setStreakDays] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [lastCheckin, setLastCheckin] = useState<LastCheckin | null>(null);
  const [localSelectedMood, setLocalSelectedMood] = useState<Mood | null>(null);

  // ── Content state ─────────────────────────────────────────────────────────
  const [activePath, setActivePath] = useState<ActivePath | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Minute-resolution clock for labels derived from "now" (greeting,
  // "Xm ago"). Bumped every 60s and on every return to the foreground.
  const [now, setNow] = useState(() => Date.now());
  // Sync fallback renders immediately; async getDailyVerse() replaces it with
  // the history-deduplicated version once AsyncStorage is ready.
  const [dailyVerse, setDailyVerse] = useState<DailyVerse>(getDailyVerseSync());
  const [lastOpenDate, setLastOpenDate] = useState<string | null>(null);

  // ── Prayer helpers ────────────────────────────────────────────────────────

  const updatePrayerStatus = useCallback(
    (timings: PrayerTimings) => {
      setPrayerContext(prayerService.determineContextFromTimings(timings));
      setNextPrayer(prayerService.getNextPrayerInfo(timings));
    },
    [prayerService],
  );

  const loadPrayerData = useCallback(async () => {
    try {
      setLoadingPrayers(true);
      const savedLocation = await getUserLocation();
      const city = savedLocation?.city || 'London';
      const country = savedLocation?.country || 'UK';
      setCurrentCity(city);
      setCurrentCountry(country);

      const data = await prayerService.getTimingsByCity(city, country);
      setPrayerTimings(data.timings);
      updatePrayerStatus(data.timings);
      if (data.timings.Fajr) setFajrTime(data.timings.Fajr);

      // Re-schedule both notification categories from today's fresh timings.
      // This also flushes stale pending notifications left over from previous
      // days (the cause of prayer alerts firing at the wrong time after the
      // device slept through them).
      const notifications = NotificationService.getInstance();
      await notifications.scheduleSpiritualReminders(data.timings);
      await notifications.schedulePrayerNotifications(data.timings, city);
    } catch (error) {
      logServiceError('useHomeData', 'loadPrayerData', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoadingPrayers(false);
    }
  }, [prayerService, updatePrayerStatus]);

  // ── Streak / mood helpers ─────────────────────────────────────────────────

  const loadStreakData = useCallback(async () => {
    try {
      const { moodHistoryService } = await import('../services/moodHistoryService');
      const stats = await moodHistoryService.getStats();
      setStreakDays(stats.currentStreak);
      setStreakCount(stats.currentStreak);
    } catch (error) {
      logServiceError('useHomeData', 'loadStreakData', error instanceof Error ? error : new Error(String(error)));
    }
  }, [setStreakCount]);

  const checkTodayMood = useCallback(async () => {
    try {
      const { moodHistoryService } = await import('../services/moodHistoryService');
      const stats = await moodHistoryService.getStats();
      setCheckedInToday(stats.currentStreak > 0 && stats.totalDaysTracked > 0);

      const todayStr = formatDateYMD();
      const detail = await moodHistoryService.getDayDetail(todayStr);
      if (detail && detail.entries.length > 0) {
        const last = detail.entries[0];
        setLastCheckin({ moodId: last.mood, timestamp: last.timestamp });
        setLocalSelectedMood(last.mood);
      } else {
        const yestStr = formatDateYMD(subtractDays(new Date(), 1));
        const yDetail = await moodHistoryService.getDayDetail(yestStr);
        if (yDetail && yDetail.entries.length > 0) {
          setLastCheckin({ moodId: yDetail.entries[0].mood, timestamp: yDetail.entries[0].timestamp });
        }
      }
    } catch {
      // Non-fatal: mood check-in state is cosmetic
    }
  }, []);

  // ── Content helpers ───────────────────────────────────────────────────────

  const loadActivePath = useCallback(async () => {
    try {
      const { PathsService } = await import('../services/pathsService');
      const pathsService = PathsService.getInstance();
      const allProgress = await pathsService.getAllProgress();
      if (allProgress.length === 0) return;

      const latest = allProgress[0];
      const path = pathsService.getPathById(latest.pathId);
      if (!path) return;

      const currentStep =
        path.dailySteps.find((s: any) => s.day === latest.currentDay) || path.dailySteps[0];
      setActivePath({
        pathLabel: `${path.duration}-DAY PATH`,
        stepTitle: currentStep?.title || path.title,
        stepFocus: currentStep?.focus || path.description,
        currentDay: latest.currentDay,
        totalDays: path.duration,
        color: Colors.accent.primary,
      });
    } catch (error) {
      logServiceError('useHomeData', 'loadActivePath', error instanceof Error ? error : new Error(String(error)));
    }
  }, []);

  // ── Pull-to-refresh ───────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadPrayerData(),
      loadStreakData(),
      loadActivePath(),
      getDailyVerse().then(setDailyVerse),
    ]);
    setRefreshing(false);
  }, [loadPrayerData, loadStreakData, loadActivePath]);

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    const bootstrap = async () => {
      // Key migration: @noor_last_open → @sakina_last_open
      const lastOpen =
        (await AsyncStorage.getItem('@sakina_last_open')) ??
        (await AsyncStorage.getItem('@noor_last_open'));
      setLastOpenDate(lastOpen);
      await AsyncStorage.setItem('@sakina_last_open', new Date().toISOString());
      await AsyncStorage.removeItem('@noor_last_open').catch(() => {});

      await Promise.all([
        loadPrayerData(),
        loadStreakData(),
        loadActivePath(),
        checkTodayMood(),
        getDailyVerse().then(setDailyVerse),
      ]);
    };
    bootstrap();
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Intentionally empty deps — runs once on mount.
  //   The loaders are stable useCallbacks; listing them here would cause
  //   a re-run on every render due to closure captures.

  // ── Prayer timer ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!prayerTimings) return;
    const interval = setInterval(() => updatePrayerStatus(prayerTimings), 60_000);
    return () => clearInterval(interval);
  }, [prayerTimings, updatePrayerStatus]);

  // ── Foreground re-sync + minute tick ─────────────────────────────────────
  // JS timers are suspended while the app is backgrounded, so everything
  // computed from "now" (greeting, spiritual window, countdowns, daily verse,
  // streak, stale pending notifications) is wrong by the time the user comes
  // back hours later. Reload it all whenever the app returns to the
  // foreground, and tick `now` each minute for time-derived labels.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setNow(Date.now());
      loadPrayerData();
      loadStreakData();
      loadActivePath();
      checkTodayMood();
      getDailyVerse().then(setDailyVerse).catch(() => {});
    });
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      subscription.remove();
      clearInterval(tick);
    };
  }, [loadPrayerData, loadStreakData, loadActivePath, checkTodayMood]);

  // ── Exposed interface ─────────────────────────────────────────────────────

  return {
    // Prayer
    prayerContext,
    nextPrayer,
    loadingPrayers,
    currentCity,
    currentCountry,
    fajrTime,
    showLocationModal,
    setShowLocationModal,
    loadPrayerData,

    // Streak / mood
    streakDays,
    checkedInToday,
    setCheckedInToday,
    bannerDismissed,
    setBannerDismissed,
    lastCheckin,
    localSelectedMood,
    setLocalSelectedMood,

    // Content
    activePath,
    dailyVerse,
    lastOpenDate,
    now,

    // Refresh
    refreshing,
    handleRefresh,
  } as const;
}
