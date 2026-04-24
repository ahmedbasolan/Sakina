import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Colors } from '../theme/DesignSystem';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Mood, PrayerContext } from '../types';
import PrayerTimesService, { PrayerTimings } from '../services/prayerTimesService';
import Icon from '../components/Icon';
import { getUserLocation } from '../services/locationStorage';
import { LocationPickerModal } from '../components/LocationPickerModal';
import NotificationService from '../services/notificationService';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getDailyVerse, getDailyVerseSync, DailyVerse } from '../services/dailyVerseService';
import { AnimatedMandala } from '../components/AnimatedMandala';
import { logServiceError } from '../services/errorLoggingService';
import {
  HeroHeader,
  VerseOfTheDay,
  StreakBar,
  SpiritualWindowBanner,
  MoodButton,
  CheckInBanner,
  TwinklingStar,
} from '../components/home';

const { width, height } = Dimensions.get('window');

/* ─── Constants & Data ───────────────────────────────────────── */

const starPositions = [
  { x: 0.08, y: 0.12, delay: 0, size: 2 },
  { x: 0.88, y: 0.08, delay: 400, size: 2 },
  { x: 0.20, y: 0.35, delay: 800, size: 1.5 },
  { x: 0.75, y: 0.28, delay: 1200, size: 2.5 },
  { x: 0.50, y: 0.18, delay: 200, size: 1.5 },
  { x: 0.95, y: 0.45, delay: 1600, size: 2 },
  { x: 0.05, y: 0.60, delay: 600, size: 1.5 },
  { x: 0.92, y: 0.72, delay: 1000, size: 2 },
];

interface MoodConfig {
  id: Mood;
  label: string;
  sublabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
}

const moodConfigs: MoodConfig[] = [
  { id: 'Grateful', label: 'GRATEFUL', sublabel: 'Shukr', color: '#34D399', bgColor: '#0C2214', borderColor: '#1A4A20', iconName: 'heart' },
  { id: 'Hopeful', label: 'HOPEFUL', sublabel: 'Amal', color: '#FBBF24', bgColor: '#1A1608', borderColor: '#3D3010', iconName: 'sunny' },
  { id: 'Calm', label: 'PEACEFUL', sublabel: 'Sukoon', color: '#60A5FA', bgColor: '#0C1A2E', borderColor: '#1E3A5F', iconName: 'water' },
  { id: 'Overwhelmed', label: 'OVERWHELMED', sublabel: 'Ghamm', color: '#14B8A6', bgColor: '#0C1E1E', borderColor: '#1A3A3A', iconName: 'layers' },
  { id: 'Tired', label: 'TIRED', sublabel: 'Ta\u0027ab', color: '#9CA3AF', bgColor: '#14161A', borderColor: '#2A2E34', iconName: 'moon' },
  { id: 'Lonely', label: 'LONELY', sublabel: 'Wahshah', color: '#A78BFA', bgColor: '#180E2E', borderColor: '#3D1E6A', iconName: 'person' },
  { id: 'Sad', label: 'SAD', sublabel: 'Huzn', color: '#60A5FA', bgColor: '#0C1526', borderColor: '#1A3050', iconName: 'rainy' },
  { id: 'Angry', label: 'ANGRY', sublabel: 'Ghadab', color: '#F87171', bgColor: '#1E0C0C', borderColor: '#4A1A1A', iconName: 'flame' },
];

/* ─── Helper Functions ───────────────────────────────────────── */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Peace be upon you';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ─── Prayer Arch Icon (SVG) ─────────────────────────────────── */

function PrayerArchIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path
        d="M3 16 L3 9 Q9 3 15 9 L15 16"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color + '1A'}
      />
      <Line x1={9} y1={9} x2={9} y2={16} stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.5} />
      <Line x1={3} y1={16} x2={15} y2={16} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Circle cx={9} cy={4} r={1} fill={color} opacity={0.7} />
    </Svg>
  );
}

/* ─── Quill Icon (SVG) ───────────────────────────────────────── */

function QuillIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path
        d="M14 2 C14 2 16 4 14 7 L7 14 L3 15 L4 11 L11 4 C12 3 13 2 14 2Z"
        stroke={color}
        strokeWidth={1.3}
        fill={color + '1F'}
        strokeLinejoin="round"
      />
      <Line x1={4} y1={11} x2={7} y2={14} stroke={color} strokeWidth={1} strokeLinecap="round" opacity={0.5} />
      <Path d="M3 15 L4.5 13.5" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

/* ─── Crescent Icon ──────────────────────────────────────────── */

function CrescentIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={color} />
    </Svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN HOME SCREEN
   ═══════════════════════════════════════════════════════════════ */

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { setSelectedMood, rotationEngine } = useAppContext();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [localSelectedMood, setLocalSelectedMood] = useState<Mood | null>(null);
  const [loadingMood, setLoadingMood] = useState(false);

  // Prayer state
  const [prayerTimings, setPrayerTimings] = useState<PrayerTimings | null>(null);
  const [prayerContext, setPrayerContext] = useState<PrayerContext>('general');
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; minutesRemaining: number } | null>(null);
  const [loadingPrayers, setLoadingPrayers] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentCity, setCurrentCity] = useState('London');
  const [currentCountry, setCurrentCountry] = useState('UK');

  // Feature state
  const [streakDays, setStreakDays] = useState(0);
  const [activePath, setActivePath] = useState<{
    pathLabel: string; // e.g. "14-DAY PATH"
    stepTitle: string; // current day's step title, e.g. "WHAT IS RIZQ?"
    stepFocus?: string; // step focus/subtitle, e.g. "Understanding Divine Provision"
    currentDay: number;
    totalDays: number;
    color: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [fajrTime, setFajrTime] = useState<string | null>(null);
  const [lastCheckin, setLastCheckin] = useState<{ moodId: Mood; timestamp: number } | null>(null);

  // Daily verse state — sync fallback renders immediately, async version loads with history check
  const [dailyVerse, setDailyVerse] = useState<DailyVerse>(getDailyVerseSync());

  const prayerService = PrayerTimesService.getInstance();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    loadPrayerData();
    loadStreakData();
    loadActivePath();
    checkTodayMood();
    getDailyVerse().then(setDailyVerse);
  }, []);

  useEffect(() => {
    if (!prayerTimings) return;
    const interval = setInterval(() => updatePrayerStatus(prayerTimings), 60000);
    return () => clearInterval(interval);
  }, [prayerTimings]);

  /* ─── Data Loaders ─────────────────────────────────────────── */

  const checkTodayMood = async () => {
    try {
      const { moodHistoryService } = await import('../services/moodHistoryService');
      const stats = await moodHistoryService.getStats();
      setCheckedInToday(stats.currentStreak > 0 && stats.totalDaysTracked > 0);

      // Load last check-in for "Last check-in" pill
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const detail = await moodHistoryService.getDayDetail(todayStr);
      if (detail && detail.entries.length > 0) {
        const last = detail.entries[0]; // most recent
        setLastCheckin({ moodId: last.mood, timestamp: last.timestamp });
        setLocalSelectedMood(last.mood);
      } else {
        // Check yesterday for the 'recently selected' indicator
        const yest = new Date(now.getTime() - 86400000);
        const yestStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;
        const yDetail = await moodHistoryService.getDayDetail(yestStr);
        if (yDetail && yDetail.entries.length > 0) {
          setLastCheckin({ moodId: yDetail.entries[0].mood, timestamp: yDetail.entries[0].timestamp });
        }
      }
    } catch {}
  };

  const loadActivePath = async () => {
    try {
      const { PathsService } = await import('../services/pathsService');
      const pathsService = PathsService.getInstance();
      const allProgress = await pathsService.getAllProgress();
      if (allProgress.length > 0) {
        const latest = allProgress[0];
        const path = pathsService.getPathById(latest.pathId);
        if (path) {
          // Find the current day's step (what the user is on *right now*)
          const currentStep =
            path.dailySteps.find((s) => s.day === latest.currentDay) ||
            path.dailySteps[0];
          setActivePath({
            pathLabel: `${path.duration}-DAY PATH`,
            stepTitle: currentStep?.title || path.title,
            stepFocus: currentStep?.focus || path.description,
            currentDay: latest.currentDay,
            totalDays: path.duration,
            color: Colors.accent.primary,
          });
        }
      }
    } catch (error) {
      logServiceError('HomeScreen', 'loadActivePath', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const loadStreakData = async () => {
    try {
      const { moodHistoryService } = await import('../services/moodHistoryService');
      const stats = await moodHistoryService.getStats();
      setStreakDays(stats.currentStreak);
    } catch (error) {
      logServiceError('HomeScreen', 'loadStreakData', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const loadPrayerData = async () => {
    try {
      setLoadingPrayers(true);
      const savedLocation = await getUserLocation();
      const city = savedLocation?.city || 'London';
      const country = savedLocation?.country || 'UK';
      setCurrentCity(city);
      setCurrentCountry(country);

      const data = await prayerService.getTimingsByCity(city, country);
      setPrayerTimings(data.timings);
      updatePrayerStatus(data.timings);

      // Extract Fajr time
      if (data.timings.Fajr) {
        setFajrTime(data.timings.Fajr);
      }

      const notificationService = NotificationService.getInstance();
      await notificationService.scheduleSpiritualReminders(data.timings);
    } catch (error) {
      logServiceError('HomeScreen', 'loadPrayerData', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoadingPrayers(false);
    }
  };

  const updatePrayerStatus = (timings: PrayerTimings) => {
    const context = prayerService.determineContextFromTimings(timings);
    const next = prayerService.getNextPrayerInfo(timings);
    setPrayerContext(context);
    setNextPrayer(next);
  };

  /* ─── Spiritual Window Helpers ─────────────────────────────── */

  const getSpiritualWindowName = (context: PrayerContext) => {
    switch (context) {
      case 'fajr_pre': return 'The Deep Night (Tahajjud)';
      case 'fajr_post': return 'The Morning Light';
      case 'dhuhr': return 'The High Zenith';
      case 'asr': return 'The Golden Hour';
      case 'maghrib_pre': return 'The Approach of Night';
      case 'maghrib_post': return 'The Evening Glow';
      case 'isha': return 'The Peace of Night';
      default: return 'A Moment of Reflection';
    }
  };

  const getSpiritualActionText = (context: PrayerContext) => {
    switch (context) {
      case 'fajr_pre': return 'Guided Tahajjud Reflection';
      case 'fajr_post': return 'Morning Protection Adhkar';
      case 'dhuhr': return 'Mid-day Spiritual Break';
      case 'asr': return 'The Golden Hour Remembrance';
      case 'maghrib_pre': return 'Evening Protection Adhkar';
      case 'maghrib_post': return 'Post-Maghrib Gratitude';
      case 'isha': return 'Nightly Habit & Reflection';
      default: return 'Explore Guidance';
    }
  };

  const navigateToTimedGuidance = async () => {
    const mood = localSelectedMood || 'Calm';
    try {
      const experience = await rotationEngine.getGuidance(mood);
      if (experience) {
        navigation.navigate('Guidance', {
          experience,
          mood,
          islamicTerm: getSpiritualWindowName(prayerContext),
        });
      }
    } catch (error) {
      logServiceError('HomeScreen', 'navigateToTimedGuidance', error instanceof Error ? error : new Error(String(error)));
    }
  };

  /* ─── Mood Tap Handler ─────────────────────────────────────── */

  const handleMoodTap = useCallback(async (moodId: Mood) => {
    if (loadingMood) return;
    setLocalSelectedMood(moodId);
    setSelectedMood(moodId);
    setCheckedInToday(true);
    setLoadingMood(true);
    try {
      const experience = await rotationEngine.getGuidance(moodId);
      if (experience) {
        navigation.navigate('Guidance', {
          experience,
          mood: moodId,
          islamicTerm: moodConfigs.find(m => m.id === moodId)?.label || moodId,
        });
      }
    } catch (error) {
      logServiceError('HomeScreen', 'handleMoodTap', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoadingMood(false);
    }
  }, [loadingMood, navigation, rotationEngine, setSelectedMood]);

  const showBanner = !checkedInToday && !bannerDismissed;
  const progressPct = activePath ? Math.round((activePath.currentDay / activePath.totalDays) * 100) : 0;

  // Relative time label helper
  const relativeLabel = (ts: number): string => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 2) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#07111E', '#0C1A2E', '#0F1519']} style={styles.gradient}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await Promise.all([loadPrayerData(), loadStreakData(), loadActivePath(), getDailyVerse().then(setDailyVerse)]);
                setRefreshing(false);
              }}
              tintColor={Colors.accent.primary}
              colors={[Colors.accent.primary]}
            />
          }
        >

          {/* ═══ HERO HEADER ═══════════════════════════════════ */}
          <View style={styles.heroHeader}>
            {/* Ambient glow orb */}
            <View style={styles.glowOrb} pointerEvents="none" />

            {/* Twinkling Stars */}
            {starPositions.map((s, i) => (
              <TwinklingStar key={i} x={s.x} y={s.y} delay={s.delay} size={s.size} />
            ))}

            {/* Animated Mandala - outer */}
            <View style={styles.mandalaOuter} pointerEvents="none">
              <AnimatedMandala size={220} color={Colors.accent.primary} opacity={0.35} />
            </View>
            {/* Animated Mandala - inner (counter-rotates) */}
            <View style={styles.mandalaInner} pointerEvents="none">
              <AnimatedMandala size={160} color={Colors.accent.primary} opacity={0.25} direction="ccw" />
            </View>

            {/* Top bar */}
            <Animated.View
              style={[
                styles.heroTopBar,
                { paddingTop: Math.max(insets.top, 20), opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View>
                <Text style={styles.greetingText}>{getGreeting()}</Text>
                <Text style={styles.heroTitle}>Assalamu Alaikum</Text>
              </View>

              {/* Notification bell — top right */}
              <TouchableOpacity
                style={styles.notifBell}
                onPress={() => navigation.navigate('Settings')}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="notifications-outline" size={20} color={Colors.accent.primary} />
                <View style={styles.notifDot} />
              </TouchableOpacity>
            </Animated.View>

            {/* Bismillah */}
            <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
          </View>

          {/* ═══ VERSE OF THE DAY ══════════════════════════════ */}
          <Animated.View style={[styles.verseSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.verseCard}>
              {/* Gold top line */}
              <LinearGradient colors={['transparent', Colors.accent.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verseBorderLine} />

              {/* Badge */}
              <View style={styles.verseBadge}>
                <Text style={styles.verseBadgeStar}>★</Text>
                <Text style={styles.verseBadgeText}>VERSE OF THE DAY</Text>
                <Text style={styles.verseBadgeStar}>★</Text>
              </View>

              {/* Arabic */}
              <Text style={styles.verseArabic}>{dailyVerse.arabic}</Text>

              {/* Ornament divider */}
              <Text style={styles.ornamentStar}>✦</Text>

              {/* Translation */}
              <Text style={styles.verseTranslation}>{dailyVerse.translation}</Text>

              {/* Reference */}
              <Text style={styles.verseRef}>— {dailyVerse.ref}</Text>

              {/* Gold bottom line */}
              <LinearGradient colors={['transparent', '#C9A84C60', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verseBorderLineBottom} />
            </View>
          </Animated.View>

          {/* ═══ STREAK BAR ════════════════════════════════════ */}
          <Animated.View style={[styles.streakSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('MoodHistory')}>
              <LinearGradient colors={['#0C2214', '#0A1A0E']} style={styles.streakBar}>
                {/* Flame icon */}
                <View style={styles.streakLeft}>
                  <View style={styles.streakFlameContainer}>
                    <CrescentIcon size={18} color="#4ADE80" />
                  </View>
                  <View>
                    <Text style={styles.streakText}>{streakDays}-Day Streak</Text>
                    <View style={styles.streakMoons}>
                      {[...Array(7)].map((_, i) => (
                        <View key={i} style={[styles.streakMoonDot, i < streakDays ? styles.streakMoonActive : null]} />
                      ))}
                    </View>
                  </View>
                </View>
                <View style={styles.streakRight}>
                  <Text style={styles.streakViewText}>View</Text>
                  <Ionicons name="arrow-forward" size={12} color="#2A6A2A" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* ═══ SPIRITUAL WINDOW BANNER (KEPT) ════════════════ */}
          <Animated.View style={[styles.spiritualSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity activeOpacity={0.9} onPress={navigateToTimedGuidance}>
              <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.spiritualBanner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.bannerTextContainer}>
                    <Text style={styles.bannerPreTitle}>Current Spiritual Window</Text>
                    <Text style={styles.bannerTitle}>{getSpiritualWindowName(prayerContext)}</Text>
                    <View style={styles.bannerCTA}>
                      <Text style={styles.bannerCTAText}>{getSpiritualActionText(prayerContext)}</Text>
                      <Ionicons name="arrow-forward" size={14} color="#D4A574" />
                    </View>
                  </View>
                  <View style={styles.bannerIconContainer}>
                    <Ionicons
                      name={prayerContext === 'fajr_pre' || prayerContext === 'isha' ? 'moon' : 'sunny'}
                      size={40}
                      color="rgba(212, 165, 116, 0.2)"
                    />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* ═══ HOW IS YOUR HEART? ════════════════════════════ */}
          <View style={styles.moodSection}>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderTitle}>HOW IS YOUR HEART?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MoodSelection')} style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={11} color="#8BA4BF" />
              </TouchableOpacity>
            </View>

            {/* Last check-in pill */}
            {lastCheckin && (() => {
              const lm = moodConfigs.find(m => m.id === lastCheckin.moodId);
              if (!lm) return null;
              return (
                <View style={[styles.lastCheckinPill, { backgroundColor: lm.color + '0D', borderColor: lm.color + '25' }]}>
                  <View style={[styles.lastCheckinDot, { backgroundColor: lm.color }]} />
                  <Text style={[styles.lastCheckinText, { color: lm.color }]}>
                    Last check-in: <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>{lm.label}</Text>
                    <Text style={{ opacity: 0.55 }}> · {relativeLabel(lastCheckin.timestamp)}</Text>
                  </Text>
                </View>
              );
            })()}

            {/* Check-in Banner */}
            {showBanner && <CheckInBanner onDismiss={() => setBannerDismissed(true)} />}

            {/* Mood Grid */}
            <View style={styles.moodGrid}>
              {moodConfigs.map((mood, idx) => (
                <MoodButton
                  key={mood.id}
                  mood={mood}
                  isChecked={localSelectedMood === mood.id}
                  isRecentlySelected={!checkedInToday && lastCheckin?.moodId === mood.id}
                  onPress={() => handleMoodTap(mood.id)}
                  animDelay={idx * 60}
                />
              ))}
            </View>

            {/* Success text */}
            {checkedInToday && localSelectedMood && (
              <View style={styles.successRow}>
                <Ionicons name="sparkles" size={11} color={Colors.accent.primary} />
                <Text style={styles.successText}>Heart logged today · Barakallahu feek</Text>
                <Ionicons name="sparkles" size={11} color={Colors.accent.primary} />
              </View>
            )}
          </View>

           {/* ═══ SACRED JOURNEY ═════════════════════════════ */}
          {activePath && (
            <View style={styles.journeySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>SACRED JOURNEY</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Journeys')} style={styles.seeAllButton}>
                  <Text style={styles.seeAllText}>All paths</Text>
                  <Ionicons name="chevron-forward" size={11} color="#8BA4BF" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Journeys')}>
                <LinearGradient
                  colors={['#18150F', '#0B1019']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.journeyCard, { borderColor: '#262214' }]}
                >
                  {/* Decorative mandala in top-right */}
                  <View style={styles.journeyMandala} pointerEvents="none">
                    <AnimatedMandala size={180} color={activePath.color} opacity={0.12} />
                  </View>

                  {/* Top row: icon + info + chevron */}
                  <View style={styles.journeyCardTop}>
                    <View style={styles.journeyCardTopLeft}>
                      <View style={[styles.journeyIcon, { backgroundColor: activePath.color + '15', borderColor: activePath.color + '25' }]}>
                        <MaterialCommunityIcons name="barley" size={20} color={activePath.color} />
                      </View>
                      <View style={styles.journeyInfo}>
                        <Text style={[styles.journeyPathLabel, { color: activePath.color }]}>{activePath.pathLabel}</Text>
                        <Text style={styles.journeyTitle}>{activePath.stepTitle.toUpperCase()}</Text>
                        {activePath.stepFocus && (
                          <Text style={styles.journeySubtitle} numberOfLines={1}>{activePath.stepFocus}</Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#4A6480" style={{ marginTop: 2 }} />
                  </View>

                  {/* Gradient progress bar */}
                  <View style={styles.progressBarTrack}>
                    <LinearGradient
                      colors={['#C9A84C', '#EDD9A3']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.max(0, Math.min(100, progressPct))}%` },
                      ]}
                    />
                  </View>

                  <View style={styles.journeyFooter}>
                    <Text style={styles.journeyDayText}>Day {activePath.currentDay} of {activePath.totalDays}</Text>
                    <Text style={[styles.journeyPctText, { color: activePath.color }]}>{progressPct}% COMPLETE</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══ QUICK ACTIONS ═════════════════════════════════ */}
          <View style={styles.quickActionsSection}>
            <View style={styles.quickActionsRow}>
              {/* Fajr Prayer */}
              <TouchableOpacity
                style={[styles.quickCard, { backgroundColor: '#0F2236', borderColor: '#1E3A5F' }]}
                onPress={() => navigation.navigate('MoodHistory')}
                activeOpacity={0.85}
              >
                <View style={[styles.quickCardIcon, { backgroundColor: '#0A1828', borderColor: '#1A3A5A' }]}>
                  <PrayerArchIcon size={18} color="#60A5FA" />
                </View>
                <Text style={styles.quickCardTitle}>FAJR PRAYER</Text>
                <Text style={[styles.quickCardValue, { color: '#60A5FA' }]}>{fajrTime || '5:23 AM'}</Text>
                <Text style={styles.quickCardSub}>Tomorrow</Text>
              </TouchableOpacity>

              {/* Journal */}
              <TouchableOpacity
                style={[styles.quickCard, { backgroundColor: '#180E2E', borderColor: '#3D1E6A' }]}
                onPress={() => navigation.navigate('Reflect')}
                activeOpacity={0.85}
              >
                <View style={[styles.quickCardIcon, { backgroundColor: '#120A20', borderColor: '#2A1040' }]}>
                  <QuillIcon size={18} color="#C084FC" />
                </View>
                <Text style={styles.quickCardTitle}>REFLECT</Text>
                <Text style={[styles.quickCardValue, { color: '#C084FC' }]}>Write today</Text>
                <Text style={styles.quickCardSub}>Journal</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>

        <LocationPickerModal
          visible={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onLocationSelected={(location) => {
            setCurrentCity(location.city);
            setCurrentCountry(location.country);
            loadPrayerData();
          }}
        />
      </LinearGradient>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: { paddingBottom: 140 },

  /* ─── Hero Header ──────────────────────────────────────────── */
  heroHeader: {
    position: 'relative',
    paddingBottom: 16,
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(201,168,76,0.08)',
    left: width / 2 - 150,
    top: -60,
  },
  mandalaOuter: {
    position: 'absolute',
    left: width / 2 - 110,
    top: 30,
  },
  mandalaInner: {
    position: 'absolute',
    left: width / 2 - 80,
    top: 60,
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greetingText: {
    fontSize: 11,
    color: '#6A90B0',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 22,
    color: '#F0E6D3',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
  },
  notifBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#112240',
    borderWidth: 1,
    borderColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#F87171', // red dot per target
    borderWidth: 1.5,
    borderColor: '#112240', // matches bell bg for clean cutout
  },
  bismillah: {
    textAlign: 'center',
    color: Colors.accent.primary,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 20,
    opacity: 0.6,
    marginBottom: 4,
  },

  /* ─── Verse of the Day ─────────────────────────────────────── */
  verseSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: -4,
  },
  verseCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0F1E35',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 10,
  },
  verseBorderLine: { height: 2 },
  verseBorderLineBottom: { height: 2 },
  verseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  verseBadgeStar: {
    fontSize: 10,
    color: Colors.accent.primary,
  },
  verseBadgeText: {
    fontSize: 10,
    color: Colors.accent.primary,
    letterSpacing: 2.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  verseArabic: {
    textAlign: 'center',
    color: '#EDD9A3',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 24,
    lineHeight: 48,
    paddingHorizontal: 20,
    writingDirection: 'rtl',
  },
  ornamentStar: {
    textAlign: 'center',
    color: Colors.accent.primary,
    fontSize: 16,
    marginVertical: 8,
    opacity: 0.6,
  },
  verseTranslation: {
    textAlign: 'center',
    color: '#B8CEDD',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
    paddingHorizontal: 24,
  },
  verseRef: {
    textAlign: 'center',
    color: Colors.accent.primary,
    fontSize: 11,
    opacity: 0.7,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 16,
  },

  /* ─── Streak Bar ───────────────────────────────────────────── */
  streakSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  streakBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A4A20',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakFlameContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#1A3A1A',
    borderWidth: 1,
    borderColor: '#2A6A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    color: '#4ADE80',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
  },
  streakMoons: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 3,
  },
  streakMoonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E3A2A',
  },
  streakMoonActive: {
    backgroundColor: Colors.accent.primary,
  },
  streakRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakViewText: {
    color: '#2A6A2A',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  /* ─── Spiritual Window Banner ──────────────────────────────── */
  spiritualSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  spiritualBanner: {
    padding: 20,
    borderRadius: 22,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTextContainer: { flex: 1 },
  bannerPreTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4A574',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E5DDD5',
    marginBottom: 12,
  },
  bannerCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerCTAText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A574',
  },
  bannerIconContainer: {
    marginLeft: 20,
    opacity: 0.8,
  },

  /* ─── Mood Section ─────────────────────────────────────────── */
  moodSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    color: '#F0E6D3',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 11.5,
    color: '#8BA4BF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
  },

  /* Check-in Banner */
  checkinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    marginBottom: 12,
  },
  checkinBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent.primary,
  },
  checkinBannerText: {
    color: '#EDD9A3',
    fontSize: 11,
    flex: 1,
  },
  checkinDismiss: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(201,168,76,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  /* Mood Grid */
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodButtonWrapper: {
    width: (width - 40 - 24) / 4, // 4 columns, 20px padding each side, 3 * 8px gaps
  },
  moodButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 96,
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  moodIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: {
    fontSize: 10,
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
  },
  moodSublabel: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.2,
  },
  checkedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },

  /* Last check-in pill */
  lastCheckinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  lastCheckinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.8,
  },
  lastCheckinText: {
    fontSize: 10.5,
    opacity: 0.85,
  },

  /* Success */
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  successText: {
    color: Colors.accent.primary,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.8,
    opacity: 0.8,
  },

  /* ─── Sacred Journey ───────────────────────────────────────── */
  journeySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  journeyCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  journeyMandala: {
    position: 'absolute',
    top: -20,
    right: -40,
  },
  journeyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  journeyCardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  journeyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyInfo: { flex: 1, justifyContent: 'center' },
  journeyPathLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
    fontWeight: '700',
  },
  journeyTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  journeySubtitle: {
    fontSize: 12,
    color: '#8BA4BF',
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(30, 58, 95, 0.5)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  journeyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journeyDayText: {
    fontSize: 12,
    color: '#4A6480',
  },
  journeyPctText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    letterSpacing: 1,
  },

  /* ─── Quick Actions ────────────────────────────────────────── */
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  quickCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickCardTitle: {
    fontSize: 11,
    color: '#F0E6D3',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  quickCardValue: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },
  quickCardSub: {
    fontSize: 11,
    color: '#4A6480',
    marginTop: 2,
  },
});