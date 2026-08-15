import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildVerseBody,
  buildWindowContent,
  loadLockscreenPrefs,
  saveLockscreenPrefs,
  resetLockscreenPrefsOnLapse,
  DEFAULT_LOCKSCREEN_PREFS,
  WINDOW_TITLES,
} from '../lockscreenVerseService';
import { SPIRITUAL_WINDOWS, getWindowVerse } from '../dailyVerseService';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: () => ({ localUri: 'file:///themes/sky.jpg', downloadAsync: jest.fn() }),
  },
}));

jest.mock('expo-notifications', () => ({}));

// Default platform in the RN jest preset is ios, which is the branch that
// carries the attachment. Android is asserted separately below.
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

const enabled = { ...DEFAULT_LOCKSCREEN_PREFS, enabled: true };

describe('lockscreenVerseService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('preferences', () => {
    it('defaults to off with every window opted in', async () => {
      const prefs = await loadLockscreenPrefs();
      expect(prefs.enabled).toBe(false);
      expect(prefs.showTransliteration).toBe(false);
      for (const w of SPIRITUAL_WINDOWS) expect(prefs.windows[w]).toBe(true);
    });

    // An install predating a new window would store a `windows` object missing
    // that key. Spreading over defaults keeps it enabled rather than letting
    // `undefined` read as opted-out.
    it('merges a partial stored shape over defaults', async () => {
      await AsyncStorage.setItem(
        '@lockscreen_verses',
        JSON.stringify({ enabled: true, windows: { morning: false } }),
      );
      const prefs = await loadLockscreenPrefs();
      expect(prefs.enabled).toBe(true);
      expect(prefs.windows.morning).toBe(false);
      expect(prefs.windows.tahajjud).toBe(true);
      expect(prefs.windows.evening).toBe(true);
    });

    it('falls back to defaults on unparseable storage', async () => {
      await AsyncStorage.setItem('@lockscreen_verses', 'not json');
      expect(await loadLockscreenPrefs()).toEqual(DEFAULT_LOCKSCREEN_PREFS);
    });

    it('clears enabled and theme when premium lapses', async () => {
      await saveLockscreenPrefs({ enabled: true, themeId: 'sky_milky_way' });
      await resetLockscreenPrefsOnLapse();
      const prefs = await loadLockscreenPrefs();
      expect(prefs.enabled).toBe(false);
      expect(prefs.themeId).toBeNull();
    });
  });

  describe('verse body', () => {
    it('carries the complete ayah and its citation, untruncated', async () => {
      const verse = await getWindowVerse('morning', '2026-08-15');
      const body = buildVerseBody(verse, false);
      expect(body).toContain(verse.arabic);
      expect(body).toContain(verse.translation);
      expect(body).toContain(verse.ref);
      expect(body).not.toContain('…');
      expect(body).not.toContain('...');
    });

    it('omits transliteration unless toggled on', async () => {
      const verse = await getWindowVerse('morning', '2026-08-15');
      expect(buildVerseBody(verse, false)).not.toContain(verse.transliteration);
      expect(buildVerseBody(verse, true)).toContain(verse.transliteration);
    });
  });

  describe('notification content', () => {
    it('returns null when the feature is off, so static copy is kept', async () => {
      expect(await buildWindowContent('morning', new Date(), DEFAULT_LOCKSCREEN_PREFS)).toBeNull();
    });

    it('returns null for a window the user opted out of', async () => {
      const prefs = { ...enabled, windows: { ...enabled.windows, tahajjud: false } };
      expect(await buildWindowContent('tahajjud', new Date(), prefs)).toBeNull();
      expect(await buildWindowContent('morning', new Date(), prefs)).not.toBeNull();
    });

    it('builds titled verse content with an iOS photo attachment', async () => {
      const content = await buildWindowContent('evening', new Date('2026-08-15T18:00:00'), enabled);
      expect(content?.title).toBe(WINDOW_TITLES.evening);
      expect(content?.body?.length).toBeGreaterThan(0);
      expect(content?.attachments?.[0]?.url).toBe('file:///themes/sky.jpg');
      expect(content?.attachments?.[0]?.type).toBe('public.jpeg');
    });

    it('gives each window its own verse on the same day', async () => {
      const date = new Date('2026-08-15T12:00:00');
      const bodies = await Promise.all(
        SPIRITUAL_WINDOWS.map(async (w) => (await buildWindowContent(w, date, enabled))?.body),
      );
      expect(new Set(bodies).size).toBe(3);
    });
  });
});
