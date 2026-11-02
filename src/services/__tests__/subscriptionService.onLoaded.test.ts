/**
 * `onLoaded` lets a caller that skipped work while the subscription state was
 * unresolved run it once, the moment it resolves (LiveActivityService's cold
 * start sync). One-shot, and immediate when already loaded.
 */
const mockGetCustomerInfo = jest.fn();

jest.mock('../revenueCatService', () => ({
  revenueCat: {
    configure: jest.fn(),
    getCustomerInfo: () => mockGetCustomerInfo(),
  },
}));
jest.mock('../../database/connection', () => ({
  dbQuery: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('../supabaseDataService', () => ({
  SupabaseDataService: { getInstance: () => ({}) },
}));
jest.mock('../lockscreenVerseService', () => ({ resetLockscreenPrefsOnLapse: jest.fn() }));
jest.mock('../errorLoggingService', () => ({ logServiceError: jest.fn() }));

type Service = import('../subscriptionService').SubscriptionService;

function freshService(): Service {
  let svc!: Service;
  jest.isolateModules(() => {
    svc = require('../subscriptionService').SubscriptionService.getInstance();
  });
  return svc;
}

describe('SubscriptionService.onLoaded', () => {
  beforeEach(() => {
    // RevenueCat unreachable: resync falls back to the (empty) local cache and
    // still marks itself loaded — the path a cold start offline takes.
    mockGetCustomerInfo.mockReset();
    mockGetCustomerInfo.mockRejectedValue(new Error('offline'));
  });

  it('waits for the first load, then calls back exactly once', async () => {
    const svc = freshService();
    const cb = jest.fn();
    svc.onLoaded(cb);
    expect(svc.hasLoaded()).toBe(false);
    expect(cb).not.toHaveBeenCalled();

    await svc.resync();
    expect(svc.hasLoaded()).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);

    await svc.resync(); // a later resync does not fire it again
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('calls back at once when already loaded', async () => {
    const svc = freshService();
    await svc.initialize();
    const cb = jest.fn();
    svc.onLoaded(cb);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('one throwing listener does not stop the others', async () => {
    const svc = freshService();
    const after = jest.fn();
    svc.onLoaded(() => {
      throw new Error('boom');
    });
    svc.onLoaded(after);
    await expect(svc.resync()).resolves.toBeUndefined();
    expect(after).toHaveBeenCalledTimes(1);
  });
});
