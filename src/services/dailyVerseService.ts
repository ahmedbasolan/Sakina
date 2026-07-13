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
// Each has: arabic text (complete ayah — never a partial clause, per an
// explicit correction after 7:56 originally shipped truncated), readable
// English, and a short reference. Verified against api.alquran.cloud
// (Uthmani script + Sahih International) rather than retyped from memory.
// Two ayahs (2:185, 2:286) are deliberately excluded: their complete text
// runs 2-3x longer than everything else here, which would force the fixed
// verse-of-the-day card to be sized for two rare outliers year-round.
const VERSE_POOL: Omit<DailyVerse, 'dateKey'>[] = [
  {
    arabic: 'ٱلَّذِينَ ءَامَنُوا۟ وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ ٱللَّهِ ۗ أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ ﴿28﴾',
    translation: 'Those who have believed and whose hearts find rest in the remembrance of Allah. Verily, in the remembrance of Allah do hearts find rest.',
    ref: 'Ar-Ra\'d 13:28',
  },
  {
    arabic: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا إِنَّ مَعَ ٱلْعُسْرِ يُسْرًۭا ﴿5-6﴾',
    translation: 'So indeed, with hardship comes ease. Indeed, with hardship comes ease.',
    ref: 'Ash-Sharh 94:5-6',
  },
  {
    arabic: 'وَلَلْءَاخِرَةُ خَيْرٌۭ لَّكَ مِنَ ٱلْأُولَىٰ ﴿4﴾',
    translation: 'And the Hereafter is better for you than the first life.',
    ref: 'Ad-Duha 93:4',
  },
  {
    arabic: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰٓ ﴿5﴾',
    translation: 'And your Lord is going to give you, and you will be satisfied.',
    ref: 'Ad-Duha 93:5',
  },
  {
    arabic: 'وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ ۚ وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥٓ ۚ إِنَّ ٱللَّهَ بَٰلِغُ أَمْرِهِۦ ۚ قَدْ جَعَلَ ٱللَّهُ لِكُلِّ شَىْءٍۢ قَدْرًۭا ﴿3﴾',
    translation: 'And He will provide for him from where he does not expect. And whoever relies upon Allah — He is sufficient for him. Indeed, Allah will accomplish His purpose. Allah has already set a due measure for everything.',
    ref: 'At-Talaq 65:3',
  },
  {
    arabic: 'وَلَقَدْ خَلَقْنَا ٱلْإِنسَٰنَ وَنَعْلَمُ مَا تُوَسْوِسُ بِهِۦ نَفْسُهُۥ ۖ وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ ٱلْوَرِيدِ ﴿16﴾',
    translation: 'And We have already created man and know what his soul whispers to him, and We are closer to him than his jugular vein.',
    ref: 'Qaf 50:16',
  },
  {
    arabic: 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ ٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ ۚ إِنَّ ٱللَّهَ مَعَ ٱلصَّٰبِرِينَ ﴿153﴾',
    translation: 'O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.',
    ref: 'Al-Baqarah 2:153',
  },
  {
    arabic: 'وَإِذَا سَأَلَكَ عِبَادِى عَنِّى فَإِنِّى قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ ٱلدَّاعِ إِذَا دَعَانِ ۖ فَلْيَسْتَجِيبُوا۟ لِى وَلْيُؤْمِنُوا۟ بِى لَعَلَّهُمْ يَرْشُدُونَ ﴿186﴾',
    translation: 'And when My servants ask you concerning Me — indeed I am near. I respond to the call of the caller when he calls upon Me. So let them respond to Me and believe in Me, that they may be rightly guided.',
    ref: 'Al-Baqarah 2:186',
  },
  {
    arabic: 'وَمِنْهُم مَّن يَقُولُ رَبَّنَآ ءَاتِنَا فِى ٱلدُّنْيَا حَسَنَةًۭ وَفِى ٱلْءَاخِرَةِ حَسَنَةًۭ وَقِنَا عَذَابَ ٱلنَّارِ ﴿201﴾',
    translation: 'And among them is he who says, "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire."',
    ref: 'Al-Baqarah 2:201',
  },
  {
    arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ ٱلْوَهَّابُ ﴿8﴾',
    translation: 'Our Lord, do not let our hearts deviate after You have guided us, and grant us mercy from Yourself. Indeed, You are the Bestower.',
    ref: 'Aal-Imran 3:8',
  },
  {
    arabic: 'وَٱعْتَصِمُوا۟ بِحَبْلِ ٱللَّهِ جَمِيعًۭا وَلَا تَفَرَّقُوا۟ ۚ وَٱذْكُرُوا۟ نِعْمَتَ ٱللَّهِ عَلَيْكُمْ إِذْ كُنتُمْ أَعْدَآءًۭ فَأَلَّفَ بَيْنَ قُلُوبِكُمْ فَأَصْبَحْتُم بِنِعْمَتِهِۦٓ إِخْوَٰنًۭا وَكُنتُمْ عَلَىٰ شَفَا حُفْرَةٍۢ مِّنَ ٱلنَّارِ فَأَنقَذَكُم مِّنْهَا ۗ كَذَٰلِكَ يُبَيِّنُ ٱللَّهُ لَكُمْ ءَايَٰتِهِۦ لَعَلَّكُمْ تَهْتَدُونَ ﴿103﴾',
    translation: 'And hold firmly to the rope of Allah, all together, and do not become divided. And remember the favor of Allah upon you — when you were enemies, and He joined your hearts, so that by His favor you became brothers. And you were on the edge of a pit of the Fire, and He saved you from it. Thus Allah makes His verses clear to you, that you may be guided.',
    ref: 'Aal-Imran 3:103',
  },
  {
    arabic: 'وَلَا تَهِنُوا۟ وَلَا تَحْزَنُوا۟ وَأَنتُمُ ٱلْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ ﴿139﴾',
    translation: 'Do not weaken, and do not grieve — for you will have the upper hand, if you are believers.',
    ref: 'Aal-Imran 3:139',
  },
  {
    arabic: 'وَكَأَيِّن مِّن نَّبِىٍّۢ قَٰتَلَ مَعَهُۥ رِبِّيُّونَ كَثِيرٌۭ فَمَا وَهَنُوا۟ لِمَآ أَصَابَهُمْ فِى سَبِيلِ ٱللَّهِ وَمَا ضَعُفُوا۟ وَمَا ٱسْتَكَانُوا۟ ۗ وَٱللَّهُ يُحِبُّ ٱلصَّٰبِرِينَ ﴿146﴾',
    translation: 'And how many a prophet fought alongside many religious scholars. They did not lose heart over what befell them in the way of Allah, nor did they weaken or give in. And Allah loves the steadfast.',
    ref: 'Aal-Imran 3:146',
  },
  {
    arabic: 'وَٱصْبِرْ فَإِنَّ ٱللَّهَ لَا يُضِيعُ أَجْرَ ٱلْمُحْسِنِينَ ﴿115﴾',
    translation: 'And be patient, for indeed, Allah does not let the reward of those who do good go to waste.',
    ref: 'Hud 11:115',
  },
  {
    arabic: 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ وَٱشْكُرُوا۟ لِى وَلَا تَكْفُرُونِ ﴿152﴾',
    translation: 'So remember Me; I will remember you. And be grateful to Me, and do not deny Me.',
    ref: 'Al-Baqarah 2:152',
  },
  {
    arabic: 'قَالَ رَبِّ ٱشْرَحْ لِى صَدْرِى وَيَسِّرْ لِىٓ أَمْرِى ﴿25-26﴾',
    translation: 'He said, "My Lord, expand for me my chest, and ease for me my task."',
    ref: 'Ta-Ha 20:25-26',
  },
  {
    arabic: 'ٱلَّذِينَ قَالَ لَهُمُ ٱلنَّاسُ إِنَّ ٱلنَّاسَ قَدْ جَمَعُوا۟ لَكُمْ فَٱخْشَوْهُمْ فَزَادَهُمْ إِيمَٰنًۭا وَقَالُوا۟ حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ ﴿173﴾',
    translation: 'Those who were told, "Indeed, the people have gathered against you, so fear them" — it only increased them in faith, and they said, "Allah is sufficient for us, and He is the best Disposer of affairs."',
    ref: 'Aal-Imran 3:173',
  },
  {
    arabic: 'وَتَوَكَّلْ عَلَى ٱلْحَىِّ ٱلَّذِى لَا يَمُوتُ وَسَبِّحْ بِحَمْدِهِۦ ۚ وَكَفَىٰ بِهِۦ بِذُنُوبِ عِبَادِهِۦ خَبِيرًا ﴿58﴾',
    translation: 'And put your trust in the Ever-Living who never dies, and glorify Him with His praise. Sufficient is He as the One who is Acquainted with the sins of His servants.',
    ref: 'Al-Furqan 25:58',
  },
  {
    arabic: 'وَلَا تُفْسِدُوا۟ فِى ٱلْأَرْضِ بَعْدَ إِصْلَٰحِهَا وَٱدْعُوهُ خَوْفًۭا وَطَمَعًا ۚ إِنَّ رَحْمَتَ ٱللَّهِ قَرِيبٌۭ مِّنَ ٱلْمُحْسِنِينَ ﴿56﴾',
    translation: 'And cause not corruption upon the earth after its reformation, and invoke Him in fear and hope. Indeed, the mercy of Allah is near to the doers of good.',
    ref: 'Al-A\'raf 7:56',
  },
  {
    arabic: 'هُوَ ٱلَّذِى خَلَقَ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ فِى سِتَّةِ أَيَّامٍۢ ثُمَّ ٱسْتَوَىٰ عَلَى ٱلْعَرْشِ ۚ يَعْلَمُ مَا يَلِجُ فِى ٱلْأَرْضِ وَمَا يَخْرُجُ مِنْهَا وَمَا يَنزِلُ مِنَ ٱلسَّمَآءِ وَمَا يَعْرُجُ فِيهَا ۖ وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ ۚ وَٱللَّهُ بِمَا تَعْمَلُونَ بَصِيرٌۭ ﴿4﴾',
    translation: 'It is He who created the heavens and the earth in six days, then established Himself above the Throne. He knows what enters the earth and what comes out of it, what descends from the sky and what ascends to it. And He is with you wherever you are. And Allah sees all that you do.',
    ref: 'Al-Hadid 57:4',
  },
  {
    arabic: 'قُلْ يَٰعِبَادِىَ ٱلَّذِينَ أَسْرَفُوا۟ عَلَىٰٓ أَنفُسِهِمْ لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ ۚ إِنَّ ٱللَّهَ يَغْفِرُ ٱلذُّنُوبَ جَمِيعًا ۚ إِنَّهُۥ هُوَ ٱلْغَفُورُ ٱلرَّحِيمُ ﴿53﴾',
    translation: 'Say: "O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins. He is truly the Forgiving, the Merciful."',
    ref: 'Az-Zumar 39:53',
  },
  {
    arabic: 'قُلْ إِن كُنتُمْ تُحِبُّونَ ٱللَّهَ فَٱتَّبِعُونِى يُحْبِبْكُمُ ٱللَّهُ وَيَغْفِرْ لَكُمْ ذُنُوبَكُمْ ۗ وَٱللَّهُ غَفُورٌۭ رَّحِيمٌۭ ﴿31﴾',
    translation: 'Say: "If you love Allah, then follow me; Allah will love you and forgive you your sins." And Allah is Forgiving, Merciful.',
    ref: 'Aal-Imran 3:31',
  },
  {
    arabic: 'قَالَ يَٰقَوْمِ أَرَءَيْتُمْ إِن كُنتُ عَلَىٰ بَيِّنَةٍۢ مِّن رَّبِّى وَرَزَقَنِى مِنْهُ رِزْقًا حَسَنًۭا ۚ وَمَآ أُرِيدُ أَنْ أُخَالِفَكُمْ إِلَىٰ مَآ أَنْهَىٰكُمْ عَنْهُ ۚ إِنْ أُرِيدُ إِلَّا ٱلْإِصْلَٰحَ مَا ٱسْتَطَعْتُ ۚ وَمَا تَوْفِيقِىٓ إِلَّا بِٱللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ ﴿88﴾',
    translation: 'He said, "O my people, have you considered: if I am upon clear evidence from my Lord, and He has provided me with good provision from Himself...? I do not intend to differ from you in what I have forbidden you; I only intend reform as much as I am able. My success is not but through Allah. Upon Him I have relied, and to Him I turn."',
    ref: 'Hud 11:88',
  },
  {
    arabic: 'يَٰبَنِىَّ ٱذْهَبُوا۟ فَتَحَسَّسُوا۟ مِن يُوسُفَ وَأَخِيهِ وَلَا تَا۟يْـَٔسُوا۟ مِن رَّوْحِ ٱللَّهِ ۖ إِنَّهُۥ لَا يَا۟يْـَٔسُ مِن رَّوْحِ ٱللَّهِ إِلَّا ٱلْقَوْمُ ٱلْكَٰفِرُونَ ﴿87﴾',
    translation: 'O my sons, go and search for Joseph and his brother, and do not despair of relief from Allah. Indeed, no one despairs of relief from Allah except the disbelieving people.',
    ref: 'Yusuf 12:87',
  },
  {
    arabic: 'لَهُۥ مُعَقِّبَٰتٌۭ مِّنۢ بَيْنِ يَدَيْهِ وَمِنْ خَلْفِهِۦ يَحْفَظُونَهُۥ مِنْ أَمْرِ ٱللَّهِ ۗ إِنَّ ٱللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا۟ مَا بِأَنفُسِهِمْ ۗ وَإِذَآ أَرَادَ ٱللَّهُ بِقَوْمٍۢ سُوٓءًۭا فَلَا مَرَدَّ لَهُۥ ۚ وَمَا لَهُم مِّن دُونِهِۦ مِن وَالٍ ﴿11﴾',
    translation: 'For each one are angels in succession, before him and behind him, protecting him by the decree of Allah. Indeed, Allah will not change the condition of a people until they change what is within themselves. And when Allah intends ill for a people, there is no turning it back, nor do they have any protector besides Him.',
    ref: 'Ar-Ra\'d 13:11',
  },
  {
    arabic: 'وَءَاتَىٰكُم مِّن كُلِّ مَا سَأَلْتُمُوهُ ۚ وَإِن تَعُدُّوا۟ نِعْمَتَ ٱللَّهِ لَا تُحْصُوهَآ ۗ إِنَّ ٱلْإِنسَٰنَ لَظَلُومٌۭ كَفَّارٌۭ ﴿34﴾',
    translation: 'And He gave you from all that you asked of Him. And if you tried to count the blessings of Allah, you could never number them. Indeed, mankind is deeply unjust and ungrateful.',
    ref: 'Ibrahim 14:34',
  },
  {
    arabic: 'وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوٓا۟ إِلَّآ إِيَّاهُ وَبِٱلْوَٰلِدَيْنِ إِحْسَٰنًا ۚ إِمَّا يَبْلُغَنَّ عِندَكَ ٱلْكِبَرَ أَحَدُهُمَآ أَوْ كِلَاهُمَا فَلَا تَقُل لَّهُمَآ أُفٍّۢ وَلَا تَنْهَرْهُمَا وَقُل لَّهُمَا قَوْلًۭا كَرِيمًۭا ﴿23﴾',
    translation: 'And your Lord has decreed that you worship none but Him, and that you be kind to your parents. Whether one or both of them reach old age with you, do not say to them any word of contempt, nor repel them, but speak to them a noble word.',
    ref: 'Al-Isra 17:23',
  },
  {
    arabic: 'وَٱخْفِضْ لَهُمَا جَنَاحَ ٱلذُّلِّ مِنَ ٱلرَّحْمَةِ وَقُل رَّبِّ ٱرْحَمْهُمَا كَمَا رَبَّيَانِى صَغِيرًۭا ﴿24﴾',
    translation: 'And lower to them the wing of humility out of mercy, and say: "My Lord, have mercy upon them as they raised me when I was small."',
    ref: 'Al-Isra 17:24',
  },
  {
    arabic: 'وَنُنَزِّلُ مِنَ ٱلْقُرْءَانِ مَا هُوَ شِفَآءٌۭ وَرَحْمَةٌۭ لِّلْمُؤْمِنِينَ ۙ وَلَا يَزِيدُ ٱلظَّٰلِمِينَ إِلَّا خَسَارًۭا ﴿82﴾',
    translation: 'And We send down of the Quran that which is a healing and a mercy for the believers, but it increases the wrongdoers only in loss.',
    ref: 'Al-Isra 17:82',
  },
  {
    arabic: 'إِنَّ ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ سَيَجْعَلُ لَهُمُ ٱلرَّحْمَٰنُ وُدًّۭا ﴿96﴾',
    translation: 'Indeed, those who believe and do righteous deeds — the Most Merciful will bestow upon them love.',
    ref: 'Maryam 19:96',
  },
  {
    arabic: 'فَتَعَٰلَى ٱللَّهُ ٱلْمَلِكُ ٱلْحَقُّ ۗ وَلَا تَعْجَلْ بِٱلْقُرْءَانِ مِن قَبْلِ أَن يُقْضَىٰٓ إِلَيْكَ وَحْيُهُۥ ۖ وَقُل رَّبِّ زِدْنِى عِلْمًۭا ﴿114﴾',
    translation: 'So exalted is Allah, the True Sovereign. Do not hasten with the Quran before its revelation is completed to you, and say: "My Lord, increase me in knowledge."',
    ref: 'Ta-Ha 20:114',
  },
  {
    arabic: 'وَقَالَ رَبُّكُمُ ٱدْعُونِىٓ أَسْتَجِبْ لَكُمْ ۚ إِنَّ ٱلَّذِينَ يَسْتَكْبِرُونَ عَنْ عِبَادَتِى سَيَدْخُلُونَ جَهَنَّمَ دَاخِرِينَ ﴿60﴾',
    translation: 'And your Lord says: "Call upon Me; I will respond to you." Indeed, those who are too arrogant to worship Me will enter Hell, utterly humbled.',
    ref: 'Ghafir 40:60',
  },
  {
    arabic: 'وَٱكْتُبْ لَنَا فِى هَٰذِهِ ٱلدُّنْيَا حَسَنَةًۭ وَفِى ٱلْءَاخِرَةِ إِنَّا هُدْنَآ إِلَيْكَ ۚ قَالَ عَذَابِىٓ أُصِيبُ بِهِۦ مَنْ أَشَآءُ ۖ وَرَحْمَتِى وَسِعَتْ كُلَّ شَىْءٍۢ ۚ فَسَأَكْتُبُهَا لِلَّذِينَ يَتَّقُونَ وَيُؤْتُونَ ٱلزَّكَوٰةَ وَٱلَّذِينَ هُم بِـَٔايَٰتِنَا يُؤْمِنُونَ ﴿156﴾',
    translation: 'And ordain for us good in this world, and in the Hereafter. Indeed, we have turned back to You. Allah said, "My punishment — I afflict with it whom I will, but My mercy encompasses all things. I will ordain it for those who are mindful of Allah, give zakah, and believe in Our verses."',
    ref: 'Al-A\'raf 7:156',
  },
  {
    arabic: 'يَكَادُ ٱلْبَرْقُ يَخْطَفُ أَبْصَٰرَهُمْ ۖ كُلَّمَآ أَضَآءَ لَهُم مَّشَوْا۟ فِيهِ وَإِذَآ أَظْلَمَ عَلَيْهِمْ قَامُوا۟ ۚ وَلَوْ شَآءَ ٱللَّهُ لَذَهَبَ بِسَمْعِهِمْ وَأَبْصَٰرِهِمْ ۚ إِنَّ ٱللَّهَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌۭ ﴿20﴾',
    translation: 'The lightning almost snatches away their sight. Whenever it flashes for them, they walk on; but when it darkens over them, they stand still. Had Allah willed, He could have taken away their hearing and their sight. Indeed, Allah has power over all things.',
    ref: 'Al-Baqarah 2:20',
  },
  {
    arabic: 'وَمَنْ أَحْسَنُ قَوْلًۭا مِّمَّن دَعَآ إِلَى ٱللَّهِ وَعَمِلَ صَٰلِحًۭا وَقَالَ إِنَّنِى مِنَ ٱلْمُسْلِمِينَ ﴿33﴾',
    translation: 'And who is better in speech than one who calls to Allah, does righteous deeds, and says, "Indeed, I am of the Muslims"?',
    ref: 'Fussilat 41:33',
  },
  {
    arabic: 'يَٰٓأَيُّهَا ٱلنَّاسُ إِنَّا خَلَقْنَٰكُم مِّن ذَكَرٍۢ وَأُنثَىٰ وَجَعَلْنَٰكُمْ شُعُوبًۭا وَقَبَآئِلَ لِتَعَارَفُوٓا۟ ۚ إِنَّ أَكْرَمَكُمْ عِندَ ٱللَّهِ أَتْقَىٰكُمْ ۚ إِنَّ ٱللَّهَ عَلِيمٌ خَبِيرٌۭ ﴿13﴾',
    translation: 'O humanity, We created you from a male and a female, and made you into nations and tribes so that you may know one another. Indeed, the most noble of you in the sight of Allah is the most righteous of you. Indeed, Allah is All-Knowing, All-Aware.',
    ref: 'Al-Hujurat 49:13',
  },
  {
    arabic: 'وَذَكِّرْ فَإِنَّ ٱلذِّكْرَىٰ تَنفَعُ ٱلْمُؤْمِنِينَ ﴿55﴾',
    translation: 'And remind, for indeed, the reminder benefits the believers.',
    ref: 'Adh-Dhariyat 51:55',
  },
  {
    arabic: 'وَمَا خَلَقْتُ ٱلْجِنَّ وَٱلْإِنسَ إِلَّا لِيَعْبُدُونِ ﴿56﴾',
    translation: 'And I did not create the jinn and mankind except to worship Me.',
    ref: 'Adh-Dhariyat 51:56',
  },
  {
    arabic: 'وَلَقَدْ يَسَّرْنَا ٱلْقُرْءَانَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍۢ ﴿17﴾',
    translation: 'And We have made the Quran easy to remember — so is there anyone who will be mindful?',
    ref: 'Al-Qamar 54:17',
  },
  {
    arabic: 'فَبِأَىِّ ءَالَآءِ رَبِّكُمَا تُكَذِّبَانِ ﴿13﴾',
    translation: 'So which of the favors of your Lord would you deny?',
    ref: 'Ar-Rahman 55:13',
  },
  {
    arabic: 'ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ ﴿1﴾',
    translation: 'Read in the name of your Lord who created.',
    ref: 'Al-Alaq 96:1',
  },
  {
    arabic: 'سَلَٰمٌ هِىَ حَتَّىٰ مَطْلَعِ ٱلْفَجْرِ ﴿5﴾',
    translation: 'It is peace until the emergence of dawn.',
    ref: 'Al-Qadr 97:5',
  },
  {
    arabic: 'وَٱلْعَصْرِ إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ ﴿1-3﴾',
    translation: 'By time, indeed mankind is in loss — except for those who believe, do righteous deeds, and urge one another to truth and urge one another to patience.',
    ref: 'Al-Asr 103:1-3',
  },
  {
    arabic: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ ٱللَّهُ ٱلصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ ﴿1-4﴾',
    translation: 'Say: "He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent."',
    ref: 'Al-Ikhlas 112:1-4',
  },
  {
    arabic: 'وَلَنَبْلُوَنَّكُم بِشَىْءٍۢ مِّنَ ٱلْخَوْفِ وَٱلْجُوعِ وَنَقْصٍۢ مِّنَ ٱلْأَمْوَٰلِ وَٱلْأَنفُسِ وَٱلثَّمَرَٰتِ ۗ وَبَشِّرِ ٱلصَّٰبِرِينَ ﴿155﴾',
    translation: 'And We will surely test you with something of fear and hunger and loss of wealth, lives, and fruits — but give good tidings to the patient.',
    ref: 'Al-Baqarah 2:155',
  },
  {
    arabic: 'وَلَمَّا بَرَزُوا۟ لِجَالُوتَ وَجُنُودِهِۦ قَالُوا۟ رَبَّنَآ أَفْرِغْ عَلَيْنَا صَبْرًۭا وَثَبِّتْ أَقْدَامَنَا وَٱنصُرْنَا عَلَى ٱلْقَوْمِ ٱلْكَٰفِرِينَ ﴿250﴾',
    translation: 'And when they went forth to face Goliath and his soldiers, they said: "Our Lord, pour upon us patience, make our steps firm, and give us victory over the disbelieving people."',
    ref: 'Al-Baqarah 2:250',
  },
  {
    arabic: 'وَلَا تُصَعِّرْ خَدَّكَ لِلنَّاسِ وَلَا تَمْشِ فِى ٱلْأَرْضِ مَرَحًا ۖ إِنَّ ٱللَّهَ لَا يُحِبُّ كُلَّ مُخْتَالٍۢ فَخُورٍۢ ﴿18﴾',
    translation: 'And do not turn your cheek in contempt toward people, and do not walk through the earth exultantly. Indeed, Allah does not like anyone self-conceited and boastful.',
    ref: 'Luqman 31:18',
  },
  {
    arabic: 'إِنَّ ٱللَّهَ وَمَلَٰٓئِكَتَهُۥ يُصَلُّونَ عَلَى ٱلنَّبِىِّ ۚ يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ صَلُّوا۟ عَلَيْهِ وَسَلِّمُوا۟ تَسْلِيمًا ﴿56﴾',
    translation: 'Indeed, Allah and His angels send blessings upon the Prophet. O you who believe, ask Allah to bless him and grant him peace.',
    ref: 'Al-Ahzab 33:56',
  },
  {
    arabic: 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ كُتِبَ عَلَيْكُمُ ٱلصِّيَامُ كَمَا كُتِبَ عَلَى ٱلَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ ﴿183﴾',
    translation: 'O you who believe, fasting has been decreed for you, as it was decreed for those before you, so that you may attain righteousness.',
    ref: 'Al-Baqarah 2:183',
  },
  {
    arabic: 'كُلُّ نَفْسٍۢ ذَآئِقَةُ ٱلْمَوْتِ ۖ ثُمَّ إِلَيْنَا تُرْجَعُونَ ﴿57﴾',
    translation: 'Every soul will taste death. Then to Us you will be returned.',
    ref: 'Al-Ankabut 29:57',
  },
  {
    arabic: 'وَٱسْتَغْفِرُوا۟ رَبَّكُمْ ثُمَّ تُوبُوٓا۟ إِلَيْهِ ۚ إِنَّ رَبِّى رَحِيمٌۭ وَدُودٌۭ ﴿90﴾',
    translation: 'And ask forgiveness of your Lord and then repent to Him. Indeed, my Lord is Merciful and Loving.',
    ref: 'Hud 11:90',
  },
  {
    arabic: 'قُلْ سِيرُوا۟ فِى ٱلْأَرْضِ فَٱنظُرُوا۟ كَيْفَ بَدَأَ ٱلْخَلْقَ ۚ ثُمَّ ٱللَّهُ يُنشِئُ ٱلنَّشْأَةَ ٱلْءَاخِرَةَ ۚ إِنَّ ٱللَّهَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌۭ ﴿20﴾',
    translation: 'Say, [O Muhammad], "Travel through the land and observe how He began creation. Then Allah will produce the final creation. Indeed Allah, over all things, is competent."',
    ref: 'Al-Ankabut 29:20',
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

  // Fallback (all shown — shouldn't happen since POOL_SIZE stays well above HISTORY_WINDOW)
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
