# Sakina — Project Guide

Sakina is a React Native (Expo) Islamic spiritual companion app. Aesthetic:
**"Celestial Night"** — cool steel-blue backgrounds (`#07111E`→`#0F1F30` via
`Colors.celestialWash`), warm cream text (`Colors.text.primary`), single gold
accent (`Colors.accent.primary #D4AF37`), twinkling stars, faint gold mandala
backdrop, calm and breathing motion. The warm-on-cool contrast is intentional —
a lantern under a starlit sky. Brand mark is the gold lantern (fanoos) in
`assets/icon.png`, recreated as [`SakinaLantern`](src/components/SakinaLantern.tsx).

Styling is **React Native `StyleSheet` + the core `Animated` API**, with all
visual values coming from [`DesignSystem.ts`](src/theme/DesignSystem.ts).
We do **not** use Tailwind, CSS, framer-motion, or Reanimated. When a design
skill (`visual-design-foundations`, `interaction-design`, `react-native-design`,
`ui-ux-pro-max`) gives a web/Tailwind snippet, follow its *principle* and
translate to our stack — never paste web code.

---

## Screen Layout Checklist — apply to EVERY screen

**Spacing**
- Use only `Spacing` tokens (`xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32 · xxxl 48`)
  and `BorderRadius` tokens. No magic numbers — if a value isn't in the scale,
  reconsider or add it to the system, don't hardcode.
- Screen horizontal padding: `Spacing.xl` (24). Gap between major blocks:
  `Spacing.xxl`–`xxxl`. Icon↔text gap: `Spacing.sm`.

**Safe areas & header clearance**
- Respect notches/home indicator with `useSafeAreaInsets()` (already used in
  `OnboardingScreen`). Never put content under the status bar or nav gestures.
- Top-aligned titles/badges must clear the header zone — don't vertically-center
  tall content that then overflows up into the back arrow / progress ring
  (the bug fixed on Paywall & Personalization). Prefer `justifyContent:'flex-start'`
  + a `paddingTop` for content-heavy screens.

**Typography & hierarchy**
- Use `Typography.sizes` (`hero 32 · h1 24 · h2 20 · body 16 · small 14 · detail 12`)
  and `Typography.fonts` (`serif` for display/titles, `latin` for body,
  `arabic` = Amiri-Quran for Quran text). Max 2–3 weights.
- One clear hierarchy per screen: title → body → caption. One **primary CTA**
  per screen; secondary actions are visibly lighter (text/ghost).
- Line height: headings tight, body ~1.5×. Keep copy short, especially first
  screens and onboarding.

**Color & contrast**
- Text from `Colors.text` on `Colors.background`. Body text contrast ≥ 4.5:1,
  large text ≥ 3:1. The single gold `Colors.accent.primary` does the accent
  work — don't introduce new arbitrary colors (mood screens use `MoodColors`).
- Surfaces use `Colors.glass.*`; shadows use the `Elevation` tokens.

**Motion** (calm, purposeful — never decorative blinking)
- Timing bands: micro-feedback 100–150ms · small transitions 200–300ms ·
  medium/page 300–500ms. Tokens: `Animations.timing` (`fast 200 · normal 400 ·
  slow 600`) and `Animations.spring` (`gentle`, `bouncy`).
- Entrances use one coherent motion (e.g. the staggered fade/slide via
  `useStaggerEntry`). Don't stack two opacity animations on the same content
  (that caused the onboarding button "blink").
- Honor reduce-motion (`useReduceMotion`) — loops/flicker must stop.
- Animate `transform`/`opacity` only; never animate layout (`width`/`height`).
  For SVG-prop animations (e.g. `Ionicons`/`react-native-svg` opacity), use
  `useNativeDriver: false`.

**Navigation & icon indicators**
- Bare icons only — never wrap back arrows, chevrons, or nav indicators in circular
  containers (`borderRadius: full` + border + background). Circles on every icon
  erode the immersive aesthetic. Use generous `hitSlop` (minimum 44 pt touch
  target: `hitSlop={{ top:12, right:12, bottom:12, left:12 }}`) without adding
  visual clutter.
- Disabled nav icons use opacity or a muted color on the icon itself, not a
  different container shape.

**Lists & components**
- Long lists use `FlatList`, never `ScrollView` + `.map`.
- Memoize where it matters (`React.memo`, `useCallback`) to avoid re-render churn.
- Define `StyleSheet.create` styles outside render; avoid inline style objects.

**Before calling a screen done**
1. Safe areas + header clearance respected on a notched device.
2. Spacing all from tokens; one primary CTA; consistent bottom placement.
3. Type hierarchy clear; contrast passes; copy is tight.
4. Motion sits in the timing bands, honors reduce-motion, no flicker.
5. The screen belongs to the same product world as its neighbors.

---

## Quoting Quran Text — non-negotiable

This exact bug shipped three times in one session (`dailyVerseService.ts`,
`StreakBar.tsx`, `SpiritualWindowBanner.tsx` all quoted verse fragments as if
they were the full ayah). Treat these as hard rules, not style preferences:

1. **Always the complete ayah, never a clause.** If a UI cites "Surah X:Y",
   the Arabic + translation must be the full text of that ayah, start to end
   — not a fragment that happens to sound quotable in English. Showing a
   fragment under its real ayah number misrepresents the Quran even when the
   fragment reads as a grammatically complete sentence.
2. **Never type Arabic diacritics or a translation from memory.** Verify
   every ayah against a reliable source before writing or editing verse
   content: `https://api.alquran.cloud/v1/ayah/{surah}:{ayah}/editions/quran-uthmani,en.sahih`
   (Uthmani script + Sahih International). Fetch it with `curl`/Node `fetch`
   and read the raw JSON yourself — the `WebFetch` tool summarizes through a
   small model that has been observed silently truncating or misnumbering
   long ayahs even when explicitly told to return the complete verbatim text.
   "Verify against Sahih International" means confirming the ayah's full
   *meaning and completeness* — light prose-smoothing for a UI card (dropping
   translator clarification brackets like `[so]`/`[O Muhammad]`, adjusting a
   connective word for flow) is fine and matches this app's existing voice
   (`quranData.ts` already does this, e.g. "the Hereafter is better for you
   than the first" for 93:4 rather than the bracketed "...than the first
   [life]"). What's never acceptable is dropping a clause, changing what the
   ayah actually claims, or substituting a specific term for a vaguer one
   (e.g. "religious scholars" becoming "devoted men of faith" changes the
   translator's specific word choice without changing meaning enough to
   justify it — prefer the source's own wording once brackets are resolved).
3. **If the complete ayah doesn't fit the slot, swap the verse — don't cut
   it.** Some ayahs are fiqh rulings (e.g. 2:222, 65:2), mid-narrative
   dialogue with no antecedent, or simply very long (2:286, 2:185). If citing
   one would mean truncating it, or it would read oddly/inappropriately out
   of context, pick a different complete, thematically-similar ayah instead.
4. **Never bound verse text with `numberOfLines`/ellipsis with no way to see
   the rest.** Clipping an ayah at render time with a permanent line cap is
   the same violation as truncating it in the data. Bound verse UI with
   font-size scaling (fixed container, tiered size by length) or by letting
   it wrap freely. A collapsed-preview-with-tap-to-expand (`numberOfLines`
   that flips to `undefined` on tap, per `QuranLibraryScreen.tsx`'s
   `VerseCard`) is fine — the complete ayah is still genuinely reachable, not
   hidden. What's banned is a clamp with no expand affordance at all. If a
   fixed-height container is used instead of expand-on-tap (e.g.
   `VerseOfTheDay.tsx`), don't pair it with `overflow: 'hidden'` unless
   you've actually budgeted the height for the longest real entry with
   margin — an unverified fixed height + hidden overflow is a silent clip
   with extra steps.
5. **Places with verse content, so far:** `src/data/quranData.ts` (already
   sourced from the Quran.com API — the standard to match), and the three
   files above. `hadithService.ts`, `quranService.ts`, `contentRepository.ts`,
   and `sunnahEnricher.ts` also carry Quran/hadith text and have not yet been
   audited against these rules — check them the next time you're in that area.

---

## "For Your Heart" — Content Voice

The Context layer's "For Your Heart" card (`ContextLayer.tsx`'s `heartCard`,
fed by `ContentAngle.angle`) has a distinct job from the "Understand"/
"Matters" sections just above it. Those sections carry the Prophet/companion
story and scholarly explanation (`Content.whyThis`) — "For Your Heart" is
not a second helping of the same voice.

For any **new or edited** `angle` entry (existing entries in `quranData.ts`
are not being retroactively rewritten — see
`docs/superpowers/specs/2026-07-16-for-your-heart-reflection-design.md`):

- Second person, present tense. Speak to the reader directly as a believer,
  not about a Prophet or companion's situation.
- Anchor it in a Divine Name or a promise/address verse to Allah's slaves
  (e.g. 39:53's "O My servants who have transgressed against yourselves, do
  not despair of the mercy of Allah") rather than narrating what happened
  historically.
- If a Prophet/companion story is genuinely the best vehicle for the point,
  it belongs in `Content.whyThis` (the Context layer's own narrative
  section), not here.

Example of the shift:
- Before (tafsir/narrative voice): *"Ibn Kathir explains that 'ni'ma
  al-Mawla wa ni'ma al-Nasir' means Allah is the best of those who
  protect... The Prophet ﷺ said on the day of Uhud: 'Allah is sufficient
  for us...'"*
- After (direct-address voice): *"You are not managing this alone. The One
  who holds the heavens is holding your worry too — He calls Himself your
  Protector, not your bystander."*

---

## Which Angle Fields Actually Render — check before authoring

A `ContentAngle` carries more fields than any screen shows, and the two flows
show **different** ones. Confirm the field you are about to write is rendered
by the flow you are writing for.

**Mood flow (`GuidanceScreen`)** — `LAYER_TYPES` is `['verse', 'context']`.
It renders `content` (VerseLayer) plus, through ContextLayer,
`content.whyThis`, `angle.angle` and `angle.reflection`. It reads **nothing
else**. `angle.action`, `actionArabicText`, `actionSource`, `actionHowTo`,
`actionReward` and `angle.practiceSteps` are never read here —
`SunnahEnricher.enrich()` populates several of them inside `rotationEngine`
and the result is thrown away.

**Journey flow (`PathStepScreen`)** — the only screen that mounts
`PracticeLayer`. Renders `angle.angle`, `angle.reflection` and
`angle.practiceSteps`, falling back to `angle.action` + `actionHowTo` when an
angle has no `practiceSteps`.

Measured on the current corpus: **84 of 810 practice steps are reachable.** The
other 726 sit on mood angles and render nowhere. That does not make them
optional — they are seeded, synced to Supabase, and are the obvious source for
a practice layer in the mood flow later, so author them correctly. It does mean
a "this is what the user sees" claim about a `practiceSteps` edit is usually
wrong: check first whether the angle is a `dailySteps` entry of a path in
`AVAILABLE_PATH_IDS`. A session's worth of citation-label corrections was
written up as fixing what users saw, when 108 of the 113 edited angles rendered
nowhere at all.

The fallback path is where this bites hardest. It must never assert an
authenticity category, because `angle.action` is app-written guidance — a
hardcoded `sourceType` there badges app copy as sourced. It shipped that way:
all seven `q_angle_salah_*` angles lack `practiceSteps`, so every day of Salah
Transformation showed a **"Sunnah Action"** badge over an app-written
instruction, attributed to the verse's own citation. `PracticeStepData.source`
and `.sourceType` are optional precisely so a runtime-assembled step can claim
nothing. Keep them that way.

---

## Journey Sessions — Authoring & Wiring

A Journey (`SpiritualPath`) is a multi-day arc. Each `dailySteps[]` entry is a
**pointer**, not content: `contentId` (the verse), `angleId` (the lesson body),
optional `hadithContentId`. The lesson itself lives in the **angle** in
`quranData.ts` — its `angle` text, `practiceSteps` JSON, and `reflection`.

### 1. Never point a journey step at a generic mood angle

Angles come in two families, and they are **not interchangeable**:

- `q_angle_<verse>_<mood>` (e.g. `q_angle_3_159_angry`) — authored for the
  **mood-picker** flow. Carries that mood's action and reflection.
- `q_angle_<journey>_<day>` (e.g. `q_angle_rizq_day4`, `q_angle_salah_1`,
  `q_angle_results_day1`) — authored for **one specific journey day**.

Journey steps must use the second family. This shipped broken: Trusting the
Results Day 1 ("Do Your Part, Trust the Rest", theme `Overwhelmed`) pointed at
`q_angle_3_159_angry` — mood `Angry`, action *"Perform a silent prayer for the
person you are angry with"*, reflection about confrontation and mercy. A user
opening an exam-anxiety journey got a full session about forgiving someone.

The verse can be shared across journeys and moods. **The angle cannot.** If a
step needs a verse that already has a mood angle, write a new journey angle
against the same `contentId` — don't reuse the mood one.

Both Study journeys are now fully on journey angles — `path_trusting_the_results`
on `q_angle_results_day1`–`day7`, `path_study_journaling` on
`q_angle_study_day1`–`day7`. `scripts/verify-journey.mjs` enforces this for
both; **add any new journey to that script's `JOURNEYS` list** so the same
check covers it.

`path_rizq_revolution` and `path_salah_transformation` already use dedicated
angles but predate this section — their angles are terser, lack the
`[Tafsir ...]` tag, and Salah reuses `quran_29_45` on days 3 and 7. They are
not in the verifier's list yet and would not pass it unchanged.

### 1b. One verse and one hadith per journey

Within a single journey, no `contentId` and no hadith source may appear twice —
in a 7-day arc a repeat is 2/7 of the content. Results had both: days 3 and 5
shipped the *same* hadith (Muslim 2999, "Wondrous is the affair of the
believer") under two different day titles. Check with a scripted sweep, not by
eye; `hadithData.ts` ids are per-day (`hadith_results_5`) so a duplicate hides
behind a distinct-looking id.

### 2. `content.whyThis` is per-verse, not per-journey

`PathStepScreen` passes `content.whyThis` as ContextLayer's `source`, which
renders as the footnote. `whyThis` is written once per verse, usually for its
original mood — 3:159's is about Uhud and gentleness, irrelevant to tawakkul.

Include a `[Tafsir <source> on <surah>:<ayah>]` tag in the angle text.
`extractSourceLabel` prefers it over `whyThis`, and `cleanText` strips it from
the visible body. **Put the tag at the very start of the angle string** — mid-
sentence it strips to a stranded space before the punctuation (`"instead of it ."`).

### 3. Adding any angle requires a `SEED_VERSION` bump

`seedContent.ts` skips already-seeded installs. A new angle without the bump
exists only on fresh installs; everyone else hits `getGuidanceForStep → null`
and the "A Moment of Patience" alert. This is how the Salah Transformation
angles went missing before. Bump `SEED_VERSION` in `seedContent.ts` and note
what was added. (`CURRENT_DB_VERSION` in `operations.ts` drops and recreates
the content tables — heavier, only needed for schema changes.)

`content_angles` has **no `actionTranslation` column**. Put any translation you
need rendered inside the `practiceSteps` JSON, which is stored whole.

### 4. ContextLayer's prop mapping differs by screen — know which you're writing for

- `GuidanceScreen`: `text = content.whyThis` (scholarly), `angle = angle.angle`
  (the direct-address "For Your Heart" card).
- `PathStepScreen`: `text = angle.angle`, and **no `angle` prop** — so journeys
  never render the For Your Heart card, and the angle text lands in the
  *scholarly* Understand/Matters slot instead.

So journey angles are written in **tafsir/scholarly voice**, not the direct-
address voice required by the "For Your Heart" section above. That divergence
is deliberate-by-accident, not designed; don't "fix" it by swapping the mapping
without rewriting all four unlocked journeys' angles, which are authored for
the slot they currently land in.

`ContextLayer.splitIntoSections` splits the angle into Understand / Matters on
a fixed pattern list (`. When you`, `. Your `, `. The Prophet ﷺ said:`, …).
Write angle text containing one of those so the split lands where you intend;
otherwise it falls back to a 60% sentence split.

### 5. Before calling a journey day done

Three scripts, none of which need a device:

- `node scripts/verify-journey.mjs` — static checks (1, 2, 4, 5, 6 below plus
  the tag/split rules). Add new journeys to its `JOURNEYS` list.
- `node scripts/verify-journey-roundtrip.mjs` — seeds every angle into a real
  in-memory SQLite using the actual DDL and seeder column list, reads back via
  `fetchAngleById`'s query, and replays PathStepScreen + ContextLayer on the
  result. This is what proves a day renders, not just that it parses.
- `node scripts/verify-journey-selftest.mjs` — injects 12 known faults into a
  sandbox copy and asserts the verifier catches each. Run it after editing
  `verify-journey.mjs`; a checker that only ever prints "passed" is untested.

Between them they caught a collapsed Understand/Matters split, a stray-space
artifact, and a brace-matcher that counted `{` inside string literals — none
of which a typecheck can see.

1. `angleId` resolves, and belongs to this journey — not a mood angle.
2. Angle `mood` matches the path `theme`.
3. Every ayah verified per "Quoting Quran Text" above — fetch the raw JSON, do
   not trust `WebFetch` or memory.
4. `practiceSteps` JSON parses; `type`/`icon`/`sourceType` are valid union members.
5. Verse and hadith source not already used by another day in the same journey.
6. Each day's du'a is distinct from the other days'.
7. `SEED_VERSION` bumped.

`staticPaths.ts` is **CRLF** and several `focus`/`title` strings contain escaped
apostrophes (`Allah\'s`). A `/focus: '[^']*'/` style regex stops at the escape
and silently truncates the string — always typecheck after a scripted edit, and
prefer anchoring edits to the `id: 'step_<x>'` block, since angle ids like
`q_angle_94_5_stressed` are shared across journeys and a global replace will hit
the wrong one.

### 6. Journey availability is data, currently hardcoded in UI

`AVAILABLE_PATH_IDS` lives in `PathsScreen.tsx` while
`PathsService.getAllPaths()` returns all 23 unfiltered. 16 paths have **zero**
`dailySteps`. Any new surface that lists or deep-links journeys must check
availability, or it will route users into an empty journey.

---

## Commands
- Typecheck: `npx tsc --noEmit -p tsconfig.json`
- (Run on device via Expo to verify visual changes — visuals can't be confirmed from a typecheck alone.)
