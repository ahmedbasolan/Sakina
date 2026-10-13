/**
 * Journey availability — the ONE place that says which journeys can be
 * started, when each reached users, and who may start it.
 *
 * `released` is the day the journey reached Pro users: the release day of the
 * build that carries it, not the day it was authored. The free date for an
 * 'early_access' journey is COMPUTED from it (src/utils/journeyAccess.ts) and
 * never written by hand. Trusting the Results carried a hand-written
 * "Free tier · 2 weeks" label from 2026-07-01 until 2026-10-13 because
 * nothing expired it; a computed date cannot go stale that way.
 *
 * Access kinds:
 *  - 'early_access'  default for every NEW journey. Pro-only for
 *                    EARLY_ACCESS_DAYS after `released`, then free.
 *  - 'pro_exclusive' Pro-only with no free date. Owner decision per journey.
 *  - 'free'          never gated. REQUIRED for crisis/distress journeys: a
 *                    person in crisis must not meet a paywall.
 *
 * Every journey shipped before this module existed is older than
 * EARLY_ACCESS_DAYS, so 'early_access' on them is already free.
 *
 * scripts/verify-journey-claims.mjs reads the keys of AVAILABLE_PATHS from
 * this file with a regex: keep one entry per line, keyed by bare `path_…` ids.
 */

export type JourneyAccessKind = 'early_access' | 'pro_exclusive' | 'free';

export interface JourneyRelease {
  /** YYYY-MM-DD, local calendar day the journey reached Pro users. */
  released: string;
  access: JourneyAccessKind;
}

export const EARLY_ACCESS_DAYS = 30;

export const AVAILABLE_PATHS: Record<string, JourneyRelease> = {
  path_rizq_revolution:      { released: '2026-06-27', access: 'early_access' },
  path_salah_transformation: { released: '2026-06-27', access: 'early_access' },
  path_study_journaling:     { released: '2026-07-01', access: 'early_access' },
  path_trusting_the_results: { released: '2026-07-01', access: 'early_access' },
  path_prayer_leadership:    { released: '2026-08-01', access: 'early_access' },
  path_hope_after_crisis:    { released: '2026-08-15', access: 'free' },
  path_marriage_seeker:      { released: '2026-08-18', access: 'pro_exclusive' },
  path_tawbah_intensive:     { released: '2026-08-29', access: 'early_access' },
  path_death_awareness:      { released: '2026-08-30', access: 'pro_exclusive' },
  path_screen_detox:         { released: '2026-09-09', access: 'early_access' },
};

export const AVAILABLE_PATH_IDS = new Set(Object.keys(AVAILABLE_PATHS));
