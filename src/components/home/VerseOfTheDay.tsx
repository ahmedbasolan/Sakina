import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/DesignSystem';
import { DailyVerse } from '../../services/dailyVerseService';

interface VerseOfTheDayProps {
  dailyVerse: DailyVerse;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export function VerseOfTheDay({ dailyVerse, fadeAnim, slideAnim }: VerseOfTheDayProps) {
  return (
    <Animated.View style={[styles.verseSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.verseCard}>
        {/* Gold top line */}
        <LinearGradient colors={['transparent', Colors.accent.primary, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verseBorderLine} />

        {/* Badge */}
        <View style={styles.verseBadge}>
          <Text style={styles.verseBadgeStar}>★</Text>
          <Text style={styles.verseBadgeText}>VERSE OF THE DAY</Text>
          <Text style={styles.verseBadgeStar}>★</Text>
        </View>

        {/* Arabic — only render if non-empty to avoid orphaned whitespace */}
        {!!dailyVerse.arabic && (
          <Text style={styles.verseArabic}>{dailyVerse.arabic}</Text>
        )}

        {/* Ornament divider */}
        <Text style={styles.ornamentStar}>✦</Text>

        {/* Translation */}
        <Text style={styles.verseTranslation}>
          {dailyVerse.translation || 'Translation not available'}
        </Text>

        {/* Reference */}
        {!!dailyVerse.ref && (
          <Text style={styles.verseRef}>— {dailyVerse.ref}</Text>
        )}

        {/* Gold bottom line */}
        <LinearGradient colors={['transparent', '#C9A84C60', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verseBorderLineBottom} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  verseSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  verseCard: {
    backgroundColor: 'rgba(12, 18, 28, 0.6)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.15)',
  },
  verseBorderLine: {
    height: 1,
    marginBottom: 20,
  },
  verseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  verseBadgeStar: {
    fontSize: 12,
    color: Colors.accent.primary,
  },
  verseBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent.primary,
    letterSpacing: 1.5,
  },
  verseArabic: {
    fontSize: 22,
    color: '#F5EDE3',
    textAlign: 'center',
    fontFamily: 'Amiri-Regular',
    lineHeight: 36,
    marginBottom: 16,
  },
  ornamentStar: {
    fontSize: 16,
    color: Colors.accent.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  verseTranslation: {
    fontSize: 15,
    color: 'rgba(245, 237, 227, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  verseRef: {
    fontSize: 12,
    color: 'rgba(245, 237, 227, 0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  verseBorderLineBottom: {
    height: 1,
    marginTop: 20,
  },
});
