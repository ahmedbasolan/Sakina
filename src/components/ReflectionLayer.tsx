import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
const { height } = Dimensions.get('window');
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { HapticsService } from '../services/hapticsService';

interface ReflectionLayerProps {
  prompt: string;
  onComplete: (reflection: string) => void;
  buttonText?: string;
  footerText?: string;
  requireText?: boolean;
  scrollY?: Animated.Value;
  /** Journey identity color — themes the save button, focus, and selection. */
  accentColor?: string;
}

const ReflectionLayer: React.FC<ReflectionLayerProps> = ({
  prompt,
  onComplete,
  buttonText = 'Complete Session',
  footerText = 'Your reflections are private and only you can see them.',
  scrollY,
  accentColor = Colors.accent.secondary,
}) => {
  const insets = useSafeAreaInsets();
  const [reflection, setReflection] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Gentle entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleComplete = () => {
    HapticsService.impactAsync('MEDIUM');
    onComplete(reflection);
  };

  const handleSkip = () => {
    HapticsService.impactAsync('LIGHT');
    onComplete('');
  };

  const hasText = reflection.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + Spacing.md, height * 0.02),
            paddingBottom: Math.max(insets.bottom + Spacing.lg, 80),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={
          scrollY
            ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
            })
            : undefined
        }
      >
        {/* Bismillah ornament */}
        <Animated.View style={[styles.ornamentArea, { opacity: fadeAnim }]}>
          <Text style={styles.bismillah}>بِسْمِ ٱللَّٰهِ</Text>
          <View style={styles.ornamentDivider}>
            <View style={styles.ornamentLine} />
            <View style={styles.ornamentDiamond} />
            <View style={styles.ornamentLine} />
          </View>
        </Animated.View>

        {/* Prompt */}
        <Animated.View style={[
          styles.promptArea,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
          <Text style={styles.promptText}>{prompt}</Text>
        </Animated.View>

        {/* Journal Input — frosted so the immersive background blends instead
            of showing almost fully through a barely-tinted rectangle */}
        <Animated.View style={[
          styles.journalContainer,
          isFocused && styles.journalContainerFocused,
          isFocused && { borderColor: accentColor + '40' },
          { opacity: fadeAnim },
        ]}>
          {/* experimentalBlurMethod — same Android blur fix as the tab bar. */}
          <BlurView
            intensity={20}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          <TextInput
            style={styles.journalInput}
            placeholder="Write freely — even a few words count"
            placeholderTextColor={`${Colors.text.primary}2E`}
            multiline
            value={reflection}
            onChangeText={setReflection}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            selectionColor={accentColor}
            textAlignVertical="top"
          />

          {/* Subtle line decoration inside input */}
          {!hasText && !isFocused && (
            <View style={styles.journalLines} pointerEvents="none">
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.journalLine} />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Spacer pushes actions toward bottom on tall screens */}
        <View style={styles.spacer} />

        {/* Actions */}
        <View style={styles.actionsArea}>
          {hasText ? (
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: accentColor, shadowColor: accentColor }]}
              onPress={handleComplete}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={buttonText}
            >
              <Ionicons name="bookmark-outline" size={18} color={Colors.background.primary} />
              <Text style={styles.saveButtonText}>{buttonText.toUpperCase()}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="I'll reflect later"
            >
              <Text style={styles.skipText}>I'll reflect later</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Privacy */}
        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed-outline" size={11} color={Colors.text.muted} />
          <Text style={styles.privacyText}>{footerText}</Text>
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    flexGrow: 1,
  },
  spacer: {
    flex: 1,
    minHeight: Spacing.xl,
  },

  /* ── Bismillah Ornament ── */
  ornamentArea: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  bismillah: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 22,
    // Muted vs. solid accent, but kept legible — opacity 0.7 was washing
    // this out to pale grey against the dark background.
    color: `${Colors.accent.secondary}D9`,
    marginBottom: Spacing.md,
  },
  ornamentDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '40%',
  },
  ornamentLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.accent.muted,
  },
  ornamentDiamond: {
    width: 4,
    height: 4,
    borderRadius: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    transform: [{ rotate: '45deg' }],
  },

  /* ── Prompt ── */
  promptArea: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.sm,
  },
  promptText: {
    fontFamily: Typography.fonts.serif,
    fontSize: 20,
    lineHeight: 32,
    color: Colors.text.primary,
    textAlign: 'center',
    opacity: 0.9,
  },

  /* ── Journal Input ── */
  journalContainer: {
    backgroundColor: 'rgba(255, 235, 210, 0.03)',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    padding: Spacing.xl,
    minHeight: height * 0.25,
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 210, 0.06)',
    marginBottom: Spacing.xl,
  },
  journalContainerFocused: {
    borderColor: Colors.accent.muted,
    backgroundColor: 'rgba(255, 235, 210, 0.05)',
  },
  journalInput: {
    flex: 1,
    fontSize: 17,
    color: Colors.text.primary,
    lineHeight: 28,
    fontFamily: Typography.fonts.serif,
    minHeight: 140,
  },

  /* Ghost lines when empty */
  journalLines: {
    position: 'absolute',
    top: Spacing.xl + 28, // after first line of text
    left: Spacing.xl,
    right: Spacing.xl,
    gap: 28, // match line height
  },
  journalLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${Colors.text.primary}0F`,
  },

  /* ���─ Actions ── */
  actionsArea: {
    marginBottom: Spacing.lg,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.secondary,
    borderRadius: BorderRadius.xl,
    height: 54,
    shadowColor: Colors.accent.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: 13,
    color: Colors.background.primary,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
  },
  skipText: {
    fontSize: 14,
    color: Colors.text.muted,
    fontWeight: '500',
  },

  /* ── Privacy ── */
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  privacyText: {
    fontSize: 11,
    color: Colors.text.muted,
    opacity: 0.6,
  },
});

export default React.memo(ReflectionLayer);
