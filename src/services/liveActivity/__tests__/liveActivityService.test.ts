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

// The App Group, as the native module keeps it: getDeviceId mints an id (and
// lifts a switched-off mark), peekDeviceId never does, clearShared deletes it.
const mockNative = { id: '', switchedOff: false, minted: 0 };
const MINTED_IDS = ['device-123', 'device-456', 'device-789'];
const mockMint = (): string => {
  mockNative.switchedOff = false;
  if (!mockNative.id) mockNative.id = MINTED_IDS[mockNative.minted++];
  return mockNative.id;
};
const mockPeek = (): string => mockNative.id;
const mockClearShared = (): void => {
  mockNative.id = '';
  mockNative.switchedOff = false;
};
const mockMarkSwitchedOff = (): void => {
  mockNative.switchedOff = true;
};

jest.mock('../../../../modules/sakina-live-activity', () => ({
  isSupported: jest.fn(() => true),
  configure: jest.fn(),
  getDeviceId: jest.fn(() => mockMint()),
  peekDeviceId: jest.fn(() => mockPeek()),
  writeSnapshot: jest.fn(),
  startLocal: jest.fn(() => Promise.resolve(true)),
  endAll: jest.fn(() => Promise.resolve()),
  markSwitchedOff: jest.fn(() => mockMarkSwitchedOff()),
  clearShared: jest.fn(() => mockClearShared()),
}));

const mockInvoke = jest.fn();
jest.mock('../../../config/supabaseClient', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => mockInvoke(...a) } },
  supabaseUrl: 'https://project.test.supabase.co',
  supabaseAnonKey: 'anon-key-test',
}));

const mockIsPremium = jest.fn(() => true);
const mockHasLoaded = jest.fn(() => true);
const mockLoadedCallbacks: Array<() => void> = [];
const mockOnLoaded = jest.fn((cb: () => void) => {
  if (mockHasLoaded()) cb();
  else mockLoadedCallbacks.push(cb);
});
jest.mock('../../subscriptionService', () => ({
  SubscriptionService: {
    getInstance: () => ({
      isPremium: () => mockIsPremium(),
      hasLoaded: () => mockHasLoaded(),
      onLoaded: (cb: () => void) => mockOnLoaded(cb),
    }),
  },
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { getAppUserID: () => mockGetAppUserID() },
}));
const mockGetAppUserID = jest.fn((): Promise<string> => Promise.resolve('$RCAnonymousID:test-user'));

jest.mock('../../errorLoggingService', () => ({ logServiceError: jest.fn() }));

jest.mock('../../dailyVerseService', () => {
  const actual = jest.requireActual('../../dailyVerseService');
  return {
    ...actual,
    getDailyVerse: jest.fn(() => Promise.resolve(actual.getDailyVerseSync())),
  };
});

import { getDailyVerse, type DailyVerse } from '../../dailyVerseService';
import * as native from '../../../../modules/sakina-live-activity';
import { logServiceError } from '../../errorLoggingService';
import {
  LiveActivityService,
  LIVE_ACTIVITY_PREF_KEY,
  LIVE_ACTIVITY_MOOD_VERSE_KEY,
  LIVE_ACTIVITY_REGISTERED_KEY,
  LIVE_ACTIVITY_PENDING_UNREGISTER_KEY,
} from '../liveActivityService';
import type { Content } from '../../../types';
import type { PrayerTimings } from '../../prayerTimesService';

const actualDaily = jest.requireActual('../../dailyVerseService');
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
const OK = { data: { ok: true }, error: null };
const FAILED = { data: null, error: new Error('FunctionsFetchError') };
const actions = () => mockInvoke.mock.calls.map((c) => `${c[1].body.action}:${c[1].body.deviceId}`);
/** Lets a sync started by a callback (not awaited by the test) run to the end. */
const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

/** A device that registered earlier: an id in the App Group and the flag set. */
function registeredDevice(): void {
  mockNative.id = 'device-123';
  mockNative.minted = 1;
  mockStore[LIVE_ACTIVITY_REGISTERED_KEY] = 'true';
}

describe('LiveActivityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const k of Object.keys(mockStore)) delete mockStore[k];
    mockNative.id = '';
    mockNative.switchedOff = false;
    mockNative.minted = 0;
    mockLoadedCallbacks.length = 0;
    // A fresh service per test: no queue or deferred sync carried over.
    (LiveActivityService as unknown as { instance: LiveActivityService | null }).instance = null;
    n.isSupported.mockReturnValue(true);
    n.getDeviceId.mockImplementation(() => mockMint());
    n.peekDeviceId.mockImplementation(() => mockPeek());
    n.clearShared.mockImplementation(() => mockClearShared());
    n.markSwitchedOff.mockImplementation(() => mockMarkSwitchedOff());
    mockIsPremium.mockReturnValue(true);
    mockHasLoaded.mockReturnValue(true);
    mockGetAppUserID.mockImplementation(() => Promise.resolve('$RCAnonymousID:test-user'));
    mockInvoke.mockResolvedValue(OK);
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    jest.setSystemTime(new Date('2026-03-10T08:00:00Z'));
  });
  afterEach(() => jest.useRealTimers());

  it('does nothing when unsupported and never registered', async () => {
    n.isSupported.mockReturnValue(false);
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    await svc().sync(weekly, '24h');
    expect(n.configure).not.toHaveBeenCalled();
    expect(n.endAll).not.toHaveBeenCalled();
    expect(n.clearShared).not.toHaveBeenCalled();
    expect(n.getDeviceId).not.toHaveBeenCalled();
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('Live Activities turned off in iOS Settings after registering: tears down', async () => {
    registeredDevice();
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    n.isSupported.mockReturnValue(false);
    await svc().sync(weekly, '24h');
    expect(n.endAll).toHaveBeenCalled();
    expect(actions()).toEqual(['unregister:device-123']);
    expect(mockNative.id).toBe('');
    expect(mockStore[LIVE_ACTIVITY_REGISTERED_KEY]).toBeUndefined();
    expect(n.configure).not.toHaveBeenCalled();
  });

  it('switch off unregisters and ends cards', async () => {
    registeredDevice();
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'false';
    mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY] = '{}';
    await svc().sync(weekly, '24h');
    expect(n.endAll).toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke).toHaveBeenCalledWith('live-activity-register', {
      body: { action: 'unregister', deviceId: 'device-123' },
    });
    expect(n.clearShared).toHaveBeenCalled();
    expect(mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY]).toBeUndefined();
    expect(mockStore[LIVE_ACTIVITY_REGISTERED_KEY]).toBeUndefined();
    expect(mockStore[LIVE_ACTIVITY_PENDING_UNREGISTER_KEY]).toBeUndefined();
    expect(n.startLocal).not.toHaveBeenCalled();
  });

  it('switch-off user who never registered: no device id minted, no server call', async () => {
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'false';
    await svc().sync(weekly, '24h');
    await svc().setEnabled(false);
    await svc().disableAndForget();
    expect(n.getDeviceId).not.toHaveBeenCalled();
    expect(mockNative.id).toBe('');
    expect(mockInvoke).not.toHaveBeenCalled();
    // Local cleanup still runs.
    expect(n.endAll).toHaveBeenCalled();
    expect(n.clearShared).toHaveBeenCalled();
    expect(mockStore[LIVE_ACTIVITY_PENDING_UNREGISTER_KEY]).toBeUndefined();
  });

  it('a successful register sets the registered flag; a failed one does not', async () => {
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    mockInvoke.mockResolvedValue({ data: null, error: new Error('500') });
    await svc().sync(weekly, '24h');
    expect(mockStore[LIVE_ACTIVITY_REGISTERED_KEY]).toBeUndefined();
    mockInvoke.mockResolvedValue(OK);
    await svc().sync(weekly, '24h');
    expect(mockStore[LIVE_ACTIVITY_REGISTERED_KEY]).toBe('true');
  });

  it('a register that throws counts as maybe-registered, so switch-off unregisters it', async () => {
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    mockInvoke.mockRejectedValueOnce(new Error('socket closed after send'));
    await svc().sync(weekly, '24h');
    expect(mockStore[LIVE_ACTIVITY_REGISTERED_KEY]).toBe('true');
    expect(n.startLocal).not.toHaveBeenCalled();

    await svc().setEnabled(false);
    expect(actions()).toEqual(['register:device-123', 'unregister:device-123']);
    expect(mockNative.id).toBe('');
  });

  it('configures native again after a successful register, not after a failed one', async () => {
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    mockInvoke.mockResolvedValue({ data: null, error: new Error('500') });
    await svc().sync(weekly, '24h');
    expect(n.configure).toHaveBeenCalledTimes(1); // the initial one only

    n.configure.mockClear();
    mockInvoke.mockResolvedValue(OK);
    await svc().sync(weekly, '24h');
    expect(n.configure).toHaveBeenCalledTimes(2);
    expect(n.configure.mock.calls[1][0]).toEqual(n.configure.mock.calls[0][0]);
    // Order matters: the second configure comes after the register call.
    const registerOrder = mockInvoke.mock.invocationCallOrder[mockInvoke.mock.invocationCallOrder.length - 1];
    expect(n.configure.mock.invocationCallOrder[1]).toBeGreaterThan(registerOrder);
  });

  it('configures native with the URL and anon key from supabaseClient (not @env)', async () => {
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    await svc().sync(weekly, '24h');
    expect(n.configure).toHaveBeenCalledWith({
      registerUrl: 'https://project.test.supabase.co/functions/v1/live-activity-register',
      anonKey: 'anon-key-test',
    });
  });

  it('no local card after a failed register', async () => {
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    mockInvoke.mockResolvedValue({ data: null, error: new Error('500') });
    await svc().sync(weekly, '24h');
    expect(n.startLocal).not.toHaveBeenCalled();
  });

  it('peeks the device id (never mints) before clearing shared storage', async () => {
    registeredDevice();
    const order: string[] = [];
    n.peekDeviceId.mockImplementation(() => {
      order.push('peekDeviceId');
      return mockPeek();
    });
    n.clearShared.mockImplementation(() => {
      order.push('clearShared');
      mockClearShared();
    });
    await svc().disableAndForget();
    expect(order).toEqual(['peekDeviceId', 'clearShared']);
    expect(n.getDeviceId).not.toHaveBeenCalled();
  });

  it('non-Pro unregisters even if switch is on', async () => {
    registeredDevice();
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY] = '{}';
    mockIsPremium.mockReturnValue(false);
    await svc().sync(weekly, '24h');
    expect(n.endAll).toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke).toHaveBeenCalledWith('live-activity-register', {
      body: { action: 'unregister', deviceId: 'device-123' },
    });
    expect(mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY]).toBeUndefined();
    expect(n.writeSnapshot).not.toHaveBeenCalled();
  });

  it('subscription not loaded yet: sync does nothing at all', async () => {
    registeredDevice();
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY] = '{}';
    mockHasLoaded.mockReturnValue(false);
    mockIsPremium.mockReturnValue(false); // what an unloaded service reports
    await svc().sync(weekly, '24h');
    expect(n.configure).not.toHaveBeenCalled();
    expect(n.writeSnapshot).not.toHaveBeenCalled();
    expect(n.startLocal).not.toHaveBeenCalled();
    expect(n.endAll).not.toHaveBeenCalled();
    expect(n.getDeviceId).not.toHaveBeenCalled();
    expect(n.clearShared).not.toHaveBeenCalled();
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(mockStore[LIVE_ACTIVITY_REGISTERED_KEY]).toBe('true');
    expect(mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY]).toBe('{}');
  });

  describe('cold start: a sync skipped before the subscription loads runs once it has', () => {
    it('runs once, with the newest remembered args', async () => {
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
      mockHasLoaded.mockReturnValue(false);
      await svc().sync(weekly, '24h');
      await svc().sync(weekly, '12h');
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(n.writeSnapshot).not.toHaveBeenCalled();
      expect(mockOnLoaded).toHaveBeenCalledTimes(1); // one wait, however many skips

      mockHasLoaded.mockReturnValue(true);
      mockLoadedCallbacks.splice(0).forEach((cb) => cb());
      await settle();

      expect(actions()).toEqual(['register:device-123']);
      expect(n.writeSnapshot).toHaveBeenCalledTimes(1);
      expect(JSON.parse(n.writeSnapshot.mock.calls[0][0]).timeFormat).toBe('12h');
      expect(n.startLocal).toHaveBeenCalledTimes(1);
    });

    it('does not run again if a loaded sync already ran in the meantime', async () => {
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
      mockHasLoaded.mockReturnValue(false);
      await svc().sync(weekly, '24h');
      mockHasLoaded.mockReturnValue(true);
      await svc().sync(weekly, '24h'); // e.g. Home's focus sync after load
      mockLoadedCallbacks.splice(0).forEach((cb) => cb());
      await settle();
      expect(actions()).toEqual(['register:device-123']);
    });
  });

  describe('switch-off that cannot reach the server', () => {
    it('keeps the device id, marks the unregister pending, and still clears the device', async () => {
      registeredDevice();
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
      mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY] = '{}';
      mockInvoke.mockResolvedValue(FAILED);

      await svc().setEnabled(false);

      expect(actions()).toEqual(['unregister:device-123']);
      expect(mockNative.id).toBe('device-123'); // the only handle on the server row
      expect(n.clearShared).not.toHaveBeenCalled();
      expect(n.markSwitchedOff).toHaveBeenCalledTimes(1);
      expect(mockNative.switchedOff).toBe(true);
      expect(mockStore[LIVE_ACTIVITY_PENDING_UNREGISTER_KEY]).toBe('true');
      expect(mockStore[LIVE_ACTIVITY_REGISTERED_KEY]).toBe('true');
      // Local cleanup that is not the id still happens.
      expect(n.endAll).toHaveBeenCalled();
      expect(mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY]).toBeUndefined();
    });

    it('a thrown unregister (timeout) is treated the same', async () => {
      registeredDevice();
      mockInvoke.mockRejectedValue(new Error('timeout'));
      await expect(svc().disableAndForget()).resolves.toBeUndefined();
      expect(mockNative.id).toBe('device-123');
      expect(mockStore[LIVE_ACTIVITY_PENDING_UNREGISTER_KEY]).toBe('true');
      expect(n.clearShared).not.toHaveBeenCalled();
    });

    it('an unregistered-but-maybe-known id (register errored) is still unregistered', async () => {
      // getDeviceId minted the id for a register that answered with an error.
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
      mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('timeout') });
      await svc().sync(weekly, '24h');
      expect(mockStore[LIVE_ACTIVITY_REGISTERED_KEY]).toBeUndefined();

      await svc().setEnabled(false);
      expect(actions()).toEqual(['register:device-123', 'unregister:device-123']);
      expect(mockNative.id).toBe('');
    });

    it('the next sync retries the unregister first, whatever the subscription state, and clears on 2xx', async () => {
      registeredDevice();
      mockStore[LIVE_ACTIVITY_PENDING_UNREGISTER_KEY] = 'true';
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'false';
      mockHasLoaded.mockReturnValue(false);

      await svc().sync(weekly, '24h');

      expect(actions()[0]).toBe('unregister:device-123');
      expect(mockNative.id).toBe('');
      expect(mockStore[LIVE_ACTIVITY_PENDING_UNREGISTER_KEY]).toBeUndefined();
      expect(mockStore[LIVE_ACTIVITY_REGISTERED_KEY]).toBeUndefined();
    });

    it('a retry that fails again stops the sync: no register, no card', async () => {
      registeredDevice();
      mockStore[LIVE_ACTIVITY_PENDING_UNREGISTER_KEY] = 'true';
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true'; // re-enabled while offline
      mockInvoke.mockResolvedValue(FAILED);

      await svc().sync(weekly, '24h');

      expect(actions()).toEqual(['unregister:device-123']);
      expect(n.configure).not.toHaveBeenCalled();
      expect(n.writeSnapshot).not.toHaveBeenCalled();
      expect(n.startLocal).not.toHaveBeenCalled();
      expect(mockNative.id).toBe('device-123');
      expect(mockStore[LIVE_ACTIVITY_PENDING_UNREGISTER_KEY]).toBe('true');
    });

    it('re-enabling after a pending unregister removes the old registration before making a new one', async () => {
      registeredDevice();
      mockInvoke.mockResolvedValueOnce(FAILED); // switch-off while offline
      await svc().setEnabled(false);
      expect(mockStore[LIVE_ACTIVITY_PENDING_UNREGISTER_KEY]).toBe('true');

      await svc().setEnabled(true); // back online, switched on again
      await svc().sync(weekly, '24h');

      expect(actions()).toEqual([
        'unregister:device-123', // failed
        'unregister:device-123', // the retry, before anything else
        'register:device-456', // a fresh id: the old row is gone
      ]);
      expect(mockStore[LIVE_ACTIVITY_PENDING_UNREGISTER_KEY]).toBeUndefined();
      expect(mockStore[LIVE_ACTIVITY_REGISTERED_KEY]).toBe('true');
      expect(mockNative.switchedOff).toBe(false);
      expect(n.startLocal).toHaveBeenCalledTimes(1);
    });

    it('the next switch-off retries it too', async () => {
      registeredDevice();
      mockStore[LIVE_ACTIVITY_PENDING_UNREGISTER_KEY] = 'true';
      await svc().disableAndForget();
      expect(actions()).toEqual(['unregister:device-123']);
      expect(mockNative.id).toBe('');
      expect(mockStore[LIVE_ACTIVITY_PENDING_UNREGISTER_KEY]).toBeUndefined();
    });

    it('an unreadable device id is never deleted unseen', async () => {
      registeredDevice();
      n.peekDeviceId.mockImplementation(() => {
        throw new Error('App Group unavailable');
      });
      await svc().disableAndForget();
      expect(mockInvoke).not.toHaveBeenCalled();
      expect(n.clearShared).not.toHaveBeenCalled();
      expect(mockNative.id).toBe('device-123');
      expect(mockStore[LIVE_ACTIVITY_PENDING_UNREGISTER_KEY]).toBe('true');
    });

    it('no mood verse is stored while an unregister is pending', async () => {
      registeredDevice();
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
      mockStore[LIVE_ACTIVITY_PENDING_UNREGISTER_KEY] = 'true';
      await svc().onVerseShown(quran());
      expect(mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY]).toBeUndefined();
      expect(n.writeSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('serialisation', () => {
    const deferred = <T,>() => {
      let resolve!: (v: T) => void;
      const promise = new Promise<T>((r) => {
        resolve = r;
      });
      return { promise, resolve };
    };
    const flush = async () => {
      for (let i = 0; i < 20; i++) await Promise.resolve();
    };

    it('switch flipped off mid-sync: no register after the unregister', async () => {
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
      const gate = deferred<string>();
      mockGetAppUserID.mockImplementation(() => gate.promise);

      const syncing = svc().sync(weekly, '24h');
      await flush(); // sync is now parked awaiting the RC user id
      const switchingOff = svc().setEnabled(false);
      await flush();
      expect(mockInvoke).not.toHaveBeenCalled(); // setEnabled waits its turn

      gate.resolve('$RCAnonymousID:test-user');
      await Promise.all([syncing, switchingOff]);

      const acts = mockInvoke.mock.calls.map((c) => c[1].body.action);
      // The in-flight sync finishes first, then the teardown unregisters.
      expect(acts).toEqual(['register', 'unregister']);
      expect(mockStore[LIVE_ACTIVITY_REGISTERED_KEY]).toBeUndefined();
      expect(n.clearShared).toHaveBeenCalled();
    });

    it('state flipped off during sync (outside the queue): never registers', async () => {
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
      const gate = deferred<string>();
      mockGetAppUserID.mockImplementation(() => gate.promise);

      const syncing = svc().sync(weekly, '24h');
      await flush();
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'false'; // e.g. written by another path
      gate.resolve('$RCAnonymousID:test-user');
      await syncing;

      expect(mockInvoke).not.toHaveBeenCalled();
      expect(n.startLocal).not.toHaveBeenCalled();
    });

    it('Pro lost during sync: never registers', async () => {
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
      const gate = deferred<string>();
      mockGetAppUserID.mockImplementation(() => gate.promise);

      const syncing = svc().sync(weekly, '24h');
      await flush();
      mockIsPremium.mockReturnValue(false);
      gate.resolve('$RCAnonymousID:test-user');
      await syncing;

      expect(mockInvoke).not.toHaveBeenCalled();
      expect(n.startLocal).not.toHaveBeenCalled();
    });

    it('onVerseShown during a sync keeps the mood verse in the final snapshot', async () => {
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
      // Park sync inside its snapshot build, AFTER it has read the mood key:
      // the window in which an unqueued onVerseShown would be overwritten.
      const gate = deferred<DailyVerse>();
      (getDailyVerse as jest.Mock).mockImplementationOnce(() => gate.promise);

      const syncing = svc().sync(weekly, '24h');
      await flush();
      const shown = svc().onVerseShown(quran());
      await flush();
      gate.resolve(actualDaily.getDailyVerseSync());
      await Promise.all([syncing, shown]);

      const calls = n.writeSnapshot.mock.calls;
      const last = JSON.parse(calls[calls.length - 1][0]);
      expect(last.mood).toEqual(JSON.parse(mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY]));
      expect(last.mood.ref).toBe('Quran 93:4');
    });

    it('onVerseShown queued behind a switch-off writes nothing', async () => {
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
      const switchingOff = svc().setEnabled(false);
      const shown = svc().onVerseShown(quran());
      await Promise.all([switchingOff, shown]);
      expect(mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY]).toBeUndefined();
      expect(n.writeSnapshot).not.toHaveBeenCalled();
    });
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

  it('writes the snapshot and starts a card for the next prayer after a successful register', async () => {
    mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
    await svc().sync(weekly, '12h');
    expect(n.writeSnapshot).toHaveBeenCalledTimes(1);
    const snap = JSON.parse(n.writeSnapshot.mock.calls[0][0]);
    expect(snap.version).toBe(1);
    expect(snap.timeFormat).toBe('12h');
    expect(snap.mood).toBeNull();
    const schedule = mockInvoke.mock.calls[0][1].body.schedule as { name: string; at: number }[];
    const nowS = Date.now() / 1000;
    const i = schedule.findIndex((p) => p.at > nowS);
    const next = schedule[i];
    // The previous prayer is where the card's progress bar starts; before the
    // first scheduled prayer there is none, and the card shows no bar.
    const prev = i > 0 ? schedule[i - 1].at : null;
    expect(n.startLocal).toHaveBeenCalledWith(next.name, next.at, prev);
    expect(n.startLocal.mock.invocationCallOrder[0]).toBeGreaterThan(mockInvoke.mock.invocationCallOrder[0]);
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

    it('does nothing while the subscription is not loaded', async () => {
      mockHasLoaded.mockReturnValue(false);
      mockIsPremium.mockReturnValue(false);
      await svc().onVerseShown(quran());
      expect(mockStore[LIVE_ACTIVITY_MOOD_VERSE_KEY]).toBeUndefined();
      expect(n.writeSnapshot).not.toHaveBeenCalled();
      expect(n.endAll).not.toHaveBeenCalled();
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
      // Never registered, so there is nothing for the server to forget.
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('turning off after a registration unregisters exactly once and clears the flag', async () => {
      registeredDevice();
      await svc().setEnabled(false);
      await svc().setEnabled(false);
      expect(mockInvoke).toHaveBeenCalledTimes(1);
      expect(mockInvoke).toHaveBeenCalledWith('live-activity-register', {
        body: { action: 'unregister', deviceId: 'device-123' },
      });
      expect(mockStore[LIVE_ACTIVITY_REGISTERED_KEY]).toBeUndefined();
    });
  });

  describe('never throws', () => {
    it('swallows and logs a failed register', async () => {
      mockStore[LIVE_ACTIVITY_PREF_KEY] = 'true';
      mockInvoke.mockRejectedValue(new Error('network'));
      await expect(svc().sync(weekly, '24h')).resolves.toBeUndefined();
      expect(logServiceError).toHaveBeenCalled();
    });

    it('unregister failure is logged and keeps the id for the retry', async () => {
      registeredDevice();
      mockInvoke.mockResolvedValue({ data: null, error: new Error('500') });
      await expect(svc().disableAndForget()).resolves.toBeUndefined();
      expect(logServiceError).toHaveBeenCalled();
      expect(n.clearShared).not.toHaveBeenCalled();
      expect(n.markSwitchedOff).toHaveBeenCalled();
    });

    it('swallows a native throw in disableAndForget', async () => {
      registeredDevice();
      n.endAll.mockRejectedValueOnce(new Error('boom'));
      n.peekDeviceId.mockImplementation(() => {
        throw new Error('boom');
      });
      await expect(svc().disableAndForget()).resolves.toBeUndefined();
    });
  });
});
