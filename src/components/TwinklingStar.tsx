/**
 * TwinklingStar — Animated star particle that pulses opacity.
 * Self-contained: each instance manages its own animation lifecycle.
 * Uses useNativeDriver: true for 60fps opacity animation.
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { Colors } from '../theme/DesignSystem';

interface TwinklingStarProps {
  x: string | number;
  y: string | number;
  size?: number;
  color?: string;
  delay?: number;
  duration?: number;
}

function TwinklingStarInner({
  x,
  y,
  size = 2,
  color = Colors.accent.secondary,
  delay = 0,
  duration,
}: TwinklingStarProps) {
  const opacity = useRef(new Animated.Value(0.2)).current;

  // Randomise duration per star for natural variation
  const dur = useMemo(
    () => duration ?? 1500 + Math.random() * 2000,
    [duration]
  );

  useEffect(() => {
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
  }, [delay, dur]);

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
