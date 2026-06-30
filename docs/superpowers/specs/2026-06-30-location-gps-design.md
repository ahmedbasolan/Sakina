# GPS Location — Design Spec

**Date:** 2026-06-30  
**Branch:** ui/celestial-night-unification  
**Status:** Approved

## Problem

The app currently has no GPS location support. Users must manually type their city and country every time. This is not the standard pattern — every modern mobile app that needs location offers "Use Current Location" as the primary path, with manual entry as the fallback.

## Goal

Add a "Use Current Location" button to the existing `LocationPickerModal` that: requests foreground GPS permission, fetches the device position, reverse geocodes it to a city/country display label, and uses the raw coordinates for prayer time calculation (more accurate than city-name lookups). Manual search remains unchanged as the fallback.

---

## Architecture

### Approach

Approach A — button in modal, coordinates stored alongside city. The `LocationPickerModal` gains a GPS row at the top of its search view. The prayer service gains a coordinates-based fetch path. Both changes are additive; existing manual-entry users are unaffected.

### Data Layer — `locationStorage.ts`

Extend `UserLocation` with optional coordinate fields:

```ts
export interface UserLocation {
  city: string;     // always populated (reverse-geocoded or manual)
  country: string;  // always populated
  latitude?: number;   // present when GPS was used
  longitude?: number;  // present when GPS was used
}
```

`saveUserLocation` / `getUserLocation` require no changes — JSON serialization handles the new fields transparently. All existing consumers (notifications, HomeScreen display, manual entry) continue working unchanged.

### Service Layer — `prayerTimesService.ts`

**New method:**

```ts
public async getTimingsByCoordinates(lat: number, lon: number, country: string): Promise<PrayerTimesData>
```

- Endpoint: `https://api.aladhan.com/v1/timings/{DD-MM-YYYY}?latitude={lat}&longitude={lon}&method={method}`
- Method resolved via `getCalculationMethodForCountry(country)` using the reverse-geocoded country.
- Cache key: `@prayer_timings_lat{lat2dp}_lon{lon2dp}_m{method}_{YYYY-MM-DD}` where coords are **rounded to 2 decimal places** (~1 km precision) to avoid cache misses from GPS jitter.
- Cross-day fallback key: `@prayer_timings_lat{lat2dp}_lon{lon2dp}_m{method}_fallback`
- Same day-based + stale-fallback caching pattern as `getTimingsByCity`.

**ISO country code aliases:**

`METHOD_BY_COUNTRY` gains ISO-2 key aliases (`"ae"`, `"us"`, `"gb"`, etc.) because `reverseGeocodeAsync` returns 2-letter codes, not full names.

**Date format:**

Add a `formatDateDMY()` utility to `src/utils/date.ts` (returns `DD-MM-YYYY`) for the coordinates endpoint URL path. The existing `formatDateYMD()` is used only for city-based caching keys.

**Caller routing:**

`PrayerTimesScreen` and `useHomeData` both check:
```ts
if (location.latitude && location.longitude) {
  await service.getTimingsByCoordinates(location.latitude, location.longitude, location.country);
} else {
  await service.getTimingsByCity(location.city, location.country);
}
```

### UI Layer — `LocationPickerModal.tsx`

In `search` mode, a GPS row appears above the search input:

```
┌─────────────────────────────────────────────┐
│ ⊙  Use Current Location      [spinner?]     │  ← gold icon, cream text
├─────────────────────────────────────────────┤
│ 🔍  Search city...                           │
│ ─────────────────────────────────────────── │
│  Dubai                            UAE        │
└─────────────────────────────────────────────┘
```

**GPS tap flow:**
1. Show inline `ActivityIndicator` on the row
2. `requestForegroundPermissionsAsync()` — triggers OS permission dialog
3. If **granted**: `getCurrentPositionAsync({ accuracy: Balanced, timeoutMs: 10000 })` → `reverseGeocodeAsync()` → save `UserLocation` with coords → close modal
4. If **denied**: replace spinner with inline text `"Location access denied — search below"` in `Colors.text.muted`
5. If **GPS error / timeout**: inline `"Couldn't get location — search below"`

**Styling:**
- Gold `location` icon (bare, no circular container — per CLAUDE.md)
- `hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}`
- Divider line between GPS row and search input matches existing `separator` style
- Disabled/loading state: icon + text opacity 0.5, non-interactive

**Reverse geocode display label:**
- Use `city` from geocode result; fall back to `"Current Location"` if empty
- Use `isoCountryCode` (2-letter) as country; fall back to `""`

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Permission denied (first ask or "Never") | Inline muted text, no Alert, no Settings deep-link |
| GPS timeout (10 s) | Inline error, user falls back to search |
| Reverse geocode returns no city | City = `"Current Location"`, prayer times still use raw coords |
| No network for prayer API | Existing stale-cache fallback path fires |
| User re-opens modal with saved coords | GPS row re-fetches fresh position on tap |

---

## Native Setup

`expo-location` is not yet installed. Required before build:

1. `npx expo install expo-location`
2. `app.json` — add to `expo.ios.infoPlist`:
   ```json
   "NSLocationWhenInUseUsageDescription": "Sakina uses your location to calculate accurate prayer times."
   ```
3. `app.json` — add to `expo.android.permissions`:
   ```json
   "android.permission.ACCESS_FINE_LOCATION"
   ```
4. Rebuild the dev client (`npx expo run:android` / `npx expo run:ios`)

---

## Files Changed

| File | Change |
|---|---|
| `package.json` / native | `expo-location` installed |
| `app.json` | iOS + Android location permissions |
| `src/services/locationStorage.ts` | `UserLocation` + optional `latitude`/`longitude` |
| `src/services/prayerTimesService.ts` | `getTimingsByCoordinates()`, ISO aliases, `formatDateDMY()` |
| `src/components/LocationPickerModal.tsx` | GPS row in search mode |
| `src/screens/PrayerTimesScreen.tsx` | Route to coords method if available |
| `src/hooks/useHomeData.ts` | Route to coords method if available |
| `src/utils/date.ts` | Add `formatDateDMY()` utility |
| `src/screens/PrayerTimesScreen.tsx` | Update privacy note copy: "set manually" → "auto-detected or set manually" |

---

## Out of Scope

- Deep-link to iOS/Android Settings on permanent denial
- Background location / location updates
- Qibla direction (separate feature)
