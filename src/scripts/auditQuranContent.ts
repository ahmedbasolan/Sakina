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

// ─── Normalization ─────────────────────────────────────────────

/** Strip Arabic verse-end ornament markers like ﴿٥﴾, ﴿5﴾, tatweel, and collapse whitespace. */
export function normalizeArabic(text: string): string {
  return text
    .replace(/\u0640/g, '')                       // tatweel
    .replace(/[\ufd3e\ufd3f][^\ufd3e\ufd3f]*[\ufd3e\ufd3f]/g, '')  // ayah ornament blocks
    .replace(/\s+/g, ' ')
    .trim();
}

/** Collapse whitespace; leave all punctuation intact. */
export function normalizeEnglish(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// ─── quran.com fetch ───────────────────────────────────────────

const QURAN_API_BASE = 'https://api.quran.com/api/v4';
const SAHIH_INTERNATIONAL_ID = 131;

export type CanonicalVerse = {
  audioKey: string;
  arabicText: string;
  englishTranslation: string;
  transliteration?: string;
};

type QuranApiVerse = {
  verse_key: string;
  text_uthmani: string;
  translations?: Array<{ resource_id: number; text: string }>;
};

async function fetchOneVerse(verseKey: string): Promise<QuranApiVerse> {
  const url = `${QURAN_API_BASE}/verses/by_key/${verseKey}?translations=${SAHIH_INTERNATIONAL_ID}&fields=text_uthmani`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`quran.com fetch failed for ${verseKey}: ${response.status}`);
  }
  const body = (await response.json()) as { verses: QuranApiVerse[] };
  if (!body.verses?.[0]) {
    throw new Error(`quran.com returned no verse for ${verseKey}`);
  }
  return body.verses[0];
}

export async function fetchCanonicalVerse(parts: AudioKeyParts): Promise<CanonicalVerse> {
  const arabicChunks: string[] = [];
  const englishChunks: string[] = [];

  for (let v = parts.startVerse; v <= parts.endVerse; v++) {
    const key = `${parts.chapter}:${v}`;
    const verse = await fetchOneVerse(key);
    arabicChunks.push(verse.text_uthmani);
    const english = verse.translations?.find((t) => t.resource_id === SAHIH_INTERNATIONAL_ID);
    if (!english) throw new Error(`Missing Sahih International for ${key}`);
    englishChunks.push(english.text);
  }

  const audioKey =
    parts.startVerse === parts.endVerse
      ? `${parts.chapter}:${parts.startVerse}`
      : `${parts.chapter}:${parts.startVerse}-${parts.endVerse}`;

  return {
    audioKey,
    arabicText: arabicChunks.join(' '),
    englishTranslation: englishChunks.join(' '),
  };
}

// ─── Diff ──────────────────────────────────────────────────────

/**
 * Compare a local content entry against the canonical truth.
 * Returns an array of drifted field names. Empty array means in-sync.
 */
export function diffContentEntry(
  local: { arabicText?: string; englishTranslation?: string },
  canonical: CanonicalVerse,
): Array<'arabicText' | 'englishTranslation'> {
  const drift: Array<'arabicText' | 'englishTranslation'> = [];
  if (normalizeArabic(local.arabicText ?? '') !== normalizeArabic(canonical.arabicText)) {
    drift.push('arabicText');
  }
  if (normalizeEnglish(local.englishTranslation ?? '') !== normalizeEnglish(canonical.englishTranslation)) {
    drift.push('englishTranslation');
  }
  return drift;
}
