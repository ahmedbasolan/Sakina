/**
 * Angle-authoring tick script — generalises scripts/add-pilot-story.mjs.
 *
 * Inserts ONE mood angle into quranContentAnglesData and advances its ledger
 * row to `drafted`. Reads a JSON payload from a file path.
 *
 * Everything below is a constraint from CLAUDE.md's "Editing quranData.ts by
 * script", each of which cost a broken build or a silent corruption once:
 *
 *   - A file, never `node -e`. Shell quoting mangles Arabic character classes
 *     and \s+ silently.
 *   - Located structurally, never by matching a source string.
 *   - Exactly one match asserted per anchor; nothing written if any fails.
 *   - CRLF preserved, checked before AND after.
 *   - `id` emitted with SINGLE quotes. verify-journey.mjs's objectAt finds
 *     objects with a literal indexOf("id: '" + id + "'"), so an id emitted
 *     through JSON.stringify as id: "..." is invisible to the verifier — which
 *     surfaces as 40 failures reporting the angles as missing, none of them
 *     naming the cause.
 *   - All PROSE emitted through JSON.stringify, which double-quotes and so is
 *     apostrophe-safe. Inserting an apostrophe into a single-quoted literal
 *     ('Jami' at-Tirmidhi') terminates the string and breaks the build.
 *
 * WHAT THIS DOES NOT DO: judge the content. It checks structure, uniqueness
 * and shape. Whether the verse fits the mood, whether the citation says what
 * the step claims, and whether the angle speaks to the reader rather than
 * about a scholar are all human reads, enforced downstream by
 * verify-mood-pools' voice pass, verify-citations, and review-mood-fit.
 *
 * Usage: node scripts/author-angle.mjs <payload.json>
 */
import fs from 'fs';

const FILE = 'src/data/quranData.ts';
const LEDGER = process.env.MOOD_LEDGER
  || 'docs/superpowers/plans/2026-08-31-mood-pools/ledger.json';
const ANCHOR = 'const quranContentAnglesData: ContentAngle[] = [';

const STEP_TYPES = ['physical', 'verbal', 'mindset'];
const SOURCE_TYPES = [
  'sunnah_action', 'prophetic_dua', 'quran_dua', 'prophetic_dhikr', 'composed_dua',
];

const fail = (msg) => { console.error(`x ${msg}`); process.exit(1); };

const payloadPath = process.argv[2];
if (!payloadPath) fail('usage: node scripts/author-angle.mjs <payload.json>');
const p = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

// ── payload shape ─────────────────────────────────────────────────────────
for (const f of ['angleId', 'contentId', 'mood', 'angle', 'action', 'reflection', 'practiceSteps']) {
  if (!p[f]) fail(`payload is missing '${f}'`);
}
if (!Array.isArray(p.practiceSteps) || p.practiceSteps.length !== 3) {
  fail(`practiceSteps must be exactly 3 — the corpus is 243/245 at exactly 3, never 4, never 6 ` +
       `(got ${Array.isArray(p.practiceSteps) ? p.practiceSteps.length : typeof p.practiceSteps})`);
}
const types = p.practiceSteps.map((s) => s.type);
for (const t of STEP_TYPES) {
  if (!types.includes(t)) fail(`practiceSteps must contain one '${t}' step — got [${types.join(', ')}]`);
}
for (const [i, s] of p.practiceSteps.entries()) {
  for (const f of ['type', 'icon', 'title', 'instruction']) {
    if (!s[f]) fail(`practiceSteps[${i}] is missing '${f}'`);
  }
  if (s.sourceType && !SOURCE_TYPES.includes(s.sourceType))
    fail(`practiceSteps[${i}].sourceType '${s.sourceType}' is not a valid member`);
  if (s.sourceGrading && !['sahih', 'hasan'].includes(s.sourceGrading))
    fail(`practiceSteps[${i}].sourceGrading must be lowercase 'sahih' or 'hasan'`);
  if (s.source && !s.sourceType)
    fail(`practiceSteps[${i}] cites a source with no sourceType — a bare citation asserts ` +
         `provenance, so say which kind it is`);
}
// 0/245 existing mood angles use these. Emitting them would break convention
// and, for actionSource, badge app-written guidance as sourced.
for (const banned of ['actionSource', 'actionArabicText']) {
  if (p[banned]) fail(`'${banned}' is used by 0 of 245 existing mood angles — do not introduce it`);
}
if (/\[Tafsir /.test(p.angle)) {
  fail('angle carries a [Tafsir ...] tag — that is the journey convention; mood angles are ' +
       'direct address');
}
if (/'/.test(p.angleId)) fail('angleId must not contain an apostrophe — it is single-quoted');

// ── file assertions ───────────────────────────────────────────────────────
const src = fs.readFileSync(FILE, 'utf8');
if (!src.includes('\r\n')) fail('refusing to write: CRLF line endings are already gone');

const idHits = src.split(`id: '${p.angleId}'`).length - 1;
if (idHits !== 0) fail(`angle id ${p.angleId} already exists (${idHits} match) — reusing an id ` +
                       `puts two entries under one id into the seeder`);

const contentHits = src.split(`id: '${p.contentId}'`).length - 1;
if (contentHits !== 1) fail(`expected exactly 1 verse with id ${p.contentId}, found ${contentHits}`);

const anchorAt = src.indexOf(ANCHOR);
if (anchorAt === -1) fail(`could not find the angles array anchor: ${ANCHOR}`);

// Append at the end of the angles array — the last `];` in the file before the
// export line. Anchoring on the array's own terminator rather than on any
// neighbouring angle keeps this independent of what was written last.
const exportAt = src.indexOf('export { quranContent', anchorAt);
if (exportAt === -1) fail('could not find the export line after the angles array');
const closeAt = src.lastIndexOf('];', exportAt);
if (closeAt === -1 || closeAt < anchorAt) fail('could not find the angles array terminator');

// ── emit ──────────────────────────────────────────────────────────────────
// ids single-quoted so verify-journey.mjs can see them; prose through
// JSON.stringify so apostrophes are safe.
const J = (v) => JSON.stringify(v);
const lines = [
  '  {',
  `    id: '${p.angleId}',`,
  `    contentId: '${p.contentId}',`,
  `    mood: '${p.mood}',`,
  `    angle: ${J(p.angle)},`,
];
if (p.angleSource) lines.push(`    angleSource: ${J(p.angleSource)},`);
lines.push(`    action: ${J(p.action)},`);
// JSON is a subset of JS object-literal syntax, so the stringified array is a
// valid literal argument to JSON.stringify — matching the file's existing
// `practiceSteps: JSON.stringify([...])` shape.
lines.push(`    practiceSteps: JSON.stringify(${J(p.practiceSteps)}),`);
lines.push(`    reflection: ${J(p.reflection)},`);
lines.push('  },');

const block = lines.join('\r\n') + '\r\n';
const out = src.slice(0, closeAt) + block + src.slice(closeAt);

if (!out.includes('\r\n')) fail('refusing to write: the edit destroyed CRLF');
if (out.length <= src.length) fail('refusing to write: the edit did not add content');

fs.writeFileSync(FILE, out);

// ── advance the ledger ────────────────────────────────────────────────────
if (fs.existsSync(LEDGER)) {
  const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
  let row = ledger.units.find((u) => u.angleId === p.angleId);
  if (!row) {
    // A T2/T3 row is unassigned until a tick picks it up and chooses a verse.
    row = ledger.units.find((u) => u.mood === p.mood && u.angleId === null && u.status === 'pending');
    if (!row) fail(`wrote the angle but found no ledger row to advance for mood ${p.mood} — ` +
                   `revert with: git checkout ${FILE}`);
    row.angleId = p.angleId;
    row.contentId = p.contentId;
  }
  row.status = 'drafted';
  if (p.citations) row.citations = p.citations;
  fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + '\n');
  console.log(`ok — ${p.angleId} inserted (${row.tier}), ledger row -> drafted`);
} else {
  console.log(`ok — ${p.angleId} inserted (no ledger at ${LEDGER})`);
}
