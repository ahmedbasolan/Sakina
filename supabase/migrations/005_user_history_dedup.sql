-- 005_user_history_dedup.sql
--
-- Adds a unique constraint to user_history so that duplicate rows produced by
-- partial migration retries are rejected at the database level rather than
-- silently accumulating.
--
-- The migration code (supabaseDataService.migrateGuestDataToSupabase) is
-- updated to use upsert with ignoreDuplicates:true, so re-runs of a partial
-- migration skip already-uploaded rows instead of failing.
--
-- Step 1: remove any existing duplicate rows (keep the earliest id per group).
DELETE FROM public.user_history
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, content_id, angle_id, created_at) id
  FROM public.user_history
  ORDER BY user_id, content_id, angle_id, created_at, id
);

-- Step 2: add the constraint.
ALTER TABLE public.user_history
  ADD CONSTRAINT unique_user_history_entry
  UNIQUE (user_id, content_id, angle_id, created_at);
