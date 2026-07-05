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

export type ReaderViewMode = 'single' | 'page';

interface ReadingViewModalProps {
  isVisible: boolean;
  onClose: () => void;
  viewMode: ReaderViewMode;
  onChangeViewMode: (mode: ReaderViewMode) => void;
  showTranslit: boolean;
  onToggleTranslit: () => void;
}

const Toggle: React.FC<{ value: boolean; onPress: () => void; label?: string }> = ({ value, onPress, label }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.toggleBase, value && styles.toggleActive]}
    accessibilityRole="switch"
    accessibilityLabel={label}
    accessibilityState={{ checked: value }}
  >
    <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
  </TouchableOpacity>
);

/** Reading-view picker for the Quran reader — same sheet/overlay language as
 *  Guidance's DisplayPreferencesModal, scoped to just the settings this
 *  screen needs. */
const ReadingViewModal: React.FC<ReadingViewModalProps> = ({
  isVisible,
  onClose,
  viewMode,
  onChangeViewMode,
  showTranslit,
  onToggleTranslit,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss reading view options">
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
              <View style={styles.header}>
                <Text style={styles.title}>READING VIEW</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>VIEW</Text>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={[styles.optionButton, viewMode === 'single' && styles.optionButtonActive]}
                    onPress={() => onChangeViewMode('single')}
                    accessibilityRole="button"
                    accessibilityLabel="Single verse"
                    accessibilityState={{ selected: viewMode === 'single' }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={viewMode === 'single' ? Colors.background.primary : Colors.text.secondary}
                    />
                    <Text style={[styles.optionText, viewMode === 'single' && styles.optionTextActive]}>
                      VERSE
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionButton, viewMode === 'page' && styles.optionButtonActive]}
                    onPress={() => onChangeViewMode('page')}
                    accessibilityRole="button"
                    accessibilityLabel="Whole page"
                    accessibilityState={{ selected: viewMode === 'page' }}
                  >
                    <Ionicons
                      name="reorder-four-outline"
                      size={20}
                      color={viewMode === 'page' ? Colors.background.primary : Colors.text.secondary}
                    />
                    <Text style={[styles.optionText, viewMode === 'page' && styles.optionTextActive]}>
                      PAGE
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.switchRow}>
                  <View style={styles.switchLabelWrap}>
                    <Text style={[styles.sectionTitle, styles.switchTitle]}>TRANSLITERATION</Text>
                    <Text style={styles.sectionSubtitle}>Show phonetics between Arabic and translation</Text>
                  </View>
                  <Toggle
                    value={showTranslit}
                    onPress={onToggleTranslit}
                    label="Transliteration"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
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

export default ReadingViewModal;
