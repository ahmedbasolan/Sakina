/**
 * Screen 6: Hold to Commit
 *
 * Dark circle with gold ring. 4-point gold star in centre.
 * Progress ring fills as user holds for 3 seconds.
 * ON COMPLETION: Golden particle burst + floating ember shimmer + glow.
 * "Bismillah." fades in with warmth. Auto-advances after 2.2s.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Colors } from '../../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  Platform,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  RadialGradient as SvgRadial,
  Stop,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { AnimatedMandala } from '../AnimatedMandala';

const { width, height } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HOLD_DURATION = 3000;
const RING_SIZE = 220;
const CENTER = RING_SIZE / 2;
const RING_R = 86;

// 4-point sparkle star path
const STAR_PATH = `M${CENTER},${CENTER - 40} C${CENTER + 4},${CENTER - 12} ${CENTER + 12},${CENTER - 4} ${CENTER + 40},${CENTER} C${CENTER + 12},${CENTER + 4} ${CENTER + 4},${CENTER + 12} ${CENTER},${CENTER + 40} C${CENTER - 4},${CENTER + 12} ${CENTER - 12},${CENTER + 4} ${CENTER - 40},${CENTER} C${CENTER - 12},${CENTER - 4} ${CENTER - 4},${CENTER - 12} ${CENTER},${CENTER - 40} Z`;

// 12 particle directions for the burst effect
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * Math.PI * 2,
  distance: 90 + (i % 3) * 25,
  size: 3 + (i % 4),
  delay: i * 30,
}));

// 8 floating ember positions
const EMBERS = Array.from({ length: 8 }, (_, i) => ({
  x: (i * 37 + 20) % (RING_SIZE + 60) - 30,
  delay: i * 150,
}));

function BurstParticle({ angle, distance, size, delay, trigger }: any) {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger) return;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(x, {
          toValue: Math.cos(angle) * distance,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: Math.sin(angle) * distance,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }),
          Animated.timing(scale, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, [trigger]);

  const colors = ['#FFF4DC', Colors.accent.primary, '#FFD700', '#E5B162'];
  const color = colors[Math.floor(Math.abs(Math.sin(angle) * 4)) % 4];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ translateX: x }, { translateY: y }, { scale }],
        opacity,
      }}
    />
  );
}

function FloatingEmber({ x, delay, trigger }: any) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger) return;
    Animated.sequence([
      Animated.delay(delay + 600),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.7, duration: 400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 2100, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, [trigger]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x + CENTER,
        bottom: CENTER - 10,
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: Colors.accent.primary,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}

interface Props {
  isActive: boolean;
  onCommit: () => void;
}

export default function CommitScreen({ isActive, onCommit }: Props) {
  const [isHolding, setIsHolding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const holdProgress = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(1)).current;
  const starRotation = useRef(new Animated.Value(0)).current;
  const starGlow = useRef(new Animated.Value(0)).current;
  const completionOpacity = useRef(new Animated.Value(0)).current;
  const completionSlide = useRef(new Animated.Value(10)).current;
  const ringGlow = useRef(new Animated.Value(0)).current;
  const bgBrightness = useRef(new Animated.Value(0)).current;
  // Micro-animation: instant pop + flash at the moment the hold completes
  const ringPop = useRef(new Animated.Value(1)).current;
  const successFlash = useRef(new Animated.Value(0)).current;
  const holdAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [burstTrigger, setBurstTrigger] = useState(false);
  const [emberTrigger, setEmberTrigger] = useState(false);

  const [selectedGoal, setSelectedGoal] = useState('spiritual growth');
  const [selectedMood, setSelectedMood] = useState('peace');

  // [0] title, [1] subtitle, [2] hold area, [3] instruction, [4] chip
  const s = useStaggerEntry(isActive, 5, { baseDelay: 250, stagger: 120 });

  useEffect(() => {
    if (!isActive) return;
    
    // Fetch personalized data
    AsyncStorage.getItem('@onboarding_prayer_goal').then(goal => {
      if (goal === 'consistency') setSelectedGoal('consistency');
      if (goal === 'peace') setSelectedGoal('inner peace');
      if (goal === 'growth') setSelectedGoal('spiritual growth');
      if (goal === 'night') setSelectedGoal('night reflections');
    }).catch(() => {});

    AsyncStorage.getItem('@onboarding_mood').then(mood => {
      if (mood) setSelectedMood(mood.toLowerCase());
    }).catch(() => {});
    holdProgress.setValue(0);
    starScale.setValue(1);
    starRotation.setValue(0);
    starGlow.setValue(0);
    completionOpacity.setValue(0);
    completionSlide.setValue(10);
    ringGlow.setValue(0);
    bgBrightness.setValue(0);
    ringPop.setValue(1);
    successFlash.setValue(0);
    setIsComplete(false);
    setIsHolding(false);
    setBurstTrigger(false);
    setEmberTrigger(false);
  }, [isActive]);

  const handlePressIn = () => {
    if (isComplete) return;
    setIsHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    holdAnimRef.current = Animated.parallel([
      Animated.timing(holdProgress, {
        toValue: 1, duration: HOLD_DURATION, useNativeDriver: false,
      }),
      Animated.timing(starScale, {
        toValue: 1.4, duration: HOLD_DURATION, useNativeDriver: true,
      }),
      Animated.timing(starRotation, {
        toValue: 1, duration: HOLD_DURATION, useNativeDriver: true,
      }),
      Animated.timing(starGlow, {
        toValue: 1, duration: HOLD_DURATION, useNativeDriver: false,
      }),
    ]);

    holdAnimRef.current.start(({ finished }) => {
      if (finished) handleCompletion();
    });

    holdTimerRef.current = setTimeout(() => handleCompletion(), HOLD_DURATION + 50);
  };

  const handlePressOut = () => {
    if (isComplete) return;
    setIsHolding(false);
    holdAnimRef.current?.stop();
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    Animated.parallel([
      Animated.timing(holdProgress, { toValue: 0, duration: 300, useNativeDriver: false }),
      Animated.spring(starScale, { toValue: 1, damping: 15, stiffness: 120, useNativeDriver: true }),
      Animated.timing(starRotation, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(starGlow, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  const handleCompletion = () => {
    if (isComplete) return;
    setIsComplete(true);
    setIsHolding(false);

    // 3-phase haptic feedback: light → medium → success
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 120);
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 280);

    // ── Micro-animation: instant pop + flash at the exact completion moment ──
    // Ring area bounces sharply (scale up then spring back) — felt immediately
    Animated.sequence([
      Animated.timing(ringPop, { toValue: 1.07, duration: 110, useNativeDriver: true }),
      Animated.spring(ringPop, { toValue: 1, friction: 4, tension: 220, useNativeDriver: true }),
    ]).start();
    // White-gold flash washes the screen then fades — classic "success" feel
    Animated.sequence([
      Animated.timing(successFlash, { toValue: 0.55, duration: 80, useNativeDriver: true }),
      Animated.timing(successFlash, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();

    // Trigger particle burst
    setBurstTrigger(true);

    // Background brightens + ring glows
    Animated.parallel([
      Animated.timing(bgBrightness, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.timing(ringGlow, { toValue: 1, duration: 600, useNativeDriver: false }),
      // Star pulses brighter
      Animated.sequence([
        Animated.spring(starScale, { toValue: 1.8, friction: 4, tension: 120, useNativeDriver: true }),
        Animated.spring(starScale, { toValue: 1.4, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();

    // Floating embers after burst
    setTimeout(() => setEmberTrigger(true), 400);

    // Bismillah text fades in
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(completionOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(completionSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    setTimeout(() => onCommit(), 2200);
  };

  const progressStroke = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.PI * 2 * RING_R, 0],
  });
  const rotateInterp = starRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });
  const glowSize = starGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 32],
  });
  const ringGlowOp = ringGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });
  const bgOpacity = bgBrightness.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.22],
  });

  return (
    <View style={styles.container}>
      {/* Subtle background brightening on completion */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: Colors.accent.primary, opacity: bgOpacity }]}
        pointerEvents="none"
      />

      {/* Micro-animation: white-gold success flash */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF8E7', opacity: successFlash }]}
        pointerEvents="none"
      />

      {/* Mandala backdrop */}
      <View style={styles.mandalaWrap} pointerEvents="none">
        <AnimatedMandala size={360} color={Colors.accent.primary} opacity={0.06} />
      </View>

      {/* Title */}
      <Animated.View style={[styles.headerWrap, s[0]]}>
        <Text style={styles.title}>Make Your{'\n'}Commitment</Text>
      </Animated.View>

      <Animated.Text style={[styles.subtitle, s[1]]}>
        Hold the star for 3 seconds to seal{'\n'}your intention and begin your journey
      </Animated.Text>

      {/* Hold area */}
      <Animated.View style={[styles.holdAreaWrap, s[2]]}>
        {/* ringPop lives on its own wrapper so it doesn't conflict with the stagger transform above */}
        <Animated.View style={{ transform: [{ scale: ringPop }] }}>
        <View style={styles.particleContainer}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.holdArea}
            accessibilityRole="button"
            accessibilityLabel="Hold to commit"
            accessibilityHint="Hold the screen for 3 seconds to confirm your intention and begin."
          >
            {/* Dark filled circle */}
            <View style={styles.darkCircle} />

            {/* Completion ring glow overlay */}
            <Animated.View
              style={[
                styles.ringGlowOverlay,
                { opacity: ringGlowOp },
              ]}
            />

            {/* SVG rings and progress */}
            <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
              <Defs>
                <SvgGradient id="starGoldG" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#FFF4DC" />
                  <Stop offset="0.5" stopColor={Colors.accent.primary} />
                  <Stop offset="1" stopColor={Colors.accent.primary} />
                </SvgGradient>
                <SvgRadial id="circleGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={Colors.accent.primary} stopOpacity="0.08" />
                  <Stop offset="1" stopColor={Colors.accent.primary} stopOpacity="0" />
                </SvgRadial>
                <SvgRadial id="completionGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#FFF4DC" stopOpacity="0.25" />
                  <Stop offset="0.6" stopColor={Colors.accent.primary} stopOpacity="0.1" />
                  <Stop offset="1" stopColor={Colors.accent.primary} stopOpacity="0" />
                </SvgRadial>
              </Defs>

              {/* Inner glow */}
              <Circle cx={CENTER} cy={CENTER} r={RING_R - 10} fill="url(#circleGlow)" />

              {/* Static outer ring */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={RING_R}
                fill="none"
                stroke="rgba(212, 175, 55, 0.2)"
                strokeWidth={1.5}
              />

              {/* Progress ring */}
              <AnimatedCircle
                cx={CENTER}
                cy={CENTER}
                r={RING_R}
                fill="none"
                stroke={Colors.accent.primary}
                strokeWidth={2.5}
                strokeDasharray={`${Math.PI * 2 * RING_R}`}
                strokeDashoffset={progressStroke}
                strokeLinecap="round"
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
              />
            </Svg>

            {/* Star glow halo — rendered BEFORE star so star sits on top */}
            <Animated.View
              style={[
                styles.starGlowHalo,
                {
                  shadowRadius: glowSize,
                  opacity: starGlow,
                },
              ]}
              pointerEvents="none"
            />

            {/* Star overlay — scales, rotates, and glows on hold */}
            <Animated.View
              style={[
                styles.starOverlay,
                { transform: [{ scale: starScale }, { rotate: rotateInterp }] },
              ]}
              pointerEvents="none"
            >
              {/* Defs MUST live in the same SVG as the element using them */}
              <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                <Defs>
                  <SvgGradient id="starGold" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#FFF4DC" />
                    <Stop offset="0.4" stopColor="#E8C84A" />
                    <Stop offset="1" stopColor={Colors.accent.primary} />
                  </SvgGradient>
                </Defs>
                <Path d={STAR_PATH} fill="url(#starGold)" />
              </Svg>
            </Animated.View>
          </Pressable>

          {/* Particles rendered after Pressable so they appear on top of the circle */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {PARTICLES.map((p, i) => (
              <BurstParticle key={i} {...p} trigger={burstTrigger} />
            ))}
            {EMBERS.map((e, i) => (
              <FloatingEmber key={i} {...e} trigger={emberTrigger} />
            ))}
          </View>
        </View>
        </Animated.View>
      </Animated.View>

      {/* Instruction / Completion */}
      {!isComplete ? (
        <Animated.Text style={[styles.instruction, s[3]]}>
          {isHolding ? 'Keep holding...' : 'HOLD TO BEGIN'}
        </Animated.Text>
      ) : (
        <Animated.View
          style={{
            opacity: completionOpacity,
            transform: [{ translateY: completionSlide }],
            alignItems: 'center',
          }}
        >
          <Text style={styles.completionText}>Bismillah.</Text>
          <Text style={styles.completionSub}>Your intention is sealed.</Text>
        </Animated.View>
      )}

      {/* Bottom chip */}
      <Animated.View style={[styles.bottomChip, s[4]]}>
        <Text style={styles.chipText}>
          This moment of intention begins your transformation
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  mandalaWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  headerWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 26,
    color: '#F5EDE3',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(245, 237, 227, 0.70)',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 36,
  },
  holdAreaWrap: {
    marginBottom: 28,
  },
  particleContainer: {
    width: RING_SIZE + 20,
    height: RING_SIZE + 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  holdArea: {
    width: RING_SIZE + 20,
    height: RING_SIZE + 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkCircle: {
    position: 'absolute',
    width: RING_SIZE - 30,
    height: RING_SIZE - 30,
    borderRadius: (RING_SIZE - 30) / 2,
    backgroundColor: 'rgba(12, 18, 30, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.18)',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  ringGlowOverlay: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
    borderWidth: 6,
    borderColor: Colors.accent.primary,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 20,
  },
  starOverlay: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
  },
  starGlowHalo: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    // Must have a real background for shadow/glow to render on both platforms
    backgroundColor: '#E8C84A',
    shadowColor: '#FFF4DC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    elevation: 30,
  },
  instruction: {
    fontSize: 14,
    color: 'rgba(245, 237, 227, 0.62)',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  completionText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 26,
    color: Colors.accent.primary,
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(212, 175, 55, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  completionSub: {
    fontSize: 14,
    color: 'rgba(245, 237, 227, 0.6)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  bottomChip: {
    position: 'absolute',
    bottom: height * 0.10,
    left: 24,
    right: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 245, 220, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 220, 0.08)',
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.68)',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});