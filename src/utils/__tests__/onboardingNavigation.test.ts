import { canSwipeForward, COMMIT_SCREEN_INDEX } from '../onboardingNavigation';

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
