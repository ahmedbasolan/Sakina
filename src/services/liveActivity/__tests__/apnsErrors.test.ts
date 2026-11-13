import { classifyApnsError } from '../../../../supabase/functions/_shared/apnsErrors';

const kind = (status: number, reason: string) => classifyApnsError(status, reason).kind;

describe('classifyApnsError', () => {
  it('a dead device token is dropped', () => {
    expect(kind(410, 'Unregistered')).toBe('badToken');
    expect(kind(410, 'ExpiredToken')).toBe('badToken');
    expect(kind(410, 'unknown')).toBe('badToken');
    expect(kind(400, 'BadDeviceToken')).toBe('badToken');
    expect(kind(400, 'DeviceTokenNotForTopic')).toBe('badToken');
  });

  it('a rejected provider token halts the run and discards the JWT', () => {
    for (const reason of ['ExpiredProviderToken', 'InvalidProviderToken']) {
      expect(classifyApnsError(403, reason)).toEqual({ kind: 'halt', discardJwt: true });
    }
  });

  it('other provider-wide reasons halt without discarding the JWT', () => {
    expect(classifyApnsError(429, 'TooManyProviderTokenUpdates')).toEqual({ kind: 'halt', discardJwt: false });
    for (const reason of [
      'BadTopic',
      'TopicDisallowed',
      'MissingTopic',
      'BadCertificate',
      'BadCertificateEnvironment',
      'MissingProviderToken',
    ]) {
      expect(classifyApnsError(400, reason)).toEqual({ kind: 'halt', discardJwt: false });
      expect(classifyApnsError(403, reason)).toEqual({ kind: 'halt', discardJwt: false });
    }
  });

  it('transient failures retry next run', () => {
    expect(kind(429, 'TooManyRequests')).toBe('retry');
    expect(kind(500, 'InternalServerError')).toBe('retry');
    expect(kind(503, 'ServiceUnavailable')).toBe('retry');
    expect(kind(503, 'unknown')).toBe('retry');
  });

  it('any other 4xx is about this row: back it off, never halt everyone', () => {
    for (const [status, reason] of [
      [400, 'BadExpirationDate'],
      [400, 'BadPriority'],
      [400, 'BadCollapseId'],
      [400, 'unknown'],
      [403, 'Forbidden'],
      [404, 'BadPath'],
      [405, 'MethodNotAllowed'],
      [413, 'PayloadTooLarge'],
      [418, 'SomethingNew'],
    ] as const) {
      expect(classifyApnsError(status, reason)).toEqual({ kind: 'backoff', discardJwt: false });
    }
  });

  it('a provider-wide reason under an unexpected status is not provider-wide', () => {
    // Only Apple's documented pairing halts: a 404 saying BadTopic is per-row.
    expect(kind(404, 'BadTopic')).toBe('backoff');
    expect(kind(400, 'ExpiredProviderToken')).toBe('backoff');
  });
});
