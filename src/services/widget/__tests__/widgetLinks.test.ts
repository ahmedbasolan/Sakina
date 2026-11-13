/**
 * Where a widget tap lands when a URL alone cannot say it (spec: "Deep
 * links"). The resolver reads the app's own state; anything it cannot honour
 * lands on Home, silently.
 *
 * What this does NOT catch: that WidgetLinkScreen navigates to the result, or
 * that PathDetail / Guidance act on the params they receive.
 */
import type { GuidanceExperience, UserPathProgress } from '../../../types';

const mockWidget = {
  getTodaysCheckIn: jest.fn(),
  getRunningJourney: jest.fn(),
};
jest.mock('../widgetService', () => ({
  WidgetService: { getInstance: () => mockWidget },
}));

import { StackRouter } from '@react-navigation/routers';
import { resolveWidgetLink, widgetLinkAction, type WidgetLinkDestination } from '../widgetLinks';

/** Runs `action` through the real stack router from a stack of `names`. */
function stackAfter(names: string[], destination: WidgetLinkDestination) {
  const routeNames = ['Main', 'WidgetLink', 'Guidance', 'PathDetail', 'MoodSelection'];
  const options = {
    routeNames,
    routeParamList: Object.fromEntries(routeNames.map((n) => [n, undefined])),
    routeGetIdList: {},
  };
  const router = StackRouter({});
  const start = router.getRehydratedState({ routes: names.map((name) => ({ name })) } as any, options);
  const next = router.getStateForAction(start, widgetLinkAction(destination, names) as any, options);
  return (next as any).routes.map((r: { name: string; params?: object }) => ({ name: r.name, params: r.params }));
}

const experience = { content: { id: 'quran_93_4' }, angle: { id: 'q_angle_93_4_sad' } } as unknown as GuidanceExperience;
const progress: UserPathProgress = {
  pathId: 'path_trusting_the_results',
  currentDay: 3,
  startDate: 1,
  completedDays: [1, 2],
  isCompleted: false,
};

beforeEach(() => {
  mockWidget.getTodaysCheckIn.mockResolvedValue({ dateKey: '2026-11-12', mood: 'Sad', experience });
  mockWidget.getRunningJourney.mockResolvedValue({ pathId: 'path_trusting_the_results', progress });
});

describe('resolveWidgetLink', () => {
  it('journey opens the running Journey on today', async () => {
    await expect(resolveWidgetLink('journey')).resolves.toEqual({
      name: 'PathDetail',
      params: { pathId: 'path_trusting_the_results', openToday: true },
    });
  });

  it('journey with none running opens the Journeys tab', async () => {
    mockWidget.getRunningJourney.mockResolvedValue(null);
    await expect(resolveWidgetLink('journey')).resolves.toEqual({ name: 'Main', params: { screen: 'Journeys' } });
  });

  it('reflect reopens today’s check-in on its reflection', async () => {
    await expect(resolveWidgetLink('reflect')).resolves.toEqual({
      name: 'Guidance',
      params: { experience, mood: 'Sad', startLayer: 'context' },
    });
  });

  it('verse reopens today’s check-in on its verse', async () => {
    await expect(resolveWidgetLink('verse')).resolves.toEqual({
      name: 'Guidance',
      params: { experience, mood: 'Sad' },
    });
  });

  it.each(['reflect', 'verse'])('a check-in from another day resolves to Main (%s)', async (target) => {
    mockWidget.getTodaysCheckIn.mockResolvedValue(null);
    await expect(resolveWidgetLink(target)).resolves.toEqual({ name: 'Main' });
  });

  it.each(['anything', '', 'Journey', '../journey'])('an unknown target %j resolves to Main', async (target) => {
    await expect(resolveWidgetLink(target)).resolves.toEqual({ name: 'Main' });
  });

  describe('the navigation that follows', () => {
    it('a stale tap on a running app returns to the existing Home, never a second one', () => {
      expect(stackAfter(['Main', 'WidgetLink'], { name: 'Main' })).toEqual([{ name: 'Main', params: undefined }]);
    });

    it('"no Journey running" returns to the existing Home on its Journeys tab', () => {
      const stack = stackAfter(['Main', 'WidgetLink'], { name: 'Main', params: { screen: 'Journeys' } });
      expect(stack).toEqual([{ name: 'Main', params: { screen: 'Journeys' } }]);
    });

    it('with no Home in the stack at all, Home becomes the only screen', () => {
      expect(stackAfter(['WidgetLink'], { name: 'Main' }).map((r: { name: string }) => r.name)).toEqual(['Main']);
    });

    it('a real destination replaces the in-between screen and keeps Home underneath', () => {
      const dest: WidgetLinkDestination = { name: 'PathDetail', params: { pathId: 'p', openToday: true } };
      expect(stackAfter(['Main', 'WidgetLink'], dest)).toEqual([
        { name: 'Main', params: undefined },
        { name: 'PathDetail', params: { pathId: 'p', openToday: true } },
      ]);
    });
  });

  it('a lookup that rejects resolves to Main', async () => {
    mockWidget.getRunningJourney.mockRejectedValue(new Error('db'));
    mockWidget.getTodaysCheckIn.mockRejectedValue(new Error('disk'));
    await expect(resolveWidgetLink('journey')).resolves.toEqual({ name: 'Main' });
    await expect(resolveWidgetLink('reflect')).resolves.toEqual({ name: 'Main' });
  });
});
