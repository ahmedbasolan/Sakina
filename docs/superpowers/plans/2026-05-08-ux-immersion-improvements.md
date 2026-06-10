# Noor UX Immersion Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize Noor's UX from onboarding through homescreen with emotional depth, psychological hooks, and smooth immersion — organized as quick wins → medium effort → heavy lifts.

**Architecture:** All changes are isolated per-file edits or small new components. No navigation changes, no backend changes. Tier 1 is copy/style only. Tier 2 adds new components and animation sequences. Tier 3 introduces `react-native-reanimated` and ambient effects.

**Tech Stack:** React Native (Expo), TypeScript, react-native-reanimated (Tier 3), expo-haptics, expo-linear-gradient, react-native-svg

---

## TIER 1: QUICK WINS

---

### Task 1: Welcome Screen Copy & Style Updates

**Files:**
- Modify: `src/components/onboarding/WelcomeScreen.tsx`

- [ ] **Step 1: Update feature chip text**

In `WelcomeScreen.tsx`, find the chip `Text` (around line 119) and replace:

```tsx
// Old:
{'  '}Personalized verse recommendations based on your emotions

// New:
{'  '}A verse chosen for your heart, right now
```

- [ ] **Step 2: Reduce skip button opacity**

Find the `skipText` style (search for `skipText` in the StyleSheet) and change the opacity/color. Currently it uses a color with some alpha. Change to:

```tsx
skipText: {
  fontSize: 13,
  color: 'rgba(176, 196, 215, 0.25)', // was ~0.45 opacity — make it more subtle
  letterSpacing: 0.3,
},
```

- [ ] **Step 3: Verify on device/simulator**

Run: `npx expo start` and check the Welcome screen (screen 1 of onboarding). Confirm the chip text reads "A verse chosen for your heart, right now" and the skip text is barely visible.

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding/WelcomeScreen.tsx
git commit -m "style(onboarding): update welcome chip copy and reduce skip opacity"
```

---

### Task 2: Notification Screen Rewrite

**Files:**
- Modify: `src/components/onboarding/NotificationScreen.tsx`

- [ ] **Step 1: Update title, body, CTA, and skip text**

In `NotificationScreen.tsx`, replace the content strings:

```tsx
{/* Title — was "Stay Connected" */}
<Animated.Text style={[styles.title, s[1]]}>
  Gentle Reminders
</Animated.Text>

{/* Body — was generic description */}
<Animated.Text style={[styles.body, s[2]]}>
  A verse at Fajr. A reflection at Maghrib.{'\n'}
  Like a friend who remembers.
</Animated.Text>
```

```tsx
{/* CTA button — was "Allow Notifications" */}
<Text style={styles.allowBtnText}>Yes, remind me</Text>
```

```tsx
{/* Skip — was "Maybe later" */}
<Text style={styles.skipBtnText}>Not now</Text>
```

- [ ] **Step 2: Fix the gradient to match celestial palette**

The `NotificationScreen` inherits a warm gradient from the parent `OnboardingScreen`. The fix is in the parent — but since the gradient is per-screen, we need to check how `onboardingGradients` works in `ThemeContext`. If the notification screen (index 5) has a warm gradient, update it.

Check `src/context/ThemeContext.tsx` for the gradient array and ensure screen index 5 uses:
```tsx
['#07111E', '#0C1A2E', '#0F1F30']
```
instead of warm red-brown tones.

- [ ] **Step 3: Commit**

```bash
git add src/components/onboarding/NotificationScreen.tsx src/context/ThemeContext.tsx
git commit -m "style(onboarding): reframe notification screen copy and fix gradient"
```

---

### Task 3: CheckInBanner Copy Update

**Files:**
- Modify: `src/components/home/CheckInBanner.tsx`

- [ ] **Step 1: Update banner text**

In `CheckInBanner.tsx` line 29, replace:

```tsx
// Old:
You haven't checked in today — how is your heart?

// New:
Your heart has a story today — take a moment
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/CheckInBanner.tsx
git commit -m "style(home): update check-in banner copy for warmer tone"
```

---

### Task 4: HomeScreen Typography & Header Case

**Files:**
- Modify: `src/screens/HomeScreen.tsx`
- Modify: `src/components/home/MoodButton.tsx`

- [ ] **Step 1: Change mood section header to title case**

In `HomeScreen.tsx` around line 422, replace:

```tsx
// Old:
<Text style={styles.sectionHeaderTitle}>HOW IS YOUR HEART?</Text>

// New:
<Text style={styles.sectionHeaderTitle}>How Is Your Heart?</Text>
```

- [ ] **Step 2: Reduce section header letter spacing**

Find the `sectionHeaderTitle` style in `HomeScreen.tsx` styles and change `letterSpacing` from `3` (or whatever it currently is) to `1.5`:

```tsx
sectionHeaderTitle: {
  fontSize: 13,
  color: '#F0E6D3',
  letterSpacing: 1.5, // was 3 — whisper, don't shout
  fontWeight: '700',
},
```

- [ ] **Step 3: Update MoodButton sublabel to serif**

In `MoodButton.tsx`, find the `moodSublabel` style (around line 142) and add serif font + italic:

```tsx
moodSublabel: {
  fontSize: 11,
  fontWeight: '500',
  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  fontStyle: 'italic',
},
```

Add `Platform` to the imports if not already there:
```tsx
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/HomeScreen.tsx src/components/home/MoodButton.tsx
git commit -m "style(home): title-case header, reduce letter-spacing, serif mood sublabels"
```

---

### Task 5: Verse Translation Serif Font

**Files:**
- Modify: `src/components/VerseLayer.tsx`

- [ ] **Step 1: Update translation text style to serif**

In `VerseLayer.tsx`, find the `translation` and `translationPrimary` styles in the StyleSheet and add serif font:

```tsx
translation: {
  // ... existing styles
  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
},
translationPrimary: {
  // ... existing styles  
  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
},
```

Ensure `Platform` is imported (it should be already from `react-native`).

- [ ] **Step 2: Commit**

```bash
git add src/components/VerseLayer.tsx
git commit -m "style(guidance): use serif font for verse translations"
```

---

### Task 6: MoodSelectionScreen Reassurance Copy

**Files:**
- Modify: `src/screens/MoodSelectionScreen.tsx`

- [ ] **Step 1: Add reassurance line below subtitle**

In `MoodSelectionScreen.tsx`, find the `headerSub` text (around line 253) and add a reassurance line after it:

```tsx
<Text style={styles.headerSub}>
  Every emotion has divine guidance waiting.{'\n'}
  Choose how you feel right now.
</Text>
<Text style={styles.headerReassurance}>
  There's no wrong answer. Just be honest.
</Text>
```

- [ ] **Step 2: Add the style**

```tsx
headerReassurance: {
  fontSize: 13,
  color: 'rgba(245, 237, 227, 0.35)',
  textAlign: 'center',
  marginTop: 4,
  letterSpacing: 0.2,
},
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/MoodSelectionScreen.tsx
git commit -m "style(mood): add reassurance copy to mood selection screen"
```

---

## TIER 2: MEDIUM EFFORT

---

### Task 7: Time-Based Mood Mapping Utility

**Files:**
- Create: `src/utils/moodTimeMapping.ts`

- [ ] **Step 1: Create the utility**

```tsx
import { Mood } from '../types';

interface MoodTimeConfig {
  startHour: number;
  endHour: number;
  moods: Mood[];
}

const TIME_MOOD_MAP: MoodTimeConfig[] = [
  { startHour: 23, endHour: 4, moods: ['Lonely', 'Overwhelmed', 'Tired', 'Sad'] },
  { startHour: 4, endHour: 7, moods: ['Grateful', 'Hopeful', 'Calm', 'Tired'] },
  { startHour: 7, endHour: 17, moods: ['Grateful', 'Hopeful', 'Calm', 'Overwhelmed'] },
  { startHour: 17, endHour: 23, moods: ['Calm', 'Tired', 'Sad', 'Lonely'] },
];

export function getMoodsForTime(hour?: number): Mood[] {
  const h = hour ?? new Date().getHours();

  for (const config of TIME_MOOD_MAP) {
    if (config.startHour > config.endHour) {
      // Wraps midnight (e.g. 23-4)
      if (h >= config.startHour || h < config.endHour) return config.moods;
    } else {
      if (h >= config.startHour && h < config.endHour) return config.moods;
    }
  }

  // Fallback
  return ['Grateful', 'Hopeful', 'Calm', 'Overwhelmed'];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/moodTimeMapping.ts
git commit -m "feat(utils): add time-based mood mapping utility"
```

---

### Task 8: Smart Mood Grid Component

**Files:**
- Create: `src/components/home/SmartMoodGrid.tsx`

- [ ] **Step 1: Create the SmartMoodGrid component**

```tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mood } from '../../types';
import { Colors } from '../../theme/DesignSystem';
import { getMoodsForTime } from '../../utils/moodTimeMapping';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2;

interface MoodConfig {
  id: Mood;
  label: string;
  sublabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
}

interface SmartMoodGridProps {
  moodConfigs: MoodConfig[];
  selectedMood: Mood | null;
  checkedInToday: boolean;
  onMoodPress: (mood: Mood) => void;
}

function SmartMoodCard({
  mood,
  isChecked,
  onPress,
  index,
}: {
  mood: MoodConfig;
  isChecked: boolean;
  onPress: () => void;
  index: number;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 80),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isChecked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isChecked]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.92, friction: 3, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[
          styles.card,
          {
            backgroundColor: mood.bgColor,
            borderColor: isChecked ? mood.color + '60' : mood.borderColor,
          },
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: 16, backgroundColor: mood.color, opacity: glowOpacity },
          ]}
        />
        <View style={styles.cardRow}>
          <View style={[styles.iconCircle, { backgroundColor: mood.color + '16', borderColor: mood.color + '30' }]}>
            <Ionicons name={mood.iconName as any} size={20} color={mood.color} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardLabel, { color: mood.color }]}>
              {mood.label.charAt(0) + mood.label.slice(1).toLowerCase()}
            </Text>
            <Text
              style={[
                styles.cardSublabel,
                { color: mood.color, opacity: isChecked ? 0.75 : 0.45 },
              ]}
            >
              {mood.sublabel}
            </Text>
          </View>
        </View>
        {isChecked && (
          <View style={[styles.checkedBadge, { backgroundColor: mood.color }]}>
            <Ionicons name="checkmark" size={8} color={mood.bgColor} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function SmartMoodGrid({ moodConfigs, selectedMood, checkedInToday, onMoodPress }: SmartMoodGridProps) {
  const [expanded, setExpanded] = useState(false);
  const timeMoods = getMoodsForTime();

  const visibleMoods = expanded
    ? moodConfigs
    : moodConfigs.filter((m) => timeMoods.includes(m.id));

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(300, 'easeInEaseOut', 'opacity'));
    setExpanded(!expanded);
  };

  return (
    <View>
      <View style={styles.grid}>
        {visibleMoods.map((mood, idx) => (
          <SmartMoodCard
            key={mood.id}
            mood={mood}
            isChecked={selectedMood === mood.id}
            onPress={() => onMoodPress(mood.id)}
            index={idx}
          />
        ))}
      </View>
      <TouchableOpacity onPress={toggleExpand} style={styles.expandBtn}>
        <Text style={styles.expandText}>
          {expanded ? 'Show less' : 'See all 8'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color="#8BA4BF"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    minHeight: 80,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardSublabel: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    marginTop: 2,
  },
  checkedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  expandText: {
    fontSize: 13,
    color: '#8BA4BF',
    letterSpacing: 0.3,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/SmartMoodGrid.tsx
git commit -m "feat(home): add SmartMoodGrid component with time-aware 2x2 layout"
```

---

### Task 9: Integrate SmartMoodGrid into HomeScreen

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Import SmartMoodGrid**

Add at top of `HomeScreen.tsx`:

```tsx
import { SmartMoodGrid } from '../components/home/SmartMoodGrid';
```

- [ ] **Step 2: Replace the mood grid section**

Find the `{/* Mood Grid */}` section (around lines 448-459) and replace:

```tsx
{/* Old Mood Grid — remove this */}
<View style={styles.moodGrid}>
  {moodConfigs.map((mood, idx) => (
    <MoodButton
      key={mood.id}
      mood={mood}
      isChecked={localSelectedMood === mood.id}
      isRecentlySelected={!checkedInToday && lastCheckin?.moodId === mood.id}
      onPress={() => handleMoodTap(mood.id)}
      animDelay={idx * 60}
    />
  ))}
</View>
```

Replace with:

```tsx
<SmartMoodGrid
  moodConfigs={moodConfigs}
  selectedMood={localSelectedMood}
  checkedInToday={checkedInToday}
  onMoodPress={handleMoodTap}
/>
```

- [ ] **Step 3: Verify on device**

Check the homescreen. Should show 4 moods in a 2x2 grid with horizontal labels. "See all 8" should expand to show all moods. Verify the moods shown change based on time of day.

- [ ] **Step 4: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat(home): replace mood strip with SmartMoodGrid"
```

---

### Task 10: Staged Verse Revelation Animation

**Files:**
- Modify: `src/components/VerseLayer.tsx`

- [ ] **Step 1: Add revelation animation state and refs**

Inside the `VerseLayer` component, before the `return`, add:

```tsx
// Staged revelation animations
const arabicOpacity = useRef(new Animated.Value(0)).current;
const arabicSlide = useRef(new Animated.Value(15)).current;
const dividerOpacity = useRef(new Animated.Value(0)).current;
const transOpacity = useRef(new Animated.Value(0)).current;
const transSlide = useRef(new Animated.Value(10)).current;
const refOpacity = useRef(new Animated.Value(0)).current;
const [revealComplete, setRevealComplete] = useState(false);

useEffect(() => {
  // Reset on new verse
  arabicOpacity.setValue(0);
  arabicSlide.setValue(15);
  dividerOpacity.setValue(0);
  transOpacity.setValue(0);
  transSlide.setValue(10);
  refOpacity.setValue(0);
  setRevealComplete(false);

  const sequence = Animated.sequence([
    Animated.delay(100),
    // Arabic text
    Animated.parallel([
      Animated.timing(arabicOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(arabicSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]),
    // Pause
    Animated.delay(400),
    // Divider/ornament
    Animated.timing(dividerOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    // Translation
    Animated.parallel([
      Animated.timing(transOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(transSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]),
    // Reference
    Animated.timing(refOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
  ]);

  // Fire haptic at start
  setTimeout(() => {
    HapticsService.impactAsync('LIGHT');
  }, 100);

  sequence.start(() => setRevealComplete(true));

  return () => sequence.stop();
}, [arabic, translation]);

// Skip animation on tap
const skipReveal = () => {
  if (revealComplete) return;
  arabicOpacity.setValue(1);
  arabicSlide.setValue(0);
  dividerOpacity.setValue(0);
  dividerOpacity.setValue(1);
  transOpacity.setValue(1);
  transSlide.setValue(0);
  refOpacity.setValue(1);
  setRevealComplete(true);
};
```

- [ ] **Step 2: Wrap verse content elements with animated opacity/transform**

In the render, wrap the existing Arabic, divider, translation, and reference sections. For the Arabic-primary branch (the first `<>` block inside `isArabicPrimary ? (...)`):

```tsx
{isArabicPrimary ? (
  <>
    <Animated.View style={{ opacity: arabicOpacity, transform: [{ translateY: arabicSlide }] }}>
      <ArabicText text={arabic} style={isLongArabic ? styles.arabicCompact : styles.arabic} />
    </Animated.View>

    {showTransliteration && transliteration ? (
      <Animated.View style={{ opacity: transOpacity }}>
        <Text style={styles.transliteration}>{transliteration}</Text>
      </Animated.View>
    ) : null}

    <Animated.View style={{ opacity: dividerOpacity }}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <View style={styles.dividerDiamond} />
        <View style={styles.dividerLine} />
      </View>
    </Animated.View>

    <Animated.View style={{ opacity: transOpacity, transform: [{ translateY: transSlide }] }}>
      <Text style={[styles.translation, isLongTranslation && styles.translationCompact]}>
        {formattedTranslation}
      </Text>
    </Animated.View>
  </>
) : (
  // Apply the same pattern to the english-primary branch
  <>
    <Animated.View style={{ opacity: transOpacity, transform: [{ translateY: transSlide }] }}>
      <Text style={[styles.translationPrimary, isLongTranslation && styles.translationPrimaryCompact]}>
        {formattedTranslation}
      </Text>
    </Animated.View>

    <Animated.View style={{ opacity: dividerOpacity }}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <View style={styles.dividerDiamond} />
        <View style={styles.dividerLine} />
      </View>
    </Animated.View>

    <Animated.View style={{ opacity: arabicOpacity, transform: [{ translateY: arabicSlide }] }}>
      <ArabicText text={arabic} style={isLongArabic ? styles.arabicSecondaryCompact : styles.arabicSecondary} />
    </Animated.View>

    {showTransliteration && transliteration ? (
      <Animated.View style={{ opacity: transOpacity }}>
        <Text style={styles.transliteration}>{transliteration}</Text>
      </Animated.View>
    ) : null}
  </>
)}
```

Also wrap the reference section (the `referenceTop` view at the top) with `refOpacity`:

```tsx
<Animated.View style={{ opacity: refOpacity }}>
  <View style={styles.referenceTop}>
    {/* ... existing reference content ... */}
  </View>
</Animated.View>
```

- [ ] **Step 3: Add tap-to-skip on the scroll view**

Add `onTouchEnd={skipReveal}` to the `Animated.ScrollView`:

```tsx
<Animated.ScrollView
  style={styles.scrollView}
  contentContainerStyle={styles.scrollContent}
  showsVerticalScrollIndicator={false}
  scrollEventThrottle={16}
  onTouchEnd={skipReveal}
  // ... existing onScroll prop
>
```

- [ ] **Step 4: Add `useState` to imports if not present**

Ensure `useState` is in the import from React (it should already be there).

- [ ] **Step 5: Test the animation**

Navigate to a guidance verse. Arabic text should fade in first, then pause, then ornament, then translation, then reference. Tapping should complete instantly.

- [ ] **Step 6: Commit**

```bash
git add src/components/VerseLayer.tsx
git commit -m "feat(guidance): add staged verse revelation animation with haptic feedback"
```

---

### Task 11: Time-Aware Greetings

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Update getGreeting function**

Replace the existing `getGreeting()` function (around line 77) with:

```tsx
function getGreeting(streakDays?: number, lastOpenDate?: string | null): string {
  const h = new Date().getHours();

  // Absence recognition (3+ days since last open)
  if (lastOpenDate) {
    const daysSince = Math.floor((Date.now() - new Date(lastOpenDate).getTime()) / 86400000);
    if (daysSince >= 3) return 'Welcome back. This door is always open.';
  }

  // Streak recognition (7+ days)
  if (streakDays && streakDays >= 7) return `${streakDays} days of showing up for your soul`;

  // Time-based
  if (h >= 0 && h < 4) return 'You\'re awake. Allah is with you.';
  if (h < 5) return 'Peace be upon you';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}
```

- [ ] **Step 2: Track last open date**

In the `useEffect` that runs on mount (the `loadAllData` one, around line 183), add at the start:

```tsx
// Track last open for absence-aware greeting
const lastOpen = await AsyncStorage.getItem('@noor_last_open');
setLastOpenDate(lastOpen);
await AsyncStorage.setItem('@noor_last_open', new Date().toISOString());
```

Add state:
```tsx
const [lastOpenDate, setLastOpenDate] = useState<string | null>(null);
```

- [ ] **Step 3: Pass data to getGreeting**

Find where `getGreeting()` is called (likely in `HeroHeader` or the greeting text render) and update to:

```tsx
getGreeting(streakDays, lastOpenDate)
```

If `HeroHeader` is a separate component that receives a greeting string as prop, update the prop value passed to it.

- [ ] **Step 4: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat(home): add time-aware and streak-aware greetings"
```

---

### Task 12: Delayed Continue Button on FirstGuidanceScreen

**Files:**
- Modify: `src/components/onboarding/FirstGuidanceScreen.tsx`

- [ ] **Step 1: Add delayed CTA animation**

Inside the `FirstGuidanceScreen` component, add:

```tsx
const ctaOpacity = useRef(new Animated.Value(0)).current;
const chipOpacity = useRef(new Animated.Value(0)).current;

useEffect(() => {
  if (!isActive) return;

  // Chip fades in after 3s
  const chipTimer = setTimeout(() => {
    Animated.timing(chipOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
  }, 3000);

  // CTA fades in after 4s
  const ctaTimer = setTimeout(() => {
    Animated.timing(ctaOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
  }, 4000);

  return () => {
    clearTimeout(chipTimer);
    clearTimeout(ctaTimer);
  };
}, [isActive]);

// Tap verse area to show CTA immediately
const forceShowCta = () => {
  ctaOpacity.setValue(1);
  chipOpacity.setValue(1);
};
```

- [ ] **Step 2: Apply opacity to bottom section**

Replace the bottom section (around line 155-175):

```tsx
<View style={styles.bottomSection}>
  {/* Journey text — no container, floating */}
  <Animated.Text style={[styles.journeyWhisper, { opacity: chipOpacity }]}>
    ✦  Your journey has already begun
  </Animated.Text>

  {/* CTA — delayed */}
  <Animated.View style={[styles.ctaWrap, { opacity: ctaOpacity }]}>
    <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={onNext}>
      <LinearGradient
        colors={[Colors.accent.primary, Colors.accent.primary]}
        style={styles.ctaBtnGradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <Text style={styles.ctaText}>Continue</Text>
      </LinearGradient>
    </TouchableOpacity>
  </Animated.View>
</View>
```

- [ ] **Step 3: Add journeyWhisper style and remove old chip style usage**

```tsx
journeyWhisper: {
  fontSize: 13,
  color: Colors.accent.primary,
  opacity: 0.6,
  textAlign: 'center',
  letterSpacing: 0.5,
  marginBottom: 14,
  textShadowColor: 'rgba(212, 175, 55, 0.3)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 8,
},
```

- [ ] **Step 4: Add tap-to-reveal on content area**

Wrap the `contentArea` View with a `TouchableOpacity` (or add `onTouchEnd`):

```tsx
<View style={styles.contentArea} onTouchEnd={forceShowCta}>
```

Note: `View` supports `onTouchEnd` on React Native.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/FirstGuidanceScreen.tsx
git commit -m "feat(onboarding): delay CTA on guidance screen, floating journey text"
```

---

### Task 13: Mood Selection Transition

**Files:**
- Modify: `src/screens/MoodSelectionScreen.tsx`

- [ ] **Step 1: Add transition animation state**

Inside `MoodSelectionScreen`, add:

```tsx
const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
const cardAnims = useRef(MOODS.map(() => ({
  scale: new Animated.Value(1),
  opacity: new Animated.Value(1),
}))).current;
const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
```

- [ ] **Step 2: Update handleMoodSelect with transition**

Replace the `handleMoodSelect` function:

```tsx
const handleMoodSelect = (mood: (typeof MOODS)[0], index: number) => {
  // Cancel any in-progress transition
  if (transitionTimeout.current) {
    clearTimeout(transitionTimeout.current);
    cardAnims.forEach((a) => {
      a.scale.setValue(1);
      a.opacity.setValue(1);
    });
  }

  setSelectedIndex(index);

  // Selected card scales up
  Animated.spring(cardAnims[index].scale, {
    toValue: 1.05,
    friction: 8,
    tension: 100,
    useNativeDriver: true,
  }).start();

  // Others fade out
  cardAnims.forEach((a, i) => {
    if (i !== index) {
      Animated.parallel([
        Animated.timing(a.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(a.scale, { toValue: 0.95, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  });

  // Navigate after delay
  transitionTimeout.current = setTimeout(() => {
    navigation.navigate('Guidance', { mood: mood.key });
    // Reset after navigation
    setTimeout(() => {
      setSelectedIndex(null);
      cardAnims.forEach((a) => {
        a.scale.setValue(1);
        a.opacity.setValue(1);
      });
    }, 500);
  }, 800);
};
```

- [ ] **Step 3: Pass animations to MoodCard**

Update the `MoodCard` render to apply the animations:

```tsx
{MOODS.map((mood, i) => (
  <Animated.View
    key={mood.key}
    style={{
      opacity: cardAnims[i].opacity,
      transform: [{ scale: cardAnims[i].scale }],
    }}
  >
    <MoodCard
      mood={mood}
      index={i}
      onPress={() => handleMoodSelect(mood, i)}
    />
  </Animated.View>
))}
```

Remove the `Animated.View` wrapper from inside `MoodCard` itself to avoid double-wrapping (the `MoodCard` component already has its own entry animation — keep that, but the parent `Animated.View` handles the exit transition).

- [ ] **Step 4: Cleanup on unmount**

Add cleanup:
```tsx
useEffect(() => {
  return () => {
    if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
  };
}, []);
```

- [ ] **Step 5: Commit**

```bash
git add src/screens/MoodSelectionScreen.tsx
git commit -m "feat(mood): add intentional mood selection transition with fade-out"
```

---

## TIER 3: HEAVY LIFT

---

### Task 14: Install React Native Reanimated

**Files:**
- Modify: `babel.config.js`
- Modify: `package.json` (via npx expo install)

- [ ] **Step 1: Install the package**

```bash
npx expo install react-native-reanimated
```

- [ ] **Step 2: Add babel plugin**

In `babel.config.js`, add `react-native-reanimated/plugin` as the **last** plugin:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ... any existing plugins
      'react-native-reanimated/plugin',
    ],
  };
};
```

- [ ] **Step 3: Clear cache and verify build**

```bash
npx expo start --clear
```

Verify the app launches without errors.

- [ ] **Step 4: Commit**

```bash
git add package.json babel.config.js yarn.lock
git commit -m "deps: install react-native-reanimated with babel plugin"
```

---

### Task 15: Reanimated Shared Hooks

**Files:**
- Create: `src/hooks/useSpringPress.ts`

- [ ] **Step 1: Create useSpringPress hook**

```tsx
import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export function useSpringPress(pressScale = 0.92) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(pressScale, { damping: 12, stiffness: 200 });
  }, [pressScale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, []);

  return { animatedStyle, onPressIn, onPressOut };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useSpringPress.ts
git commit -m "feat(hooks): add reanimated useSpringPress hook"
```

---

### Task 16: Golden Ascending Particles Component

**Files:**
- Create: `src/components/GoldenMotes.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const PARTICLE_COUNT = 6;

function Mote({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(height * 0.8)).current;
  const translateX = useRef(new Animated.Value(width * (0.2 + Math.random() * 0.6))).current;

  useEffect(() => {
    const animate = () => {
      // Reset position
      translateY.setValue(height * 0.8);
      translateX.setValue(width * (0.2 + Math.random() * 0.6));

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          // Float up
          Animated.timing(translateY, {
            toValue: height * 0.05,
            duration: 8000,
            useNativeDriver: true,
          }),
          // Fade in, hold, fade out
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
            Animated.delay(5000),
            Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => animate());
    };

    animate();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.mote,
        {
          opacity,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    />
  );
}

export function GoldenMotes() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Mote key={i} delay={i * 1200} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mote: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D4AF37',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GoldenMotes.tsx
git commit -m "feat(ambient): add GoldenMotes ascending particles component"
```

---

### Task 17: Integrate Golden Motes into GuidanceScreen

**Files:**
- Modify: `src/screens/GuidanceScreen.tsx`
- Modify: `src/components/onboarding/FirstGuidanceScreen.tsx`

- [ ] **Step 1: Add GoldenMotes to GuidanceScreen**

In `GuidanceScreen.tsx`, import and render behind content:

```tsx
import { GoldenMotes } from '../components/GoldenMotes';
```

Inside the render, add right after `ImmersiveBackground`:

```tsx
<ImmersiveBackground ... />
<GoldenMotes />
```

- [ ] **Step 2: Add GoldenMotes to FirstGuidanceScreen**

In `FirstGuidanceScreen.tsx`, import and render:

```tsx
import { GoldenMotes } from '../GoldenMotes';
```

Add inside the container, after the mandala views:

```tsx
<GoldenMotes />
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/GuidanceScreen.tsx src/components/onboarding/FirstGuidanceScreen.tsx
git commit -m "feat(ambient): add golden ascending motes to guidance screens"
```

---

### Task 18: Breathing Mandala Glow on Welcome Screen

**Files:**
- Modify: `src/components/onboarding/WelcomeScreen.tsx`

- [ ] **Step 1: Add breathing glow behind icon ring**

Inside `WelcomeScreen`, add a new animated value:

```tsx
const glowAnim = useRef(new Animated.Value(0.08)).current;

useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(glowAnim, { toValue: 0.2, duration: 3000, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.08, duration: 3000, useNativeDriver: true }),
    ])
  ).start();
}, []);
```

- [ ] **Step 2: Render the glow view behind the icon ring**

Inside the `heroWrap` View, add before the icon ring `Animated.View`:

```tsx
<View style={styles.heroWrap}>
  {/* Breathing gold glow */}
  <Animated.View
    style={[styles.breathingGlow, { opacity: glowAnim }]}
    pointerEvents="none"
  />

  {/* Sparkle icon in gold circle */}
  <Animated.View style={[styles.iconRing, s[0]]}>
    <SparklesIcon size={30} color={Colors.accent.primary} />
  </Animated.View>
</View>
```

- [ ] **Step 3: Add the style**

```tsx
breathingGlow: {
  position: 'absolute',
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: Colors.accent.primary,
},
```

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding/WelcomeScreen.tsx
git commit -m "feat(onboarding): add breathing mandala glow on welcome screen"
```

---

### Task 19: Parallax Star Drift

**Files:**
- Modify: `src/components/onboarding/InteractiveStarfield.tsx`

- [ ] **Step 1: Read the current InteractiveStarfield implementation**

Understand the current structure — it renders stars at fixed positions with touch-reactive displacement.

- [ ] **Step 2: Add autonomous drift**

Add a `useEffect` with `requestAnimationFrame` loop that updates star positions based on depth:

```tsx
// Inside the component, add drift offsets
const driftOffsets = useRef(positions.map(() => ({ x: 0, y: 0 }))).current;
const lastFrameTime = useRef(Date.now()).current;

useEffect(() => {
  let animFrame: number;

  const drift = () => {
    const now = Date.now();
    const dt = (now - lastFrameTime) / 1000;
    // Update ref to avoid stale closure
    (lastFrameTime as any) = now;

    positions.forEach((pos, i) => {
      const size = pos.s || pos.size || 2;
      // Speed based on size: smaller stars drift slower (parallax)
      const speed = size < 2 ? 0.3 : size < 2.5 ? 0.5 : 0.8;
      driftOffsets[i].x += speed * dt * 0.5; // slow diagonal drift
      driftOffsets[i].y += speed * dt * 0.3;

      // Wrap around
      if (driftOffsets[i].x > 20) driftOffsets[i].x = -20;
      if (driftOffsets[i].y > 15) driftOffsets[i].y = -15;
    });

    animFrame = requestAnimationFrame(drift);
  };

  animFrame = requestAnimationFrame(drift);
  return () => cancelAnimationFrame(animFrame);
}, []);
```

Then apply the drift offset to each star's position in the render. The exact integration depends on how stars are currently rendered — if they use `Animated.Value` for position, add the drift offset to the animated value. If they use inline styles, convert to use animated values that combine touch displacement + drift.

- [ ] **Step 3: Test**

Watch the onboarding screens — stars should slowly drift diagonally in addition to responding to touch.

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding/InteractiveStarfield.tsx
git commit -m "feat(onboarding): add parallax star drift to InteractiveStarfield"
```

---

### Task 20: Reflection Prompt Component

**Files:**
- Create: `src/components/ReflectionPrompt.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Typography } from '../theme/DesignSystem';

const { height } = Dimensions.get('window');

interface ReflectionPromptProps {
  visible: boolean;
  onSave: (text: string) => void;
  onSkip: () => void;
}

export function ReflectionPrompt({ visible, onSave, onSkip }: ReflectionPromptProps) {
  const [text, setText] = useState('');
  const slideAnim = useRef(new Animated.Value(height * 0.4)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim());
    } else {
      onSkip();
    }
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onSkip} activeOpacity={1} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <Text style={styles.prompt}>What did this verse stir in you?</Text>
          <TextInput
            style={styles.input}
            placeholder="A word, a feeling, a prayer..."
            placeholderTextColor="rgba(245, 237, 227, 0.3)"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={280}
            autoFocus
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveText}>Save to Journal</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  prompt: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 18,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 235, 210, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 210, 0.08)',
    padding: 16,
    color: Colors.text.primary,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  skipBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipText: {
    color: Colors.text.muted,
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: Colors.accent.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  saveText: {
    color: '#14100C',
    fontSize: 15,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ReflectionPrompt.tsx
git commit -m "feat(guidance): add ReflectionPrompt bottom sheet component"
```

---

### Task 21: Integrate ReflectionPrompt into GuidanceScreen

**Files:**
- Modify: `src/screens/GuidanceScreen.tsx`

- [ ] **Step 1: Import and add state**

```tsx
import { ReflectionPrompt } from '../components/ReflectionPrompt';
```

Inside the component:
```tsx
const [showReflection, setShowReflection] = useState(false);
const hasShownReflection = useRef(false);
```

- [ ] **Step 2: Intercept back navigation**

Add before the return:

```tsx
useEffect(() => {
  const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
    if (hasShownReflection.current) return; // Already shown, let navigation proceed

    e.preventDefault();
    hasShownReflection.current = true;
    setShowReflection(true);
  });

  return unsubscribe;
}, [navigation]);

const handleReflectionSave = async (text: string) => {
  await onSaveReflection(text);
  setShowReflection(false);
  navigation.dispatch(navigation.getState().routes.length > 1
    ? { type: 'GO_BACK' }
    : { type: 'GO_BACK' }
  );
};

const handleReflectionSkip = () => {
  setShowReflection(false);
  navigation.goBack();
};
```

Note: The `beforeRemove` listener prevents the default back action once, shows the reflection prompt, then on save/skip calls `navigation.goBack()` which will go through because `hasShownReflection` is now true.

- [ ] **Step 3: Render the component**

At the end of the render, before the closing `</>`  or after `ShareSheet`:

```tsx
<ReflectionPrompt
  visible={showReflection}
  onSave={handleReflectionSave}
  onSkip={handleReflectionSkip}
/>
```

- [ ] **Step 4: Test**

Navigate to a guidance verse, press back. The reflection prompt should appear. Test both "Save to Journal" and "Skip" paths.

- [ ] **Step 5: Commit**

```bash
git add src/screens/GuidanceScreen.tsx
git commit -m "feat(guidance): integrate reflection prompt on back navigation"
```

---

### Task 22: Final Verification

- [ ] **Step 1: Full flow test**

Run the app and test the complete flow:
1. Onboarding: Welcome screen (check breathing glow, chip text, skip opacity)
2. Heart check-in: Select a mood
3. First guidance: Verify delayed CTA, floating journey text, golden motes
4. Notification screen: Verify new copy and celestial gradient
5. HomeScreen: Verify smart mood grid (2x2), title-case header, time-aware greeting
6. Tap a mood: Verify navigation to guidance
7. Guidance screen: Verify staged verse revelation, golden motes, serif translation
8. Press back: Verify reflection prompt appears
9. MoodSelectionScreen (via "See all"): Verify reassurance text, selection transition

- [ ] **Step 2: Commit any final fixes**

```bash
git add -A
git commit -m "fix: final polish and verification for UX immersion improvements"
```
