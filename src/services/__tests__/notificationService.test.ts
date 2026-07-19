/**
 * notificationService — scheduling accuracy for the non-prayer reminders.
 *
 * Two device-reported inaccuracies (2026-07-19) drive these tests:
 *  1. The evening adhkar reminder fired at Maghrib−45 while the in-app
 *     evening window (determineContextFromTimings' maghrib_pre) opens at
 *     Maghrib−30 — the notification announced a window the app didn't show
 *     yet. The reminder must match the window boundary exactly.
 *  2. All 7 scheduled days were stamped with day-1's clock times, so later
 *     days drifted as prayer times shifted. Schedulers must accept a weekly
 *     timings array and anchor each day to its own times.
 */
const mockStore: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore[key] ?? null)),
  setItem: jest.fn((key: string, val: string) => {
    mockStore[key] = val;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStore[key];
    return Promise.resolve();
  }),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  AndroidNotificationPriority: { HIGH: 'high' },
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily' },
}));

import * as Notifications from 'expo-notifications';
import NotificationService from '../notificationService';
import { PrayerTimings } from '../prayerTimesService';

const mockSchedule = Notifications.scheduleNotificationAsync as jest.Mock;

const TIMINGS: PrayerTimings = {
  Fajr: '05:00',
  Sunrise: '06:20',
  Dhuhr: '12:30',
  Asr: '16:00',
  Maghrib: '19:00',
  Isha: '20:30',
};

/** All scheduled DATE triggers whose content title matches. */
const scheduledDatesFor = (title: string): Date[] =>
  mockSchedule.mock.calls
    .filter(([arg]) => arg.content.title === title)
    .map(([arg]) => arg.trigger.date as Date)
    .sort((a, b) => a.getTime() - b.getTime());

let service: NotificationService;

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  let id = 0;
  mockSchedule.mockImplementation(() => Promise.resolve(`id-${++id}`));
  // Fixed clock: a morning hour, so evening slots for day 0 are still in the
  // future and every day-offset schedules deterministically.
  jest.useFakeTimers({ now: new Date(2026, 6, 20, 8, 0, 0) });
  (NotificationService as any).instance = undefined;
  service = NotificationService.getInstance();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('scheduleSpiritualReminders — window alignment', () => {
  it('schedules the evening adhkar reminder at Maghrib−30, matching the in-app evening window', async () => {
    await service.scheduleSpiritualReminders(TIMINGS);

    const eveningDates = scheduledDatesFor('Closing the Day');
    expect(eveningDates).toHaveLength(7);
    for (const d of eveningDates) {
      expect(`${d.getHours()}:${d.getMinutes()}`).toBe('18:30');
    }
  });

  it('keeps Tahajjud at one hour before Fajr and morning adhkar at Fajr+20', async () => {
    await service.scheduleSpiritualReminders(TIMINGS);

    for (const d of scheduledDatesFor('The Silent Hour')) {
      expect(`${d.getHours()}:${d.getMinutes()}`).toBe('4:0');
    }
    for (const d of scheduledDatesFor('Start with Light')) {
      expect(`${d.getHours()}:${d.getMinutes()}`).toBe('5:20');
    }
  });

  it('anchors each day to that day’s own timings when given a weekly array', async () => {
    const weekly: PrayerTimings[] = Array.from({ length: 7 }, (_, i) => ({
      ...TIMINGS,
      // Maghrib drifts one minute later per day, like real timings do.
      Maghrib: `19:0${i}`,
    }));

    await service.scheduleSpiritualReminders(weekly);

    const eveningDates = scheduledDatesFor('Closing the Day');
    expect(eveningDates).toHaveLength(7);
    eveningDates.forEach((d, i) => {
      // Day i: Maghrib 19:0i → reminder at 18:3i.
      expect(d.getMinutes()).toBe(30 + i);
      expect(d.getHours()).toBe(18);
    });
  });
});

describe('schedulePrayerNotifications — per-day accuracy', () => {
  it('uses each day’s own time from a weekly timings array', async () => {
    const weekly: PrayerTimings[] = Array.from({ length: 7 }, (_, i) => ({
      ...TIMINGS,
      Fajr: `05:0${i}`,
    }));

    await service.schedulePrayerNotifications(weekly, 'Dubai');

    // Day 0's Fajr (05:00) is already past at the mocked 08:00, so offsets
    // 1..6 remain — each at its own drifted minute.
    const fajrDates = scheduledDatesFor('Time for Fajr');
    expect(fajrDates).toHaveLength(6);
    fajrDates.forEach((d, idx) => {
      const dayOffset = idx + 1;
      expect(d.getMinutes()).toBe(dayOffset);
      expect(d.getHours()).toBe(5);
    });
  });

  it('still accepts a single day’s timings (city-lookup path) and repeats them across the week', async () => {
    await service.schedulePrayerNotifications(TIMINGS, 'Dubai');

    const maghribDates = scheduledDatesFor('Time for Maghrib');
    expect(maghribDates).toHaveLength(7);
    for (const d of maghribDates) {
      expect(`${d.getHours()}:${d.getMinutes()}`).toBe('19:0');
    }
  });

  it('schedules nothing when permission is denied', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });

    await service.schedulePrayerNotifications(TIMINGS, 'Dubai');

    expect(mockSchedule).not.toHaveBeenCalled();
  });
});
