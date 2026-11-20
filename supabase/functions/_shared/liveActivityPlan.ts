// Chain decision logic for the Dynamic Island prayer card. Pure and import-free:
// the Supabase dispatcher (Deno) and the Jest suite both load this exact file.
// All times are epoch SECONDS.

export type Salah = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export interface ScheduledPrayer {
  name: Salah;
  at: number; // epoch seconds, strictly increasing across a schedule
}

export interface CardState {
  startedAt: number | null; // epoch s of the live card, null = none
  lastActedPrayerAt: number | null; // epoch s of the prayer the last action was taken at
}

export type Action =
  | { kind: 'start'; next: ScheduledPrayer } // via push-to-start token, silent alert
  | { kind: 'update'; next: ScheduledPrayer } // via activity token
  // via activity token, dismissal-date = now. `atPrayer`: the end happens because a
  // prayer arrived (paired with a start, or the next prayer would pass the cap), so
  // the dispatcher records that prayer as acted on. False for the cap-reached
  // (without a restart), Pro-lapsed and schedule-exhausted ends.
  | { kind: 'end'; atPrayer: boolean };

// iOS ends a Live Activity after 8h; MARGIN_S is how early we hand over to a fresh card.
export const MAX_ACTIVE_S = 8 * 3600;
export const MARGIN_S = 600;

// A run later than this after a prayer no longer starts a card off that prayer:
// "Asr in 2h" would be wrong if Asr was 40 minutes ago.
const STALE_S = 15 * 60;

function capOf(state: CardState): number | null {
  return state.startedAt === null ? null : state.startedAt + MAX_ACTIVE_S - MARGIN_S;
}

// The latest prayer at or before `now` (the one `decide` acts at), or undefined.
// Exported so the dispatcher records `last_acted_prayer_at` from the same prayer.
export function currentPrayer(
  schedule: ScheduledPrayer[],
  now: number,
): ScheduledPrayer | undefined {
  let cur: ScheduledPrayer | undefined;
  for (const p of schedule) {
    if (p.at <= now) cur = p;
  }
  return cur;
}

export function decide(
  state: CardState,
  schedule: ScheduledPrayer[],
  now: number,
  isPro: boolean,
): Action[] {
  const cap = capOf(state);
  const live = cap !== null;

  const next = schedule.find((p) => p.at > now);
  if (!isPro || !next) return live ? [{ kind: 'end', atPrayer: false }] : [];

  const cur = currentPrayer(schedule, now);
  // Only a prayer that is still fresh may anchor a new card.
  const canStart = cur !== undefined && cur.at > now - STALE_S;
  const restart: Action[] = canStart ? [{ kind: 'start', next }] : [];

  if (live && now >= cap) return [{ kind: 'end', atPrayer: canStart }, ...restart];

  const arrived = cur !== undefined && cur.at > (state.lastActedPrayerAt ?? -Infinity);
  if (!arrived) return [];

  if (live) {
    return next.at <= cap
      ? [{ kind: 'update', next }]
      : [{ kind: 'end', atPrayer: true }, ...restart];
  }
  return restart;
}

// When the dispatcher should next look at this row: the next prayer, or the cap if
// a card is live and would expire first.
export function nextDueAt(
  state: CardState,
  schedule: ScheduledPrayer[],
  now: number,
): number | null {
  const next = schedule.find((p) => p.at > now);
  const cap = capOf(state);
  if (next && cap !== null) return Math.min(next.at, cap);
  if (next) return next.at;
  return cap;
}
