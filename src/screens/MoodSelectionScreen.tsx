/**
 * MoodSelectionScreen
 *
 * Full-screen dark navy mood grid — opened from "See All" on HomeScreen.
 * 2-column bento grid with mood icon, Arabic name, English name, description.
 * Dark navy background, twinkling stars, animated mandala, from reference image.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Colors, Spacing, Typography } from '../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { AnimatedMandala } from '../components/AnimatedMandala';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.xl * 2 - 12) / 2;

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

// Colors aligned with MoodColors in DesignSystem.ts (source of truth).
const MOODS = [
  {
    key: 'Grateful',
    arabic: 'شُكْر',
    label: 'GRATEFUL',
    description: 'Thankfulness fills your heart',
    color: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(251, 191, 36, 0.2)',
    icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  },
  {
    key: 'Hopeful',
    arabic: 'أَمَل',
    label: 'HOPEFUL',
    description: 'Light breaks through the clouds',
    color: '#22D3EE',
    bg: 'rgba(34, 211, 238, 0.08)',
    border: 'rgba(34, 211, 238, 0.2)',
    icon: 'M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z',
  },
  {
    key: 'Calm',
    arabic: 'سَكِينَة',
    label: 'CALM',
    description: 'Serenity settles in your soul',
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.08)',
    border: 'rgba(52, 211, 153, 0.2)',
    icon: 'M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l.95-2.3c.48.17.98.3 1.34.3 11 0 14-17 14-17-1 2-8 5.25-13 6.25-5 1-7 5.25-7 7.25 0 2 1.75 3.75 1.75 3.75C7 8 17 8 17 8z',
  },
  {
    key: 'Overwhelmed',
    arabic: 'إِرْهَاق',
    label: 'OVERWHELMED',
    description: 'The weight feels too heavy',
    color: '#818CF8',
    bg: 'rgba(129, 140, 248, 0.08)',
    border: 'rgba(129, 140, 248, 0.2)',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
  },
  {
    key: 'Sad',
    arabic: 'حُزْن',
    label: 'SAD',
    description: 'Tears are a form of prayer',
    color: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.08)',
    border: 'rgba(148, 163, 184, 0.2)',
    icon: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z',
  },
  {
    key: 'Angry',
    arabic: 'غَضَب',
    label: 'ANGRY',
    description: 'Fire that seeks peace',
    color: '#FB923C',
    bg: 'rgba(251, 146, 60, 0.08)',
    border: 'rgba(251, 146, 60, 0.2)',
    icon: 'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z',
  },
  {
    key: 'Lonely',
    arabic: 'وَحْدَة',
    label: 'LONELY',
    description: 'Allah is always near',
    color: '#C084FC',
    bg: 'rgba(192, 132, 252, 0.08)',
    border: 'rgba(192, 132, 252, 0.2)',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  },
  {
    key: 'Guilty',
    arabic: 'تَوْبَة',
    label: 'GUILT',
    description: 'Seeking forgiveness and return',
    color: '#A3A3A3',
    bg: 'rgba(163, 163, 163, 0.06)',
    border: 'rgba(163, 163, 163, 0.15)',
    icon: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
  },
];

function TwinklingStar({ x, y, s: size, d: delay }: any) {
  const opacity = useRef(new Animated.Value(0.15)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.85, duration: 1400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.15, duration: 1400, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x * width,
        top: y * height,
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

function MoodCard({ mood, onPress, index }: { mood: typeof MOODS[0]; onPress: () => void; index: number }) {
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
        style={[styles.moodCard, { backgroundColor: mood.bg, borderColor: mood.border }]}
        onPress={onPress}
        activeOpacity={0.8}
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
  const insets = useSafeAreaInsets();
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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

    setSelectedIndex(index);

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

    transitionTimeout.current = setTimeout(() => {
      navigation.navigate('Guidance', { mood: mood.key });
      setTimeout(() => {
        setSelectedIndex(null);
        cardAnims.forEach((a) => {
          a.scale.setValue(1);
          a.opacity.setValue(1);
        });
      }, 500);
    }, 800);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#07111E', '#0C1A2E', '#0E1F30']}
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
            There's no wrong answer. Just be honest.
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
  container: { flex: 1, backgroundColor: '#07111E' },

  glowOrb: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(201,168,76,0.05)',
    left: width / 2 - 125,
    top: 60,
  },
  mandalaWrap: {
    position: 'absolute',
    left: width / 2 - 150,
    top: 40,
    zIndex: 0,
  },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    zIndex: 2,
  },
  backBtn: {
    marginBottom: 20,
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
    color: 'rgba(176,196,215,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  headerReassurance: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.35)',
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
    width: CARD_WIDTH,
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
    color: 'rgba(176,196,215,0.65)',
    lineHeight: 16,
  },
  chevron: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
});