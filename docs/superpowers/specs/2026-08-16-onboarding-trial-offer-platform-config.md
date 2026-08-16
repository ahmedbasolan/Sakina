# Onboarding Trial Offer — External Platform Configuration

**Date:** 2026-08-16
**Companion to:** [2026-08-16-onboarding-trial-offer-design.md](2026-08-16-onboarding-trial-offer-design.md)

## Why this document exists

The app-side work for the onboarding trial offer is complete and committed.
**None of it produces a free trial on its own.** The "7-day trial" is a store
artifact — it is configured in App Store Connect / Google Play Console, exposed
to the app through a RevenueCat offering, and merely *rendered* by our code.
Ship the app code without the store config and users get a plain "Subscribe
yearly" button, which is precisely the ~5x-worse conversion path the whole
feature exists to avoid.

Every claim below was verified by reading the shipped source. Where something
could not be verified from this machine, it says so explicitly rather than
guessing.

---

## 1. RevenueCat — REQUIRED

**Entitlement identifier must be exactly `Sakina Pro`** (case and space
sensitive). Hardcoded at [`revenueCatService.ts:34`](../../../src/services/revenueCatService.ts#L34)
as `RC_ENTITLEMENT_ID`; every premium check in the app is
`info.entitlements.active['Sakina Pro']`. A mismatched identifier means a
paying user stays locked as free with no error shown.

**The current offering must contain BOTH an `ANNUAL` and a `MONTHLY` package.**
[`getPricing()`](../../../src/services/revenueCatService.ts#L170) returns `null`
if *either* is missing. On `null`, `freemiumService.getPricing()` silently falls
back to the hardcoded `SUBSCRIPTION_PRICING` constants ($4.99 / $39.99, USD,
[`constants/index.ts:171`](../../../src/constants/index.ts#L171)). The paywall
then displays those numbers regardless of the real store price or the user's
currency. This is a pre-existing behavior, not introduced by this feature, but
the onboarding placement means far more users now see that screen.

**The annual product must carry an introductory free-trial offer.** `trialDays`
is read from `yearly.product.introPrice.periodNumberOfUnits`, falling back to
the literal `7` when `introPrice` is absent
([`revenueCatService.ts:190`](../../../src/services/revenueCatService.ts#L190)).
That fallback is display-only and does not create a trial.

**Known blocker (from prior session notes, NOT verifiable from this machine):**
the RevenueCat project reportedly has no iOS app configured and a stale `appl_`
key. `.env` does contain a 32-character `appl_`-prefixed
`REVENUECAT_IOS_API_KEY` and a `goog_`-prefixed Android key, but key *validity*
and dashboard state cannot be checked from here. Verify both in the dashboard
before relying on iOS at all.

---

## 2. App Store Connect — REQUIRED for iOS

Create/confirm on the **annual** auto-renewable subscription:

- An **Introductory Offer** of type **Free Trial**, duration **1 week**, for all
  intended territories.
- Duration must match what the UI promises. The CTA renders
  `Start ${pricing.trialDays}-day free trial`, so a 3-day or 1-month store offer
  would produce copy that contradicts the store sheet.
- Both subscription products (monthly + annual) must be in a state RC can read
  ("Ready to Submit" or approved) and attached to the RC offering.

**Degradation if skipped:** `isYearlyTrialEligible()`
([`revenueCatService.ts:139`](../../../src/services/revenueCatService.ts#L139))
requires `status === INTRO_ELIGIBILITY_STATUS_ELIGIBLE` strictly and returns
`false` on any other status or on throw. So the UI correctly falls back to
"Subscribe yearly" — it will not lie to the user. But the feature's entire
premise (card-required trial ≈ 5x conversion) is gone, and nothing in the app
will warn you. **This is the single highest-risk item on this list.**

Also note the prior-session blocker: **no Apple team on EAS yet**, which gates
building an iOS binary at all.

---

## 3. Google Play Console — REQUIRED for Android

Same shape: the annual subscription's base plan needs a **free trial offer**
(Play models these as base-plan *offers*, not a product-level intro price).

**Unverified — must be checked on a real device:** on Google Play,
`checkTrialOrIntroductoryPriceEligibility` does not always resolve to
`ELIGIBLE` the way StoreKit does; RevenueCat's own docs note Play eligibility
can come back `UNKNOWN`. Because our check demands strict `ELIGIBLE`, an
`UNKNOWN` result would hide the trial CTA on Android even with the offer
correctly configured. I could not test this from here. Verify on an Android
device with a licence-tester account before concluding the store config is
wrong — the bug may be in our strict comparison, not in the Play setup.

---

## 4. Supabase — NO CHANGES NEEDED

Verified, not assumed:

- [`subscriptionService.ts:225-229`](../../../src/services/subscriptionService.ts#L225)
  states subscription state is *intentionally* not synced to Supabase, because
  RevenueCat is authoritative and a Supabase trigger already blocks client-side
  writes to subscription fields.
- `user_profiles` does have `subscription_tier` / `subscription_type` /
  `subscription_end` columns, but the only writer,
  `supabaseDataService.updateUserProfile()`, has **zero callers** in the
  codebase.
- Entitlement is cached locally in the SQLite `user_subscription` table only.

If server-side entitlement checking is ever wanted, the documented path is a
RevenueCat webhook → Edge Function writing with the `service_role` key. That is
out of scope here and is not required for this feature.

**Stale comment worth fixing separately:** the docstring at
[`subscriptionService.ts:160-162`](../../../src/services/subscriptionService.ts#L160)
claims state is persisted "to SQLite and Supabase", which the code 60 lines
below explicitly contradicts. Misleading, harmless at runtime.

---

## 5. PostHog — NO CHANGES, BY DECISION

Per spec §6, this feature adds no analytics. PostHog is deliberately scoped to
crash/error reporting only, defaults to opted-**out**, and has app-lifecycle
events disabled so the "Share Crash Reports" consent label stays accurate for
store privacy forms ([`posthog.ts:2`](../../../src/config/posthog.ts#L2)).

Adding funnel events (offer-viewed, skip-tapped) would create a new
usage-analytics data category requiring: new consent copy in Settings, an
updated App Store / Play data-safety disclosure, and re-review. Do not add them
incidentally.

**Measurement without new code:** RevenueCat's dashboard reports trial starts,
trial-to-paid conversion, and churn tagged by product and offering. That answers
"did the onboarding offer work" on its own. To distinguish onboarding-originated
trials from Settings-originated ones later, the clean approach is a *separate RC
offering* (e.g. `onboarding`) presented only at step 8 — no client analytics
required. Not implemented; noted as the cheap option if you want the split.

---

## Pre-launch checklist

- [ ] RC entitlement is named exactly `Sakina Pro`
- [ ] RC current offering has both ANNUAL and MONTHLY packages
- [ ] App Store Connect: 1-week Free Trial introductory offer on the annual product
- [ ] Play Console: free-trial offer on the annual base plan
- [ ] RC iOS app exists and the `appl_` key is current (flagged stale previously)
- [ ] Apple team added to EAS so an iOS build is possible at all
- [ ] On device: confirm the CTA reads "Start 7-day free trial", not "Subscribe yearly"
- [ ] On Android specifically: confirm eligibility resolves ELIGIBLE, not UNKNOWN
- [ ] Confirm displayed prices come from the store, not the $4.99/$39.99 fallback
