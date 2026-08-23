// Centralized constants for the application
import { Mood } from '../types';

/**
 * Canonical display names for internal Mood ids. The stored id 'Calm' renders
 * as "Peaceful" (paired with Sakeenah) everywhere in the UI — never show the
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

  // Crisis helpline banner — stores the local "YYYY-MM-DD" it was last shown,
  // so it surfaces at most once per day instead of on every Sad/Overwhelmed
  // visit (see CrisisResourceLine.tsx).
  crisisLineLastShown: '@quietheart_crisis_line_last_shown',
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

// NOTE: there is deliberately no SUBSCRIPTION_PRICING constant here any more.
// It used to hold monthlyUSD 4.99 / yearlyUSD 39.99 as a "placeholder until
// StoreKit is wired", and freemiumService.getPricing() fell back to it whenever
// RevenueCat was offline or still loading — rendering "$39.99" to every user
// regardless of their storefront. Verified in App Store Connect on 2026-08-16,
// the live annual price is AU$59.99 in Australia, €44.99 in Austria and $49.99
// in Albania, so that fallback displayed a wrong price rather than an
// approximate one, next to a purchase button (App Store Guideline 3.1.2).
// Prices now come only from the store via revenueCat.getPricing(); when that
// is unavailable the paywall withholds the plan cards and CTA instead.
// Don't reintroduce a hardcoded price here.

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
