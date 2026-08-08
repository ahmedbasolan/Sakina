import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { SurahLesson } from '../data/surahLessons';
import { GeometricOrnament } from './VerseLayer';
import ArabicText from './ArabicText';
import AudioPlayerButton from './AudioPlayerButton';
import { useReduceMotion } from '../hooks/useReduceMotion';

interface SurahLayerProps {
  lesson: SurahLesson;
  accentColor?: string;
  scrollY?: Animated.Value;
  topInset?: number;
}

/**
 * SurahLayer — a surah the day asks the user to LEARN, in full.
 *
 * Deliberately not VerseLayer. The verse layer is the immersive single ayah the
 * day's lesson is built on, centred with nothing else on screen; this is a
 * study sheet — every ayah numbered, with transliteration under the Arabic and
 * the translation under that, so someone memorising can work down it.
 *
 * It exists because the journey kept naming surahs it never showed: "add
 * Al-A'la and Al-Ghashiyah", "then An-Nas". The instruction was there and the
 * text was nowhere.
 *
 * The entrance is one fade on the whole layer, not a staged multi-node reveal —
 * see the motion note in CLAUDE.md about skip-taps stranding the settled state.
 */
const SurahLayer: React.FC<SurahLayerProps> = ({
  lesson,
  accentColor = Colors.accent.primary,
  scrollY,
  topInset = 0,
}) => {
  const reduceMotion = useReduceMotion();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      fade.setValue(1);
      return;
    }
    fade.setValue(0);
    const anim = Animated.timing(fade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [lesson.id, reduceMotion]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Longer surahs get a smaller Arabic size so an ayah stays on one or two
  // lines. Al-Ghashiyah's 26 ayahs are the case this is sized for.
  const isLong = lesson.versesCount > 12;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <GeometricOrnament size={160} color={accentColor} />

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fade }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={
          scrollY
            ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
            })
            : undefined
        }
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: accentColor }]}>SURAH TO LEARN</Text>
          <Text style={[styles.name, { textShadowColor: accentColor + '50' }]}>{lesson.name}</Text>
          <ArabicText text={lesson.arabicName} style={styles.arabicName} />
          <Text style={styles.meta}>
            {`Surah ${lesson.number}  ·  ${lesson.versesCount} ayahs  ·  ${lesson.translatedName}`}
          </Text>
        </View>

        {/* ── Why it is on the list ─────────────────────────────────── */}
        <View style={[styles.whyCard, { borderColor: accentColor + '22' }]}>
          <Text style={styles.whyText}>{lesson.whyLearn}</Text>
          <Text style={styles.whySource}>{lesson.source}</Text>
        </View>

        {/* ── The surah itself ──────────────────────────────────────── */}
        {lesson.ayahs.map((ayah, i) => (
          <View
            key={ayah.n}
            style={[styles.ayahBlock, i === lesson.ayahs.length - 1 && styles.ayahBlockLast]}
          >
            <View style={styles.ayahHead}>
              <View style={[styles.ayahBadge, { borderColor: accentColor + '40' }]}>
                <Text style={[styles.ayahNum, { color: accentColor }]}>{ayah.n}</Text>
              </View>
              <View style={[styles.ayahRule, { backgroundColor: accentColor + '18' }]} />
              <AudioPlayerButton
                verseKey={`${lesson.number}:${ayah.n}`}
                size={28}
                iconSize={16}
                color={accentColor}
                showLabel={false}
                containerStyle={styles.ayahAudioBtn}
                style={styles.ayahAudioBtnWrap}
              />
            </View>

            <ArabicText
              text={ayah.arabic}
              style={isLong ? styles.ayahArabicCompact : styles.ayahArabic}
            />
            <Text style={[styles.translit, { color: accentColor }]}>{ayah.transliteration}</Text>
            <Text style={styles.translation}>{ayah.translation}</Text>
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Matches VerseLayer / HadithLayer so the pager's layers breathe alike.
    paddingHorizontal: Spacing.xxl,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Spacing.xl,
    // Clearance for the pager's bottom chrome (dots + layer label).
    paddingBottom: 120,
  },

  /* ── Header ── */
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  eyebrow: {
    fontSize: Typography.sizes.detail,
    fontWeight: '600',
    letterSpacing: 2.5,
    opacity: 0.7,
    marginBottom: Spacing.sm,
  },
  name: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h1,
    color: Colors.text.primary,
    letterSpacing: 1.2,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  arabicName: {
    fontSize: 22,
    lineHeight: 46,
    color: Colors.text.primary,
    textAlign: 'center',
    opacity: 0.85,
  },
  meta: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    color: Colors.text.secondary,
    letterSpacing: 0.8,
    marginTop: Spacing.xs,
  },

  /* ── Why learn it ── */
  whyCard: {
    backgroundColor: Colors.glass.light,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  whyText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    lineHeight: 21,
    color: Colors.text.primary,
    opacity: 0.9,
  },
  whySource: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    lineHeight: 18,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginTop: Spacing.md,
  },

  /* ── Ayahs ── */
  ayahBlock: {
    marginBottom: Spacing.xxl,
  },
  ayahBlockLast: {
    marginBottom: Spacing.lg,
  },
  ayahHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  ayahBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  // Resets AudioPlayerButton's standalone vertical margin so it sits flush
  // in the compact ayah-head row instead of pushing the row taller.
  ayahAudioBtnWrap: {
    marginVertical: 0,
  },
  ayahAudioBtn: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  ayahNum: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    fontWeight: '600',
  },
  ayahRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  // lineHeight >= ~2.1x the font size — Amiri-Quran's harakat sit far above and
  // below the baseline and a tighter line box clips them.
  ayahArabic: {
    fontSize: 24,
    lineHeight: 50,
    color: Colors.text.primary,
    textAlign: 'right',
  },
  ayahArabicCompact: {
    fontSize: 20,
    lineHeight: 42,
    color: Colors.text.primary,
    textAlign: 'right',
  },
  translit: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    lineHeight: 19,
    letterSpacing: 0.3,
    opacity: 0.75,
    marginTop: Spacing.sm,
  },
  translation: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.body,
    lineHeight: 26,
    color: Colors.text.primary,
    opacity: 0.92,
    marginTop: Spacing.sm,
  },
});

export default React.memo(SurahLayer);
