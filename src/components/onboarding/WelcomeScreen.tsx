/**
 * Screen 2: Welcome to Sakina
 *
 * Dark navy background with twinkling stars. Icon-first feature cards
 * with Ionicons, gold accent borders, and a privacy chip.
 */
import React from 'react';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { InteractiveStarfield } from './InteractiveStarfield';
import { ShimmerButton } from '../ShimmerButton';

const { width, height } = Dimensions.get('window');
const ICON_SIZE = Math.min(Math.round(width * 0.28), 120);

const MAPPED_STAR_POSITIONS = [
  { x: 0.08, y: 0.078, size: 2.5, delay: 0 },
  { x: 0.88, y: 0.052, size: 2,   delay: 600 },
  { x: 0.18, y: 0.234, size: 1.5, delay: 300 },
  { x: 0.78, y: 0.182, size: 2,   delay: 900 },
  { x: 0.50, y: 0.104, size: 1.5, delay: 150 },
  { x: 0.92, y: 0.364, size: 2.5, delay: 750 },
  { x: 0.04, y: 0.494, size: 1.5, delay: 450 },
  { x: 0.96, y: 0.598, size: 2,   delay: 1050 },
  { x: 0.25, y: 0.416, size: 1.5, delay: 200 },
  { x: 0.70, y: 0.286, size: 1.5, delay: 800 },
  { x: 0.14, y: 0.806, size: 1.5, delay: 500 },
  { x: 0.84, y: 0.780, size: 2,   delay: 950 },
  { x: 0.06, y: 0.988, size: 2,   delay: 400 },
  { x: 0.55, y: 1.092, size: 1.5, delay: 700 },
];

interface FeatureItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: 'book-outline',
    title: 'Daily Verse',
    description: 'A Quran verse matched to your mood — morning and evening, every day',
  },
  {
    icon: 'compass-outline',
    title: 'Guided Journeys',
    description: 'Build salah, dhikr, and reflection habits step by step',
  },
  {
    icon: 'journal-outline',
    title: 'Private Journal',
    description: 'Your thoughts and gratitude — only you can read your entries',
  },
];

interface Props {
  isActive: boolean;
  onNext: () => void;
}

export default function WelcomeScreen({ isActive, onNext }: Props) {
  // [0] icon, [1] title, [2] subtitle, [3-5] feature cards, [6] privacy chip, [7] CTA
  const s = useStaggerEntry(isActive, 8);
  const insets = useSafeAreaInsets();
  const topClearance = insets.top + 72;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#07111E', '#0C1A2E', '#0F1F30']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <InteractiveStarfield positions={MAPPED_STAR_POSITIONS} />

      <View style={[styles.contentArea, { paddingTop: topClearance }]}>
        {/* App icon */}
        <View style={styles.heroWrap}>
          <Animated.View style={s[0]}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.appIcon}
              resizeMode="cover"
            />
          </Animated.View>
        </View>

        {/* Title */}
        <Animated.Text style={[styles.title, s[1]]}>
          Welcome to Sakina
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, s[2]]}>
          Your companion for spiritual growth,{'\n'}guided by the wisdom of the Quran
        </Animated.Text>

        {/* Feature cards */}
        <View style={styles.featuresWrap}>
          {FEATURES.map((feat, i) => (
            <Animated.View key={feat.icon} style={[styles.featureCard, s[3 + i]]}>
              {/* Gold accent left border */}
              <View style={styles.featureAccentBar} />

              {/* Icon circle */}
              <View style={styles.featureIconWrap}>
                <Ionicons name={feat.icon} size={22} color={Colors.accent.primary} />
              </View>

              {/* Text */}
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureDesc}>{feat.description}</Text>
              </View>
            </Animated.View>
          ))}

          {/* Privacy note */}
          <Animated.View style={[styles.privacyChip, s[6]]}>
            <Ionicons name="lock-closed-outline" size={14} color="rgba(176, 196, 215, 0.7)" />
            <Text style={styles.privacyText}>
              Your mood history, journeys, and reflections are saved on this device only — we never collect or store them.
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* CTA */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom + Spacing.xxl, Spacing.xxxl) }]}>
        <Animated.View style={[styles.ctaWrap, s[7]]}>
          <ShimmerButton label="Begin Your Journey" onPress={onNext} height={58} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111E',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    zIndex: 2,
  },
  heroWrap: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  appIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: BorderRadius.xxl,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.hero,
    color: '#F0E6D3',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(201, 168, 76, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: Typography.sizes.small,
    color: 'rgba(176, 196, 215, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
    marginBottom: Spacing.xl,
  },
  featuresWrap: {
    width: '100%',
    gap: Spacing.sm,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.12)',
    overflow: 'hidden',
    paddingVertical: Spacing.md,
    paddingRight: Spacing.lg,
  },
  featureAccentBar: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: Colors.accent.primary,
    opacity: 0.7,
    marginRight: Spacing.md,
    borderRadius: 2,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Typography.sizes.small,
    fontWeight: '700',
    color: Colors.accent.primary,
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: Typography.sizes.detail,
    color: 'rgba(245, 237, 227, 0.65)',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  privacyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(107, 142, 174, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(107, 142, 174, 0.15)',
  },
  privacyText: {
    fontSize: Typography.sizes.detail,
    color: 'rgba(176, 196, 215, 0.70)',
    lineHeight: 17,
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    zIndex: 2,
  },
  ctaWrap: {
    width: '100%',
  },
});
