// src/data/hadithData.ts
import { Content } from '../types';

/**
 * VERIFICATION: Verified 2026-07-01 against sunnah.com via Apify browser scraping.
 * - Ibn Majah 224: chain Da'if Jaddan (sunnah.com note); matn authenticated by other narrations — grading kept 'hasan'
 * - Muslim 2699: Sahih ✓
 * - Bukhari 1: Sahih ✓
 * - Ibn Hibban: "Allahumma la sahla" — cited at collection level (Sahih Ibn Hibban), graded sahih (Ibn Hibban included it in his Sahih; also authenticated by al-Albani). Exact hadith number still to confirm; no fabricated number shipped.
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
    source: 'Sahih Ibn Hibban',
    transliteration: 'Allahumma la sahla illa ma jaaltahu sahla',
    whyThis: 'Reframe hard topics as dependent on divine ease, not personal effort alone.',
    propheticPractice: {
      description: 'Recite this dua for difficult subjects',
      source: 'Sahih Ibn Hibban',
      grading: 'sahih',
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
    // Was a duplicate of hadith_results_3 (both Muslim 2999, "Wondrous is the
    // affair of the believer") — the same hadith surfaced twice inside one
    // 7-day journey. Swapped for Bukhari 5641, which names hamm (anxiety) and
    // ghamm (distress) directly: the discomfort of waiting is itself expiation.
    id: 'hadith_results_5',
    type: 'Hadith',
    primaryText: 'No fatigue, illness, anxiety, sorrow, hurt or distress befalls a Muslim, but that Allah expiates some of his sins by it',
    arabicText:
      'مَا يُصِيبُ الْمُسْلِمَ مِنْ نَصَبٍ وَلاَ وَصَبٍ وَلاَ هَمٍّ وَلاَ حُزْنٍ وَلاَ أَذًى وَلاَ غَمٍّ حَتَّى الشَّوْكَةِ يُشَاكُهَا إِلاَّ كَفَّرَ اللَّهُ بِهَا مِنْ خَطَايَاهُ',
    translation:
      'No fatigue, nor illness, nor anxiety, nor sorrow, nor hurt, nor distress befalls a Muslim — even the prick of a thorn — but that Allah expiates some of his sins by it',
    englishTranslation:
      'No fatigue, nor illness, nor anxiety, nor sorrow, nor hurt, nor distress befalls a Muslim — even the prick of a thorn — but that Allah expiates some of his sins by it',
    source: 'Bukhari 5641',
    transliteration:
      "Ma yusib al-muslima min nasabin wa la wasabin wa la hammin wa la huznin wa la adhan wa la ghammin hatta ash-shawkati yushakuha illa kaffara Allahu biha min khatayah",
    whyThis: 'The waiting itself is not wasted time — anxiety and distress are named here as things Allah accepts as expiation.',
    propheticPractice: {
      description: 'Sit with the discomfort of waiting, knowing it is counted and not wasted',
      source: 'Bukhari 5641',
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
    primaryText: 'Whoever is patient, Allah will make him patient. Nobody can be given a blessing better and greater than patience.',
    arabicText: 'وَمَنْ يَتَصَبَّرْ يُصَبِّرْهُ اللَّهُ وَمَا أُعْطِيَ أَحَدٌ عَطَاءً خَيْرًا وَأَوْسَعَ مِنَ الصَّبْرِ',
    translation: 'Whoever is patient, Allah will make him patient. Nobody can be given a blessing better and greater than patience.',
    englishTranslation: 'Whoever is patient, Allah will make him patient. Nobody can be given a blessing better and greater than patience.',
    source: 'Bukhari 1469',
    transliteration: 'Wa man yatasabbar yusabbirhu Allah, wa ma u\'tiya ahadun ata\'an khayran wa awsa\'a min as-sabr',
    whyThis: 'Sabr + next-step framing: patience is not an ending — it is the gift Allah gives you to carry forward.',
    propheticPractice: {
      description: 'Carry patience as the greatest gift into what comes next',
      source: 'Bukhari 1469',
      grading: 'sahih',
    },
    moods: [],
  },
  // Path E: Prayer Leadership — Days 1-14.
  // English is the published translation in every case: sunnah.com for Sahih
  // Muslim, the fawazahmed0 hadith-api mirror for Bukhari and Abu Dawud.
  {
    id: 'hadith_imam_1',
    type: 'Hadith',
    primaryText: "The one who is most versed in Allah's Book should act as Imam for the people",
    arabicText: 'يَؤُمُّ الْقَوْمَ أَقْرَؤُهُمْ لِكِتَابِ اللَّهِ فَإِنْ كَانُوا فِي الْقِرَاءَةِ سَوَاءً فَأَعْلَمُهُمْ بِالسُّنَّةِ',
    translation: "The one who is most versed in Allah's Book should act as Imam for the people, but if they are equally versed in reciting it, then the one who has most knowledge regarding Sunnah.",
    englishTranslation: "The one who is most versed in Allah's Book should act as Imam for the people, but if they are equally versed in reciting it, then the one who has most knowledge regarding Sunnah.",
    source: 'Sahih Muslim 673',
    transliteration: "Ya'ummu al-qawma aqra'uhum li-kitabi Allah, fa-in kanu fi al-qira'ati sawa'an fa-a'lamuhum bis-sunnah",
    whyThis: 'Recitation is the first criterion, before knowledge of the Sunnah and before seniority — which makes stepping forward a question of what you have memorised.',
    propheticPractice: {
      description: 'Measure your readiness by what you can recite, not by how senior you feel',
      source: 'Sahih Muslim 673',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_imam_2',
    type: 'Hadith',
    primaryText: 'Whoever does not recite Al-Fatiha in his prayer, his prayer is invalid',
    arabicText: 'لاَ صَلاَةَ لِمَنْ لَمْ يَقْرَأْ بِفَاتِحَةِ الْكِتَابِ',
    translation: 'Whoever does not recite Al-Fatiha in his prayer, his prayer is invalid.',
    englishTranslation: 'Whoever does not recite Al-Fatiha in his prayer, his prayer is invalid.',
    source: 'Sahih al-Bukhari 756',
    transliteration: "La salata li-man lam yaqra' bi-fatihati al-kitab",
    whyThis: 'Al-Fatihah is the one text that is not optional, which is why an imam perfects it before adding a single surah to his list.',
    propheticPractice: {
      description: 'Perfect Al-Fatihah before memorising anything else',
      source: 'Sahih al-Bukhari 756',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_imam_3',
    type: 'Hadith',
    primaryText: "By Him in Whose Hand my life is, this Surah is equal to one-third of the Qur'an",
    arabicText: 'وَالَّذِي نَفْسِي بِيَدِهِ إِنَّهَا لَتَعْدِلُ ثُلُثَ الْقُرْآنِ',
    translation: "By Him in Whose Hand my life is, this Surah is equal to one-third of the Qur'an.",
    englishTranslation: "By Him in Whose Hand my life is, this Surah is equal to one-third of the Qur'an.",
    source: 'Sahih al-Bukhari 5013',
    transliteration: "Walladhi nafsi bi-yadihi innaha la-ta'dilu thulutha al-Qur'an",
    whyThis: 'Said about Al-Ikhlas — four short ayahs weighed against a third of the revelation, and the surah nearly every congregation already knows.',
    propheticPractice: {
      description: 'Make Al-Ikhlas the first surah after Al-Fatihah that you can recite without hesitation',
      source: 'Sahih al-Bukhari 5013',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_imam_4',
    type: 'Hadith',
    primaryText: 'Uqbah, should I not teach you two best surahs ever recited?',
    arabicText: 'يَا عُقْبَةُ أَلاَ أُعَلِّمُكَ خَيْرَ سُورَتَيْنِ قُرِئَتَا',
    translation: 'Uqbah, should I not teach you two best surahs ever recited? He then taught him Al-Falaq and An-Nas, and when he alighted for prayer he led the people in the morning prayer and recited them in prayer.',
    englishTranslation: 'Uqbah, should I not teach you two best surahs ever recited? He then taught him Al-Falaq and An-Nas, and when he alighted for prayer he led the people in the morning prayer and recited them in prayer.',
    source: 'Sunan Abi Dawud 1462',
    transliteration: "Ya Uqbatu, ala u'allimuka khayra suratayni quri'ata",
    whyThis: 'He taught the pair and then used it in front of a congregation the same morning — the two surahs arrive with a worked example of leading with them.',
    propheticPractice: {
      description: 'Learn Al-Falaq and An-Nas as a pair, then lead a Fajr with them',
      source: 'Sunan Abi Dawud 1462',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_imam_5',
    type: 'Hadith',
    primaryText: "Commit yourself to the Qur'an, for it is more prone to break away than a camel in its bind",
    arabicText: 'تَعَاهَدُوا الْقُرْآنَ فَوَالَّذِي نَفْسِي بِيَدِهِ لَهُوَ أَشَدُّ تَفَصِّيًا مِنَ الإِبِلِ فِي عُقُلِهَا',
    translation: "Commit yourself to the Qur'an, for by Him in whose Hand is my soul, it is surely more prone to break away than a camel in its bind.",
    englishTranslation: "Commit yourself to the Qur'an, for by Him in whose Hand is my soul, it is surely more prone to break away than a camel in its bind.",
    source: 'Sahih al-Bukhari 5033',
    transliteration: "Ta'ahadu al-Qur'ana fa-walladhi nafsi bi-yadihi la-huwa ashaddu tafassiyan min al-ibili fi uqulliha",
    whyThis: 'The image is a tethered camel: what you memorised is held only as long as you keep returning to it. Repetition is not revision, it is the tether.',
    propheticPractice: {
      description: 'Recite the same surah daily until it arrives without effort',
      source: 'Sahih al-Bukhari 5033',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_imam_6',
    type: 'Hadith',
    primaryText: 'Tell him that Allah loves him',
    arabicText: 'أَخْبِرُوهُ أَنَّ اللَّهَ يُحِبُّهُ',
    translation: 'A man used to lead his companions in prayer and would finish his recitation with Qul huwa Allahu ahad. He said: I do so because it mentions the qualities of the Beneficent and I love to recite it. The Prophet said: Tell him that Allah loves him.',
    englishTranslation: 'A man used to lead his companions in prayer and would finish his recitation with Qul huwa Allahu ahad. He said: I do so because it mentions the qualities of the Beneficent and I love to recite it. The Prophet said: Tell him that Allah loves him.',
    source: 'Sahih al-Bukhari 7375',
    transliteration: "Akhbiruhu anna Allaha yuhibbuh",
    whyThis: 'An imam who recited the same surah in every single rak\'ah was not corrected for the repetition — he was told Allah loved him for it.',
    propheticPractice: {
      description: 'Lead with the surahs you hold most firmly, without apologising for repeating them',
      source: 'Sahih al-Bukhari 7375',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_imam_7',
    type: 'Hadith',
    primaryText: 'He used to recite on the two Eids and in Friday prayer: Glorify the name of Thy Lord, the Most High, and: Has there come to thee the news of the overwhelming event',
    arabicText: 'كَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَقْرَأُ فِي الْعِيدَيْنِ وَفِي الْجُمُعَةِ بِسَبِّحِ اسْمَ رَبِّكَ الأَعْلَى وَهَلْ أَتَاكَ حَدِيثُ الْغَاشِيَةِ',
    translation: 'The Messenger of Allah used to recite on two Eids and in Friday prayer: "Glorify the name of Thy Lord, the Most High", and: "Has there come to thee the news of the overwhelming event".',
    englishTranslation: 'The Messenger of Allah used to recite on two Eids and in Friday prayer: "Glorify the name of Thy Lord, the Most High", and: "Has there come to thee the news of the overwhelming event".',
    source: 'Sahih Muslim 878',
    transliteration: "Kana yaqra'u fil-idayni wa fil-jumu'ati bi-Sabbihisma Rabbika al-A'la wa Hal ataka hadithu al-ghashiyah",
    whyThis: 'His choice for the fullest congregations of the year was two short surahs — the standard to copy when deciding what to recite.',
    propheticPractice: {
      description: 'Build your set from the short surahs a congregation already recognises',
      source: 'Sahih Muslim 878',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_imam_8',
    type: 'Hadith',
    primaryText: 'Straighten your rows, for the straightening of a row is a part of the perfection of prayer',
    arabicText: 'سَوُّوا صُفُوفَكُمْ فَإِنَّ تَسْوِيَةَ الصَّفِّ مِنْ تَمَامِ الصَّلاَةِ',
    translation: 'Straighten your rows, for the straightening of a row is a part of the perfection of prayer.',
    englishTranslation: 'Straighten your rows, for the straightening of a row is a part of the perfection of prayer.',
    source: 'Sahih Muslim 433',
    transliteration: 'Sawwu sufufakum fa-inna taswiyata as-saffi min tamami as-salah',
    whyThis: 'The first act of leading is not recitation. It is turning round, levelling the line, and only then beginning.',
    propheticPractice: {
      description: 'Straighten the row before every takbir you lead',
      source: 'Sahih Muslim 433',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_imam_9',
    type: 'Hadith',
    primaryText: 'Say Amin when the Imam says it',
    arabicText: 'إِذَا أَمَّنَ الإِمَامُ فَأَمِّنُوا فَإِنَّهُ مَنْ وَافَقَ تَأْمِينُهُ تَأْمِينَ الْمَلاَئِكَةِ غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ',
    translation: 'Say Amin when the Imam says it, and if the Amin of any one of you coincides with that of the angels then all his past sins will be forgiven.',
    englishTranslation: 'Say Amin when the Imam says it, and if the Amin of any one of you coincides with that of the angels then all his past sins will be forgiven.',
    source: 'Sahih al-Bukhari 780',
    transliteration: "Idha ammana al-imamu fa-amminu, fa-innahu man wafaqa ta'minuhu ta'mina al-mala'ikati ghufira lahu ma taqaddama min dhanbih",
    whyThis: 'The congregation has something to say back, which only works if the imam recites aloud and then leaves them the beat to say it in.',
    propheticPractice: {
      description: 'Say Ameen aloud after Al-Fatihah and pause before the surah',
      source: 'Sahih al-Bukhari 780',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_imam_10',
    type: 'Hadith',
    primaryText: 'The Imam is appointed to be followed, so do not differ from him',
    arabicText: 'إِنَّمَا جُعِلَ الإِمَامُ لِيُؤْتَمَّ بِهِ فَلاَ تَخْتَلِفُوا عَلَيْهِ، فَإِذَا رَكَعَ فَارْكَعُوا، وَإِذَا قَالَ سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ فَقُولُوا رَبَّنَا لَكَ الْحَمْدُ',
    translation: 'The Imam is appointed to be followed. So do not differ from him, bow when he bows, and say "Rabbana lakal hamd" if he says "Sami\'a llahu liman hamidah".',
    englishTranslation: 'The Imam is appointed to be followed. So do not differ from him, bow when he bows, and say "Rabbana lakal hamd" if he says "Sami\'a llahu liman hamidah".',
    source: 'Sahih al-Bukhari 722',
    transliteration: "Innama ju'ila al-imamu li-yu'tamma bihi fa-la takhtalifu alayhi",
    whyThis: 'Every movement an imam makes is an instruction to the row. That is why the transition takbirs have to be audible and unhurried.',
    propheticPractice: {
      description: 'Call every transition clearly and settle before the next one',
      source: 'Sahih al-Bukhari 722',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_imam_11',
    type: 'Hadith',
    primaryText: 'He should cast aside his doubt and base his prayer on what he is sure of',
    arabicText: 'إِذَا شَكَّ أَحَدُكُمْ فِي صَلاَتِهِ فَلَمْ يَدْرِ كَمْ صَلَّى ثَلاَثًا أَمْ أَرْبَعًا فَلْيَطْرَحِ الشَّكَّ وَلْيَبْنِ عَلَى مَا اسْتَيْقَنَ ثُمَّ يَسْجُدُ سَجْدَتَيْنِ قَبْلَ أَنْ يُسَلِّمَ',
    translation: 'When any one of you is in doubt about his prayer and he does not know how much he has prayed, three or four rak\'ahs, he should cast aside his doubt and base his prayer on what he is sure of, then perform two prostrations before giving salutations.',
    englishTranslation: 'When any one of you is in doubt about his prayer and he does not know how much he has prayed, three or four rak\'ahs, he should cast aside his doubt and base his prayer on what he is sure of, then perform two prostrations before giving salutations.',
    source: 'Sahih Muslim 571',
    transliteration: 'Idha shakka ahadukum fi salatihi fa-lam yadri kam salla, fal-yatrahi ash-shakka wal-yabni ala ma istayqana, thumma yasjudu sajdatayni qabla an yusallim',
    whyThis: 'There is a fixed procedure for losing your place, which is itself the point: the slip was expected, and it does not end the prayer.',
    propheticPractice: {
      description: 'Build on the number you are certain of and prostrate twice before the salam',
      source: 'Sahih Muslim 571',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_imam_12',
    type: 'Hadith',
    primaryText: 'If anyone of you leads the people in the prayer, he should shorten it',
    arabicText: 'إِذَا صَلَّى أَحَدُكُمْ لِلنَّاسِ فَلْيُخَفِّفْ، فَإِنَّ مِنْهُمُ الضَّعِيفَ وَالسَّقِيمَ وَالْكَبِيرَ، وَإِذَا صَلَّى أَحَدُكُمْ لِنَفْسِهِ فَلْيُطَوِّلْ مَا شَاءَ',
    translation: 'If anyone of you leads the people in the prayer, he should shorten it for amongst them are the weak, the sick and the old; and if anyone among you prays alone then he may prolong the prayer as much as he wishes.',
    englishTranslation: 'If anyone of you leads the people in the prayer, he should shorten it for amongst them are the weak, the sick and the old; and if anyone among you prays alone then he may prolong the prayer as much as he wishes.',
    source: 'Sahih al-Bukhari 703',
    transliteration: "Idha salla ahadukum lin-nasi fal-yukhaffif, fa-inna minhum ad-da'ifa was-saqima wal-kabir, wa idha salla ahadukum li-nafsihi fal-yutawwil ma sha'",
    whyThis: 'The same hadith shortens the congregation and hands the length back to you when you pray alone — so brevity costs you nothing.',
    propheticPractice: {
      description: 'Take the shorter surah when leading and the longer one when alone',
      source: 'Sahih al-Bukhari 703',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_imam_13',
    type: 'Hadith',
    primaryText: 'O Allah! Thou art Peace, and peace comes from Thee; Blessed art Thou, O Possessor of Glory and Honour',
    arabicText: 'اللَّهُمَّ أَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ تَبَارَكْتَ ذَا الْجَلاَلِ وَالإِكْرَامِ',
    translation: 'When the Messenger of Allah finished his prayer, he begged forgiveness three times and said: O Allah! Thou art Peace, and peace comes from Thee; Blessed art Thou, O Possessor of Glory and Honour.',
    englishTranslation: 'When the Messenger of Allah finished his prayer, he begged forgiveness three times and said: O Allah! Thou art Peace, and peace comes from Thee; Blessed art Thou, O Possessor of Glory and Honour.',
    source: 'Sahih Muslim 591',
    transliteration: 'Allahumma anta as-salamu wa minka as-salam, tabarakta ya dhal-jalali wal-ikram',
    whyThis: 'The prayer does not end at the taslim. This is the first thing he said after turning from it, and an imam who skips it teaches the whole row to skip it.',
    propheticPractice: {
      description: 'Stay seated after the taslim for istighfar three times and this dhikr',
      source: 'Sahih Muslim 591',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_imam_14',
    type: 'Hadith',
    primaryText: 'One of you should pronounce the Adhan and the oldest one amongst you should lead the prayer',
    arabicText: 'ارْجِعُوا فَكُونُوا فِيهِمْ وَعَلِّمُوهُمْ وَصَلُّوا، فَإِذَا حَضَرَتِ الصَّلاَةُ فَلْيُؤَذِّنْ لَكُمْ أَحَدُكُمْ وَلْيَؤُمَّكُمْ أَكْبَرُكُمْ',
    translation: 'Go back and stay with your families and teach them the religion, and offer the prayer; and one of you should pronounce the Adhan for the prayer when its time is due, and the oldest one amongst you should lead the prayer.',
    englishTranslation: 'Go back and stay with your families and teach them the religion, and offer the prayer; and one of you should pronounce the Adhan for the prayer when its time is due, and the oldest one amongst you should lead the prayer.',
    source: 'Sahih al-Bukhari 628',
    transliteration: "Irji'u fa-kunu fihim wa allimuhum wa sallu, fa-idha hadarati as-salatu fal-yu'adhdhin lakum ahadukum wal-ya'ummukum akbarukum",
    whyThis: 'He said this to young men who had been with him barely three weeks, and sent them home to lead rather than to wait until they felt qualified.',
    propheticPractice: {
      description: 'Go and lead one prayer for the people already around you',
      source: 'Sahih al-Bukhari 628',
      grading: 'sahih',
    },
    moods: [],
  },
];
