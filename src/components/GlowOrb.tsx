/**
 * GlowOrb — Positioned radial glow effect.
 * A large, low-opacity circle placed absolutely within its parent
 * to create an ambient light atmosphere. No blur filter needed.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface GlowOrbProps {
  color?: string;
  size?: number;
  x?: string | number;
  y?: string | number;
  blur?: number;
  style?: ViewStyle;
}

function GlowOrbInner({
  color = 'rgba(212, 175, 55, 0.08)',
  size = 200,
  x = '50%',
  y = '50%',
  blur = 60,
  style,
}: GlowOrbProps) {
  const totalSize = size + blur;
  const half = totalSize / 2;

  const orbStyle = useMemo<ViewStyle>(() => {
    const s: ViewStyle = {
      position: 'absolute',
      width: totalSize,
      height: totalSize,
      borderRadius: half,
      backgroundColor: color,
    };

    // Position: center the orb on (x, y)
    if (typeof x === 'string' && x.endsWith('%')) {
      // percentage-based: use left + marginLeft for centering
      s.left = x as any;
      s.marginLeft = -half;
    } else {
      s.left = (typeof x === 'number' ? x : parseFloat(x)) - half;
    }

    if (typeof y === 'string' && y.endsWith('%')) {
      s.top = y as any;
      s.marginTop = -half;
    } else {
      s.top = (typeof y === 'number' ? y : parseFloat(y)) - half;
    }

    return s;
  }, [color, totalSize, half, x, y]);

  return <View style={[orbStyle, style]} pointerEvents="none" />;
}

export const GlowOrb = React.memo(GlowOrbInner);
