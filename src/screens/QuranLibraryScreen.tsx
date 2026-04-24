import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { quranContent } from '../data/quranData';
import { Content, Mood } from '../types';

const { width } = Dimensions.get('window');

const ALL_MOODS: Mood[] = [
  'Overwhelmed',
  'Sad',
  'Angry',
  'Tired',
  'Lonely',
  'Grateful',
  'Hopeful',
  'Guilty',
  'Calm',
];

const MOOD_COLORS: Record<Mood, string> = {
  Overwhelmed: '#14B8A6',
  Sad: '#60A5FA',
  Angry: '#F87171',
  Tired: '#9CA3AF',
  Lonely: '#A78BFA',
  Grateful: '#34D399',
  Hopeful: '#FBBF24',
  Guilty: '#818CF8',
  Calm: '#22D3EE',
};

/**
 * QURAN LIBRARY SCREEN
 *
 * Browse all Quranic verses in the app, filterable by mood.
 * Premium dark design with glassmorphic cards.
 */
export default function QuranLibraryScreen({ navigation }: { navigation: any }) {
  const [selectedMood, setSelectedMood] = useState<Mood | 'All'>('All');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Filter only Quran content
  const quranVerses = useMemo(() => {
    return quranContent.filter((c: Content) => c.type === 'Quran');
  }, []);

  // Group by surah
  const filteredVerses = useMemo(() => {
    if (selectedMood === 'All') return quranVerses;
    return quranVerses.filter((v: Content) => v.moods.includes(selectedMood));
  }, [selectedMood, quranVerses]);

  // Organize by surah for section display
  const groupedBySurah = useMemo(() => {
    const groups: Record<string, Content[]> = {};
    filteredVerses.forEach((v: Content) => {
      // Extract surah name from source like "Surah Al-Baqarah 2:255"
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
      counts[mood] = quranVerses.filter((v: Content) => v.moods.includes(mood)).length;
    });
    return counts;
  }, [quranVerses]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0B0F12', '#121A1F', '#0F1519']} style={styles.gradient}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke="#D4A574"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Quran Library</Text>
            <Text style={styles.headerSubtitle}>
              {filteredVerses.length} verses
              {selectedMood !== 'All' ? ` · ${selectedMood}` : ''}
            </Text>
          </View>
        </Animated.View>

        {/* Mood Filter Chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...ALL_MOODS] as (Mood | 'All')[]}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterContainer}
          renderItem={({ item }) => (
            <MoodChip
              mood={item}
              isSelected={selectedMood === item}
              count={moodCounts[item] || 0}
              onPress={() => setSelectedMood(item)}
            />
          )}
        />

        {/* Verse List */}
        <FlatList
          data={groupedBySurah}
          keyExtractor={(item) => item.surah}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group }) => (
            <View style={styles.surahGroup}>
              <Text style={styles.surahHeader}>{group.surah}</Text>
              {group.verses.map((verse) => (
                <VerseCard key={verse.id} verse={verse} />
              ))}
            </View>
          )}
        />
      </LinearGradient>
    </View>
  );
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
  const color = mood === 'All' ? '#D4A574' : MOOD_COLORS[mood as Mood];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {isSelected ? (
        <View
          style={[
            styles.chipSelected,
            {
              backgroundColor: color,
              shadowColor: color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            },
          ]}
        >
          <Text style={styles.chipTextSelected}>
            {mood} ({count})
          </Text>
        </View>
      ) : (
        <View style={styles.chipUnselected}>
          <Text style={[styles.chipText, { color: 'rgba(229, 221, 213, 0.7)' }]}>{mood}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function VerseCard({ verse }: { verse: Content }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => setExpanded(!expanded)}>
      <View style={styles.verseCard}>
        <BlurView intensity={12} tint="dark" style={styles.verseBlur}>
          <View style={styles.verseInner}>
            {/* Source / reference */}
            <Text style={styles.verseSource}>{verse.source}</Text>

            {/* Arabic text */}
            {verse.arabicText && (
              <Text style={styles.verseArabic} numberOfLines={expanded ? undefined : 2}>
                {verse.arabicText}
              </Text>
            )}

            {/* Translation */}
            <Text style={styles.verseTranslation} numberOfLines={expanded ? undefined : 3}>
              {verse.englishTranslation}
            </Text>

            {/* Mood tags */}
            <View style={styles.moodTags}>
              {verse.moods.map((mood) => (
                <View
                  key={mood}
                  style={[
                    styles.moodTag,
                    {
                      backgroundColor: `${MOOD_COLORS[mood]}20`,
                      borderColor: `${MOOD_COLORS[mood]}40`,
                    },
                  ]}
                >
                  <Text style={[styles.moodTagText, { color: MOOD_COLORS[mood] }]}>{mood}</Text>
                </View>
              ))}
            </View>

            {/* Expanded content */}
            {expanded && verse.whyThis ? (
              <View style={styles.expandedSection}>
                <Text style={styles.whyThisLabel}>Why This Verse</Text>
                <Text style={styles.whyThisText}>{verse.whyThis}</Text>
              </View>
            ) : null}

            {/* Expand indicator */}
            <Text style={styles.expandHint}>{expanded ? 'Tap to collapse' : 'Tap to expand'}</Text>
          </View>
        </BlurView>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF5E9',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(229, 221, 213, 0.5)',
    marginTop: 2,
  },
  filterContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 8,
  },
  chipSelected: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipTextSelected: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B0F12',
  },
  chipUnselected: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  surahGroup: {
    marginBottom: 24,
  },
  surahHeader: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 18,
    fontWeight: '700',
    color: '#D4A574',
    marginBottom: 12,
    paddingLeft: 4,
  },
  verseCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  verseBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  verseInner: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    gap: 10,
  },
  verseSource: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(212, 165, 116, 0.8)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  verseArabic: {
    fontSize: 20,
    color: '#FFF5E9',
    textAlign: 'right',
    lineHeight: 36,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  verseTranslation: {
    fontSize: 14,
    color: 'rgba(229, 221, 213, 0.75)',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  moodTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  moodTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  moodTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandedSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  whyThisLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4A574',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  whyThisText: {
    fontSize: 14,
    color: 'rgba(229, 221, 213, 0.7)',
    lineHeight: 22,
  },
  expandHint: {
    fontSize: 11,
    color: 'rgba(229, 221, 213, 0.3)',
    textAlign: 'center',
    marginTop: 4,
  },
});
