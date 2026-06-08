import { isMercyMood, MERCY_MOODS } from '../index';
import { Mood } from '../../types';

describe('isMercyMood', () => {
  it('returns true for the six heavy moods', () => {
    (['Overwhelmed', 'Sad', 'Lonely', 'Guilty', 'Angry', 'Tired'] as Mood[]).forEach((m) =>
      expect(isMercyMood(m)).toBe(true),
    );
  });

  it('returns false for the three settled/positive moods', () => {
    (['Grateful', 'Hopeful', 'Calm'] as Mood[]).forEach((m) =>
      expect(isMercyMood(m)).toBe(false),
    );
  });

  it('MERCY_MOODS has exactly six entries', () => {
    expect(MERCY_MOODS.size).toBe(6);
  });
});
