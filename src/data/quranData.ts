/**
 * Pre-fetched Quran Data
 *
 * Curated Quranic verses with Arabic text, translations, and mood-specific angles.
 * This data is stored locally for offline access - no API calls needed at runtime.
 *
 * Source: Quran.com API (Sahih International)
 */

import { Content, ContentAngle } from '../types';

/**
 * Curated Quran verses for the Islamic Guidance App
 * Each verse is mapped to relevant moods with specific angles
 */
const quranContentData: Content[] = [
  // === ANXIOUS / TAWAKKUL ===
  {
    id: 'quran_93_4',
    type: 'Quran',
    primaryText: 'walalākhiratu khayrun laka mina l-ūlā',
    arabicText: 'وَلَلْـَٔاخِرَةُ خَيْرٌۭ لَّكَ مِنَ ٱلْأُولَىٰ ﴿4﴾',
    transliteration: 'walalākhiratu khayrun laka mina l-ūlā',
    englishTranslation: 'And surely the Hereafter is better for you than the first.',
    source: 'Surah Ad-Duha 93:4',
    audioKey: '93:4',
    whyThis: 'When you feel crushed by the weight of this life, this verse reorients you: everything you are enduring now is temporary, and what lies ahead with Allah is incomparably better. Ibn Kathir notes that this was a direct reassurance to the Prophet ﷺ — and by extension to every believer — that their striving is never in vain.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_94_5',
    type: 'Quran',
    primaryText: "fa-inna maʿa l-ʿus'ri yus'ran inna maʿa l-ʿus'ri yus'ran",
    arabicText: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا إِنَّ مَعَ ٱلْعُسْرِ يُسْرًۭا ﴿5-6﴾',
    transliteration: "fa-inna maʿa l-ʿus'ri yus'ran inna maʿa l-ʿus'ri yus'ran",
    englishTranslation: 'So indeed, with the hardship is ease. Indeed, with the hardship is ease.',
    source: 'Surah Ash-Sharh 94:5-6',
    audioKey: '94:5-6',
    whyThis: 'The scholars of Arabic grammar note that "the hardship" (al-usr) uses the definite article both times — it is the same hardship — while "ease" (yusr) is indefinite each time, meaning multiple different eases accompany every single hardship. Ibn Masud (RA) reportedly said: "One hardship cannot overcome two eases." [Tafsir Ibn Kathir, Surah Al-Inshirah]',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_2_255',
    type: 'Quran',
    primaryText:
      "al-lahu lā ilāha illā huwa l-ḥayu l-qayūmu lā takhudhuhu sinatun walā nawmun lahu mā fī l-samāwāti wamā fī l-arḍi man dhā alladhī yashfaʿu ʿindahu illā bi-idh'nihi yaʿlamu mā bayna aydīhim wamā khalfahum walā yuḥīṭūna bishayin min ʿil'mihi illā bimā shāa wasiʿa kur'siyyuhu l-samāwāti wal-arḍa walā yaūduhu ḥif'ẓuhumā wahuwa l-ʿaliyu l-ʿaẓīmu",
    arabicText:
      'ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌۭ وَلَا نَوْمٌۭ ۚ لَّهُۥ مَا فِى ٱلسَّمَـٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍۢ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ ﴿255﴾',
    transliteration:
      "al-lahu lā ilāha illā huwa l-ḥayu l-qayūmu lā takhudhuhu sinatun walā nawmun lahu mā fī l-samāwāti wamā fī l-arḍi man dhā alladhī yashfaʿu ʿindahu illā bi-idh'nihi yaʿlamu mā bayna aydīhim wamā khalfahum walā yuḥīṭūna bishayin min ʿil'mihi illā bimā shāa wasiʿa kur'siyyuhu l-samāwāti wal-arḍa walā yaūduhu ḥif'ẓuhumā wahuwa l-ʿaliyu l-ʿaẓīmu",
    englishTranslation:
      'Allah — there is no god except Him, the Ever-Living, the Sustainer of all that exists. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what is behind them, and they encompass nothing of His knowledge except what He wills. His Seat extends over the heavens and the earth, and their preservation does not tire Him. And He is the Most High, the Most Great.',
    source: 'Surah Al-Baqarah 2:255',
    audioKey: '2:255',
    whyThis: 'The greatest verse in the Quran, providing ultimate spiritual protection and tranquility.',
    moods: ['Overwhelmed', 'Calm'],
  },
  {
    id: 'quran_2_286',
    type: 'Quran',
    primaryText:
      "lā yukallifu l-lahu nafsan illā wus'ʿahā lahā mā kasabat waʿalayhā mā ik'tasabat rabbanā lā tuākhidh'nā in nasīnā aw akhṭanā rabbanā walā taḥmil ʿalaynā iṣ'ran kamā ḥamaltahu ʿalā alladhīna min qablinā rabbanā walā tuḥammil'nā mā lā ṭāqata lanā bihi wa-uʿ'fu ʿannā wa-igh'fir lanā wa-ir'ḥamnā anta mawlānā fa-unṣur'nā ʿalā l-qawmi l-kāfirīna",
    arabicText:
      'لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا ٱكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَآ إِن نَّسِينَآ أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَآ إِصْرًۭا كَمَا حَمَلْتَهُۥ عَلَى ٱلَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِۦ ۖ وَٱعْفُ عَنَّا وَٱغْفِرْ لَنَا وَٱرْحَمْنَآ ۚ أَنتَ مَوْلَىٰنَا فَٱنصُرْنَا عَلَى ٱلْقَوْمِ ٱلْكَـٰفِرِينَ ﴿286﴾',
    transliteration:
      "lā yukallifu l-lahu nafsan illā wus'ʿahā lahā mā kasabat waʿalayhā mā ik'tasabat rabbanā lā tuākhidh'nā in nasīnā aw akhṭanā rabbanā walā taḥmil ʿalaynā iṣ'ran kamā ḥamaltahu ʿalā alladhīna min qablinā rabbanā walā tuḥammil'nā mā lā ṭāqata lanā bihi wa-uʿ'fu ʿannā wa-igh'fir lanā wa-ir'ḥamnā anta mawlānā fa-unṣur'nā ʿalā l-qawmi l-kāfirīna",
    englishTranslation:
      'Allah does not burden a soul beyond its capacity. It will have what it has earned, and against it what it has earned. Our Lord, do not take us to task if we forget or err. Our Lord, do not lay upon us a burden like that which You laid on those before us. Our Lord, do not burden us with what we have no strength to bear. Pardon us, forgive us, and have mercy on us. You are our Protector, so help us against the disbelieving people.',
    source: 'Surah Al-Baqarah 2:286',
    audioKey: '2:286',
    whyThis: 'This verse closes Surah Al-Baqarah and is one of the most comforting passages in the Quran. The Prophet ﷺ said: "Whoever recites the last two verses of Surah Al-Baqarah at night, they will suffice him." [Bukhari 5009] The opening line is a divine guarantee: you will never be asked to carry more than you can bear.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_65_3',
    type: 'Quran',
    primaryText:
      "wayarzuq'hu min ḥaythu lā yaḥtasibu waman yatawakkal ʿalā l-lahi fahuwa ḥasbuhu inna l-laha bālighu amrihi qad jaʿala l-lahu likulli shayin qadran",
    arabicText:
      'وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ ۚ وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥٓ ۚ إِنَّ ٱللَّهَ بَـٰلِغُ أَمْرِهِۦ ۚ قَدْ جَعَلَ ٱللَّهُ لِكُلِّ شَىْءٍۢ قَدْرًۭا ﴿3﴾',
    transliteration:
      "wayarzuq'hu min ḥaythu lā yaḥtasibu waman yatawakkal ʿalā l-lahi fahuwa ḥasbuhu inna l-laha bālighu amrihi qad jaʿala l-lahu likulli shayin qadran",
    englishTranslation:
      'And He will provide for him from where he does not expect. And whoever puts his trust upon Allah, then He is sufficient for him. Indeed, Allah will accomplish His purpose. Allah has already set for everything a measure.',
    source: 'Surah At-Talaq 65:3',
    audioKey: '65:3',
    whyThis: 'True reliance on Allah (tawakkul) brings peace, provision, and sufficiency.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_3_173',
    type: 'Quran',
    primaryText:
      "alladhīna qāla lahumu l-nāsu inna l-nāsa qad jamaʿū lakum fa-ikh'shawhum fazādahum īmānan waqālū ḥasbunā l-lahu waniʿ'ma l-wakīlu",
    arabicText:
      'ٱلَّذِينَ قَالَ لَهُمُ ٱلنَّاسُ إِنَّ ٱلنَّاسَ قَدْ جَمَعُوا۟ لَكُمْ فَٱخْشَوْهُمْ فَزَادَهُمْ إِيمَـٰنًۭا وَقَالُوا۟ حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ ﴿173﴾',
    transliteration:
      "alladhīna qāla lahumu l-nāsu inna l-nāsa qad jamaʿū lakum fa-ikh'shawhum fazādahum īmānan waqālū ḥasbunā l-lahu waniʿ'ma l-wakīlu",
    englishTranslation:
      'Those who were told, "Indeed, the people have gathered against you, so fear them." But it increased them in faith, and they said, "Sufficient for us is Allah, and He is the best Disposer of affairs."',
    translation:
      'After the Battle of Uhud, the believers were warned that their enemies had regrouped against them. But instead of being afraid, their faith only grew stronger — and they declared: "Allah is enough for us; He is the best One to rely on."',
    source: 'Surah Ali Imran 3:173',
    audioKey: '3:173',
    whyThis: 'When threatened with overwhelming opposition after Uhud, the companions responded not with fear but with increased faith and this declaration. "Hasbunallah wa ni\'mal wakeel" — Allah is enough for us, and He is the best Disposer of affairs — is a statement the Prophet Ibrahim (AS) also made when thrown into the fire. [Bukhari 4563]',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_53_39',
    type: 'Quran',
    primaryText: "wa-an laysa lil'insāni illā mā saʿā",
    arabicText: 'وَأَن لَّيْسَ لِلْإِنسَـٰنِ إِلَّا مَا سَعَىٰ ﴿39﴾',
    transliteration: "wa-an laysa lil'insāni illā mā saʿā",
    englishTranslation: 'And that there is nothing for man except what he strives for.',
    source: 'Surah An-Najm 53:39',
    audioKey: '53:39',
    whyThis: 'This verse grounds us in divine justice: your effort is the measure of your reward. Nothing is wasted. Ibn Kathir explains that this verse establishes the principle that every person is accountable for what they personally strive toward — both in this life and in the account before Allah.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_26_80',
    type: 'Quran',
    primaryText: "wa-idhā mariḍ'tu fahuwa yashfīni",
    arabicText: 'وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ ﴿80﴾',
    transliteration: "wa-idhā mariḍ'tu fahuwa yashfīni",
    englishTranslation: 'And when I am ill, it is He who cures me.',
    source: "Surah Ash-Shu'ara 26:80",
    audioKey: '26:80',
    whyThis: 'This is part of the prayer of Ibrahim (AS), who attributed illness to himself but cure solely to Allah — a model of how believers speak about their condition: owning their vulnerability while trusting that only Allah holds the power to heal, whether that healing is physical, emotional, or spiritual.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_2_257',
    type: 'Quran',
    primaryText:
      "al-lahu waliyyu alladhīna āmanū yukh'rijuhum mina l-ẓulumāti ilā l-nūri wa-alladhīna kafarū awliyāuhumu l-ṭāghūtu yukh'rijūnahum mina l-nūri ilā l-ẓulumāti ulāika aṣḥābu l-nāri hum fīhā khālidūna",
    arabicText:
      'ٱللَّهُ وَلِىُّ ٱلَّذِينَ ءَامَنُوا۟ يُخْرِجُهُم مِّنَ ٱلظُّلُمَـٰتِ إِلَى ٱلنُّورِ ۖ وَٱلَّذِينَ كَفَرُوٓا۟ أَوْلِيَآؤُهُمُ ٱلطَّـٰغُوتُ يُخْرِجُونَهُم مِّنَ ٱلنُّورِ إِلَى ٱلظُّلُمَـٰتِ ۗ أُو۟لَـٰٓئِكَ أَصْحَـٰبُ ٱلنَّارِ ۖ هُمْ فِيهَا خَـٰلِدُونَ ﴿257﴾',
    transliteration:
      "al-lahu waliyyu alladhīna āmanū yukh'rijuhum mina l-ẓulumāti ilā l-nūri wa-alladhīna kafarū awliyāuhumu l-ṭāghūtu yukh'rijūnahum mina l-nūri ilā l-ẓulumāti ulāika aṣḥābu l-nāri hum fīhā khālidūna",
    englishTranslation:
      'Allah is the Protecting Guardian of those who believe. He brings them out from darkness into light. And those who disbelieve — their guardians are the evil ones, who bring them out from light into darkness. Those are the companions of the Fire; they will abide therein forever.',
    source: 'Surah Al-Baqarah 2:257',
    audioKey: '2:257',
    whyThis: 'The word "wali" here means more than a friend — it is a guardian and protector with authority. When you feel overwhelmed and directionless, this verse reminds you that Allah Himself is actively guiding you out of every darkness. The journey from darkness to light is not something you do alone; Allah initiates it.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_8_40',
    type: 'Quran',
    primaryText: "wa-in tawallaw fa-iʿ'lamū anna l-laha mawlākum niʿ'ma l-mawlā waniʿ'ma l-naṣīru",
    arabicText:
      'وَإِن تَوَلَّوْا۟ فَٱعْلَمُوٓا۟ أَنَّ ٱللَّهَ مَوْلَىٰكُمْ ۚ نِعْمَ ٱلْمَوْلَىٰ وَنِعْمَ ٱلنَّصِيرُ ﴿40﴾',
    transliteration:
      "wa-in tawallaw fa-iʿ'lamū anna l-laha mawlākum niʿ'ma l-mawlā waniʿ'ma l-naṣīru",
    englishTranslation:
      'And if they turn away, then know that Allah is your Protector. Excellent is the Protector, and Excellent is the Helper.',
    source: 'Surah Al-Anfal 8:40',
    audioKey: '8:40',
    whyThis: 'When people abandon you or refuse your call, this verse redirects your reliance — Allah is your Mawla (Protector and Master), and He is Ni\'mal Mawla (excellent as a Protector) and Ni\'mal Naseer (excellent as a Helper). No human loss is a loss when Allah remains your guardian.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_5_23',
    type: 'Quran',
    primaryText:
      "qāla rajulāni mina alladhīna yakhāfūna anʿama l-lahu ʿalayhimā ud'khulū ʿalayhimu l-bāba fa-idhā dakhaltumūhu fa-innakum ghālibūna waʿalā l-lahi fatawakkalū in kuntum mu'minīna",
    arabicText:
      'قَالَ رَجُلَانِ مِنَ ٱلَّذِينَ يَخَافُونَ أَنْعَمَ ٱللَّهُ عَلَيْهِمَا ٱدْخُلُوا۟ عَلَيْهِمُ ٱلْبَابَ فَإِذَا دَخَلْتُمُوهُ فَإِنَّكُمْ غَـٰلِبُونَ ۚ وَعَلَى ٱللَّهِ فَتَوَكَّلُوٓا۟ إِن كُنتُم مُّؤْمِنِينَ ﴿23﴾',
    transliteration:
      "qāla rajulāni mina alladhīna yakhāfūna anʿama l-lahu ʿalayhimā ud'khulū ʿalayhimu l-bāba fa-idhā dakhaltumūhu fa-innakum ghālibūna waʿalā l-lahi fatawakkalū in kuntum mu'minīna",
    englishTranslation:
      'Two men from those who feared Allah, upon whom Allah had bestowed favor, said, "Enter upon them through the gate. When you have entered it, you will be victorious. And upon Allah put your trust, if you are believers."',
    translation:
      'Two men among those who feared Allah and upon whom Allah had bestowed favour said: "Enter upon them through the gate. When you have entered it, you will be victorious. And upon Allah put your trust, if you are believers."',
    source: 'Surah Al-Maidah 5:23',
    audioKey: '5:23',
    whyThis: 'Tawakkul (reliance on Allah) is not just encouraged - it is a sign of true belief.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_14_12',
    type: 'Quran',
    primaryText:
      'wamā lanā allā natawakkala ʿalā l-lahi waqad hadānā subulanā walanaṣbiranna ʿalā mā ādhaytumūnā waʿalā l-lahi falyatawakkali l-mutawakilūna',
    arabicText:
      'وَمَا لَنَآ أَلَّا نَتَوَكَّلَ عَلَى ٱللَّهِ وَقَدْ هَدَىٰنَا سُبُلَنَا ۚ وَلَنَصْبِرَنَّ عَلَىٰ مَآ ءَاذَيْتُمُونَا ۚ وَعَلَى ٱللَّهِ فَلْيَتَوَكَّلِ ٱلْمُتَوَكِّلُونَ ﴿12﴾',
    transliteration:
      'wamā lanā allā natawakkala ʿalā l-lahi waqad hadānā subulanā walanaṣbiranna ʿalā mā ādhaytumūnā waʿalā l-lahi falyatawakkali l-mutawakilūna',
    englishTranslation:
      'And why should we not put our trust upon Allah, while He has guided us to our ways? And surely we will bear with patience whatever harm you may cause us. And upon Allah let those who trust put their trust.',
    translation:
      'The messengers of Allah replied to those who threatened them: "Why would we not trust in Allah, when He has already guided us? We will patiently endure whatever harm you cause us. Whoever truly trusts — let them place their trust in Allah alone."',
    source: 'Surah Ibrahim 14:12',
    audioKey: '14:12',
    whyThis: 'The messengers of Allah said this while being actively threatened and harmed. Their tawakkul was not passive — it was a declaration made under pressure. The verse shows that true reliance on Allah is what allows a believer to bear harm with patience rather than collapse under it.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_8_2',
    type: 'Quran',
    primaryText:
      "innamā l-mu'minūna alladhīna idhā dhukira l-lahu wajilat qulūbuhum wa-idhā tuliyat ʿalayhim āyātuhu zādathum īmānan waʿalā rabbihim yatawakkalūna",
    arabicText:
      'إِنَّمَا ٱلْمُؤْمِنُونَ ٱلَّذِينَ إِذَا ذُكِرَ ٱللَّهُ وَجِلَتْ قُلُوبُهُمْ وَإِذَا تُلِيَتْ عَلَيْهِمْ ءَايَـٰتُهُۥ زَادَتْهُمْ إِيمَـٰنًۭا وَعَلَىٰ رَبِّهِمْ يَتَوَكَّلُونَ ﴿2﴾',
    transliteration:
      "innamā l-mu'minūna alladhīna idhā dhukira l-lahu wajilat qulūbuhum wa-idhā tuliyat ʿalayhim āyātuhu zādathum īmānan waʿalā rabbihim yatawakkalūna",
    englishTranslation:
      'The believers are only those who, when Allah is mentioned, their hearts become fearful; and when His verses are recited to them, it increases them in faith; and upon their Lord they put their trust.',
    source: 'Surah Al-Anfal 8:2',
    audioKey: '8:2',
    whyThis: 'This verse defines the believer by three inner signs: a heart that responds to the mention of Allah, faith that grows with every verse heard, and trust placed entirely in the Lord. If you feel overwhelmed, returning to these three — dhikr, Quran, and tawakkul — is the path the verse itself prescribes.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_67_29',
    type: 'Quran',
    primaryText:
      'qul huwa l-raḥmānu āmannā bihi waʿalayhi tawakkalnā fasataʿlamūna man huwa fī ḍalālin mubīnin',
    arabicText:
      'قُلْ هُوَ ٱلرَّحْمَـٰنُ ءَامَنَّا بِهِۦ وَعَلَيْهِ تَوَكَّلْنَا ۖ فَسَتَعْلَمُونَ مَنْ هُوَ فِى ضَلَـٰلٍۢ مُّبِينٍۢ ﴿29﴾',
    transliteration:
      'qul huwa l-raḥmānu āmannā bihi waʿalayhi tawakkalnā fasataʿlamūna man huwa fī ḍalālin mubīnin',
    englishTranslation:
      'Say, "He is the Most Gracious; we believe in Him, and upon Him we put our trust. So you will know who is in clear error."',
    source: 'Surah Al-Mulk 67:29',
    audioKey: '67:29',
    whyThis: 'This verse pairs belief with tawakkul as a single declaration: "we believe in Him, and upon Him we put our trust." The two cannot be separated. Naming Allah as "Al-Rahman" (the Most Gracious) here is deliberate — your trust is placed in the One whose mercy encompasses everything.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_25_58',
    type: 'Quran',
    primaryText:
      'watawakkal ʿalā l-ḥayi alladhī lā yamūtu wasabbiḥ biḥamdihi wakafā bihi bidhunūbi ʿibādihi khabīran',
    arabicText:
      'وَتَوَكَّلْ عَلَى ٱلْحَىِّ ٱلَّذِى لَا يَمُوتُ وَسَبِّحْ بِحَمْدِهِۦ ۚ وَكَفَىٰ بِهِۦ بِذُنُوبِ عِبَادِهِۦ خَبِيرًا ﴿58﴾',
    transliteration:
      'watawakkal ʿalā l-ḥayi alladhī lā yamūtu wasabbiḥ biḥamdihi wakafā bihi bidhunūbi ʿibādihi khabīran',
    englishTranslation:
      'And put your trust in the Ever-Living, the One Who does not die, and glorify with His praise. And sufficient is He, regarding the sins of His slaves, as All-Aware.',
    source: 'Surah Al-Furqan 25:58',
    audioKey: '25:58',
    whyThis: 'Every person you have ever trusted will eventually die. This verse commands you to place your deepest trust in the only One who is Al-Hayy (the Ever-Living) — the One who will never cease to exist, never abandon His promise, and never stop being aware of you and your sins.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_12_90',
    type: 'Quran',
    primaryText:
      "qālū a-innaka la-anta yūsufu qāla anā yūsufu wahādhā akhī qad manna l-lahu ʿalaynā innahu man yattaqi wayaṣbir fa-inna l-laha lā yuḍīʿu ajra l-muḥ'sinīna",
    arabicText:
      'قَالُوٓا۟ أَءِنَّكَ لَأَنتَ يُوسُفُ ۖ قَالَ أَنَا۠ يُوسُفُ وَهَـٰذَآ أَخِى ۖ قَدْ مَنَّ ٱللَّهُ عَلَيْنَآ ۖ إِنَّهُۥ مَن يَتَّقِ وَيَصْبِرْ فَإِنَّ ٱللَّهَ لَا يُضِيعُ أَجْرَ ٱلْمُحْسِنِينَ ﴿90﴾',
    transliteration:
      "qālū a-innaka la-anta yūsufu qāla anā yūsufu wahādhā akhī qad manna l-lahu ʿalaynā innahu man yattaqi wayaṣbir fa-inna l-laha lā yuḍīʿu ajra l-muḥ'sinīna",
    englishTranslation:
      'They said, "Are you indeed Yusuf?" He said, "I am Yusuf, and this is my brother. Indeed, Allah has been gracious to us. Indeed, he who fears Allah and is patient — then indeed, Allah does not allow the reward of the good-doers to be lost."',
    translation:
      'They said, "Are you indeed Yusuf?" He said, "I am Yusuf, and this is my brother. Indeed, Allah has been gracious to us. Indeed, he who fears Allah and is patient — then indeed, Allah does not allow the reward of the good-doers to be lost."',
    source: 'Surah Yusuf 12:90',
    audioKey: '12:90',
    whyThis: 'Yusuf (AS) was thrown into a well, enslaved, and imprisoned — yet decades later he stood as a minister of Egypt and reunited with his family. His own words confirm the principle: taqwa (God-consciousness) plus sabr (patient perseverance) guarantees that nothing of your reward will be lost with Allah.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_8_46',
    type: 'Quran',
    primaryText:
      "wa-aṭīʿū l-laha warasūlahu walā tanāzaʿū fatafshalū watadhhaba rīḥukum wa-iṣ'birū inna l-laha maʿa l-ṣābirīna",
    arabicText:
      'وَأَطِيعُوا۟ ٱللَّهَ وَرَسُولَهُۥ وَلَا تَنَـٰزَعُوا۟ فَتَفْشَلُوا۟ وَتَذْهَبَ رِيحُكُمْ ۖ وَٱصْبِرُوٓا۟ ۚ إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ ﴿46﴾',
    transliteration:
      "wa-aṭīʿū l-laha warasūlahu walā tanāzaʿū fatafshalū watadhhaba rīḥukum wa-iṣ'birū inna l-laha maʿa l-ṣābirīna",
    englishTranslation:
      'And obey Allah and His Messenger, and do not dispute, lest you lose courage and your strength departs. And be patient; indeed, Allah is with the patient ones.',
    source: 'Surah Al-Anfal 8:46',
    audioKey: '8:46',
    whyThis: 'This verse was revealed in the context of battle, but its lesson is universal: internal disputes drain strength more than any external enemy. Unity, obedience, and patience are the foundation of resilience. The promise "Allah is with the patient ones" (ma\'a al-sabireen) is a statement of active divine companionship.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_10_62',
    type: 'Quran',
    primaryText: 'alā inna awliyāa l-lahi lā khawfun ʿalayhim walā hum yaḥzanūna',
    arabicText:
      'أَلَآ إِنَّ أَوْلِيَآءَ ٱللَّهِ لَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ ﴿62﴾',
    transliteration: 'alā inna awliyāa l-lahi lā khawfun ʿalayhim walā hum yaḥzanūna',
    englishTranslation:
      'Unquestionably, for the allies of Allah there will be no fear upon them, nor will they grieve.',
    source: 'Surah Yunus 10:62',
    audioKey: '10:62',
    whyThis: 'The Quran defines "awliya Allah" (allies of Allah) in the very next verse (10:63): those who believe and are mindful of Him. This is not an exclusive rank for saints — it is available to every sincere believer. And the promise is absolute: no fear of the future, no grief over the past.',
    moods: ['Overwhelmed'],
  },

  // === SAD / SABR ===
  {
    id: 'quran_93_3',
    type: 'Quran',
    primaryText: 'mā waddaʿaka rabbuka wamā qalā',
    arabicText: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ ﴿3﴾',
    transliteration: 'mā waddaʿaka rabbuka wamā qalā',
    englishTranslation: 'Your Lord has not forsaken you, nor is He displeased.',
    source: 'Surah Ad-Duha 93:3',
    audioKey: '93:3',
    whyThis: 'The word "wadda\'aka" (forsaken you) uses the past tense, indicating a completed, settled fact — not a conditional. Allah is not saying "I will not forsake you if..."; He is stating it as a permanent truth. Ibn Kathir notes this verse came when the Prophet ﷺ feared Allah had abandoned him, and it reestablished certainty where doubt had crept in. [Tafsir Ibn Kathir, Surah Ad-Duha]',
    moods: ['Sad'],
  },
  {
    id: 'quran_12_87',
    type: 'Quran',
    primaryText:
      "yābaniyya idh'habū fataḥassasū min yūsufa wa-akhīhi walā tāy'asū min rawḥi l-lahi innahu lā yāy'asu min rawḥi l-lahi illā l-qawmu l-kāfirūna",
    arabicText:
      'يَـٰبَنِىَّ ٱذْهَبُوا۟ فَتَحَسَّسُوا۟ مِن يُوسُفَ وَأَخِيهِ وَلَا تَا۟يْـَٔسُوا۟ مِن رَّوْحِ ٱللَّهِ ۖ إِنَّهُۥ لَا يَا۟يْـَٔسُ مِن رَّوْحِ ٱللَّهِ إِلَّا ٱلْقَوْمُ ٱلْكَـٰفِرُونَ ﴿87﴾',
    transliteration:
      "yābaniyya idh'habū fataḥassasū min yūsufa wa-akhīhi walā tāy'asū min rawḥi l-lahi innahu lā yāy'asu min rawḥi l-lahi illā l-qawmu l-kāfirūna",
    englishTranslation:
      'O my sons, go and inquire about Yusuf and his brother, and do not despair of the mercy of Allah. Indeed, none despairs of the mercy of Allah except the disbelieving people.',
    translation:
      'O my sons, go and inquire about Yusuf and his brother, and do not despair of the mercy of Allah. Indeed, none despairs of the mercy of Allah except the disbelieving people.',
    source: 'Surah Yusuf 12:87',
    audioKey: '12:87',
    whyThis: "Yaqub (AS) taught his sons to never lose hope in Allah's mercy.",
    moods: ['Hopeful'],
  },
  {
    id: 'quran_21_83',
    type: 'Quran',
    primaryText: 'wa-ayyūba idh nādā rabbahu annī massaniya l-ḍurru wa-anta arḥamu l-rāḥimīna',
    arabicText: '۞ وَأَيُّوبَ إِذْ نَادَىٰ رَبَّهُۥٓ أَنِّى مَسَّنِىَ ٱلضُّرُّ وَأَنتَ أَرْحَمُ ٱلرَّٰحِمِينَ ﴿83﴾',
    transliteration: 'wa-ayyūba idh nādā rabbahu annī massaniya l-ḍurru wa-anta arḥamu l-rāḥimīna',
    englishTranslation: 'And [mention] Job, when he called to his Lord, "Indeed, adversity has touched me, and You are the Most Merciful of the merciful."',
    translation:
      'And [mention] Job, when he called to his Lord, "Indeed, adversity has touched me, and You are the Most Merciful of the merciful."',
    source: 'Surah Al-Anbiya 21:83',
    audioKey: '21:83',
    whyThis: 'The powerful dua of Ayyub (AS) during his trial.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_2_155',
    type: 'Quran',
    primaryText:
      'walanabluwannakum bishayin mina l-khawfi wal-jūʿi wanaqṣin mina l-amwāli wal-anfusi wal-thamarāti wabashiri l-ṣābirīna alladhīna idhā aṣābathum muṣībatun qālū innā lillahi wa-innā ilayhi rājiʿūna',
    arabicText:
      'وَلَنَبْلُوَنَّكُم بِشَىْءٍۢ مِّنَ ٱلْخَوْفِ وَٱلْجُوعِ وَنَقْصٍۢ مِّنَ ٱلْأَمْوَٰلِ وَٱلْأَنفُسِ وَٱلثَّمَرَٰتِ ۗ وَبَشِّرِ ٱلصَّـٰبِرِينَ ٱلَّذِينَ إِذَآ أَصَـٰبَتْهُم مُّصِيبَةٌۭ قَالُوٓا۟ إِنَّا لِلَّهِ وَإِنَّآ إِلَيْهِ رَٰجِعُونَ ﴿155-156﴾',
    transliteration:
      'walanabluwannakum bishayin mina l-khawfi wal-jūʿi wanaqṣin mina l-amwāli wal-anfusi wal-thamarāti wabashiri l-ṣābirīna alladhīna idhā aṣābathum muṣībatun qālū innā lillahi wa-innā ilayhi rājiʿūna',
    englishTranslation:
      'And We will surely test you with something of fear and hunger and a loss of wealth and lives and fruits, but give good tidings to the patient — those who, when disaster strikes them, say, "Indeed, we belong to Allah, and indeed to Him we will return."',
    source: 'Surah Al-Baqarah 2:155-156',
    audioKey: '2:155-156',
    whyThis: 'Allah does not merely permit hardship — He announces in advance that it will come. This verse transforms suffering from something random into something known and anticipated by Allah. The formula "Inna lillahi wa inna ilayhi raji\'un" is not just a phrase for death; it is the believer\'s response to every calamity. The Prophet ﷺ called it a "consolation" (aza) that no one before this ummah received. [Muslim 918]',
    moods: ['Sad'],
  },
  {
    id: 'quran_57_4',
    type: 'Quran',
    primaryText:
      "huwa alladhī khalaqa l-samāwāti wal-arḍa fī sittati ayyāmin thumma is'tawā ʿalā l-ʿarshi yaʿlamu mā yaliju fī l-arḍi wamā yakhruju min'hā wamā yanzilu mina l-samāi wamā yaʿruju fīhā wahuwa maʿakum ayna mā kuntum wal-lahu bimā taʿmalūna baṣīrun",
    arabicText:
      'هُوَ ٱلَّذِى خَلَقَ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضَ فِى سِتَّةِ أَيَّامٍۢ ثُمَّ ٱسْتَوَىٰ عَلَى ٱلْعَرْشِ ۚ يَعْلَمُ مَا يَلِجُ فِى ٱلْأَرْضِ وَمَا يَخْرُجُ مِنْهَا وَمَا يَنزِلُ مِنَ ٱلسَّمَآءِ وَمَا يَعْرُجُ فِيهَا ۖ وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ ۚ وَٱللَّهُ بِمَا تَعْمَلُونَ بَصِيرٌۭ ﴿4﴾',
    transliteration:
      "huwa alladhī khalaqa l-samāwāti wal-arḍa fī sittati ayyāmin thumma is'tawā ʿalā l-ʿarshi yaʿlamu mā yaliju fī l-arḍi wamā yakhruju min'hā wamā yanzilu mina l-samāi wamā yaʿruju fīhā wahuwa maʿakum ayna mā kuntum wal-lahu bimā taʿmalūna baṣīrun",
    englishTranslation:
      'He is the One Who created the heavens and the earth in six periods, then He rose over the Throne. He knows what penetrates into the earth and what comes forth from it, and what descends from the heaven and what ascends therein. And He is with you wherever you are. And Allah, of what you do, is All-Seeing.',
    source: 'Surah Al-Hadid 57:4',
    audioKey: '57:4',
    whyThis: 'The phrase "He is with you wherever you are" (wa huwa ma\'akum ayna ma kuntum) is one of the most direct statements of divine companionship in the Quran. No matter how isolated or unseen you feel, Allah is present with you — watching, knowing, and aware of every detail of your situation.',
    moods: ['Sad', 'Lonely'],
  },
  {
    id: 'quran_94_5_sad',
    type: 'Quran',
    primaryText: "fa-inna maʿa l-ʿus'ri yus'ran",
    arabicText: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا ﴿5﴾',
    transliteration: "fa-inna maʿa l-ʿus'ri yus'ran",
    englishTranslation: 'So indeed, with the hardship is ease.',
    source: 'Surah Ash-Sharh 94:5',
    audioKey: '94:5',
    whyThis: 'The word "ma\'a" means "with" — not "after." Ease is not waiting at the end of your hardship; it accompanies it, present in the same moment. This is a promise of relief that is already arriving, even when you cannot see it yet.',
    moods: ['Sad'],
  },
  {
    id: 'quran_3_139',
    type: 'Quran',
    primaryText: "walā tahinū walā taḥzanū wa-antumu l-aʿlawna in kuntum mu'minīna",
    arabicText:
      'وَلَا تَهِنُوا۟ وَلَا تَحْزَنُوا۟ وَأَنتُمُ ٱلْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ ﴿139﴾',
    transliteration: "walā tahinū walā taḥzanū wa-antumu l-aʿlawna in kuntum mu'minīna",
    englishTranslation:
      'And do not weaken, and do not grieve, for you will be superior if you are believers.',
    source: 'Surah Ali Imran 3:139',
    audioKey: '3:139',
    whyThis: 'This verse was revealed after the Muslims suffered losses at the Battle of Uhud — a moment of genuine grief and doubt. Allah did not tell them to pretend the pain away; He acknowledged their state and then forbade them from letting it become paralysis. Belief itself is the source of their ultimate elevation.',
    moods: ['Sad'],
  },
  {
    id: 'quran_65_7',
    type: 'Quran',
    primaryText:
      "liyunfiq dhū saʿatin min saʿatihi waman qudira ʿalayhi riz'quhu falyunfiq mimmā ātāhu l-lahu lā yukallifu l-lahu nafsan illā mā ātāhā sayajʿalu l-lahu baʿda ʿus'rin yus'ran",
    arabicText:
      'لِيُنفِقْ ذُو سَعَةٍۢ مِّن سَعَتِهِۦ ۖ وَمَن قُدِرَ عَلَيْهِ رِزْقُهُۥ فَلْيُنفِقْ مِمَّآ ءَاتَىٰهُ ٱللَّهُ ۚ لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا مَآ ءَاتَىٰهَا ۚ سَيَجْعَلُ ٱللَّهُ بَعْدَ عُسْرٍۢ يُسْرًۭا ﴿7﴾',
    transliteration:
      "liyunfiq dhū saʿatin min saʿatihi waman qudira ʿalayhi riz'quhu falyunfiq mimmā ātāhu l-lahu lā yukallifu l-lahu nafsan illā mā ātāhā sayajʿalu l-lahu baʿda ʿus'rin yus'ran",
    englishTranslation:
      'Let the one of ample means spend from his means, and the one whose provision is restricted — let him spend from what Allah has given him. Allah does not burden a soul except with what He has given it. Allah will bring about, after hardship, ease.',
    source: 'Surah At-Talaq 65:7',
    audioKey: '65:7',
    whyThis: 'A divine promise: after every hardship, Allah will certainly bring ease.',
    moods: ['Sad', 'Hopeful'],
  },
  {
    id: 'quran_21_87',
    type: 'Quran',
    primaryText:
      "wadhā l-nūni idh dhahaba mughāḍiban faẓanna an lan naqdira ʿalayhi fanādā fī l-ẓulumāti an lā ilāha illā anta sub'ḥānaka innī kuntu mina l-ẓālimīna",
    arabicText:
      'وَذَا ٱلنُّونِ إِذ ذَّهَبَ مُغَـٰضِبًۭا فَظَنَّ أَن لَّن نَّقْدِرَ عَلَيْهِ فَنَادَىٰ فِى ٱلظُّلُمَـٰتِ أَن لَّآ إِلَـٰهَ إِلَّآ أَنتَ سُبْحَـٰنَكَ إِنِّى كُنتُ مِنَ ٱلظَّـٰلِمِينَ ﴿87﴾',
    transliteration:
      "wadhā l-nūni idh dhahaba mughāḍiban faẓanna an lan naqdira ʿalayhi fanādā fī l-ẓulumāti an lā ilāha illā anta sub'ḥānaka innī kuntu mina l-ẓālimīna",
    englishTranslation:
      'And Dhun-Nun, when he went while angry and thought that We would not decree upon him. Then he called out in the darkness, "There is no god except You; glory be to You. Indeed, I have been of the wrongdoers."',
    translation:
      'And remember the Man of the Fish — Prophet Yunus — when he departed in anger, thinking he would not be held to account. Then, from the depths of darkness, he cried out: "There is no god except You; glory be to You. Indeed, I have been among the wrongdoers."',
    source: 'Surah Al-Anbiya 21:87',
    audioKey: '21:87',
    whyThis: 'The Prophet ﷺ said: "The supplication of Dhun-Nun (Yunus) in the belly of the whale — no Muslim ever calls upon Allah with it in any matter except that Allah responds to them." [Tirmidhi 3505, graded hasan] Acknowledging your own shortcomings before making du\'a is itself a key to answered prayer.',
    moods: ['Sad'],
  },
  {
    id: 'quran_3_8',
    type: 'Quran',
    primaryText:
      'rabbanā lā tuzigh qulūbanā baʿda idh hadaytanā wahab lanā min ladunka raḥmatan innaka anta l-wahābu',
    arabicText:
      'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ ٱلْوَهَّابُ ﴿8﴾',
    transliteration:
      'rabbanā lā tuzigh qulūbanā baʿda idh hadaytanā wahab lanā min ladunka raḥmatan innaka anta l-wahābu',
    englishTranslation:
      'Our Lord, do not let our hearts deviate after You have guided us, and grant us from Yourself mercy. Indeed, You are the Bestower.',
    source: 'Surah Ali Imran 3:8',
    audioKey: '3:8',
    whyThis: 'The Prophet ﷺ would frequently say "Ya Muqallib al-qulub, thabbit qalbi \'ala dinik" (O Turner of hearts, keep my heart firm on Your religion). When asked about it, he said the heart is between the fingers of Allah and He turns it as He wills. [Tirmidhi 3522] This du\'a is the believer\'s acknowledgment that steadfastness itself is a gift from Allah.',
    moods: ['Sad'],
  },
  {
    id: 'quran_40_60',
    type: 'Quran',
    primaryText:
      "waqāla rabbukumu id'ʿūnī astajib lakum inna alladhīna yastakbirūna ʿan ʿibādatī sayadkhulūna jahannama dākhirīna",
    arabicText:
      'وَقَالَ رَبُّكُمُ ٱدْعُونِىٓ أَسْتَجِبْ لَكُمْ ۚ إِنَّ ٱلَّذِينَ يَسْتَكْبِرُونَ عَنْ عِبَادَتِى سَيَدْخُلُونَ جَهَنَّمَ دَاخِرِينَ ﴿60﴾',
    transliteration:
      "waqāla rabbukumu id'ʿūnī astajib lakum inna alladhīna yastakbirūna ʿan ʿibādatī sayadkhulūna jahannama dākhirīna",
    englishTranslation:
      'And your Lord said, "Call upon Me; I will respond to you." Indeed, those who are too proud to worship Me will enter Hell in humiliation.',
    source: 'Surah Ghafir 40:60',
    audioKey: '40:60',
    whyThis: 'Allah directly commands du\'a with an attached promise of response — "ud\'uni astajib lakum" (call upon Me; I will respond). This is not a general encouragement; it is a binding divine statement. The scholars note that the response may come in the form of exactly what was asked, something better, or protection from a harm you did not know was coming. [Tafsir As-Sa\'di, Surah Ghafir]',
    moods: ['Sad', 'Overwhelmed'],
  },
  {
    id: 'quran_39_10',
    type: 'Quran',
    primaryText:
      "qul yāʿibādi alladhīna āmanū ittaqū rabbakum lilladhīna aḥsanū fī hādhihi l-dun'yā ḥasanatun wa-arḍu l-lahi wāsiʿatun innamā yuwaffā l-ṣābirūna ajrahum bighayri ḥisābin",
    arabicText:
      'قُلْ يَـٰعِبَادِ ٱلَّذِينَ ءَامَنُوا۟ ٱتَّقُوا۟ رَبَّكُمْ ۚ لِلَّذِينَ أَحْسَنُوا۟ فِى هَـٰذِهِ ٱلدُّنْيَا حَسَنَةٌۭ ۗ وَأَرْضُ ٱللَّهِ وَٰسِعَةٌ ۗ إِنَّمَا يُوَفَّى ٱلصَّـٰبِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍۢ ﴿10﴾',
    transliteration:
      "qul yāʿibādi alladhīna āmanū ittaqū rabbakum lilladhīna aḥsanū fī hādhihi l-dun'yā ḥasanatun wa-arḍu l-lahi wāsiʿatun innamā yuwaffā l-ṣābirūna ajrahum bighayri ḥisābin",
    englishTranslation:
      'Say, "O My slaves who believe, fear your Lord. For those who do good in this world is good, and the earth of Allah is spacious. Only the patient will be paid their reward without account."',
    source: 'Surah Az-Zumar 39:10',
    audioKey: '39:10',
    whyThis: 'Every other reward in the Quran is described with some measure or scale. But patience is uniquely described as rewarded "without account" (bighayri hisab) — meaning beyond calculation. Ibn Kathir explains this is because the value of sabr is simply too great to be quantified. [Tafsir Ibn Kathir, Surah Az-Zumar]',
    moods: ['Sad'],
  },
  {
    id: 'quran_11_115',
    type: 'Quran',
    primaryText: "wa-iṣ'bir fa-inna l-laha lā yuḍīʿu ajra l-muḥ'sinīna",
    arabicText: 'وَٱصْبِرْ فَإِنَّ ٱللَّهَ لَا يُضِيعُ أَجْرَ ٱلْمُحْسِنِينَ ﴿115﴾',
    transliteration: "wa-iṣ'bir fa-inna l-laha lā yuḍīʿu ajra l-muḥ'sinīna",
    englishTranslation:
      'And be patient, for indeed Allah does not allow the reward of the good-doers to be lost.',
    source: 'Surah Hud 11:115',
    audioKey: '11:115',
    whyThis: 'The word "yudi\'u" means to cause something to be lost or wasted — and Allah is explicitly denying He does this. Every act of goodness, every moment of sabr, every tear shed in private is recorded and preserved. Nothing you have done in sincerity will be forgotten.',
    moods: ['Sad'],
  },
  {
    id: 'quran_39_53',
    type: 'Quran',
    primaryText:
      'qul yāʿibādiya alladhīna asrafū ʿalā anfusihim lā taqnaṭū min raḥmati l-lahi inna l-laha yaghfiru l-dhunūba jamīʿan innahu huwa l-ghafūru l-raḥīmu wa-anībū ilā rabbikum wa-aslimū lahu min qabli an yatiyakumu l-ʿadhābu thumma lā tunṣarūna',
    arabicText:
      '۞ قُلْ يَـٰعِبَادِىَ ٱلَّذِينَ أَسْرَفُوا۟ عَلَىٰٓ أَنفُسِهِمْ لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ ۚ إِنَّ ٱللَّهَ يَغْفِرُ ٱلذُّنُوبَ جَمِيعًا ۚ إِنَّهُۥ هُوَ ٱلْغَفُورُ ٱلرَّحِيمُ وَأَنِيبُوٓا۟ إِلَىٰ رَبِّكُمْ وَأَسْلِمُوا۟ لَهُۥ مِن قَبْلِ أَن يَأْتِيَكُمُ ٱلْعَذَابُ ثُمَّ لَا تُنصَرُونَ ﴿53-54﴾',
    transliteration:
      'qul yāʿibādiya alladhīna asrafū ʿalā anfusihim lā taqnaṭū min raḥmati l-lahi inna l-laha yaghfiru l-dhunūba jamīʿan innahu huwa l-ghafūru l-raḥīmu wa-anībū ilā rabbikum wa-aslimū lahu min qabli an yatiyakumu l-ʿadhābu thumma lā tunṣarūna',
    englishTranslation:
      'Say, "O My slaves who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins. Indeed, He is the Oft-Forgiving, the Most Merciful." And turn to your Lord and submit to Him before the punishment comes upon you; then you will not be helped.',
    source: 'Surah Az-Zumar 39:53-54',
    audioKey: '39:53-54',
    whyThis: 'Ibn Abbas (RA) said this is the most hope-giving verse in the entire Quran. Allah addresses those who have "transgressed against themselves" — not minor sinners, but those who believe their sins are too great. The response is an unconditional declaration: "Indeed, Allah forgives all sins." No exception is listed. [Tafsir Ibn Kathir, Surah Az-Zumar]',
    moods: ['Sad'],
  },

  // === ANGRY / IHSAN ===
  {
    id: 'quran_3_134',
    type: 'Quran',
    primaryText:
      "alladhīna yunfiqūna fī l-sarāi wal-ḍarāi wal-kāẓimīna l-ghayẓa wal-ʿāfīna ʿani l-nāsi wal-lahu yuḥibbu l-muḥ'sinīna",
    arabicText:
      'ٱلَّذِينَ يُنفِقُونَ فِى ٱلسَّرَّآءِ وَٱلضَّرَّآءِ وَٱلْكَـٰظِمِينَ ٱلْغَيْظَ وَٱلْعَافِينَ عَنِ ٱلنَّاسِ ۗ وَٱللَّهُ يُحِبُّ ٱلْمُحْسِنِينَ ﴿134﴾',
    transliteration:
      "alladhīna yunfiqūna fī l-sarāi wal-ḍarāi wal-kāẓimīna l-ghayẓa wal-ʿāfīna ʿani l-nāsi wal-lahu yuḥibbu l-muḥ'sinīna",
    englishTranslation:
      'Those who spend in ease and hardship, and who restrain their anger and pardon the people — and Allah loves the good-doers.',
    source: 'Surah Ali Imran 3:134',
    audioKey: '3:134',
    whyThis: 'The word "kadhimeen" (those who restrain anger) implies swallowing anger rather than venting it — an active, effortful act. The Prophet ﷺ said: "The strong person is not the one who can overpower others; the strong person is the one who controls themselves when angry." [Bukhari 6114] Allah loving the muhsineen (good-doers) is the reward for that strength.',
    moods: ['Angry'],
  },
  {
    id: 'quran_41_34',
    type: 'Quran',
    primaryText:
      "walā tastawī l-ḥasanatu walā l-sayi-atu id'faʿ bi-allatī hiya aḥsanu fa-idhā alladhī baynaka wabaynahu ʿadāwatun ka-annahu waliyyun ḥamīmun",
    arabicText:
      'وَلَا تَسْتَوِى ٱلْحَسَنَةُ وَلَا ٱلسَّيِّئَةُ ۚ ٱدْفَعْ بِٱلَّتِى هِىَ أَحْسَنُ فَإِذَا ٱلَّذِى بَيْنَكَ وَبَيْنَهُۥ عَدَٰوَةٌۭ كَأَنَّهُۥ وَلِىٌّ حَمِيمٌۭ ﴿34﴾',
    transliteration:
      "walā tastawī l-ḥasanatu walā l-sayi-atu id'faʿ bi-allatī hiya aḥsanu fa-idhā alladhī baynaka wabaynahu ʿadāwatun ka-annahu waliyyun ḥamīmun",
    englishTranslation:
      'Not equal are the good deed and the bad deed. Repel evil by that which is better, and thereupon the one between whom and you there was enmity will become as though he was a devoted friend.',
    source: 'Surah Fussilat 41:34',
    audioKey: '41:34',
    whyThis: 'The Quran here promises a remarkable transformation: responding to enmity with excellence (ihsan) can turn an enemy into "ka-annahu waliyyun hameem" — as if he were a close, devoted friend. This is not wishful thinking; it is a divine observation about human nature and the power of consistent goodness to disarm hostility.',
    moods: ['Angry'],
  },
  {
    id: 'quran_7_199',
    type: 'Quran',
    primaryText: "khudhi l-ʿafwa wamur bil-ʿur'fi wa-aʿriḍ ʿani l-jāhilīna",
    arabicText: 'خُذِ ٱلْعَفْوَ وَأْمُرْ بِٱلْعُرْفِ وَأَعْرِضْ عَنِ ٱلْجَـٰهِلِينَ ﴿199﴾',
    transliteration: "khudhi l-ʿafwa wamur bil-ʿur'fi wa-aʿriḍ ʿani l-jāhilīna",
    englishTranslation: 'Hold to forgiveness, enjoin what is good, and turn away from the ignorant.',
    source: "Surah Al-A'raf 7:199",
    audioKey: '7:199',
    whyThis: 'This verse was revealed to the Prophet ﷺ as a character guideline for dealing with people. "Khudh al-\'afw" means adopt a habit of pardoning easily, not grudgingly. Turning away from the ignorant ("a\'rid \'ani l-jahileen") is not passive avoidance — it is a dignified refusal to descend to the level of provocation.',
    moods: ['Angry'],
  },
  {
    id: 'quran_42_37',
    type: 'Quran',
    primaryText:
      "wa-alladhīna yajtanibūna kabāira l-ith'mi wal-fawāḥisha wa-idhā mā ghaḍibū hum yaghfirūna",
    arabicText:
      'وَٱلَّذِينَ يَجْتَنِبُونَ كَبَـٰٓئِرَ ٱلْإِثْمِ وَٱلْفَوَٰحِشَ وَإِذَا مَا غَضِبُوا۟ هُمْ يَغْفِرُونَ ﴿37﴾',
    transliteration:
      "wa-alladhīna yajtanibūna kabāira l-ith'mi wal-fawāḥisha wa-idhā mā ghaḍibū hum yaghfirūna",
    englishTranslation:
      'And those who avoid the greater sins and immoralities, and when they are angry, they forgive.',
    source: 'Surah Ash-Shura 42:37',
    audioKey: '42:37',
    whyThis: 'Forgiving when angry is a distinguishing trait of the believers.',
    moods: ['Angry'],
  },
  {
    id: 'quran_42_43',
    type: 'Quran',
    primaryText: 'walaman ṣabara waghafara inna dhālika lamin ʿazmi l-umūri',
    arabicText: 'وَلَمَن صَبَرَ وَغَفَرَ إِنَّ ذَٰلِكَ لَمِنْ عَزْمِ ٱلْأُمُورِ ﴿43﴾',
    transliteration: 'walaman ṣabara waghafara inna dhālika lamin ʿazmi l-umūri',
    englishTranslation:
      'And whoever is patient and forgives — indeed, that is surely of the matters requiring determination.',
    source: 'Surah Ash-Shura 42:43',
    audioKey: '42:43',
    whyThis: 'The Quran acknowledges that "azm al-umur" (matters of true determination) are rare and difficult. Forgiving when you have the right to retaliate is placed in this category — above mere patience alone. It is one of the highest spiritual acts, and one of the hardest for the nafs to accept.',
    moods: ['Angry'],
  },
  {
    id: 'quran_3_159',
    type: 'Quran',
    primaryText:
      "fabimā raḥmatin mina l-lahi linta lahum walaw kunta faẓẓan ghalīẓa l-qalbi la-infaḍḍū min ḥawlika fa-uʿ'fu ʿanhum wa-is'taghfir lahum washāwir'hum fī l-amri fa-idhā ʿazamta fatawakkal ʿalā l-lahi inna l-laha yuḥibbu l-mutawakilīna",
    arabicText:
      'فَبِمَا رَحْمَةٍۢ مِّنَ ٱللَّهِ لِنتَ لَهُمْ ۖ وَلَوْ كُنتَ فَظًّا غَلِيظَ ٱلْقَلْبِ لَٱنفَضُّوا۟ مِنْ حَوْلِكَ ۖ فَٱعْفُ عَنْهُمْ وَٱسْتَغْفِرْ لَهُمْ وَشَاوِرْهُمْ فِى ٱلْأَمْرِ ۖ فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى ٱللَّهِ ۚ إِنَّ ٱللَّهَ يُحِبُّ ٱلْمُتَوَكِّلِينَ ﴿159﴾',
    transliteration:
      "fabimā raḥmatin mina l-lahi linta lahum walaw kunta faẓẓan ghalīẓa l-qalbi la-infaḍḍū min ḥawlika fa-uʿ'fu ʿanhum wa-is'taghfir lahum washāwir'hum fī l-amri fa-idhā ʿazamta fatawakkal ʿalā l-lahi inna l-laha yuḥibbu l-mutawakilīna",
    englishTranslation:
      'So by mercy from Allah, you dealt gently with them. And if you had been rude and harsh in heart, they would have dispersed from around you. So pardon them, ask forgiveness for them, and consult them in the matter. Then when you have decided, put your trust in Allah. Indeed, Allah loves those who put their trust in Him.',
    source: 'Surah Ali Imran 3:159',
    audioKey: '3:159',
    whyThis: 'This verse was revealed after the Battle of Uhud — when some companions had disobeyed the Prophet\'s ﷺ command and caused military disaster. Even then, the Prophet ﷺ was instructed to pardon, seek forgiveness for them, and consult them. Gentleness and forgiveness are not weakness; they are what holds communities together.',
    moods: ['Angry'],
  },
  {
    id: 'quran_24_22',
    type: 'Quran',
    primaryText:
      "walā yatali ulū l-faḍli minkum wal-saʿati an yu'tū ulī l-qur'bā wal-masākīna wal-muhājirīna fī sabīli l-lahi walyaʿfū walyaṣfaḥū alā tuḥibbūna an yaghfira l-lahu lakum wal-lahu ghafūrun raḥīmun",
    arabicText:
      'وَلَا يَأْتَلِ أُو۟لُوا۟ ٱلْفَضْلِ مِنكُمْ وَٱلسَّعَةِ أَن يُؤْتُوٓا۟ أُو۟لِى ٱلْقُرْبَىٰ وَٱلْمَسَـٰكِينَ وَٱلْمُهَـٰجِرِينَ فِى سَبِيلِ ٱللَّهِ ۖ وَلْيَعْفُوا۟ وَلْيَصْفَحُوٓا۟ ۗ أَلَا تُحِبُّونَ أَن يَغْفِرَ ٱللَّهُ لَكُمْ ۗ وَٱللَّهُ غَفُورٌۭ رَّحِيمٌ ﴿22﴾',
    transliteration:
      "walā yatali ulū l-faḍli minkum wal-saʿati an yu'tū ulī l-qur'bā wal-masākīna wal-muhājirīna fī sabīli l-lahi walyaʿfū walyaṣfaḥū alā tuḥibbūna an yaghfira l-lahu lakum wal-lahu ghafūrun raḥīmun",
    englishTranslation:
      'And let not those of virtue among you and wealth swear not to give to their relatives, the needy, and the emigrants in the cause of Allah. Let them pardon and overlook. Would you not like that Allah should forgive you? And Allah is Oft-Forgiving, Most Merciful.',
    translation:
      'Those among you who have been blessed with wealth and goodness should not swear to stop helping their relatives, the poor, and those who sacrificed for Allah\'s cause. Rather, forgive and let it go. Would you not love for Allah to forgive you? And Allah is Oft-Forgiving, Most Merciful.',
    source: 'Surah An-Nur 24:22',
    audioKey: '24:22',
    whyThis: 'This verse was revealed about Abu Bakr (RA), who swore to stop financially supporting a relative after that person had spread slander against his daughter Aisha (RA). Allah\'s response was to ask: "Would you not love for Allah to forgive you?" The question is rhetorical — and personal. Forgiving those who wrong us unlocks Allah\'s forgiveness for us.',
    moods: ['Angry', 'Sad'],
  },
  {
    id: 'quran_16_126',
    type: 'Quran',
    primaryText:
      "wa-in ʿāqabtum faʿāqibū bimith'li mā ʿūqib'tum bihi wala-in ṣabartum lahuwa khayrun lilṣṣābirīna",
    arabicText:
      'وَإِنْ عَاقَبْتُمْ فَعَاقِبُوا۟ بِمِثْلِ مَا عُوقِبْتُم بِهِۦ ۖ وَلَئِن صَبَرْتُمْ لَهُوَ خَيْرٌۭ لِّلصَّـٰبِرِينَ ﴿126﴾',
    transliteration:
      "wa-in ʿāqabtum faʿāqibū bimith'li mā ʿūqib'tum bihi wala-in ṣabartum lahuwa khayrun lilṣṣābirīna",
    englishTranslation:
      'And if you punish, punish with an equivalent of what you were harmed with. But if you are patient, it is surely better for the patient.',
    source: 'Surah An-Nahl 16:126',
    audioKey: '16:126',
    whyThis: 'Patience is always the better choice for those who can practice it.',
    moods: ['Angry'],
  },
  {
    id: 'quran_5_13',
    type: 'Quran',
    primaryText:
      "fabimā naqḍihim mīthāqahum laʿannāhum wajaʿalnā qulūbahum qāsiyatan yuḥarrifūna l-kalima ʿan mawāḍiʿihi wanasū ḥaẓẓan mimmā dhukkirū bihi walā tazālu taṭṭaliʿu ʿalā khāinatin min'hum illā qalīlan min'hum fa-uʿ'fu ʿanhum wa-iṣ'faḥ inna l-laha yuḥibbu l-muḥ'sinīna",
    arabicText:
      'فَبِمَا نَقْضِهِم مِّيثَـٰقَهُمْ لَعَنَّـٰهُمْ وَجَعَلْنَا قُلُوبَهُمْ قَـٰسِيَةًۭ ۖ يُحَرِّفُونَ ٱلْكَلِمَ عَن مَّوَاضِعِهِۦ ۙ وَنَسُوا۟ حَظًّۭا مِّمَّا ذُكِّرُوا۟ بِهِۦ ۚ وَلَا تَزَالُ تَطَّلِعُ عَلَىٰ خَآئِنَةٍۢ مِّنْهُمْ إِلَّا قَلِيلًۭا مِّنْهُمْ ۖ فَٱعْفُ عَنْهُمْ وَٱصْفَحْ ۚ إِنَّ ٱللَّهَ يُحِبُّ ٱلْمُحْسِنِينَ ﴿13﴾',
    transliteration:
      "fabimā naqḍihim mīthāqahum laʿannāhum wajaʿalnā qulūbahum qāsiyatan yuḥarrifūna l-kalima ʿan mawāḍiʿihi wanasū ḥaẓẓan mimmā dhukkirū bihi walā tazālu taṭṭaliʿu ʿalā khāinatin min'hum illā qalīlan min'hum fa-uʿ'fu ʿanhum wa-iṣ'faḥ inna l-laha yuḥibbu l-muḥ'sinīna",
    englishTranslation:
      'So for their breaking of the covenant, We cursed them and made their hearts hard. They distort words from their places and forgot a part of what they were reminded of. And you will still observe treachery from them, except a few. But forgive them and overlook. Indeed, Allah loves the good-doers.',
    translation:
      'Because certain people among the Children of Israel broke their covenant with Allah, their hearts became hardened. They twisted the words of scripture, and forgot much of what they were taught. You will still see betrayal from many of them — but forgive them, and let it go. Indeed, Allah loves those who do good.',
    source: 'Surah Al-Maidah 5:13',
    audioKey: '5:13',
    whyThis: 'Pardoning and overlooking makes you among those Allah loves.',
    moods: ['Angry'],
  },
  {
    id: 'quran_64_14',
    type: 'Quran',
    primaryText:
      "yāayyuhā alladhīna āmanū inna min azwājikum wa-awlādikum ʿaduwwan lakum fa-iḥ'dharūhum wa-in taʿfū wataṣfaḥū wataghfirū fa-inna l-laha ghafūrun raḥīmun",
    arabicText:
      'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ إِنَّ مِنْ أَزْوَٰجِكُمْ وَأَوْلَـٰدِكُمْ عَدُوًّۭا لَّكُمْ فَٱحْذَرُوهُمْ ۚ وَإِن تَعْفُوا۟ وَتَصْفَحُوا۟ وَتَغْفِرُوا۟ فَإِنَّ ٱللَّهَ غَفُورٌۭ رَّحِيمٌ ﴿14﴾',
    transliteration:
      "yāayyuhā alladhīna āmanū inna min azwājikum wa-awlādikum ʿaduwwan lakum fa-iḥ'dharūhum wa-in taʿfū wataṣfaḥū wataghfirū fa-inna l-laha ghafūrun raḥīmun",
    englishTranslation:
      'O you who believe, indeed among your spouses and your children are enemies to you, so beware of them. But if you pardon, overlook, and forgive, then indeed Allah is Oft-Forgiving, Most Merciful.',
    source: 'Surah At-Taghabun 64:14',
    audioKey: '64:14',
    whyThis: 'This verse addresses a painful reality: sometimes the source of anger and hurt is the people closest to us. The command to pardon, overlook, and forgive is immediately followed by a reminder of Allah\'s own forgiveness — connecting our act of forgiving others to receiving Allah\'s forgiveness for ourselves.',
    moods: ['Angry'],
  },
  {
    id: 'quran_4_149',
    type: 'Quran',
    primaryText:
      "in tub'dū khayran aw tukh'fūhu aw taʿfū ʿan sūin fa-inna l-laha kāna ʿafuwwan qadīran",
    arabicText:
      'إِن تُبْدُوا۟ خَيْرًا أَوْ تُخْفُوهُ أَوْ تَعْفُوا۟ عَن سُوٓءٍۢ فَإِنَّ ٱللَّهَ كَانَ عَفُوًّۭا قَدِيرًا ﴿149﴾',
    transliteration:
      "in tub'dū khayran aw tukh'fūhu aw taʿfū ʿan sūin fa-inna l-laha kāna ʿafuwwan qadīran",
    englishTranslation:
      'If you show a good deed or conceal it, or pardon an offense, then indeed Allah is Oft-Pardoning, All-Powerful.',
    source: 'Surah An-Nisa 4:149',
    audioKey: '4:149',
    whyThis: 'The verse ends with two of Allah\'s names: "Afuwwan" (Oft-Pardoning) and "Qadira" (All-Powerful). Allah is not forgiving because He lacks the power to punish — He is forgiving despite having all power. When we pardon others, we imitate one of His attributes, and He responds with His own pardon toward us.',
    moods: ['Angry'],
  },
  {
    id: 'quran_45_14',
    type: 'Quran',
    primaryText:
      'qul lilladhīna āmanū yaghfirū lilladhīna lā yarjūna ayyāma l-lahi liyajziya qawman bimā kānū yaksibūna',
    arabicText:
      'قُل لِّلَّذِينَ ءَامَنُوا۟ يَغْفِرُوا۟ لِلَّذِينَ لَا يَرْجُونَ أَيَّامَ ٱللَّهِ لِيَجْزِىَ قَوْمًۢا بِمَا كَانُوا۟ يَكْسِبُونَ ﴿14﴾',
    transliteration:
      'qul lilladhīna āmanū yaghfirū lilladhīna lā yarjūna ayyāma l-lahi liyajziya qawman bimā kānū yaksibūna',
    englishTranslation:
      'Say to those who believe to forgive those who do not hope for the days of Allah, that He may recompense a people for what they used to earn.',
    translation:
      'Tell the believers: forgive those who do not fear the consequences of their actions before Allah — so that He may repay each group for what they have earned. Leave justice to Him.',
    source: 'Surah Al-Jathiyah 45:14',
    audioKey: '45:14',
    whyThis: 'This verse instructs believers to forgive those who do not fear the consequences of their actions — people who wrong others without accountability. The reason given is that Allah Himself will repay each group for what they earned. Forgiving is not letting injustice go unanswered; it is leaving the answer to Allah.',
    moods: ['Angry'],
  },

  // === GUILTY / TAWBAH ===
  {
    id: 'quran_4_110',
    type: 'Quran',
    primaryText:
      'waman yaʿmal sūan aw yaẓlim nafsahu thumma yastaghfiri l-laha yajidi l-laha ghafūran raḥīman',
    arabicText:
      'وَمَن يَعْمَلْ سُوٓءًا أَوْ يَظْلِمْ نَفْسَهُۥ ثُمَّ يَسْتَغْفِرِ ٱللَّهَ يَجِدِ ٱللَّهَ غَفُورًۭا رَّحِيمًۭا ﴿110﴾',
    transliteration:
      'waman yaʿmal sūan aw yaẓlim nafsahu thumma yastaghfiri l-laha yajidi l-laha ghafūran raḥīman',
    englishTranslation:
      'And whoever does evil or wrongs himself, then seeks forgiveness of Allah, will find Allah Oft-Forgiving, Most Merciful.',
    source: 'Surah An-Nisa 4:110',
    audioKey: '4:110',
    whyThis: 'Seeking forgiveness guarantees finding it.',
    moods: ['Guilty'],
  },
  {
    id: 'quran_25_70',
    type: 'Quran',
    primaryText:
      'illā man tāba waāmana waʿamila ʿamalan ṣāliḥan fa-ulāika yubaddilu l-lahu sayyiātihim ḥasanātin wakāna l-lahu ghafūran raḥīman',
    arabicText:
      'إِلَّا مَن تَابَ وَءَامَنَ وَعَمِلَ عَمَلًۭا صَـٰلِحًۭا فَأُو۟لَـٰٓئِكَ يُبَدِّلُ ٱللَّهُ سَيِّـَٔاتِهِمْ حَسَنَـٰتٍۢ ۗ وَكَانَ ٱللَّهُ غَفُورًۭا رَّحِيمًۭا ﴿70﴾',
    transliteration:
      'illā man tāba waāmana waʿamila ʿamalan ṣāliḥan fa-ulāika yubaddilu l-lahu sayyiātihim ḥasanātin wakāna l-lahu ghafūran raḥīman',
    englishTranslation:
      'Except those who repent, believe, and do righteous deeds — for those, Allah will replace their evil deeds with good ones. And Allah is Oft-Forgiving, Most Merciful.',
    translation:
      'But those who sincerely repent, renew their faith, and follow it up with good deeds — for them, Allah will transform their past sins into good deeds on their record. And ever is Allah Oft-Forgiving, Most Merciful.',
    source: 'Surah Al-Furqan 25:70',
    audioKey: '25:70',
    whyThis: "True repentance doesn't just erase sins - it transforms them into good deeds.",
    moods: ['Guilty'],
  },
  {
    id: 'quran_3_135',
    type: 'Quran',
    primaryText:
      "wa-alladhīna idhā faʿalū fāḥishatan aw ẓalamū anfusahum dhakarū l-laha fa-is'taghfarū lidhunūbihim waman yaghfiru l-dhunūba illā l-lahu walam yuṣirrū ʿalā mā faʿalū wahum yaʿlamūna",
    arabicText:
      'وَٱلَّذِينَ إِذَا فَعَلُوا۟ فَـٰحِشَةً أَوْ ظَلَمُوٓا۟ أَنفُسَهُمْ ذَكَرُوا۟ ٱللَّهَ فَٱسْتَغْفَرُوا۟ لِذُنُوبِهِمْ وَمَن يَغْفِرُ ٱلذُّنُوبَ إِلَّا ٱللَّهُ وَلَمْ يُصِرُّوا۟ عَلَىٰ مَا فَعَلُوا۟ وَهُمْ يَعْلَمُونَ ﴿135﴾',
    transliteration:
      "wa-alladhīna idhā faʿalū fāḥishatan aw ẓalamū anfusahum dhakarū l-laha fa-is'taghfarū lidhunūbihim waman yaghfiru l-dhunūba illā l-lahu walam yuṣirrū ʿalā mā faʿalū wahum yaʿlamūna",
    englishTranslation:
      'And those who, when they commit an immorality or wrong themselves, remember Allah and seek forgiveness for their sins — and who can forgive sins except Allah? — and do not persist in what they did while they know.',
    source: 'Surah Ali Imran 3:135',
    audioKey: '3:135',
    whyThis: 'This verse describes the people of taqwa — and it describes them not as people who never sin, but as people who, when they sin, immediately remember Allah and seek forgiveness. The key criterion is not sinlessness; it is not persisting. Repentance itself is part of what makes a righteous believer.',
    moods: ['Guilty'],
  },
  {
    id: 'quran_66_8',
    type: 'Quran',
    primaryText:
      "yāayyuhā alladhīna āmanū tūbū ilā l-lahi tawbatan naṣūḥan ʿasā rabbukum an yukaffira ʿankum sayyiātikum wayud'khilakum jannātin tajrī min taḥtihā l-anhāru yawma lā yukh'zī l-lahu l-nabiya wa-alladhīna āmanū maʿahu nūruhum yasʿā bayna aydīhim wabi-aymānihim yaqūlūna rabbanā atmim lanā nūranā wa-igh'fir lanā innaka ʿalā kulli shayin qadīrun",
    arabicText:
      'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ تُوبُوٓا۟ إِلَى ٱللَّهِ تَوْبَةًۭ نَّصُوحًا عَسَىٰ رَبُّكُمْ أَن يُكَفِّرَ عَنكُمْ سَيِّـَٔاتِكُمْ وَيُدْخِلَكُمْ جَنَّـٰتٍۢ تَجْرِى مِن تَحْتِهَا ٱلْأَنْهَـٰرُ يَوْمَ لَا يُخْزِى ٱللَّهُ ٱلنَّبِىَّ وَٱلَّذِينَ ءَامَنُوا۟ مَعَهُۥ ۖ نُورُهُمْ يَسْعَىٰ بَيْنَ أَيْدِيهِمْ وَبِأَيْمَـٰنِهِمْ يَقُولُونَ رَبَّنَآ أَتْمِمْ لَنَا نُورَنَا وَٱغْفِرْ لَنَآ ۖ إِنَّكَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌۭ ﴿8﴾',
    transliteration:
      "yāayyuhā alladhīna āmanū tūbū ilā l-lahi tawbatan naṣūḥan ʿasā rabbukum an yukaffira ʿankum sayyiātikum wayud'khilakum jannātin tajrī min taḥtihā l-anhāru yawma lā yukh'zī l-lahu l-nabiya wa-alladhīna āmanū maʿahu nūruhum yasʿā bayna aydīhim wabi-aymānihim yaqūlūna rabbanā atmim lanā nūranā wa-igh'fir lanā innaka ʿalā kulli shayin qadīrun",
    englishTranslation:
      'O you who believe, turn to Allah in sincere repentance. Perhaps your Lord will remove from you your evil deeds and admit you into Gardens beneath which rivers flow, on the Day when Allah will not disgrace the Prophet and those who believed with him. Their light will proceed before them and on their right. They will say, "Our Lord, perfect for us our light and grant us forgiveness. Indeed, You are over all things All-Powerful."',
    source: 'Surah At-Tahrim 66:8',
    audioKey: '66:8',
    whyThis: 'Allah calls believers to sincere repentance as a path to success.',
    moods: ['Guilty'],
  },

  // === GRATEFUL / SHUKR ===
  {
    id: 'quran_14_7',
    type: 'Quran',
    primaryText:
      'wa-idh ta-adhana rabbukum la-in shakartum la-azīdannakum wala-in kafartum inna ʿadhābī lashadīdun',
    arabicText:
      'وَإِذْ تَأَذَّنَ رَبُّكُمْ لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ ۖ وَلَئِن كَفَرْتُمْ إِنَّ عَذَابِى لَشَدِيدٌۭ ﴿7﴾',
    transliteration:
      'wa-idh ta-adhana rabbukum la-in shakartum la-azīdannakum wala-in kafartum inna ʿadhābī lashadīdun',
    englishTranslation:
      'And when your Lord proclaimed, "If you are thankful, I will surely increase you; but if you are ungrateful, indeed My punishment is surely severe."',
    source: 'Surah Ibrahim 14:7',
    audioKey: '14:7',
    whyThis: 'This is a divine guarantee, not a suggestion: gratitude is a mechanism for increase. The word "la-azidannakum" uses the lam of emphasis and the nun of emphasis together — meaning Allah is absolutely, certainly guaranteeing the increase. Gratitude is not just a feeling; it is a lever for more blessings from Allah.',
    moods: ['Grateful', 'Hopeful'],
  },
  {
    id: 'quran_16_18',
    type: 'Quran',
    primaryText: "wa-in taʿuddū niʿ'mata l-lahi lā tuḥ'ṣūhā inna l-laha laghafūrun raḥīmun",
    arabicText:
      'وَإِن تَعُدُّوا۟ نِعْمَةَ ٱللَّهِ لَا تُحْصُوهَآ ۗ إِنَّ ٱللَّهَ لَغَفُورٌۭ رَّحِيمٌۭ ﴿18﴾',
    transliteration: "wa-in taʿuddū niʿ'mata l-lahi lā tuḥ'ṣūhā inna l-laha laghafūrun raḥīmun",
    englishTranslation:
      'And if you should count the favors of Allah, you could not enumerate them. Indeed, Allah is Oft-Forgiving, Most Merciful.',
    source: 'Surah An-Nahl 16:18',
    audioKey: '16:18',
    whyThis: 'The same statement appears in Surah Ibrahim (14:34) in a context of human ingratitude. Here it is followed by Allah\'s names: Oft-Forgiving and Most Merciful — because even in our inability to fully acknowledge His blessings, He is forgiving. Gratitude does not have to be perfect; it simply has to be sincere.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_31_12',
    type: 'Quran',
    primaryText:
      "walaqad ātaynā luq'māna l-ḥik'mata ani ush'kur lillahi waman yashkur fa-innamā yashkuru linafsihi waman kafara fa-inna l-laha ghaniyyun ḥamīdun",
    arabicText:
      'وَلَقَدْ ءَاتَيْنَا لُقْمَـٰنَ ٱلْحِكْمَةَ أَنِ ٱشْكُرْ لِلَّهِ ۚ وَمَن يَشْكُرْ فَإِنَّمَا يَشْكُرُ لِنَفْسِهِۦ ۖ وَمَن كَفَرَ فَإِنَّ ٱللَّهَ غَنِىٌّ حَمِيدٌۭ ﴿12﴾',
    transliteration:
      "walaqad ātaynā luq'māna l-ḥik'mata ani ush'kur lillahi waman yashkur fa-innamā yashkuru linafsihi waman kafara fa-inna l-laha ghaniyyun ḥamīdun",
    englishTranslation:
      'And We certainly gave Luqman wisdom, saying, "Be grateful to Allah." And whoever is grateful is grateful for himself. And whoever is ungrateful, then indeed Allah is Free of need, Praiseworthy.',
    translation:
      'And We certainly gave Luqman wisdom, saying, "Be grateful to Allah." And whoever is grateful is grateful for himself. And whoever is ungrateful, then indeed Allah is Free of need, Praiseworthy.',
    source: 'Surah Luqman 31:12',
    audioKey: '31:12',
    whyThis: 'Wisdom and gratitude go hand in hand - gratitude benefits the one who expresses it.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_27_40',
    type: 'Quran',
    primaryText:
      "qāla alladhī ʿindahu ʿil'mun mina l-kitābi anā ātīka bihi qabla an yartadda ilayka ṭarfuka falammā raāhu mus'taqirran ʿindahu qāla hādhā min faḍli rabbī liyabluwanī a-ashkuru am akfuru waman shakara fa-innamā yashkuru linafsihi waman kafara fa-inna rabbī ghaniyyun karīmun",
    arabicText:
      'قَالَ ٱلَّذِى عِندَهُۥ عِلْمٌۭ مِّنَ ٱلْكِتَـٰبِ أَنَا۠ ءَاتِيكَ بِهِۦ قَبْلَ أَن يَرْتَدَّ إِلَيْكَ طَرْفُكَ ۚ فَلَمَّا رَءَاهُ مُسْتَقِرًّا عِندَهُۥ قَالَ هَـٰذَا مِن فَضْلِ رَبِّى لِيَبْلُوَنِىٓ ءَأَشْكُرُ أَمْ أَكْفُرُ ۖ وَمَن شَكَرَ فَإِنَّمَا يَشْكُرُ لِنَفْسِهِۦ ۖ وَمَن كَفَرَ فَإِنَّ رَبِّى غَنِىٌّۭ كَرِيمٌۭ ﴿40﴾',
    transliteration:
      "qāla alladhī ʿindahu ʿil'mun mina l-kitābi anā ātīka bihi qabla an yartadda ilayka ṭarfuka falammā raāhu mus'taqirran ʿindahu qāla hādhā min faḍli rabbī liyabluwanī a-ashkuru am akfuru waman shakara fa-innamā yashkuru linafsihi waman kafara fa-inna rabbī ghaniyyun karīmun",
    englishTranslation:
      'One who had knowledge from the Scripture said, "I will bring it to you before your glance returns to you." And when he saw it placed before him, he said, "This is from the favor of my Lord, to test me whether I am grateful or ungrateful. And whoever is grateful — it is only for his own soul. And whoever is ungrateful, then indeed my Lord is Self-sufficient, Noble."',
    translation:
      'One who had knowledge from the Scripture said, "I will bring it to you before your glance returns to you." And when he saw it placed before him, he said, "This is from the favour of my Lord, to test me whether I will be grateful or ungrateful. And whoever is grateful — it is only for his own soul. And whoever is ungrateful, then indeed my Lord is Self-sufficient, Most Generous."',
    source: 'Surah An-Naml 27:40',
    audioKey: '27:40',
    whyThis: 'Sulaiman (AS) recognized that blessings are tests of gratitude.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_34_13',
    type: 'Quran',
    primaryText:
      "yaʿmalūna lahu mā yashāu min maḥārība watamāthīla wajifānin kal-jawābi waqudūrin rāsiyātin iʿ'malū āla dāwūda shuk'ran waqalīlun min ʿibādiya l-shakūru",
    arabicText:
      'يَعْمَلُونَ لَهُۥ مَا يَشَآءُ مِن مَّحَـٰرِيبَ وَتَمَـٰثِيلَ وَجِفَانٍۢ كَٱلْجَوَابِ وَقُدُورٍۢ رَّاسِيَـٰتٍ ۚ ٱعْمَلُوٓا۟ ءَالَ دَاوُۥدَ شُكْرًۭا ۚ وَقَلِيلٌۭ مِّنْ عِبَادِىَ ٱلشَّكُورُ ﴿13﴾',
    transliteration:
      "yaʿmalūna lahu mā yashāu min maḥārība watamāthīla wajifānin kal-jawābi waqudūrin rāsiyātin iʿ'malū āla dāwūda shuk'ran waqalīlun min ʿibādiya l-shakūru",
    englishTranslation:
      'They made for him what he willed of elevated chambers, statues, bowls like reservoirs, and cooking pots firmly set. "Work, O family of Dawood, in gratitude." But few of My slaves are grateful.',
    translation:
      'They made for him what he willed of elevated chambers, statues, bowls like reservoirs, and cooking pots firmly set. "Work, O family of Dawood, in gratitude." But few of My servants are grateful.',
    source: 'Surah Saba 34:13',
    audioKey: '34:13',
    whyThis: 'True gratitude is expressed through action, not just words. Few achieve this level.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_76_3',
    type: 'Quran',
    primaryText: 'innā hadaynāhu l-sabīla immā shākiran wa-immā kafūran',
    arabicText: 'إِنَّا هَدَيْنَـٰهُ ٱلسَّبِيلَ إِمَّا شَاكِرًۭا وَإِمَّا كَفُورًا ﴿3﴾',
    transliteration: 'innā hadaynāhu l-sabīla immā shākiran wa-immā kafūran',
    englishTranslation:
      'Indeed, We guided him to the way, whether he be grateful or ungrateful.',
    source: 'Surah Al-Insan 76:3',
    audioKey: '76:3',
    whyThis: 'Allah has shown us the way - now the choice is ours: gratitude or ingratitude.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_54_35',
    type: 'Quran',
    primaryText: "niʿ'matan min ʿindinā kadhālika najzī man shakara",
    arabicText: 'نِّعْمَةًۭ مِّنْ عِندِنَا ۚ كَذَٰلِكَ نَجْزِى مَن شَكَرَ ﴿35﴾',
    transliteration: "niʿ'matan min ʿindinā kadhālika najzī man shakara",
    englishTranslation: '[We saved them] as a favor from Us. Thus do We reward whoever is grateful.',
    source: 'Surah Al-Qamar 54:35',
    audioKey: '54:35',
    whyThis: 'This verse concludes the account of the people of Lut (AS) — those who believed were saved as a direct favor from Allah, specifically because of their gratitude. The verse establishes a principle: divine rescue and divine blessing are the reward for shukr. Gratitude is not just a feeling; it is a condition that attracts Allah\'s intervention.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_7_58',
    type: 'Quran',
    primaryText:
      "wal-baladu l-ṭayibu yakhruju nabātuhu bi-idh'ni rabbihi wa-alladhī khabutha lā yakhruju illā nakidan kadhālika nuṣarrifu l-āyāti liqawmin yashkurūna",
    arabicText:
      'وَٱلْبَلَدُ ٱلطَّيِّبُ يَخْرُجُ نَبَاتُهُۥ بِإِذْنِ رَبِّهِۦ ۖ وَٱلَّذِى خَبُثَ لَا يَخْرُجُ إِلَّا نَكِدًۭا ۚ كَذَٰلِكَ نُصَرِّفُ ٱلْـَٔايَـٰتِ لِقَوْمٍۢ يَشْكُرُونَ ﴿58﴾',
    transliteration:
      "wal-baladu l-ṭayibu yakhruju nabātuhu bi-idh'ni rabbihi wa-alladhī khabutha lā yakhruju illā nakidan kadhālika nuṣarrifu l-āyāti liqawmin yashkurūna",
    englishTranslation:
      'And the good land — its vegetation comes forth by permission of its Lord; but that which is bad — nothing comes forth except with difficulty. Thus do We explain the signs for a people who are grateful.',
    source: "Surah Al-A'raf 7:58",
    audioKey: '7:58',
    whyThis: 'Gratitude opens the heart to understanding the signs of Allah.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_4_147',
    type: 'Quran',
    primaryText:
      'mā yafʿalu l-lahu biʿadhābikum in shakartum waāmantum wakāna l-lahu shākiran ʿalīman',
    arabicText:
      'مَّا يَفْعَلُ ٱللَّهُ بِعَذَابِكُمْ إِن شَكَرْتُمْ وَءَامَنتُمْ ۚ وَكَانَ ٱللَّهُ شَاكِرًا عَلِيمًۭا ﴿147﴾',
    transliteration:
      'mā yafʿalu l-lahu biʿadhābikum in shakartum waāmantum wakāna l-lahu shākiran ʿalīman',
    englishTranslation:
      'What would Allah do with your punishment if you are grateful and believe? And Allah is All-Appreciative, All-Knowing.',
    source: 'Surah An-Nisa 4:147',
    audioKey: '4:147',
    whyThis: 'Allah asks rhetorically: what would He gain from punishing a grateful, believing heart? He is Al-Shakir (All-Appreciative) — meaning He recognizes and rewards even the smallest act of gratitude. Belief combined with sincere thankfulness is a shield; it gives Allah no reason to punish, and every reason to give more.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_2_172',
    type: 'Quran',
    primaryText:
      "yāayyuhā alladhīna āmanū kulū min ṭayyibāti mā razaqnākum wa-ush'kurū lillahi in kuntum iyyāhu taʿbudūna",
    arabicText:
      'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ كُلُوا۟ مِن طَيِّبَـٰتِ مَا رَزَقْنَـٰكُمْ وَٱشْكُرُوا۟ لِلَّهِ إِن كُنتُمْ إِيَّاهُ تَعْبُدُونَ ﴿172﴾',
    transliteration:
      "yāayyuhā alladhīna āmanū kulū min ṭayyibāti mā razaqnākum wa-ush'kurū lillahi in kuntum iyyāhu taʿbudūna",
    englishTranslation:
      'O you who believe, eat from the good things which We have provided for you, and be grateful to Allah if it is Him alone that you worship.',
    source: 'Surah Al-Baqarah 2:172',
    audioKey: '2:172',
    whyThis: "Gratitude is part of worship - enjoy Allah's provisions and thank Him.",
    moods: ['Grateful'],
  },
  {
    id: 'quran_35_12',
    type: 'Quran',
    primaryText:
      "wamā yastawī l-baḥrāni hādhā ʿadhbun furātun sāighun sharābuhu wahādhā mil'ḥun ujājun wamin kullin takulūna laḥman ṭariyyan watastakhrijūna ḥil'yatan talbasūnahā watarā l-ful'ka fīhi mawākhira litabtaghū min faḍlihi walaʿallakum tashkurūna",
    arabicText:
      'وَمَا يَسْتَوِى ٱلْبَحْرَانِ هَـٰذَا عَذْبٌۭ فُرَاتٌۭ سَآئِغٌۭ شَرَابُهُۥ وَهَـٰذَا مِلْحٌ أُجَاجٌۭ ۖ وَمِن كُلٍّۢ تَأْكُلُونَ لَحْمًۭا طَرِيًّۭا وَتَسْتَخْرِجُونَ حِلْيَةًۭ تَلْبَسُونَهَا ۖ وَتَرَى ٱلْفُلْكَ فِيهِ مَوَاخِرَ لِتَبْتَغُوا۟ مِن فَضْلِهِۦ وَلَعَلَّكُمْ تَشْكُرُونَ ﴿12﴾',
    transliteration:
      "wamā yastawī l-baḥrāni hādhā ʿadhbun furātun sāighun sharābuhu wahādhā mil'ḥun ujājun wamin kullin takulūna laḥman ṭariyyan watastakhrijūna ḥil'yatan talbasūnahā watarā l-ful'ka fīhi mawākhira litabtaghū min faḍlihi walaʿallakum tashkurūna",
    englishTranslation:
      'And not alike are the two seas. This one is fresh and sweet, pleasant for drinking, and this one is salty and bitter. And from each you eat fresh meat and extract ornaments which you wear. And you see the ships cleaving through it, that you may seek of His bounty and that you may be grateful.',
    source: 'Surah Fatir 35:12',
    audioKey: '35:12',
    whyThis: 'Seeking His bounty and being grateful go hand in hand.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_39_7',
    type: 'Quran',
    primaryText:
      "in takfurū fa-inna l-laha ghaniyyun ʿankum walā yarḍā liʿibādihi l-kuf'ra wa-in tashkurū yarḍahu lakum walā taziru wāziratun wiz'ra ukh'rā thumma ilā rabbikum marjiʿukum fayunabbi-ukum bimā kuntum taʿmalūna innahu ʿalīmun bidhāti l-ṣudūri",
    arabicText:
      'إِن تَكْفُرُوا۟ فَإِنَّ ٱللَّهَ غَنِىٌّ عَنكُمْ ۖ وَلَا يَرْضَىٰ لِعِبَادِهِ ٱلْكُفْرَ ۖ وَإِن تَشْكُرُوا۟ يَرْضَهُ لَكُمْ ۗ وَلَا تَزِرُ وَازِرَةٌۭ وِزْرَ أُخْرَىٰ ۗ ثُمَّ إِلَىٰ رَبِّكُم مَّرْجِعُكُمْ فَيُنَبِّئُكُم بِمَا كُنتُمْ تَعْمَلُونَ ۚ إِنَّهُۥ عَلِيمٌۢ بِذَاتِ ٱلصُّدُورِ ﴿7﴾',
    transliteration:
      "in takfurū fa-inna l-laha ghaniyyun ʿankum walā yarḍā liʿibādihi l-kuf'ra wa-in tashkurū yarḍahu lakum walā taziru wāziratun wiz'ra ukh'rā thumma ilā rabbikum marjiʿukum fayunabbi-ukum bimā kuntum taʿmalūna innahu ʿalīmun bidhāti l-ṣudūri",
    englishTranslation:
      'If you disbelieve, then indeed Allah is free from need of you. And He does not approve ungratefulness in His servants. And if you are grateful, He is pleased with it for you. No bearer of burdens will bear the burden of another. Then to your Lord is your return, and He will inform you about what you used to do. Indeed, He is the All-Knower of what is in the hearts.',
    source: 'Surah Az-Zumar 39:7',
    audioKey: '39:7',
    whyThis: "Allah's approval comes with gratitude - He is pleased when you are thankful.",
    moods: ['Grateful'],
  },
  {
    id: 'quran_29_20',
    type: 'Quran',
    primaryText:
      "qul sīrū fī l-arḍi fanẓurū kayfa bada'a l-khalqa thumma l-lahu yunshi'u l-nash'ata l-ākhirata inna l-laha ʿalā kulli shayʾin qadīrun",
    arabicText:
      'قُلْ سِيرُوا۟ فِى ٱلْأَرْضِ فَٱنظُرُوا۟ كَيْفَ بَدَأَ ٱلْخَلْقَ ۚ ثُمَّ ٱللَّهُ يُنشِئُ ٱلنَّشْأَةَ ٱلْءَاخِرَةَ ۚ إِنَّ ٱللَّهَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌۭ ﴿20﴾',
    transliteration:
      "qul sīrū fī l-arḍi fanẓurū kayfa bada'a l-khalqa thumma l-lahu yunshi'u l-nash'ata l-ākhirata inna l-laha ʿalā kulli shayʾin qadīrun",
    englishTranslation:
      'Say, [O Muhammad], "Travel through the land and observe how He began creation. Then Allah will produce the final creation. Indeed Allah, over all things, is competent."',
    source: 'Surah Al-Ankabut 29:20',
    audioKey: '29:20',
    whyThis: 'This verse invites reflection, not just belief: look at how creation began, and let that evidence settle the question of whether Allah can bring it back again. The pattern already surrounds you — a seed becoming a tree, a single cell becoming a person — and every one of those beginnings is proof that "over all things" truly means all things, including whatever feels impossible in your own life right now.',
    moods: ['Grateful', 'Overwhelmed'],
  },

  // === HAPPY / TAHMID ===
  {
    id: 'quran_10_58',
    type: 'Quran',
    primaryText:
      'qul bifaḍli l-lahi wabiraḥmatihi fabidhālika falyafraḥū huwa khayrun mimmā yajmaʿūna',
    arabicText:
      'قُلْ بِفَضْلِ ٱللَّهِ وَبِرَحْمَتِهِۦ فَبِذَٰلِكَ فَلْيَفْرَحُوا۟ هُوَ خَيْرٌۭ مِّمَّا يَجْمَعُونَ ﴿58﴾',
    transliteration:
      'qul bifaḍli l-lahi wabiraḥmatihi fabidhālika falyafraḥū huwa khayrun mimmā yajmaʿūna',
    englishTranslation:
      'Say, "In the bounty of Allah and in His mercy — in that let them rejoice. It is better than what they accumulate."',
    source: 'Surah Yunus 10:58',
    audioKey: '10:58',
    whyThis: "True joy comes from Allah's bounty and mercy, not worldly possessions.",
    moods: ['Tired', 'Grateful'],
  },
  {
    id: 'quran_3_200',
    type: 'Quran',
    primaryText:
      "yāayyuhā alladhīna āmanū iṣ'birū waṣābirū warābiṭū wa-ittaqū l-laha laʿallakum tuf'liḥūna",
    arabicText:
      'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱصْبِرُوا۟ وَصَابِرُوا۟ وَرَابِطُوا۟ وَٱتَّقُوا۟ ٱللَّهَ لَعَلَّكُمْ تُفْلِحُونَ ﴿200﴾',
    transliteration:
      "yāayyuhā alladhīna āmanū iṣ'birū waṣābirū warābiṭū wa-ittaqū l-laha laʿallakum tuf'liḥūna",
    englishTranslation:
      'O you who believe, be steadfast and patient and constant, and fear Allah so that you may be successful.',
    source: 'Surah Ali Imran 3:200',
    audioKey: '3:200',
    whyThis: 'The verse uses three words in sequence: "isbiru" (be patient in your own hardship), "sabiru" (be resilient against others), and "rabitu" (remain firm and constant). These are three levels of endurance — this verse calls you to all three at once. Success (falah) is the promised destination for those who hold all three together.',
    moods: ['Tired'],
  },
  {
    id: 'quran_9_105',
    type: 'Quran',
    primaryText:
      "waquli iʿ'malū fasayarā l-lahu ʿamalakum warasūluhu wal-mu'minūna wasaturaddūna ilā ʿālimi l-ghaybi wal-shahādati fayunabbi-ukum bimā kuntum taʿmalūna",
    arabicText:
      'وَقُلِ ٱعْمَلُوا۟ فَسَيَرَى ٱللَّهُ عَمَلَكُمْ وَرَسُولُهُۥ وَٱلْمُؤْمِنُونَ ۖ وَسَتُرَدُّونَ إِلَىٰ عَـٰلِمِ ٱلْغَيْبِ وَٱلشَّهَـٰدَةِ فَيُنَبِّئُكُم بِمَا كُنتُمْ تَعْمَلُونَ ﴿105﴾',
    transliteration:
      "waquli iʿ'malū fasayarā l-lahu ʿamalakum warasūluhu wal-mu'minūna wasaturaddūna ilā ʿālimi l-ghaybi wal-shahādati fayunabbi-ukum bimā kuntum taʿmalūna",
    englishTranslation:
      'And say, "Do, for Allah will see your deed, and His Messenger, and the believers. And you will be brought back to the Knower of the unseen and the seen, and He will inform you of what you used to do."',
    translation:
      'Say: "Act! For Allah will see your deeds, and so will His Prophet and the believers. Then you will be returned to the One who knows all things — the hidden and the visible — and He will inform you of everything you used to do."',
    source: 'Surah At-Tawbah 9:105',
    audioKey: '9:105',
    whyThis: 'This verse was revealed to motivate believers to act rather than wait passively. Allah, His Messenger ﷺ, and the believers are all witnesses to your deeds — then you return to Allah who knows the unseen and the visible. Your efforts are not going unnoticed; they are being witnessed at multiple levels.',
    moods: ['Tired'],
  },
  {
    id: 'quran_103_1_3',
    type: 'Quran',
    primaryText:
      "wal-ʿaṣri inna l-insāna lafī khus'rin illā alladhīna āmanū waʿamilū l-ṣāliḥāti watawāṣaw bil-ḥaqi watawāṣaw bil-ṣabri",
    arabicText:
      'وَٱلْعَصْرِ إِنَّ ٱلْإِنسَـٰنَ لَفِى خُسْرٍ إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ ﴿1-3﴾',
    transliteration:
      "wal-ʿaṣri inna l-insāna lafī khus'rin illā alladhīna āmanū waʿamilū l-ṣāliḥāti watawāṣaw bil-ḥaqi watawāṣaw bil-ṣabri",
    englishTranslation:
      'By time. Indeed, mankind is surely in loss — except those who believe and do righteous deeds, and enjoin each other to truth, and enjoin each other to patience.',
    source: 'Surah Al-Asr 103:1-3',
    audioKey: '103:1-3',
    whyThis: 'Time is running - focus your efforts on faith, good deeds, truth, and patience.',
    moods: ['Tired'],
  },
  {
    id: 'quran_22_77',
    type: 'Quran',
    primaryText:
      "yāayyuhā alladhīna āmanū ir'kaʿū wa-us'judū wa-uʿ'budū rabbakum wa-if'ʿalū l-khayra laʿallakum tuf'liḥūna",
    arabicText:
      'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱرْكَعُوا۟ وَٱسْجُدُوا۟ وَٱعْبُدُوا۟ رَبَّكُمْ وَٱفْعَلُوا۟ ٱلْخَيْرَ لَعَلَّكُمْ تُفْلِحُونَ ۩ ﴿77﴾',
    transliteration:
      "yāayyuhā alladhīna āmanū ir'kaʿū wa-us'judū wa-uʿ'budū rabbakum wa-if'ʿalū l-khayra laʿallakum tuf'liḥūna",
    englishTranslation:
      'O you who believe, bow and prostrate and worship your Lord, and do good so that you may be successful.',
    source: 'Surah Al-Hajj 22:77',
    audioKey: '22:77',
    whyThis: 'direct your efforts toward worship and doing good - this is the path to success.',
    moods: ['Tired', 'Grateful', 'Calm'],
  },
  {
    id: 'quran_18_30',
    type: 'Quran',
    primaryText: 'inna alladhīna āmanū waʿamilū l-ṣāliḥāti innā lā nuḍīʿu ajra man aḥsana ʿamalan',
    arabicText:
      'إِنَّ ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ إِنَّا لَا نُضِيعُ أَجْرَ مَنْ أَحْسَنَ عَمَلًا ﴿30﴾',
    transliteration:
      'inna alladhīna āmanū waʿamilū l-ṣāliḥāti innā lā nuḍīʿu ajra man aḥsana ʿamalan',
    englishTranslation:
      'Indeed, those who believed and did righteous deeds — indeed, We will not allow the reward of anyone who does good deeds to be lost.',
    source: 'Surah Al-Kahf 18:30',
    audioKey: '18:30',
    whyThis: 'No good deed is wasted - your efforts and devotion are always rewarded.',
    moods: ['Tired'],
  },
  {
    id: 'quran_28_77',
    type: 'Quran',
    primaryText:
      "wa-ib'taghi fīmā ātāka l-lahu l-dāra l-ākhirata walā tansa naṣībaka mina l-dun'yā wa-aḥsin kamā aḥsana l-lahu ilayka walā tabghi l-fasāda fī l-arḍi inna l-laha lā yuḥibbu l-muf'sidīna",
    arabicText:
      'وَٱبْتَغِ فِيمَآ ءَاتَىٰكَ ٱللَّهُ ٱلدَّارَ ٱلْـَٔاخِرَةَ ۖ وَلَا تَنسَ نَصِيبَكَ مِنَ ٱلدُّنْيَا ۖ وَأَحْسِن كَمَآ أَحْسَنَ ٱللَّهُ إِلَيْكَ ۖ وَلَا تَبْغِ ٱلْفَسَادَ فِى ٱلْأَرْضِ ۖ إِنَّ ٱللَّهَ لَا يُحِبُّ ٱلْمُفْسِدِينَ ﴿77﴾',
    transliteration:
      "wa-ib'taghi fīmā ātāka l-lahu l-dāra l-ākhirata walā tansa naṣībaka mina l-dun'yā wa-aḥsin kamā aḥsana l-lahu ilayka walā tabghi l-fasāda fī l-arḍi inna l-laha lā yuḥibbu l-muf'sidīna",
    englishTranslation:
      'But seek, through what Allah has given you, the home of the Hereafter; and do not forget your share of the world. And do good as Allah has been good to you. And do not seek corruption in the earth. Indeed, Allah does not love the corrupters.',
    source: 'Surah Al-Qasas 28:77',
    audioKey: '28:77',
    whyThis: 'Use your energy to seek the Hereafter, but also enjoy the world and do good.',
    moods: ['Tired'],
  },
  {
    id: 'quran_2_148',
    type: 'Quran',
    primaryText:
      "walikullin wij'hatun huwa muwallīhā fa-is'tabiqū l-khayrāti ayna mā takūnū yati bikumu l-lahu jamīʿan inna l-laha ʿalā kulli shayin qadīrun",
    arabicText:
      'وَلِكُلٍّۢ وِجْهَةٌ هُوَ مُوَلِّيهَا ۖ فَٱسْتَبِقُوا۟ ٱلْخَيْرَٰتِ ۚ أَيْنَ مَا تَكُونُوا۟ يَأْتِ بِكُمُ ٱللَّهُ جَمِيعًا ۚ إِنَّ ٱللَّهَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌۭ ﴿148﴾',
    transliteration:
      "walikullin wij'hatun huwa muwallīhā fa-is'tabiqū l-khayrāti ayna mā takūnū yati bikumu l-lahu jamīʿan inna l-laha ʿalā kulli shayin qadīrun",
    englishTranslation:
      'And for everyone is a direction toward which he turns; so race to good. Wherever you may be, Allah will bring you all together. Indeed, Allah is over all things All-Powerful.',
    source: 'Surah Al-Baqarah 2:148',
    audioKey: '2:148',
    whyThis: 'Race towards good deeds - let your energy propel you forward in righteousness.',
    moods: ['Tired'],
  },
  {
    id: 'quran_5_48',
    type: 'Quran',
    primaryText:
      "wa-anzalnā ilayka l-kitāba bil-ḥaqi muṣaddiqan limā bayna yadayhi mina l-kitābi wamuhayminan ʿalayhi fa-uḥ'kum baynahum bimā anzala l-lahu walā tattabiʿ ahwāahum ʿammā jāaka mina l-ḥaqi likullin jaʿalnā minkum shir'ʿatan wamin'hājan walaw shāa l-lahu lajaʿalakum ummatan wāḥidatan walākin liyabluwakum fī mā ātākum fa-is'tabiqū l-khayrāti ilā l-lahi marjiʿukum jamīʿan fayunabbi-ukum bimā kuntum fīhi takhtalifūna",
    arabicText:
      'وَأَنزَلْنَآ إِلَيْكَ ٱلْكِتَـٰبَ بِٱلْحَقِّ مُصَدِّقًۭا لِّمَا بَيْنَ يَدَيْهِ مِنَ ٱلْكِتَـٰبِ وَمُهَيْمِنًا عَلَيْهِ ۖ فَٱحْكُم بَيْنَهُم بِمَآ أَنزَلَ ٱللَّهُ ۖ وَلَا تَتَّبِعْ أَهْوَآءَهُمْ عَمَّا جَآءَكَ مِنَ ٱلْحَقِّ ۚ لِكُلٍّۢ جَعَلْنَا مِنكُمْ شِرْعَةًۭ وَمِنْهَاجًۭا ۚ وَلَوْ شَآءَ ٱللَّهُ لَجَعَلَكُمْ أُمَّةًۭ وَٰحِدَةًۭ وَلَـٰكِن لِّيَبْلُوَكُمْ فِى مَآ ءَاتَىٰكُمْ ۖ فَٱسْتَبِقُوا۟ ٱلْخَيْرَٰتِ ۚ إِلَى ٱللَّهِ مَرْجِعُكُمْ جَمِيعًۭا فَيُنَبِّئُكُم بِمَا كُنتُمْ فِيهِ تَخْتَلِفُونَ ﴿48﴾',
    transliteration:
      "wa-anzalnā ilayka l-kitāba bil-ḥaqi muṣaddiqan limā bayna yadayhi mina l-kitābi wamuhayminan ʿalayhi fa-uḥ'kum baynahum bimā anzala l-lahu walā tattabiʿ ahwāahum ʿammā jāaka mina l-ḥaqi likullin jaʿalnā minkum shir'ʿatan wamin'hājan walaw shāa l-lahu lajaʿalakum ummatan wāḥidatan walākin liyabluwakum fī mā ātākum fa-is'tabiqū l-khayrāti ilā l-lahi marjiʿukum jamīʿan fayunabbi-ukum bimā kuntum fīhi takhtalifūna",
    englishTranslation:
      'And We revealed to you the Book in truth, confirming what was before it of the Scripture and as a guardian over it. So judge between them by what Allah has revealed, and do not follow their vain desires away from the truth that has come to you. For each of you We have made a law and a clear way. And if Allah had willed, He would have made you one community, but to test you in what He has given you; so race to good. To Allah you will all return, and He will inform you concerning that over which you used to differ.',
    translation:
      'We revealed the Quran to you in truth, confirming the scriptures before it. Judge between people by what Allah has revealed, and do not follow anyone\'s desires over the truth. For each community, We made a path and a way of life. Had Allah willed, He would have made you all one nation — but He tests you through what He has given you. So compete with one another in doing good; to Allah you will all return, and He will clarify everything you disagreed about.',
    source: 'Surah Al-Maidah 5:48',
    audioKey: '5:48',
    whyThis: 'Competition in goodness - use your energy to outdo others in positive deeds.',
    moods: ['Tired'],
  },
  {
    id: 'quran_18_110',
    type: 'Quran',
    primaryText:
      "qul innamā anā basharun mith'lukum yūḥā ilayya annamā ilāhukum ilāhun wāḥidun faman kāna yarjū liqāa rabbihi falyaʿmal ʿamalan ṣāliḥan walā yush'rik biʿibādati rabbihi aḥadan",
    arabicText:
      'قُلْ إِنَّمَآ أَنَا۠ بَشَرٌۭ مِّثْلُكُمْ يُوحَىٰٓ إِلَىَّ أَنَّمَآ إِلَـٰهُكُمْ إِلَـٰهٌۭ وَٰحِدٌۭ ۖ فَمَن كَانَ يَرْجُوا۟ لِقَآءَ رَبِّهِۦ فَلْيَعْمَلْ عَمَلًۭا صَـٰلِحًۭا وَلَا يُشْرِكْ بِعِبَادَةِ رَبِّهِۦٓ أَحَدًۢا ﴿110﴾',
    transliteration:
      "qul innamā anā basharun mith'lukum yūḥā ilayya annamā ilāhukum ilāhun wāḥidun faman kāna yarjū liqāa rabbihi falyaʿmal ʿamalan ṣāliḥan walā yush'rik biʿibādati rabbihi aḥadan",
    englishTranslation:
      'Say, "I am only a man like you. It has been revealed to me that your God is one God. So whoever hopes for the meeting with his Lord, let him do righteous deeds and not associate anyone in the worship of his Lord."',
    source: 'Surah Al-Kahf 18:110',
    audioKey: '18:110',
    whyThis: 'The ultimate motivation: working for the meeting with your Lord.',
    moods: ['Tired'],
  },
  {
    id: 'quran_67_2',
    type: 'Quran',
    primaryText:
      'alladhī khalaqa l-mawta wal-ḥayata liyabluwakum ayyukum aḥsanu ʿamalan wahuwa l-ʿazīzu l-ghafūru',
    arabicText:
      'ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًۭا ۚ وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ ﴿2﴾',
    transliteration:
      'alladhī khalaqa l-mawta wal-ḥayata liyabluwakum ayyukum aḥsanu ʿamalan wahuwa l-ʿazīzu l-ghafūru',
    englishTranslation:
      'The One Who created death and life to test which of you is best in deed. And He is the All-Mighty, the Oft-Forgiving.',
    source: 'Surah Al-Mulk 67:2',
    audioKey: '67:2',
    whyThis: 'Life is a test of excellence in action - strive to be the best in your deeds.',
    moods: ['Tired'],
  },
  {
    id: 'quran_99_7_8',
    type: 'Quran',
    primaryText:
      "faman yaʿmal mith'qāla dharratin khayran yarahu waman yaʿmal mith'qāla dharratin sharran yarahu",
    arabicText:
      'فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًۭا يَرَهُۥ ﴿7﴾ وَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّۭا يَرَهُۥ ﴿8﴾',
    transliteration:
      "faman yaʿmal mith'qāla dharratin khayran yarahu waman yaʿmal mith'qāla dharratin sharran yarahu",
    englishTranslation:
      "So whoever does an atom's weight of good will see it, and whoever does an atom's weight of evil will see it.",
    source: 'Surah Az-Zalzalah 99:7-8',
    audioKey: '99:7-8',
    whyThis: 'Every tiny effort counts - never underestimate the value of a small good deed.',
    moods: ['Tired'],
  },
  {
    id: 'quran_30_4',
    type: 'Quran',
    primaryText:
      "fī biḍ'ʿi sinīna lillahi l-amru min qablu wamin baʿdu wayawma-idhin yafraḥu l-mu'minūna binaṣri l-lahi yanṣuru man yashāu wahuwa l-ʿazīzu l-raḥīmu",
    arabicText:
      'فِى بِضْعِ سِنِينَ ۗ لِلَّهِ ٱلْأَمْرُ مِن قَبْلُ وَمِنۢ بَعْدُ ۚ وَيَوْمَئِذٍۢ يَفْرَحُ ٱلْمُؤْمِنُونَ بِنَصْرِ ٱللَّهِ ۚ يَنصُرُ مَن يَشَآءُ ۖ وَهُوَ ٱلْعَزِيزُ ٱلرَّحِيمُ ﴿4-5﴾',
    transliteration:
      "fī biḍ'ʿi sinīna lillahi l-amru min qablu wamin baʿdu wayawma-idhin yafraḥu l-mu'minūna binaṣri l-lahi yanṣuru man yashāu wahuwa l-ʿazīzu l-raḥīmu",
    englishTranslation:
      'Within a few years. To Allah belongs the command before and after. And that day the believers will rejoice in the help of Allah. He helps whom He wills. And He is the All-Mighty, the Most Merciful.',
    translation:
      'Within a few years. To Allah belongs the command before and after. And that day the believers will rejoice in the help of Allah. He helps whom He wills. And He is the All-Mighty, the Most Merciful.',
    source: 'Surah Ar-Rum 30:4-5',
    audioKey: '30:4-5',
    whyThis: 'When the Romans were defeated and the situation looked hopeless, the Quran predicted their comeback victory "within a few years" — and it came to pass. This verse is a reminder that Allah holds all command before and after every event. What looks like a final defeat is often only a turning point.',
    moods: ['Hopeful'],
  },
  {
    id: 'quran_3_170',
    type: 'Quran',
    primaryText:
      'fariḥīna bimā ātāhumu l-lahu min faḍlihi wayastabshirūna bi-alladhīna lam yalḥaqū bihim min khalfihim allā khawfun ʿalayhim walā hum yaḥzanūna',
    arabicText:
      'فَرِحِينَ بِمَآ ءَاتَىٰهُمُ ٱللَّهُ مِن فَضْلِهِۦ وَيَسْتَبْشِرُونَ بِٱلَّذِينَ لَمْ يَلْحَقُوا۟ بِهِم مِّنْ خَلْفِهِمْ أَلَّا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ ﴿170﴾',
    transliteration:
      'fariḥīna bimā ātāhumu l-lahu min faḍlihi wayastabshirūna bi-alladhīna lam yalḥaqū bihim min khalfihim allā khawfun ʿalayhim walā hum yaḥzanūna',
    englishTranslation:
      'Rejoicing in what Allah has bestowed upon them of His bounty, and they receive good tidings about those yet to join them — that there will be no fear upon them, nor will they grieve.',
    translation:
      'Those who gave their lives for Allah\'s cause are alive with their Lord — rejoicing in what He has given them. They are delighted for the believers still living on earth: that they, too, will have no fear, nor will they grieve.',
    source: 'Surah Ali Imran 3:170',
    audioKey: '3:170',
    whyThis: 'The martyrs in Allah\'s cause are described as alive, rejoicing, and actively sending good news to those still on earth. This verse is a reminder that what appears to be loss in this life is often a gain that cannot yet be seen. The joy of those who have returned to Allah is real, and so is the promise awaiting every sincere believer.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_25_63',
    type: 'Quran',
    primaryText:
      'waʿibādu l-raḥmāni alladhīna yamshūna ʿalā l-arḍi hawnan wa-idhā khāṭabahumu l-jāhilūna qālū salāman',
    arabicText:
      'وَعِبَادُ ٱلرَّحْمَـٰنِ ٱلَّذِينَ يَمْشُونَ عَلَى ٱلْأَرْضِ هَوْنًۭا وَإِذَا خَاطَبَهُمُ ٱلْجَـٰهِلُونَ قَالُوا۟ سَلَـٰمًۭا ﴿63﴾',
    transliteration:
      'waʿibādu l-raḥmāni alladhīna yamshūna ʿalā l-arḍi hawnan wa-idhā khāṭabahumu l-jāhilūna qālū salāman',
    englishTranslation:
      'And the servants of the Most Gracious are those who walk upon the earth in humility, and when the ignorant address them, they say, "Peace."',
    source: 'Surah Al-Furqan 25:63',
    audioKey: '25:63',
    whyThis: 'Respond to harshness with peace - a hallmark of the true servants of Allah.',
    moods: ['Calm', 'Grateful'],
  },
  {
    id: 'quran_8_10',
    type: 'Quran',
    primaryText:
      "wamā jaʿalahu l-lahu illā bush'rā walitaṭma-inna bihi qulūbukum wamā l-naṣru illā min ʿindi l-lahi inna l-laha ʿazīzun ḥakīmun",
    arabicText:
      'وَمَا جَعَلَهُ ٱللَّهُ إِلَّا بُشْرَىٰ وَلِتَطْمَئِنَّ بِهِۦ قُلُوبُكُمْ ۚ وَمَا ٱلنَّصْرُ إِلَّا مِنْ عِندِ ٱللَّهِ ۚ إِنَّ ٱللَّهَ عَزِيزٌ حَكِيمٌ ﴿10﴾',
    transliteration:
      "wamā jaʿalahu l-lahu illā bush'rā walitaṭma-inna bihi qulūbukum wamā l-naṣru illā min ʿindi l-lahi inna l-laha ʿazīzun ḥakīmun",
    englishTranslation:
      'And Allah made it not but as good tidings, and so that your hearts would be at rest. And there is no victory except from Allah. Indeed, Allah is All-Mighty, All-Wise.',
    translation:
      'Allah sent the angels at the Battle of Badr only as good news, and to put your hearts at ease — for victory comes from no one but Allah. Indeed, Allah is All-Mighty, All-Wise.',
    source: 'Surah Al-Anfal 8:10',
    audioKey: '8:10',
    whyThis: 'Before the Battle of Badr, Allah sent a calming rain and a sense of tranquility to the believers to help them sleep and recover. This verse reminds us that divine reassurance — sakinah — is real and tangible. Victory and peace both come from Allah alone; our part is to receive them with trust.',
    moods: ['Calm'],
  },
  {
    id: 'quran_9_26',
    type: 'Quran',
    primaryText:
      "thumma anzala l-lahu sakīnatahu ʿalā rasūlihi waʿalā l-mu'minīna wa-anzala junūdan lam tarawhā waʿadhaba alladhīna kafarū wadhālika jazāu l-kāfirīna",
    arabicText:
      'ثُمَّ أَنزَلَ ٱللَّهُ سَكِينَتَهُۥ عَلَىٰ رَسُولِهِۦ وَعَلَى ٱلْمُؤْمِنِينَ وَأَنزَلَ جُنُودًۭا لَّمْ تَرَوْهَا وَعَذَّبَ ٱلَّذِينَ كَفَرُوا۟ ۚ وَذَٰلِكَ جَزَآءُ ٱلْكَـٰفِرِينَ ﴿26﴾',
    transliteration:
      "thumma anzala l-lahu sakīnatahu ʿalā rasūlihi waʿalā l-mu'minīna wa-anzala junūdan lam tarawhā waʿadhaba alladhīna kafarū wadhālika jazāu l-kāfirīna",
    englishTranslation:
      'Then Allah sent down His tranquility upon His Messenger and upon the believers, and sent down forces which you did not see, and He punished those who disbelieved. And that is the recompense of the disbelievers.',
    translation:
      'At the Battle of Hunayn, when the believers initially panicked and fled, Allah sent down His tranquility upon His Prophet and upon the believers. He sent down forces they could not see, and turned the tide against the disbelievers — that is how He repays those who reject faith.',
    source: 'Surah At-Tawbah 9:26',
    audioKey: '9:26',
    whyThis: 'At Hunayn, the believers initially scattered due to overconfidence. Yet Allah sent His sakinah (tranquility) and unseen armies to restore them. This shows that calm and steadiness in difficult moments are not something we manufacture — they are gifts that Allah descends upon those who turn back to Him.',
    moods: ['Calm'],
  },
  {
    id: 'quran_9_40',
    type: 'Quran',
    primaryText:
      "illā tanṣurūhu faqad naṣarahu l-lahu idh akhrajahu alladhīna kafarū thāniya ith'nayni idh humā fī l-ghāri idh yaqūlu liṣāḥibihi lā taḥzan inna l-laha maʿanā fa-anzala l-lahu sakīnatahu ʿalayhi wa-ayyadahu bijunūdin lam tarawhā wajaʿala kalimata alladhīna kafarū l-suf'lā wakalimatu l-lahi hiya l-ʿul'yā wal-lahu ʿazīzun ḥakīmun",
    arabicText:
      'إِلَّا تَنصُرُوهُ فَقَدْ نَصَرَهُ ٱللَّهُ إِذْ أَخْرَجَهُ ٱلَّذِينَ كَفَرُوا۟ ثَانِىَ ٱثْنَيْنِ إِذْ هُمَا فِى ٱلْغَارِ إِذْ يَقُولُ لِصَـٰحِبِهِۦ لَا تَحْزَنْ إِنَّ ٱللَّهَ مَعَنَا ۖ فَأَنزَلَ ٱللَّهُ سَكِينَتَهُۥ عَلَيْهِ وَأَيَّدَهُۥ بِجُنُودٍۢ لَّمْ تَرَوْهَا وَجَعَلَ كَلِمَةَ ٱلَّذِينَ كَفَرُوا۟ ٱلسُّفْلَىٰ ۗ وَكَلِمَةُ ٱللَّهِ هِىَ ٱلْعُلْيَا ۗ وَٱللَّهُ عَزِيزٌ حَكِيمٌ ﴿40﴾',
    transliteration:
      "illā tanṣurūhu faqad naṣarahu l-lahu idh akhrajahu alladhīna kafarū thāniya ith'nayni idh humā fī l-ghāri idh yaqūlu liṣāḥibihi lā taḥzan inna l-laha maʿanā fa-anzala l-lahu sakīnatahu ʿalayhi wa-ayyadahu bijunūdin lam tarawhā wajaʿala kalimata alladhīna kafarū l-suf'lā wakalimatu l-lahi hiya l-ʿul'yā wal-lahu ʿazīzun ḥakīmun",
    englishTranslation:
      'If you do not help him, Allah has already helped him when those who disbelieved drove him out as one of two, when they were in the cave and he said to his companion, "Do not grieve; indeed, Allah is with us." Then Allah sent down His tranquility upon him and supported him with forces you did not see, and made the word of those who disbelieved the lowest, while the word of Allah is the highest. And Allah is All-Mighty, All-Wise.',
    translation:
      'Even if you do not help the Prophet Muhammad ﷺ — Allah already helped him. When the disbelievers of Makkah drove him out, he hid in a cave with his companion Abu Bakr and told him: "Do not grieve; Allah is with us." Then Allah sent down His tranquility upon him, supported him with unseen forces, and made the word of the disbelievers the lowest — while the word of Allah remains the highest. And Allah is All-Mighty, All-Wise.',
    source: 'Surah At-Tawbah 9:40',
    audioKey: '9:40',
    whyThis: 'In the cave of Thawr, the Prophet ﷺ told Abu Bakr (RA) not to grieve — because Allah was with them. Allah responded by sending His sakinah and unseen support. This moment, among the most dangerous the Prophet ﷺ faced, became the model for every believer: when you say "Allah is with us," trust it completely.',
    moods: ['Calm'],
  },
  {
    id: 'quran_41_35',
    type: 'Quran',
    primaryText: 'wamā yulaqqāhā illā alladhīna ṣabarū wamā yulaqqāhā illā dhū ḥaẓẓin ʿaẓīmin',
    arabicText:
      'وَمَا يُلَقَّىٰهَآ إِلَّا ٱلَّذِينَ صَبَرُوا۟ وَمَا يُلَقَّىٰهَآ إِلَّا ذُو حَظٍّ عَظِيمٍۢ ﴿35﴾',
    transliteration: 'wamā yulaqqāhā illā alladhīna ṣabarū wamā yulaqqāhā illā dhū ḥaẓẓin ʿaẓīmin',
    englishTranslation:
      'And it is not granted except to those who are patient, and it is not granted except to one having a great fortune.',
    translation:
      'The ability to respond to evil with good — this quality is granted only to those who are truly patient; only to those whom Allah has blessed with an immense fortune of character.',
    source: 'Surah Fussilat 41:35',
    audioKey: '41:35',
    whyThis: 'The verse makes clear that responding to harm with goodness is not a natural human reflex — it is a special quality that Allah grants. It is described as a "great fortune" (hazz azeem), placing it among the highest of character traits. Anger is natural; choosing ihsan in response to harm is divine.',
    moods: ['Angry'],
  },
  {
    id: 'quran_2_265',
    type: 'Quran',
    primaryText:
      "wamathalu alladhīna yunfiqūna amwālahumu ib'tighāa marḍāti l-lahi watathbītan min anfusihim kamathali jannatin birabwatin aṣābahā wābilun faātat ukulahā ḍiʿ'fayni fa-in lam yuṣib'hā wābilun faṭallun wal-lahu bimā taʿmalūna baṣīrun",
    arabicText:
      'وَمَثَلُ ٱلَّذِينَ يُنفِقُونَ أَمْوَٰلَهُمُ ٱبْتِغَآءَ مَرْضَاتِ ٱللَّهِ وَتَثْبِيتًۭا مِّنْ أَنفُسِهِمْ كَمَثَلِ جَنَّةٍۭ بِرَبْوَةٍ أَصَابَهَا وَابِلٌۭ فَـَٔاتَتْ أُكُلَهَا ضِعْفَيْنِ فَإِن لَّمْ يُصِبْهَا وَابِلٌۭ فَطَلٌّۭ ۗ وَٱللَّهُ بِمَا تَعْمَلُونَ بَصِيرٌ ﴿265﴾',
    transliteration:
      "wamathalu alladhīna yunfiqūna amwālahumu ib'tighāa marḍāti l-lahi watathbītan min anfusihim kamathali jannatin birabwatin aṣābahā wābilun faātat ukulahā ḍiʿ'fayni fa-in lam yuṣib'hā wābilun faṭallun wal-lahu bimā taʿmalūna baṣīrun",
    englishTranslation:
      'And the example of those who spend their wealth seeking the pleasure of Allah and assuring their souls, is like a garden on a height: heavy rain falls on it, and it yields its harvest double. And if heavy rain does not fall on it, then a drizzle is sufficient. And Allah, of what you do, is All-Seeing.',
    source: 'Surah Al-Baqarah 2:265',
    audioKey: '2:265',
    whyThis: 'The garden on a height receives either heavy rain or light drizzle — either way, it produces. This parable describes the person whose giving is sincere: regardless of how much they are able to give, their effort is fruitful. Even small acts of generosity done with a pure heart yield their full reward.',
    moods: ['Tired', 'Grateful'],
  },

  // === HOPEFUL / RAJA ===
  {
    id: 'quran_65_2',
    type: 'Quran',
    primaryText:
      "fa-idhā balaghna ajalahunna fa-amsikūhunna bimaʿrūfin aw fāriqūhunna bimaʿrūfin wa-ashhidū dhaway ʿadlin minkum wa-aqīmū l-shahādata lillahi dhālikum yūʿaẓu bihi man kāna yu'minu bil-lahi wal-yawmi l-ākhiri waman yattaqi l-laha yajʿal lahu makhrajan",
    arabicText:
      'فَإِذَا بَلَغْنَ أَجَلَهُنَّ فَأَمْسِكُوهُنَّ بِمَعْرُوفٍ أَوْ فَارِقُوهُنَّ بِمَعْرُوفٍۢ وَأَشْهِدُوا۟ ذَوَىْ عَدْلٍۢ مِّنكُمْ وَأَقِيمُوا۟ ٱلشَّهَـٰدَةَ لِلَّهِ ۚ ذَٰلِكُمْ يُوعَظُ بِهِۦ مَن كَانَ يُؤْمِنُ بِٱللَّهِ وَٱلْيَوْمِ ٱلْـَٔاخِرِ ۚ وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًۭا ﴿2﴾',
    transliteration:
      "fa-idhā balaghna ajalahunna fa-amsikūhunna bimaʿrūfin aw fāriqūhunna bimaʿrūfin wa-ashhidū dhaway ʿadlin minkum wa-aqīmū l-shahādata lillahi dhālikum yūʿaẓu bihi man kāna yu'minu bil-lahi wal-yawmi l-ākhiri waman yattaqi l-laha yajʿal lahu makhrajan",
    englishTranslation:
      'Then when they have reached their term, either retain them with kindness or part with them with kindness. And bring to witness two just men among you, and establish the testimony for Allah. That is instructed to whoever believes in Allah and the Last Day. And whoever fears Allah — He will make for him a way out.',
    translation:
      'In matters of marriage: either stay together with kindness, or part with kindness — and let two trustworthy people witness the decision. This is the counsel for whoever believes in Allah and the Last Day. And whoever is mindful of Allah — He will always make a way out for them.',
    source: 'Surah At-Talaq 65:2',
    audioKey: '65:2',
    whyThis: 'Allah promises a way out for those who are mindful of Him.',
    moods: ['Hopeful'],
  },
  {
    id: 'quran_2_216',
    type: 'Quran',
    primaryText:
      "kutiba ʿalaykumu l-qitālu wahuwa kur'hun lakum waʿasā an takrahū shayan wahuwa khayrun lakum waʿasā an tuḥibbū shayan wahuwa sharrun lakum wal-lahu yaʿlamu wa-antum lā taʿlamūna",
    arabicText:
      'كُتِبَ عَلَيْكُمُ ٱلْقِتَالُ وَهُوَ كُرْهٌۭ لَّكُمْ ۖ وَعَسَىٰٓ أَن تَكْرَهُوا۟ شَيْـًۭٔا وَهُوَ خَيْرٌۭ لَّكُمْ ۖ وَعَسَىٰٓ أَن تُحِبُّوا۟ شَيْـًۭٔا وَهُوَ شَرٌّۭ لَّكُمْ ۗ وَٱللَّهُ يَعْلَمُ وَأَنتُمْ لَا تَعْلَمُونَ ﴿216﴾',
    transliteration:
      "kutiba ʿalaykumu l-qitālu wahuwa kur'hun lakum waʿasā an takrahū shayan wahuwa khayrun lakum waʿasā an tuḥibbū shayan wahuwa sharrun lakum wal-lahu yaʿlamu wa-antum lā taʿlamūna",
    englishTranslation:
      'Fighting has been prescribed upon you while it is hateful to you. But perhaps you dislike a thing and it is good for you; and perhaps you love a thing and it is bad for you. And Allah knows, while you do not know.',
    source: 'Surah Al-Baqarah 2:216',
    audioKey: '2:216',
    whyThis: "What seems bad may be good for you - trust Allah's wisdom.",
    moods: ['Sad'],
  },

  {
    id: 'quran_94_6',
    type: 'Quran',
    primaryText: "inna maʿa l-ʿus'ri yus'ran",
    arabicText: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًۭا ﴿6﴾',
    transliteration: "inna maʿa l-ʿus'ri yus'ran",
    englishTranslation: 'Indeed, with the hardship is ease.',
    source: 'Surah Ash-Sharh 94:6',
    audioKey: '94:6',
    whyThis: 'Allah repeats this promise twice in consecutive verses (94:5 and 94:6) for emphasis. The scholars note that the repetition is not redundant — it is strengthening the certainty of the relief. When Allah says something twice, it is to leave no doubt in the heart of the listener that ease is truly coming.',
    moods: ['Hopeful'],
  },
  {
    id: 'quran_3_26',
    type: 'Quran',
    primaryText:
      "quli l-lahuma mālika l-mul'ki tu'tī l-mul'ka man tashāu watanziʿu l-mul'ka mimman tashāu watuʿizzu man tashāu watudhillu man tashāu biyadika l-khayru innaka ʿalā kulli shayin qadīrun tūliju al-layla fī l-nahāri watūliju l-nahāra fī al-layli watukh'riju l-ḥaya mina l-mayiti watukh'riju l-mayita mina l-ḥayi watarzuqu man tashāu bighayri ḥisābin",
    arabicText:
      'قُلِ ٱللَّهُمَّ مَـٰلِكَ ٱلْمُلْكِ تُؤْتِى ٱلْمُلْكَ مَن تَشَآءُ وَتَنزِعُ ٱلْمُلْكَ مِمَّن تَشَآءُ وَتُعِزُّ مَن تَشَآءُ وَتُذِلُّ مَن تَشَآءُ ۖ بِيَدِكَ ٱلْخَيْرُ ۖ إِنَّكَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌۭ تُولِجُ ٱلَّيْلَ فِى ٱلنَّهَارِ وَتُولِجُ ٱلنَّهَارَ فِى ٱلَّيْلِ ۖ وَتُخْرِجُ ٱلْحَىَّ مِنَ ٱلْمَيِّتِ وَتُخْرِجُ ٱلْمَيِّتَ مِنَ ٱلْحَىِّ ۖ وَتَرْزُقُ مَن تَشَآءُ بِغَيْرِ حِسَابٍۢ ﴿26-27﴾',
    transliteration:
      "quli l-lahuma mālika l-mul'ki tu'tī l-mul'ka man tashāu watanziʿu l-mul'ka mimman tashāu watuʿizzu man tashāu watudhillu man tashāu biyadika l-khayru innaka ʿalā kulli shayin qadīrun tūliju al-layla fī l-nahāri watūliju l-nahāra fī al-layli watukh'riju l-ḥaya mina l-mayiti watukh'riju l-mayita mina l-ḥayi watarzuqu man tashāu bighayri ḥisābin",
    englishTranslation:
      'Say, "O Allah, Owner of the Dominion, You give dominion to whom You will and You take away dominion from whom You will. You honor whom You will and You humiliate whom You will. In Your hand is all good. Indeed, You are over all things All-Powerful. You cause the night to enter the day and cause the day to enter the night; and You bring the living from the dead and bring the dead from the living; and You give provision to whom You will without measure."',
    source: 'Surah Ali Imran 3:26-27',
    audioKey: '3:26-27',
    whyThis: 'Allah is the Owner of all - He can change your situation in an instant.',
    moods: ['Hopeful'],
  },
  {
    id: 'quran_18_46',
    type: 'Quran',
    primaryText:
      "al-mālu wal-banūna zīnatu l-ḥayati l-dun'yā wal-bāqiyātu l-ṣāliḥātu khayrun ʿinda rabbika thawāban wakhayrun amalan",
    arabicText:
      'ٱلْمَالُ وَٱلْبَنُونَ زِينَةُ ٱلْحَيَوٰةِ ٱلدُّنْيَا ۖ وَٱلْبَـٰقِيَـٰتُ ٱلصَّـٰلِحَـٰتُ خَيْرٌ عِندَ رَبِّكَ ثَوَابًۭا وَخَيْرٌ أَمَلًۭا ﴿46﴾',
    transliteration:
      "al-mālu wal-banūna zīnatu l-ḥayati l-dun'yā wal-bāqiyātu l-ṣāliḥātu khayrun ʿinda rabbika thawāban wakhayrun amalan",
    englishTranslation:
      'Wealth and children are the adornment of the life of this world. But the enduring good deeds are better to your Lord for reward and better for hope.',
    source: 'Surah Al-Kahf 18:46',
    audioKey: '18:46',
    whyThis: 'Good deeds last forever - your hope lies in what endures with Allah.',
    moods: ['Hopeful'],
  },
  {
    id: 'quran_17_11',
    type: 'Quran',
    primaryText: 'wayadʿu l-insānu bil-shari duʿāahu bil-khayri wakāna l-insānu ʿajūlan',
    arabicText:
      'وَيَدْعُ ٱلْإِنسَـٰنُ بِٱلشَّرِّ دُعَآءَهُۥ بِٱلْخَيْرِ ۖ وَكَانَ ٱلْإِنسَـٰنُ عَجُولًۭا ﴿11﴾',
    transliteration: 'wayadʿu l-insānu bil-shari duʿāahu bil-khayri wakāna l-insānu ʿajūlan',
    englishTranslation:
      'And man supplicates for evil as he supplicates for good, and man is ever hasty.',
    source: 'Surah Al-Isra 17:11',
    audioKey: '17:11',
    whyThis: "Be patient - don't rush. Allah's timing is perfect even when we want results now.",
    moods: ['Hopeful'],
  },
  {
    id: 'quran_21_90',
    type: 'Quran',
    primaryText:
      "fa-is'tajabnā lahu wawahabnā lahu yaḥyā wa-aṣlaḥnā lahu zawjahu innahum kānū yusāriʿūna fī l-khayrāti wayadʿūnanā raghaban warahaban wakānū lanā khāshiʿīna",
    arabicText:
      'فَٱسْتَجَبْنَا لَهُۥ وَوَهَبْنَا لَهُۥ يَحْيَىٰ وَأَصْلَحْنَا لَهُۥ زَوْجَهُۥٓ ۚ إِنَّهُمْ كَانُوا۟ يُسَـٰرِعُونَ فِى ٱلْخَيْرَٰتِ وَيَدْعُونَنَا رَغَبًۭا وَرَهَبًۭا ۖ وَكَانُوا۟ لَنَا خَـٰشِعِينَ ﴿90﴾',
    transliteration:
      "fa-is'tajabnā lahu wawahabnā lahu yaḥyā wa-aṣlaḥnā lahu zawjahu innahum kānū yusāriʿūna fī l-khayrāti wayadʿūnanā raghaban warahaban wakānū lanā khāshiʿīna",
    englishTranslation:
      'So We responded to him and bestowed upon him Yahya, and cured his wife for him. Indeed, they used to hasten in good deeds, and they supplicated to Us in hope and fear, and they were to Us humbly submissive.',
    source: 'Surah Al-Anbiya 21:90',
    audioKey: '21:90',
    whyThis: 'The prophets combined hope with action - hasten in good while calling upon Allah.',
    moods: ['Hopeful'],
  },
  {
    id: 'quran_32_16',
    type: 'Quran',
    primaryText:
      'tatajāfā junūbuhum ʿani l-maḍājiʿi yadʿūna rabbahum khawfan waṭamaʿan wamimmā razaqnāhum yunfiqūna',
    arabicText:
      'تَتَجَافَىٰ جُنُوبُهُمْ عَنِ ٱلْمَضَاجِعِ يَدْعُونَ رَبَّهُمْ خَوْفًۭا وَطَمَعًۭا وَمِمَّا رَزَقْنَـٰهُمْ يُنفِقُونَ ﴿16﴾',
    transliteration:
      'tatajāfā junūbuhum ʿani l-maḍājiʿi yadʿūna rabbahum khawfan waṭamaʿan wamimmā razaqnāhum yunfiqūna',
    englishTranslation:
      'Their sides forsake their beds; they call upon their Lord in fear and hope, and from what We have provided them, they spend.',
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
      "alladhīna āmanū wataṭma-innu qulūbuhum bidhik'ri l-lahi alā bidhik'ri l-lahi taṭma-innu l-qulūbu",
    arabicText:
      'ٱلَّذِينَ ءَامَنُوا۟ وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ ٱللَّهِ ۗ أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ ﴿28﴾',
    transliteration:
      "alladhīna āmanū wataṭma-innu qulūbuhum bidhik'ri l-lahi alā bidhik'ri l-lahi taṭma-innu l-qulūbu",
    englishTranslation:
      'Those who believe, and whose hearts find satisfaction in the remembrance of Allah. Verily, in the remembrance of Allah do hearts find satisfaction.',
    source: "Surah Ar-Ra'd 13:28",
    audioKey: '13:28',
    whyThis: 'The word "tatma\'innu" means to settle, to become still and completely at rest — not just momentary comfort but lasting peace. The Quran identifies dhikr (remembrance of Allah) as the one substance that produces this effect in the heart. Ibn al-Qayyim wrote that the heart cannot find its true rest in anything else, no matter what else it tries. [Madarij al-Salikin]',
    moods: ['Calm', 'Lonely'],
  },
  {
    id: 'quran_89_27',
    type: 'Quran',
    primaryText: "yāayyatuhā l-nafsu l-muṭ'ma-inatu ir'jiʿī ilā rabbiki rāḍiyatan marḍiyyatan",
    arabicText:
      'يَـٰٓأَيَّتُهَا ٱلنَّفْسُ ٱلْمُطْمَئِنَّةُ ٱرْجِعِىٓ إِلَىٰ رَبِّكِ رَاضِيَةًۭ مَّرْضِيَّةًۭ ﴿27-28﴾',
    transliteration: "yāayyatuhā l-nafsu l-muṭ'ma-inatu ir'jiʿī ilā rabbiki rāḍiyatan marḍiyyatan",
    englishTranslation: 'O reassured soul, return to your Lord, well-pleased and pleasing to Him.',
    source: 'Surah Al-Fajr 89:27-28',
    audioKey: '89:27-28',
    whyThis: 'The ultimate peace is the reassured soul returning to Allah in contentment.',
    moods: ['Calm'],
  },
  {
    id: 'quran_2_45',
    type: 'Quran',
    primaryText: "wa-is'taʿīnū bil-ṣabri wal-ṣalati wa-innahā lakabīratun illā ʿalā l-khāshiʿīna",
    arabicText:
      'وَٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى ٱلْخَـٰشِعِينَ ﴿45﴾',
    transliteration:
      "wa-is'taʿīnū bil-ṣabri wal-ṣalati wa-innahā lakabīratun illā ʿalā l-khāshiʿīna",
    englishTranslation:
      'And seek help through patience and prayer; and indeed, it is difficult except for the humble ones.',
    source: 'Surah Al-Baqarah 2:45',
    audioKey: '2:45',
    whyThis: 'Prayer is a source of help and strength, though its ease is found in humility.',
    moods: ['Overwhelmed', 'Calm'],
  },
  {
    id: 'quran_6_17',
    type: 'Quran',
    primaryText:
      'wa-in yamsaska l-lahu biḍurrin falā kāshifa lahu illā huwa wa-in yamsaska bikhayrin fahuwa ʿalā kulli shayin qadīrun',
    arabicText:
      'وَإِن يَمْسَسْكَ ٱللَّهُ بِضُرٍّۢ فَلَا كَاشِفَ لَهُۥٓ إِلَّا هُوَ ۖ وَإِن يَمْسَسْكَ بِخَيْرٍۢ فَهُوَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌۭ ﴿17﴾',
    transliteration:
      'wa-in yamsaska l-lahu biḍurrin falā kāshifa lahu illā huwa wa-in yamsaska bikhayrin fahuwa ʿalā kulli shayin qadīrun',
    englishTranslation:
      'And if Allah touches you with affliction, there is no remover of it except Him. And if He touches you with good, then He is over all things All-Powerful.',
    source: "Surah Al-An'am 6:17",
    audioKey: '6:17',
    whyThis: 'Only Allah can remove hardship - turn to Him, the One with all power.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_7_188',
    type: 'Quran',
    primaryText:
      "qul lā amliku linafsī nafʿan walā ḍarran illā mā shāa l-lahu walaw kuntu aʿlamu l-ghayba la-is'takthartu mina l-khayri wamā massaniya l-sūu in anā illā nadhīrun wabashīrun liqawmin yu'minūna",
    arabicText:
      'قُل لَّآ أَمْلِكُ لِنَفْسِى نَفْعًۭا وَلَا ضَرًّا إِلَّا مَا شَآءَ ٱللَّهُ ۚ وَلَوْ كُنتُ أَعْلَمُ ٱلْغَيْبَ لَٱسْتَكْثَرْتُ مِنَ ٱلْخَيْرِ وَمَا مَسَّنِىَ ٱلسُّوٓءُ ۚ إِنْ أَنَا۠ إِلَّا نَذِيرٌۭ وَبَشِيرٌۭ لِّقَوْمٍۢ يُؤْمِنُونَ ﴿188﴾',
    transliteration:
      "qul lā amliku linafsī nafʿan walā ḍarran illā mā shāa l-lahu walaw kuntu aʿlamu l-ghayba la-is'takthartu mina l-khayri wamā massaniya l-sūu in anā illā nadhīrun wabashīrun liqawmin yu'minūna",
    englishTranslation:
      'Say, "I hold not for myself the power of benefit or harm, except what Allah has willed. And if I knew the unseen, I could have acquired much good, and no harm would have touched me. I am not except a warner and a bringer of good tidings to a people who believe."',
    translation:
      'The Prophet Muhammad ﷺ was told to say: "I have no power to benefit or harm even myself — only what Allah wills. If I knew the future, I would have gathered only good for myself, and no hardship would have touched me. I am only a messenger: one who warns, and one who brings good news to those who believe."',
    source: "Surah Al-A'raf 7:188",
    audioKey: '7:188',
    whyThis: 'Let go of the illusion of control - only what Allah wills happens.',
    moods: ['Overwhelmed'],
  },

  {
    id: 'quran_42_30',
    type: 'Quran',
    primaryText: 'wamā aṣābakum min muṣībatin fabimā kasabat aydīkum wayaʿfū ʿan kathīrin',
    arabicText:
      'وَمَآ أَصَـٰبَكُم مِّن مُّصِيبَةٍۢ فَبِمَا كَسَبَتْ أَيْدِيكُمْ وَيَعْفُوا۟ عَن كَثِيرٍۢ ﴿30﴾',
    transliteration: 'wamā aṣābakum min muṣībatin fabimā kasabat aydīkum wayaʿfū ʿan kathīrin',
    englishTranslation:
      'And whatever misfortune befalls you, it is because of what your hands have earned. But He pardons much.',
    source: 'Surah Ash-Shura 42:30',
    audioKey: '42:30',
    whyThis: 'Trials are often expiation - and Allah pardons even more than what befalls us.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_27_62',
    type: 'Quran',
    primaryText:
      "amman yujību l-muḍ'ṭara idhā daʿāhu wayakshifu l-sūa wayajʿalukum khulafāa l-arḍi a-ilāhun maʿa l-lahi qalīlan mā tadhakkarūna",
    arabicText:
      'أَمَّن يُجِيبُ ٱلْمُضْطَرَّ إِذَا دَعَاهُ وَيَكْشِفُ ٱلسُّوٓءَ وَيَجْعَلُكُمْ خُلَفَآءَ ٱلْأَرْضِ ۗ أَءِلَـٰهٌۭ مَّعَ ٱللَّهِ ۚ قَلِيلًۭا مَّا تَذَكَّرُونَ ﴿62﴾',
    transliteration:
      "amman yujību l-muḍ'ṭara idhā daʿāhu wayakshifu l-sūa wayajʿalukum khulafāa l-arḍi a-ilāhun maʿa l-lahi qalīlan mā tadhakkarūna",
    englishTranslation:
      'Or, Who responds to the distressed one when he calls upon Him and removes the evil, and makes you inheritors of the earth? Is there any god with Allah? Little do you remember.',
    source: 'Surah An-Naml 27:62',
    audioKey: '27:62',
    whyThis: 'The word "mudhtar" (the distressed one) refers specifically to someone in a state of desperate need — a person who has no other option and no other door. This verse singles out precisely that person as the one Allah responds to. Your desperation is not a barrier to being heard; it is the very state in which Allah\'s response is most certain.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_21_82',
    type: 'Quran',
    primaryText:
      'wamina l-shayāṭīni man yaghūṣūna lahu wayaʿmalūna ʿamalan dūna dhālika wakunnā lahum ḥāfiẓīna wa-ayyūba idh nādā rabbahu annī massaniya l-ḍuru wa-anta arḥamu l-rāḥimīna',
    arabicText:
      'وَمِنَ ٱلشَّيَـٰطِينِ مَن يَغُوصُونَ لَهُۥ وَيَعْمَلُونَ عَمَلًۭا دُونَ ذَٰلِكَ ۖ وَكُنَّا لَهُمْ حَـٰفِظِينَ ۞ وَأَيُّوبَ إِذْ نَادَىٰ رَبَّهُۥٓ أَنِّى مَسَّنِىَ ٱلضُّرُّ وَأَنتَ أَرْحَمُ ٱلرَّٰحِمِينَ ﴿82-83﴾',
    transliteration:
      'wamina l-shayāṭīni man yaghūṣūna lahu wayaʿmalūna ʿamalan dūna dhālika wakunnā lahum ḥāfiẓīna wa-ayyūba idh nādā rabbahu annī massaniya l-ḍuru wa-anta arḥamu l-rāḥimīna',
    englishTranslation:
      'And of the devils were some who would dive for him and do other work, and We were of them Guardians. And Ayub, when he called to his Lord, "Indeed, adversity has touched me, and You are the Most Merciful of the merciful."',
    translation:
      'Among the jinn, some would dive into the sea for Prophet Sulayman (Solomon) and carry out other tasks; and We kept watch over them all. And remember Prophet Ayyub (Job), when he cried out to his Lord: "Hardship has truly afflicted me — and You are the Most Merciful of all who show mercy."',
    source: 'Surah Al-Anbiya 21:82-83',
    audioKey: '21:82-83',
    whyThis: "The du'a of Ayyub (AS) - acknowledge the hardship, then turn to the Most Merciful.",
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_9_51',
    type: 'Quran',
    primaryText:
      "qul lan yuṣībanā illā mā kataba l-lahu lanā huwa mawlānā waʿalā l-lahi falyatawakkali l-mu'minūna",
    arabicText:
      'قُل لَّن يُصِيبَنَآ إِلَّا مَا كَتَبَ ٱللَّهُ لَنَا هُوَ مَوْلَىٰنَا ۚ وَعَلَى ٱللَّهِ فَلْيَتَوَكَّلِ ٱلْمُؤْمِنُونَ ﴿51﴾',
    transliteration:
      "qul lan yuṣībanā illā mā kataba l-lahu lanā huwa mawlānā waʿalā l-lahi falyatawakkali l-mu'minūna",
    englishTranslation:
      'Say, "Never will anything befall us except what Allah has decreed for us; He is our Protector." And upon Allah let the believers put their trust.',
    source: 'Surah At-Tawbah 9:51',
    audioKey: '9:51',
    whyThis: 'This declaration — "lan yusibanana illa ma kataba Allahu lana" (nothing will befall us except what Allah has written for us) — turns the believer\'s relationship to fear upside down. What you are afraid of can only happen if Allah has already written it. And if He has written it, He is also your Mawla (Protector) who will carry you through it.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_48_4',
    type: 'Quran',
    primaryText:
      "huwa alladhī anzala l-sakīnata fī qulūbi l-mu'minīna liyazdādū īmānan maʿa īmānihim walillahi junūdu l-samāwāti wal-arḍi wakāna l-lahu ʿalīman ḥakīman",
    arabicText:
      'هُوَ ٱلَّذِىٓ أَنزَلَ ٱلسَّكِينَةَ فِى قُلُوبِ ٱلْمُؤْمِنِينَ لِيَزْدَادُوٓا۟ إِيمَـٰنًۭا مَّعَ إِيمَـٰنِهِمْ ۗ وَلِلَّهِ جُنُودُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضِ ۚ وَكَانَ ٱللَّهُ عَلِيمًا حَكِيمًۭا ﴿4﴾',
    transliteration:
      "huwa alladhī anzala l-sakīnata fī qulūbi l-mu'minīna liyazdādū īmānan maʿa īmānihim walillahi junūdu l-samāwāti wal-arḍi wakāna l-lahu ʿalīman ḥakīman",
    englishTranslation:
      'He is the One Who sent down tranquility into the hearts of the believers, that they may increase in faith along with their faith. And to Allah belong the hosts of the heavens and the earth, and Allah is All-Knower, All-Wise.',
    source: 'Surah Al-Fath 48:4',
    audioKey: '48:4',
    whyThis: 'Allah Himself sends sakinah (tranquility) to the hearts of believers.',
    moods: ['Calm'],
  },
  {
    id: 'quran_30_21',
    type: 'Quran',
    primaryText:
      'wamin āyātihi an khalaqa lakum min anfusikum azwājan litaskunū ilayhā wajaʿala baynakum mawaddatan waraḥmatan inna fī dhālika laāyātin liqawmin yatafakkarūna',
    arabicText:
      'وَمِنْ ءَايَـٰتِهِۦٓ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًۭا لِّتَسْكُنُوٓا۟ إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةًۭ وَرَحْمَةً ۚ إِنَّ فِى ذَٰلِكَ لَـَٔايَـٰتٍۢ لِّقَوْمٍۢ يَتَفَكَّرُونَ ﴿21﴾',
    transliteration:
      'wamin āyātihi an khalaqa lakum min anfusikum azwājan litaskunū ilayhā wajaʿala baynakum mawaddatan waraḥmatan inna fī dhālika laāyātin liqawmin yatafakkarūna',
    englishTranslation:
      'And among His signs is that He created for you from yourselves mates that you may find tranquility in them, and He placed between you love and mercy. Indeed, in that are surely signs for a people who reflect.',
    source: 'Surah Ar-Rum 30:21',
    audioKey: '30:21',
    whyThis: 'Tranquility (sakinah) is a divine gift placed between hearts in marriage.',
    moods: ['Calm', 'Grateful'],
  },
  {
    id: 'quran_48_18',
    type: 'Quran',
    primaryText:
      "laqad raḍiya l-lahu ʿani l-mu'minīna idh yubāyiʿūnaka taḥta l-shajarati faʿalima mā fī qulūbihim fa-anzala l-sakīnata ʿalayhim wa-athābahum fatḥan qarīban",
    arabicText:
      '۞ لَّقَدْ رَضِىَ ٱللَّهُ عَنِ ٱلْمُؤْمِنِينَ إِذْ يُبَايِعُونَكَ تَحْتَ ٱلشَّجَرَةِ فَعَلِمَ مَا فِى قُلُوبِهِمْ فَأَنزَلَ ٱلسَّكِينَةَ عَلَيْهِمْ وَأَثَـٰبَهُمْ فَتْحًۭا قَرِيبًۭا ﴿18﴾',
    transliteration:
      "laqad raḍiya l-lahu ʿani l-mu'minīna idh yubāyiʿūnaka taḥta l-shajarati faʿalima mā fī qulūbihim fa-anzala l-sakīnata ʿalayhim wa-athābahum fatḥan qarīban",
    englishTranslation:
      'Certainly was Allah pleased with the believers when they pledged allegiance to you under the tree, and He knew what was in their hearts, so He sent down tranquility upon them and rewarded them with a near victory.',
    translation:
      'Allah was truly pleased with the believers when they pledged their loyalty to the Prophet Muhammad ﷺ at Hudaybiyyah, beneath a tree. He knew the sincerity in their hearts; so He sent down tranquility upon them, and rewarded them with a victory that was soon to come.',
    source: 'Surah Al-Fath 48:18',
    audioKey: '48:18',
    whyThis: 'At Hudaybiyyah, the companions pledged their lives to the Prophet ﷺ beneath a tree. Allah responded to the sincerity He saw in their hearts by sending sakinah (tranquility) upon them and promising a near victory. Sincerity of heart draws tranquility from Allah — and the victory that follows belongs to Him to give.',
    moods: ['Calm'],
  },
  {
    id: 'quran_2_208',
    type: 'Quran',
    primaryText:
      "yāayyuhā alladhīna āmanū ud'khulū fī l-sil'mi kāffatan walā tattabiʿū khuṭuwāti l-shayṭāni innahu lakum ʿaduwwun mubīnun",
    arabicText:
      'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱدْخُلُوا۟ فِى ٱلسِّلْمِ كَآفَّةًۭ وَلَا تَتَّبِعُوا۟ خُطُوَٰتِ ٱلشَّيْطَـٰنِ ۚ إِنَّهُۥ لَكُمْ عَدُوٌّۭ مُّبِينٌۭ ﴿208﴾',
    transliteration:
      "yāayyuhā alladhīna āmanū ud'khulū fī l-sil'mi kāffatan walā tattabiʿū khuṭuwāti l-shayṭāni innahu lakum ʿaduwwun mubīnun",
    englishTranslation:
      'O you who believe, enter into Islam completely, and do not follow the footsteps of Satan. Indeed, he is to you a clear enemy.',
    source: 'Surah Al-Baqarah 2:208',
    audioKey: '2:208',
    whyThis: 'The word "silm" in this verse means both Islam and peace — they share the same Arabic root. Entering Islam "kaffah" (completely) means living in wholeness and integration, not compartmentalizing faith. When you surrender your whole self to Allah, the internal conflict that creates anxiety diminishes and real peace is possible.',
    moods: ['Calm'],
  },
  {
    id: 'quran_6_54',
    type: 'Quran',
    primaryText:
      "wa-idhā jāaka alladhīna yu'minūna biāyātinā faqul salāmun ʿalaykum kataba rabbukum ʿalā nafsihi l-raḥmata annahu man ʿamila minkum sūan bijahālatin thumma tāba min baʿdihi wa-aṣlaḥa fa-annahu ghafūrun raḥīmun",
    arabicText:
      'وَإِذَا جَآءَكَ ٱلَّذِينَ يُؤْمِنُونَ بِـَٔايَـٰتِنَا فَقُلْ سَلَـٰمٌ عَلَيْكُمْ ۖ كَتَبَ رَبُّكُمْ عَلَىٰ نَفْسِهِ ٱلرَّحْمَةَ ۖ أَنَّهُۥ مَنْ عَمِلَ مِنكُمْ سُوٓءًۢا بِجَهَـٰلَةٍۢ ثُمَّ تَابَ مِنۢ بَعْدِهِۦ وَأَصْلَحَ فَأَنَّهُۥ غَفُورٌۭ رَّحِيمٌۭ ﴿54﴾',
    transliteration:
      "wa-idhā jāaka alladhīna yu'minūna biāyātinā faqul salāmun ʿalaykum kataba rabbukum ʿalā nafsihi l-raḥmata annahu man ʿamila minkum sūan bijahālatin thumma tāba min baʿdihi wa-aṣlaḥa fa-annahu ghafūrun raḥīmun",
    englishTranslation:
      'And when those who believe in Our verses come to you, say, "Peace be upon you. Your Lord has prescribed upon Himself mercy: that any of you who does evil in ignorance and then repents and reforms — then indeed, He is Oft-Forgiving, Most Merciful."',
    source: "Surah Al-An'am 6:54",
    audioKey: '6:54',
    whyThis: 'Allah greets the believers with peace and has obligated mercy upon Himself.',
    moods: ['Calm'],
  },
  {
    id: 'quran_16_32',
    type: 'Quran',
    primaryText:
      "alladhīna tatawaffāhumu l-malāikatu ṭayyibīna yaqūlūna salāmun ʿalaykumu ud'khulū l-janata bimā kuntum taʿmalūna",
    arabicText:
      'ٱلَّذِينَ تَتَوَفَّىٰهُمُ ٱلْمَلَـٰٓئِكَةُ طَيِّبِينَ ۙ يَقُولُونَ سَلَـٰمٌ عَلَيْكُمُ ٱدْخُلُوا۟ ٱلْجَنَّةَ بِمَا كُنتُمْ تَعْمَلُونَ ﴿32﴾',
    transliteration:
      "alladhīna tatawaffāhumu l-malāikatu ṭayyibīna yaqūlūna salāmun ʿalaykumu ud'khulū l-janata bimā kuntum taʿmalūna",
    englishTranslation:
      'Those whom the angels take in death while they are pure, saying, "Peace be upon you. Enter Paradise for what you used to do."',
    translation:
      'The righteous — those whose souls the angels take gently, while they are in a state of goodness — the angels greet them, saying: "Peace be upon you. Enter Paradise, as a reward for the good you used to do."',
    source: 'Surah An-Nahl 16:32',
    audioKey: '16:32',
    whyThis: 'The moment of death is described here as entirely peaceful for the righteous — the angels greet them with salam. This verse is a reminder that the life you build now shapes the manner in which you will leave it. A heart at peace in this life is being prepared for a peaceful return to Allah.',
    moods: ['Calm'],
  },
  {
    id: 'quran_36_58',
    type: 'Quran',
    primaryText: 'salāmun qawlan min rabbin raḥīmin',
    arabicText: 'سَلَـٰمٌۭ قَوْلًۭا مِّن رَّبٍّۢ رَّحِيمٍۢ ﴿58﴾',
    transliteration: 'salāmun qawlan min rabbin raḥīmin',
    englishTranslation: '"Peace" — a word from a Most Merciful Lord.',
    source: 'Surah Ya-Sin 36:58',
    audioKey: '36:58',
    whyThis: 'The ultimate greeting of peace comes directly from the Lord of Mercy Himself.',
    moods: ['Calm'],
  },
  {
    id: 'quran_97_5',
    type: 'Quran',
    primaryText: 'salāmun hiya ḥattā maṭlaʿi l-fajri',
    arabicText: 'سَلَـٰمٌ هِىَ حَتَّىٰ مَطْلَعِ ٱلْفَجْرِ ﴿5﴾',
    transliteration: 'salāmun hiya ḥattā maṭlaʿi l-fajri',
    englishTranslation: 'Peace it is, until the emergence of dawn.',
    translation:
      'Laylat al-Qadr — the Night of Power; a single night in Ramadan, worth more than a thousand months — is nothing but peace: from dusk, until the break of dawn.',
    source: 'Surah Al-Qadr 97:5',
    audioKey: '97:5',
    whyThis: 'Laylatul Qadr is pure peace - a night that is entirely salam until dawn.',
    moods: ['Calm'],
  },
  {
    id: 'quran_56_91',
    type: 'Quran',
    primaryText: 'fasalāmun laka min aṣḥābi l-yamīni',
    arabicText: 'فَسَلَـٰمٌۭ لَّكَ مِنْ أَصْحَـٰبِ ٱلْيَمِينِ ﴿91﴾',
    transliteration: 'fasalāmun laka min aṣḥābi l-yamīni',
    englishTranslation: 'Then peace for you, from the companions of the right.',
    translation:
      'For the righteous — those destined for Paradise — there is nothing but peace; a greeting of "Salam."',
    source: "Surah Al-Waqi'ah 56:91",
    audioKey: '56:91',
    whyThis: 'On the Day of Judgment, when the companions of the right hand receive their books, they are met with salam — pure peace. This is the ultimate destination of every striving believer: not only freedom from punishment, but the gift of divine peace itself as their welcome.',
    moods: ['Calm'],
  },

  {
    id: 'quran_93_11',
    type: 'Quran',
    primaryText: "wa-ammā biniʿ'mati rabbika faḥaddith",
    arabicText: 'وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ ﴿11﴾',
    transliteration: "wa-ammā biniʿ'mati rabbika faḥaddith",
    englishTranslation: 'But as for the favor of your Lord, proclaim it.',
    source: 'Surah Ad-Duha 93:11',
    audioKey: '93:11',
    whyThis: 'Speak of your blessings - sharing gratitude amplifies contentment.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_55_13',
    type: 'Quran',
    primaryText: 'fabi-ayyi ālāi rabbikumā tukadhibāni',
    arabicText: 'فَبِأَىِّ ءَالَآءِ رَبِّكُمَا تُكَذِّبَانِ ﴿13﴾',
    transliteration: 'fabi-ayyi ālāi rabbikumā tukadhibāni',
    englishTranslation: 'So which of the favors of your Lord would you deny?',
    source: 'Surah Ar-Rahman 55:13',
    audioKey: '55:13',
    whyThis: 'This rhetorical question is repeated 31 times throughout Surah Ar-Rahman — addressed to both humans and jinn. Each repetition follows a description of a divine blessing. The repetition is an invitation to pause and acknowledge, not a rebuke. It asks: of all that you have been given, what is there to deny?',
    moods: ['Grateful'],
  },

  {
    id: 'quran_5_3',
    type: 'Quran',
    primaryText:
      "ḥurrimat ʿalaykumu l-maytatu wal-damu walaḥmu l-khinzīri wamā uhilla lighayri l-lahi bihi wal-mun'khaniqatu wal-mawqūdhatu wal-mutaradiyatu wal-naṭīḥatu wamā akala l-sabuʿu illā mā dhakkaytum wamā dhubiḥa ʿalā l-nuṣubi wa-an tastaqsimū bil-azlāmi dhālikum fis'qun l-yawma ya-isa alladhīna kafarū min dīnikum falā takhshawhum wa-ikh'shawni l-yawma akmaltu lakum dīnakum wa-atmamtu ʿalaykum niʿ'matī waraḍītu lakumu l-is'lāma dīnan famani uḍ'ṭurra fī makhmaṣatin ghayra mutajānifin li-ith'min fa-inna l-laha ghafūrun raḥīmun",
    arabicText:
      'حُرِّمَتْ عَلَيْكُمُ ٱلْمَيْتَةُ وَٱلدَّمُ وَلَحْمُ ٱلْخِنزِيرِ وَمَآ أُهِلَّ لِغَيْرِ ٱللَّهِ بِهِۦ وَٱلْمُنْخَنِقَةُ وَٱلْمَوْقُوذَةُ وَٱلْمُتَرَدِّيَةُ وَٱلنَّطِيحَةُ وَمَآ أَكَلَ ٱلسَّبُعُ إِلَّا مَا ذَكَّيْتُمْ وَمَا ذُبِحَ عَلَى ٱلنُّصُبِ وَأَن تَسْتَقْسِمُوا۟ بِٱلْأَزْلَـٰمِ ۚ ذَٰلِكُمْ فِسْقٌ ۗ ٱلْيَوْمَ يَئِسَ ٱلَّذِينَ كَفَرُوا۟ مِن دِينِكُمْ فَلَا تَخْشَوْهُمْ وَٱخْشَوْنِ ۚ ٱلْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ وَأَتْمَمْتُ عَلَيْكُمْ نِعْمَتِى وَرَضِيتُ لَكُمُ ٱلْإِسْلَـٰمَ دِينًۭا ۚ فَمَنِ ٱضْطُرَّ فِى مَخْمَصَةٍ غَيْرَ مُتَجَانِفٍۢ لِّإِثْمٍۢ ۙ فَإِنَّ ٱللَّهَ غَفُورٌۭ رَّحِيمٌۭ ﴿3﴾',
    transliteration:
      "ḥurrimat ʿalaykumu l-maytatu wal-damu walaḥmu l-khinzīri wamā uhilla lighayri l-lahi bihi wal-mun'khaniqatu wal-mawqūdhatu wal-mutaradiyatu wal-naṭīḥatu wamā akala l-sabuʿu illā mā dhakkaytum wamā dhubiḥa ʿalā l-nuṣubi wa-an tastaqsimū bil-azlāmi dhālikum fis'qun l-yawma ya-isa alladhīna kafarū min dīnikum falā takhshawhum wa-ikh'shawni l-yawma akmaltu lakum dīnakum wa-atmamtu ʿalaykum niʿ'matī waraḍītu lakumu l-is'lāma dīnan famani uḍ'ṭurra fī makhmaṣatin ghayra mutajānifin li-ith'min fa-inna l-laha ghafūrun raḥīmun",
    englishTranslation:
      'Prohibited to you are dead animals, blood, the flesh of swine, and that which has been dedicated to other than Allah, and the strangled, the struck, the fallen, the gored, and that which a wild animal has eaten — except what you slaughter — and that which is sacrificed on stone altars, and that you seek decision through divining arrows. That is grave disobedience. This day those who disbelieve have despaired of your religion, so do not fear them but fear Me. This day I have perfected for you your religion, completed My favor upon you, and have approved for you Islam as a religion. But whoever is forced by severe hunger with no inclination to sin, then indeed Allah is Oft-Forgiving, Most Merciful.',
    source: 'Surah Al-Maidah 5:3',
    audioKey: '5:3',
    whyThis: 'Islam itself is the ultimate blessing - a complete, perfected favor from Allah.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_28_73',
    type: 'Quran',
    primaryText:
      'wamin raḥmatihi jaʿala lakumu al-layla wal-nahāra litaskunū fīhi walitabtaghū min faḍlihi walaʿallakum tashkurūna',
    arabicText:
      'وَمِن رَّحْمَتِهِۦ جَعَلَ لَكُمُ ٱلَّيْلَ وَٱلنَّهَارَ لِتَسْكُنُوا۟ فِيهِ وَلِتَبْتَغُوا۟ مِن فَضْلِهِۦ وَلَعَلَّكُمْ تَشْكُرُونَ ﴿73﴾',
    transliteration:
      'wamin raḥmatihi jaʿala lakumu al-layla wal-nahāra litaskunū fīhi walitabtaghū min faḍlihi walaʿallakum tashkurūna',
    englishTranslation:
      'And from His mercy, He made for you the night and the day, that you may rest therein and that you may seek from His bounty, and so that you may be grateful.',
    source: 'Surah Al-Qasas 28:73',
    audioKey: '28:73',
    whyThis: 'The alternation of night and day is described here as an act of mercy — rest and work, stillness and activity, both designed for you. Even the rhythms of nature are framed as a reason for gratitude. This verse invites you to see the most ordinary parts of your day as deliberate gifts from a merciful Lord.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_2_152',
    type: 'Quran',
    primaryText: "fa-udh'kurūnī adhkur'kum wa-ush'kurū lī walā takfurūni",
    arabicText: 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ وَٱشْكُرُوا۟ لِى وَلَا تَكْفُرُونِ ﴿152﴾',
    transliteration: "fa-udh'kurūnī adhkur'kum wa-ush'kurū lī walā takfurūni",
    englishTranslation:
      'So remember Me; I will remember you. And be grateful to Me, and do not be ungrateful to Me.',
    source: 'Surah Al-Baqarah 2:152',
    audioKey: '2:152',
    whyThis: '"Udhkuruni adhkurkum" — remember Me, and I will remember you. This is a remarkable divine reciprocity: Allah promises to remember you in response to your remembering Him. The Prophet ﷺ said that Allah said: "If he remembers Me within himself, I remember him within Myself; and if he remembers Me in a gathering, I remember him in a better gathering." [Bukhari 7405]',
    moods: ['Grateful', 'Lonely'],
  },
  {
    id: 'quran_2_186',
    type: 'Quran',
    primaryText:
      "wa-idhā sa-alaka ʿibādī ʿannī fa-innī qarībun ujību daʿwata l-dāʿi idhā daʿāni falyastajībū lī walyu'minū bī laʿallahum yarshudūna",
    arabicText:
      'وَإِذَا سَأَلَكَ عِبَادِى عَنِّى فَإِنِّى قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ ٱلدَّاعِ إِذَا دَعَانِ ۖ فَلْيَسْتَجِيبُوا۟ لِى وَلْيُؤْمِنُوا۟ بِى لَعَلَّهُمْ يَرْشُدُونَ ﴿186﴾',
    transliteration:
      "wa-idhā sa-alaka ʿibādī ʿannī fa-innī qarībun ujību daʿwata l-dāʿi idhā daʿāni falyastajībū lī walyu'minū bī laʿallahum yarshudūna",
    englishTranslation:
      'And when My servants ask you concerning Me, indeed I am near. I respond to the invocation of the supplicant when he calls upon Me. So let them respond to Me and believe in Me, that they may be rightly guided.',
    source: 'Surah Al-Baqarah 2:186',
    audioKey: '2:186',
    whyThis: 'This verse was placed by Allah immediately within the verses about Ramadan — a deliberate signal that du\'a and closeness to Allah are at the heart of worship. "Fa-inni qarib" (Indeed I am near) uses no intermediary: Allah speaks in the first person, directly, without "say." Ibn Kathir notes this was to emphasize the immediacy and personal nature of Allah\'s closeness to every servant who calls. [Tafsir Ibn Kathir, Surah Al-Baqarah]',
    moods: ['Overwhelmed', 'Sad', 'Lonely'],
  },

  {
    id: 'quran_20_25',
    type: 'Quran',
    primaryText: "qāla rabbi ish'raḥ lī ṣadrī wayassir lī amrī",
    arabicText: 'قَالَ رَبِّ ٱشْرَحْ لِى صَدْرِى وَيَسِّرْ لِىٓ أَمْرِى ﴿25-26﴾',
    transliteration: "qāla rabbi ish'raḥ lī ṣadrī wayassir lī amrī",
    englishTranslation: 'He said, "My Lord, expand for me my breast, and ease for me my task."',
    translation:
      'Prophet Musa (Moses) — when Allah gave him the mission to confront Pharaoh — prayed: "My Lord, open up my heart for me, and make my task easy."',
    source: 'Surah Taha 20:25-26',
    audioKey: '20:25-26',
    whyThis: 'Musa (AS) was given one of the most daunting missions in history — to stand before Pharaoh — yet his first response was to make du\'a for an open heart and easy task. This is a model for every believer who feels overwhelmed by what lies ahead: begin with du\'a, ask Allah to prepare you internally before you engage externally.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_40_44',
    type: 'Quran',
    primaryText:
      'fasatadhkurūna mā aqūlu lakum wa-ufawwiḍu amrī ilā l-lahi inna l-laha baṣīrun bil-ʿibādi',
    arabicText:
      'فَسَتَذْكُرُونَ مَآ أَقُولُ لَكُمْ ۚ وَأُفَوِّضُ أَمْرِىٓ إِلَى ٱللَّهِ ۚ إِنَّ ٱللَّهَ بَصِيرٌۢ بِٱلْعِبَادِ ﴿44﴾',
    transliteration:
      'fasatadhkurūna mā aqūlu lakum wa-ufawwiḍu amrī ilā l-lahi inna l-laha baṣīrun bil-ʿibādi',
    englishTranslation:
      'And you will remember what I say to you. And I entrust my affair to Allah. Indeed, Allah is All-Seeing of His slaves.',
    translation:
      'A believing man from Pharaoh\'s own people — who had been hiding his faith — stood up and warned them: "You will remember what I am telling you. As for me, I entrust my affair entirely to Allah. Indeed, Allah sees all that His servants do."',
    source: 'Surah Ghafir 40:44',
    audioKey: '40:44',
    whyThis: 'A man who had hidden his faith in the court of Pharaoh finally spoke up, warned his people, and then said: "I entrust my affair to Allah." He did what was required of him — spoke truth — then released the outcome. This is the practical meaning of tawakkul: act with what you have, then place the results with Allah.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_2_153',
    type: 'Quran',
    primaryText:
      "yāayyuhā alladhīna āmanū is'taʿīnū bil-ṣabri wal-ṣalati inna l-laha maʿa l-ṣābirīna",
    arabicText:
      'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ ۚ إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ ﴿153﴾',
    transliteration:
      "yāayyuhā alladhīna āmanū is'taʿīnū bil-ṣabri wal-ṣalati inna l-laha maʿa l-ṣābirīna",
    englishTranslation:
      'O you who believe, seek help through patience and prayer. Indeed, Allah is with the patient.',
    source: 'Surah Al-Baqarah 2:153',
    audioKey: '2:153',
    whyThis: 'The Prophet ﷺ would turn to prayer whenever something distressed him. [Abu Dawud 1319] This verse prescribes a two-part remedy for difficulty: sabr (patient endurance) and salah (prayer). Together they form the believer\'s toolkit for every hardship — one internal, one relational — and the promise is that Allah\'s company (ma\'iyyah) accompanies those who hold to both.',
    moods: ['Overwhelmed', 'Lonely'],
  },
  {
    id: 'quran_41_30',
    type: 'Quran',
    primaryText:
      "inna alladhīna qālū rabbunā l-lahu thumma is'taqāmū tatanazzalu ʿalayhimu l-malāikatu allā takhāfū walā taḥzanū wa-abshirū bil-janati allatī kuntum tūʿadūna",
    arabicText:
      'إِنَّ ٱلَّذِينَ قَالُوا۟ رَبُّنَا ٱللَّهُ ثُمَّ ٱسْتَقَـٰمُوا۟ تَتَنَزَّلُ عَلَيْهِمُ ٱلْمَلَـٰٓئِكَةُ أَلَّا تَخَافُوا۟ وَلَا تَحْزَنُوا۟ وَأَبْشِرُوا۟ بِٱلْجَنَّةِ ٱلَّتِى كُنتُمْ تُوعَدُونَ ﴿30﴾',
    transliteration:
      "inna alladhīna qālū rabbunā l-lahu thumma is'taqāmū tatanazzalu ʿalayhimu l-malāikatu allā takhāfū walā taḥzanū wa-abshirū bil-janati allatī kuntum tūʿadūna",
    englishTranslation:
      'Indeed, those who say, "Our Lord is Allah," and then remain steadfast — the angels will descend upon them, saying, "Do not fear and do not grieve, but receive the glad tidings of Paradise which you were promised."',
    source: 'Surah Fussilat 41:30',
    audioKey: '41:30',
    whyThis: 'The angels descend on those who combine two things: the declaration of faith and istiqamah (steadfastness). The angels address both emotions at once — "Do not fear" (for the future) and "do not grieve" (over the past). This verse is a direct divine response to anxiety and sadness, delivered by the angels to every sincere believer.',
    moods: ['Sad', 'Overwhelmed', 'Lonely'],
  },
  {
    id: 'quran_20_46',
    type: 'Quran',
    primaryText: 'qāla lā takhāfā innanī maʿakumā asmaʿu wa-arā',
    arabicText: 'قَالَ لَا تَخَافَآ ۖ إِنَّنِى مَعَكُمَآ أَسْمَعُ وَأَرَىٰ ﴿46﴾',
    transliteration: 'qāla lā takhāfā innanī maʿakumā asmaʿu wa-arā',
    englishTranslation: 'He said, "Do not fear. Indeed, I am with you both; I hear and I see."',
    translation:
      'When Allah sent Prophet Musa and his brother Harun to confront Pharaoh, they were afraid. Allah reassured them: "Do not fear. I am with you both; I hear everything, and I see everything."',
    source: 'Surah Taha 20:46',
    audioKey: '20:46',
    whyThis: 'Allah is witnessing your struggle directly. You are never unseen or unheard.',
    moods: ['Sad', 'Overwhelmed', 'Lonely'],
  },

  {
    id: 'quran_8_33',
    type: 'Quran',
    primaryText:
      'wamā kāna l-lahu liyuʿadhibahum wa-anta fīhim wamā kāna l-lahu muʿadhibahum wahum yastaghfirūna',
    arabicText:
      'وَمَا كَانَ ٱللَّهُ لِيُعَذِّبَهُمْ وَأَنتَ فِيهِمْ ۚ وَمَا كَانَ ٱللَّهُ مُعَذِّبَهُمْ وَهُمْ يَسْتَغْفِرُونَ ﴿33﴾',
    transliteration:
      'wamā kāna l-lahu liyuʿadhibahum wa-anta fīhim wamā kāna l-lahu muʿadhibahum wahum yastaghfirūna',
    englishTranslation:
      'But Allah would not punish them while you are among them, and Allah would not punish them while they seek forgiveness.',
    translation:
      'Allah would not punish the people of Makkah while the Prophet Muhammad ﷺ was still living among them; and Allah would not punish any people so long as they are seeking His forgiveness.',
    source: 'Surah Al-Anfal 8:33',
    audioKey: '8:33',
    whyThis: 'Istighfar (seeking forgiveness) is a literal shield from difficulty and guilt.',
    moods: ['Sad', 'Overwhelmed'],
  },

  {
    id: 'quran_16_53',
    type: 'Quran',
    primaryText:
      "wamā bikum min niʿ'matin famina l-lahi thumma idhā massakumu l-ḍuru fa-ilayhi tajarūna",
    arabicText:
      'وَمَا بِكُم مِّن نِّعْمَةٍۢ فَمِنَ ٱللَّهِ ۖ ثُمَّ إِذَا مَسَّكُمُ ٱلضُّرُّ فَإِلَيْهِ تَجْـَٔرُونَ ﴿53﴾',
    transliteration:
      "wamā bikum min niʿ'matin famina l-lahi thumma idhā massakumu l-ḍuru fa-ilayhi tajarūna",
    englishTranslation:
      'And whatever you have of favor, it is from Allah. Then when adversity touches you, to Him you cry for help.',
    source: 'Surah An-Nahl 16:53',
    audioKey: '16:53',
    whyThis: 'This verse gently points out a pattern: every blessing comes from Allah, yet when hardship comes, humans instinctively cry out to Him — acknowledging in difficulty what they often forget in ease. The verse invites awareness: maintain the connection with Allah in times of gratitude, not only in times of need.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_35_35',
    type: 'Quran',
    primaryText:
      'alladhī aḥallanā dāra l-muqāmati min faḍlihi lā yamassunā fīhā naṣabun walā yamassunā fīhā lughūbun',
    arabicText:
      'ٱلَّذِىٓ أَحَلَّنَا دَارَ ٱلْمُقَامَةِ مِن فَضْلِهِۦ لَا يَمَسُّنَا فِيهَا نَصَبٌۭ وَلَا يَمَسُّنَا فِيهَا لُغُوبٌۭ ﴿35﴾',
    transliteration:
      'alladhī aḥallanā dāra l-muqāmati min faḍlihi lā yamassunā fīhā naṣabun walā yamassunā fīhā lughūbun',
    englishTranslation:
      'He Who has settled us in the Home of Eternity out of His bounty. No fatigue touches us therein, nor does weariness.',
    translation:
      'The people of Paradise will say: "It is Allah who, by His grace, has settled us in the eternal Home. No tiredness touches us here; no exhaustion reaches us."',
    source: 'Surah Fatir 35:35',
    audioKey: '35:35',
    whyThis: 'The people of Paradise describe their state by what is absent: no fatigue, no weariness. This is the final destination — a place where the exhaustion of this world has a complete and permanent end. When you feel drained by this life, this verse reminds you that all of that effort is building toward a rest that never ends.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_25_47',
    type: 'Quran',
    primaryText:
      'wahuwa alladhī jaʿala lakumu al-layla libāsan wal-nawma subātan wajaʿala l-nahāra nushūran',
    arabicText:
      'وَهُوَ ٱلَّذِى جَعَلَ لَكُمُ ٱلَّيْلَ لِبَاسًۭا وَٱلنَّوْمَ سُبَاتًۭا وَجَعَلَ ٱلنَّهَارَ نُشُورًۭا ﴿47﴾',
    transliteration:
      'wahuwa alladhī jaʿala lakumu al-layla libāsan wal-nawma subātan wajaʿala l-nahāra nushūran',
    englishTranslation:
      'And He is the One Who made the night a covering for you, and sleep a rest, and made the day a resurrection.',
    source: 'Surah Al-Furqan 25:47',
    audioKey: '25:47',
    whyThis: 'Allah designed sleep as a mercy - rest is a divine gift, not weakness.',
    moods: ['Calm'],
  },
  {
    id: 'quran_78_9',
    type: 'Quran',
    primaryText: 'wajaʿalnā nawmakum subātan',
    arabicText: 'وَجَعَلْنَا نَوْمَكُمْ سُبَاتًۭا ﴿9﴾',
    transliteration: 'wajaʿalnā nawmakum subātan',
    englishTranslation: 'And We made your sleep for rest.',
    source: 'Surah An-Naba 78:9',
    audioKey: '78:9',
    whyThis: 'Sleep is not a waste of time but a deliberate creation for your renewal.',
    moods: ['Calm'],
  },
  {
    id: 'quran_30_23',
    type: 'Quran',
    primaryText:
      "wamin āyātihi manāmukum bi-al-layli wal-nahāri wa-ib'tighāukum min faḍlihi inna fī dhālika laāyātin liqawmin yasmaʿūna",
    arabicText:
      'وَمِنْ ءَايَـٰتِهِۦ مَنَامُكُم بِٱلَّيْلِ وَٱلنَّهَارِ وَٱبْتِغَآؤُكُم مِّن فَضْلِهِۦٓ ۚ إِنَّ فِى ذَٰلِكَ لَـَٔايَـٰتٍۢ لِّقَوْمٍۢ يَسْمَعُونَ ﴿23﴾',
    transliteration:
      "wamin āyātihi manāmukum bi-al-layli wal-nahāri wa-ib'tighāukum min faḍlihi inna fī dhālika laāyātin liqawmin yasmaʿūna",
    englishTranslation:
      'And among His signs is your sleep by night and day, and your seeking of His bounty. Indeed, in that are surely signs for a people who listen.',
    source: 'Surah Ar-Rum 30:23',
    audioKey: '30:23',
    whyThis: 'Sleep is one of the signs of Allah - a miracle we experience daily.',
    moods: ['Calm'],
  },
  {
    id: 'quran_6_13',
    type: 'Quran',
    primaryText: 'walahu mā sakana fī al-layli wal-nahāri wahuwa l-samīʿu l-ʿalīmu',
    arabicText:
      '۞ وَلَهُۥ مَا سَكَنَ فِى ٱلَّيْلِ وَٱلنَّهَارِ ۚ وَهُوَ ٱلسَّمِيعُ ٱلْعَلِيمُ ﴿13﴾',
    transliteration: 'walahu mā sakana fī al-layli wal-nahāri wahuwa l-samīʿu l-ʿalīmu',
    englishTranslation:
      'And to Him belongs whatever dwells in the night and the day. And He is the All-Hearing, the All-Knowing.',
    source: "Surah Al-An'am 6:13",
    audioKey: '6:13',
    whyThis: 'Everything that exists — in every moment of every night and every day — belongs to Allah and is known to Him. "Al-Sami\'" (All-Hearing) and "Al-\'Alim" (All-Knowing) are paired here as a reminder: your whispered prayers in the night and your silent struggles in the day are fully heard and fully known by Allah.',
    moods: ['Calm'],
  },
  {
    id: 'quran_73_1_4',
    type: 'Quran',
    primaryText:
      "yāayyuhā l-muzamilu qumi al-layla illā qalīlan niṣ'fahu awi unquṣ min'hu qalīlan aw zid ʿalayhi warattili l-qur'āna tartīlan",
    arabicText:
      'يَـٰٓأَيُّهَا ٱلْمُزَّمِّلُ قُمِ ٱلَّيْلَ إِلَّا قَلِيلًۭا نِّصْفَهُۥٓ أَوِ ٱنقُصْ مِنْهُ قَلِيلًا أَوْ زِدْ عَلَيْهِ وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا ﴿1-4﴾',
    transliteration:
      "yāayyuhā l-muzamilu qumi al-layla illā qalīlan niṣ'fahu awi unquṣ min'hu qalīlan aw zid ʿalayhi warattili l-qur'āna tartīlan",
    englishTranslation:
      'O you who wraps himself, stand in prayer at night, except for a little — half of it, or lessen from it a little, or add to it — and recite the Quran with measured, rhythmic recitation.',
    translation:
      'Allah addressed the Prophet Muhammad ﷺ — who was wrapped in his garments after receiving revelation — and said: "Rise, and pray through the night — except a little. Half of it, or a bit less, or a bit more; and recite the Quran slowly and beautifully."',
    source: 'Surah Al-Muzzammil 73:1-4',
    audioKey: '73:1-4',
    whyThis: 'Even in fatigue, a portion of night prayer revives the soul. Start small.',
    moods: ['Hopeful'],
    prayerContext: ['fajr_pre'],
  },
  {
    id: 'quran_2_177',
    type: 'Quran',
    primaryText:
      "laysa l-bira an tuwallū wujūhakum qibala l-mashriqi wal-maghribi walākinna l-bira man āmana bil-lahi wal-yawmi l-ākhiri wal-malāikati wal-kitābi wal-nabiyīna waātā l-māla ʿalā ḥubbihi dhawī l-qur'bā wal-yatāmā wal-masākīna wa-ib'na l-sabīli wal-sāilīna wafī l-riqābi wa-aqāma l-ṣalata waātā l-zakata wal-mūfūna biʿahdihim idhā ʿāhadū wal-ṣābirīna fī l-basāi wal-ḍarāi waḥīna l-basi ulāika alladhīna ṣadaqū wa-ulāika humu l-mutaqūna",
    arabicText:
      '۞ لَّيْسَ ٱلْبِرَّ أَن تُوَلُّوا۟ وُجُوهَكُمْ قِبَلَ ٱلْمَشْرِقِ وَٱلْمَغْرِبِ وَلَـٰكِنَّ ٱلْبِرَّ مَنْ ءَامَنَ بِٱللَّهِ وَٱلْيَوْمِ ٱلْـَٔاخِرِ وَٱلْمَلَـٰٓئِكَةِ وَٱلْكِتَـٰبِ وَٱلنَّبِيِّـۧنَ وَءَاتَى ٱلْمَالَ عَلَىٰ حُبِّهِۦ ذَوِى ٱلْقُرْبَىٰ وَٱلْيَتَـٰمَىٰ وَٱلْمَسَـٰكِينَ وَٱبْنَ ٱلسَّبِيلِ وَٱلسَّآئِلِينَ وَفِى ٱلرِّقَابِ وَأَقَامَ ٱلصَّلَوٰةَ وَءَاتَى ٱلزَّكَوٰةَ وَٱلْمُوفُونَ بِعَهْدِهِمْ إِذَا عَـٰهَدُوا۟ ۖ وَٱلصَّـٰبِرِينَ فِى ٱلْبَأْسَآءِ وَٱلضَّرَّآءِ وَحِينَ ٱلْبَأْسِ ۗ أُو۟لَـٰٓئِكَ ٱلَّذِينَ صَدَقُوا۟ ۖ وَأُو۟لَـٰٓئِكَ هُمُ ٱلْمُتَّقُونَ ﴿177﴾',
    transliteration:
      "laysa l-bira an tuwallū wujūhakum qibala l-mashriqi wal-maghribi walākinna l-bira man āmana bil-lahi wal-yawmi l-ākhiri wal-malāikati wal-kitābi wal-nabiyīna waātā l-māla ʿalā ḥubbihi dhawī l-qur'bā wal-yatāmā wal-masākīna wa-ib'na l-sabīli wal-sāilīna wafī l-riqābi wa-aqāma l-ṣalata waātā l-zakata wal-mūfūna biʿahdihim idhā ʿāhadū wal-ṣābirīna fī l-basāi wal-ḍarāi waḥīna l-basi ulāika alladhīna ṣadaqū wa-ulāika humu l-mutaqūna",
    englishTranslation:
      'Righteousness is not that you turn your faces toward the east or the west, but true righteousness is in one who believes in Allah, the Last Day, the Angels, the Book, and the Prophets; and gives wealth, in spite of love for it, to relatives, orphans, the needy, the traveler, those who ask, and for freeing slaves; and establishes prayer and gives zakah; and those who fulfill their promise when they make it; and those who are patient in suffering, hardship, and times of stress. Those are the ones who are true, and those are the righteous.',
    source: 'Surah Al-Baqarah 2:177',
    audioKey: '2:177',
    whyThis: 'Patience through exhaustion is praiseworthy - your struggle is seen.',
    moods: ['Sad', 'Overwhelmed'],
  },
  {
    id: 'quran_20_130',
    type: 'Quran',
    primaryText:
      "fa-iṣ'bir ʿalā mā yaqūlūna wasabbiḥ biḥamdi rabbika qabla ṭulūʿi l-shamsi waqabla ghurūbihā wamin ānāi al-layli fasabbiḥ wa-aṭrāfa l-nahāri laʿallaka tarḍā",
    arabicText:
      'فَٱصْبِرْ عَلَىٰ مَا يَقُولُونَ وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ ٱلشَّمْسِ وَقَبْلَ غُرُوبِهَا ۖ وَمِنْ ءَانَآئِ ٱلَّيْلِ فَسَبِّحْ وَأَطْرَافَ ٱلنَّهَارِ لَعَلَّكَ تَرْضَىٰ ﴿130﴾',
    transliteration:
      "fa-iṣ'bir ʿalā mā yaqūlūna wasabbiḥ biḥamdi rabbika qabla ṭulūʿi l-shamsi waqabla ghurūbihā wamin ānāi al-layli fasabbiḥ wa-aṭrāfa l-nahāri laʿallaka tarḍā",
    englishTranslation:
      'So be patient over what they say, and glorify with the praise of your Lord before the rising of the sun and before its setting; and during the hours of the night glorify, and at the ends of the day, so that you may be satisfied.',
    source: 'Surah Ta-Ha 20:130',
    audioKey: '20:130',
    whyThis: 'Dhikr at key times brings satisfaction - structure your rest around remembrance.',
    moods: ['Calm', 'Grateful'],
    prayerContext: ['fajr_post', 'maghrib_pre'],
  },
  {
    id: 'quran_17_79',
    type: 'Quran',
    primaryText:
      'wamina al-layli fatahajjad bihi nāfilatan laka ʿasā an yabʿathaka rabbuka maqāman maḥmūdan',
    arabicText:
      'وَمِنَ ٱلَّيْلِ فَتَهَجَّدْ بِهِۦ نَافِلَةًۭ لَّكَ عَسَىٰٓ أَن يَبْعَثَكَ رَبُّكَ مَقَامًۭا مَّحْمُودًۭا ﴿79﴾',
    transliteration:
      'wamina al-layli fatahajjad bihi nāfilatan laka ʿasā an yabʿathaka rabbuka maqāman maḥmūdan',
    englishTranslation:
      'And from the night, arise for prayer as an additional act for you; it may be that your Lord will raise you to a praised station.',
    source: 'Surah Al-Isra 17:79',
    audioKey: '17:79',
    whyThis: 'Night prayer, even when tired, elevates you to a praised station.',
    moods: ['Hopeful'],
    prayerContext: ['fajr_pre'],
  },
  {
    id: 'quran_94_7',
    type: 'Quran',
    primaryText: "fa-idhā faraghta fa-inṣab wa-ilā rabbika fa-ir'ghab",
    arabicText: 'فَإِذَا فَرَغْتَ فَٱنصَبْ وَإِلَىٰ رَبِّكَ فَٱرْغَب ﴿7-8﴾',
    transliteration: "fa-idhā faraghta fa-inṣab wa-ilā rabbika fa-ir'ghab",
    englishTranslation:
      'So when you have finished, then labor hard. And to your Lord turn your attention.',
    source: 'Surah Al-Inshirah 94:7-8',
    audioKey: '94:7-8',
    whyThis: 'The secret to sustainable energy: recharging your spirit after exhausting your body.',
    moods: ['Tired'],
  },
  {
    id: 'quran_29_69',
    type: 'Quran',
    primaryText:
      "wa-alladhīna jāhadū fīnā lanahdiyannahum subulanā wa-inna l-laha lamaʿa l-muḥ'sinīna",
    arabicText:
      'وَٱلَّذِينَ جَـٰهَدُوا۟ فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا ۚ وَإِنَّ ٱللَّهَ لَمَعَ ٱلْمُحْسِنِينَ ﴿69﴾',
    transliteration:
      "wa-alladhīna jāhadū fīnā lanahdiyannahum subulanā wa-inna l-laha lamaʿa l-muḥ'sinīna",
    englishTranslation:
      'And those who strive for Us, We will surely guide them to Our ways. And indeed, Allah is with the good-doers.',
    source: 'Surah Al-Ankabut 29:69',
    audioKey: '29:69',
    whyThis: 'The promise of guidance is tied to striving — "alladhina jahadu fina" (those who strive for Our sake). Guidance is not given all at once; it is given in proportion to effort. The verse uses "lanahdiyannahum" with the lam of certainty and the nun of emphasis — a doubly emphatic guarantee that those who make the effort will be shown the way.',
    moods: ['Tired', 'Hopeful'],
  },
  {
    id: 'quran_50_16',
    type: 'Quran',
    primaryText:
      'walaqad khalaqnā l-insāna wanaʿlamu mā tuwaswisu bihi nafsuhu wanaḥnu aqrabu ilayhi min ḥabli l-warīdi',
    arabicText:
      'وَلَقَدْ خَلَقْنَا ٱلْإِنسَـٰنَ وَنَعْلَمُ مَا تُوَسْوِسُ بِهِۦ نَفْسُهُۥ ۖ وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ ٱلْوَرِيدِ ﴿16﴾',
    transliteration:
      'walaqad khalaqnā l-insāna wanaʿlamu mā tuwaswisu bihi nafsuhu wanaḥnu aqrabu ilayhi min ḥabli l-warīdi',
    englishTranslation:
      'And We have certainly created man, and We know what his soul whispers to him; and We are nearer to him than his jugular vein.',
    source: 'Surah Qaf 50:16',
    audioKey: '50:16',
    whyThis: 'Loneliness is impossible when the Creator is closer to you than your own lifeblood.',
    moods: ['Sad', 'Overwhelmed', 'Lonely'],
  },
  {
    id: 'quran_67_13',
    type: 'Quran',
    primaryText: "wa-asirrū qawlakum awi ij'harū bihi innahu ʿalīmun bidhāti l-ṣudūri",
    arabicText:
      'وَأَسِرُّوا۟ قَوْلَكُمْ أَوِ ٱجْهَرُوا۟ بِهِۦٓ ۖ إِنَّهُۥ عَلِيمٌۢ بِذَاتِ ٱلصُّدُورِ ﴿13﴾',
    transliteration: "wa-asirrū qawlakum awi ij'harū bihi innahu ʿalīmun bidhāti l-ṣudūri",
    englishTranslation:
      'And conceal your speech or publicize it. Indeed, He is Knowing of what is within the breasts.',
    source: 'Surah Al-Mulk 67:13',
    audioKey: '67:13',
    whyThis: 'Whether you speak your pain aloud or carry it silently inside, Allah knows it. "Dhat al-sudur" (what is in the chests) refers to what is most deeply buried — the thoughts, fears, and grief that are never voiced. You do not need to perfectly articulate your pain to Allah; He already knows it completely.',
    moods: ['Sad', 'Overwhelmed'],
  },

  // === MULTI-VERSE PASSAGES ===
  {
    id: 'quran_93_1_5',
    type: 'Quran',
    primaryText:
      "wal-ḍuḥā wal-layli idhā sajā mā waddaʿaka rabbuka wamā qalā walal-ākhiratu khayrun laka mina l-ūlā walasawfa yuʿ'ṭīka rabbuka fatarḍā",
    arabicText:
      'وَٱلضُّحَىٰ ﴿1﴾ وَٱلَّيْلِ إِذَا سَجَىٰ ﴿2﴾ مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ ﴿3﴾ وَلَلْآخِرَةُ خَيْرٌۭ لَّكَ مِنَ ٱلْأُولَىٰ ﴿4﴾ وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ ﴿5﴾',
    transliteration:
      "wal-ḍuḥā wal-layli idhā sajā mā waddaʿaka rabbuka wamā qalā walal-ākhiratu khayrun laka mina l-ūlā walasawfa yuʿ'ṭīka rabbuka fatarḍā",
    englishTranslation:
      'By the morning brightness and by the night when it covers with darkness, your Lord has not taken leave of you, [O Muhammad], nor has He detested [you]. And the Hereafter is better for you than the first [life]. And your Lord is going to give you, and you will be satisfied.',
    translation:
      'After revelation had paused for a time — and the Prophet Muhammad ﷺ feared he had been abandoned — Allah swore by the morning light and the still of night, reassuring him: "Your Lord has not left you, nor does He dislike you. What is coming is far better than what has passed; and your Lord will give you so much, that you will be completely satisfied."',
    source: 'Surah Ad-Duha 93:1-5',
    audioKey: '93:1-5',
    whyThis: 'Surah Ad-Duha reads like a love letter from Allah to a soul in pain. Ibn Kathir records that it was revealed after revelation paused for a period, during which the Prophet ﷺ was deeply distressed — feeling forgotten, even silenced. Allah swore by the morning light — a symbol of radiance — and the still night — a symbol of calm — that He had not abandoned nor displeased His prophet. Every promise in this surah was fulfilled in the Prophet\'s ﷺ life. [Tafsir Ibn Kathir, Surah Ad-Duha]',
    moods: ['Sad', 'Overwhelmed'],
  },
  {
    id: 'quran_94_1_8',
    type: 'Quran',
    primaryText:
      "alam nashraḥ laka ṣadraka wawaḍaʿnā ʿanka wiz'raka alladhī anqaḍa ẓahraka warafaʿnā laka dhik'raka fa-inna maʿa l-ʿus'ri yus'ran inna maʿa l-ʿus'ri yus'ran fa-idhā faraghta fa-inṣab wa-ilā rabbika fa-ir'ghab",
    arabicText:
      'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ وَوَضَعْنَا عَنكَ وِزْرَكَ ٱلَّذِىٓ أَنقَضَ ظَهْرَكَ وَرَفَعْنَا لَكَ ذِكْرَكَ فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا إِنَّ مَعَ ٱلْعُسْرِ يُسْرًۭا فَإِذَا فَرَغْتَ فَٱنصَبْ وَإِلَىٰ رَبِّكَ فَٱرْغَب ﴿1-8﴾',
    transliteration:
      "alam nashraḥ laka ṣadraka wawaḍaʿnā ʿanka wiz'raka alladhī anqaḍa ẓahraka warafaʿnā laka dhik'raka fa-inna maʿa l-ʿus'ri yus'ran inna maʿa l-ʿus'ri yus'ran fa-idhā faraghta fa-inṣab wa-ilā rabbika fa-ir'ghab",
    englishTranslation:
      'Did We not relieve your heart for you [Prophet], and remove the burden that weighed so heavily on your back, and raise your reputation high? So truly where there is hardship there is also ease; truly where there is hardship there is also ease. The moment you are freed [of one task] work on, and turn to your Lord for everything.',
    source: 'Surah Al-Inshirah 94:1-8 (Complete)',
    audioKey: '94:1-8',
    whyThis: 'This entire surah is a divine accounting of what Allah had already done for the Prophet ﷺ: opened his chest, removed his burden, raised his name — before giving the promise of ease. The lesson is that Allah\'s help often begins with what He has already given you, which you may not have noticed. Count the gifts already present before you despair of what is yet to come.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_20_25_28',
    type: 'Quran',
    primaryText:
      "qāla rabbi ish'raḥ lī ṣadrī wayassir lī amrī wa-iḥ'lul ʿuqdatan min lisānī yafqahū qawlī",
    arabicText:
      'قَالَ رَبِّ ٱشْرَحْ لِى صَدْرِى ﴿25﴾ وَيَسِّرْ لِىٓ أَمْرِى ﴿26﴾ وَٱحْلُلْ عُقْدَةًۭ مِّن لِّسَانِى ﴿27﴾ يَفْقَهُوا۟ قَوْلِى ﴿28﴾',
    transliteration:
      "qāla rabbi ish'raḥ lī ṣadrī wayassir lī amrī wa-iḥ'lul ʿuqdatan min lisānī yafqahū qawlī",
    englishTranslation:
      '[Moses] said, "My Lord, expand for me my breast [with assurance] and ease for me my task and untie the knot from my tongue that they may understand my speech."',
    translation:
      'Prophet Musa (Moses) — nervous before his mission to confront Pharaoh — prayed: "My Lord, open up my heart for me; make my task easy; and remove the difficulty from my speech, so that people can understand what I say."',
    source: 'Surah Taha 20:25-28',
    audioKey: '20:25-28',
    whyThis: 'Musa (AS) asked for three things before his mission: an open heart, ease in his task, and clarity in speech. He knew that the internal barriers — fear, confusion, inadequacy — were the real obstacles, not the external challenge itself. This du\'a is the believer\'s prayer before any daunting task.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_89_27_30',
    type: 'Quran',
    primaryText:
      "yāayyatuhā l-nafsu l-muṭ'ma-innatu ir'jiʿī ilā rabbiki rāḍiyatan marḍiyyatan fadkhulī fī ʿibādī wadkhulī jannatī",
    arabicText:
      'يَـٰٓأَيَّتُهَا ٱلنَّفْسُ ٱلْمُطْمَئِنَّةُ ﴿27﴾ ٱرْجِعِىٓ إِلَىٰ رَبِّكِ رَاضِيَةًۭ مَّرْضِيَّةًۭ ﴿28﴾ فَٱدْخُلِى فِى عِبَٰدِى ﴿29﴾ وَٱدْخُلِى جَنَّتِى ﴿30﴾',
    transliteration:
      "yāayyatuhā l-nafsu l-muṭ'ma-innatu ir'jiʿī ilā rabbiki rāḍiyatan marḍiyyatan fadkhulī fī ʿibādī wadkhulī jannatī",
    englishTranslation:
      '[To the righteous it will be said], "O reassured soul, return to your Lord, well-pleased and pleasing [to Him], and enter among My [righteous] servants, and enter My Paradise."',
    source: 'Surah Al-Fajr 89:27-30',
    audioKey: '89:27-30',
    whyThis: 'The "nafs al-mutma\'inna" (reassured soul) is the soul that has found rest through its connection to Allah. It is invited to return to its Lord in a state of mutual contentment — it is pleased with Allah, and Allah is pleased with it. This is the highest state of peace available to any soul, and it is addressed to the believer.',
    moods: ['Calm', 'Grateful'],
  },
  {
    id: 'quran_23_1',
    type: 'Quran',
    primaryText: "qad aflaḥa l-mu'minūna alladhīna hum fī ṣalātihim khāshiʿūna",
    arabicText: 'قَدْ أَفْلَحَ ٱلْمُؤْمِنُونَ ٱلَّذِينَ هُمْ فِى صَلَاتِهِمْ خَـٰشِعُونَ ﴿1-2﴾',
    transliteration: "qad aflaḥa l-mu'minūna alladhīna hum fī ṣalātihim khāshiʿūna",
    englishTranslation:
      'Indeed, successful are the believers — those who during their prayers are humbly submissive.',
    source: "Surah Al-Mu'minun 23:1-2",
    audioKey: '23:1-2',
    whyThis: 'Identifies Khushu (humility) as the defining trait of successful believers.',
    moods: ['Calm', 'Hopeful'],
  },
  {
    id: 'quran_7_31',
    type: 'Quran',
    primaryText:
      "yābanī ādama khudhū zīnatakum ʿinda kulli masjidin wakulū wa-ish'rabū walā tus'rifū innahu lā yuḥibbu l-mus'rifīna",
    arabicText:
      '۞ يَـٰبَنِىٓ ءَادَمَ خُذُوا۟ زِينَتَكُمْ عِندَ كُلِّ مَسْجِدٍۢ وَكُلُوا۟ وَٱشْرَبُوا۟ وَلَا تُسْرِفُوٓا۟ ۚ إِنَّهُۥ لَا يُحِبُّ ٱلْمُسْرِفِينَ ﴿31﴾',
    transliteration:
      "yābanī ādama khudhū zīnatakum ʿinda kulli masjidin wakulū wa-ish'rabū walā tus'rifū innahu lā yuḥibbu l-mus'rifīna",
    englishTranslation:
      'O Children of Adam, take your adornment at every masjid, and eat and drink, but do not be extravagant. Indeed, He does not love the extravagant.',
    source: "Surah Al-A'raf 7:31",
    audioKey: '7:31',
    whyThis: 'The divine command to prepare yourself physically and spiritually before prayer.',
    moods: ['Calm'],
  },
  {
    id: 'quran_29_45',
    type: 'Quran',
    primaryText:
      "ut'lu mā ūḥiya ilayka mina l-kitābi wa-aqimi l-ṣalata inna l-ṣalata tanhā ʿani l-faḥshāi wal-munkari waladhik'ru l-lahi akbaru wal-lahu yaʿlamu mā taṣnaʿūna",
    arabicText:
      'ٱتْلُ مَآ أُوحِىَ إِلَيْكَ مِنَ ٱلْكِتَـٰبِ وَأَقِمِ ٱلصَّلَوٰةَ ۖ إِنَّ ٱلصَّلَوٰةَ تَنْهَىٰ عَنِ ٱلْفَحْشَآءِ وَٱلْمُنكَرِ ۗ وَلَذِكْرُ ٱللَّهِ أَكْبَرُ ۗ وَٱللَّهُ يَعْلَمُ مَا تَصْنَعُونَ ﴿45﴾',
    transliteration:
      "ut'lu mā ūḥiya ilayka mina l-kitābi wa-aqimi l-ṣalata inna l-ṣalata tanhā ʿani l-faḥshāi wal-munkari waladhik'ru l-lahi akbaru wal-lahu yaʿlamu mā taṣnaʿūna",
    englishTranslation:
      'Recite what has been revealed to you of the Book, and establish prayer. Indeed, prayer prevents immorality and evil deeds, and surely the remembrance of Allah is greatest. And Allah knows what you do.',
    translation:
      'Recite what has been revealed to you of the Quran, and establish your prayer. Truly, prayer keeps you away from shameful and evil deeds; and the remembrance of Allah is the greatest thing of all. Allah knows everything you do.',
    source: 'Surah Al-Ankabut 29:45',
    audioKey: '29:45',
    whyThis: 'A reminder that true prayer is a shield against immorality and is the greatest form of remembrance.',
    moods: ['Calm', 'Hopeful'],
  },
  {
    id: 'quran_2_45_salah_dup',
    type: 'Quran',
    primaryText: "wa-is'taʿīnū bil-ṣabri wal-ṣalati wa-innahā lakabīratun illā ʿalā l-khāshiʿīna",
    arabicText:
      'وَٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى ٱلْخَـٰشِعِينَ ﴿45﴾',
    transliteration:
      "wa-is'taʿīnū bil-ṣabri wal-ṣalati wa-innahā lakabīratun illā ʿalā l-khāshiʿīna",
    englishTranslation:
      'And seek help through patience and prayer; and indeed, it is difficult except for the humble ones.',
    source: 'Surah Al-Baqarah 2:45',
    audioKey: '2:45',
    whyThis: 'Prayer is a source of help and strength, though its ease is found in humility.',
    moods: ['Overwhelmed', 'Calm'],
  },
  {
    id: 'quran_22_77_salah_dup',
    type: 'Quran',
    primaryText:
      "yāayyuhā alladhīna āmanū ir'kaʿū wa-us'judū wa-uʿ'budū rabbakum wa-if'ʿalū l-khayra laʿallakum tuf'liḥūna",
    arabicText:
      'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱرْكَعُوا۟ وَٱسْجُدُوا۟ وَٱعْبُدُوا۟ رَبَّكُمْ وَٱفْعَلُوا۟ ٱلْخَيْرَ لَعَلَّكُمْ تُفْلِحُونَ ۩ ﴿77﴾',
    transliteration:
      "yāayyuhā alladhīna āmanū ir'kaʿū wa-us'judū wa-uʿ'budū rabbakum wa-if'ʿalū l-khayra laʿallakum tuf'liḥūna",
    englishTranslation:
      'O you who believe, bow and prostrate and worship your Lord, and do good so that you may be successful.',
    source: 'Surah Al-Hajj 22:77',
    audioKey: '22:77',
    whyThis: 'A direct command to engage the body in the physical acts of worship.',
    moods: ['Grateful', 'Calm'],
  },
  {
    id: 'quran_14_40',
    type: 'Quran',
    primaryText: "rabbi ij'ʿalnī muqīma l-ṣalati wamin dhurriyyatī rabbanā wataqabbal duʿāi",
    arabicText:
      'رَبِّ ٱجْعَلْنِى مُقِيمَ ٱلصَّلَوٰةِ وَمِن ذُرِّيَّتِى ۚ رَبَّنَا وَتَقَبَّلْ دُعَآءِ ﴿40﴾',
    transliteration: "rabbi ij'ʿalnī muqīma l-ṣalati wamin dhurriyyatī rabbanā wataqabbal duʿāi",
    englishTranslation:
      'My Lord, make me an establisher of prayer, and from my offspring. Our Lord, and accept my prayer.',
    source: 'Surah Ibrahim 14:40',
    audioKey: '14:40',
    whyThis: 'The powerful dua of Ibrahim (AS) for steadfastness in prayer for himself and his family.',
    moods: ['Hopeful', 'Calm'],
  },

  // === RIZQ REVOLUTION PATH ===
  {
    id: 'quran_51_22',
    type: 'Quran',
    primaryText: "wafī l-samāi riz'qukum wamā tūʿadūna",
    arabicText: 'وَفِى ٱلسَّمَآءِ رِزْقُكُمْ وَمَا تُوعَدُونَ ﴿22﴾',
    transliteration: "wafī l-samāi riz'qukum wamā tūʿadūna",
    englishTranslation: 'And in the heaven is your provision and what you are promised.',
    source: 'Surah Adh-Dhariyat 51:22',
    audioKey: '51:22',
    whyThis: 'Your rizq (provision) is not generated by your effort alone — it is decreed in the heavens and sent down. Effort is the means through which it reaches you, but the source and the amount are with Allah. This verse reframes anxiety about sustenance: it is already written, and Allah is already bringing it to you.',
    moods: ['Overwhelmed'],
  },
  {
    id: 'quran_11_6',
    type: 'Quran',
    primaryText:
      "wamā min dābbatin fī l-arḍi illā ʿalā l-lahi riz'quhā wayaʿlamu mus'taqarrahā wamus'tawdaʿahā kullun fī kitābin mubīnin",
    arabicText:
      '۞ وَمَا مِن دَآبَّةٍۢ فِى ٱلْأَرْضِ إِلَّا عَلَى ٱللَّهِ رِزْقُهَا وَيَعْلَمُ مُسْتَقَرَّهَا وَمُسْتَوْدَعَهَا ۚ كُلٌّۭ فِى كِتَـٰبٍۢ مُّبِينٍۢ ﴿6﴾',
    transliteration:
      "wamā min dābbatin fī l-arḍi illā ʿalā l-lahi riz'quhā wayaʿlamu mus'taqarrahā wamus'tawdaʿahā kullun fī kitābin mubīnin",
    englishTranslation:
      'And there is no creature on earth but that upon Allah is its provision. And He knows its dwelling place and its place of storage. All is in a clear record.',
    source: 'Surah Hud 11:6',
    audioKey: '11:6',
    whyThis: 'Every creature — not just humans — has its provision as a divine responsibility upon Allah. He knows where each creature lives, where its provision is stored, and how it will reach it. If He provides for the worm deep in the earth and the fish at the bottom of the sea, He will provide for you.',
    moods: ['Overwhelmed', 'Grateful'],
  },
  // Day 3: Halal vs. Haram
  {
    id: 'quran_2_168',
    type: 'Quran',
    primaryText:
      'yāayyuhā l-nāsu kulū mimmā fī l-arḍi ḥalālan ṭayyiban walā tattabiʿū khuṭuwāti l-shayṭāni innahu lakum ʿaduwwun mubīnun',
    arabicText:
      'يَـٰٓأَيُّهَا ٱلنَّاسُ كُلُوا۟ مِمَّا فِى ٱلْأَرْضِ حَلَـٰلًۭا طَيِّبًۭا وَلَا تَتَّبِعُوا۟ خُطُوَٰتِ ٱلشَّيْطَـٰنِ ۚ إِنَّهُۥ لَكُمْ عَدُوٌّۭ مُّبِينٌ ﴿168﴾',
    transliteration:
      'yāayyuhā l-nāsu kulū mimmā fī l-arḍi ḥalālan ṭayyiban walā tattabiʿū khuṭuwāti l-shayṭāni innahu lakum ʿaduwwun mubīnun',
    englishTranslation:
      'O mankind, eat from whatever is on earth that is lawful and good, and do not follow the footsteps of Satan. Indeed, he is to you a clear enemy.',
    source: 'Surah Al-Baqarah 2:168',
    audioKey: '2:168',
    whyThis: 'The command to eat what is halal and tayyib (lawful and good) is addressed to all mankind — not just believers. The pairing of halal with tayyib is significant: something can be technically permissible but still not spiritually or physically wholesome. This verse calls us to seek provision that nourishes both body and soul.',
    moods: ['Overwhelmed', 'Hopeful'],
  },
  // Day 4: Tawakkul ≠ Laziness
  {
    id: 'quran_65_3_rizq',
    type: 'Quran',
    primaryText:
      "wayarzuq'hu min ḥaythu lā yaḥtasibu waman yatawakkal ʿalā l-lahi fahuwa ḥasbuhu inna l-laha bālighu amrihi qad jaʿala l-lahu likulli shayin qadran",
    arabicText:
      'وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ ۚ وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥٓ ۚ إِنَّ ٱللَّهَ بَـٰلِغُ أَمْرِهِۦ ۚ قَدْ جَعَلَ ٱللَّهُ لِكُلِّ شَىْءٍۢ قَدْرًۭا ﴿3﴾',
    transliteration:
      "wayarzuq'hu min ḥaythu lā yaḥtasibu waman yatawakkal ʿalā l-lahi fahuwa ḥasbuhu inna l-laha bālighu amrihi qad jaʿala l-lahu likulli shayin qadran",
    englishTranslation:
      'And He will provide for him from where he does not expect. And whoever puts his trust upon Allah, then He is sufficient for him. Indeed, Allah will accomplish His purpose. Allah has already set for everything a measure.',
    source: 'Surah At-Talaq 65:3',
    audioKey: '65:3',
    whyThis: 'The phrase "min haythu la yahtasib" (from where he does not expect) means Allah\'s provision often comes through doors you have not thought to knock on. Tawakkul does not mean waiting passively; it means acting with what you have while being open to receiving from sources you could not have planned for.',
    moods: ['Overwhelmed', 'Hopeful'],
  },
  // Day 5: The Scarcity Trap
  {
    id: 'quran_29_60',
    type: 'Quran',
    primaryText:
      "waka-ayyin min dābbatin lā taḥmilu riz'qahā l-lahu yarzuquhā wa-iyyākum wahuwa l-samīʿu l-ʿalīmu",
    arabicText:
      'وَكَأَيِّن مِّن دَآبَّةٍۢ لَّا تَحْمِلُ رِزْقَهَا ٱللَّهُ يَرْزُقُهَا وَإِيَّاكُمْ ۚ وَهُوَ ٱلسَّمِيعُ ٱلْعَلِيمُ ﴿60﴾',
    transliteration:
      "waka-ayyin min dābbatin lā taḥmilu riz'qahā l-lahu yarzuquhā wa-iyyākum wahuwa l-samīʿu l-ʿalīmu",
    englishTranslation:
      'And how many a creature does not carry its own provision. Allah provides for it and for you. And He is the All-Hearer, the All-Knower.',
    source: 'Surah Al-Ankabut 29:60',
    audioKey: '29:60',
    whyThis: 'Many creatures have no ability to store or plan their food — yet they are sustained. Allah provides for them directly, and He provides for you too. The verse pairs His provision with two names: Al-Sami\' (All-Hearing) and Al-\'Alim (All-Knowing) — He hears your need and knows exactly what you require.',
    moods: ['Overwhelmed'],
  },
  // Day 6: Contentment (Qana'ah)
  {
    id: 'quran_2_155_156',
    type: 'Quran',
    primaryText:
      'walanabluwannakum bishayin mina l-khawfi wal-jūʿi wanaqṣin mina l-amwāli wal-anfusi wal-thamarāti wabashiri l-ṣābirīna alladhīna idhā aṣābathum muṣībatun qālū innā lillahi wa-innā ilayhi rājiʿūna',
    arabicText:
      'وَلَنَبْلُوَنَّكُم بِشَىْءٍۢ مِّنَ ٱلْخَوْفِ وَٱلْجُوعِ وَنَقْصٍۢ مِّنَ ٱلْأَمْوَٰلِ وَٱلْأَنفُسِ وَٱلثَّمَرَٰتِ ۗ وَبَشِّرِ ٱلصَّـٰبِرِينَ ﴿155﴾ ٱلَّذِينَ إِذَآ أَصَابَتْهُم مُّصِيبَةٌۭ قَالُوٓا۟ إِنَّا لِلَّهِ وَإِنَّآ إِلَيْهِ رَٰجِعُونَ ﴿156﴾',
    transliteration:
      'walanabluwannakum bishayin mina l-khawfi wal-jūʿi wanaqṣin mina l-amwāli wal-anfusi wal-thamarāti wabashiri l-ṣābirīna alladhīna idhā aṣābathum muṣībatun qālū innā lillahi wa-innā ilayhi rājiʿūna',
    englishTranslation:
      'And We will surely test you with something of fear and hunger and a loss of wealth and lives and fruits, but give good tidings to the patient, who, when disaster strikes them, say, "Indeed we belong to Allah, and indeed to Him we will return."',
    source: 'Surah Al-Baqarah 2:155-156',
    audioKey: '2:155-156',
    whyThis: 'Tests in provision — fear and hunger and financial loss — are listed here not as punishments but as grounds for good tidings (bushra) to the patient. The patient person says "Inna lillahi wa inna ilayhi raji\'un," returning to the foundational truth: I belong to Allah, and everything I have belongs to Him. Loss is not defeat for one who holds this truth.',
    moods: ['Sad', 'Hopeful'],
  },
  // Day 7: Barakah > Amount
  {
    id: 'quran_7_96',
    type: 'Quran',
    primaryText:
      'walaw anna ahla l-qurā āmanū wa-ittaqaw lafataḥnā ʿalayhim barakātin mina l-samāi wal-arḍi walākin kadhabū fa-akhadhnāhum bimā kānū yaksibūna',
    arabicText:
      'وَلَوْ أَنَّ أَهْلَ ٱلْقُرَىٰٓ ءَامَنُوا۟ وَٱتَّقَوْا۟ لَفَتَحْنَا عَلَيْهِم بَرَكَـٰتٍۢ مِّنَ ٱلسَّمَآءِ وَٱلْأَرْضِ وَلَـٰكِن كَذَّبُوا۟ فَأَخَذْنَـٰهُم بِمَا كَانُوا۟ يَكْسِبُونَ ﴿96﴾',
    transliteration:
      'walaw anna ahla l-qurā āmanū wa-ittaqaw lafataḥnā ʿalayhim barakātin mina l-samāi wal-arḍi walākin kadhabū fa-akhadhnāhum bimā kānū yaksibūna',
    englishTranslation:
      'And if only the people of the cities had believed and feared Allah, We would have opened upon them blessings from the heaven and the earth; but they denied, so We seized them for what they used to earn.',
    source: "Surah Al-A'raf 7:96",
    audioKey: '7:96',
    whyThis: 'This verse establishes a direct link between taqwa (God-consciousness) and barakah (blessing). "Blessings from the heaven and the earth" refers to rain, crops, health, safety, and abundance — both spiritual and material. The inverse is equally true: iman and taqwa unlock a level of provision that no amount of worldly strategy can replicate.',
    moods: ['Hopeful', 'Grateful'],
  },
  // Day 8: Give to Receive
  {
    id: 'quran_2_261',
    type: 'Quran',
    primaryText:
      'mathalu alladhīna yunfiqūna amwālahum fī sabīli l-lahi kamathali ḥabbatin anbatat sabʿa sanābila fī kulli sunbulatin mi-atu ḥabbatin wal-lahu yuḍāʿifu liman yashāu wal-lahu wāsiʿun ʿalīmun',
    arabicText:
      'مَّثَلُ ٱلَّذِينَ يُنفِقُونَ أَمْوَٰلَهُمْ فِى سَبِيلِ ٱللَّهِ كَمَثَلِ حَبَّةٍ أَنۢبَتَتْ سَبْعَ سَنَابِلَ فِى كُلِّ سُنۢبُلَةٍۢ مِّا۟ئَةُ حَبَّةٍۢ ۗ وَٱللَّهُ يُضَـٰعِفُ لِمَن يَشَآءُ ۗ وَٱللَّهُ وَٰسِعٌ عَلِيمٌ ﴿261﴾',
    transliteration:
      'mathalu alladhīna yunfiqūna amwālahum fī sabīli l-lahi kamathali ḥabbatin anbatat sabʿa sanābila fī kulli sunbulatin mi-atu ḥabbatin wal-lahu yuḍāʿifu liman yashāu wal-lahu wāsiʿun ʿalīmun',
    englishTranslation:
      'The example of those who spend their wealth in the way of Allah is like a grain which grows seven ears; in each ear is a hundred grains. And Allah gives manifold to whom He wills. And Allah is All-Encompassing, All-Knowing.',
    source: 'Surah Al-Baqarah 2:261',
    audioKey: '2:261',
    whyThis: 'One grain becomes 700 in this parable — a 700-fold return on spending for Allah\'s sake. The Prophet ﷺ confirmed that Allah multiplies the reward of spending in His cause many times over. [Bukhari 1410] Giving from your provision is not a loss; according to this verse and the sunnah, it is the highest-return investment available to a believer.',
    moods: ['Hopeful', 'Tired'],
  },
  // Day 9: Tie Your Camel (Part 2)
  {
    id: 'quran_67_15',
    type: 'Quran',
    primaryText:
      "huwa alladhī jaʿala lakumu l-arḍa dhalūlan fa-im'shū fī manākibihā wakulū min riz'qihi wa-ilayhi l-nushūru",
    arabicText:
      'هُوَ ٱلَّذِى جَعَلَ لَكُمُ ٱلْأَرْضَ ذَلُولًۭا فَٱمْشُوا۟ فِى مَنَاكِبِهَا وَكُلُوا۟ مِن رِّزْقِهِۦ ۖ وَإِلَيْهِ ٱلنُّشُورُ ﴿15﴾',
    transliteration:
      "huwa alladhī jaʿala lakumu l-arḍa dhalūlan fa-im'shū fī manākibihā wakulū min riz'qihi wa-ilayhi l-nushūru",
    englishTranslation:
      'He is the One Who made the earth subservient for you; so walk in its paths and eat of His provision, and to Him is the resurrection.',
    source: 'Surah Al-Mulk 67:15',
    audioKey: '67:15',
    whyThis: 'The word "dhalul" means tamed, gentle, compliant — Allah made the earth submissive for human movement and use. This verse commands action: "fa-mshoo" (walk in its paths). Seeking your provision by moving and working is itself part of the divine design. Tawakkul is not inaction; it is moving while trusting the Provider.',
    moods: ['Tired', 'Hopeful'],
  },
  // Day 10: The Dua for Rizq
  {
    id: 'quran_14_37',
    type: 'Quran',
    primaryText:
      "rabbanā innī askantu min dhurriyyatī biwādin ghayri dhī zarʿin ʿinda baytika l-muḥarami rabbanā liyuqīmū l-ṣalata fa-ij'ʿal afidatan mina l-nāsi tahwī ilayhim wa-ur'zuq'hum mina l-thamarāti laʿallahum yashkurūna",
    arabicText:
      'رَّبَّنَآ إِنِّىٓ أَسْكَنتُ مِن ذُرِّيَّتِى بِوَادٍ غَيْرِ ذِى زَرْعٍ عِندَ بَيْتِكَ ٱلْمُحَرَّمِ رَبَّنَا لِيُقِيمُوا۟ ٱلصَّلَوٰةَ فَٱجْعَلْ أَفْـِٔدَةًۭ مِّنَ ٱلنَّاسِ تَهْوِىٓ إِلَيْهِمْ وَٱرْزُقْهُم مِّنَ ٱلثَّمَرَٰتِ لَعَلَّهُمْ يَشْكُرُونَ ﴿37﴾',
    transliteration:
      "rabbanā innī askantu min dhurriyyatī biwādin ghayri dhī zarʿin ʿinda baytika l-muḥarami rabbanā liyuqīmū l-ṣalata fa-ij'ʿal afidatan mina l-nāsi tahwī ilayhim wa-ur'zuq'hum mina l-thamarāti laʿallahum yashkurūna",
    englishTranslation:
      'Our Lord, indeed I have settled some of my offspring in a valley without cultivation, near Your Sacred House, our Lord, that they may establish prayer. So make hearts among the people incline toward them, and provide them with fruits so that they may be grateful.',
    translation:
      'Prophet Ibrahim (Abraham) — after leaving his wife Hajar and infant son Ismail in the barren desert of Makkah, near the Sacred Ka\'bah — prayed: "Our Lord, I have settled some of my family in a valley with no crops, near Your Holy House, so they may establish prayer. Make people\'s hearts drawn to them; and provide them with fruits, so they may give thanks."',
    source: 'Surah Ibrahim 14:37',
    audioKey: '14:37',
    whyThis: 'Ibrahim (AS) left his family in a barren valley with no crops, no water, no infrastructure — and made du\'a for provision. Today Makkah is one of the most visited places on earth. His du\'a for his family\'s sustenance was answered across centuries. This verse shows that genuine du\'a for rizq, rooted in tawakkul, is fulfilled by Allah even in the most unlikely circumstances.',
    moods: ['Hopeful', 'Overwhelmed'],
  },

  // Day 13: Removing Greed
  {
    id: 'quran_102_1_2',
    type: 'Quran',
    primaryText: 'alhākumu l-takāthuru ḥattā zurtumu l-maqābira',
    arabicText: 'أَلْهَىٰكُمُ ٱلتَّكَاثُرُ ﴿1﴾ حَتَّىٰ زُرْتُمُ ٱلْمَقَابِرَ ﴿2﴾',
    transliteration: 'alhākumu l-takāthuru ḥattā zurtumu l-maqābira',
    englishTranslation:
      'The mutual rivalry for piling up (the good things of this world) diverts you (from the more serious things), until you visit the graves.',
    source: 'Surah At-Takathur 102:1-2',
    audioKey: '102:1-2',
    whyThis: 'The word "alhakum" means to preoccupy or distract to the point of neglect. The race to accumulate wealth, status, and possessions keeps people occupied until death arrives. This surah is a wake-up call: the competition you are absorbed in will end at the grave, but what you bring with you will not.',
    moods: ['Overwhelmed'],
  },
  // Day 14: Living with Barakah
  {
    id: 'quran_24_38',
    type: 'Quran',
    primaryText:
      'liyajziyahumu l-lahu aḥsana mā ʿamilū wayazīdahum min faḍlihi wal-lahu yarzuqu man yashāu bighayri ḥisābin',
    arabicText:
      'لِيَجْزِيَهُمُ ٱللَّهُ أَحْسَنَ مَا عَمِلُوا۟ وَيَزِيدَهُم مِّن فَضْلِهِۦ ۗ وَٱللَّهُ يَرْزُقُ مَن يَشَآءُ بِغَيْرِ حِسَابٍۢ ﴿38﴾',
    transliteration:
      'liyajziyahumu l-lahu aḥsana mā ʿamilū wayazīdahum min faḍlihi wal-lahu yarzuqu man yashāu bighayri ḥisābin',
    englishTranslation:
      'That Allah may reward them according to the best of what they did, and increase them from His bounty. And Allah provides for whom He wills without measure.',
    source: 'Surah An-Nur 24:38',
    audioKey: '24:38',
    whyThis: 'Allah does not reward merely according to what you did, but according to the best of what you did. Then He adds to that from His own bounty, without any measure or limit. This verse is for those who feel their deeds are too few or too weak: your best effort is what Allah takes as the standard, and His generosity completes the rest.',
    moods: ['Grateful'],
  },
  {
    id: 'quran_58_7_lonely',
    type: 'Quran',
    primaryText:
      'alam tara anna l-laha yaʿlamu mā fī l-samāwāti wamā fī l-arḍi mā yakūnu min najwā thalāthatin illā huwa rābiʿuhum walā khamsatin illā huwa sādisuhum walā adnā min dhālika walā akthara illā huwa maʿahum ayna mā kānū thumma yunabbi-uhum bimā ʿamilū yawma l-qiyāmati inna l-laha bikulli shayin ʿalīmun',
    arabicText:
      'أَلَمْ تَرَ أَنَّ ٱللَّهَ يَعْلَمُ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۖ مَا يَكُونُ مِن نَّجْوَىٰ ثَلَٰثَةٍ إِلَّا هُوَ رَابِعُهُمْ وَلَا خَمْسَةٍ إِلَّا هُوَ سَادِسُهُمْ وَلَآ أَدْنَىٰ مِن ذَٰلِكَ وَلَآ أَكْثَرَ إِلَّا هُوَ مَعَهُمْ أَيْنَ مَا كَانُوا۟ ۖ ثُمَّ يُنَبِّئُهُم بِمَا عَمِلُوا۟ يَوْمَ ٱلْقِيَٰمَةِ ۚ إِنَّ ٱللَّهَ بِكُلِّ شَىْءٍ عَلِيمٌ ﴿7﴾',
    transliteration:
      'alam tara anna l-laha yaʿlamu mā fī l-samāwāti wamā fī l-arḍi mā yakūnu min najwā thalāthatin illā huwa rābiʿuhum walā khamsatin illā huwa sādisuhum walā adnā min dhālika walā akthara illā huwa maʿahum ayna mā kānū thumma yunabbi-uhum bimā ʿamilū yawma l-qiyāmati inna l-laha bikulli shayin ʿalīmun',
    englishTranslation:
      'Have you not seen that Allah knows whatever is in the heavens and whatever is on the earth? There is no private conversation of three but that He is the fourth of them, nor of five but that He is the sixth of them — nor of less than that, nor of more — but that He is with them wherever they are. Then He will inform them of what they did on the Day of Resurrection. Indeed, Allah is Knowing of all things.',
    source: 'Surah Al-Mujadila 58:7',
    audioKey: '58:7',
    whyThis: 'You are never truly alone; Allah is always present in every moment and conversation.',
    moods: ['Lonely'],
  },
  {
    id: 'quran_11_90_lonely',
    type: 'Quran',
    primaryText: "wa-is'taghfirū rabbakum thumma tūbū ilayhi inna rabbī raḥīmun wadūdun",
    arabicText:
      'وَٱسْتَغْفِرُوا۟ رَبَّكُمْ ثُمَّ تُوبُوٓا۟ إِلَيْهِ ۚ إِنَّ رَبِّى رَحِيمٌۭ وَدُودٌۭ ﴿90﴾',
    transliteration: "wa-is'taghfirū rabbakum thumma tūbū ilayhi inna rabbī raḥīmun wadūdun",
    englishTranslation:
      'And ask forgiveness of your Lord, then turn to Him in repentance. Indeed, my Lord is Most Merciful, Most Loving.',
    source: 'Surah Hud 11:90',
    audioKey: '11:90',
    whyThis: 'Allah is Al-Wadud - the Most Loving. His love is the ultimate cure for a lonely heart.',
    moods: ['Lonely', 'Guilty'],
  },
];

const quranContent: Content[] = quranContentData;
const quranContentAnglesData: ContentAngle[] = [
  // === ANXIOUS ANGLES ===
  {
    id: 'q_angle_93_4_anxious',
    contentId: 'quran_93_4',
    mood: 'Overwhelmed',
    angle:
      'The scholars note that this verse was revealed to the Prophet ﷺ during a period of silence from revelation, reassuring him that his Lord had not forsaken him—symbolizing hope for every believer in times of spiritual dry spells.',
    action: "Pray two rak'ahs of prayer and ask Allah for ease in your situation.",
    actionHowTo:
      'Perform a sincere voluntary prayer (Salat al-Hajah) and speak to Allah about your worries.',
    actionReward:
      'The companion reported: "Whenever a matter distressed the Prophet (pbuh), he would rush to prayer." [Sunan Abi Dawud 1319]',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Pray Salat al-Hajah',
        instruction:
          "Perform two rak'ahs of voluntary prayer and speak to Allah directly about your worry.",
        source:
          '"Whenever a matter distressed the Prophet ﷺ, he would rush to prayer." [Abu Dawud 1319]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Make this dua',
        instruction: 'After prayer, raise your hands and ask Allah for ease.',
        arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ بِأَنَّ لَكَ الْحَمْدَ لَا إِلَٰهَ إِلَّا أَنْتَ',
        transliteration: "Allahumma inni as'aluka bi-anna lakal-hamd, la ilaha illa Ant",
        translation: 'O Allah, I ask You, as all praise is Yours, there is no god but You',
        source: "Sunan an-Nasa'i 1300 — Sahih",
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'chat',
        title: 'Remember the pattern',
        instruction:
          "Recall that just as dawn followed the Prophet's ﷺ darkest moment of silence, your ease is being prepared right now. The Hereafter will be better for you than the first life.",
        source: 'Surah Ad-Duha 93:4 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What "first life" struggle are you holding onto that the Hereafter makes small?',
  },
  {
    id: 'q_angle_2_286_anxious',
    contentId: 'quran_2_286',
    mood: 'Overwhelmed',
    angle:
      'The Prophet ﷺ said: "Allah does not burden a soul beyond its capacity" is among the most beloved verses to the believers. This verse ends with a powerful dua the Prophet ﷺ taught us to make. [Source: Sahih Muslim 126]',
    action: 'Recite the last two verses of Al-Baqarah before sleep as protection.',
    actionHowTo: 'Recite from "Aamanar-rasulu..." to the end.',
    actionReward:
      'The Prophet ﷺ said: "Whoever recites the last two verses of Surah al-Baqarah at night, they will be sufficient for him." [Bukhari 5009]',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'book-quran',
        title: 'Recite the last two ayat',
        instruction:
          'Recite the last two verses of Surah Al-Baqarah (2:285-286) slowly before sleep tonight.',
        arabicText: 'رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا',
        transliteration: "Rabbana la tu'akhidhna in nasina aw akhta'na",
        translation: 'Our Lord, do not impose blame upon us if we forget or make a mistake',
        source:
          '"Whoever recites the last two verses of Al-Baqarah at night, they will be sufficient for him." [Bukhari 5009]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'chat',
        title: 'Reframe your burden',
        instruction:
          'Write down the thing overwhelming you. Then write next to it: "Allah does not burden a soul beyond its capacity." If He gave you this test, He already gave you the strength to bear it.',
        source: 'Surah Al-Baqarah 2:286 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Hand it over in sujud',
        instruction:
          'In your next prayer, prolong your sujud and speak to Allah about your burden. The Prophet ﷺ said sujud is the closest a servant is to his Lord.',
        source:
          '"The closest a servant is to his Lord is when he is in sujud, so increase your dua therein." [Muslim 482]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: "When you feel overwhelmed today, what burden can you release to Allah's care?",
  },
  {
    id: 'q_angle_65_3_anxious',
    contentId: 'quran_65_3',
    mood: 'Overwhelmed',
    angle:
      'The Prophet ﷺ said: "If you were to rely upon Allah with the reliance He is due, He would provide for you just as He provides for the birds; they go out hungry in the morning and return full in the evening." [At-Tirmidhi 2344]',
    action:
      'When anxious about provision or outcomes, recite this verse and practice "Tafwid" (handing over the matter to Allah).',
    actionHowTo:
      'Identify the specific worry and say: "I entrust my affairs to Allah" (Wa ufwidu amri ilallāh).',
    actionReward:
      'Allah says: "And whoever relies upon Allah - then He is sufficient (Hasbuhu) for him." [Quran 65:3]',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'chat',
        title: 'Declare Tafwid',
        instruction: 'Say the words of Tafwid — handing your affair to Allah.',
        arabicText: 'وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ',
        transliteration: 'Wa ufawwidu amri ilAllah',
        translation: 'I entrust my affairs to Allah',
        source: 'Surah Ghafir 40:44 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'bird',
        title: 'Go out like the birds',
        instruction:
          'Take one small action towards your goal today, then leave the result to Allah. The birds go out hungry but trust they will return full.',
        source:
          '"If you relied on Allah with true reliance, He would provide for you as He provides the birds." [Tirmidhi 2344]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'chat',
        title: 'Name the specific worry',
        instruction:
          'Write down the exact thing worrying you. Then say: "Hasbiyallah" — Allah is sufficient for me regarding this specific matter. Specificity strengthens tawakkul.',
        source: 'Surah At-Talaq 65:3 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection:
      'What would change in your heart if you truly believed Allah is sufficient for your specific worry?',
  },
  {
    id: 'q_angle_53_39_anxious',
    contentId: 'quran_53_39',
    mood: 'Overwhelmed',
    angle:
      'Scholars of Tafsir explain that this verse focuses the believer on their sincere effort, which is within their control, rather than the results, which are with Allah. He sees every small step you take. [Tafsir al-Qurtubi]',
    action: 'Renew your intention (Niyyah) for your current task to be purely for Allah.',
    actionHowTo:
      'Identify one duty you have today and mentally dedicate its performance to Allah to transform it into worship.',
    actionReward:
      'The Prophet ﷺ said: "Actions are but by intentions, and every person will have only what they intended." [Sahih Bukhari 1]',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'target',
        title: 'Renew your niyyah',
        instruction:
          'Identify one task you have today. Before starting, say "Bismillah" and mentally dedicate it to Allah — transforming routine into worship.',
        source: '"Actions are but by intentions." [Bukhari 1]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'pen',
        title: 'Write your effort list',
        instruction:
          'Write down 3 small efforts you can make today. Focus only on the action, not the outcome. Allah sees every atom of effort you put in.',
        source: '"Whoever does an atom\'s weight of good will see it." [Quran 99:7]',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Say the Istikharah dua',
        instruction: 'Recite the dua of seeking guidance — handing the result to Allah.',
        arabicText: 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ',
        transliteration: "Allahumma inni astakhiruka bi-'ilmik, wa astaqdiruka bi-qudratik",
        translation: 'O Allah, I seek Your guidance by Your knowledge and ability by Your power',
        source: 'Sahih Bukhari 1162',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
    ]),
    reflection:
      'How does focusing on your sincere effort rather than the end result ease your anxiety?',
  },
  {
    id: 'q_angle_26_80_anxious',
    contentId: 'quran_26_80',
    mood: 'Overwhelmed',
    angle:
      'Prophet Ibrahim (as) stated this with absolute certainty. The Prophet ﷺ used to make dua: "Remove the harm, O Lord of mankind, and heal, for You are the Healer (Ash-Shafi). There is no healing but Yours." [Sahih Bukhari 5743]',
    action: 'Focus on your well-being by reciting this prophetic dua for yourself.',
    actionHowTo:
      'Place your hand where you feel discomfort and say "Allahumma Adhhibil-bas, Rabban-nas, washfi Antash-Shafi".',
    actionReward:
      'The Prophet ﷺ said: "No fatigue, nor disease... nor even the prick of a thorn, befals a Muslim but that Allah expiates some of his sins for it." [Bukhari 5641]',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Recite the healing dua',
        instruction:
          "Place your hand on the area of discomfort and recite the Prophet's ﷺ dua for healing.",
        arabicText:
          'أَذْهِبِ الْبَأْسَ رَبَّ النَّاسِ وَاشْفِ أَنْتَ الشَّافِي لَا شِفَاءَ إِلَّا شِفَاؤُكَ',
        transliteration:
          "Adh-hibil-ba's, Rabban-nas, washfi Antash-Shafi, la shifa'a illa shifa'uk",
        translation:
          'Remove the harm, O Lord of mankind, and heal — You are the Healer, there is no healing but Yours',
        source: 'Sahih Bukhari 5743',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'chat',
        title: 'Trust Ash-Shafi',
        instruction:
          'Remind yourself: the One who created you knows exactly how to heal you. Every pain is being recorded and every moment of patience is being rewarded — even the prick of a thorn.',
        source:
          '"No fatigue, nor disease, nor anxiety... befalls a Muslim but that Allah expiates his sins." [Bukhari 5641]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'honey',
        title: 'Follow the prophetic remedy',
        instruction:
          'The Prophet ﷺ recommended honey, black seed (habbatus-sauda), and ruqyah for healing. Take a spoonful of honey or black seed oil as a sunnah practice today.',
        source:
          '"In the black seed there is healing for every disease except death." [Bukhari 5688]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection:
      'What does it mean to trust "Ash-Shafi" (The Healer) with your ultimate well-being and heart?',
  },

  {
    id: 'q_angle_3_173_anxious',
    contentId: 'quran_3_173',
    mood: 'Overwhelmed',
    angle:
      'Ibn Abbas said this phrase was used by Ibrahim (as) when thrown into the fire, and by the Prophet ﷺ during hardship. It is the ultimate statement of reliance in times of peak pressure. [Sahih Bukhari 4563]',
    action: 'Recite "Hasbunallahu wa ni\'mal-wakil" whenever you feel overwhelmed.',
    actionHowTo:
      'Repeat the phrase slowly, mentally handing over your worry to the "Best Disposer" with each breath.',
    actionReward:
      'The phrase translates to: "Sufficient for us is Allah, and He is the best Disposer of affairs." It is the key to divine protection.',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Recite Hasbunallah',
        instruction:
          'Repeat this powerful dhikr, handing over your worry to Allah with each repetition.',
        arabicText: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
        transliteration: "Hasbunallahu wa ni'mal-wakil",
        translation: 'Sufficient for us is Allah, and He is the best Disposer of affairs',
        source: 'Sahih Bukhari 4563',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'flame',
        title: "Remember Ibrahim's fire",
        instruction:
          'Ibrahim (AS) said these exact words when thrown into a blazing fire — and Allah turned that fire into coolness and safety. Your situation is lighter than a fire, and the same God is protecting you.',
        source: 'Surah Al-Anbiya 21:69 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: "Pray two rak'ahs of need",
        instruction:
          'Pray Salat al-Hajah (prayer of need) and in your sujud, repeat "Hasbiyallah" while focusing your heart on handing the matter completely to Allah.',
        source:
          '"Whenever a matter distressed him, the Prophet ﷺ would rush to prayer." [Abu Dawud 1319]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection:
      'What changes when you truly believe Allah is the "Best Disposer" of your specific situation?',
  },
  {
    id: 'q_angle_2_257_anxious',
    contentId: 'quran_2_257',
    mood: 'Overwhelmed',
    angle:
      'Scholars explain that Allah as the "Wali" (Protector) actively guides the believer out of the darkness of confusion and worry into the light of certainty and peace. [Tafsir al-Qurtubi]',
    action: 'Identify a "darkness" of worry and ask Allah to lead you to the light of clarity.',
    actionHowTo:
      'Make a short, sincere Dua: "O Allah, lead me from the darkness of my worry to the light of Your guidance."',
    actionReward:
      'The Prophet ﷺ said: "Allah says: \'I am as My servant thinks of Me.\'" Expecting good from your Protector brings His light. [Sahih Bukhari 7405]',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for light',
        instruction: "Ask Allah to guide you from darkness to light using the Prophet's ﷺ own dua.",
        arabicText:
          'اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا وَفِي بَصَرِي نُورًا وَفِي سَمْعِي نُورًا',
        transliteration: "Allahumma-j'al fi qalbi nuran, wa fi basari nuran, wa fi sam'i nuran",
        translation: 'O Allah, place light in my heart, light in my sight, and light in my hearing',
        source: 'Sahih Muslim 763',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'light-bulb',
        title: 'Think well of your Wali',
        instruction:
          'Allah says "I am as My servant thinks of Me." Right now, choose to think the best of Allah — that He is actively bringing you from this darkness into light. Your good opinion of Him draws His help closer.',
        source: 'Sahih Bukhari 7405',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'candle',
        title: 'Name your darkness',
        instruction:
          'Write down the specific "darkness" — confusion, worry, or fear — you are in. Then physically cross it out and write: "Allah is bringing me to light." This act of trust is itself an act of worship.',
        source: 'Surah Al-Baqarah 2:257 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection:
      'How can trusting your Wali (Protector) help clear the path forward through this anxiety?',
  },
  {
    id: 'q_angle_8_40_anxious',
    contentId: 'quran_8_40',
    mood: 'Overwhelmed',
    angle:
      'Ibn Kathir explains that "ni\'ma al-Mawla wa ni\'ma al-Nasir" (Excellent is the Protector and Excellent is the Helper) means that Allah is the best of those who protect and the best of those who aid. When all people turn away, Allah remains your Guardian (Mawla). The Prophet ﷺ said on the day of Uhud: "Allah is sufficient for us and He is the best Disposer of affairs." This verse assures the believer that divine protection surpasses all worldly support. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action:
      'Recite: "Allāhumma mā asbaha bee min ni\'matin... fa minka wahdak" (O Allah, whatever blessing I have... is from You alone).',
    actionHowTo:
      'Recite this morning and evening to recognize Allah as the source of all your safety and provision.',
    actionReward:
      'The Prophet ﷺ said: "Whoever recites this... has fulfilled the gratitude of his day/night." [Sunan Abi Dawud 5073]',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'sunrise',
        title: 'Morning/evening gratitude dhikr',
        instruction:
          'Recite this prophetic morning and evening dua acknowledging Allah as the source of all your blessings.',
        arabicText: 'اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ',
        transliteration: "Allahumma ma asbaha bi min ni'matin fa minka wahdak, la sharika lak",
        translation:
          'O Allah, whatever blessing I have this morning is from You alone, with no partner',
        source: '"Whoever says this has fulfilled the gratitude of his day." [Abu Dawud 5073]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'shield',
        title: 'Your Mawla vs. your problem',
        instruction:
          'Compare your problem to your Protector. The One who controls the heavens and earth is your Mawla (Guardian). Resize your worry against His might — how big is your obstacle when the Creator of the universe is your Helper?',
        source: 'Surah Al-Anfal 8:40 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'pen',
        title: 'List 3 blessings right now',
        instruction:
          'Write down 3 specific blessings you have in this moment — health, a roof, someone who cares. Gratitude is the antidote to anxiety. The Prophet ﷺ said: "Look at those below you and do not look at those above you."',
        source: 'Sahih Muslim 2963',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'If the Creator is your Helper, how big is your obstacle really?',
  },
  {
    id: 'q_angle_5_23_anxious',
    contentId: 'quran_5_23',
    mood: 'Overwhelmed',
    angle:
      'Ibn Kathir narrates that two righteous men, Yusha ibn Nun and Kalib ibn Yufanna, urged the Israelites to trust Allah and take action. They said: "Enter upon them through the gate"—meaning take the first step—"and upon Allah put your trust if you are believers." This verse teaches that tawakkul (reliance on Allah) is not passivity; it is taking courageous action while trusting Allah with the outcome. True faith demands both effort and trust. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Take one action towards your goal, then leave the rest to Allah',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'door',
        title: 'Enter through the gate',
        instruction:
          'Identify one specific action you have been avoiding out of fear. Do it today — even a small version of it. Tawakkul means taking the step and trusting Allah with the result.',
        source: "Surah Al-Ma'idah 5:23 — Quran",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua before action',
        instruction: 'Before taking your step, say Bismillah and recite this dua of tawakkul.',
        arabicText: 'تَوَكَّلْتُ عَلَى اللَّهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
        transliteration: "Tawakkaltu 'alAllah, la hawla wa la quwwata illa billah",
        translation: 'I place my trust in Allah; there is no power or might except with Allah',
        source:
          '"Whoever says this when leaving his house, it is said to him: You are guided, sufficed, and protected." [Abu Dawud 5095]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'chat',
        title: 'Separate effort from outcome',
        instruction:
          "Remind yourself: your job is the effort, Allah's job is the outcome. The Israelites failed because they refused to act. The righteous succeed because they act AND trust. You are not responsible for the result.",
        source: 'Tafsir Ibn Kathir on 5:23',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does letting go of the outcome affect your current anxiety levels?',
  },
  {
    id: 'q_angle_14_12_anxious',
    contentId: 'quran_14_12',
    mood: 'Overwhelmed',
    angle:
      'The Prophets and Messengers declared: "Why should we not rely upon Allah when He has already guided us to our ways?" Imam al-Qurtubi explains that their argument was logical: the One who guided you through past confusion will not abandon you now. Past guidance is proof of future care. The Prophet ﷺ said: "Know Allah in prosperity and He will know you in adversity." Your history with Allah is evidence that He will see you through again. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Reflect on a time you were lost and how Allah directed you',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'rewind',
        title: 'Recall past rescues',
        instruction:
          'Think of 3 times in your life when you were lost, confused, or stuck — and how Allah guided you through. This is your personal proof that He will not abandon you now.',
        source: 'Surah Ibrahim 14:12 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dhikr of gratitude',
        instruction:
          'Say "Alhamdulillah" 33 times, each time recalling a specific blessing or rescue from your past.',
        arabicText: 'الْحَمْدُ لِلَّهِ',
        transliteration: 'Alhamdulillah',
        translation: 'All praise is due to Allah',
        source:
          '"Whoever says SubhanAllah 33 times, Alhamdulillah 33 times, Allahu Akbar 34 times..." [Muslim 597]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
        countSource: 'Muslim 597',
        count: 33,
      },
      {
        type: 'physical',
        icon: 'book-quran',
        title: 'Know Allah in ease',
        instruction:
          'Perform one act of worship right now — even a short prayer or charity — so that you "know Allah in prosperity and He will know you in adversity."',
        source: '"Know Allah in prosperity and He will know you in adversity." [Musnad Ahmad 2803]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'Why would the One who showed you the way now leave you alone?',
  },
  {
    id: 'q_angle_8_2_anxious',
    contentId: 'quran_8_2',
    mood: 'Overwhelmed',
    angle:
      'Ibn Kathir explains that true believers are described by three qualities: their hearts tremble when Allah is mentioned, their faith increases when His verses are recited, and they rely fully upon their Lord. Imam al-Sa\'di adds that faith is not static—it grows with every act of remembrance and recitation. The Prophet ﷺ said: "Faith wears out in the heart as a garment wears out, so ask Allah to renew faith in your hearts." [Tafsir Ibn Kathir, al-Sa\'di]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Listen to a recitation of your favorite surah for 5 minutes',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'headphones',
        title: 'Listen to Quran for 5 minutes',
        instruction:
          'Put on a recitation of your favorite surah. Close your eyes and let the words wash over you. Faith increases with every verse you hear.',
        source: '"The best of you are those who learn the Quran and teach it." [Bukhari 5027]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Ask Allah to renew your faith',
        instruction: 'Make this dua to renew the faith that has worn out in your heart.',
        arabicText: 'اللَّهُمَّ جَدِّدِ الْإِيمَانَ فِي قَلْبِي',
        transliteration: 'Allahumma jaddid al-imana fi qalbi',
        translation: 'O Allah, renew the faith in my heart',
        source:
          '"Faith wears out in the heart as a garment wears out, so ask Allah to renew faith in your hearts." [Al-Hakim, Sahih]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'chat',
        title: 'Faith is not static',
        instruction:
          'Understand that feeling low in faith is normal — the Prophet ﷺ himself acknowledged it wears out. But it can be renewed through dhikr, Quran, and dua. Your anxiety about your faith is itself a sign of faith.',
        source: 'Tafsir Ibn Kathir on 8:2',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does the Word of Allah bring stability to your trembling heart?',
  },
  {
    id: 'q_angle_67_29_anxious',
    contentId: 'quran_67_29',
    mood: 'Overwhelmed',
    angle:
      'This verse commands the Prophet ﷺ to declare: "He is the Most Merciful (Ar-Rahman); we have believed in Him, and upon Him we have relied." Ibn Kathir explains the pairing of Ar-Rahman with tawakkul: you are placing your trust not in a distant power, but in the One whose very name means infinite mercy and compassion. Al-Sa\'di notes that combining belief and reliance in the Most Merciful produces a tranquility that no worldly worry can shake. [Tafsir Ibn Kathir, Tafsir al-Sa\'di]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Breathe in "Ar-Rahman" (The Merciful) and breathe out your worry',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Breathing with Ar-Rahman',
        instruction:
          'Close your eyes. Breathe in slowly while thinking "Ar-Rahman" (The Merciful). Breathe out while releasing your worry. Direct your heart toward His infinite mercy.',
        source: 'Surah Al-Mulk 67:29 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'SubhanAllah dhikr',
        instruction:
          'Say "SubhanAllah" 33 times. Each time, remember that the One you are glorifying is Ar-Rahman — His mercy encompasses everything.',
        arabicText: 'سُبْحَانَ اللَّهِ',
        transliteration: 'SubhanAllah',
        translation: 'Glory be to Allah',
        source:
          '"Shall I not tell you of something better than all of that? SubhanAllah, Alhamdulillah, Allahu Akbar." [Muslim 2698]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
        countSource: 'Muslim 597',
        count: 33,
      },
      {
        type: 'mindset',
        icon: 'chat',
        title: 'Mercy reframe',
        instruction:
          'Your worry is being held by Ar-Rahman — the Most Merciful. He is not indifferent to your pain. His very name promises compassion. What if your difficulty is actually His mercy redirecting you to something better?',
        source: "Tafsir al-Sa'di on 67:29",
        sourceType: 'quran_dua',
      },
    ]),
    reflection: "How does focusing on Allah's mercy soften the edge of your anxiety?",
  },
  {
    id: 'q_angle_25_58_anxious',
    contentId: 'quran_25_58',
    mood: 'Overwhelmed',
    angle:
      'Allah commands: "Put your trust in the Ever-Living (Al-Hayy) who does not die." Ibn Kathir explains that every other support will eventually perish, but Allah is Al-Hayy Al-Qayyum—the Ever-Living, the Self-Sustaining. Imam al-Sa\'di adds: people, wealth, and health are temporary supports that fail, but the One who never dies never fails those who rely upon Him. This is why the Prophet ﷺ would say: "O Ever-Living, O Sustainer, by Your mercy I seek help." [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Acknowledge the temporary nature of people and trust in the Eternal',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Call upon Al-Hayy',
        instruction:
          'Recite this dua the Prophet ﷺ used in moments of distress, calling upon the Ever-Living.',
        arabicText: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
        transliteration: 'Ya Hayyu Ya Qayyum, bi-rahmatika astaghith',
        translation: 'O Ever-Living, O Sustainer, by Your mercy I seek help',
        source: 'Sunan at-Tirmidhi 3524 — Hasan',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'clock',
        title: 'Eternal vs. temporary',
        instruction:
          'Every person, job, or support you rely on will one day end. But Allah is Al-Hayy — He never dies, never sleeps, never forgets you. Shift your ultimate reliance from temporary supports to the One who is eternal.',
        source: 'Tafsir Ibn Kathir on 25:58',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Glorify Al-Hayy in sujud',
        instruction:
          'In your next sujud, say "SubhanAllah" and then add: "Ya Hayyu Ya Qayyum" — connecting your lowest physical position with the Highest eternal Being.',
        source: '"The closest a servant is to his Lord is when he is in sujud." [Muslim 482]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'What safety do you find in knowing your Support never dies?',
  },
  {
    id: 'q_angle_12_90_anxious',
    contentId: 'quran_12_90',
    mood: 'Overwhelmed',
    angle:
      'When Prophet Yusuf (AS) was finally reunited with his brothers after years of separation, he declared: "Whoever fears Allah and is patient—indeed, Allah does not allow the reward of those who do good to be lost." Ibn Kathir explains that Yusuf\'s story is living proof: decades of unjust imprisonment, betrayal, and exile were all redeemed. Al-Qurtubi adds that "taqwa" (God-consciousness) paired with "sabr" (patience) is the winning formula—no good deed done with these two qualities is ever wasted. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Choose patience in this moment as a deliberate act of worship',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'mosque',
        title: "Remember Yusuf's decades",
        instruction:
          'Yusuf (AS) endured betrayal, a well, slavery, and prison — for years. Yet every moment was being recorded. Your current struggle has an expiration date, and not a single moment of your patience is wasted.',
        source: 'Surah Yusuf 12:90 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Istighfar — 100 times',
        instruction:
          'The Prophet ﷺ used to seek forgiveness 100 times a day. Say "Astaghfirullah" as a means of relief and opening.',
        arabicText: 'أَسْتَغْفِرُ اللَّهَ',
        transliteration: 'Astaghfirullah',
        translation: 'I seek forgiveness from Allah',
        source:
          '"Whoever makes istighfar regularly, Allah will make a way out for him from every difficulty." [Abu Dawud 1518]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
        countSource: 'Muslim 2702 / Bukhari 6307',
        count: 100,
      },
      {
        type: 'physical',
        icon: 'handshake',
        title: 'Do one act of ihsan',
        instruction:
          'Yusuf responded to betrayal with excellence (ihsan). Do one kind act today for someone — even someone who wronged you. This is the taqwa + sabr formula that guarantees divine reward.',
        source: '"Allah does not allow the reward of those who do good to be lost." [Quran 12:90]',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How can you trust that your current struggle is being recorded for good?',
  },
  {
    id: 'q_angle_8_46_anxious',
    contentId: 'quran_8_46',
    mood: 'Overwhelmed',
    angle:
      'Allah says: "Obey Allah and His Messenger, and do not dispute... and be patient. Indeed, Allah is with the patient." Ibn Kathir explains that this "with-ness" (ma\'iyyah) is a special divine companionship—Allah\'s support, aid, and guidance. Al-Sa\'di distinguishes between Allah\'s general knowledge of all creation and His special presence with the patient: He strengthens them, guides them, and grants them victory. The Prophet ﷺ said to Ibn Abbas: "Know that if the whole nation were to benefit you, they could not benefit you except with what Allah has written for you." [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Wait for 30 seconds in silence, acknowledging Allah is with you right now',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'breathing',
        title: '30 seconds of sacred silence',
        instruction:
          'Close your eyes for 30 seconds. In the stillness, acknowledge: "Allah is with me right now." This is not poetic — it is a Quranic promise for those who are patient.',
        source: '"Indeed, Allah is with the patient." [Quran 8:46]',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua of the Prophet ﷺ for anxiety',
        instruction: "Recite the Prophet's ﷺ comprehensive dua for distress.",
        arabicText: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ',
        transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan",
        translation: 'O Allah, I seek refuge in You from anxiety and grief',
        source: 'Sahih Bukhari 6369',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'chat',
        title: 'What is already written',
        instruction:
          'The Prophet ﷺ told Ibn Abbas: "If the entire nation gathered to harm you, they could not harm you except with what Allah has written against you." Your situation is already written — and it was written by the Most Merciful.',
        source: 'Sunan at-Tirmidhi 2516 — Sahih',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How does knowing "Allah is with the patient" strengthen your Sabr in this moment?',
  },
  {
    id: 'q_angle_10_62_anxious',
    contentId: 'quran_10_62',
    mood: 'Overwhelmed',
    angle:
      'Allah declares: "Unquestionably, the allies (awliya) of Allah—no fear will there be concerning them, nor will they grieve." Ibn Kathir defines the awliya as those who believe and have taqwa (God-consciousness). Al-Qurtubi explains that the promise of "no fear" refers to the future (the Hereafter), while "no grief" refers to what they left behind in this world. The Prophet ﷺ said: "Allah said: Whoever shows enmity to a wali of Mine, I declare war against him." Being an ally of Allah is the ultimate security. [Tafsir Ibn Kathir, Sahih Bukhari 6502]',
    angleSource: 'Tafsir Ibn Kathir',
    action: "Make a small intention to do one thing today purely for Allah's sake",
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'gift',
        title: 'One deed purely for Allah',
        instruction:
          "Do one thing today purely for Allah's sake — give charity, help someone, or pray extra. This builds your status as a wali (ally) of Allah, and His allies have no fear.",
        source:
          '"Whoever shows enmity to a wali of Mine, I declare war against him." [Bukhari 6502]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Draw closer with nawafil',
        instruction:
          'Say "SubhanAllah wa bihamdihi" 100 times. The Prophet ﷺ said voluntary acts of worship draw you closest to Allah.',
        arabicText: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        transliteration: 'SubhanAllahi wa bihamdihi',
        translation: 'Glory be to Allah and His is the praise',
        source:
          '"Whoever says this 100 times, his sins are forgiven even if they were like the foam of the sea." [Bukhari 6405]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'shield',
        title: 'You are protected',
        instruction:
          'If you believe in Allah and strive for taqwa, you are already on the path of being His wali. And Allah declares war on anyone who threatens His allies. What fear can remain?',
        source: 'Surah Yunus 10:62-63 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What fear can remain when you are striving to be a friend of the Creator?',
  },
  {
    id: 'q_angle_29_20_anxious',
    contentId: 'quran_29_20',
    mood: 'Overwhelmed',
    angle:
      'The verse ends with a promise sized for whatever feels unmanageable right now: "Indeed Allah, over all things, is competent." Ibn Kathir explains that this is the same logic Allah gives elsewhere: "He it is who originates creation, then repeats it, and that is easier for Him" (30:27) — bringing something back is lighter work than creating it the first time. The same power that first brought creation into being out of nothing is the power behind whatever feels impossible in your life today. If Allah can begin something from nothing, He can certainly handle what already exists — including your situation. [Tafsir Ibn Kathir, Surah Al-Ankabut]',
    angleSource: 'Tafsir Ibn Kathir',
    action: "Name the thing that feels impossible right now, and say \"Allahu 'ala kulli shay'in qadir\" (Allah is competent over all things) over it.",
    reflection: 'What are you treating as impossible that this verse says is well within Allah\'s power?',
  },

  // === SAD ANGLES ===
  {
    id: 'q_angle_93_3_sad',
    contentId: 'quran_93_3',
    mood: 'Sad',
    angle:
      'Surah Ad-Duha was revealed after a painful gap in revelation when the Prophet ﷺ feared Allah had forsaken him. Ibn Kathir explains that Allah swears by the morning light and the still night to assure His beloved: "Your Lord has not forsaken you, nor has He become displeased." Al-Sa\'di adds that the oath by the brightness of the morning is itself a sign—just as dawn always follows darkness, divine care always follows perceived silence. The Prophet ﷺ was being told: your difficulty is temporary, but My love for you is permanent. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Recite the Duha prayer (mid-morning) as a gratitude session for your soul.',
    actionHowTo:
      "Pray 2 to 4 Rak'ahs between sunrise and Dhuhr, focusing on the light of Allah returning to your day.",
    actionReward:
      'The Prophet ﷺ said: "In the morning, charity is due for every joint of your body... and two rak\'ahs of Duha suffice for all that." [Sahih Muslim 720]',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'sunrise',
        title: 'Pray Salat al-Duha',
        instruction:
          "Pray 2 to 4 rak'ahs of Duha prayer between sunrise and Dhuhr. This is the prayer of the morning light — the same light Allah swore by to comfort His Prophet ﷺ.",
        source:
          '"Two rak\'ahs of Duha suffice as charity for every joint in your body." [Muslim 720]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'crescent',
        title: 'Dawn always follows darkness',
        instruction:
          'Allah swore by the morning light and the still of the night. Just as dawn always follows the darkest part of night, His care always follows the silence you feel. Your difficulty is temporary, but His love is permanent.',
        source: 'Tafsir Ibn Kathir on 93:1-3',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua against sadness',
        instruction: "Recite the Prophet's ﷺ comprehensive dua against sadness.",
        arabicText:
          'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ',
        transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazani wal-'ajzi wal-kasali",
        translation: 'O Allah, I seek refuge in You from worry, grief, incapacity, and laziness',
        source: 'Sahih Bukhari 6369',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: "When have you felt Allah's presence during difficult times?",
  },
  {
    id: 'q_angle_39_53_sad',
    contentId: 'quran_39_53',
    mood: 'Sad',
    angle:
      'Allah says: "Say, O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins." Ibn Kathir explains this is the most hope-giving verse in the Quran—a direct divine invitation to those drowning in guilt or sadness. Al-Qurtubi notes that "all sins" means without exception when met with sincere repentance. The Prophet ﷺ said: "Allah is more delighted with the repentance of His servant than a man who finds his lost camel in the desert." [Sahih Muslim 2747] No sadness is beyond His healing. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Ask Allah for His mercy with full conviction He will respond',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Tawbah with hope',
        instruction:
          'Make sincere tawbah right now. Say "Astaghfirullah wa atubu ilayh" 33 times with the certainty that Allah forgives ALL sins.',
        arabicText: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
        transliteration: 'Astaghfirullaha wa atubu ilayh',
        translation: 'I seek forgiveness from Allah and turn to Him in repentance',
        source:
          '"Allah is more delighted with your repentance than a man who finds his lost camel in the desert." [Muslim 2747]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'breathing',
        title: 'The most hope-giving verse',
        instruction:
          '"Say: O My slaves who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins. Indeed, He is the Oft-Forgiving, the Most Merciful." [Quran 39:53]',
        source: 'Quran 39:53',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'water-drop',
        title: 'Wudu of renewal',
        instruction:
          "Make wudu with the intention of washing away the weight of your sadness. The Prophet ﷺ said sins fall away with the water of wudu. Then pray 2 rak'ahs of tawbah as a fresh start.",
        source: '"When a Muslim performs wudu, his sins fall away with the water." [Muslim 244]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'How does knowing Allah forgives ALL sins affect your sadness?',
  },
  {
    id: 'q_angle_57_4_sad',
    contentId: 'quran_57_4',
    mood: 'Sad',
    angle:
      'Allah says: "He is with you wherever you are." Ibn Kathir explains that this "with-ness" (ma\'iyyah) means Allah\'s knowledge, sight, and care encompass you at every moment—in your loneliest night, in your deepest grief. Al-Sa\'di adds that this is not just surveillance but active support: He knows exactly what you are feeling and is already arranging your relief. The Prophet ﷺ said: "Allah says: I am as My servant thinks of Me, and I am with him when he remembers Me." [Sahih Bukhari 7405] Even when you feel alone, you are never unseen. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: "Sit quietly and acknowledge Allah's presence with you right now",
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Sit in His presence',
        instruction:
          'Sit quietly for 60 seconds. Close your eyes and internally acknowledge: "Allah is with me right now. He sees my sadness. He is already arranging my relief." This is not imagination — it is a Quranic fact.',
        source: 'Surah Al-Hadid 57:4 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Remember Him and He remembers you',
        instruction:
          'Say "SubhanAllah" 33 times, "Alhamdulillah" 33 times, and "Allahu Akbar" 34 times. Allah said: "I am with him when he remembers Me."',
        arabicText: 'سُبْحَانَ اللَّهِ، الْحَمْدُ لِلَّهِ، اللَّهُ أَكْبَرُ',
        transliteration: 'SubhanAllah, Alhamdulillah, Allahu Akbar',
        translation: 'Glory be to Allah, All praise is for Allah, Allah is the Greatest',
        source:
          '"I am as My servant thinks of Me, and I am with him when he remembers Me." [Bukhari 7405]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'chat',
        title: 'Think well of Allah',
        instruction:
          'Allah said: "I am as My servant thinks of Me." If you think He has abandoned you, you may not feel His presence. But if you think He is arranging your relief — that is exactly what He will do. Change your assumption about Allah right now.',
        source: 'Sahih Bukhari 7405',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: "How does Allah's constant presence comfort you in sadness?",
  },

  {
    id: 'q_angle_2_155_sad',
    contentId: 'quran_2_155',
    mood: 'Sad',
    angle:
      'Allah says: "Give glad tidings to the patient—those who, when disaster strikes them, say: Indeed we belong to Allah, and indeed to Him we will return." Ibn Kathir explains that this statement (Inna lillahi wa inna ilayhi raji\'un) is the most powerful response to calamity in Islam. Al-Qurtubi notes that "glad tidings" for the patient means blessings, mercy, and guidance descend specifically upon those who respond to loss with this phrase. The Prophet ﷺ said: "No Muslim is afflicted with a calamity and says this, except that Allah will reward him and replace what was lost with something better." [Sahih Muslim 918] [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Say "Inna lillahi wa inna ilayhi raji\'un" and feel its weight',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The most powerful response to loss',
        instruction:
          'Say "Inna lillahi wa inna ilayhi raji\'un" slowly and with meaning. Then add the Prophet\'s ﷺ follow-up dua.',
        arabicText:
          'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ، اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَأَخْلِفْ لِي خَيْرًا مِنْهَا',
        transliteration:
          "Inna lillahi wa inna ilayhi raji'un. Allahumma'jurni fi musibati wa akhlif li khayran minha",
        translation:
          'To Allah we belong and to Him we return. O Allah, reward me in my affliction and replace it with something better',
        source: 'Sahih Muslim 918',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'gift',
        title: 'Glad tidings for the patient',
        instruction:
          'Allah did not just say "be patient" — He said "give them GLAD TIDINGS." Blessings, mercy, and guidance descend on those who respond to loss with patience. Your sadness is being replaced by things you cannot yet see.',
        source: 'Tafsir al-Qurtubi on 2:155-157',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'heart',
        title: 'Let yourself grieve',
        instruction:
          'The Prophet ﷺ wept when his son Ibrahim died and said: "The eyes shed tears, the heart grieves, but we say nothing except what pleases our Lord." Crying is not weakness — it is human. Grieve, but grieve with faith.',
        source: 'Sahih Bukhari 1303',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'How does returning everything to Allah lighten the load of your loss?',
  },
  {
    id: 'q_angle_3_139_sad',
    contentId: 'quran_3_139',
    mood: 'Sad',
    angle:
      'Allah says: "Do not weaken and do not grieve, for you are superior if you are true believers." Ibn Kathir explains this was revealed after the Battle of Uhud when the Muslims suffered losses and were demoralized. Allah reminded them that their faith places them above any temporary defeat. Al-Sa\'di adds that a believer\'s worth is not measured by worldly outcomes but by their standing with Allah. Grief is natural, but it should not lead to despair—because the one who has Allah has everything. The Prophet ﷺ said: "Wonderful is the affair of the believer, for his affairs are all good." [Sahih Muslim 2999] [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Straighten your posture and remind yourself of your dignity as a believer',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'person',
        title: 'Straighten your posture',
        instruction:
          'Physically sit or stand upright. Straighten your back, lift your chin. Allah said "you are superior" — carry yourself with the dignity of someone whose worth is measured by their Lord, not by their circumstances.',
        source: 'Surah Al-Imran 3:139 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'star',
        title: 'Your worth is with Allah',
        instruction:
          'This verse was revealed after a devastating defeat at Uhud. Despite losing the battle, Allah told the believers: "You are superior." Your worth is not measured by worldly outcomes but by your standing with Allah. If you have Him, you have everything.',
        source: 'Tafsir Ibn Kathir on 3:139',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: "The believer's affair is all good",
        instruction:
          'Say "Alhamdulillah \'ala kulli hal" (All praise is for Allah in every situation). The Prophet ﷺ said the believer\'s affair is always good — if something good happens, they are grateful, and if something bad happens, they are patient.',
        arabicText: 'الْحَمْدُ لِلَّهِ عَلَى كُلِّ حَالٍ',
        transliteration: "Alhamdulillah 'ala kulli hal",
        translation: 'All praise is for Allah in every situation',
        source:
          '"Wonderful is the affair of the believer, for his affairs are all good." [Muslim 2999]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'How can your status with Allah give you strength when you feel low?',
  },
  {
    id: 'q_angle_65_7_sad',
    contentId: 'quran_65_7',
    mood: 'Sad',
    angle:
      'Allah says: "Allah will bring about, after hardship, ease." Ibn Kathir explains that this is a divine promise with no exceptions—every hardship has an expiration date, but ease is guaranteed. Al-Sa\'di notes that the verse uses the definite article for "hardship" (al-\'usr) but the indefinite for "ease" (yusra), meaning the hardship is specific and limited, while the ease that follows is open-ended and multiplied. The Prophet ﷺ said: "Know that victory comes with patience, relief comes with affliction, and with hardship comes ease." [Musnad Ahmad] [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action:
      'Recite "Lā hawla wa lā quwwata illā billāh" (There is no power or might except with Allah).',
    actionHowTo:
      "Repeat this phrase while acknowledging that the transition from hardship to ease is entirely in Allah's hands.",
    actionReward:
      'The Prophet ﷺ said: "It is a treasure from the treasures of Paradise." [Sahih Bukhari 6384]',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'A treasure of Paradise',
        instruction:
          'Repeat "La hawla wa la quwwata illa billah" slowly. The Prophet ﷺ called this a treasure of Paradise.',
        arabicText: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
        transliteration: 'La hawla wa la quwwata illa billah',
        translation: 'There is no power or might except with Allah',
        source: '"It is a treasure from the treasures of Paradise." [Bukhari 6384]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'clock',
        title: 'Hardship has an expiration date',
        instruction:
          "Your hardship is definite and limited (al-'usr). But the ease coming after it is indefinite and multiplied (yusra). In Arabic grammar, Allah made your pain specific — it will end. But He left the ease open-ended — it keeps growing.",
        source: "Tafsir al-Sa'di on 65:7",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'pen',
        title: 'Write your proof',
        instruction:
          "Write down 3 times in your past when something hard ended and ease followed. This is your personal evidence of Allah's promise. Every hardship in your history has expired — this one will too.",
        source: '"Victory comes with patience, relief comes with affliction." [Musnad Ahmad]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How has your life proven that no difficulty lasts forever?',
  },
  {
    id: 'q_angle_21_87_sad',
    contentId: 'quran_21_87',
    mood: 'Sad',
    angle:
      'Prophet Yunus (AS) called out from the belly of the whale in total darkness: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers." Ibn Kathir explains that this dua combines three powerful elements: affirming Allah\'s oneness (Tawhid), glorifying Him (Tasbih), and admitting one\'s own shortcomings (Istighfar). Al-Qurtubi notes that Allah responded immediately: "So We responded to him and saved him from the distress. And thus do We save the believers." The Prophet ﷺ said: "No Muslim supplicates with this dua regarding any matter except that Allah responds to him." [At-Tirmidhi 3505] [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Recite "La ilaha illa anta subhanaka..." with deep humility',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua of Yunus (AS)',
        instruction:
          'Recite the dua of Yunus — the Prophet ﷺ guaranteed that no Muslim says this except that Allah responds.',
        arabicText: 'لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ',
        transliteration: 'La ilaha illa anta subhanaka inni kuntu minaz-zalimin',
        translation:
          'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers',
        source: '"No Muslim supplicates with this except that Allah responds." [Tirmidhi 3505]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'bird',
        title: 'From the darkest place',
        instruction:
          'Yunus was inside a whale, inside the ocean, inside the darkness of night — three layers of darkness. Yet his dua reached Allah instantly. No matter how deep your sadness, your call to Allah has no barriers.',
        source: 'Tafsir Ibn Kathir on 21:87',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: "Pray 2 rak'ahs of need",
        instruction:
          "Pray two rak'ahs and in each sujud recite the dua of Yunus repeatedly. This combines the three most powerful spiritual acts: Tawhid, Tasbih, and Istighfar — all in the position closest to Allah.",
        source: '"And thus do We save the believers." [Quran 21:88]',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does admitting your need for Allah bring comfort in your distress?',
  },
  {
    id: 'q_angle_3_8_sad',
    contentId: 'quran_3_8',
    mood: 'Sad',
    angle:
      'This verse contains the dua: "Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself." Ibn Kathir explains that the believers ask this because they know their hearts are between Allah\'s fingers—He turns them as He wills. Al-Qurtubi adds that the request for "mercy from Yourself" (ladunka) refers to a special, direct mercy that only comes from divine grace, not from human effort. The Prophet ﷺ would frequently make this dua, showing that even the most guided hearts need Allah\'s constant protection from deviation. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Make the dua: "Rabbana la tuzigh qulubana..." slowly',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for heart protection',
        instruction: 'Recite this Quranic dua slowly, feeling each word.',
        arabicText:
          'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً',
        transliteration:
          "Rabbana la tuzigh qulubana ba'da idh hadaytana wa hab lana min ladunka rahmah",
        translation:
          'Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself',
        source: 'Surah Al-Imran 3:8 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'heart',
        title: 'Special divine mercy',
        instruction:
          'The word "ladunka" means a special, direct mercy from Allah Himself — not from any intermediary or effort. When sadness weighs on your heart, ask for this unique mercy that only He can give. It is a direct infusion of peace from the Lord of the worlds.',
        source: 'Tafsir al-Qurtubi on 3:8',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Place hand on heart',
        instruction:
          'Place your hand on your chest and say: "Ya Muqallib al-qulub, thabbit qalbi \'ala dinik" (O Turner of hearts, make my heart firm upon Your religion). The Prophet ﷺ made this dua frequently because hearts are between Allah\'s fingers.',
        source: '"O Turner of hearts, make my heart firm upon Your religion." [Tirmidhi 2140]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'What would it feel like for Allah to pour His special mercy into your heart?',
  },
  {
    id: 'q_angle_40_60_sad',
    contentId: 'quran_40_60',
    mood: 'Sad',
    angle:
      'Allah says: "Call upon Me; I will respond to you." Ibn Kathir explains that this is one of the most direct promises in the Quran—Allah Himself guarantees a response to every sincere caller. Al-Sa\'di notes that the word "ud\'uni" (call upon Me) is an invitation, meaning Allah wants you to bring your pain, your sadness, and your needs to Him. The Prophet ﷺ said: "Your Lord is Generous and Shy; if His servant raises his hands to Him, He is shy to return them empty." [Abu Dawud 1488] Your grief is not a burden to Allah—it is the very reason He invites you to speak. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Talk to Allah in your own language about what hurts',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Raise your hands',
        instruction:
          'Lift your palms to the sky and talk to Allah in your own language about exactly what hurts. He is too Generous and Shy to return your hands empty. There are no wrong words — just speak.',
        source: '"Your Lord is Generous and Shy; He is shy to return them empty." [Abu Dawud 1488]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'pen',
        title: 'He invited you',
        instruction:
          '"Call upon Me" is not just permission — it is an invitation. Allah WANTS you to bring your pain to Him. Your sadness is not a burden to your Lord; it is the very reason He told you to speak. Silence is the only wrong response.',
        source: "Tafsir al-Sa'di on 40:60",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua in sujud',
        instruction:
          'Go into sujud and make dua in your own words. Be specific about what makes you sad. Then say this comprehensive dua.',
        arabicText:
          'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ وَرَحْمَتِكَ فَإِنَّهُ لَا يَمْلِكُهَا إِلَّا أَنْتَ',
        transliteration:
          "Allahumma inni as'aluka min fadlika wa rahmatika fa innahu la yamlikuha illa ant",
        translation:
          'O Allah, I ask You of Your bounty and mercy, for none possesses them except You',
        source: 'Tabarani — Hasan',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How does knowing Allah guarantees a response change your silence?',
  },
  {
    id: 'q_angle_39_10_sad',
    contentId: 'quran_39_10',
    mood: 'Sad',
    angle:
      'Allah says: "Indeed, the patient will be given their reward without account." Ibn Kathir explains that "without account" (bi ghayri hisab) means the reward for patience is so immense that it cannot be measured or calculated—it is limitless. Al-Qurtubi adds that this is the only deed for which Allah promises a reward without limit, elevating patience above all other acts of worship in times of trial. The Prophet ﷺ said: "No one is given a gift better and more comprehensive than patience." [Sahih Bukhari 1469] Your silent endurance is being recorded at a rate beyond human comprehension. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Acknowledge your current patience as an investment for the Hereafter',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'target',
        title: 'Reward without limit',
        instruction:
          'Patience is the ONLY deed for which Allah promises reward "without account" — meaning limitless. Every moment of your silent endurance right now is being recorded at a rate beyond human comprehension. Your sadness is an investment.',
        source: 'Tafsir al-Qurtubi on 39:10',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Words of the patient',
        instruction:
          'Say "Inna lillahi wa inna ilayhi raji\'un. Allahumma\'jurni fi musibati wa akhlif li khayran minha" — the prophetic response to every affliction.',
        arabicText: 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ',
        transliteration: "Inna lillahi wa inna ilayhi raji'un",
        translation: 'Indeed we belong to Allah, and indeed to Him we will return',
        source:
          '"No one is given a gift better and more comprehensive than patience." [Bukhari 1469]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Patience in prayer',
        instruction:
          "Pray two rak'ahs and in your sujud, simply be still. Don't rush. Let the silence itself be an act of patience. The Prophet ﷺ said patience is a light — let it fill you in this moment of stillness.",
        source: '"Patience is a light." [Sahih Muslim 223]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'What value does your silent endurance hold in the eyes of the Merciful?',
  },
  {
    id: 'q_angle_11_115_sad',
    contentId: 'quran_11_115',
    mood: 'Sad',
    angle:
      'Allah says: "And be patient, for indeed, Allah does not allow to be lost the reward of those who do good." Ibn Kathir explains that this is a divine guarantee: every act of goodness—no matter how small, no matter how unnoticed by people—is recorded and preserved by Allah. Al-Sa\'di adds that patience during sadness is itself a "good deed" (ihsan) that earns this promise. The Prophet ﷺ said: "No fatigue, disease, sorrow, sadness, hurt, or distress befalls a Muslim, even the prick of a thorn, except that Allah expiates some of his sins for that." [Sahih Bukhari 5641] Your struggle is never wasted. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Do one small good deed today, however simple, in spite of your sadness',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'leaf',
        title: 'One good deed despite sadness',
        instruction:
          'Do one small good deed right now — smile at someone, send a kind message, give charity, or even just make dua for another person. Doing good while sad is the highest form of ihsan. Allah will never let it be lost.',
        source: '"Even the prick of a thorn expiates sins." [Bukhari 5641]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'home',
        title: 'Nothing is wasted',
        instruction:
          "Every tear, every ache, every moment of holding on — it is all being recorded by Allah. He does not lose even an atom's weight of good. Your patience during this sadness IS the good deed that earns a limitless reward.",
        source: "Tafsir al-Sa'di on 11:115",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for patience',
        instruction: 'Ask Allah to fill your heart with patience.',
        arabicText: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَتَوَفَّنَا مُسْلِمِينَ',
        transliteration: "Rabbana afrigh 'alayna sabran wa tawaffana muslimeen",
        translation: 'Our Lord, pour upon us patience and let us die as Muslims',
        source: "Surah Al-A'raf 7:126 — Quran",
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does it feel to know that Allah never loses sight of your effort?',
  },
  {
    id: 'q_angle_39_53_sad_angle',
    contentId: 'quran_39_53',
    mood: 'Sad',
    angle:
      'Ibn Kathir emphasizes that Allah uses the phrase "ya ibadi" (O My servants)—claiming the sinners as His own servants—before telling them not to despair. This is an embrace, not a rejection. Al-Sa\'di explains that the verse establishes that no sin is too great for Allah\'s forgiveness when met with sincere repentance (tawbah nasuha). The Prophet ﷺ said: "If you were to commit sins until your sins filled the space between the heavens and earth, then you sought forgiveness from Allah, He would forgive you." [Musnad Ahmad] Despair itself is the only real barrier to healing. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: "Let go of one regret as a gift to yourself and trust in Allah's mercy",
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'heart',
        title: '"O MY servants"',
        instruction:
          'Notice: Allah says "ya ibadi" — O MY servants. Even to those who transgressed, He claims them as His own. This is not a rejection. It is an embrace. You are still His servant, no matter what you have done.',
        source: 'Tafsir Ibn Kathir on 39:53',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Istighfar that fills the heavens',
        instruction:
          'Say "Astaghfirullah" 100 times. The Prophet ﷺ said: "If your sins filled the space between heaven and earth, then you sought forgiveness, He would forgive you."',
        arabicText: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ',
        transliteration: "Astaghfirullaha al-'Azeem wa atubu ilayh",
        translation: 'I seek forgiveness from Allah the Almighty and turn to Him in repentance',
        source: 'Musnad Ahmad — Sahih',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
        countSource: 'Muslim 2702 / Bukhari 6307',
        count: 100,
      },
      {
        type: 'physical',
        icon: 'gift',
        title: 'Let go of one regret',
        instruction:
          'Think of one regret that weighs on you. Verbally say: "Ya Allah, I release this to You. I trust in Your mercy." Then physically take a deep breath and exhale slowly — breathe the weight out. Despair is the only barrier to healing.',
        source: "Tafsir al-Sa'di on 39:53",
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'If Allah can forgive ALL sins, can He not also heal ALL sorrows?',
  },
  {
    id: 'q_angle_2_186_sad',
    contentId: 'quran_2_186',
    mood: 'Sad',
    angle:
      'Allah says: "And when My servants ask you concerning Me—indeed I am near. I respond to the invocation of the supplicant when he calls upon Me." Ibn Kathir notes that Allah did not say "tell them I am near" but said directly "I am near"—removing any intermediary. Al-Qurtubi explains that this nearness is not physical but spiritual: Allah hears every whisper, every silent tear, every unspoken plea. The Prophet ﷺ said: "The closest a servant is to his Lord is during prostration, so increase your supplications therein." [Sahih Muslim 482] When the world feels distant, Allah is closer than ever. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Place your hand on your heart and whisper "Ya Qareeb" (O Near One)',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'heart',
        title: 'Hand on heart',
        instruction:
          'Place your hand on your heart and whisper "Ya Qareeb" (O Near One) three times. Feel the warmth of your hand. Allah is nearer to you than your own heartbeat.',
        source: 'Surah Al-Baqarah 2:186 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'target',
        title: 'No intermediary needed',
        instruction:
          'Notice: Allah did not say "tell them I am near." He said directly "I am near" — removing every intermediary. You do not need a special place, a special person, or a special time. Right now, right here, He hears you.',
        source: 'Tafsir Ibn Kathir on 2:186',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Whisper in sujud',
        instruction:
          'Go into sujud — the position where you are closest to Allah — and whisper your need. You do not have to be eloquent. He hears even what you cannot say.',
        arabicText: 'يَا قَرِيبُ يَا مُجِيبُ',
        transliteration: 'Ya Qareeb, Ya Mujeeb',
        translation: 'O Near One, O Responsive One',
        source: '"The closest a servant is to his Lord is in sujud." [Muslim 482]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'What does the nearness of Allah mean for your current feeling of isolation?',
  },
  {
    id: 'q_angle_41_30_sad',
    contentId: 'quran_41_30',
    mood: 'Sad',
    angle:
      'Allah says: "Indeed, those who have said, \'Our Lord is Allah,\' and then remained on a right course—the angels will descend upon them, saying: Do not fear and do not grieve, and receive good tidings of Paradise." Ibn Kathir explains that "istiqamah" (remaining steadfast) means consistency in faith through both ease and hardship. Al-Qurtubi adds that the angels descend not only at death but throughout life, bringing unseen comfort and reassurance to the steadfast believer. The Prophet ﷺ said: "Say: I believe in Allah, then be steadfast." [Sahih Muslim 38] Steadfastness in sadness is itself an act that summons angelic support. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Affirm your faith by saying "Rabbunāllāh" (Our Lord is Allah) and remain steadfast.',
    actionHowTo:
      'Focus on the absolute sovereignty of your Lord and let it ground your current sadness in certainty.',
    actionReward:
      'Allah says the angels descend upon such people saying: "Do not fear and do not grieve." [Quran 41:30]',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Affirm and be steadfast',
        instruction:
          'Say "Rabbunallah" (Our Lord is Allah) followed by "Amantu billah, thumma istaqim" (I believe in Allah, then be steadfast). This is the formula that summons angelic support.',
        arabicText: 'رَبُّنَا اللَّهُ ثُمَّ اسْتَقَامُوا',
        transliteration: 'Rabbunallahu thumma istaqamu',
        translation: 'Our Lord is Allah, and then they remained steadfast',
        source: '"Say: I believe in Allah, then be steadfast." [Muslim 38]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'star',
        title: 'Angels are with you now',
        instruction:
          'The angels do not only descend at death — Al-Qurtubi says they descend throughout life, bringing unseen comfort to the steadfast. Right now, as you hold on to your faith through sadness, angelic support is being sent to you.',
        source: 'Tafsir al-Qurtubi on 41:30',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Pray your next salah on time',
        instruction:
          'The simplest act of istiqamah right now is to pray your next salah on time, even when you do not feel like it. Steadfastness in sadness is the act that summons angels saying: "Do not fear and do not grieve."',
        source: 'Tafsir Ibn Kathir on 41:30',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does the promise of "no fear and no grief" comfort you today?',
  },
  {
    id: 'q_angle_20_46_sad',
    contentId: 'quran_20_46',
    mood: 'Sad',
    angle:
      'Allah told Musa and Harun (AS): "Do not fear; indeed, I am with you both. I hear and I see." Ibn Kathir explains that Allah assured His prophets with two of His names: As-Sami\' (The All-Hearing) and Al-Basir (The All-Seeing). Al-Sa\'di adds that this assurance extends to every believer in distress—Allah hears the grief you cannot articulate and sees the tears you shed in private. The Prophet ﷺ said: "Indeed Allah does not look at your appearance or wealth, but He looks at your hearts and your deeds." [Sahih Muslim 2564] Your inner world is fully known and deeply cared for. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Rest in the knowledge that you are fully seen and understood by Allah',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'eye',
        title: 'He hears and He sees',
        instruction:
          "Allah assured Musa with two Names: As-Sami' (The All-Hearing) and Al-Basir (The All-Seeing). He hears the grief you cannot articulate. He sees the tears you shed in private. You do not need to explain yourself to the One who already knows.",
        source: "Tafsir al-Sa'di on 20:46",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Call on the Hearer and Seer',
        instruction:
          'Say "Ya Sami\', Ya Basir" (O All-Hearing, O All-Seeing) slowly. Then speak your sadness aloud — even in a whisper. He is listening.',
        arabicText: 'يَا سَمِيعُ يَا بَصِيرُ',
        transliteration: "Ya Sami', Ya Basir",
        translation: 'O All-Hearing, O All-Seeing',
        source: 'Surah Ta-Ha 20:46 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Rest in being known',
        instruction:
          'Sit quietly for a moment and let go of the need to explain your sadness to anyone. Allah does not look at your appearance — He looks at your heart. And He already knows what is in it. Let that knowledge give you rest.',
        source: '"Allah looks at your hearts and your deeds." [Muslim 2564]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'How does being "seen and heard" by the Creator change your sadness?',
  },
  {
    id: 'q_angle_24_22_sad',
    contentId: 'quran_24_22',
    mood: 'Sad',
    angle:
      'Allah says: "Let them pardon and overlook. Would you not like that Allah should forgive you?" Ibn Kathir explains this was revealed about Abu Bakr (RA) when he wanted to cut off support to a relative who had slandered his daughter Aisha (RA). Despite the deep hurt, Allah asked: would you not prefer My forgiveness over your revenge? Al-Qurtubi notes that pardoning others is presented as a direct path to receiving Allah\'s own pardon. The Prophet ﷺ said: "Be merciful to others and you will receive mercy. Forgive others and Allah will forgive you." [Musnad Ahmad 7001] Pardoning heals the pardoner first. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Think of one person to forgive, purely for the sake of your own inner peace',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'heart',
        title: 'Pardoning heals the pardoner',
        instruction:
          'Abu Bakr (RA) was deeply hurt when his own relative slandered his daughter. Yet Allah asked him: "Would you not like that Allah should forgive YOU?" Abu Bakr immediately said yes and resumed his support. Forgiveness is not for the other person — it is your ticket to Allah\'s mercy.',
        source: 'Tafsir Ibn Kathir on 24:22',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Name and release',
        instruction:
          'Think of one person who has hurt you. In your heart, say: "Ya Allah, I forgive them for Your sake. Forgive me as I have forgiven them." Then take a deep breath and release the weight. This is for YOUR inner peace.',
        source: '"Forgive others and Allah will forgive you." [Musnad Ahmad 7001]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for mercy',
        instruction: 'Ask Allah for His mercy in exchange for the mercy you are showing others.',
        arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ رَحْمَتَكَ',
        transliteration: "Allahumma inni as'aluka rahmatak",
        translation: 'O Allah, I ask You for Your mercy',
        source: '"Be merciful to others and you will receive mercy." [Ahmad 7001]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: "How can being merciful to others draw Allah's mercy to your own heart?",
  },
  {
    id: 'q_angle_8_33_sad',
    contentId: 'quran_8_33',
    mood: 'Sad',
    angle:
      'Allah says: "But Allah would not punish them while you are among them, and Allah would not punish them while they seek forgiveness." Ibn Kathir explains that istighfar (seeking forgiveness) serves as a shield from calamity—it is one of two protections mentioned in this verse. Al-Sa\'di adds that regularly seeking forgiveness creates a spiritual barrier against hardship and opens doors of ease. The Prophet ﷺ said: "Whoever makes istighfar a constant practice, Allah will provide him a way out of every difficulty, relief from every anxiety, and will provide for him from sources he could never ponder." [Abu Dawud 1518] Forgiveness is both healing and protection. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Repeat "Astaghfirullah" 11 times, focusing on its protective power',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Shield of istighfar',
        instruction:
          'Say "Astaghfirullah" slowly and with presence. Each one creates a spiritual shield around you — protection from calamity and a door to ease.',
        arabicText: 'أَسْتَغْفِرُ اللَّهَ',
        transliteration: 'Astaghfirullah',
        translation: 'I seek forgiveness from Allah',
        source:
          '"Whoever makes istighfar constant, Allah provides a way out of every difficulty." [Abu Dawud 1518]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'shield',
        title: 'Two divine protections',
        instruction:
          'This verse mentions two shields from punishment: the presence of the Prophet ﷺ and istighfar. The Prophet ﷺ has passed, but istighfar remains. It is your personal shield — keeping you protected and opening doors of ease you cannot yet see.',
        source: 'Tafsir Ibn Kathir on 8:33',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Wudu and istighfar',
        instruction:
          'Make wudu while saying "Astaghfirullah" with each limb you wash. Water cleanses the body; istighfar cleanses the soul. Both together create a complete renewal.',
        source: "Tafsir al-Sa'di on 8:33",
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does seeking forgiveness help settle the turbulence of your mind?',
  },
  {
    id: 'q_angle_50_16_sad',
    contentId: 'quran_50_16',
    mood: 'Sad',
    angle:
      'Allah says: "And We have already created man and know what his soul whispers to him, and We are closer to him than his jugular vein." Ibn Kathir explains that this closeness refers to Allah\'s complete knowledge—He knows your innermost thoughts before you even form them into words. Al-Qurtubi notes that the jugular vein was chosen because it is the closest vital vessel to the heart and brain; Allah\'s awareness of you is even more intimate than that. The Prophet ﷺ said: "Allah was before everything, and nothing was before Him." [Sahih Bukhari] Your sadness, your hope, your silent cries—He knows them all before you speak. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Breathe deeply and acknowledge that Allah is with you in every breath',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Breathe with awareness',
        instruction:
          'Take 5 deep breaths. With each inhale, think: "Allah is closer to me than my jugular vein." With each exhale, release the weight of your sadness. He already knows what your soul whispers — you do not need to carry it alone.',
        source: 'Surah Qaf 50:16 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'star',
        title: 'Closer than your jugular vein',
        instruction:
          "The jugular vein is the closest vital vessel to your heart and brain. Allah chose this image to show that His awareness of you is more intimate than your own body's connection to itself. He knows what your soul whispers before you even form the thought.",
        source: 'Tafsir al-Qurtubi on 50:16',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Speak to the Nearest',
        instruction:
          'Whisper your sadness to Allah right now — even one sentence. He is not far away. He is closer than your own breath.',
        arabicText: 'يَا قَرِيبُ يَا مُجِيبُ أَنْتَ أَقْرَبُ إِلَيَّ مِنْ حَبْلِ الْوَرِيدِ',
        transliteration: 'Ya Qareeb, Ya Mujeeb, anta aqrabu ilayya min hablil-wareed',
        translation: 'O Near One, O Responsive One, You are closer to me than my jugular vein',
        source: 'Derived from Quran 50:16',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'If Allah is closer than your jugular vein, where can sadness hide?',
  },
  {
    id: 'q_angle_67_13_sad',
    contentId: 'quran_67_13',
    mood: 'Sad',
    angle:
      'Allah says: "Whether you conceal what is in your breasts or reveal it, Allah knows it." Ibn Kathir explains that "what is in the breasts" (dhaat al-sudur) refers to the deepest intentions, emotions, and unspoken pain within the heart. Al-Sa\'di adds that this knowledge is not for punishment but for care—Allah knows the grief you carry silently so that He can respond to it precisely. The Prophet ﷺ said: "Indeed in the body there is a piece of flesh; if it is sound, the whole body is sound, and if it is corrupt, the whole body is corrupt. Indeed, it is the heart." [Sahih Bukhari 52] Your heart is fully understood by its Creator. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Acknowledge that your heart is fully known and accepted by Allah',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'heart',
        title: 'Your heart is fully known',
        instruction:
          'You do not need to explain your sadness to Allah. He knows "dhaat al-sudur" — what is deep inside your chest. Not just what you say, but what you feel, what you fear, what you cannot articulate. His knowledge is not for punishment — it is for precise care.',
        source: "Tafsir al-Sa'di on 67:13",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'heart',
        title: 'Place hand on your heart',
        instruction:
          'Place your hand on your chest. The Prophet ﷺ said the heart is the most important piece of flesh in the body. Feel it beating. The One who created it knows exactly what it carries. Let that be a comfort, not a fear.',
        source: '"Indeed it is the heart." [Bukhari 52]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for heart healing',
        instruction: 'Ask Allah to heal what He already knows is broken.',
        arabicText: 'اللَّهُمَّ مُصَرِّفَ الْقُلُوبِ صَرِّفْ قُلُوبَنَا عَلَى طَاعَتِكَ',
        transliteration: "Allahumma musarrifal-qulub, sarrif qulubana 'ala ta'atik",
        translation: 'O Allah, Turner of hearts, turn our hearts to Your obedience',
        source: 'Sahih Muslim 2654',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'What relief do you find in being known perfectly without explanation?',
  },
  {
    id: 'q_angle_93_1_5_sad',
    contentId: 'quran_93_1_5',
    mood: 'Sad',
    angle:
      'Allah swears by the morning brightness (Ad-Duha) and the night when it covers, then declares: "Your Lord has not taken leave of you, nor has He detested you. And the Hereafter is better for you than the first." Ibn Kathir explains that Allah chose the dawn as His oath because it is the most visible proof that darkness is always followed by light. Al-Sa\'di adds that "your Lord has not detested you" directly addresses the fear of divine abandonment—a fear common in deep sadness. The Prophet ﷺ was comforted by this surah during his most painful period. Your night, too, has a dawn. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: "Reflect on the transition from night to day as a sign of Allah's mercy.",
    actionHowTo:
      'Observe the world around you and recognize that just as Allah brings the sun after the night, He brings ease after hardship.',
    actionReward:
      'Allah swears by the morning brightness and the night when it covers—reminding us that He has not forsaken us. [Surah Ad-Duha]',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'book-quran',
        title: 'Recite Surah Ad-Duha',
        instruction:
          'Recite or listen to Surah Ad-Duha in full. This surah was sent to comfort the Prophet ﷺ during his most painful period. Let it comfort you too.',
        arabicText: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ',
        transliteration: "Ma wadda'aka rabbuka wa ma qala",
        translation: 'Your Lord has not taken leave of you, nor has He detested you',
        source: 'Surah Ad-Duha 93:3 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'sunrise',
        title: 'Your night has a dawn',
        instruction:
          'Allah swore by the morning brightness because it is the most visible proof in creation: darkness is ALWAYS followed by light. Your sadness is the night — and your dawn is already scheduled. "The Hereafter is better for you than the first."',
        source: 'Tafsir Ibn Kathir on 93:1-5',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'person',
        title: 'Step into the light',
        instruction:
          "If possible, step outside or look at natural light. Let the sun remind you of Allah's oath. Just as He never fails to bring the morning, He never fails to bring relief. Your night, too, has a dawn.",
        source: "Tafsir al-Sa'di on 93:1-3",
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does the rhythm of nature reflect what Allah says in Surah Ad-Duha: "Your Lord has not forsaken you, nor is He displeased"?',
  },

  // === ANGRY ANGLES ===
  {
    id: 'q_angle_3_134_angry',
    contentId: 'quran_3_134',
    mood: 'Angry',
    angle:
      'Allah describes the people of Taqwa as "those who restrain anger and who pardon the people—and Allah loves the doers of good." Ibn Kathir explains that "kazm al-ghayz" (restraining anger) means swallowing it when you have the power to act on it. Al-Qurtubi adds that this verse places anger management alongside spending in charity and prayer as qualities of the God-conscious. The Prophet ﷺ said: "The strong man is not the one who can wrestle, but the strong man is the one who controls himself at the time of anger." [Sahih Bukhari 6114] Restraint is not weakness—it is the highest form of strength. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Before responding, count to 10 and make wudu if possible',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Make wudu now',
        instruction:
          'The Prophet ﷺ said anger is from Shaytan, and Shaytan was created from fire. Water extinguishes fire. Go make wudu right now — feel the cool water put out the heat of your anger.',
        source: '"If one of you becomes angry, let him perform wudu." [Abu Dawud 4784]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'muscle',
        title: 'True strength is restraint',
        instruction:
          'The strong person is not the one who overpowers others in wrestling. The strong person is the one who controls himself at the time of anger. Right now, by holding back, you are demonstrating the highest form of strength.',
        source:
          '"The strong man is the one who controls himself at the time of anger." [Bukhari 6114]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Seek refuge',
        instruction:
          'Say "A\'udhu billahi minash-shaytanir-rajim" — the Prophet ﷺ prescribed this exact remedy when a man was angry in front of him.',
        arabicText: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
        transliteration: "A'udhu billahi minash-shaytanir-rajim",
        translation: 'I seek refuge in Allah from the accursed Shaytan',
        source: 'Sahih Bukhari 3282',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'How does it feel to "restrain" anger rather than just letting it out?',
  },
  {
    id: 'q_angle_41_34_angry',
    contentId: 'quran_41_34',
    mood: 'Angry',
    angle:
      'Allah says: "Repel evil by that which is better; and thereupon the one between you and him was enmity will become as though he was a devoted friend." Ibn Kathir explains that responding to harm with good has a transformative power—it can turn an enemy into an ally. Al-Sa\'di adds that this is only granted to "those who are patient" and "those who have a great portion of good," meaning it requires immense inner strength. The Prophet ﷺ never took revenge for personal matters and always responded to harm with kindness. [Sahih Bukhari 6126] This verse promises a social miracle for those who choose goodness over retaliation. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Perform a small act of kindness for someone you are frustrated with',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'rewind',
        title: 'Enemy to friend',
        instruction:
          'Allah promises a social miracle: if you respond to harm with good, the person who was your enemy can become "as though he was a devoted friend." This is not naivety — it is a divine guarantee for those with the strength to try.',
        source: "Tafsir al-Sa'di on 41:34",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'gift',
        title: 'Send one kind act',
        instruction:
          'Think of the person you are angry with. Now do ONE kind thing for them — send a message, make dua for them, or simply decide not to speak ill of them. The Prophet ﷺ never took revenge for personal matters.',
        source: 'Sahih Bukhari 6126',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for them',
        instruction:
          'Make dua for the person who angered you. This is the hardest and most transformative act. Say: "Allahumma-hdih" (O Allah, guide them). When you pray for them, your anger begins to dissolve.',
        arabicText: 'اللَّهُمَّ اهْدِهِ',
        transliteration: 'Allahumma-hdih',
        translation: 'O Allah, guide them',
        source: "Based on the Prophet's ﷺ practice of praying for those who harmed him",
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'What would change if you saw your "enemy" as a potential friend?',
  },

  // === GUILTY ANGLES ===
  {
    id: 'q_angle_4_110_guilty',
    contentId: 'quran_4_110',
    mood: 'Guilty',
    angle:
      'Allah says: "Whoever does a wrong or wrongs himself but then seeks forgiveness of Allah will find Allah Forgiving and Merciful." Ibn Kathir explains that this verse covers both sins against others and sins against oneself, establishing that no category of wrongdoing is excluded from divine forgiveness. Al-Qurtubi adds that "will find Allah" (yajid-Allah) implies that forgiveness is not hidden or difficult to access—it is waiting for the seeker. The Prophet ﷺ said: "All the sons of Adam are sinners, and the best of sinners are those who repent." [At-Tirmidhi 2499] The door is never closed. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Make a sincere intention to leave the sin and ask Allah for help',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Sayyid al-Istighfar',
        instruction:
          'Recite the master supplication for forgiveness — the most comprehensive dua for repentance.',
        arabicText:
          'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ',
        transliteration: "Allahumma anta Rabbi la ilaha illa anta khalaqtani wa ana 'abduk",
        translation:
          'O Allah, You are my Lord, there is no god but You. You created me and I am Your servant',
        source:
          '"Whoever says this with conviction and dies that day enters Paradise." [Bukhari 6306]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'door',
        title: 'The door is always open',
        instruction:
          'Allah says you will "FIND" Him Forgiving — meaning His forgiveness is not hidden or difficult. It is right there, waiting for you. No category of sin is excluded. The best of sinners are those who repent. You are not defined by your mistake; you are defined by your return.',
        source: 'Tafsir al-Qurtubi on 4:110',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: "Wudu and 2 rak'ahs of tawbah",
        instruction:
          "Make wudu with the intention that your sins are washing away. Then pray 2 rak'ahs of tawbah and in your sujud, sincerely intend to leave the sin and ask Allah for help to stay away.",
        source:
          '"All sons of Adam are sinners, and the best sinners are those who repent." [Tirmidhi 2499]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: "When have you experienced Allah's forgiveness after a mistake?",
  },
  {
    id: 'q_angle_25_70_guilty',
    contentId: 'quran_25_70',
    mood: 'Guilty',
    angle:
      'Allah says: "Except for those who repent, believe, and do righteous work. For them Allah will replace their evil deeds with good deeds." Ibn Kathir explains that this "replacement" (tabdil) is one of the most extraordinary promises in the Quran—Allah does not merely erase sins but transforms them into good deeds on the Day of Judgment. Al-Sa\'di adds that this shows Allah\'s generosity surpasses human comprehension: the very mistakes that cause you shame can become the fuel for your salvation. The Prophet ﷺ said: "Islam destroys what came before it." [Sahih Muslim 121] Your past can become your greatest asset. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Do a good deed specifically to "replace" a recent mistake',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'star',
        title: 'Sins become good deeds',
        instruction:
          'Allah does not just erase your sins — He TRANSFORMS them into good deeds on the Day of Judgment. This is beyond human comprehension. The very mistakes that cause you shame can become the fuel for your salvation. Your past can become your greatest asset.',
        source: 'Tafsir Ibn Kathir on 25:70',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'leaf',
        title: 'Replace with a good deed',
        instruction:
          'Do one specific good deed right now to "replace" a recent mistake: give charity, help someone, or perform extra prayer. The Prophet ﷺ said: "Follow a bad deed with a good deed and it will wipe it out." This is the tabdil in action.',
        source: '"Follow a bad deed with a good deed and it will wipe it out." [Tirmidhi 1987]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Istighfar of transformation',
        instruction:
          'Say "Astaghfirullah wa atubu ilayh" 70 times. The Prophet ﷺ sought forgiveness more than 70 times a day. Each one is not just erasing — it is transforming your record.',
        arabicText: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
        transliteration: 'Astaghfirullaha wa atubu ilayh',
        translation: 'I seek forgiveness from Allah and turn to Him in repentance',
        source: '"I seek forgiveness from Allah more than 70 times a day." [Bukhari 6307]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
        countSource: 'Muslim 2702 / Bukhari 6307',
        count: 70,
      },
    ]),
    reflection: "How does Allah's ability to change bad to good give you hope?",
  },

  {
    id: 'q_angle_42_43_angry',
    contentId: 'quran_42_43',
    mood: 'Angry',
    angle:
      'Allah says: "And whoever is patient and forgives—indeed, that is of the matters requiring determination." Ibn Kathir explains that "azm al-umur" (matters of determination) means these are among the highest and noblest qualities a person can possess. Al-Qurtubi adds that combining patience with forgiveness is presented not as a passive act but as a heroic one—requiring more courage than retaliation. The Prophet ﷺ said: "Allah does not increase a servant who forgives except in honor." [Sahih Muslim 2588] Choosing patience and forgiveness is the path of the spiritually elite. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Choose to be the bigger person in your current conflict',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'shield',
        title: 'Forgiveness is heroic',
        instruction:
          'Combining patience with forgiveness is not passive — it is heroic. It requires more courage than retaliation. Allah calls it "azm al-umur" — matters of the highest determination. You are not being weak; you are being spiritually elite.',
        source: 'Tafsir al-Qurtubi on 42:43',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dhikr to cool anger',
        instruction:
          'Say "SubhanAllah" 33 times. The rhythmic repetition of dhikr physically calms the nervous system and spiritually replaces anger with remembrance of Allah.',
        arabicText: 'سُبْحَانَ اللَّهِ',
        transliteration: 'SubhanAllah',
        translation: 'Glory be to Allah',
        source: '"Allah does not increase a servant who forgives except in honor." [Muslim 2588]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
        countSource: 'Muslim 597',
        count: 33,
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Change your position',
        instruction:
          'The Prophet ﷺ said: "If one of you becomes angry while standing, let him sit down. If the anger does not leave, let him lie down." Physically change your position right now.',
        source: '"If angry while standing, sit. If still angry, lie down." [Abu Dawud 4782]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How does letting go of the need for "getting even" feel in your heart?',
  },
  {
    id: 'q_angle_3_159_angry',
    contentId: 'quran_3_159',
    mood: 'Angry',
    angle:
      'Allah says to the Prophet ﷺ: "By the mercy of Allah, you were lenient with them. And if you had been rude and harsh-hearted, they would have disbanded from around you. So pardon them and ask forgiveness for them and consult them." Ibn Kathir explains that even after being wounded at Uhud due to some companions\' mistakes, the Prophet ﷺ was commanded to be gentle, forgive, and continue consulting them. Al-Sa\'di notes that this verse establishes the Prophetic model for leadership and conflict resolution: mercy first, then forgiveness, then inclusion. Harshness drives people away; gentleness draws them close. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Perform a silent prayer for the person you are angry with',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'handshake',
        title: 'The Prophetic model',
        instruction:
          "The Prophet ﷺ was physically wounded at Uhud because of his companions' mistakes. Yet Allah told him: be gentle, pardon them, ask forgiveness for them, and CONTINUE consulting them. If the Prophet ﷺ could forgive those who caused him harm, we can learn to soften our hearts too.",
        source: 'Tafsir Ibn Kathir on 3:159',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Pray for them silently',
        instruction:
          'Make a silent dua for the person who angered you: "Allahumma-ghfir lahu wa-hdih" (O Allah, forgive them and guide them). This is what the Prophet ﷺ was commanded to do.',
        arabicText: 'اللَّهُمَّ اغْفِرْ لَهُ واهْدِهِ',
        transliteration: 'Allahumma-ghfir lahu wa-hdih',
        translation: 'O Allah, forgive them and guide them',
        source: 'Surah Al-Imran 3:159 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Cool down with water',
        instruction:
          'Splash cold water on your face or make wudu. The physical cooling mirrors the spiritual cooling you need. Then pause before responding — harshness drives people away; gentleness draws them close.',
        source:
          '"If you had been rude and harsh-hearted, they would have disbanded." [Quran 3:159]',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How can you move from confrontation to a state of mercy and consultation?',
  },
  {
    id: 'q_angle_24_22_angry',
    contentId: 'quran_24_22',
    mood: 'Angry',
    angle:
      'Allah says: "Let them pardon and overlook. Would you not like that Allah should forgive you? And Allah is Forgiving and Merciful." Ibn Kathir explains this was revealed about Abu Bakr (RA) when he swore to stop supporting Mistah, who had participated in slandering Aisha (RA). Despite the immense personal hurt, Allah linked pardoning others to receiving His own pardon. Al-Qurtubi notes that the rhetorical question "Would you not like that Allah should forgive you?" is one of the most powerful motivations for forgiveness in the Quran—connecting your mercy to others with Allah\'s mercy to you. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Recall a time you needed forgiveness and apply that feeling now',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'light-bulb',
        title: 'Would you not like forgiveness?',
        instruction:
          'Ask yourself the Quranic question: "Would you not like that Allah should forgive YOU?" Abu Bakr (RA) was deeply wronged, yet he chose forgiveness because he wanted Allah\'s forgiveness more than he wanted revenge. What do you want more?',
        source: 'Tafsir Ibn Kathir on 24:22',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Ask for mutual forgiveness',
        instruction:
          'Say: "Allahumma-ghfir li wa lahu" (O Allah, forgive me and forgive them). Link your forgiveness of others to your own need for Allah\'s pardon.',
        arabicText: 'اللَّهُمَّ اغْفِرْ لِي وَلَهُ',
        transliteration: 'Allahumma-ghfir li wa lahu',
        translation: 'O Allah, forgive me and forgive them',
        source: 'Surah An-Nur 24:22 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'pen',
        title: 'Write it out',
        instruction:
          'Write down what angered you, then write below it: "I choose Allah\'s forgiveness over my revenge." Then tear up or delete the first part. Physical release mirrors spiritual release.',
        source: "Based on Abu Bakr's (RA) response in 24:22",
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'If Allah forgives us despite our flaws, who are we to hold onto grudges?',
  },
  {
    id: 'q_angle_16_126_angry',
    contentId: 'quran_16_126',
    mood: 'Angry',
    angle:
      'Allah says: "And if you punish, punish with an equivalent punishment. But if you are patient—it is better for those who are patient." Ibn Kathir explains that while Islam permits proportional retaliation, Allah clearly states that patience is the superior choice. Al-Qurtubi adds that this verse was revealed after the martyrdom of Hamza (RA), when the Prophet ﷺ was deeply grieved and wanted to retaliate. Yet Allah guided him to patience, showing that restraint in the face of legitimate anger is a higher path. The Prophet ﷺ said: "Anger is from Shaytan, and Shaytan was created from fire. Fire is extinguished with water, so if one of you becomes angry, let him perform wudu." [Abu Dawud 4784] [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Perform Wudu (ablution) with cool water to extinguish the heat of your anger.',
    actionHowTo: 'Follow the Prophetic advice to use water when agitated, as anger is from fire.',
    actionReward:
      'The Prophet ﷺ said: "Anger is from Shaytan... so if one of you becomes angry, let him perform wudu." [Sunan Abi Dawud 4784]',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Extinguish with water',
        instruction:
          'Go make wudu with cool water right now. The Prophet ﷺ said anger is from Shaytan, Shaytan is from fire, and fire is extinguished with water. Feel the coolness on your skin putting out the flames of anger.',
        source: '"Anger is from Shaytan... let him perform wudu." [Abu Dawud 4784]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'target',
        title: 'Patience is the higher path',
        instruction:
          'Islam permits equal retaliation — but Allah says patience is BETTER. The Prophet ﷺ himself was guided away from revenge after the martyrdom of Hamza (RA). You have a right to respond — but choosing patience elevates you above the situation.',
        source: 'Tafsir al-Qurtubi on 16:126',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Seek refuge from Shaytan',
        instruction:
          'Say "A\'udhu billahi minash-shaytanir-rajim" three times. Then ask yourself: what would my future self think of my current reaction?',
        arabicText: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
        transliteration: "A'udhu billahi minash-shaytanir-rajim",
        translation: 'I seek refuge in Allah from the accursed Shaytan',
        source: 'Sahih Bukhari 3282',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'What would your future self think of your current reaction?',
  },
  {
    id: 'q_angle_5_13_angry',
    contentId: 'quran_5_13',
    mood: 'Angry',
    angle:
      'Allah says: "So pardon them and overlook. Indeed, Allah loves the doers of good (Muhsineen)." Ibn Kathir explains that pardoning and overlooking faults is classified as "ihsan" (excellence)—the highest level of worship. Al-Sa\'di adds that the Muhsineen are those who go beyond what is required: justice demands equal retaliation, but ihsan chooses to forgive when you have the right to punish. The Prophet ﷺ said: "Ihsan is to worship Allah as though you see Him, and if you cannot see Him, then He sees you." [Sahih Bukhari 50] Pardoning with this awareness elevates a simple act into the highest form of devotion. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Deliberately overlook a minor annoyance today',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'star',
        title: 'Forgiveness is ihsan',
        instruction:
          'Pardoning is not just kindness — it is classified as ihsan, the HIGHEST level of worship. Justice demands equal retaliation. Ihsan chooses to forgive when you have every right to punish. This is not weakness; it is the peak of devotion.',
        source: "Tafsir al-Sa'di on 5:13",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: "Pray 2 rak'ahs of ihsan",
        instruction:
          "Pray two rak'ahs with the awareness that Allah sees you. The Prophet ﷺ defined ihsan as worshipping Allah as though you see Him. Now apply that same awareness to your anger — He sees you choosing forgiveness.",
        source: '"Ihsan is to worship Allah as though you see Him." [Bukhari 50]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: "Seek Allah's love",
        instruction:
          'Say: "Allahumma inni as\'aluka hubbak" (O Allah, I ask You for Your love). Allah says He LOVES the Muhsineen — those who pardon. Choose forgiveness and earn divine love.',
        arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ حُبَّكَ',
        transliteration: "Allahumma inni as'aluka hubbak",
        translation: 'O Allah, I ask You for Your love',
        source: 'Tirmidhi 3235 — Hasan',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How does "pardoning and overlooking" bring you closer to Allah\'s love?',
  },
  {
    id: 'q_angle_64_14_angry',
    contentId: 'quran_64_14',
    mood: 'Angry',
    angle:
      'Allah says: "O you who have believed, indeed, among your spouses and your children are enemies to you, so beware of them. But if you pardon and overlook and forgive—then indeed, Allah is Forgiving and Merciful." Ibn Kathir explains that Allah uses three progressive words: pardon (\'afw—letting go of the offense), overlook (safh—turning away from it entirely), and forgive (ghafr—covering it as if it never happened). Al-Qurtubi notes that this triple response mirrors Allah\'s own treatment of His servants\' sins. The Prophet ﷺ said: "Whoever suppresses his anger while he is able to act upon it, Allah will call him before all of creation on the Day of Resurrection and let him choose from the Hur al-Ayn." [At-Tirmidhi 2021] [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Mentally release the person who wronged you from your debt',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'rewind',
        title: 'Three levels of forgiveness',
        instruction:
          "Allah teaches three progressive steps: (1) Pardon ('afw) — let go of the offense. (2) Overlook (safh) — turn away from it entirely. (3) Forgive (ghafr) — cover it as if it never happened. This mirrors how Allah treats YOUR sins. Start with step 1 today.",
        source: 'Tafsir al-Qurtubi on 64:14',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Suppress and be rewarded',
        instruction:
          'Physically clench your fist, then slowly release it. This represents suppressing your anger. The Prophet ﷺ said whoever suppresses anger while able to act on it will be called before all creation on the Day of Judgment and given their choice of reward.',
        source: 'At-Tirmidhi 2021 — Hasan',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Release from debt',
        instruction:
          'Say: "Ya Allah, I release [person] from my debt. Forgive me as I have forgiven them." Mentally freeing someone who wronged you frees YOUR heart first.',
        arabicText: 'اللَّهُمَّ إِنِّي عَفَوْتُ عَنْهُ فَاعْفُ عَنِّي',
        transliteration: "Allahumma inni 'afawtu 'anhu fa'fu 'anni",
        translation: 'O Allah, I have pardoned them, so pardon me',
        source: 'Based on Quran 64:14 principle',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: "How does matching Allah's qualities bring peace to your own life?",
  },
  {
    id: 'q_angle_4_149_angry',
    contentId: 'quran_4_149',
    mood: 'Angry',
    angle:
      'Allah says: "If you disclose a good deed or conceal it or pardon an offense—indeed, Allah is ever Pardoning and Competent." Ibn Kathir explains that Allah pairs concealing the faults of others with His own attribute of pardoning (Al-\'Afuw). Al-Sa\'di adds that the verse establishes a principle: the one who has power to expose but chooses to conceal is imitating a divine quality. The Prophet ﷺ said: "Whoever conceals the faults of a Muslim, Allah will conceal his faults in this world and the Hereafter." [Sahih Muslim 2699] Choosing mercy when wronged is a reflection of divine character. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Conceal the mistake of another rather than exposing it',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'breathing',
        title: "Conceal, don't expose",
        instruction:
          "You have the power to expose someone's fault. But choosing to conceal it imitates a divine quality — Al-'Afuw, The Pardoner. The Prophet ﷺ said whoever conceals the faults of a Muslim, Allah will conceal THEIR faults in this world and the Hereafter.",
        source: '"Whoever conceals faults, Allah will conceal his faults." [Muslim 2699]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Bite your tongue',
        instruction:
          "If you are about to expose someone's mistake out of anger, physically pause. Take 3 deep breaths. Then ask: would I want MY faults exposed? Choose the silence that earns Allah's concealment of your own flaws.",
        source: "Tafsir al-Sa'di on 4:149",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: "Call on Al-'Afuw",
        instruction:
          'Call on Allah by the same Name He uses in this verse. Say "Ya \'Afuw" (O Pardoner) and ask Him to pardon you as you pardon others.',
        arabicText: 'يَا عَفُوُّ اعْفُ عَنِّي',
        transliteration: "Ya 'Afuw, u'fu 'anni",
        translation: 'O Pardoner, pardon me',
        source: '"You love to pardon, so pardon me." [Tirmidhi 3513]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection:
      'What does it say about your strength when you choose to forgive despite having power?',
  },
  {
    id: 'q_angle_45_14_angry',
    contentId: 'quran_45_14',
    mood: 'Angry',
    angle:
      'Allah says: "Tell those who believe to forgive those who do not expect the Days of Allah, so that He may recompense a people for what they used to earn." Ibn Kathir explains that this verse commands believers to rise above provocation by focusing on the Hereafter—Allah will settle all accounts with perfect justice. Al-Qurtubi adds that "those who do not expect the Days of Allah" refers to people who act without fear of divine reckoning; the believer\'s response is to leave their case to the ultimate Judge. The Prophet ﷺ said: "Do not be angry, do not be angry, do not be angry." [Sahih Bukhari 6116] Rising above is not ignoring injustice—it is trusting the Judge. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Remind yourself that your account is with Allah, not with the people',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'target',
        title: 'Trust the Judge',
        instruction:
          'You do not need to settle every account yourself. Allah will recompense every person for what they earned with PERFECT justice. Rising above provocation is not ignoring injustice — it is trusting the ultimate Judge to handle it better than you ever could.',
        source: 'Tafsir al-Qurtubi on 45:14',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Repeat the Prophetic advice',
        instruction:
          'The Prophet ﷺ said it THREE times: "Do not be angry, do not be angry, do not be angry." Repeat this to yourself now. Then say "HasbiyAllahu wa ni\'mal-wakeel" (Allah is sufficient for me).',
        arabicText: 'حَسْبِيَ اللَّهُ وَنِعْمَ الْوَكِيلُ',
        transliteration: "HasbiyAllahu wa ni'mal-wakeel",
        translation: 'Allah is sufficient for me and He is the best Disposer of affairs',
        source: '"Do not be angry." [Bukhari 6116]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Change position and cool down',
        instruction:
          'If standing, sit. If sitting, lie down. Splash water on your face. The Prophet ﷺ gave physical prescriptions for anger because the body and soul are connected. Cool the body to cool the heart.',
        source: '"If angry while standing, sit down." [Abu Dawud 4782]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How does focusing on the Hereafter diminish the heat of temporary anger?',
  },

  // === GRATEFUL ANGLES ===
  {
    id: 'q_angle_14_7_grateful',
    contentId: 'quran_14_7',
    mood: 'Grateful',
    angle:
      'Allah declares: "If you are grateful, I will surely increase you; but if you deny, indeed, My punishment is severe." Ibn Kathir explains that this is a divine law: gratitude triggers increase (ziyadah) in every blessing—health, wealth, faith, and peace. Al-Sa\'di adds that the "increase" is not limited to the specific blessing you are grateful for; it overflows into all areas of life. The Prophet ﷺ said: "Look at those below you and do not look at those above you, for that is more likely to prevent you from belittling Allah\'s favor upon you." [Sahih Muslim 2963] Gratitude is not just appreciation—it is the engine of divine abundance. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Say "Alhamdulillah" for a blessing you often take for granted',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Alhamdulillah for the overlooked',
        instruction:
          'Name 3 blessings you usually take for granted — your eyesight, your breath, your safety — and say "Alhamdulillah" for each one specifically.',
        arabicText: 'الْحَمْدُ لِلَّهِ',
        transliteration: 'Alhamdulillah',
        translation: 'All praise is for Allah',
        source: '"Look at those below you... to prevent belittling Allah\'s favor." [Muslim 2963]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'chart',
        title: 'Gratitude triggers increase',
        instruction:
          'This is a divine law, not a suggestion: gratitude triggers increase (ziyadah). The increase is not limited to the blessing you are grateful for — it overflows into ALL areas of life. Gratitude is the engine of divine abundance.',
        source: "Tafsir al-Sa'di on 14:7",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Sujud of shukr',
        instruction:
          'Do a sujud of gratitude (sujud ash-shukr) right now. Place your forehead on the ground and say "SubhanAllah" 3 times, then thank Allah for one specific blessing. The Prophet ﷺ would fall into sujud whenever he received good news.',
        source:
          '"The Prophet ﷺ would do sujud ash-shukr when receiving good news." [Abu Dawud 2774]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How have you seen Allah increase His favors when you are grateful?',
  },
  {
    id: 'q_angle_29_20_grateful',
    contentId: 'quran_29_20',
    mood: 'Grateful',
    angle:
      'Allah does not simply ask you to believe in His power — He tells you to go and look for it. Ibn Kathir explains this ayah as a command to travel and observe creation as living proof that the One who originated it can just as easily bring it back — the same argument He makes in Surah Ar-Rum: "He it is who originates creation, then repeats it, and that is easier for Him" (30:27). "Travel through the land and observe how He began creation" is an invitation to notice the evidence you walk past every day: a barren patch of earth turning green after rain, a single seed becoming a full tree, life beginning again and again all around you. Each of these small beginnings is itself a sign, and gratitude grows naturally once you actually stop to see them instead of taking them for granted. [Tafsir Ibn Kathir, Surah Al-Ankabut]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Notice one ordinary sign of creation today and thank Allah for it specifically.',
    reflection: 'What is one everyday "beginning" in creation — a plant, a sunrise, a birth — that you have stopped truly noticing?',
  },

  {
    id: 'q_angle_16_18_grateful',
    contentId: 'quran_16_18',
    mood: 'Grateful',
    angle:
      'Allah says: "And if you should count the favors of Allah, you could not enumerate them." Ibn Kathir explains that this verse is both a statement of fact and a call to humility—the blessings of Allah are so numerous that no human mind can catalog them all. Al-Qurtubi notes that even a single breath, a heartbeat, or the ability to blink is a blessing most people never consider. The Prophet ﷺ said: "Whoever wakes up in the morning healthy in body, safe in his dwelling, and has his day\'s provision—it is as if the entire world has been gathered for him." [At-Tirmidhi 2346] If you cannot count them, how vast must His care for you be? [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Spend 2 minutes listing specific small favors you usually miss',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'pen',
        title: '2-minute gratitude list',
        instruction:
          "Set a timer for 2 minutes and write down every small favor you can think of: your heartbeat, your eyesight, the roof over your head, clean water. Try to list at least 10. You will not be able to count them all — that's the point.",
        source: 'Surah An-Nahl 16:18 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'globe',
        title: 'You already have the whole world',
        instruction:
          'The Prophet ﷺ said: "Whoever wakes up healthy, safe, and with food for the day — it is as if the entire world has been gathered for him." If you have these three things right now, you already have everything.',
        source: 'At-Tirmidhi 2346 — Hasan',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Morning dua of gratitude',
        instruction: 'Say this comprehensive morning dua that covers every blessing.',
        arabicText: 'اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ',
        transliteration: "Allahumma ma asbaha bi min ni'matin faminka wahdaka la sharika lak",
        translation:
          'O Allah, whatever blessing I have received is from You alone, with no partner',
        source: '"He has fulfilled the gratitude of that day." [Abu Dawud 5073]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'If you cannot count them all, how vast must His care for you be?',
  },
  {
    id: 'q_angle_31_12_grateful',
    contentId: 'quran_31_12',
    mood: 'Grateful',
    angle:
      'Allah says: "And We had certainly given Luqman wisdom, saying: Be grateful to Allah. And whoever is grateful is grateful for the benefit of himself." Ibn Kathir explains that the very first piece of wisdom Allah gave Luqman was gratitude—establishing it as the foundation of all wisdom. Al-Sa\'di adds that "grateful for himself" means gratitude does not benefit Allah (who is free of need) but transforms the one who practices it. The Prophet ﷺ said: "He who does not thank people does not thank Allah." [Abu Dawud 4811] Gratitude to creation is inseparable from gratitude to the Creator. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Thank someone for a small thing they did for you today',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'chat',
        title: 'Thank a person today',
        instruction:
          'Send a message to one person thanking them for something specific they did. The Prophet ﷺ said: "He who does not thank people does not thank Allah." Gratitude to creation is the first step to gratitude to the Creator.',
        source: '"He who does not thank people does not thank Allah." [Abu Dawud 4811]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'brain',
        title: 'The foundation of all wisdom',
        instruction:
          'The very FIRST piece of wisdom Allah gave Luqman was gratitude. Not knowledge, not strategy, not eloquence — gratitude. It is the foundation upon which all other wisdom is built. And it benefits YOU, not Allah, who is free of all need.',
        source: 'Tafsir Ibn Kathir on 31:12',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'JazakAllahu khayran',
        instruction:
          'Make it a habit to say "JazakAllahu khayran" (May Allah reward you with good) to everyone who helps you today — even for small things. This is the Prophetic way of expressing gratitude.',
        arabicText: 'جَزَاكَ اللَّهُ خَيْرًا',
        transliteration: 'JazakAllahu khayran',
        translation: 'May Allah reward you with good',
        source:
          '"Whoever has a favor done for them and says JazakAllahu khayran has done enough in thanking." [Tirmidhi 2035]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How does expressing gratitude transform your own heart from within?',
  },
  {
    id: 'q_angle_27_40_grateful',
    contentId: 'quran_27_40',
    mood: 'Grateful',
    angle:
      'When Sulayman (AS) saw the throne of the Queen of Sheba brought to him miraculously, he said: "This is from the favor of my Lord to test me whether I will be grateful or ungrateful." Ibn Kathir explains that Sulayman, despite having a kingdom unmatched in history, recognized every blessing as a test—not a reward. Al-Qurtubi adds that this awareness is the key to spiritual safety: the one who sees blessings as tests remains humble, while the one who sees them as entitlements becomes arrogant. The Prophet ﷺ said: "The first thing people will be asked about on the Day of Judgment regarding worldly pleasures is: Did We not give you a healthy body and cool water?" [At-Tirmidhi 3358] [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Identify a gift in your life and commit to using it for good',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'light-bulb',
        title: 'Blessings are tests',
        instruction:
          'Sulayman had a kingdom unmatched in history, yet he said: "This is to TEST me." The one who sees blessings as tests remains humble. The one who sees them as entitlements becomes arrogant. How are you using what Allah has given you?',
        source: 'Tafsir al-Qurtubi on 27:40',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'leaf',
        title: 'Use a blessing for good',
        instruction:
          'Identify one gift Allah has given you — your health, your wealth, your time, your skills — and commit to using it for good TODAY. Give charity, help someone, teach someone, or make someone smile. Pass the test.',
        source:
          '"The first question about worldly pleasures: Did We not give you a healthy body and cool water?" [Tirmidhi 3358]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua of Sulayman',
        instruction:
          'Make Sulayman\'s prayer your own: "My Lord, enable me to be grateful for Your favor."',
        arabicText: 'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ',
        transliteration: "Rabbi awzi'ni an ashkura ni'matak",
        translation: 'My Lord, enable me to be grateful for Your favor',
        source: 'Surah An-Naml 27:19 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'Am I showing gratitude through the way I use what I have been given?',
  },
  {
    id: 'q_angle_34_13_grateful',
    contentId: 'quran_34_13',
    mood: 'Grateful',
    angle:
      'Allah says: "Work, O family of David, in gratitude." Ibn Kathir explains that Allah commanded the family of Dawud to express their gratitude not merely with words but through righteous action. Al-Sa\'di adds that true shukr (gratitude) has three components: gratitude of the heart (recognition), gratitude of the tongue (praise), and gratitude of the limbs (action). The Prophet ﷺ would pray at night until his feet were swollen. When asked why, he said: "Should I not be a grateful servant?" [Sahih Bukhari 4837] Gratitude is incomplete until it moves from feeling to doing. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Turn your feeling of thanks into a physical act of service',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'muscle',
        title: 'Work in gratitude',
        instruction:
          'Do one physical act of service right now as an expression of gratitude: help someone, clean something, give sadaqah, or perform extra prayer. Allah commanded: "WORK in gratitude" — not just feel grateful.',
        source: 'Surah Saba 34:13 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'heart',
        title: 'Three levels of shukr',
        instruction:
          'True gratitude has three components: (1) Heart — recognize the blessing. (2) Tongue — praise Allah for it. (3) Limbs — use the blessing in obedience. If any component is missing, your gratitude is incomplete. The Prophet ﷺ prayed until his feet swelled — that is gratitude in action.',
        source: "Tafsir al-Sa'di on 34:13",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Praise with body and tongue',
        instruction:
          'Say "Alhamdulillah" 33 times while thinking of a specific blessing with each one. The Prophet ﷺ was asked why he prayed so much when his sins were forgiven. He said: "Should I not be a grateful servant?"',
        arabicText: 'الْحَمْدُ لِلَّهِ',
        transliteration: 'Alhamdulillah',
        translation: 'All praise is for Allah',
        source: '"Should I not be a grateful servant?" [Bukhari 4837]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
        countSource: 'Muslim 597',
        count: 33,
      },
    ]),
    reflection: 'What "work" can I do today that proves my heart is truly grateful?',
  },
  {
    id: 'q_angle_76_3_grateful',
    contentId: 'quran_76_3',
    mood: 'Grateful',
    angle:
      'Allah says: "Indeed, We guided him to the way, be he grateful or be he ungrateful." Ibn Kathir explains that Allah presents gratitude and ingratitude as a choice—every person is shown the path and must decide which response to take. Al-Qurtubi adds that the verse implies that being grateful is an active decision, not a passive feeling. The Prophet ﷺ said: "Indeed, Allah is pleased with a servant who eats food and praises Him for it, and drinks a drink and praises Him for it." [Sahih Muslim 2734] Choosing gratitude in ordinary moments is what distinguishes the mindful believer. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Consciously choose to acknowledge a specific favor from Allah in a neutral situation',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'rewind',
        title: 'Gratitude is a choice',
        instruction:
          'Allah presents it as a binary: grateful or ungrateful. There is no neutral. Every moment you are making this choice. Right now, consciously choose to be among the grateful. It is an active decision, not a passive feeling.',
        source: 'Tafsir al-Qurtubi on 76:3',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Praise after eating and drinking',
        instruction:
          'The next time you eat or drink anything, say "Alhamdulillah" out loud. Allah is PLEASED with the servant who does this. Choosing gratitude in ordinary moments is what distinguishes the mindful believer.',
        arabicText: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا',
        transliteration: "Alhamdulillahil-ladhi at'amana wa saqana",
        translation: 'All praise is for Allah who fed us and gave us drink',
        source:
          '"Allah is pleased with the servant who praises Him for food and drink." [Muslim 2734]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Sujud for a neutral moment',
        instruction:
          'Right now, in a completely ordinary moment, go into sujud and thank Allah for something specific. Gratitude is most powerful when it is not prompted by a big event — but by the quiet recognition that every moment is a gift.',
        source: 'Tafsir Ibn Kathir on 76:3',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does my life change when I commit to being "one of the grateful"?',
  },
  {
    id: 'q_angle_54_35_grateful',
    contentId: 'quran_54_35',
    mood: 'Grateful',
    angle:
      'Allah says: "As a favor from Us. Thus do We reward he who is grateful." Ibn Kathir explains that Allah explicitly links His favors to gratitude—those who recognize and appreciate His blessings are rewarded with more. Al-Sa\'di adds that the word "ni\'matan" (as a favor) shows that rescue from hardship is itself a gift, not something earned. The Prophet ﷺ said: "Whoever says when morning comes: O Allah, whatever blessing I have received or any of Your creation has received is from You alone, with no partner to You—then he has fulfilled the gratitude of that day." [Abu Dawud 5073] Recognition is the seed; divine increase is the harvest. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Recognize a recent positive outcome as a direct favor from Allah',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'leaf',
        title: 'Recognition is the seed',
        instruction:
          'Think of one recent positive outcome. Now trace it back: it was not luck, not just your effort — it was a direct favor from Allah. Recognition of the Source is the seed; divine increase is the harvest.',
        source: "Tafsir al-Sa'di on 54:35",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: "Fulfill today's gratitude",
        instruction: 'Say this dua and you have fulfilled your gratitude for the entire day.',
        arabicText:
          'اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ فَلَكَ الْحَمْدُ وَلَكَ الشَّكْرُ',
        transliteration:
          "Allahumma ma asbaha bi min ni'matin faminka wahdaka la sharika lak, falakal-hamdu wa lakash-shukr",
        translation:
          'O Allah, whatever blessing I have is from You alone with no partner. To You belongs all praise and thanks',
        source: '"He has fulfilled the gratitude of that day." [Abu Dawud 5073]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Sujud ash-shukr',
        instruction:
          'Perform a prostration of gratitude for the specific favor you just recognized. The Prophet ﷺ would fall into sujud whenever good news reached him. This single act connects recognition to physical worship.',
        source: 'Abu Dawud 2774',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How can I maintain a heart that constantly attracts divine reward?',
  },
  {
    id: 'q_angle_7_58_grateful',
    contentId: 'quran_7_58',
    mood: 'Grateful',
    angle:
      'Allah says: "The good land—its vegetation emerges by permission of its Lord; but that which is bad—nothing emerges except sparsely. Thus do We diversify the signs for a people who are grateful." Ibn Kathir explains that the "good land" is a metaphor for the grateful heart: just as fertile soil produces abundant fruit, a grateful heart produces abundant faith and blessings. Al-Sa\'di adds that the signs of Allah in nature are only fully appreciated by the grateful—those whose hearts are softened by appreciation can see divine messages in every leaf and raindrop. The Prophet ﷺ would look at rain and say: "O Allah, make it a beneficial rain." [Sahih Bukhari 1032] [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Look at nature and see it as a message of love from your Creator',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'leaf',
        title: 'See nature as a sign',
        instruction:
          'Step outside or look out a window. Notice one element of nature — a tree, the sky, a breeze. See it as a message of love from your Creator. The grateful heart sees divine messages in every leaf and raindrop.',
        source: 'Tafsir Ibn Kathir on 7:58',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'sun',
        title: 'Your heart is the soil',
        instruction:
          'Good land produces abundant fruit. Bad land produces almost nothing. Your heart is the soil — water it with gratitude and it will produce abundant faith, peace, and blessings. Neglect it with ingratitude and it becomes barren.',
        source: "Tafsir al-Sa'di on 7:58",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua when seeing nature',
        instruction:
          'When you see rain, say what the Prophet ﷺ said. When you see any sign of nature, say "SubhanAllah" and recognize the Creator behind the creation.',
        arabicText: 'اللَّهُمَّ صَيِّبًا نَافِعًا',
        transliteration: "Allahumma sayyiban nafi'an",
        translation: 'O Allah, make it a beneficial rain',
        source: 'Sahih Bukhari 1032',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'How does being grateful change the way I interpret the world around me?',
  },
  {
    id: 'q_angle_4_147_grateful',
    contentId: 'quran_4_147',
    mood: 'Grateful',
    angle:
      'Allah says: "What would Allah do with your punishment if you are grateful and believe? And ever is Allah Appreciative and Knowing." Ibn Kathir explains that this verse reveals that gratitude combined with faith removes the very purpose of divine punishment—if you are thankful and believing, there is no need for correction. Al-Qurtubi adds that Allah describes Himself as "Appreciative" (Shakir), meaning He acknowledges and rewards even the smallest act of gratitude from His servants. The Prophet ﷺ said: "Allah is more pleased with the repentance of His servant than one of you who finds his lost animal." [Sahih Bukhari 6309] Gratitude and belief together form the ultimate spiritual shield. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Say "Alhamdulillah" for your faith and your safety',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'shield',
        title: 'The ultimate shield',
        instruction:
          'Gratitude + faith removes the very PURPOSE of divine punishment. If you are thankful and believing, there is no need for correction. These two qualities together form the ultimate spiritual shield. You already have both — strengthen them.',
        source: 'Tafsir al-Qurtubi on 4:147',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Thank Allah for your faith',
        instruction:
          'Say "Alhamdulillah alal-iman wal-Islam" (All praise is for Allah for faith and Islam). Your faith itself is one of the greatest blessings — not everyone was guided.',
        arabicText: 'الْحَمْدُ لِلَّهِ عَلَى الإِيمَانِ وَالإِسْلَامِ',
        transliteration: 'Alhamdulillah alal-iman wal-Islam',
        translation: 'All praise is for Allah for faith and Islam',
        source: 'Tafsir Ibn Kathir on 4:147',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Pray with gratitude',
        instruction:
          'Pray your next salah with the conscious intention of gratitude. Allah is Ash-Shakir — The Appreciative. He acknowledges and rewards even the SMALLEST act of gratitude. Your prayer right now is being appreciated by the Lord of the worlds.',
        source: '"Allah is Appreciative and Knowing." [Quran 4:147]',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'If gratitude and belief are enough, why would I ever focus on anything else?',
  },
  {
    id: 'q_angle_2_172_grateful',
    contentId: 'quran_2_172',
    mood: 'Grateful',
    angle:
      'Allah says: "O you who have believed, eat from the good things which We have provided for you and be grateful to Allah if it is Him that you worship." Ibn Kathir explains that Allah pairs the enjoyment of provision with gratitude—Islam does not ask you to deny yourself good things but to acknowledge their Source. Al-Sa\'di adds that the condition "if it is Him that you worship" means that true worship includes recognizing Allah in every meal, every drink, and every comfort. The Prophet ﷺ said: "When one of you eats, let him mention the name of Allah. If he forgets at the beginning, let him say: Bismillahi awwalahu wa akhirahu." [Abu Dawud 3767] Every bite is an opportunity for worship. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Savor your next meal and focus on the One who provided it',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'honey',
        title: 'Mindful eating',
        instruction:
          'At your next meal, slow down. Say "Bismillah" before the first bite. Taste each flavor. Recognize that every ingredient was provided by Allah. Then say "Alhamdulillah" when done. Every bite is an act of worship.',
        source: '"When one of you eats, let him mention the name of Allah." [Abu Dawud 3767]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'hands-prayer',
        title: 'Enjoyment IS worship',
        instruction:
          'Islam does not ask you to deny yourself good things. It asks you to acknowledge their Source. When you eat good food and thank Allah for it, the enjoyment itself becomes worship. This is a religion that turns pleasure into prayer.',
        source: "Tafsir al-Sa'di on 2:172",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Before and after eating',
        instruction: 'Say "Bismillah" before eating and this dua after.',
        arabicText:
          'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
        transliteration:
          "Alhamdulillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah",
        translation:
          'Praise be to Allah who fed me this and provided it without any effort or power from me',
        source: '"Whoever says this after eating, his past sins are forgiven." [Tirmidhi 3458]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How can I turn every basic necessity into a moment of worship?',
  },
  {
    id: 'q_angle_35_12_grateful',
    contentId: 'quran_35_12',
    mood: 'Grateful',
    angle:
      'Allah says: "He merges the night into the day and merges the day into the night, and He subjected the sun and the moon—that you may seek the bounty of Allah, and perhaps you will be grateful." Ibn Kathir explains that the entire divine order—day, night, sun, moon—is arranged so that humans can work, earn, and then express gratitude. Al-Sa\'di adds that "la\'allakum tashkurun" (perhaps you will be grateful) shows that gratitude is the ultimate goal of all provision. The Prophet ﷺ said: "Whoever among you wakes up secure in his property, healthy in his body, and has food for the day, it is as though he were given the entire world." [At-Tirmidhi 2346] Seeking provision with gratitude transforms work into worship. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Set a goal for your work that includes sharing the benefits with others',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'globe',
        title: 'The creation serves you',
        instruction:
          'The entire divine order — day, night, sun, moon — is arranged so that you can work, earn, and express gratitude. Gratitude is the ULTIMATE GOAL of all provision. When you work with this awareness, your ambition becomes worship.',
        source: 'Tafsir Ibn Kathir on 35:12',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'handshake',
        title: 'Share a blessing',
        instruction:
          'Set one goal today that includes sharing the benefits with others: buy someone coffee, share a meal, or donate to charity. When your provision benefits others, it multiplies in both worlds.',
        source:
          '"Whoever wakes up secure, healthy, and fed — it is as though the entire world was gathered for him." [Tirmidhi 2346]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Evening gratitude',
        instruction:
          'At the end of your day, say "Alhamdulillah" and reflect: what bounty did I seek today, and did I thank the One who made it possible?',
        arabicText: 'الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ',
        transliteration: "Alhamdulillahil-ladhi bini'matihi tatimmus-salihat",
        translation: 'Praise be to Allah, by whose grace good things are completed',
        source: 'Sahih Ibn Majah 3803',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How does my ambition change when its goal is to produce more gratitude?',
  },
  {
    id: 'q_angle_39_7_grateful',
    contentId: 'quran_39_7',
    mood: 'Grateful',
    angle:
      'Allah says: "If you disbelieve—indeed, Allah is Free from need of you. And He does not approve for His servants disbelief. And if you are grateful, He approves it for you." Ibn Kathir explains that while Allah needs nothing from His creation, He is pleased (yardahu) by gratitude—making it one of the few human actions that earns divine approval explicitly. Al-Sa\'di adds that Allah\'s approval (rida) is the highest reward a servant can receive, surpassing even Paradise itself in spiritual significance. The Prophet ﷺ said: "Allah is pleased with a servant who praises Him when eating and praises Him when drinking." [Sahih Muslim 2734] Earning the rida of Allah is the ultimate achievement. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Do one small thing today that you know pleases your Lord',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'heart',
        title: 'Earn divine approval',
        instruction:
          "Allah's approval (rida) is the highest reward a servant can receive — greater even than Paradise in spiritual significance. And you can earn it right now through the simplest act: being grateful. He is pleased when you praise Him for your food and drink.",
        source: "Tafsir al-Sa'di on 39:7",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'star',
        title: 'Do one pleasing act',
        instruction:
          'Do one small thing right now that you KNOW pleases Allah: smile, say Alhamdulillah, give charity, help someone. You do not need grand gestures. Allah is pleased by the smallest acts of gratitude.',
        source:
          '"Allah is pleased with a servant who praises Him when eating and drinking." [Muslim 2734]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Seek His pleasure',
        instruction:
          'Say: "Allahumma inni as\'aluka ridak wal-jannah" (O Allah, I ask You for Your pleasure and Paradise).',
        arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ رِضَاكَ وَالْجَنَّةَ',
        transliteration: "Allahumma inni as'aluka ridaka wal-jannah",
        translation: 'O Allah, I ask You for Your pleasure and Paradise',
        source: 'Abu Dawud 1319 — Sahih',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'What greater reward is there than the approval of the Most Merciful?',
  },
  {
    id: 'q_angle_15_53_grateful',
    contentId: 'quran_16_53',
    mood: 'Grateful',
    angle:
      'Allah says: "And whatever you have of favor—it is from Allah." Ibn Kathir explains that this verse establishes a foundational principle: every single blessing, without exception, originates from Allah alone. Al-Qurtubi adds that even the things we attribute to our own effort—our skills, intelligence, health—are ultimately gifts from Allah who gave us the capacity to earn them. The Prophet ﷺ said: "None of you will be saved by his deeds alone." They asked: "Not even you, O Messenger of Allah?" He said: "Not even me, unless Allah covers me with His mercy." [Sahih Bukhari 6463] Tracing blessings to their Source cultivates humility and deepens connection. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Pick one thing you love and say "This is a gift from Allah"',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'gift',
        title: 'Everything is from Him',
        instruction:
          'Your skills, your intelligence, your health — even the things you attribute to your own effort are gifts from Allah who gave you the capacity to earn them. Pick one thing you love and say out loud: "This is a gift from Allah."',
        source: 'Tafsir al-Qurtubi on 16:53',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Humble acknowledgment',
        instruction:
          'The Prophet ﷺ said: "None of you will be saved by his deeds alone — not even me, unless Allah covers me with His mercy." If the greatest human who ever lived needed mercy over effort, then every success you have is a gift. Let that humble you.',
        source: 'Sahih Bukhari 6463',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Trace every blessing',
        instruction:
          'Pick 5 things in your life and for each one, say: "Hadha min fadli Rabbi" (This is from the grace of my Lord).',
        arabicText: 'هَٰذَا مِنْ فَضْلِ رَبِّي',
        transliteration: 'Hadha min fadli Rabbi',
        translation: 'This is from the grace of my Lord',
        source: 'Surah An-Naml 27:40 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does tracing blessings back to Allah change your relationship with them?',
  },

  {
    id: 'q_angle_20_25_stressed_angle',
    contentId: 'quran_20_25',
    mood: 'Overwhelmed',
    angle:
      'Musa (AS) made this dua before his most daunting task—confronting Pharaoh. Ibn Kathir explains that "sharh al-sadr" (expansion of the chest) means removing anxiety, fear, and constriction from the heart, replacing them with confidence, clarity, and divine light. Al-Sa\'di adds that the Prophet ﷺ was also granted this expansion: "Have We not expanded for you your breast?" [94:1]—showing that Allah answers this dua for those who carry heavy burdens. The Prophet ﷺ said: "Whoever Allah wishes good for, He gives him understanding of the religion." [Sahih Bukhari 71] Understanding brings expansion. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Ask Allah for "Inshirah" (expansion) of your chest right now',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua of Musa (AS)',
        instruction:
          "Recite Musa's dua before his most daunting task. Ask Allah for the same expansion.",
        arabicText: 'رَبِّ اشْرَحْ لِي صَدْرِي',
        transliteration: 'Rabbish-rahli sadri',
        translation: 'My Lord, expand for me my chest',
        source: 'Surah Ta-Ha 20:25 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'light-bulb',
        title: 'Expansion over reduction',
        instruction:
          'You do not need to reduce your problems. You need Allah to EXPAND your capacity. "Sharh al-sadr" means replacing constriction with confidence, fear with clarity, and anxiety with divine light. Ask for bigger capacity, not smaller problems.',
        source: 'Tafsir Ibn Kathir on 20:25',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Breathe and expand',
        instruction:
          'Take 5 deep breaths, expanding your chest fully with each inhale. As you breathe in, reflect on Allah expanding your heart. As you breathe out, release the constriction. This is "inshirah" in physical form.',
        source: '"Have We not expanded for you your breast?" [Quran 94:1]',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What would happen if your internal capacity was larger than your external stress?',
  },
  {
    id: 'q_angle_40_44_stressed_angle',
    contentId: 'quran_40_44',
    mood: 'Overwhelmed',
    angle:
      'The believer mentioned in Surah Ghafir said: "I entrust my affair to Allah. Indeed, Allah is Seeing of His servants." Ibn Kathir explains that this man was a secret believer among Pharaoh\'s people who, after speaking truth to power, placed his entire outcome in Allah\'s hands. Al-Sa\'di adds that "tafwid" (entrusting one\'s affair to Allah) is the ultimate act of tawakkul—releasing the weight of "how will this work out?" by trusting the One who sees all outcomes before they unfold. The result? "So Allah protected him from the evils they plotted." [40:45] Entrusting brings divine protection. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Explicitly tell Allah: "I leave the results of this work to You"',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Entrust your affair',
        instruction:
          'Say what the believer said: "Ufawwidu amri ilallah" — and mean it. Release the outcome.',
        arabicText: 'أُفَوِّضُ أَمْرِي إِلَى اللَّهِ إِنَّ اللَّهَ بَصِيرٌ بِالْعِبَادِ',
        transliteration: "Ufawwidu amri ilallah, innAllaha basirun bil-'ibad",
        translation: 'I entrust my affair to Allah. Indeed, Allah is Seeing of His servants',
        source: 'Surah Ghafir 40:44 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'lock',
        title: "Stop doing Allah's job",
        instruction:
          "How much of your stress comes from trying to control the outcome? That is Allah's job. Your job is effort; His job is results. The believer entrusted his affair — and Allah PROTECTED him from every evil they plotted. Tafwid brings divine protection.",
        source: "Tafsir al-Sa'di on 40:44-45",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Open hands, release control',
        instruction:
          'Physically open your palms upward and say: "Ya Allah, I leave the results to You." Then close your eyes for 30 seconds and let go of the need to know how this will work out. He sees all outcomes before they unfold.',
        source: '"So Allah protected him from the evils they plotted." [Quran 40:45]',
        sourceType: 'quran_dua',
      },
    ]),
    reflection:
      "How much of my stress comes from trying to do Allah's job (controlling the outcome)?",
  },
  {
    id: 'q_angle_2_153_stressed',
    contentId: 'quran_2_153',
    mood: 'Overwhelmed',
    angle:
      'Allah says: "Seek help through patience and prayer. And indeed, it is difficult except for the humbly submissive." Ibn Kathir explains that Allah prescribes two specific tools for difficulty: sabr (patience) and salah (prayer)—and places them together because each strengthens the other. Al-Qurtubi adds that the companions would rush to prayer whenever they felt anxious or troubled, following the Prophetic example. The Prophet ﷺ said: "Whenever a matter distressed the Prophet, he would rush to prayer." [Abu Dawud 1319] Prayer is not just worship—it is a stabilizer for the overwhelmed soul. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Slow down your next prayer by 2 minutes to anchor your mind',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Rush to prayer',
        instruction:
          "The Prophet ﷺ would rush to prayer whenever something distressed him. Go pray 2 rak'ahs right now. Slow down each movement by 2 extra seconds. Let the prayer stabilize your overwhelmed soul.",
        source: '"Whenever a matter distressed him, he would rush to prayer." [Abu Dawud 1319]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'target',
        title: 'Patience + Prayer',
        instruction:
          'Allah prescribes two tools together: patience AND prayer. Patience without prayer leads to burnout. Prayer without patience leads to frustration. Together they create a balance that anchors the soul through any storm.',
        source: 'Tafsir al-Qurtubi on 2:153',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dhikr between tasks',
        instruction:
          'Say "SubhanAllah wal-hamdulillah wa la ilaha illallah wallahu akbar" between each task today. This creates sacred pauses that prevent overwhelm from building.',
        arabicText:
          'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ',
        transliteration: 'SubhanAllahi wal-hamdulillahi wa la ilaha illallahu wallahu akbar',
        translation:
          'Glory be to Allah, praise be to Allah, there is no god but Allah, and Allah is the Greatest',
        source: '"The best of your deeds... is the remembrance of Allah." [Tirmidhi 3377]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection:
      'How does seeking help through prayer specifically counteract the feeling of being rushed?',
  },
  {
    id: 'q_angle_67_13_stressed',
    contentId: 'quran_67_13',
    mood: 'Overwhelmed',
    angle:
      'Allah says: "He knows what is within the breasts." Ibn Kathir explains that "dhaat al-sudur" encompasses every hidden thought, unspoken anxiety, and silent struggle within the human heart. Al-Sa\'di adds that this knowledge is a source of comfort, not fear—because it means you never need to explain your pain to Allah; He already knows it more deeply than you do yourself. The Prophet ﷺ said: "Allah does not look at your bodies or your appearances, but He looks at your hearts." [Sahih Muslim 2564] When the stress of being misunderstood weighs on you, remember: the One who matters most understands you perfectly. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: "Stop trying to explain yourself to others and find peace in Allah's knowledge",
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'heart',
        title: 'Perfectly understood',
        instruction:
          'You do not need to explain your stress, your struggles, or your silent battles to anyone. Allah already knows "dhaat al-sudur" — what is deep within your chest. He understands you more deeply than you understand yourself. Let that be enough.',
        source: "Tafsir al-Sa'di on 67:13",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Release the need to explain',
        instruction:
          'Take a deep breath. Let go of the stress of being misunderstood by people. Place your hand on your chest and say: "Allah knows what is here. That is enough for me."',
        source: '"Allah looks at your hearts." [Muslim 2564]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for inner peace',
        instruction: 'Ask Allah to ease the burden He already sees.',
        arabicText: 'اللَّهُمَّ أَصْلِحْ لِي شَأْنِي كُلَّهُ',
        transliteration: "Allahumma aslih li sha'ni kullah",
        translation: 'O Allah, set right all my affairs',
        source: 'Abu Dawud 5090 — Sahih',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection:
      'How does knowing Allah knows what is "within the breasts" ease your social stress?',
  },
  {
    id: 'q_angle_94_1_8_stressed',
    contentId: 'quran_94_1_8',
    mood: 'Overwhelmed',
    angle:
      'Allah says: "Indeed, with hardship comes ease. So when you have finished, then stand up for worship. And to your Lord direct your longing." Ibn Kathir explains that the repetition of "with hardship comes ease" is a divine guarantee—one hardship can never overcome two eases. Al-Sa\'di adds that the command to "stand up" (fansab) after completing tasks means redirecting your focus toward Allah rather than toward more worldly concerns. The Prophet ﷺ said: "The coolness of my eyes has been placed in prayer." [An-Nasa\'i 3940] When stress peaks, devotion is the prescribed relief. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Break your stress by standing up for a moment of quiet devotion',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'target',
        title: 'One hardship, two eases',
        instruction:
          'Allah repeats "with hardship comes ease" TWICE. The scholars say: one hardship can never overcome two eases. You are outnumbered by ease. The math is in your favor.',
        source: 'Tafsir Ibn Kathir on 94:5-6',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Stand up for devotion',
        instruction:
          'When you finish your current task, instead of moving to the next one, STAND UP and pray 2 rak\'ahs. Allah commands: "When you have finished, then stand up for worship." Redirect your focus to Him before anything else.',
        source: "Tafsir al-Sa'di on 94:7",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Direct your longing',
        instruction:
          'Say: "Ya Allah, I direct my longing to You." The Prophet ﷺ said the coolness of his eyes was in prayer. Let salah be your stress relief, not a burden on top of stress.',
        arabicText: 'وَإِلَىٰ رَبِّكَ فَارْغَب',
        transliteration: 'Wa ila Rabbika farghab',
        translation: 'And to your Lord direct your longing',
        source: '"The coolness of my eyes has been placed in prayer." [Nasa\'i 3940]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'How does "directing your longing to your Lord" provide an exit from stress?',
  },
  {
    id: 'q_angle_20_25_28_stressed',
    contentId: 'quran_20_25_28',
    mood: 'Overwhelmed',
    angle:
      'Musa (AS) made a comprehensive dua: "My Lord, expand for me my breast, ease for me my task, and untie the knot from my tongue that they may understand my speech." Ibn Kathir explains that this dua addresses three dimensions of difficulty: internal constriction (chest), external burden (task), and communication barriers (tongue). Al-Qurtubi adds that Musa asked for these before his mission to Pharaoh—showing that even prophets sought divine help before facing overwhelming situations. The Prophet ﷺ used to recite specific duas before important matters. This dua is a complete toolkit for anyone facing a daunting task. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Recite the full prayer of Musa (AS) including the request for clarity',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The complete dua of Musa',
        instruction:
          'Recite the full dua — it addresses three dimensions: chest (internal), task (external), and tongue (communication).',
        arabicText:
          'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِن لِسَانِي يَفْقَهُوا قَوْلِي',
        transliteration:
          "Rabbish-rahli sadri, wa yassirli amri, wahlul 'uqdatan min lisani yafqahu qawli",
        translation:
          'My Lord, expand my chest, ease my task, and untie the knot from my tongue so they may understand my speech',
        source: 'Surah Ta-Ha 20:25-28 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'target',
        title: 'Three-dimensional relief',
        instruction:
          'This dua is a complete toolkit: (1) Expand my chest — fix what is inside me. (2) Ease my task — fix what is outside me. (3) Untie my tongue — fix how I communicate. Even prophets asked for help before daunting tasks. You should too.',
        source: 'Tafsir Ibn Kathir on 20:25-28',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Pray before the task',
        instruction:
          "Before your next daunting task, pray 2 rak'ahs and recite this dua in your sujud. Musa made this dua before confronting Pharaoh. Whatever you are facing, prepare with the same spiritual armor.",
        source: 'Tafsir al-Qurtubi on 20:25-28',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What specifically am I asking Allah to "ease" or "untie" for me today?',
  },

  // === CONTENT ANGLES ===
  {
    id: 'q_angle_10_58_content',
    contentId: 'quran_10_58',
    mood: 'Grateful',
    angle:
      'Allah says: "Say, In the bounty of Allah and in His mercy—in that let them rejoice; it is better than what they accumulate." Ibn Kathir explains that "the bounty of Allah" refers to the Quran and "His mercy" refers to Islam—meaning the greatest reasons to rejoice are spiritual, not material. Al-Sa\'di adds that the verse directly contrasts divine gifts with worldly accumulation, establishing that faith and guidance are more valuable than all the wealth on earth. The Prophet ﷺ said: "Whoever is given his portion of gentleness has been given his portion of good." [Sahih Muslim 2593] True contentment begins with appreciating the gift of belief itself. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'List one thing you love about being a believer',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'star',
        title: 'Rejoice in what matters',
        instruction:
          'The bounty of Allah is the Quran. His mercy is Islam. These are greater than everything the world accumulates. If you have faith and guidance, you already possess the greatest reasons to rejoice.',
        source: "Tafsir al-Sa'di on 10:58",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'book-quran',
        title: 'Open the Quran',
        instruction:
          'Open the Quran and read just one verse. This is "the bounty of Allah" that is better than everything people accumulate. Hold the Book and feel the weight of the greatest gift you own.',
        source: 'Tafsir Ibn Kathir on 10:58',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Rejoice with praise',
        instruction:
          'Say "Alhamdulillah alal-Islam" and list one thing you love about being a believer. Contentment begins with appreciating the gift of belief itself.',
        arabicText: 'الْحَمْدُ لِلَّهِ عَلَى الإِسْلَامِ',
        transliteration: 'Alhamdulillah alal-Islam',
        translation: 'All praise is for Allah for Islam',
        source: '"Richness is the richness of the soul." [Bukhari 6446]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: "If I had nothing but Allah's mercy, would I still have enough to rejoice?",
  },
  {
    id: 'q_angle_14_7_content',
    contentId: 'quran_14_7',
    mood: 'Grateful',
    angle:
      'Allah declares: "If you are grateful, I will surely increase you." Ibn Kathir explains that this divine law applies to all blessings—when you express gratitude for what you have, Allah multiplies it. Al-Sa\'di adds that the "increase" is not limited to material wealth; it includes peace of heart, clarity of mind, and satisfaction with one\'s portion. The Prophet ﷺ said: "Richness is not having many possessions. Rather, richness is the richness of the soul." [Sahih Bukhari 6446] Contentment is not about having more—it is about recognizing what you already have as a gift from the Most Generous. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Look around and say "Alhamdulillah" for the roof over your head',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'gem',
        title: 'Richness of the soul',
        instruction:
          'Richness is not having many possessions. It is the richness of the soul. Contentment is not about having more — it is about recognizing what you already have as a gift from the Most Generous.',
        source: '"Richness is the richness of the soul." [Bukhari 6446]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'compass',
        title: 'Look around you',
        instruction:
          'Look around your room right now. The roof, the light, the air you breathe. Say "Alhamdulillah" for each thing your eyes land on. When you express gratitude for what you have, Allah multiplies it.',
        source: "Tafsir al-Sa'di on 14:7",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Gratitude that triggers increase',
        instruction:
          'Say "Alhamdulillah" 33 times, each time thinking of something specific. This activates the divine law: gratitude triggers increase in peace of heart, clarity of mind, and satisfaction.',
        arabicText: 'الْحَمْدُ لِلَّهِ',
        transliteration: 'Alhamdulillah',
        translation: 'All praise is for Allah',
        source: 'Surah Ibrahim 14:7 — Quran',
        sourceType: 'quran_dua',
        countSource: 'Muslim 597',
        count: 33,
      },
    ]),
    reflection: "How is my current contentment tied to my awareness of Allah's increase?",
  },
  {
    id: 'q_angle_16_18_content',
    contentId: 'quran_16_18',
    mood: 'Grateful',
    angle:
      'Allah says: "And if you should count the favors of Allah, you could not enumerate them. Indeed, Allah is Forgiving and Merciful." Ibn Kathir explains that Allah ends this verse with "Forgiving and Merciful" because even our failure to properly thank Him for all His blessings is itself forgiven. Al-Qurtubi adds that attempting to count blessings—even though it is impossible—is itself an act of worship that increases contentment and awareness. The Prophet ﷺ said: "He who does not thank Allah for small things will not thank Him for great things." [Musnad Ahmad] The exercise of counting cultivates a heart that overflows with satisfaction. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Try to count the favors of Allah in just the last hour',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'clock',
        title: 'One-hour blessing count',
        instruction:
          'Try to count every favor from Allah in just the LAST HOUR: every breath, every heartbeat, every thought, every comfort. You cannot finish — and that impossibility itself proves how overwhelmingly blessed you are.',
        source: 'Surah An-Nahl 16:18 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'hands-prayer',
        title: 'Even your failure is forgiven',
        instruction:
          'Allah ends this verse with "Forgiving and Merciful" because even your failure to properly thank Him is forgiven. He does not demand perfect gratitude — He accepts the attempt. The exercise of counting itself cultivates contentment.',
        source: 'Tafsir al-Qurtubi on 16:18',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Thank for the small things',
        instruction:
          'Say "Alhamdulillah" for 5 tiny things you normally ignore: the ability to see, to hear, to breathe, to think, to feel. "He who does not thank for small things will not thank for great things."',
        arabicText: 'الْحَمْدُ لِلَّهِ عَلَى كُلِّ حَالٍ',
        transliteration: "Alhamdulillah 'ala kulli hal",
        translation: 'All praise is for Allah in every situation',
        source: 'Musnad Ahmad — Sahih',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'If I cannot count them, how can I ever feel like I have "not enough"?',
  },
  {
    id: 'q_angle_93_11_content',
    contentId: 'quran_93_11',
    mood: 'Grateful',
    angle:
      'Allah says: "And as for the favor of your Lord, report it." Ibn Kathir explains that "haddith" (report/proclaim) means to speak openly about Allah\'s blessings—not as boasting but as a form of gratitude and testimony. Al-Sa\'di adds that sharing blessings with others multiplies the joy and encourages them to recognize Allah\'s generosity in their own lives. The Prophet ﷺ said: "To speak of the blessings of Allah is gratitude, and to leave it is ingratitude." [Musnad Ahmad 18449] When contentment fills your heart, sharing it does not diminish it—it amplifies it. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Share one good thing that happened to you with a friend or family member',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'chat',
        title: 'Share a blessing',
        instruction:
          'Send a message to someone right now sharing one good thing Allah has given you. Speaking of blessings is gratitude; silence about them is ingratitude. Sharing joy amplifies it.',
        source: '"To speak of the blessings of Allah is gratitude." [Ahmad 18449]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'headphones',
        title: 'Sharing amplifies',
        instruction:
          'When contentment fills your heart, sharing it does not diminish it — it amplifies it. Allah commanded "haddith" (proclaim) — not as boasting but as testimony. Let your blessings inspire others to see their own.',
        source: "Tafsir al-Sa'di on 93:11",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Proclaim His favor',
        instruction:
          'Say "Alhamdulillah" out loud and then name one specific favor. The Prophet ﷺ said speaking of blessings IS the act of gratitude itself.',
        arabicText: 'وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ',
        transliteration: "Wa amma bini'mati Rabbika fahaddith",
        translation: 'And as for the favor of your Lord, report it',
        source: 'Surah Ad-Duha 93:11 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: "How does speaking about Allah's favors increase the feeling of contentment?",
  },
  {
    id: 'q_angle_55_13_content',
    contentId: 'quran_55_13',
    mood: 'Grateful',
    angle:
      'Allah asks repeatedly in Surah Ar-Rahman: "So which of the favors of your Lord would you deny?" Ibn Kathir explains that this question is repeated 31 times to make the listener pause and reflect on each category of blessings—from creation to sustenance to the beauty of nature. Al-Qurtubi notes that when the Prophet ﷺ recited this surah to the Jinn, they replied: "None of Your favors, our Lord, do we deny; all praise is Yours." This response moved the Prophet ﷺ, who said: "The Jinn responded better than you." [At-Tirmidhi 3291] Each repetition is a divine invitation to deep mindfulness and satisfaction. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Slowly recite "Fabi-ayyi ala-i Rabbikuma tukadhdhiban" three times',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Answer the divine question',
        instruction:
          'Slowly recite this verse while answering in your heart: "None of Your favors, my Lord, do I deny." The Jinn answered better than the humans — let us match them.',
        arabicText: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
        transliteration: 'Fabi-ayyi ala-i Rabbikuma tukadhdhiban',
        translation: 'So which of the favors of your Lord would you deny?',
        source: 'Surah Ar-Rahman 55:13 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'breathing',
        title: '31 invitations to mindfulness',
        instruction:
          'This question is repeated 31 times in Surah Ar-Rahman. Each repetition is a divine invitation to pause and reflect on a different category of blessing. Allah is asking you personally: which favor would you deny?',
        source: 'Tafsir al-Qurtubi on 55:13',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'book-quran',
        title: 'Listen to Surah Ar-Rahman',
        instruction:
          'Listen to a recitation of Surah Ar-Rahman. Each time the question comes, close your eyes and answer: "La bi shay\'in min ni\'amika Rabbana nukaddhib" (We deny none of Your favors, our Lord).',
        source: '"The Jinn responded better than you." [Tirmidhi 3291]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'Which favor of my Lord am I particularly aware of in this moment?',
  },
  {
    id: 'q_angle_31_12_content',
    contentId: 'quran_31_12',
    mood: 'Grateful',
    angle:
      'Allah says: "And whoever is grateful is grateful for the benefit of himself. And whoever denies—then indeed, Allah is Free of need and Praiseworthy." Ibn Kathir explains that gratitude and contentment are investments in your own spiritual health—Allah gains nothing from your thanks, but you gain everything. Al-Sa\'di adds that recognizing this transforms gratitude from a duty into a privilege: you are not doing Allah a favor by being content; you are doing yourself one. The Prophet ﷺ said: "Be content with what Allah has apportioned for you and you will be the richest of people." [At-Tirmidhi 2305] Contentment is the ultimate gift you give yourself. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Recognize that your current feeling of peace is a gift you are giving yourself',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'honey',
        title: 'Contentment = true wealth',
        instruction:
          'The Prophet ﷺ said: "Be content with what Allah has apportioned for you and you will be the richest of people." Contentment is not settling for less — it is recognizing that what Allah chose for you IS the best. You are already rich.',
        source: '"Be content and you will be the richest." [Tirmidhi 2305]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'physical',
        icon: 'calm-face',
        title: 'Feel the peace',
        instruction:
          'Close your eyes for 30 seconds and notice the peace you feel right now. That peace is not random — it is a gift you are giving YOURSELF through contentment. Allah gains nothing from your gratitude; you gain everything.',
        source: "Tafsir al-Sa'di on 31:12",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua of contentment',
        instruction:
          'Say: "Allahumma qanni\'ni bima razaqtani" (O Allah, make me content with what You have provided me).',
        arabicText: 'اللَّهُمَّ قَنِّعْنِي بِمَا رَزَقْتَنِي',
        transliteration: "Allahumma qanni'ni bima razaqtani",
        translation: 'O Allah, make me content with what You have provided me',
        source: 'Tirmidhi 2305 — Hasan',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: "How does being content with Allah's decree bring peace to my heart (Qalb)?",
  },
  {
    id: 'q_angle_5_3_content',
    contentId: 'quran_5_3',
    mood: 'Grateful',
    angle:
      'Allah says: "This day I have perfected for you your religion and completed My favor upon you and have approved for you Islam as religion." Ibn Kathir explains this was revealed on the day of Arafah during the farewell pilgrimage—and it made Umar (RA) weep because he understood that perfection implies completion. Al-Qurtubi adds that "completed My favor" means Islam provides a comprehensive guide for every aspect of life—spiritual, social, personal, and moral. The Prophet ﷺ received this verse as a capstone of 23 years of revelation, and no legislation was revealed after it. Having a "perfected" faith is itself the greatest contentment. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Reflect on the completeness of your faith as a guide for life',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'checkmark',
        title: 'A perfected faith',
        instruction:
          'You follow a religion that Allah Himself declared PERFECTED. Umar (RA) wept when he heard this verse because perfection implies completion. You have a comprehensive guide for every aspect of life. What more could you need?',
        source: 'Tafsir Ibn Kathir on 5:3',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'book-quran',
        title: 'Read one guidance',
        instruction:
          'Open the Quran or a book of hadith and read one piece of guidance. This is from a perfected religion — a complete favor from the Creator. Apply it to one situation in your life today.',
        source: 'Tafsir al-Qurtubi on 5:3',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Testify to the favor',
        instruction:
          'Say: "Raditu billahi Rabban, wa bil-Islami dinan, wa bi-Muhammadin nabiyyan" (I am pleased with Allah as Lord, Islam as religion, and Muhammad as Prophet).',
        arabicText: 'رَضِيتُ بِاللَّهِ رَبًّا وَبِالإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا',
        transliteration: 'Raditu billahi Rabban, wa bil-Islami dinan, wa bi-Muhammadin nabiyyan',
        translation: 'I am pleased with Allah as Lord, Islam as religion, and Muhammad as Prophet',
        source: '"Whoever says this, Paradise becomes obligatory for him." [Abu Dawud 1529]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'What does it mean to have a "perfected" favor from the Creator?',
  },
  {
    id: 'q_angle_28_73_content',
    contentId: 'quran_28_73',
    mood: 'Grateful',
    angle:
      'Allah says: "And out of His mercy He made for you the night and the day that you may rest therein and seek from His bounty and that perhaps you will be grateful." Ibn Kathir explains that the alternation of night and day is a deliberate act of mercy—night for rest and recovery, day for work and provision. Al-Sa\'di adds that this natural rhythm provides a natural container for human contentment: there is a time for effort and a time for stillness, both divinely ordained. The Prophet ﷺ would say when evening came: "The night has come and the day has departed, and Allah is praised." [Abu Dawud] Finding peace in natural rhythms is itself a form of worship. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Observe the light (or dark) outside and see it as a deliberate mercy',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'crescent',
        title: 'Observe the sky',
        instruction:
          'Look outside right now. Notice whether it is light or dark. This is not random — it is a deliberate act of mercy. Night for rest, day for work. Allah arranged the cosmos so you can find peace. Honor the rhythm.',
        source: 'Tafsir Ibn Kathir on 28:73',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'rewind',
        title: 'Rest is divinely ordained',
        instruction:
          'There is a time for effort and a time for stillness — both divinely ordained. If it is nighttime, Allah designed it for your rest. If it is daytime, He designed it for your provision. Finding peace in natural rhythms is worship.',
        source: "Tafsir al-Sa'di on 28:73",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Evening/morning dhikr',
        instruction: 'Say the Prophetic evening dua when night falls.',
        arabicText: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ',
        transliteration: 'Amsayna wa amsal-mulku lillah, wal-hamdulillah',
        translation:
          'We have reached the evening and the dominion belongs to Allah, and all praise is for Allah',
        source: 'Abu Dawud 5071 — Sahih',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: "How does the world's natural order provide a container for my peace?",
  },
  {
    id: 'q_angle_2_152_content',
    contentId: 'quran_2_152',
    mood: 'Grateful',
    angle:
      'Allah says: "So remember Me; I will remember you. And be grateful to Me and do not deny Me." Ibn Kathir explains that this is the most intimate transaction in existence: when you remember Allah, He—the Creator of the heavens and earth—remembers you by name. Al-Sa\'di adds that the Hadith Qudsi expands this: "If he remembers Me in himself, I remember him in Myself. If he remembers Me in a gathering, I remember him in a gathering better than theirs." [Sahih Bukhari 7405] The Prophet ﷺ said: "The example of one who remembers his Lord and one who does not is like the living and the dead." [Sahih Bukhari 6407] No relationship offers greater contentment. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Remember Allah now so that He remembers you in this very moment',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Remember Him now',
        instruction:
          'Say "SubhanAllah, Alhamdulillah, La ilaha illallah, Allahu Akbar" right now. At this very moment, Allah — the Creator of the heavens and earth — is remembering YOU by name.',
        arabicText: 'فَاذْكُرُونِي أَذْكُرْكُمْ',
        transliteration: 'Fadhkuruni adhkurkum',
        translation: 'Remember Me; I will remember you',
        source: 'Surah Al-Baqarah 2:152 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'star',
        title: 'The most intimate transaction',
        instruction:
          'When you remember Allah quietly, He remembers you in Himself. When you mention Him in a gathering, He mentions you in a gathering BETTER than yours. There is no relationship in existence more intimate or fulfilling than this.',
        source: 'Hadith Qudsi — Bukhari 7405',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Sit in dhikr',
        instruction:
          'Sit quietly for 2 minutes doing nothing but dhikr. Say "SubhanAllah" on each exhale. The Prophet ﷺ said the one who remembers Allah vs the one who does not is like the living vs the dead. Be alive right now.',
        source: '"Like the living and the dead." [Bukhari 6407]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'What could be more fulfilling than being remembered by the King of Kings?',
  },
  {
    id: 'q_angle_16_53_content',
    contentId: 'quran_16_53',
    mood: 'Grateful',
    angle:
      'Allah says: "And whatever you have of favor—it is from Allah. Then when adversity touches you, to Him you cry for help." Ibn Kathir explains that this verse establishes both halves of the equation: in ease, recognize the Source; in hardship, return to the Source. Al-Sa\'di adds that knowing every blessing comes from Allah removes the pressure of self-reliance—you are not the author of your success, so you need not fear being the author of your failure. The Prophet ﷺ said: "Be mindful of Allah and He will protect you. Be mindful of Allah and you will find Him before you." [At-Tirmidhi 2516] Knowing the Source brings permanent contentment. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: "Acknowledge that every small win today started with Allah's grace",
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'target',
        title: 'You are not the author',
        instruction:
          'You are not the author of your success, so you need not fear being the author of your failure. Every favor is from Allah. In ease, recognize the Source. In hardship, return to the Source. Both paths lead to contentment.',
        source: "Tafsir al-Sa'di on 16:53",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'pen',
        title: "Trace today's wins",
        instruction:
          'Think of one small win from today. Now acknowledge: "This started with Allah\'s grace." When you attribute success to its true Source, the pressure of self-reliance melts away.',
        source: '"Be mindful of Allah and you will find Him before you." [Tirmidhi 2516]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Be mindful of Allah',
        instruction:
          'Say: "HasbiyAllahu wa ni\'mal-wakeel" — Allah is sufficient for me in ease and hardship.',
        arabicText: 'حَسْبِيَ اللَّهُ وَنِعْمَ الْوَكِيلُ',
        transliteration: "HasbiyAllahu wa ni'mal-wakeel",
        translation: 'Allah is sufficient for me and He is the best Disposer of affairs',
        source: 'Surah Al-Imran 3:173 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does attributing success to Allah remove the pressure for me to be perfect?',
  },
  {
    id: 'q_angle_89_27_30_content',
    contentId: 'quran_89_27_30',
    mood: 'Grateful',
    angle:
      'Allah says: "O reassured soul, return to your Lord, well-pleased and pleasing to Him. Enter among My righteous servants, and enter My Paradise." Ibn Kathir explains that the "nafs al-mutma\'innah" (reassured soul) is the one that found deep contentment through faith and certainty in Allah. Al-Baghawi adds that "return to your Lord" is the most beautiful invitation—a homecoming for the soul that was always meant to be with its Creator. The Prophet ﷺ said: "When Allah loves a servant, He calls Jibril and says: I love so-and-so, so love him." [Sahih Bukhari 3209] The ultimate contentment is knowing you are heading home. [Tafsir al-Baghawi]',
    angleSource: 'Tafsir al-Baghawi',
    action: 'Reflect on the peace of a soul that has found its home in Allah',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'home',
        title: 'You are heading home',
        instruction:
          'The "nafs al-mutma\'innah" is the soul that found deep contentment through certainty in Allah. "Return to your Lord" is the most beautiful invitation — a homecoming. You are not wandering; you are heading home to the One who loves you.',
        source: 'Tafsir al-Baghawi on 89:27-30',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'calm-face',
        title: 'Cultivate reassurance',
        instruction:
          'Close your eyes. Take 3 deep breaths. Reflect on the peace of a soul that is "well-pleased and pleasing" to its Lord. Feel the tranquility of knowing your destination is Paradise. This is the nafs al-mutma\'innah.',
        source: 'Tafsir Ibn Kathir on 89:27-30',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Recite the invitation',
        instruction: 'Recite this verse slowly and ponder that Allah says it directly to you.',
        arabicText:
          'يَا أَيَّتُهَا النَّفْسُ الْمُطْمَئِنَّةُ ارْجِعِي إِلَىٰ رَبِّكِ رَاضِيَةً مَرْضِيَّةً',
        transliteration: "Ya ayyatuhan-nafsul-mutma'innah, irji'i ila Rabbiki radiyatan mardiyyah",
        translation: 'O reassured soul, return to your Lord, well-pleased and pleasing to Him',
        source: 'Surah Al-Fajr 89:27-28 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What can I do today to cultivate a "reassured soul" (Nafs al-Mutma\'innah)?',
  },

  // === CALM ANGLES ===
  {
    id: 'q_angle_13_28_calm',
    contentId: 'quran_13_28',
    mood: 'Calm',
    angle:
      'Allah says: "Verily, in the remembrance of Allah do hearts find rest." Ibn Kathir explains that this verse establishes a universal principle: the human heart was created with a void that only the remembrance of Allah can fill—no wealth, status, or relationship can substitute. Al-Sa\'di adds that "tatma\'innu" (find rest) means a deep, settled peace that comes only when the heart is connected to its Creator. The Prophet ﷺ said: "Shall I not tell you the best of your deeds, the purest of them with your Lord, which raises your ranks the most? It is the remembrance of Allah." [At-Tirmidhi 3377] Dhikr is not ritual—it is the heart\'s medicine. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Close your eyes and recite "SubhanAllah" with awareness of its meaning',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: "The heart's medicine",
        instruction:
          'Close your eyes and say "SubhanAllah" 33 times slowly, feeling each word. This is not ritual — it is the heart\'s medicine. Your heart was created with a void only dhikr can fill.',
        arabicText: 'سُبْحَانَ اللَّهِ',
        transliteration: 'SubhanAllah',
        translation: 'Glory be to Allah',
        source: '"The best of deeds is the remembrance of Allah." [Tirmidhi 3377]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
        countSource: 'Muslim 597',
        count: 33,
      },
      {
        type: 'mindset',
        icon: 'heart',
        title: 'The void only He fills',
        instruction:
          'Your heart was created with a void that no wealth, status, or relationship can fill. Only the remembrance of Allah brings "tatma\'innu" — deep, settled peace. You have found the only Source of lasting calm.',
        source: "Tafsir al-Sa'di on 13:28",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Sit in stillness',
        instruction:
          'Sit in a quiet place for 3 minutes. Do nothing but breathe and repeat "SubhanAllah" on each exhale. Let the remembrance settle into your bones. This is what rest feels like.',
        source: "Surah Ar-Ra'd 13:28 — Quran",
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What specific type of remembrance brings your heart the most peace?',
  },
  {
    id: 'q_angle_30_21_calm',
    contentId: 'quran_30_21',
    mood: 'Calm',
    angle:
      'Allah says: "And of His signs is that He created for you from yourselves mates that you may find tranquility in them, and He placed between you affection and mercy." Ibn Kathir explains that "sakina" (tranquility) in relationships is a direct sign (ayah) of Allah—meaning that the peace you feel with a loved one is divinely placed. Al-Qurtubi adds that the "mawaddah" (affection) and "rahmah" (mercy) are two distinct gifts: affection is the warmth of love, while mercy is the gentle patience that sustains relationships through difficulty. The Prophet ﷺ said: "The best of you is the best to his family, and I am the best of you to my family." [At-Tirmidhi 3895] [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Express appreciation to a loved one who brings you peace',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'chat',
        title: 'Express appreciation',
        instruction:
          'Send a kind message to a loved one right now expressing appreciation. The peace you feel with them is a direct sign (ayah) of Allah — a divinely placed tranquility. Honor that sign by nurturing it.',
        source: '"The best of you is the best to his family." [Tirmidhi 3895]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'heart',
        title: 'Affection and mercy',
        instruction:
          'Allah placed TWO gifts in your relationships: mawaddah (affection — the warmth of love) and rahmah (mercy — the patience that sustains through difficulty). Both are divine gifts. Recognize them and protect them.',
        source: 'Tafsir al-Qurtubi on 30:21',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for your loved ones',
        instruction:
          'Make dua for the people who bring you peace: "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a\'yun."',
        arabicText: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ',
        transliteration: "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yun",
        translation: 'Our Lord, grant us from our spouses and offspring comfort to our eyes',
        source: 'Surah Al-Furqan 25:74 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How can you better cultivate a "home of tranquility" in your heart?',
  },

  {
    id: 'q_angle_6_54_calm',
    contentId: 'quran_6_54',
    mood: 'Calm',
    angle:
      'Allah says: "Your Lord has decreed upon Himself mercy." Ibn Kathir explains that "kataba ala nafsihi" (decreed upon Himself) means Allah made mercy an obligation upon Himself—not because anyone forced Him, but out of His infinite generosity. Al-Sa\'di adds that when you greet a believer with "Salam," Allah responds with a greeting of peace back to you. The Prophet ﷺ said: "When Allah created creation, He wrote in His Book which is with Him above the Throne: My mercy prevails over My wrath." [Sahih Bukhari 3194] You are living under a decree of mercy that cannot be revoked. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Close your eyes and accept that Allah has obligated mercy upon Himself for you',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'book-quran',
        title: 'A decree of mercy',
        instruction:
          'Allah OBLIGATED mercy upon Himself. He wrote it above the Throne: "My mercy prevails over My wrath." This is not a suggestion — it is a decree that cannot be revoked. You are living under permanent mercy.',
        source: '"My mercy prevails over My wrath." [Bukhari 3194]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Greet with Salam',
        instruction:
          'Say "As-Salamu Alaykum" to the next person you see. When you spread salam, you invoke a divine Name and spread a heavenly reality on earth. Allah responds to your peace with His peace.',
        arabicText: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
        transliteration: "As-Salamu 'alaykum wa rahmatullah",
        translation: 'Peace be upon you and the mercy of Allah',
        source: "Surah Al-An'am 6:54 — Quran",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'calm-face',
        title: 'Rest in mercy',
        instruction:
          'Close your eyes for 30 seconds. Breathe deeply. Accept that the Creator of the universe has obligated mercy upon Himself FOR you. You do not need to earn it. It is already decreed.',
        source: 'Tafsir Ibn Kathir on 6:54',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does it feel to be greeted with "Salam" by your Lord?',
  },
  {
    id: 'q_angle_16_32_calm',
    contentId: 'quran_16_32',
    mood: 'Calm',
    angle:
      'Allah says: "The ones whom the angels take in death, being good and pure. The angels will say: Peace be upon you. Enter Paradise for what you used to do." Ibn Kathir explains that "tayyibeen" (good and pure) refers to souls whose hearts were cleansed through faith and righteous deeds. Al-Sa\'di adds that the angels\' greeting of "Salam" at the moment of death is reserved for those who cultivated inner purity during life. The Prophet ﷺ said: "Truly, Allah does not look at your appearance or wealth, but He looks at your hearts and your deeds." [Sahih Muslim 2564] Inner purity is the passport to angelic peace. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Focus on purifying your intention for your next task',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'star',
        title: 'Inner purity is the passport',
        instruction:
          'The angels greet with "Salam" only those who are "tayyibeen" — good and pure of heart. Allah does not look at your appearance or wealth. He looks at your heart. Inner purity during life earns angelic peace at death.',
        source: "Tafsir al-Sa'di on 16:32",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Purify with wudu',
        instruction:
          'Make wudu as a physical act of purification. As you wash each limb, intend to cleanse not just your body but your heart. The Prophet ﷺ said sins fall off with the drops of water during wudu.',
        source: '"Sins fall off with the drops of wudu water." [Muslim 244]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for purity',
        instruction: 'Ask Allah to purify your heart so the angels may greet you with peace.',
        arabicText: 'اللَّهُمَّ طَهِّرْ قَلْبِي مِنَ النِّفَاقِ',
        transliteration: 'Allahumma tahhir qalbi minan-nifaq',
        translation: 'O Allah, purify my heart from hypocrisy',
        source: '"Allah looks at your hearts and your deeds." [Muslim 2564]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'What does a state of "goodness and purity" feel like in this moment?',
  },
  {
    id: 'q_angle_36_58_calm',
    contentId: 'quran_36_58',
    mood: 'Calm',
    angle:
      'Allah says: "Peace!"—a word from a Merciful Lord." Ibn Kathir explains that this is the ultimate greeting: Allah Himself says "Salam" to the people of Paradise—a direct, personal word of peace from the Creator to His servants. Al-Qurtubi adds that this single word encompasses freedom from all harm, grief, fear, and pain forever. The Prophet ﷺ said: "As-Salam (Peace) is one of the names of Allah which He has placed upon the earth, so spread it among yourselves." [Sahih Bukhari, Al-Adab Al-Mufrad 989] When you say "Salam," you are invoking a divine name and spreading a heavenly reality on earth. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Slowly repeat the word "Salam" and let it anchor your soul',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'breathing',
        title: 'Repeat "Salam"',
        instruction:
          'Slowly say "Salam." This is a divine Name. Each time you say it, you are invoking Allah\'s attribute of Peace.',
        arabicText: 'سَلَامٌ قَوْلًا مِن رَبٍّ رَحِيمٍ',
        transliteration: 'Salamun qawlan min Rabbin Rahim',
        translation: 'Peace! A word from a Merciful Lord',
        source: 'Surah Ya-Sin 36:58 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'moon',
        title: 'The ultimate greeting',
        instruction:
          'ponder: Allah Himself will say "Salam" to you in Paradise. A direct, personal word of peace from the Creator. This single word encompasses freedom from ALL harm, grief, fear, and pain — forever. That peace begins now, in your heart.',
        source: 'Tafsir al-Qurtubi on 36:58',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'handshake',
        title: 'Spread salam',
        instruction:
          'Say "As-Salamu Alaykum" to someone today with full presence and meaning. The Prophet ﷺ said salam is a Name of Allah placed on earth. When you spread it, you spread divine peace.',
        source: '"Salam is a Name of Allah placed upon the earth." [Al-Adab Al-Mufrad 989]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How does a greeting of peace from the Creator silence the noise of the world?',
  },
  {
    id: 'q_angle_97_5_calm',
    contentId: 'quran_97_5',
    mood: 'Calm',
    angle:
      'Allah says: "Peace it is until the emergence of dawn." Ibn Kathir explains that Laylatul Qadr (the Night of Decree) is enveloped in complete salam (peace)—from the moment the sun sets until dawn. Al-Sa\'di adds that this peace is not just an absence of harm but an active, descending tranquility that touches every believer who seeks it. The Prophet ﷺ said: "Whoever stands in prayer on Laylatul Qadr out of faith and seeking reward, his previous sins will be forgiven." [Sahih Bukhari 1901] While Laylatul Qadr is one special night, the principle of seeking peace in the stillness of the night applies to every night of devotion. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Set an intention to find stillness in the early hours of tomorrow',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'crescent',
        title: 'Peace until dawn',
        instruction:
          'Laylatul Qadr is enveloped in complete salam — not just absence of harm, but an active, descending tranquility. While that is one special night, the principle applies to every night of devotion. Seek the stillness of the night for your soul.',
        source: "Tafsir al-Sa'di on 97:5",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'moon',
        title: 'Night devotion',
        instruction:
          "Set an intention to wake up 15 minutes before Fajr tomorrow. In that stillness, pray 2 rak'ahs. The night is when the world is quiet and your heart can hear Allah most clearly.",
        source:
          '"Whoever stands in prayer on Laylatul Qadr... his sins will be forgiven." [Bukhari 1901]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua of Laylatul Qadr',
        instruction:
          'Recite the dua Aisha (RA) asked the Prophet ﷺ to teach her for Laylatul Qadr.',
        arabicText: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
        transliteration: "Allahumma innaka 'Afuwwun tuhibbul-'afwa fa'fu 'anni",
        translation: 'O Allah, You are the Pardoner, You love to pardon, so pardon me',
        source: 'Tirmidhi 3513 — Sahih',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How can I carry the "salam" of Laylatul Qadr into my daily life?',
  },
  {
    id: 'q_angle_56_91_calm',
    contentId: 'quran_56_91',
    mood: 'Calm',
    angle:
      'Scholars like Ibn Kathir explain that the "Companions of the Right" are granted an eternal state of peace (Salam) and safety, free from all worry and harm, as a reward for their enduring faith. [Tafsir Ibn Kathir]',
    action: 'Reach out to a righteous companion and share a word of peace.',
    actionHowTo: 'Send a message or visit someone whose presence reminds you of Allah.',
    actionReward:
      'The Prophet ﷺ said: "The best of companions in the sight of Allah is the one who is best to his companion." [At-Tirmidhi]',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'chat',
        title: 'Reach out with peace',
        instruction:
          'Send a message to a righteous friend right now — someone whose presence reminds you of Allah. Share a word of peace or a kind thought. The best companion is the one who is best to their companions.',
        source: '"The best of companions is the one who is best to his companion." [Tirmidhi]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'handshake',
        title: 'Community of tranquility',
        instruction:
          'The "Companions of the Right" are granted eternal peace and safety. In this world, surrounding yourself with righteous people creates a foretaste of that peace. Your community of faith IS your community of tranquility.',
        source: 'Tafsir Ibn Kathir on 56:91',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for your companions',
        instruction:
          'Make dua for a friend by name: "Allahumma-ghfir li wa lahu" (O Allah, forgive me and forgive them).',
        arabicText: 'اللَّهُمَّ اغْفِرْ لِي وَلَهُ',
        transliteration: 'Allahumma-ghfir li wa lahu',
        translation: 'O Allah, forgive me and forgive them',
        source: '"A person is upon the religion of their close friend." [Abu Dawud 4833]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How does a community of tranquility support my individual peace?',
  },
  {
    id: 'q_angle_89_27_30_calm',
    contentId: 'quran_89_27_30',
    mood: 'Calm',
    angle:
      'Ibn Abbas explained that the "reassured soul" (Al-Nafs al-Mutma’innah) is the one that is tranquil and certain in its belief and its Lord, responding to every decree with pleasure. [Tafsir al-Baghawi]',
    action: 'Return to your Lord in this moment by acknowledging His perfect care over you.',
    actionHowTo:
      'Repeat "Raditu billahi Rabba" (I am pleased with Allah as my Lord) until you feel stillness.',
    actionReward:
      'Allah says: "Enter among My [righteous] servants, And enter My Paradise." [Quran 89:29-30]',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Be pleased with your Lord',
        instruction:
          'Repeat "Raditu billahi Rabba" until you feel inner stillness. Respond to Allah\'s decree with pleasure — this is the mark of the reassured soul.',
        arabicText: 'رَضِيتُ بِاللَّهِ رَبًّا',
        transliteration: 'Raditu billahi Rabba',
        translation: 'I am pleased with Allah as my Lord',
        source: '"Whoever says this, Paradise becomes obligatory." [Abu Dawud 1529]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'home',
        title: 'At home in your faith',
        instruction:
          "The nafs al-mutma'innah responds to EVERY decree with pleasure — not just the easy ones. This soul is tranquil because it is certain in its Lord. You are not lost; you are at home in your faith.",
        source: 'Tafsir al-Baghawi on 89:27-30',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'calm-face',
        title: 'Stillness practice',
        instruction:
          'Sit in silence for 2 minutes. Let your breathing slow naturally. Feel the calm that is already present. This is not something you need to create — it is something you need to notice. The reassured soul is already within you.',
        source: '"Enter among My righteous servants, and enter My Paradise." [Quran 89:29-30]',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What changes in your calm state when you truly feel "at home" in your faith?',
  },

  {
    id: 'q_angle_2_208_calm',
    contentId: 'quran_2_208',
    mood: 'Calm',
    angle:
      'Ibn Kathir explains that "Al-Silm" refers to Islam. Allah commands the believers to embrace all branches of faith and laws of Islam completely to find total security. [Tafsir Ibn Kathir]',
    action:
      'Enter into "Silm" (peace/submission) today by making one small, consistent choice for Allah.',
    actionHowTo: 'Pick a small habit like saying "Subhan Allah" after prayer and commit to it.',
    actionReward:
      'The Prophet ﷺ said: "The most beloved of deeds to Allah are those that are consistent, even if they are small." [Bukhari]',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'shield',
        title: 'Total submission = total security',
        instruction:
          'Al-Silm means both peace AND submission. When you embrace Islam completely — not partially — you find total security. The more you submit, the more secure your heart becomes. This is the divine equation.',
        source: 'Tafsir Ibn Kathir on 2:208',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'One consistent habit',
        instruction:
          'Pick one small habit and commit to it today: say "SubhanAllah" 10 times after each prayer, or read one verse of Quran daily. The most beloved deeds to Allah are consistent ones, even if small.',
        source: '"The most beloved deeds are consistent, even if small." [Bukhari]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Enter into peace',
        instruction:
          'Say: "Allahumma aslim qalbi lak" (O Allah, make my heart submit to You). True peace comes from complete surrender.',
        arabicText: 'اللَّهُمَّ أَسْلِمْ قَلْبِي لَكَ',
        transliteration: 'Allahumma aslim qalbi lak',
        translation: 'O Allah, make my heart submit to You',
        source: 'Surah Al-Baqarah 2:208 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: "How does total submission to Allah's plan bring your heart into deep security?",
  },
  {
    id: 'q_angle_93_11_grateful',
    contentId: 'quran_93_11',
    mood: 'Grateful',
    angle:
      'The Prophet ﷺ said: "To speak of the blessings of Allah is gratitude, and to leave it is ingratitude." Mentioning favors is a means of increasing love for Him. [Musnad Ahmad 18449]',
    action: 'Report a favor of your Lord by specifically mentioning a blessing to someone today.',
    actionHowTo: 'Share a story of how Allah helped you with a friend or family member.',
    actionReward:
      'Allah says: "If you are grateful, I will surely increase you [in favor]." [Quran 14:7]',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'chat',
        title: 'Share your story',
        instruction:
          'Share a story of how Allah helped you with a friend or family member today. Speaking of blessings IS gratitude. Silence about them is ingratitude.',
        source: '"To speak of blessings is gratitude, to leave it is ingratitude." [Ahmad 18449]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'chart',
        title: 'Sharing triggers increase',
        instruction:
          "When you report Allah's favors, He increases them. This is a divine law. Your testimony of blessings is not boasting — it is an act of worship that opens doors to more blessings.",
        source: '"If you are grateful, I will surely increase you." [Quran 14:7]',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Proclaim and praise',
        instruction:
          'Say "Alhamdulillah" and then name one specific blessing out loud. The act of speaking gratitude makes it real and multiplies its effect.',
        arabicText: 'وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ',
        transliteration: "Wa amma bini'mati Rabbika fahaddith",
        translation: 'And as for the favor of your Lord, report it',
        source: 'Surah Ad-Duha 93:11 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection:
      'How does sharing your joy and Reporting His favors increase your own sense of being blessed?',
  },
  {
    id: 'q_angle_55_13_grateful',
    contentId: 'quran_55_13',
    mood: 'Grateful',
    angle:
      'When the Prophet ﷺ recited this to the Jinn, they replied: "None of Your favors, our Lord, do we deny; all praise is yours." It is a divine invitation to deep mindfulness. [At-Tirmidhi 3291]',
    action: 'Observe a specific favor in nature today and recognize its Creator.',
    actionHowTo:
      'Look at a flower, a tree, or the sky and say: "Subhan Allah, this is Your favor."',
    actionReward:
      'The Prophet ﷺ said: "The best of dhikr is Al-hamdu lillah (All praise is due to Allah)." [At-Tirmidhi]',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'leaf',
        title: "Observe nature's favor",
        instruction:
          'Look at a flower, a tree, or the sky and say: "SubhanAllah, this is Your favor." The signs of Allah in nature are divine invitations to mindfulness and gratitude.',
        source: '"The Jinn responded better than you." [Tirmidhi 3291]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Answer the question',
        instruction: 'Recite this verse and answer: "None of Your favors, my Lord, do I deny."',
        arabicText: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
        transliteration: 'Fabi-ayyi ala-i Rabbikuma tukadhdhiban',
        translation: 'So which of the favors of your Lord would you deny?',
        source: 'Surah Ar-Rahman 55:13 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'breathing',
        title: 'Deep mindfulness',
        instruction:
          'This question is repeated 31 times in Surah Ar-Rahman — each time inviting you to pause and reflect on a different blessing. Right now, identify the ONE favor you are most aware of and sit with that awareness.',
        source: 'Tafsir al-Qurtubi on 55:13',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'Which specific favor of my Lord am I most aware of right now?',
  },
  {
    id: 'q_angle_5_3_grateful',
    contentId: 'quran_5_3',
    mood: 'Grateful',
    angle:
      'Allah says: "This day I have perfected for you your religion and completed My favor upon you." Ibn Kathir narrates that when this verse was revealed, Umar (RA) wept. When asked why, he said: "After perfection, there is nothing but decrease." Al-Sa\'di explains that gratitude for the completion of Islam means recognizing that you have been given a fully perfected system of guidance—something no previous nation received in such completeness. The Prophet ﷺ said: "Islam began as something strange and will return to being strange, so blessed are the strangers." [Sahih Muslim 145] Being grateful for the gift of Islam is the foundation of all other gratitude. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Say "Alhamdulillah" for the gift of being a Muslim',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'checkmark',
        title: 'A perfected gift',
        instruction:
          'Umar (RA) wept when this verse was revealed because after perfection there is nothing but decrease. You have been given a COMPLETE system of guidance — something no previous nation received. Being grateful for Islam is the foundation of all other gratitude.',
        source: "Tafsir al-Sa'di on 5:3",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Thank Allah for Islam',
        instruction:
          'Say "Alhamdulillah alal-Islam" and mean it deeply. Islam began as something strange and will return to being strange — blessed are the strangers. You are among the blessed.',
        arabicText: 'الْحَمْدُ لِلَّهِ عَلَى نِعْمَةِ الإِسْلَامِ',
        transliteration: "Alhamdulillah 'ala ni'matil-Islam",
        translation: 'All praise is for Allah for the blessing of Islam',
        source: '"Blessed are the strangers." [Muslim 145]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Sujud of gratitude for Islam',
        instruction:
          'Perform a sujud of gratitude specifically for the blessing of being a Muslim. Not everyone was guided. Your Islam is the greatest completed favor from the Creator.',
        source: 'Tafsir Ibn Kathir on 5:3',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How is the perfection of my religion a completed favor for my life?',
  },
  {
    id: 'q_angle_2_152_grateful',
    contentId: 'quran_2_152',
    mood: 'Grateful',
    angle:
      'Allah says: "So remember Me; I will remember you. And be grateful to Me and do not deny Me." Ibn Kathir explains that gratitude and remembrance are linked—when you thank Allah, you are also remembering Him, and He remembers you in return. Al-Sa\'di adds that the ability to be grateful is itself a blessing that deserves gratitude, creating a beautiful cycle: gratitude leads to remembrance, which leads to divine attention, which leads to more blessings. The Prophet ﷺ said: "If he remembers Me in himself, I remember him in Myself." [Sahih Bukhari 7405] Your gratitude is not just acknowledged—it is reciprocated by the King of Kings. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Thank Allah for the strength to even remember Him',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Remember and be remembered',
        instruction:
          'Say "SubhanAllah, Alhamdulillah, La ilaha illallah, Allahu Akbar" right now. As you say these words, Allah is remembering YOU. Your gratitude is reciprocated by the King of Kings.',
        arabicText: 'فَاذْكُرُونِي أَذْكُرْكُمْ',
        transliteration: 'Fadhkuruni adhkurkum',
        translation: 'Remember Me; I will remember you',
        source: 'Surah Al-Baqarah 2:152 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'rewind',
        title: 'The beautiful cycle',
        instruction:
          'The ability to be grateful is itself a blessing that deserves gratitude. This creates a beautiful cycle: gratitude → remembrance → divine attention → more blessings → more gratitude. You are in this cycle right now.',
        source: "Tafsir al-Sa'di on 2:152",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Sit in grateful dhikr',
        instruction:
          'Sit for 2 minutes doing nothing but dhikr with a grateful heart. The fact that you CAN remember Allah right now is itself a sign that He is remembering you. Thank Him for the ability to thank Him.',
        source: '"If he remembers Me in himself, I remember him in Myself." [Bukhari 7405]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'What changes when I realize my gratitude is a sign He is remembering me?',
  },
  {
    id: 'q_angle_2_186_anxious',
    contentId: 'quran_2_186',
    mood: 'Overwhelmed',
    angle:
      'Allah says: "And when My servants ask you concerning Me—indeed I am near." Ibn Kathir explains that this verse is unique in the Quran: unlike other questions where Allah tells the Prophet to "say" the answer, here Allah answers directly—"I am near"—emphasizing the intimacy and immediacy of His presence. Al-Sa\'di adds that this nearness is especially felt in moments of desperation, when the heart races and the mind spirals. The Prophet ﷺ said: "You are not calling upon one who is deaf or absent. You are calling upon One who is All-Hearing, Ever-Near." [Sahih Bukhari 2992] When anxiety strikes, the Hearer of all prayers is already listening. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Slow your breathing and acknowledge that Allah is closer than your fear',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Slow breathing with dhikr',
        instruction:
          'Take 5 slow deep breaths. With each inhale, think "Allah is near." With each exhale, release your worry. He is closer than your fear.',
        source: '"You are not calling upon one who is deaf or absent." [Bukhari 2992]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Call upon the Near One',
        instruction:
          'Make a sincere dua right now. Speak to Allah as if He is right beside you — because He is.',
        arabicText: 'رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ',
        transliteration: 'Rabbi inni lima anzalta ilayya min khayrin faqir',
        translation: 'My Lord, indeed I am in need of whatever good You would send down to me',
        source: 'Surah Al-Qasas 28:24 — Dua of Musa (AS)',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'chat',
        title: 'He answered directly',
        instruction:
          'Notice: in this verse, Allah did not tell the Prophet to "say" to the people. He answered directly: "I am near." This is the only verse like it. The removal of the intermediary shows how urgently Allah wants you to know He is listening right now.',
        source: "Tafsir al-Sa'di on 2:186",
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does the nearness of the All-Hearing settle your anxiety?',
  },
  {
    id: 'q_angle_20_25_anxious',
    contentId: 'quran_20_25',
    mood: 'Overwhelmed',
    angle:
      'Musa (AS) prayed: "My Lord, expand for me my breast." Ibn Kathir explains that "sharh al-sadr" is the removal of tightness, anxiety, and spiritual constriction—replacing them with light, confidence, and inner spaciousness. Al-Qurtubi adds that this dua was made before Musa\'s most challenging moment (facing Pharaoh), showing it is specifically designed for overwhelming situations. The Prophet ﷺ was also granted this gift: "Have We not expanded for you your breast?" [94:1] The Prophet ﷺ said: "Make things easy for the people, and do not make it difficult for them." [Sahih Bukhari 6125] Seeking expansion is the antidote to the constriction of anxiety. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Recite "Rabbish-rah li sadri" three times slowly',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua of Musa (AS)',
        instruction:
          'Recite the exact dua Musa (AS) made before facing Pharaoh — designed for overwhelming moments.',
        arabicText: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
        transliteration: 'Rabbish-rah li sadri, wa yassir li amri',
        translation: 'My Lord, expand my breast and ease my affair for me',
        source: 'Surah Ta-Ha 20:25-26 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: "Pray two rak'ahs for ease",
        instruction:
          'Pray two voluntary rak\'ahs. In each sujud, repeat "Rabbish-rah li sadri" and feel the constriction in your chest being replaced with spaciousness.',
        source:
          '"Whenever a matter distressed him, the Prophet ﷺ would rush to prayer." [Abu Dawud 1319]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'chat',
        title: 'You are facing your Pharaoh',
        instruction:
          'Musa made this dua before his hardest task. Whatever is overwhelming you right now is your "Pharaoh." But remember: Musa made the dua, took the step, and Allah handled the rest. The same God is with you.',
        source: 'Tafsir al-Qurtubi on 20:25',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What does "expansion of the breast" look like for my current situation?',
  },
  {
    id: 'q_angle_40_44_anxious',
    contentId: 'quran_40_44',
    mood: 'Overwhelmed',
    angle:
      'The secret believer among Pharaoh\'s people said: "I entrust my affair to Allah. Indeed, Allah is Seeing of His servants." Ibn Kathir explains that this man trusted Allah when surrounded by the most powerful tyrant in history—and Allah saved him. Al-Sa\'di adds that "tafwid" (entrusting) is the highest form of tawakkul: it means releasing your grip on the outcome entirely and placing it in the hands of the One who sees all hidden realities. "So Allah protected him from the evils they plotted." [40:45] The Prophet ﷺ said: "If you relied on Allah as He should be relied upon, He would provide for you as He provides for the birds." [At-Tirmidhi 2344] [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Acknowledge that Allah sees your struggle and can handle the outcome',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'chat',
        title: 'Say the words of Tafwid',
        instruction:
          'Repeat the exact words of the secret believer — a man who survived Pharaoh by trusting Allah.',
        arabicText: 'وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ إِنَّ اللَّهَ بَصِيرٌ بِالْعِبَادِ',
        transliteration: "Wa ufawwidu amri ilAllah, innAllaha basirun bil-'ibad",
        translation: 'I entrust my affair to Allah. Indeed, Allah is Seeing of His servants',
        source: 'Surah Ghafir 40:44 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'eye',
        title: 'Allah is Al-Basir',
        instruction:
          'Allah is "Seeing of His servants." He sees the details of your struggle that no one else can see — the silent tears, the hidden worry, the pressure no one knows about. Nothing is invisible to Him.',
        source: "Tafsir al-Sa'di on 40:44",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'shield',
        title: 'Release your grip',
        instruction:
          'Physically clench your fists tight for 10 seconds, then slowly open them. As you open your hands, say "I hand this to You, Ya Allah." This physical act of release mirrors the spiritual act of tafwid.',
        source: '"So Allah protected him from the evils they plotted." [Quran 40:45]',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does letting go of the "How" bring peace to your heart?',
  },
  {
    id: 'q_angle_2_153_anxious_angle',
    contentId: 'quran_2_153',
    mood: 'Overwhelmed',
    angle:
      'Allah says: "O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient." Ibn Kathir explains that sabr (patience) and salah (prayer) are the two divinely prescribed stabilizers for the overwhelmed heart. Al-Qurtubi adds that the Prophet ﷺ himself would turn to prayer whenever a matter distressed him [Abu Dawud 1319], establishing that even the strongest souls need this anchor. The verse ends with "Allah is with the patient"—a promise of special divine companionship for those who endure. The Prophet ﷺ said: "The prayer is light." [Sahih Muslim 223] It illuminates the path when anxiety clouds your vision. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Stand for a 2-minute voluntary prayer to ground your soul',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: "Pray 2 rak'ahs right now",
        instruction:
          "Stand and pray two voluntary rak'ahs. The Prophet ﷺ would rush to prayer when distressed. Let the physical movements — standing, bowing, prostrating — ground your soul.",
        source:
          '"Whenever a matter distressed him, the Prophet ﷺ would rush to prayer." [Abu Dawud 1319]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dhikr of patience',
        instruction:
          'After prayer, sit and say "La hawla wa la quwwata illa billah" 10 times slowly.',
        arabicText: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
        transliteration: 'La hawla wa la quwwata illa billah',
        translation: 'There is no power or might except with Allah',
        source: '"It is a treasure from the treasures of Paradise." [Bukhari 6384]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'light-bulb',
        title: 'Prayer is light',
        instruction:
          'The Prophet ﷺ said "Prayer is light." When anxiety clouds your vision and you cannot see the way forward, salah illuminates the path. You are not just praying — you are turning on a light in your darkness.',
        source: '"The prayer is light." [Muslim 223]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
    ]),
    reflection:
      'How does the physical act of prayer (Salah) dissolve the weight of spiritual anxiety?',
  },
  {
    id: 'q_angle_41_30_anxious_angle',
    contentId: 'quran_41_30',
    mood: 'Overwhelmed',
    angle:
      'Allah says: "Indeed, those who have said, \'Our Lord is Allah,\' and then remained on a right course—the angels will descend upon them." Ibn Kathir explains that istiqamah (steadfastness) is maintaining faith despite fear and pressure—and the reward is angelic support that says: "Do not fear and do not grieve." Al-Sa\'di adds that the angels descend throughout life, not only at death, providing unseen comfort during moments of anxiety and fear. The Prophet ﷺ said: "Say: I believe in Allah, then be steadfast." [Sahih Muslim 38] When you hold firm despite your fears, heaven sends reinforcements. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Commit to staying on the "right course" today despite your fears',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Declare your faith',
        instruction:
          'Say "Rabbiyallah" (My Lord is Allah) out loud, then commit to one righteous act today despite how you feel. Istiqamah is not perfection — it is persistence.',
        arabicText: 'رَبِّيَ اللَّهُ',
        transliteration: 'Rabbiyallah',
        translation: 'My Lord is Allah',
        source: '"Say: I believe in Allah, then be steadfast." [Muslim 38]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'star',
        title: 'Angels are descending',
        instruction:
          'The angels do not only come at death. They descend upon you right now as you hold firm in faith. Unseen support is surrounding you. Your steadfastness triggers heavenly reinforcement.',
        source: "Tafsir al-Sa'di on 41:30",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'person',
        title: 'One step of istiqamah',
        instruction:
          'Choose one small righteous act right now — make wudu, give sadaqah, or call someone to check on them. Steadfastness is built one small act at a time, especially when it feels hard.',
        source:
          '"The most beloved of deeds to Allah are those that are consistent, even if small." [Bukhari 6464]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'What would it feel like to have the angels say "do not fear" to you?',
  },
  {
    id: 'q_angle_20_46_anxious_angle',
    contentId: 'quran_20_46',
    mood: 'Overwhelmed',
    angle:
      'Allah said to Musa and Harun: "Do not fear; indeed, I am with you both. I hear and I see." Ibn Kathir explains that this reassurance was given at the most terrifying moment—being sent to confront the most powerful ruler on earth. Al-Sa\'di adds that Allah\'s names As-Sami\' (The All-Hearing) and Al-Basir (The All-Seeing) are invoked here to show that He perceives every detail of your struggle: the trembling in your voice, the racing of your heart, the fear you cannot articulate. The Prophet ﷺ said: "Be mindful of Allah and you will find Him before you." [At-Tirmidhi 2516] You are never facing your fears alone. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Acknowledge that you are never alone in your struggle',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'headphones',
        title: 'He hears and He sees',
        instruction:
          'Allah told Musa at his most terrifying moment: "I hear and I see." The trembling you feel, the fear you cannot name, the worry keeping you up — He perceives every detail. You are not invisible.',
        source: 'Surah Ta-Ha 20:46 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Morning/evening protection dua',
        instruction: "Recite the Prophet's ﷺ dua for protection when facing something you fear.",
        arabicText:
          'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ',
        transliteration: "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'",
        translation:
          'In the name of Allah, with whose name nothing on earth or in heaven can cause harm',
        source:
          '"Whoever says this 3 times morning and evening, nothing will harm him." [Abu Dawud 5088]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
      {
        type: 'physical',
        icon: 'person',
        title: 'Face your fear with Bismillah',
        instruction:
          'Identify the one thing you are most afraid of today. Say "Bismillah, tawakkaltu \'alAllah" and take one step towards it. Musa faced Pharaoh — you can face your challenge.',
        source: '"Be mindful of Allah and you will find Him before you." [Tirmidhi 2516]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How does knowing Allah is "hearing and seeing" change your fear?',
  },
  {
    id: 'q_angle_8_33_stressed',
    contentId: 'quran_8_33',
    mood: 'Overwhelmed',
    angle:
      'Allah says: "But Allah would not punish them while they seek forgiveness." Ibn Kathir explains that istighfar (seeking forgiveness) is explicitly named as a divine shield against punishment and calamity. Al-Sa\'di adds that stress and difficulty can sometimes be spiritual signals—and istighfar is the prescribed response that clears spiritual blockages and opens doors of ease. The Prophet ﷺ said: "Whoever makes istighfar his constant practice, Allah will provide a way out of every distress, relief from every anxiety, and provide for him from sources he never imagined." [Abu Dawud 1518] A clean spiritual slate reduces the weight of external pressure. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Take a deep breath and say "Astaghfirullah" for any mistakes made in haste',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Istighfar — the divine shield',
        instruction:
          'Say "Astaghfirullah" 70 times. The Prophet ﷺ sought forgiveness 70-100 times daily. Istighfar is explicitly named as a shield against calamity.',
        arabicText: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ',
        transliteration: "Astaghfirullaha al-'Azim wa atubu ilayh",
        translation: 'I seek forgiveness from Allah the Almighty and turn to Him in repentance',
        source:
          '"Whoever makes istighfar constant, Allah will make a way out of every distress." [Abu Dawud 1518]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
        countSource: 'Muslim 2702 / Bukhari 6307',
        count: 70,
      },
      {
        type: 'mindset',
        icon: 'leaf',
        title: 'Clear the spiritual blockage',
        instruction:
          'Stress can be a spiritual signal. Ask yourself: is there something I need to make right with Allah or with another person? Sometimes external pressure is reduced by internal cleansing.',
        source: "Tafsir al-Sa'di on 8:33",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'water-drop',
        title: 'Make wudu with intention',
        instruction:
          'Perform wudu slowly and mindfully. The Prophet ﷺ said sins fall away with the water. Physically wash away the spiritual weight that may be contributing to your stress.',
        source: '"When a Muslim performs wudu, his sins fall away with the water." [Muslim 244]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'How does cleaning your slate with Allah reduce your external pressure?',
  },
  {
    id: 'q_angle_35_35_stressed',
    contentId: 'quran_35_35',
    mood: 'Overwhelmed',
    angle:
      'Allah says about the people of Paradise: "No fatigue will touch them therein, nor from it will they ever be removed." Ibn Kathir explains that the Hereafter is described as a place of zero fatigue—no stress, no exhaustion, no deadlines, no anxiety. Al-Sa\'di adds that reflecting on this eternal relief puts temporary worldly stress into perspective: your current struggle is measured in days, but the rest that awaits is measured in eternity. The Prophet ﷺ said: "The most tested people are the prophets, then the next best, then the next best." [At-Tirmidhi 2398] Your weariness now is the price of eternal ease. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'ponder the absolute relief of the Hereafter where no stress exists',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'sunrise',
        title: 'Reflect on eternal rest',
        instruction:
          'Close your eyes for 30 seconds. ponder a place with zero fatigue, zero deadlines, zero anxiety — that is Jannah, and it is real, and it is waiting for you. Your current stress is measured in days; that relief is measured in eternity.',
        source: 'Surah Fatir 35:35 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for Jannah',
        instruction: 'Ask Allah for the ultimate relief — Paradise.',
        arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ',
        transliteration: "Allahumma inni as'alukal-Jannah wa a'udhu bika minan-Nar",
        translation: 'O Allah, I ask You for Paradise and I seek refuge in You from the Fire',
        source:
          '"Whoever asks Allah for Paradise three times, Paradise says: O Allah, admit him." [Tirmidhi 2572]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'physical',
        icon: 'calm-face',
        title: 'Rest as worship',
        instruction:
          'Take a 15-minute break right now. Napping was a sunnah of the Prophet ﷺ (qaylulah). Rest is not laziness — it is preparation for worship and productivity.',
        source: '"Take a nap, for the shayateen do not nap." [Tabarani, Hasan]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: "How does the promise of eternal peace help you manage today's load?",
  },
  {
    id: 'q_angle_3_17_tired_angle',
    contentId: 'quran_2_177',
    mood: 'Overwhelmed',
    angle:
      'Allah describes the righteous as "the patient, the true, the obedient, those who spend, and those who seek forgiveness before dawn." Ibn Kathir explains that patience (sabr) during exhaustion is listed among the highest qualities of the righteous. Al-Sa\'di adds that patience when tired is especially meritorious because it requires fighting against the natural desire to give up. The Prophet ﷺ said: "The most beloved of deeds to Allah are those that are consistent, even if they are small." [Sahih Bukhari 6464] Small, steady acts during fatigue are worth more than grand gestures in comfort. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Be gentle with yourself today, acknowledging your effort is worship',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'leaf',
        title: 'Small is beloved',
        instruction:
          "The Prophet ﷺ said the most beloved deeds to Allah are those that are consistent, even if small. You don't need to do everything today. One small sincere act while exhausted is worth more than a grand gesture in comfort.",
        source: 'Sahih Bukhari 6464',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Istighfar before dawn',
        instruction:
          'The righteous are described as "those who seek forgiveness before dawn." Say "Astaghfirullah" right now as an act of worship even in your tiredness.',
        arabicText: 'أَسْتَغْفِرُ اللَّهَ',
        transliteration: 'Astaghfirullah',
        translation: 'I seek forgiveness from Allah',
        source: 'Surah Al-Imran 3:17 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Be gentle with yourself',
        instruction:
          'If you are too tired for extra worship, just sit and make dua. The Prophet ﷺ said: "Make things easy and do not make them difficult." [Bukhari 6125] Your exhaustion is itself being rewarded if met with patience.',
        source:
          '"No fatigue, disease, or distress befalls a Muslim except that Allah expiates sins for it." [Bukhari 5641]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'How is physical exhaustion a path to spiritual refinement?',
  },
  {
    id: 'q_angle_50_16_anxious_angle',
    contentId: 'quran_50_16',
    mood: 'Overwhelmed',
    angle:
      'Allah says: "We are closer to him than his jugular vein." Ibn Kathir explains that this closeness is through divine knowledge—Allah knows the whispers of your soul, the fears you haven\'t named, and the anxieties you can\'t articulate. Al-Qurtubi adds that the jugular vein was specifically chosen because it is the most internal and vital vessel, yet Allah\'s awareness surpasses even that intimacy. The Prophet ﷺ said: "No fatigue, disease, sorrow, sadness, or distress befalls a Muslim, even the prick of a thorn, except that Allah expiates sins for it." [Sahih Bukhari 5641] Your closest struggles are His closest concern. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Acknowledge that Allah knows your fear better than you do',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'heart',
        title: 'Closer than your jugular vein',
        instruction:
          'Place your hand on your neck. Feel your pulse. Allah is closer to you than that vein. He knows the whispers of your soul, the fears you have not named, the anxieties you cannot articulate. You are never unseen.',
        source: 'Surah Qaf 50:16 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Whisper to the Closest One',
        instruction: 'Make dua in a whisper — He is so close that even a whisper reaches Him.',
        arabicText: 'رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنتَ خَيْرُ الْوَارِثِينَ',
        transliteration: 'Rabbi la tadharnee fardan wa anta khayrul-waritheen',
        translation: 'My Lord, do not leave me alone, and You are the best of inheritors',
        source: 'Surah Al-Anbiya 21:89 — Dua of Zakariyya (AS)',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Lengthen your sujud',
        instruction:
          'In your next prayer, stay in sujud extra long. The Prophet ﷺ said: "The closest a servant is to his Lord is when he is in sujud." If He is already closer than your jugular vein, ponder how close He is in prostration.',
        source:
          '"The closest a servant is to his Lord is in sujud, so increase your dua." [Muslim 482]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'If He is this close, can anything ever truly be "too much"?',
  },
  {
    id: 'q_angle_3_173_stressed_angle',
    contentId: 'quran_3_173',
    mood: 'Overwhelmed',
    angle:
      'The believers declared: "Sufficient for us is Allah, and He is the best Disposer of affairs." Ibn Kathir narrates that Ibrahim (AS) said these words when thrown into fire, and the Prophet ﷺ said them when told the armies had gathered against him. Al-Sa\'di explains that "ni\'ma al-wakil" (the best Disposer) means Allah handles your affairs better than you ever could—and the proof is that both Ibrahim and Muhammad ﷺ were saved after saying these words. The Prophet ﷺ said: "If you relied on Allah as He should be relied upon, He would provide for you as He provides for the birds." [At-Tirmidhi 2344] Hand your heaviest load to the strongest Carrier. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Declare "Hasbunallahu wa ni\'mal-wakil" over your biggest stressor',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Declare over your stressor',
        instruction:
          'Name your biggest stressor right now. Then say "Hasbunallahu wa ni\'mal-wakil" multiple times, directing it specifically at that problem.',
        arabicText: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
        transliteration: "Hasbunallahu wa ni'mal-wakil",
        translation: 'Sufficient for us is Allah, and He is the best Disposer of affairs',
        source: 'Sahih Bukhari 4563',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'bird',
        title: 'Trust like the birds',
        instruction:
          'The Prophet ﷺ said: "If you relied on Allah as He should be relied upon, He would provide for you as He provides for the birds — they go out hungry in the morning and return full in the evening." The birds don\'t hoard or panic. They take action and trust.',
        source: 'Sunan at-Tirmidhi 2344 — Sahih',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'physical',
        icon: 'pen',
        title: 'Hand over your list',
        instruction:
          'Write down your top 3 stressors on paper. Then write "Hasbiyallah" (Allah is sufficient for me) next to each one. Physically fold the paper and put it away — symbolizing that you have handed them to the Best Disposer.',
        source: "Tafsir al-Sa'di on 3:173",
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'If the Best Disposer is in charge, why do I still carry the stress?',
  },
  {
    id: 'q_angle_6_17_stressed',
    contentId: 'quran_6_17',
    mood: 'Overwhelmed',
    angle:
      'Allah says: "And if Allah should touch you with adversity, there is no remover of it except Him." Ibn Kathir explains that this verse establishes a foundational truth: only Allah has the power to remove hardship. Al-Sa\'di adds that this is not a limitation but a liberation—it means you only need to ask One source for help, and that source is the most powerful being in existence. The Prophet ﷺ used to make dua: "O Allah, there is no ease except what You make easy, and You can make difficulty easy if You wish." [Ibn Hibban] When stress feels immovable, remember: the Remover of hardship is just one sincere dua away. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Ask the "Lifter of Hardship" (Al-Kashif) to remove your stress',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for ease',
        instruction: "Recite the Prophet's ﷺ powerful dua asking Allah to make difficulty easy.",
        arabicText:
          'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا',
        transliteration:
          "Allahumma la sahla illa ma ja'altahu sahla, wa anta taj'alul-hazna idha shi'ta sahla",
        translation:
          'O Allah, nothing is easy except what You make easy, and You can make difficulty easy if You wish',
        source: 'Ibn Hibban — Sahih',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'lock',
        title: 'Only One door to knock',
        instruction:
          'This is liberation, not limitation: you only need ONE source of help, and that source is the most powerful being in existence. Stop knocking on doors that cannot help you. Knock on the only door that can.',
        source: "Tafsir al-Sa'di on 6:17",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Pray Salat al-Hajah',
        instruction:
          "Pray two rak'ahs of Salat al-Hajah (prayer of need). In your sujud, pour out your specific need to the only One who can remove it.",
        source:
          '"Whenever a matter distressed him, the Prophet ﷺ would rush to prayer." [Abu Dawud 1319]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How does it feel to know that no one can prevent the good He intends for you?',
  },
  {
    id: 'q_angle_7_188_stressed',
    contentId: 'quran_7_188',
    mood: 'Overwhelmed',
    angle:
      'The Prophet ﷺ was commanded to say: "I do not possess for myself any harm or benefit except what Allah wills." Ibn Kathir explains that even the Prophet ﷺ—the most honored creation—declared he had no power over his own affairs without Allah\'s permission. Al-Qurtubi adds that this acknowledgment is the essence of true humility: recognizing that control belongs entirely to Allah frees you from the impossible burden of trying to manage everything. The Prophet ﷺ said: "Be mindful of Allah and you will find Him before you. If you ask, ask from Allah. If you seek help, seek help from Allah." [At-Tirmidhi 2516] Admitting your dependence is the beginning of real strength. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Release your grip on the outcome and admit your need for His help',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'bird',
        title: 'You were never in control',
        instruction:
          "Even the Prophet ﷺ — the most honored creation — said he had no power over his own affairs without Allah's permission. The illusion of control is what causes your stress. Letting go of what was never yours to carry is not weakness — it is the beginning of real strength.",
        source: 'Tafsir al-Qurtubi on 7:188',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Ask only from Allah',
        instruction:
          'Make a sincere dua asking Allah for help with the specific thing stressing you.',
        arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ',
        transliteration: "Allahumma inni as'alukal-'afiyata fid-dunya wal-akhirah",
        translation: 'O Allah, I ask You for well-being in this world and the Hereafter',
        source: 'Ibn Majah 3871 — Sahih',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
      {
        type: 'physical',
        icon: 'shield',
        title: 'Open your palms',
        instruction:
          'Lift your hands in dua. The open palm position is itself a symbol of dependency — you are asking, not demanding. Sit with this posture for a moment and feel the relief of admitting: "I need You, Ya Allah."',
        source:
          '"If you ask, ask from Allah. If you seek help, seek help from Allah." [Tirmidhi 2516]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection:
      "If I don't even control benefit for myself, why do I stress about everything else?",
  },
  {
    id: 'q_angle_42_30_stressed',
    contentId: 'quran_42_30',
    mood: 'Overwhelmed',
    angle:
      'Allah says: "And whatever strikes you of disaster—it is for what your hands have earned; but He pardons much." Ibn Kathir explains that even when difficulty comes as a consequence of our actions, Allah still pardons much of what we deserve—meaning His mercy softens even the trials we bring upon ourselves. Al-Sa\'di adds that "ya\'fu \'an kathir" (He pardons much) means the majority of our mistakes are forgiven without us even realizing it. The Prophet ﷺ said: "If Allah were to punish the inhabitants of His heavens and earth, He would do so without being unjust to them. But if He were to have mercy on them, His mercy would be better for them than their deeds." [Abu Dawud 4699] [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Acknowledge that Allah pardons much, even during stressful times',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'breathing',
        title: 'He pardons much',
        instruction:
          'Whatever you are going through — even if it is a consequence of your own mistakes — know that Allah is already pardoning most of what you deserve. The difficulty you feel is softened by mercy you cannot see.',
        source: "Tafsir al-Sa'di on 42:30",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Sayyid al-Istighfar',
        instruction: 'Recite the master supplication for forgiveness.',
        arabicText:
          'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ',
        transliteration: "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana 'abduk",
        translation:
          'O Allah, You are my Lord, there is no god but You. You created me and I am Your servant',
        source:
          '"Whoever says this during the day with conviction and dies that day, he is from the people of Paradise." [Bukhari 6306]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Gratitude under pressure',
        instruction:
          'List 3 things that are going right even while things are hard. Gratitude during difficulty is the highest form of shukr. The Prophet ﷺ said: "Look at those below you and do not look at those above you."',
        source: 'Sahih Muslim 2963',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'How can I maintain a state of Shukr (gratitude) while under pressure?',
  },
  {
    id: 'q_angle_27_62_stressed',
    contentId: 'quran_27_62',
    mood: 'Overwhelmed',
    angle:
      'Allah asks: "Is He not the One who responds to the desperate one when he calls upon Him and removes evil?" Ibn Kathir explains that "al-mudtarr" (the desperate one) is given a special status—Allah specifically promises to answer those who have reached the end of their rope. Al-Qurtubi adds that this verse is phrased as a rhetorical question, meaning the answer is so obvious it needs no debate: of course Allah responds to the desperate. The Prophet ﷺ said: "The dua of the distressed person is: O Allah, I hope for Your mercy; do not leave me to myself even for the blink of an eye." [Abu Dawud 5090] Desperation is not weakness—it is the key to divine response. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Call out to Allah with the desperation of someone who has no other helper',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua of the desperate',
        instruction: 'Recite the dua of the distressed person with complete sincerity.',
        arabicText: 'اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَىٰ نَفْسِي طَرْفَةَ عَيْنٍ',
        transliteration: "Allahumma rahmataka arju fala takilni ila nafsi tarfata 'ayn",
        translation:
          'O Allah, I hope for Your mercy; do not leave me to myself even for the blink of an eye',
        source: 'Abu Dawud 5090 — Hasan',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'lock',
        title: 'Desperation is the key',
        instruction:
          'Your desperation is not weakness — it is the key that unlocks divine response. Allah specifically promises to answer "al-mudtarr" — the one who has reached the end of their rope. The more helpless you feel, the closer you are to His answer.',
        source: 'Tafsir al-Qurtubi on 27:62',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Cry in sujud',
        instruction:
          'Go into sujud and let yourself be vulnerable. Cry if you need to — tears in dua are a sign of sincerity. Pour out your heart to the One who responds to the desperate.',
        source:
          '"The closest a servant is to his Lord is in sujud, so increase your dua." [Muslim 482]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'When have I felt His direct response in a time of severe stress?',
  },
  {
    id: 'q_angle_21_83_stressed',
    contentId: 'quran_21_83',
    mood: 'Overwhelmed',
    angle:
      'Prophet Ayyub (AS) called out: "Indeed, adversity has touched me, and You are the Most Merciful of the merciful." Ibn Kathir explains that Ayyub\'s dua is a model of perfect etiquette: he acknowledged his suffering without complaining, then appealed to Allah\'s mercy without demanding relief. Al-Sa\'di adds that Allah\'s response was immediate and complete: "So We responded to him and removed what afflicted him of adversity." [21:84] The Prophet ﷺ said: "The dua of my brother Dhun-Nun (Yunus): none who is afflicted supplicates with it except that Allah relieves him." [At-Tirmidhi 3505] The prophets\' prayers are proven prescriptions for relief. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Make the dua of Ayyub (AS): "Anni massaniyad-durru..."',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua of Ayyub (AS)',
        instruction:
          'Recite the exact dua of Ayyub — a prophetic prescription for anyone touched by adversity.',
        arabicText: 'أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ',
        transliteration: 'Anni massaniyad-durru wa anta arhamur-rahimeen',
        translation:
          'Indeed, adversity has touched me, and You are the Most Merciful of the merciful',
        source: 'Surah Al-Anbiya 21:83 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'clock',
        title: "Ayyub's etiquette",
        instruction:
          "Notice Ayyub's perfect adab: he did not complain, he did not demand. He simply stated his condition and appealed to Allah's attribute of mercy. And Allah's response was immediate: \"So We responded to him and removed what afflicted him.\" This is the model.",
        source: "Tafsir al-Sa'di on 21:83-84",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Combine two prophetic duas',
        instruction:
          'In your sujud, recite both the dua of Ayyub and the dua of Yunus: "La ilaha illa anta subhanaka inni kuntu minaz-zalimin." The Prophet ﷺ said none who is afflicted supplicates with Yunus\'s dua except that Allah relieves him.',
        source: 'Sunan at-Tirmidhi 3505 — Sahih',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How does trust in the "Most Merciful" soften the experience of stress?',
  },
  {
    id: 'q_angle_9_51_stressed_angle',
    contentId: 'quran_9_51',
    mood: 'Overwhelmed',
    angle:
      'Allah commands the believers to say: "Never will we be struck except by what Allah has decreed for us; He is our protector." Ibn Kathir explains that this verse is the ultimate antidote to anxiety about the future—everything that reaches you was already written, and nothing that was not written can touch you. Al-Sa\'di adds that "Huwa Mawlana" (He is our protector) means that the same God who wrote the decree is also your guardian through it. The Prophet ﷺ said: "Know that what has passed you by was not going to befall you, and what has befallen you was not going to pass you by." [Abu Dawud 4699] Accepting the decree dissolves the fear of the unknown. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Repeat "Qul lan yusibana illa ma kataballahu lana"',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Declare the decree',
        instruction: 'Repeat this Quranic declaration slowly, directing it at whatever you fear.',
        arabicText: 'قُل لَّن يُصِيبَنَا إِلَّا مَا كَتَبَ اللَّهُ لَنَا هُوَ مَوْلَانَا',
        transliteration: 'Qul lan yusibana illa ma kataballahu lana, Huwa Mawlana',
        translation:
          'Say: Never will we be struck except by what Allah has decreed for us; He is our protector',
        source: 'Surah At-Tawbah 9:51 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'book-quran',
        title: 'Already written',
        instruction:
          'The pens have been lifted and the pages have dried. What was meant to reach you will reach you, and what was not meant for you will never touch you. This is not fatalism — it is freedom from the prison of "what if."',
        source: '"The pens have been lifted and the pages have dried." [Tirmidhi 2516]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: "Pray 2 rak'ahs of tawakkul",
        instruction:
          'Pray two rak\'ahs and in your sujud, say: "Ya Allah, I accept Your decree. Make me content with what You have written for me." Then get up and take the next right step — tawakkul is trust plus action.',
        source: "Tafsir al-Sa'di on 9:51",
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What happens to my stress when I accept that the outcome is already written?',
  },
  {
    id: 'q_angle_48_4_calm_angle',
    contentId: 'quran_48_4',
    mood: 'Calm',
    angle:
      'Allah says: "It is He who sent down tranquility (sakina) into the hearts of the believers that they would increase in faith along with their present faith." Ibn Kathir explains that sakina is a special divine gift—a descending peace that settles the heart during turbulence. Al-Sa\'di adds that sakina came to the believers at Hudaybiyyah when they were frustrated and confused, turning their agitation into calm certainty. The Prophet ﷺ said: "Tranquility descends upon the people of dhikr, mercy covers them, and the angels surround them." [Sahih Muslim 2700] Sakina is not earned by effort alone—it is a gift from the Lord of the heavens and earth. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Ask Allah specifically for "Sakina" (tranquility) to descend on your heart',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Ask for sakina',
        instruction:
          'Say: "Ya Allah, anzil as-sakinata \'ala qalbi" (O Allah, send down tranquility upon my heart). Sakina is a gift — ask for it directly.',
        arabicText: 'اللَّهُمَّ أَنْزِلْ السَّكِينَةَ عَلَى قَلْبِي',
        transliteration: "Allahumma anzil as-sakinata 'ala qalbi",
        translation: 'O Allah, send down tranquility upon my heart',
        source: 'Surah Al-Fath 48:4 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'bird',
        title: 'A descending gift',
        instruction:
          'Sakina is not earned by effort alone — it is sent DOWN by Allah. It came to the believers at Hudaybiyyah when they were frustrated and confused, turning agitation into calm certainty. The same gift is available to you right now.',
        source: "Tafsir al-Sa'di on 48:4",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Dhikr circle of one',
        instruction:
          'Sit in dhikr for 3 minutes. The Prophet ﷺ said tranquility DESCENDS upon the people of dhikr, mercy covers them, and angels surround them. Your private dhikr creates an invisible sanctuary.',
        source: '"Tranquility descends upon the people of dhikr." [Muslim 2700]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'How does it feel to have "armies of the heavens and earth" supporting your peace?',
  },
  {
    id: 'q_angle_30_21_content_angle',
    contentId: 'quran_30_21',
    mood: 'Grateful',
    angle:
      'Allah says: "And of His signs is that He created for you from yourselves mates that you may find tranquility in them, and He placed between you affection and mercy." Ibn Kathir explains that the love and mercy in human relationships are "signs" (ayat) of Allah—evidence of His care woven into the fabric of daily life. Al-Sa\'di adds that recognizing these signs transforms ordinary relationships into sources of spiritual contentment. The Prophet ﷺ said: "The best of you is the best to his family." [At-Tirmidhi 3895] Every moment of warmth, every act of kindness from a loved one, is Allah\'s mercy made visible. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Acknowledge the love in your life as a direct sign of His mercy',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'heart',
        title: 'Love is a sign of Allah',
        instruction:
          'Every moment of warmth from a loved one is Allah\'s mercy made visible. The affection and mercy in your relationships are "signs" (ayat) — evidence of divine care woven into daily life. See them as such.',
        source: "Tafsir al-Sa'di on 30:21",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'chat',
        title: 'Be the best to family',
        instruction:
          'Do one kind act for a family member right now: a message of love, a small gift, a word of encouragement. The Prophet ﷺ said the best of you is the best to his family.',
        source: '"The best of you is the best to his family." [Tirmidhi 3895]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for loved ones',
        instruction: 'Make dua for the people who bring you contentment.',
        arabicText: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ',
        transliteration: "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yun",
        translation: 'Our Lord, grant us from our spouses and offspring comfort to our eyes',
        source: 'Surah Al-Furqan 25:74 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does recognizing these "signs" increase my daily satisfaction?',
  },
  {
    id: 'q_angle_48_18_calm_angle',
    contentId: 'quran_48_18',
    mood: 'Calm',
    angle:
      'Allah says: "Certainly was Allah pleased with the believers when they pledged allegiance to you under the tree, and He knew what was in their hearts, so He sent down tranquility upon them." Ibn Kathir explains that divine pleasure (rida) and tranquility (sakina) are linked—when Allah is pleased with a servant, He grants them inner peace as a sign. Al-Sa\'di adds that "He knew what was in their hearts" means their sincerity was recognized and rewarded with a peace that no external circumstance could shake. The Prophet ﷺ said: "Whoever is pleased with Allah as Lord has tasted the sweetness of faith." [Sahih Muslim 34] Divine pleasure is the deepest source of inner calm. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Reflect on the idea that Allah is pleased with you in this moment of calm',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'heart',
        title: 'He knows your heart',
        instruction:
          'Allah knew what was in the hearts of the believers — their sincerity. He knows YOUR heart too. Your genuine intention, even imperfect, is seen and recognized. His pleasure (rida) is the deepest source of inner calm.',
        source: "Tafsir al-Sa'di on 48:18",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Taste the sweetness',
        instruction:
          'Say: "Raditu billahi Rabban" (I am pleased with Allah as my Lord). The Prophet ﷺ said whoever says this has tasted the sweetness of faith.',
        arabicText: 'رَضِيتُ بِاللَّهِ رَبًّا',
        transliteration: 'Raditu billahi Rabba',
        translation: 'I am pleased with Allah as my Lord',
        source:
          '"Whoever is pleased with Allah as Lord has tasted the sweetness of faith." [Muslim 34]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'calm-face',
        title: 'Sit with His pleasure',
        instruction:
          'Sit quietly for 1 minute and reflect on this verse: "Allah was pleased with the believers when they pledged allegiance to you under the tree, and He knew what was in their hearts, so He sent down tranquillity upon them." [Quran 48:18]',
        source: 'Quran 48:18',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What greater source of peace is there than divine pleasure?',
  },
  {
    id: 'q_angle_9_26_calm_angle',
    contentId: 'quran_9_26',
    mood: 'Calm',
    angle:
      'Allah says: "Then Allah sent down His tranquility (sakina) upon His Messenger and upon the believers, and sent down soldiers you did not see." Ibn Kathir explains that at the Battle of Hunayn, when the Muslims were initially overwhelmed, Allah sent sakina—a supernatural calm that turned panic into steadfastness. Al-Qurtubi adds that the "soldiers you did not see" refers to angels sent alongside the sakina, showing that divine peace comes with divine support. The Prophet ﷺ remained calm at Hunayn and called out: "I am the Prophet, no lie; I am the son of Abdul-Muttalib." [Sahih Bukhari 2864] Sakina descends precisely when crisis peaks. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Recall a time you felt unexpectedly calm during a storm',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'star',
        title: 'Unseen soldiers',
        instruction:
          'When sakina descends, it does not come alone — Allah sends "soldiers you did not see" alongside it. Angels. Right now, if you feel calm, it may be because unseen support is surrounding you. Your peace has heavenly backup.',
        source: 'Tafsir al-Qurtubi on 9:26',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Recall unexpected calm',
        instruction:
          'Think of a time you felt unexpectedly calm during a storm. That was sakina. It descends precisely when crisis peaks. The same God who sent it then can send it now — and at any moment you need it.',
        source: 'Sahih Bukhari 2864',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Call on As-Salam',
        instruction:
          'Say "Ya Salam" (O Source of Peace) multiple times. Call on Allah by the Name that IS peace itself.',
        arabicText: 'يَا سَلَامُ',
        transliteration: 'Ya Salam',
        translation: 'O Source of Peace',
        source:
          '"As-Salam is one of the names of Allah placed upon the earth." [Al-Adab Al-Mufrad 989]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How can I prepare my heart to receive His sakina at any moment?',
  },
  {
    id: 'q_angle_8_10_calm',
    contentId: 'quran_8_10',
    mood: 'Calm',
    angle:
      'Allah says: "And Allah made it not except as good tidings for you and to reassure your hearts thereby. And victory is not except from Allah." Ibn Kathir explains that Allah sent support at the Battle of Badr not because the believers were weak, but to give them good news (bushra) and heart-assurance (tuma\'ninah). Al-Sa\'di adds that "victory is only from Allah" means you can release the burden of needing to produce results—your job is effort, and His job is victory. The Prophet ﷺ said: "O Allah, if this small band of believers is destroyed, You will not be worshipped on earth." [Sahih Muslim 1763] He asked, and Allah answered with peace and victory. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Repeat "Ya Salam" (O Source of Peace) and reflect on His help coming to you',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Call on Ya Salam',
        instruction:
          'Say "Ya Salam" multiple times and reflect on Allah\'s help coming to you. He sends support not because you are weak but to reassure your heart and bring you good news.',
        arabicText: 'يَا سَلَامُ يَا مُؤْمِنُ',
        transliteration: "Ya Salam, Ya Mu'min",
        translation: 'O Source of Peace, O Granter of Security',
        source: 'Surah Al-Hashr 59:23 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'trophy',
        title: 'Victory is His job',
        instruction:
          'Your job is effort. His job is victory. Release the burden of needing to produce results. At Badr, the Prophet ﷺ made his dua and trusted — and Allah answered with peace AND victory.',
        source: "Tafsir al-Sa'di on 8:10",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Pray and release',
        instruction:
          "Pray 2 rak'ahs and in your sujud, hand over the outcome of whatever you are working towards. Your effort is worship. The result is from Him.",
        source: '"Victory is not except from Allah." [Quran 8:10]',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does knowing victory is from Allah alone settle your inner heart?',
  },
  {
    id: 'q_angle_9_40_calm',
    contentId: 'quran_9_40',
    mood: 'Calm',
    angle:
      'Allah says: "Do not grieve; indeed Allah is with us. So Allah sent down His tranquility (sakina) upon him." Ibn Kathir narrates that the Prophet ﷺ said these words to Abu Bakr (RA) in the cave of Thawr while the enemy stood at the entrance. Al-Sa\'di explains that the sakina descended not because the danger passed, but while the danger was at its peak—proving that divine peace does not depend on external safety. The Prophet ﷺ was so calm that Abu Bakr\'s fear melted. Imam al-Qurtubi adds: this is the ultimate proof that Allah\'s companionship (ma\'iyyah) transforms any "cave" of difficulty into a sanctuary. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Pause and acknowledge: "Allah is with me" in my current "cave" of difficulty',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'star',
        title: 'Peace before safety',
        instruction:
          'Sakina descended while the enemy stood at the cave entrance — not after the danger passed. Divine peace does not depend on external safety. Whatever your "cave" is right now, Allah\'s companionship transforms it into a sanctuary.',
        source: 'Tafsir Ibn Kathir on 9:40',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Allah is with me',
        instruction:
          'Say what the Prophet ﷺ said to Abu Bakr: "La tahzan, innAllaha ma\'ana" (Do not grieve; indeed Allah is with us). Say it until your heart believes it.',
        arabicText: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا',
        transliteration: "La tahzan innAllaha ma'ana",
        translation: 'Do not grieve; indeed Allah is with us',
        source: 'Surah At-Tawbah 9:40 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'calm-face',
        title: 'Be still in the cave',
        instruction:
          'Find a quiet corner. Sit still for 2 minutes. This is your "cave." Even if the world is at the door, Allah is with you inside. Let His presence settle your heart the way the Prophet ﷺ\'s calm settled Abu Bakr\'s fear.',
        source: 'Tafsir al-Qurtubi on 9:40',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does His presence provide an unshakeable calm despite external threats?',
  },
  {
    id: 'q_angle_17_11_hopeful',
    contentId: 'quran_17_11',
    mood: 'Hopeful',
    angle:
      'Allah says: "Man supplicates for evil as he supplicates for good, and man is ever hasty." Ibn Kathir explains that human beings, in their impatience, sometimes unknowingly ask for what would harm them—wanting things to happen immediately rather than trusting Allah\'s timing. Al-Sa\'di adds that this verse is a gentle reminder: your haste is not wisdom, but Allah\'s delay is always wisdom. The Prophet ﷺ said: "The supplication of every one of you is granted if he does not grow impatient and say: I made dua but it was not answered." [Sahih Bukhari 6340] Patience with divine timing is the truest form of hope. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: "Pause and acknowledge that Allah's timing is more hopeful than mine",
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'clock',
        title: 'His delay is wisdom',
        instruction:
          "Your haste is not wisdom, but Allah's delay ALWAYS is. Sometimes He delays what you want because what He has planned is better. Patience with divine timing is the truest form of hope.",
        source: "Tafsir al-Sa'di on 17:11",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Keep asking with patience',
        instruction:
          'The Prophet ﷺ said your dua IS granted — as long as you do not grow impatient. Keep asking. Do not stop. The answer is coming in a form you may not expect.',
        arabicText: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً',
        transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanah',
        translation: 'Our Lord, give us good in this world and good in the Hereafter',
        source: '"Your dua is granted if you do not grow impatient." [Bukhari 6340]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Pray Istikhara',
        instruction:
          'If you are waiting on something, pray Salat al-Istikhara. Hand the timing to Allah. Say: "If this is good for me, bring it closer. If not, take it away and replace it with what is better."',
        source: 'Sahih Bukhari 1162',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'Why do I sometimes "pray for evil" (in haste) when Allah has better for me?',
  },
  {
    id: 'q_angle_21_90_hopeful',
    contentId: 'quran_21_90',
    mood: 'Hopeful',
    angle:
      'Allah says about the prophets: "Indeed, they used to hasten to good deeds and supplicate Us in hope and fear, and they were to Us humbly submissive." Ibn Kathir explains that the prophets\' dua combined raghab (eager hope) with rahab (reverential awe)—they never prayed with entitlement but always with humility. Al-Sa\'di adds that this balance is essential: hope without fear breeds complacency, while fear without hope breeds despair. The Prophet ﷺ said: "Ask Allah with certainty that He will respond to you." [At-Tirmidhi 3479] The most powerful dua is one made with full hope in Allah\'s generosity and full awareness of His majesty. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Make a dua with both desire (for it) and awe (for Him)',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'target',
        title: 'Hope and awe in balance',
        instruction:
          'Hope without fear breeds complacency. Fear without hope breeds despair. The prophets combined raghab (eager hope) with rahab (reverential awe). This balance is essential — it keeps your heart healthy and your dua powerful.',
        source: "Tafsir al-Sa'di on 21:90",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua with certainty',
        instruction:
          'Make a sincere dua right now with CERTAINTY that Allah will respond. Ask with both desire for what you want and awe of the One you are asking.',
        arabicText: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا',
        transliteration: "Rabbana la tuzigh qulubana ba'da idh hadaytana",
        translation: 'Our Lord, do not let our hearts deviate after You have guided us',
        source: '"Ask Allah with certainty that He will respond." [Tirmidhi 3479]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Hasten to good',
        instruction:
          'The prophets "hastened to good deeds" — they did not just pray, they ACTED. Identify one good deed you can do right now: give sadaqah, help someone, or recite Quran. Combine action with dua.',
        source: 'Surah Al-Anbiya 21:90 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does a balance of hope and awe keep my heart healthy?',
  },
  {
    id: 'q_angle_32_16_hopeful',
    contentId: 'quran_32_16',
    mood: 'Hopeful',
    angle:
      'Allah says: "Their sides part from their beds; they supplicate their Lord in fear and aspiration. And no soul knows what has been hidden for them of comfort of the eye." Ibn Kathir explains that the night-worshippers are rewarded with joys so great that no human mind has conceived them. Al-Sa\'di adds that the reward is described as "hidden" because it surpasses all expectation—matching the hidden nature of their worship. The Prophet ﷺ said: "Allah said: I have prepared for My righteous servants what no eye has seen, no ear has heard, and what has not occurred to the human heart." [Sahih Bukhari 3244] The greatest rewards await the most private devotions. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Perform a secret good deed today that only Allah knows about',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'star',
        title: 'Hidden rewards',
        instruction:
          'Allah has prepared for His righteous servants what no eye has seen, no ear has heard, and what has not occurred to the human heart. The reward is "hidden" because it surpasses ALL expectation — matching the hidden nature of your worship.',
        source: '"What no eye has seen, no ear has heard." [Bukhari 3244]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'moon',
        title: 'Secret good deed',
        instruction:
          'Do one good deed today that only Allah knows about: give anonymous charity, pray secretly, or forgive someone in your heart without telling anyone. Hidden worship earns hidden rewards.',
        source: "Tafsir al-Sa'di on 32:16-17",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Night dua',
        instruction:
          'Set an intention to wake before Fajr and pray. In the stillness of the night, make this dua.',
        arabicText: 'اللَّهُمَّ إِنَّي أَسْأَلُكَ رِضَاكَ وَالْجَنَّةَ',
        transliteration: "Allahumma inni as'aluka ridaka wal-Jannah",
        translation: 'O Allah, I ask You for Your pleasure and Paradise',
        source: 'Surah As-Sajdah 32:16-17 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What "hidden joy" am I most looking forward to in the Hereafter?',
  },
  {
    id: 'q_angle_89_27_calm_angle',
    contentId: 'quran_89_27',
    mood: 'Calm',
    angle:
      'Allah says: "O reassured soul, return to your Lord, well-pleased and pleasing to Him." Ibn Kathir explains that the nafs al-mutma\'innah is the soul that has reached a state of settled peace through unwavering faith. Al-Baghawi adds that "return to your Lord" is spoken with tenderness—it is an invitation home, not a command. The Prophet ﷺ said: "When Allah loves a servant, He tests him. If the servant is patient, He chooses him. And if the servant is content (radi), He selects him." [Musnad Ahmad] The reassured soul is the one that found contentment not in circumstances but in the Lord of all circumstances. [Tafsir al-Baghawi]',
    angleSource: 'Tafsir al-Baghawi',
    action: 'Breathe in the tranquility of the reassured soul',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'home',
        title: 'An invitation home',
        instruction:
          '"Return to your Lord" is spoken with tenderness — it is an invitation home, not a command. The reassured soul finds contentment not in circumstances but in the Lord of all circumstances. You are being called home.',
        source: 'Tafsir al-Baghawi on 89:27-28',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Breathe in tranquility',
        instruction:
          "Take 5 slow, deep breaths. With each inhale, breathe in tranquility. With each exhale, release attachment to circumstances. The nafs al-mutma'innah finds its rest in Allah, not in outcomes.",
        source: 'Tafsir Ibn Kathir on 89:27',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dhikr of the reassured soul',
        instruction:
          'Say "SubhanAllah, Alhamdulillah, Allahu Akbar" 33 times each. This is the dhikr that nurtures the reassured soul and maintains the state of being "well-pleased and pleasing."',
        arabicText: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَاللَّهُ أَكْبَرُ',
        transliteration: 'SubhanAllah, Alhamdulillah, Allahu Akbar',
        translation: 'Glory be to Allah, Praise be to Allah, Allah is the Greatest',
        source: '"When Allah loves a servant, He tests him." [Ahmad]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
        countSource: 'Muslim 597',
        count: 33,
      },
    ]),
    reflection: 'How can I maintain a state of "well-pleasing and pleasing" throughout my day?',
  },

  // === STRESSED ANGLES ===
  {
    id: 'q_angle_94_5_stressed',
    contentId: 'quran_94_5',
    mood: 'Overwhelmed',
    angle:
      'Allah says: "Indeed, with hardship comes ease." Ibn Kathir explains that the Arabic "ma\'a" (with) is critical—it means ease is not merely after hardship but simultaneous with it. Al-Sa\'di adds that the definite article on "al-\'usr" (the hardship) and the indefinite "yusra" (an ease) means one specific hardship is paired with multiple, open-ended eases. The Prophet ﷺ said: "One hardship will never overcome two eases." Umar ibn al-Khattab (RA) understood this linguistic miracle: the hardship is singular and finite, but the ease is plural and limitless. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Identify one small thing that is going right in the middle of your stress',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'target',
        title: 'The math is in your favor',
        instruction:
          "The hardship is singular and definite (al-'usr). The ease is indefinite and plural (yusra). One hardship can NEVER overcome two eases. The math is permanently in your favor.",
        source: "Tafsir al-Sa'di on 94:5-6",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'compass',
        title: 'Find the ease within',
        instruction:
          'Ease is "with" (ma\'a) hardship — not after it. Right now, identify one small thing going right in the middle of your stress. That IS the ease. It is already present, hiding alongside the difficulty.',
        source: 'Tafsir Ibn Kathir on 94:5',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Repeat the promise',
        instruction:
          'Recite "Inna ma\'al-\'usri yusra" (Indeed, with hardship comes ease) and let this divine promise sink into your bones.',
        arabicText: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
        transliteration: "Inna ma'al-'usri yusra",
        translation: 'Indeed, with hardship comes ease',
        source: 'Surah Ash-Sharh 94:6 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'If ease is "with" hardship, where is it hiding in your current situation?',
  },
  {
    id: 'q_angle_2_45_stressed',
    contentId: 'quran_2_45',
    mood: 'Overwhelmed',
    angle:
      'Allah says: "And seek help through patience and prayer, and indeed, it is difficult except for the humbly submissive." Ibn Kathir explains that the "humbly submissive" (khashi\'in) find prayer easy because their hearts are already inclined toward Allah. Al-Qurtubi adds that sabr (patience) is mentioned before salah (prayer) because patience is needed to even begin the act of worship when stressed. The Prophet ﷺ said: "Whenever a matter distressed the Prophet, he would rush to prayer." [Abu Dawud 1319] The twin pillars of patience and prayer create a foundation that no stress can shake. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Take five deep breaths, echoing "Ya Sabur" (O Patient One) with each exhale',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Breathe with Ya Sabur',
        instruction:
          'Take 5 deep breaths. With each exhale, say "Ya Sabur" (O Patient One). Let the divine attribute of patience flow through you with each breath.',
        source: '"Whenever a matter distressed him, he would rush to prayer." [Abu Dawud 1319]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'target',
        title: 'Patience before prayer',
        instruction:
          'Sabr is mentioned BEFORE salah because patience is needed to even begin worship when stressed. The humbly submissive find prayer easy because their hearts are already inclined. Incline your heart first, then pray.',
        source: 'Tafsir al-Qurtubi on 2:45',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for patience',
        instruction:
          'Say: "Allahumma inni as\'aluka as-sabra" (O Allah, I ask You for patience). Then stand for 2 rak\'ahs.',
        arabicText: 'اللَّهُمَّ إِنَّي أَسْأَلُكَ الصَّبْرَ',
        transliteration: "Allahumma inni as'aluka as-sabr",
        translation: 'O Allah, I ask You for patience',
        source: 'Surah Al-Baqarah 2:45 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How can slowing down your pace actually bring you closer to a solution?',
  },
  {
    id: 'q_angle_20_25_stressed',
    contentId: 'quran_20_25',
    mood: 'Overwhelmed',
    angle:
      'Musa (AS) prayed: "My Lord, expand for me my breast" before the enormous task of confronting Pharaoh. Ibn Kathir explains that this dua asks for spiritual spaciousness—the ability to carry heavy responsibilities without breaking. Al-Sa\'di adds that the Prophet ﷺ was also granted this expansion (94:1), confirming it as a dua that Allah loves to answer. The Prophet ﷺ said: "O Allah, I seek refuge in You from anxiety and grief, weakness and laziness." [Sahih Bukhari 6369] When external pressure mounts, asking for internal expansion is the Prophetic response. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Recite the prayer of Musa (AS) slowly multiple times: "Rabbish-rah li sadri..."',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua of Musa (AS)',
        instruction:
          'Recite this dua slowly — a dua Allah loves to answer, made before the most daunting task.',
        arabicText: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
        transliteration: 'Rabbish-rah li sadri, wa yassir li amri',
        translation: 'My Lord, expand my breast and ease my task for me',
        source: 'Surah Ta-Ha 20:25-26 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'light-bulb',
        title: 'Internal expansion',
        instruction:
          'When external pressure mounts, the Prophetic response is not to reduce the load but to ask for INTERNAL expansion. Spiritual spaciousness — the ability to carry heavy responsibilities without breaking.',
        source: "Tafsir al-Sa'di on 20:25",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Refuge from anxiety',
        instruction:
          "Recite the Prophet's ﷺ comprehensive dua for relief from anxiety: \"Allahumma inni a'udhu bika minal-hammi wal-hazan, wal-'ajzi wal-kasal.\"",
        source: 'Sahih Bukhari 6369',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection:
      'What would it feel like for your heart to feel "expanded" despite your heavy task?',
  },
  {
    id: 'q_angle_40_44_stressed',
    contentId: 'quran_40_44',
    mood: 'Overwhelmed',
    angle:
      'The believing man said: "I entrust my affair to Allah. Indeed, Allah is Seeing of His servants." Ibn Kathir explains that this anonymous believer among Pharaoh\'s people demonstrated that tawakkul works even in the most hostile environments. Al-Sa\'di adds that the immediate result of his trust was divine protection: "So Allah protected him from the evils they plotted." [40:45] The Prophet ﷺ said: "Whoever puts his trust in Allah, He will be enough for him." [Quran 65:3] When the outcome feels uncertain, entrust it to the One who already sees the result. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Write down your biggest stressor and then say "I entrust this affair to Allah"',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'pen',
        title: 'Write and entrust',
        instruction:
          'Write down your biggest stressor on paper. Then say "Ufawwidu amri ilallah" over it and fold the paper away. You have physically and spiritually handed it to Allah.',
        source: "Tafsir al-Sa'di on 40:44",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Entrust your affair',
        instruction: 'Say the words of the believing man who survived Pharaoh through trust alone.',
        arabicText: 'أُفَوِّضُ أَمْرِي إِلَى اللَّهِ',
        transliteration: 'Ufawwidu amri ilallah',
        translation: 'I entrust my affair to Allah',
        source: 'Surah Ghafir 40:44 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'shield',
        title: 'Trust triggers protection',
        instruction:
          'The immediate result of the believer\'s trust was: "So Allah PROTECTED him from the evils they plotted." Tawakkul is not passive — it actively triggers divine protection. When you entrust, He protects.',
        source: '"Whoever puts his trust in Allah, He will be enough for him." [Quran 65:3]',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What happens to your stress levels when you release the weight of the result?',
  },

  // === LONELY ANGLES ===
  {
    id: 'q_angle_50_16_lonely',
    contentId: 'quran_50_16',
    mood: 'Sad',
    angle:
      'Allah says: "We are closer to him than his jugular vein." Ibn Kathir explains that this closeness means Allah\'s knowledge penetrates deeper than your own self-awareness—He knows the loneliness you feel, the isolation that weighs on you, and the words you cannot form. Al-Qurtubi adds that the jugular vein was chosen because it is the most intimate vessel in the body; Allah\'s nearness surpasses even that. The Prophet ﷺ said: "Allah says: I am as My servant thinks of Me, and I am with him when he remembers Me." [Sahih Bukhari 7405] You may feel alone, but the One who is closer than your own heartbeat has never left. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action:
      'Sit in silence for 2 minutes, focusing on the feeling of being witnessed by your Creator',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Sit with your Witness',
        instruction:
          'Sit in silence for 2 minutes. Place your hand on your neck and feel your pulse. Allah is closer to you than that vein. You are not alone — you are being witnessed by the Creator at this very moment.',
        source: 'Surah Qaf 50:16 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'heart',
        title: 'Never truly alone',
        instruction:
          "He knows the loneliness you feel, the isolation that weighs on you, the words you cannot form. The jugular vein is the most intimate vessel in your body — yet Allah's nearness surpasses even that. You may feel alone, but you never are.",
        source: 'Tafsir al-Qurtubi on 50:16',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Speak to the Closest One',
        instruction:
          'Whisper a dua right now. He is so close that even a whisper reaches Him. Say: "Ya Allah, I feel alone, but I know You are closer than my own heartbeat."',
        arabicText: 'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ',
        transliteration: 'Wa nahnu aqrabu ilayhi min hablil-warid',
        translation: 'And We are closer to him than his jugular vein',
        source: '"I am with him when he remembers Me." [Bukhari 7405]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: "How does Allah's extreme closeness challenge feelings of isolation?",
  },
  {
    id: 'q_angle_40_60_lonely',
    contentId: 'quran_40_60',
    mood: 'Sad',
    angle:
      'Allah says: "Call upon Me; I will respond to you." Ibn Kathir explains that this is the most direct and personal invitation in the Quran—Allah does not say "perhaps" or "maybe" but guarantees a response. Al-Sa\'di adds that dua is described as the essence of worship because it is the moment of deepest connection between the servant and the Creator. The Prophet ﷺ said: "Your Lord is Generous and Shy; if His servant raises his hands to Him, He is shy to return them empty." [Abu Dawud 1488] In your loneliest moments, this invitation stands: speak to Him, and He will answer. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Call out to Allah with your worries, as if speaking to a most trusted friend',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Call and He answers',
        instruction:
          'Raise your hands and call upon Allah. The verse states: "Call upon Me; I will respond to you." [Quran 40:60]. The Prophet ﷺ also said: "Your Lord is Generous and Ḥayiyy; He is shy to return His servant\'s hands empty when he raises them to Him." [Abu Dawud 1488]',
        arabicText: 'ادْعُونِي أَسْتَجِبْ لَكُمْ',
        transliteration: "Ud'uni astajib lakum",
        translation: 'Call upon Me; I will respond to you',
        source: 'Quran 40:60 / Sunan Abi Dawud 1488',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'chat',
        title: 'Two-way connection',
        instruction:
          'Dua is not a one-way ritual — it is the moment of deepest CONNECTION between you and your Creator. You speak, He listens. He responds, you receive. In your loneliest moment, this two-way line is always open.',
        source: "Tafsir al-Sa'di on 40:60",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Pour out your heart',
        instruction:
          'Go into sujud and speak to Allah like a trusted friend. Tell Him everything — your loneliness, your worries, your hopes. The Prophet ﷺ said: "The closest a servant is to his Lord is in sujud." This is the most intimate position.',
        source: '"The closest a servant is to his Lord is in sujud." [Muslim 482]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection:
      'What changes when you view prayer as a two-way connection rather than a one-way ritual?',
  },

  {
    id: 'q_angle_3_200_energized',
    contentId: 'quran_3_200',
    mood: 'Tired',
    angle:
      'Allah says: "O you who have believed, persevere and endure and remain stationed and fear Allah that you may be successful." Ibn Kathir explains that this verse prescribes a comprehensive formula for success: personal perseverance (sabr), mutual endurance (musabarah), and steadfastness (ribat). Al-Sa\'di adds that "musabarah" means outdoing others in patience—competing in endurance rather than in worldly gain. The Prophet ﷺ said: "The strong believer is better and more beloved to Allah than the weak believer, though there is good in both." [Sahih Muslim 2664] Your energy today is a trust from Allah—use it to strengthen yourself and others. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Help someone else with a task using your current energy',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'handshake',
        title: 'Share your strength',
        instruction:
          'Help someone with a task right now. Your energy is a trust from Allah — use it to strengthen yourself AND others. The strong believer is more beloved to Allah than the weak one.',
        source: '"The strong believer is better and more beloved." [Muslim 2664]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'trophy',
        title: 'Compete in endurance',
        instruction:
          'Musabarah means outdoing others in patience — competing in endurance rather than worldly gain. direct your efforts toward spiritual persistence, not just productivity. That is the formula for true success.',
        source: "Tafsir al-Sa'di on 3:200",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for strength',
        instruction: 'Ask Allah to make your energy a source of benefit.',
        arabicText: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
        transliteration: "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatik",
        translation: 'O Allah, help me to remember You, thank You, and worship You well',
        source: 'Abu Dawud 1522 — Sahih',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How can I double my success by sharing my strength today?',
  },
  {
    id: 'q_angle_9_105_energized',
    contentId: 'quran_9_105',
    mood: 'Tired',
    angle:
      'Allah says: "And say, Do your work, for Allah will see your deeds, and so will His Messenger and the believers." Ibn Kathir explains that this verse establishes that no work goes unwitnessed—Allah sees every effort, every struggle, and every good intention behind your actions. Al-Sa\'di adds that knowing your work is observed by the Highest Audience transforms mundane tasks into acts of worship. The Prophet ﷺ said: "Allah loves that when any of you does something, he does it with excellence (itqan)." [Al-Bayhaqi] When you know the King is watching, every task becomes an opportunity to impress. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Perform your current task with extra excellence (Ihsan)',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'star',
        title: 'The King is watching',
        instruction:
          'No work goes unwitnessed. Allah sees every effort, every struggle, every good intention behind your actions. When you know the King is watching, every task becomes an act of worship. Work with Ihsan (excellence).',
        source: "Tafsir al-Sa'di on 9:105",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'star',
        title: 'Do it with Itqan',
        instruction:
          'Pick your current task and do it with extra excellence (itqan). The Prophet ﷺ said Allah LOVES when you do something with excellence. Transform this mundane moment into worship.',
        source: '"Allah loves when you do something with excellence." [Bayhaqi]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Intention of worship',
        instruction:
          'Before your next task, say "Bismillah" and set the intention that this work is for Allah\'s pleasure. Now it counts as worship.',
        arabicText: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
        transliteration: 'Bismillahir-Rahmanir-Rahim',
        translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
        source: 'Surah At-Tawbah 9:105 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does it change your motivation to know your Lord is watching your work?',
  },
  {
    id: 'q_angle_103_1_3_energized',
    contentId: 'quran_103_1_3',
    mood: 'Tired',
    angle:
      'Allah swears: "By time, indeed mankind is in loss—except for those who believe and do righteous deeds and advise each other to truth and advise each other to patience." Ibn Kathir explains that Allah swears by time itself because it is the most precious and irreplaceable resource. Al-Sa\'di adds that the four conditions for avoiding loss—faith, righteous deeds, mutual truth, and mutual patience—require active investment of time, not passive existence. The Prophet ﷺ said: "Take advantage of five before five: your youth before your old age, your health before your sickness, your wealth before your poverty, your free time before your busyness, and your life before your death." [Al-Hakim] [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Dedicate the next 15 minutes to something with eternal value',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'clock',
        title: 'Time is irreplaceable',
        instruction:
          'Allah swears by time because it is your most precious resource. The 4 conditions to avoid loss: faith, righteous deeds, advising truth, advising patience. Are you investing your time or wasting it?',
        source: "Tafsir al-Sa'di on 103:1-3",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'book-quran',
        title: '15 minutes of eternal value',
        instruction:
          'Dedicate the next 15 minutes to something with eternal value: read Quran, learn a hadith, give sadaqah, or call someone to advise them to patience. This is how you escape the "loss."',
        source: '"Take advantage of five before five." [Al-Hakim]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Advise someone to truth',
        instruction:
          'Send a beneficial Islamic reminder to a friend. This fulfills TWO conditions of Surah Al-Asr: righteous deeds AND advising each other to truth.',
        arabicText: 'وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ',
        transliteration: 'Wa tawasaw bil-haqqi wa tawasaw bis-sabr',
        translation: 'And advise each other to truth and advise each other to patience',
        source: 'Surah Al-Asr 103:3 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'Am I using this burst of energy to build what will truly last?',
  },
  {
    id: 'q_angle_22_77_energized',
    contentId: 'quran_22_77',
    mood: 'Tired',
    angle:
      'Allah says: "O you who have believed, bow and prostrate and worship your Lord and do good—that you may succeed." Ibn Kathir explains that this verse links physical worship (ruku and sujud) with general good deeds (khayr) as the twin engines of success. Al-Qurtubi adds that "do good" (if\'alu al-khayr) is deliberately left open-ended—any positive act counts. The Prophet ﷺ said: "The closest a servant is to his Lord is during prostration, so increase your supplications therein." [Sahih Muslim 482] directing your physical efforts toward worship amplifies both your spiritual and worldly capacity. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Perform a physical act of worship (like prayer) with focus and energy',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Bow and prostrate',
        instruction:
          "Pray 2 rak'ahs with full physical engagement. Feel every ruku and sujud. The Prophet ﷺ said the closest you are to your Lord is in prostration. direct your efforts toward worship.",
        source: '"The closest a servant is to his Lord is in sujud." [Muslim 482]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'target',
        title: 'Any good deed counts',
        instruction:
          '"Do good" is deliberately left open-ended — any positive act counts. Helping someone, smiling, giving charity, even removing harm from a path. Success comes from combining worship with general goodness.',
        source: 'Tafsir al-Qurtubi on 22:77',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua in sujud',
        instruction: 'In your next sujud, make a heartfelt dua for success in both worlds.',
        arabicText:
          'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
        transliteration:
          "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
        translation:
          'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire',
        source: 'Surah Al-Baqarah 2:201 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How can I coordinate my body and soul to achieve true success?',
  },
  {
    id: 'q_angle_18_30_energized',
    contentId: 'quran_18_30',
    mood: 'Tired',
    angle:
      'Allah says: "Indeed, those who have believed and done righteous deeds—indeed, We will not allow to be lost the reward of any who did well in deeds." Ibn Kathir explains that "lan nudi\'a" (We will not allow to be lost) is a divine guarantee with no exceptions—every good deed, no matter how small or unnoticed, is preserved. Al-Sa\'di adds that "ahsana \'amala" (did well) emphasizes quality over quantity: one deed done with sincerity and excellence outweighs many done carelessly. The Prophet ﷺ said: "Allah loves that when any of you does something, he does it with excellence." [Al-Bayhaqi] Your effort is eternally preserved. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: "Complete a task you've been putting off with a spirit of joy",
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'pen',
        title: 'Eternally preserved',
        instruction:
          'Every good deed, no matter how small or unnoticed, is PRESERVED. Allah guarantees: "We will not allow to be lost the reward of any who did well." Your effort is never wasted — it is eternally saved.',
        source: "Tafsir al-Sa'di on 18:30",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'checkmark',
        title: 'Complete with joy',
        instruction:
          'Complete a task you have been putting off — but do it with a spirit of joy, not obligation. Quality over quantity: one deed done with sincerity outweighs many done carelessly.',
        source: '"Allah loves when you do something with excellence." [Bayhaqi]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dedicate your effort',
        instruction:
          'Before starting, say "Bismillah" and dedicate your effort to Allah. Now your work is worship and your reward is eternal.',
        arabicText: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ',
        transliteration: "Bismillah, tawakkaltu 'alallah",
        translation: 'In the name of Allah, I place my trust in Allah',
        source: 'Surah Al-Kahf 18:30 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does knowing the reward is safe make you feel about your effort?',
  },
  {
    id: 'q_angle_28_77_energized',
    contentId: 'quran_28_77',
    mood: 'Tired',
    angle:
      'Allah says: "Seek through what Allah has given you the home of the Hereafter; but do not forget your share of the world. And do good as Allah has done good to you." Ibn Kathir explains that Islam does not demand abandoning worldly pursuits but redirecting them—using your resources, skills, and energy to earn both worldly benefit and eternal reward. Al-Sa\'di adds that "do good as Allah has done good to you" means your generosity and excellence should mirror the generosity Allah has shown you. The Prophet ﷺ said: "The upper hand is better than the lower hand." [Sahih Bukhari 1427] Balanced ambition is the Quranic model for a productive life. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Make an intention for your worldly work to benefit your spiritual path',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'target',
        title: 'Balanced ambition',
        instruction:
          'Islam does not demand abandoning the world — it demands redirecting it. Use your resources, skills, and energy for BOTH worldly benefit AND eternal reward. This is balanced ambition, the Quranic model.',
        source: "Tafsir al-Sa'di on 28:77",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'honey',
        title: 'Give as He gave you',
        instruction:
          'Give something today — money, time, or effort. "Do good as Allah has done good to you." Your generosity should mirror His generosity. The upper hand (the giver) is better than the lower hand.',
        source: '"The upper hand is better than the lower hand." [Bukhari 1427]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Intention for both worlds',
        instruction: 'Make this dua to balance dunya and akhirah.',
        arabicText: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً',
        transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanah',
        translation: 'Our Lord, give us good in this world and good in the Hereafter',
        source: 'Surah Al-Qasas 28:77 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How can I use my current resources to "be good as Allah was good to me"?',
  },
  {
    id: 'q_angle_29_69_energized',
    contentId: 'quran_29_69',
    mood: 'Tired',
    angle:
      'Allah says: "And those who strive for Us—We will surely guide them to Our ways." Ibn Kathir explains that divine guidance is proportional to effort—the more you strive (jihad in the broader sense of exerting effort), the more paths of guidance Allah opens for you. Al-Sa\'di adds that "subulana" (Our ways) is plural, meaning Allah opens multiple paths of guidance, not just one. The Prophet ﷺ said: "Whoever treads a path seeking knowledge, Allah will make easy for him the path to Paradise." [Sahih Muslim 2699] Your effort today is the seed; divine guidance is the harvest that grows from it. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Set a deliberate spiritual goal for your current burst of energy',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'leaf',
        title: 'Effort unlocks guidance',
        instruction:
          'Divine guidance is proportional to effort. The more you strive, the more paths Allah opens. "Our ways" is PLURAL — meaning He opens multiple paths of guidance, not just one. Your effort is the seed; guidance is the harvest.',
        source: "Tafsir al-Sa'di on 29:69",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'book-quran',
        title: 'Tread the path',
        instruction:
          'Set a spiritual goal right now: learn one new verse, read one page of tafsir, or attend one class this week. "Whoever treads a path seeking knowledge, Allah makes easy the path to Paradise."',
        source: '"Whoever treads a path seeking knowledge..." [Muslim 2699]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Ask for guidance',
        instruction: 'Ask Allah to guide you on multiple paths of good.',
        arabicText: 'اللَّهُمَّ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
        transliteration: 'Allahumma-hdinas-siratal-mustaqim',
        translation: 'O Allah, guide us to the straight path',
        source: 'Surah Al-Ankabut 29:69 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How can you dedicate your current strength into "striving in His way"?',
  },
  {
    id: 'q_angle_18_110_energized',
    contentId: 'quran_18_110',
    mood: 'Tired',
    angle:
      'Allah says: "So whoever would hope for the meeting with his Lord—let him do righteous work and not associate in the worship of his Lord anyone." Ibn Kathir explains that this verse defines the two conditions for accepted deeds: sincerity (ikhlas—for Allah alone) and correctness (following the Sunnah). Al-Sa\'di adds that "hoping for the meeting" transforms the concept of death from something feared into something anticipated—a reunion with the Most Merciful. The Prophet ﷺ said: "Whoever loves to meet Allah, Allah loves to meet him." [Sahih Bukhari 6507] Working with the intention of meeting your Lord gives every action eternal significance. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Do one righteous act right now with the sole intention of pleasing Allah',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'heart',
        title: 'Hope for the meeting',
        instruction:
          '"Hoping for the meeting" transforms death from something feared into something anticipated — a reunion with the Most Merciful. The Prophet ﷺ said: whoever loves to meet Allah, Allah loves to meet them. Work today as if preparing for that reunion.',
        source: '"Whoever loves to meet Allah, Allah loves to meet him." [Bukhari 6507]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'One sincere deed',
        instruction:
          "Do one righteous act right now with the SOLE intention of pleasing Allah. Pray 2 rak'ahs, give charity, or help someone. Two conditions: sincerity (for Allah alone) and correctness (following the Sunnah).",
        source: "Tafsir al-Sa'di on 18:110",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Purify your intention',
        instruction:
          'Before your next deed, say: "Allahumma inni a\'malu hadha li-wajhik" (O Allah, I do this for Your Face alone).',
        arabicText: 'اللَّهُمَّ إِنَّي أَعْمَلُ هَذَا لِوَجْهِكَ',
        transliteration: "Allahumma inni a'malu hadha li-wajhik",
        translation: 'O Allah, I do this for Your Face alone',
        source: 'Surah Al-Kahf 18:110 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does the hope of meeting your Lord fuel your current drive?',
  },
  {
    id: 'q_angle_67_2_energized',
    contentId: 'quran_67_2',
    mood: 'Tired',
    angle:
      'Allah says: "He who created death and life to test you as to which of you is best in deed." Ibn Kathir explains that "ahsanu \'amala" (best in deed) refers not to the quantity of deeds but their quality—sincerity, excellence, and conformity to divine guidance. Al-Sa\'di adds that life itself is framed as a test of performance: every moment is an opportunity to demonstrate your best. The Prophet ﷺ said: "Ihsan is to worship Allah as though you see Him, and if you cannot see Him, then He sees you." [Sahih Bukhari 50] The test is not about doing more—it is about doing better. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Pick a task and perform it with the highest level of mastery (Ihsan)',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'pen',
        title: 'Quality over quantity',
        instruction:
          '"Best in deed" means quality, not quantity. One deed done with sincerity and excellence outweighs a thousand done carelessly. The test of life is not "who did more" but "who did BETTER."',
        source: "Tafsir al-Sa'di on 67:2",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'star',
        title: 'Perform with Ihsan',
        instruction:
          'Pick your current task and perform it as if Allah is watching — because He is. Ihsan means excellence. Slow down, pay attention, and do your absolute best. This transforms ordinary work into extraordinary worship.',
        source: '"Ihsan is to worship Allah as though you see Him." [Bukhari 50]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Intention of Ihsan',
        instruction:
          'Say "Bismillah" and set the intention of Ihsan. Every moment is an opportunity to demonstrate your best.',
        arabicText: 'بِسْمِ اللَّهِ',
        transliteration: 'Bismillah',
        translation: 'In the name of Allah',
        source: 'Surah Al-Mulk 67:2 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'If life is a test of "who is best in deed," how are you performing today?',
  },
  {
    id: 'q_angle_99_7_8_energized',
    contentId: 'quran_99_7_8',
    mood: 'Tired',
    angle:
      'Allah says: "So whoever does an atom\'s weight of good will see it." Ibn Kathir explains that nothing is too small to be recorded—even the weight of an atom (dharrah) of good is seen and rewarded by Allah. Al-Qurtubi adds that this verse came as a shock to the companions who thought only major deeds mattered; it revealed that Allah\'s accounting system catches everything. The Prophet ﷺ said: "Do not belittle any good deed, even meeting your brother with a cheerful face." [Sahih Muslim 2626] The smallest good deed, done sincerely, can tip the scales on the Day of Judgment. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Find a "small" good deed (checking on a neighbor, picking up litter) and do it',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'target',
        title: 'Nothing is too small',
        instruction:
          "Even an atom's weight (dharrah) of good is recorded. This shocked the companions who thought only major deeds mattered. Allah's accounting system catches EVERYTHING. No good deed is too small to tip the scales.",
        source: 'Tafsir al-Qurtubi on 99:7-8',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'sunrise',
        title: 'One small good deed',
        instruction:
          'Do one small good deed right now: smile at someone, pick up litter, check on a neighbor, or send a kind message. The Prophet ﷺ said: "Do not belittle any good deed, even meeting your brother with a cheerful face."',
        source: '"Do not belittle any good deed." [Muslim 2626]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dhikr is the lightest deed',
        instruction:
          'Say "SubhanAllah wa bihamdihi" — the lightest deed on the tongue but heaviest on the scales.',
        arabicText: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        transliteration: 'SubhanAllahi wa bihamdihi',
        translation: 'Glory be to Allah and His is the praise',
        source: '"Light on the tongue, heavy on the scales." [Bukhari 6406]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
    ]),
    reflection:
      'How does knowing even an atom\'s weight counts change your definition of "big" effort?',
  },
  {
    id: 'q_angle_94_7_energized',
    contentId: 'quran_94_7',
    mood: 'Tired',
    angle:
      'Allah says: "So when you have finished, then labor hard. And to your Lord direct your longing." Ibn Kathir explains that this verse commands the believer to redirect energy after completing worldly tasks toward worship and devotion. Al-Sa\'di adds that "irghab" (direct your longing) means making Allah the ultimate goal of all your efforts—so that even when you finish one task, your heart longs for His pleasure in the next. The Prophet ﷺ said: "The coolness of my eyes has been placed in prayer." [An-Nasa\'i 3940] When energy is directed toward what lasts, it becomes an investment rather than an expenditure. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Use some of your current energy to perform a task for someone else',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'target',
        title: 'Redirect your longing',
        instruction:
          'When you finish one task, direct your heart toward Allah in the next. "Irghab" means making Allah the ultimate goal of ALL your efforts. Energy directed toward what lasts becomes an investment, not an expenditure.',
        source: "Tafsir al-Sa'di on 94:7-8",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Pray after work',
        instruction:
          "After completing your current task, pray 2 rak'ahs. The Prophet ﷺ said the coolness of his eyes was placed in prayer. Redirect your energy from worldly tasks toward worship.",
        source: '"The coolness of my eyes is in prayer." [Nasa\'i 3940]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Longing for Allah',
        instruction:
          'Say: "Allahumma la \'aysha illa \'ayshul-akhirah" (O Allah, there is no life except the life of the Hereafter). Direct your deepest longing to Him.',
        arabicText: 'اللَّهُمَّ لَا عَيْشَ إِلَّا عَيْشُ الْآخِرَةِ',
        transliteration: "Allahumma la 'aysha illa 'ayshul-akhirah",
        translation: 'O Allah, there is no life except the life of the Hereafter',
        source: 'Sahih Bukhari 2834',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'How does directing your longing to Allah sustain your energy?',
  },
  {
    id: 'q_angle_29_69_hopeful_angle',
    contentId: 'quran_29_69',
    mood: 'Hopeful',
    angle:
      'Allah says: "And those who strive for Us—We will surely guide them to Our ways. And indeed, Allah is with the doers of good." Ibn Kathir explains that the plural "subulana" (Our ways) means that sincere striving opens not just one path but many—guidance in worship, relationships, career, and self-understanding. Al-Sa\'di adds that the closing phrase "Allah is with the doers of good" provides a special divine companionship for those who combine effort with excellence. The Prophet ﷺ said: "Indeed, this religion is easy, and no one will overburden himself in religion except that it will overcome him." [Sahih Bukhari 39] Every sincere effort unlocks new dimensions of guidance. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Trust that your effort today is opening a new door of guidance',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'shield',
        title: 'Multiple paths open',
        instruction:
          '"Our ways" (subulana) is PLURAL. Sincere striving opens not just one path but many — guidance in worship, relationships, career, self-understanding. Every sincere effort unlocks new dimensions of guidance you never expected.',
        source: "Tafsir al-Sa'di on 29:69",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'person',
        title: 'Take one step today',
        instruction:
          'Identify one area where you want guidance and take one concrete step today. This religion is easy — do not overburden yourself. One step with sincerity is enough for Allah to open the door.',
        source: '"This religion is easy." [Bukhari 39]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for guidance',
        instruction: 'Ask Allah to guide you to His ways with this beautiful dua.',
        arabicText: 'اللَّهُمَّ أَرِنَا الْحَقَّ حَقًّا وَارْزُقْنَا اتِّبَاعَهُ',
        transliteration: "Allahumma arina al-haqqa haqqan warzuqna ittiba'ah",
        translation: 'O Allah, show us the truth as truth and grant us its following',
        source: '"Allah is with the doers of good." [Quran 29:69]',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'Which of "Our ways" (subulana) am I most hoping to be guided to?',
  },
  {
    id: 'q_angle_93_1_5_anxious',
    contentId: 'quran_93_1_5',
    mood: 'Overwhelmed',
    angle:
      'Allah swears by the morning brightness and the still night, then declares: "Your Lord has not taken leave of you, nor has He detested you." Ibn Kathir explains that this surah was revealed during a painful gap in revelation when the Prophet ﷺ feared he had been abandoned. Al-Sa\'di adds that the two oaths—by morning light and by night—are themselves the proof: just as dawn always follows darkness, Allah\'s care always follows perceived silence. The Prophet ﷺ was told: what you interpret as absence is actually preparation for something greater. [Tafsir Ibn Kathir]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Recall a time you felt abandoned and realize Allah was there',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'sunrise',
        title: 'Dawn always follows darkness',
        instruction:
          "Allah swears by the morning light and by the night — the oaths are the proof. Just as dawn ALWAYS follows darkness, Allah's care always follows perceived silence. What you interpret as absence is preparation for something greater.",
        source: 'Tafsir Ibn Kathir on 93:1-3',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'pen',
        title: 'List His past care',
        instruction:
          'Write down 3 times you felt abandoned but Allah was actually working behind the scenes. The pattern will emerge: He has NEVER forsaken you. Not once.',
        source: 'Surah Ad-Duha 93:3 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'He has not left you',
        instruction:
          'Repeat this verse until your heart believes it: "Your Lord has not taken leave of you, nor has He detested you."',
        arabicText: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ',
        transliteration: "Ma wadda'aka Rabbuka wa ma qala",
        translation: 'Your Lord has not taken leave of you, nor has He detested you',
        source: 'Surah Ad-Duha 93:3 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does the morning brightness disprove the fears of the dark night?',
  },
  {
    id: 'q_angle_94_1_8_anxious',
    contentId: 'quran_94_1_8',
    mood: 'Overwhelmed',
    angle:
      'Allah says: "Did We not expand for you your breast? And We removed from you your burden, which had weighed upon your back. And raised high for you your repute." Ibn Kathir explains that Allah is reminding the Prophet ﷺ of His past care as proof of future care: He expanded his chest, removed his burden, and elevated his name. Al-Sa\'di adds that this is a rhetorical pattern—Allah recounts His past favors to build confidence for the future. The Prophet ﷺ said: "Whoever Allah wishes good for, He puts him through tribulation." [Sahih Bukhari 5645] If Allah has already carried you through past burdens, He will carry you through this one too. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Physically roll your shoulders and ponder your burden being lifted by Allah',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'muscle',
        title: 'Release the burden',
        instruction:
          'Roll your shoulders slowly. With each roll, consider that Allah lifts a burden from your back. He says: "We REMOVED from you your burden." He has done it before and He will do it again.',
        source: 'Surah Ash-Sharh 94:2-3 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'book-quran',
        title: 'Past care proves future care',
        instruction:
          'Allah recounts His past favors to build your confidence for the future. He expanded your chest, removed your burden, and raised your repute. If He has already carried you through past difficulties, why would He abandon you now?',
        source: "Tafsir al-Sa'di on 94:1-4",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for expansion',
        instruction: "Ask Allah to expand your chest as He expanded the Prophet's.",
        arabicText: 'اللَّهُمَّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
        transliteration: 'Allahumma-shrah li sadri wa yassir li amri',
        translation: 'O Allah, expand my chest and ease my affair',
        source: '"Whoever Allah wishes good for, He puts him through tribulation." [Bukhari 5645]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'If Allah has already raised your repute, why do the opinions of others matter?',
  },
  {
    id: 'q_angle_20_25_28_anxious',
    contentId: 'quran_20_25_28',
    mood: 'Overwhelmed',
    angle:
      'Musa (AS) prayed: "And untie the knot from my tongue that they may understand my speech." Ibn Kathir explains that this dua addresses the fear of miscommunication and the anxiety of not being understood—Musa had a speech impediment yet was tasked with the most important conversation in history. Al-Qurtubi adds that "knots" (uqdah) symbolize any obstacle that blocks your path—whether in speech, thought, or action. The Prophet ﷺ would make specific duas before important matters, showing that seeking divine help for practical challenges is part of the Sunnah. This dua is especially powerful for anyone facing a difficult conversation or decision. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Recite "Wahlul uqdatam-mil-lisani" for any difficult conversation today',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Untie the knot',
        instruction:
          "Recite Musa's dua before any difficult conversation or decision. He had a speech impediment yet delivered the most important message in history — because he asked Allah first.",
        arabicText: 'وَاحْلُلْ عُقْدَةً مِن لِسَانِي يَفْقَهُوا قَوْلِي',
        transliteration: "Wahlul 'uqdatam-mil-lisani yafqahu qawli",
        translation: 'And untie the knot from my tongue that they may understand my speech',
        source: 'Surah Ta-Ha 20:27-28 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'target',
        title: 'Every knot can be untied',
        instruction:
          '"Knots" symbolize any obstacle blocking your path — in speech, thought, or action. Musa asked Allah to untie his, and he went on to defeat Pharaoh. Whatever knot is in your life, the Untier of all knots is listening.',
        source: 'Tafsir al-Qurtubi on 20:27',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Breathe before speaking',
        instruction:
          "Before your next difficult conversation, take 3 slow breaths and recite Musa's dua silently. Then speak. The combination of divine help and calm breathing transforms your ability to communicate.",
        source: 'Tafsir Ibn Kathir on 20:25-28',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'Which "knot" in my life am I most anxious about right now?',
  },
  {
    id: 'q_angle_89_27_30_grateful',
    contentId: 'quran_89_27_30',
    mood: 'Grateful',
    angle:
      'Allah says: "O reassured soul, return to your Lord, well-pleased and pleasing to Him." Ibn Kathir explains that the "nafs al-mutma\'innah" (reassured soul) represents the highest state of inner peace—a soul that has found complete contentment in Allah\'s decree. Al-Sa\'di adds that "well-pleased" (radiyah) means the soul is pleased with Allah, and "pleasing" (mardiyyah) means Allah is pleased with the soul—a mutual satisfaction that is the pinnacle of spiritual achievement. The Prophet ﷺ said: "Taste the sweetness of faith: to love Allah and His Messenger more than anything else." [Sahih Bukhari 16] Gratitude for inner peace is gratitude for the greatest gift. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Thank Allah for the moments of peace He has granted you',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'heart',
        title: 'Mutual satisfaction',
        instruction:
          '"Radiyah" means YOU are pleased with Allah. "Mardiyyah" means Allah is pleased with YOU. This mutual satisfaction is the pinnacle of spiritual achievement. Gratitude for inner peace is gratitude for the greatest gift.',
        source: "Tafsir al-Sa'di on 89:27-28",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Taste the sweetness',
        instruction:
          'Say: "Raditu billahi Rabba" and feel the sweetness of faith that comes from being pleased with Allah as your Lord.',
        arabicText: 'رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا',
        transliteration: 'Raditu billahi Rabba, wa bil-Islami dina',
        translation: 'I am pleased with Allah as my Lord and Islam as my religion',
        source: '"Whoever says this has tasted the sweetness of faith." [Muslim 34]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Sujud of gratitude',
        instruction:
          'Perform a sujud of gratitude for the inner peace Allah has granted you. Thank Him for the calm, the contentment, the reassurance. This is the greatest gift — greater than any worldly blessing.',
        source: 'Tafsir Ibn Kathir on 89:27-30',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How can I live my life as a "returning" that is pleasing to Him?',
  },
  {
    id: 'q_angle_3_135_sad_angle',
    contentId: 'quran_3_135',
    mood: 'Sad',
    angle:
      'Allah says: "And those who, when they commit an immorality or wrong themselves, remember Allah and seek forgiveness for their sins—and who can forgive sins except Allah?" Ibn Kathir explains that this verse contains a powerful rhetorical question: no one but Allah can forgive sins, making Him the only source of spiritual relief. Al-Sa\'di adds that "remembering Allah" after a sin is the first step back—it means the heart has not died. The Prophet ﷺ said: "Every son of Adam sins, and the best of sinners are those who repent." [At-Tirmidhi 2499] The very fact that you feel remorse is a sign that your heart is alive and your Lord is calling you back. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Recall a mistake and find comfort in the fact that only Allah can forgive it',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'heart',
        title: 'Your heart is alive',
        instruction:
          'The fact that you feel remorse is PROOF your heart is alive. A dead heart feels nothing. Your sadness over mistakes is itself a sign that Allah is calling you back. He has not abandoned you.',
        source: "Tafsir al-Sa'di on 3:135",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Seek the Only Forgiver',
        instruction:
          'Who can forgive sins except Allah? No therapist, no friend, no amount of self-punishment. Only He can erase what weighs on you. Say "Astaghfirullah" 70 times.',
        arabicText: 'أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ وَأَتُوبُ إِلَيْهِ',
        transliteration: 'Astaghfirullaha alladhi la ilaha illa Huwa wa atubu ilayh',
        translation:
          'I seek forgiveness from Allah, besides whom there is no god, and I repent to Him',
        source: '"The best of sinners are those who repent." [Tirmidhi 2499]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
        countSource: 'Muslim 2702 / Bukhari 6307',
        count: 70,
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Return in sujud',
        instruction:
          'Go into sujud and say: "Ya Allah, I wronged myself. Forgive me, for none forgives sins but You." Let the weight of guilt fall in prostration. You are not beyond His mercy — you never were.',
        source: 'Surah Al-Imran 3:135 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does it feel to know that your Lord is waiting for you to remember Him?',
  },
  {
    id: 'q_angle_66_8_sad_angle',
    contentId: 'quran_66_8',
    mood: 'Sad',
    angle:
      'Allah says: "O you who have believed, repent to Allah with sincere repentance. Perhaps your Lord will remove from you your misdeeds." Ibn Kathir explains that "tawbah nasuha" (sincere repentance) requires three conditions: genuine regret, immediate cessation of the sin, and a firm resolve not to return to it. Al-Sa\'di adds that the word "perhaps" (\'asa) when used by Allah indicates near-certainty—meaning sincere repentance almost guarantees forgiveness. The Prophet ﷺ said: "The one who repents from sin is like one who has no sin." [Ibn Majah 4250] A new beginning is always one sincere moment away. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: "Make a firm intention to do better tomorrow, trusting in Allah's help",
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'leaf',
        title: 'Like one who has no sin',
        instruction:
          'The Prophet ﷺ said: "The one who repents from sin is like one who has no sin." [Ibn Majah 4250]',
        source: '"The one who repents is like one who has no sin." [Ibn Majah 4250]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Tawbah Nasuha',
        instruction:
          'Make sincere repentance with three conditions: genuine regret, cessation, and firm resolve. Say this dua of tawbah.',
        arabicText: 'اللَّهُمَّ إِنَّي أَتُوبُ إِلَيْكَ فَاقْبَلْ تَوْبَتِي',
        transliteration: 'Allahumma inni atubu ilayka faqbal tawbati',
        translation: 'O Allah, I repent to You, so accept my repentance',
        source: 'Surah At-Tahrim 66:8 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Wudu of renewal',
        instruction:
          "Make wudu with the intention of washing away sins. The Prophet ﷺ said sins fall off with the water. Then pray 2 rak'ahs of repentance. This physical act of purification mirrors your internal renewal.",
        source: '"Sins fall off with wudu water." [Muslim 244]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'What does "sincere" (nasuha) repentance mean for my peace of mind?',
  },
  {
    id: 'q_angle_2_148_energized',
    contentId: 'quran_2_148',
    mood: 'Tired',
    angle:
      'Allah says: "For each nation is a direction toward which it faces. So race to all that is good." Ibn Kathir explains that "fastabiqul khayrat" (race to good deeds) is a divine command to compete in righteousness rather than in worldly gains. Al-Sa\'di adds that the urgency of "racing" implies that good deeds have a limited window—health, energy, and opportunity do not last forever. The Prophet ﷺ said: "Take advantage of five before five: your youth before your old age, your health before your sickness." [Al-Hakim] When you have energy, do not delay—race toward what earns eternal reward. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Identify a good deed and do it immediately, without delay',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'person',
        title: "Race, don't walk",
        instruction:
          'Good deeds have a limited window — health, energy, and opportunity do not last forever. The command is not "walk toward good" but "RACE." When you have energy, do not delay.',
        source: "Tafsir al-Sa'di on 2:148",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'flame',
        title: 'Do it NOW',
        instruction:
          'Identify one good deed and do it immediately, without delay: give charity, help someone, read Quran, or pray nafl. The Prophet ﷺ said: "Take advantage of five before five."',
        source: '"Take advantage of five before five." [Al-Hakim]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Compete in khayr',
        instruction:
          'Say "Bismillah" and set the intention to race toward good. The word is "fastabiqul khayrat" — compete in goodness.',
        arabicText: 'فَاسْتَبِقُوا الْخَيْرَاتِ',
        transliteration: 'Fastabiqul-khayrat',
        translation: 'Race to all that is good',
        source: 'Surah Al-Baqarah 2:148 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does it feel to "race" toward goodness using your current strength?',
  },
  {
    id: 'q_angle_5_48_energized',
    contentId: 'quran_5_48',
    mood: 'Tired',
    angle:
      'Allah says: "For each We have appointed a divine law and a traced-out way. Had Allah willed, He could have made you one community, but that He may test you in what He has given you; so compete with one another in good deeds." Ibn Kathir explains that diversity among people is intentional—and the response to it should be competition in goodness, not conflict. Al-Sa\'di adds that "competition in good" (istibaq fil-khayrat) means using your unique gifts and circumstances to maximize positive impact. The Prophet ﷺ said: "The best of people are those most beneficial to people." [Al-Mu\'jam al-Awsat] Your unique position is your unique opportunity to do good. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Find a way to contribute to a positive cause today',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'globe',
        title: 'Your unique opportunity',
        instruction:
          'Diversity among people is intentional — and the response should be competition in goodness, not conflict. Your unique gifts, circumstances, and position are YOUR unique opportunity to maximize positive impact.',
        source: "Tafsir al-Sa'di on 5:48",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'handshake',
        title: 'Be the most beneficial',
        instruction:
          'The Prophet ﷺ said the best of people are those most beneficial to people. Find one way to contribute to a positive cause today: volunteer, donate, mentor, or simply help someone.',
        source: '"The best of people are the most beneficial to people." [Tabarani]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Intention of benefit',
        instruction:
          'Say: "Allahumma-j\'alni nafian lin-nas" (O Allah, make me beneficial to people).',
        arabicText: 'اللَّهُمَّ اجْعَلْنِي نَافِعًا لِلنَّاسِ',
        transliteration: "Allahumma-j'alni nafi'an lin-nas",
        translation: 'O Allah, make me beneficial to people',
        source: "Surah Al-Ma'idah 5:48 — Quran",
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How can I maintain a spirit of "vying for good" in my daily life?',
  },
  {
    id: 'q_angle_30_4_hopeful',
    contentId: 'quran_30_4',
    mood: 'Hopeful',
    angle:
      'Allah says: "Within a few years. To Allah belongs the command before and after. And that day the believers will rejoice in the victory of Allah." Ibn Kathir explains that this verse promised the believers that the Romans would defeat the Persians—and it happened exactly as predicted, proving that Allah\'s promises always come true, even if the timing is beyond our understanding. Al-Sa\'di adds that "the believers will rejoice" shows that Allah plans moments of joy specifically for His servants. The Prophet ﷺ said: "Amazing is the affair of the believer, for his affairs are all good." [Sahih Muslim 2999] If Allah promised victory to believers of old, the same promise extends to you. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Trust that relief is nearing, just as promised to the believers of old',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'trophy',
        title: 'His promises come true',
        instruction:
          'Allah promised the Romans would win "within a few years" — and it happened exactly as predicted. His promises ALWAYS come true, even when the timing is beyond your understanding. Your victory is also being arranged.',
        source: "Tafsir al-Sa'di on 30:4-5",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Ask for victory',
        instruction:
          'Say: "Ya Allah, grant me victory as You promised the believers." Trust that your moment of rejoicing is being planned.',
        arabicText: 'اللَّهُمَّ انْصُرْنِي كَمَا وَعَدْتَ الْمُؤْمِنِينَ',
        transliteration: "Allahumma-nsurni kama wa'adtal-mu'minin",
        translation: 'O Allah, grant me victory as You promised the believers',
        source: 'Surah Ar-Rum 30:4-5 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'sunrise',
        title: 'Rejoice in advance',
        instruction:
          'Smile right now. The believers REJOICED in the victory of Allah — and you can too, even before your victory arrives. Trusting His promise is itself an act of worship.',
        source: '"Amazing is the affair of the believer." [Muslim 2999]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'How does knowing "victory belongs to Allah" keep my hope alive?',
  },
  {
    id: 'q_angle_3_170_grateful',
    contentId: 'quran_3_170',
    mood: 'Grateful',
    angle:
      'Allah says: "Rejoicing in what Allah has bestowed upon them of His bounty, and they receive good tidings about those after them who have not yet joined them—that there will be no fear concerning them, nor will they grieve." Ibn Kathir explains that the martyrs in Paradise are so immersed in joy that they wish to send good news back to the living. Al-Sa\'di adds that this verse shows gratitude is not just a response to blessings—it is itself a source of continued joy and expanding bounty. The Prophet ﷺ said: "When Allah loves a servant, He calls Jibril and says: I love so-and-so, so love him." [Sahih Bukhari 3209] Rejoicing in divine bounty attracts more of it. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Smile and thank Allah for the specific bounty He gave you today',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'sunrise',
        title: 'Smile with gratitude',
        instruction:
          'Smile right now and thank Allah for one specific bounty He gave you today. Rejoicing in divine bounty is not just a response — it is itself a source of continued joy and expanding bounty.',
        source: "Tafsir al-Sa'di on 3:170",
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'heart',
        title: 'When Allah loves you',
        instruction:
          'When Allah loves a servant, He calls Jibril and says: "I love so-and-so, so love him." Then Jibril calls to the inhabitants of heaven. Then love is placed for that person on earth. Your gratitude may be a sign of that love.',
        source: '"When Allah loves a servant..." [Bukhari 3209]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Alhamdulillah with presence',
        instruction:
          'Say "Alhamdulillah" while naming a specific blessing. Gratitude with specificity is more powerful than general thankfulness.',
        arabicText: 'الْحَمْدُ لِلَّهِ عَلَى كُلِّ حَالٍ',
        transliteration: "Alhamdulillahi 'ala kulli hal",
        translation: 'All praise is for Allah in every condition',
        source: 'Surah Al-Imran 3:170 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What would it feel like to receive joyful news from the Hereafter?',
  },
  {
    id: 'q_angle_65_2_hopeful',
    contentId: 'quran_65_2',
    mood: 'Hopeful',
    angle:
      'Allah says: "And whoever fears Allah—He will make for him a way out. And will provide for him from where he does not expect." Ibn Kathir explains that taqwa (God-consciousness) is the key that unlocks unexpected doors—both in provision and in escape from difficulty. Al-Sa\'di adds that "from where he does not expect" means the relief will come from a direction you never anticipated, reinforcing that you cannot plan your way out—only Allah can. The Prophet ﷺ said: "If you relied on Allah as He should be relied upon, He would provide for you as He provides for the birds: they go out hungry in the morning and return full in the evening." [At-Tirmidhi 2344] Hope is trusting the Unseen Provider. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Say "Hasbunallahu wa ni\'mal-wakil" and expect a way out',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'lock',
        title: 'Taqwa is the key',
        instruction:
          'Taqwa (God-consciousness) is the key that unlocks unexpected doors. The relief will come from a direction you never anticipated. You cannot plan your way out — only Allah can. Trust the Unseen Provider.',
        source: "Tafsir al-Sa'di on 65:2-3",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Expect a way out',
        instruction: 'Say "Hasbunallahu wa ni\'mal-wakil" and EXPECT a way out. Allah promised it.',
        arabicText: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَهُ مَخْرَجًا',
        transliteration: "Wa man yattaqillaha yaj'al lahu makhraja",
        translation: 'And whoever fears Allah, He will make for him a way out',
        source: 'Surah At-Talaq 65:2 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'bird',
        title: 'Trust like the birds',
        instruction:
          'The birds go out hungry in the morning and return full in the evening. They do not hoard or panic. Take one step of action today and trust Allah with the provision. He will provide from where you do not expect.',
        source: '"He would provide for you as the birds." [Tirmidhi 2344]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'Where is the "way out" that I am currently hoping for?',
  },
  {
    id: 'q_angle_2_216_sad',
    contentId: 'quran_2_216',
    mood: 'Sad',
    angle:
      'Allah says: "Perhaps you hate a thing and it is good for you; and perhaps you love a thing and it is bad for you. And Allah knows, while you do not know." Ibn Kathir explains that this verse establishes a profound principle: human perception of good and bad is limited, but Allah\'s knowledge encompasses all outcomes. Al-Qurtubi adds that many of the companions experienced losses that later turned into blessings they could never have predicted. The Prophet ﷺ said: "Amazing is the affair of the believer, for his affairs are all good. If something good happens, he is thankful, and that is good for him. If something bad happens, he is patient, and that is good for him." [Sahih Muslim 2999] What feels like a wound may be the door to healing. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Acknowledge your limited knowledge compared to His infinite wisdom',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'brain',
        title: 'You see one piece',
        instruction:
          'You see one piece of the puzzle. Allah sees the entire picture. What feels like a wound may be the door to healing. Many companions experienced losses that later turned into blessings they never predicted. Your story is still unfolding.',
        source: 'Tafsir al-Qurtubi on 2:216',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Trust His knowledge',
        instruction:
          'Say: "Qadarallahu wa ma sha\'a fa\'al" — the words the Prophet ﷺ taught for accepting what has happened.',
        arabicText: 'قَدَرَ اللَّهُ وَمَا شَاءَ فَعَلَ',
        transliteration: "Qadarallahu wa ma sha'a fa'al",
        translation: 'Allah has decreed, and what He willed He has done',
        source: '"Amazing is the affair of the believer." [Muslim 2999]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'pen',
        title: 'Hidden blessings list',
        instruction:
          'Write down one painful experience from your past that later revealed a hidden blessing. Now trust that your current sadness may contain the same pattern. He knows, and you do not know.',
        source: 'Surah Al-Baqarah 2:216 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does letting go of "understanding" bring peace to my sadness?',
  },
  {
    id: 'q_angle_94_6_hopeful',
    contentId: 'quran_94_6',
    mood: 'Hopeful',
    angle:
      'Allah says: "Indeed, with hardship comes ease. Indeed, with hardship comes ease." Ibn Kathir explains that the repetition is deliberate and meaningful—it is a double divine guarantee that ease will accompany every hardship. Al-Sa\'di adds the famous linguistic insight: the Arabic uses the definite article for "the hardship" (al-\'usr) both times, meaning it is the same single hardship, but uses the indefinite for "ease" (yusra), meaning a new ease each time. One hardship cannot defeat two eases. The Prophet ﷺ said: "Know that victory comes with patience, relief comes with affliction, and with hardship comes ease." [Musnad Ahmad] The promise is doubled for your heart\'s assurance. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Repeat "Inna ma\'al-usri yusra" until your heart feels it',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'rewind',
        title: 'A double guarantee',
        instruction:
          'Allah repeated this promise TWICE — a double divine guarantee. The Arabic reveals: "the hardship" (al-\'usr) is the same single hardship both times, but "ease" (yusra) is indefinite — meaning a NEW ease each time. One hardship cannot defeat two eases.',
        source: "Tafsir al-Sa'di on 94:5-6",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Repeat until you feel it',
        instruction:
          'Say "Inna ma\'al-\'usri yusra" until your heart feels it. This is a promise from the Creator. Repeat it as many times as you need.',
        arabicText: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
        transliteration: "Inna ma'al-'usri yusra",
        translation: 'Indeed, with hardship comes ease',
        source: 'Surah Ash-Sharh 94:6 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'calm-face',
        title: 'Feel the ease arriving',
        instruction:
          'Close your eyes for 30 seconds. With each breath, feel the ease that is already present alongside your hardship. It is not coming later — it is here now, hiding within the difficulty.',
        source: '"Victory comes with patience, relief with affliction." [Ahmad]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'Why did Allah repeat this promise twice for us?',
  },
  {
    id: 'q_angle_3_26_hopeful',
    contentId: 'quran_3_26',
    mood: 'Hopeful',
    angle:
      'Allah says: "Say, O Allah, Owner of Sovereignty, You give sovereignty to whom You will and take sovereignty from whom You will. You honor whom You will and humble whom You will. In Your hand is all good." Ibn Kathir explains that this verse establishes Allah as the ultimate decision-maker in all matters of honor, provision, and power. Al-Sa\'di adds that "in Your hand is all good" (bi-yadika al-khayr) means that even when circumstances appear negative, the good is still in His hand—He is arranging it in ways beyond our perception. The Prophet ﷺ said: "O Turner of hearts, make my heart firm upon Your religion." [At-Tirmidhi 2140] All good, past and future, is held by the most capable Hands. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Ask the Owner of Sovereignty to grant you what is best',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Call on the Owner',
        instruction:
          'Recite this verse as a dua, addressing the Owner of all sovereignty directly.',
        arabicText: 'قُلِ اللَّهُمَّ مَالِكَ الْمُلْكِ تُؤْتِي الْمُلْكَ مَن تَشَاءُ',
        transliteration: "Qulillahumma Malikal-Mulki tu'til-mulka man tasha'",
        translation: 'Say: O Allah, Owner of Sovereignty, You give sovereignty to whom You will',
        source: 'Surah Al-Imran 3:26 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'star',
        title: 'All good is in His hand',
        instruction:
          'Even when circumstances appear negative, ALL good is in His hand. He is arranging blessings in ways beyond your perception. The One who controls sovereignty, honor, and provision is working FOR you, not against you.',
        source: "Tafsir al-Sa'di on 3:26",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Ask for steadfastness',
        instruction:
          'Place your hand on your heart and say: "Ya Muqallib al-qulub, thabbit qalbi \'ala dinik" (O Turner of hearts, make my heart firm upon Your religion). This was the Prophet\'s ﷺ most frequent dua.',
        source: '"O Turner of hearts, make my heart firm." [Tirmidhi 2140]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'What does it mean for "all good" to be in His hand for me?',
  },
  {
    id: 'q_angle_18_46_hopeful',
    contentId: 'quran_18_46',
    mood: 'Hopeful',
    angle:
      'Allah says: "Wealth and children are the adornment of the worldly life. But the enduring good deeds (al-baqiyat al-salihat) are better to your Lord for reward and better for hope." Ibn Kathir explains that "al-baqiyat al-salihat" refers to deeds whose reward endures forever—SubhanAllah, Alhamdulillah, La ilaha illallah, and Allahu Akbar. Al-Sa\'di adds that this verse puts worldly success into perspective: wealth and children are temporary adornments, but righteous deeds are the true currency of hope. The Prophet ﷺ said: "The best things a person can say are SubhanAllah, Alhamdulillah, La ilaha illallah, and Allahu Akbar." [Sahih Muslim 2137] Build your hope on what endures. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Do one task with the intention of it being an "enduring good"',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The enduring good deeds',
        instruction:
          'Say "SubhanAllah, Alhamdulillah, La ilaha illallah, Allahu Akbar" 33 times each. These are the al-baqiyat al-salihat — the enduring good deeds whose reward outlasts all worldly wealth.',
        arabicText:
          'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ',
        transliteration: 'SubhanAllah, Alhamdulillah, La ilaha illallah, Allahu Akbar',
        translation:
          'Glory be to Allah, Praise be to Allah, There is no god but Allah, Allah is the Greatest',
        source: '"The best things a person can say." [Muslim 2137]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
        countSource: 'Muslim 597',
        count: 33,
      },
      {
        type: 'mindset',
        icon: 'honey',
        title: 'True currency of hope',
        instruction:
          'Wealth and children are temporary adornments. Righteous deeds are the true currency of hope. Build your hope on what ENDURES — not on what fades. The dhikr you say today will be on your scales forever.',
        source: "Tafsir al-Sa'di on 18:46",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'leaf',
        title: 'Plant an enduring seed',
        instruction:
          'Do one act right now with the intention of it being an "enduring good": teach someone something beneficial, give sadaqah jariyah, or help establish something that outlasts you.',
        source: 'Surah Al-Kahf 18:46 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What legacy of good am I building that is better than worldly wealth?',
  },
  {
    id: 'q_angle_3_17_tired_final_angle',
    contentId: 'quran_2_177',
    mood: 'Overwhelmed',
    angle:
      'Allah describes the righteous as "the patient, the truthful, the devoutly obedient, those who spend in the way of Allah, and those who seek forgiveness before dawn." Ibn Kathir explains that seeking forgiveness in the pre-dawn hours (sahar) is highlighted because it combines the difficulty of waking up with the sincerity of worship when no one is watching. Al-Qurtubi adds that patience is listed first because it is the foundation upon which all other virtues are built—especially when energy is low. The Prophet ﷺ said: "Our Lord descends every night to the lowest heaven and says: Is there anyone who calls upon Me, so that I may answer him?" [Sahih Bukhari 1145] Even small acts of constancy in fatigue earn immense reward. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Choose small, steady acts of worship even when your energy is low',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'crescent',
        title: 'Pre-dawn sincerity',
        instruction:
          'Seeking forgiveness before dawn combines difficulty with sincerity — worship when no one is watching. Patience is the foundation of all other virtues, especially when energy is low. Your small acts during fatigue earn immense reward.',
        source: 'Tafsir al-Qurtubi on 2:177',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Istighfar before dawn',
        instruction:
          'Say "Astaghfirullah" right now. The righteous are described as those who seek forgiveness before dawn. Even this small act counts.',
        arabicText: 'أَسْتَغْفِرُ اللَّهَ',
        transliteration: 'Astaghfirullah',
        translation: 'I seek forgiveness from Allah',
        source: '"Our Lord descends every night to the lowest heaven." [Bukhari 1145]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Small, steady worship',
        instruction:
          'Choose one small act of worship you can do even in your tiredness: make dua in bed, say SubhanAllah 10 times, or simply sit in quiet remembrance. Constancy in fatigue is worth more than grand gestures in comfort.',
        source: '"The most beloved deeds are consistent, even if small." [Bukhari 6464]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'How is my current tiredness an opportunity to demonstrate true constancy?',
  },
  {
    id: 'q_angle_7_199_angry',
    contentId: 'quran_7_199',
    mood: 'Angry',
    angle:
      'Allah says: "Take what is given freely, enjoin what is good, and turn away from the ignorant." Ibn Kathir explains that this verse contains three comprehensive commands: accept people\'s natural imperfections (\'afw), promote good (amr bil-ma\'ruf), and disengage from provocation (i\'rad). Al-Sa\'di adds that "take what is given freely" means accepting people as they are rather than demanding perfection—a key to reducing anger. The Prophet ﷺ said: "Make things easy and do not make them difficult. Give good news and do not drive people away." [Sahih Bukhari 6125] Pardoning is not about the other person—it is about preserving your own inner peace. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Choose to overlook a fault today just for the sake of your own peace',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'breathing',
        title: 'Pardoning protects YOU',
        instruction:
          'Pardoning is not about the other person — it is about preserving YOUR inner peace. "Take what is given freely" means accepting people as they are rather than demanding perfection. Lower your expectations and your anger drops.',
        source: "Tafsir al-Sa'di on 7:199",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'person',
        title: 'Turn away from ignorance',
        instruction:
          'If someone provokes you, physically disengage: walk away, change the subject, or simply stay silent. The verse commands "turn away from the ignorant" — disengagement is divine strategy, not weakness.',
        source: '"Make things easy, not difficult." [Bukhari 6125]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Seek refuge',
        instruction:
          'Say "A\'udhu billahi minash-shaytanir-rajim" when anger rises. The Prophet ﷺ prescribed this specifically for moments of anger.',
        arabicText: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
        transliteration: "A'udhu billahi minash-shaytanir-rajim",
        translation: 'I seek refuge in Allah from the accursed Satan',
        source: "Surah Al-A'raf 7:199-200 — Quran",
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does "taking to pardon" protect your own heart from anger?',
  },
  {
    id: 'q_angle_42_37_angry',
    contentId: 'quran_42_37',
    mood: 'Angry',
    angle:
      'Allah says: "And those who avoid the major sins and immoralities, and when they are angry, they forgive." Ibn Kathir explains that this verse lists forgiveness during anger as a defining quality of the believers of Paradise—right alongside avoiding major sins. Al-Qurtubi adds that forgiving "when angry" (idha hum yaghfurun) is specifically mentioned because forgiving when calm is easy; the true test is forgiving in the heat of the moment. The Prophet ﷺ said: "Whoever suppresses his anger while he is able to act on it, Allah will call him before all creation on the Day of Resurrection and let him choose from the Hur al-Ayn." [At-Tirmidhi 2021] Forgiving while angry is the supreme act of strength. [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir al-Qurtubi',
    action: 'Deliberately choose to forgive someone today when you feel provoked',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'muscle',
        title: 'True strength',
        instruction:
          'Forgiving when calm is easy. The true test is forgiving in the HEAT of the moment. This is listed as a defining quality of the believers of Paradise — right alongside avoiding major sins. Suppressing anger IS the supreme act of strength.',
        source: 'Tafsir al-Qurtubi on 42:37',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Change your state',
        instruction:
          'The Prophet ﷺ said: if you are angry while standing, sit down. If still angry, lie down. Change your physical posture to break the anger cycle.',
        source: '"If angry while standing, sit down." [Abu Dawud 4782]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Forgive for Allah',
        instruction:
          'Think of the person who angered you and say in your heart: "I forgive you for the sake of Allah." Whoever suppresses anger will be called before all creation on the Day of Resurrection.',
        arabicText: 'وَإِذَا مَا غَضِبُوا هُمْ يَغْفِرُونَ',
        transliteration: 'Wa idha ma ghadibu hum yaghfirun',
        translation: 'And when they are angry, they forgive',
        source: '"Whoever suppresses anger... Allah will let him choose." [Tirmidhi 2021]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'What strength does it take to forgive in the heat of a moment?',
  },
  {
    id: 'q_angle_10_58_energized_angle',
    contentId: 'quran_10_58',
    mood: 'Tired',
    angle:
      'Allah says: "Say, In the bounty of Allah and in His mercy—in that let them rejoice; it is better than what they accumulate." Ibn Kathir explains that the "bounty" refers to the Quran and the "mercy" refers to Islam—meaning the greatest source of energy and motivation is spiritual, not material. Al-Sa\'di adds that rejoicing (farah) in divine gifts creates a positive cycle: gratitude generates energy, energy produces good deeds, and good deeds attract more divine favor. The Prophet ﷺ said: "Whoever is given his portion of gentleness has been given his portion of good." [Sahih Muslim 2593] Let the energy of faith fuel your day\'s work. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'direct your efforts toward a task that benefits the community',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'star',
        title: 'Spiritual energy',
        instruction:
          'The greatest source of energy is spiritual, not material. The "bounty" is the Quran and the "mercy" is Islam. Rejoicing in these gifts creates a positive cycle: gratitude → energy → good deeds → more divine favor.',
        source: "Tafsir al-Sa'di on 10:58",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'handshake',
        title: 'Benefit the community',
        instruction:
          'direct your efforts toward a task that benefits others today. Whoever is given their portion of gentleness has been given their portion of good. Be gentle AND productive.',
        source: '"Whoever is given gentleness has been given good." [Muslim 2593]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Rejoice in faith',
        instruction:
          'Say "Alhamdulillah \'ala ni\'matil-Islam" and let the energy of faith fuel your work. This joy is better than anything they accumulate.',
        arabicText: 'قُلْ بِفَضْلِ اللَّهِ وَبِرَحْمَتِهِ فَبِذَلِكَ فَلْيَفْرَحُوا',
        transliteration: 'Qul bifadlillahi wa birahmatihi fabidhaalika falyafrahu',
        translation: 'Say: In the bounty of Allah and His mercy — in that let them rejoice',
        source: 'Surah Yunus 10:58 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: "How does rejoicing in Allah's bounty sustain your drive?",
  },
  // === NEW ANGLES FOR REBALANCED VERSES ===
  {
    id: 'q_angle_25_63_calm',
    contentId: 'quran_25_63',
    mood: 'Calm',
    angle:
      'Scholars like Mujahid and Ibn Kathir explain that "walking easily" (hawnan) refers to dignity (waqar) and tranquility (sakinah). It describes a believer whose inner calmness manifest in a humble and gentle presence. [Tafsir Ibn Kathir]',
    action: 'When provoked today, pause and respond with "Salama" (peace) or silence.',
    actionHowTo: 'Take a deep breath and say "Salam" internally before reacting.',
    actionReward:
      'The Prophet ﷺ said: "The most beloved of people to Allah are those with the best character." [At-Tabarani]',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'person',
        title: 'Walk with dignity',
        instruction:
          'Walk slowly and gently for the next 2 minutes. "Walking easily" (hawnan) refers to dignity and tranquility. Let your inner calm manifest in your physical presence.',
        source: 'Tafsir Ibn Kathir on 25:63',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'calm-face',
        title: 'Calm is a presence',
        instruction:
          "A believer's inner calmness manifests in a humble and gentle presence. You do not need to react to every provocation. Respond with peace or silence — this is the way of the servants of the Most Merciful.",
        source: 'Tafsir Ibn Kathir on 25:63',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'breathing',
        title: 'Respond with Salam',
        instruction:
          'When addressed by the ignorant, the servants of the Most Merciful say "Salama" (peace). Practice this today.',
        arabicText: 'سَلَامًا',
        transliteration: 'Salama',
        translation: 'Peace',
        source: '"The most beloved to Allah are those with the best character." [Tabarani]',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
    ]),
    reflection: 'How does walking easily upon the earth change your posture and presence?',
  },
  {
    id: 'q_angle_25_63_content',
    contentId: 'quran_25_63',
    mood: 'Grateful',
    angle:
      'Al-Hasan al-Basri noted that the servants of the Most Merciful are humble people who do not behave with arrogance even when they are honored. Their contentment is reflected in their gentle dealings with others. [Tafsir al-Baghawi]',
    action: 'Practice responding to a difficulty today with peaceful words.',
    actionHowTo: 'Intentionaly use soft words even if the situation is tense.',
    actionReward:
      'The Prophet ﷺ said: "Gentleness is not in anything except that it beautifies it." [Sahih Muslim 2594]',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'leaf',
        title: 'Humble even when honored',
        instruction:
          'The servants of the Most Merciful do not behave with arrogance even when honored. Their contentment is reflected in gentle dealings. True gratitude produces humility, not pride.',
        source: 'Tafsir al-Baghawi on 25:63',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'heart',
        title: 'Soft words today',
        instruction:
          'Intentionally use soft, peaceful words in every interaction today. Gentleness beautifies everything it touches. Practice responding to one difficulty with peaceful words.',
        source: '"Gentleness beautifies everything." [Muslim 2594]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Alhamdulillah for character',
        instruction:
          'Say "Alhamdulillah" for the character that Allah has placed in your heart. Content people radiate peace.',
        arabicText: 'الْحَمْدُ لِلَّهِ الَّذِي هَدَانَا لِهَذَا',
        transliteration: 'Alhamdulillahilladhi hadana lihadha',
        translation: 'Praise be to Allah who guided us to this',
        source: 'Surah Al-Furqan 25:63 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What inner peace allows one to answer harshness with peace?',
  },
  {
    id: 'q_angle_41_35_angry',
    contentId: 'quran_41_35',
    mood: 'Angry',
    angle:
      'Ibn Abbas explained that Allah commands believers to be patient when angry and to forgive when treated badly. If they do this, Allah protects them from Shaytan and humbles their enemies. [Tafsir Ibn Kathir]',
    action: 'When angry today, seek refuge in Allah and remain silent as the Prophet ﷺ taught.',
    actionHowTo: 'Say "A’udhu billahi minash-shaytanir-rajim" and change your physical posture.',
    actionReward:
      'The Prophet ﷺ said: "The strong man is not the one who can wrestle, but the one who can control himself when he is angry." [Sahih Bukhari 6114]',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Seek refuge immediately',
        instruction:
          "Say \"A'udhu billahi minash-shaytanir-rajim\" the moment anger rises. This is the Prophet's ﷺ prescription for anger — it breaks Shaytan's grip.",
        arabicText: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
        transliteration: "A'udhu billahi minash-shaytanir-rajim",
        translation: 'I seek refuge in Allah from the accursed Satan',
        source: 'Surah Fussilat 41:36 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Change your posture',
        instruction:
          "If standing, sit. If sitting, lie down. Change your physical state to break the anger cycle. Then remain SILENT — silence is the Prophet's ﷺ weapon against regrettable words.",
        source: '"The strong man controls himself when angry." [Bukhari 6114]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'shield',
        title: 'Allah protects the patient',
        instruction:
          'If you are patient when angry and forgive when treated badly, Allah PROTECTS you from Shaytan and humbles your enemies. Your restraint triggers divine protection.',
        source: 'Tafsir Ibn Kathir on 41:35',
        sourceType: 'quran_dua',
      },
    ]),
    reflection:
      'Is this moment an opportunity to earn the "great fortune" of those who control their anger?',
  },
  {
    id: 'q_angle_2_265_energized',
    contentId: 'quran_2_265',
    mood: 'Tired',
    angle:
      'Scholars explain that "seeking the pleasure of Allah" means pure sincerity (Ikhlas). When energy is paired with sincerity, every effort yields multiple rewards, like a garden on a height. [Tafsir al-Jalalayn]',
    action: 'direct your efforts toward an act of charity or service with pure intention.',
    actionHowTo: 'Renew your intention (Niyyah) specifically for Allah before starting the task.',
    actionReward:
      'The Prophet ﷺ said: "Allah is pure and accepts only what is pure." [Sahih Muslim 1015]',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'leaf',
        title: 'A garden on a height',
        instruction:
          'When energy is paired with sincerity, every effort yields multiple rewards — like a garden on a height that receives double rainfall. Renew your intention for Allah and watch your efforts multiply.',
        source: 'Tafsir al-Jalalayn on 2:265',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Charity with sincerity',
        instruction:
          'direct your efforts toward an act of charity or service right now. But first, renew your Niyyah specifically for Allah. Pure intention transforms ordinary effort into extraordinary reward.',
        source: '"Allah is pure and accepts only what is pure." [Muslim 1015]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Purify the intention',
        instruction:
          'Say "Bismillah" and set your intention purely for Allah\'s pleasure before your next task.',
        arabicText: 'بِسْمِ اللَّهِ وَلِوَجْهِ اللَّهِ',
        transliteration: 'Bismillah, wa li-wajhillah',
        translation: 'In the name of Allah, and for the Face of Allah',
        source: 'Surah Al-Baqarah 2:265 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does sincerity make your energy and actions more productive?',
  },
  {
    id: 'q_angle_2_265_grateful',
    contentId: 'quran_2_265',
    mood: 'Grateful',
    angle:
      'This verse uses the metaphor of a lush garden to show how gratitude and sincerity invite divine blessing. No matter the "rainfall" in your life, Allah ensures your garden flourishes. [Tafsir Ibn Kathir]',
    action: 'Thank Allah for the specific blessings that have multiplied in your life.',
    actionHowTo:
      'List 3 specific blessings and say "Alhamdulillah" for each with presence of heart.',
    actionReward:
      'Allah says: "If you are grateful, I will surely increase you [in favor]." [Quran 14:7]',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'leaf',
        title: 'List your blessings',
        instruction:
          'List 3 specific blessings that have multiplied in your life and say "Alhamdulillah" for each with presence of heart. Like the well-watered garden, your blessings have flourished beyond expectation.',
        source: 'Tafsir Ibn Kathir on 2:265',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'candle',
        title: 'Gratitude invites increase',
        instruction:
          'Gratitude and sincerity invite divine blessing. No matter the "rainfall" in your life, Allah ensures your garden flourishes. And He promised: if you are grateful, He will INCREASE you.',
        source: '"If you are grateful, I will increase you." [Quran 14:7]',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Specific Alhamdulillah',
        instruction:
          'Say "Alhamdulillah" while naming one specific blessing. Specific gratitude is more powerful than general.',
        arabicText: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
        transliteration: 'La-in shakartum la-azidannakum',
        translation: 'If you are grateful, I will surely increase you',
        source: 'Surah Ibrahim 14:7 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection:
      'Like the well-watered garden, what in your life has flourished beyond expectation?',
  },
  {
    id: 'q_angle_3_170_content',
    contentId: 'quran_3_170',
    mood: 'Grateful',
    angle:
      'The Prophet ﷺ taught that true richness is contentment. He said: "Be pleased with what Allah has apportioned for you, and you will be the richest of people." [At-Tirmidhi 2305]',
    action: 'Reflect on a recent blessing and allow your heart to rest in "Rida" (contentment).',
    actionHowTo: 'Say "Raditu billahi Rabba" (I am pleased with Allah as my Lord).',
    actionReward:
      'The Prophet ﷺ said: "The one who is pleased with Allah as Lord... has tasted the sweetness of faith." [Sahih Muslim 34]',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'gem',
        title: 'True richness',
        instruction:
          'True richness is contentment of the soul. Be pleased with what Allah has apportioned for you and you become the richest of people — regardless of your bank account.',
        source: '"Be pleased with what Allah has apportioned." [Tirmidhi 2305]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Taste the sweetness',
        instruction: 'Say "Raditu billahi Rabba" and let Rida (contentment) fill your heart.',
        arabicText: 'رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا',
        transliteration: 'Raditu billahi Rabba, wa bil-Islami dina, wa bi-Muhammadin nabiyya',
        translation: 'I am pleased with Allah as Lord, Islam as religion, and Muhammad as Prophet',
        source: '"Whoever says this has tasted the sweetness of faith." [Muslim 34]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'calm-face',
        title: 'Rest in contentment',
        instruction:
          'Sit quietly for 1 minute and reflect on a recent blessing. Allow your heart to rest in Rida. Feel the contentment settle into your chest. This is the greatest wealth.',
        source: 'Surah Al-Imran 3:170 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'What blessings has Allah bestowed that bring you deep contentment today?',
  },
  {
    id: 'q_angle_40_60_stressed',
    contentId: 'quran_40_60',
    mood: 'Overwhelmed',
    angle:
      'The Prophet ﷺ said: "Your Lord is Generous and Shy; if His servant raises his hands to Him, He is shy to return them empty." Stress is a call to this direct connection. [Abu Dawud 1488]',
    action: 'When stress feels heavy, call upon Allah immediately with a sincere Du’a.',
    actionHowTo: 'Raise your hands and name your specific stressor to Allah.',
    actionReward:
      'The Prophet ﷺ said: "Du’a is worship." Every call to Him is recorded as a high act of devotion. [At-Tirmidhi 2969]',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: "He won't return you empty",
        instruction:
          'Raise your hands and call upon Allah with your concern. The Prophet ﷺ said: "Your Lord is Generous and Ḥayiyy; He is shy to return His servant\'s hands empty when he raises them to Him." [Abu Dawud 1488]',
        arabicText: 'ادْعُونِي أَسْتَجِبْ لَكُمْ',
        transliteration: "Ud'uni astajib lakum",
        translation: 'Call upon Me; I will respond to you',
        source: 'Sunan Abi Dawud 1488',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'chat',
        title: 'Stress is a call to connect',
        instruction:
          'Your stress is not a punishment — it is a CALL to connect. Dua is worship. Every call to Him is recorded as a high act of devotion. Your stress is driving you toward the best possible response: turning to Allah.',
        source: '"Dua is worship." [Tirmidhi 2969]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Name it to Him',
        instruction:
          'Go into sujud and NAME your specific stressor to Allah. Say it out loud. Transfer the weight from your shoulders to His care. He is the One who lightens burdens.',
        source: 'Surah Ghafir 40:60 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection: 'How does the promise of a divine response ease the weight of your stress?',
  },
  // === RIZQ REVOLUTION ANGLES ===
  {
    id: 'q_angle_rizq_day1',
    contentId: 'quran_51_22',
    mood: 'Overwhelmed',
    angle:
      "Ibn Kathir's Tafsir: Allah reminds us that our rizq is already written in the heavens—recorded and guaranteed. Worrying about it won't increase it, and relaxing about it won't decrease it.",
    action: 'Redefine Wealth: Write down 5 things you have that money cannot buy.',
    actionHowTo:
      "Examples: 'I can walk, I have clean water, I know people who love me, I have my senses, I have access to knowledge.'",
    actionReward:
      "Prophet ﷺ said: 'If you were to rely upon Allah with the reliance He is due, you would be given provision like the birds: they go out hungry in the morning and return full in the evening.' [Tirmidhi 2344]",
    actionArabicText:
      'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي، وَوَسِّعْ لِي فِي دَارِي، وَبَارِكْ لِي فِي رِزْقِي',
    actionTransliteration: "Allahumma ighfir li dhanbi, wa wassi' li fi dari, wa barik li fi rizqi",
    actionTranslation:
      'O Allah, forgive me my sin, expand for me in my dwelling, and bless me in my provision',
    actionSource: 'Authenticated in collections of morning/evening adhkar',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'moon',
        title: 'Written in the heavens',
        instruction:
          'Your rizq is already written in the heavens — recorded and guaranteed. Worrying will not increase it, and relaxing will not decrease it. This is divine accounting.',
        source: 'Tafsir Ibn Kathir on 51:22',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'pen',
        title: 'Redefine wealth',
        instruction:
          'Write down 5 things you have that money cannot buy: health, sight, family, faith, clean water. This is your TRUE wealth — the wealth that cannot be taken.',
        source: 'Surah Adh-Dhariyat 51:22 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The Rizq Dua',
        instruction: 'Say this dua for blessed provision.',
        arabicText:
          'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي، وَوَسِّعْ لِي فِي دَارِي، وَبَارِكْ لِي فِي رِزْقِي',
        transliteration: "Allahumma ighfir li dhanbi, wa wassi' li fi dari, wa barik li fi rizqi",
        translation: 'O Allah, forgive my sin, expand my dwelling, and bless my provision',
        source: 'Authenticated in morning/evening adhkar',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
    ]),
    reflection:
      'What one thing do you already have that you have been taking for granted? How would your life change if it was taken away tomorrow?',
  },
  {
    id: 'q_angle_rizq_day2',
    contentId: 'quran_11_6',
    mood: 'Overwhelmed',
    angle:
      "Imam Al-Ghazali: 'Ar-Razzaq is the One who created sustenance and distributed it to all creation. He provides for the bird in the sky, the fish in the ocean, and the baby in the womb—none of them earned it, yet all are sustained.' Ibn al-Qayyim: 'When you know that your Provider is Ar-Razzaq, you realize that no human can withhold what Allah has written for you. This knowledge liberates the heart from depending on creation.'",
    action: "Learn the Name: Repeat 'Ya Razzaq' (O Provider) 100 times today.",
    actionHowTo:
      'Use a digital tasbih counter. Best times: After Fajr, after any prayer, before sleep.',
    actionReward:
      'Prophet ﷺ taught that your rizq was written before you took your first breath—the soul is created 120 days into pregnancy and an angel writes four things including provision. [Bukhari 3208]',
    actionArabicText: 'اللَّهُمَّ أَنْتَ الرَّزَّاقُ، ارْزُقْنِي مِنْ فَضْلِكَ',
    actionTransliteration: 'Allahumma anta ar-Razzaq, urzuqni min fadlika',
    actionTranslation: 'O Allah, You are the Provider, provide for me from Your bounty',
    actionSource: 'Dua of the Provider',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Ya Razzaq',
        instruction:
          'Call on Allah by His Name "Ya Razzaq" (O Provider). Reflect on how He is the source of all provision. No human can withhold what He has written for you.',
        arabicText: 'يَا رَزَّاقُ',
        transliteration: 'Ya Razzaq',
        translation: 'O Provider',
        source: 'Surah Hud 11:6 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'bird',
        title: 'Liberate your heart',
        instruction:
          'He provides for the bird in the sky, the fish in the ocean, and the baby in the womb — none of them earned it. When you know your Provider is Ar-Razzaq, you stop depending on creation.',
        source: 'Imam Al-Ghazali on Ar-Razzaq',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Dua for provision',
        instruction: 'Make dua specifically asking Ar-Razzaq for provision from His bounty.',
        arabicText: 'اللَّهُمَّ أَنْتَ الرَّزَّاقُ، ارْزُقْنِي مِنْ فَضْلِكَ',
        transliteration: 'Allahumma anta ar-Razzaq, urzuqni min fadlika',
        translation: 'O Allah, You are the Provider, provide for me from Your bounty',
        source: 'Bukhari 3208',
        sourceType: 'prophetic_dua',
        sourceGrading: 'sahih',
      },
    ]),
    reflection:
      'If you truly believed that Allah guarantees your provision, what would you stop worrying about today?',
  },
  // Day 3: Halal vs. Haram
  {
    id: 'q_angle_rizq_day3',
    contentId: 'quran_2_168',
    mood: 'Overwhelmed',
    angle:
      "Imam Ahmad ibn Hanbal was offered a large sum to endorse a ruler's policy he disagreed with. He refused, saying: 'A single dirham earned with halal is better than a mountain of gold earned through doubt.' Prophet ﷺ said: 'A body nourished by haram will not enter Paradise.' [Tirmidhi 614] Ibn Rajab explained: 'Haram wealth blocks your duas from being answered, clouds your judgment, and removes barakah from your life.'",
    action:
      'Income Audit: Review your income sources—employment, investments, side income. Ask: Does this harm others? Would I be ashamed if this transaction was made public?',
    actionHowTo:
      'If you find something doubtful: Make a plan to transition out (give yourself 3-6 months). Give away any haram earnings to charity (you cannot keep it).',
    actionReward: 'A little with barakah beats abundance with anxiety.',
    actionArabicText:
      'اللَّهُمَّ اغْفِرْ لِي مَا أَخَذْتُ بِغَيْرِ حَقٍّ، وَبَارِكْ لِي فِيمَا رَزَقْتَنِي مِنْ حَلَالٍ',
    actionTransliteration:
      'Allahumma ighfir li ma akhadtu bi ghayri haqq, wa barik li fima razaqtani min halal',
    actionTranslation:
      'O Allah, forgive me for what I have taken unjustly, and bless what You have provided me from halal sustenance',
    actionSource: 'The Halal Wealth Dua',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'target',
        title: 'Halal over haram',
        instruction:
          'A single dirham earned halal is better than a mountain of gold earned through doubt. Haram wealth blocks duas, clouds judgment, and removes barakah. A little with barakah beats abundance with anxiety.',
        source: 'Imam Ahmad ibn Hanbal',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'physical',
        icon: 'pen',
        title: 'Income audit',
        instruction:
          'Review your income sources. Ask: does this harm others? Would I be ashamed if this was public? If anything is doubtful, plan to transition out and give away haram earnings.',
        source: 'Tirmidhi 614',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Halal wealth dua',
        instruction: 'Ask Allah to purify your provision.',
        arabicText:
          'اللَّهُمَّ اغْفِرْ لِي مَا أَخَذْتُ بِغَيْرِ حَقٍّ، وَبَارِكْ لِي فِيمَا رَزَقْتَنِي مِنْ حَلَالٍ',
        transliteration:
          'Allahumma ighfir li ma akhadtu bi ghayri haqq, wa barik li fima razaqtani min halal',
        translation: 'O Allah, forgive me for what I took unjustly, and bless my halal provision',
        source: 'Surah Al-Baqarah 2:168 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection:
      'Is there any income source in your life that makes you uneasy? What would it take to walk away from it?',
  },
  // Day 4: Tawakkul ≠ Laziness
  {
    id: 'q_angle_rizq_day4',
    contentId: 'quran_65_3_rizq',
    mood: 'Hopeful',
    angle:
      "A Bedouin came to the Prophet ﷺ and asked: 'Should I tie my camel and trust in Allah, or leave it untied and trust in Allah?' The Prophet ﷺ said: 'Tie your camel, then trust in Allah.' [Tirmidhi 2517] Ibn al-Qayyim wrote: 'True tawakkul is the heart's reliance on Allah while the limbs are active in pursuing provision.'",
    action:
      "Tie Your Camel: Identify one action you've been avoiding—update resume, learn a new skill, network, apply for that opportunity, start that halal project. Do it today.",
    actionHowTo:
      'After taking action, repeat "Hasbiyallahu wa ni\'mal wakeel" (Allah is sufficient for me) 7 times. Trust Allah with results.',
    actionReward:
      'Prophet ﷺ said: "Allah loves that when any of you does something, he does it with excellence (itqan)." [Bayhaqi]',
    actionArabicText: 'حَسْبِيَ اللَّهُ وَنِعْمَ الْوَكِيلُ',
    actionTransliteration: "Hasbiyallahu wa ni'mal wakeel",
    actionTranslation: 'Allah is sufficient for me and He is the best Disposer of affairs',
    actionSource: 'Quran 3:173 - Dua of the Prophets',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'bird',
        title: 'Tie your camel',
        instruction:
          'Identify one action you have been avoiding and do it TODAY: update resume, learn a skill, apply for an opportunity. Tie the camel THEN trust. True tawakkul means your heart relies on Allah while your limbs are active.',
        source: 'Tirmidhi 2517',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Trust with results',
        instruction:
          'After taking action, say "Hasbiyallahu wa ni\'mal wakeel" 7 times. Your job is effort. His job is results.',
        arabicText: 'حَسْبِيَ اللَّهُ وَنِعْمَ الْوَكِيلُ',
        transliteration: "Hasbiyallahu wa ni'mal wakeel",
        translation: 'Allah is sufficient for me and He is the best Disposer of affairs',
        source: 'Quran 3:173',
        sourceType: 'quran_dua',
        countSource: 'Abu Dawud 5081',
        count: 7,
      },
      {
        type: 'mindset',
        icon: 'target',
        title: 'Action + trust',
        instruction:
          "True tawakkul is the heart's reliance on Allah while the limbs are active. It is not laziness — it is working with excellence while trusting Allah with the outcome.",
        source: 'Ibn al-Qayyim on Tawakkul',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
    ]),
    reflection:
      'What action have you been postponing because you\'re "waiting for the right time"? What if today is that time?',
  },
  // Day 5: The Scarcity Trap
  {
    id: 'q_angle_rizq_day5',
    contentId: 'quran_29_60',
    mood: 'Overwhelmed',
    angle:
      "Ibn al-Qayyim described two types of people: (1) Those who see rizq as limited—they hoard, compete, envy, and anxiety consumes them. (2) Those who see rizq as guaranteed by Al-Waasi' (The All-Encompassing)—they give freely, compete in good, and live in peace. Shaykh Ibn Uthaymeen said: 'The one obsessed with wealth rarely finds contentment. The one content with Allah's decree often finds wealth coming to him without obsession.'",
    action:
      'Name the Fear: Complete this sentence—"I\'m anxious about money because I fear..." Write it down. Naming the fear weakens it.',
    actionHowTo:
      'Ask yourself: "Has Allah ever left me starving? Have I ever missed a meal I truly needed?" Remember the answer.',
    actionReward:
      'Prophet ﷺ said: "Whoever is primarily concerned about the Hereafter, Allah will enrich his heart and bring his affairs together, and the world will come to him despite itself." [Tirmidhi 2465]',
    actionArabicText: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    actionTransliteration: 'La hawla wa la quwwata illa billah',
    actionTranslation: 'There is no might nor power except with Allah',
    actionSource: 'The Anxiety-Buster Dua - repeat until the tightness in your chest loosens',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'pen',
        title: 'Name the fear',
        instruction:
          'Complete this sentence: "I\'m anxious about money because I fear..." Write it down. Naming the fear weakens it. Then ask: has Allah ever left you starving?',
        source: 'Ibn al-Qayyim on Scarcity',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'globe',
        title: 'Abundance vs scarcity',
        instruction:
          "Those who see rizq as limited hoard and envy. Those who see it as guaranteed by Al-Waasi' give freely and live in peace. Which type are you? The obsessed rarely find contentment.",
        source: 'Shaykh Ibn Uthaymeen',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'La hawla wa la quwwata',
        instruction: 'Say this anxiety-buster dua until the tightness in your chest loosens.',
        arabicText: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
        transliteration: 'La hawla wa la quwwata illa billah',
        translation: 'There is no might nor power except with Allah',
        source: '"Enrich his heart and bring his affairs together." [Tirmidhi 2465]',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection:
      'What would you do differently if you believed—truly believed—that your rizq is already written and guaranteed?',
  },
  // Day 6: Contentment (Qana'ah)
  {
    id: 'q_angle_rizq_day6',
    contentId: 'quran_2_155_156',
    mood: 'Sad',
    angle:
      "Imam Al-Ghazali: 'Qana'ah is satisfaction with what you have. It's not laziness or lack of ambition. It's freedom from the tyranny of \"more.\"' When Umar (ra) saw the Prophet ﷺ lying on a mat that left marks on his skin with barely any possessions, he cried. The Prophet ﷺ said: 'O Umar, are you not pleased that they have this world and we have the Hereafter?' [Bukhari 4913] Prophet ﷺ said: 'Richness is not having many possessions. Rather, richness is richness of the soul.' [Bukhari 6446]",
    action:
      'Gratitude Reset: List 10 things you have that others are desperately making dua for—eyes that see, a bed to sleep in, you ate today, someone loves you.',
    actionHowTo:
      'Today, say "I have enough" three times: when you look in your closet, when you open your fridge, when you check your bank account.',
    actionReward: "You don't need more. You need to want less.",
    actionArabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى',
    actionTransliteration: "Allahumma inni as'alukal-huda wat-tuqa wal-'afafa wal-ghina",
    actionTranslation: 'O Allah, I ask You for guidance, piety, chastity, and self-sufficiency',
    actionSource: "Sahih Muslim 2721 - The Qana'ah Dua",
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'pen',
        title: 'Gratitude reset',
        instruction:
          'List 10 things you have that others desperately make dua for: eyes that see, a bed, food today, someone who loves you. Say "I have enough" when you look in your closet, fridge, and bank account.',
        source: 'Bukhari 6446',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'gem',
        title: 'Richness of the soul',
        instruction:
          'Qana\'ah is freedom from the tyranny of "more." Richness is not many possessions — it is richness of the soul. You don\'t need more. You need to want less.',
        source: "Imam Al-Ghazali on Qana'ah",
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: "The Qana'ah Dua",
        instruction: 'Ask Allah for true self-sufficiency.',
        arabicText: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى',
        transliteration: "Allahumma inni as'alukal-huda wat-tuqa wal-'afafa wal-ghina",
        translation: 'O Allah, I ask You for guidance, piety, chastity, and self-sufficiency',
        source: 'Muslim 2721',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection:
      'If you could never earn another dollar but kept everything you have now, could you be happy? Why or why not?',
  },
  // Day 7: Barakah > Amount
  {
    id: 'q_angle_rizq_day7',
    contentId: 'quran_7_96',
    mood: 'Hopeful',
    angle:
      "Ibn Taymiyyah: 'Barakah is when Allah places good, growth, and increase in something—even if it appears small.' $1,000 with barakah = pays all bills, saves some, gives charity, still has left over. $10,000 without barakah = mysteriously disappears, unexpected expenses, constant stress. Barakah Killers: Haram income, ingratitude, cutting family ties, lying in business, delaying prayer, stinginess. Barakah Multipliers: Honesty, waking up for Fajr, eating together as family, saying Bismillah.",
    action:
      'Seek Barakah in Time: Wake up for Fajr. Prophet ﷺ said: "O Allah, bless my Ummah in their early morning." [Tirmidhi 1212]',
    actionHowTo:
      'Give sadaqah today—even $1, even 50 cents. Prophet ﷺ said: "Charity does not decrease wealth." [Muslim 2588] Test this.',
    actionReward:
      'Track your money for the next month and see what happens when you give consistently.',
    actionArabicText: 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا',
    actionTransliteration: 'Allahumma barik lana fima razaqtana',
    actionTranslation: 'O Allah, bless us in what You have provided us',
    actionSource: 'The Barakah Dua - say before eating, working, starting any task',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'sunrise',
        title: 'Seek barakah in time',
        instruction:
          'Wake up for Fajr. Give sadaqah today — even $1. Barakah multipliers: honesty, Fajr, eating together, saying Bismillah. Charity does NOT decrease wealth — test it.',
        source: '"Charity does not decrease wealth." [Muslim 2588]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'star',
        title: 'Barakah > amount',
        instruction:
          'Barakah means Allah places good, growth, and increase in something even if it appears small. $1,000 with barakah goes further than $10,000 without it. Seek barakah, not just money.',
        source: 'Ibn Taymiyyah on Barakah',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The Barakah Dua',
        instruction: 'Say this before eating, working, or starting any task.',
        arabicText: 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا',
        transliteration: 'Allahumma barik lana fima razaqtana',
        translation: 'O Allah, bless us in what You have provided us',
        source: 'Tirmidhi 1212',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
    ]),
    reflection:
      'Think of a time you had very little money but felt rich. What made that time special? Can you recreate that feeling now?',
  },
  // Day 8: Give to Receive
  {
    id: 'q_angle_rizq_day8',
    contentId: 'quran_2_261',
    mood: 'Tired',
    angle:
      "Allah doesn't just replace what you give—He multiplies it. One seed becomes 700 grains (7 ears × 100). That's a 70,000% return on investment. Shaykh Ibn Baaz said: 'Many people say they believe in this verse, but their hands refuse to give. True belief is when your wealth moves with your heart.' Prophet ﷺ said: 'His wealth is what he has sent forward (in charity), and the wealth of his heirs is what he has kept back.' [Bukhari 6442] What you keep, you lose. What you give, you keep forever.",
    action:
      "Break the Fear: Give something today—not from surplus, from what you need. The Sahaba gave from their poverty, not their wealth. Amount doesn't matter. The sacrifice does.",
    actionHowTo:
      'Set up a monthly sadaqah: $5/month to an orphan, $10/month to a masjid, $20/month to a water well project. Consistency opens the floodgates of rizq.',
    actionReward: 'The hand that gives is always higher than the hand that receives.',
    actionArabicText: 'اللَّهُمَّ أَعْطِ مُنْفِقًا خَلَفًا، وَأَعْطِ مُمْسِكًا تَلَفًا',
    actionTransliteration: "Allahumma a'ti munfiqan khalafan, wa a'ti mumsikan talafan",
    actionTranslation:
      'O Allah, give replacement to the one who spends, and destruction to the one who withholds',
    actionSource: 'Bukhari 1442, Muslim 1010 - The Multiplier Dua',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'honey',
        title: 'Give from what you need',
        instruction:
          'Give something today — not from surplus, from what you need. The Sahaba gave from their poverty. Set up a monthly sadaqah: even $5/month. Consistency opens the floodgates of rizq.',
        source: 'Bukhari 6442',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'leaf',
        title: '70,000% return',
        instruction:
          "Allah doesn't just replace what you give — He multiplies it. One seed becomes 700 grains. What you keep, you lose. What you give, you keep forever. True belief is when your wealth moves with your heart.",
        source: 'Shaykh Ibn Baaz on 2:261',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The Multiplier Dua',
        instruction: 'Ask Allah to replace what you give and multiply it.',
        arabicText: 'اللَّهُمَّ أَعْطِ مُنْفِقًا خَلَفًا، وَأَعْطِ مُمْسِكًا تَلَفًا',
        transliteration: "Allahumma a'ti munfiqan khalafan, wa a'ti mumsikan talafan",
        translation:
          'O Allah, give replacement to the one who spends, and destruction to the one who withholds',
        source: 'Bukhari 1442, Muslim 1010',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection:
      'What would you give away today if you truly believed Allah would replace it seven hundred times over?',
  },
  {
    id: 'q_angle_rizq_day9',
    contentId: 'quran_67_15',
    mood: 'Tired',
    angle:
      "Allah didn't say 'sit and wait for provision to come to you.' He said: 'Walk among its slopes.' Ibn Kathir: 'This verse is a direct command to traverse the earth, work, trade, farm, and seek Allah's provision through action.' When Maryam (as) gave birth to Isa (as), exhausted and hungry, did Allah just drop dates into her lap? No. He said: 'Shake the trunk of the palm tree toward you.' [Quran 19:25] She had to shake the tree. Allah could have made the dates fall without her effort—but He wanted to teach us: Do your part.",
    action:
      'The Means Checklist: Ask: "What PRACTICAL step can I take today?" Send 5 job applications, take an online course, reach out to a mentor, save $10 this week, cut one unnecessary expense. Pick one. Do it before sunset.',
    actionHowTo:
      'Go for a Provision Walk—literally walk today. Reflect: "The earth is made \'tame\' for me. Where can I walk to find my provision?" Maybe to a library, masjid, job fair, or just to plan.',
    actionReward:
      "Allah divided the work: He provides, you seek. Don't do His job, and don't skip yours.",
    actionArabicText:
      'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِنْ شِئْتَ سَهْلًا',
    actionTransliteration:
      "Allahumma la sahla illa ma ja'altahu sahla, wa anta taj'alul-hazna in shi'ta sahla",
    actionTranslation:
      'O Allah, there is no ease except what You make easy, and You make the difficult easy if You wish',
    actionSource: 'Ibn Hibban 974 - The Action Dua',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'person',
        title: 'Walk among its slopes',
        instruction:
          'Allah said "Walk among its slopes" — not sit and wait. Take one PRACTICAL step today: send applications, learn a skill, reach out to a mentor. Maryam had to shake the tree. Do your part.',
        source: 'Tafsir Ibn Kathir on 67:15',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'leaf',
        title: 'Shake the tree',
        instruction:
          "Allah could have dropped dates into Maryam's lap without effort — but He told her to shake the tree. He divided the work: He provides, you seek. Don't do His job, and don't skip yours.",
        source: 'Quran 19:25',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The Action Dua',
        instruction: 'Ask Allah to make the difficult easy.',
        arabicText:
          'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِنْ شِئْتَ سَهْلًا',
        transliteration:
          "Allahumma la sahla illa ma ja'altahu sahla, wa anta taj'alul-hazna in shi'ta sahla",
        translation:
          'O Allah, nothing is easy except what You make easy, and You make the difficult easy if You wish',
        source: 'Ibn Hibban 974',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
    ]),
    reflection:
      'What is one action you\'ve been avoiding because "it probably won\'t work anyway"? What if Allah is waiting for you to try before He opens the door?',
  },
  // Day 10: The Dua for Rizq
  {
    id: 'q_angle_rizq_day10',
    contentId: 'quran_14_37',
    mood: 'Hopeful',
    angle:
      "When Prophet Ibrahim (as) left his wife Hajar and baby Ismail in the desert—a place with zero resources—he didn't just walk away. He made dua for their rizq. Allah answered: Made the well of Zamzam appear, made people's hearts incline toward Makkah, turned a barren valley into the center of world trade. Even prophets make dua for provision. It's not a sign of weak faith—it's Sunnah.",
    action:
      'Memorize the Master Dua: Say after Fajr and Maghrib daily. Make rizq dua at one of the best times: Last third of night (Tahajjud), between Adhan and Iqamah, during sujood, last hour of Friday.',
    actionHowTo:
      'Add the Istighfar Multiplier: Prophet ﷺ said: "Whoever constantly seeks forgiveness, Allah will make a way out for him from every difficulty and provide for him from sources he never expected." [Abu Dawud 1518] Say "Astaghfirullah" 100 times today.',
    actionReward:
      "Dua is the weapon of the believer. Don't just think about your needs—pour them out in sujood.",
    actionArabicText:
      'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي، وَوَسِّعْ لِي فِي دَارِي، وَبَارِكْ لِي فِي رِزْقِي',
    actionTransliteration: "Allahumma ighfir li dhanbi, wa wassi' li fi dari, wa barik li fi rizqi",
    actionTranslation:
      'O Allah, forgive me my sin, expand for me in my dwelling, and bless me in my provision',
    actionSource: 'The Master Rizq Dua - morning and evening',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The Master Rizq Dua',
        instruction:
          'Say this dua after Fajr and Maghrib daily. Best times: last third of night, between Adhan and Iqamah, in sujud, last hour of Friday.',
        arabicText:
          'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي، وَوَسِّعْ لِي فِي دَارِي، وَبَارِكْ لِي فِي رِزْقِي',
        transliteration: "Allahumma ighfir li dhanbi, wa wassi' li fi dari, wa barik li fi rizqi",
        translation: 'O Allah, forgive my sin, expand my dwelling, and bless my provision',
        source: 'The Master Rizq Dua',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'sunrise',
        title: "Ibrahim's dua in the desert",
        instruction:
          'Ibrahim left Hajar and Ismail in a barren desert with zero resources — and made dua. Allah responded with Zamzam, turned a valley into the center of world trade. Even prophets make dua for provision. It is Sunnah, not weak faith.',
        source: 'Surah Ibrahim 14:37 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Istighfar multiplier',
        instruction:
          'Say "Astaghfirullah" 100 times today. The Prophet ﷺ said: whoever constantly seeks forgiveness, Allah will make a way out from every difficulty and provide from unexpected sources.',
        arabicText: 'أَسْتَغْفِرُ اللَّهَ',
        transliteration: 'Astaghfirullah',
        translation: 'I seek forgiveness from Allah',
        source: 'Abu Dawud 1518',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
        countSource: 'Muslim 2702 / Bukhari 6307',
        count: 100,
      },
    ]),
    reflection:
      'What specific rizq are you asking Allah for? Have you been making dua consistently, or just worrying consistently?',
  },
  // Day 11: Gratitude Multiplies
  {
    id: 'q_angle_rizq_day11',
    contentId: 'quran_14_7',
    mood: 'Grateful',
    angle:
      "This isn't a suggestion—it's a guaranteed contract from Allah. Show gratitude, get increase. It's cause and effect. Ibn al-Qayyim identified three levels of Shukr: (1) Heart: Recognizing the blessing came from Allah (2) Tongue: Saying 'Alhamdulillah' (3) Limbs: Using the blessing to obey Allah. Example: You get a salary. Heart: 'This is from Allah, not just my hard work.' Tongue: 'Alhamdulillah.' Limbs: Give zakah, spend on family, avoid haram. That's complete shukr. Shaykh Ibn Uthaymeen: 'Many people lose their wealth not because Allah took it, but because they stopped being grateful for it.'",
    action:
      'Gratitude Journal: Every night before bed, write down 3 specific things you\'re grateful for today—not generic. Be specific: "The taxi driver smiled at me," "I had hot tea this morning."',
    actionHowTo:
      'Say "Alhamdulillah" out loud for every blessing you notice today. Car started? Alhamdulillah. Hot shower? Alhamdulillah. Phone charged? Alhamdulillah. Train your tongue.',
    actionReward: 'Do this for 7 straight nights. Watch your mindset shift.',
    actionArabicText: 'اللَّهُمَّ زِدْنَا وَلَا تَنْقُصْنَا، وَأَعْطِنَا وَلَا تَحْرِمْنَا',
    actionTransliteration: "Allahumma zidna wa la tanqusna, wa a'tina wa la tahrimna",
    actionTranslation: 'O Allah, increase us and do not decrease us, give us and do not deprive us',
    actionSource: 'The Increase Dua',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'pen',
        title: 'Gratitude journal',
        instruction:
          'Every night before bed, write 3 SPECIFIC things you are grateful for — not generic. "The taxi driver smiled at me," "I had hot tea this morning." Do this for 7 nights and watch your mindset shift.',
        source: 'Ibn al-Qayyim on Shukr',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'chart',
        title: 'Guaranteed contract',
        instruction:
          'This is not a suggestion — it is a guaranteed contract: show gratitude, get increase. Three levels of Shukr: Heart (recognize the blessing), Tongue (say Alhamdulillah), Limbs (use the blessing to obey Allah). Complete shukr activates the increase.',
        source: 'Shaykh Ibn Uthaymeen',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The Increase Dua',
        instruction: 'Ask Allah to increase you and never decrease you.',
        arabicText: 'اللَّهُمَّ زِدْنَا وَلَا تَنْقُصْنَا، وَأَعْطِنَا وَلَا تَحْرِمْنَا',
        transliteration: "Allahumma zidna wa la tanqusna, wa a'tina wa la tahrimna",
        translation: 'O Allah, increase us and do not decrease us, give us and do not deprive us',
        source: 'Surah Ibrahim 14:7 — Quran',
        sourceType: 'quran_dua',
      },
    ]),
    reflection:
      'What blessing did you complain about this week that millions would desperately make dua for?',
  },
  // Day 12: When Halal Feels Hard
  {
    id: 'q_angle_rizq_day12',
    contentId: 'quran_65_7',
    mood: 'Sad',
    angle:
      "Notice Allah didn't say 'might bring ease' or 'if you're good enough.' He said 'WILL bring ease.' It's guaranteed. Umar ibn Abdul Aziz said: 'Allah tests people with wealth to see if they're grateful, and tests them with poverty to see if they're patient. Both are tests.' The early Muslims were boycotted for 3 years—no trade, no income, eating leaves from trees. But they didn't compromise their faith for money. Allah rewarded them with the entire Arabian Peninsula. Ibn al-Qayyim: 'Sometimes Allah delays provision to test your trust, purify you from attachment to dunya, increase your reward, or prepare you for what's coming.'",
    action:
      'Reframe the Struggle: Instead of "Why is Allah making this so hard?" say "What is Allah teaching me through this?" Write down what you\'re learning about your dependence on Him.',
    actionHowTo:
      'Even in your poverty, find someone worse off and help them. Prophet ﷺ said: "The upper hand (that gives) is better than the lower hand (that receives)." [Bukhari 1472] Even if it\'s just a smile, a dua, or your time—give something.',
    actionReward: "Hardship is temporary. Allah's promise is eternal. After night comes Fajr.",
    actionArabicText:
      'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ، نِعْمَ الْمَوْلَى وَنِعْمَ النَّصِيرُ',
    actionTransliteration: "Hasbunallahu wa ni'mal wakeel, ni'mal-mawla wa ni'man-naseer",
    actionTranslation:
      'Sufficient for us is Allah, and He is the best Disposer of affairs, the best Protector and the best Helper',
    actionSource: 'Quran 3:173 - The Patience Dua',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'pen',
        title: 'Reframe the struggle',
        instruction:
          'Instead of "Why is Allah making this hard?" ask "What is Allah teaching me?" Write down what you are learning about your dependence on Him. Even in poverty, find someone worse off and help them — even with a smile or dua.',
        source: 'Bukhari 1472',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'clock',
        title: 'Ease is guaranteed',
        instruction:
          'Allah didn\'t say "might bring ease" — He said WILL bring ease. It is guaranteed. Sometimes He delays provision to test trust, purify attachment, increase reward, or prepare you for what is coming. Hardship is temporary. His promise is eternal.',
        source: 'Ibn al-Qayyim on Delayed Provision',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The Patience Dua',
        instruction: 'Say this dua for sufficiency and divine support.',
        arabicText: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ، نِعْمَ الْمَوْلَى وَنِعْمَ النَّصِيرُ',
        transliteration: "Hasbunallahu wa ni'mal wakeel, ni'mal-mawla wa ni'man-naseer",
        translation:
          'Sufficient for us is Allah and He is the best Disposer, the best Protector and the best Helper',
        source: 'Quran 3:173',
        sourceType: 'quran_dua',
      },
    ]),
    reflection:
      'Looking back at past financial struggles, how did Allah provide relief? What pattern do you notice about His timing?',
  },
  // Day 13: Removing Greed
  {
    id: 'q_angle_rizq_day13',
    contentId: 'quran_102_1_2',
    mood: 'Overwhelmed',
    angle:
      "Ibn Kathir: 'This surah is a warning to those who are so busy competing in wealth, status, and possessions that they forget death is coming. The race ends at the grave—and the winner is not who has the most, but who used what they had best.' Prophet ﷺ said: 'If the son of Adam had a valley of gold, he would want a second one. Nothing fills the belly of the son of Adam except dust (death). Yet Allah accepts the repentance of whoever repents.' [Bukhari 6436] Human nature is to always want more. The cure is remembering death.",
    action:
      'Death Reminder: Visit a graveyard today, or watch a funeral online, or read about someone\'s death. Ask: "When I\'m in that grave, will it matter how much I earned or how much I gave?"',
    actionHowTo:
      "Define 'Enough': Write down a number—what annual income would make you feel \"I've made it\"? Now realize: People earning 10x that amount are still anxious. Enough isn't a number. It's a state of heart.",
    actionReward:
      'The race to the grave has no winners. Only those who spent their wealth on the Hereafter will smile at the finish line.',
    actionArabicText:
      'اللَّهُمَّ لَا تَجْعَلِ الدُّنْيَا أَكْبَرَ هَمِّنَا، وَلَا مَبْلَغَ عِلْمِنَا',
    actionTransliteration: "Allahumma la taj'alid-dunya akbara hammina, wa la mablagha 'ilmina",
    actionSource: 'Tirmidhi 3502 - The Detachment Dua',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'candle',
        title: 'Death reminder',
        instruction:
          'Visit a graveyard, or read about someone\'s death. Ask: "When I\'m in that grave, will it matter how much I earned or how much I gave?" Define "Enough" — write a number, then realize people earning 10x that are still anxious. Enough is a state of heart.',
        source: 'Bukhari 6436',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'mindset',
        icon: 'target',
        title: 'The race ends at the grave',
        instruction:
          'The race ends at the grave — and the winner is not who has the most, but who used what they had best. If the son of Adam had a valley of gold, he would want a second one. The cure for greed is remembering death.',
        source: 'Tafsir Ibn Kathir on 102:1-2',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The Detachment Dua',
        instruction: 'Ask Allah not to make this world your greatest concern.',
        arabicText:
          'اللَّهُمَّ لَا تَجْعَلِ الدُّنْيَا أَكْبَرَ هَمِّنَا، وَلَا مَبْلَغَ عِلْمِنَا',
        transliteration: "Allahumma la taj'alid-dunya akbara hammina, wa la mablagha 'ilmina",
        translation:
          'O Allah, do not make this world our greatest concern, nor the limit of our knowledge',
        source: 'Tirmidhi 3502',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection:
      "If you knew you'd die in 6 months, would you still chase the money/promotion/status you're currently chasing? Why or why not?",
  },
  // Day 14: Living with Barakah
  {
    id: 'q_angle_rizq_day14',
    contentId: 'quran_24_38',
    mood: 'Grateful',
    angle:
      "Ibn al-Qayyim described the complete believer with healthy rizq mindset: (1) Belief—knows Allah is Ar-Razzaq (2) Purity—earns only halal (3) Action—works with excellence (4) Trust—doesn't obsess over results (5) Contentment—satisfied with Allah's decree (6) Quality—seeks barakah over amount (7) Generosity—gives freely (8) Means—takes practical steps (9) Dua—constantly asks Allah (10) Gratitude—thanks Allah for everything (11) Patience—endures tight times (12) Detachment—isn't enslaved by greed. Prophet ﷺ described this person: 'Richness is not having many possessions. Rather, richness is richness of the soul.' [Bukhari 6446]",
    action:
      '14-Day Review: Look back at your journey Days 1-13. Create Your Rizq Routine: Pick 3 daily habits. Example: Morning: Recite "Ya Razzaq" after Fajr. Afternoon: Give $1 sadaqah. Night: Write 3 gratitudes before bed.',
    actionHowTo:
      "Commit to these 3 habits for the next 30 days. Write them down and put them where you'll see them daily.",
    actionReward:
      "You've completed the Rizq Revolution. But the revolution isn't over—it's just beginning. Live with barakah. Trust Ar-Razzaq. Watch your life transform.",
    actionArabicText: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
    actionTransliteration: "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatik",
    actionSource: 'Abu Dawud 1522 - The Completion Dua',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'pen',
        title: '14-day review',
        instruction:
          'Look back at your journey Days 1-13. Create your Rizq Routine: pick 3 daily habits. Morning: "Ya Razzaq" after Fajr. Afternoon: Give $1 sadaqah. Night: Write 3 gratitudes. Commit for 30 days.',
        source: 'Ibn al-Qayyim on Rizq Mindset',
        sourceType: 'sunnah_action',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'trophy',
        title: 'The complete believer',
        instruction:
          'The complete rizq mindset: Belief in Ar-Razzaq, halal earnings, excellence in work, trust without obsession, contentment, seeking barakah, generosity, practical steps, constant dua, gratitude, patience, and detachment from greed. Richness is richness of the soul.',
        source: 'Bukhari 6446',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The Completion Dua',
        instruction: 'Ask Allah to help you maintain dhikr, gratitude, and beautiful worship.',
        arabicText: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
        transliteration: "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatik",
        translation: 'O Allah, help me to remember You, thank You, and worship You beautifully',
        source: 'Abu Dawud 1522',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection:
      '14 days ago, you started this path feeling anxious/scarce. Today, complete this sentence: "I now understand that rizq is..."',
  },
  {
    id: 'q_angle_58_7_lonely',
    contentId: 'quran_58_7_lonely',
    mood: 'Lonely',
    angle:
      "Allah describes His presence as the \"fourth of three\" and the \"sixth of five.\" Scholars distinguish between Allah's general knowledge of all things (Ma'iyyah 'Ammah) and His special support for His believers (Ma'iyyah Khassah). Ibn Kathir explains that \"He is with them\" implies that He is witnessing their secrets and whispers without ever being absent. Al-Sa'di adds that this specific verse was revealed concerning people whispering in secret, but it serves as the ultimate comfort for the lonely: His knowledge isn't just surveillance; it is the promise that you are never truly alone. [Tafsir al-Sa'di]",
    angleSource: "Tafsir al-Sa'di",
    action: 'Speak to Allah silently as if He is right in front of you',
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'breathing',
        title: 'Acknowledge the Fourth',
        instruction:
          'Sit in silence for 60 seconds. Acknowledge that you are not alone — Allah is the "fourth" in your room or the "second" in your heart. He hears your unspoken words right now.',
        source: 'Surah Al-Mujadila 58:7 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Whisper your secret',
        instruction:
          "Whisper one worry to Allah that you haven't told anyone else. Use the Prophet's ﷺ favorite opening for dua.",
        arabicText: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
        transliteration: 'Ya Hayyu Ya Qayyum, bi-rahmatika astaghith',
        translation: 'O Ever-Living, O Sustainer, by Your mercy I seek help',
        source: 'Sunan at-Tirmidhi 3524',
        sourceType: 'prophetic_dua',
        sourceGrading: 'hasan',
      },
      {
        type: 'mindset',
        icon: 'chat',
        title: 'In front of you',
        instruction:
          'The Prophet ﷺ said: "Be mindful of Allah and you will find Him in front of you." Reflect on His support being directly with you in your path. You are not walking this journey alone.',
        source: 'Sunan at-Tirmidhi 2516',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection:
      'If Allah is the "fourth" in every conversation, how does that change your feeling of isolation?',
  },
  {
    id: 'q_angle_11_90_lonely',
    contentId: 'quran_11_90_lonely',
    mood: 'Lonely',
    angle:
      'Prophet Shu\'ayb (AS) reminded his people: "Indeed, my Lord is Merciful and Loving (Wadud)." Al-Sa\'di explains that Al-Wadud is on the linguistic scale of "fa\'ool," meaning He is both the Lover (loving His friends) and the Beloved (the One who is uniquely loved by them). Ibn Kathir notes that while "Rahmah" is general mercy, "Wud" is the special, affectionate love that Allah places in the hearts of those who return to Him. The cure for loneliness is shifting from seeking human validation to experiencing this reciprocal divine affection. [Tafsir al-Sa\'di]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Breathe in the name "Al-Wadud" (The Most Loving)',
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'heart',
        title: 'The Most Loving',
        instruction:
          'Allah is Al-Wadud — the Most Loving. This is not a distant, cold mercy; it is an affectionate, active love. Jibril and the angels are told to love those whom Allah loves. Consider yourself part of that circle of divine affection.',
        source: "Tafsir al-Sa'di on 11:90",
        sourceType: 'quran_dua',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dhikr of Al-Wadud',
        instruction:
          'Repeat "Ya Wadud" (O Most Loving) slowly. With each breath, let the meaning sink in: you are loved by the One who created love itself, and He is the only One whose love is never-failing.',
        arabicText: 'يَا وَدُودُ',
        transliteration: 'Ya Wadud',
        translation: 'O Most Loving One',
        source: 'Surah Hud 11:90 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'heart',
        title: 'Connect with a believer',
        instruction:
          'Reach out to one person today just to say salam or ask how they are. Allah is Al-Wadud, and He places "wud" (affection) between His servants. Reconnecting with people is an extension of His love.',
        source:
          '"When Allah loves a servant, He tells the inhabitants of Heaven to love him." [Bukhari 7485]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
    ]),
    reflection:
      'What changes in your heart when you realize Allah is not just Merciful, but "Wadud" (Most Loving)?',
  },
  {
    id: 'q_angle_3_135_guilty',
    contentId: 'quran_3_135',
    mood: 'Guilty',
    angle:
      'Allah describes the God-conscious (muttaqun) as those who, when they stumble, "remember Allah and seek forgiveness." Scholar Al-Baghawi notes that the phrase "and they do not persist" (walam yuṣirrū) is the defining nuance. Perfection is not required for Taqwa, but persistence in sin is what creates the barrier. Al-Qurtubi explains that "remembrance" here is the immediate mental pivot that interrupts the sin. The guilt you feel is actually a mercy—it is your heart "remembering its Owner." [Tafsir al-Qurtubi]',
    angleSource: 'Tafsir Ibn Kathir',
    action: 'Immediately follow a mistake with a good deed',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dhikr of the returning soul',
        instruction:
          'Say "Astaghfirullah" 33 times slowly. Each time, remember Allah as the ONLY One who can forgive. "And who can forgive sins except Allah?"',
        arabicText: 'أَسْتَغْفِرُ اللَّهَ',
        transliteration: 'Astaghfirullah',
        translation: 'I seek forgiveness from Allah',
        source: 'Surah Ali Imran 3:135 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'brain',
        title: 'Interrupt the pattern',
        instruction:
          'The moment you feel guilt, immediately pivot to remembrance. Don\'t marinate in the shame; use the shame as a signal to return. "They remember Allah" — let the memory of His mercy be stronger than the memory of your mistake.',
        source: "Tafsir al-Sa'di on 3:135",
        sourceType: 'quran_dua',
      },
      {
        type: 'physical',
        icon: 'arrow-right',
        title: 'Pivot to goodness',
        instruction:
          'The Prophet ﷺ said: "Follow a bad deed with a good deed and it will wipe it out." Do one small good act right now — give $1 charity or pray 2 rak\'ahs. Use your energy to build, not just regret.',
        source: '"Follow a bad deed with a good deed and it will wipe it out." [Tirmidhi 1987]',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'hasan',
      },
    ]),
    reflection:
      'How does focusing on Allah as your "only refuge" change the way you face your mistakes?',
  },
  {
    id: 'q_angle_66_8_guilty',
    contentId: 'quran_66_8',
    mood: 'Guilty',
    angle:
      'Allah calls the believers to return in "sincere repentance" (tawbah nasuh). Ibn al-Qayyim explains in Madarij al-Salikin that "Nasuh" comes from the root meaning to mend a garment or purify honey. Sincere repentance "mends" the tear in your spiritual path and purifies your heart from the heavy residue of mistake. Ibn Kathir adds that it must be firm, and honest. The result is "Light" that guides you through the darkness of this life and the Next. [Tafsir Ibn Kathir]',
    angleSource: "Tafsir al-Sa'di",
    action: 'Renew your lifelong intention to keep returning to Allah',
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'Dua for perfect light',
        instruction:
          'Recite the beautiful dua mentioned in this verse — asking Allah to perfect your light.',
        arabicText:
          'رَبَّنَا أَتْمِمْ لَنَا نُورَنَا وَاغْفِرْ لَنَا إِنَّكَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: "Rabbana atmim lana nurana waghfir lana innaka 'ala kulli shay'in qadeer",
        translation:
          'Our Lord, perfect for us our light and forgive us. Indeed, You are over all things competent',
        source: 'Surah At-Tahrim 66:8 — Quran',
        sourceType: 'quran_dua',
      },
      {
        type: 'mindset',
        icon: 'bird',
        title: 'The Happy Lord',
        instruction:
          'Reflect on the joy of a man finding his lost camel in a vast desert. The Prophet ﷺ said Allah is MORE happy with your return than that. You are not begging a reluctant judge; you are returning to a Lord who loves to forgive.',
        source: 'Sahih Bukhari 6309',
        sourceType: 'prophetic_dhikr',
        sourceGrading: 'sahih',
      },
      {
        type: 'physical',
        icon: 'water-drop',
        title: 'Cleanse with wudu',
        instruction:
          'Make a fresh wudu right now. Contemplate your sins falling off with every drop of water. Sincere repentance (nasuh) is like a bath for the soul. Start fresh.',
        source: '"When a Muslim makes wudu, his sins fall away." [Muslim 244]',
        sourceType: 'sunnah_action',
        sourceGrading: 'sahih',
      },
    ]),
    reflection: 'What would change if you believed your repentance caused Allah to be "happy"?',
  },

  // === SALAH TRANSFORMATION JOURNEY ANGLES ===
  // Referenced by step_salah_1..7 in staticPaths.ts. These must live in the
  // local seed: path steps resolve angles offline-first, and the cloud
  // fallback is unavailable without a network connection.
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
    actionReward: 'Prayer is the ultimate source of help for the humbly submissive. [Quran 2:45]',
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
