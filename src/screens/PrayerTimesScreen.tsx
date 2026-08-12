import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/DesignSystem';
import { getUserLocation, UserLocation } from '../services/locationStorage';
import PrayerTimesService, { PrayerTimesData, formatPrayerTime, formatCountdown, TimeFormat } from '../services/prayerTimesService';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { useSession } from '../context/AppContext';

const SERIF = Typography.fonts.serif;

// Each prayer's icon and a one-word descriptor for the row subtitle.
const PRAYER_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  Fajr: { icon: 'moon-outline', label: 'Dawn' },
  Sunrise: { icon: 'partly-sunny-outline', label: 'Sunrise' },
  Dhuhr: { icon: 'sunny-outline', label: 'Noon' },
  Asr: { icon: 'sunny-outline', label: 'Afternoon' },
  Maghrib: { icon: 'cloudy-night-outline', label: 'Sunset' },
  Isha: { icon: 'moon-outline', label: 'Night' },
};

export default function PrayerTimesScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const service = useMemo(() => PrayerTimesService.getInstance(), []);
  const { timeFormat, setTimeFormat } = useSession();

  const [location, setLocation] = useState<UserLocation | null>(null);
  const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  // Ticks every minute so the live countdown / next-prayer highlight stay fresh.
  const [now, setNow] = useState(Date.now());
  // Bumped on every fetchTimings call so a slower, older request (e.g. a
  // city-name lookup) can detect it's been superseded by a newer one (e.g. a
  // faster coordinate lookup from re-opening the location picker) and skip
  // applying its stale result instead of overwriting the current location's
  // correct prayer times.
  const requestIdRef = useRef(0);

  const fetchTimings = useCallback(
    async (loc: UserLocation) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      try {
        let data: PrayerTimesData;
        // `!== undefined`, not truthiness — a coordinate of exactly 0 is
        // valid (lon 0 covers Greenwich and Accra; lat 0 covers Quito and
        // Kampala), and truthiness silently sent those users to the network
        // city lookup instead of the on-device calculation. Every other call
        // site already guards this way.
        if (loc.latitude !== undefined && loc.longitude !== undefined) {
          data = await service.getTimingsByCoordinates(loc.latitude, loc.longitude, loc.country);
        } else {
          data = await service.getTimingsByCity(loc.city, loc.country);
        }
        if (requestId !== requestIdRef.current) return;
        setPrayerData(data);
      } catch (_error) {
        if (requestId !== requestIdRef.current) return;
        Alert.alert(
          'Prayer times unavailable',
          'We could not reach the prayer-time service. Check your connection and try again.',
        );
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [service],
  );

  useEffect(() => {
    const init = async () => {
      const savedLocation = await getUserLocation();
      if (savedLocation) {
        setLocation(savedLocation);
        fetchTimings(savedLocation);
      } else {
        setIsLoading(false);
        setShowLocationPicker(true);
      }
    };
    init();
  }, [fetchTimings]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const handleLocationSelected = (newLocation: UserLocation) => {
    setLocation(newLocation);
    fetchTimings(newLocation);
  };

  // Recomputed each minute (now is a dep) — getNextPrayerInfo reads the clock.
  const nextInfo = useMemo(
    () => (prayerData ? service.getNextPrayerInfo(prayerData.timings) : null),
    [prayerData, service, now],
  );

  // getNextPrayerInfo excludes Sunrise (not a salah) so the home screen shows
  // the next salah correctly. For this screen we also want to highlight Sunrise
  // when the user is in the post-Fajr window, so we compute it separately.
  const sunriseNextInfo = useMemo(() => {
    if (!prayerData) return null;
    const currentTime = new Date().getHours() * 60 + new Date().getMinutes();
    const fajr = service.parseTimeToMinutes(prayerData.timings.Fajr);
    const sunrise = service.parseTimeToMinutes(prayerData.timings.Sunrise);
    if (currentTime >= fajr && currentTime < sunrise) {
      return {
        name: 'Sunrise',
        time: prayerData.timings.Sunrise,
        minutesRemaining: sunrise - currentTime,
      };
    }
    return null;
  }, [prayerData, now]);

  // What to show in the hero card: Sunrise takes priority when it's the next event.
  const displayNext = sunriseNextInfo ?? nextInfo;
  const countdown = displayNext ? formatCountdown(displayNext.minutesRemaining) : '';

  const prayerItems = prayerData
    ? (['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((name) => ({
        name,
        time: prayerData.timings[name],
      }))
    : [];

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.celestialWash} style={styles.gradient}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={Colors.accent.primary} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Prayer Times</Text>
            {location && (
              <TouchableOpacity
                style={styles.locationBadge}
                onPress={() => setShowLocationPicker(true)}
                accessibilityRole="button"
                accessibilityLabel="Change location"
              >
                <Ionicons name="location-outline" size={12} color={Colors.accent.primary} />
                <Text style={styles.locationText}>
                  {location.city}, {location.country}
                </Text>
                <Ionicons name="chevron-down" size={11} color={Colors.accent.primary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => location && fetchTimings(location)}
            disabled={isLoading || !location}
            accessibilityRole="button"
            accessibilityLabel="Refresh"
          >
            <Ionicons name="refresh" size={20} color={Colors.accent.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xxxl }]}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.accent.primary} />
              <Text style={styles.loadingText}>Fetching sacred timings…</Text>
            </View>
          ) : prayerData ? (
            <>
              {/* Next-prayer hero */}
              {displayNext && (
                <LinearGradient
                  colors={['#1A1408', '#0F1A2A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.nextCard}
                >
                  <Text style={styles.nextLabel}>{sunriseNextInfo ? 'NEXT EVENT' : 'NEXT PRAYER'}</Text>
                  <Text style={styles.nextName}>{displayNext.name}</Text>
                  <View style={styles.nextRow}>
                    <Text style={styles.nextTime}>{formatPrayerTime(displayNext.time, timeFormat)}</Text>
                    <View style={styles.nextDot} />
                    <Text style={styles.nextCountdown}>in {countdown}</Text>
                  </View>
                </LinearGradient>
              )}

              {/* Hijri / Gregorian date */}
              <View style={styles.dateCard}>
                <Text style={styles.hijriDate}>
                  {prayerData.date.hijri.day} {prayerData.date.hijri.month.en}{' '}
                  {prayerData.date.hijri.year} {prayerData.date.hijri.designation.abbreviated}
                </Text>
                <Text style={styles.gregorianDate}>{prayerData.date.readable}</Text>
              </View>

              {/* 12h / 24h clock-format toggle */}
              <View style={styles.formatToggleRow}>
                <View style={styles.formatToggle}>
                  {(['24h', '12h'] as TimeFormat[]).map((f) => {
                    const active = timeFormat === f;
                    return (
                      <TouchableOpacity
                        key={f}
                        onPress={() => setTimeFormat(f)}
                        style={[styles.formatOption, active && styles.formatOptionActive]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={f === '24h' ? '24-hour clock' : '12-hour clock'}
                      >
                        <Text style={[styles.formatOptionText, active && styles.formatOptionTextActive]}>
                          {f === '24h' ? '24H' : '12H'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Prayer list */}
              <View style={styles.card}>
                {prayerItems.map((prayer, index) => {
                  const isNext = prayer.name === 'Sunrise'
                    ? !!sunriseNextInfo
                    : nextInfo?.name === prayer.name;
                  const meta = PRAYER_META[prayer.name];
                  return (
                    <View
                      key={prayer.name}
                      style={[
                        styles.prayerRow,
                        index === prayerItems.length - 1 && styles.lastRow,
                        isNext && styles.prayerRowActive,
                      ]}
                    >
                      <View style={styles.prayerLeft}>
                        <Ionicons
                          name={meta.icon}
                          size={18}
                          color={isNext ? Colors.accent.primary : 'rgba(176, 196, 215, 0.6)'}
                        />
                        <View>
                          <Text style={[styles.prayerName, isNext && styles.prayerNameActive]}>
                            {prayer.name}
                          </Text>
                          <Text style={styles.prayerType}>{isNext ? `in ${countdown}` : meta.label}</Text>
                        </View>
                      </View>
                      <Text style={[styles.prayerTime, isNext && styles.prayerTimeActive]}>
                        {formatPrayerTime(prayer.time, timeFormat)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Method / timezone */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.accent.primary} />
                <Text style={styles.infoText}>
                  {prayerData.meta.method.name} · {prayerData.meta.timezone}
                </Text>
              </View>

              {/* Privacy note */}
              <View style={styles.privacyRow}>
                <Ionicons name="lock-closed-outline" size={13} color="rgba(176, 196, 215, 0.6)" />
                <Text style={styles.privacyText}>
                  {location?.latitude
                    ? 'Your location was auto-detected and stored only on this device.'
                    : 'Your location is set manually and stored only on this device.'}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="location-outline" size={44} color="rgba(176, 196, 215, 0.6)" />
              <Text style={styles.errorText}>No location set</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setShowLocationPicker(true)}
                accessibilityRole="button"
                accessibilityLabel="Set location"
              >
                <Text style={styles.retryButtonText}>Set Location</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      <LocationPickerModal
        visible={showLocationPicker}
        currentLocation={location ?? undefined}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelected={handleLocationSelected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },

  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: SERIF,
    fontSize: 22,
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.10)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    marginTop: 5,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.20)',
  },
  locationText: {
    fontSize: 11,
    color: Colors.accent.primary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    flexGrow: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 120,
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: 15,
    color: Colors.text.muted,
    fontStyle: 'italic',
  },

  // Next-prayer hero
  nextCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
    marginBottom: Spacing.xl,
  },
  nextLabel: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    color: Colors.accent.primary,
    marginBottom: Spacing.sm,
  },
  nextName: {
    fontFamily: SERIF,
    fontSize: 34,
    color: Colors.text.primary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nextTime: {
    fontSize: 15,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  nextDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(176, 196, 215, 0.5)',
  },
  nextCountdown: {
    fontSize: 15,
    color: Colors.accent.primary,
    fontWeight: '700',
  },

  dateCard: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  hijriDate: {
    fontFamily: SERIF,
    fontSize: 18,
    color: Colors.accent.primary,
    marginBottom: 3,
  },
  gregorianDate: {
    fontSize: 13,
    color: Colors.text.muted,
  },

  formatToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.md,
  },
  formatToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.18)',
  },
  formatOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  formatOptionActive: {
    backgroundColor: Colors.accent.primary,
  },
  formatOptionText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.text.muted,
  },
  formatOptionTextActive: {
    color: Colors.background.secondary,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  prayerRowActive: {
    borderBottomColor: 'transparent',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  prayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  prayerName: {
    fontFamily: SERIF,
    fontSize: 17,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  prayerNameActive: {
    color: Colors.accent.primary,
  },
  prayerType: {
    fontSize: 12,
    color: Colors.text.muted,
  },
  prayerTime: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  prayerTimeActive: {
    color: Colors.accent.primary,
  },

  infoBox: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.10)',
  },
  infoText: {
    fontSize: 13,
    color: Colors.text.muted,
    flex: 1,
  },

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  privacyText: {
    fontSize: 12,
    color: 'rgba(176, 196, 215, 0.6)',
    textAlign: 'center',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: 16,
    color: Colors.text.muted,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.background.secondary,
    fontWeight: '700',
    fontSize: 15,
  },
});
