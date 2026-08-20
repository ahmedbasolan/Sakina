import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatedMandala } from './AnimatedMandala';

interface JourneyMandalaBackdropProps {
  size: number;
  color: string;
  /**
   * How present the mandala is. Defaults to the original 0.24, which reads as
   * background texture. Raise it where the mandala is carrying MEANING rather
   * than decoration — on the Journeys list it is the marker for "you are
   * actively walking this path", and at 0.24 in the card's own tint colour it
   * was indistinguishable from the cards it was supposed to stand out from.
   */
  opacity?: number;
}

/**
 * Decorative mandala corner-peek for a journey/path card. Must be rendered
 * inside a container that itself has `overflow: 'hidden'` and rounded
 * corners (e.g. a BlurView or LinearGradient card) — this only positions the
 * mandala, it doesn't clip it. Shared by HomeScreen's Sacred Journey card and
 * PathsScreen's JourneyCard so the two treatments can't drift apart again.
 */
export function JourneyMandalaBackdrop({ size, color, opacity = 0.24 }: JourneyMandalaBackdropProps) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <AnimatedMandala size={size} color={color} opacity={opacity} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: -20, right: -40 },
});
