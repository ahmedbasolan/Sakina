/**
 * quranService — once a surah is cached, it must stay readable offline
 * forever. The cache previously expired after 7 days (CACHE_TTL_MS),
 * silently re-hitting the network for a surah the user had already
 * downloaded. Quran text never changes, so the only legitimate reason to
 * invalidate a cached surah is a CACHE_FORMAT_VERSION bump (a real content/
 * shape change), not the passage of time.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

let quranCacheRows: Array<{ surahNumber: number; data: string; cachedAt: number }> = [];
let kvStore: Record<string, string> = {};

const mockGetFirstAsync = jest.fn((sql: string, args?: any[]) => {
  if (sql.includes('FROM kv_store')) {
    const value = kvStore[args?.[0]];
    return Promise.resolve(value !== undefined ? { value } : null);
  }
  if (sql.includes('FROM quran_cache WHERE surahNumber')) {
    const row = quranCacheRows.find((r) => r.surahNumber === args?.[0]);
    return Promise.resolve(row ? { data: row.data, cachedAt: row.cachedAt } : null);
  }
  return Promise.resolve(null);
});

const mockGetAllAsync = jest.fn((sql: string) => {
  if (sql.includes('FROM quran_cache')) {
    return Promise.resolve(
      quranCacheRows.map((r) => ({ surahNumber: r.surahNumber, cachedAt: r.cachedAt })),
    );
  }
  return Promise.resolve([]);
});

const mockRunAsync = jest.fn((sql: string, args?: any[]) => {
  if (sql.includes('DELETE FROM quran_cache')) {
    quranCacheRows = [];
  } else if (sql.includes('INSERT OR REPLACE INTO kv_store')) {
    kvStore[args![0]] = args![1];
  } else if (sql.includes('INSERT OR REPLACE INTO quran_cache')) {
    const [surahNumber, data, cachedAt] = args!;
    quranCacheRows = quranCacheRows.filter((r) => r.surahNumber !== surahNumber);
    quranCacheRows.push({ surahNumber, data, cachedAt });
  }
  return Promise.resolve();
});

const mockWithTransactionAsync = jest.fn((fn: () => Promise<void>) => fn());

jest.mock('../../database/schema', () => ({
  dbQuery: jest.fn((op: any) =>
    op({
      getFirstAsync: mockGetFirstAsync,
      getAllAsync: mockGetAllAsync,
      runAsync: mockRunAsync,
      withTransactionAsync: mockWithTransactionAsync,
    }),
  ),
}));

import {
  getCachedSurah,
  getDownloadProgress,
  prefetchAllSurahs,
  __resetQuranServiceForTests,
} from '../quranService';

beforeEach(() => {
  jest.clearAllMocks();
  quranCacheRows = [];
  kvStore = {};
  __resetQuranServiceForTests();
  global.fetch = jest.fn().mockRejectedValue(new Error('network disabled in this test'));
});

describe('quranService — cached surahs never expire on their own', () => {
  it('getCachedSurah still returns a surah cached 30 days ago', async () => {
    await getCachedSurah(1); // trigger the one-time format-version stamp on an empty cache
    quranCacheRows.push({
      surahNumber: 1,
      data: JSON.stringify([{ numberInSurah: 1, arabic: 'أ', translation: 'a', transliteration: 'a' }]),
      cachedAt: Date.now() - 30 * DAY_MS,
    });

    const result = await getCachedSurah(1);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
  });

  it('getDownloadProgress counts a surah cached 30 days ago as still cached', async () => {
    await getDownloadProgress();
    quranCacheRows.push({ surahNumber: 5, data: '[]', cachedAt: Date.now() - 30 * DAY_MS });

    const progress = await getDownloadProgress();

    expect(progress.cached).toBe(1);
  });

  it('prefetchAllSurahs treats a fully (but old) cached Quran as done, without touching the network', async () => {
    await getDownloadProgress(); // warm the version stamp on an empty cache
    const oldCachedAt = Date.now() - 30 * DAY_MS;
    for (let n = 1; n <= 114; n++) {
      quranCacheRows.push({ surahNumber: n, data: '[]', cachedAt: oldCachedAt });
    }

    await prefetchAllSurahs();

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
