/**
 * exactAlarmPermission — Android 12+ only delivers scheduled notifications
 * precisely if the app holds android.permission.SCHEDULE_EXACT_ALARM
 * (declared in app.json). Android 12/12L (API 31-32) auto-grant it once
 * declared, so there's nothing to prompt. Android 13+ (API 33) does NOT
 * auto-grant it — the user must flip it on manually via a settings screen,
 * since there's no in-app runtime dialog for this permission. See
 * notificationService.ts's scheduleWeeklyTrigger doc comment for why this
 * matters: without it, Android can defer and batch multiple unrelated
 * prayer notifications together, hours late.
 */
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ASKED_KEY = '@sakina_exact_alarm_asked';

/**
 * True only where the user must be asked — Android 13+ (API 33+).
 * `os`/`apiLevel` default to the real platform and are only ever overridden
 * in tests — `Platform.Version` on Android is a plain number (the API
 * level), unlike iOS's version string.
 */
export function needsExactAlarmPermission(
  os: typeof Platform.OS = Platform.OS,
  apiLevel: number | string = Platform.Version,
): boolean {
  return os === 'android' && typeof apiLevel === 'number' && apiLevel >= 33;
}

/**
 * Deep-links to this app's "Alarms & reminders" settings screen. There's no
 * reliable way to read back whether the user actually granted it — Settings
 * doesn't return a meaningful result here — so this is fire-and-forget by
 * design; callers shouldn't await a permission-changed outcome from it.
 */
export async function openExactAlarmSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const packageName = Application.applicationId;
  if (!packageName) return;
  await IntentLauncher.startActivityAsync(
    IntentLauncher.ActivityAction.REQUEST_SCHEDULE_EXACT_ALARM,
    { data: `package:${packageName}` },
  );
}

/**
 * Whether the one-time onboarding ask has already been shown. The manual
 * settings row in Daily Reminders is NOT gated by this — a deliberate
 * re-visit there is a user action, not a nag to suppress.
 */
export async function hasAskedExactAlarmPermission(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ASKED_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function markExactAlarmPermissionAsked(): Promise<void> {
  try {
    await AsyncStorage.setItem(ASKED_KEY, 'true');
  } catch {
    // Best effort — worst case the one-time onboarding ask repeats once.
  }
}
