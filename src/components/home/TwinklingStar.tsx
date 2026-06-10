import React, { useRef, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';
import { Colors } from '../../theme/DesignSystem';
import { useReduceMotion } from '../../hooks/useReduceMotion';

const { width } = Dimensions.get('window');

interface TwinklingStarProps {
  x: number;
  y: number;
  delay: number;
  size: number;
}

export function TwinklingStar({ x, y, delay, size }: TwinklingStarProps) {
  const opacity = useRef(new Animated.Value(0.2)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.45);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.9, duration: 1200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: 1200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [reduceMotion]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x * width,
        top: y * 200,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.accent.primary,
        opacity,
      }}
    />
  );
}
