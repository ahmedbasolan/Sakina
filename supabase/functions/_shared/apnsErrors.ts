// What the dispatcher does with one APNs error response. Pure: the Deno dispatcher
// and the Jest suite load this exact file. No imports.
//
// Status codes and reason strings read from Apple's "Handling notification responses
// from APNs" (fetched 2026-11-02). The question for each is: would EVERY device fail
// the same way (our provider token, topic or certificate), or only this one?
//
//   badToken — this token is dead: 410 (Unregistered / ExpiredToken), 400
//              BadDeviceToken, 400 DeviceTokenNotForTopic. The caller drops it.
//   halt     — provider-wide: our provider token (403 ExpiredProviderToken /
//              InvalidProviderToken, 429 TooManyProviderTokenUpdates, 403
//              MissingProviderToken), our topic (400 BadTopic / TopicDisallowed /
//              MissingTopic) or certificate (403 BadCertificate /
//              BadCertificateEnvironment). Every other device would get the same
//              answer, so the run stops sending. `discardJwt` is set when APNs
//              refused the provider token itself, so the next run signs a new one.
//   retry    — transient: 429 TooManyRequests (this device token, too fast) and
//              every 5xx. The row is due again on the next run.
//   backoff  — every other response (any other 4xx, and anything unexpected):
//              something about THIS request or row. It must not stop the run for
//              everyone — one odd row once halted every send — and must not be
//              hammered every minute either (Apple: 4xx responses slow a provider
//              down and too many get the connection closed), so the row waits
//              BACKOFF_S (dispatchPlan.ts, which plans that write) and is tried
//              again.
//
// What this does NOT catch: a reason Apple adds later is a per-row backoff until it
// is listed here, even if it is provider-wide; a provider-wide fault reported with an
// unlisted reason (e.g. 400 BadPriority from a payload bug, 413 PayloadTooLarge)
// backs off every row one by one instead of halting the run. Both fail safe —
// nothing is sent wrongly, rows just wait — and both show in the run's counts as
// `apns_<status>_<reason>`.

export type ApnsErrorKind = 'badToken' | 'halt' | 'retry' | 'backoff';

export interface ApnsErrorClass {
  kind: ApnsErrorKind;
  discardJwt: boolean;
}

const PROVIDER_TOKEN_REJECTED = new Set(['ExpiredProviderToken', 'InvalidProviderToken']);

// Reasons that mean every device would fail: provider token, topic, certificate.
// Matched on 400 or 403 only (Apple sends these under one of the two).
const PROVIDER_WIDE = new Set([
  'BadTopic',
  'TopicDisallowed',
  'MissingTopic',
  'BadCertificate',
  'BadCertificateEnvironment',
  'MissingProviderToken',
]);

const BAD_TOKEN_400 = new Set(['BadDeviceToken', 'DeviceTokenNotForTopic']);

/** `reason` is APNs's `reason` string from the JSON body ('' or 'unknown' when absent). */
export function classifyApnsError(status: number, reason: string): ApnsErrorClass {
  const is = (kind: ApnsErrorKind, discardJwt = false): ApnsErrorClass => ({ kind, discardJwt });

  if (status === 410) return is('badToken');
  if (status === 400 && BAD_TOKEN_400.has(reason)) return is('badToken');

  if (status === 403 && PROVIDER_TOKEN_REJECTED.has(reason)) return is('halt', true);
  if (status === 429 && reason === 'TooManyProviderTokenUpdates') return is('halt');
  if ((status === 400 || status === 403) && PROVIDER_WIDE.has(reason)) return is('halt');

  if (status === 429) return is('retry');
  if (status >= 500) return is('retry');

  return is('backoff');
}
