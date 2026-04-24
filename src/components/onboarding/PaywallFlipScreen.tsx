/**
 * Screen 7: Paywall 1 — The Flip
 *
 * 3D card flip. Front: premium features. Back: pricing.
 * Clean layout with stagger entry. CTA appears after flip.
 */
import React, { useEffect, useRef, useState } from 'react';
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

const { width, height } = Dimensions.get('window');
const CARD_W = width * 0.84;
const CARD_H = height * 0.46;

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

function CheckIcon({ color = '#4ADE80' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M20,6 L9,17 L4,12"
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const FRONT_FEATURES = [
  'Unlimited guided journeys',
  'Personalized verse recommendations',
  'Advanced mood tracking',
  'Private journal with insights',
];

interface Props {
  isActive: boolean;
  onContinue: () => void;
}

export default function PaywallFlipScreen({ isActive, onContinue }: Props) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [showBack, setShowBack] = useState(false);
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(30)).current;

  // [0] card, [1] chip
  const s = useStaggerEntry(isActive, 2, { baseDelay: 250, stagger: 200 });

  useEffect(() => {
    if (!isActive) return;
    flipAnim.setValue(0);
    btnOpacity.setValue(0);
    btnSlide.setValue(30);
    setShowBack(false);
  }, [isActive]);

  const handleFlip = () => {
    if (showBack) return;

    Animated.timing(flipAnim, {
      toValue: 1, duration: 800, useNativeDriver: true,
    }).start();

    setTimeout(() => setShowBack(true), 400);

    // Show CTA after flip
    Animated.sequence([
      Animated.delay(1000),
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(btnSlide, { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '90deg'],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-90deg', '-90deg', '0deg'],
  });

  const cancelDate = new Date();
  cancelDate.setDate(cancelDate.getDate() + 7);
  const cancelDateStr = cancelDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.contentArea}>
      {/* Card */}
      <Animated.View style={[styles.cardContainer, s[0]]}>
        {/* FRONT */}
        <Animated.View
          style={[
            styles.card, styles.cardFront,
            { transform: [{ perspective: 1200 }, { rotateY: frontRotate }], backfaceVisibility: 'hidden' },
          ]}
          pointerEvents={showBack ? 'none' : 'auto'}
        >
          <TouchableOpacity activeOpacity={0.95} onPress={handleFlip} style={styles.cardInner}>
            <View style={styles.iconRing}>
              <SparklesIcon size={26} />
            </View>
            <Text style={styles.frontTitle}>Try Noor Premium</Text>
            <Text style={styles.frontSubtitle}>
              Start your 7-day free trial and{'\n'}experience the complete spiritual{'\n'}journey
            </Text>
            <View style={styles.featureList}>
              {FRONT_FEATURES.map((feat) => (
                <View key={feat} style={styles.featureRow}>
                  <CheckIcon />
                  <Text style={styles.featureText}>{feat}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.tapHint}>Tap to flip</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* BACK */}
        <Animated.View
          style={[
            styles.card, styles.cardBack,
            { transform: [{ perspective: 1200 }, { rotateY: backRotate }], backfaceVisibility: 'hidden' },
          ]}
          pointerEvents={showBack ? 'auto' : 'none'}
        >
          <View style={styles.cardInner}>
            <Text style={[styles.frontTitle, { color: Colors.accent.primary }]}>Premium Plan</Text>
            <View style={styles.pricingBlock}>
              <Text style={styles.priceAmount}>$4.99</Text>
              <Text style={styles.pricePeriod}>/month</Text>
            </View>
            <Text style={styles.priceNote}>after 7-day free trial</Text>
            <View style={styles.timelineDivider} />
            {[
              'Today — Full access begins',
              'Day 5 — Reminder before trial ends',
              'Day 7 — Cancel anytime before billing',
            ].map((text) => (
              <View key={text} style={styles.timelineRow}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineText}>{text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* CTA (after flip) */}
        <Animated.View
          style={[styles.ctaWrap, { opacity: btnOpacity, transform: [{ translateY: btnSlide }] }]}
        >
          <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={onContinue}>
            <Text style={styles.ctaText}>Start Free Trial</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Chip */}
        <Animated.View style={[styles.bottomChip, s[1]]}>
          <Text style={styles.chipText}>
            No payment required today · Cancel before {cancelDateStr}
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
    paddingHorizontal: 24,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: height * 0.10,
    gap: 12,
  },
  cardContainer: {
    width: CARD_W,
    height: CARD_H,
    marginBottom: 24,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  cardFront: {
    backgroundColor: 'rgba(20, 28, 45, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  cardBack: {
    backgroundColor: 'rgba(20, 28, 45, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  cardInner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  frontTitle: {
    fontFamily: 'serif',
    fontSize: 22,
    color: '#F5EDE3',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  frontSubtitle: {
    fontSize: 14,
    color: 'rgba(245, 237, 227, 0.5)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 22,
  },
  featureList: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(245, 237, 227, 0.8)',
    letterSpacing: 0.2,
  },
  tapHint: {
    fontSize: 12,
    color: 'rgba(245, 237, 227, 0.25)',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pricingBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  priceAmount: {
    fontFamily: 'serif',
    fontSize: 36,
    color: Colors.accent.primary,
    fontWeight: '700',
  },
  pricePeriod: {
    fontSize: 16,
    color: 'rgba(212, 175, 55, 0.7)',
    marginLeft: 4,
  },
  priceNote: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.4)',
    marginBottom: 20,
  },
  timelineDivider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(245, 237, 227, 0.08)',
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    width: '100%',
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(212, 175, 55, 0.5)',
  },
  timelineText: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.55)',
    flex: 1,
  },
  ctaWrap: {
    width: '100%',
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
    fontSize: 17,
    color: '#14100C',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  bottomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 245, 220, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 220, 0.08)',
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.55)',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },
});