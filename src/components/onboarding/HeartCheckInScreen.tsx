/**
 * Screen 3: Heart Check-In — Horizontal Carousel
 *
 * Each card shows the mood + what Sakina will give you for it.
 * Swipe horizontally through all 8 moods. Tap the card to select.
 * Selection saves to AsyncStorage and auto-advances after 800ms.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Colors, Typography, Spacing } from '../../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { AnimatedMandala } from '../AnimatedMandala';
import { InteractiveStarfield } from './InteractiveStarfield';
import { Mood } from '../../types';

const STAR_POS = [
  { x: 0.06, y: 0.05, s: 2.5, d: 0 },
  { x: 0.92, y: 0.03, s: 2, d: 500 },
  { x: 0.20, y: 0.16, s: 1.5, d: 250 },
  { x: 0.80, y: 0.12, s: 2, d: 750 },
  { x: 0.50, y: 0.07, s: 1.5, d: 100 },
  { x: 0.95, y: 0.25, s: 2.5, d: 600 },
];

interface MoodOption {
  id: Mood;
  label: string;
  sublabel: string;
  giving: string;
  color: string;
  bgColor: string;
  gradientColors: [string, string, string];
  iconName: string;
}

// Colors aligned with MoodColors in DesignSystem.ts so onboarding cards
// match the GuidanceScreen immersive background the user will see later.
const MOODS: MoodOption[] = [
  {
    id: 'Grateful',
    label: 'GRATEFUL',
    sublabel: 'Shukr',
    giving: 'Naming what He gave, before you ask Him for anything else',
    color: '#FBBF24',
    bgColor: '#451A03',
    gradientColors: ['#5E2204', '#3A1602', '#1A0901'],
    iconName: 'heart',
  },
  {
    id: 'Hopeful',
    label: 'HOPEFUL',
    sublabel: 'Amal',
    // Was "ease follows every hardship" — an Overwhelmed/Sad line. Hopeful now
    // carries the striving content (racing to good, ihsan, effort recorded).
    giving: 'Not an atom\'s weight of what you do for Him is lost',
    color: '#22D3EE',
    bgColor: '#083344',
    gradientColors: ['#0C4A63', '#062836', '#021620'],
    iconName: 'sunny',
  },
  {
    id: 'Calm',
    label: 'PEACEFUL',
    // Was 'Sukoon' (سُكُون, stillness) — a different word from Sakeenah
    // (سَكِينَة, the heart's tranquility, the app's own name), which is what
    // HomeScreen and the mood check-in modal actually pair with this mood.
    sublabel: 'Sakeenah',
    giving: 'Sakina descends — this is how you make room for it',
    color: '#34D399',
    bgColor: '#064E3B',
    gradientColors: ['#0A6B52', '#053E2F', '#021F18'],
    iconName: 'water',
  },
  {
    id: 'Overwhelmed',
    label: 'OVERWHELMED',
    // Was 'Ghamm' (غَمّ, distress/grief) — HomeScreen and the mood check-in
    // modal both pair this mood with Irhaq (إِرْهَاق, exhaustion) instead.
    sublabel: 'Irhaq',
    giving: 'He does not burden a soul beyond what it can bear',
    color: '#818CF8',
    bgColor: '#0F172A',
    gradientColors: ['#192840', '#0B1220', '#050A14'],
    iconName: 'layers',
  },
  {
    id: 'Tired',
    label: 'TIRED',
    sublabel: 'Ta\'ab',
    giving: 'Rest in His mercy — He sees every effort you make',
    color: '#C99A93',
    bgColor: '#241A18',
    gradientColors: ['#3B2724', '#241A18', '#120C0B'],
    iconName: 'moon',
  },
  {
    id: 'Lonely',
    label: 'LONELY',
    sublabel: 'Wahshah',
    giving: 'He is with you wherever you are — you are never alone',
    color: '#C084FC',
    bgColor: '#2E1065',
    gradientColors: ['#481A8A', '#240C50', '#10052B'],
    iconName: 'person',
  },
  {
    id: 'Sad',
    label: 'SAD',
    sublabel: 'Huzn',
    giving: 'Do not despair — the mercy of Allah has no limits',
    color: '#7BA3D0',
    bgColor: '#16283F',
    gradientColors: ['#22405F', '#16283F', '#0A1420'],
    iconName: 'rainy',
  },
  {
    id: 'Angry',
    label: 'ANGRY',
    sublabel: 'Ghadab',
    // Was 13:28 ("hearts find rest") — that is Calm's verse. Angry leads with
    // de-escalation: ta'awwudh, changing posture, wudu, leaving the room.
    giving: 'Bring the heat down first — the rest can wait',
    color: '#FB923C',
    bgColor: '#1A0F0A',
    gradientColors: ['#2A1508', '#140C08', '#060302'],
    iconName: 'flame',
  },
  {
    id: 'Guilty',
    label: 'GUILTY',
    sublabel: 'Nadam',
    giving: 'The door He left open, and the Name He signs it with',
    color: '#4FB8A0',
    bgColor: '#062A26',
    gradientColors: ['#0E4A42', '#082F2A', '#041A17'],
    iconName: 'refresh-circle',
  },
];

const STORAGE_KEY = '@onboarding_mood';

interface Props {
  isActive: boolean;
  onNext: () => void;
}

export default function HeartCheckInScreen({ isActive, onNext }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const cardWidth = screenWidth * 0.72;
  const cardGap = 16;
  const snapInterval = cardWidth + cardGap;
  const sideOffset = (screenWidth - cardWidth) / 2;

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  // [0] title, [1] subtitle, [2] carousel
  const s = useStaggerEntry(isActive, 3);

  const cardScales = useRef(MOODS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.92))).current;
  const checkScales = useRef(MOODS.map(() => new Animated.Value(0))).current;
  const dotAnims = useRef(MOODS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  useEffect(() => {
    if (!isActive) return;
    setSelectedMood(null);
    setActiveIndex(0);
    cardScales.forEach((a, i) => a.setValue(i === 0 ? 1 : 0.92));
    checkScales.forEach(a => a.setValue(0));
    dotAnims.forEach((a, i) => a.setValue(i === 0 ? 1 : 0));
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [isActive]);

  // Ref holds the current index for animation logic — avoids stale closures in
  // handleScroll without adding activeIndex to useCallback deps (which would
  // recreate the function on every scroll tick and cascade 60 re-renders/sec).
  const activeIndexRef = useRef(0);

  const updateActiveIndex = useCallback((index: number) => {
    const prev = activeIndexRef.current;
    if (index === prev) return;
    activeIndexRef.current = index;
    // Animate old card down, new card up
    Animated.timing(cardScales[prev], { toValue: 0.92, duration: 200, useNativeDriver: true }).start();
    Animated.timing(cardScales[index], { toValue: 1, duration: 200, useNativeDriver: true }).start();
    // Dot indicators
    Animated.timing(dotAnims[prev], { toValue: 0, duration: 150, useNativeDriver: true }).start();
    Animated.timing(dotAnims[index], { toValue: 1, duration: 150, useNativeDriver: true }).start();
    setActiveIndex(index);
  }, [cardScales, dotAnims]);

  const handleScroll = useCallback((e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / snapInterval);
    const clamped = Math.max(0, Math.min(MOODS.length - 1, index));
    updateActiveIndex(clamped);
  }, [snapInterval, updateActiveIndex]);

  // Timer ref for cleanup — prevents state update on unmounted component
  // if the user navigates back within the 800ms selection window.
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    };
  }, []);

  const handleSelect = useCallback((mood: MoodOption, index: number) => {
    if (selectedMood) return;
    setSelectedMood(mood.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    AsyncStorage.setItem(STORAGE_KEY, mood.id).catch(() => {});

    Animated.spring(checkScales[index], {
      toValue: 1, damping: 10, stiffness: 200, useNativeDriver: true,
    }).start();

    nextTimerRef.current = setTimeout(() => onNext(), 800);
  }, [selectedMood, checkScales, onNext]);

  return (
    <View style={styles.container}>
      <InteractiveStarfield positions={STAR_POS.map(p => ({ ...p, y: p.y * 1.5 }))} />

      <View style={[styles.mandalaWrap, { top: screenHeight * 0.02 }]} pointerEvents="none">
        <AnimatedMandala size={320} color={Colors.accent.primary} opacity={0.15} webLayers={2} />
      </View>

      {/* Header */}
      <View style={[styles.headerArea, { paddingTop: insets.top + 72 }]}>
        <Animated.Text style={[styles.title, s[0]]}>
          How Is Your Heart?
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, s[1]]}>
          Swipe to find your feeling — tap to choose
        </Animated.Text>
      </View>

      {/* Carousel — NativeViewGestureHandler absorbs horizontal swipes so they
          don't bleed through to the parent screen-level PanGestureHandler */}
      <Animated.View style={[styles.carouselWrap, s[2]]}>
        <NativeViewGestureHandler>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={snapInterval}
          decelerationRate="fast"
          contentContainerStyle={[styles.carouselContent, { paddingHorizontal: sideOffset, gap: cardGap }]}
          onScroll={handleScroll}
          scrollEventThrottle={50}
          scrollEnabled={!selectedMood}
        >
          {MOODS.map((mood, i) => (
            <Animated.View
              key={mood.id}
              style={[
                styles.cardOuter,
                { width: cardWidth, transform: [{ scale: cardScales[i] }] },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleSelect(mood, i)}
                disabled={!!selectedMood}
                style={styles.cardTouch}
                accessibilityRole="button"
                accessibilityLabel={`${mood.label} — ${mood.sublabel}`}
                accessibilityState={{ disabled: !!selectedMood }}
              >
                <LinearGradient
                  colors={mood.gradientColors}
                  style={[styles.card, { width: cardWidth, height: screenHeight * 0.46, borderColor: mood.color + '45' }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  {/* Top sheen — accent backlight fading to transparent */}
                  <LinearGradient
                    colors={[mood.color + '1F', 'transparent']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.38 }}
                    style={styles.cardSheen}
                    pointerEvents="none"
                  />

                  {/* Icon */}
                  <View style={[styles.iconCircle, { borderColor: mood.color, backgroundColor: mood.color }]}>
                    <Ionicons name={mood.iconName as any} size={28} color="#FFFFFF" />
                  </View>

                  {/* Mood name */}
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                  <Text style={styles.moodSublabel}>{mood.sublabel}</Text>

                  {/* Divider */}
                  <View style={[styles.divider, { backgroundColor: mood.color + '30' }]} />

                  {/* What Sakina gives */}
                  <Text style={styles.givingText}>
                    {mood.giving}
                  </Text>

                  {/* Checkmark */}
                  <Animated.View style={[
                    styles.checkCircle,
                    { backgroundColor: mood.color, transform: [{ scale: checkScales[i] }] },
                  ]}>
                    <Ionicons name="checkmark" size={14} color={Colors.background.secondary} />
                  </Animated.View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
        </NativeViewGestureHandler>
      </Animated.View>

      {/* Dot indicators */}
      <View style={[styles.dotsRow, { paddingBottom: Math.max(insets.bottom + Spacing.xxl, Spacing.xxxl) }]}>
        {MOODS.map((mood, i) => (
          <View key={mood.id} style={styles.dotSlot}>
            {/* Inactive dot — always visible */}
            <View style={[styles.dotInactive]} />
            {/* Active dot — fades in/out over it */}
            <Animated.View
              style={[
                styles.dotActive,
                {
                  opacity: dotAnims[i],
                  backgroundColor: MOODS[activeIndex].color,
                },
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mandalaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    top: '2%',
    zIndex: 0,
  },
  headerArea: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 20,
    zIndex: 2,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: 26,
    color: '#F0E6D3',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 8,
    textShadowColor: 'rgba(201,168,76,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(176,196,215,0.85)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  carouselWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselContent: {
    alignItems: 'center',
  },
  cardOuter: {},
  cardTouch: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 28,
    gap: 0,
  },
  cardSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 23,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
    color: '#FFFFFF',
  },
  moodSublabel: {
    fontSize: 13,
    fontFamily: Typography.fonts.serif,
    letterSpacing: 0.5,
    opacity: 0.75,
    marginBottom: 20,
    color: '#FFFFFF',
  },
  divider: {
    width: '60%',
    height: 1,
    marginBottom: 20,
    borderRadius: 1,
  },
  givingText: {
    fontSize: 14,
    fontFamily: Typography.fonts.serif,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.85,
    paddingHorizontal: 8,
    color: '#FFFFFF',
  },
  checkCircle: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 0,
    zIndex: 2,
  },
  dotSlot: {
    width: 20,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  dotInactive: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 3,
  },
});
