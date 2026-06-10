import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Returns true when the user has enabled "Reduce Motion" in system accessibility
 * settings (iOS: Settings → Accessibility → Motion → Reduce Motion;
 *           Android: Settings → Accessibility → Remove animations).
 *
 * Infinite animation loops should check this value and either:
 *  - Skip the loop entirely (show a static appearance), or
 *  - Switch to a single short entrance animation.
 *
 * Behaviour:
 *  - Resolves asynchronously on mount (defaults false until resolved).
 *  - Subscribes to runtime changes so toggling mid-session is respected.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (!cancelled) setReduceMotion(value);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => setReduceMotion(value),
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
