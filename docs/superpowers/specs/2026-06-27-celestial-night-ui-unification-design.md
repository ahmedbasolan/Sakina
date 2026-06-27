# Celestial Night — UI Style Unification (Pass 1)

**Date:** 2026-06-27
**Status:** Approved (design), pending spec review
**Scope:** Tokens + worst offenders. Keep warm cream text + single gold accent.

---

## Problem

The app declares one aesthetic ("Warm Arabian Sanctuary") in `CLAUDE.md`, but the
screens have drifted into **three** distinct dark-background families:

1. **Warm navy** (`DesignSystem.Colors.background`): `#040D1A` / `#081629` / `#0C1D3A`
   — the documented canon, but used by almost nothing.
2. **Cool steel-blue**: `#07111E` / `#0C1A2E` / `#0F1F30` — used by the
   highest-traffic screens (`HomeScreen`, `LibraryScreen`, `AuthScreens`).
3. **Mid-blue slate**: `#0C1220` / `#0F1E30` / `#1E3A5F` — used heavily and
   inconsistently in `MoodHistoryCalendarScreen`.

Plus scattered raw hex card colors and raw border-radius numbers that bypass the
design tokens entirely.

## Decision

Commit the whole app to **Celestial Night** — the cool steel-blue family (#2
above), because the app's busiest screens already live there and it is the
lowest-friction path to consistency. **Warm cream text (`#F5EDE3`) and the single
gold accent (`#D4AF37`) stay** — the warm-on-cool contrast is the "lantern under
a starlit sky" identity and keeps the gold fanoos brand mark coherent.

This is **Pass 1**: promote the palette to the canon and fix the screens that
clash hardest. It is **not** a full 17-screen repaint.

---

## The Celestial Night Canon

### 1. `DesignSystem.ts` — background ramp

Change `Colors.background` to the steel-blue ramp:

```ts
background: {
  primary:   '#07111E', // deepest — screen base
  secondary: '#0C1A2E', // raised surfaces / sheets
  tertiary:  '#0F1F30', // cards
},
```

Add a named screen-wash gradient token so screens stop inventing it inline:

```ts
// in Colors
celestialWash: ['#07111E', '#0C1A2E', '#0F1F30'] as const,
```

**Unchanged:** `Colors.text.*` (warm cream), `Colors.accent.*` (gold),
`Colors.glass.*` (warm-tinted rgba — the warm/cool play is intentional),
`Colors.status.*`, `MoodColors` (immersive per-mood worlds — out of scope),
`Spacing`, `BorderRadius`, `Typography`, `Animations`, `Elevation`.

### 2. Texture recipe (what "celestial" means, consistently)

Every primary screen uses the same layered backdrop, in this order:
1. Navy wash — `LinearGradient` with `Colors.celestialWash` (or `background.*`).
2. `TwinklingStar` field (the existing component).
3. Faint gold `AnimatedMandala` backdrop (existing component).
4. Glass content on top (`Colors.glass.*` surfaces).

Already true on Home / Library / Paths. Stragglers get pulled in.

---

## Worst Offenders to Repaint (Pass 1 targets)

### A. `MoodHistoryCalendarScreen.tsx` — biggest clash
Currently the mid-blue slate family with raw hex + raw radii. Changes:
- `container` bg `#0C1220` → `Colors.background.primary`.
- Card bgs `#0F1E30` (lines ~786, ~881) → `Colors.background.tertiary`.
- Slate fills `#1E3A5F` (lines ~910, ~1088, ~1125) → `Colors.glass.light` /
  `Colors.glass.medium` as appropriate (chips/bars vs surfaces).
- Border `#1E3A5F` (~885) → `Colors.glass.border`.
- Muted text hexes `#2A4060` (~493), `#2A4A6A` (~933), `#6B8EAE` (loading) →
  `Colors.text.muted` / `Colors.text.secondary`.
- Header gradient `['#0E0C18','#0C1220']` (~332) → `Colors.celestialWash` (or a
  2-stop slice of it).
- Raw radii `90`, `110`, `20`, `18`, `14`, `12`, `10` → nearest `BorderRadius`
  token (`xxl 24` / `xl 20` / `lg 16` / `md 12` / `sm 8`; glow orbs may keep a
  large literal if no token fits — document it).
- Add the missing star + mandala texture layer so it matches its neighbors.

### B. `HomeScreen.tsx` — quick-action cards
- Wash gradient `['#07111E','#0C1A2E','#0F1519']` (~247): fix the third stop
  `#0F1519` → `#0F1F30` and source from `Colors.celestialWash`.
- Quick card raw hexes (~412, ~416, ~431, ~435):
  `#0F2236` / `#0A1828` (gold card) and `#180E2E` / `#120A20` (purple card),
  with borders `#1E3A5F` / `#1A3A5A` / `#3D1E6A` / `#2A1040`.
  → base surface from `Colors.background.tertiary` + `Colors.glass.border`;
  keep the **gold vs. teal** icon tint as the only per-card accent (drop the
  purple — it's a fourth hue the system doesn't sanction; use
  `Colors.accent.secondary` teal for the second card to stay on-palette).

### C. `LibraryScreen.tsx` / `AuthScreens.tsx` — near-correct, verify
Already steel-blue. Verify base equals `Colors.background.primary` and swap any
inline wash arrays to `Colors.celestialWash`. Low risk.

### D. Token-based utility screens — verify only
`SettingsScreen`, `PrayerTimesScreen`, `ReflectionHistoryScreen`,
`QuranLibraryScreen` mostly use tokens already; they inherit the new canon for
free. Spot-check each renders on `background.primary` and fix any stray hex.

---

## Explicitly Out of Scope (Pass 1)

- `MoodColors` and the immersive `GuidanceScreen` layers — intentional per-mood
  worlds, left untouched.
- A full component-by-component repaint of all 17 screens + 50 components.
- Luminous Manuscript / Warm Sanctuary directions (rejected).
- New animations, layout changes, or copy changes.

## Success Criteria

1. `Colors.background` = the Celestial Night ramp; one `celestialWash` token exists.
2. `MoodHistoryCalendarScreen` no longer uses the mid-blue slate family; all
   surfaces/text/radii come from tokens; star+mandala texture present.
3. `HomeScreen` quick cards use token surfaces; no purple fourth-hue; wash sourced
   from the token.
4. No raw background/surface hex in the Pass-1 target screens (mood-accent hexes
   in `MoodColors`-derived maps are allowed).
5. `npx tsc --noEmit -p tsconfig.json` passes.
6. Every Pass-1 screen reads as the same product world: cool navy ground, warm
   cream text, single gold accent, star/mandala texture.

## Verification

- Typecheck clean.
- Visual confirmation on device via Expo (palette can't be confirmed from a
  typecheck) — the user runs this; agent cannot verify visuals.

## CLAUDE.md follow-up

After Pass 1 lands, update `CLAUDE.md`'s aesthetic description so the documented
canon matches the shipped Celestial Night palette (currently it describes warm
`#14100C`-style values). Tracked as a closing step of the plan.
