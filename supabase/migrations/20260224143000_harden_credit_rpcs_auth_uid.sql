-- =====================================================
-- Harden credit RPC authorization
-- - Remove caller-supplied user IDs from credit-sensitive RPCs
-- - Bind all operations to auth.uid() in SQL
-- - Enforce ad ownership for boost actions
-- - Tighten function execute grants
-- =====================================================

DROP FUNCTION IF EXISTS public.deduct_and_boost_ad(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS public.publish_ad_with_credits(UUID, JSONB);

CREATE OR REPLACE FUNCTION public.deduct_and_boost_ad(
  p_ad_id UUID,
  p_credits_needed INTEGER DEFAULT 3
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
  v_top_until TIMESTAMPTZ;
  v_ad_status TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;

  IF p_ad_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ad ID is required'
    );
  END IF;

  IF p_credits_needed IS NULL OR p_credits_needed <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid credits amount'
    );
  END IF;

  SELECT status
  INTO v_ad_status
  FROM ads
  WHERE id = p_ad_id
    AND seller_id = v_user_id
  FOR UPDATE;

  IF v_ad_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ad not found or not owned by user'
    );
  END IF;

  IF v_ad_status <> 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only active ads can be boosted'
    );
  END IF;

  SELECT credit_balance
  INTO v_current_credits
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL OR v_current_credits < p_credits_needed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'current_balance', COALESCE(v_current_credits, 0)
    );
  END IF;

  v_new_credits := v_current_credits - p_credits_needed;
  v_top_until := NOW() + INTERVAL '7 days';

  UPDATE profiles
  SET credit_balance = v_new_credits,
      updated_at = NOW()
  WHERE id = v_user_id;

  UPDATE ads
  SET is_top_ad = true,
      top_expires_at = v_top_until,
      updated_at = NOW()
  WHERE id = p_ad_id
    AND seller_id = v_user_id;

  INSERT INTO credit_transactions (
    user_id,
    action_type,
    amount,
    description,
    created_at
  ) VALUES (
    v_user_id,
    'boost',
    -p_credits_needed,
    'Top ad boost for ad: ' || p_ad_id,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_credits,
    'top_until', v_top_until
  );
END;
$$;

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
    vin,
    is_bought_in_sk,
    is_vat_deductible,
    has_service_book,
    full_service_history,
    originality_check,
    garage_kept,
    not_crashed,
    stk_valid_until,
    photos_json,
    equipment_json,
    status,
    expires_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    (p_ad_data->>'brand_id')::UUID,
    (p_ad_data->>'model_id')::UUID,
    (p_ad_data->>'year')::INTEGER,
    (p_ad_data->>'price_eur')::INTEGER,
    (p_ad_data->>'mileage_km')::INTEGER,
    p_ad_data->>'fuel',
    p_ad_data->>'transmission',
    p_ad_data->>'body_style',
    (p_ad_data->>'power_kw')::INTEGER,
    (p_ad_data->>'engine_volume_cm3')::INTEGER,
    p_ad_data->>'drive_type',
    p_ad_data->>'color',
    p_ad_data->>'location_city',
    p_ad_data->>'location_district',
    p_ad_data->>'description',
    p_ad_data->>'vin',
    (p_ad_data->>'is_bought_in_sk')::BOOLEAN,
    (p_ad_data->>'is_vat_deductible')::BOOLEAN,
    (p_ad_data->>'has_service_book')::BOOLEAN,
    (p_ad_data->>'full_service_history')::BOOLEAN,
    (p_ad_data->>'originality_check')::BOOLEAN,
    (p_ad_data->>'garage_kept')::BOOLEAN,
    (p_ad_data->>'not_crashed')::BOOLEAN,
    (p_ad_data->>'stk_valid_until')::DATE,
    (p_ad_data->'photos_json')::TEXT[],
    (p_ad_data->'equipment_json')::TEXT[],
    'active',
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_ad_id;

  UPDATE profiles
  SET credit_balance = v_new_credits,
      updated_at = NOW()
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
    'Published ad',
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

REVOKE ALL ON FUNCTION public.deduct_and_boost_ad(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deduct_and_boost_ad(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.deduct_and_boost_ad(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_and_boost_ad(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_and_boost_ad(UUID, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.publish_ad_with_credits(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_ad_with_credits(JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.publish_ad_with_credits(JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.publish_ad_with_credits(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_ad_with_credits(JSONB) TO service_role;
