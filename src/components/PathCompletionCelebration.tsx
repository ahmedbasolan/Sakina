import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SpiritualPath, PathStep, UserPathProgress } from '../types';
import { PathsService } from '../services/pathsService';
import { HapticsService } from '../services/hapticsService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Types ───────────────────────────────────────────────────────────
interface PathCompletionCelebrationProps {
  visible: boolean;
  path: SpiritualPath;
  step: PathStep;
  userProgress: UserPathProgress;
  reflectionWritten?: boolean;
  onContinue: () => void;
  onClose: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  animDuration: number;
  animDelay: number;
  rotation: number;
}

// ── Confetti colors ─────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#10B981',
  '#6366F1',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#3B82F6',
  '#EF4444',
];

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 6,
    animDuration: 2000 + Math.random() * 2000,
    animDelay: Math.random() * 500,
    rotation: Math.random() * 360,
  }));
}

// ── Animated Confetti Piece ─────────────────────────────────────────
function ConfettiItem({ piece }: { piece: ConfettiPiece }) {
  const translateY = useRef(new Animated.Value(-50)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = piece.animDelay;
    const duration = piece.animDuration;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT + 50,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration,
        delay: delay + duration * 0.6,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: [`${piece.rotation}deg`, `${piece.rotation + 720}deg`],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${piece.x}%`,
        top: -20,
        width: piece.size,
        height: piece.size,
        borderRadius: piece.size > 9 ? 2 : piece.size / 2,
        backgroundColor: piece.color,
        opacity,
        transform: [{ translateY }, { rotate: spin }],
      }}
    />
  );
}

// ── Progress Ring (pure View) ───────────────────────────────────────
const RING_SIZE = 140;
const RING_STROKE = 10;

function ProgressRing({ progress }: { progress: number }) {
  // Two-half-circle approach: left half and right half, each clipped
  // Progress 0-50% fills the right half, 50-100% fills the left half
  const rightDeg = progress <= 50 ? (progress / 50) * 180 : 180;
  const leftDeg = progress > 50 ? ((progress - 50) / 50) * 180 : 0;

  const halfSize = RING_SIZE / 2;

  return (
    <View style={ringStyles.container}>
      {/* Background ring */}
      <View style={ringStyles.bgRing} />

      {/* Right half */}
      <View style={[ringStyles.halfClip, { left: halfSize }]}>
        <View
          style={[
            ringStyles.halfCircle,
            {
              left: -halfSize,
              borderColor: '#10B981',
              transform: [{ rotate: `${rightDeg}deg` }],
            },
          ]}
        />
      </View>

      {/* Left half */}
      <View style={[ringStyles.halfClip, { left: 0 }]}>
        <View
          style={[
            ringStyles.halfCircle,
            {
              left: halfSize,
              borderColor: '#10B981',
              transform: [{ rotate: `${leftDeg}deg` }],
            },
          ]}
        />
      </View>

      {/* Center */}
      <View style={ringStyles.center}>
        <Text style={styles.ringPercent}>{Math.round(progress)}%</Text>
        <Text style={styles.ringLabel}>Complete</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignSelf: 'center',
  },
  bgRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_STROKE,
    borderColor: '#E5E7EB',
  },
  halfClip: {
    position: 'absolute',
    top: 0,
    width: RING_SIZE / 2,
    height: RING_SIZE,
    overflow: 'hidden',
  },
  halfCircle: {
    position: 'absolute',
    top: 0,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_STROKE,
    borderColor: 'transparent',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ── Achievement Row ─────────────────────────────────────────────────
function AchievementItem({
  icon,
  text,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.achievementRow}>
      <MaterialCommunityIcons name={icon} size={18} color="#059669" />
      <Text style={styles.achievementText}>{text}</Text>
      <View style={styles.achievementCheck}>
        <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
      </View>
    </View>
  );
}

// ── Main Component ──────────────────────────────────────────────────
export default function PathCompletionCelebration({
  visible,
  path,
  step,
  userProgress,
  reflectionWritten = false,
  onContinue,
  onClose,
}: PathCompletionCelebrationProps) {
  const insets = useSafeAreaInsets();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const confettiPieces = useMemo(() => generateConfetti(40), [visible]);

  const pathsService = PathsService.getInstance();

  // Derived data
  const progress = Math.round((userProgress.completedDays.length / path.duration) * 100);
  const nextStep = pathsService.getNextStep(path.id, userProgress);
  const actionsCompleted = userProgress.completedDays.length;
  const currentStreak = userProgress.completedDays.length; // Simplified streak

  useEffect(() => {
    if (visible) {
      // Reset
      setShowConfetti(true);
      setShowContent(false);
      backdropOpacity.setValue(0);
      cardScale.setValue(0.85);
      cardOpacity.setValue(0);
      contentOpacity.setValue(0);

      // Haptic burst
      HapticsService.notificationAsync('SUCCESS');

      // Animate in
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          damping: 14,
          stiffness: 140,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 400,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Show content after card appears
      const contentTimer = setTimeout(() => {
        setShowContent(true);
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 350);

      // Stop confetti
      const confettiTimer = setTimeout(() => setShowConfetti(false), 3500);

      return () => {
        clearTimeout(contentTimer);
        clearTimeout(confettiTimer);
      };
    }
  }, [visible]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Alhamdulillah! I just completed Day ${step.day} of the "${path.title}" path on Guidance App. ${progress}% through my journey! 🌙`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleContinue = () => {
    HapticsService.impactAsync('LIGHT');
    // Animate out
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onContinue());
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Confetti */}
        {showConfetti && (
          <View style={styles.confettiContainer} pointerEvents="none">
            {confettiPieces.map((piece) => (
              <ConfettiItem key={piece.id} piece={piece} />
            ))}
          </View>
        )}

        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
              marginTop: insets.top + 40,
              marginBottom: insets.bottom + 20,
            },
          ]}
        >
          {/* Hero */}
          <View style={styles.hero}>
            {/* Checkmark circle */}
            <View style={styles.checkCircle}>
              <MaterialCommunityIcons name="check-circle" size={48} color="#10B981" />
            </View>

            <Text style={styles.heroTitle}>Day {step.day} Complete!</Text>
            <Text style={styles.heroSubtitle}>{path.title}</Text>
          </View>

          {/* Scrollable content area */}
          <Animated.ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {showContent && (
              <Animated.View style={{ opacity: contentOpacity }}>
                {/* Progress Ring */}
                <View style={styles.progressSection}>
                  <ProgressRing progress={progress} />
                  <Text style={styles.progressDays}>
                    {userProgress.completedDays.length}/{path.duration} days
                  </Text>
                </View>

                {/* Achievements */}
                <View style={styles.achievementsSection}>
                  <Text style={styles.sectionLabel}>TODAY{"'"}S ACHIEVEMENTS</Text>
                  <AchievementItem
                    icon="checkbox-marked-outline"
                    text={`Completed Day ${step.day}: ${step.title}`}
                  />
                  {reflectionWritten && (
                    <AchievementItem icon="pencil-outline" text="Wrote personal reflection" />
                  )}
                  {currentStreak >= 2 && (
                    <AchievementItem icon="fire" text={`${currentStreak} day streak maintained`} />
                  )}
                </View>

                {/* Next Day Preview */}
                {nextStep && (
                  <View style={styles.nextDayCard}>
                    <View style={styles.nextDayHeader}>
                      <View style={styles.nextDayIcon}>
                        <MaterialCommunityIcons
                          name="calendar-arrow-right"
                          size={16}
                          color="#6366F1"
                        />
                      </View>
                      <Text style={styles.nextDayLabel}>COMING TOMORROW</Text>
                    </View>
                    <Text style={styles.nextDayTitle}>
                      Day {nextStep.day}: {nextStep.title}
                    </Text>
                    <Text style={styles.nextDayFocus}>{nextStep.focus}</Text>
                  </View>
                )}

                {/* Path completed message */}
                {!nextStep && (
                  <View style={styles.pathCompleteCard}>
                    <MaterialCommunityIcons name="star-four-points" size={32} color="#F59E0B" />
                    <Text style={styles.pathCompleteTitle}>Path Complete!</Text>
                    <Text style={styles.pathCompleteText}>
                      Masha'Allah! You have completed the entire {path.title} journey. May Allah
                      accept your efforts and grant you its fruits.
                    </Text>
                  </View>
                )}

                {/* Buttons */}
                <View style={styles.buttonsSection}>
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.continueButtonText}>Continue to Home</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShare}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="share-variant-outline"
                      size={18}
                      color="#374151"
                    />
                    <Text style={styles.shareButtonText}>Share Progress</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </Animated.ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  // Card
  card: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },

  // Hero
  hero: {
    backgroundColor: '#10B981',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },

  // Content
  contentContainer: {
    padding: 24,
    paddingBottom: 32,
    gap: 24,
  },

  // Progress
  progressSection: {
    alignItems: 'center',
    gap: 6,
  },
  ringPercent: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  ringLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  progressDays: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Achievements
  achievementsSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  achievementText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  achievementCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Next Day
  nextDayCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  nextDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  nextDayIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextDayLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#6366F1',
  },
  nextDayTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  nextDayFocus: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },

  // Path Complete
  pathCompleteCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    alignItems: 'center',
    gap: 8,
  },
  pathCompleteTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#92400E',
  },
  pathCompleteText: {
    fontSize: 13,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Buttons
  buttonsSection: {
    gap: 10,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
});
