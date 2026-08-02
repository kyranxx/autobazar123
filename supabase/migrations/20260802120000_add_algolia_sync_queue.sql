-- Keep Algolia synchronized with every database-level ads mutation.
-- The queue is intentionally independent from public.ads so DELETE events
-- retain the object ID long enough for the external index cleanup.

CREATE TABLE IF NOT EXISTS public.algolia_sync_queue (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ad_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('upsert', 'delete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempts INTEGER NOT NULL DEFAULT 0,
  locked_at TIMESTAMPTZ,
  claim_token UUID,
  processed_at TIMESTAMPTZ,
  last_error TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS algolia_sync_queue_pending_ad_idx
  ON public.algolia_sync_queue (ad_id)
  WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS algolia_sync_queue_pending_order_idx
  ON public.algolia_sync_queue (available_at, id)
  WHERE processed_at IS NULL;

ALTER TABLE public.algolia_sync_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.algolia_sync_queue FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.algolia_sync_queue TO service_role;

CREATE OR REPLACE FUNCTION public.claim_algolia_sync_queue(
  p_batch_size INTEGER DEFAULT 100
)
RETURNS SETOF public.algolia_sync_queue
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH candidates AS (
    SELECT id
    FROM public.algolia_sync_queue
    WHERE processed_at IS NULL
      AND available_at <= NOW()
      AND (
        locked_at IS NULL
        OR locked_at < NOW() - INTERVAL '10 minutes'
      )
    ORDER BY id
    LIMIT LEAST(GREATEST(COALESCE(p_batch_size, 100), 1), 100)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.algolia_sync_queue AS queue
  SET
    locked_at = NOW(),
    claim_token = gen_random_uuid(),
    attempts = queue.attempts + 1
  FROM candidates
  WHERE queue.id = candidates.id
  RETURNING queue.*;
$$;

REVOKE ALL ON FUNCTION public.claim_algolia_sync_queue(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_algolia_sync_queue(INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_algolia_sync_for_ad()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_ad_id UUID;
  next_operation TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    next_ad_id := OLD.id;
    next_operation := 'delete';
  ELSE
    next_ad_id := NEW.id;
    next_operation := CASE
      WHEN NEW.status = 'active' AND COALESCE(NEW.is_hidden, FALSE) = FALSE
        THEN 'upsert'
      ELSE 'delete'
    END;
  END IF;

  INSERT INTO public.algolia_sync_queue (
    ad_id,
    operation,
    available_at,
    attempts,
    locked_at,
    claim_token,
    last_error
  )
  VALUES (
    next_ad_id,
    next_operation,
    NOW(),
    0,
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (ad_id) WHERE processed_at IS NULL
  DO UPDATE SET
    operation = EXCLUDED.operation,
    available_at = NOW(),
    attempts = 0,
    locked_at = NULL,
    claim_token = NULL,
    last_error = NULL;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS ads_algolia_sync_queue ON public.ads;

CREATE TRIGGER ads_algolia_sync_queue
  AFTER INSERT OR DELETE OR UPDATE OF
    market_code,
    status,
    is_hidden,
    brand_id,
    model_id,
    brand,
    model,
    generation,
    year,
    price_eur,
    mileage_km,
    fuel,
    transmission,
    body_style,
    power_kw,
    location_city,
    description,
    photos_json,
    promotion_tier,
    is_top_ad,
    is_highlighted,
    is_vat_deductible,
    has_service_book,
    not_crashed,
    is_bought_in_sk,
    created_at
  ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_algolia_sync_for_ad();

-- Give the worker a safe initial backlog. The full index sync remains the
-- authoritative repair for stale records that predate this trigger.
INSERT INTO public.algolia_sync_queue (ad_id, operation)
SELECT
  ads.id,
  CASE
    WHEN ads.status = 'active' AND COALESCE(ads.is_hidden, FALSE) = FALSE
      THEN 'upsert'
    ELSE 'delete'
  END
FROM public.ads AS ads
ON CONFLICT (ad_id) WHERE processed_at IS NULL DO NOTHING;
