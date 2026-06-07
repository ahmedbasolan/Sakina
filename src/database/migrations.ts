import * as SQLite from 'expo-sqlite';

/**
 * Schema migrations — run automatically on every `initializeDatabase()` call.
 *
 * Each migration step is isolated in its own try/catch so a failure in step N
 * does not silently skip steps N+1 … N+k. Previously the entire function was
 * wrapped in a single catch that swallowed all errors after the first failure,
 * leaving the schema partially migrated on low-storage or locked-DB devices.
 */
export const runMigrationSteps = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  const runStep = async (name: string, fn: () => Promise<void>): Promise<void> => {
    try {
      await fn();
    } catch (error) {
      console.error(`[Migration] Step "${name}" failed:`, error);
      // Do NOT swallow — re-throw so initializeDatabase can decide whether
      // to surface the error. Non-critical column additions may be retried
      // on the next launch; destructive failures should bubble up.
      throw error;
    }
  };

  const hasColumn = async (table: string, column: string): Promise<boolean> => {
    const info = await db.getAllAsync(`PRAGMA table_info(${table})`);
    return (info as any[]).some((col) => col.name === column);
  };

  // 1. user_history: pending_sync flag for offline-write tracking
  await runStep('user_history.pending_sync', async () => {
    if (!(await hasColumn('user_history', 'pending_sync'))) {
      console.log('[Migration] Adding pending_sync to user_history...');
      await db.execAsync(
        `ALTER TABLE user_history ADD COLUMN pending_sync INTEGER NOT NULL DEFAULT 0`,
      );
    }
  });

  // 2. saved_reflections: isFavorite
  await runStep('saved_reflections.isFavorite', async () => {
    if (!(await hasColumn('saved_reflections', 'isFavorite'))) {
      await db.execAsync(
        `ALTER TABLE saved_reflections ADD COLUMN isFavorite INTEGER NOT NULL DEFAULT 0`,
      );
    }
  });

  // 3. content: transliteration
  await runStep('content.transliteration', async () => {
    if (!(await hasColumn('content', 'transliteration'))) {
      console.log('[Migration] Adding transliteration to content...');
      await db.execAsync(`ALTER TABLE content ADD COLUMN transliteration TEXT`);
    }
  });

  // 4. content: audioKey
  await runStep('content.audioKey', async () => {
    if (!(await hasColumn('content', 'audioKey'))) {
      console.log('[Migration] Adding audioKey to content...');
      await db.execAsync(`ALTER TABLE content ADD COLUMN audioKey TEXT`);
    }
  });

  // 5. content: prayerContext
  await runStep('content.prayerContext', async () => {
    if (!(await hasColumn('content', 'prayerContext'))) {
      console.log('[Migration] Adding prayerContext to content...');
      await db.execAsync(`ALTER TABLE content ADD COLUMN prayerContext TEXT`);
    }
  });

  // 6. user_subscription: unlockedBundleIds
  await runStep('user_subscription.unlockedBundleIds', async () => {
    if (!(await hasColumn('user_subscription', 'unlockedBundleIds'))) {
      console.log('[Migration] Adding unlockedBundleIds to user_subscription...');
      await db.execAsync(`ALTER TABLE user_subscription ADD COLUMN unlockedBundleIds TEXT`);
    }
  });

  // 7. content_moods: relevanceScore
  await runStep('content_moods.relevanceScore', async () => {
    if (!(await hasColumn('content_moods', 'relevanceScore'))) {
      console.log('[Migration] Adding relevanceScore to content_moods...');
      await db.execAsync(
        `ALTER TABLE content_moods ADD COLUMN relevanceScore INTEGER NOT NULL DEFAULT 10`,
      );
    }
  });

  // 8. content_angles: actionSource
  await runStep('content_angles.actionSource', async () => {
    if (!(await hasColumn('content_angles', 'actionSource'))) {
      console.log('[Migration] Adding actionSource to content_angles...');
      await db.execAsync(`ALTER TABLE content_angles ADD COLUMN actionSource TEXT`);
    }
  });

  // 9. content_angles: actionHowTo
  await runStep('content_angles.actionHowTo', async () => {
    if (!(await hasColumn('content_angles', 'actionHowTo'))) {
      console.log('[Migration] Adding actionHowTo to content_angles...');
      await db.execAsync(`ALTER TABLE content_angles ADD COLUMN actionHowTo TEXT`);
    }
  });

  // 10. content_angles: actionReward
  await runStep('content_angles.actionReward', async () => {
    if (!(await hasColumn('content_angles', 'actionReward'))) {
      console.log('[Migration] Adding actionReward to content_angles...');
      await db.execAsync(`ALTER TABLE content_angles ADD COLUMN actionReward TEXT`);
    }
  });

  // 11. content_angles: angleSource
  await runStep('content_angles.angleSource', async () => {
    if (!(await hasColumn('content_angles', 'angleSource'))) {
      console.log('[Migration] Adding angleSource to content_angles...');
      await db.execAsync(`ALTER TABLE content_angles ADD COLUMN angleSource TEXT`);
    }
  });

  // 12. content_angles: practiceSteps
  await runStep('content_angles.practiceSteps', async () => {
    if (!(await hasColumn('content_angles', 'practiceSteps'))) {
      console.log('[Migration] Adding practiceSteps to content_angles...');
      await db.execAsync(`ALTER TABLE content_angles ADD COLUMN practiceSteps TEXT`);
    }
  });

  // user_preferences: autoPlayAudio (opt-in recitation auto-play)
  await runStep('user_preferences.autoPlayAudio', async () => {
    if (!(await hasColumn('user_preferences', 'autoPlayAudio'))) {
      console.log('[Migration] Adding autoPlayAudio to user_preferences...');
      await db.execAsync(
        `ALTER TABLE user_preferences ADD COLUMN autoPlayAudio INTEGER NOT NULL DEFAULT 0`,
      );
    }
  });

  // Steps 13 & 14 (bookmarked_verses, quran_cache) are intentionally omitted here.
  // Both tables are declared in tables.ts with CREATE TABLE IF NOT EXISTS and are
  // created by createTables() — which always runs before runMigrationSteps(). A
  // migration step would be dead code on every path (fresh install and upgrade).

  console.log('[Migration] All steps completed successfully');
};
