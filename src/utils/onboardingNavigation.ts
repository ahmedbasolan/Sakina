/**
 * CommitScreen ("hold 3 seconds to seal your intention") must never be
 * swipeable past — only completing the hold advances from it. This index
 * is deliberately independent of TOTAL_SCREENS so that adding screens after
 * Commit (e.g. the onboarding trial offer) can never silently re-enable
 * swipe-forward there just because it's no longer the last screen.
 *
 * The bare `currentScreen < TOTAL_SCREENS - 1` check this replaces happened
 * to block swipe-past-Commit only as a side effect of Commit being last;
 * bumping TOTAL_SCREENS 8 -> 9 for the trial offer would have unlocked it.
 * See docs/superpowers/specs/2026-08-16-onboarding-trial-offer-design.md.
 */
export const COMMIT_SCREEN_INDEX = 7;

export function canSwipeForward(currentScreen: number, totalScreens: number): boolean {
  return currentScreen < totalScreens - 1 && currentScreen !== COMMIT_SCREEN_INDEX;
}
