/**
 * The switch flow shared by Settings and the Prayer Times invitation, and the
 * rule for when the invitation is shown.
 */

const mockStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore[key] ?? null)),
  setItem: jest.fn((key: string, val: string) => {
    mockStore[key] = val;
    return Promise.resolve();
  }),
}));

const order: string[] = [];
const mockService = {
  isAvailable: jest.fn(() => true),
  getEnabled: jest.fn(() => Promise.resolve(false)),
  setEnabled: jest.fn(async () => {
    order.push('setEnabled');
  }),
  sync: jest.fn(async () => {
    order.push('sync');
  }),
};
jest.mock('../liveActivityService', () => ({
  LIVE_ACTIVITY_INVITE_KEY: '@live_activity_invite_seen',
  LiveActivityService: { getInstance: () => mockService },
}));

const mockIsPremium = jest.fn(() => true);
jest.mock('../../subscriptionService', () => ({
  SubscriptionService: { getInstance: () => ({ isPremium: () => mockIsPremium() }) },
}));

const mockLoadTimings = jest.fn();
jest.mock('../../schedulingTimings', () => ({
  loadSchedulingTimings: (...a: unknown[]) => mockLoadTimings(...a),
}));

const mockLog = jest.fn();
jest.mock('../../errorLoggingService', () => ({
  logServiceError: (...a: unknown[]) => mockLog(...a),
}));

import {
  turnOnLiveActivity,
  shouldShowLiveActivityInvite,
  markLiveActivityInviteSeen,
} from '../liveActivitySwitch';

const DAY = { Fajr: '04:00', Sunrise: '05:30', Dhuhr: '12:00', Asr: '15:30', Maghrib: '18:00', Isha: '19:30' };

beforeEach(() => {
  jest.clearAllMocks();
  order.length = 0;
  Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  mockService.isAvailable.mockReturnValue(true);
  mockService.getEnabled.mockResolvedValue(false);
  mockIsPremium.mockReturnValue(true);
  mockLoadTimings.mockResolvedValue(DAY);
});

describe('turnOnLiveActivity', () => {
  it('saves the switch first, then syncs a full week in the given clock format', async () => {
    await turnOnLiveActivity('12h');

    expect(order).toEqual(['setEnabled', 'sync']);
    expect(mockService.setEnabled).toHaveBeenCalledWith(true);
    const [weekly, format] = mockService.sync.mock.calls[0] as unknown as [unknown[], string];
    expect(weekly).toHaveLength(7);
    expect(format).toBe('12h');
  });

  it('keeps the switch on and logs when the timings cannot be loaded (offline, no cache)', async () => {
    mockLoadTimings.mockRejectedValue(new Error('offline'));

    await expect(turnOnLiveActivity('24h')).resolves.toBeUndefined();

    expect(mockService.setEnabled).toHaveBeenCalledWith(true);
    expect(mockService.sync).not.toHaveBeenCalled();
    expect(mockLog).toHaveBeenCalled();
  });
});

describe('shouldShowLiveActivityInvite', () => {
  it('is shown to a Pro user on a supported device with the switch off and no earlier answer', async () => {
    await expect(shouldShowLiveActivityInvite()).resolves.toBe(true);
  });

  it.each([
    ['not Pro', () => mockIsPremium.mockReturnValue(false)],
    ['unsupported device', () => mockService.isAvailable.mockReturnValue(false)],
    ['the switch is already on', () => mockService.getEnabled.mockResolvedValue(true)],
    ['it was answered before', () => { mockStore['@live_activity_invite_seen'] = 'true'; }],
  ])('is not shown when %s', async (_name, arrange) => {
    arrange();
    await expect(shouldShowLiveActivityInvite()).resolves.toBe(false);
  });

  it('stays hidden after either answer is recorded', async () => {
    await markLiveActivityInviteSeen();
    await expect(shouldShowLiveActivityInvite()).resolves.toBe(false);
  });
});
