/**
 * Shared structural-parsing primitives for scripts that read or edit
 * src/data/quranData.ts.
 *
 * Extracted after this exact logic was found independently reimplemented in
 * at least six places (verify-citations.mjs, verify-mood-pools.mjs,
 * verify-journey.mjs, review-mood-fit.mjs, and — new in the same commit
 * series that added this file — seed-ledger.mjs and verify-stories.mjs).
 * That duplication already cost one real bug: verify-citations.mjs's own
 * header (kept below, on `stepsOf`) documents a newline-anchored regex that
 * silently skipped 75 of 395 angles for months while five passes reported
 * "0 problems". The fix was a hand-written bracket-matcher — this module is
 * that fix, written once instead of copied forward again.
 *
 * `verify-journey.mjs` and `review-mood-fit.mjs` predate this module and are
 * NOT migrated to it here — they are untouched by the diff that introduced
 * this file, and switching them is a separate, deliberate change, not a
 * side effect of fixing the two NEW duplicates.
 *
 * WHAT THIS DOES NOT DO: know anything about moods, angles, citations, or
 * the shape of a ContentAngle. It is pure text structure — brace/bracket
 * matching and quote-aware field extraction — nothing here is normative
 * about what a valid angle looks like.
 */

/**
 * Count line feeds NOT preceded by a carriage return.
 *
 * quranData.ts is 100% CRLF. `!s.includes('\r\n')` — checking that CRLF
 * exists ANYWHERE in the file — is the check CLAUDE.md's "Editing
 * quranData.ts by script" section retired: it passed once on a file with
 * exactly one bad line among nineteen thousand correct ones, because the
 * existence check only asks "is there at least one `\r\n`", never "is there
 * a lone `\n`". The invariant this file needs is zero bare LFs, so that is
 * what must be asserted, before AND after every edit.
 */
export function bareLF(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) if (s[i] === '\n' && s[i - 1] !== '\r') n++;
  return n;
}

/**
 * Extract every top-level object literal in `src` whose `id: '<prefix>...'`
 * matches `prefix`, by matching braces rather than lines — a quoted `{` or
 * `}` inside a string (an Arabic ornament, a citation, prose) must not move
 * the depth counter, which is why this walks the string tracking an open
 * quote rather than using a brace-counting regex.
 *
 * Returns `[{ id, body }]` where `body` is the object literal's full source
 * text, `{` through matching `}` inclusive.
 */
export function objects(src, prefix) {
  const out = [];
  for (const m of src.matchAll(new RegExp(`id: '(${prefix}[a-zA-Z0-9_]+)'`, 'g'))) {
    let open = m.index;
    while (src[open] !== '{') open--;
    let depth = 0, quote = null, end = -1;
    for (let k = open; k < src.length; k++) {
      const c = src[k];
      if (quote) { if (c === '\\') k++; else if (c === quote) quote = null; continue; }
      if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (!depth) { end = k; break; } }
    }
    out.push({ id: m[1], body: src.slice(open, end + 1) });
  }
  return out;
}

/**
 * Read a string field from an object literal's source text. Quote-agnostic
 * and concatenation-following — both matter, and neither did while every
 * caller only read short values like `mood` or `contentId`:
 *
 *   - Values whose text contains an apostrophe are DOUBLE quoted
 *     (source: "Surah Al-A'raf 7:199"). A single-quote-only matcher returns
 *     null for every one of these, and null then compares equal to null,
 *     reporting unrelated entries as mutual duplicates.
 *   - Long prose is written as `'a' + 'b' + 'c'`. A reader that stops at the
 *     first closing quote checks only the opening clause and silently
 *     passes everything after it — reporting green on text it never read.
 *
 * Returns the joined string, or null if `name:` isn't found or its value
 * isn't a string literal.
 */
export function field(body, name) {
  const m = body.match(new RegExp(`\\b${name}:\\s*`));
  if (!m) return null;
  let i = m.index + m[0].length, out = '', first = true;
  while (i < body.length) {
    const q = body[i];
    if (q !== "'" && q !== '"') { if (first) return null; break; }
    first = false;
    let k = i + 1;
    for (; k < body.length; k++) {
      const c = body[k];
      if (c === '\\') { out += body[k + 1]; k++; continue; }
      if (c === q) break;
      out += c;
    }
    let j = k + 1;
    while (j < body.length && /\s/.test(body[j])) j++;
    if (body[j] !== '+') break;
    j++;
    while (j < body.length && /\s/.test(body[j])) j++;
    i = j;
  }
  return out;
}

/**
 * Parse an angle object's `practiceSteps: JSON.stringify([...])` array by
 * MATCHING BRACKETS, not by regex, and EVALUATING the result, not
 * `JSON.parse`-ing it.
 *
 * Both choices are load-bearing, and both were gotten wrong once before this
 * function existed:
 *
 *   - A regex requiring a newline before the closing `]),` matches
 *     hand-written angles (formatted that way) but not angles emitted by
 *     scripts/author-angle.mjs, which puts the whole array on one line. That
 *     hid 75 of 395 angles — every tick-authored one — while the checks that
 *     used it reported "0 problems" over what they called the whole corpus.
 *   - `JSON.parse` is stricter than this file's actual contents: the tick
 *     script emits strict JSON (double-quoted, `JSON.stringify` output), but
 *     hand-written legacy angles are JS array literals — single-quoted
 *     strings, unquoted keys — which `JSON.parse` rejects outright. Swapping
 *     `eval` for `JSON.parse` here once dropped a 96-step checked count to 2
 *     while the check still exited 0: the same silent under-read this
 *     function exists to prevent, produced by the fix meant to prevent it.
 *
 * Returns the parsed array, or null when there are genuinely no
 * practiceSteps, or when the extracted text fails to evaluate.
 */
export function stepsOf(body) {
  const at = body.indexOf('practiceSteps: JSON.stringify(');
  if (at === -1) return null;
  const start = body.indexOf('[', at);
  if (start === -1) return null;
  let depth = 0, quote = null, end = -1;
  for (let k = start; k < body.length; k++) {
    const c = body[k];
    if (quote) { if (c === '\\') k++; else if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (!depth) { end = k; break; } }
  }
  if (end === -1) return null;
  try { return eval('(' + body.slice(start, end + 1) + ')'); } catch { return null; }
}
