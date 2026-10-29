import { parseRegister } from '../../../../supabase/functions/_shared/registerValidation';

const NOW = Date.UTC(2026, 9, 29, 6, 0, 0) / 1000;
const DAY_S = 86400;
const DEVICE = '3f2b8c1e-5d4a-4b7e-9a10-6c2d8e4f1a77';

const FIVE = [
  { name: 'Fajr', at: NOW + 3600 },
  { name: 'Dhuhr', at: NOW + 3600 * 7 },
  { name: 'Asr', at: NOW + 3600 * 10 },
  { name: 'Maghrib', at: NOW + 3600 * 13 },
  { name: 'Isha', at: NOW + 3600 * 14 },
];

function register(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    action: 'register',
    deviceId: DEVICE,
    rcAppUserId: '$RCAnonymousID:abc123',
    apnsEnv: 'sandbox',
    timeZone: 'Asia/Dubai',
    schedule: FIVE,
    ...overrides,
  };
}

function expectError(result: ReturnType<typeof parseRegister>): string {
  expect(result.ok).toBe(false);
  return result.ok ? '' : result.error;
}

describe('parseRegister', () => {
  describe('register', () => {
    it('accepts exactly what the app sends', () => {
      const result = parseRegister(register(), NOW);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.action === 'register') {
        expect(result.value.deviceId).toBe(DEVICE);
        expect(result.value.apnsEnv).toBe('sandbox');
        expect(result.value.schedule).toHaveLength(5);
      }
    });

    it('accepts production as apnsEnv', () => {
      expect(parseRegister(register({ apnsEnv: 'production' }), NOW).ok).toBe(true);
    });

    it('rejects an apnsEnv outside sandbox and production', () => {
      for (const apnsEnv of ['development', 'Production', '', 'prod', 1, null, undefined]) {
        expectError(parseRegister(register({ apnsEnv }), NOW));
      }
    });

    it('rejects extra keys like latitude', () => {
      const error = expectError(parseRegister(register({ latitude: 25.2, longitude: 55.3 }), NOW));
      expect(error).toMatch(/latitude/);
    });

    it('rejects a missing required field', () => {
      for (const key of ['deviceId', 'rcAppUserId', 'apnsEnv', 'timeZone', 'schedule']) {
        const body = register();
        delete body[key];
        expectError(parseRegister(body, NOW));
      }
    });

    it('rejects a deviceId that is not a UUID', () => {
      expectError(parseRegister(register({ deviceId: 'not-a-uuid' }), NOW));
      expectError(parseRegister(register({ deviceId: DEVICE + 'x' }), NOW));
    });

    it('rejects a non-increasing schedule', () => {
      const equal = [FIVE[0], { name: 'Dhuhr', at: FIVE[0].at }];
      const backwards = [FIVE[1], FIVE[0]];
      expectError(parseRegister(register({ schedule: equal }), NOW));
      expectError(parseRegister(register({ schedule: backwards }), NOW));
    });

    it('rejects schedules beyond 8 days', () => {
      const late = [{ name: 'Fajr', at: NOW + 8 * DAY_S + 1 }];
      expectError(parseRegister(register({ schedule: late }), NOW));
      const edge = [{ name: 'Fajr', at: NOW + 8 * DAY_S }];
      expect(parseRegister(register({ schedule: edge }), NOW).ok).toBe(true);
    });

    it('rejects entries more than a day in the past', () => {
      const old = [{ name: 'Fajr', at: NOW - DAY_S - 1 }];
      expectError(parseRegister(register({ schedule: old }), NOW));
      const edge = [{ name: 'Fajr', at: NOW - DAY_S }];
      expect(parseRegister(register({ schedule: edge }), NOW).ok).toBe(true);
    });

    it('rejects more than 40 schedule entries', () => {
      const many = Array.from({ length: 41 }, (_, i) => ({ name: 'Fajr', at: NOW + i * 60 }));
      expectError(parseRegister(register({ schedule: many }), NOW));
      expect(parseRegister(register({ schedule: many.slice(0, 40) }), NOW).ok).toBe(true);
    });

    it('rejects an unknown prayer name, a non-integer time and extra entry keys', () => {
      expectError(parseRegister(register({ schedule: [{ name: 'Duha', at: NOW + 60 }] }), NOW));
      expectError(parseRegister(register({ schedule: [{ name: 'Fajr', at: NOW + 60.5 }] }), NOW));
      expectError(parseRegister(register({ schedule: [{ name: 'Fajr', at: '1' }] }), NOW));
      expectError(
        parseRegister(register({ schedule: [{ name: 'Fajr', at: NOW + 60, city: 'x' }] }), NOW),
      );
      expectError(parseRegister(register({ schedule: 'Fajr' }), NOW));
    });

    it('rejects oversized strings', () => {
      expectError(parseRegister(register({ rcAppUserId: 'a'.repeat(201) }), NOW));
      expectError(parseRegister(register({ rcAppUserId: '' }), NOW));
      expectError(parseRegister(register({ timeZone: 'x'.repeat(65) }), NOW));
    });
  });

  describe('unregister', () => {
    it('accepts the app unregister shape', () => {
      const result = parseRegister({ action: 'unregister', deviceId: DEVICE }, NOW);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.action).toBe('unregister');
    });

    it('rejects extra keys and a bad deviceId', () => {
      expectError(parseRegister({ action: 'unregister', deviceId: DEVICE, schedule: [] }, NOW));
      expectError(parseRegister({ action: 'unregister', deviceId: 'nope' }, NOW));
      expectError(parseRegister({ action: 'unregister' }, NOW));
    });
  });

  describe('token', () => {
    it('accepts a native token post without schedule', () => {
      const result = parseRegister(
        { action: 'token', deviceId: DEVICE, pushToStartToken: 'ab12cd34ef' },
        NOW,
      );
      expect(result.ok).toBe(true);
      if (result.ok && result.value.action === 'token') {
        expect(result.value.pushToStartToken).toBe('ab12cd34ef');
        expect(result.value.activityToken).toBeUndefined();
      }
    });

    it('accepts an activity token with the start time the native side sends', () => {
      const startedAt = NOW - 120.456;
      const result = parseRegister(
        { action: 'token', deviceId: DEVICE, activityToken: 'AB12cd', activityStartedAt: startedAt },
        NOW,
      );
      expect(result.ok).toBe(true);
      if (result.ok && result.value.action === 'token') {
        expect(result.value.activityStartedAt).toBe(startedAt);
      }
    });

    it('rejects a post that carries no token', () => {
      expectError(parseRegister({ action: 'token', deviceId: DEVICE }, NOW));
      expectError(
        parseRegister({ action: 'token', deviceId: DEVICE, activityStartedAt: NOW - 5 }, NOW),
      );
    });

    it('rejects non-hex and over-long tokens', () => {
      expectError(parseRegister({ action: 'token', deviceId: DEVICE, activityToken: 'xyz' }, NOW));
      expectError(parseRegister({ action: 'token', deviceId: DEVICE, activityToken: '' }, NOW));
      expectError(
        parseRegister({ action: 'token', deviceId: DEVICE, pushToStartToken: 'a'.repeat(201) }, NOW),
      );
      expect(
        parseRegister({ action: 'token', deviceId: DEVICE, pushToStartToken: 'a'.repeat(200) }, NOW).ok,
      ).toBe(true);
    });

    it('rejects a bad activityStartedAt and extra keys', () => {
      const base = { action: 'token', deviceId: DEVICE, activityToken: 'ab' };
      expectError(parseRegister({ ...base, activityStartedAt: 'now' }, NOW));
      expectError(parseRegister({ ...base, activityStartedAt: NaN }, NOW));
      expectError(parseRegister({ ...base, activityStartedAt: -1 }, NOW));
      expectError(parseRegister({ ...base, activityStartedAt: NOW + 2 * DAY_S }, NOW));
      expectError(parseRegister({ ...base, schedule: FIVE }, NOW));
      expectError(parseRegister({ ...base, latitude: 1 }, NOW));
    });
  });

  describe('envelope', () => {
    it('rejects non-objects and unknown actions', () => {
      for (const body of [null, undefined, 'x', 5, [], [{ action: 'register' }]]) {
        expectError(parseRegister(body, NOW));
      }
      expectError(parseRegister({ action: 'delete', deviceId: DEVICE }, NOW));
      expectError(parseRegister({ deviceId: DEVICE }, NOW));
    });
  });
});
