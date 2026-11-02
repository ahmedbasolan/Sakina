/**
 * Edge Function: live-activity-dispatch
 *
 * Sends the Dynamic Island prayer countdown's APNs pushes. pg_cron (migration
 * 007) POSTs here every minute. Each run:
 *   1. CLAIMS up to 500 due `live_activity_devices` rows through the SQL function
 *      `claim_live_activity_devices` (migration 007): locked with SKIP LOCKED and
 *      leased for 120 s, so an overlapping run never processes the same device;
 *   2. refreshes the RevenueCat Pro verdict when it is older than 6 h;
 *   3. asks `decide()` (_shared/liveActivityPlan.ts) what to do;
 *   4. sends each start / update / end push to APNs (_shared/apnsPayload.ts). Before
 *      a start goes out, the post-start state is saved first, so a failed save after
 *      a successful push cannot make the next run start a second card;
 *   5. saves what `planWrites()` (_shared/dispatchPlan.ts) says — new card state and
 *      `next_due_at`, a retry (`next_due_at = now`, claim-time state restored), a
 *      backoff (the same, due in 15 min, after an APNs error about that row only —
 *      _shared/apnsErrors.ts), or a delete.
 * Every write is conditional on the row's `updated_at` being what this run read, so
 * a register or token post that lands mid-run wins and this run's write is dropped
 * (the register already recomputed next_due_at). One device's failure never stops
 * the others.
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
 *   device ids, RevenueCat ids or the APNs provider JWT.
 * - The provider JWT is shared across isolates through the single-row
 *   `live_activity_apns_token` table (migration 007), so a fresh isolate every
 *   minute does not sign a fresh token every minute.
 *
 * Secrets (supabase secrets set …): APNS_KEY_P8 (the .p8 file's contents),
 * APNS_KEY_ID, APNS_TEAM_ID, REVENUECAT_SECRET_KEY, DISPATCH_SECRET.
 *
 * Deploy: supabase functions deploy live-activity-dispatch --no-verify-jwt
 *   (supabase/config.toml sets verify_jwt = false for it too, so a deploy that
 *   forgets the flag cannot switch verification back on)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { currentPrayer, decide, nextDueAt } from '../_shared/liveActivityPlan.ts';
import type { ScheduledPrayer } from '../_shared/liveActivityPlan.ts';
import { buildPush } from '../_shared/apnsPayload.ts';
import type { ApnsPush } from '../_shared/apnsPayload.ts';
import { classifyApnsError } from '../_shared/apnsErrors.ts';
import { planWrites, startPreWrite } from '../_shared/dispatchPlan.ts';
import type { SendOutcome } from '../_shared/dispatchPlan.ts';
import { proFromSubscriber } from '../_shared/revenueCatPro.ts';

const TABLE = 'live_activity_devices';
const BATCH_LIMIT = 500;
const CONCURRENCY = 8;
const PRO_TTL_S = 6 * 3600;
const TOKEN_TABLE = 'live_activity_apns_token';
// Apple: refresh the provider token no more than once every 20 min and no less than
// once every 60 min. Reused while under 45 min old (ruling R22).
const JWT_MAX_AGE_S = 45 * 60;
// Stop starting new devices after this. It keeps a run short; it is NOT what keeps
// two runs apart — a device picked up at 44 s can still be in flight (RevenueCat
// 10 s + two APNs sends + DB) when the next run starts. The claim's 120 s lease
// does that. Claimed rows not started are released (next_due_at = now).
// The cron's pg_net timeout (migration 007, 100 s) is set above this budget plus the
// last device's ~40 s: change them together.
const RUN_BUDGET_MS = 45_000;
const FETCH_TIMEOUT_MS = 10_000;

interface DeviceRow {
  device_id: string;
  updated_at: string | null; // the version every write is conditional on
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

type Counts = Record<string, number>;

interface Run {
  counts: Counts;
  deadline: number;
  // Set on an APNs error that would hit every device (bad provider token, wrong
  // topic, …; the list is classifyApnsError's): stop sending for the rest of this
  // run and leave rows due. Never set by an error about one row.
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

interface ProviderJwt {
  iat: number;
  jwt: string;
}

let signingKey: Promise<CryptoKey> | null = null;
// Two layers (ruling R22). Apple rejects a provider that changes tokens more often
// than every 20 min (TooManyProviderTokenUpdates), and each cron minute may run in a
// fresh isolate, so a module-scope cache alone would sign a new token every minute.
//   1. module scope: `cachedJwt`, plus `inflight` so concurrent workers share one
//      lookup instead of each minting their own;
//   2. the single-row `live_activity_apns_token` table, shared by every isolate.
// A failed table read or write falls back to signing / the module cache; it never
// fails the run. The JWT itself is never logged.
let cachedJwt: ProviderJwt | null = null;
let inflight: Promise<ProviderJwt> | null = null;

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

const isFresh = (t: ProviderJwt, now: number): boolean =>
  now - t.iat < JWT_MAX_AGE_S && t.iat <= now + 60; // a future iat is not trusted

async function obtainJwt(admin: SupabaseClient, now: number, counts: Counts): Promise<ProviderJwt> {
  try {
    const { data, error } = await admin
      .from(TOKEN_TABLE)
      .select('jwt, issued_at')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw error;
    if (data && typeof data.jwt === 'string' && typeof data.issued_at === 'number') {
      const stored = { iat: data.issued_at, jwt: data.jwt };
      if (isFresh(stored, now)) return stored;
    }
  } catch {
    bump(counts, 'jwt_store_read_failed');
  }

  let jwt: string;
  try {
    jwt = await signJwt(now);
  } catch (err) {
    signingKey = null; // a failed import must not stay cached
    throw err;
  }
  bump(counts, 'jwt_signed');

  try {
    const { error } = await admin
      .from(TOKEN_TABLE)
      .upsert({ id: 1, jwt, issued_at: now }, { onConflict: 'id' });
    if (error) throw error;
  } catch {
    bump(counts, 'jwt_store_write_failed');
  }
  return { iat: now, jwt };
}

async function providerToken(admin: SupabaseClient, now: number, counts: Counts): Promise<string> {
  if (cachedJwt && isFresh(cachedJwt, now)) return cachedJwt.jwt;
  inflight ??= obtainJwt(admin, now, counts)
    .then((t) => {
      cachedJwt = t;
      return t;
    })
    .finally(() => {
      inflight = null;
    });
  return (await inflight).jwt;
}

// APNs refused the provider token itself: drop it from both layers so the next run
// signs a fresh one (e.g. after APNS_KEY_ID / APNS_KEY_P8 are corrected) instead of
// reusing the stored one for up to 45 min. Only the row still holding THIS jwt.
async function discardJwt(admin: SupabaseClient, jwt: string, counts: Counts): Promise<void> {
  if (cachedJwt?.jwt === jwt) cachedJwt = null;
  try {
    const { error } = await admin.from(TOKEN_TABLE).delete().eq('id', 1).eq('jwt', jwt);
    if (error) throw error;
  } catch {
    bump(counts, 'jwt_store_delete_failed');
  }
}

// ── APNs send ───────────────────────────────────────────────────────────────

type SendResult =
  | { kind: 'ok' }
  | { kind: 'badToken' } // 410, or 400 BadDeviceToken / DeviceTokenNotForTopic
  | { kind: 'retry' } // 429, 5xx, network: leave state, try next run
  | { kind: 'backoff' } // any other 4xx: this row only, try it again in 15 min
  | { kind: 'halt' }; // an error every device would hit: stop sending this run

// Apple's reason strings are short CamelCase words; anything else is not logged as-is.
const safeReason = (r: unknown): string =>
  typeof r === 'string' && /^[A-Za-z]{1,40}$/.test(r) ? r : 'unknown';

async function send(
  admin: SupabaseClient,
  apnsEnv: DeviceRow['apns_env'],
  deviceToken: string,
  push: ApnsPush,
  now: number,
  counts: Counts,
): Promise<SendResult> {
  const host = apnsEnv === 'sandbox' ? 'api.sandbox.push.apple.com' : 'api.push.apple.com';
  let jwt: string;
  try {
    jwt = await providerToken(admin, now, counts);
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

  // Only a known provider-wide reason halts the run; any other 4xx backs this one
  // row off. The table and its gaps are in _shared/apnsErrors.ts.
  const verdict = classifyApnsError(res.status, reason);
  if (verdict.discardJwt) await discardJwt(admin, jwt, counts);
  return { kind: verdict.kind };
}

// ── Conditional writes ──────────────────────────────────────────────────────

// Every write to a claimed row is conditional on its `updated_at` still being the
// version this run last saw. A register or token post bumps `updated_at`; when one
// lands mid-run its write wins, ours is dropped, and this run writes nothing more to
// that row (the register already recomputed next_due_at; a token post leaves the
// row due at the claim's lease, ≤ 2 min away). Each successful write moves the
// version on to the stamp it wrote.
interface RowRef {
  admin: SupabaseClient;
  deviceId: string;
  version: string | null;
}

async function updateIfUnchanged(ref: RowRef, patch: Record<string, unknown>): Promise<boolean> {
  const stamp = new Date().toISOString();
  let q = ref.admin
    .from(TABLE)
    .update({ ...patch, updated_at: stamp })
    .eq('device_id', ref.deviceId);
  q = ref.version === null ? q.is('updated_at', null) : q.eq('updated_at', ref.version);
  const { data, error } = await q.select('device_id');
  if (error) throw error;
  if (!data || data.length !== 1) return false;
  ref.version = stamp;
  return true;
}

async function deleteIfUnchanged(ref: RowRef): Promise<boolean> {
  let q = ref.admin.from(TABLE).delete().eq('device_id', ref.deviceId);
  q = ref.version === null ? q.is('updated_at', null) : q.eq('updated_at', ref.version);
  const { data, error } = await q.select('device_id');
  if (error) throw error;
  return !!data && data.length === 1;
}

// ── One device ──────────────────────────────────────────────────────────────

async function processDevice(
  admin: SupabaseClient,
  row: DeviceRow,
  run: Run,
): Promise<void> {
  const { counts } = run;
  const ref: RowRef = { admin, deviceId: row.device_id, version: row.updated_at };
  const now = nowSeconds();

  // Claimed but not worked on: hand it back, due again next run (not at the lease).
  const release = async (): Promise<void> => {
    if (!(await updateIfUnchanged(ref, { next_due_at: now }))) bump(counts, 'row_changed');
  };

  if (run.halted || Date.now() > run.deadline) {
    bump(counts, 'deferred');
    await release();
    return;
  }
  const schedule: ScheduledPrayer[] = Array.isArray(row.schedule) ? row.schedule : [];

  // 1. Pro verdict, cached for 6 h.
  const proPatch: Record<string, unknown> = {};
  let isPro: boolean | null = row.pro_active;
  if (row.pro_active === null || row.pro_checked_at === null || now - row.pro_checked_at >= PRO_TTL_S) {
    const verdict = await checkPro(row.rc_app_user_id, now, counts);
    if (verdict !== null) {
      isPro = verdict;
      proPatch.pro_active = verdict;
      proPatch.pro_checked_at = now;
    }
  }
  if (isPro === null) {
    // Never checked and RevenueCat did not answer: send nothing, change nothing but
    // the lease, so the next run asks again.
    bump(counts, 'pro_unknown');
    await release();
    return;
  }

  // 2. What to do.
  const actions = decide(
    { startedAt: row.activity_started_at, lastActedPrayerAt: row.last_acted_prayer_at },
    schedule,
    now,
    isPro,
  );
  const cur = currentPrayer(schedule, now);
  // What the ending card was counting down to — only so the end payload decodes.
  const finalPrayer = schedule.find(
    (p) => p.at > (row.last_acted_prayer_at ?? row.activity_started_at ?? -Infinity),
  );

  // 3. Send, in order. A retry/backoff/halt stops this device's remaining actions
  // (never start a fresh card while the old one may still be live); planWrites reads
  // an action with no result as a retry.
  const results: SendOutcome[] = [];
  for (const action of actions) {
    if (run.halted) break;
    const push = buildPush(action, now, action.kind === 'end' ? finalPrayer : undefined);
    const target = push.tokenKind === 'pushToStart' ? row.push_to_start_token : row.activity_token;
    if (!target) {
      bump(counts, push.tokenKind === 'pushToStart' ? 'skip_no_push_to_start_token' : 'skip_no_activity_token');
      results.push('skipped');
      continue;
    }

    if (action.kind === 'start') {
      // Ruling R24: save the post-start state BEFORE the push goes out. If the save
      // after a successful push failed, the row would still say "no card" and the
      // next run would start a second one. A retryable failure restores the claim-time
      // state (planWrites); a success leaves this standing.
      if (!(await updateIfUnchanged(ref, { ...startPreWrite(cur, now) }))) {
        bump(counts, 'row_changed');
        return; // a register / token post landed: do not start off a stale read
      }
    }

    const result = await send(admin, row.apns_env, target, push, now, counts);
    results.push(result.kind);
    if (result.kind === 'ok') bump(counts, `sent_${action.kind}`);
    if (result.kind === 'backoff') bump(counts, 'backoff');
    if (result.kind === 'halt') run.halted = true;
    if (result.kind === 'retry' || result.kind === 'halt' || result.kind === 'backoff') break;
    if (result.kind === 'badToken' && push.tokenKind === 'pushToStart') break;
  }

  // 4. Save what planWrites says.
  const plan = planWrites({
    row: {
      activity_started_at: row.activity_started_at,
      last_acted_prayer_at: row.last_acted_prayer_at,
      activity_token: row.activity_token,
    },
    actions,
    results,
    isPro,
    cur,
    now,
    nextDue: (s) => nextDueAt(s, schedule, now),
  });

  if (plan.kind === 'delete') {
    bump(counts, `deleted_${plan.reason}`);
    if (!(await deleteIfUnchanged(ref))) bump(counts, 'row_changed');
    return;
  }
  if (plan.retry) bump(counts, 'retry');
  if (!(await updateIfUnchanged(ref, { ...proPatch, ...plan.patch }))) bump(counts, 'row_changed');
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

  // Locks, leases (next_due_at = now + 120) and returns up to BATCH_LIMIT due rows,
  // skipping rows an overlapping run holds. See migration 007.
  const { data, error } = await admin.rpc('claim_live_activity_devices', {
    p_now: nowSeconds(),
    p_limit: BATCH_LIMIT,
  });
  if (error) {
    console.error('[live-activity-dispatch] claim failed:', error.message);
    return json(500, { error: 'Internal error' });
  }

  const rows = (data ?? []) as unknown as DeviceRow[];
  await pool(rows, CONCURRENCY, async (row) => {
    try {
      await processDevice(admin, row, run);
    } catch (err) {
      // Message only — never the row. The claim's lease brings the row back in ≤ 2 min.
      bump(run.counts, 'device_error');
      console.error('[live-activity-dispatch] device failed:', (err as { message?: string })?.message);
    }
  });

  const summary = { claimed: rows.length, halted: run.halted, ...run.counts };
  console.log('[live-activity-dispatch]', JSON.stringify(summary));
  return json(200, { ok: true, ...summary });
});
