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

import { dbQuery } from '../database/schema';
import { Mood } from '../types';

// Re-export the canonical type from src/types so callers only need one import.
// The query result includes joined fields (primaryText, source) beyond the base type.
export interface SavedReflection {
  id: string;
  contentId: string;
  angleId: string;
  mood: string;
  reflection: string;
  timestamp: number;
  primaryText: string;
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
    });
  }

  async getAll(): Promise<SavedReflection[]> {
    return dbQuery(async (db) => {
      const result = await db.getAllAsync(`
        SELECT sr.*, c.primaryText, c.source
        FROM saved_reflections sr
        JOIN content c ON sr.contentId = c.id
        ORDER BY sr.timestamp DESC
      `);
      return result as SavedReflection[];
    });
  }
}
