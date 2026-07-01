import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
  Animated,
  PanResponder,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Animations } from '../theme/DesignSystem';
import * as Location from 'expo-location';
import { saveUserLocation, formatLocation, UserLocation } from '../services/locationStorage';
import PrayerTimesService from '../services/prayerTimesService';
import { CITIES } from '../data/cityData';
import { LocationResultRow } from './LocationResultRow';
import { useReduceMotion } from '../hooks/useReduceMotion';

interface LocationPickerModalProps {
  visible: boolean;
  currentLocation?: UserLocation;
  onClose: () => void;
  onLocationSelected: (location: UserLocation) => void;
}

const SHEET_MAX_HEIGHT_RATIO = 0.85;
const DRAG_CLOSE_THRESHOLD = 120;
const DRAG_CLOSE_VELOCITY = 1.2;

/**
 * Animates a text-field container's border between resting and focused
 * states. Each call owns its own Animated.Value, so the search box and the
 * two manual-entry fields (added in a later task) animate independently.
 */
function useFocusGlow() {
  const focusAnim = useRef(new Animated.Value(0)).current;
  const onFocus = () => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: Animations.timing.fast,
      useNativeDriver: false, // borderColor isn't transform/opacity
    }).start();
  };
  const onBlur = () => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: Animations.timing.fast,
      useNativeDriver: false,
    }).start();
  };
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.glass.border, 'rgba(212, 175, 55, 0.5)'],
  });
  return { borderColor, onFocus, onBlur };
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  currentLocation,
  onClose,
  onLocationSelected,
}) => {
  const { height: screenHeight } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const [mode, setMode] = useState<'search' | 'manual'>('search');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<TextInput>(null);
  const isSelectingRef = useRef(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'denied' | 'error'>('idle');

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const searchGlow = useFocusGlow();
  const clearOpacity = useRef(new Animated.Value(0)).current;

  const handleClose = () => {
    if (reduceMotion) {
      onClose();
      return;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: Animations.timing.fast,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: Animations.timing.fast,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  // PanResponder is created once via useRef, but must always invoke the
  // *latest* handleClose (which closes over reduceMotion/screenHeight) — route
  // through a ref so the gesture handler never calls a stale closure.
  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        gesture.dy > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DRAG_CLOSE_THRESHOLD || gesture.vy > DRAG_CLOSE_VELOCITY) {
          handleCloseRef.current();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            ...Animations.spring.gentle,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      setMode('search');
      setQuery(currentLocation?.city ?? '');
      setCity('');
      setCountry('');
      setGpsStatus('idle');
      setTimeout(() => searchRef.current?.focus(), 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Separate from the state-reset effect above so that a mid-session change to
  // reduceMotion or screenHeight (device rotation, toggling OS Reduce Motion
  // while the sheet is open) only replays the open animation — it must never
  // reset the user's in-progress search text or form fields.
  useEffect(() => {
    if (!visible) return;
    if (reduceMotion) {
      translateY.setValue(0);
      backdropOpacity.setValue(1);
    } else {
      translateY.setValue(screenHeight);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          ...Animations.spring.gentle,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: Animations.timing.normal,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduceMotion, screenHeight]);

  useEffect(() => {
    Animated.timing(clearOpacity, {
      toValue: query.length > 0 ? 1 : 0,
      duration: Animations.timing.micro,
      useNativeDriver: true,
    }).start();
  }, [query.length > 0]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return CITIES.filter(
      (c) => c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q),
    ).slice(0, 30);
  }, [query]);

  const handleSelect = async (selected: { city: string; country: string }) => {
    if (isSelectingRef.current) return;
    isSelectingRef.current = true;
    const formatted = formatLocation({ city: selected.city, country: selected.country });
    await saveUserLocation(formatted);
    onLocationSelected(formatted);
    handleClose();
  };

  const handleUseCurrentLocation = async () => {
    // iOS never re-shows the system prompt once denied — a second call to
    // requestForegroundPermissionsAsync() just silently resolves 'denied'
    // again. Route straight to Settings instead of repeating a dead-end request.
    if (gpsStatus === 'denied') {
      Linking.openSettings();
      return;
    }
    setGpsStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsStatus('denied');
        return;
      }
      // Try the cached last-known fix first — this returns immediately (no GPS
      // warm-up wait) and is what most apps (maps, weather, ride-hailing) use
      // for "use my location" flows. Only fall back to a fresh fix — at Low
      // accuracy, which resolves from cell/wifi in ~1-2s instead of waiting
      // for a GPS lock — if there's no recent cached position.
      let pos = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
      if (!pos) {
        pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 6000),
          ),
        ]);
      }
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const rawCity = geo?.city || geo?.district || geo?.subregion || 'Current Location';
      const rawCountry = geo?.isoCountryCode || '';
      const formatted = formatLocation({ city: rawCity, country: rawCountry });
      const locationWithCoords: UserLocation = {
        ...formatted,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      await saveUserLocation(locationWithCoords);
      onLocationSelected(locationWithCoords);
      handleClose();
    } catch {
      setGpsStatus('error');
    }
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
      handleClose();
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
          pointerEvents="none"
        >
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.content,
              { maxHeight: screenHeight * SHEET_MAX_HEIGHT_RATIO, transform: [{ translateY }] },
            ]}
          >
            <View style={styles.handleBar} {...panResponder.panHandlers} />
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
                onPress={handleClose}
                style={styles.closeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="rgba(245, 237, 227, 0.7)" />
              </TouchableOpacity>
            </View>

            {mode === 'search' ? (
              <>
                {/* GPS row */}
                <TouchableOpacity
                  style={styles.gpsRow}
                  onPress={handleUseCurrentLocation}
                  disabled={gpsStatus === 'loading'}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Use current location"
                >
                  <View style={styles.gpsRowLeft}>
                    {gpsStatus === 'loading' ? (
                      <ActivityIndicator size="small" color={Colors.accent.primary} />
                    ) : (
                      <Ionicons name="locate" size={18} color={Colors.accent.primary} />
                    )}
                    <Text
                      style={[
                        styles.gpsText,
                        (gpsStatus === 'denied' || gpsStatus === 'error') && styles.gpsTextMuted,
                      ]}
                    >
                      {gpsStatus === 'denied'
                        ? 'Location access denied — tap to open Settings'
                        : gpsStatus === 'error'
                        ? "Couldn't get location — search below"
                        : 'Use Current Location'}
                    </Text>
                  </View>
                  {gpsStatus !== 'loading' && (
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.18)" />
                  )}
                </TouchableOpacity>

                {/* Search input */}
                <Animated.View style={[styles.searchContainer, { borderColor: searchGlow.borderColor }]}>
                  <Ionicons name="search-outline" size={18} color="rgba(245, 237, 227, 0.4)" />
                  <TextInput
                    ref={searchRef}
                    style={styles.searchInput}
                    placeholder="Search city..."
                    value={query}
                    onChangeText={setQuery}
                    onFocus={searchGlow.onFocus}
                    onBlur={searchGlow.onBlur}
                    placeholderTextColor="rgba(245, 237, 227, 0.35)"
                    autoCorrect={false}
                    autoCapitalize="words"
                  />
                  <Animated.View
                    style={{ opacity: clearOpacity }}
                    pointerEvents={query.length > 0 ? 'auto' : 'none'}
                  >
                    <TouchableOpacity
                      onPress={() => setQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={16} color="rgba(245, 237, 227, 0.4)" />
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>

                {query.trim() ? (
                  results.length > 0 ? (
                    <FlatList
                      data={results}
                      keyExtractor={(item, i) => `${item.city}-${item.country}-${i}`}
                      keyboardShouldPersistTaps="handled"
                      style={styles.list}
                      renderItem={({ item, index }) => (
                        <LocationResultRow
                          city={item.city}
                          country={item.country}
                          index={index}
                          onPress={() => handleSelect(item)}
                        />
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
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    width: '100%',
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.accent.muted,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 235, 210, 0.2)',
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.glass.light,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
  },
  list: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
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
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.glass.medium,
    borderWidth: 1,
    borderColor: Colors.accent.muted,
    borderRadius: BorderRadius.lg,
  },
  gpsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
  },
  gpsText: {
    fontSize: Typography.sizes.body,
    color: Colors.accent.primary,
    fontWeight: '600',
    flexShrink: 1,
  },
  gpsTextMuted: {
    color: Colors.text.muted,
    fontWeight: '400',
  },
});
