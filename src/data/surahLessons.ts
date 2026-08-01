/**
 * Surahs a journey day asks the user to LEARN, each rendered on its own layer.
 *
 * Distinct from the verse layer, which shows the single ayah that day's lesson
 * is built on. Prayer Leadership repeatedly says "learn Al-A'la and
 * Al-Ghashiyah" or "then An-Nas" and, before this existed, gave the user
 * nowhere to actually read them — the instruction named a surah the app never
 * showed.
 *
 * Arabic, transliteration and translation are byte-exact quran.com API output
 * (text_uthmani, word-by-word transliteration, Sahih International). Generated,
 * not hand-typed; regenerate rather than editing the ayah text in place.
 */

export interface SurahAyah {
  n: number;
  arabic: string;
  transliteration: string;
  translation: string;
}

export interface SurahLesson {
  id: string;
  number: number;
  name: string;
  arabicName: string;
  translatedName: string;
  versesCount: number;
  /** Why it is on the list for someone learning to lead. */
  whyLearn: string;
  /** The hadith that puts it there — rendered under the header. */
  source: string;
  ayahs: SurahAyah[];
}

export const SURAH_LESSONS: Record<string, SurahLesson> = {
  surah_1: {
    id: 'surah_1',
    number: 1,
    name: 'Al-Fatihah',
    arabicName: 'الفاتحة',
    translatedName: 'The Opener',
    versesCount: 7,
    whyLearn:
      'The one surah that is not optional. Every rak\'ah of every prayer is built on it, and when you lead it is the only thing the congregation hears from you in all of them.',
    source:
      '"Whoever does not recite Al-Fatiha in his prayer, his prayer is invalid." [Sahih al-Bukhari 756]',
    ayahs: [
      { n: 1, arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', transliteration: 'bis\'mi l-lahi l-raḥmāni l-raḥīmi', translation: 'In the name of Allāh, the Entirely Merciful, the Especially Merciful.' },
      { n: 2, arabic: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', transliteration: 'al-ḥamdu lillahi rabbi l-ʿālamīna', translation: '[All] praise is [due] to Allāh, Lord of the worlds -' },
      { n: 3, arabic: 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', transliteration: 'al-raḥmāni l-raḥīmi', translation: 'The Entirely Merciful, the Especially Merciful,' },
      { n: 4, arabic: 'مَـٰلِكِ يَوْمِ ٱلدِّينِ', transliteration: 'māliki yawmi l-dīni', translation: 'Sovereign of the Day of Recompense.' },
      { n: 5, arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', transliteration: 'iyyāka naʿbudu wa-iyyāka nastaʿīnu', translation: 'It is You we worship and You we ask for help.' },
      { n: 6, arabic: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', transliteration: 'ih\'dinā l-ṣirāṭa l-mus\'taqīma', translation: 'Guide us to the straight path -' },
      { n: 7, arabic: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', transliteration: 'ṣirāṭa alladhīna anʿamta ʿalayhim ghayri l-maghḍūbi ʿalayhim walā l-ḍālīna', translation: 'The path of those upon whom You have bestowed favor, not of those who have earned [Your] anger or of those who are astray.' },
    ],
  },
  surah_87: {
    id: 'surah_87',
    number: 87,
    name: 'Al-A\'la',
    arabicName: 'الأعلى',
    translatedName: 'The Most High',
    versesCount: 19,
    whyLearn:
      'His choice for the fullest congregations of the year. Nineteen short ayahs with a strong rhythm, and a congregation recognises it from the opening line.',
    source:
      '"The Messenger of Allah used to recite on two Eids and in Friday prayer: Glorify the name of Thy Lord, the Most High." [Sahih Muslim 878]',
    ayahs: [
      { n: 1, arabic: 'سَبِّحِ ٱسْمَ رَبِّكَ ٱلْأَعْلَى', transliteration: 'sabbiḥi is\'ma rabbika l-aʿlā', translation: 'Exalt the name of your Lord, the Most High,' },
      { n: 2, arabic: 'ٱلَّذِى خَلَقَ فَسَوَّىٰ', transliteration: 'alladhī khalaqa fasawwā', translation: 'Who created and proportioned' },
      { n: 3, arabic: 'وَٱلَّذِى قَدَّرَ فَهَدَىٰ', transliteration: 'wa-alladhī qaddara fahadā', translation: 'And who destined and [then] guided' },
      { n: 4, arabic: 'وَٱلَّذِىٓ أَخْرَجَ ٱلْمَرْعَىٰ', transliteration: 'wa-alladhī akhraja l-marʿā', translation: 'And who brings out the pasture' },
      { n: 5, arabic: 'فَجَعَلَهُۥ غُثَآءً أَحْوَىٰ', transliteration: 'fajaʿalahu ghuthāan aḥwā', translation: 'And [then] makes it black stubble.' },
      { n: 6, arabic: 'سَنُقْرِئُكَ فَلَا تَنسَىٰٓ', transliteration: 'sanuq\'ri-uka falā tansā', translation: 'We will make you recite, [O Muḥammad], and you will not forget,' },
      { n: 7, arabic: 'إِلَّا مَا شَآءَ ٱللَّهُ ۚ إِنَّهُۥ يَعْلَمُ ٱلْجَهْرَ وَمَا يَخْفَىٰ', transliteration: 'illā mā shāa l-lahu innahu yaʿlamu l-jahra wamā yakhfā', translation: 'Except what Allāh should will. Indeed, He knows what is declared and what is hidden.' },
      { n: 8, arabic: 'وَنُيَسِّرُكَ لِلْيُسْرَىٰ', transliteration: 'wanuyassiruka lil\'yus\'rā', translation: 'And We will ease you toward ease.' },
      { n: 9, arabic: 'فَذَكِّرْ إِن نَّفَعَتِ ٱلذِّكْرَىٰ', transliteration: 'fadhakkir in nafaʿati l-dhik\'rā', translation: 'So remind, if the reminder should benefit;' },
      { n: 10, arabic: 'سَيَذَّكَّرُ مَن يَخْشَىٰ', transliteration: 'sayadhakkaru man yakhshā', translation: 'He who fears [Allāh] will be reminded.' },
      { n: 11, arabic: 'وَيَتَجَنَّبُهَا ٱلْأَشْقَى', transliteration: 'wayatajannabuhā l-ashqā', translation: 'But the wretched one will avoid it' },
      { n: 12, arabic: 'ٱلَّذِى يَصْلَى ٱلنَّارَ ٱلْكُبْرَىٰ', transliteration: 'alladhī yaṣlā l-nāra l-kub\'rā', translation: '[He] who will [enter and] burn in the greatest Fire,' },
      { n: 13, arabic: 'ثُمَّ لَا يَمُوتُ فِيهَا وَلَا يَحْيَىٰ', transliteration: 'thumma lā yamūtu fīhā walā yaḥyā', translation: 'Neither dying therein nor living.' },
      { n: 14, arabic: 'قَدْ أَفْلَحَ مَن تَزَكَّىٰ', transliteration: 'qad aflaḥa man tazakkā', translation: 'He has certainly succeeded who purifies himself' },
      { n: 15, arabic: 'وَذَكَرَ ٱسْمَ رَبِّهِۦ فَصَلَّىٰ', transliteration: 'wadhakara is\'ma rabbihi faṣallā', translation: 'And mentions the name of his Lord and prays.' },
      { n: 16, arabic: 'بَلْ تُؤْثِرُونَ ٱلْحَيَوٰةَ ٱلدُّنْيَا', transliteration: 'bal tu\'thirūna l-ḥayata l-dun\'yā', translation: 'But you prefer the worldly life,' },
      { n: 17, arabic: 'وَٱلْـَٔاخِرَةُ خَيْرٌ وَأَبْقَىٰٓ', transliteration: 'wal-ākhiratu khayrun wa-abqā', translation: 'While the Hereafter is better and more enduring.' },
      { n: 18, arabic: 'إِنَّ هَـٰذَا لَفِى ٱلصُّحُفِ ٱلْأُولَىٰ', transliteration: 'inna hādhā lafī l-ṣuḥufi l-ūlā', translation: 'Indeed, this is in the former scriptures,' },
      { n: 19, arabic: 'صُحُفِ إِبْرَٰهِيمَ وَمُوسَىٰ', transliteration: 'ṣuḥufi ib\'rāhīma wamūsā', translation: 'The scriptures of Abraham and Moses.' },
    ],
  },
  surah_88: {
    id: 'surah_88',
    number: 88,
    name: 'Al-Ghashiyah',
    arabicName: 'الغاشية',
    translatedName: 'The Overwhelming',
    versesCount: 26,
    whyLearn:
      'The partner to Al-A\'la in the same hadith — he paired them on the two Eids and on Jumu\'ah. Longer than the others here, so learn it after Al-A\'la is secure.',
    source:
      '"…and: Has there come to thee the news of the overwhelming event." [Sahih Muslim 878]',
    ayahs: [
      { n: 1, arabic: 'هَلْ أَتَىٰكَ حَدِيثُ ٱلْغَـٰشِيَةِ', transliteration: 'hal atāka ḥadīthu l-ghāshiyati', translation: 'Has there reached you the report of the Overwhelming [event]?' },
      { n: 2, arabic: 'وُجُوهٌ يَوْمَئِذٍ خَـٰشِعَةٌ', transliteration: 'wujūhun yawma-idhin khāshiʿatun', translation: '[Some] faces, that Day, will be humbled,' },
      { n: 3, arabic: 'عَامِلَةٌ نَّاصِبَةٌ', transliteration: 'ʿāmilatun nāṣibatun', translation: 'Working [hard] and exhausted.' },
      { n: 4, arabic: 'تَصْلَىٰ نَارًا حَامِيَةً', transliteration: 'taṣlā nāran ḥāmiyatan', translation: 'They will [enter to] burn in an intensely hot Fire.' },
      { n: 5, arabic: 'تُسْقَىٰ مِنْ عَيْنٍ ءَانِيَةٍ', transliteration: 'tus\'qā min ʿaynin āniyatin', translation: 'They will be given drink from a boiling spring.' },
      { n: 6, arabic: 'لَّيْسَ لَهُمْ طَعَامٌ إِلَّا مِن ضَرِيعٍ', transliteration: 'laysa lahum ṭaʿāmun illā min ḍarīʿin', translation: 'For them there will be no food except from a poisonous, thorny plant' },
      { n: 7, arabic: 'لَّا يُسْمِنُ وَلَا يُغْنِى مِن جُوعٍ', transliteration: 'lā yus\'minu walā yugh\'nī min jūʿin', translation: 'Which neither nourishes nor avails against hunger.' },
      { n: 8, arabic: 'وُجُوهٌ يَوْمَئِذٍ نَّاعِمَةٌ', transliteration: 'wujūhun yawma-idhin nāʿimatun', translation: '[Other] faces, that Day, will show pleasure.' },
      { n: 9, arabic: 'لِّسَعْيِهَا رَاضِيَةٌ', transliteration: 'lisaʿyihā rāḍiyatun', translation: 'With their effort [they are] satisfied' },
      { n: 10, arabic: 'فِى جَنَّةٍ عَالِيَةٍ', transliteration: 'fī jannatin ʿāliyatin', translation: 'In an elevated garden,' },
      { n: 11, arabic: 'لَّا تَسْمَعُ فِيهَا لَـٰغِيَةً', transliteration: 'lā tasmaʿu fīhā lāghiyatan', translation: 'Wherein they will hear no unsuitable speech.' },
      { n: 12, arabic: 'فِيهَا عَيْنٌ جَارِيَةٌ', transliteration: 'fīhā ʿaynun jāriyatun', translation: 'Within it is a flowing spring.' },
      { n: 13, arabic: 'فِيهَا سُرُرٌ مَّرْفُوعَةٌ', transliteration: 'fīhā sururun marfūʿatun', translation: 'Within it are couches raised high' },
      { n: 14, arabic: 'وَأَكْوَابٌ مَّوْضُوعَةٌ', transliteration: 'wa-akwābun mawḍūʿatun', translation: 'And cups put in place' },
      { n: 15, arabic: 'وَنَمَارِقُ مَصْفُوفَةٌ', transliteration: 'wanamāriqu maṣfūfatun', translation: 'And cushions lined up' },
      { n: 16, arabic: 'وَزَرَابِىُّ مَبْثُوثَةٌ', transliteration: 'wazarābiyyu mabthūthatun', translation: 'And carpets spread around.' },
      { n: 17, arabic: 'أَفَلَا يَنظُرُونَ إِلَى ٱلْإِبِلِ كَيْفَ خُلِقَتْ', transliteration: 'afalā yanẓurūna ilā l-ibili kayfa khuliqat', translation: 'Then do they not look at the camels - how they are created?' },
      { n: 18, arabic: 'وَإِلَى ٱلسَّمَآءِ كَيْفَ رُفِعَتْ', transliteration: 'wa-ilā l-samāi kayfa rufiʿat', translation: 'And at the sky - how it is raised?' },
      { n: 19, arabic: 'وَإِلَى ٱلْجِبَالِ كَيْفَ نُصِبَتْ', transliteration: 'wa-ilā l-jibāli kayfa nuṣibat', translation: 'And at the mountains - how they are erected?' },
      { n: 20, arabic: 'وَإِلَى ٱلْأَرْضِ كَيْفَ سُطِحَتْ', transliteration: 'wa-ilā l-arḍi kayfa suṭiḥat', translation: 'And at the earth - how it is spread out?' },
      { n: 21, arabic: 'فَذَكِّرْ إِنَّمَآ أَنتَ مُذَكِّرٌ', transliteration: 'fadhakkir innamā anta mudhakkirun', translation: 'So remind, [O Muḥammad]; you are only a reminder.' },
      { n: 22, arabic: 'لَّسْتَ عَلَيْهِم بِمُصَيْطِرٍ', transliteration: 'lasta ʿalayhim bimuṣayṭirin', translation: 'You are not over them a controller.' },
      { n: 23, arabic: 'إِلَّا مَن تَوَلَّىٰ وَكَفَرَ', transliteration: 'illā man tawallā wakafara', translation: 'However, he who turns away and disbelieves' },
      { n: 24, arabic: 'فَيُعَذِّبُهُ ٱللَّهُ ٱلْعَذَابَ ٱلْأَكْبَرَ', transliteration: 'fayuʿadhibuhu l-lahu l-ʿadhāba l-akbara', translation: 'Then Allāh will punish him with the greatest punishment.' },
      { n: 25, arabic: 'إِنَّ إِلَيْنَآ إِيَابَهُمْ', transliteration: 'inna ilaynā iyābahum', translation: 'Indeed, to Us is their return.' },
      { n: 26, arabic: 'ثُمَّ إِنَّ عَلَيْنَا حِسَابَهُم', transliteration: 'thumma inna ʿalaynā ḥisābahum', translation: 'Then indeed, upon Us is their account.' },
    ],
  },
  surah_109: {
    id: 'surah_109',
    number: 109,
    name: 'Al-Kafirun',
    arabicName: 'الكافرون',
    translatedName: 'The Disbelievers',
    versesCount: 6,
    whyLearn:
      'Six ayahs, and half of the pair he recited in the two rak\'ahs before Fajr. Learning it with Al-Ikhlas gives you a complete two-rak\'ah set you never have to choose.',
    source:
      '"The Messenger of Allah recited in the two rak\'ahs of the dawn prayer: Say: O unbelievers, and Say: Allah is one." [Sahih Muslim 726]',
    ayahs: [
      { n: 1, arabic: 'قُلْ يَـٰٓأَيُّهَا ٱلْكَـٰفِرُونَ', transliteration: 'qul yāayyuhā l-kāfirūna', translation: 'Say, "O disbelievers,' },
      { n: 2, arabic: 'لَآ أَعْبُدُ مَا تَعْبُدُونَ', transliteration: 'lā aʿbudu mā taʿbudūna', translation: 'I do not worship what you worship.' },
      { n: 3, arabic: 'وَلَآ أَنتُمْ عَـٰبِدُونَ مَآ أَعْبُدُ', transliteration: 'walā antum ʿābidūna mā aʿbudu', translation: 'Nor are you worshippers of what I worship.' },
      { n: 4, arabic: 'وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ', transliteration: 'walā anā ʿābidun mā ʿabadttum', translation: 'Nor will I be a worshipper of what you worship.' },
      { n: 5, arabic: 'وَلَآ أَنتُمْ عَـٰبِدُونَ مَآ أَعْبُدُ', transliteration: 'walā antum ʿābidūna mā aʿbudu', translation: 'Nor will you be worshippers of what I worship.' },
      { n: 6, arabic: 'لَكُمْ دِينُكُمْ وَلِىَ دِينِ', transliteration: 'lakum dīnukum waliya dīni', translation: 'For you is your religion, and for me is my religion."' },
    ],
  },
  surah_114: {
    id: 'surah_114',
    number: 114,
    name: 'An-Nas',
    arabicName: 'الناس',
    translatedName: 'Mankind',
    versesCount: 6,
    whyLearn:
      'The second of the two he called the best surahs ever recited, and the one people blur into Al-Falaq under pressure because both open the same way.',
    source:
      '"Shall I not teach you two best surahs ever recited?" [Sunan Abi Dawud 1462]',
    ayahs: [
      { n: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ', transliteration: 'qul aʿūdhu birabbi l-nāsi', translation: 'Say, "I seek refuge in the Lord of mankind,' },
      { n: 2, arabic: 'مَلِكِ ٱلنَّاسِ', transliteration: 'maliki l-nāsi', translation: 'The Sovereign of mankind,' },
      { n: 3, arabic: 'إِلَـٰهِ ٱلنَّاسِ', transliteration: 'ilāhi l-nāsi', translation: 'The God of mankind,' },
      { n: 4, arabic: 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ', transliteration: 'min sharri l-waswāsi l-khanāsi', translation: 'From the evil of the retreating whisperer -' },
      { n: 5, arabic: 'ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ', transliteration: 'alladhī yuwaswisu fī ṣudūri l-nāsi', translation: 'Who whispers [evil] into the breasts of mankind -' },
      { n: 6, arabic: 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ', transliteration: 'mina l-jinati wal-nāsi', translation: 'From among the jinn and mankind".' },
    ],
  },
};

export const getSurahLesson = (id: string): SurahLesson | null => SURAH_LESSONS[id] ?? null;
