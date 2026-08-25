/**
 * Backfills a `transliteration` field onto every entry in VERSE_POOL
 * (src/services/dailyVerseService.ts).
 *
 * Why: the lock screen verse feature offers a transliteration toggle, and the
 * pool had no transliteration data at all. CLAUDE.md forbids writing
 * transliteration from memory, so every line here is fetched from
 * api.alquran.cloud's `en.transliteration` edition — the same source the pool's
 * Arabic and English were verified against.
 *
 * Safety rules this script follows, each of which has burned this repo before:
 *   - Values are emitted in DOUBLE quotes. Transliteration is full of
 *     apostrophes ("tatma'innu", "bizikril laah"), and inserting one into a
 *     single-quoted TS literal terminates the string and breaks the build.
 *   - Nothing is written unless all 52 entries resolve. A partial apply across
 *     a verse pool is worse than an abort.
 *   - Line endings are preserved as found (this file is LF, unlike
 *     quranData.ts / staticPaths.ts which are CRLF).
 *   - Multi-ayah refs (94:5-6, 20:25-26, 103:1-3, 112:1-4) fetch each ayah and
 *     join, so the transliteration covers the same span as the Arabic.
 *
 * Run:  node scripts/backfill-transliteration.mjs
 * Then: npx tsc --noEmit -p tsconfig.json   (catches any quoting damage)
 */

import fs from 'fs';

const FILE = 'src/services/dailyVerseService.ts';
const EDITION = 'en.transliteration';

const original = fs.readFileSync(FILE, 'utf8');
if (original.includes('\r\n')) {
  console.error('File is CRLF but this script assumes LF. Aborting rather than rewriting endings.');
  process.exit(1);
}
if (original.includes('transliteration:')) {
  console.error('VERSE_POOL already has a transliteration field. Aborting to avoid double-insert.');
  process.exit(1);
}

const lines = original.split('\n');

// The Nth `    translation:` line pairs with the Nth `    ref:` line, since each
// pool entry has exactly one of each in that order.
const translationIdx = [];
const refs = [];
lines.forEach((line, i) => {
  if (/^\s{4}translation: /.test(line)) translationIdx.push(i);
  const m = line.match(/^\s{4}ref: '(.+)',$/);
  if (m) refs.push(m[1].replace(/\\'/g, "'"));
});

if (translationIdx.length !== refs.length) {
  console.error(`Mismatch: ${translationIdx.length} translation lines vs ${refs.length} ref lines.`);
  process.exit(1);
}
console.log(`Found ${refs.length} pool entries.`);

/** "Ash-Sharh 94:5-6" -> ["94:5", "94:6"] */
function ayahKeys(ref) {
  const m = ref.match(/(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) throw new Error(`Cannot parse ref: ${ref}`);
  const surah = Number(m[1]);
  const from = Number(m[2]);
  const to = m[3] ? Number(m[3]) : from;
  const out = [];
  for (let a = from; a <= to; a++) out.push(`${surah}:${a}`);
  return out;
}

async function fetchAyah(key) {
  const url = `https://api.alquran.cloud/v1/ayah/${key}/editions/${EDITION}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`);
  const json = await res.json();
  const text = json?.data?.[0]?.text;
  if (!text || typeof text !== 'string') throw new Error(`${key}: no text in response`);
  return text.trim();
}

const results = [];
for (const ref of refs) {
  const keys = ayahKeys(ref);
  const parts = [];
  for (const k of keys) {
    parts.push(await fetchAyah(k));
    await new Promise((r) => setTimeout(r, 120)); // be polite to the API
  }
  const joined = parts.join(' ');
  results.push(joined);
  process.stdout.write(`  ${ref.padEnd(28)} ${keys.length} ayah  ${joined.slice(0, 50)}…\n`);
}

if (results.length !== refs.length || results.some((r) => !r)) {
  console.error('Not every entry resolved. Writing nothing.');
  process.exit(1);
}

// Insert bottom-up so earlier indices stay valid.
const out = [...lines];
for (let i = translationIdx.length - 1; i >= 0; i--) {
  const value = results[i].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  out.splice(translationIdx[i], 0, `    transliteration: "${value}",`);
}

const rewritten = out.join('\n');
const added = (rewritten.match(/^\s{4}transliteration: /gm) || []).length;
if (added !== refs.length) {
  console.error(`Expected ${refs.length} insertions, produced ${added}. Writing nothing.`);
  process.exit(1);
}

fs.writeFileSync(FILE, rewritten, 'utf8');
console.log(`\nDone — inserted ${added} transliteration lines. Run tsc to confirm quoting is intact.`);
