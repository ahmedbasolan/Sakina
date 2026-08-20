import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getSpiritualWindowName } from '../utils/prayerContext';
import { formatPrayerTime, formatCountdown } from '../services/prayerTimesService';
import { Colors, Spacing, Typography, Animations, Layout, MoodColors } from '../theme/DesignSystem';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { Mood, MoodConfig } from '../types';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { JourneyMandalaBackdrop } from '../components/JourneyMandalaBackdrop';
import { logServiceError } from '../services/errorLoggingService';
import { HapticsService } from '../services/hapticsService';
import { fetchWindowGuidance as fetchWindowGuidanceShared, buildFridayKahfExperiences } from '../services/guidanceWindowFetch';
import { getCachedSurah, fetchAndCacheSurah } from '../services/quranService';
import {
  HeroHeader,
  VerseOfTheDay,
  StreakBar,
  SpiritualWindowBanner,
  CheckInBanner,
  SmartMoodGrid,
  StreakMilestoneBanner,
} from '../components/home';
import { useHomeData } from '../hooks/useHomeData';

/* ─── Constants ──────────────────────────────────────────────── */

// Card content (labels, Arabic terms, icons). All colour fields derive from
// MoodColors in DesignSystem.ts — the single source of truth — so the accent a
// user taps on the card always matches the immersive background it opens.
const MOOD_CARD_CONTENT: { id: Mood; label: string; sublabel: string; iconName: string }[] = [
  { id: 'Grateful',    label: 'GRATEFUL',    sublabel: 'Shukr',   iconName: 'heart' },
  { id: 'Hopeful',     label: 'HOPEFUL',     sublabel: 'Amal',    iconName: 'sunny' },
  { id: 'Calm',        label: 'PEACEFUL',    sublabel: 'Sukoon',  iconName: 'water' },
  { id: 'Overwhelmed', label: 'OVERWHELMED', sublabel: 'Ghamm',   iconName: 'layers' },
  { id: 'Tired',       label: 'TIRED',       sublabel: "Ta'ab",   iconName: 'moon' },
  { id: 'Lonely',      label: 'LONELY',      sublabel: 'Wahshah', iconName: 'person' },
  { id: 'Sad',         label: 'SAD',         sublabel: 'Huzn',    iconName: 'rainy' },
  { id: 'Angry',       label: 'ANGRY',       sublabel: 'Ghadab',  iconName: 'flame' },
  // Guilty was defined in the Mood type, had MoodColors, had angles written for
  // it — and was missing from this array, so the only route to it was one deep
  // link out of the mood calendar. constants/index.ts calls tawbah "sacred;
  // never gate repentance"; omitting the card gated it.
  { id: 'Guilty',      label: 'GUILTY',      sublabel: 'Nadam',   iconName: 'refresh-circle' },
];

const moodConfigs: MoodConfig[] = MOOD_CARD_CONTENT.map(({ id, label, sublabel, iconName }) => {
  const mc = MoodColors[id];
  return {
    id,
    label,
    sublabel,
    iconName,
    color: mc.accent,
    bgColor: mc.bgFill,
    borderColor: mc.card.border,
    gradientColors: mc.card.gradient,
  };
});

/* ─── Helpers ────────────────────────────────────────────────── */

// Short time-of-day caption shown above the "Assalamu Alaikum" greeting in the
// hero. Kept brief so it reads cleanly as an uppercase eyebrow.
function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 5)  return 'Peace be with you';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ─── Memoised SVG icons ─────────────────────────────────────── */
// React.memo prevents unnecessary redraws from the 60-second prayer
// timer re-render that fires while the home screen is mounted.

const PrayerArchIcon = React.memo(function PrayerArchIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path d="M3 16 L3 9 Q9 3 15 9 L15 16" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" fill={color + '1A'} />
      <Line x1={9} y1={9} x2={9} y2={16} stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.5} />
      <Line x1={3} y1={16} x2={15} y2={16} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Circle cx={9} cy={4} r={1} fill={color} opacity={0.7} />
    </Svg>
  );
});

const QuillIcon = React.memo(function QuillIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path d="M14 2 C14 2 16 4 14 7 L7 14 L3 15 L4 11 L11 4 C12 3 13 2 14 2Z" stroke={color} strokeWidth={1.3} fill={color + '1F'} strokeLinejoin="round" />
      <Line x1={4} y1={11} x2={7} y2={14} stroke={color} strokeWidth={1} strokeLinecap="round" opacity={0.5} />
      <Path d="M3 15 L4.5 13.5" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
});

/* ═══════════════════════════════════════════════════════════════
   MAIN HOME SCREEN — rendering + navigation only
   ═══════════════════════════════════════════════════════════════ */

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { setSelectedMood, rotationEngine, setStreakCount, timeFormat } = useAppContext();
  const insets = useSafeAreaInsets();

  // ── All data loading delegated to useHomeData ─────────────────
  const {
    prayerContext,
    nextPrayer,
    showLocationModal, setShowLocationModal,
    loadPrayerData,
    loadActivePath,
    currentCity,
    currentCountry,
    streakDays,
    checkedInToday, setCheckedInToday,
    bannerDismissed, setBannerDismissed,
    lastCheckin,
    localSelectedMood, setLocalSelectedMood,
    loadStreakData,
    checkTodayMood,
    streakMilestone,
    offerSupportForMilestone,
    dismissStreakMilestone,
    activePath,
    dailyVerse,
    refreshing,
    handleRefresh,
    now,
  } = useHomeData({ setStreakCount });

  // ── View-layer animations (stay here — not data concerns) ─────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: Animations.timing.slow, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  // Reload streak when returning from any sub-screen (Guidance, Settings, etc.).
  // hasMountedRef skips the first focus emission React Navigation fires on mount
  // so we don't double-invoke what bootstrap already loaded.
  const hasMountedRef = useRef(false);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      if (!hasMountedRef.current) { hasMountedRef.current = true; return; }
      loadStreakData();
      checkTodayMood();
    });
    return unsub;
  }, [navigation, loadStreakData, checkTodayMood]);

  // Reload prayer data when returning from PrayerTimesScreen (location may have changed).
  // hasPrayerFocusedRef skips the first focus (mount) — useHomeData already loads on bootstrap.
  const hasPrayerFocusedRef = useRef(false);
  useFocusEffect(useCallback(() => {
    if (!hasPrayerFocusedRef.current) { hasPrayerFocusedRef.current = true; return; }
    loadPrayerData();
    // Also refresh the Sacred Journey card. Completing a day and backing out
    // to Home is the single most likely way to reach this screen with stale
    // journey state, and it was the one thing focus did not reload — the card
    // kept its old path/day until the app was backgrounded or pulled to refresh.
    loadActivePath();
  }, [loadPrayerData, loadActivePath]));

  const scrollContentStyle = useMemo(
    () => [styles.scrollContent, { paddingBottom: insets.bottom + Layout.tabBarClearance }],
    [insets.bottom],
  );

  // ── Double-tap guard (view concern — prevents two nav pushes) ─
  const isHandlingTap = useRef(false);
  // Which mood card is currently loading guidance (shows spinner while fetch runs)
  const [loadingMood, setLoadingMood] = useState<Mood | null>(null);
  // Ref so handleMoodTap can read the current mood without taking a dep on it
  // (avoids invalidating pressHandlers → SmartMoodCard memo on every tap)
  const localSelectedMoodRef = useRef<Mood | null>(localSelectedMood);
  useEffect(() => { localSelectedMoodRef.current = localSelectedMood; }, [localSelectedMood]);

  // Window-aware guidance fetch shared by the mood grid and the timed card.
  // Free users get ONE fresh verse per mood per prayer window from Home;
  // re-taps inside the same window return that delivered verse (it's "saved
  // for you", as the resting point promises). Fresh verses beyond the first
  // flow only through GuidanceScreen's gated refresh budget — without this,
  // re-tapping a mood minted unlimited verses and bypassed the resting point.
  const fetchWindowGuidance = useCallback(
    (moodId: Mood) => fetchWindowGuidanceShared(rotationEngine, moodId),
    [rotationEngine],
  );

  // ── Mood tap ───────────────────────────────────────────────────
  const handleMoodTap = useCallback(async (moodId: Mood) => {
    if (isHandlingTap.current) return;
    isHandlingTap.current = true;
    const previousMood = localSelectedMoodRef.current;
    setLocalSelectedMood(moodId);
    setLoadingMood(moodId);
    HapticsService.impactAsync('LIGHT');
    try {
      const experience = await fetchWindowGuidance(moodId);
      if (experience) {
        setSelectedMood(moodId);
        setCheckedInToday(true);
        // The fetch above can resolve after the user has already switched
        // tabs (Home stays mounted inside the tab navigator) — without this
        // check, a slow fetch force-navigates them into Guidance on top of
        // whatever screen they're now looking at.
        if (navigation.isFocused()) {
          navigation.navigate('Guidance', {
            experience,
            mood: moodId,
            islamicTerm: moodConfigs.find((m) => m.id === moodId)?.label || moodId,
          });
        }
      } else {
        setLocalSelectedMood(previousMood);
        logServiceError('HomeScreen', 'handleMoodTap', new Error(`getGuidance returned null for mood: ${moodId}`));
      }
    } catch (error) {
      setLocalSelectedMood(previousMood);
      logServiceError('HomeScreen', 'handleMoodTap', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoadingMood(null);
      isHandlingTap.current = false;
    }
  }, [navigation, fetchWindowGuidance, setSelectedMood, setLocalSelectedMood, setCheckedInToday]);

  // Friday overrides the time-of-day window entirely with Surah Al-Kahf —
  // "whoever reads it on Friday will have light shining for him between the
  // two Fridays" (al-Hakim). `now` already ticks every minute / on foreground
  // resume, so this flips over at midnight without needing its own timer.
  const isFriday = useMemo(() => new Date(now).getDay() === 5, [now]);

  // Warm the Al-Kahf cache as soon as the banner shows the Friday state,
  // instead of on first tap — without this, tapping the banner on a Friday
  // triggered a full network fetch of all 110 verses (fetchAndCacheSurah)
  // right before navigating, which read as the banner "hanging".
  useEffect(() => {
    if (!isFriday) return;
    getCachedSurah(18).then((cached) => {
      if (!cached || cached.length === 0) {
        fetchAndCacheSurah(18).catch(() => {});
      }
    });
  }, [isFriday]);

  // Spinner state for the spiritual-window banner (same touch-feedback
  // contract as the mood cards: guard + haptic + visible progress).
  const [windowLoading, setWindowLoading] = useState(false);
  const navigateToTimedGuidance = useCallback(async () => {
    if (isHandlingTap.current) return;
    isHandlingTap.current = true;
    setWindowLoading(true);
    HapticsService.impactAsync('LIGHT');
    try {
      // Friday: the same immersive Guidance screen as every other window,
      // seeded with Surah Al-Kahf's first ten verses instead of a mood fetch.
      // The queue advances for free inside GuidanceScreen; once it's
      // exhausted, "next verse" falls through to the normal mood rotation.
      if (isFriday) {
        const verses = await buildFridayKahfExperiences();
        // Guard against the user having switched tabs while this awaited —
        // Home stays mounted inside the tab navigator, so without this a
        // slow fetch would force-navigate on top of whatever they're on now.
        if (verses && verses.length > 0 && navigation.isFocused()) {
          const [experience, ...kahfQueue] = verses;
          navigation.navigate('Guidance', {
            experience,
            mood: 'Calm',
            islamicTerm: 'The Day of Light',
            kahfQueue,
          });
        }
        return;
      }

      const mood = localSelectedMoodRef.current || 'Calm';
      const experience = await fetchWindowGuidance(mood);
      if (experience && navigation.isFocused()) {
        navigation.navigate('Guidance', {
          experience,
          mood,
          islamicTerm: getSpiritualWindowName(prayerContext),
        });
      }
    } catch (error) {
      logServiceError('HomeScreen', 'navigateToTimedGuidance', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setWindowLoading(false);
      isHandlingTap.current = false;
    }
  }, [prayerContext, navigation, fetchWindowGuidance, isFriday]);

  // ── Derived display values ─────────────────────────────────────

  const showBanner = !checkedInToday && !bannerDismissed;
  const progressPct = activePath
    ? Math.round((activePath.currentDay / activePath.totalDays) * 100)
    : 0;

  // `now` ticks each minute and on foreground resume, so these stay current
  // (previously they were computed once per mount and went stale overnight).
  const greeting = useMemo(() => getTimeGreeting(), [now]);

  const lastCheckinLabel = useMemo(() => {
    if (!lastCheckin) return '';
    const diff = now - lastCheckin.timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 2) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'yesterday' : `${days} days ago`;
  }, [lastCheckin?.timestamp, now]);

  /* ─── Render ─────────────────────────────────────────────────── */

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.celestialWash} style={styles.gradient}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={scrollContentStyle}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accent.primary}
              colors={[Colors.accent.primary]}
            />
          }
        >
          {/* ═══ HERO HEADER ════════════════════════════════════ */}
          <HeroHeader
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
            onSettingsPress={() => navigation.navigate('Settings')}
            greeting={greeting}
          />

          {/* ═══ VERSE OF THE DAY ═══════════════════════════════ */}
          <VerseOfTheDay dailyVerse={dailyVerse} fadeAnim={fadeAnim} slideAnim={slideAnim} />

          {/* ═══ STREAK BAR ══════════════════════════════════════ */}
          <StreakBar
            streakDays={streakDays}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
            onPress={() => navigation.navigate('MoodHistory')}
          />

          {/* ═══ STREAK MILESTONE (spec §8 peak) ═════════════════ */}
          {streakMilestone !== null && (
            <StreakMilestoneBanner
              milestone={streakMilestone}
              onDismiss={dismissStreakMilestone}
              onSupport={
                offerSupportForMilestone
                  ? () => { dismissStreakMilestone(); navigation.navigate('Support'); }
                  : undefined
              }
            />
          )}

          {/* ═══ SPIRITUAL WINDOW ════════════════════════════════ */}
          <SpiritualWindowBanner
            prayerContext={prayerContext}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
            onPress={navigateToTimedGuidance}
            loading={windowLoading}
            isFriday={isFriday}
          />

          {/* ═══ HOW IS YOUR HEART? ══════════════════════════════ */}
          <View style={styles.moodSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderTitle}>How Is Your Heart?</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Tap your mood — and let the Quran meet you there</Text>

            {/* Last check-in pill */}
            {lastCheckin && (() => {
              const lm = moodConfigs.find((m) => m.id === lastCheckin.moodId);
              if (!lm) return null;
              return (
                <View style={[styles.lastCheckinPill, { backgroundColor: lm.color + '0D', borderColor: lm.color + '25' }]}>
                  <View style={[styles.lastCheckinDot, { backgroundColor: lm.color }]} />
                  <Text style={[styles.lastCheckinText, { color: lm.color }]}>
                    Last check-in:{' '}
                    <Text style={{ fontFamily: Typography.fonts.serif }}>
                      {lm.label}
                    </Text>
                    <Text style={{ opacity: 0.55 }}> · {lastCheckinLabel}</Text>
                  </Text>
                </View>
              );
            })()}

            {showBanner && <CheckInBanner onDismiss={() => setBannerDismissed(true)} />}

            <SmartMoodGrid
              moodConfigs={moodConfigs}
              selectedMood={localSelectedMood}
              loadingMood={loadingMood}
              onMoodPress={handleMoodTap}
            />

            {checkedInToday && localSelectedMood && (
              <View style={styles.successRow}>
                <Ionicons name="sparkles" size={11} color={Colors.accent.primary} />
                <Text style={styles.successText}>Heart logged today · Barakallahu feekum</Text>
                <Ionicons name="sparkles" size={11} color={Colors.accent.primary} />
              </View>
            )}
          </View>

          {/* ═══ SACRED JOURNEY ══════════════════════════════════ */}
          {!activePath && (
            <View style={styles.journeySection}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Journeys')}
                activeOpacity={0.85}
              >
                {/* Opaque fill, same two-layer recipe as StreakBar and
                    VerseOfTheDay: a solid surface gradient with the gold tint
                    laid over it. This card used to be a 5%-alpha gold wash, so
                    whatever sat behind it (the tab bar, at the bottom of the
                    scroll) showed straight through. */}
                <LinearGradient
                  colors={[Colors.background.secondary, Colors.background.primary]}
                  style={styles.journeyDiscoveryCard}
                >
                  <LinearGradient
                    colors={[`${Colors.accent.primary}1F`, `${Colors.accent.primary}05`]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    pointerEvents="none"
                  />
                  <View style={styles.journeyDiscoveryLeft}>
                    <View style={styles.journeyDiscoveryIcon}>
                      <Ionicons name="compass-outline" size={22} color={Colors.accent.primary} />
                    </View>
                    <View style={styles.journeyDiscoveryText}>
                      <Text style={styles.journeyDiscoveryTitle}>Start a Guided Journey</Text>
                      <Text style={styles.journeyDiscoverySub}>Build salah, dhikr & reflection habits, step by step</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.text.steel} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
          {activePath && (
            <View style={styles.journeySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>SACRED JOURNEY</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Journeys')}
                  style={styles.seeAllButton}
                >
                  <Text style={styles.seeAllText}>All paths</Text>
                  <Ionicons name="chevron-forward" size={11} color="#8BA4BF" />
                </TouchableOpacity>
              </View>

              {/* Opens the journey itself. This used to go to the Journeys
                  list, so the one card showing "Day 2 of 14" of a specific
                  path dropped the user on a catalogue and made them find it
                  again. "All paths" above is the route to the list. */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('PathDetail', { pathId: activePath.pathId })}
              >
                {/* Shadow on a plain outer View — see ShareSheet.tsx's previewCardShadow
                    for why elevation can't share a view with overflow:'hidden'+borderRadius
                    on Android (shadow's rounded-rect backing shows through the clip). */}
                <View style={styles.journeyCardShadow}>
                <LinearGradient
                  colors={[Colors.background.secondary, Colors.background.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.journeyCard, { borderColor: activePath.color + '40' }]}
                >
                  {/* Path-identity tint — same low-alpha diagonal wash as the
                      journey cards on the Journeys screen, so this card carries
                      the active path's own color instead of a fixed brown/gold. */}
                  <LinearGradient
                    colors={[`${activePath.color}1F`, `${activePath.color}05`]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    pointerEvents="none"
                  />
                  <JourneyMandalaBackdrop size={180} color={activePath.color} />

                  <View style={styles.journeyCardTop}>
                    <View style={styles.journeyCardTopLeft}>
                      <View style={[styles.journeyIcon, { backgroundColor: activePath.color + '15', borderColor: activePath.color + '25' }]}>
                        <MaterialCommunityIcons name={activePath.icon} size={20} color={activePath.color} />
                      </View>
                      <View style={styles.journeyInfo}>
                        <Text style={[styles.journeyPathLabel, { color: activePath.color }]}>{activePath.pathLabel}</Text>
                        <Text style={styles.journeyTitle}>{activePath.stepTitle.toUpperCase()}</Text>
                        {activePath.stepFocus && (
                          <Text style={styles.journeySubtitle} numberOfLines={1}>{activePath.stepFocus}</Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.text.steel} style={{ marginTop: 2 }} />
                  </View>

                  <View style={styles.progressBarTrack}>
                    <LinearGradient
                      colors={[activePath.color, `${activePath.color}CC`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressBarFill, { width: `${Math.max(0, Math.min(100, progressPct))}%` }]}
                    />
                  </View>

                  <View style={styles.journeyFooter}>
                    <Text style={styles.journeyDayText}>Day {activePath.currentDay} of {activePath.totalDays}</Text>
                    <Text style={[styles.journeyPctText, { color: activePath.color }]}>{progressPct}% COMPLETE</Text>
                  </View>
                </LinearGradient>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══ QUICK ACTIONS ════════════════════════════════════ */}
          <View style={styles.quickActionsSection}>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={[styles.quickCard, { borderColor: Colors.accent.primary + '40' }]}
                onPress={() => navigation.navigate('PrayerTimes')}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[Colors.background.secondary, Colors.background.primary]} style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={[Colors.accent.primary + '1F', Colors.accent.primary + '05']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  pointerEvents="none"
                />
                <View style={[styles.quickCardIcon, { backgroundColor: Colors.background.secondary, borderColor: Colors.glass.border }]}>
                  <PrayerArchIcon size={18} color={Colors.accent.primary} />
                </View>
                <Text style={styles.quickCardTitle}>PRAYER TIMES</Text>
                <Text style={[styles.quickCardValue, { color: Colors.accent.primary }]}>
                  {nextPrayer ? `${nextPrayer.name} ${formatPrayerTime(nextPrayer.time, timeFormat)}` : 'View all'}
                </Text>
                <Text style={styles.quickCardSub}>
                  {nextPrayer
                    ? `in ${formatCountdown(nextPrayer.minutesRemaining)} · ${currentCity}`
                    : currentCity || 'Today'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickCard, { borderColor: Colors.accent.secondary + '40' }]}
                onPress={() => navigation.navigate('Journal')}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[Colors.background.secondary, Colors.background.primary]} style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={[Colors.accent.secondary + '1F', Colors.accent.secondary + '05']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  pointerEvents="none"
                />
                <View style={[styles.quickCardIcon, { backgroundColor: Colors.background.secondary, borderColor: Colors.glass.border }]}>
                  <QuillIcon size={18} color={Colors.accent.secondary} />
                </View>
                <Text style={styles.quickCardTitle}>JOURNAL</Text>
                <Text style={[styles.quickCardValue, { color: Colors.accent.secondary }]}>Write today</Text>
                <Text style={styles.quickCardSub}>Private to you</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <LocationPickerModal
          visible={showLocationModal}
          currentLocation={{ city: currentCity, country: currentCountry }}
          onClose={() => setShowLocationModal(false)}
          onLocationSelected={() => loadPrayerData()}
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
  scrollContent: {},

  moodSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    color: '#F0E6D3',
    fontFamily: Typography.fonts.serif,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: 'rgba(176, 196, 215, 0.65)',
    letterSpacing: 0.2,
    marginBottom: 14,
    marginTop: -4,
  },
  journeyDiscoveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.22)',
    // Clips the absolute-fill tint layer to the rounded corners. Safe here
    // because this card carries no elevation (see journeyCardShadow for the
    // Android case where overflow + borderRadius + elevation conflict).
    overflow: 'hidden',
  },
  journeyDiscoveryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  journeyDiscoveryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyDiscoveryText: {
    flex: 1,
  },
  journeyDiscoveryTitle: {
    fontSize: 15,
    color: '#F0E6D3',
    fontFamily: Typography.fonts.serif,
    fontWeight: '600',
    marginBottom: 3,
  },
  journeyDiscoverySub: {
    fontSize: 12,
    color: 'rgba(176, 196, 215, 0.65)',
    lineHeight: 17,
  },
  seeAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllText: {
    fontSize: 11.5,
    color: '#8BA4BF',
    fontFamily: Typography.fonts.serif,
    letterSpacing: 0.5,
  },

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
  lastCheckinDot: { width: 6, height: 6, borderRadius: 3, opacity: 0.8 },
  lastCheckinText: { fontSize: 10.5, opacity: 0.85 },

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
    fontFamily: Typography.fonts.serif,
    letterSpacing: 0.8,
    opacity: 0.8,
  },

  journeySection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  // Shadow only — no overflow/borderRadius-vs-elevation conflict here since
  // this view clips nothing. See ShareSheet.tsx's previewCardShadow.
  journeyCardShadow: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  journeyCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  journeyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  journeyCardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
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
    fontFamily: Typography.fonts.serif,
    marginBottom: 4,
    fontWeight: '700',
  },
  journeyTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: Typography.fonts.serif,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  journeySubtitle: { fontSize: 12, color: '#8BA4BF' },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(30, 58, 95, 0.5)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: { height: '100%', borderRadius: 3 },
  journeyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journeyDayText: { fontSize: 12, color: Colors.text.steel },
  journeyPctText: {
    fontSize: 11,
    fontFamily: Typography.fonts.serif,
    fontWeight: '700',
    letterSpacing: 1,
  },

  quickActionsSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xxl },
  quickActionsRow: { flexDirection: 'row', gap: 12 },
  quickCard: { flex: 1, borderRadius: 16, padding: 16, borderWidth: 1, overflow: 'hidden' },
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
    fontFamily: Typography.fonts.serif,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  quickCardValue: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  quickCardSub: { fontSize: 11, color: Colors.text.steel, marginTop: 2 },
});
