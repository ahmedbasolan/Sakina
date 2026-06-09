/**
 * SupportSakinaScreen — the calm "support the mission" peak destination (spec
 * §8/§14). Framing is supporter/identity, NOT "you've hit a limit": supporting
 * Sakina keeps the Qur'an, reminders and journeys free for everyone, and unlocks
 * themes, unlimited refreshes and early access for the supporter.
 *
 * Reached only from peaks (journey completion, etc.) gated by
 * freemiumService.shouldOfferUpgrade — never from the comfort/guidance flow.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Animations,
  BorderRadius,
  Colors,
  Elevation,
  Spacing,
  Typography,
} from '../theme/DesignSystem';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { SakinaLantern } from '../components/SakinaLantern';
import { FreemiumService } from '../services/freemiumService';
import { HapticsService } from '../services/hapticsService';

const SUPPORT_POINTS: { icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }[] = [
  { icon: 'image-multiple-outline', text: 'Beautiful background themes' },
  { icon: 'infinity', text: 'Unlimited guidance refreshes' },
  { icon: 'clock-fast', text: 'Early access to new journeys' },
];

const SupportSakinaScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const freemium = FreemiumService.getInstance();
  const pricing = freemium.getPricing();

  const enter = useRef(new Animated.Value(0)).current;

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

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  const handleSupport = async () => {
    HapticsService.impactAsync('LIGHT');
    const ok = await freemium.startTrial();
    if (ok) HapticsService.notificationAsync('SUCCESS');
    navigation.goBack();
  };

  const handleLater = () => navigation.goBack();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.close, { top: insets.top + Spacing.sm }]}
        onPress={handleLater}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <MaterialCommunityIcons name="close" size={24} color={Colors.text.secondary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.xxxl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: enter, transform: [{ translateY }], alignItems: 'center' }}
        >
          <SakinaLantern size={96} />

          <Text style={styles.title}>Support Sakina</Text>

          <Text style={styles.body}>
            Sakina is built by a small team who believe a calmer heart shouldn&apos;t sit behind a
            wall. Your support keeps the Qur&apos;an, reminders and journeys free for everyone — and
            unlocks a little more for you.
          </Text>

          <View style={styles.points}>
            {SUPPORT_POINTS.map((p) => (
              <View key={p.text} style={styles.pointRow}>
                <MaterialCommunityIcons name={p.icon} size={20} color={Colors.accent.primary} />
                <Text style={styles.pointText}>{p.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.cta}
            onPress={handleSupport}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Start a ${pricing.trialDays}-day free trial`}
          >
            <Text style={styles.ctaText}>Start {pricing.trialDays}-day free trial</Text>
          </TouchableOpacity>

          <Text style={styles.priceNote}>Then ${pricing.yearlyUSD}/year · cancel anytime</Text>

          <TouchableOpacity
            style={styles.later}
            onPress={handleLater}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.laterText}>Not now</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  close: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.hero,
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
  points: {
    alignSelf: 'stretch',
    gap: Spacing.md,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pointText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
  },
  cta: {
    alignSelf: 'stretch',
    backgroundColor: Colors.accent.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    ...Elevation.medium,
  },
  ctaText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    letterSpacing: Typography.letterSpacing.normal,
    color: Colors.background.primary,
  },
  priceNote: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  later: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  laterText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    color: Colors.text.muted,
  },
});

export default SupportSakinaScreen;
