import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserLocation {
  city: string;
  country: string;
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
    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(formatLocation(location)));
  } catch (error) {
    console.error('Error saving user location:', error);
  }
};

export const getUserLocation = async (): Promise<UserLocation | null> => {
  try {
    const data = await AsyncStorage.getItem(LOCATION_KEY);
    return data ? formatLocation(JSON.parse(data)) : null;
  } catch (error) {
    console.error('Error loading user location:', error);
    return null;
  }
};

export const clearUserLocation = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LOCATION_KEY);
  } catch (error) {
    console.error('Error clearing user location:', error);
  }
};
