/**
 * ShimmerButton — the app's primary gold CTA with a calm shimmer sweep.
 *
 * A single gold gradient pill (the brand CTA), overlaid with a soft band of
 * light that travels left → right across the face on a slow loop. The sweep is
 * transform-only (native driver) and clipped by the pill's rounded corners.
 *
 * Honours reduce-motion: the button renders static with no sweep.
 *
 * Use this anywhere a primary action button is needed so the shimmer treatment
 * stays consistent across onboarding and the app.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography } from '../theme/DesignSystem';
import { useReduceMotion } from '../hooks/useReduceMotion';

interface Props {
  label: string;
  onPress: () => void;
  /** Pill height. Defaults to 56. */
  height?: number;
  /** Corner radius. Defaults to 28 (full pill at the default height). */
  radius?: number;
  /** Optional extra style for the outer (shadow) wrapper. */
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
}

// The travelling light band is ~40% of the button width; it sweeps from fully
// off the left edge to fully off the right, then pauses before repeating.
const SWEEP_DURATION = 1400;
const SWEEP_PAUSE = 1000;

export function ShimmerButton({
  label,
  onPress,
  height = 56,
  radius = 28,
  style,
  disabled = false,
  accessibilityLabel,
}: Props) {
  const reduceMotion = useReduceMotion();
  const sweep = useRef(new Animated.Value(0)).current;
  // Measured pill width drives the band's travel distance; until measured we
  // fall back to a generous value so the very first sweep still crosses fully.
  const [width, setWidth] = useState(280);

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: SWEEP_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(SWEEP_PAUSE),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, sweep]);

  // Band width = 45% of the pill; travel from just off the left to just off the
  // right (covers the full face plus the band's own width on each side).
  const bandWidth = width * 0.45;
  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-bandWidth, width],
  });

  return (
    <TouchableOpacity
      style={[styles.outer, { borderRadius: radius }, style]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w && Math.abs(w - width) > 1) setWidth(w);
      }}
    >
      <LinearGradient
        colors={['#E8C84A', '#B8860B']}
        style={[styles.gradient, { height, borderRadius: radius }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.label}>{label}</Text>

        {/* Travelling shimmer band — sits above the fill, below nothing else. */}
        {!reduceMotion && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.bandWrap,
              { transform: [{ translateX }] },
            ]}
          >
            <LinearGradient
              colors={[
                'rgba(255,255,255,0)',
                'rgba(255,255,255,0.45)',
                'rgba(255,255,255,0)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.band, { width: bandWidth }]}
            />
          </Animated.View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    // No overflow:hidden here — the inner gradient clips the shimmer band, and
    // clipping here would swallow the gold glow shadow on iOS.
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  label: {
    fontFamily: Typography.fonts.serif,
    fontSize: 17,
    letterSpacing: 1.5,
    fontWeight: '600',
    color: Colors.background.secondary,
  },
  bandWrap: {
    alignItems: 'flex-start',
  },
  band: {
    height: '100%',
    // Slight skew so the light reads as a diagonal gleam, not a flat bar.
    transform: [{ skewX: '-18deg' }],
  },
});
