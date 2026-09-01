/**
 * Ledger generator for the mood-pool expansion.
 *
 * Emits docs/superpowers/plans/2026-08-31-mood-pools/ledger.json — one row per
 * unit of work — by DERIVING the candidate lists from quranData.ts rather than
 * embedding them, so the ledger cannot disagree with the corpus.
 *
 * Three things here each correspond to a mistake already made once:
 *
 *   1. The field reader is quote-agnostic and follows `'a' + 'b'`
 *      concatenation. Sources whose surah name contains an apostrophe are
 *      DOUBLE quoted ("Surah Al-A'raf 7:199"); a single-quote matcher returns
 *      null for 31 of them, and null then compares equal to null, reporting
 *      all 31 as mutual duplicates and wrongly excluding quran_23_1,
 *      quran_6_13 and quran_7_31 from Calm.
 *   2. Duplicate exclusion is by identical `source` string, SKIPPING entries
 *      whose source could not be read. Exactly four ids are expected.
 *   3. Every generated angle id is asserted not to exist already. quran_8_2
 *      and quran_20_132 collided once when a journey added ids that were
 *      already present, which would have put two entries under one id into
 *      the seeder.
 *
 * WHAT THIS DOES NOT DO: choose which verses fill the T2 and T3 slots. It
 * counts them and leaves the rows unassigned, because that is a mood-fit
 * judgement and a citation fetch, not arithmetic.
 *
 * Run: node scripts/seed-ledger.mjs
 */
import fs from 'fs';
import path from 'path';
import { objects as libObjects, field } from './lib/quranDataParse.mjs';

const TARGET = 40;
const OUT = 'docs/superpowers/plans/2026-08-31-mood-pools/ledger.json';

const src = fs.readFileSync('src/data/quranData.ts', 'utf8');
const repo = fs.readFileSync('src/services/contentRepository.ts', 'utf8');
const moodPools = fs.readFileSync('scripts/verify-mood-pools.mjs', 'utf8');
const typesSrc = fs.readFileSync('src/types/index.ts', 'utf8');
const objects = (prefix) => libObjects(src, prefix);

const PREFIXES = JSON.parse(
  (repo.match(/JOURNEY_ANGLE_PREFIXES = (\[[^\]]*\])/) || [, '[]'])[1].replace(/'/g, '"'),
);

// Never retype this list — read it from src/types/index.ts's Mood union, the
// same discipline JOURNEY_ANGLE_PREFIXES above already gets.
const moodUnionSrc = (typesSrc.match(/export type Mood =[\s\S]*?;/) || [''])[0];
const MOODS = [...moodUnionSrc.matchAll(/'([A-Za-z]+)'/g)].map((m) => m[1]);
if (!MOODS.length) { console.error('x could not parse the Mood union from src/types/index.ts'); process.exit(1); }

// verify-mood-pools.mjs's SUFFIX_MOOD is suffix -> mood and can be many-to-one
// (Overwhelmed has anxious+stressed; Hopeful has energized+hopeful; Grateful
// has grateful+content) — a new angle's authoring suffix must round-trip
// through it or verify-mood-pools.mjs reports the angle as suffix drift. This
// used to be a hand-maintained inverse table with its own comment admitting
// the risk of the two tables disagreeing; it is now derived: for each mood,
// take every suffix SUFFIX_MOOD maps to it and pick whichever one already has
// the most angles in the corpus — the tie-break a human made by hand when
// this table was first written (anxious over stressed, hopeful over
// energized, grateful over content; verified 27>20, 25>15, 26>14).
const suffixMoodSrc = (moodPools.match(/const SUFFIX_MOOD = \{[\s\S]*?\};/) || [''])[0];
if (!suffixMoodSrc) { console.error('x could not find SUFFIX_MOOD in scripts/verify-mood-pools.mjs'); process.exit(1); }
const suffixToMood = Object.fromEntries(
  [...suffixMoodSrc.matchAll(/(\w+):\s*'([A-Za-z]+)'/g)].map((m) => [m[1], m[2]]),
);
const suffixUsage = {};
for (const a of objects('q_angle_')) {
  const m = a.id.match(/_([a-z]+)(?:_angle)?$/);
  if (m) suffixUsage[m[1]] = (suffixUsage[m[1]] || 0) + 1;
}
const MOOD_SUFFIX = {};
for (const [suffix, mood] of Object.entries(suffixToMood)) {
  const usage = suffixUsage[suffix] || 0;
  if (!(mood in MOOD_SUFFIX) || usage > (suffixUsage[MOOD_SUFFIX[mood]] || 0)) MOOD_SUFFIX[mood] = suffix;
}
for (const m of MOODS) {
  if (!MOOD_SUFFIX[m]) { console.error(`x no authoring suffix found for mood '${m}' in SUFFIX_MOOD`); process.exit(1); }
}

const fail = (msg) => { console.error(`x ${msg}`); process.exit(1); };

// ── corpus ────────────────────────────────────────────────────────────────
const verses = objects('quran_').map((c) => ({
  id: c.id,
  source: field(c.body, 'source'),
  moods: (c.body.match(/moods: \[([^\]]*)\]/) || [, ''])[1]
    .split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean),
}));

const unreadable = verses.filter((v) => !v.source);
if (unreadable.length) {
  fail(`${unreadable.length} verse(s) have an unreadable source — the field reader is wrong, ` +
       `not the data: ${unreadable.slice(0, 5).map((v) => v.id).join(', ')}`);
}

const isJourney = (id) => PREFIXES.some((p) => id.startsWith(`q_angle_${p}_`));
const allAngleIds = new Set(objects('q_angle_').map((a) => a.id));
const angles = objects('q_angle_')
  .filter((a) => !isJourney(a.id))
  .map((a) => ({ id: a.id, contentId: field(a.body, 'contentId'), mood: field(a.body, 'mood') }));

// ── duplicate verses, by identical source ─────────────────────────────────
const bySource = {};
for (const v of verses) (bySource[v.source] ||= []).push(v.id);
const dupes = new Set();
const dupePairs = [];
for (const [s, ids] of Object.entries(bySource)) {
  if (ids.length < 2) continue;
  dupePairs.push(`${s}: ${ids.join(' = ')}`);
  for (const id of ids.slice(1)) dupes.add(id);
}
if (dupes.size !== 4) {
  fail(`expected exactly 4 duplicate-source ids, found ${dupes.size}: ${[...dupes].join(', ')}\n` +
       `  If this rose to ~31, the field reader lost its double-quote handling.`);
}

// ── pools and candidates ──────────────────────────────────────────────────
const pool = Object.fromEntries(MOODS.map((m) => [m, 0]));
for (const a of angles) if (pool[a.mood] !== undefined) pool[a.mood]++;

const T3_SHARE = 0.6; // remaining slots that need a brand-new ayah
const units = [];
const rows = [];

for (const m of MOODS) {
  const need = Math.max(0, TARGET - pool[m]);
  const candidates = verses.filter((v) =>
    v.moods.includes(m) &&
    !dupes.has(v.id) &&
    !angles.some((a) => a.contentId === v.id && a.mood === m));

  const t1Used = Math.min(candidates.length, need);
  const remaining = need - t1Used;
  const t3 = Math.round(remaining * T3_SHARE);
  const t2 = remaining - t3;

  rows.push({ m, pool: pool[m], need, avail: candidates.length, t1Used, t2, t3 });

  for (const v of candidates.slice(0, t1Used)) {
    const angleId = `q_angle_${v.id.replace(/^quran_/, '')}_${MOOD_SUFFIX[m]}`;
    if (allAngleIds.has(angleId)) {
      fail(`generated angle id ${angleId} already exists — see note 3 in the header`);
    }
    units.push({ angleId, contentId: v.id, mood: m, tier: 'T1', status: 'pending', citations: [] });
  }
  for (let i = 0; i < t2; i++)
    units.push({ angleId: null, contentId: null, mood: m, tier: 'T2', status: 'pending', citations: [] });
  for (let i = 0; i < t3; i++)
    units.push({ angleId: null, contentId: null, mood: m, tier: 'T3', status: 'pending', citations: [] });
}

// ── report ────────────────────────────────────────────────────────────────
console.log('duplicate-source verses (excluded from T1):');
for (const p of dupePairs) console.log(`  ${p}`);

console.log('\nmood          pool  need  T1avail  T1used  T2  T3');
let tNeed = 0, tT1 = 0, tT2 = 0, tT3 = 0;
for (const r of rows) {
  tNeed += r.need; tT1 += r.t1Used; tT2 += r.t2; tT3 += r.t3;
  console.log(
    `  ${r.m.padEnd(12)}${String(r.pool).padStart(4)}${String(r.need).padStart(6)}` +
    `${String(r.avail).padStart(9)}${String(r.t1Used).padStart(8)}` +
    `${String(r.t2).padStart(4)}${String(r.t3).padStart(4)}`);
}
console.log(`  ${'TOTAL'.padEnd(12)}${''.padStart(4)}${String(tNeed).padStart(6)}` +
  `${''.padStart(9)}${String(tT1).padStart(8)}${String(tT2).padStart(4)}${String(tT3).padStart(4)}`);

if (tT1 + tT2 + tT3 !== tNeed) {
  fail(`unit rows (${tT1 + tT2 + tT3}) do not sum to the need (${tNeed})`);
}
if (units.length !== tNeed) {
  fail(`emitted ${units.length} rows for a need of ${tNeed}`);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({
  generatedAt: new Date().toISOString().slice(0, 10),
  target: TARGET,
  totalUnits: units.length,
  note: 'T2 and T3 rows are intentionally unassigned — which verse fills them is a ' +
        'mood-fit judgement and a citation fetch, not arithmetic. A tick assigns ' +
        'contentId and angleId when it picks one up.',
  units,
}, null, 2) + '\n');

console.log(`\nWrote ${units.length} units to ${OUT}`);
