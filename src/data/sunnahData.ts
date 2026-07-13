import { Content } from '../types';

/**
 * Comprehensive Prophetic Practices and Duas from Hisn al-Muslim
 * Mapped to specific moods to provide a full spiritual routine.
 * Ratings: 1: Quick (1 min) | 2: Medium (5 min) | 3: Deep (10+ min)
 *
 * Content standard: whyThis must quote directly from an authenticated
 * hadith or Quranic verse. No editorial paraphrasing or unsourced claims.
 */
export const sunnahContentData: Content[] = [
  // === ANXIOUS ===
  {
    id: 'wisdom_ibn_qayyim_protections',
    type: 'Sunnah Practice',
    primaryText: 'Recite "Al-Mu\'awwidhatayn" for spiritual protection.',
    translation:
      'Say, "I seek refuge in the Lord of daybreak, from the evil of that which He created, from the evil of darkness when it settles, and from the evil of the blowers in knots, and from the evil of an envier when he envies." Say, "I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind, from the evil of the retreating whisperer, who whispers in the breasts of mankind, from among the jinn and mankind."',
    arabicText:
      'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ مِنْ شَرِّ مَا خَلَقَ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ قُلْ أَعُوذُ بِرَبِّ النَّاسِ مَلِكِ النَّاسِ إِلَٰهِ النَّاسِ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ مِنَ الْجِنَّةِ وَالنَّاسِ',
    englishTranslation:
      'Recite Surat Al-Falaq and Surat An-Nas 3 times each, blowing over your hands and wiping your body.',
    source: 'Quran 113 & 114 / Sahih al-Bukhari 5017',
    whyThis:
      'Aisha (ra) reported: "Whenever the Prophet (ﷺ) went to bed every night, he used to cup his hands together and blow over them after reciting Surah Al-Ikhlas, Surah Al-Falaq and Surah An-Nas, and then rub his hands over whatever parts of his body he was able to rub, starting with his head, face and front of his body. He used to do that three times." [Sahih al-Bukhari 5017]',
    repeatCount: 3,
    difficulty: 1,
    moods: ['Overwhelmed'],
    prayerContext: ['fajr_post', 'maghrib_pre'],
  },
  {
    id: 'dhikr_la_hawla',
    type: 'Dhikr',
    primaryText: 'Repeat: "Lā hawla wa lā quwwata illā billāh"',
    arabicText: 'لاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ',
    transliteration: 'La hawla wa la quwwata illa billah',
    translation: 'There is no power and no strength except with Allah.',
    englishTranslation:
      "Repeat this phrase while acknowledging your total dependence on Allah's power.",
    source: 'Sahih al-Bukhari 6384 / Sahih Muslim 2704',
    whyThis:
      'The Prophet (ﷺ) said: "Shall I not guide you to a treasure from the treasures of Paradise? Say: lā ḥawla wa lā quwwata illā billāh." [Sahih al-Bukhari 6384; Sahih Muslim 2704]',
    difficulty: 1,
    moods: ['Overwhelmed'],
  },
  {
    id: 'practice_wudu_anxious',
    type: 'Sunnah Practice',
    primaryText: 'Perform Wudu (Ablution) to calm your soul.',
    englishTranslation:
      'Perform a complete Wudu, paying attention to the cooling sensation of the water on your skin.',
    source: 'Sunan Abi Dawud 4784',
    whyThis:
      'The Prophet (ﷺ) said: "Anger is from Shaytan, and Shaytan is created from fire. Fire is extinguished by water, so when one of you gets angry, let him perform Wudu." [Sunan Abi Dawud 4784]',
    difficulty: 2,
    moods: ['Overwhelmed', 'Angry'],
  },

  // === STRESSED / OVERWHELMED ===
  {
    id: 'dua_121_anxious',
    type: 'Dua',
    primaryText: 'Seek refuge in Allah from anxiety and sorrow',
    arabicText:
      'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ',
    transliteration:
      "Allahumma inni a'udhu bika minal-hammi wal-hazan, wal-ajzi wal-kasal, wal-bukhli wal-jubn, wa dala'id-dayni wa ghalabatir-rijal.",
    englishTranslation:
      'Recite this slowly and reflect on each word. It covers the root causes of being overwhelmed.',
    translation:
      'O Allah, I seek refuge in You from anxiety and sorrow, from inability and laziness, from avarice and cowardice, from being overcome by debt and from being overpowered by men.',
    source: 'Hisn al-Muslim 121 / Sahih al-Bukhari 6363',
    whyThis:
      'Anas ibn Malik (ra) reported that the Prophet (ﷺ) used to regularly say this supplication. [Sahih al-Bukhari 6363]',
    difficulty: 1,
    moods: ['Overwhelmed'],
    prayerContext: ['fajr_post', 'maghrib_pre'],
  },
  {
    id: 'practice_2rakat',
    type: 'Sunnah Practice',
    primaryText: 'Perform 2 Rakat of prayer (Salatul Hajah).',
    englishTranslation:
      'Perform two Rakat of voluntary prayer with focused concentration, then sincerely ask Allah for your specific need.',
    source: 'Sunan Abi Dawud 1319',
    whyThis:
      'Hudhayfah (ra) reported: "Whenever a matter distressed the Prophet (ﷺ), he would pray." [Sunan Abi Dawud 1319]',
    difficulty: 3,
    moods: ['Overwhelmed'],
  },
  {
    id: 'practice_bismillah_reset',
    type: 'Dhikr',
    primaryText: 'Center yourself with "Bismillah" (In the Name of Allah).',
    englishTranslation:
      'Whenever you feel overwhelmed, stop and say "Bismillah" slowly before starting any small task.',
    source: 'Quran 13:28',
    whyThis:
      '"Those who have believed and whose hearts find rest in the remembrance of Allah. Verily, in the remembrance of Allah do hearts find rest." [Quran 13:28]',
    difficulty: 1,
    moods: ['Overwhelmed'],
  },

  // === ANGRY ===
  {
    id: 'dhikr_anger_refuge',
    type: 'Dhikr',
    primaryText: 'Say: "A\'ūdhu billāhi min ash-shaytān ir-rajīm"',
    arabicText: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
    transliteration: "A'udhu billahi minash-shaytanir-rajim",
    englishTranslation: 'Repeat this until the intensity of the anger subsides.',
    translation: 'I seek refuge in Allah from the accursed Devil.',
    source: 'Sahih al-Bukhari 6115 / Sahih Muslim 2610',
    whyThis:
      'The Prophet (ﷺ) saw a man overcome with anger and said: "I know a word that, if he were to say it, what he feels would go away — if he were to say \'I seek refuge in Allah from the accursed Devil.\'" [Sahih al-Bukhari 6115; Sahih Muslim 2610]',
    difficulty: 1,
    moods: ['Angry'],
  },
  {
    id: 'practice_anger_position',
    type: 'Sunnah Practice',
    primaryText: 'Change your physical posture immediately.',
    englishTranslation: 'If you are standing, sit down. If you are sitting, lie down.',
    source: 'Sunan Abi Dawud 4782',
    whyThis:
      'The Prophet (ﷺ) said: "If any of you becomes angry while he is standing, let him sit down. If it goes away, well and good; otherwise let him lie down." [Sunan Abi Dawud 4782]',
    difficulty: 1,
    moods: ['Angry'],
  },
  {
    id: 'practice_anger_silence',
    type: 'Sunnah Practice',
    primaryText: 'Commit to silence.',
    englishTranslation:
      'Stop speaking immediately. Do not respond to provocations until your heart is calm.',
    source: 'Musnad Ahmad 2136',
    whyThis:
      'The Prophet (ﷺ) said: "If any of you becomes angry, let him keep silent." [Musnad Ahmad 2136]',
    difficulty: 1,
    moods: ['Angry'],
  },

  // === SAD ===
  {
    id: 'dua_154_tragedy',
    type: 'Dua',
    primaryText: "Inna lillahi wa inna ilayhi raji'un...",
    arabicText:
      'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ، اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي، وَأَخْلِفْ لِي خَيْرَاً مِنْهَا',
    transliteration:
      'Inna lillahi wa-inna ilayhi rajiAAoon, allahumma-jurnee fee museebatee wakhluf lee khayran minha.',
    englishTranslation:
      'Recite this slowly when you feel a sense of loss or tragedy — no matter how small.',
    translation:
      'To Allah we belong and to Him we return. O Allah, reward me in my affliction and replace it with something better.',
    source: 'Hisn al-Muslim 154 / Sahih Muslim 918',
    whyThis:
      'Umm Salamah (ra) reported that the Prophet (ﷺ) taught her this supplication after the death of Abu Salamah, and Allah replaced him with someone better for her. [Sahih Muslim 918]',
    difficulty: 1,
    moods: ['Sad'],
  },
  {
    id: 'dua_yunus_sad',
    type: 'Dua',
    primaryText: 'The Dua of Yunus (as): The Cry for Relief',
    arabicText: 'لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ',
    transliteration: 'La ilaha illa anta subhanaka inni kuntu minaz-zalimine',
    englishTranslation: "Recite this while acknowledging your vulnerability before Allah's Mercy.",
    translation:
      'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.',
    source: 'Quran 21:87 / Sunan at-Tirmidhi 3505',
    whyThis:
      'The Prophet (ﷺ) said: "No Muslim ever calls upon Allah with these words for anything, except that Allah will answer him." [Sunan at-Tirmidhi 3505, graded Hasan Sahih]',
    difficulty: 1,
    moods: ['Sad', 'Overwhelmed'],
  },
  {
    id: 'wisdom_fatigue',
    type: 'Hadith',
    primaryText: 'Remember: This sorrow expiates your sins.',
    englishTranslation:
      'Sit quietly and reflect on this promise from the Prophet (ﷺ).',
    source: 'Sahih al-Bukhari 5641 / Sahih Muslim 2573',
    whyThis:
      'The Prophet (ﷺ) said: "No fatigue, nor sorrow, nor sadness, nor hurt, nor distress befalls a Muslim — even the prick of a thorn — except that Allah expiates some of his sins for it." [Sahih al-Bukhari 5641; Sahih Muslim 2573]',
    difficulty: 2,
    moods: ['Sad', 'Overwhelmed'],
  },

  // === TIRED ===
  {
    id: 'dua_88_vitality',
    type: 'Dua',
    primaryText: 'Ya Hayyu Ya Qayyum: O Ever-Living, O Sustainer...',
    arabicText:
      'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغيثُ أَصْلِحْ لِي شَأْنِيَ كُلَّهُ وَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ',
    transliteration:
      'Ya hayyu ya qayyoom, birahmatika astagheeth, aslih lee sha/nee kullah, wala takilnee ila nafsee tarfata AAayn.',
    englishTranslation:
      'Recite this morning and evening, or whenever you feel your energy failing you.',
    translation:
      'O Ever Living One, O Self-Sustaining One, in Your mercy I seek relief. Set all my affairs right for me and do not leave me to myself even for the blink of an eye.',
    source: "Hisn al-Muslim 88 / Sunan al-Nasa'i 603",
    whyThis:
      "This supplication is recorded among the Prophetic morning and evening adhkar. [Sunan al-Nasa'i, Amal al-Yawm wal-Layla 603]",
    difficulty: 1,
    moods: ['Tired', 'Overwhelmed'],
  },
  {
    id: 'practice_qaylulah',
    type: 'Sunnah Practice',
    primaryText: 'Take a short mid-day nap (Qaylulah).',
    englishTranslation:
      'Rest for 20 minutes before or after Dhuhr. This is a Sunnah that restores energy.',
    source: 'Sahih al-Bukhari 6248 / Al-Mujam al-Awsat 769',
    whyThis:
      'The Prophet (ﷺ) practised qaylulah (midday rest). [Sahih al-Bukhari 6248]',
    difficulty: 2,
    moods: ['Tired', 'Overwhelmed'],
    prayerContext: ['dhuhr'],
  },
  {
    id: 'practice_morning_dhikr_lite',
    type: 'Dhikr',
    primaryText: 'Recite Core Morning Protections.',
    englishTranslation:
      'Say "Bismillahil-ladhi la yadurru..." (3x) and "A\'udhu bikalimatillahit-tammah..." (3x).',
    source: 'Hisn al-Muslim 75-80',
    whyThis:
      'The Prophet (ﷺ) said: "Whoever says \'In the name of Allah, with Whose name nothing can cause harm in the earth or in the heavens, and He is the All-Hearing, the All-Knowing\' three times in the morning, will not be stricken with a sudden affliction until evening." [Sunan Abi Dawud 5088; graded Sahih by al-Albani]',
    difficulty: 2,
    moods: ['Tired', 'Hopeful'],
    prayerContext: ['fajr_post'],
  },

  // === CALM ===
  {
    id: 'dua_ayat_kursi',
    type: 'Dua',
    primaryText: 'Recite Ayat al-Kursi before sleeping.',
    arabicText:
      'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    transliteration:
      "Allahu la ilaha illa huwal-hayyul-qayyum, la ta'khudhuhu sinatun wa la nawm, lahu ma fis-samawati wa ma fil-ard, man dhal-ladhi yashfa'u 'indahu illa bi'idhnih, ya'lamu ma bayna 'aydihim wa ma khalfahum, wa la yuhituna bishay'im-min 'ilmihi illa bima sha', wasi'a kursiyyuhus-samawati wal-ard, wa la ya'uduhu hifzuhuma wa huwal-'aliyyul-'azim.",
    englishTranslation: 'Recite this before sleeping or after every Fard prayer.',
    translation:
      'Allah — there is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what is behind them, and they encompass nothing of His knowledge except what He wills. His Seat extends over the heavens and the earth, and their preservation does not tire Him. And He is the Most High, the Most Great.',
    source: 'Quran 2:255 / Sahih al-Bukhari 2311',
    audioKey: '2:255',
    whyThis:
      'The Prophet (ﷺ) said: "Whoever recites Ayat al-Kursi when going to bed, Allah will appoint a guardian over him and Shaytan will not approach him until morning." [Sahih al-Bukhari 2311]',
    difficulty: 1,
    moods: ['Calm', 'Overwhelmed'],
  },
  {
    id: 'practice_bedtime_dhikr',
    type: 'Sunnah Practice',
    primaryText: 'The 33-33-34 Tasbeeh.',
    englishTranslation:
      'Say SubhanAllah (33x), Alhamdulillah (33x), and AllahuAkbar (34x) while focusing on the meaning.',
    source: 'Sahih al-Bukhari 3113 / Sahih Muslim 2727',
    whyThis:
      'Ali (ra) reported that Fatimah (ra) asked the Prophet (ﷺ) for a servant. He said: "Shall I not guide you to something better than that? Say SubhanAllah thirty-three times, Alhamdulillah thirty-three times, and AllahuAkbar thirty-four times when you go to bed. That is better for you than a servant." [Sahih al-Bukhari 3113; Sahih Muslim 2727]',
    repeatCount: 100,
    difficulty: 2,
    moods: ['Calm', 'Grateful'],
  },

  // === GRATEFUL ===
  {
    id: 'dhikr_alhamdulillah_100',
    type: 'Dhikr',
    primaryText: 'Repeat "Alhamdulillah" 100 times.',
    englishTranslation:
      'Count 100 repetitions of "All praise is for Allah."',
    source: "Sunan an-Nasa'i / Sunan at-Tirmidhi 3468",
    whyThis:
      'The Prophet (ﷺ) said: "Al-hamdu lillah fills the scales." [Sahih Muslim 223]',
    repeatCount: 100,
    difficulty: 2,
    moods: ['Tired', 'Calm'],
    prayerContext: ['isha'],
  },
  {
    id: 'practice_count_blessings',
    type: 'Sunnah Practice',
    primaryText: 'Sit and count 3 specific blessings today.',
    englishTranslation: 'Reflection on specific favors increases the heart in faith and joy.',
    source: 'Practice derived from Quran 14:7',
    whyThis:
      '"And when your Lord proclaimed: If you are grateful, I will surely increase you in favor; but if you deny, indeed My punishment is severe." [Quran 14:7]',
    difficulty: 2,
    moods: ['Grateful'],
  },
  {
    id: 'dua_thanksgiving_meal',
    type: 'Dua',
    primaryText: 'Gratitude after eating or provision.',
    arabicText:
      'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا، وَرَزَقَنِيَهُ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
    transliteration:
      'Alhamdu lillahil-ladhi atamana hadha, wa razaqanihi min ghayri hawlin minni wa la quwwah.',
    translation:
      'Praise be to Allah who has fed me this and provided it for me without any might or power from myself.',
    englishTranslation: 'Recite this after a meal.',
    source: 'Sunan Abi Dawud 4023',
    whyThis:
      'The Prophet (ﷺ) said: "Whoever eats food and then says: \'Praise be to Allah who has fed me this and provided it for me without any might or power from myself,\' his past sins will be forgiven." [Sunan Abi Dawud 4023]',
    difficulty: 1,
    moods: ['Grateful'],
  },

  // === HOPEFUL ===
  {
    id: 'dua_ease_hope',
    type: 'Dua',
    primaryText: 'Dua for Ease: Allahumma la sahla...',
    arabicText:
      'اللَّهُمَّ لاَ سَهْلَ إِلاَّ مَا جَعَلْتَهُ سَهْلاً، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلاً',
    transliteration:
      "Allahumma la sahla illa ma ja'altahu sahla, wa anta taj'alul-hazna idha shi'ta sahla.",
    englishTranslation: 'Recite this when facing a difficult task or complex situation.',
    translation:
      'O Allah, there is no ease except in what You have made easy, and You make the difficulty easy if You will.',
    source: 'Hisn al-Muslim 139 / Ibn Hibban 974',
    whyThis:
      'A supplication transmitted in the collections of prophetic supplications, recorded by Ibn Hibban (974) and cited in Hisn al-Muslim (139).',
    difficulty: 1,
    moods: ['Hopeful', 'Overwhelmed'],
  },
  {
    id: 'wisdom_paradise_3x',
    type: 'Sunnah Practice',
    primaryText: 'Ask Allah for Paradise (Jannah) 3 times.',
    englishTranslation: 'Simply say "Allahumma inni as-alukal Jannah" three times with sincerity.',
    source: 'Sunan at-Tirmidhi 2572',
    whyThis:
      'The Prophet (ﷺ) said: "Whoever asks Allah for Paradise three times, Paradise says: \'O Allah, admit him to Paradise.\' And whoever seeks refuge from the Fire three times, the Fire says: \'O Allah, protect him from the Fire.\'" [Sunan at-Tirmidhi 2572, graded Sahih]',
    repeatCount: 3,
    difficulty: 1,
    moods: ['Hopeful'],
  },
  {
    id: 'wisdom_allah_provide',
    type: 'Quran',
    primaryText: 'Reflect on Quran 65:3: The Promise of Provision.',
    englishTranslation:
      'Recite or reflect: "And He will provide for him from where he does not expect. And whoever relies upon Allah — then He is sufficient for him. Indeed, Allah will accomplish His purpose. Allah has already set for everything a due measure."',
    source: 'Quran 65:3',
    whyThis:
      '"And He will provide for him from where he does not expect. And whoever relies upon Allah — then He is sufficient for him. Indeed, Allah will accomplish His purpose. Allah has already set for everything a due measure." [Quran 65:3]',
    difficulty: 1,
    moods: ['Hopeful', 'Overwhelmed'],
  },

  // === UNIVERSAL / MULTI-MOOD ===
  {
    id: 'practice_universal_istighfar_100',
    type: 'Dhikr',
    primaryText: 'Istighfar 100x.',
    arabicText: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Astaghfirullah wa atubu ilayh',
    translation: 'I seek the forgiveness of Allah and repent to Him.',
    englishTranslation: 'Count 100 times.',
    source: 'Sahih Muslim 2702',
    whyThis:
      'The Prophet (ﷺ) said: "Whoever constantly seeks pardon, Allah will appoint for him a way out of every distress, a relief from every anxiety, and will provide for him from where he did not expect." [Sunan Abi Dawud 1518; graded Sahih by al-Albani]',
    repeatCount: 100,
    difficulty: 3,
    moods: ['Overwhelmed', 'Sad', 'Angry', 'Hopeful', 'Calm', 'Grateful', 'Tired', 'Lonely'],
  },
];
