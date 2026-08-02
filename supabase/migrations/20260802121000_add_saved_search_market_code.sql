-- Saved searches are market-specific because their alert queries read ads.
ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS market_code TEXT;

UPDATE public.saved_searches
SET market_code = 'SK'
WHERE market_code IS NULL;

ALTER TABLE public.saved_searches
  ALTER COLUMN market_code SET DEFAULT 'SK',
  ALTER COLUMN market_code SET NOT NULL;

ALTER TABLE public.saved_searches
  DROP CONSTRAINT IF EXISTS saved_searches_user_id_query_fingerprint_key;

ALTER TABLE public.saved_searches
  DROP CONSTRAINT IF EXISTS saved_searches_user_market_query_fingerprint_key;

ALTER TABLE public.saved_searches
  ADD CONSTRAINT saved_searches_user_market_query_fingerprint_key
  UNIQUE (user_id, market_code, query_fingerprint);

CREATE INDEX IF NOT EXISTS idx_saved_searches_market_active
  ON public.saved_searches(market_code, paused, notify_email);
