/**
 * SakinaLantern — the app's brand mark (fanoos).
 *
 * The lantern from the app icon itself, cut out of the icon's blue ground by
 * scripts/build-lantern-assets.js (src/assets/brand/lantern.png), so the mark
 * in the app is the mark on the home screen. It replaced a hand-drawn vector
 * that only approximated the icon (an onion bulb where the icon has a domed
 * cage and arched, calligraphy-lit windows).
 *
 * The windows gently breathe — a warm light over them fades up and down —
 * and that honours reduce-motion. `size` is the height; width keeps the
 * lantern's aspect ratio.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useReduceMotion } from '../hooks/useReduceMotion';

const LANTERN = require('../assets/brand/lantern.png');

// The cut-out's frame (scripts/lib/iconLantern.js CROP), and where its middle
// window sits in it, as fractions — the breathing light is centred there.
const ASPECT = 576 / 1124;
const GLOW = { cx: 0.5, cy: 0.58, rx: 0.32, ry: 0.22 };

interface Props {
  /** Rendered height in px. Width scales to keep the lantern's aspect ratio. */
  size?: number;
  /** Set false to freeze the light (e.g. for a static capture). */
  animated?: boolean;
}

export function SakinaLantern({ size = 130, animated = true }: Props) {
  const reduceMotion = useReduceMotion();
  const breathing = animated && !reduceMotion;
  const light = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (!breathing) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(light, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(light, {
          toValue: 0.35,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathing, light]);

  const width = size * ASPECT;

  return (
    <View style={{ width, height: size }} pointerEvents="none">
      <Image source={LANTERN} style={styles.fill} resizeMode="contain" />
      {breathing ? (
        <Animated.View style={[styles.fill, { opacity: light }]}>
          <Svg width={width} height={size}>
            <Defs>
              <RadialGradient id="lanternLight" cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor="#FFF6D8" stopOpacity="0.55" />
                <Stop offset="0.6" stopColor="#FFE9A6" stopOpacity="0.18" />
                <Stop offset="1" stopColor="#FFE9A6" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse
              cx={width * GLOW.cx}
              cy={size * GLOW.cy}
              rx={width * GLOW.rx}
              ry={size * GLOW.ry}
              fill="url(#lanternLight)"
            />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default SakinaLantern;
