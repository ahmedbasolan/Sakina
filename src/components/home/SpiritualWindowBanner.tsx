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

/** A Quran verse thematically matched to each window, so the banner itself
 *  carries a piece of the guidance rather than only pointing to it.
 *  Full ayahs only (verified against api.alquran.cloud) — these used to be
 *  partial clauses, the same bug fixed in dailyVerseService.ts. The isha
 *  entry was swapped: An-Nur 24:36 is a clause from a much longer ayah about
 *  mosques, not a standalone verse about night — Al-Qadr 97:5 actually is. */
const CONTEXT_VERSES: Record<PrayerContext, { text: string; ref: string }> = {
  fajr_pre: { text: 'And from part of the night, pray with it as additional worship for you; it is expected that your Lord will resurrect you to a praised station.', ref: 'Al-Isra 17:79' },
  fajr_post: { text: 'Establish prayer at the decline of the sun until the darkness of the night, and the recitation of dawn. Indeed, the recitation of dawn is ever witnessed.', ref: 'Al-Isra 17:78' },
  dhuhr: { text: 'Indeed, I am Allah. There is no deity except Me, so worship Me and establish prayer for My remembrance.', ref: 'Ta-Ha 20:14' },
  asr: { text: 'By time, indeed mankind is in loss — except for those who believe, do righteous deeds, and urge one another to truth and urge one another to patience.', ref: 'Al-Asr 103:1-3' },
  maghrib_pre: { text: 'So be patient over what they say, and exalt your Lord with His praise before the rising of the sun and before its setting.', ref: 'Qaf 50:39' },
  maghrib_post: { text: 'And it is He who made the night for you as clothing, and sleep for rest, and made the day for rising up.', ref: 'Al-Furqan 25:47' },
  isha: { text: 'It is peace until the emergence of dawn.', ref: 'Al-Qadr 97:5' },
  general: { text: 'Recite what has been revealed to you of the Book, and establish prayer. Indeed, prayer prohibits immorality and wrongdoing, and the remembrance of Allah is greater. And Allah knows that which you do.', ref: 'Al-Ankabut 29:45' },
};

const FRIDAY_VERSE = {
  text: 'Praise be to Allah, who has sent down upon His Servant the Book and has not made therein any deviance.',
  ref: 'Al-Kahf 18:1',
};

interface SpiritualWindowBannerProps {
  prayerContext: PrayerContext;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  onPress: () => void;
  /** True while the guidance fetch for this banner is in flight. */
  loading?: boolean;
  /** Friday overrides the normal time-of-day window with Surah Al-Kahf —
   *  "whoever reads it on Friday will have light shining for him between
   *  the two Fridays" (al-Hakim), plus its protection from the Dajjal. */
  isFriday?: boolean;
}


export function SpiritualWindowBanner({ prayerContext, fadeAnim, slideAnim, onPress, loading = false, isFriday = false }: SpiritualWindowBannerProps) {
  const preTitle = isFriday ? "Jumu'ah" : 'Current Spiritual Window';
  const title = isFriday ? 'The Day of Light' : getSpiritualWindowName(prayerContext);
  const actionText = isFriday ? 'Read Surah Al-Kahf' : getSpiritualActionText(prayerContext);
  const iconName = isFriday ? 'sparkles' : (CONTEXT_ICONS[prayerContext] ?? 'compass');
  const verse = isFriday ? FRIDAY_VERSE : (CONTEXT_VERSES[prayerContext] ?? CONTEXT_VERSES.general);

  return (
    <Animated.View style={[styles.spiritualSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        disabled={loading}
        accessibilityRole="button"
        accessibilityState={{ busy: loading }}
        accessibilityLabel={`${title} — ${actionText}`}
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
              <Text style={styles.bannerPreTitle}>{preTitle}</Text>
              <Text style={styles.bannerTitle}>{title}</Text>
              {/* No numberOfLines cap — these are complete ayahs now, and
                  ellipsis-truncating Quran text is the same bug as showing a
                  partial ayah, just at render time instead of in the data. */}
              <Text style={styles.bannerVerse}>
                "{verse.text}" <Text style={styles.bannerVerseRef}>— {verse.ref}</Text>
              </Text>
              <View style={styles.bannerCTA}>
                <Text style={styles.bannerCTAText}>{actionText}</Text>
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.accent.primary} />
                ) : (
                  <Ionicons name="arrow-forward" size={14} color={Colors.accent.primary} />
                )}
              </View>
            </View>
            <View style={styles.bannerIconContainer}>
              <Ionicons
                name={iconName}
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
    marginBottom: 8,
  },
  bannerVerse: {
    fontFamily: Typography.fonts.serif,
    fontStyle: 'italic',
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  bannerVerseRef: {
    fontStyle: 'normal',
    color: Colors.accent.primary,
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
