# Pro Early Access & Supporter View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every new journey reaches Pro 30 days before it opens to everyone (computed, never hand-dated), and a Pro user who opens the Support screen sees what their support has built instead of a paywall.

**Architecture:** Journey release data moves out of `PathsScreen.tsx` into one constants module. A pure util decides, for a given journey, tier, progress and day, whether it is locked and what its label says; `PathsScreen` and the new supporter view both read it. RevenueCat's entitlement `originalPurchaseDateMillis` becomes an in-memory `supporterSinceMs` on `SubscriptionState`; a new `SupporterThanks` component renders the Pro view inside `SupportSakinaScreen`.

**Tech Stack:** React Native (Expo), TypeScript, `StyleSheet` + `DesignSystem.ts` tokens, `react-native-purchases`, Jest + `@testing-library/react-native`.

**Spec:** `docs/superpowers/specs/2026-10-13-pro-early-access-and-supporter-view-design.md`

## Global Constraints

- `EARLY_ACCESS_DAYS = 30`. Free date = `released` + 30 calendar days, local time.
- Access kinds are exactly `'early_access' | 'pro_exclusive' | 'free'`. New journeys default to `'early_access'`. Crisis/distress journeys must be `'free'`. `path_hope_after_crisis` is `'free'`.
- `path_marriage_seeker` and `path_death_awareness` stay `'pro_exclusive'` with label `Sakina Pro exclusive`.
- Grandfathering unchanged: existing progress on a journey ⇒ never locked.
- Locked early-access label: `Free from <Mon D>` (e.g. `Free from Nov 12`). Stub label: `Coming soon`. Pro in-window pill: `Pro early access`.
- No free-trial copy anywhere (removed in 3a92a39).
- Styling: `StyleSheet.create` outside render, only `Spacing` / `BorderRadius` / `Typography` / `Colors` tokens, bare icons (no circular containers), 44pt touch targets via `hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}`.
- `src/**/*.ts(x)` files are **CRLF**. After any scripted edit, assert zero bare LFs. Never run `prettier --write` on the repo.
- Supporter-since lives in memory only — no SQLite column, no kv_store key.
- Never start an EAS build. Commit on branch `feat/pro-early-access-supporter-view` (cut from `main` once `fix/free-pro-promises-no-trial` is merged, or from that branch if not yet merged) and push after each task.

## Review Focus

1. **The 30-day boundary.** On day 29 after release a free user is locked; on day 30 the journey is free. Pinned in Task 2.
2. **Month-end and year-end date math.** `2026-01-31` + 30 = `2026-03-02`; `2026-12-15` + 30 = `2027-01-14`. Pinned in Task 2.
3. **A Pro user who lapses mid-window.** No progress ⇒ locked with `Free from …`; with progress ⇒ unlocked. Pinned in Task 2.
4. **Supporter-since unknown** (offline, promotional grant with no date, `0`). The supporter view shows no date and no "Built since you joined" section, never `Invalid Date`. Pinned in Tasks 5 and 7.
5. **Supporter-since after every release, or in the future** (clock skew). Released-since list is empty, the empty-state line shows, and journeys with `released` after today never appear. Pinned in Task 6.

---

### Task 1: Move journey release data into one constants module

No behavior change. This is the single source both features read.

**Files:**
- Create: `src/constants/journeyAvailability.ts`
- Create: `src/constants/__tests__/journeyAvailability.test.ts`
- Modify: `src/screens/PathsScreen.tsx` (delete `AVAILABLE_PATHS`, `AVAILABLE_PATH_IDS`, `PREMIUM_GATED_PATHS` and their comment blocks, ~lines 50–90; import from the new module)
- Modify: `scripts/verify-journey-claims.mjs:165` and `:357-358`

**Interfaces:**
- Produces:
  - `type JourneyAccessKind = 'early_access' | 'pro_exclusive' | 'free'`
  - `interface JourneyRelease { released: string; access: JourneyAccessKind }`
  - `const EARLY_ACCESS_DAYS = 30`
  - `const AVAILABLE_PATHS: Record<string, JourneyRelease>`
  - `const AVAILABLE_PATH_IDS: Set<string>`

- [ ] **Step 1: Write the failing test**

`src/constants/__tests__/journeyAvailability.test.ts`:

```ts
/**
 * Every startable journey must have real content and a parseable release
 * date, and the access kinds must match owner decisions recorded in
 * docs/superpowers/specs/2026-10-13-pro-early-access-and-supporter-view-design.md.
 *
 * WHAT THIS DOES NOT CATCH: whether a `released` date is the day the build
 * actually reached users (store review can lag a hand-written date), and
 * whether a NEW crisis journey was correctly marked 'free' — only the one
 * named below is pinned.
 */
import { AVAILABLE_PATHS, AVAILABLE_PATH_IDS, EARLY_ACCESS_DAYS } from '../journeyAvailability';
import { STATIC_SPIRITUAL_PATHS } from '../../data/staticPaths';

describe('journeyAvailability', () => {
  it('lists only journeys that exist and have authored days', () => {
    for (const id of AVAILABLE_PATH_IDS) {
      const path = STATIC_SPIRITUAL_PATHS.find((p) => p.id === id);
      expect(path).toBeDefined();
      expect(path!.dailySteps.length).toBeGreaterThan(0);
    }
  });

  it('gives every journey a valid YYYY-MM-DD release date', () => {
    for (const [id, r] of Object.entries(AVAILABLE_PATHS)) {
      expect(r.released).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const [y, m, d] = r.released.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      expect(`${id}:${date.getMonth() + 1}/${date.getDate()}`).toBe(`${id}:${m}/${d}`);
    }
  });

  it('keeps the owner-decided Pro exclusives and the crisis journey free', () => {
    const exclusives = Object.entries(AVAILABLE_PATHS)
      .filter(([, r]) => r.access === 'pro_exclusive')
      .map(([id]) => id)
      .sort();
    expect(exclusives).toEqual(['path_death_awareness', 'path_marriage_seeker']);
    expect(AVAILABLE_PATHS.path_hope_after_crisis.access).toBe('free');
  });

  it('uses a 30-day window', () => {
    expect(EARLY_ACCESS_DAYS).toBe(30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/constants/__tests__/journeyAvailability.test.ts`
Expected: FAIL — `Cannot find module '../journeyAvailability'`.

- [ ] **Step 3: Create the module**

`src/constants/journeyAvailability.ts` (save with CRLF line endings):

```ts
/**
 * Journey availability — the ONE place that says which journeys can be
 * started, when each reached users, and who may start it.
 *
 * `released` is the day the journey reached Pro users: the release day of the
 * build that carries it, not the day it was authored. The free date for an
 * 'early_access' journey is COMPUTED from it (src/utils/journeyAccess.ts) and
 * never written by hand. Trusting the Results carried a hand-written
 * "Free tier · 2 weeks" label from 2026-07-01 until 2026-10-13 because
 * nothing expired it; a computed date cannot go stale that way.
 *
 * Access kinds:
 *  - 'early_access'  default for every NEW journey. Pro-only for
 *                    EARLY_ACCESS_DAYS after `released`, then free.
 *  - 'pro_exclusive' Pro-only with no free date. Owner decision per journey.
 *  - 'free'          never gated. REQUIRED for crisis/distress journeys: a
 *                    person in crisis must not meet a paywall.
 *
 * Every journey shipped before this module existed is older than
 * EARLY_ACCESS_DAYS, so 'early_access' on them is already free.
 *
 * scripts/verify-journey-claims.mjs reads the keys of AVAILABLE_PATHS from
 * this file with a regex: keep one entry per line, keyed by bare `path_…` ids.
 */

export type JourneyAccessKind = 'early_access' | 'pro_exclusive' | 'free';

export interface JourneyRelease {
  /** YYYY-MM-DD, local calendar day the journey reached Pro users. */
  released: string;
  access: JourneyAccessKind;
}

export const EARLY_ACCESS_DAYS = 30;

export const AVAILABLE_PATHS: Record<string, JourneyRelease> = {
  path_rizq_revolution:      { released: '2026-06-27', access: 'early_access' },
  path_salah_transformation: { released: '2026-06-27', access: 'early_access' },
  path_study_journaling:     { released: '2026-07-01', access: 'early_access' },
  path_trusting_the_results: { released: '2026-07-01', access: 'early_access' },
  path_prayer_leadership:    { released: '2026-08-01', access: 'early_access' },
  path_hope_after_crisis:    { released: '2026-08-15', access: 'free' },
  path_marriage_seeker:      { released: '2026-08-18', access: 'pro_exclusive' },
  path_tawbah_intensive:     { released: '2026-08-29', access: 'early_access' },
  path_death_awareness:      { released: '2026-08-30', access: 'pro_exclusive' },
  path_screen_detox:         { released: '2026-09-09', access: 'early_access' },
};

export const AVAILABLE_PATH_IDS = new Set(Object.keys(AVAILABLE_PATHS));
```

- [ ] **Step 4: Point `PathsScreen.tsx` at it (behavior unchanged)**

Delete the `AVAILABLE_PATHS`, `AVAILABLE_PATH_IDS` and `PREMIUM_GATED_PATHS` declarations and their comment blocks. Add:

```ts
import { AVAILABLE_PATHS, AVAILABLE_PATH_IDS } from '../constants/journeyAvailability';
```

Replace the three remaining uses so behavior is identical until Task 3:
- `PREMIUM_GATED_PATHS[pathId]` in `isPathLocked` and `onPathSelected` → `AVAILABLE_PATHS[pathId]?.access === 'pro_exclusive'`
- `lockedLabel={AVAILABLE_PATH_IDS.has(item.id) ? PREMIUM_GATED_PATHS[item.id] : undefined}` → `lockedLabel={AVAILABLE_PATHS[item.id]?.access === 'pro_exclusive' ? 'Sakina Pro exclusive' : undefined}`
- the sort's `AVAILABLE_PATHS[a.id]` / `[b.id]` → `AVAILABLE_PATHS[a.id]?.released` / `?.released`

Update the file header comment's references to `PREMIUM_GATED_PATHS` to name `src/constants/journeyAvailability.ts`.

- [ ] **Step 5: Point the claims verifier at the new file**

In `scripts/verify-journey-claims.mjs`, change line 165:

```js
const pathsScreen = fs.readFileSync(path.join(ROOT, 'src/constants/journeyAvailability.ts'), 'utf8');
```

and the error on line 358 to `'Could not find AVAILABLE_PATHS in src/constants/journeyAvailability.ts'`. Update the header comment on line 14 the same way. Rename the variable `pathsScreen` → `availabilitySrc` at both uses.

Prove the regex still finds all ten ids (offline):

Write `scratch/check-ap.mjs` in your scratchpad:

```js
import fs from 'node:fs';
const src = fs.readFileSync(process.argv[2], 'utf8');
const ap = src.match(/const AVAILABLE_PATHS[^{]*\{([\s\S]*?)\n\};/);
const ids = [...ap[1].matchAll(/(path_[a-z_]+):/g)].map((m) => m[1]);
console.log(ids.length, ids.join(' '));
```

Run: `node <scratchpad>/check-ap.mjs src/constants/journeyAvailability.ts`
Expected: `10 path_rizq_revolution … path_screen_detox`

- [ ] **Step 6: Run tests, typecheck, line endings**

Run: `npx jest src/constants && npx tsc --noEmit -p tsconfig.json`
Expected: PASS, no type errors.
Run: `node -e "for (const f of ['src/constants/journeyAvailability.ts','src/screens/PathsScreen.tsx']) { const s=require('fs').readFileSync(f,'utf8'); console.log(f, (s.match(/(?<!\r)\n/g)||[]).length) }"`
Expected: `0` for both.

- [ ] **Step 7: Commit and push**

```bash
git add src/constants/journeyAvailability.ts src/constants/__tests__/journeyAvailability.test.ts src/screens/PathsScreen.tsx scripts/verify-journey-claims.mjs
git commit -m "refactor(journeys): move release data into constants/journeyAvailability"
git push
```

---

### Task 2: Pure access rule (`journeyAccess.ts`)

**Files:**
- Create: `src/utils/journeyAccess.ts`
- Create: `src/utils/__tests__/journeyAccess.test.ts`

**Interfaces:**
- Consumes: `AVAILABLE_PATHS`, `EARLY_ACCESS_DAYS`, `JourneyRelease` from Task 1; `formatDateYMD`, `subtractDays` from `src/utils/date.ts`.
- Produces:
  - `parseYMD(ymd: string): Date` — local midnight
  - `publicFromYMD(release: JourneyRelease): string | null` — `null` for `'pro_exclusive'`; `released` for `'free'`; `released + EARLY_ACCESS_DAYS` for `'early_access'`
  - `formatShortDate(ymd: string): string` — `'Nov 12'`
  - `interface JourneyAccess { locked: boolean; label?: string; inEarlyAccess: boolean; routeToPaywall: boolean }`
  - `getJourneyAccess(pathId: string, opts: { isPremium: boolean; hasProgress: boolean; today: string }): JourneyAccess`

- [ ] **Step 1: Write the failing tests**

`src/utils/__tests__/journeyAccess.test.ts`:

```ts
/**
 * journeyAccess — who may start which journey, on which day.
 *
 * WHAT THIS DOES NOT CATCH: the device clock. `today` comes from the phone,
 * so a free user who moves their clock forward unlocks early (accepted in
 * the spec). It also cannot tell whether a journey's `released` date is right.
 */
import { getJourneyAccess, publicFromYMD, formatShortDate, parseYMD } from '../journeyAccess';

const early = { released: '2026-11-01', access: 'early_access' as const };

jest.mock('../../constants/journeyAvailability', () => ({
  EARLY_ACCESS_DAYS: 30,
  AVAILABLE_PATHS: {
    path_new: { released: '2026-11-01', access: 'early_access' },
    path_jan: { released: '2026-01-31', access: 'early_access' },
    path_dec: { released: '2026-12-15', access: 'early_access' },
    path_excl: { released: '2026-08-18', access: 'pro_exclusive' },
    path_crisis: { released: '2026-11-01', access: 'free' },
  },
  AVAILABLE_PATH_IDS: new Set(['path_new', 'path_jan', 'path_dec', 'path_excl', 'path_crisis']),
}));

const free = { isPremium: false, hasProgress: false };
const pro = { isPremium: true, hasProgress: false };

describe('publicFromYMD', () => {
  it('adds 30 calendar days for early access', () => {
    expect(publicFromYMD(early)).toBe('2026-12-01');
  });
  it('rolls over month ends and year ends', () => {
    expect(publicFromYMD({ released: '2026-01-31', access: 'early_access' })).toBe('2026-03-02');
    expect(publicFromYMD({ released: '2026-12-15', access: 'early_access' })).toBe('2027-01-14');
  });
  it('is the release day for free journeys and null for exclusives', () => {
    expect(publicFromYMD({ released: '2026-11-01', access: 'free' })).toBe('2026-11-01');
    expect(publicFromYMD({ released: '2026-08-18', access: 'pro_exclusive' })).toBeNull();
  });
});

describe('getJourneyAccess — early access', () => {
  it('locks a free user on day 29 with a computed label', () => {
    expect(getJourneyAccess('path_new', { ...free, today: '2026-11-30' })).toEqual({
      locked: true,
      label: 'Free from Dec 1',
      inEarlyAccess: true,
      routeToPaywall: true,
    });
  });
  it('opens to a free user on day 30', () => {
    expect(getJourneyAccess('path_new', { ...free, today: '2026-12-01' })).toEqual({
      locked: false,
      inEarlyAccess: false,
      routeToPaywall: false,
    });
  });
  it('gives Pro the journey in-window and marks it as early access', () => {
    expect(getJourneyAccess('path_new', { ...pro, today: '2026-11-01' })).toEqual({
      locked: false,
      label: 'Pro early access',
      inEarlyAccess: true,
      routeToPaywall: false,
    });
  });
  it('keeps a lapsed Pro user with progress going', () => {
    expect(
      getJourneyAccess('path_new', { isPremium: false, hasProgress: true, today: '2026-11-10' }).locked,
    ).toBe(false);
  });
  it('locks a lapsed Pro user without progress', () => {
    expect(getJourneyAccess('path_new', { ...free, today: '2026-11-10' }).locked).toBe(true);
  });
});

describe('getJourneyAccess — other kinds', () => {
  it('never locks a free (crisis) journey, even on release day', () => {
    expect(getJourneyAccess('path_crisis', { ...free, today: '2026-11-01' }).locked).toBe(false);
  });
  it('locks a Pro exclusive for free users with its fixed label', () => {
    expect(getJourneyAccess('path_excl', { ...free, today: '2030-01-01' })).toEqual({
      locked: true,
      label: 'Sakina Pro exclusive',
      inEarlyAccess: false,
      routeToPaywall: true,
    });
  });
  it('locks a stub with no paywall route', () => {
    expect(getJourneyAccess('path_stub', { ...pro, today: '2026-11-01' })).toEqual({
      locked: true,
      label: 'Coming soon',
      inEarlyAccess: false,
      routeToPaywall: false,
    });
  });
});

describe('formatShortDate / parseYMD', () => {
  it('formats a local calendar day', () => {
    expect(formatShortDate('2026-11-12')).toBe('Nov 12');
    expect(parseYMD('2026-03-02').getDate()).toBe(2);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/utils/__tests__/journeyAccess.test.ts`
Expected: FAIL — `Cannot find module '../journeyAccess'`.

- [ ] **Step 3: Implement**

`src/utils/journeyAccess.ts` (CRLF):

```ts
/**
 * Who may start which journey, on which day. Pure: every input is a
 * parameter, so PathsScreen, the supporter view and the tests all get the
 * same answer. Data lives in src/constants/journeyAvailability.ts.
 *
 * Dates are LOCAL calendar days (YYYY-MM-DD), compared as strings — the
 * format sorts lexicographically. Never toISOString(): that is UTC and gives
 * the wrong day west of Greenwich after local midnight.
 */
import {
  AVAILABLE_PATHS,
  AVAILABLE_PATH_IDS,
  EARLY_ACCESS_DAYS,
  JourneyRelease,
} from '../constants/journeyAvailability';
import { formatDateYMD, subtractDays } from './date';

export function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** First day everyone may start it; null when it never opens to free. */
export function publicFromYMD(release: JourneyRelease): string | null {
  if (release.access === 'pro_exclusive') return null;
  if (release.access === 'free') return release.released;
  return formatDateYMD(subtractDays(parseYMD(release.released), -EARLY_ACCESS_DAYS));
}

export function formatShortDate(ymd: string): string {
  return parseYMD(ymd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export interface JourneyAccess {
  locked: boolean;
  /** Pill copy. Locked: why. Unlocked: only the Pro early-access marker. */
  label?: string;
  /** Inside its Pro-first window today (regardless of who is looking). */
  inEarlyAccess: boolean;
  /** Tapping it should open the Support screen. */
  routeToPaywall: boolean;
}

export function getJourneyAccess(
  pathId: string,
  opts: { isPremium: boolean; hasProgress: boolean; today: string },
): JourneyAccess {
  if (!AVAILABLE_PATH_IDS.has(pathId)) {
    return { locked: true, label: 'Coming soon', inEarlyAccess: false, routeToPaywall: false };
  }
  const release = AVAILABLE_PATHS[pathId];
  const publicFrom = publicFromYMD(release);
  const inEarlyAccess =
    release.access === 'early_access' && publicFrom !== null && opts.today < publicFrom;
  const gated = release.access === 'pro_exclusive' || inEarlyAccess;

  // Grandfather: progress already made is never taken away, whatever the tier.
  if (!gated || opts.isPremium || opts.hasProgress) {
    return {
      locked: false,
      ...(inEarlyAccess && opts.isPremium ? { label: 'Pro early access' } : {}),
      inEarlyAccess,
      routeToPaywall: false,
    };
  }
  return {
    locked: true,
    label:
      release.access === 'pro_exclusive'
        ? 'Sakina Pro exclusive'
        : `Free from ${formatShortDate(publicFrom!)}`,
    inEarlyAccess,
    routeToPaywall: true,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npx jest src/utils/__tests__/journeyAccess.test.ts`
Expected: PASS (all tests). Then **prove the boundary test has teeth**: temporarily change `opts.today < publicFrom` to `opts.today <= publicFrom`, rerun, confirm "opens to a free user on day 30" FAILS, revert, rerun to PASS.

- [ ] **Step 5: Commit and push**

```bash
git add src/utils/journeyAccess.ts src/utils/__tests__/journeyAccess.test.ts
git commit -m "feat(journeys): computed Pro early-access window"
git push
```

---

### Task 3: Wire `PathsScreen` to the access rule

**Files:**
- Modify: `src/screens/PathsScreen.tsx` — `isPathLocked` (~line 490), `onPathSelected` (~line 500), `renderItem` (~line 718), `JourneyCard` props + unlocked branch (~lines 215–410), styles (~line 911)

**Interfaces:**
- Consumes: `getJourneyAccess(pathId, { isPremium, hasProgress, today })`, `JourneyAccess` from Task 2; `formatDateYMD` from `src/utils/date.ts`.

- [ ] **Step 1: Replace `isPathLocked` with an access lookup**

Add imports:

```ts
import { getJourneyAccess } from '../utils/journeyAccess';
import { formatDateYMD } from '../utils/date';
```

```ts
  // Single source of truth for lock state, label and paywall routing:
  // src/utils/journeyAccess.ts. The sort order, the tap handler and the
  // card's visual state all read this, so they cannot disagree.
  // `today` is read per render pass: a screen left open across midnight
  // picks up the new day on the next focus/progress reload.
  const accessFor = useCallback(
    (pathId: string) =>
      getJourneyAccess(pathId, {
        isPremium,
        hasProgress: userProgressList.some((p) => p.pathId === pathId),
        today: formatDateYMD(),
      }),
    [isPremium, userProgressList],
  );
  const isPathLocked = useCallback((pathId: string) => accessFor(pathId).locked, [accessFor]);
```

Keep the grandfather explanation comment above it, reworded to point at `journeyAccess.ts`.

- [ ] **Step 2: Route taps from the access result**

```ts
  const onPathSelected = (pathId: string) => {
    const access = accessFor(pathId);
    if (!access.locked) {
      navigation.navigate('PathDetail', { pathId });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // A contentless stub has no upgrade to offer; only a Pro gate routes on.
    if (access.routeToPaywall) navigation.navigate('Support');
  };
```

- [ ] **Step 3: Pass the label for both states**

In `renderItem`:

```tsx
          const access = accessFor(item.id);
          return (
            <JourneyCard
              path={item}
              index={index}
              isActive={isActive}
              isLocked={access.locked}
              statusLabel={access.label}
              userProgress={userProgress}
              onPress={() => onPathSelected(item.id)}
            />
          );
```

In `JourneyCardProps`, rename `lockedLabel?: string` → `statusLabel?: string` with doc: `/** Locked: why (e.g. "Free from Nov 12"). Unlocked: only "Pro early access". */`. Update the accessibility label to use `statusLabel` and fall back to `'coming soon'`. In the locked pill replace `(lockedLabel ?? 'Early Access · Coming Soon')` with `(statusLabel ?? 'Coming soon')`.

- [ ] **Step 4: Show the Pro pill on an unlocked in-window card**

Replace the unlocked branch `) : (<View style={styles.progressSection}> … </View>)}` with:

```tsx
            ) : (
              <>
                {statusLabel ? (
                  <View style={styles.proEarlyPill}>
                    <MaterialCommunityIcons name="star-four-points" size={11} color={Colors.accent.primary} />
                    <Text style={styles.proEarlyPillText}>{statusLabel.toUpperCase()}</Text>
                  </View>
                ) : null}
                <View style={styles.progressSection}>
                  {/* …existing progress track and journeyPct, unchanged… */}
                </View>
              </>
            )}
```

Add styles next to `lockedStatus` (same metrics so locked and unlocked pills align; gold at full strength because this one is a perk, not a lock):

```ts
  proEarlyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: `${Colors.accent.primary}40`,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  proEarlyPillText: {
    fontSize: Typography.sizes.detail,
    fontWeight: '700',
    color: Colors.accent.primary,
    letterSpacing: 1,
  },
```

(If `Typography` is not already imported in this file, it is — line 23 imports `Colors, Spacing, BorderRadius, Typography`.)

- [ ] **Step 5: Update the sort to read `released`**

Already done in Task 1 Step 4; confirm `isPathLocked` is still the lock input to the sort.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit -p tsconfig.json && npx jest && node scripts/verify-render-hazards.mjs && RH_INJECT=1 node scripts/verify-render-hazards.mjs`
Expected: typecheck clean, all suites pass, both render-hazard modes exit 0.
Bare-LF check on `src/screens/PathsScreen.tsx`: expect `0`.

- [ ] **Step 7: Commit and push**

```bash
git add src/screens/PathsScreen.tsx
git commit -m "feat(journeys): lock, label and route cards from journeyAccess"
git push
```

---

### Task 4: Restore the paywall's early-access bullet — truthfully

**Files:**
- Modify: `src/screens/SupportSakinaScreen.tsx` — the `FEATURES` array and the comment above it (~lines 72–130)

**Interfaces:**
- Consumes: `EARLY_ACCESS_DAYS` from Task 1.

- [ ] **Step 1: Add the bullet right after "Pro-exclusive journeys"**

```ts
import { EARLY_ACCESS_DAYS } from '../constants/journeyAvailability';
```

```ts
  {
    icon: 'sparkles-outline',
    title: 'Early access to new journeys',
    // Enforced by src/utils/journeyAccess.ts for every 'early_access' entry
    // in src/constants/journeyAvailability.ts — the default for new journeys.
    description: `Every new journey opens to Pro ${EARLY_ACCESS_DAYS} days before everyone else`,
  },
```

Replace the comment block above the "Pro-exclusive journeys" entry (the one explaining why "Early access" was removed) with: `// "Early access" was removed on 2026-10-13 because nothing enforced it, and restored once journeyAccess.ts did. If the window is ever removed, remove this bullet in the same commit.`

Confirm `sparkles-outline` exists: `grep -c '"sparkles-outline"' node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json` → expect `1`. If 0, use `star-outline`.

- [ ] **Step 2: Verify and commit**

Run: `npx tsc --noEmit -p tsconfig.json && npx jest`
Expected: PASS.

```bash
git add src/screens/SupportSakinaScreen.tsx
git commit -m "feat(paywall): early-access bullet, now that it is enforced"
git push
```

---

### Task 5: Supporter-since date and manage-subscription hook

**Files:**
- Create: `src/utils/supporterSince.ts`
- Create: `src/utils/__tests__/supporterSince.test.ts`
- Modify: `src/types/index.ts:179-187` (`SubscriptionState`)
- Modify: `src/services/subscriptionService.ts` — `syncFromCustomerInfo` (~line 202)
- Modify: `src/services/revenueCatService.ts` — add `showManageSubscriptions()`

**Interfaces:**
- Produces:
  - `supporterSinceMs(entitlement: { originalPurchaseDateMillis?: number | null } | undefined): number | undefined`
  - `SubscriptionState.supporterSinceMs?: number`
  - `revenueCat.showManageSubscriptions(): Promise<void>`

- [ ] **Step 1: Write the failing test**

```ts
/**
 * WHAT THIS DOES NOT CATCH: whether RevenueCat reports the date we expect
 * for a promotional grant or a family-shared purchase — only that a missing
 * or nonsense value never reaches the screen as a date.
 */
import { supporterSinceMs } from '../supporterSince';

describe('supporterSinceMs', () => {
  it('passes a real purchase time through', () => {
    expect(supporterSinceMs({ originalPurchaseDateMillis: 1788000000000 })).toBe(1788000000000);
  });
  it.each([undefined, {}, { originalPurchaseDateMillis: 0 }, { originalPurchaseDateMillis: null }, { originalPurchaseDateMillis: NaN }])(
    'returns undefined for %p',
    (e) => {
      expect(supporterSinceMs(e as any)).toBeUndefined();
    },
  );
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/utils/__tests__/supporterSince.test.ts` → FAIL, module not found.

- [ ] **Step 3: Implement**

`src/utils/supporterSince.ts`:

```ts
/**
 * When this person first held Sakina Pro, from RevenueCat's entitlement
 * `originalPurchaseDateMillis`. Undefined whenever it is absent or not a real
 * time, so the supporter view omits the line instead of printing
 * "Invalid Date" or "Jan 1, 1970". Kept in memory only (see the spec).
 */
export function supporterSinceMs(
  entitlement: { originalPurchaseDateMillis?: number | null } | undefined,
): number | undefined {
  const ms = entitlement?.originalPurchaseDateMillis;
  return typeof ms === 'number' && Number.isFinite(ms) && ms > 0 ? ms : undefined;
}
```

In `src/types/index.ts`, add to `SubscriptionState` after `willRenew`:

```ts
  /** First time this person held Pro (RevenueCat). In memory only, never persisted. */
  supporterSinceMs?: number;
```

In `subscriptionService.ts` `syncFromCustomerInfo`, add to the `this.subscriptionState = { … }` literal:

```ts
      supporterSinceMs: isActive ? supporterSinceMs(entitlement) : undefined,
```

with `import { supporterSinceMs } from '../utils/supporterSince';`. Do **not** add it to either SQL statement.

In `revenueCatService.ts`, add after `restorePurchases`:

```ts
  /** Opens the store's own subscription management sheet. No-op when RC is unavailable. */
  async showManageSubscriptions(): Promise<void> {
    this.configure();
    if (!this.configured) return;
    await Purchases.showManageSubscriptions();
  }
```

- [ ] **Step 4: Verify**

Run: `npx jest src/utils/__tests__/supporterSince.test.ts && npx tsc --noEmit -p tsconfig.json && npx jest`
Expected: PASS. Bare-LF check on the four modified/created `src` files: `0`.

- [ ] **Step 5: Commit and push**

```bash
git add src/utils/supporterSince.ts src/utils/__tests__/supporterSince.test.ts src/types/index.ts src/services/subscriptionService.ts src/services/revenueCatService.ts
git commit -m "feat(pro): supporter-since date and manage-subscription hook"
git push
```

---

### Task 6: "Built since you joined" list

**Files:**
- Modify: `src/utils/journeyAccess.ts` (append)
- Modify: `src/utils/__tests__/journeyAccess.test.ts` (append)

**Interfaces:**
- Consumes: `AVAILABLE_PATHS`, `publicFromYMD`, `parseYMD` (Task 2).
- Produces:
  - `interface ReleasedJourney { pathId: string; released: string; publicFrom: string | null; inEarlyAccess: boolean }`
  - `journeysReleasedSince(sinceYMD: string, today: string): ReleasedJourney[]` — `released >= sinceYMD && released <= today`, newest first.

- [ ] **Step 1: Write the failing tests** (append to `journeyAccess.test.ts`; the module mock at the top already provides the five fake paths)

```ts
import { journeysReleasedSince } from '../journeyAccess';

describe('journeysReleasedSince', () => {
  it('lists journeys released on or after the day they joined, newest first', () => {
    // path_crisis and path_new share 2026-11-01; ties break by id, A→Z.
    expect(journeysReleasedSince('2026-11-01', '2026-12-31').map((j) => j.pathId)).toEqual([
      'path_dec',
      'path_crisis',
      'path_new',
    ]);
  });
  it('marks one still in its window', () => {
    const [newest] = journeysReleasedSince('2026-12-01', '2026-12-20');
    expect(newest).toEqual({
      pathId: 'path_dec',
      released: '2026-12-15',
      publicFrom: '2027-01-14',
      inEarlyAccess: true,
    });
  });
  it('is empty when they joined after every release', () => {
    expect(journeysReleasedSince('2027-06-01', '2027-06-02')).toEqual([]);
  });
  it('never lists a journey dated after today (future-dated or clock skew)', () => {
    expect(journeysReleasedSince('2026-01-01', '2026-11-30').map((j) => j.pathId)).not.toContain('path_dec');
  });
});
```

- [ ] **Step 2: Run to verify they fail** — `npx jest src/utils/__tests__/journeyAccess.test.ts` → FAIL, `journeysReleasedSince is not a function`.

- [ ] **Step 3: Implement** (append to `journeyAccess.ts`)

```ts
export interface ReleasedJourney {
  pathId: string;
  released: string;
  publicFrom: string | null;
  inEarlyAccess: boolean;
}

/**
 * Journeys that reached users on or after `sinceYMD` and not after `today`,
 * newest first. Feeds the supporter view's "Built since you joined".
 */
export function journeysReleasedSince(sinceYMD: string, today: string): ReleasedJourney[] {
  return Object.entries(AVAILABLE_PATHS)
    .filter(([, r]) => r.released >= sinceYMD && r.released <= today)
    .sort(([a, ra], [b, rb]) =>
      ra.released === rb.released ? a.localeCompare(b) : ra.released < rb.released ? 1 : -1,
    )
    .map(([pathId, r]) => {
      const publicFrom = publicFromYMD(r);
      return {
        pathId,
        released: r.released,
        publicFrom,
        inEarlyAccess: r.access === 'early_access' && publicFrom !== null && today < publicFrom,
      };
    });
}
```

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit and push**

```bash
git add src/utils/journeyAccess.ts src/utils/__tests__/journeyAccess.test.ts
git commit -m "feat(pro): list journeys released since a supporter joined"
git push
```

---

### Task 7: `SupporterThanks` view on the Support screen

**Files:**
- Create: `src/components/SupporterThanks.tsx`
- Create: `src/components/__tests__/SupporterThanks.test.tsx`
- Modify: `src/screens/SupportSakinaScreen.tsx` — add premium state + branch before the main `return (` (~line 348)

**Interfaces:**
- Consumes: `journeysReleasedSince`, `formatShortDate` (Tasks 2, 6); `SubscriptionState` with `supporterSinceMs` (Task 5); `revenueCat.showManageSubscriptions()` (Task 5); `PathsService.getInstance().getAllPaths()` for titles; `formatDateYMD`.
- Produces: `SupporterThanks` default export, props:
  `{ state: SubscriptionState | null; today: string; onClose: () => void; onManage: () => void }`

- [ ] **Step 1: Write the failing test**

```tsx
/**
 * The supporter view must never print a date it does not have, and must say
 * plainly when nothing new has shipped yet rather than imply a promise.
 *
 * WHAT THIS DOES NOT CATCH: layout on a device, safe-area clearance, and
 * whether the store's manage sheet actually opens (native).
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import SupporterThanks from '../SupporterThanks';

jest.mock('../../constants/journeyAvailability', () => ({
  EARLY_ACCESS_DAYS: 30,
  AVAILABLE_PATHS: { path_screen_detox: { released: '2026-12-15', access: 'early_access' } },
  AVAILABLE_PATH_IDS: new Set(['path_screen_detox']),
}));

const base = { tier: 'premium' as const, isActive: true, willRenew: true, type: 'yearly' as const };
const noop = () => {};

describe('SupporterThanks', () => {
  it('shows supporting-since and a journey still in early access', () => {
    const since = new Date(2026, 11, 1).getTime();
    const { getByText } = render(
      <SupporterThanks state={{ ...base, supporterSinceMs: since }} today="2026-12-20" onClose={noop} onManage={noop} />,
    );
    getByText(/Supporting since Dec 1, 2026/);
    getByText(/Opens to everyone on Jan 14/);
  });

  it('shows the honest empty state when nothing shipped since they joined', () => {
    const since = new Date(2027, 0, 5).getTime();
    const { getByText } = render(
      <SupporterThanks state={{ ...base, supporterSinceMs: since }} today="2027-01-06" onClose={noop} onManage={noop} />,
    );
    getByText(/The next journey is being written/);
  });

  it('omits the date and the list when supporter-since is unknown', () => {
    const { queryByText, toJSON } = render(
      <SupporterThanks state={base} today="2026-12-20" onClose={noop} onManage={noop} />,
    );
    expect(queryByText(/Supporting since/)).toBeNull();
    expect(queryByText(/Built since you joined/)).toBeNull();
    expect(JSON.stringify(toJSON())).not.toMatch(/Invalid Date|1970/);
  });

  it('hides Manage subscription for lifetime', () => {
    const { queryByText } = render(
      <SupporterThanks state={{ ...base, type: 'lifetime', willRenew: false }} today="2026-12-20" onClose={noop} onManage={noop} />,
    );
    expect(queryByText('Manage subscription')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails** — module not found.

- [ ] **Step 3: Implement `SupporterThanks.tsx`**

```tsx
/**
 * SupporterThanks — what a Pro user sees on the Support screen instead of the
 * paywall they already paid through: when they started supporting, what their
 * plan is, and which journeys have shipped since. Spec:
 * docs/superpowers/specs/2026-10-13-pro-early-access-and-supporter-view-design.md
 *
 * Every line is conditional on data we actually have. No date is invented and
 * no future journey is promised.
 */
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '../theme/DesignSystem';
import { SubscriptionState } from '../types';
import { formatDateYMD } from '../utils/date';
import { formatShortDate, journeysReleasedSince } from '../utils/journeyAccess';
import { PathsService } from '../services/pathsService';
import SakinaLantern from './SakinaLantern';

interface Props {
  state: SubscriptionState | null;
  today: string;
  onClose: () => void;
  onManage: () => void;
}

const longDate = (ms: number) =>
  new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function planLine(state: SubscriptionState | null): string | null {
  if (!state?.isActive) return null;
  if (state.type === 'lifetime') return 'Lifetime · yours for good';
  const label = state.type === 'monthly' ? 'Monthly' : 'Yearly';
  if (!state.subscriptionEndDate) return label;
  const end = longDate(state.subscriptionEndDate);
  return state.willRenew ? `${label} · renews ${end}` : `Pro until ${end}`;
}

const SupporterThanks: React.FC<Props> = ({ state, today, onClose, onManage }) => {
  const insets = useSafeAreaInsets();
  const since = state?.supporterSinceMs;
  const titles = useMemo(
    () => new Map(PathsService.getInstance().getAllPaths().map((p) => [p.id, p.title])),
    [],
  );
  const built = useMemo(
    () => (since ? journeysReleasedSince(formatDateYMD(new Date(since)), today) : null),
    [since, today],
  );
  const plan = planLine(state);
  const canManage = state?.isActive && state.type !== 'lifetime';

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.lg }]}>
      <TouchableOpacity
        onPress={onClose}
        style={styles.close}
        hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={24} color={Colors.text.secondary} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        <SakinaLantern size={56} />
        <Text style={styles.title}>Thank you for supporting Sakina</Text>
        {since ? <Text style={styles.meta}>Supporting since {longDate(since)}</Text> : null}
        {plan ? <Text style={styles.meta}>{plan}</Text> : null}

        {built ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Built since you joined</Text>
            {built.length === 0 ? (
              <Text style={styles.body}>
                The next journey is being written. Your support is what keeps new ones coming.
              </Text>
            ) : (
              built.map((j) => (
                <View key={j.pathId} style={styles.row}>
                  <Ionicons name="book-outline" size={18} color={Colors.accent.primary} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{titles.get(j.pathId) ?? j.pathId}</Text>
                    <Text style={styles.rowMeta}>
                      {j.inEarlyAccess && j.publicFrom
                        ? `Yours now · opens to everyone on ${formatShortDate(j.publicFrom)}`
                        : `Released ${formatShortDate(j.released)}`}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {canManage ? (
          <TouchableOpacity
            onPress={onManage}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            accessibilityRole="button"
          >
            <Text style={styles.link}>Manage subscription</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  close: { position: 'absolute', right: Spacing.xl, zIndex: 1 },
  content: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl, gap: Spacing.sm },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h1,
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  meta: { fontFamily: Typography.fonts.latin, fontSize: Typography.sizes.small, color: Colors.text.secondary },
  section: { alignSelf: 'stretch', marginTop: Spacing.xxl, gap: Spacing.md },
  sectionTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h2,
    color: Colors.text.primary,
  },
  body: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    lineHeight: Typography.sizes.body * 1.5,
    color: Colors.text.secondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.glass.light,
  },
  rowText: { flex: 1, gap: Spacing.xs },
  rowTitle: { fontFamily: Typography.fonts.latin, fontSize: Typography.sizes.body, color: Colors.text.primary },
  rowMeta: { fontFamily: Typography.fonts.latin, fontSize: Typography.sizes.detail, color: Colors.text.secondary },
  link: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    color: Colors.accent.primary,
    marginTop: Spacing.xxl,
  },
});

export default SupporterThanks;
```

Before writing, confirm the token names exist and adjust to the real ones: `grep -n "glass\|secondary\|background" src/theme/DesignSystem.ts | head -20` and `grep -n "export\|size" src/components/SakinaLantern.tsx | head`. If `Colors.background` is an object, use `Colors.background.primary` (or whatever `SupportSakinaScreen` uses for its root); if `SakinaLantern` is a named export or takes a different size prop, match it. The test mocks nothing visual, so a wrong token name fails the typecheck, not silently.

- [ ] **Step 4: Branch the Support screen**

In `SupportSakinaScreen.tsx` add:

```ts
import { useFocusEffect } from '@react-navigation/native';
import SupporterThanks from '../components/SupporterThanks';
import { formatDateYMD } from '../utils/date';
```

(`useNavigation` is already imported from `@react-navigation/native`; merge the import.) After the existing `const freemium = FreemiumService.getInstance();`:

```ts
  // Re-read on focus: a purchase or restore elsewhere can change it.
  const [isPremium, setIsPremium] = useState(() => freemium.isPremium());
  useFocusEffect(
    useCallback(() => {
      setIsPremium(freemium.isPremium());
    }, [freemium]),
  );
```

Immediately before the main `return (` (after every hook, so hook order never changes between renders):

```tsx
  // A subscriber reaching this screen (Settings → "Sakina Pro · Active") gets
  // what their support built, not a paywall for something they already have.
  // Never in onboarding's embedded mode, which must always end via onDone.
  if (isPremium && !embedded) {
    return (
      <SupporterThanks
        state={freemium.getSubscriptionState()}
        today={formatDateYMD()}
        onClose={() => navigation.goBack()}
        onManage={() => {
          revenueCat.showManageSubscriptions().catch((error) =>
            logServiceError(
              'SupportSakinaScreen',
              'showManageSubscriptions',
              error instanceof Error ? error : new Error(String(error)),
            ),
          );
        }}
      />
    );
  }
```

- [ ] **Step 5: Verify**

Run: `npx jest src/components/__tests__/SupporterThanks.test.tsx && npx tsc --noEmit -p tsconfig.json && npx jest && node scripts/verify-render-hazards.mjs && RH_INJECT=1 node scripts/verify-render-hazards.mjs`
Expected: all PASS / exit 0. Bare-LF check on the three files: `0`.

- [ ] **Step 6: Commit and push**

```bash
git add src/components/SupporterThanks.tsx src/components/__tests__/SupporterThanks.test.tsx src/screens/SupportSakinaScreen.tsx
git commit -m "feat(pro): show supporters what their support built"
git push
```

---

### Task 8: Docs and full verification

**Files:**
- Modify: `CLAUDE.md` — "6. Journey availability is data, currently hardcoded in UI" and item 10's neighbour list in "Before calling a journey day done"
- Modify: `src/services/pathsService.ts:57-65` comment

- [ ] **Step 1: Update CLAUDE.md section 6**

Replace its first paragraph with:

```markdown
`AVAILABLE_PATHS` lives in `src/constants/journeyAvailability.ts`: id →
`{ released, access }`. A new journey defaults to `access: 'early_access'`
(Pro-only for `EARLY_ACCESS_DAYS` = 30 after `released`, then free — computed
in `src/utils/journeyAccess.ts`, never hand-dated). Crisis/distress journeys
must be `'free'`. Set `released` to the day the build reaches users, not the
day you finish authoring. `scripts/verify-journey-claims.mjs` reads the ids
from that file. `getPathVisual` in `src/constants/pathVisuals.ts` already
covers every declared path id including the stubs — unlocking a journey needs
no edit there.
```

Add to the "Before calling a journey day done" numbered list:

```markdown
12. The journey has an entry in `AVAILABLE_PATHS`
    (`src/constants/journeyAvailability.ts`) with the real release date and
    the right `access` kind.
```

- [ ] **Step 2: Fix the `pathsService.ts` comment** to say the gate lives in `src/utils/journeyAccess.ts` and the data in `src/constants/journeyAvailability.ts`.

- [ ] **Step 3: Full verification**

```bash
npx tsc --noEmit -p tsconfig.json
npx jest
node scripts/verify-render-hazards.mjs
node scripts/verify-journey.mjs
node scripts/verify-journey-claims.mjs
```

Expected: all exit 0. (`verify-journey-claims` needs network and `curl`; it proves the moved `AVAILABLE_PATHS` is still read.)

- [ ] **Step 4: Commit and push**

```bash
git add CLAUDE.md src/services/pathsService.ts
git commit -m "docs: journey availability now lives in constants/journeyAvailability"
git push
```

- [ ] **Step 5: Device checklist for Ahmed (dev client, no EAS build)**

- Free account → Journeys: every current card unchanged; Marriage Seeker / Death Awareness say "SAKINA PRO EXCLUSIVE"; stubs say "COMING SOON".
- Temporarily set one journey's `released` to today in `journeyAvailability.ts`: free account shows "FREE FROM <date 30 days out>" and taps to the Support screen; Pro account shows a gold "PRO EARLY ACCESS" pill and opens it. Revert.
- Pro account → Settings → "Sakina Pro · Active": thank-you view, supporting-since date, plan line, "Manage subscription" opens the store sheet. Lifetime account: no manage link.
- Onboarding's last step still shows the plain subscribe-or-skip paywall (embedded mode is never replaced).
