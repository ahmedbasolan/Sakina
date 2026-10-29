/**
 * Edge Function: live-activity-register
 *
 * Keeps one `live_activity_devices` row per opted-in device, for the Dynamic
 * Island prayer countdown. Three actions, all POST + JSON (see
 * _shared/registerValidation.ts for the exact shapes):
 *   register   - the app: schedule, time zone, APNs environment, RevenueCat id
 *   unregister - the app: delete the row
 *   token      - the native token forwarder: push-to-start / activity tokens
 *
 * Security model:
 * - Deployed with JWT verification OFF (`supabase functions deploy
 *   live-activity-register --no-verify-jwt`): guests and a just-signed-out app
 *   must be able to call it with only the anon key.
 * - The body is untrusted. Unknown keys are rejected, sizes are capped, and a user
 *   id is NEVER read from the body. `user_id` is set only when the Authorization
 *   bearer resolves to a real user session; the anon key (or any failure) leaves
 *   it null / unchanged.
 * - Abuse is bounded by those caps plus the dispatcher, which deletes rows whose
 *   Pro check fails and never sends to them. There is no per-IP limiter.
 * - The body is never echoed back and never logged (it holds push tokens).
 *
 * Writes use the service role, because the table has RLS on with no policies.
 *
 * Deploy: supabase functions deploy live-activity-register --no-verify-jwt
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { nextDueAt } from '../_shared/liveActivityPlan.ts';
import type { CardState, ScheduledPrayer } from '../_shared/liveActivityPlan.ts';
import { parseRegister } from '../_shared/registerValidation.ts';

const MAX_BODY_BYTES = 16 * 1024;
const TABLE = 'live_activity_devices';

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// The caller's user id when the bearer is a real session; otherwise null.
async function userIdFromBearer(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!bearer || bearer === Deno.env.get('SUPABASE_ANON_KEY')) return null;

  try {
    const client = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

// Latest scheduled prayer at or before `t`, or null.
function latestAtOrBefore(schedule: ScheduledPrayer[], t: number): number | null {
  let found: number | null = null;
  for (const p of schedule) {
    if (p.at <= t) found = p.at;
  }
  return found;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json(400, { error: 'Body too large' });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const now = Math.floor(Date.now() / 1000);
  const parsed = parseRegister(body, now);
  if (!parsed.ok) {
    return json(400, { error: parsed.error });
  }
  const request = parsed.value;

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  try {
    // ── unregister: by device id alone, no session needed ──────────────────
    if (request.action === 'unregister') {
      const { error } = await admin.from(TABLE).delete().eq('device_id', request.deviceId);
      if (error) throw error;
      return json(200, { ok: true });
    }

    // ── register ───────────────────────────────────────────────────────────
    if (request.action === 'register') {
      const { data: existing, error: readError } = await admin
        .from(TABLE)
        .select('rc_app_user_id, activity_started_at, last_acted_prayer_at')
        .eq('device_id', request.deviceId)
        .maybeSingle();
      if (readError) throw readError;

      const state: CardState = {
        startedAt: existing?.activity_started_at ?? null,
        lastActedPrayerAt: existing?.last_acted_prayer_at ?? null,
      };

      const row: Record<string, unknown> = {
        device_id: request.deviceId,
        rc_app_user_id: request.rcAppUserId,
        apns_env: request.apnsEnv,
        time_zone: request.timeZone,
        schedule: request.schedule,
        next_due_at: nextDueAt(state, request.schedule, now),
        updated_at: new Date().toISOString(),
      };

      // A different RevenueCat user on this device: the cached Pro verdict no
      // longer applies, so make the dispatcher check again.
      if (existing && existing.rc_app_user_id !== request.rcAppUserId) {
        row.pro_checked_at = null;
        row.pro_active = null;
      }

      // Only ever set from a verified session; omitted otherwise so an upsert
      // leaves an existing value alone.
      const userId = await userIdFromBearer(req);
      if (userId) row.user_id = userId;

      const { error } = await admin.from(TABLE).upsert(row, { onConflict: 'device_id' });
      if (error) throw error;
      return json(200, { ok: true });
    }

    // ── token (from the native forwarder) ──────────────────────────────────
    const { data: existing, error: readError } = await admin
      .from(TABLE)
      .select('schedule, activity_started_at, last_acted_prayer_at')
      .eq('device_id', request.deviceId)
      .maybeSingle();
    if (readError) throw readError;

    // rc_app_user_id and schedule are NOT NULL, so a token cannot create a row.
    // The app's register always comes first; the forwarder reposts on next launch.
    if (!existing) {
      return json(200, { ok: true, ignored: true });
    }

    const schedule = existing.schedule as ScheduledPrayer[];
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (request.pushToStartToken !== undefined) update.push_to_start_token = request.pushToStartToken;
    if (request.activityToken !== undefined) update.activity_token = request.activityToken;

    const state: CardState = {
      startedAt: existing.activity_started_at ?? null,
      lastActedPrayerAt: existing.last_acted_prayer_at ?? null,
    };
    if (request.activityStartedAt !== undefined) {
      const startedAt = Math.round(request.activityStartedAt);
      state.startedAt = startedAt;
      state.lastActedPrayerAt = latestAtOrBefore(schedule, startedAt);
      update.activity_started_at = state.startedAt;
      update.last_acted_prayer_at = state.lastActedPrayerAt;
      update.next_due_at = nextDueAt(state, schedule, now);
    }

    const { error } = await admin.from(TABLE).update(update).eq('device_id', request.deviceId);
    if (error) throw error;
    return json(200, { ok: true });
  } catch (err) {
    // Message only: the request body holds push tokens and must not reach logs.
    console.error('[live-activity-register] failed:', (err as { message?: string })?.message);
    return json(500, { error: 'Internal error' });
  }
});
