import { ImageSourcePropType } from 'react-native';
import { Asset } from 'expo-asset';

/**
 * width / height of a bundled image, or null if it can't be resolved (no
 * size recorded, or not a single image source).
 *
 * expo-asset rather than Image.resolveAssetSource: react-native-web's Image
 * has no resolveAssetSource, and calling it crashed the whole share sheet on
 * web the moment a photo was picked. Asset.fromModule takes both shapes a
 * require()'d image has: a registry number on native, and a
 * `{ uri, width, height }` object on web.
 */
export function assetAspectRatio(source: ImageSourcePropType): number | null {
  if (Array.isArray(source)) return null;
  try {
    const { width, height } = Asset.fromModule(source as Parameters<typeof Asset.fromModule>[0]);
    return width && height ? width / height : null;
  } catch {
    return null;
  }
}
