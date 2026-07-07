# Shareable Verse Image — ShareSheet Upgrade

Date: 2026-07-07
Status: Approved for planning

## Problem

`ShareSheet.tsx` already renders a polished preview card (gradient background,
Arabic/English/transliteration toggles, 6 color themes, 3 fonts) that visually
matches the target reference. But it is **preview-only**: none of the "share"
actions actually produce an image.

- Tapping WhatsApp/Telegram/Messages opens each app via a URL scheme with a
  **text-only** payload (`whatsapp://send?text=...`). URL schemes cannot
  attach an image — this is a platform limitation, not a bug — so the visual
  card the user just designed is never actually sent.
- Instagram's branch sets clipboard text and opens the app with nothing to
  paste an image into.
- "Save Image" (`action === 'save_image'`) matches no branch in `handleAction`
  and silently falls through to the generic text-only `Share.share()` — it
  does not save anything.

Reference: Quranly's share flow (image1) shows the *actual rendered card*,
as a real image, arriving inside WhatsApp's own compose screen — reached by
picking WhatsApp from the OS's native share sheet after sharing an image, not
via a WhatsApp-specific deep link.

## Goals

1. Every share action operates on a real captured image of the preview card,
   for **all users** (free and premium) — text sharing remains available too.
2. "Save Image" actually saves the rendered card to the camera roll.
3. Premium users can set the card background to one of the existing nature
   photo themes (already used on the Guidance screen) instead of a flat
   gradient. Free users keep the 6 gradient themes only.

## Non-goals

- No per-app "send directly into WhatsApp chat X" targeting. Neither Expo nor
  bare RN exposes a JS API to attach a file to one specific app's share
  intent — only the OS's own "share sheet → pick an app" flow. We use that.
- No new photo assets. Premium backgrounds reuse `BACKGROUND_THEMES` /
  `BackgroundThemePicker` as-is.
- No changes to the freemium *limits* model (refresh counts, saved-item caps).
  This is a capability gate (which themes are selectable), same pattern as
  the existing Guidance-screen background picker.

## Design

### 1. Image capture

- Wrap the `LinearGradient`/`ImageBackground` preview card in a `ViewShot`
  ref (`react-native-view-shot`).
- New `captureCardImage(): Promise<string>` helper in `ShareSheet` calls
  `viewShotRef.current.capture()` with `{ format: 'png', quality: 1 }` and
  returns a local file URI. Called lazily at the moment of a share/save tap
  (not on every render/theme change) to avoid needless disk I/O.

### 2. Share actions

All social targets (`messages`, `whatsapp`, `telegram`, `instagram`) and the
`more` catch-all funnel into one `shareCardImage()` path (the per-icon
distinction becomes a visual affordance, not a routing difference — see
Non-goals):

1. Capture the card (§1).
2. iOS: `Share.share({ url: fileUri, message: shareText })` — native share
   sheet shows the image with the caption attached, user picks the target
   app themselves (this reproduces image1: after picking WhatsApp, WhatsApp
   renders its own compose screen with the image pre-attached).
3. Android: `expo-sharing`'s `shareAsync(fileUri, { mimeType: 'image/png',
   dialogTitle: shareText })` — Android's share intent does not reliably
   carry a text caption alongside an image across all target apps, so the
   caption may not appear in every app; the image always does. This is a
   platform limitation, not something we can fully paper over.
4. `handleAction('copy_text')` is unchanged — text-only, no image involved.
5. `handleAction('save_image')`: capture the card, request
   `expo-media-library` permission (if not already granted), save the file
   to the camera roll via `MediaLibrary.saveToLibraryAsync`. On permission
   denial, close the sheet without throwing (non-critical action).

### 3. Premium background photos

- Reuse `BACKGROUND_THEMES` and `BackgroundThemePicker` from the Guidance
  screen verbatim — no new assets, no new gating logic.
- Add one more tile to the existing "Style" row in `ShareSheet`, alongside
  the 6 gradient swatches: a "Nature Photos" tile. Tapping it opens
  `BackgroundThemePicker` as a nested modal.
  - Free user: `isPremium=false` is passed straight through, so
    `BackgroundThemePicker`'s existing lock behavior applies unchanged —
    tapping any photo shows its existing "Premium Feature / Upgrade Now"
    alert.
  - Premium user: picks a theme, `ShareSheet` stores `selectedPhotoTheme:
    BackgroundTheme | null` in local state (separate from `selectedTheme`,
    the gradient state) and clears/sets it via `onSelectTheme`.
  - Picking a gradient swatch clears `selectedPhotoTheme` (mutually
    exclusive backgrounds); picking a photo is the reverse.
- Card rendering: when `selectedPhotoTheme` is set, render `ImageBackground`
  (photo + a bottom-heavy dark gradient overlay, same recipe as
  `ImmersiveBackground`'s nature-image layer) instead of `LinearGradient`,
  and force `textColor`/`subTextColor` to the white/cream values (all photo
  themes are scenic and dark enough for light text, same assumption
  `ImmersiveBackground` already makes).
- Downgrade guard: if `isPremium` is `false` on mount/prop-change,
  `selectedPhotoTheme` is force-reset to `null` — a lapsed subscriber never
  gets stuck rendering a background they can no longer pick. Mirrors the
  guard already implicit in `ImmersiveBackground` (`isPremium &&
  selectedThemeSource`).
- Upgrade tap: closes the nested picker, calls
  `freemium.recordUpgradeAsk('theme_pick')` (existing `PeakContext` value —
  a share-sheet background pick is the same kind of moment as the Guidance
  one, no new union member needed), then `onUpgrade()`.

### 4. Prop/plumbing changes

- `ShareSheet` gains two new required props: `isPremium: boolean` and
  `onUpgrade: () => void`.
- `GuidanceScreen.tsx` already computes `isPremium` (line 43) and already has
  an `onUpgrade` pattern for `BackgroundThemePicker` (lines 436-443) — pass
  the same values through to `ShareSheet`.
- `SurahReaderScreen.tsx` has no premium awareness today. Add:
  ```ts
  const [isPremium, setIsPremium] = useState(() => SubscriptionService.getInstance().isPremium());
  useFocusEffect(useCallback(() => {
    setIsPremium(SubscriptionService.getInstance().isPremium());
  }, []));
  ```
  (identical to the `GuidanceScreen` pattern) and an `onUpgrade` that closes
  the sheet, records the peak, and calls `navigation.navigate('Support')`.

### 5. New dependencies

- `react-native-view-shot` — card capture.
- `expo-sharing` — cross-platform "share a file" (Android path in particular;
  `Share.share`'s `url` field is iOS-only).
- `expo-media-library` — camera-roll save + permission handling.

All three are native modules requiring a rebuild (this project runs
`expo-dev-client`, not Expo Go). Bundle this rebuild with the OAuth /
notification-fix EAS rebuild already pending (see project memory) rather than
shipping a standalone rebuild for this feature alone.

## Testing

- Existing `ShareSheet` has no test file today; none added — this is a
  visual/native-integration feature best verified on-device (per
  `CLAUDE.md`: "visuals can't be confirmed from a typecheck alone").
- Manual verification on a real device build (post-rebuild):
  1. Free user: capture + share image to at least one app (WhatsApp or
     Messages), confirm the *image* (not just text) arrives.
  2. Free user: Save Image → confirm PNG appears in camera roll.
  3. Free user: tap "Nature Photos" tile → confirm locked/upgrade alert,
     confirm tapping "Upgrade Now" navigates to Support.
  4. Premium user: pick a nature photo background → confirm card preview
     switches to the photo + overlay, text stays legible.
  5. Premium user downgraded mid-session (or fresh non-premium load with a
     previously-selected photo) → confirm card falls back to a gradient
     instead of showing a broken/locked image.
