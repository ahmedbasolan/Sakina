import React, { createContext, useContext, useState, useEffect } from 'react';
import { RotationEngine } from '../services/rotationEngine';
import { FreemiumService } from '../services/freemiumService';
import { Mood, GuidanceExperience } from '../types';

interface AppContextType {
  rotationEngine: RotationEngine;
  freemiumService: FreemiumService;
  selectedMood: Mood | null;
  setSelectedMood: (mood: Mood | null) => void;
  currentExperience: GuidanceExperience | null;
  setCurrentExperience: (experience: GuidanceExperience | null) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [rotationEngine] = useState(() => new RotationEngine());
  const [freemiumService] = useState(() => FreemiumService.getInstance());
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [currentExperience, setCurrentExperience] = useState<GuidanceExperience | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await freemiumService.initialize();
      setIsLoading(false);
    };
    init();
  }, []);

  return (
    <AppContext.Provider
      value={{
        rotationEngine,
        freemiumService,
        selectedMood,
        setSelectedMood,
        currentExperience,
        setCurrentExperience,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
