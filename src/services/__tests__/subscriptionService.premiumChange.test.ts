/**
 * `onPremiumChange` tells a caller when Pro is gained or lost after the first
 * load (the Home Screen widget switches between its locked state and the
 * user's day). The first load only sets the baseline: callers that need it use
 * `onLoaded`.
 */
const mockGetCustomerInfo = jest.fn();
const mockRestore = jest.fn();

/** A CustomerInfo stand-in: `active` decides the entitlement. Lifetime, so no offering lookup. */
const info = (active: boolean) => ({ active });

jest.mock('../revenueCatService', () => ({
  revenueCat: {
    configure: jest.fn(),
    getCustomerInfo: () => mockGetCustomerInfo(),
    restorePurchases: () => mockRestore(),
    isEntitlementActive: (i: { active: boolean }) => i.active,
    getActiveEntitlement: (i: { active: boolean }) =>
      i.active ? { expirationDate: null, periodType: 'normal', willRenew: false, productIdentifier: 'lifetime' } : undefined,
    resolveDurationType: jest.fn(async () => 'yearly'),
  },
}));
jest.mock('../../database/connection', () => ({
  dbQuery: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('../supabaseDataService', () => ({
  SupabaseDataService: { getInstance: () => ({}) },
}));
jest.mock('../lockscreenVerseService', () => ({ resetLockscreenPrefsOnLapse: jest.fn(() => Promise.resolve()) }));
jest.mock('../errorLoggingService', () => ({ logServiceError: jest.fn() }));

type Service = import('../subscriptionService').SubscriptionService;

function freshService(): Service {
  let svc!: Service;
  jest.isolateModules(() => {
    svc = require('../subscriptionService').SubscriptionService.getInstance();
  });
  return svc;
}

describe('SubscriptionService.onPremiumChange', () => {
  beforeEach(() => {
    mockGetCustomerInfo.mockReset();
    mockRestore.mockReset();
  });

  it('the first load sets the baseline without calling back', async () => {
    mockGetCustomerInfo.mockResolvedValue(info(true));
    const svc = freshService();
    const cb = jest.fn();
    svc.onPremiumChange(cb);
    await svc.resync();
    expect(svc.isPremium()).toBe(true);
    expect(cb).not.toHaveBeenCalled();
  });

  it('calls back once with true when a resync turns a free user Pro', async () => {
    mockGetCustomerInfo.mockResolvedValue(info(false));
    const svc = freshService();
    await svc.resync();
    const cb = jest.fn();
    svc.onPremiumChange(cb);

    mockGetCustomerInfo.mockResolvedValue(info(true));
    await svc.resync();
    expect(cb.mock.calls).toEqual([[true]]);
  });

  it('calls back once with false when a restore finds Pro gone', async () => {
    mockGetCustomerInfo.mockResolvedValue(info(true));
    const svc = freshService();
    await svc.resync();
    const cb = jest.fn();
    svc.onPremiumChange(cb);

    mockRestore.mockResolvedValue(info(false));
    await svc.restorePurchases();
    expect(cb.mock.calls).toEqual([[false]]);
  });

  it('calls back with false when reset to the free tier', async () => {
    mockGetCustomerInfo.mockResolvedValue(info(true));
    const svc = freshService();
    await svc.resync();
    const cb = jest.fn();
    svc.onPremiumChange(cb);

    await svc.resetToFreeTier();
    expect(cb.mock.calls).toEqual([[false]]);
  });

  it('does not call back when a resync leaves Pro unchanged', async () => {
    mockGetCustomerInfo.mockResolvedValue(info(true));
    const svc = freshService();
    await svc.resync();
    const cb = jest.fn();
    svc.onPremiumChange(cb);

    await svc.resync();
    await svc.resync();
    expect(cb).not.toHaveBeenCalled();
  });

  it('stops calling back after unsubscribe', async () => {
    mockGetCustomerInfo.mockResolvedValue(info(false));
    const svc = freshService();
    await svc.resync();
    const cb = jest.fn();
    const unsubscribe = svc.onPremiumChange(cb);
    unsubscribe();

    mockGetCustomerInfo.mockResolvedValue(info(true));
    await svc.resync();
    expect(cb).not.toHaveBeenCalled();
  });

  it('one throwing listener does not stop the others', async () => {
    mockGetCustomerInfo.mockResolvedValue(info(false));
    const svc = freshService();
    await svc.resync();
    const after = jest.fn();
    svc.onPremiumChange(() => {
      throw new Error('boom');
    });
    svc.onPremiumChange(after);

    mockGetCustomerInfo.mockResolvedValue(info(true));
    await expect(svc.resync()).resolves.toBeUndefined();
    expect(after.mock.calls).toEqual([[true]]);
  });
});
