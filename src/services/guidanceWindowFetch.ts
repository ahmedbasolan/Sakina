/**
 * fetchWindowGuidance — the single window-gated guidance fetch used by every
 * screen that can deliver a mood's FIRST verse of a prayer window (Home's mood
 * grid, MoodSelectionScreen, and GuidanceScreen's own fallback fetch). Free
 * users get one fresh verse per mood per window; re-entry within that window
 * must return the cached verse rather than minting a new one, or it silently
 * bypasses the freemium refresh budget (spec §3.2). Kept as a single function
 * so that guarantee can't drift between call sites.
 */
import { Mood, GuidanceExperience } from '../types';
import { RotationEngine } from './rotationEngine';
import { FreemiumService } from './freemiumService';
import { getCachedGuidance, setCachedGuidance } from './windowGuidanceCache';

export async function fetchWindowGuidance(
  rotationEngine: RotationEngine,
  moodId: Mood,
): Promise<GuidanceExperience | null> {
  const freemium = FreemiumService.getInstance();
  await freemium.syncPrayerWindow();
  const windowKey = freemium.getSessionInfo()?.windowKey;
  const gated = !freemium.isPremium() && !!windowKey;

  if (gated) {
    const cached = await getCachedGuidance(windowKey!, moodId);
    if (cached) return cached;
  }
  const experience = await rotationEngine.getGuidance(moodId);
  if (experience && gated) {
    await setCachedGuidance(windowKey!, moodId, experience);
  }
  return experience;
}
