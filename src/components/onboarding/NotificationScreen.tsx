/**
 * Screen 6: Notification Permission
 *
 * App icon, title, body, 3 spiritual preview cards, Allow / Skip buttons.
 * Dark navy with twinkling stars backdrop.
 */
import React from 'react';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { InteractiveStarfield } from './InteractiveStarfield';
import { ShimmerButton } from '../ShimmerButton';

const STAR_POS = [
  { x: 0.07, y: 0.05, s: 2.5, d: 0 },
  { x: 0.90, y: 0.04, s: 2, d: 500 },
  { x: 0.18, y: 0.20, s: 1.5, d: 250 },
  { x: 0.82, y: 0.14, s: 2, d: 750 },
  { x: 0.50, y: 0.08, s: 1.5, d: 100 },
];
// Hoisted so InteractiveStarfield receives the same array reference each render.
const MAPPED_STAR_POS = STAR_POS.map(p => ({ ...p, y: p.y * 1.5 }));

interface Props {
  isActive: boolean;
  onAllow: () => void;
  onSkip: () => void;
}

// All three previews quote a COMPLETE ayah and name it. They previously did
// neither: Morning carried only the second sentence of 13:28 and Evening only
// a clause out of the middle of 57:4 (a long ayah about the six days and the
// Throne), both in quotation marks with no reference at all — scripture the
// reader could neither place nor look up. Morning and Evening were swapped
// rather than extended, per CLAUDE.md rule 3: when the whole ayah will not fit
// the slot, change the verse, never trim it. Afternoon was already whole
// (94:6) and only needed its reference.
const PREVIEWS = [
  {
    label: 'Morning',
    context: 'Begin the day grounded',
    icon: '🌙',
    verse: '"So remember Me; I will remember you. And be grateful to Me, and do not be ungrateful to Me." · 2:152',
  },
  {
    label: 'Afternoon',
    context: 'A pause when you need it',
    icon: '☀️',
    verse: '"Indeed, with hardship comes ease." · 94:6',
  },
  {
    label: 'Evening',
    context: 'Close the day with peace',
    icon: '⭐',
    verse: '"Your Lord has not forsaken you, nor is He displeased." · 93:3',
  },
];

export default function NotificationScreen({ isActive, onAllow, onSkip }: Props) {
  // [0] icon  [1] title  [2] body  [3-5] previews  [6] allow btn  [7] skip btn  [8] chip
  const s = useStaggerEntry(isActive, 9);
  const insets = useSafeAreaInsets();
  const topClearance = insets.top + 72;

  return (
    <View style={styles.container}>
      <InteractiveStarfield positions={MAPPED_STAR_POS} />

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[styles.contentArea, { paddingTop: topClearance }]}
        showsVerticalScrollIndicator={false}
      >
        {/* App icon — consistent with WelcomeScreen */}
        <Animated.View style={[styles.iconArea, s[0]]}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.appIcon}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[styles.title, s[1]]}>
          Gentle Reminders
        </Animated.Text>

        {/* Body */}
        <Animated.Text style={[styles.body, s[2]]}>
          A verse to open your day. A pause at noon.{'\n'}
          A reflection as the evening falls.
        </Animated.Text>

        {/* 3 spiritual touchpoint preview cards */}
        <View style={styles.previewsWrap}>
          {PREVIEWS.map((p, i) => (
            <Animated.View key={p.label} style={[styles.previewCard, s[3 + i]]}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewIcon}>{p.icon}</Text>
                <View style={styles.previewLabelWrap}>
                  <Text style={styles.previewLabel}>{p.label}</Text>
                  <Text style={styles.previewContext}>{p.context}</Text>
                </View>
              </View>
              <Text style={styles.previewVerse}>{p.verse}</Text>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Buttons */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom + Spacing.xxl, Spacing.xxxl) }]}>
        <Animated.View style={[styles.btnWrap, s[6]]}>
          <ShimmerButton label="Yes, remind me" onPress={onAllow} />
        </Animated.View>

        <Animated.View style={[styles.skipWrap, s[7]]}>
          <TouchableOpacity
            style={styles.skipBtn}
            activeOpacity={0.7}
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel="Not now"
          >
            <Text style={styles.skipBtnText}>Not now</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.chip, s[8]]}>
          <Text style={styles.chipText}>
            You can customize reminders anytime in settings
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ScrollView's own layout box — takes the space above the fixed CTA.
  contentScroll: {
    flex: 1,
  },
  // contentContainerStyle: flexGrow (not flex) so short content still centers,
  // while taller content (e.g. all 3 preview cards) scrolls instead of being
  // clipped behind the fixed "Yes, remind me" button.
  contentArea: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  iconArea: {
    marginBottom: Spacing.xl,
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.xxl,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h1,
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: Spacing.md,
  },
  body: {
    fontSize: Typography.sizes.body,
    color: `${Colors.text.primary}B8`,
    textAlign: 'center',
    lineHeight: 23,
    letterSpacing: 0.2,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  btnWrap: {
    width: '100%',
  },
  skipWrap: {
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: Spacing.sm,
  },
  skipBtnText: {
    fontSize: Typography.sizes.small,
    color: `${Colors.text.primary}D9`,
    letterSpacing: 0.3,
  },
  previewsWrap: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  previewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent.glow,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewIcon: {
    fontSize: Typography.sizes.body,
  },
  previewLabelWrap: {
    flex: 1,
  },
  previewLabel: {
    fontSize: Typography.sizes.detail,
    color: Colors.accent.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  previewContext: {
    fontSize: Typography.sizes.label,
    color: `${Colors.text.primary}73`,
    letterSpacing: 0.2,
  },
  previewVerse: {
    fontSize: Typography.sizes.small,
    color: `${Colors.text.primary}A6`,
    fontFamily: Typography.fonts.serif,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.12)',
    width: '100%',
  },
  chipText: {
    fontSize: Typography.sizes.detail,
    color: `${Colors.text.primary}AD`,
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },
});
