CREATE TABLE IF NOT EXISTS public.taxonomy_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  candidate_key TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  brand_name TEXT NOT NULL,
  brand_slug TEXT NOT NULL,
  model_name TEXT,
  model_slug TEXT,
  source_external_id TEXT,
  confidence NUMERIC(4, 3) NOT NULL DEFAULT 0.500,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen_count INTEGER NOT NULL DEFAULT 1,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  promoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT taxonomy_candidates_entity_type_check
    CHECK (entity_type IN ('brand', 'model')),
  CONSTRAINT taxonomy_candidates_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'imported')),
  CONSTRAINT taxonomy_candidates_confidence_check
    CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT taxonomy_candidates_seen_count_check
    CHECK (seen_count > 0),
  CONSTRAINT taxonomy_candidates_model_fields_check
    CHECK (
      (entity_type = 'brand' AND model_name IS NULL AND model_slug IS NULL)
      OR
      (entity_type = 'model' AND model_name IS NOT NULL AND model_slug IS NOT NULL)
    ),
  CONSTRAINT taxonomy_candidates_source_key_unique
    UNIQUE (source, candidate_key)
);

CREATE INDEX IF NOT EXISTS idx_taxonomy_candidates_status_source_seen
  ON public.taxonomy_candidates(status, source, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_taxonomy_candidates_brand_model
  ON public.taxonomy_candidates(brand_slug, model_slug);

CREATE INDEX IF NOT EXISTS idx_taxonomy_candidates_source_external_id
  ON public.taxonomy_candidates(source, source_external_id)
  WHERE source_external_id IS NOT NULL;

ALTER TABLE public.taxonomy_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read taxonomy candidates" ON public.taxonomy_candidates;
CREATE POLICY "Admins can read taxonomy candidates"
ON public.taxonomy_candidates
FOR SELECT
TO authenticated
USING ((SELECT public.is_current_user_site_admin()));

DROP POLICY IF EXISTS "Admins can review taxonomy candidates" ON public.taxonomy_candidates;
CREATE POLICY "Admins can review taxonomy candidates"
ON public.taxonomy_candidates
FOR UPDATE
TO authenticated
USING ((SELECT public.is_current_user_site_admin()))
WITH CHECK ((SELECT public.is_current_user_site_admin()));

DROP POLICY IF EXISTS "Service role full access to taxonomy candidates" ON public.taxonomy_candidates;
CREATE POLICY "Service role full access to taxonomy candidates"
ON public.taxonomy_candidates
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_taxonomy_candidates_updated_at ON public.taxonomy_candidates;
CREATE TRIGGER trg_taxonomy_candidates_updated_at
BEFORE UPDATE ON public.taxonomy_candidates
FOR EACH ROW
EXECUTE FUNCTION public.set_table_updated_at();
