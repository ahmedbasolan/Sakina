/**
 * verify-render-hazards.mjs — static checks for render faults that typecheck
 * and Jest cannot see, and that only show up on a device (usually Android).
 *
 * Needs no network and no device. Run: `node scripts/verify-render-hazards.mjs`
 * Selftest:                           `RH_INJECT=1 node scripts/verify-render-hazards.mjs`
 * BOTH exiting 0 is the green state, same contract as verify-local-wipe.mjs.
 *
 * Each pass below was written after the fault it checks had already shipped,
 * and each was confirmed to FAIL on the pre-fix tree before being trusted to
 * pass on the fixed one (CLAUDE.md: "verify the checker, not just the code").
 *
 * ── Pass 1: elevation + overflow:'hidden' + borderRadius on one view ────────
 * Android cannot combine these: the clip and the elevation shadow fight, and
 * the shadow's own rounded-rect backing shows through the clip as an angular
 * blob. Found three instances — SwipeNextOverlay's arrow badge (reported from
 * a device as "a hexagonal shape behind it"), LocationPickerModal's sheet, and
 * FirstGuidanceScreen's CTA. See ShareSheet.tsx's previewCardShadow for the
 * shadow-wrapper/clip-inner split to use when the clip is load-bearing.
 * DOES NOT CATCH: styles composed at the call site from two entries
 * (`style={[a, b]}`) where the parts are individually clean; inline JSX style
 * objects; a radius set via a variable not matching /adius/.
 *
 * ── Pass 2: useEffect([], …) whose Animated toValue reads an outside value ──
 * The value freezes at its mount-time target and never updates. This class has
 * produced three shipped bugs: the swipe overlay staying burned on screen, the
 * location sheet stranding mid-drag, and a JourneyCard staying dimmed at 0.65
 * after the user bought Pro (the FlatList keys by item.id, so a lock-state flip
 * re-renders but never remounts).
 * DOES NOT CATCH: non-empty dep arrays that are merely incomplete — only a
 * literal `[]` is examined; values settled via `.setValue()` instead of an
 * animation; whether the identifier can actually change at runtime.
 *
 * ── Pass 3: iOS-only shadow (shadow* with no elevation) ────────────────────
 * shadow* is iOS-only, so such a view renders flat on Android.
 * DOES NOT CATCH — and this matters here: it cannot tell a depth shadow from a
 * decorative *glow*. A glow (offset 0,0 + coloured shadowColor + big radius)
 * must NOT be "fixed" by adding elevation: Android's elevation draws a
 * directional dark shadow and cannot render a coloured halo, so adding it makes
 * the element look worse, not more like iOS. The three current hits are all
 * glows and are allowlisted for exactly that reason. A real fix for those is a
 * radial-gradient halo view, which is a design change.
 */
import { readFileSync, globSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Known findings that are correct as written. Keyed `file::styleOrSymbol`.
 * Every entry must carry a reason — an allowlist without one is just a mute.
 */
const ALLOW = new Map([
  [
    'src/screens/PathsScreen.tsx::JourneyCard-entrance',
    'Entrance is mount-only by design; a second effect on [isLocked] owns the ' +
      'dim so the card updates when a path unlocks. Both are commented there.',
  ],
  [
    'src/components/PathCompletionCelebration.tsx::ConfettiItem-entrance',
    'Its toValue reads SCREEN_HEIGHT, a module-level constant, so it cannot ' +
      'change under the effect. (That it is a module-scope Dimensions snapshot ' +
      'is a separate known issue — stale in Android split-screen — not a ' +
      'frozen toValue.)',
  ],
  [
    'src/screens/DailyRemindersScreen.tsx::constellationPointDim',
    'Decorative white glow, not a depth shadow — see the pass 3 note above.',
  ],
  [
    'src/screens/DailyRemindersScreen.tsx::starburst',
    'Decorative gold glow, not a depth shadow — see the pass 3 note above.',
  ],
  [
    'src/screens/DailyRemindersScreen.tsx::toggleKnobActive',
    'Decorative gold glow, not a depth shadow — see the pass 3 note above.',
  ],
]);

// ── shared helpers ──────────────────────────────────────────────────────────

/**
 * Blanks comments, and optionally string/template CONTENTS, preserving length
 * and newlines so offsets stay aligned.
 *
 * Two modes because the two needs conflict, and getting this wrong produced a
 * false positive on this script's own first run:
 *  - `strings: true`  → for brace walking and identifier scans. CLAUDE.md
 *    records a checker here that miscounted `{` inside string literals.
 *  - `strings: false` → for matching string VALUES like `overflow: 'hidden'`,
 *    which blanking strings would destroy. Comments must still go: the fixes
 *    for this very fault are commented "NO `overflow: 'hidden'` here", and
 *    matching the raw body reported those comments as the fault they describe.
 */
function mask(src, { strings = true } = {}) {
  const out = src.split('');
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const next = src[i + 1];
    if (c === '/' && next === '/') {
      while (i < n && src[i] !== '\n') { out[i] = ' '; i++; }
      continue;
    }
    if (c === '/' && next === '*') {
      out[i] = ' '; out[i + 1] = ' '; i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] !== '\n') out[i] = ' ';
        i++;
      }
      if (i < n) { out[i] = ' '; out[i + 1] = ' '; i += 2; }
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const q = c;
      i++;
      while (i < n && src[i] !== q) {
        if (src[i] === '\\') { if (strings && src[i] !== '\n') out[i] = ' '; i++; }
        if (i < n) { if (strings && src[i] !== '\n') out[i] = ' '; i++; }
      }
      i++;
      continue;
    }
    i++;
  }
  return out.join('');
}

const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;

/** Yields every `key: { … }` entry of the file's StyleSheet.create object.
 *  `masked` has comments AND strings blanked (safe for brace/identifier work);
 *  `body` has only comments blanked (safe for matching string values). */
function* styleEntries(src) {
  const masked = mask(src);
  const noComments = mask(src, { strings: false });
  const createIdx = masked.indexOf('StyleSheet.create(');
  if (createIdx === -1) return;
  const objStart = masked.indexOf('{', createIdx);
  if (objStart === -1) return;

  let depth = 0;
  let key = null;
  let start = -1;
  for (let i = objStart; i < masked.length; i++) {
    const ch = masked[i];
    if (ch === '{') {
      depth++;
      if (depth === 2) {
        const m = masked.slice(0, i).match(/([A-Za-z0-9_$]+)\s*:\s*$/);
        key = m ? m[1] : '(anonymous)';
        start = i;
      }
    } else if (ch === '}') {
      if (depth === 2 && start !== -1) {
        yield {
          key,
          body: noComments.slice(start, i + 1),
          masked: masked.slice(start, i + 1),
          line: lineOf(src, start),
        };
        start = -1;
        key = null;
      }
      depth--;
      if (depth === 0) return;
    }
  }
}

// ── passes ──────────────────────────────────────────────────────────────────

function passElevationClip(rel, src) {
  const out = [];
  for (const e of styleEntries(src)) {
    const hasElevation = /\belevation\s*:/.test(e.masked);
    const hasClip = /overflow:\s*['"]hidden['"]/.test(e.body);
    const hasRadius = /adius\s*:/.test(e.masked);
    if (hasElevation && hasClip && hasRadius) {
      out.push({ id: `${rel}::${e.key}`, line: e.line, what: `style "${e.key}": elevation + overflow:'hidden' + radius` });
    }
  }
  return out;
}

function passIosOnlyShadow(rel, src) {
  const out = [];
  for (const e of styleEntries(src)) {
    const noText = e.masked.replace(/textShadowColor/g, 'TXT');
    const hasShadow = /\bshadowColor\s*:/.test(noText);
    const hasDepth = /shadowOpacity\s*:|shadowRadius\s*:/.test(e.masked);
    const hasElevation = /\belevation\s*:/.test(e.masked);
    if (hasShadow && hasDepth && !hasElevation) {
      out.push({ id: `${rel}::${e.key}`, line: e.line, what: `style "${e.key}": iOS shadow with no elevation` });
    }
  }
  return out;
}

const TOVALUE_IGNORE = new Set([
  'true', 'false', 'null', 'undefined', 'Math', 'Number', 'Infinity',
  'toValue', 'duration', 'delay', 'useNativeDriver', 'friction', 'tension',
]);

function passFrozenToValue(rel, src) {
  const out = [];
  if (!src.includes('useEffect')) return out;
  // Comments blanked so a commented-out effect, or prose quoting `toValue:`,
  // cannot register as a finding. Strings kept: a toValue is never a string,
  // but blanking them would shift nothing useful and costs clarity.
  src = mask(src, { strings: false });
  let from = 0;
  for (;;) {
    const start = src.indexOf('useEffect(', from);
    if (start === -1) break;
    from = start + 10;

    let depth = 0;
    let end = -1;
    for (let i = start + 9; i < src.length; i++) {
      if (src[i] === '(') depth++;
      else if (src[i] === ')') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end === -1) continue;

    const call = src.slice(start, end + 1);
    if (!/,\s*\[\s*\]\s*\)$/.test(call.replace(/\/\/[^\n]*/g, ''))) continue;

    const suspects = new Set();
    for (const m of call.matchAll(/toValue:\s*([^,\n]+)/g)) {
      if (/^-?[0-9.]+\s*$/.test(m[1])) continue;
      for (const id of m[1].match(/[A-Za-z_$][A-Za-z0-9_$]*/g) ?? []) {
        if (!TOVALUE_IGNORE.has(id)) suspects.add(id);
      }
    }
    if (suspects.size === 0) continue;

    // Identify by the enclosing function name where we can, so the allowlist
    // key survives the line numbers moving.
    const before = src.slice(0, start);
    const fnMatch = [...before.matchAll(/function\s+([A-Za-z0-9_$]+)\s*\(/g)].pop();
    const owner = fnMatch ? `${fnMatch[1]}-entrance` : [...suspects][0];
    out.push({
      id: `${rel}::${owner}`,
      line: lineOf(src, start),
      what: `useEffect([], …) toValue reads: ${[...suspects].join(', ')}`,
    });
  }
  return out;
}

const PASSES = [
  ['elevation + clip (Android shadow-through-clip)', passElevationClip],
  ['frozen Animated toValue in an empty-dep effect', passFrozenToValue],
  ['iOS-only shadow (flat on Android)', passIosOnlyShadow],
];

function run(files) {
  const real = [];
  const allowed = [];
  for (const [, fn] of PASSES) {
    for (const { rel, src } of files) {
      for (const hit of fn(rel, src)) {
        (ALLOW.has(hit.id) ? allowed : real).push(hit);
      }
    }
  }
  return { real, allowed };
}

function loadRepoFiles() {
  return globSync('src/**/*.tsx', { cwd: ROOT })
    .map((f) => f.replace(/\\/g, '/'))
    .map((rel) => ({ rel, src: readFileSync(path.join(ROOT, rel), 'utf8') }));
}

// ── selftest ────────────────────────────────────────────────────────────────
// Fixtures rather than mutating the real tree: this proves the MATCHERS catch
// each fault. It does NOT exercise file discovery — that is covered by the
// normal run, which walks src/**/*.tsx for real.
const FIXTURES = [
  {
    name: 'elevation + clip',
    rel: 'fixture/Clip.tsx',
    src: `const s = StyleSheet.create({\n  badge: {\n    borderRadius: 36,\n    overflow: 'hidden',\n    elevation: 6,\n  },\n});`,
  },
  {
    name: 'frozen toValue',
    rel: 'fixture/Frozen.tsx',
    src: `function Card({ isLocked }) {\n  useEffect(() => {\n    Animated.timing(a, { toValue: isLocked ? 0.65 : 1, duration: 500 }).start();\n  }, []);\n}`,
  },
  {
    name: 'iOS-only shadow',
    rel: 'fixture/Shadow.tsx',
    src: `const s = StyleSheet.create({\n  card: {\n    shadowColor: '#000',\n    shadowOpacity: 0.3,\n    shadowRadius: 8,\n  },\n});`,
  },
  {
    name: 'clean file (must produce nothing)',
    rel: 'fixture/Clean.tsx',
    src: `const s = StyleSheet.create({\n  card: {\n    borderRadius: 8,\n    elevation: 4,\n    shadowColor: '#000',\n    shadowOpacity: 0.3,\n  },\n});\n// a string containing a brace { and 'overflow: hidden' must not confuse it`,
  },
  {
    // Regression fixture. The real fix for the elevation+clip fault leaves a
    // comment INSIDE the style block saying the clip was deliberately removed,
    // and the first version of this script matched that comment and reported
    // the fixed code as still broken. The original "clean" fixture missed it
    // because its comment sat outside the style block.
    name: 'clean: comment inside the style block naming the fault',
    rel: 'fixture/CleanComment.tsx',
    src: `const s = StyleSheet.create({\n  badge: {\n    borderRadius: 36,\n    elevation: 6,\n    // NO \`overflow: 'hidden'\` here — see ShareSheet.tsx.\n  },\n});`,
  },
  {
    name: 'clean: commented-out frozen effect',
    rel: 'fixture/CleanEffect.tsx',
    src: `function Card({ isLocked }) {\n  // useEffect(() => {\n  //   Animated.timing(a, { toValue: isLocked ? 0.65 : 1 }).start();\n  // }, []);\n}`,
  },
];

if (process.env.RH_INJECT === '1') {
  console.log('RH_INJECT=1 — selftest: each fixture must be caught by its pass.\n');
  let failures = 0;
  for (const f of FIXTURES) {
    const { real } = run([{ rel: f.rel, src: f.src }]);
    const expectHit = !f.name.startsWith('clean');
    const got = real.length > 0;
    const ok = got === expectHit;
    if (!ok) failures++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${f.name} — expected ${expectHit ? 'a finding' : 'none'}, got ${real.length}`);
  }
  if (failures > 0) {
    console.error(`\n${failures} selftest failure(s) — the checker itself is broken.`);
    process.exit(1);
  }
  console.log('\nAll matchers verified.');
  process.exit(0);
}

const files = loadRepoFiles();
const { real, allowed } = run(files);

for (const [label] of PASSES) {
  const hits = real.filter((h) => h.what.includes(label.split(' ')[0]));
  void hits; // per-pass labels are printed with each finding below
}

if (allowed.length) {
  console.log(`${allowed.length} allowlisted finding(s) (intentional — see ALLOW in this file):`);
  for (const h of allowed) console.log(`  · ${h.id}`);
  console.log('');
}

if (real.length === 0) {
  console.log(`Scanned ${files.length} component file(s) — no render hazards.`);
  process.exit(0);
}

console.error(`${real.length} render hazard(s):\n`);
for (const h of real) {
  console.error(`  ${h.id.split('::')[0]}:${h.line}  ${h.what}`);
  // Print the exact allowlist key: if a hit turns out to be correct as
  // written, this is what goes in ALLOW (with a reason), and guessing the key
  // by hand is how this script's own first run mis-allowlisted one.
  console.error(`      allowlist key: ${h.id}`);
}
console.error('\nSee the header of this file for what each pass means and how to fix it.');
process.exit(1);
