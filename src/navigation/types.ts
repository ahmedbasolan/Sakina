import { Mood, GuidanceExperience, SpiritualPath, PathStep, UserPathProgress } from '../types';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  SpiritualWindow: {
    context: string;
  };
  Guidance: {
    experience?: GuidanceExperience;
    mood: Mood;
    islamicTerm?: string;
  };
  PathDetail: {
    pathId: string;
  };
  PathStep: {
    path: SpiritualPath;
    step: PathStep;
    userProgress: UserPathProgress;
    guidanceExperience: GuidanceExperience;
  };
  DailyReminders: undefined;
  MoodHistory: undefined;
  MoodSelection: undefined;
  PrayerTimes: undefined;
  QuranLibrary: { surahNumber?: number } | undefined;
  SurahReader: { surahNumber: number; surahName: string; surahArabic: string; verseCount: number };
  Settings: undefined;
  Support: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Journeys: undefined;
  Streak: undefined;
  Journal: undefined;
  Library: undefined;
};
