import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Colors } from '../../theme/DesignSystem';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

// ⚠️ TODO: Replace with a royalty-free seamless ambient loop (CC0 license).
// bensound-slowmotion.mp3 requires a paid Bensound license for app distribution
// and is not a seamless loop — it will produce an audible gap at ~3:30.
// Using local bundled audio instead of streaming to guarantee offline availability.
const AMBIENT_SOUND = require('../../assets/audio/bensound-slowmotion.mp3');

export function SoundscapeToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const player = useAudioPlayer(AMBIENT_SOUND);

  // Set audio session to mix with other audio (e.g. Quran recitation)
  // rather than ducking or interrupting it.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    player.loop = true;
    player.volume = 0.4;
    // expo-audio releases the native player on unmount before this cleanup runs.
    // The try-catch prevents a crash when pause() is called on an already-released object.
    // Audio stops anyway because releasing the player stops playback.
    return () => {
      try {
        player.pause();
      } catch {
        // native player already released
      }
    };
  }, [player]);

  const togglePlayback = useCallback(() => {
    // Read actual player state to avoid stale-closure desync on rapid taps.
    const currentlyPlaying = player.playing;
    if (currentlyPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!currentlyPlaying);

    Animated.sequence([
      Animated.timing(scale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [player, scale]);

  return (
    <TouchableOpacity 
      onPress={togglePlayback} 
      style={styles.container}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons 
          name={isPlaying ? "musical-notes" : "musical-notes-outline"} 
          size={20} 
          color={isPlaying ? Colors.accent.primary : "rgba(255,255,255,0.4)"} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});