/**
 * Angle-authoring tick script — generalises the pilot script this superseded
 * (add-pilot-story.mjs, since deleted; see scripts/add-story.mjs's header).
 *
 * Handles all three tiers of the mood-pool expansion:
 *
 *   T1  the verse is already in quranData.ts AND already carries the mood.
 *       Insert the angle only.
 *   T2  the verse is present but NOT tagged for this mood. Insert the angle
 *       AND add the mood to the verse's `moods` array — without that second
 *       edit fetchForMoodLocal's double join (cm.mood AND ca.mood) leaves the
 *       angle permanently unreachable. It reads fine, it seeds fine, and no
 *       user can ever be served it.
 *   T3  the verse does not exist. Create the Content entry, then the angle.
 *
 * The declared tier is CROSS-CHECKED against the file, because the tiers are
 * distinguished by facts the script can read: a row labelled T1 whose verse
 * lacks the mood is really a T2, and shipping it as T1 is exactly how a dead
 * angle gets written.
 *
 * Everything below is a constraint from CLAUDE.md's "Editing quranData.ts by
 * script", each of which cost a broken build or a silent corruption once:
 *
 *   - A file, never `node -e`. Shell quoting mangles Arabic character classes
 *     and \s+ silently.
 *   - Located structurally, never by matching a source string.
 *   - Exactly one match asserted per anchor; NOTHING written if any assertion
 *     fails. All edits are composed in memory and written in one pass, so a
 *     T3 can never leave a verse behind without its angle.
 *   - CRLF preserved, checked before AND after.
 *   - `id` emitted with SINGLE quotes. verify-journey.mjs's objectAt finds
 *     objects with a literal indexOf("id: '" + id + "'"), so an id emitted
 *     through JSON.stringify as id: "..." is invisible to the verifier — which
 *     surfaces as dozens of failures reporting the angles as missing, none of
 *     them naming the cause.
 *   - All PROSE emitted through JSON.stringify, which double-quotes and so is
 *     apostrophe-safe. Inserting an apostrophe into a single-quoted literal
 *     ('Jami' at-Tirmidhi') terminates the string and breaks the build.
 *
 * AFTER A T3 you must run `node scripts/refresh-quran-canonical.mjs`, READ THE
 * DIFF, then `npx jest quranArabicIntegrity`. The lock fails on your own new
 * verse otherwise — and regenerating the baseline without reading the diff is
 * how a corruption gets laundered into it. This script prints the reminder but
 * cannot enforce it.
 *
 * WHAT THIS DOES NOT DO: judge the content. It checks structure, uniqueness,
 * tier consistency and shape. Whether the verse fits the mood, whether the
 * citation says what the step claims, and whether the angle speaks to the
 * reader rather than about a scholar are human reads, enforced downstream by
 * verify-mood-pools' voice pass, verify-citations, and review-mood-fit.
 *
 * Usage: node scripts/author-angle.mjs <payload.json>
 */
import fs from 'fs';
import { bareLF } from './lib/quranDataParse.mjs';

const FILE = 'src/data/quranData.ts';
const LEDGER = process.env.MOOD_LEDGER
  || 'docs/superpowers/plans/2026-08-31-mood-pools/ledger.json';
const ANGLES_ANCHOR = 'const quranContentAnglesData: ContentAngle[] = [';
const VERSES_ANCHOR = 'const quranContentData: Content[] = [';

const STEP_TYPES = ['physical', 'verbal', 'mindset'];
const SOURCE_TYPES = [
  'sunnah_action', 'prophetic_dua', 'quran_dua', 'prophetic_dhikr', 'composed_dua',
];
// Must match src/types/index.ts's HadithGrading union exactly.
const GRADINGS = ['sahih', 'hasan', 'sahih_li_ghayrihi', 'hasan_li_ghayrihi'];
const ARABIC = /[؀-ۿ]/;

const fail = (msg) => { console.error(`x ${msg}`); process.exit(1); };
const J = (v) => JSON.stringify(v);

const payloadPath = process.argv[2];
if (!payloadPath) fail('usage: node scripts/author-angle.mjs <payload.json>');
const p = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

// ── payload shape ─────────────────────────────────────────────────────────
for (const f of ['angleId', 'contentId', 'mood', 'tier', 'angle', 'action', 'reflection', 'practiceSteps']) {
  if (!p[f]) fail(`payload is missing '${f}'`);
}
if (!['T1', 'T2', 'T3'].includes(p.tier)) fail(`tier '${p.tier}' must be T1, T2 or T3`);
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
  // Matches src/types/index.ts's HadithGrading union exactly. This used to
  // check only ['sahih', 'hasan'] — two of the type's four members — which
  // forced anyone citing a correctly-graded hasan/sahih li-ghayrihi hadith to
  // either drop the grading or misreport it, changing the authenticity claim
  // the rendered badge makes.
  if (s.sourceGrading && !GRADINGS.includes(s.sourceGrading))
    fail(`practiceSteps[${i}].sourceGrading '${s.sourceGrading}' is not a valid member ` +
         `(${GRADINGS.join(', ')})`);
  if (s.source && !s.sourceType)
    fail(`practiceSteps[${i}] cites a source with no sourceType — a bare citation asserts ` +
         `provenance, so say which kind it is`);
}
for (const banned of ['actionSource', 'actionArabicText']) {
  if (p[banned]) fail(`'${banned}' is used by 0 of 245 existing mood angles — do not introduce it`);
}
if (/\[Tafsir /.test(p.angle))
  fail('angle carries a [Tafsir ...] tag — that is the journey convention; mood angles are direct address');
if (/'/.test(p.angleId)) fail('angleId must not contain an apostrophe — it is single-quoted');
if (/'/.test(p.contentId)) fail('contentId must not contain an apostrophe — it is single-quoted');

// ── read the file and locate everything BEFORE writing anything ───────────
const src = fs.readFileSync(FILE, 'utf8');
if (!src.includes('\r\n')) fail('refusing to write: CRLF line endings are already gone');

// COUNT bare LFs (bareLF, from scripts/lib/quranDataParse.mjs), do not merely
// assert that CRLF still exists somewhere. The existence check is what
// CLAUDE.md prescribes as insufficient: a one-off edit script wrapped a
// single field onto a new line with '\n' and still passed, because 18,983
// other lines were fine. Only git caught it. The file is 100% CRLF, so the
// correct invariant is zero.
const bareBefore = bareLF(src);
if (bareBefore !== 0) fail(`refusing to write: ${bareBefore} bare LF(s) already in ${FILE}`);

const idHits = src.split(`id: '${p.angleId}'`).length - 1;
if (idHits !== 0)
  fail(`angle id ${p.angleId} already exists (${idHits} match) — reusing an id puts two entries ` +
       `under one id into the seeder`);

const verseHits = src.split(`id: '${p.contentId}'`).length - 1;
if (verseHits > 1) fail(`found ${verseHits} verses with id ${p.contentId} — expected 0 or 1`);

/** Bounds of the object literal whose `id: '<id>'` appears in src. */
function objectBounds(id) {
  const at = src.indexOf(`id: '${id}'`);
  if (at === -1) return null;
  let open = at;
  while (src[open] !== '{') open--;
  let d = 0, q = null, end = -1;
  for (let k = open; k < src.length; k++) {
    const c = src[k];
    if (q) { if (c === '\\') k++; else if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') d++;
    else if (c === '}') { d--; if (!d) { end = k; break; } }
  }
  return { open, end };
}

// ── tier cross-check against reality ──────────────────────────────────────
let verseMoods = null;
let moodsEdit = null;

if (verseHits === 1) {
  if (p.tier === 'T3')
    fail(`tier T3 declared but ${p.contentId} already exists — T3 is for a verse that is not in ` +
         `the corpus. Reuse the existing verse as T1 or T2.`);

  const b = objectBounds(p.contentId);
  const body = src.slice(b.open, b.end + 1);
  const m = body.match(/moods: \[([^\]]*)\]/);
  if (!m) fail(`${p.contentId} has no moods array`);
  verseMoods = m[1].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean);

  const hasMood = verseMoods.includes(p.mood);
  if (p.tier === 'T1' && !hasMood)
    fail(`tier T1 declared but ${p.contentId} is not tagged '${p.mood}' (tags: ${verseMoods.join(', ')}). ` +
         `That makes this a T2 — without the moods edit the angle would be unreachable.`);
  if (p.tier === 'T2' && hasMood)
    fail(`tier T2 declared but ${p.contentId} is already tagged '${p.mood}' — that makes this a T1.`);

  if (p.tier === 'T2') {
    if (verseMoods.length >= 3)
      fail(`${p.contentId} already carries ${verseMoods.length} mood tags (${verseMoods.join(', ')}). ` +
           `The cap is 3 — review-mood-fit flags 4+ as a verse tagged by theme rather than by ` +
           `what the reader is feeling.`);
    const next = [...verseMoods, p.mood];
    moodsEdit = {
      from: m[0],
      to: `moods: [${next.map((x) => `'${x}'`).join(', ')}]`,
      at: b.open + m.index,
    };
  }
} else {
  if (p.tier !== 'T3')
    fail(`tier ${p.tier} declared but ${p.contentId} does not exist — only T3 creates a verse`);
  if (!p.verse) fail('tier T3 requires a `verse` object in the payload');
  for (const f of ['primaryText', 'arabicText', 'transliteration', 'englishTranslation', 'source', 'audioKey', 'whyThis']) {
    if (!p.verse[f]) fail(`verse is missing '${f}'`);
  }
  if (!ARABIC.test(p.verse.arabicText))
    fail('verse.arabicText contains no Arabic script — it must be the Uthmani text, fetched');
  if (!/\d+:\d+/.test(p.verse.source))
    fail(`verse.source '${p.verse.source}' has no surah:ayah reference`);

  // Byte-compare arabicText against a FRESH quran.com fetch, for single-ayah
  // audioKeys. This is the check that was missing when 14 verses across two
  // batches were typed/terminal-round-tripped and silently NFC-normalised
  // before reaching this file — nothing else in the pipeline catches it at
  // write time: quranArabicIntegrity compares consonantal SKELETONS (an NFC
  // reorder doesn't change one), and the canonical lock snapshots whatever
  // this script hands it. verify-verse-arabic-raw.mjs audits for the drift
  // AFTER the fact, which only works if someone remembers to run it; this
  // stops the bad text from being written in the first place.
  //
  // Multi-ayah audioKeys ('20:25-26') are skipped rather than guessed at —
  // this script has no established convention for how the ornament/joining
  // is formatted across a range, and a wrong guess here would false-fail a
  // legitimate multi-ayah T3 rather than catch a real one.
  const singleAyah = p.verse.audioKey.match(/^(\d+):(\d+)$/);
  if (singleAyah) {
    const [, surah, ayah] = singleAyah;
    let fetched, fetchError;
    try {
      const r = await (await fetch(
        `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?fields=text_uthmani`,
      )).json();
      fetched = r.verse && r.verse.text_uthmani;
    } catch (e) {
      fetchError = e;
    }
    // process.exit() called too soon after an awaited fetch() races undici's
    // socket-close handle on Windows — `Assertion failed: !(handle->flags &
    // UV_HANDLE_CLOSING), file src\win\async.c` — a libuv platform quirk, not
    // a logic bug: the message and exit code this produces are both correct
    // either way, but the crash trace is alarming noise, and it is NOT
    // confined to a fail() called right here — a plain synchronous fail()
    // reached much later in this same run (the ledger-row check, hundreds of
    // lines below, on an entirely successful arabicText match) crashed the
    // same way, because nothing between here and there ever yields to the
    // event loop for the handle to actually finish closing. So the wait goes
    // here, unconditionally, before either outcome — not wrapped around each
    // individual fail() downstream. 20ms was not enough to reliably avoid it
    // (still crashed); 300ms did, confirmed over repeated runs of both the
    // pass and the fail case.
    await new Promise((r) => setTimeout(r, 300));
    if (fetchError) fail(`could not verify verse.arabicText against quran.com (network): ${fetchError.message}`);
    if (!fetched) fail(`quran.com returned no text_uthmani for ${surah}:${ayah}`);
    // quran.com prefixes a leading space on the first ayah of a surah (proven
    // against the live canonical snapshot: quran_23_1's own `remote` field
    // carries it while the corpus's `arabic` does not) — strip it so a
    // correctly-authored surah-opener doesn't fail this check for matching
    // the established convention instead of the raw API response.
    const want = `${fetched.trimStart()} ﴿${ayah}﴾`;
    if (p.verse.arabicText !== want) {
      const nfcOnly = p.verse.arabicText.normalize('NFC') === want.normalize('NFC');
      fail(
        `verse.arabicText does not byte-match quran.com for ${surah}:${ayah}` +
        (nfcOnly
          ? ' — it is the NFC-NORMALISED form (the exact drift this check exists to catch). ' +
            'Re-fetch fresh from quran.com and paste the raw JSON value; do not retype it.'
          : '.') +
        `\n  got : ${p.verse.arabicText}\n  want: ${want}`,
      );
    }
  } else {
    console.log(`   ! ${p.verse.audioKey} is a multi-ayah range — arabicText NOT byte-verified ` +
      `against quran.com; check it by hand`);
  }
}

// ── locate insertion points ───────────────────────────────────────────────
const anglesAt = src.indexOf(ANGLES_ANCHOR);
if (anglesAt === -1) fail(`could not find the angles array anchor: ${ANGLES_ANCHOR}`);
const versesAt = src.indexOf(VERSES_ANCHOR);
if (versesAt === -1) fail(`could not find the verses array anchor: ${VERSES_ANCHOR}`);
if (versesAt > anglesAt) fail('verses array does not precede the angles array — layout changed');

const exportAt = src.indexOf('export { quranContent', anglesAt);
if (exportAt === -1) fail('could not find the export line after the angles array');
const anglesClose = src.lastIndexOf('];', exportAt);
if (anglesClose === -1 || anglesClose < anglesAt) fail('could not find the angles array terminator');
const versesClose = src.lastIndexOf('];', anglesAt);
if (versesClose === -1 || versesClose < versesAt) fail('could not find the verses array terminator');

// ── emit ──────────────────────────────────────────────────────────────────
function verseBlock() {
  const v = p.verse;
  const lines = [
    '  {',
    `    id: '${p.contentId}',`,
    "    type: 'Quran',",
    `    primaryText: ${J(v.primaryText)},`,
    `    arabicText: ${J(v.arabicText)},`,
    `    transliteration: ${J(v.transliteration)},`,
    `    englishTranslation: ${J(v.englishTranslation)},`,
    `    source: ${J(v.source)},`,
    `    audioKey: ${J(v.audioKey)},`,
    `    whyThis: ${J(v.whyThis)},`,
    `    moods: ['${p.mood}'],`,
    '  },',
  ];
  return lines.join('\r\n') + '\r\n';
}

function angleBlock() {
  const lines = [
    '  {',
    `    id: '${p.angleId}',`,
    `    contentId: '${p.contentId}',`,
    `    mood: '${p.mood}',`,
    `    angle: ${J(p.angle)},`,
  ];
  if (p.angleSource) lines.push(`    angleSource: ${J(p.angleSource)},`);
  lines.push(`    action: ${J(p.action)},`);
  // JSON is a subset of JS object-literal syntax, so the stringified array is
  // a valid literal argument — matching the file's existing
  // `practiceSteps: JSON.stringify([...])` shape.
  lines.push(`    practiceSteps: JSON.stringify(${J(p.practiceSteps)}),`);
  lines.push(`    reflection: ${J(p.reflection)},`);
  lines.push('  },');
  return lines.join('\r\n') + '\r\n';
}

// Compose every edit against the ORIGINAL string, applying from the highest
// offset down so earlier offsets stay valid. One write at the end — a T3 can
// never leave a verse behind without its angle.
const edits = [{ at: anglesClose, del: 0, ins: angleBlock() }];
if (p.tier === 'T3') edits.push({ at: versesClose, del: 0, ins: verseBlock() });
if (moodsEdit) edits.push({ at: moodsEdit.at, del: moodsEdit.from.length, ins: moodsEdit.to });

edits.sort((a, b) => b.at - a.at);
let out = src;
for (const e of edits) out = out.slice(0, e.at) + e.ins + out.slice(e.at + e.del);

if (!out.includes('\r\n')) fail('refusing to write: the edit destroyed CRLF');
const bareAfter = bareLF(out);
if (bareAfter !== 0) fail(`refusing to write: the edit introduced ${bareAfter} bare LF(s)`);
if (out.length <= src.length) fail('refusing to write: the edit did not add content');

// ── resolve the ledger row BEFORE writing anything ────────────────────────
// This lookup used to run after the file write, so a payload with no matching
// row exited 1 having already edited quranData.ts and told the operator to
// `git checkout` it by hand — pushing cleanup onto a human that the code can
// do, and, in a loop, leaving the angle in the file while the ledger still
// said `pending` so the next tick tried to insert it again.
let ledger = null;
let row = null;
if (fs.existsSync(LEDGER)) {
  ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
  row = ledger.units.find((u) => u.angleId === p.angleId);
  if (!row) {
    row = ledger.units.find(
      (u) => u.mood === p.mood && u.tier === p.tier && u.angleId === null && u.status === 'pending');
    if (!row)
      fail(`no pending ${p.tier} ledger row for ${p.mood} — nothing written. Either the tier is ` +
           `wrong for this row, or ${p.mood} has no ${p.tier} work left.`);
    row.angleId = p.angleId;
    row.contentId = p.contentId;
  } else if (row.status === 'committed') {
    fail(`ledger row for ${p.angleId} is already 'committed' — nothing written`);
  }
}

fs.writeFileSync(FILE, out);

if (row) {
  row.status = 'drafted';
  if (p.citations) row.citations = p.citations;
  fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + '\n');
  console.log(`ok — ${p.angleId} inserted (${p.tier}), ledger row -> drafted`);
} else {
  console.log(`ok — ${p.angleId} inserted (${p.tier}; no ledger at ${LEDGER})`);
}

if (p.tier === 'T2') {
  console.log(`   + ${p.contentId} moods: ${verseMoods.join(', ')} -> ${[...verseMoods, p.mood].join(', ')}`);
}
if (p.tier === 'T3') {
  console.log(`   + created verse ${p.contentId} (${p.verse.source})`);
  console.log('   ! NEXT: node scripts/refresh-quran-canonical.mjs, READ THE DIFF, then ' +
              'npx jest quranArabicIntegrity');
}
