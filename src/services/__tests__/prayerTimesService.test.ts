import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import PrayerTimesService from '../prayerTimesService';

const mockStore: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore[key] ?? null)),
  setItem: jest.fn((key: string, val: string) => { mockStore[key] = val; return Promise.resolve(); }),
  removeItem: jest.fn((key: string) => { delete mockStore[key]; return Promise.resolve(); }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(mockStore))),
  multiRemove: jest.fn((keys: string[]) => { keys.forEach((k) => delete mockStore[k]); return Promise.resolve(); }),
}));

jest.mock('axios');

jest.mock('../retryUtils', () => ({
  withRetry: jest.fn((fn: () => any) => fn()),
  AXIOS_RETRY_CONFIG: {},
}));

jest.mock('../errorLoggingService', () => ({
  logNetworkError: jest.fn(),
  logServiceError: jest.fn(),
}));

jest.mock('../../utils/date', () => ({
  formatDateYMD: jest.fn(() => '2026-06-30'),
  formatDateDMY: jest.fn(() => '30-06-2026'),
  todayYMD: jest.fn(() => '2026-06-30'),
  yesterdayYMD: jest.fn(() => '2026-06-29'),
  subtractDays: jest.fn((d: Date) => d),
}));

jest.mock('../locationStorage', () => ({
  getUserLocation: jest.fn().mockResolvedValue(null),
}));

const MOCK_DATA = {
  timings: {
    Fajr: '04:00', Sunrise: '05:30', Dhuhr: '12:00',
    Asr: '15:30', Maghrib: '18:00', Isha: '19:30',
  },
  date: {
    readable: '30 Jun 2026',
    hijri: { day: '4', month: { en: 'Muharram', ar: '' }, year: '1448', designation: { abbreviated: 'AH' } },
  },
  meta: { method: { name: 'Gulf Region' }, timezone: 'Asia/Dubai' },
};

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PrayerTimesService.getTimingsByCoordinates', () => {
  let service: PrayerTimesService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the in-memory AsyncStorage store between tests so cached data
    // from a previous test cannot leak into the next one.
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    (PrayerTimesService as any).instance = null;
    service = PrayerTimesService.getInstance();
    mockedAxios.get.mockResolvedValue({ data: { code: 200, data: MOCK_DATA } });
  });

  it('fetches from Aladhan coords endpoint with correct params', async () => {
    await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.aladhan.com/v1/timings/30-06-2026',
      expect.objectContaining({
        params: expect.objectContaining({
          latitude: 25.20,
          longitude: 55.27,
          method: 8,
        }),
      }),
    );
  });

  it('returns timings from the response', async () => {
    const result = await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    expect(result.timings.Fajr).toBe('04:00');
    expect(result.timings.Isha).toBe('19:30');
  });

  it('serves cache on second call without hitting the network', async () => {
    await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('resolves method 8 for ISO-2 "AE" (Gulf Region)', async () => {
    await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    const config = mockedAxios.get.mock.calls[0][1];
    expect(config?.params?.method).toBe(8);
  });

  it('resolves method 2 for ISO-2 "US" (ISNA)', async () => {
    await service.getTimingsByCoordinates(40.71, -74.00, 'US');
    const config = mockedAxios.get.mock.calls[0][1];
    expect(config?.params?.method).toBe(2);
  });

  it('uses stale fallback cache when network fails', async () => {
    const fallbackKey = '@prayer_timings_lat25.20_lon55.27_m8_fallback';
    await AsyncStorage.setItem(fallbackKey, JSON.stringify(MOCK_DATA));
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'));
    const result = await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    expect(result.timings.Fajr).toBe('04:00');
  });

  it('throws when network fails and no fallback exists', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'));
    await expect(service.getTimingsByCoordinates(51.50, -0.12, 'GB')).rejects.toThrow('network error');
  });
});
