import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { UserPreferences, LanguagePreference } from '../types';

interface DisplayPreferencesModalProps {
  isVisible: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreference: (newPrefs: Partial<UserPreferences>) => void;
}

const DisplayPreferencesModal: React.FC<DisplayPreferencesModalProps> = ({
  isVisible,
  onClose,
  preferences,
  onUpdatePreference,
}) => {
  const handleLanguageToggle = (lang: LanguagePreference) => {
    onUpdatePreference({ primaryLanguage: lang });
  };

  const handleTransliterationToggle = () => {
    onUpdatePreference({ showTransliteration: !preferences.showTransliteration });
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <Text style={styles.title}>DISPLAY OPTIONS</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PRIMARY LANGUAGE</Text>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      preferences.primaryLanguage === 'english' && styles.optionButtonActive,
                    ]}
                    onPress={() => handleLanguageToggle('english')}
                  >
                    <Ionicons
                      name="text-outline"
                      size={20}
                      color={
                        preferences.primaryLanguage === 'english'
                          ? Colors.background.primary
                          : Colors.text.secondary
                      }
                    />
                    <Text
                      style={[
                        styles.optionText,
                        preferences.primaryLanguage === 'english' && styles.optionTextActive,
                      ]}
                    >
                      ENGLISH
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      preferences.primaryLanguage === 'arabic' && styles.optionButtonActive,
                    ]}
                    onPress={() => handleLanguageToggle('arabic')}
                  >
                    <Text
                      style={[
                        styles.arabicIcon,
                        preferences.primaryLanguage === 'arabic' && styles.arabicIconActive,
                      ]}
                    >
                      ع
                    </Text>
                    <Text
                      style={[
                        styles.optionText,
                        preferences.primaryLanguage === 'arabic' && styles.optionTextActive,
                      ]}
                    >
                      ARABIC
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>IMMERSIVE THEME</Text>
                <View style={styles.optionsContainer}>
                  {['Sand', 'Ocean', 'Dawn'].map((theme) => (
                    <TouchableOpacity
                      key={theme}
                      style={[
                        styles.optionButton,
                        styles.themeOption,
                        // Placeholder selection logic
                        theme.toLowerCase() === 'sand' && styles.optionButtonActive,
                      ]}
                      onPress={() => console.log('Theme changed to:', theme)}
                    >
                      <View
                        style={[
                          styles.themeDot,
                          {
                            backgroundColor:
                              theme === 'Sand'
                                ? Colors.accent.primary
                                : theme === 'Ocean'
                                  ? '#2ED3C6'
                                  : '#E8A87C',
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.optionText,
                          theme.toLowerCase() === 'sand' && styles.optionTextActive,
                        ]}
                      >
                        {theme.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.switchRow}>
                  <View>
                    <Text style={styles.sectionTitle}>TRANSLITERATION</Text>
                    <Text style={styles.sectionSubtitle}>Show phonetics for recitation</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleTransliterationToggle}
                    style={[
                      styles.toggleBase,
                      preferences.showTransliteration && styles.toggleActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        preferences.showTransliteration && styles.toggleThumbActive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                <Text style={styles.doneButtonText}>APPLY SETTINGS</Text>
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
    backgroundColor: Colors.surfaceSheet,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 50 : Spacing.xxl,
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
    fontSize: Typography.sizes.detail - 1,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 1.5,
    marginBottom: Spacing.lg,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
    marginTop: -Spacing.md,
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
    fontSize: Typography.sizes.small - 3,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 1,
  },
  themeOption: {
    flex: 1,
    height: 44,
    paddingHorizontal: 8,
  },
  themeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  doneButton: {
    backgroundColor: 'rgba(46, 211, 198, 0.15)',
    height: 54,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 211, 198, 0.3)',
    marginTop: Spacing.sm,
  },
  doneButtonText: {
    color: Colors.accent.primary,
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: Typography.sizes.small - 1,
  },
});

export default DisplayPreferencesModal;
