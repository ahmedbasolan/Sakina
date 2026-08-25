/**
 * Mood definitions for MoodSelectionScreen (SVG icon paths, colour tokens,
 * descriptive copy).
 *
 * This is NOT actually imported by HomeScreen's SmartMoodGrid or
 * MoodCheckInModal — both of those hardcode their own separate mood arrays
 * (HomeScreen's MOOD_CARD_CONTENT, MoodCheckInModal's GRID_MOODS). An earlier
 * version of this comment claimed all three were unified here; they were not,
 * and the Arabic word for 'Lonely' had quietly drifted apart as a result
 * (وَحْدَة here vs وَحْشَة in the other two, fixed 2026-08-23). Keep the Arabic
 * field here in sync with MoodCheckInModal's GRID_MOODS by hand until these
 * are actually consolidated onto one shared source.
 */
import { Mood } from '../types';

export interface MoodVisual {
  key: Mood;
  arabic: string;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  /** M-path for a 24×24 SVG viewBox, filled with `color`. */
  icon: string;
  /** Ionicons name — used by compact cards / fallback contexts. */
  ionicon: string;
}

/**
 * Ordered list. The first 4 are "light" emotions, the next 4 are "heavy",
 * and Guilty/Tawbah anchors the set.
 */
export const MOOD_VISUALS: MoodVisual[] = [
  {
    key: 'Grateful',
    arabic: 'شُكْر',
    label: 'GRATEFUL',
    description: 'Thankfulness fills your heart',
    color: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(251, 191, 36, 0.2)',
    icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    ionicon: 'heart',
  },
  {
    key: 'Hopeful',
    arabic: 'أَمَل',
    label: 'HOPEFUL',
    description: 'Light breaks through the clouds',
    color: '#22D3EE',
    bg: 'rgba(34, 211, 238, 0.08)',
    border: 'rgba(34, 211, 238, 0.2)',
    icon: 'M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z',
    ionicon: 'sunny',
  },
  {
    key: 'Calm',
    arabic: 'سَكِينَة',
    label: 'CALM',
    description: 'Serenity settles in your soul',
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.08)',
    border: 'rgba(52, 211, 153, 0.2)',
    icon: 'M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l.95-2.3c.48.17.98.3 1.34.3 11 0 14-17 14-17-1 2-8 5.25-13 6.25-5 1-7 5.25-7 7.25 0 2 1.75 3.75 1.75 3.75C7 8 17 8 17 8z',
    ionicon: 'water',
  },
  {
    key: 'Overwhelmed',
    arabic: 'إِرْهَاق',
    label: 'OVERWHELMED',
    description: 'The weight feels too heavy',
    color: '#818CF8',
    bg: 'rgba(129, 140, 248, 0.08)',
    border: 'rgba(129, 140, 248, 0.2)',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
    ionicon: 'layers',
  },
  {
    key: 'Tired',
    arabic: 'تَعَب',
    label: 'TIRED',
    description: 'Seeking strength to carry on',
    color: '#C99A93',
    bg: 'rgba(201, 154, 147, 0.08)',
    border: 'rgba(201, 154, 147, 0.2)',
    icon: 'M9 2c-1.05 0-2.05.16-3 .46 4.06 1.27 7 5.06 7 9.54 0 4.48-2.94 8.27-7 9.54.95.3 1.95.46 3 .46 5.52 0 10-4.48 10-10S14.52 2 9 2z',
    ionicon: 'moon',
  },
  {
    key: 'Sad',
    arabic: 'حُزْن',
    label: 'SAD',
    description: 'Tears are a form of prayer',
    color: '#7BA3D0',
    bg: 'rgba(123, 163, 208, 0.08)',
    border: 'rgba(123, 163, 208, 0.2)',
    icon: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z',
    ionicon: 'rainy',
  },
  {
    key: 'Angry',
    arabic: 'غَضَب',
    label: 'ANGRY',
    description: 'Fire that seeks peace',
    color: '#FB923C',
    bg: 'rgba(251, 146, 60, 0.08)',
    border: 'rgba(251, 146, 60, 0.2)',
    icon: 'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z',
    ionicon: 'flame',
  },
  {
    key: 'Lonely',
    // Was 'وَحْدَة' (Wahda, solitude) — HomeScreen and the mood check-in modal
    // both use 'وَحْشَة' (Wahsha, desolation/isolation) for this mood instead.
    arabic: 'وَحْشَة',
    label: 'LONELY',
    description: 'Allah is always near',
    color: '#C084FC',
    bg: 'rgba(192, 132, 252, 0.08)',
    border: 'rgba(192, 132, 252, 0.2)',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    ionicon: 'person',
  },
  {
    key: 'Guilty',
    arabic: 'تَوْبَة',
    label: 'GUILT',
    description: 'Seeking forgiveness and return',
    color: '#4FB8A0',
    bg: 'rgba(79, 184, 160, 0.06)',
    border: 'rgba(79, 184, 160, 0.15)',
    icon: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
    ionicon: 'refresh-circle',
  },
];

/** Lookup by Mood key for O(1) access in renderers. */
export const MOOD_VISUAL_MAP = new Map(MOOD_VISUALS.map((m) => [m.key, m]));
