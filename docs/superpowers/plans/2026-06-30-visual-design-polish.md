# Visual Design Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all off-palette colors, legibility gaps, and inconsistent interaction behaviors found in the Celestial Night visual audit.

**Architecture:** Targeted, file-scoped edits — no new abstractions, no new files. Every fix is a value swap or a one-line style change. Five independent tasks, each commitable on its own.

**Tech Stack:** React Native StyleSheet, `Colors` / `Typography` / `Spacing` tokens from `src/theme/DesignSystem.ts`. No Tailwind, no Reanimated.

**Typecheck command:** `npx tsc --noEmit -p tsconfig.json`

---

## File Map

| File | What changes |
|---|---|
| `src/components/home/StreakBar.tsx` | Replace all `Colors.status.success` (`#4ADE80` green) with `Colors.accent.primary` (gold) |
| `src/components/home/CheckInBanner.tsx` | Replace teal `rgba(46, 211, 198, …)` backgrounds/borders with gold equivalents |
| `src/navigation/MainNavigator.tsx` | Replace amber `#F59E0B` flame color with `Colors.accent.primary` |
| `src/components/EmptyStates.tsx` | Replace purple `rgba(167, 139, 250, …)` pen with gold |
| `src/components/onboarding/WelcomeScreen.tsx` | Feature card border opacity 0.12 → 0.25 |
| `src/components/onboarding/HeartCheckInScreen.tsx` | Subtitle text color + size; dot keys stable |
| `src/components/onboarding/NotificationScreen.tsx` | "Not now" link opacity 0.68 → 0.85 |
| `src/components/home/HeroHeader.tsx` | Bismillah font size 24 → 18, shadow radius 24 → 14 |
| `src/screens/PathsScreen.tsx` | Locked paths: suppress `navigate('Support')`, add haptic no-op |

---

## Task 1: Palette Unification — Off-Palette Colors → Gold

**Files:**
- Modify: `src/components/home/StreakBar.tsx`
- Modify: `src/components/home/CheckInBanner.tsx`
- Modify: `src/navigation/MainNavigator.tsx`
- Modify: `src/components/EmptyStates.tsx`

All four files use colors that break the Celestial Night palette:
- `StreakBar.tsx` — `Colors.status.success = #4ADE80` (bright green) used everywhere
- `CheckInBanner.tsx` — teal `rgba(46, 211, 198, …)` backgrounds / borders
- `MainNavigator.tsx` — amber `#F59E0B` for the streak/flame tab icon
- `EmptyStates.tsx` — violet `rgba(167, 139, 250, 0.8)` on the journal pen illustration

---

- [ ] **Step 1a: Fix StreakBar.tsx — replace green with gold**

Open `src/components/home/StreakBar.tsx`.

Change **line 44** (CrescentIcon color):
```tsx
// BEFORE
<CrescentIcon size={18} color={Colors.status.success} />
// AFTER
<CrescentIcon size={18} color={Colors.accent.primary} />
```

Change **line 75** (arrow icon color):
```tsx
// BEFORE
<Ionicons name="arrow-forward" size={12} color={Colors.status.success} />
// AFTER
<Ionicons name="arrow-forward" size={12} color={Colors.accent.primary} />
```

Change **line 95** (streakBar border color):
```tsx
// BEFORE
borderColor: Colors.status.success + '26',
// AFTER
borderColor: Colors.accent.primary + '26',
```

Change **line 106** (streakFlameContainer background):
```tsx
// BEFORE
backgroundColor: Colors.status.success + '1A',
// AFTER
backgroundColor: Colors.accent.primary + '1A',
```

Change **line 113** (streakText color):
```tsx
// BEFORE
color: Colors.status.success,
// AFTER
color: Colors.accent.primary,
```

Change **line 118** (streakHint color):
```tsx
// BEFORE
color: Colors.status.success + '73',
// AFTER
color: Colors.accent.primary + '73',
```

Change **line 133** (streakMoonDot inactive background):
```tsx
// BEFORE
backgroundColor: Colors.status.success + '33',
// AFTER
backgroundColor: Colors.accent.primary + '33',
```

Change **line 136** (streakMoonActive background):
```tsx
// BEFORE
backgroundColor: Colors.status.success,
// AFTER
backgroundColor: Colors.accent.primary,
```

Change **line 140-141** (streakDotToday border):
```tsx
// BEFORE
borderColor: Colors.status.success,
// AFTER
borderColor: Colors.accent.primary,
```

Change **line 145** (streakDayLabel color):
```tsx
// BEFORE
color: `${Colors.status.success}59`,
// AFTER
color: `${Colors.accent.primary}59`,
```

Change **line 148** (streakDayLabelToday color):
```tsx
// BEFORE
color: Colors.status.success,
// AFTER
color: Colors.accent.primary,
```

Change **line 156** (streakViewText color):
```tsx
// BEFORE
color: Colors.status.success,
// AFTER
color: Colors.accent.primary,
```

---

- [ ] **Step 1b: Fix CheckInBanner.tsx — replace teal with gold**

Open `src/components/home/CheckInBanner.tsx`.

Change **line 55** (banner background):
```tsx
// BEFORE
backgroundColor: 'rgba(46, 211, 198, 0.08)',
// AFTER
backgroundColor: 'rgba(212, 175, 55, 0.08)',
```

Change **line 60** (banner border):
```tsx
// BEFORE
borderColor: 'rgba(46, 211, 198, 0.15)',
// AFTER
borderColor: 'rgba(212, 175, 55, 0.15)',
```

Change **line 83** (dismiss button background):
```tsx
// BEFORE
backgroundColor: 'rgba(46, 211, 198, 0.1)',
// AFTER
backgroundColor: 'rgba(212, 175, 55, 0.1)',
```

---

- [ ] **Step 1c: Fix MainNavigator.tsx — replace amber flame with gold**

Open `src/navigation/MainNavigator.tsx`.

Change **line 79** (flameColor definition):
```tsx
// BEFORE
const flameColor = focused ? '#F59E0B' : 'rgba(245,158,11,0.42)';
// AFTER
const flameColor = focused ? Colors.accent.primary : `${Colors.accent.primary}6A`;
```

Make sure `Colors` is imported at the top of the file (it almost certainly already is — check imports).

Change **line 267** (tab indicator backgroundColor — the floating pill active indicator):
```tsx
// BEFORE
backgroundColor: '#F59E0B',
// AFTER
backgroundColor: Colors.accent.primary,
```

---

- [ ] **Step 1d: Fix EmptyStates.tsx — replace purple pen with gold**

Open `src/components/EmptyStates.tsx`.

Change **line 228** (journalPen background):
```tsx
// BEFORE
backgroundColor: 'rgba(167, 139, 250, 0.8)',
// AFTER
backgroundColor: `${Colors.accent.primary}CC`,
```

Change **line 235-236** (journalPenLine background — the inner sub-view):
```tsx
// BEFORE
backgroundColor: 'rgba(167, 139, 250, 0.8)',
// AFTER
backgroundColor: `${Colors.accent.primary}CC`,
```

---

- [ ] **Step 1e: Typecheck and commit**

Run:
```bash
npx tsc --noEmit -p tsconfig.json
```
Expected: 0 errors.

```bash
git add src/components/home/StreakBar.tsx src/components/home/CheckInBanner.tsx src/navigation/MainNavigator.tsx src/components/EmptyStates.tsx
git commit -m "fix(palette): unify off-palette colors to Celestial Night gold"
```

---

## Task 2: Onboarding Legibility Fixes

**Files:**
- Modify: `src/components/onboarding/WelcomeScreen.tsx`
- Modify: `src/components/onboarding/HeartCheckInScreen.tsx`
- Modify: `src/components/onboarding/NotificationScreen.tsx`

---

- [ ] **Step 2a: WelcomeScreen — increase feature card border opacity**

Open `src/components/onboarding/WelcomeScreen.tsx`.

Change **line 200** (featureCard borderColor):
```tsx
// BEFORE
borderColor: 'rgba(201, 168, 76, 0.12)',
// AFTER
borderColor: 'rgba(201, 168, 76, 0.25)',
```

---

- [ ] **Step 2b: HeartCheckInScreen — subtitle legibility and stable dot keys**

Open `src/components/onboarding/HeartCheckInScreen.tsx`.

Change **line 366** (subtitle style):
```tsx
// BEFORE
subtitle: {
  fontSize: 13,
  color: 'rgba(176,196,215,0.65)',
  textAlign: 'center',
  letterSpacing: 0.3,
},
// AFTER
subtitle: {
  fontSize: 14,
  color: 'rgba(176,196,215,0.85)',
  textAlign: 'center',
  letterSpacing: 0.3,
},
```

Change **line 316** (dot indicator key — replace index with stable mood ID):
```tsx
// BEFORE
{MOODS.map((_, i) => (
  <View key={i} style={styles.dotSlot}>
// AFTER
{MOODS.map((mood, i) => (
  <View key={mood.id} style={styles.dotSlot}>
```

---

- [ ] **Step 2c: NotificationScreen — "Not now" link visibility**

Open `src/components/onboarding/NotificationScreen.tsx`.

Change **line 182** (skipBtnText color):
```tsx
// BEFORE
color: 'rgba(245, 237, 227, 0.68)',
// AFTER
color: 'rgba(245, 237, 227, 0.85)',
```

---

- [ ] **Step 2d: Typecheck and commit**

Run:
```bash
npx tsc --noEmit -p tsconfig.json
```
Expected: 0 errors.

```bash
git add src/components/onboarding/WelcomeScreen.tsx src/components/onboarding/HeartCheckInScreen.tsx src/components/onboarding/NotificationScreen.tsx
git commit -m "fix(legibility): feature card borders, carousel subtitle, not-now link"
```

---

## Task 3: Home Screen — Bismillah Scaling

**Files:**
- Modify: `src/components/home/HeroHeader.tsx`

The Bismillah calligraphy in the hero header is `fontSize: 24` with a `textShadowRadius: 24` glow. This is competing with the `VerseOfTheDay` section directly below it — both are Arabic-script display elements with gold styling. Reducing the Bismillah to a smaller, quieter presence restores hierarchy: it becomes ambient atmosphere, not a focal point.

---

- [ ] **Step 3a: Reduce Bismillah size and glow**

Open `src/components/home/HeroHeader.tsx`.

Change **lines 161–174** (bismillah style):
```tsx
// BEFORE
bismillah: {
  fontFamily: Typography.fonts.arabic,
  fontSize: 24,
  lineHeight: 52,
  color: Colors.accent.light,
  textAlign: 'center',
  alignSelf: 'stretch',
  paddingHorizontal: Spacing.xl,
  paddingBottom: Spacing.sm,
  marginTop: Spacing.sm,
  textShadowColor: 'rgba(232, 200, 106, 0.85)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 24,
},
// AFTER
bismillah: {
  fontFamily: Typography.fonts.arabic,
  fontSize: 18,
  lineHeight: 40,
  color: Colors.accent.light,
  textAlign: 'center',
  alignSelf: 'stretch',
  paddingHorizontal: Spacing.xl,
  paddingBottom: Spacing.sm,
  marginTop: Spacing.sm,
  textShadowColor: 'rgba(232, 200, 106, 0.5)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 12,
},
```

---

- [ ] **Step 3b: Typecheck and commit**

Run:
```bash
npx tsc --noEmit -p tsconfig.json
```
Expected: 0 errors.

```bash
git add src/components/home/HeroHeader.tsx
git commit -m "fix(home): reduce Bismillah size/glow to avoid competing with verse card"
```

---

## Task 4: Sacred Journeys — Suppress Paywall Navigation on Locked Paths

**Files:**
- Modify: `src/screens/PathsScreen.tsx`

When a user taps a locked journey card, the app currently calls `navigation.navigate('Support')`, which takes them to the support/paywall screen. The card already displays all the information they need inline ("EARLY ACCESS · COMING SOON" pill + PREMIUM badge + description). Navigating away is disorienting and feels aggressive.

**Fix:** On locked cards, emit a haptic feedback (confirming the tap was registered) but stay on the screen. The inline card content is already the right answer.

---

- [ ] **Step 4a: Add Haptics import and suppress locked navigation**

Open `src/screens/PathsScreen.tsx`.

First, add the Haptics import at the top (check if it's already imported — if so skip this):
```tsx
import * as Haptics from 'expo-haptics';
```

Change **lines 295–300** (`onPathSelected` function):
```tsx
// BEFORE
const onPathSelected = (pathId: string) => {
  if (AVAILABLE_PATH_IDS.has(pathId)) {
    navigation.navigate('PathDetail', { pathId });
  } else {
    navigation.navigate('Support');
  }
};
// AFTER
const onPathSelected = (pathId: string) => {
  if (AVAILABLE_PATH_IDS.has(pathId)) {
    navigation.navigate('PathDetail', { pathId });
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};
```

---

- [ ] **Step 4b: Typecheck and commit**

Run:
```bash
npx tsc --noEmit -p tsconfig.json
```
Expected: 0 errors.

```bash
git add src/screens/PathsScreen.tsx
git commit -m "fix(journeys): locked paths stay inline instead of navigating to support screen"
```

---

## Task 5: Key Stability Audit

**Files:**
- Modify: `src/components/home/StreakBar.tsx`
- Audit: any other `.map()` call using a bare numeric index as `key`

The console showed "Encountered two children with the same key '.$1'" during the visual review. React's internal `.$N` format means two siblings in the same parent were assigned `key="1"`. The most likely candidates:

1. `StreakBar.tsx:56` — `weekDots.map((dot, i) => <View key={i} …>)` — 7 dots, keys 0–6
2. `HeartCheckInScreen.tsx:316` — dots already fixed in Task 2 to use `mood.id`
3. Any other index-keyed `.map()` at the same render level

---

- [ ] **Step 5a: Fix StreakBar week-dot keys**

Open `src/components/home/StreakBar.tsx`.

Change **line 56** (week dot key):
```tsx
// BEFORE
{weekDots.map((dot, i) => (
  <View key={i} style={styles.streakDotCol}>
// AFTER
{weekDots.map((dot, i) => (
  <View key={`streak-dot-${i}`} style={styles.streakDotCol}>
```

---

- [ ] **Step 5b: Audit remaining index-key `.map()` calls**

Run this search:
```bash
npx grep -rn "key=\{i\}\|key=\{index\}" src/ --include="*.tsx"
```

For each match, replace `key={i}` or `key={index}` with a stable ID:
- If the iterated object has an `id` field: `key={item.id}`
- If it's a static array: `key={`prefix-${i}`}` (any constant prefix makes it unique within its parent)
- If it's already scoped to a single parent and not duplicated: leave it — these warnings are about two components at the same level having the same key, not about index keys per se

Common false-positives to skip:
- `STARS.map((s, i) => <TwinklingStar key={i} …>)` — safe if no other sibling uses `key={1}` at the same render level

---

- [ ] **Step 5c: Typecheck and commit**

Run:
```bash
npx tsc --noEmit -p tsconfig.json
```
Expected: 0 errors.

```bash
git add src/components/home/StreakBar.tsx
git commit -m "fix(keys): stable React list keys to silence duplicate-key warnings"
```

---

## Self-Review

**Spec coverage check:**
- Off-palette green streak → Task 1a ✓
- Off-palette teal banner → Task 1b ✓
- Off-palette amber flame tab icon → Task 1c ✓
- Purple pen empty state → Task 1d ✓
- Feature card borders faint → Task 2a ✓
- Carousel subtitle dim → Task 2b ✓
- "Not now" barely readable → Task 2c ✓
- Bismillah competes with verse card → Task 3 ✓
- Locked paths navigate away → Task 4 ✓
- Duplicate key warnings → Task 5 ✓

**Placeholder scan:** None — all steps contain exact file paths, line numbers, before/after code.

**Type consistency:** No new types introduced. All token references (`Colors.accent.primary`, `Colors.accent.light`) already exist in `DesignSystem.ts`.

**What this plan does NOT cover (out of scope, separate decisions):**
- Adding a "Coming soon" modal/bottom sheet for locked journeys (requires new component)
- Changing `Colors.status.success` in `DesignSystem.ts` globally (would affect other semantic success states like form validation — scoped fixes in StreakBar are safer)
- Carousel card width increase for stronger peek (CARD_WIDTH is already 72%, giving ~14% side peek — acceptable; changing it risks clipping cards on small devices)
