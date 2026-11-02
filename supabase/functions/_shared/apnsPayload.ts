// APNs request (headers + JSON body) for one Live Activity action. Pure: the Deno
// dispatcher and the Jest suite load this exact file. It imports only TYPES from its
// sibling (`import type`, erased at compile time — ruling R4).
//
// Read from Apple's "Starting and updating Live Activities with ActivityKit push
// notifications" (fetched 2026-11-02):
//   - `apns-push-type: liveactivity`; `apns-topic: <bundleID>.push-type.liveactivity`;
//     `apns-priority` 5 or 10, and 5 does not count toward the hourly budget.
//   - `timestamp` in seconds; `event` start / update / end.
//   - a start "must" include an `alert` plus `attributes-type` and `attributes`.
//   - "If you end a Live Activity, include the final content state", and content-state
//     must match the Swift ContentState "to ensure the system can decode the JSON
//     payload and update or end the Live Activity" — so end carries one too.
//   - a `dismissal-date` in the past removes an ended activity at once.
//
// The start alert names the prayer only: the server knows neither the user's 12/24 h
// preference nor their locale (ruling R1). There is no `sound` key anywhere, so the
// start is silent; Sakina's own prayer notification is the audible one.
//
// Times are epoch SECONDS. `content-state` keys must match
// targets/live-activity/SakinaPrayerAttributes.swift (`prayerName: String`,
// `prayerEpoch: Double`); the Jest suite reads that file to enforce it.

import type { Action, ScheduledPrayer } from './liveActivityPlan.ts';

export const APNS_TOPIC = 'com.lelahmed.sakina.push-type.liveactivity';
export const ATTRIBUTES_TYPE = 'SakinaPrayerAttributes';
export const ATTRIBUTES_VERSION = 1;
// A card the server has not touched for this long after its prayer is marked stale.
export const STALE_AFTER_S = 15 * 60;

export interface ApnsPush {
  headers: Record<string, string>;
  body: object;
  tokenKind: 'pushToStart' | 'activity';
}

function contentState(p: ScheduledPrayer): { prayerName: string; prayerEpoch: number } {
  return { prayerName: p.name, prayerEpoch: p.at };
}

function headers(priority: 5 | 10): Record<string, string> {
  return {
    'apns-push-type': 'liveactivity',
    'apns-topic': APNS_TOPIC,
    'apns-priority': String(priority),
  };
}

// `final` (end only) is the prayer the ending card was counting down to. It is
// dismissed at once, so the value is never really shown — it is there so the
// payload decodes. Without one, an empty name at `now` keeps it decodable.
export function buildPush(action: Action, now: number, final?: ScheduledPrayer): ApnsPush {
  if (action.kind === 'start') {
    return {
      headers: headers(10),
      tokenKind: 'pushToStart',
      body: {
        aps: {
          timestamp: now,
          event: 'start',
          'content-state': contentState(action.next),
          'attributes-type': ATTRIBUTES_TYPE,
          attributes: { version: ATTRIBUTES_VERSION },
          alert: { title: 'Sakina', body: `Counting down to ${action.next.name}` },
        },
      },
    };
  }

  if (action.kind === 'update') {
    return {
      headers: headers(5),
      tokenKind: 'activity',
      body: {
        aps: {
          timestamp: now,
          event: 'update',
          'content-state': contentState(action.next),
          'stale-date': action.next.at + STALE_AFTER_S,
        },
      },
    };
  }

  return {
    headers: headers(5),
    tokenKind: 'activity',
    body: {
      aps: {
        timestamp: now,
        event: 'end',
        'content-state': final ? contentState(final) : { prayerName: '', prayerEpoch: now },
        'dismissal-date': now,
      },
    },
  };
}
