import { ImageSourcePropType } from 'react-native';
import { BackgroundTheme } from '../types';

/**
 * The theme's photo for a portrait space: its hand-framed portrait crop when
 * it has one, otherwise the original (already portrait). On a full-screen
 * `cover` background the crop shows no more of the photo than the original
 * does, since a phone screen is narrower than 2:3 either way; what it changes
 * is which part shows, centred on the subject rather than the middle of the
 * frame.
 */
export function portraitSource(theme: BackgroundTheme): ImageSourcePropType {
  return theme.portraitImageSource ?? theme.imageSource;
}
