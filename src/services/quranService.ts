/**
 * Quran.Foundation API Service
 *
 * Service for fetching Quranic content from quran.com public API.
 * Handles verses, chapters, translations, and audio.
 */

import { QURAN_API_ENDPOINTS } from './quranConfig';

const BASE_URL = QURAN_API_ENDPOINTS.BASE_URL;

// Types
export interface QuranVerse {
  id: number;
  verse_key: string;
  verse_number: number;
  text_uthmani: string; // Arabic text (Uthmani script)
  text_imlaei?: string; // Arabic text (Imlaei script)
  translations?: Translation[];
}

export interface Translation {
  id: number;
  resource_id: number;
  text: string;
}

export interface Chapter {
  id: number;
  name_arabic: string;
  name_simple: string;
  name_complex: string;
  revelation_place: 'makkah' | 'madinah';
  verses_count: number;
}

export interface QuranAPIResponse<T> {
  data: T;
  meta?: {
    current_page: number;
    total_pages: number;
    total_count: number;
  };
}

/**
 * Fetch helper with error handling
 */
async function fetchFromQuranAPI<T>(
  endpoint: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Quran API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a random verse with translation
 */
export async function getRandomVerse(translationId: number = 131): Promise<QuranVerse> {
  const response = await fetchFromQuranAPI<QuranAPIResponse<QuranVerse>>(
    QURAN_API_ENDPOINTS.getRandomVerse(),
    { translations: translationId },
  );
  return response.data;
}

/**
 * Get a specific verse by key (e.g., "2:255" for Ayat al-Kursi)
 */
export async function getVerseByKey(
  verseKey: string,
  translationId: number = 131,
): Promise<QuranVerse> {
  const response = await fetchFromQuranAPI<QuranAPIResponse<QuranVerse>>(
    QURAN_API_ENDPOINTS.getVerseByKey(verseKey),
    { translations: translationId },
  );
  return response.data;
}

/**
 * Get all verses from a chapter
 */
export async function getVersesByChapter(
  chapterId: number,
  translationId: number = 131,
  page: number = 1,
  perPage: number = 10,
): Promise<QuranAPIResponse<QuranVerse[]>> {
  return fetchFromQuranAPI<QuranAPIResponse<QuranVerse[]>>(
    QURAN_API_ENDPOINTS.getVersesByChapter(chapterId),
    {
      translations: translationId,
      page,
      per_page: perPage,
    },
  );
}

/**
 * Get all chapters (Surahs)
 */
export async function getChapters(): Promise<Chapter[]> {
  const response = await fetchFromQuranAPI<QuranAPIResponse<Chapter[]>>(
    QURAN_API_ENDPOINTS.getChapters(),
  );
  return response.data;
}

/**
 * Get a specific chapter by ID
 */
export async function getChapter(chapterId: number): Promise<Chapter> {
  const response = await fetchFromQuranAPI<QuranAPIResponse<Chapter>>(
    QURAN_API_ENDPOINTS.getChapter(chapterId),
  );
  return response.data;
}

/**
 * Get available translations
 */
export async function getAvailableTranslations(): Promise<
  { id: number; name: string; language_name: string }[]
> {
  const response = await fetchFromQuranAPI<
    QuranAPIResponse<{ id: number; name: string; language_name: string }[]>
  >(QURAN_API_ENDPOINTS.getTranslations());
  return response.data;
}

/**
 * Common translation IDs for quick reference
 */
export const TRANSLATION_IDS = {
  SAHIH_INTERNATIONAL: 131, // English - Sahih International
  CLEAR_QURAN: 85, // English - The Clear Quran
  PICKTHALL: 19, // English - Pickthall
  YUSUF_ALI: 22, // English - Yusuf Ali
  MUHSIN_KHAN: 20, // English - Muhsin Khan
  TAQI_USMANI: 84, // English - Taqi Usmani
};

/**
 * Mood-based verse recommendations
 * Maps moods to relevant Quranic verses
 */
export const MOOD_VERSES: Record<string, string[]> = {
  Anxious: [
    '93:4',
    '94:5-6',
    '2:286',
    '65:3',
    '3:173',
    '2:186',
    '3:159',
    '20:25',
    '40:44',
    '2:153',
  ],
  Sad: ['94:5-6', '93:3', '12:87', '39:53', '2:155-156', '41:30', '20:46'],
  Angry: ['3:134', '41:34', '7:199', '42:37', '16:126', '24:22', '42:43'],
  Grateful: ['14:7', '16:18', '31:12', '27:40', '2:152', '16:53'],
  Happy: ['10:58', '30:4-5', '3:170', '13:28', '89:27'],
  Hopeful: ['12:87', '65:2-3', '39:53', '2:216', '94:5-6', '41:30', '29:69'],
  Calm: ['13:28', '89:27', '2:45', '3:139', '48:4', '30:21', '9:51', '10:58'],
  Tired: ['2:286', '35:35', '94:7', '2:153'],
  Energized: ['94:7', '29:69', '3:139'],
  Content: ['13:28', '16:53', '10:58', '30:21'],
  Stressed: ['94:5-6', '2:286', '65:3', '20:25', '40:44', '8:33'],
};

export default {
  getRandomVerse,
  getVerseByKey,
  getVersesByChapter,
  getChapters,
  getChapter,
  getAvailableTranslations,
  TRANSLATION_IDS,
  MOOD_VERSES,
};
