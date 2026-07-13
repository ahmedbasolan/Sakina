import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes } from 'adhan';
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

const MOCK_HIJRI_RESPONSE = {
  code: 200,
  data: {
    hijri: { day: '4', month: { en: 'Muharram', ar: '' }, year: '1448', designation: { abbreviated: 'AH' } },
  },
};

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Formats an adhan.js Date the same way the service does, so expectations
// aren't hardcoded clock strings that could drift from a real astronomical
// calculation or the test runner's timezone.
const fmt = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);

describe('PrayerTimesService.getTimingsByCoordinates', () => {
  let service: PrayerTimesService;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    (PrayerTimesService as any).instance = null;
    service = PrayerTimesService.getInstance();
    mockedAxios.get.mockResolvedValue({ data: MOCK_HIJRI_RESPONSE });
  });

  it('computes timings locally via adhan.js instead of calling the timings network endpoint', async () => {
    await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    const calledUrls = mockedAxios.get.mock.calls.map((c) => c[0]);
    expect(calledUrls.every((url) => !String(url).includes('/timings'))).toBe(true);
  });

  it('matches adhan.js Dubai-method output for Gulf coordinates', async () => {
    const result = await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    const expected = new AdhanPrayerTimes(new Coordinates(25.20, 55.27), new Date(), CalculationMethod.Dubai());
    expect(result.timings.Fajr).toBe(fmt(expected.fajr));
    expect(result.timings.Dhuhr).toBe(fmt(expected.dhuhr));
    expect(result.timings.Isha).toBe(fmt(expected.isha));
  });

  it('resolves the Dubai/Gulf method for ISO-2 "AE"', async () => {
    const result = await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    expect(result.meta.method.name).toBe('Gulf Region');
  });

  it('resolves the North America/ISNA method for ISO-2 "US"', async () => {
    const result = await service.getTimingsByCoordinates(40.71, -74.00, 'US');
    const expected = new AdhanPrayerTimes(new Coordinates(40.71, -74.00), new Date(), CalculationMethod.NorthAmerica());
    expect(result.meta.method.name).toBe('ISNA');
    expect(result.timings.Fajr).toBe(fmt(expected.fajr));
  });

  it('falls back to Muslim World League for a country adhan.js has no dedicated method for', async () => {
    const result = await service.getTimingsByCoordinates(36.8, 10.18, 'TN'); // Tunisia
    expect(result.meta.method.name).toBe('Muslim World League');
  });

  it('fetches the Hijri date from the location-independent gToH endpoint', async () => {
    const result = await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    expect(mockedAxios.get).toHaveBeenCalledWith('https://api.aladhan.com/v1/gToH/30-06-2026');
    expect(result.date.hijri.month.en).toBe('Muharram');
  });

  it('serves the cached Hijri date on a second call without hitting the network again', async () => {
    await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('uses the stale Hijri fallback when the network fails, but still returns fresh timings', async () => {
    await AsyncStorage.setItem('@hijri_date_fallback', JSON.stringify(MOCK_HIJRI_RESPONSE.data.hijri));
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'));
    const result = await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    expect(result.date.hijri.month.en).toBe('Muharram');
    expect(result.timings.Fajr).toMatch(/^\d{2}:\d{2}$/);
  });

  it('never throws when the Hijri fetch fails and nothing is cached — prayer times still resolve', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'));
    const result = await service.getTimingsByCoordinates(51.50, -0.12, 'GB');
    expect(result.timings.Fajr).toMatch(/^\d{2}:\d{2}$/);
    expect(result.date.hijri.day).toBe('');
  });
});
