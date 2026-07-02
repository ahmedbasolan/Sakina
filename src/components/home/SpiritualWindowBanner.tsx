import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PrayerContext } from '../../types';
import { Colors, Typography, Spacing } from '../../theme/DesignSystem';
import { getSpiritualWindowName, getSpiritualActionText } from '../../utils/prayerContext';

/** Maps each of the 8 prayer contexts to a semantically appropriate Ionicons icon. */
const CONTEXT_ICONS: Record<PrayerContext, React.ComponentProps<typeof Ionicons>['name']> = {
  fajr_pre: 'moon',           // Tahajjud — deep night
  fajr_post: 'partly-sunny',  // After Fajr — morning light emerging
  dhuhr: 'sunny',             // Midday
  asr: 'partly-sunny-outline',// Afternoon
  maghrib_pre: 'cloudy-night-outline', // Pre-Maghrib — approach of night
  maghrib_post: 'moon-outline',// After Maghrib — dusk to night
  isha: 'moon',               // Night
  general: 'compass',         // No specific window
};

interface SpiritualWindowBannerProps {
  prayerContext: PrayerContext;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  onPress: () => void;
  /** True while the guidance fetch for this banner is in flight. */
  loading?: boolean;
}


export function SpiritualWindowBanner({ prayerContext, fadeAnim, slideAnim, onPress, loading = false }: SpiritualWindowBannerProps) {
  return (
    <Animated.View style={[styles.spiritualSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        disabled={loading}
        accessibilityRole="button"
        accessibilityState={{ busy: loading }}
        accessibilityLabel={`${getSpiritualWindowName(prayerContext)} — ${getSpiritualActionText(prayerContext)}`}
        accessibilityHint="Double tap to open the spiritual window screen"
      >
        <LinearGradient
          colors={[Colors.background.secondary, Colors.background.primary]}
          style={styles.spiritualBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerPreTitle}>Current Spiritual Window</Text>
              <Text style={styles.bannerTitle}>{getSpiritualWindowName(prayerContext)}</Text>
              <View style={styles.bannerCTA}>
                <Text style={styles.bannerCTAText}>{getSpiritualActionText(prayerContext)}</Text>
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.accent.primary} />
                ) : (
                  <Ionicons name="arrow-forward" size={14} color={Colors.accent.primary} />
                )}
              </View>
            </View>
            <View style={styles.bannerIconContainer}>
              <Ionicons
                name={CONTEXT_ICONS[prayerContext] ?? 'compass'}
                size={44}
                color="rgba(212, 175, 55, 0.28)"
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  spiritualSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: 24,
  },
  spiritualBanner: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.accent.glow,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerPreTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(212, 175, 55, 0.75)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  bannerTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: 19,
    color: Colors.text.primary,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  bannerCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerCTAText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  bannerIconContainer: {
    marginLeft: 16,
  },
});
