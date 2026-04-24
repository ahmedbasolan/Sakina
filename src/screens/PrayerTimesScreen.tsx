import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getUserLocation, UserLocation } from '../services/locationStorage';
import PrayerTimesService, { PrayerTimesData } from '../services/prayerTimesService';
import { LocationPickerModal } from '../components/LocationPickerModal';
import NotificationService from '../services/notificationService';

export default function PrayerTimesScreen({ navigation }: { navigation: any }) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const fetchTimings = useCallback(async (loc: UserLocation) => {
    setIsLoading(true);
    try {
      const service = PrayerTimesService.getInstance();
      const data = await service.getTimingsByCity(loc.city, loc.country);
      setPrayerData(data);

      // Schedule notifications
      const notifService = NotificationService.getInstance();
      await notifService.schedulePrayerNotifications(data.timings, loc.city);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch prayer times. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const handleLocationSelected = (newLocation: UserLocation) => {
    setLocation(newLocation);
    fetchTimings(newLocation);
  };

  const prayerItems = prayerData
    ? [
        { name: 'Fajr', time: prayerData.timings.Fajr, type: 'Required' },
        { name: 'Sunrise', time: prayerData.timings.Sunrise, type: 'Special' },
        { name: 'Dhuhr', time: prayerData.timings.Dhuhr, type: 'Required' },
        { name: 'Asr', time: prayerData.timings.Asr, type: 'Required' },
        { name: 'Maghrib', time: prayerData.timings.Maghrib, type: 'Required' },
        { name: 'Isha', time: prayerData.timings.Isha, type: 'Required' },
      ]
    : [];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0B0F12', '#121A1F', '#0F1519']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#D4A574" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Prayer Times</Text>
            {location && (
              <TouchableOpacity
                style={styles.locationBadge}
                onPress={() => setShowLocationPicker(true)}
              >
                <Ionicons name="location" size={12} color="#D4A574" />
                <Text style={styles.locationText}>
                  {location.city}, {location.country}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => location && fetchTimings(location)}
            disabled={isLoading || !location}
          >
            <Ionicons name="refresh" size={24} color="#D4A574" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#D4A574" />
              <Text style={styles.loadingText}>Fetching sacred timings...</Text>
            </View>
          ) : prayerData ? (
            <>
              <View style={styles.dateCard}>
                <Text style={styles.hijriDate}>
                  {prayerData.date.hijri.day} {prayerData.date.hijri.month.en}{' '}
                  {prayerData.date.hijri.year} {prayerData.date.hijri.designation.abbreviated}
                </Text>
                <Text style={styles.gregorianDate}>{prayerData.date.readable}</Text>
              </View>

              <View style={styles.card}>
                {prayerItems.map((prayer, index) => (
                  <View
                    key={index}
                    style={[styles.prayerRow, index === prayerItems.length - 1 && styles.lastRow]}
                  >
                    <View>
                      <Text style={styles.prayerName}>{prayer.name}</Text>
                      <Text style={styles.prayerType}>{prayer.type}</Text>
                    </View>
                    <Text style={styles.prayerTime}>{prayer.time}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.infoBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#D4A574"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.infoText}>
                  Method: {prayerData.meta.method.name}. Timezone: {prayerData.meta.timezone}.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="location-outline" size={48} color="#9CA3AF" />
              <Text style={styles.errorText}>No location selected</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setShowLocationPicker(true)}
              >
                <Text style={styles.retryButtonText}>Set Location</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelected={handleLocationSelected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF5E9',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.2)',
  },
  locationText: {
    fontSize: 10,
    color: '#D4A574',
    fontWeight: '600',
    marginLeft: 4,
  },
  refreshButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(229, 221, 213, 0.5)',
    fontStyle: 'italic',
  },
  dateCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  hijriDate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4A574',
    marginBottom: 4,
  },
  gregorianDate: {
    fontSize: 14,
    color: 'rgba(229, 221, 213, 0.5)',
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  prayerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF5E9',
    marginBottom: 2,
  },
  prayerType: {
    fontSize: 12,
    color: 'rgba(229, 221, 213, 0.4)',
    fontWeight: '500',
  },
  prayerTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4A574',
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(212, 165, 116, 0.06)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.1)',
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(229, 221, 213, 0.5)',
    lineHeight: 18,
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: 'rgba(229, 221, 213, 0.5)',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#D4A574',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
