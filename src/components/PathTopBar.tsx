import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme/DesignSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PathTopBarProps {
  pathType?: 'droplet' | 'sun' | 'moon';
  currentDay: number;
  totalDays: number;
  /** Number of days actually completed — used for the progress bar and % label.
   *  Defaults to currentDay-1 if omitted (backward-compatible). */
  completedDays?: number;
  onSettingsPress?: () => void;
  onBack: () => void;
  /** Journey accent color — themes the progress fill to the path's identity. */
  accentColor?: string;
  /** Phase label for long, chunked journeys (e.g. "Week 1 — Foundations"). */
  phaseLabel?: string;
}

const PathTopBar: React.FC<PathTopBarProps> = ({
  currentDay,
  totalDays,
  completedDays,
  onSettingsPress,
  onBack,
  accentColor = Colors.accent.primary,
  phaseLabel,
}) => {
  const insets = useSafeAreaInsets();
  // Use completed-days count if provided; fall back to currentDay-1 otherwise.
  const completedCount = completedDays ?? Math.max(currentDay - 1, 0);
  const isJourneyComplete = completedCount >= totalDays;
  // Goal-gradient head start (same principle as onboarding's currentScreen+1):
  // credit the day already in progress so day 1 never reads a bare 0%. Capped
  // one short of totalDays until the journey is actually complete, so the
  // final day never flashes 100% before its completion celebration fires.
  const doneCount = isJourneyComplete
    ? totalDays
    : Math.min(completedCount + 1, totalDays - 1);
  const progress = (doneCount / totalDays) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xs }]}>
      <View style={styles.leftAction}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.iconCircle}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.centerContent}>
        <Text style={styles.progressLabel}>
          {phaseLabel
            ? phaseLabel
            : `Day ${currentDay}/${totalDays}${doneCount > 0 ? ` — ${Math.round(progress)}%` : ''}`}
        </Text>
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressBarTrack}>
            <View
              style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: accentColor }]}
            />
          </View>
        </View>
      </View>

      <View style={styles.rightAction}>
        {onSettingsPress && (
          <TouchableOpacity
            onPress={onSettingsPress}
            style={styles.iconCircle}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Journey settings"
          >
            <Ionicons name="options-outline" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    zIndex: 10,
  },
  leftAction: {
    width: 44,
    alignItems: 'flex-start',
  },
  rightAction: {
    width: 44,
    alignItems: 'flex-end',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.text.secondary,
    letterSpacing: 1.5,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  progressBarWrapper: {
    width: '100%',
    paddingHorizontal: Spacing.xl,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent.primary,
    borderRadius: 2,
  },
});

export default React.memo(PathTopBar);
