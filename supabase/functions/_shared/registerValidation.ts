// Request validation for the live-activity-register edge function. Pure: the Deno
// function and the Jest suite load this exact file. It imports only TYPES from its
// sibling (`import type`, erased at compile time), so Jest never needs to resolve a
// `.ts` specifier.
//
// The endpoint is open to guests (JWT verification is off), so this is the first
// line of defence: unknown keys are rejected everywhere, which is what stops a
// client smuggling a location in, and every string and array has a hard cap.
//
// `nowSeconds` is a parameter, not read from the clock, so tests are deterministic.
// The function passes `Math.floor(Date.now() / 1000)`.
//
// What this does NOT check: that the schedule is a plausible prayer timetable (a
// forged one with five valid names in a valid window passes), that `rcAppUserId`
// belongs to the caller, or that a token is a real APNs token. The dispatcher's Pro
// check (and its deletion of rows that fail it) is the guard for the first two; APNs
// rejects the third.

import type { Salah, ScheduledPrayer } from './liveActivityPlan.ts';

export type RegisterBody =
  | {
      action: 'register';
      deviceId: string;
      rcAppUserId: string;
      apnsEnv: 'sandbox' | 'production';
      timeZone: string;
      schedule: ScheduledPrayer[];
    }
  | { action: 'unregister'; deviceId: string }
  | {
      action: 'token';
      deviceId: string;
      pushToStartToken?: string;
      activityToken?: string;
      activityStartedAt?: number; // epoch seconds, may be fractional
    };

export type ParseResult = { ok: true; value: RegisterBody } | { ok: false; error: string };

const SALAH_NAMES: readonly Salah[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const DAY_S = 86400;
const MAX_SCHEDULE = 40;
const MAX_TOKEN = 200;
const MAX_RC_ID = 200;
const MAX_TIME_ZONE = 64;
const FUTURE_WINDOW_S = 8 * DAY_S;
const PAST_WINDOW_S = DAY_S;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_RE = /^[0-9a-fA-F]+$/;

const fail = (error: string): ParseResult => ({ ok: false, error });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Returns an error message if `obj` has a key outside `allowed`, else null.
function unknownKey(obj: Record<string, unknown>, allowed: readonly string[]): string | null {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) return `unexpected field: ${key.slice(0, 40)}`;
  }
  return null;
}

function isHexToken(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= MAX_TOKEN && HEX_RE.test(value);
}

function parseSchedule(value: unknown, now: number): { ok: true; value: ScheduledPrayer[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) return { ok: false, error: 'schedule must be an array' };
  if (value.length > MAX_SCHEDULE) return { ok: false, error: 'schedule too long' };

  const out: ScheduledPrayer[] = [];
  let previous = -Infinity;
  for (const entry of value) {
    if (!isRecord(entry)) return { ok: false, error: 'schedule entry must be an object' };
    const extra = unknownKey(entry, ['name', 'at']);
    if (extra) return { ok: false, error: extra };
    const { name, at } = entry;
    if (typeof name !== 'string' || !SALAH_NAMES.includes(name as Salah)) {
      return { ok: false, error: 'schedule entry has an unknown prayer name' };
    }
    if (typeof at !== 'number' || !Number.isInteger(at)) {
      return { ok: false, error: 'schedule time must be an integer' };
    }
    if (at < now - PAST_WINDOW_S || at > now + FUTURE_WINDOW_S) {
      return { ok: false, error: 'schedule time outside the accepted window' };
    }
    if (at <= previous) return { ok: false, error: 'schedule must be strictly increasing' };
    previous = at;
    out.push({ name: name as Salah, at });
  }
  return { ok: true, value: out };
}

export function parseRegister(body: unknown, nowSeconds: number): ParseResult {
  if (!isRecord(body)) return fail('body must be an object');

  const { action, deviceId } = body;
  if (action !== 'register' && action !== 'unregister' && action !== 'token') {
    return fail('unknown action');
  }
  if (typeof deviceId !== 'string' || !UUID_RE.test(deviceId)) {
    return fail('deviceId must be a UUID');
  }
  const id = deviceId.toLowerCase();

  if (action === 'unregister') {
    const extra = unknownKey(body, ['action', 'deviceId']);
    if (extra) return fail(extra);
    return { ok: true, value: { action, deviceId: id } };
  }

  if (action === 'token') {
    const extra = unknownKey(body, ['action', 'deviceId', 'pushToStartToken', 'activityToken', 'activityStartedAt']);
    if (extra) return fail(extra);

    const { pushToStartToken, activityToken, activityStartedAt } = body;
    if (pushToStartToken !== undefined && !isHexToken(pushToStartToken)) {
      return fail('pushToStartToken must be hex, up to 200 characters');
    }
    if (activityToken !== undefined && !isHexToken(activityToken)) {
      return fail('activityToken must be hex, up to 200 characters');
    }
    if (pushToStartToken === undefined && activityToken === undefined) {
      return fail('a token is required');
    }
    if (
      activityStartedAt !== undefined &&
      (typeof activityStartedAt !== 'number' ||
        !Number.isFinite(activityStartedAt) ||
        activityStartedAt <= 0 ||
        activityStartedAt > nowSeconds + DAY_S)
    ) {
      return fail('activityStartedAt must be epoch seconds');
    }

    const value: RegisterBody = { action, deviceId: id };
    if (pushToStartToken !== undefined) value.pushToStartToken = pushToStartToken as string;
    if (activityToken !== undefined) value.activityToken = activityToken as string;
    if (activityStartedAt !== undefined) value.activityStartedAt = activityStartedAt as number;
    return { ok: true, value };
  }

  // action === 'register'
  const extra = unknownKey(body, ['action', 'deviceId', 'rcAppUserId', 'apnsEnv', 'timeZone', 'schedule']);
  if (extra) return fail(extra);

  const { rcAppUserId, apnsEnv, timeZone, schedule } = body;
  if (typeof rcAppUserId !== 'string' || rcAppUserId.length < 1 || rcAppUserId.length > MAX_RC_ID) {
    return fail('rcAppUserId must be a string of 1 to 200 characters');
  }
  if (apnsEnv !== 'sandbox' && apnsEnv !== 'production') {
    return fail('apnsEnv must be sandbox or production');
  }
  if (typeof timeZone !== 'string' || timeZone.length < 1 || timeZone.length > MAX_TIME_ZONE) {
    return fail('timeZone must be a string of 1 to 64 characters');
  }
  const parsed = parseSchedule(schedule, nowSeconds);
  if (!parsed.ok) return fail(parsed.error);

  return {
    ok: true,
    value: { action, deviceId: id, rcAppUserId, apnsEnv, timeZone, schedule: parsed.value },
  };
}
