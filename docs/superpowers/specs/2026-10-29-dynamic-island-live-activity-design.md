# Dynamic Island & Lock-Screen Live Activity — Design

Date: 2026-10-29 · Status: reviewed (independent builder check + self-review),
awaiting Ahmed's approval

## Intent

Put Sakina where a Pro user's eye already goes, all day: a countdown to the next
prayer in the iPhone Dynamic Island, with the verse from their latest mood
check-in one long-press away. It should feel like the app's "lantern under a
starlit sky" carried onto the system surface — calm, glanceable, never noisy.

## Decided by Ahmed

- **Two things, one card.** A single Live Activity: the prayer countdown drives
  it, the mood verse rides inside it (expanded island + lock screen). Not two
  separate activities.
- **All day without opening the app.** When a prayer arrives the card moves on
  to the next prayer on its own. This means a server that pushes updates
  through Apple.
- **Pro feature.**
- **Ahmed is not technical.** The builder does all coding and configuration and
  drives his PC (browser) for portal steps. Ahmed personally does only what the
  safety rules reserve for him: signing in to Apple Developer / Supabase /
  RevenueCat, creating/downloading the Apple push key on approval, and pasting
  secret keys into Supabase. The builder walks him to each exact screen.

## Builder's calls already made (Claude's, not Ahmed's — he may override)

- Prayer schedule goes to the server as **times only** (UTC instants + prayer
  names), never coordinates or city. The app uploads the next **7 days** each
  time it is opened; if not opened for 7 days the card stops until next open.
- **A chain of cards, started only at prayer times.** Apple requires every
  server-started card to alert (see Constraints), so starts are kept rare and
  never land at a random moment. A card starts at a prayer and is **updated
  silently** at each following prayer for as long as Apple's ~8 h cap allows;
  when the next prayer would fall past that cap, the server starts a fresh card
  *at* that prayer instead. Overnight, the card begun at Isha (or earlier) runs
  until it ends at its cap or at Fajr, whichever comes first — if it ends
  before Fajr there is simply no card until Fajr starts a new one. **No card
  ever starts outside a prayer time** (an earlier draft started the overnight
  card at `Fajr − 8h`, which would light the screen at night). Typical day:
  2–3 starts, the rest silent updates. Sunrise is not a prayer and is not a
  stop.
- **Start alerts are silent** (no `sound`) and coincide with Sakina's own
  prayer notification, which stays on and remains the real, offline-safe
  alert. On island iPhones the start shows the expanded island for a moment;
  on older iPhones it is a silent banner next to the usual one.
- **Verse freshness:** a mood verse lasts until the end of the local day it was
  chosen; after that the card shows Sakina's existing daily verse
  (`dailyVerseService`) until the next check-in. If there has never been a
  check-in, the daily verse.
- **The verse never leaves the phone.** The app writes the current mood verse,
  plus the next 7 days of daily verses (each tagged with its date), into App
  Group shared storage; the extension reads it when it renders. Server pushes
  carry only prayer name + time.
- **Settings switch** "Prayer countdown on Dynamic Island", **off until the
  user turns it on** (changed from "on by default": because each start lights
  the screen, an existing Pro user updating the app must not be surprised by
  it). Pro users get a one-time invitation to turn it on (Prayer Times screen
  is the natural place); free users see the switch with a Pro badge and
  tapping opens the existing paywall. Hidden on iPad and on iOS < 17.2.
- **Moving or changing settings:** the uploaded times are for where the user
  was when the app last ran. Changing city, method or madhab, or opening the
  app somewhere new, re-uploads. Travelling with the app closed shows the old
  city's times until the next open — accepted.
- **Pro enforcement on both sides:** the app unregisters when Pro lapses; the
  server checks RevenueCat before sending, so a lapsed device that never
  reopens the app stops receiving pushes.
- **Guests work:** devices are keyed by their Apple push token, not by account,
  so Pro users who never signed in get the feature too. `user_id` is stored
  when there is one, for account deletion.
- **Tap targets:** tapping the card opens the Prayer Times screen; tapping the
  verse region (expanded / lock screen) opens that verse in the app.
- **iOS only.** Android gets nothing in this project.
- **Quran only on the card.** "The latest mood verse" is the last `Quran`-type
  item the user was shown in a check-in that day (the one they swiped to, not
  the first served). Hadith / Dua / Dhikr / Sunnah results (~¼ of the pool) do
  not change the card; if a day's check-ins produced no verse, the card shows
  the daily verse. Keeps hadith citation/grading rules off this surface.
- **Daily verse ahead of time:** today's entry is exactly Home's pick (written
  when the app runs); the 6 future days are precomputed and may differ from
  what Home later picks if the app is reopened. Accepted — no change to
  `dailyVerseService` selection.
- **Dev-build Pro:** the `__DEV__` `OWNER_EMAILS` bypass is invisible to the
  server. Ahmed's test account gets a RevenueCat **promotional entitlement**
  (the review demo account already works this way). No server-side bypass.

## Goals

1. Compact island: gold lantern (leading) + the next prayer's **clock time**
   ("3:42", in the user's 12h/24h format) trailing. Still, not ticking —
   the island is in view all day and a running seconds counter there fights
   the calm-motion rule. *(Builder's call; Ahmed may prefer a countdown.)*
   Changed 2026-11-06 from "Asr 3:42": Apple's HIG gives each compact element
   ~52 pt and asks for a 28 pt fit when the island is limited in width, and
   "Maghrib 18:20" would be cut. The name stays in the expanded and lock views.
2. Minimal island (when another app shares the island): the lantern.
3. Expanded island: next prayer name, its clock time, and a live countdown
   (system timer text — it shows seconds on iOS 17, no pushes needed to tick);
   the current verse below.
4. Lock-screen / notification-banner view (also what pre-14-Pro iPhones see):
   Celestial Night styling, prayer row, verse.

**Visual design D, "Lantern path" (chosen by Ahmed 2026-11-06).** Three
directions — A countdown hero, B day path, C lantern glow — were previewed in
`docs/superpowers/previews/live-activity/`; Ahmed picked C, then asked to
combine B and C, and chose the result, D, which replaces C (a559203). It keeps
goals 1–4 and changes how they look:
- Lantern drawn with a soft warm radial glow (no container) in every view.
- Lock screen: the verse leads (84 pt), then one row — glowing lantern, the
  day path (`LanternPath`, 34 pt), and a quiet countdown.
- The day path: the five prayers as stops evenly spaced on one line (evenly,
  not by clock time, so Maghrib and Isha's labels cannot collide). Prayers
  already passed are dim gold; the next is ringed in gold with a glow and
  labelled with its time; the stretch from the previous prayer's stop to the
  next fills live.
- Expanded island: glowing lantern (leading), name over time (trailing, beside
  the camera), then the verse (48 pt) and the path with the countdown.
  Compact (lantern + time) and minimal (lantern) are unchanged from C.
- The live stretch is `ProgressView(timerInterval:)`, advanced by iOS with no
  pushes. A Live Activity cannot run its own animation, so the preview's
  moving "now" glow was dropped for this. It needs the previous prayer, so
  `ContentState` gained an optional `startEpoch` (server: the prayer just
  acted at; app: the schedule entry before the next). No live stretch when it
  is unknown. Optional, so build 11 still decodes new payloads.
- Measured over the 52 daily verses: lock screen shows Arabic + English for 16,
  English for 22, reference only for 14; the expanded island shows English for
  4 and the "Your verse · ref" pointer for 48 — the path costs the expanded
  verse its room, and the lock screen carries the text. (C was 16/29/7 and
  17/35.) The expanded verse budget is conservative and the first thing to
  tune on a device.
5. Card advances at each prayer time with the app closed, every day, for as
   long as the uploaded schedule lasts and Pro is active.
6. Turning the switch off, losing Pro, or deleting the account stops pushes
   and removes the device's server row.

## Non-goals

- Android equivalent; Apple Watch-specific design (iOS 18 mirrors Live
  Activities into the Smart Stack automatically — acceptable as-is).
- Interactive buttons on the card ("I prayed", dhikr counter).
- Server-side prayer calculation. The app's own calculation (method, madhab,
  user adjustments) is the source of truth; the server only replays it.
- Sending verse text or mood to the server.

## Anti-goals — failure even if it "works"

- **A clipped or partial ayah.** CLAUDE.md "Quoting Quran Text" applies in
  full: the card shows the complete ayah or no ayah text. Never
  `lineLimit`/truncation on verse text.
- **A second prayer sound, or any alert off a prayer time.** Sakina already
  notifies at prayer time (`notificationService`). Card starts are silent and
  happen only at a prayer; updates and ends carry no alert at all. (A silent
  visual appearance at the prayer is unavoidable — Apple requires it — and is
  accepted.)
- Pushes continuing after Pro lapses, switch-off, or account deletion.
- Location or mood reaching the server.
- Flicker, blinking, or decorative motion on the card; it must honor the
  calm-motion rules.

## Constraints

- **Stack:** Expo SDK 54, React Native 0.81, CNG (no committed `ios/`). Builds
  on EAS (cloud Macs). Ahmed is on Windows: **no simulator, no local Xcode**.
  Swift compile errors surface only in an EAS build; the first visual check is
  on Ahmed's phone. **Never start an EAS build without Ahmed asking**
  (standing rule).
- **Extension:** SwiftUI widget extension containing an `ActivityConfiguration`,
  added through `@bacons/apple-targets` (Swift lives in `targets/`), with
  `NSSupportsLiveActivities` in the app's Info.plist and an App Group shared by
  app + extension. The extension must bundle the fonts it uses (Amiri-Quran for
  Arabic, the serif/latin faces) — it cannot see the app's JS-loaded fonts.
- **Main-app bridge:** a local Expo module (`modules/`) exposing to JS:
  push-to-start token stream, per-activity push token stream, write shared
  verse data, end all activities, `areActivitiesEnabled`. None exists yet.
- **Server:** Supabase (project already in use; one edge function today,
  `delete-account`). New pieces:
  - table for devices: push-to-start token, current activity token,
    `apns_env` (sandbox for dev builds, production for store), RevenueCat app
    user id, optional `user_id`, timezone, uploaded schedule, enabled,
    last-sent bookkeeping. No direct client access; writes go through an edge
    function.
  - `register`/`unregister` edge function (callable without sign-in).
  - a dispatcher run every minute by `pg_cron` that finds due transitions,
    checks RevenueCat, signs an APNs JWT and sends start/update/end pushes;
    deletes rows on APNs 410 / invalid token.
  - secrets: APNs `.p8` key, key id, team id, RevenueCat secret API key.
- **Read from Apple's doc 2026-10-29** ("Starting and updating Live Activities
  with ActivityKit push notifications"): push-to-start is unavailable on iOS
  ≤ 17.1; a `start` payload **must include an `alert`** ("you make sure the
  system notifies a person about the newly started Live Activity"); updates
  and ends need no alert; an ended activity stays on the lock screen up to 4 h
  unless `dismissal-date` is set; pushes have an hourly budget and
  `apns-priority: 5` does not count toward it; `stale-date` marks a card
  outdated if updates stop arriving.
- **Still to verify before relying on it** (from memory, not fetched): exact
  APNs header/topic strings; the 8 h active cap (the chain logic depends on
  it); that a start `alert` without `sound` is silent; lock-screen height
  limit; App Group reads from the extension at render time; whether iOS shows
  its own "Allow Live Activities?" prompt on first push-start.
- **Abuse:** register is callable without sign-in, so it must be rate-limited,
  and nothing is ever sent to a device the RevenueCat check does not pass.
  Account deletion also calls unregister for the current device (covers
  guests, whose rows carry no `user_id`).
- **Data ownership rules (CLAUDE.md):** new local keys go into
  `clearAllLocalUserData` and `verify-local-wipe.mjs`'s `PERSONAL` list;
  `delete-account` also deletes the device rows for that user; signing out or
  switching accounts must not leave pushes running under the previous owner.
- **Privacy disclosure:** prayer schedule + push token is new server-side
  data. The privacy policy (sakina-legal repo) and App Store privacy label
  need updating before release.

## Verse rendering rule (the hard part)

Space in the expanded island is a few lines; the lock screen is taller but
bounded. Render the verse with SwiftUI `ViewThatFits`, trying in order:

1. Arabic + English translation + reference
2. English translation + reference
3. Reference only, as a pointer: "Your verse · Surah Ash-Sharh 94:5 — tap to
   read" (no quotation, so no fragment)

Text is never line-limited. The builder must prove on device, with the
**longest** entries in the mood pools and the daily pool, that tiers 1–2 never
clip and tier 3 is chosen instead. Verse data comes from the same verified
sources the app already renders — no new verse text is authored.

## Left to the builder

- Exact SwiftUI layouts, sizes and colors (from `DesignSystem.ts` tokens,
  translated to Swift constants), lantern asset reuse from
  `scripts/build-lantern-assets.js` output.
- Table/column names, edge-function names, cron cadence detail, retry policy.
- How the JS side hooks the mood check-in to write the verse (likely where
  `moodHistoryService` records history) and where the schedule upload runs
  (app open + existing notification top-up task).
- Test strategy: Jest for schedule/gap computation and verse-freshness
  selection; Deno tests for the dispatcher's due-transition logic; a
  negative-mode check per the repo's "verify the checker" rule.
- Rollout order and a dev-build test plan for Ahmed's phone (sandbox APNs).
  **Open:** which iPhone Ahmed tests on. If it has no Dynamic Island (pre-14
  Pro), only the lock-screen view can be checked there, and the compact /
  minimal / expanded views need another device before release. Ask before
  writing the test plan.
