// Copies the few mood-flow verses the widget preview (together.html) pairs with
// real reflection prompts out of src/data/quranData.ts into mood-verses.json,
// exactly as stored (complete ayahs, never retyped). Run from the repo root:
//   node docs/superpowers/previews/live-activity/extract-mood-verses.mjs
/* global console */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const IDS = ['quran_93_4', 'quran_28_24', 'quran_26_62'];
const src = fs.readFileSync('src/data/quranData.ts', 'utf8');

// A string literal in either quote style, possibly on the next line.
const field = (block, name) => {
  const m = block.match(new RegExp(`${name}:\\s*(?:\\r?\\n\\s*)?(['"])((?:\\\\.|(?!\\1).)*)\\1`));
  if (!m) throw new Error(`${name} not found`);
  return new Function(`return ${m[1]}${m[2]}${m[1]}`)();
};

const out = IDS.map((id) => {
  const at = src.indexOf(`id: '${id}'`);
  if (at < 0 || src.indexOf(`id: '${id}'`, at + 1) >= 0) throw new Error(`${id}: expected exactly one entry`);
  const block = src.slice(at, src.indexOf('\n  }', at));
  return {
    id,
    arabic: field(block, 'arabicText'),
    english: field(block, 'englishTranslation'),
    ref: field(block, 'source').replace(/^Surah /, ''),
  };
});
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mood-verses.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log(out.map((v) => `${v.ref}: ${v.arabic.length} + ${v.english.length} chars`).join('\n'));
