import { SpiritualPath, PathStep, UserPathProgress, Mood, SpecialEditionBundle } from '../types';
import { STATIC_SPIRITUAL_PATHS, SPECIAL_EDITION_BUNDLES } from '../data/staticPaths';
import { SupabaseDataService } from './supabaseDataService';

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
    // included. The paid layer is the enhanced edition (audio/PDF), gated at the
    // content level in a later phase — not by hiding the journey here.
    // `_isPremium` / `_unlockedBundleIds` are reserved for early-access windows (§6).
    return STATIC_SPIRITUAL_PATHS;
  }

  getAvailablePaths(isPremium: boolean, unlockedBundleIds: string[] = []): SpiritualPath[] {
    return this.getAllPaths(isPremium, unlockedBundleIds);
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

  // Helper method to get a motivational quote for the current step
  getStepMotivation(step: PathStep): string {
    const motivations: Record<string, string> = {
      'Recognizing Anxiety':
        '"No fatigue, nor sorrow, nor sadness... but that Allah expiates some of his sins for that." [Bukhari]',
      'Turning to Allah': '"When anything distressed the Prophet ﷺ, he would pray." [Abu Dawud]',
      "Allah's Presence": '"He is with you wherever you are." [Quran 57:4]',
      'The Promise of Ease': '"Verily, with hardship comes ease." [Quran 94:6]',
      'Letting Go of Control':
        '"If you depend on Allah with true reliance, He would give you provision as He gives it to birds." [Tirmidhi]',
      'Patience in Trust': '"Trust in Allah, for He knows what is best for His servants."',
      'Living with Tawakkul':
        '"Whoever relies upon Allah - then He is sufficient for him." [Quran 65:3]',

      'Acknowledging Guilt':
        '"Every son of Adam commits sin, and the best of those who sin are those who repent." [Tirmidhi]',
      'The Door of Repentance': '"My Mercy encompasses all things." [Quran 7:156]',
      'Sincere Remorse': '"Regret is repentance." [Ibn Majah]',
      'Taking Responsibility':
        '"O my Lord, I have indeed wronged my soul, so forgive me." [Quran 28:16]',
      'Seeking Forgiveness':
        '"Allah loves to forgive, so seek His forgiveness." [Prophetic Tradition]',
      'Making Amends': '"Follow a bad deed with a good deed and it will wipe it out." [Tirmidhi]',
      'Renewed Purity': '"The one who repents from sin is like one who has no sin." [Ibn Majah]',

      'Understanding Anger':
        '"The strong man is the one who controls himself in a fit of rage." [Bukhari]',
      "The Prophet's Example":
        '"He ﷺ never struck anyone with his hand, neither a woman nor a servant." [Muslim]',
      'The Power of Silence': '"If any of you becomes angry, let him keep silent." [Ahmad]',
      'Transforming Energy': '"Do not be angry, and for you is Paradise." [At-Tabarani]',
      'The Strength of Patience':
        '"Whoever remains patient, Allah will bestow patience upon him." [Bukhari]',
      'Forgiveness as Freedom':
        '"Forgive and overlook; do you not wish that Allah should forgive you?" [Quran 24:22]',
      'Inner Tranquility':
        '"Tranquility (Sakina) is a gift from the Most Merciful into the heart of the believer."',

      // Salah Transformation Journey
      'What Steals Your Focus?':
        '"When a servant stands to pray, Allah turns His Face towards him, as long as he does not look away." [Bukhari]',
      'Prepare Your Space, Prepare Your Heart':
        '"The whole earth has been made a place of prayer and a means of purification for me." [Sahih Muslim]',
      'The First Takbir That Changes Everything':
        '"The key to prayer is purification; its beginning is the Takbir." [Abu Dawud]',
      "Understand What You're Saying":
        '"Allah has divided the prayer between Himself and His servant into two halves." [Hadith Qudsi]',
      'Let Your Body Speak':
        '"The closest a servant is to his Lord is when he is in prostration." [Sahih Muslim]',
      'The Forgotten Moments':
        '"The Prophet ﷺ used to be as still in his transitions as his positions." [Bukhari]',
      'Complete the Circle':
        '"Whoever recites Ayat al-Kursi after every prayer, nothing prevents him from entering Paradise except death." [An-Nasa\'i]',
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
}
