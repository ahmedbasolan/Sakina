# Sakina — Onboarding Trial Offer

**Date:** 2026-08-16
**Status:** Draft v1

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

**Data flow:** identical to the existing Support screen — `trialEligible` via
`revenueCat.isYearlyTrialEligible()`, pricing via `revenueCat.getPricing()`
falling back to `freemium.getPricing()`, purchase via `freemium.startTrial()`
/ `freemium.activatePremium('monthly')`, restore via `freemium.restorePurchase()`.
None of that changes — only the exit path does.

---

## 4. UX Details

- **Skip affordance:** the close-X alone is ambiguous here — there's nothing
  to "go back" to, onboarding is complete. When `embedded`, add a text button
  near the close-X reading **"Continue with the free plan"**, wired to the
  same `onDone`. Both the X and the text button do the same thing; the text
  button exists so skipping doesn't require decoding an icon.
- **Trial-ineligible fallback:** unchanged — already handled. Someone who
  already used the yearly trial (reinstall, restored device) sees "Subscribe
  yearly" instead of "Start 7-day trial" ([SupportSakinaScreen.tsx:177-182](../../../src/screens/SupportSakinaScreen.tsx#L177)).
  No special onboarding-specific copy needed.
- **Copy:** reuse existing screen copy as-is ("Support Sakina," feature list,
  plan cards). No onboarding-specific variant — keeps one paywall to maintain,
  per the reuse decision above.

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
2. Tap "Continue with the free plan" → lands on Home, `isPremium() === false`,
   free limits intact (3 refreshes/window, 30 saves).
3. Tap yearly plan → sandbox-purchase the trial → lands on Home,
   `isPremium() === true`.
4. Tap close-X → same result as "Continue with the free plan" (both call
   `onDone`).
5. Settings → "Upgrade to Sakina Pro" still pushes `SupportSakinaScreen`
   normally (non-embedded) with working close-X `goBack()` — regression check
   that `embedded` defaulting `false` didn't change existing behavior.
6. `npx tsc --noEmit -p tsconfig.json` clean.

---

## 8. Out of Scope (explicitly deferred)

- Changing what's included in Premium (still cosmetic-leaning — separate
  decision, not part of this spec).
- Changing price ($4.99/mo, $39.99/yr) or trial length (7 days).
- New analytics/consent category for funnel instrumentation.
- Any change to the peaks-only `shouldOfferUpgrade` system itself.
