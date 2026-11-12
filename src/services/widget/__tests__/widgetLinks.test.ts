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

import { resolveWidgetLink } from '../widgetLinks';

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

  it('a lookup that rejects resolves to Main', async () => {
    mockWidget.getRunningJourney.mockRejectedValue(new Error('db'));
    mockWidget.getTodaysCheckIn.mockRejectedValue(new Error('disk'));
    await expect(resolveWidgetLink('journey')).resolves.toEqual({ name: 'Main' });
    await expect(resolveWidgetLink('reflect')).resolves.toEqual({ name: 'Main' });
  });
});
