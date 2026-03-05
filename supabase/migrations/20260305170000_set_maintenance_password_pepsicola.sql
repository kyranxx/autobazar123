-- Maintenance unlock cutover requested by operations:
-- ensure a concrete, non-empty maintenance password is configured.
INSERT INTO public.site_settings (key, value)
VALUES ('maintenance_password', 'pepsicola')
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  updated_at = NOW();
