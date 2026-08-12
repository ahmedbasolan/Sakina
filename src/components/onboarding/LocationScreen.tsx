/**
 * Screen: Location — onboarding wrapper around the shared LocationCompass.
 *
 * Adds the full-screen starfield backdrop, safe-area padding, and the
 * onboarding-only behaviors: an explicit "Skip for now" escape hatch, and
 * warming Home's prayer-time + first-guidance caches the moment a location
 * is confirmed, so Home has nothing left to fetch when the user arrives.
 */
import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Spacing } from '../../theme/DesignSystem';
import { InteractiveStarfield } from './InteractiveStarfield';
import { LocationCompass } from '../LocationCompass';
import { UserLocation } from '../../services/locationStorage';
import PrayerTimesService from '../../services/prayerTimesService';
import { RotationEngine } from '../../services/rotationEngine';
import { fetchWindowGuidance } from '../../services/guidanceWindowFetch';
import { Mood } from '../../types';
import { logServiceError } from '../../services/errorLoggingService';

const STAR_POS = [
  { x: 0.09, y: 0.05, s: 2.5, d: 0 },
  { x: 0.89, y: 0.05, s: 2, d: 500 },
  { x: 0.17, y: 0.18, s: 1.5, d: 250 },
  { x: 0.83, y: 0.14, s: 2, d: 750 },
  { x: 0.50, y: 0.07, s: 1.5, d: 100 },
];

const ALL_MOODS: Mood[] = ['Overwhelmed', 'Sad', 'Angry', 'Tired', 'Lonely', 'Grateful', 'Hopeful', 'Guilty', 'Calm'];

/**
 * Warms Home's prayer-time cache and every mood's first-guidance cache so
 * nothing fetches live once onboarding hands off — not just the mood picked
 * in HeartCheckInScreen, since the user may tap a different card on Home.
 * Each mood's cache slot is independent (spec §3.2, one free verse per mood
 * per window), so pre-filling all of them doesn't cost anyone a refresh.
 *
 * Moods are warmed sequentially, not via Promise.all — RotationEngine keeps
 * shared, mutable session-dedup state (sessionShownAngles/lastSessionMood)
 * that resets per mood; concurrent calls could interleave and corrupt it.
 * This runs fully in the background, so the extra wall-clock time is free.
 */
async function warmHomeCaches(location: UserLocation): Promise<void> {
  try {
    const prayerService = PrayerTimesService.getInstance();
    const city = location.city || 'Dubai';
    const country = location.country || 'UAE';
    // When GPS coordinates are on file, timings are computed on-device by
    // adhan.js and the city lookup is pure redundancy — every consumer
    // (useHomeData, PrayerTimesScreen, notificationTopUpTask,
    // getCurrentPrayerContext, GuidanceScreen) prefers coordinates, so the
    // city cache it fills would never be read. It was also a liability: this
    // used to unconditionally fetch the city AND `await Promise.all(tasks)`,
    // so one failed api.aladhan.com request — a network call that did not
    // need to happen — rejected before the loop below and silently skipped
    // pre-warming ALL NINE moods. The user finished onboarding with a cold
    // Home and paid a live fetch on their first tap.
    //
    // `!== undefined`, not truthiness — a coordinate of exactly 0 is valid.
    const hasCoords = location.latitude !== undefined && location.longitude !== undefined;
    const warmTimings = hasCoords
      ? prayerService.getTimingsByCoordinates(location.latitude!, location.longitude!, country)
      : prayerService.getTimingsByCity(city, country);

    // allSettled, not all: prayer timings are a nice-to-have here and must
    // never gate the mood warming, which is the part the first tap depends on.
    await Promise.allSettled([warmTimings]);

    // The onboarding-picked mood is the most likely first tap — warm it first.
    const pickedMood = (await AsyncStorage.getItem('@onboarding_mood')) as Mood | null;
    const orderedMoods = pickedMood
      ? [pickedMood, ...ALL_MOODS.filter((m) => m !== pickedMood)]
      : ALL_MOODS;

    const engine = RotationEngine.getInstance();
    for (const mood of orderedMoods) {
      await fetchWindowGuidance(engine, mood);
    }
  } catch (error) {
    logServiceError('LocationScreen', 'warmHomeCaches', error instanceof Error ? error : new Error(String(error)));
  }
}

interface Props {
  isActive: boolean;
  onNext: () => void;
}

export default function LocationScreen({ onNext }: Props) {
  const insets = useSafeAreaInsets();

  // Skipping means no location was chosen — don't persist a default, but do
  // warm the caches under the same Dubai/UAE fallback the rest of the app
  // already uses for "no saved location", so Home still isn't cold.
  const handleSkip = () => {
    warmHomeCaches({ city: 'Dubai', country: 'UAE' });
    onNext();
  };

  return (
    <View style={styles.container}>
      <InteractiveStarfield positions={STAR_POS.map((p) => ({ ...p, y: p.y * 1.5 }))} />
      {/* Without this, the manual-search TextInput (rendered below the
          flex:1 compass) had nothing pushing it clear of the keyboard — the
          keyboard simply covered it. LocationPickerModal's bottom-sheet
          version of this same compass already wraps it the same way; this
          full-screen onboarding version never got it. behavior="height" on
          Android shrinks this container so the flex:1 compass area yields
          room to the input instead of the keyboard just overlapping it. */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LocationCompass
          fillHeight
          paddingTop={insets.top + 72}
          paddingBottom={Math.max(insets.bottom + Spacing.xxl, Spacing.xxxl)}
          showSkip
          onSkip={handleSkip}
          onResolved={(location) => { warmHomeCaches(location); }}
          onComplete={onNext}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoider: { flex: 1 },
});
