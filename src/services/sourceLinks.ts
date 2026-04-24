/**
 * Source URL builders for content citations.
 *
 * Every ContextBlock and verse card carries a SourceCitation. These helpers
 * produce the canonical URL that a SourceChip opens on tap.
 *
 * No runtime API calls — these are pure URL builders used at content-author
 * time (in data files) and at render time (by SourceChip).
 */

/**
 * Verified against https://api.quran.com/api/v4/resources/tafsirs
 * ID 91 = Tafsir As-Sa'di (Arabic). No English version is currently on quran.com;
 * contextBlocks text is hand-authored in English and this URL is for attribution only.
 */
export const TAFSIR_IDS = {
  AS_SADI: 91,
} as const;

/** Parse "2:255" or "94:5-6" into the starting verse key. */
function startVerseKey(verseKey: string): string {
  const [chapter, versePart] = verseKey.split(':');
  const start = versePart.split('-')[0];
  return `${chapter}/${start}`;
}

export function quranVerseUrl(verseKey: string): string {
  return `https://quran.com/${startVerseKey(verseKey)}`;
}

export function quranTafsirUrl(verseKey: string, tafsirId: number): string {
  return `https://quran.com/${startVerseKey(verseKey)}/tafsirs/${tafsirId}`;
}

/**
 * Build a sunnah.com URL.
 * @param collection lowercase collection slug — e.g. "bukhari", "muslim", "abudawud"
 * @param hadithNumber numeric hadith reference as a string — preserves leading zeros if any
 */
export function sunnahUrl(collection: string, hadithNumber: string): string {
  return `https://sunnah.com/${collection}:${hadithNumber}`;
}
