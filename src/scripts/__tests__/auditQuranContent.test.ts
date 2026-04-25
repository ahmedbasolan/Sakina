import { parseAudioKey } from '../auditQuranContent';

describe('parseAudioKey', () => {
  it('parses a single verse', () => {
    expect(parseAudioKey('2:255')).toEqual({ chapter: 2, startVerse: 255, endVerse: 255 });
  });

  it('parses a verse range', () => {
    expect(parseAudioKey('94:5-6')).toEqual({ chapter: 94, startVerse: 5, endVerse: 6 });
  });

  it('returns null for invalid format', () => {
    expect(parseAudioKey('nonsense')).toBeNull();
    expect(parseAudioKey('1:')).toBeNull();
    expect(parseAudioKey('1:2-')).toBeNull();
    expect(parseAudioKey('')).toBeNull();
  });

  it('returns null when start > end in a range', () => {
    expect(parseAudioKey('2:10-5')).toBeNull();
  });
});

import {
  normalizeArabic,
  normalizeEnglish,
  fetchCanonicalVerse,
  diffContentEntry,
  type CanonicalVerse,
} from '../auditQuranContent';

describe('normalizeArabic', () => {
  it('strips tatweel and normalizes whitespace', () => {
    expect(normalizeArabic('\u0644\u0644\u0640\u0647  \u0627\u0644\u0631\u062d\u0645\u0646')).toBe('\u0644\u0644\u0647 \u0627\u0644\u0631\u062d\u0645\u0646');
  });

  it('strips verse markers like \ufd3e\u0665\ufd3f and bracketed numbers', () => {
    expect(normalizeArabic('\u0641\u064e\u0625\u0650\u0646\u064e\u0651 \ufd3e5\ufd3f')).toBe('\u0641\u064e\u0625\u0650\u0646\u064e\u0651');
  });
});

describe('normalizeEnglish', () => {
  it('collapses multiple spaces', () => {
    expect(normalizeEnglish('hello   world')).toBe('hello world');
  });

  it('trims and preserves punctuation (no regex mangling)', () => {
    expect(normalizeEnglish('  Indeed, with hardship is ease.  ')).toBe(
      'Indeed, with hardship is ease.',
    );
  });
});

describe('fetchCanonicalVerse', () => {
  afterEach(() => jest.restoreAllMocks());

  it('fetches a single verse and maps to CanonicalVerse', async () => {
    // quran.com /verses/by_key returns {"verse": {...}} singular, not {"verses": [...]}
    const mockBody = {
      verse: {
        verse_key: '2:255',
        text_uthmani: '\u0671\u0644\u0644\u064e\u0651\u0647\u064f \u0644\u064e\u0622 \u0625\u0650\u0644\u064e\u0670\u0647\u064e \u0625\u0650\u0644\u064e\u0651\u0627 \u0647\u064f\u0648\u064e',
        translations: [{ resource_id: 20, text: 'Allah \u2014 there is no deity except Him.' }],
      },
    };
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockBody,
    } as Response);

    const result = await fetchCanonicalVerse({ chapter: 2, startVerse: 255, endVerse: 255 });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/verses/by_key/2:255'),
      expect.any(Object),
    );
    expect(result.arabicText).toContain('\u0671\u0644\u0644\u064e\u0651\u0647\u064f');
    expect(result.englishTranslation).toBe('Allah \u2014 there is no deity except Him.');
  });

  it('concatenates a range across multiple fetches', async () => {
    const verses = [
      { verse_key: '94:5', text_uthmani: '\u0641\u064e\u0625\u0650\u0646\u064e\u0651 \u0645\u064e\u0639\u064e', translations: [{ resource_id: 20, text: 'So with hardship.' }] },
      { verse_key: '94:6', text_uthmani: '\u0625\u0650\u0646\u064e\u0651 \u0645\u064e\u0639\u064e', translations: [{ resource_id: 20, text: 'Indeed with hardship.' }] },
    ];
    jest.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const key = String(url).split('/').pop()?.split('?')[0] || '';
      const v = verses.find((x) => x.verse_key === key) ?? verses[0];
      return { ok: true, json: async () => ({ verse: v }) } as Response;
    });

    const result = await fetchCanonicalVerse({ chapter: 94, startVerse: 5, endVerse: 6 });

    expect(result.arabicText).toContain('\u0641\u064e\u0625\u0650\u0646\u064e\u0651 \u0645\u064e\u0639\u064e');
    expect(result.arabicText).toContain('\u0625\u0650\u0646\u064e\u0651 \u0645\u064e\u0639\u064e');
    expect(result.englishTranslation).toContain('So with hardship.');
    expect(result.englishTranslation).toContain('Indeed with hardship.');
  });
});

describe('diffContentEntry', () => {
  const canonical: CanonicalVerse = {
    audioKey: '2:255',
    arabicText: '\u0671\u0644\u0644\u064e\u0651\u0647\u064f \u0644\u064e\u0622 \u0625\u0650\u0644\u064e\u0670\u0647\u064e \u0625\u0650\u0644\u064e\u0651\u0627 \u0647\u064f\u0648\u064e',
    englishTranslation: 'Allah \u2014 there is no deity except Him.',
  };

  it('returns no diff when fields match after normalization', () => {
    const diff = diffContentEntry(
      { arabicText: '\u0671\u0644\u0644\u064e\u0651\u0647\u064f \u0644\u064e\u0622 \u0625\u0650\u0644\u064e\u0670\u0647\u064e \u0625\u0650\u0644\u064e\u0651\u0627 \u0647\u064f\u0648\u064e', englishTranslation: 'Allah \u2014 there is no deity except Him.' },
      canonical,
    );
    expect(diff).toEqual([]);
  });

  it('detects Arabic drift', () => {
    const diff = diffContentEntry(
      { arabicText: 'SOMETHING_ELSE', englishTranslation: canonical.englishTranslation },
      canonical,
    );
    expect(diff).toContain('arabicText');
  });

  it('detects English drift', () => {
    const diff = diffContentEntry(
      { arabicText: canonical.arabicText, englishTranslation: 'Wrong translation' },
      canonical,
    );
    expect(diff).toContain('englishTranslation');
  });
});

import { applyFix } from '../auditQuranContent';

describe('applyFix', () => {
  const source = `const data = [
  {
    id: 'quran_2_255',
    audioKey: '2:255',
    arabicText: 'OLD_ARABIC',
    englishTranslation: 'Old translation.',
    moods: ['Calm'],
  },
  {
    id: 'quran_93_4',
    audioKey: '93:4',
    arabicText: 'ANOTHER',
    englishTranslation: 'Another.',
    moods: ['Overwhelmed'],
  },
];`;

  it('replaces arabicText and englishTranslation for a matching entry only', () => {
    const out = applyFix(source, 'quran_2_255', {
      audioKey: '2:255',
      arabicText: 'NEW_ARABIC',
      englishTranslation: 'New translation.',
    });
    expect(out).toContain('arabicText: "NEW_ARABIC"');
    expect(out).toContain('englishTranslation: "New translation."');
    expect(out).toContain("arabicText: 'ANOTHER'"); // other entry untouched
  });

  it('returns source unchanged if id not found', () => {
    const out = applyFix(source, 'nonexistent_id', {
      audioKey: '1:1',
      arabicText: 'x',
      englishTranslation: 'y',
    });
    expect(out).toBe(source);
  });
});
