import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedMandala } from '../AnimatedMandala';
import { TwinklingStar } from './TwinklingStar';

// Reduced from 8 to 4 — each TwinklingStar runs its own Animated.loop.
// 8 simultaneous loops caused a 30–80ms frame-budget miss at mount on mid-range Android.
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

  // ── Entrance animation (runs once on mount, inside header only) ──
  const entranceBismillahAnim = useRef(new Animated.Value(0)).current;
  const entranceOverlayAnim = useRef(new Animated.Value(1)).current;
  const [entranceDone, setEntranceDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Bismillah fades in → holds → overlay fades out
      Animated.sequence([
        Animated.timing(entranceBismillahAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.delay(1400),
        Animated.timing(entranceOverlayAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]).start(() => setEntranceDone(true));
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.heroHeader}>
      {/* Ambient glow orb */}
      <View style={styles.glowOrb} pointerEvents="none" />

      {/* Twinkling Stars */}
      {starPositions.map((s, i) => (
        <TwinklingStar key={i} x={s.x} y={s.y} delay={s.delay} size={s.size} />
      ))}

      {/* Animated Mandala - outer (clockwise) */}
      <View style={styles.mandalaOuter} pointerEvents="none">
        <AnimatedMandala size={220} color={Colors.accent.primary} opacity={0.35} />
      </View>
      {/* Animated Mandala - inner (counter-clockwise) */}
      <View style={styles.mandalaInner} pointerEvents="none">
        <AnimatedMandala size={160} color={Colors.accent.primary} opacity={0.25} direction="ccw" />
      </View>

      {/* Top bar — normal content */}
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

        {/* Settings icon */}
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

      {/* Bismillah — always visible below top bar */}
      <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>

      {/* ── Entrance overlay (constrained to header bounds) ─────── */}
      {!entranceDone && (
        <Animated.View
          style={[styles.entranceOverlay, { opacity: entranceOverlayAnim }]}
          pointerEvents="none"
        >
          <Animated.View style={[styles.entranceSlot, { opacity: entranceBismillahAnim }]}>
            <Text style={styles.entranceBismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
            <Text style={styles.entranceBismillahSub}>
              In the name of Allah, the Most Gracious, the Most Merciful
            </Text>
          </Animated.View>
        </Animated.View>
      )}
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
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bismillah: {
    fontSize: 20,
    color: 'rgba(245, 237, 227, 0.4)',
    marginTop: 20,
    fontFamily: 'Amiri-Regular',
  },

  /* ── Entrance overlay ──────────────────────────────────────── */
  entranceOverlay: {
    ...StyleSheet.absoluteFillObject,
    // No background — stars and mandala show through
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  entranceSlot: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  entranceBismillah: {
    fontSize: 28,
    color: Colors.accent.primary,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 10,
    textShadowColor: 'rgba(212, 175, 55, 0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  entranceBismillahSub: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 12,
    color: 'rgba(245, 237, 227, 0.38)',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.3,
    lineHeight: 18,
  },
});
