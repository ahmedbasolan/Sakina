# Onboarding Trial Offer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a skippable, card-required 7-day trial offer as the final step of onboarding, without breaking the existing hold-to-commit ritual or promising the wrong next screen.

**Architecture:** `OnboardingScreen.tsx` gains a 9th step (index 8) that renders the existing `SupportSakinaScreen` in a new `embedded` mode. `CommitScreen`'s completion now advances to that step instead of calling `enterGuestMode` directly; the new step is what finally calls it, whether the user subscribes or skips. A pure helper function isolates the swipe-eligibility fix so the regression the spec found (bumping the screen count silently unlocks swiping past the hold-to-commit ritual) has an actual unit test guarding it, not just a manual QA step.

**Tech Stack:** React Native (Expo), TypeScript, Jest for unit tests. No new dependencies.

## Global Constraints

- Spec: [docs/superpowers/specs/2026-08-16-onboarding-trial-offer-design.md](../specs/2026-08-16-onboarding-trial-offer-design.md) — this plan implements it verbatim; do not reinterpret placement, scope, or copy decisions made there.
- Placement-only change: no premium feature, price, or trial-length changes. Do not touch `FREEMIUM_LIMITS`, `SUBSCRIPTION_PRICING`, or the `FEATURES` list in `SupportSakinaScreen.tsx`.
- No new analytics/consent category. Do not add PostHog events for this feature (see spec §6).
- `SupportSakinaScreen`'s non-embedded behavior (the existing Settings → "Upgrade to Sakina Pro" path) must be byte-for-byte unchanged — every new prop defaults to preserving current behavior.
- Project convention: `Spacing`/`BorderRadius`/`Typography` tokens only, no magic numbers (see CLAUDE.md Screen Layout Checklist) — not applicable here since no new visual elements are introduced, but do not add any without checking this rule first.
- Typecheck after every task: `npx tsc --noEmit -p tsconfig.json`.

---

### Task 1: Swipe-eligibility helper (regression fix, isolated + tested)

**Files:**
- Create: `src/utils/onboardingNavigation.ts`
- Test: `src/utils/__tests__/onboardingNavigation.test.ts`

**Interfaces:**
- Produces: `COMMIT_SCREEN_INDEX: number` (value `7`) and `canSwipeForward(currentScreen: number, totalScreens: number): boolean`, both imported by Task 3.

**Context:** `OnboardingScreen.tsx`'s forward-swipe gate is currently the inline expression `currentScreen < TOTAL_SCREENS - 1` (`OnboardingScreen.tsx:187`). Today, with `TOTAL_SCREENS = 8`, that's `7 < 7 = false` at CommitScreen (index 7) — swiping forward is blocked there, which is why "hold 3 seconds to seal your intention" can only be completed by holding, never swiped past. Task 3 will bump `TOTAL_SCREENS` to 9 to add the new offer step; done alone, that flips the same check to `7 < 8 = true` and silently unlocks swipe-past-Commit, skipping the hold ritual. This task extracts the check into a pure, unit-tested function so that regression is impossible to reintroduce silently later (e.g. if screens are ever reordered again).

- [ ] **Step 1: Write the failing test**

```typescript
// src/utils/__tests__/onboardingNavigation.test.ts
import { canSwipeForward, COMMIT_SCREEN_INDEX } from '../onboardingNavigation';

describe('canSwipeForward', () => {
  it('allows forward swipe on ordinary screens before the last one', () => {
    expect(canSwipeForward(0, 9)).toBe(true);
    expect(canSwipeForward(3, 9)).toBe(true);
    expect(canSwipeForward(6, 9)).toBe(true); // Notification -> Commit
  });

  it('blocks forward swipe on the last screen regardless of index', () => {
    expect(canSwipeForward(8, 9)).toBe(false);
  });

  it('blocks forward swipe past CommitScreen even when it is not the last screen', () => {
    // This is the exact regression the onboarding-trial-offer spec found:
    // adding a screen after Commit (TOTAL_SCREENS 8 -> 9) must not unlock
    // swiping past the hold-to-commit ritual.
    expect(canSwipeForward(COMMIT_SCREEN_INDEX, 9)).toBe(false);
  });

  it('matches today\'s pre-change behavior when Commit is still the last screen', () => {
    expect(canSwipeForward(COMMIT_SCREEN_INDEX, 8)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/utils/__tests__/onboardingNavigation.test.ts`
Expected: FAIL — `Cannot find module '../onboardingNavigation'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/utils/onboardingNavigation.ts

/**
 * CommitScreen ("hold 3 seconds to seal your intention") must never be
 * swipeable past — only completing the hold advances from it. This index
 * is deliberately independent of TOTAL_SCREENS so that adding screens after
 * Commit (e.g. the onboarding trial offer) can never silently re-enable
 * swipe-forward there just because it's no longer the last screen.
 */
export const COMMIT_SCREEN_INDEX = 7;

export function canSwipeForward(currentScreen: number, totalScreens: number): boolean {
  return currentScreen < totalScreens - 1 && currentScreen !== COMMIT_SCREEN_INDEX;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/utils/__tests__/onboardingNavigation.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/onboardingNavigation.ts src/utils/__tests__/onboardingNavigation.test.ts
git commit -m "fix(onboarding): isolate + test swipe-eligibility to guard the commit ritual"
```

---

### Task 2: `SupportSakinaScreen` embedded mode

**Files:**
- Modify: `src/screens/SupportSakinaScreen.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `SupportSakinaScreen` now accepts optional props `{ embedded?: boolean; onDone?: () => void }`, both defaulting to preserve current behavior (`embedded = false`). Task 3 will render `<SupportSakinaScreen embedded onDone={handleOfferDone} />`.

**Context:** Three call sites hardcode `navigation.goBack()` — close-X, purchase success, restore success. In `embedded` mode there is nothing to go back to (onboarding is the only screen on that stack), so all three must call `onDone` instead. The footer already has a static "Prefer to wait…" line (spec decision: reuse it as the skip tap-target rather than adding a new button, to avoid duplicate copy and not disturb the footer's already-tuned `paddingBottom: 200`).

- [ ] **Step 1: Add the `Props` interface and destructure the new props**

Find (near the top of the component, `SupportSakinaScreen.tsx:100`):
```typescript
const SupportSakinaScreen: React.FC = () => {
```

Replace with:
```typescript
interface Props {
  /** True when rendered as onboarding's final step instead of a pushed Settings screen. */
  embedded?: boolean;
  /** Called instead of navigation.goBack() when embedded — subscribe, restore, or skip all funnel through this. */
  onDone?: () => void;
}

const SupportSakinaScreen: React.FC<Props> = ({ embedded = false, onDone }) => {
```

- [ ] **Step 2: Swap the close-X call site**

Find (`SupportSakinaScreen.tsx:248-256`):
```typescript
      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + Spacing.sm }]}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={22} color={Colors.text.secondary} />
      </TouchableOpacity>
```

Replace with:
```typescript
      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + Spacing.sm }]}
        onPress={() => (embedded ? onDone?.() : navigation.goBack())}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={22} color={Colors.text.secondary} />
      </TouchableOpacity>
```

- [ ] **Step 3: Swap the purchase-success call site**

Find (inside `handleContinue`, `SupportSakinaScreen.tsx:200-203`):
```typescript
      if (ok) {
        HapticsService.notificationAsync('SUCCESS');
        navigation.goBack();
      }
```

Replace with:
```typescript
      if (ok) {
        HapticsService.notificationAsync('SUCCESS');
        embedded ? onDone?.() : navigation.goBack();
      }
```

- [ ] **Step 4: Swap the restore-success call site**

Find (inside `handleRestore`, `SupportSakinaScreen.tsx:221-229`):
```typescript
      const restored = await freemium.restorePurchase();
      if (restored) {
        HapticsService.notificationAsync('SUCCESS');
        navigation.goBack();
      } else {
        Alert.alert(
          'Nothing to restore',
          'We couldn’t find an active subscription on this account.',
        );
      }
```

Replace with:
```typescript
      const restored = await freemium.restorePurchase();
      if (restored) {
        HapticsService.notificationAsync('SUCCESS');
        embedded ? onDone?.() : navigation.goBack();
      } else {
        Alert.alert(
          'Nothing to restore',
          'We couldn’t find an active subscription on this account.',
        );
      }
```

- [ ] **Step 5: Make the "Prefer to wait" footer line the skip tap-target when embedded**

Find (`SupportSakinaScreen.tsx:394-397`):
```typescript
        <Text style={styles.priceNote}>{priceNote}</Text>
        <Text style={styles.continueFreeNote}>
          Prefer to wait? Sakina stays fully usable free — no pressure.
        </Text>
```

Replace with:
```typescript
        <Text style={styles.priceNote}>{priceNote}</Text>
        {embedded ? (
          <TouchableOpacity
            onPress={onDone}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Continue with the free plan"
          >
            <Text style={styles.continueFreeNote}>
              Prefer to wait? Sakina stays fully usable free — no pressure.
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.continueFreeNote}>
            Prefer to wait? Sakina stays fully usable free — no pressure.
          </Text>
        )}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors. (`SettingsScreen.tsx:405`'s `navigation.navigate('Support')` passes no props, so `embedded` defaults `false` there — confirm this call site still compiles with no changes needed.)

- [ ] **Step 7: Commit**

```bash
git add src/screens/SupportSakinaScreen.tsx
git commit -m "feat(onboarding): add embedded mode to SupportSakinaScreen"
```

---

### Task 3: Wire the offer into `OnboardingScreen`, fix `CommitScreen`'s completion copy

**Files:**
- Modify: `src/screens/OnboardingScreen.tsx`
- Modify: `src/components/onboarding/CommitScreen.tsx`

**Interfaces:**
- Consumes: `canSwipeForward`, `COMMIT_SCREEN_INDEX` from `../utils/onboardingNavigation` (Task 1); `SupportSakinaScreen`'s `embedded`/`onDone` props (Task 2).
- Produces: nothing consumed by later tasks — this is the integration point.

**Context:** `CommitScreen`'s `onCommit` prop currently fires `handleCommitComplete`, which calls `enterGuestMode(true)` directly and — because `MainNavigator.tsx:190` swaps the entire `Onboarding`/`Main` stack the instant `isGuest` flips true — immediately unmounts onboarding. To show one more step first, `onCommit` must advance to it (`goNext`) instead; the new step's own exit (`onDone`) becomes the thing that finally calls `enterGuestMode(true)`.

- [ ] **Step 1: Fix `CommitScreen`'s completion text**

Find (`src/components/onboarding/CommitScreen.tsx:405-410`):
```typescript
        <Animated.View style={[styles.completionWrap, { opacity: completionOpacity, transform: [{ translateY: completionSlide }] }]}>
          <Text style={styles.completionText}>Bismillah.</Text>
          <Text style={styles.completionSub}>Your intention is sealed.</Text>
          <Text style={styles.completionHint}>Your first verse awaits</Text>
        </Animated.View>
```

Replace with:
```typescript
        <Animated.View style={[styles.completionWrap, { opacity: completionOpacity, transform: [{ translateY: completionSlide }] }]}>
          <Text style={styles.completionText}>Bismillah.</Text>
          <Text style={styles.completionSub}>Your intention is sealed.</Text>
          <Text style={styles.completionHint}>Just one more step</Text>
        </Animated.View>
```

- [ ] **Step 2: Add the import for the swipe-eligibility helper**

Find (`src/screens/OnboardingScreen.tsx:44-49`):
```typescript
import { ProgressMandala } from '../components/onboarding/ProgressMandala';
import { touchEmitter } from '../components/onboarding/InteractiveStarfield';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Animations, Spacing, Colors } from '../theme/DesignSystem';
import { useReduceMotion } from '../hooks/useReduceMotion';
```

Replace with:
```typescript
import { ProgressMandala } from '../components/onboarding/ProgressMandala';
import { touchEmitter } from '../components/onboarding/InteractiveStarfield';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Animations, Spacing, Colors } from '../theme/DesignSystem';
import { useReduceMotion } from '../hooks/useReduceMotion';
import SupportSakinaScreen from './SupportSakinaScreen';
import { canSwipeForward } from '../utils/onboardingNavigation';
```

- [ ] **Step 3: Update the header comment and `TOTAL_SCREENS`**

Find (`src/screens/OnboardingScreen.tsx:1-11`):
```typescript
/**
 * Onboarding Orchestrator
 *
 * 8-screen flow with progress bar, animated transitions,
 * swipe navigation, and consistent back arrow.
 *
 * Flow: Bismillah → Welcome → Heart Check-In → Personalization →
 *       First Guidance → Location → Notification → Commit → Main
 *
 * No cold paywall in onboarding (spec §8) — upgrade asks live only at peaks.
 */
```

Replace with:
```typescript
/**
 * Onboarding Orchestrator
 *
 * 9-screen flow with progress bar, animated transitions,
 * swipe navigation, and consistent back arrow.
 *
 * Flow: Bismillah → Welcome → Heart Check-In → Personalization →
 *       First Guidance → Location → Notification → Commit →
 *       Trial Offer → Main
 *
 * No cold paywall in onboarding (spec §8) — upgrade asks otherwise live only
 * at peaks. The one exception is the final Trial Offer step: a single warm,
 * always-skippable ask placed after real value (First Guidance) and
 * emotional commitment (Commit), never before either. See
 * docs/superpowers/specs/2026-08-16-onboarding-trial-offer-design.md.
 */
```

Find (`src/screens/OnboardingScreen.tsx:51`):
```typescript
const TOTAL_SCREENS = 8;
```

Replace with:
```typescript
const TOTAL_SCREENS = 9;
```

- [ ] **Step 4: Use the extracted helper in the swipe gate**

Find (`src/screens/OnboardingScreen.tsx:181-199`):
```typescript
  const onHandlerStateChange = useCallback(
    (event: any) => {
      const { translationX, velocityX, state: gestureState } = event.nativeEvent;
      if (gestureState === State.END) {
        if (
          (translationX < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) &&
          currentScreen < TOTAL_SCREENS - 1
        ) {
          goNext();
        } else if (
          (translationX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) &&
          currentScreen > 0
        ) {
          goBack();
        }
      }
    },
    [currentScreen, goNext, goBack],
  );
```

Replace with:
```typescript
  const onHandlerStateChange = useCallback(
    (event: any) => {
      const { translationX, velocityX, state: gestureState } = event.nativeEvent;
      if (gestureState === State.END) {
        if (
          (translationX < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) &&
          canSwipeForward(currentScreen, TOTAL_SCREENS)
        ) {
          goNext();
        } else if (
          (translationX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) &&
          currentScreen > 0
        ) {
          goBack();
        }
      }
    },
    [currentScreen, goNext, goBack],
  );
```

- [ ] **Step 5: Rename `handleCommitComplete` to `handleOfferDone`, repoint `CommitScreen`'s `onCommit` to `goNext`**

Find (`src/screens/OnboardingScreen.tsx:201-204`):
```typescript
  // --- Final: enter the app as guest ---
  const handleCommitComplete = useCallback(async () => {
    await enterGuestMode(true);
  }, [enterGuestMode]);
```

Replace with:
```typescript
  // --- Final: enter the app as guest (fired by the trial-offer step's
  // onDone, whether the user subscribed, restored, or skipped) ---
  const handleOfferDone = useCallback(async () => {
    await enterGuestMode(true);
  }, [enterGuestMode]);
```

- [ ] **Step 6: Add the new screen case and repoint Commit's `onCommit`**

Find (`src/screens/OnboardingScreen.tsx:263-268`):
```typescript
      case 7:
        return <CommitScreen isActive={isActive} onCommit={handleCommitComplete} />;
      default:
        return null;
    }
  };
```

Replace with:
```typescript
      case 7:
        return <CommitScreen isActive={isActive} onCommit={goNext} />;
      case 8:
        return <SupportSakinaScreen embedded onDone={handleOfferDone} />;
      default:
        return null;
    }
  };
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean. If `handleCommitComplete` is still referenced anywhere (it shouldn't be — it only had the one call site at the old `case 7`), the compiler will report an unused-variable or missing-reference error; resolve by confirming the rename in Step 5 fully replaced it.

- [ ] **Step 8: Run the full unit test suite as a regression check**

Run: `npx jest`
Expected: PASS — this task touches no service-layer code, so `freemiumService.test.ts`, `pathsService.test.ts`, `lockscreenVerseService.test.ts`, `localDataOwnership.test.ts`, `useGuidanceLogic.test.ts`, `shareCard.test.ts`, and the new `onboardingNavigation.test.ts` should all be unaffected.

- [ ] **Step 9: Commit**

```bash
git add src/screens/OnboardingScreen.tsx src/components/onboarding/CommitScreen.tsx
git commit -m "feat(onboarding): add trial-offer step after commit, fix completion copy"
```

---

### Task 4: On-device verification

**Files:** none (manual QA against the running app — per project convention, visual/flow changes aren't verifiable by typecheck alone).

**Interfaces:** none — this task consumes the fully assembled feature from Tasks 1-3 and produces a go/no-go signal only.

- [ ] **Step 1: Fresh onboarding run reaches the new step**

Uninstall/reset the app (or clear onboarding state) and run through onboarding to CommitScreen. Hold the star to completion. Confirm: the completion hint reads "Just one more step" (not "Your first verse awaits"), and the app advances to the Support/offer screen — not straight to Home.

- [ ] **Step 2: Swipe-past-Commit is blocked (the regression this plan exists to prevent)**

On CommitScreen (before holding), attempt a left swipe. Confirm: nothing happens — the screen does not advance. This is the exact bug Task 1's test guards in code; this step confirms it holds true in the real gesture handler too, not just the extracted pure function.

- [ ] **Step 3: Skip via the footer line**

On the new offer step, tap "Prefer to wait? Sakina stays fully usable free — no pressure." Confirm: lands on Home. Check `SubscriptionService.getInstance().isPremium()` is `false` (e.g. via a temporary log or the Settings screen's "Upgrade to Sakina Pro" label, which shows when not premium). Confirm free limits are intact: 3 refreshes per prayer window, 30 saved items cap.

- [ ] **Step 4: Skip via the close-X**

Repeat a fresh onboarding run to the offer step; this time tap the close-X instead of the footer line. Confirm: identical result to Step 3 (lands on Home, free tier).

- [ ] **Step 5: Subscribe via the trial**

Repeat a fresh onboarding run to the offer step. Select the yearly plan (should show "Start 7-day trial" for a trial-eligible sandbox account) and complete a sandbox purchase. Confirm: lands on Home, `isPremium()` is `true`.

- [ ] **Step 6: Non-embedded regression check**

From Home, go to Settings → "Upgrade to Sakina Pro". Confirm the screen looks and behaves exactly as before this change: close-X returns to Settings (via `navigation.goBack()`), the footer "Prefer to wait" line is plain non-interactive text (not tappable), and a normal purchase/restore flow still calls `goBack()` on success.

- [ ] **Step 7: Record the result**

If all six checks pass, this plan is complete. If any fails, do not proceed to merge — fix the specific failing step's underlying task and re-run this whole verification task from Step 1, since the steps build on each other (a fresh onboarding run each time).
