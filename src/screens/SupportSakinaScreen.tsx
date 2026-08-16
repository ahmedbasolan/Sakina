/**
 * SupportSakinaScreen — "Support the mission" paywall in RC-template format:
 * Annual / Monthly plan picker → feature list → fixed CTA footer.
 * Framing is supporter/identity, not "you've hit a limit."
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  Animations,
  BorderRadius,
  Colors,
  Elevation,
  Spacing,
  Typography,
} from '../theme/DesignSystem';
import { LEGAL_URLS } from '../constants';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { FreemiumService } from '../services/freemiumService';
import { HapticsService } from '../services/hapticsService';
import { revenueCat } from '../services/revenueCatService';
import { BACKGROUND_THEMES } from '../services/backgroundThemeService';

// A handful of visually distinct themes to preview on the paywall — one per
// category so the strip reads as varied, not repetitive.
const THEME_PREVIEW_IDS = [
  'sky_milky_way',
  'landscape_blue_mosque',
  'ocean_sunset_beach',
  'mountain_snow_peaks',
  'nature_waterfall',
  'animals_kaaba_sanctuary',
];
const THEME_PREVIEWS = THEME_PREVIEW_IDS.map((id) =>
  BACKGROUND_THEMES.find((t) => t.id === id),
).filter((t): t is NonNullable<typeof t> => !!t);

type Plan = 'yearly' | 'monthly';

/**
 * Derive a "/mo" equivalent from the annual price, reusing the currency symbol
 * from the store-localized annual string so it shows the right currency (not a
 * hardcoded "$"). Amount math uses the raw local-currency number from RC.
 */
function perMonthFromYearly(yearlyPriceString: string, yearlyAmount: number): string {
  const perMonth = (yearlyAmount / 12).toFixed(2);
  const symbol = yearlyPriceString.replace(/[\d.,\s]/g, ''); // strip digits/separators → currency symbol
  if (!symbol) return perMonth;
  // Preserve placement: prefix ("$5.83") vs suffix ("5,83 €").
  return yearlyPriceString.trim().endsWith(symbol) ? `${perMonth} ${symbol}` : `${symbol}${perMonth}`;
}

const FEATURES: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  showThemePreview?: boolean;
}[] = [
  {
    icon: 'color-palette-outline',
    title: 'Beautiful background themes',
    description: 'A different mandala or nightscape behind every session, not just the one default',
    showThemePreview: true,
  },
  {
    icon: 'infinite-outline',
    title: 'Unlimited guidance refreshes',
    description: 'Return to divine guidance as many times as you need',
  },
  {
    icon: 'book-outline',
    title: 'Early access to new journeys',
    description: 'Explore curated Quranic journeys before anyone else',
  },
  {
    icon: 'time-outline',
    title: '90 days of history',
    description: 'Look back further across your mood and reflection journey',
  },
  {
    icon: 'pie-chart-outline',
    title: 'Mood analytics & insights',
    description: 'See which days and moods actually repeat, instead of just remembering the loudest ones',
  },
];

interface Props {
  /** True when rendered as onboarding's final step instead of a pushed Settings screen. */
  embedded?: boolean;
  /** Called instead of navigation.goBack() when embedded — subscribe, restore, or skip all funnel through this. */
  onDone?: () => void;
}

const SupportSakinaScreen: React.FC<Props> = ({ embedded = false, onDone }) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const freemium = FreemiumService.getInstance();

  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');
  const [loading, setLoading] = useState(false);
  // Whether the user can still get the intro free trial on the yearly plan.
  // Assume eligible until RC says otherwise, so the trial label doesn't flicker
  // for first-time users on the common path. Returning users who used their
  // trial flip to false and see a plain "Subscribe" CTA (App Store guideline).
  const [trialEligible, setTrialEligible] = useState(true);
  // Pricing — initialise from freemium (may be static fallback on cold start),
  // then refresh from RC offerings on mount so the correct store-localized
  // price is always shown before the user taps the CTA.
  const [pricing, setPricingState] = useState(() => freemium.getPricing());

  const enter = useRef(new Animated.Value(0)).current;

  // Landing on the full paywall is itself a peak (spec §8) — record it
  // unconditionally so the anti-nag cooldown starts here too, even when this
  // visit didn't originate from a gated peak (e.g. a direct Settings tap).
  // Guards against a stray write for premium users re-visiting this screen.
  useEffect(() => {
    if (!freemium.isPremium()) {
      freemium.recordUpgradeAsk('support_screen');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    revenueCat
      .isYearlyTrialEligible()
      .then((eligible) => {
        if (!cancelled) setTrialEligible(eligible);
      })
      .catch(() => {});
    revenueCat
      .getPricing()
      .then((p) => {
        if (!cancelled && p) {
          setPricingState({
            monthlyUSD: p.monthlyPriceAmount,
            yearlyUSD: p.yearlyPriceAmount,
            monthlyPrice: p.monthlyPrice,
            yearlyPrice: p.yearlyPrice,
            trialDays: p.trialDays,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  const monthlyEquiv = perMonthFromYearly(pricing.yearlyPrice, pricing.yearlyUSD);
  // Currency-independent ratio — correct regardless of store currency. Guarded
  // so a non-positive value (annual not cheaper) never renders "Save 0%".
  const savePercent = Math.round((1 - pricing.yearlyUSD / (pricing.monthlyUSD * 12)) * 100);
  const showSaveBadge = savePercent > 0;

  const ctaLabel =
    selectedPlan === 'yearly'
      ? trialEligible
        ? `Start ${pricing.trialDays}-day free trial`
        : 'Subscribe yearly'
      : 'Subscribe monthly';

  const priceNote =
    selectedPlan === 'yearly'
      ? trialEligible
        ? `Then ${pricing.yearlyPrice}/year, auto-renews annually · cancel anytime`
        : `${pricing.yearlyPrice}/year, auto-renews annually · cancel anytime`
      : `${pricing.monthlyPrice}/month, auto-renews monthly · cancel anytime`;

  const handleContinue = async () => {
    if (loading) return;
    setLoading(true);
    HapticsService.impactAsync('LIGHT');
    try {
      const ok =
        selectedPlan === 'yearly'
          ? await freemium.startTrial()
          : await freemium.activatePremium('monthly');
      if (ok) {
        HapticsService.notificationAsync('SUCCESS');
        if (embedded) onDone?.();
        else navigation.goBack();
      }
      // ok === false covers both user-cancel (no message needed) and a quiet
      // RC failure; the button simply re-enables so they can try again.
    } catch {
      Alert.alert(
        'Purchase didn’t complete',
        'Something went wrong reaching the store. Please try again in a moment.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (loading) return;
    setLoading(true);
    HapticsService.impactAsync('LIGHT');
    try {
      const restored = await freemium.restorePurchase();
      if (restored) {
        HapticsService.notificationAsync('SUCCESS');
        if (embedded) onDone?.();
        else navigation.goBack();
      } else {
        Alert.alert(
          'Nothing to restore',
          'We couldn’t find an active subscription on this account.',
        );
      }
    } catch {
      Alert.alert('Restore failed', 'Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const openLegal = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open link', 'Please try again later.'),
    );
  };

  return (
    <LinearGradient colors={Colors.celestialWash} style={styles.container}>
      {/* Close */}
      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + Spacing.sm }]}
        onPress={() => (embedded ? onDone?.() : navigation.goBack())}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={embedded ? 'Continue with the free plan' : 'Close'}
      >
        <Ionicons name="close" size={22} color={Colors.text.secondary} />
      </TouchableOpacity>

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.xxxl + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.inner, { opacity: enter, transform: [{ translateY }] }]}>
          {/* Header */}
          <Image
            source={require('../../assets/icon.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
          <Text style={styles.title}>Support Sakina</Text>
          <Text style={styles.subtitle}>
            A calmer heart shouldn&apos;t sit behind a wall. Your support keeps the Qur&apos;an,
            reminders and journeys free for everyone — and unlocks a little more for you.
          </Text>

          {/* ── Plan picker ── */}
          <View style={styles.plans}>
            {/* Annual */}
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
              onPress={() => {
                HapticsService.impactAsync('LIGHT');
                setSelectedPlan('yearly');
              }}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedPlan === 'yearly' }}
              accessibilityLabel={`Annual plan, ${pricing.yearlyPrice} per year${
                showSaveBadge ? `, save ${savePercent}%` : ''
              }`}
            >
              <View style={styles.planLeft}>
                <View style={[styles.radio, selectedPlan === 'yearly' && styles.radioActive]}>
                  {selectedPlan === 'yearly' && <View style={styles.radioDot} />}
                </View>
                <View>
                  <View style={styles.planLabelRow}>
                    <Text style={styles.planName}>Annual</Text>
                    {showSaveBadge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Save {savePercent}%</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.planNote}>Only {monthlyEquiv}/mo</Text>
                </View>
              </View>
              <Text style={[styles.planPrice, selectedPlan === 'yearly' && styles.planPriceActive]}>
                {pricing.yearlyPrice}/year
              </Text>
            </TouchableOpacity>

            {/* Monthly */}
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
              onPress={() => {
                HapticsService.impactAsync('LIGHT');
                setSelectedPlan('monthly');
              }}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedPlan === 'monthly' }}
              accessibilityLabel={`Monthly plan, ${pricing.monthlyPrice} per month`}
            >
              <View style={styles.planLeft}>
                <View style={[styles.radio, selectedPlan === 'monthly' && styles.radioActive]}>
                  {selectedPlan === 'monthly' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.planName}>Monthly</Text>
              </View>
              <Text
                style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceActive]}
              >
                {pricing.monthlyPrice}/month
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Features ── */}
          <Text style={styles.sectionLabel}>WHAT&apos;S INCLUDED</Text>
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureRow}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={f.icon} size={20} color={Colors.accent.primary} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.description}</Text>
                  {f.showThemePreview && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.themePreviewStrip}
                      contentContainerStyle={styles.themePreviewContent}
                    >
                      {THEME_PREVIEWS.map((theme) => (
                        <Image
                          key={theme.id}
                          source={theme.imageSource}
                          style={styles.themePreviewThumb}
                          resizeMode="cover"
                          accessibilityLabel={theme.name}
                        />
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Bottom spacer so last feature clears the fixed footer */}
          <View style={styles.scrollPad} />
        </Animated.View>
      </ScrollView>

      {/* ── Fixed footer ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity
          style={[styles.cta, loading && styles.ctaLoading]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Text style={styles.ctaText}>{loading ? 'Processing…' : ctaLabel}</Text>
        </TouchableOpacity>

        <Text style={styles.priceNote}>{priceNote}</Text>
        {/* Embedded (onboarding) has no back destination, so this existing line
            doubles as the skip affordance rather than adding a second element —
            a new button here would duplicate the copy and disturb the footer
            height that `scroll.paddingBottom` is already tuned to clear. */}
        {embedded ? (
          <TouchableOpacity
            onPress={onDone}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Continue with the free plan"
          >
            <Text style={styles.continueFreeNote}>
              Prefer to wait? Sakina stays fully usable free — no pressure.
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.continueFreeNote}>
            Prefer to wait? Sakina stays fully usable free — no pressure.
          </Text>
        )}

        <View style={styles.links}>
          <TouchableOpacity
            onPress={handleRestore}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Restore purchases"
          >
            <Text style={styles.linkText}>Restore Purchases</Text>
          </TouchableOpacity>
          {!!LEGAL_URLS.terms && (
            <>
              <Text style={styles.linkDot}>·</Text>
              <TouchableOpacity
                onPress={() => openLegal(LEGAL_URLS.terms)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="link"
                accessibilityLabel="Terms of Use"
              >
                <Text style={styles.linkText}>Terms</Text>
              </TouchableOpacity>
            </>
          )}
          {!!LEGAL_URLS.privacy && (
            <>
              <Text style={styles.linkDot}>·</Text>
              <TouchableOpacity
                onPress={() => openLegal(LEGAL_URLS.privacy)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="link"
                accessibilityLabel="Privacy Policy"
              >
                <Text style={styles.linkText}>Privacy</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  closeBtn: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.xs,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    paddingHorizontal: Spacing.xl,
    // Clears the fixed footer (CTA + price note + continueFreeNote + links).
    // Bumped from 180 when continueFreeNote was added — that line's height
    // wasn't previously accounted for, letting the last feature row hide
    // behind the now-taller footer at full scroll.
    paddingBottom: 200,
  },

  inner: {
    alignItems: 'center',
  },

  // ── Header ──
  appIcon: {
    width: 84,
    height: 84,
    borderRadius: BorderRadius.xl,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.hero,
    color: Colors.text.primary,
    letterSpacing: Typography.letterSpacing.normal,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  subtitle: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    lineHeight: Typography.sizes.body * 1.55,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },

  // ── Plan cards ──
  plans: {
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.glass.medium,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  planCardSelected: {
    backgroundColor: Colors.accent.muted,
    borderColor: Colors.accent.primary,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: Colors.accent.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent.primary,
  },
  planLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  planName: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  badge: {
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    fontWeight: '700',
    color: Colors.background.primary,
    letterSpacing: Typography.letterSpacing.normal,
  },
  planNote: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
    marginTop: 2,
  },
  planPrice: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: Colors.text.muted,
  },
  planPriceActive: {
    color: Colors.accent.primary,
  },

  // ── Features ──
  sectionLabel: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    fontWeight: '700',
    letterSpacing: Typography.letterSpacing.widest,
    color: Colors.text.muted,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  features: {
    width: '100%',
    backgroundColor: Colors.glass.medium,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.border,
    gap: Spacing.md,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  featureDesc: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    lineHeight: Typography.sizes.detail * 1.5,
    color: Colors.text.muted,
    marginTop: 2,
  },
  themePreviewStrip: {
    marginTop: Spacing.sm,
  },
  themePreviewContent: {
    gap: Spacing.xs,
  },
  themePreviewThumb: {
    width: 56,
    height: 72,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background.tertiary,
  },

  scrollPad: {
    height: Spacing.xxl,
  },

  // ── Fixed footer ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background.tertiary,
    borderTopWidth: 1,
    borderTopColor: Colors.glass.border,
  },
  cta: {
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    ...Elevation.low,
  },
  ctaLoading: {
    opacity: 0.6,
  },
  ctaText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    color: Colors.background.primary,
    letterSpacing: Typography.letterSpacing.normal,
  },
  priceNote: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  continueFreeNote: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  linkText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
  },
  linkDot: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
  },
});

export default SupportSakinaScreen;
