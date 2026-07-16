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

describe('useGuidanceLogic — reflections', () => {
  const baseExperience: any = {
    content: { id: 'c1', source: '', arabicText: '', englishTranslation: '' },
    angle: { id: 'a1' },
  };

  const renderReflections = (experience: any, onSaveReflection: jest.Mock) =>
    renderHook(
      // `Props` is annotated explicitly here (rather than left to inference)
      // because @testing-library/react-native@13's `renderHook` wraps the
      // `initialProps` option type in `NoInfer<Props>`, so an unannotated
      // destructured callback parameter resolves to `unknown` and fails
      // `tsc --noEmit`, even though Jest (which only transpiles) doesn't
      // catch it. Purely a type annotation — no behavior change.
      ({ exp }: { exp: any }) => useGuidanceLogic(exp, 'Calm', jest.fn(), onSaveReflection, 1),
      { initialProps: { exp: experience } },
    );

  beforeEach(() => {
    jest.clearAllMocks();
    const freemium = require('../../services/freemiumService').FreemiumService.getInstance();
    freemium.getRemainingRefreshes.mockReturnValue(3);
  });

  it('starts empty with no reflection text', () => {
    const { result } = renderReflections(baseExperience, jest.fn());
    expect(result.current.reflectionStatus).toBe('empty');
  });

  it('marks status dirty once text is typed', () => {
    const { result } = renderReflections(baseExperience, jest.fn());

    act(() => {
      result.current.setReflectionText('This means a lot to me');
    });

    expect(result.current.reflectionStatus).toBe('dirty');
  });

  it('does nothing when saveReflection is called with empty text', async () => {
    const onSaveReflection = jest.fn(() => Promise.resolve(true));
    const { result } = renderReflections(baseExperience, onSaveReflection);

    await act(async () => {
      await result.current.saveReflection();
    });

    expect(onSaveReflection).not.toHaveBeenCalled();
    expect(result.current.reflectionStatus).toBe('empty');
  });

  it('saveReflection commits text and marks status saved', async () => {
    const onSaveReflection = jest.fn(() => Promise.resolve(true));
    const { result } = renderReflections(baseExperience, onSaveReflection);

    act(() => {
      result.current.setReflectionText('A private reflection');
    });

    await act(async () => {
      await result.current.saveReflection();
    });

    expect(onSaveReflection).toHaveBeenCalledWith('A private reflection');
    expect(result.current.reflectionStatus).toBe('saved');

    const { HapticsService } = require('../../services/hapticsService');
    expect(HapticsService.notificationAsync).toHaveBeenCalledWith('SUCCESS');
  });

  it('reverts to dirty and fires a WARNING haptic when the save fails', async () => {
    const onSaveReflection = jest.fn(() => Promise.resolve(false));
    const { result } = renderReflections(baseExperience, onSaveReflection);

    act(() => {
      result.current.setReflectionText('A private reflection');
    });

    await act(async () => {
      await result.current.saveReflection();
    });

    expect(result.current.reflectionStatus).toBe('dirty');
    const { HapticsService } = require('../../services/hapticsService');
    expect(HapticsService.notificationAsync).toHaveBeenCalledWith('WARNING');
  });

  it('reverts to dirty and fires a WARNING haptic when the save promise rejects', async () => {
    const onSaveReflection = jest.fn(() => Promise.reject(new Error('boom')));
    const { result } = renderReflections(baseExperience, onSaveReflection);

    act(() => {
      result.current.setReflectionText('A private reflection');
    });

    await act(async () => {
      await result.current.saveReflection();
    });

    expect(result.current.reflectionStatus).toBe('dirty');
    const { HapticsService } = require('../../services/hapticsService');
    expect(HapticsService.notificationAsync).toHaveBeenCalledWith('WARNING');
  });

  it('treats a resolved undefined as success (backward-compat with the pre-Task-4 caller signature)', async () => {
    const onSaveReflection = jest.fn(() => Promise.resolve(undefined));
    const { result } = renderReflections(baseExperience, onSaveReflection);

    act(() => {
      result.current.setReflectionText('A private reflection');
    });

    await act(async () => {
      await result.current.saveReflection();
    });

    expect(result.current.reflectionStatus).toBe('saved');
  });

  it('ignores a second saveReflection call while the first is still in flight', async () => {
    const onSaveReflection = jest.fn(() => Promise.resolve(true));
    const { result } = renderReflections(baseExperience, onSaveReflection);

    act(() => {
      result.current.setReflectionText('A private reflection');
    });

    await act(async () => {
      const first = result.current.saveReflection();
      const second = result.current.saveReflection();
      await Promise.all([first, second]);
    });

    expect(onSaveReflection).toHaveBeenCalledTimes(1);
  });

  it('editing after a save returns status to dirty', async () => {
    const onSaveReflection = jest.fn(() => Promise.resolve(true));
    const { result } = renderReflections(baseExperience, onSaveReflection);

    act(() => {
      result.current.setReflectionText('First draft');
    });
    await act(async () => {
      await result.current.saveReflection();
    });
    expect(result.current.reflectionStatus).toBe('saved');

    act(() => {
      result.current.setReflectionText('First draft, revised');
    });
    expect(result.current.reflectionStatus).toBe('dirty');
  });

  it('resets reflection text and status when the experience changes', async () => {
    const onSaveReflection = jest.fn(() => Promise.resolve(true));
    const { result, rerender } = renderReflections(baseExperience, onSaveReflection);

    act(() => {
      result.current.setReflectionText('Something written for verse 1');
    });
    expect(result.current.reflectionStatus).toBe('dirty');

    const nextExperience = {
      content: { id: 'c2', source: '', arabicText: '', englishTranslation: '' },
      angle: { id: 'a2' },
    };

    rerender({ exp: nextExperience });

    expect(result.current.reflectionText).toBe('');
    expect(result.current.reflectionStatus).toBe('empty');
  });
});
