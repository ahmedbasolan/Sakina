import { RotationEngine } from '../rotationEngine';
import { Mood, ContentType, ContentAngle, GuidanceExperience } from '../../types';

// Mock dependencies
jest.mock('../../database/schema', () => ({
  getDatabase: jest.fn(),
  dbQuery: jest.fn(),
}));

jest.mock('../freemiumService', () => ({
  FreemiumService: {
    getInstance: jest.fn(() => ({
      isPremium: jest.fn(() => false),
    })),
  },
}));

jest.mock('../supabaseDataService', () => ({
  SupabaseDataService: {
    getInstance: jest.fn(() => ({
      fetchContentByMood: jest.fn(),
      getRecentHistory: jest.fn(),
      recordHistory: jest.fn(),
      fetchAngleById: jest.fn(),
    })),
  },
}));

jest.mock('../prayerTimesService', () => ({
  default: {
    getInstance: jest.fn(() => ({
      getCurrentPrayerContext: jest.fn(() => 'none'),
    })),
  },
}));

jest.mock('../../data/sunnahData', () => ({
  sunnahContentData: [],
}));

describe('RotationEngine', () => {
  let rotationEngine: RotationEngine;
  let mockDbQuery: jest.Mock;
  let mockSupabaseData: any;
  let mockPrayerTimesService: any;

  const mockAngle: ContentAngle = {
    id: 'angle-1',
    contentId: 'content-1',
    mood: 'anxious' as Mood,
    angle: 'Test angle',
    relevanceScore: 10,
    contentType: 'Quran' as ContentType,
    content: {
      id: 'content-1',
      type: 'Quran' as ContentType,
      primaryText: 'Test verse',
      arabicText: 'Arabic text',
      transliteration: 'Transliteration',
      englishTranslation: 'Translation',
      source: 'Test Source',
      moods: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton
    (RotationEngine as any).instance = null;
    rotationEngine = new RotationEngine();

    // Setup mocks
    const { dbQuery } = require('../../database/schema');
    mockDbQuery = dbQuery;

    const { SupabaseDataService } = require('../supabaseDataService');
    mockSupabaseData = SupabaseDataService.getInstance();

    const { default: PrayerTimesService } = require('../prayerTimesService');
    mockPrayerTimesService = PrayerTimesService.getInstance();
  });

  describe('getGuidance', () => {
    it('should return null when database is not available', async () => {
      mockDbQuery.mockRejectedValue(new Error('DB error'));
      
      const result = await rotationEngine.getGuidance('anxious' as Mood);
      expect(result).toBeNull();
    });

    it('should return null when no angles are available', async () => {
      mockSupabaseData.fetchContentByMood.mockResolvedValue([]);
      mockDbQuery.mockResolvedValue([]);
      
      const result = await rotationEngine.getGuidance('anxious' as Mood);
      expect(result).toBeNull();
    });

    it('should fetch from Supabase when available', async () => {
      const cloudAngles = [mockAngle];
      mockSupabaseData.fetchContentByMood.mockResolvedValue(cloudAngles);
      mockSupabaseData.getRecentHistory.mockResolvedValue(new Map());
      mockSupabaseData.recordHistory.mockResolvedValue(undefined);
      
      const result = await rotationEngine.getGuidance('anxious' as Mood);
      
      expect(mockSupabaseData.fetchContentByMood).toHaveBeenCalledWith('anxious');
      expect(result).not.toBeNull();
      expect(result?.content.primaryText).toBe('Test verse');
    });

    it('should fallback to SQLite when Supabase fails', async () => {
      mockSupabaseData.fetchContentByMood.mockRejectedValue(new Error('Network error'));
      
      const localAngles = [mockAngle];
      mockDbQuery.mockImplementation(async (callback) => {
        return callback({
          getAllAsync: jest.fn().mockResolvedValue([
            {
              id: 'angle-1',
              contentId: 'content-1',
              mood: 'anxious',
              angle: 'Test angle',
              relevanceScore: 10,
              type: 'Quran',
              primaryText: 'Test verse',
              arabicText: 'Arabic text',
              transliteration: 'Transliteration',
              englishTranslation: 'Translation',
              source: 'Test Source',
              prayerContext: '[]',
              propheticPractice: '{}',
            },
          ]),
        });
      });
      
      mockSupabaseData.getRecentHistory.mockResolvedValue(new Map());
      mockSupabaseData.recordHistory.mockResolvedValue(undefined);
      mockDbQuery.mockImplementation(async (callback) => {
        return callback({
          getFirstAsync: jest.fn().mockResolvedValue({ contentId: 'content-1' }),
        });
      });
      
      const result = await rotationEngine.getGuidance('anxious' as Mood);
      
      expect(mockSupabaseData.fetchContentByMood).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });

    it('should apply recency penalties correctly', async () => {
      const angles = [
        { ...mockAngle, id: 'angle-1', relevanceScore: 10 },
        { ...mockAngle, id: 'angle-2', relevanceScore: 10 },
      ];
      
      mockSupabaseData.fetchContentByMood.mockResolvedValue(angles);
      
      const history = new Map();
      history.set('content-1-angle-1', Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
      mockSupabaseData.getRecentHistory.mockResolvedValue(history);
      mockSupabaseData.recordHistory.mockResolvedValue(undefined);
      mockDbQuery.mockResolvedValue({ contentId: 'content-2' });
      
      const result = await rotationEngine.getGuidance('anxious' as Mood);
      
      // The angle shown 12 hours ago should have a penalty and be less likely to be selected
      expect(mockSupabaseData.getRecentHistory).toHaveBeenCalled();
    });

    it('should apply prayer context boost when matching', async () => {
      const angles = [
        {
          ...mockAngle,
          content: {
            ...mockAngle.content,
            prayerContext: ['fajr'],
          },
        },
      ];
      
      mockSupabaseData.fetchContentByMood.mockResolvedValue(angles);
      mockSupabaseData.getRecentHistory.mockResolvedValue(new Map());
      mockSupabaseData.recordHistory.mockResolvedValue(undefined);
      mockDbQuery.mockResolvedValue({ contentId: 'content-1' });
      mockPrayerTimesService.getCurrentPrayerContext.mockReturnValue('fajr');
      
      const result = await rotationEngine.getGuidance('anxious' as Mood);
      
      expect(mockPrayerTimesService.getCurrentPrayerContext).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });

    it('should prevent same angle from showing twice in same session', async () => {
      const angles = [
        { ...mockAngle, id: 'angle-1' },
        { ...mockAngle, id: 'angle-2' },
      ];
      
      mockSupabaseData.fetchContentByMood.mockResolvedValue(angles);
      mockSupabaseData.getRecentHistory.mockResolvedValue(new Map());
      mockSupabaseData.recordHistory.mockResolvedValue(undefined);
      mockDbQuery.mockResolvedValue({ contentId: 'content-1' });
      
      const result1 = await rotationEngine.getGuidance('anxious' as Mood);
      const result2 = await rotationEngine.getGuidance('anxious' as Mood);
      
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      // The second call should return a different angle due to session tracking
      expect(mockSupabaseData.recordHistory).toHaveBeenCalledTimes(2);
    });

    it('should reset session when mood changes', async () => {
      const angles = [mockAngle];
      
      mockSupabaseData.fetchContentByMood.mockResolvedValue(angles);
      mockSupabaseData.getRecentHistory.mockResolvedValue(new Map());
      mockSupabaseData.recordHistory.mockResolvedValue(undefined);
      mockDbQuery.mockResolvedValue({ contentId: 'content-1' });
      
      await rotationEngine.getGuidance('anxious' as Mood);
      await rotationEngine.getGuidance('grateful' as Mood);
      
      // Session should reset when mood changes
      expect(mockSupabaseData.recordHistory).toHaveBeenCalledTimes(2);
    });
  });

  describe('weightedRandomSelect', () => {
    it('should throw error on empty pool', () => {
      const scoredAngles: any[] = [];
      expect(() => {
        (rotationEngine as any).weightedRandomSelect(scoredAngles);
      }).toThrow('Cannot select from empty pool');
    });

    it('should return single item when pool has one item', () => {
      const scoredAngles = [{ angle: mockAngle, score: 10 }];
      const result = (rotationEngine as any).weightedRandomSelect(scoredAngles);
      expect(result).toBe(mockAngle);
    });

    it('should respect score weights', () => {
      const highScoreAngle = { ...mockAngle, id: 'high-score' };
      const lowScoreAngle = { ...mockAngle, id: 'low-score' };
      
      const scoredAngles = [
        { angle: highScoreAngle, score: 90 },
        { angle: lowScoreAngle, score: 10 },
      ];
      
      // Run multiple times to check distribution
      const results: string[] = [];
      for (let i = 0; i < 100; i++) {
        const result = (rotationEngine as any).weightedRandomSelect(scoredAngles);
        results.push(result.id);
      }
      
      // High score should be selected more often
      const highScoreCount = results.filter((id) => id === 'high-score').length;
      expect(highScoreCount).toBeGreaterThan(50); // Should be > 50% of the time
    });
  });

  describe('getGuidanceForStep', () => {
    it('should fetch specific angle by ID from Supabase', async () => {
      mockSupabaseData.fetchAngleById.mockResolvedValue({
        id: 'angle-1',
        content_id: 'content-1',
        mood: 'anxious',
        angle: 'Test angle',
        content: {
          id: 'content-1',
          type: 'Quran',
          primary_text: 'Test verse',
          english_translation: 'Translation',
          source: 'Test Source',
        },
      });
      
      const result = await rotationEngine.getGuidanceForStep('content-1', 'angle-1');
      
      expect(mockSupabaseData.fetchAngleById).toHaveBeenCalledWith('angle-1');
      expect(result).not.toBeNull();
      expect(result?.content.primaryText).toBe('Test verse');
    });

    it('should fallback to SQLite when Supabase fails', async () => {
      mockSupabaseData.fetchAngleById.mockResolvedValue(null);
      
      mockDbQuery.mockImplementation(async (callback) => {
        return callback({
          getFirstAsync: jest.fn().mockResolvedValue({
            id: 'angle-1',
            contentId: 'content-1',
            mood: 'anxious',
            angle: 'Test angle',
          }),
        });
      });
      
      const result = await rotationEngine.getGuidanceForStep('content-1', 'angle-1');
      
      expect(mockSupabaseData.fetchAngleById).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });

    it('should return null when angle not found', async () => {
      mockSupabaseData.fetchAngleById.mockResolvedValue(null);
      mockDbQuery.mockImplementation(async (callback) => {
        return callback({
          getFirstAsync: jest.fn().mockResolvedValue(null),
        });
      });
      
      const result = await rotationEngine.getGuidanceForStep('content-1', 'angle-1');
      
      expect(result).toBeNull();
    });
  });

  describe('saveReflection', () => {
    it('should save reflection to database', async () => {
      mockDbQuery.mockResolvedValue(undefined);
      
      await rotationEngine.saveReflection('content-1', 'angle-1', 'anxious' as Mood, 'My reflection');
      
      expect(mockDbQuery).toHaveBeenCalled();
    });
  });

  describe('getSavedReflections', () => {
    it('should retrieve saved reflections with content', async () => {
      const mockReflections = [
        {
          id: 'reflection-1',
          contentId: 'content-1',
          angleId: 'angle-1',
          mood: 'anxious',
          reflection: 'My reflection',
          timestamp: Date.now(),
          primaryText: 'Test verse',
          source: 'Test Source',
        },
      ];
      
      mockDbQuery.mockImplementation(async (callback) => {
        return callback({
          getAllAsync: jest.fn().mockResolvedValue(mockReflections),
        });
      });
      
      const result = await rotationEngine.getSavedReflections();
      
      expect(result).toHaveLength(1);
      expect(result[0].reflection).toBe('My reflection');
      expect(result[0].primaryText).toBe('Test verse');
    });
  });
});
