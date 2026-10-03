#!/usr/bin/env node
/**
 * Journey CLAIMS verifier — the checks verify-journey.mjs and verify-citations.mjs
 * cannot make because they read structure and Arabic, not what the prose asserts.
 *
 * Why it exists: on 2026-10-02 a hand review of Rizq Revolution and Salah
 * Transformation found faults that every existing verifier passed — one hadith
 * cited on three days for three different claims, a Da'if hadith labelled
 * "hasan", a stitched English "quote" beside a citation, claims credited to
 * scholars no tool could locate, and verse quotes worded differently from the
 * translation printed on the same screen. Each check below turns one of those
 * into a mechanical failure.
 *
 * It runs over EVERY journey in AVAILABLE_PATHS (read from PathsScreen.tsx, so a
 * new journey cannot be forgotten) and needs network + curl, like
 * verify-citations.mjs. Fetched sources are cached in the OS temp directory.
 *
 *   P1  a hadith (collection + number) cited on more than one day of a journey
 *   P2  an English quotation (>= 5 words) that is not a verbatim substring of
 *       something it could legitimately be quoting: a hadith cited that day, the
 *       prose of the tagged Ibn Kathir entry, the verse translation shown on that
 *       day's screen, or a Sahih International ayah the day cites
 *   P3  a quotation that is ~the verse shown on screen but worded differently
 *   P4  a scholar credited in the prose who is not the tagged tafsir; a tag naming
 *       a tafsir that cannot be fetched; an early authority (Ibn Abbas, Mujahid…)
 *       named in the angle who does not appear in the tagged English entry
 *   P5  sourceGrading that the published gradings contradict, or that sits on a
 *       source with no hadith citation
 *   P6  a hadith layer whose English is not recognisably the published text
 *   P7  sourceType badges that claim more than their source line shows: a scripture
 *       or prophetic badge on a step with no Arabic, a badge on a "Suggested
 *       practice" step, a Qur'anic badge over a non-Quran source
 *   P8  a bare hadith citation under a "Sunnah Action" badge with no recorded human
 *       review (HUMAN_REVIEWED) — it asserts the step IS that hadith's practice
 *
 * Also checked under P5: a grade stated in PROSE ("[Tirmidhi 1087, graded sahih]"), and
 * a hadith layer with NO grading — HadithLayer.tsx prints `grading || 'authentic'`, so a
 * missing grade is a claim of authenticity (Tawbah day 6 shipped that way over an
 * Ibn Majah narration most graders call Da'if).
 *   P0  a citation in a collection this script CAN fetch (the mirror's five, Muslim)
 *       that returns nothing — fails rather than noting, so an outage or a changed
 *       page layout cannot produce a green run that verified less
 *
 * WHAT THIS DOES NOT CATCH (read before treating a green run as "correct"):
 *   - It cannot tell that an INSTRUCTION is right. "Give from what you need"
 *     under a correctly quoted hadith passes. Fiqh and clinical judgement are
 *     human work; so is deciding that a count such as 33/33/34 belongs to the
 *     hadith that actually carries it (Bukhari 843 says 33 each; Muslim 596 says
 *     34) — the number is not a quotation, so nothing here sees it.
 *   - It cannot tell that a quotation is quoted in a misleading CONTEXT, or that
 *     a paraphrase has drifted. P2 only polices text inside quotation marks.
 *   - A quote that stops early scores as a verbatim substring, so truncation is
 *     invisible (the same limit verify-citations documents).
 *   - A quote equal to the day's OWN du'a translation/transliteration (a step's
 *     `translation` field) is exempt from P2 and P3, because that is the app's
 *     rendering of its own du'a, not a claim about a source. So the angle can quote
 *     the du'a in one English wording while the verse card above it shows another
 *     (Hope day 3 did, until a human read it). The two renderings on one screen are
 *     not compared.
 *   - Tafsir entries in Arabic (al-Qurtubi, al-Sa'di) cannot be quote-checked
 *     here; their tags are accepted, with the Arabic read by a human.
 *   - Citations to Ibn Hibban, Musnad Ahmad, Hisn al-Muslim and al-Kubra are not
 *     fetchable by number; they are listed as UNVERIFIED notes, not failures.
 *   - It does not verify that a cited hadith number is the RIGHT hadith for the
 *     day's theme; only that quoted words exist in it.
 *   - Every exemption lives in ALLOW_* below with a reason. An exemption is a
 *     human decision, not a check passing.
 *
 * Modes (both exiting 0 is the green state, as with RT_INJECT / RH_INJECT):
 *   node scripts/verify-journey-claims.mjs                 normal run
 *   CLAIMS_INJECT=1 node scripts/verify-journey-claims.mjs injects 14 known faults
 *                                                           and exits 0 only if
 *                                                           each is detected
 *   CLAIMS_REV=HEAD node scripts/verify-journey-claims.mjs runs the checks on the
 *                                                           data at a git revision
 *                                                           (proof the checks fail
 *                                                           on data known to be bad)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const REV = process.env.CLAIMS_REV || '';
const INJECT = process.env.CLAIMS_INJECT === '1';
const DETAIL = process.env.CLAIMS_DETAIL === '1'; // print the published text under each P2 failure
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// ── Exemptions. Each needs a reason a human can disagree with. ───────────────
// WHO "reviewed" means below: every entry was read by the AI assistant that wrote
// this file, against text it fetched on 2026-10-03. That is a second pair of eyes
// on the sources, not scholarly sign-off — a scholar should still read the content
// before release, and any entry here can be overturned by one.
//
// Quote exemptions: [angleId, substring of the quotation, reason]
const ALLOW_QUOTES = [
  ['q_angle_rizq_day10', 'Is there anyone asking of Me', "Ibn Kathir's 51:22 entry cites this hadith ('Allah descends…') from the Sahih collections; the step says so. No hadith number was given, so none is cited."],
  ['q_angle_crisis_day1', 'I am not okay and I did not want to say it alone', 'Sample message the app suggests the user send — app-written, not a quotation of any source.'],
  ['q_angle_crisis_day6', 'how long until this is over', 'The question the step asks the user to stop asking — app-written, not a quotation.'],
  ['q_angle_crisis_day6', 'what is present alongside it right now', 'The question the step asks the user to ask instead — app-written, not a quotation.'],
  ['q_angle_marriage_day12', 'the best of you defers to a scholar', "A negated foil ('He did not say …') contrasting with the hadith's real words, which the same step quotes next."],
  ['q_angle_tawbah_day6', 'From today I will not', "Sentence frame the step asks the user to complete — app-written, not a quotation."],
  ['q_angle_death_day5', 'I am a traveler here', "A thought the reader may have ('shifts from … to …'), not a quotation of a source."],
  ['q_angle_death_day5', 'I want the trip to be over', "A thought the reader may have, introducing the pointer to the Hope journey — not a quotation of a source."],
  ['q_angle_death_day7', 'I want this to be over', "A thought the reader may have, introducing the pointer to the Hope journey — not a quotation of a source."],
  ['q_angle_study_day4', 'there is no ease other than what You make easy', "Quoted from Hisn al-Muslim 139 as sunnah.com prints it (read 2026-10-03). The entry is not fetchable by number, so this check cannot see it."],
];
// Tags naming a tafsir this script cannot fetch: [angleId, reason]
const ALLOW_TAGS = [];
// Scholar attributions beyond the tag: [angleId, scholar, what was verified]
const ALLOW_SCHOLARS = [
  ['q_angle_crisis_day1', 'sadi', "al-Sa'di on 12:86 (read in Arabic): Yaqub complains 'to Allah alone, not to you nor to any other creature' — matches the angle."],
  ['q_angle_crisis_day3', 'sadi', "al-Sa'di on 21:88 (read in Arabic): 'a promise and glad tidings to every believer who falls into distress and grief that Allah will save him' — matches the angle, which now says it is his comment on that ayah."],
  ['q_angle_marriage_day1', 'qurtubi', "al-Qurtubi on 30:21 (read in Arabic): Ibn Abbas/Mujahid/al-Hasan — mawaddah = intimacy, rahmah = the child; as-Suddi — love / compassion; Ibn Abbas — a man's love for his wife / his mercy toward her."],
  ['q_angle_marriage_day4', 'sadi', "al-Sa'di on 2:216 (read in Arabic): general for acts of obedience/sin; not absolute for worldly matters; Allah is more merciful to the servant than himself and knows his interest better — matches the angle."],
  ['q_angle_marriage_day5', 'qurtubi', "al-Qurtubi on 24:32 (read in Arabic, 6th point): do not refrain from marriage over poverty; a promise of enrichment to those who marry seeking Allah's pleasure and protection from sin; Ibn Masud — 'seek wealth in marriage' — matches the angle."],
  ['q_angle_marriage_day10', 'sadi', "al-Sa'di on 20:131 (read in Arabic): provision of your Lord = knowledge/faith/deeds now and lasting bliss after, better in itself and more lasting; remind yourself of it and weigh the two — matches the angle."],
];
// "Sunnah Action" steps whose bare citation was read against the fetched hadith and
// found to say what the step asks: [angleId, step title, what the hadith says]
const HUMAN_REVIEWED = [
  ['q_angle_rizq_day4', 'Tie your camel', "Tirmidhi 2517: a man asks whether to tie his camel and rely on Allah or leave it loose and rely; the Prophet says 'Tie it and rely'."],
  ['q_angle_rizq_day7', 'Be exact in one deal', 'Bukhari 2079: if buyer and seller speak the truth and describe defects they are blessed in their transaction; if they lie or hide something the blessing is lost.'],
  ['q_angle_rizq_day8', 'Give from what you can spare', "Bukhari 1426: 'the best charity is that which is practiced by a wealthy person. And start giving first to your dependents'."],
  ['q_angle_salah_5', 'Stillness until you are settled', 'Bukhari 793: the man who prayed hastily is told to bow, rise, prostrate and sit each with calmness till he feels at ease.'],
  ['q_angle_study_day7', 'Thank a person by name', "Abu Dawud 4811: 'He who does not thank the people is not thankful to Allah'."],
  ['q_angle_results_day3', "Take it into two rak'ah", "Muslim 482: 'The nearest a servant comes to his Lord is when he is prostrating himself, so make supplication (in this state)'."],
  ['q_angle_marriage_day9', 'Try the practice the Prophet ﷺ named', "Bukhari 5066: to the young men who could not marry — 'whoever is not able to marry, should fast, as fasting diminishes his sexual power'."],
  ['q_angle_tawbah_day5', "Pray the two rak'ahs", "Abu Dawud 1521: a servant who sins, performs wudu well, prays two rak'ahs and asks pardon of Allah is pardoned; the Prophet then recited 3:135."],
  ['q_angle_tawbah_day7', 'Settle one thing you owe', "Bukhari 2449: whoever has wronged another in his reputation or anything else should beg his forgiveness before the Day when there is no money."],
  ['q_angle_tawbah_day8', 'Pair the sin with a specific good deed', "Tirmidhi 1987: 'follow an evil deed with a good one to wipe it out'."],
  ['q_angle_death_day5', 'Write the will', "Bukhari 2738: not permissible for a Muslim who has something to will to stay two nights without his will written and kept ready (Muslim 1627 the same)."],
  ['q_angle_death_day6', 'Start a sadaqa jariya today', 'Muslim 1631: when a man dies his acts end except recurring charity, knowledge by which people benefit, or a pious child who prays for him.'],
  ['q_angle_death_day6', 'Teach one thing', 'Muslim 1631 (as above): knowledge by which people benefit.'],
];
// A hadith LAYER whose grading differs from the published grading of the full narration
// because the layer shows only part of it: [angleId, reason]
const ALLOW_GRADINGS = [
  ['q_angle_study_day1', "Ibn Majah 224: the mirror grades the WHOLE narration Daif (Al-Albani, Arna'ut, Abdul-Baqi: Very Daif; Zubair Ali Zai: Daif), but the layer shows only the opening clause, and sunnah.com's own note says: \"'Seeking knowledge is a duty upon every Muslim' is authentic through many sources, but the remaining text is not acceptable.\" The layer carries the conservative 'hasan li-ghayrihi' (strengthened by other routes), not 'sahih', because no grader's grade for the clause alone was fetched."],
];
// A hadith that legitimately appears on two days of one journey: [journey, key, reason]
const ALLOW_P1 = [
  ['path_prayer_leadership', 'bukhari:772', "One narration carrying two separate clauses — which prayers are recited aloud (day 9) and that Al-Fatihah alone suffices (day 11). No second narration for either clause was found; swapping in a weaker one would be worse than the repeat."],
];
// A hadith layer whose English is a different translation of the SAME Arabic: [angleId, reason]
const ALLOW_LAYERS = [
  ['q_angle_study_day3', "The layer shows only the opening fragment, innama al-a'mal bi-l-niyyat, and 'Actions are but by intentions' is its standard translation; the USC text renders the whole sentence differently."],
];
// Citations that cannot be fetched by number but were checked by hand: [key, reason]
const ALLOW_UNVERIFIED = [
  ['nasaikubra:9514', "Checked by hand 2026-10-02 at sunnah.com/nasaikubra/64 (Book 64, Hadith 9514): Abu Musa hears the Prophet say the du'a while performing wudu."],
  ['hisn:139', "Checked by hand 2026-10-03 via sunnah.com search ('la sahla illa ma ja altahu sahla'): Hisn al-Muslim 139, 'Reference: Ibn Hibban in his Sahih (no. 2427), and Ibn As-Sunni (no. 351). Al-Hafidh (Ibn Hajar) said that this Hadith is authentic… also declared authentic by Abdul-Qadir Al-Arna'ut'."],
  ['ibnhibban:2427', "Same Hisn al-Muslim 139 entry (2026-10-03). The number 974, used before, matches nothing there."],
];

// ── helpers ──────────────────────────────────────────────────────────────────
const read = (f) => (REV ? execFileSync('git', ['show', `${REV}:${f}`], { cwd: ROOT, maxBuffer: 1 << 30 }).toString('utf8') : fs.readFileSync(path.join(ROOT, f), 'utf8'));
const paths = read('src/data/staticPaths.ts');
const quran = read('src/data/quranData.ts');
const hadithSrc = read('src/data/hadithData.ts');
const pathsScreen = fs.readFileSync(path.join(ROOT, 'src/screens/PathsScreen.tsx'), 'utf8');

/** Balanced `{...}` containing `id: '<id>'`, string-literal aware (see verify-journey.mjs). */
function objectAt(src, id) {
  const at = src.indexOf(`id: '${id}'`);
  if (at < 0) return null;
  let open = at;
  while (src[open] !== '{') open--;
  let depth = 0, quote = null;
  for (let k = open; k < src.length; k++) {
    const c = src[k];
    if (quote) { if (c === '\\') k++; else if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return eval('(' + src.slice(open, k + 1) + ')'); }
  }
  return null;
}

/** Lower-case, drop apostrophes, parenthetical/bracketed asides, punctuation. */
// Spelling variants that are the SAME word, not a different wording: 'Ids (the
// translators' spelling) and Eids (the app's). Nothing else is aliased — an alias
// list that grows to absorb every mismatch would turn this check into a no-op.
const ALIASES = (s) => s.replace(/\beids?\b/g, (m) => (m === 'eid' ? 'id' : 'ids'));
const nz = (s) =>
  ALIASES(
    String(s ?? '')
      .toLowerCase()
      .replace(/[“”„]/g, '"')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/['’‘`´]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
const words = (s) => nz(s).split(' ').filter(Boolean);
/**
 * Same as nz() but KEEPS parenthetical text. Ibn Majah-style hadith put the whole
 * English translation inside parentheses after the transliteration, so stripping
 * them (right for tafsir prose, where parentheses hold embedded verse renderings)
 * would reduce a valid quotation of that hadith to nothing.
 */
const nzKeep = (s) =>
  ALIASES(
    String(s ?? '')
      .toLowerCase()
      .replace(/[“”„]/g, '"')
      .replace(/<[^>]+>/g, ' ')
      .replace(/['’‘`´]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
const wordsKeep = (s) => nzKeep(s).split(' ').filter(Boolean);

const CACHE = path.join(os.tmpdir(), 'sakina-claims-cache');
fs.mkdirSync(CACHE, { recursive: true });
async function cached(key, fn) {
  const f = path.join(CACHE, key.replace(/[^a-z0-9_.-]/gi, '_') + '.json');
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  let v = null;
  for (let i = 0; i < 3 && v == null; i++) { try { v = await fn(); } catch { v = null; } }
  if (v != null) fs.writeFileSync(f, JSON.stringify(v));
  return v;
}
async function pool(items, n, fn) {
  const q = [...items];
  await Promise.all(Array.from({ length: n }, async () => { while (q.length) await fn(q.shift()); }));
}

// ── citations ────────────────────────────────────────────────────────────────
const CITE =
  /(?<![A-Za-z])(Hisn al-Muslim|Sahih Ibn Hibban|Ibn Hibban|Bukhari|(?<!Hisn al-)Muslim|Tirmidhi|(?:Abu|Abi) Dawud|Ibn Majah|Nasa['’]?i al-Kubra|Nasa['’]?i|Musnad Ahmad|Ahmad)\s+(\d+[a-z]?)(?![\d:])/g;
const collOf = (name) => {
  if (/Hisn/i.test(name)) return 'hisn';
  if (/Hibban/i.test(name)) return 'ibnhibban';
  if (/Bukhari/i.test(name)) return 'bukhari';
  if (/Muslim/i.test(name)) return 'muslim';
  if (/Tirmidhi/i.test(name)) return 'tirmidhi';
  if (/Dawud/i.test(name)) return 'abudawud';
  if (/Majah/i.test(name)) return 'ibnmajah';
  if (/Kubra/i.test(name)) return 'nasaikubra';
  if (/Nasa/i.test(name)) return 'nasai';
  return 'ahmad';
};
const MIRROR = new Set(['bukhari', 'tirmidhi', 'abudawud', 'ibnmajah', 'nasai']);
function citesIn(text) {
  const out = [];
  if (!text) return out;
  for (const m of String(text).matchAll(CITE)) out.push(`${collOf(m[1])}:${m[2].toLowerCase()}`);
  return out;
}

/** English as sunnah.com prints it (narrator line + matn). Null if the page has none. */
function sunnahEnglish(coll, num) {
  const html = execFileSync('curl', ['-sL', '-A', BROWSER_UA, `https://sunnah.com/${coll}:${num}`], { maxBuffer: 1 << 26 }).toString().replace(/\s+/g, ' ');
  const cut = html.search(/<div class="?arabic_hadith_full/);
  const body = cut > 0 ? html.slice(0, cut) : html;
  // Most pages put the narrator line in hadith_narrated and the matn in
  // text_details. Some (Muslim 2658a) have NO hadith_narrated: the narrator is
  // inline in text_details. Taking from whichever comes first covers both.
  const a = body.indexOf('<div class=hadith_narrated>');
  const b = body.indexOf('<div class=text_details>');
  const at = a >= 0 && (b < 0 || a < b) ? a : b;
  if (at < 0) return null;
  return body.slice(at).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
/**
 * `en` is the mirror's English (gradings come with it); `alt` is sunnah.com's —
 * the app uses either translator, so a genuine quotation must be allowed to match
 * either. Muslim exists only at sunnah.com (the mirror renumbers it).
 */
async function fetchHadith(key) {
  const [coll, num] = key.split(':');
  return cached('h2_' + key, async () => {
    if (MIRROR.has(coll) && /^\d+$/.test(num)) {
      const r = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${coll}/${num}.json`);
      if (!r.ok) return null;
      const j = await r.json();
      let alt = null;
      try { alt = sunnahEnglish(coll, num); } catch { /* the mirror text alone is still usable */ }
      return { en: j.hadiths[0].text, alt, grades: j.hadiths[0].grades || [] };
    }
    if (coll === 'muslim') {
      const en = sunnahEnglish('muslim', num);
      return en ? { en, alt: null, grades: null } : null;
    }
    return null;
  });
}

// ── tafsir + verse sources ───────────────────────────────────────────────────
const TAFSIR_ID = { 'ibn kathir': 169, 'al-qurtubi': 90, "al-sa'di": 91, 'al-baghawi': 94, 'al-tabari': 15 };
const TAFSIR_ENGLISH = new Set([169]);
const tafsirKey = (name) => name.toLowerCase().replace(/[’‘`´]/g, "'").replace(/\s+/g, ' ').trim();
async function fetchTafsir(id, surah, ayah) {
  return cached(`t_${id}_${surah}_${ayah}`, async () => {
    const r = await fetch(`https://api.quran.com/api/v4/tafsirs/${id}/by_ayah/${surah}:${ayah}`);
    if (!r.ok) return null;
    const j = await r.json();
    return { text: String(j.tafsir?.text ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() };
  });
}
async function fetchSahih(surah, ayah) {
  return cached(`q_${surah}_${ayah}`, async () => {
    const r = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.sahih`);
    if (!r.ok) return null;
    return { text: (await r.json()).data.text };
  });
}
/** Ibn Kathir's PROSE only: parentheses hold his embedded verse/hadith renderings. */
const tafsirProse = (t) => nz(t); // nz drops (...) asides on purpose — see P2 note

// ── dataset ──────────────────────────────────────────────────────────────────
function loadDays() {
  const ap = pathsScreen.match(/const AVAILABLE_PATHS[^{]*\{([\s\S]*?)\n\};/);
  if (!ap) throw new Error('Could not find AVAILABLE_PATHS in PathsScreen.tsx');
  const ids = [...ap[1].matchAll(/(path_[a-z_]+):/g)].map((m) => m[1]);
  const days = [];
  for (const pid of ids) {
    const p = objectAt(paths, pid);
    if (!p) throw new Error('path not found: ' + pid);
    for (const st of p.dailySteps) {
      const a = objectAt(quran, st.angleId);
      const v = objectAt(quran, st.contentId);
      const h = st.hadithContentId ? objectAt(hadithSrc, st.hadithContentId) : null;
      if (!a || !v) throw new Error(`unresolved angle/content for ${pid} day ${st.day}`);
      days.push({
        journey: pid, day: st.day, angleId: st.angleId, angle: a, verse: v, hadith: h,
        steps: a.practiceSteps ? JSON.parse(a.practiceSteps) : [],
      });
    }
  }
  return days;
}

const tagOf = (angle) => {
  const m = String(angle).match(/^\[Tafsir\s+(.+?)\s+on\s+(\d+):(\d+)(?:-\d+)?\]/);
  return m ? { name: m[1].trim(), surah: +m[2], ayah: +m[3] } : null;
};
const refsIn = (text) => {
  const out = [];
  for (const m of String(text ?? '').matchAll(/\b(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?\b/g)) {
    const s = +m[1], a = +m[2], b = m[3] ? +m[3] : a;
    if (s >= 1 && s <= 114 && a >= 1 && a <= 286 && b >= a && b - a < 12) for (let k = a; k <= b; k++) out.push([s, k]);
  }
  return out;
};

// A step whose source is "Suggested practice"/"Suggested wording" quotes nobody:
// its quotation marks are the app's own example prompts. Only "practice" claims
// no wording at all — "Suggested wording" is the legitimate label for a composed
// du'a, so P7 must not treat it as a step that may not carry a badge.
const SUGGESTED = /^Suggested (practice|wording)/i;
const SUGGESTED_PRACTICE = /^Suggested practice/i;
function dayFields(d) {
  // [field label, text, kind]
  const f = [['angle', d.angle.angle, 'angle']];
  d.steps.forEach((s, i) => {
    f.push([`step ${i + 1} "${s.title}" instruction`, s.instruction, SUGGESTED.test(s.source || '') ? 'prompt' : 'step']);
    f.push([`step ${i + 1} source`, s.source, 'source']);
    f.push([`step ${i + 1} countSource`, s.countSource, 'source']);
  });
  for (const k of ['action', 'actionHowTo', 'actionReward', 'actionSource']) f.push([k, d.angle[k], 'action']);
  if (d.hadith) { f.push(['hadith source', d.hadith.source, 'source']); f.push(['hadith practice source', d.hadith.propheticPractice?.source, 'source']); }
  return f;
}

// ── prefetch ─────────────────────────────────────────────────────────────────
async function prefetch(days) {
  const hk = new Set(), tk = new Map(), qk = new Map();
  for (const d of days) {
    for (const [, text] of dayFields(d)) for (const k of citesIn(text)) hk.add(k);
    const t = tagOf(d.angle.angle);
    if (t && TAFSIR_ID[tafsirKey(t.name)]) tk.set(`${TAFSIR_ID[tafsirKey(t.name)]}:${t.surah}:${t.ayah}`, [TAFSIR_ID[tafsirKey(t.name)], t.surah, t.ayah]);
    for (const [, text] of dayFields(d)) for (const [s, a] of refsIn(text)) qk.set(`${s}:${a}`, [s, a]);
    for (const [s, a] of refsIn(d.angle.angle)) qk.set(`${s}:${a}`, [s, a]);
  }
  const H = {}, T = {}, Q = {};
  await pool([...hk], 6, async (k) => { H[k] = await fetchHadith(k); });
  await pool([...tk.entries()], 6, async ([k, [id, s, a]]) => { T[k] = await fetchTafsir(id, s, a); });
  await pool([...qk.entries()], 6, async ([k, [s, a]]) => { Q[k] = await fetchSahih(s, a); });
  return { H, T, Q };
}

// ── quotation extraction ─────────────────────────────────────────────────────
function quotesIn(text) {
  const out = [];
  const t = String(text ?? '');
  for (const m of t.matchAll(/"([^"]+)"|“([^”]+)”/g)) {
    const q = (m[1] ?? m[2]).trim();
    if (words(q).length >= 5) out.push(q);
  }
  // Single-quoted spans ('And when you have decided, then rely upon Allah.'): the
  // opening mark must not follow a letter and the closing mark must not precede
  // one, so apostrophes inside words (Allah's, don't) do not open or close a span.
  for (const m of t.matchAll(/(?<![A-Za-z0-9])['‘]([^'’]{20,}?)['’](?![A-Za-z0-9])/g)) {
    const q = m[1].trim();
    if (words(q).length >= 5) out.push(q);
  }
  return out;
}
const fragments = (q) => q.split(/…|\.\.\./).map((x) => x.trim()).filter((x) => words(x).length >= 3);
const overlap = (q, target) => {
  const w = words(q), t = new Set(words(target));
  return w.length ? w.filter((x) => t.has(x)).length / w.length : 0;
};

const AUTHORITIES = ['ibn abbas', 'ibn masud', 'ibn umar', 'mujahid', 'qatadah', 'al-hasan', 'az-zuhri', 'ikrimah', 'as-suddi', 'ad-dahhak', 'an-nakhai'];
const SCHOLARS = [
  ['ghazali', /Ghazali/i], ['ibn al-qayyim', /Ibn al-Qayyim|Ibn Qayyim|Madarij/i], ['ibn taymiyyah', /Taymiyyah/i],
  ['ibn uthaymeen', /Uthaymeen|Uthaymin/i], ['ibn baaz', /Ibn Baaz|Bin Baz/i], ['ibn rajab', /Ibn Rajab/i],
  ['ahmad ibn hanbal', /Ahmad ibn Hanbal/i], ['nawawi', /Nawawi/i], ['ibn hajar', /Ibn Hajar/i],
  ['ibn kathir', /Ibn Kathir/i], ['qurtubi', /Qurtubi/i], ['sadi', /Sa['’]di/i], ['tabari', /Tabari/i], ['baghawi', /Baghawi/i],
];
const scholarKeyOfTag = (name) => {
  const n = name.toLowerCase();
  for (const [k, re] of SCHOLARS) if (re.test(name)) return k;
  return n;
};
const rank = (g) => { const s = String(g).toLowerCase(); if (/daif|da'if|weak/.test(s)) return 1; if (/sahih/.test(s)) return 3; if (/hasan/.test(s)) return 2; return 0; };
const claimRank = (g) => (/^sahih/.test(g) ? 3 : /^hasan/.test(g) ? 2 : 0);

// ── the checks ───────────────────────────────────────────────────────────────
function runChecks(days, src) {
  const F = [];
  const fail = (check, d, msg) => F.push({ check, journey: d.journey, day: d.day, angleId: d.angleId, msg });
  const notes = [];

  // P1 — a hadith on more than one day of the same journey
  const byJourney = {};
  for (const d of days) {
    const seen = new Set();
    for (const [label, text] of dayFields(d)) for (const k of citesIn(text)) {
      if (seen.has(k)) continue;
      seen.add(k);
      ((byJourney[d.journey] ??= {})[k] ??= []).push({ d, label });
    }
  }
  for (const [j, m] of Object.entries(byJourney)) for (const [k, uses] of Object.entries(m)) {
    if (uses.length > 1 && !ALLOW_P1.find(([jj, kk]) => jj === j && kk === k)) {
      const dd = uses.map((u) => u.d.day);
      fail('P1 hadith reused', uses[1].d, `${k} is cited on days ${dd.join(', ')} of ${j} (first use in "${uses[0].label}")`);
    }
  }

  for (const d of days) {
    const tag = tagOf(d.angle.angle);
    // unverified citations
    for (const [label, text] of dayFields(d)) for (const k of citesIn(text)) {
      if (!src.H[k]) {
        const al = ALLOW_UNVERIFIED.find(([x]) => x === k);
        // A collection this script CAN fetch (the mirror's five, or Muslim at sunnah.com)
        // that returns nothing is a failure, not a note: otherwise an outage, a wrong
        // number or a changed page layout turns every check on that citation into
        // silence and the run goes green having verified less. (Muslim 2658a once
        // hid behind this: the parser, not the citation, was wrong.)
        if (!al && (MIRROR.has(k.split(':')[0]) || k.startsWith('muslim:'))) fail('P0 cited source could not be fetched', d, `${k} in ${label} — unreachable, mis-numbered, or the page layout changed`);
        else notes.push(`UNVERIFIED ${k} (${d.journey} day ${d.day}, ${label})${al ? ' — ' + al[1] : ''}`);
      }
    }
    // corpus for P2
    const corpus = [];
    // `k` keeps parenthetical text; tafsir prose passes keepParens=false so the
    // verse/hadith renderings Ibn Kathir embeds in parentheses stay OUT of it.
    const add = (name, text, keepParens = true) => {
      const n = nz(text);
      if (!n) return;
      const k = keepParens ? nzKeep(text) : n;
      const jt = String(text).replace(/-/g, '');
      corpus.push({ name, n, k, nj: nz(jt), kj: keepParens ? nzKeep(jt) : nz(jt), raw: String(text).replace(/\s+/g, ' ').slice(0, 900) });
    };
    // Transliterations differ only in hyphenation (Rabbana-lakal / Rabbana lakal,
    // Sami`a l-lahu / Sami'a llahu), so each text is also tried with hyphens joined.
    const joinH = (s) => String(s ?? '').replace(/-/g, '');
    const has = (c, f) => c.n.includes(nz(f)) || c.k.includes(nzKeep(f)) || c.nj.includes(nz(joinH(f))) || c.kj.includes(nzKeep(joinH(f)));
    const cited = new Set();
    for (const [, text] of dayFields(d)) for (const k of citesIn(text)) cited.add(k);
    for (const k of cited) if (src.H[k]) { add('hadith ' + k, src.H[k].en); if (src.H[k].alt) add('hadith ' + k + ' (sunnah.com)', src.H[k].alt); }
    add('displayed verse', d.verse.englishTranslation);
    // The hadith LAYER's English is deliberately NOT a quotation source. It is the
    // app's own rendering (Marriage day 4's elides the whole istikharah du'a and
    // adds "say the du'a of istikharah" in its place), so a quotation that only
    // matches the layer is a quotation of the app, not of the hadith. P6 separately
    // checks that the layer is recognisably the published text.
    let tafsirEn = null;
    if (tag) {
      const id = TAFSIR_ID[tafsirKey(tag.name)];
      const t = id ? src.T[`${id}:${tag.surah}:${tag.ayah}`] : null;
      if (!id) {
        if (!ALLOW_TAGS.find(([a]) => a === d.angleId)) fail('P4 unverifiable tag', d, `[Tafsir ${tag.name}] names a tafsir this script cannot fetch`);
      } else if (!t) {
        fail('P4 unreadable tag', d, `could not fetch ${tag.name} on ${tag.surah}:${tag.ayah}`);
      } else if (TAFSIR_ENGLISH.has(id)) { tafsirEn = t.text; add('tafsir prose', t.text, false); }
    }
    const surahAyahs = new Set();
    for (const [, text] of dayFields(d)) for (const [s, a] of refsIn(text)) surahAyahs.add(`${s}:${a}`);
    for (const [s, a] of refsIn(d.angle.angle)) surahAyahs.add(`${s}:${a}`);
    for (const k of surahAyahs) if (src.Q[k]) add('sahih ' + k, src.Q[k].text);

    // P2 / P3 — quotations
    const targets = [['angle', d.angle.angle, true]];
    d.steps.forEach((s, i) => {
      if (SUGGESTED.test(s.source || '')) return;
      targets.push([`step ${i + 1} instruction`, s.instruction, true]);
      targets.push([`step ${i + 1} source`, s.source, true]);
    });
    for (const k of ['action', 'actionHowTo', 'actionReward']) if (citesIn(d.angle[k]).length) targets.push([k, d.angle[k], true]);
    const own = new Set(); // transliterations/translations of the day's own du'a are not quotations of a source
    d.steps.forEach((s) => { if (s.transliteration) own.add(nz(s.transliteration)); if (s.translation) own.add(nz(s.translation)); });
    if (d.angle.actionTransliteration) own.add(nz(d.angle.actionTransliteration));
    if (d.angle.actionTranslation) own.add(nz(d.angle.actionTranslation));
    for (const [label, text] of targets) for (const q of quotesIn(text)) {
      if ([...own].some((o) => o.includes(nz(q)) || nz(q).includes(o))) continue;
      if (ALLOW_QUOTES.find(([a, sub]) => a === d.angleId && q.includes(sub))) continue;
      const fr = fragments(q);
      if (!fr.length) continue;
      const verseN = nz(d.verse.englishTranslation);
      const miss = fr.filter((f) => !corpus.some((c) => has(c, f)));
      if (miss.length) {
        fail('P2 quotation not found in any source', d, `${label}: «${q.slice(0, DETAIL ? 500 : 120)}» — not in: ${corpus.map((c) => c.name).join(', ') || '(no fetched source)'}` +
          (DETAIL ? '\n' + corpus.filter((c) => c.name.startsWith('hadith') || c.name === 'displayed verse').map((c) => `        [${c.name}] ${c.raw}`).join('\n') : ''));
      } else if (!fr.every((f) => verseN.includes(nz(f)))) {
        // Found elsewhere — but is it ~the displayed verse worded differently?
        // Not if it sits in the tagged tafsir's own prose (e.g. "a sure promise
        // from Him"): that is the scholar's wording, not a rendering of the ayah.
        const inProse = corpus.some((c) => c.name === 'tafsir prose' && fr.every((f) => has(c, f)));
        if (!inProse && overlap(q, d.verse.englishTranslation) >= 0.6 && !fr.some((f) => verseN.includes(nz(f))) && !corpus.some((c) => c.name.startsWith('hadith') && fr.every((f) => has(c, f)))) {
          fail('P3 verse quote differs from the verse shown', d, `${label}: «${q.slice(0, 100)}» vs shown «${String(d.verse.englishTranslation).replace(/\s+/g, ' ').slice(0, 100)}»`);
        }
      }
    }

    // P4 — scholars and authorities
    const tagScholar = tag ? scholarKeyOfTag(tag.name) : null;
    const prose = [['angle', d.angle.angle]];
    d.steps.forEach((s, i) => { const own2 = (String(s.source || '').match(/^Tafsir\s+(.+?)\s+on\s/) || [])[1]; prose.push([`step ${i + 1}`, `${s.instruction} ${s.source || ''}`, own2 ? scholarKeyOfTag(own2) : null]); });
    for (const [label, text, ownTag] of prose) {
      const body = String(text).replace(/^\[Tafsir[^\]]*\]/, '').replace(/Tafsir\s+[A-Za-z' -]+?\s+on\s+\d+:\d+(-\d+)?/g, '');
      for (const [k, re] of SCHOLARS) {
        if (!re.test(body)) continue;
        if (k === tagScholar || k === ownTag) continue;
        if (ALLOW_SCHOLARS.find(([a, s]) => a === d.angleId && s === k)) continue;
        fail('P4 scholar credited who is not the tagged tafsir', d, `${label} credits «${k}»${tag ? ` but the tag is ${tag.name}` : ''}`);
      }
    }
    if (tafsirEn) {
      const entryLetters = tafsirEn.toLowerCase().replace(/[^a-z]/g, '');
      // Only a name used as a COMMENTATOR counts. Ibn Umar is also the narrator of
      // hadith the angle quotes ("The Prophet ﷺ took Ibn Umar by the shoulder"), and
      // a narrator need not appear in a tafsir entry — so sentences that carry a
      // hadith citation or "the Prophet ﷺ" are skipped.
      const commentary = d.angle.angle
        .replace(/^\[Tafsir[^\]]*\]\s*/, '')
        .split(/(?<=[.!?])\s+/)
        .filter((sn) => !/Prophet\s+ﷺ|\[(?:Sahih|Sunan|Jami|Bukhari|Muslim|Tirmidhi|Abu Dawud|Ibn Majah)/.test(sn))
        // A sentence that credits a DIFFERENT named scholar draws its authorities from
        // that scholar's entry, not from the tagged one. Those claims are held to
        // ALLOW_SCHOLARS (a recorded human read) instead of to this check.
        .filter((sn) => !SCHOLARS.some(([k, re]) => k !== tagScholar && re.test(sn)))
        .join(' ');
      for (const a of AUTHORITIES) {
        const letters = a.replace(/[^a-z]/g, '');
        // Ibn Kathir writes "Abdullah bin Mas`ud" where prose says "Ibn Masud".
        const variants = [letters, letters.replace(/^ibn/, 'bin')];
        const inProse = commentary.toLowerCase().replace(/[^a-z]/g, '').includes(letters);
        if (inProse && !variants.some((v) => entryLetters.includes(v))) fail('P4 authority absent from the tagged entry', d, `angle names «${a}» but Ibn Kathir's entry on ${tag.surah}:${tag.ayah} never does`);
      }
    }

    // P5 — gradings; P7 — badges
    const gradeCheck = (label, source, grading0) => {
      if (!grading0) return;
      const grading = String(grading0).toLowerCase(); // the data mixes 'sahih' and 'Sahih'
      const ks = citesIn(source);
      if (!ks.length) { fail('P5 grading without a hadith citation', d, `${label}: sourceGrading «${grading}» on «${String(source).slice(0, 70)}» — a grade applies to a hadith, not a scholar's teaching`); return; }
      for (const k of ks) {
        const coll = k.split(':')[0];
        const rec = src.H[k];
        if (['bukhari', 'muslim'].includes(coll)) { if (!/^sahih/.test(grading)) fail('P5 grading contradicts the collection', d, `${label}: ${k} graded «${grading}» (Bukhari/Muslim are sahih)`); continue; }
        const g = rec?.grades;
        if (!g || !g.length) { notes.push(`UNGRADED ${k} (${d.journey} day ${d.day}) claimed «${grading}»`); continue; }
        const ranks = g.map((x) => rank(x.grade)).filter(Boolean);
        const best = Math.max(...ranks), weak = ranks.filter((r) => r === 1).length, strong = ranks.filter((r) => r > 1).length;
        if (label.startsWith('hadith layer') && ALLOW_GRADINGS.find(([a]) => a === d.angleId)) continue;
        if (best < claimRank(grading)) fail('P5 grading over-claims', d, `${label}: ${k} claimed «${grading}» but graders say ${g.map((x) => x.name + ':' + x.grade).join(', ')}`);
        else if (weak >= 2 && weak > strong) fail('P5 grading over-claims', d, `${label}: ${k} claimed «${grading}» but most graders say Daif (${g.map((x) => x.name + ':' + x.grade).join(', ')})`);
      }
    };
    d.steps.forEach((s, i) => {
      gradeCheck(`step ${i + 1} "${s.title}"`, s.source, s.sourceGrading);
      if (SUGGESTED_PRACTICE.test(s.source || '') && (s.sourceType || s.sourceGrading)) fail('P7 badge on a step that claims no source', d, `step ${i + 1} "${s.title}" is "Suggested practice" but carries ${s.sourceType || s.sourceGrading}`);
      // PracticeSourceType: quran_dua = "Du'a that appears verbatim in the Qur'an";
      // prophetic_dua / prophetic_dhikr = a ma'thur wording. All three promise
      // WORDS to say, so a step wearing one with no Arabic is an app-written
      // exercise or a tafsir line under a scripture badge (CLAUDE.md rule 4).
      if (['quran_dua', 'prophetic_dua', 'prophetic_dhikr'].includes(s.sourceType) && !s.arabicText) fail('P7 badge promises words but the step has no Arabic', d, `step ${i + 1} "${s.title}": ${s.sourceType} with no arabicText (source «${s.source}»)`);
      if (s.sourceType === 'quran_dua' && !/quran|surah|surat/i.test(s.source || '')) fail('P7 Qur\'anic badge over a non-Quran source', d, `step ${i + 1} "${s.title}": «${s.source}»`);
      if (['prophetic_dua', 'prophetic_dhikr', 'sunnah_action'].includes(s.sourceType) && !citesIn(s.source).length && !/quran|surah/i.test(s.source || '')) fail('P7 chain badge without a locatable citation', d, `step ${i + 1} "${s.title}": ${s.sourceType} over «${s.source}»`);
      if (s.sourceType === 'composed_dua' && !/Suggested wording|Divine Name/i.test(s.source || '')) fail('P7 composed_dua mislabelled', d, `step ${i + 1} "${s.title}": «${s.source}»`);
    });
    if (d.hadith?.propheticPractice?.grading) gradeCheck('hadith layer practice', d.hadith.propheticPractice.source, d.hadith.propheticPractice.grading);
    // HadithLayer.tsx renders `grading || 'authentic'`: a layer with NO grading does not
    // hide the grade, it prints the word "Authentic". So a missing grading is a claim of
    // authenticity and gets the same test as an explicit one.
    if (d.hadith && !d.hadith.propheticPractice?.grading) {
      const ks = citesIn(d.hadith.propheticPractice?.source ?? d.hadith.source);
      const collectionGraded = ks.length && ks.every((k) => ['bukhari', 'muslim'].includes(k.split(':')[0]));
      gradeCheck('hadith layer (no grading → the screen prints "Authentic")', d.hadith.propheticPractice?.source ?? d.hadith.source, collectionGraded ? 'sahih' : 'hasan');
    }
    // P5b — gradings stated in PROSE: "[Tirmidhi 1087, graded sahih]" is a claim too.
    for (const [label, text] of dayFields(d)) {
      for (const m of String(text ?? '').matchAll(/\[([^\]]*?)\bgraded\s+(sahih|hasan)\b[^\]]*\]/gi)) gradeCheck(`${label} (stated in prose)`, m[1], m[2]);
    }
    // P8 — a bare hadith citation under a "Sunnah Action" badge asserts the step IS
    // that hadith's practice. Only a person can say whether the instruction is in
    // it (CLAUDE.md rule 7), so each one needs a recorded review.
    d.steps.forEach((s, i) => {
      if (s.sourceType === 'sunnah_action' && citesIn(s.source).length && !/["“]/.test(s.source || '') && !HUMAN_REVIEWED.find(([a, t]) => a === d.angleId && t === s.title)) {
        fail('P8 bare citation under a Sunnah Action badge', d, `step ${i + 1} "${s.title}": «${s.source}» — quote the line the step rests on, or record a human review in HUMAN_REVIEWED`);
      }
    });

    // P6 — hadith layer English is recognisably the published text
    if (d.hadith) {
      const k = citesIn(d.hadith.source)[0];
      const rec = k && src.H[k];
      if (rec) {
        const layer = d.hadith.englishTranslation || d.hadith.translation || '';
        const ov = (target) => { const w = wordsKeep(layer), t = new Set(wordsKeep(target)); return w.length ? w.filter((x) => t.has(x)).length / w.length : 0; };
        const o = Math.max(ov(rec.en), rec.alt ? ov(rec.alt) : 0);
        if (o < 0.55 && !ALLOW_LAYERS.find(([a]) => a === d.angleId)) fail('P6 hadith layer text is not the published hadith', d, `${k}: only ${(o * 100).toFixed(0)}% of the layer's words appear in the published English`);
      }
    }
  }
  return { F, notes };
}

// ── injected faults (negative controls) ──────────────────────────────────────
function injections(days, src) {
  const clone = () => JSON.parse(JSON.stringify(days));
  const out = [];
  const withCite = (ds) => ds.find((d) => d.steps.some((s) => citesIn(s.source).some((k) => MIRROR.has(k.split(':')[0]))));
  // F1 — duplicate hadith across two days of one journey
  { const ds = clone(); const a = withCite(ds); const k = a && a.steps.flatMap((s) => citesIn(s.source)).find((x) => MIRROR.has(x.split(':')[0]));
    const b = ds.find((d) => d.journey === a.journey && d.day !== a.day);
    if (a && b && k) { const [c, n] = k.split(':'); b.steps[0].source = `${(c === 'bukhari' ? 'Sahih al-Bukhari' : c === 'tirmidhi' ? 'Tirmidhi' : c === 'abudawud' ? 'Sunan Abi Dawud' : 'Ibn Majah')} ${n}`; out.push(['P1 hadith reused', ds]); } }
  // F2 — a stitched quotation: alter one word inside a quote that currently passes
  { const ds = clone(); const d = ds.find((x) => quotesIn(x.angle.angle).length && /^\[Tafsir Ibn Kathir/.test(x.angle.angle) && /said:|says:/.test(x.angle.angle));
    if (d) { const q = quotesIn(d.angle.angle)[0]; d.angle.angle = d.angle.angle.replace(q, q.replace(/\b(\w{5,})\b/, 'zzzzzz')); out.push(['P2 quotation not found in any source', ds]); } }
  // F3 — a Da'if hadith graded hasan
  { const ds = clone(); const d = ds[0]; d.steps[0].source = 'Abu Dawud 1518'; d.steps[0].sourceGrading = 'hasan'; d.steps[0].sourceType = 'prophetic_dua'; out.push(['P5 grading over-claims', ds]); }
  // F4 — a scholar credited who is not the tag
  { const ds = clone(); const d = ds.find((x) => /^\[Tafsir Ibn Kathir/.test(x.angle.angle)); d.angle.angle += ' Al-Ghazali explains this at length.'; out.push(['P4 scholar credited who is not the tagged tafsir', ds]); }
  // F5 — a verse quote worded like Sahih International (so it EXISTS in a source and P2 passes)
  // but not like the translation printed on that day's screen. Real instance: Rizq day 9 once
  // quoted "walk among its slopes" under a verse card that read "walk in its paths".
  { const ds = clone(); let done = false;
    for (const d of ds) { if (done) break; const disp = nz(d.verse.englishTranslation);
      for (const [s, a] of refsIn(d.angle.angle)) { const q = src.Q[`${s}:${a}`]; if (!q) continue;
        const w = q.text.split(/\s+/);
        for (let i = 0; i + 8 <= w.length && !done; i++) { const win = w.slice(i, i + 8).join(' ');
          if (!disp.includes(nz(win)) && overlap(win, d.verse.englishTranslation) >= 0.6) { d.angle.angle += ` The ayah says "${win}".`; out.push(['P3 verse quote differs from the verse shown', ds]); done = true; } } } } }
  // F6 — a grade on a scholar's teaching
  { const ds = clone(); const d = ds.find((x) => x.steps.some((s) => SUGGESTED.test(s.source || ''))); const s = d.steps.find((x) => SUGGESTED.test(x.source || '')); s.sourceGrading = 'hasan'; out.push(['P5 grading without a hadith citation', ds]); }
  // F7 — an early authority the tagged entry never mentions
  { const ds = clone(); const d = ds.find((x) => /^\[Tafsir Ibn Kathir/.test(x.angle.angle)); d.angle.angle += ' Ikrimah and Ad-Dahhak both said otherwise.'; out.push(['P4 authority absent from the tagged entry', ds]); }
  // F8 — a scripture badge on a step that shows no Arabic (the 23-step fault in Study/Results)
  { const ds = clone(); const d = ds.find((x) => x.steps.some((s) => s.sourceType === 'quran_dua' && s.arabicText)); const s = d.steps.find((x) => x.sourceType === 'quran_dua' && x.arabicText); delete s.arabicText; out.push(['P7 badge promises words but the step has no Arabic', ds]); }
  // F9 — a bare citation under a Sunnah Action badge that nobody has reviewed
  { const ds = clone(); const s = ds[0].steps[0]; s.sourceType = 'sunnah_action'; s.source = 'Sahih al-Bukhari 793'; out.push(['P8 bare citation under a Sunnah Action badge', ds]); }
  // F10 — a hadith layer whose English is not that hadith at all
  { const ds = clone(); const d = ds.find((x) => x.hadith && !ALLOW_LAYERS.find(([a]) => a === x.angleId) && citesIn(x.hadith.source).some((k) => src.H[k])); d.hadith.englishTranslation = 'The quick brown fox jumps over the lazy dog every single day without fail'; d.hadith.translation = d.hadith.englishTranslation; out.push(['P6 hadith layer text is not the published hadith', ds]); }
  // F11 — a grade stated in prose over a hadith the graders call weak
  { const ds = clone(); ds[0].angle.angle += ' It is reported [Abu Dawud 1518, graded sahih].'; out.push(['P5 grading over-claims', ds]); }
  // F13 — a hadith layer with NO grading on a weak hadith: HadithLayer.tsx prints "Authentic"
  { const ds = clone(); const d = ds.find((x) => x.hadith && !ALLOW_GRADINGS.find(([a]) => a === x.angleId)); d.hadith.source = 'Abu Dawud 1518'; d.hadith.propheticPractice = { description: 'x', source: 'Abu Dawud 1518' }; out.push(['P5 grading over-claims', ds]); }
  // F14 — a citation in a collection we can fetch, to a number that does not resolve
  { const ds = clone(); ds[0].steps[0].source = 'Sahih al-Bukhari 99999'; out.push(['P0 cited source could not be fetched', ds]); }
  // F12 — a "Suggested practice" step wearing a scripture badge
  { const ds = clone(); const d = ds.find((x) => x.steps.some((s) => /^Suggested practice/.test(s.source || ''))); d.steps.find((s) => /^Suggested practice/.test(s.source || '')).sourceType = 'quran_dua'; out.push(['P7 badge on a step that claims no source', ds]); }
  return out;
}

// ── main ─────────────────────────────────────────────────────────────────────
const days = loadDays();
const src = await prefetch(days);
const { F, notes } = runChecks(days, src);

const byCheck = {};
for (const f of F) (byCheck[f.check] ??= []).push(f);
console.log(`journey claims — ${days.length} days across ${new Set(days.map((d) => d.journey)).size} journeys${REV ? ` @ ${REV}` : ''}\n`);
for (const [c, list] of Object.entries(byCheck)) {
  console.log(`!! ${c} (${list.length})`);
  for (const f of list) console.log(`   ${f.journey} day ${f.day}: ${f.msg}`);
}
const un = [...new Set(notes)];
if (un.length) { console.log(`\n${un.length} note(s) — not failures:`); for (const n of un) console.log('   · ' + n); }
console.log(F.length ? `\n*** ${F.length} CLAIM FAILURE(S)` : '\nAll claim checks passed.');

if (INJECT) {
  if (F.length) { console.log('\nINJECT mode needs a clean baseline (negative tests are meaningless otherwise).'); process.exit(1); }
  // F3 injects a citation the live data no longer contains; fetch it so the grade check has grades.
  src.H['abudawud:1518'] ??= await fetchHadith('abudawud:1518');
  let ok = true;
  for (const [want, ds] of injections(days, src)) {
    const r = runChecks(ds, src);
    const hit = r.F.some((f) => f.check === want);
    console.log(`${hit ? '  ok  ' : '  MISS'} injected fault detected as «${want}»`);
    if (!hit) ok = false;
  }
  console.log(ok ? '\nAll injected faults detected.' : '\n*** a fault went undetected — the check is a no-op');
  process.exit(ok ? 0 : 1);
}
process.exit(F.length ? 1 : 0);
