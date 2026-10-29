import {
  buildVerseSnapshot,
  pickVerse,
  toCardVerse,
  type CardVerse,
} from '../verseSnapshot';
import {
  getDailyVerseForDateSync,
  getDailyVerseSync,
  type DailyVerse,
} from '../../dailyVerseService';
import type { Content } from '../../../types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const content = (over: Partial<Content> = {}): Content => ({
  id: 'quran_93_4',
  type: 'Quran',
  primaryText: 'primary',
  // Deliberate leading/trailing whitespace and odd spacing: the copy must be
  // byte-identical, never trimmed or normalised.
  arabicText: '  وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ  ',
  englishTranslation: '  And the Hereafter is better for you than the first.  ',
  source: ' Surah Ad-Duha 93:4 ',
  whyThis: 'why',
  moods: [],
  ...over,
});

const daily = (dateKey: string): DailyVerse => ({
  arabic: 'A',
  transliteration: 'T',
  translation: 'E',
  ref: 'R',
  dateKey,
});

describe('toCardVerse', () => {
  it('rejects Hadith, Dua, Dhikr and Sunnah items', () => {
    for (const type of ['Hadith', 'Dua', 'Dhikr', 'Sunnah Practice'] as const) {
      expect(toCardVerse(content({ type }), '2026-10-29')).toBeNull();
    }
  });

  it('accepts a Quran item and copies the text unchanged', () => {
    const c = content();
    expect(toCardVerse(c, '2026-10-29')).toEqual({
      arabic: c.arabicText,
      english: c.englishTranslation,
      ref: c.source,
      dateKey: '2026-10-29',
    });
  });

  it('rejects a Quran item missing arabic, translation or source', () => {
    expect(toCardVerse(content({ arabicText: undefined }), '2026-10-29')).toBeNull();
    expect(toCardVerse(content({ arabicText: '' }), '2026-10-29')).toBeNull();
    expect(toCardVerse(content({ englishTranslation: '' }), '2026-10-29')).toBeNull();
    expect(toCardVerse(content({ source: '' }), '2026-10-29')).toBeNull();
  });
});

describe('buildVerseSnapshot', () => {
  it('daily[0] is exactly the verse Home shows today', () => {
    const today = getDailyVerseSync();
    const snap = buildVerseSnapshot({ mood: null, today, timeFormat: '24h' });
    expect(snap.version).toBe(1);
    expect(snap.timeFormat).toBe('24h');
    expect(snap.daily).toHaveLength(7);
    expect(snap.daily[0]).toEqual({
      arabic: today.arabic,
      english: today.translation,
      ref: today.ref,
      dateKey: today.dateKey,
    });
  });

  it('daily holds today plus the next six calendar days, in order', () => {
    const snap = buildVerseSnapshot({
      mood: null,
      today: daily('2026-10-29'),
      timeFormat: '12h',
    });
    expect(snap.daily.map((v) => v.dateKey)).toEqual([
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
    ]);
  });

  it('rolls over month and year boundaries', () => {
    const snap = buildVerseSnapshot({
      mood: null,
      today: daily('2026-12-29'),
      timeFormat: '12h',
    });
    expect(snap.daily.map((v) => v.dateKey)).toEqual([
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
      '2027-01-04',
    ]);
  });

  it("each future day carries that day's own pool verse, unchanged", () => {
    const snap = buildVerseSnapshot({
      mood: null,
      today: getDailyVerseForDateSync('2026-10-29'),
      timeFormat: '12h',
    });
    for (const v of snap.daily) {
      const expected = getDailyVerseForDateSync(v.dateKey);
      expect(v.arabic).toBe(expected.arabic);
      expect(v.english).toBe(expected.translation);
      expect(v.ref).toBe(expected.ref);
    }
  });

  it('keeps the mood verse as given', () => {
    const mood: CardVerse = { arabic: 'a', english: 'e', ref: 'r', dateKey: '2026-10-29' };
    const snap = buildVerseSnapshot({ mood, today: daily('2026-10-29'), timeFormat: '12h' });
    expect(snap.mood).toEqual(mood);
  });
});

describe('pickVerse', () => {
  const mood: CardVerse = { arabic: 'ma', english: 'me', ref: 'mr', dateKey: '2026-10-29' };

  it("uses today's mood verse on the day it was chosen", () => {
    const snap = buildVerseSnapshot({ mood, today: daily('2026-10-29'), timeFormat: '12h' });
    expect(pickVerse(snap, '2026-10-29')).toEqual(mood);
  });

  it("yesterday's mood verse falls back to today's daily verse", () => {
    const snap = buildVerseSnapshot({
      mood: { ...mood, dateKey: '2026-10-28' },
      today: daily('2026-10-29'),
      timeFormat: '12h',
    });
    expect(pickVerse(snap, '2026-10-29')).toEqual(snap.daily[0]);
  });

  it('a hadith-only day keeps the daily verse', () => {
    const snap = buildVerseSnapshot({ mood: null, today: daily('2026-10-29'), timeFormat: '12h' });
    expect(pickVerse(snap, '2026-10-29')).toEqual(snap.daily[0]);
  });

  it('serves a later day from daily, never the mood verse', () => {
    const snap = buildVerseSnapshot({ mood, today: daily('2026-10-29'), timeFormat: '12h' });
    expect(pickVerse(snap, '2026-11-02')).toEqual(snap.daily[4]);
  });

  it('returns null for a day outside the snapshot', () => {
    const snap = buildVerseSnapshot({ mood: null, today: daily('2026-10-29'), timeFormat: '12h' });
    expect(pickVerse(snap, '2026-11-05')).toBeNull();
    expect(pickVerse(snap, '2026-10-28')).toBeNull();
  });
});

describe('getDailyVerseForDateSync', () => {
  it('equals getDailyVerseSync() for today', () => {
    const today = getDailyVerseSync();
    expect(getDailyVerseForDateSync(today.dateKey)).toEqual(today);
  });

  it('is deterministic and stamps the requested dateKey', () => {
    const a = getDailyVerseForDateSync('2026-11-02');
    expect(a.dateKey).toBe('2026-11-02');
    expect(getDailyVerseForDateSync('2026-11-02')).toEqual(a);
  });
});
