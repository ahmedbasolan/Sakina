import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../theme/DesignSystem';
import { CrescentIcon } from './CrescentIcon';

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function useWeekDots(streakDays: number) {
  // Recomputed each render so a date change (midnight rollover) is picked up
  // on the next render without needing an interval — useMemo then sees a new
  // `today` value in its deps and recomputes.
  const today = new Date().toDateString();
  return useMemo(() => {
    const todayDow = (new Date().getDay() + 6) % 7; // 0=Mon … 6=Sun
    return WEEK_LABELS.map((label, i) => {
      // How many calendar days ago did weekday-column `i` last occur?
      // If i <= todayDow it was this week; if i > todayDow it was last week.
      const daysAgo = i <= todayDow ? todayDow - i : todayDow - i + 7;
      const active = daysAgo < Math.min(streakDays, 7);
      const isToday = i === todayDow;
      return { label, active, isToday };
    });
  }, [streakDays, today]);
}

interface StreakBarProps {
  streakDays: number;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  onPress: () => void;
}

export function StreakBar({ streakDays, fadeAnim, slideAnim, onPress }: StreakBarProps) {
  const weekDots = useWeekDots(streakDays);
  return (
    <Animated.View style={[styles.streakSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <LinearGradient colors={[Colors.background.secondary, Colors.background.primary]} style={styles.streakBar}>
          {/* Crescent icon + streak info */}
          <View style={styles.streakLeft}>
            <View style={styles.streakFlameContainer}>
              <CrescentIcon size={18} color={Colors.accent.primary} />
            </View>
            <View>
              {streakDays === 0 ? (
                <>
                  <Text style={styles.streakText}>Begin your streak today</Text>
                  <Text style={styles.streakHint}>Check in to start your journey</Text>
                </>
              ) : (
                <>
                  <Text style={styles.streakText}>{streakDays}-Day Streak</Text>
                  <View style={styles.streakMoons}>
                    {weekDots.map((dot, i) => (
                      <View key={i} style={styles.streakDotCol}>
                        <View style={[
                          styles.streakMoonDot,
                          dot.active && styles.streakMoonActive,
                          dot.isToday && styles.streakDotToday,
                        ]} />
                        <Text style={[styles.streakDayLabel, dot.isToday && styles.streakDayLabelToday]}>
                          {dot.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
          <View style={styles.streakRight}>
            <Text style={styles.streakViewText}>View</Text>
            <Ionicons name="arrow-forward" size={12} color={Colors.accent.primary} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  streakSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  streakBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent.primary + '26',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakFlameContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent.primary + '1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent.primary,
    marginBottom: 2,
  },
  streakHint: {
    fontSize: 11,
    color: Colors.accent.primary + '73',
    letterSpacing: 0.2,
  },
  streakMoons: {
    flexDirection: 'row',
    gap: 6,
  },
  streakDotCol: {
    alignItems: 'center',
    gap: 3,
  },
  streakMoonDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.accent.primary + '33',
  },
  streakMoonActive: {
    backgroundColor: Colors.accent.primary,
  },
  streakDotToday: {
    borderWidth: 1,
    borderColor: Colors.accent.primary,
  },
  streakDayLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: `${Colors.accent.primary}59`,
    letterSpacing: 0.3,
  },
  streakDayLabelToday: {
    color: Colors.accent.primary,
  },
  streakRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakViewText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
});
