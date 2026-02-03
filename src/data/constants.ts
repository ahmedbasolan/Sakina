import { Mood } from '../types';

export const MOOD_ISLAMIC_TERMS: Record<Mood, string> = {
  Anxious: 'TAWAKKUL',
  Calm: 'SAKINAH',
  Sad: 'SABR',
  Content: 'RIDA',
  Angry: 'IHSAN',
  Grateful: 'SHUKR',
  Tired: 'NASAB',
  Energized: 'NASHAT',
  Stressed: 'DHIQ',
  Hopeful: 'RAJA',
  Happy: 'SURUR',
};

// PRICING & LOCALIZATION
export const USD_AED_CONVERSION_RATE = 3.6725; // 1 USD = 3.67 AED

export const PREMIUM_PRICING = {
  MONTHLY_USD: 2.99,
  YEARLY_USD: 24.99,
  MONTHLY_AED: 10.99,
  YEARLY_AED: 91.99,
};

export const SPECIAL_EDITION_PRICING = {
  RAMADAN_USD: 12.99,
  HAJJ_USD: 14.99,
  UMRAH_USD: 9.99,
  NEW_PARENT_USD: 11.99,
  CONVERT_USD: 8.99,
  BREAKING_FREE_USD: 12.99,
  DEPRESSION_SE_USD: 7.99,
  HARAM_REL_USD: 6.99,

  RAMADAN_AED: 47.99,
  HAJJ_AED: 54.99,
  UMRAH_AED: 36.99,
  NEW_PARENT_AED: 43.99,
  CONVERT_AED: 32.99,
  BREAKING_FREE_AED: 47.99,
  DEPRESSION_SE_AED: 29.99,
  HARAM_REL_AED: 25.99,
};

export const getMoodIslamicTerm = (mood: Mood): string => {
  return MOOD_ISLAMIC_TERMS[mood] || '';
};

export const getMoodDisplay = (mood: Mood): string => {
  const term = getMoodIslamicTerm(mood);
  // Capitalize first letter only for display
  return term.charAt(0) + term.slice(1).toLowerCase();
};
