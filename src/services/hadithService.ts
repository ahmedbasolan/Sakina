import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { formatDateYMD } from '../utils/date';

const SUNNAH_API_KEY = process.env.EXPO_PUBLIC_SUNNAH_API_KEY || Constants.expoConfig?.extra?.sunnahApiKey;
const STORAGE_KEY = '@daily_hadith';
const CACHE_DATE_KEY = '@daily_hadith_date';

export interface HadithContent {
  arabic: string;
  translation: string;
  reference: string;
  source: string;
}

/**
 * Fallback Hadith collection in case the API is down or key is missing.
 */
const FALLBACK_HADITHS: HadithContent[] = [
  {
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
    translation: 'Actions are but by intentions.',
    reference: 'Hadith 1',
    source: 'Sahih al-Bukhari',
  },
  {
    arabic: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
    translation: 'A Muslim is the one from whose tongue and hands the Muslims are safe.',
    reference: 'Hadith 10',
    source: 'Sahih al-Bukhari',
  },
  {
    arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    translation: 'The best among you (Muslims) are those who learn the Quran and teach it.',
    reference: 'Hadith 5027',
    source: 'Sahih al-Bukhari',
  }
];

export async function getDailyHadith(): Promise<HadithContent> {
  // Local calendar date, not UTC — otherwise users ahead/behind UTC see
  // "today's" hadith flip hours off from their actual local midnight
  // (the same bug class already fixed via formatDateYMD() elsewhere).
  const today = formatDateYMD();

  try {
    const cachedDate = await AsyncStorage.getItem(CACHE_DATE_KEY);
    const cachedHadithStr = await AsyncStorage.getItem(STORAGE_KEY);
    
    if (cachedDate === today && cachedHadithStr) {
      return JSON.parse(cachedHadithStr);
    }
  } catch (e) {
    console.warn('Failed to read cached hadith', e);
  }

  // Attempt to fetch from Sunnah API
  if (SUNNAH_API_KEY) {
    try {
      // Fetching a random hadith from Bukhari (Book 1) as an example.
      // Adjust endpoints based on the actual Sunnah.com API documentation.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch('https://sunnah.com/api/v2/collections/bukhari/books/1/hadiths?limit=10', {
        headers: {
          'x-api-key': SUNNAH_API_KEY,
          'Accept': 'application/json'
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
      
      if (response.ok) {
        const data = await response.json();
        // Just pick a random one from the limit=10 results for daily variety
        const randomIndex = Math.floor(Math.random() * data.data.length);
        const hadith = data.data[randomIndex];
        
        const arabicText = hadith.hadith.find((h: any) => h.lang === 'ar')?.body || '';
        const englishText = hadith.hadith.find((h: any) => h.lang === 'en')?.body || '';
        
        // Strip basic HTML tags from english text if present
        const cleanEnglishText = englishText.replace(/<[^>]*>?/gm, '').trim();
        
        const newHadith: HadithContent = {
          arabic: arabicText,
          translation: cleanEnglishText,
          reference: `Hadith ${hadith.hadithNumber}`,
          source: 'Sahih al-Bukhari'
        };

        if (newHadith.arabic && newHadith.translation) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHadith));
          await AsyncStorage.setItem(CACHE_DATE_KEY, today);
          return newHadith;
        }
      } else {
        console.warn('Sunnah API returned:', response.status);
      }
    } catch (e) {
      console.warn('Failed to fetch from Sunnah API', e);
    }
  }

  // Fallback if no API key or API fails
  const index = Math.floor(Math.random() * FALLBACK_HADITHS.length);
  const fallback = FALLBACK_HADITHS[index];
  
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    await AsyncStorage.setItem(CACHE_DATE_KEY, today);
  } catch (_e) {
    // Ignore
  }
  
  return fallback;
}
