import { dbQuery } from '../database/schema';
import { SubscriptionState, SubscriptionTier, SubscriptionType } from '../types';
import { SupabaseDataService } from './supabaseDataService';

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

  private constructor() { }

  async initialize(): Promise<void> {
    if (this.isLoaded) return;
    await this.loadSubscriptionState();
    this.isLoaded = true;
  }

  async loadSubscriptionState(): Promise<void> {
    try {
      // 1. Try Supabase first if logged in
      const profile = await this.supabaseData.getUserProfile();
      if (profile) {
        this.subscriptionState = {
          tier: (profile.subscription_tier || 'free') as SubscriptionTier,
          type: profile.subscription_type as SubscriptionType,
          subscriptionEndDate: profile.subscription_end ? new Date(profile.subscription_end).getTime() : undefined,
          isActive: Boolean(profile.is_active),
          willRenew: true, // Simplified for now
          unlockedBundleIds: profile.unlocked_bundles || [],
        };

        // Date checks
        if (this.subscriptionState.subscriptionEndDate && Date.now() > this.subscriptionState.subscriptionEndDate) {
          await this.resetToFreeTier();
        }
        return;
      }

      // 2. Fallback to local SQLite.
      // NOTE: Do NOT call any method that itself uses dbQuery (e.g. resetToFreeTier)
      // from inside this callback — dbQuery is not re-entrant. We read state here,
      // then apply any reset *after* the dbQuery block below.
      const row = await dbQuery(async (db) => {
        let result = await db.getFirstAsync(`
          SELECT * FROM user_subscription WHERE id = 'user_subscription' LIMIT 1
        `);

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
        this.subscriptionState = {
          tier: row.tier as SubscriptionTier,
          type: row.type as SubscriptionType,
          trialEndDate: row.trialEndDate,
          subscriptionEndDate: row.subscriptionEndDate,
          isActive: Boolean(row.isActive),
          willRenew: Boolean(row.willRenew),
          unlockedBundleIds: row.unlockedBundleIds ? JSON.parse(row.unlockedBundleIds) : [],
        };

        const now = Date.now();
        const trialExpired =
          this.subscriptionState.trialEndDate && now > this.subscriptionState.trialEndDate;
        const subExpired =
          this.subscriptionState.subscriptionEndDate &&
          now > this.subscriptionState.subscriptionEndDate;
        if (trialExpired || subExpired) {
          await this.resetToFreeTier();
        }
      }
    } catch (error) {
      console.error('Error loading subscription state:', error);
      this.subscriptionState = { tier: 'free', isActive: false, willRenew: false };
    }
  }

  async resetToFreeTier(): Promise<void> {
    try {
      const profile = await this.supabaseData.getUserProfile();
      if (profile) {
        await this.supabaseData.updateUserProfile({
          subscription_tier: 'free',
          subscription_type: null,
          subscription_end: null,
          is_active: false,
        });
      }

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
      console.error('Error deactivating subscription:', error);
    }
  }

  getSubscriptionState(): SubscriptionState | null {
    return this.subscriptionState;
  }

  isPremium(): boolean {
    return this.subscriptionState?.tier === 'premium' && this.subscriptionState.isActive;
  }

  async purchaseBundle(bundleId: string): Promise<boolean> {
    try {
      const currentBundles = this.subscriptionState?.unlockedBundleIds || [];
      if (currentBundles.includes(bundleId)) return true;

      const newBundles = [...currentBundles, bundleId];

      const profile = await this.supabaseData.getUserProfile();
      if (profile) {
        await this.supabaseData.updateUserProfile({ unlocked_bundles: newBundles });
      }

      await dbQuery(async (db) => {
        await db.runAsync(
          `UPDATE user_subscription SET unlockedBundleIds = ?, updatedAt = ? WHERE id = 'user_subscription'`,
          [JSON.stringify(newBundles), Date.now()],
        );
      });

      if (this.subscriptionState) {
        this.subscriptionState.unlockedBundleIds = newBundles;
      }
      return true;
    } catch (error) {
      console.error('Error purchasing bundle:', error);
      return false;
    }
  }

  async startTrial(): Promise<boolean> {
    try {
      const trialEndDate = Date.now() + 7 * 24 * 60 * 60 * 1000;

      const profile = await this.supabaseData.getUserProfile();
      if (profile) {
        await this.supabaseData.updateUserProfile({
          subscription_tier: 'premium',
          subscription_type: 'trial',
          subscription_end: new Date(trialEndDate).toISOString(),
          is_active: true,
        });
      }

      await dbQuery(async (db) => {
        await db.runAsync(
          `UPDATE user_subscription 
           SET tier = 'premium', type = 'trial', trialEndDate = ?, isActive = 1, updatedAt = ?
           WHERE id = 'user_subscription'`,
          [trialEndDate, Date.now()],
        );
      });

      if (this.subscriptionState) {
        this.subscriptionState = {
          ...this.subscriptionState,
          tier: 'premium',
          type: 'trial',
          trialEndDate,
          isActive: true,
        };
      }
      return true;
    } catch (error) {
      console.error('Error starting trial:', error);
      return false;
    }
  }

  async activatePremium(type: SubscriptionType): Promise<boolean> {
    try {
      const now = Date.now();
      const subscriptionEndDate = type === 'yearly' ? now + 365 * 24 * 60 * 60 * 1000 : now + 30 * 24 * 60 * 60 * 1000;

      const profile = await this.supabaseData.getUserProfile();
      if (profile) {
        await this.supabaseData.updateUserProfile({
          subscription_tier: 'premium',
          subscription_type: type,
          subscription_end: new Date(subscriptionEndDate).toISOString(),
          is_active: true,
        });
      }

      await dbQuery(async (db) => {
        await db.runAsync(
          `UPDATE user_subscription 
           SET tier = 'premium', type = ?, trialEndDate = NULL, 
               subscriptionEndDate = ?, isActive = 1, willRenew = 1, updatedAt = ?
           WHERE id = 'user_subscription'`,
          [type, subscriptionEndDate, now],
        );
      });

      if (this.subscriptionState) {
        this.subscriptionState = {
          ...this.subscriptionState,
          tier: 'premium',
          type,
          trialEndDate: undefined,
          subscriptionEndDate,
          isActive: true,
          willRenew: true,
        };
      }
      return true;
    } catch (error) {
      console.error('Error activating premium:', error);
      return false;
    }
  }

  async cancelSubscription(): Promise<boolean> {
    try {
      // For now, cancel only affects willRenew (logical cancel)
      await dbQuery(async (db) => {
        await db.runAsync(
          `UPDATE user_subscription SET willRenew = 0, updatedAt = ? WHERE id = 'user_subscription'`,
          [Date.now()],
        );
      });

      if (this.subscriptionState) {
        this.subscriptionState.willRenew = false;
      }
      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }
}
