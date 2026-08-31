/**
 * Story verifier — the citation gate for Content.story.
 *
 * Checks, in order:
 *   1. Shape — required fields present, sourceType a valid union member,
 *      grading only on hadith_narrative and only 'sahih' | 'hasan'.
 *   2. Locatability — a quran_narrative source parses to a surah:ayah range;
 *      a hadith_narrative source parses to a collection and a number.
 *   3. No ayah quotation in the body. A quoted ayah is verse text and falls
 *      under the complete-ayah rule, so story bodies retell in prose instead.
 *      Detected as Arabic script anywhere in `body`, plus any quoted run that
 *      overlaps the cited verse's English by more than SHARE_LIMIT.
 *   4. Round trip — every story survives JSON.stringify -> SQLite TEXT ->
 *      JSON.parse against the shipped DDL, so a story that cannot be seeded
 *      fails here rather than on a device.
 *
 * The field reader below is deliberately CONCATENATION-AWARE. Long prose in
 * quranData.ts is written as adjacent literals joined by `+`, so a reader that
 * stops at the first closing quote would check the opening clause of every
 * story body and silently pass everything after it. A checker that reads part
 * of its input is worse than no checker, because it reports green.
 *
 * WHAT THIS DOES NOT CATCH — read this before treating a green run as proof:
 *   - Whether the retelling is FAITHFUL to its source. Every check here is
 *     structural. A well-formed, correctly-cited, entirely invented story
 *     passes cleanly. That is a human read, and it is the whole point of the
 *     sourcing rule.
 *   - Whether the story belongs beside its verse.
 *   - Whether a hadith number is the RIGHT hadith for the narrative. Pass 2
 *     proves the citation is locatable, not that it says what the story says.
 *     Network verification of that lives in verify-citations.mjs.
 *   - Israiliyyat. A detail the Quran withholds, sourced to a real ayah range,
 *     is invisible to a structural check.
 *
 * Run:      node scripts/verify-stories.mjs
 * Selftest: STORY_INJECT=1 node scripts/verify-stories.mjs
 * BOTH must exit 0. A passing positive run alone proves nothing.
 */
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

const BS = String.fromCharCode(92);
const SHARE_LIMIT = 0.6;
const INJECT = process.env.STORY_INJECT === '1';

const src = fs.readFileSync('src/data/quranData.ts', 'utf8');
const errors = [];

// ── extract Content objects and their story blocks ────────────────────────
function objects(prefix) {
  const out = [];
  for (const m of src.matchAll(new RegExp(`id: '(${prefix}[a-zA-Z0-9_]+)'`, 'g'))) {
    let open = m.index;
    while (src[open] !== '{') open--;
    let d = 0, q = null, end = -1;
    for (let k = open; k < src.length; k++) {
      const c = src[k];
      if (q) { if (c === BS) k++; else if (c === q) q = null; continue; }
      if (c === "'" || c === '"' || c === '`') { q = c; continue; }
      if (c === '{') d++;
      else if (c === '}') { d--; if (!d) { end = k; break; } }
    }
    out.push({ id: m[1], body: src.slice(open, end + 1) });
  }
  return out;
}

/**
 * Read a string field, following `'a' + 'b' + 'c'` concatenation to the end.
 * Returns the joined value, so a body split across ten literals is checked
 * whole rather than by its first clause.
 */
function field(body, name) {
  const m = body.match(new RegExp(`\\b${name}:\\s*`));
  if (!m) return null;
  let i = m.index + m[0].length;
  let out = '';
  let first = true;

  while (i < body.length) {
    const q = body[i];
    if (q !== "'" && q !== '"') {
      if (first) return null;
      break;
    }
    first = false;

    let k = i + 1;
    for (; k < body.length; k++) {
      const c = body[k];
      if (c === BS) { out += body[k + 1]; k++; continue; }
      if (c === q) break;
      out += c;
    }

    // Look past the closing quote for a `+` joining another literal.
    let j = k + 1;
    while (j < body.length && /\s/.test(body[j])) j++;
    if (body[j] !== '+') break;
    j++;
    while (j < body.length && /\s/.test(body[j])) j++;
    i = j;
  }
  return out;
}

const stories = [];
for (const c of objects('quran_')) {
  const at = c.body.indexOf('story: {');
  if (at === -1) continue;
  let d = 0, end = -1;
  for (let k = c.body.indexOf('{', at); k < c.body.length; k++) {
    if (c.body[k] === '{') d++;
    else if (c.body[k] === '}') { d--; if (!d) { end = k; break; } }
  }
  const block = c.body.slice(at, end + 1);
  stories.push({
    verseId: c.id,
    verseSource: field(c.body, 'source') || '',
    verseEnglish: field(c.body, 'englishTranslation') || '',
    title: field(block, 'title'),
    body: INJECT ? 'وَلَلْـَٔاخِرَةُ خَيْرٌۭ لَّكَ' : field(block, 'body'),
    source: INJECT ? 'The Increase Dua' : field(block, 'source'),
    sourceType: field(block, 'sourceType'),
    grading: field(block, 'grading'),
  });
}

// ── 1. shape ──────────────────────────────────────────────────────────────
const TYPES = ['quran_narrative', 'hadith_narrative'];
const GRADINGS = ['sahih', 'hasan'];
for (const s of stories) {
  for (const f of ['title', 'body', 'source', 'sourceType']) {
    if (!s[f]) errors.push(`${s.verseId}: story is missing '${f}'`);
  }
  if (s.sourceType && !TYPES.includes(s.sourceType))
    errors.push(`${s.verseId}: sourceType '${s.sourceType}' is not a valid member`);
  if (s.grading && !GRADINGS.includes(s.grading))
    errors.push(`${s.verseId}: grading '${s.grading}' is not 'sahih' or 'hasan'`);
  if (s.grading && s.sourceType === 'quran_narrative')
    errors.push(`${s.verseId}: quran_narrative must not carry a grading`);
}

// ── 2. locatability ───────────────────────────────────────────────────────
for (const s of stories) {
  if (!s.source) continue;
  if (s.sourceType === 'quran_narrative') {
    if (!/\d+:\d+(-\d+)?\s*$/.test(s.source.trim()))
      errors.push(`${s.verseId}: quran_narrative source '${s.source}' has no surah:ayah range`);
  } else if (s.sourceType === 'hadith_narrative') {
    if (!/[A-Za-z'-]\s+\d+\s*$/.test(s.source.trim()))
      errors.push(`${s.verseId}: hadith_narrative source '${s.source}' is not 'Collection Number'`);
  }
}

// ── 3. no ayah quotation in the body ──────────────────────────────────────
const ARABIC = /[؀-ۿ]/;
const words = (t) => (t || '').toLowerCase().match(/[a-z']+/g) || [];
for (const s of stories) {
  if (!s.body) continue;
  if (ARABIC.test(s.body))
    errors.push(`${s.verseId}: story body contains Arabic script — retell in prose, cite the range`);
  for (const q of s.body.matchAll(/"([^"]{25,})"/g)) {
    const qw = new Set(words(q[1]));
    const vw = words(s.verseEnglish);
    if (!vw.length || !qw.size) continue;
    const shared = vw.filter((w) => qw.has(w)).length / vw.length;
    if (shared > SHARE_LIMIT)
      errors.push(
        `${s.verseId}: quoted run overlaps the verse translation ${(shared * 100).toFixed(0)}%` +
          ' — quote the ayah in the verse layer, not the story',
      );
  }
}

// ── 4. round trip through the shipped DDL ─────────────────────────────────
const ddlSrc = fs.readFileSync('src/database/tables.ts', 'utf8');
const start = ddlSrc.indexOf('CREATE TABLE IF NOT EXISTS content (');
const ddl = ddlSrc.slice(start, ddlSrc.indexOf(');', start) + 2);
const db = new DatabaseSync(':memory:');
db.exec(ddl);
const ins = db.prepare(
  `INSERT INTO content (id, type, primaryText, englishTranslation, source, whyThis, story)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
);
for (const s of stories) {
  const payload = { title: s.title, body: s.body, source: s.source, sourceType: s.sourceType };
  if (s.grading) payload.grading = s.grading;
  ins.run(s.verseId, 'Quran', 'x', 'x', s.verseSource, 'x', JSON.stringify(payload));
  const back = db.prepare('SELECT story FROM content WHERE id = ?').get(s.verseId);
  let parsed;
  try { parsed = JSON.parse(back.story); } catch { parsed = null; }
  if (!parsed || parsed.title !== s.title || parsed.body !== s.body)
    errors.push(`${s.verseId}: story did not survive the seed/read round trip`);
}
db.close();

// ── report ────────────────────────────────────────────────────────────────
console.log(
  `Checked ${stories.length} stor${stories.length === 1 ? 'y' : 'ies'}` +
    (INJECT ? ' (STORY_INJECT: faults deliberately introduced)' : ''),
);

if (INJECT) {
  if (stories.length === 0) {
    console.log('\nx STORY_INJECT found no stories to corrupt — the negative test proved nothing.');
    process.exit(1);
  }
  if (errors.length === 0) {
    console.log('\nx STORY_INJECT corrupted every story and the checks still passed.');
    process.exit(1);
  }
  console.log(`\nNegative mode OK — ${errors.length} injected fault(s) caught.`);
  process.exit(0);
}

if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  errors.forEach((e) => console.log(`  x ${e}`));
  process.exit(1);
}
console.log('\nAll checks passed.');
