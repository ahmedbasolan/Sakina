-- 004_secure_subscription_fields.sql
-- Prevent authenticated users from directly modifying subscription-sensitive
-- columns on user_profiles. Only service_role (Edge Functions that have
-- validated a receipt with RevenueCat/App Store) may write these fields.
--
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- NOTE: SECURITY DEFINER is intentionally NOT used here. Inside a
-- SECURITY DEFINER function, CURRENT_ROLE returns the function owner
-- (postgres/supabase_admin), never the calling client's role. Without
-- SECURITY DEFINER, PostgreSQL runs the trigger under the calling role,
-- so CURRENT_ROLE correctly reflects 'authenticated' vs 'service_role'
-- as set by PostgREST's SET LOCAL ROLE at the start of each request.

-- ── Trigger guard ────────────────────────────────────────────────────────────
-- For any INSERT or UPDATE by an authenticated user, reset subscription fields
-- to safe defaults / existing values. service_role requests (Edge Functions
-- that have validated a receipt with RevenueCat) pass through unmodified.
-- Covers INSERT so a crafted row can't bypass the UPDATE guard via pk collision.
CREATE OR REPLACE FUNCTION public.guard_subscription_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF CURRENT_ROLE = 'authenticated' THEN
    IF TG_OP = 'INSERT' THEN
      -- Force safe defaults on any client-driven INSERT.
      NEW.subscription_tier  := 'free';
      NEW.subscription_type  := NULL;
      NEW.subscription_end   := NULL;
      NEW.is_active          := FALSE;
      NEW.unlocked_bundles   := '[]'::jsonb;
    ELSE
      -- UPDATE: silently restore fields to their current server values.
      NEW.subscription_tier  := OLD.subscription_tier;
      NEW.subscription_type  := OLD.subscription_type;
      NEW.subscription_end   := OLD.subscription_end;
      NEW.is_active          := OLD.is_active;
      NEW.unlocked_bundles   := OLD.unlocked_bundles;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guard_subscription_fields_trigger ON public.user_profiles;
CREATE TRIGGER guard_subscription_fields_trigger
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_subscription_fields();
