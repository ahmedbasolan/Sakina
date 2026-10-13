/**
 * SupporterThanks — what a Pro user sees on the Support screen instead of the
 * paywall they already paid through: when they started supporting, what their
 * plan is, and which journeys have shipped since. Spec:
 * docs/superpowers/specs/2026-10-13-pro-early-access-and-supporter-view-design.md
 *
 * Every line is conditional on data we actually have. No date is invented and
 * no future journey is promised.
 */
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '../theme/DesignSystem';
import { SubscriptionState } from '../types';
import { STATIC_SPIRITUAL_PATHS } from '../data/staticPaths';
import { formatDateYMD } from '../utils/date';
import { formatShortDate, journeysReleasedSince } from '../utils/journeyAccess';
import { SakinaLantern } from './SakinaLantern';

// Path titles never change at runtime (variants change steps, not the title).
const TITLES = new Map(STATIC_SPIRITUAL_PATHS.map((p) => [p.id, p.title]));

interface Props {
  state: SubscriptionState | null;
  today: string;
  onClose: () => void;
  onManage: () => void;
  /**
   * Opens the plan picker on Lifetime. Lifetime is a non-consumable sold only
   * in the app, and before this view replaced the paywall a subscriber reached
   * it from Settings — so the route stays. Pass it only when the store
   * actually offers a lifetime package.
   */
  onGetLifetime?: () => void;
}

const longDate = (ms: number) =>
  new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function planLine(state: SubscriptionState | null): string | null {
  if (!state?.isActive) return null;
  if (state.type === 'lifetime') return 'Lifetime · yours for good';
  const label = state.type === 'monthly' ? 'Monthly' : 'Yearly';
  if (!state.subscriptionEndDate) return label;
  const end = longDate(state.subscriptionEndDate);
  return state.willRenew ? `${label} · renews ${end}` : `Pro until ${end}`;
}

const SupporterThanks: React.FC<Props> = ({ state, today, onClose, onManage, onGetLifetime }) => {
  const insets = useSafeAreaInsets();
  const since = state?.supporterSinceMs;
  const built = useMemo(
    () => (since ? journeysReleasedSince(formatDateYMD(new Date(since)), today) : null),
    [since, today],
  );
  const plan = planLine(state);
  // The URL's presence is the test: lifetime and promotional grants have none.
  const canManage = !!state?.isActive && !!state.managementUrl;

  return (
    // Same ground as the paywall it replaces (SupportSakinaScreen's root).
    <LinearGradient colors={Colors.celestialWash} style={styles.root}>
      <TouchableOpacity
        onPress={onClose}
        // Absolute positioning ignores the root's padding, so the inset goes
        // on the button itself or it lands under the status bar.
        style={[styles.close, { top: insets.top + Spacing.sm }]}
        hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={24} color={Colors.text.secondary} />
      </TouchableOpacity>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.xxxl, paddingBottom: insets.bottom + Spacing.xxl },
        ]}
      >
        <SakinaLantern size={56} />
        <Text style={styles.title}>Thank you for supporting Sakina</Text>
        {since ? <Text style={styles.meta}>Supporting since {longDate(since)}</Text> : null}
        {plan ? <Text style={styles.meta}>{plan}</Text> : null}

        {built ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Built since you joined</Text>
            {built.length === 0 ? (
              <Text style={styles.body}>
                The next journey is being written. Your support is what keeps new ones coming.
              </Text>
            ) : (
              built.map((j) => (
                <View key={j.pathId} style={styles.row}>
                  <Ionicons name="book-outline" size={18} color={Colors.accent.primary} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{TITLES.get(j.pathId) ?? j.pathId}</Text>
                    <Text style={styles.rowMeta}>
                      {j.inEarlyAccess && j.publicFrom
                        ? `Yours now · opens to everyone on ${formatShortDate(j.publicFrom)}`
                        : `Released ${formatShortDate(j.released)}`}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {onGetLifetime && state?.type !== 'lifetime' ? (
          <View style={styles.lifetime}>
            <TouchableOpacity
              onPress={onGetLifetime}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
              accessibilityRole="button"
            >
              <Text style={styles.link}>Get Lifetime</Text>
            </TouchableOpacity>
            {/* The store never cancels a running subscription when a
                non-consumable is bought; without this line a subscriber could
                pay for both without knowing. */}
            <Text style={styles.note}>
              Buying Lifetime does not cancel your current subscription. Cancel it in your
              store&apos;s subscription settings.
            </Text>
          </View>
        ) : null}

        {canManage ? (
          <TouchableOpacity
            onPress={onManage}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            accessibilityRole="button"
          >
            <Text style={styles.link}>Manage subscription</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  close: { position: 'absolute', right: Spacing.xl, zIndex: 1 },
  content: { alignItems: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h1,
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  meta: { fontFamily: Typography.fonts.latin, fontSize: Typography.sizes.small, color: Colors.text.secondary },
  section: { alignSelf: 'stretch', marginTop: Spacing.xxl, gap: Spacing.md },
  sectionTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h2,
    color: Colors.text.primary,
  },
  body: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    lineHeight: Typography.sizes.body * 1.5,
    color: Colors.text.secondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.glass.light,
  },
  rowText: { flex: 1, gap: Spacing.xs },
  // The link inside carries the block's top margin (styles.link).
  lifetime: { alignItems: 'center', gap: Spacing.xs },
  note: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    lineHeight: Typography.sizes.detail * 1.5,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  rowTitle: { fontFamily: Typography.fonts.latin, fontSize: Typography.sizes.body, color: Colors.text.primary },
  rowMeta: { fontFamily: Typography.fonts.latin, fontSize: Typography.sizes.detail, color: Colors.text.secondary },
  link: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    color: Colors.accent.primary,
    marginTop: Spacing.xxl,
  },
});

export default SupporterThanks;
