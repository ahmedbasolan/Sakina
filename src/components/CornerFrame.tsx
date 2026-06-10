import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CornerFrameProps {
  color?: string;
  size?: number;
  thickness?: number;
  offset?: number;
  style?: ViewStyle;
}

export function CornerFrame({
  color = '#D4AF37',
  size = 24,
  thickness = 2,
  offset = -12,
  style,
}: CornerFrameProps) {
  const cornerStyle = [
    styles.corner,
    {
      width: size,
      height: size,
      borderColor: color,
      borderWidth: thickness,
    },
  ];

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <View
        style={[
          cornerStyle,
          styles.topLeft,
          { top: offset, left: offset, borderRightWidth: 0, borderBottomWidth: 0 },
        ]}
      />
      <View
        style={[
          cornerStyle,
          styles.topRight,
          { top: offset, right: offset, borderLeftWidth: 0, borderBottomWidth: 0 },
        ]}
      />
      <View
        style={[
          cornerStyle,
          styles.bottomLeft,
          { bottom: offset, left: offset, borderRightWidth: 0, borderTopWidth: 0 },
        ]}
      />
      <View
        style={[
          cornerStyle,
          styles.bottomRight,
          { bottom: offset, right: offset, borderLeftWidth: 0, borderTopWidth: 0 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  corner: {
    position: 'absolute',
  },
  topLeft: {},
  topRight: {},
  bottomLeft: {},
  bottomRight: {},
});
