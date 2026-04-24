/**
 * Onboarding Orchestrator
 *
 * 7-screen flow with progress bar, animated transitions,
 * swipe navigation, and consistent back arrow.
 *
 * Flow: Bismillah → Welcome → Heart Check-In → Personalization →
 *       First Guidance → Notification → Hold-to-Commit → Main
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Easing,
} from 'react-native';
import {
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import BismillahScreen from '../components/onboarding/BismillahScreen';
import WelcomeScreen from '../components/onboarding/WelcomeScreen';
import HeartCheckInScreen from '../components/onboarding/HeartCheckInScreen';
import PersonalizationScreen from '../components/onboarding/PersonalizationScreen';
import FirstGuidanceScreen from '../components/onboarding/FirstGuidanceScreen';
import NotificationScreen from '../components/onboarding/NotificationScreen';
import CommitScreen from '../components/onboarding/CommitScreen';
import PaywallScreen from '../components/onboarding/PaywallScreen';
import NotificationService from '../services/notificationService';
import ThemeToggle from '../components/ThemeToggle';
import { ProgressMandala } from '../components/onboarding/ProgressMandala';
import { touchEmitter } from '../components/onboarding/InteractiveStarfield';
import { SoundscapeToggle } from '../components/onboarding/SoundscapeToggle';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');
const TOTAL_SCREENS = 8;
const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 0.5;

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

export default function OnboardingScreen({ navigation }: any) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const { enterGuestMode } = useAuth();
  const insets = useSafeAreaInsets();
  const { onboardingGradients } = useTheme();

  // Transition animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const mandalaScale = useRef(new Animated.Value(1)).current;
  const bgScale = useRef(new Animated.Value(1)).current;

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
      ])
    ).start();
  }, []);

  // Animate progress bar on screen change and mandala pulse
  useEffect(() => {
    // mandala pulse
    Animated.sequence([
      Animated.timing(mandalaScale, {
        toValue: 1.2,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(mandalaScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentScreen]);

  const transitionTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= TOTAL_SCREENS) return;
      const direction = nextIndex > currentScreen ? -1 : 1;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: direction * 30,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          setCurrentScreen(nextIndex);
          slideAnim.setValue(-direction * 30);
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start();
        }, 50);
      });
    },
    [currentScreen],
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
  const onGestureEvent = useRef(
    Animated.event([{ nativeEvent: { translationX: new Animated.Value(0) } }], {
      useNativeDriver: false,
    }),
  ).current;

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

  // --- Notification handler ---
  const handleAllowNotifications = useCallback(async () => {
    try {
      await NotificationService.getInstance().requestPermissions();
    } catch (e) {
      // User denied or error — continue anyway
    }
    goNext();
  }, [goNext]);

  const handleSkipNotifications = useCallback(() => {
    goNext();
  }, [goNext]);

  // --- Final: Hold-to-Commit completed → skip Auth, go straight to Main ---
  const handleCommitComplete = useCallback(async () => {
    // Mark onboarding as complete
    await AsyncStorage.setItem('@onboarding_complete', 'true').catch(() => {});
    // Enter guest mode to flip navigator out of the Auth layout to the Main layout automatically
    enterGuestMode();
  }, [enterGuestMode]);

  const gradient = onboardingGradients[currentScreen] || onboardingGradients[0];

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: bgScale }] }]}>
        <LinearGradient 
          colors={gradient} 
          style={styles.gradient}
        />
      </Animated.View>
      <View 
          style={StyleSheet.absoluteFill} 
          onTouchMove={e => touchEmitter.emit(e.nativeEvent.pageX, e.nativeEvent.pageY)}
          onTouchStart={e => touchEmitter.emit(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        >
        {/* Header: back arrow + progress mandala */}
        <View style={[styles.headerRow, { top: insets.top + 12 }]}>
          {/* Left section: back arrow / theme toggle */}
          <View style={styles.headerLeft}>
            {currentScreen > 0 ? (
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
            
            {/* Soundscape toggle */}
            <View style={{ marginLeft: 8 }}>
              <SoundscapeToggle />
            </View>
          </View>

          {/* Breadcrumb Progress Mandala */}
          <View style={styles.breadcrumbWrap}>
            <Animated.View style={{ transform: [{ scale: mandalaScale }] }}>
              <ProgressMandala progress={(currentScreen + 1) / TOTAL_SCREENS} size={52} />
            </Animated.View>
          </View>
        </View>

        {/* Screen content */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-15, 15]}
        >
          <Animated.View
            style={[
              styles.screenWrap,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {currentScreen === 0 && (
              <BismillahScreen isActive={currentScreen === 0} onNext={goNext} />
            )}
            {currentScreen === 1 && (
              <WelcomeScreen isActive={currentScreen === 1} onNext={goNext} onSkip={handleCommitComplete} />
            )}
            {currentScreen === 2 && (
              <HeartCheckInScreen isActive={currentScreen === 2} onNext={goNext} />
            )}
            {currentScreen === 3 && (
              <PersonalizationScreen isActive={currentScreen === 3} onNext={goNext} />
            )}
            {currentScreen === 4 && (
              <FirstGuidanceScreen isActive={currentScreen === 4} onNext={goNext} />
            )}
            {currentScreen === 5 && (
              <NotificationScreen
                isActive={currentScreen === 5}
                onAllow={handleAllowNotifications}
                onSkip={handleSkipNotifications}
              />
            )}
            {currentScreen === 6 && (
              <CommitScreen isActive={currentScreen === 6} onCommit={goNext} />
            )}
            {currentScreen === 7 && (
              <PaywallScreen isActive={currentScreen === 7} onComplete={handleCommitComplete} />
            )}
          </Animated.View>
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
    left: 20,
    right: 20,
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
    borderRadius: 18,
    backgroundColor: 'rgba(255, 245, 220, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breadcrumbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // --- Screen wrapper ---
  screenWrap: {
    flex: 1,
  },
});
