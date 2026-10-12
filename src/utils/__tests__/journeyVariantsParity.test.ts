/**
 * The verifiers expand a step-variant path with scripts/lib/journeyVariants.mjs;
 * the app expands it with resolvePath (src/utils/leaderChoice.ts). The script's
 * header says "keep the two in step". This pins that: if they drift, the
 * verifiers would be checking a sequence no user sees.
 *
 * Jest cannot import the .mjs (ESM, outside the babel transform), so the file is
 * read and evaluated -- the only change is dropping its `export` keyword.
 *
 * WHAT THIS DOES NOT CATCH: drift in a field neither resolver copies (both would
 * ignore it identically), or a path other than path_prayer_leadership -- it
 * covers every `variants` key that path declares, no more.
 */
import fs from 'fs';
import path from 'path';
import { resolvePath } from '../leaderChoice';
import { STATIC_SPIRITUAL_PATHS } from '../../data/staticPaths';

type Seq = { label: string; steps: unknown[] };
const src = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'scripts', 'lib', 'journeyVariants.mjs'),
  'utf8',
);
// eslint-disable-next-line no-new-func
const variantSequences = new Function(
  `${src.replace(/export function/g, 'function')}\nreturn variantSequences;`,
)() as (p: unknown) => Seq[];

const lead = STATIC_SPIRITUAL_PATHS.find((p) => p.id === 'path_prayer_leadership')!;

it('the verifier\'s "woman leading" sequence equals what the app shows a woman', () => {
  const seqs = variantSequences(lead);
  const woman = seqs.find((s) => s.label === ' (woman leading)');
  expect(woman).toBeDefined();
  expect(woman!.steps).toEqual(resolvePath(lead, 'woman').dailySteps);
});

it('the verifier\'s base sequence equals what the app shows a man', () => {
  expect(variantSequences(lead)[0].steps).toEqual(resolvePath(lead, 'man').dailySteps);
});

it('negative control: a drifted resolver would be caught', () => {
  const woman = variantSequences(lead).find((s) => s.label === ' (woman leading)')!;
  const drifted = (woman.steps as { angleId: string }[]).map((s) => ({ ...s, angleId: s.angleId.replace(/_f$/, '') }));
  expect(drifted).not.toEqual(resolvePath(lead, 'woman').dailySteps);
});
