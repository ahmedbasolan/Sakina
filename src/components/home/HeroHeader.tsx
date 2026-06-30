import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../theme/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedMandala } from '../AnimatedMandala';
import { TwinklingStar } from './TwinklingStar';
import { useReduceMotion } from '../../hooks/useReduceMotion';

const starPositions = [
  { x: 0.08, y: 0.12, delay: 0,   size: 2 },
  { x: 0.88, y: 0.08, delay: 400, size: 2 },
  { x: 0.75, y: 0.28, delay: 700, size: 2.5 },
  { x: 0.50, y: 0.18, delay: 200, size: 1.5 },
];

interface HeroHeaderProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  onSettingsPress: () => void;
  greeting?: string;
}

const SETTINGS_ICON_SIZE = 22;

// Mandala sizing constants — both rings share the same visual center.
// inner.top = MANDALA_TOP + (OUTER_SIZE - INNER_SIZE) / 2
// guarantees true concentricity regardless of individual sizes.
const MANDALA_TOP = 10;
const OUTER_SIZE = 300;
const INNER_SIZE = 220;

export function HeroHeader({ fadeAnim, slideAnim, onSettingsPress, greeting }: HeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  // Single source of truth for safe-area floor used by both the top bar and
  // the greeting block — avoids the two expressions drifting apart.
  const safeTop = Math.max(insets.top, 20);

  // The greeting reveals on its own — a calm opacity-only fade (no slide, no
  // pulse), slightly delayed so it settles in above the Verse of the Day.
  const greetingFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      greetingFade.setValue(1);
      return;
    }
    const anim = Animated.timing(greetingFade, {
      toValue: 1,
      duration: 900,
      delay: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduceMotion, greetingFade]);

  return (
    <View style={styles.heroHeader}>
      {/* Twinkling stars */}
      {starPositions.map((s, i) => (
        <TwinklingStar key={i} x={s.x} y={s.y} delay={s.delay} size={s.size} />
      ))}

      {/* Mandala — outer + inner share the same center (see MANDALA_TOP constants above) */}
      <View style={styles.mandalaOuter} pointerEvents="none">
        <AnimatedMandala size={OUTER_SIZE} color={Colors.accent.primary} opacity={0.35} webLayers={2} />
      </View>
      <View style={styles.mandalaInner} pointerEvents="none">
        <AnimatedMandala size={INNER_SIZE} color={Colors.accent.primary} opacity={0.25} direction="ccw" webLayers={2} />
      </View>

      {/* Top bar — settings only */}
      <Animated.View
        style={[
          styles.heroTopBar,
          { paddingTop: safeTop, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <TouchableOpacity
          onPress={onSettingsPress}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="settings-outline" size={SETTINGS_ICON_SIZE} color={Colors.accent.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Greeting — time-of-day caption + salam, calm fade-in only (no slide) */}
      {!!greeting && (
        <Animated.View style={[styles.greetingBlock, { opacity: greetingFade, marginTop: safeTop + SETTINGS_ICON_SIZE + Spacing.sm }]}>
          <Text style={styles.greetingCaption}>{greeting}</Text>
          <Text style={styles.greetingTitle}>Assalamu Alaikum</Text>
        </Animated.View>
      )}

      {/* Bismillah — gold calligraphy centred over the mandala, same calm fade */}
      <Animated.Text style={[styles.bismillah, { opacity: greetingFade }]}>
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </Animated.Text>

    </View>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    position: 'relative',
    paddingTop: 0,
    paddingBottom: Spacing.xs,
    alignItems: 'center',
  },
  mandalaOuter: {
    position: 'absolute',
    top: MANDALA_TOP,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mandalaInner: {
    position: 'absolute',
    top: MANDALA_TOP + (OUTER_SIZE - INNER_SIZE) / 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  heroTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
  },
  greetingBlock: {
    alignSelf: 'stretch',
    paddingHorizontal: 24,
  },
  greetingCaption: {
    fontSize: 12,
    color: Colors.accent.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 6,
  },
  greetingTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: 26,
    color: '#F0E6D3',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(201, 168, 76, 0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  bismillah: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 24,
    lineHeight: 52,
    color: Colors.accent.light,
    textAlign: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    marginTop: Spacing.sm,
    textShadowColor: 'rgba(232, 200, 106, 0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
});
