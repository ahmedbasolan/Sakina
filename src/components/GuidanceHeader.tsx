import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mood } from '../types';
import { Colors, Spacing, MoodColors } from '../theme/DesignSystem';
import { HapticsService } from '../services/hapticsService';

interface GuidanceHeaderProps {
  mood: Mood;
  islamicTerm: string;
  onBack: () => void;
  onOptionsPress: () => void;
  activeIndex: number;
  totalCards: number;
  scrollY?: Animated.Value;
}

const LAYER_LABELS = ['Verse', 'Context', 'Practice', 'Reflection'];

const GuidanceHeader: React.FC<GuidanceHeaderProps> = ({
  mood,
  onBack,
  onOptionsPress,
  activeIndex,
  totalCards,
  scrollY,
}) => {
  const insets = useSafeAreaInsets();
  const moodStyle = MoodColors[mood] || MoodColors.Calm;

  // Subtle fade for progress dots
  const dotAnims = useRef(
    Array.from({ length: totalCards }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    dotAnims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: i <= activeIndex ? 1 : 0,
        useNativeDriver: false,
        damping: 20,
        stiffness: 120,
      }).start();
    });
  }, [activeIndex]);

  const handleBack = () => {
    HapticsService.impactAsync('MEDIUM');
    onBack();
  };

  const handleOptions = () => {
    HapticsService.selectionAsync();
    onOptionsPress();
  };

  // On verse layer (index 0), header is more transparent to maximize immersion
  const isVerseLayer = activeIndex === 0;

  return (
    <View
      style={[
        styles.headerContainer,
        { paddingTop: insets.top + Spacing.xs },
      ]}
    >
      {/* Top Row: back, dots, options */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>

        {/* Progress dots — small, spiritual, not a task bar */}
        {totalCards > 1 && (
          <View style={styles.dotsContainer}>
            {Array.from({ length: totalCards }).map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: dotAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['rgba(245, 237, 227, 0.15)', moodStyle.accent],
                    }),
                    width: i === activeIndex ? 18 : 6,
                    opacity: dotAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, i === activeIndex ? 1 : 0.5],
                    }),
                  },
                ]}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleOptions}
          accessibilityRole="button"
          accessibilityLabel="Options"
        >
          <Ionicons name="options-outline" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Layer label — only visible on non-verse layers */}
      {!isVerseLayer && (
        <Animated.View
          style={[
            styles.labelContainer,
            scrollY && {
              opacity: scrollY.interpolate({
                inputRange: [0, 40],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <Text style={[styles.layerLabel, { color: moodStyle.accent }]}>
            {LAYER_LABELS[activeIndex]}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  labelContainer: {
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  layerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
});

export default GuidanceHeader;
