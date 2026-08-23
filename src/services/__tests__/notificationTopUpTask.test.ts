/**
 * notificationTopUpTask — the background top-up that keeps prayer/spiritual
 * reminder queues full when the app isn't opened for days.
 */

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn().mockResolvedValue(false),
}));

jest.mock('expo-background-task', () => ({
  registerTaskAsync: jest.fn().mockResolvedValue(undefined),
  BackgroundTaskResult: { Success: 1, Failed: 2 },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
}));

jest.mock('../notificationService', () => {
  const instance = {
    getPrayerEnabled: jest.fn(),
    getSpiritualEnabled: jest.fn(),
    getMoodCheckinEnabled: jest.fn(),
    scheduleSpiritualReminders: jest.fn().mockResolvedValue(undefined),
    schedulePrayerNotifications: jest.fn().mockResolvedValue(undefined),
    scheduleMoodCheckinNotifications: jest.fn().mockResolvedValue(undefined),
  };
  return { __esModule: true, default: { getInstance: () => instance }, __instance: instance };
});

jest.mock('../prayerTimesService', () => {
  const instance = {
    getTimingsByCity: jest.fn(),
    getWeeklyLocalTimings: jest.fn(),
  };
  return { __esModule: true, default: { getInstance: () => instance }, __instance: instance };
});

jest.mock('../locationStorage', () => ({
  getUserLocation: jest.fn(),
}));

jest.mock('../errorLoggingService', () => ({
  logServiceError: jest.fn(),
}));

import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import { getUserLocation } from '../locationStorage';
import {
  topUpScheduledNotifications,
  registerNotificationTopUpTask,
  NOTIFICATION_TOPUP_TASK,
} from '../notificationTopUpTask';

const mockDefineTask = TaskManager.defineTask as jest.Mock;
const mockRegisterTaskAsync = BackgroundTask.registerTaskAsync as jest.Mock;
const mockGetPermissions = Notifications.getPermissionsAsync as jest.Mock;
const mockGetUserLocation = getUserLocation as jest.Mock;
const mockNotificationInstance = (jest.requireMock('../notificationService') as any).__instance;
const mockPrayerInstance = (jest.requireMock('../prayerTimesService') as any).__instance;

// defineTask ran once, at import time — capture before beforeEach clears calls.
const defineTaskCall = mockDefineTask.mock.calls[0];

const TIMINGS = {
  Fajr: '04:00', Sunrise: '05:30', Dhuhr: '12:00',
  Asr: '15:30', Maghrib: '18:00', Isha: '19:30',
};

// The GPS path computes per-day timings for the whole week on-device.
const WEEKLY_TIMINGS = Array.from({ length: 7 }, (_, i) => ({ ...TIMINGS, Fajr: `04:0${i}` }));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPermissions.mockResolvedValue({ status: 'granted' });
  mockNotificationInstance.getPrayerEnabled.mockResolvedValue(true);
  mockNotificationInstance.getSpiritualEnabled.mockResolvedValue(true);
  mockNotificationInstance.getMoodCheckinEnabled.mockResolvedValue(true);
  mockNotificationInstance.scheduleSpiritualReminders.mockResolvedValue(undefined);
  mockNotificationInstance.schedulePrayerNotifications.mockResolvedValue(undefined);
  mockNotificationInstance.scheduleMoodCheckinNotifications.mockResolvedValue(undefined);
  mockPrayerInstance.getTimingsByCity.mockResolvedValue({ timings: TIMINGS });
  mockPrayerInstance.getWeeklyLocalTimings.mockReturnValue(WEEKLY_TIMINGS);
  mockRegisterTaskAsync.mockResolvedValue(undefined);
});

describe('topUpScheduledNotifications', () => {
  it('re-schedules all categories from on-device weekly timings when coordinates are saved', async () => {
    mockGetUserLocation.mockResolvedValue({
      city: 'Dubai', country: 'AE', latitude: 25.2, longitude: 55.3,
    });

    const ran = await topUpScheduledNotifications();

    expect(ran).toBe(true);
    expect(mockPrayerInstance.getWeeklyLocalTimings).toHaveBeenCalledWith(25.2, 55.3, 'AE');
    // No network fetch at all on the GPS path — background connectivity is
    // the least reliable place to depend on it.
    expect(mockPrayerInstance.getTimingsByCity).not.toHaveBeenCalled();
    expect(mockNotificationInstance.scheduleSpiritualReminders).toHaveBeenCalledWith(WEEKLY_TIMINGS);
    expect(mockNotificationInstance.schedulePrayerNotifications).toHaveBeenCalledWith(WEEKLY_TIMINGS, 'Dubai');
    expect(mockNotificationInstance.scheduleMoodCheckinNotifications).toHaveBeenCalledWith(WEEKLY_TIMINGS);
  });

  it('falls back to city lookup (Dubai default) when no location is saved', async () => {
    mockGetUserLocation.mockResolvedValue(null);

    const ran = await topUpScheduledNotifications();

    expect(ran).toBe(true);
    expect(mockPrayerInstance.getTimingsByCity).toHaveBeenCalledWith('Dubai', 'UAE');
    expect(mockPrayerInstance.getWeeklyLocalTimings).not.toHaveBeenCalled();
    expect(mockNotificationInstance.scheduleSpiritualReminders).toHaveBeenCalledWith(TIMINGS);
    expect(mockNotificationInstance.scheduleMoodCheckinNotifications).toHaveBeenCalledWith(TIMINGS);
  });

  it('does nothing without notification permission (never prompts headless)', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'denied' });

    const ran = await topUpScheduledNotifications();

    expect(ran).toBe(false);
    expect(mockGetUserLocation).not.toHaveBeenCalled();
    expect(mockNotificationInstance.schedulePrayerNotifications).not.toHaveBeenCalled();
  });

  it('does nothing when all reminder categories are disabled', async () => {
    mockNotificationInstance.getPrayerEnabled.mockResolvedValue(false);
    mockNotificationInstance.getSpiritualEnabled.mockResolvedValue(false);
    mockNotificationInstance.getMoodCheckinEnabled.mockResolvedValue(false);

    const ran = await topUpScheduledNotifications();

    expect(ran).toBe(false);
    expect(mockPrayerInstance.getTimingsByCity).not.toHaveBeenCalled();
  });

  it('propagates fetch errors so the task can report Failed to the OS', async () => {
    mockGetUserLocation.mockResolvedValue(null);
    mockPrayerInstance.getTimingsByCity.mockRejectedValue(new Error('offline, no cache'));

    await expect(topUpScheduledNotifications()).rejects.toThrow('offline, no cache');
  });
});

describe('background task wiring', () => {
  it('defines the task at module scope (required for headless launches)', () => {
    expect(defineTaskCall[0]).toBe(NOTIFICATION_TOPUP_TASK);
    expect(typeof defineTaskCall[1]).toBe('function');
  });

  it('the defined task returns Success when top-up works and Failed on error', async () => {
    const taskFn = defineTaskCall[1] as () => Promise<number>;

    mockGetUserLocation.mockResolvedValue(null);
    await expect(taskFn()).resolves.toBe(1); // Success

    mockPrayerInstance.getTimingsByCity.mockRejectedValue(new Error('boom'));
    await expect(taskFn()).resolves.toBe(2); // Failed — OS will retry
  });

  it('registerNotificationTopUpTask registers with a 12-hour minimum interval', async () => {
    await registerNotificationTopUpTask();
    expect(mockRegisterTaskAsync).toHaveBeenCalledWith(NOTIFICATION_TOPUP_TASK, {
      minimumInterval: 720,
    });
  });

  it('registration failure is swallowed (never blocks startup)', async () => {
    mockRegisterTaskAsync.mockRejectedValueOnce(new Error('restricted'));
    await expect(registerNotificationTopUpTask()).resolves.toBeUndefined();
  });
});
