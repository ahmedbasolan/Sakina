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
import React, { createContext, useContext, useState, useEffect } from 'react';
import { RotationEngine } from '../services/rotationEngine';
import { FreemiumService } from '../services/freemiumService';
import { Mood, GuidanceExperience } from '../types';

/* ─── Services Context (stable — never causes re-renders on mood change) ── */

interface ServicesContextType {
  rotationEngine: RotationEngine;
  freemiumService: FreemiumService;
  isLoading: boolean;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const [rotationEngine] = useState(() => RotationEngine.getInstance());
  const [freemiumService] = useState(() => FreemiumService.getInstance());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    freemiumService.initialize().then(() => setIsLoading(false));
  }, []);

  return (
    <ServicesContext.Provider value={{ rotationEngine, freemiumService, isLoading }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices(): ServicesContextType {
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
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [currentExperience, setCurrentExperience] = useState<GuidanceExperience | null>(null);
  const [streakCount, setStreakCount] = useState(0);

  return (
    <SessionContext.Provider
      value={{ selectedMood, setSelectedMood, currentExperience, setCurrentExperience, streakCount, setStreakCount }}
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
  return { ...services, ...session };
}
