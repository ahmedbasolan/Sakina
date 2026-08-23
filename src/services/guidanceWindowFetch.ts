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
import { dbQuery } from '../database/connection';

export async function fetchWindowGuidance(
  rotationEngine: RotationEngine,
  moodId: Mood,
): Promise<GuidanceExperience | null> {
  try {
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
  } catch (error) {
    // Never-reject contract: this is the single window-gated entry point, and
    // every caller already treats a null return as "couldn't get guidance" and
    // degrades gracefully (GuidanceScreen re-fetches via its safety-net effect,
    // Home stays put, MoodSelection lets GuidanceScreen retry). rotationEngine
    // .getGuidance already swallows its own errors, but the freemium / session /
    // cache calls around it can reject — and a rejection here became an
    // *unhandled* promise rejection inside MoodSelectionScreen's async
    // setTimeout, which never re-navigated and stranded the user on faded-out
    // mood cards with no way forward. Resolve null so that can't happen.
    logServiceError(
      'guidanceWindowFetch',
      'fetchWindowGuidance',
      error instanceof Error ? error : new Error(String(error)),
      { mood: moodId },
    );
    return null;
  }
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

    const experiences: GuidanceExperience[] = firstTen.map((verse, i) => ({
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

    // These verses use synthetic content ids (`friday_kahf_18_*`) that are NOT
    // in the seeded `content` table. If a user bookmarks or writes a reflection
    // on one from the Guidance screen, the row lands in saved_reflections
    // referencing a contentId with no matching content row — and
    // ReflectionRepository.getAll()'s INNER JOIN on content then silently drops
    // it, so the save disappears from both the Saved Verses tab and the Journal
    // even though it persisted. Persist the content rows (idempotent) so any
    // later save resolves. Best-effort: a write failure must never break the
    // Friday flow itself — but still logged, matching this file's other two
    // catches, so a failure here isn't invisible.
    await persistSyntheticContent(experiences).catch((error) => {
      logServiceError(
        'guidanceWindowFetch',
        'persistSyntheticContent',
        error instanceof Error ? error : new Error(String(error)),
      );
    });

    return experiences;
  } catch (error) {
    logServiceError('guidanceWindowFetch', 'buildFridayKahfExperiences', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Upserts the in-memory content rows of synthetic experiences (e.g. Friday's
 * Al-Kahf verses) into the `content` table so saves against them are not
 * orphaned by ReflectionRepository.getAll()'s INNER JOIN. INSERT OR REPLACE is
 * a harmless no-op for ids that happen to already exist and never touches the
 * mood-rotation queries (no content_moods / content_angles rows are written).
 */
async function persistSyntheticContent(experiences: GuidanceExperience[]): Promise<void> {
  await dbQuery(async (db) => {
    // Transaction, not 10 individually-committed inserts — matches
    // seedContent.ts's own bulk-insert pattern. This runs on a foreground tap
    // (Home's Friday banner, gated by a visible spinner), so 10 separate disk
    // syncs is the same avoidable per-row round-trip cost that pattern exists
    // to prevent elsewhere in this codebase.
    await db.withTransactionAsync(async () => {
      for (const { content: c } of experiences) {
        await db.runAsync(
          `INSERT OR REPLACE INTO content
             (id, type, primaryText, arabicText, transliteration, englishTranslation,
              source, audioKey, whyThis, propheticPractice, optionalAction,
              optionalReflection, prayerContext)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            c.id,
            c.type,
            c.primaryText,
            c.arabicText ?? null,
            c.transliteration ?? null,
            c.englishTranslation ?? '',
            c.source ?? '',
            c.audioKey ?? null,
            c.whyThis ?? '',
            null,
            c.optionalAction ?? null,
            c.optionalReflection ?? null,
            null,
          ],
        );
      }
    });
  });
}
