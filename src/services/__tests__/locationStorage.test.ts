/**
 * locationStorage — save/load roundtrip for the user's saved location.
 *
 * The critical regression this guards: getUserLocation must preserve GPS
 * coordinates. Stripping them silently downgrades every consumer (prayer
 * context on mood taps, notification scheduling, the background top-up)
 * from exact on-device adhan.js computation to the network city-lookup
 * path — which is what made the first mood tap of each new day stall on
 * api.aladhan.com (device-reported 2026-07-19).
 */
const mockStore: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore[key] ?? null)),
  setItem: jest.fn((key: string, val: string) => {
    mockStore[key] = val;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStore[key];
    return Promise.resolve();
  }),
}));

import { saveUserLocation, getUserLocation } from '../locationStorage';

beforeEach(() => {
  Object.keys(mockStore).forEach((k) => delete mockStore[k]);
});

describe('locationStorage roundtrip', () => {
  it('preserves GPS coordinates through save → load', async () => {
    await saveUserLocation({ city: 'dubai', country: 'ae', latitude: 25.2048, longitude: 55.2708 });
    const loaded = await getUserLocation();
    expect(loaded?.latitude).toBe(25.2048);
    expect(loaded?.longitude).toBe(55.2708);
  });

  it('still formats city/country for display on load', async () => {
    await saveUserLocation({ city: 'dubai', country: 'uae', latitude: 25.2, longitude: 55.3 });
    const loaded = await getUserLocation();
    expect(loaded?.city).toBe('Dubai');
    expect(loaded?.country).toBe('UAE');
  });

  it('loads a manual-entry location (no coordinates) with coords absent', async () => {
    await saveUserLocation({ city: 'Cairo', country: 'Egypt' });
    const loaded = await getUserLocation();
    expect(loaded?.city).toBe('Cairo');
    expect(loaded?.latitude).toBeUndefined();
  });

  it('preserves coordinates on raw values written by older app versions', async () => {
    // Simulates a pre-formatting-era stored value, not one written by
    // saveUserLocation — the read path alone must keep the coordinates.
    mockStore['@user_location'] = JSON.stringify({
      city: 'sharjah',
      country: 'ae',
      latitude: 25.34,
      longitude: 55.42,
    });
    const loaded = await getUserLocation();
    expect(loaded?.city).toBe('Sharjah');
    expect(loaded?.latitude).toBe(25.34);
    expect(loaded?.longitude).toBe(55.42);
  });

  it('returns null when nothing is saved', async () => {
    expect(await getUserLocation()).toBeNull();
  });
});
