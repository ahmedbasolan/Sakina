import { Platform } from 'react-native';
import { Mood } from '../types';

// ── Date Utilities ──────────────────────────────────────────────────────
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const isToday = (timestamp: number): boolean => {
  const today = new Date();
  const date = new Date(timestamp);
  return today.toDateString() === date.toDateString();
};

const getRelativeTime = (timestamp: number): string => {
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
const getPlatformFont = (iosFont: string, androidFont: string): string => {
  return Platform.OS === 'ios' ? iosFont : androidFont;
};

const getPlatformValue = <T>(iosValue: T, androidValue: T): T => {
  return Platform.OS === 'ios' ? iosValue : androidValue;
};

// ── Mood Utilities ───────────────────────────────────────────────────────
const getMoodIcon = (mood: Mood): string => {
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

const getMoodLabel = (mood: Mood): string => {
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

const isEmpty = (value: any): boolean => {
  return value === null || value === undefined || value === '';
};

// ── Quran Utilities ──────────────────────────────────────────────────────

/**
 * Extract a verse key (e.g. "2:255") from a source string like
 * "Surah Al-Baqarah 2:255" or "30:4-5".
 * Used to build audio URLs for Quranic recitation.
 */
export const extractVerseKey = (source: string): string => {
  const match = source.match(/(\d+):(\d+(?:-\d+)?)/);
  if (match) return `${match[1]}:${match[2]}`;
  return '';
};

// ── String Utilities ─────────────────────────────────────────────────────
const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
};

const removeSpecialChars = (str: string): string => {
  return str.replace(/[^a-zA-Z0-9 ]/g, '');
};

// ── Array Utilities ───────────────────────────────────────────────────────
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const groupBy = <T, K extends keyof any>(
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

const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

// ── Number Utilities ─────────────────────────────────────────────────────
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const randomBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const roundTo = (value: number, decimals: number): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// ── Async Utilities ────────────────────────────────────────────────────────
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const retry = async <T>(
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
  promise: PromiseLike<T>,
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
const storage = {
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
