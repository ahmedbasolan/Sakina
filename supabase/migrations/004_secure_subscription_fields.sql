-- 004_secure_subscription_fields.sql
-- Prevent authenticated users from directly modifying subscription-sensitive
-- columns on user_profiles. Only service_role (Edge Functions that have
-- validated a receipt with RevenueCat/App Store) may write these fields.
--
-- Run in: Supabase Dashboard → SQL Editor → New query

-- ── Trigger guard ────────────────────────────────────────────────────────────
-- For any UPDATE by an authenticated user, silently reset subscription fields
-- back to their existing values. This makes client-side writes to those columns
-- a no-op rather than an error, which avoids exposing the guard to attackers.
CREATE OR REPLACE FUNCTION public.guard_subscription_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- service_role (server-side Edge Functions) may update any field freely.
  -- authenticated role (Supabase JS client in the mobile app) cannot change
  -- subscription state or unlocked bundles — those flow through RC / server only.
  IF CURRENT_ROLE = 'authenticated' THEN
    NEW.subscription_tier  := OLD.subscription_tier;
    NEW.subscription_type  := OLD.subscription_type;
    NEW.subscription_end   := OLD.subscription_end;
    NEW.is_active          := OLD.is_active;
    NEW.unlocked_bundles   := OLD.unlocked_bundles;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS guard_subscription_fields_trigger ON public.user_profiles;
CREATE TRIGGER guard_subscription_fields_trigger
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_subscription_fields();
