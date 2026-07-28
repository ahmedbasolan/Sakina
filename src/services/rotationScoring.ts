/**
 * Selection scoring for RotationEngine, kept in its own leaf module.
 *
 * It lives here rather than inside rotationEngine.ts because importing that
 * file pulls the whole data stack — seedContent, AsyncStorage, Supabase — so a
 * unit test of the arithmetic could not run without a native module. The maths
 * is pure and is the part that degrades silently, so it is the part that most
 * needs a test.
 */
import type { ContentAngle, PrayerContext } from '../types';

/**
 * Weight added when a verse is tagged for the prayer window the user is in.
 *
 * This was 50. Every angle's relevanceScore is 10 — `moodScores` is never set
 * on any content entry, so the seeder's `?? 10` default applies to all of them
 * — which made a tagged verse score 60 against everyone else's 10.
 *
 * Only three verses carry prayerContext at all, two of them Hopeful/fajr_pre.
 * Hopeful's pool is 24 angles, so topN is max(5, ceil(24 * 0.2)) = 5: those two
 * always took two of the five slots, and weighted selection gave them
 * 120/150 = 80% of picks. A user checking in at Fajr saw the same two verses
 * almost every morning.
 *
 * At +5 they score 15 against 10 — still favoured, 30/60 = 50% rather than 80%,
 * and the rest of the pool stays reachable. Revisit this if relevanceScore ever
 * stops being uniformly 10, since the whole calculation above depends on that.
 */
export const PRAYER_CONTEXT_BOOST = 5;

export function scoreAngle(
  angle: ContentAngle,
  history: Map<string, number>,
  prayerContext: PrayerContext,
  now: number = Date.now(),
): number {
  let score = (angle as { relevanceScore?: number }).relevanceScore ?? 10;

  // Recency penalty — soft rotation
  const lastShown = history.get(`${angle.contentId}-${angle.id}`);
  if (lastShown) {
    const days = (now - lastShown) / 86_400_000;
    if (days < 1) score -= 15;
    else if (days < 3) score -= 10;
    else if (days < 7) score -= 5;
  }

  if (angle.content?.prayerContext?.includes(prayerContext)) {
    score += PRAYER_CONTEXT_BOOST;
  }

  return Math.max(1, score);
}
