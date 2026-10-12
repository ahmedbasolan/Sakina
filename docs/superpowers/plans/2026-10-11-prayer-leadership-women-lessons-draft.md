# Prayer Leadership — women's lessons + shared wording (DRAFT for review)

Date: 2026-10-12 · Status: **draft, awaiting Ahmed's approval** · Spec:
`docs/superpowers/specs/2026-10-11-prayer-leadership-leader-choice-design.md` (§2, §3)

This is the exact text Task 5 inserts. Nothing here is in the app yet. A scholar should
approve the six women's lessons before release (spec §3) — the fiqh below comes from
fatwa sites and an encyclopedia quoting the books, not from the books themselves.

**How to read it.** Each women's day is written against the man's day of the same
number. Where a sentence or step applies to a woman exactly as it does to a man, it is
carried over **verbatim** and marked *(carried over)*. Everything else is new or adapted,
and every sentence of it is either traced to a source in the table under the day or
marked *app voice*.

**Sources used** (all re-read on 2026-10-12 unless marked "spec §3"):

| Key | Source | URL |
|---|---|---|
| H-M673 | Sahih Muslim 673 (shared, Day 1 layer) | sunnah.com/muslim:673 |
| H-M433 | Sahih Muslim 433 (shared, Day 8 layer) | sunnah.com/muslim:433 |
| H-B780 | Sahih al-Bukhari 780 (shared, Day 9 layer) | jsdelivr eng-bukhari/780 |
| H-B722 | Sahih al-Bukhari 722 (shared, Day 10 layer) | jsdelivr eng-bukhari/722 |
| H-M571 | Sahih Muslim 571 (shared, Day 11 layer) | sunnah.com/muslim:571 |
| H-B1203 | Sahih al-Bukhari 1203 / 1204 — "The saying 'Subhan Allah' is for men and clapping is for women." | jsdelivr eng/ara-bukhari/1203, 1204 |
| H-AD592 | Sunan Abi Dawud 592 — Umm Waraqah; hasan (al-Albani, Muhyi al-Din Abd al-Hamid, Zubair Ali Zai) | jsdelivr eng/ara-abudawud/592 |
| H-B744 | Sahih al-Bukhari 744 — the opening du'a (carried over, Day 8) | jsdelivr eng-bukhari/744 |
| H-B734 | Sahih al-Bukhari 734 — "Say the Takbir when he says it" (carried over, Day 8) | jsdelivr eng-bukhari/734 |
| H-B772 | Sahih al-Bukhari 772 — "If you recite Al-Fatiha only it is sufficient…" (carried over, Day 11) | jsdelivr eng-bukhari/772 |
| T-IK54:17 | Ibn Kathir (abridged, en) on 54:17 | api.quran.com/api/v4/tafsirs/169/by_ayah/54:17 |
| T-IK2:238 | Ibn Kathir on 2:238 | …/169/by_ayah/2:238 |
| T-IK17:78 | Ibn Kathir on 17:78 | …/169/by_ayah/17:78 |
| T-IK2:43 | Ibn Kathir on 2:43 | …/169/by_ayah/2:43 |
| T-S4:28 | al-Sa'di on 4:28 (ar) | …/91/by_ayah/4:28 |
| T-S20:132 | al-Sa'di on 20:132 (ar) | …/91/by_ayah/20:132 |
| F-1371 | Dorar fiqh encyclopedia — the imam must be male: a woman does not lead men, by agreement of the four schools (Ibn Abidin, Ibn Abd al-Barr, al-Nawawi al-Majmu' 4/255, al-Mardawi); Ibn Hazm reports consensus | dorar.net/feqhia/1371 |
| F-1385 | Dorar — a woman may lead women: majority (Hanafi, Shafi'i, Hanbali), "except that the Hanafis hold it disliked"; Umm Salamah led Asr "and stood among us" (Abd al-Razzaq, Musannaf 5082), chain graded sahih by al-Nawawi (al-Majmu' 4/199); Ibn Hazm (al-Muhalla 3/137): "her ruling with us is to stand ahead of the women" | dorar.net/feqhia/1385 |
| F-1387 | Dorar — she stands in the middle of them: Hanafi (al-Zayla'i), Shafi'i (al-Nawawi), Hanbali (al-Ruhaybani); Ibn Qudamah: "we know of no disagreement in it among those who hold she may lead them" (al-Mughni 2/149). Aisha led women in Maghrib, stood in their middle and recited aloud (Ibn Hazm, al-Muhalla 4/219; chain graded sahih by Ibn al-Mulaqqin). Reciting aloud: she recites aloud in the audible prayers unless non-mahram men are present — Shafi'i (Rawdat al-Talibin) and Hanbali (Tashih al-Furu'); also Ibn Taymiyyah, Ibn Baz ("so that they hear her and benefit from the speech of Allah"), Ibn Uthaymin. Audible recitation in Fajr and the first two rak'ahs of Maghrib and Isha is by consensus (Ibn Hazm, al-Nawawi, Ibn Qudamah) and "general to men and women" (Ibn Baz) | dorar.net/feqhia/1387 |
| F-IbnBaz | Ibn Baz, fatwa "Ruling on a woman leading": permissible, and recommended when needed for teaching; the hadith "the most versed in the Book of Allah leads the people" includes women; a reciting, knowledgeable woman leading "the women of her household", or sisters gathered with her, "is all good"; it lets the women take her prayer as their example in her recitation, bowing, prostration, sitting between the prostrations and rising after ruku | binbaz.org.sa/fatwas/17618 (the bare-id URL now redirects to an unrelated fatwa; `…/fatwas/17618/x` resolves to the right page) |
| F-schools | Shafi'i recommended (SeekersGuidance, Shuaib Ally, from al-Majmu'); Hanbali permitted (Dorar, Diyanet); Hanafi disliked — prohibitively in the well-known view, mildly per some (SeekersGuidance, Basem Itani; al-Fatawa al-Hindiyya, Fath al-Qadir); Maliki **not permitted** (Diyanet citing Ibn Rushd, Ibn Juzay) | spec §3 |
| F-Jordan | Jordan Iftaa (Shafi'i): middle of the front row "while being advanced a bit in front of them" | spec §3 |
| F-Muslih | Hanafi + Maliki: a woman leading recites silently — al-Muslih only, so "reported" | spec §3 (almosleh.com/en/f-32487 returned 404 on 2026-10-12) |
| F-Humaydi | Fawzi al-Humaydi grades the companion reports weak and holds she stands ahead, as Ibn Hazm did | spec §3 (Ibn Hazm's view also read in F-1385) |

---

## Day 1 — `q_angle_imam_day1_f` (contentId `quran_54_17`, mood `Hopeful`)

**Step override (`step_imam_1.variants.womanLeading`):**
- `title`: **Who Should Lead** (man's: "Who Stands in Front")
- `focus`: no override — "The bar for leading is recitation, not seniority." holds for her as written (F-IbnBaz).
- `hadithContentId`: no override — `hadith_imam_1` (Muslim 673) is shared.

**angle**

```
[Tafsir Ibn Kathir on 54:17] Ibn Kathir explains that Allah made the Quran easy to recite and comprehend for those who seek it, and reads the ayah's closing question as asking whether anyone will remember through it. The bar for leading is far narrower than most people assume it is. The Prophet ﷺ said: "The one who is most versed in Allah's Book should act as Imam for the people" [Sahih Muslim 673] — not the most learned in fiqh, not the eldest, not the most respected in the room — and Ibn Baz held that this covers a woman leading women, which he called permissible, and recommended when it is needed for teaching. The schools differ on whether she leads at all: the Shafi'i school recommends it, the Hanbali school permits it, the Hanafi school holds it disliked, and the Maliki school does not permit it. All four agree that a woman does not lead men. What you can already recite without stumbling is the exact thing that hadith measures.
```

Split: `. The Prophet ﷺ said:` → Understand = the tafsir + "bar" sentences; Matters = from the hadith on.

**practiceSteps**

```js
[
  {
    type: 'mindset',
    icon: 'brain',
    title: 'Count what you already hold',
    instruction: "Write the list out. Most people who assume they cannot lead find they have Al-Fatihah and four or five short surahs — which is already enough for two rak'ahs.",
    source: "\"The one who is most versed in Allah's Book should act as Imam for the people.\" [Sahih Muslim 673]",
  }, // (carried over verbatim)
  {
    type: 'physical',
    icon: 'home',
    title: 'Lead the smallest congregation there is',
    instruction: 'Lead one prayer at home this week — the women of your household, or a sister who joins you. Confidence is built at that size. If you follow the Maliki school, it does not permit a woman to lead the prayer; the days on learning and reciting surahs serve you either way.',
    source: 'Ibn Baz, fatwa on a woman leading women (binbaz.org.sa, fatwa 17618)',
  },
  {
    type: 'verbal',
    icon: 'hands-prayer',
    title: "The du'a of the one sent to speak",
    instruction: 'Musa asked for this before he was sent to speak in front of people who frightened him. Say it before you step forward.',
    arabicText: 'رَبِّ ٱشْرَحْ لِى صَدْرِى وَيَسِّرْ لِىٓ أَمْرِى وَٱحْلُلْ عُقْدَةً مِّن لِّسَانِى يَفْقَهُوا۟ قَوْلِى',
    transliteration: "rabbi ish'raḥ lī ṣadrī wayassir lī amrī wa-uḥ'lul ʿuq'datan min lisānī yafqahū qawlī",
    translation: 'My Lord, expand for me my breast, and ease for me my task, and untie the knot from my tongue that they may understand my speech.',
    source: 'Quran 20:25-28',
    sourceType: 'quran_dua',
  }, // (carried over verbatim)
]
```

**reflection** *(carried over)*: `What is actually holding you back — not knowing enough, or not wanting to be seen trying?`

**Removed, not replaced:** the man's "If only one person joins you he stands level with you on your right" and its source Bukhari 699 (no source found for where one woman follower stands — spec §2).

| Claim | Source |
|---|---|
| Allah made the Quran easy to recite and comprehend for those who seek it; the closing question asks whether anyone will remember through it | T-IK54:17 ("We have made the Qur'an easy to recite and comprehend for those who seek these traits"; "is there anyone who will remember through this Qur'an") |
| "The bar for leading is far narrower…" | app voice (adapted from man's) |
| Hadith quote | H-M673 (verbatim substring of sunnah.com English) |
| "not the most learned in fiqh, not the eldest…" | app voice, carried over; consistent with the order in H-M673 (reciting → Sunnah → hijrah → Islam/age) |
| Ibn Baz: covers a woman leading women; permissible, recommended when needed for teaching | F-IbnBaz |
| Shafi'i recommends / Hanbali permits / Hanafi disliked / Maliki not permitted | F-schools (spec §3); Hanafi "disliked" also F-1385 |
| All four agree a woman does not lead men | F-1371 |
| "What you can already recite…" | app voice, carried over |
| Step 2: lead the women of your household or a sister | F-IbnBaz ("the women of her household, or some of her sisters gather with her") |
| Step 2: Maliki does not permit it; surah days serve her either way | F-schools; spec §2 "Known gaps" |

---

## Day 8 — `q_angle_imam_day8_f` (contentId `quran_2_238`, mood `Hopeful`)

No title/focus override. `hadithContentId`: shared `hadith_imam_8` (Muslim 433).

**angle**

```
[Tafsir Ibn Kathir on 2:238] Ibn Kathir explains standing before Allah "with obedience" as standing with humbleness and humility before Him, and reads the command as forbidding ordinary speech in the prayer. When you lead women you take that posture among them, not ahead of them: the Hanafi, Shafi'i and Hanbali schools place her in the middle of the front row, and Ibn Qudamah wrote that he knew of no disagreement on it among those who allow her to lead. Umm Salamah is reported to have led women in Asr and stood among them, a chain al-Nawawi graded sahih; Fawzi al-Humaydi grades these reports weak and holds, as Ibn Hazm did, that she leads from ahead of the row. The Prophet ﷺ said: "Straighten your rows, for the straightening of a row is a part of the perfection of prayer" [Sahih Muslim 433] — so the first thing you do as imam is not recite, it is look along the line you are standing in and level it. When that is done, the takbir, the silent opening du'a and the recitation follow in an order that never changes.
```

Split: `. The Prophet ﷺ said:` (checked before `. When you` in `splitPatterns`, so the earlier "When you lead women" does not split).

**practiceSteps**

```js
[
  {
    type: 'physical',
    icon: 'person',
    title: 'Where you stand',
    instruction: 'Stand in the middle of the front row, with the women on either side of you rather than ahead of you. The Hanafi, Shafi\'i and Hanbali schools agree on this; the Jordanian Iftaa, following the Shafi\'i school, adds that she is advanced a little ahead of them. Umm Salamah is reported to have led women in Asr standing among them.',
    source: 'Dorar Fiqh Encyclopedia, citing al-Zayla\'i, al-Nawawi and al-Ruhaybani, and Ibn Qudamah, al-Mughni 2/149 · Umm Salamah: Musannaf Abd al-Razzaq 5082',
  },
  {
    type: 'physical',
    icon: 'muscle',
    title: 'Level the row before the takbir',
    instruction: 'Look along the row on both sides of you and straighten it before you begin. A row is levelled before the prayer starts, not during it.',
    source: '"Straighten your rows, for the straightening of a row is a part of the perfection of prayer." [Sahih Muslim 433]',
  },
  {
    type: 'verbal',
    icon: 'hands-prayer',
    title: 'The silence after the takbir',
    instruction: 'He stayed silent for a moment between the takbir and the recitation. This is what he said in that gap — say it before you begin Al-Fatihah.',
    arabicText: 'اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَاىَ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ، اللَّهُمَّ نَقِّنِي مِنَ الْخَطَايَا كَمَا يُنَقَّى الثَّوْبُ الأَبْيَضُ مِنَ الدَّنَسِ، اللَّهُمَّ اغْسِلْ خَطَايَاىَ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ',
    transliteration: "Allahumma ba'id bayni wa bayna khatayaya kama ba'adta bayna al-mashriqi wal-maghrib. Allahumma naqqini min al-khataya kama yunaqqa ath-thawb al-abyad min ad-danas. Allahumma ighsil khatayaya bil-ma'i wath-thalji wal-barad.",
    translation: 'O Allah, set me apart from my sins as You have set apart the East and the West. O Allah, cleanse me of my sins as a white garment is cleansed of dirt. O Allah, wash away my sins with water, snow and hail.',
    source: 'Sahih al-Bukhari 744',
    sourceType: 'prophetic_dua',
    sourceGrading: 'sahih',
  }, // (carried over verbatim)
  {
    type: 'verbal',
    icon: 'muscle',
    title: 'Say the takbir so the row can follow it',
    instruction: 'The opening takbir is a signal before it is a phrase. If the women at the ends of the row cannot hear it, they start after you and stay a step late for the whole prayer.',
    source: '"The Imam is to be followed. Say the Takbir when he says it." [Sahih al-Bukhari 734]',
  },
]
```

**reflection**: `Picture the moment before the takbir. What do you do with your hands, your eyes, the row you are standing in?`
(man's ends "the row in front of you?")

**Removed, not replaced (men-only mechanics):** "One man praying with you stands level with you on your right… When a second man arrives…" (Abu Dawud 634); "Where your household stands" — leading your wife alone, a son at your right (Muslim 660, Bukhari 380).

| Claim | Source |
|---|---|
| "with obedience" = with humbleness and humility before Him; forbids ordinary speech in prayer | T-IK2:238 ("meaning, with humbleness and humility before Him… This command indicates that it is not allowed to speak during the prayer") |
| She stands in the middle (Hanafi, Shafi'i, Hanbali) | F-1387 |
| Ibn Qudamah: no disagreement among those who allow her to lead | F-1387 (al-Mughni 2/149) |
| "middle of the front row" | F-1387 says "in their middle"; spec §3 / F-Jordan say "middle of the front row" |
| Umm Salamah led women in Asr, stood among them; al-Nawawi graded the chain sahih | F-1385 (Musannaf 5082, al-Majmu' 4/199) |
| al-Humaydi grades weak, holds she leads from ahead; Ibn Hazm held the same | F-Humaydi (spec §3); Ibn Hazm also F-1385 ("her ruling with us is to stand ahead of the women") |
| Hadith quote | H-M433 |
| "first thing… is look along the line…"; "order that never changes" | app voice (adapted from man's) |
| Jordanian Iftaa nuance | F-Jordan (spec §3) |
| Opening du'a step | H-B744 (carried over; the narration describes the silence between takbir and recitation and gives this du'a) |
| Takbir step | H-B734 (carried over, "back of the row" → "ends of the row"; spec §2 "the takbir unchanged") |

---

## Day 9 — `q_angle_imam_day9_f` (contentId `quran_17_78`, mood `Hopeful`)

No title/focus override. `hadithContentId`: shared `hadith_imam_9` (Bukhari 780).

**angle**

```
[Tafsir Ibn Kathir on 17:78] Ibn Kathir records that "the recitation of dawn is ever witnessed" refers to the angels of the night and of the day attending it. Reciting aloud in Fajr and in the first two rak'ahs of Maghrib and Isha is a ruling for women as well as men, and the Shafi'i and Hanbali schools have a woman leading women recite aloud in them, so that the women hear her — unless men who are not her mahram are present. The Hanafi and Maliki schools are reported to have her recite quietly. Aisha is reported to have led women in Maghrib, standing in their middle and reciting aloud, a chain Ibn al-Mulaqqin graded sahih, though Fawzi al-Humaydi grades these reports weak. The Prophet ﷺ said: "Say Amin when the Imam says it" [Sahih al-Bukhari 780] — so the row is being handed something to answer. Your voice is now setting the pace for every woman praying with you, which means steady matters far more than impressive, and the beat you leave after Al-Fatihah is where the row catches up with you.
```

Split: `. The Prophet ﷺ said:`.

**practiceSteps**

```js
[
  {
    type: 'mindset',
    icon: 'sun',
    title: 'Know when you recite aloud',
    instruction: "In the Shafi'i and Hanbali schools you recite aloud in Fajr and the first two rak'ahs of Maghrib and Isha so the women can hear you, unless men who are not your mahram are present. The Hanafi and Maliki schools are reported to have a woman recite quietly. Follow your own school.",
    source: "Dorar Fiqh Encyclopedia, citing al-Nawawi, Rawdat al-Talibin, and al-Mardawi, Tashih al-Furu'",
  },
  {
    type: 'physical',
    icon: 'breathing',
    title: 'Slower than feels natural',
    instruction: 'Nerves speed you up without your noticing. Recite deliberately slower than you would alone — measured recitation is what is asked for and what a row can actually follow.',
    source: 'Surah Al-Muzzammil 73:4',
  }, // (carried over verbatim)
  {
    type: 'verbal',
    icon: 'chat',
    title: 'Leave a beat for the Ameen',
    instruction: 'Say Ameen after the last ayah of Al-Fatihah in the way your school teaches — schools differ on whether the imam says it aloud or quietly — then pause before starting the surah. Where the imam says it aloud, that silence is where the row says it with you.',
    source: '"Say Amin when the Imam says it." [Sahih al-Bukhari 780]',
  }, // (carried over verbatim)
]
```

**reflection** *(carried over)*: `Record yourself reciting Al-Fatihah aloud and play it back. Was it slower or faster than you expected?`

**Replaced:** the man's step 1 "Know which prayers are aloud" (Bukhari 772) — for her the rule carries a condition (non-mahram men) and a school split, which F-1387 gives. Bukhari 772 is not cited on this day in the women's sequence (it stays on Day 11).

| Claim | Source |
|---|---|
| "ever witnessed" = the angels of the night and of the day attend it | T-IK17:78 (the hadith he records: "It is witnessed by the angels of the night and the angels of the day"). The man's angle adds "which is part of why Fajr is recited aloud" inside the credit — not in the entry, so not carried over |
| Aloud in Fajr + first two of Maghrib/Isha; ruling general to men and women | F-1387 (consensus: Ibn Hazm, al-Nawawi, Ibn Qudamah; "general to men and women" — Ibn Baz) |
| Shafi'i + Hanbali: she recites aloud unless non-mahram men are present; "so that the women hear her" | F-1387 (Rawdat al-Talibin, Tashih al-Furu'; Ibn Baz "so that they hear her") |
| Hanafi + Maliki reported quiet | F-Muslih (spec §3, "reported") — about recitation only, per spec §2 |
| Aisha led Maghrib, stood in their middle, recited aloud; Ibn al-Mulaqqin graded chain sahih | F-1387 |
| al-Humaydi grades weak | F-Humaydi (spec §3) |
| Hadith quote | H-B780 (same wording as the shared hadith layer) |
| "handed something to answer"; pace/steady/beat sentences | app voice (adapted from man's; "every person standing behind you" → "every woman praying with you") |

Shared-hadith constraint (spec §2): nothing here tells her to be inaudible to her own row; the "quietly" report is stated as being about recitation.

---

## Day 10 — `q_angle_imam_day10_f` (contentId `quran_2_43`, mood `Hopeful`)

No title/focus override (title "The Imam Is Followed" and focus "Transition takbirs and the pace of the row." stay shared — see Concerns). `hadithContentId`: shared `hadith_imam_10` (Bukhari 722).

**angle**

```
[Tafsir Ibn Kathir on 2:43] Ibn Kathir explains "bow down along with those who bow" as being among the believers in the best of the deeds they do, foremost of them the prayer. Once women are praying with you, every movement you make has become an instruction to them. The Prophet ﷺ said: "The Imam is (appointed) to be followed. So do not differ from him, bow when he bows…" [Sahih al-Bukhari 722], and to say Rabbana lakal hamd [Our Lord, to You is all praise] when the imam says Sami'a llahu liman hamidah [Allah has heard whoever praises Him]. Ibn Baz counted it among the benefits of a woman leading that the women take her prayer as their example — her recitation, her bowing, her prostration, her sitting between the prostrations and her rising after ruku. Your movements have to be unhurried, or the row cannot stay with you.
```

Split: `. The Prophet ﷺ said:`.

**practiceSteps**

```js
[
  {
    type: 'physical',
    icon: 'clock',
    title: 'Arrive before you move on',
    instruction: 'Settle fully into each position before you move to the next. Everyone following you is always half a second later than you are.',
    source: 'Surah Al-Baqarah 2:43',
  },
  {
    type: 'mindset',
    icon: 'person',
    title: 'Your pace is now their pace',
    instruction: 'What felt comfortable praying alone is usually too quick for a row. Assume you are faster than you think and slow down before you are told.',
    source: 'Surah Al-Baqarah 2:43',
  }, // (carried over verbatim)
  {
    type: 'verbal',
    icon: 'chat',
    title: 'What the row answers',
    instruction: "When you rise from ruku saying Sami'a llahu liman hamidah [Allah has heard whoever praises Him], the women with you answer Rabbana lakal hamd [Our Lord, to You is all praise]. Following you is the whole of their part in the prayer's movements.",
    source: '"The Imam is (appointed) to be followed. So do not differ from him…" [Sahih al-Bukhari 722]',
  },
]
```

**reflection** *(carried over)*: `In the last congregation you prayed in, did the imam ever move before you had settled? What did that feel like?`

**Dropped (spec §2):** the man's step "Say the transitions out loud" and the angle's "your transitions have to be audible" — no source read for a voice rule on her transition takbirs.

| Claim | Source |
|---|---|
| "bow… with those who bow" = be among the believers in the best of their deeds, foremost the prayer | T-IK2:43 ("And be among the believers performing the best deeds they perform, such as, and foremost, the prayer"). The man's credit ("read as an instruction about praying in congregation") is close to the entry's "many scholars said this Ayah is proof for the obligation of… congregation (for men only)"; not used here because of the "(for men only)" |
| "every movement… instruction" | app voice, carried over |
| Hadith quote + Rabbana lakal hamd / Sami'a llahu | H-B722 |
| Ibn Baz: the women take her prayer as their example in recitation, bowing, prostration, sitting, rising after ruku | F-IbnBaz |
| "Your movements have to be unhurried…" | app voice |
| Step 1 (adapted: "call the next takbir" → "move to the next"; "behind you" → "following you") | app voice, source 2:43 carried over |
| Step 3: the row answers Rabbana lakal hamd when she says Sami'a llahu | H-B722 |
| "Following you is the whole of their part…" | app voice — **review**: restates "do not differ from him"; cut if it reads as more than the hadith says |

Shared-hadith constraint (spec §2): Step 3 assumes the row hears her "Sami'a llahu liman hamidah", consistent with H-B722; no instruction asks her to be inaudible.

---

## Day 11 — `q_angle_imam_day11_f` (contentId `quran_4_28`, mood `Hopeful`)

No title/focus override (focus "Sujud as-sahw, and how a congregation corrects you." fits). `hadithContentId`: shared `hadith_imam_11` (Muslim 571).

**angle**

```
[Tafsir al-Sa'di on 4:28] Al-Sa'di explains that Allah lightens the law out of His mercy and His knowledge of human weakness from every side — weakness of body, of will, of resolve, of faith and of patience. The prostrations of forgetfulness are one of the places in the prayer where that lightening becomes visible, and everyone who has ever led has lost their place at some point. The Prophet ﷺ said: "He should cast aside his doubt and base his prayer on what he is sure of, then perform two prostrations before giving salutations" [Sahih Muslim 571] — there is a fixed procedure, which tells you the slip was expected. When you forget, you do not stop; you take the number you are certain of and finish.
```

Split: `. The Prophet ﷺ said:`.

**practiceSteps**

```js
[
  {
    type: 'mindset',
    icon: 'shield',
    title: 'Take the lower number',
    instruction: 'If you cannot remember whether that was three or four, treat it as three, complete the prayer, and prostrate twice. This narration puts the two prostrations before the salam; schools differ on the details of doubt and on that timing, so follow your own school.',
    source: '"He should cast aside his doubt and base his prayer on what he is sure of, then perform two prostrations before giving salutations." [Sahih Muslim 571]',
  }, // (carried over verbatim)
  {
    type: 'physical',
    icon: 'chat',
    title: 'How they will correct you',
    instruction: 'The hadith gives clapping to women as the way to alert the imam; applied to a woman leading women, the women praying with you clap. It is a prompt rather than a complaint — take the correction and carry on.',
    source: "\"The saying 'Subhan Allah' is for men and clapping is for women.\" [Sahih al-Bukhari 1203]",
  },
  {
    type: 'mindset',
    icon: 'calm-face',
    title: 'A blank is not a disqualification',
    instruction: "If a surah leaves you mid-rak'ah, move to one you know, or simply go into ruku — Al-Fatihah on its own is enough for the rak'ah to stand. Being human in front of people is provided for.",
    source: '"If you recite Al-Fatiha only it is sufficient, but if you recite something else in addition, it is better." [Sahih al-Bukhari 772]',
  }, // (carried over verbatim)
]
```

**reflection** *(carried over)*: `What is the specific mistake you are most afraid of making in front of people? Write down what would actually happen next.`

| Claim | Source |
|---|---|
| Allah lightens out of mercy and knowledge of human weakness — body, will, resolve, faith, patience | T-S4:28 ("وذلك لرحمته التامة… وعلمه وحكمته بضعف الإنسان من جميع الوجوه، ضعف البنية، وضعف الإرادة، وضعف العزيمة، وضعف الإيمان، وضعف الصبر"). The man's "rather than as an accusation" is app framing inside the credit — not carried over |
| Prostrations of forgetfulness as a place the lightening is visible; "everyone who has led…" | app voice (in the app's sentence, not credited to al-Sa'di) |
| Hadith quote + "fixed procedure…" | H-M571; app voice, carried over |
| Clapping is for women | H-B1203 / H-B1204 (quoted) |
| Applying it to a woman imam: her followers clap | **app's application**, stated as such in the instruction (spec §2) |
| Step 3 | H-B772 (carried over) |

**Removed:** "Men behind you say Subhan Allah" and "without turning round" (she stands in the row).

---

## Day 14 — `q_angle_imam_day14_f` (contentId `quran_20_132`, mood `Hopeful`)

**Step override:**
- `title`: **Lead the Women of Your House** (man's: "Go Back and Lead Your People")
- `focus`: **Naming the prayer, the women, and the surahs.** (man's: "…the people, and the surahs.")
- `hadithContentId`: **`hadith_imam_14_f`** (Abu Dawud 592) — draft below.

**angle**

```
[Tafsir al-Sa'di on 20:132] Al-Sa'di reads the command as urging your family to prayer — and, since commanding a thing commands what it requires, teaching them what makes the prayer valid, invalid and complete — and "be steadfast therein" as establishing it with its limits, pillars, manners and khushu', which is hard on the soul and has to be pressed on. That second command is addressed to the one giving the first, before anyone is asked to follow. Your first congregation is the women already in your house. The Messenger of Allah ﷺ visited Umm Waraqah at her house, appointed a mu'adhdhin for her, and "commanded her to lead the inmates of her house in prayer" [Sunan Abi Dawud 592]. The four schools agree that a woman does not lead men, so the people you lead are the women. Pick a prayer, pick the women who will pray with you, and lead.
```

Split: `. Your ` → Understand = al-Sa'di; Matters = from "Your first congregation…".

> Note: the al-Sa'di sentence is carried over verbatim. It contains the word "invalid" — that is al-Sa'di's "يفسدها" (what invalidates the prayer), not a ruling about women. The Step 4 audit's "invalid" search is aimed at men's-prayer-behind-her / Maliki wording, and this hit is reported there.

**practiceSteps**

```js
[
  {
    type: 'physical',
    icon: 'home',
    title: 'Name the prayer and the women',
    instruction: 'Choose one specific prayer in the next three days and which women of your house will pray with you. An unnamed intention is how this stays a plan forever.',
    source: '"…he commanded her to lead the inmates of her house in prayer." [Sunan Abi Dawud 592]',
  },
  {
    type: 'mindset',
    icon: 'checkmark',
    title: 'Fix your two surahs in advance',
    instruction: "Decide now which surah goes in each rak'ah, and write it down. Choosing at the takbir is what makes people freeze.",
    source: 'Surah Ta-Ha 20:132',
  }, // (carried over verbatim)
  {
    type: 'verbal',
    icon: 'hands-prayer',
    title: 'Ask to be made one who leads',
    instruction: 'The believers in Surah Al-Furqan ask for exactly this. Say it before you step forward.',
    arabicText: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَٰجِنَا وَذُرِّيَّـٰتِنَا قُرَّةَ أَعْيُنٍ وَٱجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
    transliteration: "rabbanā hab lanā min azwājinā wadhurriyyātinā qurrata aʿyunin wa-ij'ʿalnā lil'muttaqīna imāman",
    translation: 'Our Lord, grant us from among our wives and offspring comfort to our eyes, and make us an example for the righteous.',
    source: 'Quran 25:74',
    sourceType: 'quran_dua',
  }, // (carried over verbatim — see Concerns on "wives")
]
```

**reflection**: `Which prayer, which day, and which women will be praying with you? Write the three answers down now.`

| Claim | Source |
|---|---|
| al-Sa'di sentence | T-S20:132 ("حث أهلك على الصلاة… والأمر بالشيء أمر بجميع ما لا يتم إلا به، فيكون أمرا بتعليمهم ما يصلح الصلاة ويفسدها ويكملها… بإقامتها بحدودها وأركانها وآدابها وخشوعها، فإن ذلك مشق على النفس، ولكن ينبغي إكراهها") — carried over |
| "That second command is addressed to the one giving the first…" | app voice, carried over |
| "first congregation is the women already in your house" | app voice; F-IbnBaz ("the women of her household") |
| He visited her at her house, appointed a mu'adhdhin, commanded her to lead the inmates of her house | H-AD592 (quoted words verbatim from the jsdelivr English) |
| Four schools: a woman does not lead men | F-1371 |
| "so the people you lead are the women"; "Pick a prayer…" | app voice |
| Step 1 | H-AD592 (quoted); instruction app voice adapted from man's |

**Removed:** Bukhari 628 (men from one tribe sent home; "the oldest one amongst you should lead") — replaced by Abu Dawud 592, per spec §2.

### `hadith_imam_14_f` (new, `hadithData.ts`)

Fetched whole from `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-abudawud/592.json` and `…/eng-abudawud/592.json` (2026-10-12). Grades in the mirror: Al-Albani **Hasan**; Muhammad Muhyi al-Din Abd al-Hamid **Hasan**; Zubair Ali Zai **Hasan**.

Full Arabic as fetched (isnad + matn):

> حَدَّثَنَا الْحَسَنُ بْنُ حَمَّادٍ الْحَضْرَمِيُّ، حَدَّثَنَا مُحَمَّدُ بْنُ فُضَيْلٍ، عَنِ الْوَلِيدِ بْنِ جُمَيْعٍ، عَنْ عَبْدِ الرَّحْمَنِ بْنِ خَلاَّدٍ، عَنْ أُمِّ وَرَقَةَ بِنْتِ عَبْدِ اللَّهِ بْنِ الْحَارِثِ، بِهَذَا الْحَدِيثِ وَالأَوَّلُ أَتَمُّ قَالَ وَكَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَزُورُهَا فِي بَيْتِهَا وَجَعَلَ لَهَا مُؤَذِّنًا يُؤَذِّنُ لَهَا وَأَمَرَهَا أَنْ تَؤُمَّ أَهْلَ دَارِهَا ‏.‏ قَالَ عَبْدُ الرَّحْمَنِ فَأَنَا رَأَيْتُ مُؤَذِّنَهَا شَيْخًا كَبِيرًا ‏.‏

Full English as fetched:

> This tradition has also been narrated through a different chain of transmitters by Umm Waraqah daughter of ‘Abd Allah b. al-Harith. The first version is complete. This version goes:The Messenger of Allah(ﷺ) used to visit her at her house. He appointed a mu’adhdhin to call adhan for her; and he commanded her to lead the inmates of her house in prayer. ‘Abd al-Rahman said: I saw her mu’adhdhin who was an old man

Proposed entry (matn only, from "وَكَانَ" to the end, as the other `hadith_imam_*` layers drop the isnad):

```js
{
  id: 'hadith_imam_14_f',
  type: 'Hadith',
  primaryText: 'He commanded her to lead the inmates of her house in prayer',
  arabicText: 'وَكَانَ رَسُولُ اللَّهِ صلى الله عليه وسلم يَزُورُهَا فِي بَيْتِهَا وَجَعَلَ لَهَا مُؤَذِّنًا يُؤَذِّنُ لَهَا وَأَمَرَهَا أَنْ تَؤُمَّ أَهْلَ دَارِهَا ‏.‏ قَالَ عَبْدُ الرَّحْمَنِ فَأَنَا رَأَيْتُ مُؤَذِّنَهَا شَيْخًا كَبِيرًا ‏.‏',
  translation: "The Messenger of Allah (ﷺ) used to visit her at her house. He appointed a mu'adhdhin to call adhan for her; and he commanded her to lead the inmates of her house in prayer. 'Abd al-Rahman said: I saw her mu'adhdhin who was an old man.",
  englishTranslation: "The Messenger of Allah (ﷺ) used to visit her at her house. He appointed a mu'adhdhin to call adhan for her; and he commanded her to lead the inmates of her house in prayer. 'Abd al-Rahman said: I saw her mu'adhdhin who was an old man.",
  source: 'Sunan Abi Dawud 592',
  transliteration: "Wa kana Rasulullahi ﷺ yazuruha fi baytiha, wa ja'ala laha mu'adhdhinan yu'adhdhinu laha, wa amaraha an ta'umma ahla dariha",
  whyThis: 'The command was to lead the people of her own house — the first congregation is the one already at home.',
  propheticPractice: {
    description: 'Lead one prayer for the women of your own house',
    source: 'Sunan Abi Dawud 592',
    grading: 'hasan',
  },
  moods: [],
}
```

Notes for Task 5: (a) `HadithLayer.tsx` reads the grade only from `propheticPractice.grading` (`hadith.propheticPractice?.grading || 'authentic'`), so `'hasan'` must stay there — dropping it would render "Authentic". The other `hadith_imam_*` entries have no top-level `grading` either. (b) The English apostrophes are normalised from the mirror's ‘ ’ to ' to match the file; the words are unchanged. (c) **Decision for Ahmed:** the matn ends with the narrator's remark that her mu'adhdhin was an old man. It is kept so the layer is not a slice; the shorter alternative ends at "أَهْلَ دَارِهَا" / "…in prayer." The lesson text says nothing about who was in her house beyond the hadith's words.

---

## Shared edits (both versions) — before → after

### Day 1, man (`q_angle_imam_day1`, step "Lead the smallest congregation there is")

Before:
> These days are written for a man leading; if you are a woman, whether and how you lead other women is something schools answer differently, so ask a trusted scholar before using Day 8 — the days on learning and reciting surahs are useful either way.

After:
> If a woman is leading women, choose that on the journey screen — Days 1, 8, 9, 10, 11 and 14 change where the practice differs.

### Day 8, man (`q_angle_imam_day8`, step "Where they stand, by how many")

Before:
> This describes a man leading; if you are a woman leading women, ask a trusted scholar how your school arranges the row.

After:
> If a woman is leading women, choose that on the journey screen — Days 1, 8, 9, 10, 11 and 14 change where the practice differs.

### Day 7 (both) — `step_imam_7` in `staticPaths.ts` and `q_angle_imam_day7`

- `title`: "Surahs the Mosque Knows" → **"Surahs Everyone Knows"**
- `reflection`: "Which surah would you reach for if the iqamah were called and everyone turned to you right now?" → **"Which surah would you reach for if everyone turned to you right now?"**
- "mosque" wording in the angle / practice steps: **none present** — the Day 7 angle and its three steps contain no "mosque", "masjid" or "iqamah" (searched 2026-10-12). Nothing else to change. (`hadith_imam_7` is also clean.)

### Day 12 (both) — `q_angle_imam_day12`, step "Look at who is actually behind you"

Before:
> An elderly man, someone straight from work, a parent with a child who will not last. He named exactly these people as the reason.

After:
> Someone elderly, someone straight from work, a parent with a child who will not last. He named exactly these people as the reason.

(The step's title "Look at who is actually behind you" is shared and is accurate for her too — the women stand beside her, but this day is shared and the spec changes only the "elderly man" wording. Flagged under Concerns.)

---

## Step 4 self-audit (women's days 1, 8, 9, 10, 11, 14 + `hadith_imam_14_f`)

Searched the women's text (angle, practiceSteps, reflection, overrides, hadith layer) — not the source tables, the "Before" quotations of men's text, or the "Removed" notes.

| Search | Hits in women's text | Disposition |
|---|---|---|
| "invalid" | 1 — Day 14 angle, al-Sa'di's "valid, invalid and complete" | Kept: it is al-Sa'di's "يفسدها" about the prayer in general, carried over verbatim; not a claim about women or the Maliki school. |
| "stands in front" | 0 | Day 8 states al-Humaydi/Ibn Hazm's view as "leads from ahead of the row". |
| "behind you" | 0 | Man's "behind you" in Day 10 step 1 → "following you"; Day 9 → "praying with you". |
| "Subhan Allah" (as what her followers say) | 0 as an instruction; 1 inside the quoted Bukhari 1203 source on Day 11 | The quote is the hadith's own words ("…is for men"); the instruction says her followers clap. |
| "silent"/"quietly" applied to takbirs | 0 | "silent opening du'a" (Day 8 angle), "stayed silent… between the takbir and the recitation" (Day 8 step 3, carried over), "quietly" for recitation (Day 9) and for Ameen (Day 9 step 3, carried over) — none applies to a takbir. |
| Hadith numbers not in {Bukhari 1203/1204, Abu Dawud 592, the day's shared hadith} | 3 — Bukhari 744 and 734 (Day 8), Bukhari 772 (Day 11) | **Kept deliberately; decision for Ahmed** — see Concerns 1. |

Run mechanically (scratchpad `audit.mjs` over the code blocks, reflections and overrides of the six women's days): invalid 1, stands in front 0, "behind" (any) 0, Subhan Allah 1 (the quote), silent/quietly 5 (all non-takbir, listed above). Numbers found: the ten hadith below plus **Musannaf Abd al-Razzaq 5082** (Day 8 step 1 source) — a companion report from spec §3, not a hadith; it is in prose/source only, never in the hadith layer.

Hadith numbers present, per day: D1 Muslim 673 · D8 Muslim 433, Bukhari 744, Bukhari 734 · D9 Bukhari 780 · D10 Bukhari 722 · D11 Muslim 571, Bukhari 1203, Bukhari 772 · D14 Abu Dawud 592. No number appears on two women's days. Within the full women's sequence (shared days 2–7, 12, 13 included), none of these numbers is cited on another day (checked against every `q_angle_imam_day*` citation). Every one was fetched and read whole on 2026-10-12.

---

## Concerns for review

1. **The brief's hadith whitelist vs. the owner's rule.** The brief allows only Bukhari 1203/1204, Abu Dawud 592 or the day's shared hadith. Following it literally would delete three steps that apply to a woman exactly as to a man — the opening du'a (Bukhari 744), the opening takbir (Bukhari 734), and "Al-Fatihah alone is enough" (Bukhari 772) — making those days differ where no source says the practice differs (spec §1/§2: "if the practices are same then let it continue"; spec §2 Day 8: "the takbir unchanged"). I kept them, verbatim (734 with "back of the row" → "ends of the row"), and re-fetched all three. If you prefer the strict whitelist, delete those three steps; Day 8 would then have two steps and need one more to meet the 3-step minimum.
2. **Day 8 takbir vs. Day 10 transitions.** The spec keeps Day 8's "say the takbir so the row can follow it" but drops Day 10's "say the transitions out loud" for lack of a voice source. Both are voice instructions; Day 8's rests on Bukhari 734's "Say the Takbir when he says it". Neither text addresses non-mahram men being present for takbirs. Please confirm you want Day 8's step.
3. **Day 10 shared title/focus.** "The Imam Is Followed" is fine; the shared focus "Transition takbirs and the pace of the row." names the instruction the women's day drops. Consider a variant focus (e.g. "The pace of the row, and what it answers.") — the spec only allows overrides on Days 1 and 14, so I have not proposed one.
4. **25:74 says "wives".** The Day 14 du'a is carried over with Sahih International's "from among our wives" (verified at api.alquran.cloud 25:74). The Arabic أزواجنا means spouses; the translation is Sahih International's own word, so I did not change it. A woman reciting it may find it odd; options are keep, or swap to a different verified Quranic du'a.
5. **Day 12 shared step title** "Look at who is actually behind you" — accurate for a man's row, not quite for hers (her row is beside her). Out of spec scope; flagging only.
6. **Two credits in the men's angles that the entries do not support** (found while re-reading; not changed here, not in scope): Day 8 "Ibn Kathir glosses qanitin as standing in obedient stillness" (entry: "with humbleness and humility… not allowed to speak"); Day 9 "…which is part of why Fajr is recited aloud" sits inside the Ibn Kathir credit but is not in the entry. Day 11's "rather than as an accusation" is app framing inside the al-Sa'di credit. The women's versions avoid all three.
7. **Source links that moved.** `binbaz.org.sa/fatwas/17618` now redirects to an unrelated fatwa (adhan in sandals); `binbaz.org.sa/fatwas/17618/<any-slug>` resolves to "حكم إمامة المرأة". `almosleh.com/en/f-32487` returns 404 — the Hanafi/Maliki "quiet" report therefore rests only on the spec §3 reading of 2026-10-11 and is worded "reported".
8. **Companion-report citations in prose** (Day 8: "Musannaf Abd al-Razzaq 5082" in a step's `source`). `verify-citations.mjs` / `verify-journey-claims.mjs` may not know how to read a Musannaf citation; Task 5/6 should check what they do with it rather than let it fail as "unlocatable" or pass unread.
