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
import { useReduceMotion } from '../hooks/useReduceMotion';

interface AudioPlayerButtonProps {
  verseKey: string;
  size?: number;
  /** Glyph/wave-bar height. Defaults to size * 0.45. Set this to match sibling
   *  icons when the button sits in a compact action bar. */
  iconSize?: number;
  /** When true, start recitation once per verse as soon as it mounts/changes. */
  autoPlay?: boolean;
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

// ── Sound wave bars — replaces the old icon when playing ─────────────────────
// Three bars with different heights and cycle durations give an organic,
// calm feel. Heights animate on the JS thread (useNativeDriver: false) but
// the update rate is slow so it stays smooth without frame drops.
const WaveBars = React.memo(function WaveBars({
  height,
  color,
}: {
  height: number;
  color: string;
}) {
  const barMaxH = height;
  const barW    = Math.max(2.5, height * 0.22);
  const reduceMotion = useReduceMotion();

  const b1 = useRef(new Animated.Value(barMaxH * 0.28)).current;
  const b2 = useRef(new Animated.Value(barMaxH * 0.72)).current;
  const b3 = useRef(new Animated.Value(barMaxH * 0.48)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = (anim: Animated.Value, lo: number, hi: number, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: hi, duration: dur, useNativeDriver: false }),
          Animated.timing(anim, { toValue: lo, duration: dur, useNativeDriver: false }),
        ]),
      );

    const a1 = loop(b1, barMaxH * 0.18, barMaxH,        740);
    const a2 = loop(b2, barMaxH * 0.42, barMaxH,        1010);
    const a3 = loop(b3, barMaxH * 0.18, barMaxH * 0.88, 630);

    a1.start();
    a2.start();
    a3.start();

    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [barMaxH, reduceMotion]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: barW * 0.7,
        height: barMaxH,
      }}
    >
      {([b1, b2, b3] as Animated.Value[]).map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            width: barW,
            height: anim,
            borderRadius: barW / 2,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
});

function AudioPlayerButtonInternal({
  verseKey,
  size = 48,
  iconSize,
  autoPlay = false,
  color = Colors.accent.primary,
  showLabel = true,
  isLocked = false,
  style,
  containerStyle,
}: AudioPlayerButtonProps) {
  // Visual glyph height — explicit iconSize wins, else the historical 45% of size.
  const iconPx = iconSize ?? size * 0.45;
  // Glow ring breathing — slow, calm opacity cycle instead of scale pulse
  const glowAnim = useRef(new Animated.Value(0)).current;

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

  // Auto-play: start recitation once per verseKey when `autoPlay` is enabled.
  // The caller decides *when* to enable it — VerseLayer waits for the verse-reveal
  // animation to settle — so this only needs a short cushion before playing.
  // A ref guard prevents re-firing on re-render or fighting a manual pause.
  const autoPlayedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!autoPlay || isLocked) return;
    if (autoPlayedKeyRef.current === verseKey) return;
    autoPlayedKeyRef.current = verseKey;
    const t = setTimeout(() => {
      try { player.play(); } catch { /* player not ready — ignore */ }
    }, 150);
    return () => clearTimeout(t);
    // player intentionally omitted from deps (stable per uri; mirrors this file's
    // other effects) so the timer keys only on verse/enable change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, isLocked, verseKey]);

  // Handle fallback if audio fails to load
  useEffect(() => {
    if (status?.error) {
      console.warn('Audio playback error encountered:', status.error);
      setFallbackIndex((prev) => {
        if (prev < RECITER_FALLBACKS.length - 1) {
          console.log(`Falling back to reciter: ${RECITER_FALLBACKS[prev + 1].name}`);
          return prev + 1;
        }
        return prev;
      });
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
  }, [fallbackIndex, audioUrls, currentVerseIndex, isPlaying]);

  // Glow breathing — outer ring fades 0.3 → 1.0 → 0.3 over 1800 ms each direction.
  // No scale: purely opacity so there is no layout jank and it feels meditative.
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1,   duration: 1800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 1800, useNativeDriver: true }),
        ]),
      );
      animation.start();
    } else {
      Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
    return () => { if (animation) animation.stop(); };
  }, [isPlaying]);

  // Handle verse transition or finished playback
  useEffect(() => {
    if (status?.didJustFinish) {
      if (currentVerseIndex < audioUrls.length - 1) {
        // There are more verses in this range - advance to next
        console.log(`AudioPlayerButton: Verse ${currentVerseIndex + 1} finished, playing next...`);
        const nextIndex = currentVerseIndex + 1;
        setCurrentVerseIndex(nextIndex);
        // Replace the audio source with the next verse and play
        player.replace({ uri: audioUrls[nextIndex] });
        player.play();
      } else {
        // Finished the whole range
        console.log('AudioPlayerButton: Range finished.');
        player.seekTo(0);
        player.pause();
        setCurrentVerseIndex(0); // Reset for next play
      }
    }
  }, [status?.didJustFinish]);

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
      {/* Outer glow ring — breathes slowly when playing, invisible when idle */}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 2,
            borderWidth: 1.5,
            borderColor: `${color}55`,
            backgroundColor: `${color}0D`,
            opacity: glowAnim,
          }}
        />

        {/* Button circle */}
        <View
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: isPlaying ? `${color}55` : Colors.glass.border,
              backgroundColor: isPlaying ? `${color}12` : Colors.glass.light,
            },
            containerStyle,
          ]}
        >
          {isBuffering ? (
            <ActivityIndicator size="small" color={color} />
          ) : isPlaying ? (
            // Wave bars replace the pause icon for a calm, visual audio cue
            <WaveBars height={iconPx} color={displayColor} />
          ) : (
            <Ionicons
              name="volume-medium"
              size={iconPx}
              color={isLocked ? Colors.text.muted : Colors.text.secondary}
            />
          )}
        </View>
      </View>

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
});
