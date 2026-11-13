// APNs request (headers + JSON body) for one Live Activity action. Pure: the Deno
// dispatcher and the Jest suite load this exact file. It imports only TYPES from its
// sibling (`import type`, erased at compile time — ruling R4).
//
// Read from Apple's "Starting and updating Live Activities with ActivityKit push
// notifications" (fetched 2026-11-02):
//   - `apns-push-type: liveactivity`; `apns-topic: <bundleID>.push-type.liveactivity`;
//     `apns-priority` 5 or 10, and 5 does not count toward the hourly budget.
//   - `timestamp` in seconds; `event` start / update / end.
//   - a start "must" include an `alert` plus `attributes-type` and `attributes`, and
//     on iOS 18+ asks for an update token with `input-push-token: 1`.
//   - "If you end a Live Activity, include the final content state", and content-state
//     must match the Swift ContentState "to ensure the system can decode the JSON
//     payload and update or end the Live Activity" — so end carries one too.
//   - a `dismissal-date` in the past removes an ended activity at once.
//
// `apns-expiration`, from Apple's "Sending notification requests to APNs" (fetched
// 2026-11-02): "If the value is nonzero, APNs stores the notification and tries to
// deliver it at least once, repeating the attempt as needed until the specified
// date", and "If you omit this header, APNs stores the push according to APNs
// storage policy" — so without one a start to an offline phone can arrive hours late
// and light the screen off any prayer time. Each push therefore carries one:
//   start  → now + START_EXPIRY_S (15 min): a start later than that is not a start
//            at the prayer, and the next prayer's run starts the next card;
//   update → the prayer it counts down to: after that it is out of date anyway;
//   end    → now + END_EXPIRY_S (1 h): an end may still usefully arrive late.
// "APNs uses best efforts to honor the expiry date without any guarantee", which is
// why a start also carries a `stale-date` (next.at + STALE_AFTER_S) like an update.
//
// Priority: start and update at 10, end at 5. Apple: priority 5 does not count
// toward the hourly Live Activity budget, but may be grouped and delivered late; a
// countdown that moves to the next prayer late shows the wrong prayer, and a typical
// day is 2–3 starts plus a few updates, well inside the budget. An end is dismissed
// at once and can afford to wait.
//
// The start alert names the prayer only: the server knows neither the user's 12/24 h
// preference nor their locale (ruling R1). There is no `sound` key anywhere, so the
// start is silent; Sakina's own prayer notification is the audible one.
//
// Times are epoch SECONDS. `content-state` keys must match
// targets/live-activity/SakinaPrayerAttributes.swift (`prayerName: String`,
// `prayerEpoch: Double`, `startEpoch: Double?`); the Jest suite reads that file
// to enforce it. A build that predates `startEpoch` ignores the extra key.

import type { Action, ScheduledPrayer } from './liveActivityPlan.ts';

export const APNS_TOPIC = 'com.lelahmed.sakina.push-type.liveactivity';
export const ATTRIBUTES_TYPE = 'SakinaPrayerAttributes';
export const ATTRIBUTES_VERSION = 1;
// A card the server has not touched for this long after its prayer is marked stale.
export const STALE_AFTER_S = 15 * 60;
// How long APNs may hold a start / an end for an unreachable phone (see above).
export const START_EXPIRY_S = 15 * 60;
export const END_EXPIRY_S = 60 * 60;

export interface ApnsPush {
  headers: Record<string, string>;
  body: object;
  tokenKind: 'pushToStart' | 'activity';
}

// `startEpoch` is the previous prayer: where the card's progress bar starts
// (design C, ProgressView(timerInterval:) on the device, so the bar fills with
// no further pushes). Always present — null when unknown — so the key set always
// matches Swift's ContentState, where it is an optional Double.
type ContentState = { prayerName: string; prayerEpoch: number; startEpoch: number | null };

function contentState(p: ScheduledPrayer, startAt?: number): ContentState {
  return { prayerName: p.name, prayerEpoch: p.at, startEpoch: startAt ?? null };
}

function headers(priority: 5 | 10, expiration: number): Record<string, string> {
  return {
    'apns-push-type': 'liveactivity',
    'apns-topic': APNS_TOPIC,
    'apns-priority': String(priority),
    'apns-expiration': String(Math.floor(expiration)),
  };
}

// `final` (end only) is the prayer the ending card was counting down to. It is
// dismissed at once, so the value is never really shown — it is there so the
// payload decodes. Without one, an empty name at `now` keeps it decodable.
// `startAt` (start / update) is the previous prayer, epoch seconds — the start
// of the progress bar; omit it when unknown.
export function buildPush(
  action: Action,
  now: number,
  final?: ScheduledPrayer,
  startAt?: number,
): ApnsPush {
  if (action.kind === 'start') {
    return {
      headers: headers(10, now + START_EXPIRY_S),
      tokenKind: 'pushToStart',
      body: {
        aps: {
          timestamp: now,
          event: 'start',
          'content-state': contentState(action.next, startAt),
          'stale-date': action.next.at + STALE_AFTER_S,
          'attributes-type': ATTRIBUTES_TYPE,
          attributes: { version: ATTRIBUTES_VERSION },
          // Ruling R20. Apple: "For devices running iOS 18 and later … you can add
          // `input-push-token: 1` to your payload to start a Live Activity and receive
          // a new push token." Without it an iOS 18+ push-started card never gives us
          // the update token the update/end chain needs. Pre-iOS-18 devices receive
          // the update token on a push start anyway (same article).
          'input-push-token': 1,
          alert: { title: 'Sakina', body: `Counting down to ${action.next.name}` },
        },
      },
    };
  }

  if (action.kind === 'update') {
    return {
      headers: headers(10, action.next.at),
      tokenKind: 'activity',
      body: {
        aps: {
          timestamp: now,
          event: 'update',
          'content-state': contentState(action.next, startAt),
          'stale-date': action.next.at + STALE_AFTER_S,
        },
      },
    };
  }

  return {
    headers: headers(5, now + END_EXPIRY_S),
    tokenKind: 'activity',
    body: {
      aps: {
        timestamp: now,
        event: 'end',
        'content-state': final ? contentState(final) : { prayerName: '', prayerEpoch: now, startEpoch: null },
        'dismissal-date': now,
      },
    },
  };
}
