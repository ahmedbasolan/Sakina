import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Text, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle as SvgCircle, G } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, Typography } from '../theme/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { HapticsService } from '../services/hapticsService';
import ArabicText from './ArabicText';
import AudioPlayerButton from './AudioPlayerButton';
import { useReduceMotion } from '../hooks/useReduceMotion';

/* ─── Subtle Geometric Ornament ──────────────────────────────── */
/* Named export: HadithLayer shares this so both immersive layers in the
   journey pager breathe with the same ornament. */
export function GeometricOrnament({ size, color }: { size: number; color: string }) {
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) return; // static ornament when reduce-motion is on
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ]),
    );
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 90000, useNativeDriver: true }),
    );
    breatheLoop.start();
    rotateLoop.start();
    return () => {
      breatheLoop.stop();
      rotateLoop.stop();
    };
  }, [reduceMotion]);

  const opacity = breatheAnim.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.06] });
  const scale = breatheAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.02] });
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const points = 8;
  const r = size / 2;
  const starPath = Array.from({ length: points })
    .map((_, i) => {
      const angle = (i * 360) / points - 90;
      const rad = (angle * Math.PI) / 180;
      const ox = r + Math.cos(rad) * r * 0.85;
      const oy = r + Math.sin(rad) * r * 0.85;
      const ix = r + Math.cos(rad) * r * 0.4;
      const iy = r + Math.sin(rad) * r * 0.4;
      return `${i === 0 ? 'M' : 'L'}${ox},${oy} L${ix},${iy}`;
    })
    .join(' ') + ' Z';

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ornament, { opacity, transform: [{ scale }, { rotate }] }]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          <Path d={starPath} stroke={color} strokeWidth={0.5} fill="none" opacity={0.5} />
          <SvgCircle cx={r} cy={r} r={r * 0.6} stroke={color} strokeWidth={0.4} fill="none" opacity={0.3} />
        </G>
      </Svg>
    </Animated.View>
  );
}

/* ─── Parse reference string ────────────────────────────────── */
function parseReference(ref: string): { surahName: string; verseRef: string } {
  // "Surah Al-Baqarah 2:255" → { surahName: "Al-Baqarah", verseRef: "2:255" }
  const match = ref.match(/^Surah\s+(.+?)\s+(\d+:\d+(?:-\d+)?)$/);
  if (match) {
    return { surahName: match[1], verseRef: match[2] };
  }
  // Fallback for non-Quranic sources
  return { surahName: ref, verseRef: '' };
}

/* ActionsFAB removed — replaced by cinema-mode tap-to-reveal bar in VerseLayer */

/* ─── VerseLayer ────────────────────────────────────────────── */
interface VerseLayerProps {
  arabic: string;
  translation: string;
  reference: string;
  transliteration?: string;
  showTransliteration?: boolean;
  primaryLanguage?: 'english' | 'arabic';
  scrollY?: Animated.Value;
  accentColor?: string;
  onNextVerse?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  audioKey?: string;
  /** Auto-play recitation when this verse opens (driven by user preference). */
  autoPlayAudio?: boolean;
  /** When true the swipe-up hint pulses persistently to signal a context layer is available */
  hasContext?: boolean;
}

const formatTranslation = (raw: string): string => {
  if (!raw) return '';

  let cleaned = raw
    .replace(/\s*\([^)]+\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*([,.!?])\s*/g, '$1 ')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

  cleaned = cleaned
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-z])And/g, '$1 and')
    .replace(/([a-z])The/g, '$1 the')
    .replace(/([a-z])Will/g, '$1 will')
    .replace(/([a-z])Is/g, '$1 is')
    .replace(/([a-z])Has/g, '$1 has')
    .replace(/([a-z])Have/g, '$1 have')
    .replace(/([a-z])Are/g, '$1 are');

  return cleaned;
};

const VerseLayer: React.FC<VerseLayerProps> = ({
  arabic,
  translation,
  reference,
  transliteration,
  showTransliteration = false,
  primaryLanguage = 'english',
  scrollY,
  accentColor = Colors.accent.primary,
  onNextVerse,
  onShare,
  onSave,
  isSaved = false,
  audioKey,
  autoPlayAudio = false,
  hasContext = false,
}) => {
  const insets = useSafeAreaInsets();
  const { surahName, verseRef } = useMemo(() => parseReference(reference), [reference]);

  const reduceMotion = useReduceMotion();

  // Swipe hint — pulses gently when a context layer is available, fades once otherwise.
  // When reduce-motion is on the hint appears at a static opacity instead of pulsing.
  const swipeHintOpacity = useRef(new Animated.Value(0)).current;
  const hintLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    swipeHintOpacity.setValue(0);
    hintLoopRef.current?.stop();

    const timer = setTimeout(() => {
      if (hasContext) {
        if (reduceMotion) {
          // Static hint — no loop, just a stable opacity
          Animated.timing(swipeHintOpacity, { toValue: 0.7, duration: 400, useNativeDriver: true }).start();
        } else {
          // Fade in, then breathe continuously so users notice it
          Animated.timing(swipeHintOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => {
            hintLoopRef.current = Animated.loop(
              Animated.sequence([
                Animated.timing(swipeHintOpacity, { toValue: 0.35, duration: 1400, useNativeDriver: true }),
                Animated.timing(swipeHintOpacity, { toValue: 1,    duration: 1400, useNativeDriver: true }),
              ]),
            );
            hintLoopRef.current.start();
          });
        }
      } else {
        // No context — show once and fade out (same regardless of reduce-motion)
        Animated.sequence([
          Animated.timing(swipeHintOpacity, { toValue: 0.55, duration: 600, useNativeDriver: true }),
          Animated.delay(2500),
          Animated.timing(swipeHintOpacity, { toValue: 0,    duration: 1000, useNativeDriver: true }),
        ]).start();
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      hintLoopRef.current?.stop();
    };
  }, [hasContext, reduceMotion]);

  const formattedTranslation = useMemo(() => formatTranslation(translation), [translation]);

  const isLongArabic = arabic.length > 200;
  const isLongTranslation = formattedTranslation.length > 200;
  const isArabicPrimary = primaryLanguage === 'arabic';

  // Staged verse revelation animation
  const arabicOpacity = useRef(new Animated.Value(0)).current;
  const arabicSlide = useRef(new Animated.Value(15)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;
  const transOpacity = useRef(new Animated.Value(0)).current;
  const transSlide = useRef(new Animated.Value(10)).current;
  const refOpacity = useRef(new Animated.Value(0)).current;
  const [revealComplete, setRevealComplete] = useState(false);

  // Gesture discovery hint — "→ swipe right · ↑ context" — fades in briefly
  // on each new verse then disappears so it doesn't clutter the immersive view.
  const hintsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    hintsOpacity.setValue(0);
    const t = setTimeout(() => {
      Animated.sequence([
        Animated.timing(hintsOpacity, { toValue: 0.85, duration: 600, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(hintsOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start();
    }, 1600);
    return () => clearTimeout(t);
  }, [arabic]);

  // ── Cinema-mode tap-to-reveal controls ────────────────────────
  // Default: fully immersive (no UI chrome). A single tap anywhere on the
  // verse reveals the action bar. It auto-dismisses after 3.5 s of inactivity,
  // or immediately on a second tap.
  const [controlsVisible, setControlsVisible] = useState(false);
  const controlsAnim = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether the user is mid-scroll so we don't toggle on scroll-end
  const isScrollingRef = useRef(false);

  const hideControls = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    Animated.timing(controlsAnim, { toValue: 0, duration: 260, useNativeDriver: true })
      .start(() => setControlsVisible(false));
  }, [controlsAnim]);

  const showControls = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setControlsVisible(true);
    Animated.spring(controlsAnim, { toValue: 1, damping: 20, stiffness: 220, useNativeDriver: true }).start();
    hideTimerRef.current = setTimeout(hideControls, 3500);
  }, [controlsAnim, hideControls]);

  // skipReveal must be defined before handleContentTap (hoisted here)
  const skipRevealRef = useRef<() => void>(() => {});

  // Called from ScrollView onTouchEnd — skip verse reveal AND toggle controls
  const handleContentTap = useCallback(() => {
    skipRevealRef.current();
    if (isScrollingRef.current) return; // ignore scroll-end touches
    if (controlsVisible) {
      hideControls();
    } else {
      showControls();
    }
  }, [controlsVisible, showControls, hideControls]);

  // Reset controls when a new verse loads
  useEffect(() => {
    setControlsVisible(false);
    controlsAnim.setValue(0);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, [arabic, translation]);

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
  }, [arabic, translation]);

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
  // Keep ref in sync so handleContentTap can call the latest skipReveal
  skipRevealRef.current = skipReveal;

  return (
    <View
      style={[
        styles.container,
        {
          // The GuidanceHeader above is in the flex flow and already clears the
          // safe area — so VerseLayer only needs a small gap, not another inset.
          paddingTop: Spacing.sm,
          paddingBottom: Math.max(insets.bottom + Spacing.sm, Spacing.lg),
        },
      ]}
    >
      <GeometricOrnament size={160} color={accentColor} />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onTouchEnd={handleContentTap}
        onScrollBeginDrag={() => { isScrollingRef.current = true; }}
        onScrollEndDrag={() => { isScrollingRef.current = false; }}
        onMomentumScrollEnd={() => { isScrollingRef.current = false; }}
        onScroll={
          scrollY
            ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
            })
            : undefined
        }
      >
        {/* ── Reference at top ── */}
        <Animated.View style={[styles.referenceTop, { opacity: refOpacity }]}>
          {/* Decorative top flourish */}
          <View style={styles.refFlourish}>
            <View style={[styles.refFlLine, { backgroundColor: accentColor + '25' }]} />
            <View style={[styles.refFlDiamond, { backgroundColor: accentColor + '40' }]} />
            <View style={[styles.refFlLine, { backgroundColor: accentColor + '25' }]} />
          </View>

          <Text style={[styles.surahName, { textShadowColor: accentColor + '50' }]}>
            {surahName}
          </Text>
          {verseRef !== '' && (
            <View style={styles.verseRefRow}>
              <View style={[styles.refDot, { backgroundColor: accentColor + '50' }]} />
              <Text style={[styles.verseRef, { color: accentColor }]}>
                Ayah {verseRef}
              </Text>
              <View style={[styles.refDot, { backgroundColor: accentColor + '50' }]} />
            </View>
          )}
        </Animated.View>

        {/* ── Verse content ── */}
        {isArabicPrimary ? (
          <>
            <Animated.View style={{ opacity: arabicOpacity, transform: [{ translateY: arabicSlide }] }}>
              <ArabicText text={arabic} style={isLongArabic ? styles.arabicCompact : styles.arabic} />
            </Animated.View>

            {showTransliteration && transliteration ? (
              <Animated.View style={{ opacity: transOpacity }}>
                <Text style={styles.transliteration}>{transliteration}</Text>
              </Animated.View>
            ) : null}

            <Animated.View style={[styles.divider, { opacity: dividerOpacity }]}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDiamond} />
              <View style={styles.dividerLine} />
            </Animated.View>

            <Animated.View style={{ opacity: transOpacity, transform: [{ translateY: transSlide }] }}>
              <Text style={[styles.translation, isLongTranslation && styles.translationCompact, { color: accentColor + 'BF' }]}>
                {formattedTranslation}
              </Text>
            </Animated.View>
          </>
        ) : (
          <>
            <Animated.View style={{ opacity: arabicOpacity, transform: [{ translateY: arabicSlide }] }}>
              <Text
                style={[
                  styles.translationPrimary,
                  isLongTranslation && styles.translationPrimaryCompact,
                ]}
              >
                {formattedTranslation}
              </Text>
            </Animated.View>

            <Animated.View style={[styles.divider, { opacity: dividerOpacity }]}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDiamond} />
              <View style={styles.dividerLine} />
            </Animated.View>

            <Animated.View style={{ opacity: transOpacity, transform: [{ translateY: transSlide }] }}>
              <ArabicText
                text={arabic}
                style={[isLongArabic ? styles.arabicSecondaryCompact : styles.arabicSecondary, { color: accentColor }]}
              />
            </Animated.View>

            {showTransliteration && transliteration ? (
              <Animated.View style={{ opacity: transOpacity }}>
                <Text style={styles.transliteration}>{transliteration}</Text>
              </Animated.View>
            ) : null}
          </>
        )}
      </Animated.ScrollView>

      {/* ── Footer: context hint always visible, action bar tap-to-reveal ── */}
      <View style={styles.footer}>

        {/* Tap-to-reveal action bar — slides up on tap, auto-hides after 3.5s */}
        <Animated.View
          pointerEvents={controlsVisible ? 'box-none' : 'none'}
          style={[
            styles.actionBar,
            {
              opacity: controlsAnim,
              transform: [{
                translateY: controlsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <BlurView intensity={65} tint="dark" style={styles.actionBarInner}>
            {/* Save */}
            {onSave && (
              <TouchableOpacity
                onPress={() => { HapticsService.impactAsync('LIGHT'); onSave(); showControls(); }}
                activeOpacity={0.7}
                style={styles.actionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? 'Remove from saved' : 'Save verse'}
              >
                <Ionicons
                  name={isSaved ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isSaved ? accentColor : `${Colors.text.primary}CC`}
                />
              </TouchableOpacity>
            )}

            {/* Audio — iconSize matches the 22px sibling icons; style resets the
                standalone vertical margin so it sits flush in the compact bar. */}
            {audioKey && (
              <View style={styles.actionBtn}>
                <AudioPlayerButton
                  verseKey={audioKey}
                  size={34}
                  iconSize={22}
                  // Only auto-play once the staged verse reveal has settled
                  // (revealComplete), so recitation never starts mid-animation.
                  autoPlay={autoPlayAudio && revealComplete}
                  color={`${Colors.text.primary}CC`}
                  showLabel={false}
                  containerStyle={styles.audioBtnInner}
                  style={styles.audioBtnReset}
                />
              </View>
            )}

            {/* Share */}
            {onShare && (
              <TouchableOpacity
                onPress={() => { HapticsService.impactAsync('LIGHT'); onShare(); }}
                activeOpacity={0.7}
                style={styles.actionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Share verse"
              >
                <Ionicons name="share-outline" size={22} color={`${Colors.text.primary}CC`} />
              </TouchableOpacity>
            )}

            {/* Next verse (button kept for backward-compat; swipe-right is now the primary gesture) */}
            {onNextVerse && (
              <>
                <View style={styles.actionDivider} />
                <TouchableOpacity
                  onPress={() => { HapticsService.impactAsync('LIGHT'); onNextVerse(); }}
                  activeOpacity={0.7}
                  style={styles.actionBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Next verse"
                >
                  <Ionicons name="arrow-forward" size={22} color={accentColor} />
                </TouchableOpacity>
              </>
            )}
          </BlurView>
        </Animated.View>

        {/* Gesture hint row — brief one-shot discovery aid, then disappears */}
        <Animated.View style={[styles.gestureHintsRow, { opacity: hintsOpacity }]}>
          <View style={styles.gestureHintItem}>
            <Ionicons name="arrow-back" size={11} color={`${Colors.text.primary}61`} />
            <Text style={styles.gestureHintText}>← swipe for next</Text>
          </View>
          {hasContext && (
            <>
              <View style={styles.gestureHintSep} />
              <View style={styles.gestureHintItem}>
                <Ionicons name="arrow-up" size={11} color={`${Colors.text.primary}61`} />
                <Text style={styles.gestureHintText}>context</Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* Persistent context pip — chevron + dot pulsing so users know to swipe up */}
        {hasContext && (
          <Animated.View style={[styles.swipeHintCenter, { opacity: swipeHintOpacity }]}>
            <Ionicons name="chevron-up" size={10} color={accentColor} style={{ opacity: 0.75 }} />
            <View style={[styles.contextDot, { backgroundColor: accentColor }]} />
          </Animated.View>
        )}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  ornament: {
    position: 'absolute',
    alignSelf: 'center',
    top: '28%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    // Top-align so the verse sits up near the header instead of floating in the
    // vertical centre (which left a large gap under the title).
    justifyContent: 'flex-start',
    flexGrow: 1,
    paddingTop: Spacing.xxl, // modest clearance below the in-flow header
    paddingBottom: 140, // clearance for the floating action bar
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
  surahName: {
    fontFamily: Typography.fonts.serif,
    fontSize: 20,
    fontWeight: '400',
    color: Colors.text.primary,
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
    opacity: 0.9,
  },
  verseRefRow: {
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
  verseRef: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2.5,
    opacity: 0.65,
  },

  /* ── Arabic Primary ── */
  // lineHeight ≥ ~2.1× the font size: Amiri-Quran's harakat sit far above and
  // below the baseline, and a tighter line box clips them (unreadable tashkeel).
  arabic: {
    fontSize: 24,
    lineHeight: 50,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  arabicCompact: {
    fontSize: 20,
    lineHeight: 42,
    color: Colors.text.primary,
    textAlign: 'center',
  },

  /* ── Arabic Secondary ── */
  // Solid warm gold (#EDD9A3, the SurahReader's verse colour) at full opacity:
  // the Qur'an text is never decoration, so even when English leads it must be
  // fully legible. The old 55%-alpha cream read as patchy, broken strokes.
  arabicSecondary: {
    fontSize: 22,
    lineHeight: 46,
    color: '#EDD9A3',
    textAlign: 'center',
    // Uthmani waqf/pause marks (small circles like ۚ) are thin outline glyphs —
    // at solid color they still read as pale/whitish next to the bold letter
    // strokes. A tight same-hue glow fills them in so they read as gold too.
    textShadowColor: 'rgba(237, 217, 163, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  arabicSecondaryCompact: {
    fontSize: 19,
    lineHeight: 40,
    color: '#EDD9A3',
    textAlign: 'center',
    textShadowColor: 'rgba(237, 217, 163, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  /* ── English Primary ── */
  translationPrimary: {
    fontFamily: Typography.fonts.serif,
    fontSize: 21,
    lineHeight: 34,
    color: Colors.text.primary,
    textAlign: 'center',
    fontWeight: '400',
    paddingHorizontal: Spacing.sm,
    opacity: 0.95,
  },
  translationPrimaryCompact: {
    fontSize: 18,
    lineHeight: 30,
  },

  /* ── English Secondary ── */
  translation: {
    fontFamily: Typography.fonts.serif,
    fontSize: 16,
    lineHeight: 26,
    color: `${Colors.text.primary}BF`,
    textAlign: 'center',
    fontWeight: '400',
    fontStyle: 'italic',
    paddingHorizontal: Spacing.sm,
  },
  translationCompact: {
    fontSize: 14,
    lineHeight: 23,
  },

  transliteration: {
    fontFamily: Typography.fonts.serif,
    fontSize: 13,
    lineHeight: 20,
    // 0.62 keeps it clearly secondary to the translation while staying
    // readable — 0.45 fell below comfortable contrast on the navy ground.
    color: `${Colors.text.primary}9E`,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
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

  /* ── Footer ── */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Spacing.lg,
    gap: 10,
  },

  /* ── Tap-to-reveal action bar ── */
  actionBar: {
    width: '82%',
    borderRadius: 36,
    overflow: 'hidden',
    // Slightly more visible border so the pill reads as a distinct surface
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  actionBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Reduced height — was 13, now 8 so the pill feels compact and light
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  audioBtnInner: {
    backgroundColor: 'transparent',
    // No circle border in the compact action bar — the wave bars carry the visual weight
    borderWidth: 0,
  },
  audioBtnReset: {
    marginVertical: 0,
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 4,
  },

  /* ── Gesture discovery hints ── */
  gestureHintsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingBottom: 2,
  },
  gestureHintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gestureHintText: {
    fontSize: 10,
    color: `${Colors.text.primary}61`,
    letterSpacing: 0.8,
    fontFamily: Typography.fonts.serif,
  },
  gestureHintSep: {
    width: 1,
    height: 10,
    backgroundColor: `${Colors.text.primary}1F`,
  },

  /* ── Ambient context pip (pulses when a context layer is available) ── */
  swipeHintCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
    gap: 2,
  },
  contextDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.85,
  },
});

export default React.memo(VerseLayer);
