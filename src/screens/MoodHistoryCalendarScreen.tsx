import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formatDateYMD } from '../utils/date';
import { Colors } from '../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Mood } from '../types';
import { moodLabel } from '../constants';
import {
  moodHistoryService,
  MoodDayEntry,
  MoodDayDetail,
  MoodStats,
  MoodInsight,
} from '../services/moodHistoryService';
import { HapticsService } from '../services/hapticsService';
import { NoReflections } from '../components/EmptyStates';
import { logServiceError } from '../services/errorLoggingService';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Mood visual config ──────────────────────────────────────────────
interface MoodVisual {
  bg: string;
  light: string;
  text: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

// bg + text aligned to the canonical MoodColors accents (DesignSystem) so a
// mood reads as the same colour here as on the Home grid and everywhere else.
// (`light` is currently unused; left in place for the interface.)
const MOOD_VISUALS: Record<Mood, MoodVisual> = {
  Overwhelmed: { bg: '#818CF8', light: '#EEF2FF', text: '#818CF8', icon: 'weather-windy' },
  Sad: { bg: '#94A3B8', light: '#EFF6FF', text: '#94A3B8', icon: 'weather-pouring' },
  Angry: { bg: '#FB923C', light: '#FEF2F2', text: '#FB923C', icon: 'fire' },
  Tired: { bg: '#D6D3D1', light: '#F9FAFB', text: '#D6D3D1', icon: 'power-sleep' },
  Lonely: { bg: '#C084FC', light: '#F0FDFA', text: '#C084FC', icon: 'heart-half-full' },
  Grateful: { bg: '#FBBF24', light: '#F0FDF4', text: '#FBBF24', icon: 'hand-heart' },
  Hopeful: { bg: '#22D3EE', light: '#FFFBEB', text: '#22D3EE', icon: 'white-balance-sunny' },
  Calm: { bg: '#34D399', light: '#ECFDF5', text: '#34D399', icon: 'leaf' },
  Guilty: { bg: '#A3A3A3', light: '#EEF2FF', text: '#A3A3A3', icon: 'refresh' },
};

const getMoodVisual = (mood: string): MoodVisual => MOOD_VISUALS[mood as Mood] || MOOD_VISUALS.Calm;

// ── Helpers ─────────────────────────────────────────────────────────
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${days[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function getStreakInfo(streak: number): { title: string; subtitle: string } {
  if (streak === 0) return { title: 'Just Starting', subtitle: 'Begin your journey today' };
  if (streak <= 3) return { title: 'Building Up', subtitle: 'Every great journey starts with one step' };
  if (streak <= 7) return { title: 'Finding Rhythm', subtitle: "Consistency is building something in you" };
  if (streak <= 14) return { title: 'On Track', subtitle: "You're building something beautiful" };
  return { title: 'On Fire', subtitle: "Keep going — you're building something beautiful" };
}

// ── Twinkling Star ───────────────────────────────────────────────────
function TwinklingStar({
  left,
  top,
  delay,
  size = 3,
}: {
  left: any;
  top: any;
  delay: number;
  size?: number;
}) {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.15,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity, delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FB923C',
        opacity,
      }}
    />
  );
}

// ── Progress Ring ────────────────────────────────────────────────────
function ProgressRing({ progress, size = 110, strokeWidth = 6 }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const animatedOffset = useRef(new Animated.Value(circumference)).current;

  useEffect(() => {
    Animated.timing(animatedOffset, {
      toValue: circumference * (1 - progress / 100),
      duration: 1200,
      delay: 400,
      useNativeDriver: false,
    }).start();
  }, [progress, circumference, animatedOffset]);

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#1E3A5F"
        strokeWidth={strokeWidth}
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#FB923C"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={animatedOffset}
      />
    </Svg>
  );
}

// ── Component ───────────────────────────────────────────────────────
interface MoodHistoryCalendarScreenProps {
  onBack?: () => void;
}

export default function MoodHistoryCalendarScreen({ onBack }: MoodHistoryCalendarScreenProps) {
  const navigation = useNavigation();
  const handleBack = onBack || (() => navigation.goBack());
  const insets = useSafeAreaInsets();
  const topInset = insets?.top ?? 0;
  const bottomInset = insets?.bottom ?? 0;

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [moodData, setMoodData] = useState<Record<string, MoodDayEntry>>({});
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [insights, setInsights] = useState<MoodInsight[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<MoodDayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      const [calendar, statsData, insightsData] = await Promise.all([
        moodHistoryService.getMoodCalendar(currentMonth.year, currentMonth.month),
        moodHistoryService.getStats(),
        moodHistoryService.getInsights(),
      ]);
      setMoodData(calendar);
      setStats(statsData);
      setInsights(insightsData);
    } catch (error) {
      logServiceError('MoodHistoryCalendarScreen', 'loadData', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentMonth.year, currentMonth.month]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleMonthChange = (delta: number) => {
    HapticsService.impactAsync('LIGHT');
    setSelectedDay(null);
    setDayDetail(null);
    setCurrentMonth((prev) => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
      return { year: newYear, month: newMonth };
    });
  };

  const handleDayPress = async (dateStr: string) => {
    if (!moodData[dateStr]) return;
    HapticsService.impactAsync('LIGHT');

    if (selectedDay === dateStr) {
      setSelectedDay(null);
      setDayDetail(null);
      return;
    }

    setSelectedDay(dateStr);
    setLoadingDetail(true);
    try {
      const detail = await moodHistoryService.getDayDetail(dateStr);
      setDayDetail(detail);
    } catch (error) {
      logServiceError('MoodHistoryCalendarScreen', 'loadDayDetail', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── Calendar logic ────────────────────────────────────────────────
  const firstDay = new Date(currentMonth.year, currentMonth.month, 1);
  const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const todayStr = formatDateYMD();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FB923C" />
          <Text style={styles.loadingText}>Loading mood history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { paddingTop: topInset + 12, opacity: headerOpacity }]}>
        {/* Background gradient */}
        <LinearGradient
          colors={['#0E0C18', '#0C1220']}
          style={StyleSheet.absoluteFill}
        />

        {/* Glow orb — top right */}
        <View style={styles.headerGlowOrb} />

        {/* Twinkling stars */}
        <TwinklingStar left="6%"  top={topInset + 6}  delay={0}    size={2.5} />
        <TwinklingStar left="88%" top={topInset + 4}  delay={600}  size={2}   />
        <TwinklingStar left="55%" top={topInset + 2}  delay={1100} size={2}   />
        <TwinklingStar left="30%" top={topInset + 16} delay={400}  size={1.5} />
        <TwinklingStar left="75%" top={topInset + 18} delay={800}  size={1.5} />

        {/* Header row content */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#F0E6D3" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mood History</Text>

        <View style={{ width: 72 }} />
      </Animated.View>

      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FB923C" />
          }
        >
          {/* Hero Streak Card */}
          {stats && (() => {
            const progressPercent = stats.currentStreak > 0
              ? Math.min(((stats.currentStreak % 30) / 30) * 100, 100)
              : 0;
            const { title, subtitle } = getStreakInfo(stats.currentStreak);
            return (
              <View style={styles.heroCard}>
                <View style={styles.heroInner}>
                  {/* Ring */}
                  <View style={styles.ringContainer}>
                    <ProgressRing progress={progressPercent} size={110} strokeWidth={6} />
                    <View style={styles.ringCenter}>
                      <Text style={styles.ringValue}>{stats.currentStreak}</Text>
                      <Text style={styles.ringLabel}>STREAK</Text>
                    </View>
                  </View>

                  {/* Right stats */}
                  <View style={styles.heroRight}>
                    <Text style={styles.heroTitle}>{title}</Text>
                    <Text style={styles.heroSubtitle}>{subtitle}</Text>
                    <View style={styles.heroStats}>
                      <View style={styles.heroStatRow}>
                        <Text style={styles.heroStatLabel}>Total Days</Text>
                        <Text style={[styles.heroStatValue, { color: Colors.accent.primary }]}>
                          {stats.totalDaysTracked}
                        </Text>
                      </View>
                      <View style={styles.heroStatRow}>
                        <Text style={styles.heroStatLabel}>Top Mood</Text>
                        <Text style={[styles.heroStatValue, { color: '#7DD3FC' }]} numberOfLines={1}>
                          {stats.mostCommonMood ? moodLabel(stats.mostCommonMood).substring(0, 9) : '—'}
                        </Text>
                      </View>
                      <View style={styles.heroStatRow}>
                        <Text style={styles.heroStatLabel}>Positive</Text>
                        <Text style={[styles.heroStatValue, { color: '#4ADE80' }]}>
                          {stats.positivePercentage}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.heroDivider} />

                {/* Hadith quote */}
                <Text style={styles.quoteText}>
                  "The most beloved deeds to Allah are those done consistently, even if they are small."
                </Text>
                <Text style={styles.quoteAttrib}>— Prophet Muhammad ﷺ</Text>
              </View>
            );
          })()}

          {/* Calendar */}
          <View style={styles.card}>
            {/* Month Selector */}
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={styles.monthArrow}
                onPress={() => handleMonthChange(-1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="chevron-left" size={24} color="#6A90B0" />
              </TouchableOpacity>

              <Text style={styles.monthTitle}>
                {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
              </Text>

              <TouchableOpacity
                style={styles.monthArrow}
                onPress={() => handleMonthChange(1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="chevron-right" size={24} color="#6A90B0" />
              </TouchableOpacity>
            </View>

            {/* Weekday Headers */}
            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label, i) => (
                <View key={i} style={styles.weekdayCell}>
                  <Text style={styles.weekdayText}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={styles.calendarCell} />;
                }

                const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const entry = moodData[dateStr];
                const isSelected = selectedDay === dateStr;
                const isToday = dateStr === todayStr;
                const visual = entry ? getMoodVisual(entry.mood) : null;

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={[
                      styles.calendarCell,
                      entry && { backgroundColor: visual!.bg + '33' },
                      entry && { borderWidth: 1, borderColor: visual!.bg + '66' },
                      isSelected && styles.calendarCellSelected,
                      isToday && !entry && styles.calendarCellToday,
                    ]}
                    onPress={() => handleDayPress(dateStr)}
                    activeOpacity={entry ? 0.7 : 1}
                    disabled={!entry}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        entry && { color: visual!.text, fontWeight: '700' },
                        !entry && { color: '#2A4060' },
                        isToday && !entry && { color: '#FB923C', fontWeight: '700' },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              {(Object.keys(MOOD_VISUALS) as Mood[]).map((mood) => (
                <View key={mood} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: MOOD_VISUALS[mood].bg }]} />
                  <Text style={styles.legendText}>{moodLabel(mood)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Selected Day Detail */}
          {selectedDay && (
            <View style={styles.card}>
              <View style={styles.dayDetailHeader}>
                <Text style={styles.dayDetailTitle}>{formatDayHeader(selectedDay)}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDay(null);
                    setDayDetail(null);
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#6B8EAE" />
                </TouchableOpacity>
              </View>

              {loadingDetail ? (
                <ActivityIndicator size="small" color="#FB923C" style={{ marginVertical: 20 }} />
              ) : dayDetail ? (
                <>
                  {/* Mood Badge */}
                  <View style={styles.moodBadgeRow}>
                    <View
                      style={[
                        styles.moodBadge,
                        { backgroundColor: getMoodVisual(dayDetail.mood).bg + '33',
                          borderWidth: 1,
                          borderColor: getMoodVisual(dayDetail.mood).bg + '66' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={getMoodVisual(dayDetail.mood).icon}
                        size={20}
                        color={getMoodVisual(dayDetail.mood).bg}
                      />
                    </View>
                    <View>
                      <Text style={styles.moodBadgeLabel}>{moodLabel(dayDetail.mood)}</Text>
                      <Text style={styles.moodBadgeSub}>
                        {dayDetail.entries.length} session
                        {dayDetail.entries.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Entries */}
                  {dayDetail.entries.map((entry, i) => (
                    <View key={i} style={styles.entryItem}>
                      <View style={styles.entryTimeRow}>
                        <Text style={styles.entryTime}>{formatTime(entry.timestamp)}</Text>
                        <View
                          style={[
                            styles.entryMoodDot,
                            { backgroundColor: getMoodVisual(entry.mood).bg },
                          ]}
                        />
                        <Text
                          style={[styles.entryMoodLabel, { color: getMoodVisual(entry.mood).text }]}
                        >
                          {moodLabel(entry.mood)}
                        </Text>
                      </View>

                      {entry.contentSource && (
                        <Text style={styles.entrySource}>{entry.contentSource}</Text>
                      )}

                      {entry.arabicText && (
                        <Text style={styles.entryArabic}>{entry.arabicText}</Text>
                      )}

                      {entry.englishTranslation && (
                        <Text style={styles.entryTranslation} numberOfLines={3}>
                          {entry.englishTranslation}
                        </Text>
                      )}

                      {entry.reflectionText && (
                        <View style={styles.reflectionBox}>
                          <MaterialCommunityIcons
                            name="format-quote-open"
                            size={14}
                            color={Colors.accent.primary}
                          />
                          <Text style={styles.reflectionText}>{entry.reflectionText}</Text>
                        </View>
                      )}

                      {i < dayDetail.entries.length - 1 && <View style={styles.entryDivider} />}
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.noDataText}>No detailed data available for this day.</Text>
              )}
            </View>
          )}

          {/* Mood Distribution */}
          {stats && Object.keys(stats.moodCounts).length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Mood Distribution</Text>
              {Object.entries(stats.moodCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([mood, count]) => {
                  const total = Object.values(stats.moodCounts).reduce((s, c) => s + c, 0);
                  const percentage = Math.round((count / total) * 100);
                  const visual = getMoodVisual(mood);
                  return (
                    <View key={mood} style={styles.distRow}>
                      <View style={styles.distLabelRow}>
                        <View style={[styles.distDot, { backgroundColor: visual.bg }]} />
                        <Text style={styles.distMood}>{moodLabel(mood)}</Text>
                        <Text style={[styles.distCount, { color: visual.text }]}>
                          {count} ({percentage}%)
                        </Text>
                      </View>
                      <View style={styles.distBarBg}>
                        <View
                          style={[
                            styles.distBarFill,
                            { width: `${percentage}%`, backgroundColor: visual.bg },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
            </View>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <View style={styles.insightsSection}>
              <Text style={styles.sectionTitle}>Insights</Text>
              {insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </View>
          )}

          {/* Empty State */}
          {stats && stats.totalDaysTracked === 0 && (
            <NoReflections
              onStartReflecting={() => {
                // TODO: Navigate to home screen for mood selection
              }}
            />
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ── Sub-components ──────────────────────────────────────────────────
function InsightCard({ insight }: { insight: MoodInsight }) {
  const colorMap: Record<string, { bg: string; border: string; iconBg: string; text: string }> = {
    pattern: {
      bg: 'rgba(99,102,241,0.08)',
      border: 'rgba(99,102,241,0.22)',
      iconBg: 'rgba(99,102,241,0.14)',
      text: '#818CF8',
    },
    trend: {
      bg: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.22)',
      iconBg: 'rgba(16,185,129,0.14)',
      text: '#4ADE80',
    },
    streak: {
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.22)',
      iconBg: 'rgba(245,158,11,0.14)',
      text: '#FBBF24',
    },
    tip: {
      bg: 'rgba(59,130,246,0.08)',
      border: 'rgba(59,130,246,0.22)',
      iconBg: 'rgba(59,130,246,0.14)',
      text: '#7DD3FC',
    },
  };
  const colors = colorMap[insight.type] || colorMap.tip;

  return (
    <View style={[styles.insightCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={[styles.insightIcon, { backgroundColor: colors.iconBg }]}>
        <Text style={{ fontSize: 18 }}>{insight.icon}</Text>
      </View>
      <View style={styles.insightContent}>
        <Text style={[styles.insightTitle, { color: colors.text }]}>{insight.title}</Text>
        <Text style={styles.insightDesc}>{insight.description}</Text>
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const CELL_SIZE = Math.floor((width - 48 - 24) / 7); // 48 = padding, 24 = gaps

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C1220',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B8EAE',
    fontWeight: '500',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerGlowOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(251,146,60,0.07)',
    right: -50,
    top: -60,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 72,
  },
  backText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F0E6D3',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F0E6D3',
    letterSpacing: -0.3,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#0F1E30',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ringContainer: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: 30,
    fontWeight: '700',
    color: '#F0E6D3',
    lineHeight: 34,
  },
  ringLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FB923C',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  heroRight: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F0E6D3',
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#FB923C',
    marginBottom: 10,
    lineHeight: 17,
  },
  heroStats: {
    gap: 5,
  },
  heroStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroStatLabel: {
    fontSize: 12,
    color: '#6B8EAE',
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(251,146,60,0.12)',
    marginVertical: 14,
  },
  quoteText: {
    fontSize: 12,
    color: '#6B8EAE',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  quoteAttrib: {
    fontSize: 11,
    color: Colors.accent.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.3,
  },

  // Card
  card: {
    backgroundColor: '#0F1E30',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E3A5F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F0E6D3',
    marginBottom: 14,
  },

  // Month Selector
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F0E6D3',
    letterSpacing: -0.2,
  },

  // Weekday
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    width: CELL_SIZE,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2A4A6A',
  },

  // Calendar
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  calendarCellSelected: {
    borderWidth: 2,
    borderColor: '#FB923C',
    transform: [{ scale: 1.08 }],
  },
  calendarCellToday: {
    borderWidth: 2,
    borderColor: '#FB923C',
    borderStyle: 'dashed',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F0E6D3',
  },

  // Legend
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: '#6B8EAE',
    fontWeight: '500',
  },

  // Day Detail
  dayDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dayDetailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F0E6D3',
  },
  moodBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  moodBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodBadgeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F0E6D3',
  },
  moodBadgeSub: {
    fontSize: 12,
    color: '#6B8EAE',
    fontWeight: '500',
  },

  // Entry
  entryItem: {
    marginBottom: 4,
  },
  entryTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  entryTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B8EAE',
  },
  entryMoodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entryMoodLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  entrySource: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent.primary,
    marginBottom: 4,
  },
  entryArabic: {
    fontSize: 22,
    fontFamily: 'Amiri-Quran',
    color: '#F0E6D3',
    textAlign: 'right',
    lineHeight: 38,
    marginBottom: 6,
  },
  entryTranslation: {
    fontSize: 13,
    color: '#6A90B0',
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  reflectionBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(30, 58, 95, 0.5)',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.2)',
  },
  reflectionText: {
    flex: 1,
    fontSize: 13,
    color: '#7DD3FC',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  entryDivider: {
    height: 1,
    backgroundColor: '#1E3A5F',
    marginVertical: 12,
  },
  noDataText: {
    fontSize: 13,
    color: '#6B8EAE',
    textAlign: 'center',
    marginVertical: 16,
  },

  // Distribution
  distRow: {
    marginBottom: 12,
  },
  distLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  distDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  distMood: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#B0C4D8',
  },
  distCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  distBarBg: {
    height: 8,
    backgroundColor: '#1E3A5F',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Insights
  insightsSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F0E6D3',
    marginBottom: 2,
  },
  insightCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  insightDesc: {
    fontSize: 12,
    color: '#6A90B0',
    lineHeight: 18,
  },
});