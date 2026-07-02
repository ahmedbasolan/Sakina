/**
 * Screen 5: First Guidance — Personalized Verse Reveal
 *
 * Reads the mood saved during HeartCheckInScreen.
 * Arabic words reveal one by one with a staggered fade-in.
 * Translation and reference appear after the Arabic settles.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Colors, Typography, Spacing } from '../../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { AnimatedMandala } from '../AnimatedMandala';
import { InteractiveStarfield } from './InteractiveStarfield';
import { GoldenMotes } from '../GoldenMotes';

const { width, height } = Dimensions.get('window');

const STAR_POS = [
  { x: 0.08, y: 0.04, s: 2.5, d: 0 },
  { x: 0.90, y: 0.06, s: 2,   d: 400 },
  { x: 0.15, y: 0.18, s: 1.5, d: 200 },
  { x: 0.82, y: 0.12, s: 2,   d: 700 },
  { x: 0.50, y: 0.08, s: 1.5, d: 100 },
  { x: 0.94, y: 0.26, s: 2.5, d: 550 },
  { x: 0.04, y: 0.35, s: 1.5, d: 350 },
];

// Curated first-guidance verses per mood — Arabic split into words for reveal
const MOOD_VERSES: Record<string, {
  words: string[];        // Arabic broken by spaces for word-by-word reveal
  arabic: string;         // Full Arabic (for accessibility / layout ref)
  translation: string;
  ref: string;
  pretitle: string;       // Poetic context line
}> = {
  Grateful: {
    words: ['لَئِن', 'شَكَرْتُمْ', 'لَأَزِيدَنَّكُمْ'],
    arabic: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    translation: 'If you are grateful, I will surely increase you in favour.',
    ref: 'Surah Ibrahim · 14:7',
    pretitle: 'For the grateful heart',
  },
  Hopeful: {
    words: ['إِنَّ', 'مَعَ', 'الْعُسْرِ', 'يُسْرًا'],
    arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'Indeed, with hardship comes ease.',
    ref: 'Surah Ash-Sharh · 94:6',
    pretitle: 'For the hopeful soul',
  },
  Calm: {
    words: ['أَلَا', 'بِذِكْرِ', 'اللَّهِ', 'تَطْمَئِنُّ', 'الْقُلُوبُ'],
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translation: 'Verily, in the remembrance of Allah do hearts find rest.',
    ref: "Surah Ar-Ra'd · 13:28",
    pretitle: 'For the peaceful heart',
  },
  Overwhelmed: {
    words: ['لَا', 'يُكَلِّفُ', 'اللَّهُ', 'نَفْسًا', 'إِلَّا', 'وُسْعَهَا'],
    arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    translation: 'Allah does not burden a soul beyond that it can bear.',
    ref: 'Surah Al-Baqarah · 2:286',
    pretitle: 'For the overwhelmed spirit',
  },
  Tired: {
    words: ['وَمَن', 'يَتَّقِ', 'اللَّهَ', 'يَجْعَل', 'لَّهُ', 'مَخْرَجًا'],
    arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
    translation: 'Whoever fears Allah — He will make for him a way out.',
    ref: 'Surah At-Talaq · 65:2',
    pretitle: 'For the weary traveller',
  },
  Lonely: {
    words: ['وَهُوَ', 'مَعَكُمْ', 'أَيْنَ', 'مَا', 'كُنتُمْ'],
    arabic: 'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ',
    translation: 'And He is with you wherever you are.',
    ref: 'Surah Al-Hadid · 57:4',
    pretitle: 'For the lonely heart',
  },
  Sad: {
    words: ['لَا', 'تَقْنَطُوا', 'مِن', 'رَّحْمَةِ', 'اللَّهِ'],
    arabic: 'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
    translation: 'Do not despair of the mercy of Allah.',
    ref: 'Surah Az-Zumar · 39:53',
    pretitle: 'For the saddened soul',
  },
  Angry: {
    words: ['وَالْكَاظِمِينَ', 'الْغَيْظَ', 'وَالْعَافِينَ', 'عَنِ', 'النَّاسِ'],
    arabic: 'وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ',
    translation: 'Those who restrain anger and pardon people — Allah loves the doers of good.',
    ref: 'Surah Aal-Imran · 3:134',
    pretitle: 'For the tested heart',
  },
};

const DEFAULT_VERSE = MOOD_VERSES.Calm;
const WORD_STAGGER_MS = 220;

interface Props {
  isActive: boolean;
  onNext: () => void;
}

// Renders a single Arabic word that fades+slides in after `delay` ms
function RevealWord({ word, delay, isActive }: { word: string; delay: number; isActive: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (!isActive) {
      opacity.setValue(0);
      translateY.setValue(8);
      return;
    }
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, [isActive]);

  return (
    <Animated.Text style={[styles.arabicWord, { opacity, transform: [{ translateY }] }]}>
      {word}{' '}
    </Animated.Text>
  );
}

export default function FirstGuidanceScreen({ isActive, onNext }: Props) {
  const [verse, setVerse] = useState(DEFAULT_VERSE);
  const insets = useSafeAreaInsets();

  // [0] pretitle+line, [1] ornament after last word, [2] translation, [3] ref
  const s = useStaggerEntry(isActive, 4, {
    baseDelay: verse.words.length * WORD_STAGGER_MS + 400,
    stagger: 180,
  });

  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const chipOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) return;
    const wordsDone = verse.words.length * WORD_STAGGER_MS + 600;

    const chipTimer = setTimeout(() => {
      Animated.timing(chipOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    }, wordsDone + 800);
    const ctaTimer = setTimeout(() => {
      Animated.timing(ctaOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    }, wordsDone + 1200);

    return () => { clearTimeout(chipTimer); clearTimeout(ctaTimer); };
  }, [isActive, verse.words.length]);

  useEffect(() => {
    if (!isActive) return;
    AsyncStorage.getItem('@onboarding_mood').then(mood => {
      if (mood && MOOD_VERSES[mood]) setVerse(MOOD_VERSES[mood]);
    }).catch(() => {});
  }, [isActive]);

  const forceShowCta = () => {
    if (!isActive) return;
    ctaOpacity.setValue(1);
    chipOpacity.setValue(1);
  };

  return (
    <View style={styles.container} onTouchEnd={forceShowCta}>
      <InteractiveStarfield positions={STAR_POS.map(p => ({ ...p, y: p.y * 1.5 }))} />

      <View style={styles.mandalaOuter} pointerEvents="none">
        <AnimatedMandala size={320} color={Colors.accent.primary} opacity={0.15} webLayers={2} />
      </View>

      <GoldenMotes />

      <View style={[styles.contentArea, { paddingTop: insets.top + 72 }]}>
        {/* Poetic pretitle */}
        <Animated.Text style={[styles.pretitle, s[0]]}>
          {verse.pretitle}
        </Animated.Text>

        {/* Gold divider */}
        <Animated.View style={[styles.goldLineWrap, s[0]]}>
          <LinearGradient
            colors={['transparent', Colors.accent.primary, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.goldLine}
          />
        </Animated.View>

        {/* Arabic verse — word-by-word reveal */}
        <View style={styles.arabicWrap}>
          {verse.words.map((word, i) => (
            <RevealWord
              key={`${word}-${i}`}
              word={word}
              delay={600 + i * WORD_STAGGER_MS}
              isActive={isActive}
            />
          ))}
        </View>

        {/* Ornament separator */}
        <Animated.Text style={[styles.ornament, s[1]]}>✦</Animated.Text>

        {/* Translation */}
        <Animated.Text style={[styles.translation, s[2]]}>
          {verse.translation}
        </Animated.Text>

        {/* Reference */}
        <Animated.Text style={[styles.reference, s[3]]}>
          — {verse.ref}
        </Animated.Text>
      </View>

      {/* Bottom */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom + Spacing.xxl, Spacing.xxxl) }]}>
        <Animated.Text style={[styles.journeyWhisper, { opacity: chipOpacity }]}>
          ✦ Your journey has already begun
        </Animated.Text>

        <Animated.View style={[styles.ctaWrap, { opacity: ctaOpacity }]}>
          <TouchableOpacity
            style={styles.ctaBtn}
            activeOpacity={0.85}
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
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
    left: 0,
    right: 0,
    alignItems: 'center',
    top: height * 0.25,
    zIndex: 0,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    zIndex: 2,
  },
  pretitle: {
    fontSize: 13,
    color: 'rgba(212, 175, 55, 0.85)',
    letterSpacing: 1.2,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontFamily: Typography.fonts.serif,
    fontStyle: 'italic',
  },
  goldLineWrap: {
    width: width * 0.55,
    height: 1.5,
    marginBottom: Spacing.xxl,
  },
  goldLine: {
    flex: 1,
    borderRadius: 1,
  },
  arabicWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
    paddingTop: 10,
    paddingBottom: 28,
  },
  arabicWord: {
    fontSize: 30,
    color: Colors.text.primary,
    fontFamily: Typography.fonts.arabic,
    lineHeight: 72,
    textAlign: 'center',
    textShadowColor: 'rgba(212, 175, 55, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  ornament: {
    fontSize: 16,
    color: 'rgba(212, 175, 55, 0.65)',
    marginBottom: Spacing.lg,
  },
  translation: {
    fontSize: 17,
    color: 'rgba(245, 237, 227, 0.92)',
    textAlign: 'center',
    lineHeight: 27,
    fontStyle: 'italic',
    fontFamily: Typography.fonts.serif,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    textShadowColor: Colors.accent.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  reference: {
    fontSize: 13,
    color: 'rgba(212, 175, 55, 0.75)',
    fontFamily: Typography.fonts.serif,
    letterSpacing: 0.6,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    zIndex: 2,
  },
  journeyWhisper: {
    fontSize: 13,
    color: Colors.accent.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
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
    fontFamily: Typography.fonts.serif,
    fontSize: 17,
    letterSpacing: 1.5,
    fontWeight: '600',
    color: Colors.background.secondary,
  },
});
