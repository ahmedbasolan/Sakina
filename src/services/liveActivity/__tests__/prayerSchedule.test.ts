import { buildSchedule } from '../prayerSchedule';
import type { PrayerTimings } from '../../prayerTimesService';

const day = (over: Partial<PrayerTimings> = {}): PrayerTimings => ({
  Fajr: '04:30',
  Sunrise: '06:00',
  Dhuhr: '13:00',
  Asr: '16:30',
  Maghrib: '19:30',
  Isha: '21:00',
  ...over,
});

const HOUR = 3600;

describe('buildSchedule', () => {
  it('returns 35 strictly increasing instants for 7 days, no Sunrise', () => {
    const weekly = Array.from({ length: 7 }, () => day());
    const out = buildSchedule(weekly, new Date('2026-06-10T09:00:00Z'), 'Asia/Dubai');

    expect(out).toHaveLength(35);
    expect(out.some((p) => (p.name as string) === 'Sunrise')).toBe(false);
    expect(out.slice(0, 5).map((p) => p.name)).toEqual(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']);
    for (let i = 1; i < out.length; i++) {
      expect(out[i].at).toBeGreaterThan(out[i - 1].at);
    }
    // Dubai is UTC+4 with no DST: Fajr 04:30 on 2026-06-10 is 00:30Z.
    expect(out[0].at).toBe(Date.UTC(2026, 5, 10, 0, 30) / 1000);
  });

  it('Isha after midnight rolls to the next day', () => {
    const out = buildSchedule(
      [day({ Fajr: '03:00', Dhuhr: '13:20', Asr: '17:30', Maghrib: '22:50', Isha: '00:40' })],
      new Date('2026-06-21T10:00:00Z'),
      'Europe/Oslo',
    );
    const maghrib = out.find((p) => p.name === 'Maghrib')!.at;
    const isha = out.find((p) => p.name === 'Isha')!.at;
    expect(isha - maghrib).toBe(1 * HOUR + 50 * 60);
  });

  it("uses each day's own DST offset", () => {
    // Europe/London leaves BST on 2026-10-25 (clocks go back at 02:00 local).
    const weekly = [day(), day({ Fajr: '05:30' }), day({ Fajr: '05:30' })];
    const out = buildSchedule(weekly, new Date('2026-10-23T12:00:00Z'), 'Europe/London');
    const fajrs = out.filter((p) => p.name === 'Fajr').map((p) => p.at);

    expect(fajrs[1]).toBe(Date.UTC(2026, 9, 24, 4, 30) / 1000); // BST, UTC+1
    expect(fajrs[2]).toBe(Date.UTC(2026, 9, 25, 5, 30) / 1000); // GMT, UTC+0
    expect(fajrs[2] - fajrs[1]).toBe(24 * HOUR + 1 * HOUR);
  });

  it('strips Aladhan suffixes', () => {
    const out = buildSchedule(
      [day({ Fajr: '05:24 (BST)' })],
      new Date('2026-07-01T12:00:00Z'),
      'Europe/London',
    );
    expect(out[0].at).toBe(Date.UTC(2026, 6, 1, 4, 24) / 1000);
  });

  it('derives day 0 from the calendar date in the target time zone, not UTC', () => {
    // 2026-06-10 22:30Z is already 2026-06-11 in Dubai (UTC+4).
    const out = buildSchedule([day()], new Date('2026-06-10T22:30:00Z'), 'Asia/Dubai');
    expect(out[0].at).toBe(Date.UTC(2026, 5, 11, 0, 30) / 1000);
  });

  it('skips a malformed time without throwing and stays strictly increasing', () => {
    const out = buildSchedule(
      [day({ Asr: 'garbage' }), day({ Dhuhr: '' })],
      new Date('2026-06-10T09:00:00Z'),
      'Asia/Dubai',
    );
    expect(out).toHaveLength(8);
    expect(out.filter((p) => p.name === 'Asr')).toHaveLength(1);
    for (let i = 1; i < out.length; i++) {
      expect(out[i].at).toBeGreaterThan(out[i - 1].at);
    }
  });
});
