import {
  UserSession,
  FreemiumLimits,
  PaywallType,
  SubscriptionState,
} from '../types';
import { SessionService } from './sessionService';
import { SubscriptionService } from './subscriptionService';

const FREEMIUM_LIMITS: FreemiumLimits = {
  dailyGuidanceSessions: 2,
  nextRefreshesPerSession: 3,
  maxSavedItems: 0,
  rotationHistoryDays: 30,
};

const PREMIUM_LIMITS: FreemiumLimits = {
  dailyGuidanceSessions: Infinity,
  nextRefreshesPerSession: Infinity,
  maxSavedItems: Infinity,
  rotationHistoryDays: 90,
};

export class FreemiumService {
  private static instance: FreemiumService;
  private sessionService = SessionService.getInstance();
  private subscriptionService = SubscriptionService.getInstance();
  private isLoaded: boolean = false;

  static getInstance(): FreemiumService {
    if (!FreemiumService.instance) {
      FreemiumService.instance = new FreemiumService();
    }
    return FreemiumService.instance;
  }

  private constructor() { }

  async initialize(): Promise<void> {
    if (this.isLoaded) return;
    await this.subscriptionService.initialize();
    await this.sessionService.initialize(this.isPremium());
    this.isLoaded = true;
  }

  async waitForInitialization(): Promise<void> {
    while (!this.isLoaded) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  isPremium(): boolean {
    return this.subscriptionService.isPremium();
  }

  hasUnlockedBundle(bundleId: string): boolean {
    return this.subscriptionService.getSubscriptionState()?.unlockedBundleIds?.includes(bundleId) || false;
  }

  async purchaseBundle(bundleId: string): Promise<boolean> {
    const success = await this.subscriptionService.purchaseBundle(bundleId);
    if (success) {
      const { SPECIAL_EDITION_BUNDLES } = await import('../data/staticPaths');
      const bundle = SPECIAL_EDITION_BUNDLES.find((b) => b.id === bundleId);
      if (bundle?.includesPremiumTrial && this.subscriptionService.getSubscriptionState()?.tier === 'free') {
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

  canUseNextRefresh(): boolean {
    return this.sessionService.canUseNextRefresh(this.isPremium());
  }

  async useNextRefresh(): Promise<boolean> {
    return this.sessionService.useNextRefresh(this.isPremium());
  }

  getRemainingSessions(): number {
    return this.sessionService.getRemainingSessions(this.isPremium());
  }

  getRemainingRefreshes(): number {
    return this.sessionService.getRemainingRefreshes(this.isPremium());
  }

  async canSaveItem(): Promise<boolean> {
    return this.isPremium();
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
    const session = this.sessionService.getCurrentSession();
    if (!session || this.isPremium()) return null;

    if (session.guidanceSessionsUsed >= FREEMIUM_LIMITS.dailyGuidanceSessions) {
      return { type: 'daily_limit', remainingTime: this.getHoursUntilReset() };
    }

    if (session.nextRefreshesRemaining <= 0) {
      return { type: 'refresh_limit' };
    }

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
