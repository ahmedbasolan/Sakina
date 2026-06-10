/**
 * SakinaLantern — the app's brand mark (fanoos) as a crisp vector.
 *
 * Recreates the glowing gold lantern from the app icon: an onion-domed
 * crown, a softly bulbous body lit from within by a warm radial glow, fine
 * frame ribs, and a finial drop below. Shapes are deliberately rounded —
 * no faceted/angular polygons — so it reads as warm and inviting.
 *
 * The inner light gently breathes (honours reduce-motion). Drop it anywhere
 * a centred emblem is needed; size scales the whole mark proportionally.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, {
  Path,
  Circle,
  Ellipse,
  Line,
  Defs,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import { useReduceMotion } from '../hooks/useReduceMotion';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// Native viewBox — lantern lives in a 120 (w) × 170 (h) frame.
const VB_W = 120;
const VB_H = 170;

interface Props {
  /** Rendered height in px. Width scales to keep the lantern's aspect ratio. */
  size?: number;
  /** Set false to freeze the inner flame (e.g. for a static thumbnail). */
  animated?: boolean;
}

export function SakinaLantern({ size = 130, animated = true }: Props) {
  const reduceMotion = useReduceMotion();
  const flame = useRef(new Animated.Value(0.78)).current;

  useEffect(() => {
    if (!animated || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flame, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          // SVG element opacity is a prop, not a style — must run on the JS
          // thread so react-native-svg actually re-renders each frame.
          useNativeDriver: false,
        }),
        Animated.timing(flame, {
          toValue: 0.72,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, reduceMotion, flame]);

  const width = (size * VB_W) / VB_H;

  return (
    <View style={{ width, height: size }} pointerEvents="none">
      <Svg width={width} height={size} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <SvgLinearGradient id="lanternGold" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F4D88A" />
            <Stop offset="0.5" stopColor="#E8C84A" />
            <Stop offset="1" stopColor="#B8860B" />
          </SvgLinearGradient>
          <RadialGradient id="lanternFlame" cx="0.5" cy="0.46" r="0.55">
            <Stop offset="0" stopColor="#FFF6D8" stopOpacity="1" />
            <Stop offset="0.45" stopColor="#FFE9A6" stopOpacity="0.9" />
            <Stop offset="0.8" stopColor="#E8B53C" stopOpacity="0.45" />
            <Stop offset="1" stopColor="#E8B53C" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* --- Suspension --- */}
        {/* Top finial bead + hanging ring */}
        <Circle cx={60} cy={10} r={3} fill="url(#lanternGold)" />
        <Circle cx={60} cy={20} r={5.5} fill="none" stroke="url(#lanternGold)" strokeWidth={2.4} />
        <Line x1={60} y1={25.5} x2={60} y2={32} stroke="url(#lanternGold)" strokeWidth={2.4} strokeLinecap="round" />

        {/* --- Crown (onion dome) --- */}
        <Path
          d="M44,52 C44,38 50,30 60,30 C70,30 76,38 76,52 Z"
          fill="url(#lanternGold)"
          opacity={0.95}
        />
        {/* Crown shoulder rim */}
        <Path
          d="M40,52 L80,52 C80,57 77,60 72,60 L48,60 C43,60 40,57 40,52 Z"
          fill="url(#lanternGold)"
        />

        {/* --- Body --- */}
        {/* Warm glow filling the body, gently breathing */}
        {animated && !reduceMotion ? (
          <AnimatedEllipse cx={60} cy={92} rx={26} ry={32} fill="url(#lanternFlame)" opacity={flame} />
        ) : (
          <Ellipse cx={60} cy={92} rx={26} ry={32} fill="url(#lanternFlame)" opacity={0.82} />
        )}

        {/* Body cage — rounded, bulbous, no harsh facets */}
        <Path
          d="M48,60
             C40,62 36,72 36,90
             C36,110 42,124 50,130
             L70,130
             C78,124 84,110 84,90
             C84,72 80,62 72,60 Z"
          fill="none"
          stroke="url(#lanternGold)"
          strokeWidth={3}
          strokeLinejoin="round"
        />

        {/* Frame ribs following the body curve */}
        <G stroke="url(#lanternGold)" strokeWidth={1.6} strokeLinecap="round" opacity={0.85}>
          <Path d="M52,61 C47,74 47,108 54,129" fill="none" />
          <Path d="M68,61 C73,74 73,108 66,129" fill="none" />
          <Line x1={60} y1={60} x2={60} y2={130} />
        </G>

        {/* Horizontal banding rings */}
        <G stroke="url(#lanternGold)" strokeWidth={1.4} opacity={0.7}>
          <Line x1={40} y1={78} x2={80} y2={78} />
          <Line x1={38} y1={106} x2={82} y2={106} />
        </G>

        {/* --- Base --- */}
        {/* Bottom rim */}
        <Path
          d="M46,130 L74,130 C74,135 71,138 66,138 L54,138 C49,138 46,135 46,130 Z"
          fill="url(#lanternGold)"
        />
        {/* Finial drop */}
        <Path
          d="M55,138 C55,147 60,153 60,153 C60,153 65,147 65,138 Z"
          fill="url(#lanternGold)"
          opacity={0.95}
        />
        <Circle cx={60} cy={156} r={2.6} fill="url(#lanternGold)" />
      </Svg>
    </View>
  );
}

export default SakinaLantern;
