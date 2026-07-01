# Location Picker — Premium Visual Pass

**Date:** 2026-07-01
**Scope:** `LocationPickerModal` only (visual/motion polish on the existing structure)
**Builds on:** `2026-06-30-location-picker-redesign.md` (search/manual/GPS structure — unchanged)

---

## Goal

The location picker works correctly but reads as a plain, default-feeling modal — flat fade-in, static borders, no tactile feedback. Elevate it to match the "Celestial Night" premium aesthetic used elsewhere in the app, without changing its structure, props, or behavior (search → results → select; GPS shortcut; manual fallback).

Out of scope: layout/flow changes, new features, changes to `cityData`, `prayerTimesService`, or call sites.

---

## 1. Container: bottom sheet with drag-to-dismiss

Replace the centered card + flat `fade` `Modal` animation with a bottom sheet:

- `Modal` stays `transparent`, but `animationType="none"` — the sheet drives its own animation via `Animated.Value` (pattern already used in `ShareSheet.tsx`).
- Two `Animated.Value`s: `translateY` (starts at sheet height, animates to 0) and `backdropOpacity` (0 → 1). Both driven by `Animated.spring` using `Animations.spring.gentle` on open; `Animated.timing` at `Animations.timing.fast` on close (a spring-out feels bouncy/wrong for dismissal).
- Sheet: `borderTopLeftRadius`/`borderTopRightRadius: BorderRadius.xxl`, `backgroundColor: Colors.background.secondary`, `maxHeight: screenHeight * 0.85`, anchored to bottom (`justifyContent: 'flex-end'` on the overlay wrapper).
- Grabber handle: small pill (`40x4`, `rgba(255,235,210,0.2)`, `BorderRadius.full`), centered, top of sheet — decorative anchor for the drag gesture.
- **Drag-to-dismiss:** `PanResponder` attached to the handle + header area (not the whole sheet, so the search input/list stay scrollable/tappable). Tracks vertical drag delta:
  - Only responds to downward drags starting from the handle/header zone.
  - On release: if dragged past ~120px *or* released with velocity > 1.2, animate to close (`onClose` after animation completes). Otherwise spring back to 0.
  - Implemented with `Animated.Value` + `useNativeDriver: true` for the transform.
- Backdrop tap and the existing X button both still call `onClose` — route through the same close animation (don't just flip `visible` off, since that would skip the outro).
- `useReduceMotion`: if reduced motion is on, skip the spring/slide entirely — sheet appears via opacity only (no translateY animation, but keep the position at rest so layout doesn't jump).

## 2. GPS action → elevated hero row

Restyle the existing `gpsRow` (logic unchanged: `idle` / `loading` / `denied` / `error` states):

- Wrap in a bordered glass surface: `backgroundColor: Colors.glass.medium`, `borderWidth: 1`, `borderColor: Colors.accent.muted`, `borderRadius: BorderRadius.lg`, margin-matched to the sheet's horizontal padding.
- Add a trailing chevron (`Ionicons chevron-forward`, muted color) at the right edge to imply "tap for instant result" — bare icon, no circle container per nav-icon rules.
- Keep icon/spinner + text exactly as-is on the left; just relocate onto the new surface with slightly more vertical padding (`Spacing.lg`).
- `denied`/`error` states: same muted-text treatment as today, just on the new surface.

## 3. Search input → refined field with focus glow

- Slightly taller (`paddingVertical: Spacing.lg` instead of `md`).
- Background `Colors.glass.light`.
- Border color animates between `Colors.glass.border` (blurred) and a brighter `Colors.accent.primary` at reduced opacity (e.g. `rgba(212,175,55,0.5)`) on focus — driven by `onFocus`/`onBlur` handlers + `Animated.Value` interpolating `borderColor` (or swap a style prop; `useNativeDriver: false` required since `borderColor` isn't transform/opacity).
- Clear (×) button: cross-fade in/out (`Animated.timing` opacity) instead of conditional render popping in instantly.

## 4. Results list → calmer rows + entrance

- Row: add `Spacing.xs` extra vertical padding; add a pressed-state background highlight (`rgba(255,235,210,0.04)`) via `TouchableOpacity`'s existing `activeOpacity` plus a light `underlayColor`-equivalent — since `TouchableOpacity` has no underlay, use `onPressIn`/`onPressOut` to toggle a background color via local state, kept per-row (memoized row component) so it doesn't re-render the whole list.
- Separator: swap flat white hairline for a barely-there gold tint (`rgba(212,175,55,0.08)`).
- Entrance: stagger the first-visible batch (cap at 6 rows — matches the pattern used elsewhere via `Animations.stagger`) with fade + small translateY; rows beyond the cap render without individual animation (avoids a long cascade for 30 results, and avoids re-triggering stagger on every keystroke — key the stagger off first-mount-of-nonempty-results, not off every `results` change).

## 5. Manual entry mode

- Inputs get the same refined-field treatment as the search box (glass background, focus glow).
- Save button: keep existing gold gradient; add a pressed-state scale-down to 98% (`Animated.spring` on `transform: scale`, triggered by `onPressIn`/`onPressOut`).

## 6. Motion budget

All new motion stays within the checklist's timing bands: sheet open/close and press feedback in `micro`–`normal` (120–400ms); nothing loops or decorates idly. `useReduceMotion` disables the sheet slide and the focus-glow animation (instant state swap instead), consistent with app-wide convention.

---

## Non-goals / explicitly unchanged

- All existing handlers (`handleSelect`, `handleUseCurrentLocation`, `handleManualSave`) — logic untouched, only their JSX wrapper/styling changes.
- Props/interface of `LocationPickerModal` — unchanged, no new props needed.
- `cityData`, `prayerTimesService` — untouched.
- GPS speed fix from earlier this session (`getLastKnownPositionAsync` first) — already landed, not part of this visual pass.
