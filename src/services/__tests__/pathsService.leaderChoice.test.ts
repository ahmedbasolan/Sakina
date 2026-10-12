const mockKv = new Map<string, string>();
jest.mock('../../database/connection', () => ({
  dbQuery: jest.fn((op: any) =>
    op({
      getFirstAsync: jest.fn(async (_sql: string, [key]: [string]) =>
        mockKv.has(key) ? { value: mockKv.get(key) } : null),
      runAsync: jest.fn(async (_sql: string, [key, value]: [string, string]) => {
        mockKv.set(key, value);
      }),
    }),
  ),
}));
const mockProgress = { pathId: 'path_prayer_leadership', currentDay: 10, startDate: 1, completedDays: [1,2,3,4,5,6,7,8,9], isCompleted: false };
jest.mock('../supabaseDataService', () => ({
  SupabaseDataService: {
    getInstance: () => ({
      getPathProgress: jest.fn(async () => mockProgress),
      getAllPathProgress: jest.fn(async () => [mockProgress]),
      recordPathProgress: jest.fn(async () => undefined),
    }),
  },
}));

import { PathsService } from '../pathsService';
import { STATIC_SPIRITUAL_PATHS } from '../../data/staticPaths';

const ID = 'path_prayer_leadership';
const service = PathsService.getInstance();
const staticPath = () => STATIC_SPIRITUAL_PATHS.find((p) => p.id === ID)!;

beforeEach(async () => {
  mockKv.clear();
  await service.refreshLeaderChoice();
});

it('returns the static path untouched before any choice', () => {
  expect(service.getLeaderChoice(ID)).toBeNull();
  expect(service.getPathById(ID)).toBe(staticPath());
});

it('setLeaderChoice stores the value under the kv key and resolves steps', async () => {
  await service.setLeaderChoice(ID, 'woman');
  expect(mockKv.get('prayer_leadership_leader')).toBe('woman');
  const day8 = service.getPathById(ID)!.dailySteps.find((s) => s.day === 8)!;
  const v = staticPath().dailySteps.find((s) => s.day === 8)!.variants?.womanLeading;
  expect(day8.angleId).toBe(v ? v.angleId : 'q_angle_imam_day8');
});

it('getAllProgress hydrates the choice from kv', async () => {
  mockKv.set('prayer_leadership_leader', 'woman');
  await service.getAllProgress();
  expect(service.getLeaderChoice(ID)).toBe('woman');
});

it('re-reads after the row is deleted (account wipe)', async () => {
  await service.setLeaderChoice(ID, 'woman');
  mockKv.delete('prayer_leadership_leader');
  await service.loadProgress(ID);
  expect(service.getLeaderChoice(ID)).toBeNull();
  expect(service.getPathById(ID)).toBe(staticPath());
});

it('ignores an unknown stored value', async () => {
  mockKv.set('prayer_leadership_leader', 'other');
  await service.loadProgress(ID);
  expect(service.getLeaderChoice(ID)).toBeNull();
});

it('resolution does not touch progress', async () => {
  await service.setLeaderChoice(ID, 'woman');
  const p = await service.loadProgress(ID);
  expect(p!.completedDays).toEqual([1,2,3,4,5,6,7,8,9]);
  expect(service.getCompletedSteps(ID, p!)).toHaveLength(9);
  expect(service.getCurrentStep(ID, p!)!.day).toBe(10);
});

it('other journeys are returned as the same objects', async () => {
  await service.setLeaderChoice(ID, 'woman');
  const rizq = STATIC_SPIRITUAL_PATHS.find((p) => p.id === 'path_rizq_revolution')!;
  expect(service.getPathById('path_rizq_revolution')).toBe(rizq);
});
