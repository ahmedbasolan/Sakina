# Celestial Night UI Unification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the app's background palette to the Celestial Night ramp (`#07111E`/`#0C1A2E`/`#0F1F30`) by promoting it to the design token canon and repainting the screens that use conflicting raw hex values.

**Architecture:** Single design-token update (`DesignSystem.ts`) cascades free changes to token-based screens. Screens with hardcoded hex are manually patched. No new components — only StyleSheet and import changes. Verification = `npx tsc --noEmit`.

**Tech Stack:** React Native (Expo), `StyleSheet`, `DesignSystem.ts` token system, `expo-linear-gradient`, `react-native-safe-area-context`.

> **Note on TDD:** These are StyleSheet-only visual changes — no business logic, no unit tests. Verification is `npx tsc --noEmit` (types) + on-device visual inspection (user). Each task ends with a typecheck and commit.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/theme/DesignSystem.ts` | Modify | Background ramp → Celestial Night; add `celestialWash` token |
| `src/screens/MoodHistoryCalendarScreen.tsx` | Modify | Full repaint + mandala texture |
| `src/screens/HomeScreen.tsx` | Modify | Gradient token + quick-card raw hexes |
| `src/screens/SettingsScreen.tsx` | Modify | Gradient wrong third stop |
| `src/screens/PrayerTimesScreen.tsx` | Modify | Gradient wrong third stop |
| `src/screens/LibraryScreen.tsx` | Modify | Source gradient + container from token |
| `src/screens/AuthScreens.tsx` | Modify | Source gradient from token |
| `src/screens/QuranLibraryScreen.tsx` | Modify | Source gradient from token |
| `CLAUDE.md` | Modify | Update aesthetic description to Celestial Night |

---

## Task 1: Promote Celestial Night to the token canon

**Files:**
- Modify: `src/theme/DesignSystem.ts:32-73`

- [ ] **Step 1: Update `Colors.background` and add `celestialWash`**

In `src/theme/DesignSystem.ts`, replace the `background` block and add `celestialWash` inside `Colors`:

```ts
// Old:
  background: {
    primary: '#040D1A',   // Midnight Navy
    secondary: '#081629', // Deep Navy
    tertiary: '#0C1D3A',  // Soft Navy
  },

// New:
  background: {
    primary:   '#07111E', // Celestial base — deepest screen ground
    secondary: '#0C1A2E', // Raised surfaces / sheets
    tertiary:  '#0F1F30', // Cards
  },

  // Standard screen-wash gradient — use instead of inline color arrays
  celestialWash: ['#07111E', '#0C1A2E', '#0F1F30'] as const,
```

The `celestialWash` field goes immediately after the `background` block, still inside the `Colors` object, before `glass`.

- [ ] **Step 2: Typecheck**

```
npx tsc --noEmit -p tsconfig.json
```

Expected: 0 errors. If any screen imports `Colors.background.primary` etc. the new values simply flow through — no rename needed.

- [ ] **Step 3: Commit**

```
git add src/theme/DesignSystem.ts
git commit -m "feat(tokens): promote Celestial Night palette to DesignSystem canon"
```

---

## Task 2: Repaint MoodHistoryCalendarScreen

The biggest clash — currently uses the mid-blue slate family (`#0C1220`, `#0F1E30`, `#1E3A5F`) plus many raw muted-text hexes and raw border-radius numbers. Also missing the mandala backdrop texture.

**Files:**
- Modify: `src/screens/MoodHistoryCalendarScreen.tsx`

- [ ] **Step 1: Expand imports**

Change the first import line from:

```ts
import { Colors } from '../theme/DesignSystem';
```

to:

```ts
import { Colors, BorderRadius, Spacing } from '../theme/DesignSystem';
import { AnimatedMandala } from '../components/AnimatedMandala';
```

- [ ] **Step 2: Add the mandala backdrop**

In the JSX `return`, the top-level element is `<View style={styles.container}>`. Add the mandala as the first child, before `<Animated.View style={[styles.header ...`:

```tsx
<View style={styles.container}>
  {/* Celestial texture — matches Library/Paths backdrop */}
  <View style={styles.mandalaWrap} pointerEvents="none">
    <AnimatedMandala size={280} color={Colors.accent.primary} opacity={0.07} />
  </View>

  {/* Header — existing code unchanged below this point */}
  <Animated.View style={[styles.header, { paddingTop: topInset + 12, opacity: headerOpacity }]}>
```

- [ ] **Step 3: Repaint `StyleSheet.create` — container, loading, header**

Find `const styles = StyleSheet.create({` (around line 719) and apply:

```ts
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,   // was '#0C1220'
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text.muted,                     // was '#6B8EAE'
    fontWeight: '500',
  },
  // headerGlowOrb.borderRadius stays 90 — intentional large glow circle, no token
  headerGlowOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(251,146,60,0.07)',
    right: -50,
    top: -60,
  },
  backText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,                   // was '#F0E6D3'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,                   // was '#F0E6D3'
    letterSpacing: -0.3,
  },
```

- [ ] **Step 4: Repaint the header LinearGradient**

Find the header `LinearGradient` (around line 331–334):

```tsx
// Old:
<LinearGradient
  colors={['#0E0C18', '#0C1220']}
  style={StyleSheet.absoluteFill}
/>

// New:
<LinearGradient
  colors={[Colors.background.primary, Colors.background.secondary]}
  style={StyleSheet.absoluteFill}
/>
```

- [ ] **Step 5: Repaint hero card styles**

```ts
  heroCard: {
    backgroundColor: Colors.background.tertiary,  // was '#0F1E30'
    borderRadius: BorderRadius.xl,                // was 20 — exact match
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.2)',           // keep — gold accent border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  ringValue: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.text.primary,                   // was '#F0E6D3'
    lineHeight: 34,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,                   // was '#F0E6D3'
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.text.muted,                     // was '#6B8EAE'
    marginBottom: 10,
    lineHeight: 17,
  },
  heroStatLabel: {
    fontSize: 12,
    color: Colors.text.muted,                     // was '#6B8EAE'
  },
  quoteText: {
    fontSize: 12,
    color: Colors.text.muted,                     // was '#6B8EAE'
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
```

- [ ] **Step 6: Repaint card + month selector**

```ts
  card: {
    backgroundColor: Colors.background.tertiary,  // was '#0F1E30'
    borderRadius: BorderRadius.xl,                // was 18 — nearest token (20)
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.glass.border,             // was '#1E3A5F'
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,                   // was '#F0E6D3'
    marginBottom: 14,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,                // was 12 — exact match
    backgroundColor: Colors.glass.medium,         // was '#1E3A5F'
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,                   // was '#F0E6D3'
    letterSpacing: -0.2,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.muted,                     // was '#2A4A6A'
  },
```

- [ ] **Step 7: Repaint legend, day-detail, entry, distribution styles**

```ts
  legendText: {
    fontSize: 11,
    color: Colors.text.muted,                     // was '#6B8EAE'
    fontWeight: '500',
  },
  dayDetailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,                   // was '#F0E6D3'
  },
  moodBadgeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,                   // was '#F0E6D3'
  },
  moodBadgeSub: {
    fontSize: 12,
    color: Colors.text.muted,                     // was '#6B8EAE'
    fontWeight: '500',
  },
  moodBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,                // was 14 — nearest token (16)
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTime: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.muted,                     // was '#6B8EAE'
  },
  entryTranslation: {
    fontSize: 13,
    color: Colors.text.muted,                     // was '#6A90B0'
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  reflectionBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Colors.glass.light,          // was 'rgba(30,58,95,0.5)' — warm glass
    borderRadius: BorderRadius.sm,                // was 10 — nearest token (8)
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.2)',       // keep — gold border
  },
  reflectionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.secondary,                 // was '#7DD3FC' — warm cream secondary
    lineHeight: 19,
    fontStyle: 'italic',
  },
  entryDivider: {
    height: 1,
    backgroundColor: Colors.glass.border,         // was '#1E3A5F'
    marginVertical: 12,
  },
  noDataText: {
    fontSize: 13,
    color: Colors.text.muted,                     // was '#6B8EAE'
    textAlign: 'center',
    marginVertical: 16,
  },
  distMood: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,                 // was '#B0C4D8'
  },
  distBarBg: {
    height: 8,
    backgroundColor: Colors.glass.medium,         // was '#1E3A5F'
    borderRadius: 4,                              // keep — functional bar shape
    overflow: 'hidden',
  },
  insightDesc: {
    fontSize: 12,
    color: Colors.text.muted,                     // was '#6A90B0'
    lineHeight: 18,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
    color: Colors.text.primary,                   // was '#F0E6D3'
  },
```

- [ ] **Step 8: Add `mandalaWrap` style**

Add this to `StyleSheet.create`:

```ts
  mandalaWrap: {
    position: 'absolute',
    left: width / 2 - 140,
    top: 16,
    zIndex: 0,
    pointerEvents: 'none',
  },
```

- [ ] **Step 9: Typecheck**

```
npx tsc --noEmit -p tsconfig.json
```

Expected: 0 errors.

- [ ] **Step 10: Commit**

```
git add src/screens/MoodHistoryCalendarScreen.tsx
git commit -m "fix(ui): repaint MoodHistoryCalendarScreen to Celestial Night palette"
```

---

## Task 3: Fix HomeScreen gradient and quick-action cards

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

The gradient has the wrong third stop (`#0F1519` → `#0F1F30`). The two quick-action cards use raw hex for base, border, icon badge, and text color — one with a blue tint and one with an unsanctioned purple.

- [ ] **Step 1: Fix the screen wash gradient**

Find (around line 247):

```tsx
// Old:
<LinearGradient colors={['#07111E', '#0C1A2E', '#0F1519']} style={styles.gradient}>

// New:
<LinearGradient colors={Colors.celestialWash} style={styles.gradient}>
```

- [ ] **Step 2: Fix Prayer Times quick card**

Find (around line 411–428):

```tsx
// Old:
<TouchableOpacity
  style={[styles.quickCard, { backgroundColor: '#0F2236', borderColor: '#1E3A5F' }]}
  onPress={() => navigation.navigate('PrayerTimes')}
  activeOpacity={0.85}
>
  <View style={[styles.quickCardIcon, { backgroundColor: '#0A1828', borderColor: '#1A3A5A' }]}>
    <PrayerArchIcon size={18} color="#60A5FA" />
  </View>
  <Text style={styles.quickCardTitle}>PRAYER TIMES</Text>
  <Text style={[styles.quickCardValue, { color: '#60A5FA' }]}>
    {nextPrayer ? `${nextPrayer.name} ${formatPrayerTime(nextPrayer.time, timeFormat)}` : 'View all'}
  </Text>

// New:
<TouchableOpacity
  style={[styles.quickCard, { backgroundColor: Colors.background.tertiary, borderColor: Colors.glass.border }]}
  onPress={() => navigation.navigate('PrayerTimes')}
  activeOpacity={0.85}
>
  <View style={[styles.quickCardIcon, { backgroundColor: Colors.background.secondary, borderColor: Colors.glass.border }]}>
    <PrayerArchIcon size={18} color={Colors.accent.primary} />
  </View>
  <Text style={styles.quickCardTitle}>PRAYER TIMES</Text>
  <Text style={[styles.quickCardValue, { color: Colors.accent.primary }]}>
    {nextPrayer ? `${nextPrayer.name} ${formatPrayerTime(nextPrayer.time, timeFormat)}` : 'View all'}
  </Text>
```

- [ ] **Step 3: Fix Journal quick card**

Find (around line 430–441):

```tsx
// Old:
<TouchableOpacity
  style={[styles.quickCard, { backgroundColor: '#180E2E', borderColor: '#3D1E6A' }]}
  onPress={() => navigation.navigate('Journal')}
  activeOpacity={0.85}
>
  <View style={[styles.quickCardIcon, { backgroundColor: '#120A20', borderColor: '#2A1040' }]}>
    <QuillIcon size={18} color="#C084FC" />
  </View>
  <Text style={styles.quickCardTitle}>JOURNAL</Text>
  <Text style={[styles.quickCardValue, { color: '#C084FC' }]}>Write today</Text>

// New:
<TouchableOpacity
  style={[styles.quickCard, { backgroundColor: Colors.background.tertiary, borderColor: Colors.glass.border }]}
  onPress={() => navigation.navigate('Journal')}
  activeOpacity={0.85}
>
  <View style={[styles.quickCardIcon, { backgroundColor: Colors.background.secondary, borderColor: Colors.glass.border }]}>
    <QuillIcon size={18} color={Colors.accent.secondary} />
  </View>
  <Text style={styles.quickCardTitle}>JOURNAL</Text>
  <Text style={[styles.quickCardValue, { color: Colors.accent.secondary }]}>Write today</Text>
```

- [ ] **Step 4: Typecheck**

```
npx tsc --noEmit -p tsconfig.json
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```
git add src/screens/HomeScreen.tsx
git commit -m "fix(ui): source HomeScreen gradient from token; replace off-palette quick-card hexes"
```

---

## Task 4: Fix SettingsScreen and PrayerTimesScreen gradients

Both use `['#07111E', '#0C1A2E', '#0F1519']` — the third stop `#0F1519` is wrong (greenish, not Celestial Night).

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`
- Modify: `src/screens/PrayerTimesScreen.tsx`

- [ ] **Step 1: Fix SettingsScreen gradient**

Find (around line 355):

```tsx
// Old:
<LinearGradient colors={['#07111E', '#0C1A2E', '#0F1519']} style={styles.container}>

// New:
<LinearGradient colors={Colors.celestialWash} style={styles.container}>
```

Add `Colors` to the import from `DesignSystem` if not already present (it's already imported on line 26).

- [ ] **Step 2: Fix PrayerTimesScreen outer gradient**

Find (around line 120):

```tsx
// Old:
<LinearGradient colors={['#07111E', '#0C1A2E', '#0F1519']} style={styles.gradient}>

// New:
<LinearGradient colors={Colors.celestialWash} style={styles.gradient}>
```

The inner per-row gradient at ~line 174–176 (`colors={['#1A1408', '#0F1A2A']}`) is the active-prayer highlight row — intentional per-row accent, leave it unchanged.

The text colors `#0C1A2E` at lines ~449 and ~552 are inverted labels on the gold CTA button (dark text on gold bg) — intentional, leave them unchanged.

- [ ] **Step 3: Typecheck**

```
npx tsc --noEmit -p tsconfig.json
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```
git add src/screens/SettingsScreen.tsx src/screens/PrayerTimesScreen.tsx
git commit -m "fix(ui): correct wrong gradient third-stop in Settings and PrayerTimes screens"
```

---

## Task 5: Source gradients from token — Library, Auth, QuranLibrary

These screens already use the correct Celestial Night colors but define them inline. Source from the token so future palette changes cascade automatically.

**Files:**
- Modify: `src/screens/LibraryScreen.tsx`
- Modify: `src/screens/AuthScreens.tsx`
- Modify: `src/screens/QuranLibraryScreen.tsx`

- [ ] **Step 1: LibraryScreen — gradient + container**

In `src/screens/LibraryScreen.tsx`, around line 378:

```tsx
// Old:
<LinearGradient
  colors={['#07111E', '#0C1A2E', '#0F1F30']}
  style={StyleSheet.absoluteFill}
  start={{ x: 0.5, y: 0 }}
  end={{ x: 0.5, y: 1 }}
/>

// New:
<LinearGradient
  colors={Colors.celestialWash}
  style={StyleSheet.absoluteFill}
  start={{ x: 0.5, y: 0 }}
  end={{ x: 0.5, y: 1 }}
/>
```

In the `StyleSheet.create`, around line 598:

```ts
// Old:
  container: { flex: 1, backgroundColor: '#07111E' },

// New:
  container: { flex: 1, backgroundColor: Colors.background.primary },
```

- [ ] **Step 2: AuthScreens — gradient**

In `src/screens/AuthScreens.tsx`, around line 92:

```tsx
// Old:
<LinearGradient colors={['#07111E', '#0C1A2E', '#0F1F30']} style={styles.gradient}>

// New:
<LinearGradient colors={Colors.celestialWash} style={styles.gradient}>
```

`Colors` is already imported via `DesignSystem` at the top.

- [ ] **Step 3: QuranLibraryScreen — gradient**

In `src/screens/QuranLibraryScreen.tsx`, around line 217:

```tsx
// Old:
<LinearGradient
  colors={['#07111E', '#0C1A2E', '#0F1F30']}

// New:
<LinearGradient
  colors={Colors.celestialWash}
```

Add `Colors` to the DesignSystem import if not already present.

- [ ] **Step 4: Typecheck**

```
npx tsc --noEmit -p tsconfig.json
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```
git add src/screens/LibraryScreen.tsx src/screens/AuthScreens.tsx src/screens/QuranLibraryScreen.tsx
git commit -m "fix(ui): source celestialWash gradient from token in Library, Auth, QuranLibrary"
```

---

## Task 6: Update CLAUDE.md aesthetic description

The doc currently describes the "Warm Arabian Sanctuary" palette with warm-navy hex values. Update it to reflect the shipped Celestial Night canon.

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update aesthetic paragraph**

Find the first paragraph of `CLAUDE.md`:

```md
// Old:
Sakina is a React Native (Expo) Islamic spiritual companion app. Aesthetic:
**"Warm Arabian Sanctuary"** — midnight-navy backgrounds, warm cream text, a
single gold accent, calm and breathing motion.
```

Replace with:

```md
Sakina is a React Native (Expo) Islamic spiritual companion app. Aesthetic:
**"Celestial Night"** — cool steel-blue backgrounds (`#07111E`→`#0F1F30`), warm
cream text (`#F5EDE3`), single gold accent (`#D4AF37`), twinkling stars, and a
faint gold mandala backdrop. Calm, breathing motion. The warm-on-cool contrast
is intentional — a lantern under a starlit sky.
```

- [ ] **Step 2: Commit**

```
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md aesthetic description to Celestial Night canon"
```

---

## Task 7: Final verification pass

- [ ] **Step 1: Full typecheck**

```
npx tsc --noEmit -p tsconfig.json
```

Expected: 0 errors.

- [ ] **Step 2: Verify on device**

Run the app via Expo and visually check each repainted screen:

- **MoodHistory** — same cool-navy ground as Home/Library; star field + gold mandala visible; no raw mid-blue surfaces; text is warm cream.
- **Home** — gradient feels consistent; quick cards sit on the navy base with gold / teal icon tints (not blue or purple).
- **Settings** — gradient no longer has the greenish `#0F1519` tinge.
- **PrayerTimes** — same as Settings fix; active-row highlight still gold.
- **Library / Auth / QuranLibrary** — no visual change (values were already correct, just tokenized).
- **GuidanceScreen** — untouched (mood-immersive, intentionally different).

- [ ] **Step 3: Smoke-check untouched screens**

Navigate through Paths, PathDetail, PathStep, DailyReminders, SurahReader, OnboardingScreen, SupportSakina — confirm nothing regressed (these use `Colors.background.*` tokens which now resolve to the new values).

- [ ] **Step 4: Final commit (if any fixups needed)**

```
git add <any files fixed in verification>
git commit -m "fix(ui): verification fixups from on-device check"
```

---

## Self-Review Checklist (completed inline)

**Spec coverage:**
- [x] `Colors.background` → Celestial Night — Task 1
- [x] `celestialWash` token added — Task 1
- [x] `MoodHistoryCalendarScreen` full repaint — Task 2
- [x] Mandala texture added to MoodHistoryCalendar — Task 2 step 2 + step 8
- [x] `HomeScreen` gradient + quick cards — Task 3
- [x] Kill purple fourth hue, replace with teal — Task 3 step 3
- [x] `SettingsScreen` wrong third stop — Task 4
- [x] `PrayerTimesScreen` wrong third stop — Task 4
- [x] Library / Auth / QuranLibrary tokenized — Task 5
- [x] CLAUDE.md updated — Task 6
- [x] Typecheck at every task — each task step 3/4/5
- [x] MoodColors + GuidanceScreen out of scope — not touched

**Placeholder scan:** No TBDs, no "implement later", all code blocks are complete.

**Type consistency:** `Colors.celestialWash` defined in Task 1, consumed in Tasks 2–5. `BorderRadius.xl` = 20, `BorderRadius.md` = 12, `BorderRadius.lg` = 16 — all exact DesignSystem values.
