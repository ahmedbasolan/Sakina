-- 002_content_schema.sql
-- Migration to support core guidance content in Supabase

-- 1. Content Table
CREATE TABLE IF NOT EXISTS public.content (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    primary_text TEXT NOT NULL,
    arabic_text TEXT,
    transliteration TEXT,
    english_translation TEXT NOT NULL,
    source TEXT NOT NULL,
    audio_key TEXT,
    why_this TEXT NOT NULL,
    prophetic_practice JSONB,
    optional_action TEXT,
    optional_reflection TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Content Angles Table
CREATE TABLE IF NOT EXISTS public.content_angles (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    mood TEXT NOT NULL,
    angle TEXT NOT NULL,
    angle_source TEXT,
    action TEXT,
    action_arabic_text TEXT,
    action_transliteration TEXT,
    action_source TEXT,
    action_how_to TEXT,
    action_reward TEXT,
    practice_steps JSONB,
    reflection TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Content Moods Table (Many-to-Many join for discovery)
CREATE TABLE IF NOT EXISTS public.content_moods (
    content_id TEXT NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    mood TEXT NOT NULL,
    relevance_score INTEGER NOT NULL DEFAULT 10,
    PRIMARY KEY (content_id, mood)
);

-- 4. Enable RLS
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_angles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moods ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Guidance content is read-only for public/authenticated users)
-- Note: In a production app, you might want to restrict this to authenticated users only or keep it public for SEO.
DROP POLICY IF EXISTS "Allow public read-only access to content" ON public.content;
CREATE POLICY "Allow public read-only access to content" ON public.content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read-only access to content_angles" ON public.content_angles;
CREATE POLICY "Allow public read-only access to content_angles" ON public.content_angles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read-only access to content_moods" ON public.content_moods;
CREATE POLICY "Allow public read-only access to content_moods" ON public.content_moods FOR SELECT USING (true);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_content_type ON public.content(type);
CREATE INDEX IF NOT EXISTS idx_content_angles_mood ON public.content_angles(mood);
CREATE INDEX IF NOT EXISTS idx_content_moods_mood ON public.content_moods(mood);
