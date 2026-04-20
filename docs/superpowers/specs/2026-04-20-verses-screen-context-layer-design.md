# Verses Screen: Tafsir, Hadith & Story Context with Audio Integrity

**Status:** Approved — ready for implementation planning
**Date:** 2026-04-20
**Scope:** Post-mood verse experience — enrich with tafsir + prophetic context + stories, fix audio/translation drift, polish layer layout.

## Motivation

After a user selects a mood, they land on the verse screen. Today that screen shows a Quran verse with Arabic, translation, transliteration, and audio — nothing else. The user has asked for three things:

1. **Context.** The user should understand the verse — what it means (tafsir) and what the Prophet ﷺ said or did around it (sunnah). When a mood-relevant story of a prophet or companion adds meaning, that should appear too.
2. **Proof of authenticity.** Every piece of text — verse, translation, tafsir, hadith, story citation — must link to quran.com or sunnah.com with the exact reference. Users can verify any claim in one tap.
3. **Audio that matches the text.** Currently the audio sometimes plays a different verse than the one shown, due to both range-parsing bugs and data drift between `audioKey` and the hand-edited Arabic text.

The guiding constraints the user set:
- **Local-first, privacy-first.** No runtime API calls in the verse flow. APIs are used for citation links and for an offline content-authoring / audit pipeline.
- **Only when relevant.** A practical action (dua, sunnah practice) appears only when it genuinely fits the mood. Repetitive filler is worse than nothing.
- **Youth audience.** Tafsir language should be accessible, not academic — hence Tafsir As-Sa'di over classical tafsirs.

## Non-goals

- No runtime fetching of tafsir / hadith / translation. Content ships bundled.
- No wholesale redesign of the verse screen visual. `ImmersiveBackground` + `VerseLayer` are kept; we add layers around them.
- No refactor of unrelated content flows (paths, saved, home).
- No rewrite of [ContextLayer.tsx](../../../src/components/ContextLayer.tsx)'s visual style — we replace its parsing, not its look.

## Architecture summary

The main branch already implements a **swipe-up layer model** via [LayerContainer.tsx](../../../src/components/LayerContainer.tsx). Four layer components exist: `VerseLayer`, `ContextLayer`, `PracticeLayer`, `ReflectionLayer`. Only `VerseLayer` is currently wired into [GuidanceScreen.tsx](../../../src/screens/GuidanceScreen.tsx) (`totalLayers = 1`). This design wires in the remaining layers, backed by typed content blocks.

The shape of the user's journey becomes:

```
  ┌──────────┐  swipe ↑  ┌───────────┐  swipe ↑  ┌────────────┐  swipe ↑  ┌─────────────┐
  │  Verse   │ ────────▶ │  Context  │ ────────▶ │  Practice  │ ────────▶ │  Reflection │
  └──────────┘           │ (tafsir + │           │ (dua /     │           └─────────────┘
                         │  hadith + │           │  dhikr /   │
                         │  story)   │           │  action)   │
                         └───────────┘           └────────────┘
```

Layers 2–4 are **opt-in per angle**. If an angle has no `contextBlocks`, the Context layer is not part of the journey for that verse. Same for Practice and Reflection. No empty screens, no filler.

## Section 1 — Data model changes

### New types (`src/types/index.ts`)

```ts
export type SourceCitation = {
  label: string;                              // "Tafsir As-Sa'di" | "Sahih al-Bukhari 6363" | "Surah Yunus 21:87"
  url: string;                                // canonical quran.com or sunnah.com URL
  grading?: HadithGrading;                    // present on hadith citations only
};

export type ContextBlock =
  | { kind: 'tafsir'; text: string; source: SourceCitation }
  | { kind: 'hadith'; text: string; arabicText?: string; transliteration?: string; source: SourceCitation }
  | { kind: 'story';  text: string; citations: SourceCitation[] };
```

### Modifications to existing types

**`Content`:**
- `audioKey?: string` — tightened contract. Must match `^\d+:\d+(-\d+)?$` when present. Absent means non-Quranic content → audio button not rendered.
- All other fields unchanged.

**`ContentAngle`:**
- Add `contextBlocks?: ContextBlock[]`.
- Mark `angle`, `angleSource`, `angleArabicText`, `angleTransliteration`, `whyThisWorks` as deprecated in a JSDoc comment. They remain readable for unmigrated data, but new content uses `contextBlocks`.
- `practiceSteps`, `action*` fields are kept as-is — [PracticeLayer.tsx](../../../src/components/PracticeLayer.tsx) already consumes them cleanly.
- `reflection?` (prompt) is kept — [ReflectionLayer.tsx](../../../src/components/ReflectionLayer.tsx) consumes it.

### Source URL helpers (`src/services/sourceLinks.ts` — new)

Small pure-function module building canonical URLs:

```ts
export const TAFSIR_IDS = {
  AS_SADI: /* verified during implementation via GET api.quran.com/api/v4/resources/tafsirs */ 0,
};

export function quranVerseUrl(verseKey: string): string            // → https://quran.com/{chapter}/{verse}
export function quranTafsirUrl(verseKey: string, tafsirId: number) // → https://quran.com/{chapter}/{verse}/tafsirs/{id}
export function sunnahUrl(collection: string, number: string)      // → https://sunnah.com/{collection}:{hadithNumber}
```

`TAFSIR_IDS.AS_SADI` is populated during implementation by hitting the quran.com tafsirs endpoint and confirming the current numeric resource ID — the spec does not bake in a magic number. Used by content authors when writing `contextBlocks` so every citation points to the right canonical URL, and by `SourceChip` for tap-through.

## Section 2 — Layer wiring (`GuidanceScreen`)

### Layer config builder

New helper in [GuidanceScreen.tsx](../../../src/screens/GuidanceScreen.tsx) (or extracted to `src/hooks/useLayerConfig.ts` if it grows):

```ts
type LayerKind = 'verse' | 'context' | 'practice' | 'reflection';

function buildLayerConfig(experience: GuidanceExperience): LayerKind[] {
  const layers: LayerKind[] = ['verse'];
  if (experience.angle.contextBlocks?.length) layers.push('context');
  if (parsePracticeSteps(experience.angle.practiceSteps).length > 0) layers.push('practice');
  if (experience.angle.reflection) layers.push('reflection');
  return layers;
}

// parsePracticeSteps: safe JSON parser for the existing `ContentAngle.practiceSteps: string`
// field (already a JSON-serialized array consumed by PracticeLayer today). Returns [] on
// null/undefined/invalid JSON so the config builder degrades gracefully.
function parsePracticeSteps(raw: string | undefined): PracticeStepData[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as PracticeStepData[]; } catch { return []; }
}
```

`totalLayers` becomes `layers.length`. `currentLayer` is an index into `layers`. The existing swipe-gesture handler in `LayerContainer` drives navigation unchanged. When `currentLayer >= totalLayers`, `onNext()` triggers next verse (as today).

### Rendering

Replace the current `{currentLayer === 0 && <VerseLayer ... />}` block with a dispatch:

```tsx
{layers[currentLayer] === 'verse' && <VerseLayer .../>}
{layers[currentLayer] === 'context' && <ContextLayer blocks={experience.angle.contextBlocks!} scrollY={scrollY} />}
{layers[currentLayer] === 'practice' && <PracticeLayer steps={parsedSteps} onCheckAll={...} scrollY={scrollY} />}
{layers[currentLayer] === 'reflection' && <ReflectionLayer prompt={experience.angle.reflection!} onComplete={...} scrollY={scrollY} />}
```

### Swipe hint adapts to next layer

In `VerseLayer` (and later in other layers), the "Explore" hint becomes the name of the next layer. Small helper:

```ts
// The label is the NAME of the layer you'll land on by swiping up from the current one.
// Computed as NEXT_LAYER_LABEL[layers[currentLayer + 1]] — so only defined for layers
// that have a successor. Reflection is always the last layer (dismissed by its own
// "Complete Session" button, not by swipe), so it has no next-layer label.
const NEXT_LAYER_LABEL: Record<Exclude<LayerKind, 'reflection'>, string> = {
  verse: 'Tafsir',     // shown on Verse when Context is next in `layers`
  context: 'Practice', // shown on Context when Practice is next
  practice: 'Reflect', // shown on Practice when Reflection is next
};
```

Passed from `GuidanceScreen` into the layer as `nextLayerLabel?: string` (undefined on the final layer). Layer shows "↑ {label}" in its swipe hint when defined, hides the hint otherwise. Small change; big affordance win.

## Section 3 — ContextLayer refactor

[ContextLayer.tsx](../../../src/components/ContextLayer.tsx) currently accepts a raw `text: string` and parses it with brittle regex helpers:

- `splitIntoSections` — hunts for phrases like "The Prophet ﷺ said:" to bisect text into "Understand" / "Why It Matters"
- `extractPropheticQuote` — regex-extracts a prophetic quote for callout rendering
- `extractSourceLabel` — regex-sniffs `[Tafsir ...]` tags
- `cleanText` — strips bracketed metadata

All four are **deleted**. Parsing is replaced by typed data.

### New signature

```tsx
interface ContextLayerProps {
  blocks: ContextBlock[];
  scrollY?: Animated.Value;
}
```

### Rendering

Map over `blocks`, dispatching on `kind`:

- **`tafsir`** — icon `book-open-variant`, label "TAFSIR · AS-SA'DI", body text in `textCard`, `SourceChip` at the bottom linking to `quran.com/{verseKey}/tafsirs/170`.
- **`hadith`** — reuse existing prophetic `quoteCard` visual. Arabic (if provided) rendered via `ArabicText`, transliteration below, English below that. Source chip with grading badge ("Sahih · al-Bukhari 6363 ↗").
- **`story`** — label "STORY", narrative text in `textCard`, a row of multiple source chips at the bottom (one per citation — since a story weaves multiple verses + hadiths).

Existing visual constants (section header pattern, `textCard`, `quoteCard`, `sourceBadge`) are preserved. Staggered fade-in animation is preserved (extended to N blocks instead of hardcoded 2 sections).

### New component (`src/components/SourceChip.tsx`)

```tsx
interface SourceChipProps {
  citation: SourceCitation;
  onPress?: () => void;   // defaults to Linking.openURL(citation.url)
}
```

Small pill-style button with external-link icon. Tap → opens URL via `expo-linking` (or `Linking.openURL`). Announces itself as a link for accessibility. Used anywhere a source is cited (ContextLayer blocks, PracticeLayer step sources, potentially VerseLayer for verse → quran.com).

## Section 4 — Translation & audio integrity

### 4a. Drop `formatTranslation`

[VerseLayer.tsx:219–240](../../../src/components/VerseLayer.tsx:219) post-processes translation text with a chain of regex replacements. It strips parentheticals and guesses punctuation. The result in the user's screenshot: "And among His Signs that He created for you from yourselves mates that you may find tranquility in them and He placed between you love and mercy Indeed in that surely Signs for a people who reflect" — missing commas, periods, dropped brackets.

**Action:** delete `formatTranslation`. The translation in `Content.englishTranslation` / `Content.translation` must be stored clean. VerseLayer renders as-is.

### 4b. Canonical audit script (`scripts/auditQuranContent.ts`)

Run by a developer (not at runtime). For each `Content` entry with an `audioKey`:

1. Parse `audioKey` into `{ chapter, startVerse, endVerse }` (range-aware).
2. Fetch `text_uthmani` + Sahih International (translation id 131) from `https://api.quran.com/api/v4/verses/by_key/{key}` for each verse in the range; concatenate with an ayah-number marker between verses.
3. Diff against local `Content.arabicText`, `Content.englishTranslation`, `Content.transliteration`.
4. Emit a report + optionally `--fix` to rewrite [quranData.ts](../../../src/data/quranData.ts) entries in place.

The script also produces `src/data/canonical/quranCanonical.json` — a snapshot keyed by `audioKey` — that acts as the invariant for tests.

### 4c. CI integrity test (`src/__tests__/quranContent.integrity.test.ts`)

Jest test that:
- Imports every `Content` from [quranData.ts](../../../src/data/quranData.ts)
- For each with `audioKey`, looks up the canonical entry in `quranCanonical.json`
- Normalizes diacritics + whitespace, then asserts `arabicText` and `englishTranslation` match
- Fails with a message pointing to `npm run refresh-canonical` if someone hand-edited content

Effect: drift becomes impossible to merge. Local-first runtime is preserved (no runtime API call).

### 4d. Audio key normalization

- Remove the regex extraction in [GuidanceScreen.tsx:188-194](../../../src/screens/GuidanceScreen.tsx:188) (`extractVerseKey(source)`). Use `experience.content.audioKey` directly.
- `AudioPlayerButton` and the `ActionsFAB` audio branch already accept `audioKey?: string`. When absent → button isn't rendered. For non-Quranic content (e.g. a dua from Bukhari), `audioKey` is left `undefined`, so no audio is attempted.
- Range handling in [AudioPlayerButton.tsx:80–101](../../../src/components/AudioPlayerButton.tsx:80) — the resume-after-finish logic is tangled. Cleanup: replace the `currentVerseIndex` + `useEffect` chain with a simpler state machine (playing/paused/finished), advance `currentVerseIndex` only when the current source truly ends. Retain existing behavior; no new feature.

## Section 5 — Layout polish

From the user's screenshot, the bottom rail feels ad-hoc. The `VerseLayer` already has the right pattern (left `ActionsFAB` + center swipe hint + right next arrow); the work is making this rail **consistent across all layers**.

### Changes

- Extract the 3-zone bottom rail into a shared component: `LayerBottomRail` (new, in `src/components/`).
  - Left slot: `ActionsFAB` (save / audio / share — audio slot is conditional on `audioKey` being present).
  - Center slot: swipe hint — shows `↑ {nextLayerLabel}` when a next layer exists, or `↓ Back` / idle otherwise.
  - Right slot: next arrow → advances layer, or on final layer triggers `onNext()` (next verse).
- `VerseLayer`'s current inline footer is replaced by `<LayerBottomRail />`.
- `ContextLayer`, `PracticeLayer`, `ReflectionLayer` each mount a `LayerBottomRail` with layer-appropriate hints.
- [FloatingActionRow.tsx](../../../src/components/FloatingActionRow.tsx) becomes thin — it just forwards to `LayerBottomRail` for layers ≥ 1. Or it gets deleted entirely once `LayerBottomRail` supersedes its responsibility. (Decision during implementation.)

## Section 6 — Content migration

[quranData.ts](../../../src/data/quranData.ts) is 10,681 lines. Two-pass migration:

### Pass A: automated (arabicText, translation, transliteration)

Running `npm run audit-quran -- --fix` will:
1. For every `Content` entry with a valid `audioKey`, fetch canonical data and rewrite `arabicText`, `englishTranslation`, `transliteration` in place.
2. Generate `quranCanonical.json`.
3. Commit as one mechanical PR.

This single pass eliminates all existing drift — including the translation-punctuation issues visible in the user's screenshot.

### Pass B: curatorial (contextBlocks, stories)

Writing tafsir summaries, hadith context, and stories for ~50 mood-tagged verses is human work and cannot be automated. Approach:

- **Per-mood rollout.** Tackle one mood at a time (e.g. Overwhelmed first). An angle without `contextBlocks` simply doesn't expose the context layer at runtime — see §2. No gating, no flags.
- **Content template.** Document the expected shape of a `ContextBlock` array in [docs/superpowers/content-authoring.md](../content-authoring.md) (new). Include examples for each block kind and the URL conventions for citations.
- **Stories queue.** A separate tracking doc listing which moods get which stories (Yunus AS for despair, Ayyub AS for chronic hardship, etc.). Each story references specific Quranic verses and hadiths — authors fetch the exact URLs from quran.com / sunnah.com and paste them into `citations`.

Content backfill is ongoing work, not a blocker for shipping the layer infrastructure.

## Files changed / created

**Modified**
- `src/types/index.ts` — add `SourceCitation`, `ContextBlock`; extend `ContentAngle`.
- `src/screens/GuidanceScreen.tsx` — dynamic `buildLayerConfig`, wire all 4 layers, drop regex `extractVerseKey`.
- `src/components/VerseLayer.tsx` — delete `formatTranslation`; accept `nextLayerLabel` prop.
- `src/components/ContextLayer.tsx` — replace parsing with typed `blocks` rendering.
- `src/components/PracticeLayer.tsx` — accept `nextLayerLabel`; otherwise unchanged.
- `src/components/ReflectionLayer.tsx` — accept `nextLayerLabel`; otherwise unchanged.
- `src/components/AudioPlayerButton.tsx` — small cleanup of resume-from-finish state.
- `src/data/quranData.ts` — Pass A mechanical rewrite via audit script; per-angle Pass B curatorial additions of `contextBlocks`.

**New**
- `src/components/SourceChip.tsx`
- `src/components/LayerBottomRail.tsx`
- `src/services/sourceLinks.ts`
- `src/scripts/auditQuranContent.ts` (plus `npm run audit-quran` / `npm run refresh-canonical` scripts)
- `src/data/canonical/quranCanonical.json` (generated)
- `src/__tests__/quranContent.integrity.test.ts`
- `docs/superpowers/content-authoring.md`

**Possibly deleted after migration**
- `src/components/FloatingActionRow.tsx` — if `LayerBottomRail` fully supersedes it.

## Success criteria

1. After selecting a mood, the user sees the verse and can swipe up through any of tafsir / practice / reflection layers that have content, with each layer hinting at the next.
2. Every text block (verse, tafsir, hadith, story) displays a tappable source chip that opens the exact canonical URL on quran.com or sunnah.com.
3. On any Quranic verse, the audio played matches the text displayed — verified by the CI integrity test.
4. Non-Quranic content (hadith, dua from Bukhari) never shows an audio button.
5. The translation on the verse screen renders with intact punctuation, parentheticals, and grammar — no more regex-mangled output.
6. An angle with no `contextBlocks` still works — the user just doesn't get a context layer. No empty screens, no filler.

## Resolved decisions

- **First mood for curatorial rollout (Pass B):** `Overwhelmed`. Largest existing verse set, matches the app's primary anxious/stressed use case, highest early-user hit rate.
- **Authoring flow:** hand-edited TS in [quranData.ts](../../../src/data/quranData.ts). No authoring helper at this stage — the corpus is small (~50 angles) and building tooling is YAGNI until authoring becomes a measurable bottleneck.
- **`SourceChip` analytics:** none. Privacy-first is a top constraint; tracking which sources users verify would contradict it. Tap handler calls `Linking.openURL` only.
