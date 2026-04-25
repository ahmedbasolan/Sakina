/**
 * Audio Player Component
 *
 * A beautiful speaker icon with play/pause functionality for Quran recitation.
 * Uses expo-audio's useAudioPlayer hook for modern audio playback.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAudioUrls, RECITER_FALLBACKS } from '../services/audioService';

import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';

interface AudioPlayerButtonProps {
  verseKey: string;
  size?: number;
  color?: string;
  showLabel?: boolean;
  isLocked?: boolean;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

import { BuildService } from '../services/buildService';

// Use a check to prevent hook crashes if native module is missing
const AudioModule = BuildService.getCapabilities().audio ? require('expo-audio') : null;

export default function AudioPlayerButton(props: AudioPlayerButtonProps) {
  if (!AudioModule) {
    return null; // Gracefully hide if native module is missing
  }
  return <AudioPlayerButtonInternal {...props} />;
}

function AudioPlayerButtonInternal({
  verseKey,
  size = 48,
  color = Colors.accent.primary,
  showLabel = true,
  isLocked = false,
  style,
  containerStyle,
}: AudioPlayerButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);

  // Get audio URLs (could be one or many for a range)
  const audioUrls = getAudioUrls(verseKey, RECITER_FALLBACKS[fallbackIndex]);

  // These hooks are now safe because they are inside a component
  // that only renders if the module exists
  const player = AudioModule.useAudioPlayer({ uri: audioUrls[currentVerseIndex] });
  const status = AudioModule.useAudioPlayerStatus(player);

  const isPlaying = status?.playing || false;
  const isBuffering = status?.isBuffering || false;
  const progress =
    status?.duration && status.duration > 0 ? (status.currentTime || 0) / status.duration : 0;

  // Handle fallback if audio fails to load
  useEffect(() => {
    if (status?.error) {
      console.warn('Audio playback error encountered:', status.error);
      if (fallbackIndex < RECITER_FALLBACKS.length - 1) {
        console.log(`Falling back to reciter: ${RECITER_FALLBACKS[fallbackIndex + 1].name}`);
        setFallbackIndex((prev) => prev + 1);
      }
    }
  }, [status?.error]);

  // Update immediately when fallback changes
  useEffect(() => {
    if (fallbackIndex > 0) {
      player.replace({ uri: audioUrls[currentVerseIndex] });
      if (isPlaying) {
        player.play();
      }
    }
  }, [fallbackIndex]);

  // Pulse animation for playing state
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isPlaying]);

  // Auto-advance through a verse range. When a source finishes:
  //   - if there are more verses in the range, advance (the next useEffect plays them)
  //   - otherwise reset to the first verse (ready for replay) and stay paused
  useEffect(() => {
    if (!status?.didJustFinish) return;
    if (currentVerseIndex < audioUrls.length - 1) {
      setCurrentVerseIndex((prev) => prev + 1);
    } else {
      player.seekTo(0);
      player.pause();
      setCurrentVerseIndex(0);
    }
  }, [status?.didJustFinish]);

  // When currentVerseIndex changes mid-range (i.e. after auto-advance), start
  // playback of the new source automatically.
  useEffect(() => {
    if (currentVerseIndex > 0) {
      player.play();
    }
  }, [currentVerseIndex]);

  const handlePress = () => {
    if (isLocked) return;
    try {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  const displayColor = isLocked ? Colors.text.muted : color;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
        showLabel && styles.buttonContainer,
        showLabel && isPlaying && styles.buttonContainerActive,
        showLabel && isLocked && styles.buttonContainerLocked,
        style,
      ]}
      activeOpacity={isLocked ? 1 : 0.7}
      accessibilityLabel={
        isLocked
          ? 'Premium feature: Audio recitation'
          : isPlaying
            ? 'Pause recitation'
            : 'Play recitation'
      }
      accessibilityRole="button"
    >
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: isPlaying ? color : Colors.glass.border,
              backgroundColor: isPlaying ? `${color}15` : Colors.glass.light,
            },
            containerStyle,
          ]}
        >
          {isBuffering ? (
            <ActivityIndicator size="small" color={color} />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'volume-low'}
              size={size * 0.45}
              color={isPlaying ? color : isLocked ? Colors.text.muted : Colors.text.secondary}
            />
          )}

          {/* Circular progress */}
          {!isLocked && isPlaying && progress > 0 && (
            <View
              style={[
                styles.progressRing,
                {
                  width: size + 4,
                  height: size + 4,
                  borderRadius: (size + 4) / 2,
                  borderColor: color,
                  borderRightColor: 'transparent',
                  borderBottomColor: progress > 0.25 ? color : 'transparent',
                  borderLeftColor: progress > 0.5 ? color : 'transparent',
                  borderTopColor: progress > 0.75 ? color : 'transparent',
                  transform: [{ rotate: `${progress * 360}deg` }],
                },
              ]}
            />
          )}
        </View>
      </Animated.View>

      {showLabel && (
        <Text
          style={[styles.label, isPlaying && { color }, isLocked && { color: Colors.text.muted }]}
        >
          {isBuffering
            ? 'Loading...'
            : isLocked
              ? 'Listen to Recitation (Premium)'
              : isPlaying
                ? 'Playing'
                : 'Listen to Recitation'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.accent.muted,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.accent.glow,
    gap: Spacing.md,
  },
  buttonContainerActive: {
    backgroundColor: 'rgba(46, 211, 198, 0.15)',
    borderColor: 'rgba(46, 211, 198, 0.5)',
  },
  buttonContainerLocked: {
    backgroundColor: Colors.glass.light,
    borderColor: Colors.glass.border,
    opacity: 0.8,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  label: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    alignSelf: 'center',
  },
  progressRing: {
    position: 'absolute',
    borderWidth: 2,
  },
});
