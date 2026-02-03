/**
 * Quran.Foundation API Configuration
 *
 * This module handles environment-based API configuration.
 * Uses pre-production endpoint for testing, production for live app.
 */

// Environment configuration
const ENV = process.env.QURAN_API_ENV || 'test';

interface QuranAPIConfig {
  clientId: string;
  clientSecret: string;
  endpoint: string;
  isProduction: boolean;
}

// Test environment configuration
const testConfig: QuranAPIConfig = {
  clientId: process.env.QURAN_API_TEST_CLIENT_ID || '',
  clientSecret: process.env.QURAN_API_TEST_CLIENT_SECRET || '',
  endpoint: process.env.QURAN_API_TEST_ENDPOINT || 'https://prelive-oauth2.quran.foundation',
  isProduction: false,
};

// Production environment configuration
const productionConfig: QuranAPIConfig = {
  clientId: process.env.QURAN_API_CLIENT_ID || '',
  clientSecret: process.env.QURAN_API_CLIENT_SECRET || '',
  endpoint: process.env.QURAN_API_ENDPOINT || 'https://oauth2.quran.foundation',
  isProduction: true,
};

/**
 * Get the current API configuration based on environment
 */
export const getQuranAPIConfig = (): QuranAPIConfig => {
  return ENV === 'production' ? productionConfig : testConfig;
};

/**
 * Quran.com API endpoints (public, no auth required)
 */
export const QURAN_API_ENDPOINTS = {
  // Base URL for Quran.com public API
  BASE_URL: 'https://api.quran.com/api/v4',

  // Verses
  getVersesByChapter: (chapterId: number) => `/verses/by_chapter/${chapterId}`,
  getVerseByKey: (verseKey: string) => `/verses/by_key/${verseKey}`,
  getRandomVerse: () => '/verses/random',

  // Chapters (Surahs)
  getChapters: () => '/chapters',
  getChapter: (chapterId: number) => `/chapters/${chapterId}`,

  // Translations
  getTranslations: () => '/resources/translations',

  // Audio
  getRecitations: () => '/resources/recitations',
  getVerseAudio: (reciterId: number, verseKey: string) =>
    `/recitations/${reciterId}/by_ayah/${verseKey}`,
};

export default getQuranAPIConfig;
