/**
 * notificationTopUpTask — keeps the reminder queue full when the app
 * isn't opened.
 *
 * Prayer and spiritual-window reminders are scheduled as 7 one-shot DATE
 * triggers (prayer times shift daily, so repeating triggers would drift).
 * Without this task the queue runs dry after a few days of not opening
 * the app — exactly the users a daily companion most needs to reach.
 *
 * The OS wakes the app (WorkManager on Android, BGTaskScheduler on iOS),
 * we re-fetch timings for the saved location (PrayerTimesService falls
 * back to its cache offline) and re-schedule both categories.
 *
 * defineTask MUST run at module scope: on a headless launch the OS
 * executes the task without mounting any React component, so this module
 * is imported for its side effect from App.tsx.
 */
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import NotificationService from './notificationService';
import PrayerTimesService from './prayerTimesService';
import { getUserLocation } from './locationStorage';
import { logServiceError } from './errorLoggingService';

export const NOTIFICATION_TOPUP_TASK = 'sakina-notification-topup';

// Inexact minimum interval in minutes. Prayer times drift ~1–2 min/day, so
// twice a day keeps the 7-day queue fresh without waking the device often.
const TOPUP_INTERVAL_MINUTES = 12 * 60;

/**
 * Re-schedules prayer + spiritual-window notifications from the saved
 * location. Shared by the background task and available to foreground
 * callers. Returns false when there was nothing to do (permissions missing
 * or both categories disabled), true when a top-up ran.
 */
export async function topUpScheduledNotifications(): Promise<boolean> {
  const notifications = NotificationService.getInstance();

  // Never trigger a permission prompt from a headless task — only proceed
  // if the user already granted notifications in the foreground.
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return false;

  const [prayerEnabled, spiritualEnabled] = await Promise.all([
    notifications.getPrayerEnabled(),
    notifications.getSpiritualEnabled(),
  ]);
  if (!prayerEnabled && !spiritualEnabled) return false;

  const prayerService = PrayerTimesService.getInstance();
  const savedLocation = await getUserLocation();
  const city = savedLocation?.city || 'Dubai';
  const country = savedLocation?.country || 'UAE';

  const data =
    savedLocation?.latitude && savedLocation?.longitude
      ? await prayerService.getTimingsByCoordinates(
          savedLocation.latitude,
          savedLocation.longitude,
          country,
        )
      : await prayerService.getTimingsByCity(city, country);

  // Sequential like useHomeData — each call cancels-then-reschedules only
  // its own category, so one failing never wipes the other.
  await notifications.scheduleSpiritualReminders(data.timings);
  await notifications.schedulePrayerNotifications(data.timings, city);
  return true;
}

TaskManager.defineTask(NOTIFICATION_TOPUP_TASK, async () => {
  try {
    await topUpScheduledNotifications();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    logServiceError(
      'notificationTopUpTask',
      'run',
      error instanceof Error ? error : new Error(String(error)),
    );
    // Failed tells the OS the work didn't complete, so it retries sooner.
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * Idempotent registration (registerTaskAsync no-ops when already
 * registered, and warns-and-skips in Expo Go / simulators where background
 * tasks are restricted). Call once during app init.
 */
export async function registerNotificationTopUpTask(): Promise<void> {
  try {
    await BackgroundTask.registerTaskAsync(NOTIFICATION_TOPUP_TASK, {
      minimumInterval: TOPUP_INTERVAL_MINUTES,
    });
  } catch (error) {
    // Registration failure only means the queue relies on app-open top-ups
    // again — log it, never block startup.
    logServiceError(
      'notificationTopUpTask',
      'register',
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}
