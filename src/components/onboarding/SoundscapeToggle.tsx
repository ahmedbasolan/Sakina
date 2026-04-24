import React, { useState, useEffect, useRef } from 'react';
import { Colors } from '../../theme/DesignSystem';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';

// Using local bundled audio instead of streaming to guarantee offline availability
const AMBIENT_SOUND = require('../../assets/audio/ambient.mp3');

export function SoundscapeToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  
  const player = useAudioPlayer(AMBIENT_SOUND);

  useEffect(() => {
    if (player) {
      player.loop = true;
      player.volume = 0.4;
    }
  }, [player]);

  const togglePlayback = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    
    setIsPlaying(!isPlaying);

    // Haptic-like pop animation
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

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