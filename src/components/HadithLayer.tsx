import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ViewStyle,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, Typography, BorderRadius, Elevation } from '../theme/DesignSystem';
import { Content } from '../types';

interface HadithLayerProps {
  hadith: Content;
  accentColor?: string;
  scrollY?: Animated.Value;
  topInset?: number;
}

const HadithLayer: React.FC<HadithLayerProps> = ({
  hadith,
  accentColor = Colors.accent.primary,
  scrollY,
  topInset = Spacing.lg,
}) => {
  const containerStyle: ViewStyle = {
    marginTop: topInset,
    marginHorizontal: Spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: accentColor,
    overflow: 'hidden',
    ...Elevation.medium,
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.contentContainer}
      scrollEventThrottle={16}
      onScroll={scrollY ? (e) => scrollY.setValue(e.nativeEvent.contentOffset.y) : undefined}
    >
      <View style={containerStyle}>
        {/* tint="dark" is not optional on a dark surface: expo-blur defaults to
            the LIGHT tint, which on Android renders as a flat opaque grey wash
            rather than a blur — the card read as an unstyled slab. Every other
            BlurView in this codebase passes tint="dark"; this was the only one
            that didn't, and at intensity 85 vs the 14–65 its siblings use. */}
        <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
          {/* Arabic text */}
          {hadith.arabicText && (
            <Text
              style={[
                styles.arabicText,
                { color: Colors.text.primary },
              ]}
              allowFontScaling
            >
              {hadith.arabicText}
            </Text>
          )}

          {/* English translation */}
          <Text
            style={[
              styles.translationText,
              { color: Colors.text.secondary },
            ]}
            allowFontScaling
          >
            {hadith.englishTranslation || hadith.translation || ''}
          </Text>

          {/* Grading + source line */}
          <Text
            style={[
              styles.sourceLine,
              { color: accentColor },
            ]}
            allowFontScaling
          >
            {hadith.source} · {(hadith.propheticPractice?.grading || 'authentic')
              .replace(/_/g, ' ')
              .split(' ')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')}
          </Text>
        </BlurView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    // Centre the card in the available height instead of pinning it to the top.
    // Top-aligned, it left ~55% of the screen empty below with nothing to
    // anchor the eye — unanchored void reads as "failed to load", not as calm.
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  blurContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.glass.medium}`,
  },
  // Matches VerseLayer's `arabic` (24/50) — the adjacent layer in the same
  // pager, and the place where this codebase already worked out that
  // Amiri-Quran needs lineHeight ≥ ~2.1× or the harakat clip. 20/32 was both
  // below that floor and optically smaller than the 16pt English beneath it,
  // which inverted the hierarchy: the translation outweighed the source text.
  arabicText: {
    fontSize: 24,
    fontFamily: Typography.fonts.arabic,
    lineHeight: 50,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  translationText: {
    fontSize: Typography.sizes.small,
    fontFamily: Typography.fonts.latin,
    lineHeight: Typography.sizes.small * 1.6,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  sourceLine: {
    fontSize: Typography.sizes.small,
    fontFamily: Typography.fonts.latin,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default HadithLayer;
