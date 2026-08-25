import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Platform,
  Image,
  UIManager,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran';
import { MaterialCommunityIcons as MCIIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PostHogProvider } from 'posthog-react-native';
import MainNavigator from './src/navigation/MainNavigator';
import { useReduceMotion } from './src/hooks/useReduceMotion';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initializeDatabase } from './src/database/operations';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import posthog, { loadAnalyticsConsent } from './src/config/posthog';
import { redactPII } from './src/services/errorLoggingService';
// Side-effect import: defines the notification top-up background task at
// module scope so headless OS launches (no React tree) can execute it.
import { registerNotificationTopUpTask } from './src/services/notificationTopUpTask';
import { navigationRef, setupNotificationRouter } from './src/services/notificationRouter';

// ── Global error handlers ─────────────────────────────────────────────────
// Capture unhandled JS errors and promise rejections before they silently vanish.
const _globalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  posthog.capture('$exception', {
    $exception_message: redactPII(String(error?.message ?? 'Unknown error')),
    // Stack traces are only sent in development to prevent accidental PII leakage
    // (tokens or user data in local variables can surface in stack frames).
    $exception_stack: __DEV__ && error?.stack ? redactPII(String(error.stack)) : null,
    isFatal: isFatal ?? false,
    source: 'global_error_handler',
  });
  _globalHandler(error, isFatal);
});

// Unhandled promise rejections (React Native surfaces these as warnings by default)
if (typeof (global as any).HermesInternal !== 'undefined') {
  // Hermes engine: rejections flow through ErrorUtils — already handled above
} else {
  // JSC engine fallback
  const originalUnhandled = (global as any).onunhandledrejection;
  (global as any).onunhandledrejection = (event: any) => {
    posthog.capture('$exception', {
      $exception_message: redactPII(String(event?.reason)),
      source: 'unhandled_promise_rejection',
    });
    originalUnhandled?.(event);
  };
}

function AppContent() {
  const { isDark } = useTheme();

  // Set up the centralized notification tap router at the app root level.
  // This catches taps regardless of which screen is mounted, and handles
  // cold-start taps via getLastNotificationResponseAsync.
  useEffect(() => {
    const cleanup = setupNotificationRouter();
    return cleanup;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.container}>
          <ErrorBoundary>
            <MainNavigator />
          </ErrorBoundary>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * BrandedSplash — the warm-sanctuary loading screen shown while fonts load and
 * the database initialises. The gold lantern sits on the navy gradient with a
 * soft gold glow breathing behind it, the wordmark fading in below. Honours
 * reduce-motion (glow holds steady, no breathing loop).
 */
function BrandedSplash() {
  const reduceMotion = useReduceMotion();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    if (reduceMotion) {
      glowAnim.setValue(0.16);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.24, duration: 2600, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.1, duration: 2600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, fadeAnim, glowAnim]);

  return (
    <View style={styles.loadingContainer}>
      <StatusBar style="light" backgroundColor="#07111E" />
      <LinearGradient
        colors={['#07111E', '#0C1A2E', '#0F1F30']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Animated.View style={[styles.loadingContent, { opacity: fadeAnim }]}>
        <View style={styles.lanternWrap}>
          <Animated.View style={[styles.lanternGlow, { opacity: glowAnim }]} pointerEvents="none" />
          <Image
            source={require('./assets/icon.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.loadingTitle}>Sakina</Text>
        <Text style={styles.loadingSubtitle}>A moment of stillness</Text>
      </Animated.View>
    </View>
  );
}

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load custom fonts
  useEffect(() => {
    const loadFonts = async () => {
      try {
        // Amiri-Quran is the ONLY custom family the app actually renders — it
        // is what Typography.fonts.arabic resolves to, and every `fontFamily`
        // value in src/ is a static string, so nothing can reach a family that
        // isn't named here. 'Amiri-Regular', 'Amiri-Bold',
        // 'ScheherazadeNew-Regular' and 'ScheherazadeNew-Bold' were also being
        // loaded and were referenced by exactly nothing: ~1.7 MB of TTF
        // (411 + 395 + 319 + 575 KB) parsed on every cold start, awaited
        // before `setFontsLoaded` lets the app render at all. Amiri-Quran
        // itself is 133 KB. If a second Arabic face is ever wanted, add it
        // back here together with the Typography token that selects it.
        await Font.loadAsync({
          'Amiri-Quran': AmiriQuran_400Regular,
          ...MCIIcons.font,
          ...Ionicons.font,
        });
        setFontsLoaded(true);
      } catch (error) {
        setFontsLoaded(true);
      }
    };
    loadFonts();
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeDatabase();
        await loadAnalyticsConsent();
        // Fire-and-forget: keeps prayer/spiritual reminders topped up when
        // the app stays closed for days. Self-catching — never blocks startup.
        registerNotificationTopUpTask();
        setIsInitialized(true);
      } catch (error) {
        console.error('Database initialization failed:', error);
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized || !fontsLoaded) {
    return <BrandedSplash />;
  }

  // PostHogProvider sits inside NavigationContainer.
  // captureScreens is disabled because useNavigationState (called internally
  // by PostHog's screen tracker) requires a Stack/Tab navigator context, not just
  // NavigationContainer — it would throw unless PostHogProvider were nested inside
  // an actual navigator, which isn't practical.  We use PostHog for crash/error
  // reporting only; screen tracking is unnecessary at this stage.
  return (
    <ThemeProvider>
      <AppProvider>
        <AuthProvider>
          <NavigationContainer ref={navigationRef}>
            <PostHogProvider client={posthog} autocapture={{ captureScreens: false }}>
              <AppContent />
            </PostHogProvider>
          </NavigationContainer>
        </AuthProvider>
      </AppProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F12',
  },

  // Branded splash / loading screen
  loadingContainer: {
    flex: 1,
    backgroundColor: '#07111E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  lanternWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  lanternGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#D4AF37',
  },
  appIcon: {
    width: 140,
    height: 140,
    borderRadius: 32,
  },
  loadingTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 32,
    color: '#F0E6D3',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1,
    textShadowColor: 'rgba(201, 168, 76, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: 'rgba(176, 196, 215, 0.75)',
    textAlign: 'center',
    letterSpacing: 0.4,
    lineHeight: 22,
  },
});
