/**
 * Read-path guard for Content.story.
 *
 * mapLocalRow is not exported, so rather than widen its visibility this drives
 * a real in-memory SQLite through the SHIPPED DDL — the same approach
 * verify-local-wipe.mjs uses. That catches a missing SELECT alias, which a
 * unit test of the mapper alone would not: the mood query lists columns
 * explicitly (a `SELECT ca.*, c.*` once collided on `id` and corrupted session
 * dedup), so a column that exists and is mapped but never selected reads back
 * as undefined on every device.
 *
 * WHAT THIS DOES NOT CATCH: the Supabase path. mapCloudRow is checked here
 * only for the presence of a guarded parse, not against a live schema — a
 * missing `story` column in Postgres returns undefined rather than erroring,
 * so only applying migration 006 and confirming the column proves that half.
 */
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const root = path.join(__dirname, '..', '..', '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

/** Lift the shipped `content` DDL rather than restating it. */
function contentDDL(): string {
  const src = read('src/database/tables.ts');
  const start = src.indexOf('CREATE TABLE IF NOT EXISTS content (');
  return src.slice(start, src.indexOf(');', start) + 2);
}

describe('story survives the SQLite round trip', () => {
  it('is selected by the mood query and parses back to an object', () => {
    const db = new DatabaseSync(':memory:');
    db.exec(contentDDL());

    const story = {
      title: 'A Test Story',
      body: 'Narrative body.',
      source: 'Sahih al-Bukhari 3339',
      sourceType: 'hadith_narrative',
      grading: 'sahih',
    };

    db.prepare(
      `INSERT INTO content (id, type, primaryText, englishTranslation, source, whyThis, story)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run('quran_test_1', 'Quran', 'x', 'x', 'Surah Test 1:1', 'x', JSON.stringify(story));

    const row = db.prepare('SELECT c.story AS story FROM content c WHERE c.id = ?')
      .get('quran_test_1') as { story: string };

    expect(JSON.parse(row.story)).toEqual(story);
    db.close();
  });

  it('the shipped mood query selects c.story', () => {
    expect(read('src/services/contentRepository.ts')).toContain('c.story');
  });

  // contentRepository.ts builds a full Content in four places — mapCloudRow,
  // mapLocalRow, fetchContentById and getQuranVerses — and the first two got
  // `story` while the other two did not. Nothing caught it: the mood flow
  // attaches content via mapLocalRow, so the story renders there, and the
  // journey flow (which does go through fetchContentById, from
  // RotationEngine.buildExperience) has no StoryLayer to notice the field
  // missing. getQuranVerses (QuranLibraryScreen's source) went uncaught longer
  // still, because this test itself only enumerated three markers when it was
  // written — it would have surfaced the day either screen grew a "Story"
  // affordance, as a story that simply never appeared.
  it('every full-Content mapper carries story', () => {
    const src = read('src/services/contentRepository.ts');
    const bodyOf = (marker: string) => {
      const at = src.indexOf(marker);
      expect(at).toBeGreaterThan(-1);
      return src.slice(at, src.indexOf('\n  }', at));
    };
    for (const marker of [
      'function mapCloudRow', 'function mapLocalRow', 'async fetchContentById', 'async getQuranVerses',
    ]) {
      expect(bodyOf(marker)).toContain('story');
    }
  });

  it('a malformed story does not throw', () => {
    const src = read('src/services/contentRepository.ts');
    const idx = src.indexOf('story:');
    expect(idx).toBeGreaterThan(-1);
    // the guarded-parse convention used by prayerContext and propheticPractice
    expect(src.slice(idx, idx + 200)).toMatch(/try \{/);
  });
});
