import { useRef, useMemo, MutableRefObject } from 'react';
import { Animated } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { HapticsService } from '../services/hapticsService';

interface UseSwipeGestureOptions {
  /** Called when a confirmed left swipe is detected */
  onNext: () => void;
  /**
   * Minimum absolute dx (pixels) before the swipe is confirmed.
   * A velocity boost (|vx| > FLICK_VELOCITY) can also confirm without reaching this.
   * Default: 50.
   */
  threshold?: number;
  /**
   * When `.current` is true, the gesture never claims the responder at all
   * — e.g. while a sibling TextInput is focused, so a word-selection drag
   * can't be mistaken for a swipe. A ref rather than a boolean prop
   * deliberately: flipping it doesn't need to re-create this hook's gesture
   * or force the consuming screen to re-render (which on Android was
   * observed to interrupt the OS's keyboard-show animation when toggled via
   * React state at the exact moment a TextInput gained focus).
   */
  disabledRef?: MutableRefObject<boolean>;
}

// react-native-gesture-handler's velocityX/velocityY are pixels PER SECOND —
// Android's PanGestureHandler.kt calls VelocityTracker.computeCurrentVelocity(1000)
// (the "1000" is the window in ms that the result is normalized to), and iOS's
// RNPanHandler.m reads UIPanGestureRecognizer's velocityInView:, which Apple
// documents in points/second. The PanResponder this hook used to run on measured
// vx/vy in pixels PER MILLISECOND instead (RN's PanResponder.js: `vx = dx / dt`
// where dt is a raw millisecond timestamp delta) — 1000x smaller. The old
// threshold here was 0.4 px/ms; this is that same flick, in the new unit.
const FLICK_VELOCITY = 400;

/**
 * Attaches a horizontal left-swipe-to-next gesture to a View.
 *
 * Design decisions:
 * - Left swipe (finger moves ←) = "next" — matches the standard
 *   iOS/Android forward-navigation convention (page turning forward).
 * - Built on react-native-gesture-handler rather than PanResponder. The old
 *   PanResponder claim gate was one combined check, `|dx| > |dy| * 1.5 &&
 *   |dx| > 12`; RNGH's Gesture API arbitrates nested handlers per-axis
 *   instead (see LayerContainer, which owns the vertical gesture this one
 *   nests inside), so that single ratio check becomes two independent
 *   thresholds below — an activation gate on this axis and a fail-out gate
 *   on the other, tuned to roughly the same ratio.
 * - onNext is kept fresh via `onNextRef.current = onNext` on every render —
 *   no stale-closure risk, and it means the gesture itself only needs
 *   rebuilding when `threshold` changes.
 * - `swipeAnim` tracks 0→1 proportionally so SwipeNextOverlay can give
 *   live visual feedback during the drag. `translationX` (RNGH) is measured
 *   from the same reference point as PanResponder's `dx` was — the initial
 *   touch-down, not the point of activation — so this math is unchanged.
 */
export function useSwipeGesture({ onNext, threshold = 50, disabledRef }: UseSwipeGestureOptions) {
  // Always holds the latest onNext without re-creating the gesture
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  // 0 at rest → 1 when the swipe reaches `threshold` pixels
  const swipeAnim = useRef(new Animated.Value(0)).current;

  const snapBack = () => {
    Animated.spring(swipeAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
    }).start();
  };

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        // Claims only once movement is clearly horizontal (±12px), and gives
        // up as soon as vertical movement passes ±8px without having
        // claimed yet — that 12:8 (1.5:1) ratio is the same one the old
        // combined check used.
        .activeOffsetX([-12, 12])
        .failOffsetY([-8, 8])
        .onTouchesDown((_event, stateManager) => {
          // disabledRef is a ref specifically so toggling it doesn't rebuild
          // this gesture (see the interface doc above) — checking it here,
          // at the start of every touch, is what keeps that live instead of
          // baking in whatever it was when the gesture was built.
          if (disabledRef?.current) stateManager.fail();
        })
        .onUpdate((e) => {
          const progress = e.translationX < 0 ? Math.min(Math.abs(e.translationX) / threshold, 1) : 0;
          swipeAnim.setValue(progress);
        })
        .onEnd((e, success) => {
          // onEnd only fires for a gesture that reached ACTIVE and finished
          // normally (finger lifted). Deciding whether to advance is ALL this
          // does — resetting the overlay belongs in onFinalize below, which is
          // the only callback guaranteed to run.
          if (!success) return;
          const longEnough = e.translationX < -threshold;
          const quickFlick = e.translationX < 0 && Math.abs(e.velocityX) > FLICK_VELOCITY;
          if (longEnough || quickFlick) {
            HapticsService.impactAsync('LIGHT');
            onNextRef.current();
          }
        })
        .onFinalize(() => {
          // Unconditional, and deliberately so: this mirrors the "snap overlay
          // back to rest regardless" that the PanResponder version ran on every
          // release. Gating it on `success` (or putting it in onEnd's else
          // branch) strands swipeAnim at 1 on exactly the path that matters —
          // a *successful* swipe reports success === true, so a `!success`
          // guard skips it and SwipeNextOverlay's arrow stays burned onto the
          // screen over the next verse. onFinalize fires exactly once per
          // gesture attempt whatever the outcome (recognized and finished,
          // or never recognized at all), so this is the one place the reset
          // cannot be missed. A snap-back to 0 when already at 0 is a no-op.
          snapBack();
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threshold],
  );

  return {
    gesture,
    swipeAnim,
  };
}
