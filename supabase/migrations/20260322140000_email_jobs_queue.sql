-- Queue email delivery work so request handlers do not block on external SMTP/API latency.

CREATE TABLE IF NOT EXISTS public.email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (
    job_type IN (
      'auth_register_confirmation',
      'auth_password_reset',
      'moderation_decision',
      'payment_confirmation',
      'payment_failure',
      'payment_invoice'
    )
  ),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'sent', 'failed')
  ),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 10),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_jobs_status_available_at
ON public.email_jobs(status, available_at ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_email_jobs_locked_at
ON public.email_jobs(locked_at)
WHERE status = 'processing';

CREATE INDEX IF NOT EXISTS idx_email_jobs_created_at
ON public.email_jobs(created_at DESC);

ALTER TABLE public.email_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read email jobs" ON public.email_jobs;
CREATE POLICY "Admins can read email jobs"
ON public.email_jobs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role full access to email jobs" ON public.email_jobs;
CREATE POLICY "Service role full access to email jobs"
ON public.email_jobs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

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
      jobs.status = 'pending'
      AND jobs.available_at <= NOW()
      AND jobs.attempts < jobs.max_attempts
    ) OR (
      jobs.status = 'processing'
      AND jobs.locked_at IS NOT NULL
      AND jobs.locked_at <= p_processing_stale_before
      AND jobs.attempts < jobs.max_attempts
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
