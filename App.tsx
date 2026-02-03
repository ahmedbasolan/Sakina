import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran';
import {
  ScheherazadeNew_400Regular,
  ScheherazadeNew_700Bold,
} from '@expo-google-fonts/scheherazade-new';
import { MaterialCommunityIcons as MCIIcons } from '@expo/vector-icons';
import MainNavigator from './src/navigation/MainNavigator';
import { RotationEngine } from './src/services/rotationEngine';
import { FreemiumService } from './src/services/freemiumService';
import { initializeDatabase, refreshContentOnly } from './src/database/schema';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function App() {
  const [rotationEngine] = useState(() => new RotationEngine());
  const [freemiumService] = useState(() => FreemiumService.getInstance());
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
        });
        setFontsLoaded(true);
      } catch (error) {
        // Continue with system fonts if custom fonts fail
        setFontsLoaded(true);
      }
    };
    loadFonts();
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Start animations
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

        // Dot Animation Loop
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

        // 1. Initialize database (auto-seeds if empty)
        await initializeDatabase();

        // 2. Initialize services
        await freemiumService.initialize();

        setIsInitialized(true);
      } catch (error) {
        console.error('Database initialization failed:', error);
        setIsInitialized(true); // Still show app, errors will be handled per-screen
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

          <Text style={styles.loadingTitle}>Islamic Guidance</Text>
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
    <SafeAreaProvider>
      <View style={styles.container}>
        <MainNavigator rotationEngine={rotationEngine} freemiumService={freemiumService} />
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
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
