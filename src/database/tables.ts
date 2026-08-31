import * as SQLite from 'expo-sqlite';

export interface TableDefinition {
  name: string;
  sql: string;
}

export interface IndexDefinition {
  name: string;
  sql: string;
}

const tableDefinitions: TableDefinition[] = [
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
      story TEXT,
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
      lastResetTime INTEGER NOT NULL,
      windowKey TEXT
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
      showTransliteration INTEGER NOT NULL DEFAULT 1,
      autoPlayAudio INTEGER NOT NULL DEFAULT 0,
      asrMadhab TEXT NOT NULL DEFAULT 'standard'
    );`,
  },
  {
    name: 'kv_store',
    sql: `CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`,
  },
  {
    // Verses bookmarked from the Surah Reader screen.
    name: 'bookmarked_verses',
    sql: `CREATE TABLE IF NOT EXISTS bookmarked_verses (
      id TEXT PRIMARY KEY,
      surahNumber INTEGER NOT NULL,
      verseNumber INTEGER NOT NULL,
      arabicText TEXT NOT NULL,
      translation TEXT NOT NULL,
      surahName TEXT NOT NULL,
      bookmarkedAt INTEGER NOT NULL
    );`,
  },
  {
    // Per-surah verse cache from alquran.cloud. JSON blob; a cached surah
    // never expires (see quranService.ts's module doc comment) — only a
    // CACHE_FORMAT_VERSION bump clears it.
    name: 'quran_cache',
    sql: `CREATE TABLE IF NOT EXISTS quran_cache (
      surahNumber INTEGER PRIMARY KEY,
      data TEXT NOT NULL,
      cachedAt INTEGER NOT NULL
    );`,
  },
];

const indexDefinitions: IndexDefinition[] = [
  {
    name: 'idx_user_history_content_angle',
    sql: `CREATE INDEX IF NOT EXISTS idx_user_history_content_angle ON user_history (contentId, angleId);`,
  },
  {
    name: 'idx_user_history_timestamp',
    sql: `CREATE INDEX IF NOT EXISTS idx_user_history_timestamp ON user_history (timestamp);`,
  },
  {
    // Partial index on pending_sync=1 eliminates the full-table scan that
    // syncPendingHistory performs on every online write.
    name: 'idx_user_history_pending_sync',
    sql: `CREATE INDEX IF NOT EXISTS idx_user_history_pending_sync ON user_history (pending_sync) WHERE pending_sync = 1;`,
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

export const createTables = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  console.log('Creating database tables...');
  
  for (const table of tableDefinitions) {
    try {
      await db.execAsync(table.sql);
    } catch (error) {
      console.error(`Error creating table ${table.name}:`, error);
      throw error;
    }
  }
};

export const createIndices = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  console.log('Creating database indices...');
  
  for (const index of indexDefinitions) {
    try {
      await db.execAsync(index.sql);
    } catch (error) {
      console.error(`Error creating index ${index.name}:`, error);
      // Don't throw for indices, just log
    }
  }
};
