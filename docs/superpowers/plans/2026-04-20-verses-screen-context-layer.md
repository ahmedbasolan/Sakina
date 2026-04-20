# Verses Screen Context Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the post-mood verse screen with tafsir / hadith / story context layers, add tappable source citations to quran.com and sunnah.com, fix audio/translation drift permanently with a CI integrity invariant, and polish bottom-rail layout.

**Architecture:** Keep the existing swipe-up layer model (`LayerContainer` + `VerseLayer` / `ContextLayer` / `PracticeLayer` / `ReflectionLayer`). Replace `ContextLayer`'s heuristic text-parsing with typed `ContextBlock[]` data. Dynamically build the layer sequence per experience so absent content hides layers rather than showing empty screens. Delete the `formatTranslation` regex chain — instead, regenerate canonical Arabic/translation from quran.com offline via an audit script and lock it behind a Jest integrity test.

**Tech Stack:** React Native + Expo, TypeScript, Jest, expo-audio, expo-linking (Linking API), quran.com v4 public API (offline-only at build/audit time), sunnah.com (URL generation only).

**Design spec:** [`docs/superpowers/specs/2026-04-20-verses-screen-context-layer-design.md`](../specs/2026-04-20-verses-screen-context-layer-design.md)

---

## File Structure

**New files:**
- `src/services/sourceLinks.ts` — pure URL builders + `TAFSIR_IDS`
- `src/services/__tests__/sourceLinks.test.ts`
- `src/components/SourceChip.tsx` — tappable citation pill
- `src/components/__tests__/SourceChip.test.tsx`
- `src/components/LayerBottomRail.tsx` — shared 3-zone bottom rail
- `src/hooks/useLayerConfig.ts` — dynamic layer sequence + `parsePracticeSteps`
- `src/hooks/__tests__/useLayerConfig.test.ts`
- `src/scripts/auditQuranContent.ts` — canonical audit + `--fix` + JSON snapshot
- `src/scripts/__tests__/auditQuranContent.test.ts`
- `src/data/canonical/quranCanonical.json` — generated snapshot
- `src/__tests__/quranContent.integrity.test.ts` — CI drift guard
- `docs/superpowers/content-authoring.md` — author guide for `ContextBlock`

**Modified files:**
- `src/types/index.ts` — `SourceCitation`, `ContextBlock`; extend `ContentAngle`
- `src/components/ContextLayer.tsx` — replace parsing with `blocks` prop
- `src/components/VerseLayer.tsx` — remove `formatTranslation`, accept `nextLayerLabel`, use `LayerBottomRail`
- `src/components/PracticeLayer.tsx` — accept `nextLayerLabel`, use `LayerBottomRail`
- `src/components/ReflectionLayer.tsx` — accept `nextLayerLabel`, use `LayerBottomRail`
- `src/components/AudioPlayerButton.tsx` — cleanup resume-after-finish logic
- `src/screens/GuidanceScreen.tsx` — wire all layers via `useLayerConfig`, drop `extractVerseKey`
- `src/data/quranData.ts` — Pass A mechanical rewrite (audit); Pass B curatorial `contextBlocks` for Overwhelmed mood
- `package.json` — add `audit-quran` + `refresh-canonical` scripts

**Possibly deleted:**
- `src/components/FloatingActionRow.tsx` — superseded by `LayerBottomRail` (remove only if grep confirms it's unused after Task 14)

---

## Task 0: Branch sync

**Files:** (none — git only)

**Context:** This worktree was created from a stale branch that predates the layer architecture. `src/components/VerseLayer.tsx` does not exist in the worktree but does exist on `main`. The plan assumes main's code is present. Your first move is to get this branch onto main's code while preserving the two spec/plan commits.

- [ ] **Step 1: Check status**

Run: `git status && git log --oneline -5`
Expected: clean tree, recent commits should be the two `docs(spec):` / `docs(plan):` commits.

- [ ] **Step 2: Fetch main**

Run: `git fetch origin main`
Expected: fetches latest main without errors.

- [ ] **Step 3: Rebase onto main**

Run: `git rebase origin/main`
Expected: rebase succeeds. If there are conflicts in any non-doc files, abort and ask the user (`git rebase --abort`) — this worktree should only have spec/plan docs, which don't conflict with main.

- [ ] **Step 4: Verify layer files now present**

Run: `ls src/components/VerseLayer.tsx src/components/ContextLayer.tsx src/components/PracticeLayer.tsx src/components/ReflectionLayer.tsx src/components/LayerContainer.tsx src/components/ImmersiveBackground.tsx`
Expected: all six files listed.

- [ ] **Step 5: Sanity build**

Run: `npx tsc --noEmit`
Expected: exits 0 (may have pre-existing warnings — note but don't fix unrelated ones).

No commit this task — it's a rebase.

---

## Task 1: Type additions

**Files:**
- Modify: `src/types/index.ts`

**Context:** We add two new exported types and extend `ContentAngle` with an optional `contextBlocks` array. Old fields stay for backward compat with unmigrated data.

- [ ] **Step 1: Add `SourceCitation` and `ContextBlock`**

Open `src/types/index.ts`. Locate the `HadithGrading` export (around line 36). Immediately after that line, add:

```ts
// ─── Source Citation & Context Blocks ──────────────────────────
// Every user-visible text block on the guidance screen must cite its source.
// A SourceCitation is always link-resolvable — tapping the matching chip
// opens the canonical URL on quran.com or sunnah.com.
export type SourceCitation = {
  label: string;                   // e.g. "Tafsir As-Sa'di", "Sahih al-Bukhari 6363", "Surah Yunus 21:87"
  url: string;                     // canonical quran.com or sunnah.com URL
  grading?: HadithGrading;         // present on hadith citations only
};

// A ContextBlock is one "section" the user reads on the Context layer,
// after swiping up from the verse. Tafsir explains the verse; hadith
// supplies prophetic commentary when it deepens the meaning; story
// weaves relevant prophet/companion narratives.
export type ContextBlock =
  | { kind: 'tafsir'; text: string; source: SourceCitation }
  | {
      kind: 'hadith';
      text: string;
      arabicText?: string;
      transliteration?: string;
      source: SourceCitation;
    }
  | { kind: 'story'; text: string; citations: SourceCitation[] };
```

- [ ] **Step 2: Extend `ContentAngle` with `contextBlocks`**

In the same file, locate `export interface ContentAngle` (around line 64). Add `contextBlocks?: ContextBlock[];` immediately after the `mood: Mood;` line. Add JSDoc to the existing `angle`, `angleSource`, `angleArabicText`, `angleTransliteration`, `whyThisWorks` fields marking them deprecated:

Example for `angle`:
```ts
  /** @deprecated Prefer `contextBlocks: ContextBlock[]`. Retained for unmigrated data. */
  angle: string;
```

Apply the same `@deprecated` JSDoc line to each of the five deprecated fields. Do not delete them — existing data in [quranData.ts](../../../src/data/quranData.ts) still uses them.

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add SourceCitation and ContextBlock; extend ContentAngle"
```

---

## Task 2: `sourceLinks` service

**Files:**
- Create: `src/services/sourceLinks.ts`
- Create: `src/services/__tests__/sourceLinks.test.ts`

**Context:** Pure-function URL builders. The As-Sa'di tafsir resource ID on quran.com is NOT hardcoded — we fetch it once from `https://api.quran.com/api/v4/resources/tafsirs`, grep for "Sa'di" (author Abdur-Rahman As-Sa'di, language English), and paste the integer.

- [ ] **Step 1: Write failing tests**

Create `src/services/__tests__/sourceLinks.test.ts`:

```ts
import { quranVerseUrl, quranTafsirUrl, sunnahUrl, TAFSIR_IDS } from '../sourceLinks';

describe('sourceLinks', () => {
  describe('quranVerseUrl', () => {
    it('builds canonical URL for a single verse', () => {
      expect(quranVerseUrl('2:255')).toBe('https://quran.com/2/255');
    });

    it('uses start verse when given a range', () => {
      expect(quranVerseUrl('94:5-6')).toBe('https://quran.com/94/5');
    });
  });

  describe('quranTafsirUrl', () => {
    it('builds URL with tafsir ID', () => {
      expect(quranTafsirUrl('30:21', 170)).toBe('https://quran.com/30/21/tafsirs/170');
    });
  });

  describe('sunnahUrl', () => {
    it('builds URL from collection and hadith number', () => {
      expect(sunnahUrl('bukhari', '6363')).toBe('https://sunnah.com/bukhari:6363');
    });
  });

  describe('TAFSIR_IDS', () => {
    it('has a verified As-Sa\'di ID (non-zero integer)', () => {
      expect(TAFSIR_IDS.AS_SADI).toBeGreaterThan(0);
      expect(Number.isInteger(TAFSIR_IDS.AS_SADI)).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=sourceLinks`
Expected: FAIL with "Cannot find module '../sourceLinks'".

- [ ] **Step 3: Look up the As-Sa'di tafsir ID**

Run: `curl -s 'https://api.quran.com/api/v4/resources/tafsirs' | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(d.tafsirs.filter(t=>/sa.?di/i.test(t.name) || /sa.?di/i.test(t.author_name)).map(t=>({id:t.id,name:t.name,author:t.author_name,lang:t.language_name})));"`
Expected: prints one or more entries. Pick the one with English language and author "Abdur-Rahman As-Sa'di" (often named "Tafseer As-Sa'di"). Note its integer `id`.

If the endpoint returns nothing for the grep, fall back to browsing https://api.quran.com/api/v4/resources/tafsirs directly and searching the JSON.

- [ ] **Step 4: Write the implementation**

Create `src/services/sourceLinks.ts` (replace `<PASTE_ID>` with the integer you just noted):

```ts
/**
 * Source URL builders for content citations.
 *
 * Every ContextBlock and verse card carries a SourceCitation. These helpers
 * produce the canonical URL that a SourceChip opens on tap.
 *
 * No runtime API calls — these are pure URL builders used at content-author
 * time (in data files) and at render time (by SourceChip).
 */

/** Verified against https://api.quran.com/api/v4/resources/tafsirs */
export const TAFSIR_IDS = {
  AS_SADI: <PASTE_ID>,
} as const;

/** Parse "2:255" or "94:5-6" into the starting verse key. */
function startVerseKey(verseKey: string): string {
  const [chapter, versePart] = verseKey.split(':');
  const start = versePart.split('-')[0];
  return `${chapter}/${start}`;
}

export function quranVerseUrl(verseKey: string): string {
  return `https://quran.com/${startVerseKey(verseKey)}`;
}

export function quranTafsirUrl(verseKey: string, tafsirId: number): string {
  return `https://quran.com/${startVerseKey(verseKey)}/tafsirs/${tafsirId}`;
}

/**
 * Build a sunnah.com URL.
 * @param collection lowercase collection slug — e.g. "bukhari", "muslim", "abudawud"
 * @param hadithNumber numeric hadith reference as a string — preserves leading zeros if any
 */
export function sunnahUrl(collection: string, hadithNumber: string): string {
  return `https://sunnah.com/${collection}:${hadithNumber}`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- --testPathPattern=sourceLinks`
Expected: all 4 test cases pass.

- [ ] **Step 6: Commit**

```bash
git add src/services/sourceLinks.ts src/services/__tests__/sourceLinks.test.ts
git commit -m "feat(services): add sourceLinks URL builders with verified As-Sa'di tafsir ID"
```

---

## Task 3: `SourceChip` component

**Files:**
- Create: `src/components/SourceChip.tsx`
- Create: `src/components/__tests__/SourceChip.test.tsx`

**Context:** A small pill-style button used anywhere a source is cited. Tap → `Linking.openURL(citation.url)`. Announces as a link for accessibility. Shows an external-link icon so users know it leaves the app.

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/SourceChip.test.tsx`:

```tsx
import React from 'react';
import { Linking } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import SourceChip from '../SourceChip';

describe('SourceChip', () => {
  const citation = { label: 'Sahih al-Bukhari 6363', url: 'https://sunnah.com/bukhari:6363' };

  it('renders the citation label', () => {
    const { getByText } = render(<SourceChip citation={citation} />);
    expect(getByText(/Sahih al-Bukhari 6363/)).toBeTruthy();
  });

  it('opens the URL via Linking when tapped', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByRole } = render(<SourceChip citation={citation} />);
    fireEvent.press(getByRole('link'));
    expect(openURL).toHaveBeenCalledWith(citation.url);
    openURL.mockRestore();
  });

  it('shows grading when provided (hadith)', () => {
    const { getByText } = render(
      <SourceChip citation={{ ...citation, grading: 'sahih' }} />,
    );
    expect(getByText(/Sahih/i)).toBeTruthy();
  });

  it('calls custom onPress if provided instead of Linking', () => {
    const onPress = jest.fn();
    const openURL = jest.spyOn(Linking, 'openURL');
    const { getByRole } = render(<SourceChip citation={citation} onPress={onPress} />);
    fireEvent.press(getByRole('link'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(openURL).not.toHaveBeenCalled();
    openURL.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=SourceChip`
Expected: FAIL with "Cannot find module '../SourceChip'".

- [ ] **Step 3: Write the component**

Create `src/components/SourceChip.tsx`:

```tsx
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { SourceCitation, HadithGrading } from '../types';

interface SourceChipProps {
  citation: SourceCitation;
  /** Custom handler. If omitted, taps call Linking.openURL(citation.url). */
  onPress?: () => void;
}

const GRADING_LABEL: Record<HadithGrading, string> = {
  sahih: 'Sahih',
  hasan: 'Hasan',
  sahih_li_ghayrihi: 'Sahih li-ghayrihi',
  hasan_li_ghayrihi: 'Hasan li-ghayrihi',
};

const SourceChip: React.FC<SourceChipProps> = ({ citation, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      Linking.openURL(citation.url).catch(() => {
        // Swallow: best-effort link open. No toast/alert to keep chips quiet.
      });
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel={`Open ${citation.label} in browser`}
      activeOpacity={0.7}
    >
      <View style={styles.chip}>
        {citation.grading ? (
          <View style={styles.gradingBadge}>
            <Text style={styles.gradingText}>{GRADING_LABEL[citation.grading]}</Text>
          </View>
        ) : null}
        <Text style={styles.label} numberOfLines={1}>
          {citation.label}
        </Text>
        <Ionicons name="open-outline" size={12} color={Colors.text.secondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 235, 210, 0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 235, 210, 0.14)',
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
    fontFamily: Typography.fonts.serif,
  },
  gradingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
  },
  gradingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4ADE80',
    letterSpacing: 0.5,
  },
});

export default SourceChip;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=SourceChip`
Expected: all 4 test cases pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/SourceChip.tsx src/components/__tests__/SourceChip.test.tsx
git commit -m "feat(components): add SourceChip for tappable citation links"
```

---

## Task 4: Audit script — audioKey parser

**Files:**
- Create: `src/scripts/auditQuranContent.ts`
- Create: `src/scripts/__tests__/auditQuranContent.test.ts`

**Context:** The script will eventually fetch quran.com and rewrite [quranData.ts](../../../src/data/quranData.ts). We build it piece by piece. Task 4 = just the parser: turn `"94:5-6"` into `{ chapter: 94, startVerse: 5, endVerse: 6 }`.

- [ ] **Step 1: Write failing tests**

Create `src/scripts/__tests__/auditQuranContent.test.ts`:

```ts
import { parseAudioKey } from '../auditQuranContent';

describe('parseAudioKey', () => {
  it('parses a single verse', () => {
    expect(parseAudioKey('2:255')).toEqual({ chapter: 2, startVerse: 255, endVerse: 255 });
  });

  it('parses a verse range', () => {
    expect(parseAudioKey('94:5-6')).toEqual({ chapter: 94, startVerse: 5, endVerse: 6 });
  });

  it('returns null for invalid format', () => {
    expect(parseAudioKey('nonsense')).toBeNull();
    expect(parseAudioKey('1:')).toBeNull();
    expect(parseAudioKey('1:2-')).toBeNull();
    expect(parseAudioKey('')).toBeNull();
  });

  it('returns null when start > end in a range', () => {
    expect(parseAudioKey('2:10-5')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=auditQuranContent`
Expected: FAIL with "Cannot find module '../auditQuranContent'".

- [ ] **Step 3: Write the parser**

Create `src/scripts/auditQuranContent.ts`:

```ts
/**
 * Quran content audit script.
 *
 * Two modes:
 *   npm run audit-quran            → dry-run, prints a diff report
 *   npm run audit-quran -- --fix   → rewrites src/data/quranData.ts in place
 *                                    and regenerates src/data/canonical/quranCanonical.json
 *
 * Never called at runtime. Requires network.
 */

export type AudioKeyParts = {
  chapter: number;
  startVerse: number;
  endVerse: number;
};

export function parseAudioKey(audioKey: string): AudioKeyParts | null {
  const match = audioKey.match(/^(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  const chapter = parseInt(match[1], 10);
  const startVerse = parseInt(match[2], 10);
  const endVerse = match[3] !== undefined ? parseInt(match[3], 10) : startVerse;
  if (!Number.isFinite(chapter) || !Number.isFinite(startVerse) || !Number.isFinite(endVerse)) {
    return null;
  }
  if (endVerse < startVerse) return null;
  return { chapter, startVerse, endVerse };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=auditQuranContent`
Expected: all 4 test cases pass.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/auditQuranContent.ts src/scripts/__tests__/auditQuranContent.test.ts
git commit -m "feat(scripts): audit audioKey parser"
```

---

## Task 5: Audit script — fetch + normalize + diff

**Files:**
- Modify: `src/scripts/auditQuranContent.ts`
- Modify: `src/scripts/__tests__/auditQuranContent.test.ts`

**Context:** Add the quran.com fetcher, the text normalization (diacritics/whitespace/tatweel), and the diff function. Network call is mocked in tests via `jest.spyOn(global, 'fetch')`.

- [ ] **Step 1: Add fetch + normalize + diff tests**

Append to `src/scripts/__tests__/auditQuranContent.test.ts`:

```ts
import {
  normalizeArabic,
  normalizeEnglish,
  fetchCanonicalVerse,
  diffContentEntry,
  type CanonicalVerse,
} from '../auditQuranContent';

describe('normalizeArabic', () => {
  it('strips tatweel and normalizes whitespace', () => {
    expect(normalizeArabic('اللـ\u0640ـه  الرحمن')).toBe('الله الرحمن');
  });

  it('strips verse markers like ﴿٤﴾ and bracketed numbers', () => {
    expect(normalizeArabic('فَإِنَّ ﴿5﴾')).toBe('فَإِنَّ');
  });
});

describe('normalizeEnglish', () => {
  it('collapses multiple spaces', () => {
    expect(normalizeEnglish('hello   world')).toBe('hello world');
  });

  it('trims and preserves punctuation (no regex mangling)', () => {
    expect(normalizeEnglish('  Indeed, with hardship is ease.  ')).toBe(
      'Indeed, with hardship is ease.',
    );
  });
});

describe('fetchCanonicalVerse', () => {
  afterEach(() => jest.restoreAllMocks());

  it('fetches a single verse and maps to CanonicalVerse', async () => {
    const mockBody = {
      verses: [
        {
          verse_key: '2:255',
          text_uthmani: 'ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ',
          translations: [{ resource_id: 131, text: 'Allah — there is no deity except Him.' }],
        },
      ],
    };
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockBody,
    } as Response);

    const result = await fetchCanonicalVerse({ chapter: 2, startVerse: 255, endVerse: 255 });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/verses/by_key/2:255'),
      expect.any(Object),
    );
    expect(result.arabicText).toContain('ٱللَّهُ');
    expect(result.englishTranslation).toBe('Allah — there is no deity except Him.');
  });

  it('concatenates a range across multiple fetches', async () => {
    const verses = [
      { verse_key: '94:5', text_uthmani: 'فَإِنَّ مَعَ', translations: [{ resource_id: 131, text: 'So with hardship.' }] },
      { verse_key: '94:6', text_uthmani: 'إِنَّ مَعَ', translations: [{ resource_id: 131, text: 'Indeed with hardship.' }] },
    ];
    jest.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const key = String(url).split('/').pop() || '';
      const v = verses.find((x) => x.verse_key === key) ?? verses[0];
      return { ok: true, json: async () => ({ verses: [v] }) } as Response;
    });

    const result = await fetchCanonicalVerse({ chapter: 94, startVerse: 5, endVerse: 6 });

    expect(result.arabicText).toContain('فَإِنَّ مَعَ');
    expect(result.arabicText).toContain('إِنَّ مَعَ');
    expect(result.englishTranslation).toContain('So with hardship.');
    expect(result.englishTranslation).toContain('Indeed with hardship.');
  });
});

describe('diffContentEntry', () => {
  const canonical: CanonicalVerse = {
    audioKey: '2:255',
    arabicText: 'ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ',
    englishTranslation: 'Allah — there is no deity except Him.',
  };

  it('returns no diff when fields match after normalization', () => {
    const diff = diffContentEntry(
      { arabicText: 'ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ', englishTranslation: 'Allah — there is no deity except Him.' },
      canonical,
    );
    expect(diff).toEqual([]);
  });

  it('detects Arabic drift', () => {
    const diff = diffContentEntry(
      { arabicText: 'SOMETHING_ELSE', englishTranslation: canonical.englishTranslation },
      canonical,
    );
    expect(diff).toContain('arabicText');
  });

  it('detects English drift', () => {
    const diff = diffContentEntry(
      { arabicText: canonical.arabicText, englishTranslation: 'Wrong translation' },
      canonical,
    );
    expect(diff).toContain('englishTranslation');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern=auditQuranContent`
Expected: FAIL with "Cannot find module" or "not exported" for `normalizeArabic`, `fetchCanonicalVerse`, `diffContentEntry`.

- [ ] **Step 3: Implement normalization, fetch, and diff**

Append to `src/scripts/auditQuranContent.ts`:

```ts
// ─── Normalization ─────────────────────────────────────────────

/** Strip Arabic verse-end ornament markers like ﴿٥﴾, ﴿5﴾, tatweel, and collapse whitespace. */
export function normalizeArabic(text: string): string {
  return text
    .replace(/\u0640/g, '')                       // tatweel
    .replace(/[﴾﴿][^﴾﴿]*[﴾﴿]/g, '')                  // ayah ornament blocks
    .replace(/\s+/g, ' ')
    .trim();
}

/** Collapse whitespace; leave all punctuation intact. */
export function normalizeEnglish(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// ─── quran.com fetch ───────────────────────────────────────────

const QURAN_API_BASE = 'https://api.quran.com/api/v4';
const SAHIH_INTERNATIONAL_ID = 131;

export type CanonicalVerse = {
  audioKey: string;
  arabicText: string;
  englishTranslation: string;
  transliteration?: string;
};

type QuranApiVerse = {
  verse_key: string;
  text_uthmani: string;
  translations?: Array<{ resource_id: number; text: string }>;
};

async function fetchOneVerse(verseKey: string): Promise<QuranApiVerse> {
  const url = `${QURAN_API_BASE}/verses/by_key/${verseKey}?translations=${SAHIH_INTERNATIONAL_ID}&fields=text_uthmani`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`quran.com fetch failed for ${verseKey}: ${response.status}`);
  }
  const body = (await response.json()) as { verses: QuranApiVerse[] };
  if (!body.verses?.[0]) {
    throw new Error(`quran.com returned no verse for ${verseKey}`);
  }
  return body.verses[0];
}

export async function fetchCanonicalVerse(parts: AudioKeyParts): Promise<CanonicalVerse> {
  const arabicChunks: string[] = [];
  const englishChunks: string[] = [];

  for (let v = parts.startVerse; v <= parts.endVerse; v++) {
    const key = `${parts.chapter}:${v}`;
    const verse = await fetchOneVerse(key);
    arabicChunks.push(verse.text_uthmani);
    const english = verse.translations?.find((t) => t.resource_id === SAHIH_INTERNATIONAL_ID);
    if (!english) throw new Error(`Missing Sahih International for ${key}`);
    englishChunks.push(english.text);
  }

  const audioKey =
    parts.startVerse === parts.endVerse
      ? `${parts.chapter}:${parts.startVerse}`
      : `${parts.chapter}:${parts.startVerse}-${parts.endVerse}`;

  return {
    audioKey,
    arabicText: arabicChunks.join(' '),
    englishTranslation: englishChunks.join(' '),
  };
}

// ─── Diff ──────────────────────────────────────────────────────

/**
 * Compare a local content entry against the canonical truth.
 * Returns an array of drifted field names. Empty array means in-sync.
 */
export function diffContentEntry(
  local: { arabicText?: string; englishTranslation?: string },
  canonical: CanonicalVerse,
): Array<'arabicText' | 'englishTranslation'> {
  const drift: Array<'arabicText' | 'englishTranslation'> = [];
  if (normalizeArabic(local.arabicText ?? '') !== normalizeArabic(canonical.arabicText)) {
    drift.push('arabicText');
  }
  if (normalizeEnglish(local.englishTranslation ?? '') !== normalizeEnglish(canonical.englishTranslation)) {
    drift.push('englishTranslation');
  }
  return drift;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern=auditQuranContent`
Expected: all 10 test cases pass (4 parser + 2 normalizeArabic + 2 normalizeEnglish + 2 fetch + 3 diff).

- [ ] **Step 5: Commit**

```bash
git add src/scripts/auditQuranContent.ts src/scripts/__tests__/auditQuranContent.test.ts
git commit -m "feat(scripts): add quran.com fetch, normalization, and diff for audit"
```

---

## Task 6: Audit script — `--fix` mode, CLI entry, npm scripts

**Files:**
- Modify: `src/scripts/auditQuranContent.ts`
- Modify: `package.json`

**Context:** Wire up the CLI. The script imports `quranContentData` from [quranData.ts](../../../src/data/quranData.ts), iterates, fetches canonicals, either reports (default) or rewrites fields in place and writes `quranCanonical.json`.

Rewriting TS source requires parsing — we keep it simple: since each `Content` entry in [quranData.ts](../../../src/data/quranData.ts) has `arabicText: '...'` and `englishTranslation: '...'` fields with predictable formatting, we do a regex-anchored string replacement scoped to the entry's `id:` block. This avoids pulling in a full TS AST library.

- [ ] **Step 1: Add CLI entry code**

Append to `src/scripts/auditQuranContent.ts`:

```ts
// ─── CLI (only when run directly) ──────────────────────────────

/* istanbul ignore next -- CLI harness, exercised manually */
async function main() {
  const isFix = process.argv.includes('--fix');
  const path = await import('path');
  const fs = await import('fs/promises');

  // Lazy import so jest tests don't load the 10k-line data file.
  const { default: quranContentData } = (await import('../data/quranData')) as {
    default: Array<{
      id: string;
      audioKey?: string;
      arabicText?: string;
      englishTranslation?: string;
    }>;
  };

  const dataFilePath = path.resolve(__dirname, '../data/quranData.ts');
  const canonicalOutPath = path.resolve(__dirname, '../data/canonical/quranCanonical.json');

  let fileText = await fs.readFile(dataFilePath, 'utf8');
  const canonicalMap: Record<string, CanonicalVerse> = {};
  const report: Array<{ id: string; audioKey: string; drift: string[] }> = [];

  for (const entry of quranContentData) {
    if (!entry.audioKey) continue;
    const parts = parseAudioKey(entry.audioKey);
    if (!parts) {
      report.push({ id: entry.id, audioKey: entry.audioKey, drift: ['INVALID_KEY'] });
      continue;
    }

    let canonical: CanonicalVerse;
    try {
      canonical = await fetchCanonicalVerse(parts);
    } catch (err) {
      report.push({ id: entry.id, audioKey: entry.audioKey, drift: [`FETCH_FAILED: ${(err as Error).message}`] });
      continue;
    }
    canonicalMap[entry.audioKey] = canonical;

    const drift = diffContentEntry(
      { arabicText: entry.arabicText, englishTranslation: entry.englishTranslation },
      canonical,
    );
    if (drift.length) {
      report.push({ id: entry.id, audioKey: entry.audioKey, drift });
      if (isFix) {
        fileText = applyFix(fileText, entry.id, canonical);
      }
    }
  }

  if (isFix) {
    await fs.mkdir(path.dirname(canonicalOutPath), { recursive: true });
    await fs.writeFile(canonicalOutPath, JSON.stringify(canonicalMap, null, 2) + '\n', 'utf8');
    await fs.writeFile(dataFilePath, fileText, 'utf8');
    console.log(`✓ Fixed ${report.filter((r) => !r.drift[0]?.startsWith('FETCH')).length} entries. Canonical snapshot written.`);
  }

  console.log('\nDrift report:');
  if (!report.length) {
    console.log('  (no drift detected)');
  } else {
    for (const r of report) console.log(`  ${r.audioKey.padEnd(10)} ${r.id.padEnd(32)} ${r.drift.join(', ')}`);
  }
  console.log(`\nTotal entries scanned: ${quranContentData.filter((e) => e.audioKey).length}`);
}

/**
 * Rewrite `arabicText` and `englishTranslation` string literals for the entry
 * with the given id. Uses a block-scoped regex — the block is delimited by
 * `id: '<id>'` and the next closing `}` at column 2 (the per-entry indent).
 */
export function applyFix(source: string, entryId: string, canonical: CanonicalVerse): string {
  const idMarker = `id: '${entryId}'`;
  const idIndex = source.indexOf(idMarker);
  if (idIndex === -1) return source;

  // Walk forward to the entry's closing `},` at the top of the object array indent.
  const blockEnd = source.indexOf('\n  },', idIndex);
  if (blockEnd === -1) return source;

  const block = source.slice(idIndex, blockEnd);
  const rewrittenBlock = block
    .replace(/arabicText:\s*(['"`])[\s\S]*?\1/m, `arabicText: ${JSON.stringify(canonical.arabicText)}`)
    .replace(/englishTranslation:\s*(['"`])[\s\S]*?\1/m, `englishTranslation: ${JSON.stringify(canonical.englishTranslation)}`);

  return source.slice(0, idIndex) + rewrittenBlock + source.slice(blockEnd);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 2: Add unit test for `applyFix`**

Append to `src/scripts/__tests__/auditQuranContent.test.ts`:

```ts
import { applyFix } from '../auditQuranContent';

describe('applyFix', () => {
  const source = `const data = [
  {
    id: 'quran_2_255',
    audioKey: '2:255',
    arabicText: 'OLD_ARABIC',
    englishTranslation: 'Old translation.',
    moods: ['Calm'],
  },
  {
    id: 'quran_93_4',
    audioKey: '93:4',
    arabicText: 'ANOTHER',
    englishTranslation: 'Another.',
    moods: ['Overwhelmed'],
  },
];`;

  it('replaces arabicText and englishTranslation for a matching entry only', () => {
    const out = applyFix(source, 'quran_2_255', {
      audioKey: '2:255',
      arabicText: 'NEW_ARABIC',
      englishTranslation: 'New translation.',
    });
    expect(out).toContain("arabicText: \"NEW_ARABIC\"");
    expect(out).toContain("englishTranslation: \"New translation.\"");
    expect(out).toContain("arabicText: 'ANOTHER'"); // other entry untouched
  });

  it('returns source unchanged if id not found', () => {
    const out = applyFix(source, 'nonexistent_id', {
      audioKey: '1:1',
      arabicText: 'x',
      englishTranslation: 'y',
    });
    expect(out).toBe(source);
  });
});
```

- [ ] **Step 3: Run tests to verify the new ones pass**

Run: `npm test -- --testPathPattern=auditQuranContent`
Expected: all tests pass including the 2 new `applyFix` cases.

- [ ] **Step 4: Add npm scripts**

Edit `package.json`. Find the `"scripts"` block and add two entries (after `"test": "jest"`):

```json
    "audit-quran": "ts-node --transpile-only src/scripts/auditQuranContent.ts",
    "refresh-canonical": "ts-node --transpile-only src/scripts/auditQuranContent.ts --fix"
```

Check if `ts-node` is already a devDependency: `grep ts-node package.json`. If not, add it:

Run: `npm install --save-dev ts-node`

- [ ] **Step 5: Verify script loads**

Run: `npx ts-node --transpile-only src/scripts/auditQuranContent.ts --help 2>&1 | head -5`
Expected: script starts. You don't have to let it complete the full network scan — Ctrl+C after a few seconds of output. You're just verifying the CLI harness works.

- [ ] **Step 6: Commit**

```bash
git add src/scripts/auditQuranContent.ts src/scripts/__tests__/auditQuranContent.test.ts package.json package-lock.json
git commit -m "feat(scripts): wire audit-quran CLI with --fix and canonical JSON output"
```

---

## Task 7: Run Pass A audit

**Files:**
- Modify: `src/data/quranData.ts` (automatic rewrite)
- Create: `src/data/canonical/quranCanonical.json` (automatic)

**Context:** One-time execution of the audit script to heal all existing drift and bootstrap the canonical snapshot. This is a mechanical, reviewable change — don't edit [quranData.ts](../../../src/data/quranData.ts) by hand in this task.

- [ ] **Step 1: Dry-run first**

Run: `npm run audit-quran | tee audit-dryrun.log`
Expected: prints a drift report. Count the number of drifted entries (`grep -c "arabicText\|englishTranslation" audit-dryrun.log` or similar).

Note any `FETCH_FAILED` or `INVALID_KEY` rows — those need manual inspection before a full fix. If any appear:
- `INVALID_KEY`: the entry's `audioKey` is malformed. Fix by hand in quranData.ts, commit, re-run dry.
- `FETCH_FAILED`: likely a network blip — re-run. If persistent, note the id and address in a follow-up.

- [ ] **Step 2: Execute --fix**

Run: `npm run refresh-canonical`
Expected: prints `✓ Fixed N entries. Canonical snapshot written.`

- [ ] **Step 3: Inspect the diff**

Run: `git diff --stat src/data/quranData.ts src/data/canonical/`
Expected: [quranData.ts](../../../src/data/quranData.ts) has a measurable diff (lines changed); `quranCanonical.json` is a new file.

Run: `git diff src/data/quranData.ts | head -80`
Expected: visually verify the `arabicText` / `englishTranslation` changes look like canonical Quran text (diacritics, proper punctuation in English).

- [ ] **Step 4: Delete the dry-run log**

Run: `rm audit-dryrun.log`

- [ ] **Step 5: Commit**

```bash
git add src/data/quranData.ts src/data/canonical/quranCanonical.json
git commit -m "fix(content): heal quranData drift against quran.com canonical (Pass A)"
```

---

## Task 8: Integrity test (CI drift guard)

**Files:**
- Create: `src/__tests__/quranContent.integrity.test.ts`

**Context:** This test imports [quranData.ts](../../../src/data/quranData.ts) and `quranCanonical.json`, then for every entry with an `audioKey` it asserts zero drift. Future hand-edits that diverge will fail this test.

- [ ] **Step 1: Write the test**

Create `src/__tests__/quranContent.integrity.test.ts`:

```ts
import quranContentData from '../data/quranData';
import canonicalJson from '../data/canonical/quranCanonical.json';
import {
  diffContentEntry,
  type CanonicalVerse,
} from '../scripts/auditQuranContent';

const canonical: Record<string, CanonicalVerse> = canonicalJson as Record<string, CanonicalVerse>;

describe('quranContent integrity', () => {
  const entries = quranContentData.filter((e) => !!e.audioKey);

  it('every entry with an audioKey has a canonical snapshot', () => {
    const missing = entries.filter((e) => !canonical[e.audioKey!]);
    expect(missing.map((m) => `${m.id} (${m.audioKey})`)).toEqual([]);
  });

  it.each(entries.map((e) => [e.id, e.audioKey!]))(
    '%s (%s) matches canonical text',
    (_id, audioKey) => {
      const entry = entries.find((e) => e.audioKey === audioKey)!;
      const truth = canonical[audioKey];
      expect(truth).toBeDefined();
      const drift = diffContentEntry(
        { arabicText: entry.arabicText, englishTranslation: entry.englishTranslation },
        truth,
      );
      if (drift.length) {
        throw new Error(
          `Drift in ${entry.id} (${audioKey}): ${drift.join(', ')}. ` +
            `Run: npm run refresh-canonical`,
        );
      }
    },
  );
});
```

- [ ] **Step 2: Configure jest to load JSON**

Check `jest.config.js`. If it doesn't already allow JSON imports (default Jest does), skip this step. If `transform` or `moduleFileExtensions` explicitly excludes `json`, add `'json'`.

Run: `cat jest.config.js | grep -A 5 moduleFileExtensions`

- [ ] **Step 3: Run the test**

Run: `npm test -- --testPathPattern=quranContent.integrity`
Expected: all generated test cases pass (one per entry).

- [ ] **Step 4: Prove the guard works by simulating drift**

Run the following in sequence:
```bash
node -e "const fs=require('fs');let s=fs.readFileSync('src/data/quranData.ts','utf8');s=s.replace(/arabicText: \"[^\"]+\"/,'arabicText: \"TAMPERED\"');fs.writeFileSync('src/data/quranData.ts.tampered',s);"
# Temporarily swap in the tampered file
mv src/data/quranData.ts src/data/quranData.ts.bak
mv src/data/quranData.ts.tampered src/data/quranData.ts
npm test -- --testPathPattern=quranContent.integrity 2>&1 | tail -20
```
Expected: FAIL with a message pointing at `npm run refresh-canonical`.

- [ ] **Step 5: Restore**

```bash
mv src/data/quranData.ts.bak src/data/quranData.ts
npm test -- --testPathPattern=quranContent.integrity
```
Expected: PASS again.

- [ ] **Step 6: Commit**

```bash
git add src/__tests__/quranContent.integrity.test.ts
git commit -m "test(integrity): lock quranData against canonical snapshot"
```

---

## Task 9: Drop `formatTranslation` from VerseLayer

**Files:**
- Modify: `src/components/VerseLayer.tsx`

**Context:** The regex chain in `formatTranslation` is what breaks punctuation in the user's screenshot. With Pass A done, translations in data are already clean — VerseLayer can trust them.

- [ ] **Step 1: Delete the function**

Open `src/components/VerseLayer.tsx`. Delete lines 219–240 (the entire `formatTranslation` function).

- [ ] **Step 2: Replace `formattedTranslation` derivation**

Locate (around line 274): `const formattedTranslation = useMemo(() => formatTranslation(translation), [translation]);`

Replace it with:
```ts
const formattedTranslation = translation ?? '';
```

Remove the now-unused `useMemo` import if nothing else uses it (check with grep: `grep -c useMemo src/components/VerseLayer.tsx`). If it's still used elsewhere in the file, leave the import.

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 4: Spot-check manually**

Launch the app: `npm start` and navigate to the verse screen after selecting a mood. Pick a verse you know has parentheticals in the Sahih International translation (e.g. 2:255 — "[all] existence"). Verify brackets are intact and punctuation is present.

Close the app once verified.

- [ ] **Step 5: Commit**

```bash
git add src/components/VerseLayer.tsx
git commit -m "fix(verse): trust canonical translation; drop regex formatter"
```

---

## Task 10: Use `Content.audioKey` directly in GuidanceScreen

**Files:**
- Modify: `src/screens/GuidanceScreen.tsx`

**Context:** Today [GuidanceScreen.tsx:188–194](../../../src/screens/GuidanceScreen.tsx:188) extracts the audio key by regexing the `source` string ("Surah Al-Baqarah 2:255"). This is fragile and causes the non-Quranic-content-plays-random-verse bug. Use `experience.content.audioKey` directly — it's already normalized and undefined for non-Quranic content.

- [ ] **Step 1: Delete `extractVerseKey`**

Open `src/screens/GuidanceScreen.tsx`. Delete the `extractVerseKey` function (lines 188–194).

- [ ] **Step 2: Replace both call sites**

Find the two call sites (line 134 and line 160):
```ts
audioKey={extractVerseKey(experience.content.source)}
```

Replace both with:
```ts
audioKey={experience.content.audioKey}
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: exits 0. (`audioKey` prop on VerseLayer is already `string | undefined`, so passing `undefined` is valid.)

- [ ] **Step 4: Spot-check**

Launch the app, land on the verse screen for any mood, tap the audio button → verify audio matches the verse shown. Then navigate to a non-Quranic content entry (e.g. a hadith-backed dua if one exists in the current rotation) → verify the audio button is absent or does nothing.

- [ ] **Step 5: Commit**

```bash
git add src/screens/GuidanceScreen.tsx
git commit -m "fix(audio): use Content.audioKey directly; drop source-regex extract"
```

---

## Task 11: ContextLayer refactor — accept typed `blocks`

**Files:**
- Modify: `src/components/ContextLayer.tsx`
- Create: `src/components/__tests__/ContextLayer.test.tsx`

**Context:** Replace the heuristic parsing (`splitIntoSections`, `extractPropheticQuote`, `extractSourceLabel`, `cleanText`) with a block-by-block render. Visual style — section headers, text cards, prophetic quote callout — is preserved.

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/ContextLayer.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import ContextLayer from '../ContextLayer';
import type { ContextBlock } from '../../types';

describe('ContextLayer', () => {
  it('renders a tafsir block with its source chip', () => {
    const blocks: ContextBlock[] = [
      {
        kind: 'tafsir',
        text: 'As-Sa\'di explains that Allah promises ease alongside hardship.',
        source: { label: 'Tafsir As-Sa\'di', url: 'https://quran.com/94/5/tafsirs/170' },
      },
    ];
    const { getByText } = render(<ContextLayer blocks={blocks} />);
    expect(getByText(/As-Sa'di explains/)).toBeTruthy();
    expect(getByText(/Tafsir As-Sa'di/)).toBeTruthy();
  });

  it('renders a hadith block with arabic, transliteration, and grading', () => {
    const blocks: ContextBlock[] = [
      {
        kind: 'hadith',
        text: 'The Prophet ﷺ said, "How wonderful is the affair of the believer..."',
        arabicText: 'عَجَبًا لِأَمْرِ الْمُؤْمِنِ',
        transliteration: "'Ajaban li-amri al-mu'min",
        source: {
          label: 'Sahih Muslim 2999',
          url: 'https://sunnah.com/muslim:2999',
          grading: 'sahih',
        },
      },
    ];
    const { getByText } = render(<ContextLayer blocks={blocks} />);
    expect(getByText(/How wonderful/)).toBeTruthy();
    expect(getByText('عَجَبًا لِأَمْرِ الْمُؤْمِنِ')).toBeTruthy();
    expect(getByText(/'Ajaban/)).toBeTruthy();
    expect(getByText(/Sahih Muslim 2999/)).toBeTruthy();
  });

  it('renders a story block with multiple source chips', () => {
    const blocks: ContextBlock[] = [
      {
        kind: 'story',
        text: 'When Yunus AS was cast into the sea, he cried out from the darkness.',
        citations: [
          { label: 'Surah Al-Anbiya 21:87', url: 'https://quran.com/21/87' },
          { label: 'Sahih al-Bukhari 4622', url: 'https://sunnah.com/bukhari:4622' },
        ],
      },
    ];
    const { getByText } = render(<ContextLayer blocks={blocks} />);
    expect(getByText(/Yunus AS/)).toBeTruthy();
    expect(getByText(/21:87/)).toBeTruthy();
    expect(getByText(/Bukhari 4622/)).toBeTruthy();
  });

  it('renders multiple blocks in order', () => {
    const blocks: ContextBlock[] = [
      { kind: 'tafsir', text: 'FIRST_TAFSIR', source: { label: 'T1', url: 'https://x' } },
      { kind: 'hadith', text: 'SECOND_HADITH', source: { label: 'H1', url: 'https://y', grading: 'sahih' } },
    ];
    const { getByText } = render(<ContextLayer blocks={blocks} />);
    expect(getByText('FIRST_TAFSIR')).toBeTruthy();
    expect(getByText('SECOND_HADITH')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern=ContextLayer`
Expected: FAIL — current `ContextLayer` takes `attribution/text/source` props, not `blocks`.

- [ ] **Step 3: Rewrite ContextLayer**

Replace the entire contents of `src/components/ContextLayer.tsx` with:

```tsx
import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import ArabicText from './ArabicText';
import SourceChip from './SourceChip';
import { ContextBlock, SourceCitation } from '../types';

const { height } = Dimensions.get('window');

interface ContextLayerProps {
  blocks: ContextBlock[];
  scrollY?: Animated.Value;
}

/* ─── Decorative Quote Mark ─────────────────────────────────── */
function QuoteOrnament({ color }: { color: string }) {
  return (
    <Svg width={28} height={22} viewBox="0 0 28 22" style={{ opacity: 0.2 }}>
      <Path
        d="M0 22V13.2C0 10.6 0.5 8.3 1.5 6.3C2.5 4.3 4.2 2.3 6.5 0.5L9.5 3C7.7 4.5 6.4 6.1 5.6 7.8C4.8 9.5 4.4 11.3 4.4 13.2H8.5V22H0ZM15.5 22V13.2C15.5 10.6 16 8.3 17 6.3C18 4.3 19.7 2.3 22 0.5L25 3C23.2 4.5 21.9 6.1 21.1 7.8C20.3 9.5 19.9 11.3 19.9 13.2H24V22H15.5Z"
        fill={color}
      />
    </Svg>
  );
}

/* ─── Tafsir Block ──────────────────────────────────────────── */
function TafsirSection({ text, source }: { text: string; source: SourceCitation }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="book-open-variant" size={16} color={Colors.accent.secondary} />
        <Text style={styles.sectionLabel}>Tafsir</Text>
      </View>
      <View style={styles.textCard}>
        <Text style={styles.bodyText}>{text}</Text>
      </View>
      <View style={styles.chipRow}>
        <SourceChip citation={source} />
      </View>
    </View>
  );
}

/* ─── Hadith Block ──────────────────────────────────────────── */
function HadithSection({
  text,
  arabicText,
  transliteration,
  source,
}: {
  text: string;
  arabicText?: string;
  transliteration?: string;
  source: SourceCitation;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="heart-outline" size={16} color={Colors.accent.warm} />
        <Text style={[styles.sectionLabel, { color: Colors.accent.warm }]}>Prophetic Wisdom</Text>
      </View>
      <View style={styles.quoteCard}>
        <View style={styles.quoteCardInner}>
          <QuoteOrnament color={Colors.accent.secondary} />
          {arabicText ? <ArabicText text={arabicText} style={styles.hadithArabic} /> : null}
          {transliteration ? (
            <Text style={styles.hadithTransliteration}>{transliteration}</Text>
          ) : null}
          <Text style={styles.quoteText}>{text}</Text>
          <Text style={styles.quoteAttribution}>— Prophet Muhammad ﷺ</Text>
        </View>
      </View>
      <View style={styles.chipRow}>
        <SourceChip citation={source} />
      </View>
    </View>
  );
}

/* ─── Story Block ───────────────────────────────────────────── */
function StorySection({ text, citations }: { text: string; citations: SourceCitation[] }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="star-four-points-outline" size={16} color={Colors.accent.primary} />
        <Text style={[styles.sectionLabel, { color: Colors.accent.primary }]}>Story</Text>
      </View>
      <View style={styles.textCard}>
        <Text style={styles.bodyText}>{text}</Text>
      </View>
      <View style={styles.chipRow}>
        {citations.map((c, i) => (
          <SourceChip key={`${c.url}-${i}`} citation={c} />
        ))}
      </View>
    </View>
  );
}

/* ─── ContextLayer ──────────────────────────────────────────── */
const ContextLayer: React.FC<ContextLayerProps> = ({ blocks, scrollY }) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + Spacing.sm, height * 0.02),
          paddingBottom: Math.max(insets.bottom + Spacing.sm, Spacing.xl),
        },
      ]}
    >
      <Animated.ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        fadingEdgeLength={40}
        scrollEventThrottle={16}
        onScroll={
          scrollY
            ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                useNativeDriver: true,
              })
            : undefined
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {blocks.map((block, i) => {
            const key = `${block.kind}-${i}`;
            if (block.kind === 'tafsir') {
              return <TafsirSection key={key} text={block.text} source={block.source} />;
            }
            if (block.kind === 'hadith') {
              return (
                <HadithSection
                  key={key}
                  text={block.text}
                  arabicText={block.arabicText}
                  transliteration={block.transliteration}
                  source={block.source}
                />
              );
            }
            return <StorySection key={key} text={block.text} citations={block.citations} />;
          })}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  scrollArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: Spacing.xxl, paddingTop: Spacing.sm },

  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
    paddingLeft: 4,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.accent.secondary,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },

  textCard: {
    backgroundColor: 'rgba(255, 235, 210, 0.04)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 210, 0.06)',
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 28,
    color: Colors.text.primary,
    fontFamily: Typography.fonts.serif,
    opacity: 0.9,
  },

  quoteCard: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  quoteCardInner: {
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.secondary,
    padding: Spacing.xl,
  },
  hadithArabic: {
    fontSize: 20,
    lineHeight: 38,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  hadithTransliteration: {
    fontFamily: Typography.fonts.serif,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(245, 237, 227, 0.55)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  quoteText: {
    fontFamily: Typography.fonts.serif,
    fontSize: 17,
    lineHeight: 28,
    color: Colors.text.primary,
    fontStyle: 'italic',
    marginTop: Spacing.md,
    opacity: 0.95,
  },
  quoteAttribution: {
    fontSize: 12,
    color: Colors.accent.secondary,
    fontWeight: '600',
    marginTop: Spacing.md,
    letterSpacing: 0.5,
    opacity: 0.7,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingLeft: 4,
  },
});

export default React.memo(ContextLayer);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern=ContextLayer`
Expected: all 4 test cases pass.

- [ ] **Step 5: Run typecheck + full test suite**

Run: `npx tsc --noEmit && npm test`
Expected: exits 0. All tests pass — including the `SourceChip` tests from Task 3.

- [ ] **Step 6: Commit**

```bash
git add src/components/ContextLayer.tsx src/components/__tests__/ContextLayer.test.tsx
git commit -m "refactor(ContextLayer): render typed ContextBlock array; delete parsing heuristics"
```

---

## Task 12: `useLayerConfig` hook

**Files:**
- Create: `src/hooks/useLayerConfig.ts`
- Create: `src/hooks/__tests__/useLayerConfig.test.ts`

**Context:** The dynamic layer sequence builder. Pure function; unit-testable without React.

- [ ] **Step 1: Write failing tests**

Create `src/hooks/__tests__/useLayerConfig.test.ts`:

```ts
import { buildLayerConfig, parsePracticeSteps, nextLayerLabelFor } from '../useLayerConfig';
import type { GuidanceExperience } from '../../types';

function makeExperience(partial: Partial<GuidanceExperience['angle']>): GuidanceExperience {
  return {
    content: {
      id: 'test',
      type: 'Quran',
      primaryText: '',
      englishTranslation: '',
      source: '',
      whyThis: '',
      moods: ['Calm'],
    },
    angle: {
      id: 'a1',
      contentId: 'test',
      mood: 'Calm',
      angle: '',
      ...partial,
    },
  };
}

describe('buildLayerConfig', () => {
  it('returns only verse when no other content is present', () => {
    expect(buildLayerConfig(makeExperience({}))).toEqual(['verse']);
  });

  it('includes context when contextBlocks has entries', () => {
    const exp = makeExperience({
      contextBlocks: [{ kind: 'tafsir', text: 't', source: { label: 'T', url: 'https://x' } }],
    });
    expect(buildLayerConfig(exp)).toEqual(['verse', 'context']);
  });

  it('includes practice when practiceSteps parses to a non-empty array', () => {
    const exp = makeExperience({
      practiceSteps: JSON.stringify([{ type: 'mindset', icon: 'star', title: 't', instruction: 'i', source: 's', sourceType: 'quran_dua' }]),
    });
    expect(buildLayerConfig(exp)).toEqual(['verse', 'practice']);
  });

  it('includes reflection when reflection prompt is present', () => {
    expect(buildLayerConfig(makeExperience({ reflection: 'What does this mean to you?' }))).toEqual([
      'verse',
      'reflection',
    ]);
  });

  it('orders all layers correctly when all present', () => {
    const exp = makeExperience({
      contextBlocks: [{ kind: 'tafsir', text: 't', source: { label: 'T', url: 'https://x' } }],
      practiceSteps: JSON.stringify([{ type: 'mindset', icon: 'star', title: 't', instruction: 'i', source: 's', sourceType: 'quran_dua' }]),
      reflection: 'prompt',
    });
    expect(buildLayerConfig(exp)).toEqual(['verse', 'context', 'practice', 'reflection']);
  });
});

describe('parsePracticeSteps', () => {
  it('returns [] for undefined', () => {
    expect(parsePracticeSteps(undefined)).toEqual([]);
  });

  it('returns [] for invalid JSON', () => {
    expect(parsePracticeSteps('{not json}')).toEqual([]);
  });

  it('parses a valid JSON array', () => {
    const json = JSON.stringify([{ type: 'mindset' }]);
    expect(parsePracticeSteps(json)).toHaveLength(1);
  });
});

describe('nextLayerLabelFor', () => {
  it('returns the name of the layer after the current index', () => {
    const layers = ['verse', 'context', 'practice', 'reflection'] as const;
    expect(nextLayerLabelFor(layers, 0)).toBe('Tafsir');
    expect(nextLayerLabelFor(layers, 1)).toBe('Practice');
    expect(nextLayerLabelFor(layers, 2)).toBe('Reflect');
  });

  it('returns undefined on the final layer', () => {
    const layers = ['verse', 'context', 'practice', 'reflection'] as const;
    expect(nextLayerLabelFor(layers, 3)).toBeUndefined();
  });

  it('returns undefined when only verse is present', () => {
    expect(nextLayerLabelFor(['verse'], 0)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern=useLayerConfig`
Expected: FAIL with "Cannot find module '../useLayerConfig'".

- [ ] **Step 3: Implement**

Create `src/hooks/useLayerConfig.ts`:

```ts
import { GuidanceExperience } from '../types';
import type { PracticeStepData } from '../components/PracticeLayer';

export type LayerKind = 'verse' | 'context' | 'practice' | 'reflection';

/**
 * Parse the JSON-serialized practiceSteps string on ContentAngle.
 * Returns [] on null/undefined/invalid JSON — config builder degrades gracefully.
 */
export function parsePracticeSteps(raw: string | undefined | null): PracticeStepData[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PracticeStepData[]) : [];
  } catch {
    return [];
  }
}

/**
 * Derive the layer sequence for a given experience. Layers are included only
 * when their content is present — no empty screens, no filler.
 */
export function buildLayerConfig(experience: GuidanceExperience): LayerKind[] {
  const layers: LayerKind[] = ['verse'];
  if (experience.angle.contextBlocks && experience.angle.contextBlocks.length > 0) {
    layers.push('context');
  }
  if (parsePracticeSteps(experience.angle.practiceSteps).length > 0) {
    layers.push('practice');
  }
  if (experience.angle.reflection) {
    layers.push('reflection');
  }
  return layers;
}

/**
 * User-facing label for the layer that comes after the current one.
 * Returned as "Tafsir" / "Practice" / "Reflect". Undefined when there is no next layer.
 */
const LAYER_LABEL: Record<LayerKind, string> = {
  verse: 'Verse',
  context: 'Tafsir',
  practice: 'Practice',
  reflection: 'Reflect',
};

export function nextLayerLabelFor(
  layers: readonly LayerKind[],
  currentIndex: number,
): string | undefined {
  const next = layers[currentIndex + 1];
  return next ? LAYER_LABEL[next] : undefined;
}
```

**Note:** You may need to export `PracticeStepData` from `src/components/PracticeLayer.tsx` if it isn't already exported. Check:
```bash
grep 'export' src/components/PracticeLayer.tsx | head -5
```
If `PracticeStepData` is only declared (not exported), change `export interface PracticeStepData` — the type is already marked `export interface` per the file we read, so this should be fine.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern=useLayerConfig`
Expected: all 11 test cases pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useLayerConfig.ts src/hooks/__tests__/useLayerConfig.test.ts
git commit -m "feat(hooks): add useLayerConfig for dynamic layer sequencing"
```

---

## Task 13: Wire all layers in GuidanceScreen

**Files:**
- Modify: `src/screens/GuidanceScreen.tsx`

**Context:** Replace the hardcoded `totalLayers = 1` / `currentLayer === 0` dispatch with the dynamic `useLayerConfig` output. All four layers become reachable when their content is present.

- [ ] **Step 1: Import new helpers**

At the top of `src/screens/GuidanceScreen.tsx`, add:
```ts
import ContextLayer from '../components/ContextLayer';
import PracticeLayer from '../components/PracticeLayer';
import ReflectionLayer from '../components/ReflectionLayer';
import { buildLayerConfig, nextLayerLabelFor, parsePracticeSteps } from '../hooks/useLayerConfig';
```

- [ ] **Step 2: Replace totalLayers and LAYER_TYPES**

Remove the existing `const totalLayers = 1;` and `const LAYER_TYPES: Array<'verse'> = ['verse'];`.

After the `const { experience, mood, islamicTerm } = route.params;` line, add:
```ts
const layers = React.useMemo(() => buildLayerConfig(experience), [experience]);
const totalLayers = layers.length;
const nextLayerLabel = nextLayerLabelFor(layers, currentLayer);
const practiceSteps = React.useMemo(
  () => parsePracticeSteps(experience?.angle?.practiceSteps),
  [experience?.angle?.practiceSteps],
);
```
Move this block to just after `const [currentLayer, setCurrentLayer] = useState(0);` (currentLayer needs to be declared first). Add `import React from 'react'` if not already at the top (it is).

- [ ] **Step 3: Replace the layer dispatch**

Find the existing block:
```tsx
{currentLayer === 0 && (
  <VerseLayer ...props.../>
)}
```

Replace it with:
```tsx
{layers[currentLayer] === 'verse' && (
  <VerseLayer
    arabic={experience.content.arabicText || ''}
    translation={experience.content.translation || experience.content.englishTranslation}
    reference={experience.content.source || ''}
    transliteration={experience.content.transliteration}
    showTransliteration={preferences.showTransliteration}
    primaryLanguage={preferences.primaryLanguage}
    scrollY={scrollY}
    accentColor={(MoodColors[mood] || MoodColors.Calm).accent}
    onNextVerse={() => {
      scrollY.setValue(0);
      onNext();
      setCurrentLayer(0);
    }}
    onShare={handleShareVerse}
    onSave={() => handleSave(0)}
    isSaved={!!savedStates[0]}
    audioKey={experience.content.audioKey}
    nextLayerLabel={nextLayerLabel}
  />
)}
{layers[currentLayer] === 'context' && experience.angle.contextBlocks && (
  <ContextLayer blocks={experience.angle.contextBlocks} scrollY={scrollY} />
)}
{layers[currentLayer] === 'practice' && (
  <PracticeLayer
    steps={practiceSteps}
    onCheckAll={() => setCurrentLayer(currentLayer + 1)}
    scrollY={scrollY}
  />
)}
{layers[currentLayer] === 'reflection' && experience.angle.reflection && (
  <ReflectionLayer
    prompt={experience.angle.reflection}
    onComplete={(reflection) => {
      onSaveReflection(reflection);
      onNext();
      setCurrentLayer(0);
    }}
    scrollY={scrollY}
  />
)}
```

- [ ] **Step 4: Remove the `FloatingActionRow` block**

The existing block (`currentLayer !== 0 && <FloatingActionRow ...>`) is now stale — all layers will get their own bottom rail in Task 14. Delete the block (GuidanceScreen.tsx:153–164).

Remove the `import FloatingActionRow` line at the top as well.

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: exits 0. VerseLayer currently doesn't accept `nextLayerLabel` — that's fine, it'll be added in a later step in this task. Actually, let's add the prop now to avoid a type error:

Open `src/components/VerseLayer.tsx`. Find the `VerseLayerProps` interface and add `nextLayerLabel?: string;` at the end. In the `VerseLayer` functional component, destructure `nextLayerLabel` from props. In the swipe-hint text, replace the static `'Explore'` with:
```tsx
<Text style={styles.swipeHintText}>{nextLayerLabel || 'Explore'}</Text>
```

Also add `nextLayerLabel` as a prop to the `PracticeLayer` and `ReflectionLayer` for future use (even if not wired yet) — or defer. For simplicity, defer: only `VerseLayer` needs it now for swipe hint compatibility.

Run: `npx tsc --noEmit` again.
Expected: exits 0.

- [ ] **Step 6: Spot-check in app**

Launch: `npm start`. Navigate to a verse whose angle has no `contextBlocks` — should behave exactly as before (one layer, swipe up = next verse). The curatorial content doesn't exist yet, so this is the expected baseline.

- [ ] **Step 7: Commit**

```bash
git add src/screens/GuidanceScreen.tsx src/components/VerseLayer.tsx
git commit -m "feat(guidance): wire all layers via useLayerConfig; dynamic layer sequence"
```

---

## Task 14: Extract `LayerBottomRail`

**Files:**
- Create: `src/components/LayerBottomRail.tsx`
- Modify: `src/components/VerseLayer.tsx`
- Modify: `src/components/PracticeLayer.tsx`
- Modify: `src/components/ReflectionLayer.tsx`

**Context:** Pull VerseLayer's 3-zone footer (left FAB, center hint, right next) into a shared component. All layers use it for a consistent bottom-rail grammar.

- [ ] **Step 1: Create `LayerBottomRail`**

Create `src/components/LayerBottomRail.tsx`:

```tsx
import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme/DesignSystem';
import { HapticsService } from '../services/hapticsService';

interface LayerBottomRailProps {
  /** Left slot — typically the expandable actions FAB. Pass the already-configured element. */
  leftSlot?: React.ReactNode;
  /** Middle swipe-hint text (e.g. "Tafsir"). Hidden when undefined. */
  nextLayerLabel?: string;
  /** Right slot tap handler — advances to the next layer (or to next verse on the final layer). */
  onNext?: () => void;
  /** Override the right-slot icon. Defaults to arrow-forward. */
  nextIcon?: keyof typeof Ionicons.glyphMap;
}

const LayerBottomRail: React.FC<LayerBottomRailProps> = ({
  leftSlot,
  nextLayerLabel,
  onNext,
  nextIcon = 'arrow-forward',
}) => {
  const hintOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!nextLayerLabel) {
      hintOpacity.setValue(0);
      return;
    }
    const timer = setTimeout(() => {
      Animated.sequence([
        Animated.timing(hintOpacity, { toValue: 0.7, duration: 600, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(hintOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]).start();
    }, 1500);
    return () => clearTimeout(timer);
  }, [nextLayerLabel]);

  return (
    <View style={styles.footer}>
      <View style={styles.slot}>{leftSlot}</View>

      <Animated.View style={[styles.center, { opacity: hintOpacity }]}>
        {nextLayerLabel ? (
          <>
            <Ionicons name="chevron-up" size={18} color={'rgba(245, 237, 227, 0.35)'} />
            <Text style={styles.hintText}>{nextLayerLabel}</Text>
          </>
        ) : null}
      </Animated.View>

      <View style={styles.slot}>
        {onNext ? (
          <TouchableOpacity
            onPress={() => {
              HapticsService.impactAsync('LIGHT');
              onNext();
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={nextLayerLabel ? `Go to ${nextLayerLabel}` : 'Next verse'}
          >
            <BlurView intensity={30} tint="dark" style={styles.nextFab}>
              <Ionicons name={nextIcon} size={22} color={Colors.text.primary} />
            </BlurView>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    minHeight: 64,
  },
  slot: {
    width: 60,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 10,
    color: 'rgba(245, 237, 227, 0.45)',
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  nextFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 235, 210, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 210, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

export default React.memo(LayerBottomRail);
```

- [ ] **Step 2: Adopt in VerseLayer**

Open `src/components/VerseLayer.tsx`. Replace the entire `<View style={styles.footer}>...</View>` block (lines 377–413, the footer at the end of the JSX) with:
```tsx
<LayerBottomRail
  leftSlot={
    onShare && onSave ? (
      <ActionsFAB
        accentColor={accentColor}
        onShare={onShare}
        onSave={onSave}
        isSaved={isSaved}
        audioKey={audioKey}
      />
    ) : null
  }
  nextLayerLabel={nextLayerLabel}
  onNext={onNextVerse}
/>
```

Add the import at the top: `import LayerBottomRail from './LayerBottomRail';`.

Delete the now-unused footer styles at the bottom (`footer`, `fabLeft`, `fabRight`, `swipeHintCenter`, `swipeHintText`, `nextFab` — the last three are now in `LayerBottomRail`). `ActionsFAB` local component and its `fabContainer` / `fabMain` / `fabAction*` styles stay — they're the left-slot content.

Also delete the `swipeHintOpacity` animation block (lines 261–272) and its JSX usage — `LayerBottomRail` owns the swipe-hint animation now.

- [ ] **Step 3: Adopt in PracticeLayer**

Open `src/components/PracticeLayer.tsx`. Add `nextLayerLabel?: string;` to `PracticeLayerProps`. Accept it in the destructuring. At the bottom of the layer's JSX, add:
```tsx
<LayerBottomRail nextLayerLabel={nextLayerLabel} onNext={onCheckAll} />
```

Import: `import LayerBottomRail from './LayerBottomRail';`.

- [ ] **Step 4: Adopt in ReflectionLayer**

Open `src/components/ReflectionLayer.tsx`. Add `nextLayerLabel?: string;` to `ReflectionLayerProps`. Accept it in the destructuring. Reflection is always the last layer, so `nextLayerLabel` will typically be undefined — `LayerBottomRail` handles that by hiding the hint. The existing "Complete Session" button stays as the primary action. If the reflection layer already has a bottom button, do NOT add a `LayerBottomRail` — it would conflict visually. Inspect the file first:

Run: `grep -n 'buttonText\|Complete Session\|footer' src/components/ReflectionLayer.tsx`

If ReflectionLayer has its own button at the bottom, leave it — the prop `nextLayerLabel` is accepted but unused for now. Only GuidanceScreen will pass it for future compatibility.

- [ ] **Step 5: Thread `nextLayerLabel` through GuidanceScreen**

Open `src/screens/GuidanceScreen.tsx`. On the `<PracticeLayer>` and `<ReflectionLayer>` invocations, add `nextLayerLabel={nextLayerLabel}`.

- [ ] **Step 6: Run typecheck and tests**

Run: `npx tsc --noEmit && npm test`
Expected: exits 0, all tests pass.

- [ ] **Step 7: Spot-check**

Launch: `npm start`. Verify the verse screen's bottom rail still shows left FAB + center hint + right next. Swipe up should no longer be blocked.

- [ ] **Step 8: Check if `FloatingActionRow` is now orphaned**

Run: `grep -r 'FloatingActionRow' src/`
Expected: only `src/components/FloatingActionRow.tsx` itself matches (the import was removed in Task 13). If so, delete the file:
```bash
git rm src/components/FloatingActionRow.tsx
```

If there are other references (e.g. a test, a different screen), leave the file.

- [ ] **Step 9: Commit**

```bash
git add src/components/LayerBottomRail.tsx src/components/VerseLayer.tsx src/components/PracticeLayer.tsx src/components/ReflectionLayer.tsx src/screens/GuidanceScreen.tsx
git rm src/components/FloatingActionRow.tsx 2>/dev/null || true
git commit -m "feat(components): extract LayerBottomRail; unify 3-zone rail across layers"
```

---

## Task 15: AudioPlayerButton resume-after-finish cleanup

**Files:**
- Modify: `src/components/AudioPlayerButton.tsx`

**Context:** The current resume logic uses a `currentVerseIndex` + tangled `useEffect` chain ([AudioPlayerButton.tsx:80–101](../../../src/components/AudioPlayerButton.tsx:80)) with an odd branch that checks `didJustFinish` inside `handlePress`. Simplify to a clear state machine: the player auto-advances through the range, resets `currentVerseIndex` to 0 on completion, and `handlePress` just toggles play/pause.

- [ ] **Step 1: Identify exact lines**

Run: `grep -n 'currentVerseIndex\|didJustFinish' src/components/AudioPlayerButton.tsx`

- [ ] **Step 2: Rewrite the resume logic**

In `src/components/AudioPlayerButton.tsx`, replace the two `useEffect`s that handle `didJustFinish` and the `currentVerseIndex > 0` resume (lines ~80–101 in the original) with the following:

```tsx
// Auto-advance through a verse range. When a source finishes:
//   - if there are more verses in the range, advance (the next useEffect plays them)
//   - otherwise reset to the first verse (ready for replay) and stay paused
useEffect(() => {
  if (!status?.didJustFinish) return;
  if (currentVerseIndex < audioUrls.length - 1) {
    setCurrentVerseIndex((prev) => prev + 1);
  } else {
    player.seekTo(0);
    player.pause();
    setCurrentVerseIndex(0);
  }
}, [status?.didJustFinish]);

// When currentVerseIndex changes mid-range (i.e. after auto-advance), start
// playback of the new source automatically.
useEffect(() => {
  if (currentVerseIndex > 0) {
    player.play();
  }
}, [currentVerseIndex]);
```

And simplify `handlePress`:
```tsx
const handlePress = () => {
  if (isLocked) return;
  try {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  } catch (error) {
    console.error('Audio playback error:', error);
  }
};
```

- [ ] **Step 3: Run typecheck and existing tests**

Run: `npx tsc --noEmit && npm test`
Expected: exits 0.

- [ ] **Step 4: Spot-check**

Launch the app. For a single-verse audio (e.g. `2:255`), tap play — verify it plays, auto-stops at the end, tap play again — verify it replays from the start. For a range (e.g. `94:5-6`), verify both verses play back-to-back, then tap pause mid-second-verse and tap play again — verify it resumes from the paused position.

- [ ] **Step 5: Commit**

```bash
git add src/components/AudioPlayerButton.tsx
git commit -m "refactor(audio): simplify resume-after-finish state machine"
```

---

## Task 16: Pass B — Overwhelmed mood contextBlocks

**Files:**
- Modify: `src/data/quranData.ts`

**Context:** First curatorial batch. For every angle whose `mood === 'Overwhelmed'`, write `contextBlocks: ContextBlock[]` — at minimum a tafsir block, optionally a hadith when one truly deepens the meaning, optionally a story when a prophet/sahaba narrative fits the mood. Quality matters more than quantity; skip hadith and story if they'd be filler.

This task is curatorial. It produces real user-visible content. Work in review-friendly chunks.

- [ ] **Step 1: List all Overwhelmed angles**

Run: `grep -n "mood: 'Overwhelmed'" src/data/quranData.ts | head -20`
Note the line numbers. For each, find the corresponding `ContentAngle` entry and the linked `Content` entry (by `contentId`).

- [ ] **Step 2: For each Overwhelmed angle, author one tafsir block**

Template — paste inside the `ContentAngle` object, after the `mood: 'Overwhelmed',` line:
```ts
  contextBlocks: [
    {
      kind: 'tafsir',
      text: 'As-Sa\'di explains that …',
      source: {
        label: 'Tafsir As-Sa\'di',
        url: quranTafsirUrl('94:5', TAFSIR_IDS.AS_SADI),
      },
    },
  ],
```

Tafsir text guidance:
- 2–4 sentences
- Plain, youth-accessible English (as agreed in brainstorming)
- Based on the substantive meaning of As-Sa'di's entry for that verse on quran.com/{chapter}/{verse}/tafsirs/{AS_SADI_ID} — rephrase in your own words, do not copy-paste
- End without a source dump; the chip carries the citation

**Import:** at the top of `src/data/quranData.ts`, add:
```ts
import { quranTafsirUrl, sunnahUrl, TAFSIR_IDS } from '../services/sourceLinks';
```

- [ ] **Step 3: Add hadith blocks where they add real value**

For each verse where the Prophet ﷺ made a specific, verifiable statement that deepens the verse's meaning, add a second block:
```ts
    {
      kind: 'hadith',
      text: '"How wonderful is the affair of the believer..."',
      arabicText: 'عَجَبًا لِأَمْرِ الْمُؤْمِنِ…',  // optional
      transliteration: "'Ajaban li-amri al-mu'min…",  // optional
      source: {
        label: 'Sahih Muslim 2999',
        url: sunnahUrl('muslim', '2999'),
        grading: 'sahih',
      },
    },
```

Rules:
- Every hadith MUST be from a major authenticated collection (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah, Muwatta, Ahmad). Use the canonical sunnah.com collection slug.
- Every hadith MUST have a `grading` — look it up on sunnah.com (the site shows gradings on each hadith page). If unsure → skip the hadith rather than guess.
- If a verse has no hadith that genuinely deepens the meaning → skip. Filler is worse than absence.

- [ ] **Step 4: Add story blocks where a prophet/sahaba narrative fits**

For Overwhelmed specifically, Yunus AS (swallowed by the whale, cried out from darkness — Surah Al-Anbiya 21:87) and Ya'qub AS (patience in grief — Surah Yusuf) are strong candidates. Template:
```ts
    {
      kind: 'story',
      text: 'When Yunus AS was cast into the darkness of the sea, he cried out: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers." Allah responded, and Yunus was delivered — a reminder that turning to Allah in the depths of overwhelm is never too late.',
      citations: [
        { label: 'Surah Al-Anbiya 21:87', url: quranVerseUrl('21:87') },
        { label: 'Sahih al-Bukhari 4622', url: sunnahUrl('bukhari', '4622') },
      ],
    },
```

Add `quranVerseUrl` to the import line from Step 2.

Rules:
- Story text = 2–5 sentences, narrative voice, names the prophet/sahaba
- At least 2 citations per story (verse + hadith or multiple verses)
- One story per angle at most
- If no story genuinely fits → skip

- [ ] **Step 5: Typecheck after each 3–5 edits**

Don't batch all edits without verifying. Every few entries:
```bash
npx tsc --noEmit
```
Fix any type errors before proceeding.

- [ ] **Step 6: Spot-check in-app**

Launch: `npm start`, select Overwhelmed mood, navigate to a verse you just authored. Verify:
- Swipe up from verse → Context layer appears with tafsir block
- Tafsir text renders without brackets/raw metadata
- Source chip is tappable → opens quran.com in browser
- If hadith/story blocks were added, they appear below tafsir in correct order

Go through every Overwhelmed angle this way.

- [ ] **Step 7: Run full test suite**

Run: `npm test`
Expected: all tests pass including integrity test (content changes are in `ContentAngle`, not `Content.arabicText`/`englishTranslation`, so the integrity guard is unaffected).

- [ ] **Step 8: Commit**

```bash
git add src/data/quranData.ts
git commit -m "content(overwhelmed): add tafsir/hadith/story contextBlocks for all Overwhelmed angles"
```

---

## Task 17: Content authoring guide

**Files:**
- Create: `docs/superpowers/content-authoring.md`

**Context:** The curatorial process for subsequent moods needs a written standard. This guide documents the `ContextBlock` shape, the quality bar for each kind, and the URL conventions.

- [ ] **Step 1: Write the guide**

Create `docs/superpowers/content-authoring.md`:

```markdown
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
  text: '2–4 plain-English sentences explaining the verse based on As-Sa\'di.',
  source: {
    label: 'Tafsir As-Sa\'di',
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/content-authoring.md
git commit -m "docs(content): authoring guide for ContextBlock curation"
```

---

## Self-review checklist

After all tasks complete, cross-check against the spec:

- [ ] **§1 Data model** — SourceCitation, ContextBlock added ✓ (Task 1). Content.audioKey contract implicit; unchanged field name. ✓
- [ ] **§2 Layer wiring** — buildLayerConfig implemented ✓ (Task 12), wired ✓ (Task 13), nextLayerLabel threaded ✓ (Tasks 13, 14).
- [ ] **§3 ContextLayer refactor** — parsing helpers deleted, blocks rendering added, SourceChip integrated ✓ (Tasks 3, 11).
- [ ] **§4 Translation & audio integrity** — formatTranslation deleted ✓ (Task 9), audit script ✓ (Tasks 4–7), integrity test ✓ (Task 8), audioKey direct usage ✓ (Task 10), AudioPlayerButton cleanup ✓ (Task 15).
- [ ] **§5 Layout polish** — LayerBottomRail ✓ (Task 14), applied to all 3 layers ✓. FloatingActionRow removal conditional ✓.
- [ ] **§6 Migration Pass A** — Task 7. **§6 Pass B (Overwhelmed)** — Task 16.
- [ ] **Resolved decisions** — Overwhelmed first ✓, hand-edit TS ✓, no analytics on SourceChip ✓ (it only calls Linking.openURL).

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-verses-screen-context-layer.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — batch execution with checkpoints in this session.

Which approach would you like?
