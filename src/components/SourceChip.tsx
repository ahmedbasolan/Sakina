import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius } from '../theme/DesignSystem';
import { SourceCitation, HadithGrading } from '../types';

interface SourceChipProps {
  citation: SourceCitation;
  /** Custom handler. If omitted, taps call Linking.openURL(citation.url). */
  onPress?: () => void;
}

const GRADING_LABEL: Record<HadithGrading, string> = {
  sahih: 'Sahih',
  hasan: 'Hasan',
  sahih_li_ghayrihi: 'Sahih li-ghayrihi',
  hasan_li_ghayrihi: 'Hasan li-ghayrihi',
};

const SourceChip: React.FC<SourceChipProps> = ({ citation, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      Linking.openURL(citation.url).catch(() => {
        // Swallow: best-effort link open. No toast/alert to keep chips quiet.
      });
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel={`Open ${citation.label} in browser`}
      activeOpacity={0.7}
    >
      <View style={styles.chip}>
        <Text style={styles.label} numberOfLines={1}>
          {citation.grading ? (
            <Text style={styles.gradingText}>{GRADING_LABEL[citation.grading]} </Text>
          ) : null}
          {citation.label}
        </Text>
        <Ionicons name="open-outline" size={12} color={Colors.text.secondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 235, 210, 0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 235, 210, 0.14)',
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
    fontFamily: Typography.fonts.serif,
  },
  gradingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4ADE80',
    letterSpacing: 0.5,
  },
});

export default SourceChip;
