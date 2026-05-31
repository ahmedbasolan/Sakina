import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
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
import { PostHogProvider } from 'posthog-react-native';
import MainNavigator from './src/navigation/MainNavigator';
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
    $exception_stack: error?.stack,
    isFatal,
    source: 'global_error_handler',
  });
  _globalHandler(error, isFatal);
});

// Unhandled promise rejections (React Native surfaces these as warnings by default)
if (typeof global.HermesInternal !== 'undefined') {
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

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [dot1Anim] = useState(new Animated.Value(0.3));
  const [dot2Anim] = useState(new Animated.Value(0.3));
  const [dot3Anim] = useState(new Animated.Value(0.3));

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
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]).start();

        const animateDot = (anim: Animated.Value, delay: number) => {
          return Animated.sequence([
            Animated.delay(delay),
            Animated.loop(
              Animated.sequence([
                Animated.timing(anim, {
                  toValue: 1,
                  duration: 400,
                  useNativeDriver: true,
                }),
                Animated.timing(anim, {
                  toValue: 0.3,
                  duration: 400,
                  useNativeDriver: true,
                }),
              ]),
            ),
          ]);
        };

        Animated.parallel([
          animateDot(dot1Anim, 0),
          animateDot(dot2Anim, 200),
          animateDot(dot3Anim, 400),
        ]).start();

        await initializeDatabase();
        setIsInitialized(true);
      } catch (error) {
        console.error('Database initialization failed:', error);
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [fadeAnim, pulseAnim]);

  if (!isInitialized || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" backgroundColor="#0B0F12" />

        <Animated.View style={[styles.loadingContent, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.loadingIcon}>✦</Text>
          </Animated.View>

          <Text style={styles.loadingTitle}>Sakina</Text>
          <Text style={styles.loadingSubtitle}>Preparing your spiritual journey</Text>

          <View style={styles.loadingDots}>
            <Animated.View style={[styles.dot, styles.dot1, { opacity: dot1Anim }]} />
            <Animated.View style={[styles.dot, styles.dot2, { opacity: dot2Anim }]} />
            <Animated.View style={[styles.dot, styles.dot3, { opacity: dot3Anim }]} />
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <PostHogProvider client={posthog}>
      <ThemeProvider>
        <AppProvider>
          <AuthProvider>
            <NavigationContainer>
              <AppContent />
            </NavigationContainer>
          </AuthProvider>
        </AppProvider>
      </ThemeProvider>
    </PostHogProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F12',
  },

  // Loading Screen Styles
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0F12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  loadingIcon: {
    fontSize: 48,
    color: '#2ED3C6',
    textAlign: 'center',
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.70)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ED3C6',
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1.0,
  },
});
