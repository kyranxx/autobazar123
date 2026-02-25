-- Migration: Add atomic dealer bulk action RPC
-- Supports: prolong, top, highlight, bump
-- Enforces: auth ownership, active ads only, credit checks, transactional updates

DROP FUNCTION IF EXISTS public.dealer_apply_bulk_action(TEXT, UUID[]);

CREATE OR REPLACE FUNCTION public.dealer_apply_bulk_action(
  p_action TEXT,
  p_ad_ids UUID[]
) RETURNS JSONB
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

  IF v_action NOT IN ('prolong', 'top', 'highlight', 'bump') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unsupported bulk action'
    );
  END IF;

  IF v_action = 'prolong' THEN
    v_cost_per_ad := 1;
  ELSIF v_action = 'top' THEN
    v_cost_per_ad := 3;
  ELSIF v_action = 'highlight' THEN
    v_cost_per_ad := 2;
  ELSE
    v_cost_per_ad := 1;
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
  SELECT COUNT(*) INTO v_eligible_count
  FROM eligible;

  IF v_eligible_count <> v_requested_count THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'One or more ads are not active or not owned by current dealer'
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
  ELSIF v_action = 'highlight' THEN
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
  ELSE
    WITH requested AS (
      SELECT DISTINCT UNNEST(p_ad_ids) AS ad_id
    )
    UPDATE ads a
    SET created_at = NOW()
    FROM requested r
    WHERE a.id = r.ad_id
      AND a.seller_id = v_user_id
      AND a.status = 'active';
  END IF;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  INSERT INTO credit_transactions (
    user_id,
    action_type,
    amount,
    description,
    created_at
  ) VALUES (
    v_user_id,
    'dealer_bulk_' || v_action,
    -v_total_cost,
    FORMAT(
      'Dealer bulk action "%s" on %s ads (base %s, discount %s%%)',
      v_action,
      v_updated_count,
      v_base_cost,
      v_discount_percent
    ),
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

REVOKE ALL ON FUNCTION public.dealer_apply_bulk_action(TEXT, UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dealer_apply_bulk_action(TEXT, UUID[]) FROM anon;
REVOKE ALL ON FUNCTION public.dealer_apply_bulk_action(TEXT, UUID[]) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.dealer_apply_bulk_action(TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dealer_apply_bulk_action(TEXT, UUID[]) TO service_role;
