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
import { execFileSync } from 'child_process';

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

/**
 * Parse an angle's practiceSteps array by MATCHING BRACKETS, not by regex.
 *
 * Passes 1, 2, 4, 5 and 6 all used
 *   /practiceSteps:\s*JSON\.stringify\(([\s\S]*?)\n\s*\]\),/
 * which requires a NEWLINE before the closing `]),`. Hand-written angles happen
 * to be formatted that way; every angle emitted by scripts/author-angle.mjs puts
 * the whole array on one line, and so matched nothing. `if (!raw) continue;`
 * then skipped them in silence.
 *
 * That hid 75 of 395 angles — all 65 added by the tick script, plus the ten
 * q_angle_tawbah_day* angles already on main. Five passes reported "0 problems"
 * over 320 angles while calling it the whole corpus, which is the exact failure
 * this file's own header warns about: a checker that reads part of its input is
 * worse than none, because it reports green.
 *
 * Returns null when there are genuinely no practiceSteps.
 */
function stepsOf(body) {
  const at = body.indexOf('practiceSteps: JSON.stringify(');
  if (at === -1) return null;
  const start = body.indexOf('[', at);
  if (start === -1) return null;
  let d = 0, q = null, end = -1;
  for (let k = start; k < body.length; k++) {
    const c = body[k];
    if (q) { if (c === '\\') k++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '[') d++;
    else if (c === ']') { d--; if (!d) { end = k; break; } }
  }
  if (end === -1) return null;
  // eval, not JSON.parse. The tick script emits strict JSON, but hand-written
  // angles are JS array literals — single-quoted strings, unquoted keys — and
  // JSON.parse rejects them. Swapping in JSON.parse here dropped the checked
  // count from 96 steps to 2 while still exiting 0, which is the same silent
  // under-read this helper exists to fix, in the opposite direction.
  try { return eval('(' + body.slice(start, end + 1) + ')'); } catch { return null; }
}

const cache = new Map();
async function ayah(ref) {
  if (!cache.has(ref)) {
    const v = await (await fetch(`https://api.quran.com/api/v4/verses/by_key/${ref}?fields=text_uthmani`)).json();
    cache.set(ref, v.verse?.text_uthmani ?? '');
  }
  return cache.get(ref);
}

// ── Pass 0: coverage ──────────────────────────────────────────────────────
// Every pass below silently skips an angle whose practiceSteps it cannot read
// (`if (!steps) continue;`). That is the right behaviour per-angle and a
// catastrophe in aggregate: the previous extractor could not read 75 of 395
// angles, and five passes reported "0 problems" over the other 320 without
// ever saying so. Anything the passes cannot parse is counted here and is
// FATAL, so an under-read announces itself instead of reading as a clean run.
//
// WHAT THIS DOES NOT CATCH: an angle with no practiceSteps field at all is
// legitimately invisible to these passes and is reported as a count only —
// PracticeLayer falls back to `action`/`actionHowTo` for those, which pass 3
// covers via actionSource.
{
  const all = objects('q_angle_');
  const withSteps = all.filter((o) => o.body.includes('practiceSteps: JSON.stringify('));
  const unreadable = withSteps.filter((o) => !stepsOf(o.body));
  console.log(
    `coverage: ${withSteps.length - unreadable.length}/${withSteps.length} angles with ` +
    `practiceSteps parsed (${all.length - withSteps.length} carry none)`,
  );
  if (unreadable.length) {
    console.error(`\n${unreadable.length} angle(s) whose practiceSteps could NOT be parsed — ` +
      `every pass below would skip them in silence:`);
    unreadable.slice(0, 20).forEach((o) => console.error(`  ${o.id}`));
    process.exit(1);
  }
}

const bad = [];
let checked = 0;
for (const o of objects('q_angle_')) {
  const steps = stepsOf(o.body);
  if (!steps) continue;
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
  const steps = stepsOf(o.body);
  if (!steps) continue;
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

// English sibling of hadithText. Pass 7's hadith check below compares an
// ENGLISH quotation, and reaching for hadithText() (which pulls `ara-`) would
// have scored every entry near zero — a check that fails everything is as
// useless as one that passes everything.
const hEnCache = new Map();
async function hadithTextEn(coll, n) {
  const k = `${coll}/${n}`;
  if (!hEnCache.has(k)) {
    let t = null;
    try {
      const r = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${coll}/${n}.json`);
      if (r.ok) t = (await r.json()).hadiths?.[0]?.text ?? null;
    } catch { /* network — treated as skipped, never as a failure */ }
    hEnCache.set(k, t);
  }
  return hEnCache.get(k);
}

const mismatch = [];
let hChecked = 0, hSkipped = 0;
for (const o of objects('q_angle_')) {
  const steps = stepsOf(o.body);
  if (!steps) continue;
  for (const st of steps) {
    if (!st.arabicText || !st.source) continue;
    // composed_dua says outright that the wording has no chain; its source line
    // is context ("Making du'a in sujud — Sahih Muslim 482"), not a claim that
    // the Arabic came from there. Only chain-claiming types are checked.
    if (!CHAINED.has(st.sourceType)) continue;
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
  const steps = stepsOf(o.body);
  if (!steps) continue;
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

// ── Pass 6: the collections the mirror cannot answer, read from sunnah.com ──
//
// Pass 4's blind spot was Sahih Muslim — the mirror renumbers it — plus Ibn
// Hibban, Nawawi's Forty, Hisn al-Muslim and Musnad Ahmad, which it does not
// carry. That blind spot was not theoretical: q_angle_67_13_sad cited Muslim
// 2654 (the Adam/Musa debate on destiny) for the "musarrif al-qulub" du'a,
// which is 2655, and no pass could see it.
//
// sunnah.com blocks a default curl User-Agent with a Cloudflare 403, and Node's
// own fetch is refused even WITH a browser User-Agent (the block fingerprints
// the TLS stack, not the header). Shelling out to curl with a browser UA works.
// robots.txt allows everything except /selectiondata/*.
//
// Network trouble must not fail the build: an unreadable page is counted and
// printed, never treated as a bad citation. Only a real low score fails.
const SUNNAH_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
function sunnahUrn(name) {
  const n = name.toLowerCase();
  if (n.includes('hisn')) return 'hisn';
  if (n.includes('nawawi')) return 'nawawi40';
  if (n.includes('hibban')) return 'ibnhibban';
  if (n.includes('adab')) return 'adab';
  if (n.includes('kubra')) return null; // al-Kubra is indexed by book, no item URN
  if (n.includes('ahmad')) return 'ahmad';
  if (n.includes('muslim')) return 'muslim';
  return null;
}
const sCache = new Map();
function sunnahArabic(urn, n) {
  const key = `${urn}:${n}`;
  if (!sCache.has(key)) {
    let out = null;
    try {
      const html = execFileSync(
        'curl', ['-sL', '--max-time', '25', '-A', SUNNAH_UA, `https://sunnah.com/${key}`],
        { maxBuffer: 1 << 26 },
      ).toString();
      const parts = [...html.matchAll(/<div class="arabic_hadith_full arabic"[^>]*>([\s\S]*?)<\/div>/g)]
        .map((m) => m[1].replace(/<[^>]+>/g, ' '));
      out = parts.join(' ') || null;
    } catch { /* curl absent or network down */ }
    sCache.set(key, out);
  }
  return sCache.get(key);
}

const sMismatch = [];
let sChecked = 0, sUnread = 0, sNoUrn = 0;
for (const o of objects('q_angle_')) {
  const steps = stepsOf(o.body);
  if (!steps) continue;
  for (const st of steps) {
    if (!st.arabicText || !st.source) continue;
    if (!CHAINED.has(st.sourceType)) continue;
    if (/Quran|Surah|Suggested|Divine Name/i.test(st.source)) continue;
    if (st.source.includes('"')) continue;
    const all = [...st.source.matchAll(/([A-Za-z'`\-. ]+?)\s+(\d+)/g)];
    if (all.some((x) => MIRRORED[collSlug(x[1])])) continue; // pass 4 owns it
    const hit = all.map((x) => [sunnahUrn(x[1]), x[2]]).find((x) => x[0]);
    if (!hit) { sNoUrn++; continue; }
    const txt = sunnahArabic(hit[0], hit[1]);
    if (!txt) { sUnread++; console.log(`  (unreadable: ${o.id} · ${hit[0]}:${hit[1]})`); continue; }
    sChecked++;
    const hw = new Set(arWords(txt));
    const dw = arWords(st.arabicText);
    const score = dw.length ? dw.filter((w) => hw.has(w)).length / dw.length : 0;
    if (score < 0.4) sMismatch.push({ id: o.id, title: st.title, ref: `${hit[0]}:${hit[1]}`, score });
  }
}
console.log(`\nchecked ${sChecked} citations against sunnah.com directly ` +
            `(${sUnread} unreadable, ${sNoUrn} with no item URN — Nasa'i al-Kubra is book-indexed)`);
console.log(`steps whose Arabic is NOT in the hadith they cite: ${sMismatch.length}`);
for (const r of sMismatch) console.log(`  ${r.id}  ·  ${r.title}  ·  ${r.ref}  ·  overlap ${r.score.toFixed(2)}`);

// ── Pass 7: pathsService.getStepMotivation ────────────────────────────────
//
// Passes 1–6 all read quranData.ts. `getStepMotivation` is the one other place
// in src/ that puts a sentence in quotation marks next to a citation, and it
// had no coverage at all — which is how it came to hold two quotations with no
// source whatsoever, an "[Prophetic Tradition]" label over an unlocatable
// wording, a hadith attributed to Bukhari that is Abu Dawud 909, an ellipsis
// eating four items out of Bukhari 5641, and ~16 bare collection tags with no
// number. None of it rendered (the function has no call sites), which is
// exactly why nobody looked.
//
// The bar is CLAUDE.md "Citing Hadith" rule 2: collection + number, or an ayah
// reference. Ellipsis inside a quotation is treated as truncation — if the
// quote does not fit, shorten to a clause that is whole, do not elide.
const svc = fs.readFileSync('src/services/pathsService.ts', 'utf8');
const mBlock = svc.match(/const motivations: Record<string, string> = \{([\s\S]*?)\n {4}\};/);
if (!mBlock) {
  console.error('\ncould not locate the motivations map in pathsService.ts — refusing to pass');
  process.exit(1);
}
const QURAN_REF = /\[Quran \d+:\d+\]/;
const motivations = [];
{
  // Entries are `key:` then a string literal, possibly wrapped to the next line.
  const re = /(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*:\s*\n?\s*('(?:[^'\\]|\\.)*')/g;
  for (const m of mBlock[1].matchAll(re)) {
    motivations.push({
      key: (m[1] ?? m[2]).replace(/\\(['"])/g, '$1'),
      text: m[3].slice(1, -1).replace(/\\(['"])/g, '$1'),
    });
  }
}
const motBad = [];
for (const e of motivations) {
  if (!LOOKUPABLE.test(e.text) && !QURAN_REF.test(e.text)) {
    motBad.push({ ...e, why: 'no locatable citation (collection + number, or [Quran X:Y])' });
    continue;
  }
  if (/\.\.\.|…/.test(e.text)) motBad.push({ ...e, why: 'ellipsis inside a quotation — truncated' });
}
// Quran entries additionally get their English checked against the ayah, so a
// quote cannot drift from the verse it cites the way 28:16 did.
// This catches a quote attached to the WRONG verse, not translator variance:
// two faithful renderings of one ayah differ freely on connectives ("Verily"
// vs "Indeed", "comes" vs "will be"). On a short ayah those choices are most
// of the content, so 94:6 — complete and accurate — scored 0.50 against Sahih
// International and would have failed a naive threshold. Quotes under
// MIN_EN_WORDS carry too little signal to judge and are reported, not failed.
const MIN_EN_WORDS = 8;
let motQuranChecked = 0, motQuranShort = 0;
const stop = new Set(['the', 'and', 'of', 'to', 'a', 'in', 'is', 'for', 'he', 'his', 'him', 'it', 'that', 'who', 'not', 'you', 'your', 'we', 'from', 'has', 'have', 'so', 'but', 'with', 'be', 'are', 'i', 'my', 'them', 'their', 'what', 'this', 'will', 'any', 'upon', 'then', 'there']);
const enWords = (s) => (s || '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)
  .filter((w) => w.length > 2 && !stop.has(w));
for (const e of motivations) {
  const ref = e.text.match(/\[Quran (\d+:\d+)\]/);
  if (!ref) continue;
  const qw = enWords(e.text.replace(/\[Quran \d+:\d+\]/, ''));
  if (qw.length < MIN_EN_WORDS) { motQuranShort++; continue; }
  const r = await (await fetch(`https://api.quran.com/api/v4/quran/translations/20?verse_key=${ref[1]}`)).json();
  const en = (r.translations?.[0]?.text || '').replace(/<[^>]*>/g, ' ');
  if (!en) { console.log(`  (unreadable ayah: ${ref[1]})`); continue; }
  motQuranChecked++;
  const av = new Set(enWords(en));
  const score = qw.filter((w) => av.has(w)).length / qw.length;
  if (score < 0.6) motBad.push({ ...e, why: `quoted English does not match ${ref[1]} (overlap ${score.toFixed(2)})` });
}
// Hadith entries get the same treatment against the mirror. Pass 7 originally
// checked only locatability + ellipsis + the Quran overlap above, which is how
// a Muslim 597a quotation shipped from this very script's own "fix" ending at
// "...his sins will be forgiven" — dropping "even if these are as abundant as
// the foam of the sea" and closing the quote with a period. That is the same
// fault this file already flags elsewhere (Muslim 2328a's missing "except when
// fighting in the cause of Allah"), so it gets a check rather than a promise.
//
// LIMITS, stated so nobody trusts this further than it goes: word overlap
// catches a quote attached to the WRONG hadith, not a quote that stops early —
// a truncation's words are all still present, so it scores 1.00. Detecting
// truncation would need alignment against a translation this app deliberately
// paraphrases, so it is not attempted. Sahih Muslim is skipped outright: the
// mirror renumbers it (see pass 4), and checking there would "correct" right
// citations into wrong ones.
let motHadithChecked = 0, motHadithSkipped = 0;
for (const e of motivations) {
  if (/\[Quran \d+:\d+\]/.test(e.text)) continue;
  const m = e.text.match(/\[([A-Za-z' -]+?)\s+(\d+)[a-z]?\]/);
  if (!m) continue;
  const slug = collSlug(m[1]);
  if (!MIRRORED[slug]) { motHadithSkipped++; continue; }
  const txt = await hadithTextEn(slug, m[2]);
  if (!txt) { motHadithSkipped++; continue; }
  const qw = enWords(e.text.replace(/\[[^\]]*\]/g, ''));
  if (qw.length < MIN_EN_WORDS) { motHadithSkipped++; continue; }
  motHadithChecked++;
  const hv = new Set(enWords(txt));
  const score = qw.filter((w) => hv.has(w)).length / qw.length;
  if (score < 0.5) {
    motBad.push({ ...e, why: `quoted English does not match ${m[1]} ${m[2]} (overlap ${score.toFixed(2)})` });
  }
}

console.log(`\nchecked ${motivations.length} getStepMotivation entries ` +
            `(${motQuranChecked} Quran quotes re-read from quran.com, ` +
            `${motQuranShort} too short to score; ` +
            `${motHadithChecked} hadith quotes re-read from the mirror, ` +
            `${motHadithSkipped} skipped — Sahih Muslim is renumbered there)`);
console.log(`entries with an unlocatable, truncated or drifting citation: ${motBad.length}`);
for (const r of motBad) console.log(`  ${r.key}  ·  ${r.why}\n      "${r.text.slice(0, 110)}"`);

if (bad.length || unsourced.length || actionBad.length || mismatch.length ||
    quranish.length || sMismatch.length || motBad.length) process.exit(1);
console.log('\nAll asserted Quran citations check out, and every chain-claiming step cites a locatable reference.');
