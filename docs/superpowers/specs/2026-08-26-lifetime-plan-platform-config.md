# Lifetime Plan — External Platform Configuration

**Date:** 2026-08-26
**Status:** App code complete and verified. **iOS, Android and RevenueCat all CONFIGURED** (2026-08-26/27). Remaining: (a) the ASC review screenshot + submission with a build, (b) rotate the Play service-account key, (c) device verification.
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

## 2. Google Play Console (Android) — IN PROGRESS

Developer account **FlyingSloth** (`6888748922183534243`), app **Sakina**
`com.lelahmed.sakina` (`4972277785251473915`), status Draft.

### 2a. Google Payments merchant account — ✅ DONE by the owner, 2026-08-26

Both product pages previously returned *"Missing requirements for accessing
this page — You need to set up a Google Payments merchant account"*. That gate
is cleared; both pages now load.

### 2b. Bundle uploaded — ✅ DONE 2026-08-27

`eas submit` pushed build `5b45e474` (versionCode 3) to the **internal** track
via the Play API. Two dead ends worth recording:

- **`eas submit --key <path>` does not exist** in eas-cli 22.4. That flag is what
  two manual attempts used, and it fails with `Nonexistent flag: --key`. The key
  path belongs in `eas.json` under `submit.<profile>.android.serviceAccountKeyPath`,
  now set to `../keys/sakina-501416-153ce82ddd0a.json` (relative to the project
  root, so it is not machine-specific and no secret enters the repo).
- **Browser upload is impossible for this file.** The Claude-in-Chrome bridge caps
  transfers at 10 MB; the AAB is 91 MB. Two manual drag-and-drop attempts produced
  a *saved draft release with an empty bundle box* — Play persists the draft even
  when the upload has not finished, which looks identical to success. Always verify
  via **Add from library** or the bundle explorer, never by the form appearing to
  show a version.

**The BILLING permission was never the problem.** Confirmed by unzipping the built
AAB's own `base/manifest/AndroidManifest.xml`: it contains
`com.android.vending.BILLING`, inherited from
`purchases-hybrid-common` → `com.android.billingclient:billing:8.3.0`.
`react-native-purchases` does not declare it, so grepping `node_modules` is
misleading. Play's message was about the absent upload.

### 2c. The Google service account key blocks TWO things, not one

`Sakina (Play Store)` (`appfbd8557113`) still has an empty *Service Account
Credentials JSON*. Separately, `eas.json`'s `submit` block configures **iOS
only** — there is no Android submit config and no service account key anywhere
in the repo, so `eas submit --platform android` cannot upload either.

One key, created once, unblocks both: RevenueCat validating Android purchases
(non-optional — without it no Android purchase is ever verified) and automated
Play uploads forever after. It requires a Google Cloud service account and a
**private key download**, so it is owner-only.

Until it exists, this first bundle must be uploaded by hand through the Play
Console UI.

### 2d. Play products

**`sakina_pro_lifetime` — ✅ CREATED AND ACTIVE 2026-08-27.**
Purchase option `sakina-pro-lifetime` (hyphens — Play forbids underscores in
purchase option ids, unlike product ids), type **Buy**, all regions.
Base AED 400 → Play **charm-priced UAE to AED 399.99** (Apple has exactly
400.00). One fils apart across platforms; left as-is since charming is Play's
convention. Play also converts differently from Apple elsewhere — e.g. Albania
USD 130.68 on Play vs $119.99 on Apple. Expect small cross-platform deltas.

**Subscriptions — ✅ CREATED AND ACTIVE 2026-08-27**, mirroring iOS exactly:

| | Product id | Base plan id | Base price | Offer |
|---|---|---|---|---|
| Yearly | `sakina_pro_yearly` | `yearly` | **USD 39.99** (UAE AED 144.99) | `free-trial-7d`, **1 week free**, New customer acquisition — **Active** |
| Monthly | `sakina_pro_monthly` | `monthly` | **USD 4.99** (UAE AED 17.99) | none, matching iOS |

**RevenueCat addresses Play subscriptions as `productId:basePlanId`** — so the
RC identifiers are `sakina_pro_yearly:yearly` and `sakina_pro_monthly:monthly`.
That is why the base plan ids were chosen as plain `yearly`/`monthly`.

Gotchas hit while creating these:
- The billing period on a new base plan defaults to **Monthly** — it must be
  changed to Yearly on the yearly plan or you silently ship a monthly product
  under a yearly name.
- A free-trial phase defaults to **1 Months**, not 1 week. Apple's offer is
  "Free for the first week", so the unit must be switched to Weeks.
- Purchase option / base plan / offer ids allow **hyphens only, no underscores**
  (product ids allow underscores). Hence `sakina-pro-lifetime`, `free-trial-7d`.
- Base plans and offers save as **Draft** and each needs a separate **Activate**.

Note the ASC price tables are **virtualised** — scraping `document.body.innerText`
returns only ~185 rendered lines and will not contain a given country. Read the
base tier from the first rows instead of hunting one storefront.

**Why all three are required.** `getPricing()` returns `null` unless MONTHLY
**and** ANNUAL both resolve, and the paywall then withholds every card and the
CTA. Lifetime alone renders an empty Android paywall.

### 2e. RevenueCat Android wiring — ✅ DONE 2026-08-27

Owner saved the service-account JSON in RC (`Valid credentials`), after which
RC's **Import Products** pulled all three straight from Play — safer than
hand-typing ids. All three attached to `Sakina Pro` and into the packages:

| Package | Test Store | App Store | Play Store |
|---|---|---|---|
| `$rc_monthly` | `monthly` | `sakina_pro_monthly` | `sakina_pro_monthly:monthly` |
| `$rc_annual` | `yearly` | `sakina_pro_yearly` | `sakina_pro_yearly:yearly` |
| `$rc_lifetime` | `lifetime` | `sakina_pro_lifetime` | `sakina_pro_lifetime` |

**The RC offering editor lazily mounts one package at a time.** Setting all
three Play dropdowns in one pass and hitting Save silently discarded every
selection — the saved page came back showing only Test Store + App Store. It
only persisted when each package was set and **saved individually**, and the
Save had to be clicked **by element ref**, not coordinates (the RC layout
renders into a cramped region that makes coordinate clicks miss).

That is the third silent non-save in this project's RC dashboard, after the
stale entitlement table and the credentials field. **Never trust an RC save;
always reload the page and confirm the value came back.**

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
