import { UserSession, FreemiumLimits, PaywallType, SubscriptionState, Mood } from '../types';
import { SessionService } from './sessionService';
import { SubscriptionService } from './subscriptionService';
import { FREEMIUM_LIMITS, isMercyMood } from '../constants';
import { dbQuery } from '../database/schema';
import { SPECIAL_EDITION_BUNDLES } from '../data/staticPaths';

const PREMIUM_LIMITS: FreemiumLimits = {
  refreshesPerPrayerWindow: Infinity,
  maxSavedItems: Infinity,
  rotationHistoryDays: 90,
};

export class FreemiumService {
  private static instance: FreemiumService;
  private sessionService = SessionService.getInstance();
  private subscriptionService = SubscriptionService.getInstance();
  private isLoaded: boolean = false;
  // Stored Promise so waitForInitialization() can await it directly instead of
  // polling every 50 ms on the JS thread. Previously the busy-wait approach
  // held the event loop and could delay time-critical animations on slow devices.
  private initPromise: Promise<void> | null = null;

  static getInstance(): FreemiumService {
    if (!FreemiumService.instance) {
      FreemiumService.instance = new FreemiumService();
    }
    return FreemiumService.instance;
  }

  private constructor() {}

  async initialize(): Promise<void> {
    if (this.isLoaded) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      await this.subscriptionService.initialize();
      await this.sessionService.initialize(this.isPremium());
      this.isLoaded = true;
    })();

    return this.initPromise;
  }

  async waitForInitialization(): Promise<void> {
    // If initialize() has already been called, await the stored Promise instead
    // of polling. If it hasn't been called yet, trigger it now.
    if (this.initPromise) return this.initPromise;
    return this.initialize();
  }

  isPremium(): boolean {
    return this.subscriptionService.isPremium();
  }

  hasUnlockedBundle(bundleId: string): boolean {
    return (
      this.subscriptionService.getSubscriptionState()?.unlockedBundleIds?.includes(bundleId) ||
      false
    );
  }

  async purchaseBundle(bundleId: string): Promise<boolean> {
    const success = await this.subscriptionService.purchaseBundle(bundleId);
    if (success) {
      const bundle = SPECIAL_EDITION_BUNDLES.find((b) => b.id === bundleId);
      if (
        bundle?.includesPremiumTrial &&
        this.subscriptionService.getSubscriptionState()?.tier === 'free'
      ) {
        await this.startTrial();
      }
    }
    return success;
  }

  getSubscriptionState(): SubscriptionState | null {
    return this.subscriptionService.getSubscriptionState();
  }

  getCurrentLimits(): FreemiumLimits {
    return this.isPremium() ? { ...PREMIUM_LIMITS } : { ...FREEMIUM_LIMITS };
  }

  canStartGuidanceSession(): boolean {
    return this.sessionService.canStartGuidanceSession(this.isPremium());
  }

  async startGuidanceSession(): Promise<boolean> {
    return this.sessionService.startGuidanceSession(this.isPremium());
  }

  /** Refresh the per-prayer-window allowance (call when guidance loads). */
  async syncPrayerWindow(): Promise<void> {
    await this.sessionService.syncWindow(this.isPremium());
  }

  canUseNextRefresh(mood?: Mood): boolean {
    return this.sessionService.canUseNextRefresh(this.isPremium(), this.mercy(mood));
  }

  async useNextRefresh(mood?: Mood): Promise<boolean> {
    return this.sessionService.useNextRefresh(this.isPremium(), this.mercy(mood));
  }

  getRemainingRefreshes(mood?: Mood): number {
    return this.sessionService.getRemainingRefreshes(this.isPremium(), this.mercy(mood));
  }

  private mercy(mood?: Mood): boolean {
    return mood ? isMercyMood(mood) : false;
  }

  async canSaveItem(): Promise<boolean> {
    if (this.isPremium()) return true;
    const count = await this.getSavedItemsCount();
    return count < FREEMIUM_LIMITS.maxSavedItems;
  }

  /**
   * Saved-item count for the free cap (spec §3.1). Counts ONLY saved guidance
   * reflections + bookmarked verses. A guidance Quran-save writes to BOTH
   * saved_reflections and bookmarked_verses (mirror row id `bv_guidance_*`), so we
   * count all saved_reflections plus only the non-mirror bookmarks — a single
   * saved verse counts once.
   *
   * Free-form journal entries (the `reflections` table) are intentionally NOT
   * counted: a person's own writing/journaling is never capped — only "saved"
   * library content is.
   */
  private async getSavedItemsCount(): Promise<number> {
    return dbQuery(async (db) => {
      const row = await db.getFirstAsync<{ n: number }>(
        `SELECT (SELECT COUNT(*) FROM saved_reflections)
              + (SELECT COUNT(*) FROM bookmarked_verses WHERE id NOT LIKE 'bv_guidance_%') AS n`,
      );
      return row?.n ?? 0;
    });
  }

  getHoursUntilReset(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diffMs = tomorrow.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  }

  getPaywallType(): PaywallType | null {
    // Comfort-flow paywalls removed (spec §8). The in-flow limit is a gentle
    // resting point handled in the UI; upgrade asks live at peaks via
    // shouldOfferUpgrade() (Phase 2). Always null here.
    return null;
  }

  async startTrial(): Promise<boolean> {
    const success = await this.subscriptionService.startTrial();
    if (success) {
      this.sessionService.getCurrentSession()!.nextRefreshesRemaining = 999;
      await this.sessionService.saveSession();
    }
    return success;
  }

  async activatePremium(type: 'monthly' | 'yearly'): Promise<boolean> {
    const success = await this.subscriptionService.activatePremium(type);
    if (success) {
      this.sessionService.getCurrentSession()!.nextRefreshesRemaining = 999;
      await this.sessionService.saveSession();
    }
    return success;
  }

  async resetToFreeTier(): Promise<void> {
    await this.subscriptionService.resetToFreeTier();
    this.sessionService.resetRefreshesToLimit();
    await this.sessionService.saveSession();
  }

  async cancelSubscription(): Promise<boolean> {
    return this.subscriptionService.cancelSubscription();
  }

  async restorePurchase(): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return this.activatePremium('monthly');
  }

  getLimits(): FreemiumLimits {
    return this.getCurrentLimits();
  }

  getSessionInfo(): UserSession | null {
    return this.sessionService.getCurrentSession();
  }
}
