/**
 * Matching a purchased product to an offering package. On Google Play a
 * package's product id is `<subscriptionId>:<basePlanId>` while the
 * entitlement's productIdentifier is the bare subscription id; on iOS both
 * are the same string. A strict === matched nothing on Android, so every
 * Play monthly subscriber resolved to the 'yearly' fallback.
 *
 * WHAT THIS DOES NOT CATCH: two base plans under ONE Play subscription id
 * (Sakina uses separate subscriptions per duration, so it cannot happen
 * today) — the base-plan part is ignored.
 */
import { sameStoreProduct } from '../rcProductMatch';

describe('sameStoreProduct', () => {
  it('matches a Play package id to the bare entitlement id', () => {
    expect(sameStoreProduct('sakina_pro_monthly:monthly', 'sakina_pro_monthly')).toBe(true);
  });
  it('matches identical iOS ids', () => {
    expect(sameStoreProduct('sakina_pro_yearly', 'sakina_pro_yearly')).toBe(true);
  });
  it('does not match a different subscription', () => {
    expect(sameStoreProduct('sakina_pro_yearly:yearly', 'sakina_pro_monthly')).toBe(false);
    expect(sameStoreProduct('sakina_pro_monthly', 'sakina_pro_monthly_v2')).toBe(false);
  });
});
