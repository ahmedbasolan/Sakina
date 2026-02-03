import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Grid, Colors, Typography } from '../theme/DesignSystem';

interface PremiumTooltipProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
}

const PremiumTooltip: React.FC<PremiumTooltipProps> = ({
  visible,
  onClose,
  message = 'Premium Feature',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 2 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  if (!visible) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
      <Animated.View
        style={[
          styles.tooltip,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={18} color={Colors.teal} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.tooltipText}>{message}</Text>
          <Text style={styles.tooltipSubtext}>Upgrade to unlock</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 15, 18, 0.75)',
    zIndex: 1000,
  },
  tooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSheet,
    paddingVertical: Grid.space16,
    paddingHorizontal: Grid.space20,
    borderRadius: Grid.borderRadiusInner,
    borderWidth: 1,
    borderColor: 'rgba(46, 211, 198, 0.2)',
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    gap: Grid.space12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 211, 198, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    gap: Grid.space4 - 2,
  },
  tooltipText: {
    fontSize: Typography.sizeBody,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  tooltipSubtext: {
    fontSize: Typography.sizeSmall,
    color: Colors.teal,
    fontWeight: '500',
  },
});

export default PremiumTooltip;
