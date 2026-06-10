/**
 * TwinklingStar — Animated star particle that pulses opacity.
 * Self-contained: each instance manages its own animation lifecycle.
 * Uses useNativeDriver: true for 60fps opacity animation.
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { Colors } from '../theme/DesignSystem';
import { useReduceMotion } from '../hooks/useReduceMotion';

interface TwinklingStarProps {
  x: string | number;
  y: string | number;
  size?: number;
  color?: string;
  delay?: number;
  duration?: number;
  /**
   * Optional pre-resolved reduce-motion value from a parent that already called
   * `useReduceMotion()`. When provided, the star skips its own hook call,
   * avoiding N parallel `AccessibilityInfo` subscriptions when many stars
   * are rendered by the same parent.
   */
  reduceMotionOverride?: boolean;
}

function TwinklingStarInner({
  x,
  y,
  size = 2,
  color = Colors.accent.secondary,
  delay = 0,
  duration,
  reduceMotionOverride,
}: TwinklingStarProps) {
  const opacity = useRef(new Animated.Value(0.2)).current;
  // Only call the hook if the parent hasn't already resolved the value.
  const hookValue = useReduceMotion();
  const reduceMotion = reduceMotionOverride ?? hookValue;

  // Randomise duration per star for natural variation
  const dur = useMemo(
    () => duration ?? 1500 + Math.random() * 2000,
    [duration]
  );

  useEffect(() => {
    if (reduceMotion) {
      // Static mid-opacity dot — visible but not blinking
      opacity.setValue(0.45);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: dur / 2,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: dur / 2,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, dur, reduceMotion]);

  const style = useMemo<ViewStyle>(
    () => ({
      position: 'absolute',
      left: x as any,
      top: y as any,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
    }),
    [x, y, size, color]
  );

  return <Animated.View style={[style, { opacity }]} pointerEvents="none" />;
}

export const TwinklingStar = React.memo(TwinklingStarInner);
