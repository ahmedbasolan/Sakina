/**
 * initialContent.ts
 *
 * Previously re-exported quranContent from quranData.ts, which pulled
 * 10,681 lines of static data into the synchronous bundle parse path.
 *
 * Quran content is now seeded directly into SQLite during initializeDatabase()
 * via src/database/seedContent.ts using a lazy require() call. The RotationEngine
 * reads content from SQLite (getAvailableAnglesLocal) or Supabase (getAvailableAngles).
 *
 * sunnahContentData remains as a direct import because it is small (371 lines)
 * and is needed synchronously by RotationEngine.enrichExperienceWithSunnah().
 */
export { sunnahContentData } from './sunnahData';
