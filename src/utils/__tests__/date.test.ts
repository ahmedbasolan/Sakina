import { formatDateDMY, dayOfYear } from '../date';

describe('formatDateDMY', () => {
  it('formats a date as DD-MM-YYYY', () => {
    expect(formatDateDMY(new Date(2026, 5, 30))).toBe('30-06-2026');
  });

  it('pads single-digit day and month with leading zeros', () => {
    expect(formatDateDMY(new Date(2026, 0, 5))).toBe('05-01-2026');
  });

  it('defaults to today when no argument given', () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    expect(formatDateDMY()).toBe(`${d}-${m}-${y}`);
  });
});

describe('dayOfYear', () => {
  it('returns 1 for January 1st', () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1);
  });

  it('counts correctly into a non-leap year (2026)', () => {
    // 31 (Jan) + 28 (Feb) + 15 = 74
    expect(dayOfYear(new Date(2026, 2, 15))).toBe(74);
    expect(dayOfYear(new Date(2026, 11, 31))).toBe(365);
  });

  it('accounts for the leap day in a leap year (2028)', () => {
    expect(dayOfYear(new Date(2028, 11, 31))).toBe(366);
  });

  // The whole point of computing this via Date.UTC on the Y/M/D fields
  // instead of dividing a raw millisecond gap by 86400000 is that it can't
  // be nudged off by a DST transition — these two properties are what a
  // millisecond-division implementation can get wrong.
  it('is unaffected by time-of-day (same calendar day, different clock time)', () => {
    expect(dayOfYear(new Date(2026, 5, 15, 0, 1))).toBe(dayOfYear(new Date(2026, 5, 15, 23, 59)));
  });

  it('increases by exactly 1 across consecutive calendar days', () => {
    expect(dayOfYear(new Date(2026, 5, 16))).toBe(dayOfYear(new Date(2026, 5, 15)) + 1);
  });
});
