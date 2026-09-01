/**
 * Attach a `story` to an existing Content entry in quranData.ts.
 *
 * Generalises the pilot script that was hardcoded to quran_12_87 (deleted once
 * this superseded it — its CRLF guard was existence-only, the exact
 * insufficiency CLAUDE.md's "Editing quranData.ts by script" section warns
 * against, and a "template" carrying a since-fixed bug is worse than none).
 * Same structural-edit discipline as scripts/author-angle.mjs, and for the
 * same reasons (CLAUDE.md, "Editing quranData.ts by script"):
 *
 *   - A file, never `node -e`. Shell quoting eats backslashes and Arabic
 *     character classes silently.
 *   - Located structurally, by id, with exactly one match asserted. Nothing is
 *     written if any assertion fails.
 *   - CRLF preserved: bare LFs COUNTED before and after, not merely checked
 *     that `\r\n` still appears somewhere. The existence check passes on a file
 *     with one bad line out of nineteen thousand — that happened, and only
 *     git's warning caught it.
 *   - All prose emitted through JSON.stringify, which double-quotes and is
 *     therefore apostrophe-safe. `body` is one long line; the file already
 *     contains long single-line string fields, and re-wrapping across lines is
 *     exactly where the stray '\n' got introduced last time.
 *
 * The story is inserted immediately before the entry's own `moods:` line, so
 * it lands inside the right object rather than at the first `moods:` after the
 * id — the same anchor the pilot used.
 *
 * WHAT THIS DOES NOT DO: verify the story. Whether the body says only what the
 * cited source says is a human read — the same read that
 * scripts/verify-stories.mjs cannot make either. It checks shape, grading
 * legality for the sourceType, and that the target has no story already.
 *
 * Usage: node scripts/add-story.mjs <payload.json>
 *   payload = { contentId, story: { title, body, source, sourceType, grading? } }
 */
import fs from 'fs';
import { bareLF } from './lib/quranDataParse.mjs';

const FILE = 'src/data/quranData.ts';
const SOURCE_TYPES = ['quran_narrative', 'hadith_narrative'];

const fail = (msg) => { console.error(`x ${msg}`); process.exit(1); };
const J = (v) => JSON.stringify(v);

const payloadPath = process.argv[2];
if (!payloadPath) fail('usage: node scripts/add-story.mjs <payload.json>');
const p = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

if (!p.contentId) fail("payload is missing 'contentId'");
if (!p.story) fail("payload is missing 'story'");
for (const f of ['title', 'body', 'source', 'sourceType']) {
  if (!p.story[f]) fail(`story is missing '${f}'`);
}
if (!SOURCE_TYPES.includes(p.story.sourceType))
  fail(`story.sourceType '${p.story.sourceType}' is not a valid member (${SOURCE_TYPES.join(' | ')})`);
if (p.story.grading) {
  if (!['sahih', 'hasan'].includes(p.story.grading))
    fail("story.grading must be lowercase 'sahih' or 'hasan' — StoryLayer title-cases it for display");
  if (p.story.sourceType !== 'hadith_narrative')
    fail('story.grading is for hadith_narrative only — a Quranic narrative has no grading');
}
if (!/\d/.test(p.story.source))
  fail(`story.source ${J(p.story.source)} carries no number — a citation must be locatable`);

const src = fs.readFileSync(FILE, 'utf8');

const bareBefore = bareLF(src);
if (bareBefore !== 0) fail(`refusing to write: ${bareBefore} bare LF(s) already in ${FILE}`);

const TARGET = `id: '${p.contentId}'`;
const hits = src.split(TARGET).length - 1;
if (hits !== 1) fail(`expected exactly 1 match for ${TARGET}, found ${hits}`);

const objStart = src.indexOf(TARGET);
const moodsAt = src.indexOf('moods: [', objStart);
if (moodsAt === -1) fail(`could not find the moods line for ${p.contentId}`);

// The `story:` key must not already be in this object. Bound the search at the
// entry's own moods line so a story on a LATER entry cannot mask this check.
if (src.slice(objStart, moodsAt).includes('story: {'))
  fail(`${p.contentId} already carries a story — nothing written`);

const lines = [
  '    story: {',
  `      title: ${J(p.story.title)},`,
  `      body: ${J(p.story.body)},`,
  `      source: ${J(p.story.source)},`,
  `      sourceType: '${p.story.sourceType}',`,
];
if (p.story.grading) lines.push(`      grading: '${p.story.grading}',`);
lines.push('    },');
const STORY = lines.join('\r\n') + '\r\n';

// moodsAt points at `moods:`; back up over its 4-space indent so the insert
// starts at the beginning of that line.
const out = src.slice(0, moodsAt - 4) + STORY + src.slice(moodsAt - 4);

if (!out.includes('\r\n')) fail('refusing to write: the edit destroyed CRLF');
const bareAfter = bareLF(out);
if (bareAfter !== 0) fail(`refusing to write: the edit introduced ${bareAfter} bare LF(s)`);
if (out.length <= src.length) fail('refusing to write: the edit did not add content');

fs.writeFileSync(FILE, out);
console.log(`ok — story "${p.story.title}" added to ${p.contentId}`);
console.log('   ! NEXT: node scripts/verify-stories.mjs');
