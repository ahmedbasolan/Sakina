import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
  Alert,
  ActivityIndicator,
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
import { useRoute, useNavigation } from '@react-navigation/native';

import { UserPathProgress } from '../types';
import { PathsService } from '../services/pathsService';
import { useAppContext } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

import { AnimatedMandala } from '../components/AnimatedMandala';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PATH_VISUALS: Record<string, { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> = {
  path_salah_transformation: { icon: 'hands-pray', color: '#10B981' },
  path_rizq_revolution: { icon: 'barley', color: '#D4AF37' },
  path_depression_iman: { icon: 'sprout', color: '#818CF8' },
  path_anxiety_tawakkul: { icon: 'feather', color: '#60A5FA' },
  path_marriage_seeker: { icon: 'ring', color: '#F87171' },
  path_guilt_tawbah: { icon: 'heart-plus', color: '#34D399' },
  path_grateful_heart: { icon: 'star-four-points', color: '#FBBF24' },
  path_wrong_marriage: { icon: 'handshake', color: '#A78BFA' },
  path_forced_marriage: { icon: 'shield-alert-outline', color: '#F87171' },
};

const getVisual = (id: string) => PATH_VISUALS[id] || { icon: 'compass-outline' as any, color: '#D4AF37' };

const LessonCard = ({ step, visual, isCompleted, isCurrent, isLocked, isExpanded, onExpand, onMarkComplete }: any) => {
  const [experience, setExperience] = React.useState<any>(null);
  const { rotationEngine } = useAppContext();

  React.useEffect(() => {
    if (isExpanded && !experience) {
      rotationEngine.getGuidanceForStep(step.contentId, step.angleId)
        .then(setExperience)
        .catch((error) => logServiceError('PathDetailScreen', 'loadGuidanceExperience', error instanceof Error ? error : new Error(String(error))));
    }
  }, [isExpanded, experience, rotationEngine, step]);

  return (
    <View style={[styles.lessonCardWrap, { borderColor: visual.color }]}>
      <TouchableOpacity 
        style={styles.lessonCardHeader} 
        onPress={onExpand}
        disabled={isLocked}
        activeOpacity={0.7}
      >
        <View style={[
          styles.lessonCheck,
          { 
            borderColor: isLocked ? 'rgba(255,255,255,0.1)' : visual.color,
            backgroundColor: isCompleted ? visual.color : 'transparent'
          }
        ]}>
          {isCompleted ? (
            <Ionicons name="checkmark" size={14} color="#000" />
          ) : (
            <Text style={[styles.lessonDayNum, { color: isLocked ? 'rgba(255,255,255,0.2)' : visual.color }]}>{step.day}</Text>
          )}
        </View>
        <View style={styles.lessonInfo}>
          <Text style={[styles.lessonDay, { color: isLocked ? 'rgba(255,255,255,0.2)' : visual.color }]}>DAY {step.day}</Text>
          <Text style={[styles.lessonTitle, isLocked && { color: 'rgba(255,255,255,0.3)' }]}>{step.title}</Text>
          <Text style={styles.lessonSource}>{step.focus}</Text>
        </View>
        {isLocked ? (
          <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.1)" />
        ) : (
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="rgba(255,255,255,0.3)" />
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.lessonExpandedContent}>
          {experience ? (
            <>
              <View style={styles.verseBox}>
                <Text style={styles.arabicText}>{experience.content.arabicText || experience.angle.angleArabicText}</Text>
                <Text style={styles.verseSource}>— {experience.content.source || step.focus}</Text>
              </View>
              
              <View style={styles.starDivider}>
                <View style={styles.dividerLine} />
                <Ionicons name="star" size={12} color={visual.color} style={styles.dividerStar} />
                <View style={styles.dividerLine} />
              </View>
              
              <Text style={styles.englishText}>
                {experience.content.englishTranslation || experience.angle.angle}
              </Text>
              
              {!isCompleted && isCurrent && (
                <TouchableOpacity style={[styles.markCompleteBtn, { borderColor: visual.color }]} onPress={onMarkComplete}>
                  <Ionicons name="checkmark" size={16} color={visual.color} />
                  <Text style={[styles.markCompleteText, { color: visual.color }]}>MARK COMPLETE</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <ActivityIndicator size="small" color={visual.color} style={{ marginVertical: 20 }} />
          )}
        </View>
      )}
    </View>
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
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadProgress = async () => {
      const progress = await pathsService.loadProgress(pathId);
      setUserProgress(progress || undefined);
    };
    loadProgress();
  }, [pathId]);

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

  const onStartPath = async () => {
    const newProgress: UserPathProgress = {
      pathId: path.id,
      currentDay: 1,
      startDate: Date.now(),
      completedDays: [],
      isCompleted: false,
    };
    await pathsService.saveProgress(newProgress);
    setUserProgress(newProgress);
    navigateToPathStep(newProgress);
  };

  const onMarkLessonComplete = async (day: number) => {
    // If no progress yet, seed fresh progress starting at this day.
    const base: UserPathProgress = userProgress || {
      pathId: path.id,
      currentDay: 1,
      startDate: Date.now(),
      completedDays: [],
      isCompleted: false,
    };

    // No-op if already marked complete.
    if (base.completedDays.includes(day)) return;

    const isNowComplete = day >= path.duration;
    const updatedProgress: UserPathProgress = {
      ...base,
      completedDays: [...base.completedDays, day].sort((a, b) => a - b),
      // Clamp to path.duration so the "Today's Lesson" tile doesn't stay pinned
      // to the last day after completion (nextStepDay = Math.min(currentDay, totalDays)
      // would otherwise always resolve to the final day instead of a complete state).
      currentDay: isNowComplete ? path.duration : Math.max(base.currentDay, day + 1),
      isCompleted: isNowComplete,
      completedAt: isNowComplete ? Date.now() : base.completedAt,
    };
    await pathsService.saveProgress(updatedProgress);
    setUserProgress(updatedProgress);
  };

  const navigateToPathStep = async (progress: UserPathProgress) => {
    const step = pathsService.getCurrentStep(path.id, progress);
    if (!step) return;

    const experience = await rotationEngine.getGuidanceForStep(step.contentId, step.angleId);
    if (!experience) {
      Alert.alert('Content Not Available', 'Could not load content for this step.');
      return;
    }

    navigation.navigate('PathStep', {
      path: path,
      step: step,
      userProgress: progress,
      guidanceExperience: experience,
    });
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
        <Text style={styles.topBarText}>★ NOOR</Text>
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
                {path.title.toUpperCase()}
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
              <Text style={styles.progressDayComplete}>Day {completedDays} complete</Text>
              <Text style={styles.progressDaysRem}>{remainingDays} days remaining</Text>
              <View style={styles.progressDotsContainer}>
                {Array.from({ length: totalDays }).map((_, i) => {
                  const done = i < completedDays;
                  const isCurrent = i === completedDays; // next upcoming day
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
            </View>
          </View>
        </View>

        {/* Today's Lesson — hidden once the path is fully complete */}
        {nextStep && !userProgress?.isCompleted && (
          <View style={styles.todaySection}>
            <Text style={styles.sectionHeaderLabel}>TODAY · DAY {nextStepDay}</Text>
            <TouchableOpacity 
              style={[styles.todayCard, { borderColor: visual.color }]}
              onPress={userProgress ? () => navigateToPathStep(userProgress) : onStartPath}
            >
              <View style={styles.todayCardLeft}>
                <Text style={[styles.todayCardTitle, { color: '#F0E6D3' }]}>
                  {nextStep.title.toUpperCase()}
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
            {path.dailySteps.map((step) => {
              const isCompleted = completedSteps.some(cs => cs.day === step.day);
              const isCurrent = userProgress ? step.day === userProgress.currentDay : step.day === 1;
              const isLocked = userProgress ? step.day > userProgress.currentDay : step.day > 1;
              
              return (
                <LessonCard
                  key={step.id}
                  step={step}
                  visual={visual}
                  isCompleted={isCompleted}
                  isCurrent={isCurrent}
                  isLocked={isLocked}
                  isExpanded={expandedDay === step.day}
                  onExpand={() => setExpandedDay(expandedDay === step.day ? null : step.day)}
                  onMarkComplete={() => onMarkLessonComplete(step.day)}
                />
              );
            })}
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
    paddingHorizontal: 20,
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
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
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
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
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
  lessonExpandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  verseBox: {
    backgroundColor: 'rgba(15,25,40,0.5)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  arabicText: {
    fontFamily: Platform.OS === 'ios' ? 'Amiri-Bold' : 'serif',
    fontSize: 26,
    color: '#F0E6D3',
    lineHeight: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  verseSource: {
    fontSize: 13,
    color: '#7B8FA1',
  },
  starDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerStar: {
    marginHorizontal: 16,
  },
  englishText: {
    fontSize: 15,
    color: '#F0E6D3',
    lineHeight: 24,
    textAlign: 'left',
    marginBottom: 24,
  },
  markCompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  markCompleteText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

