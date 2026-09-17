import { maybeAskForReview } from '../reviewPromptService';
import {
  REVIEW_ASK_COOLDOWN_MS,
  REVIEW_ASK_MAX_LIFETIME,
  REVIEW_ASK_MIN_COMPLETED_DAYS,
  STORAGE_KEYS,
} from '../../constants';

const mockStore: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore[key] ?? null)),
  setItem: jest.fn((key: string, val: string) => {
    mockStore[key] = val;
    return Promise.resolve();
  }),
}));

const mockHasAction = jest.fn();
const mockRequestReview = jest.fn();
jest.mock('expo-store-review', () => ({
  hasAction: (...args: any[]) => mockHasAction(...args),
  requestReview: (...args: any[]) => mockRequestReview(...args),
}));

jest.mock('../errorLoggingService', () => ({ logServiceError: jest.fn() }));

/** Seed the persisted ask record the service reads on entry. */
const seed = (state: { lastAskAt: number; askCount: number }) => {
  mockStore[STORAGE_KEYS.reviewAsk] = JSON.stringify(state);
};

const persisted = () =>
  mockStore[STORAGE_KEYS.reviewAsk]
    ? JSON.parse(mockStore[STORAGE_KEYS.reviewAsk])
    : null;

describe('maybeAskForReview', () => {
  beforeEach(() => {
    for (const key of Object.keys(mockStore)) delete mockStore[key];
    mockHasAction.mockReset().mockResolvedValue(true);
    mockRequestReview.mockReset().mockResolvedValue(undefined);
  });

  it('asks once the user has banked enough days', async () => {
    await maybeAskForReview(REVIEW_ASK_MIN_COMPLETED_DAYS);
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
    expect(persisted()).toEqual({ lastAskAt: expect.any(Number), askCount: 1 });
  });

  it('stays silent before the day floor, so day one never spends the quota', async () => {
    await maybeAskForReview(REVIEW_ASK_MIN_COMPLETED_DAYS - 1);
    expect(mockRequestReview).not.toHaveBeenCalled();
    expect(persisted()).toBeNull();
  });

  it('stays silent inside the cooldown window', async () => {
    seed({ lastAskAt: Date.now() - (REVIEW_ASK_COOLDOWN_MS - 1000), askCount: 1 });
    await maybeAskForReview(10);
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('asks again once the cooldown has elapsed', async () => {
    seed({ lastAskAt: Date.now() - (REVIEW_ASK_COOLDOWN_MS + 1000), askCount: 1 });
    await maybeAskForReview(10);
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
    expect(persisted().askCount).toBe(2);
  });

  it('stops forever at the lifetime cap, even long after the cooldown', async () => {
    seed({ lastAskAt: 0, askCount: REVIEW_ASK_MAX_LIFETIME });
    await maybeAskForReview(100);
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('records nothing when the platform has no review action (e.g. TestFlight)', async () => {
    mockHasAction.mockResolvedValue(false);
    await maybeAskForReview(10);
    expect(mockRequestReview).not.toHaveBeenCalled();
    expect(persisted()).toBeNull();
  });

  it('swallows a StoreKit failure rather than breaking the completion flow', async () => {
    mockRequestReview.mockRejectedValue(new Error('StoreKit unavailable'));
    await expect(maybeAskForReview(10)).resolves.toBeUndefined();
  });

  it('treats corrupt stored state as never-asked instead of throwing', async () => {
    mockStore[STORAGE_KEYS.reviewAsk] = '{not json';
    await expect(maybeAskForReview(10)).resolves.toBeUndefined();
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
  });
});
