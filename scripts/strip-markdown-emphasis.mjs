/**
 * One-off: remove markdown emphasis asterisks from rendered content strings.
 *
 * React Native's <Text> has no markdown renderer, so "*with*" in an angle
 * reaches the user as literal asterisks around the word. 19 of these were
 * already shipped — 10 in angle/reflection fields and 9 in verse whyThis —
 * and two more nearly went out in the Sad T3 batch.
 *
 * This removes the asterisks and keeps the words. It is NOT a voice rewrite:
 * CLAUDE.md exempts legacy angles from retroactive rewriting, and this changes
 * no wording, only a rendering artifact.
 *
 * Safe to run globally because every `*...*` pair in the file was verified to
 * sit inside a rendered content string, not a comment — the parsed-field scan
 * found 19 fields affected while the raw pair count is 23 — some fields carry two. The script asserts that
 * number and writes nothing if it has drifted.
 *
 * Run once: node scripts/strip-markdown-emphasis.mjs
 */
import fs from 'fs';

const FILE = 'src/data/quranData.ts';
const EXPECTED = 23;

const src = fs.readFileSync(FILE, 'utf8');
if (!src.includes('\r\n')) {
  console.error('x refusing to write: CRLF line endings are already gone');
  process.exit(1);
}

const matches = [...src.matchAll(/\*([^*\n]{1,60})\*/g)];
if (matches.length !== EXPECTED) {
  console.error(`x expected exactly ${EXPECTED} emphasis pairs, found ${matches.length}.`);
  console.error('  Re-run the parsed-field scan before trusting a global replace.');
  matches.slice(0, 25).forEach((m) => console.error(`    ${JSON.stringify(m[0])}`));
  process.exit(1);
}

const out = src.replace(/\*([^*\n]{1,60})\*/g, '$1');

if (!out.includes('\r\n')) {
  console.error('x refusing to write: the edit destroyed CRLF');
  process.exit(1);
}
// NOT `out.includes('*')` — the file's own JSDoc comment blocks are full of
// legitimate asterisks. The assertion is that no emphasis PAIR survives.
const leftover = [...out.matchAll(/\*([^*\n]{1,60})\*/g)];
if (leftover.length) {
  console.error(`x ${leftover.length} emphasis pair(s) remain after the replace — investigate`);
  leftover.slice(0, 10).forEach((m) => console.error(`    ${JSON.stringify(m[0])}`));
  process.exit(1);
}
if (src.length - out.length !== EXPECTED * 2) {
  console.error(`x expected to remove ${EXPECTED * 2} characters, removed ${src.length - out.length}`);
  process.exit(1);
}

fs.writeFileSync(FILE, out);
console.log(`ok — removed ${EXPECTED} emphasis pairs (${EXPECTED * 2} characters)`);
matches.forEach((m) => console.log(`   ${JSON.stringify(m[0])} -> ${JSON.stringify(m[1])}`));
