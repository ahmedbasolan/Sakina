import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, Dimensions, PanResponder } from 'react-native';
import { HapticsService } from '../services/hapticsService';

const { height } = Dimensions.get('window');
const SWIPE_THRESHOLD = height * 0.12;
const VELOCITY_THRESHOLD = 0.5;

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

  useEffect(() => {
    currentLayerRef.current = currentLayer;
  }, [currentLayer]);

  useEffect(() => {
    totalLayersRef.current = totalLayers;
  }, [totalLayers]);

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

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        let dy = gestureState.dy;
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
      },
      onPanResponderRelease: (_, gestureState) => {
        const isQuickFlick = Math.abs(gestureState.vy) > VELOCITY_THRESHOLD;
        const isLongSwipe = Math.abs(gestureState.dy) > SWIPE_THRESHOLD;

        if (gestureState.dy < 0 && (isLongSwipe || isQuickFlick)) {
          // Swipe up -> Next Layer (or past last layer)
          HapticsService.impactAsync('LIGHT');
          animateTransition(-height * 0.4, () => {
            onLayerChange(currentLayerRef.current + 1);
          });
        } else if (
          gestureState.dy > 0 &&
          (isLongSwipe || isQuickFlick) &&
          currentLayerRef.current > 0
        ) {
          // Swipe down -> Prev Layer
          HapticsService.impactAsync('LIGHT');
          animateTransition(height * 0.4, () => {
            onLayerChange(currentLayerRef.current - 1);
          });
        } else {
          // Snap back with spring
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
        }
      },
    }),
  ).current;

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

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
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
