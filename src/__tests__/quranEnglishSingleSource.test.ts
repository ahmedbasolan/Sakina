/**
 * A verse has one English text: `englishTranslation`, the Sahih International
 * rendering of the complete ayah. Until 2026-10-13, 39 Quran entries also
 * carried a `translation` field that GuidanceScreen preferred: expanded with
 * tafsir and occasions of revelation, and in places dropping clauses (5:13 lost
 * "We cursed them", 5:48 lost "and as a guardian over it"). It never rendered,
 * only because the content table has no column for it. This test keeps a
 * second English from creeping back in for a future column to surface.
 *
 * WHAT THIS DOES NOT CATCH: whether `englishTranslation` itself is complete or
 * faithful (nothing automated checks the English; see quranArabicIntegrity's
 * header), and Hadith entries, which use `translation` legitimately.
 */
import { quranContent } from '../data/quranData';

describe('Quran entries carry one English text', () => {
  it('no Quran entry has a `translation` field', () => {
    const offenders = quranContent
      .filter((c) => c.type === 'Quran' && c.translation !== undefined)
      .map((c) => c.id);
    expect(offenders).toEqual([]);
  });

  it('every Quran entry has a non-empty englishTranslation', () => {
    const empty = quranContent
      .filter((c) => c.type === 'Quran' && !c.englishTranslation?.trim())
      .map((c) => c.id);
    expect(empty).toEqual([]);
  });
});
