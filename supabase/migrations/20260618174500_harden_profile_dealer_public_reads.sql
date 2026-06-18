BEGIN;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins can read profiles" ON public.profiles;

CREATE POLICY "Users and admins can read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (SELECT public.is_current_user_site_admin())
);

DROP POLICY IF EXISTS "Dealers are viewable by everyone" ON public.dealers;
DROP POLICY IF EXISTS "Dealer owners and admins can read dealers" ON public.dealers;
DROP POLICY IF EXISTS "Service role full access to dealers" ON public.dealers;

CREATE POLICY "Dealer owners and admins can read dealers"
ON public.dealers
FOR SELECT
TO authenticated
USING (
  owner_id = (SELECT auth.uid())
  OR (SELECT public.is_current_user_site_admin())
);

CREATE POLICY "Service role full access to dealers"
ON public.dealers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert own ads" ON public.ads;
DROP POLICY IF EXISTS "Sellers and admins can update ads" ON public.ads;
DROP POLICY IF EXISTS "Sellers can delete own ads" ON public.ads;

CREATE POLICY "Users can insert own ads"
ON public.ads
FOR INSERT
TO authenticated
WITH CHECK (seller_id = (SELECT auth.uid()));

CREATE POLICY "Sellers and admins can update ads"
ON public.ads
FOR UPDATE
TO authenticated
USING (
  seller_id = (SELECT auth.uid())
  OR (SELECT public.is_current_user_site_admin())
)
WITH CHECK (
  seller_id = (SELECT auth.uid())
  OR (SELECT public.is_current_user_site_admin())
);

CREATE POLICY "Sellers can delete own ads"
ON public.ads
FOR DELETE
TO authenticated
USING (seller_id = (SELECT auth.uid()));

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT
  id,
  full_name,
  avatar_url,
  is_verified,
  created_at
FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM PUBLIC;
GRANT SELECT ON public.public_profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_email_jobs(
  p_job_types TEXT[] DEFAULT NULL,
  p_batch_size INTEGER DEFAULT 10,
  p_processing_stale_before TIMESTAMPTZ DEFAULT NOW() - INTERVAL '10 minutes'
)
RETURNS SETOF public.email_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_size INTEGER := LEAST(GREATEST(COALESCE(p_batch_size, 10), 1), 100);
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT jobs.id
    FROM public.email_jobs AS jobs
    WHERE (
      (
        jobs.status = 'pending'
        AND jobs.available_at <= NOW()
        AND jobs.attempts < jobs.max_attempts
      ) OR (
        jobs.status = 'processing'
        AND jobs.locked_at IS NOT NULL
        AND jobs.locked_at <= p_processing_stale_before
        AND jobs.attempts < jobs.max_attempts
      )
    )
    AND (p_job_types IS NULL OR jobs.job_type = ANY(p_job_types))
    ORDER BY jobs.available_at ASC, jobs.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT v_batch_size
  ),
  claimed AS (
    UPDATE public.email_jobs AS jobs
    SET
      status = 'processing',
      attempts = jobs.attempts + 1,
      locked_at = NOW(),
      updated_at = NOW(),
      error_message = NULL
    FROM candidates
    WHERE jobs.id = candidates.id
    RETURNING jobs.*
  )
  SELECT *
  FROM claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_email_jobs(TEXT[], INTEGER, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_email_jobs(TEXT[], INTEGER, TIMESTAMPTZ) FROM anon;
REVOKE ALL ON FUNCTION public.claim_email_jobs(TEXT[], INTEGER, TIMESTAMPTZ) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_email_jobs(TEXT[], INTEGER, TIMESTAMPTZ) TO service_role;

COMMIT;
