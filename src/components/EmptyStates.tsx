import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Icon from './Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Types ───────────────────────────────────────────────────────────
interface BaseEmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconSize?: number;
  buttonTitle?: string;
  onButtonPress?: () => void;
  children?: React.ReactNode;
}

// ── Base Empty State Component ───────────────────────────────────────
function BaseEmptyState({
  title,
  subtitle,
  icon,
  iconSize = 56,
  buttonTitle,
  onButtonPress,
  children,
}: BaseEmptyStateProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {icon && (
          <MaterialCommunityIcons name={icon} size={iconSize} color="#D1D5DB" style={styles.icon} />
        )}

        <Text style={styles.title}>{title}</Text>

        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {children}

        {buttonTitle && onButtonPress && (
          <TouchableOpacity style={styles.button} onPress={onButtonPress} activeOpacity={0.85}>
            <Text style={styles.buttonText}>{buttonTitle}</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

// ── No Paths Enrolled ─────────────────────────────────────────────────
export function NoPathsEnrolled({ onBrowsePaths }: { onBrowsePaths: () => void }) {
  return (
    <BaseEmptyState
      title="Begin Your Journey"
      subtitle="You haven't started any guided paths yet. Choose a path to transform your prayer, understand rizq, or strengthen your faith through step-by-step guidance."
      buttonTitle="Explore Guided Paths"
      onButtonPress={onBrowsePaths}
    >
      <View style={styles.pathCategories}>
        <View style={styles.pathCategory}>
          <Icon name="hands-prayer" size={24} color="#8B5CF6" />
          <Text style={styles.pathLabel}>Salah</Text>
        </View>
        <View style={styles.pathCategory}>
          <Icon name="star" size={24} color="#F59E0B" />
          <Text style={styles.pathLabel}>Rizq</Text>
        </View>
        <View style={styles.pathCategory}>
          <Icon name="leaf" size={24} color="#10B981" />
          <Text style={styles.pathLabel}>Growth</Text>
        </View>
      </View>

      {/* Custom SVG path illustration */}
      <View style={styles.pathIllustration}>
        <View style={styles.pathLine} />
        <View style={[styles.pathDot, styles.pathStart]} />
        <View style={[styles.pathDot, styles.pathEnd]} />
        <View style={styles.pathFlag} />
      </View>
    </BaseEmptyState>
  );
}

// ── Streak Broken ───────────────────────────────────────────────────────
export function StreakBroken({
  lastStreak,
  onRestart,
}: {
  lastStreak: number;
  onRestart: () => void;
}) {
  return (
    <BaseEmptyState
      title="Your Streak Ended"
      subtitle={`Your ${lastStreak}-day streak has ended, but that's okay. Every master was once a beginner who kept trying.`}
      buttonTitle="Start New Streak"
      onButtonPress={onRestart}
    >
      {/* Hadith quote */}
      <View style={styles.hadithBox}>
        <Text style={styles.hadithLabel}>Prophet Muhammad ﷺ said:</Text>
        <Text style={styles.hadithText}>
          "The most beloved deed to Allah is the one done regularly, even if it is small."
        </Text>
      </View>

      {/* Streak stats */}
      <View style={styles.streakStats}>
        <Text style={styles.streakStatsLabel}>Your Best Streaks</Text>
        <View style={styles.streakNumbers}>
          <View style={styles.streakNumber}>
            <Text style={styles.streakValue}>{lastStreak}</Text>
            <Text style={styles.streakLabel}>Last streak</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakNumber}>
            <Text style={[styles.streakValue, styles.streakBest]}>{Math.max(lastStreak, 23)}</Text>
            <Text style={styles.streakLabel}>Best ever</Text>
          </View>
        </View>
      </View>

      <Text style={styles.encouragement}>
        Remember: Falling doesn't make you a failure. Refusing to get up does.
      </Text>
    </BaseEmptyState>
  );
}

// ── No Saved Verses ───────────────────────────────────────────────────
export function NoSavedVerses({ onExploreMoods }: { onExploreMoods: () => void }) {
  return (
    <BaseEmptyState
      title="No Saved Verses Yet"
      subtitle="When you find a verse that resonates with you, tap the heart icon 💚 to save it here. Build your personal collection of guidance."
      buttonTitle="Discover Verses"
      onButtonPress={onExploreMoods}
    >
      {/* Book illustration */}
      <View style={styles.bookIllustration}>
        <View style={styles.bookCover}>
          <View style={styles.bookSpine} />
          <View style={styles.bookPages}>
            <View style={styles.bookLine} />
            <View style={styles.bookLine} />
            <View style={styles.bookLine} />
          </View>
        </View>
        <View style={styles.bookHeart}>
          <MaterialCommunityIcons name="heart" size={16} color="#EF4444" />
        </View>
      </View>

      {/* Pro tip */}
      <View style={styles.proTipBox}>
        <Text style={styles.proTipLabel}>💡 Pro Tip</Text>
        <Text style={styles.proTipText}>
          Save verses that speak to your current struggles. Return to them when you need reminder
          and strength.
        </Text>
      </View>
    </BaseEmptyState>
  );
}

// ── First Time Mood Selection ───────────────────────────────────────────
export function FirstTimeMoodSelection() {
  return (
    <BaseEmptyState
      title="Welcome! Let's Get Started"
      subtitle="Pick your current mood below and discover Quranic verses chosen specifically for how you're feeling right now."
    >
      <View style={styles.emojiIcon}>
        <Text style={styles.emojiText}>🌱</Text>
      </View>

      {/* Mood examples */}
      <View style={styles.moodExamples}>
        <View style={styles.moodExample}>
          <Text style={styles.moodExampleIcon}>◇</Text>
          <Text style={styles.moodExampleText}>Feeling overwhelmed?</Text>
        </View>
        <View style={styles.moodExample}>
          <Text style={styles.moodExampleIcon}>◈</Text>
          <Text style={styles.moodExampleText}>Going through sadness?</Text>
        </View>
        <View style={styles.moodExample}>
          <Text style={styles.moodExampleIcon}>✦</Text>
          <Text style={styles.moodExampleText}>Full of gratitude?</Text>
        </View>
      </View>

      {/* How it works */}
      <View style={styles.howItWorksBox}>
        <Text style={styles.howItWorksLabel}>✨ How It Works</Text>
        <Text style={styles.howItWorksText}>
          Each mood has verses, context from scholars, and practical actions you can take today.
          It's like having a spiritual guide in your pocket.
        </Text>
      </View>
    </BaseEmptyState>
  );
}

// ── No Reflections ─────────────────────────────────────────────────────
export function NoReflections({ onStartReflecting }: { onStartReflecting: () => void }) {
  return (
    <BaseEmptyState
      title="Start Your Spiritual Journal"
      subtitle="Reflections help you process your feelings and track your spiritual growth. Write your thoughts after reading verses or completing path lessons."
      buttonTitle="Write First Reflection"
      onButtonPress={onStartReflecting}
    >
      {/* Journal illustration */}
      <View style={styles.journalIllustration}>
        <View style={styles.journalCover}>
          <View style={styles.journalLines}>
            <View style={styles.journalLine} />
            <View style={styles.journalLine} />
            <View style={styles.journalLine} />
          </View>
        </View>
        <View style={styles.journalPen}>
          <View style={styles.journalPenLine} />
        </View>
      </View>

      {/* Research stat */}
      <View style={styles.researchBox}>
        <Text style={styles.researchLabel}>
          <Text style={styles.researchLabelBold}>Research shows</Text> that journaling about your
          faith increases gratitude by 25% and reduces anxiety by 30%.
        </Text>
      </View>
    </BaseEmptyState>
  );
}

// ── Search No Results ───────────────────────────────────────────────────
export function SearchNoResults({
  searchQuery,
  onClearSearch,
}: {
  searchQuery: string;
  onClearSearch: () => void;
}) {
  return (
    <BaseEmptyState
      title="No Results Found"
      subtitle={`We couldn't find anything matching "${searchQuery}"`}
      icon="magnify"
    >
      <View style={styles.searchSuggestions}>
        <Text style={styles.searchSuggestionsLabel}>Try:</Text>
        <Text style={styles.searchSuggestion}>• Using different keywords</Text>
        <Text style={styles.searchSuggestion}>• Checking your spelling</Text>
        <Text style={styles.searchSuggestion}>• Searching for a mood instead</Text>
      </View>

      <TouchableOpacity onPress={onClearSearch} style={styles.clearSearchButton}>
        <Text style={styles.clearSearchText}>Clear search</Text>
      </TouchableOpacity>
    </BaseEmptyState>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
    minHeight: 400,
  },
  content: {
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH - 48,
    width: '100%',
    gap: 16,
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonIcon: {
    transform: [{ rotate: '-45deg' }],
  },

  // Path Categories
  pathCategories: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  pathCategory: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pathLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Path Illustration
  pathIllustration: {
    width: 120,
    height: 120,
    position: 'relative',
    marginBottom: 16,
  },
  pathLine: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 80,
    height: 2,
    backgroundColor: '#8B5CF6',
    borderRadius: 1,
  },
  pathDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pathStart: {
    top: 34,
    left: 14,
    backgroundColor: '#8B5CF6',
  },
  pathEnd: {
    top: 34,
    left: 94,
    backgroundColor: '#6366F1',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pathFlag: {
    position: 'absolute',
    top: 24,
    left: 100,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: '#10B981',
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    borderRightWidth: 6,
    borderRightColor: 'transparent',
  },

  // Hadith Box
  hadithBox: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  hadithLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  hadithText: {
    fontSize: 13,
    color: '#78716C',
    lineHeight: 18,
  },

  // Streak Stats
  streakStats: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  streakStatsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  streakNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  streakNumber: {
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  streakBest: {
    color: '#10B981',
  },
  streakLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  encouragement: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },

  // Book Illustration
  bookIllustration: {
    width: 100,
    height: 100,
    position: 'relative',
    marginBottom: 16,
  },
  bookCover: {
    position: 'absolute',
    width: 80,
    height: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    left: 10,
  },
  bookSpine: {
    position: 'absolute',
    width: 2,
    height: 100,
    backgroundColor: '#047857',
    left: 49,
  },
  bookPages: {
    position: 'absolute',
    left: 20,
    top: 20,
    gap: 8,
  },
  bookLine: {
    width: 60,
    height: 2,
    backgroundColor: '#9CA3AF',
    borderRadius: 1,
  },
  bookHeart: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },

  // Pro Tip
  proTipBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
  },
  proTipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 2,
  },
  proTipText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
    flex: 1,
  },

  // Emoji
  emojiIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emojiText: {
    fontSize: 48,
  },

  // Mood Examples
  moodExamples: {
    gap: 8,
    width: '100%',
  },
  moodExample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  moodExampleIcon: {
    fontSize: 20,
  },
  moodExampleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },

  // How It Works
  howItWorksBox: {
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
  },
  howItWorksLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5B21B6',
    marginBottom: 2,
  },
  howItWorksText: {
    fontSize: 13,
    color: '#6366F1',
    lineHeight: 18,
    flex: 1,
  },

  // Journal Illustration
  journalIllustration: {
    width: 100,
    height: 100,
    position: 'relative',
    marginBottom: 16,
  },
  journalCover: {
    position: 'absolute',
    width: 80,
    height: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    left: 10,
  },
  journalLines: {
    position: 'absolute',
    left: 20,
    top: 20,
    gap: 8,
  },
  journalLine: {
    width: 40,
    height: 2,
    backgroundColor: '#9CA3AF',
    borderRadius: 1,
  },
  journalPen: {
    position: 'absolute',
    top: 40,
    right: 5,
    width: 30,
    height: 4,
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  journalPenLine: {
    width: 30,
    height: 4,
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },

  // Research Box
  researchBox: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  researchLabel: {
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 18,
  },
  researchLabelBold: {
    fontWeight: '600',
  },

  // Search Suggestions
  searchSuggestions: {
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 16,
  },
  searchSuggestionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  searchSuggestion: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },

  // Clear Search
  clearSearchButton: {
    marginTop: 8,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
});
