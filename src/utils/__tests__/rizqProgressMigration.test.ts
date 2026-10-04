import {
  migrateRizqProgress,
  needsRizqMigration,
  RIZQ_PATH_ID,
  RIZQ_7DAY_CUTOVER_MS,
} from '../rizqProgressMigration';
import { UserPathProgress } from '../../types';

const old = (completedDays: number[], extra: Partial<UserPathProgress> = {}): UserPathProgress => ({
  pathId: RIZQ_PATH_ID,
  currentDay: Math.max(0, ...completedDays) + 1,
  startDate: RIZQ_7DAY_CUTOVER_MS - 86_400_000,
  completedDays,
  isCompleted: false,
  ...extra,
});

const NOW = RIZQ_7DAY_CUTOVER_MS + 1000;

describe('migrateRizqProgress', () => {
  it('leaves other journeys alone', () => {
    const p = { ...old([1, 2, 6]), pathId: 'path_salah_transformation' };
    expect(migrateRizqProgress(p, NOW)).toBe(p);
  });

  it('leaves a row already in the new numbering alone', () => {
    const p = old([1, 2, 5], { startDate: RIZQ_7DAY_CUTOVER_MS + 5 });
    expect(needsRizqMigration(p)).toBe(false);
    expect(migrateRizqProgress(p, NOW)).toBe(p);
  });

  it('carries the seven kept lessons to their new day numbers', () => {
    const m = migrateRizqProgress(old([1, 2, 3, 4, 6, 10]), NOW);
    expect(m.completedDays).toEqual([1, 2, 3, 4, 5, 6]);
    expect(m.currentDay).toBe(7);
  });

  it('drops completions on lessons that no longer exist', () => {
    const m = migrateRizqProgress(old([5, 7, 8, 9, 11, 12, 13]), NOW);
    expect(m.completedDays).toEqual([]);
    expect(m.currentDay).toBe(1);
  });

  it('puts currentDay on the first lesson not yet done, never past day 7', () => {
    expect(migrateRizqProgress(old([1, 3]), NOW).currentDay).toBe(2);
    // old days 1-13 carry over as new days 1-6 (old 14 is the only route to new 7)
    expect(migrateRizqProgress(old([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]), NOW).currentDay).toBe(7);
  });

  it('a finished old journey stays finished, with its completion time', () => {
    const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    const m = migrateRizqProgress(old(all, { isCompleted: true, completedAt: 123 }), NOW);
    expect(m.completedDays).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(m.isCompleted).toBe(true);
    expect(m.completedAt).toBe(123);
    expect(m.currentDay).toBe(7);
  });

  it('is idempotent: the migrated row is not migrated again', () => {
    const once = migrateRizqProgress(old([1, 6, 10]), NOW);
    expect(needsRizqMigration(once)).toBe(false);
    expect(migrateRizqProgress(once, NOW + 5000)).toBe(once);
  });

  it('survives a missing completedDays', () => {
    const p = { ...old([]), completedDays: undefined as unknown as number[] };
    expect(migrateRizqProgress(p, NOW).completedDays).toEqual([]);
  });
});
