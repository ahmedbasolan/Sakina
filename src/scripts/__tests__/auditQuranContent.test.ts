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
