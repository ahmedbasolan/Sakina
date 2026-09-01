/**
 * Selftest for scripts/lib/quranDataParse.mjs.
 *
 * This module is now a shared dependency of author-angle.mjs, add-story.mjs,
 * verify-verse-arabic-raw.mjs, seed-ledger.mjs, verify-stories.mjs,
 * verify-mood-pools.mjs and verify-citations.mjs. A bug here is a bug in
 * seven scripts at once, so it gets its own test against the exact inputs
 * that broke each function's previous, independently-written copy:
 *
 *   - objects(): a `{`/`}` inside a quoted string must not desync depth.
 *   - field(): a double-quoted value (apostrophe in the text) and a value
 *     split across `'a' + 'b'` concatenation must both read whole.
 *   - stepsOf(): a one-line JSON.stringify(...) array (author-angle.mjs's
 *     output shape) and a multi-line, single-quoted JS array literal
 *     (the hand-written legacy shape) must both parse.
 *   - bareLF(): zero on an all-CRLF string, nonzero the moment one lone LF
 *     is introduced.
 *
 * Run: node scripts/verify-quranDataParse-selftest.mjs
 * WHAT THIS DOES NOT CATCH: correctness of any SCRIPT that calls this module
 * (their own selftests/INJECT modes cover that) — only the shared primitives.
 */
import assert from 'node:assert/strict';
import { bareLF, objects, field, stepsOf } from './lib/quranDataParse.mjs';

let n = 0;
const test = (name, fn) => { fn(); n++; };

test('bareLF: zero on all-CRLF, nonzero on one lone LF', () => {
  assert.equal(bareLF('a\r\nb\r\nc'), 0);
  assert.equal(bareLF('a\r\nb\nc'), 1);
  assert.equal(bareLF('a\nb\nc'), 2);
});

test('objects: a brace inside a quoted string does not desync depth', () => {
  const src = [
    "  {",
    "    id: 'quran_1_1',",
    "    whyThis: 'A verse that mentions a set like {this} in prose.',",
    "  },",
  ].join('\r\n');
  const found = objects(src, 'quran_');
  assert.equal(found.length, 1);
  assert.equal(found[0].id, 'quran_1_1');
  assert.ok(found[0].body.includes('{this}'));
});

test('field: reads a double-quoted value (apostrophe in the text)', () => {
  const body = `source: "Surah Al-A'raf 7:199",`;
  assert.equal(field(body, 'source'), "Surah Al-A'raf 7:199");
});

test('field: follows concatenation to the end, does not stop at the first clause', () => {
  const body = [
    "    body:",
    "      'First clause. ' +",
    "      'Second clause.',",
  ].join('\r\n');
  assert.equal(field(body, 'body'), 'First clause. Second clause.');
});

test('field: returns null when the name is not found', () => {
  assert.equal(field("mood: 'Calm',", 'contentId'), null);
});

test('stepsOf: parses author-angle.mjs\'s one-line JSON.stringify shape', () => {
  const body = `practiceSteps: JSON.stringify([{"type":"physical","icon":"leaf","title":"x","instruction":"y"}]),`;
  const steps = stepsOf(body);
  assert.equal(steps.length, 1);
  assert.equal(steps[0].type, 'physical');
});

test('stepsOf: parses a hand-written, multi-line, single-quoted JS array literal', () => {
  const body = [
    "    practiceSteps: JSON.stringify([",
    "      { type: 'verbal', icon: 'chat', title: 'x', instruction: 'y' },",
    "    ]),",
  ].join('\r\n');
  const steps = stepsOf(body);
  assert.equal(steps.length, 1);
  assert.equal(steps[0].type, 'verbal');
});

test('stepsOf: returns null when there is no practiceSteps field', () => {
  assert.equal(stepsOf("mood: 'Calm',"), null);
});

console.log(`ok — ${n} checks passed`);
