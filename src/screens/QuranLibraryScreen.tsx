import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Typography, MoodColors } from '../theme/DesignSystem';
import { Content, Mood } from '../types';
import { dbQuery } from '../database/schema';
import { AnimatedMandala } from '../components/AnimatedMandala';
import { TwinklingStar } from '../components/TwinklingStar';

const { width } = Dimensions.get('window');

const STARS = [
  { x: '8%',  y: '4%',  size: 2,   delay: 200 },
  { x: '88%', y: '6%',  size: 1.5, delay: 700 },
  { x: '25%', y: '12%', size: 2.5, delay: 400 },
  { x: '72%', y: '9%',  size: 1.5, delay: 0   },
];

const ALL_MOODS: Mood[] = [
  'Overwhelmed', 'Sad', 'Angry', 'Tired',
  'Lonely', 'Grateful', 'Hopeful', 'Guilty', 'Calm',
];

// Mood dot / card-tint colors come from the single source of truth in
// DesignSystem so the library matches the Home mood grid and the rest of the
// app — no separate palette that drifts out of sync.
const MOOD_COLORS: Record<Mood, string> = Object.fromEntries(
  ALL_MOODS.map((m) => [m, MoodColors[m].accent]),
) as Record<Mood, string>;

interface QuranRow {
  id: string;
  type: string;
  primaryText: string;
  arabicText: string | null;
  transliteration: string | null;
  englishTranslation: string;
  source: string;
  whyThis: string;
  moods_csv: string;
}

function MoodChip({
  mood,
  isSelected,
  count,
  onPress,
}: {
  mood: Mood | 'All';
  isSelected: boolean;
  count: number;
  onPress: () => void;
}) {
  const dotColor = mood === 'All' ? Colors.accent.primary : MOOD_COLORS[mood as Mood];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.chip, isSelected && { borderColor: dotColor, backgroundColor: `${dotColor}18` }]}
      accessibilityRole="button"
      accessibilityLabel={`${mood}, ${count} verses`}
      accessibilityState={{ selected: isSelected }}
    >
      <View style={[styles.chipDot, { backgroundColor: dotColor }]} />
      <Text style={[styles.chipLabel, isSelected && { color: Colors.text.primary }]}>
        {mood}
      </Text>
      <Text style={[styles.chipCount, isSelected && { color: dotColor }]}>
        {count}
      </Text>
    </TouchableOpacity>
  );
}

function VerseCard({ verse }: { verse: Content }) {
  const [expanded, setExpanded] = useState(false);
  // Same tinted-gradient card treatment as the Home streak/journey cards —
  // tinted with the verse's own primary mood so the library keeps that
  // mood-color variety instead of one flat panel per card.
  const tint = verse.moods[0] ? MOOD_COLORS[verse.moods[0]] : Colors.accent.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => setExpanded(!expanded)}
      accessibilityRole="button"
      accessibilityLabel={verse.source}
      accessibilityState={{ expanded }}
    >
      <View style={[styles.card, { borderColor: `${tint}40` }]}>
        <LinearGradient colors={[Colors.background.secondary, Colors.background.primary]} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[`${tint}1F`, `${tint}05`]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
        />
        <View style={styles.cardInner}>
          <Text style={styles.cardSource}>{verse.source.toUpperCase()}</Text>

          {verse.arabicText ? (
            <Text style={styles.cardArabic} numberOfLines={expanded ? undefined : 2}>
              {verse.arabicText}
            </Text>
          ) : null}

          <Text style={styles.cardTranslation} numberOfLines={expanded ? undefined : 3}>
            {verse.englishTranslation}
          </Text>

          <View style={styles.cardMoodRow}>
            {verse.moods.map((mood) => (
              <View
                key={mood}
                style={[
                  styles.moodTag,
                  { backgroundColor: `${MOOD_COLORS[mood]}18`, borderColor: `${MOOD_COLORS[mood]}35` },
                ]}
              >
                <View style={[styles.moodTagDot, { backgroundColor: MOOD_COLORS[mood] }]} />
                <Text style={[styles.moodTagText, { color: MOOD_COLORS[mood] }]}>{mood}</Text>
              </View>
            ))}
          </View>

          {expanded && verse.whyThis ? (
            <View style={styles.whySection}>
              <Text style={styles.whyLabel}>WHY THIS VERSE</Text>
              <Text style={styles.whyText}>{verse.whyThis}</Text>
            </View>
          ) : null}

          <View style={styles.chevronRow}>
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path
                d={expanded ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}
                stroke={Colors.text.muted}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function QuranLibraryScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const [selectedMood, setSelectedMood] = useState<Mood | 'All'>('All');
  const [quranVerses, setQuranVerses] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    dbQuery(async (db) => {
      const rows = await db.getAllAsync<QuranRow>(`
        SELECT
          c.id, c.type, c.primaryText, c.arabicText, c.transliteration,
          c.englishTranslation, c.source, c.whyThis,
          GROUP_CONCAT(cm.mood, ',') AS moods_csv
        FROM content c
        INNER JOIN content_moods cm ON c.id = cm.contentId
        WHERE c.type = 'Quran'
        GROUP BY c.id
        ORDER BY c.source ASC
      `);

      return rows.map((row): Content => ({
        id: row.id,
        type: row.type as Content['type'],
        primaryText: row.primaryText,
        arabicText: row.arabicText ?? undefined,
        transliteration: row.transliteration ?? undefined,
        englishTranslation: row.englishTranslation,
        source: row.source,
        whyThis: row.whyThis,
        moods: row.moods_csv ? (row.moods_csv.split(',') as Mood[]) : [],
      }));
    })
      .then(setQuranVerses)
      .catch((err) => console.error('[QuranLibrary] Failed to load from SQLite:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredVerses = useMemo(() => {
    if (selectedMood === 'All') return quranVerses;
    return quranVerses.filter((v) => v.moods.includes(selectedMood));
  }, [selectedMood, quranVerses]);

  const groupedBySurah = useMemo(() => {
    const groups: Record<string, Content[]> = {};
    filteredVerses.forEach((v) => {
      const match = v.source.match(/^Surah\s+(.+?)\s+\d/);
      const surah = match ? match[1] : 'Other';
      if (!groups[surah]) groups[surah] = [];
      groups[surah].push(v);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([surah, verses]) => ({ surah, verses }));
  }, [filteredVerses]);

  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = { All: quranVerses.length };
    ALL_MOODS.forEach((mood) => {
      counts[mood] = quranVerses.filter((v) => v.moods.includes(mood)).length;
    });
    return counts;
  }, [quranVerses]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.celestialWash}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.glowOrb} pointerEvents="none" />

      {STARS.map((star, i) => (
        <TwinklingStar key={i} x={star.x} y={star.y} size={star.size} delay={star.delay} color={Colors.accent.primary} />
      ))}

      <View style={styles.mandalaWrap} pointerEvents="none">
        <AnimatedMandala size={260} color={Colors.accent.primary} opacity={0.10} />
      </View>

      <Animated.View style={[styles.header, { paddingTop: insets.top + Spacing.lg }, { opacity: fadeAnim }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
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
      </Animated.View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={(['All', ...ALL_MOODS] as (Mood | 'All')[])}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.chipRail}
        renderItem={({ item }) => (
          <MoodChip
            mood={item}
            isSelected={selectedMood === item}
            count={moodCounts[item] || 0}
            onPress={() => setSelectedMood(item)}
          />
        )}
      />

      {loading ? (
        <View style={{ flex: 1 }}>
          {/* The title lives in the verse FlatList's ListHeaderComponent
              below, which doesn't exist yet on this branch — `loading` starts
              true, so every fresh mount hits this first. Without its own copy
              here, the first frame of this screen was a back arrow and a mood
              rail over a bare spinner with no indication of what screen it was. */}
          <View style={[styles.listTitle, { paddingHorizontal: Spacing.xl }]}>
            <Text style={styles.headerPretitle}>SACRED WORDS</Text>
            <Text style={styles.headerTitle}>Quran Library</Text>
          </View>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.accent.primary} />
            <Text style={styles.loadingText}>Loading verses…</Text>
          </View>
        </View>
      ) : (
        <FlatList
          style={styles.verseList}
          data={groupedBySurah}
          keyExtractor={(item) => item.surah}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.xxxl }]}
          showsVerticalScrollIndicator={false}
          // Scrolls away; the back arrow and the mood rail above it do not.
          // FlatList still renders this with zero rows, so a filter that
          // matches nothing keeps its title.
          ListHeaderComponent={
            <View style={styles.listTitle}>
              <Text style={styles.headerPretitle}>SACRED WORDS</Text>
              <Text style={styles.headerTitle}>Quran Library</Text>
              <Text style={styles.headerSub}>
                {filteredVerses.length} verse{filteredVerses.length !== 1 ? 's' : ''}
                {selectedMood !== 'All' ? ` · ${selectedMood}` : ''}
              </Text>
            </View>
          }
          renderItem={({ item: group }) => (
            <View style={styles.surahGroup}>
              <Text style={styles.surahHeader}>{group.surah}</Text>
              {group.verses.map((verse) => (
                <VerseCard key={verse.id} verse={verse} />
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },

  glowOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.accent.glow,
    left: width / 2 - 110,
    top: 30,
  },
  mandalaWrap: {
    position: 'absolute',
    left: width / 2 - 130,
    top: 20,
    zIndex: 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
    zIndex: 2,
  },
  // The title block in its list-header position. listContent already supplies
  // the horizontal gutter, so this only owns its bottom gap.
  listTitle: {
    paddingBottom: Spacing.lg,
  },
  backButton: {
    // Bare icon — no circular container (CLAUDE.md nav rule); hitSlop on the
    // TouchableOpacity keeps the 44pt touch target without the visual chrome.
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPretitle: {
    fontSize: Typography.sizes.label,
    color: `${Colors.accent.primary}99`,
    letterSpacing: 2.5,
    marginBottom: 2,
    fontFamily: Typography.fonts.serif,
  },
  headerTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h1,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
    marginTop: 2,
  },

  chipRail: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    zIndex: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.glass.light,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    gap: Spacing.xs,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipLabel: {
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: Colors.text.muted,
    letterSpacing: 0.3,
  },
  chipCount: {
    fontSize: Typography.sizes.detail,
    fontWeight: '700',
    color: Colors.text.muted,
    letterSpacing: 0.3,
  },

  verseList: { flex: 1 },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
  },
  surahGroup: {
    marginBottom: Spacing.xxl,
  },
  surahHeader: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h2,
    fontWeight: '700',
    color: Colors.accent.primary,
    marginBottom: Spacing.md,
    paddingLeft: Spacing.xs,
  },

  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  cardInner: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardSource: {
    fontSize: Typography.sizes.label,
    fontWeight: '700',
    color: `${Colors.accent.primary}CC`,
    letterSpacing: 0.8,
  },
  cardArabic: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 20,
    color: Colors.text.primary,
    textAlign: 'right',
    lineHeight: 38,
  },
  cardTranslation: {
    fontSize: Typography.sizes.small,
    color: Colors.text.secondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  cardMoodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  moodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: 5,
  },
  moodTagDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  moodTagText: {
    fontSize: Typography.sizes.label,
    fontWeight: '600',
  },
  whySection: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.glass.border,
    gap: Spacing.xs,
  },
  whyLabel: {
    fontSize: Typography.sizes.label,
    fontWeight: '700',
    color: `${Colors.accent.primary}CC`,
    letterSpacing: 0.8,
  },
  whyText: {
    fontSize: Typography.sizes.small,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  chevronRow: {
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  loadingText: {
    fontSize: Typography.sizes.small,
    color: Colors.text.muted,
    fontStyle: 'italic',
  },
});
