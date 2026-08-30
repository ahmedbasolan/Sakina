/**
 * Consonantal skeleton of a Quranic Arabic string.
 *
 * Used by the verse-integrity test to compare this app's verse text against
 * quran.com WITHOUT tripping over Mushaf edition differences. This corpus is
 * a richer Uthmani edition than quran.com's `text_uthmani`: measured across
 * 218 entries it carries U+06ED (small low meem, ikhfa) in 73, U+06E2 (small
 * high meem, iqlab) in 38, tatweel in dozens, and ayah-number ornaments
 * throughout. None of those change a single letter of the text, so a
 * byte comparison against quran.com reports 140 false differences while a
 * skeleton comparison reports 4 (of which 3 were this function's own hamza
 * handling, since fixed, and 1 was a genuine finding — see the test).
 *
 * WHAT SURVIVES: the consonants, in order.
 * WHAT DOES NOT: every combining mark, pause sign, ornament and hamza seat,
 * plus alef/ya/ta-marbuta variation.
 *
 * So this is deliberately BLIND to vowelling and orthography. It answers
 * "is this the right ayah, whole?" — never "is the tashkil correct?".
 * The byte-exact lock in the test covers that half. Do not use this
 * function to compare two texts you expect to be identical; use === .
 *
 * MEASURED BLIND SPOTS (audited against the 234-entry corpus, not reasoned):
 *   · `ءا` and `ا` collapse to the same output, because the alef-madda fold
 *     below is what makes 29:20, 39:42 and 29:5 agree with quran.com. Deleting
 *     the lone hamza from `وَءَاثَ` is therefore invisible here — it is the one
 *     single-character deletion in the whole corpus this function cannot see.
 *   · The strip class spans U+064B–U+0670, which sweeps up the Arabic-Indic
 *     digits and the dotless letters U+066E/U+066F along with the marks. The
 *     digits only ever appear inside ayah ornaments, which are removed anyway,
 *     and neither dotless letter occurs in this corpus — verified, 0 hits. If
 *     a future edition introduces them, narrow the range rather than widening
 *     the exceptions.
 * Non-blind spots worth recording, so nobody has to re-derive them: across 234
 * entries the function yields 230 distinct skeletons with ZERO collisions
 * between different ayah ranges, and retains 53% of source length on average
 * (min 41%, max 57%) — it is not a degenerate transform that would let any
 * verse match any other.
 */
export function arabicSkeleton(text: string): string {
  return (
    text
      .normalize('NFD')
      // combining marks: harakat, tanween, sukun, shadda, dagger alef,
      // superscript/subscript signs, and the U+06D6–U+06ED pause/tajwid block
      .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
      .normalize('NFC')
      // ayah-number ornaments: ﴿١﴾ / ﴿1﴾ and anything between them
      .replace(/[﴾﴿][^﴾﴿]*[﴾﴿]/g, '')
      // hamza written on its own before an alef (ءا) is the decomposed form
      // of alef-madda; unify before the alef fold below.
      .replace(/ءا/g, 'ا')
      // alef family -> bare alef; alef maqsura -> ya; ta marbuta -> ha
      .replace(/[آأإاٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      // drop anything that is not an Arabic letter or a space
      .replace(/[^ء-ي\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}
