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
    primaryText: 'O Allah, I seek refuge in You from anxiety and sorrow',
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
    translation: 'The Imam is appointed to be followed. So do not differ from him, bow when he bows, and say "Rabbana lakal hamd" [Our Lord, to You is all praise] if he says "Sami\'a llahu liman hamidah" [Allah has heard whoever praises Him].',
    englishTranslation: 'The Imam is appointed to be followed. So do not differ from him, bow when he bows, and say "Rabbana lakal hamd" [Our Lord, to You is all praise] if he says "Sami\'a llahu liman hamidah" [Allah has heard whoever praises Him].',
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
  {
    id: 'hadith_crisis_1',
    type: 'Hadith',
    primaryText: 'You see the believers as regards their being merciful among themselves and showing love among themselves and being kind, resembling one body.',
    arabicText: 'تَرَى الْمُؤْمِنِينَ فِي تَرَاحُمِهِمْ وَتَوَادِّهِمْ وَتَعَاطُفِهِمْ كَمَثَلِ الْجَسَدِ إِذَا اشْتَكَى عُضْوًا تَدَاعَى لَهُ سَائِرُ جَسَدِهِ بِالسَّهَرِ وَالْحُمَّى',
    translation: 'You see the believers as regards their being merciful among themselves and showing love among themselves and being kind, resembling one body, so that, if any part of the body is not well then the whole body shares the sleeplessness (insomnia) and fever with it.',
    englishTranslation: 'You see the believers as regards their being merciful among themselves and showing love among themselves and being kind, resembling one body, so that, if any part of the body is not well then the whole body shares the sleeplessness (insomnia) and fever with it.',
    source: 'Sahih al-Bukhari 6011',
    transliteration: "Tara al-mu'mineena fee tarahumihim wa tawaddihim wa ta'atufihim ka-mathalil-jasad, idha ishtaka udwan tada'a lahu sa'iru jasadihi bis-sahari wal-humma",
    whyThis: 'An-Nu’man ibn Bashir narrated this to describe the believers as one shared body — one where a single unwell part is not left to carry its pain alone, because the rest of the body loses sleep over it too. Isolation in grief is presented here as a rupture of that body, not a private matter.',
    propheticPractice: {
      description: 'Tell one person what you are carrying today, and let them stay awake over it with you',
      source: 'Sahih al-Bukhari 6011',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_crisis_2',
    type: 'Hadith',
    primaryText: 'When Allah completed the creation, He wrote in His Book which is with Him on His Throne, "My Mercy overpowers My Anger."',
    arabicText: 'لَمَّا قَضَى اللَّهُ الْخَلْقَ كَتَبَ فِي كِتَابِهِ، فَهْوَ عِنْدَهُ فَوْقَ الْعَرْشِ إِنَّ رَحْمَتِي غَلَبَتْ غَضَبِي',
    translation: 'When Allah completed the creation, He wrote in His Book which is with Him on His Throne, ‘My Mercy overpowers My Anger.’',
    englishTranslation: 'When Allah completed the creation, He wrote in His Book which is with Him on His Throne, ‘My Mercy overpowers My Anger.’',
    source: 'Sahih al-Bukhari 3194',
    transliteration: 'Lamma qada Allahu al-khalqa kataba fee kitabihi fahuwa indahu fawqa al-arshi inna rahmatee ghalabat ghadabee',
    whyThis: 'Abu Huraira narrated that this was written before creation was even finished — a standing ratio between Allah’s mercy and His anger, decided independently of any one person’s record.',
    propheticPractice: {
      description: 'Read the sentence you have written about yourself against this one, and let this one stand unanswered today',
      source: 'Sahih al-Bukhari 3194',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_crisis_3',
    type: 'Hadith',
    primaryText: 'The supplication of Dhun-Nun when he supplicated while in the belly of the whale: no Muslim ever supplicates with it for anything except Allah responds to him.',
    arabicText: 'دَعْوَةُ ذِي النُّونِ إِذْ دَعَا وَهُوَ فِي بَطْنِ الْحُوتِ لاَ إِلَهَ إِلاَّ أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ فَإِنَّهُ لَمْ يَدْعُ بِهَا رَجُلٌ مُسْلِمٌ فِي شَيْءٍ قَطُّ إِلاَّ اسْتَجَابَ اللَّهُ لَهُ',
    translation: '“The supplication of Dhun-Nun (Prophet Yunus) when he supplicated, while in the belly of the whale was: ‘There is none worthy of worship except You, Glory to You, Indeed, I have been of the transgressors.’ So indeed, no Muslim man supplicates with it for anything, ever, except Allah responds to him.”',
    englishTranslation: '“The supplication of Dhun-Nun (Prophet Yunus) when he supplicated, while in the belly of the whale was: ‘There is none worthy of worship except You, Glory to You, Indeed, I have been of the transgressors.’ So indeed, no Muslim man supplicates with it for anything, ever, except Allah responds to him.”',
    source: "Jami' at-Tirmidhi 3505",
    transliteration: "Da'watu Dhin-Nuni idh da'a wa huwa fee batnil-hoot: la ilaha illa anta subhanaka inni kuntu minaz-zalimeen, fa innahu lam yad'u biha rajulun muslimun fee shay'in qattu illastajaba Allahu lahu",
    whyThis: 'Sa’d narrated this from the Prophet صلى الله عليه وسلم. It is the same supplication recorded in Surah Al-Anbiya 21:87 — a promise attached specifically to calling out from a place with no visible way out.',
    propheticPractice: {
      description: 'Say the supplication of Dhun-Nun today, from wherever you actually are',
      source: "Jami' at-Tirmidhi 3505",
      grading: 'hasan',
    },
    moods: [],
  },
  {
    id: 'hadith_crisis_4',
    type: 'Hadith',
    primaryText: 'Allah is more merciful to His slaves than this lady to her son',
    arabicText: 'أَتَرَوْنَ هَذِهِ طَارِحَةً وَلَدَهَا فِي النَّارِ قُلْنَا لاَ وَهْىَ تَقْدِرُ عَلَى أَنْ لاَ تَطْرَحَهُ فَقَالَ اللَّهُ أَرْحَمُ بِعِبَادِهِ مِنْ هَذِهِ بِوَلَدِهَا',
    translation: 'Some captives were brought before the Prophet (صلى الله عليه وسلم) and a woman among them, having lost her own child, was nursing any child she found among the captives. The Prophet said to us, "Do you think that this lady can throw her son in the fire?" We replied, "No, if she has the power not to throw it." The Prophet then said, "Allah is more merciful to His slaves than this lady to her son."',
    englishTranslation: 'Some captives were brought before the Prophet (صلى الله عليه وسلم) and a woman among them, having lost her own child, was nursing any child she found among the captives. The Prophet said to us, "Do you think that this lady can throw her son in the fire?" We replied, "No, if she has the power not to throw it." The Prophet then said, "Allah is more merciful to His slaves than this lady to her son."',
    source: 'Sahih al-Bukhari 5999',
    transliteration: 'A-tarawna hadhihi tarihatan waladaha fin-nar? Qulna la, wa hiya taqdiru ala an la tatrahahu. Fa-qala: Allahu arhamu bi-ibadihi min hadhihi bi-waladiha',
    whyThis: 'Umar ibn al-Khattab narrated watching this exchange. The Prophet صلى الله عليه وسلم used the most protective love the companions could picture — a mother nursing a stranger’s child after losing her own — as the lower bound, not the upper one, of what Allah feels toward those who belong to Him.',
    propheticPractice: {
      description: 'Notice one thing today that Allah has provided without your asking, and say so out loud',
      source: 'Sahih al-Bukhari 5999',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_crisis_5',
    type: 'Hadith',
    primaryText: 'Your Lord has a right on you, your soul has a right on you, and your family has a right on you; so give each one its right.',
    arabicText: 'إِنَّ لِرَبِّكَ عَلَيْكَ حَقًّا، وَلِنَفْسِكَ عَلَيْكَ حَقًّا، وَلأَهْلِكَ عَلَيْكَ حَقًّا، فَأَعْطِ كُلَّ ذِي حَقٍّ حَقَّهُ',
    translation: 'Salman said to Abu Ad-Darda, "Your Lord has a right on you, your soul has a right on you, and your family has a right on you; so you should give the rights of all those who has a right on you." Abu Ad-Darda came to the Prophet (صلى الله عليه وسلم) and narrated the whole story. The Prophet said, "Salman has spoken the truth."',
    englishTranslation: 'Salman said to Abu Ad-Darda, "Your Lord has a right on you, your soul has a right on you, and your family has a right on you; so you should give the rights of all those who has a right on you." Abu Ad-Darda came to the Prophet (صلى الله عليه وسلم) and narrated the whole story. The Prophet said, "Salman has spoken the truth."',
    source: 'Sahih al-Bukhari 1968',
    transliteration: "Inna li-rabbika alayka haqqan, wa li-nafsika alayka haqqan, wa li-ahlika alayka haqqan, fa-a'ti kulla dhee haqqin haqqahu",
    whyThis: 'Abu Juhaifa narrated this correction, given to Abu Ad-Darda when he had stopped eating and sleeping to devote himself entirely to worship. The Prophet صلى الله عليه وسلم ratified it as truth rather than excess: the body’s claim on you does not lapse because you have stopped feeling it deserves one.',
    propheticPractice: {
      description: "Give your body one right it is owed today — food, sleep, or rest — before deciding whether you've earned it",
      source: 'Sahih al-Bukhari 1968',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_crisis_6',
    type: 'Hadith',
    primaryText: 'No fatigue, nor disease, nor sorrow, nor sadness, nor hurt, nor distress befalls a Muslim, even if it were the prick he receives from a thorn, but that Allah expiates some of his sins for that.',
    arabicText: 'مَا يُصِيبُ الْمُسْلِمَ مِنْ نَصَبٍ وَلاَ وَصَبٍ وَلاَ هَمٍّ وَلاَ حُزْنٍ وَلاَ أَذًى وَلاَ غَمٍّ حَتَّى الشَّوْكَةِ يُشَاكُهَا، إِلاَّ كَفَّرَ اللَّهُ بِهَا مِنْ خَطَايَاهُ',
    translation: 'No fatigue, nor disease, nor sorrow, nor sadness, nor hurt, nor distress befalls a Muslim, even if it were the prick he receives from a thorn, but that Allah expiates some of his sins for that.',
    englishTranslation: 'No fatigue, nor disease, nor sorrow, nor sadness, nor hurt, nor distress befalls a Muslim, even if it were the prick he receives from a thorn, but that Allah expiates some of his sins for that.',
    source: 'Sahih al-Bukhari 5642',
    transliteration: 'Ma yusibul-muslima min nasabin wa la wasabin wa la hammin wa la huznin wa la adhan wa la ghammin hatta ash-shawkati yushakuha illa kaffara Allahu biha min khatayahu',
    whyThis: 'Abu Sa’id al-Khudri and Abu Huraira both narrated this. Sorrow and sadness are named here in the same breath as a thorn prick — things that happen to a believer, listed by name, not treated as a verdict on his faith.',
    propheticPractice: {
      description: 'Name one thing that is genuinely holding today up, however small, alongside the hardship rather than after it',
      source: 'Sahih al-Bukhari 5642',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_crisis_7',
    type: 'Hadith',
    primaryText: 'The example of the one who celebrates the praises of his Lord in comparison to the one who does not celebrate the praises of his Lord, is that of a living creature compared to a dead one.',
    arabicText: 'مَثَلُ الَّذِي يَذْكُرُ رَبَّهُ وَالَّذِي لاَ يَذْكُرُ مَثَلُ الْحَىِّ وَالْمَيِّتِ',
    translation: 'The example of the one who celebrates the Praises of his Lord (Allah) in comparison to the one who does not celebrate the Praises of his Lord, is that of a living creature compared to a dead one.',
    englishTranslation: 'The example of the one who celebrates the Praises of his Lord (Allah) in comparison to the one who does not celebrate the Praises of his Lord, is that of a living creature compared to a dead one.',
    source: 'Sahih al-Bukhari 6407',
    transliteration: 'Mathalul-ladhee yadhkuru rabbahu wal-ladhee la yadhkuru mathalul-hayyi wal-mayyit',
    whyThis: 'Abu Musa narrated this from the Prophet صلى الله عليه وسلم. It is a claim about return, not intensity — a heart that keeps coming back to remembrance stays a living one, regardless of how small each return is.',
    propheticPractice: {
      description: 'Write the smallest daily dhikr you could genuinely keep on your worst day, and tell one person what it is',
      source: 'Sahih al-Bukhari 6407',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_marriage_2',
    type: 'Hadith',
    primaryText:
      'A woman is married for four things: her wealth, her family status, her beauty, and her religion. So you should marry the religious woman, otherwise you will be a loser.',
    arabicText:
      'تُنْكَحُ الْمَرْأَةُ لِأَرْبَعٍ لِمَالِهَا وَلِحَسَبِهَا وَجَمَالِهَا وَلِدِينِهَا فَاظْفَرْ بِذَاتِ الدِّينِ تَرِبَتْ يَدَاكَ',
    translation:
      'A woman is married for four things: her wealth, her family status, her beauty, and her religion. So you should marry the religious woman, otherwise you will be a loser.',
    englishTranslation:
      'A woman is married for four things: her wealth, her family status, her beauty, and her religion. So you should marry the religious woman, otherwise you will be a loser.',
    source: 'Sahih al-Bukhari 5090',
    transliteration: "Tunkahu al-mar'atu li-arba'in: limaliha, wa lihasabiha, wa jamaliha, wa lidiniha, fazfar bidhati ad-din taribat yadak",
    whyThis:
      "Abu Huraira narrated this from the Prophet ﷺ, naming the four reasons people commonly marry, in the order most people actually rank them — and then correcting the order directly.",
    propheticPractice: {
      description: 'Weigh religion and character first when evaluating a prospective spouse, ahead of wealth, beauty, or family status',
      source: 'Sahih al-Bukhari 5090',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_marriage_3',
    type: 'Hadith',
    primaryText:
      "Allah has written for the son of Adam his portion of adultery, which he will inevitably meet. The adultery of the eye is the look, the adultery of the ear is listening, the adultery of the tongue is speech, the adultery of the hand is the touch, and the adultery of the feet are the steps he walks — and the heart wishes and desires, and the private parts confirm that or deny it.",
    arabicText:
      'كُتِبَ عَلَى ابْنِ آدَمَ نَصِيبُهُ مِنَ الزِّنَا مُدْرِكٌ ذَلِكَ لاَ مَحَالَةَ فَزِنَا الْعَيْنِ النَّظَرُ وَزِنَا اللِّسَانِ الْمَنْطِقُ وَالنَّفْسُ تَمَنَّى وَتَشْتَهِى وَالْفَرْجُ يُصَدِّقُ ذَلِكَ كُلَّهُ أَوْ يُكَذِّبُهُ',
    translation:
      "Allah fixed the very portion of adultery which a man will indulge in. There would be no escape from it. The adultery of the eye is the lustful look and the adultery of the ears is listening to voluptuous talk and the adultery of the tongue is licentious speech and the adultery of the hand is the lustful grip and the adultery of the feet is to walk to the place where he intends to commit adultery, and the heart yearns and desires, which he may or may not put into effect.",
    englishTranslation:
      "Allah fixed the very portion of adultery which a man will indulge in. There would be no escape from it. The adultery of the eye is the lustful look and the adultery of the ears is listening to voluptuous talk and the adultery of the tongue is licentious speech and the adultery of the hand is the lustful grip and the adultery of the feet is to walk to the place where he intends to commit adultery, and the heart yearns and desires, which he may or may not put into effect.",
    source: 'Sahih Muslim 2658a',
    transliteration: "Kutiba 'ala ibni Adama nasibuhu min az-zina, mudrikun dhalika la mahalata, fazina al-'ayni an-nazar, wa zina al-lisani al-mantiq, wan-nafsu tatamanna wa tashtahi, wal-farju yusaddiqu dhalika kullahu aw yukadhdhibuhu",
    whyThis:
      "Abu Huraira reported this from the Prophet ﷺ, describing how a search for a spouse can drift into what it was never meant to be — one look, one exchange, one meeting — long before anything is decided.",
    propheticPractice: {
      description: 'Set a concrete, nameable boundary for how the search is conducted, and keep someone informed of it',
      source: 'Sahih Muslim 2658a',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_marriage_4',
    type: 'Hadith',
    primaryText:
      "The Prophet ﷺ used to teach us the istikharah for every matter, just as he taught us a surah from the Qur'an: \"If any of you intends to do something, let him pray two rak'ahs other than the obligatory prayer, then say: O Allah, I seek Your guidance through Your knowledge, and I seek ability through Your power, and I ask You from Your great bounty, for You have power and I have none, and You know and I do not, and You are the Knower of the unseen...\"",
    arabicText:
      'كَانَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ يُعَلِّمُنَا الاِسْتِخَارَةَ فِي الأُمُورِ كُلِّهَا كَالسُّورَةِ مِنَ الْقُرْآنِ يَقُولُ إِذَا هَمَّ أَحَدُكُمْ بِالأَمْرِ فَلْيَرْكَعْ رَكْعَتَيْنِ مِنْ غَيْرِ الْفَرِيضَةِ ثُمَّ لِيَقُلِ اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ فَإِنَّكَ تَقْدِرُ وَلاَ أَقْدِرُ وَتَعْلَمُ وَلاَ أَعْلَمُ وَأَنْتَ عَلاَّمُ الْغُيُوبِ',
    translation:
      "The Prophet (ﷺ) used to teach us the Istikhara for each and every matter, as he taught us the Suras from the Holy Qur'an. He used to say: If anyone of you intends to do something, he should offer a two-rak'at prayer other than the obligatory prayer, and then say the du'a of istikharah, mentioning his matter (need) at the end of it.",
    englishTranslation:
      "The Prophet (ﷺ) used to teach us the Istikhara for each and every matter, as he taught us the Suras from the Holy Qur'an. He used to say: If anyone of you intends to do something, he should offer a two-rak'at prayer other than the obligatory prayer, and then say the du'a of istikharah, mentioning his matter (need) at the end of it.",
    source: 'Sahih al-Bukhari 6382',
    transliteration: "Kana Rasulullahi (ﷺ) yu'allimuna al-istikharata fil-umuri kulliha kas-surati minal-Qur'an",
    whyThis:
      "Jabir ibn Abdullah narrated that the Prophet ﷺ taught istikharah as a standing practice for every significant decision, not a special-occasion prayer reserved for major life events alone.",
    propheticPractice: {
      description: "Pray two voluntary rak'ahs and make the du'a of istikharah before your next serious step forward in the search",
      source: 'Sahih al-Bukhari 6382',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_marriage_8',
    type: 'Hadith',
    primaryText: "Al-Mughirah ibn Shu'bah proposed to a woman, so the Prophet ﷺ said: \"Look at her, for indeed that is more likely to make things lasting between the two of you.\"",
    arabicText: 'أَنَّ الْمُغِيرَةَ بْنَ شُعْبَةَ خَطَبَ امْرَأَةً فَقَالَ لَهُ النَّبِيُّ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ انْظُرْ إِلَيْهَا فَإِنَّهُ أَحْرَى أَنْ يُؤْدَمَ بَيْنَكُمَا',
    translation:
      "Bakr bin Abdullah Al-Muzani narrated that Al-Mughirah bin Shu'bah proposed to a woman, so the Prophet said: \"Look at her, for indeed that is more likely to make things better between the two of you.\"",
    englishTranslation:
      "Bakr bin Abdullah Al-Muzani narrated that Al-Mughirah bin Shu'bah proposed to a woman, so the Prophet said: \"Look at her, for indeed that is more likely to make things better between the two of you.\"",
    source: 'Jami at-Tirmidhi 1087',
    transliteration: "Anna al-Mughirata bna Shu'batin khataba imra'atan faqala lahu an-Nabiyyu (ﷺ): unzur ilayha fa-innahu ahra an yu'dama baynakuma",
    whyThis:
      "Narrated by Bakr ibn Abdullah al-Muzani, this hadith records the Prophet ﷺ directing a companion to see his prospective wife for himself rather than decide from a description alone — graded sahih by Al-Albani, Ahmad Shakir, and Zubair Ali Zai.",
    propheticPractice: {
      description: 'See the person clearly for yourself before committing, rather than deciding from descriptions alone',
      source: 'Jami at-Tirmidhi 1087',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_marriage_9',
    type: 'Hadith',
    primaryText:
      "O young people, whoever among you can marry, should marry, for it helps him lower his gaze and guard his chastity. And whoever cannot, let him fast, for it will be a shield for him.",
    arabicText: 'يَا مَعْشَرَ الشَّبَابِ مَنِ اسْتَطَاعَ مِنْكُمُ الْبَاءَةَ فَلْيَتَزَوَّجْ فَإِنَّهُ أَغَضُّ لِلْبَصَرِ وَأَحْصَنُ لِلْفَرْجِ وَمَنْ لَمْ يَسْتَطِعْ فَعَلَيْهِ بِالصَّوْمِ فَإِنَّهُ لَهُ وِجَاءٌ',
    translation:
      "We were with the Prophet (ﷺ) while we were young and had no wealth. So Allah's Messenger (ﷺ) said, \"O young people! Whoever among you can marry, should marry, because it helps him lower his gaze and guard his modesty, and whoever is not able to marry, should fast, as fasting diminishes his desire.\"",
    englishTranslation:
      "We were with the Prophet (ﷺ) while we were young and had no wealth. So Allah's Messenger (ﷺ) said, \"O young people! Whoever among you can marry, should marry, because it helps him lower his gaze and guard his modesty, and whoever is not able to marry, should fast, as fasting diminishes his desire.\"",
    source: 'Sahih al-Bukhari 5066',
    transliteration: "Ya ma'shara ash-shabab, man istata'a minkumul-ba'ata falyatazawwaj, fa-innahu aghaddu lil-basari wa ahsanu lil-farji, wa man lam yastati' fa'alayhi bis-sawmi fa-innahu lahu wija'",
    whyThis:
      "Abdullah ibn Mas'ud narrated this, recalling the Prophet ﷺ addressing young companions who had no wealth yet — this instruction was given to people in exactly that stage of waiting, not to people who already had everything arranged.",
    propheticPractice: {
      description: 'If self-control is difficult while waiting, fast a voluntary day this week as the shield the Prophet ﷺ named',
      source: 'Sahih al-Bukhari 5066',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_marriage_12',
    type: 'Hadith',
    primaryText: "The best of you is the best to his wives, and I am the best of you to my wives.",
    arabicText: 'خِيَارُكُمْ خِيَارُكُمْ لِنِسَائِهِمْ وَأَنَا خَيْرُكُمْ لِأَهْلِي',
    translation:
      "The best of you is the best to his wives, and I am the best of you to my wives, and when your companion dies, leave him alone.",
    englishTranslation:
      "The best of you is the best to his wives, and I am the best of you to my wives, and when your companion dies, leave him alone.",
    source: 'Jami at-Tirmidhi 3895',
    transliteration: "Khiyarukum khiyarukum linisa'ihim, wa ana khayrukum li-ahli",
    whyThis:
      "Narrated by Aisha (may Allah be pleased with her), who lived this treatment directly — the Prophet ﷺ named himself, not a companion, as the standard for how a spouse should be treated. Graded sahih/hasan sahih across multiple gradings.",
    propheticPractice: {
      description: 'Write down three specific, concrete habits you intend to practice in how you will treat a spouse',
      source: 'Jami at-Tirmidhi 3895',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_tawbah_1',
    type: 'Hadith',
    primaryText: 'O son of Adam, as long as you called upon Me and hoped in Me, I forgave you — and I did not mind.',
    arabicText: 'قَالَ اللَّهُ يَا ابْنَ آدَمَ إِنَّكَ مَا دَعَوْتَنِي وَرَجَوْتَنِي غَفَرْتُ لَكَ عَلَى مَا كَانَ فِيكَ وَلاَ أُبَالِي، يَا ابْنَ آدَمَ لَوْ بَلَغَتْ ذُنُوبُكَ عَنَانَ السَّمَاءِ ثُمَّ اسْتَغْفَرْتَنِي غَفَرْتُ لَكَ وَلاَ أُبَالِي، يَا ابْنَ آدَمَ إِنَّكَ لَوْ أَتَيْتَنِي بِقُرَابِ الأَرْضِ خَطَايَا ثُمَّ لَقِيتَنِي لاَ تُشْرِكُ بِي شَيْئًا لأَتَيْتُكَ بِقُرَابِهَا مَغْفِرَةً',
    translation: "Allah, Blessed is He and Most High, said: 'O son of Adam! Verily as long as you called upon Me and hoped in Me, I forgave you, despite whatever may have occurred from you, and I did not mind. O son of Adam! Were your sins to reach the clouds of the sky, then you sought forgiveness from Me, I would forgive you, and I would not mind. So son of Adam! If you came to me with sins nearly as great as the earth, and then you met Me not associating anything with Me, I would come to you with forgiveness nearly as great as it.'",
    englishTranslation: "Allah, Blessed is He and Most High, said: 'O son of Adam! Verily as long as you called upon Me and hoped in Me, I forgave you, despite whatever may have occurred from you, and I did not mind. O son of Adam! Were your sins to reach the clouds of the sky, then you sought forgiveness from Me, I would forgive you, and I would not mind. So son of Adam! If you came to me with sins nearly as great as the earth, and then you met Me not associating anything with Me, I would come to you with forgiveness nearly as great as it.'",
    source: 'Jami at-Tirmidhi 3540',
    whyThis: 'Anas ibn Malik narrated this as a hadith qudsi — Allah speaking in the first person. Three escalating cases are named, each larger than the last, and each answered with the same word: forgiveness. The clause carrying the weight is the repeated "and I did not mind" — the forgiving is not reluctant.',
    propheticPractice: {
      description: "Read the three cases in order and notice that the sin's size is never the variable — only whether you turned back",
      source: 'Jami at-Tirmidhi 3540',
    },
    moods: [],
  },
  {
    id: 'hadith_tawbah_2',
    type: 'Hadith',
    primaryText: 'Every son of Adam sins, and the best of the sinners are the repentant.',
    arabicText: 'كُلُّ ابْنِ آدَمَ خَطَّاءٌ وَخَيْرُ الْخَطَّائِينَ التَّوَّابُونَ',
    translation: 'Every son of Adam sins, and the best of the sinners are the repentant.',
    englishTranslation: 'Every son of Adam sins, and the best of the sinners are the repentant.',
    source: 'Jami at-Tirmidhi 2499',
    transliteration: "Kullu ibni Adama khatta'un, wa khayru al-khatta'ina at-tawwabun",
    whyThis: 'Anas narrated this from the Prophet ﷺ. It does not say the best people are those who never sin — it places the repentant at the top of a category everyone is already inside. Sinning is stated as the human baseline, not as disqualification.',
    propheticPractice: {
      description: "Say the sin's name to yourself plainly, without softening it and without adding a verdict about your worth",
      source: 'Jami at-Tirmidhi 2499',
    },
    moods: [],
  },
  {
    id: 'hadith_tawbah_3',
    type: 'Hadith',
    primaryText: 'Allah is more pleased with the repentance of His slave than a man who finds the lost camel he had given up on in the desert.',
    arabicText: 'اللَّهُ أَفْرَحُ بِتَوْبَةِ عَبْدِهِ مِنْ أَحَدِكُمْ سَقَطَ عَلَى بَعِيرِهِ، وَقَدْ أَضَلَّهُ فِي أَرْضِ فَلاَةٍ',
    translation: 'Allah is more pleased with the repentance of His slave than anyone of you is pleased with finding his camel which he had lost in the desert.',
    englishTranslation: 'Allah is more pleased with the repentance of His slave than anyone of you is pleased with finding his camel which he had lost in the desert.',
    source: 'Sahih al-Bukhari 6309',
    transliteration: 'Allahu afrahu bi-tawbati abdihi min ahadikum saqata ala bairihi, wa qad adallahu fi ardin falatin',
    whyThis: "Anas ibn Malik narrated this. The image is deliberate: in the desert that camel carried the man's water and provisions, so finding it is not mild relief — it is the moment he learns he will live. That is the emotion the hadith attaches to your return.",
    propheticPractice: {
      description: 'Approach the return expecting to be received rather than merely tolerated',
      source: 'Sahih al-Bukhari 6309',
      grading: 'Sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_tawbah_4',
    type: 'Hadith',
    primaryText: 'The most superior way of asking forgiveness from Allah is Sayyid al-Istighfar.',
    arabicText: 'اللَّهُمَّ أَنْتَ رَبِّي، لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَىَّ وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ',
    translation: 'The most superior way of asking for forgiveness from Allah is: O Allah, You are my Lord, there is none worthy of worship except You. You have created me, and I am Your servant, and I am faithful to Your covenant and promise as much as I can. I seek refuge in You from the evil of what I have done. I acknowledge Your blessings upon me, and I admit my sins. So forgive me, for none forgives sins except You.',
    englishTranslation: 'The most superior way of asking for forgiveness from Allah is: O Allah, You are my Lord, there is none worthy of worship except You. You have created me, and I am Your servant, and I am faithful to Your covenant and promise as much as I can. I seek refuge in You from the evil of what I have done. I acknowledge Your blessings upon me, and I admit my sins. So forgive me, for none forgives sins except You.',
    source: 'Sahih al-Bukhari 6306',
    transliteration: "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana abduka, wa ana ala ahdika wa wadika mastatatu, audhu bika min sharri ma sanatu, abu'u laka bi-nimatika alayya, wa abu'u laka bi-dhanbi, faghfir li fa-innahu la yaghfiru adh-dhunuba illa anta",
    whyThis: 'Shaddad ibn Aws narrated it. The Prophet ﷺ named it sayyid al-istighfar — the master of asking forgiveness — and its wording is why: it opens by acknowledging Allah’s lordship, admits the covenant is kept only as much as one is able, and confesses the favour and the sin in the same breath before asking. The same hadith adds that whoever says it by day with certainty and dies before evening, or says it by night and dies before morning, is among the people of Paradise.',
    propheticPractice: {
      description: 'Recite Sayyid al-Istighfar once each morning and once each evening, with attention to its wording',
      source: 'Sahih al-Bukhari 6306',
      grading: 'Sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_tawbah_5',
    type: 'Hadith',
    primaryText: "When a servant commits a sin, performs ablution well, prays two rak'ahs and asks pardon of Allah, Allah pardons him.",
    arabicText: 'مَا مِنْ عَبْدٍ يُذْنِبُ ذَنْبًا فَيُحْسِنُ الطُّهُورَ ثُمَّ يَقُومُ فَيُصَلِّي رَكْعَتَيْنِ ثُمَّ يَسْتَغْفِرُ اللَّهَ إِلاَّ غَفَرَ اللَّهُ لَهُ',
    translation: "When a servant (of Allah) commits a sin, and he performs ablution well, and then stands and prays two rak'ahs, and asks pardon of Allah, Allah pardons him.",
    englishTranslation: "When a servant (of Allah) commits a sin, and he performs ablution well, and then stands and prays two rak'ahs, and asks pardon of Allah, Allah pardons him.",
    source: 'Sunan Abi Dawud 1521',
    transliteration: 'Ma min abdin yudhnibu dhanban fa-yuhsinu at-tuhura thumma yaqumu fa-yusalli rakatayni thumma yastaghfiru Allaha illa ghafara Allahu lahu',
    whyThis: 'Ali narrated it from Abu Bakr as-Siddiq, of whom he said that Abu Bakr narrated truthfully. This is the basis for salat al-tawbah. Abu Bakr adds that the Prophet ﷺ then recited Al Imran 3:135 — the same ayah this day is built on — so the hadith and the verse were joined by the Prophet ﷺ himself, not by a later editor.',
    propheticPractice: {
      description: "After a sin: make wudu carefully, pray two rak'ahs, then ask Allah's forgiveness",
      source: 'Sunan Abi Dawud 1521',
    },
    moods: [],
  },
  {
    id: 'hadith_tawbah_6',
    type: 'Hadith',
    primaryText: 'The one who repents from sin is like one who did not sin.',
    arabicText: 'التَّائِبُ مِنَ الذَّنْبِ كَمَنْ لاَ ذَنْبَ لَهُ',
    translation: 'The one who repents from sin is like one who did not sin.',
    englishTranslation: 'The one who repents from sin is like one who did not sin.',
    source: 'Sunan Ibn Majah 4250',
    transliteration: "At-ta'ibu mina adh-dhanbi ka-man la dhanba lahu",
    whyThis: "Narrated from Abdullah ibn Mas'ud. The comparison is to someone with no sin at all — not to someone whose sentence was reduced. It answers the question that keeps people from repenting sincerely: whether the record still shows it afterwards.",
    propheticPractice: {
      description: 'Stop re-prosecuting a sin you have already repented from',
      source: 'Sunan Ibn Majah 4250',
    },
    moods: [],
  },
  {
    id: 'hadith_tawbah_7',
    type: 'Hadith',
    primaryText: 'Whoever has wronged another in his reputation or anything else should seek his pardon today, before the Day when there is no money.',
    arabicText: 'مَنْ كَانَتْ لَهُ مَظْلَمَةٌ لأَحَدٍ مِنْ عِرْضِهِ أَوْ شَىْءٍ فَلْيَتَحَلَّلْهُ مِنْهُ الْيَوْمَ، قَبْلَ أَنْ لاَ يَكُونَ دِينَارٌ وَلاَ دِرْهَمٌ، إِنْ كَانَ لَهُ عَمَلٌ صَالِحٌ أُخِذَ مِنْهُ بِقَدْرِ مَظْلَمَتِهِ، وَإِنْ لَمْ تَكُنْ لَهُ حَسَنَاتٌ أُخِذَ مِنْ سَيِّئَاتِ صَاحِبِهِ فَحُمِلَ عَلَيْهِ',
    translation: 'Whoever has oppressed another person concerning his reputation or anything else, he should beg him to forgive him before the Day of Resurrection when there will be no money (to compensate for wrong deeds), but if he has good deeds, those good deeds will be taken from him according to his oppression which he has done, and if he has no good deeds, the sins of the oppressed person will be loaded on him.',
    englishTranslation: 'Whoever has oppressed another person concerning his reputation or anything else, he should beg him to forgive him before the Day of Resurrection when there will be no money (to compensate for wrong deeds), but if he has good deeds, those good deeds will be taken from him according to his oppression which he has done, and if he has no good deeds, the sins of the oppressed person will be loaded on him.',
    source: 'Sahih al-Bukhari 2449',
    whyThis: 'Abu Huraira narrated it. The word the Prophet ﷺ used is al-yawma — today. The hadith describes a settlement that happens either now, in a currency you can still pay, or later in one you cannot.',
    propheticPractice: {
      description: 'Name one person you actually wronged, and settle it with them directly while settlement is still cheap',
      source: 'Sahih al-Bukhari 2449',
      grading: 'Sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_tawbah_8',
    type: 'Hadith',
    primaryText: 'Have taqwa of Allah wherever you are, and follow an evil deed with a good one to wipe it out.',
    arabicText: 'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ',
    translation: 'Have Taqwa of Allah wherever you are, and follow an evil deed with a good one to wipe it out, and treat the people with good behavior.',
    englishTranslation: 'Have Taqwa of Allah wherever you are, and follow an evil deed with a good one to wipe it out, and treat the people with good behavior.',
    source: 'Jami at-Tirmidhi 1987',
    transliteration: "Ittaqi Allaha haythuma kunta, wa atbii as-sayyi'ata al-hasanata tamhuha, wa khaliqi an-nasa bi-khuluqin hasanin",
    whyThis: 'Abu Dharr narrated this instruction, which the Prophet ﷺ addressed to him personally. Al-Tirmidhi records it as hasan sahih. Note the order: the good deed follows the bad one, so the instruction assumes the sin already happened and tells you what to do next rather than only what to avoid.',
    propheticPractice: {
      description: 'Immediately after a sin, do one specific good deed rather than only feeling bad about it',
      source: 'Jami at-Tirmidhi 1987',
      grading: 'Hasan sahih (as graded by al-Tirmidhi)',
    },
    moods: [],
  },
  {
    id: 'hadith_tawbah_9',
    type: 'Hadith',
    primaryText: 'My slave has known that he has a Lord who forgives sins and punishes for them — I have forgiven My slave.',
    arabicText: 'أَعَلِمَ عَبْدِي أَنَّ لَهُ رَبًّا يَغْفِرُ الذَّنْبَ وَيَأْخُذُ بِهِ غَفَرْتُ لِعَبْدِي',
    translation: 'My slave has known that he has a Lord who forgives sins and punishes for it, I therefore have forgiven my slave (his sins).',
    englishTranslation: 'My slave has known that he has a Lord who forgives sins and punishes for it, I therefore have forgiven my slave (his sins).',
    source: 'Sahih al-Bukhari 7507',
    whyThis: 'Abu Huraira narrated this hadith qudsi. The closing phrase — "he can do whatever he likes" — is not permission to sin. Ibn Hajar records in Fath al-Bari that it means: so long as he continues in this way, sinning and then returning and seeking forgiveness, Allah will continue to forgive him. The cycle described is sin, return, sin, return — and it is the returning, not the sinning, that is being licensed.',
    propheticPractice: {
      description: 'After a relapse, return the same way you returned the first time, without treating the repeat as disqualifying',
      source: 'Sahih al-Bukhari 7507',
      grading: 'Sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_tawbah_10',
    type: 'Hadith',
    primaryText: 'There is at times some sort of shade upon my heart, and I seek forgiveness from Allah a hundred times a day.',
    arabicText: 'إِنَّهُ لَيُغَانُ عَلَى قَلْبِي وَإِنِّي لأَسْتَغْفِرُ اللَّهَ فِي الْيَوْمِ مِائَةَ مَرَّةٍ',
    translation: 'There is (at times) some sort of shade upon my heart, and I seek forgiveness from Allah a hundred times a day.',
    englishTranslation: 'There is (at times) some sort of shade upon my heart, and I seek forgiveness from Allah a hundred times a day.',
    source: 'Sahih Muslim 2702',
    transliteration: "Innahu la-yughanu ala qalbi, wa inni la-astaghfiru Allaha fi al-yawmi mi'ata marratin",
    whyThis: 'Al-Agharr al-Muzani, a Companion, narrated it. The one saying this is the Prophet ﷺ, whose sins were forgiven. So istighfar here cannot be a penalty being served — it is the daily practice of a heart being kept clear, which is what makes a hundred times a day intelligible.',
    propheticPractice: {
      description: 'Make istighfar a daily fixed practice rather than something reserved for after a sin',
      source: 'Sahih Muslim 2702',
      grading: 'Sahih',
    },
    moods: [],
  },
  // === DEATH AWARENESS JOURNEY HADITH ===
  // Referenced by step_death_3..7 in staticPaths.ts. Days 1-2 are verse +
  // tafsir led and carry no hadith. Every Arabic matn below is fetched
  // verbatim (mirror / sunnah.com) — see scripts and the design spec.
  {
    id: 'hadith_death_3',
    type: 'Hadith',
    primaryText: 'Remember often the destroyer of pleasures — meaning death.',
    arabicText: 'أَكْثِرُوا ذِكْرَ هَاذِمِ اللَّذَّاتِ',
    translation: 'Increase in remembrance of the severer of pleasures. Meaning death.',
    englishTranslation:
      'Increase in remembrance of the severer of pleasures. Meaning death.',
    source: "Jami' at-Tirmidhi 2307",
    transliteration: 'Akthirū dhikra hādhimi l-ladhdhāt (yaʿnī l-mawt)',
    whyThis:
      'Abu Hurayra narrated it. Tirmidhi graded it hasan gharib; al-Albani graded it hasan, and Ibn Majah and an-Nasa’i narrate it as well. The instruction is frequency, not intensity — a brief, repeated thought that resets your aim rather than a spiral you have to brace for.',
    propheticPractice: {
      description:
        'Bring a short thought of death to mind several times a day, letting it reorder the decision in front of you',
      source: "Jami' at-Tirmidhi 2307",
      grading: 'hasan',
    },
    moods: [],
  },
  {
    id: 'hadith_death_4',
    type: 'Hadith',
    primaryText:
      'On going to bed: "With Your name, O Allah, I die and I live." On waking: "All praise is for Allah who gave us life after causing us to die, and to Him is the resurrection."',
    arabicText: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا، وَإِذَا اسْتَيْقَظَ مِنْ مَنَامِهِ قَالَ الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا، وَإِلَيْهِ النُّشُورُ',
    translation:
      'Whenever the Prophet ﷺ intended to go to bed, he would recite: "Bismika Allahumma amutu wa ahya (With Your name, O Allah, I die and I live)." And when he woke up from his sleep, he would say: "Al-hamdu lil-lahil-ladhi ahyana ba\'da ma amatana; wa ilaihi an-nushur (All the Praises are for Allah Who has made us alive after He made us die (sleep) and unto Him is the Resurrection)."',
    englishTranslation:
      'Whenever the Prophet ﷺ intended to go to bed, he would recite: "Bismika Allahumma amutu wa ahya (With Your name, O Allah, I die and I live)." And when he woke up from his sleep, he would say: "Al-hamdu lil-lahil-ladhi ahyana ba\'da ma amatana; wa ilaihi an-nushur (All the Praises are for Allah Who has made us alive after He made us die (sleep) and unto Him is the Resurrection)."',
    source: 'Sahih al-Bukhari 6324',
    transliteration:
      'Bismika Allāhumma amūtu wa aḥyā — Al-ḥamdu lillāhi-lladhī aḥyānā baʿda mā amātanā wa ilayhi n-nushūr',
    whyThis:
      'Hudhayfa reported it. The waking words state the sleep–death link outright: ahyana ba’da ma amatana, "gave us life after having caused us to die." Both thresholds — sleeping and waking — are named as a death and a return.',
    propheticPractice: {
      description:
        'Make these the literal last and first words of the day — phone down before the first, nothing reached for before the second',
      source: 'Sahih al-Bukhari 6324',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_death_5',
    type: 'Hadith',
    primaryText: 'Be in this world as if you were a stranger or a traveler.',
    arabicText: 'كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ، أَوْ عَابِرُ سَبِيلٍ',
    translation:
      "Allah's Messenger ﷺ took hold of my shoulder and said, 'Be in this world as if you were a stranger or a traveler.'",
    englishTranslation:
      "Allah's Messenger ﷺ took hold of my shoulder and said, 'Be in this world as if you were a stranger or a traveler.'",
    source: 'Sahih al-Bukhari 6416',
    transliteration: 'Kun fī d-dunyā ka-annaka gharībun aw ʿābiru sabīl',
    whyThis:
      'Ibn Umar reported it. The lines that often follow — "if you reach the evening do not wait for the morning… take from your health for your sickness and from your life for your death" — are Ibn Umar\'s own words, not the Prophet\'s ﷺ; the hadith itself marks the change of speaker. The instruction is grip, not withdrawal: hold this world the way a traveler holds a bag.',
    propheticPractice: {
      description: 'Name one thing you own that owns you back, and practise holding it more loosely',
      source: 'Sahih al-Bukhari 6416',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_death_6',
    type: 'Hadith',
    primaryText:
      'When a person dies, their deeds end except three: an ongoing charity, knowledge benefited from, or a righteous child who prays for them.',
    arabicText: 'إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ إِلاَّ مِنْ صَدَقَةٍ جَارِيَةٍ أَوْ عِلْمٍ يُنْتَفَعُ بِهِ أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ',
    translation:
      'When a man dies, his acts come to an end, but three: recurring charity, or knowledge (by which people) benefit, or a pious child, who prays for him (for the deceased).',
    englishTranslation:
      'When a man dies, his acts come to an end, but three: recurring charity, or knowledge (by which people) benefit, or a pious child, who prays for him (for the deceased).',
    source: 'Sahih Muslim 1631',
    transliteration:
      'Idhā māta l-insānu nqaṭaʿa ʿanhu ʿamaluhu illā min thalāthah: illā min ṣadaqatin jāriyah, aw ʿilmin yuntafaʿu bih, aw waladin ṣāliḥin yadʿū lah',
    whyThis:
      'Abu Hurayra narrated it. The hadith names three doors, not one — recurring charity and beneficial knowledge are open to everyone, with or without children.',
    propheticPractice: {
      description: 'Start one of the three today — a recurring charity, teaching one beneficial thing, or a line of du’a taught to a child',
      source: 'Sahih Muslim 1631',
      grading: 'sahih',
    },
    moods: [],
  },
  {
    id: 'hadith_death_7',
    type: 'Hadith',
    primaryText:
      'Loving to meet Allah is not the same as wanting to die: the Prophet ﷺ explained it is what the believer feels at the moment of death, when the good news of Allah\'s pleasure is shown to them.',
    arabicText: 'مَنْ أَحَبَّ لِقَاءَ اللَّهِ أَحَبَّ اللَّهُ لِقَاءَهُ، وَمَنْ كَرِهَ لِقَاءَ اللَّهِ كَرِهَ اللَّهُ لِقَاءَهُ، قَالَتْ عَائِشَةُ أَوْ بَعْضُ أَزْوَاجِهِ إِنَّا لَنَكْرَهُ الْمَوْتَ، قَالَ لَيْسَ ذَاكَ، وَلَكِنَّ الْمُؤْمِنَ إِذَا حَضَرَهُ الْمَوْتُ بُشِّرَ بِرِضْوَانِ اللَّهِ وَكَرَامَتِهِ، فَلَيْسَ شَىْءٌ أَحَبَّ إِلَيْهِ مِمَّا أَمَامَهُ، فَأَحَبَّ لِقَاءَ اللَّهِ وَأَحَبَّ اللَّهُ لِقَاءَهُ، وَإِنَّ الْكَافِرَ إِذَا حُضِرَ بُشِّرَ بِعَذَابِ اللَّهِ وَعُقُوبَتِهِ، فَلَيْسَ شَىْءٌ أَكْرَهَ إِلَيْهِ مِمَّا أَمَامَهُ، كَرِهَ لِقَاءَ اللَّهِ وَكَرِهَ اللَّهُ لِقَاءَهُ',
    translation:
      'The Prophet ﷺ said, "Whoever loves to meet Allah, Allah (too) loves to meet him and whoever hates to meet Allah, Allah (too) hates to meet him". Aisha, or some of the wives of the Prophet ﷺ said, "But we dislike death." He said: It is not like this, but it is meant that when the time of the death of a believer approaches, he receives the good news of Allah\'s pleasure with him and His blessings upon him, and so at that time nothing is dearer to him than what is in front of him. He therefore loves the meeting with Allah, and Allah (too) loves the meeting with him. But when the time of the death of a disbeliever approaches, he receives the evil news of Allah\'s torment and His Requital, whereupon nothing is more hateful to him than what is before him. Therefore, he hates the meeting with Allah, and Allah too, hates the meeting with him.',
    englishTranslation:
      'The Prophet ﷺ said, "Whoever loves to meet Allah, Allah (too) loves to meet him and whoever hates to meet Allah, Allah (too) hates to meet him". Aisha, or some of the wives of the Prophet ﷺ said, "But we dislike death." He said: It is not like this, but it is meant that when the time of the death of a believer approaches, he receives the good news of Allah\'s pleasure with him and His blessings upon him, and so at that time nothing is dearer to him than what is in front of him. He therefore loves the meeting with Allah, and Allah (too) loves the meeting with him. But when the time of the death of a disbeliever approaches, he receives the evil news of Allah\'s torment and His Requital, whereupon nothing is more hateful to him than what is before him. Therefore, he hates the meeting with Allah, and Allah too, hates the meeting with him.',
    source: 'Sahih al-Bukhari 6507',
    transliteration:
      'Man aḥabba liqāʾa llāhi aḥabba llāhu liqāʾah, wa man kariha liqāʾa llāhi kariha llāhu liqāʾah',
    whyThis:
      'Ubada ibn as-Samit narrated it. The clarification is the point: Aisha objected that they all dislike death, and the Prophet ﷺ answered that loving the meeting is not wanting to die — it is what the believer feels at the threshold itself, when Allah\'s pleasure is shown to them.',
    propheticPractice: {
      description: 'Reframe death as a meeting — name who you are meeting and what you hope is said to you',
      source: 'Sahih al-Bukhari 6507',
      grading: 'sahih',
    },
    moods: [],
  },
];
