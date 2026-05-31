/**
 * Screen 5: First Guidance — Personalized Verse Reveal
 *
 * Reads the mood saved during HeartCheckInScreen.
 * Displays a real verse matching that mood from the curated bank.
 * Dark navy background, twinkling stars, AnimatedMandala, gold accents.
 */
import React, { useEffect, useRef, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { AnimatedMandala } from '../AnimatedMandala';
import { InteractiveStarfield } from './InteractiveStarfield';
import { GoldenMotes } from '../GoldenMotes';

const { width, height } = Dimensions.get('window');

const STAR_POS = [
  { x: 0.08, y: 0.04, s: 2.5, d: 0 },
  { x: 0.90, y: 0.06, s: 2, d: 400 },
  { x: 0.15, y: 0.18, s: 1.5, d: 200 },
  { x: 0.82, y: 0.12, s: 2, d: 700 },
  { x: 0.50, y: 0.08, s: 1.5, d: 100 },
  { x: 0.94, y: 0.26, s: 2.5, d: 550 },
  { x: 0.04, y: 0.35, s: 1.5, d: 350 },
];

// Curated first-guidance verses per mood
const MOOD_VERSES: Record<string, { arabic: string; translation: string; ref: string }> = {
  Grateful: {
    arabic: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    translation: '"If you are grateful, I will surely increase you [in favor]."',
    ref: 'Surah Ibrahim 14:7',
  },
  Hopeful: {
    arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: '"Indeed, with hardship comes ease."',
    ref: 'Surah Ash-Sharh 94:6',
  },
  Calm: {
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translation: '"Verily, in the remembrance of Allah do hearts find rest."',
    ref: 'Surah Ar-Ra\'d 13:28',
  },
  Overwhelmed: {
    arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    translation: '"Allah does not burden a soul beyond that it can bear."',
    ref: 'Surah Al-Baqarah 2:286',
  },
  Tired: {
    arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
    translation: '"Whoever fears Allah — He will make for him a way out."',
    ref: 'Surah At-Talaq 65:2',
  },
  Lonely: {
    arabic: 'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ',
    translation: '"And He is with you wherever you are."',
    ref: 'Surah Al-Hadid 57:4',
  },
  Sad: {
    arabic: 'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
    translation: '"Do not despair of the mercy of Allah."',
    ref: 'Surah Az-Zumar 39:53',
  },
  Angry: {
    arabic: 'وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ',
    translation: '"Those who restrain anger and pardon people — and Allah loves the doers of good."',
    ref: 'Surah Aal-Imran 3:134',
  },
};

const DEFAULT_VERSE = MOOD_VERSES.Calm;

// Maps stored mood id → human-readable display label shown in pretitle
const MOOD_DISPLAY_LABELS: Record<string, string> = {
  Grateful: 'Grateful',
  Hopeful: 'Hopeful',
  Calm: 'Peaceful',
  Overwhelmed: 'Overwhelmed',
  Tired: 'Tired',
  Lonely: 'Lonely',
  Sad: 'Sad',
  Angry: 'Angry',
};

interface Props {
  isActive: boolean;
  onNext: () => void;
}

export default function FirstGuidanceScreen({ isActive, onNext }: Props) {
  const [verse, setVerse] = useState(DEFAULT_VERSE);
  const [moodLabel, setMoodLabel] = useState('');

  // [0] pretitle, [1] goldLine, [2] arabic, [3] ornament, [4] translation, [5] ref, [6] chip, [7] CTA
  const s = useStaggerEntry(isActive, 8, { baseDelay: 400, stagger: 160 });

  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const chipOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) return;

    const chipTimer = setTimeout(() => {
      Animated.timing(chipOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, 2000);

    const ctaTimer = setTimeout(() => {
      Animated.timing(ctaOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, 2500);

    return () => {
      clearTimeout(chipTimer);
      clearTimeout(ctaTimer);
    };
  }, [isActive]);

  const forceShowCta = () => {
    ctaOpacity.setValue(1);
    chipOpacity.setValue(1);
  };

  useEffect(() => {
    if (!isActive) return;
    AsyncStorage.getItem('@onboarding_mood').then(mood => {
      if (mood && MOOD_VERSES[mood]) {
        setVerse(MOOD_VERSES[mood]);
        setMoodLabel(MOOD_DISPLAY_LABELS[mood] ?? mood);
      }
    }).catch(() => {});
  }, [isActive]);

  return (
    <View style={styles.container} onTouchEnd={forceShowCta}>
      {/* Stars */}
      <InteractiveStarfield positions={STAR_POS.map(p => ({ ...p, y: p.y * 1.5 }))} />

      {/* Mandala */}
      <View style={styles.mandalaOuter} pointerEvents="none">
        <AnimatedMandala size={320} color={Colors.accent.primary} opacity={0.06} />
      </View>
      <View style={styles.mandalaInner} pointerEvents="none">
        <AnimatedMandala size={200} color={Colors.accent.primary} opacity={0.035} direction="ccw" />
      </View>

      <GoldenMotes />

      <View style={styles.contentArea}>
        {/* Pre-title */}
        <Animated.Text style={[styles.pretitle, s[0]]}>
          {moodLabel
            ? `Based on how you feel — ${moodLabel}`
            : 'A verse chosen for you'}
        </Animated.Text>

        {/* Gold line */}
        <Animated.View style={[styles.goldLineWrap, s[1]]}>
          <LinearGradient
            colors={['transparent', Colors.accent.primary, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.goldLine}
          />
        </Animated.View>

        {/* Arabic verse */}
        <Animated.Text style={[styles.arabic, s[2]]}>
          {verse.arabic}
        </Animated.Text>

        {/* Ornament */}
        <Animated.Text style={[styles.ornament, s[3]]}>✦</Animated.Text>

        {/* Translation */}
        <Animated.Text style={[styles.translation, s[4]]}>
          {verse.translation}
        </Animated.Text>

        {/* Reference */}
        <Animated.Text style={[styles.reference, s[5]]}>
          — {verse.ref}
        </Animated.Text>
      </View>

      {/* Bottom */}
      <View style={styles.bottomSection}>
        {/* Journey whisper */}
        <Animated.Text style={[styles.journeyWhisper, { opacity: chipOpacity }]}>
          ✦ Your journey has already begun
        </Animated.Text>

        {/* CTA */}
        <Animated.View style={[styles.ctaWrap, { opacity: ctaOpacity }]}>
          <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={onNext}>
            <LinearGradient
              colors={['#E8C84A', '#B8860B']}
              style={styles.ctaBtnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.ctaText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mandalaOuter: {
    position: 'absolute',
    left: width / 2 - 160, top: height * 0.06, zIndex: 0,
  },
  mandalaInner: {
    position: 'absolute',
    left: width / 2 - 100, top: height * 0.13, zIndex: 0,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 2,
  },
  pretitle: {
    fontSize: 13,
    color: 'rgba(201,168,76,0.65)',
    letterSpacing: 0.8,
    marginBottom: 16,
    textAlign: 'center',
  },
  goldLineWrap: {
    width: width * 0.55,
    height: 1.5,
    marginBottom: 28,
  },
  goldLine: {
    flex: 1,
    borderRadius: 1,
  },
  arabic: {
    fontSize: 26,
    color: '#F0E6D3',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 18,
    textShadowColor: 'rgba(201,168,76,0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  ornament: {
    fontSize: 16,
    color: 'rgba(201,168,76,0.5)',
    marginBottom: 18,
  },
  translation: {
    fontSize: 16,
    color: 'rgba(176,196,215,0.85)',
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  reference: {
    fontSize: 13,
    color: 'rgba(201,168,76,0.55)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: height * 0.10,
    gap: 14,
    zIndex: 2,
  },
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
  ctaWrap: { width: '100%' },
  ctaBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  ctaBtnGradient: {
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  ctaText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 17,
    letterSpacing: 1.5,
    fontWeight: '600',
    color: '#0C1A2E',
  },
});