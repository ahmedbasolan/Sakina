/**
 * PathsScreen — Sacred Journeys
 *
 * Filter tabs (Explore | Active | Done) partition the catalogue by state.
 * Available paths (real content, in AVAILABLE_PATH_IDS): Rizq
 * Revolution, Salah Transformation, Study Journaling, Trusting the Results,
 * Prayer Leadership, Hope After Crisis, Marriage Seeker, Tawbah Intensive,
 * Death Awareness, Screen Detox. All other paths are stubs with no
 * `dailySteps` yet and show a "Coming soon" locked state.
 *
 * Availability, release dates and who may start each journey live in
 * src/constants/journeyAvailability.ts. A path can be *available but staged
 * behind Sakina Pro* — access: 'pro_exclusive' (Marriage Seeker, Death
 * Awareness), which makes no free-tier promise. Everything else available
 * ships free. This reverses pathsService.ts's "Free-core model (spec §5)"
 * comment for the pro-exclusive paths only.
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { FrostedSurface } from '../components/FrostedSurface';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserPathProgress } from '../types';
import { PathsService } from '../services/pathsService';
import { SubscriptionService } from '../services/subscriptionService';
import { JourneyMandalaBackdrop } from '../components/JourneyMandalaBackdrop';
import { TwinklingStar } from '../components/TwinklingStar';
import { getPathVisual } from '../constants/pathVisuals';
import { AVAILABLE_PATH_IDS } from '../constants/journeyAvailability';
import { compareExploreOrder, getJourneyAccess } from '../utils/journeyAccess';
import { formatDateYMD } from '../utils/date';

// Height reserved for the pinned header (star field + filter/search row). The
// star positions below are fractions of it, so the two cannot drift apart.
const HEADER_H = 124;

// Journey availability, release dates and Pro gating: see
// src/constants/journeyAvailability.ts.

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
  { key: 'all',       label: 'Explore' },
  { key: 'active',    label: 'Active'  },
  { key: 'completed', label: 'Done'    },
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
            accessibilityRole="tab"
            accessibilityLabel={`${tab.label}${count > 0 ? `, ${count}` : ''}`}
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[filterStyles.label, isSelected && filterStyles.labelActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
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
    flex: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: 11,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  tabActive: {
    borderColor: `${Colors.accent.primary}50`,
    backgroundColor: `${Colors.accent.primary}12`,
  },
  label: {
    flexShrink: 1,
    minWidth: 0,
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
  /** Locked: why (e.g. "Free from Nov 12"). Unlocked: only "Pro early access".
   *  From src/utils/journeyAccess.ts. */
  statusLabel?: string;
  userProgress?: UserPathProgress;
  onPress: () => void;
}

function JourneyCard({ path, index, isActive, isLocked, statusLabel, userProgress, onPress }: JourneyCardProps) {
  const visual = getPathVisual(path.id);
  const isCompleted = !!userProgress?.isCompleted;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  // Entrance — mount only, hence the empty deps. It settles fadeAnim at the
  // locked/unlocked opacity for whatever `isLocked` was at mount.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ...which is why `isLocked` also needs its own effect. The card is keyed by
  // `item.id` in the FlatList, so flipping a path's lock state re-renders it
  // but never remounts it — the entrance effect above would keep the mount-time
  // opacity forever. That is reachable, not theoretical: buy Pro on the Support
  // screen and come back, PathsScreen's useFocusEffect re-reads isPremium,
  // the card's access flips to unlocked, every render-time value (colour, badge, label)
  // updates correctly — and the card stays dimmed at 0.65 as if still locked.
  // Skips its own mount pass so it can't race the delayed entrance above.
  const lockSyncedRef = useRef(false);
  useEffect(() => {
    if (!lockSyncedRef.current) {
      lockSyncedRef.current = true;
      return;
    }
    Animated.timing(fadeAnim, {
      toValue: isLocked ? 0.65 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked]);

  const totalDays = path.duration || 7;
  const completedDays = userProgress?.completedDays.length ?? 0;
  const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const cardColor = isLocked ? `${visual.color}80` : visual.color;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        activeOpacity={isLocked ? 0.95 : 0.88}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={isLocked ? `${path.title} — locked, ${(statusLabel ?? 'coming soon').toLowerCase()}` : `${path.title} — ${statusLabel ? `${statusLabel}, ` : ''}${completedDays} of ${totalDays} days complete`}
        accessibilityHint={isLocked ? undefined : 'Double tap to open this journey'}
        accessibilityState={{ disabled: isLocked }}
      >
        {/* This card is a FlatList row, so on Android the old
            `experimentalBlurMethod="dimezisBlurView"` meant one whole-screen
            re-blur per *mounted row* — roughly ten of them stacked on top of
            each other, plus the tab bar's, on every scroll frame. At
            intensity 10 the blur was very close to invisible anyway, and
            `journeyCardInner` below already paints an opaque-enough surface,
            so Android gets only a faint darkening. See FrostedSurface. */}
        <FrostedSurface
          intensity={10}
          androidFill="rgba(10, 19, 33, 0.10)"
          style={[
            styles.journeyCard,
            // Three states, three borders. Unstarted is deliberately the
            // quietest: a neutral hairline rather than the old gold, which sat
            // close enough to an active card's tinted border to read the same.
            !isActive && !isCompleted && !isLocked && { borderColor: 'rgba(255,255,255,0.09)' },
            isActive && !isLocked && { borderColor: `${visual.color}A0`, borderWidth: 1.5 },
            isCompleted && !isLocked && { borderColor: `${visual.color}45` },
            isLocked && styles.journeyCardLocked,
          ]}
        >
          <View style={[styles.journeyCardInner, isLocked && styles.journeyCardInnerLocked]}>
            {/* Same neutral-base + low-alpha diagonal accent-tint recipe used
                across the app's other cards (StreakBar, Verse of the Day,
                mood grid, mood history, journal, library). */}
            <LinearGradient
              colors={[`${cardColor}1F`, `${cardColor}05`]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              pointerEvents="none"
            />
            {/* Active-card mandala backdrop — shared component with the Home
                screen's Sacred Journey card. Nested inside the BlurView
                (which already clips the tint above to its rounded corners)
                so it's genuinely contained by the card, not floating
                outside it. */}
            {isActive && !isLocked && (
              <JourneyMandalaBackdrop size={168} color={visual.color} opacity={0.45} />
            )}
            {/* Finished journeys keep a mandala too, but a faint one — the
                pattern is the "you have walked this" mark, and dropping it
                entirely made a completed path look identical to one never
                started. The check badge below carries the actual status. */}
            {isCompleted && !isLocked && (
              <JourneyMandalaBackdrop size={140} color={visual.color} opacity={0.16} />
            )}
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
              ) : isCompleted ? (
                <MaterialCommunityIcons name="check-decagram" size={19} color={visual.color} />
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
                <Text style={styles.lockedStatusText}>
                  {(statusLabel ?? 'Coming soon').toUpperCase()}
                </Text>
              </View>
            ) : (
              <>
              {/* Pro early access: a perk, so full-strength gold, unlike the
                  dimmed lock pill above. */}
              {statusLabel ? (
                <View style={styles.proEarlyPill}>
                  <MaterialCommunityIcons name="star-four-points" size={11} color={Colors.accent.primary} />
                  <Text style={styles.proEarlyPillText}>{statusLabel.toUpperCase()}</Text>
                </View>
              ) : null}
              <View style={styles.progressSection}>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={[visual.color, `${visual.color}CC`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${Math.max(progress, 0)}%` }]}
                  />
                </View>
                {/* A finished journey read as "14/14" — true, but it made the
                    reader do the arithmetic to notice they'd finished. */}
                <Text style={[styles.journeyPct, { color: visual.color }]}>
                  {isCompleted ? 'COMPLETE' : `${completedDays}/${totalDays}`}
                </Text>
              </View>
              </>
            )}
          </View>
        </FrostedSurface>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── PathsScreen ─────────────────────────────────────────────────
export default function PathsScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [PATHS, setPaths] = useState<any[]>([]);
  const [userProgressList, setUserProgressList] = useState<UserPathProgress[]>([]);
  const [isPremium, setIsPremium] = useState(() => SubscriptionService.getInstance().isPremium());
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const headerFade = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  // TextInput's `autoFocus` prop only fires on initial mount — this input
  // stays mounted the whole time (just cross-faded), so it needs an
  // imperative focus/blur on each open/close instead.
  const openSearch = () => {
    setSearchActive(true);
    Animated.timing(searchAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    searchInputRef.current?.focus();
  };
  const closeSearch = () => {
    searchInputRef.current?.blur();
    Animated.timing(searchAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setSearchActive(false);
      setSearchQuery('');
    });
  };

  useEffect(() => {
    const svc = PathsService.getInstance();
    setPaths(svc.getAllPaths());
    Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  // Progress changes whenever the user starts or completes a day on
  // PathDetail/PathStep, but this screen lives inside the tab navigator and
  // never unmounts — so it must reload on every focus, not just on mount,
  // or the Active/Completed tabs go stale until the app fully reloads.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      PathsService.getInstance()
        .getAllProgress()
        .then((progress) => {
          if (active) setUserProgressList(progress);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  // Subscription state can change while this screen is backgrounded (e.g. the
  // user purchases Pro on the Support screen and comes back) — re-read on
  // every focus, same pattern as MoodHistoryCalendarScreen.
  useFocusEffect(
    useCallback(() => {
      setIsPremium(SubscriptionService.getInstance().isPremium());
    }, []),
  );

  // Lock state, label and paywall routing all come from one pure rule,
  // src/utils/journeyAccess.ts, so the tap handler and the card's visual
  // state cannot disagree. It keeps the grandfather clause: anyone with
  // progress on a journey keeps it, whatever their tier now — a journey can
  // be open to everyone before it is gated (path_trusting_the_results was, in
  // July), and a started or finished journey must never be re-hidden behind
  // a paywall. `today` is read per call: a screen left open across midnight
  // picks up the new day on its next focus/progress reload.
  const accessFor = useCallback(
    (pathId: string) =>
      getJourneyAccess(pathId, {
        isPremium,
        hasProgress: userProgressList.some((p) => p.pathId === pathId),
        today: formatDateYMD(),
      }),
    [isPremium, userProgressList],
  );

  const onPathSelected = (pathId: string) => {
    const access = accessFor(pathId);
    if (!access.locked) {
      navigation.navigate('PathDetail', { pathId });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // A contentless stub has no upgrade to offer; only a Pro gate routes on.
    if (access.routeToPaywall) navigation.navigate('Support');
  };

  // ── Filter logic ────────────────────────────────────────────
  // The three tabs PARTITION the catalogue rather than overlapping: a journey
  // lives in exactly one of them and moves between them as its state changes.
  // "All" is therefore the not-yet-started shelf (new arrivals plus anything
  // never begun, including locked previews) — starting a journey moves it to
  // Active, finishing it moves it to Done. Before this, every journey appeared
  // under All regardless of state, so the tab a user browsed for something new
  // was mostly things they were already doing.
  const tabFilteredPaths = useMemo(() => {
    if (activeFilter === 'all') {
      const unstarted = PATHS.filter(
        (path) => !userProgressList.some((p) => p.pathId === path.id),
      );
      // Newest first; contentless stubs after (compareExploreOrder). Ordering
      // on release dates rather than declaration order because staticPaths.ts
      // is not chronological — path_hope_after_crisis sits tenth in the file
      // but shipped later than most, and path_trusting_the_results sits last
      // but shipped in July. Locked journeys keep their date position: a new
      // early-access journey must surface at the top for free users too.
      const order = new Map(PATHS.map((p, i) => [p.id, i]));
      return unstarted.sort((a, b) =>
        compareExploreOrder(a.id, b.id, (id) => order.get(id) ?? 0),
      );
    }
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

  // Search narrows within whatever tab is currently selected, rather than
  // overriding it — typing "salah" while on "Active" only searches active paths.
  const filteredPaths = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tabFilteredPaths;
    return tabFilteredPaths.filter((path) => path.title.toLowerCase().includes(query));
  }, [tabFilteredPaths, searchQuery]);

  const filterCounts = useMemo(() => ({
    // Counts must match what each tab actually renders — with the tabs now
    // partitioning the catalogue, "All" is the unstarted shelf, not the total.
    all: PATHS.filter((path) => !userProgressList.some((p) => p.pathId === path.id)).length,
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
      <LinearGradient colors={Colors.celestialWash} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />

      {/* ── Header with mandala backdrop ─────────────────────── */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 12, opacity: headerFade }]}>
        {STAR_POSITIONS.map((s, i) => (
          <TwinklingStar
            key={i}
            x={s.x * screenWidth}
            y={s.y * HEADER_H}
            delay={s.delay}
            size={s.size}
            color={Colors.accent.primary}
            duration={2400}
          />
        ))}

        {/* Tabs + search live in the fixed header so they never scroll away,
            and share one row via a cross-fade instead of two separate bars. */}
        <View style={styles.headerControls}>
          <Animated.View
            pointerEvents={searchActive ? 'none' : 'auto'}
            style={[
              styles.filterSearchRow,
              StyleSheet.absoluteFill,
              {
                opacity: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              },
            ]}
          >
            <FilterBar active={activeFilter} onChange={setActiveFilter} counts={filterCounts} />
            <TouchableOpacity
              onPress={openSearch}
              style={styles.searchIconBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Search journeys"
            >
              <MaterialCommunityIcons name="magnify" size={18} color={Colors.text.muted} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            pointerEvents={searchActive ? 'auto' : 'none'}
            style={[styles.searchRow, { opacity: searchAnim }]}
          >
            <MaterialCommunityIcons name="magnify" size={16} color={Colors.text.muted} />
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search journeys"
              placeholderTextColor={Colors.text.muted}
              style={styles.searchInput}
              returnKeyType="search"
            />
            <TouchableOpacity
              onPress={closeSearch}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close search"
            >
              <MaterialCommunityIcons name="close" size={18} color={Colors.text.muted} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      {/* ── Content ──────────────────────────────────────────── */}
      <FlatList
        style={styles.scrollView}
        data={filteredPaths}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        // VirtualizedList defaults to windowSize 21 (≈10 screenfuls each way)
        // and initialNumToRender 10. All 23 journeys total only ~4 screenfuls,
        // so the default mounted every single card at once — each one a
        // FrostedSurface plus two LinearGradients, and the active one a
        // continuously rotating SVG mandala. These bounds keep roughly the
        // visible set alive instead.
        //
        // Deliberately NOT setting removeClippedSubviews: the cards position
        // their mandala backdrop absolutely, and that prop is known to blank
        // or mis-clip absolutely-positioned children on Android — the exact
        // class of bug this pass is trying to remove, not add.
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        // The title scrolls; the filter tabs and search above it do not. Being
        // list content rather than an animated header is what makes it reclaim
        // its space without animating layout.
        ListHeaderComponent={
          <View style={styles.headerText}>
            <Text style={styles.headerPretitle}>GUIDED PROGRAMS</Text>
            <Text style={styles.headerTitle}>Sacred Journeys</Text>
            <Text style={styles.headerSub}>
              Curated paths for lasting spiritual transformation.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.lg }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name={activeFilter === 'completed' ? 'check-circle-outline' : 'compass-outline'}
              size={44}
              color={`${Colors.accent.primary}40`}
            />
            <Text style={styles.emptyTitle}>
              {searchQuery.trim()
                ? 'No matches'
                : activeFilter === 'active'
                  ? 'No active journeys'
                  : activeFilter === 'completed'
                    ? 'None finished yet'
                    : "You've started them all"}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery.trim()
                ? 'Try a different search term.'
                : activeFilter === 'active'
                  ? 'Begin a path to see it here.'
                  : activeFilter === 'completed'
                    ? 'Complete a path to see it here.'
                    : 'Every journey is under Active or Done. New ones will appear here.'}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const userProgress = userProgressList.find((p) => p.pathId === item.id);
          const isActive = !!userProgress && !userProgress.isCompleted;
          const access = accessFor(item.id);
          return (
            <JourneyCard
              path={item}
              index={index}
              isActive={isActive}
              isLocked={access.locked}
              statusLabel={access.label}
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
    // Only the star field and the controls live here now — the title block
    // scrolls with the list.
    minHeight: HEADER_H,
  },
  headerText: {
    zIndex: 1,
    // Was inside the fixed header, which supplied this padding; as list
    // content it has to carry its own.
    paddingBottom: Spacing.xl,
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

  /* ── Header tabs + search (cross-fade between the two) ── */
  headerControls: {
    position: 'relative',
    height: 44,
    marginTop: Spacing.sm,
  },
  filterSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchIconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.accent.primary}30`,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.small,
    color: Colors.text.primary,
    paddingVertical: 0,
  },

  /* ── Scroll content ── */
  scrollView: { flex: 1, zIndex: 2 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },

  /* ── Journey card ── */
  journeyCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  journeyCardLocked: {
    borderColor: 'rgba(255,255,255,0.04)',
  },
  // No overflow:'hidden' here — the mandala backdrop's clip to the rounded
  // corners comes from journeyCard (the BlurView) two levels up. If this
  // view ever gets its own elevation/overflow treatment, re-check that the
  // mandala is still clipped.
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
  proEarlyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: `${Colors.accent.primary}40`,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  proEarlyPillText: {
    fontSize: Typography.sizes.label,
    fontWeight: '700',
    color: Colors.accent.primary,
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
