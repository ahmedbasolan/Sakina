/**
 * Which Journeys may show their name on the Home Screen widget.
 *
 * A Home Screen is seen by family, friends and colleagues. A Journey listed
 * as sensitive never puts its title or any of its day titles on the widget,
 * which then says "Your Journey" (spec: docs/superpowers/specs/
 * 2026-11-11-square-widget-design.md, "Sensitive Journeys"; list accepted by
 * Ahmed 2026-11-11).
 *
 * THE DEFAULT IS SENSITIVE. `isNamedOnWidget` is an allowlist lookup, so a
 * Journey that appears in neither set stays unnamed. Every new Journey must
 * still be added to exactly one of the two sets: journeyPrivacy.test.ts fails
 * until it is, so the choice is made on purpose and not by omission.
 *
 * This is about the widget only. It gates nothing inside the app.
 */

export const WIDGET_NAMED_PATH_IDS: ReadonlySet<string> = new Set([
  'path_rizq_revolution',
  'path_salah_transformation',
  'path_study_journaling',
  'path_trusting_the_results',
  'path_prayer_leadership',
  'path_screen_detox',
  'path_two_worlds',
  'path_quran_connection',
  'path_career_choice',
  'path_ramadan_reset',
]);

export const WIDGET_SENSITIVE_PATH_IDS: ReadonlySet<string> = new Set([
  'path_hope_after_crisis',
  'path_tawbah_intensive',
  'path_marriage_seeker',
  'path_death_awareness',
  'path_addiction_recovery',
  'path_breaking_free_90',
  'path_parent_healing',
  'path_wrong_marriage',
  'path_forced_marriage',
  'path_haram_relationships_exit',
  'path_leaving_haram_job',
  'path_depression_iman',
  'path_grief_loss',
]);

/** True only for a Journey explicitly listed as safe to name. */
export function isNamedOnWidget(pathId: string): boolean {
  return WIDGET_NAMED_PATH_IDS.has(pathId);
}
