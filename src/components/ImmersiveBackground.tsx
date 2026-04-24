import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MoodColors } from '../theme/DesignSystem';
import { Mood } from '../types';
import { backgroundThemeService } from '../services/backgroundThemeService';

interface ImmersiveBackgroundProps {
  children: React.ReactNode;
  theme?: 'sand' | 'ocean' | 'dawn';
  mood?: Mood;
  imageUri?: string;
  overlayOpacity?: number;
  isPremium?: boolean;
}

const ImmersiveBackground: React.FC<ImmersiveBackgroundProps> = ({
  children,
  theme = 'sand',
  mood,
  imageUri,
  overlayOpacity = 0.4,
  isPremium = false,
}) => {
  const [selectedThemeUri, setSelectedThemeUri] = useState<string | null>(null);

  useEffect(() => {
    if (isPremium) {
      backgroundThemeService.getSelectedTheme().then((t) => {
        if (t) setSelectedThemeUri(t.imageUri);
      });
    }
  }, [isPremium]);

  const moodStyle = mood ? MoodColors[mood] : null;

  // Priority: explicit imageUri > premium selected theme > mood image (premium only)
  const finalImageUri = imageUri
    || (isPremium && selectedThemeUri)
    || (isPremium && moodStyle?.image)
    || null;

  const finalGradient = moodStyle
    ? moodStyle.gradient
    : theme === 'ocean'
      ? ['#12100E', '#1A1814']
      : theme === 'dawn'
        ? ['#1A1210', '#241A18']
        : ['#14100C', '#241E19'];

  return (
    <View style={styles.container}>
      {/* Base theme gradient — always shown */}
      <LinearGradient colors={finalGradient as any} style={StyleSheet.absoluteFill} />

      {/* Nature image layer — premium only */}
      {finalImageUri && (
        <ImageBackground
          source={{ uri: finalImageUri }}
          style={StyleSheet.absoluteFill}
          imageStyle={{ opacity: overlayOpacity }}
          resizeMode="cover"
        />
      )}

      {/* Depth and readability overlays */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.9)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle texture overlay for premium feel */}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)', opacity: 0.1 }]}
      />

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default React.memo(ImmersiveBackground);
