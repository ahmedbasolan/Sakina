# Visual & Navigation Polish — Design

Date: 2026-06-06
Status: Approved

Seven targeted visual/navigation fixes to bring the app fully into the
"Warm Arabian Sanctuary" language and make prayer times functional.

## 1. Splash / loading rebrand — `App.tsx`

Replace the teal `✦` loading screen (teal `#2ED3C6`, bouncing dots,
"Preparing your spiritual journey") with a calm branded splash:

- `<SakinaLantern>` centered on the navy gradient `#07111E → #0C1A2E → #0F1F30`.
- A soft gold glow **breathing** behind the lantern (reuse the WelcomeScreen
  `glowAnim` loop: opacity 0.08 → 0.2 → 0.08 over ~3s, `useNativeDriver: true`).
- "Sakina" in serif (`Georgia`/`serif`) + a quiet subtitle, fading in.
- Drop teal entirely; gold accent only.
- Reduce-motion: glow holds at a steady mid opacity, no loop.
- Update `app.json` splash `backgroundColor` to the navy `#07111E` so the
  native → JS handoff has no color flash.

## 2. Shimmer on primary CTAs — new `src/components/ShimmerButton.tsx`

One shared component encapsulating the gold gradient button + shimmer:

- Gold `LinearGradient` (`#E8C84A → #B8860B`) pill, same dimensions/radius as
  the current CTAs.
- A diagonal light band (`LinearGradient`: transparent →
  `rgba(255,255,255,0.45)` → transparent) translates **left → right** across
  the button on a slow loop (~2.4s sweep + short pause), clipped by
  `overflow: 'hidden'`. Transform-only, `useNativeDriver: true`.
- Props: `label`, `onPress`, plus style overrides for height/radius.
- Replaces the **scale pulse** on Bismillah `Continue`. Also used by
  "Begin Your Journey" (Welcome) and "Yes, remind me" (Notification).
- Reduce-motion: render the static gold button, no sweep.

## 3. Progress-ring mandala visibility — `src/components/onboarding/ProgressMandala.tsx`

The inner `AnimatedMandala` is too faint inside the 44px ring. Raise its
`opacity` prop from `0.6` toward `~0.9` and increase its size factor
(`size * 0.85 → ~0.92`). If the mandala's own internal strokes are inherently
faint, raise those too so the geometry reads at 44px.

## 4. Bell frame → 8-point star — `src/components/onboarding/NotificationScreen.tsx`

Replace the circular `iconRing` + concentric circle halos with a gold
**8-point star (najmah)** SVG frame cradling the bell:

- Two overlaid squares rotated 45° (an 8-point star outline) in gold
  `Colors.accent.primary`, with a soft gold glow behind.
- The existing `BellIcon` glyph is unchanged, centered within the star.
- Remove `haloOuter`/`haloMid` circles and the `iconRing` circle styles.

## 5. Remove gold background circle (glow orb) — Home / Reflection / Library

Delete the 400px gold circle (`glowOrb`, `opacity: 0.08`) from the top of:

- `src/components/home/HeroHeader.tsx`
- `src/screens/ReflectionHistoryScreen.tsx`
- `src/screens/LibraryScreen.tsx`

Keep stars / mandala backdrops where present.

## 6. Calm fade-in greeting — `src/components/home/HeroHeader.tsx`

The greeting above Verse of the Day currently shares the hero's
fade + `translateY` slide. Give it its **own opacity-only** fade:

- Dedicated `Animated.Value` (0 → 1), ~900ms ease-in, small delay so it
  reveals after the header settles.
- No `translateY`, no scale, no pulse — a calm fade only.
- Reduce-motion: appears at full opacity immediately.

## 7. Prayer times — wire up + rebrand + countdown

`PrayerTimesScreen` already exists and is registered in `MainNavigator`, but is
unreached and off-brand.

- **Wire up** — `src/screens/HomeScreen.tsx`: the "FAJR PRAYER" quick card
  `onPress` → `navigation.navigate('PrayerTimes')` (currently `MoodHistory`).
- **Rebrand** `src/screens/PrayerTimesScreen.tsx` to the design system: navy
  gradient (`#07111E → #0C1A2E → #0F1519`), `Colors.accent.primary` gold
  (drop tan `#D4A574`), serif headings, token spacing/radius.
- **Next-prayer highlight + live countdown** — the upcoming prayer row glows
  gold; a header shows e.g. "Maghrib in 2h 15m" via the existing
  `getNextPrayerInfo` / `formatCountdown`, refreshed each minute with a
  `setInterval` (cleared on unmount).
- **Location** stays manual via `LocationPickerModal` (rebrand it from teal
  `#0F766E` / sand `#D4A574` to navy/gold), keeping its on-device privacy note.

## Out of scope

Mood logic, prayer API/service internals, notification scheduling, database.
No new dependencies.
