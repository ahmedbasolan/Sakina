import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
const { height } = Dimensions.get('window');
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { HapticsService } from '../services/hapticsService';
import { PracticeSourceType, HadithGrading } from '../types';
import Icon, { IconName } from './Icon';

export interface PracticeStepData {
  type: 'mindset' | 'physical' | 'verbal';
  icon: IconName;
  title: string;
  instruction: string;
  arabicText?: string;
  transliteration?: string;
  translation?: string;
  source: string;
  sourceType: PracticeSourceType;
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

      // Micro-bounce on tap
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 80, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
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
          {/* Frosted-glass surface — lets the immersive background (mandala or
              journey photo) blend through instead of a flat opaque box */}
          <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFillObject} pointerEvents="none" />

          {/* Card Header */}
          <View style={styles.stepCardHeader}>
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
                    <Text style={styles.duaTranslation}>"{item.translation}"</Text>
                  )}
                </View>
              )}

              {/* Dhikr Counter */}
              {item.count && item.count > 0 && (
                <DhikrCounter target={item.count} accentColor={accentColor} />
              )}

              {/* Source */}
              <Text style={styles.stepSource} numberOfLines={1}>{item.source}</Text>
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
    width: 36,
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
    paddingLeft: Spacing.md,
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
    borderColor: 'rgba(255, 235, 210, 0.2)',
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  stepInstruction: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },

  /* ── Dua block ── */
  duaBlock: {
    backgroundColor: 'rgba(255, 235, 210, 0.04)',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderLeftWidth: 3,
    marginBottom: Spacing.md,
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
    fontSize: 11,
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
