import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { UserPreferences, LanguagePreference } from '../types';

interface DisplayPreferencesModalProps {
  isVisible: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreference: (newPrefs: Partial<UserPreferences>) => void;
  isPremium: boolean;
  /** Display name of the active background theme, or null for Default. */
  selectedThemeName: string | null;
  /** Open the full background-theme picker (parent closes this sheet first). */
  onOpenBackgroundPicker: () => void;
}

const Toggle: React.FC<{ value: boolean; onPress: () => void }> = ({ value, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.toggleBase, value && styles.toggleActive]}
    accessibilityRole="switch"
    accessibilityState={{ checked: value }}
  >
    <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
  </TouchableOpacity>
);

const DisplayPreferencesModal: React.FC<DisplayPreferencesModalProps> = ({
  isVisible,
  onClose,
  preferences,
  onUpdatePreference,
  isPremium,
  selectedThemeName,
  onOpenBackgroundPicker,
}) => {
  const insets = useSafeAreaInsets();
  const setLanguage = (lang: LanguagePreference) => onUpdatePreference({ primaryLanguage: lang });

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
              <View style={styles.header}>
                <Text style={styles.title}>READING OPTIONS</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* ── Primary language ── */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PRIMARY LANGUAGE</Text>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={[styles.optionButton, preferences.primaryLanguage === 'english' && styles.optionButtonActive]}
                    onPress={() => setLanguage('english')}
                  >
                    <Ionicons
                      name="text-outline"
                      size={20}
                      color={preferences.primaryLanguage === 'english' ? Colors.background.primary : Colors.text.secondary}
                    />
                    <Text style={[styles.optionText, preferences.primaryLanguage === 'english' && styles.optionTextActive]}>
                      ENGLISH
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionButton, preferences.primaryLanguage === 'arabic' && styles.optionButtonActive]}
                    onPress={() => setLanguage('arabic')}
                  >
                    <Text style={[styles.arabicIcon, preferences.primaryLanguage === 'arabic' && styles.arabicIconActive]}>
                      ع
                    </Text>
                    <Text style={[styles.optionText, preferences.primaryLanguage === 'arabic' && styles.optionTextActive]}>
                      ARABIC
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Recitation ── */}
              <View style={styles.section}>
                <View style={styles.switchRow}>
                  <View style={styles.switchLabelWrap}>
                    <Text style={[styles.sectionTitle, styles.switchTitle]}>AUTO-PLAY RECITATION</Text>
                    <Text style={styles.sectionSubtitle}>Play recitation when a verse opens</Text>
                  </View>
                  <Toggle
                    value={preferences.autoPlayAudio}
                    onPress={() => onUpdatePreference({ autoPlayAudio: !preferences.autoPlayAudio })}
                  />
                </View>

                <View style={[styles.switchRow, { marginTop: Spacing.xl }]}>
                  <View style={styles.switchLabelWrap}>
                    <Text style={[styles.sectionTitle, styles.switchTitle]}>TRANSLITERATION</Text>
                    <Text style={styles.sectionSubtitle}>Show phonetics under the Arabic</Text>
                  </View>
                  <Toggle
                    value={preferences.showTransliteration}
                    onPress={() => onUpdatePreference({ showTransliteration: !preferences.showTransliteration })}
                  />
                </View>
              </View>

              {/* ── Background (premium) ── */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>BACKGROUND</Text>
                <TouchableOpacity style={styles.backgroundRow} onPress={onOpenBackgroundPicker} activeOpacity={0.8}>
                  <Ionicons name="image-outline" size={20} color={Colors.accent.primary} />
                  <Text style={styles.backgroundValue} numberOfLines={1}>
                    {selectedThemeName ?? 'Default'}
                  </Text>
                  {!isPremium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="lock-closed" size={10} color={Colors.background.primary} />
                      <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                <Text style={styles.doneButtonText}>DONE</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: Typography.sizes.small,
    fontWeight: '700',
    color: Colors.accent.primary,
    letterSpacing: 2,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.detail,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
  },
  // Toggle-row titles sit directly above their own subtitle, so they need a much
  // tighter gap than standalone section headers (which space to a control below).
  switchTitle: {
    marginBottom: 2,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  optionButton: {
    flex: 1,
    height: 54,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionButtonActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  optionText: {
    fontSize: Typography.sizes.detail,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 1,
  },
  optionTextActive: {
    color: Colors.background.primary,
  },
  arabicIcon: {
    fontSize: 18,
    color: Colors.text.secondary,
    fontFamily: Typography.fonts.arabic,
  },
  arabicIconActive: {
    color: Colors.background.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabelWrap: {
    flex: 1,
    paddingRight: Spacing.lg,
  },
  toggleBase: {
    width: 54,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 3,
  },
  toggleActive: {
    backgroundColor: Colors.accent.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.text.primary,
    transform: [{ translateX: 0 }],
  },
  toggleThumbActive: {
    transform: [{ translateX: 24 }],
  },
  backgroundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    height: 54,
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  backgroundValue: {
    flex: 1,
    fontSize: Typography.sizes.detail,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  premiumBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: Colors.background.primary,
  },
  doneButton: {
    backgroundColor: Colors.accent.primary,
    height: 54,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  doneButtonText: {
    color: Colors.background.primary,
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: Typography.sizes.small,
  },
});

export default DisplayPreferencesModal;
