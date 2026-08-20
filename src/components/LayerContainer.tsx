import React, { useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { HapticsService } from '../services/hapticsService';

const { height } = Dimensions.get('window');
const SWIPE_THRESHOLD = height * 0.12;
// Pixels per second — see useSwipeGesture.ts's FLICK_VELOCITY comment for why
// this isn't 0.5 anymore: that was the same threshold under PanResponder,
// whose vx/vy were pixels per MILLISECOND, 1000x smaller than RNGH's unit.
const VELOCITY_THRESHOLD = 500;

/* ─── Layer Container ────────────────────────────────────────── */
interface LayerContainerProps {
  currentLayer: number;
  totalLayers: number;
  onLayerChange: (index: number) => void;
  children: React.ReactNode;
}

const LayerContainer: React.FC<LayerContainerProps> = ({
  currentLayer,
  totalLayers,
  onLayerChange,
  children,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const currentLayerRef = useRef(currentLayer);
  const totalLayersRef = useRef(totalLayers);
  // `onLayerChange` is an inline closure at every call site (GuidanceScreen,
  // PathStepScreen) and neither wraps it in useCallback, so a fresh function
  // arrives on most renders. Routed through a ref for the same reason
  // currentLayer/totalLayers are: the gesture below is built once (see the
  // empty useMemo deps) and must never call back into a stale closure — a
  // verse whose `hasContext` (and so `totalLayers`) differs from whichever
  // verse was on screen when this component first mounted would otherwise
  // compare the swipe's new layer index against the WRONG totalLayers inside
  // GuidanceScreen's own onLayerChange body, since a plain captured-at-mount
  // closure carries mount-time's totalLayers in it, not the current one.
  const onLayerChangeRef = useRef(onLayerChange);

  useEffect(() => {
    currentLayerRef.current = currentLayer;
  }, [currentLayer]);

  useEffect(() => {
    totalLayersRef.current = totalLayers;
  }, [totalLayers]);

  useEffect(() => {
    onLayerChangeRef.current = onLayerChange;
  }, [onLayerChange]);

  // Smooth entrance when layer changes
  useEffect(() => {
    translateY.setValue(0);
    scale.setValue(0.97);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 140,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentLayer]);

  const snapBack = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateTransition = (toValue: number, callback: () => void) => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  // Built once — every value it reads (translateY/opacity/scale are stable
  // ref objects; currentLayer/totalLayers/onLayerChange are read through the
  // refs above) stays current without rebuilding the gesture, mirroring how
  // the PanResponder this replaced was created once via useRef.
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        // Claims on any vertical movement past 10px — matches the old
        // PanResponder's `Math.abs(dy) > 10`, which had no awareness of dx at
        // all. failOffsetX gives this handler up to a clearly-horizontal drag
        // (useSwipeGesture's own activeOffsetX is ±12, so 15 here means the
        // horizontal gesture already has room to claim first on a genuinely
        // sideways drag) — the old code had no equivalent for this axis, so
        // this is a deliberate tightening, not a literal port: see
        // useSwipeGesture.ts's file comment for why the Gesture API needs an
        // explicit fail-out on both handlers instead of one combined ratio.
        .activeOffsetY([-10, 10])
        .failOffsetX([-15, 15])
        .onUpdate((e) => {
          let dy = e.translationY;
          // Rubber-band resistance at boundaries
          if (currentLayerRef.current === 0 && dy > 0) {
            dy = dy * 0.3;
          }
          if (currentLayerRef.current >= totalLayersRef.current - 1 && dy < 0) {
            dy = dy * 0.6;
          }
          translateY.setValue(dy);

          const progression = Math.abs(dy) / SWIPE_THRESHOLD;
          opacity.setValue(Math.max(0.5, 1 - progression * 0.5));
          scale.setValue(Math.max(0.93, 1 - progression * 0.07));
        })
        .onEnd((e, success) => {
          if (!success) return; // handled by onFinalize below
          const isQuickFlick = Math.abs(e.velocityY) > VELOCITY_THRESHOLD;
          const isLongSwipe = Math.abs(e.translationY) > SWIPE_THRESHOLD;
          const isLastLayer = currentLayerRef.current >= totalLayersRef.current - 1;

          if (e.translationY < 0 && (isLongSwipe || isQuickFlick) && !isLastLayer) {
            // Swipe up -> Next Layer (guarded so we never advance past the last,
            // which would render an undefined layer and blank the screen)
            HapticsService.impactAsync('LIGHT');
            animateTransition(-height * 0.4, () => {
              onLayerChangeRef.current(currentLayerRef.current + 1);
            });
          } else if (
            e.translationY > 0 &&
            (isLongSwipe || isQuickFlick) &&
            currentLayerRef.current > 0
          ) {
            // Swipe down -> Prev Layer
            HapticsService.impactAsync('LIGHT');
            animateTransition(height * 0.4, () => {
              onLayerChangeRef.current(currentLayerRef.current - 1);
            });
          } else {
            // Snap back with spring
            snapBack();
          }
        })
        .onFinalize((_e, success) => {
          // Covers a claimed gesture getting interrupted before/without a
          // normal release (onEnd doesn't fire in that case at all) — the
          // original PanResponder had no equivalent handler for this, so a
          // terminated drag could leave the layer visibly mid-transform
          // until the next gesture touched it. Purely additive: it can never
          // double-fire against onEnd's own snap-back, since exactly one of
          // onEnd/onFinalize's "unsuccessful" branch runs per attempt.
          if (!success) snapBack();
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ translateY }, { scale }],
              opacity,
            },
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default React.memo(LayerContainer);
