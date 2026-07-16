# "For Your Heart" Reflection Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give "For Your Heart" a distinct, user-facing voice going forward, and wire the already-built-but-unused reflection save pipeline into a writable prompt inside that card.

**Architecture:** Extend `ContextLayer`'s existing `heartCard` with a "Reflect" sub-section (prompt + `TextInput` + Save button) instead of adding a new card. Wire it to `useGuidanceLogic`'s existing `reflectionText` state (removing the two pieces of dead code it was tangled with) through a new `saveReflection()` action, which calls `GuidanceScreen`'s existing `onSaveReflection` → `RotationEngine.saveReflection` → `saved_reflections` pipeline unchanged. Add `KeyboardAvoidingView` + `keyboardShouldPersistTaps` matching the app's existing `ReflectionLayer.tsx` pattern, and suppress the swipe-to-next-verse gesture while the reflection input is focused, to close the data-loss risk found during the spec audit.

**Tech Stack:** React Native (Expo), TypeScript, Jest + `@testing-library/react-native` (hook tests). No new dependencies.

Spec: `docs/superpowers/specs/2026-07-16-for-your-heart-reflection-design.md`

---

### Task 1: CLAUDE.md — "For Your Heart" content voice rule

**Files:**
- Modify: `CLAUDE.md`

Standalone documentation change — no code dependency, safe to land first.

- [ ] **Step 1: Add the voice rule after the Quoting Quran Text section**

Find:
```markdown
5. **Places with verse content, so far:** `src/data/quranData.ts` (already
   sourced from the Quran.com API — the standard to match), and the three
   files above. `hadithService.ts`, `quranService.ts`, `contentRepository.ts`,
   and `sunnahEnricher.ts` also carry Quran/hadith text and have not yet been
   audited against these rules — check them the next time you're in that area.

---

## Feel & Motion — Premium Interaction Vocabulary
```
Replace:
```markdown
5. **Places with verse content, so far:** `src/data/quranData.ts` (already
   sourced from the Quran.com API — the standard to match), and the three
   files above. `hadithService.ts`, `quranService.ts`, `contentRepository.ts`,
   and `sunnahEnricher.ts` also carry Quran/hadith text and have not yet been
   audited against these rules — check them the next time you're in that area.

---

## "For Your Heart" — Content Voice

The Context layer's "For Your Heart" card (`ContextLayer.tsx`'s `heartCard`,
fed by `ContentAngle.angle`) has a distinct job from the "Understand"/
"Matters" sections just above it. Those sections carry the Prophet/companion
story and scholarly explanation (`Content.whyThis`) — "For Your Heart" is
not a second helping of the same voice.

For any **new or edited** `angle` entry (existing entries in `quranData.ts`
are not being retroactively rewritten — see
`docs/superpowers/specs/2026-07-16-for-your-heart-reflection-design.md`):

- Second person, present tense. Speak to the reader directly as a believer,
  not about a Prophet or companion's situation.
- Anchor it in a Divine Name or a promise/address verse to Allah's slaves
  (e.g. 39:53's "O My servants who have transgressed against yourselves, do
  not despair of the mercy of Allah") rather than narrating what happened
  historically.
- If a Prophet/companion story is genuinely the best vehicle for the point,
  it belongs in `Content.whyThis` (the Context layer's own narrative
  section), not here.

Example of the shift:
- Before (tafsir/narrative voice): *"Ibn Kathir explains that 'ni'ma
  al-Mawla wa ni'ma al-Nasir' means Allah is the best of those who
  protect... The Prophet ﷺ said on the day of Uhud: 'Allah is sufficient
  for us...'"*
- After (direct-address voice): *"You are not managing this alone. The One
  who holds the heavens is holding your worry too — He calls Himself your
  Protector, not your bystander."*

---

## Feel & Motion — Premium Interaction Vocabulary
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add For Your Heart content voice rule"
```

---

### Task 2: `useGuidanceLogic.ts` — reflection save action (TDD)

**Files:**
- Modify: `src/hooks/useGuidanceLogic.ts`
- Test: `src/hooks/__tests__/useGuidanceLogic.test.ts`

Removes the two pieces of dead code entangled with reflection state
(`showReflectionInput`/`setShowReflectionInput` — a tap-to-reveal pattern
not being used; `handlePrimaryAction` — the old save-then-advance-together
path, since save and advance are now decoupled), and adds a `reflectionStatus`
derivation + `saveReflection()` action. Other pre-existing dead exports
(`onScroll`, `activeIndex`, `nextButtonScale`, `nextButtonOpacity`,
`scrollViewRef`, the hook's own `isPremium`) are unused by `GuidanceScreen`
today too, but predate this feature and are deliberately left alone —
out of scope here.

- [ ] **Step 1: Write the failing tests**

Append to the end of `src/hooks/__tests__/useGuidanceLogic.test.ts` (after
the existing `describe('useGuidanceLogic — refresh gating', ...)` block's
closing `});`):

```typescript
describe('useGuidanceLogic — reflections', () => {
  const baseExperience: any = {
    content: { id: 'c1', source: '', arabicText: '', englishTranslation: '' },
    angle: { id: 'a1' },
  };

  const renderReflections = (experience: any, onSaveReflection: jest.Mock) =>
    renderHook(
      ({ exp }) => useGuidanceLogic(exp, 'Calm', jest.fn(), onSaveReflection, 1),
      { initialProps: { exp: experience } },
    );

  beforeEach(() => {
    jest.clearAllMocks();
    const freemium = require('../../services/freemiumService').FreemiumService.getInstance();
    freemium.getRemainingRefreshes.mockReturnValue(3);
  });

  it('starts empty with no reflection text', () => {
    const { result } = renderReflections(baseExperience, jest.fn());
    expect(result.current.reflectionStatus).toBe('empty');
  });

  it('marks status dirty once text is typed', () => {
    const { result } = renderReflections(baseExperience, jest.fn());

    act(() => {
      result.current.setReflectionText('This means a lot to me');
    });

    expect(result.current.reflectionStatus).toBe('dirty');
  });

  it('does nothing when saveReflection is called with empty text', async () => {
    const onSaveReflection = jest.fn(() => Promise.resolve(true));
    const { result } = renderReflections(baseExperience, onSaveReflection);

    await act(async () => {
      await result.current.saveReflection();
    });

    expect(onSaveReflection).not.toHaveBeenCalled();
    expect(result.current.reflectionStatus).toBe('empty');
  });

  it('saveReflection commits text and marks status saved', async () => {
    const onSaveReflection = jest.fn(() => Promise.resolve(true));
    const { result } = renderReflections(baseExperience, onSaveReflection);

    act(() => {
      result.current.setReflectionText('A private reflection');
    });

    await act(async () => {
      await result.current.saveReflection();
    });

    expect(onSaveReflection).toHaveBeenCalledWith('A private reflection');
    expect(result.current.reflectionStatus).toBe('saved');

    const { HapticsService } = require('../../services/hapticsService');
    expect(HapticsService.notificationAsync).toHaveBeenCalledWith('SUCCESS');
  });

  it('reverts to dirty and fires a WARNING haptic when the save fails', async () => {
    const onSaveReflection = jest.fn(() => Promise.resolve(false));
    const { result } = renderReflections(baseExperience, onSaveReflection);

    act(() => {
      result.current.setReflectionText('A private reflection');
    });

    await act(async () => {
      await result.current.saveReflection();
    });

    expect(result.current.reflectionStatus).toBe('dirty');
    const { HapticsService } = require('../../services/hapticsService');
    expect(HapticsService.notificationAsync).toHaveBeenCalledWith('WARNING');
  });

  it('editing after a save returns status to dirty', async () => {
    const onSaveReflection = jest.fn(() => Promise.resolve(true));
    const { result } = renderReflections(baseExperience, onSaveReflection);

    act(() => {
      result.current.setReflectionText('First draft');
    });
    await act(async () => {
      await result.current.saveReflection();
    });
    expect(result.current.reflectionStatus).toBe('saved');

    act(() => {
      result.current.setReflectionText('First draft, revised');
    });
    expect(result.current.reflectionStatus).toBe('dirty');
  });

  it('resets reflection text and status when the experience changes', async () => {
    const onSaveReflection = jest.fn(() => Promise.resolve(true));
    const { result, rerender } = renderReflections(baseExperience, onSaveReflection);

    act(() => {
      result.current.setReflectionText('Something written for verse 1');
    });
    expect(result.current.reflectionStatus).toBe('dirty');

    const nextExperience = {
      content: { id: 'c2', source: '', arabicText: '', englishTranslation: '' },
      angle: { id: 'a2' },
    };

    rerender({ exp: nextExperience });

    expect(result.current.reflectionText).toBe('');
    expect(result.current.reflectionStatus).toBe('empty');
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx jest src/hooks/__tests__/useGuidanceLogic.test.ts`
Expected: FAIL — `result.current.reflectionStatus` / `result.current.saveReflection`
are `undefined` (not yet implemented).

- [ ] **Step 3: Widen the `onSaveReflection` parameter type**

Find:
```typescript
export const useGuidanceLogic = (
  experience: GuidanceExperience,
  mood: Mood,
  onNext: () => void | boolean | Promise<void | boolean>,
  onSaveReflection: (reflection: string) => void,
  cardsCount: number,
) => {
```
Replace:
```typescript
export const useGuidanceLogic = (
  experience: GuidanceExperience,
  mood: Mood,
  onNext: () => void | boolean | Promise<void | boolean>,
  onSaveReflection: (reflection: string) => void | boolean | Promise<void | boolean>,
  cardsCount: number,
) => {
```

- [ ] **Step 4: Replace the reflection-input state with tracked text + derived status**

Find:
```typescript
  const [savedStates, setSavedStates] = useState<Record<number, boolean>>({});
  const [showReflectionInput, setShowReflectionInput] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [isShareSheetVisible, setIsShareSheetVisible] = useState(false);
  const [shareContent, setShareContent] = useState({
    text: '',
    source: '',
    arabicText: '',
    transliteration: '',
  });
  const [activeIndex, setActiveIndex] = useState(0);
```
Replace:
```typescript
  const [savedStates, setSavedStates] = useState<Record<number, boolean>>({});
  const [reflectionText, setReflectionTextState] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // Any edit — including editing back to the previously-saved text — marks
  // the reflection dirty again. Simpler and more predictable than diffing
  // against the last-saved string.
  const setReflectionText = (text: string) => {
    setReflectionTextState(text);
    setReflectionSaved(false);
  };

  const reflectionStatus: 'empty' | 'dirty' | 'saved' = !reflectionText.trim()
    ? 'empty'
    : reflectionSaved
      ? 'saved'
      : 'dirty';

  const [isShareSheetVisible, setIsShareSheetVisible] = useState(false);
  const [shareContent, setShareContent] = useState({
    text: '',
    source: '',
    arabicText: '',
    transliteration: '',
  });
  const [activeIndex, setActiveIndex] = useState(0);
```

- [ ] **Step 5: Reset reflection state alongside `savedStates` on a new experience**

Find:
```typescript
  // Reset heart state whenever a new piece of content loads
  useEffect(() => {
    setSavedStates({});
  }, [experience?.content?.id]);
```
Replace:
```typescript
  // Reset heart state whenever a new piece of content loads
  useEffect(() => {
    setSavedStates({});
    setReflectionTextState('');
    setReflectionSaved(false);
  }, [experience?.content?.id]);
```

- [ ] **Step 6: Replace `handlePrimaryAction` with `saveReflection`**

Find:
```typescript
  const handlePrimaryAction = async () => {
    HapticsService.notificationAsync('SUCCESS');
    if (reflectionText.trim()) {
      onSaveReflection(reflectionText);
    }
    const advanced = await requestNext();
    if (!advanced) return; // resting — don't reset scroll/buttons

    setActiveIndex(0);

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }

    nextButtonScale.setValue(0);
    nextButtonOpacity.setValue(0);
  };
```
Replace:
```typescript
  // Explicit, deliberate save — the user taps "Save reflection" rather than
  // this firing automatically on advance/leave. Optimistic UI (mirrors
  // handleSave's bookmark toggle above): flip to "saved" immediately for
  // instant feedback, then revert + warn only if the save actually failed.
  const saveReflection = async () => {
    const text = reflectionText;
    if (!text.trim()) return;
    HapticsService.notificationAsync('SUCCESS');
    setReflectionSaved(true);
    const succeeded = (await onSaveReflection(text)) !== false;
    if (!succeeded) {
      setReflectionSaved(false);
      HapticsService.notificationAsync('WARNING');
    }
  };
```

- [ ] **Step 7: Update the return statement**

Find:
```typescript
  return {
    savedStates,
    showReflectionInput,
    setShowReflectionInput,
    reflectionText,
    setReflectionText,
    isShareSheetVisible,
    setIsShareSheetVisible,
    shareContent,
    activeIndex,
    remainingRefreshes,
    isResting,
    isWindowExhausted,
    requestNext,
    dismissResting,
    nextButtonScale,
    nextButtonOpacity,
    scrollY,
    scrollViewRef,
    handleSave,
    handleShare,
    handlePrimaryAction,
    onScroll,
    preferences,
    updatePreference,
    isPremium: freemiumService.isPremium(),
  };
};
```
Replace:
```typescript
  return {
    savedStates,
    reflectionText,
    setReflectionText,
    reflectionStatus,
    saveReflection,
    isShareSheetVisible,
    setIsShareSheetVisible,
    shareContent,
    activeIndex,
    remainingRefreshes,
    isResting,
    isWindowExhausted,
    requestNext,
    dismissResting,
    nextButtonScale,
    nextButtonOpacity,
    scrollY,
    scrollViewRef,
    handleSave,
    handleShare,
    onScroll,
    preferences,
    updatePreference,
    isPremium: freemiumService.isPremium(),
  };
};
```

- [ ] **Step 8: Run the tests and confirm they pass**

Run: `npx jest src/hooks/__tests__/useGuidanceLogic.test.ts`
Expected: PASS — 11 tests total (4 existing + 7 new).

- [ ] **Step 9: Commit**

```bash
git add src/hooks/useGuidanceLogic.ts src/hooks/__tests__/useGuidanceLogic.test.ts
git commit -m "feat: add reflection save action to useGuidanceLogic"
```

---

### Task 3: `ContextLayer.tsx` — Reflect UI inside the heart card

**Files:**
- Modify: `src/components/ContextLayer.tsx`

New props are optional with safe defaults so `PathStepScreen.tsx`'s existing
`<ContextLayer attribution=... text=... source=... accentColor=... />` call
(which never passes `angle`, so the whole heart card — and this new block
inside it — never renders there) needs no changes.

- [ ] **Step 1: Add new imports**

Find:
```typescript
import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Animated } from 'react-native';
const { height } = Dimensions.get('window');
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, Typography } from '../theme/DesignSystem';
```
Replace:
```typescript
import React, { useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Animated,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
const { height } = Dimensions.get('window');
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, Typography, BorderRadius, Animations } from '../theme/DesignSystem';
```

- [ ] **Step 2: Add the new props to the interface**

Find:
```typescript
interface ContextLayerProps {
  attribution: string;
  text: string;
  source: string;
  angle?: string;
  angleSource?: string;
  scrollY?: Animated.Value;
  accentColor?: string;
  topInset?: number;
}
```
Replace:
```typescript
type ReflectionStatus = 'empty' | 'dirty' | 'saved';

interface ContextLayerProps {
  attribution: string;
  text: string;
  source: string;
  angle?: string;
  angleSource?: string;
  scrollY?: Animated.Value;
  accentColor?: string;
  topInset?: number;
  reflectionPrompt?: string;
  reflectionValue?: string;
  onReflectionChange?: (text: string) => void;
  reflectionStatus?: ReflectionStatus;
  onSaveReflectionPress?: () => void;
  onReflectionFocusChange?: (focused: boolean) => void;
}
```

- [ ] **Step 3: Destructure the new props with defaults**

Find:
```typescript
const ContextLayer: React.FC<ContextLayerProps> = ({
  attribution,
  text,
  source,
  angle,
  angleSource,
  scrollY,
  accentColor = Colors.accent.primary,
  topInset,
}) => {
```
Replace:
```typescript
const ContextLayer: React.FC<ContextLayerProps> = ({
  attribution,
  text,
  source,
  angle,
  angleSource,
  scrollY,
  accentColor = Colors.accent.primary,
  topInset,
  reflectionPrompt = 'What does this ayah mean for you right now?',
  reflectionValue = '',
  onReflectionChange = () => {},
  reflectionStatus = 'empty',
  onSaveReflectionPress = () => {},
  onReflectionFocusChange,
}) => {
```

- [ ] **Step 4: Add the Save button's fade animation**

Find:
```typescript
  const fadeAnim1  = useRef(new Animated.Value(0)).current;
  const fadeAnim2  = useRef(new Animated.Value(0)).current;
  const fadeAnim3  = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(12)).current;
  const slideAnim2 = useRef(new Animated.Value(12)).current;
  const slideAnim3 = useRef(new Animated.Value(12)).current;
```
Replace:
```typescript
  const fadeAnim1  = useRef(new Animated.Value(0)).current;
  const fadeAnim2  = useRef(new Animated.Value(0)).current;
  const fadeAnim3  = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(12)).current;
  const slideAnim2 = useRef(new Animated.Value(12)).current;
  const slideAnim3 = useRef(new Animated.Value(12)).current;
  const saveButtonOpacity = useRef(
    new Animated.Value(reflectionStatus === 'empty' ? 0 : 1),
  ).current;
```

- [ ] **Step 5: Animate the Save button in/out as reflection status changes**

Find:
```typescript
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim1,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim1, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim2,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim2, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim3,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim3, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [text, angle]);
```
Replace:
```typescript
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim1,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim1, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim2,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim2, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim3,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim3, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [text, angle]);

  // Fades the Save button in once the user types, and back out if they
  // clear the input — a separate effect from the entrance choreography
  // above since it reacts to typing, not to a new verse loading.
  useEffect(() => {
    Animated.timing(saveButtonOpacity, {
      toValue: reflectionStatus === 'empty' ? 0 : 1,
      duration: Animations.timing.micro,
      useNativeDriver: true,
    }).start();
  }, [reflectionStatus, saveButtonOpacity]);
```

- [ ] **Step 6: Wrap the layer in `KeyboardAvoidingView`, add `keyboardShouldPersistTaps`, and add the Reflect block inside `heartCard`**

Find:
```typescript
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topInset !== undefined
            ? topInset
            : Math.max(insets.top + Spacing.sm, height * 0.02),
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
        {/* Mood-tinted top rule — signals layer transition */}
        <View style={[styles.topRule, { backgroundColor: accentColor }]} />

        {/* Section 1: Scholarly understanding */}
        {understand.length > 0 && (
          <Animated.View
            style={[
              styles.section,
              { opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] },
            ]}
          >
            <View style={styles.sectionLead}>
              <MaterialCommunityIcons name="book-open-variant" size={13} color={accentColor} style={{ opacity: 0.7 }} />
              <Text style={[styles.sectionTag, { color: accentColor }]}>
                {attribution || 'Scholarly Context'}
              </Text>
            </View>
            <Text style={styles.bodyText}>{cleanText(understand)}</Text>
          </Animated.View>
        )}

        {/* Section 2: Prophetic wisdom */}
        {matters.length > 0 && (
          <Animated.View
            style={[
              styles.section,
              { opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] },
            ]}
          >
            {renderMattersContent()}
          </Animated.View>
        )}

        {/* Source attribution — footnote */}
        {understand.length > 0 && (
          <Animated.View style={[styles.attributionRow, { opacity: fadeAnim2 }]}>
            <MaterialCommunityIcons name="shield-check" size={11} color={accentColor} style={{ opacity: 0.55 }} />
            <Text style={styles.attributionText}>{sourceLabel}</Text>
          </Animated.View>
        )}

        {/* For Your Heart — left-border personal message card */}
        {angle ? (
          <Animated.View
            style={[
              styles.heartSection,
              { opacity: fadeAnim3, transform: [{ translateY: slideAnim3 }] },
            ]}
          >
            <View style={[styles.heartCard, { borderLeftColor: accentColor, backgroundColor: accentColor + '0D' }]}>
              <View style={styles.heartHeader}>
                <MaterialCommunityIcons name="heart-outline" size={13} color={accentColor} />
                <Text style={[styles.heartLabel, { color: accentColor }]}>For Your Heart</Text>
              </View>
              <Text style={styles.heartBody}>{isolateBidiRuns(angle)}</Text>
              {angleSource ? (
                <Text style={[styles.heartSource, { color: accentColor }]}>— {angleSource}</Text>
              ) : null}
            </View>
          </Animated.View>
        ) : null}
      </Animated.ScrollView>
    </View>
  );
};
```
Replace:
```typescript
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={{
          flex: 1,
          paddingTop: topInset !== undefined
            ? topInset
            : Math.max(insets.top + Spacing.sm, height * 0.02),
          paddingBottom: Math.max(insets.bottom + Spacing.sm, Spacing.xl),
        }}
      >
        <Animated.ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          fadingEdgeLength={40}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          onScroll={
            scrollY
              ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                useNativeDriver: true,
              })
              : undefined
          }
        >
          {/* Mood-tinted top rule — signals layer transition */}
          <View style={[styles.topRule, { backgroundColor: accentColor }]} />

          {/* Section 1: Scholarly understanding */}
          {understand.length > 0 && (
            <Animated.View
              style={[
                styles.section,
                { opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] },
              ]}
            >
              <View style={styles.sectionLead}>
                <MaterialCommunityIcons name="book-open-variant" size={13} color={accentColor} style={{ opacity: 0.7 }} />
                <Text style={[styles.sectionTag, { color: accentColor }]}>
                  {attribution || 'Scholarly Context'}
                </Text>
              </View>
              <Text style={styles.bodyText}>{cleanText(understand)}</Text>
            </Animated.View>
          )}

          {/* Section 2: Prophetic wisdom */}
          {matters.length > 0 && (
            <Animated.View
              style={[
                styles.section,
                { opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] },
              ]}
            >
              {renderMattersContent()}
            </Animated.View>
          )}

          {/* Source attribution — footnote */}
          {understand.length > 0 && (
            <Animated.View style={[styles.attributionRow, { opacity: fadeAnim2 }]}>
              <MaterialCommunityIcons name="shield-check" size={11} color={accentColor} style={{ opacity: 0.55 }} />
              <Text style={styles.attributionText}>{sourceLabel}</Text>
            </Animated.View>
          )}

          {/* For Your Heart — left-border personal message card */}
          {angle ? (
            <Animated.View
              style={[
                styles.heartSection,
                { opacity: fadeAnim3, transform: [{ translateY: slideAnim3 }] },
              ]}
            >
              <View style={[styles.heartCard, { borderLeftColor: accentColor, backgroundColor: accentColor + '0D' }]}>
                <View style={styles.heartHeader}>
                  <MaterialCommunityIcons name="heart-outline" size={13} color={accentColor} />
                  <Text style={[styles.heartLabel, { color: accentColor }]}>For Your Heart</Text>
                </View>
                <Text style={styles.heartBody}>{isolateBidiRuns(angle)}</Text>
                {angleSource ? (
                  <Text style={[styles.heartSource, { color: accentColor }]}>— {angleSource}</Text>
                ) : null}

                <View style={[styles.reflectDivider, { backgroundColor: accentColor + '26' }]} />

                <View style={styles.reflectHeader}>
                  <MaterialCommunityIcons name="pencil-outline" size={13} color={accentColor} />
                  <Text style={[styles.reflectLabel, { color: accentColor }]}>Reflect</Text>
                </View>
                <Text style={styles.reflectPrompt}>{reflectionPrompt}</Text>

                <TextInput
                  style={styles.reflectInput}
                  value={reflectionValue}
                  onChangeText={onReflectionChange}
                  onFocus={() => onReflectionFocusChange?.(true)}
                  onBlur={() => onReflectionFocusChange?.(false)}
                  placeholder="Write freely — even a few words count..."
                  placeholderTextColor={`${Colors.text.primary}4D`}
                  multiline
                  textAlignVertical="top"
                  selectionColor={accentColor}
                  accessibilityLabel="Write your reflection"
                />

                <Text style={styles.reflectHint}>
                  Writing it down turns a fleeting feeling into words you can return to
                  — a quiet line between you and Allah.
                </Text>

                <Animated.View
                  style={[styles.saveReflectionWrap, { opacity: saveButtonOpacity }]}
                  pointerEvents={reflectionStatus === 'empty' ? 'none' : 'auto'}
                >
                  <TouchableOpacity
                    style={[
                      styles.saveReflectionButton,
                      { borderColor: accentColor + '55' },
                      reflectionStatus === 'saved' && styles.saveReflectionButtonSaved,
                    ]}
                    onPress={onSaveReflectionPress}
                    disabled={reflectionStatus === 'saved'}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={reflectionStatus === 'saved' ? 'Saved' : 'Save reflection'}
                  >
                    <MaterialCommunityIcons
                      name={reflectionStatus === 'saved' ? 'check' : 'content-save-outline'}
                      size={14}
                      color={reflectionStatus === 'saved' ? Colors.text.muted : accentColor}
                    />
                    <Text
                      style={[
                        styles.saveReflectionText,
                        { color: reflectionStatus === 'saved' ? Colors.text.muted : accentColor },
                      ]}
                    >
                      {reflectionStatus === 'saved' ? 'Saved' : 'Save reflection'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Animated.View>
          ) : null}
        </Animated.ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};
```

- [ ] **Step 7: Add the new styles**

Find:
```typescript
  heartSource: {
    fontSize: 11,
    opacity: 0.55,
    fontWeight: '500',
    marginTop: Spacing.md,
    letterSpacing: 0.4,
    fontStyle: 'italic',
  },
});
```
Replace:
```typescript
  heartSource: {
    fontSize: 11,
    opacity: 0.55,
    fontWeight: '500',
    marginTop: Spacing.md,
    letterSpacing: 0.4,
    fontStyle: 'italic',
  },

  /* ── Reflect ── */
  reflectDivider: {
    height: 1,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  reflectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reflectLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  reflectPrompt: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.small,
    lineHeight: 22,
    color: Colors.text.primary,
    fontStyle: 'italic',
    opacity: 0.85,
    marginBottom: Spacing.md,
  },
  reflectInput: {
    minHeight: 72,
    fontSize: Typography.sizes.body,
    lineHeight: 24,
    color: Colors.text.primary,
    fontFamily: Typography.fonts.latin,
    paddingVertical: Spacing.sm,
  },
  reflectHint: {
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
    lineHeight: 17,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    opacity: 0.8,
  },
  saveReflectionWrap: {
    alignItems: 'flex-end',
  },
  saveReflectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  saveReflectionButtonSaved: {
    borderColor: 'transparent',
  },
  saveReflectionText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
```

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors. (`PathStepScreen.tsx`'s `<ContextLayer>` call doesn't
pass the new props — all optional with defaults, so it stays valid as-is.)

- [ ] **Step 9: Commit**

```bash
git add src/components/ContextLayer.tsx
git commit -m "feat: add Reflect UI to ContextLayer's For Your Heart card"
```

---

### Task 4: `GuidanceScreen.tsx` — wire the hook and `ContextLayer` together

**Files:**
- Modify: `src/screens/GuidanceScreen.tsx`

- [ ] **Step 1: Make `onSaveReflection` report success/failure**

Find:
```typescript
  const onSaveReflection = async (reflection: string) => {
    try {
      await rotationEngine.saveReflection(
        experience.content.id,
        experience.angle.id,
        mood,
        reflection,
      );
    } catch (error) {
      logServiceError(
        'GuidanceScreen',
        'handleSaveReflection',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  };
```
Replace:
```typescript
  const onSaveReflection = async (reflection: string): Promise<boolean> => {
    try {
      await rotationEngine.saveReflection(
        experience.content.id,
        experience.angle.id,
        mood,
        reflection,
      );
      return true;
    } catch (error) {
      logServiceError(
        'GuidanceScreen',
        'handleSaveReflection',
        error instanceof Error ? error : new Error(String(error)),
      );
      return false;
    }
  };
```

- [ ] **Step 2: Track reflection-input focus, ahead of the swipe gesture setup**

Find:
```typescript
  // Swipe left → next verse.
  // Uses a horizontal-dominant threshold so it never conflicts with
  // LayerContainer's vertical-swipe gesture or the ScrollView inside VerseLayer.
  const { panHandlers: swipePanHandlers, swipeAnim: swipeOverlayAnim } = useSwipeGesture({
    onNext: () => {
      requestNextRef.current();
    },
    threshold: 50,
  });
```
Replace:
```typescript
  // Tracks focus on the Context layer's reflection TextInput so the swipe-
  // to-next-verse gesture can be suppressed while the user is actively
  // editing — a word-selection drag inside the input is horizontal enough to
  // satisfy the swipe threshold below, which would otherwise silently
  // discard an unsaved reflection.
  const [isReflectionInputFocused, setIsReflectionInputFocused] = useState(false);

  // Swipe left → next verse.
  // Uses a horizontal-dominant threshold so it never conflicts with
  // LayerContainer's vertical-swipe gesture or the ScrollView inside VerseLayer.
  const { panHandlers: swipePanHandlers, swipeAnim: swipeOverlayAnim } = useSwipeGesture({
    onNext: () => {
      requestNextRef.current();
    },
    threshold: 50,
  });
```

- [ ] **Step 3: Destructure the new hook fields**

Find:
```typescript
  const {
    savedStates,
    isShareSheetVisible,
    setIsShareSheetVisible,
    shareContent,
    handleSave,
    handleShare,
    preferences,
    updatePreference,
    requestNext,
    isResting,
    isWindowExhausted,
    dismissResting,
    remainingRefreshes,
  } = useGuidanceLogic(experience, mood, onNext, onSaveReflection, totalLayers);
```
Replace:
```typescript
  const {
    savedStates,
    reflectionText,
    setReflectionText,
    reflectionStatus,
    saveReflection,
    isShareSheetVisible,
    setIsShareSheetVisible,
    shareContent,
    handleSave,
    handleShare,
    preferences,
    updatePreference,
    requestNext,
    isResting,
    isWindowExhausted,
    dismissResting,
    remainingRefreshes,
  } = useGuidanceLogic(experience, mood, onNext, onSaveReflection, totalLayers);
```

- [ ] **Step 4: Compute the reflection prompt with its fallback**

Find:
```typescript
  const handleShareVerse = () => {
    handleShare(
      experience.content.translation || experience.content.englishTranslation || '',
      experience.content.source || '',
      experience.content.arabicText,
      experience.content.transliteration,
    );
  };
```
Replace:
```typescript
  const handleShareVerse = () => {
    handleShare(
      experience.content.translation || experience.content.englishTranslation || '',
      experience.content.source || '',
      experience.content.arabicText,
      experience.content.transliteration,
    );
  };

  const reflectionPrompt =
    experience.angle?.reflection || 'What does this ayah mean for you right now?';
```

- [ ] **Step 5: Suppress the swipe gesture while the reflection input is focused**

Find:
```typescript
      <View style={styles.gestureWrap} {...swipePanHandlers}>
```
Replace:
```typescript
      <View style={styles.gestureWrap} {...(isReflectionInputFocused ? {} : swipePanHandlers)}>
```

- [ ] **Step 6: Pass the new props to `ContextLayer`**

Find:
```typescript
          {currentLayer === 1 && hasContext && (
            <ContextLayer
              attribution={experience.angle?.angleSource || 'Scholarly Context'}
              text={experience.content.whyThis || ''}
              source={experience.content.source || ''}
              angle={experience.angle?.angle}
              angleSource={experience.angle?.angleSource}
              scrollY={scrollY}
              topInset={Spacing.lg}
              accentColor={(MoodColors[mood] || MoodColors.Calm).accent}
            />
          )}
```
Replace:
```typescript
          {currentLayer === 1 && hasContext && (
            <ContextLayer
              attribution={experience.angle?.angleSource || 'Scholarly Context'}
              text={experience.content.whyThis || ''}
              source={experience.content.source || ''}
              angle={experience.angle?.angle}
              angleSource={experience.angle?.angleSource}
              scrollY={scrollY}
              topInset={Spacing.lg}
              accentColor={(MoodColors[mood] || MoodColors.Calm).accent}
              reflectionPrompt={reflectionPrompt}
              reflectionValue={reflectionText}
              onReflectionChange={setReflectionText}
              reflectionStatus={reflectionStatus}
              onSaveReflectionPress={saveReflection}
              onReflectionFocusChange={setIsReflectionInputFocused}
            />
          )}
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/screens/GuidanceScreen.tsx
git commit -m "feat: wire reflection writing into GuidanceScreen's Context layer"
```

---

### Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including the 11 in `useGuidanceLogic.test.ts`.

- [ ] **Step 2: Full typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Manual on-device pass**

Per CLAUDE.md's Commands section, visual/gesture changes need real-device
confirmation, not just typecheck/tests. On a real device or Expo dev
client, open Guidance for any mood, swipe/tap into the Context layer for a
verse whose `angle.reflection` is populated, and confirm:

- The "For Your Heart" card shows the existing angle text, then a hairline
  divider, then "REFLECT" with the per-verse question.
- Typing in the input fades in a "Save reflection" button; tapping it gives
  a success haptic, flips the button to a muted "Saved" state, and the
  keyboard doesn't cover the button on a small device (test both iOS and
  Android if possible — they use different `KeyboardAvoidingView` behaviors).
- The saved reflection appears in `ReflectionHistoryScreen`'s journal with
  the correct verse citation and mood.
- Editing the text after saving re-arms the "Save reflection" button.
- Swiping to the next verse clears the input and re-fades the empty state.
- **Press-and-drag to select a word inside the reflection input, and
  confirm it does not trigger a swipe-to-next-verse** — this is the
  gesture-conflict risk identified during the spec audit; confirm the
  `isReflectionInputFocused` mitigation actually holds on-device.
- Open a verse whose `angle.reflection` is missing (or temporarily blank
  one out) and confirm the generic fallback prompt renders instead of a
  blank line.
- Check that the Reflect block doesn't feel cramped inside `heartCard`'s
  narrow, border-left quote-card padding (it was designed for a short
  pull-quote, not a multiline input + button row — flagged during the spec
  audit). If it reads tight, loosen `reflectInput`/`reflectHint`'s
  horizontal spacing rather than changing `heartCard` itself, since that
  card's framing is shared with the angle text above it.
