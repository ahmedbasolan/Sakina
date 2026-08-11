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
  Pressable,
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
import { qiblaBearing, formatBearing } from '../utils/qibla';

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

// ─── Astrolabe ring geometry ────────────────────────────────────────────────
// The ring SVGs use a fixed 0-100 viewBox regardless of compassSize — pixel
// scaling is handled by the outer <Svg width/height>, so this geometry only
// needs computing once, at module load, not per render.

/** Point on a circle of radius `r` centered at (50,50); `angleDeg` measured clockwise from north (top). */
function ringPoint(angleDeg: number, r: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [50 + r * Math.cos(rad), 50 + r * Math.sin(rad)];
}

// Classic 8-pointed star ({8/3} star polygon) inscribed exactly on the main
// ring (r=44) — the same family of Islamic star-lattice geometry as the
// mandala backdrop (AnimatedMandala's generateStarWeb), so the ring reads as
// part of one astrolabe instrument rather than a plain compass rose sitting
// in front of unrelated decoration.
const ASTROLABE_LATTICE_PATH = Array.from({ length: 8 }, (_, i) => {
  const [x1, y1] = ringPoint(i * 45, 44);
  const [x2, y2] = ringPoint(((i + 3) % 8) * 45, 44);
  return `M ${x1.toFixed(2)},${y1.toFixed(2)} L ${x2.toFixed(2)},${y2.toFixed(2)}`;
}).join(' ');

// Intercardinal (NE/SE/SW/NW) tick marks — shorter and fainter than the four
// cardinal ticks below, so N/E/S/W still read first at a glance.
const INTERCARDINAL_TICKS = [45, 135, 225, 315].map((angle) => {
  const [x1, y1] = ringPoint(angle, 44);
  const [x2, y2] = ringPoint(angle, 39);
  return { key: angle, x1, y1, x2, y2 };
});

// A graduated degree scale around the outer limb — the fine markings a real
// astrolabe's limb/rule carries, and the detail that makes the limb's own
// rotation (see the "locating" search animation) actually visible: a bare
// stroked circle is rotationally symmetric, so spinning it alone would show
// no motion at all.
const LIMB_SCALE_DOTS = Array.from({ length: 24 }, (_, i) => {
  const [cx, cy] = ringPoint(i * 15, 48);
  return { key: i, cx, cy, major: i % 6 === 0 };
});

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
  // Phase changes are announced: the compass is silent to a screen reader, so
  // this line is the only signal that locating started, failed, or succeeded.
  return (
    <Animated.Text style={[style, { opacity }]} accessibilityLiveRegion="polite">
      {text}
    </Animated.Text>
  );
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
  /**
   * Ms to dwell on the "found" confirmation before onComplete fires. Measured
   * from the moment the needle finishes settling, not from when it starts —
   * previously the screen navigated away mid-spring, cutting off the one
   * payoff animation in the flow.
   */
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
  settleDelay = 700,
  fillHeight = false,
}: LocationCompassProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [resolved, setResolved] = useState<{ city: string; country: string } | null>(null);
  const [qibla, setQibla] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const reduceMotion = useReduceMotion();

  const rotation = useRef(new Animated.Value(0)).current; // "turns" — 0 = needle up
  // The limb (outer graduated ring) and the star lattice turn against each
  // other while searching — like a rete rotating over a fixed mater plate —
  // instead of only the needle spinning. A single element spinning alone is
  // indistinguishable from a generic loading wheel; two rings counter-
  // rotating around a needle that's doing its own slower sweep reads as an
  // instrument actually working, not a spinner borrowed from anywhere.
  const limbRotation = useRef(new Animated.Value(0)).current;
  const latticeRotation = useRef(new Animated.Value(0)).current;
  const needleOpacity = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);
  const limbLoop = useRef<Animated.CompositeAnimation | null>(null);
  const latticeLoop = useRef<Animated.CompositeAnimation | null>(null);
  const mountedRef = useRef(true);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirrors `rotation`'s current value. The settle animation needs to know
  // where the needle actually is so it can always travel FORWARD to the qibla
  // (see completeLocation) — reading it back is the only way, since the spin
  // loop leaves it at an arbitrary point whenever GPS happens to resolve.
  const rotationValue = useRef(0);
  const limbRotationValue = useRef(0);
  const latticeRotationValue = useRef(0);

  useEffect(() => {
    const id = rotation.addListener(({ value }) => {
      rotationValue.current = value;
    });
    return () => rotation.removeListener(id);
  }, [rotation]);

  useEffect(() => {
    const id = limbRotation.addListener(({ value }) => { limbRotationValue.current = value; });
    return () => limbRotation.removeListener(id);
  }, [limbRotation]);

  useEffect(() => {
    const id = latticeRotation.addListener(({ value }) => { latticeRotationValue.current = value; });
    return () => latticeRotation.removeListener(id);
  }, [latticeRotation]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      spinLoop.current?.stop();
      limbLoop.current?.stop();
      latticeLoop.current?.stop();
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

  // Searching — the limb turns one way, the lattice turns the other, and the
  // needle sweeps slower than either, like it's actively sampling rather than
  // spinning in place. Deliberately un-synchronised periods (2600 / 4200 /
  // 3100ms) so no two layers ever repeat the same relative alignment twice
  // during a typical search — a locked-step rhythm is what makes multi-layer
  // motion read as "gears" instead of "calculating."
  // Under reduce-motion every layer stays still; the ActivityIndicator
  // elsewhere in this component already communicates the in-progress state.
  useEffect(() => {
    if (phase !== 'locating') return;
    spinLoop.current?.stop();
    limbLoop.current?.stop();
    latticeLoop.current?.stop();
    rotation.setValue(0);
    limbRotation.setValue(0);
    latticeRotation.setValue(0);
    if (reduceMotion) return;

    const needle = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }),
    );
    const limb = Animated.loop(
      Animated.timing(limbRotation, { toValue: 1, duration: 4200, easing: Easing.linear, useNativeDriver: true }),
    );
    const lattice = Animated.loop(
      Animated.timing(latticeRotation, { toValue: -1, duration: 3100, easing: Easing.linear, useNativeDriver: true }),
    );
    spinLoop.current = needle;
    limbLoop.current = limb;
    latticeLoop.current = lattice;
    needle.start();
    limb.start();
    lattice.start();
    return () => {
      needle.stop();
      limb.stop();
      lattice.stop();
    };
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
      limbLoop.current?.stop();
      latticeLoop.current?.stop();
      // The two search rings lock back to their resting alignment at the same
      // moment the needle settles on the bearing below — the "everything
      // clicks into place" beat that makes the search read as having found
      // something, not just stopped.
      const ringSettleDuration = reduceMotion ? 0 : 650;
      Animated.timing(limbRotation, {
        toValue: Math.round(limbRotationValue.current),
        duration: ringSettleDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      Animated.timing(latticeRotation, {
        toValue: Math.round(latticeRotationValue.current),
        duration: ringSettleDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // The needle settles on the QIBLA — the real great-circle bearing from
      // here to the Kaaba. A compass needle carries a strong, universal promise
      // that it points AT something; the previous behaviour mapped longitude
      // onto a circle, which is unreadable and quietly breaks that promise.
      // This is the one direction a Muslim app's compass should ever settle on,
      // and it is free: the coordinates are already in hand.
      const bearing =
        location.latitude !== undefined && location.longitude !== undefined
          ? qiblaBearing(location.latitude, location.longitude)
          : null;
      setQibla(bearing);

      const advance = () => {
        clearAdvanceTimer();
        advanceTimer.current = setTimeout(() => {
          if (mountedRef.current) onComplete();
        }, settleDelay);
      };

      if (bearing === null) {
        // Manually-picked city with no coordinates — nothing honest to point
        // at, so ease the needle back to north rather than inventing an angle.
        Animated.timing(rotation, {
          toValue: Math.round(rotationValue.current),
          duration: reduceMotion ? 0 : 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(advance);
      } else if (reduceMotion) {
        rotation.setValue(bearing / 360);
        advance();
      } else {
        // Always travel FORWARD, and always through at least one full turn:
        // the spin loop leaves the needle at an arbitrary angle, so springing
        // straight to the target would sometimes visibly rewind — which reads
        // as "the compass is confused" at the exact moment it should read as
        // "found it". floor()+1 guarantees a forward sweep every time.
        const targetTurns = Math.floor(rotationValue.current) + 1 + bearing / 360;
        Animated.spring(rotation, {
          toValue: targetTurns,
          useNativeDriver: true,
          ...Animations.spring.gentle,
        }).start(advance); // dwell starts when the needle lands, not before
      }

      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.55, duration: 500, useNativeDriver: true }),
      ]).start();
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, ...Animations.spring.bouncy }).start();

      onResolved?.(location, longitude);
    },
    [onResolved, onComplete, settleDelay, reduceMotion, rotation, limbRotation, latticeRotation, glowOpacity, checkScale],
  );

  const revealManual = useCallback(() => {
    if (!mountedRef.current) return;
    spinLoop.current?.stop();
    limbLoop.current?.stop();
    latticeLoop.current?.stop();
    // Unwind to north instead of freezing mid-spin. Stopping the loop used to
    // abandon the needle at whatever arbitrary angle GPS failed at — a dimmed
    // needle stuck at 237° reads as a broken instrument, not a resting one.
    // Same treatment for the two search rings, or they'd freeze mid-turn too.
    const unwindDuration = reduceMotion ? 0 : 500;
    Animated.timing(rotation, {
      toValue: Math.round(rotationValue.current),
      duration: unwindDuration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(limbRotation, {
      toValue: Math.round(limbRotationValue.current),
      duration: unwindDuration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(latticeRotation, {
      toValue: Math.round(latticeRotationValue.current),
      duration: unwindDuration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setPhase('manual');
  }, [rotation, limbRotation, latticeRotation, reduceMotion]);

  const handleUseLocation = useCallback(async () => {
    // 'manual' is allowed through so a denied/failed attempt can be retried —
    // previously the only way out of manual mode was to pick a city, which
    // stranded anyone who denied the permission prompt by accident.
    if (phase !== 'idle' && phase !== 'manual') return;
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

  // Now that the needle lands on a real bearing, say so — an unexplained angle
  // is just a flourish; a named one is information the user can act on.
  const foundWhisper =
    qibla !== null
      ? `✦ Qibla ${formatBearing(qibla)} · prayer times ready`
      : '✦ Prayer times are ready for you';

  const rotateDeg = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const limbRotateDeg = limbRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const latticeRotateDeg = latticeRotation.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg', '0deg'] });
  const inputBorderColor = inputFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.glass.border, 'rgba(212, 175, 55, 0.5)'],
  });

  const glowSize = compassSize * (220 / 260);
  const ringSize = compassSize * (200 / 260);
  const needleSize = compassSize * (130 / 260);

  const canTapCompass = phase === 'idle' || phase === 'manual';

  // Place the confirmation badge on the ring itself at 45° (upper-right).
  // The ring's SVG circle is r=44 in a 100 viewBox, so its rendered radius is
  // ringSize * 0.44; 0.7071 is cos/sin of 45°.
  const badgeOffset = useMemo(() => {
    const CHECK_BADGE_SIZE = 28;
    const radius = ringSize * 0.44;
    const delta = radius * 0.7071;
    return {
      left: compassSize / 2 + delta - CHECK_BADGE_SIZE / 2,
      top: compassSize / 2 - delta - CHECK_BADGE_SIZE / 2,
    };
  }, [compassSize, ringSize]);

  return (
    <View style={[styles.container, fillHeight && styles.containerFill]}>
      {/* Header */}
      <View style={[styles.headerArea, { paddingTop }]}>
        <Text style={styles.title}>{title}</Text>
        <FadeSwapText text={statusText} style={styles.status} />
      </View>

      {/* Compass — the hero element, and therefore the primary target.
          Every layer below is pointerEvents="none", so before this the largest
          thing on screen was inert decoration while the real control sat in a
          small button underneath: the biggest target was not the target. */}
      <View style={[styles.compassRow, fillHeight && styles.compassRowFill]}>
        <Pressable
          onPress={canTapCompass ? handleUseLocation : undefined}
          onPressIn={() => {
            if (!canTapCompass || reduceMotion) return;
            Animated.spring(pressScale, { toValue: 0.96, useNativeDriver: true, ...Animations.spring.gentle }).start();
          }}
          onPressOut={() => {
            if (reduceMotion) return;
            Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, ...Animations.spring.gentle }).start();
          }}
          disabled={!canTapCompass}
          accessibilityRole="button"
          accessibilityLabel="Use my current location"
          accessibilityHint={canTapCompass ? 'Finds your city and the direction of the qibla' : undefined}
          accessibilityState={{ disabled: !canTapCompass, busy: phase === 'locating' }}
        >
        <Animated.View
          style={{ width: compassSize, height: compassSize, transform: [{ scale: pressScale }] }}
        >
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <AnimatedMandala size={compassSize} color={Colors.accent.primary} opacity={0.55} webLayers={2} />
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

          {/* Limb (outer graduated ring) — rotates independently while searching,
              like a rete turning over a fixed mater plate. A bare stroked
              circle is rotationally symmetric, so the degree-scale dots exist
              specifically to make this layer's motion visible. */}
          <Animated.View
            style={{
              position: 'absolute',
              top: (compassSize - ringSize) / 2,
              left: (compassSize - ringSize) / 2,
              transform: [{ rotate: limbRotateDeg }],
            }}
            pointerEvents="none"
          >
            <Svg width={ringSize} height={ringSize} viewBox="0 0 100 100">
              <Circle cx={50} cy={50} r={48} stroke={Colors.accent.primary} strokeOpacity={0.22} strokeWidth={0.6} fill="none" />
              {LIMB_SCALE_DOTS.map((d) => (
                <Circle
                  key={d.key}
                  cx={d.cx}
                  cy={d.cy}
                  r={d.major ? 0.7 : 0.4}
                  fill={Colors.accent.primary}
                  fillOpacity={d.major ? 0.55 : 0.3}
                />
              ))}
            </Svg>
          </Animated.View>

          {/* 8-point star lattice — turns the opposite way from the limb above.
              Bound to the ring itself, not the looser ambient mandala backdrop,
              so it reads as an astrolabe rete plate rather than a compass icon
              floating over unrelated decoration. */}
          <Animated.View
            style={{
              position: 'absolute',
              top: (compassSize - ringSize) / 2,
              left: (compassSize - ringSize) / 2,
              transform: [{ rotate: latticeRotateDeg }],
            }}
            pointerEvents="none"
          >
            <Svg width={ringSize} height={ringSize} viewBox="0 0 100 100">
              <Path d={ASTROLABE_LATTICE_PATH} stroke={Colors.accent.primary} strokeOpacity={0.32} strokeWidth={0.7} fill="none" />
            </Svg>
          </Animated.View>

          {/* Main ring + ticks — the one fixed layer. Everything else moves
              against this frame, which is what makes the motion read as
              layered instrument parts rather than the whole thing spinning. */}
          <Svg
            width={ringSize}
            height={ringSize}
            viewBox="0 0 100 100"
            style={{ position: 'absolute', top: (compassSize - ringSize) / 2, left: (compassSize - ringSize) / 2 }}
            pointerEvents="none"
          >
            <Circle cx={50} cy={50} r={44} stroke={Colors.accent.primary} strokeOpacity={0.8} strokeWidth={1.5} fill="none" />
            {INTERCARDINAL_TICKS.map((t) => (
              <Line
                key={t.key}
                x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke={Colors.accent.primary}
                strokeOpacity={0.45}
                strokeWidth={1.2}
                strokeLinecap="round"
              />
            ))}
            <Line x1={50} y1={4} x2={50} y2={12} stroke={Colors.accent.primary} strokeOpacity={0.85} strokeWidth={1.8} strokeLinecap="round" />
            <Line x1={96} y1={50} x2={88} y2={50} stroke={Colors.accent.primary} strokeOpacity={0.85} strokeWidth={1.8} strokeLinecap="round" />
            <Line x1={50} y1={96} x2={50} y2={88} stroke={Colors.accent.primary} strokeOpacity={0.85} strokeWidth={1.8} strokeLinecap="round" />
            <Line x1={4} y1={50} x2={12} y2={50} stroke={Colors.accent.primary} strokeOpacity={0.85} strokeWidth={1.8} strokeLinecap="round" />
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

          <Animated.View
            style={[
              styles.checkBadge,
              // Sit ON the ring at 45°, scaled with the compass. Hardcoded
              // top/right pinned the badge to the container instead, so it
              // floated detached in the mandala field and drifted whenever a
              // caller passed a different compassSize.
              { top: badgeOffset.top, left: badgeOffset.left, transform: [{ scale: checkScale }] },
            ]}
            pointerEvents="none"
          >
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
        </Animated.View>
        </Pressable>
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

        {phase === 'found' && <FadeSwapText text={foundWhisper} style={styles.foundWhisper} />}
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
    // top/left are computed from compassSize at render — see badgeOffset.
    position: 'absolute',
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
