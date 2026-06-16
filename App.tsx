import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran';
import {
  ScheherazadeNew_400Regular,
  ScheherazadeNew_700Bold,
} from '@expo-google-fonts/scheherazade-new';
import { MaterialCommunityIcons as MCIIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PostHogProvider } from 'posthog-react-native';
import MainNavigator from './src/navigation/MainNavigator';
import { SakinaLantern } from './src/components/SakinaLantern';
import { useReduceMotion } from './src/hooks/useReduceMotion';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initializeDatabase } from './src/database/schema';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import posthog from './src/config/posthog';

// ── Global error handlers ─────────────────────────────────────────────────
// Capture unhandled JS errors and promise rejections before they silently vanish.
const _globalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  posthog.capture('$exception', {
    $exception_message: error?.message,
    // Stack traces are redacted in production to prevent accidental PII leakage
    // (tokens or user data in local variables can surface in stack frames).
    $exception_stack: __DEV__ ? error?.stack : undefined,
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
      $exception_message: String(event?.reason),
      source: 'unhandled_promise_rejection',
    });
    originalUnhandled?.(event);
  };
}

function AppContent() {
  const { isDark } = useTheme();
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
          <SakinaLantern size={132} />
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
        await Font.loadAsync({
          'Amiri-Regular': Amiri_400Regular,
          'Amiri-Bold': Amiri_700Bold,
          'Amiri-Quran': AmiriQuran_400Regular,
          'ScheherazadeNew-Regular': ScheherazadeNew_400Regular,
          'ScheherazadeNew-Bold': ScheherazadeNew_700Bold,
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
          <NavigationContainer>
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
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#D4AF37',
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
