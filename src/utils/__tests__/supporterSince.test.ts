/**
 * WHAT THIS DOES NOT CATCH: whether RevenueCat reports the date we expect
 * for a promotional grant or a family-shared purchase — only that a missing
 * or nonsense value never reaches the screen as a date.
 */
import { supporterSinceMs } from '../supporterSince';

describe('supporterSinceMs', () => {
  it('passes a real purchase time through', () => {
    expect(supporterSinceMs({ originalPurchaseDateMillis: 1788000000000 })).toBe(1788000000000);
  });
  it.each([undefined, {}, { originalPurchaseDateMillis: 0 }, { originalPurchaseDateMillis: null }, { originalPurchaseDateMillis: NaN }])(
    'returns undefined for %p',
    (e) => {
      expect(supporterSinceMs(e as any)).toBeUndefined();
    },
  );
});
