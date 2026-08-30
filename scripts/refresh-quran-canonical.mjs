#!/usr/bin/env node
/**
 * Regenerate src/data/canonical/quranArabicCanonical.json.
 *
 *   node scripts/refresh-quran-canonical.mjs
 *
 * Needs network. Run it whenever a verse is ADDED to src/data/quranData.ts,
 * then run `npx jest quranArabicIntegrity` and read what it says.
 *
 * WHAT THIS SCRIPT DOES: fetch, and nothing else. For every audioKey in
 * quranData.ts it records two strings —
 *   arabic : this repo's own current arabicText, byte for byte
 *   remote : quran.com api/v4 text_uthmani for the same ayah range
 * — and writes them to the snapshot. It makes NO judgement about whether they
 * agree. All comparison lives in src/__tests__/quranArabicIntegrity.test.ts so
 * that exactly one implementation of the skeleton normalizer exists; a second
 * copy here would drift from it and quietly disagree.
 *
 * WHY `arabic` IS SNAPSHOTTED FROM OUR OWN DATA rather than from quran.com:
 * this corpus is a richer Uthmani edition (ikhfa/iqlab meem marks, ayah
 * ornaments, tatweel) than quran.com serves. Rewriting our text to match
 * quran.com would STRIP those marks from the Qur'an — measured at 111+
 * occurrences across the corpus. The snapshot is therefore a lock against
 * future drift, not an assertion that quran.com is more correct than us.
 *
 * WHAT THIS DOES NOT DO:
 *   · It does not verify the ENGLISH translation. This app deliberately
 *     smooths translator brackets and writes "Allah" for "Allāh"; only 1 of
 *     155 entries matches raw Sahih International, so an automated English
 *     check here would be 154 false alarms. English stays a human review job.
 *   · It never edits quranData.ts. There is no --fix mode, on purpose.
 *   · It cannot tell you a verse is the WRONG CHOICE for its slot, only that
 *     the text is the ayah its audioKey names.
 */

import fs from 'fs';
import path from 'path';

const DATA = 'src/data/quranData.ts';
const OUT = 'src/data/canonical/quranArabicCanonical.json';
const API = 'https://api.quran.com/api/v4/verses/by_key';

const src = fs.readFileSync(DATA, 'utf8');

/**
 * Split the file into top-level object blocks, then read fields out of each
 * block individually.
 *
 * The obvious approach — one regex pairing `arabicText: '…'` with the
 * `audioKey: '…'` that follows within N characters — is WRONG and fails
 * silently. Any window large enough for Ayat al-Kursi (2:255, ~400 chars of
 * Arabic plus a transliteration and a long translation between the two
 * fields) is also large enough to reach into the NEXT object for short
 * entries. A 900-char window dropped exactly the 13 longest verses in the
 * corpus, and dropping a verse removes it from the test rather than failing
 * it. Parse structurally.
 *
 * Brace counting must ignore braces inside string literals, and this file's
 * prose contains both quote styles and escaped apostrophes (Allah\'s).
 *
 * It must ALSO skip comments. A line comment such as `// Ibn Abbas's view`
 * contains a lone apostrophe; treating it as a string opener swallows
 * everything up to the next apostrophe in the file, merges the objects in
 * between, and makes whole verses vanish from the snapshot — which shows up as
 * a *missing* verse, never as a parse error. Five verses were lost this way.
 */
function objectBlocks(text) {
  const blocks = [];
  let depth = 0;
  let start = -1;
  let quote = null; // "'" | '"' | '`' | null
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    // comments first — they can contain quote characters
    if (c === '/' && next === '/') {
      const nl = text.indexOf('\n', i);
      i = nl === -1 ? text.length : nl;
      continue;
    }
    if (c === '/' && next === '*') {
      const close = text.indexOf('*/', i + 2);
      i = close === -1 ? text.length : close + 1;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '{') { if (depth === 0) start = i; depth++; continue; }
    if (c === '}') {
      depth--;
      if (depth === 0 && start >= 0) { blocks.push(text.slice(start, i + 1)); start = -1; }
      if (depth < 0) depth = 0;
    }
  }
  return blocks;
}

/** Read a single-line-or-wrapped string field, either quote style. */
function field(block, name) {
  const single = block.match(new RegExp(`${name}:\\s*\\n?\\s*'((?:[^'\\\\]|\\\\.)*)'`));
  if (single) return single[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  const double = block.match(new RegExp(`${name}:\\s*\\n?\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  if (double) return double[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  return null;
}

const blocks = objectBlocks(src);
const entries = [];
const seen = new Map(); // audioKey -> first entry seen, for the duplicate report
let withArabicNoKey = 0;

for (const block of blocks) {
  const id = field(block, 'id');
  const arabic = field(block, 'arabicText');
  const audioKey = field(block, 'audioKey');
  if (!arabic) continue;
  if (!audioKey) { withArabicNoKey++; continue; }
  if (!id) {
    console.error(`BAIL: a block has arabicText and audioKey (${audioKey}) but no id — cannot key the snapshot.`);
    process.exit(1);
  }
  // Keyed by content id, NOT audioKey. Several Content rows legitimately cite
  // the same ayah range, and they do not always carry byte-identical text
  // (2:155-156 is currently authored twice, with different dagger-alef and
  // ayah-ornament conventions). Keying by audioKey would lock only whichever
  // row was parsed first and leave the other permanently failing with no way
  // to express both. Keying by id locks each row on its own terms.
  if (seen.has(audioKey) && seen.get(audioKey).arabic !== arabic) {
    console.warn(`  note: ${audioKey} is authored twice with different arabicText (${seen.get(audioKey).id} vs ${id}) — both are snapshotted`);
  }
  if (!seen.has(audioKey)) seen.set(audioKey, { id, arabic });
  entries.push({ id, audioKey, arabic });
}

if (entries.length === 0) {
  console.error('BAIL: parsed 0 entries out of quranData.ts — the object scanner no longer matches the file.');
  process.exit(1);
}
if (entries.length < 200) {
  console.error(`BAIL: parsed only ${entries.length} entries; expected 200+. The scanner is under-capturing, which would silently shrink the test.`);
  process.exit(1);
}

// Self-check. The scanner's failure mode is UNDER-capture, and an
// under-captured verse disappears from the test instead of failing it — so
// compare against an independent, dumber count. Every audioKey literal in the
// file must have been picked up by the structural pass.
const declared = new Set([...src.matchAll(/audioKey: '([^']+)'/g)].map((x) => x[1]));
const missed = [...declared].filter((k) => !seen.has(k));
if (missed.length) {
  console.error(
    `BAIL: ${missed.length} audioKey(s) exist in ${DATA} but the object scanner did not reach them:\n  ` +
      missed.join('\n  ') +
      '\n\nThis means block boundaries are wrong (comments? an unbalanced brace in a string?), ' +
      'not that the verses are absent. Fix the scanner — do not lower the expectation.',
  );
  process.exit(1);
}
console.log(`self-check: all ${declared.size} declared audioKeys were reached by the structural pass`);
console.log(`parsed ${blocks.length} object blocks -> ${entries.length} unique audioKeys from ${DATA}`);
if (withArabicNoKey) {
  console.log(`note: ${withArabicNoKey} block(s) have arabicText but no audioKey — NOT covered by the test.`);
}

function parseKey(audioKey) {
  const match = audioKey.match(/^(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  const chapter = +match[1];
  const start = +match[2];
  const end = match[3] !== undefined ? +match[3] : start;
  if (end < start) return null;
  return { chapter, start, end };
}

async function fetchVerse(chapter, verse) {
  const url = `${API}/${chapter}:${verse}?fields=text_uthmani`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const text = body?.verse?.text_uthmani;
      if (!text) throw new Error('no text_uthmani in response');
      return text;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
}

const canonical = {};
const failures = [];
const remoteCache = new Map(); // audioKey -> quran.com text, fetched once

for (const entry of entries) {
  const parts = parseKey(entry.audioKey);
  if (!parts) {
    failures.push(`${entry.id} (${entry.audioKey}): unparseable audioKey`);
    continue;
  }
  try {
    if (!remoteCache.has(entry.audioKey)) {
      const chunks = [];
      for (let v = parts.start; v <= parts.end; v++) {
        chunks.push(await fetchVerse(parts.chapter, v));
      }
      remoteCache.set(entry.audioKey, chunks.join(' '));
    }
    canonical[entry.id] = {
      id: entry.id,
      audioKey: entry.audioKey,
      arabic: entry.arabic,
      remote: remoteCache.get(entry.audioKey),
    };
    process.stdout.write('.');
  } catch (err) {
    failures.push(`${entry.id} (${entry.audioKey}): ${err.message}`);
    process.stdout.write('!');
  }
}
process.stdout.write('\n');

if (failures.length) {
  console.error(`\n${failures.length} fetch failure(s) — snapshot NOT written:`);
  failures.forEach((f) => console.error('   ' + f));
  console.error('\nA partial snapshot would silently drop verses from the test. Re-run when the network is healthy.');
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const ordered = Object.fromEntries(Object.keys(canonical).sort().map((k) => [k, canonical[k]]));
fs.writeFileSync(OUT, JSON.stringify(ordered, null, 2) + '\n', 'utf8');

console.log(`\nwrote ${OUT} — ${Object.keys(ordered).length} entries`);
console.log('now run:  npx jest quranArabicIntegrity');
