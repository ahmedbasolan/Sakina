/**
 * schema.ts — backwards-compatible re-export shim.
 *
 * History: this file was the original monolith containing the DB connection,
 * execution queue, schema DDL, and migrations all in one place. The codebase
 * was then split into connection.ts / tables.ts / migrations.ts / operations.ts,
 * but schema.ts was kept as the import entry-point because ~10 services reference it.
 *
 * Problem that was fixed: schema.ts had its own independent `executionQueue`,
 * completely separate from connection.ts's queue. Any call through schema.ts and
 * any call through operations.ts were not serialized against each other.
 *
 * Fix: schema.ts now re-exports from the canonical modules. All callers continue
 * to `import { dbQuery } from '../database/schema'` without change, but they
 * now share a single execution queue.
 */

// Connection & queue — single source of truth
export { dbQuery, getDatabase } from './connection';

// Database lifecycle operations
export {
  initializeDatabase,
  refreshContentOnly,
  resetDatabase,
  migrateDatabase,
} from './operations';
