/**
 * Quran content audit script.
 *
 * Two modes:
 *   npm run audit-quran            → dry-run, prints a diff report
 *   npm run audit-quran -- --fix   → rewrites src/data/quranData.ts in place
 *                                    and regenerates src/data/canonical/quranCanonical.json
 *
 * Never called at runtime. Requires network.
 */

export type AudioKeyParts = {
  chapter: number;
  startVerse: number;
  endVerse: number;
};

export function parseAudioKey(audioKey: string): AudioKeyParts | null {
  const match = audioKey.match(/^(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  const chapter = parseInt(match[1], 10);
  const startVerse = parseInt(match[2], 10);
  const endVerse = match[3] !== undefined ? parseInt(match[3], 10) : startVerse;
  if (!Number.isFinite(chapter) || !Number.isFinite(startVerse) || !Number.isFinite(endVerse)) {
    return null;
  }
  if (endVerse < startVerse) return null;
  return { chapter, startVerse, endVerse };
}
