import React, { useEffect, useRef, useState } from 'react';
import { Colors } from '../../theme/DesignSystem';
import { Animated, Dimensions, View, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

// Simple event emitter for touch positions
export const touchEmitter = {
  listeners: [] as ((x: number, y: number) => void)[],
  // Throttle emits to ~32ms
  _lastEmit: 0,
  emit(x: number, y: number) {
    const now = Date.now();
    if (now - this._lastEmit < 32) return;
    this._lastEmit = now;
    this.listeners.forEach(l => l(x, y));
  },
  subscribe(listener: (x: number, y: number) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
};

interface StarProps {
  x: number; // 0-1
  y: number; // 0-1
  size: number;
  delay: number;
}

function PxStar({ x, y, size, delay }: StarProps) {
  const absX = x * width;
  const absY = y * height;
  
  const pulseAnim = useRef(new Animated.Value(0.15)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Base loop
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.15, duration: 1400, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  // Distance tracking
  useEffect(() => {
    const unsubscribe = touchEmitter.subscribe((tx, ty) => {
      // Euclidean dist proxy
      const dx = absX - tx;
      const dy = absY - ty;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 100) { // Bloom radius
        // Close to finger, bloom up!
        const intensity = 1 - dist / 100;
        Animated.spring(scaleAnim, {
          toValue: 1 + intensity * 1.5,
          useNativeDriver: true,
          speed: 20,
        }).start();
      } else {
        // Return to normal
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }
    });
    return unsubscribe;
  }, [absX, absY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: absX, 
        top: absY,
        width: size, 
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.accent.primary,
        opacity: pulseAnim,
        transform: [{ scale: scaleAnim }],
        zIndex: 1,
      }}
    />
  );
}

export function InteractiveStarfield({ positions }: { positions: any[] }) {
  // Pass relative X,Y
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" importantForAccessibility="no" accessibilityElementsHidden={true}>
      {positions.map((p, i) => (
        <PxStar key={i} x={p.x} y={p.y} size={p.size || p.s} delay={p.delay || p.d || 0} />
      ))}
    </View>
  );
}