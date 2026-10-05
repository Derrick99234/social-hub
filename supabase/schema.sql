-- ==============================================================================
-- 🚀 Unified Social Content Hub - Supabase Database Schema & Storage Setup
-- ==============================================================================
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create 'posts' table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    content TEXT NOT NULL,
    channels TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('idea', 'draft', 'scheduled', 'published', 'failed')),
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    media_urls TEXT[] DEFAULT '{}',
    author_role TEXT DEFAULT 'marketer' CHECK (author_role IN ('founder', 'marketer', 'admin')),
    author_name TEXT DEFAULT 'Marketer',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create 'dispatch_logs' table for per-platform audit & tracking
CREATE TABLE IF NOT EXISTS public.dispatch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('twitter', 'threads', 'linkedin', 'instagram')),
    service TEXT NOT NULL CHECK (service IN ('typefully', 'buffer')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'simulated')),
    external_id TEXT,
    external_url TEXT,
    response_payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    dispatched_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create 'ideas' table for Founder fast idea drops
CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_text TEXT NOT NULL,
    author TEXT DEFAULT 'founder',
    tags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox', 'in_progress', 'converted', 'archived')),
    converted_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create index for fast status and date querying
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON public.posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_post_id ON public.dispatch_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON public.ideas(status);

-- 6. Trigger to automatically update 'updated_at' on posts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_posts_updated_at ON public.posts;
CREATE TRIGGER trigger_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_ideas_updated_at ON public.ideas;
CREATE TRIGGER trigger_ideas_updated_at
    BEFORE UPDATE ON public.ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 📦 Storage Bucket Setup ('media')
-- ==============================================================================
-- Insert the 'media' bucket if not existing
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access to media bucket
DROP POLICY IF EXISTS "Public Media Access" ON storage.objects;
CREATE POLICY "Public Media Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated/service-role inserts
DROP POLICY IF EXISTS "Service Role Media Uploads" ON storage.objects;
CREATE POLICY "Service Role Media Uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media');

-- Allow delete/update
DROP POLICY IF EXISTS "Service Role Media Mutations" ON storage.objects;
CREATE POLICY "Service Role Media Mutations"
ON storage.objects FOR ALL
USING (bucket_id = 'media');

-- ==============================================================================
-- 🎉 Seed initial sample data for demonstration
-- ==============================================================================
INSERT INTO public.ideas (raw_text, author, tags, status)
VALUES 
    ('Idea: Why 90% of SaaS founders fail at social media—they treat Twitter like a press release instead of a conversation. Let us break down the 3 rules we use.', 'founder', ARRAY['growth', 'twitter', 'strategy'], 'inbox'),
    ('Raw thought: Behind the scenes of shipping our multi-channel scheduler. 1 click to 4 platforms. Took 2 weeks of API wrangling.', 'founder', ARRAY['behind-the-scenes', 'product'], 'inbox')
ON CONFLICT DO NOTHING;

INSERT INTO public.posts (title, content, channels, status, scheduled_at, author_role, author_name)
VALUES 
    (
        'The Content Flywheel Breakdown',
        'Stop creating content for 4 different platforms from scratch. 🛑

Here is how our 2-person marketing team scales our distribution 10x:

1. Founder drops raw voice notes into the Idea Inbox
2. Marketer polishes hooks and formats platform-specific previews
3. 1-click dispatches via Typefully (X + Threads) & Buffer (LinkedIn + Instagram)

Write once. Dominate everywhere. 🚀 #SaaS #Marketing #SocialMedia #Growth',
        ARRAY['twitter', 'threads', 'linkedin', 'instagram'],
        'scheduled',
        NOW() + INTERVAL '1 day',
        'marketer',
        'Digital Marketer'
    ),
    (
        'Product Launch Announcement',
        'Thrilled to introduce our Unified Social Content Hub! 

Post to X, Threads, LinkedIn, and Instagram in a single click with real-time visual mockups and automated scheduling. 

What is your biggest pain point with social scheduling right now?',
        ARRAY['twitter', 'linkedin'],
        'published',
        NOW() - INTERVAL '2 hours',
        'founder',
        'Founder'
    )
ON CONFLICT DO NOTHING;
