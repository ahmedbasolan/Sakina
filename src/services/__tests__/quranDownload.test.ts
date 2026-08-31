/**
 * The bulk Quran download — the path a FIRST INSTALL takes, and the only one
 * that ever runs it: `prefetchAllSurahs` returns early once all 114 surahs are
 * cached, so an install that has completed the download never exercises this
 * code again. That is why it stayed weak unnoticed — it is unreachable on any
 * device that already finished.
 *
 * It shipped as three CONCURRENT multi-MB requests (5.1 MB total: 2.11 + 1.61
 * + 1.38) behind a flat 12-second abort covering the whole response body, with
 * two attempts and `Promise.all` semantics. On broadband each lands in ~1.5s.
 * On mobile data the three share the pipe, the largest blows the 12s wall, and
 * `Promise.all` discards the two that had succeeded — so a retry re-downloads
 * all 5.1 MB and fails the same way. The user sees "Downloading Quran… 0/114"
 * (the count cannot move until all three editions merge) and then "Connection
 * issue stopped the download".
 *
 * What these tests pin, in order: one request at a time; a slow-but-moving
 * download is never killed; a genuinely dead one is; a completed edition is
 * not re-downloaded after a later one fails; and the banner gets a moving
 * number during the network phase instead of a frozen 0/114.
 *
 * What they do NOT cover: real XHR streaming semantics (this fake decides when
 * bytes arrive, which is the only way to tell "slow" from "dead" apart in a
 * unit test), actual payload sizes, and anything about the single-surah
 * on-demand path in `fetchAndCacheSurah`, which still uses `fetch` and is
 * unchanged.
 */

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
  } else if (sql.includes('DELETE FROM kv_store')) {
    delete kvStore[args![0]];
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

jest.mock('../../database/connection', () => ({
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
  DOWNLOAD_TUNING,
  prefetchAllSurahs,
  __resetQuranServiceForTests,
  type DownloadProgress,
} from '../quranService';

// ─── A controllable XMLHttpRequest ──────────────────────────────────────────
// The real one streams; this one lets a test decide exactly when bytes arrive,
// which is the whole point — "slow" and "dead" differ only in that timing.

class FakeXHR {
  static live: FakeXHR[] = [];
  static sent: FakeXHR[] = [];
  static reset() {
    FakeXHR.live = [];
    FakeXHR.sent = [];
  }

  url = '';
  status = 200;
  responseText = '';
  responseType = '';
  aborted = false;
  onprogress: ((e: any) => void) | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;

  open(_method: string, url: string) {
    this.url = url;
  }
  send() {
    FakeXHR.live.push(this);
    FakeXHR.sent.push(this);
  }
  abort() {
    this.aborted = true;
    this.settle();
  }

  private settle() {
    FakeXHR.live = FakeXHR.live.filter((x) => x !== this);
  }

  /** Bytes arrived — this is what must reset the stall watchdog. */
  progress(loaded: number, total: number) {
    this.onprogress?.({ loaded, total });
  }
  succeed(body: string) {
    this.status = 200;
    this.responseText = body;
    this.settle();
    this.onload?.();
  }
  failNetwork() {
    this.settle();
    this.onerror?.();
  }

  get edition(): string {
    return this.url.split('/').pop() ?? '';
  }
}

/** A structurally valid `/v1/quran/{edition}` body: 114 surahs, 2 ayahs each. */
function payload(tag: string, surahCount = 114): string {
  return JSON.stringify({
    data: {
      surahs: Array.from({ length: surahCount }, (_, i) => ({
        number: i + 1,
        ayahs: [
          { numberInSurah: 1, text: tag + '-' + (i + 1) + '-1' },
          { numberInSurah: 2, text: tag + '-' + (i + 1) + '-2' },
        ],
      })),
    },
  });
}

/** Let the service's awaited DB round-trips settle without advancing time. */
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};

beforeEach(() => {
  jest.clearAllMocks();
  quranCacheRows = [];
  kvStore = {};
  FakeXHR.reset();
  __resetQuranServiceForTests();
  (global as any).XMLHttpRequest = FakeXHR;
  global.fetch = jest.fn().mockRejectedValue(new Error('bulk download must not use fetch'));
});

describe('bulk download — one edition at a time', () => {
  it('never has two requests open at once, and caches all 114 once they merge', async () => {
    const done = prefetchAllSurahs();
    await flush();

    // Arabic alone is in flight — not all three racing for the same pipe.
    expect(FakeXHR.live).toHaveLength(1);
    expect(FakeXHR.sent).toHaveLength(1);

    FakeXHR.live[0].succeed(payload('ar'));
    await flush();
    expect(FakeXHR.live).toHaveLength(1);
    expect(FakeXHR.sent).toHaveLength(2);

    FakeXHR.live[0].succeed(payload('en'));
    await flush();
    expect(FakeXHR.live).toHaveLength(1);
    expect(FakeXHR.sent).toHaveLength(3);

    FakeXHR.live[0].succeed(payload('tr'));
    await done;

    expect(quranCacheRows).toHaveLength(114);
    expect(FakeXHR.sent).toHaveLength(3);
  });
});

describe('bulk download — slow is not the same as dead', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('does not abort a download that is still delivering bytes past the old 12s wall', async () => {
    const done = prefetchAllSurahs();
    await jest.advanceTimersByTimeAsync(0);

    const req = FakeXHR.sent[0];
    // 60 seconds of a genuinely slow but healthy mobile connection.
    for (let i = 0; i < 6; i++) {
      await jest.advanceTimersByTimeAsync(10_000);
      req.progress((i + 1) * 350_000, 2_109_200);
    }

    expect(req.aborted).toBe(false);
    expect(FakeXHR.sent).toHaveLength(1); // no retry was triggered

    req.succeed(payload('ar'));
    await jest.advanceTimersByTimeAsync(0);
    FakeXHR.live[0].succeed(payload('en'));
    await jest.advanceTimersByTimeAsync(0);
    FakeXHR.live[0].succeed(payload('tr'));
    await done;

    expect(quranCacheRows).toHaveLength(114);
  });

  it('aborts and retries when no bytes arrive for the stall window', async () => {
    const done = prefetchAllSurahs();
    await jest.advanceTimersByTimeAsync(0);

    const first = FakeXHR.sent[0];
    first.progress(120_000, 2_109_200); // connection opened, then died mid-body
    await jest.advanceTimersByTimeAsync(DOWNLOAD_TUNING.stallTimeoutMs + 1_000);

    expect(first.aborted).toBe(true);

    // The retry re-requests the SAME edition rather than giving up on it.
    await jest.advanceTimersByTimeAsync(5_000);
    expect(FakeXHR.sent.length).toBeGreaterThan(1);
    expect(FakeXHR.sent[1].edition).toBe(first.edition);

    FakeXHR.live[0].succeed(payload('ar'));
    await jest.advanceTimersByTimeAsync(0);
    FakeXHR.live[0].succeed(payload('en'));
    await jest.advanceTimersByTimeAsync(0);
    FakeXHR.live[0].succeed(payload('tr'));
    await done;

    expect(quranCacheRows).toHaveLength(114);
  });
});

describe('bulk download — a finished edition is not downloaded twice', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('resumes with only the edition that failed, after the first attempt gave up', async () => {
    const first = prefetchAllSurahs();
    await jest.advanceTimersByTimeAsync(0);

    FakeXHR.sent[0].succeed(payload('ar'));
    await jest.advanceTimersByTimeAsync(0);
    FakeXHR.live[0].succeed(payload('en'));
    await jest.advanceTimersByTimeAsync(0);

    // The third edition fails every attempt — the whole prefetch gives up.
    for (let i = 0; i < DOWNLOAD_TUNING.attempts; i++) {
      FakeXHR.live[0]?.failNetwork();
      await jest.advanceTimersByTimeAsync(10_000);
    }
    await first;
    expect(quranCacheRows).toHaveLength(0);

    const requestedFirstRound = FakeXHR.sent.map((r) => r.edition);
    FakeXHR.reset();

    // Tapping "retry" must not re-download the 3.7 MB already in hand.
    const second = prefetchAllSurahs();
    await jest.advanceTimersByTimeAsync(0);

    expect(FakeXHR.sent).toHaveLength(1);
    expect(FakeXHR.sent[0].edition).toBe(requestedFirstRound[requestedFirstRound.length - 1]);

    FakeXHR.live[0].succeed(payload('tr'));
    await second;

    expect(quranCacheRows).toHaveLength(114);
  });
});

describe('bulk download — the banner has something to show', () => {
  it('reports network progress while the cached count is still 0', async () => {
    const seen: DownloadProgress[] = [];
    const done = prefetchAllSurahs((p) => seen.push({ ...p }));
    await flush();

    FakeXHR.sent[0].progress(1_054_600, 2_109_200); // half of the Arabic edition
    await flush();

    // Strictly mid-download: a fraction that is neither the 0 it started at nor
    // the 1 it ends on, reported while not a single surah is cacheable yet.
    const midFetch = seen.filter(
      (p) => p.cached === 0 && (p.fetchProgress ?? 0) > 0 && (p.fetchProgress ?? 0) < 1,
    );
    expect(midFetch.length).toBeGreaterThan(0);

    FakeXHR.live[0].succeed(payload('ar'));
    await flush();
    FakeXHR.live[0].succeed(payload('en'));
    await flush();
    FakeXHR.live[0].succeed(payload('tr'));
    await done;

    // Settled state carries no half-finished fraction.
    expect(seen[seen.length - 1].fetching).toBe(false);
    expect(seen[seen.length - 1].fetchProgress ?? null).toBeNull();
  });
});
