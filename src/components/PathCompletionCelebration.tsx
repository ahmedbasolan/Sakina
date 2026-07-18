/**
 * PathCompletionCelebration — end-of-day-session card.
 *
 * Framing: **the session ends, the day begins.**
 *
 * The previous version was a course-completion card — trophy, progress stated
 * four separate ways, and a gold "Continue to Day N" button. That frame treats
 * a journey as content to be consumed, which quietly works against the product:
 * a 7-day arc exists to create seven return visits, and its value comes from
 * spacing, not from reading seven lessons in twenty minutes.
 *
 * This card instead hands the user the one thing to carry into their day. The
 * angle already ships `practiceSteps` (a physical act, a du'a, a reframe) and
 * the user has just written a reflection — both were discarded the moment the
 * modal appeared. Surfacing them makes the session end with something in hand.
 *
 * Consequences of that frame, all deliberate:
 *   - "Done for today" is the primary. "Continue anyway" stays available as a
 *     quiet ghost — binge-blocking causes rage-uninstalls; defaults are enough.
 *   - Progress is stated ONCE (dots + a label), not four times.
 *   - No trophy badge and no confetti on a daily close. Both are saved for the
 *     end of the journey, which is the moment that actually earns them.
 *   - Share is offered only at journey completion. "I finished day 1 of 7" is
 *     not something people share, so asking burns the ask at its weakest point.
 */
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
import { Colors, Typography, Spacing, BorderRadius, Animations } from '../theme/DesignSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SpiritualPath, PathStep, UserPathProgress } from '../types';
import { PathsService } from '../services/pathsService';
import { HapticsService } from '../services/hapticsService';
import { PathProgress } from './PathProgress';
import Icon, { IconName } from './Icon';
import { useReduceMotion } from '../hooks/useReduceMotion';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Dark navy base — matches the immersive lesson background. */
const CARD_BG = '#0A1321';

/**
 * The one practice from today's lesson that the user carries out of the
 * session. Shape matches PracticeLayer's `PracticeStepData` so PathStepScreen
 * can hand one straight through without a mapping layer.
 */
export interface CarryItem {
  type: 'mindset' | 'physical' | 'verbal';
  icon: IconName;
  title: string;
  instruction: string;
  arabicText?: string;
  transliteration?: string;
  translation?: string;
  source?: string;
}

interface PathCompletionCelebrationProps {
  visible: boolean;
  path: SpiritualPath;
  step: PathStep;
  userProgress: UserPathProgress;
  /** Kept for callers that only know whether a reflection happened. */
  reflectionWritten?: boolean;
  /** The reflection the user just wrote — echoed back so writing it feels worth it. */
  reflectionText?: string;
  /** Today's practice to carry forward. Omit and the card simply skips that block. */
  carry?: CarryItem | null;
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

// ── Confetti (journey completion only) ──────────────────────────────
interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  animDuration: number;
  animDelay: number;
  rotation: number;
}

/**
 * Brand palette only. The previous implementation used seven arbitrary hues
 * (#EF4444, #EC4899, #6366F1, …) which is a direct break of the single-gold-
 * accent rule in CLAUDE.md — a rainbow burst in a "Celestial Night" app.
 */
function confettiColors(accentColor: string): string[] {
  return [accentColor, Colors.accent.primary, '#F0E6D3', `${accentColor}AA`];
}

function generateConfetti(count: number, accentColor: string): ConfettiPiece[] {
  const palette = confettiColors(accentColor);
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: palette[Math.floor(Math.random() * palette.length)],
    size: 5 + Math.random() * 5,
    animDuration: 2400 + Math.random() * 1800,
    animDelay: Math.random() * 500,
    rotation: Math.random() * 360,
  }));
}

function ConfettiItem({ piece }: { piece: ConfettiPiece }) {
  const translateY = useRef(new Animated.Value(-50)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT + 50,
        duration: piece.animDuration,
        delay: piece.animDelay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: piece.animDuration,
        delay: piece.animDelay + piece.animDuration * 0.6,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration: piece.animDuration,
        delay: piece.animDelay,
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
        borderRadius: piece.size > 8 ? 1.5 : piece.size / 2,
        backgroundColor: piece.color,
        opacity,
        transform: [{ translateY }, { rotate: spin }],
      }}
    />
  );
}

/**
 * Goal-gradient framing that shifts with position in the path. Sits with the
 * "tomorrow" block, where the pull toward the next day is the point — not
 * under the title as a generic slogan.
 */
function getConsistencyMessage(
  step: PathStep,
  path: SpiritualPath,
  nextStep: PathStep | null,
): string {
  if (!nextStep) return '';
  if (nextStep.day === path.duration) {
    return 'One more day stands between you and completing this journey.';
  }
  if (step.day === 1) return 'Begun is half done — the hard part was starting.';
  return 'Small, steady steps. This is how lasting change is built.';
}

/** Label for the carry block, by practice type. */
const CARRY_LABEL: Record<CarryItem['type'], string> = {
  physical: 'CARRY THIS INTO TODAY',
  verbal: 'SAY THIS TODAY',
  mindset: 'HOLD THIS TODAY',
};

// ── Main Component ──────────────────────────────────────────────────
export default function PathCompletionCelebration({
  visible,
  path,
  step,
  userProgress,
  reflectionWritten = false,
  reflectionText,
  carry = null,
  accentColor = Colors.accent.primary,
  onContinue,
  onClose,
  onSupport,
}: PathCompletionCelebrationProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [showConfetti, setShowConfetti] = useState(false);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(24)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const pathsService = PathsService.getInstance();

  // `userProgress` is `celebrationProgress` — already has today appended and
  // `currentDay` already incremented. Use `getCurrentStep` (not `getNextStep`)
  // so we don't add a second +1 and skip a day.
  const nextStep = pathsService.getCurrentStep(path.id, userProgress);
  const isJourneyComplete = !nextStep;
  const consistencyMessage = getConsistencyMessage(step, path, nextStep);

  const confettiPieces = useMemo(
    () => (isJourneyComplete ? generateConfetti(36, accentColor) : []),
    [isJourneyComplete, accentColor, visible],
  );

  const trimmedReflection = reflectionText?.trim();
  const hasReflection = !!trimmedReflection || reflectionWritten;

  useEffect(() => {
    if (!visible) return;

    backdropOpacity.setValue(0);
    cardTranslate.setValue(reduceMotion ? 0 : 24);
    cardOpacity.setValue(0);

    // A daily close is an exhale, not a fanfare: soft haptic, no confetti.
    // The journey end gets the full success burst.
    HapticsService.impactAsync(isJourneyComplete ? 'MEDIUM' : 'LIGHT');
    if (isJourneyComplete) {
      HapticsService.notificationAsync('SUCCESS');
      setShowConfetti(!reduceMotion);
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: Animations.timing.fast,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: Animations.timing.normal,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslate, {
        toValue: 0,
        useNativeDriver: true,
        ...Animations.spring.gentle,
      }),
    ]).start();

    const confettiTimer = setTimeout(() => setShowConfetti(false), 3800);
    return () => clearTimeout(confettiTimer);
  }, [visible, isJourneyComplete, reduceMotion]);

  const animateOut = (done: () => void) => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(cardTranslate, { toValue: 16, duration: 180, useNativeDriver: true }),
    ]).start(done);
  };

  /** Primary on a daily close: stop here, keep the day boundary intact. */
  const handleDone = () => {
    HapticsService.impactAsync('LIGHT');
    animateOut(onClose);
  };

  /** Quiet escape hatch for users who genuinely want to keep going. */
  const handleContinue = () => {
    HapticsService.impactAsync('LIGHT');
    animateOut(onContinue);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Alhamdulillah — I've completed the "${path.title}" journey on Sakina, ${path.duration} days. 🌙`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      {/* Safe-area inset lives as PADDING on the overlay, not as margin on the
          card. Margins sit outside `maxHeight`, so card + margins could exceed
          the viewport on a device with tall insets and push the actions off
          screen; padding shrinks the box the card's maxHeight is measured
          against, which cannot overflow. Absolutely-positioned children
          (backdrop, confetti) are unaffected by it. */}
      <View
        style={[
          styles.overlay,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleDone}
            accessibilityRole="button"
            accessibilityLabel="Dismiss and return to journey"
          />
        </Animated.View>

        {showConfetti && (
          <View style={styles.confettiContainer} pointerEvents="none">
            {confettiPieces.map((piece) => (
              <ConfettiItem key={piece.id} piece={piece} />
            ))}
          </View>
        )}

        {/* Shadow lives on the outer Animated.View so it moves with the
            entrance; the inner plain View does the overflow clipping. Android
            can't reliably combine elevation with overflow+borderRadius. */}
        <Animated.View
          style={[
            styles.cardShadow,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslate }],
            },
          ]}
        >
          <View style={styles.card}>
            <LinearGradient
              colors={[`${accentColor}1F`, CARD_BG]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            <Animated.ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* ── Acknowledgment ────────────────────────────────────
                  A quiet rule and a small label, not an 80px trophy. Day 1
                  of 7 is a real but modest thing; sizing it like a medal
                  spends credibility the journey has not earned yet. */}
              <View style={styles.ack}>
                <View style={[styles.ackRule, { backgroundColor: accentColor }]} />
                <Text style={[styles.ackLabel, { color: accentColor }]}>
                  {isJourneyComplete ? 'JOURNEY COMPLETE' : `DAY ${step.day} COMPLETE`}
                </Text>
              </View>

              {/* Gold sits on the achievement line above, never on the journey
                  name — that was the least useful line drawing the most eye. */}
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.pathTitle}>{path.title}</Text>

              {/* ── The carry — the hero of a daily close ───────────── */}
              {!isJourneyComplete && carry && (
                <View style={[styles.carryCard, { borderColor: `${accentColor}38` }]}>
                  <View style={styles.carryHeader}>
                    <View style={[styles.carryIcon, { backgroundColor: `${accentColor}1F` }]}>
                      <Icon name={carry.icon} size={16} color={accentColor} />
                    </View>
                    <Text style={[styles.carryLabel, { color: accentColor }]}>
                      {CARRY_LABEL[carry.type]}
                    </Text>
                  </View>

                  <Text style={styles.carryTitle}>{carry.title}</Text>
                  <Text style={styles.carryInstruction}>{carry.instruction}</Text>

                  {!!carry.arabicText && (
                    <View style={styles.duaBlock}>
                      {/* lineHeight ≥ 2.1× — Amiri-Quran's harakat sit far off
                          the baseline and clip in a tighter box. Same floor
                          VerseLayer documents. */}
                      <Text style={styles.duaArabic}>{carry.arabicText}</Text>
                      {!!carry.transliteration && (
                        <Text style={styles.duaTranslit}>{carry.transliteration}</Text>
                      )}
                      {!!carry.translation && (
                        <Text style={styles.duaTranslation}>{carry.translation}</Text>
                      )}
                    </View>
                  )}

                  {!!carry.source && (
                    <Text style={[styles.carrySource, { color: `${accentColor}B0` }]}>
                      {carry.source}
                    </Text>
                  )}
                </View>
              )}

              {/* ── Their own words, echoed ─────────────────────────────
                  Previously reduced to a "Reflection saved" pill — a receipt.
                  Showing the words back is what makes writing one feel worth
                  the effort next time. */}
              {!!trimmedReflection && (
                <View style={styles.reflectionBlock}>
                  <Text style={styles.reflectionLabel}>YOU WROTE</Text>
                  <Text style={styles.reflectionQuote} numberOfLines={4}>
                    “{trimmedReflection}”
                  </Text>
                </View>
              )}
              {!trimmedReflection && hasReflection && (
                <View style={styles.reflectionBlock}>
                  <Text style={styles.reflectionLabel}>REFLECTION SAVED</Text>
                </View>
              )}

              {/* ── Progress, stated once ───────────────────────────── */}
              <View style={styles.progressSection}>
                <PathProgress
                  path={path}
                  completedDays={userProgress.completedDays}
                  accentColor={accentColor}
                />
                <Text style={styles.progressDays}>
                  {userProgress.completedDays.length} of {path.duration} days
                </Text>
              </View>

              {/* ── Tomorrow ─────────────────────────────────────────────
                  Same open loop as the old "UP NEXT", but named as tomorrow so
                  it stays open overnight instead of inviting a binge now. */}
              {nextStep && (
                <View style={[styles.tomorrowCard, { borderColor: `${accentColor}26` }]}>
                  <Text style={[styles.tomorrowLabel, { color: `${accentColor}D0` }]}>
                    TOMORROW · DAY {nextStep.day}
                  </Text>
                  <Text style={styles.tomorrowTitle}>{nextStep.title}</Text>
                  <Text style={styles.tomorrowFocus}>{nextStep.focus}</Text>
                  {!!consistencyMessage && (
                    <Text style={styles.consistencyText}>{consistencyMessage}</Text>
                  )}
                </View>
              )}

              {/* ── Journey complete ─────────────────────────────────── */}
              {isJourneyComplete && (
                <View style={[styles.completeCard, { borderColor: `${accentColor}40` }]}>
                  <MaterialCommunityIcons name="star-four-points" size={28} color={accentColor} />
                  <Text style={styles.completeText}>
                    You have completed all {path.duration} days of {path.title}. May Allah accept
                    your efforts and grant you its fruits.
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
                      <MaterialCommunityIcons name="arrow-right" size={15} color={accentColor} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* ── Actions ──────────────────────────────────────────────
                  Weights inverted from the old card: closing the session is
                  the filled primary, continuing is a quiet ghost. The default
                  serves the habit; the escape hatch still exists for anyone
                  who genuinely wants it. */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: accentColor }]}
                  onPress={isJourneyComplete ? handleContinue : handleDone}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isJourneyComplete ? 'Finish journey' : 'Done for today, return to journey'
                  }
                >
                  <Text style={[styles.primaryButtonText, { color: CARD_BG }]}>
                    {isJourneyComplete ? 'Finish journey' : 'Done for today'}
                  </Text>
                </TouchableOpacity>

                {nextStep && (
                  <TouchableOpacity
                    style={styles.ghostButton}
                    onPress={handleContinue}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Continue to day ${nextStep.day} now`}
                  >
                    <Text style={styles.ghostButtonText}>Continue to Day {nextStep.day}</Text>
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={15}
                      color={`${Colors.text.primary}80`}
                    />
                  </TouchableOpacity>
                )}

                {/* Share only at journey completion — see the header note. */}
                {isJourneyComplete && (
                  <TouchableOpacity
                    style={styles.ghostButton}
                    onPress={handleShare}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Share this journey"
                    hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                  >
                    <MaterialCommunityIcons
                      name="share-variant-outline"
                      size={15}
                      color={`${Colors.text.primary}80`}
                    />
                    <Text style={styles.ghostButtonText}>Share</Text>
                  </TouchableOpacity>
                )}
              </View>
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
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  // Hugs its content instead of filling the screen — a modal that fills the
  // viewport reads as a screen you're stuck on, not a card you can close.
  cardShadow: {
    // 100% of the already-inset-padded overlay, so it can never overflow.
    // flexShrink lets the whole chain (shadow -> card -> ScrollView) collapse
    // to that bound when content is tall; without it the card lays out at its
    // full content height, overflows behind `overflow: hidden`, and the
    // ScrollView never becomes scrollable because it believes it has room.
    maxHeight: '100%',
    flexShrink: 1,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 24,
  },
  card: {
    flexShrink: 1,
    backgroundColor: CARD_BG,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  scrollArea: {
    flexShrink: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },

  // Acknowledgment
  ack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ackRule: {
    width: 22,
    height: 2,
    borderRadius: 1,
  },
  ackLabel: {
    fontSize: Typography.sizes.label,
    fontWeight: '700',
    letterSpacing: Typography.letterSpacing.wide,
  },
  stepTitle: {
    fontSize: Typography.sizes.h1,
    fontFamily: Typography.fonts.serif,
    color: '#F0E6D3',
    lineHeight: Typography.sizes.h1 * 1.25,
    marginBottom: Spacing.xs,
  },
  pathTitle: {
    fontSize: Typography.sizes.small,
    color: `${Colors.text.primary}73`,
    marginBottom: Spacing.xl,
  },

  // Carry
  carryCard: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  carryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  carryIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carryLabel: {
    fontSize: Typography.sizes.label,
    fontWeight: '700',
    letterSpacing: Typography.letterSpacing.wide,
  },
  carryTitle: {
    fontSize: Typography.sizes.h2,
    fontFamily: Typography.fonts.serif,
    color: '#F0E6D3',
    marginBottom: Spacing.sm,
    lineHeight: Typography.sizes.h2 * 1.3,
  },
  carryInstruction: {
    fontSize: Typography.sizes.small,
    color: `${Colors.text.primary}C4`,
    lineHeight: Typography.sizes.small * 1.55,
  },
  duaBlock: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
  },
  duaArabic: {
    fontSize: 22,
    fontFamily: Typography.fonts.arabic,
    lineHeight: 46,
    color: '#EDD9A3',
    textAlign: 'center',
  },
  duaTranslit: {
    fontSize: Typography.sizes.detail,
    color: `${Colors.text.primary}8C`,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  duaTranslation: {
    fontSize: Typography.sizes.small,
    color: `${Colors.text.primary}B3`,
    textAlign: 'center',
    lineHeight: Typography.sizes.small * 1.5,
    marginTop: Spacing.xs,
  },
  carrySource: {
    fontSize: Typography.sizes.detail,
    marginTop: Spacing.md,
    fontWeight: '500',
  },

  // Reflection echo
  reflectionBlock: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.16)',
    paddingLeft: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  reflectionLabel: {
    fontSize: Typography.sizes.label,
    fontWeight: '700',
    letterSpacing: Typography.letterSpacing.wide,
    color: `${Colors.text.primary}66`,
    marginBottom: Spacing.sm,
  },
  reflectionQuote: {
    fontSize: Typography.sizes.small,
    fontFamily: Typography.fonts.serif,
    fontStyle: 'italic',
    color: `${Colors.text.primary}D0`,
    lineHeight: Typography.sizes.small * 1.6,
  },

  // Progress
  progressSection: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  progressDays: {
    fontSize: Typography.sizes.detail,
    color: `${Colors.text.primary}73`,
    letterSpacing: 0.4,
  },

  // Tomorrow
  tomorrowCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  tomorrowLabel: {
    fontSize: Typography.sizes.label,
    fontWeight: '700',
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.sm,
  },
  tomorrowTitle: {
    fontSize: Typography.sizes.body,
    fontFamily: Typography.fonts.serif,
    color: '#F0E6D3',
    marginBottom: Spacing.xs,
    lineHeight: Typography.sizes.body * 1.35,
  },
  tomorrowFocus: {
    fontSize: Typography.sizes.detail,
    color: `${Colors.text.primary}80`,
    lineHeight: Typography.sizes.detail * 1.55,
  },
  consistencyText: {
    fontSize: Typography.sizes.detail,
    fontFamily: Typography.fonts.serif,
    fontStyle: 'italic',
    color: `${Colors.text.primary}99`,
    lineHeight: Typography.sizes.detail * 1.6,
    marginTop: Spacing.md,
  },

  // Journey complete
  completeCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  completeText: {
    fontSize: Typography.sizes.small,
    color: `${Colors.text.primary}A6`,
    textAlign: 'center',
    lineHeight: Typography.sizes.small * 1.55,
  },
  supportLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  supportLineText: {
    fontSize: Typography.sizes.small,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Actions
  actions: {
    gap: Spacing.xs,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  primaryButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  ghostButtonText: {
    fontSize: Typography.sizes.small,
    fontWeight: '500',
    color: `${Colors.text.primary}80`,
  },
});
