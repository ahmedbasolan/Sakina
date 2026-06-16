import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { getSpiritualWindowName } from '../utils/prayerContext';
import { formatPrayerTime, formatCountdown } from '../services/prayerTimesService';
import { Colors, Spacing, Typography } from '../theme/DesignSystem';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
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
import { AnimatedMandala } from '../components/AnimatedMandala';
import { logServiceError } from '../services/errorLoggingService';
import { HapticsService } from '../services/hapticsService';
import { FreemiumService } from '../services/freemiumService';
import { getCachedGuidance, setCachedGuidance } from '../services/windowGuidanceCache';
import {
  HeroHeader,
  VerseOfTheDay,
  StreakBar,
  SpiritualWindowBanner,
  CheckInBanner,
  SmartMoodGrid,
} from '../components/home';
import { useHomeData } from '../hooks/useHomeData';

const { width } = Dimensions.get('window');

/* ─── Constants ──────────────────────────────────────────────── */

// Colors aligned with MoodColors in DesignSystem.ts (GuidanceScreen source of truth)
// so the accent colour a user sees on the card matches the immersive background they enter.
const moodConfigs: MoodConfig[] = [
  { id: 'Grateful',    label: 'GRATEFUL',    sublabel: 'Shukr',   color: '#FBBF24', bgColor: '#451A03', borderColor: '#78350F', iconName: 'heart' },
  { id: 'Hopeful',     label: 'HOPEFUL',     sublabel: 'Amal',    color: '#22D3EE', bgColor: '#083344', borderColor: '#155E75', iconName: 'sunny' },
  { id: 'Calm',        label: 'PEACEFUL',    sublabel: 'Sukoon',  color: '#34D399', bgColor: '#064E3B', borderColor: '#065F46', iconName: 'water' },
  { id: 'Overwhelmed', label: 'OVERWHELMED', sublabel: 'Ghamm',   color: '#818CF8', bgColor: '#0F172A', borderColor: '#1E1B4B', iconName: 'layers' },
  { id: 'Tired',       label: 'TIRED',       sublabel: "Ta'ab",   color: '#D6D3D1', bgColor: '#1C1917', borderColor: '#292524', iconName: 'moon' },
  { id: 'Lonely',      label: 'LONELY',      sublabel: 'Wahshah', color: '#C084FC', bgColor: '#2E1065', borderColor: '#4C1D95', iconName: 'person' },
  { id: 'Sad',         label: 'SAD',         sublabel: 'Huzn',    color: '#94A3B8', bgColor: '#1E293B', borderColor: '#334155', iconName: 'rainy' },
  { id: 'Angry',       label: 'ANGRY',       sublabel: 'Ghadab',  color: '#FB923C', bgColor: '#1A0F0A', borderColor: '#2D1610', iconName: 'flame' },
];

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
    currentCity, currentCountry,
    streakDays,
    checkedInToday, setCheckedInToday,
    bannerDismissed, setBannerDismissed,
    lastCheckin,
    localSelectedMood, setLocalSelectedMood,
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
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Double-tap guard (view concern — prevents two nav pushes) ─
  const isHandlingTap = useRef(false);

  // Window-aware guidance fetch shared by the mood grid and the timed card.
  // Free users get ONE fresh verse per mood per prayer window from Home;
  // re-taps inside the same window return that delivered verse (it's "saved
  // for you", as the resting point promises). Fresh verses beyond the first
  // flow only through GuidanceScreen's gated refresh budget — without this,
  // re-tapping a mood minted unlimited verses and bypassed the resting point.
  const fetchWindowGuidance = useCallback(async (moodId: Mood) => {
    const freemium = FreemiumService.getInstance();
    await freemium.syncPrayerWindow();
    const windowKey = freemium.getSessionInfo()?.windowKey;
    const gated = !freemium.isPremium() && !!windowKey;

    if (gated) {
      const cached = await getCachedGuidance(windowKey!, moodId);
      if (cached) return cached;
    }
    const experience = await rotationEngine.getGuidance(moodId);
    if (experience && gated) {
      await setCachedGuidance(windowKey!, moodId, experience);
    }
    return experience;
  }, [rotationEngine]);

  // ── Mood tap ───────────────────────────────────────────────────
  const handleMoodTap = useCallback(async (moodId: Mood) => {
    if (isHandlingTap.current) return;
    isHandlingTap.current = true;
    // Instant response BEFORE the async guidance fetch — a tap from someone
    // in distress must never feel dead while the content loads. The
    // selection is reverted if the fetch fails.
    const previousMood = localSelectedMood;
    setLocalSelectedMood(moodId);
    HapticsService.impactAsync('LIGHT');
    try {
      const experience = await fetchWindowGuidance(moodId);
      if (experience) {
        setSelectedMood(moodId);
        setCheckedInToday(true);
        navigation.navigate('Guidance', {
          experience,
          mood: moodId,
          islamicTerm: moodConfigs.find((m) => m.id === moodId)?.label || moodId,
        });
      } else {
        setLocalSelectedMood(previousMood);
        logServiceError('HomeScreen', 'handleMoodTap', new Error(`getGuidance returned null for mood: ${moodId}`));
      }
    } catch (error) {
      setLocalSelectedMood(previousMood);
      logServiceError('HomeScreen', 'handleMoodTap', error instanceof Error ? error : new Error(String(error)));
    } finally {
      isHandlingTap.current = false;
    }
  }, [navigation, fetchWindowGuidance, setSelectedMood, setLocalSelectedMood, setCheckedInToday, localSelectedMood]);

  const navigateToTimedGuidance = useCallback(async () => {
    const mood = localSelectedMood || 'Calm';
    try {
      const experience = await fetchWindowGuidance(mood);
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
  }, [localSelectedMood, prayerContext, navigation, fetchWindowGuidance]);

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
      <LinearGradient colors={['#07111E', '#0C1A2E', '#0F1519']} style={styles.gradient}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
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

          {/* ═══ SPIRITUAL WINDOW ════════════════════════════════ */}
          <SpiritualWindowBanner
            prayerContext={prayerContext}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
            onPress={navigateToTimedGuidance}
          />

          {/* ═══ HOW IS YOUR HEART? ══════════════════════════════ */}
          <View style={styles.moodSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderTitle}>How Is Your Heart?</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Tap your mood to receive a personalised verse</Text>

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
              onMoodPress={handleMoodTap}
            />

            {checkedInToday && localSelectedMood && (
              <View style={styles.successRow}>
                <Ionicons name="sparkles" size={11} color={Colors.accent.primary} />
                <Text style={styles.successText}>Heart logged today · Barakallahu feek</Text>
                <Ionicons name="sparkles" size={11} color={Colors.accent.primary} />
              </View>
            )}
          </View>

          {/* ═══ SACRED JOURNEY ══════════════════════════════════ */}
          {!activePath && (
            <View style={styles.journeySection}>
              <TouchableOpacity
                style={styles.journeyDiscoveryCard}
                onPress={() => navigation.navigate('Journeys')}
                activeOpacity={0.85}
              >
                <View style={styles.journeyDiscoveryLeft}>
                  <View style={styles.journeyDiscoveryIcon}>
                    <Ionicons name="compass-outline" size={22} color={Colors.accent.primary} />
                  </View>
                  <View style={styles.journeyDiscoveryText}>
                    <Text style={styles.journeyDiscoveryTitle}>Start a Guided Journey</Text>
                    <Text style={styles.journeyDiscoverySub}>Build salah, dhikr & reflection habits, step by step</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6B8EAE" />
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

              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Journeys')}>
                <LinearGradient
                  colors={['#18150F', '#0B1019']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.journeyCard, { borderColor: '#262214' }]}
                >
                  <View style={styles.journeyMandala} pointerEvents="none">
                    <AnimatedMandala size={180} color={activePath.color} opacity={0.24} />
                  </View>

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
                    <Ionicons name="chevron-forward" size={16} color="#6B8EAE" style={{ marginTop: 2 }} />
                  </View>

                  <View style={styles.progressBarTrack}>
                    <LinearGradient
                      colors={['#C9A84C', '#EDD9A3']}
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
              </TouchableOpacity>
            </View>
          )}

          {/* ═══ QUICK ACTIONS ════════════════════════════════════ */}
          <View style={styles.quickActionsSection}>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={[styles.quickCard, { backgroundColor: '#0F2236', borderColor: '#1E3A5F' }]}
                onPress={() => navigation.navigate('PrayerTimes')}
                activeOpacity={0.85}
              >
                <View style={[styles.quickCardIcon, { backgroundColor: '#0A1828', borderColor: '#1A3A5A' }]}>
                  <PrayerArchIcon size={18} color="#60A5FA" />
                </View>
                <Text style={styles.quickCardTitle}>PRAYER TIMES</Text>
                <Text style={[styles.quickCardValue, { color: '#60A5FA' }]}>
                  {nextPrayer ? `${nextPrayer.name} ${formatPrayerTime(nextPrayer.time, timeFormat)}` : 'View all'}
                </Text>
                <Text style={styles.quickCardSub}>
                  {nextPrayer ? `in ${formatCountdown(nextPrayer.minutesRemaining)}` : 'Today'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickCard, { backgroundColor: '#180E2E', borderColor: '#3D1E6A' }]}
                onPress={() => navigation.navigate('Journal')}
                activeOpacity={0.85}
              >
                <View style={[styles.quickCardIcon, { backgroundColor: '#120A20', borderColor: '#2A1040' }]}>
                  <QuillIcon size={18} color="#C084FC" />
                </View>
                <Text style={styles.quickCardTitle}>JOURNAL</Text>
                <Text style={[styles.quickCardValue, { color: '#C084FC' }]}>Write today</Text>
                <Text style={styles.quickCardSub}>Private to you</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <LocationPickerModal
          visible={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onLocationSelected={(location) => {
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
    backgroundColor: 'rgba(201, 168, 76, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.14)',
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
  journeyMandala: { position: 'absolute', top: -20, right: -40 },
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
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: Typography.fonts.serif,
    fontWeight: '500',
    letterSpacing: 0.5,
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
  journeyDayText: { fontSize: 12, color: '#6B8EAE' },
  journeyPctText: {
    fontSize: 11,
    fontFamily: Typography.fonts.serif,
    fontWeight: '700',
    letterSpacing: 1,
  },

  quickActionsSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xxl },
  quickActionsRow: { flexDirection: 'row', gap: 12 },
  quickCard: { flex: 1, borderRadius: 16, padding: 16, borderWidth: 1 },
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
  quickCardSub: { fontSize: 11, color: '#6B8EAE', marginTop: 2 },
});
