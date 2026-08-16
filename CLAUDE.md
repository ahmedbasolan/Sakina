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
- **A "skip the intro" tap must not leave the settled state owned by an
  `Animated.Value`.** `VerseLayer` and `HadithLayer` both shipped a `skipReveal`
  that wrote six final values while the staged sequence was still running, and
  tapping during the reveal could leave the translation stuck near zero opacity
  — invisible until the screen was popped and re-entered. Three parts to the
  fix, and only the third is load-bearing: hold the `CompositeAnimation` in a
  ref and stop it before writing; guard the completion callback on `finished`;
  and **gate the styles on the completion flag** (`revealComplete ? 1 : anim`)
  so the settled render contains plain numbers and no Animated node at all.
  Do not repeat the explanation the first fix was committed with — that
  `setValue()` "does not reach the native driver" is **false**;
  `AnimatedValue.setValue` calls `NativeAnimatedAPI.setAnimatedNodeValue` when
  `__isNative`. The true cause was never isolated, which is exactly why the
  settled state must not depend on it.

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
   files above. Swept 2026-08-12 and currently clean: `dailyVerseService.ts`
   and `StreakBar.tsx` (every entry carries a sibling `ref` field with the
   ayah complete), `pathsService.ts`'s `getStepMotivation`, and
   `NotificationScreen.tsx`'s onboarding previews. `quranService.ts`,
   `contentRepository.ts` and `sunnahEnricher.ts` were checked the same day
   and hold **no literal verse text** — they move it, so they are not a
   citation surface (there is no `hadithService.ts`; that entry was wrong).
   Note the sibling-field shape when sweeping: a grep for a quotation without
   a citation on the *same line* reports all of these as faults and all of
   them are false. What was genuinely uncited was the one place with no `ref`
   field at all — see `NotificationScreen.tsx`'s history in git.

---

## Citing Hadith — the same standard as the Quran

The Quran rules above shipped first because verse text is obviously sacred.
Hadith citations were treated as decoration for far longer, and a single audit
found ~40 broken ones: fabricated numbers, collections nobody hosts, bare
titles standing in for a source, and — worst — real hadith numbers whose text
has nothing to do with the du'a printed above them.

1. **Never write a hadith number from memory.** One was invented outright
   ("Al-Mu'jam al-Awsat 6026") and shipped. If you cannot fetch it, do not
   cite it.
2. **A citation must be locatable: collection + number.** "The Increase Dua",
   "Authenticated in morning/evening adhkar", "Ibn al-Qayyim on Tawakkul" and
   a bare "[Tabarani]" are not sources. A named scholar's teaching is not a
   chain — drop `sourceType` entirely rather than badge it as sourced.
3. **A bare citation asserts provenance; a quoted one is framing.**
   `source: 'Sahih Bukhari 1162'` says *this Arabic is that hadith* — and it
   was not; 1162 is Aisha on the two rak'ahs before Fajr, while Istikharah is
   1166. But `source: '"Do not be angry." [Bukhari 6116]'` quotes the hadith
   and pairs it with a separate dhikr, which is fine. Write whichever you mean.
4. **`sourceType` is a claim, and the badge is what the user reads.**
   `quran_dua` renders "Qur'anic" — do not put it over a tafsir label, a
   Divine Name, or an app formulation. `composed_dua` exists precisely so
   app-written wording can be labelled "Suggested Wording" instead of
   masquerading as scripture. Never upgrade to a sourced category to make a
   step look better.
5. **`actionSource` and `actionReward` drift separately from
   `practiceSteps`.** Fixing a step's citation does not fix the angle's
   action fields; two angles kept quoting a replaced hadith there for several
   commits. Grep both when you change a source.
6. **Where to verify.**
   - `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/{eng|ara}-{coll}/{n}.json`
     — reliable for bukhari / tirmidhi / abudawud / ibnmajah / nasai, and it
     agrees with sunnah.com's numbering for those. It **renumbers Sahih
     Muslim** — every Muslim lookup there returns an unrelated hadith, which
     once nearly "corrected" nine accurate citations into broken ones.
   - sunnah.com for everything else. It refuses a default curl User-Agent with
     a Cloudflare 403, and refuses Node's `fetch` even *with* a browser
     User-Agent — the block fingerprints the TLS stack. `curl -sL -A '<browser
     UA>'` works; `robots.txt` allows all but `/selectiondata/*`.
   - It hosts more than you would guess: Sahih Ibn Hibban, Musnad Ahmad,
     al-Adab al-Mufrad, Hisn al-Muslim, Nawawi's Forty, Mishkat, Riyad
     as-Salihin. Check before declaring something unhostable — that claim was
     made about Ibn Hibban and was wrong.
   - **sunnah.com writes its class attributes unquoted.** The English lives in
     `<div class=hadith_narrated>` (the "X reported:" line) and
     `<div class=text_details>` (the matn); the Arabic is the one that *is*
     quoted, `<div class="arabic_hadith_full arabic">`. A scraper matching
     `class="text_details"` returns an empty English field and reports nothing
     wrong. That is how the Prayer Leadership journey first shipped with all
     nine of its Sahih Muslim quotations rendered from the Arabic by hand,
     inside quotation marks, attributed to Muslim — the Arabic was right and
     the meaning was right, but the English was not the published translation
     it presented itself as. When you put an English sentence in quotes next to
     a citation, fetch that sentence.

7. **A correct citation does not make the instruction around it correct.**
   Every rule above polices the *source line*. The `instruction` above it is
   app-written prose that no verifier reads, and it can assert fiqh the source
   never said. Prayer Leadership day 1 shipped "lead one prayer … with a single
   friend **behind** you" under a properly-quoted Sahih Muslim 468 — the
   citation was right, the practice was wrong. A single male follower stands
   level with the imam on his **right** (Bukhari 697/699/726, Muslim 763: the
   Prophet ﷺ moved Ibn Abbas from his left round to his right); a row behind
   forms only from two followers on (Abu Dawud 634: Jabir moved to the right,
   then both pushed behind when Ibn Sakhr arrived); women pray in their own row
   behind the men however few (Bukhari 727). Before writing any instruction
   that tells the user where to stand, what order to move in, which prayers are
   audible, or what to do when something goes wrong, **fetch a hadith for that
   specific claim** — not for the theme it sits under. If you cannot source the
   mechanic, describe less.

8. **Check the id before adding a `Content`.** `quran_8_2` and `quran_20_132`
   already existed with mood angles of their own when a new journey tried to
   add them, which would have put two entries under one id into the seeder.
   A generator that asserts every id it needs resolves *exactly once* catches
   this; a generator that only appends does not. Reusing the existing verse is
   the right outcome — journey angles are exempt from the mood-join check, so
   sharing a verse with a mood angle costs nothing.

`node scripts/verify-citations.mjs` enforces all of this in six passes: the
Arabic of an asserted-Quran step is in the ayah; every chain-claiming step
cites something locatable; `actionSource` names a source rather than a title;
a bare hadith citation's text actually contains the Arabic (mirror); a
`quran_dua` step under a non-Quran source line still matches its verse; and
the same text check against sunnah.com for the collections the mirror cannot
answer. It needs network and `curl`, and treats an unreachable page as
unreadable rather than as a bad citation.

One citation stays unverifiable by script: `q_angle_rizq_day10`'s Sunan
an-Nasa'i al-Kubra 9514. sunnah.com indexes al-Kubra by book with no item URN.

---

## Editing `quranData.ts` by script

The file is ~15.6k lines of CRLF TypeScript holding prose in three languages.
Every one of the following cost a broken build or a silent corruption at least
once.

- **Write the script to a file and run it.** Do not use `node -e`. Shell
  quoting mangles Arabic character classes and `\s+` in ways that fail
  silently — a normaliser was "fixed" three times before anyone noticed the
  shell was eating it.
- **Locate edits structurally**, by `(angleId, stepTitle)`, not by matching
  the source string. Several sources are byte-identical across angles and some
  are line-wrapped (`source:\n          '…'`), so text matching hits the
  wrong step or none.
- **Assert exactly one match per edit, and write nothing if any edit fails.**
  A partial apply across 40 edits is far worse than an abort.
- **Preserve CRLF.** Check for `\r\n` before writing and bail if it is gone.
- **Mind the quoting.** Inserting an apostrophe into a single-quoted literal
  (`'Jami at-Tirmidhi 2891'` → `'Jami' at-…'`) terminates the string and
  breaks the build. Re-quote to double instead. Titles come in both quote
  styles, so a matcher that only tries `'` will miss `"He won't return you
  empty"`.
- **Never run `prettier --write` on `quranData.ts`.** It is not currently
  prettier-clean, so a format run buries your change in thousands of unrelated
  lines. If a scripted edit emits the wrong quote style, re-quote only the
  lines the diff added.
- **Do not "normalise" Arabic.** NFC on this corpus is not the lossless
  reorder it looks like — a run over 29 strings changed the codepoint count of
  four, and most of the file's Arabic is the byte-exact Quran.com API output.
  Leave it alone.

**Verify the checker, not just the code.** Any new check must be shown to fail
on the pre-fix data before you trust it passing on the fixed data — run it,
watch it report the known fault, then fix. Two checks written this way turned
out to be no-ops: one used an Arabic strip class whose first range covers the
entire alphabet (so every comparison trivially passed, the exact trap warned
about at the top of `verify-citations.mjs` — and hit again one pass below the
warning), and one anchored its regex at end-of-string so citations with a
trailing grading were skipped rather than checked.

**A new check must state, in the file, which sub-classes of its fault it does
NOT catch.** Whoever reads a green run next reads it as "the content is
correct", and the only defence is writing the gap down beside the check.
`verify-citations.mjs` pass 7 shipped checking locatability, ellipsis and
Quran-English overlap with **no hadith text check at all** — which is exactly
why a truncated Sahih Muslim quotation passed a fully green run in the same
commit series that added the pass. Two limits worth knowing because they are
not obvious: a word-overlap check catches a quote attached to the **wrong**
source, but provably **cannot** catch a quote that stops early (a truncation's
words are all still present, so it scores 1.00); and reaching for an existing
helper without reading it can invert a check — the first draft of that hadith
comparison called `hadithText()`, which pulls the **Arabic** edition, and would
have scored every English quotation near zero. A check that fails everything is
as useless as one that passes everything.

## Auditing — your own output is the least-audited code in the repo

Every fault above was found by an audit. These were introduced *by* one.

- **Run your own replacement through the check you just wrote.** The moment
  you are most authoritative is the moment nothing is checking you. The
  2026-08-12 audit flagged Muslim 2328a for dropping "except when fighting in
  the cause of Allah", then, in the same commit series, wrote a Muslim 597a
  citation ending at "his sins will be forgiven" — dropping "even if these are
  as abundant as the foam of the sea" and closing the quote with a period.
  Identical fault, held against the original author and then committed.
- **A helper that truncates its own output will be read past.** That audit's
  fetch script sliced hadith text at 420 chars; a clause beyond the cutoff was
  then quoted from memory and merely happened to be correct. Print the full
  text, or make the truncation impossible to miss. This is the mechanism
  behind "never write a hadith from memory" — the rule fails quietly when the
  tool hides where the evidence ended.
- **Before reporting a finding derived from a transform, re-read the raw
  source for at least one hit.** A closer-extraction script that stripped
  quotation marks spliced fragments into `The Prophet ﷺ said: Restraint is not
  weakness — it is the highest form of strength`, which reads as the app
  attributing its own aphorism to the Prophet ﷺ. It was an artifact of the
  script. The data was fine. That finding was one step from being reported as
  a scandal.

---

## "For Your Heart" — Content Voice

The Context layer's "For Your Heart" card (`ContextLayer.tsx`'s `heartCard`,
fed by `ContentAngle.angle`) has a distinct job from the "Understand"/
"Matters" sections just above it. Those sections carry the Prophet/companion
story and scholarly explanation (`Content.whyThis`) — "For Your Heart" is
not a second helping of the same voice.

For any **new or edited** `angle` entry (the spec at
`docs/superpowers/specs/2026-07-16-for-your-heart-reflection-design.md` said
existing entries would not be retroactively rewritten; that held until
2026-08-12, when 31 mood-angle closing lines were rewritten off a templated
"X is not Y — it is Z" / "the ultimate X" construction — SEED_VERSION 30):

- Second person, present tense. Speak to the reader directly as a believer,
  not about a Prophet or companion's situation.
- **Address the reader; do not narrate their afternoon back to them.** This
  copy is chosen by the mood they declared one screen earlier, so any claim
  about their recent behaviour lands on precisely the person most likely to
  contradict it. Four of those 31 rewrites had to be corrected the same day
  (SEED_VERSION 31): "You had the opening to let it out just now, and you
  didn't take it" congratulates restraint to someone who tapped **Angry**,
  possibly seconds after losing their temper, and "You walked past two or
  three of these today and didn't count a single one" scolds someone who
  opened the app feeling **Grateful**. Invite, ask, or name something true —
  "Pick one you can see from where you are sitting" costs nothing and is never
  wrong about them. Chasing warmth is what produces this: a specific-sounding
  sentence feels more human right up until it is false for the reader.
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

Four scripts, none of which need a device:

- `node scripts/verify-journey.mjs` — static checks (1, 2, 4, 5, 6 below plus
  the tag/split rules). Add new journeys to its `JOURNEYS` list. Its final
  du'a-repeat pass is the exception: that one walks **every** path in
  `staticPaths.ts`, because the per-journey checks only cover the `JOURNEYS`
  list and Rizq Revolution — which is not in it — shipped the same
  supplication on day 1 and day 10.
- `node scripts/verify-citations.mjs` — the six citation passes described under
  "Citing Hadith" above. Needs network and `curl`.
- `node scripts/verify-journey-roundtrip.mjs` — seeds every angle into a real
  in-memory SQLite using the actual DDL and seeder column list, reads back via
  `fetchAngleById`'s query, and replays PathStepScreen + ContextLayer on the
  result. This is what proves a day renders, not just that it parses. It has no
  selftest harness, so it carries its own negative-test hook: `RT_INJECT=1 node
  scripts/verify-journey-roundtrip.mjs` corrupts every Arabic-carrying step on
  read and exits 0 only if it corrupted something *and* the checks then failed —
  the first version pinned a single angle id, and renumbering a journey moved
  the Arabic off it, leaving a negative test that passed by doing nothing.
  Add each new journey to its path list — it compares the
  post-DB steps against the pre-DB source, which is stricter than any shape
  rule. (It used to require every `verbal` step to carry Arabic. That encoded a
  habit of the first two journeys: `PracticeLayer` guards the du'a block on
  `item.arabicText`, so "recite Al-Fatihah to someone who will correct you"
  renders correctly with none.)
- `node scripts/verify-surah-lessons.mjs` — re-fetches every ayah in
  `src/data/surahLessons.ts` (the study-sheet layers a day lists in
  `surahIds`) and compares it byte for byte with quran.com. That file is
  generated, and the generator shipped footnote markers glued to words on its
  first run — stripping `<sup>` tags without their contents leaves the digit.
  Needs network and `curl`.
- `node scripts/verify-journey-selftest.mjs` — injects 14 known faults into a
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
   3 steps minimum, 6 maximum — use as many as the day's actual content needs.
   Don't force-compact a day that genuinely has 4 or 5 distinct things to do
   down to a tidy 3, and don't pad a thin day up to a round number either.
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

---

## Account Deletion & Local Data Ownership

Deleting the account must clear the device too, and local rows must never be
uploaded under an account that did not write them. Both shipped broken.

- **`clearAllLocalUserData()`** (`database/operations.ts`) empties the seven
  personal tables plus the personal `kv_store` keys, and is called from
  `AuthService.deleteAccount()` after the server delete confirms. Before it,
  "Delete Account" cleared Supabase only — the confirmation's "deleted forever"
  was false on-device, and the leftovers were re-uploaded on the next sign-in.
- **`claimLocalDataForUser()`** (`supabaseDataService.ts`) is the ONLY
  legitimate caller of `migrateGuestDataToSupabase()` on a sign-in path. The
  bare migration sweeps every local row regardless of who wrote it, which is
  how account A's history reached account B on a shared device
  (`hasClaimedLocalData` in AuthContext is a ref — it resets on app restart).
  Ownership lives in `kv_store`'s `local_data_owner`.
- **`syncPendingHistory()` requires a positive owner match.** It is called
  opportunistically by `recordHistory` on every successful write, and `dbQuery`
  is a serialized queue, so at app start it can run before the async claim
  finishes. "Not someone else" is not sufficient — pre-marker rows have no
  identifiable owner and must not be uploaded either.
- Adding a table that holds personal data means adding it to **both**
  `clearAllLocalUserData` and the `PERSONAL` list in `verify-local-wipe.mjs`.
  The verifier's subset check catches an omission from the wipe, not from both.

## Commands
- Typecheck: `npx tsc --noEmit -p tsconfig.json`
- Tests: `npx jest` (ownership rules: `src/services/__tests__/localDataOwnership.test.ts`)
- `node scripts/verify-local-wipe.mjs` — replays `clearAllLocalUserData`'s
  statements against a real SQLite built from the app's own DDL, reading the
  table list out of `operations.ts` so it tests the shipped function rather than
  a copy. `NO_WIPE=1 node scripts/verify-local-wipe.mjs` is its negative mode
  and, like `RT_INJECT`, exits 0 only when the assertions actually failed.
  **Both modes exiting 0 is the green state.** The header lists what it does
  not catch — notably that it never proves anything *calls* the wipe.
- (Run on device via Expo to verify visual changes — visuals can't be confirmed from a typecheck alone.)
