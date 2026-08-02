import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, MoodColors, Typography } from '../../theme/DesignSystem';
import { CrescentIcon } from './CrescentIcon';

// Deliberate exception to the app's single-gold-accent rule, scoped to this
// card only (owner preference, reference image). Reuses the Calm mood's
// established emerald rather than inventing a new arbitrary hex.
const STREAK_ACCENT = MoodColors.Calm.accent;

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Steadfastness-themed verses, one per streak day — grows with the streak
// rather than the calendar date (distinct rotation from Verse of the Day).
// Full ayahs only (verified against api.alquran.cloud) — these used to be
// partial clauses passed off as whole verses, the same bug fixed in
// dailyVerseService.ts. Al-Baqarah 2:286 and Ar-Ra'd 13:11 were dropped: the
// clauses quoted here came from ayahs several times longer, so they're
// swapped for An-Najm 53:39 and Aal-Imran 3:200, which carry a similar
// message and are genuinely complete on their own.
const STREAK_VERSES: { text: string; ref: string }[] = [
  { text: 'O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.', ref: 'Al-Baqarah 2:153' },
  { text: 'And how many a prophet fought, and with him fought many religious scholars. But they never lost assurance due to what afflicted them in the cause of Allah, nor did they weaken or submit. And Allah loves the steadfast.', ref: "Aal-Imran 3:146" },
  { text: 'So indeed, with hardship comes ease.', ref: 'Ash-Sharh 94:5' },
  { text: 'And that there is not for man except that which he strives for.', ref: "An-Najm 53:39" },
  { text: 'O you who have believed, persevere and endure and remain stationed, and fear Allah, that you may be successful.', ref: 'Aal-Imran 3:200' },
  { text: 'And when they went forth to face Goliath and his soldiers, they said: "Our Lord, pour upon us patience, make our steps firm, and give us victory over the disbelieving people."', ref: 'Al-Baqarah 2:250' },
  { text: 'And seek help through patience and prayer, and indeed, it is difficult except for the humbly submissive.', ref: 'Al-Baqarah 2:45' },
  { text: 'And be patient, for indeed, Allah does not let the reward of those who do good go to waste.', ref: 'Hud 11:115' },
];

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
  const streakVerse = STREAK_VERSES[streakDays % STREAK_VERSES.length];
  return (
    <Animated.View style={[styles.streakSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={streakDays === 0 ? 'Begin your streak today' : `${streakDays}-day streak`}
        accessibilityHint="Double tap to view your streak history"
      >
        <LinearGradient colors={[Colors.background.secondary, Colors.background.primary]} style={styles.streakBar}>
          <LinearGradient
            colors={[`${STREAK_ACCENT}1F`, `${STREAK_ACCENT}05`]}
            style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.lg }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
          />
          <View style={styles.streakTopRow}>
          {/* Crescent icon + streak info */}
          <View style={styles.streakLeft}>
            <View style={styles.streakFlameContainer}>
              <CrescentIcon size={18} color={STREAK_ACCENT} />
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
                      <View key={`streak-dot-${i}`} style={styles.streakDotCol}>
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
            <Ionicons name="arrow-forward" size={12} color={STREAK_ACCENT} />
          </View>
          </View>
          <View style={styles.streakVerseRow}>
            {/* No numberOfLines cap — these are complete ayahs now, and
                ellipsis-truncating Quran text is the same bug as showing a
                partial ayah, just at render time instead of in the data. */}
            <Text style={styles.streakVerseText}>
              &quot;{streakVerse.text}&quot; <Text style={styles.streakVerseRef}>— {streakVerse.ref}</Text>
            </Text>
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
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: STREAK_ACCENT + '40',
    overflow: 'hidden',
  },
  streakTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakVerseRow: {
    borderTopWidth: 1,
    borderTopColor: STREAK_ACCENT + '20',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  streakVerseText: {
    fontFamily: Typography.fonts.serif,
    fontStyle: 'italic',
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.text.secondary,
  },
  streakVerseRef: {
    fontStyle: 'normal',
    color: STREAK_ACCENT,
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
    backgroundColor: STREAK_ACCENT + '26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  streakHint: {
    fontSize: 11,
    color: Colors.text.secondary,
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
    backgroundColor: STREAK_ACCENT + '33',
  },
  streakMoonActive: {
    backgroundColor: STREAK_ACCENT,
  },
  streakDotToday: {
    borderWidth: 1,
    borderColor: STREAK_ACCENT,
  },
  streakDayLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: `${STREAK_ACCENT}59`,
    letterSpacing: 0.3,
  },
  streakDayLabelToday: {
    color: STREAK_ACCENT,
  },
  streakRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakViewText: {
    fontSize: 13,
    fontWeight: '600',
    color: STREAK_ACCENT,
  },
});
