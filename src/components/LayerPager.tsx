import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/DesignSystem';
import { HapticsService } from '../services/hapticsService';

interface LayerPagerProps {
  total: number;
  current: number;
  /** Label per layer — the prev and next labels are shown as tappable buttons. */
  labels?: string[];
  accentColor?: string;
  /** Called when the user taps prev or next. Required for the buttons to work. */
  onLayerChange?: (index: number) => void;
  /** Called when the user taps "Next verse" on the final layer (e.g. Context). */
  onNextVerse?: () => void;
}

const DOT = 6;
const GAP = 10;

/**
 * Full-width layer navigation strip.
 *
 * Left button  — taps back to the previous layer (hidden on layer 0).
 * Centre       — animated dot indicators; tap any dot to jump directly.
 * Right button — taps forward to the next layer (hidden on the last layer).
 *
 * All touch targets meet the 44 pt minimum so thumbs can reach them easily.
 */
const LayerPager: React.FC<LayerPagerProps> = ({
  total,
  current,
  labels = [],
  accentColor = Colors.accent.primary,
  onLayerChange,
  onNextVerse,
}) => {
  const insets = useSafeAreaInsets();

  // Animated pill slides across the dots track.
  const pillAnim = useRef(new Animated.Value(current)).current;

  useEffect(() => {
    Animated.spring(pillAnim, {
      toValue: current,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
    }).start();
  }, [current]);

  const pillTranslateX = pillAnim.interpolate({
    inputRange: [0, Math.max(total - 1, 1)],
    outputRange: [0, Math.max(total - 1, 1) * (DOT + GAP)],
  });

  const hasPrev = current > 0;
  const hasNext = current < total - 1;

  const goTo = (index: number) => {
    HapticsService.impactAsync('LIGHT');
    onLayerChange?.(index);
  };

  const handleNextVerse = () => {
    HapticsService.impactAsync('LIGHT');
    onNextVerse?.();
  };

  // The right-hand action: advance a layer when one exists, otherwise jump to
  // the next verse (so users can move on without returning to the verse layer).
  const showNextAction = hasNext || !!onNextVerse;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom + 4, 10) }]}>
      {/* ── Prev button ───────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.navBtn, !hasPrev && styles.navBtnHidden]}
        onPress={() => hasPrev && goTo(current - 1)}
        activeOpacity={0.65}
        disabled={!hasPrev}
        hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
        accessibilityRole="button"
        accessibilityLabel={hasPrev ? `Go back to ${labels[current - 1] ?? 'previous'}` : undefined}
      >
        <Ionicons
          name="chevron-back"
          size={14}
          color={hasPrev ? 'rgba(245,237,227,0.55)' : 'transparent'}
        />
        <Text
          style={[styles.navLabel, { color: 'rgba(245,237,227,0.55)' }]}
          numberOfLines={1}
        >
          {labels[current - 1] ?? ''}
        </Text>
      </TouchableOpacity>

      {/* ── Dot track ─────────────────────────────────────────────────── */}
      <View style={styles.dotsWrap}>
        {Array.from({ length: total }).map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => goTo(i)}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Go to ${labels[i] ?? `layer ${i + 1}`}`}
          >
            <View
              style={[
                styles.dot,
                i === current && { backgroundColor: accentColor, opacity: 1 },
              ]}
            />
          </TouchableOpacity>
        ))}
        {/* Moving accent pill overlaid on the dots */}
        <Animated.View
          style={[
            styles.pill,
            {
              backgroundColor: accentColor,
              shadowColor: accentColor,
              transform: [{ translateX: pillTranslateX }],
            },
          ]}
          pointerEvents="none"
        />
      </View>

      {/* ── Next action — tappable: next layer, or next verse on the last layer ── */}
      <TouchableOpacity
        style={[styles.navBtn, styles.navBtnRight, !showNextAction && styles.navBtnHidden]}
        onPress={() => (hasNext ? goTo(current + 1) : handleNextVerse())}
        activeOpacity={0.65}
        disabled={!showNextAction}
        hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
        accessibilityRole="button"
        accessibilityLabel={hasNext ? `Go to ${labels[current + 1] ?? 'next'}` : 'Next verse'}
      >
        <Text
          style={[styles.navLabel, { color: 'rgba(245,237,227,0.6)' }]}
          numberOfLines={1}
        >
          {hasNext ? (labels[current + 1] ?? '') : 'Next verse'}
        </Text>
        <Ionicons
          name={hasNext ? 'chevron-up' : 'arrow-forward'}
          size={14}
          color="rgba(245,237,227,0.6)"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    minHeight: 44,        // thumb-safe minimum height
  },

  /* ── Nav buttons ── */
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 80,
    minHeight: 44,        // WCAG touch target
    justifyContent: 'flex-start',
  },
  navBtnRight: {
    justifyContent: 'flex-end',
  },
  navBtnHidden: {
    opacity: 0,
    pointerEvents: 'none' as any,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  /* ── Dots ── */
  dotsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
    position: 'relative',
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: 'rgba(245, 237, 227, 0.18)',
  },
  pill: {
    position: 'absolute',
    left: 0,
    top: (DOT - 14) / 2,
    width: DOT,
    height: 14,
    borderRadius: DOT / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 3,
  },
});

export default React.memo(LayerPager);
