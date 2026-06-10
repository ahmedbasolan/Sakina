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
  pathType = 'droplet',
  currentDay,
  totalDays,
  completedDays,
  onSettingsPress,
  onBack,
  accentColor = Colors.accent.primary,
  phaseLabel,
}) => {
  const insets = useSafeAreaInsets();
  // Use completed-days count if provided; fall back to currentDay-1 so the bar
  // matches the celebration modal's ring (both show achievement, not position).
  const doneCount = completedDays ?? Math.max(currentDay - 1, 0);
  const progress = (doneCount / totalDays) * 100;

  const getPathIcon = () => {
    switch (pathType) {
      case 'droplet':
        return 'water';
      case 'sun':
        return 'sunny';
      case 'moon':
        return 'moon';
      default:
        return 'water';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.leftAction}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.iconCircle}
          activeOpacity={0.7}
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
    paddingBottom: Spacing.md,
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
    borderRadius: 22,
    backgroundColor: '#1C1612',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.text.secondary,
    letterSpacing: 1.5,
    marginBottom: 8,
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
