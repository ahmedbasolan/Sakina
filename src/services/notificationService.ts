import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerTimings } from './prayerTimesService';

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

  // Builds up to 7 one-shot DATE triggers for a given time, all in parallel.
  // Only future dates are scheduled; already-past slots are skipped.
  private async scheduleWeeklyTrigger(
    hour: number,
    minute: number,
    content: Notifications.NotificationContentInput,
    channelId: string,
  ): Promise<string[]> {
    const now = new Date();
    const dates: Date[] = [];
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      date.setHours(hour, minute, 0, 0);
      if (date > now) dates.push(date);
    }
    const ids = await Promise.all(
      dates.map((date) =>
        Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId },
        }).catch(() => null),
      ),
    );
    return ids.filter((id): id is string => id !== null);
  }

  public async schedulePrayerNotifications(
    timings: PrayerTimings,
    cityName: string,
  ): Promise<void> {
    const enabled = await this.getPrayerEnabled();
    if (!enabled) { await cancelTrackedCategory(PRAYER_NOTIF_IDS_KEY); return; }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Clear existing PRAYER notifications only — don't touch other categories.
    await cancelTrackedCategory(PRAYER_NOTIF_IDS_KEY);

    // Explicit salah list — avoids Object.keys picking up extra Aladhan API
    // fields (Imsak, Midnight, Firstthird, Lastthird, Sunset) that are present
    // at runtime despite not being in the PrayerTimings interface.
    const SALAH: Array<keyof PrayerTimings> = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    const validSalah = SALAH.filter((prayer) => {
      const { hours, minutes } = this.parseTime(timings[prayer]);
      // Guard: a malformed API response can produce NaN; skip rather than
      // passing invalid values to the OS notification scheduler.
      return Number.isFinite(hours) && Number.isFinite(minutes);
    });

    const batches = await Promise.all(
      validSalah.map((prayer) => {
        const { hours, minutes } = this.parseTime(timings[prayer]);
        return this.scheduleWeeklyTrigger(hours, minutes, {
          title: `Time for ${prayer}`,
          body: `It's time for the ${prayer} prayer in ${cityName}.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        }, CH_PRAYER);
      }),
    );

    await setTrackedIds(PRAYER_NOTIF_IDS_KEY, batches.flat());
  }

  /**
   * Schedules proactive reminders for spiritual windows.
   */
  public async scheduleSpiritualReminders(timings: PrayerTimings): Promise<void> {
    const enabled = await this.getSpiritualEnabled();
    if (!enabled) { await cancelTrackedCategory(SPIRITUAL_NOTIF_IDS_KEY); return; }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Clear existing SPIRITUAL notifications only — don't touch other categories.
    await cancelTrackedCategory(SPIRITUAL_NOTIF_IDS_KEY);

    const fajrTime = this.parseTime(timings.Fajr);
    const maghribTime = this.parseTime(timings.Maghrib);

    // Guard: skip scheduling entirely if base times are malformed.
    const fajrValid = Number.isFinite(fajrTime.hours) && Number.isFinite(fajrTime.minutes);
    const maghribValid = Number.isFinite(maghribTime.hours) && Number.isFinite(maghribTime.minutes);

    const fajrMins = fajrTime.hours * 60 + fajrTime.minutes;
    const maghribMins = maghribTime.hours * 60 + maghribTime.minutes;

    // 1. Tahajjud — 1 hour before Fajr (wraps midnight)
    // 2. Morning Adhkar — 20 mins after Fajr
    // 3. Evening Adhkar — 45 mins before Maghrib
    const tahajjudMins = (((fajrMins - 60) % 1440) + 1440) % 1440;
    const morningMins = (fajrMins + 20) % 1440;
    const eveningMins = (((maghribMins - 45) % 1440) + 1440) % 1440;

    const [tahajjudIds, morningIds, eveningIds] = await Promise.all([
      fajrValid ? this.scheduleWeeklyTrigger(
        Math.floor(tahajjudMins / 60), tahajjudMins % 60,
        { title: 'The Silent Hour', body: 'It is the time of Tahajjud. A moment for deep reflection and conversation with your Lord.' },
        CH_SPIRITUAL,
      ) : Promise.resolve([]),
      fajrValid ? this.scheduleWeeklyTrigger(
        Math.floor(morningMins / 60), morningMins % 60,
        { title: 'Start with Light', body: 'The sun is rising. Remember Allah with the morning adhkars to protect your day.' },
        CH_SPIRITUAL,
      ) : Promise.resolve([]),
      maghribValid ? this.scheduleWeeklyTrigger(
        Math.floor(eveningMins / 60), eveningMins % 60,
        { title: 'Closing the Day', body: 'The day is ending. Find peace in the evening remembrance before the night sets in.' },
        CH_SPIRITUAL,
      ) : Promise.resolve([]),
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
    if (!value) await cancelTrackedCategory(PRAYER_NOTIF_IDS_KEY);
  }

  public async getSpiritualEnabled(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(SPIRITUAL_ENABLED_KEY);
      return raw === null ? true : JSON.parse(raw);
    } catch { return true; }
  }

  public async setSpiritualEnabled(value: boolean): Promise<void> {
    await AsyncStorage.setItem(SPIRITUAL_ENABLED_KEY, JSON.stringify(value));
    if (!value) await cancelTrackedCategory(SPIRITUAL_NOTIF_IDS_KEY);
  }

  /**
   * Cancels only prayer and spiritual notification categories.
   * Use in error paths where scheduling partially failed — preserves the
   * user's custom daily reminder which lives in a separate category.
   */
  public async cancelPrayerAndSpiritual(): Promise<void> {
    await Promise.all([
      cancelTrackedCategory(PRAYER_NOTIF_IDS_KEY),
      cancelTrackedCategory(SPIRITUAL_NOTIF_IDS_KEY),
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
      setTrackedIds(PRAYER_NOTIF_IDS_KEY, []),
      setTrackedIds(SPIRITUAL_NOTIF_IDS_KEY, []),
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
      // Modern expo-notifications requires an explicit trigger type.
      // Without `type: CALENDAR`, the trigger is unrecognized and the
      // notification silently never fires on iOS / throws on newer Android.
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: hour24,
        minute,
        repeats: true,
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
