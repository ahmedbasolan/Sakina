# Prayer Leadership "Who is leading?" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user of Prayer Leadership say whether a man or a woman (leading women) is leading, store that on the device only, and show sourced women's versions of Days 1, 8, 9, 10, 11 and 14.

**Architecture:** A `PathStep` may carry `variants.womanLeading` (angle, hadith, title, focus). A pure `resolveStep`/`resolvePath` applies it; `PathsService` applies it inside every method that returns a path or steps, using a choice it re-reads from `kv_store` on each progress load. A bottom-sheet card on `PathDetailScreen` asks once. Verifiers expand each variant into its own virtual journey.

**Tech Stack:** React Native (Expo), TypeScript, expo-sqlite `kv_store`, Jest, Node verifier scripts (`.mjs`).

**Spec:** `docs/superpowers/specs/2026-10-11-prayer-leadership-leader-choice-design.md` — read it first; §2 (day table + shared-hadith constraints) and §3 (sources) govern every word of content.

## Global Constraints

- Change a day for women **only** where a §3 source says the practice differs; remove men-only mechanics without inventing replacements.
- Companions' reports (Aisha, Umm Salamah) go in lesson prose with their grading dispute; never in a hadith layer.
- Maliki position is written "not permitted", never "invalid".
- The Hanafi/Maliki "silent" view is written as "reported", and applies to recitation only — women's Day 9/10 must not tell her to be inaudible to her own row (Bukhari 780, 722).
- kv_store key: `prayer_leadership_leader`; values `man` | `woman`. Never synced, never a Supabase column.
- Card copy: title "Who is leading?"; options "A man" / "A woman, leading women"; caption "Stays on your device. Never sent to Sakina."
- New ids: angles `q_angle_imam_day{1,8,9,10,11,14}_f`, hadith `hadith_imam_14_f`. `id`, `contentId`, `mood` single-quoted. `quranData.ts`/`staticPaths.ts`/`hadithData.ts` are CRLF with **zero bare LFs** before and after every scripted edit.
- No `_f` id may reach `logServiceError` (PostHog receives message + context).
- Styling: `DesignSystem.ts` tokens only, bare icons, 44pt targets, `StyleSheet.create` outside render.
- Never push. Pushes to `main` trigger an EAS build; Ahmed pushes when he asks.

## Review Focus

1. **Choice set, then account deleted** → next journey load must show the men's version and the card must ask again (the in-memory choice must not outlive the kv row). Pinned in Task 3 (`re-reads after the row is deleted`).
2. **User picks "woman" mid-journey with Days 1–9 done** → progress ring and completed days unchanged; Day 10 opens the women's lesson. Pinned in Task 3 (`resolution does not touch progress`).
3. **A women's angle missing from the local seed** (old seed, cloud fallback) → error report must name `q_angle_imam_day8`, not `…_f`. Pinned in Task 4.
4. **Other journeys / days without variants** → byte-for-byte identical objects returned (no accidental copies changing identity-based memo). Pinned in Task 2 (`returns the same object`).
5. **Home card read before PathDetail ever opened** → Home's `getAllProgress` hydrates, so the active-day title is the women's title. Pinned in Task 3 (`getAllProgress hydrates`).

---

### Task 1: Draft the women's lessons and shared wording (content gate)

**Files:**
- Create: `docs/superpowers/plans/2026-10-11-prayer-leadership-women-lessons-draft.md`
- Read: `src/data/quranData.ts` (angles `q_angle_imam_day1,7,8,9,10,11,12,14`), `src/data/hadithData.ts` (`hadith_imam_14`), spec §2–§3

**Interfaces:**
- Produces: the exact text (angle string, `practiceSteps` array, `reflection`, step `title`/`focus` overrides) that Task 5's script inserts. Task 5 must not start until Ahmed approves this file.

- [ ] **Step 1: Dump the current angles verbatim**

Write `scratchpad/dump-imam.mjs` (scratchpad = the session scratchpad dir, not the repo):

```js
import fs from 'fs';
const s = fs.readFileSync('src/data/quranData.ts', 'utf8');
for (const d of [1, 7, 8, 9, 10, 11, 12, 14]) {
  const id = `id: 'q_angle_imam_day${d}'`;
  const i = s.indexOf(id);
  const j = s.indexOf("id: 'q_angle_", i + id.length);
  console.log(`\n######## day ${d}\n` + s.slice(i, j));
}
```

Run: `node <scratchpad>/dump-imam.mjs > <scratchpad>/imam-angles.txt` and read the whole output (no slicing).

- [ ] **Step 2: Re-read every tafsir entry a women's angle will keep a tag for**

A women's angle shares its day's verse, so it may reuse that day's `[Tafsir … on s:a]` tag — but only if every sentence crediting the scholar is in the entry. For each tag found in Step 1 on days 1, 8, 9, 10, 11, 14, fetch `https://api.quran.com/api/v4/tafsirs/169/by_ayah/{s}:{a}` (Ibn Kathir) or 90 (Qurtubi) / 91 (Sa'di) and read the full text. If the women's prose would credit something the entry does not say, write it in the app's own voice instead.

- [ ] **Step 3: Write the draft file**

For each of days 1, 8, 9, 10, 11, 14 write: proposed `title`/`focus` override (only days 1 and 14 per spec), full `angle` string (tag at the very start; contains a `ContextLayer` split pattern such as `. When you` or `. Your `), `practiceSteps` (3–6 steps; `type`/`icon`/`sourceType` from the existing unions; a quoted hadith only Bukhari 1203/1204, Abu Dawud 592, or the day's existing shared hadith), `reflection`, and under each a **claim → source** table pointing to spec §3 entries. For day 14 also draft `hadith_imam_14_f` (Arabic + English of Abu Dawud 592 fetched from `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/{ara|eng}-abudawud/592.json`, printed whole; `grading: 'hasan'`; `source: 'Sunan Abi Dawud 592'`).

Then the four shared edits, as before → after:
- Day 1 man: the sentence beginning "These days are written for a man leading" → a pointer: "If a woman is leading women, choose that on the journey screen — Days 1, 8, 9, 10, 11 and 14 change where the practice differs."
- Day 8 man: the sentence "This describes a man leading; if you are a woman leading women, ask a trusted scholar how your school arranges the row" → the same pointer sentence form.
- Day 7: title "Surahs the Mosque Knows" → "Surahs Everyone Knows" (staticPaths `step_imam_7`), and the angle/practice sentence "Which surah would you reach for if the iqamah were called and everyone turned to you right now?" → "Which surah would you reach for if everyone turned to you right now?"; any "mosque" wording in that angle → "the people you lead".
- Day 12: "An elderly man, someone straight from work, a parent with a child who will not last" → "Someone elderly, someone straight from work, a parent with a child who will not last".

- [ ] **Step 4: Self-audit the draft**

For every sentence of women's text, point to its §3 source or mark it app voice. Search the draft for: "invalid", "stands in front", "behind you" (women's days), "Subhan Allah" (as what her followers say), "silent"/"quietly" applied to takbirs, any hadith number not listed above. Fix and re-run until zero hits.

- [ ] **Step 5: Commit the draft and stop for review**

```bash
git add docs/superpowers/plans/2026-10-11-prayer-leadership-women-lessons-draft.md
git commit -m "docs(plan): draft women's lessons for Prayer Leadership (for review)"
```

Send Ahmed the file. **Do not start Task 5 until he approves it.** Tasks 2–4 and 6–7 do not depend on the text and may proceed.

---

### Task 2: Types and the pure resolver

**Files:**
- Modify: `src/types/index.ts` (interfaces `SpiritualPath` ~line 223, `PathStep` ~line 238)
- Create: `src/utils/leaderChoice.ts`
- Test: `src/utils/__tests__/leaderChoice.test.ts`

**Interfaces:**
- Produces:
  - `type LeaderChoice = 'man' | 'woman'`
  - `const LEADER_CHOICE_KEY = 'prayer_leadership_leader'`
  - `const LEADER_CHOICE_PATH_ID = 'path_prayer_leadership'`
  - `resolveStep(step: PathStep, choice: LeaderChoice | null): PathStep`
  - `resolvePath(path: SpiritualPath, choice: LeaderChoice | null): SpiritualPath`
  - `redactVariantId(id: string): string`
  - `PathStep.variants?: { womanLeading?: StepVariant }`, `StepVariant { angleId: string; hadithContentId?: string; title?: string; focus?: string }`, `SpiritualPath.leaderChoice?: true`

- [ ] **Step 1: Write the failing tests**

`src/utils/__tests__/leaderChoice.test.ts`:

```ts
import { resolveStep, resolvePath, redactVariantId } from '../leaderChoice';
import { PathStep, SpiritualPath } from '../../types';

const plain: PathStep = {
  id: 'step_x_1', pathId: 'path_x', day: 1, title: 'T', focus: 'F',
  contentId: 'quran_1_1', angleId: 'q_angle_x_day1', hadithContentId: 'hadith_x_1', isCompleted: false,
};
const withVariant: PathStep = {
  ...plain, id: 'step_x_2', day: 2, angleId: 'q_angle_x_day2',
  variants: { womanLeading: { angleId: 'q_angle_x_day2_f', title: 'TW' } },
};
const path: SpiritualPath = {
  id: 'path_x', title: 'X', description: 'd', duration: 2, theme: 'Hopeful', target: 't',
  dailySteps: [plain, withVariant], leaderChoice: true,
};

describe('resolveStep', () => {
  it('returns the same object when there is no choice', () => {
    expect(resolveStep(withVariant, null)).toBe(withVariant);
  });
  it('returns the same object for "man"', () => {
    expect(resolveStep(withVariant, 'man')).toBe(withVariant);
  });
  it('returns the same object for a day without a variant', () => {
    expect(resolveStep(plain, 'woman')).toBe(plain);
  });
  it('applies only the fields the variant sets', () => {
    const r = resolveStep(withVariant, 'woman');
    expect(r.angleId).toBe('q_angle_x_day2_f');
    expect(r.title).toBe('TW');
    expect(r.focus).toBe('F');
    expect(r.hadithContentId).toBe('hadith_x_1');
    expect(r.contentId).toBe('quran_1_1');
    expect(withVariant.angleId).toBe('q_angle_x_day2'); // source not mutated
  });
});

describe('resolvePath', () => {
  it('returns the same object for "man" and for null', () => {
    expect(resolvePath(path, 'man')).toBe(path);
    expect(resolvePath(path, null)).toBe(path);
  });
  it('ignores the choice on a path without leaderChoice', () => {
    const other = { ...path, leaderChoice: undefined };
    expect(resolvePath(other, 'woman')).toBe(other);
  });
  it('resolves every step for "woman" without mutating the source', () => {
    const r = resolvePath(path, 'woman');
    expect(r).not.toBe(path);
    expect(r.dailySteps[0]).toBe(plain);
    expect(r.dailySteps[1].angleId).toBe('q_angle_x_day2_f');
    expect(path.dailySteps[1].angleId).toBe('q_angle_x_day2');
  });
});

describe('redactVariantId', () => {
  it('strips the women-variant suffix', () => {
    expect(redactVariantId('q_angle_imam_day8_f')).toBe('q_angle_imam_day8');
    expect(redactVariantId('hadith_imam_14_f')).toBe('hadith_imam_14');
  });
  it('leaves other ids alone', () => {
    expect(redactVariantId('q_angle_imam_day8')).toBe('q_angle_imam_day8');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/utils/__tests__/leaderChoice.test.ts`
Expected: FAIL — `Cannot find module '../leaderChoice'`.

- [ ] **Step 3: Add the types**

In `src/types/index.ts`, inside `SpiritualPath` after `bundleId?: string;`:

```ts
  /**
   * The journey asks "Who is leading?" and some days carry a `variants.womanLeading`
   * version (Prayer Leadership only). See src/utils/leaderChoice.ts.
   */
  leaderChoice?: true;
```

Above `export interface PathStep`:

```ts
/** Fields a day replaces when a woman is leading women. Unset fields stay shared. */
export interface StepVariant {
  angleId: string;
  hadithContentId?: string;
  title?: string;
  focus?: string;
}
```

Inside `PathStep` after `surahIds?: string[];`:

```ts
  /** Applied by resolveStep(); never read directly by screens. */
  variants?: { womanLeading?: StepVariant };
```

- [ ] **Step 4: Write the resolver**

`src/utils/leaderChoice.ts`:

```ts
import { PathStep, SpiritualPath } from '../types';

/**
 * Prayer Leadership asks "Who is leading?" because a woman leading women differs
 * from a man leading on a few sourced points (spec 2026-10-11). The answer lives
 * in kv_store on the device only — never synced, never a Supabase column — and
 * clearAllLocalUserData deletes it.
 */
export type LeaderChoice = 'man' | 'woman';

/** Letters and underscores only: verify-local-wipe reads keys with '([a-z_]+)'. */
export const LEADER_CHOICE_KEY = 'prayer_leadership_leader';
export const LEADER_CHOICE_PATH_ID = 'path_prayer_leadership';

/** Returns the step unchanged (same object) unless a woman-leading variant applies. */
export function resolveStep(step: PathStep, choice: LeaderChoice | null): PathStep {
  const v = choice === 'woman' ? step.variants?.womanLeading : undefined;
  if (!v) return step;
  return {
    ...step,
    angleId: v.angleId,
    hadithContentId: v.hadithContentId ?? step.hadithContentId,
    title: v.title ?? step.title,
    focus: v.focus ?? step.focus,
  };
}

/** Returns the path unchanged (same object) unless it asks the question and the answer is "woman". */
export function resolvePath(path: SpiritualPath, choice: LeaderChoice | null): SpiritualPath {
  if (!path.leaderChoice || choice !== 'woman') return path;
  return { ...path, dailySteps: path.dailySteps.map((s) => resolveStep(s, choice)) };
}

/**
 * Error reports go to PostHog (message + context). A women's-variant id would
 * tell PostHog what this user chose, so log the shared id instead.
 */
export function redactVariantId(id: string): string {
  return id.endsWith('_f') ? id.slice(0, -2) : id;
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npx jest src/utils/__tests__/leaderChoice.test.ts` → PASS (9 tests).
Run: `npx tsc --noEmit -p tsconfig.json` → no errors.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/utils/leaderChoice.ts src/utils/__tests__/leaderChoice.test.ts
git commit -m "feat(journeys): step variants + pure leader-choice resolver"
```

---

### Task 3: PathsService seam, kv storage, wipe list

**Files:**
- Modify: `src/services/pathsService.ts` (`getAllPaths` ~40, `getPathById` ~71, `getPathsByMood` ~75, `loadProgress` ~242, `getAllProgress` ~252, new methods at end)
- Modify: `src/database/operations.ts` (kv delete ~137)
- Test: `src/services/__tests__/pathsService.leaderChoice.test.ts`

**Interfaces:**
- Consumes: `LeaderChoice`, `LEADER_CHOICE_KEY`, `LEADER_CHOICE_PATH_ID`, `resolvePath` (Task 2).
- Produces: `PathsService.getLeaderChoice(pathId: string): LeaderChoice | null` (sync, cached), `PathsService.setLeaderChoice(pathId: string, choice: LeaderChoice): Promise<void>`, `PathsService.refreshLeaderChoice(): Promise<void>`; `getPathById`/`getAllPaths`/`getPathsByMood`/`getCurrentStep`/`getNextStep`/`getCompletedSteps` return resolved data.

- [ ] **Step 1: Write the failing tests**

`src/services/__tests__/pathsService.leaderChoice.test.ts`:

```ts
const kv = new Map<string, string>();
jest.mock('../../database/connection', () => ({
  dbQuery: jest.fn((op: any) =>
    op({
      getFirstAsync: jest.fn(async (_sql: string, [key]: [string]) =>
        kv.has(key) ? { value: kv.get(key) } : null),
      runAsync: jest.fn(async (_sql: string, [key, value]: [string, string]) => {
        kv.set(key, value);
      }),
    }),
  ),
}));
const mockProgress = { pathId: 'path_prayer_leadership', currentDay: 10, startDate: 1, completedDays: [1,2,3,4,5,6,7,8,9], isCompleted: false };
jest.mock('../supabaseDataService', () => ({
  SupabaseDataService: {
    getInstance: () => ({
      getPathProgress: jest.fn(async () => mockProgress),
      getAllPathProgress: jest.fn(async () => [mockProgress]),
      recordPathProgress: jest.fn(async () => undefined),
    }),
  },
}));

import { PathsService } from '../pathsService';
import { STATIC_SPIRITUAL_PATHS } from '../../data/staticPaths';

const ID = 'path_prayer_leadership';
const service = PathsService.getInstance();
const staticPath = () => STATIC_SPIRITUAL_PATHS.find((p) => p.id === ID)!;

beforeEach(async () => {
  kv.clear();
  await service.refreshLeaderChoice();
});

it('returns the static path untouched before any choice', () => {
  expect(service.getLeaderChoice(ID)).toBeNull();
  expect(service.getPathById(ID)).toBe(staticPath());
});

it('setLeaderChoice stores the value under the kv key and resolves steps', async () => {
  await service.setLeaderChoice(ID, 'woman');
  expect(kv.get('prayer_leadership_leader')).toBe('woman');
  const day8 = service.getPathById(ID)!.dailySteps.find((s) => s.day === 8)!;
  const v = staticPath().dailySteps.find((s) => s.day === 8)!.variants?.womanLeading;
  expect(day8.angleId).toBe(v ? v.angleId : 'q_angle_imam_day8');
});

it('getAllProgress hydrates the choice from kv', async () => {
  kv.set('prayer_leadership_leader', 'woman');
  await service.getAllProgress();
  expect(service.getLeaderChoice(ID)).toBe('woman');
});

it('re-reads after the row is deleted (account wipe)', async () => {
  await service.setLeaderChoice(ID, 'woman');
  kv.delete('prayer_leadership_leader');
  await service.loadProgress(ID);
  expect(service.getLeaderChoice(ID)).toBeNull();
  expect(service.getPathById(ID)).toBe(staticPath());
});

it('ignores an unknown stored value', async () => {
  kv.set('prayer_leadership_leader', 'other');
  await service.loadProgress(ID);
  expect(service.getLeaderChoice(ID)).toBeNull();
});

it('resolution does not touch progress', async () => {
  await service.setLeaderChoice(ID, 'woman');
  const p = await service.loadProgress(ID);
  expect(p!.completedDays).toEqual([1,2,3,4,5,6,7,8,9]);
  expect(service.getCompletedSteps(ID, p!)).toHaveLength(9);
  expect(service.getCurrentStep(ID, p!)!.day).toBe(10);
});

it('other journeys are returned as the same objects', async () => {
  await service.setLeaderChoice(ID, 'woman');
  const rizq = STATIC_SPIRITUAL_PATHS.find((p) => p.id === 'path_rizq_revolution')!;
  expect(service.getPathById('path_rizq_revolution')).toBe(rizq);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/services/__tests__/pathsService.leaderChoice.test.ts`
Expected: FAIL — `service.refreshLeaderChoice is not a function`.

- [ ] **Step 3: Implement in PathsService**

Add import at the top of `src/services/pathsService.ts`:

```ts
import {
  LeaderChoice, LEADER_CHOICE_KEY, LEADER_CHOICE_PATH_ID, resolvePath,
} from '../utils/leaderChoice';
```

Inside the class, after `static getInstance()`:

```ts
  /**
   * "Who is leading?" for Prayer Leadership, mirrored from kv_store. Re-read on
   * every progress load (not cached forever) so an account wipe, which deletes
   * the row, takes effect on the next screen without a restart.
   */
  private leaderChoice: LeaderChoice | null = null;

  private resolve(path: SpiritualPath): SpiritualPath {
    return path.id === LEADER_CHOICE_PATH_ID ? resolvePath(path, this.leaderChoice) : path;
  }
```

Replace the bodies:

```ts
  getAllPaths(_isPremium: boolean = false, _unlockedBundleIds: string[] = []): SpiritualPath[] {
    // (keep the existing comment block above this line unchanged)
    return STATIC_SPIRITUAL_PATHS.map((p) => this.resolve(p));
  }

  getPathById(pathId: string): SpiritualPath | null {
    const path = STATIC_SPIRITUAL_PATHS.find((p) => p.id === pathId);
    return path ? this.resolve(path) : null;
  }

  getPathsByMood(mood: Mood): SpiritualPath[] {
    return STATIC_SPIRITUAL_PATHS.filter((path) => path.theme === mood).map((p) => this.resolve(p));
  }
```

In `loadProgress`, first line inside `try`: `await this.refreshLeaderChoice();`. In `getAllProgress`, first line inside `try`: `await this.refreshLeaderChoice();`.

Append before the class's closing brace:

```ts
  getLeaderChoice(pathId: string): LeaderChoice | null {
    return pathId === LEADER_CHOICE_PATH_ID ? this.leaderChoice : null;
  }

  async setLeaderChoice(pathId: string, choice: LeaderChoice): Promise<void> {
    if (pathId !== LEADER_CHOICE_PATH_ID) return;
    const dbQuery = await getDbQuery();
    await dbQuery(async (db) => {
      await db.runAsync('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)', [
        LEADER_CHOICE_KEY,
        choice,
      ]);
    });
    this.leaderChoice = choice;
  }

  async refreshLeaderChoice(): Promise<void> {
    try {
      const dbQuery = await getDbQuery();
      const row = await dbQuery(async (db) =>
        db.getFirstAsync<{ value: string }>('SELECT value FROM kv_store WHERE key = ?', [
          LEADER_CHOICE_KEY,
        ]),
      );
      const v = row?.value;
      this.leaderChoice = v === 'man' || v === 'woman' ? v : null;
    } catch {
      // Keep the last known value: a transient read failure must not flip the
      // journey's content mid-session.
    }
  }
```

- [ ] **Step 4: Add the key to the account wipe**

In `src/database/operations.ts`, change

```ts
      await db.runAsync('DELETE FROM kv_store WHERE key IN (?, ?, ?)', [
        'quran_reading_progress',
        'last_opened_path',
        LOCAL_DATA_OWNER_KEY,
      ]);
```

to

```ts
      await db.runAsync('DELETE FROM kv_store WHERE key IN (?, ?, ?, ?)', [
        'quran_reading_progress',
        'last_opened_path',
        'prayer_leadership_leader',
        LOCAL_DATA_OWNER_KEY,
      ]);
```

and add "the Prayer Leadership leader choice" to the comment above it.

- [ ] **Step 5: Run tests, wipe verifier, typecheck**

Run: `npx jest src/services/__tests__/pathsService` → all PASS (the old free-core suite included).
Run: `node scripts/verify-local-wipe.mjs` → exit 0 and the printed kv key list includes `prayer_leadership_leader`.
Run: `NO_WIPE=1 node scripts/verify-local-wipe.mjs` → exit 0 (negative mode).
Run: `npx tsc --noEmit -p tsconfig.json` → no errors.

- [ ] **Step 6: Commit**

```bash
git add src/services/pathsService.ts src/services/__tests__/pathsService.leaderChoice.test.ts src/database/operations.ts
git commit -m "feat(journeys): PathsService applies the local-only leader choice; wipe deletes it"
```

---

### Task 4: Keep variant ids out of error reports

**Files:**
- Modify: `src/services/rotationEngine.ts:131-144`
- Modify: `src/services/contentRepository.ts:322-333`
- Test: `src/services/__tests__/variantIdLogging.test.ts`

**Interfaces:**
- Consumes: `redactVariantId` (Task 2).

- [ ] **Step 1: Write the failing test**

`src/services/__tests__/variantIdLogging.test.ts`:

```ts
const mockLog = jest.fn();
jest.mock('../errorLoggingService', () => ({
  logServiceError: (...a: any[]) => mockLog(...a),
  logDatabaseError: jest.fn(),
}));
// rotationEngine.ts imports these at module scope; none is exercised here.
jest.mock('../../database/connection', () => ({ getDatabase: jest.fn(), dbQuery: jest.fn() }));
jest.mock('../supabaseDataService', () => ({ SupabaseDataService: { getInstance: () => ({}) } }));
jest.mock('../prayerTimesService', () => ({ __esModule: true, default: {} }));

import { RotationEngine } from '../rotationEngine';

it('getGuidanceForStep never reports a women-variant angle id', async () => {
  const engine: any = Object.create(RotationEngine.prototype);
  engine.ensureDb = async () => true;
  engine.contentRepo = { fetchAngleById: async () => null };
  await engine.getGuidanceForStep('quran_2_238', 'q_angle_imam_day8_f');
  expect(mockLog).toHaveBeenCalled();
  expect(JSON.stringify(mockLog.mock.calls)).not.toMatch(/_f\b/);
  expect(JSON.stringify(mockLog.mock.calls)).toMatch(/q_angle_imam_day8/);
});
```

(`RotationEngine` is a named export, `rotationEngine.ts:25`. If importing it still pulls an unmocked native module, add a `jest.mock` for that module path in the same style — never `jest.mock` the engine itself.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/services/__tests__/variantIdLogging.test.ts`
Expected: FAIL — the logged message contains `q_angle_imam_day8_f`.

- [ ] **Step 3: Redact in rotationEngine**

In `getGuidanceForStep`, add `import { redactVariantId } from '../utils/leaderChoice';` at the top of the file and change both log lines to:

```ts
        const logId = redactVariantId(angleId);
        logServiceError('RotationEngine', 'getGuidanceForStep', `Angle not found: ${logId}`, { angleId: logId });
```

```ts
      logServiceError('RotationEngine', 'getGuidanceForStep', error instanceof Error ? error : new Error(String(error)), { angleId: redactVariantId(angleId) });
```

- [ ] **Step 4: Redact in contentRepository**

Add the same import to `src/services/contentRepository.ts` and change the cloud-fallback catch context from `{ angleId }` to `{ angleId: redactVariantId(angleId) }`.

- [ ] **Step 5: Run tests and typecheck**

Run: `npx jest src/services/__tests__/variantIdLogging.test.ts` → PASS.
Run: `npx tsc --noEmit -p tsconfig.json` → no errors.

- [ ] **Step 6: Commit**

```bash
git add src/services/rotationEngine.ts src/services/contentRepository.ts src/services/__tests__/variantIdLogging.test.ts
git commit -m "fix(privacy): error reports name the shared angle id, never a women's variant"
```

---

### Task 5: Insert the approved content (requires Task 1 approval)

**Files:**
- Create: `<scratchpad>/insert-leader-variants.mjs` (not in repo)
- Modify: `src/data/staticPaths.ts` (Prayer Leadership block ~lines 269-440)
- Modify: `src/data/quranData.ts` (insert 6 angles after `q_angle_imam_day14`; edit angles day1, 7, 8, 12)
- Modify: `src/data/hadithData.ts` (insert `hadith_imam_14_f` after `hadith_imam_14`)
- Modify: `src/database/seedContent.ts:465` (`SEED_VERSION = 63` → `64` + changelog)

**Interfaces:**
- Consumes: approved text from `docs/superpowers/plans/2026-10-11-prayer-leadership-women-lessons-draft.md`; `StepVariant` shape (Task 2).
- Produces: data the verifiers (Task 6) and app read.

- [ ] **Step 1: Write the insertion script**

Copy the approved text into the script as JS string constants (prose through `JSON.stringify`; `id`/`contentId`/`mood` written literally single-quoted). Skeleton:

```js
import fs from 'fs';
const CRLF = '\r\n';
const bareLF = (s) => (s.match(/(?<!\r)\n/g) || []).length;
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  if (bareLF(s)) throw new Error(`${file}: bare LF before edit`);
  for (const [from, to] of pairs) {
    const n = s.split(from).length - 1;
    if (n !== 1) throw new Error(`${file}: expected 1 match, got ${n} for ${from.slice(0, 60)}`);
    s = s.replace(from, to);
  }
  if (bareLF(s)) throw new Error(`${file}: bare LF after edit`);
  return s;
}
const out = {};
// staticPaths: add leaderChoice and per-step variants, anchored on step ids
out['src/data/staticPaths.ts'] = edit('src/data/staticPaths.ts', [
  [`    target: 'Confidence',${CRLF}    isPremium: false,`,
   `    target: 'Confidence',${CRLF}    isPremium: false,${CRLF}    leaderChoice: true,`],
  [`        angleId: 'q_angle_imam_day1',${CRLF}`,
   `        angleId: 'q_angle_imam_day1',${CRLF}        variants: { womanLeading: { angleId: 'q_angle_imam_day1_f', title: TITLE_1_F } },${CRLF}`],
  // ...one pair per day 8, 9, 10, 11 (angleId only) and 14
  // (angleId + hadithContentId: 'hadith_imam_14_f' + TITLE_14_F + FOCUS_14_F),
  // and step_imam_7's title → 'Surahs Everyone Knows'
]);
// quranData: four shared edits (exact before/after from the approved draft) + one
// insertion of the six _f angle objects after the q_angle_imam_day14 object.
// hadithData: insert hadith_imam_14_f after the hadith_imam_14 object.
for (const [f, s] of Object.entries(out)) fs.writeFileSync(f, s); // only after every edit succeeded
```

`TITLE_1_F`, `TITLE_14_F`, `FOCUS_14_F` are the approved strings, emitted with `JSON.stringify(...)` into the TS source only if they contain an apostrophe; otherwise wrapped in single quotes. Every multi-line insertion is joined with `CRLF`.

- [ ] **Step 2: Run the script, then confirm**

Run: `node <scratchpad>/insert-leader-variants.mjs` → no throw.
Run: `git diff --stat` → only the three data files changed.
Run: `node -e "for (const f of ['src/data/staticPaths.ts','src/data/quranData.ts','src/data/hadithData.ts']) { const s=require('fs').readFileSync(f,'utf8'); console.log(f,(s.match(/(?<!\r)\n/g)||[]).length) }"` → `0` for each.

- [ ] **Step 3: Bump the seed**

In `src/database/seedContent.ts`, change `const SEED_VERSION = 63;` to `const SEED_VERSION = 64;` and add a changelog line to the comment list above it, in the file's existing style: `// 64 — Prayer Leadership: six women-leading angles (q_angle_imam_day{1,8,9,10,11,14}_f), hadith_imam_14_f (Abu Dawud 592), neutral wording on days 7/12, pointer lines on days 1/8.`

- [ ] **Step 4: Typecheck and Quran lock**

Run: `npx tsc --noEmit -p tsconfig.json` → no errors.
Run: `npx jest quranArabicIntegrity` → PASS (no verse changed; if it fails, a verse was touched by mistake — revert, do not refresh the canonical).

- [ ] **Step 5: Commit**

```bash
git add src/data/staticPaths.ts src/data/quranData.ts src/data/hadithData.ts src/database/seedContent.ts
git commit -m "feat(journeys): women-leading versions of Prayer Leadership days 1, 8, 9, 10, 11, 14 (SEED 64)"
```

---

### Task 6: Verifiers check every variant sequence

**Files:**
- Create: `scripts/lib/journeyVariants.mjs`
- Modify: `scripts/verify-journey.mjs` (JOURNEYS loop ~line 109, borrowed-angle pass ~238, du'a pass ~308)
- Modify: `scripts/verify-journey-roundtrip.mjs` (path loop ~104)
- Modify: `scripts/verify-journey-claims.mjs` (`loadDays` ~352)
- Modify: `scripts/verify-journey-selftest.mjs` (sandbox copy in `reset()`, new fault)

**Interfaces:**
- Produces: `variantSequences(path) → Array<{ label: string, steps: PathStep[] }>` — always the base sequence first (`label: ''`), then one per variant key present on any step (`label: ' (woman leading)'`), steps resolved the same way as `resolveStep`.

- [ ] **Step 1: Write the shared helper**

`scripts/lib/journeyVariants.mjs`:

```js
/**
 * Expands a path into every day sequence a user can actually see: the base
 * sequence, plus one per step-variant key (today only `womanLeading`). Mirrors
 * src/utils/leaderChoice.ts resolveStep — keep the two in step. Every
 * per-journey check (one verse / one hadith per journey, distinct du'a, mood,
 * roundtrip, claims) must run on each sequence, because a woman never sees the
 * base sequence and a man never sees hers.
 */
const LABELS = { womanLeading: ' (woman leading)' };
export function variantSequences(path) {
  const keys = new Set();
  for (const s of path.dailySteps || []) for (const k of Object.keys(s.variants || {})) keys.add(k);
  const out = [{ label: '', steps: path.dailySteps || [] }];
  for (const k of keys) {
    out.push({
      label: LABELS[k] || ` (${k})`,
      steps: path.dailySteps.map((s) => {
        const v = s.variants?.[k];
        if (!v) return s;
        return { ...s, angleId: v.angleId, hadithContentId: v.hadithContentId ?? s.hadithContentId,
          title: v.title ?? s.title, focus: v.focus ?? s.focus };
      }),
    });
  }
  return out;
}
```

- [ ] **Step 2: Use it in verify-journey.mjs**

Add `import { variantSequences } from './lib/journeyVariants.mjs';`. Wrap the body of `for (const [pathId, anglePrefix, theme, strict] of JOURNEYS)` so that after `const path = objectAt(paths, pathId);` and its null check, it loops `for (const { label, steps } of variantSequences(path)) { … }`, printing `=== ${path.title}${label} — …` and iterating `steps` where it iterated `path.dailySteps`. `seenVerse`/`seenDua`/`seenHadith` are created **inside** the variant loop. In the borrowed-angle pass and the du'a-repeat pass, iterate `variantSequences(path)` the same way.

- [ ] **Step 3: Add the selftest fault and sandbox copy**

In `verify-journey-selftest.mjs` `reset()`, after the line copying `scripts/verify-journey.mjs`:

```js
  fs.mkdirSync(path.join(SB, 'scripts', 'lib'), { recursive: true });
  fs.copyFileSync(path.join(REPO, 'scripts/lib/journeyVariants.mjs'), path.join(SB, 'scripts/lib/journeyVariants.mjs'));
```

Add to the faults list:

```js
  ['variant points at a missing angle', () => patch('staticPaths.ts', `angleId: 'q_angle_imam_day8_f'`, `angleId: 'q_angle_imam_day88_f'`), /missing angle q_angle_imam_day88_f/],
```

Update the header comment's fault count (14 → 15) and the matching count in CLAUDE.md in Task 8.

- [ ] **Step 4: Run verify-journey and its selftest**

Run: `node scripts/verify-journey.mjs` → exit 0; output contains `=== Prayer Leadership (woman leading)`.
Run: `node scripts/verify-journey-selftest.mjs` → every fault reported caught, including the new one.

- [ ] **Step 5: Use it in the roundtrip**

In `verify-journey-roundtrip.mjs` add the import; inside the path loop replace `for (const step of path.dailySteps)` with `for (const { label, steps } of variantSequences(path)) { console.log(\`--- sequence${label || ' (base)'}\`); for (const step of steps) { … } }`.

Run: `node scripts/verify-journey-roundtrip.mjs` → exit 0. `RT_INJECT=1 node scripts/verify-journey-roundtrip.mjs` → exit 0.

- [ ] **Step 6: Use it in the claims verifier**

In `verify-journey-claims.mjs` `loadDays()`, replace `for (const st of p.dailySteps) {` with `for (const { label, steps } of variantSequences(p)) for (const st of steps) {` and set `journey: pid + label` in the pushed object, so P1 (hadith on two days) is evaluated per sequence. Add the import.

Run: `node scripts/verify-journey-claims.mjs` → exit 0. `CLAIMS_INJECT=1 node scripts/verify-journey-claims.mjs` → exit 0.
If a women's angle legitimately needs a ledger entry (e.g. `ALLOW_SCHOLARS`), add it with a reason that names the §3 source; never to silence a real mismatch.

- [ ] **Step 7: Citations and tafsir tags (no code change)**

Run: `node scripts/verify-citations.mjs` → exit 0 (it scans every angle, so the `_f` angles are covered).
Run: `node scripts/verify-tafsir-tags.mjs` and `TAFSIR_INJECT=1 node scripts/verify-tafsir-tags.mjs` → both exit 0; read any new advisory against the fetched entry.

- [ ] **Step 8: Commit**

```bash
git add scripts/lib/journeyVariants.mjs scripts/verify-journey.mjs scripts/verify-journey-roundtrip.mjs scripts/verify-journey-claims.mjs scripts/verify-journey-selftest.mjs
git commit -m "test(journeys): verifiers check each step-variant sequence as its own journey"
```

---

### Task 7: The "Who is leading?" card

**Files:**
- Create: `src/components/LeaderChoiceSheet.tsx`
- Modify: `src/screens/PathDetailScreen.tsx` (imports ~1-30; `openDay` ~138; hero ~240-258; styles ~365)
- Test: `src/components/__tests__/LeaderChoiceSheet.test.tsx`

**Interfaces:**
- Consumes: `LeaderChoice`; `PathsService.getLeaderChoice` / `setLeaderChoice` (Task 3).
- Produces: `<LeaderChoiceSheet visible: boolean; current: LeaderChoice | null; onChoose: (c: LeaderChoice) => void; onClose: () => void />`

- [ ] **Step 1: Write the failing component test**

`src/components/__tests__/LeaderChoiceSheet.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LeaderChoiceSheet } from '../LeaderChoiceSheet';

it('shows the question, both answers and the privacy line', () => {
  const { getByText } = render(
    <LeaderChoiceSheet visible current={null} onChoose={jest.fn()} onClose={jest.fn()} />,
  );
  getByText('Who is leading?');
  getByText('A man');
  getByText('A woman, leading women');
  getByText('Stays on your device. Never sent to Sakina.');
});

it('reports the chosen answer', () => {
  const onChoose = jest.fn();
  const { getByText } = render(
    <LeaderChoiceSheet visible current={null} onChoose={onChoose} onClose={jest.fn()} />,
  );
  fireEvent.press(getByText('A woman, leading women'));
  expect(onChoose).toHaveBeenCalledWith('woman');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/components/__tests__/LeaderChoiceSheet.test.tsx`
Expected: FAIL — `Cannot find module '../LeaderChoiceSheet'`.

- [ ] **Step 3: Write the component**

`src/components/LeaderChoiceSheet.tsx`:

```tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/DesignSystem';
import { LeaderChoice } from '../utils/leaderChoice';

interface Props {
  visible: boolean;
  current: LeaderChoice | null;
  onChoose: (choice: LeaderChoice) => void;
  onClose: () => void;
}

const OPTIONS: { value: LeaderChoice; label: string }[] = [
  { value: 'man', label: 'A man' },
  { value: 'woman', label: 'A woman, leading women' },
];

/**
 * Prayer Leadership's one question. The fiqh turns on who LEADS, not who is led
 * (a man leading only his wife still follows the men's rules), so the copy asks
 * that and never asks the user to state their sex. Stored on-device only.
 */
export const LeaderChoiceSheet: React.FC<Props> = ({ visible, current, onChoose, onClose }) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Close">
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <Text style={styles.title} accessibilityRole="header">Who is leading?</Text>
          <Text style={styles.body}>
            A few days change when a woman leads women: where she stands, reciting aloud,
            and how the row corrects her.
          </Text>
          {OPTIONS.map((o) => {
            const selected = current === o.value;
            return (
              <TouchableOpacity
                key={o.value}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => onChoose(o.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={styles.optionText}>{o.label}</Text>
                {selected && <Ionicons name="checkmark" size={20} color={Colors.accent.primary} />}
              </TouchableOpacity>
            );
          })}
          <Text style={styles.caption}>Stays on your device. Never sent to Sakina.</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  body: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    lineHeight: Typography.sizes.small * 1.5,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    backgroundColor: Colors.glass.light,
    marginBottom: Spacing.sm,
  },
  optionSelected: { borderColor: Colors.accent.primary },
  optionText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
  },
  caption: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
```

(The `rgba(0, 0, 0, 0.7)` overlay matches `DisplayPreferencesModal`'s existing overlay; if `verify-render-hazards` or a lint rule flags it, reuse whatever token that modal is moved to — do not add a new colour.)

- [ ] **Step 4: Run the component test**

Run: `npx jest src/components/__tests__/LeaderChoiceSheet.test.tsx` → PASS.

- [ ] **Step 5: Wire it into PathDetailScreen**

Imports: `import { LeaderChoiceSheet } from '../components/LeaderChoiceSheet';`, `import { LeaderChoice } from '../utils/leaderChoice';`, and add `PathStep` to the existing `import { UserPathProgress } from '../types';`.

State after `userProgress`:

```tsx
  const [leaderChoice, setLeaderChoiceState] = useState<LeaderChoice | null>(null);
  const [pendingStep, setPendingStep] = useState<PathStep | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
```

In the `useFocusEffect` `.then`, after `setUserProgress(...)`: `setLeaderChoiceState(pathsService.getLeaderChoice(pathId));` (loadProgress has just refreshed it).

At the start of `openDay`, before seeding progress:

```tsx
    if (path.leaderChoice && !pathsService.getLeaderChoice(path.id)) {
      setPendingStep(step);
      setSheetOpen(true);
      return;
    }
```

Handler:

```tsx
  const chooseLeader = async (choice: LeaderChoice) => {
    await pathsService.setLeaderChoice(path.id, choice);
    setLeaderChoiceState(choice);
    setSheetOpen(false);
    const resolved = pendingStep
      ? pathsService.getPathById(path.id)?.dailySteps.find((s) => s.day === pendingStep.day)
      : undefined;
    setPendingStep(null);
    if (resolved) openDay(resolved);
  };
```

`path` is computed from `pathsService.getPathById(pathId)` at render, so the `setLeaderChoiceState` re-render updates the day rows and titles. But `chooseLeader` calls `openDay` from the **pre-choice** render's closure, whose `path` is the unresolved one. So in `openDay`, change the navigation param from `path,` to `path: pathsService.getPathById(path.id) ?? path,` — the step itself is already resolved (`resolved` above), and this keeps the PathStep screen's `path` consistent with it.

In the hero, under `heroSubtitle`:

```tsx
              {path.leaderChoice && leaderChoice && (
                <TouchableOpacity
                  onPress={() => setSheetOpen(true)}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Change who is leading"
                >
                  <Text style={styles.leaderLine}>
                    Leading: {leaderChoice === 'woman' ? 'A woman' : 'A man'} · Change
                  </Text>
                </TouchableOpacity>
              )}
```

Before the closing root `</View>`:

```tsx
      <LeaderChoiceSheet
        visible={sheetOpen}
        current={leaderChoice}
        onChoose={chooseLeader}
        onClose={() => { setSheetOpen(false); setPendingStep(null); }}
      />
```

Style (inside the existing `StyleSheet.create`):

```tsx
  leaderLine: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    color: Colors.text.steel,
    marginTop: Spacing.xs,
  },
```

- [ ] **Step 6: Typecheck, full Jest, render hazards**

Run: `npx tsc --noEmit -p tsconfig.json` → no errors.
Run: `npx jest` → all pass (previous count 1,015 + new tests).
Run: `node scripts/verify-render-hazards.mjs` and `RH_INJECT=1 node scripts/verify-render-hazards.mjs` → both exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/components/LeaderChoiceSheet.tsx src/components/__tests__/LeaderChoiceSheet.test.tsx src/screens/PathDetailScreen.tsx
git commit -m "feat(journeys): 'Who is leading?' card on Prayer Leadership"
```

---

### Task 8: Docs, memory, full verification

**Files:**
- Modify: `CLAUDE.md` ("Journey Sessions" §1b area and the verifier list in §5)
- Modify: memory `prayer-leadership-gender-choice.md` (user memory dir)

- [ ] **Step 1: CLAUDE.md note**

Add under "### 1b. One verse and one hadith per journey":

```markdown
### 1c. Step variants (Prayer Leadership's "Who is leading?")

A step may carry `variants.womanLeading` (angle, hadith, title, focus). `PathsService`
applies it through `src/utils/leaderChoice.ts`; screens never read `variants`. Every
journey verifier expands variants with `scripts/lib/journeyVariants.mjs` and checks each
sequence as its own journey — a woman never sees the base sequence. The choice lives in
kv_store `prayer_leadership_leader` only (deleted by `clearAllLocalUserData`), and a
variant id (`…_f`) must never reach `logServiceError`: pass it through `redactVariantId`.
Sources and the day table: `docs/superpowers/specs/2026-10-11-prayer-leadership-leader-choice-design.md`.
```

Update "injects 14 known faults" → "injects 15 known faults" in the `verify-journey-selftest.mjs` bullet.

- [ ] **Step 2: Update the memory file**

Rewrite the body of `prayer-leadership-gender-choice.md` to the built state: what shipped (commits), that it is not device-verified, that the six women's lessons await scholar sign-off, and the spec path.

- [ ] **Step 3: Full verification run**

Run each and confirm exit 0:

```bash
npx tsc --noEmit -p tsconfig.json
npx jest
node scripts/verify-journey.mjs
node scripts/verify-journey-selftest.mjs
node scripts/verify-journey-roundtrip.mjs
RT_INJECT=1 node scripts/verify-journey-roundtrip.mjs
node scripts/verify-journey-claims.mjs
CLAIMS_INJECT=1 node scripts/verify-journey-claims.mjs
node scripts/verify-citations.mjs
node scripts/verify-tafsir-tags.mjs
TAFSIR_INJECT=1 node scripts/verify-tafsir-tags.mjs
node scripts/verify-local-wipe.mjs
NO_WIPE=1 node scripts/verify-local-wipe.mjs
node scripts/verify-render-hazards.mjs
RH_INJECT=1 node scripts/verify-render-hazards.mjs
```

- [ ] **Step 4: Commit (no push)**

```bash
git add CLAUDE.md
git commit -m "docs(claude): step variants and the local-only leader choice"
```

Report to Ahmed: commits, verifier results, and the device checklist — card appears once on first day tap; both versions render (Day 1 and Day 14 titles change for "woman"); "Change" works; Home card title follows the choice; account deletion → card asks again.
