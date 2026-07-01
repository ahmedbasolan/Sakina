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
