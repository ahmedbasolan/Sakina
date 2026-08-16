/**
 * Android-specific behaviour for lockscreenVerseService, split into its own
 * file because Platform.OS is mocked at module scope and the iOS suite
 * (lockscreenVerseService.test.ts) needs the opposite value.
 *
 * Confirmed by reading expo-notifications' native Android source (0.32.17):
 * a locally scheduled notification always renders BigTextStyle, and its image
 * hook reads a static AndroidManifest meta-data key, never per-call content.
 * `attachments` is documented `@platform ios` in the type defs. There is no
 * per-notification photo on Android without a native module — this is the
 * fact these tests pin down so a future "just add the attachments field back"
 * edit fails loudly instead of shipping a silent no-op.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildWindowContent, DEFAULT_LOCKSCREEN_PREFS } from '../lockscreenVerseService';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Jest hoists jest.mock() above imports/consts, and its factory may only
// reference outer-scope variables whose names start with "mock" — anything
// else fails at transform time, not at a clear runtime error. Named
// accordingly rather than `fromModule`.
const mockFromModule = jest.fn((_id: unknown) => ({
  localUri: 'file:///themes/sky.jpg',
  downloadAsync: jest.fn(),
}));
jest.mock('expo-asset', () => ({ Asset: { fromModule: mockFromModule } }));

jest.mock('expo-notifications', () => ({}));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

const enabled = { ...DEFAULT_LOCKSCREEN_PREFS, enabled: true };

describe('lockscreenVerseService — Android', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    mockFromModule.mockClear();
  });

  it('never attaches a photo, even when a theme is selected', async () => {
    const prefs = { ...enabled, themeId: 'sky_milky_way' };
    const content = await buildWindowContent('evening', new Date('2026-08-15T18:00:00'), prefs);
    expect(content?.attachments).toBeUndefined();
  });

  it('still carries the full verse in the body — text delivery is unaffected', async () => {
    const content = await buildWindowContent('morning', new Date('2026-08-15T06:00:00'), enabled);
    expect(content?.body?.length).toBeGreaterThan(0);
    expect(content?.body).toMatch(/\d+:\d+/);
  });

  // Not just "the field is unused" — the asset is never even resolved, so a
  // theme change on Android costs nothing at notification-build time.
  it('never resolves the theme asset, since nothing on Android would use it', async () => {
    await buildWindowContent('evening', new Date('2026-08-15T18:00:00'), enabled);
    expect(mockFromModule).not.toHaveBeenCalled();
  });
});
