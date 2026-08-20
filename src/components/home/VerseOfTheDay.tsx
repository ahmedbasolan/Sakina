import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FrostedSurface } from '../FrostedSurface';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/DesignSystem';
import { DailyVerse } from '../../services/dailyVerseService';

interface VerseOfTheDayProps {
  dailyVerse: DailyVerse;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

interface VerseTextSizes {
  arabicSize: number;
  arabicLineHeight: number;
  translationSize: number;
  translationLineHeight: number;
}

// Tiered by Arabic character count (a reliable proxy for rendered length —
// every pool entry's translation scales with its Arabic). Breakpoints were
// chosen against the actual pool's length distribution, not guessed blind.
function getVerseTextSizes(arabicLength: number): VerseTextSizes {
  if (arabicLength <= 75) {
    return { arabicSize: 22, arabicLineHeight: 36, translationSize: 15, translationLineHeight: 23 };
  }
  if (arabicLength <= 130) {
    return { arabicSize: 19, arabicLineHeight: 32, translationSize: 14, translationLineHeight: 21 };
  }
  if (arabicLength <= 180) {
    return { arabicSize: 16.5, arabicLineHeight: 27, translationSize: 13, translationLineHeight: 19 };
  }
  if (arabicLength <= 250) {
    return { arabicSize: 14, arabicLineHeight: 23, translationSize: 11.5, translationLineHeight: 17 };
  }
  return { arabicSize: 10.5, arabicLineHeight: 18, translationSize: 9, translationLineHeight: 13.5 };
}

function VerseOfTheDayBase({ dailyVerse, fadeAnim, slideAnim }: VerseOfTheDayProps) {
  // HomeScreen re-renders this every ~60s (prayer-context poll, clock tick)
  // even though dailyVerse itself only changes once a day — memoize so that
  // isn't recomputing the tier lookup and reallocating style objects on
  // every unrelated tick.
  const sizes = useMemo(() => getVerseTextSizes(dailyVerse.arabic.length), [dailyVerse.arabic]);

  return (
    <Animated.View style={[styles.verseSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Android never blurred here (no experimentalBlurMethod was ever set,
          and its default is 'none'), so this only swaps expo-blur's neutral
          grey fallback for the app's navy — and drops a native view. The
          card's own `verseCard` fill is background.secondary at 0x99; this
          nudges it to 0xA8 to stand in for the faint wash the fallback used
          to add on top. */}
      <FrostedSurface
        intensity={16}
        androidFill={`${Colors.background.secondary}A8`}
        style={styles.verseCard}
      >
        {/* Gold corner tint — same diagonal-wash treatment as the streak bar
            (1F→05 alpha), so this card reads with the same warmth/pop instead
            of the flatter steel-blue wash it used to carry. */}
        <LinearGradient
          colors={[`${Colors.accent.primary}1F`, `${Colors.accent.primary}05`]}
          style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.xl }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
        />

        {/* Gold top line */}
        <LinearGradient colors={['transparent', Colors.accent.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verseBorderLine} />

        {/* Badge */}
        <View style={styles.verseBadge}>
          <Text style={styles.verseBadgeStar}>★</Text>
          <Text style={styles.verseBadgeText}>VERSE OF THE DAY</Text>
          <Text style={styles.verseBadgeStar}>★</Text>
        </View>

        {/* Arabic — only render if non-empty to avoid orphaned whitespace */}
        {!!dailyVerse.arabic && (
          <Text style={[styles.verseArabic, { fontSize: sizes.arabicSize, lineHeight: sizes.arabicLineHeight }]}>
            {dailyVerse.arabic}
          </Text>
        )}

        {/* Ornament divider */}
        <Text style={styles.ornamentStar}>✦</Text>

        {/* Translation */}
        <Text style={[styles.verseTranslation, { fontSize: sizes.translationSize, lineHeight: sizes.translationLineHeight }]}>
          {dailyVerse.translation || 'Translation not available'}
        </Text>

        {/* Reference */}
        {!!dailyVerse.ref && (
          <Text style={styles.verseRef}>— {dailyVerse.ref}</Text>
        )}

        {/* Gold bottom line */}
        <LinearGradient colors={['transparent', Colors.accent.primary + '60', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verseBorderLineBottom} />
      </FrostedSurface>
    </Animated.View>
  );
}

export const VerseOfTheDay = React.memo(VerseOfTheDayBase);

const styles = StyleSheet.create({
  verseSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  verseCard: {
    // Sizes to content instead of a fixed height — a fixed box tall enough
    // for the longest ayah in the pool left short verses swimming in empty
    // space on first open. getVerseTextSizes already shrinks long verses to
    // fit comfortably, so auto-height stays compact day to day without
    // clipping anything (overflow:hidden here only rounds the BlurView
    // corners, it never crops content since the card grows to fit it).
    backgroundColor: Colors.background.secondary + '99',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.accent.primary + '40',
  },
  verseBorderLine: {
    height: 1,
    marginBottom: 20,
  },
  verseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  verseBadgeStar: {
    fontSize: 12,
    color: Colors.accent.primary,
  },
  verseBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent.primary,
    letterSpacing: 1.5,
  },
  verseArabic: {
    // fontSize/lineHeight are supplied per-verse by getVerseTextSizes so a
    // long ayah shrinks to fit the fixed card instead of growing it.
    color: Colors.text.primary,
    textAlign: 'center',
    fontFamily: Typography.fonts.arabic,
    paddingBottom: 8,
    marginBottom: 20,
    textShadowColor: 'rgba(212, 175, 55, 0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  ornamentStar: {
    fontSize: 16,
    color: Colors.accent.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  verseTranslation: {
    // fontSize/lineHeight are supplied per-verse by getVerseTextSizes.
    fontFamily: Typography.fonts.serif,
    color: `${Colors.text.primary}D9`,
    textAlign: 'center',
    marginBottom: 12,
  },
  verseRef: {
    fontFamily: Typography.fonts.serif,
    fontSize: 12,
    color: `${Colors.text.primary}B3`,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  verseBorderLineBottom: {
    height: 1,
    marginTop: 20,
  },
});
