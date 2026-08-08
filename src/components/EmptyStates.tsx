import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/DesignSystem';

// ── Types ───────────────────────────────────────────────────────────
interface BaseEmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconSize?: number;
  buttonTitle?: string;
  onButtonPress?: () => void;
  children?: React.ReactNode;
}

// ── Base Empty State Component ───────────────────────────────────────
function BaseEmptyState({
  title,
  subtitle,
  icon,
  iconSize = 56,
  buttonTitle,
  onButtonPress,
  children,
}: BaseEmptyStateProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;
  // Store the CompositeAnimation so it can be stopped on unmount.
  // Without this, the native driver fires callbacks into an already-unmounted
  // component when the user navigates away before the animation completes.
  const animRef = React.useRef<{ stop: () => void } | null>(null);

  React.useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 150,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    animRef.current = anim;
    return () => {
      animRef.current?.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={iconSize}
            color={Colors.text.muted}
            style={styles.icon}
          />
        )}

        <Text style={styles.title}>{title}</Text>

        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {children}

        {buttonTitle && onButtonPress && (
          <TouchableOpacity
            style={styles.button}
            onPress={onButtonPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={buttonTitle}
          >
            <Text style={styles.buttonText}>{buttonTitle}</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color={Colors.background.primary}
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

// ── No Reflections ─────────────────────────────────────────────────────
export function NoReflections({ onStartReflecting }: { onStartReflecting: () => void }) {
  return (
    <BaseEmptyState
      title="Start Your Spiritual Journal"
      subtitle="Reflections help you process your feelings and track your spiritual growth. Write your thoughts after reading verses or completing path lessons."
      buttonTitle="Write First Reflection"
      onButtonPress={onStartReflecting}
    >
      {/* Journal illustration */}
      <View style={styles.journalIllustration}>
        <View style={styles.journalCover}>
          <View style={styles.journalLines}>
            <View style={styles.journalLine} />
            <View style={styles.journalLine} />
            <View style={styles.journalLine} />
          </View>
        </View>
        <View style={styles.journalPen}>
          <View style={styles.journalPenLine} />
        </View>
      </View>

      {/* Research stat */}
      <View style={styles.researchBox}>
        <Text style={styles.researchLabel}>
          <Text style={styles.researchLabelBold}>Research shows</Text> that journaling about your
          faith increases gratitude by 25% and reduces anxiety by 30%.
        </Text>
      </View>
    </BaseEmptyState>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
    minHeight: 400,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    gap: 16,
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Button — uses Sakina gold, not indigo
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background.primary,
  },
  buttonIcon: {
    transform: [{ rotate: '-45deg' }],
  },

  // Journal Illustration
  journalIllustration: {
    width: 100,
    height: 100,
    position: 'relative',
    marginBottom: 16,
  },
  journalCover: {
    position: 'absolute',
    width: 80,
    height: 100,
    backgroundColor: Colors.glass.light,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.glass.border,
    left: 10,
  },
  journalLines: {
    position: 'absolute',
    left: 20,
    top: 20,
    gap: 8,
  },
  journalLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.text.muted,
    borderRadius: 1,
  },
  journalPen: {
    position: 'absolute',
    top: 40,
    right: 5,
    width: 30,
    height: 4,
    backgroundColor: `${Colors.accent.primary}CC`,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  journalPenLine: {
    width: 30,
    height: 4,
    backgroundColor: `${Colors.accent.primary}CC`,
    borderRadius: 2,
  },

  // Research Box — gold accent border
  researchBox: {
    backgroundColor: Colors.glass.light,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.primary,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  researchLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  researchLabelBold: {
    fontWeight: '600',
    color: Colors.text.primary,
  },
});
