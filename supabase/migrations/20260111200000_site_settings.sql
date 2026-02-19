-- =====================================================
-- Autobazar123 - Site Settings Table
-- For Maintenance Mode and Other Global Config
-- =====================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
-- 1. Anyone can read site settings (needed for middleware to check maintenance mode)
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
CREATE POLICY "Anyone can read site settings" 
ON public.site_settings FOR SELECT USING (true);
-- 2. Only admins can modify site settings
-- This policy uses the site_admins table to verify admin status
DROP POLICY IF EXISTS "Admins can modify site settings" ON public.site_settings;
CREATE POLICY "Admins can modify site settings" 
ON public.site_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.site_admins 
        WHERE user_id = auth.uid()
    )
);
-- Initial seeding
INSERT INTO public.site_settings (key, value) 
VALUES 
    ('maintenance_mode', 'false'),
    ('maintenance_password', 'autobazar2026')
ON CONFLICT (key) DO NOTHING;
