/**
 * Screen 3: Heart Check-In — Horizontal Carousel
 *
 * Each card shows the mood + what Sakina will give you for it.
 * Swipe horizontally through all 8 moods. Tap the card to select.
 * Selection saves to AsyncStorage and auto-advances after 800ms.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Colors } from '../../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { AnimatedMandala } from '../AnimatedMandala';
import { InteractiveStarfield } from './InteractiveStarfield';
import { Mood } from '../../types';

const { width, height } = Dimensions.get('window');

const CARD_WIDTH = width * 0.72;
const CARD_GAP = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const SIDE_OFFSET = (width - CARD_WIDTH) / 2;

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
  gradientColors: [string, string];
  iconName: string;
}

// Colors aligned with MoodColors in DesignSystem.ts so onboarding cards
// match the GuidanceScreen immersive background the user will see later.
const MOODS: MoodOption[] = [
  {
    id: 'Grateful',
    label: 'GRATEFUL',
    sublabel: 'Shukr',
    giving: 'Verses to deepen your gratitude and multiply His blessings',
    color: '#FBBF24',
    bgColor: '#451A03',
    gradientColors: ['#3A1602', '#451A03'],
    iconName: 'heart',
  },
  {
    id: 'Hopeful',
    label: 'HOPEFUL',
    sublabel: 'Amal',
    giving: 'Reminders of Allah\'s promise — ease follows every hardship',
    color: '#22D3EE',
    bgColor: '#083344',
    gradientColors: ['#062836', '#083344'],
    iconName: 'sunny',
  },
  {
    id: 'Calm',
    label: 'PEACEFUL',
    sublabel: 'Sukoon',
    giving: 'Reflections to sustain and deepen this blessed stillness',
    color: '#34D399',
    bgColor: '#064E3B',
    gradientColors: ['#053E2F', '#064E3B'],
    iconName: 'water',
  },
  {
    id: 'Overwhelmed',
    label: 'OVERWHELMED',
    sublabel: 'Ghamm',
    giving: 'He does not burden a soul beyond what it can bear',
    color: '#818CF8',
    bgColor: '#0F172A',
    gradientColors: ['#0B1220', '#0F172A'],
    iconName: 'layers',
  },
  {
    id: 'Tired',
    label: 'TIRED',
    sublabel: 'Ta\'ab',
    giving: 'Rest in His mercy — He sees every effort you make',
    color: '#D6D3D1',
    bgColor: '#1C1917',
    gradientColors: ['#161310', '#1C1917'],
    iconName: 'moon',
  },
  {
    id: 'Lonely',
    label: 'LONELY',
    sublabel: 'Wahshah',
    giving: 'He is with you wherever you are — you are never alone',
    color: '#C084FC',
    bgColor: '#2E1065',
    gradientColors: ['#240C50', '#2E1065'],
    iconName: 'person',
  },
  {
    id: 'Sad',
    label: 'SAD',
    sublabel: 'Huzn',
    giving: 'Do not despair — the mercy of Allah has no limits',
    color: '#94A3B8',
    bgColor: '#1E293B',
    gradientColors: ['#172030', '#1E293B'],
    iconName: 'rainy',
  },
  {
    id: 'Angry',
    label: 'ANGRY',
    sublabel: 'Ghadab',
    giving: 'Find peace through His remembrance — hearts find rest',
    color: '#FB923C',
    bgColor: '#1A0F0A',
    gradientColors: ['#140C08', '#1A0F0A'],
    iconName: 'flame',
  },
];

const STORAGE_KEY = '@onboarding_mood';

interface Props {
  isActive: boolean;
  onNext: () => void;
}

export default function HeartCheckInScreen({ isActive, onNext }: Props) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // [0] arabic, [1] title, [2] subtitle, [3] carousel
  const s = useStaggerEntry(isActive, 4);

  const scrollRef = useRef<ScrollView>(null);
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
  }, [cardScales, dotAnims]); // no longer depends on activeIndex

  const handleScroll = useCallback((e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SNAP_INTERVAL);
    const clamped = Math.max(0, Math.min(MOODS.length - 1, index));
    updateActiveIndex(clamped);
  }, [updateActiveIndex]);

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

      <View style={styles.mandalaWrap} pointerEvents="none">
        <AnimatedMandala size={280} color={Colors.accent.primary} opacity={0.04} />
      </View>

      {/* Header */}
      <View style={styles.headerArea}>
        <Animated.Text style={[styles.arabicTitle, s[0]]}>
          كيف حال قلبك
        </Animated.Text>
        <Animated.Text style={[styles.title, s[1]]}>
          How Is Your Heart?
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, s[2]]}>
          Swipe to find your feeling — tap to choose
        </Animated.Text>
      </View>

      {/* Carousel */}
      <Animated.View style={[styles.carouselWrap, s[3]]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          onScroll={handleScroll}
          scrollEventThrottle={50}
          scrollEnabled={!selectedMood}
        >
          {MOODS.map((mood, i) => (
            <Animated.View
              key={mood.id}
              style={[
                styles.cardOuter,
                { transform: [{ scale: cardScales[i] }] },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleSelect(mood, i)}
                disabled={!!selectedMood}
                style={styles.cardTouch}
              >
                <LinearGradient
                  colors={mood.gradientColors}
                  style={[styles.card, { borderColor: mood.color + '30' }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  {/* Icon */}
                  <View style={[styles.iconCircle, { borderColor: mood.color + '50', backgroundColor: mood.color + '15' }]}>
                    <Ionicons name={mood.iconName as any} size={28} color={mood.color} />
                  </View>

                  {/* Mood name */}
                  <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>
                  <Text style={[styles.moodSublabel, { color: mood.color }]}>{mood.sublabel}</Text>

                  {/* Divider */}
                  <View style={[styles.divider, { backgroundColor: mood.color + '30' }]} />

                  {/* What Sakina gives */}
                  <Text style={[styles.givingText, { color: mood.color }]}>
                    {mood.giving}
                  </Text>

                  {/* Checkmark */}
                  <Animated.View style={[
                    styles.checkCircle,
                    { backgroundColor: mood.color, transform: [{ scale: checkScales[i] }] },
                  ]}>
                    <Ionicons name="checkmark" size={14} color="#0C1A2E" />
                  </Animated.View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {MOODS.map((_, i) => (
          <View key={i} style={styles.dotSlot}>
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
    left: width / 2 - 140,
    top: height * 0.02,
    zIndex: 0,
  },
  headerArea: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: height * 0.08,
    paddingBottom: 20,
    zIndex: 2,
  },
  arabicTitle: {
    fontSize: 20,
    color: 'rgba(201,168,76,0.78)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 6,
    letterSpacing: 1,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
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
    fontSize: 13,
    color: 'rgba(176,196,215,0.65)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  carouselWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselContent: {
    paddingHorizontal: SIDE_OFFSET,
    gap: CARD_GAP,
    alignItems: 'center',
  },
  cardOuter: {
    width: CARD_WIDTH,
  },
  cardTouch: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  card: {
    width: CARD_WIDTH,
    height: height * 0.46,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 0,
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
  },
  moodSublabel: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
    opacity: 0.65,
    marginBottom: 20,
  },
  divider: {
    width: '60%',
    height: 1,
    marginBottom: 20,
    borderRadius: 1,
  },
  givingText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
    paddingHorizontal: 8,
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
    paddingBottom: height * 0.06,
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
