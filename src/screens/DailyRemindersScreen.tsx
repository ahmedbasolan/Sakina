import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HapticsService } from '../services/hapticsService';
import NotificationService from '../services/notificationService';
import { topUpScheduledNotifications } from '../services/notificationTopUpTask';
import { logServiceError } from '../services/errorLoggingService';
import { needsExactAlarmPermission, openExactAlarmSettings } from '../services/exactAlarmPermission';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/DesignSystem';
import { useReduceMotion } from '../hooks/useReduceMotion';

// Shrunk from 240 — at that size the clock alone consumed roughly a third of
// screen height, pushing the three reminder toggles and the Set Reminder
// button off the bottom of the viewport on most devices.
const CLOCK_SIZE = 172;
const MERIDIEM_OPTIONS = ['AM', 'PM'] as const;
const CLOCK_RADIUS = CLOCK_SIZE / 2;
const MINUTE_HAND_LENGTH = CLOCK_RADIUS * 0.75;
const HOUR_HAND_LENGTH = CLOCK_RADIUS * 0.45;

interface DailyRemindersScreenProps {
  onBack?: () => void;
}

export default function DailyRemindersScreen({ onBack }: DailyRemindersScreenProps) {
  const navigation = useNavigation();
  const handleBack = onBack || (() => navigation.goBack());
  const insets = useSafeAreaInsets();
  const notificationService = NotificationService.getInstance();

  const [hour, setHour] = useState(5);
  const [minute, setMinute] = useState(30);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [isEnabled, setIsEnabled] = useState(false);
  const [prayerEnabled, setPrayerEnabled] = useState(true);
  const [spiritualEnabled, setSpiritualEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedTime, setSavedTime] = useState<string | null>(null);

  const hourHandRotation = useRef(new Animated.Value(0)).current;
  const minuteHandRotation = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const starPulse = useRef(new Animated.Value(1)).current;
  const isMounted = useRef(true);
  const isToggling = useRef(false);
  const isPrayerToggling = useRef(false);
  const isSpiritualToggling = useRef(false);
  const reduceMotion = useReduceMotion();

  // Twinkling constellation refs (8 dim dots)
  const twinkleAnims = useRef(Array.from({ length: 8 }, () => new Animated.Value(0.2))).current;

  // Starburst animation refs
  const starburstScale = useRef(new Animated.Value(0)).current;
  const starburstOpacity = useRef(new Animated.Value(0)).current;
  const starburstRotation = useRef(new Animated.Value(0)).current;

  // Unmount guard for async animation callbacks
  useEffect(() => () => { isMounted.current = false; }, []);

  // Pulsing star animation
  useEffect(() => {
    if (reduceMotion) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(starPulse, {
          toValue: 1.4,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(starPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [starPulse, reduceMotion]);

  // Twinkling constellation animation
  useEffect(() => {
    if (reduceMotion) return;
    const twinkle = () => {
      const randomIndex = Math.floor(Math.random() * twinkleAnims.length);
      const targetOpacity = Math.random() * 0.5 + 0.1; // 0.1 to 0.6
      Animated.sequence([
        Animated.timing(twinkleAnims[randomIndex], {
          toValue: targetOpacity + 0.4,
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.timing(twinkleAnims[randomIndex], {
          toValue: targetOpacity,
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
      ]).start();
    };
    const interval = setInterval(twinkle, 600);
    return () => clearInterval(interval);
  }, [twinkleAnims, reduceMotion]);

  // Load saved settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Update clock hands when time changes
  useEffect(() => {
    // Hour hand: 30 degrees per hour (12h clock) + 0.5 degrees per minute
    const hourDegrees = (hour % 12) * 30 + minute * 0.5;
    // Minute hand: 6 degrees per minute
    const minuteDegrees = minute * 6;

    Animated.parallel([
      Animated.spring(hourHandRotation, {
        toValue: hourDegrees,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }),
      Animated.spring(minuteHandRotation, {
        toValue: minuteDegrees,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }),
    ]).start();
  }, [hour, minute, hourHandRotation, minuteHandRotation]);

  const loadSettings = async () => {
    try {
      const [settings, prayerOn, spiritualOn] = await Promise.all([
        notificationService.getSettings(),
        notificationService.getPrayerEnabled(),
        notificationService.getSpiritualEnabled(),
      ]);
      const { time, period: savedPeriod } = notificationService.formatTime(
        settings.hour,
        settings.minute,
      );
      const [h, m] = time.split(':').map(Number);
      setHour(h);
      setMinute(m);
      setPeriod(savedPeriod);
      setIsEnabled(settings.enabled);
      setPrayerEnabled(prayerOn);
      setSpiritualEnabled(spiritualOn);
      if (settings.enabled) {
        setSavedTime(`${time} ${savedPeriod}`);
      }
    } catch (error) {
      logServiceError('DailyRemindersScreen', 'loadSettings', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const playSuccessAnimation = () => {
    setShowSuccess(true);

    // Reset starburst values
    starburstScale.setValue(0);
    starburstOpacity.setValue(1);
    starburstRotation.setValue(0);

    // Play starburst effect
    Animated.parallel([
      Animated.timing(starburstScale, {
        toValue: 3,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(starburstOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(starburstRotation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Original success animation
    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(successScale, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(successOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => { if (isMounted.current) setShowSuccess(false); });
      }, 1500);
    });
  };

  // Time control functions
  const incrementHour = () => {
    HapticsService.impactAsync('LIGHT');
    setHour((h) => (h === 12 ? 1 : h + 1));
  };

  const decrementHour = () => {
    HapticsService.impactAsync('LIGHT');
    setHour((h) => (h === 1 ? 12 : h - 1));
  };

  const incrementMinute = () => {
    HapticsService.impactAsync('LIGHT');
    setMinute((m) => {
      if (m >= 55) {
        incrementHour();
        return 0;
      }
      return m + 5;
    });
  };

  const decrementMinute = () => {
    HapticsService.impactAsync('LIGHT');
    setMinute((m) => {
      if (m <= 0) {
        decrementHour();
        return 55;
      }
      return m - 5;
    });
  };

  const handleOpenExactAlarmSettings = () => {
    HapticsService.impactAsync('LIGHT');
    openExactAlarmSettings().catch((error) =>
      logServiceError(
        'DailyRemindersScreen',
        'openExactAlarmSettings',
        error instanceof Error ? error : new Error(String(error)),
      ),
    );
  };

  const showPermissionAlert = () => {
    Alert.alert(
      'Permission Required',
      'Please enable notifications in your device settings to receive reminders.',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  };

  const handleSetReminder = async () => {
    setIsSaving(true);
    try {
      const { hour: hour24, minute: min } = notificationService.parseTimeInput(hour, minute, period);
      const success = await notificationService.scheduleReminder(hour24, min);

      if (success) {
        setIsEnabled(true);
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
        setSavedTime(timeStr);
        playSuccessAnimation();
      } else {
        showPermissionAlert();
      }
    } catch (error) {
      // Was silently discarding the real error — swap for the actual cause so
      // device logs show what failed instead of just "please try again".
      logServiceError('DailyRemindersScreen', 'handleSetReminder', error instanceof Error ? error : new Error(String(error)));
      Alert.alert('Reminder not saved', 'We could not set that reminder. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async () => {
    if (isToggling.current) return;
    isToggling.current = true;
    try {
      const newValue = !isEnabled;
      setIsEnabled(newValue);
      if (!newValue) await notificationService.cancelReminder();
    } finally {
      isToggling.current = false;
    }
  };

  const handlePrayerToggle = async () => {
    if (isPrayerToggling.current) return;
    isPrayerToggling.current = true;
    try {
      const newValue = !prayerEnabled;
      // Enabling requires OS permission. The top-up below deliberately never
      // prompts (it's shared with the headless background task), so prompt
      // here — a foreground settings screen is exactly the right place. If
      // denied, leave the toggle off and point at device settings rather
      // than silently doing nothing.
      if (newValue && !(await notificationService.requestPermissions())) {
        showPermissionAlert();
        return;
      }
      setPrayerEnabled(newValue);
      await notificationService.setPrayerEnabled(newValue);
      // Enabling only writes the flag — without an immediate top-up nothing
      // is scheduled until the next Home visit or 12-hour background run,
      // so the toggle silently did nothing for hours.
      if (newValue) {
        topUpScheduledNotifications().catch((error) =>
          logServiceError(
            'DailyRemindersScreen',
            'prayerToggleTopUp',
            error instanceof Error ? error : new Error(String(error)),
          ),
        );
      }
    } finally {
      isPrayerToggling.current = false;
    }
  };

  const handleSpiritualToggle = async () => {
    if (isSpiritualToggling.current) return;
    isSpiritualToggling.current = true;
    try {
      const newValue = !spiritualEnabled;
      if (newValue && !(await notificationService.requestPermissions())) {
        showPermissionAlert();
        return;
      }
      setSpiritualEnabled(newValue);
      await notificationService.setSpiritualEnabled(newValue);
      if (newValue) {
        topUpScheduledNotifications().catch((error) =>
          logServiceError(
            'DailyRemindersScreen',
            'spiritualToggleTopUp',
            error instanceof Error ? error : new Error(String(error)),
          ),
        );
      }
    } finally {
      isSpiritualToggling.current = false;
    }
  };

  const renderClockElements = () => {
    const elements: React.ReactNode[] = [];

    // Cardinal positions with Roman numerals - converting HTML % to pixels
    // Based on CLOCK_SIZE = 340
    const cardinals = [
      {
        num: 12,
        label: 'XII',
        pointTop: CLOCK_SIZE * 0.08,
        pointLeft: CLOCK_SIZE * 0.5,
        labelTop: CLOCK_SIZE * 0.15,
        labelLeft: CLOCK_SIZE * 0.5,
      },
      {
        num: 3,
        label: 'III',
        pointTop: CLOCK_SIZE * 0.5,
        pointLeft: CLOCK_SIZE * 0.92,
        labelTop: CLOCK_SIZE * 0.5,
        labelLeft: CLOCK_SIZE * 0.85,
      },
      {
        num: 6,
        label: 'VI',
        pointTop: CLOCK_SIZE * 0.92,
        pointLeft: CLOCK_SIZE * 0.5,
        labelTop: CLOCK_SIZE * 0.85,
        labelLeft: CLOCK_SIZE * 0.5,
      },
      {
        num: 9,
        label: 'IX',
        pointTop: CLOCK_SIZE * 0.5,
        pointLeft: CLOCK_SIZE * 0.08,
        labelTop: CLOCK_SIZE * 0.5,
        labelLeft: CLOCK_SIZE * 0.15,
      },
    ];

    // Non-cardinal constellation points - converting HTML % to pixels
    const nonCardinals = [
      { top: CLOCK_SIZE * 0.134, left: CLOCK_SIZE * 0.71 },
      { top: CLOCK_SIZE * 0.29, left: CLOCK_SIZE * 0.866 },
      { top: CLOCK_SIZE * 0.71, left: CLOCK_SIZE * 0.866 },
      { top: CLOCK_SIZE * 0.866, left: CLOCK_SIZE * 0.71 },
      { top: CLOCK_SIZE * 0.866, left: CLOCK_SIZE * 0.29 },
      { top: CLOCK_SIZE * 0.71, left: CLOCK_SIZE * 0.134 },
      { top: CLOCK_SIZE * 0.29, left: CLOCK_SIZE * 0.134 },
      { top: CLOCK_SIZE * 0.134, left: CLOCK_SIZE * 0.29 },
    ];

    // Add cardinal constellation points and labels
    cardinals.forEach((c) => {
      elements.push(
        <View
          key={`point-${c.num}`}
          style={[styles.constellationPoint, { top: c.pointTop, left: c.pointLeft }]}
        />,
      );
      elements.push(
        <Text
          key={`label-${c.num}`}
          style={[styles.constellationLabel, { top: c.labelTop, left: c.labelLeft }]}
        >
          {c.label}
        </Text>,
      );
    });

    // Add non-cardinal constellation points with twinkling
    nonCardinals.forEach((pos, idx) => {
      elements.push(
        <Animated.View
          key={`dot-${idx}`}
          style={[
            styles.constellationPointDim,
            { top: pos.top, left: pos.left, opacity: twinkleAnims[idx] },
          ]}
        />,
      );
    });

    return elements;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent.primary} />
      </View>
    );
  }

  return (
    <>
      <LinearGradient
        colors={Colors.celestialWash}
        style={styles.container}
      >
        {/* Ambient glow — a soft top-down gold wash, same technique as the
            Guidance/journey screens' washAccent, instead of a flat translucent
            circle (which reads as a muddy olive blob when a low-alpha gold
            sits directly over the near-black corner of the celestial wash). */}
        <LinearGradient
          colors={[`${Colors.accent.primary}22`, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.lg) }]}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Main content — scrolls as a safety net on shorter devices instead
            of clipping the last toggle card / Set Reminder button off-screen,
            though everything now fits without scrolling on typical devices. */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.eyebrow}>DAILY GUIDANCE REMINDER</Text>
            <Text style={styles.title}>Set Reminder</Text>
            <Text style={styles.subtitle}>When should your daily check-in arrive?</Text>
          </View>

          {/* Clock Row: Hour controls | Clock + AM/PM | Minute controls */}
          <View style={styles.clockRow}>
            {/* Hour controls - Left side. Bare chevrons with a generous
                hitSlop instead of a bordered/glowing circular button — per
                the app's icon rule, nav/stepper affordances stay unwrapped. */}
            <View style={styles.sideControlGroup}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={incrementHour}
                hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
                accessibilityRole="button"
                accessibilityLabel="Increase hour"
              >
                <Ionicons name="chevron-up" size={20} color={Colors.accent.primary} />
              </TouchableOpacity>
              <Text style={styles.timeLabel}>Hour</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={decrementHour}
                hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
                accessibilityRole="button"
                accessibilityLabel="Decrease hour"
              >
                <Ionicons name="chevron-down" size={20} color={Colors.accent.primary} />
              </TouchableOpacity>
            </View>

            {/* Clock + AM/PM — grouped in a column so the toggle sits directly
                under the clock face in normal flow instead of breaking out of
                the circle with negative top/bottom offsets (that overflow used
                to collide with the subtitle above and land disconnected below). */}
            <View style={styles.clockColumn}>
              <View style={styles.clockContainer}>
                {/* Clock constellation elements */}
                {renderClockElements()}

                {/* Minute hand (Long) with glow endpoint */}
                <Animated.View
                  style={[
                    styles.handContainer,
                    {
                      transform: [
                        {
                          rotate: minuteHandRotation.interpolate({
                            inputRange: [0, 360],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={[styles.clockHand, styles.minuteHand]}>
                    <Animated.View style={[styles.handGlow, { transform: [{ scale: starPulse }] }]} />
                  </View>
                </Animated.View>

                {/* Hour hand (Short) with glow endpoint */}
                <Animated.View
                  style={[
                    styles.handContainer,
                    {
                      transform: [
                        {
                          rotate: hourHandRotation.interpolate({
                            inputRange: [0, 360],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={[styles.clockHand, styles.hourHand]}>
                    <Animated.View style={[styles.handGlow, { transform: [{ scale: starPulse }] }]} />
                  </View>
                </Animated.View>

                {/* Center dot */}
                <View style={styles.clockCenter} />

                {/* Starburst effect */}
                <Animated.View
                  style={[
                    styles.starburst,
                    {
                      opacity: starburstOpacity,
                      transform: [
                        { scale: starburstScale },
                        {
                          rotate: starburstRotation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '180deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                />

                {/* Time display */}
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeText}>
                    {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
                  </Text>
                </View>
              </View>

              {/* AM/PM segmented pill — contained, in normal flow beneath the clock */}
              <View style={styles.meridiemSegment}>
                {MERIDIEM_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.meridiemOption, period === option && styles.meridiemOptionActive]}
                    onPress={() => {
                      HapticsService.impactAsync('MEDIUM');
                      setPeriod(option);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={option}
                    accessibilityState={{ selected: period === option }}
                  >
                    <Text style={[styles.meridiemText, period === option && styles.meridiemActiveText]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Minute controls - Right side */}
            <View style={styles.sideControlGroup}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={incrementMinute}
                hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
                accessibilityRole="button"
                accessibilityLabel="Increase minute"
              >
                <Ionicons name="chevron-up" size={20} color={Colors.accent.primary} />
              </TouchableOpacity>
              <Text style={styles.timeLabel}>Min</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={decrementMinute}
                hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
                accessibilityRole="button"
                accessibilityLabel="Decrease minute"
              >
                <Ionicons name="chevron-down" size={20} color={Colors.accent.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Daily Guidance Toggle */}
          <View style={styles.glassPanel}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>Daily Guidance</Text>
              <Text style={styles.toggleSubtitle}>
                Receive a gentle notification to check in with your heart.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleSwitch, isEnabled && styles.toggleSwitchActive]}
              onPress={handleToggle}
              activeOpacity={0.8}
              accessibilityRole="switch"
              accessibilityLabel="Daily guidance"
              accessibilityState={{ checked: isEnabled }}
            >
              <Animated.View style={[styles.toggleKnob, isEnabled && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          {/* Prayer Times Toggle */}
          <View style={[styles.glassPanel, { marginTop: Spacing.sm }]}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>Prayer Times</Text>
              <Text style={styles.toggleSubtitle}>
                Alert at each of the five daily prayers.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleSwitch, prayerEnabled && styles.toggleSwitchActive]}
              onPress={handlePrayerToggle}
              activeOpacity={0.8}
              accessibilityRole="switch"
              accessibilityLabel="Prayer times"
              accessibilityState={{ checked: prayerEnabled }}
            >
              <Animated.View style={[styles.toggleKnob, prayerEnabled && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          {/* Spiritual Windows Toggle */}
          <View style={[styles.glassPanel, { marginTop: Spacing.sm }]}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>Spiritual Windows</Text>
              <Text style={styles.toggleSubtitle}>
                Tahajjud, morning adhkar, and evening remembrance.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleSwitch, spiritualEnabled && styles.toggleSwitchActive]}
              onPress={handleSpiritualToggle}
              activeOpacity={0.8}
              accessibilityRole="switch"
              accessibilityLabel="Spiritual windows"
              accessibilityState={{ checked: spiritualEnabled }}
            >
              <Animated.View style={[styles.toggleKnob, spiritualEnabled && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          {/* Exact Prayer Alerts — Android 13+ only. Without this permission
              Android silently downgrades every prayer/spiritual alarm to
              "inexact", which Doze can defer and release in one batch hours
              late (the bug this row exists to fix). There's no reliable way
              to read the current grant state back from the OS, so this is a
              persistent action row rather than a toggle reflecting real state. */}
          {needsExactAlarmPermission() && (
            <View style={[styles.glassPanel, { marginTop: Spacing.sm }]}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>Exact Prayer Alerts</Text>
                <Text style={styles.toggleSubtitle}>
                  Android can delay and bundle alerts together without this — enable it in settings.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.exactAlarmButton}
                onPress={handleOpenExactAlarmSettings}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Open exact alarm settings"
              >
                <Text style={styles.exactAlarmButtonText}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Set Reminder Button */}
          <TouchableOpacity
            style={[styles.setButton, { marginTop: Spacing.lg }]}
            onPress={handleSetReminder}
            activeOpacity={0.8}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Set reminder"
            accessibilityState={{ disabled: isSaving }}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.text.primary} />
            ) : (
              <Text style={styles.setButtonText}>Set Reminder</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Footer - Branding only */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
          <View style={styles.brandingContainer}>
            <Text style={styles.brandingText}>SAKINA</Text>
            <View style={styles.brandingDot} />
          </View>
        </View>
      </LinearGradient>

      {showSuccess && (
        <View style={styles.successOverlay}>
          <Animated.View
            style={[
              styles.successContent,
              {
                transform: [{ scale: successScale }],
                opacity: successOpacity,
              },
            ]}
          >
            <Text style={styles.successIcon}>✨</Text>
            <Text style={styles.successTitle}>Reminder Set!</Text>
            <Text style={styles.successSubtitle}>Daily guidance at {savedTime}</Text>
          </Animated.View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    fontSize: Typography.sizes.detail,
    fontWeight: '600',
    letterSpacing: 2,
    color: Colors.accent.primary,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.hero,
    fontFamily: Typography.fonts.serif,
    fontWeight: '300',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: Spacing.sm,
    fontSize: Typography.sizes.small,
    fontWeight: '300',
    fontStyle: 'italic',
    color: Colors.text.secondary,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  sideControlGroup: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  clockColumn: {
    alignItems: 'center',
  },
  clockContainer: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_RADIUS,
    backgroundColor: Colors.glass.light,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  handContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // AM/PM segmented pill — sits below the clock in normal flow (replaces the
  // old top:-45/bottom:-45 breakout toggles that overflowed the circle and
  // collided with the subtitle above / floated disconnected below).
  meridiemSegment: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  meridiemOption: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meridiemOptionActive: {
    backgroundColor: Colors.accent.muted,
  },
  meridiemText: {
    fontSize: Typography.sizes.detail,
    letterSpacing: 2,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    fontWeight: '300',
  },
  meridiemActiveText: {
    color: Colors.accent.primary,
    textShadowColor: 'rgba(212, 175, 55, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  // Constellation point (bright star) at cardinal positions
  constellationPoint: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
    transform: [{ translateX: -1 }, { translateY: -1 }],
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 3,
  },
  // Constellation label (Roman numeral)
  constellationLabel: {
    position: 'absolute',
    fontFamily: Typography.fonts.serif,
    fontWeight: '200',
    fontSize: Typography.sizes.small,
    letterSpacing: 1,
    color: Colors.text.muted,
    transform: [{ translateX: -12 }, { translateY: -8 }],
    textShadowColor: Colors.accent.muted,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  // Dim constellation points for non-cardinal positions
  constellationPointDim: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
    opacity: 0.2,
    transform: [{ translateX: -1 }, { translateY: -1 }],
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  // Star hand (gradient line extending from center)
  clockHand: {
    position: 'absolute',
    width: 1,
    bottom: 0,
    left: 0,
    marginLeft: -0.5,
    backgroundColor: 'rgba(212, 175, 55, 0.5)',
  },
  hourHand: {
    height: HOUR_HAND_LENGTH,
    opacity: 0.4, // hour hand is dimmer per HTML
  },
  minuteHand: {
    height: MINUTE_HAND_LENGTH,
  },
  // Star tip (glowing dot at end of hand)
  handGlow: {
    position: 'absolute',
    top: -3,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.primary,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  clockCenter: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  starburst: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.accent.primary,
    backgroundColor: 'transparent',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  timeDisplay: {
    position: 'absolute',
    top: '62%',
    alignItems: 'center',
  },
  timeText: {
    fontSize: Typography.sizes.h1,
    fontWeight: '300',
    color: Colors.text.primary,
    letterSpacing: 4,
  },
  glassPanel: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.glass.light,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  toggleContent: {
    flex: 1,
    paddingRight: Spacing.lg,
  },
  toggleTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  toggleSubtitle: {
    fontSize: Typography.sizes.detail,
    fontWeight: '300',
    fontStyle: 'italic',
    color: Colors.text.muted,
    lineHeight: 16,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.xs,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: Colors.accent.muted,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(212, 175, 55, 0.5)',
  },
  toggleKnobActive: {
    backgroundColor: Colors.accent.primary,
    transform: [{ translateX: 20 }],
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  exactAlarmButton: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accent.glow,
    backgroundColor: Colors.accent.muted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  exactAlarmButtonText: {
    fontSize: Typography.sizes.detail,
    color: Colors.accent.primary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footer: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xs,
  },
  setButton: {
    width: '100%',
    height: 52,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setButtonText: {
    fontSize: Typography.sizes.body,
    fontWeight: '300',
    color: Colors.text.primary,
    letterSpacing: 2,
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  brandingText: {
    fontSize: 9,
    letterSpacing: 5,
    color: 'rgba(255, 255, 255, 0.2)',
    fontWeight: '300',
  },
  brandingDot: {
    marginTop: Spacing.sm,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent.muted,
  },

  // Bare stepper chevrons — no circular border/glow container, per the app's
  // icon rule (nav/stepper affordances stay unwrapped; hitSlop carries the
  // 44pt touch target instead of a visible bordered shape).
  stepperButton: {
    padding: Spacing.xs,
  },
  timeLabel: {
    fontSize: Typography.sizes.detail,
    color: Colors.text.secondary,
    marginVertical: Spacing.xs,
    letterSpacing: 1,
  },
  // Success overlay styles
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: Typography.sizes.h1,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
  },
});
