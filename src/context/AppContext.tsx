/**
 * AppContext — split into two focused contexts to prevent unnecessary re-renders.
 *
 * ServicesContext  → rotationEngine, freemiumService, isLoading
 *                    (stable references, initialised once)
 *
 * SessionContext   → selectedMood, currentExperience
 *                    (change on user interaction — isolated to avoid cascading renders)
 *
 * useAppContext()  → backward-compatible shim that merges both; existing call sites
 *                    don't need to change.
 */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RotationEngine } from '../services/rotationEngine';
import { FreemiumService } from '../services/freemiumService';
import { PreferencesService } from '../services/preferencesService';
import { prefetchAllSurahs } from '../services/quranService';
import { Mood, GuidanceExperience } from '../types';
import { TimeFormat } from '../services/prayerTimesService';

const TIME_FORMAT_KEY = '@prayer_time_format';

/* ─── Services Context (stable — never causes re-renders on mood change) ── */

interface ServicesContextType {
  rotationEngine: RotationEngine;
  freemiumService: FreemiumService;
  isLoading: boolean;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

function ServicesProvider({ children }: { children: React.ReactNode }) {
  const [rotationEngine] = useState(() => RotationEngine.getInstance());
  const [freemiumService] = useState(() => FreemiumService.getInstance());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // `finally` so a subscription/RC initialization failure can never leave
    // the app stuck on the loading state — free-tier defaults still work.
    freemiumService
      .initialize()
      .catch((error) => console.warn('[ServicesProvider] freemium init failed:', error))
      .finally(() => setIsLoading(false));

    // PreferencesService is a singleton with hardcoded in-memory defaults;
    // initialize() is what hydrates it from SQLite. Previously the ONLY call
    // site for that was useGuidanceLogic's mount effect — meaning every other
    // consumer that reads it synchronously (prayerTimesService.resolveAsrMadhab,
    // called by every prayer-time fetch app-wide, and SettingsScreen's own
    // focus effect) saw the hardcoded defaults instead of the user's saved
    // preferences for the whole session until Guidance happened to be opened.
    // Concretely: (1) Home's first prayer-time fetch always computed Asr with
    // the Shafi'i/standard method even for a user who'd saved Hanafi, and (2)
    // opening Settings before Guidance showed wrong toggle states, and — worse
    // — flipping any ONE toggle there wrote the whole (still-default) prefs
    // object back to SQLite, silently reverting every other previously-saved
    // preference. Loading it here, alongside the other services, starts the
    // hydration in the same render commit as useHomeData's own bootstrap
    // effect — nothing here actually sequences one before the other (isLoading
    // above is never consumed to gate rendering), so this narrows the race
    // from "arbitrarily long, until the user opens Guidance" down to roughly
    // one SQLite read's worth of milliseconds, not a hard guarantee.
    PreferencesService.getInstance()
      .initialize()
      .catch((error) => console.warn('[ServicesProvider] preferences init failed:', error));

    // Warm the offline Quran cache from app launch rather than waiting for
    // the user to open the Library tab — now a ~3-request bulk fetch (see
    // prefetchAllSurahs), so this finishes in the background well before
    // anyone would navigate there anyway. Fire-and-forget: prefetchAllSurahs
    // already no-ops if a fetch is in flight or everything's cached.
    prefetchAllSurahs().catch(() => {});
  }, []);

  return (
    <ServicesContext.Provider value={{ rotationEngine, freemiumService, isLoading }}>
      {children}
    </ServicesContext.Provider>
  );
}

function useServices(): ServicesContextType {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices must be used within ServicesProvider');
  return ctx;
}

/* ─── Session Context (changes on user interaction) ───────────────────── */

interface SessionContextType {
  selectedMood: Mood | null;
  setSelectedMood: (mood: Mood | null) => void;
  currentExperience: GuidanceExperience | null;
  setCurrentExperience: (experience: GuidanceExperience | null) => void;
  /** Current streak count — shared here so MainNavigator doesn't query SQLite directly. */
  streakCount: number;
  setStreakCount: (count: number) => void;
  /** Clock format for prayer times ("12h" | "24h") — persisted, shared across screens. */
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

function SessionProvider({ children }: { children: React.ReactNode }) {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [currentExperience, setCurrentExperience] = useState<GuidanceExperience | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('24h');

  // Load the persisted clock-format preference once on mount.
  useEffect(() => {
    AsyncStorage.getItem(TIME_FORMAT_KEY).then((v) => {
      if (v === '12h' || v === '24h') setTimeFormatState(v);
    });
  }, []);

  const setTimeFormat = (format: TimeFormat) => {
    setTimeFormatState(format);
    AsyncStorage.setItem(TIME_FORMAT_KEY, format).catch(() => {});
  };

  return (
    <SessionContext.Provider
      value={{ selectedMood, setSelectedMood, currentExperience, setCurrentExperience, streakCount, setStreakCount, timeFormat, setTimeFormat }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

/* ─── Combined provider ────────────────────────────────────────────────── */

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ServicesProvider>
      <SessionProvider>{children}</SessionProvider>
    </ServicesProvider>
  );
}

/* ─── Backward-compatible shim — existing useAppContext() calls unchanged ─ */

interface AppContextType extends ServicesContextType, SessionContextType {}

export function useAppContext(): AppContextType {
  const services = useServices();
  const session = useSession();
  return useMemo(() => ({ ...services, ...session }), [services, session]);
}
