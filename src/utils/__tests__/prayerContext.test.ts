import { getSpiritualWindowName, getSpiritualActionText } from '../prayerContext';
import { PrayerContext } from '../../types';

describe('getSpiritualWindowName', () => {
  const cases: [PrayerContext, string][] = [
    ['fajr_pre', 'The Deep Night (Tahajjud)'],
    ['fajr_post', 'The Morning Light'],
    ['dhuhr', 'The High Zenith'],
    ['asr', 'The Golden Hour'],
    ['maghrib_pre', 'The Approach of Night'],
    ['maghrib_post', 'The Evening Glow'],
    ['isha', 'The Peace of Night'],
  ];

  it.each(cases)('maps %s to its window name', (context, expected) => {
    expect(getSpiritualWindowName(context)).toBe(expected);
  });

  it('falls back to a generic label for the general context', () => {
    expect(getSpiritualWindowName('general')).toBe('A Moment of Reflection');
  });
});

describe('getSpiritualActionText', () => {
  const cases: [PrayerContext, string][] = [
    ['fajr_pre', 'Guided Tahajjud Reflection'],
    ['fajr_post', 'Morning Protection Adhkar'],
    ['dhuhr', 'Mid-day Spiritual Break'],
    ['asr', 'The Golden Hour Remembrance'],
    ['maghrib_pre', 'Evening Protection Adhkar'],
    ['maghrib_post', 'Post-Maghrib Gratitude'],
    ['isha', 'Nightly Habit & Reflection'],
  ];

  it.each(cases)('maps %s to its action text', (context, expected) => {
    expect(getSpiritualActionText(context)).toBe(expected);
  });

  it('falls back to a generic label for the general context', () => {
    expect(getSpiritualActionText('general')).toBe('Explore Guidance');
  });
});
