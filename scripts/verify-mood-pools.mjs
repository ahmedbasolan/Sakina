/**
 * Mood-pool verifier — the mood-picker counterpart to verify-journey.mjs.
 *
 * ContentRepository.fetchForMoodLocal joins on BOTH `cm.mood` and `ca.mood`,
 * so an angle is only ever reachable when its parent verse carries the same
 * mood tag. Two whole classes of bug hide behind that and neither shows up in
 * a typecheck:
 *
 *   1. Dead angles   — angle.mood not present in its verse's `moods` array.
 *                      The angle exists, reads fine, and can never be served.
 *   2. Starved moods — a mood whose reachable pool is so small the user sees
 *                      the same session again within a few taps.
 *
 * It also flags authoring-suffix drift: `q_angle_<verse>_energized` sitting
 * under mood 'Tired' is how 15 "spend your energy" angles ended up as the
 * entire Tired pool while the card promised rest.
 *
 * Run: node scripts/verify-mood-pools.mjs
 */
import fs from 'fs';
import { objects as libObjects, field as libField, stepsOf } from './lib/quranDataParse.mjs';

// MIN_POOL was FATAL at 10 during the expansion: raising it to 40 while pools
// were still being built would have made this script exit 1 for every
// under-floor mood from the first tick, and the tick contract reverts on a
// red gate — so every tick would have reverted its own work and the project
// could never have finished. TARGET_POOL was the progress readout, and the 40
// floor only became fatal via an explicit override at the end:
//   MOOD_FLOOR=40 node scripts/verify-mood-pools.mjs
//
// The expansion is done — all nine moods verified at 40+ as of the Tired
// commit — so 40 is now the DEFAULT floor, not an opt-in. A plain
// `node scripts/verify-mood-pools.mjs`, the invocation pattern every sibling
// verify-*.mjs script uses, now enforces the real acceptance bar; before this
// change it silently checked against the old bootstrapping floor of 10, and
// nothing in CLAUDE.md ever named this script or its MOOD_FLOOR override to
// tell a reader otherwise. MOOD_FLOOR stays available to override lower, for
// a deliberate future re-expansion that needs the same in-flight leniency.
const MIN_POOL = Number(process.env.MOOD_FLOOR ?? 40);
const TARGET_POOL = 40;
const MOODS = [
  'Overwhelmed', 'Sad', 'Angry', 'Tired', 'Lonely',
  'Grateful', 'Hopeful', 'Guilty', 'Calm',
];

// Authoring suffix -> the mood it is allowed to serve. Suffixes are historical
// (the public mood list was collapsed at some point) so the mapping is explicit
// rather than inferred.
const SUFFIX_MOOD = {
  anxious: 'Overwhelmed', stressed: 'Overwhelmed', tired: 'Tired',
  energized: 'Hopeful', hopeful: 'Hopeful', grateful: 'Grateful',
  content: 'Grateful', calm: 'Calm', sad: 'Sad', angry: 'Angry',
  lonely: 'Lonely', guilty: 'Guilty',
};

const src = fs.readFileSync('src/data/quranData.ts', 'utf8');

// objects()/field() moved to scripts/lib/quranDataParse.mjs — this was one of
// at least six independent copies of the same pair of primitives across the
// scripts directory (see that module's header). Local wrapper keeps every
// `objects('q_angle_')`-style call site below unchanged.
const objects = (prefix) => libObjects(src, prefix);
const field = libField;
const moodsOf = (b) =>
  (b.match(/moods:\s*\[([^\]]*)\]/) || ['', ''])[1]
    .replace(/'/g, '').split(',').map((x) => x.trim()).filter(Boolean);

const verseObjects = objects('quran_');
const angleObjects = objects('q_angle_');

// ── ID uniqueness ───────────────────────────────────────────────────
// Runs FIRST, and against the raw object lists, because every downstream
// structure here collapses duplicates silently: `Object.fromEntries` below
// keeps the last verse of a repeated id, and `content`/`content_angles` use
// `id TEXT PRIMARY KEY` with `INSERT OR REPLACE` (seedContent.ts), so on a
// device the later array entry overwrites the earlier one with no error.
//
// That is not hypothetical. Two different angles on quran_50_16 both carried
// the id `q_angle_50_16_lonely` — one mood 'Sad' with its own practiceSteps,
// one mood 'Lonely'. The Sad one had never existed on any install, and the
// pool counts below happily reported both. Nothing else in the repo — not
// this script, not verify-journey, not verify-citations, not a typecheck —
// noticed for as long as it shipped.
const dupErrors = [];
for (const [label, list] of [['content', verseObjects], ['angle', angleObjects]]) {
  const seen = new Map();
  for (const o of list) {
    if (seen.has(o.id)) {
      const mood = (b) => field(b, 'mood') || moodsOf(b).join('/') || '?';
      dupErrors.push(
        `duplicate ${label} id '${o.id}' — declared twice ` +
        `(first as [${mood(seen.get(o.id).body)}], then as [${mood(o.body)}]). ` +
        `PRIMARY KEY + INSERT OR REPLACE means only the LAST one reaches a device.`,
      );
    } else {
      seen.set(o.id, o);
    }
  }
}
if (dupErrors.length) {
  console.log(`${dupErrors.length} error(s):`);
  dupErrors.forEach((e) => console.log(`  x ${e}`));
  process.exit(1);
}

const verses = Object.fromEntries(verseObjects.map((o) => [o.id, moodsOf(o.body)]));
const angles = angleObjects.map((o) => ({
  id: o.id,
  contentId: field(o.body, 'contentId'),
  mood: field(o.body, 'mood'),
}));

// Journey angles are excluded from the mood pools because fetchForMoodLocal
// excludes them — read the prefix list out of the repository rather than
// keeping a copy here.
//
// This used to be a hardcoded regex under a comment asserting that journey
// angles "are fetched by id, never through the mood join". That was never
// true: the query filters on cm.mood and ca.mood and nothing else, so 28
// journey angles were live in the mood picker while this script reported pools
// that excluded them. Parsing the constant means the exclusion can only ever
// be wrong in the same direction as the code.
const repo = fs.readFileSync('src/services/contentRepository.ts', 'utf8');
const prefixDecl = repo.match(/export const JOURNEY_ANGLE_PREFIXES = \[([^\]]*)\]/);
if (!prefixDecl) {
  console.error('could not read JOURNEY_ANGLE_PREFIXES from contentRepository.ts');
  process.exit(1);
}
const JOURNEY_PREFIXES = [...prefixDecl[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
if (!JOURNEY_PREFIXES.length) {
  console.error('JOURNEY_ANGLE_PREFIXES parsed empty — refusing to run');
  process.exit(1);
}
const isJourney = (id) => JOURNEY_PREFIXES.some((p) => id.startsWith(`q_angle_${p}_`));

const errors = [];
const warnings = [];
const pool = Object.fromEntries(MOODS.map((m) => [m, 0]));

for (const a of angles) {
  const vm = verses[a.contentId];
  if (!vm) { errors.push(`${a.id}: contentId '${a.contentId}' does not exist`); continue; }
  if (!a.mood) { errors.push(`${a.id}: no mood field`); continue; }
  if (!MOODS.includes(a.mood)) { errors.push(`${a.id}: unknown mood '${a.mood}'`); continue; }

  if (isJourney(a.id)) continue;

  if (!vm.includes(a.mood)) {
    errors.push(
      `${a.id}: mood '${a.mood}' but verse ${a.contentId} is tagged [${vm.join(', ')}] ` +
      `— the fetchForMood join fails, so this angle can never be served`,
    );
    continue;
  }

  const suffix = Object.keys(SUFFIX_MOOD).find((s) => a.id.endsWith(`_${s}`) || a.id.endsWith(`_${s}_angle`));
  if (suffix && SUFFIX_MOOD[suffix] !== a.mood) {
    warnings.push(
      `${a.id}: authored as '${suffix}' (${SUFFIX_MOOD[suffix]}) but serving '${a.mood}'`,
    );
  }
  pool[a.mood]++;
}

// A verse tagged with a mood that has no angle for it is a silently dead tag.
for (const [vid, ms] of Object.entries(verses)) {
  for (const m of ms) {
    if (!angles.some((a) => a.contentId === vid && a.mood === m && !isJourney(a.id))) {
      warnings.push(`${vid}: tagged '${m}' but has no ${m} angle — tag is inert`);
    }
  }
}

console.log('Reachable mood-picker pool (angle.mood joined against verse.moods)\n');
const width = Math.max(...MOODS.map((m) => m.length));
for (const m of MOODS) {
  const n = pool[m];
  const flag = n < MIN_POOL
    ? `  << below floor of ${MIN_POOL}`
    : n < TARGET_POOL
      ? `  (${TARGET_POOL - n} to target)`
      : '';
  console.log(`  ${m.padEnd(width)}  ${String(n).padStart(3)}${flag}`);
  if (n < MIN_POOL) errors.push(`${m} pool is ${n}, below the floor of ${MIN_POOL}`);
}
// ── monotonicity ──────────────────────────────────────────────────────────
// A tick may fail to ADD to a pool; it must never leave one smaller. This is
// the check with teeth during the expansion, because MIN_POOL stays at 10 and
// TARGET_POOL is only a readout — without this, a tick that deleted an angle
// would be reported green.
const BASELINE = 'docs/superpowers/plans/2026-08-31-mood-pools/baseline.json';
if (fs.existsSync(BASELINE)) {
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8')).pools || {};
  for (const m of MOODS) {
    if (base[m] === undefined) continue;
    if (pool[m] < base[m])
      errors.push(`${m} pool fell to ${pool[m]}, below its recorded baseline of ${base[m]}`);
  }
} else {
  console.log(`\n  ! no baseline at ${BASELINE} — monotonicity NOT checked`);
}

// ── voice (ledger-scoped) ─────────────────────────────────────────────────
// New angles follow the For Your Heart rule: direct address, no [Tafsir ...]
// tag. Applied ONLY to ids this project created — the 161 legacy tafsir-voice
// angles are exempt per CLAUDE.md, and failing them would make the gate
// permanently red and therefore useless.
//
// WHAT THIS DOES NOT CATCH: copy that is second-person and tag-free but still
// narrates the reader's day back to them ("you walked past two of these
// today"). That is the failure that required a same-day correction to four of
// the 31 rewritten angles, and it is a human read.
const LEDGER =
  process.env.MOOD_LEDGER || 'docs/superpowers/plans/2026-08-31-mood-pools/ledger.json';
if (fs.existsSync(LEDGER)) {
  const rows = JSON.parse(fs.readFileSync(LEDGER, 'utf8')).units || [];
  const owned = new Set(rows.map((r) => r.angleId));
  const OPENERS =
    /^(You|Your|When you|If you|Whatever you|Notice|Look|Read|Ask|Name|Pick|Take|Let|There|Nothing|No one)/;
  // angleObjects, not `angles` — the latter is mapped to {id, contentId, mood}
  // and no longer carries the source body this pass needs to read.
  for (const a of angleObjects) {
    if (!owned.has(a.id)) continue;
    const text = (field(a.body, 'angle') || '').trim();
    if (!text) continue;
    if (/\[Tafsir /.test(text))
      errors.push(`${a.id}: new angle carries a [Tafsir ...] tag — that is the journey convention`);
    if (!OPENERS.test(text))
      errors.push(
        `${a.id}: new angle does not open in direct address — "${text.slice(0, 48)}..."`,
      );
  }
}

// ── markdown in rendered content ──────────────────────────────────────────
// React Native's <Text> has no markdown renderer, so "*with*" reaches the user
// as literal asterisks around the word. 23 of these had already shipped across
// 19 fields before this check existed, and two more nearly went out in a later
// batch — nothing in a typecheck, a citation pass or the integrity lock can
// see them, because the string is valid and the citation is correct.
//
// Corpus-wide and fatal, NOT scoped to the ledger like the voice pass: this is
// a rendering defect rather than a matter of authorial voice, so the legacy
// exemption does not apply.
//
// WHAT THIS DOES NOT CATCH: markdown that is invisible when rendered as plain
// text — a leading "# " reads as a hash, "- " as a hyphen — and HTML entities.
// It also cannot know whether an asterisk pair was deliberate typography.
const MARKDOWN = [
  [/\*[^*\n]{1,60}\*/, 'asterisk emphasis'],
  [/(^|\s)_[^_\n]{1,60}_(\s|[.,;:!?]|$)/, 'underscore emphasis'],
  [/`[^`\n]{1,60}`/, 'backtick code span'],
  [/\[[^\]\n]{1,60}\]\([^)\n]{1,80}\)/, 'markdown link'],
];

function scanMarkdown(id, name, text) {
  if (!text) return;
  for (const [re, label] of MARKDOWN) {
    // matchAll, not match: a field carrying two pairs must report both, which
    // is exactly how the first count of these came out four short.
    for (const hit of text.matchAll(new RegExp(re.source, 'g'))) {
      errors.push(`${id}: ${label} in ${name} — ${JSON.stringify(hit[0].slice(0, 40))} ` +
        `renders literally; RN Text has no markdown`);
    }
  }
}

// stepsOf(), not JSON.parse(a.body.slice(...)) — this pass used to be strict
// JSON only, which rejects the ~70% of angles that predate scripts/author-
// angle.mjs (single-quoted, unquoted-key JS object literals). The failed
// parse was swallowed by a bare `catch`, so this markdown check silently
// covered a minority of the corpus while reporting a clean run over what it
// called the whole thing — the exact "checker that reads part of its input"
// failure verify-citations.mjs's own header documents fixing once already.
// hadStepsCovered / hadStepsTotal below is the coverage guard that failure
// mode is missing everywhere else it has happened, so it can't happen silently
// here again.
let hadStepsTotal = 0, hadStepsCovered = 0;
for (const a of angleObjects) {
  for (const f of ['angle', 'reflection', 'action', 'actionHowTo', 'actionReward']) {
    scanMarkdown(a.id, f, field(a.body, f));
  }
  if (a.body.includes('practiceSteps: JSON.stringify(')) {
    hadStepsTotal++;
    const steps = stepsOf(a.body);
    if (steps) {
      hadStepsCovered++;
      for (const [i, s] of steps.entries()) {
        scanMarkdown(a.id, `step[${i}].title`, s.title);
        scanMarkdown(a.id, `step[${i}].instruction`, s.instruction);
        scanMarkdown(a.id, `step[${i}].translation`, s.translation);
      }
    }
  }
}
if (hadStepsCovered < hadStepsTotal) {
  errors.push(`markdown pass: ${hadStepsTotal - hadStepsCovered}/${hadStepsTotal} angles with ` +
    `practiceSteps could not be parsed — coverage gap, not a clean run`);
}
for (const c of verseObjects) {
  scanMarkdown(c.id, 'whyThis', field(c.body, 'whyThis'));
  scanMarkdown(c.id, 'englishTranslation', field(c.body, 'englishTranslation'));
}

const counts = MOODS.map((m) => pool[m]);
console.log(`\n  spread: ${Math.min(...counts)}–${Math.max(...counts)} ` +
  `(${(Math.max(...counts) / Math.max(1, Math.min(...counts))).toFixed(1)}x)`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log(`  ! ${w}`));
}
if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  errors.forEach((e) => console.log(`  x ${e}`));
  process.exit(1);
}
console.log('\nAll checks passed.');
