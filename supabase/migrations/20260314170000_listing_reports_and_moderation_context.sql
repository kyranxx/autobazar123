BEGIN;

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS moderation_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderation_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderation_reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderation_rejection_note TEXT;

UPDATE public.ads
SET moderation_submitted_at = COALESCE(moderation_submitted_at, created_at)
WHERE status = 'pending'
  AND moderation_submitted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.listing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (
    category IN ('fraud', 'duplicate', 'incorrect_info', 'prohibited', 'abuse', 'other')
  ),
  details TEXT NOT NULL CHECK (char_length(btrim(details)) BETWEEN 10 AND 1000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'reviewing', 'resolved', 'dismissed')
  ),
  resolution_note TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_reports_ad_status
ON public.listing_reports(ad_id, status);

CREATE INDEX IF NOT EXISTS idx_listing_reports_status_created_at
ON public.listing_reports(status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_reports_open_reporter_ad
ON public.listing_reports(ad_id, reporter_id)
WHERE reporter_id IS NOT NULL AND status IN ('open', 'reviewing');

ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reporters can read own listing reports" ON public.listing_reports;
CREATE POLICY "Reporters can read own listing reports"
ON public.listing_reports
FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

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

CREATE OR REPLACE FUNCTION public.publish_ad_with_credits(
  p_ad_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_current_credits INTEGER;
  v_new_credits INTEGER;
  v_ad_id UUID;
  v_credits_needed INTEGER := 1;
  v_brand_id UUID;
  v_model_id UUID;
  v_brand_name TEXT;
  v_model_name TEXT;
  v_photos JSONB;
  v_photo_count INTEGER;
  v_invalid_photo_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;

  IF p_ad_data IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ad payload is required'
    );
  END IF;

  v_brand_id := (p_ad_data->>'brand_id')::UUID;
  v_model_id := (p_ad_data->>'model_id')::UUID;

  IF v_brand_id IS NULL OR v_model_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Brand and model are required'
    );
  END IF;

  v_photos := COALESCE(p_ad_data->'photos_json', '[]'::JSONB);

  IF jsonb_typeof(v_photos) IS DISTINCT FROM 'array' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid photos payload'
    );
  END IF;

  v_photo_count := jsonb_array_length(v_photos);

  IF v_photo_count < 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'At least one photo is required'
    );
  END IF;

  IF v_photo_count > 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Maximum of 10 photos allowed'
    );
  END IF;

  SELECT COUNT(*)
  INTO v_invalid_photo_count
  FROM jsonb_array_elements(v_photos) AS photo(value)
  WHERE jsonb_typeof(photo.value) <> 'string'
    OR NULLIF(BTRIM(photo.value #>> '{}'), '') IS NULL
    OR (photo.value #>> '{}') !~ '^https://imagedelivery\\.net/';

  IF v_invalid_photo_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Photos must be valid Cloudflare image URLs'
    );
  END IF;

  SELECT b.name
  INTO v_brand_name
  FROM brands b
  WHERE b.id = v_brand_id;

  IF v_brand_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid brand'
    );
  END IF;

  SELECT m.name
  INTO v_model_name
  FROM models m
  WHERE m.id = v_model_id
    AND m.brand_id = v_brand_id;

  IF v_model_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid model'
    );
  END IF;

  SELECT credit_balance
  INTO v_current_credits
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL OR v_current_credits < v_credits_needed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'required', v_credits_needed,
      'current_balance', COALESCE(v_current_credits, 0)
    );
  END IF;

  v_new_credits := v_current_credits - v_credits_needed;

  INSERT INTO ads (
    seller_id,
    brand_id,
    model_id,
    brand,
    model,
    year,
    price_eur,
    mileage_km,
    fuel,
    transmission,
    body_style,
    power_kw,
    engine_volume_cm3,
    drive_type,
    color,
    location_city,
    location_district,
    description,
    is_bought_in_sk,
    is_vat_deductible,
    has_service_book,
    full_service_history,
    originality_check,
    garage_kept,
    not_crashed,
    is_imported,
    warranty_expiration,
    photos_json,
    equipment_json,
    status,
    published_at,
    expires_at,
    moderation_submitted_at,
    moderation_reviewed_at,
    moderation_reviewed_by,
    moderation_rejection_note,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_brand_id,
    v_model_id,
    v_brand_name,
    v_model_name,
    (p_ad_data->>'year')::INTEGER,
    (p_ad_data->>'price_eur')::NUMERIC,
    (p_ad_data->>'mileage_km')::INTEGER,
    (p_ad_data->>'fuel')::fuel_type,
    (p_ad_data->>'transmission')::transmission_type,
    (p_ad_data->>'body_style')::body_type,
    (p_ad_data->>'power_kw')::INTEGER,
    (p_ad_data->>'engine_volume_cm3')::INTEGER,
    p_ad_data->>'drive_type',
    p_ad_data->>'color',
    p_ad_data->>'location_city',
    p_ad_data->>'location_district',
    p_ad_data->>'description',
    COALESCE((p_ad_data->>'is_bought_in_sk')::BOOLEAN, FALSE),
    COALESCE((p_ad_data->>'is_vat_deductible')::BOOLEAN, FALSE),
    COALESCE((p_ad_data->>'has_service_book')::BOOLEAN, FALSE),
    COALESCE((p_ad_data->>'full_service_history')::BOOLEAN, FALSE),
    COALESCE((p_ad_data->>'originality_check')::BOOLEAN, FALSE),
    COALESCE((p_ad_data->>'garage_kept')::BOOLEAN, FALSE),
    COALESCE((p_ad_data->>'not_crashed')::BOOLEAN, FALSE),
    COALESCE((p_ad_data->>'is_imported')::BOOLEAN, FALSE),
    (p_ad_data->>'warranty_expiration')::TIMESTAMPTZ,
    v_photos,
    COALESCE(p_ad_data->'equipment_json', '[]'::JSONB),
    'pending',
    NULL,
    NULL,
    NOW(),
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_ad_id;

  UPDATE profiles
  SET credit_balance = v_new_credits
  WHERE id = v_user_id;

  INSERT INTO credit_transactions (
    user_id,
    action_type,
    amount,
    description,
    ad_id,
    created_at
  ) VALUES (
    v_user_id,
    'publish',
    -v_credits_needed,
    'Submitted ad for moderation',
    v_ad_id,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'ad_id', v_ad_id,
    'new_balance', v_new_credits
  );
END;
$$;

COMMIT;
