// Centralized constants for the application
import { Mood } from '../types';

/**
 * Canonical display names for internal Mood ids. The stored id 'Calm' renders
 * as "Peaceful" (paired with Sukoon) everywhere in the UI — never show the
 * raw id to users. Keep stored ids untouched: they live in user history rows.
 */
const MOOD_LABELS: Record<Mood, string> = {
  Grateful: 'Grateful',
  Hopeful: 'Hopeful',
  Calm: 'Peaceful',
  Overwhelmed: 'Overwhelmed',
  Tired: 'Tired',
  Lonely: 'Lonely',
  Sad: 'Sad',
  Angry: 'Angry',
  Guilty: 'Guilty',
};

/** Display label for a mood id; falls back to the raw value for unknowns. */
export const moodLabel = (mood: string): string => MOOD_LABELS[mood as Mood] ?? mood;

const APP_CONFIG = {
  name: 'Sakina',
  version: '1.0.0',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'ar', 'ur', 'tr', 'id', 'ms'] as const,
} as const;

const SCREEN_DIMENSIONS = {
  get width() {
    const { width } = require('react-native').Dimensions.get('window');
    return width;
  },
  get height() {
    const { height } = require('react-native').Dimensions.get('window');
    return height;
  },
} as const;

const ANIMATION_CONFIG = {
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

const API_CONFIG = {
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

export const STORAGE_KEYS = {
  // Auth & session
  auth: '@guidance_auth',
  lastOpen: '@sakina_last_open', // was @noor_last_open — migration handled in HomeScreen

  // User preferences & location
  preferences: '@guidance_preferences',
  location: '@guidance_location',

  // Onboarding
  onboarding: '@onboarding_complete',
  guestSession: '@guest_session_active',
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

// Streak lengths that surface a one-time celebratory banner on Home (spec §8
// streak_milestone peak). Sorted ascending — useHomeData celebrates each one
// exactly once per install, tracked via streakMilestoneStore.
export const STREAK_MILESTONES = [7, 30, 100] as const;

// NOTE: a hardcoded MOOD_COLORS map used to live here, unexported and unused,
// behind a comment claiming it was kept aligned with DesignSystem. It was not —
// it still held the pre-2026-07-26 greys for Sad, Tired and Guilty. Removed
// rather than corrected: LibraryScreen and QuranLibraryScreen already derive
// their palettes from MoodColors directly, which is the pattern to copy. Do not
// reintroduce a literal colour map here.

const MOOD_ISLAMIC_TERMS = {
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

const getMoodIslamicTerm = (mood: Mood): string => {
  return MOOD_ISLAMIC_TERMS[mood] || '';
};

/**
 * The six "heavy" moods. Historically these lifted the refresh limit entirely
 * (the mercy rule, spec §4), but that made 5 of the 8 home moods unlimited, so
 * since 2026-06-12 the per-window budget applies to every mood and this set is
 * no longer consulted by the refresh gate. What remains of the mercy ethos:
 * every mood's check-in verse is free each prayer window, and the limit is a
 * gentle resting point, never a hard paywall. Kept for tone/copy decisions.
 */
export const MERCY_MOODS: ReadonlySet<Mood> = new Set<Mood>([
  'Overwhelmed', // Tawakkul
  'Sad', // Sabr
  'Lonely', // Wasl
  'Guilty', // Tawbah — sacred; never gate repentance
  'Angry', // Ihsan
  'Tired', // Quwwah
]);

export const isMercyMood = (mood: Mood): boolean => MERCY_MOODS.has(mood);

const getMoodDisplay = (mood: Mood): string => {
  const term = getMoodIslamicTerm(mood);
  return term.charAt(0) + term.slice(1).toLowerCase();
};

const PRAYER_TIMES = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
} as const;

const ERROR_MESSAGES = {
  network: 'Network connection error. Please check your internet connection.',
  server: 'Server error. Please try again later.',
  auth: 'Authentication error. Please sign in again.',
  unknown: 'Something did not work as expected. Please try again.',
} as const;

// Subscription price — the single display source (spec §7 "dynamic price").
// Placeholder values until Phase 3 wires real StoreKit/RevenueCat store-localized
// prices; the UI reads these via freemiumService.getPricing() so the swap is
// one place. trialDays is the peak-offered free trial (spec §6).
export const SUBSCRIPTION_PRICING = {
  monthlyUSD: 4.99,
  yearlyUSD: 39.99,
  trialDays: 7,
} as const;

// Legal links shown on the paywall (App Store Guideline 3.1.2 requires both to
// be reachable on any auto-renewable subscription screen). Fill these in with
// the hosted pages — the paywall hides a link whose URL is still empty.
export const LEGAL_URLS = {
  terms: 'https://ahmedbasolan.github.io/sakina-legal/terms.html',
  privacy: 'https://ahmedbasolan.github.io/sakina-legal/privacy.html',
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
