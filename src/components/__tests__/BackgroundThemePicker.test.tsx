/**
 * The theme picker's thumbnails must show the photo the user will actually
 * get. Full-screen backgrounds and the share card use each theme's portrait
 * crop (portraitSource); the tiles used the landscape original, centre-
 * cropped, so "Lion" previewed the lion's back and gave its face.
 *
 * WHAT THIS DOES NOT CATCH: FlatList renders only its first window of items,
 * so only the tiles it mounts are checked (the assertions require that at
 * least one of them has a crop, so the test cannot pass by checking nothing);
 * and how a tile looks on a device.
 */
import React from 'react';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
import { Image } from 'react-native';
import { act, render, within } from '@testing-library/react-native';
import BackgroundThemePicker from '../BackgroundThemePicker';
import { BACKGROUND_THEMES } from '../../services/backgroundThemeService';
import { portraitSource } from '../../utils/portraitSource';

describe('BackgroundThemePicker', () => {
  it('previews each theme with the same photo the app will show', async () => {
    const { queryByLabelText } = render(
      <BackgroundThemePicker
        isVisible
        onClose={() => {}}
        isPremium
        selectedThemeId={null}
        onSelectTheme={() => {}}
      />,
    );
    // Ionicons loads its font asynchronously and re-renders when it lands;
    // let that settle inside act() so it doesn't warn after the test.
    await act(async () => {});
    let checked = 0;
    let withCrop = 0;
    for (const theme of BACKGROUND_THEMES) {
      const tile = queryByLabelText(theme.name);
      if (!tile) continue;
      const img = within(tile).UNSAFE_getByType(Image);
      expect(img.props.source).toEqual(portraitSource(theme));
      checked++;
      if (theme.portraitImageSource) {
        expect(img.props.source).not.toEqual(theme.imageSource);
        withCrop++;
      }
    }
    expect(checked).toBeGreaterThan(0);
    expect(withCrop).toBeGreaterThan(0);
  });
});
