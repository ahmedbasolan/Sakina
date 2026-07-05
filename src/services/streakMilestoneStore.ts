import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local persistence for which streak milestones (spec §8 streak_milestone
 * peak) have already been celebrated, so an app restart or a repeat
 * loadStreakData() call never re-fires the same milestone's banner.
 */
const STREAK_MILESTONES_SEEN_KEY = '@streak_milestones_seen';

export const loadSeenStreakMilestones = async (): Promise<number[]> => {
  try {
    const data = await AsyncStorage.getItem(STREAK_MILESTONES_SEEN_KEY);
    return data ? (JSON.parse(data) as number[]) : [];
  } catch (error) {
    console.error('Error loading seen streak milestones:', error);
    return [];
  }
};

export const saveSeenStreakMilestones = async (milestones: number[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STREAK_MILESTONES_SEEN_KEY, JSON.stringify(milestones));
  } catch (error) {
    console.error('Error saving seen streak milestones:', error);
  }
};
