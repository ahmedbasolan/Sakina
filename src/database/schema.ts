import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let connectionPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let executionQueue: Promise<void> = Promise.resolve();
const CURRENT_DB_VERSION = 11; // Increment this to force a content refresh

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) return dbInstance;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    let lastError: any = null;
    const maxRetries = 3;
    const retryDelay = 500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Opening database connection (Attempt ${attempt})...`);
        const db = await SQLite.openDatabaseAsync('islamic_guidance.db');

        // 1. Set busy_timeout IMMEDIATELY.
        // This is the most important guard against "database is locked" errors.
        try {
          await db.execAsync('PRAGMA busy_timeout = 5000;');
          console.log('Database busy_timeout set to 5000ms');
        } catch (e) {
          console.warn('Failed to set busy_timeout:', e);
        }

        // 2. Try to enable WAL mode for better concurrency
        try {
          await db.execAsync('PRAGMA journal_mode = WAL;');
          console.log('Database journal_mode set to WAL');
        } catch (pragmaError) {
          console.warn('Failed to set WAL mode (common during reloads), continuing:', pragmaError);
        }

        dbInstance = db;
        return db;
      } catch (error) {
        lastError = error;
        console.error(`Database open attempt ${attempt} failed:`, error);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    connectionPromise = null;
    throw lastError || new Error('Failed to open database after multiple attempts');
  })();

  return connectionPromise;
};

let dbQueryHeld = false;

/**
 * Executes a database operation within a sequential queue to prevent NPEs
 * and "database is locked" errors during heavy initialization/refresh cycles.
 *
 * IMPORTANT: dbQuery is NOT re-entrant. Never call dbQuery from inside another
 * dbQuery callback — it will throw. If you need nested DB work, pass the `db`
 * handle explicitly through function arguments instead.
 *
 * Rationale: the previous implementation used a global depth counter to allow
 * re-entrancy, but the counter raced across async boundaries and caused the
 * very "database is locked" errors it was meant to prevent. A strict mutex is
 * safer; nested callers are explicit about passing `db` down.
 */
export const dbQuery = async <T>(
  operation: (db: SQLite.SQLiteDatabase) => Promise<T>,
): Promise<T> => {
  if (dbQueryHeld) {
    throw new Error(
      'dbQuery called re-entrantly. Pass the db handle explicitly to nested operations instead of calling dbQuery again.',
    );
  }

  const db = await getDatabase();

  const currentQueue = executionQueue;
  let resolveQueue: () => void;
  executionQueue = new Promise((resolve) => {
    resolveQueue = resolve;
  });

  try {
    await currentQueue;
    dbQueryHeld = true;
    return await operation(db);
  } finally {
    dbQueryHeld = false;
    resolveQueue!();
  }
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

const runMigrationSteps = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // 1. user_history: add pending_sync for offline-write tracking
    //    (0 = synced/guest entry, 1 = written locally while Supabase was unavailable)
    const userHistoryInfo = await db.getAllAsync(`PRAGMA table_info(user_history)`);
    const userHistoryColumns = (userHistoryInfo as any[]) || [];
    if (!userHistoryColumns.some((col) => col.name === 'pending_sync')) {
      console.log('Adding pending_sync to user_history...');
      await db.execAsync(
        `ALTER TABLE user_history ADD COLUMN pending_sync INTEGER NOT NULL DEFAULT 0`,
      );
    }

    // 2. saved_reflections migrations
    const savedReflectionsInfo = await db.getAllAsync(`PRAGMA table_info(saved_reflections)`);
    const savedReflectionsColumns = (savedReflectionsInfo as any[]) || [];

    if (!savedReflectionsColumns.some((col) => col.name === 'isFavorite')) {
      await db.execAsync(
        `ALTER TABLE saved_reflections ADD COLUMN isFavorite INTEGER NOT NULL DEFAULT 0`,
      );
    }


    // 3. content migrations
    const contentInfo = await db.getAllAsync(`PRAGMA table_info(content)`);
    const contentColumns = (contentInfo as any[]) || [];
    if (!contentColumns.some((col) => col.name === 'transliteration')) {
      console.log('Adding transliteration to content...');
      await db.execAsync(`ALTER TABLE content ADD COLUMN transliteration TEXT`);
    }
    if (!contentColumns.some((col) => col.name === 'audioKey')) {
      console.log('Adding audioKey to content...');
      await db.execAsync(`ALTER TABLE content ADD COLUMN audioKey TEXT`);
    }
    if (!contentColumns.some((col) => col.name === 'prayerContext')) {
      console.log('Adding prayerContext to content...');
      await db.execAsync(`ALTER TABLE content ADD COLUMN prayerContext TEXT`);
    }

    // 4. user_subscription migrations
    const userSubscriptionInfo = await db.getAllAsync(`PRAGMA table_info(user_subscription)`);
    const userSubscriptionColumns = (userSubscriptionInfo as any[]) || [];
    if (!userSubscriptionColumns.some((col) => col.name === 'unlockedBundleIds')) {
      console.log('Adding unlockedBundleIds to user_subscription...');
      await db.execAsync(`ALTER TABLE user_subscription ADD COLUMN unlockedBundleIds TEXT`);
    }
    // 5. content_moods migrations
    const contentMoodsInfo = await db.getAllAsync(`PRAGMA table_info(content_moods)`);
    const contentMoodsColumns = (contentMoodsInfo as any[]) || [];
    if (!contentMoodsColumns.some((col) => col.name === 'relevanceScore')) {
      console.log('Adding relevanceScore to content_moods...');
      await db.execAsync(
        `ALTER TABLE content_moods ADD COLUMN relevanceScore INTEGER NOT NULL DEFAULT 10`,
      );
    }

    // 6. content_angles migrations
    const contentAnglesInfo = await db.getAllAsync(`PRAGMA table_info(content_angles)`);
    const contentAnglesColumns = (contentAnglesInfo as any[]) || [];
    if (!contentAnglesColumns.some((col) => col.name === 'actionSource')) {
      console.log('Adding actionSource to content_angles...');
      await db.execAsync(`ALTER TABLE content_angles ADD COLUMN actionSource TEXT`);
    }
    if (!contentAnglesColumns.some((col) => col.name === 'actionHowTo')) {
      console.log('Adding actionHowTo to content_angles...');
      await db.execAsync(`ALTER TABLE content_angles ADD COLUMN actionHowTo TEXT`);
    }
    if (!contentAnglesColumns.some((col) => col.name === 'actionReward')) {
      console.log('Adding actionReward to content_angles...');
      await db.execAsync(`ALTER TABLE content_angles ADD COLUMN actionReward TEXT`);
    }
    if (!contentAnglesColumns.some((col) => col.name === 'angleSource')) {
      console.log('Adding angleSource to content_angles...');
      await db.execAsync(`ALTER TABLE content_angles ADD COLUMN angleSource TEXT`);
    }
    if (!contentAnglesColumns.some((col) => col.name === 'practiceSteps')) {
      console.log('Adding practiceSteps to content_angles...');
      await db.execAsync(`ALTER TABLE content_angles ADD COLUMN practiceSteps TEXT`);
    }

    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Error during database migration:', error);
    console.log('Continuing without migration...');
  }
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
  });
};

const runInitializationSteps = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  console.log('Initializing database tables...');

  // Create tables individually for better stability and error reporting
  const tables = [
    {
      name: 'content',
      sql: `CREATE TABLE IF NOT EXISTS content (
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
      );`,
    },
    {
      name: 'content_angles',
      sql: `CREATE TABLE IF NOT EXISTS content_angles (
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
      );`,
    },
    {
      name: 'content_moods',
      sql: `CREATE TABLE IF NOT EXISTS content_moods (
        contentId TEXT NOT NULL,
        mood TEXT NOT NULL,
        relevanceScore INTEGER NOT NULL DEFAULT 10,
        PRIMARY KEY (contentId, mood),
        FOREIGN KEY (contentId) REFERENCES content (id)
      );`,
    },
    {
      name: 'user_history',
      sql: `CREATE TABLE IF NOT EXISTS user_history (
        id TEXT PRIMARY KEY,
        contentId TEXT NOT NULL,
        angleId TEXT NOT NULL,
        mood TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        pending_sync INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (contentId) REFERENCES content (id),
        FOREIGN KEY (angleId) REFERENCES content_angles (id)
      );`,
    },
    {
      name: 'saved_reflections',
      sql: `CREATE TABLE IF NOT EXISTS saved_reflections (
        id TEXT PRIMARY KEY,
        contentId TEXT NOT NULL,
        angleId TEXT NOT NULL,
        mood TEXT NOT NULL,
        reflection TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        isFavorite INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (contentId) REFERENCES content (id),
        FOREIGN KEY (angleId) REFERENCES content_angles (id)
      );`,
    },
    {
      // Free-form journal reflections (no link to content/angles).
      // Used by ReflectionHistoryScreen's "Write a new reflection" flow.
      name: 'reflections',
      sql: `CREATE TABLE IF NOT EXISTS reflections (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT NOT NULL,
        mood TEXT,
        createdAt INTEGER NOT NULL
      );`,
    },
    {
      name: 'user_sessions',
      sql: `CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        guidanceSessionsUsed INTEGER NOT NULL DEFAULT 0,
        nextRefreshesRemaining INTEGER NOT NULL DEFAULT 3,
        lastResetTime INTEGER NOT NULL
      );`,
    },
    {
      name: 'user_subscription',
      sql: `CREATE TABLE IF NOT EXISTS user_subscription (
        id TEXT PRIMARY KEY DEFAULT 'user_subscription',
        tier TEXT NOT NULL DEFAULT 'free',
        type TEXT,
        trialEndDate INTEGER,
        subscriptionEndDate INTEGER,
        isActive INTEGER NOT NULL DEFAULT 0,
        willRenew INTEGER NOT NULL DEFAULT 0,
        unlockedBundleIds TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );`,
    },
    {
      name: 'collections',
      sql: `CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        itemCount INTEGER NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );`,
    },
    {
      name: 'spiritual_paths',
      sql: `CREATE TABLE IF NOT EXISTS spiritual_paths (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        duration INTEGER NOT NULL,
        theme TEXT NOT NULL,
        target TEXT NOT NULL
      );`,
    },
    {
      name: 'path_steps',
      sql: `CREATE TABLE IF NOT EXISTS path_steps (
        id TEXT PRIMARY KEY,
        pathId TEXT NOT NULL,
        day INTEGER NOT NULL,
        title TEXT NOT NULL,
        focus TEXT NOT NULL,
        contentId TEXT NOT NULL,
        angleId TEXT NOT NULL,
        FOREIGN KEY (pathId) REFERENCES spiritual_paths (id),
        FOREIGN KEY (contentId) REFERENCES content (id),
        FOREIGN KEY (angleId) REFERENCES content_angles (id)
      );`,
    },
    {
      name: 'user_path_progress',
      sql: `CREATE TABLE IF NOT EXISTS user_path_progress (
        id TEXT PRIMARY KEY,
        pathId TEXT NOT NULL,
        currentDay INTEGER NOT NULL DEFAULT 1,
        startDate INTEGER NOT NULL,
        completedDays TEXT,
        isCompleted INTEGER NOT NULL DEFAULT 0,
        completedAt INTEGER,
        FOREIGN KEY (pathId) REFERENCES spiritual_paths (id)
      );`,
    },
    {
      name: 'audio_content',
      sql: `CREATE TABLE IF NOT EXISTS audio_content (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        contentId TEXT NOT NULL,
        audioUrl TEXT NOT NULL,
        reciter TEXT NOT NULL,
        duration INTEGER NOT NULL,
        arabicText TEXT NOT NULL,
        translation TEXT,
        FOREIGN KEY (contentId) REFERENCES content (id)
      );`,
    },
    {
      name: 'user_preferences',
      sql: `CREATE TABLE IF NOT EXISTS user_preferences (
        id TEXT PRIMARY KEY DEFAULT 'user_preferences',
        primaryLanguage TEXT NOT NULL DEFAULT 'english',
        showTransliteration INTEGER NOT NULL DEFAULT 1
      );`,
    },
    {
      name: 'kv_store',
      sql: `CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );`,
    },
  ];

  for (const table of tables) {
    try {
      await db.execAsync(table.sql);
    } catch (error) {
      console.error(`Error creating table ${table.name}:`, error);
      throw error;
    }
  }

  // Create indices individually
  const indices = [
    {
      name: 'idx_user_history_content_angle',
      sql: `CREATE INDEX IF NOT EXISTS idx_user_history_content_angle ON user_history (contentId, angleId);`,
    },
    {
      name: 'idx_user_history_timestamp',
      sql: `CREATE INDEX IF NOT EXISTS idx_user_history_timestamp ON user_history (timestamp);`,
    },
    {
      name: 'idx_content_angles_mood',
      sql: `CREATE INDEX IF NOT EXISTS idx_content_angles_mood ON content_angles (mood);`,
    },
    {
      name: 'idx_content_moods_mood',
      sql: `CREATE INDEX IF NOT EXISTS idx_content_moods_mood ON content_moods (mood);`,
    },
    {
      name: 'idx_user_sessions_date',
      sql: `CREATE INDEX IF NOT EXISTS idx_user_sessions_date ON user_sessions (date);`,
    },
    {
      name: 'idx_path_steps_pathId',
      sql: `CREATE INDEX IF NOT EXISTS idx_path_steps_pathId ON path_steps (pathId);`,
    },
    {
      name: 'idx_user_path_progress_pathId',
      sql: `CREATE INDEX IF NOT EXISTS idx_user_path_progress_pathId ON user_path_progress (pathId);`,
    },
    {
      name: 'idx_reflections_createdAt',
      sql: `CREATE INDEX IF NOT EXISTS idx_reflections_createdAt ON reflections (createdAt);`,
    },
  ];

  for (const index of indices) {
    try {
      await db.execAsync(index.sql);
    } catch (error) {
      console.error(`Error creating index ${index.name}:`, error);
      // Don't throw for indices, just log
    }
  }

  // Run migrations to handle schema updates
  await runMigrationSteps(db);



};
