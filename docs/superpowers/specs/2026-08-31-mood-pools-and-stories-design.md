# Mood Pool Expansion + Stories — Design

**Date:** 2026-08-31
**Status:** Approved design, pending implementation plan

Two sub-projects, sequenced. **P1** raises every mood pool to a floor of 40
reachable angles. **P2** adds an optional per-verse narrative — a story from the
Quran or a hadith — and the render surface for it.

They are specified together because P2's data shape must exist before P1 starts
authoring, or P1's 124 new verses need a backfill pass.

---

## 1. Problem

### 1.1 Measured starting state

`ContentRepository.fetchForMoodLocal` joins on **both** `cm.mood` (the verse's
`moods` array) and `ca.mood` (the angle's own mood), and excludes journey angles
by `JOURNEY_ANGLE_PREFIXES`. The reachable mood-picker pool is therefore:

| Mood | Reachable pool | Inert tags (verse tagged, no angle) |
|---|---|---|
| Overwhelmed | 49 | 10 |
| Grateful | 35 | 6 |
| Guilty | 30 | 0 |
| Angry | 25 | 0 |
| Tired | 24 | 2 |
| Hopeful | 24 | 23 |
| Lonely | 22 | 1 |
| Sad | 20 | 4 |
| **Calm** | **16** | 15 |

Spread 16–49 (3.1×). Corpus totals: 234 `Content` entries, 245 mood angles,
87 journey angles, 729 practice steps on mood angles.

### 1.2 Why the weakest pool is the number that matters

`RotationEngine` selects by weighted random from a top-N candidate slice, and
`rotationScoring.ts` documents the sizing: `topN = max(5, ceil(pool * 0.2))`.
Every `relevanceScore` in the corpus is the seeder's uniform default of 10, so
selection is close to uniform across that slice. A 16-angle pool yields a 5-card
slice — a Calm user cycles the same handful. Averages do not fix this; the floor
does.

### 1.3 Missing narrative slot

CLAUDE.md's "For Your Heart — Content Voice" section requires `angle.angle` to
be second-person direct address, and says a Prophet or companion story belongs
in the narrative slot instead. There is no narrative slot. Measured consequence:
**160 of 245 mood angles carry a `[Tafsir …]` tag** — a convention CLAUDE.md
documents for *journeys* — and roughly 171 are written in tafsir/narrative voice
sitting in the reader-facing For Your Heart card. P2 gives that content a
correct home, which is what makes P1's voice rule holdable.

---

## 2. P1 — Mood pools to a floor of 40

### 2.1 Target

Floor of 40 reachable angles per mood. **+124 angles.** Overwhelmed (49) is
already above the floor and gains nothing. Resulting spread 40–49 (1.2×).

| Mood | Now | Need |
|---|---|---|
| Calm | 16 | +24 |
| Sad | 20 | +20 |
| Lonely | 22 | +18 |
| Hopeful | 24 | +16 |
| Tired | 24 | +16 |
| Angry | 25 | +15 |
| Guilty | 30 | +10 |
| Grateful | 35 | +5 |
| Overwhelmed | 49 | 0 |

### 2.2 Three sources, ranked by risk

**T1 — inert tags.** The verse is already in `quranData.ts`, already carries the
mood tag, and has no angle for it. Write the angle only. No new Arabic, no
canonical refresh, no new verse citation.

**Exclusion:** a content id is not a T1 candidate when its `source` string is
byte-identical to another entry's — it is a duplicate created for a journey, and
attaching a mood angle to the duplicate rather than the original splits one
verse across two ids in the same pool. **Four** qualify:
`quran_2_45_salah_dup` (= `quran_2_45`), `quran_22_77_salah_dup`
(= `quran_22_77`), `quran_65_3_rizq` (= `quran_65_3`), and
`quran_2_155_156` (= `quran_2_155`).

The fourth was found by sweeping for identical `source` strings rather than
for the journey-suffix naming, and it is the one that matters: it carries no
suffix marking it as a duplicate, both entries share `audioKey: '2:155-156'`,
and **both already carry a live angle** — so 2:155-156 can already surface
twice in the same pool under two ids. Deduplicating it is a Plan B cleanup
item, not part of the +124.

Reading `source` for that sweep requires a **quote-agnostic** matcher. Sources
whose surah name contains an apostrophe are double-quoted
(`source: "Surah Al-A'raf 7:199"`), and a `source: '([^']*)'` matcher returns
null for 31 of them — which then all compare equal to each other and get
reported as mutual duplicates, wrongly excluding `quran_23_1`, `quran_6_13`
and `quran_7_31` from Calm's candidates among others. This is the both-quote-
styles trap already recorded under "Editing `quranData.ts` by script".

**This is a `source`-equality rule, not a suffix rule.** Suffixed ids are not
duplicates by default: `quran_94_5_sad` is Ash-Sharh **94:5** while
`quran_94_5` is **94:5-6** — different ayah ranges, both legitimate, and
`quran_94_5_sad` *is* a Sad T1 candidate below. `quran_58_7_lonely` and
`quran_11_90_lonely` have no bare-id counterpart at all.

T1 candidates after that exclusion:

- **Calm (13):** `quran_14_40` `quran_20_130` `quran_22_77` `quran_23_1`
  `quran_25_47` `quran_29_45` `quran_2_255` `quran_2_45` `quran_30_23`
  `quran_4_103` `quran_6_13` `quran_78_9` `quran_7_31`
- **Hopeful (21):** `quran_12_87` `quran_14_37` `quran_14_40` `quran_14_7`
  `quran_17_32` `quran_17_79` `quran_20_131` `quran_23_1` `quran_24_32`
  `quran_25_74` `quran_29_45` `quran_2_168` `quran_2_261`
  `quran_33_21` `quran_49_13` `quran_4_1` `quran_65_7` `quran_67_15`
  `quran_73_1_4` `quran_7_96` `quran_98_5`
- **Grateful (5):** `quran_11_6` `quran_20_130` `quran_22_77` `quran_24_38`
  `quran_7_96`
- **Sad (3):** `quran_94_5_sad` `quran_2_177` `quran_17_70`
- **Tired (2):** `quran_2_261` `quran_67_15`
- **Lonely (1):** `quran_17_70`
- **Angry (0), Guilty (0)** — T1 gives these moods nothing.

**T2 — re-tag an existing verse to a new mood.** Add the mood to the verse's
`moods` array and write the angle. Still no new Arabic. The only risk is
mood-fit. **Cap: 3 mood tags per verse** — `review-mood-fit.mjs` flags 4+ as a
sign the verse was tagged by theme rather than by what the reader is feeling.

**T3 — new `Content` entry.** A genuinely new ayah: Uthmani Arabic,
transliteration, Sahih International translation smoothed to house voice,
`whyThis`, `moods`. Requires `refresh-quran-canonical.mjs` and the
`quranArabicIntegrity` lock.

### 2.3 Allocation

T1 covers 40 of the 124 (Hopeful's 21 candidates exceed its need of 16; the
5 spare are not authored in this project). The remaining 84 split ~40/60.

These figures are **generated**, not tallied by hand — `scripts/seed-ledger.mjs`
recomputes them from `quranData.ts` and fails if they drift:

| Mood | Need | T1 avail | T1 used | T2 | T3 |
|---|---|---|---|---|---|
| Calm | 24 | 13 | 13 | 4 | 7 |
| Sad | 20 | 3 | 3 | 7 | 10 |
| Lonely | 18 | 1 | 1 | 7 | 10 |
| Hopeful | 16 | 21 | 16 | 0 | 0 |
| Tired | 16 | 2 | 2 | 6 | 8 |
| Angry | 15 | 0 | 0 | 6 | 9 |
| Guilty | 10 | 0 | 0 | 4 | 6 |
| Grateful | 5 | 5 | 5 | 0 | 0 |
| Overwhelmed | 0 | 8 | 0 | 0 | 0 |
| **Total** | **124** | | **40** | **34** | **50** |

So the project adds **50 new `Content` entries** and **124 new angles**.

An earlier revision of this table said 41 / 33 / 50. The single-angle
difference is `quran_2_155_156`, which was counted as a Sad T1 candidate before
it was identified as a duplicate of `quran_2_155`.

### 2.4 Angle shape — copied from the corpus, not invented

Census of the 245 existing mood angles:

- `angle`, `reflection`, `action` — 245/245
- `practiceSteps` — 243/245, **always exactly 3 steps.** Never 4, never 6.
- Step types — one `physical` + one `verbal` + one `mindset`
  (233 / 232 / 264 across 729 steps)
- `sourceType` — `quran_dua` 436 · `prophetic_dhikr` 132 · `prophetic_dua` 85 ·
  `sunnah_action` 50 · `composed_dua` 23
- `sourceGrading` — on 261/729 (`sahih` 160, `hasan` 101), lowercase
- `angleSource` — 226/245
- `actionSource`, `actionArabicText` — **0/245**; mood angles do not use them
- `actionHowTo`, `actionReward` — 25/245

New angles match this exactly: 3 steps, one of each type, no `actionSource`.

**Citation load:** 124 angles × 3 = **372 new steps**, and **every one of them
requires a fetch.** A Quran-sourced step is not free merely because the ayah is
already in the corpus — `verify-citations.mjs` pass 1 fetches every
asserted-Quran step regardless, and a step may cite an ayah that has no
`Content` entry at all.

What the corpus's 60/40 `quran_dua`-to-hadith mix predicts is the *cost* of
those fetches, not their number: expect roughly 40% on the expensive path
(sunnah.com behind Cloudflare, the mirror's Sahih Muslim renumbering, isnads
that defeat truncated reads) and 60% on the cheap, reliable one
(`api.alquran.cloud`). Budget a 4-angle tick at ~12 fetches.

### 2.5 Angle voice — direct address

New angles follow CLAUDE.md's "For Your Heart" rule: second person, present
tense, anchored in a Divine Name or a promise/address verse. **No `[Tafsir …]`
tag** — that tag is the journey convention and `PathStepScreen`, not
`GuidanceScreen`, is the screen it was designed for.

The 161 legacy tafsir-voice angles are **not** rewritten here. CLAUDE.md's spec
of 2026-07-16 exempts existing entries, and a 161-angle rewrite is its own
project. Consequence, stated so it is not a surprise on device: a mood pool will
contain two voices until that project runs.

Do not narrate the reader's day back to them. The mood was declared one screen
earlier, so any claim about their recent behaviour lands on precisely the person
most likely to contradict it. Invite, ask, or name something true.

---

## 3. P2 — Stories

### 3.1 Data model

```ts
// src/types/index.ts — on Content
story?: {
  title: string;
  body: string;
  source: string;   // "Surah Yusuf 12:15-20" | "Sahih al-Bukhari 3339"
  sourceType: 'quran_narrative' | 'hadith_narrative';
  grading?: 'sahih' | 'hasan';   // hadith_narrative only
};
```

**Optional, with no coverage target.** A verse gets a story only when one
genuinely belongs. Absent is the default and renders nothing. Forcing a story
onto every verse produces filler, and filler next to scripture reads worse than
silence.

`sourceType` is a **new union, separate from `PracticeStepData.sourceType`.**
The existing vocabulary (`sunnah_action`, `prophetic_dua`, `quran_dua`,
`prophetic_dhikr`, `composed_dua`) describes what a *practice step* is; none of
them mean "narrative". `grading` is lowercase, matching practice-step
`sourceGrading`; `HadithLayer.tsx:55` title-cases for display, so `'sahih'`
renders "Sahih".

### 3.2 Storage — copy `propheticPractice` exactly

`propheticPractice` is already a JSON-serialised `TEXT` column on `content`,
plumbed end to end, and used **0 times** in `quranData.ts`. It is the proven
pattern. Every site it touches, `story` must touch:

| Site | Change |
|---|---|
| `src/types/index.ts` | the field above |
| `src/database/tables.ts:16` | `story TEXT` — fresh-install DDL |
| `src/database/operations.ts:178` | `story TEXT` — version-refresh recreate DDL |
| `src/database/operations.ts:7` | `CURRENT_DB_VERSION` 11 → 12 |
| `src/database/seedContent.ts:380` | INSERT column list + value row |
| `src/database/seedContent.ts:486` | INSERT column list + value row |
| `src/services/guidanceWindowFetch.ts:162` | INSERT column list + value row |
| `src/services/contentRepository.ts` | row shape, `c.story AS story` alias, guarded `JSON.parse` |
| `src/services/contentRepository.ts` `mapCloudRow` | `row.content.story` |
| `src/services/supabaseDataService.ts:961` | serialise on upload |
| `supabase/migrations/006_content_story.sql` | `ALTER TABLE public.content ADD COLUMN IF NOT EXISTS story JSONB;` |
| `scripts/verify-stories.mjs` | new — owns the story seed/read roundtrip |

`scripts/verify-journey-roundtrip.mjs` is **not** on that list, contrary to an
earlier draft of this spec: it builds only a `content_angles` table
(`verify-journey-roundtrip.mjs:47`) and never touches `content`, so a column
added to `content` cannot affect it. The story seed-and-read roundtrip is
`verify-stories.mjs`'s job instead.

**Two hazards, both load-bearing.**

The two DDLs are currently **byte-identical**. Adding the column to one diverges
fresh installs from refreshed ones, and nothing typechecks that.

The three INSERT sites are **positional** — `batchInsert` takes a
`columnsPerRow` count. A missed site is a silent column-shift corruption, not an
error.

**Blast radius of the version bump:** `CURRENT_DB_VERSION` 11 → 12 drops and
recreates `content_moods`, `content_angles`, `content` on every install. Those
three are seed data; none of `clearAllLocalUserData`'s seven personal tables are
in the drop list, so no user data is touched.

**Migration 006 must be applied to the live Supabase project and verified.**
Migration 004 sat committed but unapplied for a long stretch; a committed `.sql`
is not a live column.

### 3.3 Sourcing standard

A story is admissible only if it is one of exactly two things.

**`quran_narrative`** — cited by ayah range. Every ayah in the range fetched
from `api.alquran.cloud/v1/ayah/{s}:{a}/editions/quran-uthmani,en.sahih` as raw
JSON read directly. Never `WebFetch` — it summarises through a small model
observed to truncate and misnumber. Never from memory.

**`hadith_narrative`** — collection + number. Fetched and printed **in full**.
No `head -c`: Abu Dawud 1521's isnad runs ~430 characters before the matn, so a
300-character probe shows an unrelated-looking hadith and can mark a correct
citation wrong. `cdn.jsdelivr.net/gh/fawazahmed0/hadith-api` for bukhari,
tirmidhi, abudawud, ibnmajah, nasai — **not Sahih Muslim, which it renumbers.**
sunnah.com for everything else, via `curl -sL -A '<browser UA>'`; it refuses a
default curl UA with a Cloudflare 403 and refuses Node `fetch` even with a
browser UA, because the block fingerprints the TLS stack.

When scraping sunnah.com, note it writes class attributes **unquoted**: the
English is in `<div class=hadith_narrated>` and `<div class=text_details>`,
while the Arabic is the quoted one, `<div class="arabic_hadith_full arabic">`.
A scraper matching `class="text_details"` returns an empty English field and
reports nothing wrong — that is how nine hand-rendered Muslim quotations
shipped.

**Two hard exclusions.**

*No ayah quotation inside a story body.* A quoted ayah is verse text and falls
under CLAUDE.md rule 1 — complete ayah, never a clause. Retell in prose and cite
the range; the verse layer already shows the ayah in full, one swipe away. This
deletes the failure class rather than policing it.

*No sirah-only anecdotes.* Ibn Ishaq, Ibn Hisham, Tabari's *Tarikh* are neither
fetchable by the tooling nor consistently authentic. Israiliyyat is banned
outright — no names, numbers, or details the Quran withholds. Unsourceable
stories are **dropped, not softened.**

### 3.4 Render surface

`GuidanceScreen` addresses layers by hardcoded index in two places —
`:200` (`if (currentLayer !== 1)`, clearing the reflection-focus ref) and
`:398` (`currentLayer === 1 && hasContext`). The comment on the first says a
stuck focus ref "silently kill[s] swipe-to-next-verse." Inserting a layer at
index 1 reintroduces that bug.

**Design:** `LAYER_TYPES = ['verse', 'context', 'story']`, story **appended**
and gated on `content.story`, so both existing indices stay correct. Both
hardcoded `1`s are nonetheless replaced with `LAYER_TYPES.indexOf('context')` —
a hardcoded index beside a now-variable array is the next person's bug.
`LayerPager` labels gain `'Story'`. With no story, `LAYER_TYPES` is
`['verse','context']`, byte-identical to today.

New `StoryLayer.tsx`, mirroring `VerseLayer` / `HadithLayer`. Its skip-the-intro
tap must follow all three parts of CLAUDE.md's rule — hold the
`CompositeAnimation` in a ref and stop it before writing, guard the completion
callback on `finished`, and **gate the styles on the completion flag**
(`revealComplete ? 1 : anim`) so the settled render contains plain numbers and
no Animated node. The third part is the load-bearing one; the first two shipped
and were not sufficient.

Body wraps freely. No `numberOfLines` clamp without an expand affordance, and no
fixed height with `overflow: 'hidden'` unless the height is budgeted for the
longest real entry.

---

## 4. Execution — phases and the tick contract

### 4.1 Phases

**Phase 0 — plumbing. One session, no loop.** Everything in §3.2 and §3.4, plus
`verify-stories.mjs`. Ends with one pilot verse, one pilot angle, and one pilot
story proving the path renders through `verify-journey-roundtrip.mjs`. Content
authoring cannot start before this: an angle written against a missing column
cannot be tested.

**Phase 1 — angles, weakest pool first.** Every completed mood raises the floor
immediately, so stopping halfway still banks the benefit:

`Calm → Sad → Lonely → Hopeful → Tired → Angry → Guilty → Grateful`

Within a mood: **T1 → T2 → T3.**

**Phase 2 — stories, opportunistic.** Only verses that genuinely carry one.

### 4.2 The ledger

State lives in `docs/superpowers/plans/2026-08-31-mood-pools-and-stories/ledger.json`,
not in conversation context. A loop tick re-enters with the same prompt and no
guarantee of the previous tick's context; without a durable ledger, tick 4
re-authors tick 2's work or skips it.

One row per unit, keyed by angle id (or verse id for T3 / story units):

```
phase · mood · tier (T1|T2|T3|story) · targetId · status · citationsFetched · blockedReason
status: pending → drafted → verified → committed | blocked
```

### 4.3 One tick

1. Read the ledger; take the next `pending` unit. A unit is tier-dependent:
   **T1 or T2** — 4 angles. **T3** — 1 new `Content` entry plus its 1 angle.
   **story** — 1 story. A unit is never split across ticks.
2. Fetch every citation the unit needs. Print full text. Cache under
   `scripts/.cache/` so re-ticks do not re-hit sunnah.com.
3. Write via a scripted edit, per CLAUDE.md "Editing `quranData.ts` by script":
   the script goes in a **file**, never `node -e`; edits are located
   **structurally** by `(angleId, stepTitle)`, never by matching the source
   string; **exactly one match asserted per edit**; nothing is written if any
   edit fails; CRLF preserved; `id` single-quoted; `prettier --write` never run
   on this file.
4. Run the per-tick gates (§5).
5. Green → commit, mark `committed`. Not green → revert **every file the tick
   touched**, not just `quranData.ts` (a tick that also bumped `SEED_VERSION`
   leaves a version claiming content that was rolled back), mark `blocked` with
   the reason, and **move on.** One bad ayah must not stall 120 good ones.
6. Schedule the next tick.

`SEED_VERSION` bumps **once per mood batch**, not per tick — otherwise 124
bumps. Starts at 39 (current is 38).

---

## 5. Verification

### 5.1 Per tick

```bash
npx tsc --noEmit -p tsconfig.json
node scripts/verify-mood-pools.mjs
node scripts/verify-journey.mjs
node scripts/verify-stories.mjs
```

Only when verse text was touched: run `node scripts/refresh-quran-canonical.mjs`
**first**, read its diff, then `npx jest quranArabicIntegrity`. Regenerating the
baseline reflexively is how a corruption gets laundered into it.

### 5.2 Per batch

`node scripts/verify-citations.mjs` (six passes, needs network and `curl`) ·
`node scripts/verify-journey-roundtrip.mjs` and `RT_INJECT=1` · and
`node scripts/review-mood-fit.mjs`, which is a **review, not a gate** — it exits
0 and prints candidates for a human to judge. It is the actual check on "the
right verse for the right mood."

### 5.3 Per project

Full `npx jest` · `node scripts/verify-render-hazards.mjs` and `RH_INJECT=1` ·
device run on the Expo dev client. Visuals cannot be confirmed from a typecheck.

### 5.4 Tooling changes

**`verify-mood-pools.mjs`.** `MIN_POOL` **stays 10.** It is fatal — line 185
pushes below-floor moods into `errors` and the script `process.exit(1)`s — so
raising it to 40 would make the script red for all eight under-floor moods from
the first tick. Under §4.3 step 5 that means **every tick reverts its own work**
and the project can never complete. The gate that is supposed to prove progress
would be the thing preventing it.

Three separate mechanisms instead:

- `MIN_POOL = 10` — unchanged, fatal. Catches a regression that guts a pool.
- `TARGET_POOL = 40` — reported and flagged, **never fatal**. Progress readout.
- **Monotonicity, fatal, per tick** — no pool may be *lower* than the baseline
  the ledger recorded for it. This is the check with teeth during the run: a
  tick may fail to add, but must never subtract.

The 40 floor becomes fatal only as the end-of-project acceptance test, behind an
env override: `MOOD_FLOOR=40 node scripts/verify-mood-pools.mjs`.

**New voice pass**, scoped to ledger-known ids only: a new angle must contain no
`[Tafsir …]` tag and must open in second person. The 161 legacy angles stay
exempt, as CLAUDE.md requires.

**New `scripts/verify-stories.mjs`**, built to the house pattern: negative mode
`STORY_INJECT=1`, where **both modes exiting 0 is the green state**. It must be
shown to fail on a deliberately broken story before its passing run is trusted.

### 5.5 What none of this catches

Stated here and repeated in each script header, because whoever reads a green
run next reads it as "the content is correct":

- **Mood fit.** No script can decide that a verse belongs in a mood.
  `review-mood-fit.mjs` prints candidates; a human decides.
- **Story faithfulness.** The checkers prove a citation resolves and that quoted
  sentences are verbatim. They cannot prove a retelling is faithful to its
  source, or that it asserts no detail the source never had.
- **Voice quality.** The voice pass detects a `[Tafsir …]` tag and a
  second-person opening. It cannot detect copy that narrates the reader's day
  back to them, which is the failure that required a same-day correction to four
  of the 31 rewritten angles.

---

## 6. Out of scope

- Rewriting the 161 legacy tafsir-voice angles. Its own project.
- `practiceSteps` for the mood flow's render path. CLAUDE.md confirms
  `GuidanceScreen`'s `LAYER_TYPES` never reads them; they are authored to match
  corpus convention and for a future mood practice layer, not because a screen
  shows them today.
- Journey angles and journey content. Untouched.
- Raising Overwhelmed above 49.

## 7. Open items for the plan

- Exact verse choices for the 50 T3 entries and 33 T2 re-tags. These are content
  decisions made per tick against the mood's actual need, not pre-listed here —
  pre-listing 83 ayah references without fetching them is the failure CLAUDE.md
  names directly: a number you have not fetched is not a citation.
- Which verses receive a story. Opportunistic by definition.
