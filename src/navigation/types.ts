import { Mood, GuidanceExperience, SpiritualPath, PathStep, UserPathProgress } from '../types';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Login: undefined;
  SignUp: undefined;
  /** Only ever pushed by MainNavigator's isolated password-recovery stack —
   *  see AuthContext's `isPasswordRecovery`. Not reachable from anywhere in
   *  the normal signed-in/guest navigation graph. */
  ResetPassword: undefined;
  Guidance: {
    experience?: GuidanceExperience;
    mood: Mood;
    islamicTerm?: string;
    /** Friday's Surah Al-Kahf queue (verses 2-10) — advances for free, bypassing
     *  the mood-refresh gate, until exhausted; then falls through to normal guidance. */
    kahfQueue?: GuidanceExperience[];
    /** Open on the context layer (the reflection) rather than the verse. Set by a widget tap. */
    startLayer?: 'context';
  };
  PathDetail: {
    pathId: string;
    /** Open today's day straight away, once. Set by a widget tap. */
    openToday?: boolean;
  };
  PathStep: {
    path: SpiritualPath;
    step: PathStep;
    userProgress: UserPathProgress;
    guidanceExperience: GuidanceExperience;
  };
  DailyReminders: undefined;
  LockscreenVerses: undefined;
  MoodHistory: undefined;
  MoodSelection: undefined;
  PrayerTimes: undefined;
  QuranLibrary: { surahNumber?: number } | undefined;
  SurahReader: { surahNumber: number; surahName: string; surahArabic: string; verseCount: number };
  Settings: undefined;
  Support: undefined;
  /** `sakina://widget/<target>`: resolves the Home Screen widget's tap, then replaces itself. */
  WidgetLink: { target: string };
};

export type MainTabParamList = {
  Home: undefined;
  Journeys: undefined;
  Streak: undefined;
  Journal: undefined;
  Library: undefined;
};
