# Sakina — Launch Readiness Checklist

**Date:** 2026-07-21
**Purpose:** Single source of truth for what's left before Google Play submission. Supersedes the "still open" items in `2026-07-12-launch-readiness-audit.md` — several were verified live today and are further along than that audit assumed.

Everything below marked ✅ was checked live today against the actual Supabase/RevenueCat/GitHub dashboards (not inferred from code). Everything marked 🔴/🟡 is a real gap or needs your action — items requiring account creation, payment, or credential entry are explicitly **yours to do**; that boundary isn't optional.

---

## 🔴 Blocking — must resolve before any Play submission

### 1. Google Play Console developer account
No developer account exists under **ahmed.basolan97@gmail.com** (the only account you use) — checking today hit the "choose an account type" signup screen, not a dashboard with an existing app. This is the actual critical-path item: account verification can take **days**, and nothing else Play-related can happen until it exists.
- [ ] Go to [play.google.com/console/signup](https://play.google.com/console/signup), **signed in as ahmed.basolan97@gmail.com**, and create the account (personal or org — org needs business verification, personal is faster).
- [ ] Pay the one-time $25 registration fee (your payment method — I don't do this for you).
- [ ] Wait for identity verification (can take 1-2 days, sometimes longer).
- [ ] Create the app listing "Sakina" with package `com.lelahmed.sakina`.

### 2. RevenueCat ↔ Play Billing isn't linked to anything real yet
Checked the RevenueCat dashboard directly: the **"Sakina Pro"** entitlement and the **"default"** offering both exist correctly and match the code (`RC_ENTITLEMENT_ID = 'Sakina Pro'` in `revenueCatService.ts`) — but all 3 attached products live under **Test Store**, not the **"Sakina (Play Store)"** app, which currently has **zero products**. This is almost certainly why RevenueCat shows 24 new customers in the last 28 days but $0 MRR and 0 active subscriptions — the SDK is live and talking to RC (Android integration is 100% adopted, confirmed under Apps → SDK Compatibility), but there's nothing real to purchase.
- [ ] (Blocked on #1) In Play Console, create the actual subscription products — a monthly and a yearly, matching whatever `subscriptionService.ts` / your paywall UI currently advertise. Check `PaywallScreen`/pricing copy for the exact price points you've been showing users.
- [ ] In RevenueCat → your project → **Apps → Sakina (Play Store)**, link the Play Console service account (Project settings → Integrations → Google Play; needs a service-account JSON key from Google Cloud with Play Android Developer API access — standard RC setup, their docs walk through it).
- [ ] Once linked, import/create the same products under the **Sakina (Play Store)** app in RevenueCat, attach them to the **Sakina Pro** entitlement, and add them as packages in the **default** offering (replacing or alongside the Test Store ones).
- [ ] Do a real sandbox purchase + restore on a device once live (this is B-9 from the prior audit — still open, now with a clear reason why).

### 3. No public account-deletion URL
Checked the `sakina-legal` GitHub repo directly — it contains only `privacy.html` and `terms.html`, both live and correctly loading at `ahmedbasolan.github.io/sakina-legal/{privacy,terms}.html`. There's no deletion page. Play's Data Safety section requires a **publicly reachable** account-deletion URL, separate from the in-app deletion flow you already have (`deleteAccount()` → `delete-account` edge function — that part's done).
- [ ] Add a `deletion.html` to `sakina-legal` — even a simple page explaining "open Settings → Delete Account in the app, or email [address] to request deletion" satisfies Play's requirement. Doesn't need to be a working form.

---

## ✅ Confirmed done today (live-checked, not just inferred from code)

- **Supabase → Confirm email = ON.** Closes the account-spoofing angle from the prior audit's B-1 fix. No longer "yours to do" — it's done.
- **Supabase → Google OAuth provider = Enabled**, with Client ID/Secret already saved.
- **Supabase → Redirect URLs** correctly include `sakina://**` (plus `exp://localhost:8081/**` for dev). Matches `docs/OAUTH_SETUP.md` step 5.
- **RevenueCat → "Sakina Pro" entitlement** exists and matches the code exactly.
- **RevenueCat → Android app** registered under the correct package (`com.lelahmed.sakina`), SDK key already wired into `.env`/EAS secrets, and real devices are actively initializing it (100% on `react-native-purchases` 10.2.2, 22/40 feature coverage).
- **eas.json → `production.autoIncrement: true`** — versionCode auto-increment is already configured (this was listed as "yours to do" in the 07-12 audit; it's actually done).
- **Supabase DB → CASCADE FKs verified via live SQL query**: `user_profiles.id`, `user_history.user_id`, `user_path_progress.user_id` all `ON DELETE CASCADE` → `auth.users`. Account deletion won't orphan data. (Was B-7, unconfirmed; now confirmed.)
- **Legal docs live and reachable** at their GitHub Pages URLs, content matches the 2026-07-12 rewrite (store-neutral billing language, accurate location disclosure).
- **Apple sign-in correctly deferred** — Supabase's Apple provider is Disabled, consistent with the "Google Play first, App Store later" rollout decision. Nothing to do here yet.

---

## 🟡 Still needs live/device confirmation (can't check from a browser or source)

- **B-4 — Data Safety form.** Blocked on #1 above (no Play Console app to fill it out in yet). Content is ready: approx/precise location, crash diagnostics (opt-in), account info (email), app activity (mood history, path progress) — matches the rewritten privacy policy.
- **B-5 — targetSdkVersion 35** in the actual built AAB. Expo SDK 54 defaults to 35; worth a final grep of the build output once you have a production AAB, not just trusting the default.
- **EAS device tests** — bundled into whichever build ships next (currently blocked on your EAS free-tier quota resetting Aug 1, or a plan upgrade): the 3 fixes from today (auth bounce-back, saved-verse refresh, notification logging), the 2026-07-19 day-2 fixes, and the original OAuth/notification-topup/share-image batch. All still pending your on-device confirmation per memory.

---

## 🟢 Already fixed, no action needed (rollup from 2026-07-12 + 2026-07-18/19 sessions)

Content accuracy (209 Quran verses verified letter-for-letter), the owner-email premium bypass (gated `__DEV__`), crash-report PII stripping, coarse-location downgrade, Hanafi Asr option, design-token drift cleanup, reduce-motion coverage, and the day-2 field bugs (prayer-time freeze, notification timing, HadithLayer immersive redesign) are all fixed, tested, and merged to `main`. Full detail in `2026-07-12-launch-readiness-audit.md` if you want the history.

---

## What I didn't and won't do

I navigated the Supabase, RevenueCat, and GitHub dashboards read-only to verify current state, and ran one read-only SQL query. I did not — and won't — create the Play Console account, enter any payment details, or type API keys/secrets into any form, even Play Console's own. Account creation and payment are explicitly yours; flag me once the account exists and I'll pick the RevenueCat-linking steps back up.
