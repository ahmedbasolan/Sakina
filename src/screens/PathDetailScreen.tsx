import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Circle,
  Defs,
  RadialGradient as SvgRadialGradient,
  Stop,
} from 'react-native-svg';
import { logServiceError } from '../services/errorLoggingService';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Typography, Spacing } from '../theme/DesignSystem';

import { UserPathProgress } from '../types';
import { PathsService } from '../services/pathsService';
import { useAppContext } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

import { AnimatedMandala } from '../components/AnimatedMandala';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPathVisual } from '../constants/pathVisuals';

const getVisual = (id: string) => getPathVisual(id);

/**
 * A single day in the journey timeline. Tapping an unlocked row opens that day's
 * immersive lesson directly — there is no inline "mark complete". Completion only
 * ever happens by going through the lesson, which keeps progress single-sourced.
 */
const LessonRow = ({ step, visual, isCompleted, isCurrent, isLocked, onPress }: any) => {
  // time-outline (not a padlock): these rows unlock with tomorrow's day, and
  // a padlock reads as "premium-gated" in a freemium app.
  const trailing = isLocked
    ? <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.12)" />
    : <Ionicons name="chevron-forward" size={18} color={isCurrent ? visual.color : 'rgba(255,255,255,0.3)'} />;

  return (
    <TouchableOpacity
      style={[
        styles.lessonCardWrap,
        { borderColor: isCurrent ? visual.color : 'rgba(255,255,255,0.07)' },
      ]}
      onPress={onPress}
      disabled={isLocked}
      activeOpacity={0.7}
    >
      <View style={styles.lessonCardHeader}>
        <View style={[
          styles.lessonCheck,
          {
            borderColor: isLocked ? 'rgba(255,255,255,0.1)' : visual.color,
            backgroundColor: isCompleted ? visual.color : 'transparent',
          },
        ]}>
          {isCompleted ? (
            <Ionicons name="checkmark" size={14} color="#000" />
          ) : (
            <Text style={[styles.lessonDayNum, { color: isLocked ? 'rgba(255,255,255,0.2)' : visual.color }]}>{step.day}</Text>
          )}
        </View>
        <View style={styles.lessonInfo}>
          <Text style={[styles.lessonDay, { color: isLocked ? 'rgba(255,255,255,0.2)' : visual.color }]}>
            DAY {step.day}{isCurrent ? ' · CURRENT' : ''}
          </Text>
          <Text style={[styles.lessonTitle, isLocked && { color: 'rgba(255,255,255,0.3)' }]}>{step.title}</Text>
          <Text style={styles.lessonSource}>{step.focus}</Text>
        </View>
        {trailing}
      </View>
    </TouchableOpacity>
  );
};

export const PathDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const pathsService = PathsService.getInstance();
  const { rotationEngine, freemiumService } = useAppContext();

  const { pathId } = route.params;
  const path = pathsService.getPathById(pathId);
  const [userProgress, setUserProgress] = useState<UserPathProgress | undefined>();

  const scrollY = useRef(new Animated.Value(0)).current;

  // Reload on every focus (not just mount) so the ring, dots and Continue label
  // refresh when the user returns from completing a lesson in PathStepScreen.
  // (Previously this only ran on mount, so completing the immersive flow left the
  // progress here stale — the bug where only inline "mark complete" updated it.)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      pathsService.loadProgress(pathId).then((progress) => {
        if (active) setUserProgress(progress || undefined);
      });
      return () => {
        active = false;
      };
    }, [pathId]),
  );

  if (!path) return null;

  const visual = getVisual(path.id);
  const totalDays = path.duration;
  const completedDays = userProgress?.completedDays.length || 0;
  const remainingDays = totalDays - completedDays;
  const progressPercent = (completedDays / totalDays) * 100;
  
  const nextStepDay = userProgress ? Math.min(userProgress.currentDay, totalDays) : 1;
  const nextStep = path.dailySteps.find(s => s.day === nextStepDay);

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const completedSteps = userProgress ? pathsService.getCompletedSteps(path.id, userProgress) : [];

  /**
   * Open a specific day's immersive lesson. Seeds fresh progress on first start
   * so tapping "Begin · Day 1" works before a journey has any saved progress.
   * Completion itself is owned by PathStepScreen; we just refresh on return via
   * the focus effect above.
   */
  const openDay = async (step: (typeof path.dailySteps)[0]) => {
    let progress = userProgress;
    if (!progress) {
      progress = {
        pathId: path.id,
        currentDay: 1,
        startDate: Date.now(),
        completedDays: [],
        isCompleted: false,
      };
      await pathsService.saveProgress(progress);
      setUserProgress(progress);
    }

    const experience = await rotationEngine.getGuidanceForStep(step.contentId, step.angleId);
    if (!experience) {
      // Near-unreachable now that all path angles ship in the local seed,
      // but keep a warm, recoverable message for the network-only edge.
      Alert.alert(
        'A Moment of Patience',
        "This day's guidance couldn't be loaded. Please check your connection and try again, in shaa Allah.",
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Try Again', onPress: () => openDay(step) },
        ],
      );
      return;
    }

    navigation.navigate('PathStep', {
      path,
      step,
      userProgress: progress,
      guidanceExperience: experience,
      accentColor: visual.color,
    });
  };

  /** Renders a single day row — shared by flat and phase-grouped layouts. */
  const renderStep = (step: (typeof path.dailySteps)[0]) => {
    const isCompleted = completedSteps.some(cs => cs.day === step.day);
    const isCurrent = userProgress ? step.day === userProgress.currentDay : step.day === 1;
    const isLocked = userProgress ? step.day > userProgress.currentDay : step.day > 1;
    return (
      <LessonRow
        key={step.id}
        step={step}
        visual={visual}
        isCompleted={isCompleted}
        isCurrent={isCurrent}
        isLocked={isLocked}
        onPress={() => openDay(step)}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#0A1321', '#0C1A2E']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#7B8FA1" />
          <Text style={styles.backText}>Journeys</Text>
        </TouchableOpacity>
        <Text style={styles.topBarText}>★ SAKINA</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIconWrap, { borderColor: visual.color }]}>
              <MaterialCommunityIcons name={visual.icon} size={32} color={visual.color} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={[styles.heroPretitle, { color: visual.color }]}>
                {totalDays}-DAY SACRED JOURNEY
              </Text>
              <Text style={[styles.heroTitle, { color: visual.color }]}>
                {path.title}
              </Text>
              <Text style={styles.heroSubtitle}>
                {path.target || path.theme}
              </Text>
            </View>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressCircleContainer}>
              <Svg width={60} height={60} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle
                  cx={30}
                  cy={30}
                  r={radius}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={4}
                  fill="none"
                />
                <Circle
                  cx={30}
                  cy={30}
                  r={radius}
                  stroke={visual.color}
                  strokeWidth={4}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.progressCircleTextWrap}>
                <Text style={styles.progressCircleTextMain}>{completedDays}</Text>
                <Text style={styles.progressCircleTextSub}>/{totalDays}</Text>
              </View>
            </View>
            
            <View style={styles.progressTexts}>
              <Text style={styles.progressDayComplete}>
                {completedDays === 0 ? 'Not started yet' : `Day ${completedDays} complete`}
              </Text>
              <Text style={styles.progressDaysRem}>{remainingDays} days remaining</Text>
              {path.phases ? (
                /* Tier-3 long paths: one labeled bar per phase */
                <View style={styles.phaseBarsContainer}>
                  {path.phases.map((phase) => {
                    const phaseDays = phase.endDay - phase.startDay + 1;
                    // Count days that actually fall inside this phase's range,
                    // not an offset from a running total (which breaks when days
                    // are completed out of order or phases are non-contiguous).
                    const completedDaysArray = userProgress?.completedDays ?? [];
                    const doneInPhase = completedDaysArray.filter(
                      (d) => d >= phase.startDay && d <= phase.endDay,
                    ).length;
                    const pct = doneInPhase / phaseDays;
                    return (
                      <View key={phase.label} style={styles.phaseBarRow}>
                        <Text style={styles.phaseBarLabel} numberOfLines={1}>
                          {phase.label.split(' — ')[0]}
                        </Text>
                        <View style={styles.phaseBarTrack}>
                          {/* Flex-split bar — works without pixel measurements */}
                          <View style={[styles.phaseBarFill, { flex: Math.max(pct, 0.001), backgroundColor: visual.color }]} />
                          <View style={{ flex: Math.max(1 - pct, 0.001) }} />
                        </View>
                        <Text style={[styles.phaseBarCount, { color: visual.color }]}>{doneInPhase}/{phaseDays}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                /* Short paths: individual day dots */
                <View style={styles.progressDotsContainer}>
                  {Array.from({ length: totalDays }).map((_, i) => {
                    const done = i < completedDays;
                    const isCurrent = i === completedDays;
                    return (
                      <View
                        key={i}
                        style={[
                          styles.progressDot,
                          {
                            backgroundColor: done
                              ? visual.color
                              : isCurrent
                                ? `${visual.color}55`
                                : 'rgba(255,255,255,0.1)',
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Primary action — Begin (fresh) or Continue (in-progress). Hidden once
            the path is fully complete. This is the one-tap resume affordance. */}
        {nextStep && !userProgress?.isCompleted && (
          <View style={styles.todaySection}>
            <Text style={styles.sectionHeaderLabel}>
              {completedDays === 0 ? 'BEGIN' : 'CONTINUE'} · DAY {nextStepDay}
            </Text>
            <TouchableOpacity
              style={[styles.todayCard, { borderColor: visual.color }]}
              onPress={() => openDay(nextStep)}
            >
              <View style={styles.todayCardLeft}>
                <Text style={[styles.todayCardTitle, { color: '#F0E6D3' }]}>
                  {nextStep.title}
                </Text>
              </View>
              <View style={[styles.todayCardArrow, { backgroundColor: visual.color }]}>
                <Ionicons name="chevron-forward" size={18} color="#000" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* All Lessons */}
        <View style={styles.lessonsSection}>
          <Text style={styles.sectionHeaderLabel}>ALL LESSONS</Text>
          <View style={styles.lessonsList}>
            {path.phases ? (
              /* Long paths: group steps under their phase header */
              path.phases.map((phase) => (
                <React.Fragment key={phase.label}>
                  <View style={styles.phaseHeaderRow}>
                    <View style={[styles.phaseHeaderDot, { backgroundColor: visual.color }]} />
                    <Text style={[styles.phaseHeaderText, { color: visual.color }]}>{phase.label}</Text>
                    <View style={styles.phaseHeaderLine} />
                  </View>
                  {path.dailySteps
                    .filter(s => s.day >= phase.startDay && s.day <= phase.endDay)
                    .map(renderStep)}
                </React.Fragment>
              ))
            ) : (
              /* Short paths: flat list */
              path.dailySteps.map(renderStep)
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111E',
  },
  mandalaWrap: {
    position: 'absolute',
    top: -50,
    right: -100,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: 20,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  backText: {
    color: '#7B8FA1',
    fontSize: 15,
    marginLeft: 2,
  },
  topBarText: {
    fontSize: 12,
    color: '#D4AF37',
    letterSpacing: 2,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 100,
  },
  hero: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 32,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  heroPretitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: Typography.fonts.serif,
    fontWeight: '400',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#7B8FA1',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressCircleContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleTextWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  progressCircleTextMain: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    lineHeight: 18,
  },
  progressCircleTextSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 10,
  },
  progressTexts: {
    flex: 1,
  },
  progressDayComplete: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  progressDaysRem: {
    fontSize: 13,
    color: '#7B8FA1',
    marginBottom: 10,
  },
  progressDotsContainer: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  progressDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    color: '#7B8FA1',
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  todaySection: {
    marginBottom: 32,
  },
  todayCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayCardLeft: {
    flex: 1,
  },
  todayCardTitle: {
    fontSize: 18,
    fontFamily: Typography.fonts.serif,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  todayCardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonsSection: {
    marginBottom: 32,
  },
  lessonsList: {
    paddingHorizontal: 24,
    gap: 12,
  },

  /* ── Phase bars (Tier-3 long paths) ── */
  phaseBarsContainer: {
    gap: 8,
    marginTop: 4,
  },
  phaseBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseBarLabel: {
    fontSize: 10,
    color: 'rgba(245,237,227,0.68)',
    fontWeight: '600',
    letterSpacing: 0.5,
    width: 72,
  },
  phaseBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  phaseBarFill: {
    borderRadius: 2,
  },
  phaseBarCount: {
    fontSize: 10,
    fontWeight: '700',
    width: 30,
    textAlign: 'right',
  },

  /* ── Phase section headers (lesson list grouping) ── */
  phaseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  phaseHeaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  phaseHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  phaseHeaderLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  lessonCardWrap: {
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
  },
  lessonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  lessonCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  lessonDayNum: {
    fontSize: 12,
    fontWeight: '700',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonDay: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  lessonTitle: {
    fontSize: 16,
    color: '#F0E6D3',
    marginBottom: 2,
  },
  lessonSource: {
    fontSize: 13,
    color: '#7B8FA1',
  },
});

