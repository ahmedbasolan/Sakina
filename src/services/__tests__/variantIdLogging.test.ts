const mockLog = jest.fn();
jest.mock('../errorLoggingService', () => ({
  logServiceError: (...a: any[]) => mockLog(...a),
  logDatabaseError: jest.fn(),
}));
// rotationEngine.ts imports these at module scope; none is exercised here.
jest.mock('../../database/connection', () => ({ getDatabase: jest.fn(), dbQuery: jest.fn() }));
jest.mock('../supabaseDataService', () => ({ SupabaseDataService: { getInstance: () => ({}) } }));
jest.mock('../prayerTimesService', () => ({ __esModule: true, default: {} }));

import { RotationEngine } from '../rotationEngine';

it('getGuidanceForStep never reports a women-variant angle id', async () => {
  mockLog.mockClear();
  const engine: any = Object.create(RotationEngine.prototype);
  engine.ensureDb = async () => true;
  engine.contentRepo = { fetchAngleById: async () => null };
  await engine.getGuidanceForStep('quran_2_238', 'q_angle_imam_day8_f');
  expect(mockLog).toHaveBeenCalled();
  expect(JSON.stringify(mockLog.mock.calls)).not.toMatch(/_f\b/);
  expect(JSON.stringify(mockLog.mock.calls)).toMatch(/q_angle_imam_day8/);
});

it('getGuidanceForStep catch path never reports a women-variant angle id', async () => {
  mockLog.mockClear();
  const engine: any = Object.create(RotationEngine.prototype);
  engine.ensureDb = async () => true;
  engine.contentRepo = { fetchAngleById: async () => { throw new Error('db down'); } };
  await engine.getGuidanceForStep('quran_2_238', 'q_angle_imam_day8_f');
  expect(mockLog).toHaveBeenCalled();
  expect(JSON.stringify(mockLog.mock.calls)).not.toMatch(/_f\b/);
  expect(JSON.stringify(mockLog.mock.calls)).toMatch(/q_angle_imam_day8/);
});
