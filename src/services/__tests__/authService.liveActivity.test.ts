/**
 * The Live Activity registration belongs to the account that created it, so
 * deleting the account and signing out must both remove it from the device
 * (and ask the server to stop pushing) — and neither may ever be blocked or
 * failed by that cleanup.
 */

jest.mock('expo-apple-authentication', () => ({}));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-auth-session', () => ({ makeRedirectUri: jest.fn(() => 'sakina://') }));
jest.mock('expo-auth-session/build/QueryParams', () => ({}));

const calls: string[] = [];

const mockSignOut = jest.fn();
const mockInvoke = jest.fn();
const mockGetSession = jest.fn();
jest.mock('../../config/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: (...a: unknown[]) => mockGetSession(...a),
      signOut: (...a: unknown[]) => mockSignOut(...a),
    },
    functions: { invoke: (...a: unknown[]) => mockInvoke(...a) },
  },
}));

const mockClearAll = jest.fn();
jest.mock('../../database/operations', () => ({
  clearAllLocalUserData: (...a: unknown[]) => mockClearAll(...a),
}));

const mockDisableAndForget = jest.fn();
jest.mock('../liveActivity/liveActivityService', () => ({
  LiveActivityService: { getInstance: () => ({ disableAndForget: () => mockDisableAndForget() }) },
}));

jest.mock('../errorLoggingService', () => ({ logServiceError: jest.fn() }));

import { AuthService, ACCOUNT_DELETED_BUT_LOCAL_WIPE_FAILED } from '../authService';

const auth = AuthService.getInstance();

beforeEach(() => {
  jest.clearAllMocks();
  calls.length = 0;
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
  mockInvoke.mockResolvedValue({ error: null });
  mockSignOut.mockImplementation(async () => {
    calls.push('signOut');
    return { error: null };
  });
  mockClearAll.mockImplementation(async () => {
    calls.push('clearAllLocalUserData');
  });
  mockDisableAndForget.mockImplementation(async () => {
    calls.push('disableAndForget');
  });
});

describe('deleteAccount', () => {
  it('removes the live activity before wiping local data, and before the session is dropped', async () => {
    await auth.deleteAccount();

    expect(calls).toEqual(['disableAndForget', 'clearAllLocalUserData', 'signOut']);
  });

  it('is not failed by a throwing live-activity cleanup', async () => {
    mockDisableAndForget.mockRejectedValue(new Error('native bridge gone'));

    await expect(auth.deleteAccount()).resolves.toBeUndefined();

    expect(mockClearAll).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('is not blocked by a live-activity cleanup that never settles', async () => {
    jest.useFakeTimers();
    try {
      mockDisableAndForget.mockReturnValue(new Promise(() => {}));

      const done = auth.deleteAccount();
      await jest.advanceTimersByTimeAsync(10_000);

      await expect(done).resolves.toBeUndefined();
      expect(mockClearAll).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not touch the device when the server delete failed', async () => {
    mockInvoke.mockResolvedValue({ error: { message: 'nope' } });

    await expect(auth.deleteAccount()).rejects.toThrow('Account deletion failed: nope');

    expect(mockDisableAndForget).not.toHaveBeenCalled();
    expect(mockClearAll).not.toHaveBeenCalled();
  });

  it('still reports a failed local wipe after the live activity was removed', async () => {
    mockClearAll.mockRejectedValue(new Error('disk'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(auth.deleteAccount()).rejects.toThrow(ACCOUNT_DELETED_BUT_LOCAL_WIPE_FAILED);

    expect(mockDisableAndForget).toHaveBeenCalledTimes(1);
  });
});

describe('signOut', () => {
  it('removes the live activity while the session can still authorise the unregister', async () => {
    await auth.signOut();

    expect(calls).toEqual(['disableAndForget', 'signOut']);
  });

  it('still signs out when the live-activity cleanup throws', async () => {
    mockDisableAndForget.mockRejectedValue(new Error('boom'));

    await expect(auth.signOut()).resolves.toBeUndefined();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
