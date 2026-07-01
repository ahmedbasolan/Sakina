import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ViewStyle,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, Typography, BorderRadius, Elevation } from '../theme/DesignSystem';
import { Content } from '../types';

interface HadithLayerProps {
  hadith: Content;
  accentColor?: string;
  scrollY?: Animated.Value;
  topInset?: number;
}

const HadithLayer: React.FC<HadithLayerProps> = ({
  hadith,
  accentColor = Colors.accent.primary,
  scrollY,
  topInset = Spacing.lg,
}) => {
  const containerStyle: ViewStyle = {
    marginTop: topInset,
    marginHorizontal: Spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: accentColor,
    overflow: 'hidden',
    ...Elevation.medium,
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.contentContainer}
      scrollEventThrottle={16}
      onScroll={scrollY ? (e) => scrollY.setValue(e.nativeEvent.contentOffset.y) : undefined}
    >
      <View style={containerStyle}>
        <BlurView intensity={85} style={styles.blurContainer}>
          {/* Arabic text */}
          {hadith.arabicText && (
            <Text
              style={[
                styles.arabicText,
                { color: Colors.text.primary },
              ]}
              allowFontScaling
            >
              {hadith.arabicText}
            </Text>
          )}

          {/* English translation */}
          <Text
            style={[
              styles.translationText,
              { color: Colors.text.secondary },
            ]}
            allowFontScaling
          >
            {hadith.englishTranslation || hadith.translation || ''}
          </Text>

          {/* Grading + source line */}
          <Text
            style={[
              styles.sourceLine,
              { color: accentColor },
            ]}
            allowFontScaling
          >
            {hadith.source} · {(hadith.propheticPractice?.grading || 'authentic')
              .replace(/_/g, ' ')
              .split(' ')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')}
          </Text>
        </BlurView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  blurContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.glass.medium}`,
  },
  arabicText: {
    fontSize: Typography.sizes.h2,
    fontFamily: Typography.fonts.arabic,
    lineHeight: Typography.sizes.h2 * 1.6,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  translationText: {
    fontSize: Typography.sizes.body,
    fontFamily: Typography.fonts.latin,
    lineHeight: Typography.sizes.body * 1.5,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  sourceLine: {
    fontSize: Typography.sizes.small,
    fontFamily: Typography.fonts.latin,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default HadithLayer;
