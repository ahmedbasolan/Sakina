/**
 * dailyGuidanceContent — rotates the Daily Guidance notification's title,
 * body, and `data.action` so each day nudges users toward a different
 * feature (mood, calendar, journeys, Quran) without adding any new
 * notification categories.
 *
 * The rotation is deterministic (day-of-year modulo) so every user sees the
 * same variant on the same day, and it's predictable for debugging.
 *
 * Smart overrides:
 * - If the user has an active journey → the "continue your path" variant
 *   gets an extra slot in the rotation to be more relevant.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dayOfYear } from '../utils/date';

const ACTIVE_PATH_KEY = '@user_path_progress';

interface DailyGuidanceVariant {
  title: string;
  body: string;
  action: string;
}

/**
 * Base rotation pool — each variant surfaces a different feature.
 * The action string maps to notificationRouter.ts's switch cases.
 */
const BASE_VARIANTS: DailyGuidanceVariant[] = [
  {
    title: 'A Quiet Minute',
    body: 'However today has gone so far, it is worth a minute with it.',
    action: 'daily_guidance',
  },
  {
    title: "Your Heart's Journey",
    body: 'See how your heart has moved this week. Every feeling is a step toward understanding.',
    action: 'mood_calendar',
  },
  {
    title: 'A Verse for Today',
    body: 'Let the Quran speak to where you are right now.',
    action: 'quran_verse',
  },
  {
    title: 'How Is Your Heart?',
    body: 'Take a moment to name what you feel. The Quran has something waiting for you.',
    action: 'daily_guidance',
  },
  {
    title: 'Return to Stillness',
    body: 'Pause. Breathe. Let the remembrance of Allah calm whatever is stirring inside.',
    action: 'daily_guidance',
  },
];

/**
 * Extra variant inserted when the user has an active journey. Replaces one
 * of the generic "daily_guidance" slots to make the rotation more relevant.
 */
const JOURNEY_VARIANT: DailyGuidanceVariant = {
  title: 'Continue Your Path',
  body: 'Your journey is waiting. One small step today keeps the light moving forward.',
  action: 'journey_continue',
};

/**
 * Quick check if the user has any active journey progress stored.
 * Best-effort — returns false on any error so the notification still works.
 */
async function hasActiveJourney(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_PATH_KEY);
    if (!raw) return false;
    const progress = JSON.parse(raw);
    // Considered "active" if they have progress on any path
    return Array.isArray(progress) ? progress.length > 0 : !!progress;
  } catch {
    return false;
  }
}

/**
 * Returns the notification content for today's Daily Guidance reminder.
 * Deterministic based on day-of-year so it's debuggable and consistent.
 */
export async function getDailyGuidanceContent(): Promise<{
  title: string;
  body: string;
  data: { action: string };
}> {
  const pool = [...BASE_VARIANTS];

  // If the user has an active journey, swap in the journey variant
  // at index 2 (replacing the generic "Return to Stillness" slot)
  const hasJourney = await hasActiveJourney();
  if (hasJourney) {
    pool[4] = JOURNEY_VARIANT;
  }

  // Day-of-year modulo for deterministic rotation
  const variant = pool[dayOfYear(new Date()) % pool.length];

  return {
    title: variant.title,
    body: variant.body,
    data: { action: variant.action },
  };
}
