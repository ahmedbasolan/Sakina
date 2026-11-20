// Copies the daily-verse pool out of src/services/dailyVerseService.ts into
// verses.json for the Live Activity preview page, so the preview shows the app's
// real, verified ayahs (complete, never retyped). Run from the repo root:
//   node docs/superpowers/previews/live-activity/extract-verses.mjs
/* global console */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const src = fs.readFileSync('src/services/dailyVerseService.ts', 'utf8');
const start = src.indexOf('const VERSE_POOL');
const open = src.indexOf('[', src.indexOf('=', start));
const close = src.indexOf('\n];', open);
if (start < 0 || open < 0 || close < 0) throw new Error('VERSE_POOL not found');

// The literal holds only string fields, so evaluating it is safe and keeps every
// character exactly as stored.
const pool = new Function(`return ${src.slice(open, close + 2)}`)();
const verses = pool.map((v) => ({ arabic: v.arabic, english: v.translation, ref: v.ref }));
if (verses.some((v) => !v.arabic || !v.english || !v.ref)) throw new Error('incomplete entry');

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'verses.json');
fs.writeFileSync(out, JSON.stringify(verses, null, 1));
const lengths = verses.map((v) => v.arabic.length + v.english.length).sort((a, b) => a - b);
console.log(`${verses.length} verses written; combined length ${lengths[0]}..${lengths[lengths.length - 1]}`);
