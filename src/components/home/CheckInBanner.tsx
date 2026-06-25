import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/DesignSystem';
import { useReduceMotion } from '../../hooks/useReduceMotion';

interface CheckInBannerProps {
  onDismiss: () => void;
}

export function CheckInBanner({ onDismiss }: CheckInBannerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion]);

  return (
    <View style={styles.checkinBanner}>
      <View style={styles.checkinBannerLeft}>
        <Animated.View
          style={[styles.pulsingDot, { transform: [{ scale: pulseAnim }] }]}
        />
        <Text style={styles.checkinBannerText}>
          Your heart has a story today — take a moment
        </Text>
      </View>
      <TouchableOpacity onPress={onDismiss} style={styles.checkinDismiss}>
        <Ionicons name="close" size={10} color={Colors.accent.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  checkinBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 211, 198, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(46, 211, 198, 0.15)',
  },
  checkinBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent.primary,
  },
  checkinBannerText: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.85)',
    flex: 1,
  },
  checkinDismiss: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(46, 211, 198, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
