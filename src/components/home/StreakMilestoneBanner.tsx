import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Animations, MoodColors } from '../../theme/DesignSystem';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { CrescentIcon } from './CrescentIcon';

// Same deliberate exception as StreakBar — reuses the Calm mood's emerald so
// every streak-related surface reads as one family.
const STREAK_ACCENT = MoodColors.Calm.accent;

const MILESTONE_COPY: Record<number, string> = {
  7: 'A full week of returning to Him — Alhamdulillah.',
  30: 'A month of showing up. That consistency is its own reward.',
  100: '100 days. A habit of the heart, truly taking root.',
};

interface StreakMilestoneBannerProps {
  milestone: number;
  onDismiss: () => void;
  /** Only set when the peaks-only gate (spec §8) allowed a soft ask here. */
  onSupport?: () => void;
}

export function StreakMilestoneBanner({ milestone, onDismiss, onSupport }: StreakMilestoneBannerProps) {
  const reduceMotion = useReduceMotion();
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      enter.setValue(1);
      return;
    }
    Animated.timing(enter, { toValue: 1, duration: Animations.timing.normal, useNativeDriver: true }).start();
  }, [reduceMotion]);

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <Animated.View style={[styles.section, { opacity: enter, transform: [{ translateY }] }]}>
      <View style={styles.banner}>
        <View style={styles.iconWrap}>
          <CrescentIcon size={20} color={STREAK_ACCENT} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{milestone}-Day Streak</Text>
          <Text style={styles.copy}>{MILESTONE_COPY[milestone] ?? 'A milestone worth marking.'}</Text>
          {onSupport && (
            <TouchableOpacity
              style={styles.supportLine}
              onPress={onSupport}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Support Sakina"
            >
              <Text style={styles.supportLineText}>Support the mission</Text>
              <Ionicons name="arrow-forward" size={12} color={Colors.accent.primary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Ionicons name="close" size={16} color={Colors.text.muted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${STREAK_ACCENT}14`,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: `${STREAK_ACCENT}40`,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${STREAK_ACCENT}26`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  copy: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text.secondary,
  },
  supportLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  supportLineText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent.primary,
    letterSpacing: 0.2,
  },
  dismiss: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
