# Study Journeys (Journaling + Exam Results) — Design

## Goal

Add two new free-tier guided Journeys ("paths") focused on studying: one on
building a daily study-journaling habit, one on managing exam anxiety and
trusting the outcome. Each day of both journeys opens with a hadith, then
moves into the existing Quran-verse flow — a "sunnah first, then Quran
context" structure that doesn't exist in any current journey.

## Why this shape

The app already has a `ContentType` union (`'Quran' | 'Hadith' | 'Dua' |
'Sunnah Practice' | 'Dhikr'`) and a `HadithGrading` type
(`'sahih' | 'hasan' | 'sahih_li_ghayrihi' | 'hasan_li_ghayrihi'`) in
`src/types/index.ts` — the content model was built to support hadith-typed
content from the start, but zero of the 156 seeded `Content` rows use it
today. This design reuses that existing model instead of inventing a parallel
one.

Content isn't read live from `src/data/quranData.ts` — it's seeded once into
SQLite via `src/database/seedContent.ts`, gated by a `SEED_VERSION` counter
(`AsyncStorage` key `@sakina_seed_version`). Any new content added here MUST
bump `SEED_VERSION` (currently `2` → `3`), or already-installed devices never
receive it (this is a documented past incident in that file's own comments —
"this is how the Salah Transformation angles went missing for already-seeded
devices").

## Data model changes

- **New file `src/data/hadithData.ts`** — exports `hadithContent: Content[]`.
  Plain `type: 'Hadith'` rows using the existing `Content` interface
  (`arabicText`, `translation`/`englishTranslation`, `source`, `whyThis`).
  No `ContentAngle` rows are needed for these — hadith is displayed as its
  own layer, not rotated into practice/reflection prompts (those stay driven
  by the day's Quran verse angle, as today).
- **`src/database/seedContent.ts`** — add a `require('../data/hadithData')`
  step (same dynamic-require-inside-the-function pattern used for
  `quranData.ts`, to avoid bundling cost at import time) that inserts
  `hadithContent` rows with `INSERT OR IGNORE`. Bump `SEED_VERSION` to `3`.
- **`src/types/index.ts`** — `PathStep` gains one new optional field:
  `hadithContentId?: string`.
- **`src/services/rotationEngine.ts`** — new public method
  `getHadithContent(contentId: string): Promise<Content | null>`, a thin
  delegate to the already-private `contentRepo.fetchContentById()`. Keeps
  `ContentRepository` encapsulated behind the same facade `PathDetailScreen`
  and `PathStepScreen` already use — neither screen talks to
  `ContentRepository` directly today, and this doesn't change that.

## Layer flow changes

`src/screens/PathStepScreen.tsx` hardcodes
`layerTypes = ['verse', 'context', 'practice', 'reflection']`. This becomes
conditional:

```ts
const layerTypes: LayerType[] = step.hadithContentId
  ? ['hadith', 'verse', 'context', 'practice', 'reflection']
  : ['verse', 'context', 'practice', 'reflection'];
```

Existing journeys (Rizq Revolution, Salah Transformation) have no
`hadithContentId` on any step, so their layer flow is byte-for-byte
unchanged — zero regression risk to what's already shipped.

A new `HadithLayer` component (visually matching `ContextLayer`'s card
language: accent-colored border, centered text, source line) renders the
hadith, plus a citation line showing the grading (e.g. "Sahih Muslim 2699 ·
Sahih"). `LayerPager`'s `labels` prop (already caller-supplied, not
hardcoded — verified in `src/components/LayerPager.tsx`) becomes
`['Hadith', 'Verse', 'Context', 'Practice', 'Reflection']` for these two
paths.

**Prefetch, not mid-screen fetch.** Both places that currently fetch
`guidanceExperience` before navigating —
[`PathDetailScreen.tsx:139`](../../../src/screens/PathDetailScreen.tsx#L139)
(`openDay`) and `PathStepScreen.tsx`'s `completeAndAdvance` — get a parallel
`rotationEngine.getHadithContent(step.hadithContentId)` call (only when the
field is present), fetched via `Promise.all` alongside the existing
`getGuidanceForStep` call, and passed to `PathStep` as a new route param
`hadithContent`. This matches the just-shipped fix to `GuidanceScreen` (never
navigate into a screen and fetch content after the fact — always resolve
before navigating, so there's no loading spinner stuck on the hadith layer).

## Path gating

Both new paths ship at `isPremium: false` (free tier) and get added to
`AVAILABLE_PATH_IDS` in `src/screens/PathsScreen.tsx` (currently only
`path_rizq_revolution` and `path_salah_transformation` are unlocked — every
other seeded path is a locked "coming soon" placeholder). Without this, the
paths would exist in data but be unreachable/greyed out, same as most of
`STATIC_SPIRITUAL_PATHS` today.

## Content: Path A — "Study Journaling" (7 days)

Theme: building a daily study habit — dhikr/dua before studying, gratitude
and honest reflection after. `theme: 'Hopeful'` (closest existing `Mood`
value), `target: "Himmah (diligence) and gratitude for knowledge"`.

| Day | Hadith (first layer) | Verse (context layer) | Practice / reflection focus |
|---|---|---|---|
| 1 | "Seeking knowledge is an obligation upon every Muslim" (Ibn Majah 224, hasan) | 20:114 — "My Lord, increase me in knowledge" | Say the dua before opening books; journal what I intend to learn today |
| 2 | "Whoever treads a path seeking knowledge, Allah eases for him a path to Paradise" (Muslim 2699, sahih) | 58:11 — Allah raises those with knowledge in degrees | Journal why this knowledge matters beyond the grade |
| 3 | "Actions are but by intentions" (Bukhari 1, sahih) | 96:1-5 — "Read, in the name of your Lord" | Reset-intention (niyyah) journal prompt |
| 4 | "O Allah, nothing is easy except what You make easy, and You make the difficult easy if You wish" (Ibn Hibban, hasan) | 94:5-6 — "With hardship comes ease" (repeated) | Journal a hard topic, reframe it |
| 5 | "The most beloved deeds to Allah are the most consistent, even if small" (Bukhari 6465 / Muslim 782, sahih) | 103 (Al-'Asr) — time, patience, truth | Journal a study-routine check-in |
| 6 | "O Allah, I ask You for beneficial knowledge" (Ibn Majah 925, hasan) | 2:286 — Allah does not burden a soul beyond its capacity | Journal on releasing perfectionism |
| 7 | "He who does not thank people does not thank Allah" (Abu Dawud 4811, hasan) | 14:7 — "If you are grateful, I will surely increase you" | Closing gratitude journal, week recap |

## Content: Path B — "Trusting the Results" (7 days)

Theme: exam-week anxiety → tawakkul before the exam → sabr/shukr on
whatever the result is. `theme: 'Overwhelmed'`, `target: 'Tawakkul and sabr
through uncertainty'`.

| Day | Hadith (first layer) | Verse (context layer) | Practice / reflection focus |
|---|---|---|---|
| 1 | "If you were to rely upon Allah with true reliance, He would provide for you as He provides the birds: they go out hungry in the morning and come back full in the evening" (Tirmidhi 2344, hasan sahih) | 3:159 — tawakkul after taking action | Journal: what preparation is actually in my control |
| 2 | Dua for anxiety/distress: "Allahumma inni a'udhu bika minal-hammi wal-hazan..." (Bukhari 6369, sahih) | 94:5-6 — ease after hardship | Say the dua before the exam |
| 3 | "Wondrous is the affair of the believer... if harm befalls him, he is patient, and that is good for him" (Muslim 2999, sahih) | 2:153 — seek help through patience and prayer | Journal: naming the pre-exam fear directly |
| 4 | "Know that if the nation were to gather together to benefit you with anything, they would not benefit you except with what Allah had already written for you" (Tirmidhi 2516, sahih) | 65:3 — "Allah is sufficient for whoever relies on Him" | Practice: dhikr before walking in |
| 5 (results day) | "Wondrous is the affair of the believer, it is all good for him" (Muslim 2999, sahih) | 2:216 — "you may dislike a thing which is good for you" | Journal: sitting with the waiting |
| 6 | "The strong believer is better and more beloved to Allah than the weak believer... and do not be helpless" (Muslim 2664, sahih) | 14:7 — gratitude increases blessing | Journal: gratitude if the result is good |
| 7 | "How amazing is the affair of the believer — if a calamity befalls him, he is patient, and that is good for him" (closing du'a of acceptance, Ahmad) | 2:286 / 94:6 — ease is coming | Journal: sabr + next-step framing if the result disappoints |

**Verification requirement (blocking, before ship):** every hadith citation
above was recalled from training knowledge, not fetched live. Before this
content is authored into `hadithData.ts`, each one must be checked against
its actual `sunnah.com` page (fetched via an exact URL, per this session's
established no-URL-guessing rule) for correct wording, book/number, and
grading, and mapped onto the exact `HadithGrading` enum
(`'sahih' | 'hasan' | 'sahih_li_ghayrihi' | 'hasan_li_ghayrihi'`) — the
loose "hasan"/"sahih sahih" labels above are placeholders for scholarly
grading, not final values.

## Testing

- Typecheck (`npx tsc --noEmit -p tsconfig.json`) after each code change.
- Existing paths (Rizq Revolution, Salah Transformation) must render
  identically — no `hadithContentId` means no `hadith` layer, verified by
  reading through `PathStepScreen`'s conditional unchanged for that case.
- New paths verified on-device only (this app has no working web preview —
  `expo-secure-store` has no web shim and stalls Supabase auth bootstrap on
  launch, established earlier this session) — typecheck and code-reasoning
  are the only verification available in this environment; on-device
  confirmation is a standing follow-up.

## Out of scope

- No live sunnah.com API integration (static bundled content only, per
  earlier decision in this session).
- No changes to `ContentRepository`'s public surface beyond the one new
  `RotationEngine.getHadithContent()` delegate.
- No changes to `HadithLayer` reuse in the mood-guidance flow
  (`GuidanceScreen`) — this ships for Journeys only.
