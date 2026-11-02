import { planWrites, startPreWrite } from '../../../../supabase/functions/_shared/dispatchPlan';
import type { ClaimedState, SendOutcome } from '../../../../supabase/functions/_shared/dispatchPlan';
import {
  decide,
  nextDueAt,
  currentPrayer,
  ScheduledPrayer,
  Action,
} from '../../../../supabase/functions/_shared/liveActivityPlan';

const DAY = Date.UTC(2026, 9, 29) / 1000;
const at = (h: number, m = 0): number => DAY + h * 3600 + m * 60;

const F: ScheduledPrayer = { name: 'Fajr', at: at(5, 0) };
const D: ScheduledPrayer = { name: 'Dhuhr', at: at(12, 15) };
const A: ScheduledPrayer = { name: 'Asr', at: at(15, 40) };
const M: ScheduledPrayer = { name: 'Maghrib', at: at(18, 20) };
const I: ScheduledPrayer = { name: 'Isha', at: at(19, 45) };
const SCHEDULE = [F, D, A, M, I];

const TOKEN = 'ab'.repeat(32);

function plan(
  row: ClaimedState,
  now: number,
  isPro: boolean,
  results: SendOutcome[],
  actions: Action[] = decide(
    { startedAt: row.activity_started_at, lastActedPrayerAt: row.last_acted_prayer_at },
    SCHEDULE,
    now,
    isPro,
  ),
) {
  return planWrites({
    row,
    actions,
    results,
    isPro,
    cur: currentPrayer(SCHEDULE, now),
    now,
    nextDue: (s) => nextDueAt(s, SCHEDULE, now),
  });
}

// A card started at Fajr, live, last updated at Fajr; at Dhuhr the next prayer (Asr)
// passes the 12:50 cap, so decide says [end at a prayer, start Asr].
const LIVE_AT_FAJR: ClaimedState = {
  activity_started_at: F.at,
  last_acted_prayer_at: F.at,
  activity_token: TOKEN,
};
// A card started at Dhuhr; at Asr, Maghrib fits under the cap, so decide says update.
const LIVE_AT_DHUHR: ClaimedState = {
  activity_started_at: D.at,
  last_acted_prayer_at: D.at,
  activity_token: TOKEN,
};
// No card; Asr has just arrived, so decide says start Maghrib.
const NO_CARD: ClaimedState = {
  activity_started_at: null,
  last_acted_prayer_at: D.at,
  activity_token: null,
};

describe('planWrites', () => {
  it('not Pro: the live card is ended, then the row is deleted', () => {
    expect(plan(LIVE_AT_DHUHR, A.at, false, ['ok'])).toEqual({ kind: 'delete', reason: 'not_pro' });
  });

  it('not Pro with no live card deletes straight away', () => {
    expect(plan(NO_CARD, A.at, false, [])).toEqual({ kind: 'delete', reason: 'not_pro' });
  });

  it('not Pro whose end needs a retry keeps the row, due again now', () => {
    const p = plan(LIVE_AT_DHUHR, A.at, false, ['retry']);
    expect(p.kind).toBe('update');
    if (p.kind !== 'update') return;
    expect(p.retry).toBe(true);
    expect(p.patch.next_due_at).toBe(A.at);
  });

  it('a retry keeps the row due and restores the state read at claim time', () => {
    // End went through, then the start hit a 5xx: restore everything as claimed.
    const p = plan(LIVE_AT_FAJR, D.at, true, ['ok', 'retry']);
    expect(p).toEqual({
      kind: 'update',
      retry: true,
      patch: {
        activity_started_at: F.at,
        last_acted_prayer_at: F.at,
        activity_token: TOKEN,
        next_due_at: D.at,
      },
    });
  });

  it('a halt, or an action never attempted, is a retry too', () => {
    expect(plan(LIVE_AT_DHUHR, A.at, true, ['halt'])).toMatchObject({ kind: 'update', retry: true });
    expect(plan(LIVE_AT_FAJR, D.at, true, ['ok'])).toMatchObject({ kind: 'update', retry: true });
  });

  it('a skipped start (no push-to-start token) leaves activity_started_at null', () => {
    const p = plan(NO_CARD, A.at, true, ['skipped']);
    expect(p).toEqual({
      kind: 'update',
      retry: false,
      patch: {
        activity_started_at: null,
        last_acted_prayer_at: A.at,
        activity_token: null,
        next_due_at: M.at,
      },
    });
  });

  it('badToken on the push-to-start token deletes the row', () => {
    expect(plan(NO_CARD, A.at, true, ['badToken'])).toEqual({
      kind: 'delete',
      reason: 'bad_push_to_start_token',
    });
    // Also after an end that went through.
    expect(plan(LIVE_AT_FAJR, D.at, true, ['ok', 'badToken'])).toEqual({
      kind: 'delete',
      reason: 'bad_push_to_start_token',
    });
  });

  it('badToken on the activity token nulls it and keeps the card', () => {
    const p = plan(LIVE_AT_DHUHR, A.at, true, ['badToken']);
    expect(p).toEqual({
      kind: 'update',
      retry: false,
      patch: {
        activity_started_at: D.at,
        last_acted_prayer_at: A.at,
        activity_token: null,
        next_due_at: M.at,
      },
    });
  });

  it('a start that succeeds persists started and last-acted, and clears the activity token', () => {
    const p = plan(LIVE_AT_FAJR, D.at, true, ['ok', 'ok']);
    expect(p).toEqual({
      kind: 'update',
      retry: false,
      patch: {
        activity_started_at: D.at,
        last_acted_prayer_at: D.at,
        activity_token: null,
        next_due_at: A.at,
      },
    });
  });

  it('an end not at a prayer leaves last_acted_prayer_at alone', () => {
    // Pro, live card past its cap long after Isha: [end, atPrayer false].
    const row: ClaimedState = { activity_started_at: I.at, last_acted_prayer_at: I.at, activity_token: TOKEN };
    const now = I.at + 7 * 3600 + 50 * 60;
    const actions: Action[] = [{ kind: 'end', atPrayer: false }];
    const p = planWrites({
      row,
      actions,
      results: ['ok'],
      isPro: true,
      cur: { name: 'Fajr', at: now - 60 }, // pretend a prayer had just arrived
      now,
      nextDue: () => null,
    });
    expect(p).toMatchObject({ kind: 'update', retry: false });
    if (p.kind === 'update') {
      expect(p.patch.last_acted_prayer_at).toBe(I.at);
      expect(p.patch.activity_started_at).toBeNull();
      expect(p.patch.activity_token).toBeNull();
    }
  });

  it('an end at a prayer with no restart records the prayer', () => {
    const row: ClaimedState = { activity_started_at: F.at + 30 * 60, last_acted_prayer_at: F.at, activity_token: TOKEN };
    const p = plan(row, D.at + 20 * 60, true, ['ok']);
    expect(p).toMatchObject({ kind: 'update', retry: false });
    if (p.kind === 'update') expect(p.patch.last_acted_prayer_at).toBe(D.at);
  });

  it('an update with no activity token still advances last_acted and keeps the card', () => {
    const row: ClaimedState = { ...LIVE_AT_DHUHR, activity_token: null };
    expect(plan(row, A.at, true, ['skipped'])).toEqual({
      kind: 'update',
      retry: false,
      patch: {
        activity_started_at: D.at,
        last_acted_prayer_at: A.at,
        activity_token: null,
        next_due_at: M.at,
      },
    });
  });
});

describe('startPreWrite', () => {
  it('is the post-start state, written before the push goes out', () => {
    expect(startPreWrite(A, A.at + 5)).toEqual({
      activity_started_at: A.at + 5,
      last_acted_prayer_at: A.at,
      activity_token: null,
    });
  });
});
