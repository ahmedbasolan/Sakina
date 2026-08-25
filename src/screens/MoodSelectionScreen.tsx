/**
 * MoodSelectionScreen
 *
 * Full-screen dark navy mood grid — opened from "See All" on HomeScreen.
 * 2-column bento grid with mood icon, Arabic name, English name, description.
 * Dark navy background, twinkling stars, animated mandala, from reference image.
 */
import React, { useEffect, useRef } from 'react';
import { Colors, Spacing, Typography } from '../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { AnimatedMandala } from '../components/AnimatedMandala';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { useAppContext } from '../context/AppContext';
import { fetchWindowGuidance } from '../services/guidanceWindowFetch';
import { Mood, GuidanceExperience } from '../types';

// Star positions scattered across the dark background
const STARS = [
  { x: 0.05, y: 0.04, s: 2.5, d: 0 },
  { x: 0.92, y: 0.06, s: 2, d: 500 },
  { x: 0.15, y: 0.12, s: 1.5, d: 250 },
  { x: 0.82, y: 0.10, s: 2, d: 750 },
  { x: 0.48, y: 0.07, s: 1.5, d: 100 },
  { x: 0.95, y: 0.22, s: 2.5, d: 600 },
  { x: 0.03, y: 0.30, s: 1.5, d: 350 },
];

import { MOOD_VISUALS as MOODS } from '../constants/moodData';

function TwinklingStar({ x, y, s: size, d: delay }: any) {
  const opacity = useRef(new Animated.Value(0.15)).current;
  const reduceMotion = useReduceMotion();
  useEffect(() => {
    if (reduceMotion) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.85, duration: 1400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.15, duration: 1400, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [reduceMotion]);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x * screenWidth,
        top: y * screenHeight,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.accent.primary,
        opacity,
        zIndex: 1,
      }}
    />
  );
}

function MoodCard({ mood, onPress, index, cardWidth }: { mood: typeof MOODS[0]; onPress: () => void; index: number; cardWidth: number }) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 400, delay: 100 + index * 60, useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1, friction: 8, tension: 100, delay: 100 + index * 60, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.moodCard, { width: cardWidth, backgroundColor: mood.bg, borderColor: mood.border }]}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${mood.label} — ${mood.description}`}
        accessibilityHint="Double tap to receive spiritual guidance for this mood"
      >
        {/* Arabic name top-right */}
        <Text style={[styles.arabicName, { color: mood.color }]}>{mood.arabic}</Text>

        {/* Mood icon */}
        <View style={[styles.iconCircle, { backgroundColor: `${mood.color}20`, borderColor: `${mood.color}30` }]}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill={mood.color}>
            <Path d={mood.icon} />
          </Svg>
        </View>

        {/* Labels */}
        <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>
        <Text style={styles.moodDesc}>{mood.description}</Text>

        {/* Right chevron */}
        <View style={styles.chevron}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill={mood.color}>
            <Path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </Svg>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MoodSelectionScreen({ navigation }: any) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - Spacing.xl * 2 - 12) / 2;
  const insets = useSafeAreaInsets();
  const { rotationEngine } = useAppContext();
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(MOODS.map(() => ({
    scale: new Animated.Value(1),
    opacity: new Animated.Value(1),
  }))).current;
  const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    return () => {
      if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    };
  }, []);

  const handleMoodSelect = (mood: (typeof MOODS)[0], index: number) => {
    if (transitionTimeout.current) {
      clearTimeout(transitionTimeout.current);
      cardAnims.forEach((a) => {
        a.scale.setValue(1);
        a.opacity.setValue(1);
      });
    }

    // Start the guidance fetch immediately so it resolves in parallel with the
    // 400ms card animation below instead of only starting once the animation
    // (plus a further artificial wait) has already finished.
    const guidancePromise = fetchWindowGuidance(rotationEngine, mood.key as Mood);

    Animated.spring(cardAnims[index].scale, {
      toValue: 1.05,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();

    cardAnims.forEach((a, i) => {
      if (i !== index) {
        Animated.parallel([
          Animated.timing(a.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(a.scale, { toValue: 0.95, duration: 400, useNativeDriver: true }),
        ]).start();
      }
    });

    transitionTimeout.current = setTimeout(async () => {
      // fetchWindowGuidance is hardened to resolve null rather than reject, but
      // guard here too so a rejection can never leave this async callback
      // without navigating — which would strand the user on the faded-out mood
      // cards below (they're only reset after navigate fires). GuidanceScreen's
      // safety-net effect re-fetches when it receives a null experience.
      let experience: GuidanceExperience | null = null;
      try {
        experience = await guidancePromise;
      } catch {
        /* degrade to null — GuidanceScreen will retry the fetch itself */
      }
      navigation.navigate('Guidance', {
        mood: mood.key,
        experience,
        islamicTerm: mood.label,
      });
      setTimeout(() => {
        cardAnims.forEach((a) => {
          a.scale.setValue(1);
          a.opacity.setValue(1);
        });
      }, 500);
    }, 400);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={Colors.celestialWash}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Ambient glow orb */}
      <View style={styles.glowOrb} pointerEvents="none" />

      {/* Twinkling stars */}
      {STARS.map((star, i) => <TwinklingStar key={i} {...star} />)}

      {/* Mandala backdrop */}
      <View style={styles.mandalaWrap} pointerEvents="none">
        <AnimatedMandala size={300} color={Colors.accent.primary} opacity={0.12} />
      </View>

      {/* Header */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 12, opacity: headerOpacity }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="rgba(201,168,76,0.8)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerPretitle}>YOUR HEART SPEAKS</Text>
          <Text style={styles.headerTitle}>ALLAH LISTENS</Text>
          <Text style={styles.headerSub}>
            Every emotion has divine guidance waiting.{'\n'}
            Choose how you feel right now.
          </Text>
          <Text style={styles.headerReassurance}>
            There&apos;s no wrong answer. Just be honest.
          </Text>
        </View>
      </Animated.View>

      {/* Mood grid */}
      <ScrollView
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.row}>
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
                cardWidth={cardWidth}
                onPress={() => handleMoodSelect(mood, i)}
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },

  glowOrb: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(201,168,76,0.05)',
    alignSelf: 'center',
    top: 60,
  },
  mandalaWrap: {
    position: 'absolute',
    alignSelf: 'center',
    top: 40,
    zIndex: 0,
  },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    zIndex: 2,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerPretitle: {
    fontSize: 11,
    color: 'rgba(201,168,76,0.6)',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: Typography.fonts.serif,
  },
  headerTitle: {
    fontSize: 26,
    color: '#F0E6D3',
    fontFamily: Typography.fonts.serif,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
    textShadowColor: 'rgba(201,168,76,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  headerReassurance: {
    fontSize: 13,
    color: `${Colors.text.primary}59`,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.2,
  },

  grid: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 8,
    zIndex: 2,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },

  moodCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    minHeight: 130,
    position: 'relative',
    overflow: 'hidden',
  },
  arabicName: {
    position: 'absolute',
    top: 12,
    right: 14,
    fontSize: 13,
    fontFamily: Typography.fonts.serif,
    opacity: 0.8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
    fontFamily: Typography.fonts.serif,
  },
  moodDesc: {
    fontSize: 11,
    color: Colors.text.muted,
    lineHeight: 16,
  },
  chevron: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
});