/**
 * Screen 1: Bismillah
 *
 * Smaller Kufi calligraphy revealed right-to-left with a gold
 * glow pen-tip effect. Clean layout with stagger-animated text.
 */
import React, { useEffect, useRef } from 'react';
import { Colors } from '../../theme/DesignSystem';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { useTheme } from '../../context/ThemeContext';
import { InteractiveStarfield } from './InteractiveStarfield';

const { width, height } = Dimensions.get('window');

const STAR_POS = [
  { x: 0.06, y: 0.06, s: 2.5, d: 0 },
  { x: 0.92, y: 0.05, s: 2, d: 600 },
  { x: 0.20, y: 0.18, s: 1.5, d: 300 },
  { x: 0.80, y: 0.14, s: 2, d: 800 },
  { x: 0.50, y: 0.08, s: 1.5, d: 150 },
];



const IMG_SIZE = width * 0.48;

interface Props {
  isActive: boolean;
  onNext: () => void;
}

export default function BismillahScreen({ isActive, onNext }: Props) {
  const { onboardingColors: c } = useTheme();

  const ctaPulse = useRef(new Animated.Value(1)).current;

  // Stagger for: [0] calligraphy container, [1] subtitle, [2] description, [3] CTA button
  const stagger = useStaggerEntry(isActive, 4, { baseDelay: 100, stagger: 80 });

  useEffect(() => {
    if (!isActive) return;

    // CTA subtle pulse after reveal completes
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ctaPulse, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
          Animated.timing(ctaPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }, 3500);
  }, [isActive]);

  return (
    <View style={styles.container}>
      {/* Stars */}
      <InteractiveStarfield positions={STAR_POS.map(p => ({ ...p, y: p.y * 1.5 }))} />

      <View style={styles.contentArea}>
        {/* Calligraphy block */}
        <Animated.View style={[styles.calligraphyWrap, stagger[0]]}>
          {/* Image clip container */}
          <View style={styles.imageClip}>
            <Image
              source={require('../../assets/onboarding/bismillah-kufi.png')}
              style={styles.calligraphyImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { color: c.textSecondary }, stagger[1]]}>
          In the name of Allah,{'\n'}the Most Gracious, the Most Merciful
        </Animated.Text>

        {/* Description */}
        <Animated.Text style={[styles.description, { color: c.textMuted }, stagger[2]]}>
          Begin your journey toward{'\n'}spiritual clarity and inner peace.
        </Animated.Text>
      </View>

      {/* CTA Button */}
      <Animated.View style={[styles.ctaWrap, stagger[3], { transform: [{ scale: ctaPulse }] }]}>
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: c.ctaBg }]}
          activeOpacity={0.85}
          onPress={onNext}
        >
          <Text style={[styles.ctaText, { color: c.ctaText }]}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  calligraphyWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  imageClip: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    overflow: 'hidden',
  },
  calligraphyImage: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    tintColor: Colors.accent.primary,
  },
  subtitle: {
    fontFamily: 'serif',
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 27,
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  ctaWrap: {
    paddingHorizontal: 24,
    paddingBottom: height * 0.10,
  },
  ctaBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: 'serif',
    fontSize: 17,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});