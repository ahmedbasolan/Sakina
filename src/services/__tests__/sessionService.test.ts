import { SessionService } from '../sessionService';

jest.mock('../../database/schema', () => ({
  dbQuery: jest.fn((op) =>
    op({
      getFirstAsync: jest.fn().mockResolvedValue(null),
      runAsync: jest.fn().mockResolvedValue(undefined),
    }),
  ),
}));

jest.mock('../../constants', () => ({
  FREEMIUM_LIMITS: { refreshesPerPrayerWindow: 3, maxSavedItems: 30, rotationHistoryDays: 30 },
}));

const mockGetContext = jest.fn().mockResolvedValue('dhuhr');
jest.mock('../prayerTimesService', () => ({
  __esModule: true,
  default: { getInstance: () => ({ getCurrentPrayerContext: mockGetContext }) },
}));

describe('SessionService per-window refresh + mercy', () => {
  let service: SessionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetContext.mockResolvedValue('dhuhr');
    (SessionService as any).instance = null;
    service = SessionService.getInstance();
    await service.initialize(false); // creates a fresh free session
  });

  it('starts a free window with the configured refresh count', () => {
    expect(service.getRemainingRefreshes(false)).toBe(3);
  });

  it('decrements on each free refresh', async () => {
    await service.useNextRefresh(false);
    expect(service.getRemainingRefreshes(false)).toBe(2);
  });

  it('blocks free refresh at zero', async () => {
    await service.useNextRefresh(false);
    await service.useNextRefresh(false);
    await service.useNextRefresh(false);
    expect(service.canUseNextRefresh(false)).toBe(false);
    expect(await service.useNextRefresh(false)).toBe(false);
  });

  it('treats mercy as unlimited and does NOT decrement the counter', async () => {
    await service.useNextRefresh(false, true); // mercy
    await service.useNextRefresh(false, true);
    expect(service.getRemainingRefreshes(false, true)).toBe(Infinity);
    expect(service.getRemainingRefreshes(false)).toBe(3); // counter untouched
  });

  it('resets the counter when the prayer window changes', async () => {
    await service.useNextRefresh(false);
    expect(service.getRemainingRefreshes(false)).toBe(2);
    mockGetContext.mockResolvedValue('asr'); // new window
    await service.syncWindow(false);
    expect(service.getRemainingRefreshes(false)).toBe(3);
  });
});
