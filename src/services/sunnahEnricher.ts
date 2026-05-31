/**
 * SunnahEnricher — enriches a GuidanceExperience with Sunnah content.
 *
 * Previously embedded in RotationEngine.enrichExperienceWithSunnah(), this
 * logic is now isolated so it can be tested independently and so RotationEngine
 * is not responsible for knowing about sunnahContentData or action-type inference.
 *
 * The session-dedup Set (sessionShownSunnahIds) is owned by the caller
 * (RotationEngine) and passed in — SunnahEnricher is stateless.
 */

import { GuidanceExperience, ContentAngle, ContentType } from '../types';
import { sunnahContentData } from '../data/sunnahData';

export class SunnahEnricher {
  private static instance: SunnahEnricher;

  static getInstance(): SunnahEnricher {
    if (!SunnahEnricher.instance) {
      SunnahEnricher.instance = new SunnahEnricher();
    }
    return SunnahEnricher.instance;
  }

  private constructor() {}

  /**
   * Enrich the experience:
   *
   *  • If the angle has NO action → inject a mood-relevant Sunnah item,
   *    preferring ones not yet shown in this session (passed in via shownIds).
   *
   *  • If the angle already has an action → fill any missing action sub-fields
   *    from the parent content as a fallback, then infer actionType from
   *    content type and action text keywords.
   *
   * The caller is responsible for adding the chosen Sunnah ID to shownIds
   * after this call (returned via the result's angle so the caller can extract it).
   */
  enrich(
    experience: GuidanceExperience,
    sessionShownSunnahIds: Set<string>,
  ): { experience: GuidanceExperience; chosenSunnahKey?: string } {
    const { angle, content } = experience;

    // ── Path A: inject Sunnah when angle has no action ─────────────────────
    const relevantSunnah = sunnahContentData.filter((d) => d.moods.includes(angle.mood));
    if (!angle.action && relevantSunnah.length > 0) {
      const unseen = relevantSunnah.filter(
        (s) => !sessionShownSunnahIds.has(s.id ?? s.primaryText),
      );
      const pool = unseen.length > 0 ? unseen : relevantSunnah;
      const item = pool[Math.floor(Math.random() * pool.length)];
      const key = item.id ?? item.primaryText;

      return {
        chosenSunnahKey: key,
        experience: {
          ...experience,
          angle: {
            ...angle,
            action: item.primaryText,
            actionArabicText: item.arabicText,
            actionTransliteration: item.transliteration,
            actionSource: item.source,
            actionHowTo: item.englishTranslation,
            actionReward: item.whyThis,
            actionAudioKey: item.audioKey,
            actionTranslation: item.translation,
            actionType: item.type,
          },
        },
      };
    }

    // ── Path B: curated angle already has an action ─────────────────────────
    // Fill missing sub-fields from parent content, then infer actionType.
    const enrichedAngle: ContentAngle = {
      ...angle,
      actionHowTo: angle.actionHowTo || content.optionalAction,
      actionReward: angle.actionReward || content.whyThis,
      actionArabicText: angle.actionArabicText || content.arabicText,
      actionTransliteration: angle.actionTransliteration || content.transliteration,
      actionSource: angle.actionSource || content.source,
    };

    if (enrichedAngle.action && !enrichedAngle.actionType) {
      enrichedAngle.actionType = this.inferActionType(enrichedAngle, content.type);
    }

    return { experience: { ...experience, angle: enrichedAngle } };
  }

  /**
   * Infer the actionType string from content type and action text keywords.
   * Returns undefined when no confident classification is possible.
   */
  private inferActionType(
    angle: ContentAngle,
    contentType: ContentType | string,
  ): string | undefined {
    if (['Dua', 'Dhikr', 'Sunnah Practice'].includes(contentType)) {
      return contentType;
    }
    if (angle.actionArabicText) return 'Dua';

    const text = angle.action?.toLowerCase() ?? '';
    if (text.includes('recite') || text.includes('dua')) return 'Dua';
    if (text.includes('remembrance') || text.includes('dhikr')) return 'Dhikr';
    if (text.includes('practice') || text.includes('sunnah')) return 'Sunnah Practice';
    return undefined;
  }
}
