import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, BorderRadius } from '../theme/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { HapticsService } from '../services/hapticsService';
import AudioPlayerButton from './AudioPlayerButton';

interface FloatingActionRowProps {
  layerType: 'verse' | 'context' | 'practice' | 'reflection';
  onShare: () => void;
  onSave?: () => void;
  onCheckAll?: () => void;
  onSaveReflection?: () => void;
  isSaved?: boolean;
  audioKey?: string;
}

const FloatingActionRow: React.FC<FloatingActionRowProps> = ({
  layerType,
  onShare,
  onSave,
  onCheckAll,
  onSaveReflection,
  isSaved,
  audioKey,
}) => {
  const handleAction = (callback?: () => void) => {
    HapticsService.impactAsync('LIGHT');
    callback?.();
  };

  const renderSecondaryAction = () => {
    switch (layerType) {
      case 'verse':
      case 'context':
        return (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAction(onSave)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Saved' : 'Save'}
            accessibilityState={{ selected: !!isSaved }}
          >
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={20}
              color={isSaved ? Colors.status.error : Colors.text.primary}
            />
            <Text style={styles.actionLabel}>{isSaved ? 'SAVED' : 'SAVE'}</Text>
          </TouchableOpacity>
        );
      case 'practice':
        return (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAction(onCheckAll)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Check all practice steps"
          >
            <Ionicons name="checkmark-done-outline" size={20} color={Colors.accent.primary} />
            <Text style={styles.actionLabel}>CHECK ALL</Text>
          </TouchableOpacity>
        );
      case 'reflection':
        return (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAction(onSaveReflection)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Save reflection draft"
          >
            <Ionicons name="save-outline" size={20} color={Colors.accent.secondary} />
            <Text style={styles.actionLabel}>SAVE DRAFT</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  const showAudio = !!audioKey && (layerType === 'verse' || layerType === 'context');

  return (
    <View style={styles.container}>
      {/* Frosted-glass surface, clipped to the pill */}
      <BlurView intensity={45} tint="dark" style={styles.blurFill} pointerEvents="none" />

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleAction(onShare)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Share"
      >
        <Ionicons name="share-outline" size={18} color={Colors.text.primary} />
        <Text style={styles.actionLabel}>SHARE</Text>
      </TouchableOpacity>

      {showAudio && (
        <>
          <View style={styles.divider} />
          <AudioPlayerButton
            verseKey={audioKey!}
            size={30}
            iconSize={20}
            color={Colors.accent.primary}
            showLabel={false}
            containerStyle={styles.audioButton}
          />
        </>
      )}

      <View style={styles.divider} />

      {renderSecondaryAction()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle base fill so the shadow casts on iOS and the bar still reads if the
    // BlurView is unavailable; the BlurView sits on top for the frost.
    backgroundColor: 'rgba(28, 22, 18, 0.4)',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.14)',
    alignSelf: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  // Clipped frosted surface with a translucent warm-dark tint over the blur.
  blurFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    backgroundColor: 'rgba(28, 22, 18, 0.35)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 1.2,
  },
  audioButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default React.memo(FloatingActionRow);
