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
import { getCachedSurah, fetchAndCacheSurah } from './quranService';
import { logServiceError } from './errorLoggingService';

export async function fetchWindowGuidance(
  rotationEngine: RotationEngine,
  moodId: Mood,
): Promise<GuidanceExperience | null> {
  const freemium = FreemiumService.getInstance();
  // syncPrayerWindow() silently no-ops until SessionService has loaded
  // currentSession (see SessionService.syncWindow's `if (!this.currentSession)
  // return`), which otherwise left windowKey undefined whenever this ran
  // before ServicesProvider's init finished — gating false, cache write
  // skipped, and the fetched content silently thrown away. Most visible when
  // called early (e.g. onboarding's prefetch), which is exactly when this
  // guarantee matters most. waitForInitialization() is a no-op once init has
  // already completed, so this is free on the hot path (Home's own taps).
  await freemium.waitForInitialization();
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

// The Friday-light hadith names the full surah, but the concrete, narrated
// *minimum* is the first ten verses — Sahih Muslim: "whoever memorizes the
// first ten verses of Surah al-Kahf will be protected from the Dajjal."
const KAHF_MIN_VERSES = 10;

/**
 * Builds a GuidanceExperience per verse for Surah Al-Kahf's first ten ayat, so
 * Friday's spiritual window opens in the same immersive Guidance screen as
 * every other window (gold verse card, Context layer) instead of dropping
 * into the plain Quran library reader. Not freemium-gated — this is a fixed
 * calendar feature, not part of the mood-refresh economy, so the caller
 * should let these advance for free and only hand off to the normal gated
 * flow once the queue is exhausted.
 */
export async function buildFridayKahfExperiences(): Promise<GuidanceExperience[] | null> {
  try {
    let verses = await getCachedSurah(18);
    if (!verses || verses.length === 0) {
      verses = await fetchAndCacheSurah(18);
    }
    const firstTen = verses
      .filter((v) => v.numberInSurah <= KAHF_MIN_VERSES)
      .sort((a, b) => a.numberInSurah - b.numberInSurah);
    if (firstTen.length === 0) return null;

    const whyThis =
      'The Prophet ﷺ said: "Whoever reads Surah Al-Kahf on the day of Jumu\'ah, a light will shine for him between the two Fridays." [al-Hakim] He also taught that whoever memorizes these first ten verses will be protected from the trial of the Dajjal. [Sahih Muslim]';

    return firstTen.map((verse, i) => ({
      content: {
        id: `friday_kahf_18_${verse.numberInSurah}`,
        type: 'Quran',
        primaryText: verse.translation,
        arabicText: verse.arabic,
        englishTranslation: verse.translation,
        translation: verse.translation,
        source: `Surah Al-Kahf 18:${verse.numberInSurah}`,
        whyThis,
        moods: ['Calm'],
      },
      angle: {
        id: `friday_kahf_angle_${verse.numberInSurah}`,
        contentId: `friday_kahf_18_${verse.numberInSurah}`,
        mood: 'Calm',
        angle:
          i === 0
            ? 'Surah Al-Kahf opens by praising Allah for a Book sent down "with no crookedness in it" — a steadying opening for the day the Surah\'s light is promised to carry you through, Friday to Friday.'
            : `Verse ${verse.numberInSurah} of the first ten — the portion the Prophet ﷺ taught for protection from the trial of the Dajjal.`,
        angleSource: i === 0 ? 'Tafsir Ibn Kathir, Surah Al-Kahf' : 'Sahih Muslim',
      },
    }));
  } catch (error) {
    logServiceError('guidanceWindowFetch', 'buildFridayKahfExperiences', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}
