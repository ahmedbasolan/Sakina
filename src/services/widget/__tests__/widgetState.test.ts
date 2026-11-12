/**
 * The widget's state rules (spec: docs/superpowers/specs/
 * 2026-11-11-square-widget-design.md, "States"). One pure function decides
 * what the square shows; these tests are the spec's table, row by row.
 *
 * What this does NOT catch: whether the Swift side draws a state correctly,
 * whether the text fits the square (the widget swaps in `fallback` itself),
 * or whether the inputs gathered by WidgetService are right.
 */
import type { CardVerse } from '../../liveActivity/verseSnapshot';
import {
  LOCKED_STATE,
  WIDGET_COPY,
  WIDGET_URLS,
  widgetStateFor,
  type Moment,
  type WidgetInputs,
} from '../widgetState';

const TODAY = '2026-11-12';
const verse: CardVerse = { arabic: 'ARABIC', english: 'ENGLISH', ref: 'Ad-Duha 93:4', dateKey: TODAY };
const daily: CardVerse[] = [{ arabic: 'D-AR', english: 'D-EN', ref: 'Al-Baqarah 2:152', dateKey: TODAY }];
const checkIn = { dateKey: TODAY, question: 'QUESTION?', source: 'Ad-Duha 93:4' };
const journey = { title: 'Trusting the Results', day: 3, of: 7, dayTitle: 'Name the Fear', doneOn: null };
const base: WidgetInputs = { pro: true, cardOn: true, checkIn, mood: verse, daily, journey };

const stateFor = (over: Partial<WidgetInputs>, moment: Moment) =>
  widgetStateFor({ ...base, ...over }, TODAY, moment);
const kind = (over: Partial<WidgetInputs>, moment: Moment) => stateFor(over, moment).kind;

const MOMENTS: Moment[] = ['night', 'morning', 'afternoon', 'evening'];

describe('widgetStateFor', () => {
  // [inputs changed from base, moment, expected kind] — the spec's rows 1–10.
  it.each([
    [{ pro: false }, 'morning', 'locked'],
    [{ checkIn: null }, 'morning', 'checkin'],
    [{ checkIn: null }, 'afternoon', 'journey'],
    [{ checkIn: null, journey: null }, 'afternoon', 'gentle'],
    [{ checkIn: null }, 'evening', 'gentle'],
    [{ checkIn: null }, 'night', 'gentle'],
    [{}, 'evening', 'reflection'],
    [{}, 'night', 'reflection'],
    [{ cardOn: false }, 'morning', 'verse'],
    [{ cardOn: false }, 'afternoon', 'journey'],
    [{}, 'morning', 'journey'],
    [{ cardOn: false, journey: null }, 'afternoon', 'verse'],
    [{ journey: null }, 'morning', 'reflection'],
    [{ journey: { ...journey, doneOn: TODAY } }, 'afternoon', 'reflection'],
    [{ cardOn: false, journey: { ...journey, doneOn: TODAY } }, 'afternoon', 'verse'],
    [{ checkIn: { ...checkIn, dateKey: '2026-11-11' } }, 'morning', 'checkin'],
  ] as const)('%j at %s shows %s', (over, moment, expected) => {
    expect(kind(over as Partial<WidgetInputs>, moment)).toBe(expected);
  });

  it('is locked for a non-Pro user at every moment, whatever else is true', () => {
    for (const moment of MOMENTS) expect(stateFor({ pro: false }, moment)).toEqual(LOCKED_STATE);
    expect(LOCKED_STATE).toEqual({
      kind: 'locked',
      kicker: 'Sakina Pro',
      text: 'Your day with Sakina, on your Home Screen.',
      url: 'sakina://pro',
    });
  });

  it('asks the question in the morning only', () => {
    expect(stateFor({ checkIn: null }, 'morning')).toEqual({
      kind: 'checkin',
      text: 'How is your heart today?',
      sub: 'A verse for how you feel.',
      url: 'sakina://check-in',
    });
  });

  it('the question never shows after Dhuhr', () => {
    for (const moment of ['afternoon', 'evening', 'night'] as const) {
      expect(kind({ checkIn: null }, moment)).not.toBe('checkin');
      expect(kind({ checkIn: null, journey: null }, moment)).not.toBe('checkin');
    }
  });

  it('gentle uses the night line in the evening and at night, the day line in the afternoon', () => {
    const off = { checkIn: null, journey: null };
    expect(stateFor(off, 'afternoon')).toEqual({ kind: 'gentle', text: 'Whenever you are ready, Sakina is here.' });
    expect(stateFor(off, 'evening')).toEqual({ kind: 'gentle', text: 'A quiet moment with Allah before you sleep.' });
    expect(stateFor(off, 'night')).toEqual({ kind: 'gentle', text: 'A quiet moment with Allah before you sleep.' });
  });

  it('reflection carries the question, its source line and the fallback', () => {
    expect(stateFor({}, 'evening')).toEqual({
      kind: 'reflection',
      kicker: 'To reflect on tonight',
      question: 'QUESTION?',
      ref: '— on Ad-Duha 93:4',
      fallback: 'A question is waiting for you.',
      url: 'sakina://widget/reflect',
    });
    expect(stateFor({ journey: null }, 'morning')).toMatchObject({
      kind: 'reflection',
      kicker: 'To carry with you today',
    });
  });

  it('verse carries the complete ayah, its reference line and the fallback', () => {
    expect(stateFor({ cardOn: false }, 'morning')).toEqual({
      kind: 'verse',
      kicker: 'Your verse today',
      arabic: 'ARABIC',
      english: 'ENGLISH',
      ref: '— Ad-Duha 93:4',
      fallback: 'Your verse is waiting for you.',
      url: 'sakina://widget/verse',
    });
  });

  it('journey, named', () => {
    expect(stateFor({}, 'morning')).toEqual({
      kind: 'journey',
      kicker: 'Trusting the Results',
      dayLabel: 'Day 3 of 7',
      title: 'Name the Fear',
      day: 3,
      of: 7,
      url: 'sakina://widget/journey',
    });
  });

  it('journey, sensitive: no title and no day title', () => {
    expect(stateFor({ journey: { ...journey, title: null, dayTitle: null } }, 'morning')).toEqual({
      kind: 'journey',
      kicker: 'Your Journey',
      dayLabel: 'Day 3 of 7',
      title: "Today's step is ready.",
      day: 3,
      of: 7,
      url: 'sakina://widget/journey',
    });
  });

  it('a Journey with only one of its two names missing is still treated as sensitive', () => {
    const half = stateFor({ journey: { ...journey, dayTitle: null } }, 'morning');
    expect(half).toMatchObject({ kicker: 'Your Journey', title: "Today's step is ready." });
    const otherHalf = stateFor({ journey: { ...journey, title: null } }, 'morning');
    expect(otherHalf).toMatchObject({ kicker: 'Your Journey', title: "Today's step is ready." });
  });

  it('no question: gentle with the card on, the verse with it off', () => {
    const none = { checkIn: { ...checkIn, question: null }, journey: null };
    expect(stateFor(none, 'evening')).toEqual({ kind: 'gentle', text: WIDGET_COPY.gentleNight });
    expect(stateFor(none, 'morning')).toEqual({ kind: 'gentle', text: WIDGET_COPY.gentleDay });
    expect(kind({ ...none, cardOn: false }, 'evening')).toBe('verse');
  });

  it('non-Quran check-in: the verse is the daily one, the reflection cites the hadith', () => {
    const hadith = { mood: null, checkIn: { ...checkIn, source: 'Sahih Bukhari 6116' }, journey: null };
    expect(stateFor({ ...hadith, cardOn: false }, 'morning')).toMatchObject({
      kind: 'verse',
      arabic: 'D-AR',
      english: 'D-EN',
      ref: '— Al-Baqarah 2:152',
    });
    expect(stateFor(hadith, 'evening')).toMatchObject({ kind: 'reflection', ref: '— on Sahih Bukhari 6116' });
  });

  it('a mood verse from another day is not shown as today’s', () => {
    const stale = { cardOn: false, journey: null, mood: { ...verse, dateKey: '2026-11-11' } };
    expect(stateFor(stale, 'morning')).toMatchObject({ kind: 'verse', arabic: 'D-AR' });
  });

  it('no verse for the day: gentle, never an empty verse', () => {
    const none = { cardOn: false, journey: null, mood: null, daily: [] };
    expect(stateFor(none, 'morning')).toEqual({ kind: 'gentle', text: WIDGET_COPY.gentleDay });
    expect(stateFor({ ...none, checkIn: { ...checkIn, question: null } }, 'evening')).toEqual({
      kind: 'gentle',
      text: WIDGET_COPY.gentleNight,
    });
  });

  it('text is passed through untouched', () => {
    const long = `  ${'x'.repeat(600)}  `;
    const v = stateFor({ cardOn: false, mood: { ...verse, arabic: long, english: long } }, 'morning');
    expect(v.kind === 'verse' && v.arabic).toBe(long);
    expect(v.kind === 'verse' && v.english).toBe(long);
    const r = stateFor({ checkIn: { ...checkIn, question: long } }, 'evening');
    expect(r.kind === 'reflection' && r.question).toBe(long);
  });

  it('every fixed string is from the copy table and none of them judges', () => {
    const strings = Object.values(WIDGET_COPY);
    expect(strings).toHaveLength(13);
    for (const s of strings) {
      expect(s).not.toMatch(/miss|skip|forgot|haven't|didn't|still/i);
    }
  });

  it('every tap target is a sakina:// link', () => {
    for (const url of Object.values(WIDGET_URLS)) expect(url).toMatch(/^sakina:\/\/[a-z/-]+$/);
  });
});
