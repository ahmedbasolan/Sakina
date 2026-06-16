import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../theme/DesignSystem';
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

export function HeroHeader({ fadeAnim, slideAnim, onSettingsPress, greeting }: HeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

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

      {/* Mandala — subtle background geometry */}
      <View style={styles.mandalaOuter} pointerEvents="none">
        <AnimatedMandala size={220} color={Colors.accent.primary} opacity={0.35} />
      </View>
      <View style={styles.mandalaInner} pointerEvents="none">
        <AnimatedMandala size={160} color={Colors.accent.primary} opacity={0.25} direction="ccw" />
      </View>

      {/* Top bar — settings only */}
      <Animated.View
        style={[
          styles.heroTopBar,
          { paddingTop: Math.max(insets.top, 20), opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <TouchableOpacity
          style={styles.notifBell}
          onPress={onSettingsPress}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="settings-outline" size={20} color={Colors.accent.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Greeting — time-of-day caption + salam, calm fade-in only (no slide) */}
      {!!greeting && (
        <Animated.View style={[styles.greetingBlock, { opacity: greetingFade }]}>
          <Text style={styles.greetingCaption}>{greeting}</Text>
          <Text style={styles.greetingTitle}>Assalamu Alaikum</Text>
        </Animated.View>
      )}

      {/* Bismillah — faded calligraphy centred over the mandala, same calm fade */}
      <Animated.Text style={[styles.bismillah, { opacity: greetingFade }]}>
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </Animated.Text>

    </View>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    position: 'relative',
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  mandalaOuter: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mandalaInner: {
    position: 'absolute',
    top: 50,
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
    marginTop: 36,
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
    lineHeight: 44,
    color: 'rgba(245, 237, 227, 0.62)',
    textAlign: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 24,
    marginTop: 22,
  },
  notifBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
