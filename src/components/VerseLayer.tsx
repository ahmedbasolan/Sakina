import React, { useMemo, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const { height } = Dimensions.get('window');
import Svg, { Path, Circle as SvgCircle, G } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { HapticsService } from '../services/hapticsService';
import ArabicText from './ArabicText';
import AudioPlayerButton from './AudioPlayerButton';

/* ─── Subtle Geometric Ornament ──────────────────────────────── */
function GeometricOrnament({ size, color }: { size: number; color: string }) {
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 90000, useNativeDriver: true }),
    ).start();
  }, []);

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

/* ─── Expandable Actions FAB ────────────────────────────────── */
function ActionsFAB({
  accentColor,
  onShare,
  onSave,
  isSaved,
  audioKey,
}: {
  accentColor: string;
  onShare: () => void;
  onSave: () => void;
  isSaved: boolean;
  audioKey?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    HapticsService.impactAsync('LIGHT');
    const toValue = expanded ? 0 : 1;
    Animated.spring(expandAnim, {
      toValue,
      damping: 18,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  // Each action button slides up from the FAB
  const actionTranslate = (index: number) =>
    expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -(index + 1) * 52],
    });

  const actionOpacity = expandAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  const actionScale = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 0.8, 1],
  });

  // Rotate the toggle icon
  const iconRotate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  type RegularAction = {
    isAudio?: false;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
    onPress: () => void;
  };
  type AudioAction = {
    isAudio: true;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
    onPress: () => void;
    audioKey: string;
  };
  type ActionItem = RegularAction | AudioAction;

  const actions: ActionItem[] = [
    {
      icon: isSaved ? 'heart' : 'heart-outline',
      color: isSaved ? Colors.status.error : Colors.text.primary,
      onPress: () => { HapticsService.impactAsync('LIGHT'); onSave(); },
    },
    ...(audioKey ? [{
      icon: 'volume-medium-outline' as React.ComponentProps<typeof Ionicons>['name'],
      color: Colors.text.primary,
      onPress: () => { }, // Audio handled by AudioPlayerButton
      isAudio: true as const,
      audioKey,
    }] : []),
    {
      icon: 'share-outline',
      color: Colors.text.primary,
      onPress: () => { HapticsService.impactAsync('LIGHT'); onShare(); },
    },
  ];

  return (
    <View style={styles.fabContainer}>
      {/* Expanded action buttons */}
      {actions.map((action, i) => (
        <Animated.View
          key={i}
          style={[
            styles.fabActionWrapper,
            {
              transform: [
                { translateY: actionTranslate(i) },
                { scale: actionScale },
              ],
              opacity: actionOpacity,
            },
          ]}
          pointerEvents={expanded ? 'auto' : 'none'}
        >
          {'isAudio' in action && action.isAudio ? (
            <BlurView intensity={30} tint="dark" style={styles.fabAction}>
              <AudioPlayerButton
                verseKey={action.audioKey}
                size={22}
                color={Colors.accent.primary}
                showLabel={false}
                containerStyle={styles.fabActionInner}
              />
            </BlurView>
          ) : (
            <TouchableOpacity
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <BlurView intensity={30} tint="dark" style={styles.fabAction}>
                <Ionicons name={action.icon} size={20} color={action.color} />
              </BlurView>
            </TouchableOpacity>
          )}
        </Animated.View>
      ))}

      {/* Main toggle button */}
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.8}
      >
        <BlurView intensity={30} tint="dark" style={styles.fabMain}>
          <Animated.View style={{ transform: [{ rotate: iconRotate }] }}>
            <Ionicons name="add" size={24} color={Colors.text.primary} />
          </Animated.View>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

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
}) => {
  const insets = useSafeAreaInsets();
  const { surahName, verseRef } = useMemo(() => parseReference(reference), [reference]);

  // Gentle swipe hint — shows once then fades out
  const swipeHintOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.sequence([
        Animated.timing(swipeHintOpacity, { toValue: 0.7, duration: 600, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(swipeHintOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]).start();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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

    setTimeout(() => {
      HapticsService.impactAsync('LIGHT');
    }, 100);

    sequence.start(() => setRevealComplete(true));
    return () => sequence.stop();
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

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + Spacing.sm, height * 0.01),
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
        onTouchEnd={skipReveal}
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
              <Text style={[styles.translation, isLongTranslation && styles.translationCompact]}>
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
                style={isLongArabic ? styles.arabicSecondaryCompact : styles.arabicSecondary}
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

      {/* ── Footer: FABs on edges, swipe hint centered ── */}
      <View style={styles.footer}>
        {/* Left FAB: expandable actions */}
        <View style={styles.fabLeft}>
          {onShare && onSave && (
            <ActionsFAB
              accentColor={accentColor}
              onShare={onShare}
              onSave={onSave}
              isSaved={isSaved}
              audioKey={audioKey}
            />
          )}
        </View>

        {/* Center: swipe up hint */}
        <Animated.View style={[styles.swipeHintCenter, { opacity: swipeHintOpacity }]}>
          <Ionicons name="chevron-up" size={18} color={'rgba(245, 237, 227, 0.3)'} />
          <Text style={styles.swipeHintText}>Explore</Text>
        </Animated.View>

        {/* Right FAB: next verse */}
        <View style={styles.fabRight}>
          {onNextVerse && (
            <TouchableOpacity
              onPress={() => {
                HapticsService.impactAsync('LIGHT');
                onNextVerse();
              }}
              activeOpacity={0.8}
            >
              <BlurView intensity={30} tint="dark" style={styles.nextFab}>
                <Ionicons name="arrow-forward" size={22} color={Colors.text.primary} />
              </BlurView>
            </TouchableOpacity>
          )}
        </View>
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
    justifyContent: 'center',
    flexGrow: 1,
    paddingTop: 100, // padding for floating header
    paddingBottom: 140, // padding for floating footer
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
  arabic: {
    fontSize: 24,
    lineHeight: 48,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  arabicCompact: {
    fontSize: 20,
    lineHeight: 40,
    color: Colors.text.primary,
    textAlign: 'center',
  },

  /* ── Arabic Secondary ── */
  arabicSecondary: {
    fontSize: 20,
    lineHeight: 40,
    color: 'rgba(245, 237, 227, 0.55)',
    textAlign: 'center',
  },
  arabicSecondaryCompact: {
    fontSize: 17,
    lineHeight: 34,
    color: 'rgba(245, 237, 227, 0.55)',
    textAlign: 'center',
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
    color: 'rgba(245, 237, 227, 0.75)',
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
    color: 'rgba(245, 237, 227, 0.45)',
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
    backgroundColor: 'rgba(245, 237, 227, 0.15)',
  },
  dividerDiamond: {
    width: 5,
    height: 5,
    borderRadius: 1,
    backgroundColor: 'rgba(245, 237, 227, 0.2)',
    transform: [{ rotate: '45deg' }],
  },

  /* ── Footer ── */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    minHeight: 64,
  },
  fabLeft: {
    width: 60,
    alignItems: 'center',
  },
  fabRight: {
    width: 60,
    alignItems: 'center',
  },
  swipeHintCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 0,
  },

  /* ── Glass FABs ── */
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  fabActionWrapper: {
    position: 'absolute',
    bottom: 0,
  },
  fabActionInner: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  fabAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 235, 210, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 210, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fabMain: {
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

  swipeHintText: {
    fontSize: 10,
    color: 'rgba(245, 237, 227, 0.35)',
    fontWeight: '500',
    letterSpacing: 1,
  },
});

export default React.memo(VerseLayer);
