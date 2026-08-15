import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  LayoutAnimation,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const { height } = Dimensions.get('window');
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { HapticsService } from '../services/hapticsService';
import { PracticeSourceType, HadithGrading } from '../types';
import { BuildService } from '../services/buildService';
import Icon, { IconName } from './Icon';

// Same "hide gracefully if the native module is missing" guard AudioPlayerButton
// uses — a stale dev client without expo-audio linked must not crash this screen.
const AudioModule = BuildService.getCapabilities().audio ? require('expo-audio') : null;

export interface PracticeStepData {
  type: 'mindset' | 'physical' | 'verbal';
  icon: IconName;
  title: string;
  instruction: string;
  arabicText?: string;
  transliteration?: string;
  translation?: string;
  // Both optional on purpose. A step assembled at runtime from an angle that
  // carries no attribution of its own must be able to say nothing, rather than
  // be forced to pick a category. Claiming `sunnah_action` for app-written
  // wording is the exact failure `composed_dua` exists to prevent.
  source?: string;
  sourceType?: PracticeSourceType;
  sourceGrading?: HadithGrading;
  count?: number;
  countSource?: string;
}

interface PracticeLayerProps {
  steps: PracticeStepData[];
  onCheckAll: () => void;
  scrollY?: Animated.Value;
  /** Journey identity color — used as the primary (physical action) accent. */
  accentColor?: string;
}

// Gutter geometry, shared by the layout and by the expanded card's breakout
// so the two can never drift apart.
const TIMELINE_W = 30;
const CARD_GAP = 8;
const GUTTER = TIMELINE_W + CARD_GAP;

const TYPE_COLORS: Record<PracticeStepData['type'], string> = {
  mindset: '#F5A623',
  physical: Colors.accent.primary,
  verbal: '#E8B4B8',
};

const SOURCE_TYPE_CONFIG: Record<PracticeSourceType, { label: string; color: string }> = {
  quran_dua: { label: "Qur'anic", color: Colors.status.success },
  prophetic_dua: { label: "Prophetic Du'a", color: '#60A5FA' },
  prophetic_dhikr: { label: 'Prophetic Dhikr', color: '#A78BFA' },
  sunnah_action: { label: 'Sunnah Action', color: '#FBBF24' },
  // Deliberately muted and plainly worded. The other four badges signal a
  // chain — a verse or a hadith — and this one must not be mistaken for them.
  composed_dua: { label: 'Suggested Wording', color: '#8FA3B8' },
};

// ─── Dhikr Counter (circular progress) ─────────────────────────
const DhikrCounter = ({ target, accentColor }: { target: number; accentColor: string }) => {
  const [count, setCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const done = count >= target;
  const progress = Math.min(count / target, 1);

  const increment = () => {
    if (!done) {
      HapticsService.impactAsync('LIGHT');
      setCount(count + 1);

      // Minimal tap feedback — plain timing, no spring/overshoot. CLAUDE.md's
      // micro-feedback band is 100-150ms; a spring here previously overshot
      // and settled with a visible wobble, reading as a pulse/bounce rather
      // than calm feedback.
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.04, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();

      if (count + 1 >= target) {
        HapticsService.notificationAsync('SUCCESS');
      }
    }
  };

  return (
    <TouchableOpacity
      style={styles.dhikrContainer}
      onPress={increment}
      activeOpacity={0.8}
      disabled={done}
      accessibilityRole="button"
      accessibilityLabel={done ? 'Dhikr count complete' : `Dhikr counter, ${count} of ${target}`}
      accessibilityHint={done ? undefined : 'Double tap to count one'}
      accessibilityState={{ disabled: done }}
    >
      <Animated.View style={[styles.dhikrCircle, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.dhikrProgress, {
          borderColor: done ? Colors.status.success : accentColor,
          // Using border width trick for a simple circular progress feel
          borderWidth: 3,
          opacity: progress > 0 ? 0.8 + progress * 0.2 : 0.3,
        }]} />
        <View style={styles.dhikrInner}>
          {done ? (
            <Icon name="checkmark" size={24} color={Colors.status.success} />
          ) : (
            <Text style={[styles.dhikrCount, { color: accentColor }]}>{count}</Text>
          )}
        </View>
      </Animated.View>

      <View style={styles.dhikrInfo}>
        <Text style={[styles.dhikrLabel, done && { color: Colors.status.success }]}>
          {done ? 'Completed — SubhanAllah' : 'Tap to count'}
        </Text>
        {!done && (
          <Text style={styles.dhikrMeta}>{count} of {target}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Dua Recorder — record yourself reciting a dua, then listen back ───
// Wrapper hides the feature entirely on a stale dev client missing the
// native module, same guard AudioPlayerButton uses.
const DuaRecorder = ({ accentColor }: { accentColor: string }) => {
  if (!AudioModule) return null;
  return <DuaRecorderInner accentColor={accentColor} />;
};

const DuaRecorderInner = ({ accentColor }: { accentColor: string }) => {
  const recorder = AudioModule.useAudioRecorder(AudioModule.RecordingPresets.HIGH_QUALITY);
  const recorderState = AudioModule.useAudioRecorderState(recorder);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const player = AudioModule.useAudioPlayer(recordedUri);
  const playerStatus = AudioModule.useAudioPlayerStatus(player);

  const isRecording = recorderState?.isRecording ?? false;
  const isPlaying = playerStatus?.playing ?? false;

  // If this card collapses — or another step is expanded — mid-recording,
  // DuaRecorderInner unmounts immediately (it only renders inside the
  // single-select isExpanded body below). Without this, the native
  // recorder is left with nothing to ever call stop() on, and the global
  // `allowsRecording` flag set in startRecording stays stuck on for the
  // rest of the app, silencing/altering other audio (e.g. the verse
  // recitation AudioPlayerButtons elsewhere). Safe to call even when not
  // currently recording — errors are swallowed, matching this file's own
  // best-effort-cleanup convention elsewhere.
  useEffect(() => {
    return () => {
      recorder.stop().catch(() => {});
      AudioModule.setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Microphone access needed',
          'Allow microphone access in Settings to record yourself reciting.',
        );
        return;
      }
      // Global session toggle — flipped back off in stopRecording so it
      // doesn't linger and affect unrelated audio (e.g. verse recitation)
      // elsewhere in the app once the user is done recording.
      await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      HapticsService.impactAsync('LIGHT');
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      console.error('DuaRecorder: failed to start recording', error);
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      await AudioModule.setAudioModeAsync({ allowsRecording: false });
      HapticsService.impactAsync('LIGHT');
      if (recorder.uri) setRecordedUri(recorder.uri);
    } catch (error) {
      console.error('DuaRecorder: failed to stop recording', error);
    }
  };

  const togglePlayback = () => {
    HapticsService.impactAsync('LIGHT');
    if (isPlaying) {
      player.pause();
    } else {
      if (playerStatus?.didJustFinish) player.seekTo(0);
      player.play();
    }
  };

  const reRecord = () => {
    if (isPlaying) player.pause();
    setRecordedUri(null);
  };

  if (isRecording) {
    return (
      <TouchableOpacity
        style={[styles.recorderRow, { borderColor: Colors.status.error + '55' }]}
        onPress={stopRecording}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Stop recording"
      >
        <View style={styles.recordingDot} />
        <Text style={[styles.recorderLabel, { color: Colors.status.error }]}>
          Recording — {Math.round((recorderState?.durationMillis ?? 0) / 1000)}s · tap to stop
        </Text>
      </TouchableOpacity>
    );
  }

  if (recordedUri) {
    return (
      <View style={[styles.recorderRow, { borderColor: accentColor + '40' }]}>
        <TouchableOpacity
          onPress={togglePlayback}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause your recording' : 'Play your recording'}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color={accentColor} />
        </TouchableOpacity>
        <Text style={[styles.recorderLabel, { color: accentColor }]}>
          {isPlaying ? 'Playing your recitation' : 'Listen to yourself'}
        </Text>
        <TouchableOpacity
          onPress={reRecord}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Record again"
        >
          <Ionicons name="refresh" size={16} color={Colors.text.muted} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.recorderRow, { borderColor: accentColor + '30' }]}
      onPress={startRecording}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Record yourself reciting"
    >
      <Ionicons name="mic-outline" size={16} color={accentColor} />
      <Text style={[styles.recorderLabel, { color: accentColor }]}>Record yourself reciting</Text>
    </TouchableOpacity>
  );
};

// ─── Step Card ─────────────────────────────────────────────────
const PracticeStepCard = ({
  item,
  index,
  totalSteps,
  checked,
  accentColor,
  onToggleCheck,
  isExpanded,
  onToggleExpand,
}: {
  item: PracticeStepData;
  index: number;
  totalSteps: number;
  checked: boolean;
  accentColor: string;
  onToggleCheck: (index: number) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const needsExplanation = item.instruction.toLowerCase().includes('write');
  const isLast = index === totalSteps - 1;

  return (
    <View style={styles.stepWrapper}>
      {/* Timeline connector */}
      <View style={styles.timelineColumn}>
        {/* Step number / check circle */}
        <TouchableOpacity
          onPress={() => onToggleCheck(index)}
          activeOpacity={0.7}
          style={[
            styles.stepCircle,
            checked
              ? { backgroundColor: accentColor, borderColor: accentColor }
              : { borderColor: accentColor + '50' },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Step ${index + 1}, ${item.title}`}
          accessibilityHint={checked ? 'Double tap to mark as not done' : 'Double tap to mark as done'}
          accessibilityState={{ selected: checked }}
        >
          {checked ? (
            <Ionicons name="checkmark" size={14} color={Colors.background.primary} />
          ) : (
            <Text style={[styles.stepNumber, { color: accentColor }]}>{index + 1}</Text>
          )}
        </TouchableOpacity>

        {/* Connecting line */}
        {!isLast && (
          <View style={[styles.timelineLine, { backgroundColor: checked ? accentColor + '40' : `${Colors.text.primary}14` }]} />
        )}
      </View>

      {/* Card content */}
      <View style={styles.stepCardColumn}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onToggleExpand}
          style={[
            styles.stepCard,
            checked && { borderColor: accentColor + '30' },
            isExpanded && styles.stepCardExpanded,
          ]}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          accessibilityState={{ expanded: isExpanded }}
        >
          {/* Card Header — when the card has broken out of the timeline
              gutter, pad the header back in so the icon and title still sit
              clear of the step circle floating over the card's left edge. */}
          <View style={[styles.stepCardHeader, isExpanded && styles.stepCardHeaderExpanded]}>
            <View style={styles.stepTitleRow}>
              <View style={[styles.stepIconBg, { backgroundColor: accentColor + '15' }]}>
                <Icon name={item.icon} size={20} color={accentColor} />
              </View>
              <View style={styles.stepTitleBlock}>
                <Text style={[styles.stepTitle, checked && { opacity: 0.5 }]}>{item.title}</Text>
                {item.sourceType && (
                  <Text style={[styles.stepSourceTag, { color: SOURCE_TYPE_CONFIG[item.sourceType]?.color || Colors.text.muted }]}>
                    {SOURCE_TYPE_CONFIG[item.sourceType]?.label}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.text.muted}
            />
          </View>

          {/* Expanded Body */}
          {isExpanded && (
            <View style={styles.stepBody}>
              <Text style={styles.stepInstruction}>{item.instruction}</Text>

              {needsExplanation && (
                <View style={styles.explanationContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      HapticsService.impactAsync('LIGHT');
                      setShowExplanation(!showExplanation);
                    }}
                    style={styles.whyButton}
                    accessibilityRole="button"
                    accessibilityLabel="Why write it down?"
                    accessibilityState={{ expanded: showExplanation }}
                  >
                    <Ionicons
                      name={showExplanation ? 'chevron-up' : 'help-circle-outline'}
                      size={14}
                      color={Colors.accent.primary}
                    />
                    <Text style={styles.whyText}>Why write it down?</Text>
                  </TouchableOpacity>

                  {showExplanation && (
                    <View style={styles.explanationBody}>
                      <Text style={styles.explanationPara}>
                        Islamic scholars like Al-Ghazali often recommend *Muhasabah* (self-reflection).
                      </Text>
                      <Text style={styles.explanationPara}>
                        Writing is a modern cognitive technique. It helps internalize spiritual promises.
                      </Text>
                      <Text style={styles.explanationPara}>
                        This moves the verse from a concept to a personal truth in your life.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Dua / Dhikr block */}
              {item.arabicText && (
                <View style={[styles.duaBlock, { borderLeftColor: accentColor }]}>
                  <Text style={styles.duaArabic}>{item.arabicText}</Text>
                  {item.transliteration && (
                    <Text style={[styles.duaTranslit, { color: accentColor }]}>{item.transliteration}</Text>
                  )}
                  {item.translation && (
                    <Text style={styles.duaTranslation}>&quot;{item.translation}&quot;</Text>
                  )}
                  <DuaRecorder accentColor={accentColor} />
                </View>
              )}

              {/* Dhikr Counter */}
              {item.count && item.count > 0 && (
                <DhikrCounter target={item.count} accentColor={accentColor} />
              )}

              {/* Source — omitted entirely when the step has no attribution,
                  rather than rendering an empty styled line. */}
              {/* No numberOfLines. Sources are now full quoted hadith —
                  "He then took and brought me around him and set me on his
                  right side… [Sunan Abi Dawud 634]" — and a one-line clamp
                  ellipsised the very thing that proves the step. */}
              {!!item.source && <Text style={styles.stepSource}>{item.source}</Text>}
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Component ────────────────────────────────────────────
const PracticeLayer: React.FC<PracticeLayerProps> = ({ steps, onCheckAll, scrollY, accentColor }) => {
  const insets = useSafeAreaInsets();
  const [checkedIndexes, setCheckedIndexes] = useState<Set<number>>(new Set());
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Physical (Sunnah action) takes the journey identity color; the other types
  // keep their distinct hues so step types stay visually differentiated.
  const typeColors: Record<PracticeStepData['type'], string> = {
    ...TYPE_COLORS,
    physical: accentColor || TYPE_COLORS.physical,
  };

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const toggleCheck = (index: number) => {
    HapticsService.impactAsync('LIGHT');
    const next = new Set(checkedIndexes);
    const isChecking = !next.has(index);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setCheckedIndexes(next);

    if (isChecking && next.size === steps.length) {
      HapticsService.notificationAsync('SUCCESS');
    }
  };

  const allChecked = checkedIndexes.size === steps.length && steps.length > 0;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + Spacing.xs, height * 0.015),
          paddingBottom: Math.max(insets.bottom + Spacing.xs, Spacing.md),
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={
          scrollY
            ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
            })
            : undefined
        }
      >
        {/* Header */}
        <View style={styles.headerArea}>
          <Text style={styles.headerLabel}>Sunnah Practice</Text>
          <Text style={styles.headerCount}>
            {checkedIndexes.size} of {steps.length}
          </Text>
        </View>

        {/* Steps with timeline */}
        {steps.map((step, index) => (
          <PracticeStepCard
            key={index}
            item={step}
            index={index}
            totalSteps={steps.length}
            checked={checkedIndexes.has(index)}
            accentColor={typeColors[step.type]}
            onToggleCheck={toggleCheck}
            isExpanded={expandedIndex === index}
            onToggleExpand={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setExpandedIndex(expandedIndex === index ? null : index);
            }}
          />
        ))}

        {/* Completion */}
        {allChecked && (
          <TouchableOpacity
            style={styles.completionButton}
            onPress={onCheckAll}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="All steps complete, continue"
          >
            <Text style={styles.completionIcon}>✦</Text>
            <Text style={styles.completionText}>Alhamdulillah — All Complete</Text>
          </TouchableOpacity>
        )}
      </Animated.ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: Spacing.xxxl,
  },

  /* ── Header ── */
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: 4,
  },
  headerLabel: {
    fontSize: 12,
    color: Colors.accent.secondary,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  headerCount: {
    fontSize: 13,
    color: Colors.text.muted,
    fontWeight: '600',
  },

  /* ── Step layout (timeline + card) ── */
  stepWrapper: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  timelineColumn: {
    width: TIMELINE_W,
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    borderRadius: 1,
    marginVertical: 2,
  },
  stepCardColumn: {
    flex: 1,
    paddingLeft: CARD_GAP,
    paddingBottom: Spacing.md,
  },

  /* ── Step Card ── */
  stepCard: {
    backgroundColor: Colors.background.secondary + 'B3',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 210, 0.14)',
    overflow: 'hidden',
  },
  stepCardExpanded: {
    borderColor: 'rgba(255, 235, 210, 0.28)',
    // Break out of the timeline gutter so the open step gets the full width.
    marginLeft: -GUTTER,
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  stepCardHeaderExpanded: {
    paddingLeft: GUTTER + Spacing.sm,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  stepIconBg: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitleBlock: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  stepSourceTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
    opacity: 0.7,
  },

  /* ── Expanded Body ── */
  stepBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  stepInstruction: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 26,
    marginBottom: Spacing.lg,
  },

  /* ── Dua block ── */
  duaBlock: {
    backgroundColor: 'rgba(255, 235, 210, 0.04)',
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    borderLeftWidth: 3,
    marginBottom: Spacing.lg,
  },
  duaArabic: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 20,
    lineHeight: 38,
    color: Colors.text.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: Spacing.sm,
  },
  duaTranslit: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 4,
  },
  duaTranslation: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  /* ── Dua Recorder ── */
  recorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  recorderLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.status.error,
  },

  /* ── Dhikr Counter ── */
  dhikrContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  dhikrCircle: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  dhikrProgress: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  dhikrInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dhikrCount: {
    fontSize: 20,
    fontWeight: '700',
  },
  dhikrInfo: {
    flex: 1,
  },
  dhikrLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  dhikrMeta: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },

  /* ── Source / Footer ── */
  stepSource: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text.muted,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },

  /* ── Explanation ── */
  explanationContainer: {
    marginBottom: Spacing.md,
  },
  whyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  whyText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent.primary,
    textDecorationLine: 'underline',
  },
  explanationBody: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: 4,
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent.primary,
  },
  explanationPara: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 6,
  },

  /* ── Completion ── */
  completionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
    borderRadius: BorderRadius.xl,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
    marginTop: Spacing.xl,
  },
  completionIcon: {
    fontSize: 16,
    color: Colors.status.success,
  },
  completionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.status.success,
    letterSpacing: 0.5,
  },
});

export default React.memo(PracticeLayer);
