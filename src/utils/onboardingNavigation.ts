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

/**
 * The embedded trial-offer step (SupportSakinaScreen). Terminal: the only way
 * out is its own CTA or skip affordance, both of which enter the app.
 */
export const OFFER_SCREEN_INDEX = 8;

export function canSwipeForward(currentScreen: number, totalScreens: number): boolean {
  return currentScreen < totalScreens - 1 && currentScreen !== COMMIT_SCREEN_INDEX;
}

/**
 * Backward navigation. Blocked out of the offer step: going back would re-enter
 * CommitScreen, whose `isActive` effect resets `isComplete`, so the user would
 * have to hold the star a second time just to get back where they were.
 */
export function canSwipeBack(currentScreen: number): boolean {
  return currentScreen > 0 && currentScreen !== OFFER_SCREEN_INDEX;
}

/**
 * Whether onboarding paints its own header (back arrow + progress mandala).
 *
 * The offer step embeds a full screen that ships its own chrome. Onboarding's
 * `headerRow` is `zIndex: 10` and right-aligned, which lands the 44px progress
 * mandala on top of SupportSakinaScreen's own 44px close button — they sit
 * within 8px of each other on both axes. The embedded screen owns that corner.
 */
export function showsOnboardingChrome(currentScreen: number): boolean {
  return currentScreen !== OFFER_SCREEN_INDEX;
}
