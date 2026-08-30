/**
 * Mood-FIT reviewer — does the verse suit the feeling it is served for?
 *
 * verify-mood-pools.mjs answers a different question: can this angle ever be
 * reached (does angle.mood appear in verse.moods). It says nothing about
 * whether the verse should be in that pool at all. Az-Zumar 39:53-54 passed it
 * cleanly while sitting in Sad — an ayah addressed to people who "have
 * transgressed against themselves", whose next line warns of punishment
 * "before it comes upon you", served to someone who tapped Sad because they
 * are grieving.
 *
 * This is a REVIEW tool, not a gate. Theology is not decidable by keyword, so
 * it exits 0 and prints candidates for a human to judge. It reports:
 *
 *   1. warning / punishment / sin language in a verse served to a mood that
 *      came to be comforted (Sad, Lonely, Tired, Calm, Grateful)
 *   2. verses carrying four or more mood tags — usually a sign the verse was
 *      tagged by theme rather than by what the reader is feeling
 *   3. angles whose text is dominated by a register other than their mood's
 *      (a "sad" angle whose language is entirely sin and repentance)
 *
 * Run: node scripts/review-mood-fit.mjs
 */
import fs from 'fs';

const src = fs.readFileSync('src/data/quranData.ts', 'utf8');

function objects(prefix) {
  const out = [];
  for (const m of src.matchAll(new RegExp(`id: '(${prefix}[a-zA-Z0-9_]+)'`, 'g'))) {
    let open = m.index; while (src[open] !== '{') open--;
    let d = 0, q = null, end = -1;
    for (let k = open; k < src.length; k++) {
      const c = src[k];
      if (q) { if (c === '\\') k++; else if (c === q) q = null; continue; }
      if (c === "'" || c === '"' || c === '`') { q = c; continue; }
      if (c === '{') d++; else if (c === '}') { d--; if (!d) { end = k; break; } }
    }
    out.push({ id: m[1], body: src.slice(open, end + 1) });
  }
  return out;
}

const field = (b, name) => {
  const m = b.match(new RegExp(`\\b${name}:\\s*\\n?\\s*('|")`));
  if (!m) return '';
  const quote = m[1];
  let i = m.index + m[0].length, s = '';
  for (; i < b.length; i++) {
    if (b[i] === '\\') { s += b[i + 1]; i++; continue; }
    if (b[i] === quote) break;
    s += b[i];
  }
  return s;
};
const moodsOf = (b) =>
  (b.match(/moods:\s*\[([^\]]*)\]/) || ['', ''])[1]
    .replace(/'/g, '').split(',').map((x) => x.trim()).filter(Boolean);

// Moods a user picks when they want consolation. A verse that threatens is not
// wrong — it is wrong HERE.
const COMFORT = new Set(['Sad', 'Lonely', 'Tired', 'Calm', 'Grateful']);

const WARNING = /\b(punish\w*|torment\w*|hellfire|the fire|wrath|doom\w*|destroy\w*|curse\w*|painful (?:punishment|torment)|evildoers|wrongdoers|disbeliev\w*|transgress\w*|sinners?|seize\w*|chastis\w*)\b/gi;

const journeyPrefixes = (() => {
  const repo = fs.readFileSync('src/services/contentRepository.ts', 'utf8');
  const m = repo.match(/export const JOURNEY_ANGLE_PREFIXES = \[([^\]]*)\]/);
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [];
})();
const isJourney = (id) => journeyPrefixes.some((p) => id.startsWith(`q_angle_${p}_`));

const verses = Object.fromEntries(objects('quran_').map((o) => [o.id, {
  moods: moodsOf(o.body),
  translation: field(o.body, 'englishTranslation'),
  source: field(o.body, 'source'),
}]));

// ── 1. warning language served to a mood that came for comfort ────────────
// A mood tag with no non-journey angle behind it is inert — fetchForMood can
// never serve it, so it is not something a user can be shown. Al-A'raf 7:96 was
// reported on its Hopeful and Grateful tags while its only angle is a Rizq
// journey angle; flagging it sent a reviewer to look at a pairing that does not
// exist.
const servedMoods = new Set(
  objects('q_angle_')
    .filter((o) => !isJourney(o.id))
    .map((o) => `${field(o.body, 'contentId')}|${field(o.body, 'mood')}`),
);

const flagged = [];
for (const [id, v] of Object.entries(verses)) {
  const hits = [...new Set((v.translation.match(WARNING) || []).map((w) => w.toLowerCase()))];
  if (!hits.length) continue;
  const comfort = v.moods.filter((m) => COMFORT.has(m) && servedMoods.has(`${id}|${m}`));
  if (!comfort.length) continue;
  flagged.push({ id, source: v.source, moods: comfort, hits, translation: v.translation });
}
console.log(`1. Warning/sin language in verses served to a comfort mood: ${flagged.length}\n`);
for (const f of flagged.sort((a, b) => b.hits.length - a.hits.length)) {
  console.log(`  ${f.source}  [${f.moods.join(', ')}]  — ${f.hits.join(', ')}`);
  console.log(`     ${f.translation.slice(0, 150)}${f.translation.length > 150 ? '…' : ''}`);
  console.log(`     ${f.id}\n`);
}

// ── 2. over-tagged verses ─────────────────────────────────────────────────
const over = Object.entries(verses).filter(([, v]) => v.moods.length >= 4);
console.log(`\n2. Verses carrying 4+ moods: ${over.length}\n`);
for (const [id, v] of over) console.log(`  ${v.source}  [${v.moods.join(', ')}]  ${id}`);

// ── 3. angle text whose register does not match its mood ──────────────────
//
// Counts guilt-register words in an angle served to a non-Guilty mood. Both
// Az-Zumar Sad angles scored heavily here — their text was entirely sin,
// repentance and forgiveness while serving Sad.
const GUILT = /\b(sin\w*|repent\w*|forgiv\w*|guilt\w*|tawbah|transgress\w*|astaghfir\w*|istighfar)\b/gi;
const mism = [];
for (const o of objects('q_angle_')) {
  if (isJourney(o.id)) continue;
  const mood = field(o.body, 'mood');
  if (!mood || mood === 'Guilty') continue;
  const text = field(o.body, 'angle');
  const words = text.split(/\s+/).length;
  const hits = (text.match(GUILT) || []).length;
  if (words > 30 && hits >= 5) mism.push({ id: o.id, mood, hits, words });
}
console.log(`\n3. Non-Guilty angles written in a guilt register (>=5 hits): ${mism.length}\n`);
for (const m of mism.sort((a, b) => b.hits - a.hits)) {
  console.log(`  ${m.id}  serving ${m.mood}  — ${m.hits} guilt-words in ${m.words}`);
}

console.log('\nReview only — nothing here is automatically wrong, and this never fails a build.');
