# Content Authoring Guide

## Who this is for

Anyone adding mood-based Quranic guidance content — whether engineer or content curator.

## The ContextBlock model

Every `ContentAngle` in [src/data/quranData.ts](../../src/data/quranData.ts) MAY have a `contextBlocks: ContextBlock[]`. Blocks render on the Context layer, which the user reaches by swiping up from the verse. Blocks are opt-in: an angle with no blocks simply doesn't expose a Context layer — no filler, no empty screens.

## The three kinds

### Tafsir

Scholar-sourced explanation. Current default: Tafsir As-Sa'di (accessible language, fits the app's youth audience).

```ts
{
  kind: 'tafsir',
  text: "2–4 plain-English sentences explaining the verse based on As-Sa'di.",
  source: {
    label: "Tafsir As-Sa'di",
    url: quranTafsirUrl('<verseKey>', TAFSIR_IDS.AS_SADI),
  },
}
```

**Bar:**
- Rephrase As-Sa'di's meaning in your own words — do not copy-paste
- End without a source dump; the chip carries the citation
- Keep the language accessible

### Hadith

Only add when a prophetic statement genuinely deepens the verse's meaning. Filler is worse than absence.

```ts
{
  kind: 'hadith',
  text: '"..."',                    // English translation
  arabicText: 'optional arabic',
  transliteration: 'optional transliteration',
  source: {
    label: 'Sahih <Collection> <Number>',
    url: sunnahUrl('<collection-slug>', '<hadithNumber>'),
    grading: 'sahih',               // required — look up on sunnah.com
  },
}
```

**Bar:**
- Only from authenticated collections: Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah, Muwatta, Ahmad
- Grading is required — if unsure, skip the hadith
- Use sunnah.com's exact collection slug (lowercase, no spaces)

### Story

Narrative of a prophet or companion relevant to the mood.

```ts
{
  kind: 'story',
  text: '2–5 narrative sentences naming the prophet/sahaba.',
  citations: [
    { label: 'Surah <name> <ref>', url: quranVerseUrl('<verseKey>') },
    { label: 'Sahih <Collection> <Number>', url: sunnahUrl('<slug>', '<num>') },
  ],
}
```

**Bar:**
- At least 2 citations — stories weave multiple sources
- One story per angle maximum
- Must name the person (Yunus AS, 'Umar RA, etc.)
- If no story genuinely fits → skip

## URLs — always use the helpers

Import from `src/services/sourceLinks`:
```ts
import { quranVerseUrl, quranTafsirUrl, sunnahUrl, TAFSIR_IDS } from '../services/sourceLinks';
```

Never hand-build a URL. The helpers handle ranges, trailing slashes, and the verified tafsir ID.

## Mood rollout order

1. Overwhelmed (complete)
2. Sad
3. Angry
4. Tired
5. Lonely
6. Grateful
7. Hopeful
8. Guilty
9. Calm

One mood per PR. Review targets quality of tafsir, accuracy of hadith grading, and narrative fit of stories.

## When to add a practice or reflection

Those feed different layers (`PracticeLayer`, `ReflectionLayer`) and use existing fields on `ContentAngle` (`practiceSteps`, `reflection`). They're also opt-in per angle — the layer appears only when content is present. See the design spec for the layer sequence rules.
