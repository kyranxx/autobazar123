-- =====================================================
-- Autobazar123 - Site Settings Table
-- For Maintenance Mode and Other Global Config
-- =====================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own admin row" ON public.site_admins;
CREATE POLICY "Users can read own admin row"
ON public.site_admins FOR SELECT USING (auth.uid() = user_id);
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
    ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;
