import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerTimings } from './prayerTimesService';
import { logServiceError } from './errorLoggingService';
import type { SpiritualWindow } from './dailyVerseService';
import { buildWindowContent, loadLockscreenPrefs } from './lockscreenVerseService';
import { getDailyGuidanceContent } from './dailyGuidanceContent';
import { getPrayerMotivationBody, Salah } from './prayerMotivationContent';

const REMINDER_SETTINGS_KEY = '@daily_reminder_settings';

// Stable per-category tag, written into every scheduled notification's
// `content.data.category` and used both as the withLock() map key and as
// the filter for cancelByCategory() below. One set of constants drives both,
// instead of a separate AsyncStorage key per category — see the removal
// note above cancelByCategory for why the AsyncStorage-tracked-id version
// of this was a real bug, not just extra code.
const CATEGORY_DAILY_REMINDER = 'daily_reminder';
const CATEGORY_PRAYER = 'prayer';
const CATEGORY_SPIRITUAL = 'spiritual';
const CATEGORY_MOOD_CHECKIN = 'mood_checkin';
const PRAYER_ENABLED_KEY = '@notif_settings/prayer';
const SPIRITUAL_ENABLED_KEY = '@notif_settings/spiritual';
const MOOD_CHECKIN_ENABLED_KEY = '@notif_settings/mood_checkin';

// Android notification channels. On Android 8+ a scheduled notification only
// shows with sound / heads-up if it targets a channel; without one the OS
// silently drops it to minimal importance. iOS ignores channels entirely
// (a `channelId` in a trigger is a harmless no-op there). Separate channels
// let users mute, say, spiritual-window nudges while keeping prayer alerts.
const CH_DAILY = 'daily-reminders';
const CH_PRAYER = 'prayer-times';
const CH_SPIRITUAL = 'spiritual-windows';
const CH_MOOD_CHECKIN = 'mood-checkins';

// iOS silently drops any local notification scheduled past this many
// pending — no error, no callback, the OS just never delivers it. Android
// has no equivalent hard cap. Current usage (5 prayers + 3 spiritual
// windows, 7 days each, plus 1 daily repeating) tops out at 57, but that's
// arithmetic on what we *intend* to schedule — this checks the OS's actual
// count after every schedule call, so a future category, an extra day, or a
// stray leftover from an older app version shows up here before users start
// silently missing reminders.
const IOS_PENDING_NOTIFICATION_CAP = 64;
const IOS_PENDING_NOTIFICATION_WARN_AT = 58;

interface ReminderSettings {
  hour: number;    // 24h format
  minute: number;
  enabled: boolean;
}

// ── Per-category cancellation ────────────────────────────────────────
// We deliberately avoid `cancelAllScheduledNotificationsAsync` because it
// would nuke other categories (e.g. scheduling a daily reminder would kill
// prayer notifications).
//
// This used to track each category's notification IDs in AsyncStorage and
// cancel exactly that list. That broke across processes: the background
// top-up task (notificationTopUpTask.ts) runs as a HEADLESS task — a
// separate JS instance with its own NotificationService singleton and its
// own in-memory `schedulingLocks` — so `withLock` below can only serialize
// calls within one process, never a foreground call racing the background
// task. Two such calls could each read the same AsyncStorage id list before
// either wrote back, both schedule a fresh batch, and the second write
// silently overwrote the first's ids — leaving the first batch still
// scheduled with the OS but no longer tracked, so no future cancel could
// ever reach it. Symptom: duplicate spiritual-window/prayer notifications at
// the same slot, one stale and one fresh, that never got cleaned up.
//
// Querying the OS's actual pending list instead of an app-level mirror of it
// closes that gap — `getAllScheduledNotificationsAsync()` is shared,
// authoritative state, not a per-process cache that can go stale.
async function cancelByCategory(category: string): Promise<void> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter((n) => (n.content?.data as Record<string, unknown> | undefined)?.category === category)
      .map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {
          /* already cancelled / unknown id — safe to ignore */
        }),
      ),
  );
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private channelsReady = false;
  // Per-category lock: schedulePrayerNotifications/scheduleSpiritualReminders
  // each do read-tracked-ids -> cancel -> schedule -> write-tracked-ids, which
  // isn't atomic. Two overlapping calls for the same category (e.g. app-open
  // + AppState 'active' firing back-to-back, or the background top-up task
  // racing a foreground reload) can both read the same stale tracked ids, so
  // neither cancels the other's batch — producing duplicate notifications.
  // Chaining every call for a category onto this promise forces them to run
  // one at a time, so the second call always cancels the first's ids.
  private schedulingLocks: Map<string, Promise<void>> = new Map();

  private withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.schedulingLocks.get(key) || Promise.resolve();
    const run = prev.then(fn, fn);
    this.schedulingLocks.set(key, run.then(() => undefined, () => undefined));
    return run;
  }

  private constructor() { }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Create the Android notification channels (idempotent, Android-only).
   * Runs before the permission prompt so Android has a channel to attach the
   * request to, and before any scheduling so triggers can target a channel.
   */
  private async ensureAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android' || this.channelsReady) return;
    try {
      await Promise.all([
        Notifications.setNotificationChannelAsync(CH_DAILY, {
          name: 'Daily Reflection',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4AF37',
        }),
        Notifications.setNotificationChannelAsync(CH_PRAYER, {
          name: 'Prayer Times',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4AF37',
        }),
        Notifications.setNotificationChannelAsync(CH_SPIRITUAL, {
          name: 'Spiritual Windows',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
          lightColor: '#D4AF37',
        }),
        Notifications.setNotificationChannelAsync(CH_MOOD_CHECKIN, {
          name: 'Heart Check-Ins',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4AF37',
        }),
      ]);
      this.channelsReady = true;
    } catch (e) {
      console.warn('[NotificationService] Failed to create Android channels:', e);
    }
  }

  /**
   * Best-effort diagnostic — never let it break scheduling. Call after any
   * successful schedule so the check reflects the OS's real state, not just
   * what this call site thinks it scheduled. `caller` identifies which of
   * the three scheduling methods triggered the check — three call sites
   * share this guard, and a bare "warnIfNearPendingCap" label in the log
   * can't tell a future debugger which one actually pushed the count up.
   */
  private async warnIfNearPendingCap(caller: string): Promise<void> {
    if (Platform.OS !== 'ios') return;
    try {
      const pending = await Notifications.getAllScheduledNotificationsAsync();
      if (pending.length >= IOS_PENDING_NOTIFICATION_WARN_AT) {
        logServiceError(
          'NotificationService',
          `warnIfNearPendingCap:${caller}`,
          new Error(
            `${pending.length} notifications pending, approaching iOS's ${IOS_PENDING_NOTIFICATION_CAP}-notification cap`,
          ),
        );
      }
    } catch {
      // Diagnostic only — a failed count check must never block scheduling.
    }
  }

  public async requestPermissions(): Promise<boolean> {
    await this.ensureAndroidChannels();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }

  private parseTime(timeStr: string): { hours: number; minutes: number } {
    // Aladhan API returns 24h — "HH:mm" or "HH:mm (Timezone)". Take first token.
    const [hours, minutes] = timeStr.split(' ')[0].split(':').map(Number);
    return { hours, minutes };
  }

  /**
   * Normalises schedulable input: a single day's timings (the city-lookup
   * path, which only has today's data) is repeated across the week; a weekly
   * array (the GPS path, computed per-day on-device) is used as-is, padded
   * with its last day if short.
   */
  private toWeekly(timings: PrayerTimings | PrayerTimings[]): PrayerTimings[] {
    if (!Array.isArray(timings)) return Array(7).fill(timings);
    if (timings.length === 0) return [];
    if (timings.length >= 7) return timings.slice(0, 7);
    return [...timings, ...Array(7 - timings.length).fill(timings[timings.length - 1])];
  }

  // Builds up to 7 one-shot DATE triggers, one per day offset, all in
  // parallel. `times[dayOffset]` carries that day's own clock time (null =
  // skip that day). Only future dates are scheduled; past slots are skipped.
  //
  // On Android 12+, exact delivery of these DATE triggers depends entirely on
  // the app holding android.permission.SCHEDULE_EXACT_ALARM (declared in
  // app.json's android.permissions — expo-notifications' own AndroidManifest
  // does NOT include it, see its CHANGELOG). Without it, expo-notifications'
  // native scheduler (ExpoSchedulingDelegate.setupAlarm) silently falls back
  // to AlarmManager.setAndAllowWhileIdle instead of setExactAndAllowWhileIdle
  // — Doze can then defer and batch multiple unrelated notifications (e.g.
  // Isha, Maghrib, evening adhkar, each scheduled hours apart) and release
  // them all at once at the next maintenance window, hours late. This shipped
  // broken (missing permission) and produced exactly that symptom on a real
  // device before the permission was added.
  /**
   * `content` may be a fixed payload or a per-date factory.
   *
   * The factory exists for lock screen verses, which need a DIFFERENT verse on
   * each of the seven scheduled days. A single shared payload would pin one
   * verse for the whole week. Prayer notifications pass a fixed object and are
   * unaffected.
   */
  private async scheduleWeeklyTrigger(
    times: ReadonlyArray<{ hour: number; minute: number } | null>,
    content:
      | Notifications.NotificationContentInput
      | ((date: Date) => Promise<Notifications.NotificationContentInput>),
    channelId: string,
  ): Promise<string[]> {
    const now = new Date();
    const dates: Date[] = [];
    times.slice(0, 7).forEach((t, dayOffset) => {
      if (!t) return;
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      date.setHours(t.hour, t.minute, 0, 0);
      if (date > now) dates.push(date);
    });
    const resolveContent =
      typeof content === 'function' ? content : async () => content;
    const ids = await Promise.all(
      dates.map(async (date) =>
        // The factory is inside the try so a failed verse lookup degrades that
        // one notification instead of rejecting the whole category.
        resolveContent(date)
          .then((resolved) =>
            Notifications.scheduleNotificationAsync({
              content: resolved,
              trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId },
            }),
          )
          .catch((error) => {
            // Was silently discarding the error — prayer/spiritual notifications
            // are ~35+21 one-shot DATE alarms scheduled per top-up, and a
            // per-call failure here (OS alarm quota, restricted background
            // scheduling on some OEMs, etc.) previously left zero trace of why
            // a category went silent while others kept working.
            logServiceError(
              'NotificationService',
              'scheduleWeeklyTrigger',
              error instanceof Error ? error : new Error(String(error)),
            );
            return null;
          }),
      ),
    );
    return ids.filter((id): id is string => id !== null);
  }

  public async schedulePrayerNotifications(
    timings: PrayerTimings | PrayerTimings[],
  ): Promise<void> {
    return this.withLock(CATEGORY_PRAYER, () => this.doSchedulePrayerNotifications(timings));
  }

  private async doSchedulePrayerNotifications(
    timings: PrayerTimings | PrayerTimings[],
  ): Promise<void> {
    const enabled = await this.getPrayerEnabled();
    if (!enabled) { await cancelByCategory(CATEGORY_PRAYER); return; }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Guard before the cancel: an empty input must not wipe the category
    // and then schedule nothing (only reachable via a caller bug).
    const weekly = this.toWeekly(timings);
    if (weekly.length === 0) return;

    // Clear existing PRAYER notifications only — don't touch other categories.
    await cancelByCategory(CATEGORY_PRAYER);

    // Explicit salah list — avoids Object.keys picking up extra Aladhan API
    // fields (Imsak, Midnight, Firstthird, Lastthird, Sunset) that are present
    // at runtime despite not being in the PrayerTimings interface.
    const SALAH: Salah[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    const batches = await Promise.all(
      SALAH.map((prayer) => {
        const times = weekly.map((day) => {
          const { hours, minutes } = this.parseTime(day[prayer]);
          // Guard: a malformed API response can produce NaN; skip that day
          // rather than passing invalid values to the OS scheduler.
          return Number.isFinite(hours) && Number.isFinite(minutes)
            ? { hour: hours, minute: minutes }
            : null;
        });
        if (times.every((t) => t === null)) return Promise.resolve([]);
        // Title is just the bare prayer name (matches the spiritual-window
        // notifications' short-title style); the body rotates through
        // per-prayer motivational copy keyed off each scheduled date, the
        // same content-factory pattern scheduleSpiritualReminders uses below.
        return this.scheduleWeeklyTrigger(times, async (date) => ({
          title: prayer,
          body: getPrayerMotivationBody(prayer, date),
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { action: 'prayer_times', category: CATEGORY_PRAYER },
        }), CH_PRAYER);
      }),
    );

    const scheduled = batches.flat();
    // Weekly data was valid (we didn't bail out above) but nothing got
    // scheduled — every SALAH entry either had unparseable times or every
    // scheduleNotificationAsync call failed. Surface this distinctly from
    // the per-call error above (which fires even when SOME succeed) so a
    // fully-silent category is visible in logs instead of just "not there."
    if (scheduled.length === 0) {
      logServiceError(
        'NotificationService',
        'schedulePrayerNotifications',
        new Error('Prayer notifications: 0 scheduled despite valid weekly timings'),
      );
    }
    await this.warnIfNearPendingCap('schedulePrayerNotifications');
  }

  /**
   * Schedules proactive reminders for spiritual windows.
   */
  public async scheduleSpiritualReminders(timings: PrayerTimings | PrayerTimings[]): Promise<void> {
    return this.withLock(CATEGORY_SPIRITUAL, () => this.doScheduleSpiritualReminders(timings));
  }

  private async doScheduleSpiritualReminders(timings: PrayerTimings | PrayerTimings[]): Promise<void> {
    const enabled = await this.getSpiritualEnabled();
    if (!enabled) { await cancelByCategory(CATEGORY_SPIRITUAL); return; }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Guard before the cancel: an empty input must not wipe the category
    // and then schedule nothing (only reachable via a caller bug).
    const weekly = this.toWeekly(timings);
    if (weekly.length === 0) return;

    // Clear existing SPIRITUAL notifications only — don't touch other categories.
    await cancelByCategory(CATEGORY_SPIRITUAL);

    const toHM = (mins: number) => ({ hour: Math.floor(mins / 60), minute: mins % 60 });

    // Per day: 1. Tahajjud — 1 hour before Fajr (wraps midnight)
    //          2. Morning Adhkar — 20 mins after Fajr
    //          3. Evening Adhkar — 30 mins before Maghrib. Must equal the
    //             maghrib_pre window start in determineContextFromTimings:
    //             at −45 the notification announced a window the app didn't
    //             open for another 15 minutes (device-reported).
    const perDay = weekly.map((day) => {
      const fajrTime = this.parseTime(day.Fajr);
      const maghribTime = this.parseTime(day.Maghrib);
      // Guard: skip malformed days rather than scheduling NaN times.
      const fajrValid = Number.isFinite(fajrTime.hours) && Number.isFinite(fajrTime.minutes);
      const maghribValid = Number.isFinite(maghribTime.hours) && Number.isFinite(maghribTime.minutes);
      const fajrMins = fajrTime.hours * 60 + fajrTime.minutes;
      const maghribMins = maghribTime.hours * 60 + maghribTime.minutes;
      return {
        tahajjud: fajrValid ? toHM((((fajrMins - 60) % 1440) + 1440) % 1440) : null,
        morning: fajrValid ? toHM((fajrMins + 20) % 1440) : null,
        evening: maghribValid ? toHM((((maghribMins - 30) % 1440) + 1440) % 1440) : null,
      };
    });

    // Static copy shipped before lock screen verses existed. It remains the
    // payload whenever the feature is off or a window is opted out, so this
    // category never goes silent.
    const staticCopy: Record<SpiritualWindow, { title: string; body: string; data: { action: string; window: string; category: string } }> = {
      tahajjud: { title: 'The Silent Hour', body: 'It is the time of Tahajjud. A moment for deep reflection and conversation with your Lord.', data: { action: 'spiritual_window', window: 'tahajjud', category: CATEGORY_SPIRITUAL } },
      morning: { title: 'Start with Light', body: 'The sun is rising. Remember Allah with the morning adhkars to protect your day.', data: { action: 'spiritual_window', window: 'morning', category: CATEGORY_SPIRITUAL } },
      evening: { title: 'Closing the Day', body: 'The day is ending. Find peace in the evening remembrance before the night sets in.', data: { action: 'spiritual_window', window: 'evening', category: CATEGORY_SPIRITUAL } },
    };

    // Read preferences once, not per notification — 21 reads of the same key
    // would be pointless work inside a background top-up.
    //
    // Premium is NOT re-checked here. `enabled` can only be set by the premium
    // setup screen, and SubscriptionService.syncFromCustomerInfo() calls
    // resetLockscreenPrefsOnLapse() on the active -> inactive transition.
    // Gating here as well would need freemiumService, which imports this
    // module's siblings and would risk a cycle.
    const prefs = await loadLockscreenPrefs();

    const contentFor =
      (window: SpiritualWindow) =>
      async (date: Date): Promise<Notifications.NotificationContentInput> =>
        (await buildWindowContent(window, date, prefs)) ?? { ...staticCopy[window], sound: true };

    await Promise.all([
      this.scheduleWeeklyTrigger(perDay.map((d) => d.tahajjud), contentFor('tahajjud'), CH_SPIRITUAL),
      this.scheduleWeeklyTrigger(perDay.map((d) => d.morning), contentFor('morning'), CH_SPIRITUAL),
      this.scheduleWeeklyTrigger(perDay.map((d) => d.evening), contentFor('evening'), CH_SPIRITUAL),
    ]);

    await this.warnIfNearPendingCap('scheduleSpiritualReminders');
  }

  /**
   * Schedules twice-daily heart check-in notifications (after Fajr and after Isha).
   */
  public async scheduleMoodCheckinNotifications(timings: PrayerTimings | PrayerTimings[]): Promise<void> {
    return this.withLock(CATEGORY_MOOD_CHECKIN, () => this.doScheduleMoodCheckinNotifications(timings));
  }

  private async doScheduleMoodCheckinNotifications(timings: PrayerTimings | PrayerTimings[]): Promise<void> {
    const enabled = await this.getMoodCheckinEnabled();
    if (!enabled) { await cancelByCategory(CATEGORY_MOOD_CHECKIN); return; }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    const weekly = this.toWeekly(timings);
    if (weekly.length === 0) return;

    await cancelByCategory(CATEGORY_MOOD_CHECKIN);

    const toHM = (mins: number) => ({ hour: Math.floor(mins / 60), minute: mins % 60 });

    // Morning checkin: 30 mins after Fajr
    // Night checkin: 30 mins after Isha
    const perDay = weekly.map((day) => {
      const fajrTime = this.parseTime(day.Fajr);
      const ishaTime = this.parseTime(day.Isha);
      const fajrValid = Number.isFinite(fajrTime.hours) && Number.isFinite(fajrTime.minutes);
      const ishaValid = Number.isFinite(ishaTime.hours) && Number.isFinite(ishaTime.minutes);
      const fajrMins = fajrTime.hours * 60 + fajrTime.minutes;
      const ishaMins = ishaTime.hours * 60 + ishaTime.minutes;

      return {
        morningCheckin: fajrValid ? toHM((fajrMins + 30) % 1440) : null,
        nightCheckin: ishaValid ? toHM((ishaMins + 30) % 1440) : null,
      };
    });

    await Promise.all([
      this.scheduleWeeklyTrigger(
        perDay.map((d) => d.morningCheckin),
        {
          title: 'Morning Light · Fajr Reflection',
          body: 'How does your heart feel as this new day begins?',
          sound: true,
          data: { action: 'mood_checkin', window: 'morning', category: CATEGORY_MOOD_CHECKIN },
        },
        CH_MOOD_CHECKIN,
      ),
      this.scheduleWeeklyTrigger(
        perDay.map((d) => d.nightCheckin),
        {
          title: 'Night Peace · Isha Remembrance',
          body: 'Take a quiet moment before sleep. How does your soul feel tonight?',
          sound: true,
          data: { action: 'mood_checkin', window: 'night', category: CATEGORY_MOOD_CHECKIN },
        },
        CH_MOOD_CHECKIN,
      ),
    ]);

    await this.warnIfNearPendingCap('scheduleMoodCheckinNotifications');
  }

  public async getMoodCheckinEnabled(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(MOOD_CHECKIN_ENABLED_KEY);
      return raw === null ? true : JSON.parse(raw);
    } catch { return true; }
  }

  public async setMoodCheckinEnabled(value: boolean): Promise<void> {
    await AsyncStorage.setItem(MOOD_CHECKIN_ENABLED_KEY, JSON.stringify(value));
    if (!value) await this.withLock(CATEGORY_MOOD_CHECKIN, () => cancelByCategory(CATEGORY_MOOD_CHECKIN));
  }

  public async getPrayerEnabled(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(PRAYER_ENABLED_KEY);
      return raw === null ? true : JSON.parse(raw);
    } catch { return true; }
  }

  public async setPrayerEnabled(value: boolean): Promise<void> {
    await AsyncStorage.setItem(PRAYER_ENABLED_KEY, JSON.stringify(value));
    // Routed through the same lock as schedulePrayerNotifications — without
    // it, disabling while a schedule call is mid-flight can race and
    // resurrect the notifications just turned off.
    if (!value) await this.withLock(CATEGORY_PRAYER, () => cancelByCategory(CATEGORY_PRAYER));
  }

  public async getSpiritualEnabled(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(SPIRITUAL_ENABLED_KEY);
      return raw === null ? true : JSON.parse(raw);
    } catch { return true; }
  }

  public async setSpiritualEnabled(value: boolean): Promise<void> {
    await AsyncStorage.setItem(SPIRITUAL_ENABLED_KEY, JSON.stringify(value));
    if (!value) await this.withLock(CATEGORY_SPIRITUAL, () => cancelByCategory(CATEGORY_SPIRITUAL));
  }

  /**
   * Cancels prayer, spiritual, and mood checkin notification categories.
   * Use in error paths where scheduling partially failed — preserves the
   * user's custom daily reminder which lives in a separate category.
   */
  public async cancelPrayerAndSpiritual(): Promise<void> {
    await Promise.all([
      this.withLock(CATEGORY_PRAYER, () => cancelByCategory(CATEGORY_PRAYER)),
      this.withLock(CATEGORY_SPIRITUAL, () => cancelByCategory(CATEGORY_SPIRITUAL)),
      this.withLock(CATEGORY_MOOD_CHECKIN, () => cancelByCategory(CATEGORY_MOOD_CHECKIN)),
    ]);
  }

  /**
   * Cancels every scheduled notification across all categories. Call this
   * explicitly from settings/"clear all" flows — normal re-scheduling should
   * use category-scoped cancels instead. No per-category AsyncStorage state
   * to clean up any more (see cancelByCategory above) — the OS-level call
   * already removes everything.
   */
  public async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // --- Daily Reminder Methods (used by DailyRemindersScreen) ---

  public async getSettings(): Promise<ReminderSettings> {
    try {
      const raw = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[NotificationService] Failed to load settings:', e);
    }
    return { hour: 5, minute: 30, enabled: false };
  }

  public formatTime(hour24: number, minute: number): { time: string; period: 'AM' | 'PM' } {
    const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    const time = `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    return { time, period };
  }

  public parseTimeInput(hour12: number, minute: number, period: 'AM' | 'PM'): { hour: number; minute: number } {
    let hour24 = hour12;
    if (period === 'AM' && hour12 === 12) hour24 = 0;
    else if (period === 'PM' && hour12 < 12) hour24 = hour12 + 12;
    return { hour: hour24, minute };
  }

  public async scheduleReminder(hour24: number, minute: number): Promise<boolean> {
    return this.withLock(CATEGORY_DAILY_REMINDER, () => this.doScheduleReminder(hour24, minute));
  }

  private async doScheduleReminder(hour24: number, minute: number): Promise<boolean> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return false;

    // Cancel existing daily reminder only — do NOT touch prayer/spiritual notifs.
    await cancelByCategory(CATEGORY_DAILY_REMINDER);

    // Smart rotation: each day's notification surfaces a different feature
    // (mood check-in, mood calendar, journeys, Quran) so the single daily
    // reminder drives discovery without adding extra notification categories.
    // Best-effort — falls back to static content if the async lookup fails.
    // `action` varies by rotation variant (mood_calendar, quran_verse, ...),
    // so cancelByCategory needs the separate, stable `category` field to
    // find this notification again regardless of which variant is showing.
    let content: Notifications.NotificationContentInput;
    try {
      const rotated = await getDailyGuidanceContent();
      content = {
        ...rotated,
        data: { ...rotated.data, category: CATEGORY_DAILY_REMINDER },
        sound: true,
      };
    } catch {
      content = {
        title: 'A Quiet Minute',
        body: 'However today has gone so far, it is worth a minute with it.',
        sound: true,
        data: { action: 'daily_guidance', category: CATEGORY_DAILY_REMINDER },
      };
    }

    await Notifications.scheduleNotificationAsync({
      content,
      // CALENDAR triggers are iOS-only in expo-notifications (see
      // CalendarTriggerInput's `@platform ios` in Notifications.types.d.ts) —
      // using it here threw "Trigger of type: calendar is not supported on
      // Android" at runtime. DAILY is the cross-platform trigger for "fire
      // once a day at this hour/minute" and needs no `repeats` flag, since a
      // daily trigger is inherently repeating.
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hour24,
        minute,
        channelId: CH_DAILY,
      },
    });

    // Save settings
    await AsyncStorage.setItem(
      REMINDER_SETTINGS_KEY,
      JSON.stringify({ hour: hour24, minute, enabled: true }),
    );

    await this.warnIfNearPendingCap('scheduleReminder');
    return true;
  }

  public async cancelReminder(): Promise<void> {
    return this.withLock(CATEGORY_DAILY_REMINDER, () => this.doCancelReminder());
  }

  private async doCancelReminder(): Promise<void> {
    // Cancel ONLY the daily reminder. Prayer and spiritual-window notifs
    // are tracked separately and must survive this call.
    await cancelByCategory(CATEGORY_DAILY_REMINDER);
    try {
      const raw = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
      if (raw) {
        const settings = JSON.parse(raw);
        await AsyncStorage.setItem(
          REMINDER_SETTINGS_KEY,
          JSON.stringify({ ...settings, enabled: false }),
        );
      }
    } catch (e) {
      console.warn('[NotificationService] Failed to update settings:', e);
    }
  }
}

export default NotificationService;
