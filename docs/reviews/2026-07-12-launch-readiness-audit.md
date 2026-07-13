# Sakina — Pre-Launch Readiness Audit

**Date:** 2026-07-12
**Reviewer lens:** Islamic scholarship + premium mobile (frontend & backend)
**Launch target:** Google Play (Android)
**Islamic methodology:** *Flag, don't prescribe* — issues surfaced with sourced evidence; no single madhhab enforced.
**User's top concerns (weighted hardest):** (1) content inaccuracy, (2) privacy claims the code must honor, (3) payments/entitlements.

> Status: **all three phases complete, and every actionable code-level finding has been fixed** (two rounds: the 3 code Highs, then all remaining 🟡/⚪ code findings). Legal docs (privacy.html/terms.html) were rewritten and published to `sakina-legal`. Items marked ⚠️ still need live confirmation (built AAB, Supabase dashboard, Play Console, device sandbox) that can't be checked from source alone — see **Verdict** at the bottom.

## Severity legend
| | Meaning |
|---|---|
| 🔴 Critical | Ships wrong sacred text, breaks on real devices, security/data leak, or blocks Play approval |
| 🟠 High | Real user-facing defect, entitlement/paywall integrity, privacy-policy/data-safety gap |
| 🟡 Medium | Premium-polish miss, design-system inconsistency, weak error/offline handling |
| ⚪ Low | Nits, copy, minor a11y, code smell |

## Methodology (content)
Every Quran citation in `quranData.ts` (157 entries) and `dailyVerseService.ts` (45 entries) — **209 records total** — was extracted programmatically and checked against `api.alquran.cloud` (`quran-uthmani` + `en.sahih`) via raw JSON (not WebFetch, per CLAUDE.md). Arabic was normalized to bare rasm (diacritics/ornaments/basmala-markers stripped, alef/hamza/yā/tā-marbūṭa normalized) and compared letter-for-letter; English was compared for token overlap against Sahih International. Every flag was then re-checked by hand against the raw API response to eliminate false positives (notably the API's habit of prepending the Basmala to each sūrah's first āyah).

---

# Phase 1 — Islamic content & scholarship

**Headline:** The Quran text is in **very good shape**. Across 209 verse records the Arabic rasm matches the canonical Uthmani muṣḥaf in **all but two** entries, and those two are *fragment/labeling* issues, not corrupted text. No mistranslations that change meaning were found. Hadith data carries a dated verification log. Below are the specific items to address.

### 🟠 C-1 — Āyah 58:7 is stored as a mid-āyah fragment but labeled as the complete āyah
- **Where:** `src/data/quranData.ts:2495` (`quran_58_7_lonely`)
- **What:** `source: 'Surah Al-Mujadila 58:7'`, `audioKey: '58:7'`, and the Arabic ends with a `﴿7﴾` marker — all asserting this is the whole āyah. But the stored text keeps only the **middle clause** (*"There is no private conversation of three but that He is the fourth of them…"*). It omits the āyah's grammatical opening — *"Have you not considered that Allah knows what is in the heavens and the earth?"* (**أَلَمْ تَرَ أَنَّ ٱللَّهَ يَعْلَمُ…**) — and its closing — *"Then He will inform them of what they did on the Day of Resurrection. Indeed Allah is Knowing of all things."*
- **Why it matters:** This is exactly the class of error your `CLAUDE.md` calls **non-negotiable** ("Always the complete āyah, never a clause"). Presenting a fragment under `58:7` with a `﴿7﴾` ornament misrepresents the Quran's completeness — precisely the reputational-inaccuracy risk you ranked #1. Verified against `api.alquran.cloud` raw JSON.
- **Fix options (flag, not prescribe):** (a) store the **complete** 58:7 (it's long — would need the tiered font-size / free-wrap treatment, not the fixed card); or (b) per `CLAUDE.md` rule #3, **swap** for a complete, thematically-equivalent "Lonely"-mood āyah (e.g. 50:16 "closer than the jugular vein" — already in your pool — or 2:186). Do **not** keep the fragment under a bare `58:7`/`﴿7﴾` label.

### ✅ C-2 — FIXED. Āyah 21:83 now shows the complete āyah with its narrative frame
- **Where:** `src/data/quranData.ts:328` (`quran_21_83`)
- **Was:** Stored only the du'ā (*"Indeed, adversity has touched me, and You are the Most Merciful of the merciful"*), omitting the frame *"And [mention] Job, when he called to his Lord"* (**وَأَيُّوبَ إِذْ نَادَىٰ رَبَّهُ**).
- **Fix:** Replaced with the complete āyah (Arabic, transliteration, and English), verified letter-for-letter against `api.alquran.cloud`. Re-ran the automated verifier: no longer flagged.

### ✅ C-3 — FIXED. Drifted translations aligned to Sahih International
- **Where:** `quranData.ts` — `quran_16_126` (16:126), `quran_4_149` (4:149), `quran_67_13` (67:13); and `dailyVerseService.ts` (3:146).
- **Was:** Meaning was intact but wording deviated from the stated "Sahih International" source, most notably **3:146 using "many devoted men of faith" where Sahih uses "religious scholars" for رِبِّيُّون** — the exact deviation `CLAUDE.md` names as unacceptable.
- **Fix:** All four re-verified against `api.alquran.cloud`'s `en.sahih` edition and reworded to match ("punish...punish", "religious scholars", "within the breasts", etc.). For 4:149, the "Oft-Pardoning, All-Powerful" names-gloss was deliberately kept (not changed to Sahih's "ever Pardoning and Competent") because the entry's own `whyThis` field explains those exact English names — changing the translation would have created a new inconsistency without fixing an actual inaccuracy, since both are equally valid, specific renderings of the same divine names. For 67:13, aligning to "breasts" also fixed an existing mismatch with that entry's own `whyThis`, which already said "chests." Re-ran the automated verifier: none of the three auto-flagged entries remain flagged.

### 🟠 C-4 — Internal verification note leaked into a user-facing attribution
- **Where:** `src/data/hadithData.ts:84` and `:89` (`hadith_study_4`)
- **What:** The `source` field (which renders as the hadith's attribution) is the literal string **`'Ibn Hibban (grading verification needed)'`**. This is an internal TODO that will display to users as the source line.
- **Why it matters:** Shipping "(grading verification needed)" as a visible citation undercuts the app's credibility on exactly the axis (authenticity) you care most about, and the du'ā's grading genuinely was never confirmed (see the file's own header log, line 9).
- **Fix:** Confirm the grading/source for the du'ā *"Allāhumma lā sahla illā mā jaʿaltahu sahlā"* (commonly attributed to Ibn Ḥibbān, *ṣaḥīḥ* per some), then replace the field with a clean citation (e.g. `'Ibn Hibban 2427'`) — or swap for a source you can cite cleanly.

### ✅ What's solid (verified, no action)
- **209/209 Quran āyāt** match the canonical Uthmani rasm except C-1/C-2 above. No corrupted Arabic, no wrong-āyah numbering, no meaning-changing mistranslation.
- The "previously shipped truncated three times" components are now **fixed and guarded**: `StreakBar.tsx:118`, `SpiritualWindowBanner.tsx:92`, and `ShareSheet.tsx:85` carry explicit "no numberOfLines cap — complete ayahs" comments; `LibraryScreen`/`QuranLibraryScreen` use the correct tap-to-expand pattern; `VerseLayer`/`SurahReader` bound long āyāt with **font-size tiering** (`isLongArabic ? compact : arabic`), your approved rule-#4 method.
- `hadithData.ts` carries a dated (2026-07-01) verification log with gradings corrected against sunnah.com/Darussalam.
- `sunnahData.ts` adhkār/du'ā (du'ā of Yūnus 21:87, istighfār, istiʿādha, etc.) are standard and complete.

### ✅ C-5 — FIXED. Mood-history verse translation now expands on tap
`MoodHistoryCalendarScreen.tsx` clipped a saved verse's **English translation** to `numberOfLines={3}` with no expand affordance. Fix: wrapped in a `TouchableOpacity` with per-entry expand state (`expandedTranslations: Set<number>`, reset when a different day is opened), toggling `numberOfLines` between `3` and `undefined` — same tap-to-expand pattern as `QuranLibraryScreen`'s `VerseCard`, with `accessibilityRole="button"` / `accessibilityState={{ expanded }}`.

### ✅ C-6 — FIXED. Hanafi Asr option added
- **Where:** `src/services/prayerTimesService.ts`, `src/types/index.ts`, `src/services/preferencesService.ts`, `src/database/{tables,migrations}.ts`, `src/screens/SettingsScreen.tsx`.
- **Was:** No way to select Hanafi Asr timing; Karachi/Turkey-method countries (Pakistan, India, Bangladesh, Afghanistan, Türkiye — majority Hanafi) got Shafi'i Asr times ~40–90 min early.
- **Fix:** Added `AsrMadhab` preference (`'standard' | 'hanafi'`, default `'standard'`), persisted in a new `user_preferences.asrMadhab` SQLite column (with a migration step for existing installs). `getTimingsByCoordinates` now sets `params.madhab = Madhab.Hanafi` (adhan.js) when selected; `getTimingsByCity` sends Aladhan's `school=1` param. Both explicit-param and preference-default paths supported (`resolveAsrMadhab()`), so no existing call site needed to change. Cache keys now include the school so switching the toggle can never serve a stale Asr computed under the other convention. New **"Hanafi Asr Timing"** toggle added to Settings → Preferences, matching the existing Show Transliteration / Auto-play Audio row style. Verified: typecheck clean, existing `prayerTimesService.test.ts` (9 tests) still passes.

### Open content items (deferred, lower risk)
- Hadith/verse text in `hadithService.ts`, `quranService.ts`, `contentRepository.ts`, `sunnahEnricher.ts`, `seedContent.ts` — confirm they reference audited data, not independent copies. (Data centralized in `quranData.ts`/`hadithData.ts`; risk low.)

---

# Phase 3 — Backend / security / release-readiness

**Headline:** Backend is **well-built and privacy-respecting**. RLS is correct per-user, secrets aren't committed, subscription integrity is server-enforced, and — importantly for your "guaranteed privacy" promise — **private journaling never leaves the device**. Two real items (a shipped premium bypass, precise-location) plus a set of Play-submission checks.

### ✅ Privacy promise holds at the code level (validated)
- **Reflections are local-only.** `reflectionRepository.ts:8` ("never synced to Supabase"); no `reflections` write exists in `supabaseDataService`. Your UI promise ("private, sacred, and only yours") is **true in code**.
- **Mood check-ins:** `recordHistory` (`supabaseDataService.ts:112`) sends only `user_id, content_id, angle_id, mood` — never the written reflection text.
- **Analytics:** PostHog **opt-out by default**, consent-gated, `disabled:true` at construct, lifecycle events off. Error capture redacts email/JWT and strips `email/password/token/url` keys.
- **Secrets:** `.env` not tracked (only `.env.example`); `.gitignore` covers `.env*`, `*.key`; no hardcoded keys in `src/`. Session token in secure Keychain/Keystore (chunked).
- **RLS:** every `user_*` table isolates by `auth.uid()`; content tables public read-only. Migration **004** guard trigger blocks authenticated clients from self-setting premium fields (only `service_role` after receipt validation).
- **Account deletion:** in-app `deleteAccount()` → JWT-verified `delete-account` edge fn using `service_role` + CASCADE. Play requires this — you have it.

### 🟠 B-1 — Shipped premium bypass keyed on a hardcoded personal email
- **Where:** `src/services/subscriptionService.ts:18` — `OWNER_EMAILS = ['ahmed.basolan97@gmail.com']`; `resync()` grants full premium to that email, bypassing RevenueCat entirely.
- **Risk:** (1) If Supabase "Confirm email" is **off**, anyone can register that email and unlock Pro free (entitlement bypass). (2) Ships your personal email inside the APK (anyone can `strings` the bundle). (3) Fragile prod gate.
- **Fix:** Remove from production, or gate behind `__DEV__`, or use a **RevenueCat promotional entitlement** for owner testing. Confirm Supabase email confirmation is **ON** regardless (also blocks fake-email account spam).

### ✅ B-2 — FIXED. Crash reports no longer forward `city`/`country` (or any identifier) to PostHog
- **Where:** `errorLoggingService.ts` `PII_KEYS`.
- **Was:** Stripped `email/password/token/url` but not `city`/`country`, which `prayerTimesService.ts`'s network-error handler attaches to error context.
- **Fix:** Added `userid`, `user_id`, `city`, `country`, `name` to `PII_KEYS` (defensive — covers not just the one confirmed call site but any future caller passing these keys). Chose **strip over disclose** since it's the more privacy-protective outcome and the published privacy policy's "may include" wording remains accurate either way (a conservative overstatement, not underclaiming).

### Release / Play-submission checklist
- ✅ **B-3 — FIXED. Downgraded to coarse location.** `expo-location`'s own config plugin (`node_modules/expo-location/plugin/src/withLocation.ts:71-72`) unconditionally adds **both** coarse and fine permissions to the Android manifest regardless of plugin config — there's no plugin option to opt out of fine. Used the same `blockedPermissions` mechanism already in place for stripping `RECORD_AUDIO` to explicitly block `ACCESS_FINE_LOCATION` from the final manifest, leaving only coarse (which the plugin still adds automatically). Confirmed safe: `LocationCompass.tsx` already requests only `Location.Accuracy.Low` — no feature ever needed fine precision. **Needs a native rebuild to take effect** (manifest change, not OTA-updatable).
- ⚠️ **B-4 — Data Safety form** must declare: approx location, crash logs/diagnostics (PostHog, shared w/ third party), account info (email/name via Supabase auth), app activity stored server-side (mood history, path progress). Must match the privacy policy. *(Need the policy URL to cross-check wording.)*
- ⚠️ **B-5 — targetSdkVersion** must be **API 35** (Play requirement for 2025 submissions/updates). Expo SDK 54 defaults to 35 — confirm in the built AAB.
- ⚠️ **B-6 — Web account-deletion URL.** Play requires a **publicly reachable** deletion request URL (not only in-app) in the Data Safety section. Add one (can point at the same edge fn via a simple page, or a form).
- ⚠️ **B-7 — Verify CASCADE FKs.** `delete-account` relies on Postgres CASCADE. Confirm `user_history`, `user_path_progress`, `user_profiles` all `REFERENCES auth.users(id) ON DELETE CASCADE` so no orphaned user data survives deletion.
- ⚠️ **B-8 — versionCode** auto-increment (eas.json) configured before first upload.
- ⚠️ **B-9 — RevenueCat/Play Billing** — confirm entitlement id `'Sakina Pro'` matches the RC dashboard, products exist in Play Console, and a real sandbox purchase + **restore** round-trips on a device.

### Policy-vs-code consistency (B-4) — repo `github.com/ahmedbasolan/sakina-legal`
Checked `privacy.html` + `terms.html` (effective 2026-06-16) against the code. **The core promise holds:** "moods & reflections stored privately, never analysed/sold/shared" is **true** — reflections are local-only, mood content is never sent to analytics. Third-party list (Supabase/RevenueCat/PostHog/Expo/Aladhan) is accurate. Three issues found and **fixed by rewriting both documents** (new effective date 2026-07-12, confirmed published by the user):

- ✅ **B-10 — FIXED (was 🔴).** The policy falsely claimed *"The app does not access your device's location services or precise GPS coordinates,"* while the code does (`ACCESS_FINE_LOCATION`, `getTimingsByCoordinates`). Rewrote the location section to truthfully describe device-location use (approximate or precise, coordinates not stored server-side, manual city entry still offered) — worded to stay accurate whether fine or coarse permission is granted, so it remains correct after the B-3 downgrade too.
- ✅ **B-11 — FIXED (was 🟠).** Both docs described Apple-only billing (*"processed entirely by Apple," "billed to your Apple ID"*) on an app launching on Google Play. Rewrote store-neutral throughout (Google Play Billing / Apple App Store, with the correct Android management path: Play Store → Payments & subscriptions).
- ✅ **B-12 — FIXED (was 🟡).** Policy described analytics as "screens visited, time spent... without personal identifiers," but code only ever sent crash/error diagnostics. Rewrote to accurately describe crash-and-error-only, opt-in, off-by-default diagnostics — no screen/time tracking, mood/journal content never included. (The account-identifier disclosure originally added here is now a conservative overstatement rather than literally accurate, since B-2's code fix stripped that data — left as-is since "may include" doesn't overclaim.)
- ⚪ **B-13 — Minor inaccuracies, not fixed (lowest priority):** (1) RevenueCat gets a pseudonymous id, not literally "anonymous" — wording fixed in the rewrite. (2) Retention wording corrected to "permanently removed... without undue delay" (matches immediate hard-delete). (3)+(4)+(5) from the original finding (local SQLite plaintext, Sahih Intl translation licence) remain informational, not policy text issues — no code or doc change needed.

---

# Phase 2 — Frontend / premium mobile craft

**Headline:** Frontend is **premium and disciplined**. Motion honors reduce-motion almost everywhere, the new gesture/overlay components are structurally sound, safe-area handling is present. Main theme is **design-token drift** — raw colors/sizes instead of the `DesignSystem` tokens your CLAUDE.md mandates. Consistency, not correctness.

### ✅ What's solid
- **New components clean:** `useSwipeGesture.ts` (fresh-ref PanResponder — no stale closure; horizontal-dominant claim won't steal vertical swipes; haptics; native driver). `SwipeNextOverlay.tsx` and `PathProgress.tsx` are well-structured (PathProgress handles phase-tiered vs dot layouts and non-contiguous phases correctly).
- **Reduce-motion:** 17 of 18 looping components consult `useReduceMotion` — strong coverage.
- Long lists use `FlatList`; verse rendering uses font-size tiering (see Phase 1).

### ✅ F-1 — FIXED (scoped). Design-token drift — cream/text color duplication consolidated
- **Was:** 144 hardcoded hex/rgba colors across 27 `.tsx` files. Investigation found the largest, genuinely-unambiguous category was `rgba(245, 237, 227, X)` — the exact RGB of `Colors.text.primary` restated at various opacities instead of derived from the token.
- **Fix:** **81 occurrences across 23 files** converted from raw `rgba(245, 237, 227, X)` literals to `` `${Colors.text.primary}HH` `` (hex-alpha suffix, matching the existing convention already used elsewhere in the codebase, e.g. `${accentColor}55`). Added the `Colors` import to the 2 files that lacked it (`PathProgress.tsx`, `OnboardingScreen.tsx`). Caught and fixed a scripting bug along the way — 19 of these landed as bare JSX attribute values (`color=\`...\``), which is invalid syntax without `{}` wrapping; all wrapped correctly. Verified: `tsc --noEmit` clean, full Jest suite (105 tests, 12 suites) passing.
- **Deliberately left unchanged:** pure-white `rgba(255,255,255,X)` overlays (111 instances) — these are neutral UI chrome (borders, switch tracks, dividers), a genuinely different color from the app's warm "glass" tokens (`rgba(255,235,210,X)`), not a duplicate of any existing token, and inventing a new `Colors.white` token wasn't this audit's call to make unilaterally. Black shadows (`#000`, `rgba(0,0,0,X)`) match the `Elevation` tokens' own convention (`Elevation.low.shadowColor: '#000'`), so they're consistent, not violations. `MoodColors` and gradient stops are intentionally per-mood/per-context. One isolated destructive-red (`SettingsScreen.tsx`, `rgba(255,80,80,0.6)`) is a distinct shade from `Colors.status.error` and too sparse an instance to risk an unreviewed visual shift for.

### ✅ F-2 — FIXED. LocationCompass loops now honor reduce-motion
- **Where:** `src/components/LocationCompass.tsx` — the idle-sway loop and the searching-spin loop.
- **Fix:** Added `useReduceMotion()` and gated both `useEffect`s on it (idle sway skips entirely; the searching spin also skips, since the component's own `ActivityIndicator` already communicates the in-progress state without needing the needle to spin). Now consistent with all other looping components in the app.

---

## Running findings summary
| ID | Sev | Area | Summary | Status |
|----|-----|------|---------|--------|
| C-1 | 🟠 | Content | 58:7 stored as mid-āyah fragment, labeled as full āyah | ✅ Fixed |
| C-4 | 🟠 | Content | `'Ibn Hibban (grading verification needed)'` leaks into user-facing source | ✅ Fixed |
| B-1 | 🟠 | Payments | Hardcoded owner-email premium bypass in shipped binary | ✅ Fixed |
| B-10 | 🔴 | Privacy/Play | Privacy policy falsely claims app doesn't use GPS/location | ✅ Fixed (legal doc rewrite) |
| B-11 | 🟠 | Play | Legal docs are Apple-only on a Google Play launch | ✅ Fixed (legal doc rewrite) |
| C-3 | 🟡 | Content | Few translations deviate from stated Sahih Intl standard (incl. self-flagged 3:146) | ✅ Fixed |
| C-6 | 🟡 | Content | No Asr madhhab option — Hanafi regions get Shafi'i Asr time | ✅ Fixed |
| B-2 | 🟡 | Privacy | Crash reports forward userId + city/country to US PostHog | ✅ Fixed |
| B-3 | 🟡 | Play | `ACCESS_FINE_LOCATION` — coarse suffices; precise-location scrutiny | ✅ Fixed (needs rebuild) |
| B-12 | 🟡 | Privacy | Policy analytics description ≠ code | ✅ Fixed (legal doc rewrite) |
| F-1 | 🟡 | Frontend | Design-token drift — cream/text color duplication | ✅ Fixed (scoped) |
| C-2 | ⚪ | Content | 21:83 shows du'ā only, drops narrative frame | ✅ Fixed |
| C-5 | ⚪ | Content | Mood-history clips verse translation to 3 lines, no expand | ✅ Fixed |
| F-2 | ⚪ | Frontend | `LocationCompass` loops ignore reduce-motion | ✅ Fixed |
| B-13 | ⚪ | Privacy | Minor policy wording (pseudonymous id, retention) | ✅ Fixed (legal doc rewrite) |
| — | — | Account | Supabase Auth "Confirm email" toggle | ⬜ **Yours — dashboard, not code** |
| B-4…B-9 | ⚠️ | Play/backend | Data Safety form, targetSdk 35, web-deletion URL, CASCADE FKs, versionCode, RC/Billing sandbox test | ⬜ **Yours — needs live Play Console/build/device access** |

## Fixes applied
**Round 1 (2026-07-12):** the 3 code-level 🟠 Highs — C-1 (58:7 fragment → complete āyah), C-4 (leaked hadith source string), B-1 (owner-email bypass gated `__DEV__`). Plus the legal-doc rewrite (B-10 false location claim, B-11 Apple-only billing, B-12 analytics description, B-13 minor wording) — published by the user to `sakina-legal`.

**Round 2 (same day):** every remaining actionable 🟡/⚪ code finding —
- **C-2** — 21:83 now shows the complete āyah with its narrative frame.
- **C-3** — 4 drifted translations (16:126, 4:149, 67:13, 3:146) realigned to Sahih International, preserving internal consistency with each entry's own `whyThis` field.
- **C-5** — mood-history verse translation now has tap-to-expand instead of a hard 3-line clip.
- **C-6** — added a Hanafi Asr toggle (new preference, DB column + migration, `adhan.js`/Aladhan wiring, Settings UI) — a real prayer-time accuracy fix for Hanafi-majority regions.
- **B-2** — crash reports no longer forward city/country/user-id to PostHog.
- **B-3** — Android manifest downgraded to coarse location via `blockedPermissions` (needs a native rebuild to take effect — not OTA-updatable).
- **F-1** — 81 duplicated cream-color literals consolidated to the `Colors.text.primary` token across 23 files (scoped: white/black/mood colors deliberately left as legitimate, see F-1 above for why).
- **F-2** — `LocationCompass`'s two animation loops now honor reduce-motion.

All of Round 2 verified: `tsc --noEmit` clean and the full Jest suite (105 tests, 12 suites) passing after every step, not just at the end.

**Still yours to do (not code, can't be done from this session):**
1. **Supabase Auth → "Confirm email" = ON** (dashboard toggle) — closes the account-spoofing angle B-1's code fix couldn't reach alone.
2. **Play submission checklist (B-4–B-9)** — Data Safety form (now matches the rewritten policy), confirm targetSdk 35 in the built AAB, add a public web account-deletion URL, verify CASCADE FKs, versionCode auto-increment, one real RevenueCat/Play Billing sandbox purchase + restore on a device.
3. **Rebuild required** for the location-permission change (B-3) and the Hanafi Asr toggle (new SQLite column — picked up automatically by the existing migration runner, no rebuild strictly required for that part, but bundle it with the location-permission rebuild anyway since both ship together).

## Verdict
**Every finding this audit could act on from source code is now fixed and verified** (tsc clean, 105/105 tests passing). The legal docs are rewritten and published. What's left is entirely outside what a coding session can do: one Supabase dashboard toggle, and the Play Console / device-level submission checklist. No known 🔴/🟠 blockers remain in the code or published legal docs.
