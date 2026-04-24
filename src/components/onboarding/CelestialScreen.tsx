/**
 * Screen 10: Complete
 *
 * Clean farewell screen with sparkle icon, title, Arabic blessing,
 * and "Enter Noor" CTA. All elements use shared stagger animation.
 */
import React from 'react';
import { Colors } from '../../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';

const { height } = Dimensions.get('window');

function SparklesIcon({ size = 28, color = Colors.accent.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12,2 C12,2 13.5,8.5 18,12 C13.5,15.5 12,22 12,22 C12,22 10.5,15.5 6,12 C10.5,8.5 12,2 12,2 Z"
        fill={color}
      />
      <Path
        d="M19,2 C19,2 19.5,4 21,5 C19.5,6 19,8 19,8 C19,8 18.5,6 17,5 C18.5,4 19,2 19,2 Z"
        fill={color}
        opacity={0.6}
      />
    </Svg>
  );
}

interface Props {
  isActive: boolean;
  onBegin: () => void;
}

export default function CelestialScreen({ isActive, onBegin }: Props) {
  // [0] icon, [1] title, [2] subtitle, [3] arabic, [4] CTA
  const s = useStaggerEntry(isActive, 5, { baseDelay: 300, stagger: 150 });

  return (
    <View style={styles.container}>
      <View style={styles.contentArea}>
        {/* Icon with ring */}
        <Animated.View style={[styles.iconRing, s[0]]}>
          <SparklesIcon size={26} />
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[styles.title, s[1]]}>
          Your Journey{'\n'}Begins
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, s[2]]}>
          May every step bring you closer to peace{'\n'}and understanding
        </Animated.Text>

        {/* Arabic blessing */}
        <Animated.Text style={[styles.arabicBlessing, s[3]]}>
          {'\u0628\u0627\u0631\u0643 \u0627\u0644\u0644\u0647 \u0641\u064A\u0643'}
        </Animated.Text>
      </View>

      {/* CTA */}
      <Animated.View style={[styles.ctaWrap, s[4]]}>
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={onBegin}>
          <Text style={styles.ctaText}>Enter Noor</Text>
        </TouchableOpacity>
      </Animated.View>
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
    paddingHorizontal: 40,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 28,
    color: '#F5EDE3',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(245, 237, 227, 0.5)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 18,
  },
  arabicBlessing: {
    fontSize: 20,
    color: 'rgba(212, 175, 55, 0.6)',
    textAlign: 'center',
    letterSpacing: 1,
  },
  ctaWrap: {
    paddingHorizontal: 24,
    paddingBottom: height * 0.10,
  },
  ctaBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '600',
    color: '#14100C',
    letterSpacing: 0.8,
  },
});