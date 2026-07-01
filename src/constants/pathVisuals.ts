/**
 * Authoritative icon + accent-color registry for every sacred journey path.
 *
 * Single source of truth — import `getPathVisual` wherever a path needs a
 * visual identity (PathsScreen card, PathDetailScreen hero, etc.).
 *
 * Rules:
 *  - One entry per real path ID (must match staticPaths.ts `id` field exactly).
 *  - No entries for paths that don't exist in staticPaths.ts (ghost entries
 *    break nothing but create confusion and resist cleanup).
 *  - Colors must be visually distinct at a glance; avoid duplicating the same
 *    hue across paths that might appear together in the list.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';

type MCIcon = keyof typeof MaterialCommunityIcons.glyphMap;

interface PathVisual {
  icon: MCIcon;
  /** Hex accent color — used for icon tints, borders, progress, glow wash. */
  color: string;
}

const PATH_VISUALS: Record<string, PathVisual> = {
  // ── Spiritual practice ──────────────────────────────────────────────
  path_salah_transformation:     { icon: 'hands-pray',               color: '#10B981' }, // emerald
  path_quran_connection:         { icon: 'book-open-variant',         color: '#D4AF37' }, // gold
  path_prayer_leadership:        { icon: 'account-voice',             color: '#60A5FA' }, // blue
  path_death_awareness:          { icon: 'leaf-circle-outline',       color: '#6EE7B7' }, // mint

  // ── Tawbah & inner healing ──────────────────────────────────────────
  path_tawbah_intensive:         { icon: 'door-open',                 color: '#FCA5A5' }, // rose
  path_depression_iman:          { icon: 'sprout',                    color: '#818CF8' }, // indigo
  path_grief_loss:               { icon: 'candle',                    color: '#94A3B8' }, // slate
  path_hope_after_crisis:        { icon: 'weather-sunny',             color: '#FCD34D' }, // amber

  // ── Dunya & livelihood ──────────────────────────────────────────────
  path_rizq_revolution:          { icon: 'barley',                    color: '#D4AF37' }, // gold
  path_career_choice:            { icon: 'briefcase-outline',         color: '#22D3EE' }, // cyan
  path_leaving_haram_job:        { icon: 'briefcase-remove-outline',  color: '#E879F9' }, // fuchsia
  path_screen_detox:             { icon: 'cellphone-off',             color: '#34D399' }, // green

  // ── Relationships & family ──────────────────────────────────────────
  path_marriage_seeker:          { icon: 'ring',                      color: '#F87171' }, // red
  path_wrong_marriage:           { icon: 'handshake',                 color: '#A78BFA' }, // violet
  path_forced_marriage:          { icon: 'shield-alert-outline',      color: '#FDA4AF' }, // light rose
  path_haram_relationships_exit: { icon: 'heart-off-outline',         color: '#F472B6' }, // pink
  path_parent_healing:           { icon: 'home-heart',                color: '#F9A8D4' }, // soft pink
  path_two_worlds:               { icon: 'earth',                     color: '#7DD3FC' }, // sky

  // ── Study & exam ───────────────────────────────────────────────────
  path_study_journaling:         { icon: 'notebook-edit-outline',     color: '#67E8F9' }, // cyan
  path_trusting_the_results:     { icon: 'scale-balance',             color: '#FDE68A' }, // amber

  // ── Long recovery journeys (Tier 3) ────────────────────────────────
  path_addiction_recovery:       { icon: 'heart-broken',              color: '#FB923C' }, // orange
  path_breaking_free_90:         { icon: 'lock-open-variant',         color: '#86EFAC' }, // light green
  path_ramadan_reset:            { icon: 'star-crescent',             color: '#C084FC' }, // purple
};

/** Returns the visual for a path, falling back to a neutral compass if unregistered. */
export const getPathVisual = (pathId: string): PathVisual =>
  PATH_VISUALS[pathId] ?? { icon: 'compass-outline', color: '#D4AF37' };

export default PATH_VISUALS;
