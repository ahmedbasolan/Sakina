# Location Picker Redesign

**Date:** 2026-06-30
**Scope:** `LocationPickerModal`, `cityData`, `prayerTimesService`, `PrayerTimesScreen`, `HomeScreen`

---

## Goal

Replace the free-text city/country form with a searchable city list backed by a static bundle of ~400 major cities. Fix all bugs identified in the location system review. Keep manual entry as fallback for cities not in the list.

---

## Data

### `src/data/cityData.ts`
Flat array of `{ city: string; country: string }` objects, ~400 entries covering major world cities (Muslim-majority countries prioritised, plus diaspora destinations in Europe, North America, Australasia). No grouping or indexing — filtered client-side on every keystroke.

```ts
export interface City {
  city: string;
  country: string;
}
export const CITIES: City[] = [ ... ];
```

---

## Component: `LocationPickerModal`

### Props

```ts
interface LocationPickerModalProps {
  visible: boolean;
  currentLocation?: UserLocation;  // pre-fills search on open
  onClose: () => void;
  onLocationSelected: (location: UserLocation) => void;
}
```

### Modes

**Search mode (default)**

- Tall card modal (~75% screen height), Celestial Night glass card aesthetic matching existing design
- Gold location-pin icon + "Where are you?" header
- Single `TextInput` — autofocuses on open, pre-filled with `currentLocation.city` if provided
- `FlatList` — filters `CITIES` live (case-insensitive `includes` on city name), max 30 results
- Each row: "City · Country" in body/muted typography, full-width tappable with `hitSlop`
- `keyboardShouldPersistTaps="handled"` so row tap doesn't require two presses
- Tap row → `formatLocation({ city, country })` → `saveUserLocation(formatted)` → `onLocationSelected(formatted)` → `onClose()`. No API validation fetch for list selections.
- Empty results: dim "No results" text + "Enter manually →" link
- Empty query: "Start typing to search" hint, no list shown

**Manual mode** (via "Enter manually →" or from empty search)

- Replaces search content with two-field form (City + Country)
- "← Back to search" link at top
- On save: `.trim()` both fields, guard `if (!city.trim() || !country.trim())`, validate via `prayerService.getTimingsByCity`, then `formatLocation` → `saveUserLocation` → `onLocationSelected(formatted)` → `onClose()`
- Error message unchanged: "We couldn't find prayer times for X, Y. Please check the spelling."

### State reset on open

`useEffect` on `[visible]` — when `visible` flips to `true`:
- `query` → `currentLocation?.city ?? ''`
- `mode` → `'search'`
- `city`, `country` manual fields → `''`

---

## Bug Fixes

### 1. Unformatted location passed to callback
Both search mode and manual mode call `onLocationSelected(formatLocation(...))`. Previously raw typed values were passed.

### 2. Trim before validation (manual mode)
Guard changes from `if (!city || !country)` to `if (!city.trim() || !country.trim())`.

### 3. No pre-fill on open
`currentLocation` prop + `useEffect` reset (above) handles this.

### 4. Duplicate `formatCountdown`
Delete `public formatCountdown()` instance method from `PrayerTimesService`. Update `PrayerTimesScreen` to import `{ formatCountdown }` from the module instead of calling `service.formatCountdown(...)`.

---

## Call-site Changes

### `HomeScreen`
```tsx
<LocationPickerModal
  visible={showLocationModal}
  currentLocation={{ city: currentCity, country: currentCountry }}
  onClose={() => setShowLocationModal(false)}
  onLocationSelected={() => loadPrayerData()}
/>
```
`onLocationSelected` continues calling `loadPrayerData()` — necessary because it also reschedules notifications with fresh timings.

Add `useFocusEffect` (import from `@react-navigation/native`) to pick up location changes made in `PrayerTimesScreen`:
```ts
useFocusEffect(useCallback(() => { loadPrayerData(); }, [loadPrayerData]));
```

### `PrayerTimesScreen`
```tsx
<LocationPickerModal
  visible={showLocationPicker}
  currentLocation={location ?? undefined}
  onClose={() => setShowLocationPicker(false)}
  onLocationSelected={handleLocationSelected}
/>
```
`handleLocationSelected` signature unchanged — already uses the location argument correctly. Now receives formatted location.

---

## Out of Scope
- `clearUserLocation` — leave as-is (dead export, not harmful, may be wired in future settings flow)
- Country-first two-step picker — more taps, not needed with search
- Live geocoding API — adds cost and key management complexity
- Popular-cities default state — editorial complexity, search solves discovery
