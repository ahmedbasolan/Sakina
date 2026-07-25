/**
 * Journey content verifier — see CLAUDE.md § "Journey Sessions".
 *
 * Checks, per journey day: refs resolve; the angle is a purpose-written
 * journey angle (not a mood angle borrowed from the mood-picker flow); angle
 * mood matches the path theme; practiceSteps JSON parses with valid union
 * members; no verse / hadith / du'a repeats inside one journey; and that the
 * angle text will actually render — a [Tafsir ...] tag at string start so the
 * footnote does not fall back to the verse's whyThis, and a split pattern so
 * ContextLayer produces both an Understand and a Matters section.
 *
 * Run: node scripts/verify-journey.mjs
 */
import fs from 'fs';

const paths = fs.readFileSync('src/data/staticPaths.ts', 'utf8');
const quran = fs.readFileSync('src/data/quranData.ts', 'utf8');
const hadith = fs.readFileSync('src/data/hadithData.ts', 'utf8');

// [path id, required angle-id prefix, required angle mood (= the path theme)]
const JOURNEYS = [
  ['path_trusting_the_results', 'q_angle_results_', 'Overwhelmed'],
  ['path_study_journaling', 'q_angle_study_', 'Hopeful'],
];

const contentIds = new Set([...quran.matchAll(/id: '(quran_[a-z0-9_]+)'/g)].map((m) => m[1]));
const angleIds = new Set([...quran.matchAll(/id: '(q_angle_[a-z0-9_]+)'/g)].map((m) => m[1]));
const hadIds = new Set([...hadith.matchAll(/id: '(hadith_[a-z0-9_]+)'/g)].map((m) => m[1]));

// Derived from the IconName union rather than hardcoded. The previous literal
// list had drifted 11 names behind Icon.tsx (handshake, gem, globe, person,
// trophy, water-drop, calm-face, …), so this check rejected 52 angles that
// render perfectly well — a false negative is how a checker loses its authority.
const iconUnion = fs.readFileSync('src/components/Icon.tsx', 'utf8').match(/export type IconName =[\s\S]*?;/);
if (!iconUnion) {
  console.error('Could not find the `export type IconName = …;` union in src/components/Icon.tsx.');
  console.error('If it was renamed or reshaped, update this parser — do not fall back to a literal');
  console.error('list, which is what drifted 11 names out of date last time.');
  process.exit(1);
}
const ICONS = new Set([...iconUnion[0].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]));
const TYPES = new Set(['mindset', 'physical', 'verbal']);
const SRCT = new Set(['quran_dua', 'prophetic_dua', 'prophetic_dhikr', 'sunnah_action']);

// Mirrors ContextLayer.splitIntoSections / extractSourceLabel / cleanText.
const SPLIT = [/\.\s+The Prophet\s+ﷺ\s+said:/,/\.\s+The Prophet\s+ﷺ\s+would/,/\.\s+The Prophet\s+ﷺ\s+used to/,/\.\s+The Prophet\s+ﷺ\s+never/,/\.\s+The Prophet\s+ﷺ\s+himself/,/\.\s+The Prophet\s+ﷺ\s+was/,/\.\s+Your\s/,/\.\s+When you/,/\.\s+Despair/,/\.\s+Being an ally/,/\.\s+No sadness/,/\.\s+Even when/];
const clean = (t) => t.replace(/\s*\[(?:Tafsir[^\]]*|Sahih[^\]]*|At-Tirmidhi[^\]]*|Abu Dawud[^\]]*|Musnad[^\]]*|Ibn[^\]]*|An-Nasa[^\]]*|Al-[^\]]*)\]\s*/g, ' ').trim();

/**
 * Extract the balanced `{...}` object literal containing `id: '<id>'`.
 *
 * Brace counting must ignore braces inside string literals — angle text and
 * practiceSteps instructions are prose and may legitimately contain `{`.
 * Counting them shifts the depth and the object never closes, which surfaces
 * as a misleading "could not be parsed" instead of the real fault.
 */
function objectAt(src, id) {
  const at = src.indexOf(`id: '${id}'`);
  if (at < 0) return null;
  let open = at;
  while (src[open] !== '{') open--;
  let depth = 0, quote = null;
  for (let k = open; k < src.length; k++) {
    const c = src[k];
    if (quote) {
      if (c === '\\') k++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return eval('(' + src.slice(open, k + 1) + ')');
    }
  }
  return null;
}

let fail = 0;

for (const [pathId, anglePrefix, theme] of JOURNEYS) {
  const path = objectAt(paths, pathId);
  if (!path) { console.log(`!! path not found: ${pathId}`); fail++; continue; }

  const err = (d, m) => { console.log(`  !! day ${d}: ${m}`); fail++; };
  const seenVerse = new Map(), seenDua = new Map(), seenHadith = new Map();

  console.log(`=== ${path.title} — ${path.dailySteps.length}/${path.duration} days · theme ${path.theme} ===\n`);

  if (path.dailySteps.length !== path.duration) {
    console.log(`  !! ${path.dailySteps.length} steps but duration ${path.duration}`);
    fail++;
  }

  for (const step of path.dailySteps) {
    const day = step.day;
    if (!contentIds.has(step.contentId)) err(day, `missing content ${step.contentId}`);
    if (!hadIds.has(step.hadithContentId)) err(day, `missing hadith ${step.hadithContentId}`);
    if (!angleIds.has(step.angleId)) err(day, `missing angle ${step.angleId}`);
    if (!step.angleId.startsWith(anglePrefix)) {
      err(day, `borrowed mood angle: ${step.angleId} (expected ${anglePrefix}*)`);
      continue;
    }

    if (seenVerse.has(step.contentId)) err(day, `verse ${step.contentId} also on day ${seenVerse.get(step.contentId)}`);
    seenVerse.set(step.contentId, day);

    const h = objectAt(hadith, step.hadithContentId);
    if (h) {
      if (seenHadith.has(h.source)) err(day, `hadith ${h.source} also on day ${seenHadith.get(h.source)}`);
      seenHadith.set(h.source, day);
    }

    const a = objectAt(quran, step.angleId);
    if (!a) { err(day, 'angle could not be parsed'); continue; }
    if (a.contentId !== step.contentId) err(day, `angle.contentId ${a.contentId} != step ${step.contentId}`);
    if (a.mood !== theme) err(day, `angle mood ${a.mood} != path theme ${theme}`);

    let ps;
    try { ps = JSON.parse(a.practiceSteps); } catch { err(day, 'practiceSteps JSON invalid'); continue; }
    for (const s of ps) {
      if (!TYPES.has(s.type)) err(day, `bad type ${s.type}`);
      if (!ICONS.has(s.icon)) err(day, `bad icon ${s.icon}`);
      if (!SRCT.has(s.sourceType)) err(day, `bad sourceType ${s.sourceType}`);
      if (!s.source) err(day, `practice step "${s.title}" missing source`);
    }

    if (a.actionArabicText) {
      if (seenDua.has(a.actionArabicText)) err(day, `du'a repeats day ${seenDua.get(a.actionArabicText)}`);
      seenDua.set(a.actionArabicText, day);
    }

    const lbl = (a.angle.match(/\[Tafsir\s+[^\]]+\]/) || [])[0];
    if (!lbl) err(day, 'no [Tafsir ...] tag — footnote falls back to the verse whyThis');
    else if (a.angle.indexOf(lbl) !== 0) err(day, 'tafsir tag not at string start (leaves a stray space)');

    let u = a.angle, mt = '';
    for (const p of SPLIT) {
      const x = a.angle.match(p);
      if (x) { u = a.angle.slice(0, x.index + 1); mt = a.angle.slice(x.index + 1); break; }
    }
    if (!mt) err(day, 'no split pattern — Matters section will be empty');
    if (/\s\./.test(clean(u))) err(day, 'stray space before a period after tag strip');

    console.log(`day ${day} — ${step.title}`);
    console.log(`   ${step.contentId} · ${step.angleId} · ${h ? h.source : '?'}`);
    console.log(`   label: ${lbl ? lbl.replace(/[[\]]/g, '') : '(none)'} · practice: ${ps.length} steps`);
    console.log(`   U: ${clean(u).slice(0, 92)}...`);
    console.log(`   M: ${clean(mt).slice(0, 92)}...\n`);
  }
}

console.log(fail ? `\n*** ${fail} FAILURES` : '\nAll checks passed.');
process.exit(fail ? 1 : 0);
