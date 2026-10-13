/**
 * Every startable journey must have real content and a parseable release
 * date, and the access kinds must match owner decisions recorded in
 * docs/superpowers/specs/2026-10-13-pro-early-access-and-supporter-view-design.md.
 *
 * WHAT THIS DOES NOT CATCH: whether a `released` date is the day the build
 * actually reached users (store review can lag a hand-written date), and
 * whether a NEW crisis journey was correctly marked 'free' — only the one
 * named below is pinned.
 */
import { AVAILABLE_PATHS, AVAILABLE_PATH_IDS, EARLY_ACCESS_DAYS } from '../journeyAvailability';
import { STATIC_SPIRITUAL_PATHS } from '../../data/staticPaths';

describe('journeyAvailability', () => {
  it('lists only journeys that exist and have authored days', () => {
    for (const id of AVAILABLE_PATH_IDS) {
      const path = STATIC_SPIRITUAL_PATHS.find((p) => p.id === id);
      expect(path).toBeDefined();
      expect(path!.dailySteps.length).toBeGreaterThan(0);
    }
  });

  it('gives every journey a valid YYYY-MM-DD release date', () => {
    for (const [id, r] of Object.entries(AVAILABLE_PATHS)) {
      expect(r.released).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const [y, m, d] = r.released.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      expect(`${id}:${date.getMonth() + 1}/${date.getDate()}`).toBe(`${id}:${m}/${d}`);
    }
  });

  it('keeps the owner-decided Pro exclusives and the crisis journey free', () => {
    const exclusives = Object.entries(AVAILABLE_PATHS)
      .filter(([, r]) => r.access === 'pro_exclusive')
      .map(([id]) => id)
      .sort();
    expect(exclusives).toEqual(['path_death_awareness', 'path_marriage_seeker']);
    expect(AVAILABLE_PATHS.path_hope_after_crisis.access).toBe('free');
  });

  it('uses a 30-day window', () => {
    expect(EARLY_ACCESS_DAYS).toBe(30);
  });
});
