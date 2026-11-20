# Dynamic Island build — rulings and deferred items

Kept from the plan executor's ledger when its scratch workspace was deleted (2026-11-02). Rulings are decisions Claude made on Ahmed's behalf during the build; deferred items are review findings judged safe to leave for later.

## Rulings
- Ruling R1: start alert = `{ title: 'Sakina', body: 'Counting down to {name}' }` — no clock time in the alert — the server has no 12/24h preference or locale and the card itself shows the time — cost if wrong: a slightly less informative silent banner; trivial to change.
- Ruling R2: on a native `token` post carrying `activityStartedAt`, register sets `activity_started_at` to it and `last_acted_prayer_at` to the latest scheduled prayer ≤ that start — otherwise `decide` would treat the current gap's prayer as "just arrived" and restart an app-started card — cost if wrong: one extra silent restart.
- Ruling R3: native token POST includes `action: 'token'` alongside `deviceId`, `pushToStartToken?`, `activityToken?`, `activityStartedAt?` — the validator rejects unknown/missing action — cost if wrong: none beyond the field.
- Ruling R4: `_shared` modules import each other only with `import type … from './x.ts'` (type-only); no runtime cross-imports — keeps both Deno (needs `.ts`) and tsc/Jest happy — cost if wrong: implementer hits a tsc error and adjusts.
- Ruling R5: keep the duplicated `SakinaPrayerAttributes.swift` (ActivityKit matches `attributes-type` by type name and the pod and the extension cannot share one file through CNG cleanly) and add a Jest test asserting the two files are byte-identical — cost if wrong: a drift-check test that is redundant.
- Ruling R6: every ActivityKit call in the module is behind `@available(iOS 17.2, *)` / `#available`, returning false/no-op below — the app target deploys to iOS 15.1 — cost if wrong: build failure caught at first EAS build.
- Ruling R7: Task 1's [end]-only when a live card meets a stale (>15 min) prayer with next past cap is accepted — the brief's own 40-min-late update test forces the freshness window to gate starts only, and the spec forbids starting off a prayer time — cost if wrong: one gap without a card after a late cron run.
- Ruling R8: dateKey in Swift uses Gregorian calendar in the device time zone, not Calendar.current — JS formatDateKey is Gregorian, and a Hijri/other-calendar device would never match — cost if wrong: none found.
- Ruling R9: the ref-only pointer must not promise "tap to read" since the tap opens Prayer Times (plan ruling, no verse route) — reword to a pointer that promises nothing (e.g. "Today's verse · {ref}") — goes to the review fix round with any findings — cost if wrong: copy tweak.
- Ruling R10: accept the extra `@live_activity_time_format` AsyncStorage key — onVerseShown has no other source for 12h/24h when rewriting the snapshot — cost if wrong: one more personal-ish key to clear (it is cleared in disableAndForget).
- Ruling R11: Task 5 #3 (plan-mandated) — keep a local registered flag (`@live_activity_registered`); disableAndForget only calls getDeviceId/unregister when it is set (still endAll + clearShared, which are local and cheap); the flag is set on a successful register and cleared in disableAndForget — the spec never asked for a device id from non-participants — cost if wrong: a stale server row if the flag is lost, which the dispatcher's Pro check purges.
- Ruling R12: Task 5 #2 — add a public `isLoaded(): boolean` to SubscriptionService (wrapping its private flag); sync while not loaded does nothing (no teardown, no register); only an explicit switch-off or a loaded non-Pro state tears down — cost if wrong: first sync of a cold start is skipped until the next Home load.
- Ruling R13: accept that the headless top-up's sync is a no-op (subscription unloaded in background) — the spec only promises the schedule lasts 7 days from the last app open, and the server chain runs without the app — cost if wrong: background schedule refresh never happens, card stops 7 days after last open (as spec'd).
- Ruling R14: on BOTH account deletion and sign-out, reset the opt-in — setEnabled(false) through the service queue (writes false + tears down) and remove LIVE_ACTIVITY_INVITE_KEY — a new owner on a shared device must opt in themselves (CLAUDE.md Account Deletion ownership rule) — cost if wrong: a returning user re-enables once after signing back in.
- Ruling R15: Settings label must be the spec's "Prayer countdown on Dynamic Island" (spec Global Constraints) — fold into the fix round with the wrong Settings comment (iOS 17.2+, runtime-changeable) — cost if wrong: copy.
- Ruling R16: Task 7 token post for an unknown device → 200 {ok:true, ignored:true} (row needs rc_app_user_id + schedule) — register always precedes in practice; forwarder reposts next launch — cost if wrong: a push-started card's token missed until next app launch.
- Ruling R17: Task 7 parseRegister takes nowSeconds as a parameter for deterministic tests — cost: none.
- Ruling R18 (supersedes R16): token post for an unknown device → 409 "unknown device" (non-2xx) so the forwarder's retry-after-2s resends once register lands; AND after a successful register the service calls native.configure again to trigger a repost of current tokens — cost if wrong: one redundant token POST per register.
- Ruling R19: raise the token hex cap from 200 to 512 chars — Apple documents no fixed token length and an over-cap token would 400 forever — cost if wrong: none (still bounded).
- Ruling R20: start payload includes "input-push-token": 1 — Apple's doc (fetched 2026-11-02, line "For devices running iOS 18 and later … add input-push-token: 1 … to start a Live Activity and receive a new push token") — without it, iOS 18 push-started cards get no update token and every update/end is skipped — cost if wrong: an ignored key on iOS 17.
- Ruling R21: end push carries the final content-state — Apple: "If you end a Live Activity, include the final content state" — accepted deviation from the brief.
- Ruling R22: persist the APNs provider JWT in a service-role-only single-row table (amend migration 007, which is unapplied) and reuse it while < 45 min old — a fresh isolate per cron minute would sign a new token every minute, and APNs rejects provider tokens refreshed more often than every 20 min (TooManyProviderTokenUpdates) — cost if wrong: one extra table.
- Ruling R23: RevenueCat get-or-create on forged rc ids is accepted for now (deferred minor) — real ids come from the app; the alternative endpoint choice needs RC docs reading at deploy — cost if wrong: junk RC customers from a hostile client.
- Ruling R24: claim due rows atomically before sending (SQL function with FOR UPDATE SKIP LOCKED that leases them by bumping next_due_at ~120 s and returns them), and for a start persist the post-start state (last_acted_prayer_at, activity_started_at) BEFORE sending, reverting to the read state with next_due_at=now only on a retryable failure — so neither overlap nor a failed write can send a second start — cost if wrong: a lost start is retried on the next run rather than duplicated.
- Ruling R25: decide marks ends that happen at a prayer ({kind:'end', atPrayer:true}); write planning moves to a pure _shared function with Jest tests (delete conditions, retry keeps due, skipped start, badToken per token kind) — cost if wrong: refactor churn.
- Ruling R26: ios.appleTeamId is left to Task 9 — the value comes from Ahmed's Apple Developer account and is added before the first EAS build — cost if wrong: first build fails with a clear warning.
- Ruling R27: the final fix wave also takes the cheap minors: updates at apns-priority 10; pg_net timeout aligned with run budget; onVerseShown only for mood check-ins (not the Kahf queue); teardown when the switch is on/registered but Live Activities became unavailable; CLAUDE.md note on the live-activity AsyncStorage keys; T4 @MainActor on BackgroundAssertion. Deferred (can wait): past-midnight verse, forced sign-out leak, duplicated generated assets, 6 h Pro cache, and every "can wait" triage line.

## Deferred minor findings
- Task 1: minor (deferred): untested [end, start] path at the cap (liveActivityPlan.ts:179)
- Task 1: minor (deferred): untested stale-cur deviation branch ([end] only)
- Task 1: minor (deferred): untested nextDueAt live + exhausted → cap (:201)
- Task 1: minor (deferred): strictly-increasing precondition undocumented (:134)
- Task 2: minor (deferred): parseMinutes no trim / single-space split (prayerSchedule.ts:165) — leading/double space drops a prayer
- Task 2: minor (deferred): no tests for half-hour/negative-offset zones or spring-forward; Oslo test checks only the gap
- Task 2: minor (deferred): skipped malformed prayer dropped silently, no log
- Task 3: minor (deferred): toCardVerse truthiness guard passes whitespace-only fields
- Task 3: minor (deferred): addDays on malformed dateKey → NaN-NaN-NaN silently
- Task 3: minor (deferred): no forced-TZ DST test for local date keys; delegating equality test is tautological
- Task 4: minor (deferred): verse picked only at render — Isha→Fajr card keeps yesterday's verse past midnight
- Task 4: minor (deferred): dedupe keeps activities.last (undocumented order)
- Task 4: minor (deferred): forwarder assumes pushTokenUpdates finishes on end
- Task 4: minor (deferred): lock-file drift (@expo/image-utils 0.8.8→0.8.17, @babel/types rehoist) from adding apple-targets
- Task 4: minor (deferred): sync JS wrappers not try/catch; snapshot decoded twice per render
- Task 4: minor (deferred): BackgroundAssertion nonisolated class touches @MainActor UIApplication.shared — warning in Swift 5, error in Swift 6; @MainActor on the class is the fix (LiveActivityTokenForwarder.swift:270,277)
- Task 4: minor (deferred): stale lastActivityTokens entry if activity ends mid-POST; two failed attempts on background launch never retried until next launch
- Task 5: minor (deferred): stale mood verse never pruned; readMoodVerse has no shape guard; test gaps (startLocal after failed register, mood key cleared on non-Pro, '' deviceId)
- Task 5: minor (deferred): no timeout on functions.invoke — a hung register/unregister stalls the queue (switch-off waits)
- Task 5: minor (deferred): resync keeps isLoaded true during identity change → brief stale Pro state at login/logout
- Task 5: minor (deferred): invoke throwing after server processed register leaves flag unset → later teardown skips unregister (dispatcher Pro purge covers)
- Task 5: minor (deferred): out-of-queue flip leaves a snapshot written until next teardown
- Task 6: minor (deferred): register round-trip on every Home focus/foreground (skip when schedule unchanged)
- Task 6: minor (deferred): un-awaited never-rejecting promises in invitation; 5s sign-out spinner worst case; no render tests for Settings row/invite card; PrayerTimes 12h/24h toggle doesn't re-sync card
- Task 6: minor (deferred): Settings availability refreshes only on focus (no AppState listener); forced sign-outs (session expiry/SIGNED_OUT) don't reset opt-in; signOut error after reset leaves user signed in with opt-in off
- Task 7: minor (deferred): error message echoes a 40-char key name; timeZone/rcAppUserId free text; admin client built outside try; no user_id index; req.text before size check
- Task 7: minor (deferred): no handler-level test for live-activity-register index.ts (409 branch guarded by reading only)
- Task 8: minor (deferred): fold proPatch into the start pre-write (verdict lost on common start path → extra RC call; first-ever verdict + RC outage leaves row pro_unknown)
- Task 8: minor (deferred): failed start's restore can be lost to a concurrent token post; ambiguous APNs timeout after Apple accepted can still duplicate a start
- Task 8: minor (deferred): unconditional deletes on bad token / not-Pro can erase a concurrent registration; tokens and JWT appear in PostgREST query strings via .eq(); no apns-expiration / start stale-date; one halt-class row can halt every run
- Final re-review: a server start landing during an in-flight switch-off can survive until next launch (calling endAll again after markSwitchedOff would close it); a permanently failing unregister blocks re-enable by design; a start backoff delays that prayer's card 15 min; 5xx retries next minute (Apple suggests 15).
