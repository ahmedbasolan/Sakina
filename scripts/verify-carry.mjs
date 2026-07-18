/**
 * Replays PathStepScreen's `carry` selection + the completion card's render
 * conditions against angles read back out of a real SQLite round trip.
 */
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'module';

const req = createRequire(path.join(process.cwd(), 'package.json'));
const ts = req('typescript');

const cache = new Map();
function load(p) {
  const f = ['', '.ts', '.tsx', '/index.ts'].map((e) => p + e).find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
  if (!f) return {};
  const k = path.resolve(f);
  if (cache.has(k)) return cache.get(k);
  const js = ts.transpileModule(fs.readFileSync(f, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const m = { exports: {} };
  cache.set(k, m.exports);
  new Function('module', 'exports', 'require', js)(m, m.exports, (s) =>
    s.startsWith('.') ? load(path.join(path.dirname(k), s)) : {},
  );
  cache.set(k, m.exports);
  return m.exports;
}

const { quranContentAngles } = load('src/data/quranData.ts');
const { STATIC_SPIRITUAL_PATHS } = load('src/data/staticPaths.ts');

// Real DDL + seeder column list + read query.
const db = new DatabaseSync(':memory:');
db.exec(`CREATE TABLE content_angles (
  id TEXT PRIMARY KEY, contentId TEXT NOT NULL, mood TEXT NOT NULL, angle TEXT NOT NULL,
  angleSource TEXT, action TEXT, actionArabicText TEXT, actionTransliteration TEXT,
  actionSource TEXT, actionHowTo TEXT, actionReward TEXT, practiceSteps TEXT, reflection TEXT);`);
const ins = db.prepare(`INSERT OR REPLACE INTO content_angles
  (id, contentId, mood, angle, angleSource, action, actionArabicText, actionTransliteration,
   actionSource, actionHowTo, actionReward, practiceSteps, reflection)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
for (const a of quranContentAngles) {
  ins.run(a.id, a.contentId, a.mood, a.angle, a.angleSource ?? null, a.action ?? null,
    a.actionArabicText ?? null, a.actionTransliteration ?? null, a.actionSource ?? null,
    a.actionHowTo ?? null, a.actionReward ?? null,
    typeof a.practiceSteps === 'string' ? a.practiceSteps : JSON.stringify(a.practiceSteps ?? null),
    a.reflection ?? null);
}
const sel = db.prepare(`SELECT * FROM content_angles WHERE id = ?`);

// Icon names the Icon component can actually draw.
const iconSrc = fs.readFileSync('src/components/Icon.tsx', 'utf8');
const iconBody = iconSrc.slice(iconSrc.indexOf('iconPaths'));
const ICONS = new Set([...iconBody.matchAll(/^\s{2}'?([a-z][a-z-]*)'?:\s/gm)].map((m) => m[1]));

// PathStepScreen's selection, verbatim.
const pickCarry = (steps) => {
  const byType = (t) => steps.find((s) => s.type === t);
  return byType('verbal') || byType('physical') || byType('mindset') || null;
};

const CARRY_LABEL = { physical: 'CARRY THIS INTO TODAY', verbal: 'SAY THIS TODAY', mindset: 'HOLD THIS TODAY' };

let fail = 0;
for (const pathId of ['path_trusting_the_results', 'path_study_journaling']) {
  const p = STATIC_SPIRITUAL_PATHS.find((x) => x.id === pathId);
  console.log(`=== ${p.title} ===`);
  const seenDua = new Map();
  for (const step of p.dailySteps) {
    const row = sel.get(step.angleId);
    if (!row) { console.log(`  !! day ${step.day}: angle not in DB`); fail++; continue; }
    const steps = JSON.parse(row.practiceSteps);
    const carry = pickCarry(steps);
    if (!carry) { console.log(`  !! day ${step.day}: no carry -> hero block missing`); fail++; continue; }

    if (!ICONS.has(carry.icon)) { console.log(`  !! day ${step.day}: icon "${carry.icon}" not in iconPaths -> blank box`); fail++; }
    if (!carry.title || !carry.instruction) { console.log(`  !! day ${step.day}: carry missing title/instruction`); fail++; }
    if (carry.type === 'verbal') {
      if (!carry.arabicText) { console.log(`  !! day ${step.day}: verbal carry with no Arabic`); fail++; }
      if (!carry.translation) { console.log(`  !! day ${step.day}: verbal carry with no translation`); fail++; }
    }
    if (carry.arabicText) {
      if (seenDua.has(carry.arabicText)) { console.log(`  !! day ${step.day}: same du'a as day ${seenDua.get(carry.arabicText)}`); fail++; }
      seenDua.set(carry.arabicText, step.day);
    }
    if (!row.reflection) { console.log(`  !! day ${step.day}: no reflection prompt`); fail++; }

    console.log(
      `  day ${step.day}  ${CARRY_LABEL[carry.type].padEnd(22)} ${carry.icon.padEnd(13)}` +
      `${carry.arabicText ? 'dua' : '   '}  ${carry.title}`,
    );
  }
  console.log();
}
console.log(fail ? `*** ${fail} FAILURES` : 'Carry block renders on every day of both journeys.');
process.exit(fail ? 1 : 0);
