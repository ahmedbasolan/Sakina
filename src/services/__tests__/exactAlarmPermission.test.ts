/**
 * exactAlarmPermission — Android 12+ only delivers scheduled notifications
 * on time if the app holds SCHEDULE_EXACT_ALARM. Android 12 auto-grants it
 * once declared in the manifest; Android 13+ (API 33) requires the user to
 * flip it on manually via a settings screen — there's no in-app runtime
 * dialog for this one. See notificationService.ts's scheduleWeeklyTrigger
 * doc comment for the full story (this was the cause of a real device
 * showing several unrelated prayer notifications all delivered at once).
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockStartActivityAsync = jest.fn().mockResolvedValue({ resultCode: 0 });
jest.mock('expo-intent-launcher', () => ({
  ActivityAction: { REQUEST_SCHEDULE_EXACT_ALARM: 'android.settings.REQUEST_SCHEDULE_EXACT_ALARM' },
  startActivityAsync: (...args: unknown[]) => mockStartActivityAsync(...args),
}));

jest.mock('expo-application', () => ({
  applicationId: 'com.lelahmed.sakina',
}));

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  needsExactAlarmPermission,
  openExactAlarmSettings,
  hasAskedExactAlarmPermission,
  markExactAlarmPermissionAsked,
} from '../exactAlarmPermission';

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  Platform.OS = 'android';
});

afterEach(() => {
  Platform.OS = 'ios';
});

describe('needsExactAlarmPermission', () => {
  it('is false on iOS regardless of API level', () => {
    expect(needsExactAlarmPermission('ios', 33)).toBe(false);
  });

  it('is false on Android 12 (API 31) — auto-granted once declared, no prompt needed', () => {
    expect(needsExactAlarmPermission('android', 31)).toBe(false);
  });

  it('is false on Android 12L (API 32) — still auto-granted', () => {
    expect(needsExactAlarmPermission('android', 32)).toBe(false);
  });

  it('is true on Android 13+ (API 33) — requires manual grant', () => {
    expect(needsExactAlarmPermission('android', 33)).toBe(true);
  });

  it('is true on newer Android versions too', () => {
    expect(needsExactAlarmPermission('android', 35)).toBe(true);
  });

  it('is false when the API level is a non-numeric string (iOS-shaped Platform.Version)', () => {
    // Guards the default-parameter wiring: iOS's Platform.Version is a
    // version string ("17.0"), not a number — this must never coerce into
    // a false-positive "true" on iOS.
    expect(needsExactAlarmPermission('ios', '17.0' as unknown as number)).toBe(false);
  });

  it('defaults to reading the real Platform.OS when called with no arguments', () => {
    Platform.OS = 'ios';
    expect(needsExactAlarmPermission()).toBe(false);
  });
});

describe('openExactAlarmSettings', () => {
  it('deep-links to this app\'s exact-alarm settings screen on Android', async () => {
    await openExactAlarmSettings();

    expect(mockStartActivityAsync).toHaveBeenCalledWith(
      'android.settings.REQUEST_SCHEDULE_EXACT_ALARM',
      { data: 'package:com.lelahmed.sakina' },
    );
  });

  it('does nothing on iOS, which has no such setting', async () => {
    Platform.OS = 'ios';

    await openExactAlarmSettings();

    expect(mockStartActivityAsync).not.toHaveBeenCalled();
  });
});

describe('the one-time "asked" flag', () => {
  it('starts unset', async () => {
    expect(await hasAskedExactAlarmPermission()).toBe(false);
  });

  it('is set after marking, and persists across calls', async () => {
    await markExactAlarmPermissionAsked();
    expect(await hasAskedExactAlarmPermission()).toBe(true);
  });
});
