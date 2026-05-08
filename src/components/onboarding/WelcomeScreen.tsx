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
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { InteractiveStarfield } from './InteractiveStarfield';

const { width, height } = Dimensions.get('window');

// Star positions matching the reference image — scattered across upper half
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
];



function SparklesIcon({ size = 32, color = Colors.accent.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12,2 C12,2 13.5,8.5 18,12 C13.5,15.5 12,22 12,22 C12,22 10.5,15.5 6,12 C10.5,8.5 12,2 12,2 Z"
        fill={color}
      />
      <Path
        d="M19,2 C19,2 19.5,4 21,5 C19.5,6 19,8 19,8 C19,8 18.5,6 17,5 C18.5,4 19,2 19,2 Z"
        fill={color}
        opacity={0.6}
      />
      <Path
        d="M5,7 C5,7 5.4,8.5 6.5,9 C5.4,9.5 5,11 5,11 C5,11 4.6,9.5 3.5,9 C4.6,8.5 5,7 5,7 Z"
        fill={color}
        opacity={0.5}
      />
    </Svg>
  );
}

// Removed LoopingDots

interface Props {
  isActive: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export default function WelcomeScreen({ isActive, onNext, onSkip }: Props) {
  // [0] icon, [1] title, [2] subtitle, [3] dots, [4] chip, [5] CTA
  const s = useStaggerEntry(isActive, 6, { baseDelay: 300, stagger: 130 });

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
          {/* Sparkle icon in gold circle */}
          <Animated.View style={[styles.iconRing, s[0]]}>
            <SparklesIcon size={30} color={Colors.accent.primary} />
          </Animated.View>
        </View>

        {/* Title */}
        <Animated.Text style={[styles.title, s[1]]}>
          WELCOME TO NOOR
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, s[2]]}>
          Your personal companion for spiritual growth,{'\n'}
          guided by the wisdom of the Quran
        </Animated.Text>

        {/* Ornament instead of dots */}
        <Animated.Text style={[styles.ornament, s[3]]}>✦</Animated.Text>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Feature chip — matches reference pill with sparkle prefix */}
        <Animated.View style={[styles.chip, s[4]]}>
          <SparklesIcon size={12} color={Colors.accent.primary} />
          <Text style={styles.chipText}>
            {'  '}A verse chosen for your heart, right now
          </Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[styles.ctaWrap, s[5]]}>
          <TouchableOpacity
            style={styles.ctaBtn}
            activeOpacity={0.85}
            onPress={onNext}
          >
            <LinearGradient
              colors={[Colors.accent.primary, Colors.accent.primary]}
              style={styles.ctaBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.ctaText}>Begin Your Journey</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Skip button for power users */}
        <Animated.View style={[styles.skipWrap, s[5]]}>
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
    marginBottom: 32,
    marginTop: 60, // Push it down somewhat
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 2,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 168, 76, 0.35)',
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    // Removed marginBottom since it's now handled by heroWrap
    // Gold inner glow matching reference
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 30,
    color: '#F0E6D3',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 14,
    // Subtle text glow
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
    marginBottom: 24,
  },
  ornament: {
    fontSize: 16,
    color: 'rgba(201,168,76,0.5)',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: height * 0.10,
    gap: 14,
    zIndex: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.2)',
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(201, 168, 76, 0.75)',
    letterSpacing: 0.3,
    lineHeight: 18,
    flex: 1,
    textAlign: 'center',
  },
  ctaWrap: {
    width: '100%',
  },
  ctaBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnGradient: {
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  ctaText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 17,
    letterSpacing: 1,
    fontWeight: '600',
    color: '#0C1A2E',
  },
  skipWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(176, 196, 215, 0.25)',
    letterSpacing: 0.5,
  },
});