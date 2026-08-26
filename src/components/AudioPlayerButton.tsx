/**
 * Audio Player Component
 *
 * A beautiful speaker icon with play/pause functionality for Quran recitation.
 * Uses expo-audio's useAudioPlayer hook for modern audio playback.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { getAudioUrls, getCachedAudioUri, resolveAudioSource, prefetchAudio, RECITER_FALLBACKS } from '../services/audioService';

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
  /** Fires whenever this button's own playing state flips — lets a parent
   *  rendering many verses (e.g. SurahLayer) know which one is currently
   *  reciting, without lifting the player itself out of this component. */
  onPlayingChange?: (playing: boolean) => void;
  /** For a multi-verse range key (`chapter:start-end`), reports which verse
   *  of that range is loaded as it advances — 0-based within the range, NOT
   *  an ayah number. Lets a Mushaf page highlight the ayah being recited
   *  without lifting the player out of this component. Never fires for a
   *  single-verse key beyond its initial 0. */
  onRangeIndexChange?: (index: number) => void;
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
// calm feel.
//
// These animate `scaleY` on a fixed-height bar, anchored to the bottom via
// `transformOrigin`, NOT `height`. Animating `height` is a layout property:
// it cannot use the native driver, so every frame crossed to JS and forced a
// Yoga re-layout plus a measure/layout pass, three bars at once, for the whole
// time audio was playing — which is exactly when the user is scrolling the
// verse they're listening to. That also broke the project's own rule
// (CLAUDE.md: animate transform/opacity only, never layout). The old comment
// here claimed the slow update rate kept it smooth; the *value* moves slowly,
// but the animation still ticks every frame.
//
// The Animated.Values are now scale ratios (0–1), so they no longer depend on
// the pixel height and the loops don't restart when `height` changes.
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

  const b1 = useRef(new Animated.Value(0.28)).current;
  const b2 = useRef(new Animated.Value(0.72)).current;
  const b3 = useRef(new Animated.Value(0.48)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = (anim: Animated.Value, lo: number, hi: number, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: hi, duration: dur, useNativeDriver: true }),
          Animated.timing(anim, { toValue: lo, duration: dur, useNativeDriver: true }),
        ]),
      );

    const a1 = loop(b1, 0.18, 1,    740);
    const a2 = loop(b2, 0.42, 1,    1010);
    const a3 = loop(b3, 0.18, 0.88, 630);

    a1.start();
    a2.start();
    a3.start();

    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [reduceMotion]);

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
          style={[
            styles.waveBar,
            {
              width: barW,
              height: barMaxH,
              borderRadius: barW / 2,
              backgroundColor: color,
              transform: [{ scaleY: anim }],
            },
          ]}
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
  onPlayingChange,
  onRangeIndexChange,
}: AudioPlayerButtonProps) {
  // Visual glyph height — explicit iconSize wins, else the historical 45% of size.
  const iconPx = iconSize ?? size * 0.45;
  // Glow ring breathing — slow, calm opacity cycle instead of scale pulse
  const glowAnim = useRef(new Animated.Value(0)).current;

  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  // True once every fallback reciter has errored out for this verse. All
  // entries in RECITER_FALLBACKS live on the same host (everyayah.com), so
  // exhausting them usually means the HOST is unreachable, not that one
  // reciter is missing a file — cycling reciters further won't help, and
  // leaving the button silently inert with no error and no way to retry is
  // its own bug independent of whatever made the connection fail.
  const [loadFailed, setLoadFailed] = useState(false);

  // This component isn't remounted (no `key={verseKey}` at any call site), so
  // when the caller swaps to a different verse/range the fallback reciter and
  // range-position from the PREVIOUS verseKey would otherwise carry over —
  // reset both the moment the verse identity changes.
  useEffect(() => {
    setFallbackIndex(0);
    setCurrentVerseIndex(0);
    setLoadFailed(false);
  }, [verseKey]);

  // Get audio URLs (could be one or many for a range). Memoized so the effect
  // below that watches it (the reciter-fallback reload) only re-fires when
  // verseKey/fallbackIndex actually change — an unmemoized array literal here
  // was a NEW reference on every render (including every ~500ms status poll),
  // which kept re-triggering that effect forever once a fallback engaged and
  // reset playback to 0 in a loop.
  const audioUrls = useMemo(
    () => getAudioUrls(verseKey, RECITER_FALLBACKS[fallbackIndex]),
    [verseKey, fallbackIndex],
  );

  // Mount-time uri for useAudioPlayer below — deliberately keyed ONLY on
  // verseKey, not on currentVerseIndex/fallbackIndex. useAudioPlayer recreates
  // a brand-new native player whenever its uri's resolved value changes; verse
  // -range advances and reciter-fallback swaps are both applied to the
  // EXISTING player via player.replace() in effects further down instead. If
  // this depended on currentVerseIndex/fallbackIndex too, advancing the range
  // would recreate the player at the same moment the finish-handler's
  // .replace()/.play() call targeted the OLD (about-to-be-released) player —
  // whichever "wins" undid the other, so range playback silently stopped
  // instead of continuing into the next ayah.
  const initialUri = useMemo(() => {
    const firstReciterUrls = getAudioUrls(verseKey, RECITER_FALLBACKS[0]);
    return getCachedAudioUri(firstReciterUrls[0]) ?? firstReciterUrls[0];
  }, [verseKey]);

  // These hooks are now safe because they are inside a component
  // that only renders if the module exists
  const player = AudioModule.useAudioPlayer({ uri: initialUri });
  const status = AudioModule.useAudioPlayerStatus(player);

  const isPlaying = status?.playing || false;
  const isBuffering = status?.isBuffering || false;

  // Report this button's own playing state to whoever asked — SurahLayer
  // uses this to highlight the verse currently being recited. Each
  // AudioPlayerButton instance owns its own player, so this is the only
  // place that state exists; the parent never touches the player directly.
  useEffect(() => {
    onPlayingChange?.(isPlaying);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // Range position, same one-way reporting as isPlaying above. Fires on the
  // reset-to-0 that follows a verseKey change too, so a parent tracking this
  // never keeps a stale index from the previous range.
  useEffect(() => {
    onRangeIndexChange?.(currentVerseIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVerseIndex]);

  // Also report "stopped" on unmount — otherwise swapping verseKey via a
  // remount (a caller using `key={verseKey}`) would leave the parent
  // thinking a verse is still playing after its button is gone.
  useEffect(() => {
    return () => { onPlayingChange?.(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Warm the disk cache for the current verse in the background so the next
  // time it's opened (revisiting a Surah, replaying the daily verse) it's
  // already local. Doesn't affect this play — the player above was already
  // created from whatever was available at mount.
  useEffect(() => {
    prefetchAudio(audioUrls[currentVerseIndex]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verseKey, currentVerseIndex, fallbackIndex]);

  // For a multi-verse range, start downloading the NEXT verse as soon as the
  // current one starts playing — by the time it finishes, the next file is
  // already on disk instead of triggering a fresh network fetch mid-range.
  useEffect(() => {
    if (!isPlaying) return;
    const nextIndex = currentVerseIndex + 1;
    if (nextIndex < audioUrls.length) {
      prefetchAudio(audioUrls[nextIndex]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentVerseIndex]);

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
        console.warn('AudioPlayerButton: all reciter fallbacks failed for', verseKey);
        setLoadFailed(true);
        return prev;
      });
    }
  }, [status?.error, verseKey]);

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

  // Reset the stall-retry counter whenever we move to a genuinely new file —
  // otherwise a retry used on one verse would wrongly count against the next.
  const stallRetryRef = useRef(0);
  useEffect(() => {
    stallRetryRef.current = 0;
  }, [verseKey, currentVerseIndex, fallbackIndex]);

  // Handle verse transition or finished playback
  useEffect(() => {
    if (!status?.didJustFinish) return;

    // everyayah.com has no CDN, so a slow/dropped connection can make
    // expo-audio report `didJustFinish` before the file actually reached its
    // end — that's the "audio cuts off mid-ayah" bug. Only trust the event
    // as real completion when playback is within ~1.5s of the known
    // duration; otherwise treat it as a stall and resume from where it left
    // off (capped at 2 retries so a genuinely broken file doesn't loop).
    const duration = status.duration ?? 0;
    const position = status.currentTime ?? 0;
    const reachedEnd = duration === 0 || duration - position < 1.5;

    if (!reachedEnd && stallRetryRef.current < 2) {
      stallRetryRef.current += 1;
      const resumeAt = position;
      console.log(`AudioPlayerButton: playback stalled at ${resumeAt}s/${duration}s — resuming.`);
      resolveAudioSource(audioUrls[currentVerseIndex]).then((uri) => {
        player.replace({ uri });
        player.seekTo(resumeAt);
        player.play();
      });
      return;
    }

    if (currentVerseIndex < audioUrls.length - 1) {
      // There are more verses in this range - advance to next
      console.log(`AudioPlayerButton: Verse ${currentVerseIndex + 1} finished, playing next...`);
      const nextIndex = currentVerseIndex + 1;
      setCurrentVerseIndex(nextIndex);
      // The prefetch effect above already started downloading this while
      // the previous verse was playing, so this is usually an instant
      // cache hit rather than a fresh network fetch.
      resolveAudioSource(audioUrls[nextIndex]).then((uri) => {
        player.replace({ uri });
        player.play();
      });
    } else {
      // Finished the whole range
      console.log('AudioPlayerButton: Range finished.');
      player.seekTo(0);
      player.pause();
      setCurrentVerseIndex(0); // Reset for next play
    }
  }, [status?.didJustFinish]);

  const handlePress = async () => {
    if (isLocked) return;
    try {
      if (loadFailed) {
        // Start over from the first reciter rather than resuming the
        // exhausted fallback chain — whatever failed may well have been a
        // transient connection problem, worth a genuinely fresh attempt.
        setLoadFailed(false);
        setFallbackIndex(0);
        setCurrentVerseIndex(0);
        const retryUrl = getAudioUrls(verseKey, RECITER_FALLBACKS[0])[0];
        const uri = await resolveAudioSource(retryUrl);
        player.replace({ uri });
        player.play();
        return;
      }
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
          : loadFailed
            ? 'Recitation audio could not load. Tap to retry.'
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
              borderColor: loadFailed
                ? `${Colors.status.error}55`
                : isPlaying ? `${color}55` : Colors.glass.border,
              backgroundColor: loadFailed
                ? `${Colors.status.error}12`
                : isPlaying ? `${color}12` : Colors.glass.light,
            },
            containerStyle,
          ]}
        >
          {isBuffering ? (
            <ActivityIndicator size="small" color={color} />
          ) : isPlaying ? (
            // Wave bars replace the pause icon for a calm, visual audio cue
            <WaveBars height={iconPx} color={displayColor} />
          ) : loadFailed ? (
            <Ionicons name="refresh" size={iconPx} color={Colors.status.error} />
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
          style={[
            styles.label,
            isPlaying && { color },
            isLocked && { color: Colors.text.muted },
            loadFailed && { color: Colors.status.error },
          ]}
        >
          {isBuffering
            ? 'Loading...'
            : isLocked
              ? 'Listen to Recitation (Premium)'
              : loadFailed
                ? "Couldn't load — tap to retry"
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
  // Anchors WaveBars' scaleY to each bar's base so it grows upward out of the
  // baseline, the way a level meter reads — the default centred origin would
  // make the bars bloom symmetrically from the middle instead. The rest of a
  // bar's style depends on props, so only this static piece lives here.
  waveBar: {
    transformOrigin: 'bottom',
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
