import React from 'react';
import Svg, { Defs, Pattern, Rect, G } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

export const StarPatternBackground: React.FC = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="stars" x="0" y="0" width="180" height="180" patternUnits="userSpaceOnUse">
            <G stroke="rgba(255,255,255,0.02)" strokeWidth="1" fill="none">
              <Rect x="60" y="60" width="60" height="60" transform="rotate(0 90 90)" />
              <Rect x="60" y="60" width="60" height="60" transform="rotate(45 90 90)" />
            </G>
            <G stroke="rgba(255,255,255,0.015)" strokeWidth="1" fill="none">
              <Rect x="150" y="-30" width="60" height="60" transform="rotate(0 180 0)" />
              <Rect x="150" y="-30" width="60" height="60" transform="rotate(45 180 0)" />
            </G>
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#stars)" />
      </Svg>
    </View>
  );
};
