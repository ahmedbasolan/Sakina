/**
 * Screen 3: Personalization
 *
 * "What brings you here?" — 2x2 grid of prayer goals.
 * Single selection with checkmark. Auto-advances after 1.2s.
 * All elements use shared stagger animation.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Colors, Typography, Spacing } from '../../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { AnimatedMandala } from '../AnimatedMandala';
import { InteractiveStarfield } from './InteractiveStarfield';

const { width, height } = Dimensions.get('window');

const STAR_POS = [
  { x: 0.08, y: 0.06, s: 2.5, d: 0 },
  { x: 0.88, y: 0.04, s: 2, d: 500 },
  { x: 0.15, y: 0.19, s: 1.5, d: 250 },
  { x: 0.82, y: 0.15, s: 2, d: 750 },
  { x: 0.50, y: 0.08, s: 1.5, d: 100 },
];


const CARD_SIZE = (width - 64 - 14) / 2;

interface GoalOption {
  id: string;
  title: string;
  desc: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  accentColor: string;
  gradientColors: [string, string, string];
}

const GOALS: GoalOption[] = [
  {
    id: 'consistency',
    title: 'Build\nConsistency',
    desc: 'A daily habit of dhikr and Quran',
    iconName: 'sunny',
    accentColor: '#FBBF24',
    gradientColors: ['#5E3A00', '#3A2200', '#1A1000'],
  },
  {
    id: 'peace',
    title: 'Find Peace',
    desc: 'Verses for stillness and serenity',
    iconName: 'heart',
    accentColor: '#F472B6',
    gradientColors: ['#5C0A30', '#380518', '#1A020C'],
  },
  {
    id: 'growth',
    title: 'Spiritual\nGrowth',
    desc: 'Deepen your knowledge and reflection',
    iconName: 'star',
    accentColor: '#A78BFA',
    gradientColors: ['#280D60', '#160638', '#07021A'],
  },
  {
    id: 'night',
    title: 'Night\nReflections',
    desc: 'Gentle Tahajjud and night reminders',
    iconName: 'moon',
    accentColor: '#60A5FA',
    gradientColors: ['#062060', '#031236', '#010818'],
  },
];

const STORAGE_KEY = '@onboarding_prayer_goal';

interface Props {
  isActive: boolean;
  onNext: () => void;
}

export default function PersonalizationScreen({ isActive, onNext }: Props) {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  // [0] title, [1] subtitle, [2] card0, [3] card1, [4] card2, [5] card3, [6] chip
  const s = useStaggerEntry(isActive, 7);

  useEffect(() => {
    return () => {
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    };
  }, []);

  // Selection border animation per card
  const selectionAnims = useRef(
    GOALS.map(() => ({
      borderOpacity: new Animated.Value(0),
      checkScale: new Animated.Value(0),
    })),
  ).current;

  // Dim unselected cards
  const cardDimAnims = useRef(GOALS.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    if (!isActive) return;
    setSelectedGoal(null);
    selectionAnims.forEach((sa) => {
      sa.borderOpacity.setValue(0);
      sa.checkScale.setValue(0);
    });
    cardDimAnims.forEach((a) => a.setValue(1));
  }, [isActive]);

  const handleSelect = useCallback(
    (goalId: string, index: number) => {
      if (selectedGoal) return;

      setSelectedGoal(goalId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      AsyncStorage.setItem(STORAGE_KEY, goalId).catch(() => {});

      // Show selection
      const sa = selectionAnims[index];
      Animated.parallel([
        Animated.timing(sa.borderOpacity, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(150),
          Animated.spring(sa.checkScale, {
            toValue: 1, damping: 10, stiffness: 200, useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Dim others
      cardDimAnims.forEach((a, i) => {
        if (i !== index) {
          Animated.timing(a, { toValue: 0.35, duration: 300, useNativeDriver: true }).start();
        }
      });

      nextTimerRef.current = setTimeout(() => onNext(), 800);
    },
    [selectedGoal, onNext],
  );

  return (
    <View style={styles.container}>
      {/* Stars */}
      <InteractiveStarfield positions={STAR_POS.map(p => ({ ...p, y: p.y * 1.5 }))} />

      {/* Mandala backdrop */}
      <View style={styles.mandalaWrap} pointerEvents="none">
        <AnimatedMandala size={300} color={Colors.accent.primary} opacity={0.15} webLayers={2} />
      </View>

      <View style={styles.contentArea}>
        {/* Title */}
        <Animated.Text style={[styles.title, s[0]]}>
          What Brings You{'\n'}Here?
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, s[1]]}>
          Your choice shapes every verse and reminder you receive
        </Animated.Text>

        {/* 2x2 Grid */}
        <View style={styles.grid}>
          {GOALS.map((goal, i) => (
            <Animated.View
              key={goal.id}
              style={[
                styles.cardWrap,
                s[i + 2],
                { opacity: Animated.multiply(s[i + 2].opacity, cardDimAnims[i]) },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleSelect(goal.id, i)}
                disabled={!!selectedGoal}
                style={styles.cardTouch}
                accessibilityRole="button"
                accessibilityLabel={`${goal.title} — ${goal.desc}`}
                accessibilityState={{ disabled: !!selectedGoal }}
              >
                <LinearGradient
                  colors={goal.gradientColors}
                  style={[styles.card, { borderColor: goal.accentColor + '45' }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  {/* Top sheen */}
                  <LinearGradient
                    colors={[goal.accentColor + '1F', 'transparent']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.38 }}
                    style={styles.cardSheen}
                    pointerEvents="none"
                  />

                  {/* Selection border */}
                  <Animated.View
                    style={[
                      styles.selectionBorder,
                      { borderColor: goal.accentColor, opacity: selectionAnims[i].borderOpacity },
                    ]}
                    pointerEvents="none"
                  />

                  {/* Icon */}
                  <View style={[styles.iconCircle, { borderColor: goal.accentColor + '60', backgroundColor: goal.accentColor + '15' }]}>
                    <Ionicons name={goal.iconName} size={24} color={goal.accentColor} />
                  </View>

                  {/* Title */}
                  <Text style={[styles.cardTitle, { color: Colors.text.primary }]}>
                    {goal.title}
                  </Text>

                  {/* Description */}
                  <Text style={[styles.cardDesc, { color: Colors.text.primary }]}>
                    {goal.desc}
                  </Text>

                  {/* Checkmark */}
                  <Animated.View
                    style={[
                      styles.checkWrap,
                      {
                        backgroundColor: goal.accentColor,
                        transform: [{ scale: selectionAnims[i].checkScale }],
                      },
                    ]}
                  >
                    <Svg width={14} height={14} viewBox="0 0 16 16">
                      <Path
                        d="M3,8.5 L6.5,12 L13,4"
                        fill="none"
                        stroke="#14100C"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </Animated.View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Bottom chip */}
      <Animated.View style={[styles.bottomChip, s[6], { marginBottom: Math.max(insets.bottom + Spacing.xxl, Spacing.xxxl) }]}>
        <Text style={styles.chipText}>
          Your answers shape your spiritual journey
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mandalaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    top: height * 0.08,
    zIndex: 0,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: height * 0.07,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: 26,
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(245, 237, 227, 0.75)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  cardWrap: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.35,
  },
  cardTouch: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  cardSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 17,
  },
  selectionBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: Typography.fonts.serif,
    textAlign: 'center',
    lineHeight: 17,
    opacity: 0.72,
    paddingHorizontal: 4,
  },
  checkWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.15)',
    marginHorizontal: 24,
    marginBottom: 0,
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.70)',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },
});