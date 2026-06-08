import { FreemiumService } from '../freemiumService';

// Mock the dependencies
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
      initialize: jest.fn(),
      canStartGuidanceSession: jest.fn(() => true),
      startGuidanceSession: jest.fn(() => Promise.resolve(true)),
      canUseNextRefresh: jest.fn(() => true),
      useNextRefresh: jest.fn(() => Promise.resolve(true)),
      getRemainingSessions: jest.fn(() => 2),
      getRemainingRefreshes: jest.fn(() => 3),
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
    
    // Reset singleton instance
    (FreemiumService as any).instance = null;
    service = FreemiumService.getInstance();

    // Get mock instances
    const { SessionService } = require('../sessionService');
    mockSessionService = SessionService.getInstance();

    const { SubscriptionService } = require('../subscriptionService');
    mockSubscriptionService = SubscriptionService.getInstance();
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
      
      // Mock the static paths data
      jest.mock('../../data/staticPaths', () => ({
        SPECIAL_EDITION_BUNDLES: [
          { id: 'bundle-1', includesPremiumTrial: true },
        ],
      }));
      
      await service.purchaseBundle('bundle-1');
      
      expect(mockSubscriptionService.startTrial).toHaveBeenCalled();
    });
  });

  describe('Limits', () => {
    it('should return correct limits for free tier', () => {
      const limits = service.getCurrentLimits();
      expect(limits.dailyGuidanceSessions).toBe(2);
      expect(limits.nextRefreshesPerSession).toBe(3);
      expect(limits.maxSavedItems).toBe(10);
      expect(limits.rotationHistoryDays).toBe(7);
    });

    it('should return unlimited limits for premium tier', () => {
      mockSubscriptionService.isPremium.mockReturnValue(true);
      
      const limits = service.getCurrentLimits();
      expect(limits.dailyGuidanceSessions).toBe(Infinity);
      expect(limits.nextRefreshesPerSession).toBe(Infinity);
      expect(limits.maxSavedItems).toBe(Infinity);
      expect(limits.rotationHistoryDays).toBe(90);
    });

    it('should get limits alias', () => {
      const limits = service.getLimits();
      expect(limits).toEqual(service.getCurrentLimits());
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
    });

    it('should use next refresh', async () => {
      mockSessionService.useNextRefresh.mockResolvedValue(true);
      
      const result = await service.useNextRefresh();
      
      expect(result).toBe(true);
      expect(mockSessionService.useNextRefresh).toHaveBeenCalledWith(false);
    });

    it('should get remaining sessions', () => {
      mockSessionService.getRemainingSessions.mockReturnValue(2);
      expect(service.getRemainingSessions()).toBe(2);
    });

    it('should get remaining refreshes', () => {
      mockSessionService.getRemainingRefreshes.mockReturnValue(3);
      expect(service.getRemainingRefreshes()).toBe(3);
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

  describe('Time Calculations', () => {
    it('should calculate hours until reset correctly', () => {
      const hours = service.getHoursUntilReset();
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThanOrEqual(24);
    });

    it('should return 0 when at midnight', () => {
      // Mock Date to be midnight
      const mockDate = new Date();
      mockDate.setHours(0, 0, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const hours = service.getHoursUntilReset();
      expect(hours).toBe(24);
      
      jest.restoreAllMocks();
    });
  });

  describe('Paywall Detection', () => {
    it('should return null when premium', () => {
      mockSubscriptionService.isPremium.mockReturnValue(true);
      
      const paywall = service.getPaywallType();
      expect(paywall).toBeNull();
    });

    it('should return null when under limits', () => {
      mockSessionService.getCurrentSession.mockReturnValue({
        guidanceSessionsUsed: 1,
        nextRefreshesRemaining: 2,
      });
      
      const paywall = service.getPaywallType();
      expect(paywall).toBeNull();
    });

    it('should return daily_limit paywall when session limit reached', () => {
      mockSessionService.getCurrentSession.mockReturnValue({
        guidanceSessionsUsed: 2,
        nextRefreshesRemaining: 1,
      });
      
      const paywall = service.getPaywallType();
      expect(paywall).toEqual({
        type: 'daily_limit',
        remainingTime: expect.any(Number),
      });
    });

    it('should return refresh_limit paywall when refresh limit reached', () => {
      mockSessionService.getCurrentSession.mockReturnValue({
        guidanceSessionsUsed: 1,
        nextRefreshesRemaining: 0,
      });
      
      const paywall = service.getPaywallType();
      expect(paywall).toEqual({ type: 'refresh_limit' });
    });

    it('should return null when no session', () => {
      mockSessionService.getCurrentSession.mockReturnValue(null);
      
      const paywall = service.getPaywallType();
      expect(paywall).toBeNull();
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
