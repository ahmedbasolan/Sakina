import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PrayerContext } from '../../types';
import { Colors } from '../../theme/DesignSystem';

interface SpiritualWindowBannerProps {
  prayerContext: PrayerContext;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  onPress: () => void;
}

function getSpiritualWindowName(context: PrayerContext) {
  switch (context) {
    case 'fajr_pre': return 'The Deep Night (Tahajjud)';
    case 'fajr_post': return 'The Morning Light';
    case 'dhuhr': return 'The High Zenith';
    case 'asr': return 'The Golden Hour';
    case 'maghrib_pre': return 'The Approach of Night';
    case 'maghrib_post': return 'The Evening Glow';
    case 'isha': return 'The Peace of Night';
    default: return 'A Moment of Reflection';
  }
}

function getSpiritualActionText(context: PrayerContext) {
  switch (context) {
    case 'fajr_pre': return 'Guided Tahajjud Reflection';
    case 'fajr_post': return 'Morning Protection Adhkar';
    case 'dhuhr': return 'Mid-day Spiritual Break';
    case 'asr': return 'The Golden Hour Remembrance';
    case 'maghrib_pre': return 'Evening Protection Adhkar';
    case 'maghrib_post': return 'Post-Maghrib Gratitude';
    case 'isha': return 'Nightly Habit & Reflection';
    default: return 'Explore Guidance';
  }
}

export function SpiritualWindowBanner({ prayerContext, fadeAnim, slideAnim, onPress }: SpiritualWindowBannerProps) {
  return (
    <Animated.View style={[styles.spiritualSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
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
                <Ionicons name="arrow-forward" size={14} color="#D4A574" />
              </View>
            </View>
            <View style={styles.bannerIconContainer}>
              <Ionicons
                name={prayerContext === 'fajr_pre' || prayerContext === 'isha' ? 'moon' : 'sunny'}
                size={40}
                color="rgba(212, 165, 116, 0.2)"
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
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  spiritualBanner: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.15)',
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
    color: 'rgba(212, 165, 116, 0.7)',
    letterSpacing: 1,
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5EDE3',
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
    color: '#D4A574',
  },
  bannerIconContainer: {
    marginLeft: 16,
  },
});
