/**
 * Self-test for verify-citations.mjs pass 7 (pathsService.getStepMotivation).
 *
 * Mirrors verify-journey-selftest.mjs: inject a known fault, assert the
 * verifier reports it, restore. A checker that only ever prints "passed" is
 * untested — and pass 7 exists precisely because getStepMotivation went
 * unchecked long enough to accumulate two sourceless quotations, a
 * "[Prophetic Tradition]" label, a Bukhari misattribution, an ellipsis
 * through the middle of Bukhari 5641, and ~16 numberless collection tags.
 *
 * Writes to src/services/pathsService.ts and restores it in a finally block.
 * Run: node scripts/verify-citations-selftest.mjs
 */
import fs from 'fs';
import { execFileSync } from 'child_process';

const FILE = 'src/services/pathsService.ts';
const ANCHOR = '\'"Regret is repentance." [Ibn Majah 4252]\'';

const FAULTS = [
  {
    name: 'quotation with no citation at all',
    from: ANCHOR,
    to: '\'"Trust in Allah, for He knows what is best for His servants."\'',
    expect: 'Sincere Remorse',
  },
  {
    name: 'bare collection with no number',
    from: ANCHOR,
    to: '\'"Regret is repentance." [Ibn Majah]\'',
    expect: 'Sincere Remorse',
  },
  {
    name: 'provenance asserted by an unlocatable label',
    from: ANCHOR,
    to: '\'"Allah loves to forgive, so seek His forgiveness." [Prophetic Tradition]\'',
    expect: 'Sincere Remorse',
  },
  {
    name: 'ellipsis eliding the middle of a hadith',
    from: ANCHOR,
    to: '\'"No fatigue, nor sorrow... but that Allah expiates his sins." [Bukhari 5641]\'',
    expect: 'Sincere Remorse',
  },
  {
    name: 'Quran quote pointed at the wrong ayah',
    from: '[Quran 50:16]',
    to: '[Quran 50:17]',
    expect: "Allah's Presence",
  },
  {
    // The hadith-overlap check was added after a Muslim 597a quotation
    // shipped from this repo's own citation "fix" with a clause dropped.
    // It catches a quote on the WRONG hadith; it does NOT catch a quote that
    // merely stops early (see the LIMITS note in verify-citations.mjs pass 7),
    // which is why this fault is a renumber rather than a truncation.
    name: 'hadith quote pointed at the wrong number in the right collection',
    from: '[Bukhari 6114]',
    to: '[Bukhari 1]',
    expect: 'Understanding Anger',
  },
];

const original = fs.readFileSync(FILE, 'utf8');
let caught = 0;

try {
  for (const f of FAULTS) {
    if (!original.includes(f.from)) {
      console.log(`  ?  ${f.name} — anchor no longer present, cannot inject`);
      continue;
    }
    fs.writeFileSync(FILE, original.replace(f.from, f.to));

    let out = '';
    let code = 0;
    try {
      out = execFileSync('node', ['scripts/verify-citations.mjs'], { maxBuffer: 1 << 26 }).toString();
    } catch (e) {
      code = e.status;
      out = (e.stdout || '').toString();
    }

    if (code !== 0 && out.includes(f.expect)) {
      console.log(`  ok  ${f.name}`);
      caught++;
    } else {
      console.log(`  XX  ${f.name} — verifier did NOT report it`);
    }
  }
} finally {
  fs.writeFileSync(FILE, original);
}

console.log(`\n${caught}/${FAULTS.length} injected faults caught; ${FILE} restored`);
if (caught !== FAULTS.length) process.exit(1);
