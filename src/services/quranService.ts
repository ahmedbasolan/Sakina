/**
 * quranService — Manages offline-first Quran data.
 *
 * Strategy:
 *  1. On first open of LibraryScreen, kick off `prefetchAllSurahs()`.
 *  2. Fetches surahs in small batches from alquran.cloud (Uthmani + en.asad).
 *  3. Each surah is stored in `quran_cache` (TTL = 7 days).
 *  4. Download progress is persisted to `kv_store` so progress survives app restarts.
 *  5. After `CACHE_TTL_MS` the whole Quran is quietly refreshed in the background.
 */
import { dbQuery } from '../database/schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuranVerse {
  numberInSurah: number;
  arabic: string;
  translation: string;
}

export interface DownloadProgress {
  cached: number;   // how many surahs are stored
  total: 114;
  done: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_SURAHS = 114;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BATCH_SIZE   = 8;   // concurrent fetches per batch
const BATCH_DELAY  = 200; // ms pause between batches (be respectful of the free API)

// Module-level singleton so multiple LibraryScreen mounts don't double-fetch
let _isFetching = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function fetchSurahFromApi(surahNumber: number): Promise<QuranVerse[]> {
  const controller = new AbortController();
  // 15 s is generous for a single surah; prevents the native SocketTimeoutException
  // from escaping as an unhandled rejection and crashing the Expo dev overlay.
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  try {
    const url =
      `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.asad`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for surah ${surahNumber}`);
    const json = await res.json();
    const arabics: any[] = json.data[0].ayahs;
    const englishs: any[] = json.data[1].ayahs;
    return arabics.map((a, i) => ({
      numberInSurah: a.numberInSurah,
      arabic: a.text,
      translation: englishs[i]?.text ?? '',
    }));
  } finally {
    clearTimeout(timeoutId);
  }
}

async function writeSurahCache(surahNumber: number, verses: QuranVerse[]): Promise<void> {
  await dbQuery(async (db) => {
    await db.runAsync(
      'INSERT OR REPLACE INTO quran_cache (surahNumber, data, cachedAt) VALUES (?, ?, ?)',
      [surahNumber, JSON.stringify(verses), Date.now()],
    );
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns how many of the 114 surahs are currently cached and fresh.
 */
export async function getDownloadProgress(): Promise<DownloadProgress> {
  return dbQuery(async (db) => {
    const rows = await db.getAllAsync<{ surahNumber: number; cachedAt: number }>(
      'SELECT surahNumber, cachedAt FROM quran_cache',
    );
    const freshCount = rows.filter(
      (r) => Date.now() - r.cachedAt < CACHE_TTL_MS,
    ).length;
    return {
      cached: freshCount,
      total: 114,
      done: freshCount >= TOTAL_SURAHS,
    } as DownloadProgress;
  });
}

/**
 * Pre-fetches all 114 surahs in batches.
 *
 * Safe to call multiple times — only one fetch loop runs at a time.
 * Calls `onProgress` after each surah is stored so the UI can update.
 */
export async function prefetchAllSurahs(
  onProgress?: (progress: DownloadProgress) => void,
): Promise<void> {
  if (_isFetching) return;
  _isFetching = true;

  try {
    // Determine which surahs still need fetching — one bulk query instead of 114
    const { cached: alreadyCached } = await getDownloadProgress();
    const freshSet = await dbQuery(async (db) => {
      const rows = await db.getAllAsync<{ surahNumber: number; cachedAt: number }>(
        'SELECT surahNumber, cachedAt FROM quran_cache',
      );
      return new Set(
        rows
          .filter((r) => Date.now() - r.cachedAt < CACHE_TTL_MS)
          .map((r) => r.surahNumber),
      );
    });

    const missing: number[] = [];
    for (let n = 1; n <= TOTAL_SURAHS; n++) {
      if (!freshSet.has(n)) missing.push(n);
    }

    if (missing.length === 0) {
      onProgress?.({ cached: TOTAL_SURAHS, total: 114, done: true });
      return;
    }

    let cached = alreadyCached;

    // Process in batches
    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing.slice(i, i + BATCH_SIZE);

      // Fetch all in current batch concurrently
      await Promise.allSettled(
        batch.map(async (surahNumber) => {
          try {
            const verses = await fetchSurahFromApi(surahNumber);
            await writeSurahCache(surahNumber, verses);
            cached++;
            onProgress?.({
              cached,
              total: 114,
              done: cached >= TOTAL_SURAHS,
            });
          } catch {
            // Network error for this surah — skip, will retry next launch
          }
        }),
      );

      // Brief pause between batches to avoid hammering the free API
      if (i + BATCH_SIZE < missing.length) {
        await sleep(BATCH_DELAY);
      }
    }
  } finally {
    _isFetching = false;
  }
}

/**
 * Fetches a surah from the API and stores it in the cache.
 * Throws on network error so the caller can show an error state.
 */
export async function fetchAndCacheSurah(surahNumber: number): Promise<QuranVerse[]> {
  const verses = await fetchSurahFromApi(surahNumber);
  await writeSurahCache(surahNumber, verses);
  return verses;
}

/**
 * Returns cached verses for a surah from SQLite.
 * Returns null if not cached (caller should fetch from API).
 */
export async function getCachedSurah(surahNumber: number): Promise<QuranVerse[] | null> {
  return dbQuery(async (db) => {
    const row = await db.getFirstAsync<{ data: string; cachedAt: number }>(
      'SELECT data, cachedAt FROM quran_cache WHERE surahNumber = ?',
      [surahNumber],
    );
    if (!row) return null;
    if (Date.now() - row.cachedAt > CACHE_TTL_MS) return null;
    try { return JSON.parse(row.data) as QuranVerse[]; } catch { return null; }
  });
}
