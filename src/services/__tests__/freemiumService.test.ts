import { FreemiumService } from '../freemiumService';

// Mock the dependencies
jest.mock('../../data/staticPaths', () => ({
  SPECIAL_EDITION_BUNDLES: [
    { id: 'bundle-1', includesPremiumTrial: true },
  ],
}));

jest.mock('../../database/schema', () => ({
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
      cancelSubscription: jest.fn(() => Promise.resolve(true)),
    })),
  },
}));

jest.mock('../../constants', () => ({
  FREEMIUM_LIMITS: {
    refreshesPerPrayerWindow: 3,
    maxSavedItems: 30,
    rotationHistoryDays: 30,
  },
  isMercyMood: jest.fn(() => false),
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
      resetToFreeTier: jest.fn(() => Promise.resolve()),
      cancelSubscription: jest.fn(() => Promise.resolve(true)),
    };
    SubscriptionService.getInstance.mockReturnValue(mockSubscriptionService);

    // Reset singleton instance and create fresh FreemiumService
    (FreemiumService as any).instance = null;
    service = FreemiumService.getInstance();
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

    it('should purchase bundle successfully', async () => {
      mockSubscriptionService.purchaseBundle.mockResolvedValue(true);
      
      const result = await service.purchaseBundle('bundle-1');
      
      expect(result).toBe(true);
      expect(mockSubscriptionService.purchaseBundle).toHaveBeenCalledWith('bundle-1');
    });

    it('should start trial when bundle includes premium trial', async () => {
      mockSubscriptionService.purchaseBundle.mockResolvedValue(true);
      mockSubscriptionService.getSubscriptionState.mockReturnValue({
        tier: 'free',
        unlockedBundleIds: [],
      });

      await service.purchaseBundle('bundle-1');

      expect(mockSubscriptionService.startTrial).toHaveBeenCalled();
    });
  });

  describe('Limits', () => {
    it('returns free-tier limits', () => {
      const limits = service.getCurrentLimits();
      expect(limits.refreshesPerPrayerWindow).toBe(3);
      expect(limits.maxSavedItems).toBe(30);
      expect(limits.rotationHistoryDays).toBe(30);
    });

    it('returns unlimited limits for premium', () => {
      mockSubscriptionService.isPremium.mockReturnValue(true);
      const limits = service.getCurrentLimits();
      expect(limits.refreshesPerPrayerWindow).toBe(Infinity);
      expect(limits.maxSavedItems).toBe(Infinity);
      expect(limits.rotationHistoryDays).toBe(90);
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
      expect(mockSessionService.canUseNextRefresh).toHaveBeenCalledWith(false, false);
    });

    it('should use next refresh', async () => {
      mockSessionService.useNextRefresh.mockResolvedValue(true);

      const result = await service.useNextRefresh();

      expect(result).toBe(true);
      expect(mockSessionService.useNextRefresh).toHaveBeenCalledWith(false, false);
    });

    it('passes non-mercy by default for remaining refreshes', () => {
      mockSessionService.getRemainingRefreshes.mockReturnValue(3);
      expect(service.getRemainingRefreshes()).toBe(3);
      expect(mockSessionService.getRemainingRefreshes).toHaveBeenCalledWith(false, false);
    });

    it('passes mercy=true for a heavy mood', () => {
      const { isMercyMood } = require('../../constants');
      isMercyMood.mockReturnValue(true);
      service.getRemainingRefreshes('Sad');
      expect(mockSessionService.getRemainingRefreshes).toHaveBeenCalledWith(false, true);
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
      const { dbQuery } = require('../../database/schema');
      dbQuery.mockImplementationOnce((op: any) =>
        op({ getFirstAsync: jest.fn().mockResolvedValue({ n: 5 }) }),
      );
      expect(await service.canSaveItem()).toBe(true);
    });

    it('blocks saving for free users at the cap', async () => {
      mockSubscriptionService.isPremium.mockReturnValue(false);
      const { dbQuery } = require('../../database/schema');
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

    it('should cancel subscription', async () => {
      mockSubscriptionService.cancelSubscription.mockResolvedValue(true);
      
      const result = await service.cancelSubscription();
      
      expect(result).toBe(true);
      expect(mockSubscriptionService.cancelSubscription).toHaveBeenCalled();
    });

    it('should restore purchase', async () => {
      mockSubscriptionService.activatePremium.mockResolvedValue(true);
      mockSessionService.getCurrentSession.mockReturnValue({
        guidanceSessionsUsed: 1,
        nextRefreshesRemaining: 3,
      });
      
      const result = await service.restorePurchase();
      
      expect(result).toBe(true);
      expect(mockSubscriptionService.activatePremium).toHaveBeenCalledWith('monthly');
    });
  });
});
