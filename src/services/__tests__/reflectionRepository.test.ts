import {
  ReflectionRepository,
  getFreeformReflections,
  insertFreeformReflection,
  saveBookmarkMarker,
  deleteBookmarkMarker,
} from '../reflectionRepository';

const mockRunAsync = jest.fn((_sql: string, _args?: any[]) => Promise.resolve());
const mockGetFirstAsync = jest.fn((_sql: string, _args?: any[]): Promise<{ id: string } | null> =>
  Promise.resolve(null),
);
const mockGetAllAsync = jest.fn((_sql: string, _args?: any[]): Promise<any[]> =>
  Promise.resolve([]),
);

jest.mock('../../database/connection', () => ({
  dbQuery: jest.fn((op: any) =>
    op({
      runAsync: mockRunAsync,
      getFirstAsync: mockGetFirstAsync,
      getAllAsync: mockGetAllAsync,
    }),
  ),
}));

describe('ReflectionRepository.save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFirstAsync.mockResolvedValue(null);
  });

  it('inserts a new row when no prior written reflection exists for this content+angle', async () => {
    await ReflectionRepository.getInstance().save('c1', 'a1', 'Calm', 'My first reflection');

    expect(mockGetFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("reflection != ''"),
      ['c1', 'a1'],
    );
    expect(mockRunAsync).toHaveBeenCalledTimes(1);
    const [sql, args] = mockRunAsync.mock.calls[0];
    expect(sql).toContain('INSERT INTO saved_reflections');
    expect(args).toEqual([
      expect.stringMatching(/^reflection_/),
      'c1',
      'a1',
      'Calm',
      'My first reflection',
      expect.any(Number),
    ]);
  });

  it('updates the existing written reflection in place instead of inserting a duplicate', async () => {
    mockGetFirstAsync.mockResolvedValue({ id: 'reflection_existing_1' });

    await ReflectionRepository.getInstance().save('c1', 'a1', 'Calm', 'Edited reflection text');

    expect(mockRunAsync).toHaveBeenCalledTimes(1);
    const [sql, args] = mockRunAsync.mock.calls[0];
    expect(sql).toContain('UPDATE saved_reflections');
    expect(args).toEqual(['Edited reflection text', 'Calm', expect.any(Number), 'reflection_existing_1']);
  });

  it('truncates reflection text to 1000 characters before writing', async () => {
    const long = 'x'.repeat(1500);
    await ReflectionRepository.getInstance().save('c1', 'a1', 'Calm', long);

    const [, args] = mockRunAsync.mock.calls[0];
    expect((args?.[4] as string).length).toBe(1000);
  });
});

describe('saveBookmarkMarker / deleteBookmarkMarker (bookmark toggle)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes an empty-reflection row to mark a verse as bookmarked', async () => {
    await saveBookmarkMarker('c1_a1_123', 'c1', 'a1', 'Calm');

    expect(mockRunAsync).toHaveBeenCalledTimes(1);
    const [sql, args] = mockRunAsync.mock.calls[0];
    expect(sql).toContain('INSERT OR REPLACE INTO saved_reflections');
    expect(sql).toContain("VALUES (?, ?, ?, ?, '', ?)");
    expect(args).toEqual(['c1_a1_123', 'c1', 'a1', 'Calm', expect.any(Number)]);
  });

  it('deletes ONLY the empty-reflection marker — a written reflection must survive', async () => {
    await deleteBookmarkMarker('c1', 'a1');

    expect(mockRunAsync).toHaveBeenCalledTimes(1);
    const [sql, args] = mockRunAsync.mock.calls[0];
    expect(sql).toContain('DELETE FROM saved_reflections');
    expect(sql).toContain("reflection = ''");
    expect(args).toEqual(['c1', 'a1']);
  });
});

describe('getFreeformReflections / insertFreeformReflection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads the freeform reflections table newest-first', async () => {
    mockGetAllAsync.mockResolvedValue([
      { id: 'r1', title: 'Morning', content: 'text', mood: 'Calm', createdAt: 5 },
    ]);

    const rows = await getFreeformReflections();

    expect(mockGetAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('FROM reflections ORDER BY createdAt DESC LIMIT ?'),
      [50],
    );
    expect(rows).toEqual([
      { id: 'r1', title: 'Morning', content: 'text', mood: 'Calm', createdAt: 5 },
    ]);
  });

  it('inserts a freeform reflection with a default title and mood nullability', async () => {
    await insertFreeformReflection('r1', '', 'My journal entry');

    expect(mockRunAsync).toHaveBeenCalledTimes(1);
    const [sql, args] = mockRunAsync.mock.calls[0];
    expect(sql).toContain('INSERT INTO reflections');
    expect(args).toEqual(['r1', 'Reflection', 'My journal entry', null, expect.any(Number)]);
  });
});
