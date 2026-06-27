/**
 * Onboarding Orchestrator
 *
 * 7-screen flow with progress bar, animated transitions,
 * swipe navigation, and consistent back arrow.
 *
 * Flow: Bismillah → Welcome → Heart Check-In → Personalization →
 *       First Guidance → Notification → Commit → Main
 *
 * No cold paywall in onboarding (spec §8) — upgrade asks live only at peaks.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import BismillahScreen from '../components/onboarding/BismillahScreen';
import WelcomeScreen from '../components/onboarding/WelcomeScreen';
import HeartCheckInScreen from '../components/onboarding/HeartCheckInScreen';
import PersonalizationScreen from '../components/onboarding/PersonalizationScreen';
import FirstGuidanceScreen from '../components/onboarding/FirstGuidanceScreen';
import NotificationScreen from '../components/onboarding/NotificationScreen';
import CommitScreen from '../components/onboarding/CommitScreen';
import NotificationService from '../services/notificationService';
import { ProgressMandala } from '../components/onboarding/ProgressMandala';
import { touchEmitter } from '../components/onboarding/InteractiveStarfield';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Animations, Spacing } from '../theme/DesignSystem';

const TOTAL_SCREENS = 7;
const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 0.5;
const SCREEN_W = Dimensions.get('window').width;
// One continuous page-turn slide (300–500ms "page transition" band). Both the
// outgoing and incoming pages move together, so the old page never plays a
// solo exit before the new one arrives.
const SLIDE_DURATION = 340;

// Back chevron icon
function BackArrow() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M15,18 L9,12 L15,6"
        fill="none"
        stroke="rgba(245, 237, 227, 0.5)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function OnboardingScreen() {
  const [currentScreen, setCurrentScreen] = useState(0);
  // While a page-turn is in flight, the target page is mounted alongside the
  // current one so the two can cross-slide together.
  const [pendingScreen, setPendingScreen] = useState<number | null>(null);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const { enterGuestMode } = useAuth();
  const insets = useSafeAreaInsets();
  const { onboardingGradients } = useTheme();

  // Transition animation — horizontal track translateX. Constant opacity so a
  // screen change never flashes a blank/dark frame.
  const slideAnim = useRef(new Animated.Value(0)).current;
  const mandalaScale = useRef(new Animated.Value(1)).current;
  const bgScale = useRef(new Animated.Value(1)).current;
  const isTransitioning = useRef(false);

  // Breathing background gradient loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgScale, {
          toValue: 1.05,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bgScale, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // Animate progress bar on screen change and mandala pulse
  useEffect(() => {
    // mandala pulse
    Animated.sequence([
      Animated.timing(mandalaScale, {
        toValue: 1.2,
        duration: Animations.timing.micro,
        useNativeDriver: true,
      }),
      Animated.timing(mandalaScale, {
        toValue: 1,
        duration: Animations.timing.micro,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentScreen]);

  const transitionTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= TOTAL_SCREENS) return;
      if (isTransitioning.current) return;
      isTransitioning.current = true;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Book-page cross-slide. The current and target pages are laid out in a
      // 2-wide track and the whole track translates once, so the outgoing page
      // slides off exactly as the incoming page slides in — a single continuous
      // motion at constant opacity (no solo exit, no blank frame).
      const forward = nextIndex > currentScreen;
      setDirection(forward ? 'forward' : 'back');
      setPendingScreen(nextIndex);

      // slideAnim is a 0→1 progress value. Both pages are absolutely-positioned
      // full-screen layers; their translateX is interpolated from this progress
      // (see render), so the outgoing and incoming pages cross-slide together.
      slideAnim.setValue(0);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: SLIDE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setCurrentScreen(nextIndex);
        setPendingScreen(null);
        isTransitioning.current = false;
      });
    },
    [currentScreen, slideAnim],
  );

  const goNext = useCallback(() => {
    transitionTo(currentScreen + 1);
  }, [currentScreen, transitionTo]);

  const goBack = useCallback(() => {
    if (currentScreen > 0) {
      transitionTo(currentScreen - 1);
    }
  }, [currentScreen, transitionTo]);

  // --- Swipe gesture ---

  const onHandlerStateChange = useCallback(
    (event: any) => {
      const { translationX, velocityX, state: gestureState } = event.nativeEvent;
      if (gestureState === State.END) {
        if (
          (translationX < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) &&
          currentScreen < TOTAL_SCREENS - 1
        ) {
          goNext();
        } else if (
          (translationX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) &&
          currentScreen > 0
        ) {
          goBack();
        }
      }
    },
    [currentScreen, goNext, goBack],
  );

  // --- Final: enter the app as guest ---
  const handleCommitComplete = useCallback(async () => {
    await enterGuestMode(true);
  }, [enterGuestMode]);

  // --- Notification handlers — advance to CommitScreen ---
  const handleAllowNotifications = useCallback(async () => {
    try {
      await NotificationService.getInstance().requestPermissions();
    } catch (_e) {
      // User denied or error — continue anyway
    }
    goNext();
  }, [goNext]);

  const handleSkipNotifications = useCallback(() => {
    goNext();
  }, [goNext]);

  const gradient = onboardingGradients[currentScreen] || onboardingGradients[0];

  // Maps a screen index to its component. `isActive` drives each screen's
  // entrance stagger; during a transition both pages are active so neither
  // goes blank while sliding.
  const renderScreen = (index: number, isActive: boolean) => {
    switch (index) {
      case 0:
        return <BismillahScreen isActive={isActive} onNext={goNext} />;
      case 1:
        return <WelcomeScreen isActive={isActive} onNext={goNext} />;
      case 2:
        return <HeartCheckInScreen isActive={isActive} onNext={goNext} />;
      case 3:
        return <PersonalizationScreen isActive={isActive} onNext={goNext} />;
      case 4:
        return <FirstGuidanceScreen isActive={isActive} onNext={goNext} />;
      case 5:
        return (
          <NotificationScreen
            isActive={isActive}
            onAllow={handleAllowNotifications}
            onSkip={handleSkipNotifications}
          />
        );
      case 6:
        return <CommitScreen isActive={isActive} onCommit={handleCommitComplete} />;
      default:
        return null;
    }
  };

  // Cross-slide transforms. Forward: outgoing 0 → -W, incoming +W → 0.
  // Back: outgoing 0 → +W, incoming -W → 0. Each page is a full-screen layer.
  const transitioning = pendingScreen !== null;
  const sign = direction === 'forward' ? 1 : -1;
  const outgoingX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -sign * SCREEN_W],
  });
  const incomingX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [sign * SCREEN_W, 0],
  });

  // Keyed layers (same element type + key across the transition→settle boundary)
  // so the incoming page persists instead of remounting and replaying its entry.
  const layers: { key: number; x: Animated.AnimatedInterpolation<number> | number }[] =
    transitioning
      ? [
          { key: currentScreen, x: outgoingX },
          { key: pendingScreen as number, x: incomingX },
        ]
      : [{ key: currentScreen, x: 0 }];

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: bgScale }] }]}>
        <LinearGradient colors={gradient} style={styles.gradient} />
      </Animated.View>
      <View
        style={StyleSheet.absoluteFill}
        onTouchMove={(e) => touchEmitter.emit(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        onTouchStart={(e) => touchEmitter.emit(e.nativeEvent.pageX, e.nativeEvent.pageY)}
      >
        {/* Header: back arrow + progress mandala */}
        <View style={[styles.headerRow, { top: insets.top + 12 }]}>
          {/* Left section: back arrow / theme toggle */}
          <View style={styles.headerLeft}>
            {currentScreen > 1 ? (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={goBack}
                activeOpacity={0.6}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <BackArrow />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 36, height: 36 }} />
            )}
          </View>

          {/* Breadcrumb Progress Mandala */}
          <View style={styles.breadcrumbWrap}>
            <Animated.View style={{ transform: [{ scale: mandalaScale }] }}>
              <ProgressMandala progress={(currentScreen + 1) / TOTAL_SCREENS} size={44} />
            </Animated.View>
          </View>
        </View>

        {/* Screen content */}
        <PanGestureHandler onHandlerStateChange={onHandlerStateChange} activeOffsetX={[-15, 15]} enabled={currentScreen !== 2}>
          <View style={styles.track}>
            {layers.map((layer) => (
              <Animated.View
                key={layer.key}
                style={[StyleSheet.absoluteFill, { transform: [{ translateX: layer.x }] }]}
              >
                {renderScreen(layer.key, true)}
              </Animated.View>
            ))}
          </View>
        </PanGestureHandler>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  // --- Header ---
  headerRow: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breadcrumbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // --- Sliding page container ---
  // Holds full-screen absolute page layers during a transition; relative so the
  // absoluteFill layers size to it.
  track: {
    flex: 1,
    overflow: 'hidden',
  },
});
