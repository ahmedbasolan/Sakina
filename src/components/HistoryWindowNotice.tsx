/**
 * The line that explains why history stops where it does.
 *
 * Without this, a capped view is indistinguishable from an empty one — the
 * user reads "my older entries are gone" instead of "my older entries are
 * behind Pro". Nothing here is decorative: it is the only place the app tells
 * someone their writing is still safe.
 *
 * Both tiers get a line. A Pro user's history stops too (at 90 days), and
 * leaving them to guess why is the same failure in a quieter register.
 *
 * Copy rules it has to satisfy: never imply data was deleted, never scold, and
 * state the actual number the tier gets rather than a vague "more".
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../theme/DesignSystem';

interface Props {
  /** Days the current tier may browse. `Infinity` renders nothing. */
  windowDays: number;
  isPremium: boolean;
  /** Days the paid tier would give. Only read when `isPremium` is false. */
  premiumWindowDays: number;
  /** Opens the paywall. Omit for the premium line, which has no CTA. */
  onUpgrade?: () => void;
  /** What is being capped, e.g. "check-ins" or "reflections". */
  noun: string;
}

function HistoryWindowNoticeBase({
  windowDays,
  isPremium,
  premiumWindowDays,
  onUpgrade,
  noun,
}: Props) {
  // An unbounded window has no edge to explain.
  if (!Number.isFinite(windowDays)) return null;

  if (isPremium) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.quiet}>
          Showing your last {windowDays} days of {noun}. Everything older is still saved.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <MaterialCommunityIcons
          name="lock-outline"
          size={13}
          color={`${Colors.accent.primary}99`}
        />
        <Text style={styles.quiet}>
          Showing your last {windowDays} days of {noun}
        </Text>
      </View>
      {/* "still here" is the load-bearing phrase — the older entries were never
          deleted, only hidden, and the user has no way to know that otherwise. */}
      <Text style={styles.reassure}>
        Anything older is still here, waiting.
      </Text>
      <TouchableOpacity
        onPress={onUpgrade}
        activeOpacity={0.7}
        hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        accessibilityRole="button"
        accessibilityLabel={`Unlock ${premiumWindowDays} days of history with Sakina Pro`}
      >
        <Text style={styles.cta}>Unlock {premiumWindowDays} days with Sakina Pro</Text>
      </TouchableOpacity>
    </View>
  );
}

export const HistoryWindowNotice = React.memo(HistoryWindowNoticeBase);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quiet: {
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  reassure: {
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
    textAlign: 'center',
    opacity: 0.8,
  },
  cta: {
    fontSize: Typography.sizes.small,
    color: Colors.accent.primary,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
