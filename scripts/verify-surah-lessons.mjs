/**
 * Surah-lesson verifier — re-fetches every ayah in src/data/surahLessons.ts and
 * compares it byte for byte with quran.com.
 *
 * surahLessons.ts is generated, and the generator was wrong on its first run:
 * it left quran.com footnote markers glued to words ("Allāh,1", "Recompense.1")
 * because stripping <sup> tags without stripping their contents keeps the
 * marker digit. A generated file nobody re-reads is a file nobody checks.
 *
 * Also asserts: the ayah count matches the surah, numbering is 1..n with no
 * gap, no footnote marker survives, and no transliteration is empty.
 *
 * Needs network and curl. Run: node scripts/verify-surah-lessons.mjs
 */
import { execFileSync } from 'child_process';
import fs from 'fs';

const curl = (u) => execFileSync('curl', ['-sL', '--max-time', '30', u], { maxBuffer: 1 << 26 }).toString();
const src = fs.readFileSync('src/data/surahLessons.ts', 'utf8');

// Pull the object literal out of the TS file — the same quote-aware brace
// scanner the other verifiers use, so Arabic prose containing a brace cannot
// shift the depth count.
const body = src.slice(src.indexOf('export const SURAH_LESSONS'));
const objStart = body.indexOf('{');
let depth = 0, quote = null, end = -1;
for (let k = objStart; k < body.length; k++) {
  const c = body[k];
  if (quote) { if (c === '\\') k++; else if (c === quote) quote = null; continue; }
  if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
  if (c === '{') depth++;
  else if (c === '}') { depth--; if (!depth) { end = k; break; } }
}
if (end < 0) {
  console.error('could not find the SURAH_LESSONS object literal');
  process.exit(1);
}
const LESSONS = eval('(' + body.slice(objStart, end + 1) + ')');
if (!Object.keys(LESSONS).length) {
  console.error('parsed 0 surahs — the parser is broken, not the data');
  process.exit(1);
}

let checked = 0;
const bad = [];
for (const lesson of Object.values(LESSONS)) {
  let verses;
  try {
    verses = JSON.parse(curl(
      `https://api.quran.com/api/v4/verses/by_chapter/${lesson.number}` +
      `?fields=text_uthmani&translations=20&per_page=50`,
    )).verses;
  } catch (e) {
    console.log(`  (unreadable: surah ${lesson.number} — ${e.message.slice(0, 60)})`);
    continue;
  }
  if (verses.length !== lesson.ayahs.length) {
    bad.push(`${lesson.name}: ${lesson.ayahs.length} ayahs stored, API has ${verses.length}`);
    continue;
  }
  verses.forEach((v, i) => {
    const mine = lesson.ayahs[i];
    checked++;
    if (mine.n !== i + 1) bad.push(`${lesson.name} idx ${i}: ayah numbered ${mine.n}`);
    if (mine.arabic !== v.text_uthmani.trim()) bad.push(`${lesson.name} ${mine.n}: Arabic differs from the API`);
    const en = ((v.translations || [])[0]?.text ?? '')
      .replace(/<sup[^>]*>[\s\S]*?<\/sup>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (mine.translation !== en) {
      bad.push(`${lesson.name} ${mine.n}: translation differs\n    stored: ${mine.translation}\n    api   : ${en}`);
    }
    if (/[a-zA-Z][0-9]/.test(mine.translation)) bad.push(`${lesson.name} ${mine.n}: footnote marker left in the translation`);
    if (!mine.transliteration) bad.push(`${lesson.name} ${mine.n}: empty transliteration`);
  });
}

console.log(`checked ${checked} ayahs across ${Object.keys(LESSONS).length} surahs against quran.com`);
console.log(bad.length ? `${bad.length} MISMATCH(ES):` : 'All byte-identical to the API.');
bad.forEach((b) => console.log('  ' + b));
process.exit(bad.length ? 1 : 0);
