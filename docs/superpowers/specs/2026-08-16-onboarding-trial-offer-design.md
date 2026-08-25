# Sakina — Onboarding Trial Offer

**Date:** 2026-08-16
**Status:** Draft v2 (revised after self-audit)

**Changelog:**
- v2: audit against source (not memory) found the `TOTAL_SCREENS` bump alone
  unlocks swipe-past-Commit, bypassing the hold-to-commit ritual — added an
  explicit `COMMIT_SCREEN_INDEX` swipe-guard fix. Found `CommitScreen`'s
  completion text over-promises ("Your first verse awaits") once Commit no
  longer leads straight to Home — added a copy fix. Replaced the planned new
  "Continue with the free plan" button with reusing the screen's existing
  "Prefer to wait…" footer line as the tap target, avoiding duplicate copy and
  a footer-height regression the code comments flagged as already
  tuned-to-fit.

---

## 1. Context & Problem

Sakina's freemium model ([2026-06-08-freemium-monetization-model-design.md](2026-06-08-freemium-monetization-model-design.md))
deliberately removed a blocking onboarding paywall and moved every upgrade ask
to "peaks" — journey completion, theme pick, Support screen — capped at one ask
per 3 days, never the same peak twice in a row. That remains correct: it's why
`getPaywallType()` hard-returns `null` and the app never interrupts someone in
distress with a price.

But it has a side effect the spec didn't intend: **no upgrade ask exists at
all until a user reaches a peak**, and most peaks (journey completion, streak
milestones) take days. Industry data (RevenueCat *State of Subscription Apps
2026*, 115k+ apps) shows over 80% of trial starts happen the user's first day
in the app, and card-required store trials convert ~5x better than opt-in /
no-card offers. Sakina's peaks-only model structurally cannot reach that
first-day moment — by the time a peak fires, the highest-intent window has
usually closed.

This spec adds exactly one thing: a **skippable, card-required 7-day trial
offer** as the last step of onboarding, placed *after* the user has already
received real value (FirstGuidanceScreen, step 4) and made an emotional
commitment (CommitScreen, step 7) — not before either, which is what made the
old onboarding paywall "cold." Declining costs nothing; the full free
experience is exactly as generous as it is today. This is a **placement-only**
change — no premium feature, price, or trial length changes here.

---

## 2. Where This Sits Relative to §8

§8 of the freemium spec still governs: peaks-only, cooldown, never-repeat.
This offer is not a new peak type and doesn't change that system. It's a
**one-time, pre-peak ask** that happens to reuse the same screen component.
Because `SupportSakinaScreen` already calls `freemium.recordUpgradeAsk('support_screen')`
unconditionally on mount for non-premium users, showing it at onboarding
naturally starts the 3-day cooldown right there — so a user who sees (and
maybe declines) this offer won't also get hit by a peak ask a day later. That
is reused behavior, not new logic, and it's the right default: nobody sees
pricing twice in their first 3 days.

---

## 3. Architecture

**Navigation constraint (why this must live inside `OnboardingScreen`, not
after it):** `MainNavigator.tsx:190` renders `Onboarding` vs `Main` based on
`!user && !isGuest`. `AuthContext.enterGuestMode()` sets `isGuest = true`,
which unmounts the onboarding stack immediately. So the offer screen must fire
*before* `enterGuestMode` is called — it cannot be a modal or sheet shown
after onboarding hands off to Home.

**Changes:**

- `OnboardingScreen.tsx`: `TOTAL_SCREENS` 8→9. New `case 8` renders
  `<SupportSakinaScreen embedded onDone={handleOfferDone} />`.
- `CommitScreen`'s `onCommit` prop currently calls `handleCommitComplete` →
  `enterGuestMode(true)` directly ([OnboardingScreen.tsx:202](../../../src/screens/OnboardingScreen.tsx#L202)).
  It changes to call `goNext()` instead, advancing to the new step 8.
  `handleCommitComplete` (the `enterGuestMode(true)` call) moves to a new
  `handleOfferDone` callback, wired as step 8's `onDone`.
- `SupportSakinaScreen.tsx`: add two optional props, default `embedded =
  false` so the existing Settings → Support push (no props passed) is
  unaffected:
  - `embedded?: boolean`
  - `onDone?: () => void`

  Three call sites currently hardcode `navigation.goBack()` and switch to
  `embedded ? onDone?.() : navigation.goBack()`:
  1. Close-X press ([:250](../../../src/screens/SupportSakinaScreen.tsx#L250))
  2. Purchase success ([:202](../../../src/screens/SupportSakinaScreen.tsx#L202))
  3. Restore success ([:224](../../../src/screens/SupportSakinaScreen.tsx#L224))

  `useNavigation()` stays imported (still used for the non-embedded path);
  no signature break for any existing caller.

- `OnboardingScreen.tsx` swipe gate — **required fix, not optional.** The
  forward-swipe check at [:187](../../../src/screens/OnboardingScreen.tsx#L187)
  is `currentScreen < TOTAL_SCREENS - 1`. Today (`TOTAL_SCREENS = 8`) that
  evaluates to `7 < 7 = false` at CommitScreen (index 7) — swipe-forward is
  blocked there today, which is why "hold 3 seconds to seal your intention"
  can only be completed by holding, never bypassed with a swipe. Bumping
  `TOTAL_SCREENS` to 9 alone flips that same check to `7 < 8 = true`,
  silently unlocking swipe-past-Commit and letting a user skip the hold
  ritual entirely to reach the new offer screen. Fix: exclude the Commit
  index explicitly, independent of `TOTAL_SCREENS`:
  ```ts
  const COMMIT_SCREEN_INDEX = 7; // CommitScreen — never swipeable past; must hold
  // ...
  (translationX < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) &&
  currentScreen < TOTAL_SCREENS - 1 &&
  currentScreen !== COMMIT_SCREEN_INDEX
  ```
  This must ship in the same change as the `TOTAL_SCREENS` bump — the two are
  not separable.

**Data flow:** identical to the existing Support screen — `trialEligible` via
`revenueCat.isYearlyTrialEligible()`, pricing via `revenueCat.getPricing()`
falling back to `freemium.getPricing()`, purchase via `freemium.startTrial()`
/ `freemium.activatePremium('monthly')`, restore via `freemium.restorePurchase()`.
None of that changes — only the exit path does.

---

## 4. UX Details

- **Skip affordance — reuse existing copy, don't add a new element.** The
  footer already has an unconditional static line, "Prefer to wait? Sakina
  stays fully usable free — no pressure." ([SupportSakinaScreen.tsx:395-397](../../../src/screens/SupportSakinaScreen.tsx#L395)).
  Adding a *separate* new "Continue with the free plan" button next to it
  would duplicate the same message and risks re-breaking `scroll.paddingBottom:
  200`, which a code comment there says was already tuned exactly for today's
  footer line count. Instead, when `embedded`, wrap that existing text in a
  `TouchableOpacity` calling `onDone` — one element, no new copy, no footer
  height change. Close-X keeps doing the same thing via `onDone` too, so
  there are two ways to skip (top-right icon, footer text), zero new ones.
- **Trial-ineligible fallback:** unchanged — already handled. Someone who
  already used the yearly trial (reinstall, restored device) sees "Subscribe
  yearly" instead of "Start 7-day trial" ([SupportSakinaScreen.tsx:177-182](../../../src/screens/SupportSakinaScreen.tsx#L177)).
  No special onboarding-specific copy needed.
- **Copy:** reuse existing screen copy as-is ("Support Sakina," feature list,
  plan cards). No onboarding-specific variant — keeps one paywall to maintain,
  per the reuse decision above.
- **`CommitScreen.tsx` completion text — required fix.** `completionHint`
  ([:409](../../../src/components/onboarding/CommitScreen.tsx#L409)) reads
  "Your first verse awaits," shown ~2s before `onCommit()` fires. That's
  approximately true today (`onCommit` → Home, which leads with verse
  content). Once `onCommit` leads to the offer screen instead, the user's
  literal next screen is pricing, not a verse — a one-screen-delayed but real
  over-promise. Change the string to something that doesn't specify what
  comes next, e.g. **"Just one more step"**. One-line change, in scope.

---

## 5. Error Handling

No new error paths. Purchase failure, restore failure, and legal-link-open
failure are already handled with `Alert.alert` in the existing `handleContinue`
/ `handleRestore` / `openLegal` functions, none of which depend on navigation
context — they work identically embedded or pushed.

---

## 6. Measurement

RevenueCat's own dashboard already reports trial starts and conversions
tagged by product/offering — sufficient to answer "did this work" without new
code. PostHog is explicitly scoped to crash/error reporting only, default
opt-out, with app-lifecycle events disabled specifically to keep the "Share
Crash Reports" consent label accurate for store privacy forms ([posthog.ts:2](../../../src/config/posthog.ts#L2)).
Adding funnel events (screen-view, skip-tap) would be a new usage-analytics
category requiring new consent copy and a privacy-form update — **out of
scope for this spec**. If per-step drop-off data is wanted later, that's a
separate, explicit decision, not a byproduct of this change.

---

## 7. Testing

No new pure-logic function is introduced — the changes are a screen-index
bump, a prop-gated callback swap, and a conditional in three existing
handlers. No unit-testable logic beyond what `freemiumService.test.ts` /
`subscriptionService` already cover (untouched).

Verify on-device (per project convention — visual changes aren't
typecheck-verifiable):
1. Fresh onboarding run → reach CommitScreen → commit → new step 8 (Support
   screen) appears, does **not** drop straight to Home.
2. On CommitScreen (index 7), attempt a forward swipe **without** holding the
   star — must NOT advance. This is the regression the `TOTAL_SCREENS` bump
   introduces if `COMMIT_SCREEN_INDEX` isn't excluded; test it explicitly, not
   just the hold path.
3. Hold the star to completion → confirm the completion hint no longer
   promises a verse ("Just one more step" or equivalent) → step 8 appears.
4. Tap the "Prefer to wait…" footer line → lands on Home, `isPremium() ===
   false`, free limits intact (3 refreshes/window, 30 saves).
5. Tap yearly plan → sandbox-purchase the trial → lands on Home,
   `isPremium() === true`.
6. Tap close-X → same result as the footer line (both call `onDone`).
7. Settings → "Upgrade to Sakina Pro" still pushes `SupportSakinaScreen`
   normally (non-embedded) with working close-X `goBack()` — regression check
   that `embedded` defaulting `false` didn't change existing behavior.
8. `npx tsc --noEmit -p tsconfig.json` clean.

---

## 8. Out of Scope (explicitly deferred)

- Changing what's included in Premium (still cosmetic-leaning — separate
  decision, not part of this spec).
- Changing price ($4.99/mo, $39.99/yr) or trial length (7 days).
- New analytics/consent category for funnel instrumentation.
- Any change to the peaks-only `shouldOfferUpgrade` system itself.
