/**
 * Pagination for the Mushaf page view, driven against a SIMULATED text
 * renderer.
 *
 * The point of these tests is the two properties the screen cannot show you
 * and a typecheck cannot see:
 *
 *   1. Pages are FULL. Every page but the last renders to its line ceiling.
 *      This is the whole reason the pagination model was rewritten from
 *      verse-granular to word-granular, and "no empty gap under the text" is
 *      not a styling claim — it is this assertion.
 *   2. Nothing is lost at a break. Word-level breaking is only acceptable
 *      because the remainder of a split ayah is the first thing on the next
 *      page. `expectExactCoverage` is what makes that a guarantee rather than
 *      an intention, and it is the check that would catch a page break
 *      silently swallowing part of a verse.
 *
 * What these tests do NOT catch, and a reader of a green run should know:
 *   - Whether the real React Native text engine wraps the way `renderLines`
 *     models it. The simulation is a greedy word wrap at a fixed width; a real
 *     justified RTL render with kashida stretching will differ at the margins.
 *     These tests prove the ALGORITHM converges and conserves text, not that
 *     any particular device shows exactly N lines.
 *   - Anything about the screen's own bookkeeping (refs, state, the effect
 *     that re-seeds on viewport growth). Only the pure functions are covered.
 *   - Rendering: whether the runs actually reach the screen, and whether the
 *     ayah marker is drawn in the right place.
 */
import {
  buildWordIndex,
  paginateFrom,
  pageIndexForWord,
  retargetPageEnd,
  linesForHeight,
  visualCharCount,
  wordIndexForChars,
  AYAH_MARKER_CHAR_WIDTH,
  MAX_CORRECTION_PASSES_PER_PAGE,
  MUSHAF_INITIAL_CHARS_PER_LINE,
  MUSHAF_MAX_LINES_PER_PAGE,
  MUSHAF_MIN_LINES_PER_PAGE,
  PaginatableVerse,
  WordIndex,
} from '../mushafPagination';

// ── Arabic fixtures, built from escapes ─────────────────────────────────────
// Never transcribed. A literal Arabic fixture is unreviewable and, if mistyped,
// produces a test that passes against the wrong text.
const BASE_LETTERS = 'بتجدرسعفلمنهوي';
const HARAKAT = ['َ', 'ُ', 'ِ', 'ّ', 'ْ', 'ً'];

/** Deterministic PRNG so a failure is always reproducible. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** A pseudo-word of `len` letters, each carrying a diacritic — i.e. a string
 *  whose String.length is ~2x its rendered width, like real Uthmani text. */
function makeWord(rng: () => number, len: number): string {
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += BASE_LETTERS[Math.floor(rng() * BASE_LETTERS.length)];
    out += HARAKAT[Math.floor(rng() * HARAKAT.length)];
  }
  return out;
}

/** `verseCount` verses of `wordsPer` words. Long verses are the case that
 *  broke the old verse-granular model, so they are the default. */
function makeVerses(
  seed: number,
  verseCount: number,
  wordsPer: [number, number],
  wordLen: [number, number] = [3, 8],
): PaginatableVerse[] {
  const rng = makeRng(seed);
  const verses: PaginatableVerse[] = [];
  for (let v = 0; v < verseCount; v += 1) {
    const n = wordsPer[0] + Math.floor(rng() * (wordsPer[1] - wordsPer[0] + 1));
    const words: string[] = [];
    for (let w = 0; w < n; w += 1) {
      words.push(makeWord(rng, wordLen[0] + Math.floor(rng() * (wordLen[1] - wordLen[0] + 1))));
    }
    verses.push({ arabic: words.join(' ') });
  }
  return verses;
}

// ── The simulated renderer ──────────────────────────────────────────────────
/** Greedy word wrap at `capacity` visual chars per line — the stand-in for
 *  what onTextLayout would report for words [start, end). */
function renderLines(wi: WordIndex, start: number, end: number, capacity: number): number {
  if (end <= start) return 0;
  let lines = 1;
  let used = 0;
  for (let i = start; i < end; i += 1) {
    const w =
      visualCharCount(wi.words[i]) + 1 + (wi.endsVerse[i] ? AYAH_MARKER_CHAR_WIDTH : 0);
    if (used > 0 && used + w > capacity) {
      lines += 1;
      used = 0;
    }
    used += w;
  }
  return lines;
}

/**
 * Replays exactly what SurahReaderScreen does: seed, then walk forward
 * measuring each page and applying retargetPageEnd until it settles, carrying
 * the same running chars-per-line estimate, attempt counts and end caps.
 */
function settle(
  wi: WordIndex,
  capacity: number,
  ceilingFor: (pageIdx: number) => number,
): { starts: number[]; passes: number } {
  let starts = paginateFrom(wi, 0, 0, [], MUSHAF_INITIAL_CHARS_PER_LINE, ceilingFor);
  let charsPerLine = MUSHAF_INITIAL_CHARS_PER_LINE;
  const attempts = new Map<number, number>();
  const caps = new Map<number, number>();
  let passes = 0;

  for (let page = 0; page < starts.length; page += 1) {
    for (;;) {
      passes += 1;
      if (passes > 50000) throw new Error('pagination did not terminate');

      const measured = renderLines(wi, starts[page], starts[page + 1] ?? wi.total, capacity);
      const outcome = retargetPageEnd({
        wordIndex: wi,
        starts,
        pageIdx: page,
        measuredLines: measured,
        lineCeiling: ceilingFor(page),
        endCap: caps.get(page),
      });

      if (outcome.observedCharsPerLine !== null) {
        charsPerLine = charsPerLine * 0.5 + outcome.observedCharsPerLine * 0.5;
      }
      if (outcome.provenCap !== undefined) caps.set(page, outcome.provenCap);
      if (outcome.newEnd === null) break;

      const n = (attempts.get(page) ?? 0) + 1;
      if (n > MAX_CORRECTION_PASSES_PER_PAGE) break;
      attempts.set(page, n);
      Array.from(attempts.keys()).forEach((k) => { if (k > page) attempts.delete(k); });
      Array.from(caps.keys()).forEach((k) => { if (k > page) caps.delete(k); });

      if (outcome.newEnd >= wi.total) {
        starts = starts.slice(0, page + 1);
        break;
      }
      starts = paginateFrom(wi, outcome.newEnd, page + 1, starts, charsPerLine, ceilingFor);
    }
  }
  return { starts, passes };
}

/** Every word on exactly one page, in order, none dropped or repeated. */
function expectExactCoverage(wi: WordIndex, starts: number[]): void {
  expect(starts[0]).toBe(0);
  for (let i = 1; i < starts.length; i += 1) {
    expect(starts[i]).toBeGreaterThan(starts[i - 1]); // strictly increasing => no empty pages
    expect(starts[i]).toBeLessThan(wi.total);
  }
  const seen: string[] = [];
  for (let p = 0; p < starts.length; p += 1) {
    const end = starts[p + 1] ?? wi.total;
    seen.push(...wi.words.slice(starts[p], end));
  }
  expect(seen.length).toBe(wi.total);
  expect(seen.join(' ')).toBe(wi.words.join(' '));
}

const flatCeiling = (n: number) => () => n;

describe('buildWordIndex', () => {
  it('preserves every word of every verse, in order', () => {
    const verses = makeVerses(1, 12, [5, 30]);
    const wi = buildWordIndex(verses);
    expect(wi.words.join(' ')).toBe(verses.map((v) => v.arabic).join(' '));
    expect(wi.total).toBe(wi.words.length);
  });

  it('marks exactly one end-of-verse word per verse, at the right place', () => {
    const verses = makeVerses(2, 8, [3, 10]);
    const wi = buildWordIndex(verses);
    expect(wi.endsVerse.filter(Boolean).length).toBe(verses.length);
    verses.forEach((v, vi) => {
      const first = wi.firstWordOfVerse[vi];
      const len = v.arabic.trim().split(/\s+/).length;
      expect(wi.verseOf[first]).toBe(vi);
      expect(wi.endsVerse[first + len - 1]).toBe(true);
    });
  });

  it('counts diacritics out of the width proxy but keeps them in the text', () => {
    const wi = buildWordIndex(makeVerses(3, 1, [4, 4], [5, 5]));
    // Each fixture word is 5 letters + 5 harakat = 10 code units, 5 visual.
    expect(wi.words[0].length).toBe(10);
    expect(visualCharCount(wi.words[0])).toBe(5);
  });

  it('charges the ayah marker only to a verse-final word', () => {
    const wi = buildWordIndex(makeVerses(4, 2, [3, 3], [4, 4]));
    const widthOf = (i: number) => wi.cumChars[i + 1] - wi.cumChars[i];
    expect(widthOf(0)).toBe(4 + 1); // mid-verse: word + space
    expect(widthOf(2)).toBe(4 + 1 + AYAH_MARKER_CHAR_WIDTH); // verse-final
  });
});

describe('wordIndexForChars', () => {
  it('finds the first index reaching the target width', () => {
    const cum = [0, 10, 20, 30, 40];
    expect(wordIndexForChars(cum, 20, 1, 4)).toBe(2);
    expect(wordIndexForChars(cum, 21, 1, 4)).toBe(3);
    expect(wordIndexForChars(cum, 1e9, 1, 4)).toBe(4); // clamps to hi
  });
});

describe('linesForHeight', () => {
  it('clamps an unmeasured or absurd viewport into a usable page', () => {
    expect(linesForHeight(0, 44)).toBe(MUSHAF_MIN_LINES_PER_PAGE);
    expect(linesForHeight(100000, 44)).toBe(MUSHAF_MAX_LINES_PER_PAGE);
    expect(linesForHeight(44 * 11, 44)).toBe(11);
  });
});

describe('pageIndexForWord', () => {
  it('maps a word back to the page holding it', () => {
    const starts = [0, 50, 120, 200];
    expect(pageIndexForWord(starts, 0)).toBe(0);
    expect(pageIndexForWord(starts, 49)).toBe(0);
    expect(pageIndexForWord(starts, 50)).toBe(1);
    expect(pageIndexForWord(starts, 199)).toBe(2);
    expect(pageIndexForWord(starts, 10_000)).toBe(3);
  });
});

describe('settled pagination', () => {
  // Long verses are the case the old verse-granular model could not fill:
  // one verse under-fills a page, two overflow it.
  const CASES: { name: string; verses: PaginatableVerse[]; capacity: number; ceiling: number }[] = [
    // 45-60 words lands each verse at ~8 rendered lines against a ceiling of
    // 11 — the exact shape of the reported bug (An-Nisa 4:11 is 353 visual
    // chars and rendered to 8 lines on the reporter's device). One verse
    // under-fills, two overflow.
    { name: 'An-Nisa shaped (verse ~8 lines, ceiling 11)', verses: makeVerses(11, 40, [45, 60]), capacity: 44, ceiling: 11 },
    { name: 'verses longer than a whole page', verses: makeVerses(17, 40, [60, 110]), capacity: 44, ceiling: 11 },
    { name: 'short verses (Ar-Rahman shaped)', verses: makeVerses(12, 120, [3, 8]), capacity: 44, ceiling: 11 },
    { name: 'mixed lengths', verses: makeVerses(13, 60, [4, 90]), capacity: 44, ceiling: 13 },
    { name: 'one enormous verse (2:282 shaped)', verses: makeVerses(14, 1, [700, 700]), capacity: 44, ceiling: 11 },
    { name: 'narrow viewport', verses: makeVerses(15, 30, [20, 60]), capacity: 28, ceiling: 6 },
    { name: 'tall viewport', verses: makeVerses(16, 30, [20, 60]), capacity: 60, ceiling: 20 },
  ];

  CASES.forEach(({ name, verses, capacity, ceiling }) => {
    describe(name, () => {
      const wi = buildWordIndex(verses);
      const { starts } = settle(wi, capacity, flatCeiling(ceiling));

      it('loses no text at any page break', () => {
        expectExactCoverage(wi, starts);
      });

      it('fills every page but the last', () => {
        for (let p = 0; p < starts.length - 1; p += 1) {
          const lines = renderLines(wi, starts[p], starts[p + 1], capacity);
          // At the ceiling, or one line short of it — a page break can only
          // fall between words, so the last line cannot always be filled to
          // the exact character. What must never happen is the multi-line
          // gap the verse-granular model left behind.
          expect(lines).toBeGreaterThanOrEqual(ceiling - 1);
          expect(lines).toBeLessThanOrEqual(ceiling);
        }
      });

      it('never overflows a page', () => {
        for (let p = 0; p < starts.length; p += 1) {
          const lines = renderLines(wi, starts[p], starts[p + 1] ?? wi.total, capacity);
          expect(lines).toBeLessThanOrEqual(ceiling);
        }
      });
    });
  });

  it('gives page 1 a lower ceiling without disturbing the rest', () => {
    // Page 1 also carries the surah banner and Bismillah, so it has less room.
    const wi = buildWordIndex(makeVerses(21, 40, [30, 80]));
    const ceilingFor = (p: number) => (p === 0 ? 7 : 12);
    const { starts } = settle(wi, 44, ceilingFor);

    expectExactCoverage(wi, starts);
    expect(renderLines(wi, starts[0], starts[1], 44)).toBeLessThanOrEqual(7);
    for (let p = 1; p < starts.length - 1; p += 1) {
      expect(renderLines(wi, starts[p], starts[p + 1], 44)).toBeLessThanOrEqual(12);
      expect(renderLines(wi, starts[p], starts[p + 1], 44)).toBeGreaterThanOrEqual(11);
    }
  });

  it('terminates quickly — a couple of passes per page, not a search', () => {
    const wi = buildWordIndex(makeVerses(22, 50, [20, 90]));
    const { starts, passes } = settle(wi, 44, flatCeiling(11));
    // One measurement per page is the floor; anything near the per-page cap
    // would mean the retarget is guessing rather than converging.
    expect(passes).toBeLessThan(starts.length * 3);
  });

  it('survives a badly wrong starting estimate', () => {
    // The seed constant is calibrated to a real device, but a different font
    // scale or a foldable could put the true width far from it.
    const wi = buildWordIndex(makeVerses(23, 40, [20, 70]));
    [15, 25, 80, 150].forEach((capacity) => {
      const ceiling = 10;
      const { starts } = settle(wi, capacity, flatCeiling(ceiling));
      expectExactCoverage(wi, starts);
      for (let p = 0; p < starts.length; p += 1) {
        expect(renderLines(wi, starts[p], starts[p + 1] ?? wi.total, capacity))
          .toBeLessThanOrEqual(ceiling);
      }
    });
  });

  it('splits a verse across pages rather than leaving a gap', () => {
    // A single verse far longer than one page MUST break mid-verse; the old
    // model left it alone and accepted the overflow/gap.
    const wi = buildWordIndex(makeVerses(24, 1, [600, 600]));
    const { starts } = settle(wi, 44, flatCeiling(11));
    expect(starts.length).toBeGreaterThan(1);
    expectExactCoverage(wi, starts);
    // Every page belongs to the same (only) verse, and only the final word of
    // the surah is marked as ending it.
    starts.forEach((s) => expect(wi.verseOf[s]).toBe(0));
    expect(wi.endsVerse.filter(Boolean).length).toBe(1);
    expect(wi.endsVerse[wi.total - 1]).toBe(true);
  });
});

describe('regression: the gap the verse-granular model left', () => {
  /** The OLD behaviour: pack whole verses, never split one. */
  function paginateByVerse(wi: WordIndex, verses: PaginatableVerse[], capacity: number, ceiling: number): number[] {
    const starts = [0];
    let cursor = 0;
    for (let v = 0; v < verses.length; v += 1) {
      const vStart = wi.firstWordOfVerse[v];
      const vEnd = v + 1 < verses.length ? wi.firstWordOfVerse[v + 1] : wi.total;
      if (vStart > cursor && renderLines(wi, cursor, vEnd, capacity) > ceiling) {
        starts.push(vStart);
        cursor = vStart;
      }
    }
    return starts;
  }

  it('word-granular pagination fills pages that verse-granular could not', () => {
    // Sized to the reported bug: each verse renders to ~8 lines against a
    // ceiling of 11, so verse-granular pagination fits exactly one per page
    // and leaves 3 blank lines under it — the gap in the screenshot.
    const verses = makeVerses(31, 40, [45, 60]);
    const wi = buildWordIndex(verses);
    const capacity = 44;
    const ceiling = 11;

    const oldStarts = paginateByVerse(wi, verses, capacity, ceiling);
    const { starts: newStarts } = settle(wi, capacity, flatCeiling(ceiling));

    const worstGap = (starts: number[]) => {
      let worst = 0;
      for (let p = 0; p < starts.length - 1; p += 1) {
        worst = Math.max(worst, ceiling - renderLines(wi, starts[p], starts[p + 1], capacity));
      }
      return worst;
    };

    // The old model's worst page trails off by several blank lines. If this
    // ever stops being true the fixture no longer reproduces the reported
    // bug, and the assertion below is no longer evidence of anything.
    expect(worstGap(oldStarts)).toBeGreaterThanOrEqual(3);
    expect(worstGap(newStarts)).toBeLessThanOrEqual(1);
  });
});
