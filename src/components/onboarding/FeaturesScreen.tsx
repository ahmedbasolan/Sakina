/**
 * Screen 4: Features
 *
 * "Everything You Need" — 4 feature rows with icons.
 * Staggered entry via shared hook. Continue button at bottom.
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

interface FeatureData {
  title: string;
  description: string;
  iconPath: string;
  accentColor: string;
}

const FEATURES: FeatureData[] = [
  {
    title: 'Mood-Based Verses',
    description: 'Personalized Quranic guidance for every emotion',
    // Heart
    iconPath: 'M12,20 C12,20 4,14.5 4,9 C4,6 6.5,4 9,4 C10.5,4 11.5,4.8 12,5.5 C12.5,4.8 13.5,4 15,4 C17.5,4 20,6 20,9 C20,14.5 12,20 12,20 Z',
    accentColor: '#F472B6',
  },
  {
    title: '14-Day Journeys',
    description: 'Guided paths for spiritual transformation',
    // Compass
    iconPath: 'M12,2 C17.5,2 22,6.5 22,12 C22,17.5 17.5,22 12,22 C6.5,22 2,17.5 2,12 C2,6.5 6.5,2 12,2 Z M16.2,7.8 L13.5,13.5 L7.8,16.2 L10.5,10.5 Z',
    accentColor: '#A78BFA',
  },
  {
    title: 'Private Journal',
    description: 'Reflect and grow with secure journaling',
    // Pen / edit
    iconPath: 'M16.5,3.5 C17.3,2.7 18.7,2.7 19.5,3.5 L20.5,4.5 C21.3,5.3 21.3,6.7 20.5,7.5 L8.5,19.5 L3,21 L4.5,15.5 Z M15,5 L19,9',
    accentColor: '#60A5FA',
  },
  {
    title: 'Verse Library',
    description: 'Explore curated collections of wisdom',
    // Book
    iconPath: 'M4,19 C4,17.9 5.1,17 6.5,17 L20,17 L20,3 L6.5,3 C5.1,3 4,3.9 4,5 L4,19 Z M4,19 C4,20.1 5.1,21 6.5,21 L20,21',
    accentColor: '#FBBF24',
  },
];

interface Props {
  isActive: boolean;
  onNext: () => void;
}

export default function FeaturesScreen({ isActive, onNext }: Props) {
  // [0] title, [1] subtitle, [2-5] feature cards, [6] CTA
  const s = useStaggerEntry(isActive, 7, { baseDelay: 200, stagger: 110 });

  return (
    <View style={styles.container}>
      <View style={styles.contentArea}>
        {/* Title */}
        <Animated.Text style={[styles.title, s[0]]}>
          Everything You Need
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, s[1]]}>
          Powerful features for your spiritual practice
        </Animated.Text>

        {/* Feature cards */}
        <View style={styles.cardList}>
          {FEATURES.map((feat, i) => (
            <Animated.View key={feat.title} style={[styles.card, s[i + 2]]}>
              {/* Accent line */}
              <View style={[styles.accentLine, { backgroundColor: feat.accentColor }]} />

              {/* Icon */}
              <View style={[styles.iconWrap, { borderColor: feat.accentColor + '25' }]}>
                <Svg width={22} height={22} viewBox="0 0 24 24">
                  <Path
                    d={feat.iconPath}
                    fill="none"
                    stroke={feat.accentColor}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>

              {/* Text */}
              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>{feat.title}</Text>
                <Text style={styles.cardDesc}>{feat.description}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Continue button */}
      <Animated.View style={[styles.ctaWrap, s[6]]}>
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={onNext}>
          <Text style={styles.ctaText}>Continue</Text>
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
    paddingHorizontal: 28,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 26,
    color: '#F5EDE3',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(245, 237, 227, 0.45)',
    marginBottom: 32,
    letterSpacing: 0.3,
  },
  cardList: {
    width: '100%',
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 235, 210, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 210, 0.06)',
    padding: 16,
    gap: 14,
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'serif',
    fontSize: 16,
    color: '#F5EDE3',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  cardDesc: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.45)',
    lineHeight: 18,
    letterSpacing: 0.1,
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
    fontSize: 17,
    color: '#14100C',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});