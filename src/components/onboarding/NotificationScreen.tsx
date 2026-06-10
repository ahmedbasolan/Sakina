/**
 * Screen 6: Notification Permission
 *
 * Clean bell icon, title, body, Allow / Skip buttons.
 * Dark navy with twinkling stars + AnimatedMandala backdrop.
 * All elements use shared stagger animation.
 */
import React, { useEffect, useRef } from 'react';
import { Colors } from '../../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { InteractiveStarfield } from './InteractiveStarfield';
import { ShimmerButton } from '../ShimmerButton';

const { height } = Dimensions.get('window');

const STAR_POS = [
  { x: 0.07, y: 0.05, s: 2.5, d: 0 },
  { x: 0.90, y: 0.04, s: 2, d: 500 },
  { x: 0.18, y: 0.20, s: 1.5, d: 250 },
  { x: 0.82, y: 0.14, s: 2, d: 750 },
  { x: 0.50, y: 0.08, s: 1.5, d: 100 },
];



function BellIcon({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <SvgGradient id="bellG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F4D88A" />
          <Stop offset="0.55" stopColor="#E8C84A" />
          <Stop offset="1" stopColor={Colors.accent.primary} />
        </SvgGradient>
      </Defs>
      {/* Soft lit interior */}
      <Path
        d="M24,9 C17.5,9 14.5,14 14.5,21.5 C14.5,28 12.3,31 10.5,33 C9.9,33.7 10.4,34.8 11.3,34.8 L36.7,34.8 C37.6,34.8 38.1,33.7 37.5,33 C35.7,31 33.5,28 33.5,21.5 C33.5,14 30.5,9 24,9 Z"
        fill="url(#bellG)"
        opacity={0.16}
      />
      {/* Rounded bell — smooth shoulders, gently flared base */}
      <Path
        d="M24,9 C17.5,9 14.5,14 14.5,21.5 C14.5,28 12.3,31 10.5,33 C9.9,33.7 10.4,34.8 11.3,34.8 L36.7,34.8 C37.6,34.8 38.1,33.7 37.5,33 C35.7,31 33.5,28 33.5,21.5 C33.5,14 30.5,9 24,9 Z"
        fill="none"
        stroke="url(#bellG)"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {/* Top mount loop */}
      <Path
        d="M21.5,8.5 C21.5,5 26.5,5 26.5,8.5"
        fill="none"
        stroke="url(#bellG)"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      {/* Clapper */}
      <Path
        d="M20.5,35.5 C20.5,39.5 27.5,39.5 27.5,35.5"
        fill="none"
        stroke="url(#bellG)"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Eight-point Islamic star (najmah / khatim) — two overlapping squares, gold
 * stroked with a faint warm fill. Cradles the bell glyph at its centre.
 */
function NajmahFrame({ size = 104 }: { size?: number }) {
  const c = 50;
  const r = 44; // centre-to-corner radius within the 100×100 viewBox
  const square = (offsetDeg: number) =>
    [0, 1, 2, 3]
      .map((i) => {
        const a = ((offsetDeg + i * 90) * Math.PI) / 180;
        return `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`;
      })
      .reduce((d, pt, i) => d + (i === 0 ? `M${pt}` : ` L${pt}`), '') + ' Z';

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <SvgGradient id="najmahG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F4D88A" />
          <Stop offset="0.55" stopColor="#E8C84A" />
          <Stop offset="1" stopColor={Colors.accent.primary} />
        </SvgGradient>
      </Defs>
      {/* Two squares offset 45° form the 8-point star */}
      <Path
        d={square(45)}
        fill="rgba(212, 175, 55, 0.05)"
        stroke="url(#najmahG)"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d={square(0)}
        fill="rgba(212, 175, 55, 0.05)"
        stroke="url(#najmahG)"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface Props {
  isActive: boolean;
  onAllow: () => void;
  onSkip: () => void;
}

const PREVIEWS = [
  {
    label: 'Fajr',
    time: '5:24 AM',
    icon: '🌙',
    verse: '"Verily, in the remembrance of Allah do hearts find rest."',
  },
  {
    label: 'Maghrib',
    time: '7:43 PM',
    icon: '🌅',
    verse: '"And He is with you wherever you are."',
  },
];

export default function NotificationScreen({ isActive, onAllow, onSkip }: Props) {
  // [0] icon, [1] title, [2] body, [3] preview1, [4] preview2, [5] allow btn, [6] skip btn, [7] chip
  const s = useStaggerEntry(isActive, 8);

  return (
    <View style={styles.container}>
      {/* Stars */}
      <InteractiveStarfield positions={STAR_POS.map(p => ({ ...p, y: p.y * 1.5 }))} />

      <View style={styles.contentArea}>
        {/* Bell cradled in a gold 8-point star (najmah), lit by a soft glow */}
        <View style={styles.iconArea}>
          <View style={styles.starGlow} pointerEvents="none" />
          <Animated.View style={[styles.starFrame, s[0]]}>
            <NajmahFrame size={104} />
            <View style={styles.bellCenter} pointerEvents="none">
              <BellIcon size={38} />
            </View>
          </Animated.View>
        </View>

        {/* Title */}
        <Animated.Text style={[styles.title, s[1]]}>
          Gentle Reminders
        </Animated.Text>

        {/* Body */}
        <Animated.Text style={[styles.body, s[2]]}>
          A verse at Fajr. A reflection at Maghrib.{'\n'}
          Like a friend who remembers.
        </Animated.Text>

        {/* Notification preview cards */}
        <View style={styles.previewsWrap}>
          {PREVIEWS.map((p, i) => (
            <Animated.View key={p.label} style={[styles.previewCard, s[3 + i]]}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewIcon}>{p.icon}</Text>
                <Text style={styles.previewLabel}>{p.label}</Text>
                <Text style={styles.previewTime}>{p.time}</Text>
              </View>
              <Text style={styles.previewVerse}>{p.verse}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.bottomSection}>
        <Animated.View style={[styles.btnWrap, s[5]]}>
          <ShimmerButton label="Yes, remind me" onPress={onAllow} />
        </Animated.View>

        <Animated.View style={[styles.skipWrap, s[6]]}>
          <TouchableOpacity style={styles.skipBtn} activeOpacity={0.7} onPress={onSkip}>
            <Text style={styles.skipBtnText}>Not now</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Chip */}
        <Animated.View style={[styles.chip, s[7]]}>
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
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconArea: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  // Soft gold bloom behind the star frame
  starGlow: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(212, 175, 55, 0.10)',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 8,
  },
  starFrame: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bell sits dead-centre over the star
  bellCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'serif',
    fontSize: 24,
    color: '#F5EDE3',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  body: {
    fontSize: 15,
    color: 'rgba(245, 237, 227, 0.72)',
    textAlign: 'center',
    lineHeight: 23,
    letterSpacing: 0.2,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: height * 0.10,
    alignItems: 'center',
    gap: 12,
  },
  btnWrap: {
    width: '100%',
  },
  skipWrap: {
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 14,
    color: 'rgba(245, 237, 227, 0.68)',
    letterSpacing: 0.3,
  },
  previewsWrap: {
    width: '100%',
    gap: 10,
    marginTop: 28,
  },
  previewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewIcon: {
    fontSize: 14,
  },
  previewLabel: {
    fontSize: 13,
    color: Colors.accent.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
    flex: 1,
  },
  previewTime: {
    fontSize: 12,
    color: 'rgba(245, 237, 227, 0.62)',
    letterSpacing: 0.3,
  },
  previewVerse: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.65)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.12)',
    width: '100%',
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.68)',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },
});