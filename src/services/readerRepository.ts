/**
 * ReaderRepository — persistence for the Quran reader: reading progress
 * (kv_store) and bookmarked verses (bookmarked_verses).
 *
 * Previously this SQL lived directly in SurahReaderScreen, and LibraryScreen
 * imported loadReadingProgress from that screen file. Isolated here so screens
 * never touch the database directly and the reader's bookmarks are owned by
 * one module.
 */

import { dbQuery } from '../database/connection';

const PROGRESS_KEY = 'quran_reading_progress';

export interface ReadingProgress {
  surahNumber: number;
  verseIndex: number;
  surahName: string;
  timestamp: number;
}

export interface BookmarkRow {
  id: string;
  surahNumber: number;
  verseNumber: number;
  arabicText: string;
  translation: string;
  surahName: string;
  bookmarkedAt: number;
}

export async function loadReadingProgress(): Promise<ReadingProgress | null> {
  return dbQuery(async (db) => {
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM kv_store WHERE key = ?',
      [PROGRESS_KEY],
    );
    if (!row) return null;
    try { return JSON.parse(row.value) as ReadingProgress; } catch { return null; }
  });
}

export async function saveProgress(progress: ReadingProgress): Promise<void> {
  await dbQuery(async (db) => {
    await db.runAsync(
      'INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)',
      [PROGRESS_KEY, JSON.stringify(progress)],
    );
  });
}

export async function loadBookmarksForSurah(surahNumber: number): Promise<Set<number>> {
  return dbQuery(async (db) => {
    const rows = await db.getAllAsync<{ verseNumber: number }>(
      'SELECT verseNumber FROM bookmarked_verses WHERE surahNumber = ?',
      [surahNumber],
    );
    return new Set(rows.map((r) => r.verseNumber));
  });
}

export async function addBookmark(
  verse: { numberInSurah: number; arabic: string; translation: string },
  surahNumber: number,
  surahName: string,
): Promise<void> {
  await dbQuery(async (db) => {
    const id = `bv_${surahNumber}_${verse.numberInSurah}_${Date.now()}`;
    await db.runAsync(
      `INSERT OR IGNORE INTO bookmarked_verses
        (id, surahNumber, verseNumber, arabicText, translation, surahName, bookmarkedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, surahNumber, verse.numberInSurah, verse.arabic, verse.translation, surahName, Date.now()],
    );
  });
}

export async function removeBookmark(surahNumber: number, verseNumber: number): Promise<void> {
  await dbQuery(async (db) => {
    await db.runAsync(
      'DELETE FROM bookmarked_verses WHERE surahNumber = ? AND verseNumber = ?',
      [surahNumber, verseNumber],
    );
  });
}

/**
 * Every "save this verse" action in the app feeds the Saved Verses list,
 * regardless of where it happened: the bookmark icon in the Quran reader
 * (bookmarked_verses) or "save" while sitting with a verse in
 * Guidance/a Journey (saved_reflections bookmark-marker rows).
 */
export async function getAllBookmarks(): Promise<BookmarkRow[]> {
  return dbQuery(async (db) =>
    db.getAllAsync<BookmarkRow>(`
      SELECT id, surahNumber, verseNumber, arabicText, translation, surahName, bookmarkedAt
      FROM bookmarked_verses
      ORDER BY bookmarkedAt DESC
    `),
  );
}

// ── Legacy guidance bookmark cleanup ──────────────────────────────────────
// Older builds mirrored guidance saves into bookmarked_verses as
// `bv_guidance_*` rows (write-time mirror, removed). An un-bookmark must
// still clean those up, or a verse saved on an old build could never be
// un-bookmarked again.

/** Parse "Surah Al-Baqarah 2:255" → surah metadata. */
function parseQuranSource(
  source: string,
): { surahNumber: number; verseNumber: number } | null {
  const m = source.match(/^Surah\s+(.+?)\s+(\d+):(\d+)/);
  if (!m) return null;
  return {
    surahNumber: parseInt(m[2], 10),
    verseNumber: parseInt(m[3], 10),
  };
}

/** Delete the legacy `bv_guidance_*` row for a guidance verse, if one exists. */
export async function deleteLegacyGuidanceBookmark(source: string): Promise<void> {
  const quranInfo = parseQuranSource(source);
  if (!quranInfo) return;
  await dbQuery(async (db) => {
    const bmId = `bv_guidance_${quranInfo.surahNumber}_${quranInfo.verseNumber}`;
    await db.runAsync(`DELETE FROM bookmarked_verses WHERE id = ?`, [bmId]);
  });
}
