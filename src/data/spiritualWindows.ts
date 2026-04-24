import { PrayerContext } from '../types';

export interface SpiritualWindowStep {
  title: string;
  description: string;
  arabic?: string;
  transliteration?: string;
  translation?: string;
  source?: string;
}

export interface SpiritualWindowData {
  id: PrayerContext;
  title: string;
  themeColors: readonly [string, string, string];
  particleColor: string;
  particleType: 'stars' | 'dust' | 'mist';
  steps: SpiritualWindowStep[];
}

export const spiritualWindowsData: Record<string, SpiritualWindowData> = {
  fajr_pre: {
    id: 'fajr_pre',
    title: 'The Deep Night (Tahajjud)',
    themeColors: ['#050B14', '#0A1526', '#0F1B2E'],
    particleColor: '#FFFFFF',
    particleType: 'stars',
    steps: [
      {
        title: 'The Time of Descent',
        description: 'The world is completely asleep, but you are awake. In these final hours of the night, the Divine presence descends to the lowest heaven, asking: "Who is calling upon Me, that I may answer?"',
      },
      {
        title: 'A Moment of Istighfar',
        description: 'Before the dawn breaks, use this sacred tranquility to seek forgiveness. It honors the believers who "in the hours before dawn, ask for forgiveness".',
        arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
        transliteration: 'Astaghfirullahal-Adheem al-ladhi la ilaha illa Huw al-Hayyul-Qayyum wa atubu ilayh.',
        translation: 'I seek the forgiveness of Allah the Almighty, whom there is no deity except Him, the Ever-Living, the Sustainer, and I repent to Him.',
        source: 'Sunan at-Tirmidhi',
      },
      {
        title: 'Seal the Night',
        description: 'Take a deep breath. Release the burdens of yesterday. Let the purity of this hour wash over your heart before the Fajr adhan calls you to the new day.',
      }
    ]
  },
  fajr_post: {
    id: 'fajr_post',
    title: 'The Morning Light',
    themeColors: ['#1A2B4C', '#2A4365', '#3A5A84'], // Soft dawn
    particleColor: '#DDEEFE',
    particleType: 'mist',
    steps: [
      {
        title: 'A New Blank Page',
        description: 'The sun is rising, and with it, Allah has returned your soul to you and granted you another day to walk the earth. Everything is fresh, unwritten, and full of His mercy.',
      },
      {
        title: 'Morning Protection',
        description: 'The Prophet (ﷺ) would fortify his mornings with dhikr, establishing full reliance on Allah for whatever the day might bring.',
        arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
        transliteration: 'Bismillahil-ladhi la yadurru ma\'as-mihi shai\'un fil-ardi wa la fis-sama\'i, wa Huwas-Sami\'ul-\'Alim.',
        translation: 'In the Name of Allah with Whose Name there is protection against every kind of harm in the earth or in the heaven, and He is the All-Hearing and All-Knowing.',
        source: 'Sunan Abu Dawud',
      },
      {
        title: 'Your Daily Intention',
        description: 'Before the rush begins, silently set one pure intention for today. Let it anchor your actions.',
      }
    ]
  },
  dhuhr: {
    id: 'dhuhr',
    title: 'The High Zenith',
    themeColors: ['#1E3A5F', '#152C4A', '#0C1E36'], // Daylight blues
    particleColor: '#FFFFFF',
    particleType: 'dust',
    steps: [
      {
        title: 'The Midday Pause',
        description: 'The sun has passed its peak. The hustle of the world is at its loudest, but you have chosen to detach and return. This is the great pause.',
      },
      {
        title: 'Gratitude for the Seen and Unseen',
        description: 'Stop for a moment and reflect on a specific blessing right now that you often take for granted—your health, your safety, your very ability to breathe.',
        arabic: 'الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ',
        transliteration: 'Alhamdu lillahi hamdan kathiran tayyiban mubarakan fih.',
        translation: 'Praise be to Allah, an abundant, beautiful, and blessed praise.',
        source: 'Sahih Al-Bukhari',
      },
      {
        title: 'Returning to Focus',
        description: 'Breathe in slowly. Let the anxiety of work and duties fall away. You are standing before the Provider of all things.',
      }
    ]
  },
  asr: {
    id: 'asr',
    title: 'The Golden Hour',
    themeColors: ['#3A1F12', '#2B150A', '#1C0D05'], // Sunset/Golden
    particleColor: '#FFD700',
    particleType: 'dust',
    steps: [
      {
        title: 'The Fleeting Time',
        description: 'The shadows are lengthening. The day is quickly slipping away. Asr is the reminder of time\'s relentless passage—"By time, indeed mankind is in loss..."',
      },
      {
        title: 'Weighing the Day',
        description: 'Have your actions today moved you closer to Him or further away? Use these golden moments to seek refuge from a heart that is not humble.',
        arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عِلْمٍ لَا يَنْفَعُ، وَمِنْ قَلْبٍ لَا يَخْشَعُ، وَمِنْ نَفْسٍ لَا تَشْبَعُ، وَمِنْ دَعْوَةٍ لَا يُسْتَجَابُ لَهَا',
        transliteration: 'Allahumma inni a\'udhu bika min \'ilmin la yanfa\', wa min qalbin la yakhsha\', wa min nafsin la tashba\', wa min da\'watin la yustajabu laha.',
        translation: 'O Allah, I seek refuge in You from knowledge that does not benefit, from a heart that does not fear You, from a soul that is not satisfied, and from a prayer that is not answered.',
        source: 'Sahih Muslim',
      },
      {
        title: 'Make it Count',
        description: 'There is still time left in the day. How will you spend these final hours before the sun sets?',
      }
    ]
  },
  maghrib_pre: {
    id: 'maghrib_pre',
    title: 'The Approach of Night',
    themeColors: ['#2D1B2E', '#1D111E', '#0E080F'], // Dusk purples
    particleColor: '#FAD7A1',
    particleType: 'dust',
    steps: [
      {
        title: 'The Day Closes',
        description: 'The sun is about to dip below the horizon. The deeds of the day are being gathered and lifted up. It is a time of profound transition.',
      },
      {
        title: 'The Evening Adhkar',
        description: 'Welcome the approaching night with the words the Prophet (ﷺ) used to seal his days in complete surrender.',
        arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ لَا إِلَهَ إِلَّا اللَّهُ، وَحْدَهُ لَا شَرِيكَ لَهُ',
        transliteration: 'Amsayna wa amsal-mulku lillah, walhamdu lillah, la ilaha illallahu, wahdahu la sharika lah.',
        translation: 'We have reached the evening and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner.',
        source: 'Sahih Muslim',
      },
      {
        title: 'Letting Go',
        description: 'Exhale the frustrations of today. Whatever happened is now written. Enter the evening with a heart beautifully emptied of worldly grief.',
      }
    ]
  },
  maghrib_post: {
    id: 'maghrib_post',
    title: 'The Evening Glow',
    themeColors: ['#140E26', '#0E0A1A', '#080510'], // Deep twilight
    particleColor: '#ADD8E6',
    particleType: 'stars',
    steps: [
      {
        title: 'The Awwabin',
        description: 'This brief, quiet period between Maghrib and Isha is known as the time of the Awwabin—those who frequently return to Allah in repentance.',
      },
      {
        title: 'A Beautiful Remembrance',
        description: 'Fill the space between the prayers with His praise. A light on the tongue but heavy on the scales.',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
        transliteration: 'Subhan-Allahi wa bihamdihi, Subhan-Allahil-Azim.',
        translation: 'Glory be to Allah and His is the praise, (and) Allah, the Greatest is free from imperfection.',
        source: 'Sahih Al-Bukhari',
      },
      {
        title: 'Stillness',
        description: 'Allow the twilight to cool your thoughts. You have crossed safely into the night.',
      }
    ]
  },
  isha: {
    id: 'isha',
    title: 'The Peace of Night',
    themeColors: ['#0A0E17', '#060910', '#030509'], // Deep space
    particleColor: '#F0E6D3',
    particleType: 'stars',
    steps: [
      {
        title: 'The Veil of Rest',
        description: '"And We made the night as clothing, and We made the day for livelihood." (78:10-11) The universe is powering down. It is time to rest your body and your soul.',
      },
      {
        title: 'The Final Habit',
        description: 'Before sleep, emulate the beautiful sunnah of dusting the bed and placing your soul in His care. He is the one who keeps you breathing until dawn.',
        arabic: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا',
        transliteration: 'Bismika Rabbi wada\'tu janbi, wa bika arfa\'uh, fa\'in amsakta nafsi farhamha, wa in arsaltaha fahfazha.',
        translation: 'In Your name my Lord, I lie down and in Your name I rise, so if You should take my soul then have mercy upon it, and if You should return my soul then protect it.',
        source: 'Sahih Al-Bukhari',
      },
      {
        title: 'Complete Surrender',
        description: 'Forgive anyone who wronged you today. Ask forgiveness for the wrongs you committed. Close your eyes with a heart as pure as snow. Peace be upon you.',
      }
    ]
  }
};

export const defaultSpiritualWindow: SpiritualWindowData = {
  id: 'dhuhr' as PrayerContext,
  title: 'A Moment of Reflection',
  themeColors: ['#1E3A5F', '#152C4A', '#0C1E36'],
  particleColor: '#FFFFFF',
  particleType: 'dust',
  steps: [
    {
      title: 'The Great Pause',
      description: 'Take a step back from the world. You are currently in a spiritual window, a time dedicated to remembering your Creator.',
    },
    {
      title: 'A Simple Dhikr',
      description: 'Moisten your tongue with the remembrance of Allah.',
      arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
      transliteration: 'La ilaha illallah',
      translation: 'There is no deity worthy of worship except Allah.',
    },
    {
      title: 'Breathe',
      description: 'Let go of your anxieties and trust in the One who manages all affairs.',
    }
  ]
};
