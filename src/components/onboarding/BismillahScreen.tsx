/**
 * Screen 1: Bismillah
 *
 * Gold Kufi calligraphy on midnight navy. Stagger-animated text,
 * glowing gold subtitles, and a quiet "Welcome to Sakina" closing label.
 */
import React from 'react';
import { Colors, Typography, Spacing } from '../../theme/DesignSystem';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { InteractiveStarfield } from './InteractiveStarfield';
import { ShimmerButton } from '../ShimmerButton';

const { width } = Dimensions.get('window');

const STAR_POS = [
  { x: 0.06, y: 0.06, s: 2.5, d: 0 },
  { x: 0.92, y: 0.05, s: 2,   d: 600 },
  { x: 0.20, y: 0.18, s: 1.5, d: 300 },
  { x: 0.80, y: 0.14, s: 2,   d: 800 },
  { x: 0.50, y: 0.08, s: 1.5, d: 150 },
  { x: 0.12, y: 0.42, s: 1.5, d: 450 },
  { x: 0.88, y: 0.36, s: 2,   d: 700 },
];

const IMG_SIZE = width * 0.36;

const GLOW = {
  textShadowColor: 'rgba(212, 175, 55, 0.45)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 14,
};

interface Props {
  isActive: boolean;
  onNext: () => void;
}

export default function BismillahScreen({ isActive, onNext }: Props) {
  const insets = useSafeAreaInsets();

  // [0] calligraphy, [1] arabic subtitle, [2] description, [3] welcome label, [4] CTA
  const stagger = useStaggerEntry(isActive, 5, { baseDelay: 100, stagger: 100 });

  return (
    <View style={styles.container}>
      <InteractiveStarfield positions={STAR_POS.map(p => ({ ...p, y: p.y * 1.5 }))} />

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[styles.contentArea, { paddingTop: insets.top + 72 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Gold Kufi calligraphy */}
        <Animated.View style={[styles.calligraphyWrap, stagger[0]]}>
          <View style={styles.imageClip}>
            <Image
              source={require('../../assets/onboarding/bismillah-kufi.png')}
              style={styles.calligraphyImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* "In the name of Allah..." */}
        <Animated.Text style={[styles.subtitle, stagger[1]]}>
          In the name of Allah,{'\n'}the Most Gracious, the Most Merciful
        </Animated.Text>

        {/* Description */}
        <Animated.Text style={[styles.description, stagger[2]]}>
          Begin your journey toward{'\n'}spiritual clarity and inner peace.
        </Animated.Text>

        {/* Quiet welcome label */}
        <Animated.View style={[styles.welcomeWrap, stagger[3]]}>
          <View style={styles.welcomeLine} />
          <Text style={styles.welcomeLabel}>Welcome to Sakina</Text>
          <View style={styles.welcomeLine} />
        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <Animated.View style={[styles.ctaWrap, stagger[4], { paddingBottom: Math.max(insets.bottom + Spacing.xxl, Spacing.xxxl) }]}>
        <ShimmerButton label="Continue" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040D1A',
  },
  // ScrollView's own layout box — takes the space above the fixed CTA.
  contentScroll: {
    flex: 1,
  },
  // contentContainerStyle: flexGrow (not flex) so short content still centers,
  // while taller content scrolls instead of overflowing into the CTA below.
  contentArea: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  calligraphyWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
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
    fontFamily: Typography.fonts.serif,
    fontSize: 18,
    color: `${Colors.text.primary}EB`,
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: 0.4,
    marginBottom: Spacing.md,
    ...GLOW,
  },
  description: {
    fontSize: 14,
    color: `${Colors.text.primary}A6`,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  welcomeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  welcomeLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 1,
  },
  welcomeLabel: {
    fontSize: 12,
    color: 'rgba(212, 175, 55, 0.70)',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontFamily: Typography.fonts.serif,
  },
  ctaWrap: {
    paddingHorizontal: Spacing.xl,
  },
});
