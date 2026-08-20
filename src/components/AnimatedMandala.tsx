/**
 * AnimatedMandala — Slowly rotating concentric Islamic geometric star.
 *
 * Recreates the dense "celestial wireframe" reference: a 12-fold sacred
 * geometry rose built by overlaying every star polygon the dodecagon
 * supports — {12/2}, {12/3}, {12/4}, {12/5} — so their chords intersect
 * into the intricate lattice seen in the reference image. Faint outer
 * boundary, layered mid rings, and a clean hollow core complete it.
 *
 * The full pattern is precomputed once (it is rotation-invariant), and the
 * whole SVG is rotated as one cheap transform on the native thread.
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { Colors } from '../theme/DesignSystem';
import { Animated, Easing } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { useReduceMotion } from '../hooks/useReduceMotion';

const VB = 100;
const CENTER = VB / 2;
const OUTER_R = CENTER * 0.96;

/**
 * Generates an SVG path connecting `points` vertices on a circle, each joined
 * to the vertex `step` positions away. A full pass over all points draws the
 * complete {points/step} star polygon as one continuous stroke set.
 */
const generateStarWeb = (
  points: number,
  step: number,
  radius: number,
  cx: number,
  cy: number,
  phase = -Math.PI / 2,
) => {
  const seg: string[] = [];
  for (let i = 0; i < points; i++) {
    const a1 = (i * Math.PI * 2) / points + phase;
    const a2 = ((i + step) * Math.PI * 2) / points + phase;
    seg.push(
      `M ${cx + radius * Math.cos(a1)},${cy + radius * Math.sin(a1)} L ${cx + radius * Math.cos(a2)},${cy + radius * Math.sin(a2)}`,
    );
  }
  return seg.join(' ');
};

interface AnimatedMandalaProps {
  size?: number;
  color?: string;
  opacity?: number;
  direction?: 'cw' | 'ccw';
  /** Number of points in the star (12 = classic Islamic dodecagram). */
  points?: number;
  /** Multiplies every stroke width — lets the lattice read at tiny sizes
   *  (e.g. the 44px progress ring) without thickening the large backdrops. */
  strokeScale?: number;
  /** Cap the number of star-polygon overlay layers. Undefined = all layers.
   *  Use 2–3 for background mandalas: same geometry, less density. */
  webLayers?: number;
}

function AnimatedMandalaInner({
  size = 300,
  color = Colors.accent.primary,
  opacity = 0.5,
  direction = 'cw',
  points = 12,
  strokeScale = 1,
  webLayers,
}: AnimatedMandalaProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) return; // honour system accessibility preference — no infinite loop
    const anim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 120000, // Very slow, meditative celestial rotation (2 mins)
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [rotation, reduceMotion]);

  // useMemo prevents a new interpolation node being registered on every re-render
  const rotate = useMemo(
    () =>
      rotation.interpolate({
        inputRange: [0, 1],
        outputRange: direction === 'cw' ? ['0deg', '360deg'] : ['360deg', '0deg'],
      }),
    [direction],
  );

  // Precompute the rotation-invariant lattice once. The reference is a fully
  // layered 12-fold rose — overlapping squares {12/3}, triangles {12/4}, and
  // the fine star {12/5} — but rendered FAINT, so the density reads as elegant
  // lace rather than clutter. Steps span 3..(n/2-1); {n/6} (diameters) skipped.
  const geometry = useMemo(() => {
    const maxStep = Math.floor(points / 2);
    const allSteps: number[] = [];
    for (let s = 3; s <= maxStep - 1; s++) allSteps.push(s);
    if (allSteps.length === 0) allSteps.push(maxStep);
    const steps = webLayers !== undefined ? allSteps.slice(0, webLayers) : allSteps;

    const webs = steps.map((step) => ({
      d: generateStarWeb(points, step, OUTER_R, CENTER, CENTER),
      // Uniform, low opacity keeps the lattice delicate; the steepest star
      // (closest to maxStep) gets a touch more presence as the focal layer.
      w: 0.16,
      o: step === maxStep - 1 ? 0.34 : 0.24,
    }));

    return { webs };
  }, [points, webLayers]);

  return (
    <Animated.View
      // The lattice is ~50 stroked vector paths and it rotates continuously.
      // Without a hardware layer, Android re-rasterises those paths every
      // frame of the rotation; with one, the view is rasterised once into a
      // GPU texture and the rotation is just a matrix on that texture. This is
      // the Android counterpart to `shouldRasterizeIOS`, and it is only a win
      // while something is actually animating — a hardware layer on a static
      // view is wasted GPU memory, so it follows the same reduce-motion gate
      // that decides whether the rotation runs at all.
      renderToHardwareTextureAndroid={!reduceMotion}
      style={{ width: size, height: size, opacity, transform: [{ rotate }] }}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
        <G fill="none" stroke={color} strokeLinejoin="round" strokeLinecap="round">
          {/* Faint outer circular boundary */}
          <Circle cx={CENTER} cy={CENTER} r={OUTER_R} strokeWidth={0.3 * strokeScale} opacity={0.5} />

          {/* Full layered star lattice — faint, so it reads as lace */}
          {geometry.webs.map((web, i) => (
            <Path key={i} d={web.d} strokeWidth={web.w * strokeScale} opacity={web.o} />
          ))}

          {/* Mid ring tracing where the chords cross into the inner star */}
          <Circle cx={CENTER} cy={CENTER} r={OUTER_R * 0.5} strokeWidth={0.14 * strokeScale} opacity={0.2} />

          {/* Clean, clearly readable hollow core */}
          <Circle cx={CENTER} cy={CENTER} r={OUTER_R * 0.18} strokeWidth={0.3 * strokeScale} opacity={0.5} />
        </G>
      </Svg>
    </Animated.View>
  );
}

export const AnimatedMandala = React.memo(AnimatedMandalaInner);
