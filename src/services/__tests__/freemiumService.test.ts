import { FreemiumService } from '../freemiumService';

// Mock the database dependencies
jest.mock('../../database/schema', () => ({
    getDatabase: jest.fn(),
    dbQuery: jest.fn((op) => op({
        getFirstAsync: jest.fn(),
        runAsync: jest.fn(),
    })),
}));

describe('FreemiumService', () => {
    let service: FreemiumService;

    beforeEach(() => {
        // Reset singleton instance if possible or clear its state
        // For singleton, we might need a reset method or just clear the private instance
        (FreemiumService as any).instance = null;
        service = FreemiumService.getInstance();
    });

    it('should identify as free tier by default', () => {
        expect(service.isPremium()).toBe(false);
    });

    it('should return correct limits for free tier', () => {
        const limits = service.getCurrentLimits();
        expect(limits.dailyGuidanceSessions).toBe(2);
        expect(limits.nextRefreshesPerSession).toBe(3);
    });

    it('should calculate hours until reset correctly', () => {
        const hours = service.getHoursUntilReset();
        expect(hours).toBeGreaterThanOrEqual(0);
        expect(hours).toBeLessThanOrEqual(24);
    });
});
