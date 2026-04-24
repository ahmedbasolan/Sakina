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
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { AnimatedMandala } from '../AnimatedMandala';
import { InteractiveStarfield } from './InteractiveStarfield';

const { width, height } = Dimensions.get('window');

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
          <Stop offset="0" stopColor="#E5C07B" />
          <Stop offset="0.5" stopColor={Colors.accent.primary} />
          <Stop offset="1" stopColor={Colors.accent.primary} />
        </SvgGradient>
      </Defs>
      <Path
        d="M24,6 C24,6 18,6 15,12 C12,18 11,22 11,26 L11,34 C11,36 9,38 7,38 L41,38 C39,38 37,36 37,34 L37,26 C37,22 36,18 33,12 C30,6 24,6 24,6 Z"
        fill="url(#bellG)"
      />
      <Path
        d="M20,38 Q24,44 28,38"
        stroke={Colors.accent.primary}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx={24} cy={4} r={2} fill="#E5C07B" />
    </Svg>
  );
}

interface Props {
  isActive: boolean;
  onAllow: () => void;
  onSkip: () => void;
}

export default function NotificationScreen({ isActive, onAllow, onSkip }: Props) {
  // [0] icon, [1] title, [2] body, [3] allow btn, [4] skip btn, [5] chip
  const s = useStaggerEntry(isActive, 6, { baseDelay: 250, stagger: 120 });

  return (
    <View style={styles.container}>
      {/* Stars */}
      <InteractiveStarfield positions={STAR_POS.map(p => ({ ...p, y: p.y * 1.5 }))} />

      {/* Mandala backdrop */}
      <View style={styles.mandalaWrap} pointerEvents="none">
        <AnimatedMandala size={250} color={Colors.accent.primary} opacity={0.04} />
      </View>

      <View style={styles.contentArea}>
        {/* Bell icon in ring */}
        <Animated.View style={[styles.iconRing, s[0]]}>
          <BellIcon size={40} />
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[styles.title, s[1]]}>
          Stay Connected
        </Animated.Text>

        {/* Body */}
        <Animated.Text style={[styles.body, s[2]]}>
          Gentle reminders for prayer times and daily{'\n'}
          verses — like a soft call to spiritual practice
        </Animated.Text>
      </View>

      {/* Buttons */}
      <View style={styles.bottomSection}>
        <Animated.View style={[styles.btnWrap, s[3]]}>
          <TouchableOpacity style={styles.allowBtn} activeOpacity={0.8} onPress={onAllow}>
            <Text style={styles.allowBtnText}>Allow Notifications</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.skipWrap, s[4]]}>
          <TouchableOpacity style={styles.skipBtn} activeOpacity={0.7} onPress={onSkip}>
            <Text style={styles.skipBtnText}>Maybe later</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Chip */}
        <Animated.View style={[styles.chip, s[5]]}>
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
  mandalaWrap: {
    position: 'absolute',
    left: width / 2 - 125,
    top: height * 0.08,
    zIndex: 0,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
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
    color: 'rgba(245, 237, 227, 0.55)',
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
  allowBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allowBtnText: {
    fontFamily: 'serif',
    fontSize: 16,
    color: '#14100C',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  skipWrap: {
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 14,
    color: 'rgba(245, 237, 227, 0.35)',
    letterSpacing: 0.3,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.08)',
    width: '100%',
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.55)',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },
});