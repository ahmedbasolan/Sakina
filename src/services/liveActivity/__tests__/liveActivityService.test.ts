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

jest.mock('../../../../modules/sakina-live-activity', () => ({
  isSupported: jest.fn(() => true),
  configure: jest.fn(),
  getDeviceId: jest.fn(() => 'device-123'),
  writeSnapshot: jest.fn(),
  startLocal: jest.fn(() => Promise.resolve(true)),
  endAll: jest.fn(() => Promise.resolve()),
  clearShared: jest.fn(),
}));

const mockInvoke = jest.fn();
jest.mock('../../../config/supabaseClient', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => mockInvoke(...a) } },
}));

const mockIsPremium = jest.fn(() => true);
jest.mock('../../subscriptionService', () => ({
  SubscriptionService: { getInstance: () => ({ isPremium: () => mockIsPremium() }) },
}));

jest.mock('../../errorLoggingService', () => ({ logServiceError: jest.fn() }));

jest.mock('../../dailyVerseService', () => {
  const actual = jest.requireActual('../../dailyVerseService');
  return {
    ...actual,
    getDailyVerse: jest.fn(() => Promise.resolve(actual.getDailyVerseSync())),
  };
});

import * as native from '../../../../modules/sakina-live-activity';
import { logServiceError } from '../../errorLoggingService';
import {
  LiveActivityService,
  LIVE_ACTIVITY_PREF_KEY,
  LIVE_ACTIVITY_MOOD_VERSE_KEY,
} from '../liveActivityService';
import type { Content } from '../../../types';
import type { PrayerTimings } from '../../prayerTimesService';

const n = native as jest.Mocked<typeof native>;

const day: PrayerTimings = {
  Fajr: '05:00',
  Sunrise: '06:15',
  Dhuhr: '12:30',
  Asr: '15:45',
  Maghrib: '18:20',
  Isha: '19:45',
};
const weekly: PrayerTimings[] = Array.from({ length: 7 }, () => day);

const quran = (over: Partial<Content> = {}): Content =>
  ({
    id: 'quran_93_4',
    type: 'Quran',
    primaryText: 'p',
    arabicText: 'وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ',
    englishTranslation: 'And the Hereafter is better for you than the first.',
    source: 'Quran 93:4',
    ...over,
  }) as Content;

const svc = () => LiveActivityService.getInstance();

describe('LiveActivityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const k of Object.keys(mockStore)) delete mockStore[k];
    n.isSupported.mockReturnValue(true);
    n.getDeviceId.mockReturnValue('device-123');
    n.clearShared.mockImplementation(() => undefined);
    mockIsPremium.mockReturnValue(true);
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    jest.setSystemTime(new Date('2026-03-10T08:00:00Z'));
  });
  afterEach(() => jest.useRealTimers());

  it('does nothing when unsupported', async () => {
    n.isSupported.mockReturnValue(false);
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    await svc().sync(weekly, '24h');
    expect(n.configure).not.toHaveBeenCalled();
    expect(n.endAll).not.toHaveBeenCalled();
    expect(n.clearShared).not.toHaveBeenCalled();
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('switch off unregisters and ends cards', async () => {
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'false';
    mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY] = '{}';
    await svc().sync(weekly, '24h');
    expect(n.endAll).toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledWith('live-activity-register', {
      body: { action: 'unregister', deviceId: 'device-123' },
    });
    expect(n.clearShared).toHaveBeenCalled();
    expect(mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY]).toBeUndefined();
    expect(n.startLocal).not.toHaveBeenCalled();
  });

  it('reads the device id before clearing shared storage', async () => {
    const order: string[] = [];
    n.getDeviceId.mockImplementation(() => {
      order.push('getDeviceId');
      return 'device-123';
    });
    n.clearShared.mockImplementation(() => {
      order.push('clearShared');
    });
    await svc().disableAndForget();
    expect(order).toEqual(['getDeviceId', 'clearShared']);
  });

  it('non-Pro unregisters even if switch is on', async () => {
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    mockIsPremium.mockReturnValue(false);
    await svc().sync(weekly, '24h');
    expect(n.endAll).toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledWith('live-activity-register', {
      body: { action: 'unregister', deviceId: 'device-123' },
    });
    expect(n.writeSnapshot).not.toHaveBeenCalled();
  });

  it('register payload carries times only', async () => {
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    await svc().sync(weekly, '24h');
    expect(n.configure).toHaveBeenCalledWith(
      expect.objectContaining({ registerUrl: expect.stringContaining('/functions/v1/live-activity-register') }),
    );
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    const [fn, opts] = mockInvoke.mock.calls[0];
    expect(fn).toBe('live-activity-register');
    const body = opts.body;
    expect(Object.keys(body).sort()).toEqual(
      ['action', 'apnsEnv', 'deviceId', 'rcAppUserId', 'schedule', 'timeZone'].sort(),
    );
    expect(body.action).toBe('register');
    expect(body.deviceId).toBe('device-123');
    expect(body.apnsEnv).toBe('sandbox'); // __DEV__ is true under Jest
    expect(body.rcAppUserId).toBe('$RCAnonymousID:test-user');
    expect(body.schedule.length).toBeGreaterThan(0);
    expect(JSON.stringify(body)).not.toMatch(/latitude|longitude|city|mood|arabic|english/i);
  });

  it('writes the snapshot and starts a card for the next prayer after now', async () => {
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    await svc().sync(weekly, '12h');
    expect(n.writeSnapshot).toHaveBeenCalledTimes(1);
    const snap = JSON.parse(n.writeSnapshot.mock.calls[0][0]);
    expect(snap.version).toBe(1);
    expect(snap.timeFormat).toBe('12h');
    expect(snap.mood).toBeNull();
    const schedule = mockInvoke.mock.calls[0][1].body.schedule as { name: string; at: number }[];
    const nowS = Date.now() / 1000;
    const next = schedule.find((p) => p.at > nowS)!;
    expect(n.startLocal).toHaveBeenCalledWith(next.name, next.at);
  });

  it('skips startLocal when no prayer is left in the schedule', async () => {
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    await svc().sync([], '24h');
    expect(n.startLocal).not.toHaveBeenCalled();
  });

  it('sync includes a stored mood verse in the snapshot', async () => {
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    const mood = { arabic: 'a', english: 'e', ref: 'Quran 1:1', dateKey: '2026-03-10' };
    mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY] = JSON.stringify(mood);
    await svc().sync(weekly, '24h');
    expect(JSON.parse(n.writeSnapshot.mock.calls[0][0]).mood).toEqual(mood);
  });

  describe('onVerseShown', () => {
    beforeEach(() => {
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    });

    it('ignores non-Quran content', async () => {
      await svc().onVerseShown(quran({ type: 'Hadith' }));
      expect(mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY]).toBeUndefined();
      expect(n.writeSnapshot).not.toHaveBeenCalled();
    });

    it('stores a Quran verse and rewrites the snapshot', async () => {
      await svc().onVerseShown(quran());
      const stored = JSON.parse(mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY]);
      expect(stored.ref).toBe('Quran 93:4');
      expect(stored.dateKey).toBe('2026-03-10');
      expect(n.writeSnapshot).toHaveBeenCalledTimes(1);
      expect(JSON.parse(n.writeSnapshot.mock.calls[0][0]).mood).toEqual(stored);
    });

    it('does nothing for non-Pro users or when the switch is off', async () => {
      mockIsPremium.mockReturnValue(false);
      await svc().onVerseShown(quran());
      mockIsPremium.mockReturnValue(true);
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'false';
      await svc().onVerseShown(quran());
      expect(mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY]).toBeUndefined();
      expect(n.writeSnapshot).not.toHaveBeenCalled();
    });

    it('does nothing when unsupported', async () => {
      n.isSupported.mockReturnValue(false);
      await svc().onVerseShown(quran());
      expect(n.writeSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('setEnabled / getEnabled', () => {
    it('defaults to disabled and round-trips', async () => {
      expect(await svc().getEnabled()).toBe(false);
      await svc().setEnabled(true);
      expect(await svc().getEnabled()).toBe(true);
    });

    it('turning off disables and forgets', async () => {
      await svc().setEnabled(true);
      await svc().setEnabled(false);
      expect(await svc().getEnabled()).toBe(false);
      expect(n.endAll).toHaveBeenCalled();
      expect(n.clearShared).toHaveBeenCalled();
    });
  });

  describe('never throws', () => {
    it('swallows and logs a failed register', async () => {
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
      mockInvoke.mockRejectedValue(new Error('network'));
      await expect(svc().sync(weekly, '24h')).resolves.toBeUndefined();
      expect(logServiceError).toHaveBeenCalled();
    });

    it('unregister failure is logged, and clearShared still runs', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('500') });
      await expect(svc().disableAndForget()).resolves.toBeUndefined();
      expect(logServiceError).toHaveBeenCalled();
      expect(n.clearShared).toHaveBeenCalled();
    });

    it('swallows a native throw in disableAndForget', async () => {
      n.getDeviceId.mockImplementation(() => {
        throw new Error('boom');
      });
      await expect(svc().disableAndForget()).resolves.toBeUndefined();
    });
  });
});
