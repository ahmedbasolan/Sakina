/**
 * NoorCenterTab
 *
 * Elevated circular center tab button.
 * Shows the user's current mood icon with a living glow effect.
 * "Lighter spark" animation: brief flash → sustained ember pulse.
 * No mood today → neutral gold spark inviting check-in.
 */
import React, { useEffect, useRef } from 'react';
import { Colors } from '../theme/DesignSystem';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const MOOD_ICONS: Record<string, { path: string; color: string }> = {
  Grateful: {
    color: '#34D399',
    path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  },
  Hopeful: {
    color: '#FBBF24',
    path: 'M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z',
  },
  Calm: {
    color: '#22D3EE',
    path: 'M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l.95-2.3c.48.17.98.3 1.34.3 11 0 14-17 14-17-1 2-8 5.25-13 6.25-5 1-7 5.25-7 7.25 0 2 1.75 3.75 1.75 3.75C7 8 17 8 17 8z',
  },
  Overwhelmed: {
    color: '#818CF8',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
  },
  Sad: {
    color: '#60A5FA',
    path: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z',
  },
  Angry: {
    color: '#F87171',
    path: 'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z',
  },
  Lonely: {
    color: '#A78BFA',
    path: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  },
  Guilty: {
    color: '#34D399',
    path: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
  },
  Tired: {
    color: '#9CA3AF',
    path: 'M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z',
  },
};

const DEFAULT_ICON = {
  color: Colors.accent.primary,
  path: 'M12 2L14.39 8.26L21 9.27L16.5 13.64L17.77 20.23L12 17.27L6.23 20.23L7.5 13.64L3 9.27L9.61 8.26L12 2Z',
};

interface Props {
  currentMood?: string | null;
  focused: boolean;
}

export default function NoorCenterTab({ currentMood, focused }: Props) {
  const moodData = currentMood ? (MOOD_ICONS[currentMood] || DEFAULT_ICON) : DEFAULT_ICON;

  // Outer ring pulse — sustained ember glow
  const outerPulse = useRef(new Animated.Value(1)).current;
  // Inner glow opacity
  const innerGlow = useRef(new Animated.Value(0.3)).current;
  // Spark flash on mount
  const sparkFlash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Lighter-spark: flash → fade → sustained glow
    Animated.sequence([
      Animated.timing(sparkFlash, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(sparkFlash, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    // Sustained ember pulse (outer ring)
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(outerPulse, { toValue: 1.12, duration: 2400, useNativeDriver: true }),
        Animated.timing(outerPulse, { toValue: 1, duration: 2400, useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Inner glow breathe
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(innerGlow, { toValue: 0.7, duration: 2000, useNativeDriver: true }),
        Animated.timing(innerGlow, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    );
    glow.start();

    return () => { pulse.stop(); glow.stop(); };
  }, [currentMood]);

  const color = moodData.color;

  return (
    <View style={styles.container}>
      {/* Outer pulsing glow ring */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            backgroundColor: `${color}18`,
            borderColor: `${color}30`,
            transform: [{ scale: outerPulse }],
          },
        ]}
      />

      {/* Lighter-spark flash layer */}
      <Animated.View
        style={[
          styles.sparkFlash,
          { backgroundColor: color, opacity: sparkFlash },
        ]}
      />

      {/* Inner glow */}
      <Animated.View
        style={[
          styles.innerGlow,
          { backgroundColor: `${color}25`, opacity: innerGlow },
        ]}
      />

      {/* Main button */}
      <View style={[styles.button, { shadowColor: color }]}>
        <View style={[styles.buttonInner, { backgroundColor: '#0C1A2E', borderColor: `${color}60` }]}>
          {/* Radial gradient shimmer */}
          <View style={[styles.buttonGradient, { backgroundColor: `${color}12` }]} />

          {/* Mood icon */}
          <Svg width={24} height={24} viewBox="0 0 24 24" fill={color}>
            <Path d={moodData.path} />
          </Svg>
        </View>
      </View>
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
    inset: 0,
    borderRadius: 26,
  },
});