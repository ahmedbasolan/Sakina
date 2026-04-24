/**
 * Reusable micro-animation hook for onboarding screens.
 *
 * Behaviour per element:
 *   - opacity   0 → 1
 *   - translateY 50 → 0  (bottom → final position)
 *
 * Elements are staggered so the screen reveals top-to-bottom.
 * Motion is small, soft, and premium — not dramatic.
 *
 * Usage:
 *   const styles = useStaggerEntry(isActive, 5);
 *   // styles[0] … styles[4] each have { opacity, transform }
 *   <Animated.View style={styles[0]}> … </Animated.View>
 */
import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

const DEFAULT_OFFSET = 50;
const DEFAULT_DURATION = 480;
const DEFAULT_BASE_DELAY = 200;
const DEFAULT_STAGGER = 100;

interface StaggerOptions {
  /** Delay before the first element starts animating (ms). Default 200. */
  baseDelay?: number;
  /** Delay between each successive element (ms). Default 100. */
  stagger?: number;
  /** Starting translateY offset (px). Default 50. */
  offset?: number;
  /** Duration of each element's animation (ms). Default 480. */
  duration?: number;
}

export type StaggerStyle = {
  opacity: Animated.Value;
  transform: { translateY: Animated.Value }[];
};

export function useStaggerEntry(
  isActive: boolean,
  count: number,
  options?: StaggerOptions,
): StaggerStyle[] {
  const {
    baseDelay = DEFAULT_BASE_DELAY,
    stagger = DEFAULT_STAGGER,
    offset = DEFAULT_OFFSET,
    duration = DEFAULT_DURATION,
  } = options || {};

  const anims = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(offset),
    })),
  ).current;

  useEffect(() => {
    if (!isActive) {
      // Reset to hidden
      anims.forEach((a) => {
        a.opacity.setValue(0);
        a.translateY.setValue(offset);
      });
      return;
    }

    // Reset then animate
    anims.forEach((a, i) => {
      a.opacity.setValue(0);
      a.translateY.setValue(offset);

      Animated.sequence([
        Animated.delay(baseDelay + i * stagger),
        Animated.parallel([
          Animated.timing(a.opacity, {
            toValue: 1,
            duration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(a.translateY, {
            toValue: 0,
            duration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, [isActive]);

  return anims.map((a) => ({
    opacity: a.opacity,
    transform: [{ translateY: a.translateY }],
  }));
}
