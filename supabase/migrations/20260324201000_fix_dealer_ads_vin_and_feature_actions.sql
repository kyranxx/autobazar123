BEGIN;

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS vin TEXT;

UPDATE public.ads
SET vin = NULLIF(UPPER(REGEXP_REPLACE(vin, '\s+', '', 'g')), '')
WHERE vin IS NOT NULL;

ALTER TABLE public.ads
  DROP CONSTRAINT IF EXISTS ads_vin_format;

ALTER TABLE public.ads
  ADD CONSTRAINT ads_vin_format CHECK (
    vin IS NULL OR vin ~ '^[A-HJ-NPR-Z0-9]{17}$'
  );

WITH seller_dealers AS (
  SELECT
    ads.id AS ad_id,
    (
      SELECT dealers.id
      FROM public.dealers
      WHERE dealers.owner_id = ads.seller_id
      ORDER BY dealers.created_at ASC, dealers.id ASC
      LIMIT 1
    ) AS dealer_id
  FROM public.ads AS ads
  WHERE ads.dealer_id IS NULL
)
UPDATE public.ads AS ads
SET dealer_id = seller_dealers.dealer_id
FROM seller_dealers
WHERE ads.id = seller_dealers.ad_id
  AND seller_dealers.dealer_id IS NOT NULL;

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
  v_auto_publish BOOLEAN := FALSE;
  v_ad_status public.ad_status := 'pending';
  v_published_at TIMESTAMPTZ := NULL;
  v_expires_at TIMESTAMPTZ := NULL;
  v_moderation_submitted_at TIMESTAMPTZ := NOW();
  v_dealer_id UUID := NULL;
  v_vin TEXT := NULL;
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
  v_vin := NULLIF(UPPER(REGEXP_REPLACE(COALESCE(p_ad_data->>'vin', ''), '\s+', '', 'g')), '');

  IF v_brand_id IS NULL OR v_model_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Brand and model are required'
    );
  END IF;

  IF v_vin IS NOT NULL AND v_vin !~ '^[A-HJ-NPR-Z0-9]{17}$' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'VIN must be a valid 17-character code'
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

  IF v_photo_count > 25 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Maximum of 25 photos allowed'
    );
  END IF;

  SELECT COUNT(*)
  INTO v_invalid_photo_count
  FROM jsonb_array_elements(v_photos) AS photo(value)
  WHERE jsonb_typeof(photo.value) <> 'string'
    OR NULLIF(BTRIM(photo.value #>> '{}'), '') IS NULL
    OR (photo.value #>> '{}') !~ '^https://imagedelivery\.net/';

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

  SELECT dealers.id
  INTO v_dealer_id
  FROM public.dealers
  WHERE dealers.owner_id = v_user_id
  ORDER BY dealers.created_at ASC, dealers.id ASC
  LIMIT 1;

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
  v_auto_publish := public.is_seller_auto_publish_eligible(
    v_user_id,
    p_ad_data->>'description'
  );

  IF v_auto_publish THEN
    v_ad_status := 'active';
    v_published_at := NOW();
    v_expires_at := NOW() + INTERVAL '30 days';
    v_moderation_submitted_at := NULL;
  END IF;

  INSERT INTO ads (
    seller_id,
    dealer_id,
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
    vin,
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
    v_dealer_id,
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
    v_vin,
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
    v_ad_status,
    v_published_at,
    v_expires_at,
    v_moderation_submitted_at,
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
    dealer_id,
    action_type,
    amount,
    description,
    ad_id,
    created_at
  ) VALUES (
    v_user_id,
    v_dealer_id,
    'publish',
    -v_credits_needed,
    CASE
      WHEN v_auto_publish THEN 'Published ad'
      ELSE 'Submitted ad for moderation'
    END,
    v_ad_id,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'ad_id', v_ad_id,
    'new_balance', v_new_credits,
    'status', v_ad_status::TEXT,
    'auto_published', v_auto_publish
  );
END;
$$;

DROP FUNCTION IF EXISTS public.deduct_and_boost_ad(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.deduct_and_boost_ad(UUID, UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.dealer_apply_bulk_action(
  p_action TEXT,
  p_ad_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_action TEXT := LOWER(TRIM(COALESCE(p_action, '')));
  v_requested_count INTEGER := 0;
  v_eligible_count INTEGER := 0;
  v_cost_per_ad INTEGER := 0;
  v_discount_percent INTEGER := 0;
  v_base_cost INTEGER := 0;
  v_discount_amount INTEGER := 0;
  v_total_cost INTEGER := 0;
  v_current_credits INTEGER := 0;
  v_new_credits INTEGER := 0;
  v_updated_count INTEGER := 0;
  v_single_ad_id UUID := NULL;
  v_action_type TEXT := NULL;
  v_description TEXT := NULL;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;

  IF p_ad_ids IS NULL OR COALESCE(array_length(p_ad_ids, 1), 0) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No ads selected'
    );
  END IF;

  IF v_action NOT IN ('prolong', 'top', 'highlight') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unsupported bulk action'
    );
  END IF;

  IF v_action = 'prolong' THEN
    v_cost_per_ad := 1;
  ELSIF v_action = 'top' THEN
    v_cost_per_ad := 3;
  ELSE
    v_cost_per_ad := 2;
  END IF;

  WITH requested AS (
    SELECT DISTINCT UNNEST(p_ad_ids) AS ad_id
  )
  SELECT COUNT(*) INTO v_requested_count
  FROM requested;

  WITH requested AS (
    SELECT DISTINCT UNNEST(p_ad_ids) AS ad_id
  ),
  eligible AS (
    SELECT a.id
    FROM ads a
    JOIN requested r ON r.ad_id = a.id
    WHERE a.seller_id = v_user_id
      AND a.status = 'active'
    FOR UPDATE OF a
  )
  SELECT COUNT(*), MIN(id)
  INTO v_eligible_count, v_single_ad_id
  FROM eligible;

  IF v_eligible_count <> v_requested_count THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'One or more ads are not active or not owned by current seller'
    );
  END IF;

  IF v_eligible_count BETWEEN 5 AND 9 THEN
    v_discount_percent := 10;
  ELSIF v_eligible_count BETWEEN 10 AND 24 THEN
    v_discount_percent := 15;
  ELSIF v_eligible_count BETWEEN 25 AND 49 THEN
    v_discount_percent := 20;
  ELSIF v_eligible_count >= 50 THEN
    v_discount_percent := 25;
  END IF;

  v_base_cost := v_eligible_count * v_cost_per_ad;
  v_discount_amount := ROUND((v_base_cost::NUMERIC * v_discount_percent::NUMERIC) / 100.0)::INTEGER;
  v_total_cost := v_base_cost - v_discount_amount;

  SELECT COALESCE(credit_balance, 0)
  INTO v_current_credits
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_credits < v_total_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'required', v_total_cost,
      'current_balance', v_current_credits
    );
  END IF;

  v_new_credits := v_current_credits - v_total_cost;

  UPDATE profiles
  SET credit_balance = v_new_credits
  WHERE id = v_user_id;

  IF v_action = 'prolong' THEN
    WITH requested AS (
      SELECT DISTINCT UNNEST(p_ad_ids) AS ad_id
    )
    UPDATE ads a
    SET expires_at =
      (
        CASE
          WHEN a.expires_at IS NULL OR a.expires_at < NOW() THEN NOW()
          ELSE a.expires_at
        END
      ) + INTERVAL '30 days'
    FROM requested r
    WHERE a.id = r.ad_id
      AND a.seller_id = v_user_id
      AND a.status = 'active';
  ELSIF v_action = 'top' THEN
    WITH requested AS (
      SELECT DISTINCT UNNEST(p_ad_ids) AS ad_id
    )
    UPDATE ads a
    SET is_top_ad = TRUE,
        top_expires_at =
          (
            CASE
              WHEN a.top_expires_at IS NULL OR a.top_expires_at < NOW() THEN NOW()
              ELSE a.top_expires_at
            END
          ) + INTERVAL '7 days'
    FROM requested r
    WHERE a.id = r.ad_id
      AND a.seller_id = v_user_id
      AND a.status = 'active';
  ELSE
    WITH requested AS (
      SELECT DISTINCT UNNEST(p_ad_ids) AS ad_id
    )
    UPDATE ads a
    SET is_highlighted = TRUE,
        highlight_expires_at =
          (
            CASE
              WHEN a.highlight_expires_at IS NULL OR a.highlight_expires_at < NOW() THEN NOW()
              ELSE a.highlight_expires_at
            END
          ) + INTERVAL '7 days'
    FROM requested r
    WHERE a.id = r.ad_id
      AND a.seller_id = v_user_id
      AND a.status = 'active';
  END IF;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  v_action_type := CASE
    WHEN v_eligible_count = 1 THEN
      CASE v_action
        WHEN 'top' THEN 'top_ad'
        WHEN 'highlight' THEN 'highlight'
        ELSE 'prolong'
      END
    ELSE 'dealer_bulk_' || v_action
  END;

  v_description := CASE
    WHEN v_eligible_count = 1 THEN
      CASE v_action
        WHEN 'top' THEN 'Top ad activation'
        WHEN 'highlight' THEN 'Highlight activation'
        ELSE 'Ad prolongation'
      END
    ELSE FORMAT(
      'Dealer bulk action "%s" on %s ads (base %s, discount %s%%)',
      v_action,
      v_updated_count,
      v_base_cost,
      v_discount_percent
    )
  END;

  INSERT INTO credit_transactions (
    user_id,
    action_type,
    amount,
    description,
    ad_id,
    created_at
  ) VALUES (
    v_user_id,
    v_action_type,
    -v_total_cost,
    v_description,
    CASE WHEN v_eligible_count = 1 THEN v_single_ad_id ELSE NULL END,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'action', v_action,
    'applied_count', v_updated_count,
    'base_cost', v_base_cost,
    'discount_percent', v_discount_percent,
    'discount_amount', v_discount_amount,
    'credits_spent', v_total_cost,
    'new_balance', v_new_credits
  );
END;
$$;

COMMIT;
