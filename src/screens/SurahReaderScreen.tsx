/**
 * SurahReaderScreen — Immersive one-verse-at-a-time Quran reader.
 *
 * Layout: header + resume banner → scrollable verse card (CornerFrame,
 * Arabic, divider, translation) + Context accordion →
 * fixed bottom pill (Save · Share · Audio) + prev/next navigation.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Typography, Animations } from '../theme/DesignSystem';
import { dbQuery } from '../database/schema';
import {
  getCachedSurah,
  fetchAndCacheSurah,
  QuranVerse,
} from '../services/quranService';
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

// ─── types ────────────────────────────────────────────────────────────────────

type Verse = QuranVerse;

export interface ReadingProgress {
  surahNumber: number;
  verseIndex: number;
  surahName: string;
  timestamp: number;
}

// ─── constants ────────────────────────────────────────────────────────────────

const PROGRESS_KEY = 'quran_reading_progress';
const GOLD = Colors.accent.primary;
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type ViewMode = 'single' | 'page';

interface TafsirEntry {
  text: string;
  source: string;
}

// Module-level tafsir cache — null = "fetched but no clean content" (sentinel to
// prevent repeated network calls for dense-isnad verses).
const tafsirCache = new Map<string, TafsirEntry | null>();

// ─── DB helpers ───────────────────────────────────────────────────────────────

export async function loadReadingProgress(): Promise<ReadingProgress | null> {
  return dbQuery(async (db) => {
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM kv_store WHERE key = ?',
      [PROGRESS_KEY],
    );
    if (!row) return null;
    try { return JSON.parse(row.value) as ReadingProgress; } catch { return null; }
  });
}

async function saveProgress(progress: ReadingProgress): Promise<void> {
  await dbQuery(async (db) => {
    await db.runAsync(
      'INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)',
      [PROGRESS_KEY, JSON.stringify(progress)],
    );
  });
}

async function loadBookmarksForSurah(surahNumber: number): Promise<Set<number>> {
  return dbQuery(async (db) => {
    const rows = await db.getAllAsync<{ verseNumber: number }>(
      'SELECT verseNumber FROM bookmarked_verses WHERE surahNumber = ?',
      [surahNumber],
    );
    return new Set(rows.map((r) => r.verseNumber));
  });
}

async function addBookmark(
  verse: Verse,
  surahNumber: number,
  surahName: string,
): Promise<void> {
  await dbQuery(async (db) => {
    const id = `bv_${surahNumber}_${verse.numberInSurah}_${Date.now()}`;
    await db.runAsync(
      `INSERT OR IGNORE INTO bookmarked_verses
        (id, surahNumber, verseNumber, arabicText, translation, surahName, bookmarkedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, surahNumber, verse.numberInSurah, verse.arabic, verse.translation, surahName, Date.now()],
    );
  });
}

async function removeBookmark(surahNumber: number, verseNumber: number): Promise<void> {
  await dbQuery(async (db) => {
    await db.runAsync(
      'DELETE FROM bookmarked_verses WHERE surahNumber = ? AND verseNumber = ?',
      [surahNumber, verseNumber],
    );
  });
}

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
    if (!text) { tafsirCache.set(key, null); return null; }
    const compact = compactTafsir(text);
    if (!compact) { tafsirCache.set(key, null); return null; }
    const entry: TafsirEntry = { text: compact, source: 'Ibn Kathir · quran.com' };
    tafsirCache.set(key, entry);
    return entry;
  } catch {
    return null;
  }
}

// ─── Whole-page row ─────────────────────────────────────────────────────────
// One verse's worth of the single-verse card, compacted for a scrolling list.
// Audio only mounts a real player once the user asks to hear it — mounting
// one per row up front would silently prefetch audio for every visible verse.

interface VerseRowProps {
  verse: Verse;
  surahNumber: number;
  surahName: string;
  isBookmarked: boolean;
  showTranslit: boolean;
  onToggleBookmark: (verse: Verse) => void;
  onShare: (verse: Verse) => void;
}

const VerseRow = React.memo(function VerseRow({
  verse, surahNumber, surahName, isBookmarked, showTranslit, onToggleBookmark, onShare,
}: VerseRowProps) {
  const [contextOpen, setContextOpen] = useState(false);
  const [tafsirEntry, setTafsirEntry] = useState<TafsirEntry | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [audioActive, setAudioActive] = useState(false);

  const toggleContext = useCallback(async () => {
    const next = !contextOpen;
    setContextOpen(next);
    HapticsService.impactAsync('LIGHT');
    if (next && !tafsirEntry) {
      setTafsirLoading(true);
      const entry = await fetchTafsir(surahNumber, verse.numberInSurah);
      setTafsirLoading(false);
      setTafsirEntry(entry);
    }
  }, [contextOpen, tafsirEntry, surahNumber, verse.numberInSurah]);

  const audioKey = `${surahNumber}:${verse.numberInSurah}`;

  return (
    <View style={styles.rowCard}>
      <LinearGradient colors={[Colors.background.secondary, Colors.background.primary]} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[`${GOLD}1F`, `${GOLD}05`]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      <Text style={styles.rowRef}>{surahName} · {surahNumber}:{verse.numberInSurah}</Text>

      <ArabicText text={verse.arabic} style={styles.rowArabic} />

      {showTranslit && verse.transliteration ? (
        <Text style={styles.rowTranslit}>{verse.transliteration}</Text>
      ) : null}

      <View style={styles.rowDivider}>
        <View style={styles.rowDividerLine} />
        <View style={styles.dividerDot} />
        <View style={styles.rowDividerLine} />
      </View>

      <Text style={styles.rowTranslation}>&quot;{verse.translation}&quot;</Text>

      <View style={styles.rowActions}>
        <TouchableOpacity
          onPress={() => onToggleBookmark(verse)}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Save verse'}
          accessibilityState={{ selected: isBookmarked }}
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={isBookmarked ? GOLD : `${Colors.text.primary}80`}
          />
        </TouchableOpacity>

        {audioActive ? (
          <AudioPlayerButton
            verseKey={audioKey}
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
            onPress={() => setAudioActive(true)}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="Play recitation"
          >
            <Ionicons name="volume-medium-outline" size={18} color={`${Colors.text.primary}80`} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => onShare(verse)}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel="Share verse"
        >
          <Ionicons name="share-outline" size={18} color={`${Colors.text.primary}80`} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleContext}
          style={styles.rowContextToggle}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel="Context"
          accessibilityState={{ expanded: contextOpen }}
        >
          <Text style={styles.rowContextLabel}>Context</Text>
          <Ionicons
            name={contextOpen ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="rgba(212,175,55,0.55)"
          />
        </TouchableOpacity>
      </View>

      {contextOpen && (
        <View style={styles.rowContextBody}>
          {tafsirLoading ? (
            <ActivityIndicator size="small" color={GOLD} />
          ) : tafsirEntry ? (
            <>
              <Text style={styles.rowContextText}>{isolateBidiRuns(tafsirEntry.text)}</Text>
              <Text style={styles.rowContextSource}>{tafsirEntry.source}</Text>
            </>
          ) : (
            <Text style={styles.rowContextText}>{verse.translation}</Text>
          )}
        </View>
      )}
    </View>
  );
});

// ─── SurahReaderScreen ────────────────────────────────────────────────────────

type Props = StackScreenProps<RootStackParamList, 'SurahReader'>;

export default function SurahReaderScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
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

  // Whole-page list
  const flatListRef = useRef<FlatList<Verse>>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      const idx = viewableItems[0]?.index;
      if (idx !== null && idx !== undefined) currentIndexRef.current = idx;
    },
  ).current;
  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      flatListRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: false,
      });
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
      }, 100);
    },
    [],
  );

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

  // Auto-save progress every 3 s
  useEffect(() => {
    if (verses.length === 0) return () => {};
    const timer = setInterval(() => {
      saveProgress({
        surahNumber,
        verseIndex: currentIndexRef.current,
        surahName,
        timestamp: Date.now(),
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(timer);
  }, [verses.length, surahNumber, surahName]);

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
        flatListRef.current?.scrollToIndex({ index: resumeIndex, animated: true });
      } else {
        setCurrentIndex(resumeIndex);
      }
    }
    setResumeIndex(null);
  }, [resumeIndex, viewMode]);

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
                  <Text style={styles.reflectionText}>{verse.translation}</Text>
                )}
              </Animated.View>
            )}
          </View>
        </Animated.ScrollView>
      )}

      {/* ── Whole-page mode ──────────────────────────────────────────── */}
      {viewMode === 'page' && !loading && !error && verses.length > 0 && (
        <FlatList
          ref={flatListRef}
          data={verses}
          keyExtractor={(v) => String(v.numberInSurah)}
          renderItem={({ item }) => (
            <VerseRow
              verse={item}
              surahNumber={surahNumber}
              surahName={surahName}
              isBookmarked={bookmarkedSet.has(item.numberInSurah)}
              showTranslit={showTranslit}
              onToggleBookmark={toggleBookmarkFor}
              onShare={shareVerse}
            />
          )}
          ListHeaderComponent={
            surahNumber !== 9 && surahNumber !== 1 ? (
              <View style={styles.bismillahRow}>
                <Text style={styles.bismillahText}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
              </View>
            ) : null
          }
          contentContainerStyle={[styles.pageListContent, { paddingBottom: insets.bottom + Spacing.xxl }]}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          initialNumToRender={8}
          windowSize={7}
        />
      )}

      {/* ── Fixed bottom: action pill + navigation ─────────────────── */}
      {viewMode === 'single' && !loading && !error && !!verse && (
        <View style={[styles.bottomArea, { paddingBottom: insets.bottom + Spacing.md }]}>

          {/* Save · Share · Audio */}
          <View style={styles.pill}>
            <BlurView intensity={80} tint="dark" style={styles.pillInner}>
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

            </BlurView>
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

  // ── Whole-page mode ──
  pageListContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  rowCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  rowRef: {
    fontSize: 11,
    fontWeight: '600',
    color: GOLD,
    letterSpacing: 1.4,
    opacity: 0.8,
    marginBottom: Spacing.lg,
  },
  rowArabic: {
    fontSize: 22,
    lineHeight: 46,
    color: '#EDD9A3',
    textAlign: 'center',
  },
  rowTranslit: {
    fontFamily: Typography.fonts.serif,
    fontSize: 12,
    lineHeight: 19,
    color: `${Colors.text.primary}73`,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  rowDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    width: '60%',
  },
  rowDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${Colors.text.primary}1F`,
  },
  rowTranslation: {
    fontFamily: Typography.fonts.serif,
    fontSize: 14,
    lineHeight: 24,
    color: `${Colors.text.primary}B3`,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
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
  rowContextSource: {
    fontSize: Typography.sizes.detail,
    color: GOLD,
    opacity: 0.75,
    letterSpacing: 0.4,
    marginTop: Spacing.sm,
    textAlign: 'right',
  },
});
