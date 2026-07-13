/**
 * LocationCompass — shared "Which Sky Are You Under?" location picker.
 *
 * A compass/astrolabe reveal instead of a generic "Enable Location" prompt —
 * tapping spins a gold needle while GPS resolves, then it settles on an angle
 * derived from longitude as the city fades in. Denied/opt-out reveals an
 * inline glass search card with curated city chips, not a full-screen list.
 *
 * Presentational core shared by onboarding's LocationScreen (full-screen,
 * starfield backdrop) and LocationPickerModal (bottom sheet on Home /
 * Prayer Times) — each wraps this in its own chrome and safe-area padding.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Animations } from '../theme/DesignSystem';
import { AnimatedMandala } from './AnimatedMandala';
import { ShimmerButton } from './ShimmerButton';
import { CITIES } from '../data/cityData';
import { saveUserLocation, formatLocation, UserLocation } from '../services/locationStorage';
import { logServiceError } from '../services/errorLoggingService';
import { useReduceMotion } from '../hooks/useReduceMotion';

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

// A small, globally-spread default shortlist — shown before the user types.
const POPULAR_CITIES: { city: string; country: string }[] = [
  { city: 'Mecca', country: 'Saudi Arabia' },
  { city: 'Medina', country: 'Saudi Arabia' },
  { city: 'Dubai', country: 'UAE' },
  { city: 'Istanbul', country: 'Turkey' },
  { city: 'Cairo', country: 'Egypt' },
  { city: 'Karachi', country: 'Pakistan' },
  { city: 'Jakarta', country: 'Indonesia' },
  { city: 'London', country: 'United Kingdom' },
];

/** Fades in whenever `text` changes — the phase-swapping status line. */
function FadeSwapText({ text, style }: { text: string; style: any }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [text]);
  return <Animated.Text style={[style, { opacity }]}>{text}</Animated.Text>;
}

type Phase = 'idle' | 'locating' | 'found' | 'manual';

interface LocationCompassProps {
  title?: string;
  /** Extra space above the title / below the bottom controls — callers own safe-area insets. */
  paddingTop?: number;
  paddingBottom?: number;
  /** Diameter of the mandala/needle/ring stack. Onboarding has more room than a sheet. */
  compassSize?: number;
  /** Onboarding wants an explicit "skip and keep going" escape hatch; a sheet's own close button already covers that. */
  showSkip?: boolean;
  onSkip?: () => void;
  /** Fires the moment a location is saved — before the settle animation finishes. Use for fire-and-forget side effects. */
  onResolved?: (location: UserLocation, longitude?: number) => void;
  /** Fires once the "found" confirmation has had its moment on screen. */
  onComplete: () => void;
  /** Ms spent on the "found" confirmation before onComplete fires. */
  settleDelay?: number;
  /** Full-screen contexts (onboarding) want the compass centered in the
   *  remaining space; a bounded sheet wants natural, content-sized flow. */
  fillHeight?: boolean;
}

export function LocationCompass({
  title = 'Which Sky Are You Under?',
  paddingTop = Spacing.lg,
  paddingBottom = Spacing.lg,
  compassSize = 260,
  showSkip = false,
  onSkip,
  onResolved,
  onComplete,
  settleDelay = 1100,
  fillHeight = false,
}: LocationCompassProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [resolved, setResolved] = useState<{ city: string; country: string } | null>(null);
  const [query, setQuery] = useState('');
  const reduceMotion = useReduceMotion();

  const rotation = useRef(new Animated.Value(0)).current; // "turns" — 0 = needle up
  const needleOpacity = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;

  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);
  const mountedRef = useRef(true);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      spinLoop.current?.stop();
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  // Idle sway — a slow, small breathing tilt, not a spin. Purely decorative,
  // so reduce-motion skips it entirely and leaves the needle still.
  useEffect(() => {
    if (phase !== 'idle' || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(rotation, { toValue: 0.018, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rotation, { toValue: -0.018, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rotation, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    spinLoop.current = loop;
    loop.start();
    return () => loop.stop();
  }, [phase, reduceMotion]);

  // Searching — a continuous, faster spin signals "looking for your sky".
  // Under reduce-motion the needle stays still; the ActivityIndicator elsewhere
  // in this component already communicates the in-progress state.
  useEffect(() => {
    if (phase !== 'locating') return;
    spinLoop.current?.stop();
    rotation.setValue(0);
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 850, easing: Easing.linear, useNativeDriver: true }),
    );
    spinLoop.current = loop;
    loop.start();
    return () => loop.stop();
  }, [phase, reduceMotion]);

  // Manual mode dims the needle — it's resting, not searching.
  useEffect(() => {
    Animated.timing(needleOpacity, {
      toValue: phase === 'manual' ? 0.4 : 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [phase]);

  const clearAdvanceTimer = () => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  };

  const completeLocation = useCallback(
    async (location: UserLocation, longitude?: number) => {
      await saveUserLocation(location);
      if (!mountedRef.current) return;

      setResolved({ city: location.city, country: location.country });
      setPhase('found');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      spinLoop.current?.stop();

      // The needle settles on an angle derived from real longitude when GPS
      // was used — a small authentic touch, not just a random flourish.
      const targetTurns = longitude !== undefined ? (longitude + 180) / 360 : 0.62;
      Animated.spring(rotation, {
        toValue: targetTurns,
        useNativeDriver: true,
        ...Animations.spring.bouncy,
      }).start();
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.55, duration: 500, useNativeDriver: true }),
      ]).start();
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, ...Animations.spring.bouncy }).start();

      onResolved?.(location, longitude);

      clearAdvanceTimer();
      advanceTimer.current = setTimeout(() => {
        if (mountedRef.current) onComplete();
      }, settleDelay);
    },
    [onResolved, onComplete, settleDelay],
  );

  const revealManual = useCallback(() => {
    if (!mountedRef.current) return;
    spinLoop.current?.stop();
    setPhase('manual');
  }, []);

  const handleUseLocation = useCallback(async () => {
    if (phase !== 'idle') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setPhase('locating');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        revealManual();
        return;
      }
      // Cached last-known fix returns immediately; only fall back to a fresh
      // low-accuracy fix (resolves from cell/wifi in ~1-2s) if there's none.
      let pos = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
      if (!pos) {
        pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000)),
        ]);
      }
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const rawCity = geo?.city || geo?.district || geo?.subregion || 'Current Location';
      const rawCountry = geo?.isoCountryCode || '';
      const formatted = formatLocation({ city: rawCity, country: rawCountry });
      await completeLocation(
        { ...formatted, latitude: pos.coords.latitude, longitude: pos.coords.longitude },
        pos.coords.longitude,
      );
    } catch (error) {
      logServiceError('LocationCompass', 'handleUseLocation', error instanceof Error ? error : new Error(String(error)));
      revealManual();
    }
  }, [phase, completeLocation, revealManual]);

  const handleManualPick = useCallback(
    (city: { city: string; country: string }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      completeLocation(formatLocation(city));
    },
    [completeLocation],
  );

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSkip?.();
  }, [onSkip]);

  const filteredCities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return POPULAR_CITIES;
    return CITIES.filter(
      (c) => c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [query]);

  const statusText =
    phase === 'locating'
      ? 'Finding your sky…'
      : phase === 'manual'
        ? 'Where shall we meet you?'
        : phase === 'found' && resolved
          ? `✓  ${resolved.city}, ${resolved.country}`
          : 'Your location tunes every prayer time and verse to where you stand.';

  const rotateDeg = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const inputBorderColor = inputFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.glass.border, 'rgba(212, 175, 55, 0.5)'],
  });

  const glowSize = compassSize * (220 / 260);
  const ringSize = compassSize * (200 / 260);
  const needleSize = compassSize * (130 / 260);

  return (
    <View style={[styles.container, fillHeight && styles.containerFill]}>
      {/* Header */}
      <View style={[styles.headerArea, { paddingTop }]}>
        <Text style={styles.title}>{title}</Text>
        <FadeSwapText text={statusText} style={styles.status} />
      </View>

      {/* Compass */}
      <View style={[styles.compassRow, fillHeight && styles.compassRowFill]}>
        <View style={{ width: compassSize, height: compassSize }}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <AnimatedMandala size={compassSize} color={Colors.accent.primary} opacity={0.42} webLayers={2} />
          </View>

          <Animated.View
            style={[
              styles.glow,
              {
                width: glowSize,
                height: glowSize,
                borderRadius: glowSize / 2,
                top: (compassSize - glowSize) / 2,
                left: (compassSize - glowSize) / 2,
                opacity: glowOpacity,
              },
            ]}
            pointerEvents="none"
          />

          <Svg
            width={ringSize}
            height={ringSize}
            viewBox="0 0 100 100"
            style={{ position: 'absolute', top: (compassSize - ringSize) / 2, left: (compassSize - ringSize) / 2 }}
            pointerEvents="none"
          >
            <Circle cx={50} cy={50} r={44} stroke={Colors.accent.primary} strokeOpacity={0.5} strokeWidth={1} fill="none" />
            <Line x1={50} y1={4} x2={50} y2={12} stroke={Colors.accent.primary} strokeOpacity={0.65} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={96} y1={50} x2={88} y2={50} stroke={Colors.accent.primary} strokeOpacity={0.65} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={50} y1={96} x2={50} y2={88} stroke={Colors.accent.primary} strokeOpacity={0.65} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={4} y1={50} x2={12} y2={50} stroke={Colors.accent.primary} strokeOpacity={0.65} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>

          <Animated.View
            style={[
              { position: 'absolute', top: (compassSize - needleSize) / 2, left: (compassSize - needleSize) / 2 },
              { opacity: needleOpacity, transform: [{ rotate: rotateDeg }] },
            ]}
            pointerEvents="none"
          >
            <Svg width={needleSize} height={needleSize} viewBox="0 0 100 100">
              <Path d="M50,16 L59,50 L50,58 L41,50 Z" fill="#E8C84A" />
              <Path d="M50,58 L59,50 L50,84 L41,50 Z" fill="rgba(107,142,174,0.55)" />
              <Circle cx={50} cy={50} r={6} fill={Colors.background.secondary} stroke={Colors.accent.primary} strokeWidth={1.5} />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.checkBadge, { transform: [{ scale: checkScale }] }]} pointerEvents="none">
            <Svg width={16} height={16} viewBox="0 0 16 16">
              <Path
                d="M3,8.5 L6.5,12 L13,4"
                fill="none"
                stroke={Colors.background.secondary}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomArea, { paddingBottom }]}>
        {phase === 'idle' && (
          <View>
            <ShimmerButton
              label="Reveal My Sky"
              onPress={handleUseLocation}
              accessibilityLabel="Use my current location"
            />
            <TouchableOpacity
              onPress={revealManual}
              hitSlop={HIT_SLOP}
              style={styles.manualLinkWrap}
              accessibilityRole="button"
              accessibilityLabel="Enter city manually"
            >
              <Text style={styles.linkText}>Enter it myself</Text>
            </TouchableOpacity>
            {showSkip && (
              <TouchableOpacity
                onPress={handleSkip}
                hitSlop={HIT_SLOP}
                style={styles.skipWrap}
                accessibilityRole="button"
                accessibilityLabel="Skip for now"
              >
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {phase === 'locating' && (
          <View style={styles.locatingWrap}>
            <ActivityIndicator color={Colors.accent.primary} />
          </View>
        )}

        {phase === 'manual' && (
          <View style={styles.manualCard}>
            <Animated.View style={[styles.inputWrap, { borderColor: inputBorderColor }]}>
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Search your city"
                placeholderTextColor={Colors.text.muted}
                autoCorrect={false}
                returnKeyType="search"
                onFocus={() =>
                  Animated.timing(inputFocusAnim, {
                    toValue: 1, duration: Animations.timing.fast, useNativeDriver: false,
                  }).start()
                }
                onBlur={() =>
                  Animated.timing(inputFocusAnim, {
                    toValue: 0, duration: Animations.timing.fast, useNativeDriver: false,
                  }).start()
                }
              />
            </Animated.View>

            {!query.trim() && <Text style={styles.chipsLabel}>POPULAR</Text>}

            <View style={styles.chipsWrap}>
              {filteredCities.map((c) => (
                <TouchableOpacity
                  key={`${c.city}-${c.country}`}
                  style={styles.chip}
                  activeOpacity={0.8}
                  onPress={() => handleManualPick(c)}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.city}, ${c.country}`}
                >
                  <Text style={styles.chipText}>{c.city}</Text>
                </TouchableOpacity>
              ))}
              {filteredCities.length === 0 && (
                <Text style={styles.noResults}>No cities match — try a different spelling</Text>
              )}
            </View>

            {showSkip && (
              <TouchableOpacity
                onPress={handleSkip}
                hitSlop={HIT_SLOP}
                style={styles.skipWrap}
                accessibilityRole="button"
                accessibilityLabel="Skip for now"
              >
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {phase === 'found' && (
          <FadeSwapText text="✦ Prayer times are ready for you" style={styles.foundWhisper} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  containerFill: { flex: 1 },
  headerArea: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: 24,
    color: '#F0E6D3',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(201,168,76,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  status: {
    fontSize: 14,
    color: 'rgba(176,196,215,0.85)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
  compassRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  compassRowFill: { flex: 1 },
  glow: {
    position: 'absolute',
    backgroundColor: Colors.accent.glow,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 8,
  },
  checkBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomArea: {
    paddingHorizontal: Spacing.xl,
  },
  manualLinkWrap: {
    marginTop: Spacing.lg,
    alignSelf: 'center',
  },
  linkText: {
    fontSize: 14,
    fontFamily: Typography.fonts.serif,
    color: Colors.text.secondary,
    letterSpacing: 0.3,
  },
  skipWrap: {
    marginTop: Spacing.md,
    alignSelf: 'center',
  },
  skipText: {
    fontSize: 12,
    color: Colors.text.muted,
    letterSpacing: 0.5,
  },
  locatingWrap: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualCard: {
    backgroundColor: Colors.glass.medium,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.glass.light,
  },
  input: {
    height: 46,
    fontSize: 15,
    color: Colors.text.primary,
    fontFamily: Typography.fonts.latin,
  },
  chipsLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.text.muted,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipText: {
    fontSize: 13,
    color: Colors.accent.light,
    fontFamily: Typography.fonts.serif,
    letterSpacing: 0.3,
  },
  noResults: {
    fontSize: 13,
    color: Colors.text.muted,
    fontStyle: 'italic',
    paddingVertical: Spacing.sm,
  },
  foundWhisper: {
    fontSize: 13,
    color: Colors.accent.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
