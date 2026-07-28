/**
 * Citation verifier — does a practice step's Arabic actually appear in the ayah
 * its `source` claims?
 *
 * Only steps whose source ASSERTS the text is Quranic are checked ("… — Quran",
 * "Quran X:Y", "… — Dua of …"). Sources that merely reference a verse for
 * context ("Divine Name … — Surah X", "Suggested wording — the theme of …")
 * are skipped: they make no claim to be quoting. That distinction is the whole
 * point — before it existed, ~35 steps showed a dhikr, a Divine Name or an
 * app-composed supplication under a label that read as scripture.
 *
 * Normalisation notes, learned the hard way:
 *   - The strip class must never contain Arabic letters. An earlier version used
 *     U+061A-U+0670, which swallows the entire alphabet and made every
 *     comparison trivially pass.
 *   - ى and ي must unify onto ONE symbol. Mapping ى->ا looks right for عَلَىٰ but
 *     breaks فَبِأَيِّ / فَبِأَىِّ, which is far more common.
 *   - Strip spaces BEFORE collapsing repeated alef, or "يَا أَيَّتُهَا" keeps a
 *     doubled alef that the Uthmani "يَـٰٓأَيَّتُهَا" does not have.
 *
 * Run: node scripts/verify-citations.mjs
 */
import fs from 'fs';

const STRIP = /[ً-ٟؐ-ؚۖ-ۭـ]/g;
const bare = (s) => (s || '')
  .normalize('NFC')
  .replace(/ىٰ/g, 'ا')
  .replace(/ٰ/g, 'ا')
  .replace(STRIP, '')
  .replace(/[آأإٱ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ء/g, '')
  .replace(/\s+/g, '')
  .replace(/ا{2,}/g, 'ا')
  .trim();

// Guard against the two ways this normaliser has silently broken before.
if (bare('مُحَمَّد') === '') {
  console.error('normaliser self-test failed: the strip class is eating letters');
  process.exit(1);
}
if (bare('سَلَامٌ') !== bare('سَلَـٰمٌ')) {
  console.error('normaliser self-test failed: superscript alef not unified');
  process.exit(1);
}

// Correct quotes the normaliser cannot bridge: each differs from the Uthmani
// only by a written alef where the mushaf uses a superscript alef
// (ذلك/ذَٰلِك, هذا/هَـٰذَا, على/عَلَىٰ). Verified by eye against quran.com.
const KNOWN_ORTHOGRAPHIC = new Set([
  'q_angle_10_58_energized_angle|Rejoice in faith',
  'q_angle_25_63_content|Alhamdulillah for character',
  'q_angle_66_8_guilty|Dua for perfect light',
  // ٱلرَّحْمَـٰنِ vs الرَّحْمَنِ — the basmala, verbatim 1:1, in standard
  // orthography like the rest of the practiceSteps corpus.
  'q_angle_9_105_energized|Intention of worship',
  'q_angle_67_2_energized|Intention of Ihsan',
]);

const src = fs.readFileSync('src/data/quranData.ts', 'utf8');
function objects(prefix) {
  const out = [];
  for (const m of src.matchAll(new RegExp(`id: '(${prefix}[a-zA-Z0-9_]+)'`, 'g'))) {
    let o = m.index; while (src[o] !== '{') o--;
    let d = 0, q = null, e = -1;
    for (let k = o; k < src.length; k++) {
      const c = src[k];
      if (q) { if (c === '\\') k++; else if (c === q) q = null; continue; }
      if (c === "'" || c === '"' || c === '`') { q = c; continue; }
      if (c === '{') d++; else if (c === '}') { d--; if (!d) { e = k; break; } }
    }
    out.push({ id: m[1], body: src.slice(o, e + 1) });
  }
  return out;
}

const cache = new Map();
async function ayah(ref) {
  if (!cache.has(ref)) {
    const v = await (await fetch(`https://api.quran.com/api/v4/verses/by_key/${ref}?fields=text_uthmani`)).json();
    cache.set(ref, v.verse?.text_uthmani ?? '');
  }
  return cache.get(ref);
}

const bad = [];
let checked = 0;
for (const o of objects('q_angle_')) {
  const raw = o.body.match(/practiceSteps:\s*JSON\.stringify\(([\s\S]*?)\n\s*\]\),/);
  if (!raw) continue;
  let steps;
  try { steps = eval(raw[1] + '\n]'); } catch { continue; }
  for (const st of steps) {
    if (!st.arabicText || !st.source) continue;
    const m = st.source.match(/(\d+):(\d+)(?:-(\d+))?/);
    if (!m) continue;
    const asserts = /—\s*Quran\s*$/.test(st.source)
      || /^Quran \d+:\d+/.test(st.source)
      || /—\s*Dua of/.test(st.source);
    if (!asserts) continue;
    if (KNOWN_ORTHOGRAPHIC.has(`${o.id}|${st.title}`)) continue;
    checked++;
    const refs = [];
    const end = m[3] ? +m[3] : +m[2];
    for (let i = +m[2]; i <= end; i++) refs.push(`${m[1]}:${i}`);
    let joined = '';
    for (const r of refs) joined += ' ' + await ayah(r);
    if (bare(joined).includes(bare(st.arabicText))) continue;
    bad.push({ id: o.id, title: st.title, src: st.source });
  }
}

console.log(`checked ${checked} asserted-Quran steps; ${bad.length} whose Arabic is NOT in the cited ayah`);
for (const r of bad) console.log(`  ${r.id}  ·  ${r.title}  ·  ${r.src}`);

// ── Pass 2: a step typed as carrying a chain must cite one that can be found ──
//
// `prophetic_dua`, `prophetic_dhikr` and `sunnah_action` all tell the reader
// there is a hadith or a fiqh citation behind the step. A source of
// "The tahmid — established dhikr", "Imam Al-Ghazali on Ar-Razzaq" or a bare
// "[Tabarani]" names no such thing, and 36 steps shipped that way. Anything
// without a chain belongs on `composed_dua`, or should carry no sourceType at
// all — both render without a badge that claims sourcing.
//
// Collection + number is the bar, not "is it on sunnah.com": Musnad Ahmad,
// Ibn Hibban and al-Adab al-Mufrad are legitimate references whether or not a
// given site hosts them. What is banned is a citation nobody can look up.
//
// (For the record, since it was mis-stated once: sunnah.com does host Sahih
// Ibn Hibban and Musnad Ahmad. Ibn Hibban 974 resolves there; the two Ahmad
// numbers we had did not, which is why they moved to Nawawi 19.)
const CHAINED = new Set(['prophetic_dua', 'prophetic_dhikr', 'sunnah_action']);
const LOOKUPABLE =
  /(Bukhari|Muslim|Tirmidhi|Abu\s?Dawud|Abi\s?Dawud|Ibn\s?Majah|Nasa'?i|Ibn\s?Hibban|Adab\s?Al-?Mufrad|Muwatta|Ahmad|Darimi|Bayhaqi|Hakim|Tabarani|an-?Nawawi|Hisn\s?al-?Muslim)[^\d]{0,24}\d+/i;

const unsourced = [];
for (const o of objects('q_angle_')) {
  const raw = o.body.match(/practiceSteps:\s*JSON\.stringify\(([\s\S]*?)\n\s*\]\),/);
  if (!raw) continue;
  let steps;
  try { steps = eval(raw[1] + '\n]'); } catch { continue; }
  for (const st of steps) {
    if (!CHAINED.has(st.sourceType)) continue;
    if (LOOKUPABLE.test(st.source || '')) continue;
    unsourced.push({ id: o.id, title: st.title, type: st.sourceType, src: st.source || '(none)' });
  }
}

console.log(`\nchain-claiming steps whose source names no locatable reference: ${unsourced.length}`);
for (const r of unsourced) console.log(`  ${r.id}  ·  ${r.title}  ·  ${r.type}  ·  "${r.src}"`);

if (bad.length || unsourced.length) process.exit(1);
console.log('\nAll asserted Quran citations check out, and every chain-claiming step cites a locatable reference.');
