/**
 * claimLocalDataForUser — the guard that decides whether on-device rows may be
 * uploaded under the account that just signed in.
 *
 * Regression: signing out of account A and into account B on the same device
 * used to upload A's leftover history and journey progress under B's user_id.
 * `hasClaimedLocalData` in AuthContext is a ref that resets on app restart, and
 * the sign-in path called migrateGuestDataToSupabase() unconditionally, which
 * sweeps every local row regardless of who wrote it.
 *
 * The load-bearing assertion in the foreign-data cases is not "the wipe ran" —
 * it is that NOTHING was uploaded. A wipe that happens after an upload still
 * leaks.
 */

interface HistoryRow {
  contentId: string;
  angleId: string;
  mood: string;
  timestamp: number;
  pending_sync: number;
}

let historyRows: HistoryRow[] = [];
let pathProgressRows: any[] = [];
let kvStore: Record<string, string> = {};
let mockCurrentUserId: string | null = null;

/** Every Supabase write attempted, as `${table}.${method}`. */
let mockSupabaseWrites: string[] = [];

const mockClearAllLocalUserData = jest.fn(async () => {
  historyRows = [];
  pathProgressRows = [];
  delete kvStore['local_data_owner'];
  delete kvStore['quran_reading_progress'];
});

const mockGetFirstAsync = jest.fn((sql: string, args?: any[]) => {
  if (sql.includes('FROM kv_store')) {
    const value = kvStore[args?.[0]];
    return Promise.resolve(value !== undefined ? { value } : null);
  }
  // Both origin probes: pending_sync = 1 (written while signed in) and
  // pending_sync = 0 (guest rows still awaiting migration).
  const probe = sql.match(/FROM user_history WHERE pending_sync = ([01])/);
  if (probe) {
    const want = Number(probe[1]);
    return Promise.resolve(historyRows.some((r) => r.pending_sync === want) ? { n: 1 } : null);
  }
  return Promise.resolve(null);
});

const mockGetAllAsync = jest.fn((sql: string) => {
  if (sql.includes('FROM user_history')) {
    const rows = sql.includes('pending_sync = 1')
      ? historyRows.filter((r) => r.pending_sync === 1)
      : historyRows;
    return Promise.resolve(rows.map((r, i) => ({ id: `h${i}`, ...r })));
  }
  if (sql.includes('FROM user_path_progress')) return Promise.resolve(pathProgressRows);
  return Promise.resolve([]);
});

const mockRunAsync = jest.fn((sql: string, args?: any[]) => {
  if (sql.includes('INSERT OR REPLACE INTO kv_store')) kvStore[args![0]] = args![1];
  return Promise.resolve();
});

const mockExecAsync = jest.fn((sql: string) => {
  if (sql.includes('DELETE FROM user_history')) historyRows = [];
  return Promise.resolve();
});

jest.mock('../../database/schema', () => ({
  dbQuery: jest.fn((op: any) =>
    op({
      getFirstAsync: mockGetFirstAsync,
      getAllAsync: mockGetAllAsync,
      runAsync: mockRunAsync,
      execAsync: mockExecAsync,
      withTransactionAsync: jest.fn((fn: () => Promise<void>) => fn()),
    }),
  ),
  clearAllLocalUserData: (...a: any[]) => mockClearAllLocalUserData(...(a as [])),
  LOCAL_DATA_OWNER_KEY: 'local_data_owner',
}));

jest.mock('../../config/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: mockCurrentUserId ? { user: { id: mockCurrentUserId } } : null } }),
    },
    from: (table: string) => {
      const record = (method: string) => {
        mockSupabaseWrites.push(`${table}.${method}`);
        return Promise.resolve({ data: [], error: null });
      };
      const chain: any = {
        upsert: () => record('upsert'),
        insert: () => record('insert'),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      };
      return chain;
    },
  },
}));

import { SupabaseDataService } from '../supabaseDataService';

const service = () => SupabaseDataService.getInstance();

beforeEach(() => {
  jest.clearAllMocks();
  historyRows = [];
  pathProgressRows = [];
  kvStore = {};
  mockSupabaseWrites = [];
  mockCurrentUserId = null;
});

const guestHistory = (): HistoryRow => ({
  contentId: 'quran_2_286',
  angleId: 'q_angle_2_286_tired',
  mood: 'Tired',
  timestamp: 1,
  pending_sync: 0,
});

const offlineSignedInHistory = (): HistoryRow => ({ ...guestHistory(), pending_sync: 1 });

describe('claimLocalDataForUser', () => {
  it('migrates genuine guest data on first sign-in and stamps the owner', async () => {
    mockCurrentUserId = 'user-A';
    historyRows = [guestHistory()];

    const result = await service().claimLocalDataForUser('user-A');

    expect(result.wipedForeignData).toBe(false);
    expect(result.migratedCount).toBe(1);
    expect(mockSupabaseWrites).toContain('user_history.upsert');
    expect(mockClearAllLocalUserData).not.toHaveBeenCalled();
    expect(kvStore['local_data_owner']).toBe('user-A');
  });

  it('does not re-migrate when the same user signs back in', async () => {
    mockCurrentUserId = 'user-A';
    kvStore['local_data_owner'] = 'user-A';
    historyRows = [offlineSignedInHistory()];

    const result = await service().claimLocalDataForUser('user-A');

    expect(result.wipedForeignData).toBe(false);
    expect(result.migratedCount).toBe(0);
    expect(mockClearAllLocalUserData).not.toHaveBeenCalled();
    // Their own queued rows still reach their own account.
    expect(mockSupabaseWrites).toContain('user_history.insert');
    expect(kvStore['local_data_owner']).toBe('user-A');
  });

  it('wipes instead of uploading when the data belongs to another account', async () => {
    mockCurrentUserId = 'user-B';
    kvStore['local_data_owner'] = 'user-A';
    historyRows = [offlineSignedInHistory()];
    pathProgressRows = [{ pathId: 'path_rizq_revolution', currentDay: 4, startDate: 1, completedDays: '[1,2,3]' }];

    const result = await service().claimLocalDataForUser('user-B');

    expect(result.wipedForeignData).toBe(true);
    expect(result.migratedCount).toBe(0);
    expect(mockClearAllLocalUserData).toHaveBeenCalled();
    // The whole point: user-A's rows never reach user-B's account.
    expect(mockSupabaseWrites).toEqual([]);
    expect(kvStore['local_data_owner']).toBe('user-B');
  });

  it('wipes pre-marker data that provably came from some signed-in session', async () => {
    mockCurrentUserId = 'user-B';
    // No owner marker at all — an install predating it. pending_sync = 1 is
    // only ever written for a logged-in user, so these are not guest rows.
    historyRows = [offlineSignedInHistory()];

    const result = await service().claimLocalDataForUser('user-B');

    expect(result.wipedForeignData).toBe(true);
    expect(mockClearAllLocalUserData).toHaveBeenCalled();
    expect(mockSupabaseWrites).toEqual([]);
    expect(kvStore['local_data_owner']).toBe('user-B');
  });

  it('still migrates pre-marker data that looks like genuine guest use', async () => {
    mockCurrentUserId = 'user-B';
    historyRows = [guestHistory()]; // pending_sync = 0, no marker

    const result = await service().claimLocalDataForUser('user-B');

    expect(result.wipedForeignData).toBe(false);
    expect(result.migratedCount).toBe(1);
    expect(mockClearAllLocalUserData).not.toHaveBeenCalled();
    expect(mockSupabaseWrites).toContain('user_history.upsert');
  });
});

describe('syncPendingHistory ownership gate', () => {
  // Closes the race between a SIGNED_IN transition and the claim finishing:
  // recordHistory calls syncPendingHistory on every successful write.
  it('refuses to upload pending rows owned by a different account', async () => {
    mockCurrentUserId = 'user-B';
    kvStore['local_data_owner'] = 'user-A';
    historyRows = [offlineSignedInHistory()];

    await service().syncPendingHistory();

    expect(mockSupabaseWrites).toEqual([]);
  });

  it('refuses to upload pre-marker pending rows of unknown origin', async () => {
    mockCurrentUserId = 'user-B';
    historyRows = [offlineSignedInHistory()]; // no owner marker at all

    await service().syncPendingHistory();

    expect(mockSupabaseWrites).toEqual([]);
  });

  it('uploads pending rows to their own owner', async () => {
    mockCurrentUserId = 'user-A';
    kvStore['local_data_owner'] = 'user-A';
    historyRows = [offlineSignedInHistory()];

    await service().syncPendingHistory();

    expect(mockSupabaseWrites).toContain('user_history.insert');
  });
});

describe('ensureLocalDataOwnerStamp', () => {
  it('stamps a pre-marker install that has nothing awaiting migration', async () => {
    mockCurrentUserId = 'user-A';
    historyRows = [offlineSignedInHistory()];

    await service().ensureLocalDataOwnerStamp('user-A');

    expect(kvStore['local_data_owner']).toBe('user-A');
  });

  it('leaves unmigrated guest rows unclaimed so they can still migrate', async () => {
    mockCurrentUserId = 'user-A';
    historyRows = [guestHistory()]; // pending_sync = 0 — awaiting migration

    await service().ensureLocalDataOwnerStamp('user-A');

    expect(kvStore['local_data_owner']).toBeUndefined();
  });

  it('never overwrites an existing owner', async () => {
    mockCurrentUserId = 'user-B';
    kvStore['local_data_owner'] = 'user-A';

    await service().ensureLocalDataOwnerStamp('user-B');

    expect(kvStore['local_data_owner']).toBe('user-A');
  });
});
