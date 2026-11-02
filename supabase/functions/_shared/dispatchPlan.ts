// What the dispatcher writes back after acting on one device. Pure: the Deno
// dispatcher and the Jest suite load this exact file. It imports only TYPES from its
// sibling (`import type`, erased at compile time — ruling R4), so the two values it
// needs from liveActivityPlan.ts arrive as arguments: `cur` (currentPrayer) and
// `nextDue` (nextDueAt bound to the row's schedule).
//
// The rules (Task 1 review + rulings R24/R25), per action whose push went through or
// could not be sent:
//   start  → activity_started_at = now (only if SENT), activity_token = null,
//            last_acted_prayer_at = cur.at
//   update → last_acted_prayer_at = cur.at; badToken nulls the activity token only
//   end    → activity_started_at = null, activity_token = null, and
//            last_acted_prayer_at = cur.at only when decide marked it `atPrayer`
// then next_due_at = nextDue(new state).
//
// Exceptions, checked in order of the actions:
//   - retry / halt / an action never attempted → restore the state read at claim
//     time with next_due_at = now: the row is due again next run, which decides again
//     from the same prayer. (An end that already went through is re-sent then; iOS
//     ignores a push for an activity that has ended.)
//   - badToken on the push-to-start token → delete the row.
//   - not Pro and no card left → delete the row.
//
// "skipped" = no token stored, so nothing was sent: a skipped start leaves
// activity_started_at null; a skipped update keeps the card; a skipped end treats it
// as gone.
//
// What this does NOT decide: whether a write may land at all. The dispatcher makes
// every write conditional on the row's `updated_at` being what it read, so a
// concurrent register wins.

import type { Action, CardState, ScheduledPrayer } from './liveActivityPlan.ts';

export type SendOutcome = 'ok' | 'skipped' | 'badToken' | 'retry' | 'halt';

// The card columns as read at claim time.
export interface ClaimedState {
  activity_started_at: number | null;
  last_acted_prayer_at: number | null;
  activity_token: string | null;
}

export interface CardPatch extends ClaimedState {
  next_due_at: number | null;
}

export type WritePlan =
  | { kind: 'delete'; reason: 'not_pro' | 'bad_push_to_start_token' }
  | { kind: 'update'; retry: boolean; patch: CardPatch };

export interface PlanInput {
  row: ClaimedState;
  actions: Action[];
  // One per action, in order. Shorter than `actions` when the dispatcher stopped.
  results: SendOutcome[];
  isPro: boolean;
  cur: ScheduledPrayer | undefined;
  now: number;
  nextDue: (state: CardState) => number | null;
}

// The state a start leaves behind, written BEFORE the push is sent (ruling R24), so a
// failed save after a successful push cannot lead the next run to start a second card.
export function startPreWrite(cur: ScheduledPrayer | undefined, now: number): ClaimedState {
  return {
    activity_started_at: now,
    last_acted_prayer_at: cur ? cur.at : null,
    activity_token: null,
  };
}

export function planWrites(input: PlanInput): WritePlan {
  const { row, actions, results, isPro, cur, now } = input;
  let startedAt = row.activity_started_at;
  let lastActed = row.last_acted_prayer_at;
  let token = row.activity_token;

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const result = results[i];

    if (result === undefined || result === 'retry' || result === 'halt') {
      return {
        kind: 'update',
        retry: true,
        patch: {
          activity_started_at: row.activity_started_at,
          last_acted_prayer_at: row.last_acted_prayer_at,
          activity_token: row.activity_token,
          next_due_at: now,
        },
      };
    }

    if (action.kind === 'start') {
      if (result === 'badToken') return { kind: 'delete', reason: 'bad_push_to_start_token' };
      if (cur) lastActed = cur.at;
      if (result === 'ok') {
        startedAt = now;
        token = null; // the new card's token arrives later through the native post
      }
    } else if (action.kind === 'update') {
      if (result === 'badToken') token = null;
      if (cur) lastActed = cur.at;
    } else {
      // Sent, skipped or token gone: either way there is no card left to track.
      startedAt = null;
      token = null;
      if (action.atPrayer && cur) lastActed = cur.at;
    }
  }

  if (!isPro && startedAt === null) return { kind: 'delete', reason: 'not_pro' };

  return {
    kind: 'update',
    retry: false,
    patch: {
      activity_started_at: startedAt,
      last_acted_prayer_at: lastActed,
      activity_token: token,
      next_due_at: input.nextDue({ startedAt, lastActedPrayerAt: lastActed }),
    },
  };
}
