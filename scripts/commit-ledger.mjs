/**
 * Flip mood-pool ledger rows from `drafted` to `committed`.
 *
 * author-angle.mjs marks a row `drafted` the moment the angle lands in
 * quranData.ts. Nothing was moving it on to `committed`, so Hopeful and
 * Grateful still read `drafted` several commits after they were merged — the
 * ledger's own status field was drifting away from the repo it describes.
 *
 * A row is only flipped if its angle is ACTUALLY IN quranData.ts. Trusting the
 * mood argument alone would let a typo mark work committed that was never
 * written, and the ledger is the only place the plan's progress is recorded.
 *
 * The `id: '<angleId>'` lookup uses SINGLE quotes deliberately — that is the
 * file's convention and what verify-journey.mjs's objectAt matches. A
 * JSON.stringify-emitted `id: "..."` would be invisible here too.
 *
 * WHAT THIS DOES NOT DO: check git. `committed` here means "the angle is in the
 * working tree and is going into this commit". Run it as part of the commit,
 * not days later.
 *
 * Usage: node scripts/commit-ledger.mjs <Mood> [<Mood> ...]
 */
import fs from 'fs';

const LEDGER = process.env.MOOD_LEDGER
  || 'docs/superpowers/plans/2026-08-31-mood-pools/ledger.json';
const FILE = 'src/data/quranData.ts';

const fail = (msg) => { console.error(`x ${msg}`); process.exit(1); };

const moods = process.argv.slice(2);
if (!moods.length) fail('usage: node scripts/commit-ledger.mjs <Mood> [<Mood> ...]');

const src = fs.readFileSync(FILE, 'utf8');
const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));

let flipped = 0;
const skipped = [];
for (const row of ledger.units) {
  if (!moods.includes(row.mood)) continue;
  if (row.status !== 'drafted') continue;
  if (!row.angleId) { skipped.push(`${row.mood}/${row.tier}: drafted with no angleId`); continue; }
  if (!src.includes(`id: '${row.angleId}'`)) {
    skipped.push(`${row.angleId}: not found in ${FILE}`);
    continue;
  }
  row.status = 'committed';
  flipped++;
}

if (skipped.length) {
  for (const s of skipped) console.error(`x ${s}`);
  fail(`${skipped.length} row(s) could not be verified — nothing written`);
}

fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + '\n');

const tally = {};
for (const u of ledger.units) {
  tally[u.mood] = tally[u.mood] || {};
  tally[u.mood][u.status] = (tally[u.mood][u.status] || 0) + 1;
}
console.log(`ok — ${flipped} row(s) drafted -> committed`);
for (const [m, t] of Object.entries(tally)) {
  console.log(`   ${m.padEnd(12)} ${Object.entries(t).map(([k, v]) => `${k} ${v}`).join(', ')}`);
}
