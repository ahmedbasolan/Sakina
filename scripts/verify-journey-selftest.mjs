/**
 * Negative test for scripts/verify-journey.mjs.
 * Copies the real data into a sandbox, applies one fault at a time, and
 * asserts the verifier FAILS with the expected message. A checker that only
 * ever prints "passed" has not been tested.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

const REPO = process.argv[2] || process.cwd();
const SB = path.join(process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), 'journey-')), 'sandbox');

function reset() {
  fs.rmSync(SB, { recursive: true, force: true });
  fs.mkdirSync(path.join(SB, 'src', 'data'), { recursive: true });
  fs.mkdirSync(path.join(SB, 'src', 'components'), { recursive: true });
  fs.mkdirSync(path.join(SB, 'scripts'), { recursive: true });
  for (const f of ['staticPaths.ts', 'quranData.ts', 'hadithData.ts'])
    fs.copyFileSync(path.join(REPO, 'src/data', f), path.join(SB, 'src/data', f));
  // verify-journey.mjs derives its valid-icon set from the IconName union, its
  // valid-sourceType set from PracticeSourceType, and its journey-angle
  // prefixes from JOURNEY_ANGLE_PREFIXES, so the sandbox needs all three files
  // or every run dies with ENOENT. Anything verify-journey.mjs starts reading
  // has to be added here too.
  fs.copyFileSync(path.join(REPO, 'src/components/Icon.tsx'), path.join(SB, 'src/components/Icon.tsx'));
  fs.mkdirSync(path.join(SB, 'src', 'types'), { recursive: true });
  fs.copyFileSync(path.join(REPO, 'src/types/index.ts'), path.join(SB, 'src/types/index.ts'));
  fs.mkdirSync(path.join(SB, 'src', 'services'), { recursive: true });
  fs.copyFileSync(
    path.join(REPO, 'src/services/contentRepository.ts'),
    path.join(SB, 'src/services/contentRepository.ts'),
  );
  fs.copyFileSync(path.join(REPO, 'scripts/verify-journey.mjs'), path.join(SB, 'scripts/verify-journey.mjs'));
}

function patch(file, from, to) {
  const p = path.join(SB, 'src/data', file);
  const s = fs.readFileSync(p, 'utf8');
  if (!s.includes(from)) throw new Error(`fixture stale, not found in ${file}: ${from.slice(0, 60)}`);
  fs.writeFileSync(p, s.replace(from, to));
}

function run() {
  try {
    const out = execFileSync('node', ['scripts/verify-journey.mjs'], { cwd: SB, encoding: 'utf8' });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}

const CASES = [
  ['borrowed mood angle', () => patch('staticPaths.ts', `angleId: 'q_angle_results_day1'`, `angleId: 'q_angle_3_159_angry'`), /borrowed mood angle/],
  ['wrong mood', () => patch('quranData.ts', `id: 'q_angle_study_day3',\r\n    contentId: 'quran_22_77',\r\n    mood: 'Hopeful'`, `id: 'q_angle_study_day3',\r\n    contentId: 'quran_22_77',\r\n    mood: 'Tired'`), /angle mood Tired != path theme Hopeful/],
  ['duplicate verse', () => patch('staticPaths.ts', `contentId: 'quran_2_152'`, `contentId: 'quran_14_7'`), /verse quran_14_7 also on day 2/],
  ['duplicate hadith', () => patch('staticPaths.ts', `hadithContentId: 'hadith_results_5'`, `hadithContentId: 'hadith_results_3'`), /hadith Muslim 2999 also on day 3/],
  ['bad icon', () => patch('quranData.ts', `icon: 'compass',\r\n        title: 'Rabitu`, `icon: 'telescope',\r\n        title: 'Rabitu`), /bad icon telescope/],
  ['bad sourceType', () => patch('quranData.ts', `sourceType: 'prophetic_dhikr',\r\n        sourceGrading: 'hasan',\r\n      },\r\n    ]),\r\n    reflection:\r\n      'Which of your three`, `sourceType: 'made_up',\r\n        sourceGrading: 'hasan',\r\n      },\r\n    ]),\r\n    reflection:\r\n      'Which of your three`), /bad sourceType made_up/],
  ['broken practiceSteps JSON', () => patch('quranData.ts', `practiceSteps: JSON.stringify([\r\n      {\r\n        type: 'mindset',\r\n        icon: 'target',\r\n        title: 'The striving is the record'`, `practiceSteps: '[{oops',\r\n    _dead: JSON.stringify([\r\n      {\r\n        type: 'mindset',\r\n        icon: 'target',\r\n        title: 'The striving is the record'`), /practiceSteps JSON invalid/],
  ['missing tafsir tag', () => patch('quranData.ts', `"[Tafsir Ibn Kathir on 2:152] Allah offers`, `"Allah offers`), /no \[Tafsir \.\.\.\] tag/],
  ['tag not at start', () => patch('quranData.ts', `"[Tafsir Ibn Kathir on 53:39] The ayah sets`, `"The ayah sets [Tafsir Ibn Kathir on 53:39]`), /tag not at string start/],
  // Matches either wording: the verifier reports an arbitrary 60% cut when the
  // angle has >= 4 sentences and an empty Matters section below that.
  ['no split pattern', () => patch('quranData.ts', `. When you study, the striving is the part`, `. Studying means the striving is the part`), /no split pattern/],
  ['missing angle', () => patch('staticPaths.ts', `angleId: 'q_angle_study_day5'`, `angleId: 'q_angle_study_day99'`), /missing angle q_angle_study_day99/],
  ['duplicate du\'a', () => patch('quranData.ts', `actionArabicText: 'رَبِّ زِدْنِي عِلْمًا'`, `actionArabicText: 'جَزَاكَ اللَّهُ خَيْرًا'`), /du'a repeats day/],
];

// Baseline must pass, or every negative result below is meaningless.
reset();
const base = run();
console.log(`baseline: ${base.code === 0 ? 'PASS (exit 0)' : 'FAIL — negative tests are meaningless'}`);
if (base.code !== 0) { console.log(base.out.slice(-1500)); process.exit(1); }

let bad = 0;
for (const [name, mutate, expect] of CASES) {
  reset();
  try { mutate(); } catch (e) { console.log(`  ?? ${name}: ${e.message}`); bad++; continue; }
  const r = run();
  const caught = r.code !== 0 && expect.test(r.out);
  console.log(`  ${caught ? 'ok  ' : 'MISS'} ${name}${caught ? '' : `  (exit ${r.code}; expected ${expect})`}`);
  if (!caught) { bad++; console.log(r.out.split('\n').filter((l) => l.includes('!!')).slice(0, 4).join('\n')); }
}
console.log(bad ? `\n*** ${bad} faults NOT detected` : `\nAll ${CASES.length} injected faults detected.`);
process.exit(bad ? 1 : 0);
