import { useRef, MutableRefObject } from 'react';
import { PanResponder, Animated } from 'react-native';
import { HapticsService } from '../services/hapticsService';

interface UseSwipeGestureOptions {
  /** Called when a confirmed left swipe is detected */
  onNext: () => void;
  /**
   * Minimum absolute dx (pixels) before the swipe is confirmed.
   * A velocity boost (|vx| > 0.4) can also confirm without reaching this.
   * Default: 50.
   */
  threshold?: number;
  /**
   * When `.current` is true, the gesture never claims the responder at all
   * — e.g. while a sibling TextInput is focused, so a word-selection drag
   * can't be mistaken for a swipe. A ref rather than a boolean prop
   * deliberately: flipping it doesn't need to re-create this hook's PanResponder
   * or force the consuming screen to re-render (which on Android was
   * observed to interrupt the OS's keyboard-show animation when toggled via
   * React state at the exact moment a TextInput gained focus).
   */
  disabledRef?: MutableRefObject<boolean>;
}

/**
 * Attaches a horizontal left-swipe-to-next gesture to a View.
 *
 * Design decisions:
 * - Left swipe (finger moves ←) = "next" — matches the standard
 *   iOS/Android forward-navigation convention (page turning forward).
 * - Horizontal-dominant claim (`|dx| > |dy| × 1.5 && |dx| > 12`) so it
 *   never steals vertical events from LayerContainer's up/down swipe.
 * - PanResponder is created once in a ref; onNext is kept fresh via
 *   `onNextRef.current = onNext` on every render — no stale-closure risk.
 * - `swipeAnim` tracks 0→1 proportionally so SwipeNextOverlay can give
 *   live visual feedback during the drag.
 */
export function useSwipeGesture({ onNext, threshold = 50, disabledRef }: UseSwipeGestureOptions) {
  // Always holds the latest onNext without re-creating the PanResponder
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  // 0 at rest → 1 when the swipe reaches `threshold` pixels
  const swipeAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      // Claim only clearly horizontal gestures, and never while disabled
      onMoveShouldSetPanResponder: (_, g) =>
        !disabledRef?.current &&
        Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && Math.abs(g.dx) > 12,

      onPanResponderMove: (_, g) => {
        // Drive the overlay proportionally; ignore right-ward drags
        const progress = g.dx < 0 ? Math.min(Math.abs(g.dx) / threshold, 1) : 0;
        swipeAnim.setValue(progress);
      },

      onPanResponderRelease: (_, g) => {
        const longEnough  = g.dx < -threshold;
        const quickFlick  = g.dx < 0 && Math.abs(g.vx) > 0.4;
        if (longEnough || quickFlick) {
          HapticsService.impactAsync('LIGHT');
          onNextRef.current();
        }
        // Snap overlay back to rest regardless
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
        }).start();
      },

      onPanResponderTerminate: () => {
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
        }).start();
      },
    }),
  ).current;

  return {
    panHandlers: panResponder.panHandlers,
    swipeAnim,
  };
}
