/**
 * Screen 3: Heart Check-In
 *
 * "How Is Your Heart?" — all 8 mood cards in a 2-column layout.
 * Dark navy background with twinkling stars + AnimatedMandala backdrop.
 * Selecting a mood saves it to AsyncStorage and auto-advances.
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { AnimatedMandala } from '../AnimatedMandala';
import { InteractiveStarfield } from './InteractiveStarfield';
import { Mood } from '../../types';

const { width, height } = Dimensions.get('window');
const CARD_W = (width - 56 - 12) / 2;

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
  color: string;
  bgColor: string;
  iconName: string;
}

const MOODS: MoodOption[] = [
  { id: 'Grateful', label: 'GRATEFUL', sublabel: 'Shukr', color: '#34D399', bgColor: '#0C2214', iconName: 'heart' },
  { id: 'Hopeful', label: 'HOPEFUL', sublabel: 'Amal', color: '#FBBF24', bgColor: '#1A1608', iconName: 'sunny' },
  { id: 'Calm', label: 'PEACEFUL', sublabel: 'Sukoon', color: '#60A5FA', bgColor: '#0C1A2E', iconName: 'water' },
  { id: 'Overwhelmed', label: 'OVERWHELMED', sublabel: 'Ghamm', color: '#14B8A6', bgColor: '#0C1E1E', iconName: 'layers' },
  { id: 'Tired', label: 'TIRED', sublabel: 'Ta\u0027ab', color: '#9CA3AF', bgColor: '#14161A', iconName: 'moon' },
  { id: 'Lonely', label: 'LONELY', sublabel: 'Wahshah', color: '#A78BFA', bgColor: '#180E2E', iconName: 'person' },
  { id: 'Sad', label: 'SAD', sublabel: 'Huzn', color: '#60A5FA', bgColor: '#0C1526', iconName: 'rainy' },
  { id: 'Angry', label: 'ANGRY', sublabel: 'Ghadab', color: '#F87171', bgColor: '#1E0C0C', iconName: 'flame' },
];

const STORAGE_KEY = '@onboarding_mood';

interface Props {
  isActive: boolean;
  onNext: () => void;
}

export default function HeartCheckInScreen({ isActive, onNext }: Props) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  // [0] arabic, [1] title, [2] subtitle, [3-10] mood cards
  const s = useStaggerEntry(isActive, 11, { baseDelay: 200, stagger: 70 });

  const cardDimAnims = useRef(MOODS.map(() => new Animated.Value(1))).current;
  const checkScales = useRef(MOODS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!isActive) return;
    setSelectedMood(null);
    cardDimAnims.forEach(a => a.setValue(1));
    checkScales.forEach(a => a.setValue(0));
  }, [isActive]);

  const handleSelect = useCallback((moodId: string, index: number) => {
    if (selectedMood) return;
    setSelectedMood(moodId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    AsyncStorage.setItem(STORAGE_KEY, moodId).catch(() => {});

    // Show check
    Animated.spring(checkScales[index], {
      toValue: 1, damping: 10, stiffness: 200, useNativeDriver: true,
    }).start();

    // Dim others
    cardDimAnims.forEach((a, i) => {
      if (i !== index) {
        Animated.timing(a, { toValue: 0.3, duration: 300, useNativeDriver: true }).start();
      }
    });

    setTimeout(() => onNext(), 800);
  }, [selectedMood, onNext]);

  return (
    <View style={styles.container}>
      {/* Stars */}
      <InteractiveStarfield positions={STAR_POS.map(p => ({ ...p, y: p.y * 1.5 }))} />

      {/* Mandala backdrop */}
      <View style={styles.mandalaWrap} pointerEvents="none">
        <AnimatedMandala size={280} color={Colors.accent.primary} opacity={0.045} />
      </View>

      <View style={styles.contentArea}>
        {/* Arabic title */}
        <Animated.Text style={[styles.arabicTitle, s[0]]}>
          كيف حال قلبك
        </Animated.Text>

        {/* Title */}
        <Animated.Text style={[styles.title, s[1]]}>
          How Is Your Heart?
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, s[2]]}>
          Choose the emotion closest to how you feel right now
        </Animated.Text>

        {/* 2-column mood grid */}
        <View style={styles.grid}>
          {MOODS.map((mood, i) => (
            <Animated.View
              key={mood.id}
              style={[
                styles.cardWrap,
                s[i + 3],
                { opacity: Animated.multiply(s[i + 3].opacity, cardDimAnims[i]) },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleSelect(mood.id, i)}
                disabled={!!selectedMood}
                style={[styles.card, { backgroundColor: mood.bgColor, borderColor: mood.color + '20' }]}
              >
                {/* Icon */}
                <View style={[styles.iconCircle, { borderColor: mood.color + '30', backgroundColor: mood.color + '10' }]}>
                  <Ionicons name={mood.iconName as any} size={20} color={mood.color} />
                </View>

                {/* Labels */}
                <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>
                <Text style={[styles.moodSublabel, { color: mood.color, opacity: 0.55 }]}>{mood.sublabel}</Text>

                {/* Check */}
                <Animated.View style={[
                  styles.checkCircle,
                  { backgroundColor: mood.color, transform: [{ scale: checkScales[i] }] }
                ]}>
                  <Ionicons name="checkmark" size={12} color="#0C1A2E" />
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mandalaWrap: {
    position: 'absolute',
    left: width / 2 - 140, top: height * 0.02, zIndex: 0,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  arabicTitle: {
    fontSize: 22,
    color: 'rgba(201,168,76,0.6)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 8,
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
    fontSize: 14,
    color: 'rgba(176,196,215,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  cardWrap: {
    width: CARD_W,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  moodSublabel: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
  },
  checkCircle: {
    position: 'absolute',
    top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
});