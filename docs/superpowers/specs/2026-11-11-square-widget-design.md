# Square Home Screen Widget ("Your path") — Design

Date: 2026-11-11 · Status: approved by Ahmed ("Build widget now", 2026-11-12);
built on `feat/live-activity` per `docs/superpowers/plans/2026-11-12-square-widget.md`.
Not yet compiled for iOS or seen on a device.

Mockups (open with `node docs/superpowers/previews/live-activity/serve.mjs`,
then `http://localhost:5179/docs/superpowers/previews/live-activity/together.html`):
`together.html` is the agreed design; `widgets.html` and `widgets-day.html` are
the two earlier rounds, kept for the record.

## Intent

A square widget on the iPhone Home Screen that keeps a Pro user one tap from
Sakina's **own** daily loop: how is your heart → the verse → your Journey →
the question to reflect on. Prayer times are what every Islamic app puts on a
widget; this one is Sakina's.

It sits beside the prayer card (Dynamic Island + Lock Screen,
`2026-10-29-dynamic-island-live-activity-design.md`), and the two must read as
one product without ever repeating each other.

## Decided by Ahmed

- **The widget shows Sakina's main features, not prayer times.** (His words on
  the first, prayer-centred mockups: "none of them … is focused on our main
  features".)
- **It changes through the day at the user's own prayer times.** After Fajr:
  the mood check-in. From Dhuhr: the Journey. From Maghrib: a reflection.
- **The widget and the island never show the same thing.**
  - Island and Lock Screen card own **"now"**: next prayer and the board, the
    lantern and its phrase, the verse.
  - The widget owns **"your path"**: the check-in question, the Journey day,
    the reflection question. It never shows prayer times and never the lantern.
- **The rule is "never twice on one phone".** While the prayer card is
  switched on, the widget never shows verse text. When it is off, the widget
  shows the verse after a check-in.
- **Pro only.** (I recommended free; he chose Pro.)
- **Sensitive Journeys never show their name or day title** — the widget says
  "Your Journey". The list is in "Sensitive Journeys" below; he accepted it as
  proposed.
- **An unanswered check-in stops asking at Dhuhr.** After that nothing on the
  widget asks anything of the user.
- **Never judge, never guilt.** Nothing on the widget may say or imply that the
  user missed, skipped or failed something. (Standing rule since the parked
  "I prayed" idea, 2026-11-06.)
- **Complete text or none.** A verse or a question is shown whole or replaced
  by an invitation to open it. Never cut, never ellipsised.

## Builder's calls (mine, not Ahmed's — he may override)

- **iOS 17.2 and later**, because the extension it lives in already targets
  17.2. Unlike the prayer card it also works on iPad, where the card does not
  exist and so counts as "off".
- **Square only** (`systemSmall`), iPhone first. No medium or large size, no
  Lock Screen accessory widgets, no buttons on the widget: the whole square is
  one tap target.
- **iOS only.** Android widgets are separate native work and not part of this.
- **A locked state for non-Pro users.** iOS offers the widget to everyone who
  has the app, so a free user can add it. They see a Pro invitation and
  nothing personal.
- **"Prayer card on" means the Settings switch is on**, the user is Pro and the
  phone supports it (`LiveActivityService.isAvailable()` + `getEnabled()`).
  The widget cannot ask iOS whether a card is on screen this minute; the
  card's overnight gaps are ignored.
- **The check-in "day" is the local calendar day**, the same rule the prayer
  card already uses for the mood verse (`formatDateKey`). See "States" for
  what shows between midnight and Fajr.
- **No prayer times → clock times.** Dhuhr becomes 12:00 and Maghrib 18:00,
  Fajr 05:00.
- **Nothing leaves the phone.** The widget reads one JSON blob the app writes
  into the existing App Group. No server, no push, no new network call.
- **Wording** of the locked line and the two gentle lines (see "Copy").
- **Which Journey**: the last opened Journey that is started and not finished
  (`getLastOpenedPath`), if the user may still open it.
- **The reflection text is marked privacy-sensitive**, so iOS hides it when
  the phone is locked (StandBy, Today view).

## States

One function decides what the widget shows. Inputs: Pro, prayer card on,
checked in today, the Journey (if any) and whether today's day is done, and
the moment of the day.

Moments, from the user's prayer times for that day:

| Moment | From | Until |
|---|---|---|
| night | 00:00 | Fajr |
| morning | Fajr | Dhuhr |
| afternoon | Dhuhr | Maghrib |
| evening | Maghrib | 24:00 |

"Checked in today" means the latest mood check-in's `dateKey` is the day being
drawn; a second check-in the same day replaces the first.

"Journey showing" below means: a Journey is running (started, not finished,
still in `AVAILABLE_PATHS`), **no day of it was completed today**, and the
moment is morning or afternoon. The day shown is the next day to do. So after
finishing a day the widget moves on, and tomorrow it shows the following day.

| # | Condition (first match wins) | Widget shows | Tap opens |
|---|---|---|---|
| 1 | Not Pro | **Locked**: "Sakina Pro" / "Your day with Sakina, on your Home Screen." | The Pro page (route `Support`, `SupportSakinaScreen`) |
| 2 | Not checked in, morning | **Check-in**: "How is your heart today?" / "A verse for how you feel." | Mood check-in (`MoodSelection`) |
| 3 | Not checked in, afternoon, Journey showing | **Journey** | Today's Journey lesson |
| 4 | Not checked in, afternoon, no Journey showing | **Gentle (day)**: "Whenever you are ready, Sakina is here." | Home |
| 5 | Not checked in, evening or night | **Gentle (night)**: "A quiet moment with Allah before you sleep." | Home |
| 6 | Checked in, evening or night | **Reflection**, kicker "To reflect on tonight" | That verse's page with the question |
| 7 | Checked in, card off, morning | **Verse**, kicker "Your verse today" | That verse's page |
| 8 | Checked in, Journey showing | **Journey** | Today's Journey lesson |
| 9 | Checked in, card off (no Journey showing) | **Verse** | That verse's page |
| 10 | Checked in, card on (no Journey showing) | **Reflection**, kicker "To carry with you today" | That verse's page with the question |

Notes:

- Rows 3–5 are the "stop asking at Dhuhr" decision: after Dhuhr the question
  is gone until the next Fajr.
- Row 6 at night covers a check-in made after midnight; a check-in from the
  previous calendar day no longer counts, so the small hours normally show
  row 5.
- Row 8 comes after row 7 on purpose: with the card off, the verse the user
  just received stays until Dhuhr, then the Journey takes over.
- A finished Journey day is not "showing", so the widget moves on to row 9 or
  10. It never says the day is done or not done.

### When a state has nothing to show

- **Reflection with no question.** `ContentAngle.reflection` is optional. If
  the angle shown at check-in has none: with the card off show **Verse**;
  with the card on show **Gentle** (day or night).
- **Verse when the check-in was not a Quran verse.** The mood flow can show a
  hadith or du'a; the prayer card ignores those (`toCardVerse`) and keeps the
  daily verse. The widget does the same: **Verse** uses the existing
  `pickVerse` rule (today's mood verse if it is Quran, else today's daily
  verse). The Reflection state's line "— on <source>" always uses the shown
  content's own `source`, whatever its type.
- **No snapshot at all** (widget added before the app was opened after the
  update, or after sign-out): **Locked** if Pro is unknown. A widget must
  never be blank.
- **Snapshot older than its 7-day horizon**: keep running on clock times with
  "not checked in" and no Journey (rows 2, 4, 5). Journey progress that old is
  not trusted.

## What each state looks like

All values are points. The widget is about 158–170 square depending on the
phone; lay out for 158 and let it breathe at 170. Content padding 14.
Background: `Palette.night → Palette.dusk` top to bottom (as the Lock Screen
card), the mandala (`CardMandala`) faint and off one corner, `GoldHairline`
along the top edge inside the corner radius. Fonts are the card's: Georgia via
`CardFont.title` / `titleItalic`, Amiri Quran via `CardFont.arabic`, all
**fixed size** (the card's parity test forbids scaling fonts in this target).
No lantern image anywhere on the widget.

| State | Layout (top to bottom) |
|---|---|
| Locked | kicker "Sakina Pro" italic 11.5 gold · line 17 cream, vertically centred |
| Check-in | question 19 cream, bottom-aligned · sub-line italic 11.5 `creamSecondary` |
| Gentle | one line 17 cream, bottom-aligned |
| Journey | kicker: Journey title italic 11.5 `creamSecondary` · "Day 3 of 7" 12 semibold gold · day title 19 cream · a row of N thin marks (done = gold 55%, today = gold, later = `track`) |
| Journey, sensitive | kicker "Your Journey" · "Day 3 of 7" · "Today's step is ready." 19 · the same marks |
| Verse | kicker "Your verse today" · the ayah (see fitting) · "— Ad-Duha 93:4" italic 11 |
| Reflection | kicker · the question (see fitting) · "— on Ad-Duha 93:4" italic 11 |

The marks row is omitted for a Journey longer than 14 days (the marks get too
thin to read); "Day 9 of 30" carries it alone.

### Fitting text — never cut

Use `ViewThatFits(in: .vertical)` with every tier at `lineLimit(nil)` and
`fixedSize(horizontal: false, vertical: true)`, as `VerseView` does.

- **Verse:** (1) Arabic 15 + English 12, (2) English 13 alone, (3) the line
  "Your verse is waiting for you." 17 with the reference under it.
- **Question:** 14, then 13, then 12; if it still does not fit, the line
  "A question is waiting for you." 17 with the reference under it. 12 is the
  floor.
- **Journey day title:** 19, then 17, then 15. The longest of the 87 titles in
  the available Journeys (40 characters, "The First Takbir That Changes
  Everything") fits at 19 in the mockup.

Measured on the mockup against real content: of the 346 mood-flow reflection
questions, 8 are over 120 characters and the longest is 155; at 162 pt wide
78 characters fits at 14, 130 at 13, and 155 falls to the invitation. These
numbers come from a browser mockup with Georgia; **re-measure in SwiftUI** and
record the real counts in this section.

## Sensitive Journeys

A Journey marked sensitive shows neither its name nor any day title on the
widget. Put the flag where availability already lives
(`src/constants/journeyAvailability.ts`, e.g. `private: true`), and add a test
that every path id in `staticPaths.ts` is classified one way or the other, so
a new Journey cannot ship unclassified. **Default for an unlisted Journey is
sensitive.**

Sensitive: `path_hope_after_crisis`, `path_tawbah_intensive`,
`path_marriage_seeker`, `path_death_awareness`, and (not yet released)
`path_addiction_recovery`, `path_breaking_free_90` (found while building: the
list Ahmed accepted had 22 Journeys and missed this 23rd, a pornography
recovery protocol), `path_parent_healing`, `path_wrong_marriage`,
`path_forced_marriage`, `path_haram_relationships_exit`,
`path_leaving_haram_job`, `path_depression_iman`, `path_grief_loss`.

Named on the widget: `path_rizq_revolution`, `path_salah_transformation`,
`path_study_journaling`, `path_trusting_the_results`, `path_prayer_leadership`,
`path_screen_detox`, and (not yet released) `path_two_worlds`,
`path_quran_connection`, `path_career_choice`, `path_ramadan_reset`.

The widget **never suggests a Journey**, by mood or otherwise. The only
available Journey with theme `Sad` is the crisis one.

Prayer Leadership has per-user step variants. The day title must come through
`PathsService` (which applies `leaderChoice`), never from `variants` directly,
and a variant id must not be logged (`redactVariantId`).

## Data: what the app writes for the widget

**The app works out the whole timeline; the widget only draws it.** (Changed
2026-11-12 while planning. The first draft had the Swift side re-implement the
state rules with a parity test. The Swift here cannot be compiled or run on
the development machine, so a second copy of the rules would be the least
tested code in the feature. Instead the rules live once, in TypeScript under
Jest, and the widget receives finished entries.)

One JSON value in the existing App Group (`group.com.lelahmed.sakina`), key
`sakina.widget.snapshot.v1`, written by JS through a new native function and
read by the extension. It is separate from the card's
`sakina.liveActivity.snapshot.v1`, which is only written while the card is on.

```ts
interface WidgetSnapshot {
  version: 1;
  /** Sorted by `at`. The widget shows the last entry at or before now. */
  entries: { at: number; state: WidgetState }[];   // `at` = epoch seconds
}

/** Everything the widget draws, text included. `url` is what a tap opens. */
type WidgetState =
  | { kind: 'locked'; kicker: string; text: string; url: string }
  | { kind: 'checkin'; text: string; sub: string; url: string }
  | { kind: 'gentle'; text: string }
  | { kind: 'journey'; kicker: string; dayLabel: string; title: string;
      day: number; of: number; url: string }
  | { kind: 'verse'; kicker: string; arabic: string; english: string;
      ref: string; fallback: string; url: string }
  | { kind: 'reflection'; kicker: string; question: string; ref: string;
      fallback: string; url: string };
```

- **Entries.** One per boundary (00:00, Fajr, Dhuhr, Maghrib) per day. The
  first 7 days use the user's real state and prayer times. Days 8 to 30 use
  clock times with "not checked in" and no Journey (Journey progress that old
  is not trusted). A last entry at the start of day 31 holds the day-time
  gentle line, so a widget that is never refreshed again settles on a line
  that is right at any hour.
- **Not Pro:** a single `locked` entry at `at: 0`.
- **No snapshot at all:** the widget draws the locked state from its own two
  strings, the only personal-data-free fallback it carries.
- **A day without usable prayer times** (none stored, or Fajr < Dhuhr <
  Maghrib does not hold) uses 05:00, 12:00 and 18:00.
- **Text is copied unchanged** from its source: the verse as
  `verseSnapshot.ts` requires, the question exactly as `angle.reflection`.
  `fallback` is the line shown when the text does not fit; the widget never
  shortens anything itself.
- **The mood is never written to the App Group.** What a tap needs in order to
  reopen the check-in (the shown content, its angle and the mood) stays in the
  app's own AsyncStorage.

The widget's writer is **independent of the prayer card's**: today the mood
verse is only remembered when the card is switched on
(`LiveActivityService.onVerseShown` returns early otherwise), and the widget
needs it exactly when the card is off.

**When the app rewrites it** (the native write also calls
`WidgetCenter.shared.reloadTimelines`): app comes to the foreground; a mood
check-in is shown (`GuidanceScreen`, next to `onVerseShown`); a Journey day is
opened or completed; Pro is gained or lost; the prayer card switch changes;
prayer times are recomputed (the existing `sync` path and
`notificationTopUpTask`). While the subscription state has not loaded yet the
app writes nothing, so a Pro user never flashes to Locked at launch.

**The timeline.** The extension turns the entries from now on into WidgetKit
timeline entries and asks for a reload at the end. Entries planned ahead do
not use the widget's refresh budget.

**Clearing.** The snapshot and the app-side check-in record are personal data.
They are removed on sign-out and account deletion by the same path that clears
the card's state (`authService.resetLiveActivity`), and loss of Pro rewrites
the snapshot to the locked entry. CLAUDE.md's "Account Deletion & Local Data
Ownership" section gains a line for it, and the teardown tests cover it.
`verify-local-wipe.mjs` cannot see App Group storage or AsyncStorage; that
section says so.

## Deep links

`src/navigation/linking.ts` holds an allowlist of exact paths. Add, with their
`DEEP_LINK_PATHS` entries, `config` routes and test cases:

| URL | Opens |
|---|---|
| `sakina://check-in` | `MoodSelection` |
| `sakina://pro` | `Support` |
| `sakina://widget/journey` | the running Journey's next step; Journeys if none is running |
| `sakina://widget/reflect` | today's check-in guidance again, on the layer that holds the reflection (`ContextLayer`) |
| `sakina://widget/verse` | today's check-in guidance again |

The gentle state sets no URL: a tap simply opens Sakina.

The auth-link warning at the top of `linking.ts` applies: paths stay exact and
allowlisted. `check-in` and `pro` map straight to a route. The three
`widget/…` links **cannot**: `PathStep` takes whole objects (`path`, `step`,
`userProgress`, `guidanceExperience`) and `Guidance` takes a `mood` and an
`experience`, none of which a URL can carry. They go to one small in-between
screen (`WidgetLink`) that looks those up and replaces itself with the real
destination. For the Journey it hands over to `PathDetail` with a flag to open
today's day, so the guidance loading, the leader-choice sheet and the error
alert stay in the one place that already has them. A link that can no longer
be honoured (check-in from another day, Journey finished, signed out) lands on
Home, silently. Like the existing links, they must survive a cold start and an
onboarding in between (`deepLinkAfterOnboarding.test.tsx`).

## Where the code goes

- `targets/live-activity/` — the same extension. Add the widget to
  `SakinaLiveActivityBundle`; new files for the widget view, its states and
  the snapshot reader. Reuse `Palette`, `CardFont`, `CardMandala`,
  `GoldHairline`. `supportedFamilies([.systemSmall])`,
  `containerBackground(for: .widget)`, `widgetURL`.
- `modules/sakina-live-activity/` — `writeWidgetSnapshot(json)` and
  `clearWidgetSnapshot()`, each reloading the widget; a no-op off iOS like
  every other function in `index.ts`.
- `src/services/widget/` — the state rules, the timeline builder, the link
  resolver, and a small service that gathers the inputs and writes.
- No new dependency is expected. No server or database change.

## Copy (every string on the widget)

| String | Source |
|---|---|
| "How is your heart today?" / "A verse for how you feel." | Ahmed agreed to the question; the sub-line is mine |
| "Sakina Pro" / "Your day with Sakina, on your Home Screen." | mine |
| "Whenever you are ready, Sakina is here." | mine |
| "A quiet moment with Allah before you sleep." | mine |
| "Your Journey" / "Today's step is ready." | mine |
| "Your verse today" / "To carry with you today" / "To reflect on tonight" | mine |
| "Your verse is waiting for you." / "A question is waiting for you." | mine |
| "Day 3 of 7" | — |
| Widget gallery name "Sakina" and description "Your day with Sakina: check-in, Journey and reflection." | mine |

None of these is scripture and none cites a source. Do not add a Divine Name,
a verse fragment or a hadith to the fixed lines: everything sacred on the
widget comes whole from the app's verified data.

## Non-goals

- Prayer times, countdowns, the lantern, tasbih or any "I prayed" marker.
- Streaks, counts, "day done" ticks, or any statement about what the user did
  or did not do.
- Suggesting a Journey, or showing one the user has not started.
- Medium and large widgets, Lock Screen widgets, buttons on the widget.
- Android.

## Anti-goals (it has failed if…)

- A crisis or repentance Journey's name appears on someone's Home Screen.
- A verse or a question is cut off, or shown under a wrong reference.
- The island and the widget show the same verse at the same time.
- The question "How is your heart today?" is still on the widget at night.
- A signed-out or deleted account's check-in or Journey is still on the widget.

## What can only be confirmed on a phone

- iOS 18's tinted and clear Home Screen styles recolour widgets; the gradient
  is dropped and text becomes one tint. Check legibility and mark the gold
  parts `widgetAccentable`.
- The real text fits (re-measure, see "Fitting text").
- StandBy, iPad and the Today view all show `systemSmall`; the layout must not
  break there.
- The widget updates within a few seconds of a check-in while the app is open.
- That the locked state appears for a non-Pro account and after Pro lapses.

## Open, for Ahmed

1. ~~Order of work.~~ **Decided 2026-11-12: build the widget now**, before the
   prayer card (build 13) is tried on a real iPhone. I had recommended testing
   the card first; the risk he accepted is one unverified feature stacked on
   another, both first seen on a device in the same build.
2. **The fixed wording** in "Copy" marked "mine". Built as written until he
   changes it.
3. **An in-app hint.** iOS widgets are added from the Home Screen, not from
   inside an app. A short "Add the Sakina widget" row in Settings for Pro
   users would tell people it exists. Not designed here.

## Left to the builder

File and type names, the exact Swift layout code, the test layout, and how the
foreground rewrite is debounced. "A day was completed today" is recorded at
completion time (`UserPathProgress` has no per-day completion date, and the
step screen lets a user finish several days in one sitting).
