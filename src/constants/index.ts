// Centralized constants for the application
import { Mood } from '../types';

export const APP_CONFIG = {
  name: 'Guidance',
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
  auth: '@guidance_auth',
  preferences: '@guidance_preferences',
  location: '@guidance_location',
  onboarding: '@guidance_onboarding_complete',
  moodHistory: '@guidance_mood_history',
} as const;

export const FREEMIUM_LIMITS = {
  dailyGuidanceSessions: 2,
  nextRefreshesPerSession: 3,
  maxSavedItems: 0,
  rotationHistoryDays: 30,
} as const;

export const MOOD_COLORS = {
  overwhelmed: '#E87C5F',
  sad: '#6B8EBF',
  angry: '#E85F5F',
  tired: '#9CA3AF',
  lonely: '#F59E0B',
  grateful: '#4ADE80',
  hopeful: '#6BCB77',
  guilty: '#DC2626',
  calm: '#2ED3C6',
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
