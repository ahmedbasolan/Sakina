/**
 * assetAspectRatio is how the share card learns its photo's shape.
 *
 * Two shapes reach it: a Metro asset-registry number on native, and a
 * `{ uri, width, height }` object on web. The first version called
 * Image.resolveAssetSource, which react-native-web does not have, and picking
 * any photo crashed the whole sheet to a blank page on web.
 *
 * WHAT THIS DOES NOT CATCH: expo-asset is mocked, so this proves the function
 * passes both shapes through and never throws; it does not prove the real
 * registry records width/height on a device.
 */
import { Image } from 'react-native';

const mockFromModule = jest.fn();
jest.mock('expo-asset', () => ({ Asset: { fromModule: (m: unknown) => mockFromModule(m) } }));

import { assetAspectRatio } from '../assetAspectRatio';

describe('assetAspectRatio', () => {
  beforeEach(() => mockFromModule.mockReset());

  it('reads a native registry id', () => {
    mockFromModule.mockReturnValue({ width: 640, height: 960 });
    expect(assetAspectRatio(42)).toBeCloseTo(2 / 3, 5);
    expect(mockFromModule).toHaveBeenCalledWith(42);
  });

  it('reads the { uri, width, height } object a web build gives', () => {
    const web = { uri: '/assets/x.jpg', width: 1440, height: 2560 };
    mockFromModule.mockImplementation((m: typeof web) => ({ width: m.width, height: m.height }));
    expect(assetAspectRatio(web)).toBeCloseTo(0.5625, 5);
  });

  it('works where Image.resolveAssetSource does not exist (react-native-web)', () => {
    const original = (Image as unknown as { resolveAssetSource?: unknown }).resolveAssetSource;
    (Image as unknown as { resolveAssetSource?: unknown }).resolveAssetSource = undefined;
    try {
      mockFromModule.mockReturnValue({ width: 640, height: 960 });
      expect(assetAspectRatio(42)).toBeCloseTo(2 / 3, 5);
    } finally {
      (Image as unknown as { resolveAssetSource?: unknown }).resolveAssetSource = original;
    }
  });

  it('returns null, never throws, when the size is missing or unreadable', () => {
    mockFromModule.mockReturnValue({ width: null, height: null });
    expect(assetAspectRatio(1)).toBeNull();
    mockFromModule.mockImplementation(() => {
      throw new Error('Module "1" is missing from the asset registry');
    });
    expect(assetAspectRatio(1)).toBeNull();
  });

  it('returns null for a multi-source array without calling expo-asset', () => {
    expect(assetAspectRatio([{ uri: 'a' }, { uri: 'b' }])).toBeNull();
    expect(mockFromModule).not.toHaveBeenCalled();
  });
});
