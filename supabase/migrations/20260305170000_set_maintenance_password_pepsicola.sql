-- Maintenance unlock password is now env-backed.
-- Keep database state clean and remove any legacy DB-backed secret value.
DELETE FROM public.site_settings
WHERE key = 'maintenance_password';
