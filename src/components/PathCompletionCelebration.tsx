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
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/DesignSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SpiritualPath, PathStep, UserPathProgress } from '../types';
import { PathsService } from '../services/pathsService';
import { HapticsService } from '../services/hapticsService';
import { PathProgress } from './PathProgress';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Types ───────────────────────────────────────────────────────────
interface PathCompletionCelebrationProps {
  visible: boolean;
  path: SpiritualPath;
  step: PathStep;
  userProgress: UserPathProgress;
  reflectionWritten?: boolean;
  /** Journey identity color — themes the modal to match the immersive flow. */
  accentColor?: string;
  onContinue: () => void;
  onClose: () => void;
  /**
   * Optional, gentle "support the mission" affordance — shown only at journey
   * end and only when the peaks-only gate (shouldOfferUpgrade) allows it. A
   * single soft, dismissible line; never a hard paywall (spec §8).
   */
  onSupport?: () => void;
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

/** Dark navy base — matches the immersive lesson background. */
const CARD_BG = '#0A1321';

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

// Progress display (day dots for short paths, phase bars for long ones) is
// `PathProgress`, shared with PathDetailScreen. Deliberately not called a
// "streak": it's this path's own day count, not the app-wide mood-check-in
// streak shown on Home — conflating the two would show a number that
// doesn't actually track what just happened here.

// ── Contextual encouragement — goal-gradient framing that shifts with
// position in the path instead of one static line every single day. Not to
// be confused with `pathsService.getStepMotivation()`: that one is
// topic-specific Quran/hadith citation keyed by step title (for the lesson
// itself, currently unwired); this one is generic positional copy for the
// post-completion modal. Different moment, different content. ──
function getConsistencyMessage(step: PathStep, path: SpiritualPath, nextStep: PathStep | null): string {
  if (!nextStep) return ''; // full completion has its own dedicated message below
  // Check the "one more day" case first — on a 2-day path, day 1 is
  // simultaneously the first day AND the day before completion, and the
  // more specific message should win.
  if (nextStep.day === path.duration) {
    return 'One more day stands between you and completing this journey.';
  }
  if (step.day === 1) {
    return 'A journey often begins with a single, steady step — you’ve just taken yours.';
  }
  return 'Small, steady steps — this is how lasting change is built.';
}

// ── Main Component ──────────────────────────────────────────────────
export default function PathCompletionCelebration({
  visible,
  path,
  step,
  userProgress,
  reflectionWritten = false,
  accentColor = Colors.accent.primary,
  onContinue,
  onClose,
  onSupport,
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
  // `userProgress` is `celebrationProgress` — already has today appended and
  // `currentDay` already incremented to the next day. Use `getCurrentStep` (not
  // `getNextStep`) so we don't add a second +1 and skip a day.
  const nextStep = pathsService.getCurrentStep(path.id, userProgress);
  const consistencyMessage = getConsistencyMessage(step, path, nextStep);

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
        message: `Alhamdulillah! I just completed Day ${step.day} of the "${path.title}" path on Sakina — ${userProgress.completedDays.length} of ${path.duration} days in. 🌙`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const animateOut = (done: () => void) => {
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
    ]).start(done);
  };

  // Primary: complete + continue to the next day's lesson (or finish the path).
  const handleContinue = () => {
    HapticsService.impactAsync('LIGHT');
    animateOut(onContinue);
  };

  // Secondary: complete this day but return to the journey overview.
  const handleBackToJourney = () => {
    HapticsService.impactAsync('LIGHT');
    animateOut(onClose);
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleBackToJourney}
            accessibilityRole="button"
            accessibilityLabel="Dismiss and return to journey"
          />
        </Animated.View>

        {/* Confetti */}
        {showConfetti && (
          <View style={styles.confettiContainer} pointerEvents="none">
            {confettiPieces.map((piece) => (
              <ConfettiItem key={piece.id} piece={piece} />
            ))}
          </View>
        )}

        {/* Card — shadow lives on this outer Animated.View (so it scales/fades
            with the entrance animation); the inner plain View (styles.card)
            does the overflow:'hidden' clipping. Same split as
            ShareSheet.tsx's previewCardShadow — Android can't reliably
            combine elevation with overflow:'hidden'+borderRadius on one view. */}
        <Animated.View
          style={[
            styles.cardShadow,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
              marginTop: insets.top + 40,
              marginBottom: insets.bottom + 20,
            },
          ]}
        >
        <View style={styles.card}>
          {/* Hero — dark gradient with accent glow at the top */}
          <LinearGradient
            colors={[accentColor + '28', CARD_BG]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.7 }}
            style={styles.hero}
          >
            {/* Checkmark circle */}
            <View
              style={[
                styles.checkCircle,
                { borderColor: accentColor + '55', shadowColor: accentColor },
              ]}
            >
              {/* Bare checkmark glyph — "check-circle" drew its own filled
                  polygon behind the tick, doubling up with this View's own
                  circular ring and reading as a generic badge shape. */}
              <MaterialCommunityIcons name="check-bold" size={36} color={accentColor} />
            </View>

            <Text style={styles.heroTitle}>Day {step.day} Complete</Text>
            <Text style={styles.heroStepTitle}>{step.title}</Text>
            <Text style={[styles.heroSubtitle, { color: accentColor + 'CC' }]}>{path.title}</Text>
          </LinearGradient>

          {/* Scrollable content area */}
          <Animated.ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {showContent && (
              <Animated.View style={{ opacity: contentOpacity }}>
                {/* Progress — day dots (or phase bars for long, tiered
                    paths) + a short line that shifts with where the user
                    actually is in the path, not a static slogan. */}
                <View style={styles.progressSection}>
                  <PathProgress
                    path={path}
                    completedDays={userProgress.completedDays}
                    accentColor={accentColor}
                  />
                  <Text style={styles.progressDays}>
                    Day {userProgress.completedDays.length} of {path.duration}
                  </Text>
                  {!!consistencyMessage && (
                    <Text style={styles.consistencyText}>{consistencyMessage}</Text>
                  )}
                  {reflectionWritten && (
                    <View style={[styles.reflectionBadge, { borderColor: accentColor + '40' }]}>
                      <MaterialCommunityIcons name="pencil-outline" size={13} color={accentColor} />
                      <Text style={[styles.reflectionBadgeText, { color: accentColor }]}>
                        Reflection saved
                      </Text>
                    </View>
                  )}
                </View>

                {/* Next Day Preview */}
                {nextStep && (
                  <View style={[styles.nextDayCard, { borderColor: accentColor + '30' }]}>
                    <View style={styles.nextDayHeader}>
                      <View style={[styles.nextDayIcon, { backgroundColor: accentColor + '22' }]}>
                        <MaterialCommunityIcons
                          name="calendar-arrow-right"
                          size={16}
                          color={accentColor}
                        />
                      </View>
                      <Text style={[styles.nextDayLabel, { color: accentColor }]}>UP NEXT</Text>
                    </View>
                    <Text style={styles.nextDayTitle}>
                      Day {nextStep.day}: {nextStep.title}
                    </Text>
                    <Text style={styles.nextDayFocus}>{nextStep.focus}</Text>
                  </View>
                )}

                {/* Path completed message */}
                {!nextStep && (
                  <View style={[styles.pathCompleteCard, { borderColor: accentColor + '40' }]}>
                    <MaterialCommunityIcons name="star-four-points" size={32} color={accentColor} />
                    <Text style={[styles.pathCompleteTitle, { color: accentColor }]}>
                      Journey Complete
                    </Text>
                    <Text style={styles.pathCompleteText}>
                      Masha'Allah! You have completed the entire {path.title} journey. May Allah
                      accept your efforts and grant you its fruits.
                    </Text>

                    {onSupport && (
                      <TouchableOpacity
                        style={styles.supportLine}
                        onPress={onSupport}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Support Sakina"
                      >
                        <Text style={[styles.supportLineText, { color: accentColor }]}>
                          Support the mission
                        </Text>
                        <MaterialCommunityIcons name="arrow-right" size={16} color={accentColor} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Buttons */}
                <View style={styles.buttonsSection}>
                  <TouchableOpacity
                    style={[
                      styles.continueButton,
                      { backgroundColor: accentColor, shadowColor: accentColor },
                    ]}
                    onPress={handleContinue}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={nextStep ? `Continue to day ${nextStep.day}` : 'Finish journey'}
                  >
                    <Text style={[styles.continueButtonText, { color: CARD_BG }]}>
                      {nextStep ? `Continue to Day ${nextStep.day}` : 'Finish journey'}
                    </Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color={CARD_BG} />
                  </TouchableOpacity>

                  {/* Secondary row — both actions are quiet by design so they
                      never compete with the primary continue button above.
                      "Back to journey" only makes sense mid-path; sharing is
                      worth offering either way. */}
                  <View style={styles.secondaryRow}>
                    {nextStep && (
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleBackToJourney}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Back to journey"
                      >
                        <Text style={styles.secondaryButtonText}>Back to journey</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.shareIconButton}
                      onPress={handleShare}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Share progress"
                      hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                    >
                      <MaterialCommunityIcons
                        name="share-variant-outline"
                        size={16}
                        color={`${Colors.text.primary}66`}
                      />
                      <Text style={styles.shareIconButtonText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            )}
          </Animated.ScrollView>
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  // Shadow only — no overflow/borderRadius-vs-elevation conflict here since
  // this view clips nothing. See ShareSheet.tsx's previewCardShadow.
  cardShadow: {
    flex: 1,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 24,
  },
  // Card — dark navy matching the immersive experience
  card: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  // Hero — receives a LinearGradient as its container
  hero: {
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  heroTitle: {
    fontSize: Typography.sizes.h1,
    fontWeight: '700',
    color: '#F0E6D3',
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
    fontFamily: Typography.fonts.serif,
  },
  heroStepTitle: {
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: `${Colors.text.primary}BF`,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: Typography.sizes.small,
    fontWeight: '500',
  },

  // Scroll area
  scrollArea: {
    flex: 1,
    backgroundColor: CARD_BG,
  },

  // Content
  contentContainer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xl,
  },

  // Progress
  progressSection: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressDays: {
    fontSize: Typography.sizes.small,
    color: `${Colors.text.primary}80`,
    fontWeight: '500',
  },
  consistencyText: {
    fontSize: Typography.sizes.small,
    color: `${Colors.text.primary}BF`,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Typography.fonts.serif,
    fontStyle: 'italic',
    paddingHorizontal: Spacing.md,
  },
  reflectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  reflectionBadgeText: {
    fontSize: Typography.sizes.detail,
    fontWeight: '600',
  },

  // Next Day
  nextDayCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  nextDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  nextDayIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextDayLabel: {
    fontSize: Typography.sizes.detail,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  nextDayTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '700',
    color: '#F0E6D3',
    marginBottom: Spacing.xs,
    fontFamily: Typography.fonts.serif,
  },
  nextDayFocus: {
    fontSize: Typography.sizes.small,
    color: `${Colors.text.primary}80`,
    lineHeight: 19,
  },

  // Path Complete
  pathCompleteCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pathCompleteTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: '700',
    fontFamily: Typography.fonts.serif,
  },
  pathCompleteText: {
    fontSize: Typography.sizes.small,
    color: `${Colors.text.primary}8C`,
    textAlign: 'center',
    lineHeight: 20,
  },
  supportLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  supportLineText: {
    fontSize: Typography.sizes.small,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Buttons
  buttonsSection: {
    gap: Spacing.sm,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  secondaryButtonText: {
    fontSize: Typography.sizes.small,
    fontWeight: '500',
    color: `${Colors.text.primary}99`,
  },
  shareIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  shareIconButtonText: {
    fontSize: Typography.sizes.small,
    fontWeight: '500',
    color: `${Colors.text.primary}66`,
  },
});
