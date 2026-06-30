/**
 * StreakCenterTab
 *
 * Elevated circular center tab button for the STREAK tab.
 * Shows a flame icon with sustained ember glow and an initial flash-in
 * "spark" animation. An optional streak count badge can be passed in.
 *
 * Replaced the earlier mood-based center tab.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/DesignSystem';
import { useReduceMotion } from '../hooks/useReduceMotion';

interface Props {
  focused: boolean;
  streakCount?: number;
}

// Flame palette: warm amber / orange.
const FLAME_COLOR = '#F59E0B';

export default function StreakCenterTab({ focused, streakCount }: Props) {
  const reduceMotion = useReduceMotion();
  // Outer ring pulse — sustained ember glow
  const outerPulse = useRef(new Animated.Value(1)).current;
  // Inner glow opacity
  const innerGlow = useRef(new Animated.Value(0.3)).current;
  // Spark flash on mount
  const sparkFlash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(sparkFlash, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(sparkFlash, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    if (reduceMotion) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(outerPulse, { toValue: 1.12, duration: 2400, useNativeDriver: true }),
        Animated.timing(outerPulse, { toValue: 1, duration: 2400, useNativeDriver: true }),
      ]),
    );
    pulse.start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(innerGlow, { toValue: 0.7, duration: 2000, useNativeDriver: true }),
        Animated.timing(innerGlow, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ]),
    );
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, [reduceMotion]);

  const hasStreak = typeof streakCount === 'number' && streakCount > 0;

  return (
    <View style={styles.container}>
      {/* Outer pulsing glow ring */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            backgroundColor: `${FLAME_COLOR}18`,
            borderColor: `${FLAME_COLOR}30`,
            transform: [{ scale: outerPulse }],
          },
        ]}
      />

      {/* Lighter-spark flash layer */}
      <Animated.View
        style={[styles.sparkFlash, { backgroundColor: FLAME_COLOR, opacity: sparkFlash }]}
      />

      {/* Inner glow */}
      <Animated.View
        style={[styles.innerGlow, { backgroundColor: `${FLAME_COLOR}25`, opacity: innerGlow }]}
      />

      {/* Main button */}
      <View style={[styles.button, { shadowColor: FLAME_COLOR }]}>
        <View
          style={[
            styles.buttonInner,
            {
              backgroundColor: Colors.background.secondary,
              borderColor: focused ? FLAME_COLOR : `${FLAME_COLOR}60`,
            },
          ]}
        >
          <View style={[styles.buttonGradient, { backgroundColor: `${FLAME_COLOR}12` }]} />
          <MaterialCommunityIcons name="fire" size={26} color={FLAME_COLOR} />
        </View>
      </View>

      {/* Streak count badge */}
      {hasStreak && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{streakCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  outerGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
  },
  sparkFlash: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  innerGlow: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonGradient: {
    position: 'absolute',
    inset: 0 as any,
    borderRadius: 26,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: FLAME_COLOR,
    borderWidth: 1.5,
    borderColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.background.primary,
    letterSpacing: 0.3,
  },
});
