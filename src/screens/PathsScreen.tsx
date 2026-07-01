/**
 * PathsScreen — Sacred Journeys
 *
 * Filter tabs (All | Active | Completed) replace the old stat boxes.
 * Available paths: path_rizq_revolution, path_salah_transformation.
 * All other paths show an "Early Access · Premium" locked state.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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

// ── Paths available for users to start ─────────────────────────
const AVAILABLE_PATH_IDS = new Set([
  'path_rizq_revolution',
  'path_salah_transformation',
  'path_study_journaling',
  'path_trusting_the_results',
]);

// ── Star positions for the header backdrop ──────────────────────
const STAR_POSITIONS = [
  { x: 0.06, y: 0.08, delay: 0,   size: 1.8 },
  { x: 0.9,  y: 0.06, delay: 500, size: 1.5 },
  { x: 0.78, y: 0.35, delay: 900, size: 2.2 },
  { x: 0.14, y: 0.42, delay: 300, size: 1.5 },
  { x: 0.55, y: 0.15, delay: 700, size: 1.2 },
];

type FilterTab = 'all' | 'active' | 'completed';

// ── FilterBar ───────────────────────────────────────────────────
interface FilterBarProps {
  active: FilterTab;
  onChange: (tab: FilterTab) => void;
  counts: { all: number; active: number; completed: number };
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'active',    label: 'Active'    },
  { key: 'completed', label: 'Completed' },
];

function FilterBar({ active, onChange, counts }: FilterBarProps) {
  return (
    <View style={filterStyles.row}>
      {TABS.map((tab) => {
        const isSelected = active === tab.key;
        const count = counts[tab.key];
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.75}
            onPress={() => onChange(tab.key)}
            style={[filterStyles.tab, isSelected && filterStyles.tabActive]}
          >
            <Text style={[filterStyles.label, isSelected && filterStyles.labelActive]}>
              {tab.label}
            </Text>
            {count > 0 && (
              <View style={[filterStyles.badge, isSelected && filterStyles.badgeActive]}>
                <Text style={[filterStyles.badgeText, isSelected && filterStyles.badgeTextActive]}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const filterStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: 11,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tabActive: {
    borderColor: `${Colors.accent.primary}50`,
    backgroundColor: `${Colors.accent.primary}12`,
  },
  label: {
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: Colors.text.muted,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: Colors.accent.primary,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: `${Colors.accent.primary}25`,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.muted,
  },
  badgeTextActive: {
    color: Colors.accent.primary,
  },
});

// ── JourneyCard ─────────────────────────────────────────────────
interface JourneyCardProps {
  path: any;
  index: number;
  isActive: boolean;
  isLocked: boolean;
  userProgress?: UserPathProgress;
  onPress: () => void;
}

function JourneyCard({ path, index, isActive, isLocked, userProgress, onPress }: JourneyCardProps) {
  const visual = getPathVisual(path.id);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: isLocked ? 0.65 : 1,
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

  const totalDays = path.duration || 7;
  const completedDays = userProgress?.completedDays.length ?? 0;
  const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const cardColor = isLocked ? `${visual.color}80` : visual.color;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {/* Active-card mandala — OUTSIDE BlurView so overflow:hidden doesn't clip it */}
      {isActive && !isLocked && (
        <View style={styles.cardMandalaWrap} pointerEvents="none">
          <AnimatedMandala size={140} color={visual.color} opacity={0.36} />
        </View>
      )}

      <TouchableOpacity activeOpacity={isLocked ? 0.95 : 0.88} onPress={onPress}>
        <BlurView
          intensity={10}
          tint="dark"
          style={[
            styles.journeyCard,
            !isActive && !isLocked && { borderColor: 'rgba(212, 175, 55, 0.20)' },
            isActive && !isLocked && { borderColor: `${visual.color}65` },
            isLocked && styles.journeyCardLocked,
          ]}
        >
          <View style={[styles.journeyCardInner, isLocked && styles.journeyCardInnerLocked]}>
            {/* Top row: icon + info + badge/chevron */}
            <View style={styles.journeyTop}>
              <View
                style={[
                  styles.journeyIcon,
                  { backgroundColor: `${cardColor}18`, borderColor: `${cardColor}30` },
                ]}
              >
                <MaterialCommunityIcons
                  name={isLocked ? 'lock-outline' : visual.icon}
                  size={22}
                  color={cardColor}
                />
              </View>
              <View style={styles.journeyInfo}>
                <View style={styles.pathLabelRow}>
                  <Text style={[styles.journeyPathLabel, { color: cardColor }]}>
                    {totalDays}-DAY PATH
                  </Text>
                </View>
                <Text style={[styles.journeyTitle, { color: cardColor }]}>
                  {path.title.toUpperCase()}
                </Text>
                <Text style={[styles.journeyTheme, { color: `${cardColor}CC` }]}>
                  {path.target || path.theme}
                </Text>
              </View>
              {isLocked ? (
                <View style={styles.earlyAccessBadge}>
                  <MaterialCommunityIcons name="star-four-points" size={9} color={Colors.accent.primary} />
                  <Text style={styles.earlyAccessText}>PREMIUM</Text>
                </View>
              ) : (
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.text.muted} />
              )}
            </View>

            {/* Description */}
            <Text
              style={[styles.journeyDescription, isLocked && { color: `${Colors.text.muted}80` }]}
              numberOfLines={2}
            >
              {path.description}
            </Text>

            {/* Bottom: progress (unlocked) or coming-soon pill (locked) */}
            {isLocked ? (
              <View style={styles.lockedStatus}>
                <MaterialCommunityIcons name="lock" size={11} color={`${Colors.accent.primary}70`} />
                <Text style={styles.lockedStatusText}>EARLY ACCESS · COMING SOON</Text>
              </View>
            ) : (
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
            )}
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
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
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

  const onPathSelected = (pathId: string) => {
    if (AVAILABLE_PATH_IDS.has(pathId)) {
      navigation.navigate('PathDetail', { pathId });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // ── Filter logic ────────────────────────────────────────────
  const filteredPaths = useMemo(() => {
    if (activeFilter === 'all') return PATHS;
    if (activeFilter === 'active') {
      return PATHS.filter((path) => {
        if (!AVAILABLE_PATH_IDS.has(path.id)) return false;
        const prog = userProgressList.find((p) => p.pathId === path.id);
        return prog && !prog.isCompleted;
      });
    }
    return PATHS.filter((path) => {
      if (!AVAILABLE_PATH_IDS.has(path.id)) return false;
      const prog = userProgressList.find((p) => p.pathId === path.id);
      return prog?.isCompleted;
    });
  }, [PATHS, userProgressList, activeFilter]);

  const filterCounts = useMemo(() => ({
    all: PATHS.length,
    active: PATHS.filter((path) => {
      if (!AVAILABLE_PATH_IDS.has(path.id)) return false;
      const prog = userProgressList.find((p) => p.pathId === path.id);
      return prog && !prog.isCompleted;
    }).length,
    completed: PATHS.filter((path) => {
      if (!AVAILABLE_PATH_IDS.has(path.id)) return false;
      const prog = userProgressList.find((p) => p.pathId === path.id);
      return prog?.isCompleted;
    }).length,
  }), [PATHS, userProgressList]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.celestialWash} style={StyleSheet.absoluteFill} />

      {/* ── Header with mandala backdrop ─────────────────────── */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 16, opacity: headerFade }]}>
        {STAR_POSITIONS.map((s, i) => (
          <TwinklingStar key={i} x={s.x} y={s.y} delay={s.delay} size={s.size} />
        ))}

        <View style={styles.headerMandalaOuter} pointerEvents="none">
          <AnimatedMandala size={290} color={Colors.accent.primary} opacity={0.12} />
        </View>
        <View style={styles.headerMandalaInner} pointerEvents="none">
          <AnimatedMandala size={180} color={Colors.accent.primary} opacity={0.1} direction="ccw" />
        </View>

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
        data={filteredPaths}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.lg }} />}
        ListHeaderComponent={
          <Animated.View style={{ opacity: headerFade }}>
            <FilterBar
              active={activeFilter}
              onChange={setActiveFilter}
              counts={filterCounts}
            />
          </Animated.View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name={activeFilter === 'completed' ? 'check-circle-outline' : 'compass-outline'}
              size={44}
              color={`${Colors.accent.primary}40`}
            />
            <Text style={styles.emptyTitle}>
              {activeFilter === 'active' ? 'No active journeys' : 'None yet'}
            </Text>
            <Text style={styles.emptySub}>
              {activeFilter === 'active'
                ? 'Begin a path to see it here.'
                : 'Complete a path to see it here.'}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const userProgress = userProgressList.find((p) => p.pathId === item.id);
          const isActive = !!userProgress && !userProgress.isCompleted;
          const isLocked = !AVAILABLE_PATH_IDS.has(item.id);
          return (
            <JourneyCard
              path={item}
              index={index}
              isActive={isActive}
              isLocked={isLocked}
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
  container: { flex: 1, backgroundColor: Colors.background.primary },

  /* ── Header ── */
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    zIndex: 2,
    overflow: 'hidden',
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
  headerText: { zIndex: 1 },
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
    color: Colors.text.muted,
    lineHeight: 18,
  },

  /* ── Scroll content ── */
  scrollView: { flex: 1, zIndex: 2 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },

  /* ── Journey card ── */
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
  journeyCardLocked: {
    borderColor: 'rgba(255,255,255,0.04)',
  },
  journeyCardInner: {
    padding: Spacing.lg,
    backgroundColor: 'rgba(15,25,40,0.6)',
  },
  journeyCardInnerLocked: {
    backgroundColor: 'rgba(12,20,32,0.55)',
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
  },
  journeyDescription: {
    fontSize: 13,
    color: Colors.text.muted,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },

  /* ── Early access badge (top-right) ── */
  earlyAccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    backgroundColor: `${Colors.accent.primary}14`,
    borderWidth: 1,
    borderColor: `${Colors.accent.primary}30`,
  },
  earlyAccessText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.accent.primary,
    letterSpacing: 1,
  },

  /* ── Locked status pill (bottom of card) ── */
  lockedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignSelf: 'flex-start',
  },
  lockedStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: `${Colors.accent.primary}70`,
    letterSpacing: 1,
  },

  /* ── Progress bar (unlocked) ── */
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

  /* ── Empty state ── */
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.sizes.h2,
    color: Colors.text.primary,
    fontFamily: Typography.fonts.serif,
    fontWeight: '400',
  },
  emptySub: {
    fontSize: Typography.sizes.small,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
