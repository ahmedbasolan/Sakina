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

// ── Pass 3: the angle's own `actionSource` ────────────────────────────────
//
// Passes 1 and 2 read practiceSteps only. `actionSource` is a separate field
// rendered by PathStepScreen's fallback (see the comment there), and it drifts
// independently: six rizq days carried a TITLE in that slot — "The Increase
// Dua", "Dua of the Provider" — and two angles kept quoting a hadith in
// actionReward that their practiceStep had already moved off.
//
// Accepted: a locatable collection + number, an ayah reference, a Divine Name,
// or an explicit "Suggested wording" admission. Rejected: anything that just
// names the du'a.
const ACCEPTED = /^(Suggested wording|Divine Name)|Quran|Surah/i;
const actionBad = [];
for (const o of objects('q_angle_')) {
  const m = o.body.match(/\n\s*actionSource:\s*\n?\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/);
  if (!m) continue;
  const v = m[1].slice(1, -1);
  if (LOOKUPABLE.test(v) || ACCEPTED.test(v)) continue;
  actionBad.push({ id: o.id, src: v });
}
console.log(`\nactionSource fields naming no source: ${actionBad.length}`);
for (const r of actionBad) console.log(`  ${r.id}  ·  "${r.src}"`);

// ── Pass 4: does the cited hadith actually contain the step's Arabic? ─────
//
// Passes 2 and 3 only ask whether a reference is locatable. They do not ask
// whether that hadith says this, and four steps cited a real, resolvable
// hadith that had nothing to do with the du'a printed above it — the worst
// being Istikharah under Bukhari 1162, which is Aisha on the two rak'ahs
// before Fajr (the Istikharah hadith is 1166).
//
// Only BARE citations are checked. When the source quotes the hadith in
// English — `"Do not be angry." [Bukhari 6116]` — it is framing a practice,
// and the Arabic below is a separate dhikr the step asks you to say; that
// pairing is normal and not a claim about where the Arabic came from. A bare
// `Sahih Bukhari 1162` makes no such distinction, so it has to match.
//
// Scored on word overlap, not substring: transmitted wording varies between
// narrations (idha shi'ta / in shi'ta, word order) and our text is a fragment
// of a long isnad+matn. Measured on this corpus, genuine matches score
// 0.50-1.00 and the four real errors scored 0.00-0.25, so 0.4 separates them
// with no false positives. Re-check that separation if it starts firing.
//
// Muslim is skipped: the mirror renumbers it (Muslim 2564 there is not
// sunnah.com's 2564). Collections the mirror does not carry are skipped too.
// Both are counted and printed so the blind spot stays visible.
const MIRRORED = { bukhari: 1, tirmidhi: 1, abudawud: 1, ibnmajah: 1, nasai: 1 };
function collSlug(s) {
  const n = s.toLowerCase();
  if (n.includes('kubra') || n.includes('muslim') && !n.includes('hisn')) return null;
  if (n.includes('bukhari')) return 'bukhari';
  if (n.includes('tirmidhi')) return 'tirmidhi';
  if (n.includes('dawud')) return 'abudawud';
  if (n.includes('majah')) return 'ibnmajah';
  if (n.includes('nasa')) return 'nasai';
  return null;
}
// Reuses STRIP — the class self-tested at the top of this file. Do not write a
// fresh one here: the first attempt used [ؐ-ًؚ-ٰٟۖ-ۭـ], whose leading range
// U+0610-U+064B covers every Arabic letter, so every word vanished and all 31
// citations "failed". Same trap the header warns about, one file later.
const arNorm = (s) => (s || '').normalize('NFC')
  .replace(/ىٰ/g, 'ا').replace(/ٰ/g, 'ا')
  .replace(STRIP, '')
  .replace(/[آأإٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .replace(/[^ء-ي\s]/g, ' ').replace(/\s+/g, ' ').trim();
const arWords = (s) => arNorm(s).split(' ').filter((w) => w.length > 1);

// Guard: a du'a must survive normalisation as recognisable words, and must
// score 1.00 against a text that contains it verbatim.
{
  const dua = 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ';
  const w = arWords(dua);
  if (w.length < 3) {
    console.error('pass-4 normaliser self-test failed: the strip class is eating letters');
    process.exit(1);
  }
  const hay = new Set(arWords(`قال النبي ${dua} وأستقدرك بقدرتك`));
  if (w.filter((x) => hay.has(x)).length !== w.length) {
    console.error('pass-4 normaliser self-test failed: verbatim text did not score 1.00');
    process.exit(1);
  }
}

const hCache = new Map();
async function hadithText(coll, n) {
  const k = `${coll}/${n}`;
  if (!hCache.has(k)) {
    let t = null;
    try {
      const r = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${coll}/${n}.json`);
      if (r.ok) t = (await r.json()).hadiths?.[0]?.text ?? null;
    } catch { /* network — reported as unreadable below */ }
    hCache.set(k, t);
  }
  return hCache.get(k);
}

const mismatch = [];
let hChecked = 0, hSkipped = 0;
for (const o of objects('q_angle_')) {
  const raw = o.body.match(/practiceSteps:\s*JSON\.stringify\(([\s\S]*?)\n\s*\]\),/);
  if (!raw) continue;
  let steps;
  try { steps = eval(raw[1] + '\n]'); } catch { continue; }
  for (const st of steps) {
    if (!st.arabicText || !st.source) continue;
    if (/Quran|Surah|Suggested|Divine Name/i.test(st.source)) continue;
    if (st.source.includes('"')) continue; // quotes the hadith → framing, not sourcing
    // Not anchored at end: a trailing grading is common ("Tirmidhi 2305 —
    // Hasan"), and an end-anchored match silently SKIPS those rather than
    // failing them — which is how two of the four known-bad citations went
    // unreported the first time this pass ran.
    const all = [...st.source.matchAll(/([A-Za-z'`\-. ]+?)\s+(\d+)/g)];
    // Prefer the first reference the mirror can actually answer. Sources often
    // name two ("Sahih al-Bukhari 3282 / Sahih Muslim 2610"), and taking the
    // last one lands on Muslim — which the mirror renumbers — so the step got
    // skipped even though the Bukhari half was checkable.
    const m = all.find((x) => MIRRORED[collSlug(x[1])]) || null;
    if (!m) { hSkipped++; continue; }
    const coll = collSlug(m[1]);
    const txt = await hadithText(coll, m[2]);
    if (!txt) { hSkipped++; continue; }
    hChecked++;
    const hw = new Set(arWords(txt));
    const dw = arWords(st.arabicText);
    const score = dw.length ? dw.filter((w) => hw.has(w)).length / dw.length : 0;
    if (score < 0.4) mismatch.push({ id: o.id, title: st.title, src: st.source, score });
  }
}

console.log(`\nchecked ${hChecked} bare hadith citations against their text ` +
            `(${hSkipped} skipped — Sahih Muslim is renumbered on the mirror, ` +
            `and Ibn Hibban / Nawawi / Hisn al-Muslim / Nasa'i al-Kubra / Ahmad are not carried)`);
console.log(`steps whose Arabic is NOT in the hadith they cite: ${mismatch.length}`);
for (const r of mismatch) console.log(`  ${r.id}  ·  ${r.title}  ·  "${r.src}"  ·  overlap ${r.score.toFixed(2)}`);

// ── Pass 5: quran_dua steps whose source does not assert Quran ────────────
//
// Pass 1 only looks at sources that END with "— Quran" (or start "Quran X:Y",
// or say "Dua of"). A step typed quran_dua under a source line like "Tafsir
// Ibn Kathir on 4:147" renders the same green "Qur'anic" badge but was checked
// by nothing — and three such steps carried Arabic that is not in the ayah
// they name, including an app-composed tahmid.
//
// If the badge says Qur'anic and the source names a verse, the Arabic has to
// be in that verse.
const JOINED_AYAT = new Set([
  // Legitimately two ayat quoted as one dhikr, and the source line says so.
  'q_angle_rizq_day12|The Patience Dua',
]);
const quranish = [];
for (const o of objects('q_angle_')) {
  const raw = o.body.match(/practiceSteps:\s*JSON\.stringify\(([\s\S]*?)\n\s*\]\),/);
  if (!raw) continue;
  let steps;
  try { steps = eval(raw[1] + '\n]'); } catch { continue; }
  for (const st of steps) {
    if (st.sourceType !== 'quran_dua' || !st.arabicText || !st.source) continue;
    if (/—\s*Quran\s*$/.test(st.source) || /^Quran \d+:\d+/.test(st.source) || /—\s*Dua of/.test(st.source)) continue;
    if (JOINED_AYAT.has(`${o.id}|${st.title}`)) continue;
    if (KNOWN_ORTHOGRAPHIC.has(`${o.id}|${st.title}`)) continue;
    const m = st.source.match(/(\d+):(\d+)/);
    if (!m) { quranish.push({ id: o.id, title: st.title, src: st.source, why: 'names no verse' }); continue; }
    const t = await ayah(`${m[1]}:${m[2]}`);
    if (bare(t).includes(bare(st.arabicText))) continue;
    quranish.push({ id: o.id, title: st.title, src: st.source, why: 'Arabic not in that ayah' });
  }
}
console.log(`\nquran_dua steps whose source does not assert Quran: ${quranish.length} problem(s)`);
for (const r of quranish) console.log(`  ${r.id}  ·  ${r.title}  ·  "${r.src}"  ·  ${r.why}`);

if (bad.length || unsourced.length || actionBad.length || mismatch.length || quranish.length) process.exit(1);
console.log('\nAll asserted Quran citations check out, and every chain-claiming step cites a locatable reference.');
