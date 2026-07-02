ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS market_code TEXT DEFAULT 'SK';

UPDATE public.ads
SET market_code = 'SK'
WHERE market_code IS NULL;

ALTER TABLE public.ads
  ALTER COLUMN market_code SET DEFAULT 'SK',
  ALTER COLUMN market_code SET NOT NULL;

ALTER TABLE public.ads
  DROP CONSTRAINT IF EXISTS ads_market_code_check;

ALTER TABLE public.ads
  ADD CONSTRAINT ads_market_code_check
  CHECK (market_code IN ('SK', 'RO'));

CREATE INDEX IF NOT EXISTS ads_public_market_status_idx
  ON public.ads (market_code, status, is_hidden, updated_at DESC)
  WHERE status = 'active' AND is_hidden = false;
