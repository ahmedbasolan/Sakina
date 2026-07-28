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
const SEED_VERSION = 26;
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
      item.optionalAction ?? null,
      item.optionalReflection ?? null,
      item.prayerContext ? JSON.stringify(item.prayerContext) : null,
    ]);
    await batchInsert(
      db,
      `INSERT OR REPLACE INTO content
         (id, type, primaryText, arabicText, transliteration, englishTranslation,
          source, audioKey, whyThis, propheticPractice, optionalAction,
          optionalReflection, prayerContext)
       VALUES `,
      13,
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
      item.optionalAction ?? null,
      item.optionalReflection ?? null,
      item.prayerContext ? JSON.stringify(item.prayerContext) : null,
    ]);
    await batchInsert(
      db,
      `INSERT OR REPLACE INTO content
         (id, type, primaryText, arabicText, transliteration, englishTranslation,
          source, audioKey, whyThis, propheticPractice, optionalAction,
          optionalReflection, prayerContext)
       VALUES `,
      13,
      contentRows,
    );
  });

  await AsyncStorage.setItem(SEED_VERSION_KEY_HADITH, String(SEED_VERSION));

  console.log(
    `[Seed] Done — ${hadithContent.length} hadiths in ${Date.now() - t0}ms`,
  );
}
