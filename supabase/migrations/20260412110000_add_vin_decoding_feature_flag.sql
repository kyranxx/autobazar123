INSERT INTO public.feature_flags (
  key,
  name,
  description,
  enabled,
  rollout_percentage,
  target_users
)
VALUES (
  'vin_decoding',
  'VIN Decoding',
  'Enable Vincario VIN decoding in listing forms',
  false,
  100,
  '[]'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rollout_percentage = 100,
  updated_at = NOW();
