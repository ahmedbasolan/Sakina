import {
  getCurrentCheckInWindow,
  MoodCheckinPromptService,
} from '../moodCheckinPromptService';
import { PrayerTimings } from '../prayerTimesService';

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

const mockGetDayDetail = jest.fn();
jest.mock('../moodHistoryService', () => ({
  moodHistoryService: {
    getDayDetail: (...args: any[]) => mockGetDayDetail(...args),
  },
}));

describe('MoodCheckinPromptService', () => {
  const dummyTimings: PrayerTimings = {
    Fajr: '05:00',
    Sunrise: '06:30',
    Dhuhr: '12:30',
    Asr: '15:45',
    Maghrib: '18:15',
    Isha: '19:45',
  };

  beforeEach(() => {
    for (const key of Object.keys(mockStore)) {
      delete mockStore[key];
    }
    mockGetDayDetail.mockReset();
    mockGetDayDetail.mockResolvedValue(null);
  });

  describe('getCurrentCheckInWindow', () => {
    it('returns "morning" when time is between Fajr (05:00) and Maghrib (18:15)', () => {
      const morningTime = new Date('2026-08-21T07:30:00');
      expect(getCurrentCheckInWindow(dummyTimings, morningTime)).toBe('morning');

      const afternoonTime = new Date('2026-08-21T14:30:00');
      expect(getCurrentCheckInWindow(dummyTimings, afternoonTime)).toBe('morning');
    });

    it('returns "night" when time is after Maghrib (18:15)', () => {
      const nightTime = new Date('2026-08-21T21:00:00');
      expect(getCurrentCheckInWindow(dummyTimings, nightTime)).toBe('night');
    });

    it('returns "night" when time is in the early morning before Fajr (e.g. 03:00)', () => {
      const lateNightTime = new Date('2026-08-21T03:00:00');
      expect(getCurrentCheckInWindow(dummyTimings, lateNightTime)).toBe('night');
    });

    it('falls back gracefully to clock-based windows when timings are null', () => {
      const morningFallback = new Date('2026-08-21T08:00:00');
      expect(getCurrentCheckInWindow(null, morningFallback)).toBe('morning');

      const afternoonFallback = new Date('2026-08-21T15:00:00');
      expect(getCurrentCheckInWindow(null, afternoonFallback)).toBe('morning');

      const nightFallback = new Date('2026-08-21T22:00:00');
      expect(getCurrentCheckInWindow(null, nightFallback)).toBe('night');
    });
  });

  describe('shouldShowPrompt', () => {
    it('returns window when user has not logged their mood today', async () => {
      const service = MoodCheckinPromptService.getInstance();
      const morningTime = new Date('2026-08-21T06:00:00');

      const result = await service.shouldShowPrompt(dummyTimings, morningTime);
      expect(result).toBe('morning');
    });

    it('returns night window when user has not logged their mood and it is night time', async () => {
      const service = MoodCheckinPromptService.getInstance();
      const nightTime = new Date('2026-08-21T21:00:00');

      const result = await service.shouldShowPrompt(dummyTimings, nightTime);
      expect(result).toBe('night');
    });

    it('returns null once user has logged a mood today (stays dismissed once logged)', async () => {
      const service = MoodCheckinPromptService.getInstance();
      const checkTime = new Date('2026-08-21T10:00:00');

      mockGetDayDetail.mockResolvedValueOnce({
        date: '2026-08-21',
        mood: 'Grateful',
        entries: [
          {
            timestamp: new Date('2026-08-21T09:15:00').getTime(),
            mood: 'Grateful',
            angleId: 'ang1',
            contentId: 'cont1',
          },
        ],
      });

      const result = await service.shouldShowPrompt(dummyTimings, checkTime);
      expect(result).toBeNull();
    });
  });
});
