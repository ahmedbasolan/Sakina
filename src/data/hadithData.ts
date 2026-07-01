// src/data/hadithData.ts
import { Content } from '../types';

/**
 * VERIFICATION: Verified 2026-07-01 against sunnah.com via Apify browser scraping.
 * - Ibn Majah 224: chain Da'if Jaddan (sunnah.com note); matn authenticated by other narrations — grading kept 'hasan'
 * - Muslim 2699: Sahih ✓
 * - Bukhari 1: Sahih ✓
 * - Ibn Hibban (exact number unknown): dua well-known, cannot verify on sunnah.com without number
 * - Bukhari 6465 / Muslim 782: Sahih ✓
 * - Ibn Majah 925: Sahih (Darussalam) — corrected from 'hasan'
 * - Abu Dawud 4811: Sahih (Al-Albani) — corrected from 'hasan'
 * - Tirmidhi 2344: Hasan (Darussalam) ✓
 * - Bukhari 6369: Sahih ✓
 * - Muslim 2999: Sahih ✓
 * - Tirmidhi 2516: Hasan (Darussalam) — corrected from 'sahih'
 * - Muslim 2664: Sahih ✓
 * - hadith_results_7: replaced unverifiable "Ahmad (closing dua variant)" with Muslim 2999 (same matn, canonical source)
 */

export const hadithContent: Content[] = [
  // Path A: Study Journaling — Day 1
  {
    id: 'hadith_study_1',
    type: 'Hadith',
    primaryText: 'Seeking knowledge is an obligation upon every Muslim',
    arabicText: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ',
    translation: 'Seeking knowledge is an obligation upon every Muslim',
    englishTranslation: 'Seeking knowledge is an obligation upon every Muslim',
    source: 'Ibn Majah 224',
    transliteration: 'Talabul-ilmi fareedah ala kulli muslim',
    whyThis: 'Foundation for the path: knowledge-seeking is not optional but commanded.',
    propheticPractice: {
      description: 'Reflect on knowledge-seeking as a divine obligation',
      source: 'Ibn Majah 224',
      grading: 'hasan',
    },
    moods: [],
  },
  // Path A: Study Journaling — Day 2
  {
    id: 'hadith_study_2',
    type: 'Hadith',
    primaryText: 'Whoever treads a path seeking knowledge, Allah eases for him a path to Paradise',
    arabicText: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ',
    translation: 'Whoever treads a path seeking knowledge, Allah eases for him a path to Paradise',
    englishTranslation: 'Whoever treads a path seeking knowledge, Allah eases for him a path to Paradise',
    source: 'Muslim 2699',
    transliteration: 'Man salaka tareeqan yaltamis fihi ilman sahhal allahu lahu tareeqan ilal-jannah',
    whyThis: 'Direct support: pursuing learning connects to eternal reward.',
    propheticPractice: {
      description: 'Know that learning is rewarded in the Hereafter',
      source: 'Muslim 2699',
      grading: 'sahih',
    },
    moods: [],
  },
  // Path A: Study Journaling — Day 3
  {
    id: 'hadith_study_3',
    type: 'Hadith',
    primaryText: 'Actions are but by intentions',
    arabicText: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ',
    translation: 'Actions are but by intentions',
    englishTranslation: 'Actions are but by intentions',
    source: 'Bukhari 1',
    transliteration: 'Innama al-amalu bin-niyyat',
    whyThis: 'Core pivot: reset intention before studying, not for grade but for learning.',
    propheticPractice: {
      description: 'Reset your intention before studying',
      source: 'Bukhari 1',
      grading: 'sahih',
    },
    moods: [],
  },
  // Path A: Study Journaling — Day 4
  {
    id: 'hadith_study_4',
    type: 'Hadith',
    primaryText: 'O Allah, nothing is easy except what You make easy, and You make the difficult easy if You wish',
    arabicText: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا',
    translation: 'O Allah, nothing is easy except what You make easy, and You make the difficult easy if You wish',
    englishTranslation: 'O Allah, nothing is easy except what You make easy, and You make the difficult easy if You wish',
    source: 'Ibn Hibban (grading verification needed)',
    transliteration: 'Allahumma la sahla illa ma jaaltahu sahla',
    whyThis: 'Reframe hard topics as dependent on divine ease, not personal effort alone.',
    propheticPractice: {
      description: 'Recite this dua for difficult subjects',
      source: 'Ibn Hibban (grading verification needed)',
      grading: 'hasan',
    },
    moods: [],
  },
  // Path A: Study Journaling — Day 5
  {
    id: 'hadith_study_5',
    type: 'Hadith',
    primaryText: 'The most beloved deeds to Allah are the most consistent, even if small',
    arabicText: 'أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    translation: 'The most beloved deeds to Allah are the most consistent, even if small',
    englishTranslation: 'The most beloved deeds to Allah are the most consistent, even if small',
    source: 'Bukhari 6465 / Muslim 782',
    transliteration: 'Ahab al-amali ilallah adwamuha wa in qall',
    whyThis: 'Encourage routine over perfection: daily study beats sporadic cramming.',
    propheticPractice: {
      description: 'Build consistent daily study habits',
      source: 'Bukhari 6465 / Muslim 782',
      grading: 'sahih',
    },
    moods: [],
  },
  // Path A: Study Journaling — Day 6
  {
    id: 'hadith_study_6',
    type: 'Hadith',
    primaryText: 'O Allah, I ask You for beneficial knowledge',
    arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا',
    translation: 'O Allah, I ask You for beneficial knowledge',
    englishTranslation: 'O Allah, I ask You for beneficial knowledge',
    source: 'Ibn Majah 925',
    transliteration: 'Allahumma inni as aluka ilman nafi',
    whyThis: 'Release perfectionism: ask for utility, not perfection.',
    propheticPractice: {
      description: 'Make dua for beneficial knowledge',
      source: 'Ibn Majah 925',
      grading: 'sahih',
    },
    moods: [],
  },
  // Path A: Study Journaling — Day 7
  {
    id: 'hadith_study_7',
    type: 'Hadith',
    primaryText: 'He who does not thank people does not thank Allah',
    arabicText: 'مَنْ لَمْ يَشْكُرِ النَّاسَ لَمْ يَشْكُرِ اللَّهَ',
    translation: 'He who does not thank people does not thank Allah',
    englishTranslation: 'He who does not thank people does not thank Allah',
    source: 'Abu Dawud 4811',
    transliteration: 'Man lam yashkur an-nasa lam yashkur allah',
    whyThis: 'Closing gratitude: recognize teachers, peers, resources as gifts.',
    propheticPractice: {
      description: 'Express gratitude for teachers and resources',
      source: 'Abu Dawud 4811',
      grading: 'sahih',
    },
    moods: [],
  },

  // Path B: Trusting the Results — Day 1
  {
    id: 'hadith_results_1',
    type: 'Hadith',
    primaryText: 'If you were to rely upon Allah with true reliance, He would provide for you as He provides the birds',
    arabicText: 'لَوْ أَنَّكُمْ تَوَكَّلْتُمْ عَلَى اللَّهِ حَقَّ تَوَكُّلِهِ لَرَزَقَكُمْ كَمَا يَرْزُقُ الطَّيْرَ',
    translation: 'If you were to rely upon Allah with true reliance, He would provide for you as He provides the birds: they go out hungry in the morning and come back full in the evening',
    englishTranslation: 'If you were to rely upon Allah with true reliance, He would provide for you as He provides the birds: they go out hungry in the morning and come back full in the evening',
    source: 'Tirmidhi 2344',
    transliteration: 'Law annakum tawakkaltum ala allahi haqqa tawakkulihi larazaqakum kama turzaqu at-tayr',
    whyThis: 'Core tawakkul: preparation + divine reliance, not anxiety.',
    propheticPractice: {
      description: 'Practice tawakkul—reliance on Allah after doing your part',
      source: 'Tirmidhi 2344',
      grading: 'hasan',
    },
    moods: [],
  },
  // Path B: Trusting the Results — Day 2
  {
    id: 'hadith_results_2',
    type: 'Hadith',
    primaryText: 'Allahumma inni audhu bika min al-hammi wa-l-huzn',
    arabicText: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ',
    translation: 'O Allah, I seek refuge in You from anxiety and sorrow',
    englishTranslation: 'O Allah, I seek refuge in You from anxiety and sorrow',
    source: 'Bukhari 6369',
    transliteration: 'Allahumma inni audhu bika min al-hammi wa-l-huzn',
    whyThis: 'Practice: recite this dua before the exam to name and release anxiety.',
    propheticPractice: {
      description: 'Recite this anxiety-relief dua before exams',
      source: 'Bukhari 6369',
      grading: 'sahih',
    },
    moods: [],
  },
  // Path B: Trusting the Results — Day 3
  {
    id: 'hadith_results_3',
    type: 'Hadith',
    primaryText: 'Wondrous is the affair of the believer, it is all good for him',
    arabicText: 'عَجَبًا لِأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ',
    translation: 'Wondrous is the affair of the believer... if harm befalls him, he is patient, and that is good for him',
    englishTranslation: 'Wondrous is the affair of the believer... if harm befalls him, he is patient, and that is good for him',
    source: 'Muslim 2999',
    transliteration: 'Ajaban li-amr al-mumin inna amrahu kullu khair',
    whyThis: 'Sit with pre-exam fear as a real emotion; all outcomes serve divine wisdom.',
    propheticPractice: {
      description: 'Reflect on divine wisdom in all outcomes',
      source: 'Muslim 2999',
      grading: 'sahih',
    },
    moods: [],
  },
  // Path B: Trusting the Results — Day 4
  {
    id: 'hadith_results_4',
    type: 'Hadith',
    primaryText: 'Know that if the nation were to gather together to benefit you, they would not benefit you except with what Allah had already written for you',
    arabicText: 'اعْلَمْ أَنَّ الْأُمَّةَ لَوِ اجْتَمَعَتْ عَلَى أَنْ تَنْفَعَكَ بِشَيْءٍ',
    translation: 'Know that if the nation were to gather together to benefit you with anything, they would not benefit you except with what Allah had already written for you',
    englishTranslation: 'Know that if the nation were to gather together to benefit you with anything, they would not benefit you except with what Allah had already written for you',
    source: 'Tirmidhi 2516',
    transliteration: 'Ilam anna al-umma law ijtamaat ala an tanfaaka bi-shay',
    whyThis: 'Acceptance practice: your grade is written; focus only on what you control.',
    propheticPractice: {
      description: 'Accept divine decree and focus on your efforts',
      source: 'Tirmidhi 2516',
      grading: 'hasan',
    },
    moods: [],
  },
  // Path B: Trusting the Results — Day 5 (results day)
  {
    id: 'hadith_results_5',
    type: 'Hadith',
    primaryText: 'Wondrous is the affair of the believer, it is all good for him',
    arabicText: 'عَجَبًا لِأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ',
    translation: 'Wondrous is the affair of the believer, it is all good for him',
    englishTranslation: 'Wondrous is the affair of the believer, it is all good for him',
    source: 'Muslim 2999',
    transliteration: 'Ajaban li-amr al-mumin inna amrahu kullu khair',
    whyThis: 'Sit with waiting; all outcomes contain unseen good.',
    propheticPractice: {
      description: 'Wait patiently for results with trust in Allah',
      source: 'Muslim 2999',
      grading: 'sahih',
    },
    moods: [],
  },
  // Path B: Trusting the Results — Day 6
  {
    id: 'hadith_results_6',
    type: 'Hadith',
    primaryText: 'The strong believer is better and more beloved to Allah than the weak believer',
    arabicText: 'الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ',
    translation: 'The strong believer is better and more beloved to Allah than the weak believer... and do not be helpless',
    englishTranslation: 'The strong believer is better and more beloved to Allah than the weak believer... and do not be helpless',
    source: 'Muslim 2664',
    transliteration: 'Al-mumin al-qawi khayrun wa ahab ilallah min al-mumin ad-daif',
    whyThis: 'If result is good: gratitude and active next steps. If disappointing: resilience.',
    propheticPractice: {
      description: 'Build resilience and move forward with strength',
      source: 'Muslim 2664',
      grading: 'sahih',
    },
    moods: [],
  },
  // Path B: Trusting the Results — Day 7
  {
    id: 'hadith_results_7',
    type: 'Hadith',
    primaryText: 'Wondrous is the affair of the believer — if a calamity befalls him, he is patient, and that is good for him',
    arabicText: 'عَجَبًا لِأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ إِنْ أَصَابَتْهُ ضَرَّاءُ صَبَرَ فَكَانَ خَيْرًا لَهُ',
    translation: 'Wondrous is the affair of the believer — if a calamity befalls him, he is patient, and that is good for him',
    englishTranslation: 'Wondrous is the affair of the believer — if a calamity befalls him, he is patient, and that is good for him',
    source: 'Muslim 2999',
    transliteration: 'Ajaban li-amr al-mumin inna amrahu kulluhu khayr, in asabathu darrau sabara fa kana khayran lahu',
    whyThis: 'Sabr + next-step framing: accept and move forward.',
    propheticPractice: {
      description: 'Practice patience and acceptance with dignity',
      source: 'Muslim 2999',
      grading: 'sahih',
    },
    moods: [],
  },
];
