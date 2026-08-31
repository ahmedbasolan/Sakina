/**
 * Schema guards for the `content` table.
 *
 * Two failure modes live here, and neither is visible to a typecheck:
 *
 *   1. The two `content` DDLs drifting. `tables.ts` builds the table on a
 *      fresh install; `operations.ts` rebuilds it when CURRENT_DB_VERSION is
 *      bumped. A column added to one and not the other means upgraded devices
 *      and new devices disagree about what the table is.
 *   2. An INSERT column list drifting from its placeholder count. The seeder's
 *      batchInsert takes a `columnsPerRow` argument; if the list grows and the
 *      count does not, every row silently shifts by one column.
 *
 * WHAT THIS DOES NOT CATCH: whether a column is actually READ back anywhere
 * (that is contentStory.test.ts), and whether Supabase's schema agrees — the
 * cloud path is a separate migration and a missing column there returns
 * undefined rather than erroring.
 */
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..', '..', '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

/** Pull the column lines out of a `CREATE TABLE ... content (...)` block. */
function contentColumns(src: string): string[] {
  const start = src.indexOf('CREATE TABLE IF NOT EXISTS content (');
  if (start === -1) throw new Error('no content DDL found');
  const end = src.indexOf(');', start);
  return src
    .slice(src.indexOf('(', start) + 1, end)
    .split('\n')
    .map((l) => l.trim().replace(/,$/, ''))
    .filter(Boolean);
}

describe('content table schema', () => {
  const fresh = contentColumns(read('src/database/tables.ts'));
  const refresh = contentColumns(read('src/database/operations.ts'));

  it('declares the same columns in both DDLs', () => {
    expect(refresh).toEqual(fresh);
  });

  it('has a story column', () => {
    expect(fresh).toContain('story TEXT');
  });

  it('bumps CURRENT_DB_VERSION so existing installs recreate the table', () => {
    const m = read('src/database/operations.ts').match(/CURRENT_DB_VERSION = (\d+)/);
    expect(Number(m?.[1])).toBeGreaterThanOrEqual(12);
  });
});

describe('content INSERT sites stay positional-consistent', () => {
  const sites = [
    ['src/database/seedContent.ts', 2],
    ['src/services/guidanceWindowFetch.ts', 1],
  ] as const;

  it('every INSERT INTO content column list matches its placeholder count', () => {
    for (const [file, expectedCount] of sites) {
      const src = read(file);
      const blocks = [...src.matchAll(/INSERT OR REPLACE INTO content\s*\n?\s*\(([^)]+)\)/g)];
      expect(blocks).toHaveLength(expectedCount);

      for (const b of blocks) {
        const columns = b[1].split(',').map((c) => c.trim()).filter(Boolean);
        expect(columns).toContain('story');

        const after = src.slice(b.index! + b[0].length, b.index! + b[0].length + 400);
        const literal = after.match(/VALUES \(([?,\s]+)\)/);
        const perRow = after.match(/VALUES `,\s*\n\s*(\d+),/);

        if (literal) {
          expect(literal[1].split(',').length).toBe(columns.length);
        } else if (perRow) {
          expect(Number(perRow[1])).toBe(columns.length);
        } else {
          throw new Error(`no placeholder count found after INSERT in ${file}`);
        }
      }
    }
  });
});
