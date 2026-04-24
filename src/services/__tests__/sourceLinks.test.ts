import { quranVerseUrl, quranTafsirUrl, sunnahUrl, TAFSIR_IDS } from '../sourceLinks';

describe('sourceLinks', () => {
  describe('quranVerseUrl', () => {
    it('builds canonical URL for a single verse', () => {
      expect(quranVerseUrl('2:255')).toBe('https://quran.com/2/255');
    });

    it('uses start verse when given a range', () => {
      expect(quranVerseUrl('94:5-6')).toBe('https://quran.com/94/5');
    });
  });

  describe('quranTafsirUrl', () => {
    it('builds URL with tafsir ID', () => {
      expect(quranTafsirUrl('30:21', 170)).toBe('https://quran.com/30/21/tafsirs/170');
    });
  });

  describe('sunnahUrl', () => {
    it('builds URL from collection and hadith number', () => {
      expect(sunnahUrl('bukhari', '6363')).toBe('https://sunnah.com/bukhari:6363');
    });
  });

  describe('TAFSIR_IDS', () => {
    it('has a verified As-Sa\'di ID (non-zero integer)', () => {
      expect(TAFSIR_IDS.AS_SADI).toBeGreaterThan(0);
      expect(Number.isInteger(TAFSIR_IDS.AS_SADI)).toBe(true);
    });
  });
});
