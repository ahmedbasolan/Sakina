import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Animations } from '../theme/DesignSystem';
import { useReduceMotion } from '../hooks/useReduceMotion';

interface LocationResultRowProps {
  city: string;
  country: string;
  index: number;
  onPress: () => void;
}

// Only the first 6 rows (index 0-5) get a staggered entrance — beyond that,
// a 30-result list would cascade for over a second, which reads as sluggish
// rather than premium. Rows past this render at rest immediately.
const STAGGER_ANIMATE_MAX_INDEX = 5;

export const LocationResultRow = React.memo(function LocationResultRow({
  city,
  country,
  index,
  onPress,
}: LocationResultRowProps) {
  const reduceMotion = useReduceMotion();
  const shouldAnimate = !reduceMotion && index <= STAGGER_ANIMATE_MAX_INDEX;

  const opacity = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(shouldAnimate ? 12 : 0)).current;
  const highlight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shouldAnimate) return;
    const delay = Animations.stagger.baseDelay + index * Animations.stagger.step;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: Animations.stagger.duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: Animations.stagger.duration,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    // Mount-only entrance — must not re-fire when the FlatList re-renders
    // this row for unrelated reasons (e.g. sibling state changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePressIn = () => {
    Animated.timing(highlight, {
      toValue: 1,
      duration: Animations.timing.micro,
      useNativeDriver: false,
    }).start();
  };
  const handlePressOut = () => {
    Animated.timing(highlight, {
      toValue: 0,
      duration: Animations.timing.micro,
      useNativeDriver: false,
    }).start();
  };

  const backgroundColor = highlight.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 235, 210, 0)', 'rgba(255, 235, 210, 0.04)'],
  });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.resultRow, { backgroundColor }]}>
          <Text style={styles.resultCity}>{city}</Text>
          <Text style={styles.resultCountry}>{country}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + Spacing.xs,
  },
  resultCity: {
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
    flex: 1,
  },
  resultCountry: {
    fontSize: Typography.sizes.small,
    color: Colors.text.muted,
    marginLeft: Spacing.sm,
  },
});
