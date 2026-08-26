import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formatDateYMD } from '../utils/date';
import { Colors, BorderRadius, Spacing, Typography, MoodColors } from '../theme/DesignSystem';
import { AnimatedMandala } from '../components/AnimatedMandala';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SubscriptionService } from '../services/subscriptionService';
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
import { useReduceMotion } from '../hooks/useReduceMotion';
import { FreemiumService, PREMIUM_HISTORY_WINDOW_DAYS } from '../services/freemiumService';
import { HistoryWindowNotice } from '../components/HistoryWindowNotice';
import { isDayVisible, isMonthBrowsable } from '../utils/historyWindow';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Mood visual config ──────────────────────────────────────────────
interface MoodVisual {
  bg: string;
  light: string;
  text: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

// Only the icon is calendar-specific; the colour is DERIVED from the canonical
// MoodColors accent rather than copied, so a mood reads as the same colour here
// as on the Home grid and everywhere else.
//
// It used to be a hardcoded copy carrying that same claim in a comment, and
// three of the nine had silently drifted off it: Sad #94A3B8 (canonical
// #7BA3D0), Tired #D6D3D1 (#C99A93) and Guilty #A3A3A3 (#C4708C). All three
// drifted the same way — toward neutral grey — so on the calendar they were
// indistinguishable from each other and nearly invisible on the dark card,
// while the six that matched stayed clearly separable. DesignSystem's own note
// on this palette says each mood owns a distinct hue "spread far enough apart
// to stay separable"; the copy is what broke that, so there is no copy now.
// (`light` is currently unused; left in place for the interface.)
const MOOD_ICONS: Record<Mood, MoodVisual['icon']> = {
  Overwhelmed: 'weather-windy',
  Sad: 'weather-pouring',
  Angry: 'fire',
  Tired: 'power-sleep',
  Lonely: 'heart-half-full',
  Grateful: 'hand-heart',
  Hopeful: 'white-balance-sunny',
  Calm: 'leaf',
  Guilty: 'refresh',
};

const MOOD_VISUALS: Record<Mood, MoodVisual> = Object.fromEntries(
  (Object.keys(MOOD_ICONS) as Mood[]).map((mood) => {
    const accent = MoodColors[mood].accent;
    return [mood, { bg: accent, light: accent, text: accent, icon: MOOD_ICONS[mood] }];
  }),
) as Record<Mood, MoodVisual>;

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
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) return;
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
  }, [opacity, delay, reduceMotion]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.accent.primary,
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
        stroke={Colors.accent.primary}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={animatedOffset}
      />
    </Svg>
  );
}

// ── Card surface ──────────────────────────────────────────────────
// Same neutral-base + low-alpha diagonal accent-tint recipe used across the
// app's other cards (StreakBar, Verse of the Day, mood grid), applied here
// so Calendar/Day-Detail/Distribution share the same visual language.
function CardSurface({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={style}>
      <LinearGradient
        colors={[Colors.background.secondary, Colors.background.primary]}
        style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.xl }]}
      />
      <LinearGradient
        colors={[`${Colors.accent.primary}1F`, `${Colors.accent.primary}05`]}
        style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.xl }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

// ── Component ───────────────────────────────────────────────────────
interface MoodHistoryCalendarScreenProps {
  onBack?: () => void;
}

export default function MoodHistoryCalendarScreen({ onBack }: MoodHistoryCalendarScreenProps) {
  const navigation = useNavigation<any>();
  const handleBack = onBack || (() => navigation.goBack());
  const insets = useSafeAreaInsets();
  const topInset = insets?.top ?? 0;
  const bottomInset = insets?.bottom ?? 0;

  const [isPremium, setIsPremium] = useState(() => SubscriptionService.getInstance().isPremium());
  // How far back this tier may browse. Kept in state alongside isPremium so a
  // purchase widens the calendar on the next focus without an app restart.
  const [windowDays, setWindowDays] = useState(
    () => FreemiumService.getInstance().getCurrentLimits().historyWindowDays,
  );

  useFocusEffect(
    useCallback(() => {
      setIsPremium(SubscriptionService.getInstance().isPremium());
      setWindowDays(FreemiumService.getInstance().getCurrentLimits().historyWindowDays);
    }, [])
  );

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
  // Which entries (by index within the open day) have their translation
  // expanded past the 3-line preview. Keyed by index since a day can have
  // multiple entries; reset whenever a different day's detail loads.
  const [expandedTranslations, setExpandedTranslations] = useState<Set<number>>(new Set());

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      // getStatsAndInsights is ONE history read. This used to be three: stats
      // and insights side by side here, plus getInsights re-fetching stats
      // internally because nothing passed its precomputedStats argument.
      // Insights analyse the same span the tier can browse: a subscriber who
      // can open 90 days of calendar should not be told about 30. Read fresh
      // rather than from state so a purchase this session widens both at once.
      const insightWindow = FreemiumService.getInstance().getCurrentLimits().historyWindowDays;
      const [calendar, derived] = await Promise.all([
        moodHistoryService.getMoodCalendar(currentMonth.year, currentMonth.month),
        moodHistoryService.getStatsAndInsights(insightWindow),
      ]);
      setMoodData(calendar);
      setStats(derived.stats);
      setInsights(derived.insights);
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

  // This screen lives inside the bottom tab navigator and never unmounts on a
  // tab switch — without this, checking in a mood on Home while this tab was
  // already mounted left the calendar, streak ring, and insights showing
  // pre-check-in data until the app was fully restarted (the same staleness
  // PathsScreen/PathDetailScreen already guard against for their own progress
  // data via useFocusEffect). No setLoading(true) here — refresh silently so
  // returning to an already-loaded tab doesn't flash the full-screen spinner
  // over content that's still valid most of the time.
  // hasFocusedRef skips the first focus (mount already loaded via the plain
  // useEffect above) — same guard LibraryScreen uses for the identical reason.
  const hasFocusedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedRef.current) { hasFocusedRef.current = true; return; }
      loadData();
    }, [loadData]),
  );

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

  // Where the arrows stop. Backwards: the tier window. Forwards: today —
  // paging into next year was possible and showed empty grids forever.
  const stepMonth = (delta: number) => {
    let month = currentMonth.month + delta;
    let year = currentMonth.year;
    if (month > 11) { month = 0; year++; }
    if (month < 0) { month = 11; year--; }
    return { year, month };
  };
  const prevTarget = stepMonth(-1);
  const nextTarget = stepMonth(1);
  const canGoBack = isMonthBrowsable(prevTarget.year, prevTarget.month, windowDays);
  const canGoForward = isMonthBrowsable(nextTarget.year, nextTarget.month, windowDays);

  const handleMonthChange = (delta: number) => {
    const target = delta < 0 ? prevTarget : nextTarget;
    if (!isMonthBrowsable(target.year, target.month, windowDays)) return;
    HapticsService.impactAsync('LIGHT');
    setSelectedDay(null);
    setDayDetail(null);
    setCurrentMonth(target);
  };

  const handleDayPress = async (dateStr: string) => {
    if (!moodData[dateStr]) return;
    // Belt and braces: the cell is already disabled, but a day outside the
    // window must never reach getDayDetail and render its verse.
    if (!isDayVisible(dateStr, windowDays)) return;
    HapticsService.impactAsync('LIGHT');

    if (selectedDay === dateStr) {
      setSelectedDay(null);
      setDayDetail(null);
      return;
    }

    setSelectedDay(dateStr);
    setLoadingDetail(true);
    setExpandedTranslations(new Set());
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
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          <Text style={styles.loadingText}>Loading mood history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={Colors.celestialWash}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Twinkling stars at screen level */}
      <TwinklingStar left="6%"  top={topInset + 6}  delay={0}    size={2.5} />
      <TwinklingStar left="88%" top={topInset + 4}  delay={600}  size={2}   />
      <TwinklingStar left="55%" top={topInset + 2}  delay={1100} size={2}   />
      <TwinklingStar left="30%" top={topInset + 16} delay={400}  size={1.5} />
      <TwinklingStar left="75%" top={topInset + 18} delay={800}  size={1.5} />

      {/* Celestial texture — matches Library/Paths backdrop */}
      <View style={styles.mandalaWrap} pointerEvents="none">
        <AnimatedMandala size={280} color={Colors.accent.primary} opacity={0.07} />
      </View>

      {/* Header */}
      <Animated.View style={[styles.header, { paddingTop: topInset + Spacing.md, opacity: headerOpacity }]}>
        {/* Back Button Row */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#F0E6D3" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Header Text Block consistent with Reflections/Sacred Journeys */}
        <View style={styles.headerText}>
          <Text style={styles.headerPretitle}>YOUR EMOTIONAL LANDSCAPE</Text>
          <Text style={styles.headerTitle}>Mood History</Text>
          <View style={styles.privacyRow}>
            <MaterialCommunityIcons name="lock" size={12} color={`${Colors.accent.primary}99`} />
            <Text style={styles.privacyText}>Encrypted · Local only · Never shared</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
        <ScrollView
          style={styles.scrollView}
          // Matches the floating tab bar's clearance on Home/Journeys/Library
          // (insets.bottom + 100). This screen used +40, which left the
          // calendar's date cells resting directly behind the pill at rest,
          // not just passing under it mid-scroll.
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent.primary} />
          }
        >
          {/* Hero Streak Card */}
          {stats && (() => {
            // The ring tracks progress through a 30-day cycle. A plain `% 30`
            // sent day 30 (and 60, and 90) back to an EMPTY ring — reaching the
            // milestone looked like losing the streak. Shifting by one keeps day
            // 30 at a full ring and starts the next cycle on day 31.
            const cycleDay = stats.currentStreak > 0
              ? ((stats.currentStreak - 1) % 30) + 1
              : 0;
            const progressPercent = (cycleDay / 30) * 100;
            const { title, subtitle } = getStreakInfo(stats.currentStreak);
            return (
              <View style={styles.heroCard}>
                <LinearGradient
                  colors={[Colors.background.secondary, Colors.background.primary]}
                  style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.xl }]}
                />
                <LinearGradient
                  colors={[`${Colors.accent.primary}1F`, `${Colors.accent.primary}08`]}
                  style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.xl }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  pointerEvents="none"
                />
                <View style={styles.heroInner}>
                  {/* Ring */}
                  <View
                    style={styles.ringContainer}
                    accessibilityRole="progressbar"
                    accessibilityLabel={`${stats.currentStreak} day streak, day ${cycleDay} of a 30 day cycle`}
                  >
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
                    {/* These three are all-time, while the Insights below speak
                        for the last 30 days and the calendar shows only what the
                        tier window allows. Three different spans on one screen,
                        so each says which it is. */}
                    <Text style={styles.heroStatsScope}>ALL TIME</Text>
                    <View style={styles.heroStats}>
                      <View style={styles.heroStatRow}>
                        <Text style={styles.heroStatLabel}>Total Days</Text>
                        <Text style={[styles.heroStatValue, { color: Colors.accent.primary }]}>
                          {stats.totalDaysTracked}
                        </Text>
                      </View>
                      <View style={styles.heroStatRow}>
                        <Text style={styles.heroStatLabel}>Top Mood</Text>
                        {/* No substring: slicing to 9 chars rendered "Overwhelmed"
                            as "Overwhelm" with no ellipsis. numberOfLines already
                            bounds this, and flexShrink lets it ellipsize properly
                            on a narrow screen instead of clipping mid-word. */}
                        {/* The mood is coloured with its OWN canonical accent from
                            MoodColors, so "Grateful" here is the same amber as the
                            Home grid and the calendar cell. It used to be #7DD3FC,
                            one of the four invented families removed below. */}
                        <Text
                          style={[
                            styles.heroStatValue,
                            styles.heroStatValueMood,
                            stats.mostCommonMood
                              ? { color: getMoodVisual(stats.mostCommonMood).bg }
                              : { color: Colors.text.muted },
                          ]}
                          numberOfLines={1}
                        >
                          {stats.mostCommonMood ? moodLabel(stats.mostCommonMood) : '—'}
                        </Text>
                      </View>
                      <View style={styles.heroStatRow}>
                        <Text style={styles.heroStatLabel}>Positive</Text>
                        <Text style={[styles.heroStatValue, { color: Colors.status.success }]}>
                          {stats.positivePercentage}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.heroDivider} />

                {/* Hadith quote */}
                {/* Verbatim first sentence of Bukhari 39, which stands alone as a
                    complete statement. It replaced an uncited paraphrase of the
                    "most beloved deeds are the most regular" hadith — that had no
                    collection or number (CLAUDE.md requires both for anything in
                    quotation marks), AND the Insights streak card below already
                    quotes it properly as Bukhari 6465, so citing it here would
                    have printed one hadith twice on a single screen. This one is
                    a better fit for a streak card anyway: it warns against
                    overburdening rather than urging more. */}
                <Text style={styles.quoteText}>
                  &quot;Religion is very easy and whoever overburdens himself in his religion will not be able to continue in that way.&quot;
                </Text>
                <Text style={styles.quoteAttrib}>— Prophet Muhammad ﷺ · Sahih al-Bukhari 39</Text>
              </View>
            );
          })()}

          {/* Calendar */}
          <CardSurface style={styles.card}>
            {/* Month Selector */}
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={styles.monthArrow}
                onPress={() => handleMonthChange(-1)}
                activeOpacity={0.7}
                disabled={!canGoBack}
                accessibilityRole="button"
                accessibilityLabel={
                  canGoBack
                    ? 'Previous month'
                    : `Earlier months need Sakina Pro — you can browse ${windowDays} days`
                }
                accessibilityState={{ disabled: !canGoBack }}
              >
                {/* Disabled nav icons dim the ICON and never change the container
                    shape — the nav rule in CLAUDE.md. */}
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={24}
                  color={canGoBack ? '#6A90B0' : Colors.text.muted}
                  style={{ opacity: canGoBack ? 1 : 0.35 }}
                />
              </TouchableOpacity>

              <Text style={styles.monthTitle}>
                {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
              </Text>

              <TouchableOpacity
                style={styles.monthArrow}
                onPress={() => handleMonthChange(1)}
                activeOpacity={0.7}
                disabled={!canGoForward}
                accessibilityRole="button"
                accessibilityLabel="Next month"
                accessibilityState={{ disabled: !canGoForward }}
              >
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={canGoForward ? '#6A90B0' : Colors.text.muted}
                  style={{ opacity: canGoForward ? 1 : 0.35 }}
                />
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
                // A day outside the tier window is LOCKED, which is a different
                // state from "you did not check in". Rendering it blank would tell
                // the user their history is gone; it is not, it is behind the
                // window. Locked therefore wins over entry styling below.
                const isLocked = !isDayVisible(dateStr, windowDays);
                const visual = entry && !isLocked ? getMoodVisual(entry.mood) : null;

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={styles.calendarCell}
                    onPress={() => handleDayPress(dateStr)}
                    activeOpacity={entry && !isLocked ? 0.7 : 1}
                    disabled={!entry || isLocked}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isLocked
                        ? `${MONTH_NAMES[currentMonth.month]} ${day}, locked — needs Sakina Pro`
                        : `${MONTH_NAMES[currentMonth.month]} ${day}${entry ? `, ${moodLabel(entry.mood)}` : ''}${isToday ? ', today' : ''}`
                    }
                    accessibilityState={{ disabled: !entry || isLocked, selected: isSelected }}
                  >
                    <View
                      style={[
                        styles.calendarCellFill,
                        // Was bg+'33' (20%) with a bg+'66' border — on the dark
                        // card that reads as a barely-there smudge, which is
                        // why a logged day didn't feel like an achievement.
                        entry && !isLocked && { backgroundColor: visual!.bg + '4D' },
                        entry && !isLocked && { borderWidth: 1.5, borderColor: visual!.bg + 'B3' },
                        isLocked && styles.calendarCellLocked,
                        isSelected && styles.calendarCellSelected,
                        isToday && !entry && styles.calendarCellToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          // Full-strength mood colour, not the 100%-alpha accent
                          // over a near-invisible fill.
                          entry && !isLocked && { color: visual!.text, fontWeight: '700' },
                          (!entry || isLocked) && { color: Colors.text.muted },
                          isLocked && { opacity: 0.45 },
                          isToday && !entry && { color: Colors.accent.primary, fontWeight: '700' },
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <HistoryWindowNotice
              windowDays={windowDays}
              isPremium={isPremium}
              premiumWindowDays={PREMIUM_HISTORY_WINDOW_DAYS}
              noun="check-ins"
              onUpgrade={() => {
                HapticsService.impactAsync('MEDIUM');
                navigation.navigate('Support');
              }}
            />

            {/* Legend */}
            <View style={styles.legend}>
              {(Object.keys(MOOD_VISUALS) as Mood[]).map((mood) => (
                <View key={mood} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: MOOD_VISUALS[mood].bg }]} />
                  <Text style={styles.legendText}>{moodLabel(mood)}</Text>
                </View>
              ))}
            </View>
          </CardSurface>

          {/* Selected Day Detail */}
          {selectedDay && (
            <CardSurface style={styles.card}>
              <View style={styles.dayDetailHeader}>
                <Text style={styles.dayDetailTitle}>{formatDayHeader(selectedDay)}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDay(null);
                    setDayDetail(null);
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close day detail"
                >
                  <MaterialCommunityIcons name="close" size={20} color={Colors.text.steel} />
                </TouchableOpacity>
              </View>

              {loadingDetail ? (
                <ActivityIndicator size="small" color={Colors.accent.primary} style={{ marginVertical: 20 }} />
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
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            setExpandedTranslations((prev) => {
                              const next = new Set(prev);
                              if (next.has(i)) next.delete(i);
                              else next.add(i);
                              return next;
                            });
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Verse translation"
                          accessibilityState={{ expanded: expandedTranslations.has(i) }}
                        >
                          <Text
                            style={styles.entryTranslation}
                            numberOfLines={expandedTranslations.has(i) ? undefined : 3}
                          >
                            {entry.englishTranslation}
                          </Text>
                        </TouchableOpacity>
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
            </CardSurface>
          )}

          {/* Empty state comes BEFORE the analytics block, not after it. A user
              with no check-ins used to meet an upsell for analysing data they
              did not have, and only then the invitation to start. */}
          {stats && stats.totalDaysTracked === 0 && (
            <NoReflections
              onStartReflecting={() => {
                HapticsService.impactAsync('LIGHT');
                // Begin reflecting by choosing today’s mood → guidance → reflection.
                navigation.navigate('MoodSelection');
              }}
            />
          )}

          {/* Premium Gated Analytics & Insights Teaser / Paid Access */}
          {stats && stats.totalDaysTracked > 0 && (!isPremium ? (
            <CardSurface style={styles.premiumTeaserCard}>
              <View style={styles.premiumTeaserHeader}>
                <View style={styles.premiumTeaserIconCircle}>
                  <MaterialCommunityIcons name="crown-outline" size={24} color={Colors.accent.primary} />
                </View>
                <View style={styles.premiumTeaserTitleWrap}>
                  <Text style={styles.premiumTeaserTitle}>Mood Analytics & Insights</Text>
                  <Text style={styles.premiumTeaserSubtitle}>Available with Sakina Pro</Text>
                </View>
              </View>

              {/* Only promise what computeInsights can actually deliver. It is
                  handed `{ mood, created_at }` rows and nothing else — your written
                  reflections never enter the pipeline, so this card must not sell
                  "guidance based on your journal reflections" (it did, and that was
                  a paid-feature claim the code does not implement). The two things
                  named below are real: the weekday heavy-mood pattern and the
                  recent-vs-prior 14-day trend. If insights ever do read reflections,
                  change computeInsights' signature first and this copy second. */}
              <Text style={styles.premiumTeaserDesc}>
                Deepen your self-awareness. Support Sakina to see the patterns in the moods you log — which days tend to weigh heaviest, and how these two weeks compare to the two before.
              </Text>

              <View style={styles.premiumTeaserFeatures}>
                <View style={styles.premiumTeaserFeatureRow}>
                  <MaterialCommunityIcons name="chart-bar" size={16} color={Colors.accent.primary} />
                  <Text style={styles.premiumTeaserFeatureText}>Comprehensive Mood Distribution</Text>
                </View>
                <View style={styles.premiumTeaserFeatureRow}>
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={Colors.accent.primary} />
                  <Text style={styles.premiumTeaserFeatureText}>Personalized spiritual insights & advice</Text>
                </View>
                <View style={styles.premiumTeaserFeatureRow}>
                  <MaterialCommunityIcons name="trending-up" size={16} color={Colors.accent.primary} />
                  <Text style={styles.premiumTeaserFeatureText}>Track emotional trends over time</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.premiumTeaserBtn}
                onPress={() => {
                  HapticsService.impactAsync('MEDIUM');
                  navigation.navigate('Support');
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.accent.primary, Colors.accent.light]}
                  style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.md }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <MaterialCommunityIcons name="lock-open-outline" size={16} color="#1A0F2E" style={{ marginRight: 6 }} />
                <Text style={styles.premiumTeaserBtnText}>Upgrade to Sakina Pro</Text>
              </TouchableOpacity>
            </CardSurface>
          ) : (
            <>
              {/* Mood Distribution */}
              {stats && Object.keys(stats.moodCounts).length > 0 && (
                <CardSurface style={styles.card}>
                  <Text style={styles.cardTitleTight}>Mood Distribution</Text>
                  <Text style={styles.cardSubtitle}>
                    Across all {stats.totalDaysTracked} days you have checked in
                  </Text>
                  {/* `moodCounts` is one entry per DAY (computeStats), so `total`
                      equals stats.totalDaysTracked and every bar is a share of
                      days checked in — never of taps. The unit is spelled out
                      because the same card used to render session counts. */}
                  {Object.entries(stats.moodCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([mood, days]) => {
                      const total = Object.values(stats.moodCounts).reduce((s, c) => s + c, 0);
                      const percentage = Math.round((days / total) * 100);
                      const visual = getMoodVisual(mood);
                      return (
                        <View key={mood} style={styles.distRow}>
                          <View style={styles.distLabelRow}>
                            <View style={[styles.distDot, { backgroundColor: visual.bg }]} />
                            <Text style={styles.distMood}>{moodLabel(mood)}</Text>
                            <Text style={[styles.distCount, { color: visual.text }]}>
                              {days} {days === 1 ? 'day' : 'days'} ({percentage}%)
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
                </CardSurface>
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
            </>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ── Sub-components ──────────────────────────────────────────────────
// The paid section used to be the least on-brand surface in the app: four
// invented colour families (indigo #818CF8, emerald, amber #FBBF24, sky) that
// exist nowhere in DesignSystem, plus emoji rendered through a <Text>. On the
// Celestial Night palette that read as a generic analytics dashboard bolted
// onto a lantern-lit app — and it was the surface asking for money.
//
// Now: the single gold accent does the accent work (CLAUDE.md), surfaces come
// from Colors.glass.*, and the DIFFERENCE between insight types is carried by
// the icon, which is what an icon is for. Nothing here invents a colour.
function InsightCard({ insight }: { insight: MoodInsight }) {
  return (
    <View style={styles.insightCard}>
      <View style={styles.insightIcon}>
        <MaterialCommunityIcons
          name={insight.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={18}
          color={Colors.accent.primary}
        />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDesc}>{insight.description}</Text>
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text.muted,
    fontWeight: '500',
  },

  // Header
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    zIndex: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 72,
    marginBottom: Spacing.md,
  },
  backText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  headerText: {
    zIndex: 1,
  },
  headerPretitle: {
    fontSize: Typography.sizes.detail - 2,
    color: `${Colors.accent.primary}99`,
    letterSpacing: 2.5,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fonts.serif,
  },
  headerTitle: {
    fontSize: Typography.sizes.hero,
    color: Colors.text.primary,
    fontFamily: Typography.fonts.serif,
    fontWeight: '700',
    letterSpacing: 1.2,
    textShadowColor: `${Colors.accent.primary}33`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: Spacing.sm,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  privacyText: {
    fontSize: Typography.sizes.detail - 1,
    color: Colors.text.muted,
    letterSpacing: 0.3,
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
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.accent.muted,
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
    color: Colors.text.primary,
    lineHeight: 34,
  },
  ringLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent.primary,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  heroRight: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 12,
    color: Colors.accent.primary,
    marginBottom: 10,
    lineHeight: 17,
  },
  // Micro-label in the same letterspaced-uppercase idiom as headerPretitle and
  // ringLabel, marking which span the three stats below cover.
  heroStatsScope: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.text.muted,
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  heroStats: {
    gap: 5,
  },
  // Shrinks before the label does, so a long mood ellipsizes rather than
  // pushing "Top Mood" off the row.
  heroStatValueMood: {
    flexShrink: 1,
    marginLeft: Spacing.sm,
    textAlign: 'right',
  },
  heroStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroStatLabel: {
    fontSize: 12,
    color: Colors.text.muted,
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  heroDivider: {
    height: 1,
    backgroundColor: Colors.accent.glow,
    marginVertical: 14,
  },
  quoteText: {
    fontSize: 12,
    color: Colors.text.muted,
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
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 14,
  },
  // Same title, tightened because a subtitle now sits under it and carries
  // the gap instead.
  cardTitleTight: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
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
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.glass.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },

  // Weekday
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flexBasis: '14.28%',
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.muted,
  },

  // Calendar
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    // 14.28% is exactly 1/7, so highlighted cells on consecutive days touched
    // edge to edge and ran together into one blob (a Thu/Fri/Sat streak read as
    // a single bar, not three check-ins). Inset each cell instead of shrinking
    // the basis, so the seven columns still align under the weekday letters.
    flexBasis: '14.28%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    paddingHorizontal: 3,
  },
  // The visible pill lives inside the cell, so the gap between two highlighted
  // days comes from the cell's padding rather than from a margin that would
  // break the 1/7 column maths.
  calendarCellFill: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Deliberately flat: a faint dashed outline that reads as "not yours to
  // open yet" rather than as an empty day. No fill, so it never competes with
  // a real mood cell, and no accent colour, so it does not look tappable.
  calendarCellLocked: {
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderStyle: 'dashed',
  },
  calendarCellSelected: {
    borderWidth: 2,
    borderColor: Colors.accent.primary,
    transform: [{ scale: 1.08 }],
  },
  calendarCellToday: {
    borderWidth: 2,
    borderColor: Colors.accent.primary,
    borderStyle: 'dashed',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
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
    color: Colors.text.muted,
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
    color: Colors.text.primary,
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
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodBadgeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  moodBadgeSub: {
    fontSize: 12,
    color: Colors.text.muted,
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
    color: Colors.text.muted,
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
    color: Colors.text.primary,
    textAlign: 'right',
    lineHeight: 38,
    marginBottom: 6,
  },
  entryTranslation: {
    fontSize: 13,
    color: Colors.text.muted,
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  reflectionBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Colors.glass.light,
    borderRadius: BorderRadius.sm,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.2)',
  },
  reflectionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  entryDivider: {
    height: 1,
    backgroundColor: Colors.glass.border,
    marginVertical: 12,
  },
  noDataText: {
    fontSize: 13,
    color: Colors.text.muted,
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
    color: Colors.text.secondary,
  },
  distCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  distBarBg: {
    height: 8,
    backgroundColor: Colors.glass.medium,
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
    color: Colors.text.primary,
    marginBottom: 2,
  },
  insightCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 14,
    borderWidth: 1,
    backgroundColor: Colors.glass.light,
    borderColor: Colors.glass.border,
    gap: 12,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.accent.glow,
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
    color: Colors.accent.primary,
  },
  insightDesc: {
    fontSize: 12,
    color: Colors.text.muted,
    lineHeight: 18,
  },
  mandalaWrap: {
    position: 'absolute',
    alignSelf: 'center',
    top: 16,
    zIndex: 0,
  },

  // Premium Teaser
  premiumTeaserCard: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    gap: Spacing.lg,
  },
  premiumTeaserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  premiumTeaserIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTeaserTitleWrap: {
    flex: 1,
  },
  premiumTeaserTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  premiumTeaserSubtitle: {
    fontSize: Typography.sizes.detail - 1,
    color: Colors.accent.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  premiumTeaserDesc: {
    fontSize: Typography.sizes.small - 1,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  premiumTeaserFeatures: {
    gap: Spacing.sm,
    backgroundColor: Colors.glass.light,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  premiumTeaserFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  premiumTeaserFeatureText: {
    fontSize: Typography.sizes.small - 1,
    color: Colors.text.secondary,
  },
  premiumTeaserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    position: 'relative',
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  premiumTeaserBtnText: {
    fontSize: Typography.sizes.small - 1,
    color: '#1A0F2E',
    fontWeight: '700',
    letterSpacing: 1,
  },
});