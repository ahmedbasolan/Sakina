/**
 * seedContent.ts — One-time SQLite seeder for Quran content.
 *
 * WHY THIS EXISTS:
 * quranData.ts is 10,681 lines of TypeScript that previously appeared in the
 * static import graph of QuranLibraryScreen and initialContent.ts. Metro
 * bundled it into the main JS bundle where Hermes parsed and evaluated it
 * synchronously before the app's first render, adding significant TTI overhead
 * on low-end Android devices.
 *
 * HOW IT WORKS:
 * This module is statically imported (the function reference), but the data
 * itself is loaded via a dynamic require() call INSIDE seedQuranContent().
 * That defers module evaluation to the first time this function runs —
 * inside initializeDatabase(), which is called asynchronously after the
 * app's first render frame.
 *
 * Because everything routes through the dbQuery mutex, seeding is fully
 * serialised with all subsequent queries. No race conditions.
 *
 * IDEMPOTENT: early-returns if rows already exist (safe on every launch).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Content, ContentAngle } from '../types';

// Bump whenever quranData.ts gains new rows. Existing installs skip the
// seeder once content exists, so without a version bump they would never
// receive later additions (this is how the Salah Transformation angles went
// missing for already-seeded devices). Every insert below is
// INSERT OR IGNORE, so a version-triggered re-run is idempotent and cheap.
const SEED_VERSION = 2;
const SEED_VERSION_KEY = '@sakina_seed_version';

export async function seedQuranContent(db: any): Promise<void> {
  // Fast path: if Quran content already exists AND it came from this seed
  // version (or newer), skip entirely. Covers online users who synced from
  // Supabase and fresh-version users.
  const existing = (await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM content WHERE type = 'Quran'`,
  )) as { count: number } | null;
  const seededVersion = Number((await AsyncStorage.getItem(SEED_VERSION_KEY)) ?? '0');
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
    for (const item of quranContent) {
      await db.runAsync(
        `INSERT OR IGNORE INTO content
           (id, type, primaryText, arabicText, transliteration, englishTranslation,
            source, audioKey, whyThis, propheticPractice, optionalAction,
            optionalReflection, prayerContext)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ],
      );

      // 2. content_moods — one row per (content, mood) pair
      for (const mood of item.moods) {
        const score = (item.moodScores as Record<string, number> | undefined)?.[mood] ?? 10;
        await db.runAsync(
          `INSERT OR IGNORE INTO content_moods (contentId, mood, relevanceScore)
           VALUES (?, ?, ?)`,
          [item.id, mood, score],
        );
      }
    }

    // 3. content_angles table
    for (const angle of quranContentAngles) {
      await db.runAsync(
        `INSERT OR IGNORE INTO content_angles
           (id, contentId, mood, angle, angleSource, action, actionArabicText,
            actionTransliteration, actionSource, actionHowTo, actionReward,
            practiceSteps, reflection)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ],
      );
    }
  });

  await AsyncStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION));

  console.log(
    `[Seed] Done — ${quranContent.length} verses, ${quranContentAngles.length} angles` +
    ` in ${Date.now() - t0}ms`,
  );
}
