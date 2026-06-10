import React, { useEffect, useRef } from 'react';
import { Colors } from '../../theme/DesignSystem';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AnimatedMandala } from '../AnimatedMandala';

interface Props {
  progress: number; // 0.0 to 1.0
  size?: number;
  color?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressMandala({ progress, size = 48, color = Colors.accent.primary }: Props) {
  const animatedProgress = useRef(new Animated.Value(progress)).current;

  // The geometry of the progress ring
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.spring(animatedProgress, {
      toValue: progress,
      useNativeDriver: false, // SVG strokeDashoffset cannot use native driver
      damping: 15,
      stiffness: 100,
    }).start();
  }, [progress]);

  // Dashoffset starts at circumference (empty) and goes to 0 (full)
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* The rotating mathematical mandala inside — boldened stroke + higher
          opacity so the geometry actually reads inside the small ring. */}
      <View style={styles.mandalaWrap} pointerEvents="none">
        <AnimatedMandala size={size * 0.92} color={color} opacity={1} strokeScale={4} />
      </View>

      {/* The dynamic sweeping outer progress ring */}
      <Svg width={size} height={size} style={styles.svgRing}>
        {/* Faded track background */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeOpacity={0.15}
          fill="none"
        />
        {/* Animated fill */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeOpacity={0.9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mandalaWrap: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgRing: {
    // Rotate 90 deg counter-clockwise so the stroke starts at the top (12 o'clock)
    transform: [{ rotate: '-90deg' }],
  },
});