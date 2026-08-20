import { SpiritualPath, PathStep, UserPathProgress, Mood, SpecialEditionBundle } from '../types';
import { STATIC_SPIRITUAL_PATHS, SPECIAL_EDITION_BUNDLES } from '../data/staticPaths';
import { SupabaseDataService } from './supabaseDataService';

/**
 * kv_store key holding the id of the journey whose day was opened most
 * recently. `UserPathProgress` has no last-touched timestamp, so without this
 * the Home screen's Sacred Journey card fell back to `startDate` descending —
 * "most recently STARTED", which is not "the one I'm working through". A user
 * partway through Rizq who then started a newer journey saw the card pinned to
 * the newer one, and finishing a Rizq day changed nothing on Home.
 *
 * Deliberately local-only (kv_store, not a Supabase column): it is a UI
 * pointer, not user content, so it needs no server migration and carries
 * nothing worth syncing. It still names a journey the user was walking, so
 * `clearAllLocalUserData` deletes this key along with the other personal ones.
 */
const LAST_OPENED_PATH_KEY = 'last_opened_path';

/**
 * Imported lazily rather than at module scope: `database/schema` pulls in the
 * seeder and its AsyncStorage-backed dependencies, and importing that eagerly
 * here broke pathsService.test.ts, which has no reason to know about the DB
 * layer. Same pattern useHomeData uses to reach PathsService itself. Both
 * callers are cold paths (opening a journey day, loading Home).
 */
const getDbQuery = async () => (await import('../database/schema')).dbQuery;

export class PathsService {
  private static instance: PathsService;

  static getInstance(): PathsService {
    if (!PathsService.instance) {
      PathsService.instance = new PathsService();
    }
    return PathsService.instance;
  }

  getAllPaths(_isPremium: boolean = false, _unlockedBundleIds: string[] = []): SpiritualPath[] {
    // Free-core model (spec §5): every journey's text is free, distress journeys
    // included, EXCEPT the paths PathsScreen.tsx's PREMIUM_GATED_PATHS names —
    // those are real journeys deliberately staged behind Sakina Pro first, with
    // a dated free-tier unlock. That gate lives screen-side (list + tap handler),
    // not here — this always returns the full catalog and the params below are
    // still unused; `_isPremium` / `_unlockedBundleIds` were reserved for
    // early-access windows (§6) and that is what ended up building this.
    return STATIC_SPIRITUAL_PATHS;
  }

  getAvailableBundles(): SpecialEditionBundle[] {
    // In a real app, we'd check dates or user purchases.
    // For now, we'll implement the basic filtering logic for demo sessions.

    return SPECIAL_EDITION_BUNDLES.filter((bundle) => {
      // Ramadan: 2 months before (approximate check for demo)
      if (bundle.id === 'bundle_ramadan') {
        const now = new Date();
        const month = now.getMonth(); // 0-indexed, 1=Feb
        // Ramadan 2026 is approx March 1st. So Jan and Feb are "2 months before".
        return month === 0 || month === 1;
      }

      // Default: exclude niche or situational bundles from the primary home feed
      // unless specifically requested. Umrah is year-round.
      const SituationalBundles = ['bundle_hajj', 'bundle_new_parent', 'bundle_convert'];
      return !SituationalBundles.includes(bundle.id);
    });
  }

  getPathById(pathId: string): SpiritualPath | null {
    return STATIC_SPIRITUAL_PATHS.find((path) => path.id === pathId) || null;
  }

  getPathsByMood(mood: Mood): SpiritualPath[] {
    return STATIC_SPIRITUAL_PATHS.filter((path) => path.theme === mood);
  }

  getCurrentStep(pathId: string, userProgress: UserPathProgress): PathStep | null {
    const path = this.getPathById(pathId);
    if (!path) return null;

    return path.dailySteps.find((step) => step.day === userProgress.currentDay) || null;
  }

  getNextStep(pathId: string, userProgress: UserPathProgress): PathStep | null {
    const path = this.getPathById(pathId);
    if (!path) return null;

    const nextDay = userProgress.currentDay + 1;
    return path.dailySteps.find((step) => step.day === nextDay) || null;
  }

  getCompletedSteps(pathId: string, userProgress: UserPathProgress): PathStep[] {
    const path = this.getPathById(pathId);
    if (!path) return [];

    return path.dailySteps.filter((step) => userProgress.completedDays.includes(step.day));
  }

  getProgressPercentage(userProgress: UserPathProgress): number {
    const path = this.getPathById(userProgress.pathId);
    if (!path || path.duration <= 0) return 0;

    // Progress = fraction of days the user has actually completed.
    // (Previously used `currentDay`, which starts at 1 before any completion,
    // incorrectly reporting 1/duration progress on a fresh start.)
    const completed = Math.min(userProgress.completedDays.length, path.duration);
    return (completed / path.duration) * 100;
  }

  isPathCompleted(userProgress: UserPathProgress): boolean {
    const path = this.getPathById(userProgress.pathId);
    if (!path) return false;

    return userProgress.completedDays.length >= path.duration;
  }

  // NOTE: getStepMotivation currently has no call sites in src/, AND 22 of the
  // 28 keys below match no `title` in staticPaths.ts — so even if it were
  // wired up, most entries could never be reached. Do not treat this map as
  // an audited content source; the lessons' real, verified content lives in
  // `practiceSteps` in quranData.ts. Left in place rather than deleted because
  // removing product copy is the owner's call, not a cleanup's.
  //
  // Every entry is nonetheless now citable, because an uncited quotation is a
  // trap whether or not it renders today. `scripts/verify-citations.mjs`
  // (pass 7) enforces it. What was here before:
  //   - two quotations with NO source at all ("Trust in Allah, for He knows
  //     what is best for His servants", "Tranquility (Sakina) is a gift…");
  //   - "Allah loves to forgive, so seek His forgiveness. [Prophetic
  //     Tradition]" — a provenance claim naming nothing locatable, and not a
  //     wording any collection carries;
  //   - the "Allah turns His Face towards him" hadith attributed to Bukhari
  //     when it is Sunan Abi Dawud 909 (Abu Dharr);
  //   - a Bukhari 5641 quote with an ellipsis eating four of its six items;
  //   - Muslim 2328a with its "except when fighting in the cause of Allah"
  //     exception dropped, which changes what the hadith claims;
  //   - 28:16 spliced so Musa appears to narrate his own forgiveness inside
  //     his own du'a;
  //   - ~16 bare [Bukhari] / [Tirmidhi] / [At-Tabarani] tags with no number,
  //     the exact form CLAUDE.md's "Citing Hadith" rule 2 bans.
  // Two were replaced rather than renumbered: the Ayat al-Kursi promise, whose
  // only reachable reference (Mishkat 974) sunnah.com itself grades weak, and
  // the "keep silent" narration, whose number could not be fetched — CLAUDE.md
  // rule 1: if you cannot fetch it, do not cite it.
  //
  // Every [Quran X:Y] entry is the complete ayah, verified against
  // api.alquran.cloud; a few were swapped for a different, genuinely complete
  // verse where the true full ayah was a fiqh ruling or mid-story dialogue
  // that didn't fit a short motivational line.
  //
  // Not to be confused with `getConsistencyMessage` in
  // PathCompletionCelebration.tsx: that one is generic goal-gradient copy
  // keyed by day-position, shown once on the post-completion modal.
  getStepMotivation(step: PathStep): string {
    const motivations: Record<string, string> = {
      'Recognizing Anxiety':
        '"No fatigue, nor disease, nor sorrow, nor sadness, nor hurt, nor distress befalls a Muslim, even if it were the prick he receives from a thorn, but that Allah expiates some of his sins for that." [Bukhari 5641]',
      'Turning to Allah': '"When anything distressed the Prophet ﷺ, he prayed." [Abu Dawud 1319]',
      "Allah's Presence":
        '"And We have already created man and know what his soul whispers to him, and We are closer to him than his jugular vein." [Quran 50:16]',
      'The Promise of Ease': '"Verily, with hardship comes ease." [Quran 94:6]',
      'Letting Go of Control':
        '"If you were to rely upon Allah with the required reliance, then He would provide for you just as a bird is provided for — it goes out in the morning empty, and returns full." [Tirmidhi 2344]',
      'Patience in Trust':
        '"Strange are the ways of a believer, for there is good in every affair of his, and this is not the case with anyone except a believer: if he has an occasion to feel delight, he thanks Allah, and there is good for him in it; and if he gets into trouble and shows resignation, there is good for him in it." [Muslim 2999]',
      'Living with Tawakkul':
        '"And He will provide for him from where he does not expect. And whoever relies upon Allah — then He is sufficient for him. Indeed, Allah will accomplish His purpose. Allah has already set for everything a due measure." [Quran 65:3]',

      'Acknowledging Guilt':
        '"Every son of Adam sins, and the best of the sinners are the repentant." [Tirmidhi 2499]',
      'The Door of Repentance':
        '"Say, O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins. Indeed, it is He who is the Forgiving, the Merciful." [Quran 39:53]',
      'Sincere Remorse': '"Regret is repentance." [Ibn Majah 4252]',
      'Taking Responsibility':
        'He said, "My Lord, indeed I have wronged myself, so forgive me," and He forgave him. Indeed, He is the Forgiving, the Merciful. [Quran 28:16]',
      'Seeking Forgiveness':
        '"By Allah! I ask for forgiveness from Allah and turn to Him in repentance more than seventy times a day." [Bukhari 6307]',
      'Making Amends':
        '"Have taqwa of Allah wherever you are, and follow an evil deed with a good one to wipe it out, and treat the people with good behaviour." [Tirmidhi 1987]',
      'Renewed Purity':
        '"The one who repents from sin is like one who did not sin." [Ibn Majah 4250]',

      'Understanding Anger':
        '"The strong is not the one who overcomes the people by his strength, but the strong is the one who controls himself while in anger." [Bukhari 6114]',
      "The Prophet's Example":
        '"Allah\'s Messenger ﷺ never beat anyone with his hand, neither a woman nor a servant, except when he had been fighting in the cause of Allah." [Muslim 2328a]',
      'The Power of Silence': '"Do not become angry and furious." [Bukhari 6116]',
      'Transforming Energy':
        '"When one of you becomes angry while standing, he should sit down. If the anger leaves him, well and good; otherwise he should lie down." [Abu Dawud 4782]',
      'The Strength of Patience':
        '"Whoever remains patient, Allah will make him patient." [Bukhari 1469]',
      'Forgiveness as Freedom':
        '"The retribution for an evil act is an evil one like it, but whoever pardons and makes reconciliation — his reward is due from Allah. Indeed, He does not like wrongdoers." [Quran 42:40]',
      'Inner Tranquility':
        '"Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured." [Quran 13:28]',

      // Salah Transformation Journey
      'What Steals Your Focus?':
        '"Allah continues to turn favourably towards a servant while he is engaged in prayer, as long as he does not look to the side; but if he does so, He turns away from him." [Abu Dawud 909]',
      'Prepare Your Space, Prepare Your Heart':
        '"The whole earth has been made a mosque for us, and its dust has been made a purifier for us in case water is not available." [Muslim 522a]',
      'The First Takbir That Changes Everything':
        '"The key to prayer is purification; its beginning is takbir and its end is taslim." [Abu Dawud 61]',
      "Understand What You're Saying":
        '"I have divided the prayer into two halves between Me and My servant." [Muslim 395a]',
      'Let Your Body Speak':
        '"The nearest a servant comes to his Lord is when he is prostrating himself, so make supplication in this state." [Muslim 482]',
      'The Forgotten Moments':
        '"I noticed the prayer of Muhammad ﷺ — his standing, his bowing, his returning to standing after bowing, his prostration, his sitting between the two prostrations — and all these were nearly equal to one another." [Muslim 471a]',
      'Complete the Circle':
        '"Whoever extols Allah after every prayer thirty-three times, praises Allah thirty-three times, and declares His greatness thirty-three times, then says to complete a hundred: there is no god but Allah, having no partner with Him, to Him belongs sovereignty and to Him is praise due, and He is Potent over everything — his sins will be forgiven even if these are as abundant as the foam of the sea." [Muslim 597a]',
    };

    return motivations[step.title] || 'Take this step with sincerity and trust in Allah.';
  }

  private supabaseData = SupabaseDataService.getInstance();

  async saveProgress(progress: UserPathProgress): Promise<boolean> {
    try {
      await this.supabaseData.recordPathProgress(progress);
      return true;
    } catch (error) {
      console.error('Error saving path progress:', error);
      return false;
    }
  }

  async loadProgress(pathId: string): Promise<UserPathProgress | null> {
    try {
      return await this.supabaseData.getPathProgress(pathId);
    } catch (error) {
      console.error('Error loading path progress:', error);
      return null;
    }
  }

  async getAllProgress(): Promise<UserPathProgress[]> {
    try {
      return await this.supabaseData.getAllPathProgress();
    } catch (error) {
      console.error('Error loading all path progress:', error);
      return [];
    }
  }

  /** Remember which journey the user just opened a day of. See LAST_OPENED_PATH_KEY. */
  async setLastOpenedPath(pathId: string): Promise<void> {
    try {
      const dbQuery = await getDbQuery();
      await dbQuery(async (db) => {
        await db.runAsync('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)', [
          LAST_OPENED_PATH_KEY,
          pathId,
        ]);
      });
    } catch (error) {
      // Non-fatal: the Home card just falls back to its startDate ordering.
      console.warn('[PathsService] Could not record last opened path:', error);
    }
  }

  async getLastOpenedPath(): Promise<string | null> {
    try {
      const dbQuery = await getDbQuery();
      const row = await dbQuery(async (db) =>
        db.getFirstAsync<{ value: string }>('SELECT value FROM kv_store WHERE key = ?', [
          LAST_OPENED_PATH_KEY,
        ]),
      );
      return row?.value ?? null;
    } catch {
      return null;
    }
  }
}
