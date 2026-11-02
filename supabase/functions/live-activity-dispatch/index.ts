/**
 * Edge Function: live-activity-dispatch
 *
 * Sends the Dynamic Island prayer countdown's APNs pushes. pg_cron (migration
 * 007) POSTs here every minute. Each run:
 *   1. selects up to 500 `live_activity_devices` rows whose `next_due_at` has passed;
 *   2. refreshes the RevenueCat Pro verdict when it is older than 6 h;
 *   3. asks `decide()` (_shared/liveActivityPlan.ts) what to do;
 *   4. sends each start / update / end push to APNs (_shared/apnsPayload.ts);
 *   5. saves the new card state and `next_due_at = nextDueAt(...)`.
 * One device's failure never stops the others.
 *
 * Security model:
 * - Deployed with JWT verification OFF (`--no-verify-jwt`): the cron sends a shared
 *   dispatch secret, not a Supabase JWT. The bearer is compared, in constant time, to
 *   the DISPATCH_SECRET env var; anything else is a 401 and nothing is read or sent.
 *   DISPATCH_SECRET must hold the SAME value as the Vault secret
 *   'live_activity_dispatch_secret' that the cron job reads (Task 9 sets both). An
 *   unset DISPATCH_SECRET rejects every caller.
 * - Nothing is ever sent to a device without a Pro verdict from RevenueCat. An
 *   RevenueCat outage keeps the last verdict (and skips a never-checked row) — it is
 *   never read as "not Pro", which would delete a paying user's row.
 * - Logs carry counts and APNs/RevenueCat reason codes only: never push tokens,
 *   device ids or RevenueCat ids.
 *
 * Secrets (supabase secrets set …): APNS_KEY_P8 (the .p8 file's contents),
 * APNS_KEY_ID, APNS_TEAM_ID, REVENUECAT_SECRET_KEY, DISPATCH_SECRET.
 *
 * Deploy: supabase functions deploy live-activity-dispatch --no-verify-jwt
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  currentPrayer,
  decide,
  MARGIN_S,
  MAX_ACTIVE_S,
  nextDueAt,
} from '../_shared/liveActivityPlan.ts';
import type { CardState, ScheduledPrayer } from '../_shared/liveActivityPlan.ts';
import { buildPush } from '../_shared/apnsPayload.ts';
import type { ApnsPush } from '../_shared/apnsPayload.ts';
import { proFromSubscriber } from '../_shared/revenueCatPro.ts';

const TABLE = 'live_activity_devices';
const BATCH_LIMIT = 500;
const CONCURRENCY = 8;
const PRO_TTL_S = 6 * 3600;
// Apple: refresh the provider token no more than once every 20 min and no less than
// once every 60 min.
const JWT_MAX_AGE_S = 50 * 60;
// Stop picking up new devices after this, so a run ends before the next minute's
// run starts and the two never push to the same device. Unstarted rows stay due.
const RUN_BUDGET_MS = 45_000;
const FETCH_TIMEOUT_MS = 10_000;

interface DeviceRow {
  device_id: string;
  rc_app_user_id: string;
  apns_env: 'sandbox' | 'production' | null;
  push_to_start_token: string | null;
  activity_token: string | null;
  activity_started_at: number | null;
  last_acted_prayer_at: number | null;
  schedule: ScheduledPrayer[];
  pro_checked_at: number | null;
  pro_active: boolean | null;
}

const COLUMNS =
  'device_id, rc_app_user_id, apns_env, push_to_start_token, activity_token, ' +
  'activity_started_at, last_acted_prayer_at, schedule, pro_checked_at, pro_active';

type Counts = Record<string, number>;

interface Run {
  counts: Counts;
  deadline: number;
  // Set on an APNs error that would hit every device (bad provider token, wrong
  // topic, …): stop sending for the rest of this run and leave rows due.
  halted: boolean;
}

function bump(counts: Counts, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

const nowSeconds = (): number => Math.floor(Date.now() / 1000);

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Caller check ────────────────────────────────────────────────────────────

async function sha256(s: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
}

// Constant time in the secret: both sides are hashed to 32 bytes first, so neither
// the comparison nor its length depends on how much of the secret was guessed.
async function isDispatcher(req: Request): Promise<boolean> {
  const expected = Deno.env.get('DISPATCH_SECRET') ?? '';
  if (!expected) return false;
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.get('Authorization') ?? '');
  const given = match ? match[1].trim() : '';
  if (!given) return false;
  const [a, b] = await Promise.all([sha256(given), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ── RevenueCat ──────────────────────────────────────────────────────────────

// true / false = RevenueCat's answer; null = no answer (outage, non-2xx, odd body).
// GET /v1/subscribers/{app_user_id} with the secret key, per
// https://www.revenuecat.com/docs/api-v1/customers.md. No X-Platform header: the
// docs say not to set it "if you are calling the getter for informational purposes".
async function checkPro(rcAppUserId: string, now: number, counts: Counts): Promise<boolean | null> {
  const key = Deno.env.get('REVENUECAT_SECRET_KEY');
  if (!key) {
    bump(counts, 'rc_no_key');
    return null;
  }
  try {
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(rcAppUserId)}`,
      {
        headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      },
    );
    if (!res.ok) {
      bump(counts, `rc_http_${res.status}`);
      await res.body?.cancel();
      return null;
    }
    const verdict = proFromSubscriber(await res.json(), now);
    if (verdict === null) bump(counts, 'rc_unreadable');
    return verdict;
  } catch {
    bump(counts, 'rc_network');
    return null;
  }
}

// ── APNs provider token (ES256 JWT) ─────────────────────────────────────────

function base64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const base64urlJson = (o: unknown): string => base64url(new TextEncoder().encode(JSON.stringify(o)));

let signingKey: Promise<CryptoKey> | null = null;
// A promise, so concurrent workers share one token rather than each minting its own
// (Apple rejects a provider that changes tokens too often: TooManyProviderTokenUpdates).
let cachedJwt: { iat: number; token: Promise<string> } | null = null;

function importSigningKey(): Promise<CryptoKey> {
  const pem = Deno.env.get('APNS_KEY_P8') ?? '';
  const b64 = pem
    .replace(/-----(BEGIN|END) [A-Z ]*PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '') // a secret pasted with literal "\n" sequences
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, [
    'sign',
  ]);
}

async function signJwt(iat: number): Promise<string> {
  signingKey ??= importSigningKey();
  const key = await signingKey;
  const input =
    base64urlJson({ alg: 'ES256', kid: Deno.env.get('APNS_KEY_ID') ?? '' }) +
    '.' +
    base64urlJson({ iss: Deno.env.get('APNS_TEAM_ID') ?? '', iat });
  // Web Crypto's ECDSA signature is raw r||s (64 bytes) — exactly JWS ES256. No DER.
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(input),
  );
  return `${input}.${base64url(new Uint8Array(sig))}`;
}

function providerToken(now: number): Promise<string> {
  if (!cachedJwt || now - cachedJwt.iat >= JWT_MAX_AGE_S) {
    const token = signJwt(now);
    cachedJwt = { iat: now, token };
    // A failed import/sign must not stay cached.
    token.catch(() => {
      if (cachedJwt?.token === token) cachedJwt = null;
      signingKey = null;
    });
  }
  return cachedJwt.token;
}

// ── APNs send ───────────────────────────────────────────────────────────────

type SendResult =
  | { kind: 'ok' }
  | { kind: 'badToken' } // 410, or 400 BadDeviceToken / DeviceTokenNotForTopic
  | { kind: 'retry' } // 429, 5xx, network: leave state, try next run
  | { kind: 'halt' }; // an error every device would hit: stop sending this run

// Apple's reason strings are short CamelCase words; anything else is not logged as-is.
const safeReason = (r: unknown): string =>
  typeof r === 'string' && /^[A-Za-z]{1,40}$/.test(r) ? r : 'unknown';

async function send(
  apnsEnv: DeviceRow['apns_env'],
  deviceToken: string,
  push: ApnsPush,
  now: number,
  counts: Counts,
): Promise<SendResult> {
  const host = apnsEnv === 'sandbox' ? 'api.sandbox.push.apple.com' : 'api.push.apple.com';
  let jwt: string;
  try {
    jwt = await providerToken(now);
  } catch {
    bump(counts, 'apns_jwt_failed');
    return { kind: 'halt' };
  }

  let res: Response;
  try {
    res = await fetch(`https://${host}/3/device/${encodeURIComponent(deviceToken)}`, {
      method: 'POST',
      headers: {
        ...push.headers,
        authorization: `bearer ${jwt}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(push.body),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    bump(counts, 'apns_network');
    return { kind: 'retry' };
  }

  if (res.status === 200) {
    await res.body?.cancel();
    return { kind: 'ok' };
  }

  let reason = 'unknown';
  try {
    reason = safeReason(((await res.json()) as { reason?: unknown })?.reason);
  } catch {
    // no JSON body
  }
  bump(counts, `apns_${res.status}_${reason}`);

  if (
    res.status === 410 ||
    (res.status === 400 && (reason === 'BadDeviceToken' || reason === 'DeviceTokenNotForTopic'))
  ) {
    return { kind: 'badToken' };
  }
  if (res.status === 429 || res.status >= 500) return { kind: 'retry' };
  if (res.status === 403 && (reason === 'ExpiredProviderToken' || reason === 'InvalidProviderToken')) {
    cachedJwt = null; // mint a fresh one next run
  }
  // 403 (provider token, Forbidden), 400 BadTopic / TopicDisallowed / BadPriority …,
  // 413: our configuration or payload, so every other device would fail the same way.
  return { kind: 'halt' };
}

// ── One device ──────────────────────────────────────────────────────────────

async function processDevice(
  admin: SupabaseClient,
  row: DeviceRow,
  run: Run,
): Promise<void> {
  const { counts } = run;
  if (run.halted || Date.now() > run.deadline) {
    bump(counts, 'deferred');
    return;
  }
  const now = nowSeconds();
  const schedule: ScheduledPrayer[] = Array.isArray(row.schedule) ? row.schedule : [];

  // 1. Pro verdict, cached for 6 h.
  const patch: Record<string, unknown> = {};
  let isPro: boolean | null = row.pro_active;
  if (row.pro_active === null || row.pro_checked_at === null || now - row.pro_checked_at >= PRO_TTL_S) {
    const verdict = await checkPro(row.rc_app_user_id, now, counts);
    if (verdict !== null) {
      isPro = verdict;
      patch.pro_active = verdict;
      patch.pro_checked_at = now;
    }
  }
  if (isPro === null) {
    // Never checked and RevenueCat did not answer: send nothing, change nothing. The
    // row is still due, so the next run asks again.
    bump(counts, 'pro_unknown');
    return;
  }

  // 2. What to do.
  const state: CardState = {
    startedAt: row.activity_started_at,
    lastActedPrayerAt: row.last_acted_prayer_at,
  };
  const actions = decide(state, schedule, now, isPro);
  const cur = currentPrayer(schedule, now);

  // An `end` records the prayer as acted on only when it is the end "at a prayer":
  // paired with a start, or decide's branch where a prayer arrived and the next one
  // would pass the cap. Not for the cap-reached, Pro-lapsed or schedule-exhausted ends.
  const arrived = cur !== undefined && cur.at > (state.lastActedPrayerAt ?? -Infinity);
  const capReached =
    state.startedAt !== null && now >= state.startedAt + MAX_ACTIVE_S - MARGIN_S;
  const hasNext = schedule.some((p) => p.at > now);
  const endAtPrayer =
    actions.some((a) => a.kind === 'start') || (isPro && arrived && hasNext && !capReached);

  // What the ending card was counting down to — only so the end payload decodes.
  const finalPrayer = schedule.find(
    (p) => p.at > (state.lastActedPrayerAt ?? state.startedAt ?? -Infinity),
  );

  // 3. Send, in order. A retry/halt stops this device's remaining actions: never
  // start a fresh card while the old one may still be live.
  let startedAt = state.startedAt;
  let lastActed = state.lastActedPrayerAt;
  let activityToken = row.activity_token;
  let retry = false;
  let deleteRow = false;

  for (const action of actions) {
    if (run.halted) {
      retry = true;
      break;
    }
    const push = buildPush(action, now, action.kind === 'end' ? finalPrayer : undefined);
    const target = push.tokenKind === 'pushToStart' ? row.push_to_start_token : activityToken;
    let sent = false;

    if (!target) {
      bump(counts, push.tokenKind === 'pushToStart' ? 'skip_no_push_to_start_token' : 'skip_no_activity_token');
    } else {
      const result = await send(row.apns_env, target, push, now, counts);
      if (result.kind === 'halt') {
        run.halted = true;
        retry = true;
        break;
      }
      if (result.kind === 'retry') {
        retry = true;
        break;
      }
      if (result.kind === 'badToken') {
        if (push.tokenKind === 'pushToStart') {
          deleteRow = true;
          break;
        }
        activityToken = null;
      } else {
        sent = true;
        bump(counts, `sent_${action.kind}`);
      }
    }

    if (action.kind === 'end') {
      // Sent, skipped (no token) or token gone: either way there is no card to track.
      startedAt = null;
      activityToken = null;
      if (endAtPrayer && cur) lastActed = cur.at;
    } else if (action.kind === 'update') {
      if (cur) lastActed = cur.at;
    } else {
      if (cur) lastActed = cur.at;
      if (sent) {
        startedAt = now;
        // The new card's token arrives later through the native token post.
        activityToken = null;
      }
    }
  }

  // 4. Save.
  if (deleteRow) {
    bump(counts, 'deleted_bad_push_to_start_token');
    const { error } = await admin.from(TABLE).delete().eq('device_id', row.device_id);
    if (error) throw error;
    return;
  }

  if (!isPro && startedAt === null && !retry) {
    bump(counts, 'deleted_not_pro');
    const { error } = await admin.from(TABLE).delete().eq('device_id', row.device_id);
    if (error) throw error;
    return;
  }

  if (retry) {
    // Keep what already happened (an end that went through), nothing else: leaving
    // last_acted_prayer_at and next_due_at alone keeps the row due, so the next run
    // decides again from the same prayer.
    if (startedAt !== state.startedAt) patch.activity_started_at = startedAt;
  } else {
    patch.activity_started_at = startedAt;
    patch.last_acted_prayer_at = lastActed;
    patch.next_due_at = nextDueAt({ startedAt, lastActedPrayerAt: lastActed }, schedule, now);
  }

  if (Object.keys(patch).length > 0) {
    patch.updated_at = new Date().toISOString();
    const { error } = await admin.from(TABLE).update(patch).eq('device_id', row.device_id);
    if (error) throw error;
  }

  // Clear the activity token only if it is still the one this run read: after a start
  // the device posts the new card's token within seconds, and an unconditional null
  // could land after it and erase it.
  if (activityToken === null && row.activity_token !== null) {
    const { error } = await admin
      .from(TABLE)
      .update({ activity_token: null })
      .eq('device_id', row.device_id)
      .eq('activity_token', row.activity_token);
    if (error) throw error;
  }
}

// ── Entry ───────────────────────────────────────────────────────────────────

async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!(await isDispatcher(req))) return json(401, { error: 'Unauthorized' });

  const run: Run = { counts: {}, deadline: Date.now() + RUN_BUDGET_MS, halted: false };
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await admin
    .from(TABLE)
    .select(COLUMNS)
    .lte('next_due_at', nowSeconds())
    .order('next_due_at', { ascending: true })
    .limit(BATCH_LIMIT);
  if (error) {
    console.error('[live-activity-dispatch] select failed:', error.message);
    return json(500, { error: 'Internal error' });
  }

  const rows = (data ?? []) as unknown as DeviceRow[];
  await pool(rows, CONCURRENCY, async (row) => {
    try {
      await processDevice(admin, row, run);
    } catch (err) {
      // Message only — a PostgREST error can quote values, so never the row itself.
      bump(run.counts, 'device_error');
      console.error('[live-activity-dispatch] device failed:', (err as { message?: string })?.message);
    }
  });

  const summary = { due: rows.length, halted: run.halted, ...run.counts };
  console.log('[live-activity-dispatch]', JSON.stringify(summary));
  return json(200, { ok: true, ...summary });
});
