/**
 * journeyAccess — who may start which journey, on which day.
 *
 * WHAT THIS DOES NOT CATCH: the device clock. `today` comes from the phone,
 * so a free user who moves their clock forward unlocks early (accepted in
 * the spec). It also cannot tell whether a journey's `released` date is right.
 */
import { getJourneyAccess, publicFromYMD, formatShortDate, parseYMD } from '../journeyAccess';

const early = { released: '2026-11-01', access: 'early_access' as const };

jest.mock('../../constants/journeyAvailability', () => ({
  EARLY_ACCESS_DAYS: 30,
  AVAILABLE_PATHS: {
    path_new: { released: '2026-11-01', access: 'early_access' },
    path_jan: { released: '2026-01-31', access: 'early_access' },
    path_dec: { released: '2026-12-15', access: 'early_access' },
    path_excl: { released: '2026-08-18', access: 'pro_exclusive' },
    path_crisis: { released: '2026-11-01', access: 'free' },
  },
  AVAILABLE_PATH_IDS: new Set(['path_new', 'path_jan', 'path_dec', 'path_excl', 'path_crisis']),
}));

const free = { isPremium: false, hasProgress: false };
const pro = { isPremium: true, hasProgress: false };

describe('publicFromYMD', () => {
  it('adds 30 calendar days for early access', () => {
    expect(publicFromYMD(early)).toBe('2026-12-01');
  });
  it('rolls over month ends and year ends', () => {
    expect(publicFromYMD({ released: '2026-01-31', access: 'early_access' })).toBe('2026-03-02');
    expect(publicFromYMD({ released: '2026-12-15', access: 'early_access' })).toBe('2027-01-14');
  });
  it('is the release day for free journeys and null for exclusives', () => {
    expect(publicFromYMD({ released: '2026-11-01', access: 'free' })).toBe('2026-11-01');
    expect(publicFromYMD({ released: '2026-08-18', access: 'pro_exclusive' })).toBeNull();
  });
});

describe('getJourneyAccess — early access', () => {
  it('locks a free user on day 29 with a computed label', () => {
    expect(getJourneyAccess('path_new', { ...free, today: '2026-11-30' })).toEqual({
      locked: true,
      label: 'Free from Dec 1',
      inEarlyAccess: true,
      routeToPaywall: true,
    });
  });
  it('opens to a free user on day 30', () => {
    expect(getJourneyAccess('path_new', { ...free, today: '2026-12-01' })).toEqual({
      locked: false,
      inEarlyAccess: false,
      routeToPaywall: false,
    });
  });
  it('gives Pro the journey in-window and marks it as early access', () => {
    expect(getJourneyAccess('path_new', { ...pro, today: '2026-11-01' })).toEqual({
      locked: false,
      label: 'Pro early access',
      inEarlyAccess: true,
      routeToPaywall: false,
    });
  });
  it('keeps a lapsed Pro user with progress going', () => {
    expect(
      getJourneyAccess('path_new', { isPremium: false, hasProgress: true, today: '2026-11-10' }).locked,
    ).toBe(false);
  });
  it('locks a lapsed Pro user without progress', () => {
    expect(getJourneyAccess('path_new', { ...free, today: '2026-11-10' }).locked).toBe(true);
  });
});

describe('getJourneyAccess — other kinds', () => {
  it('never locks a free (crisis) journey, even on release day', () => {
    expect(getJourneyAccess('path_crisis', { ...free, today: '2026-11-01' }).locked).toBe(false);
  });
  it('locks a Pro exclusive for free users with its fixed label', () => {
    expect(getJourneyAccess('path_excl', { ...free, today: '2030-01-01' })).toEqual({
      locked: true,
      label: 'Sakina Pro exclusive',
      inEarlyAccess: false,
      routeToPaywall: true,
    });
  });
  it('locks a stub with no paywall route', () => {
    expect(getJourneyAccess('path_stub', { ...pro, today: '2026-11-01' })).toEqual({
      locked: true,
      label: 'Coming soon',
      inEarlyAccess: false,
      routeToPaywall: false,
    });
  });
});

describe('formatShortDate / parseYMD', () => {
  it('formats a local calendar day', () => {
    expect(formatShortDate('2026-11-12')).toBe('Nov 12');
    expect(parseYMD('2026-03-02').getDate()).toBe(2);
  });
});

import { compareExploreOrder } from '../journeyAccess';

describe('compareExploreOrder', () => {
  // Declaration order for the stubs' tie-break.
  const decl = new Map(['path_stub_b', 'path_stub_a', 'path_new', 'path_excl', 'path_jan'].map((id, i) => [id, i]));
  const sortIds = (ids: string[]) => [...ids].sort((a, b) => compareExploreOrder(a, b, (id) => decl.get(id) ?? 0));

  it('puts every startable journey newest first, locked or not, and stubs last in declaration order', () => {
    expect(sortIds(['path_stub_a', 'path_jan', 'path_stub_b', 'path_excl', 'path_new'])).toEqual([
      'path_new', // 2026-11-01, early access (locked for a free user)
      'path_excl', // 2026-08-18, Pro exclusive
      'path_jan', // 2026-01-31
      'path_stub_b',
      'path_stub_a',
    ]);
  });
});
