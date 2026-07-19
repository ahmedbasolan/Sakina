import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/DesignSystem';
import { Content } from '../types';
import { GeometricOrnament } from './VerseLayer';
import { HapticsService } from '../services/hapticsService';

interface HadithLayerProps {
  hadith: Content;
  accentColor?: string;
  scrollY?: Animated.Value;
  topInset?: number;
}

/**
 * HadithLayer — the hadith step of a journey session, rendered in the same
 * immersive language as VerseLayer (its neighbour in the layer pager): no
 * card, no box — the text floats directly on the celestial background with
 * the glowing serif reference block, ornamental divider, breathing geometric
 * ornament, and the staged reveal. The previous boxed blur-card read as a
 * different (and flatter) product than the verse it sits beside.
 */
const HadithLayer: React.FC<HadithLayerProps> = ({
  hadith,
  accentColor = Colors.accent.primary,
  scrollY,
  topInset = 0,
}) => {
  const arabic = hadith.arabicText || '';
  const translation = hadith.englishTranslation || hadith.translation || '';
  const grading = (hadith.propheticPractice?.grading || 'authentic')
    .replace(/_/g, ' ')
    .split(' ')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const isLongArabic = arabic.length > 200;
  const isLongTranslation = translation.length > 200;

  // Staged reveal, mirroring VerseLayer: Arabic → divider → translation →
  // reference. A tap anywhere skips straight to the settled state.
  const arabicOpacity = useRef(new Animated.Value(0)).current;
  const arabicSlide = useRef(new Animated.Value(15)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;
  const transOpacity = useRef(new Animated.Value(0)).current;
  const transSlide = useRef(new Animated.Value(10)).current;
  const refOpacity = useRef(new Animated.Value(0)).current;
  const [revealComplete, setRevealComplete] = useState(false);

  useEffect(() => {
    arabicOpacity.setValue(0);
    arabicSlide.setValue(15);
    dividerOpacity.setValue(0);
    transOpacity.setValue(0);
    transSlide.setValue(10);
    refOpacity.setValue(0);
    setRevealComplete(false);

    const sequence = Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(arabicOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(arabicSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.delay(400),
      Animated.timing(dividerOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(transOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(transSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(refOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]);

    const hapticTimer = setTimeout(() => {
      HapticsService.impactAsync('LIGHT');
    }, 100);

    sequence.start(() => setRevealComplete(true));
    return () => {
      sequence.stop();
      clearTimeout(hapticTimer);
    };
  }, [arabic, translation]);   // eslint-disable-line react-hooks/exhaustive-deps

  const skipReveal = () => {
    if (revealComplete) return;
    arabicOpacity.setValue(1);
    arabicSlide.setValue(0);
    dividerOpacity.setValue(1);
    transOpacity.setValue(1);
    transSlide.setValue(0);
    refOpacity.setValue(1);
    setRevealComplete(true);
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <GeometricOrnament size={160} color={accentColor} />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onTouchEnd={skipReveal}
        onScroll={
          scrollY
            ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
            })
            : undefined
        }
      >
        {/* ── Reference at top — flourish, glowing source, grading row ── */}
        <Animated.View style={[styles.referenceTop, { opacity: refOpacity }]}>
          <View style={styles.refFlourish}>
            <View style={[styles.refFlLine, { backgroundColor: accentColor + '25' }]} />
            <View style={[styles.refFlDiamond, { backgroundColor: accentColor + '40' }]} />
            <View style={[styles.refFlLine, { backgroundColor: accentColor + '25' }]} />
          </View>

          <Text style={[styles.sourceName, { textShadowColor: accentColor + '50' }]}>
            {hadith.source}
          </Text>
          <View style={styles.gradingRow}>
            <View style={[styles.refDot, { backgroundColor: accentColor + '50' }]} />
            <Text style={[styles.gradingText, { color: accentColor }]}>{grading}</Text>
            <View style={[styles.refDot, { backgroundColor: accentColor + '50' }]} />
          </View>
        </Animated.View>

        {/* ── Hadith content ── */}
        {arabic !== '' && (
          <Animated.View style={{ opacity: arabicOpacity, transform: [{ translateY: arabicSlide }] }}>
            <Text style={isLongArabic ? styles.arabicCompact : styles.arabic} allowFontScaling>
              {arabic}
            </Text>
          </Animated.View>
        )}

        {arabic !== '' && (
          <Animated.View style={[styles.divider, { opacity: dividerOpacity }]}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDiamond} />
            <View style={styles.dividerLine} />
          </Animated.View>
        )}

        <Animated.View style={{ opacity: transOpacity, transform: [{ translateY: transSlide }] }}>
          <Text
            style={[styles.translation, isLongTranslation && styles.translationCompact]}
            allowFontScaling
          >
            {translation}
          </Text>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Match VerseLayer's gutter so the two layers of the pager breathe alike.
    paddingHorizontal: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexGrow: 1,
    paddingTop: Spacing.xxl,
    // Clearance for the pager's bottom chrome (dots + layer label).
    paddingBottom: 120,
  },

  /* ── Reference at top ── */
  referenceTop: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  refFlourish: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: 80,
    marginBottom: Spacing.md,
  },
  refFlLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  refFlDiamond: {
    width: 4,
    height: 4,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  // Slightly under VerseLayer's 20pt surah name: hadith sources ("Bukhari
  // 6465 / Muslim 782") run longer than surah names and must not wrap
  // awkwardly at display size.
  sourceName: {
    fontFamily: Typography.fonts.serif,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.text.primary,
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
    opacity: 0.9,
  },
  gradingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 6,
  },
  refDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  gradingText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2.5,
    opacity: 0.65,
    textTransform: 'uppercase',
  },

  /* ── Arabic ── */
  // lineHeight ≥ ~2.1× the font size: Amiri-Quran's harakat sit far above and
  // below the baseline, and a tighter line box clips them.
  arabic: {
    fontSize: 24,
    fontFamily: Typography.fonts.arabic,
    lineHeight: 50,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  arabicCompact: {
    fontSize: 20,
    fontFamily: Typography.fonts.arabic,
    lineHeight: 42,
    color: Colors.text.primary,
    textAlign: 'center',
  },

  /* ── Divider ── */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.xxl,
    width: '50%',
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${Colors.text.primary}59`,
  },
  dividerDiamond: {
    width: 5,
    height: 5,
    borderRadius: 1,
    backgroundColor: `${Colors.text.primary}66`,
    transform: [{ rotate: '45deg' }],
  },

  /* ── Translation — the main reading text, serif like the verse layer ── */
  translation: {
    fontFamily: Typography.fonts.serif,
    fontSize: 21,
    lineHeight: 34,
    color: Colors.text.primary,
    textAlign: 'center',
    fontWeight: '400',
    paddingHorizontal: Spacing.sm,
    opacity: 0.95,
  },
  translationCompact: {
    fontSize: 18,
    lineHeight: 30,
  },
});

export default React.memo(HadithLayer);
