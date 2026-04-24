import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { spiritualWindowsData, defaultSpiritualWindow } from '../data/spiritualWindows';
import { logServiceError } from '../services/errorLoggingService';

type Props = StackScreenProps<RootStackParamList, 'SpiritualWindow'>;

const { width, height } = Dimensions.get('window');

// Simple particle system
const ParticleSystem = ({ color, type }: { color: string; type: 'stars' | 'dust' | 'mist' }) => {
  const particles = useRef(
    [...Array(type === 'stars' ? 30 : 20)].map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: type === 'stars' ? Math.random() * 2 + 1 : Math.random() * 4 + 2,
      opacity: new Animated.Value(Math.random()),
      translateY: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    particles.forEach((p, i) => {
      // Breathing opacity
      Animated.loop(
        Animated.sequence([
          Animated.timing(p.opacity, {
            toValue: Math.random() * 0.5 + 0.5,
            duration: 2000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: Math.random() * 0.2,
            duration: 2000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Drift upward for dust/mist
      if (type !== 'stars') {
        const drift = 50 + Math.random() * 100;
        Animated.loop(
          Animated.timing(p.translateY, {
            toValue: -drift,
            duration: 8000 + Math.random() * 10000,
            useNativeDriver: true,
          })
        ).start();
      }
    });
  }, [particles, type]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: color,
            opacity: p.opacity,
            transform: [{ translateY: p.translateY }],
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: p.size,
            ...(type === 'mist' ? { filter: 'blur(4px)' } : {}), // For web if supported, otherwise just large radius
          }}
        />
      ))}
    </View>
  );
};

export const SpiritualWindowScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const contextId = route.params?.context || 'dhuhr';
  const data = spiritualWindowsData[contextId] || defaultSpiritualWindow;

  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(data.steps);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Fetch Hadith and inject it into the steps
  useEffect(() => {
    import('../services/hadithService').then(({ getDailyHadith }) => {
      getDailyHadith().then((hadith) => {
        // Insert hadith right before the final step
        setSteps((prev) => {
          const newSteps = [...prev];
          const hadithStep = {
            title: 'Light of the Sunnah',
            description: 'Reflect on this daily hadith to center your thoughts.',
            arabic: hadith.arabic,
            translation: hadith.translation,
            source: `${hadith.source} - ${hadith.reference}`
          };
          // Insert at second-to-last position
          newSteps.splice(newSteps.length - 1, 0, hadithStep);
          return newSteps;
        });
      });
    }).catch(e => logServiceError('SpiritualWindowScreen', 'loadHadithService', e instanceof Error ? e : new Error(String(e))));
  }, []);

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    animateIn();
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setCurrentStep(currentStep + 1));
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => navigation.goBack());
    }
  };

  const step = steps[currentStep];

  if (!step) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={data.themeColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      <ParticleSystem color={data.particleColor} type={data.particleType} />

      {/* Header */}
      <SafeAreaHeader insets={insets} title={data.title} onClose={() => navigation.goBack()} />

      {/* Content */}
      <View style={styles.contentContainer}>
        <Animated.View
          style={[
            styles.stepCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>

          {step.arabic && (
            <View style={styles.arabicContainer}>
              <Text style={styles.arabicText}>{step.arabic}</Text>
              {step.transliteration && <Text style={styles.transliterationText}>{step.transliteration}</Text>}
              {step.translation && <Text style={styles.translationText}>{step.translation}</Text>}
              {step.source && <Text style={styles.sourceText}>— {step.source}</Text>}
            </View>
          )}

        </Animated.View>
      </View>

      {/* Footer / CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.progressIndicators}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i === currentStep ? styles.progressDotActive : null,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Return to Peace' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SafeAreaHeader = ({ insets, title, onClose }: any) => (
  <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
    <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
      <Ionicons name="close" size={28} color="rgba(255,255,255,0.7)" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={{ width: 28 }} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  stepCard: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 28,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 34,
  },
  stepDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  arabicContainer: {
    marginTop: 20,
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    width: '100%',
    alignItems: 'center',
  },
  arabicText: {
    fontSize: 26,
    color: '#F0E6D3',
    textAlign: 'center',
    lineHeight: 46,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', // Fallback, usually loaded as Scheherazade/KFGQPC in real app
    marginBottom: 16,
  },
  transliterationText: {
    fontSize: 13,
    color: 'rgba(240, 230, 211, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 20,
  },
  translationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  sourceText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  progressIndicators: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 30,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressDotActive: {
    backgroundColor: '#FFF',
    width: 16,
  },
  nextButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: '100%',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
