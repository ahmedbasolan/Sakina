# Noor UX Immersion Improvements — Design Spec

**Date:** 2026-05-08
**Goal:** Modernize the Noor app's UX from onboarding through homescreen with emotional depth, psychological hooks, and smooth immersion. All changes reinforce the spiritual companion identity.

**Approach:** Quick wins first, then medium effort, then heavy lifts. Each tier is independently shippable.

---

## Tier 1: Quick Wins (Copy, Typography, Gradient Fixes)

No new components. Text/style changes only.

### 1A. UX Copy Rewrites

| File | Element | Current | New |
|------|---------|---------|-----|
| `WelcomeScreen.tsx` | Feature chip | "Personalized verse recommendations based on your emotions" | "A verse chosen for your heart, right now" |
| `WelcomeScreen.tsx` | Skip text opacity | `0.45` | `0.25` |
| `CheckInBanner.tsx` | Banner text | "You haven't checked in today — how is your heart?" | "Your heart has a story today — take a moment" |
| `NotificationScreen.tsx` | Title | "Stay Connected" | "Gentle Reminders" |
| `NotificationScreen.tsx` | Body | "Gentle reminders for prayer times and daily verses — like a soft call to spiritual practice" | "A verse at Fajr. A reflection at Maghrib.\nLike a friend who remembers." |
| `NotificationScreen.tsx` | CTA button | "Allow Notifications" | "Yes, remind me" |
| `NotificationScreen.tsx` | Skip button | "Maybe later" | "Not now" |
| `HomeScreen.tsx` | Mood section header | "HOW IS YOUR HEART?" | "How Is Your Heart?" |

### 1B. Typography Refinements

| File | Element | Change |
|------|---------|--------|
| `VerseLayer.tsx` | English translation text | Switch `fontFamily` from `Inter`/`sans-serif` to `Georgia`/`serif` |
| `HomeScreen.tsx` / `MoodButton.tsx` | Mood sublabels (Shukr, Amal, etc.) | Switch to serif font + italic style |
| `HomeScreen.tsx` | Section header `letterSpacing` | Reduce from `3` to `1.5` |

### 1C. NotificationScreen Gradient Fix

**File:** `NotificationScreen.tsx`

Replace the warm red-brown gradient with the consistent celestial palette:
```
colors={['#07111E', '#0C1A2E', '#0F1F30']}
```
This matches `WelcomeScreen` and other onboarding screens. The warm gradient currently creates subconscious pressure/urgency which is wrong for a trust-building permission ask.

### 1D. Mood Selection Screen Header Copy

**File:** `MoodSelectionScreen.tsx`

Add a reassurance line below the "Choose the emotion closest to how you feel right now" subtitle:
```
"There's no wrong answer. Just be honest."
```
Style: `Colors.text.muted`, `fontSize: 13`, `marginTop: 4`

---

## Tier 2: Medium Effort (New Components, Animation Sequences, Smart Logic)

### 2A. Smart Mood Grid (2x2 + Expand)

**New files:**
- `src/components/home/SmartMoodGrid.tsx` — main component
- `src/utils/moodTimeMapping.ts` — time-based mood selection logic

**Replaces:** Current 4-column `moodGrid` in `HomeScreen.tsx` mood section.

**Behavior:**
- Default state: 2x2 grid showing 4 moods selected by time of day
- "See all 8" button below expands to 2x4 grid with `LayoutAnimation.configureNext()` spring
- Each card: horizontal layout with icon circle (36px), label (title case, not all-caps), sublabel underneath
- Card style matches existing `MoodButton` colors but with horizontal text (no vertical rotation)
- Stagger entry animation: 80ms delay per card on mount

**Time-mood mapping:**

| Time Window | Moods Shown |
|-------------|-------------|
| 11pm - 4am (late night) | Lonely, Overwhelmed, Tired, Sad |
| 4am - 7am (fajr/morning) | Grateful, Hopeful, Peaceful, Tired |
| 7am - 5pm (daytime) | Grateful, Hopeful, Peaceful, Overwhelmed |
| 5pm - 11pm (evening) | Peaceful, Tired, Sad, Lonely |

**Card dimensions:** `width: (screenWidth - 48 - 12) / 2`, `minHeight: 80`, `borderRadius: 16`

**Expand/collapse animation:** `LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)` before state change. The 4 hidden cards stagger in with 60ms delay each.

### 2B. Staged Verse Revelation Animation

**File:** `src/components/VerseLayer.tsx`

Replace the current instant-render with a sequential reveal:

```
Timeline:
0ms     — Component mounts, all text opacity: 0
100ms   — Arabic text fades in (600ms) + slides up 15px
700ms   — Pause
1100ms  — Diamond ornament fades in (200ms)
1300ms  — English translation fades in (600ms) + slides up 10px
1900ms  — Surah reference fades in (400ms)
```

Implementation: `Animated.sequence()` with `Animated.parallel()` for simultaneous opacity + translateY.

Haptic feedback: `Haptics.impactAsync(ImpactFeedbackStyle.Light)` fires at 100ms (Arabic text start).

**Skip mechanism:** Tap anywhere on the verse area during animation to complete all animations instantly (set all values to final state).

### 2C. Time-Aware Greetings

**File:** `src/screens/HomeScreen.tsx`

Expand `getGreeting()` to accept streak count and last-open timestamp:

```typescript
function getGreeting(streakDays: number, lastOpenDate: string | null): string {
  const h = new Date().getHours();

  // Absence recognition (3+ days since last open)
  if (lastOpenDate) {
    const daysSince = Math.floor((Date.now() - new Date(lastOpenDate).getTime()) / 86400000);
    if (daysSince >= 3) return 'Welcome back. This door is always open.';
  }

  // Streak recognition (7+ days)
  if (streakDays >= 7) return `${streakDays} days of showing up for your soul`;

  // Time-based
  if (h >= 0 && h < 4) return 'You\'re awake. Allah is with you.';
  if (h < 5) return 'Peace be upon you';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}
```

**Data:** `lastOpenDate` stored/retrieved via `AsyncStorage.getItem('lastOpenDate')`. Set on each app open.

### 2D. Delayed Continue Button

**Files:** `src/components/onboarding/FirstGuidanceScreen.tsx`, `src/screens/GuidanceScreen.tsx`

- Continue/CTA button: `opacity: 0` on mount, `setTimeout` 4000ms, then `Animated.timing` fade to 1 over 1000ms
- "Your journey has already begun" pill: remove container background/border, render as plain `Text` with `color: Colors.accent.primary`, `opacity: 0.6`, fade in after 3000ms
- If user taps verse area before button appears, show button immediately (don't trap them)

### 2E. Mood Selection Transition

**File:** `src/screens/MoodSelectionScreen.tsx` (or wherever standalone mood selection handles navigation)

On mood tap:
1. Selected card scales to `1.05` with spring (200ms)
2. All other cards fade to `opacity: 0` and scale to `0.95` (400ms)
3. Hold for 400ms
4. Navigate to GuidanceScreen

Total delay before navigation: ~800ms. Uses `Animated.parallel` + `setTimeout`.

**Bail-out:** If user taps a different mood during the 800ms window, cancel and restart with new selection.

---

## Tier 3: Heavy Lift (Reanimated, Ambient Effects, New Features)

### 3A. React Native Reanimated Migration

**New dependency:** `react-native-reanimated` (install via `npx expo install react-native-reanimated`)

**New shared hooks:**
- `src/hooks/useSpringPress.ts` — spring scale on press/release, replaces manual `Animated.spring` patterns
- `src/hooks/useStaggerReveal.ts` — reanimated version of verse revelation sequence
- `src/hooks/useSmoothExpand.ts` — animated height expansion for mood grid

**Migration order (each is a separate commit):**
1. Install reanimated, add babel plugin, verify build
2. `SmartMoodGrid.tsx` — expand/collapse animation
3. `MoodButton.tsx` — press spring + glow
4. `VerseLayer.tsx` — verse revelation sequence
5. `OnboardingScreen.tsx` — screen transitions
6. `CommitScreen.tsx` — hold-to-commit progress ring

**Not migrating:** `InteractiveStarfield` twinkle, `bgScale` breathing loop, `AnimatedMandala` rotation — these perform fine on JS thread and have no user-interaction coupling.

### 3B. Onboarding Ambient Enhancements

**3B-1. Parallax Star Drift**

**File:** `src/components/onboarding/InteractiveStarfield.tsx`

Add autonomous drift to existing stars:
- 3 depth layers based on star `size`: small (0.3px/s), medium (0.5px/s), large (0.8px/s)
- Drift direction: slow diagonal (upper-left to lower-right)
- Stars wrap around when exiting viewport
- Touch-reactive displacement still works on top of drift
- Implementation: `useEffect` with `requestAnimationFrame` loop updating star positions

**3B-2. Breathing Mandala Glow**

**File:** `src/components/onboarding/WelcomeScreen.tsx`

Behind the sparkle icon ring, add a radial gold glow:
- `View` with `backgroundColor: Colors.accent.primary`, `borderRadius: 9999`, `width: 120`, `height: 120`
- Animated opacity: `0.08` to `0.2` over 6-second cycle (3s up, 3s down)
- Positioned absolutely, centered behind the icon ring
- Uses `Animated.loop` with `Animated.sequence`

**3B-3. Golden Ascending Particles**

**New file:** `src/components/GoldenMotes.tsx`

Renders 6 tiny gold circles (2-3px diameter) that drift upward:
- Random horizontal position within center 60% of screen
- Vertical speed: 1.5-3px per frame (randomized per particle)
- Opacity: fade in over 1s, hold 3s, fade out over 1s
- On reaching top, reset to bottom with new random x
- Implementation: `Animated.loop` per particle with staggered starts

**Used in:** `GuidanceScreen.tsx` and `FirstGuidanceScreen.tsx` — rendered behind verse content.

### 3C. Post-Guidance Reflection Prompt

**New file:** `src/components/ReflectionPrompt.tsx`

A bottom sheet that appears when the user presses "back" on GuidanceScreen:

**Layout:**
- Semi-transparent backdrop (`rgba(0,0,0,0.4)`)
- Bottom card: `backgroundColor: Colors.background.secondary`, `borderTopLeftRadius: 24`, `borderTopRightRadius: 24`
- Prompt text: "What did this verse stir in you?" — serif font, `Colors.text.secondary`
- Single-line `TextInput`: 1-2 lines max, placeholder "A word, a feeling, a prayer..."
- Two buttons: "Save to Journal" (gold CTA) | "Skip" (text button)
- Slide-up animation: 300ms spring from bottom

**Integration in `GuidanceScreen.tsx`:**
- Intercept back navigation with `navigation.addListener('beforeRemove')`
- Show `ReflectionPrompt` instead of navigating immediately
- On "Save": call existing `onSaveReflection(text)`, then navigate back
- On "Skip": navigate back immediately
- Only show once per guidance session (track with local state)

**Data flow:** Uses the existing `rotationEngine.saveReflection()` method — no new backend/storage work needed.

---

## Files Summary

### New Files
| File | Tier | Purpose |
|------|------|---------|
| `src/components/home/SmartMoodGrid.tsx` | 2 | Time-aware 2x2 mood grid with expand |
| `src/utils/moodTimeMapping.ts` | 2 | Time-of-day to mood mapping logic |
| `src/hooks/useSpringPress.ts` | 3 | Reanimated spring press hook |
| `src/hooks/useStaggerReveal.ts` | 3 | Reanimated stagger animation hook |
| `src/hooks/useSmoothExpand.ts` | 3 | Reanimated height expand hook |
| `src/components/GoldenMotes.tsx` | 3 | Ambient ascending gold particles |
| `src/components/ReflectionPrompt.tsx` | 3 | Post-guidance journal prompt |

### Modified Files
| File | Tiers | Changes |
|------|-------|---------|
| `src/components/onboarding/WelcomeScreen.tsx` | 1, 3 | Copy, skip opacity, breathing glow |
| `src/components/onboarding/NotificationScreen.tsx` | 1 | Copy rewrites, gradient fix |
| `src/components/onboarding/FirstGuidanceScreen.tsx` | 2, 3 | Delayed CTA, golden motes |
| `src/components/home/CheckInBanner.tsx` | 1 | Copy rewrite |
| `src/components/home/MoodButton.tsx` | 1, 3 | Serif sublabels, reanimated press |
| `src/screens/HomeScreen.tsx` | 1, 2 | Header case, letter-spacing, smart greeting, smart mood grid |
| `src/screens/MoodSelectionScreen.tsx` | 1, 2 | Reassurance copy, selection transition |
| `src/components/VerseLayer.tsx` | 1, 2, 3 | Serif translation, staged reveal, reanimated |
| `src/screens/GuidanceScreen.tsx` | 2, 3 | Delayed CTA, golden motes, reflection prompt |
| `src/components/onboarding/InteractiveStarfield.tsx` | 3 | Parallax drift |
| `src/components/onboarding/CommitScreen.tsx` | 3 | Reanimated progress ring |
| `src/screens/OnboardingScreen.tsx` | 3 | Reanimated transitions |
| `src/theme/DesignSystem.ts` | 1 | No changes needed (tokens already defined) |

### New Dependencies
| Package | Tier | Why |
|---------|------|-----|
| `react-native-reanimated` | 3 | 60fps UI-thread animations |

---

## Out of Scope

- Custom mood icons (commissioned artwork — design dependency, not code)
- Backend changes (all data uses existing AsyncStorage + rotationEngine)
- New screens or navigation routes
- Premium/paywall changes
