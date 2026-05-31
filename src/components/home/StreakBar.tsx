import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/DesignSystem';
import { CrescentIcon } from './CrescentIcon';

interface StreakBarProps {
  streakDays: number;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  onPress: () => void;
}

export function StreakBar({ streakDays, fadeAnim, slideAnim, onPress }: StreakBarProps) {
  return (
    <Animated.View style={[styles.streakSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <LinearGradient colors={['#0C2214', '#0A1A0E']} style={styles.streakBar}>
          {/* Crescent icon + streak info */}
          <View style={styles.streakLeft}>
            <View style={styles.streakFlameContainer}>
              <CrescentIcon size={18} color="#4ADE80" />
            </View>
            <View>
              {streakDays === 0 ? (
                <>
                  <Text style={styles.streakText}>Begin your streak today</Text>
                  <Text style={styles.streakHint}>Check in to start your journey</Text>
                </>
              ) : (
                <>
                  <Text style={styles.streakText}>{streakDays}-Day Streak</Text>
                  <View style={styles.streakMoons}>
                    {[...Array(7)].map((_, i) => (
                      <View key={i} style={[styles.streakMoonDot, i < streakDays ? styles.streakMoonActive : null]} />
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
          <View style={styles.streakRight}>
            <Text style={styles.streakViewText}>View</Text>
            <Ionicons name="arrow-forward" size={12} color="#2A6A2A" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  streakSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  streakBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.15)',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakFlameContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4ADE80',
    marginBottom: 2,
  },
  streakHint: {
    fontSize: 11,
    color: 'rgba(74, 222, 128, 0.45)',
    letterSpacing: 0.2,
  },
  streakMoons: {
    flexDirection: 'row',
    gap: 4,
  },
  streakMoonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
  },
  streakMoonActive: {
    backgroundColor: '#4ADE80',
  },
  streakRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakViewText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A6A2A',
  },
});
