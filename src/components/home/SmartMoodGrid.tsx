import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Mood, MoodConfig } from '../../types';
import { Colors, Typography } from '../../theme/DesignSystem';
import { getMoodsForTime } from '../../utils/moodTimeMapping';
import { useReduceMotion } from '../../hooks/useReduceMotion';


interface SmartMoodGridProps {
  moodConfigs: MoodConfig[];
  selectedMood: Mood | null;
  loadingMood?: Mood | null;
  onMoodPress: (mood: Mood) => void;
}

// ── SmartMoodCard ─────────────────────────────────────────────────────────────
// memo: only re-renders when mood object ref, isChecked, or onPress changes.
// The parent passes stable onPress refs (useCallback keyed on mood.id) so
// memo's shallow comparison holds — card never re-renders from an unrelated
// HomeScreen state update.

const SmartMoodCard = memo(function SmartMoodCard({
  mood,
  isChecked,
  isLoading,
  onPress,
  cardWidth,
}: {
  mood: MoodConfig;
  isChecked: boolean;
  isLoading: boolean;
  onPress: () => void;
  cardWidth: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (isChecked && !isLoading && !reduceMotion) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      glowAnim.setValue(0);
    }
    // isLoading is read in the condition above but was missing here, so when
    // a mood tap's guidance fetch finished (isLoading true -> false) with
    // isChecked already true and unchanged, this effect never re-ran — the
    // "checked" glow that's supposed to start once loading settles never
    // played on the normal success path.
  }, [isChecked, isLoading, reduceMotion]);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.92, friction: 3, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  }, [onPress]);

  const glowOpacity = useMemo(
    () => glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] }),
    [],
  );

  return (
    <Animated.View style={[styles.cardWrapper, { width: cardWidth, transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={styles.cardTouch}
        accessibilityRole="button"
        accessibilityLabel={`${mood.label} — ${mood.sublabel}`}
        accessibilityHint="Tap to receive guidance for this mood"
      >
        <LinearGradient
          colors={[Colors.background.secondary, Colors.background.primary]}
          style={[styles.card, { borderColor: isChecked ? mood.color + 'CC' : mood.color + '40' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Mood-color tint — same low-alpha diagonal wash as the streak bar */}
          <LinearGradient
            colors={[mood.color + '1F', mood.color + '05']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
          />
          {/* Checked glow overlay */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: 15, backgroundColor: mood.color, opacity: glowOpacity },
            ]}
          />
          <View style={styles.cardRow}>
            <View style={[
              styles.iconCircle,
              isChecked
                ? { backgroundColor: mood.color + '40', borderColor: mood.color + 'CC' }
                : { backgroundColor: mood.color + '26', borderColor: mood.color + '40' },
            ]}>
              <Ionicons name={mood.iconName as any} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.cardText}>
              <Text
                style={[styles.cardLabel, { color: '#FFFFFF' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.86}
              >
                {mood.label.charAt(0) + mood.label.slice(1).toLowerCase()}
              </Text>
              <Text
                style={[
                  styles.cardSublabel,
                  { color: 'rgba(255,255,255,0.75)', opacity: isChecked ? 0.9 : 0.7 },
                ]}
              >
                {mood.sublabel}
              </Text>
            </View>
          </View>
          {isLoading && (
            <View style={[styles.checkedBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.badgeSpinner} />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ── SmartMoodGrid ─────────────────────────────────────────────────────────────

export const SmartMoodGrid = memo(function SmartMoodGrid({
  moodConfigs,
  selectedMood,
  loadingMood,
  onMoodPress,
}: SmartMoodGridProps) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 48 - 12) / 2;
  const [expanded, setExpanded] = useState(false);

  // Compute time-based moods once per mount — getMoodsForTime reads the clock
  // and does array filtering; calling it on every render is wasteful.
  const timeMoods = useMemo(() => getMoodsForTime(), []);

  const visibleMoods = expanded ? moodConfigs : moodConfigs.filter((m) => timeMoods.includes(m.id));

  // Stable per-mood onPress callbacks so SmartMoodCard memo holds.
  // Re-created only if moodConfigs or onMoodPress changes.
  const pressHandlers = useMemo(
    () => Object.fromEntries(moodConfigs.map((m) => [m.id, () => onMoodPress(m.id)])),
    [moodConfigs, onMoodPress],
  );

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <View>
      <View style={styles.grid}>
        {visibleMoods.map((mood) => (
          <SmartMoodCard
            key={mood.id}
            mood={mood}
            isChecked={selectedMood === mood.id}
            isLoading={loadingMood === mood.id}
            onPress={pressHandlers[mood.id]}
            cardWidth={cardWidth}
          />
        ))}
      </View>
      <TouchableOpacity
        onPress={toggleExpand}
        style={styles.expandBtn}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Show less' : `See all ${moodConfigs.length} moods`}
        accessibilityState={{ expanded }}
      >
        <Text style={styles.expandText}>
          {expanded ? 'Show less' : `See all ${moodConfigs.length}`}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color="#8BA4BF"
        />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardWrapper: {},
  cardTouch: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    minHeight: 80,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardSublabel: {
    fontSize: 11,
    fontFamily: Typography.fonts.serif,
    fontStyle: 'italic',
    marginTop: 2,
  },
  checkedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeSpinner: {
    transform: [{ scale: 0.6 }],
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  expandText: {
    fontSize: 13,
    color: '#8BA4BF',
    letterSpacing: 0.3,
  },
});
