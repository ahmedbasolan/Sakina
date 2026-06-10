-- 003_content_time_awareness.sql
-- Add prayer_context support to content table

ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS prayer_context TEXT[] DEFAULT '{}';

-- Index for searching within the array
-- GIN index is optimal for array containment queries
CREATE INDEX IF NOT EXISTS idx_content_prayer_context ON public.content USING GIN (prayer_context);
