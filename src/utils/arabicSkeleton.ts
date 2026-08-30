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
