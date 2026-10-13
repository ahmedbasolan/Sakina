import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { SakinaLantern } from '../SakinaLantern';

jest.mock('../../hooks/useReduceMotion', () => ({ useReduceMotion: () => true }));

// An <Image> given a bundled require() source and no width/height of its own
// takes the asset's dimensions (lantern.png is 184 x 360), and an explicit
// width/height beats absolute-fill insets. The first raster SakinaLantern
// relied on absoluteFill alone: the 16 pt "Sakina app" mark on the share card
// drew 360 tall straight over the verse. The image must carry the size itself.
it.each([16, 72])('draws the lantern image at the requested %ipt height, not the asset size', (size) => {
  const { UNSAFE_getByType } = render(<SakinaLantern size={size} animated={false} />);
  const style = StyleSheet.flatten(UNSAFE_getByType(Image).props.style);
  expect(style.height).toBe(size);
  expect(style.width).toBeCloseTo((size * 576) / 1124, 5);
});
