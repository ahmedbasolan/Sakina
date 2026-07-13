/**
 * RestingPoint — the gentle pause a free user meets after spending a prayer
 * window's three guidance refreshes (spec §3.2). It is a *resting point*, not a
 * paywall: kind copy, the reassurance that what they received is saved, and a
 * single calm way back. No price ever appears here — but a quiet, gold
 * "Support Sakina" line sits beneath the CTA (owner decision) so anyone who
 * wants more never has to hunt for the upgrade path. Premium never reaches
 * this screen.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Animations,
  BorderRadius,
  Colors,
  Elevation,
  Spacing,
  Typography,
} from '../theme/DesignSystem';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { SakinaLantern } from './SakinaLantern';

interface Props {
  /** Called when the user chooses to return to their reflections. */
  onDismiss: () => void;
  /** Mood accent for the single CTA; falls back to brand gold. */
  accentColor?: string;
  /**
   * Opens the Support Sakina (upgrade) screen. Always provided by the
   * guidance screen — the line is a permanent, quiet affordance, not a
   * cooldown-gated ask.
   */
  onSupport?: () => void;
  /**
   * Concrete return moment, e.g. "Maghrib · 7:02 PM". When absent the copy
   * falls back to the generic "your next prayer" — never block the pause on
   * prayer-time availability.
   */
  returnAfter?: string | null;
}

const RestingPoint: React.FC<Props> = ({
  onDismiss,
  accentColor = Colors.accent.primary,
  onSupport,
  returnAfter,
}) => {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const enter = useRef(new Animated.Value(0)).current;

  // One coherent entrance: the backdrop fades while the card rises. Honors
  // reduce-motion by snapping to the final frame.
  useEffect(() => {
    if (reduceMotion) {
      enter.setValue(1);
      return;
    }
    Animated.timing(enter, {
      toValue: 1,
      duration: Animations.timing.normal,
      useNativeDriver: true,
    }).start();
  }, [enter, reduceMotion]);

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View
      style={[
        styles.backdrop,
        {
          opacity: enter,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingTop: insets.top + Spacing.xl,
        },
      ]}
      accessibilityViewIsModal
    >
      <Animated.View style={[styles.card, { transform: [{ translateY }] }]}>
        <SakinaLantern size={72} />

        <Text style={styles.title}>A moment to rest</Text>

        <Text style={styles.body}>
          You&apos;ve received this window&apos;s reflections. Sit with them — they&apos;re saved in
          your Mood History. Return after {returnAfter || 'your next prayer'}, in shaa Allah.
        </Text>

        <TouchableOpacity
          style={[styles.cta, { borderColor: accentColor }]}
          onPress={onDismiss}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Return to your reflections"
        >
          <Text style={[styles.ctaText, { color: accentColor }]}>Stay with these</Text>
        </TouchableOpacity>

        {onSupport && (
          <TouchableOpacity
            style={styles.support}
            onPress={onSupport}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Support Sakina to remove refresh limits"
          >
            <Text style={styles.supportText}>Support Sakina for unlimited refreshes</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 13, 26, 0.96)', // Increased backdrop opacity for a deep, focused resting state
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    zIndex: 50,
    elevation: 50,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: Colors.glass.medium,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: BorderRadius.xxl,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    ...Elevation.medium,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h1,
    color: Colors.text.primary,
    letterSpacing: Typography.letterSpacing.normal,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  body: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    lineHeight: Typography.sizes.body * 1.5,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  cta: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
  },
  ctaText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    fontWeight: '600',
    letterSpacing: Typography.letterSpacing.normal,
  },
  support: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  supportText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    // Brand gold (not the mood accent): findable as the upgrade path while
    // staying visibly lighter than the primary CTA above it.
    color: Colors.accent.primary,
    letterSpacing: Typography.letterSpacing.normal,
    // The longer benefit-bearing copy can wrap on narrow devices / larger
    // accessibility text sizes; keep any wrapped line centered like the rest
    // of this fully-centered card instead of defaulting left.
    textAlign: 'center',
  },
});

export default RestingPoint;
