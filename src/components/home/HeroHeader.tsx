import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedMandala } from '../AnimatedMandala';
import { TwinklingStar } from './TwinklingStar';

const starPositions = [
  { x: 0.08, y: 0.12, delay: 0, size: 2 },
  { x: 0.88, y: 0.08, delay: 400, size: 2 },
  { x: 0.20, y: 0.35, delay: 800, size: 1.5 },
  { x: 0.75, y: 0.28, delay: 1200, size: 2.5 },
  { x: 0.50, y: 0.18, delay: 200, size: 1.5 },
  { x: 0.95, y: 0.45, delay: 1600, size: 2 },
  { x: 0.05, y: 0.60, delay: 600, size: 1.5 },
  { x: 0.92, y: 0.72, delay: 1000, size: 2 },
];

interface HeroHeaderProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  onSettingsPress: () => void;
  greeting?: string;
}

export function HeroHeader({ fadeAnim, slideAnim, onSettingsPress, greeting }: HeroHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.heroHeader}>
      {/* Ambient glow orb */}
      <View style={styles.glowOrb} pointerEvents="none" />

      {/* Twinkling Stars */}
      {starPositions.map((s, i) => (
        <TwinklingStar key={i} x={s.x} y={s.y} delay={s.delay} size={s.size} />
      ))}

      {/* Animated Mandala - outer */}
      <View style={styles.mandalaOuter} pointerEvents="none">
        <AnimatedMandala size={220} color={Colors.accent.primary} opacity={0.35} />
      </View>
      {/* Animated Mandala - inner (counter-rotates) */}
      <View style={styles.mandalaInner} pointerEvents="none">
        <AnimatedMandala size={160} color={Colors.accent.primary} opacity={0.25} direction="ccw" />
      </View>

      {/* Top bar */}
      <Animated.View
        style={[
          styles.heroTopBar,
          { paddingTop: Math.max(insets.top, 20), opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View>
          <Text style={styles.greetingText}>{greeting ?? 'Good Morning'}</Text>
          <Text style={styles.heroTitle}>Assalamu Alaikum</Text>
        </View>

        {/* Notification bell — top right */}
        <TouchableOpacity
          style={styles.notifBell}
          onPress={onSettingsPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={20} color={Colors.accent.primary} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </Animated.View>

      {/* Bismillah */}
      <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
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
  glowOrb: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Colors.accent.primary,
    opacity: 0.08,
    filter: 'blur(80px)',
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
  },
  greetingText: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.5)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F5EDE3',
    letterSpacing: -0.5,
  },
  notifBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 211, 198, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F87171',
  },
  bismillah: {
    fontSize: 20,
    color: 'rgba(245, 237, 227, 0.4)',
    marginTop: 20,
    fontFamily: 'Amiri-Regular',
  },
});
