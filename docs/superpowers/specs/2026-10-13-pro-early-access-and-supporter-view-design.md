# Pro Early Access & "What Your Support Built" — Design

Date: 2026-10-13 · Owner decision in chat, same day.

## Why

A free/Pro audit (2026-10-13) found a Pro subscriber's day is almost identical
to a free user's, and that the paywall's "Early access to new journeys" bullet
was false. The owner chose two features to fix that:

1. **Rolling early access** — every new journey is Pro-only for a fixed window
   after release, then opens to everyone *automatically*.
2. **What your support built** — a Pro user who opens the Support screen sees
   a thank-you view (supporting since, journeys released since they joined)
   instead of the purchase paywall they already paid through.

The owner also removed the free trial the same day (commit 3a92a39). Nothing
here may reintroduce trial copy.

## Feature 1 — rolling early access

- One structure holds every startable journey: id → `{ released, access }`.
  `released` is the `YYYY-MM-DD` the journey reaches Pro users (the release
  day of the build that carries it). `access` is one of:
  - `'early_access'` — **the default for new journeys.** Pro-only for
    `EARLY_ACCESS_DAYS = 30` days from `released`, then free.
  - `'pro_exclusive'` — Pro-only, no free date (Marriage Seeker, Death
    Awareness today).
  - `'free'` — never gated. Required for crisis/distress journeys: a person in
    crisis must not meet a paywall. Hope After Crisis is `'free'`.
- The free date is **computed**, never hand-written. A dated label can then
  never go stale the way "Free tier · 2 weeks" did on Trusting the Results.
- Locked card label for a free user: `Free from Nov 12` (computed). Pro-
  exclusive keeps `Sakina Pro exclusive`. Contentless stubs say `Coming soon`
  (they used to say "Early Access · Coming Soon", which would now read as the
  Pro window).
- Pro users see a small `Pro early access` pill on an unlocked card that is in
  its window — so the perk is visible where it is used.
- Grandfathering is unchanged: anyone with existing progress on a journey can
  keep going, whatever their tier now.
- A free user tapping an early-access card goes to the Support screen (same as
  the Pro-exclusive gate today).
- Explore stays "newest first" for free users: only contentless stubs sink to
  the bottom. A locked new journey keeps its date position (it used to sink
  with every locked card, which would bury exactly the journey early access
  exists to announce). Side effect: Marriage Seeker and Death Awareness move
  from the bottom into date order for free users.
- Every journey currently shipped is older than 30 days, so this changes no
  card on release day; it takes effect with the next journey.
- Paywall bullet returns, truthfully: "Early access to new journeys — every new
  journey opens to Pro 30 days before everyone else" (number interpolated).

Known and accepted: the date is the device's local date, so a free user who
moves their clock forward unlocks early. Low stakes, not worth a server check.

## Feature 4 — "What your support built"

- Shown on `SupportSakinaScreen` (Settings → "Sakina Pro · Active") when the
  user is premium and the screen is not embedded in onboarding.
- Content, in order:
  1. Title: "Thank you for supporting Sakina".
  2. "Supporting since Sep 3, 2026" — from RevenueCat's entitlement
     `originalPurchaseDateMillis`. Omitted entirely when unknown (never
     "Invalid Date").
  3. Plan line from existing `SubscriptionState`: Lifetime · Yearly/Monthly,
     renews <date> · or "Pro until <date>" when `willRenew` is false.
  4. "Built since you joined": journeys whose `released` is on/after the
     supporting-since day and not in the future. Each row: title, release
     date, and — if still in its early-access window — "Opens to everyone on
     <date>". Empty state: "The next journey is being written. Your support is
     what keeps new ones coming." (No date promised.) When supporting-since is
     unknown, the section is omitted.
  5. "Manage subscription" text link, shown only when RevenueCat's
     `CustomerInfo.managementURL` exists — which also keeps it off lifetime
     unlocks and promotional grants (the App Review demo account), where there
     is nothing to manage. iOS opens `Purchases.showManageSubscriptions()`;
     that API is iOS-only, so Android opens the management URL (Play's
     subscriptions page).
- Supporting-since is kept in memory on `SubscriptionState` only — no schema
  change, no new kv_store key (a kv key would be personal data and would have
  to join `clearAllLocalUserData`).

## Out of scope

Weekly recap, verse-linked insights, journey deep-dive layers (ideas 2, 3, 5,
6 of the audit). Server-side clock checks. Any change to which existing journey
is gated.
