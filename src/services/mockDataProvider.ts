import { Mood, GuidanceExperience, Content } from '../types';
import { sunnahContentData } from '../data/sunnahData';

export const createMockGuidanceExperience = (mood: Mood): GuidanceExperience => {
  const mockContent: Record<
    Mood,
    {
      primaryText: string;
      arabicText: string;
      transliteration: string;
      englishTranslation: string;
      source: string;
      audioKey?: string;
      whyThis: string;
    }
  > = {
    Anxious: {
      primaryText: 'Wa wajadaka dāllan fahadā',
      arabicText: 'وَوَجَدَكَ ضَالًّا فَهَدَىٰ ﴿٧﴾',
      transliteration: 'Wa wajadaka dāllan fahadā',
      englishTranslation: 'And He found you lost and guided [you]',
      source: 'Quran 93:7 (Ad-Duha)',
      audioKey: '93:7',
      whyThis:
        'Allah guides those who feel lost or anxious. Your anxiety is acknowledged, and guidance is promised.',
    },
    Sad: {
      primaryText: "Fa-inna ma'al-'usri yusrā",
      arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾',
      transliteration: "Fa-inna ma'al-'usri yusrā",
      englishTranslation: 'Indeed, with hardship comes ease',
      source: 'Quran 94:6 (Ash-Sharh)',
      audioKey: '94:6',
      whyThis:
        'Your sadness will be replaced with ease. Allah promises relief after every difficulty.',
    },
    Angry: {
      primaryText: "Wal-kādhimīnal-ghaidha wal-'āfīna 'anin-nās",
      arabicText: 'وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ ﴿١٣٤﴾',
      transliteration: "Wal-kādhimīnal-ghaidha wal-'āfīna 'anin-nās",
      englishTranslation: 'And those who control their anger and are forgiving of people',
      source: "Quran 3:134 (Ali 'Imran)",
      audioKey: '3:134',
      whyThis: 'Controlling anger and forgiving others are qualities of the righteous.',
    },
    Energized: {
      primaryText: "Wa 'ibādur-Rahmānilladhīna yamshūna 'alal-ardi hawnā",
      arabicText: 'وَعِبادُ الرَّحْمَٰنِ الَّذِينَ يَمْشُونَ عَلَى الْأَرْضِ هَوْنًا ﴿٦٣﴾',
      transliteration: "Wa 'ibādur-Rahmānilladhīna yamshūna 'alal-ardi hawnā",
      englishTranslation:
        'And the servants of the Most Merciful are those who walk upon the earth modestly',
      source: 'Quran 25:63 (Al-Furqan)',
      audioKey: '25:63',
      whyThis:
        "Maintain humility and vitality, remembering Allah's blessings in your energized state.",
    },
    Hopeful: {
      primaryText: 'Innallāha lā yughayyiru mā biqawmin hattā yughayyirū mā bi-anfusihim',
      arabicText:
        'إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ ﴿١١﴾',
      transliteration: 'Innallāha lā yughayyiru mā biqawmin hattā yughayyirū mā bi-anfusihim',
      englishTranslation:
        'Indeed, Allah will not change the condition of a people until they change what is in themselves',
      source: "Quran 13:11 (Ar-Ra'd)",
      audioKey: '13:11',
      whyThis: 'Your hope for change is valid when coupled with your own efforts to improve.',
    },
    Calm: {
      primaryText: "Alā bidhikrillāhi tatma'innul-qulūb",
      arabicText: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴿٢٨﴾',
      transliteration: "Alā bidhikrillāhi tatma'innul-qulūb",
      englishTranslation: 'Unquestionably, by the remembrance of Allah hearts are assured',
      source: "Quran 13:28 (Ar-Ra'd)",
      audioKey: '13:28',
      whyThis: 'Your calm state is enhanced through remembrance of Allah.',
    },
    Tired: {
      primaryText: "Wa ja'alnā nawmakum subātā",
      arabicText: 'وَجَعَلْنَا نَوْمَكُمْ سُبَاتًا ﴿٩﴾',
      transliteration: "Wa ja'alnā nawmakum subātā",
      englishTranslation: 'And We made your sleep [a means for] rest',
      source: 'Quran 78:9 (An-Naba)',
      audioKey: '78:9',
      whyThis: 'Allah created sleep as a mercy and a means for your body to recover.',
    },
    Stressed: {
      primaryText: "Allahumma inni a'udhu bika minal-hammi wal-hazan",
      arabicText: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ',
      transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan",
      englishTranslation: 'O Allah, I seek refuge in You from anxiety and sorrow',
      source: 'Prophetic Dua',
      whyThis: "Directly seeking Allah's protection from the weight of stress and worry.",
    },
    Grateful: {
      primaryText: "Wa in ta'uddū ni'matallāhi lā tuhsūhā",
      arabicText: 'وَإِن تَعُدُّوا نِعْمَةَ اللَّهِ لَا تُحْصُوهَا ﴿٣٤﴾',
      transliteration: "Wa in ta'uddū ni'matallāhi lā tuhsūhā",
      englishTranslation:
        'And if you should count the favors of Allah, you could not enumerate them',
      source: 'Quran 14:34 (Ibrahim)',
      audioKey: '14:34',
      whyThis:
        "Your gratitude opens the door to recognizing Allah's countless blessings in your life.",
    },
    Content: {
      primaryText: 'Radiyallahu anhu wa radu anhu',
      arabicText: 'رَّضِيَ اللَّهُ عَنْهُمْ وَرَضُوا عَنْهُ ﴿٨﴾',
      transliteration: 'Radiyallahu anhum wa radu anhu',
      englishTranslation: 'Allah is pleased with them and they are pleased with Him',
      source: 'Quran 98:8 (Al-Bayyinah)',
      audioKey: '98:8',
      whyThis: "Contentment is the highest state - being pleased with Allah's decree.",
    },
    Happy: {
      primaryText: 'Qul bifadlillāhi wa birahmatihī fabidhālika falyafrahu',
      arabicText: 'قُلْ بِفَضْلِ اللَّهِ وَبِرَحْمَتِهِ فَبِذَٰلِكَ فَلْيَفْرَحُوا ﴿٥٨﴾',
      transliteration: 'Qul bifadlillāhi wa birahmatihī fabidhālika falyafrahu',
      englishTranslation:
        'Say, "In the bounty of Allah and in His mercy - in that let them rejoice"',
      source: 'Quran 10:58 (Yunus)',
      audioKey: '10:58',
      whyThis:
        "Your happiness is a reflection of Allah's favor. Rejoice in His mercy and blessings.",
    },
  };

  const content = mood in mockContent ? mockContent[mood] : mockContent['Anxious'];

  // Find a relevant Sunnah Dua for this mood
  const relevantDuas = sunnahContentData.filter((d: Content) => d.moods.includes(mood));
  const sunnahDua = relevantDuas.length > 0
    ? relevantDuas[Math.floor(Math.random() * relevantDuas.length)]
    : null;

  return {
    content: {
      id: `mock_${mood}_${Date.now()}`,
      type: 'Quran',
      primaryText: content.primaryText,
      arabicText: content.arabicText,
      transliteration: content.transliteration,
      englishTranslation: content.englishTranslation,
      source: content.source,
      audioKey: content.audioKey,
      whyThis: content.whyThis,
      moods: [mood],
    },
    angle: {
      id: `mock_angle_${mood}_${Date.now()}`,
      contentId: `mock_${mood}_${Date.now()}`,
      mood: mood,
      angle: `Scholars of Tafsir emphasize that this guidance directly addresses your ${mood.toLowerCase()} state by rooting your heart in Allah's presence and His eternal promises.`,
      action: sunnahDua ? sunnahDua.primaryText : 'Take a moment to reflect on this verse',
      actionArabicText: sunnahDua?.arabicText,
      actionTransliteration: sunnahDua?.transliteration,
      actionHowTo: sunnahDua?.englishTranslation,
      actionReward: sunnahDua?.whyThis,
      actionSource: sunnahDua?.source,
      reflection: 'How does this guidance apply to your current situation?',
    },
  };
};
