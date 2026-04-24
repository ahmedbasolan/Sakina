/**
 * StarIcon — Premium/star badge icon, filled or outlined.
 * Reuses the star path from Icon.tsx.
 */
import React from 'react';
import { ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../theme/DesignSystem';

interface StarIconProps {
  size?: number;
  color?: string;
  filled?: boolean;
  style?: ViewStyle;
}

const STAR_D =
  'M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z';

function StarIconInner({
  size = 13,
  color = Colors.accent.secondary,
  filled = true,
  style,
}: StarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Path
        d={STAR_D}
        fill={filled ? color : 'none'}
        stroke={filled ? 'none' : color}
        strokeWidth={filled ? 0 : 1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const StarIcon = React.memo(StarIconInner);
