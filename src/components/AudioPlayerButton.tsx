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
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { getAudioUrl, getAudioUrls } from '../services/audioService';

interface AudioPlayerButtonProps {
  verseKey: string;
  size?: number;
  color?: string;
  showLabel?: boolean;
  isLocked?: boolean;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function AudioPlayerButton({
  verseKey,
  size = 48,
  color = '#2DD4BF',
  showLabel = true,
  isLocked = false,
  style,
  containerStyle,
}: AudioPlayerButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get audio URLs (could be one or many for a range)
  const audioUrls = getAudioUrls(verseKey);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);

  // Use expo-audio hook with the current audio source from the range
  const player = useAudioPlayer({ uri: audioUrls[currentVerseIndex] });
  const status = useAudioPlayerStatus(player);

  const isPlaying = status?.playing || false;
  const isBuffering = status?.isBuffering || false;
  const progress =
    status?.duration && status.duration > 0 ? (status.currentTime || 0) / status.duration : 0;

  // Pulse animation for playing state
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
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
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  // Handle verse transition or finished playback
  useEffect(() => {
    if (status?.didJustFinish) {
      if (currentVerseIndex < audioUrls.length - 1) {
        // There are more verses in this range - advance to next
        console.log(`AudioPlayerButton: Verse ${currentVerseIndex + 1} finished, playing next...`);
        setCurrentVerseIndex((prev) => prev + 1);
      } else {
        // Finished the whole range
        console.log('AudioPlayerButton: Range finished.');
        player.seekTo(0);
        player.pause();
        setCurrentVerseIndex(0); // Reset for next play
      }
    }
  }, [status?.didJustFinish, currentVerseIndex, audioUrls.length]);

  // Ensure player plays after switching verse in a range
  useEffect(() => {
    if (currentVerseIndex > 0 && !isPlaying && !isBuffering) {
      player.play();
    }
  }, [currentVerseIndex]);

  const handlePress = async () => {
    if (isLocked) return;
    try {
      if (isPlaying) {
        player.pause();
      } else {
        // If we were at the end of a range, handlePress starts from first verse again
        if (currentVerseIndex === 0 && (status?.currentTime || 0) > 0 && status?.didJustFinish) {
          player.seekTo(0);
        }
        player.play();
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  const displayColor = isLocked ? 'rgba(255, 255, 255, 0.4)' : color;

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
              borderColor: isPlaying ? color : 'rgba(255, 255, 255, 0.1)',
              backgroundColor: isPlaying ? `${color}15` : 'rgba(255, 255, 255, 0.06)',
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
              color={
                isPlaying
                  ? color
                  : isLocked
                    ? 'rgba(255, 255, 255, 0.4)'
                    : 'rgba(255, 255, 255, 0.8)'
              }
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
          style={[
            styles.label,
            isPlaying && { color },
            isLocked && { color: 'rgba(255, 255, 255, 0.4)' },
          ]}
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
    marginVertical: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(46, 211, 198, 0.08)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(46, 211, 198, 0.25)',
    gap: 12,
  },
  buttonContainerActive: {
    backgroundColor: 'rgba(46, 211, 198, 0.15)',
    borderColor: 'rgba(46, 211, 198, 0.5)',
  },
  buttonContainerLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.8,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.87)',
    fontSize: 14,
    fontWeight: '600',
    alignSelf: 'center',
  },
  progressRing: {
    position: 'absolute',
    borderWidth: 2,
  },
});
