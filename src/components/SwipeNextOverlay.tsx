import React from 'react';
import { StyleSheet, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/DesignSystem';

interface SwipeNextOverlayProps {
  /** Animated value from useSwipeGesture (0 to 1) representing swipe progress */
  animValue: Animated.AnimatedValue;
  /** Primary accent color to tint the overlay icon and glow */
  accentColor?: string;
  /** Label to show under the arrow, e.g. "NEXT VERSE" or "NEXT LAYER" */
  label?: string;
}

/**
 * SwipeNextOverlay — provides a gorgeous, high-end visual feedback on swipe-left.
 *
 * Sits absolutely on top of the container (pointerEvents="none").
 * As the user drags left, a glowing arrow with the accent color fades and slides
 * in from the right edge, hinting at the screen transition.
 */
const SwipeNextOverlay: React.FC<SwipeNextOverlayProps> = ({
  animValue,
  accentColor = Colors.accent.primary,
  label = 'NEXT',
}) => {
  // Fade in as drag approaches threshold
  const opacity = animValue.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0, 0.9, 1],
  });

  // Slide in from right (from +40px to 0px)
  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  // Scale up slightly (0.85 to 1)
  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.overlayBox,
          {
            opacity,
            transform: [{ translateX }, { scale }],
            backgroundColor: `${accentColor}12`,
            borderColor: `${accentColor}24`,
          },
        ]}
      >
        <Ionicons name="arrow-forward" size={28} color={accentColor} />
        <Animated.Text style={[styles.label, { color: accentColor }]}>
          {label}
        </Animated.Text>
        {/* Soft background glow halo */}
        <View style={[styles.glow, { backgroundColor: accentColor }]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
    zIndex: 9999,
  },
  overlayBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 2,
    textAlign: 'center',
  },
  glow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.15,
    zIndex: -1,
  },
});

export default SwipeNextOverlay;
