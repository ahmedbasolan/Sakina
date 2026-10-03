/**
 * seedContent.ts — One-time SQLite seeder for Quran and Hadith content.
 *
 * WHY THIS EXISTS:
 * quranData.ts is 10,681 lines of TypeScript that previously appeared in the
 * static import graph of QuranLibraryScreen and initialContent.ts. Metro
 * bundled it into the main JS bundle where Hermes parsed and evaluated it
 * synchronously before the app's first render, adding significant TTI overhead
 * on low-end Android devices. hadithData.ts follows the same pattern for
 * consistency, even though it is much smaller.
 *
 * HOW IT WORKS:
 * This module is statically imported (the function reference), but the data
 * itself is loaded via a dynamic require() call INSIDE seedQuranContent() /
 * seedHadithContent(). That defers module evaluation to the first time these
 * functions run — inside initializeDatabase(), which is called asynchronously
 * after the app's first render frame.
 *
 * Because everything routes through the dbQuery mutex, seeding is fully
 * serialised with all subsequent queries. No race conditions.
 *
 * IDEMPOTENT: early-returns if rows already exist (safe on every launch).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Content, ContentAngle } from '../types';

// Bump whenever quranData.ts or hadithData.ts gains new rows. Existing
// installs skip the seeder once content exists, so without a version bump
// they would never receive later additions (this is how the Salah
// Transformation angles went missing for already-seeded devices). Every
// insert below is INSERT OR REPLACE, so a version-triggered re-run is
// idempotent and cheap — and edits to an existing row (not just new rows)
// do propagate to already-seeded installs once this version is bumped.
// v5: added q_angle_results_day1 (Trusting the Results, Day 1).
// v6: added q_angle_results_day2..day7; replaced hadith_results_5 (was a
//     duplicate of hadith_results_3) with Bukhari 5641.
// v7: added q_angle_study_day1..day7.
// v8: mood-pool rebalance. Tired was serving 15 `_energized` angles (content
//     telling an exhausted user to spend energy) — those moved to Hopeful and
//     Tired gained 13 purpose-written rest angles across 6 new verses (20:2,
//     8:11, 28:24, 50:38, 87:8, 6:60). Lonely 2 -> 10, Guilty 5 -> 12 (6 new
//     verses), Angry +5 acute-phase angles (4 new verses). Also: 'Sad' added to
//     quran_3_135 / quran_66_8 so two orphaned Sad angles became selectable,
//     93 reflection prompts rewritten (first-person -> second-person, and the
//     "How does X change Y" template broken), and 128 `action` strings given
//     terminal punctuation. Edits to existing rows only propagate on a bump.
// v9: Lonely pool 10 -> 22 (9 new verses; 9:40, 2:257 and 11:6 retagged). At 10
//     a user with three refreshes a day hit a repeat inside 36 hours.
// v10: Guilty pool 12 -> 25 (11 new verses; 6:54 and 8:33 retagged).
// v11: Tired pool 13 -> 26 (7 new verses; 28:73, 2:286, 2:45, 94:5 retagged).
// v12: Angry pool 18 -> 25 (7 new verses). Completes the four thin moods.
// v13: corrected 36 practice-step `source` labels that presented a dhikr,
//      a Divine Name or an app-composed supplication as the text of a cited
//      ayah. Arabic and instructions unchanged — only the attribution.
// v14: 22 steps re-typed from 'quran_dua' to the new 'composed_dua' — app-written
//      supplications and Divine-Name vocatives, neither of which appears
//      verbatim in the cited ayah. They now render a 'Suggested Wording' badge.
// v15: 8 universal adhkar re-typed off 'quran_dua' — 6 to prophetic_dhikr,
//      1 to sunnah_action (the salam greeting is an act toward a person), and
//      the full basmala kept as quran_dua but now citing 1:1, which it is.
// v16: replaced an unverifiable Tabarani citation in q_angle_8_33_guilty with
//      Surah Muhammad 47:19, which carries the same instruction verbatim.
// v17: audit stragglers. q_angle_3_170_grateful's tahmid step was typed
//      'quran_dua' over a Sunan Ibn Majah 3803 citation (the citation is
//      right — Ibn Majah 3803 does carry "alhamdulillahi 'ala kulli hal" —
//      only the type claimed scripture); now prophetic_dhikr. Plus the last
//      two reflection prompts still on the "How does X change Y" template,
//      in q_angle_25_70_guilty and q_angle_salah_2.
// v18: 29 practice steps whose `source` named no reference anyone could look
//      up — three Tabarani reports, two al-Hakim, two Bayhaqi, five bare
//      collection names with no number, and labels like "The tahmid —
//      established dhikr". Each now cites a hadith verified this session
//      against sunnah.com or the mirror, or (rizq days 2-14) drops its
//      sourceType, because "Ibn al-Qayyim on Tawakkul" is a scholar's
//      teaching, not a chain, and should not render a badge that claims one.
//      Four instructions reworded where they quoted the replaced report;
//      q_angle_8_2_anxious's du'a swapped for the one Tirmidhi 2140 teaches.
// v19: the Ibn Hibban and Musnad Ahmad citations. Correcting v18's own note:
//      sunnah.com DOES host Sahih Ibn Hibban and Musnad Ahmad. Ibn Hibban 974
//      resolves there with our exact Arabic (now also citing Hisn al-Muslim
//      139, which carries the same word order); the two Ahmad numbers did not
//      resolve, so 2803 x3 moved to 40 Hadith an-Nawawi 19, which carries both
//      clauses verbatim, and 18449 x2 dropped to the angle's own ayah 93:11 —
//      no hosted hadith matches it, and the verse commands exactly this.
// v20: reference audit. Ten citations read "Jami at-Tirmidhi" without the
//      apostrophe in Jami`. The two rizq du'a steps claimed sourceGrading
//      'hasan' and sourceType 'sunnah_action' — it is a du'a, not an action,
//      and the grading is unsupported: Tirmidhi 3500, the only hosted route to
//      this supplication, is graded Da'if, and the Nasa'i al-Kubra route that
//      carries our exact wording is ungraded. Claim dropped rather than kept.
// v21: Rizq Revolution shipped the same du'a on day 1 and day 10 — a seventh
//      of a 14-day arc. Day 10 IS "The Dua for Rizq", so it keeps it; day 1
//      ("What Is Rizq?", action: list five things money cannot buy) now asks
//      for al-'afiyah instead — Sunan Ibn Majah 3871 — which is the point that
//      day is teaching. Its actionSource also dropped a chain-less label
//      ("Authenticated in collections of morning/evening adhkar").
// v22: rizq days 4 and 12 both said hasbunallah wa ni'mal wakeel — day 4 in an
//      altered singular form (hasbiya) labelled "Quran 3:173", which the ayah
//      does not read. Day 12 keeps the canonical 3:173 + 8:40 join; day 4
//      ("Tawakkul != Laziness") now asks for beneficial knowledge, clean
//      provision and an accepted deed — Sunan Ibn Majah 925 — which names
//      effort before outcome, the point of that day. Also dropped the last
//      Tabarani quote, in q_angle_25_63_calm's actionReward.
// v23: six rizq actionSource fields held a title, not a source ("The Increase
//      Dua"). Mirroring them onto their practiceStep sources exposed three
//      practiceStep citations that do not match the Arabic above them:
//      day 2 cited Bukhari 3208 (the hadith of creation in the womb), day 5
//      cited Tirmidhi 2465 (whose quoted line is real but whose text does not
//      contain la hawla), day 7 cited Tirmidhi 1212 ("bless my Ummah in what
//      they do early"). Day 5 -> Sahih al-Bukhari 6384, the treasures-of-
//      Paradise hadith. Days 2 and 7 are app-composed wordings with no chain
//      we could find, so they are composed_dua now.
// v24: four steps cited a real, resolvable hadith that has nothing to do with
//      the du'a printed above it. q_angle_53_39_anxious put the Istikharah
//      du'a under Bukhari 1162 (Aisha on the two rak'ahs before Fajr) — the
//      Istikharah hadith is 1166. q_angle_39_7_grateful cited Abu Dawud 1319,
//      which does not contain that du'a; it now carries the sujud du'a of
//      Sahih Muslim 486. q_angle_40_60_stressed's Arabic is Quran 40:60, the
//      angle's own verse, not Abu Dawud 1488. q_angle_31_12_content cited
//      Tirmidhi 2305, a different hadith entirely, and is composed_dua now.
// v25: read all 18 machine-unverifiable citations on sunnah.com. Two wrong.
//      q_angle_67_13_sad cited Sahih Muslim 2654 (the Adam/Musa debate on
//      destiny) for the "musarrif al-qulub" du'a, which is 2655. And two steps
//      typed quran_dua under a non-Quran source line — "Tafsir Ibn Kathir on
//      4:147" and the singular hasbiya form of 3:173 — carried the "Qur'anic"
//      badge over Arabic that is not in the ayah; both are composed_dua now.
// v26: Salah Transformation rebuilt. All 7 days had no practiceSteps, so every
//      day rendered through PathStepScreen's bare `action` fallback; they now
//      carry 3 sourced steps each. Day 7 stopped reusing day 3's verse — new
//      Content quran_4_103, which commands dhikr the moment the prayer ends.
//      Day 5's Ahmad 22136 (unhostable) -> Sahih al-Bukhari 793, and day 7's
//      Bukhari 844 was the la-ilaha-illallah formula, not the istighfar +
//      tasbih it claimed -> Sahih Muslim 591 and Sahih al-Bukhari 843. Path
//      theme Hopeful -> Calm to match all seven angles.
// v27: Rizq Revolution's 14 angles restructured — [Tafsir] tag at the start so
//      the footnote stops falling back to the verse's own whyThis, a split
//      pattern so Understand/Matters breaks where intended, and mood unified to
//      the path theme. Two hadith numbers in the angle prose were wrong and no
//      script checked them: day 3's Tirmidhi 614 is Ka'b bin Ujrah on rulers,
//      not "a body nourished by haram" (-> Sahih Muslim 1015), and day 13
//      quoted "a valley of gold ... a second" where Bukhari 6436 reads "two
//      valleys ... a third".
// v28: new journey — Prayer Leadership (path_prayer_leadership), 14 free days.
//      Week 1 is what you recite (Al-Fatihah, Al-Ikhlas, the mu'awwidhatayn,
//      and two days on why repeating a surah is the method rather than a
//      shortfall); week 2 is how you lead (rows and takbir, reciting aloud,
//      transitions, sujud as-sahw, brevity, the closing sequence, and going
//      and doing it). Adds 12 Content verses — quran_8_2 and quran_20_132
//      already existed and are reused — 14 angles (q_angle_imam_day1..14) with
//      3 sourced practice steps each, and 14 hadith (hadith_imam_1..14). The
//      path was a locked stub with dailySteps: [] and isPremium: true.
// v29: no new content — a rename that recovers content already written but
//      never reachable. Two angles on quran_50_16 both carried the id
//      `q_angle_50_16_lonely`: one mood 'Sad' (with its own practiceSteps and
//      a Bukhari 7405 citation), one mood 'Lonely'. `content_angles.id` is a
//      PRIMARY KEY and the inserts below are INSERT OR REPLACE, so the later
//      array entry silently overwrote the earlier one and the Sad angle had
//      never existed on any device. The Sad one is now
//      `q_angle_50_16_sad_angle`; this bump is what actually delivers it.
// v30: no new content — voice pass. 31 mood-angle closing lines rewrote a
//      templated "X is not Y — it is Z" / "the ultimate X" / "the engine of
//      X" construction into specific, second-person, non-swappable text.
//      Scope was strictly the app's OWN unattributed sentence at the end of
//      an angle — never a translated ayah, a translated hadith, or a
//      sentence framed as a named scholar's paraphrase ("Ibn Kathir
//      explains...", "Al-Sa'di adds..."); those were left untouched even
//      where they used the same construction. Meaning was preserved in every
//      case; only the sentence's own wording changed.
// v31: no new content — self-audit correction to four of v30's own rewrites.
//      Three had swapped a general statement for an assertion about what the
//      reader had just done ("You had the opening to let it out just now, and
//      you didn't take it"), which is simply false for many users and, on
//      q_angle_3_134_angry, congratulates a user who tapped ANGRY for
//      restraint they may not have shown. q_angle_29_20_grateful scolded a
//      user who opened the app feeling grateful for noticing nothing. The
//      fourth ("remarkably little left for punishment to be about") was flip
//      about divine punishment. All four now address the reader without
//      claiming to know what they did.
// v32: new content — Suicidal Thoughts → Hope (path_hope_after_crisis), 7 days.
//      Adds quran_17_70 (Content) and q_angle_crisis_day1..day7 (angles),
//      each carrying its own verified ayah, hadith, and practiceSteps.
//      Journey unlocked in AVAILABLE_PATH_IDS the same commit.
// v33: no new content — translation-accuracy fixes, not additions. Two bugs
//      surfaced by device testing: hadith_results_2's `primaryText` held the
//      TRANSLITERATION instead of an English gloss (HadithLayer prefers
//      primaryText when it isn't meaningfully shorter than the full
//      translation, so the wrong field silently won and the correct
//      translation/englishTranslation never rendered); and Prayer Leadership
//      day 10 quoted "Rabbana lakal hamd" / "Sami'a llahu liman hamidah"
//      transliterated, with no English meaning, in three places that all
//      trace back to the same hadith — hadith_imam_10's translation/
//      englishTranslation, q_angle_imam_day10's angle prose, and its
//      practiceStep instruction. All three now carry bracketed glosses
//      ("Rabbana lakal hamd" [Our Lord, to You is all praise]). No Arabic,
//      citation, or claim changed — only the missing English meaning added.
// v34: new content — Marriage Seeker (path_marriage_seeker), 14 days. Adds 9
//      new verified verses (quran_49_13, quran_17_32, quran_24_32,
//      quran_25_74, quran_4_1, quran_20_131, quran_98_5, quran_33_21; a 10th
//      candidate, quran_2_216, turned out to already exist — reused, not
//      duplicated) and q_angle_marriage_day1..day14, each carrying its own
//      verified ayah and, on 6 of the 14 days, a verified hadith
//      (hadith_marriage_2/3/4/8/9/12 in hadithData.ts). Path was a locked
//      stub with dailySteps: [] and isPremium: true; still NOT in
//      AVAILABLE_PATH_IDS as of this bump — wiring it into PathsScreen.tsx is
//      a separate step, deferred because that file has unrelated in-flight
//      changes from another session.
// v35: new content — Tawbah Intensive (path_tawbah_intensive), 10 days. Adds
//      q_angle_tawbah_day1..day10 and hadith_tawbah_1..10. NO new Content: all
//      ten verses (39:53-54, 7:23, 20:82, 71:10, 3:135, 66:8, 24:22, 25:70,
//      4:110, 9:104) already existed and are reused, so there is no new id to
//      collide on. The path was a locked stub with dailySteps: [] — its
//      `duration` also said 14 against a description reading "10-day", which
//      would have made isPathCompleted (completedDays.length >= duration)
//      unreachable, and its `theme` said 'Sad' where the Mood union has
//      'Guilty'; both are corrected in staticPaths.ts. Unlocked in
//      AVAILABLE_PATHS and staged behind Sakina Pro the same commit.
// v36: new content — Death Awareness (path_death_awareness), 7 days, Sakina
//      Pro exclusive. Adds 5 Content verses (quran_3_185, quran_39_42,
//      quran_63_10, quran_36_12, quran_29_5 — quran_67_2 and quran_102_1_2
//      reused), q_angle_death_day1..day7, and hadith_death_3..7 (days 1-2 are
//      verse + tafsir led, no hadith row). staticPaths theme corrected
//      'Overwhelmed' -> 'Hopeful' — dhikr al-mawt is a readiness posture, not a
//      crisis one; see docs/superpowers/specs/2026-08-29-death-awareness-journey-design.md
//      and its scholarly review. Path was a locked stub with dailySteps: [].
//      Unlocked in AVAILABLE_PATHS and Pro-gated the same commit.
// v37: content correction — four misattributed scholar claims. Authored on
//      claude/friendly-bohr-86d5af as a v36; renumbered to v37 on merge
//      because main's v36 (Death Awareness) had already shipped under that
//      number. Two different v36 payloads would mean whichever an install
//      stored first permanently suppresses the other — the gate is
//      `seededVersion >= SEED_VERSION`, so only a higher number re-seeds.
//      · quran_39_53.whyThis and q_angle_39_53_sad both credited Ibn Abbas
//        with calling 39:53 the most hope-giving ayah in the Quran.
//        Al-Qurtubi on 39:53 records the opposite: Abdullah ibn Umar said
//        it, and Ibn Abbas refuted them and named 13:6 instead.
//        Reattributed to Ibn Masud, who Ibn Kathir's own entry on 39:53
//        records saying it (At-Tabarani, via Shutayr bin Shakal), so the
//        [Tafsir Ibn Kathir …] tag now names a source that carries the
//        claim. Same edit drops the "unconditional … no exception is
//        listed" framing, which that entry explicitly denies ("This cannot
//        be interpreted as meaning that sins will be forgiven without
//        repentance") — what is unconditional is who is invited, not
//        forgiveness without turning back, which is what 39:54 says in the
//        same block this app already renders. The angle's first
//        practiceStep carried the same overclaim and is corrected with it.
//        Retagged from the bare "[Tafsir Ibn Kathir, Surah Az-Zumar]" to
//        "[Tafsir Ibn Kathir on 39:53]" so verify-tafsir-tags.mjs can check
//        it instead of counting it as an unverifiable bare tag.
//      · q_angle_89_27_30_calm credited Ibn Abbas with a gloss on "the
//        reassured soul". Its [Tafsir al-Baghawi] tag does not carry it —
//        al-Baghawi on 89:27 never mentions Ibn Abbas, and the sentence is a
//        composite of three glosses he does record (Mujahid, al-Hasan,
//        Atiyyah), who are now named instead. Al-Qurtubi does have an Ibn
//        Abbas gloss here but a narrower one, so it did not rescue it either.
//      · q_angle_25_63_content credited al-Hasan al-Basri with the humility
//        gloss, which is al-Baghawi's own wording; al-Hasan now carries what
//        he actually said on the following clause. That angle's first
//        practiceStep repeated the claim and also badged sourceType
//        'quran_dua' (renders "Qur'anic") over a tafsir source line, in a
//        step containing no Arabic at all. Badge dropped — a mindset step
//        should claim nothing. NOTE: 233 steps corpus-wide carry that same
//        quran_dua-over-a-tafsir-label shape; only this one is fixed here.
//      · q_angle_94_5_sad said "Ibn Kathir records" of a definite/indefinite
//        grammar reading and an Ibn Masud report. The abridged Ibn Kathir
//        has neither — it says only that Allah informs that with difficulty
//        there is ease, and reaffirms it. Al-Qurtubi on 94:6 has both,
//        credits the reading to the grammarian Tha'lab, and then records
//        al-Jurjani rejecting it. Retagged [Tafsir al-Qurtubi on 94:6],
//        attributed to Tha'lab, and the dispute noted so a contested
//        reading is no longer presented as settled. Ibn Masud is kept —
//        that attribution was correct — with his own wording.
//      Both al-Baghawi tags were bare and are now "on <surah>:<ayah>", so
//      verify-tafsir-tags can check them instead of skipping them. No
//      Arabic, translation, verse or hadith citation changed.
// v38: verse text correction — quran_2_155_156 spelled 2:156's أَصَـٰبَتْهُم
//      with a full alef (أَصَابَتْهُم) instead of the Uthmani dagger alef.
//      quran.com api/v4 text_uthmani, alquran.cloud quran-uthmani, and this
//      app's own quran_2_155 (which cites the same ayah range) all use the
//      dagger-alef form; this entry was the sole outlier. The replacement was
//      copied byte-for-byte out of quran_2_155 rather than typed. One word,
//      one entry, no meaning change — the two spellings are the same word in
//      two orthographic conventions.
//      Found by the new verse-integrity test (src/__tests__/
//      quranArabicIntegrity.test.ts), which locks every verse against a
//      committed snapshot and cross-checks its consonantal skeleton against
//      quran.com. Regenerate the snapshot with
//      `node scripts/refresh-quran-canonical.mjs` after ANY verse edit, or
//      the LOCK check will fail on your own change.
// v39: schema — Content.story added (see the 2026-08-31 stories spec), plus
//      the first story, on quran_12_87. Existing installs re-seed;
//      CURRENT_DB_VERSION 12 recreates the content tables so the new column
//      exists to seed into.
// v40: Calm pool 16 -> 40. 24 new mood angles across three tiers — 13 on
//      verses already tagged Calm, 4 re-tagging existing verses, and 7 on new
//      Content entries (39:23, 6:82, 3:191, 17:82, 16:97, 76:25, 51:20).
// v41: Sad pool 20 -> 40. 20 new mood angles — 3 on verses already tagged
//      Sad, 7 re-tagging existing verses, and 10 on new Content entries
//      (57:23, 93:5, 13:24, 12:64, 42:28, 28:13, 94:1, 29:2, 64:11, 10:57).
// v42: no new content — rendering fix. 23 markdown emphasis pairs removed
//      from angle, reflection, whyThis and practiceStep instruction text
//      across 19 fields. React Native Text has no markdown renderer, so
//      "*with*" reached the user as literal asterisks. Words unchanged.
// v43: Lonely pool 22 -> 40. 18 new mood angles — 1 T1, 7 re-tags and 10
//      new Content entries (93:6, 93:7, 93:8, 19:96, 3:103, 9:71, 18:28,
//      20:39, 94:4, 51:56). The re-tags include 112:1-4, 33:41 and 54:17,
//      which carried NO mood tag and were unreachable from every pool.
// v44: no new content — audit of v39-v43. 19 reflections and 1 angle body
//      rewritten: 19 of the 62 new reflections had drifted onto one
//      "What have you been..." construction (the templating SEED_VERSION 30
//      already rewrote 31 legacy angles to escape), and two entries asserted
//      things about the reader rather than asking — 112:1-4 told a Lonely
//      reader "You have been leaning on people", and 20:39 asked how much of
//      their effort "this week" went on being liked. Also swapped
//      q_angle_30_23_calm's step 2, which repeated 20:130's du'a. And 20:39's
//      English: stripping Sahih International's "[Saying]," left the card
//      opening on a bare imperative ("Cast him into the chest"), which reads as
//      an instruction to the reader. The Arabic opens on ani — saying — so the
//      framing is restored unbracketed, per the resolve-don't-drop rule.
// v45: Hopeful 24 -> 27. First 3 of 16, all T1 (12:87, 65:3, 33:21). The
//      ledger's other five Hopeful picks were reassigned first — seed-ledger
//      chose T1 candidates by availability, which is the right mechanical
//      filter and the wrong editorial one, since most of these verses are
//      tagged Hopeful only so a journey day could point at them. 17:32 is a
//      prohibition, 7:96 closes on divine seizure, 2:168 is a dietary command,
//      24:32 is a marriage ruling; 20:131, 25:74, 33:21, 65:3 and 98:5 replace
//      them from the same pool.
// v46: Hopeful 27 -> 32. 5 more T1 (65:7, 14:37, 2:261, 17:79, 73:1-4).
//      Bukhari 1410 and 6464 are cited as quoted framing on their steps, not
//      bare, because the step action is app-written and the hadith is its
//      basis rather than its text.
// v47: Hopeful 32 -> 40, target floor reached. Final 8 T1 (14:7, 23:1,
//      14:40, 67:15, 49:13, 20:131, 25:74, 98:5). Four moods now at 40.
//      Seven Hopeful tags stay inert on purpose: 17:32, 7:96, 2:168, 24:32
//      and 29:45 were rejected on fit, 2:155-156 and 4:1 unused.
// v48: Grateful 35 -> 40, target floor reached. 4 T1 (22:77, 20:130, 11:6,
//      24:38) + 1 T2 (29:60 re-tagged Grateful). 7:96 rejected here for the
//      same reason as in Hopeful: the complete ayah closes on divine seizure.
//      Grateful had no spare T1, so the unit became a T2. Five moods at 40.
// v49: Guilty 30 -> 40, target floor reached. 4 T2 (21:87, 24:22, 7:200,
//      25:58 each re-tagged Guilty) + 6 T3 (new verses 4:31, 11:114, 17:25,
//      9:118, 16:119, 3:31). 9:118 carries a story — Ka'b ibn Malik's own
//      account of the fifty nights [Bukhari 4418]. Six moods at 40.
// v50: Angry 25 -> 40, target floor reached. 6 T2 (49:10, 39:10, 12:18, 10:57,
//      64:11, 4:1 re-tagged Angry) + 9 T3 (new verses 59:10, 15:47, 73:10,
//      60:7, 28:55, 49:12, 16:90, 3:120, 49:11). Eight moods at 40; Tired left.
//      Also repairs, not new content: the arabicText of the 6 Guilty verses and
//      11 step clauses across Guilty/Angry/Hopeful was NFC-normalised rather
//      than the byte-exact quran.com text, and 59:10's step clause had
//      "Rabbana" moved to the front of a clause the ayah puts it after.
// v51: Tired 24 -> 40, target floor reached — ALL NINE MOODS AT THE 40 FLOOR.
//      2 T1 (2:261, 67:15, pre-assigned in the ledger) + 6 T2 (4:28, 3:191,
//      21:83, 2:214, 29:69, 65:3 re-tagged Tired) + 8 T3 (new verses 64:16,
//      23:62, 30:54, 19:25, 51:58, 16:7, 13:29, 11:112). Every step Arabic in
//      this batch was sliced BY WORD INDEX out of whichever text the angle's
//      verse actually holds (the corpus's own arabicText for T1/T2, a fresh
//      quran.com fetch for T3) rather than typed or substring-matched — no
//      Arabic in this batch was ever typed by hand. 3:191's corpus text turned
//      out to differ from a fresh quran.com fetch by more than NFC (the
//      richer-Uthmani-edition difference CLAUDE.md documents), which a
//      substring search across the two texts cannot see past; index slicing
//      never compares the two texts, so it was unaffected — confirmed by a
//      21-word count match before slicing and a clean verify-citations run
//      after. A second bug, caught before authoring: the payload-generation
//      script read alquran.cloud's transliteration response as `data.text`
//      instead of `data[0].text` (the API always wraps `data` in an array,
//      even for one edition), which silently produced 8 payloads with no
//      primaryText/transliteration at all — JSON.stringify drops undefined
//      fields rather than erroring, so nothing complained until
//      author-angle.mjs's required-field check rejected the first one.
// v52: Screen Detox (path_screen_detox) authored and unlocked — 7 days, theme
//      Overwhelmed. 7 new journey angles (q_angle_screen_day1-7) + 7 new hadith
//      rows (hadith_screen_1-7). Only 2 new verses (63:9, 17:36); the other five
//      days reuse 25:72, 13:28, 23:1, 73:1-4 and 103:1-3, so no duplicate ids
//      reached the seeder. Every ayah and hadith was fetched before it was
//      written, which caught one from-memory error before it shipped: the du'a
//      first chosen for day 3 (Tirmidhi 3604) is actually an unrelated hadith
//      about seeking refuge from the punishment of the grave and the Dajjal, and
//      was replaced with Ibn Majah 925. No Arabic in this batch was typed — the
//      verses are quran.com text_uthmani byte-checked at write time, and each
//      du'a was sliced out of its fetched matn on a harakat-insensitive skeleton
//      match (a byte-exact needle failed on every one, and slicing at the final
//      consonant silently dropped the closing haraka until the span was extended
//      past the trailing marks).
// v53: Rizq Revolution (path_rizq_revolution) — all 14 day angles
//      (q_angle_rizq_day1-14) rewritten after a scholarly + clinical review. No
//      new ids, no verse text touched. Fixed: Day 1 credited Ibn Kathir with a
//      "written and guaranteed" reading of 51:22 when his entry says rain/Paradise;
//      Day 8 told users to give "from what you need" against Bukhari 1426; Day 10
//      labelled Abu Dawud 1518 (Da'if) as hasan and put an invented timing on the
//      Nasa'i du'a; Days 2/5/7/11/14 attributed claims to Ghazali / Ibn al-Qayyim /
//      Ibn Taymiyyah / Ibn Uthaymeen / Ibn Baaz that could not be located; Day 3's
//      Imam Ahmad anecdote had no source. Added the Tirmidhi 3563 debt du'a (Day
//      12), a crisis line on Day 12, and dropped lines that prosperity-gated
//      worship or told hungry users "Has Allah ever left you starving?". Every
//      source was fetched before it was written (mirror + sunnah.com + quran.com
//      tafsir 169).
// v54: Salah Transformation (path_salah_transformation) — all 7 day angles
//      (q_angle_salah_1-7) corrected after a scholarly + clinical review. No new
//      ids, no verse text touched. Fixed: Abu Dawud 874 (Hudhayfa's NIGHT prayer)
//      had been cited on days 3, 5 and 6 for three different claims — it now
//      backs only day 6 (the seat between the prostrations); day 3 cites Ibn
//      Majah 803 (Abu Humayd: faced the qibla, raised his hands, said Allahu
//      Akbar), day 5 cites Bukhari 793 and Muslim 772, day 6's imam rule cites
//      Bukhari 689. Day 7's 33/33/34 moved from Bukhari 843 (which gives 33 each)
//      to Muslim 596. Stitched English "quotes" on days 4 and 5 now match the
//      published translations. Unlocatable "Ibn Rajab on 23:1-2" and "Ibn
//      al-Qayyim on 29:45" angles were rewritten around Ibn Kathir's entries,
//      and the day 2 / day 7 angles no longer credit Ibn Kathir with claims his
//      entries do not make. Added a "a wandering mind is not a verdict" step
//      (Bukhari 608) and a scholar/doctor pointer for prayer-doubt on days 1
//      and 5. Every source was fetched before it was written.
// v55: claims audit of all ten available journeys (scripts/verify-journey-claims.mjs, new).
//      No new ids; no verse Arabic touched. Corrected: English in quotation marks that
//      was not the published translation (Study 1-7, Results 1-7, Prayer Leadership
//      1/4/7/10/14, Marriage Seeker 2/3/4/8/9, Rizq 1); 23 scripture/prophetic badges
//      on steps that show no Arabic (Study, Results, Rizq) now carry no badge, and
//      app-written exercises say "Suggested practice"; "Sahih Ibn Hibban 974" was the
//      wrong number — Hisn al-Muslim 139 gives Ibn Hibban 2427 (Rizq 9, Study 4 + its
//      hadith layer, whose Arabic also stopped after the first clause); Ibn Majah 224
//      shown without the "hasan" grading sunnah.com contradicts; Results 4/6 and
//      Study 1/2 stopped citing a hadith under a quote it does not contain or on two
//      days; Prayer Leadership 1 now sources where a single follower stands (Bukhari
//      699) instead of "Lead your people in prayer". Attributions that the cited
//      tafsir does not make were rewritten or re-tagged: Hope 1 (Ibn Kathir/al-Sa'di
//      on 12:86), Hope 3 (the "layers" are Ibn Kathir 21:87; the widening promise is
//      al-Sa'di 21:88), Hope 7 (unfetchable "Madarij" -> Ibn Kathir 13:28), Death 1
//      (Ibn Kathir never says the Companions disliked death), Death 4 (no "minor
//      death" in al-Qurtubi's entry), Marriage 1/4/5/10 (al-Qurtubi/al-Sa'di),
//      Prayer Leadership 7/13/14, Hope 5, Tawbah 3/9. Marriage 9 no longer adds
//      "Monday or Thursday" to a hadith that does not say it. Every source was
//      fetched, or read in Arabic, before it was written.
// v56: audit of the v55 commit. hadith_study_1 carries 'hasan_li_ghayrihi' instead of no
//      grading — HadithLayer.tsx prints `grading || 'authentic'`, so removing the grade
//      had made the screen say "Authentic" about Ibn Majah 224. Tawbah day 6 no longer
//      shows hadith_tawbah_6 (Ibn Majah 4250, which printed "Authentic" with no grading
//      although most graders call it Da'if); that day renders one layer fewer.
// v57: Rizq Revolution cut from 14 days to 7 (docs/journeys-spec.md: Day 4 was close to Day 9).
//      Kept: what rizq is, Ar-Razzaq, halal, tawakkul + action, contentment, the dua, the
//      review. q_angle_rizq_day6/10/14 are now day5/6/7; day5/7/8/9/11/12/13 were deleted.
//      Day 7's recap now names only the six days that remain. Installs that already seeded
//      the old rows keep them, unreferenced.
const SEED_VERSION = 57;
// Separate keys per content type — Quran and Hadith data change independently,
// and each seeder used to write the SAME key at the end of its run. Since
// initializeDatabase() awaits seedQuranContent() before seedHadithContent(),
// a version bump made only for one of them (e.g. new hadith rows, no Quran
// changes) still made seedQuranContent's no-op re-run write the bumped key
// first, so seedHadithContent read a version that already looked current and
// skipped its own re-seed — the new content never reached existing installs.
const SEED_VERSION_KEY_QURAN = '@sakina_seed_version_quran';
const SEED_VERSION_KEY_HADITH = '@sakina_seed_version_hadith';

// Stay comfortably under SQLite's bound-variable limit (999 on older builds).
const SQLITE_MAX_VARS = 900;

// Inserts `rows` via chunked multi-row VALUES statements instead of one
// `runAsync` call per row. A fresh install seeds ~1,500 rows across content,
// content_moods, and content_angles; awaiting each insert individually adds a
// JS↔native bridge round-trip per row, which is what made first-launch feel
// slow even inside a single transaction (the transaction only batches the
// disk sync, not the bridge calls). Chunking cuts ~1,500 round-trips to a
// couple dozen.
async function batchInsert(
  db: any,
  sqlPrefix: string,
  columnsPerRow: number,
  rows: unknown[][],
): Promise<void> {
  if (rows.length === 0) return;
  const rowsPerChunk = Math.max(1, Math.floor(SQLITE_MAX_VARS / columnsPerRow));
  const placeholderRow = `(${Array(columnsPerRow).fill('?').join(',')})`;
  for (let i = 0; i < rows.length; i += rowsPerChunk) {
    const chunk = rows.slice(i, i + rowsPerChunk);
    const placeholders = chunk.map(() => placeholderRow).join(',');
    await db.runAsync(sqlPrefix + placeholders, chunk.flat());
  }
}

export async function seedQuranContent(db: any): Promise<void> {
  // Fast path: if Quran content already exists AND it came from this seed
  // version (or newer), skip entirely. Covers online users who synced from
  // Supabase and fresh-version users.
  const existing = (await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM content WHERE type = 'Quran'`,
  )) as { count: number } | null;
  const seededVersion = Number((await AsyncStorage.getItem(SEED_VERSION_KEY_QURAN)) ?? '0');
  if (existing && existing.count > 0 && seededVersion >= SEED_VERSION) return;

  console.log('[Seed] Seeding Quran content from local data (seed v' + SEED_VERSION + ')…');

  // ── Dynamic require ─────────────────────────────────────────────────────
  // This is the key: require() here, NOT at the top of this file.
  // Metro includes quranData.ts in the bundle but won't evaluate it until
  // this line runs (well after the first render frame).
  const { quranContent, quranContentAngles } = require('../data/quranData') as {
    quranContent: Content[];
    quranContentAngles: ContentAngle[];
  };

  const t0 = Date.now();

  // ── Batch insert inside a single transaction ────────────────────────────
  // A transaction turns N individual disk syncs into 1, cutting insert
  // time from several seconds to under 200ms on typical devices.
  await db.withTransactionAsync(async () => {
    // 1. content table
    // OR REPLACE (not OR IGNORE): a version bump means content fields may have
    // been edited (e.g. a whyThis correction), not just new rows added. IGNORE
    // would silently keep the stale row forever on any device that already
    // has this id — REPLACE overwrites it with the current data. Safe here:
    // foreign keys are never enforced in this DB (no PRAGMA foreign_keys=ON),
    // so the delete-then-reinsert REPLACE does under the hood never cascades.
    const contentRows = quranContent.map((item) => [
      item.id,
      item.type,
      item.primaryText,
      item.arabicText ?? null,
      item.transliteration ?? null,
      item.englishTranslation,
      item.source,
      item.audioKey ?? null,
      item.whyThis,
      item.propheticPractice ? JSON.stringify(item.propheticPractice) : null,
      item.story ? JSON.stringify(item.story) : null,
      item.optionalAction ?? null,
      item.optionalReflection ?? null,
      item.prayerContext ? JSON.stringify(item.prayerContext) : null,
    ]);
    await batchInsert(
      db,
      `INSERT OR REPLACE INTO content
         (id, type, primaryText, arabicText, transliteration, englishTranslation,
          source, audioKey, whyThis, propheticPractice, story, optionalAction,
          optionalReflection, prayerContext)
       VALUES `,
      14,
      contentRows,
    );

    // 2. content_moods — one row per (content, mood) pair
    const moodRows: unknown[][] = [];
    for (const item of quranContent) {
      for (const mood of item.moods) {
        const score = (item.moodScores as Record<string, number> | undefined)?.[mood] ?? 10;
        moodRows.push([item.id, mood, score]);
      }
    }
    await batchInsert(
      db,
      `INSERT OR REPLACE INTO content_moods (contentId, mood, relevanceScore) VALUES `,
      3,
      moodRows,
    );

    // 3. content_angles table — same OR REPLACE reasoning as above.
    const angleRows = quranContentAngles.map((angle) => [
      angle.id,
      angle.contentId,
      angle.mood,
      angle.angle,
      angle.angleSource ?? null,
      angle.action ?? null,
      angle.actionArabicText ?? null,
      angle.actionTransliteration ?? null,
      angle.actionSource ?? null,
      angle.actionHowTo ?? null,
      angle.actionReward ?? null,
      // practiceSteps: always serialise to JSON string for consistency
      angle.practiceSteps == null
        ? null
        : typeof angle.practiceSteps === 'string'
          ? angle.practiceSteps
          : JSON.stringify(angle.practiceSteps),
      angle.reflection ?? null,
    ]);
    await batchInsert(
      db,
      `INSERT OR REPLACE INTO content_angles
         (id, contentId, mood, angle, angleSource, action, actionArabicText,
          actionTransliteration, actionSource, actionHowTo, actionReward,
          practiceSteps, reflection)
       VALUES `,
      13,
      angleRows,
    );
  });

  await AsyncStorage.setItem(SEED_VERSION_KEY_QURAN, String(SEED_VERSION));

  console.log(
    `[Seed] Done — ${quranContent.length} verses, ${quranContentAngles.length} angles` +
    ` in ${Date.now() - t0}ms`,
  );
}

export async function seedHadithContent(db: any): Promise<void> {
  // Fast path: if Hadith content already exists AND it came from this seed
  // version (or newer), skip entirely. Covers online users who synced from
  // Supabase and fresh-version users.
  const existing = (await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM content WHERE type = 'Hadith'`,
  )) as { count: number } | null;
  const seededVersion = Number((await AsyncStorage.getItem(SEED_VERSION_KEY_HADITH)) ?? '0');
  if (existing && existing.count > 0 && seededVersion >= SEED_VERSION) return;

  console.log('[Seed] Seeding Hadith content from local data (seed v' + SEED_VERSION + ')…');

  // ── Dynamic require ─────────────────────────────────────────────────────
  // Same pattern as quranData.ts above: require() here, NOT at the top of
  // this file, so Metro doesn't evaluate hadithData.ts until this line runs.
  const { hadithContent } = require('../data/hadithData') as {
    hadithContent: Content[];
  };

  const t0 = Date.now();

  // ── Batch insert inside a single transaction ────────────────────────────
  await db.withTransactionAsync(async () => {
    // 1. content table — OR REPLACE, see the same note in seedQuranContent above.
    const contentRows = hadithContent.map((item) => [
      item.id,
      item.type,
      item.primaryText,
      item.arabicText ?? null,
      item.transliteration ?? null,
      item.englishTranslation,
      item.source,
      item.audioKey ?? null,
      item.whyThis,
      item.propheticPractice ? JSON.stringify(item.propheticPractice) : null,
      item.story ? JSON.stringify(item.story) : null,
      item.optionalAction ?? null,
      item.optionalReflection ?? null,
      item.prayerContext ? JSON.stringify(item.prayerContext) : null,
    ]);
    await batchInsert(
      db,
      `INSERT OR REPLACE INTO content
         (id, type, primaryText, arabicText, transliteration, englishTranslation,
          source, audioKey, whyThis, propheticPractice, story, optionalAction,
          optionalReflection, prayerContext)
       VALUES `,
      14,
      contentRows,
    );
  });

  await AsyncStorage.setItem(SEED_VERSION_KEY_HADITH, String(SEED_VERSION));

  console.log(
    `[Seed] Done — ${hadithContent.length} hadiths in ${Date.now() - t0}ms`,
  );
}
