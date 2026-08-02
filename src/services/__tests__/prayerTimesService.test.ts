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

const mockedGetUserLocation = require('../locationStorage').getUserLocation as jest.Mock;

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
    expect(mockedAxios.get).toHaveBeenCalledWith('https://api.aladhan.com/v1/gToH/30-06-2026', { timeout: 10000 });
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

describe('PrayerTimesService.getCurrentPrayerContext', () => {
  let service: PrayerTimesService;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    (PrayerTimesService as any).instance = null;
    service = PrayerTimesService.getInstance();
    mockedGetUserLocation.mockResolvedValue(null);
  });

  // This call gates every RotationEngine.getGuidance delivery (every mood
  // tap / "next verse"), so when GPS coordinates are on file it must resolve
  // entirely on-device — no axios call, regardless of connectivity.
  it('computes context locally from GPS coordinates without any network call', async () => {
    mockedGetUserLocation.mockResolvedValue({ city: 'Dubai', country: 'AE', latitude: 25.20, longitude: 55.27 });
    const contextSpy = jest.spyOn(service, 'determineContextFromTimings');

    const context = await service.getCurrentPrayerContext();

    expect(mockedAxios.get).not.toHaveBeenCalled();
    // The context value itself is time-of-day dependent ('general' is a
    // legitimate mid-morning answer), so assert the mechanism instead: it
    // was derived from locally computed timings, not an error fallback.
    expect(contextSpy).toHaveBeenCalledWith(
      expect.objectContaining({ Fajr: expect.stringMatching(/^\d{2}:\d{2}$/) }),
    );
    expect(context).toBeTruthy();
  });

  it('falls back to the city-name network lookup when no coordinates are saved', async () => {
    mockedGetUserLocation.mockResolvedValue({ city: 'Dubai', country: 'AE' });
    mockedAxios.get.mockResolvedValue({
      data: {
        code: 200,
        data: {
          timings: { Fajr: '05:00', Sunrise: '06:20', Dhuhr: '12:10', Asr: '15:30', Maghrib: '18:40', Isha: '20:00' },
        },
      },
    });

    await service.getCurrentPrayerContext();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.aladhan.com/v1/timingsByCity',
      expect.objectContaining({ params: expect.objectContaining({ city: 'Dubai', country: 'AE' }) }),
    );
  });

  it('falls back to Dubai/UAE city lookup when no location was ever saved', async () => {
    mockedGetUserLocation.mockResolvedValue(null);
    mockedAxios.get.mockResolvedValue({
      data: {
        code: 200,
        data: {
          timings: { Fajr: '05:00', Sunrise: '06:20', Dhuhr: '12:10', Asr: '15:30', Maghrib: '18:40', Isha: '20:00' },
        },
      },
    });

    await service.getCurrentPrayerContext();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.aladhan.com/v1/timingsByCity',
      expect.objectContaining({ params: expect.objectContaining({ city: 'Dubai', country: 'UAE' }) }),
    );
  });

  it('returns "general" instead of throwing if the local computation fails unexpectedly', async () => {
    mockedGetUserLocation.mockResolvedValue({ city: 'Nowhere', country: 'AE', latitude: NaN, longitude: NaN });

    const context = await service.getCurrentPrayerContext();

    expect(context).toBe('general');
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });
});

describe('PrayerTimesService.getTimingsByCity request coalescing & failure cooldown', () => {
  let service: PrayerTimesService;
  const TIMINGS = { Fajr: '05:00', Sunrise: '06:20', Dhuhr: '12:10', Asr: '15:30', Maghrib: '18:40', Isha: '20:00' };
  const OK_RESPONSE = { data: { code: 200, data: { timings: TIMINGS } } };
  // Deterministic AsyncStorage keys for city=Dubai/country=AE: 'AE' resolves to
  // the Gulf method (aladhanId 8) and the default (Shafi'i/Standard) school (0).
  const CACHE_KEY = '@prayer_timings_Dubai_AE_m8_s0_2026-06-30';
  const FALLBACK_KEY = '@prayer_timings_Dubai_AE_m8_s0_fallback';

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    (PrayerTimesService as any).instance = null;
    service = PrayerTimesService.getInstance();
  });

  // A single Home mount fires several independent calls into this same key
  // (useHomeData's own fetch, FreemiumService.initialize's syncPrayerWindow,
  // fetchWindowGuidance's syncPrayerWindow) — without coalescing, each paid
  // its own retry cost, which is what read as GuidanceScreen "loading
  // endlessly" on a degraded connection.
  it('coalesces concurrent callers for the same city/method/day into a single request', async () => {
    mockedAxios.get.mockResolvedValue(OK_RESPONSE);

    const [a, b, c] = await Promise.all([
      service.getTimingsByCity('Dubai', 'AE'),
      service.getTimingsByCity('Dubai', 'AE'),
      service.getTimingsByCity('Dubai', 'AE'),
    ]);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it('does not re-hit the network on a repeat call within the failure cooldown', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network down'));

    await expect(service.getTimingsByCity('Dubai', 'AE')).rejects.toThrow();
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    // A second, independent caller (e.g. a different screen's own
    // syncPrayerWindow) moments later must not pay the retry cost again.
    await expect(service.getTimingsByCity('Dubai', 'AE')).rejects.toThrow();
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('serves the stale cross-day fallback on every call while the cooldown holds, without retrying each time', async () => {
    await AsyncStorage.setItem(FALLBACK_KEY, JSON.stringify({ timings: TIMINGS }));
    mockedAxios.get.mockRejectedValue(new Error('network down'));

    // First failure already falls back to the stale cache (pre-existing
    // behaviour) — this call resolves, it doesn't throw.
    const first = await service.getTimingsByCity('Dubai', 'AE');
    expect(first.timings).toEqual(TIMINGS);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    // A second, independent caller within the cooldown must be served the
    // same stale data without paying for another failed network attempt.
    const second = await service.getTimingsByCity('Dubai', 'AE');
    expect(second.timings).toEqual(TIMINGS);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1); // still 1 — cooldown skipped straight to the fallback
  });

  it('retries the network again once the cooldown has elapsed', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    try {
      mockedAxios.get.mockRejectedValue(new Error('network down'));
      await expect(service.getTimingsByCity('Dubai', 'AE')).rejects.toThrow();
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(61_000);
      mockedAxios.get.mockResolvedValue(OK_RESPONSE);
      const result = await service.getTimingsByCity('Dubai', 'AE');

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(result.timings).toEqual(TIMINGS);
    } finally {
      jest.useRealTimers();
    }
  });

  it('clears the failure record after a subsequent success, so cache/fallback stay in sync', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('network down'));
    await expect(service.getTimingsByCity('Dubai', 'AE')).rejects.toThrow();

    // Simulate the cooldown having already elapsed rather than waiting on it —
    // this test targets the delete-on-success behavior, not the cooldown timer.
    (service as any).recentCityFetchFailures.clear();
    mockedAxios.get.mockResolvedValue(OK_RESPONSE);
    const result = await service.getTimingsByCity('Dubai', 'AE');

    expect(result.timings).toEqual(TIMINGS);
    expect((service as any).recentCityFetchFailures.has(CACHE_KEY)).toBe(false);
  });
});

describe('PrayerTimesService.getWeeklyLocalTimings', () => {
  let service: PrayerTimesService;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    (PrayerTimesService as any).instance = null;
    service = PrayerTimesService.getInstance();
  });

  it('computes 7 consecutive days, each from its own date, with no network I/O', () => {
    const weekly = service.getWeeklyLocalTimings(25.20, 55.27, 'AE');

    expect(weekly).toHaveLength(7);
    const d6 = new Date();
    d6.setDate(d6.getDate() + 6);
    const expected = new AdhanPrayerTimes(new Coordinates(25.20, 55.27), d6, CalculationMethod.Dubai());
    expect(weekly[6].Fajr).toBe(fmt(expected.fajr));
    expect(weekly[6].Maghrib).toBe(fmt(expected.maghrib));
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('matches the single-day computation for day 0', async () => {
    const weekly = service.getWeeklyLocalTimings(25.20, 55.27, 'AE');
    const single = await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    expect(weekly[0]).toEqual(single.timings);
  });
});

describe('PrayerTimesService Hijri budget', () => {
  let service: PrayerTimesService;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    (PrayerTimesService as any).instance = null;
    service = PrayerTimesService.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not stall prayer timings behind a hanging Hijri fetch (day-rollover, dead network)', async () => {
    jest.useFakeTimers();
    // A request that never resolves — the worst-case degraded connection.
    mockedAxios.get.mockReturnValue(new Promise(() => {}) as any);

    const pending = service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    await jest.advanceTimersByTimeAsync(3000);
    const result = await pending;

    expect(result.timings.Fajr).toMatch(/^\d{2}:\d{2}$/);
    expect(result.date.hijri.day).toBe(''); // decorative date degraded, times intact
  });

  it('serves the stale Hijri fallback when the budget elapses', async () => {
    jest.useFakeTimers();
    await AsyncStorage.setItem('@hijri_date_fallback', JSON.stringify(MOCK_HIJRI_RESPONSE.data.hijri));
    mockedAxios.get.mockReturnValue(new Promise(() => {}) as any);

    const pending = service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    await jest.advanceTimersByTimeAsync(3000);
    const result = await pending;

    expect(result.date.hijri.month.en).toBe('Muharram');
  });
});
