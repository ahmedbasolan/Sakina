/**
 * LibraryScreen
 *
 * Two-tab library:
 *   SAVED VERSES  — bookmarked verses from the Surah Reader (bookmarked_verses table)
 *   ALL SURAHS    — complete 114-surah index with search + "Continue Reading" banner
 *
 * Background: #07111E → #0C1A2E, twinkling stars, gold mandala.
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { dbQuery } from '../database/schema';
import { AnimatedMandala } from '../components/AnimatedMandala';
import { TwinklingStar } from '../components/TwinklingStar';
import { loadReadingProgress } from './SurahReaderScreen';
import type { ReadingProgress } from './SurahReaderScreen';
import {
  getDownloadProgress,
  prefetchAllSurahs,
  type DownloadProgress,
} from '../services/quranService';
import { ReflectionRepository } from '../services/reflectionRepository';
import { MoodColors } from '../theme/DesignSystem';
import { MOOD_ICON } from '../constants/moodIcons';
import { Mood } from '../types';

// Same derivation ReflectionHistoryScreen/QuranLibraryScreen use — one
// source of truth (MoodColors) so a mood reads identically everywhere it
// shows up, whether that's a reflection card or a saved verse.
const MOOD_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(MoodColors).map(([k, v]) => [k, v.accent]),
);

const { width } = Dimensions.get('window');

// ─── Stars ────────────────────────────────────────────────────────────────────

const STARS = [
  { x: '5%',  y: '5%',  size: 2.5, delay: 0 },
  { x: '91%', y: '4%',  size: 2,   delay: 500 },
  { x: '16%', y: '14%', size: 1.5, delay: 250 },
  { x: '82%', y: '10%', size: 2,   delay: 750 },
  { x: '48%', y: '7%',  size: 1.5, delay: 100 },
];

// ─── Complete 114-surah list ──────────────────────────────────────────────────

type SurahEntry = {
  number: number;
  arabic: string;
  english: string;
  meaning: string;
  verses: number;
};

const SURAH_LIST: SurahEntry[] = [
  { number: 1,   arabic: 'الفاتحة',    english: 'Al-Fatihah',      meaning: 'The Opening',             verses: 7   },
  { number: 2,   arabic: 'البقرة',     english: 'Al-Baqarah',      meaning: 'The Cow',                 verses: 286 },
  { number: 3,   arabic: 'آل عمران',   english: "Al-Imran",        meaning: "Family of Imran",         verses: 200 },
  { number: 4,   arabic: 'النساء',     english: 'An-Nisa',         meaning: 'The Women',               verses: 176 },
  { number: 5,   arabic: 'المائدة',    english: "Al-Ma'idah",      meaning: 'The Table Spread',        verses: 120 },
  { number: 6,   arabic: 'الأنعام',    english: "Al-An'am",        meaning: 'The Cattle',              verses: 165 },
  { number: 7,   arabic: 'الأعراف',    english: "Al-A'raf",        meaning: 'The Heights',             verses: 206 },
  { number: 8,   arabic: 'الأنفال',    english: 'Al-Anfal',        meaning: 'The Spoils of War',       verses: 75  },
  { number: 9,   arabic: 'التوبة',     english: 'At-Tawbah',       meaning: 'The Repentance',          verses: 129 },
  { number: 10,  arabic: 'يونس',       english: 'Yunus',           meaning: 'Jonah',                   verses: 109 },
  { number: 11,  arabic: 'هود',        english: 'Hud',             meaning: 'Hud',                     verses: 123 },
  { number: 12,  arabic: 'يوسف',       english: 'Yusuf',           meaning: 'Joseph',                  verses: 111 },
  { number: 13,  arabic: 'الرعد',      english: "Ar-Ra'd",         meaning: 'The Thunder',             verses: 43  },
  { number: 14,  arabic: 'إبراهيم',   english: 'Ibrahim',         meaning: 'Abraham',                 verses: 52  },
  { number: 15,  arabic: 'الحجر',      english: 'Al-Hijr',         meaning: 'The Rocky Tract',         verses: 99  },
  { number: 16,  arabic: 'النحل',      english: 'An-Nahl',         meaning: 'The Bee',                 verses: 128 },
  { number: 17,  arabic: 'الإسراء',   english: 'Al-Isra',         meaning: 'The Night Journey',       verses: 111 },
  { number: 18,  arabic: 'الكهف',      english: 'Al-Kahf',         meaning: 'The Cave',                verses: 110 },
  { number: 19,  arabic: 'مريم',       english: 'Maryam',          meaning: 'Mary',                    verses: 98  },
  { number: 20,  arabic: 'طه',         english: 'Ta-Ha',           meaning: 'Ta-Ha',                   verses: 135 },
  { number: 21,  arabic: 'الأنبياء',   english: "Al-Anbiya'",      meaning: 'The Prophets',            verses: 112 },
  { number: 22,  arabic: 'الحج',       english: 'Al-Hajj',         meaning: 'The Pilgrimage',          verses: 78  },
  { number: 23,  arabic: 'المؤمنون',   english: "Al-Mu'minun",     meaning: 'The Believers',           verses: 118 },
  { number: 24,  arabic: 'النور',      english: 'An-Nur',          meaning: 'The Light',               verses: 64  },
  { number: 25,  arabic: 'الفرقان',    english: 'Al-Furqan',       meaning: 'The Criterion',           verses: 77  },
  { number: 26,  arabic: 'الشعراء',    english: "Ash-Shu'ara'",    meaning: 'The Poets',               verses: 227 },
  { number: 27,  arabic: 'النمل',      english: 'An-Naml',         meaning: 'The Ant',                 verses: 93  },
  { number: 28,  arabic: 'القصص',      english: 'Al-Qasas',        meaning: 'The Stories',             verses: 88  },
  { number: 29,  arabic: 'العنكبوت',   english: 'Al-Ankabut',      meaning: 'The Spider',              verses: 69  },
  { number: 30,  arabic: 'الروم',      english: 'Ar-Rum',          meaning: 'The Romans',              verses: 60  },
  { number: 31,  arabic: 'لقمان',      english: 'Luqman',          meaning: 'Luqman',                  verses: 34  },
  { number: 32,  arabic: 'السجدة',     english: 'As-Sajdah',       meaning: 'The Prostration',         verses: 30  },
  { number: 33,  arabic: 'الأحزاب',    english: 'Al-Ahzab',        meaning: 'The Clans',               verses: 73  },
  { number: 34,  arabic: 'سبأ',        english: "Saba'",           meaning: 'Sheba',                   verses: 54  },
  { number: 35,  arabic: 'فاطر',       english: 'Fatir',           meaning: 'The Originator',          verses: 45  },
  { number: 36,  arabic: 'يس',         english: 'Ya-Sin',          meaning: 'Ya-Sin',                  verses: 83  },
  { number: 37,  arabic: 'الصافات',    english: 'As-Saffat',       meaning: 'Those Ranged in Ranks',   verses: 182 },
  { number: 38,  arabic: 'ص',          english: 'Sad',             meaning: 'Sad',                     verses: 88  },
  { number: 39,  arabic: 'الزمر',      english: 'Az-Zumar',        meaning: 'The Groups',              verses: 75  },
  { number: 40,  arabic: 'غافر',       english: 'Ghafir',          meaning: 'The Forgiver',            verses: 85  },
  { number: 41,  arabic: 'فصلت',       english: 'Fussilat',        meaning: 'Explained in Detail',     verses: 54  },
  { number: 42,  arabic: 'الشورى',     english: 'Ash-Shura',       meaning: 'The Consultation',        verses: 53  },
  { number: 43,  arabic: 'الزخرف',     english: 'Az-Zukhruf',      meaning: 'The Ornaments of Gold',   verses: 89  },
  { number: 44,  arabic: 'الدخان',     english: 'Ad-Dukhan',       meaning: 'The Smoke',               verses: 59  },
  { number: 45,  arabic: 'الجاثية',    english: 'Al-Jathiyah',     meaning: 'The Crouching',           verses: 37  },
  { number: 46,  arabic: 'الأحقاف',    english: 'Al-Ahqaf',        meaning: 'The Wind-Curved Sandhills', verses: 35 },
  { number: 47,  arabic: 'محمد',       english: 'Muhammad',        meaning: 'Muhammad',                verses: 38  },
  { number: 48,  arabic: 'الفتح',      english: 'Al-Fath',         meaning: 'The Victory',             verses: 29  },
  { number: 49,  arabic: 'الحجرات',    english: 'Al-Hujurat',      meaning: 'The Rooms',               verses: 18  },
  { number: 50,  arabic: 'ق',          english: 'Qaf',             meaning: 'Qaf',                     verses: 45  },
  { number: 51,  arabic: 'الذاريات',   english: 'Adh-Dhariyat',    meaning: 'The Winnowing Winds',     verses: 60  },
  { number: 52,  arabic: 'الطور',      english: 'At-Tur',          meaning: 'The Mount',               verses: 49  },
  { number: 53,  arabic: 'النجم',      english: 'An-Najm',         meaning: 'The Star',                verses: 62  },
  { number: 54,  arabic: 'القمر',      english: 'Al-Qamar',        meaning: 'The Moon',                verses: 55  },
  { number: 55,  arabic: 'الرحمن',     english: 'Ar-Rahman',       meaning: 'The Beneficent',          verses: 78  },
  { number: 56,  arabic: 'الواقعة',    english: "Al-Waqi'ah",      meaning: 'The Inevitable',          verses: 96  },
  { number: 57,  arabic: 'الحديد',     english: 'Al-Hadid',        meaning: 'The Iron',                verses: 29  },
  { number: 58,  arabic: 'المجادلة',   english: 'Al-Mujadila',     meaning: 'The Pleading Woman',      verses: 22  },
  { number: 59,  arabic: 'الحشر',      english: 'Al-Hashr',        meaning: 'The Exile',               verses: 24  },
  { number: 60,  arabic: 'الممتحنة',   english: 'Al-Mumtahanah',   meaning: 'She That is to be Examined', verses: 13 },
  { number: 61,  arabic: 'الصف',       english: 'As-Saf',          meaning: 'The Ranks',               verses: 14  },
  { number: 62,  arabic: 'الجمعة',     english: 'Al-Jumuah',       meaning: 'Friday',                  verses: 11  },
  { number: 63,  arabic: 'المنافقون',  english: 'Al-Munafiqun',    meaning: 'The Hypocrites',          verses: 11  },
  { number: 64,  arabic: 'التغابن',    english: 'At-Taghabun',     meaning: 'Mutual Disillusion',      verses: 18  },
  { number: 65,  arabic: 'الطلاق',     english: 'At-Talaq',        meaning: 'Divorce',                 verses: 12  },
  { number: 66,  arabic: 'التحريم',    english: 'At-Tahrim',       meaning: 'The Prohibition',         verses: 12  },
  { number: 67,  arabic: 'الملك',      english: 'Al-Mulk',         meaning: 'The Sovereignty',         verses: 30  },
  { number: 68,  arabic: 'القلم',      english: 'Al-Qalam',        meaning: 'The Pen',                 verses: 52  },
  { number: 69,  arabic: 'الحاقة',     english: 'Al-Haqqah',       meaning: 'The Inevitable',          verses: 52  },
  { number: 70,  arabic: 'المعارج',    english: "Al-Ma'arij",      meaning: 'The Ascending Stairways', verses: 44  },
  { number: 71,  arabic: 'نوح',        english: 'Nuh',             meaning: 'Noah',                    verses: 28  },
  { number: 72,  arabic: 'الجن',       english: 'Al-Jinn',         meaning: 'The Jinn',                verses: 28  },
  { number: 73,  arabic: 'المزمل',     english: 'Al-Muzzammil',    meaning: 'The Enshrouded One',      verses: 20  },
  { number: 74,  arabic: 'المدثر',     english: 'Al-Muddaththir',  meaning: 'The Cloaked One',         verses: 56  },
  { number: 75,  arabic: 'القيامة',    english: 'Al-Qiyamah',      meaning: 'The Resurrection',        verses: 40  },
  { number: 76,  arabic: 'الإنسان',    english: 'Al-Insan',        meaning: 'Man',                     verses: 31  },
  { number: 77,  arabic: 'المرسلات',   english: 'Al-Mursalat',     meaning: 'Those Sent Forth',        verses: 50  },
  { number: 78,  arabic: 'النبأ',      english: "An-Naba'",        meaning: 'The Tidings',             verses: 40  },
  { number: 79,  arabic: 'النازعات',   english: "An-Nazi'at",      meaning: 'Those Who Drag Forth',    verses: 46  },
  { number: 80,  arabic: 'عبس',        english: 'Abasa',           meaning: 'He Frowned',              verses: 42  },
  { number: 81,  arabic: 'التكوير',    english: 'At-Takwir',       meaning: 'The Overthrowing',        verses: 29  },
  { number: 82,  arabic: 'الانفطار',   english: 'Al-Infitar',      meaning: 'The Cleaving',            verses: 19  },
  { number: 83,  arabic: 'المطففين',   english: 'Al-Mutaffifin',   meaning: 'The Defrauding',          verses: 36  },
  { number: 84,  arabic: 'الانشقاق',   english: 'Al-Inshiqaq',     meaning: 'The Sundering',           verses: 25  },
  { number: 85,  arabic: 'البروج',     english: 'Al-Buruj',        meaning: 'The Constellations',      verses: 22  },
  { number: 86,  arabic: 'الطارق',     english: 'At-Tariq',        meaning: 'The Nightcomer',          verses: 17  },
  { number: 87,  arabic: 'الأعلى',     english: "Al-A'la",         meaning: 'The Most High',           verses: 19  },
  { number: 88,  arabic: 'الغاشية',    english: 'Al-Ghashiyah',    meaning: 'The Overwhelming',        verses: 26  },
  { number: 89,  arabic: 'الفجر',      english: 'Al-Fajr',         meaning: 'The Dawn',                verses: 30  },
  { number: 90,  arabic: 'البلد',      english: 'Al-Balad',        meaning: 'The City',                verses: 20  },
  { number: 91,  arabic: 'الشمس',      english: 'Ash-Shams',       meaning: 'The Sun',                 verses: 15  },
  { number: 92,  arabic: 'الليل',      english: 'Al-Layl',         meaning: 'The Night',               verses: 21  },
  { number: 93,  arabic: 'الضحى',      english: 'Ad-Duha',         meaning: 'The Morning Hours',       verses: 11  },
  { number: 94,  arabic: 'الشرح',      english: 'Ash-Sharh',       meaning: 'The Relief',              verses: 8   },
  { number: 95,  arabic: 'التين',      english: 'At-Tin',          meaning: 'The Fig',                 verses: 8   },
  { number: 96,  arabic: 'العلق',      english: 'Al-Alaq',         meaning: 'The Clinging Clot',       verses: 19  },
  { number: 97,  arabic: 'القدر',      english: 'Al-Qadr',         meaning: 'The Power',               verses: 5   },
  { number: 98,  arabic: 'البينة',     english: 'Al-Bayyinah',     meaning: 'The Clear Proof',         verses: 8   },
  { number: 99,  arabic: 'الزلزلة',    english: 'Az-Zalzalah',     meaning: 'The Earthquake',          verses: 8   },
  { number: 100, arabic: 'العاديات',   english: "Al-'Adiyat",      meaning: 'The Courser',             verses: 11  },
  { number: 101, arabic: 'القارعة',    english: "Al-Qari'ah",      meaning: 'The Calamity',            verses: 11  },
  { number: 102, arabic: 'التكاثر',    english: 'At-Takathur',     meaning: 'The Rivalry in World Increase', verses: 8 },
  { number: 103, arabic: 'العصر',      english: "Al-'Asr",         meaning: 'The Declining Day',       verses: 3   },
  { number: 104, arabic: 'الهمزة',     english: 'Al-Humazah',      meaning: 'The Traducer',            verses: 9   },
  { number: 105, arabic: 'الفيل',      english: 'Al-Fil',          meaning: 'The Elephant',            verses: 5   },
  { number: 106, arabic: 'قريش',       english: 'Quraysh',         meaning: 'Quraysh',                 verses: 4   },
  { number: 107, arabic: 'الماعون',    english: "Al-Ma'un",        meaning: 'The Small Kindnesses',    verses: 7   },
  { number: 108, arabic: 'الكوثر',     english: 'Al-Kawthar',      meaning: 'The Abundance',           verses: 3   },
  { number: 109, arabic: 'الكافرون',   english: 'Al-Kafirun',      meaning: 'The Disbelievers',        verses: 6   },
  { number: 110, arabic: 'النصر',      english: 'An-Nasr',         meaning: 'The Divine Support',      verses: 3   },
  { number: 111, arabic: 'المسد',      english: 'Al-Masad',        meaning: 'The Palm Fibre',          verses: 5   },
  { number: 112, arabic: 'الإخلاص',   english: 'Al-Ikhlas',       meaning: 'The Sincerity',           verses: 4   },
  { number: 113, arabic: 'الفلق',      english: 'Al-Falaq',        meaning: 'The Daybreak',            verses: 5   },
  { number: 114, arabic: 'الناس',      english: 'An-Nas',          meaning: 'Mankind',                 verses: 6   },
];

// ─── SavedVerseCard ───────────────────────────────────────────────────────────
// One unified shape for every verse a user has saved, wherever the save
// happened — the bookmark icon in the Quran reader, or "save" while sitting
// with a verse in Guidance/a Journey. See SavedVerseEntry below.

interface SavedVerseEntry {
  id: string;
  arabicText: string;
  translation: string;
  source: string; // "Al-Baqarah · 255" (reader) or "Surah Al-Baqarah 2:255" (guidance)
  mood?: Mood; // only guidance-saved verses carry a mood
  savedAt: number;
}

const SavedVerseCard = React.memo(function SavedVerseCard({ verse, index }: { verse: SavedVerseEntry; index: number }) {
  // Expand-on-tap rather than a hard clamp — same pattern as
  // QuranLibraryScreen's VerseCard, so a bookmarked ayah longer than 2/3
  // lines is never permanently clipped with no way to read the rest.
  const [expanded, setExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: 60 + index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: 60 + index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Same rule as ReflectionCard: mood color when there is one (a verse saved
  // from Guidance/a Journey), gold otherwise (a verse bookmarked while
  // reading has no mood attached) — one tinting rule everywhere a saved
  // item shows up, no separate "reader" vs "guidance" look.
  const moodColor = verse.mood ? MOOD_COLORS[verse.mood] : null;
  const moodIcon = verse.mood ? MOOD_ICON[verse.mood] : null;
  const tintColor = moodColor || Colors.accent.primary;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setExpanded(!expanded)}
        style={[styles.savedCard, { borderColor: `${tintColor}40` }]}
        accessibilityRole="button"
        accessibilityLabel={verse.source}
        accessibilityState={{ expanded }}
      >
        <LinearGradient colors={[Colors.background.secondary, Colors.background.primary]} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[`${tintColor}1F`, `${tintColor}05`]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
        />
        <View style={styles.savedCardTop}>
          <View style={styles.savedCardHeader}>
            <MaterialCommunityIcons name="bookmark" size={12} color={tintColor} />
            <Text style={[styles.savedCardSource, { color: `${tintColor}CC` }]}>{verse.source}</Text>
          </View>
          {moodColor && moodIcon && (
            <View style={[styles.savedCardMoodBadge, { backgroundColor: `${moodColor}26` }]}>
              <Ionicons name={moodIcon as any} size={13} color={moodColor} />
            </View>
          )}
        </View>
        <Text style={styles.savedCardDate}>{formatDate(verse.savedAt)}</Text>
        <Text style={styles.savedCardArabic} numberOfLines={expanded ? undefined : 2}>
          {verse.arabicText}
        </Text>
        <Text style={styles.savedCardTranslation} numberOfLines={expanded ? undefined : 3}>
          {verse.translation}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── SurahRow ─────────────────────────────────────────────────────────────────

function SurahRow({
  surah,
  onPress,
  isLastRead,
}: {
  surah: SurahEntry;
  onPress: () => void;
  isLastRead: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.surahRow, isLastRead && styles.surahRowLastRead]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${surah.english}${isLastRead ? ', last read' : ''}, ${surah.verses} verses`}
      accessibilityHint="Double tap to open this surah"
    >
      <View style={[styles.surahNumber, isLastRead && styles.surahNumberLastRead]}>
        <MaterialCommunityIcons
          name="star-four-points"
          size={10}
          color={isLastRead ? Colors.accent.primary : 'rgba(212,175,55,0.4)'}
          style={{ position: 'absolute', top: 5, opacity: 0.6 }}
        />
        <Text style={[styles.surahNumberText, isLastRead && styles.surahNumberTextLastRead]}>
          {surah.number}
        </Text>
      </View>
      <View style={styles.surahInfo}>
        <View style={styles.surahNameRow}>
          <Text style={styles.surahEnglish}>{surah.english.toUpperCase()}</Text>
          {isLastRead && (
            <View style={styles.lastReadPill}>
              <Text style={styles.lastReadPillText}>LAST READ</Text>
            </View>
          )}
        </View>
        <Text style={styles.surahVerses}>
          {surah.meaning ? `${surah.meaning} · ` : ''}{surah.verses} verses
        </Text>
      </View>
      <Text style={styles.surahArabic}>{surah.arabic}</Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={16}
        color="rgba(212,175,55,0.35)"
      />
    </TouchableOpacity>
  );
}

// ─── LibraryScreen ────────────────────────────────────────────────────────────

type Tab = 'saved' | 'surahs';

export default function LibraryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedVerses, setSavedVerses] = useState<SavedVerseEntry[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);
  const [dlProgress, setDlProgress] = useState<DownloadProgress | null>(null);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const tabIndicator = useRef(new Animated.Value(0)).current;
  // Guard so prefetchAllSurahs callbacks don't setState on an unmounted component
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    loadSavedVerses();
    loadProgress();
    startQuranDownload().catch(() => {}); // guard — unhandled rejection crashes the dev overlay
    return () => { isMountedRef.current = false; };
  }, []);

  const startQuranDownload = async () => {
    // Check current state first — skip if already complete
    const initial = await getDownloadProgress();
    if (!isMountedRef.current) return;
    setDlProgress(initial);
    if (initial.done) return;

    // Kick off background prefetch — updates progress as each surah lands
    prefetchAllSurahs((progress) => {
      if (isMountedRef.current) setDlProgress(progress);
    }).catch(() => {}); // silent — will retry next time user opens the screen
  };

  // Every "save this verse" action in the app feeds this one list, regardless
  // of where it happened: the bookmark icon in the Quran reader
  // (bookmarked_verses), or "save" while sitting with a verse in
  // Guidance/a Journey (saved_reflections, where an empty `reflection`
  // marks a pure bookmark — a non-empty one is a written reflection and
  // stays in ReflectionHistoryScreen instead).
  const loadSavedVerses = async () => {
    try {
      const [bookmarked, savedReflections] = await Promise.all([
        dbQuery(async (db) =>
          db.getAllAsync<any>(`
            SELECT id, surahNumber, verseNumber, arabicText, translation, surahName, bookmarkedAt
            FROM bookmarked_verses
            ORDER BY bookmarkedAt DESC
          `),
        ),
        ReflectionRepository.getInstance().getAll(),
      ]);

      const readerEntries: SavedVerseEntry[] = bookmarked.map((v) => ({
        id: `reader_${v.id}`,
        arabicText: v.arabicText,
        translation: v.translation,
        source: `${v.surahName} · ${v.verseNumber}`,
        savedAt: v.bookmarkedAt,
      }));

      const guidanceEntries: SavedVerseEntry[] = savedReflections
        .filter((r) => !r.reflection?.trim())
        .map((r) => ({
          id: `guidance_${r.id}`,
          arabicText: r.arabicText || '',
          translation: r.englishTranslation,
          source: r.source,
          mood: r.mood as Mood,
          savedAt: r.timestamp,
        }));

      const merged = [...readerEntries, ...guidanceEntries].sort((a, b) => b.savedAt - a.savedAt);
      setSavedVerses(merged);
    } catch {
      setSavedVerses([]);
    } finally {
      setLoadingSaved(false);
    }
  };

  const loadProgress = async () => {
    try {
      const prog = await loadReadingProgress();
      setReadingProgress(prog);
    } catch {}
  };

  const switchTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    Animated.spring(tabIndicator, {
      toValue: tab === 'saved' ? 0 : 1,
      friction: 8,
      tension: 100,
      useNativeDriver: false,
    }).start();
  }, []);

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return SURAH_LIST;
    const q = searchQuery.toLowerCase();
    return SURAH_LIST.filter(
      (s) =>
        s.english.toLowerCase().includes(q) ||
        s.arabic.includes(q) ||
        s.meaning.toLowerCase().includes(q) ||
        s.number.toString().includes(q),
    );
  }, [searchQuery]);

  const indicatorLeft = tabIndicator.interpolate({
    inputRange: [0, 1],
    outputRange: ['3%', '52%'],
  });

  const openSurah = useCallback((surah: SurahEntry) => {
    navigation.navigate('SurahReader', {
      surahNumber: surah.number,
      surahName: surah.english,
      surahArabic: surah.arabic,
      verseCount: surah.verses,
    });
  }, [navigation]);

  const continueReading = useCallback(() => {
    if (!readingProgress) return;
    const surah = SURAH_LIST[readingProgress.surahNumber - 1];
    if (surah) openSurah(surah);
  }, [readingProgress, openSurah]);

  const renderSurahItem = useCallback(({ item }: { item: SurahEntry }) => (
    <SurahRow
      surah={item}
      onPress={() => openSurah(item)}
      isLastRead={readingProgress?.surahNumber === item.number}
    />
  ), [openSurah, readingProgress]);

  const renderSavedVerse = useCallback(({ item, index }: { item: SavedVerseEntry; index: number }) => (
    <SavedVerseCard key={item.id} verse={item} index={index} />
  ), []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.celestialWash}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {STARS.map((star, i) => (
        <TwinklingStar
          key={i}
          x={star.x}
          y={star.y}
          size={star.size}
          delay={star.delay}
          color={Colors.accent.primary}
        />
      ))}

      <View style={styles.mandalaWrap} pointerEvents="none">
        <AnimatedMandala size={260} color={Colors.accent.primary} opacity={0.10} />
      </View>

      {/* ── Header ──────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + Spacing.lg, opacity: headerOpacity }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerPretitle}>QURANIC LIBRARY</Text>
            <Text style={styles.headerTitle}>Sacred Words</Text>
            <Text style={styles.headerSub}>Complete Quran · Saved Verses · Offline</Text>
          </View>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="book-open-variant"
              size={22}
              color={Colors.accent.primary}
            />
          </View>
        </View>

        {/* Search — frosted so the mandala backdrop blends instead of showing a hard-edged tint */}
        <BlurView intensity={14} tint="dark" style={styles.searchBar}>
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color="rgba(212,175,55,0.5)"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search surahs, number, meaning…"
            placeholderTextColor="rgba(176,196,215,0.35)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={16}
                color="rgba(176,196,215,0.4)"
              />
            </TouchableOpacity>
          )}
        </BlurView>

        {/* Tab switcher — same frosted treatment as the bottom nav pill */}
        <BlurView intensity={14} tint="dark" style={styles.tabSwitcher}>
          <Animated.View style={[styles.tabIndicator, { left: indicatorLeft }]} />
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => switchTab('saved')}
            accessibilityRole="tab"
            accessibilityLabel="Saved verses"
            accessibilityState={{ selected: activeTab === 'saved' }}
          >
            <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
              SAVED VERSES
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => switchTab('surahs')}
            accessibilityRole="tab"
            accessibilityLabel="All surahs"
            accessibilityState={{ selected: activeTab === 'surahs' }}
          >
            <Text style={[styles.tabText, activeTab === 'surahs' && styles.tabTextActive]}>
              ALL SURAHS
            </Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>

      {/* ── Content ─────────────────────────────────────────────── */}
      {activeTab === 'saved' ? (
        loadingSaved ? (
          <ActivityIndicator color={Colors.accent.primary} style={{ marginTop: 60 }} />
        ) : savedVerses.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="bookmark-outline"
              size={52}
              color="rgba(212,175,55,0.25)"
            />
            <Text style={styles.emptyTitle}>No Saved Verses</Text>
            <Text style={styles.emptySub}>
              Bookmark a verse while reading, or save one{'\n'}from Guidance or a Journey — it lands here
            </Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={() => switchTab('surahs')}
              accessibilityRole="button"
              accessibilityLabel="Browse all surahs"
            >
              <Text style={styles.emptyActionText}>Browse All Surahs</Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={14}
                color={Colors.accent.primary}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={savedVerses}
            keyExtractor={(item) => item.id}
            renderItem={renderSavedVerse}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 100 },
            ]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )
      ) : (
        <FlatList
          data={filteredSurahs}
          keyExtractor={(item) => item.number.toString()}
          renderItem={renderSurahItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            searchQuery.trim().length > 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={52}
                  color="rgba(212,175,55,0.25)"
                />
                <Text style={styles.emptyTitle}>No Surahs Found</Text>
                <Text style={styles.emptySub}>
                  Nothing matches “{searchQuery.trim()}”.{'\n'}Try a different name or number.
                </Text>
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => setSearchQuery('')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Text style={styles.emptyActionText}>Clear Search</Text>
                  <MaterialCommunityIcons name="close" size={14} color={Colors.accent.primary} />
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListHeaderComponent={
            <>
              {/* Download progress banner — shown until all 114 surahs are cached */}
              {dlProgress && !dlProgress.done && (
                <TouchableOpacity
                  style={styles.dlBanner}
                  activeOpacity={dlProgress.fetching ? 1 : 0.7}
                  disabled={dlProgress.fetching}
                  onPress={startQuranDownload}
                  accessibilityLabel={dlProgress.fetching ? undefined : 'Retry Quran download'}
                >
                  <View style={styles.dlBannerTop}>
                    {dlProgress.fetching ? (
                      <ActivityIndicator size="small" color={Colors.accent.primary} />
                    ) : (
                      <MaterialCommunityIcons name="refresh" size={16} color={Colors.accent.primary} />
                    )}
                    <Text style={styles.dlBannerTitle}>
                      {dlProgress.fetching ? 'Downloading Quran…' : 'Download paused — tap to retry'}
                    </Text>
                    <Text style={styles.dlBannerCount}>
                      {dlProgress.cached}/{dlProgress.total}
                    </Text>
                  </View>
                  {/* Progress bar */}
                  <View style={styles.dlBarTrack}>
                    <View
                      style={[
                        styles.dlBarFill,
                        { width: `${(dlProgress.cached / dlProgress.total) * 100}%` as any },
                      ]}
                    />
                  </View>
                  <Text style={styles.dlBannerSub}>
                    {dlProgress.fetching
                      ? 'Surahs will be available offline once downloaded'
                      : 'Connection issue stopped the download — tap this banner to try again'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Continue Reading banner */}
              {readingProgress ? (
              <TouchableOpacity
                style={styles.continueReadingCard}
                onPress={continueReading}
                accessibilityRole="button"
                accessibilityLabel={`Continue reading ${readingProgress.surahName}, from verse ${readingProgress.verseIndex + 1}`}
              >
                <LinearGradient colors={[Colors.background.secondary, Colors.background.primary]} style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={[`${Colors.accent.primary}1F`, `${Colors.accent.primary}05`]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  pointerEvents="none"
                />
                <View style={styles.continueReadingLeft}>
                  <MaterialCommunityIcons
                    name="bookmark-check"
                    size={18}
                    color={Colors.accent.primary}
                  />
                  <View>
                    <Text style={styles.continueReadingLabel}>CONTINUE READING</Text>
                    <Text style={styles.continueReadingTitle}>
                      {readingProgress.surahName}
                    </Text>
                    <Text style={styles.continueReadingSub}>
                      From verse {readingProgress.verseIndex + 1}
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={18}
                  color="rgba(212,175,55,0.55)"
                />
              </TouchableOpacity>
              ) : null}
            </>
          }
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={6}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },

  mandalaWrap: {
    position: 'absolute',
    left: width / 2 - 130,
    top: 20,
    zIndex: 0,
  },

  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    zIndex: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPretitle: {
    fontSize: Typography.sizes.label,
    color: 'rgba(212,175,55,0.6)',
    letterSpacing: 2.5,
    marginBottom: 3,
    fontFamily: Typography.fonts.serif,
  },
  headerTitle: {
    fontSize: 26,
    color: Colors.text.primary,
    fontFamily: Typography.fonts.serif,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(176,196,215,0.65)',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
  },

  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 4,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '46%',
    backgroundColor: 'rgba(212,175,55,0.14)',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', zIndex: 1 },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(176,196,215,0.45)',
    letterSpacing: 1.2,
  },
  tabTextActive: { color: Colors.accent.primary },

  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },

  // Continue Reading banner
  continueReadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  continueReadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  continueReadingLabel: {
    fontSize: Typography.sizes.label,
    fontWeight: '700',
    color: 'rgba(212,175,55,0.6)',
    letterSpacing: 1.8,
    marginBottom: 2,
  },
  continueReadingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  continueReadingSub: {
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 2,
  },

  // Saved verse cards — same tinted-gradient/border formula and top-down
  // structure (header+badge / date / body) as ReflectionHistoryScreen's
  // ReflectionCard, so the two screens read as one consistent design
  // language rather than two different card systems.
  savedCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  savedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
    marginRight: Spacing.sm,
  },
  savedCardSource: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  savedCardMoodBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  savedCardDate: {
    fontSize: Typography.sizes.detail - 1,
    color: Colors.text.muted,
    letterSpacing: 0.3,
  },
  savedCardArabic: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 17,
    color: '#EDD9A3',
    textAlign: 'right',
    lineHeight: 30,
    marginTop: Spacing.xs,
  },
  savedCardTranslation: {
    fontSize: 13,
    color: 'rgba(176,196,215,0.65)',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Surah rows
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
    gap: Spacing.md,
    minHeight: 64,
  },
  surahRowLastRead: {
    backgroundColor: 'rgba(212,175,55,0.04)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
  },
  surahNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  surahNumberLastRead: {
    backgroundColor: 'rgba(212,175,55,0.16)',
    borderColor: 'rgba(212,175,55,0.45)',
  },
  surahNumberText: {
    fontSize: 11,
    color: 'rgba(212,175,55,0.75)',
    fontWeight: '700',
    marginTop: 7,
  },
  surahNumberTextLastRead: {
    color: Colors.accent.primary,
  },
  surahInfo: { flex: 1 },
  surahNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  surahEnglish: {
    // Surah name is the primary item label — a clear step above its
    // meaning/verse subtitle (label 11) so a 114-row list stays scannable.
    fontSize: Typography.sizes.small,
    color: Colors.text.primary,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  lastReadPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  lastReadPillText: {
    fontSize: Typography.sizes.label,
    fontWeight: '800',
    color: Colors.accent.primary,
    letterSpacing: 0.8,
  },
  surahVerses: {
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 2,
  },
  surahArabic: {
    fontSize: 17,
    color: 'rgba(212,175,55,0.75)',
    fontFamily: Typography.fonts.arabic,
    marginRight: 4,
  },

  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: 4,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    color: 'rgba(240,230,211,0.55)',
    fontFamily: Typography.fonts.serif,
    fontWeight: '600',
  },
  emptySub: {
    fontSize: 14,
    color: 'rgba(176,196,215,0.55)',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent.primary,
    letterSpacing: 0.5,
  },

  // Download progress banner
  dlBanner: {
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  dlBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dlBannerTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  dlBannerCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent.primary,
  },
  dlBarTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(212,175,55,0.15)',
    overflow: 'hidden',
  },
  dlBarFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.accent.primary,
  },
  dlBannerSub: {
    fontSize: 11,
    color: Colors.text.muted,
    letterSpacing: 0.2,
  },
});
