/**
 * Screen 2: Welcome to Noor
 *
 * Dark navy background (#07111E → #0C1A2E) with animated mandala
 * geometric web, twinkling gold stars, sparkle icon, and CTA.
 * Matches the reference image exactly.
 */
import React, { useEffect, useRef } from 'react';
import { Colors } from '../../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { InteractiveStarfield } from './InteractiveStarfield';

const { width, height } = Dimensions.get('window');

const STAR_POSITIONS = [
  { x: 0.08, y: 0.06, size: 2.5, delay: 0 },
  { x: 0.88, y: 0.04, size: 2, delay: 600 },
  { x: 0.18, y: 0.18, size: 1.5, delay: 300 },
  { x: 0.78, y: 0.14, size: 2, delay: 900 },
  { x: 0.50, y: 0.08, size: 1.5, delay: 150 },
  { x: 0.92, y: 0.28, size: 2.5, delay: 750 },
  { x: 0.04, y: 0.38, size: 1.5, delay: 450 },
  { x: 0.96, y: 0.46, size: 2, delay: 1050 },
  { x: 0.25, y: 0.32, size: 1.5, delay: 200 },
  { x: 0.70, y: 0.22, size: 1.5, delay: 800 },
  { x: 0.35, y: 0.55, size: 1.5, delay: 350 },
  { x: 0.62, y: 0.50, size: 2, delay: 650 },
  { x: 0.14, y: 0.62, size: 1.5, delay: 500 },
  { x: 0.84, y: 0.60, size: 2, delay: 950 },
  { x: 0.45, y: 0.70, size: 1.5, delay: 100 },
  { x: 0.92, y: 0.72, size: 1.5, delay: 1200 },
  { x: 0.06, y: 0.76, size: 2, delay: 400 },
  { x: 0.55, y: 0.84, size: 1.5, delay: 700 },
];




interface Props {
  isActive: boolean;
  onNext: () => void;
  onSkip: () => void;
}

const FEATURES = [
  'A verse matched to how you feel, every day',
  'Gentle reminders at Fajr and Maghrib',
  'Track your heart\'s journey over time',
];

export default function WelcomeScreen({ isActive, onNext, onSkip }: Props) {
  // [0] icon, [1] title, [2] subtitle, [3-5] features, [6] CTA, [7] skip
  const s = useStaggerEntry(isActive, 8, { baseDelay: 300, stagger: 120 });

  const glowAnim = useRef(new Animated.Value(0.08)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.2, duration: 3000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.08, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Dark navy gradient background — matches reference exactly */}
      <LinearGradient
        colors={['#07111E', '#0C1A2E', '#0F1F30']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Interactive Twinkling stars scattered in the dark background */}
      <InteractiveStarfield positions={STAR_POSITIONS.map(p => ({ ...p, y: p.y * 1.3 }))} />

      {/* Content area */}
      <View style={styles.contentArea}>
        {/* Hero Area grouping the Icon and Mandala perfectly centered */}
        <View style={styles.heroWrap}>
          {/* Breathing gold glow */}
          <Animated.View
            style={[styles.breathingGlow, { opacity: glowAnim }]}
            pointerEvents="none"
          />

          {/* Arabic calligraphy "سكينة" in gold ring */}
          <Animated.View style={[styles.iconRing, s[0]]}>
            <Text style={styles.calligraphyText}>سكينة</Text>
          </Animated.View>
        </View>

        {/* Title */}
        <Animated.Text style={[styles.title, s[1]]}>
          Welcome to Sakina
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, s[2]]}>
          Your companion for spiritual growth,{'\n'}
          guided by the wisdom of the Quran
        </Animated.Text>

        {/* Feature rows */}
        <View style={styles.featuresWrap}>
          {FEATURES.map((text, i) => (
            <Animated.View key={i} style={[styles.featureRow, s[3 + i]]}>
              <Text style={styles.featureOrnament}>✦</Text>
              <Text style={styles.featureText}>{text}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* CTA */}
        <Animated.View style={[styles.ctaWrap, s[6]]}>
          <TouchableOpacity
            style={styles.ctaBtn}
            activeOpacity={0.85}
            onPress={onNext}
          >
            <LinearGradient
              colors={['#E8C84A', '#B8860B']}
              style={styles.ctaBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.ctaText}>Begin Your Journey</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Skip button for power users */}
        <Animated.View style={[styles.skipWrap, s[7]]}>
          <TouchableOpacity onPress={onSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.skipText}>Skip onboarding</Text>
          </TouchableOpacity>
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
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    marginTop: 20,
  },
  breathingGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D4AF37',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 2,
  },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 168, 76, 0.6)',
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 12,
  },
  calligraphyText: {
    fontSize: 28,
    color: Colors.accent.primary,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textShadowColor: 'rgba(201, 168, 76, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
    letterSpacing: 2,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 30,
    color: '#F0E6D3',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 14,
    textShadowColor: 'rgba(201, 168, 76, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(176, 196, 215, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.2,
    marginBottom: 32,
  },
  featuresWrap: {
    width: '100%',
    gap: 14,
    paddingHorizontal: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.1)',
  },
  featureOrnament: {
    fontSize: 10,
    color: Colors.accent.primary,
    opacity: 0.75,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(245, 237, 227, 0.7)',
    letterSpacing: 0.2,
    lineHeight: 20,
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: height * 0.10,
    gap: 12,
    zIndex: 2,
  },
  ctaWrap: {
    width: '100%',
  },
  ctaBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  ctaBtnGradient: {
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  ctaText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 17,
    letterSpacing: 1.5,
    fontWeight: '600',
    color: '#0C1A2E',
  },
  skipWrap: {
    marginTop: 4,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(176, 196, 215, 0.4)',
    letterSpacing: 0.5,
  },
});