# Death Awareness Journey — Design

## Goal

Author and unlock `path_death_awareness` — a 7-day Sakina Pro journey that
turns *dhikr al-mawt* (remembrance of death) from a source of dread into a
driver for a deliberate life. It is currently a contentless stub in
`src/data/staticPaths.ts` (`dailySteps: []`, `isPremium: true`).

This is additive content on the existing journey rails (verse → context →
practice → reflection, driven by a `q_angle_*` angle per day). No new
components, screens, or interfaces. The work is: 7 angles, ~7 hadith, ~5 new
`Content` verses, and the 11-point wiring checklist in `CLAUDE.md`.

## Placement decisions (settled with the product owner)

| Field | Value | Rationale |
|---|---|---|
| `theme` | **`Hopeful`** (stub said `Overwhelmed`) | *Dhikr al-mawt* in the Sunnah is prescribed for everyone and its posture is readiness/aspiration, not crisis. Filing 7 heavy mortality angles under `Overwhelmed` (*Irhāq* — being crushed) serves them to the reader least able to carry them. The journey's actual work — purpose, legacy, reunion — is hope-shaped. Per `CLAUDE.md` journey item 9, this is a reasoned stub correction, not inheritance. `Hopeful` is a real `Mood` union member (`src/types/index.ts`). |
| `tone` | `refuge` (unchanged) | Gentleness is carried by `tone` regardless of `theme`. |
| `duration` | `7` (unchanged, matches `dailySteps.length`) | `CLAUDE.md` journey item 8. |
| `target` | `Zuhd` (unchanged) | Accurate. |
| Gating | **Sakina Pro exclusive** — `PREMIUM_GATED_PATHS['path_death_awareness'] = 'Sakina Pro exclusive'` | Same as Marriage Seeker / Tawbah. No committed free-tier date. |
| Angle prefix | `q_angle_death_day1..day7` | `JOURNEY_ANGLE_PREFIXES` entry: `'death'`. No collision — grep of `quranData.ts` / `hadithData.ts` for `q_angle_death` / `hadith_death` is clean. |
| Hadith ids | `hadith_death_1..7` | |
| Voice | **Tafsir / scholarly** | Journey flow (`PathStepScreen`) maps `text = angle.angle` into the Understand/Matters slot and passes **no** `angle` prop, so there is no "For Your Heart" card. Journey angles are written in scholarly voice — the same divergence-by-accident every other journey has (`CLAUDE.md` §"ContextLayer's prop mapping"). Do not write these in second-person direct-address voice. |
| Branch | `feat/death-awareness-journey`, off `feat/tawbah-journey` HEAD (`cdc460f`) | That branch carries `SEED_VERSION 35` and the `tawbah` entries already in `JOURNEY_ANGLE_PREFIXES` / `verify-journey.mjs` — building on it avoids a version/list collision at merge. Other sessions' auth commits are on it; history is not rewritten. |

## The scholarly frame (from the review — non-negotiable in the prose)

The full review is in the conversation that produced this spec. The load-bearing
points that MUST survive into the angle prose and practice steps:

1. **Hope–fear balance.** The arc opens on consolation (3:185), is anchored by
   purpose (67:2), and closes on *reunion, not judgment* (29:5 + 89-style
   framing). Days 3–5 carry the urgency; hope brackets both ends. Do not let
   any day tip into despair (*yaʾs* — kufr per 39:53) or into false security.

2. **Never romanticise dying.** "Travel light", "hope for the meeting", "no
   life except the life of the Hereafter" — read by someone heavy — can slide
   toward wishing to be done with this life, which is **forbidden** (Bukhārī
   6351 / Muslim 2680). The 6351 guardrail ("keep me alive as long as life is
   better for me…") is Day 7's du'a, and its sense must also be echoed in a
   line on Days 5 and 6. On Days 5–7, include one quiet sentence pointing a
   reader whose thoughts turn toward not wanting to be alive to the Hope
   journey / the in-app crisis resources — non-alarming, one line.

3. **Day 1: validate the instinct, then redirect.** Natural aversion to death
   is not blameworthy (the Ṣaḥāba "disliked death", Bukhārī 6507). Blameworthy
   fear is rooted in love of dunyā or doubt in Allah's mercy. Day 1 names the
   fear as honest, then turns to preparation + *ḥusn al-ẓann*. Not bare
   validation.

4. **Day 2: "aḥsanu ʿamalā" = quality, not quantity.** Ibn Kathīr on 67:2,
   citing Muḥammad b. ʿAjlān: *"best in deeds… Allah did not say 'which of you
   does the most deeds.'"* The sincerity half of the point is carried by the
   riyāʾ passage in Ibn Kathīr on **18:110** (the ḥadīth qudsī: a deed done to
   be seen is handed to the one it was performed for) — **verified present in
   the abridged English edition**. Do **not** attribute the Fuḍayl b. ʿIyāḍ
   *"khāliṣ wa ṣawāb"* formulation to either entry — it is in the full Arabic
   Ibn Kathīr / al-Baghawī, neither confirmed, so keep it out of the cited
   prose.

5. **Day 5: zuhd, not rahbāniyya.** *"Lā rahbāniyya fī-l-Islām."* Dunyā is a
   means (*mazraʿat al-ākhira*), not worthless. "Be a traveler" ≠ "renounce
   the world."

6. **Day 6: don't over-weight "righteous child".** The hadith (Muslim 1631)
   names three; *ṣadaqa jāriya* and beneficial knowledge are open to everyone,
   children or not. Frame as "the one available to you."

7. **Bukhārī 6416's tail is mawqūf.** "Take from your life for your death" is
   **Ibn ʿUmar's** words, not marfūʿ — the hadith text says so. Attribute to
   Ibn ʿUmar.

8. **Bukhārī 6507's own clarification is load-bearing** — quote it, do not
   paraphrase it away, or the hadith reads as "you must want to die."

## Day-by-day spec

Every Arabic below verified against `api.alquran.cloud`
(`quran-uthmani` + `en.sahih`). Every hadith fetched from the
`fawazahmed0/hadith-api` mirror or `sunnah.com` and graded. Tafsir tags tested
against `api.quran.com/api/v4/tafsirs/{id}/by_ayah/{key}` — all 7 resolve to
substantive, on-ayah entries.

Practice-step field legend: `type ∈ {mindset, physical, verbal}`,
`icon ∈ IconName` union (`src/components/Icon.tsx`), `sourceType ∈
{quran_dua, prophetic_dua, prophetic_dhikr, sunnah_action, composed_dua}`.
3–6 steps per day (`CLAUDE.md` journey item 4) — this journey uses 3–4.

---

### Day 1 — "Every Soul Will Taste It"

- **Verse:** `quran_3_185` **(NEW Content)** —
  `كُلُّ نَفْسٍۢ ذَآئِقَةُ ٱلْمَوْتِ ۗ وَإِنَّمَا تُوَفَّوْنَ أُجُورَكُمْ يَوْمَ ٱلْقِيَٰمَةِ ۖ فَمَن زُحْزِحَ عَنِ ٱلنَّارِ وَأُدْخِلَ ٱلْجَنَّةَ فَقَدْ فَازَ ۗ وَمَا ٱلْحَيَوٰةُ ٱلدُّنْيَآ إِلَّا مَتَٰعُ ٱلْغُرُورِ`
  "Every soul will taste death, and you will only be given your full
  compensation on the Day of Resurrection. So he who is drawn away from the
  Fire and admitted to Paradise has attained [his desire]. And what is the
  life of this world except the enjoyment of delusion."
- **Tafsir tag:** `[Tafsir Ibn Kathir on 3:185]` — verified: entry titled
  "Every Soul Shall Taste Death", *"This Ayah comforts all creation."*
- **Angle direction:** Death is certain and universal — the fear of it is an
  honest instinct, not a defect in faith; the Prophet ﷺ noted believers
  "disliking death" (Bukhārī 6507). What the ayah does with that certainty:
  it reframes this life as *matāʿ al-ghurūr* (fleeting enjoyment that
  deceives) and moves the reckoning to a day when accounts are settled in
  full. The turn: the cure for the fear is not to suppress it but to prepare,
  and to think well of Allah (*ḥusn al-ẓann*). Include a split-pattern phrase
  (e.g. "`. When you` hold both — that it is certain, and that the account is
  just — …").
- **Hadith:** none (the ayah carries the day). `hadithContentId` omitted for
  Day 1.
- **Practice steps (3):**
  1. `mindset` / `light-bulb` — "Name the fear plainly." Write the specific
     thing about death that unsettles you (the unknown, leaving people,
     the account). Naming it is the first step to preparing for it, which is
     what the ayah asks. `source: 'Reflects Bukhari 6507 — the Companions
     also disliked death'`.
  2. `mindset` / `calm-face` — "Natural aversion is not weak faith." The
     dislike of death is *jibillī* (instinctive). What the scholars call
     blameworthy is fear rooted in love of dunyā or in doubting Allah's
     mercy — not the instinct itself. `source: 'Tafsir Ibn Kathir on 3:185'`.
  3. `verbal` / `hands-prayer` — the day's du'a (below).
- **Reflection:** "If you were given your account today, which part of it
  would you most want more time to change? Name one thing you could begin
  this week."
- **Du'a:** `quran_dua`, `source: 'Quran 3:193'` —
  `رَبَّنَا فَٱغْفِرْ لَنَا ذُنُوبَنَا وَكَفِّرْ عَنَّا سَيِّـَٔاتِنَا وَتَوَفَّنَا مَعَ ٱلْأَبْرَارِ`
  translit "Rabbanā faghfir lanā dhunūbanā wa kaffir ʿannā sayyiʾātinā wa
  tawaffanā maʿa-l-abrār", "Our Lord, forgive us our sins and remove from us
  our misdeeds and cause us to die with the righteous." (Verbatim tail of
  3:193 — `quran_dua` is correct.)

---

### Day 2 — "Death Was Created on Purpose"

- **Verse:** `quran_67_2` **(REUSE — already seeded, vetted)** —
  `ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًۭا ۚ وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ`
  "[He] who created death and life to test you [as to] which of you is best
  in deed — and He is the Exalted in Might, the Forgiving."
- **Tafsir tag:** `[Tafsir Ibn Kathir on 67:2]` — verified: *"He examines
  them to see which of them will be best in deeds… Allah did not say 'which
  of you does the most deeds'"* (attributes the point to Muḥammad b. ʿAjlān);
  also notes some scholars read the ayah as proof that death is a created
  entity, not mere non-existence.
- **Angle direction:** The word order — *death before life*. Death is not the
  void that cancels meaning; it is a *creation*, deliberate, and it is what
  makes the test real. *Aḥsanu ʿamalā* is quality, not count — Ibn Kathīr
  (via Muḥammad b. ʿAjlān): *"best in deed… not which of you does the most."*
  And the core of that quality is sincerity: a deed with showing-off mixed
  into it is, on the Day of Judgement, handed back to the one it was
  performed for (Ibn Kathīr on 18:110). So the mortality that frightens you
  is the same fact that gives every sincere act its weight. Close on
  `Al-ʿAzīz al-Ghafūr` — the One strong enough to enforce the test is also
  the One forgiving toward those who stumble in it.
- **Hadith:** none. Day 2 is verse + tafsir led (like Day 1). `hadithContentId`
  omitted. (`Marriage Seeker` carries a hadith on only 6 of 14 days — not
  every day needs one.)
- **Practice steps (3):**
  1. `mindset` / `target` — "Best, not most." Pick one routine act of worship
     you do on autopilot. Tomorrow, do that one with full attention and
     intention — quality is what the ayah measures.
     `source: 'Tafsir Ibn Kathir on 67:2'`.
  2. `mindset` / `eye` — "The riyāʾ check." Ibn Kathīr on 18:110: a deed done
     partly to be seen is, on the Day of Judgement, handed back to the one you
     performed it for — *"seek its reward from them."* Sincerity is not a
     bonus on a deed; it is the deed. `source: 'Tafsir Ibn Kathir on 18:110'`
     (verified: the abridged entry's riyāʾ passage — the ḥadīth qudsī of Abū
     Saʿīd b. Abī Faḍāla).
  3. `verbal` / `hands-prayer` — the day's du'a.
- **Reflection:** "Which of your deeds are for Allah, and which are for how
  they look? Name one you could quietly move from the second column to the
  first."
- **Du'a:** `prophetic_dua`, `source: 'Sunan Ibn Majah 925'`, grading
  `hasan` (al-Albānī/ʿAbd al-Bāqī: ṣaḥīḥ; Zubayr ʿAlī Zaī: ḍaʿīf — label
  `hasan`) — Umm Salama, said after Fajr:
  `اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا`
  "O Allah, I ask You for beneficial knowledge, goodly provision, and
  accepted deeds." (Fetch exact Uthmani-vowelled Arabic from sunnah.com at
  implementation.)

---

### Day 3 — "Remember It Often"

- **Verse:** `quran_102_1_2` **(REUSE — already seeded, used by Rizq day 13)** —
  `أَلْهَىٰكُمُ ٱلتَّكَاثُرُ * حَتَّىٰ زُرْتُمُ ٱلْمَقَابِرَ`
  "Competition in [worldly] increase diverts you // until you visit the
  graveyards."
- **Tafsir tag:** `[Tafsir Ibn Kathir on 102:1]` — verified (entry is grouped
  1–2): "The Result of Loving the World and Heedlessness of the Hereafter."
- **Angle direction:** *Takāthur* — the race to have more — runs your whole
  life "until you visit the graves", i.e. until you are buried. The sūrah
  names the disease; the Prophet ﷺ named the medicine: *akthirū dhikra
  hādhimi-l-ladhāt* — "increase remembrance of the destroyer of pleasures",
  meaning death (Tirmidhī 2307, ḥasan). Frequent remembrance is not
  morbidity — it declutters priorities: what survives the thought of the
  grave is what deserves today. Acknowledge the sūrah continues to a warning
  (the Fire, 102:6–7) rather than implying it ends at the diagnosis.
- **Hadith:** `hadith_death_3` — **Jāmiʿ at-Tirmidhī 2307**, grading `hasan`.
  Text (sunnah.com): *"Increase in remembrance of the severer of pleasures."
  Meaning death.* Arabic: `أَكْثِرُوا ذِكْرَ هَاذِمِ اللَّذَّاتِ` — *yaʿnī
  al-mawt*. Narrator Abū Hurayra.
- **Practice steps (4):**
  1. `mindset` / `clock` — "The graveyard test." For one decision on your
     plate today, ask: from the grave, would this have mattered? Let the
     answer reorder your day. `source: 'Reflects Jami at-Tirmidhi 2307'`.
  2. `physical` / `pen` — *muḥāsaba*. Tonight, before sleep, write the two
     best and two worst things you did today. `source: 'Quran 59:18 — "let
     every soul look to what it has put forth for tomorrow"'`.
  3. `mindset` / `eye` — "Remember, don't dwell." The Sunnah is *frequent*
     remembrance, brief each time — a passing thought that resets your aim,
     not a spiral. `source: 'Jami at-Tirmidhi 2307'`.
  4. `verbal` / `hands-prayer` — the day's du'a.
- **Reflection:** "Name one thing you spend real energy on that would not
  matter to you from the grave. What is one thing that would?"
- **Du'a:** `prophetic_dua`, `source: 'Sunan Abi Dawud 1522'`, grading
  `sahih` — Muʿādh b. Jabal, after every prayer:
  `اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ`
  "O Allah, help me to remember You, to thank You, and to worship You well."

---

### Day 4 — "Sleep Is the Rehearsal"

- **Verse:** `quran_39_42` **(NEW Content)** —
  `ٱللَّهُ يَتَوَفَّى ٱلْأَنفُسَ حِينَ مَوْتِهَا وَٱلَّتِى لَمْ تَمُتْ فِى مَنَامِهَا ۖ فَيُمْسِكُ ٱلَّتِى قَضَىٰ عَلَيْهَا ٱلْمَوْتَ وَيُرْسِلُ ٱلْأُخْرَىٰٓ إِلَىٰٓ أَجَلٍۢ مُّسَمًّى ۚ إِنَّ فِى ذَٰلِكَ لَءَايَٰتٍۢ لِّقَوْمٍۢ يَتَفَكَّرُونَ`
  "Allah takes the souls at the time of their death, and those that do not
  die [He takes] during their sleep. Then He keeps those for which He has
  decreed death and releases the others for a specified term. Indeed in that
  are signs for a people who give thought."
- **Tafsir tag:** `[Tafsir al-Qurtubi on 39:42]` — verified: 5,600-char entry
  opening on the ayah, four *masāʾil* on *al-wafāt al-kubrā* (death) vs.
  *al-wafāt al-ṣughrā* (sleep). (al-Qurtubi is Arabic — tag verifier checks
  presence + Arabic-word overlap, which passes.)
- **Angle direction:** The ayah puts sleep and death in the same sentence,
  under the same verb (*yatawaffā*). Sleep is *al-wafāt al-ṣughrā* — the
  minor death. Every night you are "taken" and every morning "released… to a
  specified term" that is one day shorter. The waking du'a says it outright:
  *aḥyānā baʿda mā amātanā* — "gave us life after having caused us to die."
  So you already rehearse dying, nightly, and are already handed each new day
  as a loan, not a default. The day's practice: make the two thresholds —
  falling asleep, waking — conscious.
- **Hadith:** `hadith_death_4` — **Ṣaḥīḥ al-Bukhārī 6324** (Ḥudhayfa): on
  going to bed the Prophet ﷺ said *"Bismika Allāhumma amūtu wa aḥyā"*, and on
  waking *"Al-ḥamdu lillāhi-lladhī aḥyānā baʿda mā amātanā wa ilayhi
  n-nushūr."* (Fetch Arabic from `ara-bukhari/6324` at implementation.)
- **Practice steps (4):**
  1. `verbal` / `moon` — "The last words before sleep." Tonight, say
     *Bismika Allāhumma amūtu wa aḥyā* as the literal last thing, phone
     down. `source: 'Sahih al-Bukhari 6324'`, `sourceType: prophetic_dhikr`.
  2. `verbal` / `sunrise` — "The first words on waking." *Al-ḥamdu
     lillāhi-lladhī aḥyānā…* — before reaching for anything, name the day as
     returned. `source: 'Sahih al-Bukhari 6324'`, `sourceType:
     prophetic_dhikr`.
  3. `mindset` / `clock` — "One returned day." Ask on waking: if this were the
     last day I am released for, what is the one thing I would not skip?
     `source: 'Reflects Quran 39:42'`.
  4. `verbal` / `hands-prayer` — the day's du'a (the waking formula itself).
- **Reflection:** "You were handed today back. What will you do with it that
  you would not do if you assumed there were a thousand more?"
- **Du'a:** `prophetic_dhikr`, `source: 'Sahih al-Bukhari 6324'` —
  `ٱلْحَمْدُ لِلَّهِ ٱلَّذِى أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ ٱلنُّشُورُ`
  "All praise is for Allah who gave us life after causing us to die, and to
  Him is the resurrection." (Distinct from Day 3's du'a.)

---

### Day 5 — "Travel Light"

- **Verse:** `quran_63_10` **(NEW Content)** —
  `وَأَنفِقُوا۟ مِن مَّا رَزَقْنَٰكُم مِّن قَبْلِ أَن يَأْتِىَ أَحَدَكُمُ ٱلْمَوْتُ فَيَقُولَ رَبِّ لَوْلَآ أَخَّرْتَنِىٓ إِلَىٰٓ أَجَلٍۢ قَرِيبٍۢ فَأَصَّدَّقَ وَأَكُن مِّنَ ٱلصَّٰلِحِينَ`
  "And spend from what We have provided you before death approaches one of
  you and he says, 'My Lord, if only You would delay me for a brief term so
  I would give charity and be among the righteous.'"
- **Tafsir tag:** `[Tafsir Ibn Kathir on 63:10]` — verified: "The Importance
  of not being too concerned with the Matters of the Worldly Life, and being
  Charitable."
- **Angle direction:** The ayah records the one wish of the dying — not more
  prayer, not more fasting, but *"if only I could give ṣadaqa"* (Ibn ʿAbbās /
  al-Ḥasan note this). The lesson is not that dunyā is worthless — Islam
  rejects monasticism (*lā rahbāniyya fī-l-Islām*); wealth is *mazraʿat
  al-ākhira*, the field you plant. The lesson is grip: hold it as a traveler
  holds a bag, not as an owner holds a house. Bukhārī 6416: *"Be in this
  world as a stranger or a traveler"* — and Ibn ʿUmar's own addition (mawqūf,
  not marfūʿ): *"take from your health for your sickness, and from your life
  for your death."* Bukhārī 6514: three things follow you to the grave —
  family, wealth, deeds — two turn back; only the deeds go in with you.
  Include one quiet line: if the thought of leaving turns into *wanting* to
  leave, that is a different weight — the Hope journey and the in-app
  resources are there.
- **Hadith:** `hadith_death_5` — **Ṣaḥīḥ al-Bukhārī 6416** (Ibn ʿUmar):
  *"Allah's Messenger ﷺ took hold of my shoulder and said, 'Be in this world
  as if you were a stranger or a traveler.'"* — with the mawqūf tail
  attributed to Ibn ʿUmar in `whyThis`, not to the Prophet ﷺ. (A `PathStep`
  has exactly one `hadithContentId` / one hadith layer per day; Bukhārī 6514
  is referenced only in the reflection prose and step 4's `source`, not as a
  second row.)
- **Practice steps (5):**
  1. `physical` / `gift` — "Answer the dying wish now." Give one ṣadaqa today,
     however small, while you still can — the ayah is the regret of the person
     who waited. `source: 'Quran 63:10'`.
  2. `physical` / `pen` — "Write the will." *"It is not right for a Muslim who
     has something to bequeath to pass two nights without his will written"*
     — draft or update yours this week. (No inheritance-share numbers — that
     is madhhab-specific; name an executor and your wishes, and take it to
     someone qualified.) `source: 'Sahih al-Bukhari 2738 / Sahih Muslim
     1627'`, `sourceType: sunnah_action`.
  3. `mindset` / `compass` — "Stranger, not renouncer." Name one thing you
     own that owns you back — that you would panic to lose. Loosening the
     grip is the point, not discarding it. `source: 'Sahih al-Bukhari 6416'`.
  4. `mindset` / `arrow-right` — "Only one of the three stays." Bukhārī 6514:
     your family and your wealth walk back from the grave; only your deeds go
     in with you. Name one deed you can send ahead today. `source: 'Sahih
     al-Bukhari 6514'`.
  5. `verbal` / `hands-prayer` — the day's du'a.
- **Reflection:** "Of the three that follow you to the grave — family, wealth,
  deeds — only the deeds go in. What did you add to that pile this week?"
- **Du'a:** `prophetic_dhikr`, `source: 'Sahih al-Bukhari 6413'` — the
  Prophet's ﷺ words at the trench: `اللَّهُمَّ لَا عَيْشَ إِلَّا عَيْشُ ٱلْآخِرَةِ`
  "O Allah, there is no life except the life of the Hereafter." (Famous
  clause of a longer du'a — present as dhikr, not as the whole hadith.)

---

### Day 6 — "Build the One Thing That Stays"

- **Verse:** `quran_36_12` **(NEW Content)** —
  `إِنَّا نَحْنُ نُحْىِ ٱلْمَوْتَىٰ وَنَكْتُبُ مَا قَدَّمُوا۟ وَءَاثَٰرَهُمْ ۚ وَكُلَّ شَىْءٍ أَحْصَيْنَٰهُ فِىٓ إِمَامٍۢ مُّبِينٍۢ`
  "Indeed, it is We who bring the dead to life and record what they have put
  forth and what they left behind, and all things We have enumerated in a
  clear register."
- **Tafsir tag:** `[Tafsir al-Qurtubi on 36:12]` — verified: 3,000-char entry
  opening on the ayah, on *kutub al-āthār* (the record of traces) — the
  *sabab* is Banū Salima wanting to move nearer the masjid, and the reward of
  their *footsteps* (see Muslim 665).
- **Angle direction:** Two ledgers survive you: *mā qaddamū* (what you sent
  ahead) and *āthārahum* (what you left behind — the traces that keep
  acting). Muslim 1631: when a person dies their deeds stop **except three**
  — recurring charity, knowledge people benefit from, a righteous child who
  prays for them. Note: three doors, not one. If you have no children, the
  other two are wide open. The day's work: pick **one** and start it — not
  plan it, start it.
- **Hadith:** `hadith_death_6` — **Ṣaḥīḥ Muslim 1631** (Abū Hurayra):
  *"When a man dies, his acts come to an end, but three: recurring charity,
  or knowledge (by which people) benefit, or a pious child who prays for
  him."* Arabic verified on sunnah.com.
- **Practice steps (4):**
  1. `physical` / `honey` — "Start a *ṣadaqa jāriya* today." Set up one
     recurring gift — a monthly transfer, a share in a well/masjid/teaching
     fund — small and automatic beats large and someday.
     `source: 'Sahih Muslim 1631'`, `sourceType: sunnah_action`.
  2. `physical` / `book-quran` — "Teach one thing." Pass on one beneficial
     thing you know — a verse, a ruling, a skill — to one person this week.
     Knowledge that keeps being used keeps being written for you.
     `source: 'Sahih Muslim 1631'`, `sourceType: sunnah_action`.
  3. `mindset` / `heart` — "The third door." If you have children, the
     smallest brick is teaching them one line of du'a for you. If you don't,
     the first two doors are enough — the hadith is an *offer*, not a
     shortfall. `source: 'Sahih Muslim 1631'`.
  4. `verbal` / `hands-prayer` — the day's du'a.
- **Reflection:** "If the traces you leave were read aloud tomorrow, what is
  on the list? Name one thing you could add before the year ends."
- **Du'a:** `quran_dua`, `source: 'Quran 25:74'` — the du'a of *ʿibād
  ar-Raḥmān*:
  `رَبَّنَا هَبْ لَنَا مِنْ أَزْوَٰجِنَا وَذُرِّيَّٰتِنَا قُرَّةَ أَعْيُنٍۢ وَٱجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا`
  "Our Lord, grant us from our spouses and offspring comfort of eyes, and
  make us a model for the righteous." (Distinct from all other days.)

---

### Day 7 — "Hope of the Meeting"

- **Verse:** `quran_29_5` **(NEW Content)** —
  `مَن كَانَ يَرْجُوا۟ لِقَآءَ ٱللَّهِ فَإِنَّ أَجَلَ ٱللَّهِ لَءَاتٍۢ ۚ وَهُوَ ٱلسَّمِيعُ ٱلْعَلِيمُ`
  "Whoever should hope for the meeting with Allah — indeed, the term decreed
  by Allah is coming. And He is the Hearing, the Knowing."
- **Tafsir tag:** `[Tafsir Ibn Kathir on 29:5]` — verified: "Allah will
  fulfill the Hopes of the Righteous… whoever hopes for the meeting **and
  does righteous deeds**, Allah will fulfill his hopes."
- **Angle direction:** The whole journey lands here: the *ajal* is coming
  regardless — the only variable is whether you meet it *hoping* (*rajāʾ*) or
  dreading. And hope here is not passive: Ibn Kathīr ties *yarjū liqāʾ Allāh*
  to *and does righteous deeds*. Bukhārī 6507: *"Whoever loves to meet Allah,
  Allah loves to meet him"* — and its **own clarification**, which must be
  quoted: ʿĀʾisha said "but we all dislike death", and the Prophet ﷺ said it
  is not that — it is that when the believer's death approaches, they are
  shown Allah's pleasure, and then nothing is dearer than what lies ahead.
  So loving the meeting ≠ wishing to die. The counterweight, also this day:
  Bukhārī 6351 — *"None of you should wish for death… if he must, let him
  say: O Allah, keep me alive as long as life is better for me, and take me
  when death is better for me."* The plan you keep: not intensity, but
  return — the smallest daily version of remembrance you can actually
  sustain. Include the one-line pointer to the Hope journey / resources for a
  reader whose thoughts turn dark.
- **Hadith:** `hadith_death_7` — **Ṣaḥīḥ al-Bukhārī 6507** (ʿUbāda b.
  aṣ-Ṣāmit). Its text (verified) already contains the clarification — *"ʿĀʾisha,
  or some of the wives of the Prophet ﷺ, said, 'But we dislike death.' He
  said: It is not like this…"* — so 6507 alone carries the whole day. Quote
  that clarification in full in the hadith layer, not a paraphrase.
- **Practice steps (4):**
  1. `mindset` / `sun` — "Meeting, not ending." Write one sentence describing
     death as a *meeting* — who you are meeting, and what you hope they say.
     `source: 'Sahih al-Bukhari 6507'`.
  2. `mindset` / `shield` — "Not a wish." Loving the meeting is not longing to
     die. If today feels like too much, that is the moment 6351's du'a is
     for — and if the thought turns to not wanting to be alive, the Hope
     journey and the in-app help line are the next step, not a private
     burden. `source: 'Sahih al-Bukhari 6351'`.
  3. `physical` / `candle` — "The smallest keepable version." Choose the one
     death-remembrance you will keep after this week — one line at night, one
     ṣadaqa a month, the waking du'a. Write it where you will see it.
     `source: 'Reflects the arc of this journey'`.
  4. `verbal` / `hands-prayer` — the day's du'a.
- **Reflection:** "What is the one practice from these seven days you will
  actually keep? Make it smaller until the answer is yes."
- **Du'a:** `prophetic_dua`, `source: 'Sahih al-Bukhari 6351'` —
  `اللَّهُمَّ أَحْيِنِي مَا كَانَتِ ٱلْحَيَاةُ خَيْرًا لِى وَتَوَفَّنِي إِذَا كَانَتِ ٱلْوَفَاةُ خَيْرًا لِى`
  "O Allah, keep me alive as long as life is better for me, and take me when
  death is better for me." (Fetch exact Arabic from `ara-bukhari/6351` at
  implementation.)

---

## New content inventory

### `Content` verses to ADD to `src/data/quranData.ts` (5)

`CLAUDE.md` journey item 8 — assert each id resolves exactly once (i.e. does
NOT already exist) before adding; a generator that only appends misses a
collision. Verified absent as of `cdc460f`.

| id | ayah | source string |
|---|---|---|
| `quran_3_185` | 3:185 | `Quran 3:185` |
| `quran_39_42` | 39:42 | `Quran 39:42` |
| `quran_63_10` | 63:10 | `Quran 63:10` |
| `quran_36_12` | 36:12 | `Quran 36:12` |
| `quran_29_5` | 29:5 | `Quran 29:5` |

Each needs `arabicText` (Uthmani, verified above), `translation` (Sahih Intl,
verified above), `englishTranslation` (context sentence — light prose per
`CLAUDE.md` Quran rule 2), `whyThis` (per-verse scholarly note — this is what
`GuidanceScreen` would show if the verse were ever used in the mood flow; keep
it accurate but the journey does not render it, the `[Tafsir …]` tag does),
`moods: []` (journey verses are not mood-joined), `primaryText`.

### Reused `Content` verses (2) — no change

`quran_67_2` (Day 2), `quran_102_1_2` (Day 3). Already seeded and vetted.
Journey angles are exempt from the mood-join check, so sharing a verse with
existing mood angles costs nothing (`CLAUDE.md` journey item 8).

### `Content` (Hadith) rows to ADD to `src/data/hadithData.ts` (5)

Days 1 and 2 carry **no** `hadithContentId` (verse + tafsir led). Bukhārī 6514
(Day 5 step 4) and Bukhārī 2738 / Muslim 1627 (Day 5 step 2) are cited only in
practice-step `source` strings — not hadith rows.

| id | day | citation | grading | narrator | verified via |
|---|---|---|---|---|---|
| `hadith_death_3` | 3 | Jāmiʿ at-Tirmidhī 2307 | `hasan` | Abū Hurayra | sunnah.com + mirror (agree) |
| `hadith_death_4` | 4 | Ṣaḥīḥ al-Bukhārī 6324 | `sahih` | Ḥudhayfa | mirror |
| `hadith_death_5` | 5 | Ṣaḥīḥ al-Bukhārī 6416 | `sahih` | Ibn ʿUmar (marfūʿ core; mawqūf tail) | mirror |
| `hadith_death_6` | 6 | Ṣaḥīḥ Muslim 1631 | `sahih` | Abū Hurayra | **sunnah.com only** — the mirror renumbers Ṣaḥīḥ Muslim |
| `hadith_death_7` | 7 | Ṣaḥīḥ al-Bukhārī 6507 | `sahih` | ʿUbāda b. aṣ-Ṣāmit | mirror + sunnah.com |

`content_angles` has **no `actionTranslation` column** — any translation for a
du'a goes inside the `practiceSteps` JSON (`CLAUDE.md` journey item 3).

## Distinct-du'a check (`CLAUDE.md` journey item 6)

| Day | du'a | source |
|---|---|---|
| 1 | *Rabbanā faghfir lanā… wa tawaffanā maʿa-l-abrār* | Quran 3:193 |
| 2 | *Allāhumma innī asʾaluka ʿilman nāfiʿan…* | Ibn Mājah 925 |
| 3 | *Allāhumma aʿinnī ʿalā dhikrika wa shukrika…* | Abū Dāwūd 1522 |
| 4 | *Al-ḥamdu lillāhi-lladhī aḥyānā baʿda mā amātanā…* | Bukhārī 6324 |
| 5 | *Allāhumma lā ʿaysha illā ʿayshu-l-ākhirah* | Bukhārī 6413 |
| 6 | *Rabbanā hab lanā min azwājinā…* | Quran 25:74 |
| 7 | *Allāhumma aḥyinī mā kānat-il-ḥayātu khayran lī…* | Bukhārī 6351 |

All seven distinct. No verse and no hadith source repeats across the 7 days
(`CLAUDE.md` journey item 1b) — 3:185, 67:2, 102:1-2, 39:42, 63:10, 36:12,
29:5 are distinct; Tirmidhī 2307 / Bukhārī 6324 / 6416 / Muslim 1631 /
Bukhārī 6507 are distinct.

## Wiring checklist (`CLAUDE.md` "Before calling a journey day done" + items 1–11)

1. **`src/data/staticPaths.ts`** — replace `path_death_awareness.dailySteps: []`
   with 7 `PathStep` entries (`step_death_1..7`), `contentId` + `angleId` +
   `hadithContentId` per the table above. Change `theme: 'Overwhelmed'` →
   `theme: 'Hopeful'`. Keep `duration: 7`, `tone: 'refuge'`, `target: 'Zuhd'`,
   `isPremium: true`. File is **CRLF** — preserve it. Single-quote all `id`
   fields (item 11). No `phases` (7 days, one arc).
2. **`src/data/quranData.ts`** — add the 5 new `Content` rows and the 7
   `q_angle_death_day1..day7` angles. `id` in **single quotes** (item 11 —
   `verify-journey.mjs`'s `objectAt` does a literal `id: '…'` match; a
   `JSON.stringify`'d `id: "…"` is invisible to it and surfaces as "40
   failures, one cause"). CRLF. `[Tafsir …]` tag at the **very start** of each
   `angle` string (item 2 of the journey §; mid-sentence it strips to a
   stranded space). Include one `ContextLayer.splitIntoSections` pattern per
   angle (`. When you`, `. Your `, `. The Prophet ﷺ said:`, …).
3. **`src/data/hadithData.ts`** — add `hadith_death_3, _4, _5, _6, _7` (exactly
   5). Full `arabicText` / `translation` / `englishTranslation` / `source` /
   `whyThis` / `propheticPractice`, `moods: []`.
4. **`src/database/seedContent.ts`** — `SEED_VERSION` **35 → 36**, with a v36
   note: new journey Death Awareness (`path_death_awareness`), 7 days, adds
   5 verses + 7 angles + 5 hadith; theme corrected `Overwhelmed` → `Hopeful`
   in staticPaths; unlocked + Pro-gated same commit.
5. **`src/screens/PathsScreen.tsx`** — `AVAILABLE_PATHS['path_death_awareness']
   = '2026-08-29'` (ship date); `PREMIUM_GATED_PATHS['path_death_awareness']
   = 'Sakina Pro exclusive'`. Update the file's header doc comment (it lists
   available paths).
6. **`src/services/contentRepository.ts`** — add `'death'` to
   `JOURNEY_ANGLE_PREFIXES` (item 10 — without it the 7 angles leak into the
   `Hopeful` mood picker as tafsir-voice cards with visible `[Tafsir …]`
   tags).
7. **`scripts/verify-journey.mjs`** — add
   `['path_death_awareness', 'q_angle_death_', 'Hopeful', true]` to `JOURNEYS`.
8. **`scripts/verify-journey-roundtrip.mjs`** — add `'path_death_awareness'`
   to the path list (line ~104).
9. **`src/constants/pathVisuals.ts`** — already covers `path_death_awareness`
   (`leaf-circle-outline` / mint `#6EE7B7`). No edit. *(Consider `candle`
   instead — matches the journey's imagery and Grief's `candle` precedent —
   decide with the owner; not required.)*
10. **No `AVAILABLE_PATH_IDS` file edit** — it is `new Set(Object.keys(
    AVAILABLE_PATHS))`, so item 5 covers it.

### Verification gate (all must pass — none need a device)

- `npx tsc --noEmit -p tsconfig.json`
- `npx jest`
- `node scripts/verify-journey.mjs` (adding a `JOURNEYS` row is data, not
  logic — run `verify-journey-selftest.mjs` only if `verify-journey.mjs` logic
  is edited)
- `node scripts/verify-journey-roundtrip.mjs` and
  `RT_INJECT=1 node scripts/verify-journey-roundtrip.mjs` (both exit 0)
- `node scripts/verify-citations.mjs` (network + curl)
- `node scripts/verify-tafsir-tags.mjs` and
  `TAFSIR_INJECT=1 node scripts/verify-tafsir-tags.mjs` (both exit 0) — then
  **read each of the 7 tafsir entries** and confirm the angle's claim is what
  the tafsir says (the script cannot).
- `node scripts/verify-render-hazards.mjs` (+ `RH_INJECT=1`) — no new views,
  but cheap.
- `verify-surah-lessons.mjs` — N/A, no `surahIds` on any day.

## Out of scope / deferred

- **Grave-visiting practice steps** — deliberately excluded (owner's call;
  women-visiting-graves is a genuine *ikhtilāf* and `CLAUDE.md` rule 7 forbids
  asserting the mechanic without a specific hadith for it).
- **The grave's questioning / punishment** — excluded; much of that material
  is ḍaʿīf and fights the `refuge` tone.
- **Mood-flow practice layer** — these 7 angles render only in the journey
  flow (`PathStepScreen`). If a mood-flow practice layer ships later they are
  ready, but no claim in this spec depends on mood-flow rendering.
- **`pathVisuals` icon swap** to `candle` — optional polish, not required.

## Open risks / things implementation must not skip

1. **Exact vowelled Arabic** for the five hadith du'as / dhikr (Ibn Mājah 925,
   Bukhārī 6324, 6413, 6351; plus the Tirmidhī 2307 / Muslim 1631 / Bukhārī
   6416, 6507 layer texts) — pull from `ara-*` mirror editions or sunnah.com's
   `arabic_hadith_full` at implementation. Transliteration + meaning are locked
   in this spec; the Arabic script is not.
2. **The three tafsir tags on Arabic editions** (al-Qurtubi 39:42, al-Qurtubi
   36:12) pass the tag verifier mechanically, but `verify-tafsir-tags.mjs`
   cannot confirm the angle's *claim* is what the entry says. Read all seven
   entries in full before finalising the angle prose — especially Day 2's
   18:110 riyāʾ reference and Day 4's *wafāt ṣughrā* framing.
3. **`verify-citations.mjs` on `actionSource` vs `practiceSteps.source`** —
   they drift separately (`CLAUDE.md` hadith rule 5). If any angle carries an
   `actionSource` / `actionReward`, grep both when a source changes.
4. **`extractSourceLabel` precedence** — the `[Tafsir …]` tag must win over
   the reused verse's `whyThis` (67:2 and 102:1-2 have mood-era `whyThis`
   about other themes). Tag-at-start handles this; confirm in the roundtrip
   output.
5. **Do not `prettier --write` `quranData.ts`** — it is not prettier-clean;
   a format run buries the change. Re-quote only lines the diff adds if a
   scripted insert emits the wrong quote style.
6. **`Mood` theme (`CLAUDE.md` journey item 9)** — `Hopeful` is confirmed a
   member of the `Mood` union in `src/types/index.ts` and is the deliberate,
   reasoned choice (see Placement decisions), not an inherited stub guess.
   All 7 angles carry `mood: 'Hopeful'` (journey item 2) and the `JOURNEYS`
   row uses `'Hopeful'`.
