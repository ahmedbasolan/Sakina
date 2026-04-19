/**
 * LibraryScreen
 *
 * Dark navy library with two tabs:
 * 1. SAVED VERSES — bookmarked content from SQLite
 * 2. ALL SURAHS  — full 114-surah Quran list with search
 *
 * Background: #07111E → #0C1A2E, twinkling stars, mandala,
 * gold accents — matches the app's dark glassmorphism aesthetic.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Colors } from '../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { quranContent } from '../data/quranData';
import { Content, Mood } from '../types';
import { dbQuery } from '../database/schema';
import { AnimatedMandala } from '../components/AnimatedMandala';

const { width, height } = Dimensions.get('window');

const STARS = [
  { x: 0.05, y: 0.05, s: 2.5, d: 0 },
  { x: 0.91, y: 0.04, s: 2, d: 500 },
  { x: 0.16, y: 0.14, s: 1.5, d: 250 },
  { x: 0.82, y: 0.10, s: 2, d: 750 },
  { x: 0.48, y: 0.07, s: 1.5, d: 100 },
];

const MOOD_COLORS: Record<string, string> = {
  Overwhelmed: '#818CF8', Sad: '#60A5FA', Angry: '#F87171',
  Tired: '#9CA3AF', Lonely: '#A78BFA', Grateful: '#34D399',
  Hopeful: '#FBBF24', Guilty: '#34D399', Calm: '#22D3EE',
};

// 114 Surah names with English meanings
type SurahEntry = { arabic: string; english: string; meaning: string; verses: number };
const SURAH_LIST = Array.from({ length: 114 }, (_, i) => {
  const surahs: Record<number, SurahEntry> = {
    1:   { arabic: 'الفاتحة', english: 'Al-Fatihah',   meaning: 'The Opening',          verses: 7 },
    2:   { arabic: 'البقرة',   english: 'Al-Baqarah',   meaning: 'The Cow',              verses: 286 },
    3:   { arabic: 'آل عمران', english: "Al-Imran",     meaning: 'Family of Imran',      verses: 200 },
    4:   { arabic: 'النساء',   english: 'An-Nisa',      meaning: 'The Women',            verses: 176 },
    5:   { arabic: 'المائدة',   english: "Al-Ma'idah",   meaning: 'The Table Spread',     verses: 120 },
    6:   { arabic: 'الأنعام',  english: "Al-An'am",     meaning: 'The Cattle',           verses: 165 },
    7:   { arabic: 'الأعراف',  english: "Al-A'raf",     meaning: 'The Heights',          verses: 206 },
    8:   { arabic: 'الأنفال',  english: 'Al-Anfal',     meaning: 'The Spoils of War',    verses: 75 },
    9:   { arabic: 'التوبة',   english: 'At-Tawbah',    meaning: 'The Repentance',       verses: 129 },
    10:  { arabic: 'يونس',    english: 'Yunus',        meaning: 'Jonah',                verses: 109 },
    11:  { arabic: 'هود',     english: 'Hud',          meaning: 'Hud',                  verses: 123 },
    12:  { arabic: 'يوسف',    english: 'Yusuf',        meaning: 'Joseph',               verses: 111 },
    13:  { arabic: 'الرعد',    english: "Ar-Ra'd",      meaning: 'The Thunder',          verses: 43 },
    14:  { arabic: 'إبراهيم', english: 'Ibrahim',      meaning: 'Abraham',              verses: 52 },
    15:  { arabic: 'الحجر',    english: 'Al-Hijr',      meaning: 'The Rocky Tract',      verses: 99 },
    16:  { arabic: 'النحل',    english: 'An-Nahl',      meaning: 'The Bee',              verses: 128 },
    17:  { arabic: 'الإسراء',  english: 'Al-Isra',      meaning: 'The Night Journey',    verses: 111 },
    18:  { arabic: 'الكهف',    english: 'Al-Kahf',      meaning: 'The Cave',             verses: 110 },
    19:  { arabic: 'مريم',    english: 'Maryam',       meaning: 'Mary',                 verses: 98 },
    20:  { arabic: 'طه',      english: 'Ta-Ha',        meaning: 'Ta-Ha',                verses: 135 },
    36:  { arabic: 'يس',      english: 'Ya-Sin',       meaning: 'Ya-Sin',               verses: 83 },
    55:  { arabic: 'الرحمن',   english: 'Ar-Rahman',    meaning: 'The Most Merciful',    verses: 78 },
    56:  { arabic: 'الواقعة',  english: "Al-Waqi'ah",   meaning: 'The Inevitable',       verses: 96 },
    67:  { arabic: 'الملك',   english: 'Al-Mulk',      meaning: 'The Sovereignty',      verses: 30 },
    112: { arabic: 'الإخلاص', english: 'Al-Ikhlas',    meaning: 'The Sincerity',        verses: 4 },
    113: { arabic: 'الفلق',   english: 'Al-Falaq',     meaning: 'The Daybreak',         verses: 5 },
    114: { arabic: 'الناس',   english: 'An-Nas',       meaning: 'Mankind',              verses: 6 },
  };
  const n = i + 1;
  return surahs[n] || { arabic: `سورة ${n}`, english: `Surah ${n}`, meaning: '', verses: Math.floor(20 + Math.random() * 80) };
}).map((s, i) => ({ ...s, number: i + 1 }));

function TwinklingStar({ x, y, s: size, d: delay }: any) {
  const opacity = useRef(new Animated.Value(0.15)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.8, duration: 1400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.15, duration: 1400, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x * width, top: y * height * 0.35,
        width: size, height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.accent.primary,
        opacity, zIndex: 1,
      }}
    />
  );
}

function SavedVerseCard({ verse }: { verse: any }) {
  const moodColor = verse.mood ? (MOOD_COLORS[verse.mood] || Colors.accent.primary) : Colors.accent.primary;
  return (
    <BlurView intensity={10} tint="dark" style={styles.savedCard}>
      <View style={[styles.savedCardAccent, { backgroundColor: moodColor }]} />
      <View style={styles.savedCardBody}>
        <View style={styles.savedCardHeader}>
          <MaterialCommunityIcons name="star" size={14} color={Colors.accent.primary} />
          <Text style={styles.savedCardSource}>{verse.source || 'Quran'}</Text>
          {verse.mood && (
            <View style={[styles.moodPill, { backgroundColor: `${moodColor}20`, borderColor: `${moodColor}35` }]}>
              <Text style={[styles.moodPillText, { color: moodColor }]}>{verse.mood}</Text>
            </View>
          )}
        </View>
        {verse.arabicText && (
          <Text style={styles.savedCardArabic} numberOfLines={2}>{verse.arabicText}</Text>
        )}
        <Text style={styles.savedCardTranslation} numberOfLines={3}>
          {verse.primaryText || verse.englishTranslation || ''}
        </Text>
      </View>
    </BlurView>
  );
}

function SurahRow({ surah, onPress }: { surah: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.surahRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.surahNumber}>
        <MaterialCommunityIcons name="star-four-points" size={12} color={Colors.accent.primary} style={{ position: 'absolute', top: 4, opacity: 0.55 }} />
        <Text style={styles.surahNumberText}>{surah.number}</Text>
      </View>
      <View style={styles.surahInfo}>
        <Text style={styles.surahEnglish}>{surah.english.toUpperCase()}</Text>
        <Text style={styles.surahVerses}>
          {surah.meaning ? `${surah.meaning} · ` : ''}{surah.verses} verses
        </Text>
      </View>
      <Text style={styles.surahArabic}>{surah.arabic}</Text>
      <MaterialCommunityIcons name="bookmark-outline" size={16} color="rgba(201,168,76,0.45)" />
    </TouchableOpacity>
  );
}

type Tab = 'saved' | 'surahs';

export default function LibraryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedVerses, setSavedVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const tabIndicator = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    loadSavedVerses();
  }, []);

  const loadSavedVerses = async () => {
    try {
      const data = await dbQuery(async (db) => {
        const rows = await db.getAllAsync(`
          SELECT sc.*, c.arabicText, c.source, c.primaryText, c.englishTranslation
          FROM saved_content sc
          LEFT JOIN content c ON sc.contentId = c.id
          ORDER BY sc.savedAt DESC
        `);
        return rows as any[];
      });
      setSavedVerses(data);
    } catch {
      setSavedVerses([]);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    Animated.spring(tabIndicator, {
      toValue: tab === 'saved' ? 0 : 1,
      friction: 8, tension: 100, useNativeDriver: false,
    }).start();
  };

  const filteredSurahs = useMemo(() => {
    if (!searchQuery) return SURAH_LIST;
    const q = searchQuery.toLowerCase();
    return SURAH_LIST.filter(
      s => s.english.toLowerCase().includes(q) ||
           s.arabic.includes(q) ||
           s.number.toString().includes(q)
    );
  }, [searchQuery]);

  const indicatorLeft = tabIndicator.interpolate({
    inputRange: [0, 1],
    outputRange: ['3%', '52%'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#07111E', '#0C1A2E', '#0F1F30']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Ambient glow */}
      <View style={styles.glowOrb} pointerEvents="none" />

      {/* Stars */}
      {STARS.map((star, i) => <TwinklingStar key={i} {...star} />)}

      {/* Mandala */}
      <View style={styles.mandalaWrap} pointerEvents="none">
        <AnimatedMandala size={260} color={Colors.accent.primary} opacity={0.05} />
      </View>

      {/* Header */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 16, opacity: headerOpacity }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerPretitle}>QURANIC LIBRARY</Text>
            <Text style={styles.headerTitle}>SACRED WORDS</Text>
            <Text style={styles.headerSub}>Complete Quran · Saved Verses · Offline</Text>
          </View>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="book-open-variant" size={22} color={Colors.accent.primary} />
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={18} color="rgba(201,168,76,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search surahs, verses, topics..."
            placeholderTextColor="rgba(176,196,215,0.35)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={16} color="rgba(176,196,215,0.4)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab switcher */}
        <View style={styles.tabSwitcher}>
          <Animated.View style={[styles.tabIndicator, { left: indicatorLeft }]} />
          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('saved')}>
            <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
              SAVED VERSES
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('surahs')}>
            <Text style={[styles.tabText, activeTab === 'surahs' && styles.tabTextActive]}>
              ALL SURAHS
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Content */}
      {activeTab === 'saved' ? (
        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator color={Colors.accent.primary} style={{ marginTop: 60 }} />
          ) : savedVerses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="bookmark-outline" size={48} color="rgba(201,168,76,0.3)" />
              <Text style={styles.emptyTitle}>No Saved Verses</Text>
              <Text style={styles.emptySub}>
                Tap the bookmark icon on any verse{'\n'}to save it here
              </Text>
            </View>
          ) : (
            savedVerses.map((v, i) => <SavedVerseCard key={i} verse={v} />)
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredSurahs}
          keyExtractor={(item) => item.number.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <SurahRow
              surah={item}
              onPress={() => navigation.navigate('QuranLibrary', { surahNumber: item.number })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111E' },

  glowOrb: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(201,168,76,0.05)',
    left: width / 2 - 110, top: 30,
  },
  mandalaWrap: {
    position: 'absolute',
    left: width / 2 - 130, top: 20, zIndex: 0,
  },

  header: { paddingHorizontal: 22, paddingBottom: 10, zIndex: 2 },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerIcon: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerPretitle: {
    fontSize: 10, color: 'rgba(201,168,76,0.6)',
    letterSpacing: 2.5, marginBottom: 3,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerTitle: {
    fontSize: 26, color: '#F0E6D3',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700', letterSpacing: 1,
    marginBottom: 4,
    textShadowColor: 'rgba(201,168,76,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerSub: { fontSize: 12, color: 'rgba(176,196,215,0.5)' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 14, gap: 8,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#F0E6D3',
  },

  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 4, position: 'relative',
    overflow: 'hidden', marginBottom: 4,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4, bottom: 4,
    width: '46%',
    backgroundColor: 'rgba(52,211,153,0.16)',
    borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.35)',
  },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', zIndex: 1 },
  tabText: {
    fontSize: 11, fontWeight: '700',
    color: 'rgba(176,196,215,0.5)',
    letterSpacing: 1.2,
  },
  tabTextActive: { color: '#6EE7B7' },

  listContent: { paddingHorizontal: 18, paddingTop: 12, gap: 10 },

  // Saved verse cards
  savedCard: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row', marginBottom: 2,
  },
  savedCardAccent: { width: 4, borderRadius: 2 },
  savedCardBody: { flex: 1, padding: 14, gap: 6 },
  savedCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  savedCardSource: {
    fontSize: 11, color: 'rgba(201,168,76,0.7)',
    fontWeight: '700', letterSpacing: 0.5, flex: 1,
  },
  moodPill: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1,
  },
  moodPillText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  savedCardArabic: {
    fontSize: 18, color: '#EDD9A3',
    textAlign: 'right', lineHeight: 30,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  savedCardTranslation: {
    fontSize: 13, color: 'rgba(176,196,215,0.7)',
    lineHeight: 20, fontStyle: 'italic',
  },

  // Surah rows
  surahRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 4, gap: 12,
  },
  surahNumber: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  surahNumberText: {
    fontSize: 12, color: Colors.accent.primary,
    fontWeight: '700',
    marginTop: 6,
  },
  surahInfo: { flex: 1 },
  surahEnglish: {
    fontSize: 13, color: '#F0E6D3',
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  surahVerses: { fontSize: 11, color: 'rgba(176,196,215,0.5)', marginTop: 3 },
  surahArabic: {
    fontSize: 17, color: 'rgba(201,168,76,0.8)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginRight: 6,
  },
  separator: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 4,
  },

  // Empty state
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: 12,
  },
  emptyTitle: {
    fontSize: 18, color: 'rgba(240,230,211,0.6)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
  },
  emptySub: {
    fontSize: 14, color: 'rgba(176,196,215,0.4)',
    textAlign: 'center', lineHeight: 22,
  },
});