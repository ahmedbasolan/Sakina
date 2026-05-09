import { Mood } from '../types';

interface MoodTimeConfig {
  startHour: number;
  endHour: number;
  moods: Mood[];
}

const TIME_MOOD_MAP: MoodTimeConfig[] = [
  { startHour: 23, endHour: 4, moods: ['Lonely', 'Overwhelmed', 'Tired', 'Sad'] },
  { startHour: 4, endHour: 7, moods: ['Grateful', 'Hopeful', 'Calm', 'Tired'] },
  { startHour: 7, endHour: 17, moods: ['Grateful', 'Hopeful', 'Calm', 'Overwhelmed'] },
  { startHour: 17, endHour: 23, moods: ['Calm', 'Tired', 'Sad', 'Lonely'] },
];

export function getMoodsForTime(hour?: number): Mood[] {
  const h = hour ?? new Date().getHours();

  for (const config of TIME_MOOD_MAP) {
    if (config.startHour > config.endHour) {
      if (h >= config.startHour || h < config.endHour) return config.moods;
    } else {
      if (h >= config.startHour && h < config.endHour) return config.moods;
    }
  }

  return ['Grateful', 'Hopeful', 'Calm', 'Overwhelmed'];
}
