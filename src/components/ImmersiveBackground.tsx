import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ImageBackground, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, MoodColors } from '../theme/DesignSystem';
import { Mood, PathTone } from '../types';
import { backgroundThemeService } from '../services/backgroundThemeService';
import { TwinklingStar } from './TwinklingStar';
import { AnimatedMandala } from './AnimatedMandala';
import { useReduceMotion } from '../hooks/useReduceMotion';

/** Fixed star positions for the free-user journey atmosphere.
 *  x/y expressed as percentage strings so layout scales with any screen size
 *  and survives orientation changes without a module-level Dimensions snapshot. */
const JOURNEY_STARS = [
  { x: '7%',  y: '8%',  size: 1.5, delay: 0,    duration: 2800 },
  { x: '88%', y: '7%',  size: 2,   delay: 600,  duration: 3400 },
  { x: '73%', y: '18%', size: 1.2, delay: 1100, duration: 2500 },
  { x: '17%', y: '24%', size: 1.8, delay: 400,  duration: 3100 },
  { x: '52%', y: '11%', size: 1,   delay: 900,  duration: 2700 },
  { x: '36%', y: '30%', size: 1.3, delay: 200,  duration: 3000 },
];

interface ImmersiveBackgroundProps {
  children: React.ReactNode;
  theme?: 'sand' | 'ocean' | 'dawn';
  mood?: Mood;
  imageSource?: ImageSourcePropType;
  /** When false, the parent fully controls the premium theme image via `imageSource`
   *  and this component does NOT read the saved theme itself. Defaults to true so
   *  every other screen keeps auto-showing the user's selected theme. Set false on
   *  screens (e.g. Guidance) that drive live theme changes through `imageSource`,
   *  otherwise the stale mount-time read would mask a switch back to Default. */
  selfManageTheme?: boolean;
  overlayOpacity?: number;
  isPremium?: boolean;
  /** Journey accent color (e.g. path identity color). Switches the base to the
   *  shared navy world and washes it with this hue so each journey keeps its
   *  identity inside the immersive step experience. */
  accentColor?: string;
  /** Emotional register — tunes glow intensity and vignette depth. */
  tone?: PathTone;
}

// Shared navy base, matching PathsScreen / PathDetailScreen.
const NAVY_GRADIENT = ['#0A1321', Colors.background.secondary];

const ImmersiveBackground: React.FC<ImmersiveBackgroundProps> = ({
  children,
  theme = 'sand',
  mood,
  imageSource,
  selfManageTheme = true,
  overlayOpacity = 0.4,
  isPremium = false,
  accentColor,
  tone = 'momentum',
}) => {
  const [selectedThemeSource, setSelectedThemeSource] = useState<ImageSourcePropType | null>(null);
  // Resolved once here so the 6 TwinklingStars don't each subscribe independently.
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (selfManageTheme && isPremium) {
      // Reset to null when no theme is selected so clearing it (Default) reverts
      // the background instead of keeping the previously-read image.
      backgroundThemeService.getSelectedTheme().then((t) => {
        setSelectedThemeSource(t ? t.imageSource : null);
      });
    }
  }, [isPremium, selfManageTheme]);

  const moodStyle = mood ? MoodColors[mood] : null;

  // Journey screen: accentColor passed, no mood.
  const isJourney = !!accentColor && !moodStyle;

  // Priority: explicit imageSource > self-managed premium theme > mood image (premium only)
  const finalImageSource = imageSource
    || (selfManageTheme && isPremium && selectedThemeSource)
    || (isPremium && moodStyle?.image)
    || null;

  // Free users on mood-based guidance screens get no premium image.
  // Use the same navy-base + accent-wash approach as journey screens so the
  // whole immersive surface shares one consistent dark foundation. Premium users
  // who have a nature image keep the full mood gradient (it underlies the image).
  const freeMoodScreen = !!moodStyle && !isPremium && !finalImageSource;

  // Accent used for the top glow wash (journey identity OR mood accent for free users).
  const washAccent = accentColor ?? (freeMoodScreen ? moodStyle?.accent : undefined);

  const finalGradient = (isJourney || freeMoodScreen)
    ? NAVY_GRADIENT
    : moodStyle
      ? moodStyle.gradient     // premium mood screens — image will overlay this
      : theme === 'ocean'
        ? ['#12100E', '#1A1814']
        : theme === 'dawn'
          ? ['#1A1210', '#241A18']
          : ['#14100C', '#241E19'];

  // Refuge = calmer/dimmer; momentum = a touch more alive.
  const glowAlpha = tone === 'refuge' ? '12' : '20';
  // Kept tight to the very top/bottom edges (not a broad band) so the header
  // and footer nav read as text floating over the scene rather than sitting
  // on a filled bar — just enough contrast for legibility, per journey/
  // guidance screen feedback that the old wide 0.8-0.92 band looked "filled".
  const vignetteTop = 'rgba(0,0,0,0.5)';
  const vignetteBottom = tone === 'refuge' ? 'rgba(0,0,0,0.68)' : 'rgba(0,0,0,0.58)';

  // Show atmospheric particles for free users on any immersive screen (journey
  // or guidance) — not for premium users who have a nature image instead.
  const showAtmosphere = (isJourney || freeMoodScreen) && !finalImageSource;

  // Star tint: gold for journeys, the mood's own accent color for guidance.
  const starColor = moodStyle
    ? `${moodStyle.accent}B3`   // 70% opacity of the mood accent
    : 'rgba(212, 175, 55, 0.7)';

  return (
    <View style={styles.container}>
      {/* Base gradient — always shown */}
      <LinearGradient colors={finalGradient as any} style={StyleSheet.absoluteFill} />

      {/* Accent wash — journey identity color or mood accent, fades from top */}
      {washAccent && !finalImageSource && (
        <LinearGradient
          colors={[`${washAccent}${glowAlpha}`, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.65 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Atmospheric stars + faint mandala — free users, no premium image.
          Stars tint to the mood/journey accent so the atmosphere feels intentional. */}
      {showAtmosphere && (
        <>
          {JOURNEY_STARS.map((s, i) => (
            <TwinklingStar
              key={i}
              x={s.x}
              y={s.y}
              size={s.size}
              delay={s.delay}
              duration={s.duration}
              color={starColor}
              reduceMotionOverride={reduceMotion}
            />
          ))}
          <View style={styles.mandalaWrap} pointerEvents="none">
            <AnimatedMandala
              size={280}
              opacity={0.035}
              color={washAccent ?? Colors.accent.primary}
            />
          </View>
        </>
      )}

      {/* Nature image layer — premium only */}
      {finalImageSource && (
        <ImageBackground
          source={finalImageSource}
          style={StyleSheet.absoluteFill}
          imageStyle={{ opacity: overlayOpacity }}
          resizeMode="cover"
        />
      )}

      {/* Depth and readability overlays — narrow bands hugging the very top
          (status bar / header) and bottom (footer nav) edges, clear through
          the middle so it never reads as a solid header/footer fill. */}
      <LinearGradient
        colors={[vignetteTop, 'transparent', 'transparent', vignetteBottom]}
        locations={[0, 0.16, 0.72, 1]}
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
  mandalaWrap: {
    position: 'absolute',
    top: -60,
    right: -80,
    zIndex: 0,
  },
});

export default React.memo(ImmersiveBackground);
