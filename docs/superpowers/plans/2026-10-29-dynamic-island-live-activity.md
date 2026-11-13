# Dynamic Island Prayer Card — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Pro-only iOS Live Activity that counts down to the next prayer in the Dynamic Island and on the lock screen all day, carrying the user's latest mood verse, and moving to the next prayer on its own through server pushes.

**Architecture:** A SwiftUI widget extension (`targets/live-activity`, via `@bacons/apple-targets`) draws the card and reads the verse from App Group storage. A local Expo module (`modules/sakina-live-activity`) lets JS start/end cards and write that storage, and natively forwards Apple push tokens to Supabase, so it works while JS is not running. Supabase stores each device's 7-day prayer schedule (UTC instants only) and a `pg_cron` dispatcher sends APNs start/update/end pushes, deciding with one pure, Jest-tested function.

**Tech Stack:** Expo SDK 54 / RN 0.81 (CNG, no committed `ios/`), Swift + ActivityKit + WidgetKit, `@bacons/apple-targets@5.0.0`, Supabase (Postgres, `pg_cron`, `pg_net`, Deno edge functions), APNs token auth (ES256 JWT), RevenueCat REST v1.

**Spec:** `docs/superpowers/specs/2026-10-29-dynamic-island-live-activity-design.md` (approved 2026-10-29). Read it before starting; this plan argues from it.

## Global Constraints

- iOS-only. Feature available on iPhone with iOS **≥ 17.2** and `areActivitiesEnabled`; hidden on iPad and older iOS. Extension `deploymentTarget: "17.2"`; the app's own target stays as it is.
- Pro only: entitlement id `'Sakina Pro'` (`RC_ENTITLEMENT_ID`, `src/services/revenueCatService.ts:34`). Server never sends to a device whose RevenueCat check fails.
- Switch **off by default**. Label: "Prayer countdown on Dynamic Island".
- Apple limits (read from Apple's docs 2026-10-29): active ≤ **8 h**, lock screen ≤ 12 h total, ended card lingers ≤ 4 h unless `dismissal-date`; lock-screen view truncated above **160 pt**; Live Activity has **no network**; headers `apns-push-type: liveactivity`, `apns-topic: com.lelahmed.sakina.push-type.liveactivity`, `apns-priority: 5|10`; `start` **requires** `alert` + `attributes-type` + `attributes`; push-to-start unavailable on iOS ≤ 17.1.
- Chain rules: a card **starts only at a prayer time**; start alerts carry **no `sound`**; updates and ends carry no `alert`. Safety margin `MARGIN_MS = 10 * 60_000` under the 8 h cap.
- Server receives **prayer name + UTC epoch seconds** only — never coordinates, city, mood or verse text.
- Content-state dates are `Double` epoch **seconds since 1970** (`prayerEpoch`), never Swift `Date` — ActivityKit decodes pushes with the default `JSONDecoder`, whose `Date` is seconds since 2001.
- Verse text: complete ayah or none. No `lineLimit`, no truncation, no new verse text authored (CLAUDE.md "Quoting Quran Text"). Only `Content.type === 'Quran'` items reach the card.
- Styling from `DesignSystem.ts` values (`#07111E`→`#0F1F30` background, cream `Colors.text.primary`, gold `#D4AF37`), Amiri-Quran for Arabic, Georgia for titles, System for body. No decorative motion.
- **Never start an EAS build without Ahmed asking.** Never type passwords or secret keys; Ahmed signs in and pastes secrets himself.
- Work on branch `feat/live-activity`; commit per task.

## Review Focus

1. **Isha after midnight / prayer strings that wrap** (high latitudes: Isha `00:40` belongs to the next calendar day) — the instants must stay strictly increasing. Test in Task 2.
2. **DST change inside the 7-day window** — each day's `HH:MM` converts with that day's offset, not today's. Test in Task 2.
3. **A late or missed dispatcher run** (cron skipped, APNs delay) — the next run must act on the *current* gap, not replay a stale one or start two cards. Test in Task 1.
4. **Pro lapses or schedule runs out while the app stays closed** — the live card is ended and nothing new starts. Test in Task 1.
5. **A day whose check-ins produced only hadith/du'a**, or yesterday's mood verse — the card shows today's daily verse, never a stale mood verse. Test in Task 3.

---

### Task 1: Chain decision logic (pure, shared with the server)

**Files:**
- Create: `supabase/functions/_shared/liveActivityPlan.ts` (no Deno or Node imports — Jest and Deno both load it)
- Test: `src/services/liveActivity/__tests__/liveActivityPlan.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Salah = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
  export interface ScheduledPrayer { name: Salah; at: number }          // epoch seconds, strictly increasing
  export interface CardState {
    startedAt: number | null;          // epoch s of the live card, null = none
    lastActedPrayerAt: number | null;  // epoch s of the prayer the last action was taken at
  }
  export type Action =
    | { kind: 'start'; next: ScheduledPrayer }   // via push-to-start token, silent alert
    | { kind: 'update'; next: ScheduledPrayer }  // via activity token
    | { kind: 'end' };                           // via activity token, dismissal-date = now
  export const MAX_ACTIVE_S = 8 * 3600;
  export const MARGIN_S = 600;
  export function decide(state: CardState, schedule: ScheduledPrayer[], now: number, isPro: boolean): Action[];
  export function nextDueAt(state: CardState, schedule: ScheduledPrayer[], now: number): number | null;
  ```

Rules `decide` implements (the algorithm the signature does not determine):
- `cap = startedAt + MAX_ACTIVE_S - MARGIN_S`.
- Not Pro, or no prayer after `now` → `[end]` if a card is live, else `[]`.
- Let `cur` = the latest prayer with `at <= now` (and `at > now - 15*60`, so a run more than 15 min late does not start a card off a prayer time), `next` = first prayer with `at > now`.
- Card live and `now >= cap` → `[end]` (then, if `cur` qualifies, also `start`).
- A prayer `cur` just arrived (it is after the card's last action): if card live and `next.at <= cap` → `[update(next)]`; else → `[end]` if live, then `[start(next)]`.
- Otherwise `[]`.
- `nextDueAt` = min(next prayer `at`, `cap` if a card is live) — the dispatcher stores it so a run only touches due rows.

`cur` has "just arrived" when `cur.at > (lastActedPrayerAt ?? -Infinity)`.

- [ ] **Step 1: Write the failing tests** — `describe('decide')`, with a fixture day `F=05:00 D=12:15 A=15:40 M=18:20 I=19:45` (as epoch s) and next-day Fajr:
  - `'updates silently when the next prayer fits under the cap'`: card started at D (cap 20:05), now = A → `[{kind:'update', next: M}]`.
  - `'restarts at a prayer when the next one would pass the cap'`: card started at F (cap 12:50), now = D, next = A at 15:40 > cap → `[{kind:'end'},{kind:'start', next: A}]`.
  - `'never starts off a prayer time'`: no card, now = 14:00 between D and A, `lastActedPrayerAt = D` → `[]`.
  - `'ends at the cap overnight and starts at Fajr'`: card started at I, now = I + 7h50 → `[{kind:'end'}]`; then state `{startedAt:null}` at now = next Fajr → `[{kind:'start', next: next-day Dhuhr}]`.
  - `'a run 40 minutes late does not start a card'` (Review Focus 3): no card, now = A + 40 min → `[]`; and with a live card whose cap allows, it still `update`s to the correct `next` (Maghrib), never Asr.
  - `'pro lapse ends a live card and starts nothing'` (Review Focus 4): `isPro=false`, card live → `[{kind:'end'}]`; no card → `[]`.
  - `'schedule exhausted ends the card'` (Review Focus 4): no prayer after now → `[{kind:'end'}]`.
  - `describe('nextDueAt')`: returns the cap when it precedes the next prayer, else the next prayer; `null` when the schedule is exhausted and no card is live.
- [ ] **Step 2: Run** `npx jest liveActivityPlan` — Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `decide` and `nextDueAt` in `supabase/functions/_shared/liveActivityPlan.ts`.
- [ ] **Step 4: Run** `npx jest liveActivityPlan` — Expected: PASS. Then mutate one rule (comment out the off-prayer guard) and confirm `'never starts off a prayer time'` fails; restore. (CLAUDE.md: verify the checker.)
- [ ] **Step 5: Commit** — `feat(live-activity): pure chain decision logic`.

### Task 2: Build the uploaded schedule from the app's weekly timings

**Files:**
- Create: `src/services/liveActivity/prayerSchedule.ts`
- Test: `src/services/liveActivity/__tests__/prayerSchedule.test.ts`

**Interfaces:**
- Consumes: `PrayerTimings` (`src/services/prayerTimesService.ts:19`), `ScheduledPrayer`/`Salah` from Task 1 (import path `../../../supabase/functions/_shared/liveActivityPlan`).
- Produces: `export function buildSchedule(weekly: PrayerTimings[], firstDay: Date, timeZone: string): ScheduledPrayer[]` — day `i` of `weekly` is `firstDay + i` in `timeZone`; returns the five salah per day as epoch seconds, `Sunrise` excluded, strictly increasing.

Algorithm note: convert `YYYY-MM-DD` + `HH:MM` in `timeZone` to UTC with `Intl.DateTimeFormat(...).formatToParts` offset lookup for **that** date (no new dependency). Within a day, if a prayer's minutes are ≤ the previous prayer's, it belongs to the next calendar day.

- [ ] **Step 1: Write failing tests:**
  - `'returns 35 strictly increasing instants for 7 days, no Sunrise'`.
  - `'Isha after midnight rolls to the next day'` (Review Focus 1): day timings `Isha: '00:40'`, `Maghrib: '22:50'` in `Europe/Oslo` → Isha instant = Maghrib + 1h50m.
  - `'uses each day's own DST offset'` (Review Focus 2): `Europe/London`, firstDay 2026-10-23, Fajr `'05:30'` on 10-24 and 10-25 → instants differ by 24h + 1h (clocks go back 2026-10-25).
  - `'strips Aladhan suffixes'`: `'05:24 (BST)'` parses as 05:24.
- [ ] **Step 2: Run** `npx jest prayerSchedule` — FAIL.
- [ ] **Step 3: Implement** `buildSchedule`.
- [ ] **Step 4: Run** `npx jest prayerSchedule` — PASS.
- [ ] **Step 5: Commit** — `feat(live-activity): build UTC prayer schedule from weekly timings`.

### Task 3: Verse snapshot for the card

**Files:**
- Create: `src/services/liveActivity/verseSnapshot.ts`
- Modify: `src/services/dailyVerseService.ts` — add `export function getDailyVerseForDateSync(dateKey: string): DailyVerse` (`dateHash(dateKey) % POOL_SIZE`, same as `getDailyVerseSync` but for any date; make `getDailyVerseSync` call it).
- Test: `src/services/liveActivity/__tests__/verseSnapshot.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface CardVerse { arabic: string; english: string; ref: string; dateKey: string }
  export interface VerseSnapshot { version: 1; mood: CardVerse | null; daily: CardVerse[]; timeFormat: '12h' | '24h' }
  export function toCardVerse(content: Content, dateKey: string): CardVerse | null; // null unless type 'Quran' with arabicText, englishTranslation, source
  export function buildVerseSnapshot(args: { mood: CardVerse | null; today: DailyVerse; timeFormat: '12h'|'24h' }): VerseSnapshot; // daily = today + next 6 days
  export function pickVerse(s: VerseSnapshot, dateKey: string): CardVerse | null; // mood if mood.dateKey === dateKey, else daily for dateKey, else null
  ```
  `pickVerse` is the reference behaviour the Swift renderer must reproduce (Task 4).
- [ ] **Step 1: Write failing tests:**
  - `'toCardVerse rejects Hadith, Dua, Dhikr and Sunnah items'` and accepts a Quran `Content` copying `arabicText`, `englishTranslation`, `source` **unchanged** (no trimming).
  - `'daily[0] is exactly the verse Home shows today'`: `today` passed in is `daily[0]`.
  - `'yesterday's mood verse falls back to today's daily verse'` (Review Focus 5).
  - `'a hadith-only day keeps the daily verse'` (Review Focus 5): `mood: null` → `daily` for today.
  - `'getDailyVerseForDateSync(todayKey) equals getDailyVerseSync()'`.
- [ ] **Step 2: Run** `npx jest verseSnapshot` — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx jest verseSnapshot dailyVerse` — PASS.
- [ ] **Step 5: Commit** — `feat(live-activity): verse snapshot (Quran only, day-scoped)`.

### Task 4: Native layer — widget extension + Expo module

No local Swift compiler exists (Windows). This task is verified by prebuild output and Jest on the JS wrapper; compile and visuals are verified in Task 9's device build.

**Files:**
- Modify: `package.json` (`@bacons/apple-targets@5.0.0` devDependency), `app.json`:
  - `plugins`: add `"@bacons/apple-targets"`.
  - `ios.infoPlist.NSSupportsLiveActivities: true`.
  - `ios.entitlements["com.apple.security.application-groups"]: ["group.com.lelahmed.sakina"]` (the target mirrors it automatically).
  - The register URL and anon key are **not** put in config: JS passes them through `configure()` at runtime (from the existing `supabaseClient` config) and native stores them in the App Group, where the background token-forwarder reads them. No `app.json` → `app.config.js` conversion.
- Create `targets/live-activity/`:
  - `expo-target.config.js` — `type: "widget"`, `name: "SakinaLiveActivity"`, `deploymentTarget: "17.2"`, `frameworks: ["SwiftUI","WidgetKit","ActivityKit"]`, `colors` for background/gold.
  - `SakinaPrayerAttributes.swift` — `struct SakinaPrayerAttributes: ActivityAttributes { struct ContentState: Codable, Hashable { var prayerName: String; var prayerEpoch: Double }; var version: Int }`.
  - `SakinaLiveActivity.swift` — `@main` bundle + `ActivityConfiguration(for: SakinaPrayerAttributes.self)`: lock screen view; `dynamicIsland` with compact leading = lantern image, compact trailing = `"\(prayerName) \(clock)"` static (no timer), minimal = lantern, expanded = name + clock + `Text(timerInterval: now...prayerDate, countsDown: true)` + `VerseView`. `.widgetURL(URL(string: "sakina://prayer-times"))`.
  - `VerseStore.swift` — reads `VerseSnapshot` JSON (Task 3 shape) from `UserDefaults(suiteName: "group.com.lelahmed.sakina")` key `sakina.liveActivity.snapshot.v1`; `pick(for: Date)` mirrors `pickVerse`.
  - `VerseView.swift` — `ViewThatFits(in: .vertical)` over: Arabic+English+ref, English+ref, ref-only pointer "Your verse · {ref} — tap to read". Every `Text` uses `.fixedSize(horizontal: false, vertical: true)`; **no `lineLimit`**. Lock-screen total height budget 160 pt.
  - `Assets.xcassets/lantern.imageset` from `src/assets/brand/lantern.png`; `AmiriQuran-Regular.ttf` copied from `node_modules/@expo-google-fonts/amiri-quran/400Regular/AmiriQuran_400Regular.ttf`, listed in the target `Info.plist` `UIAppFonts`.
- Create `modules/sakina-live-activity/` (scaffold with `npx create-expo-module@latest --local sakina-live-activity`, then replace bodies):
  - `ios/SakinaPrayerAttributes.swift` — **byte-identical** copy of the target's file (push `attributes-type` matches by type name).
  - `ios/SakinaLiveActivityModule.swift` — JS functions below.
  - `ios/SakinaLiveActivityAppDelegate.swift` — `ExpoAppDelegateSubscriber`; on launch (including background launch from a push-to-start) observes `Activity<SakinaPrayerAttributes>.pushToStartTokenUpdates`, `activityUpdates`, each activity's `pushTokenUpdates`, and POSTs `{deviceId, pushToStartToken?, activityToken?, activityStartedAt?}` to the stored register URL with the anon key — natively, no JS. Ends every activity except the newest.
  - `index.ts` — typed wrapper; every call is a no-op on Android / when the native module is absent.
- Test: `modules/sakina-live-activity/__tests__/index.test.ts`

**Interfaces:**
- Produces (JS, `modules/sakina-live-activity/index.ts`):
  ```ts
  export function isSupported(): boolean;                         // iOS ≥ 17.2, iPhone, areActivitiesEnabled
  export function configure(o: { registerUrl: string; anonKey: string }): void;
  export function getDeviceId(): string;                          // UUID persisted in the App Group
  export function writeSnapshot(json: string): void;
  export function startLocal(prayerName: string, prayerEpoch: number): Promise<boolean>; // false if one is already live
  export function endAll(): Promise<void>;
  export function clearShared(): void;                            // removes snapshot + device id
  ```
- [ ] **Step 1: Write failing JS wrapper tests** — `'is a no-op on Android'` (all functions callable, `isSupported() === false`), `'returns false when the native module is missing'`.
- [ ] **Step 2: Run** `npx jest sakina-live-activity` — FAIL.
- [ ] **Step 3: Add the files above.**
- [ ] **Step 4: Verify** `npx jest sakina-live-activity` PASS; then `npx expo prebuild --platform ios --no-install` and check: `ios/Sakina.xcodeproj/project.pbxproj` contains a `SakinaLiveActivity` target; both entitlements files list `group.com.lelahmed.sakina`; app `Info.plist` has `NSSupportsLiveActivities`. Then delete the generated `ios/` (it is gitignored, but leave no stray state).
- [ ] **Step 5:** `npx tsc --noEmit -p tsconfig.json` and `node scripts/verify-render-hazards.mjs` — both exit 0.
- [ ] **Step 6: Commit** — `feat(live-activity): widget extension and native bridge`.

### Task 5: `LiveActivityService` — the app-side orchestrator

**Files:**
- Create: `src/services/liveActivity/liveActivityService.ts`
- Test: `src/services/liveActivity/__tests__/liveActivityService.test.ts`

**Interfaces:**
- Consumes: Tasks 2–4; `SubscriptionService.getInstance().isPremium()`; `supabase` (`src/config/supabaseClient.ts`) for `functions.invoke('live-activity-register', …)`; `Purchases.getAppUserID()`.
- Produces:
  ```ts
  export const LIVE_ACTIVITY_PREF_KEY = '@live_activity_enabled';
  export const LIVE_ACTIVITY_INVITE_KEY = '@live_activity_invite_seen';
  class LiveActivityService {
    static getInstance(): LiveActivityService;
    isAvailable(): boolean;                                       // isSupported()
    getEnabled(): Promise<boolean>; setEnabled(v: boolean): Promise<void>;
    sync(weekly: PrayerTimings[], timeFormat: '12h'|'24h'): Promise<void>; // timeZone = Intl resolvedOptions, firstDay = today
    onVerseShown(content: Content): Promise<void>;                // Quran only; rewrites snapshot
    disableAndForget(): Promise<void>;                            // endAll + unregister + clearShared
  }
  ```
  `sync`: if `!isAvailable()` → return; if `!enabled || !isPremium()` → `disableAndForget()`; else `configure`, write snapshot, invoke register `{ action: 'register', deviceId, rcAppUserId, apnsEnv: __DEV__ ? 'sandbox' : 'production', timeZone, schedule }`, then `startLocal(next.name, next.at)` (app-started cards need no alert).
- [ ] **Step 1: Write failing tests** (native module + supabase mocked): `'does nothing when unsupported'`; `'switch off unregisters and ends cards'`; `'non-Pro unregisters even if switch is on'`; `'register payload carries times only'` — asserts the body's keys are exactly `action, deviceId, rcAppUserId, apnsEnv, timeZone, schedule` and no `latitude|longitude|city|mood|arabic|english` appears in `JSON.stringify(body)`; `'onVerseShown ignores non-Quran content'`.
- [ ] **Step 2: Run** `npx jest liveActivityService` — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** — `feat(live-activity): app-side service`.

### Task 6: Wire it into the app (hooks, Settings, invitation, deletion)

**Files:**
- Modify: `src/hooks/useHomeData.ts` (after the existing weekly scheduling ~line 148–151: `LiveActivityService.getInstance().sync(weekly, timeFormat)`, fire-and-forget with `logServiceError`); `src/services/notificationTopUpTask.ts` (same call after `scheduleMoodCheckinNotifications`). On the city path (no coordinates) pass the single day repeated ×7, exactly as the notification schedulers' `toWeekly` already does — times drift a minute or two by day 7 and are refreshed on every open; excluding city-path users would lock them out of a feature they paid for. If changing city, method or madhab in settings does not re-run `useHomeData`'s prayer load, add the same `sync` call wherever prayer notifications are rescheduled after that change (grep `schedulePrayerNotifications(` callers).
- Modify: `src/screens/GuidanceScreen.tsx` — `useEffect` on `experience` → `onVerseShown(experience.content)` when Pro.
- Modify: `src/screens/SettingsScreen.tsx` — toggle row next to the Lock Screen Verses row (`:430`), shown only when `isAvailable()`; non-Pro tap navigates to the existing paywall exactly as the Lock Screen Verses row does.
- Modify: `src/screens/PrayerTimesScreen.tsx` — one-time invitation card for Pro + available + switch off + `LIVE_ACTIVITY_INVITE_KEY` unset; one primary CTA "Turn on", a text "Not now"; both set the key.
- Modify: `src/services/authService.ts` — in `deleteAccount`, before `clearAllLocalUserData()`, `await LiveActivityService.getInstance().disableAndForget()` inside its own try/catch (must not block deletion). Also on sign-out.
- Modify: `src/navigation/linking.ts` — add `'prayer-times'` to `DEEP_LINK_PATHS` and `PrayerTimes: 'prayer-times'` to `config` per the file's "Adding a link" note.
- Test: extend `src/services/__tests__/notificationTopUpTask.test.ts`, `src/navigation/__tests__/` (deep link resolves to PrayerTimes), and a `deleteAccount` test asserting `disableAndForget` is called before the local wipe.

**Interfaces:** Consumes Task 5 only.

- [ ] **Step 1: Write the failing tests** named above, plus `'top-up on the city path syncs seven copies of the one day'`.
- [ ] **Step 2: Run** `npx jest notificationTopUpTask deepLink authService` — FAIL.
- [ ] **Step 3: Implement** the edits. UI follows CLAUDE.md's Screen Layout Checklist (tokens only, bare icons, one primary CTA).
- [ ] **Step 4: Run** `npx jest` (full) and `npx tsc --noEmit -p tsconfig.json` — PASS / exit 0.
- [ ] **Step 5: Commit** — `feat(live-activity): settings switch, invitation, hooks and deletion`.

> Deviation from the spec, decided here: the spec says tapping the verse opens "that verse in the app". No route can land on a single ayah (`SurahReader` takes a whole surah and does not scroll to an ayah), so the whole card opens Prayer Times. A verse deep link is a follow-up.

### Task 7: Supabase table, register function, cron

**Files:**
- Create: `supabase/migrations/007_live_activity_devices.sql`
- Create: `supabase/functions/live-activity-register/index.ts`
- Create: `supabase/functions/_shared/registerValidation.ts` (pure) + test `src/services/liveActivity/__tests__/registerValidation.test.ts`

**Interfaces:**
- Table `live_activity_devices`: `device_id uuid primary key`, `user_id uuid null references auth.users on delete cascade`, `rc_app_user_id text not null`, `apns_env text check in ('sandbox','production')`, `push_to_start_token text`, `activity_token text`, `activity_started_at bigint`, `last_acted_prayer_at bigint`, `time_zone text`, `schedule jsonb not null` (array of `ScheduledPrayer`), `next_due_at bigint`, `pro_checked_at bigint`, `pro_active boolean`, `updated_at timestamptz default now()`. `alter table … enable row level security;` with **no policies** (only the service role touches it). Index on `next_due_at`.
- `cron.schedule('live-activity-dispatch', '* * * * *', $$ select net.http_post(url := <dispatch url>, headers := jsonb_build_object('Authorization', 'Bearer ' || <secret from vault>)) $$)` — the secret is read from Supabase Vault, never written in the migration.
- `registerValidation.ts`: `export function parseRegister(body: unknown): { ok: true; value: RegisterBody } | { ok: false; error: string }` — `deviceId` UUID, tokens hex ≤ 200 chars, `schedule` ≤ 40 entries, strictly increasing, all within now−1d…now+8d, names ∈ `Salah`; rejects unknown keys (so location can never be smuggled in).
- Abuse guard (decided here, narrower than the spec's "rate-limited"): the register endpoint is open to guests, so the real guard is that the dispatcher (Task 8) deletes any row whose Pro check fails and never sends to it, plus the validator's size caps. No per-IP limiter is built.
- Register function: `action: 'register' | 'unregister' | 'token'` (`token` is what native posts). Upserts by `device_id`; sets `user_id` from the JWT when a signed-in Authorization header is present; recomputes `next_due_at` with Task 1's `nextDueAt`. `unregister` deletes the row.
- [ ] **Step 1: Write failing validation tests** — `'rejects extra keys like latitude'`, `'rejects a non-increasing schedule'`, `'rejects schedules beyond 8 days'`, `'accepts a native token post without schedule'`.
- [ ] **Step 2: Run** `npx jest registerValidation` — FAIL.
- [ ] **Step 3: Implement** the validator, migration and function.
- [ ] **Step 4: Run** `npx jest registerValidation` — PASS. `npx tsc --noEmit` does not cover `supabase/functions`; check the function with `npx supabase functions serve` only if Ahmed has the CLI, otherwise at deploy (Task 9).
- [ ] **Step 5: Commit** — `feat(live-activity): device table, register function, cron`.

### Task 8: Dispatcher — RevenueCat check + APNs

**Files:**
- Create: `supabase/functions/live-activity-dispatch/index.ts`
- Create: `supabase/functions/_shared/apnsPayload.ts` (pure) + test `src/services/liveActivity/__tests__/apnsPayload.test.ts`

**Interfaces:**
- Consumes: Task 1 `decide`, `nextDueAt`; table from Task 7.
- Produces (`apnsPayload.ts`):
  ```ts
  export function buildPush(action: Action, now: number): { headers: Record<string,string>; body: object; tokenKind: 'pushToStart' | 'activity' };
  ```
  `start` → `aps: { timestamp, event:'start', 'content-state': {prayerName, prayerEpoch}, 'attributes-type':'SakinaPrayerAttributes', attributes:{version:1}, alert:{ title:'Sakina', body:'Next: {name} at {time}' } }` — **no `sound` key**; `apns-priority: 10`. `update` → `event:'update'`, `stale-date: next.at + 900`, priority `5`, no `alert`. `end` → `event:'end'`, `dismissal-date: now`, priority `5`, no `alert`. Headers always `apns-push-type: liveactivity`, `apns-topic: com.lelahmed.sakina.push-type.liveactivity`.
- Dispatcher flow: select rows with `next_due_at <= now` (limit 500) → refresh Pro if `pro_checked_at` older than 6 h via `GET https://api.revenuecat.com/v1/subscribers/{rc_app_user_id}` (check `subscriber.entitlements['Sakina Pro'].expires_date` is null or future; **verify this endpoint and field against RevenueCat's current docs before writing it**) → `decide` → send each push to `api.sandbox.push.apple.com` or `api.push.apple.com` per `apns_env` with an ES256 JWT (Web Crypto `importKey('pkcs8')`, cached ≤ 50 min) → update `activity_started_at` (start: `now`; end: `null`), `last_acted_prayer_at`, `next_due_at`. APNs `410` or `BadDeviceToken` on the push-to-start token → delete the row; on the activity token → null it. Rows failing the Pro check with no live card are deleted.
- Secrets read via `Deno.env`: `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `REVENUECAT_SECRET_KEY`, `DISPATCH_SECRET` (must match the cron header; reject other callers with 401).
- [ ] **Step 1: Write failing payload tests** — `'start carries an alert without sound'` (`expect(body.aps.alert).not.toHaveProperty('sound')`), `'update and end carry no alert'`, `'prayerEpoch is epoch seconds'`, `'topic is the bundle id push-type topic'`.
- [ ] **Step 2: Run** `npx jest apnsPayload` — FAIL.
- [ ] **Step 3: Implement** `apnsPayload.ts` and the dispatcher.
- [ ] **Step 4: Run** `npx jest` (full) — PASS.
- [ ] **Step 5: Commit** — `feat(live-activity): dispatcher with RevenueCat gate and APNs`.

### Task 9: Accounts setup, deploy, and device test — with Ahmed

Ahmed is not technical: drive the browser for him, stop at every sign-in and every secret paste for him to do himself, and say exactly which screen he is on.

- [ ] **Step 1: Apple Developer** — Ahmed signs in at developer.apple.com → Certificates, IDs & Profiles → Keys → "+" → enable "Apple Push Notifications service (APNs)" → he downloads the `.p8` (ask before the download) and notes Key ID + Team ID. App Group `group.com.lelahmed.sakina`: EAS registers it on the next build when credentials are EAS-managed; confirm in the Identifiers list afterwards.
- [ ] **Step 2: Supabase** — Ahmed signs in; enable `pg_cron` and `pg_net` (Database → Extensions); he pastes `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `REVENUECAT_SECRET_KEY`, `DISPATCH_SECRET` into Edge Functions → Secrets and `DISPATCH_SECRET` into Vault; apply migration 007; deploy both functions (`live-activity-register` with JWT verification **off**, since guests call it — validation is in Task 7).
- [ ] **Step 3: RevenueCat** — Ahmed grants his test account a promotional "Sakina Pro" entitlement (the review demo account works this way) and creates/copies a secret API key.
- [ ] **Step 4: Ask Ahmed for a dev build.** Only on his yes: `eas build --profile development --platform ios`. Ask which iPhone he is testing on first — no Dynamic Island (pre-14 Pro) means only the lock-screen view can be checked.
- [ ] **Step 5: On device:** turn the switch on → a card appears immediately (app-started). Check: compact island text, minimal, expanded, lock screen; the **longest** mood and daily verses never clip (tier falls to English-only or pointer instead); a hadith check-in leaves the daily verse; at the next prayer the card moves on with the app closed; a silent start at a restart prayer; switch off removes the card and the server row; Supabase table shows no location/verse columns populated.
- [ ] **Step 6:** Release checklist note for Ahmed — privacy policy (sakina-legal repo) and App Store privacy label must add "prayer schedule + push token" before the production build; `NSSupportsLiveActivities` ships in that build.
- [ ] **Step 7: Commit** any fixes; update the memory index with the feature's state.
