import { UserPathProgress } from '../types';

/**
 * Rizq Revolution was cut from 14 days to 7 (SEED_VERSION 57). Progress saved
 * under the 14-day numbering points at different lessons now, and anyone past
 * day 7 has a `currentDay` with no step behind it.
 *
 * The migration is keyed on `startDate`, not on a local flag, so it is
 * idempotent across devices: a migrated row is written back with a fresh
 * `startDate` (>= the cutover), and the server copy carries that, so a second
 * device never remaps rows that are already in the new numbering.
 */
export const RIZQ_PATH_ID = 'path_rizq_revolution';

/** Commit time of the release that shipped the 7-day Rizq (2026-10-04). */
export const RIZQ_7DAY_CUTOVER_MS = 1791103399000;

const NEW_DURATION = 7;

/**
 * Old day -> new day. The seven kept lessons only; the other seven old days
 * (scarcity, barakah, give, paths, gratitude, patience, greed) have no
 * counterpart, so a completion there is dropped rather than credited to the
 * wrong lesson.
 */
const OLD_TO_NEW: Readonly<Record<number, number>> = { 1: 1, 2: 2, 3: 3, 4: 4, 6: 5, 10: 6, 14: 7 };

export function needsRizqMigration(progress: UserPathProgress): boolean {
  return progress.pathId === RIZQ_PATH_ID && progress.startDate < RIZQ_7DAY_CUTOVER_MS;
}

/** Returns the same object when no migration applies; otherwise a remapped copy. */
export function migrateRizqProgress(
  progress: UserPathProgress,
  now: number = Date.now(),
): UserPathProgress {
  if (!needsRizqMigration(progress)) return progress;

  const completedDays = Array.from(
    new Set(
      (progress.completedDays || [])
        .map((d) => OLD_TO_NEW[d])
        .filter((d): d is number => typeof d === 'number'),
    ),
  ).sort((a, b) => a - b);

  let currentDay = 1;
  while (currentDay < NEW_DURATION && completedDays.includes(currentDay)) currentDay++;

  const isCompleted = completedDays.length >= NEW_DURATION;
  return {
    ...progress,
    completedDays,
    currentDay,
    isCompleted,
    completedAt: isCompleted ? progress.completedAt ?? now : undefined,
    startDate: Math.max(now, RIZQ_7DAY_CUTOVER_MS),
  };
}
