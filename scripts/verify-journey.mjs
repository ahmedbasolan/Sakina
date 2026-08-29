/**
 * Journey content verifier — see CLAUDE.md § "Journey Sessions".
 *
 * Checks, per journey day: refs resolve; the angle is a purpose-written
 * journey angle (not a mood angle borrowed from the mood-picker flow); angle
 * mood matches the path theme; practiceSteps JSON parses with valid union
 * members; no verse / hadith / du'a repeats inside one journey; and that the
 * angle text will actually render — a [Tafsir ...] tag at string start so the
 * footnote does not fall back to the verse's whyThis, and a split pattern so
 * ContextLayer produces both an Understand and a Matters section.
 *
 * Run: node scripts/verify-journey.mjs
 */
import fs from 'fs';

const paths = fs.readFileSync('src/data/staticPaths.ts', 'utf8');
const quran = fs.readFileSync('src/data/quranData.ts', 'utf8');
const hadith = fs.readFileSync('src/data/hadithData.ts', 'utf8');

// [path id, required angle-id prefix, required angle mood (= the path theme)]
// [pathId, anglePrefix, theme, strict]
//
// `strict: false` runs every check and prints every finding, but reports them
// as notes rather than failures. Rizq and Salah predate these rules and have 44
// findings between them; listing them strictly would leave the run permanently
// red, and — worse — permanently disable verify-journey-selftest, which refuses
// to run when the baseline already fails ("negative tests are meaningless").
// Keeping the baseline green is what makes the 12 injected-fault tests mean
// anything. Flip a journey to strict once its findings are cleared.
const JOURNEYS = [
  ['path_trusting_the_results', 'q_angle_results_', 'Overwhelmed', true],
  ['path_study_journaling', 'q_angle_study_', 'Hopeful', true],
  ['path_rizq_revolution', 'q_angle_rizq_', 'Overwhelmed', true],
  // theme moved Hopeful -> Calm with the content rebuild: all seven angles are
  // about khushu and stillness, which is Calm, and one path edit beat seven.
  ['path_salah_transformation', 'q_angle_salah_', 'Calm', true],
  ['path_prayer_leadership', 'q_angle_imam_', 'Hopeful', true],
  ['path_hope_after_crisis', 'q_angle_crisis_', 'Sad', true],
  ['path_marriage_seeker', 'q_angle_marriage_', 'Hopeful', true],
  ['path_tawbah_intensive', 'q_angle_tawbah_', 'Guilty', true],
];

const contentIds = new Set([...quran.matchAll(/id: '(quran_[a-z0-9_]+)'/g)].map((m) => m[1]));
const angleIds = new Set([...quran.matchAll(/id: '(q_angle_[a-z0-9_]+)'/g)].map((m) => m[1]));
const hadIds = new Set([...hadith.matchAll(/id: '(hadith_[a-z0-9_]+)'/g)].map((m) => m[1]));

// Derived from the IconName union rather than hardcoded. The previous literal
// list had drifted 11 names behind Icon.tsx (handshake, gem, globe, person,
// trophy, water-drop, calm-face, …), so this check rejected 52 angles that
// render perfectly well — a false negative is how a checker loses its authority.
const iconUnion = fs.readFileSync('src/components/Icon.tsx', 'utf8').match(/export type IconName =[\s\S]*?;/);
if (!iconUnion) {
  console.error('Could not find the `export type IconName = …;` union in src/components/Icon.tsx.');
  console.error('If it was renamed or reshaped, update this parser — do not fall back to a literal');
  console.error('list, which is what drifted 11 names out of date last time.');
  process.exit(1);
}
const ICONS = new Set([...iconUnion[0].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]));
const TYPES = new Set(['mindset', 'physical', 'verbal']);
// Derived from the PracticeSourceType union, for the same reason ICONS is:
// a hardcoded copy drifts. 'composed_dua' was added in 2026-07 and a literal
// list here would have rejected every step using it.
const srctUnion = fs.readFileSync('src/types/index.ts', 'utf8').match(/export type PracticeSourceType =[\s\S]*?;/);
if (!srctUnion) {
  console.error('Could not find the `export type PracticeSourceType = …;` union in src/types/index.ts.');
  process.exit(1);
}
const SRCT = new Set([...srctUnion[0].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]));

// Mirrors ContextLayer.splitIntoSections / extractSourceLabel / cleanText.
const SPLIT = [/\.\s+The Prophet\s+ﷺ\s+said:/,/\.\s+The Prophet\s+ﷺ\s+would/,/\.\s+The Prophet\s+ﷺ\s+used to/,/\.\s+The Prophet\s+ﷺ\s+never/,/\.\s+The Prophet\s+ﷺ\s+himself/,/\.\s+The Prophet\s+ﷺ\s+was/,/\.\s+Your\s/,/\.\s+When you/,/\.\s+Despair/,/\.\s+Being an ally/,/\.\s+No sadness/,/\.\s+Even when/];
const clean = (t) => t.replace(/\s*\[(?:Tafsir[^\]]*|Sahih[^\]]*|At-Tirmidhi[^\]]*|Abu Dawud[^\]]*|Musnad[^\]]*|Ibn[^\]]*|An-Nasa[^\]]*|Al-[^\]]*)\]\s*/g, ' ').trim();

/**
 * Extract the balanced `{...}` object literal containing `id: '<id>'`.
 *
 * Brace counting must ignore braces inside string literals — angle text and
 * practiceSteps instructions are prose and may legitimately contain `{`.
 * Counting them shifts the depth and the object never closes, which surfaces
 * as a misleading "could not be parsed" instead of the real fault.
 */
function objectAt(src, id) {
  const at = src.indexOf(`id: '${id}'`);
  if (at < 0) return null;
  let open = at;
  while (src[open] !== '{') open--;
  let depth = 0, quote = null;
  for (let k = open; k < src.length; k++) {
    const c = src[k];
    if (quote) {
      if (c === '\\') k++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return eval('(' + src.slice(open, k + 1) + ')');
    }
  }
  return null;
}

let fail = 0, reported = 0;

for (const [pathId, anglePrefix, theme, strict] of JOURNEYS) {
  const path = objectAt(paths, pathId);
  if (!path) { console.log(`!! path not found: ${pathId}`); fail++; continue; }

  // In a non-strict journey the same checks run and print, but count toward
  // `reported` instead of `fail` — visible without gating the build.
  const err = strict
    ? (d, m) => { console.log(`  !! day ${d}: ${m}`); fail++; }
    : (d, m) => { console.log(`  ?? day ${d}: ${m}`); reported++; };
  // Observations that are legal but worth seeing. They do not fail the run.
  const note = (d, m) => { console.log(`  ·  day ${d}: ${m}`); };
  const seenVerse = new Map(), seenDua = new Map(), seenHadith = new Map();

  console.log(`=== ${path.title} — ${path.dailySteps.length}/${path.duration} days · theme ${path.theme} ===\n`);

  if (path.dailySteps.length !== path.duration) {
    console.log(`  !! ${path.dailySteps.length} steps but duration ${path.duration}`);
    fail++;
  }

  for (const step of path.dailySteps) {
    const day = step.day;
    if (!contentIds.has(step.contentId)) err(day, `missing content ${step.contentId}`);
    // hadithContentId is optional (CLAUDE.md: "optional `hadithContentId`").
    // Only a hadith that is named but does not exist is a fault; a day with no
    // hadith simply renders one layer fewer. Reporting absence as "missing
    // hadith undefined" produced 13 false failures on Rizq and Salah.
    if (step.hadithContentId && !hadIds.has(step.hadithContentId)) {
      err(day, `missing hadith ${step.hadithContentId}`);
    } else if (!step.hadithContentId) {
      note(day, 'no hadith on this day (renders one layer fewer)');
    }
    if (!angleIds.has(step.angleId)) err(day, `missing angle ${step.angleId}`);
    if (!step.angleId.startsWith(anglePrefix)) {
      err(day, `borrowed mood angle: ${step.angleId} (expected ${anglePrefix}*)`);
      continue;
    }

    if (seenVerse.has(step.contentId)) err(day, `verse ${step.contentId} also on day ${seenVerse.get(step.contentId)}`);
    seenVerse.set(step.contentId, day);

    const h = objectAt(hadith, step.hadithContentId);
    if (h) {
      if (seenHadith.has(h.source)) err(day, `hadith ${h.source} also on day ${seenHadith.get(h.source)}`);
      seenHadith.set(h.source, day);
    }

    const a = objectAt(quran, step.angleId);
    if (!a) { err(day, 'angle could not be parsed'); continue; }
    if (a.contentId !== step.contentId) err(day, `angle.contentId ${a.contentId} != step ${step.contentId}`);
    if (a.mood !== theme) err(day, `angle mood ${a.mood} != path theme ${theme}`);

    let ps;
    if (!a.practiceSteps) {
      // Distinct from malformed JSON. PathStepScreen falls back to the angle's
      // loose `action` field: one step, no du'a block, no source. All seven
      // Salah days are in this state.
      err(day, 'no practiceSteps — falls back to the bare `action` field');
      continue;
    }
    try { ps = JSON.parse(a.practiceSteps); } catch { err(day, 'practiceSteps JSON invalid'); continue; }
    for (const s of ps) {
      if (!TYPES.has(s.type)) err(day, `bad type ${s.type}`);
      if (!ICONS.has(s.icon)) err(day, `bad icon ${s.icon}`);
      // sourceType is optional by design — a step that claims no chain omits it
      // (see PracticeStepData). Only a value outside the union is a fault.
      if (s.sourceType !== undefined && !SRCT.has(s.sourceType)) {
        err(day, `bad sourceType ${s.sourceType}`);
      }
      if (!s.source) err(day, `practice step "${s.title}" missing source`);
    }

    if (a.actionArabicText) {
      if (seenDua.has(a.actionArabicText)) err(day, `du'a repeats day ${seenDua.get(a.actionArabicText)}`);
      seenDua.set(a.actionArabicText, day);
    }

    const lbl = (a.angle.match(/\[Tafsir\s+[^\]]+\]/) || [])[0];
    if (!lbl) err(day, 'no [Tafsir ...] tag — footnote falls back to the verse whyThis');
    else if (a.angle.indexOf(lbl) !== 0) err(day, 'tafsir tag not at string start (leaves a stray space)');

    let u = a.angle, mt = '';
    for (const p of SPLIT) {
      const x = a.angle.match(p);
      if (x) { u = a.angle.slice(0, x.index + 1); mt = a.angle.slice(x.index + 1); break; }
    }
    // No pattern is not automatically fatal: splitIntoSections falls back to a
    // 60% sentence split when the text has >= 4 sentences, and only returns an
    // empty `matters` below that. Saying "will be empty" for every miss
    // overstated 13 findings.
    // Both branches are failures — CLAUDE.md requires the angle to contain a
    // pattern so the split lands where you intend. They are worded differently
    // because the consequence differs: >= 4 sentences degrades to an arbitrary
    // 60% cut, below that `matters` renders empty. The message used to claim
    // "will be empty" in both cases, which overstated 7 of them.
    if (!mt) {
      const sentences = a.angle.split(/(?<=\.)\s+/).length;
      if (sentences >= 4) err(day, `no split pattern — falls back to an arbitrary 60% cut (${sentences} sentences)`);
      else err(day, `no split pattern and only ${sentences} sentence(s) — Matters section renders empty`);
    }
    if (/\s\./.test(clean(u))) err(day, 'stray space before a period after tag strip');

    console.log(`day ${day} — ${step.title}`);
    console.log(`   ${step.contentId} · ${step.angleId} · ${h ? h.source : '?'}`);
    console.log(`   label: ${lbl ? lbl.replace(/[[\]]/g, '') : '(none)'} · practice: ${ps.length} steps`);
    console.log(`   U: ${clean(u).slice(0, 92)}...`);
    console.log(`   M: ${clean(mt).slice(0, 92)}...\n`);
  }
}

// ── Universal borrowed-angle pass — EVERY path, listed or not ─────────────
//
// The per-journey checks above only run for paths in JOURNEYS. Four paths that
// are not in it — depression_iman, wrong_marriage, forced_marriage,
// ramadan_reset — each had a single stub day pointing at a MOOD angle, which
// is CLAUDE.md journey rule 1 and the exact bug that shipped on Trusting the
// Results day 1. They were locked behind AVAILABLE_PATH_IDS, so nothing
// rendered them, but unlocking one would have shipped it.
//
// Any dailyStep anywhere must point at an angle written for a journey.
const journeyPrefixes = (() => {
  const repo = fs.readFileSync('src/services/contentRepository.ts', 'utf8');
  const m = repo.match(/export const JOURNEY_ANGLE_PREFIXES = \[([^\]]*)\]/);
  if (!m) { console.log('!! could not read JOURNEY_ANGLE_PREFIXES'); fail++; return []; }
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
})();

for (const pm of paths.matchAll(/id:\s*'(path_[a-zA-Z0-9_]+)'/g)) {
  const path = objectAt(paths, pm[1]);
  if (!path || !Array.isArray(path.dailySteps)) continue;
  path.dailySteps.forEach((step, i) => {
    if (!step.angleId) return;
    if (journeyPrefixes.some((p) => step.angleId.startsWith(`q_angle_${p}_`))) return;
    console.log(`  !! ${pm[1]} day ${i + 1}: borrows mood angle ${step.angleId} — journey days need their own angle`);
    fail++;
  });
}

// ── Universal surah-lesson pass — EVERY path ──────────────────────────────
//
// `surahIds` adds one SurahLayer per entry to a day's pager (PathStepScreen).
// An id that does not resolve is dropped there rather than crashing, so a typo
// would silently remove a layer the day's instructions still refer to — "add
// Al-A'la and Al-Ghashiyah" with no Al-Ghashiyah screen behind it.
const surahIds = (() => {
  const f = 'src/data/surahLessons.ts';
  if (!fs.existsSync(f)) return null;
  return new Set([...fs.readFileSync(f, 'utf8').matchAll(/^  (surah_\d+): \{$/gm)].map((m) => m[1]));
})();
if (!surahIds) {
  console.log('!! src/data/surahLessons.ts not found — surah layers cannot be checked');
  fail++;
} else if (surahIds.size === 0) {
  // A parser that silently returns nothing would report every id as missing,
  // which reads like a data fault rather than a broken checker. Say which it is.
  console.log('!! parsed 0 surah lessons from surahLessons.ts — the parser is broken, not the data');
  fail++;
} else {
  let checked = 0;
  for (const pm of paths.matchAll(/id:\s*'(path_[a-zA-Z0-9_]+)'/g)) {
    const path_ = objectAt(paths, pm[1]);
    if (!path_ || !Array.isArray(path_.dailySteps)) continue;
    path_.dailySteps.forEach((step, i) => {
      if (!Array.isArray(step.surahIds)) return;
      if (step.surahIds.length === 0) {
        console.log(`  !! ${pm[1]} day ${i + 1}: empty surahIds — drop the field instead`);
        fail++;
      }
      for (const id of step.surahIds) {
        checked++;
        if (!surahIds.has(id)) {
          console.log(`  !! ${pm[1]} day ${i + 1}: missing surah lesson ${id}`);
          fail++;
        }
      }
      const dup = step.surahIds.filter((x, k) => step.surahIds.indexOf(x) !== k);
      if (dup.length) {
        console.log(`  !! ${pm[1]} day ${i + 1}: surah ${dup[0]} listed twice`);
        fail++;
      }
    });
  }
  console.log(`\nsurah lesson layers referenced: ${checked}, all resolving to src/data/surahLessons.ts`);
}

// ── Universal du'a-repeat pass — EVERY journey, not just the JOURNEYS list ──
//
// The per-journey check above only looks at `actionArabicText`, and only for
// the journeys listed at the top. Rizq Revolution is in neither category and
// shipped the same supplication on day 1 and day 10 — a seventh of a 14-day
// arc, invisible to every check we had. This pass reads staticPaths directly,
// covers all paths, and looks at practiceSteps Arabic as well as the action
// field, so the repeat is caught wherever it is written.
const normAr = (s) =>
  (s || '').replace(/[ً-ْٰ]/g, '').replace(/[آأإٱ]/g, 'ا')
    .replace(/[^؀-ۿ]/g, '');

for (const pm of paths.matchAll(/id:\s*'(path_[a-zA-Z0-9_]+)'/g)) {
  const path = objectAt(paths, pm[1]);
  if (!path || !Array.isArray(path.dailySteps) || path.dailySteps.length < 2) continue;
  const seen = new Map();
  path.dailySteps.forEach((step, i) => {
    const a = step.angleId && objectAt(quran, step.angleId);
    if (!a) return;
    const arabics = new Set();
    if (a.actionArabicText) arabics.add(normAr(a.actionArabicText));
    if (a.practiceSteps) {
      let ps = [];
      try { ps = JSON.parse(a.practiceSteps); } catch { /* the JSON check above owns this */ }
      for (const s of ps) if (s.arabicText) arabics.add(normAr(s.arabicText));
    }
    for (const ar of arabics) {
      if (ar.length < 8) continue;
      if (seen.has(ar)) {
        console.log(`  !! ${pm[1]} day ${i + 1}: du'a repeats day ${seen.get(ar)} — ${ar.slice(0, 40)}`);
        fail++;
      } else seen.set(ar, i + 1);
    }
  });
}

if (reported) {
  const soft = JOURNEYS.filter((j) => !j[3]).map((j) => j[0]).join(', ');
  console.log(`\n?? ${reported} finding(s) in non-strict journeys (${soft}) — reported, not gating.`);
  console.log('   Clear them, then flip the journey to strict in JOURNEYS.');
}
console.log(fail ? `\n*** ${fail} FAILURES` : '\nAll checks passed.');
process.exit(fail ? 1 : 0);
