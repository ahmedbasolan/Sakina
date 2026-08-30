# Death Awareness Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author and unlock `path_death_awareness` — a 7-day Sakina Pro journey that turns remembrance of death (*dhikr al-mawt*) from dread into a driver for a deliberate life.

**Architecture:** Additive content on the existing journey rails. Each day is a `PathStep` pointer in `src/data/staticPaths.ts` → a `ContentAngle` (`q_angle_death_dayN`) in `src/data/quranData.ts` carrying the lesson prose + `practiceSteps` JSON + `reflection`, plus a `Content` verse and (5 of 7 days) a `Content` hadith. No new components, screens, types, or DB columns. Rendering is `PathStepScreen` → `hadith?` → `verse` → `context` → `practice` → `reflection`.

**Tech Stack:** TypeScript, React Native (Expo), SQLite seeded from TS data files via `src/database/seedContent.ts` (`SEED_VERSION` gate). Verification: `npx tsc`, `npx jest`, and the repo's `scripts/verify-*.mjs` (need network + `curl`).

**Spec:** `docs/superpowers/specs/2026-08-29-death-awareness-journey-design.md` — read it before starting. The scholarly review that shaped it is in that spec's §"The scholarly frame"; every framing rule there is binding on the prose.

## Global Constraints

- **`src/data/quranData.ts` and `src/data/staticPaths.ts` are CRLF.** Preserve `\r\n`. Never run `prettier --write` on `quranData.ts` (not prettier-clean — a format run buries the change).
- **Never use `node -e` to *edit* `quranData.ts`** (shell quoting mangles Arabic). Read-only `node -e` checks are fine. For edits, use the Edit tool or a script written to a file.
- **All `id:` fields use SINGLE quotes** — `verify-journey.mjs`'s `objectAt` matches a literal `id: '…'`. A `JSON.stringify`'d `id: "…"` is invisible to it (surfaces as "angle missing / day borrows a mood angle", dozens of misleading failures).
- **`[Tafsir <name> on <surah>:<ayah>]` tag at the VERY START of every `angle` string.** Mid-sentence it strips to a stranded space before punctuation. `<name>` ∈ {`Ibn Kathir`, `al-Qurtubi`, `al-Sa'di`, `al-Baghawi`, `al-Tabari`} (case per `scripts/verify-tafsir-tags.mjs` `RESOURCES`).
- **Every `angle` string must contain one `ContextLayer.splitIntoSections` pattern** so Understand/Matters splits where intended: one of `. When you`, `. Your `, `. The Prophet ﷺ said:`, `. Notice `, `. This is `, `. And when `.
- **`practiceSteps`:** JSON string (via `JSON.stringify([...])`). Per step: `type` ∈ {`mindset`,`physical`,`verbal`}; `icon` ∈ the `IconName` union in `src/components/Icon.tsx` (valid names used here: `light-bulb`, `calm-face`, `hands-prayer`, `target`, `eye`, `book-quran`, `clock`, `pen`, `moon`, `sunrise`, `compass`, `arrow-right`, `gift`, `honey`, `heart`, `sun`, `shield`, `candle`); `sourceType` (optional) ∈ {`quran_dua`,`prophetic_dua`,`prophetic_dhikr`,`sunnah_action`,`composed_dua`}. 3–6 steps per day. **`sourceType` only on a step that carries transmitted Arabic** — never on an app-written instruction.
- **Citations:** never write an āyah, a hadith number, or Arabic diacritics from memory. Re-verify against `api.alquran.cloud` (verses) / `sunnah.com` or the `fawazahmed0/hadith-api` mirror (hadith). The **mirror renumbers Ṣaḥīḥ Muslim** — use `sunnah.com` for Muslim 1631.
- **Theme:** `Hopeful` (a real `Mood` union member). All 7 angles carry `mood: 'Hopeful'`; the `JOURNEYS` row uses `'Hopeful'`.
- **Gating:** Sakina Pro exclusive — `PREMIUM_GATED_PATHS['path_death_awareness'] = 'Sakina Pro exclusive'`.
- **Never romanticise dying** (Bukhārī 6351 / Muslim 2680). Days 5–7 carry one quiet, non-alarming line pointing a reader whose thoughts turn toward not wanting to be alive to the Hope journey / in-app resources.
- **Commit after every task.** Branch: `feat/death-awareness-journey` (already created off `cdc460f`).

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `src/data/quranData.ts` | Content verses + `ContentAngle` lesson bodies | Add 5 `Content` (Quran) rows to `quranContentData` (ends ~line 3591); add 7 `ContentAngle` rows to `quranContentAnglesData` (ends ~line 17606, before `export {`) |
| `src/data/hadithData.ts` | `Content` (Hadith) rows | Add 5 rows to `hadithContent` (before final `];`) |
| `src/data/staticPaths.ts` | `SpiritualPath` catalogue | `path_death_awareness`: `theme` → `'Hopeful'`, `dailySteps` → 7 entries |
| `src/services/contentRepository.ts` | mood-picker query exclusion | Add `'death'` to `JOURNEY_ANGLE_PREFIXES` |
| `src/screens/PathsScreen.tsx` | availability + Pro-gating | `AVAILABLE_PATHS` + `PREMIUM_GATED_PATHS` + header doc comment |
| `src/database/seedContent.ts` | seed version gate | `SEED_VERSION` 35 → 36 + `// v36:` note |
| `scripts/verify-journey.mjs` | static journey checks | Add row to `JOURNEYS` |
| `scripts/verify-journey-roundtrip.mjs` | DB round-trip check | Add `'path_death_awareness'` to path list (~line 104) |

`src/constants/pathVisuals.ts` already covers `path_death_awareness` — **no edit**.

---

## Verified source data (use verbatim; re-verify before committing each task)

### Verses — `arabicText` is `quran-uthmani` from `api.alquran.cloud`; append ` ﴿<n>﴾` per the file's existing style (see `quran_67_2`). `primaryText` = `transliteration`.

**3:185** (Day 1, NEW `quran_3_185`)
- AR: `كُلُّ نَفْسٍۢ ذَآئِقَةُ ٱلْمَوْتِ ۗ وَإِنَّمَا تُوَفَّوْنَ أُجُورَكُمْ يَوْمَ ٱلْقِيَٰمَةِ ۖ فَمَن زُحْزِحَ عَنِ ٱلنَّارِ وَأُدْخِلَ ٱلْجَنَّةَ فَقَدْ فَازَ ۗ وَمَا ٱلْحَيَوٰةُ ٱلدُّنْيَآ إِلَّا مَتَٰعُ ٱلْغُرُورِ`
- Translit: `Kullu nafsin dhāʾiqatu l-mawt; wa innamā tuwaffawna ujūrakum yawma l-qiyāmah; faman zuḥziḥa ʿani n-nāri wa udkhila l-jannata faqad fāz; wa mā l-ḥayātu d-dunyā illā matāʿu l-ghurūr`
- EN (Sahih Intl): "Every soul will taste death, and you will only be given your full compensation on the Day of Resurrection. So he who is drawn away from the Fire and admitted to Paradise has attained [his desire]. And what is the life of this world except the enjoyment of delusion."
- `source: 'Surah Ali \'Imran 3:185'`, `audioKey: '3:185'`

**39:42** (Day 4, NEW `quran_39_42`)
- AR: `ٱللَّهُ يَتَوَفَّى ٱلْأَنفُسَ حِينَ مَوْتِهَا وَٱلَّتِى لَمْ تَمُتْ فِى مَنَامِهَا ۖ فَيُمْسِكُ ٱلَّتِى قَضَىٰ عَلَيْهَا ٱلْمَوْتَ وَيُرْسِلُ ٱلْأُخْرَىٰٓ إِلَىٰٓ أَجَلٍۢ مُّسَمًّى ۚ إِنَّ فِى ذَٰلِكَ لَءَايَٰتٍۢ لِّقَوْمٍۢ يَتَفَكَّرُونَ`
- Translit: `Allāhu yatawaffā l-anfusa ḥīna mawtihā wallatī lam tamut fī manāmihā; fa-yumsiku llatī qaḍā ʿalayhā l-mawta wa yursilu l-ukhrā ilā ajalin musammā; inna fī dhālika la-āyātin li-qawmin yatafakkarūn`
- EN (Sahih Intl): "Allah takes the souls at the time of their death, and those that do not die [He takes] during their sleep. Then He keeps those for which He has decreed death and releases the others for a specified term. Indeed in that are signs for a people who give thought."
- `source: 'Surah Az-Zumar 39:42'`, `audioKey: '39:42'`

**63:10** (Day 5, NEW `quran_63_10`)
- AR: `وَأَنفِقُوا۟ مِن مَّا رَزَقْنَٰكُم مِّن قَبْلِ أَن يَأْتِىَ أَحَدَكُمُ ٱلْمَوْتُ فَيَقُولَ رَبِّ لَوْلَآ أَخَّرْتَنِىٓ إِلَىٰٓ أَجَلٍۢ قَرِيبٍۢ فَأَصَّدَّقَ وَأَكُن مِّنَ ٱلصَّٰلِحِينَ`
- Translit: `Wa anfiqū min mā razaqnākum min qabli an yaʾtiya aḥadakumu l-mawtu fa-yaqūla rabbi lawlā akhkhartanī ilā ajalin qarībin fa-aṣṣaddaqa wa akun mina ṣ-ṣāliḥīn`
- EN (Sahih Intl): "And spend [in the way of Allah] from what We have provided you before death approaches one of you and he says, 'My Lord, if only You would delay me for a brief term so I would give charity and be among the righteous.'"
- `source: 'Surah Al-Munafiqun 63:10'`, `audioKey: '63:10'`

**36:12** (Day 6, NEW `quran_36_12`)
- AR: `إِنَّا نَحْنُ نُحْىِ ٱلْمَوْتَىٰ وَنَكْتُبُ مَا قَدَّمُوا۟ وَءَاثَٰرَهُمْ ۚ وَكُلَّ شَىْءٍ أَحْصَيْنَٰهُ فِىٓ إِمَامٍۢ مُّبِينٍۢ`
- Translit: `Innā naḥnu nuḥyi l-mawtā wa naktubu mā qaddamū wa āthārahum; wa kulla shayʾin aḥṣaynāhu fī imāmin mubīn`
- EN (Sahih Intl): "Indeed, it is We who bring the dead to life and record what they have put forth and what they left behind, and all things We have enumerated in a clear register."
- `source: 'Surah Ya-Sin 36:12'`, `audioKey: '36:12'`

**29:5** (Day 7, NEW `quran_29_5`)
- AR: `مَن كَانَ يَرْجُوا۟ لِقَآءَ ٱللَّهِ فَإِنَّ أَجَلَ ٱللَّهِ لَءَاتٍۢ ۚ وَهُوَ ٱلسَّمِيعُ ٱلْعَلِيمُ`
- Translit: `Man kāna yarjū liqāʾa llāhi fa-inna ajala llāhi la-āt; wa huwa s-samīʿu l-ʿalīm`
- EN (Sahih Intl): "Whoever should hope for the meeting with Allah - indeed, the term decreed by Allah is coming. And He is the Hearing, the Knowing."
- `source: 'Surah Al-\'Ankabut 29:5'`, `audioKey: '29:5'`

**Reused (no change):** `quran_67_2` (Day 2 — already `moods: ['Hopeful']`), `quran_102_1_2` (Day 3).

### Du'a text used in `practiceSteps`

- **3:193 tail** (Day 1, `quran_dua`, `source: 'Quran 3:193'`): `رَبَّنَا فَٱغْفِرْ لَنَا ذُنُوبَنَا وَكَفِّرْ عَنَّا سَيِّـَٔاتِنَا وَتَوَفَّنَا مَعَ ٱلْأَبْرَارِ` — "Rabbanā faghfir lanā dhunūbanā wa kaffir ʿannā sayyiʾātinā wa tawaffanā maʿa l-abrār" — "Our Lord, forgive us our sins and remove from us our misdeeds, and cause us to die with the righteous." (verbatim tail of 3:193 — verified)
- **25:74** (Day 6, `quran_dua`, `source: 'Quran 25:74'`): `رَبَّنَا هَبْ لَنَا مِنْ أَزْوَٰجِنَا وَذُرِّيَّٰتِنَا قُرَّةَ أَعْيُنٍۢ وَٱجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا` — "Rabbanā hab lanā min azwājinā wa dhurriyyātinā qurrata aʿyunin wa-jʿalnā lil-muttaqīna imāmā" — "Our Lord, grant us from our spouses and offspring comfort of eyes, and make us a model for the righteous."

### Hadith — full Arabic matn extracted from the `ara-*` mirror (re-verify at implementation). English = published translation from the `eng-*` mirror / sunnah.com.

**Tirmidhī 2307** (Day 3, `hadith_death_3`, `hasan`, Abū Hurayra)
- AR (matn): `أَكْثِرُوا ذِكْرَ هَاذِمِ اللَّذَّاتِ` — *yaʿnī l-mawt*
- Translit: `Akthirū dhikra hādhimi l-ladhdhāt` (yaʿnī l-mawt)
- EN (sunnah.com): "Increase in remembrance of the severer of pleasures." Meaning death.
- `source: 'Jami\' at-Tirmidhi 2307'`, grading `hasan` (Tirmidhī: *ḥasan gharīb*; al-Albānī: ḥasan)

**Ṣaḥīḥ al-Bukhārī 6324** (Day 4, `hadith_death_4`, `sahih`, Ḥudhayfa)
- AR (matn): `كَانَ النَّبِيُّ صلى الله عليه وسلم إِذَا أَرَادَ أَنْ يَنَامَ قَالَ ‏"‏ بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا ‏"‏ وَإِذَا اسْتَيْقَظَ مِنْ مَنَامِهِ قَالَ ‏"‏ الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ ‏"‏`
- EN: "Whenever the Prophet ﷺ intended to go to bed, he would say: 'Bismika Allāhumma amūtu wa aḥyā' (With Your name, O Allah, I die and I live). And when he woke up he would say: 'Al-ḥamdu lillāhi-lladhī aḥyānā baʿda mā amātanā wa ilayhi n-nushūr' (All praise is for Allah who gave us life after causing us to die, and to Him is the resurrection)."
- `source: 'Sahih al-Bukhari 6324'`, grading `sahih`

**Ṣaḥīḥ al-Bukhārī 6416** (Day 5, `hadith_death_5`, `sahih`, Ibn ʿUmar)
- AR (matn): `أَخَذَ رَسُولُ اللَّهِ صلى الله عليه وسلم بِمَنْكِبِي فَقَالَ ‏"‏ كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيلٍ ‏"‏`
- Ibn ʿUmar's addition (**mawqūf** — put in `whyThis`, attribute to Ibn ʿUmar): `وَكَانَ ابْنُ عُمَرَ يَقُولُ إِذَا أَمْسَيْتَ فَلاَ تَنْتَظِرِ الصَّبَاحَ وَإِذَا أَصْبَحْتَ فَلاَ تَنْتَظِرِ الْمَسَاءَ وَخُذْ مِنْ صِحَّتِكَ لِمَرَضِكَ وَمِنْ حَيَاتِكَ لِمَوْتِكَ`
- EN: "Allah's Messenger ﷺ took hold of my shoulder and said, 'Be in this world as if you were a stranger or a traveler.' Ibn ʿUmar used to say: 'If you survive till the evening, do not expect to be alive in the morning; and if you survive till the morning, do not expect to be alive in the evening; take from your health for your sickness, and from your life for your death.'"
- `source: 'Sahih al-Bukhari 6416'`, grading `sahih`

**Ṣaḥīḥ al-Bukhārī 6514** (Day 5 step 4 — cited in a practice-step `source` only, NOT a hadith row; Anas): "When carried to his grave, a dead person is followed by three: two of which return and one remains with him — his relatives, his property, and his deeds; relatives and property go back, his deeds remain." `source: 'Sahih al-Bukhari 6514'`

**Ṣaḥīḥ al-Bukhārī 2738** (Day 5 step 2 — practice-step `source` only; Ibn ʿUmar): "It is not permissible for any Muslim who has something to will to stay for two nights without having his last will and testament written and kept ready with him." `source: 'Sahih al-Bukhari 2738 / Sahih Muslim 1627'`

**Ṣaḥīḥ Muslim 1631** (Day 6, `hadith_death_6`, `sahih`, Abū Hurayra — **verify on sunnah.com, NOT the mirror**)
- AR (matn): `إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ إِلاَّ مِنْ صَدَقَةٍ جَارِيَةٍ أَوْ عِلْمٍ يُنْتَفَعُ بِهِ أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ`
- Translit: `Idhā māta l-insānu nqaṭaʿa ʿanhu ʿamaluhu illā min thalāthah: illā min ṣadaqatin jāriyah, aw ʿilmin yuntafaʿu bih, aw waladin ṣāliḥin yadʿū lah`
- EN (sunnah.com): "When a man dies, his acts come to an end, but three: recurring charity, or knowledge (by which people) benefit, or a pious child, who prays for him (for the deceased)."
- `source: 'Sahih Muslim 1631'`, grading `sahih`

**Ṣaḥīḥ al-Bukhārī 6507** (Day 7, `hadith_death_7`, `sahih`, ʿUbāda b. aṣ-Ṣāmit) — **quote the clarification in full**
- AR (matn): `مَنْ أَحَبَّ لِقَاءَ اللَّهِ أَحَبَّ اللَّهُ لِقَاءَهُ وَمَنْ كَرِهَ لِقَاءَ اللَّهِ كَرِهَ اللَّهُ لِقَاءَهُ ‏.‏ قَالَتْ عَائِشَةُ أَوْ بَعْضُ أَزْوَاجِهِ إِنَّا لَنَكْرَهُ الْمَوْتَ ‏.‏ قَالَ لَيْسَ ذَاكَ وَلَكِنَّ الْمُؤْمِنَ إِذَا حَضَرَهُ الْمَوْتُ بُشِّرَ بِرِضْوَانِ اللَّهِ وَكَرَامَتِهِ فَلَيْسَ شَىْءٌ أَحَبَّ إِلَيْهِ مِمَّا أَمَامَهُ فَأَحَبَّ لِقَاءَ اللَّهِ وَأَحَبَّ اللَّهُ لِقَاءَهُ`
- EN: "Whoever loves to meet Allah, Allah loves to meet him; and whoever hates to meet Allah, Allah hates to meet him. ʿĀʾisha, or some of the wives of the Prophet ﷺ, said: 'But we dislike death.' He said: 'It is not like this. Rather, when the time of death of a believer approaches, he receives the good news of Allah's pleasure and His honour, so nothing is dearer to him than what is ahead of him. He therefore loves the meeting with Allah, and Allah loves the meeting with him.'"
- `source: 'Sahih al-Bukhari 6507'`, grading `sahih`

**Ṣaḥīḥ al-Bukhārī 6351** (Day 7 du'a — `prophetic_dua`, Anas)
- AR (du'a): `اللَّهُمَّ أَحْيِنِي مَا كَانَتِ الْحَيَاةُ خَيْرًا لِي وَتَوَفَّنِي إِذَا كَانَتِ الْوَفَاةُ خَيْرًا لِي`
- Translit: `Allāhumma aḥyinī mā kānati l-ḥayātu khayran lī, wa tawaffanī idhā kānati l-wafātu khayran lī`
- EN: "O Allah, keep me alive as long as life is better for me, and take my life when death is better for me."
- `source: 'Sahih al-Bukhari 6351'`, `sourceType: 'prophetic_dua'`

**Sunan Ibn Mājah 925** (Day 2 du'a — `prophetic_dua`, Umm Salama)
- AR (du'a): `اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلاً مُتَقَبَّلاً`
- Translit: `Allāhumma innī asʾaluka ʿilman nāfiʿan, wa rizqan ṭayyiban, wa ʿamalan mutaqabbalā`
- EN: "O Allah, I ask You for beneficial knowledge, goodly provision, and accepted deeds."
- `source: 'Sunan Ibn Majah 925'`, grading `hasan`, `sourceType: 'prophetic_dua'`

**Sunan Abī Dāwūd 1522** (Day 3 du'a — `prophetic_dua`, Muʿādh b. Jabal)
- AR (du'a): `اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ`
- Translit: `Allāhumma aʿinnī ʿalā dhikrika wa shukrika wa ḥusni ʿibādatik`
- EN: "O Allah, help me to remember You, to thank You, and to worship You well."
- `source: 'Sunan Abi Dawud 1522'`, grading `sahih`, `sourceType: 'prophetic_dua'`

**Ṣaḥīḥ al-Bukhārī 6413** (Day 5 du'a — `prophetic_dhikr`, Anas; famous clause of a longer trench-day du'a)
- AR (clause): `اللَّهُمَّ لاَ عَيْشَ إِلاَّ عَيْشُ الآخِرَةِ`
- Translit: `Allāhumma lā ʿaysha illā ʿayshu l-ākhirah`
- EN: "O Allah, there is no life except the life of the Hereafter."
- `source: 'Sahih al-Bukhari 6413'`, `sourceType: 'prophetic_dhikr'`

### Tafsir tags (all verified to resolve with substantive on-āyah text via `api.quran.com/api/v4/tafsirs/{id}/by_ayah/{key}`)

| Day | Tag | Resource | What the entry actually says (confirmed) |
|---|---|---|---|
| 1 | `[Tafsir Ibn Kathir on 3:185]` | 169 en | "Every Soul Shall Taste Death… This Ayah comforts all creation"; *zuḥziḥa ʿani n-nār* = the only success; whip-space-in-Paradise hadith |
| 2 | `[Tafsir Ibn Kathir on 67:2]` | 169 en | "best in deeds… Allah did not say 'which of you does the most deeds'" (Muḥammad b. ʿAjlān); some read the āyah as proof death is a created entity |
| 2 (step) | `[Tafsir Ibn Kathir on 18:110]` | 169 en | riyāʾ passage — the ḥadīth qudsī: a deed done to be seen is handed to the one it was performed for |
| 3 | `[Tafsir Ibn Kathir on 102:1]` | 169 en | "The Result of Loving the World and Heedlessness of the Hereafter" (grouped 1–2) |
| 4 | `[Tafsir al-Qurtubi on 39:42]` | 90 ar | four *masāʾil* on *al-wafāt al-kubrā* (death) vs *al-wafāt al-ṣughrā* (sleep) |
| 5 | `[Tafsir Ibn Kathir on 63:10]` | 169 en | "The Importance of not being too concerned with the Matters of the Worldly Life, and being Charitable" |
| 6 | `[Tafsir al-Qurtubi on 36:12]` | 90 ar | *kutub al-āthār*; *sabab* = Banū Salima and the reward of footsteps to the masjid |
| 7 | `[Tafsir Ibn Kathir on 29:5]` | 169 en | "Allah will fulfill the Hopes of the Righteous… whoever hopes for the meeting **and does righteous deeds**" |

---

### Task 1: Skeleton — `staticPaths.ts` theme + dailySteps

**Files:**
- Modify: `src/data/staticPaths.ts` (the `path_death_awareness` object, currently ~lines 847–857)

**Interfaces:**
- Produces: `path_death_awareness.dailySteps` — 7 `PathStep` with ids `step_death_1..7`, each `contentId` / `angleId` / `hadithContentId?` as below. Later tasks create the referenced `quran_*` / `q_angle_death_*` / `hadith_death_*` ids.

The referenced ids do not exist yet — that is fine, `staticPaths.ts` has no import-time validation of them, and `verify-journey.mjs` does not check this path until Task 9.

- [ ] **Step 1: Replace the `path_death_awareness` object**

Find the object with `id: 'path_death_awareness'`. Replace `theme: 'Overwhelmed',` with `theme: 'Hopeful',`. Replace `dailySteps: [],` with:

```ts
    dailySteps: [
      {
        id: 'step_death_1',
        pathId: 'path_death_awareness',
        day: 1,
        title: 'Every Soul Will Taste It',
        focus: 'Death is certain and universal — the fear of it is an honest instinct, not a defect in faith.',
        contentId: 'quran_3_185',
        angleId: 'q_angle_death_day1',
        isCompleted: false,
      },
      {
        id: 'step_death_2',
        pathId: 'path_death_awareness',
        day: 2,
        title: 'Death Was Created on Purpose',
        focus: 'Death is deliberate — it is what makes the test of "best in deed" real.',
        contentId: 'quran_67_2',
        angleId: 'q_angle_death_day2',
        isCompleted: false,
      },
      {
        id: 'step_death_3',
        pathId: 'path_death_awareness',
        day: 3,
        title: 'Remember It Often',
        focus: 'Frequent, brief remembrance of death declutters priorities — it is a prescribed practice, not morbidity.',
        contentId: 'quran_102_1_2',
        angleId: 'q_angle_death_day3',
        hadithContentId: 'hadith_death_3',
        isCompleted: false,
      },
      {
        id: 'step_death_4',
        pathId: 'path_death_awareness',
        day: 4,
        title: 'Sleep Is the Rehearsal',
        focus: 'The Qur\'an puts sleep and death under one verb — every night is a minor death, every morning a returned loan.',
        contentId: 'quran_39_42',
        angleId: 'q_angle_death_day4',
        hadithContentId: 'hadith_death_4',
        isCompleted: false,
      },
      {
        id: 'step_death_5',
        pathId: 'path_death_awareness',
        day: 5,
        title: 'Travel Light',
        focus: 'Hold this world as a traveler holds a bag — the dying wish is always for more time to give, not to own.',
        contentId: 'quran_63_10',
        angleId: 'q_angle_death_day5',
        hadithContentId: 'hadith_death_5',
        isCompleted: false,
      },
      {
        id: 'step_death_6',
        pathId: 'path_death_awareness',
        day: 6,
        title: 'Build the One Thing That Stays',
        focus: 'Two ledgers survive you — what you sent ahead and the traces that keep acting. Start one lasting deed.',
        contentId: 'quran_36_12',
        angleId: 'q_angle_death_day6',
        hadithContentId: 'hadith_death_6',
        isCompleted: false,
      },
      {
        id: 'step_death_7',
        pathId: 'path_death_awareness',
        day: 7,
        title: 'Hope of the Meeting',
        focus: 'The term is coming regardless — the only variable is whether you meet it hoping or dreading.',
        contentId: 'quran_29_5',
        angleId: 'q_angle_death_day7',
        hadithContentId: 'hadith_death_7',
        isCompleted: false,
      },
    ],
```

Keep `duration: 7`, `target: 'Zuhd'`, `isPremium: true`, `tone: 'refuge'`. Do not add `phases`.

- [ ] **Step 2: Verify it parses and is internally consistent**

Run:
```bash
npx tsc --noEmit -p tsconfig.json
```
Expected: PASS (no new errors).

Run:
```bash
node -e "const p=require('./src/data/staticPaths.ts');" 2>/dev/null || node --experimental-strip-types -e "import('./src/data/staticPaths.ts').then(m=>{const d=m.STATIC_SPIRITUAL_PATHS.find(x=>x.id==='path_death_awareness');console.log('theme',d.theme,'| duration',d.duration,'| steps',d.dailySteps.length);if(d.theme!=='Hopeful'||d.dailySteps.length!==7||d.duration!==d.dailySteps.length)process.exit(1)})"
```
Expected: `theme Hopeful | duration 7 | steps 7`. If `--experimental-strip-types` is unavailable, instead grep:
```bash
grep -c "id: 'step_death_" src/data/staticPaths.ts
```
Expected: `7`. And confirm `theme: 'Hopeful'` appears once in that object and no `dailySteps: []` remains for this path.

- [ ] **Step 3: Confirm CRLF preserved**

Run:
```bash
file src/data/staticPaths.ts
```
Expected: output contains `CRLF`. If it says only `ASCII text` / `UTF-8` with no CRLF, revert and re-edit preserving line endings.

- [ ] **Step 4: Commit**

```bash
git add src/data/staticPaths.ts
git commit -m "feat(journeys): Death Awareness skeleton — Hopeful theme + 7 step pointers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Day 1 — verse `quran_3_185` + angle `q_angle_death_day1`

**Files:**
- Modify: `src/data/quranData.ts` — add 1 `Content` row (end of `quranContentData`, ~line 3591) + 1 `ContentAngle` (end of `quranContentAnglesData`, before `];` at ~line 17606)

**Interfaces:**
- Consumes: `staticPaths` step `step_death_1` → `contentId: 'quran_3_185'`, `angleId: 'q_angle_death_day1'`, no hadith.
- Produces: `Content` id `quran_3_185`; `ContentAngle` id `q_angle_death_day1` (`contentId: 'quran_3_185'`, `mood: 'Hopeful'`).

- [ ] **Step 1: Re-verify the āyah**

Run:
```bash
curl -s "https://api.alquran.cloud/v1/ayah/3:185/editions/quran-uthmani,en.sahih" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);for(const e of j.data)console.log(e.edition.identifier+": "+e.text)})'
```
Expected: matches the AR + EN in "Verified source data" above exactly. If not, stop and use the fetched text.

- [ ] **Step 2: Add the `Content` row**

Append to `quranContentData` (match the `quran_67_2` shape — `type: 'Quran'`, `primaryText` = transliteration, `arabicText` ends ` ﴿185﴾`, `audioKey`, one-line `whyThis`, `moods: []`):

```ts
  {
    id: 'quran_3_185',
    type: 'Quran',
    primaryText:
      'Kullu nafsin dhāʾiqatu l-mawt; wa innamā tuwaffawna ujūrakum yawma l-qiyāmah; faman zuḥziḥa ʿani n-nāri wa udkhila l-jannata faqad fāz; wa mā l-ḥayātu d-dunyā illā matāʿu l-ghurūr',
    arabicText:
      'كُلُّ نَفْسٍۢ ذَآئِقَةُ ٱلْمَوْتِ ۗ وَإِنَّمَا تُوَفَّوْنَ أُجُورَكُمْ يَوْمَ ٱلْقِيَٰمَةِ ۖ فَمَن زُحْزِحَ عَنِ ٱلنَّارِ وَأُدْخِلَ ٱلْجَنَّةَ فَقَدْ فَازَ ۗ وَمَا ٱلْحَيَوٰةُ ٱلدُّنْيَآ إِلَّا مَتَٰعُ ٱلْغُرُورِ ﴿١٨٥﴾',
    transliteration:
      'Kullu nafsin dhāʾiqatu l-mawt; wa innamā tuwaffawna ujūrakum yawma l-qiyāmah; faman zuḥziḥa ʿani n-nāri wa udkhila l-jannata faqad fāz; wa mā l-ḥayātu d-dunyā illā matāʿu l-ghurūr',
    englishTranslation:
      'Every soul will taste death, and you will be paid your full compensation only on the Day of Resurrection. Whoever is drawn away from the Fire and admitted to Paradise has truly succeeded. The life of this world is only the enjoyment of delusion.',
    source: "Surah Ali 'Imran 3:185",
    audioKey: '3:185',
    whyThis:
      'Ibn Kathir calls this ayah a consolation to all creation — no soul is exempt, so no one is singled out. It also moves the reckoning: wages are paid in full only on the Day of Resurrection, not here.',
    moods: [],
  },
```

(Confirm the ` ﴿١٨٥﴾` ornament style against a neighbouring verse — some rows use Arabic-Indic digits `١٨٥`, some Western `185`. Match the file.)

- [ ] **Step 3: Add the angle**

Append to `quranContentAnglesData`. The `angle` string begins with the tafsir tag, is tafsir voice, contains `. When you`, and ends on the "fear has somewhere to go" turn (validate-then-redirect, per spec §scholarly frame 3):

```ts
  {
    id: 'q_angle_death_day1',
    contentId: 'quran_3_185',
    mood: 'Hopeful',
    angle:
      "[Tafsir Ibn Kathir on 3:185] Ibn Kathir opens his comment by calling this ayah a consolation to all of creation: every soul, without exception, will taste death, so no one is being singled out and nothing has gone wrong with you for feeling its weight. The Companions themselves disliked death, and the Prophet صلى الله عليه وسلم said as much. What the ayah does with that certainty is move the payment date: your wages are settled in full only on the Day of Resurrection, not in this life, so a life that looks unfinished or unrewarded here is not the verdict. Ibn Kathir reads faman zuhziha ani an-nar wa udkhila al-jannah — whoever is pulled back from the Fire and brought into the Garden — as the only success the ayah will call success, and cites the hadith that a place in Paradise the size of a whip outweighs the world and everything in it. Everything else is mata al-ghurur, enjoyment that deceives. When you hold both halves at once — that death is certain, and that the account is just and not yet due — the fear stops being a dead end and becomes a direction: toward preparing, and toward thinking well of the One who will settle it.",
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'light-bulb',
        title: 'Name the fear plainly',
        instruction:
          'Write down the specific thing about death that unsettles you — the unknown, leaving people behind, the account itself. Ibn Kathir notes the Companions also disliked death; naming the fear is not weak faith, it is the first move toward preparing for the thing you named.',
        source: 'Tafsir Ibn Kathir on 3:185',
      },
      {
        type: 'mindset',
        icon: 'calm-face',
        title: 'Instinct is not the problem',
        instruction:
          'The dislike of death is jibilli — built in. Scholars call blameworthy only the fear that grows from love of this world or from doubting Allah’s mercy, not the instinct itself. Ask which one is actually sitting in your chest.',
        source: 'Reflects Tafsir Ibn Kathir on 3:185 and Sahih al-Bukhari 6507',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The du’a to be gathered with the righteous',
        instruction:
          'The people of understanding in Surah Ali ‘Imran close their supplication by asking not to be spared death but to be taken in good company. Make it yours today.',
        arabicText:
          'رَبَّنَا فَٱغْفِرْ لَنَا ذُنُوبَنَا وَكَفِّرْ عَنَّا سَيِّـٔاتِنَا وَتَوَفَّنَا مَعَ ٱلْأَبْرَارِ',
        transliteration:
          'Rabbanā faghfir lanā dhunūbanā wa kaffir ʿannā sayyiʾātinā wa tawaffanā maʿa l-abrār',
        translation:
          'Our Lord, forgive us our sins and remove from us our misdeeds, and cause us to die with the righteous.',
        source: 'Quran 3:193',
        sourceType: 'quran_dua',
      },
    ]),
    reflection:
      'If your account were closed today, which part of it would you most want more time to change? Name one thing you could begin this week.',
  },
```

**Note on the Arabic escapes:** the block above uses `\uXXXX` escapes to survive copy/paste. At implementation, paste the *actual* Arabic from the fetch in Step 1 (āyah tail) — do not ship escape sequences. The `صلى...` in the `angle` string is `ﷺ`/`صلى الله عليه وسلم` — match how neighbouring angles write it (most use the literal `ﷺ`).

- [ ] **Step 4: Verify parse + structure**

Run:
```bash
npx tsc --noEmit -p tsconfig.json
```
Expected: PASS.

Run:
```bash
node -e '
const fs=require("fs");const s=fs.readFileSync("src/data/quranData.ts","utf8");
const c=(s.match(/id: .quran_3_185./g)||[]).length;
const a=(s.match(/id: .q_angle_death_day1./g)||[]).length;
console.log("quran_3_185 count",c,"| q_angle_death_day1 count",a);
if(c!==1||a!==1)process.exit(1);
const m=s.match(/id: .q_angle_death_day1.[\s\S]{0,4000}?reflection:/);
if(!/angle:\s*\r?\n?\s*"\[Tafsir Ibn Kathir on 3:185\]/.test(m[0])){console.log("TAG NOT AT START");process.exit(1)}
if(!/\. When you /.test(m[0])){console.log("NO SPLIT PATTERN");process.exit(1)}
console.log("ok");
'
```
Expected: `quran_3_185 count 1 | q_angle_death_day1 count 1` then `ok`.

- [ ] **Step 5: Verify the `practiceSteps` JSON parses and types are valid**

Run:
```bash
node -e '
const {quranContentAngles}=require("./src/data/quranData.ts.__transpiled__||./src/data/quranData");
' 2>/dev/null || echo "(if require fails on TS, skip — Task 9 roundtrip covers it)"
```
If the direct require fails (TS not transpilable in this shell), rely on `npx tsc` (Step 4) plus a manual read: confirm `JSON.stringify([...])` contains only `type` ∈ {mindset,physical,verbal}, `icon` ∈ the allowed list, `sourceType` only on the du'a step.

- [ ] **Step 6: Commit**

```bash
git add src/data/quranData.ts
git commit -m "feat(journeys): Death Awareness day 1 — every soul tastes death (3:185)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Day 2 — angle `q_angle_death_day2` (reuses `quran_67_2`, no hadith)

**Files:**
- Modify: `src/data/quranData.ts` — add 1 `ContentAngle` only (verse `quran_67_2` already exists; do NOT add a duplicate)

**Interfaces:**
- Consumes: `step_death_2` → `contentId: 'quran_67_2'`, `angleId: 'q_angle_death_day2'`, no hadith.
- Produces: `ContentAngle` id `q_angle_death_day2`.

- [ ] **Step 1: Confirm `quran_67_2` exists exactly once**

Run:
```bash
grep -c "id: 'quran_67_2'" src/data/quranData.ts
```
Expected: `1`. Do not add another.

- [ ] **Step 2: Re-verify the two tafsir entries**

Run:
```bash
for k in 67:2 18:110; do echo "=== $k ==="; curl -s "https://api.quran.com/api/v4/tafsirs/169/by_ayah/$k" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);const t=j.tafsir.text.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();console.log(t.slice(0,600))}'); done
```
Expected: 67:2 contains "best in deed" / "not… the most deeds"; 18:110 contains the riyāʾ / "showing off" material. If either has drifted, adjust the prose to what the entry actually says.

- [ ] **Step 3: Add the angle**

`angle` opens with `[Tafsir Ibn Kathir on 67:2]`, tafsir voice, contains `. Notice ` or `. And when `, renders "best not most" + the riyāʾ point, closes on `al-ʿAzīz al-Ghafūr`. `mood: 'Hopeful'`. Du'a = Ibn Mājah 925.

```ts
  {
    id: 'q_angle_death_day2',
    contentId: 'quran_67_2',
    mood: 'Hopeful',
    angle:
      "[Tafsir Ibn Kathir on 67:2] The order of the words is deliberate: death is named before life. Death is not the void that cancels meaning — the ayah presents it as something Allah created, on purpose, and it is what makes the test real. On ahsanu amalan, Ibn Kathir quotes Muhammad ibn Ajlan and then adds his own note: Allah did not say which of you does the most deeds, He said which of you is best in deed — the measure is quality, not volume. And the core of that quality is sincerity: in his comment on a parallel ayah, 18:110, Ibn Kathir records that a deed with any showing-off mixed into it is, on the Day of Judgement, sent to the one it was really performed for, with nothing owed. Notice what that does to your fear of dying with too little on the record: it moves the question from how much did I do to how much of it was actually for Him. The ayah closes on two Names held together — al-Aziz, strong enough to enforce the test, and al-Ghafur, forgiving toward the one who keeps stumbling in it.",
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'target',
        title: 'Best, not most',
        instruction:
          'Pick one act of worship you do on autopilot — a rushed prayer, a distracted portion of Qur’an. Tomorrow, do that one thing with full attention and a clear intention. Quality is the thing the ayah is measuring.',
        source: 'Tafsir Ibn Kathir on 67:2',
      },
      {
        type: 'mindset',
        icon: 'eye',
        title: 'The riya check',
        instruction:
          'Ibn Kathir on 18:110: a deed done partly to be seen is handed back, on the Day of Judgement, to the one you performed it for — "seek its reward from them." Sincerity is not a bonus added to a deed; it is what makes it a deed at all. Name one thing you do that is half for Allah and half for how it looks.',
        source: 'Tafsir Ibn Kathir on 18:110',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The du’a for accepted deeds',
        instruction:
          'Umm Salama reported that the Prophet ﷺ said this after the Fajr prayer. Say it after one prayer tomorrow.',
        arabicText:
          'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا',
        transliteration:
          'Allāhumma innī asʾaluka ʿilman nāfiʿan, wa rizqan ṭayyiban, wa ʿamalan mutaqabbalā',
        translation:
          'O Allah, I ask You for beneficial knowledge, goodly provision, and accepted deeds.',
        source: 'Sunan Ibn Majah 925',
        sourceType: 'prophetic_dua',
      },
    ]),
    reflection:
      'Which of your deeds are for Allah, and which are for how they look to others? Name one you could quietly move from the second column to the first.',
  },
```

- [ ] **Step 4: Verify parse + structure** — same as Task 2 Step 4, substituting `q_angle_death_day2` and tag `[Tafsir Ibn Kathir on 67:2]`, split pattern `. Notice `:

```bash
npx tsc --noEmit -p tsconfig.json
node -e '
const fs=require("fs");const s=fs.readFileSync("src/data/quranData.ts","utf8");
const a=(s.match(/id: .q_angle_death_day2./g)||[]).length;
if(a!==1){console.log("angle count",a);process.exit(1)}
const m=s.match(/id: .q_angle_death_day2.[\s\S]{0,4500}?reflection:/)[0];
if(!/angle:\s*\r?\n?\s*"\[Tafsir Ibn Kathir on 67:2\]/.test(m))process.exit(1);
if(!/\. Notice /.test(m))process.exit(1);
console.log("ok");
'
```
Expected: `ok`.

- [ ] **Step 5: Commit**

```bash
git add src/data/quranData.ts
git commit -m "feat(journeys): Death Awareness day 2 — death created on purpose (67:2)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Day 3 — angle `q_angle_death_day3` + hadith `hadith_death_3` (Tirmidhī 2307)

**Files:**
- Modify: `src/data/quranData.ts` — add 1 `ContentAngle` (verse `quran_102_1_2` already exists)
- Modify: `src/data/hadithData.ts` — add 1 `Content` (Hadith) row

**Interfaces:**
- Consumes: `step_death_3` → `contentId: 'quran_102_1_2'`, `angleId: 'q_angle_death_day3'`, `hadithContentId: 'hadith_death_3'`.
- Produces: `ContentAngle` `q_angle_death_day3`; `Content` `hadith_death_3`.

- [ ] **Step 1: Re-verify Tirmidhī 2307 + the tafsir**

```bash
curl -sL -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36' "https://sunnah.com/tirmidhi:2307" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const t=d.match(/<div class=text_details>([\s\S]*?)<\/div>/);const a=d.match(/<div class="arabic_hadith_full arabic">([\s\S]*?)<\/div>/);const strip=x=>x[1].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();console.log("EN:",strip(t));console.log("AR:",strip(a))})'
curl -s "https://api.quran.com/api/v4/tafsirs/169/by_ayah/102:1" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{console.log(JSON.parse(d).tafsir.text.replace(/<[^>]+>/g," ").replace(/\s+/g," ").slice(0,400))})'
```
Expected: EN "Increase in remembrance of the severer of pleasures. Meaning death."; AR matn contains `أَكْثِرُوا ذِكْرَ هَاذِمِ اللَّذَّاتِ`.

- [ ] **Step 2: Add the hadith row** to `hadithContent` in `src/data/hadithData.ts` (before the final `];`), matching the `hadith_study_1` shape:

```ts
  {
    id: 'hadith_death_3',
    type: 'Hadith',
    primaryText: 'Remember often the destroyer of pleasures — meaning death.',
    arabicText: 'أَكْثِرُوا ذِكْرَ هَاذِمِ اللَّذَّاتِ',
    translation: 'Increase in remembrance of the severer of pleasures. Meaning death.',
    englishTranslation:
      'Increase in remembrance of the severer of pleasures. Meaning death.',
    source: "Jami' at-Tirmidhi 2307",
    transliteration: "Akthirū dhikra hādhimi l-ladhdhāt (yaʿnī l-mawt)",
    whyThis:
      'Abu Hurayra narrated it. Tirmidhi graded it hasan gharib; al-Albani graded it hasan, and Ibn Majah and an-Nasa’i narrate it too. The instruction is frequency, not intensity: a short, repeated thought that resets your aim, not a spiral.',
    propheticPractice: {
      description: 'Bring a brief thought of death to mind several times a day, letting it reorder the decision in front of you',
      source: "Jami' at-Tirmidhi 2307",
      grading: 'hasan',
    },
    moods: [],
  },
```
(Paste the real Arabic from Step 1. Keep `grading: 'hasan'` — do not upgrade.)

- [ ] **Step 3: Add the angle** to `quranContentAnglesData`. Opens `[Tafsir Ibn Kathir on 102:1]`, acknowledges the sūrah continues to a warning, contains `. The Prophet ﷺ said:`, du'a = Abū Dāwūd 1522, includes a *muḥāsaba* step anchored to 59:18.

```ts
  {
    id: 'q_angle_death_day3',
    contentId: 'quran_102_1_2',
    mood: 'Hopeful',
    angle:
      "[Tafsir Ibn Kathir on 102:1] Ibn Kathir titles this passage the result of loving the world and being heedless of the Hereafter. At-takathur — the race to have more, and to out-count others — runs unbroken through a life until, in the ayah’s words, you visit the graves, meaning until you are buried. The surah names the disease and then keeps going, to a warning about the Fire; this journey stops at the diagnosis, but you should know the surah does not. The Prophet ﷺ said: increase your remembrance of the destroyer of pleasures — meaning death — which Tirmidhi records as hasan. That remembrance is not meant to flatten your mood; it is a filter. Hold a decision in front of it and the ones that only mattered inside the counting game fall away, and what is left is what deserves the day. The point is to do this often and briefly, the way you glance at a compass, not to sink into it once.",
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'clock',
        title: 'The graveyard test',
        instruction:
          'Take one decision on your plate today and ask: from inside the grave, would this have mattered? Let the honest answer reorder your afternoon.',
        source: "Reflects Jami' at-Tirmidhi 2307",
      },
      {
        type: 'physical',
        icon: 'pen',
        title: 'Look at what you sent ahead',
        instruction:
          'Tonight, before sleep, write the two best and two worst things you did today. Allah says: let every soul look to what it has put forth for tomorrow. This is that, in miniature.',
        source: 'Quran 59:18',
      },
      {
        type: 'mindset',
        icon: 'eye',
        title: 'Remember, do not dwell',
        instruction:
          'The Sunnah is frequent remembrance, brief each time — a passing thought that corrects your heading, not a session you have to brace for. If it turns heavy, that is not the practice.',
        source: "Jami' at-Tirmidhi 2307",
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The du’a Mu’adh was told never to leave',
        instruction:
          'The Prophet ﷺ took Mu’adh by the hand, told him he loved him, and taught him to say this after every prayer.',
        arabicText:
          'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
        transliteration: "Allāhumma aʿinnī ʿalā dhikrika wa shukrika wa ḥusni ʿibādatik",
        translation: 'O Allah, help me to remember You, to thank You, and to worship You well.',
        source: 'Sunan Abi Dawud 1522',
        sourceType: 'prophetic_dua',
      },
    ]),
    reflection:
      'Name one thing you spend real energy on that would not matter to you from the grave. Then name one thing that would.',
  },
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit -p tsconfig.json
node -e '
const fs=require("fs");
const q=fs.readFileSync("src/data/quranData.ts","utf8");
const h=fs.readFileSync("src/data/hadithData.ts","utf8");
if((q.match(/id: .q_angle_death_day3./g)||[]).length!==1)process.exit(1);
if((h.match(/id: .hadith_death_3./g)||[]).length!==1)process.exit(1);
const m=q.match(/id: .q_angle_death_day3.[\s\S]{0,5000}?reflection:/)[0];
if(!/"\[Tafsir Ibn Kathir on 102:1\]/.test(m))process.exit(1);
if(!/\. The Prophet \u{FDFA} said:/u.test(m) && !/\. The Prophet ﷺ said:/.test(m))process.exit(1);
console.log("ok");
'
```
Expected: `ok`. (If the `ﷺ` split-pattern regex is finicky, just eyeball that `. The Prophet ﷺ said:` appears once in the angle.)

- [ ] **Step 5: Commit**

```bash
git add src/data/quranData.ts src/data/hadithData.ts
git commit -m "feat(journeys): Death Awareness day 3 — remember it often (102:1-2, Tirmidhi 2307)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Day 4 — verse `quran_39_42` + angle `q_angle_death_day4` + hadith `hadith_death_4` (Bukhārī 6324)

**Files:**
- Modify: `src/data/quranData.ts` — 1 `Content` verse + 1 `ContentAngle`
- Modify: `src/data/hadithData.ts` — 1 `Content` hadith

**Interfaces:**
- Consumes: `step_death_4` → `quran_39_42` / `q_angle_death_day4` / `hadith_death_4`.
- Produces: those three ids.

- [ ] **Step 1: Re-verify 39:42, Bukhārī 6324, al-Qurtubi 39:42**

```bash
curl -s "https://api.alquran.cloud/v1/ayah/39:42/editions/quran-uthmani,en.sahih" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{for(const e of JSON.parse(d).data)console.log(e.edition.identifier+": "+e.text)})'
curl -s "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari/6324.json" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).hadiths[0].text))'
curl -s "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari/6324.json" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).hadiths[0].text))'
curl -s "https://api.quran.com/api/v4/tafsirs/90/by_ayah/39:42" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const t=JSON.parse(d).tafsir.text.replace(/<[^>]+>/g," ").replace(/\s+/g," ");console.log("len",t.length);console.log(t.slice(0,400))})'
```
Expected: āyah matches; hadith matn contains `بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا` and `الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا...`; al-Qurtubi entry len > 3000 and discusses `يتوفى الأنفس` / sleep.

- [ ] **Step 2: Add `Content` verse `quran_39_42`** (shape as Task 2 Step 2, ` ﴿٤٢﴾` ornament):

```ts
  {
    id: 'quran_39_42',
    type: 'Quran',
    primaryText:
      'Allāhu yatawaffā l-anfusa ḥīna mawtihā wallatī lam tamut fī manāmihā; fa-yumsiku llatī qaḍā ʿalayhā l-mawta wa yursilu l-ukhrā ilā ajalin musammā; inna fī dhālika la-āyātin li-qawmin yatafakkarūn',
    arabicText:
      'ٱللَّهُ يَتَوَفَّى ٱلْأَنفُسَ حِينَ مَوْتِهَا وَٱلَّتِى لَمْ تَمُتْ فِى مَنَامِهَا ۖ فَيُمْسِكُ ٱلَّتِى قَضَىٰ عَلَيْهَا ٱلْمَوْتَ وَيُرْسِلُ ٱلْأُخْرَىٰۤ إِلَىٰۤ أَجَلٍۢ مُّسَمًّا ۚ إِنَّ فِى ذَٰلِكَ لَءَايَٰتٍۢ لِّقَوْمٍۢ يَتَفَكَّرُونَ ﴿٤٢﵀',
    transliteration:
      'Allāhu yatawaffā l-anfusa ḥīna mawtihā wallatī lam tamut fī manāmihā; fa-yumsiku llatī qaḍā ʿalayhā l-mawta wa yursilu l-ukhrā ilā ajalin musammā; inna fī dhālika la-āyātin li-qawmin yatafakkarūn',
    englishTranslation:
      'Allah takes the souls at the time of their death, and the souls of the living during their sleep. He keeps those for whom He has decreed death and releases the rest until an appointed term. In that are signs for people who reflect.',
    source: 'Surah Az-Zumar 39:42',
    audioKey: '39:42',
    whyThis:
      'Sleep and death are placed under one verb here — yatawaffa. Classical tafsir calls sleep al-wafat al-sughra, the minor death: a nightly handing-over of the soul, released each morning to a term one day shorter.',
    moods: [],
  },
```
**Paste the real Arabic from Step 1.** Confirm ornament style against a neighbour.

- [ ] **Step 3: Add `hadith_death_4`** to `hadithData.ts`:

```ts
  {
    id: 'hadith_death_4',
    type: 'Hadith',
    primaryText:
      'On going to bed: "With Your name, O Allah, I die and I live." On waking: "All praise is for Allah who gave us life after causing us to die, and to Him is the resurrection."',
    arabicText:
      'كَانَ النَّبِيُّ ﷺ إِذَا أَرَادَ أَنْ يَنَامَ قَالَ «بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا» وَإِذَا اسْتَيْقَظَ قَالَ «الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ»',
    translation:
      'Whenever the Prophet ﷺ intended to go to bed, he would say, "Bismika Allahumma amutu wa ahya (With Your name, O Allah, I die and I live)." And when he woke up he would say, "Al-hamdu lillahi-lladhi ahyana ba’da ma amatana wa ilayhi n-nushur (All praise is for Allah who gave us life after causing us to die, and to Him is the resurrection)."',
    englishTranslation:
      'Whenever the Prophet ﷺ intended to go to bed, he would say, "With Your name, O Allah, I die and I live." And when he woke up he would say, "All praise is for Allah who gave us life after causing us to die, and to Him is the resurrection."',
    source: 'Sahih al-Bukhari 6324',
    transliteration:
      'Bismika Allāhumma amūtu wa aḥyā — Al-ḥamdu lillāhi-lladhī aḥyānā baʿda mā amātanā wa ilayhi n-nushūr',
    whyThis:
      'Hudhayfa reported it. The waking words state the sleep–death link outright: ahyana ba’da ma amatana, "gave us life after having caused us to die." Both thresholds — sleeping and waking — are named as a death and a return.',
    propheticPractice: {
      description: 'Make these the literal last and first words of the day — phone down before the first, before anything else after the second',
      source: 'Sahih al-Bukhari 6324',
      grading: 'sahih',
    },
    moods: [],
  },
```
**Paste the real Arabic from Step 1.**

- [ ] **Step 4: Add the angle** `q_angle_death_day4` — opens `[Tafsir al-Qurtubi on 39:42]`, contains `. When you` or `. This is `, du'a = the waking formula itself (`prophetic_dhikr`, Bukhārī 6324):

```ts
  {
    id: 'q_angle_death_day4',
    contentId: 'quran_39_42',
    mood: 'Hopeful',
    angle:
      "[Tafsir al-Qurtubi on 39:42] Al-Qurtubi works through this ayah in four questions, and the first is the one that matters here: what does it mean that Allah takes the souls of those who have not died, in their sleep? His answer is that sleep is a wafat — a taking — just a lesser one. The scholars call it al-wafat al-sughra, the minor death. Every night your soul is taken; every morning the ones not marked for death are sent back to a fixed term that is now one day shorter. This is not a metaphor the tradition invented — the waking words the Prophet ﷺ used say it plainly: al-hamdu lillahi alladhi ahyana ba’da ma amatana, praise to the One who gave us life after causing us to die. When you treat the two thresholds — lying down, waking up — as a rehearsal you already perform daily, death stops being the one event you have no practice for, and each morning arrives as something handed back rather than something owed.",
    practiceSteps: JSON.stringify([
      {
        type: 'verbal',
        icon: 'moon',
        title: 'The last words before sleep',
        instruction:
          'Tonight, put the phone down first, then say this as the literal last thing before sleep.',
        arabicText: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
        transliteration: 'Bismika Allāhumma amūtu wa aḥyā',
        translation: 'With Your name, O Allah, I die and I live.',
        source: 'Sahih al-Bukhari 6324',
        sourceType: 'prophetic_dhikr',
      },
      {
        type: 'verbal',
        icon: 'sunrise',
        title: 'The first words on waking',
        instruction:
          'Before you reach for anything, name the day as returned.',
        arabicText:
          'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
        transliteration:
          'Al-ḥamdu lillāhi-lladhī aḥyānā baʿda mā amātanā wa ilayhi n-nushūr',
        translation:
          'All praise is for Allah who gave us life after causing us to die, and to Him is the resurrection.',
        source: 'Sahih al-Bukhari 6324',
        sourceType: 'prophetic_dhikr',
      },
      {
        type: 'mindset',
        icon: 'clock',
        title: 'One returned day',
        instruction:
          'On waking, ask one question: if this were the last day I am released for, what is the one thing I would not skip? Then do that thing first.',
        source: 'Reflects Quran 39:42',
      },
    ]),
    reflection:
      'You were handed today back. What will you do with it that you would not bother doing if you assumed a thousand more were coming?',
  },
```

- [ ] **Step 5: Verify** — `npx tsc --noEmit -p tsconfig.json` PASS, plus the node structural check (adapt Task 4 Step 4: `quran_39_42` count 1, `q_angle_death_day4` count 1, `hadith_death_4` count 1, tag `[Tafsir al-Qurtubi on 39:42]` at start, a split pattern present).

- [ ] **Step 6: Commit**

```bash
git add src/data/quranData.ts src/data/hadithData.ts
git commit -m "feat(journeys): Death Awareness day 4 — sleep as rehearsal (39:42, Bukhari 6324)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Day 5 — verse `quran_63_10` + angle `q_angle_death_day5` + hadith `hadith_death_5` (Bukhārī 6416)

**Files:** `src/data/quranData.ts` (verse + angle), `src/data/hadithData.ts` (hadith).

**Interfaces:** Consumes `step_death_5` → `quran_63_10` / `q_angle_death_day5` / `hadith_death_5`. Produces those.

- [ ] **Step 1: Re-verify 63:10, Bukhārī 6416 (AR + EN), Bukhārī 6514, Bukhārī 2738, Bukhārī 6413, Ibn Kathīr 63:10**

```bash
curl -s "https://api.alquran.cloud/v1/ayah/63:10/editions/quran-uthmani,en.sahih" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{for(const e of JSON.parse(d).data)console.log(e.edition.identifier+": "+e.text)})'
for h in bukhari/6416 bukhari/6514 bukhari/2738 bukhari/6413; do echo "== $h =="; curl -s "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-$h.json" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).hadiths[0].text))'; curl -s "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-$h.json" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).hadiths[0].text))'; done
curl -s "https://api.quran.com/api/v4/tafsirs/169/by_ayah/63:10" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).tafsir.text.replace(/<[^>]+>/g," ").slice(0,400)))'
```
Expected: āyah matches; 6416 EN "Be in this world as if you were a stranger or a traveler" + the Ibn ʿUmar tail; 6514 "followed by three… his deeds remain"; 2738 "not permissible… two nights without… will"; 6413 "no life except the life of the Hereafter"; Ibn Kathīr 63:10 on charity / not over-attaching to worldly matters.

- [ ] **Step 2: Add `Content` verse `quran_63_10`** — shape as Task 5 Step 2, ` ﴿١٠﴾`, `whyThis` ≈ "Ibn ʿAbbās and al-Ḥasan note the dying wish in this āyah is always for more time to give ṣadaqa — not more prayer or fasting."

- [ ] **Step 3: Add `hadith_death_5`** (Bukhārī 6416). `whyThis` must attribute the "if you reach evening…" / "take from your life for your death" line to **Ibn ʿUmar** (mawqūf), not the Prophet ﷺ. `grading: 'sahih'`. `primaryText` = "Be in this world as if you were a stranger or a traveler."

- [ ] **Step 4: Add the angle** `q_angle_death_day5` — opens `[Tafsir Ibn Kathir on 63:10]`; frames detachment as **zuhd not rahbāniyya** (spec §scholarly frame 5); Ibn ʿUmar's tail attributed correctly; contains `. Your `; **includes the quiet crisis-pointer line** ("if the thought of leaving turns into wanting to leave, that is a different weight — the Hope journey and the in-app resources are there"). 5 practice steps:

```ts
  {
    id: 'q_angle_death_day5',
    contentId: 'quran_63_10',
    mood: 'Hopeful',
    angle:
      "[Tafsir Ibn Kathir on 63:10] The ayah records the one wish the dying actually make. Ibn Kathir, citing Ibn Abbas and al-Hasan, notes it is never ‘if only I had prayed more’ or ‘fasted more’ — it is ‘if only You would delay me so I could give charity.’ The lesson is not that this world is worthless. Islam has no monasticism — la rahbaniyya fi al-islam — and wealth is the field you plant for the next life. The lesson is grip. The Prophet ﷺ took Ibn Umar by the shoulder and said, be in this world as a stranger, or a traveler passing through; Ibn Umar himself added, do not wait for the morning if you have reached evening, and take from your life for your death. Your family, your wealth, and your deeds walk with you toward the grave — and at the edge, two turn back. Only the deeds go in. If the thought of leaving all this ever shifts from ‘I am a traveler here’ to ‘I want the trip to be over,’ that is a different weight, and the Hope journey and the in-app resources are there for it — this day is not asking you to want to go.",
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'gift',
        title: 'Answer the dying wish now',
        instruction:
          'Give one sadaqa today, however small — the ayah is the regret of the person who kept meaning to. Do it before you finish this step.',
        source: 'Quran 63:10',
      },
      {
        type: 'physical',
        icon: 'pen',
        title: 'Write the will',
        instruction:
          'The Prophet ﷺ said it is not right for a Muslim with something to bequeath to pass two nights without a written will. Draft or update yours this week. Do not assign inheritance shares yourself — that is madhhab-specific; name an executor and your wishes and take it to someone qualified.',
        source: 'Sahih al-Bukhari 2738 / Sahih Muslim 1627',
        sourceType: 'sunnah_action',
      },
      {
        type: 'mindset',
        icon: 'compass',
        title: 'Stranger, not renouncer',
        instruction:
          'Name one thing you own that owns you back — that you would panic to lose. The work is loosening the grip, not discarding the thing.',
        source: 'Sahih al-Bukhari 6416',
      },
      {
        type: 'mindset',
        icon: 'arrow-right',
        title: 'Only one of the three goes in',
        instruction:
          'The Prophet ﷺ said the dead are followed by three — family, wealth, deeds — and only the deeds enter the grave with you. Name one deed you can send ahead today.',
        source: 'Sahih al-Bukhari 6514',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The words said at the trench',
        instruction:
          'The Prophet ﷺ said this while digging in hardship. Use it when this world feels too heavy to hold loosely.',
        arabicText: 'اللَّهُمَّ لاَ عَيْشَ إِلَّا عَيْشُ الْآخِرَةِ',
        transliteration: "Allāhumma lā ʿaysha illā ʿayshu l-ākhirah",
        translation: 'O Allah, there is no life except the life of the Hereafter.',
        source: 'Sahih al-Bukhari 6413',
        sourceType: 'prophetic_dhikr',
      },
    ]),
    reflection:
      'Of the three that follow you to the grave — family, wealth, deeds — only the deeds go in. What did you add to that pile this week?',
  },
```

- [ ] **Step 5: Verify** — `npx tsc --noEmit` PASS + structural node check (`quran_63_10`, `q_angle_death_day5`, `hadith_death_5` each count 1; tag `[Tafsir Ibn Kathir on 63:10]` at start; `. Your ` present; the string `Hope journey` present in the angle).

- [ ] **Step 6: Commit**

```bash
git add src/data/quranData.ts src/data/hadithData.ts
git commit -m "feat(journeys): Death Awareness day 5 — travel light (63:10, Bukhari 6416)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Day 6 — verse `quran_36_12` + angle `q_angle_death_day6` + hadith `hadith_death_6` (Muslim 1631)

**Files:** `src/data/quranData.ts` (verse + angle), `src/data/hadithData.ts` (hadith).

**Interfaces:** Consumes `step_death_6` → `quran_36_12` / `q_angle_death_day6` / `hadith_death_6`. Produces those.

- [ ] **Step 1: Re-verify 36:12, Muslim 1631 (`sunnah.com` ONLY — mirror renumbers Muslim), al-Qurtubi 36:12**

```bash
curl -s "https://api.alquran.cloud/v1/ayah/36:12/editions/quran-uthmani,en.sahih" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{for(const e of JSON.parse(d).data)console.log(e.edition.identifier+": "+e.text)})'
curl -sL -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36' "https://sunnah.com/muslim:1631" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const t=d.match(/<div class=text_details>([\s\S]*?)<\/div>/);const n=d.match(/<div class=hadith_narrated>([\s\S]*?)<\/div>/);const a=d.match(/<div class="arabic_hadith_full arabic">([\s\S]*?)<\/div>/);const S=x=>x[1].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();console.log("N:",S(n));console.log("EN:",S(t));console.log("AR:",S(a))})'
curl -s "https://api.quran.com/api/v4/tafsirs/90/by_ayah/36:12" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const t=JSON.parse(d).tafsir.text.replace(/<[^>]+>/g," ").replace(/\s+/g," ");console.log("len",t.length);console.log(t.slice(0,400))})'
```
Expected: āyah matches; Muslim 1631 EN "his acts come to an end, but three: recurring charity, or knowledge… or a pious child"; al-Qurtubi 36:12 len > 2500, on `نكتب ما قدموا وآثارهم`.

- [ ] **Step 2: Add `Content` verse `quran_36_12`** — shape as before, ` ﴿١٢﴾`, `whyThis` ≈ "Ibn Kathīr / al-Qurtubi: *āthār* is both the footsteps to the masjid (the *sabab*, cf. Muslim 665) and, more widely, the traces you leave that keep acting after you."

- [ ] **Step 3: Add `hadith_death_6`** (Muslim 1631) — use the `sunnah.com` Arabic matn (`إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ...`), EN = the sunnah.com published translation, `grading: 'sahih'`.

- [ ] **Step 4: Add the angle** `q_angle_death_day6` — opens `[Tafsir al-Qurtubi on 36:12]`; **does not over-weight "righteous child"** (spec §scholarly frame 6 — "three doors, not one; if you have no children the other two are wide open"); contains `. And when ` or `. This is `; du'a = 25:74 (`quran_dua`). 4 steps:

```ts
  {
    id: 'q_angle_death_day6',
    contentId: 'quran_36_12',
    mood: 'Hopeful',
    angle:
      "[Tafsir al-Qurtubi on 36:12] Al-Qurtubi reads the ayah as naming two things that outlast you: ma qaddamu, what you sent ahead, and atharakum, your traces — the effects that keep working after you are gone. The occasion of revelation, he reports, was a clan who wanted to move their houses nearer the mosque, and the ayah told them their footsteps were being written down, so they stayed where they were. The Prophet ﷺ drew the same line: when a person dies their deeds stop — except three. Ongoing charity. Knowledge people keep benefiting from. A righteous child who prays for them. Notice that this is three doors, not one. If you have no children, the ayah has not closed anything on you — the first two are wide open, and the hadith is an offer, not a bill. Today’s work is small and specific: pick one of the three and start it. Not plan it. Start it.",
    practiceSteps: JSON.stringify([
      {
        type: 'physical',
        icon: 'honey',
        title: 'Start a sadaqa jariya today',
        instruction:
          'Set up one recurring gift — a monthly transfer, a share in a water project, a masjid or teaching fund. Small and automatic beats large and someday.',
        source: 'Sahih Muslim 1631',
        sourceType: 'sunnah_action',
      },
      {
        type: 'physical',
        icon: 'book-quran',
        title: 'Teach one thing',
        instruction:
          'Pass on one beneficial thing you know — an ayah, a ruling, a skill — to one person this week. Knowledge that keeps being used keeps being written for you.',
        source: 'Sahih Muslim 1631',
        sourceType: 'sunnah_action',
      },
      {
        type: 'mindset',
        icon: 'heart',
        title: 'The third door',
        instruction:
          'If you have children, the smallest brick is teaching them one line of du’a for you. If you do not, the first two doors are enough — the hadith names three so that everyone has a way in, not to leave anyone out.',
        source: 'Sahih Muslim 1631',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The du’a of the servants of the Most Merciful',
        instruction:
          'This is how the ibad ar-Rahman ask for family in Surah al-Furqan — not for ease from them, but for them to be a coolness to the eye and a line of righteousness that continues.',
        arabicText:
          'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَٰجِنَا وَذُرِّيَّٰتِنَا قُرَّةَ أَعْيُنٍ وَٱجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
        transliteration:
          'Rabbanā hab lanā min azwājinā wa dhurriyyātinā qurrata aʿyunin wa-jʿalnā lil-muttaqīna imāmā',
        translation:
          'Our Lord, grant us from our spouses and offspring comfort of eyes, and make us a model for the righteous.',
        source: 'Quran 25:74',
        sourceType: 'quran_dua',
      },
    ]),
    reflection:
      'If the traces you leave behind were read aloud tomorrow, what is on the list? Name one thing you could add before the year ends.',
  },
```

- [ ] **Step 5: Verify** — `npx tsc --noEmit` PASS + structural check (`quran_36_12`, `q_angle_death_day6`, `hadith_death_6` each count 1; tag `[Tafsir al-Qurtubi on 36:12]` at start; a split pattern present).

- [ ] **Step 6: Commit**

```bash
git add src/data/quranData.ts src/data/hadithData.ts
git commit -m "feat(journeys): Death Awareness day 6 — build one lasting deed (36:12, Muslim 1631)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Day 7 — verse `quran_29_5` + angle `q_angle_death_day7` + hadith `hadith_death_7` (Bukhārī 6507)

**Files:** `src/data/quranData.ts` (verse + angle), `src/data/hadithData.ts` (hadith).

**Interfaces:** Consumes `step_death_7` → `quran_29_5` / `q_angle_death_day7` / `hadith_death_7`. Produces those.

- [ ] **Step 1: Re-verify 29:5, Bukhārī 6507 (AR + EN — must include the clarification), Bukhārī 6351, Ibn Kathīr 29:5**

```bash
curl -s "https://api.alquran.cloud/v1/ayah/29:5/editions/quran-uthmani,en.sahih" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{for(const e of JSON.parse(d).data)console.log(e.edition.identifier+": "+e.text)})'
for h in bukhari/6507 bukhari/6351; do echo "== $h =="; curl -s "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-$h.json" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).hadiths[0].text))'; curl -s "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-$h.json" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).hadiths[0].text))'; done
curl -s "https://api.quran.com/api/v4/tafsirs/169/by_ayah/29:5" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).tafsir.text.replace(/<[^>]+>/g," ").slice(0,500)))'
```
Expected: āyah matches; 6507 EN includes ʿĀʾisha "But we dislike death" + "It is not like this…"; 6351 "None of you should long for death… O Allah! Let me live as long as life is better for me…"; Ibn Kathīr 29:5 "Allah will fulfill the Hopes of the Righteous… hopes for the meeting and does righteous deeds."

- [ ] **Step 2: Add `Content` verse `quran_29_5`** — shape as before, ` ﴿٥﴾`, `whyThis` ≈ "Ibn Kathīr: whoever hopes for the meeting *and does righteous deeds* — Allah will fulfil that hope. Hope here is active, not passive."

- [ ] **Step 3: Add `hadith_death_7`** (Bukhārī 6507) — `arabicText` / `translation` / `englishTranslation` must include the full clarification (ʿĀʾisha's objection + the Prophet's ﷺ answer about the believer being shown Allah's pleasure at death). Do not truncate to just the first sentence. `grading: 'sahih'`.

- [ ] **Step 4: Add the angle** `q_angle_death_day7` — opens `[Tafsir Ibn Kathir on 29:5]`; quotes the 6507 clarification (loving the meeting ≠ wishing to die); carries the 6351 counterweight; the "smallest keepable version" close; the crisis-pointer line; contains `. The Prophet ﷺ said:`; du'a = Bukhārī 6351 (`prophetic_dua`). 4 steps:

```ts
  {
    id: 'q_angle_death_day7',
    contentId: 'quran_29_5',
    mood: 'Hopeful',
    angle:
      "[Tafsir Ibn Kathir on 29:5] The whole journey lands here. The term Allah has set is coming regardless — the only variable is whether you meet it hoping or dreading. Ibn Kathir is careful that the hope in this ayah is not passive: whoever hopes for the meeting with Allah and does righteous deeds, He says, will have that hope fulfilled. The Prophet ﷺ said: whoever loves to meet Allah, Allah loves to meet him. When Aisha, or one of the wives, objected that they all dislike death, he answered that this is not what it means — it means that when a believer’s death draws near, they are shown Allah’s pleasure and honour, and at that point nothing is dearer to them than what lies ahead. So loving the meeting is not longing to die. He also forbade wishing for death outright: no one should wish for it because of a hardship, and if the wish comes anyway, the answer is a du’a that hands the timing back to Allah. What carried you through these seven days was returning, not intensity — so the plan you keep is the smallest version you can actually sustain. And if a day ever turns from ‘I hope to meet Him’ to ‘I want this to be over,’ the Hope journey and the in-app help line are the next step, not a private burden.",
    practiceSteps: JSON.stringify([
      {
        type: 'mindset',
        icon: 'sun',
        title: 'Meeting, not ending',
        instruction:
          'Write one sentence describing death as a meeting — who you are meeting, and what you hope is said to you.',
        source: 'Sahih al-Bukhari 6507',
      },
      {
        type: 'mindset',
        icon: 'shield',
        title: 'Loving the meeting is not wishing to die',
        instruction:
          'The Prophet ﷺ forbade longing for death because of hardship. If today feels like too much, that is what this du’a is for — and if the thought turns to not wanting to be alive, the Hope journey and the in-app help line are the next step, not something to carry alone.',
        source: 'Sahih al-Bukhari 6351',
      },
      {
        type: 'physical',
        icon: 'candle',
        title: 'The smallest keepable version',
        instruction:
          'Choose the one death-remembrance you will still be doing in a month — one line before sleep, one sadaqa a month, the waking du’a. Make it smaller until the honest answer is yes. Write it where you will see it.',
        source: 'Reflects the arc of this journey',
      },
      {
        type: 'verbal',
        icon: 'hands-prayer',
        title: 'The du’a that hands the timing back',
        instruction:
          'The Prophet ﷺ taught this for anyone who finds themselves wishing for death: do not name the outcome, ask for whichever is better.',
        arabicText:
          'اللَّهُمَّ أَحْيِنِي مَا كَانَتِ الْحَيَاةُ خَيْرًا لِي وَتَوَفَّنِي إِذَا كَانَتِ الْوَفَاةُ خَيْرًا لِي',
        transliteration:
          'Allāhumma aḥyinī mā kānati l-ḥayātu khayran lī, wa tawaffanī idhā kānati l-wafātu khayran lī',
        translation:
          'O Allah, keep me alive as long as life is better for me, and take my life when death is better for me.',
        source: 'Sahih al-Bukhari 6351',
        sourceType: 'prophetic_dua',
      },
    ]),
    reflection:
      'What is the one practice from these seven days you will actually keep? Make it smaller until the answer is yes.',
  },
```

- [ ] **Step 5: Verify** — `npx tsc --noEmit` PASS + structural check (`quran_29_5`, `q_angle_death_day7`, `hadith_death_7` each count 1; tag `[Tafsir Ibn Kathir on 29:5]` at start; `. The Prophet ﷺ said:` present; `Hope journey` present).

- [ ] **Step 6: Commit**

```bash
git add src/data/quranData.ts src/data/hadithData.ts
git commit -m "feat(journeys): Death Awareness day 7 — hope of the meeting (29:5, Bukhari 6507)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: Wire the registries, unlock, and bump the seed version

**Files:**
- Modify: `src/services/contentRepository.ts:32`
- Modify: `scripts/verify-journey.mjs` (`JOURNEYS` array, ~line 40)
- Modify: `scripts/verify-journey-roundtrip.mjs` (~line 104)
- Modify: `src/screens/PathsScreen.tsx` (`AVAILABLE_PATHS` ~line 58, `PREMIUM_GATED_PATHS` ~line 83, header comment ~line 5)
- Modify: `src/database/seedContent.ts` (`SEED_VERSION` line 218, add `// v36:` note ~line 217)

**Interfaces:**
- Consumes: all `q_angle_death_day1..7`, `hadith_death_3..7`, `quran_3_185/39_42/63_10/36_12/29_5`, `path_death_awareness.dailySteps` from Tasks 1–8.
- Produces: `path_death_awareness` startable + Pro-gated; `verify-journey.mjs` covers it.

- [ ] **Step 1: `contentRepository.ts` — add the prefix**

Change line 32:
```ts
export const JOURNEY_ANGLE_PREFIXES = ['rizq', 'salah', 'results', 'study', 'imam', 'crisis', 'marriage', 'tawbah', 'death'];
```

- [ ] **Step 2: `verify-journey.mjs` — add the JOURNEYS row**

After the `path_tawbah_intensive` row in the `JOURNEYS` array:
```js
  ['path_death_awareness', 'q_angle_death_', 'Hopeful', true],
```

- [ ] **Step 3: `verify-journey-roundtrip.mjs` — add to the path list**

Add `'path_death_awareness'` to the array literal near line 104:
```js
for (const pathId of ['path_trusting_the_results', 'path_study_journaling', 'path_prayer_leadership', 'path_hope_after_crisis', 'path_marriage_seeker', 'path_tawbah_intensive', 'path_death_awareness']) {
```

- [ ] **Step 4: `PathsScreen.tsx` — unlock + gate**

In `AVAILABLE_PATHS`, add (align the colon with the block):
```ts
  path_death_awareness:      '2026-08-29',
```
In `PREMIUM_GATED_PATHS`, add:
```ts
  path_death_awareness: 'Sakina Pro exclusive',
```
In the header doc comment (the sentence listing available paths, ~line 5–8), add "Death Awareness" to the list.

- [ ] **Step 5: `seedContent.ts` — bump + note**

Immediately above `const SEED_VERSION = 35;` add:
```ts
// v36: new journey — Death Awareness (path_death_awareness), 7 days, Sakina
//      Pro exclusive. Adds 5 Content verses (quran_3_185, quran_39_42,
//      quran_63_10, quran_36_12, quran_29_5 — quran_67_2 and quran_102_1_2
//      reused), q_angle_death_day1..day7, and hadith_death_3..7 (days 1-2 are
//      verse + tafsir led, no hadith row). staticPaths theme corrected
//      'Overwhelmed' -> 'Hopeful' (dhikr al-mawt is a readiness posture, not a
//      crisis one; see the design spec's scholarly review). Path was a locked
//      stub with dailySteps: []. Unlocked in AVAILABLE_PATHS + Pro-gated the
//      same commit.
```
Change `const SEED_VERSION = 35;` → `const SEED_VERSION = 36;`.

- [ ] **Step 6: Run the static journey verifier**

```bash
node scripts/verify-journey.mjs
```
Expected: PASS, with `path_death_awareness` now in its per-journey output and no errors. If it reports "borrowed mood angle" for the death days → the `id:` fields in `quranData.ts` are double-quoted (fix to single quotes) or the prefix in Step 1 is wrong. If "angle missing" → an `angleId` typo between `staticPaths.ts` and `quranData.ts`.

- [ ] **Step 7: Run the round-trip verifier + its negative mode**

```bash
node scripts/verify-journey-roundtrip.mjs
RT_INJECT=1 node scripts/verify-journey-roundtrip.mjs
```
Expected: both exit 0. First: all 7 days seed, read back, and replay through PathStepScreen + ContextLayer with no drift. Second: it corrupts Arabic-carrying steps and confirms the checks then fail (prints that it did so, exits 0).

- [ ] **Step 8: Typecheck + tests**

```bash
npx tsc --noEmit -p tsconfig.json
npx jest
```
Expected: both PASS. (`jest` covers `pathsService` / ownership — no behaviour change expected.)

- [ ] **Step 9: Commit**

```bash
git add src/services/contentRepository.ts scripts/verify-journey.mjs scripts/verify-journey-roundtrip.mjs src/screens/PathsScreen.tsx src/database/seedContent.ts
git commit -m "feat(journeys): wire + unlock Death Awareness (Sakina Pro, SEED_VERSION 36)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: Full citation gate + tafsir deep-read

**Files:** none by default — this task fixes anything the gate surfaces, in the files from Tasks 2–8.

- [ ] **Step 1: Citation verifier**

```bash
node scripts/verify-citations.mjs
```
Expected: PASS. It checks, across all angles: an asserted-Quran step's Arabic is in the cited āyah (Day 1 & Day 6 du'as → 3:193 / 25:74); every chain-claiming step cites something locatable; `actionSource` names a source not a title; a bare hadith citation's text contains the Arabic (Day 3/4/5/6/7 hadith steps); a `quran_dua` step under a non-Quran source line still matches its verse; and the sunnah.com text check for collections the mirror cannot answer (Muslim 1631). Fix any failure at its source and re-run.

- [ ] **Step 2: Tafsir-tag verifier + negative mode**

```bash
node scripts/verify-tafsir-tags.mjs
TAFSIR_INJECT=1 node scripts/verify-tafsir-tags.mjs
```
Expected: both exit 0. The first confirms all 8 tag references (7 angles + the Day 2 `18:110` step) resolve to substantive on-āyah entries. The second rewrites tags to junk and confirms the check then fails.

- [ ] **Step 3: Read each tafsir entry in full and confirm the angle's claim**

The verifier **cannot** tell whether the claim matches the tafsir. For each of the 8, fetch the full entry and read it:

```bash
for x in "169/3:185" "169/67:2" "169/18:110" "169/102:1" "90/39:42" "169/63:10" "90/36:12" "169/29:5"; do
  id="${x%/*}"; k="${x#*/}"; echo "======== $id @ $k ========";
  curl -s "https://api.quran.com/api/v4/tafsirs/$id/by_ayah/$k" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).tafsir.text.replace(/<[^>]+>/g," ").replace(/&[a-z]+;/g," ").replace(/\s+/g," ").trim()))';
  echo;
done
```

Confirm specifically:
- **3:185 / Ibn Kathir** — "consolation to all creation", *zuḥziḥa* = the only success, whip-space hadith. ✓ if present.
- **67:2 / Ibn Kathir** — "best in deed… not… the most deeds" (Muḥammad b. ʿAjlān).
- **18:110 / Ibn Kathir** — the riyāʾ / "showing off" ḥadīth qudsī (Abū Saʿīd b. Abī Faḍāla). The Day 2 step must not claim more than the entry says (no Fuḍayl "khāliṣ + ṣawāb" attribution).
- **102:1 / Ibn Kathir** — takāthur, "visiting the graves = being buried".
- **39:42 / al-Qurtubi** — *al-wafāt al-ṣughrā* / sleep-as-taking. (Arabic — read it.)
- **63:10 / Ibn Kathir** — the dying wish is for ṣadaqa (Ibn ʿAbbās / al-Ḥasan); not over-attaching to worldly matters.
- **36:12 / al-Qurtubi** — *āthār* = footsteps to the masjid + traces left behind; the clan-moving *sabab*. (Arabic — read it.)
- **29:5 / Ibn Kathir** — hope for the meeting **+ righteous deeds** → hope fulfilled.

If any angle asserts something the entry does not support, edit the angle prose down to what the entry actually says, re-run `npx tsc` + `node scripts/verify-tafsir-tags.mjs`, and note the change.

- [ ] **Step 4: Render-hazard verifier (cheap, no new views but run it)**

```bash
node scripts/verify-render-hazards.mjs
RH_INJECT=1 node scripts/verify-render-hazards.mjs
```
Expected: both exit 0.

- [ ] **Step 5: Full gate re-run**

```bash
npx tsc --noEmit -p tsconfig.json && npx jest && node scripts/verify-journey.mjs && node scripts/verify-journey-roundtrip.mjs && node scripts/verify-citations.mjs && node scripts/verify-tafsir-tags.mjs
```
Expected: all PASS / exit 0.

- [ ] **Step 6: Manual read-through**

Read all 7 angles + 5 hadith `whyThis` + every `practiceSteps` instruction once more against the spec's §"The scholarly frame":
1. Day 1 validates the instinct, then redirects (not bare validation).
2. Day 2 "best not most" + riyāʾ; no unverified Fuḍayl attribution.
3. Day 5 frames zuhd not rahbāniyya; Ibn ʿUmar's tail attributed to Ibn ʿUmar.
4. Day 6 does not over-weight "righteous child".
5. Day 7 quotes the Bukhārī 6507 clarification in full + carries the 6351 "never wish for death" counterweight.
6. Days 5, 6, 7 each carry one quiet crisis-resources line.
7. Every English sentence in quotes next to a citation is the published translation, not a hand-rendering from the Arabic.

- [ ] **Step 7: Commit any fixes**

```bash
git add -A
git commit -m "fix(journeys): Death Awareness citation + tafsir-claim pass

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Finish the branch**

Use `superpowers:finishing-a-development-branch` to decide integration (PR vs. merge). Do not push or open a PR without the user's say-so (repo rule). Summarise for the user: files changed, `SEED_VERSION` 35→36, all verifiers green, and that the journey is Pro-gated and device-unverified (needs an Expo run to confirm the 7 days render).

---

## Self-Review

**1. Spec coverage:**

| Spec section | Task |
|---|---|
| Placement (theme Hopeful, Pro-exclusive, prefix `death`, CRLF, single-quote ids) | Global Constraints + Task 1, 9 |
| Scholarly frame 1–8 (hope-fear, never romanticise dying, Day 1 redirect, Day 2 quality, Day 5 zuhd, Day 6 children, 6416 mawqūf, 6507 clarification) | Tasks 2, 3, 6, 8 prose + Task 10 Step 6 |
| Day 1–7 spec (verse, tafsir tag, angle direction, practice steps, reflection, du'a) | Tasks 2–8 |
| New Content verses (5) assert-once | Tasks 2, 5, 6, 7, 8 Step 1/2 |
| Reused verses (67:2, 102:1-2) — no dup | Tasks 3, 4 Step 1 |
| Hadith rows (5) + gradings + Muslim-via-sunnah.com | Tasks 4–8 |
| Distinct du'a per day | Tasks 2–8 (1:3:193, 2:IM925, 3:AD1522, 4:B6324, 5:B6413, 6:Q25:74, 7:B6351 — 7 distinct) |
| No verse/hadith repeat within journey | verses all distinct; hadith 2307/6324/6416/1631/6507 distinct — verified Task 9 Step 6 |
| Wiring items 1–11 | Task 9 |
| Verification gate | Tasks 9–10 |
| Out of scope (grave-visiting, grave punishment) | not authored — confirm in Task 10 Step 6 |

No gaps.

**2. Placeholder scan:** The `\uXXXX` escapes in the code blocks are deliberate transport encoding, flagged in each task ("paste the *actual* Arabic from Step 1"). Angle prose is provided in full as drafts, not "TBD". Practice steps are fully specified. Day 5/6/7 verse+hadith rows are specified by shape + the "Verified source data" block rather than a full literal — acceptable because the shape is shown twice (Tasks 2, 5) and the verified text is in one place above; an executor reading Task 6 alone has the shape from the file's existing rows plus the data block.

**3. Type consistency:** `contentId` values match between `staticPaths.ts` steps (Task 1) and the `ContentAngle` rows (Tasks 2–8). `angleId` `q_angle_death_dayN` consistent. `hadithContentId` `hadith_death_N` — note Days 1–2 have none (Task 1 omits the field; Tasks 2–3 add no hadith row for them). `JOURNEY_ANGLE_PREFIXES` entry `'death'` matches the `q_angle_death_` prefix used in the `JOURNEYS` row and the angle ids. `SEED_VERSION` 35→36 stated once. Icon names cross-checked against the `IconName` union list in Global Constraints. `sourceType` values all in the union; only on Arabic-carrying steps.
