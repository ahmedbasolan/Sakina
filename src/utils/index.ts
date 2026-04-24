import { Platform } from 'react-native';
import { Mood } from '../types';

// ── Date Utilities ──────────────────────────────────────────────────────
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

export const isToday = (timestamp: number): boolean => {
  const today = new Date();
  const date = new Date(timestamp);
  return today.toDateString() === date.toDateString();
};

export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
};

// ── Platform Utilities ───────────────────────────────────────────────────
export const getPlatformFont = (iosFont: string, androidFont: string): string => {
  return Platform.OS === 'ios' ? iosFont : androidFont;
};

export const getPlatformValue = <T>(iosValue: T, androidValue: T): T => {
  return Platform.OS === 'ios' ? iosValue : androidValue;
};

// ── Mood Utilities ───────────────────────────────────────────────────────
export const getMoodColor = (mood: Mood): string => {
  const colors: Record<Mood, string> = {
    Overwhelmed: '#E87C5F',
    Sad: '#6B8EBF',
    Angry: '#E85F5F',
    Tired: '#9CA3AF',
    Lonely: '#F59E0B',
    Grateful: '#4ADE80',
    Hopeful: '#6BCB77',
    Guilty: '#DC2626',
    Calm: '#2ED3C6',
  };
  return colors[mood] || '#2ED3C6';
};

export const getMoodIcon = (mood: Mood): string => {
  const icons: Record<Mood, string> = {
    Overwhelmed: 'weather-windy',
    Sad: 'weather-rainy',
    Angry: 'fire',
    Tired: 'battery-low',
    Lonely: 'heart-outline',
    Grateful: 'flower-tulip',
    Hopeful: 'sprout',
    Guilty: 'alert-circle',
    Calm: 'weather-sunny',
  };
  return icons[mood] || 'heart-outline';
};

export const getMoodLabel = (mood: Mood): string => {
  const labels: Record<Mood, string> = {
    Overwhelmed: 'OVERWHELMED',
    Sad: 'SAD',
    Angry: 'ANGRY',
    Tired: 'TIRED',
    Lonely: 'LONELY',
    Grateful: 'GRATEFUL',
    Hopeful: 'HOPEFUL',
    Guilty: 'GUILTY',
    Calm: 'CALM',
  };
  return labels[mood] || mood.toUpperCase();
};

// ── Validation Utilities ─────────────────────────────────────────────────
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const isEmpty = (value: any): boolean => {
  return value === null || value === undefined || value === '';
};

// ── String Utilities ─────────────────────────────────────────────────────
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
};

export const removeSpecialChars = (str: string): string => {
  return str.replace(/[^a-zA-Z0-9 ]/g, '');
};

// ── Array Utilities ───────────────────────────────────────────────────────
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const groupBy = <T, K extends keyof any>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const group = key(item);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

// ── Number Utilities ─────────────────────────────────────────────────────
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const randomBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const roundTo = (value: number, decimals: number): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// ── Async Utilities ────────────────────────────────────────────────────────
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < attempts - 1) {
        await delay(delayMs * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  
  throw lastError!;
};

export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
};

// ── Storage Utilities ───────────────────────────────────────────────────
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  async remove(key: string): Promise<boolean> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
};
