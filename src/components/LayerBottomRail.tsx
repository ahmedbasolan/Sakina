import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme/DesignSystem';
import { HapticsService } from '../services/hapticsService';

interface LayerBottomRailProps {
  /** Left slot — typically the expandable actions FAB. Pass the already-configured element. */
  leftSlot?: React.ReactNode;
  /** Middle swipe-hint text (e.g. "Tafsir"). Hidden when undefined. */
  nextLayerLabel?: string;
  /** Right slot tap handler — advances to the next layer (or to next verse on the final layer). */
  onNext?: () => void;
  /** Override the right-slot icon. Defaults to arrow-forward. */
  nextIcon?: keyof typeof Ionicons.glyphMap;
}

const LayerBottomRail: React.FC<LayerBottomRailProps> = ({
  leftSlot,
  nextLayerLabel,
  onNext,
  nextIcon = 'arrow-forward',
}) => {
  const hintOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!nextLayerLabel) {
      hintOpacity.setValue(0);
      return;
    }
    const timer = setTimeout(() => {
      Animated.sequence([
        Animated.timing(hintOpacity, { toValue: 0.7, duration: 600, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(hintOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]).start();
    }, 1500);
    return () => clearTimeout(timer);
  }, [nextLayerLabel]);

  return (
    <View style={styles.footer}>
      <View style={styles.slot}>{leftSlot}</View>

      <Animated.View style={[styles.center, { opacity: hintOpacity }]}>
        {nextLayerLabel ? (
          <>
            <Ionicons name="chevron-up" size={18} color={'rgba(245, 237, 227, 0.35)'} />
            <Text style={styles.hintText}>{nextLayerLabel}</Text>
          </>
        ) : null}
      </Animated.View>

      <View style={styles.slot}>
        {onNext ? (
          <TouchableOpacity
            onPress={() => {
              HapticsService.impactAsync('LIGHT');
              onNext();
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={nextLayerLabel ? `Go to ${nextLayerLabel}` : 'Next verse'}
          >
            <BlurView intensity={30} tint="dark" style={styles.nextFab}>
              <Ionicons name={nextIcon} size={22} color={Colors.text.primary} />
            </BlurView>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    minHeight: 64,
  },
  slot: {
    width: 60,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 10,
    color: 'rgba(245, 237, 227, 0.45)',
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  nextFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 235, 210, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 210, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

export default React.memo(LayerBottomRail);
