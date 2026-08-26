import { FreemiumService } from '../freemiumService';

// Mock the dependencies
jest.mock('../../data/staticPaths', () => ({
  SPECIAL_EDITION_BUNDLES: [{ id: 'bundle-1', includesPremiumTrial: true }],
}));

jest.mock('../../database/connection', () => ({
  getDatabase: jest.fn(),
  dbQuery: jest.fn((op) =>
    op({
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
    }),
  ),
}));

jest.mock('../sessionService', () => ({
  SessionService: {
    getInstance: jest.fn(() => ({
      // Shape only — beforeEach rebuilds this object and wires it via mockReturnValue before each test.
      initialize: jest.fn(),
      canStartGuidanceSession: jest.fn(() => true),
      startGuidanceSession: jest.fn(() => Promise.resolve(true)),
      canUseNextRefresh: jest.fn(() => true),
      useNextRefresh: jest.fn(() => Promise.resolve(true)),
      getRemainingRefreshes: jest.fn(() => 3),
      syncWindow: jest.fn(() => Promise.resolve()),
      getCurrentSession: jest.fn(() => ({
        guidanceSessionsUsed: 0,
        nextRefreshesRemaining: 3,
      })),
      saveSession: jest.fn(() => Promise.resolve()),
      resetRefreshesToLimit: jest.fn(),
    })),
  },
}));

jest.mock('../subscriptionService', () => ({
  SubscriptionService: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn(() => Promise.resolve()),
      isPremium: jest.fn(() => false),
      getSubscriptionState: jest.fn(() => ({
        tier: 'free',
        unlockedBundleIds: [],
      })),
      purchaseBundle: jest.fn(() => Promise.resolve(true)),
      startTrial: jest.fn(() => Promise.resolve(true)),
      activatePremium: jest.fn(() => Promise.resolve(true)),
      resetToFreeTier: jest.fn(() => Promise.resolve()),
    })),
  },
}));

jest.mock('../../constants', () => ({
  FREEMIUM_LIMITS: {
    refreshesPerPrayerWindow: 3,
    maxSavedItems: 30,
    historyWindowDays: 30,
  },
  UPGRADE_ASK_COOLDOWN_MS: 3 * 24 * 60 * 60 * 1000, // 3 days
  // No SUBSCRIPTION_PRICING — prices come only from the store. See the note in
  // src/constants/index.ts for why a hardcoded fallback was removed.
}));

jest.mock('../upgradeAskStore', () => ({
  loadUpgradeAsk: jest.fn(() => Promise.resolve(null)),
  saveUpgradeAsk: jest.fn(() => Promise.resolve()),
}));

jest.mock('../revenueCatService', () => ({
  revenueCat: {
    configure: jest.fn(),
    getCustomerInfo: jest.fn(() => Promise.resolve({ entitlements: { active: {} } })),
    isEntitlementActive: jest.fn(() => false),
    getPricing: jest.fn(() => Promise.resolve(null)),
    purchasePackage: jest.fn(() => Promise.resolve({ success: false, customerInfo: null })),
    restorePurchases: jest.fn(() => Promise.resolve({ entitlements: { active: {} } })),
    resolveDurationType: jest.fn(() => Promise.resolve('yearly')),
    isYearlyTrialEligible: jest.fn(() => Promise.resolve(true)),
  },
}));

describe('FreemiumService', () => {
  let service: FreemiumService;
  let mockSessionService: any;
  let mockSubscriptionService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Build fresh mock objects and wire them into getInstance() BEFORE the
    // FreemiumService singleton is created. The service captures the returned
    // object in its class-field initialiser, so both the service and these
    // local variables end up pointing at the same object.
    const { SessionService } = require('../sessionService');
    mockSessionService = {
      initialize: jest.fn(),
      canStartGuidanceSession: jest.fn(() => true),
      startGuidanceSession: jest.fn(() => Promise.resolve(true)),
      canUseNextRefresh: jest.fn(() => true),
      useNextRefresh: jest.fn(() => Promise.resolve(true)),
      getRemainingRefreshes: jest.fn(() => 3),
      syncWindow: jest.fn(() => Promise.resolve()),
      getCurrentSession: jest.fn(() => ({
        guidanceSessionsUsed: 0,
        nextRefreshesRemaining: 3,
      })),
      saveSession: jest.fn(() => Promise.resolve()),
      resetRefreshesToLimit: jest.fn(),
    };
    SessionService.getInstance.mockReturnValue(mockSessionService);

    const { SubscriptionService } = require('../subscriptionService');
    mockSubscriptionService = {
      initialize: jest.fn(() => Promise.resolve()),
      isPremium: jest.fn(() => false),
      getSubscriptionState: jest.fn(() => ({
        tier: 'free',
        unlockedBundleIds: [],
      })),
      purchaseBundle: jest.fn(() => Promise.resolve(true)),
      startTrial: jest.fn(() => Promise.resolve(true)),
      activatePremium: jest.fn(() => Promise.resolve(true)),
      restorePurchases: jest.fn(() => Promise.resolve(true)),
      resetToFreeTier: jest.fn(() => Promise.resolve()),
    };
    SubscriptionService.getInstance.mockReturnValue(mockSubscriptionService);

    // Reset singleton instance and create fresh FreemiumService
    (FreemiumService as any).instance = null;
    service = FreemiumService.getInstance();
  });

  // Always restore real timers so a test that enables fake timers can't leak
  // into the next one (even if it throws before its own cleanup).
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const service1 = FreemiumService.getInstance();
      const service2 = FreemiumService.getInstance();
      expect(service1).toBe(service2);
    });
  });

  describe('Initialization', () => {
    it('should initialize subscription and session services', async () => {
      await service.initialize();

      expect(mockSubscriptionService.initialize).toHaveBeenCalled();
      expect(mockSessionService.initialize).toHaveBeenCalledWith(false);
    });

    it('should not initialize twice', async () => {
      await service.initialize();
      await service.initialize();

      expect(mockSubscriptionService.initialize).toHaveBeenCalledTimes(1);
      expect(mockSessionService.initialize).toHaveBeenCalledTimes(1);
    });

    it('should wait for initialization', async () => {
      const initPromise = service.initialize();
      const waitPromise = service.waitForInitialization();

      await Promise.all([initPromise, waitPromise]);

      expect(mockSubscriptionService.initialize).toHaveBeenCalled();
    });
  });

  describe('Premium Status', () => {
    it('should identify as free tier by default', () => {
      expect(service.isPremium()).toBe(false);
    });

    it('should identify as premium when subscription service says so', () => {
      mockSubscriptionService.isPremium.mockReturnValue(true);
      expect(service.isPremium()).toBe(true);
    });

    it('should return subscription state', () => {
      const state = service.getSubscriptionState();
      expect(state).toEqual({
        tier: 'free',
        unlockedBundleIds: [],
      });
    });
  });

  describe('Bundle Management', () => {
    it('should check if bundle is unlocked', () => {
      mockSubscriptionService.getSubscriptionState.mockReturnValue({
        tier: 'free',
        unlockedBundleIds: ['bundle-1'],
      });

      expect(service.hasUnlockedBundle('bundle-1')).toBe(true);
      expect(service.hasUnlockedBundle('bundle-2')).toBe(false);
    });

    // Bundle purchases were intentionally disabled in commit 11a855e to block
    // unvalidated grants — the old flow unlocked bundles (and auto-started a
    // premium trial) without a validated RevenueCat payment. purchaseBundle is
    // a stub until bundles ship through RevenueCat. These tests lock in that
    // security behavior so the unvalidated-grant path cannot quietly come back.
    it('refuses bundle purchases — no payment flow exists yet', async () => {
      const result = await service.purchaseBundle('bundle-1');

      expect(result).toBe(false);
    });

    it('grants no premium trial when a bundle purchase is attempted', async () => {
      mockSubscriptionService.getSubscriptionState.mockReturnValue({
        tier: 'free',
        unlockedBundleIds: [],
      });

      await service.purchaseBundle('bundle-1');

      // No access without a validated payment: neither a bundle grant nor a trial.
      expect(mockSubscriptionService.purchaseBundle).not.toHaveBeenCalled();
      expect(mockSubscriptionService.startTrial).not.toHaveBeenCalled();
    });
  });

  describe('Limits', () => {
    it('returns free-tier limits', () => {
      const limits = service.getCurrentLimits();
      expect(limits.refreshesPerPrayerWindow).toBe(3);
      expect(limits.maxSavedItems).toBe(30);
      expect(limits.historyWindowDays).toBe(30);
    });

    it('returns unlimited limits for premium', () => {
      mockSubscriptionService.isPremium.mockReturnValue(true);
      const limits = service.getCurrentLimits();
      expect(limits.refreshesPerPrayerWindow).toBe(Infinity);
      expect(limits.maxSavedItems).toBe(Infinity);
      expect(limits.historyWindowDays).toBe(90);
    });
  });

  describe('Session Management', () => {
    it('should check if can start guidance session', () => {
      mockSessionService.canStartGuidanceSession.mockReturnValue(true);
      expect(service.canStartGuidanceSession()).toBe(true);
    });

    it('should start guidance session', async () => {
      mockSessionService.startGuidanceSession.mockResolvedValue(true);

      const result = await service.startGuidanceSession();

      expect(result).toBe(true);
      expect(mockSessionService.startGuidanceSession).toHaveBeenCalledWith(false);
    });

    it('should check if can use next refresh', () => {
      mockSessionService.canUseNextRefresh.mockReturnValue(true);
      expect(service.canUseNextRefresh()).toBe(true);
      expect(mockSessionService.canUseNextRefresh).toHaveBeenCalledWith(false);
    });

    it('should use next refresh', async () => {
      mockSessionService.useNextRefresh.mockResolvedValue(true);

      const result = await service.useNextRefresh();

      expect(result).toBe(true);
      expect(mockSessionService.useNextRefresh).toHaveBeenCalledWith(false);
    });

    it('budgets every mood the same — no mercy exemption (owner decision)', () => {
      // The former MERCY_MOODS bypass passed mercy=true for heavy moods,
      // granting unlimited refreshes in 5 of the 8 home moods. The gate is
      // now mood-blind: only premium status reaches the session service.
      mockSessionService.getRemainingRefreshes.mockReturnValue(3);
      expect(service.getRemainingRefreshes()).toBe(3);
      expect(mockSessionService.getRemainingRefreshes).toHaveBeenCalledWith(false);
    });

    it('should get session info', () => {
      const session = { guidanceSessionsUsed: 1, nextRefreshesRemaining: 2 };
      mockSessionService.getCurrentSession.mockReturnValue(session);

      expect(service.getSessionInfo()).toEqual(session);
    });
  });

  describe('Save Items', () => {
    it('always allows saving for premium users', async () => {
      mockSubscriptionService.isPremium.mockReturnValue(true);
      expect(await service.canSaveItem()).toBe(true);
    });

    it('allows saving for free users under the cap', async () => {
      mockSubscriptionService.isPremium.mockReturnValue(false);
      const { dbQuery } = require('../../database/connection');
      dbQuery.mockImplementationOnce((op: any) =>
        op({ getFirstAsync: jest.fn().mockResolvedValue({ n: 5 }) }),
      );
      expect(await service.canSaveItem()).toBe(true);
    });

    it('blocks saving for free users at the cap', async () => {
      mockSubscriptionService.isPremium.mockReturnValue(false);
      const { dbQuery } = require('../../database/connection');
      dbQuery.mockImplementationOnce((op: any) =>
        op({ getFirstAsync: jest.fn().mockResolvedValue({ n: 30 }) }),
      );
      expect(await service.canSaveItem()).toBe(false);
    });
  });

  describe('Paywall Detection', () => {
    it('returns null (comfort-flow paywall removed — peaks-only model)', () => {
      expect(service.getPaywallType()).toBeNull();
    });

    it('returns null when premium', () => {
      mockSubscriptionService.isPremium.mockReturnValue(true);
      expect(service.getPaywallType()).toBeNull();
    });
  });

  describe('Pricing (store-localized only — never fabricated)', () => {
    it('returns null when RevenueCat has not supplied store pricing', () => {
      // The revenueCat mock resolves null, i.e. no offering could be read.
      // Returning hardcoded USD amounts here would print "$39.99" to a user
      // whose real charge is AUD 59.99 or EUR 44.99 — both verified as live
      // App Store Connect prices on 2026-08-16. A price we cannot source from
      // the store must not be displayed at all.
      expect(service.getPricing()).toBeNull();
    });

    it('returns the store-localized values verbatim once RevenueCat supplies them', async () => {
      const { revenueCat } = require('../revenueCatService');
      revenueCat.getPricing.mockResolvedValueOnce({
        monthlyPrice: 'AU$7.99',
        yearlyPrice: 'AU$59.99',
        monthlyPriceAmount: 7.99,
        yearlyPriceAmount: 59.99,
        trialDays: 7,
      });

      (FreemiumService as any).instance = null;
      const fresh = FreemiumService.getInstance();
      await fresh.initialize();
      await Promise.resolve(); // let the fire-and-forget pricing .then() settle

      expect(fresh.getPricing()).toEqual({
        monthlyUSD: 7.99,
        yearlyUSD: 59.99,
        monthlyPrice: 'AU$7.99',
        yearlyPrice: 'AU$59.99',
        trialDays: 7,
      });
    });
  });

  describe('Upgrade ask (peaks-only, cooldown — spec §8)', () => {
    it('offers an upgrade to a fresh free user at a peak', () => {
      expect(service.shouldOfferUpgrade('journey_complete')).toBe(true);
    });

    it('never offers to premium users', () => {
      mockSubscriptionService.isPremium.mockReturnValue(true);
      expect(service.shouldOfferUpgrade('journey_complete')).toBe(false);
    });

    it('stays silent within the cooldown window after an ask', async () => {
      await service.recordUpgradeAsk('support_screen');
      expect(service.shouldOfferUpgrade('journey_complete')).toBe(false);
    });

    it('persists the ask so the cooldown survives an app reload', async () => {
      const { saveUpgradeAsk } = require('../upgradeAskStore');
      await service.recordUpgradeAsk('theme_pick');
      expect(saveUpgradeAsk).toHaveBeenCalledWith(
        expect.objectContaining({ lastContext: 'theme_pick' }),
      );
    });

    it('after cooldown, offers a different peak but never the same type twice in a row', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-06-09T00:00:00Z'));
      await service.recordUpgradeAsk('journey_complete');

      jest.setSystemTime(new Date('2026-06-13T00:00:00Z')); // +4 days, past the 3-day cooldown
      expect(service.shouldOfferUpgrade('journey_complete')).toBe(false); // same type in a row
      expect(service.shouldOfferUpgrade('support_screen')).toBe(true); // a different peak is fine

      jest.useRealTimers();
    });

    it('loads persisted cooldown state on initialize', async () => {
      const { loadUpgradeAsk } = require('../upgradeAskStore');
      loadUpgradeAsk.mockResolvedValueOnce({
        lastAskAt: Date.now(),
        lastContext: 'support_screen',
      });

      await service.initialize();

      expect(service.shouldOfferUpgrade('journey_complete')).toBe(false);
    });
  });

  describe('Premium Activation', () => {
    it('should start trial successfully', async () => {
      mockSubscriptionService.startTrial.mockResolvedValue(true);
      mockSessionService.getCurrentSession.mockReturnValue({
        guidanceSessionsUsed: 1,
        nextRefreshesRemaining: 3,
      });

      const result = await service.startTrial();

      expect(result).toBe(true);
      expect(mockSubscriptionService.startTrial).toHaveBeenCalled();
      expect(mockSessionService.saveSession).toHaveBeenCalled();
    });

    it('should activate monthly premium', async () => {
      mockSubscriptionService.activatePremium.mockResolvedValue(true);
      mockSessionService.getCurrentSession.mockReturnValue({
        guidanceSessionsUsed: 1,
        nextRefreshesRemaining: 3,
      });

      const result = await service.activatePremium('monthly');

      expect(result).toBe(true);
      expect(mockSubscriptionService.activatePremium).toHaveBeenCalledWith('monthly');
      expect(mockSessionService.saveSession).toHaveBeenCalled();
    });

    it('should activate yearly premium', async () => {
      mockSubscriptionService.activatePremium.mockResolvedValue(true);
      mockSessionService.getCurrentSession.mockReturnValue({
        guidanceSessionsUsed: 1,
        nextRefreshesRemaining: 3,
      });

      const result = await service.activatePremium('yearly');

      expect(result).toBe(true);
      expect(mockSubscriptionService.activatePremium).toHaveBeenCalledWith('yearly');
    });

    it('should reset to free tier', async () => {
      mockSubscriptionService.resetToFreeTier.mockResolvedValue();

      await service.resetToFreeTier();

      expect(mockSubscriptionService.resetToFreeTier).toHaveBeenCalled();
      expect(mockSessionService.resetRefreshesToLimit).toHaveBeenCalled();
      expect(mockSessionService.saveSession).toHaveBeenCalled();
    });

    it('should restore purchase via RC and unlock session', async () => {
      mockSubscriptionService.restorePurchases.mockResolvedValue(true);
      mockSessionService.getCurrentSession.mockReturnValue({
        guidanceSessionsUsed: 1,
        nextRefreshesRemaining: 3,
      });

      const result = await service.restorePurchase();

      expect(result).toBe(true);
      expect(mockSubscriptionService.restorePurchases).toHaveBeenCalled();
      expect(mockSessionService.saveSession).toHaveBeenCalled();
    });
  });
});
