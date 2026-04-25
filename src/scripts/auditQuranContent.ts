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

/** Strip HTML tags (e.g. footnote <sup> markers from quran.com API), collapse whitespace. */
export function normalizeEnglish(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ─── quran.com fetch ───────────────────────────────────────────

const QURAN_API_BASE = 'https://api.quran.com/api/v4';
const SAHIH_INTERNATIONAL_ID = 20; // Saheeh International (id 20), not 131

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
  // /verses/by_key returns {"verse": {...}} (singular), not {"verses": [...]}
  const url = `${QURAN_API_BASE}/verses/by_key/${verseKey}?translations=${SAHIH_INTERNATIONAL_ID}&fields=text_uthmani,translations`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`quran.com fetch failed for ${verseKey}: ${response.status}`);
  }
  const body = (await response.json()) as { verse?: QuranApiVerse };
  if (!body.verse) {
    throw new Error(`quran.com returned no verse for ${verseKey}`);
  }
  return body.verse;
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
    // Strip HTML footnote elements entirely (e.g. <sup foot_note=...>1</sup>) before storing
    englishChunks.push(english.text.replace(/<sup[^>]*>[\s\S]*?<\/sup>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
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

// ─── CLI (only when run directly) ──────────────────────────────

/* istanbul ignore next -- CLI harness, exercised manually */
async function main() {
  const isFix = process.argv.includes('--fix');
  const path = await import('path');
  const fs = await import('fs/promises');

  // Lazy import so jest tests don't load the 10k-line data file.
  // quranData.ts uses a named export `quranContent`, not a default export.
  const { quranContent: quranContentData } = (await import('../data/quranData')) as {
    quranContent: Array<{
      id: string;
      audioKey?: string;
      arabicText?: string;
      englishTranslation?: string;
    }>;
  };

  const dataFilePath = path.resolve(__dirname, '../data/quranData.ts');
  const canonicalOutPath = path.resolve(__dirname, '../data/canonical/quranCanonical.json');

  let fileText = await fs.readFile(dataFilePath, 'utf8');
  const canonicalMap: Record<string, CanonicalVerse> = {};
  const report: Array<{ id: string; audioKey: string; drift: string[] }> = [];

  for (const entry of quranContentData) {
    if (!entry.audioKey) continue;
    const parts = parseAudioKey(entry.audioKey);
    if (!parts) {
      report.push({ id: entry.id, audioKey: entry.audioKey, drift: ['INVALID_KEY'] });
      continue;
    }

    let canonical: CanonicalVerse;
    try {
      canonical = await fetchCanonicalVerse(parts);
    } catch (err) {
      report.push({ id: entry.id, audioKey: entry.audioKey, drift: [`FETCH_FAILED: ${(err as Error).message}`] });
      continue;
    }
    canonicalMap[entry.audioKey] = canonical;

    const drift = diffContentEntry(
      { arabicText: entry.arabicText, englishTranslation: entry.englishTranslation },
      canonical,
    );
    if (drift.length) {
      report.push({ id: entry.id, audioKey: entry.audioKey, drift });
      if (isFix) {
        fileText = applyFix(fileText, entry.id, canonical);
      }
    }
  }

  if (isFix) {
    await fs.mkdir(path.dirname(canonicalOutPath), { recursive: true });
    await fs.writeFile(canonicalOutPath, JSON.stringify(canonicalMap, null, 2) + '\n', 'utf8');
    await fs.writeFile(dataFilePath, fileText, 'utf8');
    console.log(`\u2713 Fixed ${report.filter((r) => !r.drift[0]?.startsWith('FETCH')).length} entries. Canonical snapshot written.`);
  }

  console.log('\nDrift report:');
  if (!report.length) {
    console.log('  (no drift detected)');
  } else {
    for (const r of report) console.log(`  ${r.audioKey.padEnd(10)} ${r.id.padEnd(32)} ${r.drift.join(', ')}`);
  }
  console.log(`\nTotal entries scanned: ${quranContentData.filter((e) => e.audioKey).length}`);
}

/**
 * Rewrite `arabicText` and `englishTranslation` string literals for the entry
 * with the given id. Uses a block-scoped regex — the block is delimited by
 * `id: '<id>'` and the next closing `}` at column 2 (the per-entry indent).
 */
export function applyFix(source: string, entryId: string, canonical: CanonicalVerse): string {
  const idMarker = `id: '${entryId}'`;
  const idIndex = source.indexOf(idMarker);
  if (idIndex === -1) return source;

  // Walk forward to the entry's closing `},` at the top of the object array indent.
  const blockEnd = source.indexOf('\n  },', idIndex);
  if (blockEnd === -1) return source;

  const block = source.slice(idIndex, blockEnd);
  const rewrittenBlock = block
    .replace(/arabicText:\s*(['"`])[\s\S]*?\1/m, `arabicText: ${JSON.stringify(canonical.arabicText)}`)
    .replace(/englishTranslation:\s*(['"`])[\s\S]*?\1/m, `englishTranslation: ${JSON.stringify(canonical.englishTranslation)}`);

  return source.slice(0, idIndex) + rewrittenBlock + source.slice(blockEnd);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
