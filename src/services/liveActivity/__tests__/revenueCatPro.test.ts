import { proFromSubscriber } from '../../../../supabase/functions/_shared/revenueCatPro';

const NOW = Date.UTC(2026, 10, 2, 12, 0) / 1000;
const iso = (s: number): string => new Date(s * 1000).toISOString().replace('.000Z', 'Z');

function body(entitlements: Record<string, unknown>): unknown {
  return { request_date: iso(NOW), subscriber: { entitlements, subscriptions: {} } };
}
const pro = (e: Record<string, unknown>) => body({ 'Sakina Pro': e });

describe('proFromSubscriber', () => {
  it('is Pro for a lifetime entitlement (expires_date null)', () => {
    expect(proFromSubscriber(pro({ expires_date: null, grace_period_expires_date: null }), NOW)).toBe(true);
  });

  it('is Pro while expires_date is in the future', () => {
    expect(proFromSubscriber(pro({ expires_date: iso(NOW + 60), grace_period_expires_date: null }), NOW)).toBe(true);
  });

  it('is not Pro once expires_date has passed', () => {
    expect(proFromSubscriber(pro({ expires_date: iso(NOW - 60), grace_period_expires_date: null }), NOW)).toBe(false);
  });

  it('is Pro during a billing grace period', () => {
    expect(
      proFromSubscriber(pro({ expires_date: iso(NOW - 60), grace_period_expires_date: iso(NOW + 3600) }), NOW),
    ).toBe(true);
  });

  it('is not Pro after the grace period too has passed', () => {
    expect(
      proFromSubscriber(pro({ expires_date: iso(NOW - 7200), grace_period_expires_date: iso(NOW - 60) }), NOW),
    ).toBe(false);
  });

  it('is not Pro without the Sakina Pro entitlement', () => {
    expect(proFromSubscriber(body({}), NOW)).toBe(false);
    expect(proFromSubscriber(body({ other: { expires_date: null } }), NOW)).toBe(false);
  });

  it('is unknown (null) for a body it cannot read, never false', () => {
    expect(proFromSubscriber(null, NOW)).toBeNull();
    expect(proFromSubscriber({}, NOW)).toBeNull();
    expect(proFromSubscriber({ subscriber: {} }, NOW)).toBeNull();
    expect(proFromSubscriber(pro({ expires_date: 'not a date' }), NOW)).toBeNull();
    expect(proFromSubscriber(pro({ expires_date: 12345 }), NOW)).toBeNull();
  });
});
