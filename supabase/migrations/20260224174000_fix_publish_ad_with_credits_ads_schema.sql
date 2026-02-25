-- Migration: Align publish_ad_with_credits with current ads schema
-- Date: 2026-02-24
-- Context:
-- - ads table requires brand/model text columns and uses warranty_expiration JSON media fields
-- - legacy function body still referenced removed columns (vin, stk_valid_until)

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
    COALESCE(p_ad_data->'photos_json', '[]'::JSONB),
    COALESCE(p_ad_data->'equipment_json', '[]'::JSONB),
    'active',
    NOW(),
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
