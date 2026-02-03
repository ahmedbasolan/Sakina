import { SpiritualPath, PathStep, UserPathProgress, Mood, SpecialEditionBundle } from '../types';
import { STATIC_SPIRITUAL_PATHS, SPECIAL_EDITION_BUNDLES } from '../data/staticPaths';

export class PathsService {
  private static instance: PathsService;

  static getInstance(): PathsService {
    if (!PathsService.instance) {
      PathsService.instance = new PathsService();
    }
    return PathsService.instance;
  }

  getAllPaths(isPremium: boolean = false, unlockedBundleIds: string[] = []): SpiritualPath[] {
    // Phase 1 Launch: Show only first 5 premium paths
    const phase1PremiumIds = [
      'path_anxiety_tawakkul',
      'path_guilt_tawbah',
      'path_grateful_heart',
      'path_marriage_seeker',
      'path_rizq_revolution',
      'path_wrong_marriage',
      'path_depression_iman',
      'path_forced_marriage',
      'path_two_worlds',
    ];

    return STATIC_SPIRITUAL_PATHS.filter((path) => {
      // If it's a Special Edition, only show if unlocked
      if (path.isSpecialEdition) {
        return path.bundleId && unlockedBundleIds.includes(path.bundleId);
      }

      // If it's a Premium path, show if in Phase 1 launch set
      // (Full 14 paths will roll out over the year)
      if (path.isPremium) {
        return phase1PremiumIds.includes(path.id);
      }

      // Default: show everything else (should be none in final state, but legacy support)
      return true;
    });
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
    if (!path) return 0;

    return (userProgress.completedDays.length / path.duration) * 100;
  }

  isPathCompleted(userProgress: UserPathProgress): boolean {
    const path = this.getPathById(userProgress.pathId);
    if (!path) return false;

    return userProgress.completedDays.length >= path.duration;
  }

  // Helper method to get a motivational quote for the current step
  getStepMotivation(step: PathStep): string {
    const motivations: Record<string, string> = {
      'Recognizing Anxiety': 'Your feelings are valid. Allah understands your heart.',
      'Turning to Allah': 'Every moment of anxiety is an opportunity to turn to Him.',
      "Allah's Presence": 'You are never alone in your struggles.',
      'The Promise of Ease': 'After every difficulty, Allah promises relief.',
      'Letting Go of Control': 'True peace comes from surrendering to His will.',
      'Patience in Trust': 'Trust His timing, for He knows what is best.',
      'Living with Tawakkul': 'Let trust in Allah become your way of life.',

      'Acknowledging Guilt': "Guilt is the heart's call to return to Allah.",
      'The Door of Repentance': "Allah's mercy is greater than your mistakes.",
      'Sincere Remorse': 'True repentance begins with genuine regret.',
      'Taking Responsibility': 'Change begins with accepting responsibility.',
      'Seeking Forgiveness': 'Allah loves to forgive, so seek His forgiveness.',
      'Making Amends': 'Right your wrongs and purify your heart.',
      'Renewed Purity': 'In sincere repentance, find spiritual renewal.',

      'Understanding Anger': 'Anger is a test of your spiritual strength.',
      "The Prophet's Example": 'Follow the best example of patience.',
      'The Power of Silence': 'Silence in anger is a sign of strength.',
      'Transforming Energy': 'Channel your emotions into righteous action.',
      'The Strength of Patience': 'True strength lies in patient restraint.',
      'Forgiveness as Freedom': 'Free yourself through forgiving others.',
      'Inner Tranquility': 'Find peace in the patience of the righteous.',
    };

    return motivations[step.title] || 'Take this step with sincerity and trust in Allah.';
  }
}
