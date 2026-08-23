import { ImageSourcePropType } from 'react-native';

export type Mood =
  | 'Overwhelmed'
  | 'Sad'
  | 'Angry'
  | 'Tired'
  | 'Lonely'
  | 'Grateful'
  | 'Hopeful'
  | 'Guilty'
  | 'Calm';
export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionType = 'monthly' | 'yearly' | 'trial';

export type ContentType = 'Quran' | 'Hadith' | 'Dua' | 'Sunnah Practice' | 'Dhikr';

export type PrayerContext =
  | 'fajr_pre' // Before Fajr (Tahajjud)
  | 'fajr_post' // After Fajr (Morning Adhkar)
  | 'dhuhr' // Around Dhuhr
  | 'asr' // Around Asr
  | 'maghrib_pre' // Sunset/Evening Adhkar prep
  | 'maghrib_post' // After Maghrib
  | 'isha' // Night/Bedtime
  | 'general'; // Any time

// ─── Mood UI Config ────────────────────────────────────────────
// Single canonical definition — previously duplicated in HomeScreen,
// MoodButton, and SmartMoodGrid with no shared source.
export interface MoodConfig {
  id: Mood;
  label: string;
  sublabel: string;
  arabic: string;
  color: string;
  bgColor: string;
  borderColor: string;
  gradientColors: [string, string, string];
  iconName: string;
}

// ─── Content Authenticity Types ────────────────────────────────
// Hard gate: only these categories are allowed on the Guidance screen.
//
// The first four all carry a chain — a verse or a hadith. `composed_dua` does
// not, and exists precisely so that app-written supplications cannot masquerade
// as one that does. Before it existed, ~21 steps whose Arabic was written for
// this app shipped as 'quran_dua' under a "Surah X:Y — Quran" label, which told
// the reader they were reciting scripture. Anything without a transmitted chain
// must use `composed_dua` and must render as such (see SOURCE_TYPE_CONFIG in
// PracticeLayer) — never silently upgraded to one of the sourced categories.
export type PracticeSourceType =
  | 'quran_dua' // Du'a that appears verbatim in the Qur'an (cite verse)
  | 'prophetic_dua' // Ma'thūr du'a with hadith chain
  | 'prophetic_dhikr' // Dhikr with hadith chain
  | 'sunnah_action' // Action with explicit hadith or primary fiqh citation
  | 'composed_dua'; // Wording written for this app — no chain. Label it plainly.

export type HadithGrading = 'sahih' | 'hasan' | 'sahih_li_ghayrihi' | 'hasan_li_ghayrihi';

export interface Content {
  id: string;
  type: ContentType;
  primaryText: string;
  arabicText?: string;
  transliteration?: string;
  englishTranslation: string; // Detailed context/instruction
  translation?: string; // Literal translation of Arabic text
  source: string;
  whyThis: string;
  propheticPractice?: {
    description: string;
    source: string;
    grading?: string; // e.g., 'Sahih', 'Hasan'
  };
  optionalAction?: string;
  optionalReflection?: string;
  audioKey?: string; // Explicit key for audio playback (e.g., '2:255')
  repeatCount?: number; // Target repetitions for Dhikr/Practices
  difficulty?: 1 | 2 | 3; // 1: Quick, 2: Medium, 3: Deep
  whyThisWorks?: string; // Scholar/Hadith explanation for why the practice is effective
  moods: Mood[];
  moodScores?: Record<string, number>; // Optional custom relevance scores: { 'Anxious': 15, 'Calm': 20 }
  prayerContext?: PrayerContext[]; // Explicit time-of-day tagging
}

export interface ContentAngle {
  id: string;
  contentId: string;
  mood: Mood;
  angle: string; // Maps to "Prophetic Context"
  angleArabicText?: string;
  angleTransliteration?: string;
  angleSource?: string;
  action?: string;
  actionArabicText?: string;
  actionTransliteration?: string;
  actionTranslation?: string;
  actionSource?: string;
  actionHowTo?: string;
  actionReward?: string;
  actionAudioKey?: string;
  actionRepeatCount?: number; // Target repetitions for the specific action
  actionDifficulty?: 1 | 2 | 3;
  actionWhyThisWorks?: string;
  practiceSteps?: string; // JSON array of structured practice steps
  reflection?: string; // Maps to "Reflection Prompt"
  relevanceScore?: number; // From content_moods join — drives rotation scoring
  contentType?: ContentType;
  actionType?: ContentType;
  content?: Content;
}

export interface GuidanceExperience {
  content: Content;
  angle: ContentAngle;
}

export interface UserSession {
  id: string;
  date: string; // YYYY-MM-DD format
  guidanceSessionsUsed: number; // legacy (daily-session cap removed); retained for back-compat
  nextRefreshesRemaining: number;
  lastResetTime: number;
  windowKey?: string; // `${YYYY-MM-DD}:${PrayerContext}` — resets refreshes per prayer window
}

export interface FreemiumLimits {
  refreshesPerPrayerWindow: number;
  maxSavedItems: number;
  rotationHistoryDays: number;
}

export interface PaywallType {
  type: 'daily_limit' | 'refresh_limit' | 'saved_limit' | 'conversion_trigger';
  trigger?: 'after_next_refreshes' | 'after_daily_limit' | 'after_saved_limit' | 'after_7_days';
  remainingTime?: number; // hours until reset
  context?: string; // Additional context for the paywall
}

/**
 * A "peak" — a moment of positive affect/accomplishment where a single, gentle
 * upgrade ask may appear (spec §8). The upgrade ask NEVER appears in the comfort
 * flow; only at these peaks, gated by `freemiumService.shouldOfferUpgrade`.
 */
export type PeakContext =
  | 'journey_complete' // finished a journey
  | 'streak_milestone' // a consistency milestone (used gently)
  | 'theme_pick' // chose a background theme
  | 'support_screen' // the dedicated "Support Sakina" screen
  | 'positive_pause'; // the positive-mood resting point (at most one soft line)

export interface SubscriptionState {
  tier: SubscriptionTier;
  type?: SubscriptionType;
  trialEndDate?: number;
  subscriptionEndDate?: number;
  isActive: boolean;
  willRenew: boolean;
  unlockedBundleIds?: string[]; // IDs of purchased Special Edition bundles
}

export interface SpecialEditionBundle {
  id: string;
  name: string;
  description: string;
  priceUSD: number;
  priceAED: number;
  availableStart?: number; // timestamp
  availableEnd?: number; // timestamp
  includesPremiumTrial: boolean;
  includesPDF: boolean;
  includesAudio: boolean;
  isNiche?: boolean; // e.g. Hajj
}

/**
 * Emotional register of a journey. Drives the immersive step experience:
 * - 'refuge'   → calm, slow reveal, no streak pressure, "you showed up" framing
 * - 'momentum' → progress celebration, streak emphasis, "keep going" framing
 * Defaults from `theme` when unset (Sad/grief → refuge, Hopeful → momentum).
 */
export type PathTone = 'refuge' | 'momentum';

/**
 * A named segment of a longer journey. Lets the UI frame the horizon as the
 * current phase ("Week 1 — Foundations · Day 3 of 7") instead of an
 * overwhelming "Day 3 of 90" for long recovery/habit paths.
 */
export interface PathPhase {
  label: string; // e.g. "Week 1 — Foundations"
  startDay: number; // inclusive, 1-based
  endDay: number; // inclusive
}

export interface SpiritualPath {
  id: string;
  title: string;
  description: string;
  duration: number; // days
  theme: Mood; // Starting mood
  target: string; // Target spiritual state
  dailySteps: PathStep[];
  tone?: PathTone; // Emotional register (defaults from `theme`)
  phases?: PathPhase[]; // Optional chunking for long journeys
  isPremium?: boolean; // Included in subscription
  isSpecialEdition?: boolean; // Part of a one-time purchase bundle
  bundleId?: string; // Reference to SpecialEditionBundle
}

export interface PathStep {
  id: string;
  pathId: string;
  day: number;
  title: string;
  focus: string;
  contentId: string;
  angleId: string;
  isCompleted: boolean;
  completedAt?: number;
  hadithContentId?: string;
  /**
   * Surahs this day asks the user to LEARN, each rendered on its own layer
   * after the verse (see src/data/surahLessons.ts). Separate from contentId,
   * which is the single ayah the day's lesson is built on.
   */
  surahIds?: string[];
}

export interface UserPathProgress {
  pathId: string;
  currentDay: number;
  startDate: number;
  completedDays: number[];
  isCompleted: boolean;
  completedAt?: number;
}

export type LanguagePreference = 'english' | 'arabic';

/** Asr calculation school. 'standard' = Shafi'i/Maliki/Hanbali (shadow = 1x object
 * length, adhan.js/Aladhan default). 'hanafi' = shadow = 2x, giving a later Asr time. */
export type AsrMadhab = 'standard' | 'hanafi';

export interface UserPreferences {
  primaryLanguage: LanguagePreference;
  showTransliteration: boolean;
  /** Auto-play recitation when a verse opens. Opt-in (default false). */
  autoPlayAudio: boolean;
  /** Asr calculation school (see AsrMadhab). Default 'standard'. */
  asrMadhab: AsrMadhab;
}

export type BackgroundThemeCategory =
  | 'sky'
  | 'mountains'
  | 'nature'
  | 'landscapes'
  | 'ocean'
  | 'animals';

export interface BackgroundTheme {
  id: string;
  name: string;
  category: BackgroundThemeCategory;
  /** Local asset loaded via require(). */
  imageSource: ImageSourcePropType;
  isPremium: boolean;
}
