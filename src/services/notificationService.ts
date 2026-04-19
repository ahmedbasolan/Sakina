import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerTimings } from './prayerTimesService';

const REMINDER_SETTINGS_KEY = '@daily_reminder_settings';
const DAILY_REMINDER_IDS_KEY = '@notif_ids/daily_reminder';
const PRAYER_NOTIF_IDS_KEY = '@notif_ids/prayer';
const SPIRITUAL_NOTIF_IDS_KEY = '@notif_ids/spiritual';

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

  private constructor() { }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }

  private parseTime(timeStr: string): { hours: number; minutes: number } {
    // Handle "HH:mm (Timezone)" or "HH:mm AM/PM" or just "HH:mm"
    const cleanTime = timeStr.split(' ')[0];
    const [hours, minutes] = cleanTime.split(':').map(Number);

    let finalHours = hours;
    const modifier = timeStr.split(' ')[1];
    if (modifier === 'PM' && hours < 12) finalHours += 12;
    if (modifier === 'AM' && hours === 12) finalHours = 0;

    return { hours: finalHours, minutes };
  }

  public async schedulePrayerNotifications(
    timings: PrayerTimings,
    cityName: string,
  ): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Clear existing PRAYER notifications only — don't touch other categories.
    await cancelTrackedCategory(PRAYER_NOTIF_IDS_KEY);

    const prayerNames = Object.keys(timings) as Array<keyof PrayerTimings>;
    const newIds: string[] = [];

    for (const prayer of prayerNames) {
      if (prayer === 'Sunrise') continue;

      const { hours, minutes } = this.parseTime(timings[prayer]);

      const now = new Date();
      const scheduledDate = new Date();
      scheduledDate.setHours(hours, minutes, 0, 0);

      if (scheduledDate > now) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${prayer}`,
            body: `It's time for the ${prayer} prayer in ${cityName}.`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: scheduledDate,
          },
        });
        newIds.push(id);
      }
    }

    await setTrackedIds(PRAYER_NOTIF_IDS_KEY, newIds);
  }

  /**
   * Schedules proactive reminders for spiritual windows.
   */
  public async scheduleSpiritualReminders(
    timings: PrayerTimings,
  ): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Clear existing SPIRITUAL notifications only — don't touch other categories.
    await cancelTrackedCategory(SPIRITUAL_NOTIF_IDS_KEY);
    const newIds: string[] = [];

    // 1. Tahajjud Reminder (fajr_pre) - 1 hour before Fajr
    const fajrTime = this.parseTime(timings.Fajr);
    const tahajjudDate = new Date();
    tahajjudDate.setHours(fajrTime.hours - 1, fajrTime.minutes, 0, 0);

    if (tahajjudDate > new Date()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "The Silent Hour",
          body: "It is the time of Tahajjud. A moment for deep reflection and conversation with your Lord.",
          categoryIdentifier: 'spiritual_window',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tahajjudDate },
      });
      newIds.push(id);
    }

    // 2. Morning Adhkar (fajr_post) - 20 mins after Fajr
    const morningDate = new Date();
    morningDate.setHours(fajrTime.hours, fajrTime.minutes + 20, 0, 0);

    if (morningDate > new Date()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Start with Light",
          body: "The sun is rising. Remember Allah with the morning adhkars to protect your day.",
          categoryIdentifier: 'spiritual_window',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: morningDate },
      });
      newIds.push(id);
    }

    // 3. Evening Adhkar (maghrib_pre) - 45 mins before Maghrib
    const maghribTime = this.parseTime(timings.Maghrib);
    const eveningDate = new Date();
    eveningDate.setHours(maghribTime.hours, maghribTime.minutes - 45, 0, 0);

    if (eveningDate > new Date()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Closing the Day",
          body: "The day is ending. Find peace in the evening remembrance before the night sets in.",
          categoryIdentifier: 'spiritual_window',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: eveningDate },
      });
      newIds.push(id);
    }

    await setTrackedIds(SPIRITUAL_NOTIF_IDS_KEY, newIds);
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
