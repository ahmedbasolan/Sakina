/**
 * The on-screen promise is "Never sent to Sakina". A women's-variant angle id
 * (`..._f`) in a Supabase request would tell the server what this user chose,
 * so fetchAngleById must not take the cloud fallback for one.
 *
 * WHAT THIS DOES NOT CATCH: other call sites that might send a variant id
 * (e.g. history sync, analytics) -- it pins fetchAngleById only.
 */
const mockFetchAngleById = jest.fn();
const mockGetFirstAsync = jest.fn();

jest.mock('../../database/connection', () => ({
  dbQuery: (fn: (db: unknown) => unknown) => fn({ getFirstAsync: mockGetFirstAsync }),
}));
jest.mock('../supabaseDataService', () => ({
  SupabaseDataService: {
    getInstance: () => ({ fetchAngleById: mockFetchAngleById }),
  },
}));
jest.mock('../errorLoggingService', () => ({ logServiceError: jest.fn() }));

import { ContentRepository } from '../contentRepository';

beforeEach(() => {
  mockFetchAngleById.mockReset();
  mockGetFirstAsync.mockReset();
  mockGetFirstAsync.mockResolvedValue(null);
  mockFetchAngleById.mockResolvedValue(null);
});

it('never asks Supabase for a women\'s-variant angle when the local row is missing', async () => {
  const r = await ContentRepository.getInstance().fetchAngleById('q_angle_imam_day8_f');
  expect(r).toBeNull();
  expect(mockFetchAngleById).not.toHaveBeenCalled();
});

it('still falls back to Supabase for an ordinary angle id', async () => {
  await ContentRepository.getInstance().fetchAngleById('q_angle_imam_day8');
  expect(mockFetchAngleById).toHaveBeenCalledWith('q_angle_imam_day8');
});
