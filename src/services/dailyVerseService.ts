/**
 * Daily Verse Service
 *
 * Selects a different verse each day from a curated pool.
 * Uses date-based deterministic selection with a history buffer
 * to prevent repeats within a 30-day window.
 *
 * The verse changes at midnight local time.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@daily_verse';
const HISTORY_KEY = '@daily_verse_history';
const HISTORY_WINDOW = 30; // Don't repeat within 30 days

export interface DailyVerse {
  arabic: string;
  translation: string;
  ref: string;
  dateKey: string; // YYYY-MM-DD
}

// Curated pool of verses that work as standalone daily inspiration.
// Each has: arabic text, readable English, and a short reference.
// These are universal in appeal — not mood-specific or mid-story.
const VERSE_POOL: Omit<DailyVerse, 'dateKey'>[] = [
  {
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translation: 'Verily, in the remembrance of Allah do hearts find rest.',
    ref: "Ar-Ra'd 13:28",
  },
  {
    arabic: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا إِنَّ مَعَ ٱلْعُسْرِ يُسْرًۭا',
    translation: 'So indeed, with hardship comes ease. Indeed, with hardship comes ease.',
    ref: 'Ash-Sharh 94:5-6',
  },
  {
    arabic: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ',
    translation: 'And your Lord will give you, and you will be satisfied.',
    ref: 'Ad-Duha 93:5',
  },
  {
    arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    translation: 'Whoever puts their trust in Allah — He will be enough for them.',
    ref: 'At-Talaq 65:3',
  },
  {
    arabic: 'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ',
    translation: 'And We are closer to him than his jugular vein.',
    ref: 'Qaf 50:16',
  },
  {
    arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    translation: 'Indeed, Allah is with those who are patient.',
    ref: 'Al-Baqarah 2:153',
  },
  {
    arabic: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ',
    translation: 'And when My servants ask you about Me — indeed I am near.',
    ref: 'Al-Baqarah 2:186',
  },
  {
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    translation: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
    ref: 'Al-Baqarah 2:201',
  },
  {
    arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    translation: 'Allah does not burden a soul beyond what it can bear.',
    ref: 'Al-Baqarah 2:286',
  },
  {
    arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً',
    translation: 'Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself.',
    ref: 'Aal-Imran 3:8',
  },
  {
    arabic: 'وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا',
    translation: 'And hold firmly to the rope of Allah, all together, and do not become divided.',
    ref: 'Aal-Imran 3:103',
  },
  {
    arabic: 'وَاللَّهُ يُحِبُّ الصَّابِرِينَ',
    translation: 'And Allah loves those who are patient.',
    ref: 'Aal-Imran 3:146',
  },
  {
    arabic: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ',
    translation: 'Do not weaken, and do not grieve — for you will have the upper hand, if you are believers.',
    ref: 'Aal-Imran 3:139',
  },
  {
    arabic: 'إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ',
    translation: 'Indeed, Allah does not let the reward of those who do good go to waste.',
    ref: 'Hud 11:115',
  },
  {
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    translation: 'So remember Me, and I will remember you. Be grateful to Me and do not deny Me.',
    ref: 'Al-Baqarah 2:152',
  },
  {
    arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'Indeed, with hardship comes ease.',
    ref: 'Ash-Sharh 94:6',
  },
  {
    arabic: 'وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ',
    translation: 'And the Hereafter is better for you than the present life.',
    ref: 'Ad-Duha 93:4',
  },
  {
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
    translation: 'My Lord, expand for me my chest, and ease for me my task.',
    ref: 'Ta-Ha 20:25-26',
  },
  {
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    translation: 'Allah is sufficient for us, and He is the best Disposer of affairs.',
    ref: 'Aal-Imran 3:173',
  },
  {
    arabic: 'وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ وَسَبِّحْ بِحَمْدِهِ',
    translation: 'Put your trust in the Ever-Living who never dies, and glorify Him with praise.',
    ref: 'Al-Furqan 25:58',
  },
  {
    arabic: 'إِنَّ رَحْمَتَ اللَّهِ قَرِيبٌ مِّنَ الْمُحْسِنِينَ',
    translation: 'Indeed, the mercy of Allah is near to those who do good.',
    ref: 'Al-A\'raf 7:56',
  },
  {
    arabic: 'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ',
    translation: 'And He is with you wherever you are.',
    ref: 'Al-Hadid 57:4',
  },
  {
    arabic: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
    translation: 'Say: "O My servants who have transgressed against themselves, do not despair of the mercy of Allah."',
    ref: 'Az-Zumar 39:53',
  },
  {
    arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
    translation: 'Whoever is mindful of Allah, He will make a way out for them.',
    ref: 'At-Talaq 65:2',
  },
  {
    arabic: 'إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ',
    translation: 'Indeed, Allah loves those who constantly repent and those who purify themselves.',
    ref: 'Al-Baqarah 2:222',
  },
  {
    arabic: 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ',
    translation: 'My success is only through Allah. In Him I trust, and to Him I turn.',
    ref: 'Hud 11:88',
  },
  {
    arabic: 'وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ إِنَّهُ لَا يَيْأَسُ مِن رَّوْحِ اللَّهِ إِلَّا الْقَوْمُ الْكَافِرُونَ',
    translation: 'Do not despair of the mercy of Allah; indeed, none despairs of Allah\'s mercy except those who disbelieve.',
    ref: 'Yusuf 12:87',
  },
  {
    arabic: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ',
    translation: 'And We have made the Quran easy to remember — so is there anyone who will be mindful?',
    ref: 'Al-Qamar 54:17',
  },
  {
    arabic: 'ادْعُونِي أَسْتَجِبْ لَكُمْ',
    translation: 'Call upon Me; I will respond to you.',
    ref: 'Ghafir 40:60',
  },
  {
    arabic: 'وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ',
    translation: 'And My mercy encompasses all things.',
    ref: 'Al-A\'raf 7:156',
  },
  {
    arabic: 'إِنَّ اللَّهَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    translation: 'Indeed, Allah has power over all things.',
    ref: 'Al-Baqarah 2:20',
  },
  {
    arabic: 'وَمَنْ أَحْسَنُ قَوْلًا مِّمَّن دَعَا إِلَى اللَّهِ وَعَمِلَ صَالِحًا',
    translation: 'And who is better in speech than one who calls to Allah and does righteous deeds?',
    ref: 'Fussilat 41:33',
  },
  {
    arabic: 'إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ سَيَجْعَلُ لَهُمُ الرَّحْمَٰنُ وُدًّا',
    translation: 'Indeed, those who believe and do righteous deeds — the Most Merciful will appoint for them love.',
    ref: 'Maryam 19:96',
  },
  {
    arabic: 'وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ',
    translation: 'And We send down of the Quran that which is a healing and a mercy for the believers.',
    ref: 'Al-Isra 17:82',
  },
  {
    arabic: 'وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ',
    translation: 'And be patient, for indeed Allah does not let the reward of the doers of good go to waste.',
    ref: 'Hud 11:115',
  },
  {
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ اللَّهُ الصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
    translation: 'Say: "He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there any equivalent to Him."',
    ref: 'Al-Ikhlas 112:1-4',
  },
  {
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',
    translation: 'O you who believe, seek help through patience and prayer.',
    ref: 'Al-Baqarah 2:153',
  },
  {
    arabic: 'وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ وَالْجُوعِ وَنَقْصٍ مِّنَ الْأَمْوَالِ وَالْأَنفُسِ وَالثَّمَرَاتِ وَبَشِّرِ الصَّابِرِينَ',
    translation: 'And We will surely test you with something of fear and hunger and loss of wealth and lives and fruits — but give glad tidings to the patient.',
    ref: 'Al-Baqarah 2:155',
  },
  {
    arabic: 'فَإِنَّ ذِكْرَى تَنفَعُ الْمُؤْمِنِينَ',
    translation: 'And remind, for indeed the reminder benefits the believers.',
    ref: 'Adh-Dhariyat 51:55',
  },
  {
    arabic: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا',
    translation: 'Our Lord, pour upon us patience and plant our feet firmly.',
    ref: 'Al-Baqarah 2:250',
  },
  {
    arabic: 'وَلَا تَمْشِ فِي الْأَرْضِ مَرَحًا إِنَّ اللَّهَ لَا يُحِبُّ كُلَّ مُخْتَالٍ فَخُورٍ',
    translation: 'And do not walk upon the earth arrogantly; indeed, Allah does not like the self-conceited and boastful.',
    ref: 'Luqman 31:18',
  },
  {
    arabic: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    translation: 'And say: "My Lord, increase me in knowledge."',
    ref: 'Ta-Ha 20:114',
  },
  {
    arabic: 'إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ',
    translation: 'Indeed, Allah and His angels send blessings upon the Prophet.',
    ref: 'Al-Ahzab 33:56',
  },
  {
    arabic: 'يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا',
    translation: 'O humanity, We created you from a male and female and made you into nations and tribes so that you may know one another.',
    ref: 'Al-Hujurat 49:13',
  },
  {
    arabic: 'إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ',
    translation: 'Indeed, the most noble of you in the sight of Allah is the most righteous of you.',
    ref: 'Al-Hujurat 49:13',
  },
  {
    arabic: 'وَإِن تَعُدُّوا نِعْمَةَ اللَّهِ لَا تُحْصُوهَا',
    translation: 'And if you tried to count the blessings of Allah, you could never number them.',
    ref: 'Ibrahim 14:34',
  },
  {
    arabic: 'يُرِيدُ اللَّهُ بِكُمُ الْيُسْرَ وَلَا يُرِيدُ بِكُمُ الْعُسْرَ',
    translation: 'Allah intends ease for you and does not intend hardship for you.',
    ref: 'Al-Baqarah 2:185',
  },
  {
    arabic: 'كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ',
    translation: 'Fasting has been prescribed for you, as it was prescribed for those before you, so that you may attain righteousness.',
    ref: 'Al-Baqarah 2:183',
  },
  {
    arabic: 'وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا',
    translation: 'And your Lord has decreed that you worship none but Him, and that you be kind to your parents.',
    ref: 'Al-Isra 17:23',
  },
  {
    arabic: 'سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ',
    translation: 'It is peace until the rising of the dawn.',
    ref: 'Al-Qadr 97:5',
  },
  {
    arabic: 'وَالْعَصْرِ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ',
    translation: 'By time, indeed mankind is in loss — except for those who believe, do good deeds, urge one another to truth, and urge one another to patience.',
    ref: 'Al-Asr 103:1-3',
  },
  {
    arabic: 'وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ',
    translation: 'I did not create the jinn and mankind except to worship Me.',
    ref: 'Adh-Dhariyat 51:56',
  },
  {
    arabic: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    translation: 'My Lord, have mercy upon them as they raised me when I was small.',
    ref: 'Al-Isra 17:24',
  },
  {
    arabic: 'إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ',
    translation: 'Indeed, Allah will not change the condition of a people until they change what is in themselves.',
    ref: "Ar-Ra'd 13:11",
  },
  {
    arabic: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
    translation: 'So which of the favors of your Lord would you deny?',
    ref: 'Ar-Rahman 55:13',
  },
  {
    arabic: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ',
    translation: 'Read in the name of your Lord who created.',
    ref: 'Al-Alaq 96:1',
  },
  {
    arabic: 'وَلَقَدْ خَلَقْنَا الْإِنسَانَ وَنَعْلَمُ مَا تُوَسْوِسُ بِهِ نَفْسُهُ',
    translation: 'And We have already created man and know what his soul whispers to him.',
    ref: 'Qaf 50:16',
  },
  {
    arabic: 'كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ ثُمَّ إِلَيْنَا تُرْجَعُونَ',
    translation: 'Every soul will taste death. Then to Us you will be returned.',
    ref: 'Al-Ankabut 29:57',
  },
  {
    arabic: 'وَاسْتَغْفِرُوا رَبَّكُمْ ثُمَّ تُوبُوا إِلَيْهِ إِنَّ رَبِّي رَحِيمٌ وَدُودٌ',
    translation: 'Seek forgiveness of your Lord and repent to Him; indeed, my Lord is Merciful and Loving.',
    ref: 'Hud 11:90',
  },
];

const POOL_SIZE = VERSE_POOL.length;

/**
 * Simple deterministic hash from a date string.
 * Produces a number we can modulo against the pool size.
 */
function dateHash(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = ((hash << 5) - hash + dateKey.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Get today's date key in YYYY-MM-DD format (local timezone).
 */
function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Load the recent history of shown verse indices.
 */
async function loadHistory(): Promise<{ dateKey: string; index: number }[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fresh start */ }
  return [];
}

/**
 * Save updated history, trimming to the window size.
 */
async function saveHistory(history: { dateKey: string; index: number }[]): Promise<void> {
  const trimmed = history.slice(-HISTORY_WINDOW);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

/**
 * Select today's verse index, avoiding recent history.
 */
function selectVerseIndex(dateKey: string, recentIndices: Set<number>): number {
  const base = dateHash(dateKey) % POOL_SIZE;

  // If base hasn't been shown recently, use it
  if (!recentIndices.has(base)) return base;

  // Walk forward to find the next unused index
  for (let offset = 1; offset < POOL_SIZE; offset++) {
    const candidate = (base + offset) % POOL_SIZE;
    if (!recentIndices.has(candidate)) return candidate;
  }

  // Fallback (all shown — shouldn't happen with 60+ verses and 30-day window)
  return base;
}

/**
 * Get today's verse of the day.
 * Returns cached result if already computed today.
 */
export async function getDailyVerse(): Promise<DailyVerse> {
  const today = todayKey();

  // Check cache first
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed: DailyVerse = JSON.parse(cached);
      if (parsed.dateKey === today) return parsed;
    }
  } catch { /* recompute */ }

  // Load history and select
  const history = await loadHistory();
  const recentIndices = new Set(history.map((h) => h.index));
  const index = selectVerseIndex(today, recentIndices);
  const verse: DailyVerse = { ...VERSE_POOL[index], dateKey: today };

  // Persist
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(verse));
  await saveHistory([...history, { dateKey: today, index }]);

  return verse;
}

/**
 * Synchronous fallback for initial render before async loads.
 * Uses only the date hash (no history check).
 */
export function getDailyVerseSync(): DailyVerse {
  const today = todayKey();
  const index = dateHash(today) % POOL_SIZE;
  return { ...VERSE_POOL[index], dateKey: today };
}
