# GPS Location — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Use Current Location" GPS button to the LocationPickerModal that auto-detects the user's position and uses raw coordinates for more accurate prayer time calculations.

**Architecture:** The `UserLocation` type gains optional `latitude`/`longitude` fields. A new `getTimingsByCoordinates(lat, lon, country)` method on `PrayerTimesService` calls the Aladhan coordinates endpoint with day-based caching. The modal gains a GPS row at the top of search mode; callers route to the coords method when coordinates are present.

**Tech Stack:** expo-location (new), expo-location reverseGeocodeAsync, Aladhan REST API coords endpoint, AsyncStorage caching, TypeScript, jest-expo

---

## File Map

| File | Change |
|---|---|
| `app.json` | Add location permissions for iOS infoPlist + Android permissions + expo-location plugin |
| `src/utils/date.ts` | Add `formatDateDMY()` — `DD-MM-YYYY` format for Aladhan coords endpoint |
| `src/services/locationStorage.ts` | Extend `UserLocation` with `latitude?` / `longitude?` |
| `src/services/prayerTimesService.ts` | Add ISO-2 aliases to `METHOD_BY_COUNTRY`; add `getTimingsByCoordinates()` |
| `src/services/__tests__/prayerTimesService.test.ts` | New — tests for `getTimingsByCoordinates` |
| `src/utils/__tests__/date.test.ts` | New — test for `formatDateDMY` |
| `src/components/LocationPickerModal.tsx` | Import expo-location; add `gpsStatus` state; add GPS row above search input |
| `src/hooks/useHomeData.ts` | `loadPrayerData` routes to coords method when `location.latitude` is set |
| `src/screens/PrayerTimesScreen.tsx` | `fetchTimings` routes to coords method; update privacy note copy |

---

## Task 1: Install expo-location and configure native permissions

**Files:**
- Modify: `app.json`
- (Native install via shell)

- [ ] **Step 1: Install expo-location**

```bash
npx expo install expo-location
```

Expected: package added to `node_modules`, `package.json` updated with `"expo-location": "~18.x.x"` (exact version depends on your Expo SDK).

- [ ] **Step 2: Add iOS permission string and plugin to app.json**

Open `app.json`. In `expo.ios.infoPlist`, add the location usage description. In `expo.plugins`, add `expo-location`. Final state of the relevant sections:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.lelahmed.sakina",
      "infoPlist": {
        "UIUserInterfaceStyle": "Dark",
        "ITSAppUsesNonExemptEncryption": false,
        "NSLocationWhenInUseUsageDescription": "Sakina uses your location to calculate accurate prayer times."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#040D1A"
      },
      "permissions": [
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.ACCESS_FINE_LOCATION"
      ],
      "blockedPermissions": [
        "android.permission.RECORD_AUDIO"
      ],
      "package": "com.lelahmed.sakina"
    },
    "plugins": [
      "expo-font",
      "expo-audio",
      "expo-sqlite",
      "expo-asset",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#D4AF37"
        }
      ],
      "expo-secure-store",
      "expo-web-browser",
      "expo-apple-authentication",
      "expo-location"
    ]
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app.json package.json
git commit -m "feat(location): install expo-location, add iOS/Android permissions"
```

> **Note:** A dev-client rebuild (`npx expo run:ios` / `npx expo run:android`) is required before GPS will work on device. The rest of the tasks are pure JS/TS and can be tested in the emulator or deferred to the rebuild.

---

## Task 2: Add `formatDateDMY()` date utility

**Files:**
- Modify: `src/utils/date.ts`
- Create: `src/utils/__tests__/date.test.ts`

The Aladhan coordinates endpoint uses `DD-MM-YYYY` in the URL path. Add a utility alongside the existing `formatDateYMD`.

- [ ] **Step 1: Write the failing test**

Create `src/utils/__tests__/date.test.ts`:

```ts
import { formatDateDMY } from '../date';

describe('formatDateDMY', () => {
  it('formats a date as DD-MM-YYYY', () => {
    expect(formatDateDMY(new Date(2026, 5, 30))).toBe('30-06-2026');
  });

  it('pads single-digit day and month with leading zeros', () => {
    expect(formatDateDMY(new Date(2026, 0, 5))).toBe('05-01-2026');
  });

  it('defaults to today when no argument given', () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    expect(formatDateDMY()).toBe(`${d}-${m}-${y}`);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest src/utils/__tests__/date.test.ts --no-coverage
```

Expected: `FAIL` — `formatDateDMY is not a function` or similar.

- [ ] **Step 3: Add `formatDateDMY` to `src/utils/date.ts`**

Add after the existing `subtractDays` function:

```ts
/**
 * Format a Date as a local-timezone "DD-MM-YYYY" string.
 * Used for the Aladhan coordinates API endpoint path which requires this format.
 */
export function formatDateDMY(date: Date = new Date()): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest src/utils/__tests__/date.test.ts --no-coverage
```

Expected: `PASS` — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/utils/date.ts src/utils/__tests__/date.test.ts
git commit -m "feat(date): add formatDateDMY utility for Aladhan coords endpoint"
```

---

## Task 3: Extend `UserLocation` with coordinate fields

**Files:**
- Modify: `src/services/locationStorage.ts`

This is an additive, non-breaking change. Existing saved locations (without coords) continue to work — the fields are optional.

- [ ] **Step 1: Extend the interface**

In `src/services/locationStorage.ts`, update the `UserLocation` interface:

```ts
export interface UserLocation {
  city: string;
  country: string;
  latitude?: number;   // present when GPS was used
  longitude?: number;  // present when GPS was used
}
```

- [ ] **Step 2: Verify `formatLocation` is not affected**

`formatLocation` only reads `city` and `country`, spreading nothing else — GPS coords will pass through `saveUserLocation` as-is because `JSON.stringify`/`JSON.parse` preserves them. No change needed to `formatLocation`.

Confirm the function in the file still reads:
```ts
export const formatLocation = (location: UserLocation): UserLocation => ({
  city: titleCase(location.city),
  country:
    location.country.trim().length <= 3
      ? location.country.trim().toUpperCase()
      : titleCase(location.country),
});
```

Note: `latitude` and `longitude` are NOT spread through `formatLocation` — this is intentional. We apply formatting only in `handleUseCurrentLocation` after we have both the formatted display fields and the raw coords, then build the `UserLocation` object manually (see Task 5).

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/services/locationStorage.ts
git commit -m "feat(location): extend UserLocation with optional latitude/longitude"
```

---

## Task 4: Add `getTimingsByCoordinates()` to PrayerTimesService

**Files:**
- Modify: `src/services/prayerTimesService.ts`
- Create: `src/services/__tests__/prayerTimesService.test.ts`

Two changes in one task: ISO-2 aliases added to the method map, then the new service method.

- [ ] **Step 1: Write the failing tests**

Create `src/services/__tests__/prayerTimesService.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import PrayerTimesService from '../prayerTimesService';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key: string, val: string) => { store[key] = val; return Promise.resolve(); }),
    removeItem: jest.fn((key: string) => { delete store[key]; return Promise.resolve(); }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    multiRemove: jest.fn(() => Promise.resolve()),
  };
});

jest.mock('axios');

jest.mock('../retryUtils', () => ({
  withRetry: jest.fn((fn: () => any) => fn()),
  AXIOS_RETRY_CONFIG: {},
}));

jest.mock('../errorLoggingService', () => ({
  logNetworkError: jest.fn(),
  logServiceError: jest.fn(),
}));

jest.mock('../../utils/date', () => ({
  formatDateYMD: jest.fn(() => '2026-06-30'),
  formatDateDMY: jest.fn(() => '30-06-2026'),
  todayYMD: jest.fn(() => '2026-06-30'),
  yesterdayYMD: jest.fn(() => '2026-06-29'),
  subtractDays: jest.fn((d: Date) => d),
}));

jest.mock('../locationStorage', () => ({
  getUserLocation: jest.fn().mockResolvedValue(null),
}));

const MOCK_DATA = {
  timings: {
    Fajr: '04:00', Sunrise: '05:30', Dhuhr: '12:00',
    Asr: '15:30', Maghrib: '18:00', Isha: '19:30',
  },
  date: {
    readable: '30 Jun 2026',
    hijri: { day: '4', month: { en: 'Muharram', ar: '' }, year: '1448', designation: { abbreviated: 'AH' } },
  },
  meta: { method: { name: 'Gulf Region' }, timezone: 'Asia/Dubai' },
};

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PrayerTimesService.getTimingsByCoordinates', () => {
  let service: PrayerTimesService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton
    (PrayerTimesService as any).instance = null;
    service = PrayerTimesService.getInstance();
    mockedAxios.get.mockResolvedValue({ data: { code: 200, data: MOCK_DATA } });
  });

  it('fetches from Aladhan coords endpoint with correct params', async () => {
    await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.aladhan.com/v1/timings/30-06-2026',
      expect.objectContaining({
        params: expect.objectContaining({
          latitude: 25.20,
          longitude: 55.27,
          method: 8,
        }),
      }),
    );
  });

  it('returns timings from the response', async () => {
    const result = await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    expect(result.timings.Fajr).toBe('04:00');
    expect(result.timings.Isha).toBe('19:30');
  });

  it('serves cache on second call without hitting the network', async () => {
    await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('resolves method 8 for ISO-2 "AE" (Gulf Region)', async () => {
    await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    const [[, config]] = mockedAxios.get.mock.calls;
    expect(config?.params?.method).toBe(8);
  });

  it('resolves method 2 for ISO-2 "US" (ISNA)', async () => {
    await service.getTimingsByCoordinates(40.71, -74.00, 'US');
    const [[, config]] = mockedAxios.get.mock.calls;
    expect(config?.params?.method).toBe(2);
  });

  it('uses stale fallback cache when network fails', async () => {
    const fallbackKey = '@prayer_timings_lat25.20_lon55.27_m8_fallback';
    await AsyncStorage.setItem(fallbackKey, JSON.stringify(MOCK_DATA));
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'));
    const result = await service.getTimingsByCoordinates(25.20, 55.27, 'AE');
    expect(result.timings.Fajr).toBe('04:00');
  });

  it('throws when network fails and no fallback exists', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'));
    await expect(service.getTimingsByCoordinates(51.50, -0.12, 'GB')).rejects.toThrow('network error');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx jest src/services/__tests__/prayerTimesService.test.ts --no-coverage
```

Expected: `FAIL` — `getTimingsByCoordinates is not a function`.

- [ ] **Step 3: Add ISO-2 aliases to `METHOD_BY_COUNTRY` in `prayerTimesService.ts`**

Find the `METHOD_BY_COUNTRY` constant and add ISO-2 aliases after the existing entries:

```ts
const METHOD_BY_COUNTRY: Record<string, number> = {
  uae: 8, 'united arab emirates': 8, oman: 8, bahrain: 8, yemen: 8,
  'saudi arabia': 4, ksa: 4,
  kuwait: 9,
  qatar: 10,
  egypt: 5,
  pakistan: 1, india: 1, bangladesh: 1, afghanistan: 1,
  turkey: 13, 'türkiye': 13,
  singapore: 11,
  france: 12,
  russia: 14,
  malaysia: 17,
  indonesia: 20,
  tunisia: 18, algeria: 19, morocco: 21, jordan: 23,
  usa: 2, 'united states': 2, us: 2, canada: 2,
  // ISO-2 aliases returned by expo-location reverseGeocodeAsync
  ae: 8, om: 8, bh: 8, ye: 8,
  sa: 4,
  kw: 9,
  qa: 10,
  eg: 5,
  pk: 1, 'in': 1, bd: 1, af: 1,
  tr: 13,
  sg: 11,
  fr: 12,
  ru: 14,
  my: 17,
  id: 20,
  tn: 18, dz: 19, ma: 21, jo: 23,
  us: 2, ca: 2,
};
```

- [ ] **Step 4: Add the import for `formatDateDMY` at the top of `prayerTimesService.ts`**

Find the existing date import and update it:

```ts
import { formatDateYMD, formatDateDMY } from '../utils/date';
```

- [ ] **Step 5: Add `getTimingsByCoordinates()` method to the `PrayerTimesService` class**

Add this method directly after `getTimingsByCity` (before `pruneStaleTimingCaches`):

```ts
/**
 * Fetches prayer times by GPS coordinates.
 * More accurate than city-name lookup. Uses the same day-based caching
 * and stale-fallback strategy as getTimingsByCity.
 * Coords are rounded to 2 decimal places in the cache key (~1 km precision)
 * to avoid cache misses from GPS jitter between calls.
 */
public async getTimingsByCoordinates(
  lat: number,
  lon: number,
  country: string,
): Promise<PrayerTimesData> {
  const resolvedMethod = getCalculationMethodForCountry(country);
  const today = formatDateYMD();
  const lat2 = lat.toFixed(2);
  const lon2 = lon.toFixed(2);
  const cacheKey = `@prayer_timings_lat${lat2}_lon${lon2}_m${resolvedMethod}_${today}`;
  const fallbackKey = `@prayer_timings_lat${lat2}_lon${lon2}_m${resolvedMethod}_fallback`;

  try {
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) return JSON.parse(cachedData);

    const dateDMY = formatDateDMY();
    const data = await withRetry(
      async () => {
        const response = await axios.get(
          `https://api.aladhan.com/v1/timings/${dateDMY}`,
          { params: { latitude: lat, longitude: lon, method: resolvedMethod } },
        );
        if (response.data.code === 200) return response.data.data;
        throw new Error(response.data.status || 'Failed to fetch prayer times');
      },
      'PrayerTimesService.getTimingsByCoordinates',
      AXIOS_RETRY_CONFIG,
    );

    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    await AsyncStorage.setItem(fallbackKey, JSON.stringify(data));
    this.pruneStaleTimingCaches(today).catch(() => {});
    return data;
  } catch (error: any) {
    logNetworkError(
      'https://api.aladhan.com/v1/timings',
      'GET',
      error instanceof Error ? error : new Error(String(error)),
      { lat, lon },
    );
    const stale = await AsyncStorage.getItem(fallbackKey);
    if (stale) {
      console.warn('[PrayerTimes] Network unavailable — using stale cached timings');
      return JSON.parse(stale);
    }
    throw new Error(error.message || 'Network error fetching prayer times');
  }
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
npx jest src/services/__tests__/prayerTimesService.test.ts --no-coverage
```

Expected: `PASS` — 6 tests passing.

- [ ] **Step 7: Typecheck**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/services/prayerTimesService.ts src/services/__tests__/prayerTimesService.test.ts
git commit -m "feat(prayer): add getTimingsByCoordinates + ISO-2 country method aliases"
```

---

## Task 5: Add GPS row to LocationPickerModal

**Files:**
- Modify: `src/components/LocationPickerModal.tsx`

Add a "Use Current Location" row at the top of search mode. The row shows a spinner while fetching, or an inline muted message on denial/error.

- [ ] **Step 1: Add expo-location import**

At the top of `src/components/LocationPickerModal.tsx`, add after the existing imports:

```ts
import * as Location from 'expo-location';
```

- [ ] **Step 2: Add `gpsStatus` state and `handleUseCurrentLocation` handler**

Inside the component, after the existing `const isSelectingRef = useRef(false);` line, add:

```ts
const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'denied' | 'error'>('idle');
```

In the existing `useEffect` that runs when `visible` changes, add `setGpsStatus('idle')` so it resets each time the modal opens:

```ts
useEffect(() => {
  if (visible) {
    setMode('search');
    setQuery(currentLocation?.city ?? '');
    setCity('');
    setCountry('');
    setGpsStatus('idle');
    setTimeout(() => searchRef.current?.focus(), 150);
  }
}, [visible]);
```

After the existing `handleManualSave` function, add:

```ts
const handleUseCurrentLocation = async () => {
  setGpsStatus('loading');
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setGpsStatus('denied');
      return;
    }
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000),
      ),
    ]);
    const [geo] = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    const rawCity = geo?.city || geo?.district || geo?.subregion || 'Current Location';
    const rawCountry = geo?.isoCountryCode || '';
    const formatted = formatLocation({ city: rawCity, country: rawCountry });
    const locationWithCoords: UserLocation = {
      ...formatted,
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
    await saveUserLocation(locationWithCoords);
    onLocationSelected(locationWithCoords);
    onClose();
  } catch {
    setGpsStatus('error');
  }
};
```

- [ ] **Step 3: Add GPS row JSX above the search input**

In the `search` mode JSX branch, add the GPS row immediately after `<>` and before `{/* Search input */}`. The complete block to insert:

```tsx
{/* GPS row */}
<TouchableOpacity
  style={styles.gpsRow}
  onPress={handleUseCurrentLocation}
  disabled={gpsStatus === 'loading'}
  activeOpacity={0.7}
  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
  accessibilityRole="button"
  accessibilityLabel="Use current location"
>
  {gpsStatus === 'loading' ? (
    <ActivityIndicator size="small" color={Colors.accent.primary} />
  ) : (
    <Ionicons name="locate" size={18} color={Colors.accent.primary} />
  )}
  <Text
    style={[
      styles.gpsText,
      (gpsStatus === 'denied' || gpsStatus === 'error') && styles.gpsTextMuted,
    ]}
  >
    {gpsStatus === 'denied'
      ? 'Location access denied — search below'
      : gpsStatus === 'error'
      ? "Couldn't get location — search below"
      : 'Use Current Location'}
  </Text>
</TouchableOpacity>
<View style={styles.gpsDivider} />
```

- [ ] **Step 4: Add GPS styles to `StyleSheet.create`**

At the end of the `styles` object (before the closing `}`), add:

```ts
gpsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: Spacing.sm,
  paddingHorizontal: Spacing.xl,
  paddingVertical: Spacing.lg,
},
gpsText: {
  fontSize: Typography.sizes.body,
  color: Colors.accent.primary,
  fontWeight: '600',
},
gpsTextMuted: {
  color: Colors.text.muted,
  fontWeight: '400',
},
gpsDivider: {
  height: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  marginHorizontal: Spacing.xl,
  marginBottom: Spacing.sm,
},
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/LocationPickerModal.tsx
git commit -m "feat(modal): add Use Current Location GPS row to LocationPickerModal"
```

---

## Task 6: Route `useHomeData` to coordinates method when available

**Files:**
- Modify: `src/hooks/useHomeData.ts`

Update `loadPrayerData` to use `getTimingsByCoordinates` when the saved location includes GPS coords.

- [ ] **Step 1: Add `PrayerTimesData` to the import from prayerTimesService**

Find the existing import:
```ts
import PrayerTimesService, { PrayerTimings } from '../services/prayerTimesService';
```

Update to:
```ts
import PrayerTimesService, { PrayerTimings, PrayerTimesData } from '../services/prayerTimesService';
```

- [ ] **Step 2: Update `loadPrayerData` to route by coordinates**

Find the `loadPrayerData` callback and replace the prayer-fetch section. The full updated `loadPrayerData`:

```ts
const loadPrayerData = useCallback(async () => {
  try {
    setLoadingPrayers(true);
    const savedLocation = await getUserLocation();
    const city = savedLocation?.city || 'London';
    const country = savedLocation?.country || 'UK';
    setCurrentCity(city);
    setCurrentCountry(country);

    let data: PrayerTimesData;
    if (savedLocation?.latitude && savedLocation?.longitude) {
      data = await prayerService.getTimingsByCoordinates(
        savedLocation.latitude,
        savedLocation.longitude,
        country,
      );
    } else {
      data = await prayerService.getTimingsByCity(city, country);
    }

    setPrayerTimings(data.timings);
    updatePrayerStatus(data.timings);
    if (data.timings.Fajr) setFajrTime(data.timings.Fajr);

    const notifications = NotificationService.getInstance();
    notifications.scheduleSpiritualReminders(data.timings)
      .then(() => notifications.schedulePrayerNotifications(data.timings, city))
      .catch(() => notifications.cancelPrayerAndSpiritual().catch(() => {}));
  } catch (error) {
    logServiceError('useHomeData', 'loadPrayerData', error instanceof Error ? error : new Error(String(error)));
  } finally {
    setLoadingPrayers(false);
  }
}, [prayerService, updatePrayerStatus]);
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useHomeData.ts
git commit -m "feat(home): route prayer fetch through coordinates when GPS location is saved"
```

---

## Task 7: Route `PrayerTimesScreen` to coordinates method + fix privacy note

**Files:**
- Modify: `src/screens/PrayerTimesScreen.tsx`

- [ ] **Step 1: Update `fetchTimings` to route by coordinates**

Find the `fetchTimings` callback and replace it entirely:

```ts
const fetchTimings = useCallback(
  async (loc: UserLocation) => {
    setIsLoading(true);
    try {
      let data: PrayerTimesData;
      if (loc.latitude && loc.longitude) {
        data = await service.getTimingsByCoordinates(loc.latitude, loc.longitude, loc.country);
      } else {
        data = await service.getTimingsByCity(loc.city, loc.country);
      }
      setPrayerData(data);
    } catch (_error) {
      Alert.alert('Error', 'Failed to fetch prayer times. Please try again.');
    } finally {
      setIsLoading(false);
    }
  },
  [service],
);
```

- [ ] **Step 2: Update the privacy note to reflect auto-detected vs manual**

Find the privacy row JSX (currently reads `"Your location is set manually and stored only on this device."`). Replace the `<Text>` inside it:

```tsx
<Text style={styles.privacyText}>
  {location?.latitude
    ? 'Your location was auto-detected and stored only on this device.'
    : 'Your location is set manually and stored only on this device.'}
</Text>
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/screens/PrayerTimesScreen.tsx
git commit -m "feat(prayer-screen): use GPS coordinates for fetch; dynamic privacy note"
```

---

## Task 8: Full test suite + final typecheck

- [ ] **Step 1: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all existing tests pass; new tests in `prayerTimesService.test.ts` and `date.test.ts` pass. No regressions.

- [ ] **Step 2: Final typecheck across the whole project**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 3: Note for device testing**

The GPS flow (`handleUseCurrentLocation`) can only be fully tested on a physical device or simulator with location services enabled, after rebuilding the dev client:

```bash
# iOS simulator
npx expo run:ios

# Android emulator  
npx expo run:android
```

Manual test flow:
1. Open Prayer Times (no location saved) → modal opens → "Use Current Location" row visible at top
2. Tap it → OS permission dialog appears
3. Grant → spinner → auto-detects location → modal closes → prayer times load
4. Tap the location badge in the header → modal reopens → GPS row resets to "Use Current Location"
5. Deny permission on a fresh install → row shows "Location access denied — search below" → search works normally
6. Privacy note at bottom should say "auto-detected" when GPS was used

---

## Self-Review Notes

- All method signatures used in later tasks match what is defined in earlier tasks: `getTimingsByCoordinates(lat: number, lon: number, country: string)` used consistently in Tasks 6 and 7.
- `formatDateDMY` imported and used in Task 4 matches what is created in Task 2.
- `UserLocation` with `latitude?`/`longitude?` defined in Task 3 used in Tasks 5, 6, 7 — consistent optional chaining (`loc.latitude && loc.longitude`).
- `formatLocation` does NOT spread coords (intentional — Task 3 note). Task 5 builds the location object manually to preserve coords after formatting.
- ISO-2 country key `'in'` is quoted to avoid JS reserved-word conflict.
- `us: 2` appears twice in the METHOD_BY_COUNTRY additions (both as ISO-2 and as existing). The second definition will override the first — remove the duplicate by keeping only one `us: 2` entry. In Task 4 Step 3, keep the existing `usa: 2, 'united states': 2, us: 2, canada: 2` line and in the ISO-2 block only add `ca: 2` (not `us: 2` again).
