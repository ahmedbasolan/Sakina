/**
 * Pre-fetched Quran Data
 *
 * Curated Quranic verses with Arabic text, translations, and mood-specific angles.
 * This data is stored locally for offline access - no API calls needed at runtime.
 *
 * Source: Quran.com API (Sahih International)
 */

import { Content, ContentAngle, Mood } from '../types';

/**
 * Curated Quran verses for the Islamic Guidance App
 * Each verse is mapped to relevant moods with specific angles
 */
const quranContentData: Content[] = [
  // === ANXIOUS / TAWAKKUL ===
  {
    id: 'quran_93_4',
    type: 'Quran',
    primaryText: 'And the Hereafter is better for you than the first [life].',
    arabicText: 'وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ ﴿٤﴾',
    transliteration: 'Wa-lal-ākhiratu khayrun laka minal-ūlā',
    englishTranslation: 'And the Hereafter is better for you than the first [life].',
    source: 'Surah Ad-Duha 93:4',
    audioKey: '93:4',
    whyThis:
      'This verse reminds us that current difficulties are temporary and the eternal is what matters.',
    moods: ['Anxious'],
  },
  {
    id: 'quran_94_5',
    type: 'Quran',
    primaryText:
      'For indeed, with hardship [will be] ease. Indeed, with hardship [will be] ease.',
    arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٥﴾ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾',
    transliteration: "Fa-inna ma'al-'usri yusrā. Inna ma'al-'usri yusrā.",
    englishTranslation:
      'For indeed, with hardship [will be] ease. Indeed, with hardship [will be] ease.',
    source: 'Surah Ash-Sharh 94:5-6',
    audioKey: '94:5-6',
    whyThis:
      'Allah promises that ease is "with" (ma\'a) the hardship, and He repeats it to anchor your heart in certainty.',
    moods: ['Stressed'],
  },
  {
    id: 'quran_2_255',
    type: 'Quran',
    primaryText: "Allāhu lā ilāha illā huwal-ḥayyul-qayyūm, lā ta’khudhuhu sinatun wa lā nawm, lahu mā fis-samāwāti wa mā fil-’arḍ, man dhāl-ladhī yashfa‘u ‘indahu illā bi’idhnih, ya‘lamu mā bayna ’aydīhim wa mā khalfahum, wa lā yuḥīṭūna bishay’im-min ‘ilmihī illā bimā shā’, wasi‘a kursiyyuhus-samāwāti wal-’arḍ, wa lā ya’ūduhu ḥifẓuhumā wa huwal-‘aliyyul-‘aẓīm.",
    arabicText: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ ﴿٢٥٥﴾',
    transliteration: "Allāhu lā ilāha illā huwal-ḥayyul-qayyūm, lā ta’khudhuhu sinatun wa lā nawm, lahu mā fis-samāwāti wa mā fil-’arḍ, man dhāl-ladhī yashfa‘u ‘indahu illā bi’idhnih, ya‘lamu mā bayna ’aydīhim wa mā khalfahum, wa lā yuḥīṭūna bishay’im-min ‘ilmihī illā bimā shā’, wasi‘a kursiyyuhus-samāwāti wal-’arḍ, wa lā ya’ūduhu ḥifẓuhumā wa huwal-‘aliyyul-‘aẓīm.",
    englishTranslation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.',
    source: 'Surah Al-Baqarah 2:255',
    audioKey: '2:255',
    whyThis: 'The greatest verse in the Quran, providing ultimate spiritual protection and tranquility.',
    moods: ['Anxious', 'Calm'],
  },
  {
    id: 'quran_2_286',
    type: 'Quran',
    primaryText:
      "Lā yukallifullāhu nafsan illā wus'ahā. Lahā mā kasabat wa 'alayhā maktasabat. Rabbanā lā tu'ākhidhnā in nasīnā aw akhta'nā. Rabbanā wa lā tahmil 'alaynā isran kamā hamaltahu 'alal-ladhīna min qablinā. Rabbanā wa lā tuhammilnā mā lā tāqata lanā bih. Wa'fu 'annā waghfir lanā warḥamnā. Anta mawlānā fansurnā 'alal-qawmil-kāfirīn.",
    arabicText:
      'لَا يُكَلِّفُ ٱللَّهُ نَفۡسًا إِلَّا وُسۡعَهَاۚ لَهَا مَا كَسَبَتۡ وَعَلَيۡهَا مَا ٱكۡتَسَبَتۡۗ رَبَّنَا لَا تُؤَاخِذۡنَآ إِن نَّسِينَآ أَوۡ أَخۡطَأۡنَاۚ رَبَّنَا وَلَا تَحۡمِلۡ عَلَيۡنَآ إِصۡرٗا كَمَا حَمَلۡتَهُۥ عَلَى ٱلَّذِينَ مِن قَبۡلِنَاۚ رَبَّنَا وَلَا تُحَمِّنَا مَا لَا طَاقَةَ لَنَا بِهِۦۖ وَٱعۡفُ عَنَّا وَٱغۡفِرۡ لَنَا وَٱرۡحَمۡنَآۚ أَنتَ مَوۡلَىٰنَا فَٱنصُرۡنَا عَلَى ٱلۡقَوۡمِ ٱلۡكَٰفِرِينَ ﴿٢٨٦﴾',
    transliteration:
      "Lā yukallifullāhu nafsan illā wus'ahā. Lahā mā kasabat wa 'alayhā maktasabat. Rabbanā lā tu'ākhidhnā in nasīnā aw akhta'nā. Rabbanā wa lā tahmil 'alaynā isran kamā hamaltahu 'alal-ladhīna min qablinā. Rabbanā wa lā tuhammilnā mā lā tāqata lanā bih. Wa'fu 'annā waghfir lanā warḥamnā. Anta mawlānā fansurnā 'alal-qawmil-kāfirīn.",
    englishTranslation:
      'Allah does not burden a soul beyond that it can bear. It will have the consequence of what good it has gained, and it will bear the consequence of what evil it has earned. Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden like that which You laid upon those before us. Our Lord, and burden us not with that which we have no ability to bear. And pardon us; and forgive us; and have mercy upon us. You are our protector, so give us victory over the disbelieving people.',
    source: 'Surah Al-Baqarah 2:286',
    audioKey: '2:286',
    whyThis:
      'The complete verse is a powerful dua that the Prophet ﷺ taught us - combining trust in Allah with seeking His help.',
    moods: ['Anxious'],
  },
  {
    id: 'quran_65_3',
    type: 'Quran',
    primaryText:
      "Wa yarzuqhu min haythu lā yahtasib. Wa man yatawakkal 'alallāhi fahuwa hasbuh. Innallāha bālighu amrih. Qad ja'alallāhu likulli shay'in qadrā.",
    arabicText:
      'وَيَرۡزُقۡهُ مِنۡ حَيۡثُ لَا يَحۡتَسِبُۚ وَمَن يَتَوَكَّلۡ عَلَى ٱللَّهِ فَهُوَ حَسۡبُهُۥٓۚ إِنَّ ٱللَّهَ بَٰلِغُ أَمۡرِهِۦۚ قَدۡ جَعَلَ ٱللَّهُ لِكُلِّ شَيۡءٖ قَدۡرٗا ﴿٣﴾',
    transliteration:
      "Wa yarzuqhu min haythu lā yahtasib. Wa man yatawakkal 'alallāhi fahuwa hasbuh. Innallāha bālighu amrih. Qad ja'alallāhu likulli shay'in qadrā.",
    englishTranslation:
      'And provide for them from sources they could never imagine. And whoever puts their trust in Allah, then He alone is sufficient for them. Certainly Allah achieves His Will. Allah has already set a destiny for everything.',
    source: 'Surah At-Talaq 65:3',
    audioKey: '65:3',
    whyThis: 'True reliance on Allah (tawakkul) brings peace, provision, and sufficiency.',
    moods: ['Anxious'],
  },
  {
    id: 'quran_3_173',
    type: 'Quran',
    primaryText:
      "Alladhīna qāla lahumun-nāsu innan-nāsa qad jama'ū lakum fakhshawhum fazādahum īmānan wa qālū ḥasbunallāhu wa ni'mal-wakīl",
    arabicText:
      'ٱلَّذِينَ قَالَ لَهُمُ ٱلنَّاسُ إِنَّ ٱلنَّاسَ قَدۡ جَمَعُواْ لَكُمۡ فَٱخۡشَوۡهُمۡ فَزَادَهُمۡ إِيمَٰنٗا وَقَالُواْ حَسۡبُنَا ٱللَّهُ وَنِعۡمَ ٱلۡوَكِيلُ ﴿١٧٣﴾',
    transliteration:
      "Alladhīna qāla lahumun-nāsu innan-nāsa qad jama'ū lakum fakhshawhum fazādahum īmānan wa qālū ḥasbunallāhu wa ni'mal-wakīl",
    englishTranslation:
      'Those to whom hypocrites said, "Indeed, the people have gathered against you, so fear them." But it [merely] increased them in faith, and they said, "Sufficient for us is Allah, and [He is] the best Disposer of affairs."',
    source: 'Surah Ali Imran 3:173',
    audioKey: '3:173',
    whyThis:
      'This is the statement of Ibrahim (AS) when thrown into fire - ultimate trust in Allah.',
    moods: ['Anxious', 'Stressed'],
  },
  {
    id: 'quran_53_39',
    type: 'Quran',
    primaryText: "Wa an laysa lil-insāni illā mā sa'ā",
    arabicText: 'وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ ﴿٣٩﴾',
    transliteration: "Wa an laysa lil-insāni illā mā sa'ā",
    englishTranslation: 'And that there is not for man except that [good] for which he strives.',
    source: 'Surah An-Najm 53:39',
    audioKey: '53:39',
    whyThis:
      'Focus on your effort and intention; the outcome is with Allah. This brings peace to an anxious mind.',
    moods: ['Anxious'],
  },
  {
    id: 'quran_26_80',
    type: 'Quran',
    primaryText: 'Wa idhā maridtu fahuwa yashfīn',
    arabicText: 'وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ ﴿٨٠﴾',
    transliteration: 'Wa idhā maridtu fahuwa yashfīn',
    englishTranslation: 'And when I am ill, it is He who cures me.',
    source: "Surah Ash-Shu'ara 26:80",
    audioKey: '26:80',
    whyThis:
      'A reminder that ultimate healing, both physical and spiritual, comes from Allah alone.',
    moods: ['Anxious'],
  },
  {
    id: 'quran_2_257',
    type: 'Quran',
    primaryText:
      "Allāhu waliyyulladhīna āmanū yukhrijuhum minaẓ-ẓulumāti ilan-nūr. Walladhīna kafarū awliyā'uhumuṭ-ṭāghūtu yukhrijūnahum minan-nūri ilaẓ-ẓulumāt. Ulā'ika aṣḥābun-nāri hum fīhā khālidūn.",
    arabicText:
      'اللَّهُ وَلِيُّ الَّذِينَ آمَنُوا يُخْرِجُهُم مِّنَ الظُّلُمَاتِ إِلَى النُّورِ ۖ وَالَّذِينَ كَفَرُوا أَوْلِيَاؤُهُمُ الطَّاغُوتُ يُخْرِجُونَهُم مِنَ النُّورِ إِلَى الظُّلُمَاتِ ۗ أُولَٰئِكَ أَصْحَابُ النَّارِ ۖ هُمْ فِيهَا خَالِدُونَ ﴿٢٥٧﴾',
    transliteration:
      "Allāhu waliyyulladhīna āmanū yukhrijuhum minaẓ-ẓulumāti ilan-nūr. Walladhīna kafarū awliyā'uhumuṭ-ṭāghūtu yukhrijūnahum minan-nūri ilaẓ-ẓulumāt. Ulā'ika aṣḥābun-nāri hum fīhā khālidūn.",
    englishTranslation:
      'Allah is the ally of those who believe. He brings them out from darknesses into the light. And those who disbelieve - their allies are Taghut. They take them out of the light into darknesses. Those are the companions of the Fire; they will abide eternally therein.',
    source: 'Surah Al-Baqarah 2:257',
    audioKey: '2:257',
    whyThis:
      'When anxiety clouds your vision, remember that Allah Himself guides believers from darkness to light.',
    moods: ['Anxious'],
  },
  {
    id: 'quran_8_40',
    type: 'Quran',
    primaryText:
      "Wa in tawallaw fa'lamū annallāha mawlākum; ni'mal-mawlā wa ni'man-naṣīr.",
    arabicText:
      'وَإِن تَوَلَّوۡاْ فَٱعۡلَمُوٓاْ أَنَّ ٱللَّهَ مَوۡلَىٰكُمۡۚ نِعۡمَ ٱلۡمَوۡلَىٰ وَنِعۡمَ ٱلنَّصِيرُ ﴿٤٠﴾',
    transliteration:
      "Wa in tawallaw fa'lamū annallāha mawlākum; ni'mal-mawlā wa ni'man-naṣīr.",
    englishTranslation:
      'But if they turn away - then know that Allah is your protector. Excellent is the protector, and Excellent is the helper.',
    source: 'Surah Al-Anfal 8:40',
    audioKey: '8:40',
    whyThis:
      'The best Protector and the best Helper is already on your side. What is there to fear?',
    moods: ['Anxious'],
  },
  {
    id: 'quran_5_23',
    type: 'Quran',
    primaryText:
      "Qāla rajulāni minalladhīna yakhāfūna an'amallāhu 'alayhimad-khulū 'alayhimul-bāb, fa-idhā dakhaltumūhu fa-innakum ghālibūn; wa 'alallāhi fa-tawakkalū in kuntum mu'minīn.",
    arabicText:
      'قَالَ رَجُلَانِ مِنَ ٱلَّذِينَ يَخَافُونَ أَنعَمَ ٱللَّهُ عَلَيۡهِمَا ٱدۡخُلُواْ عَلَيۡهِمُ ٱلۡبَابَ فَإِذَا دَخَلۡتُمُوهُ فَإِنَّكُمۡ غَٰلِبُونَۚ وَعَلَى ٱللَّهِ فَتَوَكَّلُوٓاْ إِن كُنتُم مُّمۡؤۡمِنِينَ ﴿٢٣﴾',
    transliteration:
      "Qāla rajulāni minalladhīna yakhāfūna an'amallāhu 'alayhimad-khulū 'alayhimul-bāb, fa-idhā dakhaltumūhu fa-innakum ghālibūn; wa 'alallāhi fa-tawakkalū in kuntum mu'minīn.",
    englishTranslation:
      'Said two men from those who feared [to disobey] upon whom Allah had bestowed favor, "Enter upon them through the gate, for when you have entered it, you will be predominant. And upon Allah rely, if you should be believers."',
    source: 'Surah Al-Maidah 5:23',
    audioKey: '5:23',
    whyThis: 'Tawakkul (reliance on Allah) is not just encouraged - it is a sign of true belief.',
    moods: ['Anxious'],
  },
  {
    id: 'quran_14_12',
    type: 'Quran',
    primaryText: "Wa ma lana alla natawakkala 'alallahi wa qad hadana subulana",
    arabicText: 'وَمَا لَنَا أَلَّا نَتَوَكَّلَ عَلَى اللَّهِ وَقَدْ هَدَانَا سُبُلَنَا ﴿١٢﴾',
    transliteration: "Wa ma lana alla natawakkala 'alallahi wa qad hadana subulana",
    englishTranslation:
      'And why should we not rely upon Allah while He has guided us to our [good] ways?',
    source: 'Surah Ibrahim 14:12',
    audioKey: '14:12',
    whyThis:
      'If Allah has already guided you this far, why would you not trust Him with the rest of the journey?',
    moods: ['Anxious'],
  },
  {
    id: 'quran_8_2',
    type: 'Quran',
    primaryText:
      "Innamal-mu'minunalladhina idha dhukira-llahu wajilat qulubuhum wa idha tuliyat 'alayhim ayatuhu zadathum imanan wa 'ala rabbihim yatawakkalun",
    arabicText:
      'إِنَّمَا الْمُؤْمِنُونَ الَّذِينَ إِذَا ذُكِرَ اللَّهُ وَجِلَتْ قُلُوبُهُمْ وَإِذَا تُلِيَتْ عَلَيْهِمْ آيَاتُهُ زَادَتْهُمْ إِيمَانًا وَعَلَىٰ رَبِّهِمْ يَتَوَكَّلُونَ ﴿٢﴾',
    transliteration:
      "Innamal-mu'minunalladhina idha dhukira-llahu wajilat qulubuhum wa idha tuliyat 'alayhim ayatuhu zadathum imanan wa 'ala rabbihim yatawakkalun",
    englishTranslation:
      'The believers are only those who, when Allah is mentioned, their hearts become fearful, and when His verses are recited to them, it increases them in faith; and upon their Lord they rely.',
    source: 'Surah Al-Anfal 8:2',
    audioKey: '8:2',
    whyThis:
      'The mark of a true believer is that their heart is moved by the mention of Allah, and they rely upon Him completely.',
    moods: ['Anxious'],
  },
  {
    id: 'quran_67_29',
    type: 'Quran',
    primaryText: "Qul huwar-rahmanu amanna bihi wa 'alayhi tawakkalna",
    arabicText: 'قُلْ هُوَ الرَّحْمَٰنُ آمَنَّا بِهِ وَعَلَيْهِ تَوَكَّلْنَا ﴿٢٩﴾',
    transliteration: "Qul huwar-rahmanu amanna bihi wa 'alayhi tawakkalna",
    englishTranslation:
      'Say, "He is the Most Merciful; we have believed in Him, and upon Him we have relied."',
    source: 'Surah Al-Mulk 67:29',
    audioKey: '67:29',
    whyThis:
      'Reliance is placed upon Ar-Rahman, the Most Merciful. Your trust is in the One whose mercy encompasses all things.',
    moods: ['Anxious'],
  },
  {
    id: 'quran_25_58',
    type: 'Quran',
    primaryText: "Wa tawakkal 'alal-hayyilladhi la yamutu wa sabbih bihamdih",
    arabicText: 'وَتَوَكَّلْ عَلَى الْحَيِّ الَّذِي لَا يَمُوتُ وَسَبِّحْ بِحَمْدِهِ ﴿٥٨﴾',
    transliteration: "Wa tawakkal 'alal-hayyilladhi la yamutu wa sabbih bihamdih",
    englishTranslation:
      'And rely upon the Ever-Living who does not die, and exalt [Allah] with His praise.',
    source: 'Surah Al-Furqan 25:58',
    audioKey: '25:58',
    whyThis:
      'Place your trust in the One who is Ever-Living and never dies. Human support fails, but Allah never does.',
    moods: ['Anxious'],
  },
  {
    id: 'quran_12_90',
    type: 'Quran',
    primaryText:
      'Indeed, he who fears Allah and is patient, then indeed, Allah does not allow to be lost the reward of those who do good.',
    arabicText:
      'إِنَّهُ مَن يَتَّقِ وَيَصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ ﴿٩٠﴾',
    transliteration: "Innahu man yattaqi wa yasbir fa innallaha la yudi'u ajral-muhsinin",
    englishTranslation:
      'Indeed, he who fears Allah and is patient, then indeed, Allah does not allow to be lost the reward of those who do good.',
    source: 'Surah Yusuf 12:90',
    audioKey: '12:90',
    whyThis:
      'The story of Yusuf (AS) is proof: patience and taqwa lead to a reward that is never lost.',
    moods: ['Anxious'],
  },
  {
    id: 'quran_8_46',
    type: 'Quran',
    primaryText: "Wasbiru innallaha ma'as-sabirin",
    arabicText: 'وَاصْبِرُوا ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ ﴿٤٦﴾',
    transliteration: "Wasbiru innallaha ma'as-sabirin",
    englishTranslation: 'And be patient. Indeed, Allah is with the patient.',
    source: 'Surah Al-Anfal 8:46',
    audioKey: '8:46',
    whyThis:
      "Allah's special companionship (ma'iyyah) is granted to those who are patient. He is with you.",
    moods: ['Anxious'],
  },
  {
    id: 'quran_10_62',
    type: 'Quran',
    primaryText:
      "Alā inna awliyā'allāhi lā khawfun 'alayhim wa lā hum yaḥzanūn",
    arabicText: 'أَلَا إِنَّ أَوْلِيَاءَ اللَّهِ لَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ ﴿٦٢﴾',
    transliteration: "Alā inna awliyā'allāhi lā khawfun 'alayhim wa lā hum yaḥzanūn",
    englishTranslation:
      'Unquestionably, for the allies of Allah there will be no fear concerning them, nor will they grieve.',
    source: 'Surah Yunus 10:62',
    audioKey: '10:62',
    whyThis:
      'The friends of Allah are promised freedom from fear and grief. Strive to be among them.',
    moods: ['Anxious'],
  },

  // === SAD / SABR ===
  {
    id: 'quran_93_3',
    type: 'Quran',
    primaryText: "Mā wad-da'aka rabbuka wa mā qalā",
    arabicText: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ ﴿٣﴾',
    transliteration: "Mā wad-da'aka rabbuka wa mā qalā",
    englishTranslation: 'Your Lord has not taken leave of you, nor has He detested [you].',
    source: 'Surah Ad-Duha 93:3',
    audioKey: '93:3',
    whyThis: 'Allah reassures the Prophet and us that He never abandons His servants.',
    moods: ['Sad'],
  },
  {
    id: 'quran_12_87',
    type: 'Quran',
    primaryText:
      "Yā baniyya idhhabū fatahassasū min Yūsufa wa akhīhi wa lā tay'asū min rawḥillāh, innahū lā yay'asu min rawḥillāhi illal-qawmul-kāfirūn",
    arabicText:
      'يَٰبَنِىَّ ٱذْهَبُوا۟ فَتَحَسَّسُوا۟ مِن يُوسُفَ وَأَخِيهِ وَلَا تَيْـَٔسُوا۟ مِن رَّوْحِ ٱللَّهِ ۖ إِنَّهُۥ لَا يَيْـَٔسُ مِن رَّوْحِ ٱللَّهِ إِلَّا ٱلْقَوْمُ ٱلْكَٰفِرُونَ ﴿٨٧﴾',
    transliteration:
      "Yā baniyya idhhabū fatahassasū min Yūsufa wa akhīhi wa lā tay'asū min rawḥillāh, innahū lā yay'asu min rawḥillāhi illal-qawmul-kāfirūn",
    englishTranslation:
      "O my sons! Go and search for Joseph and his brother. And do not lose hope in the mercy of Allah, for no one loses hope in Allah's mercy except those with no faith.",
    source: 'Surah Yusuf 12:87',
    audioKey: '12:87',
    whyThis: "Yaqub (AS) taught his sons to never lose hope in Allah's mercy.",
    moods: ['Hopeful'],
  },
  {
    id: 'quran_2_155',
    type: 'Quran',
    primaryText:
      "Wa-lanabluwannakum bishay'im minal-khawfi wal-jū'i wa naqsim minal-amwāli wal-anfusi wath-thamarāt; wa bash-shiris-sābirīn. Alladhīna idhā aṣābathum muṣībatun qālū innā lillāhi wa innā ilayhi rāji'ūn.",
    arabicText:
      'وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ وَالْجُوعِ وَنَقْصٍ مِّنَ الْأَمْوَالِ وَالْأَنفُسِ وَالثَّمَرَاتِ ۗ وَبَشِّرِ الصَّابِرِينَ ﴿١٥٥﴾. ٱلَّذِينَ إِذَآ أَصَٰبَتْهُم مُّصِيبَةٌ قَالُوٓا۟ إِنَّا لِلَّهِ وَإِنَّآ إِلَيْهِ رَٰجِعُونَ ﴿١٥٦﴾',
    transliteration:
      "Wa-lanabluwannakum bishay'im minal-khawfi wal-jū'i wa naqsim minal-amwāli wal-anfusi wath-thamarāt; wa bash-shiris-sābirīn. Alladhīna idhā aṣābathum muṣībatun qālū innā lillāhi wa innā ilayhi rāji'ūn.",
    englishTranslation:
      'And We will surely test you with something of fear and hunger and a loss of wealth and lives and fruits, but give good tidings to the patient. Who, when disaster strikes them, say, "Indeed we belong to Allah, and indeed to Him we will return."',
    source: 'Surah Al-Baqarah 2:155-156',
    audioKey: '2:155-156',
    whyThis:
      'Tests are guaranteed, but so is the reward for those who return to Allah in patience.',
    moods: ['Sad'],
  },
  {
    id: 'quran_57_4',
    type: 'Quran',
    primaryText:
      "Huwal-ladhī khalaqas-samāwāti wal-arḍa fī sittati ayyāmin thummas-tawā 'alal-'arsh. Ya'lamu mā yaliju fīl-arḍi wa mā yakhruju minhā wa mā yanzilu minas-samā'i wa mā ya'ruju fīhā. Wa huwa ma'akum ayna mā kuntum. Wallāhu bimā ta'malūna baṣīr.",
    arabicText:
      'هُوَ ٱلَّذِي خَلَقَ ٱلسَّمَٰوَٰتِ وَٱلۡأَرۡضَ فِي سِتَّةِ أَيَّامٖ ثُمَّ ٱسۡتَوَىٰ عَلَى ٱلۡعَرۡشِۖ يَعۡلَمُ مَا يَلِجُ فِي ٱلۡأَرۡضِ وَمَا يَخۡرُجُ مِنۡهَا وَمَا يَنزِلُ مِنَ ٱلسَّمَآءِ وَمَا يَعۡرُجُ فِيهَاۖ وَهُوَ مَعَكُمۡ أَيۡنَ مَا كُنتُمۡۚ وَٱللَّهُ بِمَا تَعۡمَلُونَ بَصِيرٌ ﴿٤﴾',
    transliteration:
      "Huwal-ladhī khalaqas-samāwāti wal-arḍa fī sittati ayyāmin thummas-tawā 'alal-'arsh. Ya'lamu mā yaliju fīl-arḍi wa mā yakhruju minhā wa mā yanzilu minas-samā'i wa mā ya'ruju fīhā. Wa huwa ma'akum ayna mā kuntum. Wallāhu bimā ta'malūna baṣīr.",
    englishTranslation:
      'He is the One Who created the heavens and the earth in six days, then established Himself on the Throne. He knows what goes into the earth and what comes out of it, and what descends from the sky and what ascends into it. And He is with you wherever you are. And Allah is All-Seeing of what you do.',
    source: 'Surah Al-Hadid 57:4',
    audioKey: '57:4',
    whyThis:
      'You are never truly alone or misunderstood; Allah is always with you, witnessing your every moment.',
    moods: ['Sad'],
  },
  {
    id: 'quran_94_5_sad',
    type: 'Quran',
    primaryText: "Fa inna ma'al-'usri yusra",
    arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٥﴾',
    transliteration: "Fa inna ma'al-'usri yusra",
    englishTranslation: 'For indeed, with hardship [will be] ease.',
    source: 'Surah Ash-Sharh 94:5',
    audioKey: '94:5',
    whyThis:
      'Allah promises ease is "with" (not after) the hardship - relief is already embedded within the trial.',
    moods: ['Sad'],
  },
  {
    id: 'quran_3_139',
    type: 'Quran',
    primaryText: "Wa la tahinu wa la tahzanu wa antumul-a'lawna in kuntum mu'minin",
    arabicText:
      'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ ﴿١٣٩﴾',
    transliteration: "Wa la tahinu wa la tahzanu wa antumul-a'lawna in kuntum mu'minin",
    englishTranslation:
      'So do not weaken and do not grieve, and you will be superior if you are [true] believers.',
    source: 'Surah Ali Imran 3:139',
    audioKey: '3:139',
    whyThis:
      'Allah directly commands us not to grieve - true believers have reason for hope even in dark times.',
    moods: ['Sad'],
  },
  {
    id: 'quran_65_7',
    type: 'Quran',
    primaryText:
      "Liyunfiq dhū sa'atin min sa'atih; wa man qudira 'alayhi rizquhū falyunfiq mimmā ātāhullāh; lā yukallifullāhu nafsan illā mā ātāhā; sa-yaj'alullāhu ba'da 'usrin yusrā",
    arabicText:
      'لِيُنفِقْ ذُو سَعَةٍ مِّن سَعَتِهِ ۖ وَمَن قُدِرَ عَلَيْهِ رِزْقُهُ فَلْيُنفِقْ مِمَّا آتَاهُ اللَّهُ ۚ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا مَا آتَاهَا ۚ سَيَجْعَلُ اللَّهُ بَعْدَ عُسْرٍ يُسْرًا ﴿٧﴾',
    transliteration:
      "Liyunfiq dhū sa'atin min sa'atih; wa man qudira 'alayhi rizquhū falyunfiq mimmā ātāhullāh; lā yukallifullāhu nafsan illā mā ātāhā; sa-yaj'alullāhu ba'da 'usrin yusrā",
    englishTranslation:
      'Let a man of wealth spend from his wealth, and he whose provision is restricted - let him spend from what Allah has given him. Allah does not charge a soul except [according to] what He has given it. Allah will bring about, after hardship, ease.',
    source: 'Surah At-Talaq 65:7',
    audioKey: '65:7',
    whyThis: 'A divine promise: after every hardship, Allah will certainly bring ease.',
    moods: ['Sad'],
  },
  {
    id: 'quran_21_87',
    type: 'Quran',
    primaryText:
      "Wa dhan-nūni idh dhahaba mughāḍiban faẓanna an lan naqdira 'alayhi fanādā fiẓ-ẓulumāti an lā ilāha illā anta subḥānaka innī kuntu minaẓ-ẓālimīn",
    arabicText:
      'وَذَا النُّونِ إِذ ذَّهَبَ مُغَاضِبًا فَظَنَّ أَن لَّن نَّقْدِرَ عَلَيْهِ فَنَادَىٰ فِي الظُّلُمَاتِ أَن لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ ﴿٨٧﴾',
    transliteration:
      "Wa dhan-nūni idh dhahaba mughāḍiban faẓanna an lan naqdira 'alayhi fanādā fiẓ-ẓulumāti an lā ilāha illā anta subḥānaka innī kuntu minaẓ-ẓālimīn",
    englishTranslation:
      'And [mention] the man of the fish, when he went off in anger and thought that We would not decree [anything] upon him. And he called out within the darknesses, "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers."',
    source: 'Surah Al-Anbiya 21:87',
    audioKey: '21:87',
    whyThis:
      "The du'a of Yunus (AS) from the belly of the whale - call upon Allah in your darkest moments with this same prayer.",
    moods: ['Sad'],
  },
  {
    id: 'quran_3_8',
    type: 'Quran',
    primaryText: "Rabbana la tuzigh qulubana ba'da idh hadaytana wa hab lana min ladunka rahmah",
    arabicText:
      'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ﴿٨﴾',
    transliteration:
      "Rabbana la tuzigh qulubana ba'da idh hadaytana wa hab lana min ladunka rahmah",
    englishTranslation:
      'Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy.',
    source: 'Surah Ali Imran 3:8',
    audioKey: '3:8',
    whyThis:
      'When your heart feels heavy, ask Allah to keep it steadfast and to grant you mercy from His special treasury.',
    moods: ['Sad'],
  },
  {
    id: 'quran_40_60',
    type: 'Quran',
    primaryText:
      "Wa qāla rabbukumud'ūnī astajib lakum; innal-ladhīna yastakbirūna 'an 'ibādatī sayadkhulūna jahannama dākhirīn",
    arabicText:
      'وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ ۚ إِنَّ الَّذِينَ يَسْتَكْبِرُونَ عَنْ عِبَادَتِي سَيَدْخُلُونَ جَهَنَّمَ دَاخِرِينَ ﴿٦٠﴾',
    transliteration:
      "Wa qāla rabbukumud'ūnī astajib lakum; innal-ladhīna yastakbirūna 'an 'ibādatī sayadkhulūna jahannama dākhirīn",
    englishTranslation:
      'And your Lord says, "Call upon Me; I will respond to you." Indeed, those who disdain My worship will enter Hell [rendered] contemptible.',
    source: 'Surah Ghafir 40:60',
    audioKey: '40:60',
    whyThis: "Allah Himself invites you to call upon Him - He is waiting to respond to your du'a.",
    moods: ['Sad', 'Stressed'],
  },
  {
    id: 'quran_39_10',
    type: 'Quran',
    primaryText:
      "Qul yā 'ibādil-ladhīna āmanut-taqū rabbakum; lilladhīna aḥsanū fī hādhihid-dunyā ḥasanah; wa arḍullāhi wāsi'ah; innamā yuwaffaṣ-ṣābirūna ajrahum bighayri ḥisāb",
    arabicText:
      'قُلْ يَا عِبَادِ الَّذِينَ آمَنُوا اتَّقُوا رَبَّكُمْ ۚ لِلَّذِينَ أَحْسَنُوا فِي هَٰذِهِ الدُّنْيَا حَسَنَةٌ ۗ وَأَرْضُ اللَّهِ وَاسِعَةٌ ۗ إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ ﴿١٠﴾',
    transliteration:
      "Qul yā 'ibādil-ladhīna āmanut-taqū rabbakum; lilladhīna aḥsanū fī hādhihid-dunyā ḥasanah; wa arḍullāhi wāsi'ah; innamā yuwaffaṣ-ṣābirūna ajrahum bighayri ḥisāb",
    englishTranslation:
      'Say, "O My servants who have believed, fear your Lord. For those who do good in this world is good, and the earth of Allah is spacious. Indeed, the patient will be given their reward without account."',
    source: 'Surah Az-Zumar 39:10',
    audioKey: '39:10',
    whyThis: 'The reward for patience is limitless - beyond any calculation.',
    moods: ['Sad'],
  },
  {
    id: 'quran_11_115',
    type: 'Quran',
    primaryText: "Wasbir fa innallaha la yudi'u ajral-muhsinin",
    arabicText: 'وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ ﴿١١٥﴾',
    transliteration: "Wasbir fa innallaha la yudi'u ajral-muhsinin",
    englishTranslation:
      'And be patient, for indeed, Allah does not allow to be lost the reward of those who do good.',
    source: 'Surah Hud 11:115',
    audioKey: '11:115',
    whyThis:
      'Your patience is never wasted - Allah preserves and rewards every moment of endurance.',
    moods: ['Sad'],
  },
  {
    id: 'quran_39_53',
    type: 'Quran',
    primaryText:
      "Qul yā 'ibādiyal-ladhīna asrafū 'alā anfusihim lā taqnatū mir-rahmatillāh. Innallāha yaghfirudh-dhunūba jamī'an. Innahū huwal-Ghafūrur-Rahīm. Wa anībū ilā Rabbikum wa aslimū lahū min qabli an ya'tiyakumul-'adhābu thumma lā tunṣarūn.",
    arabicText:
      'قُلۡ يَٰعِبَادِيَ ٱلَّذِينَ أَسۡرَفُواْ عَلَىٰٓ أَنفُسِهِمۡ لَا تَقۡنَطُواْ مِن رَّحۡمَةِ ٱللَّهِۚ إِنَّ ٱللَّهَ يَغۡفِرُ ٱلذُّنُوبَ جَمِيعًاۚ إِنَّهُۥ هُوَ ٱلۡغَفُورُ ٱلرَّحِيمُ ﴿٥٣﴾ وَأَنِيبُوا إِلَىٰ رَبِّكُمْ وَأَسْلِمُوا لَهُ مِن قَبْلِ أَن يَأْتِيَكُمُ الْعَذَابُ ثُمَّ لَا تُنصَرُونَ ﴿٥٤﴾',
    transliteration:
      "Qul yā 'ibādiyal-ladhīna asrafū 'alā anfusihim lā taqnatū mir-rahmatillāh. Innallāha yaghfirudh-dhunūba jamī'an. Innahū huwal-Ghafūrur-Rahīm. Wa anībū ilā Rabbikum wa aslimū lahū min qabli an ya'tiyakumul-'adhābu thumma lā tunṣarūn.",
    englishTranslation:
      'Say, "O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins. Indeed, He is the All-Forgiving, Most Merciful." And return [in repentance] to your Lord and submit to Him before the punishment comes upon you; then you will not be helped.',
    source: 'Surah Az-Zumar 39:53-54',
    audioKey: '39:53-54',
    whyThis:
      "No matter how much you've sinned, Allah's mercy is greater. He calls you to return to Him with hope and submission.",
    moods: ['Sad'],
    moodScores: { Sad: 20 },
  },

  // === ANGRY / IHSAN ===
  {
    id: 'quran_3_134',
    type: 'Quran',
    primaryText:
      "Alladhīna yunfiqūna fis-sarrā'i wad-darrā'i wal-kādimīnal-ghaida wal-'āfīna 'anin-nās; wallāhu yuhibbul-muhsinīn",
    arabicText:
      'الَّذِينَ يُنفِقُونَ فِي السَّرَّاءِ وَالضَّرَّاءِ وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ ۗ وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ ﴿١٣٤﴾',
    transliteration:
      "Alladhīna yunfiqūna fis-sarrā'i wad-darrā'i wal-kādimīnal-ghaida wal-'āfīna 'anin-nās; wallāhu yuhibbul-muhsinīn",
    englishTranslation:
      'Those who spend [in the cause of Allah] during ease and hardship and who restrain anger and who pardon the people - and Allah loves the doers of good.',
    source: 'Surah Ali Imran 3:134',
    audioKey: '3:134',
    whyThis: 'Controlling anger is a quality of the righteous whom Allah loves.',
    moods: ['Angry'],
  },
  {
    id: 'quran_41_34',
    type: 'Quran',
    primaryText:
      "Wa lā tastawil-hasanatu walas-sayyi'ah; idfa' bil-latī hiya ahsan, fa'idhalladhī baynaka wa baynahū 'adāwatun ka'annahū waliyyun hamīm",
    arabicText:
      'وَلَا تَسْتَوِي الْحَسَنَةُ وَلَا السَّيِّئَةُ ۚ ادْفَعْ بِالَّتِي هِيَ أَحْسَنُ فَإِذَا الَّذِي بَيْنَكَ وَبَيْنَهُ عَدَاوَةٌ كَأَنَّهُ وَلِيٌّ حَمِيمٌ ﴿٣٤﴾',
    transliteration:
      "Wa lā tastawil-hasanatu walas-sayyi'ah; idfa' bil-latī hiya ahsan, fa'idhalladhī baynaka wa baynahū 'adāwatun ka'annahū waliyyun hamīm",
    englishTranslation:
      'And not equal are the good deed and the bad. Repel [evil] by that [deed] which is better; and thereupon the one whom between you and him is enmity [will become] as though he was a devoted friend.',
    source: 'Surah Fussilat 41:34',
    audioKey: '41:34',
    whyThis: 'Responding to bad with good transforms enemies into friends.',
    moods: ['Angry'],
  },
  {
    id: 'quran_7_199',
    type: 'Quran',
    primaryText: "Khudhil-'afwa wa'mur bil-'urfi wa a'rid 'anil-jāhilīn",
    arabicText: 'خُذِ الْعَفْوَ وَأْمُرْ بِالْعُرْفِ وَأَعْرِضْ عَنِ الْجَاهِلِينَ ﴿١٩٩﴾',
    transliteration: "Khudhil-'afwa wa'mur bil-'urfi wa a'rid 'anil-jāhilīn",
    englishTranslation:
      'Take what is given freely, enjoin what is good, and turn away from the ignorant.',
    source: "Surah Al-A'raf 7:199",
    audioKey: '7:199',
    whyThis: 'Sometimes the best response to provocation is to simply walk away.',
    moods: ['Angry'],
  },
  {
    id: 'quran_42_37',
    type: 'Quran',
    primaryText:
      "Walladhīna yajtanibūna kabā'iral-ithmi wal-fawāhisha wa idhā mā ghadibū hum yaghfirūn",
    arabicText:
      'وَالَّذِينَ يَجْتَنِبُونَ كَبَائِرَ الْإِثْمِ وَالْفَوَاحِشَ وَإِذَا مَا غَضِبُوا هُمْ يَغْفِرُونَ ﴿٣٧﴾',
    transliteration:
      "Walladhīna yajtanibūna kabā'iral-ithmi wal-fawāhisha wa idhā mā ghadibū hum yaghfirūn",
    englishTranslation:
      'And those who avoid the major sins and immoralities, and when they are angry, they forgive.',
    source: 'Surah Ash-Shura 42:37',
    audioKey: '42:37',
    whyThis: 'Forgiving when angry is a distinguishing trait of the believers.',
    moods: ['Angry'],
  },
  {
    id: 'quran_42_43',
    type: 'Quran',
    primaryText: "Wa laman sabara wa ghafara inna dhalika lamin 'azmil-umur",
    arabicText: 'وَلَمَن صَبَرَ وَغَفَرَ إِنَّ ذَٰلِكَ لَمِنْ عَزْمِ الْأُمُورِ ﴿٤٣﴾',
    transliteration: "Wa laman sabara wa ghafara inna dhalika lamin 'azmil-umur",
    englishTranslation:
      'And whoever is patient and forgives - indeed, that is of the matters [requiring] determination.',
    source: 'Surah Ash-Shura 42:43',
    audioKey: '42:43',
    whyThis:
      'Patience and forgiveness require true strength and determination - they are acts of courage.',
    moods: ['Angry'],
  },
  {
    id: 'quran_3_159',
    type: 'Quran',
    primaryText:
      "Fabimā raḥmatin minallāhi linta lahum. Wa law kunta faẓẓan ghalīẓal-qalbi lanfaḍḍū min ḥawlik. Fa'fu 'anhum wastaghfir lahum wa shāwirhum fil-amr; fa-idhā 'azamta fatawakkal 'alallāh",
    arabicText:
      'فَبِمَا رَحْمَةٍ مِّنَ اللَّهِ لِنتَ لَهُمْ ۖ وَلَوْ كُنتَ فَظًّا غَلِيظَ الْقَلْبِ لَانفَضُّوا مِنْ حَوْلِكَ ۖ فَاعْفُ عَنْهُمْ وَاسْتَغْفِرْ لَهُمْ وَشَاوِرْهُمْ فِي الْأَمْرِ ۖ فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ ۚ إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ ﴿١٥٩﴾',
    transliteration:
      "Fabimā raḥmatin minallāhi linta lahum. Wa law kunta faẓẓan ghalīẓal-qalbi lanfaḍḍū min ḥawlik. Fa'fu 'anhum wastaghfir lahum wa shāwirhum fil-amr; fa-idhā 'azamta fatawakkal 'alallāh",
    englishTranslation:
      'So by mercy from Allah, [O Muhammad], you were lenient with them. And if you had been rude [in speech] and harsh in heart, they would have disbanded from about you. So pardon them and ask forgiveness for them and consult them in the matter. And when you have decided, then rely upon Allah.',
    source: 'Surah Ali Imran 3:159',
    audioKey: '3:159',
    whyThis:
      'Pardon others and seek consultation; once decided, rely upon Allah who loves those who trust Him.',
    moods: ['Angry'],
  },
  {
    id: 'quran_24_22',
    type: 'Quran',
    primaryText:
      "Wa lā ya'tali ulul-faḍli minkum was-sa'ati an yu'tū ulil-qurbā wal-masākīna wal-muhājirīna fī sabīlillāh; wal-ya'fū wal-yaṣfaḥū; alā tuḥibbūna an yaghfirallāhu lakum. Wallāhu Ghafūrur-Raḥīm.",
    arabicText:
      'وَلَا يَأْتَلِ أُولُو الْفَضْلِ مِنكُمْ وَالسَّعَةِ أَن يُؤْتُوا أُولِي الْقُرْبَىٰ وَالْمَسَاكِينَ وَالْمُهَاجِرِينَ فِي سَبِيلِ اللَّهِ ۖ وَلْيَعْفُوا وَلْيَصْفَحُوا ۗ أَلَا تُحِبُّونَ أَن يَغْفِرَ اللَّهُ لَكُمْ ۗ وَاللَّهُ غَفُورٌ رَّحِيمٌ ﴿٢٢﴾',
    transliteration:
      "Wa lā ya'tali ulul-faḍli minkum was-sa'ati an yu'tū ulil-qurbā wal-masākīna wal-muhājirīna fī sabīlillāh; wal-ya'fū wal-yaṣfaḥū; alā tuḥibbūna an yaghfirallāhu lakum. Wallāhu Ghafūrur-Raḥīm.",
    englishTranslation:
      'And let not those of virtue among you and wealth swear not to give [aid] to their relatives and the needy and the emigrants for the cause of Allah, and let them pardon and overlook. Would you not like that Allah should forgive you? And Allah is Forgiving and Merciful.',
    source: 'Surah An-Nur 24:22',
    audioKey: '24:22',
    whyThis:
      'Forgive others as you wish Allah to forgive you - a powerful incentive for letting go of anger.',
    moods: ['Angry', 'Sad'],
  },
  {
    id: 'quran_16_126',
    type: 'Quran',
    primaryText:
      "Wa in 'āqabtum fa'āqibū bimithli mā 'ūqibtum bih; wa la-in ṣabartum lahuwa khayrul-liṣ-ṣābirīn",
    arabicText:
      'وَإِنْ عَاقَبْتُمْ فَعَاقِبُوا بِمِثْلِ مَا عُوقِبْتُم بِهِ ۖ وَلَئِن صَبَرْتُمْ لَهُوَ خَيْرٌ لِّلصَّابِرِينَ ﴿١٢٦﴾',
    transliteration:
      "Wa in 'āqabtum fa'āqibū bimithli mā 'ūqibtum bih; wa la-in ṣabartum lahuwa khayrul-liṣ-ṣābirīn",
    englishTranslation:
      'And if you punish [an enemy, O believers], punish with an equivalent of that with which you were harmed. But if you are patient - it is better for those who are patient.',
    source: 'Surah An-Nahl 16:126',
    audioKey: '16:126',
    whyThis: 'Patience is always the better choice for those who can practice it.',
    moods: ['Angry'],
  },
  {
    id: 'quran_5_13',
    type: 'Quran',
    primaryText:
      "Fa-bima naqḍihim mīthāqahum la'annāhum wa ja'alnā qulūbahum qāsiyah. Yuḥarrifūnal-kalima 'an mawāḍi'ihi wa nasū ḥaẓẓan mimmā dhukkirū bih. Wa lā tazālu taṭṭali'u 'alā khā'inatin minhum illā qalīlan minhum. Fa'fu 'anhum waṣfaḥ; innallāha yuḥibbul-muḥsinīn.",
    arabicText:
      'فَبِمَا نَقْضِهِم مِّيثَاقَهُمْ لَعَنَّاهُمْ وَجَعَلْنَا قُلُوبَهُمْ قَاسِيَةً ۖ يُحَرِّفُونَ الْكَلِمَ عَن مَّوَاضِعِهِ ۙ وَنَسُوا حَظًّا مِّمَّا ذُكِّرُوا بِهِ ۚ وَلَا تَزَالُ تَطَّلِعُ عَلَىٰ خَائِنَةٍ مِّنْهُمْ إِلَّا قَلِيلًا مِّنْهُمْ ۖ فَاعْفُ عَنْهُمْ وَاصْفَحْ ۚ إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ ﴿١٣﴾',
    transliteration:
      "Fa-bima naqḍihim mīthāqahum la'annāhum wa ja'alnā qulūbahum qāsiyah. Yuḥarrifūnal-kalima 'an mawāḍi'ihi wa nasū ḥaẓẓan mimmā dhukkirū bih. Wa lā tazālu taṭṭali'u 'alā khā'inatin minhum illā qalīlan minhum. Fa'fu 'anhum waṣfaḥ; innallāha yuḥibbul-muḥsinīn.",
    englishTranslation:
      'So for their breaking of the covenant We cursed them and made their hearts hard. They distort words from their [proper] usages and have forgotten a portion of that of which they were reminded. And you will still observe deceit among them, except a few of them. But pardon them and overlook [their misdeeds]. Indeed, Allah loves the doers of good.',
    source: 'Surah Al-Maidah 5:13',
    audioKey: '5:13',
    whyThis: 'Pardoning and overlooking makes you among those Allah loves.',
    moods: ['Angry'],
  },
  {
    id: 'quran_64_14',
    type: 'Quran',
    primaryText:
      "Yā ayyuhalladhīna āmanū inna min azwājikum wa awlādikum 'aduwwan lakum faḥdharūhum; wa in ta'fū wa taṣfaḥū wa taghfirū fa-innallāha Ghafūrur-Raḥīm",
    arabicText:
      'يَا أَيُّهَا الَّذِينَ آمَنُوا إِنَّ مِنْ أَزْوَاجِكُمْ وَأَوْلَادِكُمْ عَدُوًّا لَّكُمْ فَاحْذَرُوهُمْ ۚ وَإِن تَعْفُوا وَتَصْفَحُوا وَتَغْفِرُوا فَإِنَّ اللَّهَ غَفُورٌ رَّحِيمٌ ﴿١٤﴾',
    transliteration:
      "Yā ayyuhalladhīna āmanū inna min azwājikum wa awlādikum 'aduwwan lakum faḥdharūhum; wa in ta'fū wa taṣfaḥū wa taghfirū fa-innallāha Ghafūrur-Raḥīm",
    englishTranslation:
      'O you who have believed, indeed, among your wives and your children are enemies to you, so beware of them. But if you pardon and overlook and forgive - then indeed, Allah is Forgiving and Merciful.',
    source: 'Surah At-Taghabun 64:14',
    audioKey: '64:14',
    whyThis:
      'The triple action of pardon, overlook, forgive - and Allah responds with His own forgiveness.',
    moods: ['Angry'],
  },
  {
    id: 'quran_4_149',
    type: 'Quran',
    primaryText:
      "In tubdu khayran aw tukhfuhu aw ta'fu 'an su'in fa innallaha kana 'afuwwan qadira",
    arabicText:
      'إِن تُبْدُوا خَيْرًا أَوْ تُخْفُوهُ أَوْ تَعْفُوا عَن سُوءٍ فَإِنَّ اللَّهَ كَانَ عَفُوًّا قَدِيرًا ﴿١٤٩﴾',
    transliteration:
      "In tubdu khayran aw tukhfuhu aw ta'fu 'an su'in fa innallaha kana 'afuwwan qadira",
    englishTranslation:
      'If [instead] you show [some] good or conceal it or pardon an offense - indeed, Allah is ever Pardoning and Competent.',
    source: 'Surah An-Nisa 4:149',
    audioKey: '4:149',
    whyThis:
      "Allah is Al-'Afuw (The Pardoner) and Al-Qadir (All-Powerful) - He can pardon yet chooses to. So should you.",
    moods: ['Angry'],
  },
  {
    id: 'quran_45_14',
    type: 'Quran',
    primaryText: 'Qul lilladhina amanu yaghfiru lilladhina la yarjuna ayyamallah',
    arabicText: 'قُل لِّلَّذِينَ آمَنُوا يَغْفِرُوا لِلَّذِينَ لَا يَرْجُونَ أَيَّامَ اللَّهِ ﴿١٤﴾',
    transliteration: 'Qul lilladhina amanu yaghfiru lilladhina la yarjuna ayyamallah',
    englishTranslation:
      'Say to those who have believed that they [should] forgive those who expect not the days of Allah.',
    source: 'Surah Al-Jathiyah 45:14',
    audioKey: '45:14',
    whyThis:
      'Believers are commanded to forgive even those who have no hope in accountability - rise above.',
    moods: ['Angry'],
  },

  // === GUILTY / TAWBAH ===
  {
    id: 'quran_4_110',
    type: 'Quran',
    primaryText:
      "Wa man ya'mal sū'an aw yażlim nafsahū thumma yastagh-firillāha yajidillāha ghafūrar rahīmā",
    arabicText:
      'وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا ﴿١١٠﴾',
    transliteration:
      "Wa man ya'mal sū'an aw yażlim nafsahū thumma yastagh-firillāha yajidillāha ghafūrar rahīmā",
    englishTranslation:
      'And whoever does a wrong or wrongs himself but then seeks forgiveness of Allah will find Allah Forgiving and Merciful.',
    source: 'Surah An-Nisa 4:110',
    audioKey: '4:110',
    whyThis: 'Seeking forgiveness guarantees finding it.',
    moods: ['Sad'],
  },
  {
    id: 'quran_25_70',
    type: 'Quran',
    primaryText:
      "Illā man tāba wa āmana wa 'amila 'amalan sālihan fa'ūlā'ika yubad-dilullāhu say-yi'ātihim hasanāt",
    arabicText:
      'إِلَّا مَن تَابَ وَآمَنَ وَعَمِلَ عَمَلًا صَالِحًا فَأُولَٰئِكَ يُبَدِّلُ اللَّهُ سَيِّئَاتِهِمْ حَسَنَاتٍ ﴿٧٠﴾',
    transliteration:
      "Illā man tāba wa āmana wa 'amila 'amalan sālihan fa'ūlā'ika yubad-dilullāhu say-yi'ātihim hasanāt",
    englishTranslation:
      'Except for those who repent, believe and do righteous work. For them Allah will replace their evil deeds with good.',
    source: 'Surah Al-Furqan 25:70',
    audioKey: '25:70',
    whyThis: "True repentance doesn't just erase sins - it transforms them into good deeds.",
    moods: ['Sad'],
  },
  {
    id: 'quran_3_135',
    type: 'Quran',
    primaryText:
      "Walladhīna idhā fa'alū fāhishatan aw żalamū anfusahum dhakarullāha fas-tagh-farū lidhunūbihim; wa man yagh-firudh-dhunūba illallāh",
    arabicText:
      'وَالَّذِينَ إِذَا فَعَلُوا فَاحِشَةً أَوْ ظَلَمُوا أَنفُسَهُمْ ذَكَرُوا اللَّهَ فَاسْتَغْفَرُوا لِذُنُوبِهِمْ وَمَن يَغْفِرُ الذُّنُوبَ إِلَّا اللَّهُ ﴿١٣٥﴾',
    transliteration:
      "Walladhīna idhā fa'alū fāhishatan aw żalamū anfusahum dhakarullāha fas-tagh-farū lidhunūbihim; wa man yagh-firudh-dhunūba illallāh",
    englishTranslation:
      'And those who, when they commit an immorality or wrong themselves, remember Allah and seek forgiveness for their sins - and who can forgive sins except Allah?',
    source: 'Surah Ali Imran 3:135',
    audioKey: '3:135',
    whyThis:
      "The righteous aren't those who never sin, but those who immediately turn back to Allah.",
    moods: ['Sad'],
  },
  {
    id: 'quran_66_8',
    type: 'Quran',
    primaryText: 'Yā ay-yuhalladhīna āmanū tūbū ilallāhi tawbatan nasūhā',
    arabicText: 'يَا أَيُّهَا الَّذِينَ آمَنُوا تُوبُوا إِلَى اللَّهِ تَوْبَةً نَّصُوحًا ﴿٨﴾',
    transliteration: 'Yā ay-yuhalladhīna āmanū tūbū ilallāhi tawbatan nasūhā',
    englishTranslation: 'O you who have believed, repent to Allah with sincere repentance.',
    source: 'Surah At-Tahrim 66:8',
    audioKey: '66:8',
    whyThis: 'Allah calls believers to sincere repentance as a path to success.',
    moods: ['Sad'],
  },

  // === GRATEFUL / SHUKR ===
  {
    id: 'quran_14_7',
    type: 'Quran',
    primaryText: 'La-in shakartum la-azidannakum',
    arabicText: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ ﴿٧﴾',
    transliteration: 'La-in shakartum la-azidannakum',
    englishTranslation: 'If you are grateful, I will surely increase you [in favor].',
    source: 'Surah Ibrahim 14:7',
    audioKey: '14:7',
    whyThis:
      'Gratitude is a multiplier - the more you appreciate what you have, the more Allah gives.',
    moods: ['Content', 'Grateful'],
  },
  {
    id: 'quran_16_18',
    type: 'Quran',
    primaryText: "Wa in ta'uddu ni'matallahi la tuhsuha",
    arabicText: 'وَإِن تَعُدُّوا نِعْمَةَ اللَّهِ لَا تُحْصُوهَا ﴿١٨﴾',
    transliteration: "Wa in ta'uddu ni'matallahi la tuhsuha",
    englishTranslation:
      'And if you should count the favors of Allah, you could not enumerate them.',
    source: 'Surah An-Nahl 16:18',
    audioKey: '16:18',
    whyThis:
      "Allah's blessings are so abundant they cannot be counted - reflect on this truth and find contentment.",
    moods: ['Content', 'Grateful'],
  },
  {
    id: 'quran_31_12',
    type: 'Quran',
    primaryText:
      "Wa laqad ātaynā Luqmānal-hikmata anishkur-lillāh; wa man yashkur fa'innamā yashkuru linafsih",
    arabicText:
      'وَلَقَدْ آتَيْنَا لُقْمَانَ الْحِكْمَةَ أَنِ اشْكُرْ لِلَّهِ ۚ وَمَن يَشْكُرْ فَإِنَّمَا يَشْكُرُ لِنَفْسِهِ ﴿١٢﴾',
    transliteration:
      "Wa laqad ātaynā Luqmānal-hikmata anishkur-lillāh; wa man yashkur fa'innamā yashkuru linafsih",
    englishTranslation:
      'And We had certainly given Luqman wisdom [and said], "Be grateful to Allah." And whoever is grateful is grateful for [the benefit of] himself.',
    source: 'Surah Luqman 31:12',
    audioKey: '31:12',
    whyThis: 'Wisdom and gratitude go hand in hand - gratitude benefits the one who expresses it.',
    moods: ['Grateful', 'Content'],
  },
  {
    id: 'quran_27_40',
    type: 'Quran',
    primaryText:
      "Hādhā min fadli rabbī liyabluwanī a-ashkuru am akfur; wa man shakara fa'innamā yashkuru linafsih",
    arabicText:
      'هَٰذَا مِن فَضْلِ رَبِّي لِيَبْلُوَنِي أَأَشْكُرُ أَمْ أَكْفُرُ ۖ وَمَن شَكَرَ فَإِنَّمَا يَشْكُرُ لِنَفْسِهِ ﴿٤٠﴾',
    transliteration:
      "Hādhā min fadli rabbī liyabluwanī a-ashkuru am akfur; wa man shakara fa'innamā yashkuru linafsih",
    englishTranslation:
      'This is from the favor of my Lord to test me whether I will be grateful or ungrateful. And whoever is grateful - his gratitude is only for [the benefit of] himself.',
    source: 'Surah An-Naml 27:40',
    audioKey: '27:40',
    whyThis: 'Sulaiman (AS) recognized that blessings are tests of gratitude.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_34_13',
    type: 'Quran',
    primaryText: "I'malu ala dawuda shukra; wa qalilum-min 'ibadiyas-shakur",
    arabicText: 'اعْمَلُوا آلَ دَاوُودَ شُكْرًا ۚ وَقَلِيلٌ مِّنْ عِبَادِيَ الشَّكُورُ ﴿١٣﴾',
    transliteration: "I'malu ala dawuda shukra; wa qalilum-min 'ibadiyas-shakur",
    englishTranslation:
      'Work, O family of David, in gratitude. And few of My servants are grateful.',
    source: 'Surah Saba 34:13',
    audioKey: '34:13',
    whyThis: 'True gratitude is expressed through action, not just words. Few achieve this level.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_76_3',
    type: 'Quran',
    primaryText: 'Inna hadaynahu-s-sabila imma shakiran wa imma kafura',
    arabicText: 'إِنَّا هَدَيْنَاهُ السَّبِيلَ إِمَّا شَاكِرًا وَإِمَّا كَفُورًا ﴿٣﴾',
    transliteration: 'Inna hadaynahu-s-sabila imma shakiran wa imma kafura',
    englishTranslation: 'Indeed, We guided him to the way, be he grateful or be he ungrateful.',
    source: 'Surah Al-Insan 76:3',
    audioKey: '76:3',
    whyThis: 'Allah has shown us the way - now the choice is ours: gratitude or ingratitude.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_54_35',
    type: 'Quran',
    primaryText: "Ni'matam-min 'indina; kadhalika najzi man shakara",
    arabicText: 'نِّعْمَةً مِّنْ عِندِنَا ۚ كَذَٰلِكَ نَجْزِي مَن شَكَرَ ﴿٣٥﴾',
    transliteration: "Ni'matam-min 'indina; kadhalika najzi man shakara",
    englishTranslation: 'As favor from Us. Thus do We reward he who is grateful.',
    source: 'Surah Al-Qamar 54:35',
    audioKey: '54:35',
    whyThis: "Allah's favors are His reward for the grateful - gratitude attracts more blessings.",
    moods: ['Grateful'],
  },
  {
    id: 'quran_7_58',
    type: 'Quran',
    primaryText: 'Kadhalika nusarrifu-l-ayati li-qawmin yashkurun',
    arabicText: 'كَذَٰلِكَ نُصَرِّفُ الْآيَاتِ لِقَوْمٍ يَشْكُرُونَ ﴿٥٨﴾',
    transliteration: 'Kadhalika nusarrifu-l-ayati li-qawmin yashkurun',
    englishTranslation: 'Thus do We explain the signs for a people who are grateful.',
    source: "Surah Al-A'raf 7:58",
    audioKey: '7:58',
    whyThis: 'Gratitude opens the heart to understanding the signs of Allah.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_4_147',
    type: 'Quran',
    primaryText: "Ma yaf'alullahu bi'adhabikum in shakartum wa amantum",
    arabicText: 'مَّا يَفْعَلُ اللَّهُ بِعَذَابِكُمْ إِن شَكَرْتُمْ وَآمَنتُمْ ﴿١٤٧﴾',
    transliteration: "Ma yaf'alullahu bi'adhabikum in shakartum wa amantum",
    englishTranslation: 'What would Allah do with your punishment if you are grateful and believe?',
    source: 'Surah An-Nisa 4:147',
    audioKey: '4:147',
    whyThis:
      'Gratitude and belief protect from punishment - Allah has no need to punish the grateful believer.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_2_172',
    type: 'Quran',
    primaryText: 'Ya ayyuhalladhina amanu kulu min tayyibati ma razaqnakum washkuru lillahi',
    arabicText:
      'يَا أَيُّهَا الَّذِينَ آمَنُوا كُلُوا مِن طَيِّبَاتِ مَا رَزَقْنَاكُمْ وَاشْكُرُوا لِلَّهِ إِن كُنتُمْ إِيَّاهُ تَعْبُدُونَ ﴿١٧٢﴾',
    transliteration: 'Ya ayyuhalladhina amanu kulu min tayyibati ma razaqnakum washkuru lillahi',
    englishTranslation:
      'O you who have believed, eat from the good things which We have provided for you and be grateful to Allah.',
    source: 'Surah Al-Baqarah 2:172',
    audioKey: '2:172',
    whyThis: "Gratitude is part of worship - enjoy Allah's provisions and thank Him.",
    moods: ['Grateful'],
  },
  {
    id: 'quran_35_12',
    type: 'Quran',
    primaryText: "Litabtaghu min fadlihi wa la'allakum tashkurun",
    arabicText: 'لِتَبْتَغُوا مِن فَضْلِهِ وَلَعَلَّكُمْ تَشْكُرُونَ ﴿١٢﴾',
    transliteration: "Litabtaghu min fadlihi wa la'allakum tashkurun",
    englishTranslation: 'That you may seek of His bounty; and perhaps you will be grateful.',
    source: 'Surah Fatir 35:12',
    audioKey: '35:12',
    whyThis: 'Seeking His bounty and being grateful go hand in hand.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_39_7',
    type: 'Quran',
    primaryText: 'Wa in tashkuru yardahu lakum',
    arabicText: 'وَإِن تَشْكُرُوا يَرْضَهُ لَكُمْ ﴿٧﴾',
    transliteration: 'Wa in tashkuru yardahu lakum',
    englishTranslation: 'And if you are grateful, He approves it for you.',
    source: 'Surah Az-Zumar 39:7',
    audioKey: '39:7',
    whyThis: "Allah's approval comes with gratitude - He is pleased when you are thankful.",
    moods: ['Grateful'],
  },

  // === HAPPY / TAHMID ===
  {
    id: 'quran_10_58',
    type: 'Quran',
    primaryText:
      "Qul bifadlillāhi wa birahmatihī fabidhālika falyafrahū; huwa khayrum-mimmā yajma'ūn",
    arabicText:
      'قُلْ بِفَضْلِ اللَّهِ وَبِرَحْمَتِهِ فَبِذَٰلِكَ فَلْيَفْرَحُوا هُوَ خَيْرٌ مِّمَّا يَجْمَعُونَ ﴿٥٨﴾',
    transliteration:
      "Qul bifadlillāhi wa birahmatihī fabidhālika falyafrahū; huwa khayrum-mimmā yajma'ūn",
    englishTranslation:
      'Say, "In the bounty of Allah and in His mercy - in that let them rejoice; it is better than what they accumulate."',
    source: 'Surah Yunus 10:58',
    audioKey: '10:58',
    whyThis: "True joy comes from Allah's bounty and mercy, not worldly possessions.",
    moods: ['Energized', 'Content'],
  },
  {
    id: 'quran_3_200',
    type: 'Quran',
    primaryText:
      "Ya ayyuhalladhina amanusbirū wa sabirū wa rabitū wattaqullaha la'allakum tuflihun",
    arabicText:
      'يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا وَرَابِطُوا وَاتَّقُوا اللَّهَ لَعَلَّكُمْ تُفْلِحُونَ ﴿٢٠٠﴾',
    transliteration:
      "Ya ayyuhalladhina amanusbirū wa sabirū wa rabitū wattaqullaha la'allakum tuflihun",
    englishTranslation:
      'O you who believe! Persevere in patience and constancy; vie in such perseverance; strengthen each other; and fear Allah that you may prosper.',
    source: 'Surah Ali Imran 3:200',
    audioKey: '3:200',
    whyThis:
      'Channel your energy into perseverance, mutual strengthening, and taqwa for ultimate success.',
    moods: ['Energized'],
  },
  {
    id: 'quran_9_105',
    type: 'Quran',
    primaryText: "Wa quli'malu fasayarallahu 'amalakum wa rasuluhu wal-mu'minun",
    arabicText: 'وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ وَرَسُولُهُ وَالْمُؤْمِنُونَ ﴿١٠٥﴾',
    transliteration: "Wa quli'malu fasayarallahu 'amalakum wa rasuluhu wal-mu'minun",
    englishTranslation:
      'And say, "Work, for Allah will see your work, and [so will] His Messenger and the believers."',
    source: 'Surah At-Tawbah 9:105',
    audioKey: '9:105',
    whyThis:
      'Your energy and effort are not unseen - Allah, His Messenger, and the believers witness your work.',
    moods: ['Energized'],
  },
  {
    id: 'quran_103_1_3',
    type: 'Quran',
    primaryText:
      "Wal-'asr. Innal-insana lafi khusr. Illalladhina amanu wa 'amilus-salihati wa tawasaw bil-haqqi wa tawasaw bis-sabr",
    arabicText:
      'وَالْعَصْرِ ﴿١﴾ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ ﴿٢﴾ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ ﴿٣﴾',
    transliteration: "Wal-'asr. Innal-insana lafi khusr. Illalladhina amanu wa 'amilus-salihati",
    englishTranslation:
      'By time. Indeed, mankind is in loss. Except for those who believe and do righteous deeds and advise each other to truth and patience.',
    source: 'Surah Al-Asr 103:1-3',
    audioKey: '103:1-3',
    whyThis: 'Time is running - invest your energy in faith, good deeds, truth, and patience.',
    moods: ['Energized'],
    moodScores: { Energized: 25 },
  },
  {
    id: 'quran_22_77',
    type: 'Quran',
    primaryText:
      "Ya ayyuhalladhina amanurka'u wasjudu wa'budu rabbakum waf'alul-khayra la'allakum tuflihun",
    arabicText:
      'يَا أَيُّهَا الَّذِينَ آمَنُوا ارْكَعُوا وَاسْجُدُوا وَاعْبُدُوا رَبَّكُمْ وَافْعَلُوا الْخَيْرَ لَعَلَّكُمْ تُفْلِحُونَ ﴿٧٧﴾',
    transliteration: "Ya ayyuhalladhina amanurka'u wasjudu wa'budu rabbakum waf'alul-khayra",
    englishTranslation:
      'O you who believe! Bow down and prostrate and worship your Lord and do good that you may succeed.',
    source: 'Surah Al-Hajj 22:77',
    audioKey: '22:77',
    whyThis: 'Channel your energy into worship and doing good - this is the path to success.',
    moods: ['Energized', 'Grateful', 'Calm'],
  },
  {
    id: 'quran_18_30',
    type: 'Quran',
    primaryText: "Innalladhina amanu wa 'amilus-salihati inna la nudi'u ajra man ahsana 'amala",
    arabicText:
      'إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ إِنَّا لَا نُضِيعُ أَجْرَ مَنْ أَحْسَنَ عَمَلًا ﴿٣٠﴾',
    transliteration: "Innalladhina amanu wa 'amilus-salihati inna la nudi'u ajra man ahsana 'amala",
    englishTranslation:
      'Indeed, those who have believed and done righteous deeds - indeed, We will not allow to be lost the reward of any who did well in deeds.',
    source: 'Surah Al-Kahf 18:30',
    audioKey: '18:30',
    whyThis: 'No good deed is wasted - your effort and energy are always rewarded.',
    moods: ['Energized'],
  },
  {
    id: 'quran_28_77',
    type: 'Quran',
    primaryText:
      'Wabtaghi fima atakallahud-daral-akhirata wa la tansa nasibaka minad-dunya wa ahsin kama ahsanallahu ilayk',
    arabicText:
      'وَابْتَغِ فِيمَا آتَاكَ اللَّهُ الدَّارَ الْآخِرَةَ ۖ وَلَا تَنسَ نَصِيبَكَ مِنَ الدُّنْيَا ۖ وَأَحْسِن كَمَا أَحْسَنَ اللَّهُ إِلَيْكَ ﴿٧٧﴾',
    transliteration: 'Wabtaghi fima atakallahud-daral-akhirata wa la tansa nasibaka minad-dunya',
    englishTranslation:
      'But seek, through that which Allah has given you, the home of the Hereafter; and do not forget your share of the world. And do good as Allah has done good to you.',
    source: 'Surah Al-Qasas 28:77',
    audioKey: '28:77',
    whyThis: 'Use your energy to seek the Hereafter, but also enjoy the world and do good.',
    moods: ['Energized'],
  },
  {
    id: 'quran_2_148',
    type: 'Quran',
    primaryText: "Fastabiqul-khayrat; aynama takunu ya'ti bikumullahu jami'a",
    arabicText:
      'فَاسْتَبِقُوا الْخَيْرَاتِ ۚ أَيْنَ مَا تَكُونُوا يَأْتِ بِكُمُ اللَّهُ جَمِيعًا ﴿١٤٨﴾',
    transliteration: "Fastabiqul-khayrat; aynama takunu ya'ti bikumullahu jami'a",
    englishTranslation:
      'So race to [all that is] good. Wherever you may be, Allah will bring you forth [for judgment] all together.',
    source: 'Surah Al-Baqarah 2:148',
    audioKey: '2:148',
    whyThis: 'Race towards good deeds - let your energy propel you forward in righteousness.',
    moods: ['Energized'],
  },
  {
    id: 'quran_5_48',
    type: 'Quran',
    primaryText: "Fastabiqul-khayrati ilallahi marji'ukum jami'an",
    arabicText: 'فَاسْتَبِقُوا الْخَيْرَاتِ ۚ إِلَى اللَّهِ مَرْجِعُكُمْ جَمِيعًا ﴿٤٨﴾',
    transliteration: "Fastabiqul-khayrati ilallahi marji'ukum jami'an",
    englishTranslation: 'So race to [all that is] good. To Allah is your return all together.',
    source: 'Surah Al-Maidah 5:48',
    audioKey: '5:48',
    whyThis: 'Competition in goodness - use your energy to outdo others in positive deeds.',
    moods: ['Energized'],
  },
  {
    id: 'quran_18_110',
    type: 'Quran',
    primaryText: "Faman kana yarju liqa'a rabbihi fal-ya'mal 'amalan salihan",
    arabicText: 'فَمَن كَانَ يَرْجُو لِقَاءَ رَبِّهِ فَلْيَعْمَلْ عَمَلًا صَالِحًا ﴿١١٠﴾',
    transliteration: "Faman kana yarju liqa'a rabbihi fal-ya'mal 'amalan salihan",
    englishTranslation:
      'So whoever would hope for the meeting with his Lord - let him do righteous work.',
    source: 'Surah Al-Kahf 18:110',
    audioKey: '18:110',
    whyThis: 'The ultimate motivation: working for the meeting with your Lord.',
    moods: ['Energized'],
  },
  {
    id: 'quran_67_2',
    type: 'Quran',
    primaryText: "Liyabluwakum ayyukum ahsanu 'amala",
    arabicText: 'لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ﴿٢﴾',
    transliteration: "Liyabluwakum ayyukum ahsanu 'amala",
    englishTranslation:
      '[He] who created death and life to test you [as to] which of you is best in deed.',
    source: 'Surah Al-Mulk 67:2',
    audioKey: '67:2',
    whyThis: 'Life is a test of excellence in action - strive to be the best in your deeds.',
    moods: ['Energized'],
    moodScores: { Energized: 20 },
  },
  {
    id: 'quran_99_7_8',
    type: 'Quran',
    primaryText:
      "Faman ya'mal mithqala dharratin khayray yarahu. Wa man ya'mal mithqala dharratin sharray yarahu.",
    arabicText:
      'فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ ﴿٧﴾ وَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّا يَرَهُ ﴿٨﴾',
    transliteration:
      "Faman ya'mal mithqala dharratin khayray yarahu. Wa man ya'mal mithqala dharratin sharray yarahu.",
    englishTranslation:
      "So whoever does an atom's weight of good will see it. And whoever does an atom's weight of evil will see it.",
    source: 'Surah Az-Zalzalah 99:7-8',
    audioKey: '99:7',
    whyThis: 'Every tiny effort counts - never underestimate the value of a small good deed.',
    moods: ['Energized'],
  },
  {
    id: 'quran_30_4',
    type: 'Quran',
    primaryText:
      "Fī biḍ'i sinīn. Lillāhil-amru min qablu wa mim ba'd. Wa yawma'idhin yafrahul-mu'minūna binasrillāh. Yanṣuru man yashā', wa huwal-'Azīzur-Raḥīm",
    arabicText:
      'فِي بِضْعِ سِنِينَ ۗ لِلَّهِ الْأَمْرُ مِن قَبْلُ وَمِن بَعْدُ ۚ وَيَوْمَئِذٍ يَفْرَحُ الْمُؤْمِنُونَ بِنَصْرِ اللَّهِ ۚ يَنصُرُ مَن يَشَآءُ ۖ وَهُوَ الْعَزِيزُ الرَّحِيمُ ﴿٤-٥﴾',
    transliteration:
      "Fī biḍ'i sinīn. Lillāhil-amru min qablu wa mim ba'd. Wa yawma'idhin yafrahul-mu'minūna binasrillāh. Yanṣuru man yashā', wa huwal-'Azīzur-Raḥīm",
    englishTranslation:
      'Within three to nine years. To Allah belongs the command before and after. And on that day the believers will rejoice in the victory of Allah. He gives victory to whom He wills, and He is the Exalted in Might, the Merciful.',
    source: 'Surah Ar-Rum 30:4-5',
    audioKey: '30:4-5',
    whyThis:
      "Believers find joy in Allah's help and victory, knowing that all success comes from Him.",
    moods: ['Hopeful'],
  },
  {
    id: 'quran_3_170',
    type: 'Quran',
    primaryText:
      "Farihīna bimā ātāhumullāhu min fadlihī wa yastabshirūna billadhīna lam yalhaqū bihim min khalfihim allā khawfun 'alayhim wa lā hum yahzanūn",
    arabicText:
      'فَرِحِينَ بِمَآ ءَاتَىٰهُمُ ٱللَّهُ مِن فَضْلِهِۦ وَيَسْتَبْشِرُونَ بِٱلَّذِينَ لَمْ يَلْحَقُوا۟ بِهِم مِّنْ خَلْفِهِمْ أَلَّا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ ﴿١٧٠﴾',
    transliteration:
      "Farihīna bimā ātāhumullāhu min fadlihī wa yastabshirūna billadhīna lam yalhaqū bihim min khalfihim allā khawfun 'alayhim wa lā hum yahzanūn",
    englishTranslation:
      'Rejoicing in what Allah has bestowed upon them of His bounty, and they receive good tidings about those after them who have not yet joined them - that there will be no fear concerning them, nor will they grieve.',
    source: 'Surah Ali Imran 3:170',
    audioKey: '3:170',
    whyThis:
      "The believers rejoice in Allah's blessings and look forward to reunion with loved ones.",
    moods: ['Grateful', 'Content'],
  },
  {
    id: 'quran_25_63',
    type: 'Quran',
    primaryText:
      "Wa 'ibadur-Rahmanilladhina yamshuna 'alal-ardi hawnan wa idha khatabahumul-jahiluna qalu salama",
    arabicText:
      'وَعِبَادُ الرَّحْمَٰنِ الَّذِينَ يَمْشُونَ عَلَى الْأَرْضِ هَوْنًا وَإِذَا خَاطَبَهُمُ الْجَاهِلُونَ قَالُوا سَلَامًا ﴿٦٣﴾',
    transliteration:
      "Wa 'ibadur-Rahmanilladhina yamshuna 'alal-ardi hawnan wa idha khatabahumul-jahiluna qalu salama",
    englishTranslation:
      'And the servants of the Most Merciful are those who walk upon the earth easily, and when the ignorant address them [harshly], they say [words of] peace.',
    source: 'Surah Al-Furqan 25:63',
    audioKey: '25:63',
    whyThis: 'Respond to harshness with peace - a hallmark of the true servants of Allah.',
    moods: ['Calm', 'Content'],
  },
  {
    id: 'quran_8_10',
    type: 'Quran',
    primaryText:
      "Wa mā ja'alahullāhu illā bushrā wa li-taṭma'inna bihī qulūbukum; wa man-naṣru illā min 'indillāh; innallāha 'Azīzun Ḥakīm",
    arabicText:
      'وَمَا جَعَلَهُ ٱللَّهُ إِلَّا بُشْرَىٰ وَلِتَطْمَئِنَّ بِهِۦ قُلُوبُكُمْ ۚ وَمَا ٱلنَّصْرُ إِلَّا مِنْ عِندِ ٱللَّهِ ۚ إِنَّ ٱللَّهَ عَزِيزٌ حَكِيمٌ ﴿١٠﴾',
    transliteration:
      "Wa mā ja'alahullāhu illā bushrā wa li-taṭma'inna bihī qulūbukum; wa man-naṣru illā min 'indillāh; innallāha 'Azīzun Ḥakīm",
    englishTranslation:
      'And Allah made it not but good tidings and so that your hearts would be assured thereby. And victory is not but from Allah. Indeed, Allah is Exalted in Might and Wise.',
    source: 'Surah Al-Anfal 8:10',
    audioKey: '8:10',
    whyThis:
      'Allah gives good tidings to assure your heart - tranquility comes from knowing that ultimate help is from Him.',
    moods: ['Calm'],
  },
  {
    id: 'quran_9_26',
    type: 'Quran',
    primaryText:
      "Thumma anzalallāhu sakīnatahū 'alā rasūlihī wa 'alal-mu'minīna wa anzala junūdan lam tarawhā wa 'adhdhaballadhīna kafarū; wa dhālika jazā'ul-kāfirīn",
    arabicText:
      'ثُمَّ أَنزَلَ اللَّهُ سَكِينَتَهُ عَلَىٰ رَسُولِهِ وَعَلَى الْمُؤْمِنِينَ وَأَنزَلَ جُنُودًا لَّمْ تَرَوْهَا وَعَذَّبَ الَّذِينَ كَفَرُوا ۚ وَذَٰلِكَ جَزَاءُ الْكَافِرِينَ ﴿٢٦﴾',
    transliteration:
      "Thumma anzalallāhu sakīnatahū 'alā rasūlihī wa 'alal-mu'minīna wa anzala junūdan lam tarawhā wa 'adhdhaballadhīna kafarū; wa dhālika jazā'ul-kāfirīn",
    englishTranslation:
      'Then Allah sent down His tranquillity upon His Messenger and upon the believers and sent down soldiers angels whom you did not see and punished those who disbelieved. And that is the recompense of the disbelievers.',
    source: 'Surah At-Tawbah 9:26',
    audioKey: '9:26',
    whyThis:
      'Allah sends down special tranquility (sakinah) during times of intense trial to steady the believers.',
    moods: ['Calm'],
  },
  {
    id: 'quran_9_40',
    type: 'Quran',
    primaryText:
      "Illā tanṣurūhu faqad naṣarahullāhu idh akhrajahulladhīna kafarū thāniyath-nayni idh humā fil-ghāri idh yaqūlu li-ṣāḥibihī lā taḥzan innallāha ma'anā; fa-anzalallāhu sakīnatahū 'alayhi wa ayyadahū bi-junūdin lam tarawhā wa ja'ala kalimatal-ladhīna kafar us-suflā; wa kalimatullāhi hiyal-'ulyā; wallāhu 'Azīzun Ḥakīm",
    arabicText:
      'إِلَّا تَنصُرُوهُ فَقَدْ نَصَرَهُ اللَّهُ إِذْ أَخْرَجَهُ الَّذِينَ كَفَرُوا ثَانِيَ اثْنَيْنِ إِذْ هُمَا فِي الْغَارِ إِذْ يَقُولُ لِصَاحِبِهِ لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا ۖ فَأَنزَلَ اللَّهُ سَكِينَتَهُ عَلَيْهِ وَأَيَّدَهُ بِجُنُودٍ لَّمْ تَرَوْهَا وَجَعَلَ كَلِمَةَ الَّذِينَ كَفَرُوا السُّفْلَىٰ ۗ وَكَلِمَةُ اللَّهِ هِيَ الْعُلْيَا ۗ وَاللَّهُ عَزِيزٌ حَكِيمٌ ﴿٤٠﴾',
    transliteration:
      "Illā tanṣurūhu faqad naṣarahullāhu idh akhrajahulladhīna kafarū thāniyath-nayni idh humā fil-ghāri idh yaqūlu li-ṣāḥibihī lā taḥzan innallāha ma'anā; fa-anzalallāhu sakīnatahū 'alayhi wa ayyadahū bi-junūdin lam tarawhā wa ja'ala kalimatal-ladhīna kafar us-suflā; wa kalimatullāhi hiyal-'ulyā; wallāhu 'Azīzun Ḥakīm",
    englishTranslation:
      'If you do not aid the Prophet - Allah has already aided him when those who disbelieved had driven him out [of Makkah] as one of two, when they were in the cave and he said to his companion, "Do not grieve; indeed Allah is with us." And Allah sent down his tranquility upon him and supported him with angels you did not see and made the word of those who disbelieved the lowest, while the word of Allah - that is the highest. And Allah is Exalted in Might and Wise.',
    source: 'Surah At-Tawbah 9:40',
    audioKey: '9:40',
    whyThis:
      'The ultimate source of calm: the presence of Allah and the descent of His sakinah, even in a dark cave.',
    moods: ['Calm'],
  },
  {
    id: 'quran_41_35',
    type: 'Quran',
    primaryText: 'Wa ma yulaqqaha illalladhina sabaru wa ma yulaqqaha illa dhu hadhhin adhim',
    arabicText:
      'وَمَا يُلَقَّاهَا إِلَّا الَّذِينَ صَبَرُوا وَمَا يُلَقَّاهَا إِلَّا ذُو حَظٍّ عَظِيمٍ ﴿٣٥﴾',
    transliteration: 'Wa ma yulaqqaha illalladhina sabaru wa ma yulaqqaha illa dhu hadhhin adhim',
    englishTranslation:
      'But none is granted it except those who are patient, and none is granted it except one having a great portion [of good].',
    source: 'Surah Fussilat 41:35',
    audioKey: '41:35',
    whyThis:
      'The ability to control anger is a gift granted to those with patience and great fortune.',
    moods: ['Angry'],
  },
  {
    id: 'quran_2_265',
    type: 'Quran',
    primaryText:
      'Wa mathalulladhina yunfiquna amwalahum-ubtigha-a mardatillahi wa tathbitan min anfusihim kamathal jannatin',
    arabicText:
      'وَمَثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمُ ابْتِغَاءَ مَرْضَاتِ اللَّهِ وَتَثْبِيتًا مِّنْ أَنفُسِهِمْ كَمَثَلِ جَنَّةٍ بِرَبْوَةٍ أَصَابَهَا وَابِلٌ فَآتَتْ أُكُلَهَا ضِعْفَيْنِ ﴿٢٦٥﴾',
    transliteration:
      'Wa mathalulladhina yunfiquna amwalahum-ubtigha-a mardatillahi wa tathbitan min anfusihim kamathal jannatin',
    englishTranslation:
      'And the example of those who spend their wealth seeking means to the approval of Allah and assuring [reward for] themselves is like a garden on high ground which is hit by a downpour - so it yields its fruits in double.',
    source: 'Surah Al-Baqarah 2:265',
    audioKey: '2:265',
    whyThis:
      'Spending in the path of Allah is like a garden that yields double - channel your energy for lasting impact.',
    moods: ['Energized', 'Grateful'],
  },

  // === HOPEFUL / RAJA ===
  {
    id: 'quran_65_2',
    type: 'Quran',
    primaryText: "Wa man yattaqillaha yaj'al lahu makhraja",
    arabicText: 'وَمَن يَتَّقِ ٱللَّهَ يَجۡعَل لَّهُۥ مَخۡرَجٗا ﴿٢﴾',
    transliteration: "Wa man yattaqillaha yaj'al lahu makhraja",
    englishTranslation: 'And whoever fears Allah - He will make for him a way out.',
    source: 'Surah At-Talaq 65:2',
    audioKey: '65:2',
    whyThis: 'Allah promises a way out for those who are mindful of Him.',
    moods: ['Hopeful'],
  },
  {
    id: 'quran_2_216',
    type: 'Quran',
    primaryText:
      "Wa 'asā an takrahū shay'an wa huwa khayrun lakum wa 'asā an tuhibbū shay'an wa huwa sharrun lakum wallāhu ya'lamu wa antum lā ta'lamūn",
    arabicText:
      'وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ ۖ وَعَسَىٰ أَن تُحِبُّوا شَيْئًا وَهُوَ شَرٌّ لَّكُمْ ۗ وَاللَّهُ يَعْلَمُ وَأَنتُمْ لَا تَعْلَمُونَ ﴿٢١٦﴾',
    transliteration:
      "Wa 'asā an takrahū shay'an wa huwa khayrun lakum wa 'asā an tuhibbū shay'an wa huwa sharrun lakum wallāhu ya'lamu wa antum lā ta'lamūn",
    englishTranslation:
      'But perhaps you hate a thing and it is good for you; and perhaps you love a thing and it is bad for you. And Allah knows, while you know not.',
    source: 'Surah Al-Baqarah 2:216',
    audioKey: '2:216',
    whyThis: "What seems bad may be good for you - trust Allah's wisdom.",
    moods: ['Sad'],
  },

  {
    id: 'quran_94_6',
    type: 'Quran',
    primaryText: "Inna ma'al-'usri yusra",
    arabicText: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾',
    transliteration: "Inna ma'al-'usri yusra",
    englishTranslation: 'Indeed, with hardship [will be] ease.',
    source: 'Surah Ash-Sharh 94:6',
    audioKey: '94:6',
    whyThis:
      'This promise is repeated - ease accompanies every hardship. Hope is built into the design.',
    moods: ['Hopeful'],
  },
  {
    id: 'quran_3_26',
    type: 'Quran',
    primaryText:
      "Qulillahumma malikal-mulki tu'til-mulka man tasha'u wa tanzi'ul-mulka mimman tasha'",
    arabicText:
      'قُلِ اللَّهُمَّ مَالِكَ الْمُلْكِ تُؤْتِي الْمُلْكَ مَن تَشَاءُ وَتَنزِعُ الْمُلْكَ مِمَّن تَشَاءُ ﴿٢٦﴾',
    transliteration: "Qulillahumma malikal-mulki tu'til-mulka man tasha'",
    englishTranslation:
      'Say, "O Allah, Owner of Sovereignty, You give sovereignty to whom You will and You take sovereignty away from whom You will."',
    source: 'Surah Ali Imran 3:26',
    audioKey: '3:26',
    whyThis: 'Allah is the Owner of all - He can change your situation in an instant.',
    moods: ['Hopeful'],
  },
  {
    id: 'quran_18_46',
    type: 'Quran',
    primaryText:
      "Al-mālu wal-banūna zīnatul-ḥayātid-dunyā, wal-bāqiyātuṣ-ṣāliḥātu khayrun 'inda rabbika thawāban wa khayrun amala",
    arabicText:
      'ٱلْمَالُ وَٱلْبَنُونَ زِينَةُ ٱلْحَيَوٰةِ ٱلدُّنْيَا ۖ وَٱلْبَٰقِيَٰتُ ٱلصَّٰلِحَٰتُ خَيْرٌ عِندَ رَبِّكَ ثَوَابًا وَخَيْرٌ أَمَلًا ﴿٤٦﴾',
    transliteration:
      "Al-mālu wal-banūna zīnatul-ḥayātid-dunyā, wal-bāqiyātuṣ-ṣāliḥātu khayrun 'inda rabbika thawāban wa khayrun amala",
    englishTranslation:
      'Wealth and children are [but] adornment of the worldly life. But the enduring good deeds are better to your Lord for reward and better for hope.',
    source: 'Surah Al-Kahf 18:46',
    audioKey: '18:46',
    whyThis: 'Good deeds last forever - your hope lies in what endures with Allah.',
    moods: ['Hopeful'],
  },
  {
    id: 'quran_17_11',
    type: 'Quran',
    primaryText: "Wa kanal-insanu 'ajula",
    arabicText: 'وَكَانَ الْإِنسَانُ عَجُولًا ﴿١١﴾',
    transliteration: "Wa kanal-insanu 'ajula",
    englishTranslation: 'And man is ever hasty.',
    source: 'Surah Al-Isra 17:11',
    audioKey: '17:11',
    whyThis: "Be patient - don't rush. Allah's timing is perfect even when we want results now.",
    moods: ['Hopeful'],
  },
  {
    id: 'quran_21_90',
    type: 'Quran',
    primaryText: "Innahum kanu yusari'una fil-khayrati wa yad'unana raghaban wa rahaba",
    arabicText:
      'إِنَّهُمْ كَانُوا يُسَارِعُونَ فِي الْخَيْرَاتِ وَيَدْعُونَنَا رَغَبًا وَرَهَبًا ﴿٩٠﴾',
    transliteration: "Innahum kanu yusari'una fil-khayrati wa yad'unana raghaban wa rahaba",
    englishTranslation:
      'Indeed, they used to hasten to good deeds and supplicate Us in hope and fear.',
    source: 'Surah Al-Anbiya 21:90',
    audioKey: '21:90',
    whyThis: 'The prophets combined hope with action - hasten in good while calling upon Allah.',
    moods: ['Hopeful'],
  },
  {
    id: 'quran_32_16',
    type: 'Quran',
    primaryText: "Yad'una rabbahum khawfan wa tama'an",
    arabicText: 'يَدْعُونَ رَبَّهُمْ خَوْفًا وَطَمَعًا ﴿١٦﴾',
    transliteration: "Yad'una rabbahum khawfan wa tama'an",
    englishTranslation: 'They call upon their Lord in fear and aspiration.',
    source: 'Surah As-Sajdah 32:16',
    audioKey: '32:16',
    whyThis: 'Balance hope with reverence - call upon Allah with both aspiration and awe.',
    moods: ['Hopeful'],
  },

  // === CALM / SAKINAH ===

  {
    id: 'quran_13_28',
    type: 'Quran',
    primaryText:
      "Alladhīna āmanū wa tatma'innu qulūbuhum bidhikrillāh; alā bidhikrillāhi tatma'innul-qulūb",
    arabicText:
      'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴿٢٨﴾',
    transliteration:
      "Alladhīna āmanū wa tatma'innu qulūbuhum bidhikrillāh; alā bidhikrillāhi tatma'innul-قُلُوبُ",
    englishTranslation:
      'Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured.',
    source: "Surah Ar-Ra'd 13:28",
    audioKey: '13:28',
    whyThis: 'The remembrance of Allah (dhikr) is the ultimate source of inner peace.',
    moods: ['Calm'],
  },
  {
    id: 'quran_89_27',
    type: 'Quran',
    primaryText: "Yā ay-yatuhan-nafsul-mutma'innatur-ji'ī ilā rabbiki rādiyatan mardiy-yah",
    arabicText:
      'يَا أَيَّتُهَا النَّفْسُ الْمُطْمَئِنَّةُ ارْجِعِي إِلَىٰ رَبِّكِ رَاِضِيَةً مَّرْضِيَّةً ﴿٢٧-٢٨﴾',
    transliteration: "Yā ay-yatuhan-nafsul-mutma'innatur-ji'ī ilā rabbiki rādiyatan mardiy-yah",
    englishTranslation:
      'O reassured soul, return to your Lord, well-pleased and pleasing [to Him].',
    source: 'Surah Al-Fajr 89:27-28',
    audioKey: '89:27-28',
    whyThis: 'The ultimate peace is the reassured soul returning to Allah in contentment.',
    moods: ['Calm'],
  },
  {
    id: 'quran_2_45',
    type: 'Quran',
    primaryText: "Wasta'īnū bis-sabri was-salāh; wa innahā lakabīratun illā 'alal-khāshi'īn",
    arabicText:
      'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ وَإِنَّهَا لَكَبِيرةٌ إِلَّا عَلَى الْخَاشِعِينَ ﴿٤٥﴾',
    transliteration: "Wasta'īnū bis-sabri was-salāh; wa innahā lakabīratun illā 'alal-khāshi'īn",
    englishTranslation:
      'And seek help through patience and prayer, and indeed, it is difficult except for the humbly submissive [to Allah].',
    source: 'Surah Al-Baqarah 2:45',
    audioKey: '2:45',
    whyThis: 'Prayer is a source of help and strength, though its ease is found in humility.',
    moods: ['Stressed', 'Calm'],
  },
  {
    id: 'quran_6_17',
    type: 'Quran',
    primaryText:
      "Wa in yamsaskallahu bidurrin fala kashifa lahu illa hu; wa in yamsaska bikhayrin fahuwa 'ala kulli shay'in qadir",
    arabicText:
      'وَإِن يَمْسَسْكَ اللَّهُ بِضُرٍّ فَلَا كَاشِفَ لَهُ إِلَّا هُوَ ۖ وَإِن يَمْسَسْكَ بِخَيْرٍ فَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ ﴿١٧﴾',
    transliteration: 'Wa in yamsaskallahu bidurrin fala kashifa lahu illa hu',
    englishTranslation:
      'And if Allah should touch you with adversity, there is no remover of it except Him. And if He touches you with good - then He is over all things competent.',
    source: "Surah Al-An'am 6:17",
    audioKey: '6:17',
    whyThis: 'Only Allah can remove hardship - turn to Him, the One with all power.',
    moods: ['Stressed'],
  },
  {
    id: 'quran_7_188',
    type: 'Quran',
    primaryText: "La amliku linafsi naf'an wa la darran illa ma sha'allah",
    arabicText: 'لَّا أَمْلِكُ لِنَفْسِي نَفْعًا وَلَا ضَرًّا إِلَّا مَا شَاءَ اللَّهُ ﴿١٨٨﴾',
    transliteration: "La amliku linafsi naf'an wa la darran illa ma sha'allah",
    englishTranslation:
      'I hold not for myself [the power of] benefit or harm, except what Allah has willed.',
    source: "Surah Al-A'raf 7:188",
    audioKey: '7:188',
    whyThis: 'Let go of the illusion of control - only what Allah wills happens.',
    moods: ['Stressed'],
  },

  {
    id: 'quran_42_30',
    type: 'Quran',
    primaryText: "Wa ma asakum-min musibatin fabima kasabat aydikum wa ya'fu 'an kathir",
    arabicText:
      'وَمَا أَصَابَكُم مِّن مُّصِيبَةٍ فَبِمَا كَسَبَتْ أَيْدِيكُمْ وَيَعْفُو عَن كَثِيرٍ ﴿٣٠﴾',
    transliteration: "Wa ma asakum-min musibatin fabima kasabat aydikum wa ya'fu 'an kathir",
    englishTranslation:
      'And whatever strikes you of disaster - it is for what your hands have earned; but He pardons much.',
    source: 'Surah Ash-Shura 42:30',
    audioKey: '42:30',
    whyThis: 'Trials are often expiation - and Allah pardons even more than what befalls us.',
    moods: ['Stressed'],
  },
  {
    id: 'quran_27_62',
    type: 'Quran',
    primaryText: "Amman yujibul-mudtarra idha da'ahu wa yakshifus-su'a",
    arabicText: 'أَمَّن يُجِيبُ الْمُضْطَرَّ إِذَا دَعَاهُ وَيَكْشِفُ السُّوءَ ﴿٦٢﴾',
    transliteration: "Amman yujibul-mudtarra idha da'ahu wa yakshifus-su'a",
    englishTranslation:
      'Is He [not best] who responds to the desperate one when he calls upon Him and removes evil?',
    source: 'Surah An-Naml 27:62',
    audioKey: '27:62',
    whyThis:
      'Allah specifically responds to the desperate - He removes the evil that afflicts you.',
    moods: ['Stressed'],
  },
  {
    id: 'quran_21_83',
    type: 'Quran',
    primaryText: 'Anni massaniyad-durru wa anta arhamur-rahimin',
    arabicText: 'أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ ﴿٨٣﴾',
    transliteration: 'Anni massaniyad-durru wa anta arhamur-rahimin',
    englishTranslation:
      'Indeed, adversity has touched me, and You are the Most Merciful of the merciful.',
    source: 'Surah Al-Anbiya 21:83',
    audioKey: '21:83',
    whyThis: "The du'a of Ayyub (AS) - acknowledge the hardship, then turn to the Most Merciful.",
    moods: ['Stressed'],
  },
  {
    id: 'quran_9_51',
    type: 'Quran',
    primaryText:
      "Qul lan yusibana illa ma kataballahu lana huwa mawlana; wa 'alallahi falyatawakkalil-mu'minun",
    arabicText:
      'قُل لَّن يُصِيبَنَا إِلَّا مَا كَتَبَ اللَّهُ لَنَا هُوَ مَوْلَانَا ۚ وَعَلَى اللَّهِ فَلْيَتَوَكَّلِ الْمُؤْمِنُونَ ﴿٥١﴾',
    transliteration: 'Qul lan yusibana illa ma kataballahu lana huwa mawlana',
    englishTranslation:
      'Say, "Never will we be struck except by what Allah has decreed for us; He is our protector." And upon Allah let the believers rely.',
    source: 'Surah At-Tawbah 9:51',
    audioKey: '9:51',
    whyThis: 'What strikes you was written - He is your Protector, so place your trust in Him.',
    moods: ['Stressed'],
  },
  {
    id: 'quran_48_4',
    type: 'Quran',
    primaryText: "Huwal-ladhī anzalas-sakīnata fī qulūbil-mu'minīna liyazdādū īmānam-ma'a īmānihim",
    arabicText:
      'هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ لِيَزْدَادُوا إِيمَانًا مَّعَ إِيمَانِهِمْ ﴿٤﴾',
    transliteration:
      "Huwal-ladhī anzalas-sakīnata fī qulūbil-mu'minīna liyazdādū īmānam-ma'a īmānihim",
    englishTranslation:
      'It is He who sent down tranquility into the hearts of the believers that they would increase in faith along with their [present] faith.',
    source: 'Surah Al-Fath 48:4',
    audioKey: '48:4',
    whyThis: 'Allah Himself sends sakinah (tranquility) to the hearts of believers.',
    moods: ['Calm'],
  },
  {
    id: 'quran_30_21',
    type: 'Quran',
    primaryText:
      "Wa min āyātihī an khalaqa lakum min anfusikum azwājan litaskunū ilayhā wa ja'ala baynakum mawad-datan wa rahmah. Inna fī dhālika la-āyātil-liqawmin yatafakkirūn",
    arabicText:
      'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً ۚ إِنَّ فِي ذَٰلِكَ لَآيَاتٍ لِّقَوْمٍ يَتَفَكَّرُونَ ﴿٢١﴾',
    transliteration:
      "Wa min āyātihī an khalaqa lakum min anfusikum azwājan litaskunū ilayhā wa ja'ala baynakum mawad-datan wa rahmah. Inna fī dhālika la-āyātil-liqawmin yatafakkirūn",
    englishTranslation:
      'And of His signs is that He created for you from yourselves mates that you may find tranquility in them; and He placed between you affection and mercy. Indeed in that are signs for a people who give thought.',
    source: 'Surah Ar-Rum 30:21',
    audioKey: '30:21',
    whyThis: 'Tranquility (sakinah) is a divine gift placed between hearts in marriage.',
    moods: ['Calm', 'Content'],
  },
  {
    id: 'quran_48_18',
    type: 'Quran',
    primaryText:
      "Laqad raḍiyallāhu 'anil-mu'minīna idh yubāyi'ūnaka taḥtash-shajarati fa'alima mā fī qulūbihim fa-anzalas-sakīnata 'alayhim wa athābahum fatḥan qarībā",
    arabicText:
      'لَّقَدْ رَضِيَ اللَّهُ عَنِ الْمُؤْمِنِينَ إِذْ يُبَايِعُونَكَ تَحْتَ الشَّجَرَةِ فَعَلِمَ مَا فِي قُلُوبِهِمْ فَأَنزَلَ السَّكِينَةَ عَلَيْهِمْ وَأَثَابَهُمْ فَتْحًا قَرِيبًا ﴿١٨﴾',
    transliteration:
      "Laqad raḍiyallāhu 'anil-mu'minīna idh yubāyi'ūnaka taḥtash-shajarati fa'alima mā fī qulūbihim fa-anzalas-sakīnata 'alayhim wa athābahum fatḥan qarībā",
    englishTranslation:
      'Certainly was Allah pleased with the believers when they pledged allegiance to you, [O Muhammad], under the tree, and He knew what was in their hearts, so He sent down tranquillity upon them and rewarded them with an imminent conquest.',
    source: 'Surah Al-Fath 48:18',
    audioKey: '48:18',
    whyThis:
      "Allah's pleasure and tranquility go together - when He is pleased with you, He sends down peace.",
    moods: ['Calm'],
  },
  {
    id: 'quran_2_208',
    type: 'Quran',
    primaryText:
      "Yā ayyuhalladhīna āmanud-khulū fis-silmi kāffatan wa lā tattabi'ū khuṭuwātish-shayṭān; innahū lakum 'aduwwun mubīn",
    arabicText:
      'يَا أَيُّهَا الَّذِينَ آمَنُوا ادْخُلُوا فِي السِّلْمِ كَافَّةً وَلَا تَتَّبِعُوا خُطُوَاتِ الشَّيْطَانِ ۚ إِنَّهُ لَكُمْ عَدُوٌّ مُّبِينٌ ﴿٢٠٨﴾',
    transliteration:
      "Yā ayyuhalladhīna āmanud-khulū fis-silmi kāffatan wa lā tattabi'ū khuṭuwātish-shayṭān; innahū lakum 'aduwwun mubīn",
    englishTranslation:
      'O you who have believed, enter into Islam completely [and perfectly] and do not follow the footsteps of Satan. Indeed, he is to you a clear enemy.',
    source: 'Surah Al-Baqarah 2:208',
    audioKey: '2:208',
    whyThis:
      "Complete submission to Allah brings complete peace - silm means both 'peace' and 'submission'.",
    moods: ['Calm'],
  },
  {
    id: 'quran_6_54',
    type: 'Quran',
    primaryText:
      "Wa idhā jā'akal-ladhīna yu'minūna bi-āyātinā fa-qul salāmun 'alaykum; kataba rabbukum 'alā nafsihir-raḥmata annahū man 'amila minkum sū'an bi-jahālatin thumma tāba min ba'dihī wa aṣlaḥa fa-annahū Ghafūrur-Raḥīm",
    arabicText:
      'وَإِذَا جَاءَكَ الَّذِينَ يُؤْمِنُونَ بِآيَاتِنَا فَقُلْ سَلَامٌ عَلَيْكُمْ ۖ كَتَبَ رَبُّكُمْ عَلَىٰ نَفْسِهِ الرَّحْمَةَ ۖ أَنَّهُ مَنْ عَمِلَ مِنكُمْ سُوءًا بِجَهَالَةٍ ثُمَّ تَابَ مِن بَعْدِهِ وَأَصْلَحَ فَأَنَّهُ غَفُورٌ رَّحِيمٌ ﴿٥٤﴾',
    transliteration:
      "Wa idhā jā'akal-ladhīna yu'minūna bi-āyātinā fa-qul salāmun 'alaykum; kataba rabbukum 'alā nafsihir-raḥmata annahū man 'amila minkum sū'an bi-jahālatin thumma tāba min ba'dihī wa aṣlaḥa fa-annahū Ghafūrur-Raḥīm",
    englishTranslation:
      'And when those come to you who believe in Our verses, say, "Peace be upon you. Your Lord has decreed upon Himself mercy: that any of you who does wrong out of ignorance and then repents after that and corrects himself - indeed, He is Forgiving and Merciful."',
    source: "Surah Al-An'am 6:54",
    audioKey: '6:54',
    whyThis: 'Allah greets the believers with peace and has obligated mercy upon Himself.',
    moods: ['Calm'],
  },
  {
    id: 'quran_16_32',
    type: 'Quran',
    primaryText:
      "Alladhīna tatawaffāhumul-malā'ikatu ṭayyibīna yaqūlūna salāmun 'alaykumud-khulul-jannata bimā kuntum ta'malūn",
    arabicText:
      'الَّذِينَ تَتَوَفَّاهُمُ الْمَلَائِكَةُ طَيِّبِينَ ۙ يَقُولُونَ سَلَامٌ عَلَيْكُمُ ادْخُلُوا الْجَنَّةَ بِمَا كُنتُمْ تَعْمَلُونَ ﴿٣٢﴾',
    transliteration:
      "Alladhīna tatawaffāhumul-malā'ikatu ṭayyibīna yaqūlūna salāmun 'alaykumud-khulul-jannata bimā kuntum ta'malūn",
    englishTranslation:
      'The ones whom the angels take in death, [being] good and pure; [the angels] will say, "Peace be upon you. Enter Paradise for what you used to do."',
    source: 'Surah An-Nahl 16:32',
    audioKey: '16:32',
    whyThis:
      'The ultimate peace awaits the pure-hearted: a greeting of salam from the angels at the gates of Jannah.',
    moods: ['Calm'],
  },
  {
    id: 'quran_36_58',
    type: 'Quran',
    primaryText: 'Salamun qawlam-mir-rabbir-rahim',
    arabicText: 'سَلَامٌ قَوْلًا مِّن رَّبٍّ رَّحِيمٍ ﴿٥٨﴾',
    transliteration: 'Salamun qawlam-mir-rabbir-rahim',
    englishTranslation: '"Peace," a word from a Merciful Lord.',
    source: 'Surah Ya-Sin 36:58',
    audioKey: '36:58',
    whyThis: 'The ultimate greeting of peace comes directly from the Lord of Mercy Himself.',
    moods: ['Calm'],
  },
  {
    id: 'quran_97_5',
    type: 'Quran',
    primaryText: "Salamun hiya hatta matla'il-fajr",
    arabicText: 'سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ ﴿٥﴾',
    transliteration: "Salamun hiya hatta matla'il-fajr",
    englishTranslation: 'Peace it is until the emergence of dawn.',
    source: 'Surah Al-Qadr 97:5',
    audioKey: '97:5',
    whyThis: 'Laylatul Qadr is pure peace - a night that is entirely salam until dawn.',
    moods: ['Calm'],
  },
  {
    id: 'quran_56_91',
    type: 'Quran',
    primaryText: 'Fa-salamun laka min as-habil-yamin',
    arabicText: 'فَسَلَامٌ لَّكَ مِنْ أَصْحَابِ الْيَمِينِ ﴿٩١﴾',
    transliteration: 'Fa-salamun laka min as-habil-yamin',
    englishTranslation:
      'Then [the greeting of] "Peace be upon you" from the companions of the right.',
    source: "Surah Al-Waqi'ah 56:91",
    audioKey: '56:91',
    whyThis:
      'The companions of the right will greet each other with peace - a community of tranquility.',
    moods: ['Calm'],
  },

  {
    id: 'quran_93_11',
    type: 'Quran',
    primaryText: "Wa amma bi-ni'mati rabbika fahaddith",
    arabicText: 'وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ ﴿١١﴾',
    transliteration: "Wa amma bi-ni'mati rabbika fahaddith",
    englishTranslation: 'But as for the favor of your Lord, report [it].',
    source: 'Surah Ad-Duha 93:11',
    audioKey: '93:11',
    whyThis: 'Speak of your blessings - sharing gratitude amplifies contentment.',
    moods: ['Content', 'Grateful'],
  },
  {
    id: 'quran_55_13',
    type: 'Quran',
    primaryText: 'Fabi-ayyi ala-i rabbikuma tukadhdhibani',
    arabicText: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ ﴿١٣﴾',
    transliteration: 'Fabi-ayyi ala-i rabbikuma tukadhdhibani',
    englishTranslation: 'So which of the favors of your Lord would you deny?',
    source: 'Surah Ar-Rahman 55:13',
    audioKey: '55:13',
    whyThis:
      "This refrain repeated 31 times in Surah Ar-Rahman - a powerful reminder to acknowledge Allah's countless favors.",
    moods: ['Content', 'Grateful'],
  },

  {
    id: 'quran_5_3',
    type: 'Quran',
    primaryText:
      "Al-yawma akmaltu lakum dinakum wa atmamtu 'alaykum ni'mati wa raditu lakumul-islama dina",
    arabicText:
      'الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ وَأَتْمَمْتُ عَلَيْكُمْ نِعْمَتِي وَرَضِيتُ لَكُمُ الْإِسْلَامَ دِينًا ﴿٣﴾',
    transliteration:
      "Al-yawma akmaltu lakum dinakum wa atmamtu 'alaykum ni'mati wa raditu lakumul-islama dina",
    englishTranslation:
      'This day I have perfected for you your religion and completed My favor upon you and have approved for you Islam as religion.',
    source: 'Surah Al-Maidah 5:3',
    audioKey: '5:3',
    whyThis: 'Islam itself is the ultimate blessing - a complete, perfected favor from Allah.',
    moods: ['Content', 'Grateful'],
  },
  {
    id: 'quran_28_73',
    type: 'Quran',
    primaryText:
      "Wa min rahmatihi ja'ala lakumul-layla wan-nahara litaskunu fihi wa litabtaghu min fadlihi",
    arabicText:
      'وَمِن رَّحْمَتِهِ جَعَلَ لَكُمُ اللَّيْلَ وَالنَّهَارَ لِتَسْكُنُوا فِيهِ وَلِتَبْتَغُوا مِن فَضْلِهِ ﴿٧٣﴾',
    transliteration:
      "Wa min rahmatihi ja'ala lakumul-layla wan-nahara litaskunu fihi wa litabtaghu min fadlihi",
    englishTranslation:
      'And out of His mercy He made for you the night and the day that you may rest therein and [by day] seek from His bounty.',
    source: 'Surah Al-Qasas 28:73',
    audioKey: '28:73',
    whyThis:
      'The rhythm of night and day is a mercy - rest and provision are both gifts from Allah.',
    moods: ['Content'],
  },
  {
    id: 'quran_2_152',
    type: 'Quran',
    primaryText: 'Fadhkuruni adhkurkum washkuru li wa la takfurun',
    arabicText: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ ﴿١٥٢﴾',
    transliteration: 'Fadhkuruni adhkurkum washkuru li wa la takfurun',
    englishTranslation:
      'So remember Me; I will remember you. And be grateful to Me and do not deny Me.',
    source: 'Surah Al-Baqarah 2:152',
    audioKey: '2:152',
    whyThis: 'When you remember Allah, He remembers you - the ultimate reciprocal relationship.',
    moods: ['Content', 'Grateful'],
    moodScores: { Content: 25, Grateful: 20 },
  },
  {
    id: 'quran_2_186',
    type: 'Quran',
    primaryText: "Wa-idhā sa'alaka 'ibādī 'annī fa-innī qarīb; ujību da'watad-dā'i idhā da'ān",
    arabicText:
      'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ ﴿١٨٦﴾',
    transliteration: "Wa-idhā sa'alaka 'ibādī 'annī fa-innī qarīb; ujību da'watad-dā'i idhā da'ān",
    englishTranslation:
      'And when My servants ask you concerning Me - indeed I am near. I respond to the invocation of the supplicant when he calls upon Me.',
    source: 'Surah Al-Baqarah 2:186',
    audioKey: '2:186',
    whyThis: 'Allah is always near, listening to your worries and ready to respond to your calls.',
    moods: ['Anxious', 'Sad'],
  },

  {
    id: 'quran_20_25',
    type: 'Quran',
    primaryText: 'Rabbish-rah lī sadrā, wa yassir lī amrī',
    arabicText: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي ﴿٢٥-٢٦﴾',
    transliteration: 'Rabbish-rah lī sadrā, wa yassir lī amrī',
    englishTranslation:
      'My Lord, expand for me my breast [with assurance] and ease for me my task.',
    source: 'Surah Taha 20:25-26',
    audioKey: '20:25-26',
    whyThis:
      'The prayer of Musa (AS) when facing a heavy responsibility - seeking inner expansion and outer ease.',
    moods: ['Anxious', 'Stressed'],
  },
  {
    id: 'quran_40_44',
    type: 'Quran',
    primaryText: "Wa ufawwidu amrī ilallāh; innallāha basīrum bil-'ibād",
    arabicText: 'وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ ۚ إِنَّ اللَّهَ بَصِيرٌ بِالْعِبَادِ ﴿٤٤﴾',
    transliteration: "Wa ufawwidu amrī ilallāh; innallāha basīrum bil-'ibād",
    englishTranslation:
      'And I entrust my affair to Allah. Indeed, Allah is Seeing of [His] servants.',
    source: 'Surah Ghafir 40:44',
    audioKey: '40:44',
    whyThis:
      'Actively entrusting your path to Allah brings immediate relief from the weight of results.',
    moods: ['Anxious', 'Stressed'],
  },
  {
    id: 'quran_2_153',
    type: 'Quran',
    primaryText: "Yā ayyuhalladhīna āmanusta'īnū bis-sabri was-salāh; innallāha ma'as-sābirīn",
    arabicText:
      'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ ﴿١٥٣﴾',
    transliteration: "Yā ayyuhalladhīna āmanusta'īnū bis-sabri was-salāh; innallāha ma'as-sābirīn",
    englishTranslation:
      'O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.',
    source: 'Surah Al-Baqarah 2:153',
    audioKey: '2:153',
    whyThis:
      "When anxiety strikes, seeking help through the stability of prayer and the endurance of patience draws Allah's special presence.",
    moods: ['Anxious', 'Tired', 'Stressed'],
  },
  {
    id: 'quran_41_30',
    type: 'Quran',
    primaryText: 'Alladhīna qālū rabbunallāhu thummastaqāmū',
    arabicText:
      'إِنَّ الَّذِينَ قَالُوا رَبُّنَا اللَّهُ ثُمَّ اسْتَقَامُوا تَتَنَزَّلُ عَلَيْهِمُ الْمَلَائِكَةُ أَلَّا تَخَافُوا وَلَا تَحْزَنُوا ﴿٣٠﴾',
    transliteration: 'Alladhīna qālū rabbunallāhu thummastaqāmū',
    englishTranslation:
      'Indeed, those who have said, "Our Lord is Allah " and then remained on a right course - the angels will descend upon them, [saying], "Do not fear and do not grieve."',
    source: 'Surah Fussilat 41:30',
    audioKey: '41:30',
    whyThis:
      'Divine reassurance for those staying the course: angels are sent to remove grief and fear.',
    moods: ['Sad', 'Anxious'],
  },
  {
    id: 'quran_20_46',
    type: 'Quran',
    primaryText: "Lā takhāfā; innanī ma'akumā asma'u wa arā",
    arabicText: 'لَا تَخَافَا ۖ إِنَّنِي مَعَكُمَا أَسْمَعُ وَأَرَىٰ ﴿٤٦﴾',
    transliteration: "Lā takhāfā; innanī ma'akumā asma'u wa arā",
    englishTranslation: 'Fear not. Indeed, I am with you both; I hear and I see.',
    source: 'Surah Taha 20:46',
    audioKey: '20:46',
    whyThis: 'Allah is witnessing your struggle directly. You are never unseen or unheard.',
    moods: ['Sad', 'Anxious'],
  },

  {
    id: 'quran_8_33',
    type: 'Quran',
    primaryText: "Wa mā kānallāhu mu'adh-dhibahum wa hum yastaghfirūn",
    arabicText: 'وَمَا كَانَ اللَّهُ مُعَذِّبَهُمْ وَهُمْ يَسْتَغْفِرُونَ ﴿٣٣﴾',
    transliteration: "Wa mā kānallāhu mu'adh-dhibahum wa hum yastaghfirūn",
    englishTranslation: 'And Allah would not punish them while they seek forgiveness.',
    source: 'Surah Al-Anfal 8:33',
    audioKey: '8:33',
    whyThis: 'Istighfar (seeking forgiveness) is a literal shield from difficulty and guilt.',
    moods: ['Sad', 'Stressed'],
  },

  {
    id: 'quran_16_53',
    type: 'Quran',
    primaryText: "Wa mā bikum min ni'matin faminallāh",
    arabicText: 'وَمَا بِكُم مِّن نِّعْمَةٍ فَمِنَ اللَّهِ ﴿٥٣﴾',
    transliteration: "Wa mā bikum min ni'matin faminallāh",
    englishTranslation: 'And whatever you have of favor - it is from Allah.',
    source: 'Surah An-Nahl 16:53',
    audioKey: '16:53',
    whyThis:
      'Recognizing that every single positive thing in your life is a direct gift from the Creator.',
    moods: ['Grateful', 'Content'],
  },
  {
    id: 'quran_35_35',
    type: 'Quran',
    primaryText:
      "Alladhī aḥallanā dāra al-muqāmati min faḍlihi lā yamassunā fīhā naṣabun wa lā yamassunā fīhā lughūb",
    arabicText: 'الَّذِي أَحَلَّنَا دَارَ الْمُقَامَةِ مِن فَضْلِهِ لَا يَمَسُّنَا فِيهَا نَصَبٌ وَلَا يَمَسُّنَا فِيهَا لُغُوبٌ ﴿٣٥﴾',
    transliteration:
      "Alladhī aḥallanā dāra al-muqāmati min faḍlihi lā yamassunā fīhā naṣabun wa lā yamassunā fīhā lughūb",
    englishTranslation:
      'He who has settled us in the Home of Settlement by His bounty. There touches us not in it any fatigue, and there touches us not in it weariness.',
    source: 'Surah Fatir 35:35',
    audioKey: '35:35',
    whyThis:
      'A reminder that current fatigue is earthly and temporary - a state of perfection awaits.',
    moods: ['Tired', 'Stressed'],
  },
  {
    id: 'quran_25_47',
    type: 'Quran',
    primaryText: "Wa huwalladhi ja'ala lakumul-layla libasan wan-nawma subata",
    arabicText: 'وَهُوَ الَّذِي جَعَلَ لَكُمُ اللَّيْلَ لِبَاسًا وَالنَّوْمَ سُبَاتًا ﴿٤٧﴾',
    transliteration: "Wa huwalladhi ja'ala lakumul-layla libasan wan-nawma subata",
    englishTranslation:
      'And it is He who has made the night for you as clothing and sleep [a means for] rest.',
    source: 'Surah Al-Furqan 25:47',
    audioKey: '25:47',
    whyThis: 'Allah designed sleep as a mercy - rest is a divine gift, not weakness.',
    moods: ['Tired'],
  },
  {
    id: 'quran_78_9',
    type: 'Quran',
    primaryText: "Wa ja'alna nawmakum subata",
    arabicText: 'وَجَعَلْنَا نَوْمَكُمْ سُبَاتًا ﴿٩﴾',
    transliteration: "Wa ja'alna nawmakum subata",
    englishTranslation: 'And made your sleep [a means for] rest.',
    source: 'Surah An-Naba 78:9',
    audioKey: '78:9',
    whyThis: 'Sleep is not a waste of time but a deliberate creation for your renewal.',
    moods: ['Tired'],
  },
  {
    id: 'quran_30_23',
    type: 'Quran',
    primaryText:
      'Wa min ayatihi manamukum bil-layli wan-nahari wabtigha-ukum min fadlih. Inna fī dhālika la-āyātil-liqawmin yasma’ūn',
    arabicText:
      'وَمِنْ آيَاتِهِ مَنَامُكُم بِاللَّيْلِ وَالنَّهَارِ وَابْتِغَاؤُكُم مِّن فَضْلِهِ ۚ إِنَّ فِي ذَٰلِكَ لَآيَاتٍ لِّقَوْمٍ يَسْمَعُونَ ﴿٢٣﴾',
    transliteration:
      'Wa min ayatihi manamukum bil-layli wan-nahari wabtigha-ukum min fadlih. Inna fī dhālika la-āyātil-liqawmin yasma’ūn',
    englishTranslation:
      'And of His signs is your sleep by night and day and your seeking of His bounty. Indeed in that are signs for a people who listen.',
    source: 'Surah Ar-Rum 30:23',
    audioKey: '30:23',
    whyThis: 'Sleep is one of the signs of Allah - a miracle we experience daily.',
    moods: ['Tired'],
  },
  {
    id: 'quran_6_13',
    type: 'Quran',
    primaryText: 'Wa lahu ma sakana fil-layli wan-nahar',
    arabicText: 'وَلَهُ مَا سَكَنَ فِي اللَّيْلِ وَالنَّهَارِ ﴿١٣﴾',
    transliteration: 'Wa lahu ma sakana fil-layli wan-nahar',
    englishTranslation: 'And to Him belongs that which reposes by night and by day.',
    source: "Surah Al-An'am 6:13",
    audioKey: '6:13',
    whyThis:
      'When you rest, you rest in what belongs to Allah - He owns the stillness of the night.',
    moods: ['Tired'],
  },
  {
    id: 'quran_73_1_4',
    type: 'Quran',
    primaryText:
      "Ya ayyuhal-muzzammil. Qumil-layla illa qalila. Nisfahu awinqus minhu qalila. Aw zid 'alayhi wa rattilil-qur'ana tartila",
    arabicText:
      'يَا أَيُّهَا الْمُزَّمِّلُ ﴿١﴾ قُمِ اللَّيْلَ إِلَّا قَلِيلًا ﴿٢﴾ نِّصْفَهُ أَوِ انقُصْ مِنْهُ قَلِيلًا ﴿٣﴾ أَوْ زِدْ عَلَيْهِ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴿٤﴾',
    transliteration: 'Ya ayyuhal-muzzammil. Qumil-layla illa qalila',
    englishTranslation:
      'O you who wraps himself [in clothing], arise [to pray] the night, except for a little - half of it - or subtract from it a little. Or add to it, and recite the Quran with measured recitation.',
    source: 'Surah Al-Muzzammil 73:1-4',
    audioKey: '73:1-4',
    whyThis: 'Even in fatigue, a portion of night prayer revives the soul. Start small.',
    moods: ['Tired'],
  },
  {
    id: 'quran_2_177',
    type: 'Quran',
    primaryText: "Was-sabirina fid-darra'i wal-ba'sa'i wa hinal-ba's",
    arabicText: 'وَالصَّابِرِينَ فِي الْبَأْسَاءِ وَالضَّرَّاءِ وَحِينَ الْبَأْسِ ﴿١٧٧﴾',
    transliteration: "Was-sabirina fid-darra'i wal-ba'sa'i wa hinal-ba's",
    englishTranslation: 'And those who are patient in poverty and hardship and during battle.',
    source: 'Surah Al-Baqarah 2:177',
    audioKey: '2:177',
    whyThis: 'Patience through exhaustion is praiseworthy - your struggle is seen.',
    moods: ['Tired'],
  },
  {
    id: 'quran_20_130',
    type: 'Quran',
    primaryText:
      "Wa sabbih bihamdi rabbika qabla tulu'ish-shamsi wa qabla ghurubiba wa min ana'il-layli fasabbih wa atrafa-n-nahari la'allaka tarda",
    arabicText:
      'وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ الشَّمْسِ وَقَبْلَ غُرُوبِهَا ۖ وَمِنْ آنَاءِ اللَّيْلِ فَسَبِّحْ وَأَطْرَافَ النَّهَارِ لَعَلَّكَ تَرْضَىٰ ﴿١٣٠﴾',
    transliteration: "Wa sabbih bihamdi rabbika qabla tulu'ish-shamsi wa qabla ghurubiha",
    englishTranslation:
      'And exalt [Allah] with praise of your Lord before the rising of the sun and before its setting; and during periods of the night exalt [Him]... that you may be satisfied.',
    source: 'Surah Ta-Ha 20:130',
    audioKey: '20:130',
    whyThis: 'Dhikr at key times brings satisfaction - structure your rest around remembrance.',
    moods: ['Tired'],
  },
  {
    id: 'quran_17_79',
    type: 'Quran',
    primaryText:
      "Wa minal-layli fatahajjad bihi nafilatal-laka 'asa an yab'athaka rabbuka maqaman mahmuda",
    arabicText:
      'وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَّكَ عَسَىٰ أَن يَبْعَثَكَ رَبُّكَ مَقَامًا مَّحْمُودًا ﴿٧٩﴾',
    transliteration: 'Wa minal-layli fatahajjad bihi nafilatal-laka',
    englishTranslation:
      'And from [part of] the night, pray with it as additional [worship] for you; it is expected that your Lord will resurrect you to a praised station.',
    source: 'Surah Al-Isra 17:79',
    audioKey: '17:79',
    whyThis: 'Night prayer, even when tired, elevates you to a praised station.',
    moods: ['Tired'],
  },
  {
    id: 'quran_94_7',
    type: 'Quran',
    primaryText: 'Fa-idhā faraghta fansab. wa ilā rabbika farghab',
    arabicText: 'فَإِذَا فَرَغْتَ فَانصَبْ. وَإِلَىٰ رَبِّكَ فَارْغَبْ ﴿٧-٨﴾',
    transliteration: 'Fa-idhā faraghta fansab. wa ilā rabbika farghab',
    englishTranslation:
      'So when you have finished [your duties], then stand up [for worship]. And to your Lord direct [your] longing.',
    source: 'Surah Al-Inshirah 94:7-8',
    audioKey: '94:7-8',
    whyThis: 'The secret to sustainable energy: recharging your spirit after exhausting your body.',
    moods: ['Energized'],
  },
  {
    id: 'quran_29_69',
    type: 'Quran',
    primaryText: 'Walladhīna jāhadū fīnā lanahdiyannahum subulanā',
    arabicText: 'وَٱلَّذِينَ جَٰهَدُوا۟ فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا ﴿٦٩﴾',
    transliteration: 'Walladhīna jāhadū fīnā lanahdiyannahum subulanā',
    englishTranslation: 'And those who strive for Us - We will surely guide them to Our ways.',
    source: 'Surah Al-Ankabut 29:69',
    audioKey: '29:69',
    whyThis: 'Guidance is guaranteed for the struggle itself. Your effort is the key to clarity.',
    moods: ['Energized', 'Hopeful'],
  },
  {
    id: 'quran_50_16',
    type: 'Quran',
    primaryText: 'Wa nahnu aqrabu ilayhi min hablil-warīd',
    arabicText: 'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ ﴿١٦﴾',
    transliteration: 'Wa nahnu aqrabu ilayhi min hablil-warīd',
    englishTranslation: 'And We are closer to him than [his] jugular vein.',
    source: 'Surah Qaf 50:16',
    audioKey: '50:16',
    whyThis: 'Loneliness is impossible when the Creator is closer to you than your own lifeblood.',
    moods: ['Sad', 'Anxious'],
  },
  {
    id: 'quran_67_13',
    type: 'Quran',
    primaryText: "Innahū 'alīmum bidhāti-sudūr",
    arabicText: 'إِنَّهُ عَلِيمٌ بِذَاتِ الصُّدُورِ ﴿١٣﴾',
    transliteration: "Innahū 'alīmum bidhāti-sudūr",
    englishTranslation: 'Indeed, He is Knowing of that within the breasts.',
    source: 'Surah Al-Mulk 67:13',
    audioKey: '67:13',
    whyThis:
      'When you feel misunderstood or alone in your thoughts, remember that He knows your heart perfectly.',
    moods: ['Sad', 'Stressed'],
  },

  // === MULTI-VERSE PASSAGES ===
  {
    id: 'quran_93_1_5',
    type: 'Quran',
    primaryText:
      'Wad-duha. Wal-layli idha saja. Ma waddaaka rabbuka wa ma qala. Wa lal-akhiratu khayrul-laka minal-ula. Wa lasawfa yutika rabbuka fatarda.',
    arabicText:
      'وَالضُّحَىٰ ﴿١﴾ وَاللَّيْلِ إِذَا سَجَىٰ ﴿٢﴾ مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ ﴿٣﴾ وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ ﴿٤﴾ وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ ﴿٥﴾',
    transliteration:
      'Wad-duha. Wal-layli idha saja. Ma waddaaka rabbuka wa ma qala. Wa lal-akhiratu khayrul-laka minal-ula. Wa lasawfa yutika rabbuka fatarda.',
    englishTranslation:
      'By the morning brightness. And [by] the night when it covers with darkness. Your Lord has not taken leave of you, nor has He detested [you]. And the Hereafter is better for you than the first [life]. And your Lord is going to give you, and you will be satisfied.',
    source: 'Surah Ad-Duha 93:1-5',
    audioKey: '93:1',
    whyThis:
      'The opening of Surah Ad-Duha was revealed to comfort the Prophet (SAW) during a period of silence from revelation. It is a powerful reminder that Allah never abandons those He loves.',
    moods: ['Sad', 'Anxious'],
  },
  {
    id: 'quran_94_1_8',
    type: 'Quran',
    primaryText:
      'Alam nashrah laka sadrak. Wa wadana anka wizrak. Alladhi anqada zahrak. Wa rafana laka dhikrak. Fa inna maal-usri yusra. Inna maal-usri yusra. Fa idha faraghta fansab. Wa ila rabbika farghab.',
    arabicText:
      'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ ﴿١﴾ وَوَضَعْنَا عَنكَ وِزْرَكَ ﴿٢﴾ الَّذِي أَنقَضَ ظَهْرَكَ ﴿٣﴾ وَرَفَعْنَا لَكَ ذِكْرَكَ ﴿٤﴾ فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٥﴾ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾ فَإِذَا فَرَغْتَ فَانصَبْ ﴿٧﴾ وَإِلَىٰ رَبِّكَ فَارْغَب ﴿٨﴾',
    transliteration:
      'Alam nashrah laka sadrak. Wa wadana anka wizrak. Alladhi anqada zahrak. Wa rafana laka dhikrak. Fa inna maal-usri yusra. Inna maal-usri yusra. Fa idha faraghta fansab. Wa ila rabbika farghab.',
    englishTranslation:
      'Did We not expand for you your breast? And We removed from you your burden. Which had weighed upon your back. And raised high for you your repute. For indeed, with hardship [will be] ease. Indeed, with hardship [will be] ease. So when you have finished [your duties], then stand up [for worship]. And to your Lord direct [your] longing.',
    source: 'Surah Al-Inshirah 94:1-8 (Complete)',
    audioKey: '94:1',
    whyThis:
      'The complete Surah Al-Inshirah is a concise yet profound message: Allah has already lightened your load, ease is guaranteed, and the solution to fatigue is turning to Him.',
    moods: ['Stressed', 'Tired', 'Anxious'],
    moodScores: { Stressed: 25 },
  },
  {
    id: 'quran_20_25_28',
    type: 'Quran',
    primaryText:
      'Rabbish-rah li sadri. Wa yassir li amri. Wahlul uqdatam-mil-lisani. Yafqahu qawli.',
    arabicText:
      'رَبِّ اشْرَحْ لِي صَدْرِي ﴿٢٥﴾ وَيَسِّرْ لِي أَمْرِي ﴿٢٦﴾ وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي ﴿٢٧﴾ يَفْقَهُوا قَوْلِي ﴿٢٨﴾',
    transliteration:
      'Rabbish-rah li sadri. Wa yassir li amri. Wahlul uqdatam-mil-lisani. Yafqahu qawli.',
    englishTranslation:
      'My Lord, expand for me my breast [with assurance]. And ease for me my task. And untie the knot from my tongue. That they may understand my speech.',
    source: 'Surah Taha 20:25-28',
    audioKey: '20:25',
    whyThis:
      'The complete prayer of Prophet Musa (AS) before facing Pharaoh. Every element addresses a barrier: constriction of heart, difficulty of task, and clarity of expression.',
    moods: ['Anxious', 'Stressed'],
  },
  {
    id: 'quran_89_27_30',
    type: 'Quran',
    primaryText:
      'Ya ayyatuhan-nafsul-mutmainnah. Irjii ila rabbiki radiyatam-mardiyyah. Fadkhuli fi ibadi. Wadkhuli jannati.',
    arabicText:
      'يَا أَيَّتُهَا النَّفْسُ الْمُطْمَئِنَّةُ ﴿٢٧﴾ ارْجِعِي إِلَىٰ رَبِّكِ رَاضِيَةً مَّرْضِيَّةً ﴿٢٨﴾ فَادْخُلِي فِي عِبَادِي ﴿٢٩﴾ وَادْخُلِي جَنَّتِي ﴿٣٠﴾',
    transliteration:
      'Ya ayyatuhan-nafsul-mutmainnah. Irjii ila rabbiki radiyatam-mardiyyah. Fadkhuli fi ibadi. Wadkhuli jannati.',
    englishTranslation:
      'O reassured soul. Return to your Lord, well-pleased and pleasing [to Him]. And enter among My [righteous] servants. And enter My Paradise.',
    source: 'Surah Al-Fajr 89:27-30',
    audioKey: '89:27',
    whyThis:
      'The complete invitation to the "Reassured Soul" - a serene description of the ultimate homecoming for those who found peace in this life.',
    moods: ['Calm', 'Content', 'Grateful'],
  },
  {
    id: 'quran_23_1',
    type: 'Quran',
    primaryText: 'Qad aflahal-mu\'minun. Alladhina hum fi salatihim khashi\'un.',
    arabicText: 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ ﴿١﴾ الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ ﴿٢﴾',
    transliteration: 'Qad aflahal-mu\'minun. Alladhina hum fi salatihim khashi\'un.',
    englishTranslation: 'Successful indeed are the believers, those who humble themselves in their prayers.',
    source: 'Surah Al-Mu\'minun 23:1-2',
    audioKey: '23:1',
    whyThis: 'Identifies Khushu (humility) as the defining trait of successful believers.',
    moods: ['Calm', 'Hopeful'],
  },
  {
    id: 'quran_7_31',
    type: 'Quran',
    primaryText: 'Ya bani Adama khudhu zinatakum inda kulli masjidin.',
    arabicText: 'يَا بَنِي آدَمَ خُذُوا زِينَتَكُمْ عِنْدَ كُلِّ مَسْجِدٍ ﴿٣١﴾',
    transliteration: 'Ya bani Adama khudhu zinatakum inda kulli masjidin.',
    englishTranslation: 'O children of Adam, take your adornment at every masjid.',
    source: 'Surah Al-A\'raf 7:31',
    audioKey: '7:31',
    whyThis: 'The divine command to prepare yourself physically and spiritually before prayer.',
    moods: ['Calm'],
  },
  {
    id: 'quran_29_45',
    type: 'Quran',
    primaryText: 'Utlu ma uhiya ilayka minal-kitabi wa aqimis-salah. Innas-salata tanha anil-fahsha-i wal-munkar.',
    arabicText: 'اتْلُ مَا أُوحِيَ إِلَيْكَ مِنَ الْكِتَابِ وَأَقِمِ الصَّلَاةَ ۖ إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنْكَرِ ۗ وَلَذِكْرُ اللَّهِ أَكْبَرُ ۗ ﴿٤٥﴾',
    transliteration: 'Utlu ma uhiya ilayka minal-kitabi wa aqimis-salah. Innas-salata tanha anil-fahsha-i wal-munkar.',
    englishTranslation: 'Recite what has been revealed to you of the Book and establish prayer. Indeed, prayer prevents immorality and wrongdoing, and the remembrance of Allah is greater.',
    source: 'Surah Al-Ankabut 29:45',
    audioKey: '29:45',
    whyThis: 'A reminder that true prayer is a shield against immorality and is the greatest form of remembrance.',
    moods: ['Calm', 'Hopeful'],
  },
  {
    id: 'quran_2_45_salah_dup',
    type: 'Quran',
    primaryText: 'Wasta\'inu bis-sabri was-salah. Wa innaha lakabiratun illa alal-khashi\'in.',
    arabicText: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ ﴿٤٥﴾',
    transliteration: 'Wasta\'inu bis-sabri was-salah. Wa innaha lakabiratun illa alal-khashi\'in.',
    englishTranslation: 'And seek help through patience and prayer, and indeed, it is difficult except for the humbly submissive.',
    source: 'Surah Al-Baqarah 2:45',
    audioKey: '2:45',
    whyThis: 'Prayer is a source of help and strength, though its ease is found in humility.',
    moods: ['Stressed', 'Calm'],
  },
  {
    id: 'quran_22_77_salah_dup',
    type: 'Quran',
    primaryText: 'Ya ayyuhalladhina amanu-rka\'u was-judu wa-budu rabbakum.',
    arabicText: 'يَا أَيُّهَا الَّذِينَ آمَنُوا ارْكَعُوا وَاسْجُدُوا وَاعْبُدُوا رَبَّكُمْ ﴿٧٧﴾',
    transliteration: 'Ya ayyuhalladhina amanu-rka\'u was-judu wa-budu rabbakum.',
    englishTranslation: 'O you who believe, bow and prostrate and worship your Lord.',
    source: 'Surah Al-Hajj 22:77',
    audioKey: '22:77',
    whyThis: 'A direct command to engage the body in the physical acts of worship.',
    moods: ['Grateful', 'Calm'],
  },
  {
    id: 'quran_14_40',
    type: 'Quran',
    primaryText: 'Rabbi-j\'alni muqimas-salati wa min dhurriyyati. Rabbana wa taqabbal du\'a.',
    arabicText: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ ﴿٤٠﴾',
    transliteration: 'Rabbi-j\'alni muqimas-salati wa min dhurriyyati. Rabbana wa taqabbal du\'a.',
    englishTranslation: 'My Lord, make me an establisher of prayer, and [many] from my descendants. Our Lord, and accept my supplication.',
    source: 'Surah Ibrahim 14:40',
    audioKey: '14:40',
    whyThis: 'The powerful dua of Ibrahim (AS) for steadfastness in prayer for himself and his family.',
    moods: ['Hopeful', 'Calm'],
  },
];

const quranContent: Content[] = quranContentData;
const quranContentAnglesData: ContentAngle[] = [
  // === ANXIOUS ANGLES ===
  {
    id: 'q_angle_93_4_anxious',
    contentId: 'quran_93_4',
    mood: 'Anxious',
    angle: 'The scholars note that this verse was revealed to the Prophet ﷺ during a period of silence from revelation, reassuring him that his Lord had not forsaken him—symbolizing hope for every believer in times of spiritual dry spells.',
    action: 'Pray two rak\'ahs of prayer and ask Allah for ease in your situation.',
    actionHowTo: 'Perform a sincere voluntary prayer (Salat al-Hajah) and speak to Allah about your worries.',
    actionReward: 'The companion reported: "Whenever a matter distressed the Prophet (pbuh), he would rush to prayer." [Sunan Abi Dawud 1319]',
    reflection: 'What "first life" struggle are you holding onto that the Hereafter makes small?',
  },
  {
    id: 'q_angle_2_286_anxious',
    contentId: 'quran_2_286',
    mood: 'Anxious',
    angle: 'The Prophet ﷺ said: "Allah does not burden a soul beyond its capacity" is among the most beloved verses to the believers. This verse ends with a powerful dua the Prophet ﷺ taught us to make. [Source: Sahih Muslim 126]',
    action: 'Recite the last two verses of Al-Baqarah before sleep as protection.',
    actionHowTo: 'Recite from "Aamanar-rasulu..." to the end.',
    actionReward: 'The Prophet ﷺ said: "Whoever recites the last two verses of Surah al-Baqarah at night, they will be sufficient for him." [Bukhari 5009]',
    reflection: 'When you feel overwhelmed today, what burden can you release to Allah\'s care?',
  },
  {
    id: 'q_angle_65_3_anxious',
    contentId: 'quran_65_3',
    mood: 'Anxious',
    angle: 'The Prophet ﷺ said: "If you were to rely upon Allah with the reliance He is due, He would provide for you just as He provides for the birds; they go out hungry in the morning and return full in the evening." [At-Tirmidhi 2344]',
    action: 'When anxious about provision or outcomes, recite this verse and practice "Tafwid" (handing over the matter to Allah).',
    actionHowTo: 'Identify the specific worry and say: "I entrust my affairs to Allah" (Wa ufwidu amri ilallāh).',
    actionReward: 'Allah says: "And whoever relies upon Allah - then He is sufficient (Hasbuhu) for him." [Quran 65:3]',
    reflection: 'What would change in your heart if you truly believed Allah is sufficient for your specific worry?',
  },
  {
    id: 'q_angle_53_39_anxious',
    contentId: 'quran_53_39',
    mood: 'Anxious',
    angle: 'Scholars of Tafsir explain that this verse focuses the believer on their sincere effort, which is within their control, rather than the results, which are with Allah. He sees every small step you take. [Tafsir al-Qurtubi]',
    action: 'Renew your intention (Niyyah) for your current task to be purely for Allah.',
    actionHowTo: 'Identify one duty you have today and mentally dedicate its performance to Allah to transform it into worship.',
    actionReward: 'The Prophet ﷺ said: "Actions are but by intentions, and every person will have only what they intended." [Sahih Bukhari 1]',
    reflection: 'How does focusing on your sincere effort rather than the end result ease your anxiety?',
  },
  {
    id: 'q_angle_26_80_anxious',
    contentId: 'quran_26_80',
    mood: 'Anxious',
    angle: 'Prophet Ibrahim (as) stated this with absolute certainty. The Prophet ﷺ used to make dua: "Remove the harm, O Lord of mankind, and heal, for You are the Healer (Ash-Shafi). There is no healing but Yours." [Sahih Bukhari 5743]',
    action: 'Focus on your well-being by reciting this prophetic dua for yourself.',
    actionHowTo: 'Place your hand where you feel discomfort and say "Allahumma Adhhibil-bas, Rabban-nas, washfi Antash-Shafi".',
    actionReward: 'The Prophet ﷺ said: "No fatigue, nor disease... nor even the prick of a thorn, befals a Muslim but that Allah expiates some of his sins for it." [Bukhari 5641]',
    reflection: 'What does it mean to trust "Ash-Shafi" (The Healer) with your ultimate well-being and heart?',
  },

  {
    id: 'q_angle_3_173_anxious',
    contentId: 'quran_3_173',
    mood: 'Anxious',
    angle: 'Ibn Abbas said this phrase was used by Ibrahim (as) when thrown into the fire, and by the Prophet ﷺ during hardship. It is the ultimate statement of reliance in times of peak pressure. [Sahih Bukhari 4563]',
    action: 'Recite "Hasbunallahu wa ni\'mal-wakil" whenever you feel overwhelmed.',
    actionHowTo: 'Repeat the phrase slowly 7 times, mentally handing over your worry to the "Best Disposer" with each breath.',
    actionReward: 'The phrase translates to: "Sufficient for us is Allah, and He is the best Disposer of affairs." It is the key to divine protection.',
    reflection: 'What changes when you truly believe Allah is the "Best Disposer" of your specific situation?',
  },
  {
    id: 'q_angle_2_257_anxious',
    contentId: 'quran_2_257',
    mood: 'Anxious',
    angle: 'Scholars explain that Allah as the "Wali" (Protector) actively guides the believer out of the darkness of confusion and worry into the light of certainty and peace. [Tafsir al-Qurtubi]',
    action: 'Identify a "darkness" of worry and ask Allah to lead you to the light of clarity.',
    actionHowTo: 'Make a short, sincere Dua: "O Allah, lead me from the darkness of my worry to the light of Your guidance."',
    actionReward: 'The Prophet ﷺ said: "Allah says: \'I am as My servant thinks of Me.\'" Expecting good from your Protector brings His light. [Sahih Bukhari 7405]',
    reflection: 'How can trusting your Wali (Protector) help clear the path forward through this anxiety?',
  },
  {
    id: 'q_angle_8_40_anxious',
    contentId: 'quran_8_40',
    mood: 'Anxious',
    angle: 'The Best Protector and the Best Helper is on your side',
    action: 'Recite: "Allāhumma mā asbaha bee min ni\'matin... fa minka wahdak" (O Allah, whatever blessing I have... is from You alone).',
    actionHowTo: 'Recite this morning and evening to recognize Allah as the source of all your safety and provision.',
    actionReward: 'The Prophet ﷺ said: "Whoever recites this... has fulfilled the gratitude of his day/night." [Sunan Abi Dawud 5073]',
    reflection: 'If the Creator is your Helper, how big is your obstacle really?',
  },
  {
    id: 'q_angle_5_23_anxious',
    contentId: 'quran_5_23',
    mood: 'Anxious',
    angle: 'Active reliance is a sign of faith',
    action: 'Take one action towards your goal, then leave the rest to Allah',
    reflection: 'How does letting go of the outcome affect your current anxiety levels?',
  },
  {
    id: 'q_angle_14_12_anxious',
    contentId: 'quran_14_12',
    mood: 'Anxious',
    angle: 'He who guided you before will guide you now',
    action: 'Reflect on a time you were lost and how Allah directed you',
    reflection: 'Why would the One who showed you the way now leave you alone?',
  },
  {
    id: 'q_angle_8_2_anxious',
    contentId: 'quran_8_2',
    mood: 'Anxious',
    angle: 'Increasing faith through the mention of Allah',
    action: 'Listen to a recitation of your favorite surah for 5 minutes',
    reflection: 'How does the Word of Allah bring stability to your trembling heart?',
  },
  {
    id: 'q_angle_67_29_anxious',
    contentId: 'quran_67_29',
    mood: 'Anxious',
    angle: 'The Most Merciful is the object of our trust',
    action: 'Breathe in "Ar-Rahman" (The Merciful) and breathe out your worry',
    reflection: "How does focusing on Allah's mercy soften the edge of your anxiety?",
  },
  {
    id: 'q_angle_25_58_anxious',
    contentId: 'quran_25_58',
    mood: 'Anxious',
    angle: 'Relying on the Ever-Living who never fails',
    action: 'Acknowledge the temporary nature of people and trust in the Eternal',
    reflection: 'What safety do you find in knowing your Support never dies?',
  },
  {
    id: 'q_angle_12_90_anxious',
    contentId: 'quran_12_90',
    mood: 'Anxious',
    angle: 'Patience and mindfulness lead to a reward that is never lost',
    action: 'Choose patience in this moment as a deliberate act of worship',
    reflection: 'How can you trust that your current struggle is being recorded for good?',
  },
  {
    id: 'q_angle_8_46_anxious',
    contentId: 'quran_8_46',
    mood: 'Anxious',
    angle: "Allah's special presence is with those who wait",
    action: 'Wait for 30 seconds in silence, acknowledging Allah is with you right now',
    reflection: 'How does knowing "Allah is with the patient" strengthen your Sabr in this moment?',
  },
  {
    id: 'q_angle_10_62_anxious',
    contentId: 'quran_10_62',
    mood: 'Anxious',
    angle: 'The allies of Allah are safe from fear',
    action: "Make a small intention to do one thing today purely for Allah's sake",
    reflection: 'What fear can remain when you are striving to be a friend of the Creator?',
  },

  // === SAD ANGLES ===
  {
    id: 'q_angle_93_3_sad',
    contentId: 'quran_93_3',
    mood: 'Sad',
    angle: 'Allah has NOT abandoned you',
    action: 'Recite the Duha prayer (mid-morning) as a gratitude session for your soul.',
    actionHowTo: 'Pray 2 to 4 Rak\'ahs between sunrise and Dhuhr, focusing on the light of Allah returning to your day.',
    actionReward: 'The Prophet ﷺ said: "In the morning, charity is due for every joint of your body... and two rak\'ahs of Duha suffice for all that." [Sahih Muslim 720]',
    reflection: "When have you felt Allah's presence during difficult times?",
  },
  {
    id: 'q_angle_39_53_sad',
    contentId: 'quran_39_53',
    mood: 'Sad',
    angle: "Allah's mercy encompasses all - never despair",
    action: 'Ask Allah for His mercy with full conviction He will respond',
    reflection: 'How does knowing Allah forgives ALL sins affect your sadness?',
  },
  {
    id: 'q_angle_57_4_sad',
    contentId: 'quran_57_4',
    mood: 'Sad',
    angle: 'In your darkest moments, Allah is with you',
    action: "Sit quietly and acknowledge Allah's presence with you right now",
    reflection: "How does Allah's constant presence comfort you in sadness?",
  },

  {
    id: 'q_angle_2_155_sad',
    contentId: 'quran_2_155',
    mood: 'Sad',
    angle: 'Glad tidings await those who return to Allah in grief',
    action: 'Say "Inna lillahi wa inna ilayhi raji\'un" and feel its weight',
    reflection: 'How does returning everything to Allah lighten the load of your loss?',
  },
  {
    id: 'q_angle_3_139_sad',
    contentId: 'quran_3_139',
    mood: 'Sad',
    angle: 'Do not weaken, for your faith elevates you',
    action: 'Straighten your posture and remind yourself of your dignity as a believer',
    reflection: 'How can your status with Allah give you strength when you feel low?',
  },
  {
    id: 'q_angle_65_7_sad',
    contentId: 'quran_65_7',
    mood: 'Sad',
    angle: 'Hardship is a season, but ease is a promise',
    action: 'Recite "Lā hawla wa lā quwwata illā billāh" (There is no power or might except with Allah).',
    actionHowTo: 'Repeat this phrase while acknowledging that the transition from hardship to ease is entirely in Allah\'s hands.',
    actionReward: 'The Prophet ﷺ said: "It is a treasure from the treasures of Paradise." [Sahih Bukhari 6384]',
    reflection: 'How has your life proven that no difficulty lasts forever?',
  },
  {
    id: 'q_angle_21_87_sad',
    contentId: 'quran_21_87',
    mood: 'Sad',
    angle: 'The prayer that breaks through darkness',
    action: 'Recite "La ilaha illa anta subhanaka..." with deep humility',
    reflection: 'How does admitting your need for Allah bring comfort in your distress?',
  },
  {
    id: 'q_angle_3_8_sad',
    contentId: 'quran_3_8',
    mood: 'Sad',
    angle: 'Asking for the mercy that mends the heart',
    action: 'Make the dua: "Rabbana la tuzigh qulubana..." slowly',
    reflection: 'What would it feel like for Allah to pour His special mercy into your heart?',
  },
  {
    id: 'q_angle_40_60_sad',
    contentId: 'quran_40_60',
    mood: 'Sad',
    angle: 'Your Lord invites you to share your grief',
    action: 'Talk to Allah in your own language about what hurts',
    reflection: 'How does knowing Allah guarantees a response change your silence?',
  },
  {
    id: 'q_angle_39_10_sad',
    contentId: 'quran_39_10',
    mood: 'Sad',
    angle: 'The limitless reward for the endurance of the heart',
    action: 'Acknowledge your current patience as an investment for the Hereafter',
    reflection: 'What value does your silent endurance hold in the eyes of the Merciful?',
  },
  {
    id: 'q_angle_11_115_sad',
    contentId: 'quran_11_115',
    mood: 'Sad',
    angle: 'Your struggle is witnessed and preserved',
    action: 'Do one small good deed today, however simple, in spite of your sadness',
    reflection: 'How does it feel to know that Allah never loses sight of your effort?',
  },
  {
    id: 'q_angle_39_53_sad_angle',
    contentId: 'quran_39_53',
    mood: 'Sad',
    angle: 'Never despair of the mercy that heals all',
    action: "Let go of one regret as a gift to yourself and trust in Allah's mercy",
    reflection: 'If Allah can forgive ALL sins, can He not also heal ALL sorrows?',
  },
  {
    id: 'q_angle_2_186_sad',
    contentId: 'quran_2_186',
    mood: 'Sad',
    angle: 'He is near when everyone else feels far',
    action: 'Place your hand on your heart and whisper "Ya Qareeb" (O Near One)',
    reflection: 'What does the nearness of Allah mean for your current feeling of isolation?',
  },
  {
    id: 'q_angle_41_30_sad',
    contentId: 'quran_41_30',
    mood: 'Sad',
    angle: 'Angels of reassurance for the steadfast heart',
    action: 'Affirm your faith by saying "Rabbunallāh" (Our Lord is Allah) and remain steadfast.',
    actionHowTo: 'Focus on the absolute sovereignty of your Lord and let it ground your current sadness in certainty.',
    actionReward: 'Allah says the angels descend upon such people saying: "Do not fear and do not grieve." [Quran 41:30]',
    reflection: 'How does the promise of "no fear and no grief" comfort you today?',
  },
  {
    id: 'q_angle_20_46_sad',
    contentId: 'quran_20_46',
    mood: 'Sad',
    angle: 'He hears your unspoken pain and sees your silent tears',
    action: 'Rest in the knowledge that you are fully seen and understood by Allah',
    reflection: 'How does being "seen and heard" by the Creator change your sadness?',
  },
  {
    id: 'q_angle_24_22_sad',
    contentId: 'quran_24_22',
    mood: 'Sad',
    angle: 'Finding peace through the mercy of pardoning',
    action: 'Think of one person to forgive, purely for the sake of your own inner peace',
    reflection: "How can being merciful to others draw Allah's mercy to your own heart?",
  },
  {
    id: 'q_angle_8_33_sad',
    contentId: 'quran_8_33',
    mood: 'Sad',
    angle: 'Forgiveness is a shield from the storms of life',
    action: 'Repeat "Astaghfirullah" 11 times, focusing on its protective power',
    reflection: 'How does seeking forgiveness help settle the turbulence of your mind?',
  },
  {
    id: 'q_angle_50_16_sad',
    contentId: 'quran_50_16',
    mood: 'Sad',
    angle: 'Closer than your very self',
    action: 'Breathe deeply and acknowledge that Allah is with you in every breath',
    reflection: 'If Allah is closer than your jugular vein, where can sadness hide?',
  },
  {
    id: 'q_angle_67_13_sad',
    contentId: 'quran_67_13',
    mood: 'Sad',
    angle: 'He knows the secrets you cannot put into words',
    action: 'Acknowledge that your heart is fully known and accepted by Allah',
    reflection: 'What relief do you find in being known perfectly without explanation?',
  },
  {
    id: 'q_angle_93_1_5_sad',
    contentId: 'quran_93_1_5',
    mood: 'Sad',
    angle: 'The morning brightness always follows the darkest night',
    action: 'Reflect on the transition from night to day as a sign of Allah\'s mercy.',
    actionHowTo: 'Observe the world around you and recognize that just as Allah brings the sun after the night, He brings ease after hardship.',
    actionReward: 'Allah swears by the morning brightness and the night when it covers—reminding us that He has not forsaken us. [Surah Ad-Duha]',
    reflection: 'How does the rhythm of nature prove that Allah never abandons you?',
  },

  // === ANGRY ANGLES ===
  {
    id: 'q_angle_3_134_angry',
    contentId: 'quran_3_134',
    mood: 'Angry',
    angle: 'Restraining anger is a quality of those Allah loves',
    action: 'Before responding, count to 10 and make wudu if possible',
    reflection: 'How does it feel to "restrain" anger rather than just letting it out?',
  },
  {
    id: 'q_angle_41_34_angry',
    contentId: 'quran_41_34',
    mood: 'Angry',
    angle: 'Transforming enmity into friendship through goodness',
    action: 'Perform a small act of kindness for someone you are frustrated with',
    reflection: 'What would change if you saw your "enemy" as a potential friend?',
  },

  // === GUILTY ANGLES ===
  {
    id: 'q_angle_4_110_guilty',
    contentId: 'quran_4_110',
    mood: 'Sad',
    angle: 'The door to forgiveness is always open',
    action: 'Make a sincere intention to leave the sin and ask Allah for help',
    reflection: "When have you experienced Allah's forgiveness after a mistake?",
  },
  {
    id: 'q_angle_25_70_guilty',
    contentId: 'quran_25_70',
    mood: 'Sad',
    angle: 'Turning past mistakes into future strengths',
    action: 'Do a good deed specifically to "replace" a recent mistake',
    reflection: "How does Allah's ability to change bad to good give you hope?",
  },

  {
    id: 'q_angle_42_43_angry',
    contentId: 'quran_42_43',
    mood: 'Angry',
    angle: 'Patience and forgiveness are signs of high determination',
    action: 'Choose to be the bigger person in your current conflict',
    reflection: 'How does letting go of the need for "getting even" feel in your heart?',
  },
  {
    id: 'q_angle_3_159_angry',
    contentId: 'quran_3_159',
    mood: 'Angry',
    angle: 'The Prophetic model: Pardon and consult',
    action: 'Perform a silent prayer for the person you are angry with',
    reflection: 'How can you move from confrontation to a state of mercy and consultation?',
  },
  {
    id: 'q_angle_24_22_angry',
    contentId: 'quran_24_22',
    mood: 'Angry',
    angle: 'Forgive others as you wish to be forgiven',
    action: 'Recall a time you needed forgiveness and apply that feeling now',
    reflection: 'If Allah forgives us despite our flaws, who are we to hold onto grudges?',
  },
  {
    id: 'q_angle_16_126_angry',
    contentId: 'quran_16_126',
    mood: 'Angry',
    angle: 'Patience is always the better choice',
    action: 'Perform Wudu (ablution) with cool water to extinguish the heat of your anger.',
    actionHowTo: 'Follow the Prophetic advice to use water when agitated, as anger is from fire.',
    actionReward: 'The Prophet ﷺ said: "Anger is from Shaytan... so if one of you becomes angry, let him perform wudu." [Sunan Abi Dawud 4784]',
    reflection: 'What would your future self think of your current reaction?',
  },
  {
    id: 'q_angle_5_13_angry',
    contentId: 'quran_5_13',
    mood: 'Angry',
    angle: 'Pardon as an act of excellence (Ihsan)',
    action: 'Deliberately overlook a minor annoyance today',
    reflection: 'How does "pardoning and overlooking" bring you closer to Allah\'s love?',
  },
  {
    id: 'q_angle_64_14_angry',
    contentId: 'quran_64_14',
    mood: 'Angry',
    angle: 'The healing power of the triple response: Pardon, Overlook, Forgive',
    action: 'Mentally release the person who wronged you from your debt',
    reflection: "How does matching Allah's qualities bring peace to your own life?",
  },
  {
    id: 'q_angle_4_149_angry',
    contentId: 'quran_4_149',
    mood: 'Angry',
    angle: 'Showing good even when you have been wronged',
    action: 'Conceal the mistake of another rather than exposing it',
    reflection:
      'What does it say about your strength when you choose to forgive despite having power?',
  },
  {
    id: 'q_angle_45_14_angry',
    contentId: 'quran_45_14',
    mood: 'Angry',
    angle: 'Rising above provocation for the sake of Allah',
    action: 'Remind yourself that your account is with Allah, not with the people',
    reflection: 'How does focusing on the Hereafter diminish the heat of temporary anger?',
  },

  // === GRATEFUL ANGLES ===
  {
    id: 'q_angle_14_7_grateful',
    contentId: 'quran_14_7',
    mood: 'Grateful',
    angle: 'Gratitude as the engine of growth',
    action: 'Say "Alhamdulillah" for a blessing you often take for granted',
    reflection: 'How have you seen Allah increase His favors when you are grateful?',
  },

  {
    id: 'q_angle_16_18_grateful',
    contentId: 'quran_16_18',
    mood: 'Grateful',
    angle: 'Counting the uncountable favors',
    action: 'Spend 2 minutes listing specific small favors you usually miss',
    reflection: 'If you cannot count them all, how vast must His care for you be?',
  },
  {
    id: 'q_angle_31_12_grateful',
    contentId: 'quran_31_12',
    mood: 'Grateful',
    angle: 'Gratitude is the highest form of wisdom',
    action: 'Thank someone for a small thing they did for you today',
    reflection: 'How does expressing gratitude transform your own heart from within?',
  },
  {
    id: 'q_angle_27_40_grateful',
    contentId: 'quran_27_40',
    mood: 'Grateful',
    angle: 'Seeing blessings as a test of the heart',
    action: 'Identify a gift in your life and commit to using it for good',
    reflection: 'Am I showing gratitude through the way I use what I have been given?',
  },
  {
    id: 'q_angle_34_13_grateful',
    contentId: 'quran_34_13',
    mood: 'Grateful',
    angle: 'Gratitude expressed through action',
    action: 'Turn your feeling of thanks into a physical act of service',
    reflection: 'What "work" can I do today that proves my heart is truly grateful?',
  },
  {
    id: 'q_angle_76_3_grateful',
    contentId: 'quran_76_3',
    mood: 'Grateful',
    angle: 'The choice to be among the grateful',
    action: 'Consciously choose to acknowledge a specific favor from Allah in a neutral situation',
    reflection: 'How does my life change when I commit to being "one of the grateful"?',
  },
  {
    id: 'q_angle_54_35_grateful',
    contentId: 'quran_54_35',
    mood: 'Grateful',
    angle: 'Gratitude as a magnet for more favor',
    action: 'Recognize a recent positive outcome as a direct favor from Allah',
    reflection: 'How can I maintain a heart that constantly attracts divine reward?',
  },
  {
    id: 'q_angle_7_58_grateful',
    contentId: 'quran_7_58',
    mood: 'Grateful',
    angle: 'The heart of gratitude understands the signs',
    action: 'Look at nature and see it as a message of love from your Creator',
    reflection: 'How does being grateful change the way I interpret the world around me?',
  },
  {
    id: 'q_angle_4_147_grateful',
    contentId: 'quran_4_147',
    mood: 'Grateful',
    angle: 'Gratitude as the ultimate protection',
    action: 'Say "Alhamdulillah" for your faith and your safety',
    reflection: 'If gratitude and belief are enough, why would I ever focus on anything else?',
  },
  {
    id: 'q_angle_2_172_grateful',
    contentId: 'quran_2_172',
    mood: 'Grateful',
    angle: 'Enjoying the good things with a thankful heart',
    action: 'Savor your next meal and focus on the One who provided it',
    reflection: 'How can I turn every basic necessity into a moment of worship?',
  },
  {
    id: 'q_angle_35_12_grateful',
    contentId: 'quran_35_12',
    mood: 'Grateful',
    angle: 'Seeking bounty with the intention to be thankful',
    action: 'Set a goal for your work that includes sharing the benefits with others',
    reflection: 'How does my ambition change when its goal is to produce more gratitude?',
  },
  {
    id: 'q_angle_39_7_grateful',
    contentId: 'quran_39_7',
    mood: 'Grateful',
    angle: 'The approval of the Most High',
    action: 'Do one small thing today that you know pleases your Lord',
    reflection: 'What greater reward is there than the approval of the Most Merciful?',
  },
  {
    id: 'q_angle_15_53_grateful',
    contentId: 'quran_16_53',
    mood: 'Grateful',
    angle: 'Trace every favor back to its Source',
    action: 'Pick one thing you love and say "This is a gift from Allah"',
    reflection: 'How does tracing blessings back to Allah change your relationship with them?',
  },

  {
    id: 'q_angle_20_25_stressed_angle',
    contentId: 'quran_20_25',
    mood: 'Stressed',
    angle: 'Expanding the heart to breathe through the pressure',
    action: 'Ask Allah for "Inshirah" (expansion) of your chest right now',
    reflection: 'What would happen if your internal capacity was larger than your external stress?',
  },
  {
    id: 'q_angle_40_44_stressed_angle',
    contentId: 'quran_40_44',
    mood: 'Stressed',
    angle: 'Releasing the weight of "How" by trusting "Who"',
    action: 'Explicitly tell Allah: "I leave the results of this work to You"',
    reflection:
      "How much of my stress comes from trying to do Allah's job (controlling the outcome)?",
  },
  {
    id: 'q_angle_2_153_stressed',
    contentId: 'quran_2_153',
    mood: 'Stressed',
    angle: 'Patience and Prayer as active stabilizers',
    action: 'Slow down your next prayer by 2 minutes to anchor your mind',
    reflection:
      'How does seeking help through prayer specifically counteract the feeling of being rushed?',
  },
  {
    id: 'q_angle_67_13_stressed',
    contentId: 'quran_67_13',
    mood: 'Stressed',
    angle: 'Being known perfectly removes the need for explanation',
    action: "Stop trying to explain yourself to others and find peace in Allah's knowledge",
    reflection:
      'How does knowing Allah knows what is "within the breasts" ease your social stress?',
  },
  {
    id: 'q_angle_94_1_8_stressed',
    contentId: 'quran_94_1_8',
    mood: 'Stressed',
    angle: 'The divine cycle of ease and focused devotion',
    action: 'Break your stress by standing up for a moment of quiet devotion',
    reflection: 'How does "directing your longing to your Lord" provide an exit from stress?',
  },
  {
    id: 'q_angle_20_25_28_stressed',
    contentId: 'quran_20_25_28',
    mood: 'Stressed',
    angle: 'The complete prayer for clarity and ease',
    action: 'Recite the full prayer of Musa (AS) including the request for clarity',
    reflection: 'What specifically am I asking Allah to "ease" or "untie" for me today?',
  },

  // === CONTENT ANGLES ===
  {
    id: 'q_angle_10_58_content',
    contentId: 'quran_10_58',
    mood: 'Content',
    angle: 'Rejoicing in the primary blessings of faith',
    action: 'List one thing you love about being a believer',
    reflection: "If I had nothing but Allah's mercy, would I still have enough to rejoice?",
  },
  {
    id: 'q_angle_14_7_content',
    contentId: 'quran_14_7',
    mood: 'Content',
    angle: 'Gratitude as the foundation of lasting contentment',
    action: 'Look around and say "Alhamdulillah" for the roof over your head',
    reflection: "How is my current contentment tied to my awareness of Allah's increase?",
  },
  {
    id: 'q_angle_16_18_content',
    contentId: 'quran_16_18',
    mood: 'Content',
    angle: 'Enumerating the enumerable as a path to satisfaction',
    action: 'Try to count the favors of Allah in just the last hour',
    reflection: 'If I cannot count them, how can I ever feel like I have "not enough"?',
  },
  {
    id: 'q_angle_93_11_content',
    contentId: 'quran_93_11',
    mood: 'Content',
    angle: 'Reporting the favors to amplify the joy',
    action: 'Share one good thing that happened to you with a friend or family member',
    reflection: "How does speaking about Allah's favors increase the feeling of contentment?",
  },
  {
    id: 'q_angle_55_13_content',
    contentId: 'quran_55_13',
    mood: 'Content',
    angle: 'The rhythmic reminder of countless favors',
    action: 'Slowly recite "Fabi-ayyi ala-i Rabbikuma tukadhdhiban" three times',
    reflection: 'Which favor of my Lord am I particularly aware of in this moment?',
  },
  {
    id: 'q_angle_31_12_content',
    contentId: 'quran_31_12',
    mood: 'Content',
    angle: 'Contentment as a benefit to your own soul',
    action: 'Recognize that your current feeling of peace is a gift you are giving yourself',
    reflection: "How does being content with Allah's decree bring peace to my heart (Qalb)?",
  },
  {
    id: 'q_angle_5_3_content',
    contentId: 'quran_5_3',
    mood: 'Content',
    angle: 'The perfection of Islam as the ultimate satisfaction',
    action: 'Reflect on the completeness of your faith as a guide for life',
    reflection: 'What does it mean to have a "perfected" favor from the Creator?',
  },
  {
    id: 'q_angle_28_73_content',
    contentId: 'quran_28_73',
    mood: 'Content',
    angle: 'The mercy of the celestial rhythm',
    action: 'Observe the light (or dark) outside and see it as a deliberate mercy',
    reflection: "How does the world's natural order provide a container for my peace?",
  },
  {
    id: 'q_angle_2_152_content',
    contentId: 'quran_2_152',
    mood: 'Content',
    angle: 'The ultimate reciprocal relationship of remembrance',
    action: 'Remember Allah now so that He remembers you in this very moment',
    reflection: 'What could be more fulfilling than being remembered by the King of Kings?',
  },
  {
    id: 'q_angle_16_53_content',
    contentId: 'quran_16_53',
    mood: 'Content',
    angle: 'The peace of knowing the Source of every favor',
    action: "Acknowledge that every small win today started with Allah's grace",
    reflection: 'How does attributing success to Allah remove the pressure for me to be perfect?',
  },
  {
    id: 'q_angle_89_27_30_content',
    contentId: 'quran_89_27_30',
    mood: 'Content',
    angle: 'The homecoming of the Reassured Soul',
    action: 'Visualize the peace of a soul that has found its home in Allah',
    reflection: 'What can I do today to cultivate a "reassured soul" (Nafs al-Mutma\'innah)?',
  },

  // === CALM ANGLES ===
  {
    id: 'q_angle_13_28_calm',
    contentId: 'quran_13_28',
    mood: 'Calm',
    angle: 'Anchoring the heart in Dhikr',
    action: 'Close your eyes and recite "SubhanAllah" with awareness of its meaning',
    reflection: 'What specific type of remembrance brings your heart the most peace?',
  },
  {
    id: 'q_angle_30_21_calm',
    contentId: 'quran_30_21',
    mood: 'Calm',
    angle: "Tranquility as a sign of Allah's mercy in relationships",
    action: 'Express appreciation to a loved one who brings you peace',
    reflection: 'How can you better cultivate a "home of tranquility" in your heart?',
  },

  {
    id: 'q_angle_6_54_calm',
    contentId: 'quran_6_54',
    mood: 'Calm',
    angle: 'Mercy as a divine decree of peace',
    action: 'Close your eyes and accept that Allah has obligated mercy upon Himself for you',
    reflection: 'How does it feel to be greeted with "Salam" by your Lord?',
  },
  {
    id: 'q_angle_16_32_calm',
    contentId: 'quran_16_32',
    mood: 'Calm',
    angle: 'The purity of a heart greeted by angels',
    action: 'Focus on purifying your intention for your next task',
    reflection: 'What does a state of "goodness and purity" feel like in this moment?',
  },
  {
    id: 'q_angle_36_58_calm',
    contentId: 'quran_36_58',
    mood: 'Calm',
    angle: 'A direct word of peace from the Merciful',
    action: 'Slowly repeat the word "Salam" and let it anchor your soul',
    reflection: 'How does a greeting of peace from the Creator silence the noise of the world?',
  },
  {
    id: 'q_angle_97_5_calm',
    contentId: 'quran_97_5',
    mood: 'Calm',
    angle: 'Transcendental peace that lasts until dawn',
    action: 'Set an intention to find stillness in the early hours of tomorrow',
    reflection: 'How can I carry the "salam" of Laylatul Qadr into my daily life?',
  },
  {
    id: 'q_angle_56_91_calm',
    contentId: 'quran_56_91',
    mood: 'Calm',
    angle: 'Scholars like Ibn Kathir explain that the "Companions of the Right" are granted an eternal state of peace (Salam) and safety, free from all worry and harm, as a reward for their enduring faith. [Tafsir Ibn Kathir]',
    action: 'Reach out to a righteous companion and share a word of peace.',
    actionHowTo: 'Send a message or visit someone whose presence reminds you of Allah.',
    actionReward: 'The Prophet ﷺ said: "The best of companions in the sight of Allah is the one who is best to his companion." [At-Tirmidhi]',
    reflection: 'How does a community of tranquility support my individual peace?',
  },
  {
    id: 'q_angle_89_27_30_calm',
    contentId: 'quran_89_27_30',
    mood: 'Calm',
    angle: 'Ibn Abbas explained that the "reassured soul" (Al-Nafs al-Mutma’innah) is the one that is tranquil and certain in its belief and its Lord, responding to every decree with pleasure. [Tafsir al-Baghawi]',
    action: 'Return to your Lord in this moment by acknowledging His perfect care over you.',
    actionHowTo: 'Repeat "Raditu billahi Rabba" (I am pleased with Allah as my Lord) until you feel stillness.',
    actionReward: 'Allah says: "Enter among My [righteous] servants, And enter My Paradise." [Quran 89:29-30]',
    reflection: 'What changes in your calm state when you truly feel "at home" in your faith?',
  },

  // === TIRED / OVERWHELMED ANGLES ===
  {
    id: 'q_angle_35_35_tired',
    contentId: 'quran_35_35',
    mood: 'Tired',
    angle: 'This verse describes the believers entering Paradise, saying "Fatigue will not touch us therein." Scholars explain this as a reminder that earthly tiredness is temporary and its reward is eternal rest. [Tafsir Ibn Kathir]',
    action: 'Renew your intention for your hard work by dedicating it to Allah and requesting His help.',
    actionHowTo: 'Close your eyes and say: "O Allah, I seek Your help in my fatigue and Your reward in my rest."',
    actionReward: 'The Prophet ﷺ said: "The best of actions is the one that is most constant, even if it is small." [Sahih Bukhari]',
    reflection: 'How does the promise of Paradise change your relationship with earthly fatigue today?',
  },
  {
    id: 'q_angle_2_153_tired',
    contentId: 'quran_2_153',
    mood: 'Tired',
    angle: 'The Prophet ﷺ taught that seeking help through prayer is not an additional burden, but a source of power. He would say to Bilal: "O Bilal, give us rest through prayer!" [Abu Dawud 4985]',
    action: 'Perform two Rak’ats of prayer slowly, focusing on the physical release of tension.',
    actionHowTo: 'Take your time in Ruku and Sujud, allowing your heart to catch its breath.',
    actionReward: 'Allah says: "Indeed, Allah is with the patient." [Quran 2:153]',
    reflection: 'How can seeking help through a slow, focused prayer specifically aid your fatigue?',
  },
  {
    id: 'q_angle_2_208_calm',
    contentId: 'quran_2_208',
    mood: 'Calm',
    angle: 'Ibn Kathir explains that "Al-Silm" refers to Islam. Allah commands the believers to embrace all branches of faith and laws of Islam completely to find total security. [Tafsir Ibn Kathir]',
    action: 'Enter into "Silm" (peace/submission) today by making one small, consistent choice for Allah.',
    actionHowTo: 'Pick a small habit like saying "Subhan Allah" after prayer and commit to it.',
    actionReward: 'The Prophet ﷺ said: "The most beloved of deeds to Allah are those that are consistent, even if they are small." [Bukhari]',
    reflection: "How does total submission to Allah's plan bring your heart into deep security?",
  },
  {
    id: 'q_angle_93_11_grateful',
    contentId: 'quran_93_11',
    mood: 'Grateful',
    angle: 'The Prophet ﷺ said: "To speak of the blessings of Allah is gratitude, and to leave it is ingratitude." Mentioning favors is a means of increasing love for Him. [Musnad Ahmad 18449]',
    action: 'Report a favor of your Lord by specifically mentioning a blessing to someone today.',
    actionHowTo: 'Share a story of how Allah helped you with a friend or family member.',
    actionReward: 'Allah says: "If you are grateful, I will surely increase you [in favor]." [Quran 14:7]',
    reflection: 'How does sharing your joy and Reporting His favors increase your own sense of being blessed?',
  },
  {
    id: 'q_angle_55_13_grateful',
    contentId: 'quran_55_13',
    mood: 'Grateful',
    angle: 'When the Prophet ﷺ recited this to the Jinn, they replied: "None of Your favors, our Lord, do we deny; all praise is yours." It is a divine invitation to deep mindfulness. [At-Tirmidhi 3291]',
    action: 'Observe a specific favor in nature today and recognize its Creator.',
    actionHowTo: 'Look at a flower, a tree, or the sky and say: "Subhan Allah, this is Your favor."',
    actionReward: 'The Prophet ﷺ said: "The best of dhikr is Al-hamdu lillah (All praise is due to Allah)." [At-Tirmidhi]',
    reflection: 'Which specific favor of my Lord am I most aware of right now?',
  },
  {
    id: 'q_angle_5_3_grateful',
    contentId: 'quran_5_3',
    mood: 'Grateful',
    angle: 'Gratitude for the completion of faith',
    action: 'Say "Alhamdulillah" for the gift of being a Muslim',
    reflection: 'How is the perfection of my religion a completed favor for my life?',
  },
  {
    id: 'q_angle_2_152_grateful',
    contentId: 'quran_2_152',
    mood: 'Grateful',
    angle: 'Thankfulness that draws divine remembrance',
    action: 'Thank Allah for the strength to even remember Him',
    reflection: 'What changes when I realize my gratitude is a sign He is remembering me?',
  },
  {
    id: 'q_angle_2_186_anxious',
    contentId: 'quran_2_186',
    mood: 'Anxious',
    angle: 'He is near when your heart is racing',
    action: 'Slow your breathing and acknowledge that Allah is closer than your fear',
    reflection: 'How does the nearness of the All-Hearing settle your anxiety?',
  },
  {
    id: 'q_angle_20_25_anxious',
    contentId: 'quran_20_25',
    mood: 'Anxious',
    angle: 'Seeking expansion when you feel constricted',
    action: 'Recite "Rabbish-rah li sadri" three times slowly',
    reflection: 'What does "expansion of the breast" look like for my current situation?',
  },
  {
    id: 'q_angle_40_44_anxious',
    contentId: 'quran_40_44',
    mood: 'Anxious',
    angle: 'Entrusting the affair to the One who sees the servants',
    action: 'Acknowledge that Allah sees your struggle and can handle the outcome',
    reflection: 'How does letting go of the "How" bring peace to your heart?',
  },
  {
    id: 'q_angle_2_153_anxious_angle',
    contentId: 'quran_2_153',
    mood: 'Anxious',
    angle: 'Seeking help through the twin pillars of stability',
    action: 'Stand for a 2-minute voluntary prayer to ground your soul',
    reflection: 'How does the physical act of prayer (Salah) dissolve the weight of spiritual anxiety?',
  },
  {
    id: 'q_angle_41_30_anxious_angle',
    contentId: 'quran_41_30',
    mood: 'Anxious',
    angle: 'Angels of peace for the steadfast soul',
    action: 'Commit to staying on the "right course" today despite your fears',
    reflection: 'What would it feel like to have the angels say "do not fear" to you?',
  },
  {
    id: 'q_angle_20_46_anxious_angle',
    contentId: 'quran_20_46',
    mood: 'Anxious',
    angle: 'He sees the source of your fear and hears your breathing',
    action: 'Acknowledge that you are never alone in your struggle',
    reflection: 'How does knowing Allah is "hearing and seeing" change your fear?',
  },
  {
    id: 'q_angle_8_33_stressed',
    contentId: 'quran_8_33',
    mood: 'Stressed',
    angle: 'The shield of seeking forgiveness',
    action: 'Take a deep breath and say "Astaghfirullah" for any mistakes made in haste',
    reflection: 'How does cleaning your slate with Allah reduce your external pressure?',
  },
  {
    id: 'q_angle_35_35_stressed',
    contentId: 'quran_35_35',
    mood: 'Stressed',
    angle: 'Looking beyond the temporary weariness',
    action: 'Imagine the absolute relief of the Hereafter where no stress exists',
    reflection: "How does the promise of eternal peace help you manage today's load?",
  },
  {
    id: 'q_angle_3_17_tired_angle',
    contentId: 'quran_2_177',
    mood: 'Tired',
    angle: 'Patience in the face of exhaustion',
    action: 'Be gentle with yourself today, acknowledging your effort is worship',
    reflection: 'How is physical exhaustion a path to spiritual refinement?',
  },
  {
    id: 'q_angle_50_16_anxious_angle',
    contentId: 'quran_50_16',
    mood: 'Anxious',
    angle: 'Closer than your own heartbeat',
    action: 'Acknowledge that Allah knows your fear better than you do',
    reflection: 'If He is this close, can anything ever truly be "too much"?',
  },
  {
    id: 'q_angle_3_173_stressed_angle',
    contentId: 'quran_3_173',
    mood: 'Stressed',
    angle: 'Trusting the Best Disposer with your heavy load',
    action: 'Declare "Hasbunallahu wa ni\'mal-wakil" over your biggest stressor',
    reflection: 'If the Best Disposer is in charge, why do I still carry the stress?',
  },
  {
    id: 'q_angle_6_17_stressed',
    contentId: 'quran_6_17',
    mood: 'Stressed',
    angle: 'Only He can lift the burden of stress',
    action: 'Ask the "Lifter of Hardship" (Al-Kashif) to remove your stress',
    reflection: 'How does it feel to know that no one can prevent the good He intends for you?',
  },
  {
    id: 'q_angle_7_188_stressed',
    contentId: 'quran_7_188',
    mood: 'Stressed',
    angle: 'Acknowledging our lack of power compared to His',
    action: 'Release your grip on the outcome and admit your need for His help',
    reflection:
      "If I don't even control benefit for myself, why do I stress about everything else?",
  },
  {
    id: 'q_angle_42_30_stressed',
    contentId: 'quran_42_30',
    mood: 'Stressed',
    angle: 'The mercy found in the midst of trial',
    action: 'Acknowledge that Allah pardons much, even during stressful times',
    reflection: 'How can I maintain a state of Shukr (gratitude) while under pressure?',
  },
  {
    id: 'q_angle_27_62_stressed',
    contentId: 'quran_27_62',
    mood: 'Stressed',
    angle: 'He responds to the one in desperate need',
    action: 'Call out to Allah with the desperation of someone who has no other helper',
    reflection: 'When have I felt His direct response in a time of severe stress?',
  },
  {
    id: 'q_angle_21_83_stressed',
    contentId: 'quran_21_83',
    mood: 'Stressed',
    angle: 'The prayer for health and relief from affliction',
    action: 'Make the dua of Ayyub (AS): "Anni massaniyad-durru..."',
    reflection: 'How does trust in the "Most Merciful" soften the experience of stress?',
  },
  {
    id: 'q_angle_9_51_stressed_angle',
    contentId: 'quran_9_51',
    mood: 'Stressed',
    angle: 'Only what Allah has decreed will reach us',
    action: 'Repeat "Qul lan yusibana illa ma kataballahu lana"',
    reflection: 'What happens to my stress when I accept that the outcome is already written?',
  },
  {
    id: 'q_angle_48_4_calm_angle',
    contentId: 'quran_48_4',
    mood: 'Calm',
    angle: 'Tranquility as a divine gift into the hearts',
    action: 'Ask Allah specifically for "Sakina" (tranquility) to descend on your heart',
    reflection: 'How does it feel to have "armies of the heavens and earth" supporting your peace?',
  },
  {
    id: 'q_angle_30_21_content_angle',
    contentId: 'quran_30_21',
    mood: 'Content',
    angle: 'Peace found in the signs of love and mercy',
    action: 'Acknowledge the love in your life as a direct sign of His mercy',
    reflection: 'How does recognizing these "signs" increase my daily satisfaction?',
  },
  {
    id: 'q_angle_48_18_calm_angle',
    contentId: 'quran_48_18',
    mood: 'Calm',
    angle: "Allah's pleasure and the gift of inner peace",
    action: 'Reflect on the idea that Allah is pleased with you in this moment of calm',
    reflection: 'What greater source of peace is there than divine pleasure?',
  },
  {
    id: 'q_angle_9_26_calm_angle',
    contentId: 'quran_9_26',
    mood: 'Calm',
    angle: 'Divine tranquility descending in moments of crisis',
    action: 'Recall a time you felt unexpectedly calm during a storm',
    reflection: 'How can I prepare my heart to receive His sakina at any moment?',
  },
  {
    id: 'q_angle_8_10_calm',
    contentId: 'quran_8_10',
    mood: 'Calm',
    angle: 'Assurance of heart through good tidings',
    action: 'Repeat "Ya Salam" (O Source of Peace) and visualize His help coming to you',
    reflection: 'How does knowing victory is from Allah alone settle your inner heart?',
  },
  {
    id: 'q_angle_9_40_calm',
    contentId: 'quran_9_40',
    mood: 'Calm',
    angle: 'The peace of being with Allah in the cave',
    action: 'Pause and acknowledge: "Allah is with me" in my current "cave" of difficulty',
    reflection: 'How does His presence provide an unshakeable calm despite external threats?',
  },
  {
    id: 'q_angle_17_11_hopeful',
    contentId: 'quran_17_11',
    mood: 'Hopeful',
    angle: 'Patience in the face of human haste',
    action: "Pause and acknowledge that Allah's timing is more hopeful than mine",
    reflection: 'Why do I sometimes "pray for evil" (in haste) when Allah has better for me?',
  },
  {
    id: 'q_angle_21_90_hopeful',
    contentId: 'quran_21_90',
    mood: 'Hopeful',
    angle: 'Calling with hope and humility',
    action: 'Make a dua with both desire (for it) and awe (for Him)',
    reflection: 'How does a balance of hope and awe keep my heart healthy?',
  },
  {
    id: 'q_angle_32_16_hopeful',
    contentId: 'quran_32_16',
    mood: 'Hopeful',
    angle: 'The hidden joy awaiting the night-strivers',
    action: 'Perform a secret good deed today that only Allah knows about',
    reflection: 'What "hidden joy" am I most looking forward to in the Hereafter?',
  },
  {
    id: 'q_angle_89_27_calm_angle',
    contentId: 'quran_89_27',
    mood: 'Calm',
    angle: 'Return to the serenity of your Lord',
    action: 'Breathe in the tranquility of the reassurred soul',
    reflection: 'How can I maintain a state of "well-pleasing and pleasing" throughout my day?',
  },
  {
    id: 'q_angle_3_17_tired_angle_final',
    contentId: 'quran_2_177',
    mood: 'Tired',
    angle: 'The Praised Patient ones in the morning light',
    action: 'Choose small, steady acts of worship even when your energy is low',
    reflection: 'How is my current tiredness an opportunity to demonstrate true constancy?',
  },

  {
    id: 'q_angle_25_47_tired',
    contentId: 'quran_25_47',
    mood: 'Tired',
    angle: 'Sleep as a divine garment of rest',
    action: 'Turn off your screens and prepare for rest as an act of trust',
    reflection:
      'How does it feel to know that Allah designed the night specifically for your renewal?',
  },
  {
    id: 'q_angle_78_9_tired',
    contentId: 'quran_78_9',
    mood: 'Tired',
    angle: 'Your sleep is a miracle of rest',
    action: 'Close your eyes for one minute and thank Allah for the gift of sleep',
    reflection: 'Why is something as simple as sleep considered a "sign" of Allah?',
  },
  {
    id: 'q_angle_30_23_tired',
    contentId: 'quran_30_23',
    mood: 'Tired',
    angle: 'Night and day as signs of mercy and provision',
    action: 'Acknowledge that your need for rest is part of your human design',
    reflection: 'How does resting in the night prepare you to seek His bounty in the day?',
  },
  {
    id: 'q_angle_6_13_tired',
    contentId: 'quran_6_13',
    mood: 'Tired',
    angle: 'Every moment of repose belongs to Him',
    action: "Find a moment of stillness and feel yourself resting in Allah's kingdom",
    reflection: 'If everything that rests belongs to Allah, how safe are you in your stillness?',
  },
  {
    id: 'q_angle_73_1_4_tired',
    contentId: 'quran_73_1_4',
    mood: 'Tired',
    angle: 'Arising for a little portion of the night',
    action: 'Commit to waking up just 5 minutes before Fajr for a private moment with Allah',
    reflection: 'How can a small amount of night worship recharge your soul more than sleep?',
  },
  {
    id: 'q_angle_3_17_tired',
    contentId: 'quran_2_177',
    mood: 'Tired',
    angle: 'The patience of those who endure in hardship',
    action: 'Acknowledge your current exhaustion as a form of patience (Sabr)',
    reflection: 'What reward awaits those who remain principled even when they are drained?',
  },
  {
    id: 'q_angle_20_130_tired',
    contentId: 'quran_20_130',
    mood: 'Tired',
    angle: 'Finding satisfaction through the rhythm of praise',
    action: 'Recite "SubhanAllah wa bihamdih" during your next transition',
    reflection: 'How does aligning your heart with the rising and setting sun bring satisfaction?',
  },
  {
    id: 'q_angle_17_79_tired',
    contentId: 'quran_17_79',
    mood: 'Tired',
    angle: 'The praised station through the sacrifice of rest',
    action: 'Offer a short prayer now, even if you feel heavy, as a gift to your Lord',
    reflection: 'What does it say about your love for Allah when you seek Him in your fatigue?',
  },
  {
    id: 'q_angle_94_1_8_tired',
    contentId: 'quran_94_1_8',
    mood: 'Tired',
    angle: 'The complete relief: Hardship, Ease, and Worship',
    action: 'Read the complete Surah Inshirah slowly and let its promise sink in',
    reflection: 'If Allah has already expanded your breast, what burden is too heavy?',
  },

  // === STRESSED ANGLES ===
  {
    id: 'q_angle_94_5_stressed',
    contentId: 'quran_94_5',
    mood: 'Stressed',
    angle: 'Ease is woven into the fabric of your hardship',
    action: 'Identify one small thing that is going right in the middle of your stress',
    reflection: 'If ease is "with" hardship, where is it hiding in your current situation?',
  },
  {
    id: 'q_angle_2_45_stressed',
    contentId: 'quran_2_45',
    mood: 'Stressed',
    angle: 'Seeking help through the twin pillars of patience and prayer',
    action: 'Take five deep breaths, echoing "Ya Sabur" (O Patient One) with each exhale',
    reflection: 'How can slowing down your pace actually bring you closer to a solution?',
  },
  {
    id: 'q_angle_20_25_stressed',
    contentId: 'quran_20_25',
    mood: 'Stressed',
    angle: 'Asking for internal expansion to match external pressure',
    action: 'Recite the prayer of Musa (AS) 7 times: "Rabbish-rah li sadri..."',
    reflection:
      'What would it feel like for your heart to feel "expanded" despite your heavy task?',
  },
  {
    id: 'q_angle_40_44_stressed',
    contentId: 'quran_40_44',
    mood: 'Stressed',
    angle: 'Entrusting the outcome to the One who sees all',
    action: 'Write down your biggest stressor and then say "I entrust this affair to Allah"',
    reflection: 'What happens to your stress levels when you release the weight of the result?',
  },

  // === LONELY ANGLES ===
  {
    id: 'q_angle_50_16_lonely',
    contentId: 'quran_50_16',
    mood: 'Sad',
    angle: 'Closer than your own life',
    action:
      'Sit in silence for 2 minutes, focusing on the feeling of being witnessed by your Creator',
    reflection: "How does Allah's extreme closeness challenge feelings of isolation?",
  },
  {
    id: 'q_angle_40_60_lonely',
    contentId: 'quran_40_60',
    mood: 'Sad',
    angle: 'An invitation to divine connection',
    action: 'Call out to Allah with your worries, as if speaking to a most trusted friend',
    reflection:
      'What changes when you view prayer as a two-way connection rather than a one-way ritual?',
  },

  {
    id: 'q_angle_3_200_energized',
    contentId: 'quran_3_200',
    mood: 'Energized',
    angle: 'Vying in perseverance and mutual strength',
    action: 'Help someone else with a task using your current energy',
    reflection: 'How can I double my success by sharing my strength today?',
  },
  {
    id: 'q_angle_9_105_energized',
    contentId: 'quran_9_105',
    mood: 'Energized',
    angle: 'Your work is witnessed by the Highest',
    action: 'Perform your current task with extra excellence (Ihsan)',
    reflection: 'How does it change your motivation to know your Lord is watching your work?',
  },
  {
    id: 'q_angle_103_1_3_energized',
    contentId: 'quran_103_1_3',
    mood: 'Energized',
    angle: 'Investing time while you have it',
    action: 'Dedicate the next 15 minutes to something with eternal value',
    reflection: 'Am I using this burst of energy to build what will truly last?',
  },
  {
    id: 'q_angle_22_77_energized',
    contentId: 'quran_22_77',
    mood: 'Energized',
    angle: 'Channeling energy into bowing and doing good',
    action: 'Perform a physical act of worship (like prayer) with focus and energy',
    reflection: 'How can I coordinate my body and soul to achieve true success?',
  },
  {
    id: 'q_angle_18_30_energized',
    contentId: 'quran_18_30',
    mood: 'Energized',
    angle: 'No well-performed deed is ever lost',
    action: "Complete a task you've been putting off with a spirit of joy",
    reflection: 'How does knowing the reward is safe make you feel about your effort?',
  },
  {
    id: 'q_angle_28_77_energized',
    contentId: 'quran_28_77',
    mood: 'Energized',
    angle: 'Balanced ambition: seeking the Hereafter while doing good here',
    action: 'Make an intention for your worldly work to benefit your spiritual path',
    reflection: 'How can I use my current resources to "be good as Allah was good to me"?',
  },
  {
    id: 'q_angle_29_69_energized',
    contentId: 'quran_29_69',
    mood: 'Energized',
    angle: 'Guidance as a reward for striving',
    action: 'Set a deliberate spiritual goal for your current burst of energy',
    reflection: 'How can you channel your current energy into "striving in His way"?',
  },
  {
    id: 'q_angle_18_110_energized',
    contentId: 'quran_18_110',
    mood: 'Energized',
    angle: 'Working for the meeting with the Lord',
    action: 'Do one righteous act right now with the sole intention of pleasing Allah',
    reflection: 'How does the hope of meeting your Lord fuel your current drive?',
  },
  {
    id: 'q_angle_67_2_energized',
    contentId: 'quran_67_2',
    mood: 'Energized',
    angle: 'The test of excellence in deed',
    action: 'Pick a task and perform it with the highest level of mastery (Ihsan)',
    reflection: 'If life is a test of "who is best in deed," how are you performing today?',
  },
  {
    id: 'q_angle_99_7_8_energized',
    contentId: 'quran_99_7_8',
    mood: 'Energized',
    angle: 'The immense weight of a tiny good deed',
    action: 'Find a "small" good deed (checking on a neighbor, picking up litter) and do it',
    reflection:
      'How does knowing even an atom\'s weight counts change your definition of "big" effort?',
  },
  {
    id: 'q_angle_94_7_energized',
    contentId: 'quran_94_7',
    mood: 'Energized',
    angle: 'Directing your energy toward what lasts',
    action: 'Use some of your current energy to perform a task for someone else',
    reflection: 'How does directing your longing to Allah sustain your energy?',
  },
  {
    id: 'q_angle_29_69_hopeful_angle',
    contentId: 'quran_29_69',
    mood: 'Hopeful',
    angle: 'The promise of multi-faceted guidance for the striver',
    action: 'Trust that your effort today is opening a new door of guidance',
    reflection: 'Which of "Our ways" (subulana) am I most hoping to be guided to?',
  },
  {
    id: 'q_angle_93_1_5_anxious',
    contentId: 'quran_93_1_5',
    mood: 'Anxious',
    angle: 'Allah has not detested you, nor taken leave',
    action: 'Recall a time you felt abandoned and realize Allah was there',
    reflection: 'How does the morning brightness disprove the fears of the dark night?',
  },
  {
    id: 'q_angle_94_1_8_anxious',
    contentId: 'quran_94_1_8',
    mood: 'Anxious',
    angle: 'The burden that weighed on your back has been removed',
    action: 'Physically roll your shoulders and imagine your burden being lifted by Allah',
    reflection: 'If Allah has already raised your repute, why do the opinions of others matter?',
  },
  {
    id: 'q_angle_20_25_28_anxious',
    contentId: 'quran_20_25_28',
    mood: 'Anxious',
    angle: 'Seeking the untying of knots in your path',
    action: 'Recite "Wahlul uqdatam-mil-lisani" for any difficult conversation today',
    reflection: 'Which "knot" in my life am I most anxious about right now?',
  },
  {
    id: 'q_angle_89_27_30_grateful',
    contentId: 'quran_89_27_30',
    mood: 'Grateful',
    angle: 'Gratitude for the serenity of the soul',
    action: 'Thank Allah for the moments of peace He has granted you',
    reflection: 'How can I live my life as a "returning" that is pleasing to Him?',
  },
  {
    id: 'q_angle_3_135_sad_angle',
    contentId: 'quran_3_135',
    mood: 'Sad',
    angle: 'Returning to Allah as the only forgiver of sins',
    action: 'Recall a mistake and find comfort in the fact that only Allah can forgive it',
    reflection: 'How does it feel to know that your Lord is waiting for you to remember Him?',
  },
  {
    id: 'q_angle_66_8_sad_angle',
    contentId: 'quran_66_8',
    mood: 'Sad',
    angle: 'The path of sincere repentance to a new beginning',
    action: "Make a firm intention to do better tomorrow, trusting in Allah's help",
    reflection: 'What does "sincere" (nasuha) repentance mean for my peace of mind?',
  },
  {
    id: 'q_angle_2_148_energized',
    contentId: 'quran_2_148',
    mood: 'Energized',
    angle: 'Racing toward all that is good',
    action: 'Identify a good deed and do it immediately, without delay',
    reflection: 'How does it feel to "race" toward goodness using your current strength?',
  },
  {
    id: 'q_angle_5_48_energized',
    contentId: 'quran_5_48',
    mood: 'Energized',
    angle: 'Vying with one another in good works',
    action: 'Find a way to contribute to a positive cause today',
    reflection: 'How can I maintain a spirit of "vying for good" in my daily life?',
  },
  {
    id: 'q_angle_30_4_hopeful',
    contentId: 'quran_30_4',
    mood: 'Hopeful',
    angle: "The promise of victory in Allah's timing",
    action: 'Trust that relief is nearing, just as promised to the believers of old',
    reflection: 'How does knowing "victory belongs to Allah" keep my hope alive?',
  },
  {
    id: 'q_angle_3_170_grateful',
    contentId: 'quran_3_170',
    mood: 'Grateful',
    angle: 'Rejoicing in what Allah has granted from His bounty',
    action: 'Smile and thank Allah for the specific bounty He gave you today',
    reflection: 'What would it feel like to receive joyful news from the Hereafter?',
  },
  {
    id: 'q_angle_65_2_hopeful',
    contentId: 'quran_65_2',
    mood: 'Hopeful',
    angle: 'Provision from sources you never imagined',
    action: 'Say "Hasbunallahu wa ni\'mal-wakil" and expect a way out',
    reflection: 'Where is the "way out" that I am currently hoping for?',
  },
  {
    id: 'q_angle_2_216_sad',
    contentId: 'quran_2_216',
    mood: 'Sad',
    angle: 'The mercy in things we do not understand',
    action: 'Acknowledge your limited knowledge compared to His infinite wisdom',
    reflection: 'How does letting go of "understanding" bring peace to my sadness?',
  },
  {
    id: 'q_angle_94_6_hopeful',
    contentId: 'quran_94_6',
    mood: 'Hopeful',
    angle: 'The repetition of the promise of ease',
    action: 'Repeat "Inna ma\'al-usri yusra" until your heart feels it',
    reflection: 'Why did Allah repeat this promise twice for us?',
  },
  {
    id: 'q_angle_3_26_hopeful',
    contentId: 'quran_3_26',
    mood: 'Hopeful',
    angle: 'All good is in His hand',
    action: 'Ask the Owner of Sovereignty to grant you what is best',
    reflection: 'What does it mean for "all good" to be in His hand for me?',
  },
  {
    id: 'q_angle_18_46_hopeful',
    contentId: 'quran_18_46',
    mood: 'Hopeful',
    angle: 'Righteous deeds are better in hope',
    action: 'Do one task with the intention of it being an "enduring good"',
    reflection: 'What legacy of good am I building that is better than worldly wealth?',
  },
  {
    id: 'q_angle_3_17_tired_final_angle',
    contentId: 'quran_2_177',
    mood: 'Tired',
    angle: 'The Praised Patient ones in the morning light',
    action: 'Choose small, steady acts of worship even when your energy is low',
    reflection: 'How is my current tiredness an opportunity to demonstrate true constancy?',
  },
  {
    id: 'q_angle_7_199_angry',
    contentId: 'quran_7_199',
    mood: 'Angry',
    angle: 'Adopting the beauty of pardon',
    action: 'Choose to overlook a fault today just for the sake of your own peace',
    reflection: 'How does "taking to pardon" protect your own heart from anger?',
  },
  {
    id: 'q_angle_42_37_angry',
    contentId: 'quran_42_37',
    mood: 'Angry',
    angle: 'Avoiding major transgressions and embracing forgiveness',
    action: 'Deliberately choose to forgive someone today when you feel provoked',
    reflection: 'What strength does it take to forgive in the heat of a moment?',
  },
  {
    id: 'q_angle_10_58_energized_angle',
    contentId: 'quran_10_58',
    mood: 'Energized',
    angle: 'Rejoicing in the energy of faith',
    action: 'Channel your energy into a task that benefits the community',
    reflection: "How does rejoicing in Allah's bounty sustain your drive?",
  },
  // === NEW ANGLES FOR REBALANCED VERSES ===
  {
    id: 'q_angle_25_63_calm',
    contentId: 'quran_25_63',
    mood: 'Calm',
    angle: 'Scholars like Mujahid and Ibn Kathir explain that "walking easily" (hawnan) refers to dignity (waqar) and tranquility (sakinah). It describes a believer whose inner calmness manifest in a humble and gentle presence. [Tafsir Ibn Kathir]',
    action: 'When provoked today, pause and respond with "Salama" (peace) or silence.',
    actionHowTo: 'Take a deep breath and say "Salam" internally before reacting.',
    actionReward: 'The Prophet ﷺ said: "The most beloved of people to Allah are those with the best character." [At-Tabarani]',
    reflection: 'How does walking easily upon the earth change your posture and presence?',
  },
  {
    id: 'q_angle_25_63_content',
    contentId: 'quran_25_63',
    mood: 'Content',
    angle: 'Al-Hasan al-Basri noted that the servants of the Most Merciful are humble people who do not behave with arrogance even when they are honored. Their contentment is reflected in their gentle dealings with others. [Tafsir al-Baghawi]',
    action: 'Practice responding to a difficulty today with peaceful words.',
    actionHowTo: 'Intentionaly use soft words even if the situation is tense.',
    actionReward: 'The Prophet ﷺ said: "Gentleness is not in anything except that it beautifies it." [Sahih Muslim 2594]',
    reflection: 'What inner peace allows one to answer harshness with peace?',
  },
  {
    id: 'q_angle_41_35_angry',
    contentId: 'quran_41_35',
    mood: 'Angry',
    angle: 'Ibn Abbas explained that Allah commands believers to be patient when angry and to forgive when treated badly. If they do this, Allah protects them from Shaytan and humbles their enemies. [Tafsir Ibn Kathir]',
    action: 'When angry today, seek refuge in Allah and remain silent as the Prophet ﷺ taught.',
    actionHowTo: 'Say "A’udhu billahi minash-shaytanir-rajim" and change your physical posture.',
    actionReward: 'The Prophet ﷺ said: "The strong man is not the one who can wrestle, but the one who can control himself when he is angry." [Sahih Bukhari 6114]',
    reflection: 'Is this moment an opportunity to earn the "great fortune" of those who control their anger?',
  },
  {
    id: 'q_angle_2_265_energized',
    contentId: 'quran_2_265',
    mood: 'Energized',
    angle: 'Scholars explain that "seeking the pleasure of Allah" means pure sincerity (Ikhlas). When energy is paired with sincerity, every effort yields multiple rewards, like a garden on a height. [Tafsir al-Jalalayn]',
    action: 'Channel your energy into an act of charity or service with pure intention.',
    actionHowTo: 'Renew your intention (Niyyah) specifically for Allah before starting the task.',
    actionReward: 'The Prophet ﷺ said: "Allah is pure and accepts only what is pure." [Sahih Muslim 1015]',
    reflection: 'How does sincerity make your energy and actions more productive?',
  },
  {
    id: 'q_angle_2_265_grateful',
    contentId: 'quran_2_265',
    mood: 'Grateful',
    angle: 'This verse uses the metaphor of a lush garden to show how gratitude and sincerity invite divine blessing. No matter the "rainfall" in your life, Allah ensures your garden flourishes. [Tafsir Ibn Kathir]',
    action: 'Thank Allah for the specific blessings that have multiplied in your life.',
    actionHowTo: 'List 3 specific blessings and say "Alhamdulillah" for each with presence of heart.',
    actionReward: 'Allah says: "If you are grateful, I will surely increase you [in favor]." [Quran 14:7]',
    reflection: 'Like the well-watered garden, what in your life has flourished beyond expectation?',
  },
  {
    id: 'q_angle_3_170_content',
    contentId: 'quran_3_170',
    mood: 'Content',
    angle: 'The Prophet ﷺ taught that true richness is contentment. He said: "Be pleased with what Allah has apportioned for you, and you will be the richest of people." [At-Tirmidhi 2305]',
    action: 'Reflect on a recent blessing and allow your heart to rest in "Rida" (contentment).',
    actionHowTo: 'Say "Raditu billahi Rabba" (I am pleased with Allah as my Lord).',
    actionReward: 'The Prophet ﷺ said: "The one who is pleased with Allah as Lord... has tasted the sweetness of faith." [Sahih Muslim 34]',
    reflection: 'What blessings has Allah bestowed that bring you deep contentment today?',
  },
  {
    id: 'q_angle_40_60_stressed',
    contentId: 'quran_40_60',
    mood: 'Stressed',
    angle: 'The Prophet ﷺ said: "Your Lord is Generous and Shy; if His servant raises his hands to Him, He is shy to return them empty." Stress is a call to this direct connection. [Abu Dawud 1488]',
    action: 'When stress feels heavy, call upon Allah immediately with a sincere Du’a.',
    actionHowTo: 'Raise your hands and name your specific stressor to Allah.',
    actionReward: 'The Prophet ﷺ said: "Du’a is worship." Every call to Him is recorded as a high act of devotion. [At-Tirmidhi 2969]',
    reflection: 'How does the promise of a divine response ease the weight of your stress?',
  },
  // === SALAH TRANSFORMATION JOURNEY ANGLES ===
  {
    id: 'q_angle_salah_1',
    contentId: 'quran_23_1',
    mood: 'Calm',
    angle: 'Ibn Rajab: "Khushu is when the heart feels awe before Allah\'s greatness and the limbs submit in stillness" [Jami\' al-Ulum wal-Hikam]',
    action: 'Pause 30 seconds before your next prayer and ask yourself: "Who am I about to stand before?"',
    actionHowTo: 'Perform wudu with full attention to each step, acknowledging the spiritual purification.',
    actionReward: 'Success is guaranteed for those who find Khushu. [Quran 23:1-2]',
    reflection: 'What distracted you most in today\'s prayers? Identify the top 3 distractions.',
  },
  {
    id: 'q_angle_salah_2',
    contentId: 'quran_7_31',
    mood: 'Calm',
    angle: 'Prophet ﷺ said: "When any one of you stands to pray, he is conversing with his Lord" [Bukhari 531]',
    action: 'Choose a clean, quiet spot for next prayer and arrive 2 minutes early.',
    actionHowTo: 'Use siwak/brush teeth before wudu and wear clean clothes as a sign of respect.',
    actionReward: 'Taking adornment for prayer is a sign of honoring the meeting with Allah.',
    reflection: 'How did preparing intentionally change your prayer experience?',
  },
  {
    id: 'q_angle_salah_3',
    contentId: 'quran_29_45',
    mood: 'Calm',
    angle: 'Ibn al-Qayyim: "When you say \'Allahu Akbar,\' you declare that Allah is greater than everything occupying your mind"',
    action: 'Raise hands for takbir slowly and pause 3 seconds before opening dua.',
    actionHowTo: 'Mentally "drop" all worldly concerns at the moment of the opening Takbir.',
    actionReward: 'The remembrance of Allah is the greatest shield. [Quran 29:45]',
    reflection: 'Did you truly believe Allah was greater than your worries when you said the takbir?',
  },
  {
    id: 'q_angle_salah_4',
    contentId: 'quran_2_45',
    mood: 'Calm',
    angle: 'Hadith Qudsi: Allah says "I have divided the prayer between Myself and My servant into two halves... When the servant says \'Alhamdulillahi rabbil aalameen,\' Allah says \'My servant has praised Me\'" [Muslim 395]',
    action: 'Learn the meaning of each line of Fatihah and pause briefly after each phrase.',
    actionHowTo: 'Imagine Allah responding to each line you recite in the conversation of Fatihah.',
    actionReward: 'Prayer is the ultimate source of help for the humbly submissive. [Quran 2_45]',
    reflection: 'Which phrase of Fatihah resonated most today? Why?',
  },
  {
    id: 'q_angle_salah_5',
    contentId: 'quran_22_77',
    mood: 'Calm',
    angle: 'Prophet ﷺ said: "The worst thief is one who steals from his prayer by not completing its bowing and prostration" [Ahmad 22136]',
    action: 'Hold stillness in ruku for at least 3 slow tasbeeh.',
    actionHowTo: 'Ensure your back is straight in ruku and forehead/nose are firmly on the ground in sujood.',
    actionReward: 'Bowing and prostrating are acts that draw the believer closest to their Lord.',
    reflection: 'Did you rush through any positions today? Which one and why?',
  },
  {
    id: 'q_angle_salah_6',
    contentId: 'quran_14_40',
    mood: 'Calm',
    angle: 'The Prophet ﷺ would make specific dua between positions: "Rabbana wa lakal hamd" and "Rabbighfir li" between sujood [Abu Dawud 874]',
    action: 'Consciously recite the transition prayers and the dua between the two sujood.',
    actionHowTo: 'Say "Rabbighfir li" (My Lord, forgive me) twice minimum while sitting between prostrations.',
    actionReward: 'Steadfastness in prayer is a gift from Allah as seen in the dua of Ibrahim (AS).',
    reflection: 'How does asking for forgiveness between prostrations change your focus?',
  },
  {
    id: 'q_angle_salah_7',
    contentId: 'quran_29_45',
    mood: 'Calm',
    angle: 'Prophet ﷺ never left prayer without post-salah dhikr: Istighfar (3x), Ayat al-Kursi, and Tasbih 33-33-34 [Bukhari 844]',
    action: 'Perform the full post-prayer dhikr routine after your final salam.',
    actionHowTo: 'Stay seated for 2 minutes in reflection after completing the dhikr.',
    actionReward: 'Prayer prevents immorality and wrongdoing when sealed with remembrance.',
    reflection: 'How has your prayer changed over 7 days? What will you maintain?',
  },
];

export { quranContent, quranContentAnglesData as quranContentAngles };
