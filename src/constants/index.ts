// Centralized constants for the application
import { Mood } from '../types';

export const APP_CONFIG = {
  name: 'Sakina',
  version: '1.0.0',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'ar', 'ur', 'tr', 'id', 'ms'] as const,
} as const;

export const SCREEN_DIMENSIONS = {
  get width() {
    const { width } = require('react-native').Dimensions.get('window');
    return width;
  },
  get height() {
    const { height } = require('react-native').Dimensions.get('window');
    return height;
  },
} as const;

export const ANIMATION_CONFIG = {
  durations: {
    fast: 200,
    normal: 300,
    slow: 500,
    extraSlow: 800,
  },
  easing: {
    easeIn: 'easeIn',
    easeOut: 'easeOut',
    easeInOut: 'easeInOut',
  },
  spring: {
    damping: 15,
    stiffness: 150,
  },
} as const;

export const API_CONFIG = {
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

export const STORAGE_KEYS = {
  // Auth & session
  auth: '@guidance_auth',
  lastOpen: '@sakina_last_open',   // was @noor_last_open — migration handled in HomeScreen

  // User preferences & location
  preferences: '@guidance_preferences',
  location: '@guidance_location',

  // Onboarding
  onboarding: '@onboarding_complete',
  onboardingMood: '@onboarding_mood',
  onboardingGoal: '@onboarding_prayer_goal',

  // Content cache
  moodHistory: '@guidance_mood_history',
  dailyVerse: '@daily_verse',
  dailyHadith: '@daily_hadith',
  backgroundTheme: '@quietheart_background_theme',
} as const;

export const FREEMIUM_LIMITS = {
  refreshesPerPrayerWindow: 3,
  maxSavedItems: 30,
  rotationHistoryDays: 30,
} as const;

// Upgrade-ask cooldown (spec §8): at most one peak ask per this window, so the
// app never nags. Paired with a "no same peak type twice in a row" rule in
// freemiumService.shouldOfferUpgrade.
export const UPGRADE_ASK_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// Keyed by the capitalized `Mood` union (NOT lowercase) so lookups like
// MOOD_COLORS[mood] resolve — and aligned to the canonical MoodColors accents
// in DesignSystem so mood dots/tags match the Home grid across every screen.
export const MOOD_COLORS = {
  Overwhelmed: '#818CF8',
  Sad: '#94A3B8',
  Angry: '#FB923C',
  Tired: '#D6D3D1',
  Lonely: '#C084FC',
  Grateful: '#FBBF24',
  Hopeful: '#22D3EE',
  Guilty: '#A3A3A3',
  Calm: '#34D399',
} as const;

export const MOOD_ISLAMIC_TERMS = {
  Overwhelmed: 'TAWAKKUL',
  Sad: 'SABR',
  Angry: 'IHSAN',
  Tired: 'QUWWAH',
  Lonely: 'WASL',
  Grateful: 'SHUKR',
  Hopeful: 'RAJA',
  Guilty: 'TAWBAH',
  Calm: 'SAKINAH',
} as const;

export const getMoodIslamicTerm = (mood: Mood): string => {
  return MOOD_ISLAMIC_TERMS[mood] || '';
};

/**
 * The six "heavy" moods. When the active guidance mood is one of these, limits
 * lift and no upgrade prompt appears (the mercy rule — see spec §4). The list is
 * a moral decision, not a tuning knob: when in doubt, mercy.
 */
export const MERCY_MOODS: ReadonlySet<Mood> = new Set<Mood>([
  'Overwhelmed', // Tawakkul
  'Sad',         // Sabr
  'Lonely',      // Wasl
  'Guilty',      // Tawbah — sacred; never gate repentance
  'Angry',       // Ihsan
  'Tired',       // Quwwah
]);

export const isMercyMood = (mood: Mood): boolean => MERCY_MOODS.has(mood);

export const getMoodDisplay = (mood: Mood): string => {
  const term = getMoodIslamicTerm(mood);
  return term.charAt(0) + term.slice(1).toLowerCase();
};

export const PRAYER_TIMES = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
} as const;

export const ERROR_MESSAGES = {
  network: 'Network connection error. Please check your internet connection.',
  server: 'Server error. Please try again later.',
  auth: 'Authentication error. Please sign in again.',
  unknown: 'An unexpected error occurred. Please try again.',
} as const;

export const SPECIAL_EDITION_PRICING = {
  RAMADAN_USD: 29.99,
  RAMADAN_AED: 110,
  HAJJ_USD: 49.99,
  HAJJ_AED: 185,
  UMRAH_USD: 39.99,
  UMRAH_AED: 145,
  NEW_PARENT_USD: 34.99,
  NEW_PARENT_AED: 129,
  CONVERT_USD: 24.99,
  CONVERT_AED: 92,
  BREAKING_FREE_USD: 44.99,
  BREAKING_FREE_AED: 165,
  DEPRESSION_SE_USD: 39.99,
  DEPRESSION_SE_AED: 145,
  HARAM_REL_USD: 19.99,
  HARAM_REL_AED: 74,
} as const;
