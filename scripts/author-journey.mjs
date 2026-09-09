/**
 * author-journey.mjs — inserts a whole journey's angles, any new verses, and
 * its hadith entries in ONE atomic pass.
 *
 * `author-angle.mjs` is the MOOD-angle tool and deliberately rejects journey
 * work: it caps practiceSteps at exactly 3 (journeys run 3-6) and fails any
 * angle carrying a `[Tafsir ...]` tag, which is the journey convention. So the
 * two scripts are siblings, not variants, and every constraint from CLAUDE.md's
 * "Editing quranData.ts by script" is re-implemented here rather than shared,
 * because sharing would mean loosening author-angle's guards.
 *
 * Constraints enforced, each of which cost a broken build or a silent
 * corruption at least once:
 *
 *   - A file, never `node -e`. Shell quoting mangles Arabic character classes
 *     and \s+ silently. (This bit twice while writing THIS script.)
 *   - Located structurally, by array terminator, never by matching prose.
 *   - Every assertion runs BEFORE anything is written, and both files are
 *     written in one pass at the end, so a failure can never leave quranData
 *     edited while hadithData is not.
 *   - CRLF preserved: bare LFs COUNTED before and after, on both files, and
 *     the invariant is zero. Merely asserting `includes('\r\n')` is what
 *     CLAUDE.md calls out as insufficient — 18,983 correct lines hide one bad
 *     join, and only git's warning catches it.
 *   - `id` emitted with SINGLE quotes. verify-journey.mjs's objectAt finds
 *     objects by a literal indexOf("id: '" + id + "'"), so an id emitted via
 *     JSON.stringify is invisible to the verifier — which surfaces as the
 *     angles being reported missing AND the days reported as borrowing mood
 *     angles: dozens of failures, one cause, none of the messages naming it.
 *   - All PROSE through JSON.stringify, which double-quotes and is therefore
 *     apostrophe-safe ("Jami' at-Tirmidhi" would otherwise close the literal).
 *
 * WHAT THIS DOES NOT CHECK — read before treating a green run as "the journey
 * is correct", because the gap is the important half:
 *
 *   - It cannot tell you the angle's claim is what the named tafsir actually
 *     says. It checks the tag's SHAPE and position, nothing about its truth.
 *     verify-tafsir-tags.mjs checks the entry exists and is on-topic; only
 *     reading the entry checks the claim.
 *   - It cannot tell you a citation is the right hadith for the text above it.
 *     It checks a source string is present and non-empty. verify-citations.mjs
 *     does the text comparison.
 *   - It cannot tell you an `instruction` asserts fiqh the source never said.
 *     That is CLAUDE.md rule 7 and it is a human read.
 *   - It does not touch staticPaths.ts, PathsScreen.tsx, contentRepository.ts
 *     or SEED_VERSION. A journey inserted by this script is INERT until those
 *     four are edited by hand.
 *
 * Usage: node scripts/author-journey.mjs <payload.json>
 */
import fs from 'fs';
import { bareLF } from './lib/quranDataParse.mjs';

const QURAN = 'src/data/quranData.ts';
const HADITH = 'src/data/hadithData.ts';

const STEP_TYPES = new Set(['physical', 'verbal', 'mindset']);
const GRADINGS = new Set(['sahih', 'hasan', 'sahih_li_ghayrihi', 'hasan_li_ghayrihi']);
const ARABIC = /[؀-ۿ]/;

// Mirrors ContextLayer.splitIntoSections. Kept in the same order, because the
// component takes the FIRST pattern that matches, not the earliest position —
// so which pattern is present changes where the Understand/Matters cut lands.
const SPLIT = [
  /\.\s+The Prophet\s+ﷺ\s+said:/, /\.\s+The Prophet\s+ﷺ\s+would/,
  /\.\s+The Prophet\s+ﷺ\s+used to/, /\.\s+The Prophet\s+ﷺ\s+never/,
  /\.\s+The Prophet\s+ﷺ\s+himself/, /\.\s+The Prophet\s+ﷺ\s+was/,
  /\.\s+Your\s/, /\.\s+When you/, /\.\s+Despair/, /\.\s+Being an ally/,
  /\.\s+No sadness/, /\.\s+Even when/,
];

const fail = (msg) => { console.error(`x ${msg}`); process.exit(1); };
const J = (v) => JSON.stringify(v);

// ── unions read from source, never hardcoded ──────────────────────────────
// verify-journey.mjs's literal icon list drifted 11 names behind Icon.tsx and
// rejected 52 angles that render perfectly well. Derive, don't copy.
const iconUnion = fs.readFileSync('src/components/Icon.tsx', 'utf8').match(/export type IconName =[\s\S]*?;/);
if (!iconUnion) fail('could not find the IconName union in src/components/Icon.tsx');
const ICONS = new Set([...iconUnion[0].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]));

const srctUnion = fs.readFileSync('src/types/index.ts', 'utf8').match(/export type PracticeSourceType =[\s\S]*?;/);
if (!srctUnion) fail('could not find the PracticeSourceType union in src/types/index.ts');
const SRCT = new Set([...srctUnion[0].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]));

const moodUnion = fs.readFileSync('src/types/index.ts', 'utf8').match(/export type Mood =[\s\S]*?;/);
if (!moodUnion) fail('could not find the Mood union in src/types/index.ts');
const MOODS = new Set([...moodUnion[0].matchAll(/'([A-Za-z]+)'/g)].map((m) => m[1]));

// ── payload ───────────────────────────────────────────────────────────────
const payloadPath = process.argv[2];
if (!payloadPath) fail('usage: node scripts/author-journey.mjs <payload.json>');
const p = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

for (const f of ['anglePrefix', 'theme', 'days']) if (!p[f]) fail(`payload is missing '${f}'`);
if (!MOODS.has(p.theme)) fail(`theme '${p.theme}' is not a member of the Mood union (${[...MOODS].join(', ')})`);
if (!Array.isArray(p.days) || !p.days.length) fail('payload.days must be a non-empty array');

const quranSrc = fs.readFileSync(QURAN, 'utf8');
const hadithSrc = fs.readFileSync(HADITH, 'utf8');

for (const [file, src] of [[QURAN, quranSrc], [HADITH, hadithSrc]]) {
  if (!src.includes('\r\n')) fail(`refusing to write: CRLF is already gone from ${file}`);
  const n = bareLF(src);
  if (n !== 0) fail(`refusing to write: ${n} bare LF(s) already in ${file}`);
}

const seenContent = new Map(), seenDua = new Map(), seenHadSource = new Map();
const newVerses = [], newHadiths = [], newAngles = [];

for (const d of p.days) {
  const at = `day ${d.day}`;
  for (const f of ['day', 'angleId', 'contentId', 'angle', 'reflection', 'practiceSteps']) {
    if (!d[f]) fail(`${at} is missing '${f}'`);
  }
  if (!d.angleId.startsWith(p.anglePrefix)) {
    fail(`${at}: angleId '${d.angleId}' does not start with '${p.anglePrefix}' — verify-journey ` +
         `reports a mismatched prefix as a BORROWED MOOD ANGLE, which is a different, scarier bug`);
  }
  for (const idf of ['angleId', 'contentId', 'hadithContentId']) {
    if (d[idf] && d[idf].includes("'")) fail(`${at}: ${idf} contains an apostrophe — ids are single-quoted`);
  }

  // Angle ids must be globally new: two entries under one id reach the seeder.
  if (quranSrc.includes(`id: '${d.angleId}'`)) fail(`${at}: angle id ${d.angleId} already exists`);
  if (newAngles.some((a) => a.angleId === d.angleId)) fail(`${at}: angle id ${d.angleId} duplicated in payload`);

  // CLAUDE.md 1b: no verse twice inside one journey.
  if (seenContent.has(d.contentId)) fail(`${at}: verse ${d.contentId} already used on day ${seenContent.get(d.contentId)}`);
  seenContent.set(d.contentId, d.day);

  const verseHits = quranSrc.split(`id: '${d.contentId}'`).length - 1;
  if (verseHits > 1) fail(`${at}: found ${verseHits} verses with id ${d.contentId} — expected 0 or 1`);
  if (verseHits === 0) {
    if (!d.verse) fail(`${at}: ${d.contentId} does not exist and no 'verse' object was supplied`);
    for (const f of ['primaryText', 'arabicText', 'transliteration', 'englishTranslation', 'source', 'audioKey']) {
      if (!d.verse[f]) fail(`${at}: verse is missing '${f}'`);
    }
    if (!ARABIC.test(d.verse.arabicText)) fail(`${at}: verse.arabicText has no Arabic — it must be fetched Uthmani text`);
    newVerses.push({ contentId: d.contentId, ...d.verse });
  } else if (d.verse) {
    fail(`${at}: ${d.contentId} already exists but a 'verse' object was supplied — reuse it, do not redefine it`);
  }

  // Tafsir tag: present, and at index 0. Mid-string it strips to a stranded
  // space before the punctuation ("instead of it .").
  const tag = (d.angle.match(/\[Tafsir\s+[^\]]+\]/) || [])[0];
  if (!tag) fail(`${at}: angle has no [Tafsir ...] tag — the footnote would fall back to the verse whyThis`);
  if (d.angle.indexOf(tag) !== 0) fail(`${at}: tafsir tag is not at the very start of the angle string`);

  if (!SPLIT.some((r) => r.test(d.angle))) {
    fail(`${at}: angle matches no ContextLayer split pattern — Understand/Matters would fall back ` +
         `to an arbitrary 60% sentence cut. Add one of: ". Your ", ". When you", ". The Prophet ﷺ said:"`);
  }

  if (!Array.isArray(d.practiceSteps) || d.practiceSteps.length < 3 || d.practiceSteps.length > 6) {
    fail(`${at}: practiceSteps must be 3-6 (got ${d.practiceSteps?.length})`);
  }
  for (const [i, s] of d.practiceSteps.entries()) {
    const wh = `${at} step[${i}] "${s.title ?? '?'}"`;
    for (const f of ['type', 'icon', 'title', 'instruction']) if (!s[f]) fail(`${wh} is missing '${f}'`);
    if (!STEP_TYPES.has(s.type)) fail(`${wh}: bad type '${s.type}'`);
    if (!ICONS.has(s.icon)) fail(`${wh}: '${s.icon}' is not in the IconName union`);
    if (!s.source) fail(`${wh}: every practice step needs a source`);
    if (s.sourceType && !SRCT.has(s.sourceType)) fail(`${wh}: bad sourceType '${s.sourceType}'`);
    if (s.sourceGrading && !GRADINGS.has(s.sourceGrading)) fail(`${wh}: bad sourceGrading '${s.sourceGrading}'`);
    // CLAUDE.md: the fallback path must never assert an authenticity category
    // over app-written wording. A "Reflects X" source is app prose ABOUT a
    // hadith, so it must not carry a sourceType badge.
    if (/^Reflects /.test(s.source) && s.sourceType) {
      fail(`${wh}: a "Reflects ..." source is app-written framing — it must not claim a sourceType`);
    }
    if (s.arabicText) {
      const norm = s.arabicText.replace(/\s+/g, ' ').trim();
      if (seenDua.has(norm)) fail(`${at}: du'a repeats day ${seenDua.get(norm)} — CLAUDE.md requires one per day`);
      seenDua.set(norm, d.day);
    }
  }

  if (d.hadithContentId) {
    if (hadithSrc.includes(`id: '${d.hadithContentId}'`)) fail(`${at}: hadith id ${d.hadithContentId} already exists`);
    // Mirrors the angleId guard above. Without it a copied day block whose id
    // was not bumped writes TWO entries under one id: the file check passes
    // (neither exists yet) and seenHadSource does not fire when the two
    // `source` strings differ. That is CLAUDE.md rule 8 exactly.
    if (newHadiths.some((h) => h.hadithContentId === d.hadithContentId)) {
      fail(`${at}: hadith id ${d.hadithContentId} duplicated in payload`);
    }
    if (!d.hadith) fail(`${at}: hadithContentId given but no 'hadith' object supplied`);
    for (const f of ['primaryText', 'arabicText', 'englishTranslation', 'source', 'transliteration']) {
      if (!d.hadith[f]) fail(`${at}: hadith is missing '${f}'`);
    }
    if (!ARABIC.test(d.hadith.arabicText)) fail(`${at}: hadith.arabicText has no Arabic`);
    // CLAUDE.md 1b: no hadith SOURCE twice in one journey (ids are per-day, so
    // a duplicate hides behind a distinct-looking id).
    if (seenHadSource.has(d.hadith.source)) {
      fail(`${at}: hadith source '${d.hadith.source}' already used on day ${seenHadSource.get(d.hadith.source)}`);
    }
    seenHadSource.set(d.hadith.source, d.day);
    newHadiths.push({ hadithContentId: d.hadithContentId, ...d.hadith });
  }

  newAngles.push({ angleId: d.angleId, contentId: d.contentId, angle: d.angle,
                   practiceSteps: d.practiceSteps, reflection: d.reflection });
}

// ── byte-check every NEW verse against quran.com ──────────────────────────
// The convention is `${text_uthmani} ﴿${ayah}﴾`. This is the check that was
// missing when 14 verses were silently NFC-normalised: quranArabicIntegrity
// compares consonantal SKELETONS (a reorder does not change one) and the
// canonical lock snapshots whatever it is handed, so nothing downstream sees it.
for (const v of newVerses) {
  const single = v.audioKey.match(/^(\d+):(\d+)$/);
  if (!single) { console.log(`·  ${v.contentId}: multi-ayah audioKey '${v.audioKey}' — byte-check skipped`); continue; }
  const [, surah, ayah] = single;
  let fetched, err;
  try {
    const r = await (await fetch(`https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?fields=text_uthmani`)).json();
    fetched = r.verse && r.verse.text_uthmani;
  } catch (e) { err = e; }
  // libuv/undici socket-close race on Windows: yield before any exit path.
  await new Promise((r) => setTimeout(r, 300));
  if (err) fail(`could not verify ${v.contentId} against quran.com (network): ${err.message}`);
  if (!fetched) fail(`quran.com returned no text_uthmani for ${surah}:${ayah}`);
  const want = `${fetched.trimStart()} ﴿${ayah}﴾`;
  if (v.arabicText !== want) {
    const nfcOnly = v.arabicText.normalize('NFC') === want.normalize('NFC');
    fail(`${v.contentId} arabicText does not byte-match quran.com for ${surah}:${ayah}` +
         (nfcOnly ? ' — it is the NFC-NORMALISED form, the exact drift this check exists to catch.' : '.') +
         `\n  got : ${v.arabicText}\n  want: ${want}`);
  }
  console.log(`ok byte-match ${v.contentId} (${surah}:${ayah})`);
}

// ── locate array terminators ──────────────────────────────────────────────
const versesAt = quranSrc.indexOf('const quranContentData: Content[] = [');
const anglesAt = quranSrc.indexOf('const quranContentAnglesData: ContentAngle[] = [');
if (versesAt === -1 || anglesAt === -1) fail('could not find the quranData.ts array anchors');
const exportAt = quranSrc.indexOf('export { quranContent', anglesAt);
if (exportAt === -1) fail('could not find the export line after the angles array');
const anglesClose = quranSrc.lastIndexOf('];', exportAt);
const versesClose = quranSrc.lastIndexOf('];', anglesAt);
if (anglesClose < anglesAt) fail('could not find the angles array terminator');
if (versesClose < versesAt) fail('could not find the verses array terminator');

const hadithAt = hadithSrc.indexOf('export const hadithContent: Content[] = [');
if (hadithAt === -1) fail('could not find the hadithContent anchor');
const hadithClose = hadithSrc.indexOf('\r\n];', hadithAt);
if (hadithClose === -1) fail('could not find the hadithContent terminator');

// ── emit ──────────────────────────────────────────────────────────────────
const L = (lines) => lines.join('\r\n') + '\r\n';

const verseBlock = (v) => L([
  '  {',
  `    id: '${v.contentId}',`,
  "    type: 'Quran',",
  `    primaryText: ${J(v.primaryText)},`,
  `    arabicText: ${J(v.arabicText)},`,
  `    transliteration: ${J(v.transliteration)},`,
  `    englishTranslation: ${J(v.englishTranslation)},`,
  `    source: ${J(v.source)},`,
  `    audioKey: ${J(v.audioKey)},`,
  ...(v.whyThis ? [`    whyThis: ${J(v.whyThis)},`] : []),
  // Journey-only verses carry no mood tags: an entry tagged for a mood it has
  // no mood-ANGLE for joins to nothing and is served to no one.
  '    moods: [],',
  '  },',
]);

const angleBlock = (a) => L([
  '  {',
  `    id: '${a.angleId}',`,
  `    contentId: '${a.contentId}',`,
  `    mood: '${p.theme}',`,
  `    angle: ${J(a.angle)},`,
  `    practiceSteps: JSON.stringify(${J(a.practiceSteps)}),`,
  `    reflection: ${J(a.reflection)},`,
  '  },',
]);

const hadithBlock = (h) => L([
  '  {',
  `    id: '${h.hadithContentId}',`,
  "    type: 'Hadith',",
  `    primaryText: ${J(h.primaryText)},`,
  `    arabicText: ${J(h.arabicText)},`,
  `    translation: ${J(h.englishTranslation)},`,
  `    englishTranslation: ${J(h.englishTranslation)},`,
  `    source: ${J(h.source)},`,
  `    transliteration: ${J(h.transliteration)},`,
  ...(h.whyThis ? [`    whyThis: ${J(h.whyThis)},`] : []),
  ...(h.propheticPractice ? [
    '    propheticPractice: {',
    `      description: ${J(h.propheticPractice.description)},`,
    `      source: ${J(h.propheticPractice.source)},`,
    ...(h.propheticPractice.grading ? [`      grading: ${J(h.propheticPractice.grading)},`] : []),
    '    },',
  ] : []),
  '    moods: [],',
  '  },',
]);

// Compose against the ORIGINAL strings, applying from the highest offset down
// so earlier offsets stay valid.
const qEdits = [{ at: anglesClose, ins: newAngles.map(angleBlock).join('') }];
if (newVerses.length) qEdits.push({ at: versesClose, ins: newVerses.map(verseBlock).join('') });
qEdits.sort((a, b) => b.at - a.at);
let qOut = quranSrc;
for (const e of qEdits) qOut = qOut.slice(0, e.at) + e.ins + qOut.slice(e.at);

let hOut = hadithSrc;
if (newHadiths.length) {
  const insAt = hadithClose + 2; // just after the \r\n, before the ']'
  hOut = hadithSrc.slice(0, insAt) + newHadiths.map(hadithBlock).join('') + hadithSrc.slice(insAt);
}

for (const [file, before, after] of [[QURAN, quranSrc, qOut], [HADITH, hadithSrc, hOut]]) {
  if (after === before && file === QURAN) fail('refusing to write: quranData.ts edit added nothing');
  if (!after.includes('\r\n')) fail(`refusing to write: the edit destroyed CRLF in ${file}`);
  const n = bareLF(after);
  if (n !== 0) fail(`refusing to write: the edit introduced ${n} bare LF(s) into ${file}`);
}

fs.writeFileSync(QURAN, qOut);
if (newHadiths.length) fs.writeFileSync(HADITH, hOut);

console.log(`\nok — ${newAngles.length} angle(s), ${newVerses.length} verse(s), ${newHadiths.length} hadith`);
if (newVerses.length) {
  console.log('!  NEXT: node scripts/refresh-quran-canonical.mjs, READ THE DIFF, then npx jest quranArabicIntegrity');
}
console.log('!  This script does NOT wire the journey. staticPaths.ts, PathsScreen.tsx,');
console.log('   contentRepository.ts (JOURNEY_ANGLE_PREFIXES) and SEED_VERSION are still yours.');
