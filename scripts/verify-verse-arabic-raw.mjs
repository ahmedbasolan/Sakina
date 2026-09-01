/**
 * Guard against Unicode-normalised verse text creeping into quranData.ts.
 *
 * WHY THIS EXISTS. The corpus convention is that `arabicText` is the BYTE-EXACT
 * quran.com api/v4 `text_uthmani` output plus an ayah ornament. Fifteen verses
 * were authored by fetching that text, printing it to a terminal, and typing it
 * into a payload file — and somewhere on that path it was normalised to NFC.
 * NFC is canonically equivalent, so nothing visible changed and nothing failed:
 *   - quranArabicIntegrity compares CONSONANTAL SKELETONS against quran.com, so
 *     a haraka reorder (fatha before shadda) and a precomposed alef-madda
 *     (U+0622 for U+0627 U+0653) both score identical.
 *   - the canonical lock snapshots `arabic` from our own data, so it locks in
 *     whatever it is handed.
 * The only reason it surfaced at all was a hand comparison of `arabic` against
 * the `remote` field the snapshot happens to carry alongside it.
 *
 * WHAT IT CHECKS. For every entry in the canonical snapshot, whether `arabic`
 * (minus the ayah ornament) is:
 *   raw   — byte-identical to quran.com. The standard.
 *   nfc   — differs from quran.com ONLY by Unicode NFC. A normalisation artifact.
 *   other — differs some other way. Overwhelmingly legitimate: this corpus is a
 *           richer Uthmani edition than quran.com serves (U+06ED in 73 verses,
 *           U+06E2 in 38), and multi-ayah entries span a range the single-ayah
 *           `remote` field does not.
 * It fails when the `nfc` count rises above BASELINE — a ratchet, because the
 * pre-existing 46 predate the convention being written down and rewriting them
 * is exactly the normalisation pass CLAUDE.md forbids.
 *
 * WHAT IT DOES NOT CATCH:
 *   - Anything in the `other` bucket. A genuinely wrong verse hides there just
 *     as well as a legitimately richer one. That is quranArabicIntegrity's job,
 *     and its skeleton comparison is what actually reads the text.
 *   - Verses with no audioKey — 270 arabicText-carrying blocks have none and are
 *     absent from the snapshot entirely.
 *   - Whether the ornament number matches the ayah. Not looked at.
 *   - A normalised verse that ALSO differs some other way. It lands in `other`
 *     and this check says nothing about it.
 *
 * Run `node scripts/refresh-quran-canonical.mjs` first — this reads the snapshot,
 * not the network.
 *
 * Usage:
 *   node scripts/verify-verse-arabic-raw.mjs                 check (ratchet)
 *   node scripts/verify-verse-arabic-raw.mjs --fix <id>...   repair those ids
 *   VAR_INJECT=1 node scripts/verify-verse-arabic-raw.mjs    negative mode
 *
 * --fix re-fetches from quran.com and rewrites quranData.ts, replacing the named
 * entries' arabicText with the raw bytes. It requires explicit ids: a blanket
 * repair would also rewrite the 46 pre-existing entries, which is a sweeping
 * unrelated diff over Quranic text and is not something to do as a side effect.
 * Both plain and VAR_INJECT modes exiting 0 is the green state.
 */
import fs from 'fs';
import { bareLF } from './lib/quranDataParse.mjs';

const SNAPSHOT = 'src/data/canonical/quranArabicCanonical.json';
const FILE = 'src/data/quranData.ts';
const API = 'https://api.quran.com/api/v4/verses/by_key';

// Entries whose only difference from quran.com is NFC, at the time this check
// was written. Rewriting them would be the normalisation pass CLAUDE.md forbids,
// so they are frozen rather than fixed. A new one is a regression.
const BASELINE = 46;

const fail = (msg) => { console.error(`x ${msg}`); process.exit(1); };
const ORNAMENT = /\s*[﴾﴿][0-9٠-٩]+[﴾﴿]\s*$/;

const fixAt = process.argv.indexOf('--fix');
const fix = fixAt !== -1;
const fixIds = fix ? process.argv.slice(fixAt + 1) : [];
const inject = process.env.VAR_INJECT === '1';

if (!fs.existsSync(SNAPSHOT)) fail(`${SNAPSHOT} not found — run refresh-quran-canonical.mjs first`);
const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));

// Negative mode: pick one entry that is currently byte-exact AND that NFC would
// actually change, then normalise it. Picking the first entry in the file is not
// enough — the first draft did that, hit an `other`-bucket entry, changed no
// count at all, and reported a green negative run. The injected id must be one
// whose classification genuinely moves from raw to nfc.
let injectId = null;
if (inject) {
  for (const [id, e] of Object.entries(snap)) {
    if (!e.remote) continue;
    const base = e.arabic.replace(ORNAMENT, '');
    if (base === e.remote && base.normalize('NFC') !== base) { injectId = id; break; }
  }
  if (!injectId) fail('negative mode: found no byte-exact entry that NFC would alter');
  console.log(`negative mode: normalising ${injectId}`);
}

const buckets = { raw: [], nfc: [], other: [] };
for (const [id, e] of Object.entries(snap)) {
  if (!e.remote) { buckets.other.push(id); continue; }
  let base = e.arabic.replace(ORNAMENT, '');
  if (id === injectId) base = base.normalize('NFC');
  if (base === e.remote) buckets.raw.push(id);
  else if (base === e.remote.normalize('NFC')) buckets.nfc.push(id);
  else buckets.other.push(id);
}

console.log(`${buckets.raw.length} byte-exact · ${buckets.nfc.length} NFC-only · ` +
  `${buckets.other.length} other (richer script, multi-ayah ranges)`);

if (fix) {
  if (!fixIds.length)
    fail('--fix needs explicit ids: node scripts/verify-verse-arabic-raw.mjs --fix quran_4_31 ...');
  const notNfc = fixIds.filter((id) => !buckets.nfc.includes(id));
  if (notNfc.length)
    fail(`not in the NFC-only bucket, nothing written: ${notNfc.join(', ')}`);
  buckets.nfc = fixIds;
  const src = fs.readFileSync(FILE, 'utf8');
  if (bareLF(src) !== 0) fail(`refusing to write: bare LF(s) already in ${FILE}`);

  const edits = [];
  for (const id of buckets.nfc) {
    const e = snap[id];
    const r = await (await fetch(`${API}/${e.audioKey}?fields=text_uthmani`)).json();
    const raw = r.verse && r.verse.text_uthmani;
    if (!raw) fail(`${id}: quran.com returned no text_uthmani for ${e.audioKey}`);
    const orn = (e.arabic.match(ORNAMENT) || [''])[0];
    const want = raw + orn;
    if (want === e.arabic) { console.log(`  = ${id} already raw on refetch`); continue; }
    if (e.arabic !== want.normalize('NFC'))
      fail(`${id}: current text is not the NFC of quran.com's — refusing to overwrite it blindly`);
    // Anchor on the exact current literal. It is emitted by author-angle.mjs via
    // JSON.stringify, so it is double-quoted and on one line.
    const needle = JSON.stringify(e.arabic);
    const hits = src.split(needle).length - 1;
    if (hits !== 1) fail(`${id}: expected exactly 1 occurrence of its arabicText literal, found ${hits}`);
    edits.push({ id, from: needle, to: JSON.stringify(want) });
  }
  let out = src;
  for (const ed of edits) out = out.replace(ed.from, ed.to);
  if (bareLF(out) !== 0) fail('refusing to write: the edit introduced bare LF(s)');
  fs.writeFileSync(FILE, out);
  for (const ed of edits) console.log(`  + ${ed.id} -> byte-exact quran.com text`);
  console.log(`\nrepaired ${edits.length} entr(ies). NEXT: node scripts/refresh-quran-canonical.mjs, ` +
    'read the diff, then npx jest quranArabicIntegrity');
  process.exit(0);
}

if (buckets.nfc.length > BASELINE) {
  console.error(`\nx ${buckets.nfc.length} NFC-only entries, baseline is ${BASELINE}.`);
  console.error('  arabicText must be the byte-exact quran.com text_uthmani. Retyping it, or');
  console.error('  round-tripping it through a terminal, silently normalises it.');
  console.error('  Repair with: node scripts/verify-verse-arabic-raw.mjs --fix');
  process.exit(inject ? 0 : 1);
}
if (inject) fail('negative mode: injected a normalised entry and the check did not fail');
console.log('\nNo new normalised verse text.');
