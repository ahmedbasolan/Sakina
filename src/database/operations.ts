import * as SQLite from 'expo-sqlite';
import { dbQuery } from './connection';
import { createTables, createIndices } from './tables';
import { runMigrationSteps } from './migrations';
import { seedQuranContent, seedHadithContent } from './seedContent';

const CURRENT_DB_VERSION = 11; // Increment this to force a content refresh

// Internal helper - must be defined before use
const runInitializationSteps = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  console.log('Initializing database tables...');

  // Create all tables
  await createTables(db);

  // Create all indices
  await createIndices(db);

  // Run migrations to handle schema updates
  await runMigrationSteps(db);
};

export const refreshContentOnly = async (): Promise<void> => {
  await dbQuery(async (db) => {
    try {
      console.log('Refreshing content data...');

      // Drop and Re-initialize inside a single queued operation
      await db.execAsync('DROP TABLE IF EXISTS content_moods');
      await db.execAsync('DROP TABLE IF EXISTS content_angles');
      await db.execAsync('DROP TABLE IF EXISTS content');

      // We manually call the inner init steps here to stay in the queue
      await runInitializationSteps(db);
      console.log('Content refresh completed');
    } catch (error) {
      console.error('Error refreshing content:', error);
    }
  });
};

export const resetDatabase = async (): Promise<void> => {
  await dbQuery(async (db) => {
    try {
      // Drop all tables with proper error handling
      const tables = [
        'content',
        'content_angles',
        'content_moods',
        'user_history',
        'saved_reflections',
        'reflections',
        'user_sessions',
        'user_subscription',
        'collections',
        'spiritual_paths',
        'path_steps',
        'user_path_progress',
        'audio_content',
      ];

      for (const table of tables) {
        try {
          await db.execAsync(`DROP TABLE IF EXISTS ${table}`);
        } catch (_error) {
          console.log(`Table ${table} may not exist or is locked, continuing...`);
        }
      }

      console.log('Database reset completed successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  });
};

/**
 * kv_store key recording which account the local user-data tables belong to.
 * Absent = the rows were written in guest mode and are eligible to migrate to
 * the first account that signs in. Set = they belong to that user id and must
 * never be uploaded under a different one.
 *
 * Lives here because `clearAllLocalUserData` has to clear it; the read/write
 * logic is in supabaseDataService.claimLocalDataForUser.
 */
export const LOCAL_DATA_OWNER_KEY = 'local_data_owner';

/**
 * Wipe every local table that holds data belonging to the signed-in person,
 * leaving seeded app content (verses, angles, paths, hadith, Quran cache) and
 * device-level config intact. Called from `AuthService.deleteAccount()` after
 * the server-side delete confirms.
 *
 * Why this exists: deleting the account used to clear Supabase and nothing
 * else. The local rows survived, and `hasMigrated` in AuthContext is a `useRef`
 * that resets on app restart — so the next sign-in on that device, with ANY
 * account, ran `migrateGuestDataToSupabase()` and uploaded the deleted user's
 * mood history and journey progress under the new user_id. The Settings
 * confirmation ("deleted forever") was also simply untrue on-device.
 *
 * Deliberately NOT cleared, so nobody reads this as a full device wipe:
 *  - `user_preferences` — transliteration / audio / Asr madhab are device
 *    config with no personal content; resetting them would silently change a
 *    shared device's prayer times for no privacy gain.
 *  - `quran_cache` and kv_store's `quran_cache_format_version` — downloaded
 *    scripture, identical for every user.
 *  - `collections` — listed in `resetDatabase` but has no reader or writer
 *    anywhere in src/. If that table ever gains writes, add it here.
 *  - AsyncStorage — `STORAGE_KEYS.moodHistory`, `onboardingMood` and
 *    `onboardingGoal` are declared but unused; the rest is session/onboarding
 *    state that the SIGNED_OUT handler already clears.
 */
export const clearAllLocalUserData = async (): Promise<void> => {
  await dbQuery(async (db) => {
    // One transaction: a partial wipe is the case that re-uploads a subset of
    // the deleted account's rows into the next account, which is the exact
    // failure this function exists to prevent.
    await db.withTransactionAsync(async () => {
      for (const table of [
        'user_history',
        'saved_reflections',
        'reflections',
        'user_path_progress',
        'bookmarked_verses',
        'user_sessions',
        'user_subscription',
      ]) {
        await db.execAsync(`DELETE FROM ${table}`);
      }

      // kv_store is mixed: the reading position, the last-opened journey and
      // the data-owner marker are personal, the cache-format version is not.
      // Delete by key rather than emptying the table. Dropping the owner marker
      // is what returns the device to a clean "no account has claimed this"
      // state after a delete.
      await db.runAsync('DELETE FROM kv_store WHERE key IN (?, ?, ?)', [
        'quran_reading_progress',
        'last_opened_path',
        LOCAL_DATA_OWNER_KEY,
      ]);
    });
  });
};

/**
 * Schema migrations run automatically on every `initializeDatabase()` call
 * (via `runInitializationSteps`). You do NOT normally need to call this —
 * it's kept as an explicit trigger for tests / recovery paths.
 */
export const migrateDatabase = async (): Promise<void> => {
  await dbQuery(runMigrationSteps);
};

export const initializeDatabase = async (): Promise<void> => {
  await dbQuery(async (db) => {
    // Always run init + migrations on startup. Schema migrations are decoupled
    // from content refreshes and fire on every launch.
    await runInitializationSteps(db);

    // Version-based content refresh: only wipe & recreate content tables when
    // CURRENT_DB_VERSION has been bumped (e.g. new seed data).
    const versionResult = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    const currentVersion = versionResult?.user_version || 0;

    if (currentVersion < CURRENT_DB_VERSION) {
      console.log(
        `Database version mismatch (${currentVersion} < ${CURRENT_DB_VERSION}). Refreshing content...`,
      );

      try {
        await db.execAsync('DROP TABLE IF EXISTS content_moods');
        await db.execAsync('DROP TABLE IF EXISTS content_angles');
        await db.execAsync('DROP TABLE IF EXISTS content');

        // Re-create ONLY the dropped tables — all other schema was already
        // initialized and migrated above, so a full re-run would be wasteful.
        await db.execAsync(`CREATE TABLE IF NOT EXISTS content (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          primaryText TEXT NOT NULL,
          arabicText TEXT,
          transliteration TEXT,
          englishTranslation TEXT NOT NULL,
          source TEXT NOT NULL,
          audioKey TEXT,
          whyThis TEXT NOT NULL,
          propheticPractice TEXT,
          optionalAction TEXT,
          optionalReflection TEXT,
          prayerContext TEXT
        );`);
        await db.execAsync(`CREATE TABLE IF NOT EXISTS content_angles (
          id TEXT PRIMARY KEY,
          contentId TEXT NOT NULL,
          mood TEXT NOT NULL,
          angle TEXT NOT NULL,
          angleSource TEXT,
          action TEXT,
          actionArabicText TEXT,
          actionTransliteration TEXT,
          actionSource TEXT,
          actionHowTo TEXT,
          actionReward TEXT,
          practiceSteps TEXT,
          reflection TEXT,
          FOREIGN KEY (contentId) REFERENCES content (id)
        );`);
        await db.execAsync(`CREATE TABLE IF NOT EXISTS content_moods (
          contentId TEXT NOT NULL,
          mood TEXT NOT NULL,
          relevanceScore INTEGER NOT NULL DEFAULT 10,
          PRIMARY KEY (contentId, mood),
          FOREIGN KEY (contentId) REFERENCES content (id)
        );`);

        await db.execAsync(`PRAGMA user_version = ${CURRENT_DB_VERSION};`);
        console.log(`Database updated to version ${CURRENT_DB_VERSION} and content refreshed`);
      } catch (error) {
        console.error('Error during automatic content refresh:', error);
      }
    }

    // Seed Quran content if the tables are empty — covers:
    //   • First install (never seeded)
    //   • Online users whose content came from Supabase but whose
    //     local SQLite content tables were wiped by a version bump
    // The seeder is idempotent (no-op when rows already exist) and
    // uses a dynamic require() internally so quranData.ts is NOT
    // evaluated at bundle-parse time — only here, after first render.
    try {
      await seedQuranContent(db);
    } catch (error) {
      console.error('[Seed] Failed to seed Quran content:', error);
      // Non-fatal: Supabase is the primary content source; SQLite is a fallback.
    }

    // Seed Hadith content (Study Journeys) — same idempotent, version-gated
    // pattern as Quran content above.
    try {
      await seedHadithContent(db);
    } catch (error) {
      console.error('[Seed] Failed to seed Hadith content:', error);
      // Non-fatal: Supabase is the primary content source; SQLite is a fallback.
    }
  });
};
