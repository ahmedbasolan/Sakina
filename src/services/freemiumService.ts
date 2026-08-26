import {
  UserSession,
  FreemiumLimits,
  PaywallType,
  SubscriptionState,
  PeakContext,
} from '../types';
import { SessionService } from './sessionService';
import { SubscriptionService } from './subscriptionService';
import { FREEMIUM_LIMITS, UPGRADE_ASK_COOLDOWN_MS } from '../constants';

/**
 * Store-localized pricing for display. `monthlyPrice`/`yearlyPrice` are the
 * strings carrying the store's own currency symbol ("$4.99", "AU$59.99",
 * "44,99 €"); the *USD-suffixed numbers are the raw local-currency amounts
 * kept for arithmetic (savings %, per-month equivalent) and are NOT
 * necessarily USD despite the name.
 */
export interface DisplayPricing {
  monthlyUSD: number;
  yearlyUSD: number;
  monthlyPrice: string;
  yearlyPrice: string;
  trialDays: number;
}
import { revenueCat } from './revenueCatService';
import { dbQuery } from '../database/connection';
import { loadUpgradeAsk, saveUpgradeAsk, UpgradeAskState } from './upgradeAskStore';

/**
 * How far back Pro may browse its own history, in days. Exported because the
 * paywall line ("Unlock 90 days") and the Pro feature bullet both name this
 * number, and a screen hardcoding 90 would drift the moment it changed.
 * The free counterpart is `FREEMIUM_LIMITS.historyWindowDays` in constants.
 */
export const PREMIUM_HISTORY_WINDOW_DAYS = 90;

const PREMIUM_LIMITS: FreemiumLimits = {
  refreshesPerPrayerWindow: Infinity,
  maxSavedItems: Infinity,
  historyWindowDays: PREMIUM_HISTORY_WINDOW_DAYS,
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
  // In-memory mirror of the persisted peaks-only upgrade-ask cooldown (spec §8).
  // Loaded once at init so shouldOfferUpgrade() can stay synchronous for callers
  // in render/handlers; recordUpgradeAsk() updates this and persists.
  private upgradeAsk: UpgradeAskState = { lastAskAt: 0, lastContext: null };
  // Store-localized prices fetched from RC offerings during init.
  // Stays null when RC is unavailable — there is no hardcoded fallback.
  // `monthlyPrice`/`yearlyPrice` are the display strings ("$4.99", "€4,99")
  // carrying the correct currency symbol; the *USD numbers are kept for math
  // (savings %, per-month equivalent).
  private rcPricing: {
    monthlyUSD: number;
    yearlyUSD: number;
    monthlyPrice: string;
    yearlyPrice: string;
    trialDays: number;
  } | null = null;

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
      const savedAsk = await loadUpgradeAsk();
      if (savedAsk) this.upgradeAsk = savedAsk;
      // Pre-fetch RC offering prices so getPricing() can be synchronous.
      revenueCat.getPricing().then((p) => {
        if (p) {
          this.rcPricing = {
            monthlyUSD: p.monthlyPriceAmount,
            yearlyUSD: p.yearlyPriceAmount,
            monthlyPrice: p.monthlyPrice,
            yearlyPrice: p.yearlyPrice,
            trialDays: p.trialDays,
          };
        }
      }).catch(() => {});
      // Pre-warm the prayer-window session in the background so the initialization
      // completes immediately without waiting on network prayer-time calls.
      this.syncPrayerWindow().catch(() => {});
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

  async purchaseBundle(_bundleId: string): Promise<boolean> {
    // Bundles are not yet in RevenueCat — no payment flow exists.
    return false;
  }

  getSubscriptionState(): SubscriptionState | null {
    return this.subscriptionService.getSubscriptionState();
  }

  getCurrentLimits(): FreemiumLimits {
    return this.isPremium() ? { ...PREMIUM_LIMITS } : { ...FREEMIUM_LIMITS };
  }

  /**
   * Single display-price source (spec §7). Returns store-localized prices from
   * RC, or **null** when they could not be read.
   *
   * There is deliberately no hardcoded fallback. This used to synthesise
   * `$${SUBSCRIPTION_PRICING.yearlyUSD}` whenever RC was offline or still
   * loading, which printed "$39.99" to every user regardless of their store.
   * Verified against App Store Connect on 2026-08-16, the real annual price is
   * AU$59.99 in Australia, €44.99 in Austria and $49.99 in Albania — so that
   * fallback was showing a wrong price, not an approximate one, and a paywall
   * must state the actual price the user will be charged (App Store Guideline
   * 3.1.2). Callers must handle null by withholding the purchase CTA rather
   * than inventing a number.
   */
  getPricing(): DisplayPricing | null {
    return this.rcPricing;
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

  // The refresh budget applies uniformly to every mood (owner decision,
  // 2026-06-12): the former MERCY_MOODS exemption made 5 of the 8 home moods
  // effectively unlimited. The check-in verse itself stays free per window for
  // every mood — only "show me another" is budgeted — so a heavy heart is
  // still always met with guidance.
  canUseNextRefresh(): boolean {
    return this.sessionService.canUseNextRefresh(this.isPremium());
  }

  async useNextRefresh(): Promise<boolean> {
    return this.sessionService.useNextRefresh(this.isPremium());
  }

  getRemainingRefreshes(): number {
    return this.sessionService.getRemainingRefreshes(this.isPremium());
  }

  async canSaveItem(): Promise<boolean> {
    if (this.isPremium()) return true;
    const count = await this.getSavedItemsCount();
    return count < FREEMIUM_LIMITS.maxSavedItems;
  }

  /**
   * Saved-item count for the free cap (spec §3.1). Counts ONLY saved guidance
   * reflections + bookmarked verses.
   *
   * `NOT LIKE 'bv_guidance_%'` guards against a legacy write-time mirror
   * (removed — see useGuidanceLogic's handleSave) that briefly wrote a guidance
   * save into bookmarked_verses too. Current saves never create that id
   * pattern, but installs that saved one before the mirror was removed can
   * still have the row, so the exclusion stays until those age out.
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

  getPaywallType(): PaywallType | null {
    // Comfort-flow paywalls removed (spec §8). The in-flow limit is a gentle
    // resting point handled in the UI; upgrade asks live at peaks via
    // shouldOfferUpgrade(). Always null here.
    return null;
  }

  /**
   * Peaks-only upgrade gate (spec §8). The single decision point every peak
   * (journey completion, theme pick, Support screen, …) consults before showing
   * an upgrade ask. Returns false for premium, and enforces two anti-nag rules:
   *   1. at most one ask per UPGRADE_ASK_COOLDOWN_MS, and
   *   2. never the same peak type twice in a row.
   * Synchronous: reads the in-memory cooldown loaded at init.
   */
  shouldOfferUpgrade(context: PeakContext): boolean {
    if (this.isPremium()) return false;
    if (Date.now() - this.upgradeAsk.lastAskAt < UPGRADE_ASK_COOLDOWN_MS) return false;
    if (this.upgradeAsk.lastContext === context) return false;
    return true;
  }

  /** Record that an upgrade ask was shown at a peak, starting the cooldown. */
  async recordUpgradeAsk(context: PeakContext): Promise<void> {
    this.upgradeAsk = { lastAskAt: Date.now(), lastContext: context };
    await saveUpgradeAsk(this.upgradeAsk);
  }

  async startTrial(): Promise<boolean> {
    const success = await this.subscriptionService.startTrial();
    if (success) {
      const s = this.sessionService.getCurrentSession();
      if (s) s.nextRefreshesRemaining = 999;
      await this.sessionService.saveSession();
    }
    return success;
  }

  async activatePremium(type: 'monthly' | 'yearly'): Promise<boolean> {
    const success = await this.subscriptionService.activatePremium(type);
    if (success) {
      const s = this.sessionService.getCurrentSession();
      if (s) s.nextRefreshesRemaining = 999;
      await this.sessionService.saveSession();
    }
    return success;
  }

  async resetToFreeTier(): Promise<void> {
    await this.subscriptionService.resetToFreeTier();
    this.sessionService.resetRefreshesToLimit();
    await this.sessionService.saveSession();
  }

  async restorePurchase(): Promise<boolean> {
    const ok = await this.subscriptionService.restorePurchases();
    if (ok) {
      const s = this.sessionService.getCurrentSession();
      if (s) s.nextRefreshesRemaining = 999;
      await this.sessionService.saveSession();
    }
    return ok;
  }

  getSessionInfo(): UserSession | null {
    return this.sessionService.getCurrentSession();
  }
}
