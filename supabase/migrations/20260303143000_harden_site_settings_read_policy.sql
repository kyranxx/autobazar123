-- Harden site settings visibility:
-- - Public should only read maintenance mode flag.
-- - Maintenance unlock password must not remain on a known default value.

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read maintenance mode setting" ON public.site_settings;

CREATE POLICY "Public can read maintenance mode setting"
ON public.site_settings
FOR SELECT
USING (key = 'maintenance_mode');

-- Force explicit operator configuration instead of known seeded default.
UPDATE public.site_settings
SET value = ''
WHERE key = 'maintenance_password'
  AND value = 'autobazar2026';
