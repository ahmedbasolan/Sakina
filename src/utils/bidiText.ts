/**
 * Isolates embedded right-to-left (Arabic-script) runs inside otherwise
 * left-to-right text so they don't visually reorder surrounding words.
 *
 * Tafsir/commentary strings often carry Arabic phrases, names, or the ﷺ
 * ligature (U+FDFA) mid-sentence inside English prose. React Native's
 * <Text> runs the platform's Unicode Bidi Algorithm on the whole string as
 * one unit, so a bare RTL run can flip neighbouring punctuation/words out
 * of order. Wrapping each RTL run in First Strong Isolate / Pop
 * Directional Isolate (U+2068 ... U+2069) marks it as a self-contained
 * island, fixing the "Arabic and English mixing" garble without altering
 * any visible characters.
 */
// The Arabic Presentation Forms-B range's upper bound (U+FEFF territory)
// reads as a whitespace/format character to the rule below; it's a genuine,
// intentional range boundary here, not accidental whitespace in the source.
// eslint-disable-next-line no-irregular-whitespace
const ARABIC_RUN = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+/g;

export function isolateBidiRuns(text: string): string {
  if (!text) return text;
  return text.replace(ARABIC_RUN, (run) => `⁨${run}⁩`);
}
