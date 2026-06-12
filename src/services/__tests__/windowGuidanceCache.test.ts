import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCachedGuidance,
  setCachedGuidance,
  __resetWindowGuidanceCacheForTests,
} from '../windowGuidanceCache';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const exp = (id: string): any => ({
  content: { id, source: '', arabicText: '', englishTranslation: '' },
  angle: { id: `${id}_angle` },
});

describe('windowGuidanceCache — one fresh verse per window per mood', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetWindowGuidanceCacheForTests();
  });

  it('returns null when nothing was delivered this window', async () => {
    expect(await getCachedGuidance('2026-06-11:Isha', 'Calm')).toBeNull();
  });

  it('returns the delivered experience on a re-tap in the same window', async () => {
    await setCachedGuidance('2026-06-11:Isha', 'Calm', exp('c1'));
    const cached = await getCachedGuidance('2026-06-11:Isha', 'Calm');
    expect(cached?.content.id).toBe('c1');
  });

  it('a new prayer window starts clean (old window is discarded)', async () => {
    await setCachedGuidance('2026-06-11:Isha', 'Calm', exp('c1'));
    expect(await getCachedGuidance('2026-06-12:Fajr', 'Calm')).toBeNull();
    // and writing under the new window evicts the old one entirely
    await setCachedGuidance('2026-06-12:Fajr', 'Hopeful', exp('c2'));
    expect(await getCachedGuidance('2026-06-11:Isha', 'Calm')).toBeNull();
  });

  it('tracks moods independently within a window', async () => {
    await setCachedGuidance('2026-06-11:Isha', 'Calm', exp('c1'));
    expect(await getCachedGuidance('2026-06-11:Isha', 'Grateful')).toBeNull();
  });

  it('a refresh overwrites the cache so re-entry lands on the latest verse', async () => {
    await setCachedGuidance('2026-06-11:Isha', 'Calm', exp('c1'));
    await setCachedGuidance('2026-06-11:Isha', 'Calm', exp('c2'));
    const cached = await getCachedGuidance('2026-06-11:Isha', 'Calm');
    expect(cached?.content.id).toBe('c2');
  });

  it('survives a restart (reloads from AsyncStorage)', async () => {
    await setCachedGuidance('2026-06-11:Isha', 'Calm', exp('c1'));
    __resetWindowGuidanceCacheForTests(); // simulate fresh JS context, storage intact
    const cached = await getCachedGuidance('2026-06-11:Isha', 'Calm');
    expect(cached?.content.id).toBe('c1');
  });
});
