/**
 * FlipCard Component
 *
 * An animated card that toggles between front (Quran) and back (Sunnah/Actions).
 * Uses fade animation for smooth transitions without breaking scroll.
 */

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface FlipCardProps {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  flipButtonColor?: string;
  frontHint?: string;
  backHint?: string;
  showHints?: boolean;
  onFlip?: (isBack: boolean) => void;
}

export default forwardRef(function FlipCard(
  {
    frontContent,
    backContent,
    flipButtonColor = '#2ED3C6',
    frontHint = 'Tap for more context ⟲',
    backHint = 'Tap to show verse ⟲',
    showHints = true,
    onFlip,
  }: FlipCardProps,
  ref,
) {
  const [showBack, setShowBack] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    flipCard: () => {
      flip();
    },
  }));

  const flip = () => {
    const toValue = showBack ? 0 : 180;

    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    // Toggle visibility halfway through
    setTimeout(() => {
      const nextState = !showBack;
      setShowBack(nextState);
      if (onFlip) onFlip(nextState);
    }, 150);
  };

  const flipCard = () => {
    flip();
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <TouchableWithoutFeedback onPress={flipCard}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.card,
            frontAnimatedStyle,
            { backfaceVisibility: 'hidden', opacity: showBack ? 0 : 1 },
          ]}
          pointerEvents={showBack ? 'none' : 'auto'}
        >
          {showHints && (
            <View style={styles.hintContainer}>
              <Text style={[styles.hintText, { color: flipButtonColor }]}>{frontHint}</Text>
            </View>
          )}

          {frontContent}
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            backAnimatedStyle,
            styles.flipCardBack,
            { opacity: showBack ? 1 : 0 },
          ]}
          pointerEvents={showBack ? 'auto' : 'none'}
        >
          {showHints && (
            <View style={styles.hintContainer}>
              <Text style={[styles.hintText, { color: flipButtonColor }]}>{backHint}</Text>
            </View>
          )}

          {backContent}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#121A1F',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(46, 211, 198, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  flipCardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hintContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 211, 198, 0.15)',
    backgroundColor: 'rgba(46, 211, 198, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  previewContainer: {
    marginTop: 20,
  },
  previewDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
