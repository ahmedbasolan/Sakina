import { PathStep, SpiritualPath } from '../types';

/**
 * Prayer Leadership asks "Who is leading?" because a woman leading women differs
 * from a man leading on a few sourced points (spec 2026-10-11). The answer lives
 * in kv_store on the device only — never synced, never a Supabase column — and
 * clearAllLocalUserData deletes it.
 */
export type LeaderChoice = 'man' | 'woman';

/** Letters and underscores only: verify-local-wipe reads keys with '([a-z_]+)'. */
export const LEADER_CHOICE_KEY = 'prayer_leadership_leader';
export const LEADER_CHOICE_PATH_ID = 'path_prayer_leadership';

/** Returns the step unchanged (same object) unless a woman-leading variant applies. */
export function resolveStep(step: PathStep, choice: LeaderChoice | null): PathStep {
  const v = choice === 'woman' ? step.variants?.womanLeading : undefined;
  if (!v) return step;
  return {
    ...step,
    angleId: v.angleId,
    hadithContentId: v.hadithContentId ?? step.hadithContentId,
    title: v.title ?? step.title,
    focus: v.focus ?? step.focus,
  };
}

/** Returns the path unchanged (same object) unless it asks the question and the answer is "woman". */
export function resolvePath(path: SpiritualPath, choice: LeaderChoice | null): SpiritualPath {
  if (!path.leaderChoice || choice !== 'woman') return path;
  return { ...path, dailySteps: path.dailySteps.map((s) => resolveStep(s, choice)) };
}

/**
 * Error reports go to PostHog (message + context). A women's-variant id would
 * tell PostHog what this user chose, so log the shared id instead.
 */
export function redactVariantId(id: string): string {
  return id.endsWith('_f') ? id.slice(0, -2) : id;
}
