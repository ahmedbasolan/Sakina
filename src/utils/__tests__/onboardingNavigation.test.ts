import {
  canSwipeForward,
  canSwipeBack,
  showsOnboardingChrome,
  COMMIT_SCREEN_INDEX,
  OFFER_SCREEN_INDEX,
} from '../onboardingNavigation';

describe('canSwipeForward', () => {
  it('allows forward swipe on ordinary screens before the last one', () => {
    expect(canSwipeForward(0, 9)).toBe(true);
    expect(canSwipeForward(3, 9)).toBe(true);
    expect(canSwipeForward(6, 9)).toBe(true); // Notification -> Commit
  });

  it('blocks forward swipe on the last screen regardless of index', () => {
    expect(canSwipeForward(8, 9)).toBe(false);
  });

  it('blocks forward swipe past CommitScreen even when it is not the last screen', () => {
    // This is the exact regression the onboarding-trial-offer spec found:
    // adding a screen after Commit (TOTAL_SCREENS 8 -> 9) must not unlock
    // swiping past the hold-to-commit ritual.
    expect(canSwipeForward(COMMIT_SCREEN_INDEX, 9)).toBe(false);
  });

  it("matches today's pre-change behavior when Commit is still the last screen", () => {
    expect(canSwipeForward(COMMIT_SCREEN_INDEX, 8)).toBe(false);
  });
});

describe('canSwipeBack', () => {
  it('allows back swipe on ordinary screens', () => {
    expect(canSwipeBack(3)).toBe(true);
    expect(canSwipeBack(COMMIT_SCREEN_INDEX)).toBe(true);
  });

  it('blocks back swipe on the very first screen', () => {
    expect(canSwipeBack(0)).toBe(false);
  });

  it('blocks back swipe out of the trial offer into the commit ritual', () => {
    // The offer is terminal: swiping back would re-enter CommitScreen, whose
    // isActive effect resets isComplete, forcing the user to hold the star
    // again to escape. Nothing after Commit should re-open it.
    expect(canSwipeBack(OFFER_SCREEN_INDEX)).toBe(false);
  });
});

describe('showsOnboardingChrome', () => {
  it('shows the back arrow + progress mandala on ordinary screens', () => {
    expect(showsOnboardingChrome(0)).toBe(true);
    expect(showsOnboardingChrome(COMMIT_SCREEN_INDEX)).toBe(true);
  });

  it('hides onboarding chrome on the trial offer step', () => {
    // OnboardingScreen's headerRow is zIndex 10 and right-aligned, landing the
    // 44px progress mandala directly on top of SupportSakinaScreen's own 44px
    // close button (both ~insets.top, right edge). The embedded paywall owns
    // its chrome; onboarding's must not paint over it.
    expect(showsOnboardingChrome(OFFER_SCREEN_INDEX)).toBe(false);
  });
});
