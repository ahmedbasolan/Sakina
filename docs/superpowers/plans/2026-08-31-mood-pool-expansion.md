# Mood Pool Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise every mood pool to a floor of 40 reachable angles — **+124 angles** — so the weakest pool stops serving the same five cards.

**Architecture:** Content authoring driven by a checked-in `ledger.json`, one unit per loop tick. Tasks 1–3 build the machinery (ledger-aware verifier passes, ledger generation, a structural-edit tick script); Task 4 authors one mood end to end as the proving batch; Task 5 repeats that loop for the remaining moods; Task 6 is acceptance. The ledger exists because a tick re-enters with no guarantee of the previous tick's context — without durable state, tick 4 re-authors tick 2's work or skips it.

**Tech Stack:** TypeScript data (`src/data/quranData.ts`), Node ESM verifier scripts, `node:sqlite`, Jest, `curl` for citation fetches.

**Spec:** [`docs/superpowers/specs/2026-08-31-mood-pools-and-stories-design.md`](../specs/2026-08-31-mood-pools-and-stories-design.md) — §2, §4, §5. Read it alongside this plan.

**Prerequisite:** Plan A (`2026-08-31-stories-infrastructure.md`) complete through Task 9, and `docs/superpowers/plans/2026-08-31-mood-pools/baseline.json` recorded. Both are done as of commit `dc039c1`.

## Global Constraints

- **Never write a hadith number, an ayah, or a translation from memory.** This binds this plan's prose exactly as hard as it binds `quranData.ts`. A number you have not fetched is not a weaker citation — it is not a citation.
- **Quran:** fetch raw JSON from `https://api.alquran.cloud/v1/ayah/{s}:{a}/editions/quran-uthmani,en.sahih` and read it yourself. Never `WebFetch` — it summarises through a small model observed to truncate and misnumber.
- **Hadith:** `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/{eng|ara}-{coll}/{n}.json` for bukhari, tirmidhi, abudawud, ibnmajah, nasai. **Never for Sahih Muslim — that mirror renumbers it.** sunnah.com for everything else, via `curl -sL -A '<browser UA>'`; a default curl UA gets a Cloudflare 403 and Node `fetch` is blocked even with a browser UA because the block fingerprints the TLS stack. On sunnah.com the English lives in **unquoted** `<div class=hadith_narrated>` and `<div class=text_details>`; the Arabic is the quoted `<div class="arabic_hadith_full arabic">`.
- **Print full text. Never `head -c`.** Abu Dawud 1521's isnad runs ~430 characters before the matn.
- **Any field matcher must accept both quote styles.** Sources with an apostrophe in the surah name are double-quoted (`"Surah Al-A'raf 7:199"`), and long prose is written as `'a' + 'b'` concatenation. A single-quote, single-literal matcher silently under-reads 31 sources and every long body.
- **Scripted edits:** a file, never `node -e`; located structurally by id; **exactly one match asserted per edit**; nothing written if any edit fails; CRLF preserved; `id` quoted with `'` (a `JSON.stringify`-emitted `id: "…"` is invisible to `verify-journey.mjs`'s `objectAt`); `prettier --write` never run on `quranData.ts`.
- **Angle shape, copied from the corpus:** exactly **3** `practiceSteps` — one `physical`, one `verbal`, one `mindset`. `angle`, `angleSource`, `action`, `reflection` present. **No `actionSource`, no `actionArabicText`** — 0/245 existing mood angles use them. `sourceGrading` lowercase.
- **Angle voice:** second person, present tense, direct address; anchored in a Divine Name or a promise verse. **No `[Tafsir …]` tag** — that is the journey convention. Do not narrate the reader's day back to them: the mood was declared one screen earlier, so any claim about their recent behaviour lands on the person most likely to contradict it.
- **Angle id suffix must map to the mood** in `verify-mood-pools.mjs`'s `SUFFIX_MOOD`: `calm→Calm`, `sad→Sad`, `angry→Angry`, `tired→Tired`, `lonely→Lonely`, `grateful→Grateful`, `hopeful→Hopeful`, `guilty→Guilty`, `anxious`/`stressed`→`Overwhelmed`. So a new Calm angle on 2:255 is `q_angle_2_255_calm`.
- **`SEED_VERSION` bumps once per mood batch**, not per tick. Currently 39.
- **After any verse-text change:** run `node scripts/refresh-quran-canonical.mjs`, **read its diff**, then `npx jest quranArabicIntegrity`. Regenerating reflexively is how a corruption gets laundered into the baseline.

---

### Task 1: Ledger-aware verifier passes

**Files:**
- Modify: `scripts/verify-mood-pools.mjs` (add two passes)
- Create: `scripts/__fixtures__/ledger.sample.json`
- Test: run modes directly; the script is its own harness

**Interfaces:**
- Consumes: `docs/superpowers/plans/2026-08-31-mood-pools/baseline.json` (from Plan A, commit `dc039c1`).
- Produces: two new fatal passes, plus `MOOD_LEDGER` env to point at a ledger. Tasks 4 and 5 run this every tick.

- [ ] **Step 1: Add the monotonicity pass**

Insert after the existing per-mood reporting loop in `scripts/verify-mood-pools.mjs`:

```js
// ── monotonicity ──────────────────────────────────────────────────────────
// A tick may fail to ADD to a pool; it must never leave one smaller. This is
// the check with teeth during the expansion, because MIN_POOL stays at 10 and
// TARGET_POOL is only a readout — without this, a tick that deleted an angle
// would be reported green.
const BASELINE = 'docs/superpowers/plans/2026-08-31-mood-pools/baseline.json';
if (fs.existsSync(BASELINE)) {
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8')).pools || {};
  for (const m of MOODS) {
    if (base[m] === undefined) continue;
    if (pool[m] < base[m]) {
      errors.push(`${m} pool fell to ${pool[m]}, below its recorded baseline of ${base[m]}`);
    }
  }
} else {
  console.log(`\n  ! no baseline at ${BASELINE} — monotonicity not checked`);
}
```

The `else` branch prints rather than passing silently. A missing baseline means the check did not run, and that must be visible.

- [ ] **Step 2: Add the voice pass, scoped to ledger ids**

```js
// ── voice (ledger-scoped) ─────────────────────────────────────────────────
// New angles follow the For Your Heart rule: direct address, no [Tafsir ...]
// tag. Applied ONLY to ids this project created — the 161 legacy tafsir-voice
// angles are exempt per CLAUDE.md, and failing them would make the gate
// permanently red.
//
// WHAT THIS DOES NOT CATCH: copy that is second-person and tag-free but still
// narrates the reader's day back to them ("you walked past two of these
// today"). That is the failure that required a same-day correction to four of
// the 31 rewritten angles, and it is a human read.
const LEDGER = process.env.MOOD_LEDGER
  || 'docs/superpowers/plans/2026-08-31-mood-pools/ledger.json';
if (fs.existsSync(LEDGER)) {
  const rows = JSON.parse(fs.readFileSync(LEDGER, 'utf8')).units || [];
  const owned = new Set(rows.map((r) => r.angleId));
  const OPENERS = /^(You|Your|When you|If you|Whatever you|Notice|Look|Read|Ask|Name|Pick|Take|Let|There|Nothing|No one|He |She |It )/;
  for (const a of angles) {
    if (!owned.has(a.id)) continue;
    const text = (field(a.body, 'angle') || '').trim();
    if (!text) continue;
    if (/\[Tafsir /.test(text)) {
      errors.push(`${a.id}: new angle carries a [Tafsir ...] tag — that is the journey convention`);
    }
    if (!OPENERS.test(text)) {
      errors.push(`${a.id}: new angle does not open in direct address — "${text.slice(0, 48)}..."`);
    }
  }
}
```

If `verify-mood-pools.mjs`'s existing `field` helper is single-quote-only, fix it to accept both quote characters and to follow `+` concatenation before using it here — see Global Constraints. Check with:

```bash
grep -n "function field" -A 12 scripts/verify-mood-pools.mjs
```

- [ ] **Step 3: Prove both passes fail before trusting them**

A check that has only ever printed "passed" is untested. Create `scripts/__fixtures__/ledger.sample.json` naming one **existing legacy** angle, which is tafsir-voiced and must therefore fail the voice pass:

```json
{ "units": [{ "angleId": "q_angle_93_4_anxious" }] }
```

Run: `MOOD_LEDGER=scripts/__fixtures__/ledger.sample.json node scripts/verify-mood-pools.mjs; echo "exit=$?"`
Expected: **exit=1**, reporting that `q_angle_93_4_anxious` carries a `[Tafsir …]` tag and/or does not open in direct address. That angle begins "The scholars note that this verse was revealed…", so both fire.

Then run without the env var: `node scripts/verify-mood-pools.mjs; echo "exit=$?"`
Expected: **exit=0** — no `ledger.json` exists yet, so the voice pass is inert, and the baseline pass passes.

Both results are required. The first proves the pass can fail; the second proves it does not fire on legacy content.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-mood-pools.mjs scripts/__fixtures__/ledger.sample.json
git commit -m "test(content): add monotonicity and ledger-scoped voice passes"
```

---

### Task 2: Generate the ledger

**Files:**
- Create: `scripts/seed-ledger.mjs`
- Create: `docs/superpowers/plans/2026-08-31-mood-pools/ledger.json` (generated)

**Interfaces:**
- Consumes: `src/data/quranData.ts`, `baseline.json`.
- Produces: `ledger.json` with one row per unit of work. Tasks 3, 4 and 5 read and write it.

Row shape:

```
{ angleId, contentId|null, mood, tier: "T1"|"T2"|"T3", status, blockedReason, citations: [] }
status: "pending" | "drafted" | "verified" | "committed" | "blocked"
```

- [ ] **Step 1: Write the generator**

It must **derive** the T1 candidate lists rather than embed them, so the ledger cannot disagree with the corpus. Key requirements, each of which corresponds to a mistake already made once:

1. Quote-agnostic, concatenation-following field reader (copy the one in `scripts/verify-stories.mjs`, which is correct).
2. Duplicate exclusion by **identical `source` string**, skipping entries whose source could not be read — a null source must never compare equal to another null. The correct answer is exactly four excluded ids: `quran_2_45_salah_dup`, `quran_22_77_salah_dup`, `quran_65_3_rizq`, `quran_2_155_156`.
3. Journey angles excluded by `JOURNEY_ANGLE_PREFIXES`.
4. New angle ids as `q_angle_<surah>_<ayah>_<suffix>` using the `SUFFIX_MOOD` mapping, asserted **not** to collide with an existing id — `quran_8_2` and `quran_20_132` already collided once when a journey added ids that existed.

- [ ] **Step 2: Run it and check the totals against the spec**

Run: `node scripts/seed-ledger.mjs`
Expected, matching spec §2.3 exactly — the generator should print this table and **exit 1 if the total is not 124**:

```
mood          pool  need  T1avail  T1used  T2  T3
Calm            16    24       13      13   4   7
Sad             20    20        3       3   7  10
Lonely          22    18        1       1   7  10
Hopeful         24    16       21      16   0   0
Tired           24    16        2       2   6   8
Angry           25    15        0       0   6   9
Guilty          30    10        0       0   4   6
Grateful        35     5        5       5   0   0
Overwhelmed     49     0        8       0   0   0
TOTAL                124               40  34  50
```

If the totals differ, the corpus changed and the spec's allocation is stale — stop and reconcile rather than proceeding on generated numbers that contradict the design.

- [ ] **Step 3: Confirm the voice pass is now live but not yet firing**

Run: `node scripts/verify-mood-pools.mjs; echo "exit=$?"`
Expected: **exit=0**. `ledger.json` now exists and the voice pass reads it, but every row is `pending` with no angle yet written, so nothing matches.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-ledger.mjs docs/superpowers/plans/2026-08-31-mood-pools/ledger.json
git commit -m "feat(content): generate the mood-pool expansion ledger"
```

---

### Task 3: The tick script

**Files:**
- Create: `scripts/author-angle.mjs`

**Interfaces:**
- Consumes: `ledger.json`, and a JSON angle payload on stdin or at a path.
- Produces: one angle inserted into `quranData.ts` and its ledger row advanced. Generalises `scripts/add-pilot-story.mjs`, which is the proven template.

- [ ] **Step 1: Write it**

Requirements, all inherited from `add-pilot-story.mjs` and the constraints above:

1. Refuse to run if `quranData.ts` has lost CRLF, before and after the edit.
2. Locate the insertion point structurally — the `quranContentAngles` array — and assert the new `id` does **not** already exist (exactly zero matches) while its `contentId` exists exactly once.
3. Emit `id:` with single quotes. Use `JSON.stringify` only for prose values, and re-quote to double quotes when the prose contains an apostrophe rather than escaping into a single-quoted literal — `'Jami' at-Tirmidhi'` terminates the string and breaks the build.
4. Write nothing unless every assertion passes.
5. On success, set the ledger row to `drafted` and record the citations fetched.

- [ ] **Step 2: Negative-test it**

Run it against a payload whose `contentId` does not exist, and one whose `id` already exists (`q_angle_93_4_anxious`).
Expected: **exit 1** both times, `quranData.ts` unchanged (`git diff --quiet src/data/quranData.ts` returns 0).

A tick script that half-applies is worse than one that refuses, so this negative test is the point of the task.

- [ ] **Step 3: Commit**

```bash
git add scripts/author-angle.mjs
git commit -m "feat(content): add the angle-authoring tick script"
```

---

### Task 4: Calm — the proving batch

Calm is first because it is the weakest pool (16, `topN` of 5) and has the largest need (+24), so it banks the most benefit if the project stops early.

**Files:**
- Modify: `src/data/quranData.ts`, `docs/superpowers/plans/2026-08-31-mood-pools/ledger.json`
- Modify (once, at the end of the batch): `src/database/seedContent.ts` (`SEED_VERSION` 39 → 40)

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: Calm at 40. Establishes the tick rhythm Task 5 repeats.

**Per tick — 4 angles for T1/T2, or 1 verse + 1 angle for T3:**

- [ ] **Step 1: Take the next `pending` rows** from `ledger.json` for this mood, in tier order T1 → T2 → T3.

- [ ] **Step 2: Fetch every citation the unit needs.** Print full text. Cache under `scripts/.cache/` so re-ticks do not re-hit sunnah.com. A 4-angle unit is ~12 citations: roughly 60% Quran, 40% hadith.

- [ ] **Step 3: Read the verse and decide whether it belongs in this mood at all.** T1 rows are verses already *tagged* Calm, which is not the same as verified fit — the tag may predate the current mood list. A verse that does not fit is marked `blocked` with the reason, not written badly. This is the judgement `review-mood-fit.mjs` cannot make.

- [ ] **Step 4: Write the angle** via `scripts/author-angle.mjs`. Direct address, no `[Tafsir …]`, 3 steps (physical/verbal/mindset), no `actionSource`.

- [ ] **Step 5: Run the per-tick gates**

```bash
npx tsc --noEmit -p tsconfig.json && node scripts/verify-mood-pools.mjs && node scripts/verify-journey.mjs && node scripts/verify-stories.mjs
```

For a T3 tick, additionally: `node scripts/refresh-quran-canonical.mjs`, read the diff, then `npx jest quranArabicIntegrity`.

- [ ] **Step 6: Green → commit and mark `committed`. Not green → revert every file the tick touched**, mark the row `blocked` with the reason, and move on. One bad ayah must not stall the other 120.

```bash
git add src/data/quranData.ts docs/superpowers/plans/2026-08-31-mood-pools/ledger.json
git commit -m "feat(content): add N Calm angles (T1 batch)"
```

**At the end of the Calm batch:**

- [ ] **Step 7: Batch gates**

```bash
node scripts/verify-citations.mjs
node scripts/verify-journey-roundtrip.mjs && RT_INJECT=1 node scripts/verify-journey-roundtrip.mjs
node scripts/review-mood-fit.mjs
```

`review-mood-fit.mjs` is a **review, not a gate** — it exits 0 and prints candidates. Read its output for the Calm rows and act on it. It is the only check aimed at "the right verse for the right mood".

- [ ] **Step 8: Bump `SEED_VERSION` to 40**, with a comment naming what the batch added, and confirm Calm reached 40:

Run: `node scripts/verify-mood-pools.mjs`
Expected: `Calm 40` with no `(N to target)` annotation.

- [ ] **Step 9: Commit the batch close**

```bash
git add src/database/seedContent.ts
git commit -m "feat(content): Calm pool 16 -> 40"
```

---

### Task 5: The remaining seven moods

Identical rhythm to Task 4, in this order — weakest first, so each completed mood raises the floor immediately:

`Sad (+20) → Lonely (+18) → Hopeful (+16) → Tired (+16) → Angry (+15) → Guilty (+10) → Grateful (+5)`

- [ ] **Step 1–9 per mood:** repeat Task 4's steps exactly, substituting the mood and its tier counts from the ledger. `SEED_VERSION` increments once per mood: Sad 41, Lonely 42, Hopeful 43, Tired 44, Angry 45, Guilty 46, Grateful 47.

- [ ] **Step 2: Note the two moods with no T1 at all.** Angry (+15) and Guilty (+10) are entirely T2 and T3 — every angle needs either a mood-fit judgement on an existing verse or a new ayah fetched and locked. Budget them as the expensive moods; they are not "small because the number is small".

- [ ] **Step 3: Hopeful is entirely T1** (16 of its 21 candidates). It is the cheapest mood in the project — no new Arabic, no re-tagging. If time is short, it is the best value remaining.

---

### Task 6: Acceptance

**Files:**
- Modify: `docs/superpowers/plans/2026-08-31-mood-pools/baseline.json` (re-record at the new floor)

- [ ] **Step 1: The acceptance test must now pass**

Run: `MOOD_FLOOR=40 node scripts/verify-mood-pools.mjs; echo "exit=$?"`
Expected: **exit=0**, spread `40–49 (1.2x)`. This command exits 1 today with eight moods listed; that flip is the definition of done.

- [ ] **Step 2: Full gate set**

```bash
npx tsc --noEmit -p tsconfig.json
npx jest
node scripts/verify-citations.mjs
node scripts/verify-stories.mjs && STORY_INJECT=1 node scripts/verify-stories.mjs
node scripts/verify-render-hazards.mjs && RH_INJECT=1 node scripts/verify-render-hazards.mjs
npx jest quranArabicIntegrity
```

- [ ] **Step 3: Confirm no ledger row is left `blocked` without a decision.** Every blocked row is either resolved or explicitly accepted as out of scope, with the reason recorded. A blocked row silently left behind is how a pool ends up at 39.

- [ ] **Step 4: Re-record the baseline at the new floor** so future work cannot regress below 40, and commit.

- [ ] **Step 5: Device check.** Tap into Calm and advance repeatedly; confirm the cards no longer repeat within a few taps, and that new angles read in direct address rather than tafsir voice. Visuals and voice cannot be confirmed from a typecheck.

---

## Done when

- `MOOD_FLOOR=40 node scripts/verify-mood-pools.mjs` exits **0**, spread 40–49.
- No ledger row is `pending`; every `blocked` row has a recorded decision.
- `npx jest` passes; `tsc` clean; `verify-citations`, `verify-stories` (both modes), `verify-render-hazards` (both modes), `quranArabicIntegrity` all green.
- `SEED_VERSION` is 47 and each bump names its batch.
- Calm verified on a device as no longer repeating within a few taps.

## Deliberately not in this plan

- **Rewriting the 161 legacy tafsir-voice angles.** Its own project. Until it runs, a pool contains two voices — the spec records this as the one accepted user-visible compromise.
- **Deduplicating `quran_2_155` / `quran_2_155_156`.** Found while generating this plan's numbers: same ayah range, same `audioKey`, one live angle each, so 2:155-156 can already surface twice in one pool. Real but pre-existing, and folding a data fix into a 124-angle authoring run would hide it. Worth its own small change.
- **`practiceSteps` for the mood flow's render path.** They are authored to corpus convention and for a future mood practice layer; `GuidanceScreen`'s `LAYER_TYPES` never reads them today.
- **Raising Overwhelmed above 49.**
