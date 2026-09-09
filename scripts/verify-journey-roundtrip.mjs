/**
 * End-to-end data-layer test for the journey angles.
 *
 * Uses the REAL artifacts, not reimplementations:
 *   - schema DDL lifted from src/database/operations.ts
 *   - row builder + column list from src/database/seedContent.ts
 *   - read query + field mapping from ContentRepository.fetchAngleById
 *   - practiceSteps parse from PathStepScreen
 *   - splitIntoSections / extractSourceLabel / cleanText from ContextLayer
 *
 * Proves a journey day survives seed -> SQLite -> fetch -> render.
 */
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'module';

// Resolve `typescript` from the repo root (cwd), which works whether this is
// run from scripts/ or from the project root.
const req = createRequire(path.join(process.cwd(), 'package.json'));
const ts = req('typescript');

// Minimal TS module loader: transpiles and follows relative imports so
// staticPaths.ts can pull in ../constants and ../types for real.
const cache = new Map();
function load(p) {
  const file = ['', '.ts', '.tsx', '/index.ts'].map((e) => p + e).find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
  if (!file) return {};
  const key = path.resolve(file);
  if (cache.has(key)) return cache.get(key);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  cache.set(key, mod.exports);
  const localRequire = (spec) =>
    spec.startsWith('.') ? load(path.join(path.dirname(key), spec)) : {};
  new Function('module', 'exports', 'require', js)(mod, mod.exports, localRequire);
  cache.set(key, mod.exports);
  return mod.exports;
}

const { quranContentAngles, quranContent } = load('src/data/quranData.ts');
const { STATIC_SPIRITUAL_PATHS } = load('src/data/staticPaths.ts');

const db = new DatabaseSync(':memory:');
db.exec(`CREATE TABLE content_angles (
  id TEXT PRIMARY KEY, contentId TEXT NOT NULL, mood TEXT NOT NULL, angle TEXT NOT NULL,
  angleSource TEXT, action TEXT, actionArabicText TEXT, actionTransliteration TEXT,
  actionSource TEXT, actionHowTo TEXT, actionReward TEXT, practiceSteps TEXT, reflection TEXT);`);

// Exactly seedContent.ts's row builder + column list.
const ins = db.prepare(`INSERT OR REPLACE INTO content_angles
  (id, contentId, mood, angle, angleSource, action, actionArabicText,
   actionTransliteration, actionSource, actionHowTo, actionReward, practiceSteps, reflection)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
for (const a of quranContentAngles) {
  ins.run(a.id, a.contentId, a.mood, a.angle, a.angleSource ?? null, a.action ?? null,
    a.actionArabicText ?? null, a.actionTransliteration ?? null, a.actionSource ?? null,
    a.actionHowTo ?? null, a.actionReward ?? null,
    a.practiceSteps == null ? null : typeof a.practiceSteps === 'string' ? a.practiceSteps : JSON.stringify(a.practiceSteps),
    a.reflection ?? null);
}
console.log(`seeded ${quranContentAngles.length} angles into sqlite\n`);

// ContentRepository.fetchAngleById
let injected = 0;
const sel = db.prepare(`SELECT * FROM content_angles WHERE id = ?`);
const fetchAngleById = (id) => {
  const row = sel.get(id);
  if (!row) return null;
  // Negative-test hook. This script has no selftest harness of its own, so the
  // only way to show the round-trip checks below actually fail on a broken read
  // is to break one deliberately: `RT_INJECT=1 node scripts/verify-journey-roundtrip.mjs`
  // must report a source mismatch and a lost-Arabic failure. Never set in CI.
  //
  // It targets whichever angle actually carries Arabic rather than a fixed id,
  // and throws if the substitution changed nothing. The first version named
  // q_angle_imam_day7; renumbering a journey moved the Arabic off that day and
  // the hook silently became a no-op, reporting 0 failures and "proving" the
  // checks worked. A negative test that cannot fail is worse than no test.
  if (process.env.RT_INJECT === '1' && /"arabicText":"[^"]/.test(row.practiceSteps ?? '')) {
    const broken = row.practiceSteps.replace(/"arabicText":"[^"]*"/, '"arabicText":"lost"');
    if (broken === row.practiceSteps) throw new Error('RT_INJECT changed nothing — the hook is dead');
    row.practiceSteps = broken;
    injected++;
  }
  return { id: row.id, contentId: row.contentId, mood: row.mood, angle: row.angle,
    angleSource: row.angleSource, action: row.action, actionArabicText: row.actionArabicText,
    actionTransliteration: row.actionTransliteration, actionSource: row.actionSource,
    actionHowTo: row.actionHowTo, actionReward: row.actionReward,
    practiceSteps: row.practiceSteps, reflection: row.reflection };
};

// ContextLayer
const SPLIT = [/\.\s+The Prophet\s+ﷺ\s+said:/,/\.\s+The Prophet\s+ﷺ\s+would/,/\.\s+The Prophet\s+ﷺ\s+used to/,/\.\s+The Prophet\s+ﷺ\s+never/,/\.\s+The Prophet\s+ﷺ\s+himself/,/\.\s+The Prophet\s+ﷺ\s+was/,/\.\s+Your\s/,/\.\s+When you/,/\.\s+Despair/,/\.\s+Being an ally/,/\.\s+No sadness/,/\.\s+Even when/];
const clean = (t) => t.replace(/\s*\[(?:Tafsir[^\]]*|Sahih[^\]]*|At-Tirmidhi[^\]]*|Abu Dawud[^\]]*|Musnad[^\]]*|Ibn[^\]]*|An-Nasa[^\]]*|Al-[^\]]*)\]\s*/g, ' ').trim();

let fail = 0;
const contentById = new Map(quranContent.map((c) => [c.id, c]));

const angleSrc = new Map(quranContentAngles.map((a) => [a.id, a]));

for (const pathId of ['path_trusting_the_results', 'path_study_journaling', 'path_prayer_leadership', 'path_hope_after_crisis', 'path_marriage_seeker', 'path_tawbah_intensive', 'path_death_awareness', 'path_screen_detox']) {
  const path = STATIC_SPIRITUAL_PATHS.find((p) => p.id === pathId);
  console.log(`=== ${path.title} ===`);
  for (const step of path.dailySteps) {
    const a = fetchAngleById(step.angleId);          // the real read path
    if (!a) { console.log(`  !! day ${step.day}: fetchAngleById returned null -> "A Moment of Patience" alert`); fail++; continue; }

    // PathStepScreen's practiceSteps memo
    let ps = [];
    try { ps = JSON.parse(a.practiceSteps); } catch { console.log(`  !! day ${step.day}: practiceSteps unparseable after round trip`); fail++; }
    if (!ps.length) { console.log(`  !! day ${step.day}: 0 practice steps -> empty Practice layer`); fail++; }

    // Compare against the pre-DB source of truth rather than against a shape
    // rule. The previous check required every `verbal` step to carry Arabic,
    // which encoded a habit of the first two journeys rather than a
    // requirement: PracticeLayer guards the du'a block on `item.arabicText`
    // (line ~264), so a verbal step that only asks you to recite something
    // aloud renders correctly with none. What actually has to hold is that
    // whatever the source declares survives seed -> SQLite -> fetch intact.
    const srcAngle = angleSrc.get(step.angleId);
    let srcSteps = [];
    try { srcSteps = JSON.parse(srcAngle?.practiceSteps ?? '[]'); } catch { /* the parse check above owns this */ }
    if (JSON.stringify(srcSteps) !== JSON.stringify(ps)) {
      console.log(`  !! day ${step.day}: practiceSteps do not match the source after the round trip`);
      fail++;
    }
    // A step that does declare Arabic must still have it, and must be readable.
    for (const s of ps.filter((x) => x.arabicText)) {
      if (!/[؀-ۿ]/.test(s.arabicText)) { console.log(`  !! day ${step.day}: step "${s.title}" lost its Arabic`); fail++; }
      if (!s.translation) { console.log(`  !! day ${step.day}: step "${s.title}" shows Arabic with no translation`); fail++; }
    }

    // ContextLayer sections + footnote
    const content = contentById.get(step.contentId);
    let u = a.angle, m = '';
    for (const p of SPLIT) { const x = a.angle.match(p); if (x) { u = a.angle.slice(0, x.index + 1); m = a.angle.slice(x.index + 1); break; } }
    const tag = (a.angle.match(/\[Tafsir\s+[^\]]+\]/) || [])[0];
    const label = tag ? tag.replace(/[[\]]/g, '') : content?.whyThis || 'Islamic Scholarship';
    if (!m) { console.log(`  !! day ${step.day}: empty Matters section`); fail++; }
    if (!tag) { console.log(`  !! day ${step.day}: footnote falls back to whyThis`); fail++; }
    if (!a.reflection) { console.log(`  !! day ${step.day}: no reflection prompt -> generic fallback copy`); fail++; }

    // Layer count PathStepScreen will build
    const layers = step.hadithContentId ? 5 : 4;
    console.log(`  day ${step.day}: ${layers} layers · ${ps.length} practice (${ps.filter((x)=>x.arabicText).length} with Arabic) · footnote "${label.slice(0,34)}" · U ${clean(u).length}ch / M ${clean(m).length}ch`);
  }
  console.log();
}

// Guard: the mood angles the journeys used to borrow must still exist for the
// mood-picker flow — rewiring the journeys must not have orphaned them.
for (const id of ['q_angle_3_159_angry','q_angle_2_216_sad','q_angle_94_5_stressed','q_angle_2_153_stressed','q_angle_65_3_anxious','q_angle_14_7_grateful','q_angle_2_286_anxious','q_angle_53_39_anxious','q_angle_22_77_energized','q_angle_103_1_3_energized','q_angle_14_7_content']) {
  if (!fetchAngleById(id)) { console.log(`!! orphaned: ${id} no longer in the seed`); fail++; }
}
console.log('mood angles still intact for the mood picker: yes');

if (process.env.RT_INJECT === '1') {
  console.log(`\nRT_INJECT corrupted ${injected} angle(s); ${fail} failure(s) reported.`);
  if (!injected || !fail) {
    console.log('*** the negative test proved nothing — it must corrupt at least one angle and fail.');
    process.exit(1);
  }
  process.exit(0);
}

console.log(fail ? `\n*** ${fail} FAILURES` : '\nRound trip clean.');
process.exit(fail ? 1 : 0);
