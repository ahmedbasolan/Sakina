/**
 * SurahReaderScreen — Immersive one-verse-at-a-time Quran reader.
 *
 * Layout: header + resume banner → scrollable verse card (CornerFrame,
 * Arabic, divider, translation) + Context accordion →
 * fixed bottom pill (Save · Share · Audio) + prev/next navigation.
 */
import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, Easing, ScrollView, useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FrostedSurface } from '../components/FrostedSurface';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Typography, Animations } from '../theme/DesignSystem';
import {
  getCachedSurah,
  fetchAndCacheSurah,
  QuranVerse,
} from '../services/quranService';
import {
  ReadingProgress,
  loadReadingProgress,
  saveProgress,
  loadBookmarksForSurah,
  addBookmark,
  removeBookmark,
} from '../services/readerRepository';
import { CornerFrame } from '../components/CornerFrame';
import ArabicText from '../components/ArabicText';
import AudioPlayerButton from '../components/AudioPlayerButton';
import ShareSheet from '../components/ShareSheet';
import ReadingViewModal from '../components/ReadingViewModal';
import { HapticsService } from '../services/hapticsService';
import { SubscriptionService } from '../services/subscriptionService';
import { FreemiumService } from '../services/freemiumService';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { isolateBidiRuns } from '../utils/bidiText';
import { useReduceMotion } from '../hooks/useReduceMotion';
import {
  buildWordIndex,
  paginateFrom,
  pageIndexForWord,
  retargetPageEnd,
  linesForHeight,
  MUSHAF_INITIAL_CHARS_PER_LINE,
  MAX_CORRECTION_PASSES_PER_PAGE,
} from '../utils/mushafPagination';

// ─── types ────────────────────────────────────────────────────────────────────

type Verse = QuranVerse;

// ─── constants ────────────────────────────────────────────────────────────────

const GOLD = Colors.accent.primary;
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type ViewMode = 'single' | 'page';

// ─── Mushaf page mode ───────────────────────────────────
// Pages break at WORD boundaries so a leaf can be genuinely FULL, the way a
// printed Mushaf page is — a verse that runs out of room continues onto the
// next page, exactly as a paragraph does in any other book. The algorithm,
// and the reasoning for why verse-granular pagination could never do this,
// live in src/utils/mushafPagination.ts, which is unit-tested against a
// simulated text renderer. This screen owns only the React bookkeeping
// around it: measuring the viewport, counting correction passes, and
// holding the breaks in state.
const MUSHAF_ARABIC_FONT_SIZE = 20;
const MUSHAF_ARABIC_LINE_HEIGHT = 44;
// Stands in for the text viewport's height for the one frame before its
// onLayout arrives. Only needs to be sane, not accurate — measurement
// replaces it on the very next frame.
const MUSHAF_FALLBACK_TEXT_HEIGHT_RATIO = 0.5;
// Height the fixed bottom bar (page nav + audio + translation toggle) takes
// out of the leaf, on top of the safe-area inset.
const PAGE_BOTTOM_BAR_HEIGHT = 60;

// -- Page turn ----------------------------------------------------------
// The leaf pivots about its RIGHT edge because that is where a mushaf is
// bound, and a forward turn sweeps it rightward toward that spine. The tilt
// is deliberately shallow: enough to read as a sheet with a near edge and a
// far one, not so much that the justified Arabic visibly skews on its way out.
const PAGE_TURN_SHIFT_RATIO = 0.22; // of window width, at full swing
const PAGE_TURN_TILT_DEG = 14;
const PAGE_TURN_PERSPECTIVE = 900;

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
function toArabicIndicNumeral(n: number): string {
  return String(n).split('').map((d) => ARABIC_INDIC_DIGITS[Number(d)] ?? d).join('');
}

// Cap on the drawer's height so a long tafsir can never grow it into the
// header — DRAWER_HEADER_CLEARANCE is a hard floor under the header's own
// height regardless of the ratio, so a short viewport (landscape, a short
// split-screen pane) can't reach into it the way a flat windowHeight * 0.5
// could.
const DRAWER_MAX_HEIGHT_RATIO = 0.5;
const DRAWER_HEADER_CLEARANCE = 90;
// The whole-page translation panel is primary content when open (a reading
// companion, not a quick footnote), so it gets more room than the per-verse
// drawer — same header-clearance floor either way.
const PAGE_TRANSLATION_MAX_HEIGHT_RATIO = 0.7;

// Vertical space a slide-up panel spends on everything that is NOT its
// scrollable body: the grab handle and its margin, the header row, the gaps
// between them, and the panel's own top/bottom padding. Subtracted from the
// panel's cap to give the ScrollView inside it a real bounded height.
//
// The ScrollView is capped rather than the container because a container cap
// does not work: 'flex: 1' resolves to 'flexBasis: 0', so inside an
// auto-height parent (bottomArea is absolutely positioned with no height) the
// panel measured to ~nothing and overflow:'hidden' clipped everything below
// the handle. Both panels shipped that way and rendered as a bare pill.
const PANEL_CHROME_HEIGHT = 76;
const PANEL_MIN_SCROLL_HEIGHT = 120;
interface TafsirEntry {
  text: string;
  source: string;
}

// Module-level tafsir cache — null = "fetched but no clean content" (sentinel to
// prevent repeated network calls for dense-isnad verses).
const tafsirCache = new Map<string, TafsirEntry | null>();

// Patterns that mark a sentence as a hadith chain / attribution — not insight.
// A sentence matching any of these is dropped entirely.
const CHAIN_PATTERNS = [
  // "recorded/narrated/reported [that|from|this|it|with|in his]"
  /\b(recorded|narrated|reported)\s+(that|from|this|it|with|in\s+his)\b/i,
  // "mentioned by/that/from/this" and "mentioned, this/that"
  /\bmentioned[,\s]+(by|that|from|this|it)\b/i,
  // "it was/is recorded/narrated/reported/said/mentioned"
  /\bit\s+(was|is)\s+(recorded|narrated|reported|said|mentioned)\b/i,
  // named person/companion + "said that/this/it" — e.g. "Ibn Abbas said that"
  // (excludes "Allah said" which is interpretive, not attribution)
  /\b(?!Allah\b)\w[\w'-]+\s+said\s+(that|this|it|he|she)\b/i,
  // Prophet attribution: "the Prophet ... said" within 30 chars
  /\bthe\s+Prophet\b.{0,30}\bsaid\b/i,
  // hadith compilers and authentication scholars — always attribution when named
  /\b(Al-Bukhari|Al-Muslim|Imam Ahmad|Ibn Jarir|At-Tirmidhi|Abu Dawud|An-Nasa'i|Ibn Majah|Al-Hakim|Ibn Hibban|Al-Bayhaqi|Ibn Khuzaymah)\b/i,
  // authentication rulings
  /\b(Sahih|Hasan|Da'if)\s+(according|by|to|chain|with)\b/i,
  /\bit\s+is\s+(Sahih|Hasan|Da'if)\b/i,
  // first-person narrator dialogue
  /\bI\s+(answered|replied|told|asked|said)\b/i,
  // third-person attributed speech marker
  /\b(She|He)\s+said[,\s]/i,
  // chain / isnad keywords
  /\bchain\s+of\s+(narration|transmission|report)\b/i,
  /\b(sanad|isnad)\b/i,
  // triple-from isnad
  /\bfrom\s+\w+,?\s+from\s+\w+,?\s+from\b/i,
  // radi Allahu anhu markers
  /\bAllah\s+be\s+pleased\s+with\s+(him|her|them)\b/i,
  // authentication criteria language
  /\bcriteria\s+of\b/i,
];

// Max sentences to show; never cuts mid-sentence.
const MAX_SENTENCES = 3;

function splitSentences(text: string): string[] {
  // Split on period/!/? followed by whitespace and an uppercase letter or quote.
  // Safe for engines without lookbehind.
  const raw = text.replace(/\s+/g, ' ').trim();
  const parts: string[] = [];
  let start = 0;
  for (let i = 0; i < raw.length - 1; i++) {
    const ch = raw[i];
    if ((ch === '.' || ch === '!' || ch === '?') && /\s/.test(raw[i + 1])) {
      const next = raw.slice(i + 1).trimStart();
      if (/^[A-Z"']/.test(next)) {
        parts.push(raw.slice(start, i + 1).trim());
        start = i + 1;
      }
    }
  }
  const last = raw.slice(start).trim();
  if (last) parts.push(last);
  return parts.filter(s => s.length > 20);
}

function isChainSentence(s: string): boolean {
  return CHAIN_PATTERNS.some(re => re.test(s));
}

function compactTafsir(text: string): string {
  const sentences = splitSentences(text);
  const clean = sentences.filter(s => !isChainSentence(s));

  const picked: string[] = [];
  for (const s of clean) {
    if (picked.length >= MAX_SENTENCES) break;
    picked.push(s);
  }

  return picked.join(' ');
}

// Ibn Kathir (Abridged) writes one commentary block per THEME, which often
// spans several consecutive ayahs (e.g. one block covers 33:1-3). The API
// returns that identical block for every ayah in the range, which is what
// made opening "Context" on consecutive verses show the exact same text
// twice or three times in a row.
//
// Splits `sentences` into `n` contiguous, in-order chunks — one per verse in
// the range, each capped at MAX_SENTENCES — so a shared block reads as
// "first part on the first verse, next part on the next verse" instead of
// repeating. A verse whose fair share rounds down to zero sentences gets an
// empty chunk; the caller treats that as "no context for this verse" rather
// than inventing filler.
function distributeSentences(sentences: string[], n: number): string[][] {
  const chunks: string[][] = Array.from({ length: n }, () => []);
  if (sentences.length === 0 || n <= 0) return chunks;
  const base = Math.floor(sentences.length / n);
  const remainder = sentences.length % n;
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const fairShare = base + (i < remainder ? 1 : 0);
    chunks[i] = sentences.slice(idx, idx + Math.min(fairShare, MAX_SENTENCES));
    idx += fairShare;
  }
  return chunks;
}

async function fetchTafsir(surahNumber: number, verseNumber: number): Promise<TafsirEntry | null> {
  const key = `${surahNumber}:${verseNumber}`;
  if (tafsirCache.has(key)) return tafsirCache.get(key) ?? null;
  try {
    // Ibn Kathir tafsir (id 169) from quran.com API v4
    const res = await fetch(
      `https://api.quran.com/api/v4/tafsirs/169/by_ayah/${surahNumber}:${verseNumber}`,
    );
    if (!res.ok) return null; // network error — don't cache, allow retry
    const json = await res.json();
    const html: string | undefined = json?.tafsir?.text;
    if (!html) { tafsirCache.set(key, null); return null; }

    // `tafsir.verses` names every ayah this block covers, e.g.
    // {"33:1":{...},"33:2":{...},"33:3":{...}} for a shared block, or a
    // single entry when the commentary is specific to one ayah. Sort by ayah
    // number — object key order isn't guaranteed — so the split below reads
    // in the same order as the surah, not API response order.
    const versesField = json?.tafsir?.verses;
    const rangeKeys: string[] =
      versesField && typeof versesField === 'object' && Object.keys(versesField).length > 0
        ? Object.keys(versesField).sort(
            (a, b) => Number(a.split(':')[1]) - Number(b.split(':')[1]),
          )
        : [key];

    // Strip HTML tags then decode common entities
    const text = html
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&rsquo;|&lsquo;/g, "'")
      .replace(/&rdquo;|&ldquo;/g, '"')
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) {
      for (const k of rangeKeys) tafsirCache.set(k, null);
      return null;
    }

    if (rangeKeys.length <= 1) {
      const compact = compactTafsir(text);
      const entry: TafsirEntry | null = compact ? { text: compact, source: 'Ibn Kathir · quran.com' } : null;
      tafsirCache.set(key, entry);
      return entry;
    }

    // Shared block: divide the clean sentence pool across every verse it
    // covers instead of repeating the whole thing on each one.
    const cleanSentences = splitSentences(text).filter(s => !isChainSentence(s));
    const perVerse = distributeSentences(cleanSentences, rangeKeys.length);
    rangeKeys.forEach((k, i) => {
      const slice = perVerse[i];
      const entry: TafsirEntry | null =
        slice.length > 0 ? { text: slice.join(' '), source: 'Ibn Kathir · quran.com' } : null;
      tafsirCache.set(k, entry);
    });
    return tafsirCache.get(key) ?? null;
  } catch {
    return null;
  }
}

// ─── SurahReaderScreen ────────────────────────────────────────────────────────

type Props = StackScreenProps<RootStackParamList, 'SurahReader'>;

export default function SurahReaderScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  // Page recitation is unmounted when this screen is not focused, which
  // releases its native player. AudioPlayerButton owns its player privately —
  // a parent cannot pause it — so unmounting is the only way to guarantee the
  // recitation stops when the reader navigates away instead of following them
  // to the next screen.
  const isFocused = useIsFocused();
  const { surahNumber, surahName, surahArabic, verseCount } = route.params;

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<number>>(new Set());
  const [resumeIndex, setResumeIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [showTranslit, setShowTranslit] = useState(false);
  const toggleTranslit = useCallback(() => setShowTranslit((v) => !v), []);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // ── Mushaf page mode ──
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // Real height of the leaf's Arabic text viewport, measured by onLayout.
  // Two layouts exist and they are not the same size: page 1 carries the
  // surah banner and Bismillah above the text, every later page does not.
  // Each is filled in when its own layout first renders; until then the
  // other one stands in, adjusted by the banner block's measured height, so
  // the first page turn does not have to re-seed the whole surah just to
  // learn the taller number.
  const [measuredTextHeights, setMeasuredTextHeights] = useState<{ first: number; rest: number }>(
    { first: 0, rest: 0 },
  );
  const [bannerBlockHeight, setBannerBlockHeight] = useState(0);

  const fallbackTextHeight = windowHeight * MUSHAF_FALLBACK_TEXT_HEIGHT_RATIO;
  const restTextHeight =
    measuredTextHeights.rest ||
    (measuredTextHeights.first ? measuredTextHeights.first + bannerBlockHeight : fallbackTextHeight);
  const firstTextHeight =
    measuredTextHeights.first ||
    (measuredTextHeights.rest
      ? Math.max(1, measuredTextHeights.rest - bannerBlockHeight)
      : fallbackTextHeight);

  const maxLinesFirstPage = useMemo(
    () => linesForHeight(firstTextHeight, MUSHAF_ARABIC_LINE_HEIGHT),
    [firstTextHeight],
  );
  const maxLinesLaterPage = useMemo(
    () => linesForHeight(restTextHeight, MUSHAF_ARABIC_LINE_HEIGHT),
    [restTextHeight],
  );
  const maxLinesForPage = useCallback(
    (pageIdx: number) => (pageIdx === 0 ? maxLinesFirstPage : maxLinesLaterPage),
    [maxLinesFirstPage, maxLinesLaterPage],
  );

  // The viewport height arrives from the page currently on screen, so which
  // slot it belongs to is bound at render time (see the call site) rather
  // than read from a ref when the event fires — the same staleness hazard
  // handleLeafTextLayout documents below.
  const handleLeafViewportLayout = useCallback(
    (pageIdx: number, e: LayoutChangeEvent) => {
      const h = e.nativeEvent.layout.height;
      if (h <= 0) return;
      const slot = pageIdx === 0 ? 'first' : 'rest';
      // Sub-pixel layout jitter would otherwise write a new object every
      // frame and re-run everything downstream of it.
      setMeasuredTextHeights((prev) =>
        Math.abs(prev[slot] - h) < 1 ? prev : { ...prev, [slot]: h },
      );
    },
    [],
  );

  const handleBannerBlockLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h <= 0) return;
    setBannerBlockHeight((prev) => (Math.abs(prev - h) < 1 ? prev : h));
  }, []);

  // The surah as one flat word list — the thing pages are actually cut out
  // of. Rebuilt only when the verses themselves change.
  const wordIndex = useMemo(() => buildWordIndex(verses), [verses]);

  // Running estimate of how many visual characters fit on a rendered line,
  // recalibrated from every page that lays out. A ref rather than state:
  // it feeds the NEXT calculation, and nothing should re-render because it
  // moved a fraction.
  const charsPerLineRef = useRef(MUSHAF_INITIAL_CHARS_PER_LINE);

  // Word index each page begins at. Page i spans
  // [pageStarts[i], pageStarts[i + 1] ... or the end of the surah), so
  // pageStarts.length IS the page count — no separate estimate needed.
  const [pageStarts, setPageStarts] = useState<number[]>(() =>
    paginateFrom(wordIndex, 0, 0, [], MUSHAF_INITIAL_CHARS_PER_LINE, maxLinesForPage),
  );

  // Correction passes spent on each page index, and the hard upper bound a
  // page's end word has been proven not to exceed (set the first time that
  // page overflows). Together they make repeated corrections close in on a
  // fit monotonically rather than hunt around it.
  const correctionAttemptsRef = useRef<Map<number, number>>(new Map());
  const pageEndCapRef = useRef<Map<number, number>>(new Map());
  // Pages whose break is final, keyed to the exact range that settled. Without
  // this, EVERY re-render re-enters the correction path via onTextLayout — and
  // page recitation re-renders the leaf once per ayah to move the highlight,
  // so a reciting page was continuously re-measuring and recalibrating
  // underneath the player. Skipping settled pages keeps the leaf inert while
  // audio is running.
  const settledPagesRef = useRef<Map<number, string>>(new Map());

  // Correcting page N re-derives every page after it, so their recorded
  // attempts and caps describe ranges that no longer exist — drop them.
  const invalidatePagesAfter = useCallback((pageIdx: number) => {
    [correctionAttemptsRef, pageEndCapRef, settledPagesRef].forEach((ref) => {
      Array.from(ref.current.keys()).forEach((k) => {
        if (k > pageIdx) ref.current.delete(k);
      });
    });
  }, []);

  // A fresh surah re-paginates during render (not in a useEffect) so its
  // verses and its page breaks land in the SAME committed frame — an
  // effect-based sync left one real painted frame per surah open where the
  // verses had loaded but the breaks were still the previous surah's.
  const prevWordIndexRef = useRef(wordIndex);
  if (prevWordIndexRef.current !== wordIndex) {
    prevWordIndexRef.current = wordIndex;
    correctionAttemptsRef.current.clear();
    pageEndCapRef.current.clear();
    settledPagesRef.current.clear();
    charsPerLineRef.current = MUSHAF_INITIAL_CHARS_PER_LINE;
    setPageStarts(
      paginateFrom(wordIndex, 0, 0, [], MUSHAF_INITIAL_CHARS_PER_LINE, maxLinesForPage),
    );
  }

  // Mirrors pageStarts for the handlers and the autosave interval, so they
  // can read the latest breaks without depending on the array itself — every
  // correction gives it a new identity, and depending on it directly
  // restarted the 3-second save interval on each one.
  const pageStartsRef = useRef(pageStarts);
  useEffect(() => { pageStartsRef.current = pageStarts; }, [pageStarts]);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const currentPageIndexRef = useRef(currentPageIndex);
  // Declared up here, away from the rest of the page-turn state, because
  // handleLeafTextLayout is defined below them and has to know whether a turn
  // is currently in the air before it re-paginates anything.
  const turnRef = useRef<Animated.CompositeAnimation | null>(null);
  const deferredLeafLayoutRef = useRef<
    { pageIdx: number; lines: number; range: string } | null
  >(null);
  // The page a turn is heading to, written synchronously the moment one is
  // scheduled. currentPageIndex only catches up when React commits, and its
  // ref lags by a further effect, so neither can bound a tap that lands while
  // a turn is still in the air -- see runPageTurn.
  const turnTargetRef = useRef(currentPageIndex);
  useEffect(() => {
    currentPageIndexRef.current = currentPageIndex;
    turnTargetRef.current = currentPageIndex;
  }, [currentPageIndex]);

  const pageIndexForVerse = useCallback(
    (starts: number[], verseIdx: number) =>
      pageIndexForWord(starts, wordIndex.firstWordOfVerse[verseIdx] ?? 0),
    [wordIndex],
  );

  // Set while a resume-jump or a re-seed is in flight: the verse index this
  // effect should keep following forward as the breaks settle, until it
  // lands on the page that actually contains it.
  const resumeTargetRef = useRef<number | null>(null);
  useEffect(() => {
    const target = resumeTargetRef.current;
    if (target === null) return;
    const containingPage = pageIndexForVerse(pageStarts, target);
    if (containingPage === currentPageIndex) {
      resumeTargetRef.current = null;
    } else if (containingPage > currentPageIndex) {
      setCurrentPageIndex(containingPage);
    }
  }, [pageStarts, currentPageIndex, pageIndexForVerse]);

  // A viewport that grows (rotation, exiting split-screen, unfolding, or the
  // resume banner being dismissed) leaves every page holding less than it now
  // has room for. Re-paginate and let the chase effect above carry the reader
  // back to the verse they were on, rather than resyncing silently and losing
  // their place.
  //
  // This also fires once on a normal cold open: the first frame paginates
  // against MUSHAF_FALLBACK_TEXT_HEIGHT_RATIO, then the viewport's real
  // onLayout arrives and reports more room than the fallback assumed.
  const prevMaxLinesRef = useRef({ first: maxLinesFirstPage, rest: maxLinesLaterPage });
  useEffect(() => {
    const grew =
      maxLinesFirstPage > prevMaxLinesRef.current.first ||
      maxLinesLaterPage > prevMaxLinesRef.current.rest;
    if (grew) {
      const anchorWord = pageStartsRef.current[currentPageIndexRef.current];
      if (anchorWord !== undefined) {
        resumeTargetRef.current = wordIndex.verseOf[anchorWord] ?? 0;
        correctionAttemptsRef.current.clear();
        pageEndCapRef.current.clear();
        settledPagesRef.current.clear();
        setPageStarts(
          paginateFrom(wordIndex, 0, 0, [], charsPerLineRef.current, maxLinesForPage),
        );
      }
    }
    prevMaxLinesRef.current = { first: maxLinesFirstPage, rest: maxLinesLaterPage };
  }, [maxLinesFirstPage, maxLinesLaterPage, wordIndex, maxLinesForPage]);

  // The leaf's Arabic block reports how many lines it really rendered to.
  // Re-target this page's break so it hits the ceiling exactly, then re-seed
  // every later page from the new break. Unlike the verse-granular version
  // this replaced, the break can land mid-verse, which is the whole reason a
  // page can now be filled rather than merely not-overflowing.
  //
  // Takes the page index as a parameter bound at render time (see its call
  // site below) rather than reading currentPageIndexRef inside the handler:
  // onTextLayout is bridged back from native measurement asynchronously, and
  // reading a mutable "current page" ref at event-fire time risked a stale
  // event (measured against page N) correcting whatever page the ref had
  // since advanced to after a fast page-turn.
  const applyLeafMeasurement = useCallback(
    (pageIdx: number, measuredLines: number) => {
      const starts = pageStartsRef.current;
      // Identity of the exact range being measured. A settled page re-reports
      // the same layout on every unrelated re-render (the recitation
      // highlight, a drawer opening); there is nothing to recompute for it.
      const signature = `${starts[pageIdx]}:${starts[pageIdx + 1] ?? wordIndex.total}`;
      if (settledPagesRef.current.get(pageIdx) === signature) return;

      const outcome = retargetPageEnd({
        wordIndex,
        starts,
        pageIdx,
        measuredLines,
        lineCeiling: maxLinesForPage(pageIdx),
        endCap: pageEndCapRef.current.get(pageIdx),
      });

      // Recalibrate from this real render, blended so one oddly-shaped page
      // (a lot of short words, an unusual run of markers) cannot yank the
      // estimate every later page is seeded from.
      if (outcome.observedCharsPerLine !== null) {
        charsPerLineRef.current =
          charsPerLineRef.current * 0.5 + outcome.observedCharsPerLine * 0.5;
      }
      if (outcome.provenCap !== undefined) {
        pageEndCapRef.current.set(pageIdx, outcome.provenCap);
      }
      if (outcome.newEnd === null) {
        settledPagesRef.current.set(pageIdx, signature);
        return;
      }

      const attempts = (correctionAttemptsRef.current.get(pageIdx) ?? 0) + 1;
      if (attempts > MAX_CORRECTION_PASSES_PER_PAGE) return;
      correctionAttemptsRef.current.set(pageIdx, attempts);
      invalidatePagesAfter(pageIdx);

      if (outcome.newEnd >= wordIndex.total) {
        // Everything left fits here — this is now the last page.
        setPageStarts((prev) => prev.slice(0, pageIdx + 1));
        return;
      }
      const nextEnd = outcome.newEnd;
      setPageStarts((prev) =>
        paginateFrom(wordIndex, nextEnd, pageIdx + 1, prev, charsPerLineRef.current, maxLinesForPage),
      );
    },
    [wordIndex, maxLinesForPage, invalidatePagesAfter],
  );

  // Measuring is free; ACTING on the measurement is not. A correction re-runs
  // paginateFrom across the rest of the surah and re-renders the whole
  // justified block, and landing on an unvisited page fires this immediately
  // after the page swap -- squarely in the middle of a turn. That JS work is
  // the hitch felt at the midpoint of a flip. Hold the measurement and replay
  // it once the leaf is down: the page it describes has not changed in the
  // meantime, so the deferred correction is the same correction.
  const handleLeafTextLayout = useCallback(
    (pageIdx: number, ev: { nativeEvent: { lines: unknown[] } }) => {
      const measuredLines = ev.nativeEvent.lines.length;
      if (turnRef.current) {
        const starts = pageStartsRef.current;
        deferredLeafLayoutRef.current = {
          pageIdx,
          lines: measuredLines,
          range: `${starts[pageIdx]}:${starts[pageIdx + 1] ?? wordIndex.total}`,
        };
        return;
      }
      applyLeafMeasurement(pageIdx, measuredLines);
    },
    [applyLeafMeasurement, wordIndex.total],
  );

  const flushDeferredLeafLayout = useCallback(() => {
    const held = deferredLeafLayoutRef.current;
    deferredLeafLayoutRef.current = null;
    if (!held) return;
    // A line count only describes the range it was measured against. If the
    // breaks moved while the leaf was in the air -- another page's correction
    // landing, the viewport growing -- replaying it would retarget the new
    // range using the old page's height. Drop it instead: the range changed,
    // so the block re-rendered, so a fresh onTextLayout is already coming.
    const starts = pageStartsRef.current;
    const range = `${starts[held.pageIdx]}:${starts[held.pageIdx + 1] ?? wordIndex.total}`;
    if (range !== held.range) return;
    applyLeafMeasurement(held.pageIdx, held.lines);
  }, [applyLeafMeasurement, wordIndex.total]);
  // The current page's words, regrouped into one run per verse. A run is a
  // contiguous slice of ONE verse; `endsVerse` says whether it reaches that
  // verse's final word, which is the only place an ayah marker is drawn.
  //
  // Only the last run on a page can be partial — a run stops early only when
  // it hits the page's end word — so a verse continued from the previous page
  // opens the leaf, and a verse continuing onto the next one closes it,
  // markerless, exactly as a printed Mushaf sets it.
  const pageRuns = useMemo(() => {
    const start = pageStarts[currentPageIndex];
    if (start === undefined) return [];
    const end = pageStarts[currentPageIndex + 1] ?? wordIndex.total;
    const runs: { verseIdx: number; text: string; endsVerse: boolean }[] = [];
    let i = start;
    while (i < end) {
      const verseIdx = wordIndex.verseOf[i];
      let j = i;
      while (j < end && wordIndex.verseOf[j] === verseIdx) j += 1;
      runs.push({
        verseIdx,
        text: wordIndex.words.slice(i, j).join(' '),
        endsVerse: wordIndex.endsVerse[j - 1] === true,
      });
      i = j;
    }
    return runs;
  }, [pageStarts, currentPageIndex, wordIndex]);

  // Distinct verses touched by this page, in order — what the translation
  // panel lists and what the page's recitation range spans. A verse split
  // across a page boundary appears in full on both, which is right: the
  // reader needs its whole meaning on either page.
  const pageVerseIndices = useMemo(() => {
    const out: number[] = [];
    pageRuns.forEach((r) => {
      if (out[out.length - 1] !== r.verseIdx) out.push(r.verseIdx);
    });
    return out;
  }, [pageRuns]);

  // Height cap for a slide-up panel's scrollable body. Applied to the
  // ScrollView itself rather than the panel box — see PANEL_CHROME_HEIGHT for
  // why capping the container silently collapsed both panels instead.
  const panelScrollMaxHeight = useCallback(
    (ratio: number) =>
      Math.max(
        PANEL_MIN_SCROLL_HEIGHT,
        Math.min(windowHeight * ratio, windowHeight - insets.top - DRAWER_HEADER_CLEARANCE) -
          PANEL_CHROME_HEIGHT,
      ),
    [windowHeight, insets.top],
  );

  // Tap-to-reveal footnote drawer — the page itself stays pure Arabic until a
  // verse is tapped, then this surfaces translation/transliteration/audio/context.
  const [selectedVerseIndex, setSelectedVerseIndex] = useState<number | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerAudioActive, setDrawerAudioActive] = useState(false);
  const [drawerContextOpen, setDrawerContextOpen] = useState(false);
  const [drawerTafsir, setDrawerTafsir] = useState<TafsirEntry | null>(null);
  const [drawerTafsirLoading, setDrawerTafsirLoading] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const drawerAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const drawerScrollRef = useRef<ScrollView>(null);

  // Each newly selected verse starts its companion panel fresh — otherwise
  // tapping verse B while verse A's tafsir/audio was open would carry A's
  // state over onto B's reference. Includes the scroll position: switching
  // verses without closing the drawer (handleVersePress just swaps
  // selectedVerseIndex) never unmounts this ScrollView, so without an
  // explicit reset it kept whatever offset the previous verse's tafsir had
  // been scrolled to, making the new verse's drawer look empty/truncated.
  useEffect(() => {
    setDrawerAudioActive(false);
    setDrawerContextOpen(false);
    setDrawerTafsir(null);
    setDrawerTafsirLoading(false);
    drawerScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedVerseIndex]);

  const openVerseDrawer = useCallback((idx: number) => {
    HapticsService.impactAsync('LIGHT');
    setSelectedVerseIndex(idx);
    setDrawerVisible(true);
    drawerAnimRef.current?.stop();
    const anim = Animated.timing(drawerAnim, {
      toValue: 1,
      duration: Animations.timing.normal,
      useNativeDriver: true,
    });
    drawerAnimRef.current = anim;
    anim.start();
  }, [drawerAnim]);

  const closeDrawer = useCallback(() => {
    drawerAnimRef.current?.stop();
    const anim = Animated.timing(drawerAnim, {
      toValue: 0,
      duration: Animations.timing.fast,
      useNativeDriver: true,
    });
    drawerAnimRef.current = anim;
    anim.start(({ finished }) => {
      if (finished) {
        setDrawerVisible(false);
        setSelectedVerseIndex(null);
      }
    });
  }, [drawerAnim]);

  const handleVersePress = useCallback((idx: number) => {
    if (drawerVisible && selectedVerseIndex === idx) {
      closeDrawer();
    } else {
      openVerseDrawer(idx);
    }
  }, [drawerVisible, selectedVerseIndex, openVerseDrawer, closeDrawer]);

  // Whole-page translation panel — a persistent companion (toggled from the
  // header's language icon, page mode only) showing every verse on the
  // CURRENT page's translation at once, distinct from the per-verse
  // tap-to-reveal drawer above. Content is derived directly from
  // pages[currentPageIndex] rather than a frozen snapshot, so it stays open
  // and updates on its own as the reader turns pages — see the render below.
  const [pageTranslationVisible, setPageTranslationVisible] = useState(false);
  const pageTranslationAnim = useRef(new Animated.Value(0)).current;
  const pageTranslationAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const closePageTranslation = useCallback(() => {
    pageTranslationAnimRef.current?.stop();
    const anim = Animated.timing(pageTranslationAnim, {
      toValue: 0,
      duration: Animations.timing.fast,
      useNativeDriver: true,
    });
    pageTranslationAnimRef.current = anim;
    anim.start(({ finished }) => {
      if (finished) setPageTranslationVisible(false);
    });
  }, [pageTranslationAnim]);

  const togglePageTranslation = useCallback(() => {
    if (pageTranslationVisible) {
      closePageTranslation();
      return;
    }
    HapticsService.impactAsync('LIGHT');
    if (drawerVisible) closeDrawer(); // the two bottom panels don't coexist
    setPageTranslationVisible(true);
    pageTranslationAnimRef.current?.stop();
    const anim = Animated.timing(pageTranslationAnim, {
      toValue: 1,
      duration: Animations.timing.normal,
      useNativeDriver: true,
    });
    pageTranslationAnimRef.current = anim;
    anim.start();
  }, [pageTranslationVisible, closePageTranslation, drawerVisible, closeDrawer, pageTranslationAnim]);

  // The reverse direction of the mutual-exclusion above: if the per-verse
  // drawer opens through any path other than togglePageTranslation's own
  // check (e.g. tapping a verse on the leaf), close this panel too.
  useEffect(() => {
    if (drawerVisible && pageTranslationVisible) closePageTranslation();
  }, [drawerVisible, pageTranslationVisible, closePageTranslation]);

  // If handleLeafTextLayout's correction moves the drawer's selected verse to
  // a different page, the drawer would otherwise keep showing a verse no
  // longer visible anywhere on the current leaf — close it instead.
  useEffect(() => {
    if (!drawerVisible || selectedVerseIndex === null) return;
    if (!pageVerseIndices.includes(selectedVerseIndex)) closeDrawer();
  }, [pageVerseIndices, drawerVisible, selectedVerseIndex, closeDrawer]);

  // Page recitation — one AudioPlayerButton in the bottom bar, handed the
  // whole current page as a RANGE key (`chapter:first-last`, which
  // getAudioUrls expands into one url per ayah), so it recites straight
  // through the leaf instead of one verse at a time. It reports which ayah of
  // that range it has reached, which is what lets the page mark it as it goes.
  const [pageAudioPlaying, setPageAudioPlaying] = useState(false);
  const [pageAudioRangeIndex, setPageAudioRangeIndex] = useState(0);
  // Memoised so the key is one stable string per page. AudioPlayerButton
  // rebuilds its native player whenever verseKey changes, so an unnecessarily
  // new value here would tear down playback mid-ayah.
  const pageAudioKey = useMemo(() => {
    if (pageVerseIndices.length === 0) return undefined;
    const first = verses[pageVerseIndices[0]]?.numberInSurah;
    const last = verses[pageVerseIndices[pageVerseIndices.length - 1]]?.numberInSurah;
    if (first === undefined || last === undefined) return undefined;
    return `${surahNumber}:${first}-${last}`;
  }, [pageVerseIndices, verses, surahNumber]);
  // Global verse index currently being recited, or null when idle. Guarded on
  // pageAudioPlaying so a paused player doesn't leave an ayah lit up.
  const recitingVerseIndex = pageAudioPlaying
    ? pageVerseIndices[pageAudioRangeIndex] ?? null
    : null;

  // Page turns swap the whole leaf, so there's no verse left for the drawer
  // to refer to — drop it instantly rather than animate a close mid-turn.
  const resetDrawerForPageTurn = useCallback(() => {
    drawerAnimRef.current?.stop();
    drawerAnim.setValue(0);
    setDrawerVisible(false);
    setSelectedVerseIndex(null);
  }, [drawerAnim]);

  // -- Page turn --------------------------------------------------------
  // One signed value carries the whole turn: 0 is the leaf lying flat, +1 is
  // fully swung off to the right, -1 fully off to the left. A forward turn
  // runs 0 -> +1, swaps the page there, then brings it -1 -> 0. Going back
  // mirrors it. Reading direction decides the sign, so forward sends the leaf
  // toward the spine on the right, the way a hand carries a mushaf leaf over.
  //
  // The swing is SYMMETRIC, and that is load-bearing rather than tidy. Both
  // ends of it sit at opacity 0, so the jump from +1 to -1 that carries the
  // page swap is the one moment nothing is on screen to see it. The first
  // version swung out to 1 and back in from only -0.45, which is a point the
  // opacity curve puts at 0.625 -- so the new page appeared at two-thirds
  // opacity, half a swing off-centre, in a single frame. That flash was the
  // "not smooth" in the flip; it was never the animation dropping frames.
  //
  // Only transform and opacity move -- never layout -- and `turning` gates the
  // entire animated style, so a settled leaf renders plain numbers with no
  // Animated node in it at all. That is what makes an interrupted turn safe:
  // it cannot strand the page half-rotated or invisible the way VerseLayer's
  // skipReveal once did (CLAUDE.md, Motion).
  const turnAnim = useRef(new Animated.Value(0)).current;
  const pendingTurnSwapRef = useRef<(() => void) | null>(null);
  // The turn that has been set up but not yet started, handed to the layout
  // effect below. See runPageTurn for why it cannot start on the spot.
  const pendingTurnRef = useRef<{ exit: 1 | -1; commit: () => void } | null>(null);
  const [turning, setTurning] = useState(false);
  // Bumped once per turn. `turning` alone cannot key the start effect: an
  // interrupting tap sets it false then true again inside one batch, so it
  // never changes and the replacement turn would never start.
  const [turnNonce, setTurnNonce] = useState(0);
  // Same trick for the second half of the turn, which cannot begin until the
  // render carrying the NEW page has actually committed.
  const pendingSettleRef = useRef<1 | -1 | null>(null);
  const [settleNonce, setSettleNonce] = useState(0);
  const reduceMotion = useReduceMotion();

  // Stop whatever is in flight and land the leaf flat, committing the page
  // change if the turn was cut short before its own swap. Every exit from a
  // turn routes through here -- a second tap, leaving page mode, unmount --
  // so one place is responsible for a flat, opaque, correctly-numbered leaf.
  const settlePageTurn = useCallback(() => {
    turnRef.current?.stop();
    turnRef.current = null;
    pendingTurnRef.current = null;
    pendingSettleRef.current = null;
    const pending = pendingTurnSwapRef.current;
    pendingTurnSwapRef.current = null;
    pending?.();
    turnAnim.setValue(0);
    setTurning(false);
    // Whatever the leaf reported while it was moving still needs acting on.
    flushDeferredLeafLayout();
  }, [turnAnim, flushDeferredLeafLayout]);

  const runPageTurn = useCallback(
    (delta: 1 | -1) => {
      // Bound against the page this turn is heading to, not the one on
      // screen. A second tap arrives before React has committed the first
      // turn's index, so testing currentPageIndex here would read the page
      // before last as "not the last page" and walk the reader off the end of
      // the surah onto a blank leaf numbered one past the count.
      const target = turnTargetRef.current + delta;
      if (target < 0 || target > pageStarts.length - 1) return;

      // A tap landing mid-turn commits the turn already running and starts a
      // fresh one, so paging quickly moves page by page instead of queueing
      // turns or swallowing the tap.
      if (turnRef.current) settlePageTurn();

      HapticsService.impactAsync('LIGHT');
      resetDrawerForPageTurn();
      turnTargetRef.current = target;
      // Absolute, not a p => p + delta updater: the target is already fixed,
      // and an absolute set stays correct however many times it is applied.
      const commit = () => setCurrentPageIndex(target);

      if (reduceMotion) {
        commit();
        return;
      }

      // +1 (forward) exits right toward the spine; -1 (back) exits left.
      turnAnim.setValue(0);
      pendingTurnSwapRef.current = commit;
      // Set up, but do NOT start here. leafTurnStyle only reaches the leaf on
      // the render that setTurning(true) schedules, and starting the timing
      // now would run its first frames against a view the animated node is
      // not attached to yet -- the leaf then snaps to wherever the value had
      // already travelled the moment the style landed on it. The layout
      // effect below starts it once that render has actually committed.
      pendingTurnRef.current = { exit: delta, commit };
      setTurning(true);
      setTurnNonce((n) => n + 1);
    },
    [pageStarts.length, reduceMotion, resetDrawerForPageTurn, settlePageTurn, turnAnim],
  );

  // Runs after the commit that attached leafTurnStyle to the leaf, so the
  // sweep's first frame is the first frame the leaf can actually show.
  useLayoutEffect(() => {
    const spec = pendingTurnRef.current;
    if (!spec) return;
    pendingTurnRef.current = null;
    const { exit, commit } = spec;

    const away = Animated.timing(turnAnim, {
      toValue: exit,
      duration: Animations.timing.fast,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    turnRef.current = away;
    away.start(({ finished }) => {
      if (!finished) return;
      // The leaf is swung off and fully faded by now, so the content swap
      // itself is never seen -- only its result, arriving from the far edge.
      pendingTurnSwapRef.current = null;
      commit();
      // -exit, not a fraction of it: opacity is 0 at both extremes, so this
      // reposition is invisible. Any shorter and it is a visible pop.
      turnAnim.setValue(-exit);
      // Hand the second half to the effect below rather than starting it
      // here. commit() has only SCHEDULED the new page; starting the settle
      // now races the render, and the leaf fades back in carrying whichever
      // page won. Waiting costs an invisible frame or two at opacity 0 and
      // guarantees the page that rises is the page that was asked for.
      pendingSettleRef.current = exit;
      setSettleNonce((n) => n + 1);
    });
    // turnNonce is the trigger; nothing else here should restart a turn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnNonce]);

  // Runs after the commit carrying the new page, so the leaf that settles
  // back into view already holds the content it is settling to.
  useLayoutEffect(() => {
    const exit = pendingSettleRef.current;
    if (exit === null) return;
    pendingSettleRef.current = null;

    const settle = Animated.timing(turnAnim, {
      toValue: 0,
      duration: Animations.timing.fast,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    turnRef.current = settle;
    settle.start(({ finished: landed }) => {
      if (!landed) return;
      turnRef.current = null;
      turnAnim.setValue(0);
      setTurning(false);
      // The leaf is down. Anything it measured on the way in can be acted on
      // now without stealing frames from the motion.
      flushDeferredLeafLayout();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settleNonce]);

  // No bounds check here on purpose -- runPageTurn owns it, and owns it
  // against the pending page rather than the rendered one. A second guard
  // reading currentPageIndex would only reintroduce the stale-index hole.
  const handlePrevPage = useCallback(() => runPageTurn(-1), [runPageTurn]);
  const handleNextPage = useCallback(() => runPageTurn(1), [runPageTurn]);

  // A turn never survives the leaf it belongs to. Switching to single-verse
  // mode or unmounting lands it rather than freezing turnAnim wherever it
  // stopped, which would render the leaf mid-rotation on the way back in.
  useEffect(() => {
    if (viewMode !== 'page') settlePageTurn();
  }, [viewMode, settlePageTurn]);
  useEffect(() => () => { turnRef.current?.stop(); }, []);

  // Hinged at the right edge -- the spine -- so the leaf pivots where a
  // mushaf is actually bound instead of tumbling about its own middle.
  // `perspective` has to lead the transform array or the rotation renders
  // dead flat.
  const leafTurnStyle = useMemo(
    () => ({
      transformOrigin: '100% 50%',
      // Linear in the swing, but the swing itself is eased in on the way out
      // and out on the way in, so the leaf holds near-full opacity for most of
      // its travel and only collapses at the very end -- the blank moment at
      // the crossover lasts a frame or two rather than a visible blink.
      opacity: turnAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 0],
      }),
      transform: [
        { perspective: PAGE_TURN_PERSPECTIVE },
        {
          translateX: turnAnim.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [
              -windowWidth * PAGE_TURN_SHIFT_RATIO,
              0,
              windowWidth * PAGE_TURN_SHIFT_RATIO,
            ],
          }),
        },
        {
          rotateY: turnAnim.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [
              `${PAGE_TURN_TILT_DEG}deg`,
              '0deg',
              `-${PAGE_TURN_TILT_DEG}deg`,
            ],
          }),
        },
      ],
    }),
    [turnAnim, windowWidth],
  );

  const toggleDrawerContext = useCallback(async () => {
    if (selectedVerseIndex === null) return;
    const next = !drawerContextOpen;
    setDrawerContextOpen(next);
    HapticsService.impactAsync('LIGHT');
    if (next && !drawerTafsir) {
      setDrawerTafsirLoading(true);
      const entry = await fetchTafsir(surahNumber, verses[selectedVerseIndex].numberInSurah);
      setDrawerTafsirLoading(false);
      setDrawerTafsir(entry);
    }
  }, [selectedVerseIndex, drawerContextOpen, drawerTafsir, surahNumber, verses]);

  // Reflection accordion
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [tafsirEntry, setTafsirEntry] = useState<TafsirEntry | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const tafsirGenRef = useRef(0);
  const chevronAnim = useRef(new Animated.Value(0)).current;
  const reflectionBodyAnim = useRef(new Animated.Value(0)).current;

  // Share sheet
  const [shareVisible, setShareVisible] = useState(false);
  const [shareContent, setShareContent] = useState({
    text: '', source: '', arabicText: '', transliteration: '',
  });
  const [isPremium, setIsPremium] = useState(() => SubscriptionService.getInstance().isPremium());
  useFocusEffect(useCallback(() => {
    setIsPremium(SubscriptionService.getInstance().isPremium());
  }, []));

  // Card entrance animations
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(20)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  // Stable ref so the progress timer always reads the latest index
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  // Mount: fade header, load data
  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: Animations.timing.slow,
      useNativeDriver: true,
    }).start();
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save progress every 3 s. Reads pageStartsRef rather than depending on
  // `pageStarts` directly — every correction pass gives it a new array
  // identity, and depending on it here restarted this interval (resetting the
  // 3-second countdown) on each one.
  useEffect(() => {
    if (verses.length === 0) return () => {};
    const timer = setInterval(() => {
      const verseIndex = viewMode === 'page'
        ? (wordIndex.verseOf[pageStartsRef.current[currentPageIndexRef.current] ?? 0]
            ?? currentIndexRef.current)
        : currentIndexRef.current;
      saveProgress({
        surahNumber,
        verseIndex,
        surahName,
        timestamp: Date.now(),
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(timer);
  }, [verses.length, surahNumber, surahName, viewMode]);

  // Animate card in + reset reflection state on each verse change
  useEffect(() => {
    cardOpacity.setValue(0);
    cardSlide.setValue(16);
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: Animations.timing.normal,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: Animations.timing.normal,
        useNativeDriver: true,
      }),
    ]).start();

    // Cancel any in-flight tafsir fetch from the previous verse
    tafsirGenRef.current += 1;
    setReflectionOpen(false);
    setTafsirEntry(null);
    setTafsirLoading(false);
    chevronAnim.setValue(0);
    reflectionBodyAnim.setValue(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const toggleReflection = useCallback(async () => {
    const next = !reflectionOpen;
    setReflectionOpen(next);
    HapticsService.impactAsync('LIGHT');

    Animated.parallel([
      Animated.timing(chevronAnim, {
        toValue: next ? 1 : 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(reflectionBodyAnim, {
        toValue: next ? 1 : 0,
        duration: next ? 320 : 160,
        useNativeDriver: true,
      }),
    ]).start();

    if (next && !tafsirEntry && verses.length > 0) {
      const v = verses[currentIndex];
      const gen = ++tafsirGenRef.current;
      setTafsirLoading(true);
      const entry = await fetchTafsir(surahNumber, v.numberInSurah);
      setTafsirLoading(false);
      if (tafsirGenRef.current === gen) {
        setTafsirEntry(entry);
      }
    }
  // chevronAnim + reflectionBodyAnim are stable Animated.Value refs — omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reflectionOpen, tafsirEntry, verses, currentIndex, surahNumber]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    let hasCached = false;
    try {
      const [cached, bms, prog] = await Promise.all([
        getCachedSurah(surahNumber),
        loadBookmarksForSurah(surahNumber),
        loadReadingProgress(),
      ]);
      hasCached = !!cached;
      setBookmarkedSet(bms);
      if (prog && prog.surahNumber === surahNumber && prog.verseIndex >= 0) {
        setResumeIndex(prog.verseIndex);
      }
      if (cached) {
        setVerses(cached);
        setLoading(false);
      }
      if (!cached) {
        const fresh = await fetchAndCacheSurah(surahNumber);
        setVerses(fresh);
        setLoading(false);
      }
    } catch {
      if (!hasCached) setError('Could not load surah. Please check your connection.');
      setLoading(false);
    }
  };

  const handleResume = useCallback(() => {
    if (resumeIndex !== null) {
      if (viewMode === 'page') {
        // The target page may still be an un-converged seed grouping if it
        // hasn't been visited yet — this is a best-guess starting point, and
        // the chase effect above keeps following resumeIndex forward as
        // the breaks correct themselves until it actually lands there.
        resumeTargetRef.current = resumeIndex;
        setCurrentPageIndex(pageIndexForVerse(pageStarts, resumeIndex));
      } else {
        setCurrentIndex(resumeIndex);
      }
    }
    setResumeIndex(null);
  }, [resumeIndex, viewMode, pageStarts, pageIndexForVerse]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      HapticsService.impactAsync('LIGHT');
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (verses.length > 0 && currentIndex < verses.length - 1) {
      HapticsService.impactAsync('LIGHT');
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, verses.length]);

  const toggleBookmarkFor = useCallback(async (v: Verse) => {
    const wasBookmarked = bookmarkedSet.has(v.numberInSurah);
    HapticsService.impactAsync('LIGHT');
    setBookmarkedSet((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(v.numberInSurah);
      else next.add(v.numberInSurah);
      return next;
    });
    if (wasBookmarked) {
      await removeBookmark(surahNumber, v.numberInSurah);
    } else {
      await addBookmark(v, surahNumber, surahName);
    }
  }, [bookmarkedSet, surahNumber, surahName]);

  const handleBookmark = useCallback(() => {
    if (!verses.length) return;
    toggleBookmarkFor(verses[currentIndex]);
  }, [verses, currentIndex, toggleBookmarkFor]);

  const shareVerse = useCallback((v: Verse) => {
    setShareContent({
      text: v.translation,
      source: `Surah ${surahName} ${surahNumber}:${v.numberInSurah}`,
      arabicText: v.arabic,
      transliteration: '',
    });
    setShareVisible(true);
    HapticsService.impactAsync('LIGHT');
  }, [surahName, surahNumber]);

  const handleShare = useCallback(() => {
    if (!verses.length) return;
    shareVerse(verses[currentIndex]);
  }, [verses, currentIndex, shareVerse]);

  const verse = verses[currentIndex] ?? null;
  const isBookmarked = verse ? bookmarkedSet.has(verse.numberInSurah) : false;
  // At-Tawbah has no Bismillah; Al-Fatiha's ayah 1 *is* the Bismillah (its
  // own text already renders it), so a separate header would duplicate it.
  const showBismillah = surahNumber !== 9 && surahNumber !== 1 && currentIndex === 0;
  const audioKey = verse ? `${surahNumber}:${verse.numberInSurah}` : undefined;
  const atStart = currentIndex === 0;
  const atEnd = !verses.length || currentIndex >= verses.length - 1;

  const chevronDeg = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.celestialWash}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.md, opacity: headerFade },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke={GOLD}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerArabic}>{surahArabic}</Text>
          <Text style={styles.headerSub}>
            {surahName.toUpperCase()} · {verseCount} VERSES
          </Text>
        </View>

        {/* The page-translation toggle lives in the bottom bar, not here —
            it belongs beside the page nav and the recitation control it works
            with, and the header stays down to back / title / options. */}
        <TouchableOpacity
          onPress={() => setSettingsVisible(true)}
          style={styles.iconButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Reading view options"
        >
          <Ionicons name="options-outline" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Resume banner ──────────────────────────────────────────── */}
      {resumeIndex !== null && verses.length > resumeIndex && (
        <View style={styles.resumeBanner}>
          <MaterialCommunityIcons name="bookmark-check" size={16} color={GOLD} />
          <Text style={styles.resumeText}>
            Continue from verse {verses[resumeIndex]?.numberInSurah}
          </Text>
          <View style={styles.resumeActions}>
            <TouchableOpacity
              onPress={handleResume}
              style={styles.resumeBtn}
              accessibilityRole="button"
              accessibilityLabel="Jump to your last read verse"
            >
              <Text style={styles.resumeBtnText}>Jump there</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setResumeIndex(null)}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Dismiss resume banner"
            >
              <MaterialCommunityIcons
                name="close"
                size={14}
                color="rgba(212,175,55,0.45)"
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Loading ────────────────────────────────────────────────── */}
      {loading && (
        <View style={styles.centeredFlex}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingText}>Loading surah…</Text>
        </View>
      )}

      {/* ── Error ─────────────────────────────────────────────────── */}
      {!loading && !!error && (
        <View style={styles.centeredFlex}>
          <MaterialCommunityIcons
            name="wifi-off"
            size={52}
            color="rgba(212,175,55,0.25)"
          />
          <Text style={styles.errorTitle}>No Connection</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={loadAll}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Verse + Reflection (single-verse mode) ──────────────────── */}
      {viewMode === 'single' && !loading && !error && !!verse && (
        <Animated.ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 180 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Verse card ── */}
          <Animated.View
            style={[
              styles.card,
              { opacity: cardOpacity, transform: [{ translateY: cardSlide }] },
            ]}
          >
            <LinearGradient colors={[Colors.background.secondary, Colors.background.primary]} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={[`${GOLD}1F`, `${GOLD}05`]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              pointerEvents="none"
            />
            <CornerFrame color={GOLD} size={18} thickness={1.5} offset={12} />

            {/* Reference */}
            <View style={styles.refRow}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={9}
                color={GOLD}
                style={{ opacity: 0.65 }}
              />
              <Text style={styles.refText}>
                {surahName} · {surahNumber}:{verse.numberInSurah}
              </Text>
              <MaterialCommunityIcons
                name="star-four-points"
                size={9}
                color={GOLD}
                style={{ opacity: 0.65 }}
              />
            </View>

            {/* Bismillah for first verse */}
            {showBismillah && (
              <View style={styles.bismillahRow}>
                <Text style={styles.bismillahText}>
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </Text>
              </View>
            )}

            {/* Arabic */}
            <ArabicText text={verse.arabic} style={styles.arabic} />

            {/* Transliteration */}
            {showTranslit && verse.transliteration ? (
              <Text style={styles.translitText}>{verse.transliteration}</Text>
            ) : null}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDot} />
              <View style={styles.dividerLine} />
            </View>

            {/* Translation */}
            <Text style={styles.translation}>
              &quot;{verse.translation}&quot;
            </Text>
          </Animated.View>

          {/* ── Reflection accordion ── */}
          <View style={styles.reflectionWrap}>
            <TouchableOpacity
              style={styles.reflectionHeader}
              onPress={toggleReflection}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Context"
              accessibilityState={{ expanded: reflectionOpen }}
            >
              <View style={styles.reflectionHeaderLeft}>
                <Ionicons name="book-outline" size={16} color={GOLD} />
                <Text style={styles.reflectionLabel}>Context</Text>
              </View>
              <Animated.View style={{ transform: [{ rotate: chevronDeg }] }}>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color="rgba(212,175,55,0.55)"
                />
              </Animated.View>
            </TouchableOpacity>

            {reflectionOpen && (
              <Animated.View
                style={[styles.reflectionBody, { opacity: reflectionBodyAnim }]}
              >
                {tafsirLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={GOLD}
                    style={styles.tafsirSpinner}
                  />
                ) : tafsirEntry ? (
                  <>
                    <Text style={styles.reflectionText}>{isolateBidiRuns(tafsirEntry.text)}</Text>
                    <View style={styles.reflectionSourceRow}>
                      <Text style={styles.reflectionSource}>{tafsirEntry.source}</Text>
                    </View>
                  </>
                ) : (
                  // No commentary for this specific verse — most often because
                  // a shared tafsir block's sentences were fully claimed by
                  // its neighbors. The translation is already shown above, so
                  // this doesn't repeat it as filler.
                  <Text style={styles.reflectionEmpty}>No additional commentary for this verse.</Text>
                )}
              </Animated.View>
            )}
          </View>
        </Animated.ScrollView>
      )}

      {/* ── Mushaf leaf (page mode) ────────────────────── */}
      {/* The leaf FILLS the space between the header and the bottom bar
          rather than sitting in it as a card. That is the whole difference
          between "a page of a book" and "a card floating in a void": a real
          Mushaf page has no margin of nothing beneath it. flex:1 here, and
          flex:1 again on the text viewport inside, is what guarantees the
          frame reaches the bottom bar no matter how few ayahs the page holds
          — and it is also what gives handleLeafViewportLayout a stable,
          content-independent height to paginate against. */}
      {viewMode === 'page' && !loading && !error && pageStarts.length > 0 && (
        <Animated.View
          style={[
            styles.leaf,
            { marginBottom: insets.bottom + PAGE_BOTTOM_BAR_HEIGHT },
            // Only while a turn is running. A settled leaf gets none of it.
            turning ? leafTurnStyle : null,
          ]}
        >
          {/* Second rule of the classic Mushaf double frame. */}
          <View style={styles.leafRule} pointerEvents="none" />

          {currentPageIndex === 0 && (
            <View style={styles.leafHead} onLayout={handleBannerBlockLayout}>
              <View style={styles.surahBanner}>
                <View style={styles.bannerRule} />
                <Text style={styles.surahBannerText}>{surahArabic}</Text>
                <View style={styles.bannerRule} />
              </View>
              {surahNumber !== 9 && surahNumber !== 1 && (
                <Text style={styles.leafBismillah}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
              )}
            </View>
          )}

          {/* Scrollable purely as a transient guard. Word-level breaking can
              always cut a page down to fit — even a lone ayah longer than the
              screen, which the old verse-level model had no way to split — so
              a settled page never scrolls. This only absorbs the frame or two
              between a page first rendering and its break being corrected,
              which would otherwise show as clipped text. */}
          <ScrollView
            style={styles.leafTextViewport}
            contentContainerStyle={styles.leafTextContent}
            showsVerticalScrollIndicator={false}
            onLayout={(ev) => handleLeafViewportLayout(currentPageIndex, ev)}
          >
            {/* One continuous justified block, not per-verse cards. Each run is
                a tappable slice of ONE verse; only a run that reaches its
                verse's final word gets an ayah marker, so a verse continued
                onto the next page closes the leaf markerless — the way a
                printed Mushaf sets it. */}
            <Text
              style={styles.leafArabic}
              onTextLayout={(ev) => handleLeafTextLayout(currentPageIndex, ev)}
            >
              {pageRuns.map((run, runIdx) => {
                const v = verses[run.verseIdx];
                if (!v) return null;
                const isSelected = selectedVerseIndex === run.verseIdx;
                const isReciting = recitingVerseIndex === run.verseIdx;
                // Marked by COLOUR, never a background box. A backgroundColor
                // on a nested Text run is painted per line-fragment, so on a
                // justified RTL block it renders as ragged slabs straddling
                // the line boxes (it shipped that way once). Colour shifts the
                // glyphs themselves and stays invisible to layout.
                const runStyle = isReciting
                  ? styles.leafVerseReciting
                  : isSelected
                    ? styles.leafVerseSelected
                    : undefined;
                return (
                  <Text key={`${run.verseIdx}-${runIdx}`}>
                    <Text onPress={() => handleVersePress(run.verseIdx)} style={runStyle}>
                      {run.text}
                    </Text>
                    {/* No marker when the verse continues onto the next page —
                        the number belongs at the ayah's real end, not at a
                        page break. */}
                    {run.endsVerse ? (
                      <Text
                        onPress={() => handleVersePress(run.verseIdx)}
                        style={styles.leafAyahMarker}
                      >
                        {` ﴿${toArabicIndicNumeral(v.numberInSurah)}﴾ `}
                      </Text>
                    ) : null}
                  </Text>
                );
              })}
            </Text>
          </ScrollView>

          {/* Folio number, in Arabic-Indic numerals like the printed page.
              The Latin "Page 9 / 22" in the bottom bar is the navigational
              readout; this one belongs to the book. */}
          <View style={styles.leafFooter}>
            <View style={styles.footerRule} />
            <Text style={styles.leafFolio}>{toArabicIndicNumeral(currentPageIndex + 1)}</Text>
            <View style={styles.footerRule} />
          </View>
        </Animated.View>
      )}
      {/* ── Fixed bottom: action pill + navigation ─────────────────── */}
      {viewMode === 'single' && !loading && !error && !!verse && (
        <View style={[styles.bottomArea, { paddingBottom: insets.bottom + Spacing.md }]}>

          {/* Save · Share · Audio */}
          <View style={styles.pill}>
            {/* androidFill is transparent on purpose: pillBacking, the very
                next child, is an absolute-fill at rgba(8,14,23,0.88), so the
                surface is already ~88% opaque and any fill here would just
                stack underneath something opaque. (That backing also means
                the iOS blur was never really visible either.) */}
            <FrostedSurface intensity={80} androidFill="transparent" style={styles.pillInner}>
              {/* Solid backing on top of the blur — on some devices blur alone
                  still lets scrolling text underneath show through and clash
                  with the icons, so this guarantees a clean, legible surface. */}
              <View style={styles.pillBacking} />

              {/* Save */}
              <TouchableOpacity
                onPress={handleBookmark}
                style={styles.pillBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Save verse'}
                accessibilityState={{ selected: isBookmarked }}
              >
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={isBookmarked ? GOLD : `${Colors.text.primary}B3`}
                />
              </TouchableOpacity>

              <View style={styles.pillSep} />

              {/* Share */}
              <TouchableOpacity
                onPress={handleShare}
                style={styles.pillBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Share verse"
              >
                <Ionicons name="share-outline" size={22} color={`${Colors.text.primary}B3`} />
              </TouchableOpacity>

              <View style={styles.pillSep} />

              {/* Audio */}
              {audioKey ? (
                <View style={styles.pillBtn}>
                  <AudioPlayerButton
                    verseKey={audioKey}
                    size={34}
                    iconSize={22}
                    color={`${Colors.text.primary}B3`}
                    showLabel={false}
                    containerStyle={styles.audioCtr}
                    style={styles.audioWrap}
                  />
                </View>
              ) : null}

            </FrostedSurface>
          </View>

          {/* ← verse counter → */}
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={handlePrev}
              disabled={atStart}
              style={[styles.navBtn, atStart && styles.navBtnOff]}
              hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
              accessibilityRole="button"
              accessibilityLabel="Previous verse"
              accessibilityState={{ disabled: atStart }}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={atStart ? 'rgba(212,175,55,0.25)' : GOLD}
              />
            </TouchableOpacity>

            <Text style={styles.navCounter}>
              {verse.numberInSurah} / {verseCount}
            </Text>

            <TouchableOpacity
              onPress={handleNext}
              disabled={atEnd}
              style={[styles.navBtn, atEnd && styles.navBtnOff]}
              hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
              accessibilityRole="button"
              accessibilityLabel="Next verse"
              accessibilityState={{ disabled: atEnd }}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={atEnd ? 'rgba(212,175,55,0.25)' : GOLD}
              />
            </TouchableOpacity>
          </View>

        </View>
      )}

      {/* ── Mushaf page mode: footnote drawer + page nav ─────────────── */}
      {viewMode === 'page' && !loading && !error && pageStarts.length > 0 && (
        <View style={[styles.bottomArea, { paddingBottom: insets.bottom + Spacing.md }]}>
          {drawerVisible && selectedVerseIndex !== null && verses[selectedVerseIndex] && (
            <Animated.View
              style={[
                styles.drawer,
                // The height cap lives on the ScrollView inside (see
                // panelScrollMaxHeight), not here. A cap on this box is what a
                // long Ibn Kathir tafsir needs to stop it covering the header,
                // but capping the CONTAINER only clips — the ScrollView never
                // learns it is bounded, so it does not scroll. Capping the
                // scroll area itself bounds the panel and makes the overflow
                // reachable, and one cap cannot fight the other.
                {
                  opacity: drawerAnim,
                  transform: [{
                    translateY: drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
                  }],
                },
              ]}
            >
              <FrostedSurface intensity={70} androidFill="transparent" style={styles.drawerInner}>
                <View style={styles.drawerBacking} />
                <View style={styles.drawerHandle} />

                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerRef}>
                    {surahName} · {surahNumber}:{verses[selectedVerseIndex].numberInSurah}
                  </Text>
                  <View style={styles.drawerHeaderActions}>
                    {/* Same global showTranslit the reading-options modal owns —
                        surfaced here because this panel is where transliteration
                        actually renders, and it was otherwise buried a modal deep. */}
                    <TouchableOpacity
                      onPress={toggleTranslit}
                      style={[styles.translitChip, showTranslit && styles.translitChipOn]}
                      hitSlop={HIT_SLOP}
                      accessibilityRole="button"
                      accessibilityLabel="Show transliteration"
                      accessibilityState={{ selected: showTranslit }}
                    >
                      <Text style={[styles.translitChipText, showTranslit && styles.translitChipTextOn]}>
                        Aa
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={closeDrawer}
                      hitSlop={HIT_SLOP}
                      accessibilityRole="button"
                      accessibilityLabel="Close"
                    >
                      <Ionicons name="close" size={18} color={`${Colors.text.primary}80`} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  ref={drawerScrollRef}
                  style={[
                    styles.drawerScroll,
                    { maxHeight: panelScrollMaxHeight(DRAWER_MAX_HEIGHT_RATIO) },
                  ]}
                  contentContainerStyle={styles.drawerScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {showTranslit && verses[selectedVerseIndex].transliteration ? (
                    <Text style={styles.drawerTranslit}>{verses[selectedVerseIndex].transliteration}</Text>
                  ) : null}

                  <Text style={styles.drawerTranslation}>
                    &quot;{verses[selectedVerseIndex].translation}&quot;
                  </Text>

                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      onPress={() => toggleBookmarkFor(verses[selectedVerseIndex])}
                      hitSlop={HIT_SLOP}
                      accessibilityRole="button"
                      accessibilityLabel={bookmarkedSet.has(verses[selectedVerseIndex].numberInSurah) ? 'Remove bookmark' : 'Save verse'}
                      accessibilityState={{ selected: bookmarkedSet.has(verses[selectedVerseIndex].numberInSurah) }}
                    >
                      <Ionicons
                        name={bookmarkedSet.has(verses[selectedVerseIndex].numberInSurah) ? 'bookmark' : 'bookmark-outline'}
                        size={18}
                        color={bookmarkedSet.has(verses[selectedVerseIndex].numberInSurah) ? GOLD : `${Colors.text.primary}80`}
                      />
                    </TouchableOpacity>

                    {drawerAudioActive ? (
                      <AudioPlayerButton
                        verseKey={`${surahNumber}:${verses[selectedVerseIndex].numberInSurah}`}
                        size={26}
                        iconSize={16}
                        autoPlay
                        color={`${Colors.text.primary}80`}
                        showLabel={false}
                        containerStyle={styles.rowAudioCtr}
                        style={styles.rowAudioWrap}
                      />
                    ) : (
                      <TouchableOpacity
                        onPress={() => setDrawerAudioActive(true)}
                        hitSlop={HIT_SLOP}
                        accessibilityRole="button"
                        accessibilityLabel="Play recitation"
                      >
                        <Ionicons name="volume-medium-outline" size={18} color={`${Colors.text.primary}80`} />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => shareVerse(verses[selectedVerseIndex])}
                      hitSlop={HIT_SLOP}
                      accessibilityRole="button"
                      accessibilityLabel="Share verse"
                    >
                      <Ionicons name="share-outline" size={18} color={`${Colors.text.primary}80`} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={toggleDrawerContext}
                      style={styles.rowContextToggle}
                      hitSlop={HIT_SLOP}
                      accessibilityRole="button"
                      accessibilityLabel="Context"
                      accessibilityState={{ expanded: drawerContextOpen }}
                    >
                      <Text style={styles.rowContextLabel}>Context</Text>
                      <Ionicons
                        name={drawerContextOpen ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color="rgba(212,175,55,0.55)"
                      />
                    </TouchableOpacity>
                  </View>

                  {drawerContextOpen && (
                    <View style={styles.rowContextBody}>
                      {drawerTafsirLoading ? (
                        <ActivityIndicator size="small" color={GOLD} />
                      ) : drawerTafsir ? (
                        <>
                          <Text style={styles.rowContextText}>{isolateBidiRuns(drawerTafsir.text)}</Text>
                          <Text style={styles.rowContextSource}>{drawerTafsir.source}</Text>
                        </>
                      ) : (
                        <Text style={styles.rowContextEmpty}>No additional commentary for this verse.</Text>
                      )}
                    </View>
                  )}
                </ScrollView>
              </FrostedSurface>
            </Animated.View>
          )}

          {pageTranslationVisible && (
            <Animated.View
              style={[
                styles.drawer,
                // Capped on its ScrollView, same as the drawer above.
                {
                  opacity: pageTranslationAnim,
                  transform: [{
                    translateY: pageTranslationAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
                  }],
                },
              ]}
            >
              <FrostedSurface intensity={70} androidFill="transparent" style={styles.drawerInner}>
                <View style={styles.drawerBacking} />
                <View style={styles.drawerHandle} />

                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerRef}>
                    {surahName} · Page {currentPageIndex + 1}
                  </Text>
                  <View style={styles.drawerHeaderActions}>
                    <TouchableOpacity
                      onPress={toggleTranslit}
                      style={[styles.translitChip, showTranslit && styles.translitChipOn]}
                      hitSlop={HIT_SLOP}
                      accessibilityRole="button"
                      accessibilityLabel="Show transliteration"
                      accessibilityState={{ selected: showTranslit }}
                    >
                      <Text style={[styles.translitChipText, showTranslit && styles.translitChipTextOn]}>
                        Aa
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={closePageTranslation}
                      hitSlop={HIT_SLOP}
                      accessibilityRole="button"
                      accessibilityLabel="Close"
                    >
                      <Ionicons name="close" size={18} color={`${Colors.text.primary}80`} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  style={[
                    styles.drawerScroll,
                    { maxHeight: panelScrollMaxHeight(PAGE_TRANSLATION_MAX_HEIGHT_RATIO) },
                  ]}
                  contentContainerStyle={styles.pageTranslationList}
                  showsVerticalScrollIndicator={false}
                >
                  {pageVerseIndices.map((idx) => {
                    const v = verses[idx];
                    if (!v) return null;
                    return (
                      <View key={v.numberInSurah} style={styles.pageTranslationRow}>
                        <Text style={styles.pageTranslationRef}>{surahNumber}:{v.numberInSurah}</Text>
                        {showTranslit && v.transliteration ? (
                          <Text style={styles.drawerTranslit}>{v.transliteration}</Text>
                        ) : null}
                        <Text style={styles.drawerTranslation}>&quot;{v.translation}&quot;</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </FrostedSurface>
            </Animated.View>
          )}

          {/* Bottom bar: recitation · page nav · translation. Three zones, no
              chrome — the sides are fixed-width so the page readout stays
              optically centred whatever the side controls are doing. */}
          <View style={styles.pageBar}>
            {/* Unmounted while the per-verse drawer's own player is active.
                Each AudioPlayerButton owns a private player that a parent
                cannot pause, so leaving both mounted lets page recitation and
                a single-ayah replay talk over each other. Unmounting releases
                this one's player, which is the only way to stop it from here —
                and the user pressing play in the drawer is an unambiguous
                request for that ayah instead of the page. */}
            <View style={styles.pageBarSide}>
              {pageAudioKey && !drawerAudioActive && isFocused ? (
                <AudioPlayerButton
                  verseKey={pageAudioKey}
                  size={34}
                  iconSize={19}
                  color={GOLD}
                  showLabel={false}
                  containerStyle={styles.pageBarAudioCtr}
                  style={styles.pageBarAudioWrap}
                  onPlayingChange={setPageAudioPlaying}
                  onRangeIndexChange={setPageAudioRangeIndex}
                />
              ) : null}
            </View>

            {/* RTL page turn. A mushaf is bound on the right and the text
                advances leftward, so the arrows are mirrored from the Latin
                convention: the LEFT chevron goes forward to the next page and
                the RIGHT chevron goes back. Reading direction, not screen
                direction, decides which way a leaf turns — matching what the
                hand does with a physical mushaf. The handlers themselves are
                unchanged; only which side each one sits on. */}
            <View style={styles.pageBarNav}>
              <TouchableOpacity
                onPress={handleNextPage}
                disabled={currentPageIndex >= pageStarts.length - 1}
                style={[styles.navBtn, currentPageIndex >= pageStarts.length - 1 && styles.navBtnOff]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Next page"
                accessibilityState={{ disabled: currentPageIndex >= pageStarts.length - 1 }}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={currentPageIndex >= pageStarts.length - 1 ? 'rgba(212,175,55,0.25)' : GOLD}
                />
              </TouchableOpacity>

              <Text style={styles.navCounter}>
                Page {currentPageIndex + 1} / {pageStarts.length}
              </Text>

              <TouchableOpacity
                onPress={handlePrevPage}
                disabled={currentPageIndex === 0}
                style={[styles.navBtn, currentPageIndex === 0 && styles.navBtnOff]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Previous page"
                accessibilityState={{ disabled: currentPageIndex === 0 }}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={currentPageIndex === 0 ? 'rgba(212,175,55,0.25)' : GOLD}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.pageBarSide}>
              <TouchableOpacity
                onPress={togglePageTranslation}
                style={styles.pageBarIconBtn}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Page translation"
                accessibilityState={{ selected: pageTranslationVisible }}
              >
                <Ionicons
                  name={pageTranslationVisible ? 'language' : 'language-outline'}
                  size={21}
                  color={pageTranslationVisible ? GOLD : `${Colors.text.primary}8C`}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ShareSheet
        isVisible={shareVisible}
        onClose={() => setShareVisible(false)}
        isPremium={isPremium}
        onUpgrade={() => {
          FreemiumService.getInstance().recordUpgradeAsk('theme_pick');
          navigation.navigate('Support');
        }}
        content={{
          text: shareContent.text,
          source: shareContent.source,
          arabicText: shareContent.arabicText,
          transliteration: shareContent.transliteration,
        }}
      />

      <ReadingViewModal
        isVisible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        showTranslit={showTranslit}
        onToggleTranslit={toggleTranslit}
        showTranslation={pageTranslationVisible}
        onToggleTranslation={viewMode === 'page' ? togglePageTranslation : undefined}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    zIndex: 2,
    gap: Spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerArabic: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 17,
    color: '#EDD9A3',
    letterSpacing: 0.5,
    // Generous line height so multi-word names (e.g. "آل عمران") wrapping to
    // a second line never get clipped, and harakat aren't cut at the edges.
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 1,
  },
  headerSub: {
    fontSize: Typography.sizes.label,
    fontWeight: '700',
    color: Colors.text.muted,
    letterSpacing: 1.2,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Resume banner ──
  resumeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.22)',
    gap: Spacing.sm,
  },
  resumeText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(212,175,55,0.85)',
    fontWeight: '500',
  },
  resumeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  resumeBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    backgroundColor: 'rgba(212,175,55,0.18)',
    borderRadius: BorderRadius.sm,
  },
  resumeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.3,
  },

  // ── Loading / error ──
  centeredFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text.muted,
    fontStyle: 'italic',
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.serif,
    fontWeight: '700',
    color: 'rgba(240,230,211,0.6)',
  },
  errorSub: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.xxl,
  },
  retryBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.5,
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },

  // ── Verse card ──
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },

  // Reference row
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  refText: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD,
    letterSpacing: 1.8,
    opacity: 0.9,
  },

  // Bismillah
  bismillahRow: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  bismillahText: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 20,
    // Muted vs. the main ayah below, but kept high enough that the gold
    // doesn't read as washed-out grey against the dark background —
    // opacity 0.6 was doing that.
    color: 'rgba(237,217,163,0.85)',
    textAlign: 'center',
    // lineHeight ≥ ~2.1x font size — Amiri-Quran's harakat sit far above/below
    // the baseline; a tighter line box clips them at the bottom (matches the
    // rule already followed by the main `.arabic` style below).
    lineHeight: 46,
  },

  // Arabic
  arabic: {
    fontSize: 26,
    lineHeight: 54,
    color: '#EDD9A3',
    textAlign: 'center',
  },

  // Transliteration
  translitText: {
    fontFamily: Typography.fonts.serif,
    fontSize: 14,
    lineHeight: 22,
    color: `${Colors.text.primary}80`,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.xl,
    width: '55%',
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${Colors.text.primary}1F`,
  },
  dividerDot: {
    width: 5,
    height: 5,
    borderRadius: 1,
    backgroundColor: 'rgba(212,175,55,0.5)',
    transform: [{ rotate: '45deg' }],
  },

  // Translation
  translation: {
    fontFamily: Typography.fonts.serif,
    fontSize: 16,
    lineHeight: 28,
    color: `${Colors.text.primary}B8`,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: Spacing.sm,
  },

  // ── Reflection accordion ──
  reflectionWrap: {
    backgroundColor: Colors.background.secondary + '99',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    overflow: 'hidden',
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  reflectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reflectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  reflectionBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  reflectionText: {
    fontFamily: Typography.fonts.serif,
    fontSize: 15,
    lineHeight: 26,
    color: Colors.text.secondary,
  },
  reflectionEmpty: {
    fontFamily: Typography.fonts.serif,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 26,
    color: Colors.text.muted,
  },
  tafsirSpinner: {
    marginVertical: Spacing.lg,
  },
  reflectionSourceRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.glass.border,
    alignItems: 'flex-end',
  },
  reflectionSource: {
    fontSize: Typography.sizes.detail,
    color: GOLD,
    opacity: 0.75,
    letterSpacing: 0.4,
  },

  // ── Fixed bottom ──
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },

  // Action pill
  pill: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  pillBacking: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,14,23,0.88)',
  },
  pillBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  pillSep: {
    width: StyleSheet.hairlineWidth,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: Spacing.xs,
  },
  audioCtr: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  audioWrap: {
    marginVertical: 0,
  },

  // Navigation row
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxl,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnOff: {
    opacity: 0.35,
  },
  navCounter: {
    fontSize: 13,
    color: `${Colors.text.primary}73`,
    fontWeight: '600',
    letterSpacing: 1,
    minWidth: 70,
    textAlign: 'center',
  },

  // ── Mushaf leaf ──
  // The page itself. flex:1 (not a height, not a card in a ScrollView) is
  // the load-bearing part: it makes the frame reach the bottom bar on every
  // page, including a last page holding two ayahs, and gives the text
  // viewport inside it a content-independent height to paginate against.
  leaf: {
    flex: 1,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.30)',
    backgroundColor: 'rgba(12,26,46,0.5)',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    overflow: 'hidden',
  },
  // Second rule of the classic Mushaf double frame. A hairline inset a few
  // px from the border reads as printed ruling; anything heavier reads as a
  // UI card, which is what the previous version looked like.
  leafRule: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,175,55,0.16)',
    borderRadius: BorderRadius.sm,
  },

  // Chapter opening, page 1 only. Rules flanking the name instead of a
  // filled box — a printed Mushaf sets the surah name in an illuminated
  // band, and a solid gold-tinted rectangle was the least book-like way to
  // suggest one.
  leafHead: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  surahBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  bannerRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(212,175,55,0.35)',
  },
  surahBannerText: {
    fontFamily: Typography.fonts.arabic,
    fontSize: Typography.sizes.h1,
    // Amiri-Quran hangs harakat well above and below the baseline; a line
    // box under ~2x the font size clips them (same rule the Bismillah and
    // the main ayah styles follow).
    lineHeight: 50,
    color: GOLD,
    textAlign: 'center',
  },
  leafBismillah: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 19,
    lineHeight: 42,
    color: 'rgba(237,217,163,0.82)',
    textAlign: 'center',
  },

  // The measured region. Its height is what linesForHeight() converts into
  // this layout's line ceiling, so it must stay driven by flex, never by
  // its own content.
  leafTextViewport: {
    flex: 1,
  },
  leafTextContent: {
    flexGrow: 1,
  },
  leafArabic: {
    fontFamily: Typography.fonts.arabic,
    fontSize: MUSHAF_ARABIC_FONT_SIZE,
    lineHeight: MUSHAF_ARABIC_LINE_HEIGHT,
    color: '#E8D5A8',
    textAlign: 'justify',
    writingDirection: 'rtl',
  },
  // Selection and recitation are marked by COLOUR only — no background box.
  // A backgroundColor on a nested Text run is painted per line-fragment, so
  // on a justified RTL block it renders as ragged slabs straddling the line
  // boxes; that is exactly what shipped and what looked broken on Android.
  leafVerseSelected: {
    color: '#FFF3D2',
  },
  leafVerseReciting: {
    color: Colors.accent.light,
  },
  leafAyahMarker: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 16,
    color: GOLD,
    opacity: 0.9,
  },

  // Folio number — hairline, numeral, hairline.
  leafFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  footerRule: {
    width: 26,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(212,175,55,0.30)',
  },
  leafFolio: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 14,
    lineHeight: 28,
    color: GOLD,
    opacity: 0.75,
  },

  // ── Page bottom bar: recitation · page nav · translation ──
  pageBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Fixed-width sides keep the page readout optically centred regardless of
  // what the side controls render (the audio button swaps between an icon
  // and three wave bars).
  pageBarSide: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBarNav: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  pageBarIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Strips AudioPlayerButton's own circle so it reads as a bare icon beside
  // the bare chevrons, per CLAUDE.md's no-circles-on-nav-icons rule.
  pageBarAudioCtr: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  pageBarAudioWrap: {
    marginVertical: 0,
  },
  // Footnote drawer — tap-to-reveal companion panel, same frosted-pill
  // language as the single-mode action pill below.
  drawer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    marginBottom: Spacing.md,
  },
  drawerInner: {
    // Deliberately NOT flex:1 — see PANEL_CHROME_HEIGHT. This box sizes to its
    // own content; the ScrollView inside it carries the height cap.
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  drawerBacking: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,14,23,0.92)',
  },
  drawerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(212,175,55,0.3)',
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  // "Aa" transliteration toggle. A chip rather than a bare icon because it is
  // a persistent on/off state, not an action — the filled state has to be
  // readable at a glance from across the panel header.
  translitChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,235,210,0.16)',
  },
  translitChipOn: {
    borderColor: 'rgba(212,175,55,0.5)',
    backgroundColor: 'rgba(212,175,55,0.14)',
  },
  translitChipText: {
    fontFamily: Typography.fonts.serif,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: `${Colors.text.primary}80`,
  },
  translitChipTextOn: {
    color: GOLD,
  },
  // The scrollable region of a panel — everything except the fixed
  // handle/header above it. It carries the height cap itself (applied inline,
  // since it depends on the window), which is what makes short content size
  // naturally and long content scroll instead of being clipped.
  drawerScroll: {},
  drawerScrollContent: {
    gap: Spacing.sm,
  },
  // Whole-page translation panel — one row per verse on the current page.
  pageTranslationList: {
    gap: Spacing.lg,
  },
  pageTranslationRow: {
    gap: Spacing.xs,
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  pageTranslationRef: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1,
    opacity: 0.8,
  },
  drawerRef: {
    fontSize: 12,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1.2,
    opacity: 0.9,
  },
  drawerTranslit: {
    fontFamily: Typography.fonts.serif,
    fontSize: 13,
    lineHeight: 20,
    color: `${Colors.text.primary}73`,
    fontStyle: 'italic',
  },
  drawerTranslation: {
    fontFamily: Typography.fonts.serif,
    fontSize: 15,
    lineHeight: 24,
    color: `${Colors.text.primary}D0`,
    fontStyle: 'italic',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  rowAudioCtr: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  rowAudioWrap: {
    marginVertical: 0,
  },
  rowContextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowContextLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(212,175,55,0.75)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  rowContextBody: {
    alignSelf: 'stretch',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  rowContextText: {
    fontFamily: Typography.fonts.serif,
    fontSize: 14,
    lineHeight: 24,
    color: Colors.text.secondary,
  },
  rowContextEmpty: {
    fontFamily: Typography.fonts.serif,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 24,
    color: Colors.text.muted,
  },
  rowContextSource: {
    fontSize: Typography.sizes.detail,
    color: GOLD,
    opacity: 0.75,
    letterSpacing: 0.4,
    marginTop: Spacing.sm,
    textAlign: 'right',
  },
});
