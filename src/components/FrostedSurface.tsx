/**
 * FrostedSurface — a frosted panel that costs what it's worth on each platform.
 *
 * `expo-blur` is two unrelated implementations behind one name:
 *
 * - **iOS** renders a `UIVisualEffectView`. The system composites it; the app
 *   pays essentially nothing per frame.
 * - **Android** renders `com.github.Dimezis:BlurView` (see
 *   `node_modules/expo-blur/android/build.gradle`), and only when
 *   `experimentalBlurMethod="dimezisBlurView"` is passed — the prop defaults
 *   to `'none'`, which just paints a flat translucent colour. That library
 *   works by registering an `OnPreDrawListener` on a root view and
 *   re-capturing + re-blurring that whole root into a bitmap every time the
 *   content behind it changes. `ExpoBlurView.kt`'s `findOptimalBlurRoot()`
 *   walks up to the nearest `rnscreens.Screen`, so the root is the *entire
 *   screen*. On API 31+ the blur itself is GPU `RenderEffect`; on API ≤30 it
 *   is `RenderScriptBlur`, which is far slower. Either way the per-frame
 *   screen-sized capture is on you.
 *
 * That is why the app felt smoother on iPhone than on Android. Every
 * `dimezisBlurView` sitting over scrolling content re-blurred the whole screen
 * on every scroll frame, and `PathsScreen`'s journey cards did it once *per
 * mounted list row*.
 *
 * So: keep the real blur on iOS, and on Android draw a tuned flat fill
 * instead. Each call site states its own `androidFill` rather than deriving
 * one, because the right value depends on what is already painted underneath
 * — several of these surfaces stack a fill of their own beneath the blur, and
 * one (`VerseLayer`'s action bar) has none at all and needs the fill to do the
 * entire job.
 *
 * For reference when picking a value: expo-blur's own Android fallback for
 * `tint="dark"` is `rgba(25, 25, 25, intensity / 100 * 0.69)`
 * (`TintStyle.kt#toColorInt`). These fills follow the same curve but in the
 * app's navy rather than a neutral grey, which is what made the old fallback
 * read as "a dim rectangle" instead of a lit sheet of glass.
 *
 * All current call sites use `tint="dark"`, so the tint is fixed here rather
 * than exposed. Add the prop when a light surface actually needs one.
 */
import React from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface FrostedSurfaceProps {
  /** Blur strength on iOS. Ignored on Android, where `androidFill` applies. */
  intensity: number;
  /**
   * Flat `backgroundColor` painted on Android in place of the live blur.
   * Overrides any `backgroundColor` in `style`, so state the final value here.
   */
  androidFill: string;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'none' | 'auto' | 'box-none' | 'box-only';
  children?: React.ReactNode;
}

function FrostedSurfaceBase({
  intensity,
  androidFill,
  style,
  pointerEvents,
  children,
}: FrostedSurfaceProps) {
  if (Platform.OS === 'android') {
    return (
      <View style={[style, { backgroundColor: androidFill }]} pointerEvents={pointerEvents}>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint="dark" style={style} pointerEvents={pointerEvents}>
      {children}
    </BlurView>
  );
}

export const FrostedSurface = React.memo(FrostedSurfaceBase);
