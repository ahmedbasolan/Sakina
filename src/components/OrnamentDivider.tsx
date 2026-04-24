/**
 * OrnamentDivider — Horizontal divider with Islamic ornamental design.
 * Center diamond + accent diamonds + gradient lines.
 * Extracted from BismillahScreen flourish pattern.
 */
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import { Colors } from '../theme/DesignSystem';

const SCREEN_W = Dimensions.get('window').width;

interface OrnamentDividerProps {
  color?: string;
  width?: number;
}

function OrnamentDividerInner({
  color = Colors.accent.secondary,
  width = SCREEN_W * 0.44,
}: OrnamentDividerProps) {
  const W = width;
  const H = 16;
  const cx = W / 2;

  return (
    <View style={styles.wrap}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <SvgGradient id="ornLine" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0" />
            <Stop offset="0.22" stopColor={color} stopOpacity="0.55" />
            <Stop offset="0.5" stopColor={color} stopOpacity="0.88" />
            <Stop offset="0.78" stopColor={color} stopOpacity="0.55" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Center diamond */}
        <Path
          d={`M ${cx} 2 L ${cx + 6} 8 L ${cx} 14 L ${cx - 6} 8 Z`}
          fill={color}
          opacity={0.75}
        />

        {/* Left accent diamond */}
        <Path
          d={`M ${W * 0.28} 6 L ${W * 0.305} 8 L ${W * 0.28} 10 L ${W * 0.255} 8 Z`}
          fill={color}
          opacity={0.4}
        />

        {/* Right accent diamond */}
        <Path
          d={`M ${W * 0.72} 6 L ${W * 0.745} 8 L ${W * 0.72} 10 L ${W * 0.695} 8 Z`}
          fill={color}
          opacity={0.4}
        />

        {/* Left line */}
        <Path
          d={`M ${W * 0.07} 8 L ${cx - 10} 8`}
          stroke="url(#ornLine)"
          strokeWidth={0.9}
        />

        {/* Right line */}
        <Path
          d={`M ${cx + 10} 8 L ${W * 0.93} 8`}
          stroke="url(#ornLine)"
          strokeWidth={0.9}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginVertical: 12,
  },
});

export const OrnamentDivider = React.memo(OrnamentDividerInner);
