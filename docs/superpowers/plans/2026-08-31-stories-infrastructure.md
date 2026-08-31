# Stories Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional per-verse `story` to `Content` — plumbed from `quranData.ts` through SQLite and Supabase to a new third guidance layer — so narrative content has a correct home before any is authored.

**Architecture:** `story` is a JSON blob on the `content` table, copying `propheticPractice`'s existing end-to-end plumbing exactly. The guidance flow gains a third layer, **appended** after `context` so `GuidanceScreen`'s two hardcoded layer indices stay valid; those indices are then replaced with computed lookups. A new `verify-stories.mjs` owns the seed-and-read roundtrip and the citation checks.

**Tech Stack:** TypeScript, React Native (Expo), `expo-sqlite`, Supabase (`@supabase/supabase-js`), Jest + `@testing-library/react-native`, `node:sqlite` (`DatabaseSync`) for verifier scripts.

**Spec:** [`docs/superpowers/specs/2026-08-31-mood-pools-and-stories-design.md`](../specs/2026-08-31-mood-pools-and-stories-design.md) — §3 and §4.1 Phase 0. Read it alongside this plan.

## Global Constraints

- **This plan is Phase 0 only.** No story content and no mood angles are authored here beyond one pilot. Content is Plan B, which is written after this lands.
- **`src/data/quranData.ts` is CRLF and ~15.6k lines.** Never run `prettier --write` on it. Any scripted edit goes in a **file**, never `node -e`; locates edits **structurally**; asserts **exactly one match per edit**; writes nothing if any edit fails; preserves CRLF; quotes `id` with `'`.
- **Two `content` DDLs must stay byte-identical:** `src/database/tables.ts:16` (fresh install) and `src/database/operations.ts:178` (version-refresh recreate).
- **Three `content` INSERT sites are positional:** `seedContent.ts:380`, `seedContent.ts:486`, `guidanceWindowFetch.ts:162`. `batchInsert`'s `columnsPerRow` argument must be updated with the column list, or rows silently shift.
- **`story.sourceType` is `'quran_narrative' | 'hadith_narrative'`** — a new union, separate from `PracticeStepData.sourceType`. `grading` is lowercase `'sahih' | 'hasan'`.
- **Animation:** animate `transform`/`opacity` only. A skip-the-intro tap must hold the `CompositeAnimation` in a ref and stop it before writing, guard the completion callback on `finished`, and **gate styles on the completion flag** (`revealComplete ? 1 : anim`). The third part is the load-bearing one.
- **Spacing/typography from `DesignSystem.ts` tokens only.** No magic numbers.
- **Verifier convention:** a script with a negative mode is green only when **both** modes exit 0. Every new check states in its own header what it does **not** catch.
- Typecheck after every task: `npx tsc --noEmit -p tsconfig.json`

---

### Task 1: `story` on the type and both DDLs

**Files:**
- Modify: `src/types/index.ts` (the `Content` interface, after `propheticPractice`)
- Modify: `src/database/tables.ts:16-29` (fresh-install DDL)
- Modify: `src/database/operations.ts:7` (`CURRENT_DB_VERSION`)
- Modify: `src/database/operations.ts:178-190` (version-refresh recreate DDL)
- Test: `src/database/__tests__/contentSchema.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `Content.story?: ContentStory` and the exported type `ContentStory`. Tasks 2, 3, 4, 5, 7 and 9 all reference `ContentStory` by that name.

- [ ] **Step 1: Write the failing test**

The two DDLs drifting is the hazard this task exists to prevent, so the test compares them to each other rather than to a hardcoded string.

```ts
// src/database/__tests__/contentSchema.test.ts
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..', '..', '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

/** Pull the column lines out of a `CREATE TABLE ... content (...)` block. */
function contentColumns(src: string): string[] {
  const start = src.indexOf('CREATE TABLE IF NOT EXISTS content (');
  if (start === -1) throw new Error('no content DDL found');
  const end = src.indexOf(');', start);
  return src
    .slice(src.indexOf('(', start) + 1, end)
    .split('\n')
    .map((l) => l.trim().replace(/,$/, ''))
    .filter(Boolean);
}

describe('content table schema', () => {
  const fresh = contentColumns(read('src/database/tables.ts'));
  const refresh = contentColumns(read('src/database/operations.ts'));

  it('declares the same columns in both DDLs', () => {
    expect(refresh).toEqual(fresh);
  });

  it('has a story column', () => {
    expect(fresh).toContain('story TEXT');
  });

  it('bumps CURRENT_DB_VERSION so existing installs recreate the table', () => {
    const m = read('src/database/operations.ts').match(/CURRENT_DB_VERSION = (\d+)/);
    expect(Number(m?.[1])).toBeGreaterThanOrEqual(12);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest contentSchema -t "has a story column"`
Expected: FAIL — `expect(received).toContain('story TEXT')`, and the `CURRENT_DB_VERSION` case fails with `11`. The "same columns" case should **pass** already; that is the baseline proving the comparison works before the change, not after.

- [ ] **Step 3: Add the type**

In `src/types/index.ts`, above `export interface Content`:

```ts
/**
 * An optional narrative attached to a verse — a story from the Quran or a
 * hadith that the ayah calls to mind. Optional by design: a verse gets one
 * only when a story genuinely belongs, because filler beside scripture reads
 * worse than silence.
 *
 * `sourceType` is deliberately NOT PracticeStepData's union. That vocabulary
 * (quran_dua, prophetic_dhikr, ...) describes what a practice step *is*; none
 * of its members mean "narrative".
 */
export interface ContentStory {
  title: string;
  body: string;
  /** "Surah Yusuf 12:15-20" or "Sahih al-Bukhari 3339" — always locatable. */
  source: string;
  sourceType: 'quran_narrative' | 'hadith_narrative';
  /** hadith_narrative only. Lowercase; HadithLayer title-cases for display. */
  grading?: 'sahih' | 'hasan';
}
```

Then inside `Content`, immediately after the `propheticPractice` block:

```ts
  story?: ContentStory;
```

- [ ] **Step 4: Add the column to both DDLs**

In `src/database/tables.ts`, in the `content` definition, after `propheticPractice TEXT,`:

```
      story TEXT,
```

In `src/database/operations.ts`, in the recreate block, after `propheticPractice TEXT,`:

```
          story TEXT,
```

Indentation differs between the two files (6 spaces vs 10). The test normalises with `.trim()`, so this is correct, not a drift.

- [ ] **Step 5: Bump the DB version**

`src/database/operations.ts:7`:

```ts
const CURRENT_DB_VERSION = 12; // Increment this to force a content refresh
```

This drops and recreates `content_moods`, `content_angles`, `content` on every install. Those three are seed data. None of `clearAllLocalUserData`'s seven personal tables are in the drop list, so no user data is touched.

- [ ] **Step 6: Run tests and typecheck**

Run: `npx jest contentSchema && npx tsc --noEmit -p tsconfig.json`
Expected: 3 passing, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts src/database/tables.ts src/database/operations.ts src/database/__tests__/contentSchema.test.ts
git commit -m "feat(content): add optional story field and column"
```

---

### Task 2: The three positional INSERT sites

**Files:**
- Modify: `src/database/seedContent.ts:361-385` (Quran seed)
- Modify: `src/database/seedContent.ts:467-491` (hadith seed)
- Modify: `src/services/guidanceWindowFetch.ts:160-180` (synthetic content)
- Test: `src/database/__tests__/contentSchema.test.ts` (extend)

**Interfaces:**
- Consumes: `Content.story` from Task 1.
- Produces: nothing new. Task 9's pilot relies on these writing the column.

- [ ] **Step 1: Write the failing test**

The failure mode here is a column list and its `columnsPerRow` count drifting apart — silent row corruption, not an error. Test the arithmetic, not the behaviour.

Append to `src/database/__tests__/contentSchema.test.ts`:

```ts
describe('content INSERT sites stay positional-consistent', () => {
  const sites = [
    ['src/database/seedContent.ts', 2],
    ['src/services/guidanceWindowFetch.ts', 1],
  ] as const;

  it('every INSERT INTO content column list matches its placeholder count', () => {
    for (const [file, expectedCount] of sites) {
      const src = read(file);
      const blocks = [...src.matchAll(/INSERT OR REPLACE INTO content\s*\n?\s*\(([^)]+)\)/g)];
      expect(blocks).toHaveLength(expectedCount);

      for (const b of blocks) {
        const columns = b[1].split(',').map((c) => c.trim()).filter(Boolean);
        expect(columns).toContain('story');

        const after = src.slice(b.index! + b[0].length, b.index! + b[0].length + 400);
        const literal = after.match(/VALUES \(([?,\s]+)\)/);
        const perRow = after.match(/VALUES `,\s*\n\s*(\d+),/);

        if (literal) {
          expect(literal[1].split(',').length).toBe(columns.length);
        } else if (perRow) {
          expect(Number(perRow[1])).toBe(columns.length);
        } else {
          throw new Error(`no placeholder count found after INSERT in ${file}`);
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest contentSchema -t "positional-consistent"`
Expected: FAIL — `expect(columns).toContain('story')` on the first block.

- [ ] **Step 3: Update both seeder sites**

In `src/database/seedContent.ts`, in **both** `contentRows` maps (Quran ~line 361, hadith ~line 467), after the `propheticPractice` entry:

```ts
      item.story ? JSON.stringify(item.story) : null,
```

In **both** `batchInsert` calls, the column list becomes:

```
       `INSERT OR REPLACE INTO content
          (id, type, primaryText, arabicText, transliteration, englishTranslation,
           source, audioKey, whyThis, propheticPractice, story, optionalAction,
           optionalReflection, prayerContext)
        VALUES `,
       14,
```

The `13` → `14` is the load-bearing edit. Both call sites.

- [ ] **Step 4: Update guidanceWindowFetch**

`persistSyntheticContent` writes synthetic verses (Al-Kahf, Friday banner) that have no story. Add the column and a `null`, keeping the position aligned:

```ts
        await db.runAsync(
          `INSERT OR REPLACE INTO content
             (id, type, primaryText, arabicText, transliteration, englishTranslation,
              source, audioKey, whyThis, propheticPractice, story, optionalAction,
              optionalReflection, prayerContext)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            c.id,
            c.type,
            c.primaryText,
            c.arabicText ?? null,
            c.transliteration ?? null,
            c.englishTranslation ?? '',
            c.source ?? '',
            c.audioKey ?? null,
            c.whyThis ?? '',
            null,
            c.story ? JSON.stringify(c.story) : null,
            c.optionalAction ?? null,
            c.optionalReflection ?? null,
            null,
          ],
        );
```

Note the placeholder list gains a 14th `?`.

- [ ] **Step 5: Run tests and typecheck**

Run: `npx jest contentSchema && npx tsc --noEmit -p tsconfig.json`
Expected: 4 passing, no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/database/seedContent.ts src/services/guidanceWindowFetch.ts src/database/__tests__/contentSchema.test.ts
git commit -m "feat(content): write story through all three insert sites"
```

---

### Task 3: The read path — SQLite and Supabase row mapping

**Files:**
- Modify: `src/services/contentRepository.ts` — `ContentRow`/`ContentAngleRow` shapes (~lines 38-80), `mapCloudRow` (~line 118), `mapLocalRow` (~line 165), the `fetchForMoodLocal` SELECT (~line 264)
- Test: `src/services/__tests__/contentStory.test.ts` (create)

**Interfaces:**
- Consumes: `ContentStory` from Task 1; the `story` column from Task 2.
- Produces: `ContentAngle.content.story?: ContentStory` populated on both the local and cloud paths. Tasks 6 and 9 read it.

- [ ] **Step 1: Write the failing test**

`mapLocalRow` is not exported. Rather than change its visibility, drive a real `node:sqlite` database through the shipped DDL and the shipped SELECT — the same approach `verify-local-wipe.mjs` uses, and it catches a missing SELECT alias, which a unit test of the mapper alone would not.

```ts
// src/services/__tests__/contentStory.test.ts
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const root = path.join(__dirname, '..', '..', '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

/** Lift the shipped `content` DDL rather than restating it. */
function contentDDL(): string {
  const src = read('src/database/tables.ts');
  const start = src.indexOf('CREATE TABLE IF NOT EXISTS content (');
  return src.slice(start, src.indexOf(');', start) + 2);
}

describe('story survives the SQLite round trip', () => {
  it('is selected by the mood query and parses back to an object', () => {
    const db = new DatabaseSync(':memory:');
    db.exec(contentDDL());

    const story = {
      title: 'A Test Story',
      body: 'Narrative body.',
      source: 'Sahih al-Bukhari 3339',
      sourceType: 'hadith_narrative',
      grading: 'sahih',
    };

    db.prepare(
      `INSERT INTO content (id, type, primaryText, englishTranslation, source, whyThis, story)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run('quran_test_1', 'Quran', 'x', 'x', 'Surah Test 1:1', 'x', JSON.stringify(story));

    const row = db.prepare('SELECT c.story AS story FROM content c WHERE c.id = ?')
      .get('quran_test_1') as { story: string };

    expect(JSON.parse(row.story)).toEqual(story);
    db.close();
  });

  it('the shipped mood query selects c.story', () => {
    expect(read('src/services/contentRepository.ts')).toContain('c.story');
  });

  it('a malformed story does not throw', () => {
    const src = read('src/services/contentRepository.ts');
    const idx = src.indexOf('story:');
    expect(idx).toBeGreaterThan(-1);
    // the guarded-parse convention used by prayerContext and propheticPractice
    expect(src.slice(idx, idx + 200)).toMatch(/try \{/);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest contentStory`
Expected: FAIL — the DDL has `story` after Task 1, so case 1 passes; cases 2 and 3 fail because `contentRepository.ts` has no `c.story` and no `story:` mapping yet.

- [ ] **Step 3: Add `story` to the row shapes**

In `src/services/contentRepository.ts`, add to **both** the cloud row interface and `ContentAngleRow` (alongside `propheticPractice?: string;`):

```ts
  story?: string;
```

- [ ] **Step 4: Add the SELECT alias**

In `fetchForMoodLocal`'s explicit column list, after the `c.propheticPractice` line:

```
           c.story           AS story,
```

The aliases are explicit here because `SELECT ca.*, c.*` once collided on `id` and corrupted session dedup. Keep the pattern.

- [ ] **Step 5: Map it on both paths, guarded**

In `mapLocalRow`, inside the `content: { ... }` object, after `propheticPractice`:

```ts
      story: (() => { try { return row.story ? JSON.parse(row.story) : undefined; } catch { return undefined; } })(),
```

In `mapCloudRow`, inside its `content: { ... }` object, after `propheticPractice`:

```ts
          story: row.content.story
            ? (() => {
                try {
                  return typeof row.content.story === 'string'
                    ? JSON.parse(row.content.story)
                    : row.content.story;
                } catch { return undefined; }
              })()
            : undefined,
```

The cloud one handles both shapes because Supabase returns `JSONB` already parsed, while the seeder uploads a string.

- [ ] **Step 6: Run tests and typecheck**

Run: `npx jest contentStory && npx tsc --noEmit -p tsconfig.json`
Expected: 3 passing, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/services/contentRepository.ts src/services/__tests__/contentStory.test.ts
git commit -m "feat(content): read story on the local and cloud paths"
```

---

### Task 4: Supabase migration and upload path

**Files:**
- Create: `supabase/migrations/006_content_story.sql`
- Modify: `src/services/supabaseDataService.ts:952-966` (`seedSupabaseContent`)

**Interfaces:**
- Consumes: `Content.story` from Task 1.
- Produces: the `public.content.story` JSONB column that Task 3's `mapCloudRow` reads.

- [ ] **Step 1: Write the migration**

Follows `003_content_time_awareness.sql`'s precedent — an `ALTER`, not a table rewrite.

```sql
-- 006_content_story.sql
-- Add the optional per-verse narrative to the content table.
--
-- JSONB rather than TEXT to match prophetic_practice (002), which this field
-- copies end to end. Nullable with no default: absent is the normal state, and
-- a verse gets a story only when one genuinely belongs.

ALTER TABLE public.content
ADD COLUMN IF NOT EXISTS story JSONB;
```

- [ ] **Step 2: Add it to the upload path**

In `seedSupabaseContent`'s content map, after `prophetic_practice`:

```ts
            story: c.story ? JSON.stringify(c.story) : null,
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Apply the migration to the live project and verify it**

A committed `.sql` is not a live column — migration 004 sat unapplied for a long stretch. Apply it, then confirm the column exists before moving on:

```bash
npx supabase db push
```

Then verify, and do not proceed until this prints `story`:

```bash
npx supabase db execute --query "select column_name from information_schema.columns where table_schema='public' and table_name='content' and column_name='story';"
```

If `supabase login` / project linking is not set up in this environment, stop and hand this step to the user rather than skipping it. The cloud read path silently returns `undefined` for a missing column, so a skipped migration produces no error — only absent stories on every online device.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/006_content_story.sql src/services/supabaseDataService.ts
git commit -m "feat(content): add story column to Supabase content"
```

---

### Task 5: `StoryLayer` component

**Files:**
- Create: `src/components/StoryLayer.tsx`
- Test: `src/components/__tests__/StoryLayer.test.tsx` (create)

**Interfaces:**
- Consumes: `ContentStory` from Task 1.
- Produces: `export default function StoryLayer(props: StoryLayerProps)` where

```ts
interface StoryLayerProps {
  story: ContentStory;
  accentColor?: string;
  topInset?: number;
}
```

Task 6 mounts it with exactly those props. There is deliberately no `scrollY`:
`ContextLayer` takes one to drive an animated header, `StoryLayer` has none, and
a prop that is declared, passed, and never read is how the next reader concludes
the parallax is broken rather than absent.

- [ ] **Step 1: Write the failing test**

Two behaviours matter: the citation is always visible (a story without its source is the thing the sourcing rule exists to prevent), and the settled state after a skip tap holds plain numbers, not Animated nodes — the bug that shipped twice.

```tsx
// src/components/__tests__/StoryLayer.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import StoryLayer from '../StoryLayer';
import type { ContentStory } from '../../types';

const story: ContentStory = {
  title: 'The Well',
  body: 'A narrative body long enough to wrap across several lines on a phone.',
  source: 'Surah Yusuf 12:15-20',
  sourceType: 'quran_narrative',
};

describe('StoryLayer', () => {
  it('renders title, body and citation', () => {
    const { getByText } = render(<StoryLayer story={story} />);
    expect(getByText('The Well')).toBeTruthy();
    expect(getByText(/narrative body/)).toBeTruthy();
    expect(getByText('Surah Yusuf 12:15-20')).toBeTruthy();
  });

  it('never clamps the body with numberOfLines', () => {
    const { getByText } = render(<StoryLayer story={story} />);
    expect(getByText(/narrative body/).props.numberOfLines).toBeUndefined();
  });

  it('settles to plain opacity 1 after a skip tap', () => {
    const { getByTestId, getByText } = render(<StoryLayer story={story} />);
    fireEvent.press(getByTestId('story-skip'));
    const flatten = (s: unknown) => (Array.isArray(s) ? Object.assign({}, ...s) : s) as Record<string, unknown>;
    expect(flatten(getByText('The Well').props.style).opacity).toBe(1);
    expect(flatten(getByText(/narrative body/).props.style).opacity).toBe(1);
  });

  it('shows a grading only when the story carries one', () => {
    const { queryByText, rerender } = render(<StoryLayer story={story} />);
    expect(queryByText(/Sahih/)).toBeNull();
    rerender(<StoryLayer story={{ ...story, sourceType: 'hadith_narrative', source: 'Sahih al-Bukhari 3339', grading: 'sahih' }} />);
    expect(queryByText(/Sahih/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest StoryLayer`
Expected: FAIL — `Cannot find module '../StoryLayer'`.

- [ ] **Step 3: Implement**

```tsx
// src/components/StoryLayer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated, ScrollView, Pressable } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Animations } from '../theme/DesignSystem';
import type { ContentStory } from '../types';
import { useReduceMotion } from '../hooks/useReduceMotion';

interface StoryLayerProps {
  story: ContentStory;
  accentColor?: string;
  topInset?: number;
}

/**
 * Third guidance layer — the narrative a verse calls to mind.
 *
 * The staged reveal follows VerseLayer/HadithLayer, including the part those
 * two got wrong twice: a skip tap must not leave the settled state owned by an
 * Animated.Value. Three defences, and only the third is load-bearing — the
 * sequence is held in a ref and stopped before any write, the completion
 * callback is guarded on `finished`, and the styles are gated on
 * `revealComplete` so the settled render contains plain numbers and no
 * Animated node at all.
 */
export default function StoryLayer({
  story,
  accentColor = Colors.accent.primary,
  topInset = Spacing.lg,
}: StoryLayerProps) {
  const reduceMotion = useReduceMotion();
  const [revealComplete, setRevealComplete] = useState(reduceMotion);

  const titleAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;
  const sourceAnim = useRef(new Animated.Value(0)).current;
  const sequence = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (reduceMotion) {
      setRevealComplete(true);
      return;
    }
    const fade = (v: Animated.Value, delay: number) =>
      Animated.timing(v, {
        toValue: 1,
        duration: Animations.timing.normal,
        delay,
        useNativeDriver: true,
      });

    sequence.current = Animated.parallel([
      fade(titleAnim, 0),
      fade(bodyAnim, Animations.timing.fast),
      fade(sourceAnim, Animations.timing.normal),
    ]);
    sequence.current.start(({ finished }) => {
      if (finished) setRevealComplete(true);
    });

    return () => {
      sequence.current?.stop();
    };
  }, [reduceMotion, titleAnim, bodyAnim, sourceAnim]);

  const skip = () => {
    sequence.current?.stop();
    titleAnim.setValue(1);
    bodyAnim.setValue(1);
    sourceAnim.setValue(1);
    setRevealComplete(true);
  };

  const gradingLabel = story.grading
    ? story.grading.charAt(0).toUpperCase() + story.grading.slice(1)
    : null;

  return (
    <Pressable testID="story-skip" onPress={skip} style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text
          style={[styles.title, { opacity: revealComplete ? 1 : titleAnim }]}
        >
          {story.title}
        </Animated.Text>

        <View style={[styles.rule, { backgroundColor: accentColor }]} />

        <Animated.Text
          style={[styles.body, { opacity: revealComplete ? 1 : bodyAnim }]}
        >
          {story.body}
        </Animated.Text>

        <Animated.View
          style={[styles.sourceRow, { opacity: revealComplete ? 1 : sourceAnim }]}
        >
          <Text style={[styles.source, { color: accentColor }]}>{story.source}</Text>
          {gradingLabel && <Text style={styles.grading}>{gradingLabel}</Text>}
        </Animated.View>
      </ScrollView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h2,
    color: Colors.text.primary,
    lineHeight: Typography.sizes.h2 * 1.3,
  },
  rule: {
    width: 32,
    height: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    opacity: 0.6,
  },
  body: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
    lineHeight: Typography.sizes.body * 1.5,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  source: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
  },
  grading: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
  },
});
```

- [ ] **Step 4: Run tests**

Run: `npx jest StoryLayer`
Expected: 4 passing.

The hook import is verified against the repo: `src/hooks/useReduceMotion.ts:17` exports `useReduceMotion(): boolean`, and `VerseLayer.tsx:11` imports it exactly as written above.

- [ ] **Step 5: Check for render hazards**

Run: `node scripts/verify-render-hazards.mjs && RH_INJECT=1 node scripts/verify-render-hazards.mjs`
Expected: **both** exit 0. That pair is the green state; one alone proves nothing.

- [ ] **Step 6: Commit**

```bash
git add src/components/StoryLayer.tsx src/components/__tests__/StoryLayer.test.tsx
git commit -m "feat(guidance): add StoryLayer"
```

---

### Task 6: Wire the third layer into `GuidanceScreen`

**Files:**
- Modify: `src/screens/GuidanceScreen.tsx:204` (`LAYER_TYPES`), `:200` and `:398` (hardcoded indices), `:454` (`LayerPager` labels), and the layer render block
- Test: `src/screens/__tests__/guidanceLayers.test.ts` (create)

**Interfaces:**
- Consumes: `StoryLayer` from Task 5; `angle.content.story` from Task 3.
- Produces: a `LAYER_TYPES` array that is `['verse','context']` without a story and `['verse','context','story']` with one.

- [ ] **Step 1: Write the failing test**

The hazard is a hardcoded index surviving next to a now-variable array. Assert it is gone.

```ts
// src/screens/__tests__/guidanceLayers.test.ts
import fs from 'fs';
import path from 'path';

const src = fs.readFileSync(
  path.join(__dirname, '..', 'GuidanceScreen.tsx'),
  'utf8',
);

describe('GuidanceScreen layer addressing', () => {
  it('appends story rather than inserting it', () => {
    const m = src.match(/LAYER_TYPES[^\n]*=[^\n]*\n?[^;]*;/);
    expect(m?.[0]).toContain("'story'");
    // 'story' must come after 'context' in the literal
    const literal = m![0];
    expect(literal.indexOf("'story'")).toBeGreaterThan(literal.indexOf("'context'"));
  });

  it('has no hardcoded layer index left', () => {
    expect(src).not.toMatch(/currentLayer !== 1\b/);
    expect(src).not.toMatch(/currentLayer === 1\b/);
  });

  it('gives the pager a label for every layer type', () => {
    expect(src).toContain("'Story'");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest guidanceLayers`
Expected: FAIL on all three — no `'story'`, `currentLayer !== 1` still present.

- [ ] **Step 3: Build the layer list and computed indices**

Replace line 204:

```tsx
  const hasStory = !!experience?.content?.story;
  const LAYER_TYPES: Array<'verse' | 'context' | 'story'> = [
    'verse',
    ...(hasContext ? (['context'] as const) : []),
    ...(hasStory ? (['story'] as const) : []),
  ];

  // Layers are addressed by computed index, never a literal. Story is appended
  // rather than inserted so an absent context cannot shift it, and so adding a
  // fourth layer later cannot silently retarget the reflection-focus guard.
  const contextIndex = LAYER_TYPES.indexOf('context');
  const storyIndex = LAYER_TYPES.indexOf('story');
```

- [ ] **Step 4: Replace both hardcoded indices**

Line ~200:

```tsx
    if (currentLayer !== contextIndex) isReflectionInputFocusedRef.current = false;
```

Add `contextIndex` to that `useEffect`'s dependency array.

Line ~398:

```tsx
            {currentLayer === contextIndex && hasContext && (
```

- [ ] **Step 5: Render the story layer**

Immediately after the `ContextLayer` block's closing `)}`:

```tsx
            {currentLayer === storyIndex && experience?.content?.story && (
              <StoryLayer
                story={experience.content.story}
                accentColor={(MoodColors[mood] || MoodColors.Calm).accent}
                topInset={Spacing.lg}
              />
            )}
```

Add the import beside the other layer imports:

```tsx
import StoryLayer from '../components/StoryLayer';
```

- [ ] **Step 6: Label it in the pager**

Line ~454:

```tsx
        labels={LAYER_TYPES.map((t) =>
          t === 'verse' ? 'Verse' : t === 'context' ? 'Context' : t === 'story' ? 'Story' : t,
        )}
```

- [ ] **Step 7: Run tests and typecheck**

Run: `npx jest guidanceLayers && npx tsc --noEmit -p tsconfig.json`
Expected: 3 passing, no type errors.

- [ ] **Step 8: Run the existing guidance tests for regressions**

Run: `npx jest useGuidanceLogic`
Expected: unchanged pass. `LAYER_TYPES` is derived here, so a break shows up as a layer-count assertion.

- [ ] **Step 9: Commit**

```bash
git add src/screens/GuidanceScreen.tsx src/screens/__tests__/guidanceLayers.test.ts
git commit -m "feat(guidance): append story layer and drop hardcoded indices"
```

---

### Task 7: `verify-stories.mjs`

**Files:**
- Create: `scripts/verify-stories.mjs`

**Interfaces:**
- Consumes: `Content.story` entries in `src/data/quranData.ts`.
- Produces: a gate runnable as `node scripts/verify-stories.mjs`, with negative mode `STORY_INJECT=1`.

- [ ] **Step 1: Write the script**

```js
/**
 * Story verifier — the citation gate for Content.story.
 *
 * Checks, in order:
 *   1. Shape — required fields present, sourceType a valid union member,
 *      grading only on hadith_narrative and only 'sahih' | 'hasan'.
 *   2. Locatability — a quran_narrative source parses to a surah:ayah range;
 *      a hadith_narrative source parses to a collection and a number.
 *   3. No ayah quotation in the body. A quoted ayah is verse text and falls
 *      under the complete-ayah rule, so story bodies retell in prose instead.
 *      Detected as Arabic script anywhere in `body`, plus any quoted run that
 *      overlaps the cited verse's English by more than SHARE_LIMIT.
 *   4. Round trip — every story survives JSON.stringify -> SQLite TEXT ->
 *      JSON.parse against the shipped DDL, so a story that cannot be seeded
 *      fails here rather than on a device.
 *
 * WHAT THIS DOES NOT CATCH — read this before treating a green run as proof:
 *   - Whether the retelling is FAITHFUL to its source. Every check here is
 *     structural. A well-formed, correctly-cited, entirely invented story
 *     passes cleanly. That is a human read, and it is the whole point of the
 *     sourcing rule.
 *   - Whether the story belongs beside its verse.
 *   - Whether a hadith number is the RIGHT hadith for the narrative. Pass 2
 *     proves the citation is locatable, not that it says what the story says.
 *     Network verification of that lives in verify-citations.mjs.
 *   - Israiliyyat. A detail the Quran withholds, sourced to a real ayah range,
 *     is invisible to a structural check.
 *
 * Run:      node scripts/verify-stories.mjs
 * Selftest: STORY_INJECT=1 node scripts/verify-stories.mjs
 * BOTH must exit 0. A passing positive run alone proves nothing.
 */
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

const BS = String.fromCharCode(92);
const SHARE_LIMIT = 0.6;
const INJECT = process.env.STORY_INJECT === '1';

const src = fs.readFileSync('src/data/quranData.ts', 'utf8');
const errors = [];

// ── extract Content objects and their story blocks ────────────────────────
function objects(prefix) {
  const out = [];
  for (const m of src.matchAll(new RegExp(`id: '(${prefix}[a-zA-Z0-9_]+)'`, 'g'))) {
    let open = m.index;
    while (src[open] !== '{') open--;
    let d = 0, q = null, end = -1;
    for (let k = open; k < src.length; k++) {
      const c = src[k];
      if (q) { if (c === BS) k++; else if (c === q) q = null; continue; }
      if (c === "'" || c === '"' || c === '`') { q = c; continue; }
      if (c === '{') d++;
      else if (c === '}') { d--; if (!d) { end = k; break; } }
    }
    out.push({ id: m[1], body: src.slice(open, end + 1) });
  }
  return out;
}

function field(body, name) {
  const m = body.match(new RegExp(`\\b${name}:\\s*`));
  if (!m) return null;
  let i = m.index + m[0].length;
  const q = body[i];
  if (q !== "'" && q !== '"') return null;
  let out = '';
  for (let k = i + 1; k < body.length; k++) {
    const c = body[k];
    if (c === BS) { out += body[k + 1]; k++; continue; }
    if (c === q) break;
    out += c;
  }
  return out;
}

const stories = [];
for (const c of objects('quran_')) {
  const at = c.body.indexOf('story: {');
  if (at === -1) continue;
  let d = 0, end = -1;
  for (let k = c.body.indexOf('{', at); k < c.body.length; k++) {
    if (c.body[k] === '{') d++;
    else if (c.body[k] === '}') { d--; if (!d) { end = k; break; } }
  }
  const block = c.body.slice(at, end + 1);
  stories.push({
    verseId: c.id,
    verseSource: field(c.body, 'source') || '',
    verseEnglish: field(c.body, 'englishTranslation') || '',
    title: field(block, 'title'),
    body: INJECT ? 'وَلَلْآخِرَةُ خَيْرٌ لَكَ' : field(block, 'body'),
    source: INJECT ? 'The Increase Dua' : field(block, 'source'),
    sourceType: field(block, 'sourceType'),
    grading: field(block, 'grading'),
    raw: block,
  });
}

// ── 1. shape ──────────────────────────────────────────────────────────────
const TYPES = ['quran_narrative', 'hadith_narrative'];
const GRADINGS = ['sahih', 'hasan'];
for (const s of stories) {
  for (const f of ['title', 'body', 'source', 'sourceType']) {
    if (!s[f]) errors.push(`${s.verseId}: story is missing '${f}'`);
  }
  if (s.sourceType && !TYPES.includes(s.sourceType))
    errors.push(`${s.verseId}: sourceType '${s.sourceType}' is not a valid member`);
  if (s.grading && !GRADINGS.includes(s.grading))
    errors.push(`${s.verseId}: grading '${s.grading}' is not 'sahih' or 'hasan'`);
  if (s.grading && s.sourceType === 'quran_narrative')
    errors.push(`${s.verseId}: quran_narrative must not carry a grading`);
}

// ── 2. locatability ───────────────────────────────────────────────────────
for (const s of stories) {
  if (!s.source) continue;
  if (s.sourceType === 'quran_narrative') {
    if (!/\d+:\d+(-\d+)?\s*$/.test(s.source.trim()))
      errors.push(`${s.verseId}: quran_narrative source '${s.source}' has no surah:ayah range`);
  } else if (s.sourceType === 'hadith_narrative') {
    if (!/[A-Za-z'-]\s+\d+\s*$/.test(s.source.trim()))
      errors.push(`${s.verseId}: hadith_narrative source '${s.source}' is not 'Collection Number'`);
  }
}

// ── 3. no ayah quotation in the body ──────────────────────────────────────
const ARABIC = /[؀-ۿ]/;
const words = (t) => (t || '').toLowerCase().match(/[a-z']+/g) || [];
for (const s of stories) {
  if (!s.body) continue;
  if (ARABIC.test(s.body))
    errors.push(`${s.verseId}: story body contains Arabic script — retell in prose, cite the range`);
  for (const q of s.body.matchAll(/"([^"]{25,})"/g)) {
    const qw = new Set(words(q[1]));
    const vw = words(s.verseEnglish);
    if (!vw.length || !qw.size) continue;
    const shared = vw.filter((w) => qw.has(w)).length / vw.length;
    if (shared > SHARE_LIMIT)
      errors.push(`${s.verseId}: quoted run overlaps the verse translation ${(shared * 100).toFixed(0)}% — quote the ayah in the verse layer, not the story`);
  }
}

// ── 4. round trip through the shipped DDL ─────────────────────────────────
const ddlSrc = fs.readFileSync('src/database/tables.ts', 'utf8');
const start = ddlSrc.indexOf('CREATE TABLE IF NOT EXISTS content (');
const ddl = ddlSrc.slice(start, ddlSrc.indexOf(');', start) + 2);
const db = new DatabaseSync(':memory:');
db.exec(ddl);
const ins = db.prepare(
  `INSERT INTO content (id, type, primaryText, englishTranslation, source, whyThis, story)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
);
for (const s of stories) {
  const payload = { title: s.title, body: s.body, source: s.source, sourceType: s.sourceType };
  if (s.grading) payload.grading = s.grading;
  ins.run(s.verseId, 'Quran', 'x', 'x', s.verseSource, 'x', JSON.stringify(payload));
  const back = db.prepare('SELECT story FROM content WHERE id = ?').get(s.verseId);
  let parsed;
  try { parsed = JSON.parse(back.story); } catch { parsed = null; }
  if (!parsed || parsed.title !== s.title || parsed.body !== s.body)
    errors.push(`${s.verseId}: story did not survive the seed/read round trip`);
}
db.close();

// ── report ────────────────────────────────────────────────────────────────
console.log(`Checked ${stories.length} stor${stories.length === 1 ? 'y' : 'ies'}` +
  (INJECT ? ' (STORY_INJECT: faults deliberately introduced)' : ''));

if (INJECT) {
  if (stories.length === 0) {
    console.log('\nx STORY_INJECT found no stories to corrupt — the negative test proved nothing.');
    process.exit(1);
  }
  if (errors.length === 0) {
    console.log('\nx STORY_INJECT corrupted every story and the checks still passed.');
    process.exit(1);
  }
  console.log(`\nNegative mode OK — ${errors.length} injected fault(s) caught.`);
  process.exit(0);
}

if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  errors.forEach((e) => console.log(`  x ${e}`));
  process.exit(1);
}
console.log('\nAll checks passed.');
```

- [ ] **Step 2: Run both modes on zero stories**

Run: `node scripts/verify-stories.mjs`
Expected: `Checked 0 stories` then `All checks passed.`, exit 0.

Run: `STORY_INJECT=1 node scripts/verify-stories.mjs`
Expected: **exit 1**, with `STORY_INJECT found no stories to corrupt — the negative test proved nothing.`

That exit 1 is correct and is the point: the negative mode refuses to report success when there is nothing to corrupt. It goes green in Task 9, once the pilot story exists. This is the trap the roundtrip verifier fell into — a negative test pinned to data that moved, passing by doing nothing.

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-stories.mjs
git commit -m "test(content): add verify-stories with negative mode"
```

---

### Task 8: Pool target readout and the acceptance-test override

**Files:**
- Modify: `scripts/verify-mood-pools.mjs:22` and its reporting block (~lines 180-196)

**Interfaces:**
- Consumes: nothing.
- Produces: `MOOD_FLOOR` env override. Plan B's per-tick gate and its end-of-project acceptance test both rely on this behaviour.

- [ ] **Step 1: Confirm the current failure semantics before changing them**

Run: `node scripts/verify-mood-pools.mjs; echo "exit=$?"`
Expected: `exit=0`, with all nine pools at or above the current `MIN_POOL` of 10.

This is the baseline that makes the next step's reasoning checkable rather than asserted.

- [ ] **Step 2: Replace the constant with a floor plus a target**

`scripts/verify-mood-pools.mjs:22`:

```js
// MIN_POOL is FATAL and stays at 10: it catches a regression that guts a pool.
//
// It is deliberately NOT the project target. Raising it to 40 while the pool
// expansion is in flight would make this script exit 1 for every under-floor
// mood from the first tick — and the tick contract reverts on a red gate, so
// every tick would revert its own work and the project could never finish.
// The gate meant to prove progress would be the thing preventing it.
//
// TARGET_POOL is the progress readout and is never fatal. The 40 floor becomes
// fatal only as the end-of-project acceptance test, via the env override:
//   MOOD_FLOOR=40 node scripts/verify-mood-pools.mjs
const MIN_POOL = Number(process.env.MOOD_FLOOR ?? 10);
const TARGET_POOL = 40;
```

- [ ] **Step 3: Report the target without failing on it**

Replace the per-mood reporting loop:

```js
for (const m of MOODS) {
  const n = pool[m];
  const flag = n < MIN_POOL
    ? `  << below floor of ${MIN_POOL}`
    : n < TARGET_POOL
      ? `  (${TARGET_POOL - n} to target)`
      : '';
  console.log(`  ${m.padEnd(width)}  ${String(n).padStart(3)}${flag}`);
  if (n < MIN_POOL) errors.push(`${m} pool is ${n}, below the floor of ${MIN_POOL}`);
}
```

- [ ] **Step 4: Verify both behaviours**

Run: `node scripts/verify-mood-pools.mjs; echo "exit=$?"`
Expected: `exit=0`, and eight moods now annotated `(N to target)` — Calm `(24 to target)`, Grateful `(5 to target)`, Overwhelmed unannotated at 49.

Run: `MOOD_FLOOR=40 node scripts/verify-mood-pools.mjs; echo "exit=$?"`
Expected: `exit=1`, listing eight moods below the floor of 40. This is the acceptance test failing correctly today; Plan B's completion is when it exits 0.

Both results together are the proof. A single green run would not distinguish a working override from a dead one.

- [ ] **Step 5: Commit**

```bash
git add scripts/verify-mood-pools.mjs
git commit -m "test(content): add pool target readout and MOOD_FLOOR override"
```

---

### Task 9: Pilot story, end to end

**Files:**
- Modify: `src/data/quranData.ts` (one `Content` entry gains a `story`)
- Modify: `src/database/seedContent.ts` (`SEED_VERSION` 38 → 39)
- Create: `scripts/add-pilot-story.mjs` (the scripted edit; kept, as the template Plan B's ticks copy)

**Interfaces:**
- Consumes: everything above.
- Produces: one real story proving the path, and `scripts/add-pilot-story.mjs` as the worked example of the structural-edit pattern Plan B's ticks follow.

- [ ] **Step 1: Choose the verse and fetch the source**

Use `quran_12_87` — Ya'qub telling his sons not to despair of Allah's mercy. It is already in the corpus, already tagged `Hopeful`, and its own surah carries the narrative, so the story is a `quran_narrative` citing a range in Surah Yusuf.

Fetch the range and read the raw JSON yourself. Do not use `WebFetch` — it summarises through a small model observed to truncate and misnumber:

```bash
curl -s "https://api.alquran.cloud/v1/surah/12/editions/quran-uthmani,en.sahih" -o /tmp/yusuf.json && node -e "const d=require('/tmp/yusuf.json').data[1].ayahs;for(const a of d.slice(85,88))console.log(a.numberInSurah, a.text)"
```

Expected: ayahs 86-88 of Surah Yusuf, printed in full. Read them before writing a word of the story.

- [ ] **Step 2: Write the scripted edit**

Per the constraints: a file, not `node -e`; structural location; exactly one match asserted; nothing written on any failure; CRLF preserved.

```js
// scripts/add-pilot-story.mjs
//
// Worked example of the structural-edit pattern every content tick follows.
// Locates by id, asserts exactly one match, preserves CRLF, writes nothing
// unless every edit resolved.
import fs from 'fs';

const FILE = 'src/data/quranData.ts';
const src = fs.readFileSync(FILE, 'utf8');

if (!src.includes('\r\n')) {
  console.error('x refusing to write: CRLF line endings are already gone');
  process.exit(1);
}

const TARGET = "id: 'quran_12_87'";
const hits = [...src.matchAll(new RegExp(TARGET.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))];
if (hits.length !== 1) {
  console.error(`x expected exactly 1 match for ${TARGET}, found ${hits.length}`);
  process.exit(1);
}

// Anchor on the entry's own `moods:` line so the insert lands inside the right
// object rather than at the first `moods:` after the id.
const objStart = hits[0].index;
const moodsAt = src.indexOf('moods: [', objStart);
if (moodsAt === -1) {
  console.error('x could not find the moods line for quran_12_87');
  process.exit(1);
}

// Every clause below maps to a fetched ayah: 84 (eyes white with grief),
// 85 (the sons' warning), 86 (he complains only to Allah, and knows what they
// do not), 87 (go and search; do not despair of relief from Allah), 94 (the
// caravan, the scent), 95 (his family calls it his old error), 96 (the bearer
// of good news, the shirt, his sight). Nothing here is asserted that those
// ayat do not say — no duration for the separation, no claim Yusuf was thought
// dead, no naming of who carried the shirt.
const STORY = [
  "    story: {",
  "      title: 'What He Knew That They Did Not',",
  "      body:",
  "        \"Ya'qub's grief for Yusuf turned his eyes white. His sons told him he would \" +",
  "        'make himself ill, or destroy himself, going on remembering Yusuf — and he ' +",
  "        'answered that he took his sorrow and his grief to Allah alone, and that he ' +",
  "        'knew from Allah what they did not know. Then he sent them out to search, and ' +",
  "        'told them not to despair of relief from Allah, because despairing of it is ' +",
  "        'not what a believer does. When the caravan set out for home he said he could ' +",
  "        'sense Yusuf, and his family told him he was in the same old error. Then the ' +",
  "        'bearer of good news arrived and cast the shirt over his face, and his sight ' +",
  "        'came back — and he asked them whether he had not told them all along that he ' +",
  "        'knew from Allah what they did not know.',",
  "      source: 'Surah Yusuf 12:84-96',",
  "      sourceType: 'quran_narrative',",
  "    },",
].join('\r\n') + '\r\n';

const out = src.slice(0, moodsAt - 4) + STORY + src.slice(moodsAt - 4);

if (!out.includes('\r\n')) {
  console.error('x refusing to write: the edit destroyed CRLF');
  process.exit(1);
}

fs.writeFileSync(FILE, out);
console.log('ok — pilot story added to quran_12_87');
```

- [ ] **Step 3: Run it**

Run: `node scripts/add-pilot-story.mjs`
Expected: `ok — pilot story added to quran_12_87`

Then confirm the shape by eye — `git diff src/data/quranData.ts` — and check the indentation matches its neighbours. If the insert landed wrong, `git checkout src/data/quranData.ts` and fix the script; never hand-patch the output.

- [ ] **Step 4: Bump `SEED_VERSION`**

`src/database/seedContent.ts:290`:

```ts
const SEED_VERSION = 39;
```

Add a line to the version log comment above it:

```
// v39: schema — Content.story added (see 2026-08-31 stories spec), plus the
//      first story on quran_12_87. Existing installs re-seed; CURRENT_DB_VERSION
//      12 recreates the content tables so the new column exists to seed into.
```

- [ ] **Step 5: Run the full gate set**

```bash
npx tsc --noEmit -p tsconfig.json
node scripts/verify-stories.mjs
STORY_INJECT=1 node scripts/verify-stories.mjs
node scripts/verify-mood-pools.mjs
node scripts/verify-journey.mjs
npx jest quranArabicIntegrity
npx jest
```

Expected: all pass. Specifically, `verify-stories.mjs` now reports `Checked 1 story / All checks passed.` and `STORY_INJECT=1` now **exits 0** with `Negative mode OK` — in Task 7 it exited 1 for want of anything to corrupt. That flip is the proof the negative test is real.

`quranArabicIntegrity` must pass **without** running `refresh-quran-canonical.mjs`: this task adds no verse text and touches no `arabicText`. If it fails, the edit went somewhere it should not have — investigate, do not regenerate the baseline.

- [ ] **Step 6: Verify on device**

Run the app on the Expo dev client, tap into a `Hopeful` session, and advance until `quran_12_87` comes up. Confirm: three dots in the pager, the third labelled **Story**, the narrative rendering with its citation, and a tap during the reveal settling to fully-opaque text rather than leaving it faint.

Then check a verse **without** a story shows exactly two dots. Visuals cannot be confirmed from a typecheck.

- [ ] **Step 7: Commit**

```bash
git add src/data/quranData.ts src/database/seedContent.ts scripts/add-pilot-story.mjs
git commit -m "feat(content): add the first story and prove the path end to end"
```

---

## Done when

- `MOOD_FLOOR=40 node scripts/verify-mood-pools.mjs` exits 1 listing eight moods — the acceptance test for Plan B, failing correctly.
- `node scripts/verify-stories.mjs` and `STORY_INJECT=1 node scripts/verify-stories.mjs` **both** exit 0.
- `npx jest` passes; `npx tsc --noEmit -p tsconfig.json` is clean.
- Migration 006 is applied to the live Supabase project and the column was confirmed present, not merely committed.
- One story renders on a device, and a verse without one still shows two layers.

## Deliberately not in this plan

Spec §5.4's **voice pass** — new angles must carry no `[Tafsir …]` tag and must
open in second person — is not here, and is not dropped. It is scoped to
ledger-known ids so the 161 legacy tafsir-voice angles stay exempt, and the
ledger does not exist until Plan B. It belongs to Plan B's first task.

## Handoff to Plan B

Record these before Plan B is written — its ledger depends on them:

1. **The monotonicity baseline.** `node scripts/verify-mood-pools.mjs` output, per-mood, committed as `docs/superpowers/plans/2026-08-31-mood-pools/baseline.json`. Ticks compare against it; without it recorded before tick 1 the check has nothing to compare to.
2. **The pilot angle template.** Plan B's ticks copy a validated angle shape. Task 9 validates the *story* shape; the angle template comes from an existing 3-step mood angle confirmed rendering — pick one and name it in Plan B rather than inventing a shape.
3. **`scripts/add-pilot-story.mjs`** is the structural-edit template. Plan B's tick scripts are variations on it, not fresh inventions.
