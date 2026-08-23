/**
 * ReflectionRepository — persistence for saved guidance reflections.
 *
 * Previously the save/getAll logic lived directly in RotationEngine, coupling
 * the rotation orchestrator to reflection CRUD. This class isolates that
 * responsibility so RotationEngine only needs to delegate.
 *
 * Note: reflections are always local (SQLite only) — privacy-first design,
 * never synced to Supabase.
 */

import { dbQuery } from '../database/connection';
import { Mood } from '../types';

// Re-export the canonical type from src/types so callers only need one import.
// The query result includes joined fields (primaryText, englishTranslation,
// source) beyond the base type.
export interface SavedReflection {
  id: string;
  contentId: string;
  angleId: string;
  mood: string;
  reflection: string;
  timestamp: number;
  primaryText: string;
  // primaryText is often a transliteration (Latin-script phonetics), not
  // readable English — callers wanting a human-readable fallback preview
  // (e.g. ReflectionHistoryScreen when no note was typed) should use this
  // field, not primaryText.
  englishTranslation: string;
  // The actual Arabic — LibraryScreen's Saved Verses tab needs this to
  // render bookmarked verses the same way regardless of whether they were
  // saved from the Quran reader or from Guidance/a Journey.
  arabicText: string | null;
  source: string;
  isFavorite?: number; // SQLite stores booleans as 0/1
}

export class ReflectionRepository {
  private static instance: ReflectionRepository;

  static getInstance(): ReflectionRepository {
    if (!ReflectionRepository.instance) {
      ReflectionRepository.instance = new ReflectionRepository();
    }
    return ReflectionRepository.instance;
  }

  private constructor() {}

  async save(
    contentId: string,
    angleId: string,
    mood: Mood,
    reflection: string,
  ): Promise<void> {
    const safeReflection = reflection.slice(0, 1000);
    await dbQuery(async (db) => {
      // Update the user's existing written reflection for this verse+angle
      // rather than inserting a new row every time they edit and re-save —
      // otherwise each resave left a stale duplicate behind in Reflection
      // History. A bookmark-marker row (reflection = '', written by
      // useGuidanceLogic's handleSave) is deliberately excluded here so this
      // never repurposes it; that row's lifecycle is owned by the bookmark
      // toggle, not by reflection saves.
      const existing = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM saved_reflections
         WHERE contentId = ? AND angleId = ? AND reflection != ''
         ORDER BY timestamp DESC LIMIT 1`,
        [contentId, angleId],
      );
      if (existing) {
        await db.runAsync(
          `UPDATE saved_reflections SET reflection = ?, mood = ?, timestamp = ? WHERE id = ?`,
          [safeReflection, mood, Date.now(), existing.id],
        );
      } else {
        await db.runAsync(
          `INSERT INTO saved_reflections
             (id, contentId, angleId, mood, reflection, timestamp)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            `reflection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contentId,
            angleId,
            mood,
            safeReflection,
            Date.now(),
          ],
        );
      }
    });
  }

  async getAll(): Promise<SavedReflection[]> {
    return dbQuery(async (db) => {
      const result = await db.getAllAsync(`
        SELECT sr.*, c.primaryText, c.englishTranslation, c.arabicText, c.source
        FROM saved_reflections sr
        JOIN content c ON sr.contentId = c.id
        ORDER BY sr.timestamp DESC
      `);
      return result as SavedReflection[];
    });
  }
}

// ── Freeform reflections (ReflectionHistoryScreen) ────────────────────────
// The `reflections` table is the user's own free-writing journal — no verse
// link, no angle. Previously queried inline by ReflectionHistoryScreen.

export interface FreeformReflection {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  createdAt: number;
}

export async function getFreeformReflections(limit = 50): Promise<FreeformReflection[]> {
  return dbQuery(async (db) => {
    const rows = await db.getAllAsync(
      `SELECT id, title, content, mood, createdAt FROM reflections ORDER BY createdAt DESC LIMIT ?`,
      [limit],
    );
    return rows as FreeformReflection[];
  });
}

export async function insertFreeformReflection(
  id: string,
  title: string,
  content: string,
  mood?: string,
): Promise<void> {
  await dbQuery(async (db) => {
    await db.runAsync(
      `INSERT INTO reflections (id, title, content, mood, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [id, title || 'Reflection', content, mood || null, Date.now()],
    );
  });
}

// ── Bookmark-marker rows (useGuidanceLogic bookmark toggle) ───────────────
// An empty-reflection saved_reflections row marks a verse as bookmarked from
// Guidance/a Journey. Its lifecycle is owned by the bookmark toggle, never by
// `save()` — which deliberately excludes `reflection = ''` rows so it can
// never repurpose one. LibraryScreen's Saved Verses tab merges these rows
// with the reader's own bookmarked_verses at read time.

/**
 * Insert the empty-reflection row that marks a verse as bookmarked.
 */
export async function saveBookmarkMarker(
  id: string,
  contentId: string,
  angleId: string,
  mood: Mood,
): Promise<void> {
  await dbQuery(async (db) => {
    await db.runAsync(
      `INSERT OR REPLACE INTO saved_reflections (id, contentId, angleId, mood, reflection, timestamp)
       VALUES (?, ?, ?, ?, '', ?)`,
      [id, contentId, angleId, mood, Date.now()],
    );
  });
}

/**
 * Remove only the empty-reflection bookmark-marker row for a verse+angle.
 * A real written reflection (non-empty text) at the same contentId/angleId
 * must survive an un-bookmark.
 */
export async function deleteBookmarkMarker(contentId: string, angleId: string): Promise<void> {
  await dbQuery(async (db) => {
    await db.runAsync(
      `DELETE FROM saved_reflections WHERE contentId = ? AND angleId = ? AND reflection = ''`,
      [contentId, angleId],
    );
  });
}
