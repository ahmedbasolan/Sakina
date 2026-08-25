import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { Colors } from '../theme/DesignSystem';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 6;

function Mote({
  delay,
  color,
  reduceMotion,
}: {
  delay: number;
  color: string;
  reduceMotion: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  // Starts near the top and animates downward — drifting light settling down,
  // not rising like embers/fire (the previous height*0.8 -> height*0.05 ran
  // bottom-to-top).
  const translateY = useRef(new Animated.Value(height * 0.05)).current;
  const translateX = useRef(new Animated.Value(width * (0.2 + Math.random() * 0.6))).current;

  useEffect(() => {
    if (reduceMotion) return;
    let stopped = false;
    const animate = () => {
      if (stopped) return;
      translateY.setValue(height * 0.05);
      translateX.setValue(width * (0.2 + Math.random() * 0.6));

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: height * 0.8,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
            Animated.delay(5000),
            Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => {
        if (!stopped) animate();
      });
    };

    animate();
    return () => { stopped = true; };
  }, [reduceMotion]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.mote,
        {
          backgroundColor: color,
          opacity,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    />
  );
}

interface GoldenMotesProps {
  /** Defaults to the app's gold accent — pass the current mood's accent
   *  (e.g. `MoodColors[mood].accent`) so the motes read as part of that
   *  mood's palette instead of always gold regardless of context. */
  color?: string;
}

export function GoldenMotes({ color = Colors.accent.primary }: GoldenMotesProps) {
  const reduceMotion = useReduceMotion();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Mote key={i} delay={i * 1200} color={color} reduceMotion={reduceMotion} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mote: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
