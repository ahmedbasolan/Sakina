/**
 * SubscriptionService — wraps RevenueCat for all purchase / entitlement work.
 *
 * RC is the source of truth for subscription state. Local SQLite is a cache
 * for offline reads; Supabase is updated so the server side stays in sync.
 * Phase 3 replaces the old local-only flow with real App Store purchases.
 */
import { dbQuery } from '../database/schema';
import { SubscriptionState, SubscriptionTier, SubscriptionType } from '../types';
import { SupabaseDataService } from './supabaseDataService';
import { revenueCat } from './revenueCatService';
import { CustomerInfo } from 'react-native-purchases';

export class SubscriptionService {
  private static instance: SubscriptionService;
  private subscriptionState: SubscriptionState | null = null;
  private isLoaded: boolean = false;
  private supabaseData = SupabaseDataService.getInstance();

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  private constructor() {}

  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Configure RC (safe to call multiple times — no-ops after first call).
      revenueCat.configure();
      const info = await revenueCat.getCustomerInfo();
      await this.syncFromCustomerInfo(info);
    } catch {
      // Offline or RC unavailable — fall back to the local cache.
      await this.loadFromLocalCache();
    }

    this.isLoaded = true;
  }

  isPremium(): boolean {
    return this.subscriptionState?.tier === 'premium' && !!this.subscriptionState.isActive;
  }

  getSubscriptionState(): SubscriptionState | null {
    return this.subscriptionState;
  }

  /** Purchase the monthly or yearly subscription. Returns false on user-cancel; throws on store/config errors. */
  async activatePremium(type: SubscriptionType): Promise<boolean> {
    const pkgType = type === 'yearly' ? 'yearly' : 'monthly';
    const { success, customerInfo } = await revenueCat.purchasePackage(pkgType);
    if (success && customerInfo) {
      await this.syncFromCustomerInfo(customerInfo);
    }
    return success;
  }

  /**
   * Start the free trial. The trial period is defined on the yearly product in
   * App Store Connect — purchasing the yearly package will automatically present
   * the trial sheet to the user if they're eligible.
   */
  async startTrial(): Promise<boolean> {
    return this.activatePremium('yearly');
  }

  /** Restore purchases (required by App Store / Play Store guidelines). Throws on failure. */
  async restorePurchases(): Promise<boolean> {
    const info = await revenueCat.restorePurchases();
    await this.syncFromCustomerInfo(info);
    return this.isPremium();
  }

  /**
   * Bundle purchases are not yet implemented — bundles must go through
   * RevenueCat like the main subscription. This is a stub; wire it to
   * revenueCat.purchasePackage(bundlePackageId) when bundles go live.
   */
  async purchaseBundle(_bundleId: string): Promise<boolean> {
    return false;
  }

  // NOTE: there is deliberately no cancelSubscription() — users cancel via
  // App Store / Play Store settings and RevenueCat detects it; any future UI
  // must point them there rather than pretend the app can cancel.

  async resetToFreeTier(): Promise<void> {
    try {
      // Supabase subscription fields are managed by RC webhook (not client).
      await dbQuery(async (db) => {
        await db.runAsync(
          `UPDATE user_subscription
           SET tier = 'free', type = NULL, trialEndDate = NULL,
               subscriptionEndDate = NULL, isActive = 0, willRenew = 0, updatedAt = ?
           WHERE id = 'user_subscription'`,
          [Date.now()],
        );
      });

      if (this.subscriptionState) {
        this.subscriptionState = {
          ...this.subscriptionState,
          tier: 'free',
          type: undefined,
          trialEndDate: undefined,
          subscriptionEndDate: undefined,
          isActive: false,
          willRenew: false,
        };
      }
    } catch (error) {
      console.error('Error resetting to free tier:', error);
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Build local SubscriptionState from RC CustomerInfo, then persist it to
   * SQLite and Supabase so the rest of the app (offline reads, server-side) is
   * always consistent with the store.
   */
  private async syncFromCustomerInfo(info: CustomerInfo): Promise<void> {
    const isActive = revenueCat.isEntitlementActive(info);
    const entitlement = revenueCat.getActiveEntitlement(info);

    const tier: SubscriptionTier = isActive ? 'premium' : 'free';
    const type: SubscriptionType | undefined = isActive
      ? entitlement?.periodType === 'trial'
        ? 'trial'
        : await revenueCat.resolveDurationType(entitlement?.productIdentifier)
      : undefined;
    const subscriptionEndDate = entitlement?.expirationDate
      ? new Date(entitlement.expirationDate).getTime()
      : undefined;

    const currentBundles = this.subscriptionState?.unlockedBundleIds ?? [];

    this.subscriptionState = {
      tier,
      type,
      subscriptionEndDate,
      isActive,
      willRenew: isActive,
      unlockedBundleIds: currentBundles,
    };

    // Persist to local cache.
    await dbQuery(async (db) => {
      const existing = await db.getFirstAsync(
        `SELECT id FROM user_subscription WHERE id = 'user_subscription' LIMIT 1`,
      );
      if (existing) {
        await db.runAsync(
          `UPDATE user_subscription
           SET tier = ?, type = ?, subscriptionEndDate = ?, isActive = ?, willRenew = ?, updatedAt = ?
           WHERE id = 'user_subscription'`,
          [tier, type ?? null, subscriptionEndDate ?? null, isActive ? 1 : 0, isActive ? 1 : 0, Date.now()],
        );
      } else {
        await db.runAsync(
          `INSERT INTO user_subscription (id, tier, type, subscriptionEndDate, isActive, willRenew, createdAt, updatedAt)
           VALUES ('user_subscription', ?, ?, ?, ?, ?, ?, ?)`,
          [tier, type ?? null, subscriptionEndDate ?? null, isActive ? 1 : 0, isActive ? 1 : 0, Date.now(), Date.now()],
        );
      }
    }).catch(() => {});

    // Subscription state is intentionally NOT synced to Supabase here.
    // RevenueCat is the authoritative source; the Supabase trigger correctly
    // blocks client-side writes to subscription fields. If server-side
    // subscription checking is ever needed, add a RevenueCat webhook →
    // Edge Function that writes with service_role key.
  }

  /** Load subscription state from local SQLite (offline fallback). */
  private async loadFromLocalCache(): Promise<void> {
    try {
      const row = await dbQuery(async (db) => {
        let result = await db.getFirstAsync(
          `SELECT * FROM user_subscription WHERE id = 'user_subscription' LIMIT 1`,
        );
        if (!result) {
          await db.runAsync(
            `INSERT INTO user_subscription (id, tier, isActive, willRenew, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
            ['user_subscription', 'free', 0, 0, Date.now(), Date.now()],
          );
          result = await db.getFirstAsync(
            `SELECT * FROM user_subscription WHERE id = 'user_subscription' LIMIT 1`,
          );
        }
        return result as any | null;
      });

      if (row) {
        const validTiers: SubscriptionTier[] = ['free', 'premium'];
        const validTypes: Array<SubscriptionType | undefined> = ['monthly', 'yearly', 'trial', undefined];
        const tier: SubscriptionTier = validTiers.includes(row.tier) ? row.tier : 'free';
        const rawType: SubscriptionType | undefined = validTypes.includes(row.type) ? row.type : undefined;
        this.subscriptionState = {
          tier,
          type: rawType,
          trialEndDate: row.trialEndDate,
          subscriptionEndDate: row.subscriptionEndDate,
          isActive: tier === 'premium' && Boolean(row.isActive),
          willRenew: Boolean(row.willRenew),
          unlockedBundleIds: (() => { try { return row.unlockedBundleIds ? JSON.parse(row.unlockedBundleIds) : []; } catch { return []; } })(),
        };
      }
    } catch (error) {
      console.error('Error loading subscription from local cache:', error);
      this.subscriptionState = { tier: 'free', isActive: false, willRenew: false };
    }
  }
}
