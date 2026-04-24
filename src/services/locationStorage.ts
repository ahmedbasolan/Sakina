import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserLocation {
  city: string;
  country: string;
}

const LOCATION_KEY = '@user_location';

export const saveUserLocation = async (location: UserLocation): Promise<void> => {
  try {
    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(location));
  } catch (error) {
    console.error('Error saving user location:', error);
  }
};

export const getUserLocation = async (): Promise<UserLocation | null> => {
  try {
    const data = await AsyncStorage.getItem(LOCATION_KEY);
    return data ? JSON.parse(data) : null;
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
