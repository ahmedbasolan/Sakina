import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { saveUserLocation, formatLocation, UserLocation } from '../services/locationStorage';
import PrayerTimesService from '../services/prayerTimesService';
import { CITIES } from '../data/cityData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LocationPickerModalProps {
  visible: boolean;
  currentLocation?: UserLocation;
  onClose: () => void;
  onLocationSelected: (location: UserLocation) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  currentLocation,
  onClose,
  onLocationSelected,
}) => {
  const [mode, setMode] = useState<'search' | 'manual'>('search');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setMode('search');
      setQuery(currentLocation?.city ?? '');
      setCity('');
      setCountry('');
      setTimeout(() => searchRef.current?.focus(), 150);
    }
  }, [visible]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return CITIES.filter(
      (c) => c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q),
    ).slice(0, 30);
  }, [query]);

  const handleSelect = async (selected: { city: string; country: string }) => {
    const formatted = formatLocation({ city: selected.city, country: selected.country });
    await saveUserLocation(formatted);
    onLocationSelected(formatted);
    onClose();
  };

  const handleManualSave = async () => {
    if (!city.trim() || !country.trim()) {
      Alert.alert('Incomplete Information', 'Please provide both city and country.');
      return;
    }
    setIsLoading(true);
    try {
      const prayerService = PrayerTimesService.getInstance();
      await prayerService.getTimingsByCity(city.trim(), country.trim());
      const formatted = formatLocation({ city: city.trim(), country: country.trim() });
      await saveUserLocation(formatted);
      onLocationSelected(formatted);
      onClose();
    } catch {
      Alert.alert(
        'Location Error',
        `We couldn't find prayer times for ${city}, ${country}. Please check the spelling.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {mode === 'manual' ? (
                  <TouchableOpacity
                    onPress={() => setMode('search')}
                    style={styles.backButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="arrow-back" size={18} color={Colors.accent.primary} />
                    <Text style={styles.backText}>Search</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <Ionicons name="location-outline" size={20} color={Colors.accent.primary} />
                    <Text style={styles.headerTitle}>Where are you?</Text>
                  </>
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="rgba(245, 237, 227, 0.7)" />
              </TouchableOpacity>
            </View>

            {mode === 'search' ? (
              <>
                {/* Search input */}
                <View style={styles.searchContainer}>
                  <Ionicons name="search-outline" size={18} color="rgba(245, 237, 227, 0.4)" />
                  <TextInput
                    ref={searchRef}
                    style={styles.searchInput}
                    placeholder="Search city..."
                    value={query}
                    onChangeText={setQuery}
                    placeholderTextColor="rgba(245, 237, 227, 0.35)"
                    autoCorrect={false}
                    autoCapitalize="words"
                  />
                  {query.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={16} color="rgba(245, 237, 227, 0.4)" />
                    </TouchableOpacity>
                  )}
                </View>

                {query.trim() ? (
                  results.length > 0 ? (
                    <FlatList
                      data={results}
                      keyExtractor={(item, i) => `${item.city}-${item.country}-${i}`}
                      keyboardShouldPersistTaps="handled"
                      style={styles.list}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.resultRow}
                          onPress={() => handleSelect(item)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.resultCity}>{item.city}</Text>
                          <Text style={styles.resultCountry}>{item.country}</Text>
                        </TouchableOpacity>
                      )}
                      ItemSeparatorComponent={() => <View style={styles.separator} />}
                      ListFooterComponent={
                        <TouchableOpacity
                          style={styles.manualFooter}
                          onPress={() => setMode('manual')}
                        >
                          <Text style={styles.manualLink}>Can't find your city? Enter manually →</Text>
                        </TouchableOpacity>
                      }
                    />
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No results for "{query}"</Text>
                      <TouchableOpacity onPress={() => setMode('manual')}>
                        <Text style={styles.manualLink}>Enter manually →</Text>
                      </TouchableOpacity>
                    </View>
                  )
                ) : (
                  <Text style={styles.hint}>Start typing to search cities</Text>
                )}
              </>
            ) : (
              <View style={styles.form}>
                <Text style={styles.description}>
                  Enter your city and country for accurate prayer times. Stored privately on your device.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>City</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="business-outline" size={18} color={Colors.accent.primary} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. London"
                      value={city}
                      onChangeText={setCity}
                      placeholderTextColor="rgba(245, 237, 227, 0.35)"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Country</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="earth-outline" size={18} color={Colors.accent.primary} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. United Kingdom"
                      value={country}
                      onChangeText={setCountry}
                      placeholderTextColor="rgba(245, 237, 227, 0.35)"
                    />
                  </View>
                </View>

                <TouchableOpacity onPress={handleManualSave} disabled={isLoading} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#E8C84A', '#B8860B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.saveButton}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={Colors.background.secondary} />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Location</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.75,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.accent.muted,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h2,
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  backText: {
    fontSize: Typography.sizes.small,
    color: Colors.accent.primary,
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Colors.accent.muted,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
  },
  list: {
    flex: 1,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  resultCity: {
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
    flex: 1,
  },
  resultCountry: {
    fontSize: Typography.sizes.small,
    color: Colors.text.muted,
    marginLeft: Spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: Spacing.xl,
  },
  manualFooter: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  manualLink: {
    fontSize: Typography.sizes.small,
    color: Colors.accent.primary,
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.sizes.small,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  hint: {
    fontSize: Typography.sizes.small,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  form: {
    padding: Spacing.xl,
  },
  description: {
    fontSize: Typography.sizes.small,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: Colors.text.secondary,
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Colors.accent.muted,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
  },
  saveButton: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonText: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.background.secondary,
  },
});
