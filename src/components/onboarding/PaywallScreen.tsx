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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';
import { InteractiveStarfield } from './InteractiveStarfield';
import { AnimatedMandala } from '../AnimatedMandala';
import Icon from '../Icon';

const { width, height } = Dimensions.get('window');

const STAR_POS = [
  { x: 0.1, y: 0.1, s: 2.5, d: 0 },
  { x: 0.85, y: 0.08, s: 2, d: 400 },
  { x: 0.2, y: 0.25, s: 1.5, d: 200 },
  { x: 0.75, y: 0.2, s: 2, d: 700 },
  { x: 0.5, y: 0.15, s: 1.5, d: 100 },
];

const FEATURES: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; desc: string }[] = [
  { icon: 'heart-outline', title: 'Daily Personalised Verses', desc: 'Matched to your mood and emotional state every day' },
  { icon: 'sync-outline', title: 'Unlimited Heart Check-ins', desc: 'Track your spiritual and emotional journey over time' },
  { icon: 'notifications-outline', title: 'Full Reminder Suite', desc: 'Fajr, Dhuhr, Asr, Maghrib & Isha — all five reminders' },
];

interface Props {
  isActive: boolean;
  onComplete: () => void;
}

export default function PaywallScreen({ isActive, onComplete }: Props) {
  // [0] badge, [1] title, [2] subtitle, [3,4,5] features, [6] verse, [7] CTA, [8] skip
  const s = useStaggerEntry(isActive, 9, { baseDelay: 300, stagger: 100 });
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [isActive]);

  const handleSubscribe = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In a real app, trigger RevenueCat / StoreKit purchase here.
    // For now, act as if successful and proceed.
    onComplete();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  };

  return (
    <View style={styles.container}>
      <InteractiveStarfield positions={STAR_POS} />

      <View style={styles.mandalaOuter} pointerEvents="none">
        <AnimatedMandala size={400} color={Colors.accent.primary} opacity={0.03} />
      </View>

      <View style={styles.contentArea}>
        {/* Premium Badge */}
        <Animated.View style={[styles.badgeWrap, s[0]]}>
          <Icon name="star" size={14} color={Colors.accent.primary} />
          <Text style={styles.badgeText}>SAKINA PREMIUM</Text>
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[styles.title, s[1]]}>
          Deepen Your{'\n'}Spiritual Practice
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, s[2]]}>
          Unlock the full experience and let Sakina guide you every step of the way.
        </Animated.Text>

        {/* Features List */}
        <View style={styles.featuresList}>
          {FEATURES.map((feat, i) => (
            <Animated.View key={i} style={[styles.featureRow, s[3 + i]]}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={feat.icon} size={20} color={Colors.accent.primary} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureDesc}>{feat.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Quranic verse quote */}
        <Animated.View style={[styles.verseCard, s[6]]}>
          <Text style={styles.verseArabic}>أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ</Text>
          <Text style={styles.verseTranslation}>
            "Verily, in the remembrance of Allah do hearts find rest."
          </Text>
          <Text style={styles.verseRef}>— Surah Ar-Ra'd 13:28</Text>
        </Animated.View>
      </View>

      <View style={styles.bottomSection}>
        {/* Main CTA */}
        <Animated.View style={[styles.ctaWrap, s[7], { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.ctaBtn}
            activeOpacity={0.85}
            onPress={handleSubscribe}
          >
            <LinearGradient
              colors={['#E8C84A', '#B8860B']}
              style={styles.ctaBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.ctaText}>Start 7-Day Free Trial</Text>
              <Text style={styles.ctaSubtext}>Then $4.99/month. Cancel anytime.</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Skip Button (Soft Paywall Escape) */}
        <Animated.View style={[styles.skipWrap, s[8]]}>
          <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <Text style={styles.skipText}>Maybe later</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mandalaOuter: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.2,
    zIndex: 0,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    zIndex: 2,
    paddingTop: height * 0.12,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.accent.primary,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 34,
    color: '#F5EDE3',
    lineHeight: 42,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(245, 237, 227, 0.7)',
    lineHeight: 24,
    marginBottom: 24,
    paddingRight: 20,
  },
  featuresList: {
    gap: 20,
    marginBottom: 0,
  },
  verseCard: {
    marginTop: 28,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    gap: 8,
  },
  verseArabic: {
    fontSize: 18,
    color: Colors.accent.primary,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    opacity: 0.85,
    textShadowColor: 'rgba(212, 175, 55, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  verseTranslation: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.7)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  verseRef: {
    fontSize: 11,
    color: 'rgba(212, 175, 55, 0.5)',
    letterSpacing: 0.5,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    color: '#F5EDE3',
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  featureDesc: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.5)',
    lineHeight: 18,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: height * 0.08,
    zIndex: 2,
  },
  ctaWrap: { width: '100%' },
  ctaBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 28,
  },
  ctaText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 18,
    fontWeight: '600',
    color: '#0C1A2E',
    marginBottom: 4,
  },
  ctaSubtext: {
    fontSize: 12,
    color: 'rgba(12, 26, 46, 0.7)',
  },
  skipWrap: {
    marginTop: 24,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 15,
    color: 'rgba(245, 237, 227, 0.5)',
  },
});