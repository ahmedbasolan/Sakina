# Location Picker Premium Visual Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `LocationPickerModal` from a plain centered-card modal into a premium bottom sheet — drag-to-dismiss, an elevated GPS action, glowing focus states, and calm per-row entrance motion — without changing its props, structure, or any handler logic.

**Architecture:** One new file (`LocationResultRow.tsx`, an animated/memoized `FlatList` row) plus a full-file rewrite of `LocationPickerModal.tsx`'s container (`Modal` → animated bottom sheet with `PanResponder` drag-to-dismiss) applied in one pass, followed by two smaller passes that restyle the GPS row / search field and the manual-entry fields / save button on top of that new shell.

**Tech Stack:** React Native `Animated` API (no Reanimated), `PanResponder`, existing `DesignSystem.ts` tokens, `useReduceMotion` hook. No test framework exists in this project (no Jest config, no `*.test.*` files) — verification is `npx tsc --noEmit -p tsconfig.json` after each task, plus a final manual on-device pass against the `CLAUDE.md` screen checklist.

This plan is a pure visual/motion layer on top of the already-shipped `2026-06-30-location-picker-redesign.md` structure — no changes to `cityData.ts`, `prayerTimesService.ts`, or any call site.

---

### Task 1: Extract `LocationResultRow` — animated, memoized result row

**Files:**
- Create: `src/components/LocationResultRow.tsx`
- Modify: `src/components/LocationPickerModal.tsx:1-24` (imports), `:242-266` (FlatList `renderItem` + separator style)

- [ ] **Step 1: Create the row component**

```tsx
// src/components/LocationResultRow.tsx
import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, Animations } from '../theme/DesignSystem';
import { useReduceMotion } from '../hooks/useReduceMotion';

interface LocationResultRowProps {
  city: string;
  country: string;
  index: number;
  onPress: () => void;
}

// Only the first 6 rows (index 0-5) get a staggered entrance — beyond that,
// a 30-result list would cascade for over a second, which reads as sluggish
// rather than premium. Rows past this render at rest immediately.
const STAGGER_ANIMATE_MAX_INDEX = 5;

export const LocationResultRow = React.memo(function LocationResultRow({
  city,
  country,
  index,
  onPress,
}: LocationResultRowProps) {
  const reduceMotion = useReduceMotion();
  const shouldAnimate = !reduceMotion && index <= STAGGER_ANIMATE_MAX_INDEX;

  const opacity = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(shouldAnimate ? 12 : 0)).current;
  const highlight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shouldAnimate) return;
    const delay = Animations.stagger.baseDelay + index * Animations.stagger.step;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: Animations.stagger.duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: Animations.stagger.duration,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    // Mount-only entrance — must not re-fire when the FlatList re-renders
    // this row for unrelated reasons (e.g. sibling state changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePressIn = () => {
    Animated.timing(highlight, {
      toValue: 1,
      duration: Animations.timing.micro,
      useNativeDriver: false,
    }).start();
  };
  const handlePressOut = () => {
    Animated.timing(highlight, {
      toValue: 0,
      duration: Animations.timing.micro,
      useNativeDriver: false,
    }).start();
  };

  const backgroundColor = highlight.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 235, 210, 0)', 'rgba(255, 235, 210, 0.04)'],
  });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.resultRow, { backgroundColor }]}>
          <Text style={styles.resultCity}>{city}</Text>
          <Text style={styles.resultCountry}>{country}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + Spacing.xs,
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
});
```

- [ ] **Step 2: Wire it into `LocationPickerModal.tsx`**

Add the import (after the `CITIES` import):

```tsx
import { CITIES } from '../data/cityData';
import { LocationResultRow } from './LocationResultRow';
```

Replace the inline `renderItem` and the separator style:

old:
```tsx
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
```

new:
```tsx
                      renderItem={({ item, index }) => (
                        <LocationResultRow
                          city={item.city}
                          country={item.country}
                          index={index}
                          onPress={() => handleSelect(item)}
                        />
                      )}
```

In the `styles` object, delete the now-unused `resultRow`, `resultCity`, `resultCountry` entries (moved into `LocationResultRow.tsx`) and update `separator`:

old:
```tsx
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
```

new:
```tsx
  separator: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    marginHorizontal: Spacing.xl,
  },
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/LocationResultRow.tsx src/components/LocationPickerModal.tsx
git commit -m "feat(location-picker): extract animated result row component"
```

---

### Task 2: Convert the modal shell into an animated bottom sheet with drag-to-dismiss

This task rewrites the container mechanics only — `Modal`/backdrop/sheet animation, close routing, and reduce-motion handling. The GPS row, search field, and manual-entry fields keep their **current** plain styling in this task; they're restyled in Tasks 3 and 4 on top of this new shell. Because nearly every line of the return statement moves (new wrapping `Animated.View`s, new backdrop, new pan-handler wrapper around the header), this task replaces the full file rather than patching fragments — a partial patch here would leave the file in a contradictory intermediate state.

**Files:**
- Modify: `src/components/LocationPickerModal.tsx` (full file)

- [ ] **Step 1: Replace the entire file**

```tsx
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduceMotion, screenHeight]);

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
            <View {...panResponder.panHandlers}>
              <View style={styles.handleBar} />
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
                </TouchableOpacity>
                <View style={styles.gpsDivider} />

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
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  gpsText: {
    fontSize: Typography.sizes.body,
    color: Colors.accent.primary,
    fontWeight: '600',
  },
  gpsTextMuted: {
    color: Colors.text.muted,
    fontWeight: '400',
  },
  gpsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Manual smoke check (device/simulator via Expo)**

Open the picker and confirm:
- Sheet slides up from the bottom on open, backdrop fades in.
- Tapping the backdrop (area outside the sheet) closes it.
- Dragging the handle/header area down past roughly a third of the sheet's height, or flicking down quickly, closes it; a small drag that's released snaps back open.
- The X button still closes it; selecting a city or using GPS still closes it (each via the same slide-down animation now, not an instant cut).
- With iOS/Android "Reduce Motion" enabled, the sheet appears/disappears without the slide (opacity only) — no crash, no stuck state.

- [ ] **Step 4: Commit**

```bash
git add src/components/LocationPickerModal.tsx
git commit -m "feat(location-picker): bottom sheet with drag-to-dismiss"
```

---

### Task 3: GPS hero row + search field focus glow

**Files:**
- Modify: `src/components/LocationPickerModal.tsx`

- [ ] **Step 1: Add the `useFocusGlow` helper**

Insert this module-level function between the `DRAG_CLOSE_VELOCITY` constant and the component declaration:

```tsx
/**
 * Animates a text-field container's border between resting and focused
 * states. Each call owns its own Animated.Value, so the search box and the
 * two manual-entry fields (added in Task 4) animate independently.
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
```

- [ ] **Step 2: Add hook calls inside the component**

old:
```tsx
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
```

new:
```tsx
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const searchGlow = useFocusGlow();
  const clearOpacity = useRef(new Animated.Value(0)).current;
```

Add an effect to fade the clear button, right after the existing `visible`-driven `useEffect` block:

```tsx
  useEffect(() => {
    Animated.timing(clearOpacity, {
      toValue: query.length > 0 ? 1 : 0,
      duration: Animations.timing.micro,
      useNativeDriver: true,
    }).start();
  }, [query.length > 0]);
```

- [ ] **Step 3: Restyle the GPS row and remove the divider**

old:
```tsx
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
                </TouchableOpacity>
                <View style={styles.gpsDivider} />

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
```

new:
```tsx
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
```

- [ ] **Step 4: Update styles**

old:
```tsx
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
```

new:
```tsx
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
```

old:
```tsx
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  gpsText: {
    fontSize: Typography.sizes.body,
    color: Colors.accent.primary,
    fontWeight: '600',
  },
  gpsTextMuted: {
    color: Colors.text.muted,
    fontWeight: '400',
  },
  gpsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
});
```

new:
```tsx
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
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 6: Manual smoke check**

Confirm: GPS row reads as a distinct card with a trailing chevron; tapping into the search field brightens its border, blurring dims it back; the clear (×) button fades in/out instead of popping.

- [ ] **Step 7: Commit**

```bash
git add src/components/LocationPickerModal.tsx
git commit -m "feat(location-picker): elevate GPS row, add search focus glow"
```

---

### Task 4: Manual-entry field glow + save button press feedback

**Files:**
- Modify: `src/components/LocationPickerModal.tsx`

- [ ] **Step 1: Add remaining hook calls**

old:
```tsx
  const searchGlow = useFocusGlow();
  const clearOpacity = useRef(new Animated.Value(0)).current;
```

new:
```tsx
  const searchGlow = useFocusGlow();
  const cityGlow = useFocusGlow();
  const countryGlow = useFocusGlow();
  const clearOpacity = useRef(new Animated.Value(0)).current;
  const saveScale = useRef(new Animated.Value(1)).current;
```

Add the press handlers, placed after `handleManualSave`:

```tsx
  const handleSavePressIn = () => {
    Animated.spring(saveScale, {
      toValue: 0.98,
      useNativeDriver: true,
      ...Animations.spring.gentle,
    }).start();
  };
  const handleSavePressOut = () => {
    Animated.spring(saveScale, {
      toValue: 1,
      useNativeDriver: true,
      ...Animations.spring.gentle,
    }).start();
  };
```

- [ ] **Step 2: Wire the manual-entry JSX**

old:
```tsx
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
```

new:
```tsx
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>City</Text>
                  <Animated.View style={[styles.inputContainer, { borderColor: cityGlow.borderColor }]}>
                    <Ionicons name="business-outline" size={18} color={Colors.accent.primary} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. London"
                      value={city}
                      onChangeText={setCity}
                      onFocus={cityGlow.onFocus}
                      onBlur={cityGlow.onBlur}
                      placeholderTextColor="rgba(245, 237, 227, 0.35)"
                    />
                  </Animated.View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Country</Text>
                  <Animated.View style={[styles.inputContainer, { borderColor: countryGlow.borderColor }]}>
                    <Ionicons name="earth-outline" size={18} color={Colors.accent.primary} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. United Kingdom"
                      value={country}
                      onChangeText={setCountry}
                      onFocus={countryGlow.onFocus}
                      onBlur={countryGlow.onBlur}
                      placeholderTextColor="rgba(245, 237, 227, 0.35)"
                    />
                  </Animated.View>
                </View>

                <Animated.View style={{ transform: [{ scale: saveScale }] }}>
                  <TouchableOpacity
                    onPress={handleManualSave}
                    onPressIn={handleSavePressIn}
                    onPressOut={handleSavePressOut}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
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
                </Animated.View>
```

- [ ] **Step 3: Update `inputContainer` style**

old:
```tsx
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
```

new:
```tsx
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.glass.light,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 5: Manual smoke check**

Switch to manual entry ("Enter manually →"). Confirm both fields glow gold on focus, and the Save Location button visibly compresses (~2%) while pressed and springs back on release.

- [ ] **Step 6: Commit**

```bash
git add src/components/LocationPickerModal.tsx
git commit -m "feat(location-picker): manual field glow + save button press feedback"
```

---

### Task 5: Full checklist pass + final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the project-wide typecheck one more time**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors anywhere in the project (confirms no other file referenced the deleted `resultRow`/`resultCity`/`resultCountry` styles).

- [ ] **Step 2: Walk the `CLAUDE.md` Screen Layout Checklist against the picker**

On a device or simulator via Expo:
1. Safe areas — the sheet's bottom content (manual form / list footer) isn't obscured by the home indicator; open on a notched-simulator profile if available.
2. Spacing — all values used are `Spacing`/`BorderRadius` tokens (no ad hoc numbers were introduced except the drag thresholds, which are gesture physics constants, not layout spacing).
3. One primary CTA — "Save Location" remains the only prominent CTA in manual mode; GPS row and search are equally-weighted entry points in search mode, matching the existing design intent.
4. Motion — sheet open/close and press feedback are within the `micro`–`normal` bands; reduce-motion disables the slide and glow transitions cleanly (re-check with the OS accessibility setting toggled on).
5. No new circular nav-icon containers were introduced (chevron and close icon are bare, per convention).

- [ ] **Step 3: Fix anything found, then stop**

If any check above fails, make the minimal fix in `LocationPickerModal.tsx` (or `LocationResultRow.tsx`), re-run Step 1, and commit as `fix(location-picker): <what was wrong>`. If everything passes, no further action — this plan is complete.
