/**
 * verify-tafsir-tags.mjs — checks the `[Tafsir <name> on <surah>:<ayah>]` tags
 * that journey angles carry.
 *
 * That tag is not decoration. `ContextLayer.extractSourceLabel` renders it as
 * the footnote under the Understand/Matters sections, so it is the attribution
 * the user actually reads, and the angle prose above it is written as though
 * that named scholar said these things.
 *
 * Two checks per tag:
 *   1. The named tafsir is one that can be looked up at all.
 *   2. That tafsir has substantive text for that ayah, and that text quotes
 *      the ayah's own words.
 *
 * WHAT THIS DOES NOT CATCH — read this before treating a green run as
 * "the attributions are correct", because the gap is most of the problem:
 *
 *   - It CANNOT tell whether the claim in the angle is what the tafsir says.
 *     Every fault this file was written in response to was of that kind. A day
 *     asserted "Ibn Kathir draws out the huwa, the emphatic pronoun" over an
 *     entry containing no grammatical discussion at all; another attributed
 *     to Ibn Abbas a position Al-Qurtubi records Ibn Abbas *refuting* (it was
 *     Ibn Umar's, and Ibn Abbas named a different ayah). Both pass here.
 *     Only reading the entry catches that. This script tells you the entry
 *     exists and is on-topic; you still have to read it.
 *   - A ranged entry passes even when it never reaches the ayah. Ibn Kathir's
 *     abridged text for 20:82 runs thousands of words about Bani Israel and
 *     touches `wa inni la-ghaffar` only at the very end.
 *   - It only looks at tags of the `<name> on <surah>:<ayah>` form. The older
 *     bare `[Tafsir al-Sa'di]` tags carry no ayah to check against and are
 *     counted and skipped, not verified.
 *   - Arabic-only tafsirs are checked for presence, not read. Nobody should
 *     conclude from a HIT that an English sentence in the angle is supported.
 *
 * Needs network. An unreachable resource is reported as unreadable rather than
 * as a bad tag, the same way verify-citations treats a dead page.
 *
 * TAFSIR_INJECT=1 rewrites every tag to a resource that has nothing for the
 * ayah, and exits 0 only if the checks then failed. Both modes exiting 0 is
 * the green state.
 */
import fs from 'fs';
import { execFileSync } from 'child_process';

// quran.com api/v4 resource ids. `lang` is only used to describe the report.
const RESOURCES = {
  'ibn kathir': { id: 169, lang: 'en' },
  'al-qurtubi': { id: 90, lang: 'ar' },
  'qurtubi': { id: 90, lang: 'ar' },
  "al-sa'di": { id: 91, lang: 'ar' },
  "as-sa'di": { id: 91, lang: 'ar' },
  "sa'di": { id: 91, lang: 'ar' },
  'al-baghawi': { id: 94, lang: 'ar' },
  'al-tabari': { id: 15, lang: 'ar' },
  'at-tabari': { id: 15, lang: 'ar' },
};
// Named in tags but not carried by quran.com. Skipped explicitly so that a
// tag naming one is never silently treated as verified.
const OFF_PLATFORM = ['ibn al-qayyim', 'madarij al-salikin', 'ibn rajab', 'al-jalalayn'];

const MIN_CHARS = 300;    // Al-Qurtubi on 7:23 returns 145 and supports nothing.
const MIN_OVERLAP = 0.5;  // calibrated: real entries score 0.67-1.00, the empty one 0.25.

const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();

const fold = (t) => t
  .replace(/[ً-ٰٓـۖ-ۭ]/g, '')
  .replace(/[آأإٱ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/[^ء-ي ]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const curl = (url) => execFileSync('curl', ['-s', '--max-time', '30', url], { encoding: 'utf8', maxBuffer: 1e8 });

function tafsirText(resourceId, ref) {
  try {
    const j = JSON.parse(curl(`https://api.quran.com/api/v4/tafsirs/${resourceId}/by_ayah/${ref}`));
    return strip(j?.tafsir?.text ?? '');
  } catch {
    return null; // unreadable, not wrong
  }
}

function ayahArabic(ref) {
  try {
    const j = JSON.parse(curl(`https://api.alquran.cloud/v1/ayah/${ref}/editions/quran-uthmani`));
    return j?.data?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

const src = fs.readFileSync('src/data/quranData.ts', 'utf8');
const INJECT = process.env.TAFSIR_INJECT === '1';

// Only the `<name> on <surah>:<ayah>` form is checkable.
const tags = [...src.matchAll(/\[Tafsir\s+([^\]]+?)\s+on\s+(\d+):(\d+)\]/g)]
  .map((m) => ({ name: m[1].trim(), ref: `${m[2]}:${m[3]}` }));
const bare = [...src.matchAll(/\[Tafsir\s+[^\]]+\]/g)].length - tags.length;

// Deduplicate: the same tag can legitimately appear on more than one angle.
const seen = new Map();
for (const t of tags) seen.set(`${t.name.toLowerCase()}|${t.ref}`, t);
const work = [...seen.values()];

let fail = 0, unreadable = 0, skipped = 0, advisory = 0;
console.log(`${tags.length} checkable tag(s), ${work.length} distinct; ${bare} bare tag(s) with no ayah — skipped, not verified\n`);

for (const t of work) {
  const key = t.name.toLowerCase().replace(/^tafsir\s+/, '').replace(/[‘’]/g, "'");
  if (OFF_PLATFORM.some((o) => key.includes(o))) {
    console.log(`·  skip  ${t.name} on ${t.ref} — not carried by quran.com, unverifiable here`);
    skipped++;
    continue;
  }
  const res = RESOURCES[key];
  if (!res) {
    console.log(`!! ${t.name} on ${t.ref} — tag names a tafsir this script cannot resolve.`);
    console.log(`   Add it to RESOURCES or to OFF_PLATFORM; an unresolvable tag is an unchecked claim.`);
    fail++;
    continue;
  }

  const useId = INJECT ? 16 : res.id; // 16 = Muyassar: one-line paraphrases, ~96 chars
  const text = tafsirText(useId, t.ref);
  if (text === null) {
    console.log(`?  ${t.name} on ${t.ref} — resource unreadable (network), not counted as a fault`);
    unreadable++;
    continue;
  }

  const short = text.length < MIN_CHARS;

  // On-topic test: what share of the ayah's own distinctive words appear
  // anywhere in the entry. A contiguous-window probe was tried first and was
  // useless — these editions quote an ayah in pieces around parenthetical
  // translations, so it reported 45 of 65 tags as faults, including entries
  // whose opening line IS the ayah. Measured against entries read by hand,
  // real ones score 0.67-1.00 and Al-Qurtubi's empty 7:23 scores 0.25.
  const ayah = ayahArabic(t.ref);
  let ratio = 1;
  if (ayah) {
    const folded = fold(text);
    const words = [...new Set(fold(ayah).split(' ').filter((w) => w.length > 3))];
    if (words.length) ratio = words.filter((w) => folded.includes(w)).length / words.length;
  }

  if (short) {
    console.log(`!! ${t.name} on ${t.ref} — entry is only ${text.length} chars; nothing there to support a claim`);
    fail++;
  } else if (ratio < MIN_OVERLAP) {
    // Advisory, NOT a failure. These editions group several ayat under one
    // entry, so an entry can genuinely discuss an ayah without quoting its
    // words: Ibn Kathir's text keyed to 22:77 opens on that ayah's sajdah and
    // then comments through 22:78, scoring 0%. Making this fatal would have
    // reported seven long-standing, defensible tags as broken. It is printed
    // because a low score is still the cheapest way to find a tag worth a
    // human read.
    console.log(`?  ${t.name} on ${t.ref} — ${text.length} chars, ${(ratio * 100).toFixed(0)}% overlap. Entry may be grouped with a neighbouring ayah; worth reading before relying on it.`);
    advisory++;
  } else {
    console.log(`ok ${t.name} on ${t.ref} (${res.lang}, ${text.length} chars, ${(ratio * 100).toFixed(0)}% overlap)`);
  }
}

const tail = `\n${work.length} checked · ${fail} problem(s) · ${advisory} advisory · ${skipped} unverifiable by design · ${unreadable} unreadable`;
if (INJECT) {
  console.log(tail);
  console.log(fail ? 'TAFSIR_INJECT: problems reported, as required' : 'TAFSIR_INJECT: passed on a resource with nothing in it — this checker is a no-op');
  process.exit(fail ? 0 : 1);
}
console.log(tail);
console.log(fail
  ? '\nA tag pointing at an entry with nothing in it means the angle above it is unsourced.'
  : '\nEvery checkable tag resolves to a real, on-topic entry. That is NOT the same as the\nangle prose being what the tafsir says — see the header. Read the entry.');
process.exit(fail ? 1 : 0);
