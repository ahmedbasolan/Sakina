/**
 * notificationRouter — centralised handler for notification taps.
 *
 * Lives at the app root (inside NavigationContainer) so it catches taps
 * regardless of which screen is mounted — previously the listener was
 * inside HomeScreen and silently missed taps that arrived while the user
 * was on a different screen or the app was cold-started.
 *
 * Each notification category carries a `data.action` string that this
 * router maps to a screen. The navigation happens through a ref exposed
 * from NavigationContainer, not through component-scoped `navigation`.
 */
import * as Notifications from 'expo-notifications';
import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type NotificationAction =
  | 'mood_checkin'
  | 'prayer_times'
  | 'spiritual_window'
  | 'daily_guidance'
  | 'mood_calendar'
  | 'journey_continue'
  | 'quran_verse';

function navigateFromAction(action: NotificationAction | undefined, data: Record<string, unknown> = {}) {
  if (!action || !navigationRef.isReady()) return;

  switch (action) {
    case 'mood_checkin':
      // Open the Heart Check-In popup modal on HomeScreen
      navigationRef.navigate('Main' as any, {
        screen: 'Home',
        params: { openCheckIn: true, window: data.window || 'morning' },
      } as any);
      break;

    case 'prayer_times':
      navigationRef.navigate('PrayerTimes');
      break;

    case 'spiritual_window':
      // Stay on HomeScreen to see the spiritual window verse banner
      navigationRef.navigate('Main');
      break;

    case 'daily_guidance':
      // Open the Heart Check-In popup modal on HomeScreen
      navigationRef.navigate('Main' as any, {
        screen: 'Home',
        params: { openCheckIn: true },
      } as any);
      break;

    case 'mood_calendar':
      navigationRef.navigate('MoodHistory');
      break;

    case 'journey_continue':
      // Goes directly to the Journeys tab inside Main
      navigationRef.navigate('Main' as any, { screen: 'Journeys' } as any);
      break;

    case 'quran_verse':
      navigationRef.navigate('QuranLibrary');
      break;

    default:
      break;
  }
}

/**
 * Handles a notification response (tap). Shared by the real-time listener
 * and the cold-start check (getLastNotificationResponseAsync).
 */
function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response?.notification?.request?.content?.data as Record<string, unknown> | undefined;
  if (!data?.action) return;
  navigateFromAction(data.action as NotificationAction, data);
}

/**
 * Sets up two listeners:
 *
 * 1. `addNotificationResponseReceivedListener` — fires when the user taps a
 *    notification while the app is running or backgrounded.
 *
 * 2. `getLastNotificationResponseAsync` — catches the cold-start case where
 *    the OS launched the app from a notification tap and the listener wasn't
 *    registered fast enough. Expo docs recommend this pattern.
 *
 * Call this once from App.tsx after the NavigationContainer has mounted.
 * Returns a cleanup function for the listener subscription.
 */
export function setupNotificationRouter(): () => void {
  // Real-time listener
  const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

  // Cold-start catch-up: the app may have been launched FROM a notification tap.
  // `getLastNotificationResponseAsync` returns the response that opened the app.
  // We wait a small tick for the navigation tree to mount before navigating.
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      // Small delay ensures navigationRef.isReady() is true — the ref is
      // assigned synchronously by NavigationContainer on mount, but the
      // useEffect that calls setupNotificationRouter may fire before the
      // navigator's internal state has initialised.
      setTimeout(() => handleNotificationResponse(response), 500);
    }
  });

  return () => subscription.remove();
}
