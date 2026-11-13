# Square Home Screen Widget ("Your path") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Pro-only square iOS Home Screen widget that walks the user through Sakina's daily loop (check-in, Journey, reflection) at their own prayer times, never repeating what the prayer card shows.

**Architecture:** The app computes the widget's whole timeline in TypeScript (30 days of finished entries, text included) and writes it as one JSON value into the existing App Group. The SwiftUI widget, added to the existing `targets/live-activity` extension, only decodes and draws. Taps use `sakina://` deep links; three of them go through a small in-between screen that looks up what a URL cannot carry.

**Tech Stack:** Expo SDK 54 / React Native 0.81, TypeScript, Jest, React Navigation 7, AsyncStorage, the local Expo module `modules/sakina-live-activity` (Swift), WidgetKit + SwiftUI in `targets/live-activity` (`@bacons/apple-targets`, deployment target 17.2).

**Spec:** `docs/superpowers/specs/2026-11-11-square-widget-design.md`. Read it first. Mockup of every state: `docs/superpowers/previews/live-activity/together.html` (`node docs/superpowers/previews/live-activity/serve.mjs`, then `http://localhost:5179/docs/superpowers/previews/live-activity/together.html`).

## Global Constraints

- **Complete text or none.** No `numberOfLines`, no `lineLimit` other than `lineLimit(nil)`, no ellipsis, no slicing or trimming of a verse or a question anywhere. Text that does not fit is replaced by its `fallback` line.
- **Verse and question text is copied unchanged** from its source (`content.arabicText`, `content.englishTranslation`, `content.source`, `angle.reflection`). Never retype Arabic.
- **Never judge, never guilt.** No string may say or imply that the user missed, skipped or did not do something. The only fixed strings are those in the spec's "Copy" table; add no others, and no Divine Name, verse fragment or hadith.
- **The mood never enters the App Group.** Only the app's own AsyncStorage holds it.
- **Sensitive Journeys:** neither the title nor any day title may be written to the widget snapshot. An unlisted Journey is sensitive.
- **No prayer times, no lantern image, no countdown** on the widget.
- **Pro only.** While the subscription state has not loaded, write nothing.
- **Every font in `targets/live-activity` is fixed-size** (`CardFont.*`, `Font.system(size:)`); the existing parity test rejects scaling fonts.
- **Everything is a no-op off iOS** (Android, Jest, an iOS build without the native module). No public service method ever throws.
- **No new dependency, no server or database change.**
- **The Swift cannot be compiled on this machine.** Keep it plain: annotate `CGFloat` explicitly in arithmetic (build 12 failed on a `Double`/`CGFloat` ambiguity), use only APIs available in iOS 17.2.
- **Never start an EAS build.** Task 9 ends by asking Ahmed.
- Scripts go in files, never `node -e`. React Native styling uses `StyleSheet` and `DesignSystem.ts` tokens only.
- Commands: typecheck `npx tsc --noEmit -p tsconfig.json`; tests `npx jest <pattern>`. End every commit message with the `Co-Authored-By:` line your session specifies.

## Review Focus

1. **Subscription state not loaded at app launch.** A Pro user's widget must not flash to Locked: nothing is written until it loads, then it is written once. (Task 5, test "writes nothing until the subscription state has loaded".)
2. **A check-in that showed a hadith or du'a, not a Quran verse.** The Verse state falls back to the daily verse; the Reflection line cites the hadith's own `source`. (Task 2 test "non-Quran check-in"; Task 5 test of the same name.)
3. **Sign-out or account deletion with the widget on the Home Screen.** No check-in, Journey or verse may remain in the App Group or AsyncStorage. (Task 5 test "forget"; Task 6 test in `authService.liveActivity.test.ts`.)
4. **A stale tap.** The widget still shows yesterday's entry (app not opened), the user taps it: the link lands on Home, without an error screen. (Task 7 test "a check-in from another day resolves to Main".)
5. **A Journey added later and never classified.** It is treated as sensitive, and the classification test fails until someone lists it. (Task 1.)

## File Structure

| File | Responsibility |
|---|---|
| `src/constants/journeyPrivacy.ts` (new) | Which Journeys may be named on the widget |
| `src/services/widget/widgetState.ts` (new) | The state rules and every fixed string: one pure function |
| `src/services/widget/widgetTimeline.ts` (new) | Day boundaries and the 30-day entry list: pure |
| `src/services/widget/widgetService.ts` (new) | Gathers app state, stores the check-in, writes the snapshot |
| `src/services/widget/widgetLinks.ts` (new) | Turns a `widget/…` link target into a destination |
| `src/screens/WidgetLinkScreen.tsx` (new) | The in-between screen for those links |
| `modules/sakina-live-activity/{index.ts, ios/SharedStore.swift, ios/SakinaLiveActivityModule.swift}` | Two new bridge functions |
| `targets/live-activity/WidgetSnapshotStore.swift` (new) | Decode the snapshot, pick the entries from now |
| `targets/live-activity/SakinaPathWidget.swift` (new) | Widget, provider, timeline |
| `targets/live-activity/PathWidgetView.swift` (new) | The six layouts and the fitting tiers |
| Existing screens, hooks and services | One-line calls into `WidgetService` (Task 6), link params (Task 7) |

---

### Task 1: Journey privacy list

**Files:**
- Create: `src/constants/journeyPrivacy.ts`
- Test: `src/constants/__tests__/journeyPrivacy.test.ts`

**Interfaces:**
- Produces: `WIDGET_NAMED_PATH_IDS: ReadonlySet<string>`, `WIDGET_SENSITIVE_PATH_IDS: ReadonlySet<string>`, `isNamedOnWidget(pathId: string): boolean`.

- [ ] **Step 1: Write the failing test**

```ts
import { STATIC_SPIRITUAL_PATHS } from '../../data/staticPaths';
import { WIDGET_NAMED_PATH_IDS, WIDGET_SENSITIVE_PATH_IDS, isNamedOnWidget } from '../journeyPrivacy';

describe('journey privacy on the widget', () => {
  it('classifies every Journey exactly once', () => {
    for (const { id } of STATIC_SPIRITUAL_PATHS) {
      const named = WIDGET_NAMED_PATH_IDS.has(id);
      const sensitive = WIDGET_SENSITIVE_PATH_IDS.has(id);
      expect([id, named !== sensitive]).toEqual([id, true]);
    }
  });
  it('lists no id that is not a Journey', () => {
    const ids = new Set(STATIC_SPIRITUAL_PATHS.map((p) => p.id));
    for (const id of [...WIDGET_NAMED_PATH_IDS, ...WIDGET_SENSITIVE_PATH_IDS]) expect(ids.has(id)).toBe(true);
  });
  it.each(['path_hope_after_crisis', 'path_tawbah_intensive', 'path_marriage_seeker', 'path_death_awareness'])(
    '%s is never named', (id) => expect(isNamedOnWidget(id)).toBe(false));
  it('names Trusting the Results', () => expect(isNamedOnWidget('path_trusting_the_results')).toBe(true));
  it('treats an unknown Journey as sensitive', () => expect(isNamedOnWidget('path_added_next_year')).toBe(false));
});
```

- [ ] **Step 2: Run it** — `npx jest journeyPrivacy` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement `journeyPrivacy.ts`**

Named: `path_rizq_revolution`, `path_salah_transformation`, `path_study_journaling`, `path_trusting_the_results`, `path_prayer_leadership`, `path_screen_detox`, `path_two_worlds`, `path_quran_connection`, `path_career_choice`, `path_ramadan_reset`.
Sensitive: `path_hope_after_crisis`, `path_tawbah_intensive`, `path_marriage_seeker`, `path_death_awareness`, `path_addiction_recovery`, `path_parent_healing`, `path_wrong_marriage`, `path_forced_marriage`, `path_haram_relationships_exit`, `path_leaving_haram_job`, `path_depression_iman`, `path_grief_loss`.
`isNamedOnWidget` is `WIDGET_NAMED_PATH_IDS.has(pathId)` and nothing else. The header comment states the default and that a new Journey must be added to one list.

- [ ] **Step 4: Run it** — Expected: PASS.
- [ ] **Step 5: Commit** — `git add src/constants && git commit -m "feat(widget): classify which Journeys may be named on the widget"`

---

### Task 2: The state rules

**Files:**
- Create: `src/services/widget/widgetState.ts`
- Test: `src/services/widget/__tests__/widgetState.test.ts`

**Interfaces:**
- Consumes: `CardVerse` from `src/services/liveActivity/verseSnapshot.ts`.
- Produces:

```ts
export const WIDGET_COPY = {
  lockedKicker: 'Sakina Pro',
  lockedText: 'Your day with Sakina, on your Home Screen.',
  checkin: 'How is your heart today?',
  checkinSub: 'A verse for how you feel.',
  gentleDay: 'Whenever you are ready, Sakina is here.',
  gentleNight: 'A quiet moment with Allah before you sleep.',
  journeyPrivateKicker: 'Your Journey',
  journeyPrivateTitle: "Today's step is ready.",
  verseKicker: 'Your verse today',
  reflectDay: 'To carry with you today',
  reflectNight: 'To reflect on tonight',
  verseFallback: 'Your verse is waiting for you.',
  questionFallback: 'A question is waiting for you.',
} as const;

export const WIDGET_URLS = {
  checkIn: 'sakina://check-in',
  pro: 'sakina://pro',
  journey: 'sakina://widget/journey',
  reflect: 'sakina://widget/reflect',
  verse: 'sakina://widget/verse',
} as const;

export type Moment = 'night' | 'morning' | 'afternoon' | 'evening';

export type WidgetState =
  | { kind: 'locked'; kicker: string; text: string; url: string }
  | { kind: 'checkin'; text: string; sub: string; url: string }
  | { kind: 'gentle'; text: string }
  | { kind: 'journey'; kicker: string; dayLabel: string; title: string; day: number; of: number; url: string }
  | { kind: 'verse'; kicker: string; arabic: string; english: string; ref: string; fallback: string; url: string }
  | { kind: 'reflection'; kicker: string; question: string; ref: string; fallback: string; url: string };

export interface WidgetInputs {
  pro: boolean;
  cardOn: boolean;
  /** `question` is angle.reflection unchanged, or null when the angle has none. */
  checkIn: { dateKey: string; question: string | null; source: string } | null;
  /** The check-in's verse when it was a Quran verse (toCardVerse), else null. */
  mood: CardVerse | null;
  daily: CardVerse[];
  /** title / dayTitle are null for a sensitive Journey. `day` is the next day to do. */
  journey: { title: string | null; day: number; of: number; dayTitle: string | null; doneOn: string | null } | null;
}

export const LOCKED_STATE: WidgetState;   // kind 'locked', the two locked strings, url WIDGET_URLS.pro
export function widgetStateFor(inputs: WidgetInputs, dateKey: string, moment: Moment): WidgetState;
```

Field formats the tests pin: `ref` is the finished line, `— ${verse.ref}` for a verse and `— on ${checkIn.source}` for a reflection (em dash, as the card writes it). `dayLabel` is `Day ${day} of ${of}`. A sensitive Journey gets `kicker: WIDGET_COPY.journeyPrivateKicker` and `title: WIDGET_COPY.journeyPrivateTitle`.

- [ ] **Step 1: Write the failing tests**

Fixtures: `TODAY = '2026-11-12'`; `verse = { arabic: 'ARABIC', english: 'ENGLISH', ref: 'Ad-Duha 93:4', dateKey: TODAY }`; `daily = [{ arabic: 'D-AR', english: 'D-EN', ref: 'Al-Baqarah 2:152', dateKey: TODAY }]`; `checkIn = { dateKey: TODAY, question: 'QUESTION?', source: 'Ad-Duha 93:4' }`; `journey = { title: 'Trusting the Results', day: 3, of: 7, dayTitle: 'Name the Fear', doneOn: null }`; `base = { pro: true, cardOn: true, checkIn, mood: verse, daily, journey }`.

```ts
const kind = (over: Partial<WidgetInputs>, moment: Moment) => widgetStateFor({ ...base, ...over }, TODAY, moment).kind;

it.each([
  // [inputs changed from base, moment, expected kind] — the spec's rows 1–10
  [{ pro: false }, 'morning', 'locked'],
  [{ checkIn: null }, 'morning', 'checkin'],
  [{ checkIn: null }, 'afternoon', 'journey'],
  [{ checkIn: null, journey: null }, 'afternoon', 'gentle'],
  [{ checkIn: null }, 'evening', 'gentle'],
  [{ checkIn: null }, 'night', 'gentle'],
  [{}, 'evening', 'reflection'],
  [{}, 'night', 'reflection'],
  [{ cardOn: false }, 'morning', 'verse'],
  [{ cardOn: false }, 'afternoon', 'journey'],
  [{}, 'morning', 'journey'],
  [{ cardOn: false, journey: null }, 'afternoon', 'verse'],
  [{ journey: null }, 'morning', 'reflection'],
  [{ journey: { ...journey, doneOn: TODAY } }, 'afternoon', 'reflection'],
  [{ cardOn: false, journey: { ...journey, doneOn: TODAY } }, 'afternoon', 'verse'],
  [{ checkIn: { ...checkIn, dateKey: '2026-11-11' } }, 'morning', 'checkin'],
] as const)('%j at %s shows %s', (over, moment, expected) => expect(kind(over, moment)).toBe(expected));
```

Plus these, each asserting the whole returned object with `toEqual`:
- `the question never shows after Dhuhr`: for `checkIn: null` and moments afternoon, evening, night, with and without a Journey, `kind` is never `'checkin'`.
- `gentle uses the night line in the evening and at night, the day line in the afternoon`.
- `reflection`: evening → `{ kind: 'reflection', kicker: 'To reflect on tonight', question: 'QUESTION?', ref: '— on Ad-Duha 93:4', fallback: 'A question is waiting for you.', url: 'sakina://widget/reflect' }`; morning with `journey: null` → kicker `'To carry with you today'`.
- `verse`: `{ kind: 'verse', kicker: 'Your verse today', arabic: 'ARABIC', english: 'ENGLISH', ref: '— Ad-Duha 93:4', fallback: 'Your verse is waiting for you.', url: 'sakina://widget/verse' }`.
- `journey, named`: `{ kind: 'journey', kicker: 'Trusting the Results', dayLabel: 'Day 3 of 7', title: 'Name the Fear', day: 3, of: 7, url: 'sakina://widget/journey' }`.
- `journey, sensitive` (`title: null, dayTitle: null`): kicker `'Your Journey'`, title `"Today's step is ready."`.
- `no question`: `checkIn.question: null`, card on, evening → gentle night; card off, evening → verse.
- `non-Quran check-in`: `mood: null`, `checkIn.source: 'Sahih Bukhari 6116'`, card off, morning → verse built from `daily[0]` (`ref: '— Al-Baqarah 2:152'`); card on, evening → reflection with `ref: '— on Sahih Bukhari 6116'`.
- `no verse for the day`: `mood: null, daily: []`, card off, morning → gentle day.
- `text is passed through untouched`: a question and a verse with leading/trailing spaces and a 600-character body come back `toBe` identical.
- `every fixed string is from the copy table`: `Object.values(WIDGET_COPY)` has 13 entries, none contains `miss`, `skip`, `forgot`, `haven't`, `didn't`, `still` (case-insensitive).

- [ ] **Step 2: Run** — `npx jest widgetState` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement `widgetStateFor`**

First match wins, in this order (the spec's "States" table):
1. `!pro` → locked.
2. `checkedIn = checkIn?.dateKey === dateKey`; `journeyShowing = journey && journey.doneOn !== dateKey && (morning || afternoon)`.
3. Not checked in: morning → checkin; afternoon → journey if showing, else gentle day; evening/night → gentle night.
4. Checked in, evening/night → reflection (night kicker).
5. Checked in, card off, morning → verse.
6. Checked in, journey showing → journey.
7. Checked in, card off → verse.
8. Checked in, card on → reflection (day kicker).

Fallbacks: a reflection with `question === null` becomes verse when the card is off, gentle (day or night by moment) when it is on. A verse uses `mood` if `mood.dateKey === dateKey`, else the `daily` entry for `dateKey`; if neither exists it becomes gentle.

- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(widget): the widget's state rules and fixed copy"`

---

### Task 3: The timeline

**Files:**
- Create: `src/services/widget/widgetTimeline.ts`
- Modify: `src/services/liveActivity/verseSnapshot.ts` (export the existing private `addDays`)
- Test: `src/services/widget/__tests__/widgetTimeline.test.ts`

**Interfaces:**
- Consumes: `WidgetInputs`, `WidgetState`, `widgetStateFor`, `LOCKED_STATE`, `WIDGET_COPY` (Task 2); `ScheduledPrayer` (`{ name: Salah; at: number }`, epoch seconds) from `supabase/functions/_shared/liveActivityPlan`; `formatDateKey` from `dailyVerseService`; `addDays(dateKey, offset)` from `verseSnapshot.ts`.
- Produces:

```ts
export const WIDGET_SNAPSHOT_KEY = 'sakina.widget.snapshot.v1';
export const WIDGET_REAL_DAYS = 7;
export const WIDGET_TOTAL_DAYS = 30;
export interface DayTimes { dateKey: string; fajr: number; dhuhr: number; maghrib: number } // epoch seconds
export interface WidgetEntry { at: number; state: WidgetState }
export interface WidgetSnapshot { version: 1; entries: WidgetEntry[] }
export function localMidnight(dateKey: string): number;            // epoch seconds of 00:00 local
export function clockDayTimes(dateKey: string): DayTimes;          // 05:00, 12:00, 18:00 local
export function dayTimesFromSchedule(schedule: ScheduledPrayer[]): Map<string, DayTimes>;
export function buildWidgetSnapshot(inputs: WidgetInputs, todayKey: string, real: Map<string, DayTimes>): WidgetSnapshot;
export function lockedSnapshot(): WidgetSnapshot;                  // { version: 1, entries: [{ at: 0, state: LOCKED_STATE }] }
```

- [ ] **Step 1: Write the failing tests**

Use the Task 2 fixtures. `real` = clock times for the first 7 days unless a test says otherwise.

```ts
it('a Pro snapshot has four entries a day for 30 days and one closing entry', () => {
  const s = buildWidgetSnapshot(base, TODAY, new Map());
  expect(s.version).toBe(1);
  expect(s.entries).toHaveLength(30 * 4 + 1);
  expect(s.entries[0].at).toBe(localMidnight(TODAY));
  for (let i = 1; i < s.entries.length; i++) expect(s.entries[i].at).toBeGreaterThan(s.entries[i - 1].at);
});
it('closes on the day-time gentle line at the start of day 31', () => {
  const last = buildWidgetSnapshot(base, TODAY, new Map()).entries.at(-1)!;
  expect(last).toEqual({ at: localMidnight(addDays(TODAY, 30)), state: { kind: 'gentle', text: WIDGET_COPY.gentleDay } });
});
it('not Pro is one locked entry', () => {
  expect(buildWidgetSnapshot({ ...base, pro: false }, TODAY, new Map())).toEqual(lockedSnapshot());
});
it('days 8 to 30 carry no Journey, verse or reflection', () => {
  const after = buildWidgetSnapshot(base, TODAY, new Map()).entries.filter((e) => e.at >= localMidnight(addDays(TODAY, 7)));
  expect(new Set(after.map((e) => e.state.kind))).toEqual(new Set(['checkin', 'gentle']));
});
it("today's check-in does not carry into tomorrow", () => {
  const s = buildWidgetSnapshot({ ...base, journey: null }, TODAY, new Map());
  const at = (key: string, hour: number) => s.entries.filter((e) => e.at <= localMidnight(key) + hour * 3600).at(-1)!.state.kind;
  expect(at(TODAY, 20)).toBe('reflection');
  expect(at(addDays(TODAY, 1), 6)).toBe('checkin');
});
it('a Journey day finished today comes back tomorrow', () => { /* doneOn: TODAY, checkIn: null → today 13:00 'gentle', tomorrow 13:00 'journey' */ });
it('uses the real prayer times for a day that has them', () => { /* real.set(TODAY, { dateKey: TODAY, fajr: m+4*3600, dhuhr: m+11*3600, maghrib: m+17*3600 }) → entries 1..3 of today sit at those instants */ });
it('falls back to 05:00, 12:00, 18:00 when a day’s times are out of order', () => { /* fajr > dhuhr → clockDayTimes(TODAY) */ });
it('groups a schedule by local day and drops a day missing one of the three', () => { /* dayTimesFromSchedule */ });
it('never writes the mood or the Journey title of a sensitive Journey', () => {
  const json = JSON.stringify(buildWidgetSnapshot({ ...base, journey: { ...journey, title: null, dayTitle: null } }, TODAY, new Map()));
  expect(json).not.toContain('Trusting the Results');
  expect(json).not.toContain('Name the Fear');
  expect(json).not.toMatch(/"mood"/);
});
it('stays small', () => expect(JSON.stringify(buildWidgetSnapshot(base, TODAY, new Map())).length).toBeLessThan(60_000));
```

Write the three `/* … */` tests out in full with those values.

- [ ] **Step 2: Run** — `npx jest widgetTimeline` — Expected: FAIL.

- [ ] **Step 3: Implement**

- `localMidnight` builds the date from year/month/day in local time (`new Date(y, m - 1, d)`), so it is right across a DST change.
- `dayTimesFromSchedule` keys each prayer by `formatDateKey(new Date(at * 1000))`, keeps only `Fajr`, `Dhuhr`, `Maghrib`, and returns a day only when all three are present.
- `buildWidgetSnapshot`: not Pro → `lockedSnapshot()`. Otherwise for day `i` in `0..29`: times = `real.get(key)` if it exists and `localMidnight(key) < fajr < dhuhr < maghrib < localMidnight(next day)`, else `clockDayTimes(key)`; entries at midnight, Fajr, Dhuhr, Maghrib with moments night, morning, afternoon, evening. Days `0..6` pass `inputs` as given; days `7..29` pass `{ ...inputs, checkIn: null, mood: null, journey: null }`. Then the closing entry.

- [ ] **Step 4: Run** — `npx jest widgetTimeline verseSnapshot` — Expected: PASS (the `addDays` export must not break `verseSnapshot.test.ts`).
- [ ] **Step 5: Commit** — `git commit -m "feat(widget): build the widget's 30-day timeline in TypeScript"`

---

### Task 4: Native bridge

**Files:**
- Modify: `modules/sakina-live-activity/ios/SharedStore.swift`, `modules/sakina-live-activity/ios/SakinaLiveActivityModule.swift`, `modules/sakina-live-activity/index.ts`
- Test: `modules/sakina-live-activity/__tests__/index.test.ts`

**Interfaces:**
- Produces (JS): `writeWidgetSnapshot(json: string): void`, `clearWidgetSnapshot(): void`. Both no-ops without the native module, like `writeSnapshot`.
- Produces (Swift): `SharedStore.widgetSnapshotKey = "sakina.widget.snapshot.v1"`, `SharedStore.writeWidgetSnapshot(_ json: String)`, `SharedStore.clearWidgetSnapshot()`.

- [ ] **Step 1: Extend the tests in `index.test.ts`**: add `writeWidgetSnapshot: jest.fn()` and `clearWidgetSnapshot: jest.fn()` to `makeNative()`; in `expectAllNoOps` add `expect(() => w.writeWidgetSnapshot('{"version":1}')).not.toThrow()` and the same for `clearWidgetSnapshot()`; add a test that on iOS with the native module present each wrapper calls its native function once with the same argument.
- [ ] **Step 2: Run** — `npx jest modules/sakina-live-activity/__tests__/index` — Expected: FAIL.
- [ ] **Step 3: Implement**
  - `index.ts`: add both to `SakinaLiveActivityNative` and export the wrappers (`native?.…`).
  - `SharedStore.swift`: the key, the two functions, and the key in the header's key list. **`SharedStore.clear()` and `markSwitchedOff()` must not touch it**: those run when the prayer card is switched off, and the widget outlives the card.
  - `SakinaLiveActivityModule.swift`: `import WidgetKit`; `Function("writeWidgetSnapshot") { (json: String) -> Void in … }` and `Function("clearWidgetSnapshot") { … }`, each followed by `WidgetCenter.shared.reloadTimelines(ofKind: "SakinaPathWidget")` (WidgetKit is iOS 14+, the app's floor is 15.1, so no availability check is needed).
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(widget): bridge functions to write and clear the widget snapshot"`

---

### Task 5: WidgetService

**Files:**
- Create: `src/services/widget/widgetService.ts`
- Test: `src/services/widget/__tests__/widgetService.test.ts`

**Interfaces:**
- Consumes: Tasks 1–4; `SubscriptionService` (`hasLoaded()`, `isPremium()`, `onLoaded(cb)`); `LiveActivityService` (`isAvailable()`, `getEnabled()`); `PathsService` (`getLastOpenedPath()`, `loadProgress(id)`, `getAllProgress()`, `getPathById(id)`, `getCurrentStep(id, progress)`); `AVAILABLE_PATH_IDS`; `getDailyVerse`, `formatDateKey` (`dailyVerseService`); `buildVerseSnapshot`, `toCardVerse` (`verseSnapshot.ts`); `buildSchedule` (`prayerSchedule.ts`); `logServiceError`.
- Produces:

```ts
export const WIDGET_CHECKIN_KEY = '@widget_checkin';
export const WIDGET_JOURNEY_DONE_KEY = '@widget_journey_done';
export const WIDGET_TIMINGS_KEY = '@widget_timings';
export interface StoredCheckIn { dateKey: string; mood: Mood; experience: GuidanceExperience }

export class WidgetService {
  static getInstance(): WidgetService;
  refresh(): Promise<void>;                                              // gather and write
  onCheckIn(experience: GuidanceExperience, mood: Mood): Promise<void>;  // store, then refresh
  onJourneyDayCompleted(pathId: string): Promise<void>;                  // store today, then refresh
  setTimings(weekly: PrayerTimings[]): Promise<void>;                    // store with today's dateKey, then refresh
  forget(): Promise<void>;                                               // remove the three keys, clear the snapshot
  getTodaysCheckIn(): Promise<StoredCheckIn | null>;                     // null unless dateKey is today
  getRunningJourney(): Promise<{ pathId: string; progress: UserPathProgress } | null>;
}
```

Every mutating method runs through one promise-chain queue (copy `LiveActivityService.enqueue`) and never rejects.

- [ ] **Step 1: Write the failing tests**

Mock AsyncStorage with the in-memory store used in `liveActivityService.test.ts`; mock `modules/sakina-live-activity` (`writeWidgetSnapshot`, `clearWidgetSnapshot` as `jest.fn()`), `subscriptionService`, `liveActivityService`, `pathsService`, `dailyVerseService` (`getDailyVerse` resolving a fixed verse, real `formatDateKey`). Use `jest.useFakeTimers().setSystemTime(new Date(2026, 10, 12, 9, 0))`. `written()` = `JSON.parse` of the last `writeWidgetSnapshot` call.

Tests, each named as below:
- `writes nothing until the subscription state has loaded`: `hasLoaded` false → `refresh()` → `writeWidgetSnapshot` not called; then run the captured `onLoaded` callback → called once.
- `not Pro writes the locked snapshot`: `written()` equals `lockedSnapshot()`.
- `Pro with no check-in asks the question this morning`: the last entry at or before now has `kind: 'checkin'`.
- `a check-in is stored and shown`: `onCheckIn(experience, 'Sad')` with a Quran `content` and `angle.reflection: 'QUESTION?'` → AsyncStorage `@widget_checkin` parses to `{ dateKey: '2026-11-12', mood: 'Sad', experience }`; card on, no Journey → current entry is the reflection with `ref: '— on ' + content.source`.
- `the mood and the stored experience never reach the App Group`: after that check-in the written JSON contains neither `"mood"` nor `"experience"` nor `"angle"`.
- `card off shows the verse`: `getEnabled` false → current entry `kind: 'verse'`, `arabic` and `english` `toBe` the content's strings.
- `non-Quran check-in`: `content.type: 'Hadith'` → card off → verse from the daily verse; card on, evening → reflection citing the hadith's `source`.
- `an empty reflection counts as none`: `angle.reflection: ''` or `undefined` → no reflection entry anywhere in `written()`.
- `a named Journey shows its day title`: last opened `path_trusting_the_results`, progress `currentDay: 3`, checked in, card on → `{ kicker: 'Trusting the Results', dayLabel: 'Day 3 of 7', title: <step 3's title from getCurrentStep> }`.
- `a sensitive Journey is never named`: `path_hope_after_crisis` → kicker `'Your Journey'`; the written JSON contains neither the path's `title` nor any of its `dailySteps[].title`.
- `a finished, unavailable or over-run Journey is not shown`: `isCompleted: true`; an id not in `AVAILABLE_PATH_IDS`; `currentDay > duration` → no `journey` entry.
- `falls back to the most recently started unfinished Journey` when `getLastOpenedPath` is null.
- `a completed day hides the Journey for today only`: `onJourneyDayCompleted('path_trusting_the_results')` → no journey entry before tomorrow's Fajr, one after.
- `stored prayer times set the boundaries`: `setTimings` with a week of `{ Fajr: '05:10', Dhuhr: '12:05', Maghrib: '17:40', … }` → today's entries sit at those local times.
- `getTodaysCheckIn returns null for another day`: store a check-in dated `2026-11-11` → `null`.
- `forget`: after a check-in, a completed day and timings → `forget()` → the three AsyncStorage keys are gone and `clearWidgetSnapshot` was called once.
- `nothing throws`: with `writeWidgetSnapshot` throwing and AsyncStorage rejecting, every public method resolves.

- [ ] **Step 2: Run** — `npx jest widgetService` — Expected: FAIL.

- [ ] **Step 3: Implement**

`refresh` gathers:
- `pro`: if `!hasLoaded()`, register one `onLoaded(() => this.refresh())` (guard with a flag) and return. `!isPremium()` → write `lockedSnapshot()` and return.
- `cardOn`: `LiveActivityService.getInstance().isAvailable() && await getEnabled()`.
- `checkIn` / `mood`: from `getTodaysCheckIn()`: `question = experience.angle.reflection || null`, `source = experience.content.source`, `mood = toCardVerse(experience.content, dateKey)`.
- `daily`: `buildVerseSnapshot({ mood: null, today: await getDailyVerse(), timeFormat: '24h' }).daily`.
- `journey`: `getRunningJourney()`; `of = path.duration`, `day = progress.currentDay`; `title` and `dayTitle` only when `isNamedOnWidget(pathId)`, else both null; `doneOn` from `@widget_journey_done` when its `pathId` matches. No step for that day → no Journey.
- `real`: `dayTimesFromSchedule(buildSchedule(weekly, firstDay, timeZone))` from `@widget_timings` (`{ firstDay: 'YYYY-MM-DD', weekly }`), `timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone`; empty map when nothing is stored.

Then `native.writeWidgetSnapshot(JSON.stringify(buildWidgetSnapshot(inputs, todayKey, real)))`.

- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(widget): service that gathers app state and writes the widget snapshot"`

---

### Task 6: Wire the app to the service

**Files:**
- Modify: `src/screens/GuidanceScreen.tsx` (the effect at ~line 136), `src/screens/PathStepScreen.tsx` (`completeAndAdvance`), `src/screens/PathDetailScreen.tsx` (`openDay`), `src/hooks/useHomeData.ts` (after the `LiveActivityService…sync` call, and in the `AppState` `'active'` handler), `src/services/notificationTopUpTask.ts`, `src/services/liveActivity/liveActivitySwitch.ts` (`turnOnLiveActivity`), `src/screens/SettingsScreen.tsx` (`handleToggleLiveActivity`), `src/services/subscriptionService.ts`, `src/services/authService.ts` (`resetLiveActivity`), `src/services/widget/widgetService.ts`
- Test: `src/services/widget/__tests__/widgetWiring.test.ts` (new), `src/services/__tests__/authService.liveActivity.test.ts`, `src/services/__tests__/subscriptionService.onLoaded.test.ts`

**Interfaces:**
- Consumes: `WidgetService` (Task 5).
- Produces: `SubscriptionService.onPremiumChange(listener: (isPremium: boolean) => void): () => void` — called after load whenever `isPremium()` differs from the value last reported; returns an unsubscribe.

- [ ] **Step 1: Write the failing tests**
  - `subscriptionService.onLoaded.test.ts`: `onPremiumChange` fires once with `true` when a resync turns a free user Pro, once with `false` on the reverse, not at all when a resync leaves the value unchanged, and not after its unsubscribe is called.
  - `authService.liveActivity.test.ts`: sign-out and account deletion each call `WidgetService.getInstance().forget()`; a `forget` that rejects does not stop the sign-out.
  - `widgetWiring.test.ts`: reads each source file below as text and asserts it contains the call. Its header states what it does not catch: that the call is reached at run time, or passes the right arguments.

    | File | Must contain |
    |---|---|
    | `GuidanceScreen.tsx` | `WidgetService.getInstance().onCheckIn(` |
    | `PathStepScreen.tsx` | `WidgetService.getInstance().onJourneyDayCompleted(` |
    | `PathDetailScreen.tsx`, `SettingsScreen.tsx`, `liveActivitySwitch.ts` | `WidgetService.getInstance().refresh()` |
    | `useHomeData.ts` | both `.setTimings(` and `.refresh()` on `WidgetService.getInstance()` |
    | `notificationTopUpTask.ts` | `WidgetService.getInstance().setTimings(` |
    | `authService.ts` | `WidgetService.getInstance().forget()` |

- [ ] **Step 2: Run** — `npx jest widgetWiring authService.liveActivity subscriptionService` — Expected: FAIL.
- [ ] **Step 3: Implement**
  - `GuidanceScreen`: in the existing check-in effect, beside `onVerseShown`, call `WidgetService.getInstance().onCheckIn(experience, mood)` under the same `isMoodCheckIn && shownContent` condition.
  - `PathStepScreen.completeAndAdvance`: after `await pathsService.saveProgress(updatedProgress)`, `void WidgetService.getInstance().onJourneyDayCompleted(path.id)`.
  - `PathDetailScreen.openDay`: after `setLastOpenedPath`, `void WidgetService.getInstance().refresh()`.
  - `useHomeData`: `void WidgetService.getInstance().setTimings(toWeeklyTimings(schedulingTimings))` beside the Live Activity sync; `void WidgetService.getInstance().refresh()` in the `'active'` handler.
  - `notificationTopUpTask`: `await WidgetService.getInstance().setTimings(toWeeklyTimings(timings))`.
  - `turnOnLiveActivity` (end) and `handleToggleLiveActivity` (after `setEnabled(false)`): `refresh()`.
  - `SubscriptionService`: the listener list and one private `notifyIfChanged()` called at the end of `resync` and `syncFromCustomerInfo`. `WidgetService` subscribes once in its constructor and calls `refresh()`. `SubscriptionService` must not import `WidgetService`.
  - `authService.resetLiveActivity`: add `WidgetService.getInstance().forget()` to the `Promise.allSettled` list.
- [ ] **Step 4: Run** — `npx jest widgetWiring authService subscriptionService liveActivity && npx tsc --noEmit -p tsconfig.json` — Expected: PASS, no type errors.
- [ ] **Step 5: Commit** — `git commit -m "feat(widget): keep the widget snapshot current from the app"`

---

### Task 7: Deep links

**Files:**
- Create: `src/services/widget/widgetLinks.ts`, `src/screens/WidgetLinkScreen.tsx`
- Modify: `src/navigation/linking.ts`, `src/navigation/types.ts`, `src/navigation/MainNavigator.tsx`, `src/screens/PathDetailScreen.tsx`, `src/screens/GuidanceScreen.tsx`
- Test: `src/navigation/__tests__/linking.test.ts`, `src/services/widget/__tests__/widgetLinks.test.ts`

**Interfaces:**
- Consumes: `WidgetService.getTodaysCheckIn()`, `getRunningJourney()` (Task 5); `WIDGET_URLS` (Task 2).
- Produces:

```ts
// types.ts
WidgetLink: { target: string };
PathDetail: { pathId: string; openToday?: boolean };
Guidance: { /* existing */ startLayer?: 'context' };

// widgetLinks.ts
export type WidgetLinkDestination =
  | { name: 'PathDetail'; params: { pathId: string; openToday: true } }
  | { name: 'Guidance'; params: { experience: GuidanceExperience; mood: Mood; startLayer?: 'context' } }
  | { name: 'Main'; params?: { screen: 'Journeys' } };
export function resolveWidgetLink(target: string): Promise<WidgetLinkDestination>;
```

- [ ] **Step 1: Write the failing tests**
  - `linking.test.ts`, using the file's `stateForUrl`:
    - `sakina://check-in` → one route, `MoodSelection`. `sakina://pro` → `Support`.
    - `sakina://widget/journey`, `…/reflect`, `…/verse` → one route `WidgetLink` with `params.target` `'journey'`, `'reflect'`, `'verse'`.
    - `sakina://widget`, `sakina://widget/`, `sakina://widget/anything`, `sakina://widget/journey/extra` → `undefined`.
    - Every value of `WIDGET_URLS` passes `isNavigationDeepLink`.
    - The existing auth-link cases still return `undefined` (do not weaken them).
  - `widgetLinks.test.ts` (mock `WidgetService`):
    - `journey` with a running Journey → `{ name: 'PathDetail', params: { pathId, openToday: true } }`; with none → `{ name: 'Main', params: { screen: 'Journeys' } }`.
    - `reflect` with today's check-in → `Guidance` with that `experience`, `mood` and `startLayer: 'context'`; `verse` → the same without `startLayer`.
    - `a check-in from another day resolves to Main` (`getTodaysCheckIn` → null), for both `reflect` and `verse`.
    - An unknown target, and a `WidgetService` call that rejects → `{ name: 'Main' }`.
- [ ] **Step 2: Run** — `npx jest linking widgetLinks` — Expected: FAIL.
- [ ] **Step 3: Implement**
  - `linking.ts`: add `'check-in'`, `'pro'`, `'widget/journey'`, `'widget/reflect'`, `'widget/verse'` to `DEEP_LINK_PATHS`; in `config.screens` add `MoodSelection: 'check-in'`, `Support: 'pro'`, `WidgetLink: 'widget/:target'`. Extend the header comment's "Adding a link" history with these.
  - `MainNavigator.tsx`: register `WidgetLink` beside `PrayerTimes` (inside the signed-in/guest block).
  - `WidgetLinkScreen`: the app's celestial background (`Colors.celestialWash`) and nothing else; on mount `resolveWidgetLink(route.params.target)` then `navigation.replace(dest.name, dest.params)`. Safe areas are irrelevant (no content); no spinner, the lookup is local.
  - `PathDetailScreen`: when `route.params.openToday` is set, once the path and progress have loaded, call the existing `openDay` for the current step exactly once (a ref guards re-runs on focus). If the leader-choice sheet opens instead, that is correct.
  - `GuidanceScreen`: `startLayer === 'context'` sets the initial `currentLayer` to `contextIndex` when the experience has a context layer, else 0.
- [ ] **Step 4: Run** — `npx jest linking widgetLinks deepLinkAfterOnboarding && npx tsc --noEmit -p tsconfig.json` — Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(widget): deep links for the widget's taps"`

---

### Task 8: The SwiftUI widget

**Files:**
- Create: `targets/live-activity/WidgetSnapshotStore.swift`, `targets/live-activity/SakinaPathWidget.swift`, `targets/live-activity/PathWidgetView.swift`
- Modify: `targets/live-activity/SakinaLiveActivity.swift` (add `SakinaPathWidget()` to `SakinaLiveActivityBundle`)
- Test: `modules/sakina-live-activity/__tests__/widgetParity.test.ts` (new)

**Interfaces:**
- Consumes: the JSON of Task 3 (`WidgetSnapshot`), key `sakina.widget.snapshot.v1`, App Group `VerseStore.appGroup`; `Palette`, `CardFont`, `CardMandala`, `GoldHairline` (`LiveActivityStyle.swift`).
- Produces: widget kind `"SakinaPathWidget"` (the string Task 4 reloads).

- [ ] **Step 1: Write the parity test** (`widgetParity.test.ts`, same style as `attributesParity.test.ts`; its header lists what it cannot catch: whether the Swift compiles, and how it looks)
  - `WidgetSnapshotStore.swift` and `ios/SharedStore.swift` each contain the literal `"sakina.widget.snapshot.v1"`, equal to `WIDGET_SNAPSHOT_KEY`.
  - `SakinaPathWidget.swift` and `SakinaLiveActivityModule.swift` each contain `"SakinaPathWidget"`.
  - `SakinaLiveActivity.swift` contains `SakinaPathWidget()`.
  - Every `kind` of `WidgetState` (`locked`, `checkin`, `gentle`, `journey`, `verse`, `reflection`) appears as `case "<kind>"` in `PathWidgetView.swift`.
  - Every property name used by any `WidgetState` member (`kind`, `kicker`, `text`, `sub`, `dayLabel`, `title`, `day`, `of`, `arabic`, `english`, `ref`, `question`, `fallback`, `url`) is declared as `let <name>:` in `WidgetSnapshotStore.swift`.
  - The Swift fallback strings equal the TypeScript ones: the files contain `WIDGET_COPY.lockedKicker`, `lockedText`, `checkin`, `checkinSub` and `WIDGET_URLS.pro` as literals.
  - In the three new files: no `lineLimit(` except `lineLimit(nil)`, no `truncationMode`, no `Image("lantern")`, no `minimumScaleFactor`.
- [ ] **Step 2: Run** — `npx jest widgetParity` — Expected: FAIL (files missing).
- [ ] **Step 3: Write `WidgetSnapshotStore.swift`**

```swift
struct PathWidgetState: Codable, Hashable {
  let kind: String
  let kicker: String?; let text: String?; let sub: String?
  let dayLabel: String?; let title: String?; let day: Int?; let of: Int?
  let arabic: String?; let english: String?; let ref: String?
  let question: String?; let fallback: String?; let url: String?
}
struct PathWidgetEntryModel: Codable { let at: Double; let state: PathWidgetState }
struct PathWidgetSnapshot: Codable { let version: Int; let entries: [PathWidgetEntryModel] }

enum WidgetSnapshotStore {
  static let snapshotKey = "sakina.widget.snapshot.v1"
  static let locked: PathWidgetState      // kind "locked", "Sakina Pro", "Your day with Sakina, on your Home Screen.", "sakina://pro"
  static let sample: PathWidgetState      // kind "checkin", "How is your heart today?", "A verse for how you feel." — gallery preview only
  static func load() -> PathWidgetSnapshot?
  /// The entry in force at `now` (re-dated to `now`) followed by every later one.
  /// No snapshot, a version other than 1, or no entry at or before `now`: [(now, locked)].
  static func upcoming(from now: Date) -> [(date: Date, state: PathWidgetState)]
}
```

- [ ] **Step 4: Write `SakinaPathWidget.swift`**: `PathEntry: TimelineEntry { date, state }`; `PathProvider: TimelineProvider` (`placeholder` and a preview `getSnapshot` return `sample`; otherwise the first of `upcoming`; `getTimeline` maps `upcoming(from: Date())` to entries with policy `.atEnd`); `SakinaPathWidget: Widget` with `StaticConfiguration(kind: "SakinaPathWidget", provider:)`, `.configurationDisplayName("Sakina")`, `.description("Your day with Sakina: check-in, Journey and reflection.")`, `.supportedFamilies([.systemSmall])`, `.contentMarginsDisabled()`.
- [ ] **Step 5: Write `PathWidgetView.swift`** from the spec's "What each state looks like" and "Fitting text" (sizes in points, all fonts fixed-size):
  - Root: `GeometryReader`, padding 14, `.dynamicTypeSize(...DynamicTypeSize.large)`, `.widgetURL` when `state.url` parses, `.containerBackground(for: .widget)` holding the `Palette.night → Palette.dusk` gradient, `CardMandala(size: 170)` offset past one corner, and `GoldHairline` on the top edge with 26 pt side insets.
  - `switch state.kind` with one `case` per kind; an unknown kind draws the locked state.
  - Kicker italic 11.5 `creamSecondary` (gold for locked); headline lines 19 or 17 cream; `dayLabel` `Font.system(size: 12, weight: .semibold)` gold; reference italic 11 `creamSecondary`.
  - Fitting blocks get an explicit height (the widget's height minus 28 and minus the fixed rows) and use `ViewThatFits(in: .vertical)` with every `Text` at `.fixedSize(horizontal: false, vertical: true)`:
    - verse: Arabic 15 + English 12 → English 13 → `fallback` 17;
    - question: 14 → 13 → 12 → `fallback` 17;
    - Journey title: 19 → 17 → 15.
  - Journey marks: `of` capsules 3 pt high, drawn only when `of <= 14`; index `< day` gold 55%, `== day` gold, later `Palette.track`.
  - `.privacySensitive()` on the question and on the Journey kicker and title; `.widgetAccentable()` on the gold elements.
- [ ] **Step 6: Add `SakinaPathWidget()` to the bundle** in `SakinaLiveActivity.swift`.
- [ ] **Step 7: Run** — `npx jest widgetParity attributesParity` — Expected: PASS (the existing fixed-font rule now also covers the new files).
- [ ] **Step 8: Commit** — `git commit -m "feat(widget): the square Home Screen widget"`

---

### Task 9: Documentation, full check, hand-over

**Files:**
- Modify: `CLAUDE.md` ("Account Deletion & Local Data Ownership"), `docs/superpowers/specs/2026-11-11-square-widget-design.md` (status line)

- [ ] **Step 1: CLAUDE.md.** Add one bullet beside the Live Activity one: the widget's state is AsyncStorage (`@widget_checkin`, `@widget_journey_done`, `@widget_timings`) plus `sakina.widget.snapshot.v1` in the App Group; `clearAllLocalUserData` and `verify-local-wipe.mjs` do not see it; it is cleared by `WidgetService.forget()` from `authService.resetLiveActivity`, covered by `widgetService.test.ts` and `authService.liveActivity.test.ts`; switching the prayer card off must not clear it.
- [ ] **Step 2: Run everything** — `npx tsc --noEmit -p tsconfig.json && npx jest` — Expected: no type errors, every suite green. Report the suite and test counts.
- [ ] **Step 3: Commit** — `git commit -m "docs(widget): record the widget's local data and how it is cleared"`
- [ ] **Step 4: Stop and report to Ahmed.** Nothing has run on a phone. Do not start a build. Ask whether he wants a TestFlight build, and give him this checklist for it (from the spec's "What can only be confirmed on a phone"): the widget appears in the gallery and adds; each state's text fits (re-measure and write the real numbers into the spec's "Fitting text"); a check-in changes the widget within seconds; each tap lands where the table says; tinted and clear Home Screen styles stay legible; a non-Pro account sees Locked; signing out clears it; the prayer card still works.
