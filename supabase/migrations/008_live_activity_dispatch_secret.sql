-- 008_live_activity_dispatch_secret.sql
-- Lets the live-activity-dispatch edge function read the cron's shared secret
-- from Vault, so the secret lives in ONE place.
--
-- Before this, the function compared the cron's bearer to a DISPATCH_SECRET env
-- var that had to be pasted by hand to match the Vault secret
-- 'live_activity_dispatch_secret' exactly. Two copies of one random value is a
-- setup step that is easy to get wrong (it was, on the first try), and the
-- mismatch shows only as a 401 every minute. Now the cron and the function read
-- the same Vault row.
--
-- SECURITY DEFINER because only the owner can read vault.decrypted_secrets;
-- EXECUTE is revoked from PUBLIC/anon/authenticated and granted to service_role
-- only, so nothing reachable from the app can call it. search_path is empty and
-- every reference is schema-qualified.
--
-- The secret itself is created once, outside version control:
--   select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'),
--                              'live_activity_dispatch_secret');
-- Rotating it is `vault.update_secret`; no redeploy needed.

CREATE OR REPLACE FUNCTION public.live_activity_dispatch_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT decrypted_secret
    FROM vault.decrypted_secrets
   WHERE name = 'live_activity_dispatch_secret'
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.live_activity_dispatch_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.live_activity_dispatch_secret() TO service_role;
