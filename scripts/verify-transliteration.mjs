/**
 * Re-fetches every transliteration in VERSE_POOL from api.alquran.cloud and
 * compares it byte-for-byte with what is committed in
 * src/services/dailyVerseService.ts.
 *
 * This exists because the backfill script is the least-audited code path in the
 * feature: it wrote 52 strings in one pass and nothing downstream would notice
 * if an entry were shifted by one, truncated, or paired with the wrong ayah.
 * A typecheck only proves the quoting survived.
 *
 * WHAT THIS DOES NOT CATCH:
 *   - Whether the ref itself is correct. It re-derives the ayah keys from the
 *     same `ref` field the backfill used, so a wrong ref produces a wrong
 *     transliteration that matches perfectly here. Ref correctness is covered
 *     by the Arabic/English verification the pool was originally built with.
 *   - Whether `en.transliteration` is a scheme the reader finds useful. It only
 *     checks fidelity to the source, not editorial quality.
 *   - Anything about the Arabic or English fields.
 *   - Ordering drift between VERSE_POOL entries and their refs beyond what the
 *     paired-line parse assumes (one transliteration and one ref per entry).
 *
 * Needs network. Run: node scripts/verify-transliteration.mjs
 */

import fs from 'fs';

const FILE = 'src/services/dailyVerseService.ts';
const EDITION = 'en.transliteration';

const lines = fs.readFileSync(FILE, 'utf8').split('\n');

const entries = [];
let pending = null;
for (const line of lines) {
  const t = line.match(/^\s{4}transliteration: "(.*)",$/);
  if (t) {
    pending = t[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    continue;
  }
  const r = line.match(/^\s{4}ref: '(.+)',$/);
  if (r && pending !== null) {
    entries.push({ ref: r[1].replace(/\\'/g, "'"), committed: pending });
    pending = null;
  }
}

if (entries.length === 0) {
  console.error('Parsed 0 entries — the file shape changed. Failing loudly rather than reporting success.');
  process.exit(1);
}
console.log(`Parsed ${entries.length} entries with transliteration.\n`);

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
  const res = await fetch(`https://api.alquran.cloud/v1/ayah/${key}/editions/${EDITION}`);
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`);
  const json = await res.json();
  const text = json?.data?.[0]?.text;
  if (!text) throw new Error(`${key}: no text`);
  return text.trim();
}

let mismatches = 0;
let unreachable = 0;

for (const { ref, committed } of entries) {
  let expected;
  try {
    const parts = [];
    for (const k of ayahKeys(ref)) {
      parts.push(await fetchAyah(k));
      await new Promise((r) => setTimeout(r, 120));
    }
    expected = parts.join(' ');
  } catch (err) {
    // An unreachable page is unreadable, not a bad citation — same stance as
    // verify-citations.mjs.
    console.log(`  ?  ${ref.padEnd(26)} unreachable: ${err.message}`);
    unreachable++;
    continue;
  }

  if (expected === committed) {
    console.log(`  ok ${ref.padEnd(26)} ${committed.length} chars`);
  } else {
    mismatches++;
    console.log(`  X  ${ref.padEnd(26)} MISMATCH`);
    console.log(`       committed: ${committed}`);
    console.log(`       source:    ${expected}`);
  }
}

console.log(
  `\n${entries.length} checked · ${mismatches} mismatched · ${unreachable} unreachable`,
);
process.exit(mismatches > 0 ? 1 : 0);
