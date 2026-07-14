import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MoodConfig } from '../../types';
import { Typography } from '../../theme/DesignSystem';
import { useReduceMotion } from '../../hooks/useReduceMotion';

interface MoodButtonProps {
  mood: MoodConfig;
  isChecked: boolean;
  isRecentlySelected?: boolean;
  onPress: () => void;
  animDelay: number;
}

function MoodButton({ mood, isChecked, isRecentlySelected, onPress, animDelay }: MoodButtonProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    Animated.sequence([
      Animated.delay(animDelay),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  // Store the loop animation so we can stop it on unmount.
  // Without this, the infinite native-driver loop fires callbacks into an
  // already-unmounted component (e.g. after navigation away from HomeScreen).
  const glowLoopRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (isChecked && !reduceMotion) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      );
      loop.start();
      glowLoopRef.current = loop;
    } else {
      glowLoopRef.current?.stop();
      glowLoopRef.current = null;
      glowAnim.setValue(0);
    }
    return () => {
      glowLoopRef.current?.stop();
      glowLoopRef.current = null;
    };
  }, [isChecked, reduceMotion]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.9, friction: 3, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });

  return (
    <Animated.View style={[styles.moodButtonWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[
          styles.moodButton,
          {
            backgroundColor: mood.bgColor,
            borderColor: isChecked ? mood.color + '60' : mood.borderColor,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${mood.label} — ${mood.sublabel}`}
        accessibilityHint="Double tap to receive spiritual guidance for this mood"
        accessibilityState={{ selected: isChecked }}
      >
        {/* Ambient glow */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: 16, backgroundColor: mood.color, opacity: glowOpacity },
          ]}
        />

        {/* Icon */}
        <View
          style={[
            styles.moodIconContainer,
            { backgroundColor: mood.color + '16', borderColor: mood.color + '30' },
          ]}
        >
          <Ionicons name={mood.iconName as any} size={22} color={mood.color} />
        </View>

        {/* Label */}
        <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>

        {/* Sublabel */}
        <Text style={[styles.moodSublabel, { color: mood.color, opacity: isChecked ? 0.75 : 0.45 }]}>
          {mood.sublabel}
        </Text>

        {/* Checked badge */}
        {isChecked && (
          <View style={[styles.checkedBadge, { backgroundColor: mood.color }]}>
            <Ionicons name="checkmark" size={8} color={mood.bgColor} />
          </View>
        )}

        {/* Recently selected dot (not today) */}
        {!isChecked && isRecentlySelected && (
          <View style={[styles.recentDot, { backgroundColor: mood.color }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  moodButtonWrapper: {
    flex: 1,
    maxWidth: '48%',
  },
  moodButton: {
    backgroundColor: 'rgba(12, 18, 28, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  moodIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  moodSublabel: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: Typography.fonts.serif,
    fontStyle: 'italic',
  },
  checkedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
