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
  ActivityIndicator, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { HapticsService } from '../services/hapticsService';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

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
    if (resumeIndex !== null) setCurrentIndex(resumeIndex);
    setResumeIndex(null);
  }, [resumeIndex]);

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

  const handleBookmark = useCallback(async () => {
    if (!verses.length) return;
    const v = verses[currentIndex];
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
  }, [verses, currentIndex, bookmarkedSet, surahNumber, surahName]);

  const handleShare = useCallback(() => {
    if (!verses.length) return;
    const v = verses[currentIndex];
    setShareContent({
      text: v.translation,
      source: `Surah ${surahName} ${surahNumber}:${v.numberInSurah}`,
      arabicText: v.arabic,
      transliteration: '',
    });
    setShareVisible(true);
    HapticsService.impactAsync('LIGHT');
  }, [verses, currentIndex, surahName, surahNumber]);

  const verse = verses[currentIndex] ?? null;
  const isBookmarked = verse ? bookmarkedSet.has(verse.numberInSurah) : false;
  const showBismillah = surahNumber !== 9 && currentIndex === 0;
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
        colors={['#07111E', '#0C1A2E', '#0F1F30']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.lg, opacity: headerFade },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
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
          <Text style={styles.headerEnglish}>{surahName.toUpperCase()}</Text>
          <Text style={styles.headerSub}>{verseCount} verses</Text>
        </View>

        <Text style={styles.numBadgeText}>{surahNumber}</Text>
      </Animated.View>

      {/* ── Resume banner ──────────────────────────────────────────── */}
      {resumeIndex !== null && verses.length > resumeIndex && (
        <View style={styles.resumeBanner}>
          <MaterialCommunityIcons name="bookmark-check" size={16} color={GOLD} />
          <Text style={styles.resumeText}>
            Continue from verse {verses[resumeIndex]?.numberInSurah}
          </Text>
          <View style={styles.resumeActions}>
            <TouchableOpacity onPress={handleResume} style={styles.resumeBtn}>
              <Text style={styles.resumeBtnText}>Jump there</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setResumeIndex(null)}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
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
          <TouchableOpacity style={styles.retryBtn} onPress={loadAll}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Verse + Reflection ────────────────────────────────────── */}
      {!loading && !error && !!verse && (
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

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDiamond} />
              <View style={styles.dividerLine} />
            </View>

            {/* Translation */}
            <Text style={styles.translation}>
              "{verse.translation}"
            </Text>
          </Animated.View>

          {/* ── Reflection accordion ── */}
          <View style={styles.reflectionWrap}>
            <TouchableOpacity
              style={styles.reflectionHeader}
              onPress={toggleReflection}
              activeOpacity={0.75}
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
                    <Text style={styles.reflectionText}>{tafsirEntry.text}</Text>
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

      {/* ── Fixed bottom: action pill + navigation ─────────────────── */}
      {!loading && !error && !!verse && (
        <View style={[styles.bottomArea, { paddingBottom: insets.bottom + Spacing.md }]}>

          {/* Save · Share · Audio */}
          <View style={styles.pill}>
            <BlurView intensity={60} tint="dark" style={styles.pillInner}>

              {/* Save */}
              <TouchableOpacity
                onPress={handleBookmark}
                style={styles.pillBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Save verse'}
              >
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={isBookmarked ? GOLD : 'rgba(245,237,227,0.7)'}
                />
                <Text style={[styles.pillLabel, isBookmarked && styles.pillLabelActive]}>
                  Save
                </Text>
              </TouchableOpacity>

              <View style={styles.pillSep} />

              {/* Share */}
              <TouchableOpacity
                onPress={handleShare}
                style={styles.pillBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Share verse"
              >
                <Ionicons name="share-outline" size={22} color="rgba(245,237,227,0.7)" />
                <Text style={styles.pillLabel}>Share</Text>
              </TouchableOpacity>

              <View style={styles.pillSep} />

              {/* Audio */}
              {audioKey ? (
                <View style={styles.pillBtn}>
                  <AudioPlayerButton
                    verseKey={audioKey}
                    size={34}
                    iconSize={22}
                    color="rgba(245,237,227,0.7)"
                    showLabel={false}
                    containerStyle={styles.audioCtr}
                    style={styles.audioWrap}
                  />
                  <Text style={styles.pillLabel}>Audio</Text>
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
        content={{
          text: shareContent.text,
          source: shareContent.source,
          arabicText: shareContent.arabicText,
          transliteration: shareContent.transliteration,
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111E',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
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
    fontSize: 20,
    color: '#EDD9A3',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerEnglish: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 2,
    marginBottom: 3,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.text.muted,
    letterSpacing: 0.3,
  },
  numBadgeText: {
    width: 44,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(212,175,55,0.5)',
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
    backgroundColor: 'rgba(255,235,210,0.04)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(212,175,55,0.1)',
  },
  bismillahText: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 20,
    color: '#EDD9A3',
    textAlign: 'center',
    lineHeight: 40,
    opacity: 0.6,
  },

  // Arabic
  arabic: {
    fontSize: 26,
    lineHeight: 54,
    color: '#EDD9A3',
    textAlign: 'center',
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
    backgroundColor: 'rgba(245,237,227,0.12)',
  },
  dividerDiamond: {
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
    color: 'rgba(245,237,227,0.72)',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: Spacing.sm,
  },

  // ── Reflection accordion ──
  reflectionWrap: {
    backgroundColor: 'rgba(255,235,210,0.04)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,235,210,0.07)',
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
  pillBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    minHeight: 44,
  },
  pillLabel: {
    fontSize: 10,
    color: 'rgba(245,237,227,0.5)',
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  pillLabelActive: {
    color: GOLD,
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
    color: 'rgba(245,237,227,0.45)',
    fontWeight: '600',
    letterSpacing: 1,
    minWidth: 70,
    textAlign: 'center',
  },
});
