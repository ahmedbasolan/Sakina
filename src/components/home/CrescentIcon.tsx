import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface CrescentIconProps {
  size: number;
  color: string;
}

export function CrescentIcon({ size, color }: CrescentIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={color} />
    </Svg>
  );
}
