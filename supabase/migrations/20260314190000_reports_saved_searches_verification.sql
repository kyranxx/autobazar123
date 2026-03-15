BEGIN;

ALTER TABLE public.listing_reports
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.listing_reports AS reports
SET seller_id = ads.seller_id
FROM public.ads AS ads
WHERE reports.ad_id = ads.id
  AND reports.seller_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_listing_reports_status_created_at
ON public.listing_reports(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_reports_ad_id
ON public.listing_reports(ad_id);

CREATE INDEX IF NOT EXISTS idx_listing_reports_reporter_id
ON public.listing_reports(reporter_id);

ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own listing reports" ON public.listing_reports;
CREATE POLICY "Users can insert own listing reports"
ON public.listing_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can read own listing reports" ON public.listing_reports;
CREATE POLICY "Users can read own listing reports"
ON public.listing_reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can read listing reports" ON public.listing_reports;
CREATE POLICY "Admins can read listing reports"
ON public.listing_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can update listing reports" ON public.listing_reports;
CREATE POLICY "Admins can update listing reports"
ON public.listing_reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.site_admins
    WHERE site_admins.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role full access to listing reports" ON public.listing_reports;
CREATE POLICY "Service role full access to listing reports"
ON public.listing_reports
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (char_length(btrim(label)) BETWEEN 1 AND 120),
  query_string TEXT NOT NULL DEFAULT '',
  query_fingerprint TEXT NOT NULL,
  filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  notify_email BOOLEAN NOT NULL DEFAULT TRUE,
  paused BOOLEAN NOT NULL DEFAULT FALSE,
  last_notified_listing_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, query_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id
ON public.saved_searches(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_searches_active
ON public.saved_searches(user_id, paused, notify_email);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own saved searches" ON public.saved_searches;
CREATE POLICY "Users can read own saved searches"
ON public.saved_searches
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved searches" ON public.saved_searches;
CREATE POLICY "Users can insert own saved searches"
ON public.saved_searches
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved searches" ON public.saved_searches;
CREATE POLICY "Users can update own saved searches"
ON public.saved_searches
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved searches" ON public.saved_searches;
CREATE POLICY "Users can delete own saved searches"
ON public.saved_searches
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to saved searches" ON public.saved_searches;
CREATE POLICY "Service role full access to saved searches"
ON public.saved_searches
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.dealer_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  requester_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_note TEXT NOT NULL DEFAULT '' CHECK (char_length(btrim(request_note)) <= 2000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_dealer_verification_requests_status_created_at
ON public.dealer_verification_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dealer_verification_requests_dealer_id
ON public.dealer_verification_requests(dealer_id);

ALTER TABLE public.dealer_verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dealers can read own verification requests" ON public.dealer_verification_requests;
CREATE POLICY "Dealers can read own verification requests"
ON public.dealer_verification_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = requester_user_id
  OR EXISTS (
    SELECT 1
    FROM public.dealers
    WHERE dealers.id = dealer_id
      AND dealers.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Dealers can create own verification requests" ON public.dealer_verification_requests;
CREATE POLICY "Dealers can create own verification requests"
ON public.dealer_verification_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = requester_user_id
  AND EXISTS (
    SELECT 1
    FROM public.dealers
    WHERE dealers.id = dealer_id
      AND dealers.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can read dealer verification requests" ON public.dealer_verification_requests;
CREATE POLICY "Admins can read dealer verification requests"
ON public.dealer_verification_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can update dealer verification requests" ON public.dealer_verification_requests;
CREATE POLICY "Admins can update dealer verification requests"
ON public.dealer_verification_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.site_admins
    WHERE site_admins.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role full access to dealer verification requests" ON public.dealer_verification_requests;
CREATE POLICY "Service role full access to dealer verification requests"
ON public.dealer_verification_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

ALTER TABLE public.saved_ad_alert_preferences
ADD COLUMN IF NOT EXISTS last_alerted_price_eur DECIMAL(10, 2);

ALTER TABLE public.saved_ad_alert_preferences
ADD COLUMN IF NOT EXISTS last_alerted_status TEXT;

ALTER TABLE public.saved_ad_alert_preferences
ADD COLUMN IF NOT EXISTS last_alerted_at TIMESTAMPTZ;

UPDATE public.saved_ad_alert_preferences
SET
  last_alerted_price_eur = COALESCE(last_alerted_price_eur, baseline_price_eur),
  last_alerted_status = COALESCE(last_alerted_status, baseline_status::TEXT)
WHERE last_alerted_price_eur IS NULL
   OR last_alerted_status IS NULL;

CREATE OR REPLACE FUNCTION public.set_table_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listing_reports_updated_at ON public.listing_reports;
CREATE TRIGGER trg_listing_reports_updated_at
BEFORE UPDATE ON public.listing_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_table_updated_at();

DROP TRIGGER IF EXISTS trg_saved_searches_updated_at ON public.saved_searches;
CREATE TRIGGER trg_saved_searches_updated_at
BEFORE UPDATE ON public.saved_searches
FOR EACH ROW
EXECUTE FUNCTION public.set_table_updated_at();

DROP TRIGGER IF EXISTS trg_dealer_verification_requests_updated_at ON public.dealer_verification_requests;
CREATE TRIGGER trg_dealer_verification_requests_updated_at
BEFORE UPDATE ON public.dealer_verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_table_updated_at();

COMMIT;
