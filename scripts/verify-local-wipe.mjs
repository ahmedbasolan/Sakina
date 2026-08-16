/**
 * Local user-data wipe verifier — see CLAUDE.md § "Account deletion".
 *
 * Builds a real SQLite database from the app's own DDL (src/database/tables.ts),
 * populates every table, replays the statements `clearAllLocalUserData()` issues,
 * and asserts that the personal tables are empty while seeded content and device
 * preferences survive.
 *
 * The wipe list is READ OUT OF src/database/operations.ts rather than restated
 * here, so this tests the shipped function and not a copy of it that drifts.
 *
 * Run:      node scripts/verify-local-wipe.mjs
 * Negative: NO_WIPE=1 node scripts/verify-local-wipe.mjs
 *
 * Like verify-journey-roundtrip's RT_INJECT, the negative mode exits 0 only when
 * the assertions actually FAILED — proving they can detect a missing wipe. Both
 * modes exiting 0 is the green state. A checker that has only ever passed is
 * untested; this is what stops it silently becoming a no-op.
 *
 * What this does NOT catch, so a green run is not read as more than it is:
 *  - That anything CALLS clearAllLocalUserData. It replays extracted SQL; the
 *    wiring in AuthService.deleteAccount and SupabaseDataService's foreign-data
 *    branch is covered by src/services/__tests__/localDataOwnership.test.ts.
 *  - A bug in the surrounding dbQuery/withTransactionAsync wrapping — only the
 *    statements inside it are replayed.
 *  - A NEW personal table added to tables.ts but omitted from both the wipe and
 *    the PERSONAL list below. The subset assertion catches an omission from the
 *    wipe, not an omission from both. Add new personal tables to PERSONAL.
 *  - AsyncStorage, which holds no personal content today (see the docstring on
 *    clearAllLocalUserData).
 */
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

const NEGATIVE = process.env.NO_WIPE === '1';
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

// ── Extract the real DDL ────────────────────────────────────────────────────
const tablesSrc = fs.readFileSync('src/database/tables.ts', 'utf8');
const ddl = [...tablesSrc.matchAll(/CREATE TABLE IF NOT EXISTS[\s\S]*?\);/g)].map((m) => m[0]);
if (ddl.length < 15) {
  fail(`FAIL: expected the full table set from tables.ts, extracted ${ddl.length}`);
}

// ── Extract the wipe list from the shipped function ─────────────────────────
const opsSrc = fs.readFileSync('src/database/operations.ts', 'utf8');
const fnMatch = opsSrc.match(/export const clearAllLocalUserData[\s\S]*?\n};/);
if (!fnMatch) fail('FAIL: clearAllLocalUserData not found in operations.ts');
const fnBody = fnMatch[0];

const arrayBlock = fnBody.match(/for \(const table of \[([\s\S]*?)\]\)/);
if (!arrayBlock) fail('FAIL: could not read the wipe table list');
const WIPED = [...arrayBlock[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
if (WIPED.length === 0) fail('FAIL: wipe table list matched but yielded no tables');

// Matches both the single-key (`key = ?`) and multi-key (`key IN (?, ?)`) forms.
const kvBlock = fnBody.match(/DELETE FROM kv_store WHERE key[^']*',\s*\[([\s\S]*?)\]/);
if (!kvBlock) fail('FAIL: could not read the kv_store keys being deleted');
const WIPED_KV_KEYS = [...kvBlock[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
// LOCAL_DATA_OWNER_KEY is referenced by constant name, not literal — resolve it.
if (/LOCAL_DATA_OWNER_KEY/.test(kvBlock[1])) {
  const c = opsSrc.match(/LOCAL_DATA_OWNER_KEY\s*=\s*'([a-z_]+)'/);
  if (!c) fail('FAIL: LOCAL_DATA_OWNER_KEY referenced but its value could not be resolved');
  WIPED_KV_KEYS.push(c[1]);
}
if (WIPED_KV_KEYS.length === 0) fail('FAIL: kv_store delete matched but yielded no keys');

console.log(`wipe list (${WIPED.length}): ${WIPED.join(', ')}`);
console.log(`kv_store keys (${WIPED_KV_KEYS.length}): ${WIPED_KV_KEYS.join(', ')}\n`);

// The owner marker must be cleared: leaving it behind after a delete would keep
// the device claimed by an account that no longer exists, so the next sign-in
// would wipe genuine guest data instead of migrating it.
if (!WIPED_KV_KEYS.includes('local_data_owner')) {
  fail("FAIL: 'local_data_owner' is not cleared by clearAllLocalUserData");
}

// ── Build the DB and populate every table ───────────────────────────────────
const db = new DatabaseSync(':memory:');
// node:sqlite enforces FKs by default; the fixture inserts placeholder ids into
// every table independently. Safe to disable — clearAllLocalUserData only
// deletes from child/leaf tables, never a parent, so it has no ordering hazard
// under either setting.
db.exec('PRAGMA foreign_keys = OFF');
for (const stmt of ddl) db.exec(stmt);

const allTables = db
  .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
  .all()
  .map((r) => r.name);

// One row per table, built from the table's own column list so this keeps
// working when a column is added.
for (const t of allTables) {
  const cols = db.prepare(`PRAGMA table_info(${t})`).all();
  const names = cols.map((c) => c.name);
  const values = cols.map((c) => {
    if (t === 'kv_store' && c.name === 'key') return WIPED_KV_KEYS[0];
    return /INT|REAL/i.test(c.type) ? 1 : `x_${c.name}`;
  });
  db.prepare(
    `INSERT INTO ${t} (${names.join(',')}) VALUES (${names.map(() => '?').join(',')})`,
  ).run(...values);
}
// Remaining wiped kv keys, plus the content-cache key that must SURVIVE.
for (const k of WIPED_KV_KEYS.slice(1)) {
  db.prepare('INSERT INTO kv_store (key, value) VALUES (?, ?)').run(k, 'x');
}
db.prepare('INSERT INTO kv_store (key, value) VALUES (?, ?)').run('quran_cache_format_version', '4');

for (const t of allTables) {
  const n = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  if (n < 1) fail(`FAIL: setup did not populate ${t}`);
}

// ── Apply the wipe (unless running the negative test) ───────────────────────
if (NEGATIVE) {
  console.log('NO_WIPE=1 — simulating pre-fix behaviour (no deletes applied)\n');
} else {
  for (const t of WIPED) db.exec(`DELETE FROM ${t}`);
  for (const k of WIPED_KV_KEYS) db.prepare('DELETE FROM kv_store WHERE key = ?').run(k);
}

// ── Assertions ──────────────────────────────────────────────────────────────
const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;

// Personal data the user created or that records their behaviour. Every entry
// must appear in the shipped wipe list; add new personal tables here too.
const PERSONAL = [
  'user_history',
  'saved_reflections',
  'reflections',
  'user_path_progress',
  'bookmarked_verses',
  'user_sessions',
  'user_subscription',
];
// Seeded app content and device config, identical for every user.
const MUST_SURVIVE = [
  'content',
  'content_angles',
  'content_moods',
  'spiritual_paths',
  'path_steps',
  'audio_content',
  'quran_cache',
  'user_preferences',
];

const failures = [];

for (const t of PERSONAL) {
  if (!allTables.includes(t)) failures.push(`${t}: table missing from DDL entirely`);
  else if (count(t) !== 0) failures.push(`${t}: still holds ${count(t)} row(s) after deletion`);
  if (!WIPED.includes(t)) failures.push(`${t}: personal table absent from clearAllLocalUserData`);
}
for (const t of MUST_SURVIVE) {
  if (count(t) === 0) failures.push(`${t}: content/config table was wiped and must not be`);
}

const kvKeys = db.prepare('SELECT key FROM kv_store ORDER BY key').all().map((r) => r.key);
for (const k of WIPED_KV_KEYS) {
  if (kvKeys.includes(k)) failures.push(`kv_store: '${k}' survived`);
}
if (!kvKeys.includes('quran_cache_format_version')) {
  failures.push('kv_store: content-cache version key was wiped and must not be');
}

// ── Report ──────────────────────────────────────────────────────────────────
if (NEGATIVE) {
  if (failures.length === 0) {
    fail(
      'FAIL: negative mode detected nothing. The assertions pass even with no wipe\n' +
        '      applied, so they would not have caught the original bug either.',
    );
  }
  console.log(`PASSED (negative) — caught ${failures.length} fault(s) with the wipe removed:`);
  for (const f of failures) console.log('  - ' + f);
  process.exit(0);
}

if (failures.length) {
  console.error('FAILED:');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('PASSED — personal tables emptied, seeded content and preferences intact.');
