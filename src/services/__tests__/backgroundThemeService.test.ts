const mockStore: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore[key] ?? null)),
  setItem: jest.fn((key: string, val: string) => {
    mockStore[key] = val;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStore[key];
    return Promise.resolve();
  }),
}));

import { BACKGROUND_THEMES, backgroundThemeService } from '../backgroundThemeService';

const SELECTED_THEME_KEY = '@quietheart_background_theme';

describe('backgroundThemeService', () => {
  beforeEach(() => {
    for (const k of Object.keys(mockStore)) delete mockStore[k];
  });

  it('resolves a saved theme id to its theme', async () => {
    mockStore[SELECTED_THEME_KEY] = 'sky_milky_way';
    const theme = await backgroundThemeService.getSelectedTheme();
    expect(theme?.id).toBe('sky_milky_way');
  });

  // 'ocean_wooden_pier' (a skyscraper, shown as "Skyward") was removed from
  // BACKGROUND_THEMES. A user who had it selected still has the id saved;
  // they must fall back to the default background, not crash or keep a
  // theme that no longer exists.
  it('falls back to no theme when the saved id was removed', async () => {
    expect(BACKGROUND_THEMES.some((t) => t.id === 'ocean_wooden_pier')).toBe(false);
    mockStore[SELECTED_THEME_KEY] = 'ocean_wooden_pier';
    await expect(backgroundThemeService.getSelectedTheme()).resolves.toBeNull();
  });

  it('has no duplicate theme ids', () => {
    const ids = BACKGROUND_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
