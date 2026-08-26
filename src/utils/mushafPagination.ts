/**
 * Mushaf page pagination — the pure half of SurahReaderScreen's page mode.
 *
 * A printed Mushaf page is FULL. It fills top to bottom every time, because
 * the text is set to the page: a verse that runs out of room simply continues
 * onto the next page, exactly the way a paragraph does in any other book.
 *
 * Paginating by whole verses cannot reproduce that, and no amount of styling
 * can paper over it. In a surah of long verses (An-Nisa, Al-Baqarah) one verse
 * under-fills a page and two overflow it, so verse-granular pagination has no
 * choice but to leave the difference as blank space.
 *
 * So pages break at WORD boundaries. A surah is flattened once into a single
 * ordered word list (buildWordIndex) and a page is just a half-open range of
 * it. Breaking mid-verse is NOT truncation in the sense CLAUDE.md forbids: the
 * remainder of the ayah is the first thing on the next page, complete and one
 * page-turn away, which is precisely how a printed Mushaf handles it. The
 * invariant that makes that safe — every word appears on exactly one page, in
 * order, with nothing dropped at a break — is enforced by this module's tests.
 *
 * Lives here rather than in the screen so it can be tested against a simulated
 * text renderer. The screen owns only the React bookkeeping (refs, attempt
 * counts, state) that wraps these functions.
 */

/**
 * Uthmani script carries a diacritic (harakat/sukun/shadda/tanwin/madda …) on
 * nearly every letter. Those are separate Unicode combining marks that stack on
 * their base letter and add ~zero horizontal advance width — but they DO count
 * toward String.length, inflating it 1.5–2.5x over a verse's actual rendered
 * width. Stripping them is what makes a character count usable as a proxy for
 * rendered line width at all.
 */
// Written as explicit escapes, never literal glyphs: a literal Arabic
// character class is unreadable in review and trivially mistyped into a
// range that swallows the whole alphabet - in which case every stripped
// string comes back empty and every width comparison silently passes.
// (verify-citations.mjs carries the same warning, and was bitten by it.)
const ARABIC_DIACRITICS_RE = /[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED]/g;

export function visualCharCount(arabicText: string): number {
  return arabicText.replace(ARABIC_DIACRITICS_RE, '').length;
}

/**
 * Visual (diacritic-stripped) characters that fit on one justified line at
 * MUSHAF_ARABIC_FONT_SIZE. Calibrated against a real device render rather than
 * guessed: An-Nisa 4:11 is 353 visual characters and laid out to exactly 8
 * lines => ~44. Only the STARTING value — the screen replaces it with the
 * device's own numbers as soon as the first page renders.
 */
export const MUSHAF_INITIAL_CHARS_PER_LINE = 44;

/**
 * An ayah marker is drawn after a verse's last word and takes up roughly this
 * much line width. Counting it stops a page of many short verses from
 * over-filling by the combined width of all its markers.
 */
export const AYAH_MARKER_CHAR_WIDTH = 5;

export const MUSHAF_MIN_LINES_PER_PAGE = 6;
/** A very tall device or an unfolded foldable would otherwise pack a leaf
 *  denser than a printed Mushaf ever runs. */
export const MUSHAF_MAX_LINES_PER_PAGE = 20;
/** Runaway guard for the seeding loop — far above the ~600 pages of a full
 *  Mushaf, let alone one surah. */
export const MAX_MUSHAF_PAGES = 2000;

/**
 * Bounds how many times the screen will re-break the SAME page before
 * accepting its current fit. Each pass is a visible reflow, and a measured
 * retarget converges in one or two, so this is a backstop rather than a
 * working budget.
 */
export const MAX_CORRECTION_PASSES_PER_PAGE = 4;

/** Turns a measured text-viewport height into that layout's real line ceiling.
 *  Clamped at both ends so an unmeasured (0) or absurd height still yields a
 *  usable page rather than an empty or impossibly dense one. */
export function linesForHeight(textHeight: number, lineHeight: number): number {
  return Math.max(
    MUSHAF_MIN_LINES_PER_PAGE,
    Math.min(MUSHAF_MAX_LINES_PER_PAGE, Math.floor(textHeight / lineHeight)),
  );
}

/** The minimum a verse needs to expose for buildWordIndex — the screen passes
 *  its full QuranVerse objects, tests pass literals. */
export interface PaginatableVerse {
  arabic: string;
}

/** A surah flattened into one ordered word list, plus the lookups pagination
 *  needs over it. */
export interface WordIndex {
  words: string[];
  /** words[i] belongs to verses[verseOf[i]]. */
  verseOf: number[];
  /** words[i] is the last word of its verse (so an ayah marker follows it). */
  endsVerse: boolean[];
  /**
   * Running visual width in "characters" before words[i]. Length is n + 1, so
   * cumChars[n] is the total and a half-open range [a, b) costs
   * cumChars[b] - cumChars[a].
   */
  cumChars: number[];
  firstWordOfVerse: number[];
  total: number;
}

export function buildWordIndex(verses: PaginatableVerse[]): WordIndex {
  const words: string[] = [];
  const verseOf: number[] = [];
  const endsVerse: boolean[] = [];
  const firstWordOfVerse: number[] = [];

  verses.forEach((v, vi) => {
    const parts = v.arabic.trim().split(/\s+/).filter(Boolean);
    firstWordOfVerse[vi] = words.length;
    parts.forEach((w, k) => {
      words.push(w);
      verseOf.push(vi);
      endsVerse.push(k === parts.length - 1);
    });
  });

  const cumChars: number[] = new Array(words.length + 1);
  cumChars[0] = 0;
  for (let i = 0; i < words.length; i += 1) {
    // +1 for the space that separates words, plus the ayah marker where one is
    // actually drawn.
    cumChars[i + 1] =
      cumChars[i] +
      visualCharCount(words[i]) +
      1 +
      (endsVerse[i] ? AYAH_MARKER_CHAR_WIDTH : 0);
  }

  return { words, verseOf, endsVerse, cumChars, firstWordOfVerse, total: words.length };
}

/** Smallest index in [lo, hi] whose cumChars reaches `target`. cumChars is
 *  strictly increasing, so this is a plain binary search. */
export function wordIndexForChars(
  cumChars: number[],
  target: number,
  lo: number,
  hi: number,
): number {
  let a = lo;
  let b = hi;
  while (a < b) {
    const m = (a + b) >> 1;
    if (cumChars[m] >= target) b = m;
    else a = m + 1;
  }
  return a;
}

/**
 * Lays out page `fromPage` onward, starting at word `startWord`, from the
 * current chars-per-line estimate. Page starts before `fromPage` are carried
 * over from `prevStarts` untouched — they have already been measured, and
 * re-deriving them from an estimate would undo that.
 *
 * Returns the word index each page begins at; page i spans
 * [starts[i], starts[i + 1] … or the end of the surah), so starts.length IS
 * the page count.
 */
export function paginateFrom(
  wi: WordIndex,
  startWord: number,
  fromPage: number,
  prevStarts: number[],
  charsPerLine: number,
  lineCeiling: (pageIdx: number) => number,
): number[] {
  const starts = prevStarts.slice(0, fromPage);
  starts[fromPage] = startWord;
  let cursor = startWord;
  let page = fromPage;

  while (cursor < wi.total && page < MAX_MUSHAF_PAGES) {
    const target = wi.cumChars[cursor] + lineCeiling(page) * charsPerLine;
    let end = wordIndexForChars(wi.cumChars, target, cursor + 1, wi.total);
    // Always consume at least one word, or a pathological estimate could spin
    // here forever producing empty pages.
    if (end <= cursor) end = cursor + 1;
    if (end >= wi.total) break; // this page runs to the end of the surah
    page += 1;
    starts[page] = end;
    cursor = end;
  }

  return starts;
}

export function pageIndexForWord(starts: number[], wordIdx: number): number {
  for (let i = starts.length - 1; i >= 0; i -= 1) {
    if (starts[i] <= wordIdx) return i;
  }
  return 0;
}

export interface RetargetInput {
  wordIndex: WordIndex;
  /** Current page starts; page `pageIdx` spans [starts[i], starts[i+1] … ). */
  starts: number[];
  pageIdx: number;
  /** Lines this page ACTUALLY rendered to, straight from onTextLayout. */
  measuredLines: number;
  /** Lines this page's layout has room for (page 1's is lower — it also
   *  carries the surah banner and Bismillah). */
  lineCeiling: number;
  /** Highest end word this page has already been proven unable to hold. */
  endCap?: number;
}

export interface RetargetResult {
  /** Chars-per-line this render actually demonstrated — feeds the running
   *  estimate later pages are seeded from. NaN-safe: null when unmeasurable. */
  observedCharsPerLine: number | null;
  /** Where this page should now end, or null to accept the current break. */
  newEnd: number | null;
  /** A newly proven upper bound on this page's end word, if this render
   *  overflowed. Callers should record it and pass it back as `endCap`. */
  provenCap?: number;
}

/**
 * Decides where page `pageIdx` should break, given how many lines it just
 * rendered to. Divides by THIS page's own measured chars-per-line, so the
 * correction is informed by real layout rather than a blind step — which is
 * why it converges in one or two passes instead of hunting.
 *
 * Pure: all bookkeeping (attempt counts, cap storage, applying the result)
 * belongs to the caller.
 */
export function retargetPageEnd(input: RetargetInput): RetargetResult {
  const { wordIndex, starts, pageIdx, measuredLines, lineCeiling, endCap } = input;

  const start = starts[pageIdx];
  if (start === undefined || measuredLines <= 0) {
    return { observedCharsPerLine: null, newEnd: null };
  }

  const end = starts[pageIdx + 1] ?? wordIndex.total;
  const chars = wordIndex.cumChars[end] - wordIndex.cumChars[start];
  if (chars <= 0) return { observedCharsPerLine: null, newEnd: null };

  const observed = chars / measuredLines;

  // Exact fit — nothing to do.
  if (measuredLines === lineCeiling) return { observedCharsPerLine: observed, newEnd: null };

  // A book's last page is short too, and there is nothing left to pull up
  // onto it.
  if (measuredLines < lineCeiling && end >= wordIndex.total) {
    return { observedCharsPerLine: observed, newEnd: null };
  }

  // Proven too long: this page can never end here or later again. Recording
  // this is what makes repeated corrections close in monotonically rather
  // than oscillate between too-full and too-empty.
  const provenCap =
    measuredLines > lineCeiling ? Math.min(endCap ?? Infinity, end - 1) : undefined;

  const effectiveCap = provenCap ?? endCap;
  const targetChars = wordIndex.cumChars[start] + lineCeiling * observed;
  let newEnd = wordIndexForChars(
    wordIndex.cumChars,
    targetChars,
    start + 1,
    wordIndex.total,
  );
  if (effectiveCap !== undefined && effectiveCap !== Infinity) {
    newEnd = Math.min(newEnd, effectiveCap);
  }
  if (newEnd <= start) newEnd = start + 1;

  return {
    observedCharsPerLine: observed,
    newEnd: newEnd === end ? null : newEnd,
    ...(provenCap !== undefined && provenCap !== Infinity ? { provenCap } : {}),
  };
}
