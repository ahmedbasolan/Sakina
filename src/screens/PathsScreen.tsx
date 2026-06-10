/**
 * PathsScreen — Sacred Journeys
 *
 * Deep navy background, twinkling stars, mandala backdrop (matching image-3
 * reference), stats bar with real data, and journey cards with accurate
 * progress pulled from UserPathProgress.
 *
 * Bugs fixed:
 * - Progress bar was always 0 (used SpiritualPath.currentDay which doesn't
 *   exist — now uses UserPathProgress.completedDays.length)
 * - "Days left" was hardcoded to 21 — now computed from live progress
 * - Active-card mandala was inside BlurView (overflow:hidden) — now sits
 *   outside so it renders correctly
 */
import React, { useState, useEffect, useRef } from 'react';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserPathProgress } from '../types';
import { PathsService } from '../services/pathsService';
import { AnimatedMandala } from '../components/AnimatedMandala';
import { TwinklingStar } from '../components/home/TwinklingStar';
import { getPathVisual } from '../constants/pathVisuals';

const { width } = Dimensions.get('window');

// ── Star positions for the header backdrop ─────────────────────
const STAR_POSITIONS = [
  { x: 0.06, y: 0.08, delay: 0, size: 1.8 },
  { x: 0.9, y: 0.06, delay: 500, size: 1.5 },
  { x: 0.78, y: 0.35, delay: 900, size: 2.2 },
  { x: 0.14, y: 0.42, delay: 300, size: 1.5 },
  { x: 0.55, y: 0.15, delay: 700, size: 1.2 },
];

// ── Path icon / colour map — sourced from shared constants ─────
const getVisual = (id: string) => getPathVisual(id);

// ── JourneyCard ─────────────────────────────────────────────────
interface JourneyCardProps {
  path: any;
  index: number;
  isActive: boolean;
  /** Actual progress record from the database — may be undefined for untouched paths */
  userProgress?: UserPathProgress;
  onPress: () => void;
}

function JourneyCard({ path, index, isActive, userProgress, onPress }: JourneyCardProps) {
  const visual = getVisual(path.id);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 150 + index * 90,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 80,
        delay: 150 + index * 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Real progress from UserPathProgress ──
  const totalDays = path.duration || 7;
  const completedDays = userProgress?.completedDays.length ?? 0;
  const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {/* Active-card mandala — OUTSIDE BlurView so overflow:hidden doesn't clip it */}
      {isActive && (
        <View style={styles.cardMandalaWrap} pointerEvents="none">
          <AnimatedMandala size={140} color={visual.color} opacity={0.36} />
        </View>
      )}

      <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
        <BlurView
          intensity={10}
          tint="dark"
          style={[styles.journeyCard, isActive && { borderColor: `${visual.color}50` }]}
        >
          <View style={styles.journeyCardInner}>
            {/* Top row: icon + info + chevron */}
            <View style={styles.journeyTop}>
              <View
                style={[
                  styles.journeyIcon,
                  { backgroundColor: `${visual.color}18`, borderColor: `${visual.color}30` },
                ]}
              >
                <MaterialCommunityIcons name={visual.icon} size={22} color={visual.color} />
              </View>
              <View style={styles.journeyInfo}>
                <View style={styles.pathLabelRow}>
                  <Text style={[styles.journeyPathLabel, { color: visual.color }]}>
                    {totalDays}-DAY PATH
                  </Text>
                </View>
                <Text style={[styles.journeyTitle, { color: visual.color }]}>
                  {path.title.toUpperCase()}
                </Text>
                <Text style={styles.journeyTheme}>{path.target || path.theme}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#6B8EAE" />
            </View>

            {/* Description */}
            <Text style={styles.journeyDescription} numberOfLines={3}>
              {path.description}
            </Text>

            {/* Progress bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={[visual.color, `${visual.color}CC`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${Math.max(progress, 0)}%` }]}
                />
              </View>
              <Text style={[styles.journeyPct, { color: visual.color }]}>
                {completedDays}/{totalDays}
              </Text>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── PathsScreen ─────────────────────────────────────────────────
export default function PathsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [PATHS, setPaths] = useState<any[]>([]);
  const [userProgressList, setUserProgressList] = useState<UserPathProgress[]>([]);
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadPaths = async () => {
      const svc = PathsService.getInstance();
      const progress = await svc.getAllProgress();
      setUserProgressList(progress);
      const allPaths = svc.getAllPaths();
      setPaths(allPaths);
    };
    loadPaths();
    Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const onPathSelected = (pathId: string) => navigation.navigate('PathDetail', { pathId });

  // ── Real stats ──────────────────────────────────────────────
  const activeCount = userProgressList.filter((p) => !p.isCompleted).length;

  const daysLeft = userProgressList
    .filter((p) => !p.isCompleted)
    .reduce((sum, p) => {
      const pathDef = PATHS.find((path) => path.id === p.pathId);
      if (!pathDef) return sum;
      return sum + Math.max(0, pathDef.duration - p.completedDays.length);
    }, 0);

  const stats = [
    { label: 'Paths', value: PATHS.length.toString(), color: Colors.accent.primary },
    { label: 'Active', value: activeCount.toString(), color: '#34D399' },
    { label: 'Days left', value: daysLeft > 0 ? daysLeft.toString() : '—', color: '#60A5FA' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A1321', '#0C1A2E']} style={StyleSheet.absoluteFill} />

      {/* ── Header with mandala backdrop ─────────────────────── */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 16, opacity: headerFade }]}>
        {/* Twinkling stars */}
        {STAR_POSITIONS.map((s, i) => (
          <TwinklingStar key={i} x={s.x} y={s.y} delay={s.delay} size={s.size} />
        ))}

        {/* Mandala backdrop — two rings, centered behind the title */}
        <View style={styles.headerMandalaOuter} pointerEvents="none">
          <AnimatedMandala size={290} color={Colors.accent.primary} opacity={0.12} />
        </View>
        <View style={styles.headerMandalaInner} pointerEvents="none">
          <AnimatedMandala size={180} color={Colors.accent.primary} opacity={0.1} direction="ccw" />
        </View>

        {/* Header text — sits on top of the mandala (zIndex: 1) */}
        <View style={styles.headerText}>
          <Text style={styles.topBarText}>★ SAKINA</Text>
          <Text style={styles.headerPretitle}>GUIDED PROGRAMS</Text>
          <Text style={styles.headerTitle}>Sacred Journeys</Text>
          <Text style={styles.headerSub}>
            Curated paths for lasting spiritual transformation.
          </Text>
        </View>
      </Animated.View>

      {/* ── Content ──────────────────────────────────────────── */}
      <FlatList
        style={styles.scrollView}
        data={PATHS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.lg }} />}
        ListHeaderComponent={
          <Animated.View style={[styles.statsRow, { opacity: headerFade }]}>
            {stats.map((stat) => (
              <BlurView key={stat.label} intensity={12} tint="dark" style={styles.statCard}>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </BlurView>
            ))}
          </Animated.View>
        }
        renderItem={({ item, index }) => {
          const userProgress = userProgressList.find((p) => p.pathId === item.id);
          const isActive = !!userProgress && !userProgress.isCompleted;
          return (
            <JourneyCard
              path={item}
              index={index}
              isActive={isActive}
              userProgress={userProgress}
              onPress={() => onPathSelected(item.id)}
            />
          );
        }}
      />
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C1A2E' },

  /* ── Header ── */
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    zIndex: 2,
    overflow: 'hidden',
    // Height driven by text content
    minHeight: 180,
  },
  headerMandalaOuter: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
  },
  headerMandalaInner: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
  },
  headerText: {
    zIndex: 1,
  },
  topBarText: {
    fontSize: Typography.sizes.detail,
    color: Colors.accent.primary,
    letterSpacing: 2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  headerPretitle: {
    fontSize: 10,
    color: 'rgba(201,168,76,0.8)',
    letterSpacing: 2.5,
    fontFamily: Typography.fonts.serif,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 30,
    color: Colors.text.primary,
    fontFamily: Typography.fonts.serif,
    fontWeight: '400',
    letterSpacing: 0.3,
    marginBottom: 6,
    textShadowColor: 'rgba(201,168,76,0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  headerSub: {
    fontSize: 13,
    color: '#7B8FA1',
    lineHeight: 18,
  },

  /* ── Scroll content ── */
  scrollView: { flex: 1, zIndex: 2 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },

  /* ── Stats bar ── */
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  statValue: {
    fontSize: Typography.sizes.h1,
    fontWeight: '400',
    marginBottom: Spacing.xs,
    fontFamily: Typography.fonts.serif,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B8EAE',
    letterSpacing: 0.5,
  },

  /* Active-card mandala — outside BlurView so overflow:hidden doesn't clip */
  cardMandalaWrap: {
    position: 'absolute',
    top: -50,
    right: -50,
    zIndex: 0,
  },

  journeyCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  journeyCardInner: {
    padding: Spacing.lg,
    backgroundColor: 'rgba(15,25,40,0.6)',
  },
  journeyTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  journeyIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyInfo: { flex: 1, marginTop: 2 },
  pathLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  journeyPathLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: Typography.fonts.serif,
    fontWeight: '700',
  },
  journeyTitle: {
    fontSize: 19,
    fontFamily: Typography.fonts.serif,
    fontWeight: '400',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  journeyTheme: {
    fontSize: Typography.sizes.detail,
    color: '#7B8FA1',
  },
  journeyDescription: {
    fontSize: 13,
    color: '#7B8FA1',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  journeyPct: {
    fontSize: Typography.sizes.detail,
    fontWeight: '700',
    letterSpacing: 0.5,
    minWidth: 36,
    textAlign: 'right',
  },
});
