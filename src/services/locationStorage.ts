import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserLocation {
  city: string;
  country: string;
  latitude?: number;   // present when GPS was used
  longitude?: number;  // present when GPS was used
}

const LOCATION_KEY = '@user_location';

const titleCase = (s: string): string =>
  s.trim().replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

/**
 * Normalises user-typed locations for display: "dubai" → "Dubai".
 * Short country strings are treated as acronyms ("uae" → "UAE", "uk" → "UK").
 * Applied on read AND write so values saved before this fix display
 * correctly too (they leak into notification copy and the prayer header).
 */
export const formatLocation = (location: UserLocation): UserLocation => ({
  city: titleCase(location.city),
  country:
    location.country.trim().length <= 3
      ? location.country.trim().toUpperCase()
      : titleCase(location.country),
});

export const saveUserLocation = async (location: UserLocation): Promise<void> => {
  try {
    const formatted = formatLocation(location);
    const toSave: UserLocation =
      location.latitude !== undefined
        ? { ...formatted, latitude: location.latitude, longitude: location.longitude }
        : formatted;
    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Error saving user location:', error);
  }
};

export const getUserLocation = async (): Promise<UserLocation | null> => {
  try {
    const data = await AsyncStorage.getItem(LOCATION_KEY);
    if (!data) return null;
    // formatLocation returns only {city, country} — re-attach coordinates the
    // same way saveUserLocation does. Dropping them here silently downgraded
    // every consumer (prayer context, notification scheduling, background
    // top-up) from exact on-device adhan.js computation to the network
    // city-lookup path.
    const parsed: UserLocation = JSON.parse(data);
    const formatted = formatLocation(parsed);
    return parsed.latitude !== undefined && parsed.longitude !== undefined
      ? { ...formatted, latitude: parsed.latitude, longitude: parsed.longitude }
      : formatted;
  } catch (error) {
    console.error('Error loading user location:', error);
    return null;
  }
};

const clearUserLocation = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LOCATION_KEY);
  } catch (error) {
    console.error('Error clearing user location:', error);
  }
};
