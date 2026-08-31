-- 006_content_story.sql
-- Add the optional per-verse narrative to the content table.
--
-- JSONB rather than TEXT to match prophetic_practice (002), which this field
-- copies end to end. Nullable with no default: absent is the normal state, and
-- a verse gets a story only when one genuinely belongs.
--
-- ALTER rather than a table rewrite, following 003's precedent for
-- prayer_context.

ALTER TABLE public.content
ADD COLUMN IF NOT EXISTS story JSONB;
