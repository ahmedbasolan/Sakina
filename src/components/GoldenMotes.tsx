import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 6;

function Mote({ delay, reduceMotion }: { delay: number; reduceMotion: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(height * 0.8)).current;
  const translateX = useRef(new Animated.Value(width * (0.2 + Math.random() * 0.6))).current;

  useEffect(() => {
    if (reduceMotion) return;
    let stopped = false;
    const animate = () => {
      if (stopped) return;
      translateY.setValue(height * 0.8);
      translateX.setValue(width * (0.2 + Math.random() * 0.6));

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: height * 0.05,
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
          opacity,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    />
  );
}

export function GoldenMotes() {
  const reduceMotion = useReduceMotion();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Mote key={i} delay={i * 1200} reduceMotion={reduceMotion} />
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
    backgroundColor: '#D4AF37',
  },
});
