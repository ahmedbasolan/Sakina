import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mood } from '../types';
import { FreemiumService } from '../services/freemiumService';
import { PathsService } from '../services/pathsService';
import { SpecialEditionBundle } from '../types';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Grid, Colors, Typography } from '../theme/DesignSystem';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface MoodCard {
  mood: Mood;
  arabicAxis: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const MOOD_DATA: MoodCard[] = [
  { mood: 'Anxious', arabicAxis: 'Tawakkul', icon: 'weather-windy' },
  { mood: 'Calm', arabicAxis: 'Sakinah', icon: 'weather-sunny' },
  { mood: 'Sad', arabicAxis: 'Sabr', icon: 'weather-rainy' },
  { mood: 'Content', arabicAxis: 'Rida', icon: 'check-decagram-outline' },
  { mood: 'Angry', arabicAxis: 'Ihsan', icon: 'fire' },
  { mood: 'Grateful', arabicAxis: 'Shukr', icon: 'flower-tulip' },
  { mood: 'Tired', arabicAxis: 'Nasab', icon: 'battery-alert-variant-outline' },
  { mood: 'Energized', arabicAxis: 'Nashat', icon: 'lightning-bolt' },
  { mood: 'Stressed', arabicAxis: 'Dhiq', icon: 'waves' },
  { mood: 'Hopeful', arabicAxis: 'Raja', icon: 'sprout' },
];

interface HomeScreenProps {
  onMoodSelected: (mood: Mood) => void;
  selectedMood: Mood | null;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onMoodSelected, selectedMood }) => {
  const insets = useSafeAreaInsets();
  const topInset = insets?.top ?? 0;
  const bottomInset = insets?.bottom ?? 0;
  const [animatedValues] = useState(MOOD_DATA.map(() => new Animated.Value(1)));
  const [remainingSessions, setRemainingSessions] = useState(1);
  const [hoursUntilReset, setHoursUntilReset] = useState(0);
  const [freemiumService] = useState(() => FreemiumService.getInstance());
  const [pathsService] = useState(() => PathsService.getInstance());
  const [availableBundles, setAvailableBundles] = useState<SpecialEditionBundle[]>([]);

  useEffect(() => {
    // Update session info
    const updateSessionInfo = () => {
      setRemainingSessions(freemiumService.getRemainingSessions());
      setHoursUntilReset(freemiumService.getHoursUntilReset());
      setAvailableBundles(pathsService.getAvailableBundles());
    };

    updateSessionInfo();

    // Update every minute to show accurate time until reset
    const interval = setInterval(updateSessionInfo, 60000);

    return () => clearInterval(interval);
  }, [freemiumService]);

  const handleMoodPress = (mood: Mood, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Add subtle press animation
    Animated.sequence([
      Animated.timing(animatedValues[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Go directly to guidance (no tag selection)
    onMoodSelected(mood);
  };

  const getSessionDisplayText = () => {
    if (freemiumService.isPremium()) {
      return '∞ Unlimited guidance';
    } else if (remainingSessions > 0) {
      return `${remainingSessions} guidance left today`;
    } else {
      return `⚠️ No guidance left today\nResets in ${hoursUntilReset} hours`;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F12" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(topInset, 100),
            paddingBottom: Math.max(bottomInset, 20) + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>
          How is your <Text style={styles.heartText}>heart</Text>
          {'\n'}feeling today?
        </Text>
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            "Verily, in the remembrance of Allah do hearts find rest."
          </Text>
        </View>

        <View style={styles.moodGrid}>
          {MOOD_DATA.map((item, index) => (
            <Animated.View
              key={item.mood}
              style={{ transform: [{ scale: animatedValues[index] }] }}
            >
              <TouchableOpacity
                style={[styles.moodCard, selectedMood === item.mood && styles.selectedCard]}
                onPress={() => handleMoodPress(item.mood, index)}
                activeOpacity={0.8}
                accessibilityLabel={`${item.mood}. ${item.arabicAxis}.`}
                accessibilityRole="button"
                testID={`mood-button-${item.mood.toLowerCase()}`}
              >
                <View style={styles.cardContent}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={28}
                    color="#2ED3C6"
                    style={{ marginBottom: 12, opacity: 0.9 }}
                  />
                  <Text
                    style={styles.moodLabel}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.5}
                  >
                    {item.mood}
                  </Text>
                  <Text style={styles.arabicAxis}>{item.arabicAxis}</Text>
                </View>
                <View style={styles.cardAccent} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {availableBundles.length > 0 && (
          <TouchableOpacity
            style={styles.promoContainer}
            activeOpacity={0.9}
            onPress={() => {
              /* Navigate to Paths with bundle selection or just open Paths Tab */
            }}
          >
            <View style={styles.promoIcon}>
              <MaterialCommunityIcons name="star-face" size={32} color="#D4AF37" />
            </View>
            <View style={styles.promoContent}>
              <Text style={styles.promoLabel}>SPECIAL COLLECTION</Text>
              <Text style={styles.promoTitle}>{availableBundles[0].name}</Text>
              <Text style={styles.promoSubtitle}>
                {freemiumService.isPremium()
                  ? `50% OFF FOR YOU: AED ${(availableBundles[0].priceAED / 2).toFixed(2)}`
                  : `Permanent access for AED ${availableBundles[0].priceAED.toFixed(2)}`}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // Dark charcoal from Islamic guidelines
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Grid.contentPadding,
  },
  header: {
    fontSize: Typography.sizeHero + 2,
    fontWeight: '300', // Lighter weight for modern look
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Grid.space12,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  heartText: {
    color: Colors.teal, // Teal accent
    fontStyle: 'italic',
    fontWeight: '400',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Grid.space8,
    flex: 1,
  },
  moodCard: {
    width: (width - 64 - 12) / 2, // Width - (Content + Grid Padding) - Gap
    backgroundColor: Colors.surface, // Card surface
    borderRadius: Grid.borderRadius,
    padding: 0,
    marginBottom: Grid.space24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedCard: {
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
    borderWidth: 1,
    borderColor: Colors.teal, // Teal accent
    backgroundColor: Colors.surfaceSheet,
  },
  cardContent: {
    padding: Grid.space12,
    alignItems: 'center',
    zIndex: 2,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.teal,
    opacity: 0,
  },
  moodLabel: {
    fontSize: Typography.sizeBody + 2,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Grid.space8 - 2,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  arabicAxis: {
    fontSize: Typography.sizeSmall + 3,
    color: Colors.teal, // Brighter teal for better readability
    textAlign: 'center',
    letterSpacing: 0.8,
    fontWeight: '600',
    marginTop: Grid.space4,
  },
  sessionCounter: {
    alignItems: 'center',
    marginBottom: Grid.space32,
    paddingVertical: Grid.space12,
    paddingHorizontal: Grid.space20,
    backgroundColor: Colors.tealMuted,
    borderRadius: Grid.borderRadiusInner,
    borderWidth: 1,
    borderColor: Colors.tealMuted,
  },
  sessionText: {
    fontSize: Typography.sizeSmall + 1,
    fontWeight: '500',
    color: Colors.whiteMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  quoteContainer: {
    alignItems: 'center',
    marginBottom: Grid.space40,
    paddingHorizontal: Grid.space20,
    opacity: 0.8,
  },
  quoteText: {
    fontSize: Typography.sizeBody,
    color: Colors.whiteDim,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
    fontWeight: '300',
  },
  sessionTextWarning: {
    color: Colors.red,
    fontWeight: '600',
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A232C',
    marginHorizontal: Grid.space8,
    borderRadius: Grid.borderRadius,
    padding: Grid.space16,
    marginBottom: Grid.space32,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  promoIcon: {
    width: 56,
    height: 56,
    borderRadius: Grid.borderRadiusInner,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Grid.space16,
  },
  promoContent: {
    flex: 1,
  },
  promoLabel: {
    fontSize: Typography.sizeDetail,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: 1,
    marginBottom: Grid.space4 - 2,
  },
  promoTitle: {
    fontSize: Typography.sizeBody + 2,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Grid.space4 - 2,
  },
  promoSubtitle: {
    fontSize: Typography.sizeSmall,
    color: Colors.teal,
    fontWeight: '600',
  },
});

export default HomeScreen;
