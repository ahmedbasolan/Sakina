import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticsService } from '../services/hapticsService';
import NotificationService from '../services/notificationService';
import { logServiceError } from '../services/errorLoggingService';

const CLOCK_SIZE = 240;
const CLOCK_RADIUS = CLOCK_SIZE / 2;
const MINUTE_HAND_LENGTH = CLOCK_RADIUS * 0.75;
const HOUR_HAND_LENGTH = CLOCK_RADIUS * 0.45;

// Premium color palette matching the mockup
const COLORS = {
  primary: '#E0C3FC',
  primaryMuted: 'rgba(224, 195, 252, 0.4)',
  primaryGlow: 'rgba(224, 195, 252, 0.5)',
  spiritViolet: '#8E94F2',
  duskDeep: '#1a1a2e',
  duskMid: '#16213e',
  duskSoft: '#0f3460',
  white: '#FFFFFF',
  whiteDim: 'rgba(255, 255, 255, 0.9)',
  whiteMuted: 'rgba(255, 255, 255, 0.4)',
  whiteSubtle: 'rgba(255, 255, 255, 0.2)',
  glass: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.05)',
};

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedTime, setSavedTime] = useState<string | null>(null);

  const hourHandRotation = useRef(new Animated.Value(0)).current;
  const minuteHandRotation = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const starPulse = useRef(new Animated.Value(1)).current;

  // Twinkling constellation refs (8 dim dots)
  const twinkleAnims = useRef(Array.from({ length: 8 }, () => new Animated.Value(0.2))).current;

  // Starburst animation refs
  const starburstScale = useRef(new Animated.Value(0)).current;
  const starburstOpacity = useRef(new Animated.Value(0)).current;
  const starburstRotation = useRef(new Animated.Value(0)).current;

  // Pulsing star animation
  useEffect(() => {
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
  }, [starPulse]);

  // Twinkling constellation animation
  useEffect(() => {
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
  }, [twinkleAnims]);

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
      const settings = await notificationService.getSettings();
      const { time, period: savedPeriod } = notificationService.formatTime(
        settings.hour,
        settings.minute,
      );
      const [h, m] = time.split(':').map(Number);
      setHour(h);
      setMinute(m);
      setPeriod(savedPeriod);
      setIsEnabled(settings.enabled);
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
        ]).start(() => setShowSuccess(false));
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
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive daily reminders.',
        );
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to set reminder. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);

    if (!newValue) {
      await notificationService.cancelReminder();
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
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <LinearGradient
        colors={
          period === 'AM'
            ? ['#2a1a3e', '#3d2a5f', '#5b3a7a'] // Dawn purple tones
            : ['#0a0a14', '#12121e', '#1a1a2e'] // Midnight blue/black tones
        }
        style={styles.container}
      >
        {/* Ambient glow */}
        <View style={styles.ambientGlow} />

        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerLabel}></Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Set Reminder</Text>
            <Text style={styles.subtitle}>When would you like to reflect?</Text>
          </View>

          {/* Clock Row: Hour controls | Clock | Minute controls */}
          <View style={styles.clockRow}>
            {/* Hour controls - Left side */}
            <View style={styles.sideControlGroup}>
              <TouchableOpacity style={styles.timeButton} onPress={incrementHour}>
                <Text style={styles.timeButtonText}>▲</Text>
              </TouchableOpacity>
              <Text style={styles.timeLabel}>Hour</Text>
              <TouchableOpacity style={styles.timeButton} onPress={decrementHour}>
                <Text style={styles.timeButtonText}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Clock */}
            <View style={styles.clockContainer}>
              {/* AM Toggle */}
              <TouchableOpacity
                style={[styles.meridiemToggle, { top: -45 }]}
                onPress={() => {
                  HapticsService.impactAsync('MEDIUM');
                  setPeriod('AM');
                }}
              >
                <Text style={[styles.meridiemText, period === 'AM' && styles.meridiemActiveText]}>
                  AM
                </Text>
              </TouchableOpacity>

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

              {/* PM Toggle */}
              <TouchableOpacity
                style={[styles.meridiemToggle, { bottom: -45 }]}
                onPress={() => {
                  HapticsService.impactAsync('MEDIUM');
                  setPeriod('PM');
                }}
              >
                <Text style={[styles.meridiemText, period === 'PM' && styles.meridiemActiveText]}>
                  PM
                </Text>
              </TouchableOpacity>
            </View>

            {/* Minute controls - Right side */}
            <View style={styles.sideControlGroup}>
              <TouchableOpacity style={styles.timeButton} onPress={incrementMinute}>
                <Text style={styles.timeButtonText}>▲</Text>
              </TouchableOpacity>
              <Text style={styles.timeLabel}>Min</Text>
              <TouchableOpacity style={styles.timeButton} onPress={decrementMinute}>
                <Text style={styles.timeButtonText}>▼</Text>
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
            >
              <Animated.View style={[styles.toggleKnob, isEnabled && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          {/* Set Reminder Button - Moved up to close the gap */}
          <TouchableOpacity
            style={[styles.setButton, { marginTop: 24 }]}
            onPress={handleSetReminder}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.setButtonText}>Set Reminder</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer - Branding only */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
          <View style={styles.brandingContainer}>
            <Text style={styles.brandingText}>AL-HIKMAH</Text>
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
  ambientGlow: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: '50%',
    height: '40%',
    backgroundColor: 'rgba(142, 148, 242, 0.1)',
    borderRadius: 999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 20,
    color: COLORS.whiteMuted,
    fontWeight: '200',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '300',
    letterSpacing: 4,
    color: COLORS.whiteMuted,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '300',
    color: COLORS.whiteDim,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '300',
    fontStyle: 'italic',
    color: COLORS.primaryMuted,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sideControlGroup: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  clockContainer: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_RADIUS,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
  meridiemToggle: {
    position: 'absolute',
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  meridiemText: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    fontWeight: '400',
  },
  meridiemActiveText: {
    color: '#E0C3FC',
    textShadowColor: 'rgba(224, 195, 252, 0.5)',
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
    fontFamily: 'serif',
    fontWeight: '200',
    fontSize: 14,
    letterSpacing: 1,
    color: 'rgba(255, 255, 255, 0.4)',
    transform: [{ translateX: -12 }, { translateY: -8 }],
    textShadowColor: 'rgba(224, 195, 252, 0.2)',
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
    backgroundColor: 'rgba(240, 230, 255, 0.4)', // star-glow color
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
    backgroundColor: '#F0E6FF', // star-glow color
    shadowColor: '#F0E6FF',
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
    borderColor: '#E0C3FC',
    backgroundColor: 'transparent',
    shadowColor: '#E0C3FC',
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
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.white,
    letterSpacing: 4,
  },
  glassPanel: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 32,
    padding: 16,
  },
  toggleContent: {
    flex: 1,
    paddingRight: 24,
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 12,
    fontWeight: '300',
    fontStyle: 'italic',
    color: COLORS.whiteMuted,
    lineHeight: 18,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 4,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: 'rgba(224, 195, 252, 0.2)',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(224, 195, 252, 0.5)',
  },
  toggleKnobActive: {
    backgroundColor: 'rgba(224, 195, 252, 0.8)',
    transform: [{ translateX: 20 }],
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  footer: {
    paddingHorizontal: 32,
    paddingTop: 12,
  },
  setButton: {
    width: '100%',
    height: 56,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setButtonText: {
    fontSize: 18,
    fontWeight: '300',
    color: COLORS.white,
    letterSpacing: 2,
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  brandingText: {
    fontSize: 9,
    letterSpacing: 5,
    color: 'rgba(255, 255, 255, 0.2)',
    fontWeight: '300',
  },
  brandingDot: {
    marginTop: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primaryMuted,
  },

  // Time control button styles
  timeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(224, 195, 252, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E0C3FC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  timeButtonText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '300',
  },
  timeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginVertical: 8,
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
    padding: 40,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
