import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mood } from '../types';
import { Grid, Colors, Typography } from '../theme/DesignSystem';
import * as Haptics from 'expo-haptics';

interface GuidanceHeaderProps {
  mood: Mood;
  islamicTerm: string;
  onBack: () => void;
  onOptionsPress: () => void;
  activeIndex: number;
  totalCards: number;
}

const GuidanceHeader: React.FC<GuidanceHeaderProps> = ({
  mood,
  islamicTerm,
  onBack,
  onOptionsPress,
  activeIndex,
  totalCards,
}) => {
  const insets = useSafeAreaInsets();
  const saveScale = React.useRef(new Animated.Value(1)).current;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack();
  };

  const handleSave = () => {
    // Redundant in simplified header, but keeping logic if needed later
  };

  const handleOptions = () => {
    Haptics.selectionAsync();
    onOptionsPress();
  };

  return (
    <View style={[styles.appBar, { paddingTop: Math.max(insets.top, Grid.space16) + Grid.space4 }]}>
      <LinearGradient colors={Colors.headerGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.leftActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.currentMoodLabel}>CURRENT MOOD</Text>
        <View style={styles.moodRow}>
          <View style={styles.activeDotContainer}>
            <View style={styles.activeDot} />
            <View style={styles.activeDotGlow} />
          </View>
          <Text style={styles.moodValue}>
            {mood} <Text style={styles.islamicTermInline}>{islamicTerm}</Text>
          </Text>
        </View>

        {/* Story-Style Progress Bar - Positioned below mood for clarity */}
        <View style={styles.progressContainer}>
          {Array.from({ length: totalCards }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i === activeIndex && styles.progressDotActive,
                i < activeIndex && styles.progressDotVisited,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleOptions}
          accessibilityLabel="Display options"
          accessibilityRole="button"
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={Colors.white}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  appBar: {
    height: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Grid.contentPadding,
    zIndex: 100,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: Grid.space4,
    width: '100%',
    paddingHorizontal: Grid.space12,
    marginTop: Grid.space12,
    justifyContent: 'center',
  },
  progressDot: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.whiteMuted,
    borderRadius: 2,
  },
  progressDotActive: {
    backgroundColor: Colors.teal,
  },
  progressDotVisited: {
    backgroundColor: Colors.tealMuted,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10, // Slight offset for chevron alignment
  },
  leftActions: {
    width: 90, // Match rightActions for perfect center symmetry
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  currentMoodLabel: {
    fontSize: Typography.sizeDetail - 1,
    fontWeight: '700',
    color: Colors.whiteDim,
    letterSpacing: Typography.lsWide,
    textTransform: 'uppercase',
    marginBottom: Grid.space4,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Grid.space8,
  },
  activeDotContainer: {
    position: 'relative',
    width: 6,
    height: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
    zIndex: 2,
  },
  activeDotGlow: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.greenGlow,
    zIndex: 1,
  },
  moodValue: {
    fontSize: Typography.sizeSmall + 2,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: Typography.lsNormal,
  },
  islamicTermInline: {
    fontSize: Typography.sizeSmall + 2,
    fontWeight: '400',
    color: Colors.teal,
    fontStyle: 'italic',
  },
  rightActions: {
    width: 90, // Matches leftActions
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Grid.space8,
  },
  actionButton: {
    width: 40,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GuidanceHeader;
