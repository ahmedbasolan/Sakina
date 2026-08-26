# Lifetime Plan — External Platform Configuration

**Date:** 2026-08-26
**Status:** App code complete and verified. iOS + RevenueCat (App Store side) CONFIGURED 2026-08-26. Remaining: (a) the ASC review screenshot + submission with a build, (b) all of Android, which is blocked on a Google Payments merchant account and a Play service-account key — both owner-only.
**Companion to:** [2026-08-16-onboarding-trial-offer-platform-config.md](2026-08-16-onboarding-trial-offer-platform-config.md)

## What the app code now does

A third plan card — **Lifetime** — was added to `SupportSakinaScreen` (the one
paywall, rendered both from Settings and as onboarding's final step).

The card is **gated on the store actually returning a LIFETIME package**:

```
hasLifetime = !!pricing?.lifetimePrice
```

`revenueCatService.getPricing()` deliberately does **not** require a lifetime
package the way it requires MONTHLY and ANNUAL. A missing lifetime product
degrades to "no lifetime card", never to "no pricing at all" — so this code is
inert and the paywall is byte-for-byte unchanged until the store config below
is finished. There is no launch risk in shipping the code first.

Entitlement is unchanged: lifetime grants the same **`Sakina Pro`** entitlement
as the subscriptions, so no gating logic anywhere else in the app changed.

Lifetime is detected at runtime from a **null `expirationDate`** on the active
entitlement (`subscriptionService.syncFromCustomerInfo`), not from the product
id. That signal needs no network call and no cached offering, so it stays
correct offline and immediately after `restorePurchases()` — which, unlike
`purchasePackage()`, never primes the offering cache.

---

## ✅ RESOLVED — the dangling `$rc_lifetime` package

The 2026-08-16 audit recorded this, under "Real remaining gaps":

> **The `default` offering's Lifetime package has no App Store product**
> attached (Test Store only). Harmless — the code reads only MONTHLY/ANNUAL —
> but it is a dangling package.

That "harmless" stopped holding the moment this code shipped, because the app
now reads LIFETIME. **Fixed 2026-08-26** by attaching the real App Store
product, which was always the intended path (the alternative was deleting the
package). Verified in the dashboard: `$rc_lifetime` → `sakina_pro_lifetime`.

The Test Store `lifetime` product remains attached alongside it — that matches
`$rc_monthly` and `$rc_annual`, which each carry a Test Store product next to
their App Store one. It is the house pattern here, not a leftover.

---

## Decisions taken

| Item | Value | Why |
|---|---|---|
| Price | **400 AED** (≈ $109 USD) | Owner decision, 2026-08-26. ~2.4× the annual. See "pricing note" below. |
| Product id | `sakina_pro_lifetime` | Matches the existing `sakina_pro_monthly` / `sakina_pro_yearly` convention. |
| RC package | `$rc_lifetime` | Already exists in the `default` offering; attach products to it. |
| Entitlement | `Sakina Pro` | Unchanged — exact string match to `RC_ENTITLEMENT_ID`. |
| Placement | Third card, annual stays pre-selected | Leaves the free-trial funnel — the strongest converter — untouched. |

**Pricing note.** At 400 AED the lifetime pays for itself against the annual in
roughly 2.4 years. That is a deliberate, informed choice: a 200 AED lifetime
(the original ask) would have paid back in ~13 months and cannibalised the
annual almost entirely. Recorded here so the reasoning survives the decision.

---

## 1. App Store Connect (iOS) — DONE except the review screenshot

1. **App Store Connect → Sakina: Quran & Reflection** (Apple ID `6801511292`)
   → *Monetization* → *In-App Purchases* → **+**.
2. Type: **Non-Consumable**. *(Not a subscription — this is the whole point.
   A non-consumable never renews and restores across the user's devices.)*
3. Reference Name: `Sakina Pro Lifetime` · Product ID: `sakina_pro_lifetime`.
4. **Price:** choose **United Arab Emirates (AED)** as the base storefront and
   pick the price point nearest **AED 400**, then let Apple auto-generate the
   other 174 storefronts. Setting a USD base instead will land UAE somewhere
   near AED 399–405 rather than exactly on it.
5. Add the localized display name + description, and the required review
   screenshot.
6. Submit it **with the next app version** — App Store Connect will not make a
   first in-app purchase live on its own.

**Done 2026-08-26.** Created as Apple ID `6805610290`, Non-Consumable,
`sakina_pro_lifetime`, all 175 regions, base storefront UAE at exactly
**AED 400.00** (Apple derived US $99.99, AU$149.99). English (U.S.) localization
set: "Sakina Pro Lifetime" / "One payment. Sakina Pro is yours forever."

**Still outstanding:** the *Review Screenshot* under Review Information — the
only field blocking **Add for Review**, and it must be a real screenshot of the
paywall showing the Lifetime card, so it can only be taken after a build that
includes this code runs against the now-configured offering. Note iOS 1.2 is
already "Waiting for Review", so this IAP rides along with the *next* version
after that, not the in-flight one.

## 2. Google Play Console (Android) — BLOCKED, and not on anything code-side

Inspected directly 2026-08-26 with owner access (developer account **FlyingSloth**,
ID `6888748922183534243`; app **Sakina** `com.lelahmed.sakina`, ID
`4972277785251473915`, status **Draft**).

Two hard prerequisites are missing. **Both require the account owner** — they
involve banking details and private keys, which is why they cannot be delegated:

### 2a. Google Payments merchant account — blocks everything

*Monetize with Play* shows "To monetize this app, set up a merchant account",
and both product pages return:

> **Missing requirements for accessing this page** — You need to set up a
> Google Payments merchant account to access this page

Verified on **One-time products** *and* **Subscriptions** separately; it is not
a lifetime-specific gate. Until this exists, **zero** in-app products of any
kind can be created. Setting it up requires legal identity, tax information and
a **bank account for payouts**.

### 2b. RevenueCat has no Play service account credentials

`Sakina (Play Store)` (`appfbd8557113`) has an **empty** *Service Account
Credentials JSON* field. RevenueCat cannot validate a single Android
transaction without it. Producing it means creating a Google Cloud service
account, granting it Play Console access, and downloading its **private key**.

### Then, and only then, the products

1. **One-time products** → Create → id `sakina_pro_lifetime`, **AED 400**, Activate.
2. **Subscriptions** → `sakina_pro_monthly` and `sakina_pro_yearly`, prices
   mirroring iOS, plus a 7-day free trial on the yearly base plan to match the
   `sakina_pro_yearly` intro offer that is already live in all 175 Apple regions.
3. A Play product left as a **draft** is invisible to the SDK. Activate all three.

**Why all three, not just lifetime.** `revenueCatService.getPricing()` returns
`null` unless a MONTHLY **and** an ANNUAL package both resolve, and the paywall
withholds every card and the CTA when pricing is null. So a lifetime-only Play
setup would render an Android paywall with *nothing on it* — not a lifetime
card. Android needs the full set before any of it shows.

### Do NOT pre-wire RevenueCat ahead of these

It is tempting to create the three Play products in RevenueCat now so it is
"ready". Don't. That is precisely how the dangling `$rc_lifetime` package this
document opens with came to exist: RC config created ahead of real store
products, left pointing at nothing, and three months later it had quietly
become a hazard that a code change turned live. Create the Play products
first, then wire RevenueCat in one pass where every entry points at something
real. (Play subscriptions also need a `productId:basePlanId` identifier in RC,
and the base plan ids do not exist until step 2 above — so pre-wiring the two
subscriptions would be guessing, not preparation.)

## 3. RevenueCat — DONE (App Store side)

1. **Products** → *+ New* → attach `sakina_pro_lifetime` for **both** the
   App Store app (`Sakina (App Store)`, `app1334151fdb`) and the Play Store app
   once it exists.
2. **Entitlements → `Sakina Pro`** → attach both new products. *This is the
   step that actually unlocks the app.* Miss it and the purchase succeeds while
   the user stays locked as free, with no error shown.
3. **Offerings → `default` → `$rc_lifetime`** → attach the real store products,
   replacing the Test Store placeholder that is there now.

**Done 2026-08-26**, verified by re-reading each page rather than trusting the
save toast (the entitlement table renders stale immediately after attaching):

- Product `sakina_pro_lifetime` created under `Sakina (App Store)`, type
  Non-consumable, RC id `prodd118d88322`. Store Status reads **Missing
  Metadata** — that is the absent ASC review screenshot, and it clears when the
  screenshot is added.
- Attached to the `Sakina Pro` entitlement, which now lists **6 products**
  (3 Test Store + 3 App Store).
- Attached to `$rc_lifetime` in the `default` offering.

The Play Store half of step 1 is still open and blocked on section 2.

---

## Verifying it worked

No device needed for the first check:

- In RevenueCat, the `default` offering should list **three** packages, each
  showing a real store product, and `Sakina Pro` should list its attached
  products. **Confirmed 2026-08-26:** all three packages carry an App Store
  product, and the entitlement holds 6 (3 Test Store + 3 App Store).

Then on a device (sandbox account):

- The paywall shows **three** cards, with **Annual still pre-selected**.
- Tapping *Lifetime* changes the CTA to **"Unlock Sakina for life"** and the
  note beneath it to `AED 400.00 once · never renews · …` — with **no**
  "auto-renews" or "cancel anytime" wording, which would describe a
  subscription the user is not buying.
- After purchase, *Restore Purchases* on a second device signed into the same
  store account re-grants Pro.

If the lifetime card does not appear, the cause is one of the three RevenueCat
steps above — the app cannot render a package the offering does not return.
