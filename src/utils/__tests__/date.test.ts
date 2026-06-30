import { formatDateDMY } from '../date';

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
