import { Mood } from '../types';

/**
 * Ionicons name per mood — single source of truth so a mood badge renders
 * with the same icon everywhere one appears (Reflections, Saved Verses, …).
 * Previously duplicated ad hoc per screen, which is exactly how it drifts.
 */
export const MOOD_ICON: Record<Mood, string> = {
  Grateful: 'heart',
  Hopeful: 'sunny',
  Calm: 'water',
  Overwhelmed: 'layers',
  Tired: 'moon',
  Lonely: 'person',
  Sad: 'rainy',
  Angry: 'flame',
  Guilty: 'refresh-circle',
};
