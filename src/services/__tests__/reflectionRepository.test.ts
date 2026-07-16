import { ReflectionRepository } from '../reflectionRepository';

const mockRunAsync = jest.fn((_sql: string, _args?: any[]) => Promise.resolve());
const mockGetFirstAsync = jest.fn((_sql: string, _args?: any[]): Promise<{ id: string } | null> =>
  Promise.resolve(null),
);

jest.mock('../../database/schema', () => ({
  dbQuery: jest.fn((op: any) =>
    op({
      runAsync: mockRunAsync,
      getFirstAsync: mockGetFirstAsync,
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
