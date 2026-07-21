import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerTimings } from './prayerTimesService';
import { logServiceError } from './errorLoggingService';

const REMINDER_SETTINGS_KEY = '@daily_reminder_settings';
const DAILY_REMINDER_IDS_KEY = '@notif_ids/daily_reminder';
const PRAYER_NOTIF_IDS_KEY = '@notif_ids/prayer';
const SPIRITUAL_NOTIF_IDS_KEY = '@notif_ids/spiritual';
const PRAYER_ENABLED_KEY = '@notif_settings/prayer';
const SPIRITUAL_ENABLED_KEY = '@notif_settings/spiritual';

// Android notification channels. On Android 8+ a scheduled notification only
// shows with sound / heads-up if it targets a channel; without one the OS
// silently drops it to minimal importance. iOS ignores channels entirely
// (a `channelId` in a trigger is a harmless no-op there). Separate channels
// let users mute, say, spiritual-window nudges while keeping prayer alerts.
const CH_DAILY = 'daily-reminders';
const CH_PRAYER = 'prayer-times';
const CH_SPIRITUAL = 'spiritual-windows';

interface ReminderSettings {
  hour: number;    // 24h format
  minute: number;
  enabled: boolean;
}

// ── Per-category scheduled-id tracking ─────────────────────────────
// We deliberately avoid `cancelAllScheduledNotificationsAsync` because it
// would nuke other categories (e.g. scheduling a daily reminder would kill
// prayer notifications). Each category stores its own array of notification
// IDs in AsyncStorage, which we cancel individually.
async function getTrackedIds(key: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

async function setTrackedIds(key: string, ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(ids));
  } catch (e) {
    console.warn(`[NotificationService] Failed to persist ids for ${key}:`, e);
  }
}

async function cancelTrackedCategory(key: string): Promise<void> {
  const ids = await getTrackedIds(key);
  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {
        /* already cancelled / unknown id — safe to ignore */
      }),
    ),
  );
  await setTrackedIds(key, []);
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
      ]);
      this.channelsReady = true;
    } catch (e) {
      console.warn('[NotificationService] Failed to create Android channels:', e);
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
  private async scheduleWeeklyTrigger(
    times: ReadonlyArray<{ hour: number; minute: number } | null>,
    content: Notifications.NotificationContentInput,
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
    const ids = await Promise.all(
      dates.map((date) =>
        Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId },
        }).catch((error) => {
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
    cityName: string,
  ): Promise<void> {
    return this.withLock(PRAYER_NOTIF_IDS_KEY, () => this.doSchedulePrayerNotifications(timings, cityName));
  }

  private async doSchedulePrayerNotifications(
    timings: PrayerTimings | PrayerTimings[],
    cityName: string,
  ): Promise<void> {
    const enabled = await this.getPrayerEnabled();
    if (!enabled) { await cancelTrackedCategory(PRAYER_NOTIF_IDS_KEY); return; }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Guard before the cancel: an empty input must not wipe the category
    // and then schedule nothing (only reachable via a caller bug).
    const weekly = this.toWeekly(timings);
    if (weekly.length === 0) return;

    // Clear existing PRAYER notifications only — don't touch other categories.
    await cancelTrackedCategory(PRAYER_NOTIF_IDS_KEY);

    // Explicit salah list — avoids Object.keys picking up extra Aladhan API
    // fields (Imsak, Midnight, Firstthird, Lastthird, Sunset) that are present
    // at runtime despite not being in the PrayerTimings interface.
    const SALAH: Array<keyof PrayerTimings> = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

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
        return this.scheduleWeeklyTrigger(times, {
          title: `Time for ${prayer}`,
          body: `It's time for the ${prayer} prayer in ${cityName}.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        }, CH_PRAYER);
      }),
    );

    const scheduled = batches.flat();
    await setTrackedIds(PRAYER_NOTIF_IDS_KEY, scheduled);
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
  }

  /**
   * Schedules proactive reminders for spiritual windows.
   */
  public async scheduleSpiritualReminders(timings: PrayerTimings | PrayerTimings[]): Promise<void> {
    return this.withLock(SPIRITUAL_NOTIF_IDS_KEY, () => this.doScheduleSpiritualReminders(timings));
  }

  private async doScheduleSpiritualReminders(timings: PrayerTimings | PrayerTimings[]): Promise<void> {
    const enabled = await this.getSpiritualEnabled();
    if (!enabled) { await cancelTrackedCategory(SPIRITUAL_NOTIF_IDS_KEY); return; }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Guard before the cancel: an empty input must not wipe the category
    // and then schedule nothing (only reachable via a caller bug).
    const weekly = this.toWeekly(timings);
    if (weekly.length === 0) return;

    // Clear existing SPIRITUAL notifications only — don't touch other categories.
    await cancelTrackedCategory(SPIRITUAL_NOTIF_IDS_KEY);

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

    const [tahajjudIds, morningIds, eveningIds] = await Promise.all([
      this.scheduleWeeklyTrigger(
        perDay.map((d) => d.tahajjud),
        { title: 'The Silent Hour', body: 'It is the time of Tahajjud. A moment for deep reflection and conversation with your Lord.' },
        CH_SPIRITUAL,
      ),
      this.scheduleWeeklyTrigger(
        perDay.map((d) => d.morning),
        { title: 'Start with Light', body: 'The sun is rising. Remember Allah with the morning adhkars to protect your day.' },
        CH_SPIRITUAL,
      ),
      this.scheduleWeeklyTrigger(
        perDay.map((d) => d.evening),
        { title: 'Closing the Day', body: 'The day is ending. Find peace in the evening remembrance before the night sets in.' },
        CH_SPIRITUAL,
      ),
    ]);

    await setTrackedIds(SPIRITUAL_NOTIF_IDS_KEY, [...tahajjudIds, ...morningIds, ...eveningIds]);
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
    // it, disabling while a schedule call is mid-flight can race on
    // PRAYER_NOTIF_IDS_KEY and resurrect the notifications just turned off.
    if (!value) await this.withLock(PRAYER_NOTIF_IDS_KEY, () => cancelTrackedCategory(PRAYER_NOTIF_IDS_KEY));
  }

  public async getSpiritualEnabled(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(SPIRITUAL_ENABLED_KEY);
      return raw === null ? true : JSON.parse(raw);
    } catch { return true; }
  }

  public async setSpiritualEnabled(value: boolean): Promise<void> {
    await AsyncStorage.setItem(SPIRITUAL_ENABLED_KEY, JSON.stringify(value));
    if (!value) await this.withLock(SPIRITUAL_NOTIF_IDS_KEY, () => cancelTrackedCategory(SPIRITUAL_NOTIF_IDS_KEY));
  }

  /**
   * Cancels only prayer and spiritual notification categories.
   * Use in error paths where scheduling partially failed — preserves the
   * user's custom daily reminder which lives in a separate category.
   */
  public async cancelPrayerAndSpiritual(): Promise<void> {
    await Promise.all([
      this.withLock(PRAYER_NOTIF_IDS_KEY, () => cancelTrackedCategory(PRAYER_NOTIF_IDS_KEY)),
      this.withLock(SPIRITUAL_NOTIF_IDS_KEY, () => cancelTrackedCategory(SPIRITUAL_NOTIF_IDS_KEY)),
    ]);
  }

  /**
   * Cancels every scheduled notification across all categories. Call this
   * explicitly from settings/"clear all" flows — normal re-scheduling should
   * use category-scoped cancels instead.
   */
  public async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Promise.all([
      setTrackedIds(DAILY_REMINDER_IDS_KEY, []),
      this.withLock(PRAYER_NOTIF_IDS_KEY, () => setTrackedIds(PRAYER_NOTIF_IDS_KEY, [])),
      this.withLock(SPIRITUAL_NOTIF_IDS_KEY, () => setTrackedIds(SPIRITUAL_NOTIF_IDS_KEY, [])),
    ]);
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
    return this.withLock(DAILY_REMINDER_IDS_KEY, () => this.doScheduleReminder(hour24, minute));
  }

  private async doScheduleReminder(hour24: number, minute: number): Promise<boolean> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return false;

    // Cancel existing daily reminder only — do NOT touch prayer/spiritual notifs.
    await cancelTrackedCategory(DAILY_REMINDER_IDS_KEY);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time for Reflection',
        body: 'Take a moment to check in with your heart.',
        sound: true,
      },
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

    await setTrackedIds(DAILY_REMINDER_IDS_KEY, [id]);

    // Save settings
    await AsyncStorage.setItem(
      REMINDER_SETTINGS_KEY,
      JSON.stringify({ hour: hour24, minute, enabled: true }),
    );

    return true;
  }

  public async cancelReminder(): Promise<void> {
    return this.withLock(DAILY_REMINDER_IDS_KEY, () => this.doCancelReminder());
  }

  private async doCancelReminder(): Promise<void> {
    // Cancel ONLY the daily reminder. Prayer and spiritual-window notifs
    // are tracked separately and must survive this call.
    await cancelTrackedCategory(DAILY_REMINDER_IDS_KEY);
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
