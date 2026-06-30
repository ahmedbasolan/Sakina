/**
 * Screen 7: Hold to Commit
 *
 * Hold for 3 seconds to seal your intention.
 * While holding: progress ring fills, dark circle warms with amber glow,
 * soft motes drift upward. Release before done → everything rewinds.
 * On completion: warm fill settles, "Bismillah." fades in gently.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Colors, Typography, Spacing } from '../../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  RadialGradient as SvgRadial,
  Stop,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { AnimatedMandala } from '../AnimatedMandala';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HOLD_DURATION = 3000;
const RING_SIZE = 220;
const CENTER = RING_SIZE / 2;
const RING_R = 86;

const STAR_PATH = `M${CENTER},${CENTER - 40} C${CENTER + 4},${CENTER - 12} ${CENTER + 12},${CENTER - 4} ${CENTER + 40},${CENTER} C${CENTER + 12},${CENTER + 4} ${CENTER + 4},${CENTER + 12} ${CENTER},${CENTER + 40} C${CENTER - 4},${CENTER + 12} ${CENTER - 12},${CENTER + 4} ${CENTER - 40},${CENTER} C${CENTER - 12},${CENTER - 4} ${CENTER - 4},${CENTER - 12} ${CENTER},${CENTER - 40} Z`;

// Soft upward mote — fades in while holding, drifts up, fades out
// Resets when `holding` goes false before completion
function WarmMote({ offsetX, delay, holding, reduceMotion }: {
  offsetX: number; delay: number; holding: boolean; reduceMotion: boolean;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (holding && !reduceMotion) {
      const start = () => {
        translateY.setValue(0);
        opacity.setValue(0);
        loopRef.current = Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(translateY, { toValue: -60, duration: 2200, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(opacity, { toValue: 0.55, duration: 600, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0, duration: 1600, useNativeDriver: true }),
            ]),
          ]),
        ]);
        loopRef.current.start(({ finished }) => { if (finished && holding) start(); });
      };
      start();
    } else {
      loopRef.current?.stop();
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        translateY.setValue(0);
      });
    }
    return () => loopRef.current?.stop();
  }, [holding, reduceMotion]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        moteBase,
        { left: CENTER + offsetX, bottom: CENTER - 6 },
        { opacity, transform: [{ translateY }] },
      ]}
    />
  );
}

// `dot` is used immediately via `.dot` below, so no-unused-styles can't see it.
const moteBase = StyleSheet.create({
  // eslint-disable-next-line react-native/no-unused-styles
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent.primary,
  },
}).dot;

const MOTES = [
  { offsetX: -28, delay: 0 },
  { offsetX: 10,  delay: 400 },
  { offsetX: -8,  delay: 800 },
  { offsetX: 24,  delay: 200 },
  { offsetX: -18, delay: 1100 },
  { offsetX: 36,  delay: 650 },
];

interface Props {
  isActive: boolean;
  onCommit: () => void;
}

export default function CommitScreen({ isActive, onCommit }: Props) {
  const [isHolding, setIsHolding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const insets = useSafeAreaInsets();

  // 0-1 progress value — drives ring, glow, and star scale
  const holdProgress = useRef(new Animated.Value(0)).current;
  const starScale    = useRef(new Animated.Value(1)).current;
  const warmGlow     = useRef(new Animated.Value(0)).current;   // inner amber fill
  const completionOpacity = useRef(new Animated.Value(0)).current;
  const completionSlide   = useRef(new Animated.Value(10)).current;
  const starRotation      = useRef(new Animated.Value(0)).current;
  const holdAnimRef       = useRef<Animated.CompositeAnimation | null>(null);
  const holdNativeAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const starRotateLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const holdTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  // useRef guard — React state is async, stale closure would let handleCompletion fire twice
  const isCompleteRef = useRef(false);

  // [0] title, [1] subtitle, [2] hold area, [3] chip
  const s = useStaggerEntry(isActive, 4, { baseDelay: 250, stagger: 120 });
  const reduceMotion = useReduceMotion();

  // starRotation: 0–360 degrees directly, extrapolate:extend for completion overshoot
  const starRotate = useMemo(() =>
    starRotation.interpolate({
      inputRange: [0, 360],
      outputRange: ['0deg', '360deg'],
      extrapolate: 'extend',
    }),
    [],
  );

  // Starts a calm rotation loop (resets to 0° each hold attempt for a clean start).
  // Recursive so it can stop cleanly mid-cycle without a loop jump.
  const startStarRotation = () => {
    starRotation.setValue(0);
    const runLoop = () => {
      starRotateLoopRef.current = Animated.timing(starRotation, {
        toValue: 360,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      });
      starRotateLoopRef.current.start(({ finished }) => {
        if (finished && !isCompleteRef.current) {
          starRotation.setValue(0);
          runLoop();
        }
      });
    };
    runLoop();
  };

  useEffect(() => {
    if (!isActive) return;
    starRotateLoopRef.current?.stop();
    starRotation.setValue(0);
    holdProgress.setValue(0);
    starScale.setValue(1);
    warmGlow.setValue(0);
    completionOpacity.setValue(0);
    completionSlide.setValue(10);
    isCompleteRef.current = false;
    setIsComplete(false);
    setIsHolding(false);
  }, [isActive]);

  const handlePressIn = () => {
    if (isCompleteRef.current) return;
    setIsHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // starScale + starRotation use native driver; holdProgress + warmGlow cannot —
    // split into two groups started simultaneously to avoid the mixed-driver warning.
    const nativeHold = Animated.timing(starScale, { toValue: 1.35, duration: HOLD_DURATION, useNativeDriver: true });
    holdNativeAnimRef.current = nativeHold;
    nativeHold.start();
    startStarRotation();

    holdAnimRef.current = Animated.parallel([
      Animated.timing(holdProgress, { toValue: 1, duration: HOLD_DURATION, useNativeDriver: false }),
      Animated.timing(warmGlow,     { toValue: 1, duration: HOLD_DURATION, useNativeDriver: false }),
    ]);
    holdAnimRef.current.start(({ finished }) => { if (finished) handleCompletion(); });
    holdTimerRef.current = setTimeout(() => handleCompletion(), HOLD_DURATION + 50);
  };

  const handlePressOut = () => {
    if (isCompleteRef.current) return;
    setIsHolding(false);
    holdAnimRef.current?.stop();
    holdNativeAnimRef.current?.stop();
    starRotateLoopRef.current?.stop();
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    Animated.spring(starScale, { toValue: 1, damping: 15, stiffness: 120, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.timing(holdProgress, { toValue: 0, duration: 500, useNativeDriver: false }),
      Animated.timing(warmGlow,     { toValue: 0, duration: 500, useNativeDriver: false }),
    ]).start();
  };

  const handleCompletion = () => {
    if (isCompleteRef.current) return;
    isCompleteRef.current = true;
    setIsComplete(true);
    setIsHolding(false);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 150);
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 350);

    // Stop hold rotation, then do a celebratory full spin before settling into
    // a gentle eternal rotation — calm but clearly completed.
    starRotateLoopRef.current?.stop();
    const currentDeg = (starRotation as any)._value || 0;
    Animated.timing(starRotation, {
      toValue: currentDeg + 360,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      starRotation.setValue(0);
      starRotateLoopRef.current = Animated.loop(
        Animated.timing(starRotation, {
          toValue: 360,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      starRotateLoopRef.current.start();
    });

    // Star blooms out then settles — more celebratory than a plain spring
    Animated.sequence([
      Animated.timing(starScale, { toValue: 1.55, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(starScale, { toValue: 1.2, friction: 7, tension: 50, useNativeDriver: true }),
    ]).start();

    // "Bismillah." fades in after the bloom peaks
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(completionOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(completionSlide,   { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    setTimeout(() => onCommit(), 2400);
  };

  const progressStroke = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.PI * 2 * RING_R, 0],
  });

  // Amber glow fills the interior of the ring as warmGlow rises 0→1
  const innerGlowOpacity = warmGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });
  // Ring color brightens slightly when near completion
  const ringOpacity = warmGlow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  // Outer background warms very subtly
  const bgOpacity = warmGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.10] });

  return (
    <View style={styles.container}>
      {/* Very subtle background warming */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: Colors.accent.primary, opacity: bgOpacity }]}
        pointerEvents="none"
      />

      {/* Mandala */}
      <View style={styles.mandalaWrap} pointerEvents="none">
        <AnimatedMandala size={360} color={Colors.accent.primary} opacity={0.15} webLayers={2} />
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
        <View style={styles.particleContainer}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.holdArea}
            accessibilityRole="button"
            accessibilityLabel="Hold to commit"
            accessibilityHint="Hold for 3 seconds to confirm your intention."
          >
            {/* Dark filled circle */}
            <View style={styles.darkCircle} />

            {/* Amber inner glow — grows as you hold */}
            <Animated.View style={[styles.innerGlow, { opacity: innerGlowOpacity }]} />

            {/* SVG rings */}
            <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
              <Defs>
                <SvgRadial id="circleGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0"   stopColor={Colors.accent.primary} stopOpacity="0.06" />
                  <Stop offset="1"   stopColor={Colors.accent.primary} stopOpacity="0" />
                </SvgRadial>
              </Defs>
              <Circle cx={CENTER} cy={CENTER} r={RING_R - 10} fill="url(#circleGlow)" />
              {/* Static outer ring — visible guide before holding begins */}
              <Circle
                cx={CENTER} cy={CENTER} r={RING_R}
                fill="none"
                stroke="rgba(212, 175, 55, 0.35)"
                strokeWidth={2}
              />
              {/* Progress ring */}
              <AnimatedCircle
                cx={CENTER} cy={CENTER} r={RING_R}
                fill="none"
                stroke={Colors.accent.primary}
                strokeWidth={2.5}
                strokeDasharray={`${Math.PI * 2 * RING_R}`}
                strokeDashoffset={progressStroke}
                strokeLinecap="round"
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
                opacity={ringOpacity as any}
              />
            </Svg>

            {/* Star — scales up and rotates while holding */}
            <Animated.View
              style={[styles.starOverlay, { transform: [{ scale: starScale }, { rotate: starRotate }] }]}
              pointerEvents="none"
            >
              <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                <Defs>
                  <SvgGradient id="starGold" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0"   stopColor="#FFF4DC" />
                    <Stop offset="0.4" stopColor="#E8C84A" />
                    <Stop offset="1"   stopColor={Colors.accent.primary} />
                  </SvgGradient>
                </Defs>
                <Path d={STAR_PATH} fill="url(#starGold)" />
              </Svg>
            </Animated.View>
          </Pressable>

          {/* Soft motes drift up while holding */}
          {MOTES.map((m, i) => (
            <WarmMote key={i} offsetX={m.offsetX} delay={m.delay} holding={isHolding} reduceMotion={reduceMotion} />
          ))}
        </View>
      </Animated.View>

      {/* Instruction / Completion text */}
      {!isComplete ? (
        <Animated.Text style={[styles.instruction, s[3]]}>
          {isHolding ? 'Keep holding...' : 'HOLD TO BEGIN'}
        </Animated.Text>
      ) : (
        <Animated.View style={[styles.completionWrap, { opacity: completionOpacity, transform: [{ translateY: completionSlide }] }]}>
          <Text style={styles.completionText}>Bismillah.</Text>
          <Text style={styles.completionSub}>Your intention is sealed.</Text>
          <Text style={styles.completionHint}>Your first verse awaits</Text>
        </Animated.View>
      )}

      {/* Bottom chip */}
      <Animated.View style={[styles.bottomChip, s[3], { bottom: Math.max(insets.bottom + Spacing.xxl, Spacing.xxxl) }]}>
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
    paddingHorizontal: Spacing.xxl,
  },
  mandalaWrap: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  headerWrap: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: 26,
    color: '#F5EDE3',
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(212, 175, 55, 0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(245, 237, 227, 0.65)',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: Spacing.xxl,
  },
  holdAreaWrap: {
    marginBottom: Spacing.xl,
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
    backgroundColor: 'rgba(8, 14, 26, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  innerGlow: {
    position: 'absolute',
    width: RING_SIZE - 30,
    height: RING_SIZE - 30,
    borderRadius: (RING_SIZE - 30) / 2,
    backgroundColor: Colors.accent.primary,
  },
  starOverlay: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
  },
  instruction: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.55)',
    textAlign: 'center',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  completionWrap: {
    alignItems: 'center',
  },
  completionText: {
    fontFamily: Typography.fonts.serif,
    fontSize: 28,
    color: Colors.accent.primary,
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(212, 175, 55, 0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  completionSub: {
    fontSize: 14,
    color: 'rgba(245, 237, 227, 0.75)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  completionHint: {
    fontSize: 12,
    color: 'rgba(212, 175, 55, 0.60)',
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: Spacing.sm,
    fontFamily: Typography.fonts.serif,
    fontStyle: 'italic',
  },
  bottomChip: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 245, 220, 0.05)',
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 220, 0.08)',
  },
  chipText: {
    fontSize: Typography.sizes.detail,
    color: 'rgba(245, 237, 227, 0.55)',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 18,
  },
});
