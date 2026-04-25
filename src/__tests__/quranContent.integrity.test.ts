import { quranContent as quranContentData } from '../data/quranData';
import canonicalJson from '../data/canonical/quranCanonical.json';
import {
  diffContentEntry,
  type CanonicalVerse,
} from '../scripts/auditQuranContent';

const canonical: Record<string, CanonicalVerse> = canonicalJson as Record<string, CanonicalVerse>;

describe('quranContent integrity', () => {
  const entries = quranContentData.filter((e) => !!e.audioKey);

  it('every entry with an audioKey has a canonical snapshot', () => {
    const missing = entries.filter((e) => !canonical[e.audioKey!]);
    expect(missing.map((m) => `${m.id} (${m.audioKey})`)).toEqual([]);
  });

  it.each(entries.map((e) => [e.id, e.audioKey!]))(
    '%s (%s) matches canonical text',
    (_id, audioKey) => {
      const entry = entries.find((e) => e.audioKey === audioKey)!;
      const truth = canonical[audioKey];
      expect(truth).toBeDefined();
      const drift = diffContentEntry(
        { arabicText: entry.arabicText, englishTranslation: entry.englishTranslation },
        truth,
      );
      if (drift.length) {
        throw new Error(
          `Drift in ${entry.id} (${audioKey}): ${drift.join(', ')}. ` +
            `Run: npm run refresh-canonical`,
        );
      }
    },
  );
});
