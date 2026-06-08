# Freemium Phase 1 — Ethics & Limits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Sakina's free tier generous and ethical — saving works, journeys (including distress journeys) are free-core, guidance refreshes reset per prayer window, and heavy moods lift all limits — without touching pricing or real purchases.

**Architecture:** Pure service/data-layer changes. The limit model moves from per-day (`dailyGuidanceSessions`/`nextRefreshesPerSession`) to per-prayer-window refreshes, keyed off the existing `PrayerContext` from `prayerTimesService` (which already falls back to London → stale cache → `'general'`). A mood-aware "mercy" flag (6 heavy moods) lifts limits with no paywall. Saving becomes count-capped instead of premium-only. Journey gating (`pathsService.premiumIds`) is removed.

**Tech Stack:** TypeScript, Expo SQLite (`expo-sqlite`), Jest. Singleton services. Test: `npx jest`. Typecheck: `npx tsc --noEmit -p tsconfig.json`.

**Branch:** Work continues on the current branch (`feat/guidance-options-modal`); the spec is committed there (`bec682a`). Spec: `docs/superpowers/specs/2026-06-08-freemium-monetization-model-design.md`.

**Out of scope (later phases):** premium-feature gating + peaks-only paywall placement + paywall copy reframe (Phase 2); real RevenueCat/StoreKit purchases + pricing tiers (Phase 3); enhanced-edition audio/PDF content + early-access windows (Phase 4). UI resting-point copy when refreshes run out is Phase 2; Phase 1 only makes the underlying limit logic correct.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `src/constants/index.ts` | Limit values + mood data | Reshape `FREEMIUM_LIMITS`; add `MERCY_MOODS` + `isMercyMood` |
| `src/types/index.ts` | Shared types | Reshape `FreemiumLimits`; add `UserSession.windowKey` |
| `src/database/tables.ts` | Table DDL | Add `windowKey` to `user_sessions` CREATE |
| `src/database/migrations.ts` | Schema upgrades | Add `user_sessions.windowKey` migration step |
| `src/services/sessionService.ts` | Per-window refresh counter | Window key + `syncWindow` + mercy params; drop daily-session cap |
| `src/services/freemiumService.ts` | Freemium facade | Mood-threaded refresh API; count-based `canSaveItem`; `getPaywallType` → null; `syncPrayerWindow` |
| `src/services/pathsService.ts` | Journey access | Remove `premiumIds` gating (all journeys free-core) |
| `src/hooks/useGuidanceLogic.ts` | Guidance UI logic | Sync window + pass active `mood` to refresh count |
| `src/services/__tests__/freemiumService.test.ts` | Tests | Rewrite to new model |
| `src/services/__tests__/sessionService.test.ts` | Tests | New file — per-window + mercy |
| `src/constants/__tests__/mercyMoods.test.ts` | Tests | New file — `isMercyMood` |

---

## Task 1: Mercy mood helper

**Files:**
- Modify: `src/constants/index.ts`
- Test: `src/constants/__tests__/mercyMoods.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `src/constants/__tests__/mercyMoods.test.ts`:

```ts
import { isMercyMood, MERCY_MOODS } from '../index';
import { Mood } from '../../types';

describe('isMercyMood', () => {
  it('returns true for the six heavy moods', () => {
    (['Overwhelmed', 'Sad', 'Lonely', 'Guilty', 'Angry', 'Tired'] as Mood[]).forEach((m) =>
      expect(isMercyMood(m)).toBe(true),
    );
  });

  it('returns false for the three settled/positive moods', () => {
    (['Grateful', 'Hopeful', 'Calm'] as Mood[]).forEach((m) =>
      expect(isMercyMood(m)).toBe(false),
    );
  });

  it('MERCY_MOODS has exactly six entries', () => {
    expect(MERCY_MOODS.size).toBe(6);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/constants/__tests__/mercyMoods.test.ts`
Expected: FAIL — `isMercyMood`/`MERCY_MOODS` not exported.

- [ ] **Step 3: Add the helper**

In `src/constants/index.ts`, after the `MOOD_ISLAMIC_TERMS` block (the file already imports/uses the `Mood` type via `getMoodIslamicTerm(mood: Mood)`), add:

```ts
/**
 * The six "heavy" moods. When the active guidance mood is one of these, limits
 * lift and no upgrade prompt appears (the mercy rule — see spec §4). The list is
 * a moral decision, not a tuning knob: when in doubt, mercy.
 */
export const MERCY_MOODS: ReadonlySet<Mood> = new Set<Mood>([
  'Overwhelmed', // Tawakkul
  'Sad',         // Sabr
  'Lonely',      // Wasl
  'Guilty',      // Tawbah — sacred; never gate repentance
  'Angry',       // Ihsan
  'Tired',       // Quwwah
]);

export const isMercyMood = (mood: Mood): boolean => MERCY_MOODS.has(mood);
```

If `Mood` is not already imported at the top of `constants/index.ts`, add `import { Mood } from '../types';`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/constants/__tests__/mercyMoods.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/constants/index.ts src/constants/__tests__/mercyMoods.test.ts
git commit -m "feat(freemium): add isMercyMood helper for the mercy rule"
```

---

## Task 2: Saving works for free users (count-capped)

**Files:**
- Modify: `src/constants/index.ts` (`maxSavedItems: 0` → `30`)
- Modify: `src/services/freemiumService.ts` (`canSaveItem` + `getSavedItemsCount`)
- Test: `src/services/__tests__/freemiumService.test.ts` (Save Items section)

- [ ] **Step 1: Update the failing test (Save Items)**

In `src/services/__tests__/freemiumService.test.ts`, the test currently mocks `../../database/schema` with `dbQuery: jest.fn((op) => op({ getFirstAsync: jest.fn(), runAsync: jest.fn() }))`. Replace the **Save Items** describe block with:

```ts
  describe('Save Items', () => {
    it('always allows saving for premium users', async () => {
      mockSubscriptionService.isPremium.mockReturnValue(true);
      expect(await service.canSaveItem()).toBe(true);
    });

    it('allows saving for free users under the cap', async () => {
      mockSubscriptionService.isPremium.mockReturnValue(false);
      const { dbQuery } = require('../../database/schema');
      dbQuery.mockImplementationOnce((op: any) =>
        op({ getFirstAsync: jest.fn().mockResolvedValue({ n: 5 }) }),
      );
      expect(await service.canSaveItem()).toBe(true);
    });

    it('blocks saving for free users at the cap', async () => {
      mockSubscriptionService.isPremium.mockReturnValue(false);
      const { dbQuery } = require('../../database/schema');
      dbQuery.mockImplementationOnce((op: any) =>
        op({ getFirstAsync: jest.fn().mockResolvedValue({ n: 30 }) }),
      );
      expect(await service.canSaveItem()).toBe(false);
    });
  });
```

Also update the mocked constants block near the top of the test file so `maxSavedItems` is `30`:

```ts
jest.mock('../../constants', () => ({
  FREEMIUM_LIMITS: {
    refreshesPerPrayerWindow: 3,
    maxSavedItems: 30,
    rotationHistoryDays: 30,
  },
  isMercyMood: jest.fn(() => false),
}));
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/services/__tests__/freemiumService.test.ts -t "Save Items"`
Expected: FAIL — current `canSaveItem` returns `isPremium()` only (free → false even under cap).

- [ ] **Step 3: Change the constant**

In `src/constants/index.ts`, set `maxSavedItems: 30` (was `0`) in `FREEMIUM_LIMITS`.

- [ ] **Step 4: Implement count-based `canSaveItem`**

In `src/services/freemiumService.ts`, add the import at the top:

```ts
import { dbQuery } from '../database/schema';
```

Replace the existing `canSaveItem` method:

```ts
  async canSaveItem(): Promise<boolean> {
    if (this.isPremium()) return true;
    const count = await this.getSavedItemsCount();
    return count < FREEMIUM_LIMITS.maxSavedItems;
  }

  /**
   * Unified saved-item count for the free cap. A guidance Quran-save writes to
   * BOTH saved_reflections and bookmarked_verses (mirror row id `bv_guidance_*`),
   * so we count all reflections plus only the non-mirror bookmarks — a single
   * saved verse counts once.
   */
  private async getSavedItemsCount(): Promise<number> {
    return dbQuery(async (db) => {
      const row = await db.getFirstAsync<{ n: number }>(
        `SELECT (SELECT COUNT(*) FROM saved_reflections)
              + (SELECT COUNT(*) FROM bookmarked_verses WHERE id NOT LIKE 'bv_guidance_%') AS n`,
      );
      return row?.n ?? 0;
    });
  }
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx jest src/services/__tests__/freemiumService.test.ts -t "Save Items"`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/constants/index.ts src/services/freemiumService.ts src/services/__tests__/freemiumService.test.ts
git commit -m "feat(freemium): free users can save up to 30 items (fix maxSavedItems:0)"
```

---

## Task 3: Additive schema — `windowKey` on user_sessions

**Files:**
- Modify: `src/types/index.ts` (`UserSession`)
- Modify: `src/database/tables.ts` (`user_sessions` DDL)
- Modify: `src/database/migrations.ts` (new step)

This task is additive (optional column) and safe on its own.

- [ ] **Step 1: Add the type field**

In `src/types/index.ts`, in `interface UserSession`, add `windowKey`:

```ts
export interface UserSession {
  id: string;
  date: string; // YYYY-MM-DD format
  guidanceSessionsUsed: number; // legacy (daily-session cap removed); retained for back-compat
  nextRefreshesRemaining: number;
  lastResetTime: number;
  windowKey?: string; // `${YYYY-MM-DD}:${PrayerContext}` — resets refreshes per prayer window
}
```

- [ ] **Step 2: Add the column to the CREATE TABLE**

In `src/database/tables.ts`, update the `user_sessions` definition to include `windowKey TEXT`:

```sql
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  guidanceSessionsUsed INTEGER NOT NULL DEFAULT 0,
  nextRefreshesRemaining INTEGER NOT NULL DEFAULT 3,
  lastResetTime INTEGER NOT NULL,
  windowKey TEXT
);
```

- [ ] **Step 3: Add the migration step**

In `src/database/migrations.ts`, after the last `await runStep(...)` and before the final `console.log`, add:

```ts
  // user_sessions: windowKey (per-prayer-window refresh reset)
  await runStep('user_sessions.windowKey', async () => {
    if (!(await hasColumn('user_sessions', 'windowKey'))) {
      console.log('[Migration] Adding windowKey to user_sessions...');
      await db.execAsync(`ALTER TABLE user_sessions ADD COLUMN windowKey TEXT`);
    }
  });
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: PASS (no errors from these edits).

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/database/tables.ts src/database/migrations.ts
git commit -m "feat(freemium): add user_sessions.windowKey column + migration"
```

---

## Task 4: Per-prayer-window refresh model + mercy in SessionService

**Files:**
- Modify: `src/constants/index.ts` (reshape `FREEMIUM_LIMITS`)
- Modify: `src/types/index.ts` (`FreemiumLimits`)
- Modify: `src/services/sessionService.ts`
- Test: `src/services/__tests__/sessionService.test.ts` (create)

- [ ] **Step 1: Reshape the limit constant + interface**

In `src/constants/index.ts`, replace `FREEMIUM_LIMITS`:

```ts
export const FREEMIUM_LIMITS = {
  refreshesPerPrayerWindow: 3,
  maxSavedItems: 30,
  rotationHistoryDays: 30,
} as const;
```

In `src/types/index.ts`, replace `interface FreemiumLimits`:

```ts
export interface FreemiumLimits {
  refreshesPerPrayerWindow: number;
  maxSavedItems: number;
  rotationHistoryDays: number;
}
```

- [ ] **Step 2: Write the failing SessionService test**

Create `src/services/__tests__/sessionService.test.ts`:

```ts
import { SessionService } from '../sessionService';

jest.mock('../../database/schema', () => ({
  dbQuery: jest.fn((op) =>
    op({
      getFirstAsync: jest.fn().mockResolvedValue(null),
      runAsync: jest.fn().mockResolvedValue(undefined),
    }),
  ),
}));

jest.mock('../../constants', () => ({
  FREEMIUM_LIMITS: { refreshesPerPrayerWindow: 3, maxSavedItems: 30, rotationHistoryDays: 30 },
}));

const mockGetContext = jest.fn().mockResolvedValue('dhuhr');
jest.mock('../prayerTimesService', () => ({
  __esModule: true,
  default: { getInstance: () => ({ getCurrentPrayerContext: mockGetContext }) },
}));

describe('SessionService per-window refresh + mercy', () => {
  let service: SessionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetContext.mockResolvedValue('dhuhr');
    (SessionService as any).instance = null;
    service = SessionService.getInstance();
    await service.initialize(false); // creates a fresh free session
  });

  it('starts a free window with the configured refresh count', () => {
    expect(service.getRemainingRefreshes(false)).toBe(3);
  });

  it('decrements on each free refresh', async () => {
    await service.useNextRefresh(false);
    expect(service.getRemainingRefreshes(false)).toBe(2);
  });

  it('blocks free refresh at zero', async () => {
    await service.useNextRefresh(false);
    await service.useNextRefresh(false);
    await service.useNextRefresh(false);
    expect(service.canUseNextRefresh(false)).toBe(false);
    expect(await service.useNextRefresh(false)).toBe(false);
  });

  it('treats mercy as unlimited and does NOT decrement the counter', async () => {
    await service.useNextRefresh(false, true); // mercy
    await service.useNextRefresh(false, true);
    expect(service.getRemainingRefreshes(false, true)).toBe(Infinity);
    expect(service.getRemainingRefreshes(false)).toBe(3); // counter untouched
  });

  it('resets the counter when the prayer window changes', async () => {
    await service.useNextRefresh(false);
    expect(service.getRemainingRefreshes(false)).toBe(2);
    mockGetContext.mockResolvedValue('asr'); // new window
    await service.syncWindow(false);
    expect(service.getRemainingRefreshes(false)).toBe(3);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx jest src/services/__tests__/sessionService.test.ts`
Expected: FAIL — `syncWindow` undefined; mercy param unsupported; refreshes seeded from removed `nextRefreshesPerSession`.

- [ ] **Step 4: Rework SessionService**

In `src/services/sessionService.ts`:

(a) Add the prayer-times import at the top:

```ts
import PrayerTimesService from './prayerTimesService';
```

(b) Replace every `FREEMIUM_LIMITS.nextRefreshesPerSession` with `FREEMIUM_LIMITS.refreshesPerPrayerWindow` (in `loadUserSession`, `createNewSession`, `resetRefreshesToLimit`).

(c) Add window resolution + sync methods (place after `createNewSession`):

```ts
  /** `${YYYY-MM-DD}:${PrayerContext}` — the bucket refreshes belong to. */
  private async resolveWindowKey(): Promise<string> {
    const today = new Date().toISOString().split('T')[0];
    const context = await PrayerTimesService.getInstance().getCurrentPrayerContext();
    return `${today}:${context}`;
  }

  /**
   * Resets the free refresh allowance when the prayer window changes. Premium is
   * kept effectively unlimited (999). Safe to call repeatedly; only writes on change.
   */
  async syncWindow(isPremium: boolean): Promise<void> {
    if (!this.currentSession) return;
    const key = await this.resolveWindowKey();
    if (this.currentSession.windowKey !== key) {
      this.currentSession.windowKey = key;
      this.currentSession.nextRefreshesRemaining = isPremium
        ? 999
        : FREEMIUM_LIMITS.refreshesPerPrayerWindow;
      await this.saveSession();
    }
  }
```

(d) Persist `windowKey` in `saveSession` — update the UPDATE statement:

```ts
          await db.runAsync(
            `UPDATE user_sessions
             SET guidanceSessionsUsed = ?, nextRefreshesRemaining = ?, windowKey = ?
             WHERE id = ?`,
            [
              this.currentSession!.guidanceSessionsUsed,
              this.currentSession!.nextRefreshesRemaining,
              this.currentSession!.windowKey ?? null,
              this.currentSession!.id,
            ],
          );
```

(e) Drop the daily-session cap. Replace `canStartGuidanceSession` and `startGuidanceSession`:

```ts
  canStartGuidanceSession(_isPremium: boolean): boolean {
    // Daily-session cap removed — guidance is always available; refreshes are
    // limited per prayer window instead.
    return !!this.currentSession;
  }

  async startGuidanceSession(isPremium: boolean): Promise<boolean> {
    if (!this.currentSession) return false;
    await this.syncWindow(isPremium); // ensure the window's allowance is current
    return true;
  }
```

(f) Add the mercy parameter to the three refresh methods:

```ts
  canUseNextRefresh(isPremium: boolean, mercyActive: boolean = false): boolean {
    if (!this.currentSession) return false;
    if (isPremium || mercyActive) return true;
    return this.currentSession.nextRefreshesRemaining > 0;
  }

  async useNextRefresh(isPremium: boolean, mercyActive: boolean = false): Promise<boolean> {
    let release!: () => void;
    const prev = this.operationLock;
    this.operationLock = new Promise((r) => { release = r; });
    await prev;
    try {
      if (!this.currentSession) return false;
      if (isPremium || mercyActive) return true; // unlimited — no decrement
      if (this.currentSession.nextRefreshesRemaining > 0) {
        this.currentSession.nextRefreshesRemaining--;
        await this.saveSession();
        return true;
      }
      return false;
    } finally {
      release();
    }
  }

  getRemainingRefreshes(isPremium: boolean, mercyActive: boolean = false): number {
    if (!this.currentSession) return 0;
    if (isPremium || mercyActive) return Infinity;
    return Math.max(0, this.currentSession.nextRefreshesRemaining);
  }
```

(g) Remove the now-unused `getRemainingSessions` method and its `FREEMIUM_LIMITS.dailyGuidanceSessions` reference (the daily-session concept is gone). (Its only caller, `freemiumService.getRemainingSessions`, is removed in Task 5.)

- [ ] **Step 5: Run to verify it passes**

Run: `npx jest src/services/__tests__/sessionService.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add src/constants/index.ts src/types/index.ts src/services/sessionService.ts src/services/__tests__/sessionService.test.ts
git commit -m "feat(freemium): per-prayer-window refreshes + mercy in SessionService"
```

---

## Task 5: Thread mood/mercy + window sync through FreemiumService; remove comfort-flow paywall

**Files:**
- Modify: `src/services/freemiumService.ts`
- Test: `src/services/__tests__/freemiumService.test.ts`

- [ ] **Step 1: Update the failing tests**

In `src/services/__tests__/freemiumService.test.ts`:

(a) Update the `sessionService` mock to accept the mercy arg and add `syncWindow`. Replace the relevant mocked methods:

```ts
      canUseNextRefresh: jest.fn(() => true),
      useNextRefresh: jest.fn(() => Promise.resolve(true)),
      getRemainingRefreshes: jest.fn(() => 3),
      syncWindow: jest.fn(() => Promise.resolve()),
```

(b) Replace the **Limits** describe block to match the new shape:

```ts
  describe('Limits', () => {
    it('returns free-tier limits', () => {
      const limits = service.getCurrentLimits();
      expect(limits.refreshesPerPrayerWindow).toBe(3);
      expect(limits.maxSavedItems).toBe(30);
      expect(limits.rotationHistoryDays).toBe(30);
    });

    it('returns unlimited limits for premium', () => {
      mockSubscriptionService.isPremium.mockReturnValue(true);
      const limits = service.getCurrentLimits();
      expect(limits.refreshesPerPrayerWindow).toBe(Infinity);
      expect(limits.maxSavedItems).toBe(Infinity);
      expect(limits.rotationHistoryDays).toBe(90);
    });
  });
```

(c) Replace the **Paywall Detection** describe block (comfort-flow paywall removed):

```ts
  describe('Paywall Detection', () => {
    it('returns null (comfort-flow paywall removed — peaks-only model)', () => {
      expect(service.getPaywallType()).toBeNull();
    });

    it('returns null when premium', () => {
      mockSubscriptionService.isPremium.mockReturnValue(true);
      expect(service.getPaywallType()).toBeNull();
    });
  });
```

(d) Replace the **Session Management** assertions for refreshes to confirm mercy threading. Replace the two refresh tests with:

```ts
    it('passes non-mercy by default for remaining refreshes', () => {
      mockSessionService.getRemainingRefreshes.mockReturnValue(3);
      expect(service.getRemainingRefreshes()).toBe(3);
      expect(mockSessionService.getRemainingRefreshes).toHaveBeenCalledWith(false, false);
    });

    it('passes mercy=true for a heavy mood', () => {
      const { isMercyMood } = require('../../constants');
      isMercyMood.mockReturnValue(true);
      service.getRemainingRefreshes('Sad' as any);
      expect(mockSessionService.getRemainingRefreshes).toHaveBeenCalledWith(false, true);
    });
```

Also delete the now-obsolete `getRemainingSessions` test in this block.

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/services/__tests__/freemiumService.test.ts`
Expected: FAIL — old limit shape, `getPaywallType` returns objects, refresh methods take no mood.

- [ ] **Step 3: Update FreemiumService**

In `src/services/freemiumService.ts`:

(a) Update imports — add `Mood` and `isMercyMood`:

```ts
import { UserSession, FreemiumLimits, PaywallType, SubscriptionState, Mood } from '../types';
import { FREEMIUM_LIMITS, isMercyMood } from '../constants';
```

(b) Update `PREMIUM_LIMITS`:

```ts
const PREMIUM_LIMITS: FreemiumLimits = {
  refreshesPerPrayerWindow: Infinity,
  maxSavedItems: Infinity,
  rotationHistoryDays: 90,
};
```

(c) Add `syncPrayerWindow` and make the refresh API mood-aware. Replace the `canUseNextRefresh` / `useNextRefresh` / `getRemainingRefreshes` methods:

```ts
  /** Refresh the per-prayer-window allowance (call when guidance loads). */
  async syncPrayerWindow(): Promise<void> {
    await this.sessionService.syncWindow(this.isPremium());
  }

  canUseNextRefresh(mood?: Mood): boolean {
    return this.sessionService.canUseNextRefresh(this.isPremium(), this.mercy(mood));
  }

  async useNextRefresh(mood?: Mood): Promise<boolean> {
    return this.sessionService.useNextRefresh(this.isPremium(), this.mercy(mood));
  }

  getRemainingRefreshes(mood?: Mood): number {
    return this.sessionService.getRemainingRefreshes(this.isPremium(), this.mercy(mood));
  }

  private mercy(mood?: Mood): boolean {
    return mood ? isMercyMood(mood) : false;
  }
```

(d) Replace `getPaywallType` with the peaks-only no-op:

```ts
  getPaywallType(): PaywallType | null {
    // Comfort-flow paywalls removed (spec §8). The in-flow limit is a gentle
    // resting point handled in the UI; upgrade asks live at peaks via
    // shouldOfferUpgrade() (Phase 2). Always null here.
    return null;
  }
```

(e) Remove the `getRemainingSessions` method (daily-session concept gone). Leave `canStartGuidanceSession` / `startGuidanceSession` (they now just delegate to the always-available session methods).

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest src/services/__tests__/freemiumService.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck (catch removed-symbol references)**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: PASS. If `getRemainingSessions` is referenced anywhere in UI, remove that usage (display of "sessions left" is replaced by refreshes-per-window).

- [ ] **Step 6: Commit**

```bash
git add src/services/freemiumService.ts src/services/__tests__/freemiumService.test.ts
git commit -m "feat(freemium): mood-aware refresh API + remove comfort-flow paywall"
```

---

## Task 6: Wire the active mood + window sync into guidance

**Files:**
- Modify: `src/hooks/useGuidanceLogic.ts`

- [ ] **Step 1: Sync the window and pass mood when reading remaining refreshes**

In `src/hooks/useGuidanceLogic.ts`, replace the init effect (around lines 60–67) that currently does `setRemainingRefreshes(freemiumService.getRemainingRefreshes())`:

```ts
  useEffect(() => {
    const init = async () => {
      await freemiumService.syncPrayerWindow();
      setRemainingRefreshes(freemiumService.getRemainingRefreshes(mood));
      const prefs = await preferencesService.initialize();
      setPreferences(prefs);
    };
    init();
  }, [mood]);
```

(`mood` is already a parameter of `useGuidanceLogic`.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGuidanceLogic.ts
git commit -m "feat(freemium): sync prayer window + mood-aware refresh count in guidance"
```

---

## Task 7: Un-gate journeys (free-core, distress journeys included)

**Files:**
- Modify: `src/services/pathsService.ts`
- Test: `src/services/__tests__/pathsService.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `src/services/__tests__/pathsService.test.ts`:

```ts
import { PathsService } from '../pathsService';

jest.mock('../supabaseDataService', () => ({
  SupabaseDataService: { getInstance: () => ({}) },
}));

describe('PathsService free-core access', () => {
  const service = PathsService.getInstance();

  it('exposes previously premium-gated distress journeys to free users', () => {
    const ids = service.getAllPaths(false, []).map((p) => p.id);
    expect(ids).toContain('path_addiction_recovery');
    expect(ids).toContain('path_grief_loss');
    expect(ids).toContain('path_tawbah_intensive');
  });

  it('returns the same set regardless of premium status', () => {
    const free = service.getAllPaths(false, []).map((p) => p.id).sort();
    const premium = service.getAllPaths(true, []).map((p) => p.id).sort();
    expect(free).toEqual(premium);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/services/__tests__/pathsService.test.ts`
Expected: FAIL — special-edition distress journeys are filtered out unless their bundle is unlocked.

- [ ] **Step 3: Remove the gating**

In `src/services/pathsService.ts`, replace `getAllPaths`:

```ts
  getAllPaths(_isPremium: boolean = false, _unlockedBundleIds: string[] = []): SpiritualPath[] {
    // Free-core model (spec §5): every journey's text is free, distress journeys
    // included. The paid layer is the enhanced edition (audio/PDF), gated at the
    // content level in a later phase — not by hiding the journey here.
    // `_isPremium` / `_unlockedBundleIds` are reserved for early-access windows (§6).
    return STATIC_SPIRITUAL_PATHS;
  }
```

(The hardcoded `premiumIds` array is deleted. `getAvailablePaths` still delegates here and keeps working.)

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest src/services/__tests__/pathsService.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/pathsService.ts src/services/__tests__/pathsService.test.ts
git commit -m "feat(freemium): un-gate journeys — distress journeys are free-core"
```

---

## Task 8: Full verification

- [ ] **Step 1: Run the whole suite**

Run: `npx jest`
Expected: PASS. If `rotationEngine.test.ts` references the old `FREEMIUM_LIMITS` shape (`dailyGuidanceSessions`/`nextRefreshesPerSession`), update those references to the new field names; otherwise leave it untouched.

- [ ] **Step 2: Typecheck the project**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: PASS with no errors.

- [ ] **Step 3: Final commit (if any fixups were needed)**

```bash
git add -A
git commit -m "test(freemium): phase 1 suite + typecheck green"
```

---

## Self-Review

**Spec coverage (Phase 1 scope):**
- §3.1 saving free + count → Task 2 ✓
- §3.2 per-prayer-window refresh (uses `PrayerContext` + fallback) → Tasks 3, 4, 6 ✓
- §4 mercy rule (6 moods, no decrement, no paywall) → Tasks 1, 4, 5 ✓
- §5 un-gate journeys / distress free-core → Task 7 ✓
- §8 comfort-flow paywall removed → Task 5 (`getPaywallType` → null) ✓
- §10 `windowKey` column + migration → Task 3 ✓
- §13 tests-first → every task is TDD where logic allows ✓
- Deferred by design: prayer-reminder copy (no functional gate found — Phase 2 paywall reframe), premium-feature gating + peaks/`shouldOfferUpgrade` (Phase 2), pricing/lifetime + dynamic price (Phase 3), enhanced editions + early-access windows (Phase 4). The UI resting-point message at zero refreshes is Phase 2; Phase 1 makes the limit logic correct.

**Placeholder scan:** No TBD/TODO; every code step shows complete code and exact commands. ✓

**Type consistency:** `FreemiumLimits` = `{ refreshesPerPrayerWindow, maxSavedItems, rotationHistoryDays }` used identically in constants (Task 4), `PREMIUM_LIMITS` (Task 5), and tests. Refresh methods: `(isPremium, mercyActive=false)` in SessionService (Task 4) called as `(this.isPremium(), this.mercy(mood))` in FreemiumService (Task 5). `syncWindow(isPremium)` (Task 4) ⇄ `syncPrayerWindow()` (Task 5) ⇄ `useGuidanceLogic` (Task 6). `windowKey` field name consistent across type/DDL/migration/service. ✓

**Known follow-ups (not Phase 1 blockers):** PathsScreen still renders `isPremium` pills on now-free journeys until the Phase 2 UI cleanup; `getPaywallType` callers in the guidance flow now always get `null`, so the refresh-exhausted UI message is added in Phase 2.
