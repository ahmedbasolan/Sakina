import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let connectionPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let executionQueue: Promise<void> = Promise.resolve();

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

export const resetConnectionState = (): void => {
  dbInstance = null;
  connectionPromise = null;
  executionQueue = Promise.resolve();
};
