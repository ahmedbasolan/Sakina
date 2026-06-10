/**
 * SurahReaderScreen
 *
 * Renders a full surah verse-by-verse, fetching from alquran.cloud and
 * caching in SQLite (quran_cache, TTL = 7 days). Saves reading progress
 * to kv_store so the user can resume from where they left off. Each verse
 * has a one-tap bookmark that writes to bookmarked_verses.
 *
 * Aesthetic: midnight-navy background, Amiri Arabic text in warm cream,
 * English translation in muted steel, gold accent throughout.
 */
import React, {
  useState, useEffect, useCallback, useRef,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/DesignSystem';
import { dbQuery } from '../database/schema';
import {
  getCachedSurah,
  fetchAndCacheSurah,
  QuranVerse,
} from '../services/quranService';

// ─── types ────────────────────────────────────────────────────────────────────

// Alias so existing code inside this file continues to use `Verse`
type Verse = QuranVerse;

export interface ReadingProgress {
  surahNumber: number;
  verseIndex: number;   // 0-based FlatList index
  surahName: string;
  timestamp: number;
}

// ─── constants ────────────────────────────────────────────────────────────────

const PROGRESS_KEY = 'quran_reading_progress';

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

// ─── VerseItem ────────────────────────────────────────────────────────────────

const VerseItem = React.memo(function VerseItem({
  verse,
  surahNumber,
  surahName,
  initialBookmarked,
  onBookmarkChange,
}: {
  verse: Verse;
  surahNumber: number;
  surahName: string;
  initialBookmarked: boolean;
  onBookmarkChange: (verseNumber: number, bookmarked: boolean) => void;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const bmAnim = useRef(new Animated.Value(initialBookmarked ? 1 : 0)).current;

  const handleBookmark = useCallback(async () => {
    const next = !bookmarked;
    setBookmarked(next);
    Animated.spring(bmAnim, {
      toValue: next ? 1 : 0,
      damping: 14,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
    onBookmarkChange(verse.numberInSurah, next);
    if (next) {
      await addBookmark(verse, surahNumber, surahName);
    } else {
      await removeBookmark(surahNumber, verse.numberInSurah);
    }
  }, [bookmarked, verse, surahNumber, surahName, onBookmarkChange]);

  const bmScale = bmAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.35, 1],
  });

  return (
    <View style={vStyles.container}>
      <View style={vStyles.topRow}>
        {/* Verse number medallion */}
        <View style={vStyles.numBadge}>
          <MaterialCommunityIcons
            name="star-four-points"
            size={9}
            color={Colors.accent.primary}
            style={vStyles.numStar}
          />
          <Text style={vStyles.numText}>{verse.numberInSurah}</Text>
        </View>

        {/* Bookmark */}
        <Animated.View style={{ transform: [{ scale: bmScale }] }}>
          <TouchableOpacity
            onPress={handleBookmark}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={bookmarked ? Colors.accent.primary : 'rgba(201,168,76,0.28)'}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Arabic */}
      <Text style={vStyles.arabic}>{verse.arabic}</Text>

      {/* Translation */}
      <Text style={vStyles.translation}>{verse.translation}</Text>

      {/* Ornamental divider */}
      <View style={vStyles.divider}>
        <MaterialCommunityIcons
          name="star-four-points"
          size={7}
          color="rgba(201,168,76,0.18)"
        />
      </View>
    </View>
  );
});

const vStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  numBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201,168,76,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  numStar: {
    position: 'absolute',
    top: 5,
    opacity: 0.55,
  },
  numText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent.primary,
    marginTop: 8,
  },
  arabic: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 22,
    color: '#EDD9A3',
    textAlign: 'right',
    lineHeight: 44,
    marginBottom: Spacing.sm,
  },
  translation: {
    fontSize: 14,
    color: 'rgba(176,196,215,0.72)',
    lineHeight: 24,
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },
  divider: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
});

// ─── SurahReaderScreen ────────────────────────────────────────────────────────

export default function SurahReaderScreen({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const insets = useSafeAreaInsets();
  const { surahNumber, surahName, surahArabic, verseCount } = route.params as {
    surahNumber: number;
    surahName: string;
    surahArabic: string;
    verseCount: number;
  };

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<number>>(new Set());
  const [resumeIndex, setResumeIndex] = useState<number | null>(null);

  const listRef = useRef<FlatList<Verse>>(null);
  const headerFade = useRef(new Animated.Value(0)).current;
  const visibleIndexRef = useRef(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Viewability config must be stable (can't be recreated each render)
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        visibleIndexRef.current = viewableItems[0].index;
      }
    },
  ).current;

  // Load data on mount
  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Progress auto-save every 3 seconds while reading.
  // Always register cleanup so the interval is cleared even if verses arrive
  // asynchronously after mount (prevents timer leak on fast unmount).
  useEffect(() => {
    if (verses.length === 0) return () => {}; // explicit cleanup on early return
    progressTimerRef.current = setInterval(() => {
      // Save at any visible index (including 0 = first verse) so short surahs
      // that fit on one screen still record progress.
      saveProgress({
        surahNumber,
        verseIndex: visibleIndexRef.current,
        surahName,
        timestamp: Date.now(),
      }).catch(() => {});
    }, 3000);
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [verses.length, surahNumber, surahName]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    // Local flag so the catch block doesn't rely on stale closure state
    let hasCached = false;
    try {
      // 1. Fetch bookmarks and progress concurrently with cache lookup
      //    so VerseItems mount with correct initialBookmarked on first render
      const [cached, bms, prog] = await Promise.all([
        getCachedSurah(surahNumber),
        loadBookmarksForSurah(surahNumber),
        loadReadingProgress(),
      ]);

      hasCached = !!cached;

      // 2. Apply all pre-loaded state before showing content
      setBookmarkedSet(bms);
      if (prog && prog.surahNumber === surahNumber && prog.verseIndex >= 0) {
        setResumeIndex(prog.verseIndex);
      }

      if (cached) {
        setVerses(cached);
        setLoading(false);
      }

      // 3. Fetch from API if cache was missing
      if (!cached) {
        const fresh = await fetchAndCacheSurah(surahNumber);
        setVerses(fresh);
        setLoading(false);
      }
    } catch (e) {
      // Use local flag — never read React state from an async closure
      if (!hasCached) {
        setError('Could not load surah. Please check your connection.');
      }
      setLoading(false);
    }
  };

  const handleResume = useCallback(() => {
    if (resumeIndex !== null && listRef.current) {
      listRef.current.scrollToIndex({ index: resumeIndex, animated: true });
    }
    setResumeIndex(null);
  }, [resumeIndex]);

  const dismissResume = useCallback(() => setResumeIndex(null), []);

  const handleBookmarkChange = useCallback(
    (verseNumber: number, bookmarked: boolean) => {
      setBookmarkedSet((prev) => {
        const next = new Set(prev);
        if (bookmarked) next.add(verseNumber); else next.delete(verseNumber);
        return next;
      });
    },
    [],
  );

  const renderVerse = useCallback(
    ({ item }: { item: Verse }) => (
      <VerseItem
        verse={item}
        surahNumber={surahNumber}
        surahName={surahName}
        initialBookmarked={bookmarkedSet.has(item.numberInSurah)}
        onBookmarkChange={handleBookmarkChange}
      />
    ),
    // bookmarkedSet intentionally omitted: VerseItem manages its own state after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [surahNumber, surahName, handleBookmarkChange],
  );

  const keyExtractor = useCallback(
    (item: Verse) => item.numberInSurah.toString(),
    [],
  );

  // Surah 9 (At-Tawbah) has no Bismillah by scholarly consensus
  const showBismillah = surahNumber !== 9;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#07111E', '#0C1A2E', '#0F1F30']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* ── Header ────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.md, opacity: headerFade },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke={Colors.accent.primary}
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

        {/* Surah number badge */}
        <View style={styles.numBadge}>
          <Text style={styles.numBadgeText}>{surahNumber}</Text>
        </View>
      </Animated.View>

      {/* ── Resume banner ─────────────────────────────────────────── */}
      {resumeIndex !== null && verses.length > resumeIndex && (
        <View style={styles.resumeBanner}>
          <MaterialCommunityIcons
            name="bookmark-check"
            size={16}
            color={Colors.accent.primary}
          />
          <Text style={styles.resumeText}>
            Continue from verse {verses[resumeIndex]?.numberInSurah}
          </Text>
          <View style={styles.resumeActions}>
            <TouchableOpacity onPress={handleResume} style={styles.resumeBtn}>
              <Text style={styles.resumeBtnText}>Jump there</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={dismissResume} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <MaterialCommunityIcons
                name="close"
                size={14}
                color="rgba(201,168,76,0.45)"
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Loading ───────────────────────────────────────────────── */}
      {loading && verses.length === 0 && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          <Text style={styles.loadingText}>Loading surah…</Text>
        </View>
      )}

      {/* ── Error ─────────────────────────────────────────────────── */}
      {error && verses.length === 0 && (
        <View style={styles.errorWrap}>
          <MaterialCommunityIcons
            name="wifi-off"
            size={52}
            color="rgba(201,168,76,0.25)"
          />
          <Text style={styles.errorTitle}>No Connection</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadAll}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Verses ────────────────────────────────────────────────── */}
      {verses.length > 0 && (
        <FlatList
          ref={listRef}
          data={verses}
          keyExtractor={keyExtractor}
          renderItem={renderVerse}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollToIndexFailed={() => {}}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={6}
          ListHeaderComponent={
            showBismillah ? (
              <View style={styles.bismillahBlock}>
                <Text style={styles.bismillahArabic}>
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </Text>
                <Text style={styles.bismillahLatin}>
                  In the name of Allah, the Most Gracious, the Most Merciful
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111E',
  },

  // Header
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
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
  numBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent.primary,
  },

  // Resume banner
  resumeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.22)',
    gap: Spacing.sm,
  },
  resumeText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(201,168,76,0.85)',
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
    backgroundColor: 'rgba(201,168,76,0.18)',
    borderRadius: BorderRadius.sm,
  },
  resumeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent.primary,
    letterSpacing: 0.3,
  },

  // Bismillah header
  bismillahBlock: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.08)',
    marginBottom: Spacing.sm,
  },
  bismillahArabic: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 24,
    color: '#EDD9A3',
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: Spacing.sm,
  },
  bismillahLatin: {
    fontSize: 12,
    color: 'rgba(176,196,215,0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },

  // Loading
  loadingWrap: {
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

  // Error
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    color: 'rgba(240,230,211,0.6)',
  },
  errorSub: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent.primary,
    letterSpacing: 0.5,
  },
});
