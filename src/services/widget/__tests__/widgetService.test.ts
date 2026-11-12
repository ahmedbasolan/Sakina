/**
 * WidgetService gathers the app's state, keeps the check-in it needs, and
 * writes the widget's snapshot (spec: "Data: what the app writes for the
 * widget").
 *
 * What this does NOT catch: whether the screens actually call it
 * (widgetWiring.test.ts checks the call sites exist, not that they run),
 * whether the App Group write reaches the widget, or how it looks.
 */
import type { Content, ContentAngle, GuidanceExperience, UserPathProgress } from '../../../types';

const mockStore: Record<string, string> = {};
const mockStorageFails = { on: false };
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) =>
    mockStorageFails.on ? Promise.reject(new Error('disk')) : Promise.resolve(mockStore[key] ?? null),
  ),
  setItem: jest.fn((key: string, val: string) => {
    if (mockStorageFails.on) return Promise.reject(new Error('disk'));
    mockStore[key] = val;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    if (mockStorageFails.on) return Promise.reject(new Error('disk'));
    delete mockStore[key];
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys: string[]) => {
    for (const k of keys) delete mockStore[k];
    return Promise.resolve();
  }),
}));

const mockNative = { writeWidgetSnapshot: jest.fn(), clearWidgetSnapshot: jest.fn() };
jest.mock('../../../../modules/sakina-live-activity', () => ({
  writeWidgetSnapshot: (json: string) => mockNative.writeWidgetSnapshot(json),
  clearWidgetSnapshot: () => mockNative.clearWidgetSnapshot(),
}));

const mockSub = {
  hasLoaded: jest.fn(() => true),
  isPremium: jest.fn(() => true),
  loaded: [] as Array<() => void>,
  onLoaded: jest.fn((cb: () => void) => {
    mockSub.loaded.push(cb);
  }),
  premium: [] as Array<(isPremium: boolean) => void>,
  onPremiumChange: jest.fn((cb: (isPremium: boolean) => void) => {
    mockSub.premium.push(cb);
    return () => {};
  }),
};
jest.mock('../../subscriptionService', () => ({
  SubscriptionService: { getInstance: () => mockSub },
}));

const mockCard = { isAvailable: jest.fn(() => true), getEnabled: jest.fn(() => Promise.resolve(true)) };
jest.mock('../../liveActivity/liveActivityService', () => ({
  LiveActivityService: { getInstance: () => mockCard },
}));

const mockPaths = {
  lastOpened: null as string | null,
  progress: {} as Record<string, UserPathProgress>,
};
jest.mock('../../pathsService', () => {
  const { STATIC_SPIRITUAL_PATHS } = jest.requireActual('../../../data/staticPaths');
  const instance = {
    getLastOpenedPath: jest.fn(() => Promise.resolve(mockPaths.lastOpened)),
    loadProgress: jest.fn((id: string) => Promise.resolve(mockPaths.progress[id] ?? null)),
    getAllProgress: jest.fn(() => Promise.resolve(Object.values(mockPaths.progress))),
    getPathById: jest.fn((id: string) => STATIC_SPIRITUAL_PATHS.find((p: { id: string }) => p.id === id) ?? null),
    getCurrentStep: jest.fn((id: string, progress: UserPathProgress) => {
      const path = STATIC_SPIRITUAL_PATHS.find((p: { id: string }) => p.id === id);
      return path?.dailySteps.find((s: { day: number }) => s.day === progress.currentDay) ?? null;
    }),
  };
  return { PathsService: { getInstance: () => instance } };
});

const mockDaily = {
  arabic: 'D-AR',
  translation: 'D-EN',
  ref: 'Al-Baqarah 2:152',
  dateKey: '2026-11-12',
};
jest.mock('../../dailyVerseService', () => ({
  ...jest.requireActual('../../dailyVerseService'),
  getDailyVerse: jest.fn(() => Promise.resolve(mockDaily)),
}));

jest.mock('../../errorLoggingService', () => ({ logServiceError: jest.fn() }));

import { STATIC_SPIRITUAL_PATHS } from '../../../data/staticPaths';
import { formatDateKey } from '../../dailyVerseService';
import { dateKeyOf, localMidnight, lockedSnapshot, type WidgetSnapshot } from '../widgetTimeline';
import {
  WIDGET_CHECKIN_KEY,
  WIDGET_FORGOTTEN_KEY,
  WIDGET_JOURNEY_DONE_KEY,
  WIDGET_TIMINGS_KEY,
  WidgetService,
} from '../widgetService';

const TODAY = '2026-11-12';
const TOMORROW = '2026-11-13';

const content = (over: Partial<Content> = {}): Content =>
  ({
    id: 'quran_93_4',
    type: 'Quran',
    primaryText: 'p',
    arabicText: 'ARABIC TEXT',
    englishTranslation: 'English text.',
    source: 'Surah Ad-Duha 93:4',
    whyThis: 'w',
    ...over,
  }) as Content;
const angle = (over: Partial<ContentAngle> = {}): ContentAngle =>
  ({
    id: 'q_angle_93_4_sad',
    contentId: 'quran_93_4',
    mood: 'Sad',
    angle: 'a',
    reflection: 'QUESTION?',
    ...over,
  }) as ContentAngle;
const experience = (c: Partial<Content> = {}, a: Partial<ContentAngle> = {}): GuidanceExperience => ({
  content: content(c),
  angle: angle(a),
});
const progress = (pathId: string, over: Partial<UserPathProgress> = {}): UserPathProgress => ({
  pathId,
  currentDay: 3,
  startDate: 1,
  completedDays: [1, 2],
  isCompleted: false,
  ...over,
});

const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
};
const written = (): WidgetSnapshot => {
  const calls = mockNative.writeWidgetSnapshot.mock.calls;
  return JSON.parse(calls[calls.length - 1][0]);
};
/** The state in force `hour` hours into local day `key`. */
const stateAt = (key: string, hour: number) =>
  written().entries.filter((e) => e.at <= localMidnight(key) + hour * 3600).at(-1)!.state;

let service: WidgetService;

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 10, 12, 9, 0), doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] });
  for (const k of Object.keys(mockStore)) delete mockStore[k];
  mockStorageFails.on = false;
  mockNative.writeWidgetSnapshot.mockReset();
  mockNative.clearWidgetSnapshot.mockReset();
  mockSub.hasLoaded.mockReturnValue(true);
  mockSub.isPremium.mockReturnValue(true);
  mockSub.loaded = [];
  mockSub.onLoaded.mockClear();
  mockSub.premium = [];
  mockCard.isAvailable.mockReturnValue(true);
  mockCard.getEnabled.mockResolvedValue(true);
  mockPaths.lastOpened = null;
  mockPaths.progress = {};
  // A fresh instance per test, so no state (a pending onLoaded) leaks between them.
  service = new (WidgetService as unknown as { new (): WidgetService })();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('WidgetService', () => {
  it('agrees with formatDateKey about what day it is', () => {
    for (const d of [new Date(2026, 10, 12, 0, 0), new Date(2026, 10, 12, 23, 59), new Date(2027, 0, 1, 0, 0)]) {
      expect(dateKeyOf(d)).toBe(formatDateKey(d));
    }
  });

  it('writes nothing until the subscription state has loaded', async () => {
    mockSub.hasLoaded.mockReturnValue(false);
    await service.refresh();
    await service.refresh();
    expect(mockNative.writeWidgetSnapshot).not.toHaveBeenCalled();
    expect(mockSub.onLoaded).toHaveBeenCalledTimes(1);

    mockSub.hasLoaded.mockReturnValue(true);
    mockSub.loaded.forEach((cb) => cb());
    await flush();
    expect(mockNative.writeWidgetSnapshot).toHaveBeenCalledTimes(1);
  });

  it('rewrites when Pro is gained or lost', async () => {
    expect(mockSub.premium).toHaveLength(1);
    mockSub.isPremium.mockReturnValue(false);
    mockSub.premium[0](false);
    await flush();
    expect(written()).toEqual(lockedSnapshot());

    mockSub.isPremium.mockReturnValue(true);
    mockSub.premium[0](true);
    await flush();
    expect(stateAt(TODAY, 9).kind).toBe('checkin');
  });

  it('not Pro writes the locked snapshot', async () => {
    mockSub.isPremium.mockReturnValue(false);
    await service.refresh();
    expect(written()).toEqual(lockedSnapshot());
  });

  it('Pro with no check-in asks the question this morning', async () => {
    await service.refresh();
    expect(stateAt(TODAY, 9).kind).toBe('checkin');
  });

  it('a check-in is stored and shown', async () => {
    const exp = experience();
    await service.onCheckIn(exp, 'Sad');
    expect(JSON.parse(mockStore[WIDGET_CHECKIN_KEY])).toEqual({ dateKey: TODAY, mood: 'Sad', experience: exp });
    expect(stateAt(TODAY, 9)).toMatchObject({
      kind: 'reflection',
      question: 'QUESTION?',
      ref: '— on Surah Ad-Duha 93:4',
    });
  });

  it('the mood and the stored experience never reach the App Group', async () => {
    await service.onCheckIn(experience(), 'Sad');
    const json = mockNative.writeWidgetSnapshot.mock.calls.at(-1)![0] as string;
    expect(json).not.toMatch(/"mood"|"experience"|"angle"|q_angle_93_4_sad/);
  });

  it('card off shows the verse, text unchanged', async () => {
    mockCard.getEnabled.mockResolvedValue(false);
    await service.onCheckIn(experience({ arabicText: '  ARABIC  ', englishTranslation: '  English.  ' }), 'Sad');
    expect(stateAt(TODAY, 9)).toMatchObject({
      kind: 'verse',
      arabic: '  ARABIC  ',
      english: '  English.  ',
      ref: '— Surah Ad-Duha 93:4',
    });
  });

  it('a device without the card counts as card off', async () => {
    mockCard.isAvailable.mockReturnValue(false);
    await service.onCheckIn(experience(), 'Sad');
    expect(stateAt(TODAY, 9).kind).toBe('verse');
  });

  it('non-Quran check-in: the daily verse with the card off, the hadith cited with it on', async () => {
    const hadith = experience({ type: 'Hadith', source: 'Sahih Bukhari 6116', arabicText: 'H-AR' });
    mockCard.getEnabled.mockResolvedValue(false);
    await service.onCheckIn(hadith, 'Angry');
    expect(stateAt(TODAY, 9)).toMatchObject({ kind: 'verse', arabic: 'D-AR', english: 'D-EN' });

    mockCard.getEnabled.mockResolvedValue(true);
    await service.refresh();
    expect(stateAt(TODAY, 20)).toMatchObject({ kind: 'reflection', ref: '— on Sahih Bukhari 6116' });
  });

  it.each([[''], [undefined]])('an empty reflection (%p) counts as none', async (reflection) => {
    await service.onCheckIn(experience({}, { reflection }), 'Sad');
    expect(written().entries.some((e) => e.state.kind === 'reflection')).toBe(false);
  });

  it('a named Journey shows its day title', async () => {
    mockPaths.lastOpened = 'path_trusting_the_results';
    mockPaths.progress = { path_trusting_the_results: progress('path_trusting_the_results') };
    await service.onCheckIn(experience(), 'Sad');
    expect(stateAt(TODAY, 9)).toMatchObject({
      kind: 'journey',
      kicker: 'Trusting the Results',
      dayLabel: 'Day 3 of 7',
      title: 'Name the Fear',
    });
  });

  it('a sensitive Journey is never named', async () => {
    const id = 'path_hope_after_crisis';
    mockPaths.lastOpened = id;
    mockPaths.progress = { [id]: progress(id) };
    await service.refresh();
    expect(stateAt(TODAY, 13)).toMatchObject({ kind: 'journey', kicker: 'Your Journey' });
    const json = mockNative.writeWidgetSnapshot.mock.calls.at(-1)![0] as string;
    const path = STATIC_SPIRITUAL_PATHS.find((p) => p.id === id)!;
    expect(path.dailySteps.length).toBeGreaterThan(0);
    for (const name of [path.title, ...path.dailySteps.map((s) => s.title)]) {
      expect([name, json.includes(name)]).toEqual([name, false]);
    }
  });

  it.each([
    ['finished', 'path_trusting_the_results', { isCompleted: true }],
    ['not available', 'path_grief_loss', {}],
    ['past its last day', 'path_trusting_the_results', { currentDay: 8 }],
  ] as const)('a %s Journey is not shown', async (_why, id, over) => {
    mockPaths.lastOpened = id;
    mockPaths.progress = { [id]: progress(id, over) };
    await service.refresh();
    expect(written().entries.some((e) => e.state.kind === 'journey')).toBe(false);
  });

  it('falls back to the most recently started unfinished Journey', async () => {
    mockPaths.lastOpened = null;
    mockPaths.progress = {
      path_trusting_the_results: progress('path_trusting_the_results', { startDate: 100 }),
      path_screen_detox: progress('path_screen_detox', { startDate: 200, currentDay: 2 }),
      path_salah_transformation: progress('path_salah_transformation', { startDate: 300, isCompleted: true }),
    };
    await service.refresh();
    expect(stateAt(TODAY, 13)).toMatchObject({ kind: 'journey', kicker: 'Screen Detox', dayLabel: 'Day 2 of 7' });
  });

  it('falls back when the last opened Journey is finished', async () => {
    mockPaths.lastOpened = 'path_salah_transformation';
    mockPaths.progress = {
      path_salah_transformation: progress('path_salah_transformation', { isCompleted: true }),
      path_screen_detox: progress('path_screen_detox', { currentDay: 2 }),
    };
    await service.refresh();
    expect(stateAt(TODAY, 13)).toMatchObject({ kind: 'journey', kicker: 'Screen Detox' });
  });

  it('a completed day hides the Journey for today only', async () => {
    mockPaths.lastOpened = 'path_trusting_the_results';
    mockPaths.progress = { path_trusting_the_results: progress('path_trusting_the_results') };
    await service.onJourneyDayCompleted('path_trusting_the_results');
    expect(stateAt(TODAY, 13).kind).toBe('gentle');
    expect(stateAt(TOMORROW, 13).kind).toBe('journey');
  });

  it('a day completed on another Journey does not hide this one', async () => {
    mockPaths.lastOpened = 'path_trusting_the_results';
    mockPaths.progress = { path_trusting_the_results: progress('path_trusting_the_results') };
    await service.onJourneyDayCompleted('path_screen_detox');
    expect(stateAt(TODAY, 13).kind).toBe('journey');
  });

  it('stored prayer times set the boundaries', async () => {
    const day = { Fajr: '05:10', Sunrise: '06:30', Dhuhr: '12:05', Asr: '15:20', Maghrib: '17:40', Isha: '19:00' };
    await service.setTimings(Array(7).fill(day));
    const m = localMidnight(TODAY);
    expect(written().entries.slice(0, 4).map((e) => e.at)).toEqual([
      m,
      m + 5 * 3600 + 10 * 60,
      m + 12 * 3600 + 5 * 60,
      m + 17 * 3600 + 40 * 60,
    ]);
  });

  it('timings stored on an earlier day are read from that day on', async () => {
    const day = { Fajr: '05:10', Sunrise: '06:30', Dhuhr: '12:05', Asr: '15:20', Maghrib: '17:40', Isha: '19:00' };
    mockStore[WIDGET_TIMINGS_KEY] = JSON.stringify({ firstDay: '2026-11-11', weekly: Array(7).fill(day) });
    await service.refresh();
    const m = localMidnight(TODAY);
    expect(written().entries[1].at).toBe(m + 5 * 3600 + 10 * 60);
  });

  it('getTodaysCheckIn returns null for another day', async () => {
    mockStore[WIDGET_CHECKIN_KEY] = JSON.stringify({ dateKey: '2026-11-11', mood: 'Sad', experience: experience() });
    await expect(service.getTodaysCheckIn()).resolves.toBeNull();
    mockStore[WIDGET_CHECKIN_KEY] = JSON.stringify({ dateKey: TODAY, mood: 'Sad', experience: experience() });
    await expect(service.getTodaysCheckIn()).resolves.toMatchObject({ mood: 'Sad' });
  });

  it('getRunningJourney returns the running Journey and its progress', async () => {
    mockPaths.lastOpened = 'path_trusting_the_results';
    mockPaths.progress = { path_trusting_the_results: progress('path_trusting_the_results') };
    await expect(service.getRunningJourney()).resolves.toEqual({
      pathId: 'path_trusting_the_results',
      progress: progress('path_trusting_the_results'),
    });
  });

  it('forget removes everything it kept and clears the widget', async () => {
    await service.onCheckIn(experience(), 'Sad');
    await service.onJourneyDayCompleted('path_trusting_the_results');
    await service.setTimings([]);
    expect(Object.keys(mockStore).sort()).toEqual(
      [WIDGET_CHECKIN_KEY, WIDGET_JOURNEY_DONE_KEY, WIDGET_TIMINGS_KEY].sort(),
    );
    await service.forget();
    // Only the latch is left: no check-in, Journey or timings.
    expect(Object.keys(mockStore)).toEqual([WIDGET_FORGOTTEN_KEY]);
    expect(mockNative.clearWidgetSnapshot).toHaveBeenCalledTimes(1);
  });

  describe('after sign-out or account deletion', () => {
    // Journey progress lives in SQLite and survives sign-out, and an offline
    // sign-out can leave the cached subscription saying Pro. Without a latch
    // the next refresh (background top-up, cold start) rebuilt the departed
    // account's Journey onto the widget.
    beforeEach(() => {
      mockPaths.lastOpened = 'path_trusting_the_results';
      mockPaths.progress = { path_trusting_the_results: progress('path_trusting_the_results') };
    });

    it('a refresh while Pro is still cached writes only the locked state', async () => {
      await service.forget();
      await service.refresh();
      await service.setTimings([]);
      expect(written()).toEqual(lockedSnapshot());
    });

    it('a check-in before a new session starts is not kept either', async () => {
      await service.forget();
      await service.onCheckIn(experience(), 'Sad');
      expect(written()).toEqual(lockedSnapshot());
      expect(mockStore[WIDGET_CHECKIN_KEY]).toBeUndefined();
    });

    it('the latch survives an app restart', async () => {
      await service.forget();
      const afterRestart = new (WidgetService as unknown as { new (): WidgetService })();
      await afterRestart.refresh();
      expect(written()).toEqual(lockedSnapshot());
    });

    it('a new session lifts it and the widget shows the day again', async () => {
      await service.forget();
      await service.resume();
      expect(stateAt(TODAY, 13)).toMatchObject({ kind: 'journey' });
    });
  });

  it('nothing throws', async () => {
    mockNative.writeWidgetSnapshot.mockImplementation(() => {
      throw new Error('native');
    });
    mockStorageFails.on = true;
    await expect(service.refresh()).resolves.toBeUndefined();
    await expect(service.onCheckIn(experience(), 'Sad')).resolves.toBeUndefined();
    await expect(service.onJourneyDayCompleted('path_trusting_the_results')).resolves.toBeUndefined();
    await expect(service.setTimings([])).resolves.toBeUndefined();
    await expect(service.forget()).resolves.toBeUndefined();
    await expect(service.resume()).resolves.toBeUndefined();
    await expect(service.getTodaysCheckIn()).resolves.toBeNull();
    await expect(service.getRunningJourney()).resolves.toBeNull();
  });

  it('is a singleton', () => {
    expect(WidgetService.getInstance()).toBe(WidgetService.getInstance());
  });
});
