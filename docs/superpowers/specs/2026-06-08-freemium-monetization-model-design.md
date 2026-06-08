# Sakina — Freemium Monetization Model

**Date:** 2026-06-08
**Status:** Draft v2 (revised after self-review)

**Changelog:**
- v2: corrected the prayer-window model to reuse the existing `PrayerContext`;
  resolved the journey revenue-gap (launch sequencing), distress-bundle handling,
  saving-count definition, peak-trigger mechanism + frequency cap, dynamic price
  display, mood-threading details; added Implementation Phases & ship-gates.

---

## 1. Context & Problem

Sakina is an Islamic spiritual companion app. It cannot be free (Apple's $99/yr
developer fee) and will not use ads. We need a paid tier that sustains the app
**without** violating the Islamic ethic of not withholding spiritual benefit from
those who cannot pay.

The app already has a substantial freemium system (`subscriptionService`,
`freemiumService`, `sessionService`, paywall screens, Special Edition bundles,
background themes). But the **built model drifted into standard SaaS gating** that
contradicts the project's stated ethic:

| Lever | Built today | Problem |
|---|---|---|
| `maxSavedItems: 0` | Free users can save **nothing** | Withholds the most personal spiritual moment |
| `dailyGuidanceSessions: 2` | 2 sessions/day total | Stingier than intended; restless-browser friction |
| Paywall pitch | "all 5 prayer reminders" sold as premium | Gates an aid to **obligatory** worship |
| `pathsService.premiumIds` | Distress journeys (addiction, grief, tawbah, hope-after-crisis, death-awareness) are **premium-locked** | Puts a price between a hurting person and help — the core ethical violation |
| Paywall placement | Shown at **onboarding** (cold) | Asks before any value/habit; weakest + least kind moment |

This spec defines the corrected model and the backend changes to implement it.

---

## 2. Guiding Principle (the one rule)

> **The words are always free. The *production* is what you pay for.**
> Never a price between a hurting person and the words — only between them and the
> enhanced experience. We charge for craft, convenience, customization, and early
> access — never for revelation or tools of obligatory worship.

One-line product framing: **"Free to heal. Pay to immerse."**

Everything below is an application of this single rule.

---

## 3. The Free / Premium Boundary

**Always free (never gated, for anyone):**
- All Qur'an, hadith, duas, Verse of the Day — unlimited.
- Prayer times **and all five prayer reminders** (worship aid — never gated).
- **Saving** works (see §3.1).
- Guidance refreshes — generous, per-prayer-window (see §3.2).
- A **free core** of every journey, including distress journeys (see §5).
- Existing journeys are always free; only brand-new journeys have an early-access
  window (see §6).

**Premium ("enhancement + early access + support"):**
- Unlimited guidance refreshes (everywhere, all moods).
- Background themes / customization.
- **Enhanced editions** of journeys: premium audio, downloadable companion (PDF),
  offline, and (where authored) extended days.
- Unlimited saving + collections/organization.
- Deeper history/insights (`rotationHistoryDays` 90 vs 30).
- **Early access** to new journeys (see §6).
- Framed as identity + sadaqah: "you sustain Sakina for those who can't pay."

### 3.1 Saving (fix `maxSavedItems: 0`)
- Free: saving enabled, capped at **30 saved items** — high enough that no one in a
  real moment ever hits it. Premium: unlimited + collections.
- `freemiumService.canSaveItem()` changes from `return this.isPremium()` to a
  count-based check (premium ⇒ always true).
- **Count definition (avoids double-counting):** a guidance Quran-save writes to
  *both* `saved_reflections` and `bookmarked_verses` (mirror row, id `bv_guidance_*`).
  The cap counts:
  `count(saved_reflections) + count(bookmarked_verses WHERE id NOT LIKE 'bv_guidance_%')`
  — i.e. all reflections plus SurahReader bookmarks, with mirror rows excluded so a
  single saved verse counts once.
- Hitting the cap is a *soft* prompt, never a hard wall mid-comfort.

### 3.2 Guidance refreshes (fix `dailyGuidanceSessions: 2`)
- **Remove** the `dailyGuidanceSessions` daily cap entirely.
- New model: **3 refreshes per prayer window**, where "window" is the existing
  `PrayerContext` (`fajr_pre`, `fajr_post`, `dhuhr`, `asr`, `maghrib_pre`,
  `maghrib_post`, `isha`, `general`). The counter resets to 3 whenever the current
  context changes. Generous and tied to the rhythm of the day.
- The window is resolved from `prayerTimesService.getCurrentPrayerContext()`, which
  already handles every failure mode (no saved location → London/UK default; no
  network → stale cache; total failure → `'general'`). `'general'` is a valid
  3-refresh window, so there is **no undefined/blocked state** even with no location
  or network.
- Premium: unlimited. **Mercy moods: unlimited** (see §4).
- The cap is a *gentle resting point* with kind copy ("You've received three
  reflections — sit with them, they're saved for you, return at Maghrib in shaa
  Allah"), **never** a price prompt in the comfort flow.
- *Known minor edge:* the two `'general'` gaps in a day (mid-morning, late-night)
  share one bucket if keyed only by context; acceptable (still generous). Refine the
  key only if it proves a problem.

---

## 4. The Mercy Rule (mood-aware)

**Principle:** the moment of need is sacred. When a user is in a heavy emotional
state, limits lift and **no upgrade prompt ever appears** in that flow.

**Asymmetry of error** governs the mood list: a false positive (mercy for someone
not really struggling) costs nothing (they read more Qur'an free); a false negative
(friction shoved at someone hurting) is a small betrayal in an app named *tranquility*.
**When in doubt, mercy.**

Sakina's nine moods (`Mood` union), split:

| Mercy — unlimited, no ask (6) | Gentle pause applies (3) |
|---|---|
| Overwhelmed (Tawakkul) | Grateful (Shukr) |
| Sad (Sabr) | Hopeful (Raja) |
| Lonely (Wasl) | Calm (Sakinah) |
| **Guilty (Tawbah)** — *sacred; never gate repentance* | |
| Angry (Ihsan) | |
| Tired (Quwwah) | |

**Mechanics (explicit):**
- A helper `isMercyMood(mood: Mood): boolean` returns `true` for the 6 heavy moods.
- The mood is **threaded through** the limit API: `canUseNextRefresh(mood)`,
  `useNextRefresh(mood)`, `getRemainingRefreshes(mood)`, and `getPaywallType(mood)`.
  The existing sync call site in `useGuidanceLogic` (line ~61) must pass the active
  `mood` (the hook already receives it).
- When `isMercyMood(mood)` (or premium): refreshes are unlimited, the counter is
  **not decremented**, and `getPaywallType` returns `null`. (Not decrementing matters:
  otherwise a mercy session would silently burn a later non-mercy session's refreshes
  in the same window.)
- **Scope:** per-session — governed by the mood selected for that guidance flow;
  resets next time.
- The mood is self-selected (honor system). Acceptable and intended — we err toward
  mercy. The refresh cap therefore only ever touches self-identified
  Grateful/Hopeful/Calm users; it is an anti-doomscroll nicety, **not** a conversion
  lever (conversion comes from §5/§6/§7, not from limits).

---

## 5. Journeys: Free Core + Enhanced Edition

**Replace** the binary "this journey is premium / locked" model with: *every journey
has a free core; the enhanced edition is paid.*

- **Free core:** the full existing journey content — verses, duas, steps, reflections.
  Always accessible, **including distress journeys** (addiction, grief, tawbah,
  depression, loneliness). For *existing* journeys, free core = the current full text
  journey.
- **Enhanced edition (paid):** premium recited/narrated audio + downloadable companion
  (PDF) + offline; extended days only where additionally authored (future). This is the
  *same* craft layer the Special Edition bundles already model (`includesPDF`,
  `includesAudio`).

**Concrete changes:**
- `pathsService.getAllPaths()` — **remove** the hardcoded `premiumIds` gating. All
  non-special-edition journeys become free-core-visible. (`isPremium` param is retained
  only for the early-access window, §6.)
- `SpiritualPath` type — deprecate `isPremium` as an access gate; introduce an
  enhanced-edition concept (`hasEnhancedEdition?: boolean`, `enhancedEditionId?` /
  reuse `bundleId`). Within-journey day-by-day unlock (`PathDetailScreen` `isLocked`
  by `currentDay`) is **unchanged** — that's pacing, not monetization.
- **Special Edition bundles — DECISION (review #3):** un-gate the *existing*
  special-edition journey as free-core, and sell its *existing* audio/PDF bundle as the
  paid enhanced edition. **No new journeys authored.**
  - *Distress* bundles (Breaking Free / addiction, Depression, Haram Relationship): the
    `isSpecialEdition` visibility filter in `getAllPaths` is lifted so the journey text
    shows free; the bundle (`includesAudio`/`includesPDF`) becomes the enhanced edition.
  - *Occasion* bundles (Ramadan, Hajj, Umrah, New Parent, Convert): same pattern; a small
    free core + paid produced companion.
  - *Verify in implementation:* that special-edition paths contain text `dailySteps` to
    expose as free core (expected from the `SpiritualPath` shape).

**Two ways to pay (reuses existing infra):**
- **Subscribe** → all enhanced editions + themes + unlimited + early access.
- **Buy one outright** ($2.99–$6.99) → own a single enhanced edition without subscribing;
  giftable (the sadaqah lever, made real). Uses existing `purchaseBundle` /
  `unlockedBundleIds`.

**Reasonable production commitment:** audio is not required on everything at launch.
The model **degrades gracefully** — Premium retains full value at launch via themes +
unlimited + early access + support even before any enhanced edition exists (see §14).

---

## 6. Early Access (new journeys)

- **Existing** journeys: always free-core. No window.
- **Brand-new** journeys: premium sees them immediately; everyone else after an
  **early-access window** (e.g. 30 days), then free-core for all.
- Implemented as static config on the journey (e.g. `releaseDate` / `earlyAccessUntil`)
  read by `getAllPaths(isPremium, ...)` — **no DB change** needed.
- A person with an acute need is never without a journey for it — they only miss the
  *newest* one early.
- *Note:* the window is enforced against the device clock and is therefore bypassable by
  changing the date. Low stakes (a user gets a new journey early) — same risk class as
  the client-trusted `isPremium`; not worth hardening for v1.

---

## 7. Pricing

- Keep **$4.99/month**.
- Add **annual ≈ $34.99** (clear value anchor).
- Optional **Lifetime / Supporter ≈ $99** one-time — *with caution*: ongoing server cost
  liability for a solo dev; offer as a small early-cash option, not a headline.
- **Regional pricing** (App Store Connect per-territory) — $4.99 is prohibitive in much
  of the ummah; ethical and revenue point.
- **Dynamic price display:** displayed prices must come from the store product's
  localized price (RevenueCat/StoreKit), **not** hardcoded strings. Today
  `PaywallScreen` ("Then $4.99/month") and `PathsScreen` ("Premium · $4.99/month")
  hardcode the price — these must be replaced with the live localized price, or regional
  pricing is meaningless.
- Keep the 7-day trial, but offered at a **peak**, not as a cold onboarding gate (§8).
- One-time enhanced editions: **$2.99–$6.99**.
- `SubscriptionType` ('monthly' | 'yearly' | 'trial') gains **'lifetime'**. Lifetime ⇒ no
  `subscriptionEndDate`. The existing expiry check
  (`if (subscriptionEndDate && now > subscriptionEndDate)`) already treats an absent end
  date as "never expires" — confirm this path in the plan.

**Integrity constraint:** the "your subscription funds free access for others" framing
must be *literally true* and ideally demonstrable — not marketing veneer.

---

## 8. Where the Ask Appears (peaks only)

**Rule:** the upgrade ask never appears in the comfort/guidance flow, for any mood. It
appears only from **peaks** — moments of positive affect/accomplishment:
- Finishing a journey (completion screen).
- A streak milestone (used *gently* — never couple commercial asks with
  spiritual-consistency guilt).
- Choosing a background theme (`BackgroundThemePicker`).
- A dedicated **"Support Sakina"** screen.
- The positive-mood gentle pause may carry at most a single soft, dismissible line.

**Trigger mechanism + frequency cap:**
- A single decision point, e.g. `freemiumService.shouldOfferUpgrade(context): boolean`,
  is consulted at each peak. It returns `false` for premium users and enforces a
  **cooldown** (e.g. at most one ask per N days, and never twice for the same peak type
  in a row) so the app never nags. Last-asked timestamp persisted locally.
- This replaces the removed comfort-flow triggers — the old `refresh_limit` /
  `daily_limit` paths no longer open a paywall.

**Concrete changes:**
- **Remove** the blocking `PaywallScreen` step from the `OnboardingScreen` flow (an
  optional non-blocking "what Premium offers" intro is fine; no cold ask).
- In `useGuidanceLogic` / `GuidanceScreen`: the `refresh_limit` / `daily_limit` paths
  show the gentle resting-point message; `getPaywallType()` is reworked accordingly.
- `PathsScreen`: replace "Premium · $4.99/month" pills + "Unlock All Paths" CTA with
  free-core access + an "Enhanced edition" affordance on journeys that have one.
- Add peak triggers at journey completion and the Support screen, gated by
  `shouldOfferUpgrade`.

---

## 9. Backend Changes (by file/module)

1. **`src/constants/index.ts`** — `FREEMIUM_LIMITS`: remove `dailyGuidanceSessions`; set
   `maxSavedItems: 30`; add `refreshesPerPrayerWindow: 3`. Add the 6-mood mercy set and
   pricing constants (annual, lifetime, enhanced-edition price points).
2. **`src/services/sessionService.ts`** — replace the per-day model with
   **per-`PrayerContext`-window** refresh reset; remove `guidanceSessionsUsed` cap logic;
   store the resolved `windowKey` on the in-memory session; reset
   `nextRefreshesRemaining` when the window changes; thread `mood` through
   `canUseNextRefresh` / `useNextRefresh` / `getRemainingRefreshes`; mercy ⇒ unlimited +
   no decrement. The window is resolved async (via `getCurrentPrayerContext()`) at load
   and cached so the sync checks keep working.
3. **`src/services/freemiumService.ts`** — `canSaveItem()` count-based per §3.1;
   `getPaywallType(mood)` reworked so comfort-flow limits do **not** produce a paywall;
   add `shouldOfferUpgrade(context)` with cooldown; mercy-aware refresh delegation;
   `PREMIUM_LIMITS` / `getCurrentLimits` updated.
4. **`src/services/subscriptionService.ts`** — add `'lifetime'` to `SubscriptionType`
   handling; `activatePremium('lifetime')` sets no end date.
5. **`src/services/pathsService.ts`** — remove `premiumIds` gating; lift the
   `isSpecialEdition` hide for distress/occasion journeys (free-core); add early-access
   window evaluation (uses `isPremium`); enhanced-edition lookup.
6. **`src/data/staticPaths.ts`** — annotate journeys with enhanced-edition + early-access
   fields; ensure distress/occasion special-edition journeys expose free-core text.
7. **`src/types/index.ts`** — `SpiritualPath` enhanced-edition fields; `FreemiumLimits`
   (drop daily sessions, add per-window); `SubscriptionType` += 'lifetime'; `PaywallType`
   trigger set updated.
8. **Tests** (`freemiumService.test.ts`, `sessionService` tests, `rotationEngine.test.ts`)
   — written **first** to the new behavior (see §13).

**UI/copy (logic-adjacent, can follow backend):** `OnboardingScreen` (remove cold
paywall), `GuidanceScreen` (resting-point message), `PathsScreen` (free-core + enhanced
affordance), `DailyRemindersScreen` (all 5 free), journey-completion + "Support Sakina"
peak screens, `PaywallScreen` reframe (mission/identity + dynamic price).

---

## 10. Data Model Changes

- **`user_sessions` table** — refresh model is now per-prayer-window. **Decision:** add a
  `windowKey` TEXT column (e.g. `"2026-06-08:dhuhr"`, using `PrayerContext`). On session
  load and on each refresh check, compare the current resolved window to the stored
  `windowKey`; if different, reset `nextRefreshesRemaining` to `refreshesPerPrayerWindow`
  and store the new key. Migration required (`src/database/migrations.ts`, `tables.ts`);
  the now-unused `guidanceSessionsUsed` column may remain (no destructive migration).
- **Saving cap** — no new table; counted per §3.1.
- **Subscription** — `unlockedBundleIds` already exists (one-time purchases). Add
  `'lifetime'` to type; lifetime ⇒ no `subscriptionEndDate`.
- **Early access** — static config on journeys; **no DB change**.
- **Upgrade-ask cooldown** — persist a `lastUpgradeAskAt` timestamp (local prefs /
  small table) for `shouldOfferUpgrade`.

---

## 11. Out of Scope / Dependencies

- **Real IAP wiring (RevenueCat / StoreKit)** is currently a TODO in `PaywallScreen` and
  simulated via `SettingsScreen`'s dev toggle. This spec defines the *model*; the actual
  purchase/restore/receipt integration is the **hard prerequisite for public launch**
  (see §14). The model is testable today via the dev toggle.
- **Server-side entitlement validation** — `isPremium()` is client-trusted/spoofable.
  Acceptable risk for v1; future hardening.
- **App Store Connect config** (regional price tiers, products) — external setup.
- **Audio/PDF production** for enhanced editions — content work; post-launch (§14).

---

## 12. Risks & Open Questions (resolved decisions noted)

- **Conversion is on the generous end.** Real anchors are *audio + early access + genuine
  supporter framing*, not the limits. Accepted trade: generosity drives reach
  (sharing, reviews, trust) which drives discovery. Covering costs needs only ~2–4
  subscribers.
- **Per-prayer-window refresh** couples the limit to prayer context — already computed by
  the app, with built-in fallbacks; acceptable.
- **Lifetime pricing** flagged cautionary (§7).
- **Mercy mood list** — Tired and Angry were the only debatable calls; both included on
  the asymmetry principle.

---

## 13. Testing Notes

- **TDD:** write the new-behavior tests **first**; existing `freemiumService.test.ts` /
  `rotationEngine.test.ts` will break under the new model and are rewritten, not patched.
- Unit: `isMercyMood` set; per-window refresh reset across `PrayerContext` boundaries
  (including `'general'` fallback); saving cap = 30 with mirror-row exclusion; mercy moods
  ⇒ unlimited + no decrement + `getPaywallType` null; `shouldOfferUpgrade` cooldown.
- Integrity: free-core access to every distress journey; all 5 prayer reminders on free;
  existing journeys never early-access-gated.
- Manual (dev toggle): peak-only paywall placement; onboarding has no cold paywall;
  dynamic localized price renders.

---

## 14. Implementation Phases & Ship-Gates

The work decomposes into phases that ship in order. **Decision (review #2):** un-gate
journeys early (ethically urgent, costs nothing pre-launch); the only hard gate is that
**public App Store launch requires working IAP**, not enhanced-edition content.

- **Phase 1 — Ethics & limits (safe to ship to dev/TestFlight immediately):**
  saving free (§3.1), all 5 reminders free, per-window refreshes + mercy rule (§3.2/§4),
  un-gate journeys to free-core (§5). No revenue lost (no live purchases yet); Premium
  still has value via themes + unlimited + early access + support.
- **Phase 2 — Premium value & placement:** themes/unlimited/collections gating,
  peaks-only asks + `shouldOfferUpgrade` cooldown (§8), `PaywallScreen` reframe, dynamic
  price display (§7).
- **Phase 3 — Purchases (LAUNCH GATE):** real RevenueCat/StoreKit wiring + restore;
  annual/lifetime products; regional price tiers. **Do not launch publicly until this is
  done** — Premium must be genuinely buyable.
- **Phase 4 — Revenue expansion (post-launch):** produce enhanced editions (audio/PDF),
  starting with the highest-value distress journeys + Ramadan; ship new journeys with
  early-access windows.
