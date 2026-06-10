-- ══════════════════════════════════════════════════════════════════
-- Guidance App — Initial Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────
-- 1. USER PROFILES
-- Auto-created on signup via trigger
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  subscription_type TEXT,
  subscription_end  TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_bundles  JSONB DEFAULT '[]',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ──────────────────────────────────────────────
-- 2. USER HISTORY (mood tracking + rotation)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_history (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id  TEXT NOT NULL,
  angle_id    TEXT NOT NULL,
  mood        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_history_user_date
  ON public.user_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_history_user_mood
  ON public.user_history(user_id, mood);

ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own history" ON public.user_history;
CREATE POLICY "Users can view own history"
  ON public.user_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own history" ON public.user_history;
CREATE POLICY "Users can insert own history"
  ON public.user_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own history" ON public.user_history;
CREATE POLICY "Users can delete own history"
  ON public.user_history FOR DELETE
  USING (auth.uid() = user_id);


-- ──────────────────────────────────────────────
-- 3. USER PATH PROGRESS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_path_progress (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id         TEXT NOT NULL,
  current_day     INT NOT NULL DEFAULT 1,
  start_date      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_days  JSONB DEFAULT '[]',
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  UNIQUE(user_id, path_id)
);

CREATE INDEX IF NOT EXISTS idx_path_progress_user
  ON public.user_path_progress(user_id);

ALTER TABLE public.user_path_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own path progress" ON public.user_path_progress;
CREATE POLICY "Users can view own path progress"
  ON public.user_path_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own path progress" ON public.user_path_progress;
CREATE POLICY "Users can manage own path progress"
  ON public.user_path_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ──────────────────────────────────────────────
-- 4. HELPER: updated_at trigger
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
