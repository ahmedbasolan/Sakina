import { renderHook, act } from '@testing-library/react-native';
import { useGuidanceLogic } from '../useGuidanceLogic';
import { Mood } from '../../types';

// ─── Mocks ───────────────────────────────────────────────────────────────────
// Stable singleton objects so tests can override their jest.fn()s per case.
jest.mock('../../services/freemiumService', () => {
  const inst = {
    isPremium: jest.fn(() => false),
    syncPrayerWindow: jest.fn(() => Promise.resolve()),
    useNextRefresh: jest.fn(() => Promise.resolve(true)),
    getRemainingRefreshes: jest.fn(() => 3),
  };
  return { FreemiumService: { getInstance: jest.fn(() => inst) } };
});

jest.mock('../../services/preferencesService', () => {
  const inst = {
    initialize: jest.fn(() =>
      Promise.resolve({
        primaryLanguage: 'english',
        showTransliteration: true,
        autoPlayAudio: false,
      }),
    ),
    savePreferences: jest.fn(() => Promise.resolve()),
  };
  return { PreferencesService: { getInstance: jest.fn(() => inst) } };
});

jest.mock('../../services/hapticsService', () => ({
  HapticsService: {
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    selectionAsync: jest.fn(),
  },
}));

jest.mock('../../database/schema', () => ({
  dbQuery: jest.fn(() => Promise.resolve(null)),
}));

const experience: any = {
  content: { id: 'c1', source: '', arabicText: '', englishTranslation: '' },
  angle: { id: 'a1' },
};

const render = (mood: Mood, onNext: () => void) =>
  renderHook(() => useGuidanceLogic(experience, mood, onNext, jest.fn(), 1));

describe('useGuidanceLogic — refresh gating', () => {
  let freemium: any;
  let onNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    freemium = require('../../services/freemiumService').FreemiumService.getInstance();
    freemium.useNextRefresh.mockResolvedValue(true);
    freemium.getRemainingRefreshes.mockReturnValue(3);
    onNext = jest.fn();
  });

  it('consumes a refresh and advances when allowed', async () => {
    freemium.useNextRefresh.mockResolvedValue(true);
    const { result } = render('Calm', onNext);

    await act(async () => {
      await result.current.requestNext();
    });

    expect(freemium.useNextRefresh).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(result.current.isResting).toBe(false);
  });

  it('does NOT advance and enters resting state when the window is spent', async () => {
    // New contract: denial is a zero allowance checked BEFORE fetching;
    // useNextRefresh is never reached, so the allowance can't go negative.
    freemium.getRemainingRefreshes.mockReturnValue(0);
    const { result } = render('Calm', onNext);

    await act(async () => {
      await result.current.requestNext();
    });

    expect(onNext).not.toHaveBeenCalled();
    expect(freemium.useNextRefresh).not.toHaveBeenCalled();
    expect(result.current.isResting).toBe(true);
  });

  it('does NOT spend a refresh when the fetch fails to deliver', async () => {
    // A failed onNext used to consume the allowance and silently do nothing
    // (the "swallowed tap"). Now the refresh is only spent on delivery.
    onNext.mockResolvedValue(false);
    const { result } = render('Calm', onNext);

    await act(async () => {
      await result.current.requestNext();
    });

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(freemium.useNextRefresh).not.toHaveBeenCalled();
    expect(result.current.isResting).toBe(false);
  });

  it('dismissResting clears the resting state', async () => {
    freemium.getRemainingRefreshes.mockReturnValue(0);
    const { result } = render('Calm', onNext);

    await act(async () => {
      await result.current.requestNext();
    });
    expect(result.current.isResting).toBe(true);

    act(() => {
      result.current.dismissResting();
    });
    expect(result.current.isResting).toBe(false);
  });
});
