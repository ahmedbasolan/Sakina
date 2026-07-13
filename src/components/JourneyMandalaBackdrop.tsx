import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatedMandala } from './AnimatedMandala';

interface JourneyMandalaBackdropProps {
  size: number;
  color: string;
}

/**
 * Decorative mandala corner-peek for a journey/path card. Must be rendered
 * inside a container that itself has `overflow: 'hidden'` and rounded
 * corners (e.g. a BlurView or LinearGradient card) — this only positions the
 * mandala, it doesn't clip it. Shared by HomeScreen's Sacred Journey card and
 * PathsScreen's JourneyCard so the two treatments can't drift apart again.
 */
export function JourneyMandalaBackdrop({ size, color }: JourneyMandalaBackdropProps) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <AnimatedMandala size={size} color={color} opacity={0.24} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: -20, right: -40 },
});
