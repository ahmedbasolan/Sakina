-- 007_live_activity_devices.sql
-- Server state for the Pro-only Dynamic Island prayer countdown: one row per
-- device that opted in, the dispatcher's shared APNs provider token, plus the
-- per-minute cron that wakes the dispatcher.
--
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- DO NOT apply this with `supabase db push`. Migrations 001–006 were applied by
-- hand in the SQL Editor, so the project's migration history
-- (supabase_migrations.schema_migrations) does not list them, and `db push` would
-- try to replay all six against a database that already has them. Either paste
-- this file into the SQL Editor like the others, or first mark 001–006 as applied
-- (`supabase migration repair --status applied 001 002 003 004 005 006`, after
-- checking `supabase migration list`) and only then push.
--
-- Access model: only the service role (the live-activity-register and
-- live-activity-dispatch edge functions) touches this table. RLS is enabled with
-- NO policies, so anon/authenticated requests see nothing and can write nothing.
-- The register function is open to guests, which is why the table is not keyed on
-- a user: device_id is the key, user_id is filled in only when the caller had a
-- real session.
--
-- Times are epoch SECONDS (bigint), the unit the app and supabase/functions/_shared
-- use. `schedule` is an array of { name, at } (ScheduledPrayer).

-- ── Table ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.live_activity_devices (
  device_id            uuid        PRIMARY KEY,
  user_id              uuid        NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  rc_app_user_id       text        NOT NULL,
  apns_env             text        CHECK (apns_env IN ('sandbox', 'production')),
  push_to_start_token  text,
  activity_token       text,
  activity_started_at  bigint,
  last_acted_prayer_at bigint,
  time_zone            text,
  schedule             jsonb       NOT NULL,
  next_due_at          bigint,
  pro_checked_at       bigint,
  pro_active           boolean,
  updated_at           timestamptz DEFAULT now()
);

-- The dispatcher's per-minute query is "rows whose next_due_at has passed".
CREATE INDEX IF NOT EXISTS live_activity_devices_next_due_at_idx
  ON public.live_activity_devices (next_due_at);

ALTER TABLE public.live_activity_devices ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies. Belt and braces: take away the API roles' table
-- privileges too, so a future "enable all policies" slip cannot expose push tokens.
REVOKE ALL ON public.live_activity_devices FROM anon, authenticated;

-- ── APNs provider token (single row) ─────────────────────────────────────────
-- The dispatcher's ES256 provider JWT, shared across edge-function isolates. Each
-- cron minute may run in a fresh isolate; signing a new token every minute would
-- break Apple's "no more than once every 20 minutes" rule
-- (TooManyProviderTokenUpdates). The dispatcher reuses this token while it is under
-- 45 minutes old (Apple rejects one older than 60) and otherwise signs and upserts
-- a new one. Only the service role touches it: RLS on, no policies, privileges
-- revoked, exactly like the devices table.
CREATE TABLE IF NOT EXISTS public.live_activity_apns_token (
  id         smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  jwt        text     NOT NULL,
  issued_at  bigint   NOT NULL -- epoch seconds, the JWT's `iat`
);

ALTER TABLE public.live_activity_apns_token ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.live_activity_apns_token FROM anon, authenticated;

-- ── Claiming due rows (ruling R24) ───────────────────────────────────────────
-- The dispatcher takes its batch through this function instead of a plain SELECT.
-- In one statement it locks up to p_limit due rows (skipping any another run holds),
-- pushes their next_due_at 120 s out (a lease), and returns them. A run that is
-- still working when the next minute's run starts therefore never shares a device
-- with it, so a push-to-start cannot go out twice. 120 s is longer than one
-- device can take (a 45 s run budget plus at most ~30 s for the last device picked
-- up). The dispatcher sets the real next_due_at when it is done — `now` when it must
-- retry — and a crashed run's rows come due again when the lease runs out.
--
-- RETURNING gives the row as updated, so next_due_at in the result is the lease,
-- not the value it was claimed at.
--
-- SECURITY INVOKER: only the service role (which bypasses RLS and holds the table
-- privileges) may run it. Postgres grants EXECUTE to PUBLIC by default, and Supabase
-- to anon/authenticated, so those are revoked explicitly.
CREATE OR REPLACE FUNCTION public.claim_live_activity_devices(p_now bigint, p_limit int)
RETURNS SETOF public.live_activity_devices
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  UPDATE public.live_activity_devices AS d
     SET next_due_at = p_now + 120
   WHERE d.device_id IN (
           SELECT due.device_id
             FROM public.live_activity_devices AS due
            WHERE due.next_due_at <= p_now
            ORDER BY due.next_due_at
            LIMIT p_limit
              FOR UPDATE SKIP LOCKED
         )
  RETURNING d.*;
$$;

REVOKE ALL ON FUNCTION public.claim_live_activity_devices(bigint, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_live_activity_devices(bigint, int) TO service_role;

-- ── Extensions ───────────────────────────────────────────────────────────────
-- IF NOT EXISTS makes both a no-op when the project already has them enabled from
-- the dashboard (Database → Extensions), and enables them with the schemas
-- Supabase documents otherwise. pg_cron's functions land in the `cron` schema and
-- pg_net's in the `net` schema regardless of the schema named here.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

-- ── Cron: wake the dispatcher every minute ───────────────────────────────────
-- The shared secret lives in Supabase Vault under the name
-- 'live_activity_dispatch_secret' and is read when the job RUNS, so:
--   * this migration contains no secret and does not need it to exist yet;
--   * rotating it is a Vault update, not a new migration;
--   * until it exists the job posts "Bearer " (empty) and the dispatcher answers
--     401 — harmless noise in net._http_response, nothing is sent to any device.
-- Create it once, outside version control:
--   select vault.create_secret('<random 32+ byte secret>', 'live_activity_dispatch_secret');
-- and give the live-activity-dispatch function the same value as its secret.
--
-- cron.schedule with an existing job name replaces that job, so re-running this
-- file is safe.
--
-- timeout_milliseconds is how long pg_net waits for the dispatcher's answer. It must
-- outlast a whole run, or pg_net gives up on a run that is still sending: the run
-- stops picking up devices after RUN_BUDGET_MS = 45 s (live-activity-dispatch), and
-- the last device it picked up can take up to ~40 s more (RevenueCat 10 s, two APNs
-- sends at 10 s each, the database writes). 100 s covers that with ~15 s to spare,
-- and stays under the Edge Functions limits (Supabase docs, fetched 2026-11-02:
-- wall clock 150 s on the free plan, 400 s paid; request idle timeout 150 s).
-- Raise the two together.
SELECT cron.schedule(
  'live-activity-dispatch',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://kfoogulmkylgtxwqbeat.supabase.co/functions/v1/live-activity-dispatch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(
          (SELECT decrypted_secret
             FROM vault.decrypted_secrets
            WHERE name = 'live_activity_dispatch_secret'),
          ''
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 100000
    );
  $$
);
