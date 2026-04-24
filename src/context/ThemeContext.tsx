import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Colors } from '../theme/DesignSystem';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface OnboardingThemeColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  surface: string;
  border: string;
  ctaBg: string;
  ctaText: string;
  iconBorder: string;
  iconBg: string;
  chipBg: string;
  chipBorder: string;
  revealOverlayBg: string;
}

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  onboardingColors: OnboardingThemeColors;
  onboardingGradients: [string, string, string][];
}

const THEME_STORAGE_KEY = '@app_theme_mode';

const darkOnboardingColors: OnboardingThemeColors = {
  textPrimary: '#F5EDE3',
  textSecondary: 'rgba(245, 237, 227, 0.72)',
  textMuted: 'rgba(245, 237, 227, 0.38)',
  surface: 'rgba(255, 245, 220, 0.06)',
  border: 'rgba(255, 245, 220, 0.08)',
  ctaBg: Colors.accent.primary,
  ctaText: '#14100C',
  iconBorder: 'rgba(212, 175, 55, 0.5)',
  iconBg: 'rgba(212, 175, 55, 0.08)',
  chipBg: 'rgba(255, 245, 220, 0.06)',
  chipBorder: 'rgba(255, 245, 220, 0.08)',
  revealOverlayBg: '#081912',
};

const lightOnboardingColors: OnboardingThemeColors = {
  textPrimary: '#1A1208',
  textSecondary: 'rgba(26, 18, 8, 0.72)',
  textMuted: 'rgba(26, 18, 8, 0.45)',
  surface: 'rgba(180, 140, 60, 0.07)',
  border: 'rgba(180, 140, 60, 0.14)',
  ctaBg: '#C49A2C',
  ctaText: '#FAF7F0',
  iconBorder: 'rgba(180, 140, 60, 0.45)',
  iconBg: 'rgba(180, 140, 60, 0.10)',
  chipBg: 'rgba(180, 140, 60, 0.06)',
  chipBorder: 'rgba(180, 140, 60, 0.12)',
  revealOverlayBg: '#E8F2EE',
};

const darkOnboardingGradients: [string, string, string][] = [
  ['#04090A', '#081912', '#04090A'],   // 1. Bismillah
  ['#07111E', '#0C1A2E', '#07111E'],   // 2. Welcome
  ['#07111E', '#0C1A2E', '#07111E'],   // 3. Heart Check-In
  ['#06080E', '#0D1525', '#06080E'],   // 4. Personalization
  ['#07111E', '#0C1A2E', '#07111E'],   // 5. First Guidance
  ['#0A0408', '#1E0A10', '#0A0408'],   // 6. Notification
  ['#04080F', '#09142A', '#04080F'],   // 7. Hold-to-Commit
  ['#050A10', '#0A1525', '#050A10'],   // 8. Paywall
];

const lightOnboardingGradients: [string, string, string][] = [
  ['#EFF5F1', '#E3EEE9', '#EFF5F1'],   // 1. Bismillah
  ['#EDF1F7', '#E0EAF5', '#EDF1F7'],   // 2. Welcome
  ['#EDF1F7', '#E0EAF5', '#EDF1F7'],   // 3. Heart Check-In
  ['#F0EDF7', '#EAE0F2', '#F0EDF7'],   // 4. Personalization
  ['#EDF1F7', '#E0EAF5', '#EDF1F7'],   // 5. First Guidance
  ['#F7EDEE', '#F2E0E2', '#F7EDEE'],   // 6. Notification
  ['#EEF1F7', '#E2EAF2', '#EEF1F7'],   // 7. Hold-to-Commit
  ['#EAF0F6', '#DFE8F1', '#EAF0F6'],   // 8. Paywall
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(
    Appearance.getColorScheme() === 'light' ? 'light' : 'dark',
  );

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeModeState(saved);
      }
    });

    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme === 'light' ? 'light' : 'dark');
    });
    return () => sub.remove();
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  const resolvedTheme: ResolvedTheme = themeMode === 'system' ? systemTheme : themeMode;

  const toggleTheme = useCallback(() => {
    setThemeMode(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setThemeMode]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        resolvedTheme,
        isDark: resolvedTheme === 'dark',
        setThemeMode,
        toggleTheme,
        onboardingColors: resolvedTheme === 'dark' ? darkOnboardingColors : lightOnboardingColors,
        onboardingGradients:
          resolvedTheme === 'dark' ? darkOnboardingGradients : lightOnboardingGradients,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}