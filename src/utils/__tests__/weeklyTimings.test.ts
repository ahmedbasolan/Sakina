import { toWeeklyTimings } from '../weeklyTimings';
import type { PrayerTimings } from '../../services/prayerTimesService';

const day = (fajr: string): PrayerTimings => ({
  Fajr: fajr, Sunrise: '05:30', Dhuhr: '12:00', Asr: '15:30', Maghrib: '18:00', Isha: '19:30',
});

describe('toWeeklyTimings', () => {
  it('repeats a single day seven times (the city path)', () => {
    const one = day('04:00');
    const week = toWeeklyTimings(one);
    expect(week).toHaveLength(7);
    week.forEach((d) => expect(d).toBe(one));
  });

  it('keeps a full week as is, and trims anything longer', () => {
    const week = Array.from({ length: 9 }, (_, i) => day(`04:0${i}`));
    expect(toWeeklyTimings(week)).toEqual(week.slice(0, 7));
  });

  it('pads a short week with its last day', () => {
    const short = [day('04:00'), day('04:01')];
    const week = toWeeklyTimings(short);
    expect(week).toHaveLength(7);
    expect(week[1]).toBe(short[1]);
    expect(week[6]).toBe(short[1]);
  });

  it('returns an empty week for an empty array', () => {
    expect(toWeeklyTimings([])).toEqual([]);
  });
});
