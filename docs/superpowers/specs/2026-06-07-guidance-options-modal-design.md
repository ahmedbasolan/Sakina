# Guidance Options Modal — Auto-play & Background Theme — Design

Date: 2026-06-07
Status: Draft (awaiting review)

## Goal

Make the Guidance screen's options modal (`DisplayPreferencesModal`, opened by the
header gear) the single home for reading-experience controls:

1. **Review** the existing Primary Language picker (English / Arabic first).
2. **Add** an Auto-play Recitation toggle.
3. **Add** a Background Theme entry (premium) that opens the existing
   `BackgroundThemePicker`, and **remove** that picker from the Settings screen.
4. **Remove** the dead "IMMERSIVE THEME" (Sand/Ocean/Dawn) placeholder.

## Decisions

- **Auto-play defaults OFF** — opt-in, so a verse never makes sound unexpectedly.
- **Background picker lives in the Guidance modal only** — removed from Settings.
- Auto-play is a **free** feature; Background themes remain **premium-gated**
  (existing `BackgroundThemePicker` already handles the lock + upsell).
- Scope: the **Guidance** verse experience only. Journeys' verse layer and the
  Quran reader are out of scope for this change.

## Current state (verified)

- `DisplayPreferencesModal` has: Primary Language (works), a **non-functional**
  "IMMERSIVE THEME" placeholder (`console.log`, hard-coded "Sand" active),
  Transliteration toggle (works). Its "APPLY SETTINGS" button uses off-brand teal.
- `UserPreferences = { primaryLanguage, showTransliteration }`, persisted in the
  SQLite `user_preferences` table via `PreferencesService`.
- `AudioPlayerButton` owns playback internally (expo-audio `useAudioPlayer`); the
  idle glyph is `volume-medium`, playing shows wave bars.
- `BackgroundThemePicker` + `backgroundThemeService` already exist: premium-gated,
  selection persisted in AsyncStorage (`@quietheart_background_theme`).
- `ImmersiveBackground` reads the selected theme on mount (premium only) and also
  accepts a higher-priority `imageUri` prop — usable for live in-session updates.

## Changes

### 1. Data model — add `autoPlayAudio`
- `UserPreferences` (`src/types`): add `autoPlayAudio: boolean`.
- DB migration (`src/database/migrations.ts`): `ALTER TABLE user_preferences ADD
  COLUMN autoPlayAudio INTEGER DEFAULT 0` (guard for existing installs).
- `PreferencesService`: default `autoPlayAudio: false`; include it in
  `loadPreferences` (`=== 1`) and the `INSERT OR REPLACE` in `savePreferences`.

### 2. `AudioPlayerButton` — auto-play support
- Add prop `autoPlay?: boolean` (default false).
- On `verseKey` change (new verse) when `autoPlay && !isLocked`, start playback
  once the player is ready. Guard with a ref so it fires once per verse and never
  fights a manual pause. No change to existing manual play/pause.

### 3. `VerseLayer` — pass the preference through
- Add prop `autoPlayAudio?: boolean`; forward to the `AudioPlayerButton` as
  `autoPlay`. (Both `VerseLayer` audio call site and default behavior unchanged
  when the prop is absent — journeys keep auto-play off.)

### 4. `GuidanceScreen` — wire prefs + live background
- Pass `autoPlayAudio={preferences.autoPlayAudio}` into `VerseLayer`.
- Own `selectedThemeUri` state: read `backgroundThemeService.getSelectedTheme()`
  on mount (premium) and refresh it when the picker changes it; pass it to
  `ImmersiveBackground` via the existing `imageUri` prop so a theme change applies
  **live** without leaving the screen.
- Render `BackgroundThemePicker` (own its `visible` state). To avoid stacked
  React Native `Modal`s, the BACKGROUND row **closes the options sheet first,
  then opens the picker** (sequential, not nested). On picker close, refresh
  `selectedThemeUri`/name; do not auto-reopen the options sheet.

### 5. `DisplayPreferencesModal` — redesign
Reorganize into clear sections, all on-brand gold (no teal):

- **READING** — Primary Language (English / Arabic) [keep], Transliteration toggle
  [keep, reworded].
- **RECITATION** — Auto-play toggle ("Play recitation when a verse opens").
- **BACKGROUND** — a single row showing the current selection (theme name or
  "Default") with a chevron; tapping opens `BackgroundThemePicker`. For
  non-premium users the row shows a small "PREMIUM" lock badge (the picker itself
  still gates selection + upsell, so tapping is safe either way).
- Remove the dead Sand/Ocean/Dawn block. Recolor the footer button to gold
  (`Colors.accent.primary`), matching the app.
- New props: `isPremium: boolean`, `selectedThemeName: string | null`,
  `onOpenBackgroundPicker: () => void`, plus `autoPlayAudio` is read from the
  existing `preferences` and toggled via the existing `onUpdatePreference`.

### 6. `SettingsScreen` — remove the background picker
- Remove the `BackgroundThemePicker` usage, the row that opens it, and the now-
  unused theme state/imports. (Selection still persists via
  `backgroundThemeService`; it's just no longer set from Settings.)

## Premium gating
- Free users: Auto-play + language + transliteration fully usable. Background row
  shows a PREMIUM badge; opening the picker shows locked thumbnails + upsell
  (existing behavior). Selecting the "Default" option remains available to all.

## Edge cases
- Auto-play + audio load failure: existing reciter-fallback logic applies; if all
  fail, the button stays idle silently (no crash).
- Toggling Auto-play off mid-playback does not stop the current recitation (only
  affects future verse opens) — acceptable; manual pause remains.
- Background change while a free user (no premium): no live image (gated) — the
  row/picker communicates premium.

## Out of scope
- Inline recitation/auto-scroll in the Quran reader.
- Auto-play in journeys' verse layer.
- New background images or categories.

## Verification
- `npx tsc --noEmit` clean (baseline pre-existing errors only).
- Manual: toggle Auto-play → next verse opens and recites; toggle off → silent.
- Manual (premium): pick a theme in the modal → background updates live; reopen
  Guidance → persists. Free user → sees PREMIUM lock.
- Settings no longer shows the background picker; no dead references remain.
