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
import { getPathVisual } from '../constants/pathVisuals';
import { Mood, PrayerContext } from '../types';
import PrayerTimesService, { PrayerTimings, PrayerTimesData } from '../services/prayerTimesService';
import { getUserLocation } from '../services/locationStorage';
import NotificationService from '../services/notificationService';
import { getDailyVerse, getDailyVerseSync, DailyVerse } from '../services/dailyVerseService';
import { logServiceError } from '../services/errorLoggingService';
import { FreemiumService } from '../services/freemiumService';
import { loadSeenStreakMilestones, saveSeenStreakMilestones } from '../services/streakMilestoneStore';
import { STREAK_MILESTONES } from '../constants';

// ── Types ─────────────────────────────────────────────────────────────────

export interface ActivePath {
  /** Lets the Home card open this journey directly instead of the list. */
  pathId: string;
  pathLabel: string;
  stepTitle: string;
  stepFocus?: string;
  currentDay: number;
  totalDays: number;
  // Both come from getPathVisual(pathId) — the same registry PathsScreen and
  // PathDetailScreen use — so this card matches the journey's identity
  // everywhere else it appears instead of showing a fixed brown/gold wheat
  // icon for every journey regardless of which one is actually active.
  color: string;
  icon: ReturnType<typeof getPathVisual>['icon'];
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
  const freemiumService = FreemiumService.getInstance();

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
  const [currentCity, setCurrentCity] = useState('Dubai');
  const [currentCountry, setCurrentCountry] = useState('UAE');
  const [fajrTime, setFajrTime] = useState<string | null>(null);

  // ── Streak / mood state ───────────────────────────────────────────────────
  const [streakDays, setStreakDays] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [lastCheckin, setLastCheckin] = useState<LastCheckin | null>(null);
  const [localSelectedMood, setLocalSelectedMood] = useState<Mood | null>(null);
  // Newly-reached streak milestone (spec §8 streak_milestone peak) — null once
  // celebrated/dismissed. `offerSupportForMilestone` says whether the peaks-only
  // gate allowed a soft "support the mission" line alongside the celebration.
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const [offerSupportForMilestone, setOfferSupportForMilestone] = useState(false);

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
      const city = savedLocation?.city || 'Dubai';
      const country = savedLocation?.country || 'UAE';
      setCurrentCity(city);
      setCurrentCountry(country);

      // `!== undefined`, not truthiness — latitude/longitude of exactly 0
      // (equator / prime meridian) are valid coordinates.
      const lat = savedLocation?.latitude;
      const lon = savedLocation?.longitude;

      let data: PrayerTimesData;
      if (lat !== undefined && lon !== undefined) {
        data = await prayerService.getTimingsByCoordinates(lat, lon, country);
      } else {
        data = await prayerService.getTimingsByCity(city, country);
      }

      setPrayerTimings(data.timings);
      updatePrayerStatus(data.timings);
      if (data.timings.Fajr) setFajrTime(data.timings.Fajr);

      // Re-schedule notifications in the background — prayer UI must not wait
      // for OS scheduling calls, which can take 100-500ms on cold start. Each
      // call already cancels-then-reschedules its own category internally, so
      // a failure here should just be logged, not used to wipe the OTHER
      // category's notifications that may have just scheduled successfully
      // (the previous `.catch(() => cancelPrayerAndSpiritual())` did exactly
      // that, silencing a healthy category whenever its sibling call failed).
      // GPS users get per-day weekly timings so all 7 scheduled days fire at
      // their own day's times; city-lookup users repeat today's timings.
      const schedulingTimings: PrayerTimings | PrayerTimings[] =
        lat !== undefined && lon !== undefined
          ? prayerService.getWeeklyLocalTimings(lat, lon, country)
          : data.timings;
      const notifications = NotificationService.getInstance();
      notifications.scheduleSpiritualReminders(schedulingTimings)
        .then(() => notifications.schedulePrayerNotifications(schedulingTimings))
        .then(() => notifications.scheduleMoodCheckinNotifications(schedulingTimings))
        .catch((error) => logServiceError(
          'useHomeData',
          'scheduleNotifications',
          error instanceof Error ? error : new Error(String(error)),
        ));
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

      // Surface the smallest not-yet-acknowledged milestone the streak has
      // reached (spec §8 streak_milestone peak). Re-affirmed on every load,
      // not just the first, so the celebration is never silently lost to a
      // backgrounded app-kill before the user notices it — it's only marked
      // "seen" once dismissed (see dismissStreakMilestone). Skips the storage
      // read entirely when the streak hasn't reached the smallest milestone.
      if (stats.currentStreak >= STREAK_MILESTONES[0]) {
        const seen = await loadSeenStreakMilestones();
        const reached = STREAK_MILESTONES.find(
          (m) => stats.currentStreak >= m && !seen.includes(m),
        );
        if (reached) {
          const offerSupport = freemiumService.shouldOfferUpgrade('streak_milestone');
          if (offerSupport) await freemiumService.recordUpgradeAsk('streak_milestone');
          setOfferSupportForMilestone(offerSupport);
          setStreakMilestone(reached);
        }
      }
    } catch (error) {
      logServiceError('useHomeData', 'loadStreakData', error instanceof Error ? error : new Error(String(error)));
    }
  }, [setStreakCount, freemiumService]);

  // Only permanently retires the milestone (so it never re-surfaces) once the
  // user has actually acknowledged it — not at detection time.
  const dismissStreakMilestone = useCallback(async () => {
    if (streakMilestone !== null) {
      const seen = await loadSeenStreakMilestones();
      await saveSeenStreakMilestones([...seen, streakMilestone]);
    }
    setStreakMilestone(null);
  }, [streakMilestone]);

  const checkTodayMood = useCallback(async () => {
    try {
      const { moodHistoryService } = await import('../services/moodHistoryService');

      // "Checked in today" must reflect whether TODAY actually has an entry —
      // not the streak. getStats keeps currentStreak > 0 through a one-day grace
      // period (yesterday still counts), so deriving this from the streak wrongly
      // marked a fresh morning as already-checked-in and suppressed the
      // check-in banner. Read today's detail directly instead.
      const todayStr = formatDateYMD();
      const detail = await moodHistoryService.getDayDetail(todayStr);
      const didCheckInToday = !!(detail && detail.entries.length > 0);
      setCheckedInToday(didCheckInToday);

      if (didCheckInToday) {
        const last = detail!.entries[0];
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

      // getAllProgress has no defined row order (no ORDER BY, locally or on
      // Supabase), so `allProgress[0]` was whichever journey happened to be
      // started FIRST — including an already-finished one — and stayed
      // pinned there for the life of the app regardless of what the user
      // was actually working through.
      //
      // `startDate` descending replaced that, but "most recently STARTED" is
      // still not "the one I'm working through": a user partway through Rizq
      // who then began a newer journey saw the card pinned to the newer one,
      // and completing a Rizq day changed nothing on Home. PathsService now
      // records the last journey whose day was actually opened; that pointer
      // wins, and startDate ordering remains the fallback for a fresh install
      // or a pointer aimed at a finished/removed journey.
      const inProgress = allProgress
        .filter((p) => !p.isCompleted)
        .sort((a, b) => b.startDate - a.startDate);

      if (inProgress.length === 0) {
        setActivePath(null);
        return;
      }

      const lastOpenedId = await pathsService.getLastOpenedPath();
      const latest =
        inProgress.find((p) => p.pathId === lastOpenedId) ?? inProgress[0];
      const path = pathsService.getPathById(latest.pathId);
      if (!path) return;

      const currentStep =
        path.dailySteps.find((s: any) => s.day === latest.currentDay) || path.dailySteps[0];
      // getPathVisual is the "Single source of truth" (its own doc comment)
      // for a journey's color+icon, used by PathsScreen and PathDetailScreen.
      // This card used to hardcode Colors.accent.primary and a barley icon —
      // both happen to match Rizq Revolution's own visual, which is exactly
      // why every OTHER active journey silently rendered as gold wheat here.
      const visual = getPathVisual(path.id);
      setActivePath({
        pathId: path.id,
        pathLabel: `${path.duration}-DAY PATH`,
        stepTitle: currentStep?.title || path.title,
        stepFocus: currentStep?.focus || path.description,
        currentDay: latest.currentDay,
        totalDays: path.duration,
        color: visual.color,
        icon: visual.icon,
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
      // Key migration (@noor_last_open → @sakina_last_open) runs as a side
      // effect — it is cosmetic and must not block the data Promise.all below.
      AsyncStorage.getItem('@sakina_last_open').then(async (v) => {
        const lastOpen = v ?? (await AsyncStorage.getItem('@noor_last_open'));
        setLastOpenDate(lastOpen);
        await AsyncStorage.setItem('@sakina_last_open', new Date().toISOString());
        await AsyncStorage.removeItem('@noor_last_open').catch(() => {});
      });

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
    let mounted = true;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !mounted) return;
      setNow(Date.now());
      loadPrayerData();
      loadStreakData();
      loadActivePath();
      checkTodayMood();
      getDailyVerse().then(setDailyVerse).catch(() => {});
    });
    const tick = setInterval(() => { if (mounted) setNow(Date.now()); }, 60_000);
    return () => {
      mounted = false;
      subscription.remove();
      clearInterval(tick);
    };
  }, [loadPrayerData, loadStreakData, loadActivePath, checkTodayMood]);

  // ── Exposed interface ─────────────────────────────────────────────────────

  return {
    // Prayer
    prayerTimings,
    prayerContext,
    nextPrayer,
    loadingPrayers,
    currentCity,
    currentCountry,
    fajrTime,
    showLocationModal,
    setShowLocationModal,
    loadPrayerData,
    // Exposed so HomeScreen can refresh the Sacred Journey card on focus.
    // Without it the card reloaded only on mount, app-foreground and
    // pull-to-refresh, so returning from a journey day left it stale.
    loadActivePath,

    // Streak / mood
    streakDays,
    checkedInToday,
    setCheckedInToday,
    bannerDismissed,
    setBannerDismissed,
    lastCheckin,
    localSelectedMood,
    setLocalSelectedMood,
    loadStreakData,
    checkTodayMood,
    streakMilestone,
    offerSupportForMilestone,
    dismissStreakMilestone,

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
