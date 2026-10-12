import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/DesignSystem';
import { LeaderChoice } from '../utils/leaderChoice';

interface Props {
  visible: boolean;
  current: LeaderChoice | null;
  onChoose: (choice: LeaderChoice) => void;
  onClose: () => void;
}

const OPTIONS: { value: LeaderChoice; label: string }[] = [
  { value: 'man', label: 'A man' },
  { value: 'woman', label: 'A woman, leading women' },
];

/**
 * Prayer Leadership's one question. The fiqh turns on who LEADS, not who is led
 * (a man leading only his wife still follows the men's rules), so the copy asks
 * that and never asks the user to state their sex. Stored on-device only.
 */
export const LeaderChoiceSheet: React.FC<Props> = ({ visible, current, onChoose, onClose }) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Sibling, not parent: an accessible Pressable wrapping the sheet hides its
            children from VoiceOver on iOS, which would lock the options away. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <Text style={styles.title} accessibilityRole="header">Who is leading?</Text>
          <Text style={styles.body}>
            A few days change when a woman leads women: where she stands, reciting aloud,
            and how the row corrects her.
          </Text>
          {OPTIONS.map((o) => {
            const selected = current === o.value;
            return (
              <TouchableOpacity
                key={o.value}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => onChoose(o.value)}
                accessibilityRole="button"
                accessibilityLabel={o.label}
                accessibilityState={{ selected }}
              >
                <Text style={styles.optionText}>{o.label}</Text>
                {selected && <Ionicons name="checkmark" size={20} color={Colors.accent.primary} />}
              </TouchableOpacity>
            );
          })}
          <Text style={styles.caption}>Stays on your device. Never sent to Sakina.</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  body: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    lineHeight: Typography.sizes.small * 1.5,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // body text (16) + 2 × lg (16) ≈ 48pt — clears the 44pt target with tokens only
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    backgroundColor: Colors.glass.light,
    marginBottom: Spacing.sm,
  },
  optionSelected: { borderColor: Colors.accent.primary },
  optionText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
  },
  caption: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
