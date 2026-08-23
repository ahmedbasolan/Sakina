/**
 * quranService — Manages offline-first Quran data.
 *
 * Strategy:
 *  1. On first open of LibraryScreen, kick off `prefetchAllSurahs()`.
 *  2. Fetches surahs in small batches from alquran.cloud (Uthmani + en.sahih —
 *     Sahih International, the translation edition used app-wide).
 *  3. Each surah is stored in `quran_cache` and, once cached, never expires —
 *     Quran text doesn't change, so a downloaded surah stays readable offline
 *     forever. The only thing that invalidates a cached surah is a
 *     CACHE_FORMAT_VERSION bump (a real content/shape change on our side).
 *  4. Download progress is persisted to `kv_store` so progress survives app restarts.
 */
import { dbQuery } from '../database/connection';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuranVerse {
  numberInSurah: number;
  arabic: string;
  translation: string;
  transliteration: string;
}

export interface DownloadProgress {
  cached: number;   // how many surahs are stored
  total: 114;
  done: boolean;
  // True only while a fetch attempt is actively in flight. A fresh install
  // has all 114 surahs missing at once — a first burst of concurrent
  // requests against the free, unauthenticated alquran.cloud API — and
  // persistent failures (rate-limiting, connectivity) used to leave the UI
  // showing an unbroken "Downloading…" spinner forever with no signal that
  // the attempt had actually stopped. `fetching` lets the caller tell
  // "still working" apart from "gave up, some remain uncached" so it can
  // offer a retry instead of a permanent spinner.
  fetching: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_SURAHS = 114;

// Module-level singleton so multiple LibraryScreen mounts don't double-fetch
let _isFetching = false;

// ─── Bismillah de-duplication ───────────────────────────────────────────────
// The quran-uthmani edition embeds the Bismillah at the start of every
// surah's first ayah text (except At-Tawbah, which has none) — Al-Fatiha's
// first ayah *is* the Bismillah itself. Screens render their own separate
// Bismillah header above ayah 1, so the embedded copy must be stripped here
// or it shows twice. Normalize first: the API's diacritic mark order for the
// shadda/fatha pair isn't always in canonical form, so a plain string match
// would silently fail to strip it on some surahs.
const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'.normalize('NFC');
// At-Tin (95) and Al-Qadr (97) carry an extra shadda on the opening "بِ"
// ("بِّسْمِ") in this API's Uthmani text — confirmed by auditing all 114
// surahs live. Without this variant those two would keep showing the
// Bismillah twice even after the fix below.
const BISMILLAH_VARIANT = BISMILLAH.slice(0, 2) + 'ّ' + BISMILLAH.slice(2);

function stripEmbeddedBismillah(text: string, surahNumber: number, numberInSurah: number): string {
  // Al-Fatiha's ayah 1 *is* the Bismillah — nothing to strip. At-Tawbah has none.
  if (numberInSurah !== 1 || surahNumber === 1 || surahNumber === 9) return text;
  const normalized = text.normalize('NFC');
  for (const prefix of [BISMILLAH, BISMILLAH_VARIANT]) {
    if (normalized.startsWith(prefix)) {
      return normalized.slice(prefix.length).trimStart();
    }
  }
  return text;
}

// ─── One-time cache migration ───────────────────────────────────────────────
// Bump this when the stored verse shape/content changes so previously
// cached (now-stale) surahs get re-fetched instead of showing old data
// forever — a cached surah has no other expiry.
// v4: switched translation edition from en.asad to en.sahih (Sahih
// International), matching the edition used everywhere else in the app.
const CACHE_FORMAT_VERSION = 4;
const CACHE_VERSION_KEY = 'quran_cache_format_version';
let versionChecked = false;

async function ensureCacheFormatVersion(): Promise<void> {
  if (versionChecked) return;
  versionChecked = true;
  await dbQuery(async (db) => {
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM kv_store WHERE key = ?',
      [CACHE_VERSION_KEY],
    );
    const stored = row ? parseInt(row.value, 10) : 0;
    if (stored < CACHE_FORMAT_VERSION) {
      await db.runAsync('DELETE FROM quran_cache');
      await db.runAsync(
        'INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)',
        [CACHE_VERSION_KEY, String(CACHE_FORMAT_VERSION)],
      );
    }
  });
}

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
      `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,en.transliteration`;
    // Race against an independent timer rather than relying solely on
    // AbortController — some Android network stacks (a socket stalled mid
    // WiFi/cellular handoff, in particular) have been seen to leave fetch()
    // pending even after abort() fires. Since prefetchAllSurahs awaits each
    // batch before starting the next, one request that never settles would
    // hang the entire remaining download forever, not just this surah.
    const res = await Promise.race([
      fetch(url, { signal: controller.signal }),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error(`Timed out fetching surah ${surahNumber}`)), 16_000),
      ),
    ]);
    if (!res.ok) throw new Error(`HTTP ${res.status} for surah ${surahNumber}`);
    const json = await res.json();
    const arabics: any[] = json.data[0].ayahs;
    const englishs: any[] = json.data[1].ayahs;
    const transliterations: any[] = json.data[2].ayahs;
    // The three editions are fetched independently and zipped by index below —
    // if one edition's ayah list came back short (a transient upstream hiccup
    // on just that edition, seen on surah 50) the zip silently misaligns and
    // every subsequent ayah gets the wrong/blank transliteration, then that
    // gets cached indefinitely with no error surfaced. Fail the whole fetch
    // instead so the caller's catch skips it and retries next launch.
    if (englishs.length !== arabics.length || transliterations.length !== arabics.length) {
      throw new Error(
        `Edition length mismatch for surah ${surahNumber}: arabic=${arabics.length} en=${englishs.length} translit=${transliterations.length}`,
      );
    }
    return arabics.map((a, i) => ({
      numberInSurah: a.numberInSurah,
      arabic: stripEmbeddedBismillah(a.text, surahNumber, a.numberInSurah),
      translation: englishs[i]?.text ?? '',
      transliteration: transliterations[i]?.text ?? '',
    }));
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * fetchSurahFromApi wrapped with a short retry — a single flaky request
 * (common on the weak/spotty connections this bulk background download tends
 * to run on) would otherwise be caught by prefetchAllSurahs's per-surah
 * `catch {}` and silently skipped for the rest of the session, leaving the
 * "Downloading Quran…" banner frozen with no error shown and no way to
 * retry short of leaving and re-entering the Library tab.
 */
async function fetchSurahWithRetry(surahNumber: number): Promise<QuranVerse[]> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fetchSurahFromApi(surahNumber);
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        // A 429 means the API is actively rate-limiting us — back off harder
        // than a transient network blip so the next attempt (and the rest of
        // the concurrent batch) isn't immediately rate-limited again too.
        const isRateLimited = error instanceof Error && error.message.includes('HTTP 429');
        await sleep((isRateLimited ? 2000 : 500) * attempt);
      }
    }
  }
  throw lastError;
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
 * Returns how many of the 114 surahs are currently cached. A cached surah
 * never expires on its own — see the module doc comment — so this is a
 * plain count, not a freshness filter.
 */
export async function getDownloadProgress(): Promise<DownloadProgress> {
  await ensureCacheFormatVersion();
  return dbQuery(async (db) => {
    const rows = await db.getAllAsync<{ surahNumber: number; cachedAt: number }>(
      'SELECT surahNumber, cachedAt FROM quran_cache',
    );
    return {
      cached: rows.length,
      total: 114,
      done: rows.length >= TOTAL_SURAHS,
      fetching: _isFetching,
    } as DownloadProgress;
  });
}

interface RawApiAyah {
  numberInSurah: number;
  text: string;
}
interface RawApiSurah {
  number: number;
  ayahs: RawApiAyah[];
}

async function fetchEditionBulk(edition: string): Promise<RawApiSurah[]> {
  const controller = new AbortController();
  // The whole-Quran payload is a few MB — 12s timeout allows fast fallback
  // if network is unresponsive.
  const timeoutId = setTimeout(() => controller.abort(), 12_000);
  try {
    const url = `https://api.alquran.cloud/v1/quran/${edition}`;
    const res = await Promise.race([
      fetch(url, { signal: controller.signal }),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error(`Timed out fetching edition ${edition}`)), 13_000),
      ),
    ]);
    if (!res.ok) throw new Error(`HTTP ${res.status} for edition ${edition}`);
    const json = await res.json();
    return json.data.surahs as RawApiSurah[];
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchEditionBulkWithRetry(edition: string): Promise<RawApiSurah[]> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await fetchEditionBulk(edition);
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        const isRateLimited = error instanceof Error && error.message.includes('HTTP 429');
        await sleep((isRateLimited ? 2000 : 800) * attempt);
      }
    }
  }
  throw lastError;
}

/**
 * Fetches the entire Quran — all 114 surahs, all 3 editions — as 3 bulk
 * requests instead of the 114 individual per-surah ones prefetchAllSurahs
 * used to make. That per-surah loop was the actual cause of a 2-hour, 4-surah
 * download on a real device: every surah needed its own round trip, and any
 * single flaky one ate a 16s timeout × 3 retries before the batch could move
 * on. alquran.cloud's `/v1/quran/{edition}` endpoint returns every surah for
 * one edition in a single ~1-5MB response that lands in ~1-2s, so the whole
 * Quran downloads in 3 parallel requests instead of 342 sequential-ish ones.
 */
async function fetchFullQuranFromApi(): Promise<Map<number, QuranVerse[]>> {
  const [arabicSurahs, englishSurahs, translitSurahs] = await Promise.all([
    fetchEditionBulkWithRetry('quran-uthmani'),
    fetchEditionBulkWithRetry('en.sahih'),
    fetchEditionBulkWithRetry('en.transliteration'),
  ]);

  if (
    arabicSurahs.length !== TOTAL_SURAHS ||
    englishSurahs.length !== TOTAL_SURAHS ||
    translitSurahs.length !== TOTAL_SURAHS
  ) {
    throw new Error(
      `Edition surah-count mismatch: arabic=${arabicSurahs.length} en=${englishSurahs.length} translit=${translitSurahs.length}`,
    );
  }

  const englishBySurah = new Map(englishSurahs.map((s) => [s.number, s]));
  const translitBySurah = new Map(translitSurahs.map((s) => [s.number, s]));

  const result = new Map<number, QuranVerse[]>();
  for (const arabicSurah of arabicSurahs) {
    const surahNumber = arabicSurah.number;
    const englishSurah = englishBySurah.get(surahNumber);
    const translitSurah = translitBySurah.get(surahNumber);
    // Same "fail this surah rather than silently misalign" guarantee
    // fetchSurahFromApi already had — skip it here, an on-demand read of
    // this specific surah later falls back to fetchAndCacheSurah.
    if (
      !englishSurah ||
      !translitSurah ||
      englishSurah.ayahs.length !== arabicSurah.ayahs.length ||
      translitSurah.ayahs.length !== arabicSurah.ayahs.length
    ) {
      continue;
    }
    const verses = arabicSurah.ayahs.map((a, i) => ({
      numberInSurah: a.numberInSurah,
      arabic: stripEmbeddedBismillah(a.text, surahNumber, a.numberInSurah),
      translation: englishSurah.ayahs[i]?.text ?? '',
      transliteration: translitSurah.ayahs[i]?.text ?? '',
    }));
    result.set(surahNumber, verses);
  }
  return result;
}

/**
 * Pre-fetches all 114 surahs via 3 bulk requests (see fetchFullQuranFromApi).
 *
 * Safe to call multiple times — only one fetch loop runs at a time.
 * Calls `onProgress` once fetching starts, then again as each surah is
 * written to the cache and once more at the end.
 */
export async function prefetchAllSurahs(
  onProgress?: (progress: DownloadProgress) => void,
): Promise<void> {
  if (_isFetching) return;
  _isFetching = true;

  try {
    await ensureCacheFormatVersion();
    const cachedSet = await dbQuery(async (db) => {
      const rows = await db.getAllAsync<{ surahNumber: number; cachedAt: number }>(
        'SELECT surahNumber, cachedAt FROM quran_cache',
      );
      return new Set(rows.map((r) => r.surahNumber));
    });

    if (cachedSet.size >= TOTAL_SURAHS) {
      onProgress?.({ cached: TOTAL_SURAHS, total: 114, done: true, fetching: false });
      return;
    }

    onProgress?.({ cached: cachedSet.size, total: 114, done: false, fetching: true });

    const allSurahs = await fetchFullQuranFromApi();
    const fetchedAt = Date.now();
    let cached = cachedSet.size;

    // One transaction for all inserts — 114 individual dbQuery round trips
    // would reintroduce the exact multi-second stall this rewrite removes.
    await dbQuery(async (db) => {
      await db.withTransactionAsync(async () => {
        for (let n = 1; n <= TOTAL_SURAHS; n++) {
          if (cachedSet.has(n)) continue;
          const verses = allSurahs.get(n);
          if (!verses) continue; // this surah's zip failed — an on-demand open will retry it
          await db.runAsync(
            'INSERT OR REPLACE INTO quran_cache (surahNumber, data, cachedAt) VALUES (?, ?, ?)',
            [n, JSON.stringify(verses), fetchedAt],
          );
          cached++;
          // Throttled so 114 rapid setState calls don't churn the UI — the
          // writes themselves take well under a second total, this is purely
          // so the progress bar reads as moving rather than jumping 4→114.
          if (cached % 10 === 0) {
            onProgress?.({ cached, total: 114, done: false, fetching: true });
          }
        }
      });
    });

    onProgress?.({ cached, total: 114, done: cached >= TOTAL_SURAHS, fetching: false });
  } catch (error) {
    // Bulk fetch failed outright (network down, API outage) — report the
    // current cached count so the UI shows "stalled", not a stuck spinner.
    const current = await getDownloadProgress().catch(
      () => ({ cached: 0, total: 114, done: false, fetching: false } as DownloadProgress),
    );
    onProgress?.({ ...current, fetching: false });
  } finally {
    _isFetching = false;
  }
}

// Keyed by surahNumber so concurrent callers (e.g. a Friday cache-warm effect
// racing the reader screen's own load) await the same request instead of
// each firing a separate fetch of the same surah.
const inFlightSurahFetches = new Map<number, Promise<QuranVerse[]>>();

/**
 * Fetches a surah from the API and stores it in the cache.
 * Throws on network error so the caller can show an error state.
 */
export async function fetchAndCacheSurah(surahNumber: number): Promise<QuranVerse[]> {
  const existing = inFlightSurahFetches.get(surahNumber);
  if (existing) return existing;

  const promise = (async () => {
    const verses = await fetchSurahWithRetry(surahNumber);
    await writeSurahCache(surahNumber, verses);
    return verses;
  })().finally(() => {
    inFlightSurahFetches.delete(surahNumber);
  });

  inFlightSurahFetches.set(surahNumber, promise);
  return promise;
}

/**
 * Returns cached verses for a surah from SQLite.
 * Returns null if not cached (caller should fetch from API). A cached
 * surah never expires on its own — see the module doc comment.
 */
export async function getCachedSurah(surahNumber: number): Promise<QuranVerse[] | null> {
  await ensureCacheFormatVersion();
  return dbQuery(async (db) => {
    const row = await db.getFirstAsync<{ data: string; cachedAt: number }>(
      'SELECT data, cachedAt FROM quran_cache WHERE surahNumber = ?',
      [surahNumber],
    );
    if (!row) return null;
    try { return JSON.parse(row.data) as QuranVerse[]; } catch { return null; }
  });
}

/** Test-only: reset module state between cases. */
export function __resetQuranServiceForTests(): void {
  versionChecked = false;
  _isFetching = false;
  inFlightSurahFetches.clear();
}
