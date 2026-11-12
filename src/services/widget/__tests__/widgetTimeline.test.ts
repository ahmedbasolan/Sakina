/**
 * The widget's timeline: 30 days of finished entries, cut at the user's
 * prayer times (spec: "Data: what the app writes for the widget").
 *
 * What this does NOT catch: whether WidgetKit shows an entry at its instant,
 * what happens when the phone changes time zone with the app closed (entries
 * are fixed instants until the next rewrite), or anything about drawing.
 */
import type { ScheduledPrayer } from '../../../../supabase/functions/_shared/liveActivityPlan';
import type { CardVerse } from '../../liveActivity/verseSnapshot';
import { WIDGET_COPY, type WidgetInputs } from '../widgetState';
import {
  WIDGET_SNAPSHOT_KEY,
  addDays,
  buildWidgetSnapshot,
  dateKeyOf,
  clockDayTimes,
  dayTimesFromSchedule,
  localMidnight,
  lockedSnapshot,
  type DayTimes,
  type WidgetSnapshot,
} from '../widgetTimeline';

const TODAY = '2026-11-12';
const verse: CardVerse = { arabic: 'ARABIC', english: 'ENGLISH', ref: 'Ad-Duha 93:4', dateKey: TODAY };
const daily: CardVerse[] = [{ arabic: 'D-AR', english: 'D-EN', ref: 'Al-Baqarah 2:152', dateKey: TODAY }];
const checkIn = { dateKey: TODAY, question: 'QUESTION?', source: 'Ad-Duha 93:4' };
const journey = { title: 'Trusting the Results', day: 3, of: 7, dayTitle: 'Name the Fear', doneOn: null };
const base: WidgetInputs = { pro: true, cardOn: true, checkIn, mood: verse, daily, journey };
const NONE = new Map<string, DayTimes>();

/** The state in force `hour` hours into local day `key`. */
const kindAt = (s: WidgetSnapshot, key: string, hour: number) =>
  s.entries.filter((e) => e.at <= localMidnight(key) + hour * 3600).at(-1)!.state.kind;

describe('widget timeline', () => {
  it('uses the App Group key the Swift side reads', () => {
    expect(WIDGET_SNAPSHOT_KEY).toBe('sakina.widget.snapshot.v1');
  });

  it('a Pro snapshot has four entries a day for 30 days and one closing entry', () => {
    const s = buildWidgetSnapshot(base, TODAY, NONE);
    expect(s.version).toBe(1);
    expect(s.entries).toHaveLength(30 * 4 + 1);
    expect(s.entries[0].at).toBe(localMidnight(TODAY));
    for (let i = 1; i < s.entries.length; i++) {
      expect(s.entries[i].at).toBeGreaterThan(s.entries[i - 1].at);
    }
  });

  it('closes on the day-time gentle line at the start of day 31', () => {
    const last = buildWidgetSnapshot(base, TODAY, NONE).entries.at(-1)!;
    expect(last).toEqual({
      at: localMidnight(addDays(TODAY, 30)),
      state: { kind: 'gentle', text: WIDGET_COPY.gentleDay },
    });
  });

  it('not Pro is one locked entry', () => {
    expect(buildWidgetSnapshot({ ...base, pro: false }, TODAY, NONE)).toEqual(lockedSnapshot());
    expect(lockedSnapshot()).toEqual({
      version: 1,
      entries: [
        {
          at: 0,
          state: {
            kind: 'locked',
            kicker: 'Sakina Pro',
            text: 'Your day with Sakina, on your Home Screen.',
            url: 'sakina://pro',
          },
        },
      ],
    });
  });

  it('days 8 to 30 carry no Journey, verse or reflection', () => {
    const after = buildWidgetSnapshot({ ...base, cardOn: false }, TODAY, NONE).entries.filter(
      (e) => e.at >= localMidnight(addDays(TODAY, 7)),
    );
    expect(new Set(after.map((e) => e.state.kind))).toEqual(new Set(['checkin', 'gentle']));
  });

  it('day 7 still carries the Journey', () => {
    const s = buildWidgetSnapshot(base, TODAY, NONE);
    expect(kindAt(s, addDays(TODAY, 6), 13)).toBe('journey');
    expect(kindAt(s, addDays(TODAY, 7), 13)).toBe('gentle');
  });

  it("today's check-in does not carry into tomorrow", () => {
    const s = buildWidgetSnapshot({ ...base, journey: null }, TODAY, NONE);
    expect(kindAt(s, TODAY, 20)).toBe('reflection');
    expect(kindAt(s, addDays(TODAY, 1), 6)).toBe('checkin');
  });

  it('a Journey day finished today comes back tomorrow', () => {
    const s = buildWidgetSnapshot({ ...base, checkIn: null, journey: { ...journey, doneOn: TODAY } }, TODAY, NONE);
    expect(kindAt(s, TODAY, 13)).toBe('gentle');
    expect(kindAt(s, addDays(TODAY, 1), 13)).toBe('journey');
  });

  it('the small hours show the night state, the question only from Fajr', () => {
    const s = buildWidgetSnapshot({ ...base, checkIn: null, journey: null }, TODAY, NONE);
    expect(kindAt(s, TODAY, 2)).toBe('gentle');
    expect(kindAt(s, TODAY, 5)).toBe('checkin');
    expect(kindAt(s, TODAY, 12)).toBe('gentle');
  });

  it('uses the real prayer times for a day that has them', () => {
    const m = localMidnight(TODAY);
    const real = new Map<string, DayTimes>([
      [TODAY, { dateKey: TODAY, fajr: m + 4 * 3600 + 600, dhuhr: m + 11 * 3600, maghrib: m + 17 * 3600 }],
    ]);
    const s = buildWidgetSnapshot(base, TODAY, real);
    expect(s.entries.slice(0, 4).map((e) => e.at)).toEqual([m, m + 4 * 3600 + 600, m + 11 * 3600, m + 17 * 3600]);
    // The next day has no real times: 05:00, 12:00, 18:00.
    const t = localMidnight(addDays(TODAY, 1));
    expect(s.entries.slice(4, 8).map((e) => e.at)).toEqual([t, t + 5 * 3600, t + 12 * 3600, t + 18 * 3600]);
  });

  it.each([
    ['Fajr after Dhuhr', (m: number) => ({ fajr: m + 13 * 3600, dhuhr: m + 12 * 3600, maghrib: m + 18 * 3600 })],
    ['Maghrib before Dhuhr', (m: number) => ({ fajr: m + 5 * 3600, dhuhr: m + 12 * 3600, maghrib: m + 11 * 3600 })],
    ['Fajr before midnight', (m: number) => ({ fajr: m - 60, dhuhr: m + 12 * 3600, maghrib: m + 18 * 3600 })],
    ['Maghrib past the day', (m: number) => ({ fajr: m + 5 * 3600, dhuhr: m + 12 * 3600, maghrib: m + 25 * 3600 })],
    ['a time that is not a number', (m: number) => ({ fajr: NaN, dhuhr: m + 12 * 3600, maghrib: m + 18 * 3600 })],
  ])('falls back to 05:00, 12:00, 18:00 when a day has %s', (_name, times) => {
    const m = localMidnight(TODAY);
    const real = new Map<string, DayTimes>([[TODAY, { dateKey: TODAY, ...times(m) }]]);
    const s = buildWidgetSnapshot(base, TODAY, real);
    expect(s.entries.slice(0, 4).map((e) => e.at)).toEqual([m, m + 5 * 3600, m + 12 * 3600, m + 18 * 3600]);
    for (let i = 1; i < s.entries.length; i++) {
      expect(s.entries[i].at).toBeGreaterThan(s.entries[i - 1].at);
    }
  });

  it('clock times are 05:00, 12:00 and 18:00 local', () => {
    const m = localMidnight(TODAY);
    expect(clockDayTimes(TODAY)).toEqual({
      dateKey: TODAY,
      fajr: m + 5 * 3600,
      dhuhr: m + 12 * 3600,
      maghrib: m + 18 * 3600,
    });
  });

  it('date keys are local calendar days and roll over months and years', () => {
    expect(dateKeyOf(new Date(2026, 10, 12, 23, 59))).toBe('2026-11-12');
    expect(dateKeyOf(new Date(2026, 0, 5, 0, 0))).toBe('2026-01-05');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays(TODAY, 0)).toBe(TODAY);
    expect(dateKeyOf(new Date(localMidnight(TODAY) * 1000))).toBe(TODAY);
  });

  it('local midnight is 00:00 of that calendar day on this device', () => {
    expect(new Date(localMidnight(TODAY) * 1000).getHours()).toBe(0);
    expect(new Date(localMidnight(TODAY) * 1000).getDate()).toBe(12);
    expect(localMidnight(addDays(TODAY, 1))).toBeGreaterThan(localMidnight(TODAY));
  });

  it('groups a schedule by local day and drops a day missing one of the three', () => {
    const m = localMidnight(TODAY);
    const t = localMidnight(addDays(TODAY, 1));
    const schedule: ScheduledPrayer[] = [
      { name: 'Fajr', at: m + 5 * 3600 },
      { name: 'Dhuhr', at: m + 12 * 3600 },
      { name: 'Asr', at: m + 15 * 3600 },
      { name: 'Maghrib', at: m + 18 * 3600 },
      { name: 'Isha', at: m + 19 * 3600 },
      { name: 'Fajr', at: t + 5 * 3600 },
      { name: 'Maghrib', at: t + 18 * 3600 }, // no Dhuhr: an unparseable time was skipped
    ];
    const days = dayTimesFromSchedule(schedule);
    expect([...days.keys()]).toEqual([TODAY]);
    expect(days.get(TODAY)).toEqual({
      dateKey: TODAY,
      fajr: m + 5 * 3600,
      dhuhr: m + 12 * 3600,
      maghrib: m + 18 * 3600,
    });
    expect(dayTimesFromSchedule([]).size).toBe(0);
  });

  it('never writes the mood or the names of a sensitive Journey', () => {
    const json = JSON.stringify(
      buildWidgetSnapshot({ ...base, journey: { ...journey, title: null, dayTitle: null } }, TODAY, NONE),
    );
    expect(json).not.toContain('Trusting the Results');
    expect(json).not.toContain('Name the Fear');
    expect(json).not.toMatch(/"mood"/);
    expect(json).toContain('Your Journey');
  });

  it('survives JSON unchanged', () => {
    const s = buildWidgetSnapshot(base, TODAY, NONE);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('stays small', () => {
    const long = 'x'.repeat(2000);
    const s = buildWidgetSnapshot(
      { ...base, cardOn: false, mood: { ...verse, arabic: long, english: long }, checkIn: { ...checkIn, question: long } },
      TODAY,
      NONE,
    );
    expect(JSON.stringify(s).length).toBeLessThan(60_000);
  });
});
