/**
 * Screen 9: Paywall 3 — Social Proof
 *
 * "Loved by Thousands" — Stats row, testimonials, CTA.
 * All elements use shared stagger animation.
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
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';

const { height } = Dimensions.get('window');

function AwardIcon({ size = 32, color = Colors.accent.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="9" r="6" fill="none" stroke={color} strokeWidth={1.8} />
      <Path
        d="M8.5,14.5 L7,22 L12,19 L17,22 L15.5,14.5"
        fill="none" stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx="12" cy="9" r="2" fill={color} opacity={0.4} />
    </Svg>
  );
}

function StarRating() {
  return (
    <View style={styles.starRow}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Svg key={i} width={14} height={14} viewBox="0 0 24 24">
          <Path
            d="M12,2 L14.9,8.6 L22,9.3 L16.8,14 L18.2,21 L12,17.5 L5.8,21 L7.2,14 L2,9.3 L9.1,8.6 Z"
            fill={Colors.accent.primary}
          />
        </Svg>
      ))}
    </View>
  );
}

interface Testimonial {
  quote: string;
  name: string;
  initial: string;
  days: number;
}

const TESTIMONIALS: Testimonial[] = [
  { quote: 'This app brought me closer to Allah in ways I never imagined', name: 'Aisha R.', initial: 'A', days: 34 },
  { quote: 'The guided journeys transformed my daily practice completely', name: 'Mohammed K.', initial: 'M', days: 67 },
  { quote: 'Every verse feels like it was chosen just for my heart', name: 'Fatima S.', initial: 'F', days: 21 },
];

const STATS = [
  { value: '50K+', label: 'Active users' },
  { value: '4.9', label: 'App rating' },
  { value: '89%', label: 'Complete\njourneys' },
];

interface Props {
  isActive: boolean;
  onStartTrial: () => void;
  onRestore: () => void;
}

export default function PaywallProofScreen({ isActive, onStartTrial, onRestore }: Props) {
  // [0] icon, [1] title, [2] stats, [3] test0, [4] test1, [5] test2
  const s = useStaggerEntry(isActive, 6, { baseDelay: 200, stagger: 130 });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Award icon */}
        <Animated.View style={[styles.iconArea, s[0]]}>
          <View style={styles.iconRing}>
            <AwardIcon size={28} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View style={[styles.titleWrap, s[1]]}>
          <Text style={styles.title}>Loved by Thousands</Text>
          <Text style={styles.subtitle}>Join a growing community of spiritual seekers</Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View style={[styles.statsRow, s[2]]}>
          {STATS.map((stat) => (
            <View key={stat.value} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Testimonials */}
        {TESTIMONIALS.map((t, i) => (
          <Animated.View key={t.name} style={[styles.testimonialCard, s[i + 3]]}>
            <StarRating />
            <Text style={styles.quoteText}>{'\u201C'}{t.quote}{'\u201D'}</Text>
            <View style={styles.authorRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{t.initial}</Text>
              </View>
              <Text style={styles.authorName}>{t.name}</Text>
              <Text style={styles.authorDays}>{t.days} days</Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={onStartTrial}>
          <Text style={styles.ctaBtnText}>Join the Community</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.restoreBtn} activeOpacity={0.7} onPress={onRestore}>
          <Text style={styles.restoreText}>Restore Purchase</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: height * 0.1,
    paddingBottom: 20,
    alignItems: 'center',
  },
  iconArea: { marginBottom: 16 },
  iconRing: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  titleWrap: { alignItems: 'center', marginBottom: 8 },
  title: {
    fontFamily: 'serif', fontSize: 26, color: '#F5EDE3',
    textAlign: 'center', marginBottom: 6, letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14, color: 'rgba(245, 237, 227, 0.45)',
    textAlign: 'center', marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 20, width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 235, 210, 0.04)',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255, 235, 210, 0.06)',
    paddingVertical: 14, alignItems: 'center', gap: 4,
  },
  statValue: {
    fontFamily: 'serif', fontSize: 20, color: '#F5EDE3', fontWeight: '600',
  },
  statLabel: {
    fontSize: 11, color: 'rgba(245, 237, 227, 0.4)',
    textAlign: 'center', letterSpacing: 0.3,
  },
  testimonialCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 235, 210, 0.04)',
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255, 235, 210, 0.06)',
    padding: 18, marginBottom: 12,
  },
  starRow: { flexDirection: 'row', gap: 3, marginBottom: 10 },
  quoteText: {
    fontSize: 15, color: 'rgba(245, 237, 227, 0.8)',
    lineHeight: 22, marginBottom: 14,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  avatarText: { fontSize: 12, color: Colors.accent.primary, fontWeight: '600' },
  authorName: {
    fontSize: 13, color: 'rgba(245, 237, 227, 0.6)',
    fontWeight: '600', flex: 1,
  },
  authorDays: { fontSize: 12, color: 'rgba(245, 237, 227, 0.3)' },
  ctaWrap: {
    paddingHorizontal: 24, paddingBottom: height * 0.10,
    alignItems: 'center', gap: 12,
  },
  ctaBtn: {
    width: '100%', height: 56, borderRadius: 16,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  ctaBtnText: {
    fontSize: 17, fontWeight: '700', color: '#14100C', letterSpacing: 0.5,
  },
  restoreBtn: { paddingVertical: 8 },
  restoreText: {
    fontSize: 13, color: 'rgba(245, 237, 227, 0.3)', letterSpacing: 0.3,
  },
});