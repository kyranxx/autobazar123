BEGIN;

ALTER TABLE public.dealers
  ADD COLUMN IF NOT EXISTS prepaid_balance_cents BIGINT NOT NULL DEFAULT 0;

UPDATE public.dealers
SET prepaid_balance_cents = COALESCE(credit_balance, 0) * 100
WHERE COALESCE(prepaid_balance_cents, 0) = 0
  AND COALESCE(credit_balance, 0) <> 0;

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS promotion_tier TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS promotion_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS promotion_expires_at TIMESTAMPTZ;

ALTER TABLE public.ads
  DROP CONSTRAINT IF EXISTS ads_promotion_tier_check;

ALTER TABLE public.ads
  ADD CONSTRAINT ads_promotion_tier_check
  CHECK (promotion_tier IN ('none', 'premium', 'top'));

UPDATE public.ads
SET
  promotion_tier = CASE
    WHEN is_top_ad THEN 'top'
    WHEN is_highlighted THEN 'premium'
    ELSE 'none'
  END,
  promotion_expires_at = CASE
    WHEN is_top_ad THEN top_expires_at
    WHEN is_highlighted THEN highlight_expires_at
    ELSE NULL
  END,
  promotion_started_at = CASE
    WHEN is_top_ad AND top_expires_at IS NOT NULL THEN top_expires_at - INTERVAL '28 days'
    WHEN is_highlighted AND highlight_expires_at IS NOT NULL THEN highlight_expires_at - INTERVAL '28 days'
    ELSE NULL
  END
WHERE promotion_tier = 'none'
  OR promotion_expires_at IS NULL
  OR promotion_started_at IS NULL;

CREATE TABLE IF NOT EXISTS public.billing_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE SET NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('private', 'dealer', 'system')),
  transaction_kind TEXT NOT NULL CHECK (
    transaction_kind IN (
      'dealer_topup',
      'dealer_debit',
      'private_listing_purchase'
    )
  ),
  operation_type TEXT,
  amount_cents INTEGER NOT NULL,
  bonus_cents INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_id TEXT,
  invoice_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_transactions_stripe_session
ON public.billing_transactions(stripe_session_id)
WHERE stripe_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_billing_transactions_actor_user_id
ON public.billing_transactions(actor_user_id);

CREATE INDEX IF NOT EXISTS idx_billing_transactions_dealer_id
ON public.billing_transactions(dealer_id);

CREATE INDEX IF NOT EXISTS idx_billing_transactions_ad_id
ON public.billing_transactions(ad_id);

ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own billing transactions" ON public.billing_transactions;
CREATE POLICY "Users can view own billing transactions"
ON public.billing_transactions
FOR SELECT
USING (
  actor_user_id = auth.uid()
  OR dealer_id IN (
    SELECT id FROM public.dealers WHERE owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.site_admins
    WHERE user_id = auth.uid()
  )
);

CREATE TABLE IF NOT EXISTS public.billing_checkout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT UNIQUE,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE,
  target_ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('private', 'dealer')),
  checkout_kind TEXT NOT NULL CHECK (
    checkout_kind IN ('dealer_topup', 'private_listing_action')
  ),
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (
    status IN ('created', 'paid', 'failed', 'expired')
  ),
  currency TEXT NOT NULL DEFAULT 'eur',
  resolved_price_cents INTEGER NOT NULL,
  bonus_cents INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  stripe_payment_id TEXT,
  invoice_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_checkout_sessions_actor_user_id
ON public.billing_checkout_sessions(actor_user_id);

CREATE INDEX IF NOT EXISTS idx_billing_checkout_sessions_dealer_id
ON public.billing_checkout_sessions(dealer_id);

CREATE INDEX IF NOT EXISTS idx_billing_checkout_sessions_target_ad_id
ON public.billing_checkout_sessions(target_ad_id);

CREATE INDEX IF NOT EXISTS idx_billing_checkout_sessions_status
ON public.billing_checkout_sessions(status);

ALTER TABLE public.billing_checkout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own billing checkout sessions" ON public.billing_checkout_sessions;
CREATE POLICY "Users can view own billing checkout sessions"
ON public.billing_checkout_sessions
FOR SELECT
USING (
  actor_user_id = auth.uid()
  OR dealer_id IN (
    SELECT id FROM public.dealers WHERE owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.site_admins
    WHERE user_id = auth.uid()
  )
);

INSERT INTO public.site_settings (key, value, updated_at)
VALUES (
  'pricing_config_v1',
  '{
    "phase":"launch",
    "thresholds":{"growthActiveAds":5000},
    "durations":{"listingDays":28,"promotionDays":28},
    "homepageTopLimit":8,
    "resultsTopLimit":4,
    "resultsPremiumLimit":8,
    "phases":{
      "launch":{"basicPriceCents":0,"prolongPriceCents":0,"premiumPriceCents":499,"topPriceCents":999},
      "growth":{"basicPriceCents":199,"prolongPriceCents":199,"premiumPriceCents":699,"topPriceCents":1199},
      "mature":{"basicPriceCents":299,"prolongPriceCents":299,"premiumPriceCents":799,"topPriceCents":1299}
    },
    "dealerTopups":[
      {"id":"dealer_100","label":"100 €","priceCents":10000,"bonusCents":800},
      {"id":"dealer_300","label":"300 €","priceCents":30000,"bonusCents":4500},
      {"id":"dealer_1000","label":"1000 €","priceCents":100000,"bonusCents":20000}
    ],
    "copy":{
      "globalBanner":"Inzerát teraz zdarma. Premium od 4,99 €. TOP 9,99 €.",
      "homepageSeller":"Pridať inzerát zdarma. Premium 4,99 €. TOP 9,99 €.",
      "dealerTopup":"Predplatený inzertný zostatok s bonusom pri dobití."
    }
  }',
  NOW()
)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.apply_private_listing_action(
  p_actor_user_id UUID,
  p_ad_id UUID,
  p_operation TEXT,
  p_transaction_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operation TEXT := LOWER(TRIM(COALESCE(p_operation, '')));
  v_ad RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_listing_days INTEGER := 28;
  v_promotion_days INTEGER := 28;
  v_next_expires_at TIMESTAMPTZ := v_now + make_interval(days => v_listing_days);
  v_next_promotion_expires_at TIMESTAMPTZ := v_now + make_interval(days => v_promotion_days);
  v_next_status public.ad_status;
  v_auto_publish BOOLEAN := FALSE;
  v_next_published_at TIMESTAMPTZ := NULL;
  v_next_moderation_submitted_at TIMESTAMPTZ := NULL;
  v_next_promotion_tier TEXT := 'none';
  v_next_top BOOLEAN := FALSE;
  v_next_highlight BOOLEAN := FALSE;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Actor is required'
    );
  END IF;

  IF v_operation NOT IN (
    'publish_basic',
    'publish_premium',
    'publish_top',
    'prolong_basic',
    'prolong_premium',
    'prolong_top'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unsupported listing action'
    );
  END IF;

  SELECT *
  INTO v_ad
  FROM public.ads
  WHERE id = p_ad_id
    AND seller_id = p_actor_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ad not found'
    );
  END IF;

  IF v_operation LIKE 'publish_%' THEN
    v_auto_publish := public.is_seller_auto_publish_eligible(
      p_actor_user_id,
      v_ad.description
    );
    IF v_auto_publish THEN
      v_next_status := 'active';
      v_next_published_at := v_now;
      v_next_moderation_submitted_at := NULL;
    ELSE
      v_next_status := 'pending';
      v_next_published_at := NULL;
      v_next_moderation_submitted_at := v_now;
    END IF;
  ELSE
    IF v_ad.status = 'sold' OR v_ad.status = 'banned' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'This ad cannot be prolonged'
      );
    END IF;
    v_next_status := 'active';
    v_next_published_at := COALESCE(v_ad.published_at, v_now);
    v_next_moderation_submitted_at := NULL;
  END IF;

  IF v_operation IN ('publish_premium', 'prolong_premium') THEN
    v_next_promotion_tier := 'premium';
    v_next_highlight := TRUE;
  ELSIF v_operation IN ('publish_top', 'prolong_top') THEN
    v_next_promotion_tier := 'top';
    v_next_top := TRUE;
  END IF;

  UPDATE public.ads
  SET
    status = v_next_status,
    published_at = v_next_published_at,
    expires_at = v_next_expires_at,
    promotion_tier = v_next_promotion_tier,
    promotion_started_at = CASE
      WHEN v_next_promotion_tier = 'none' THEN NULL
      ELSE v_now
    END,
    promotion_expires_at = CASE
      WHEN v_next_promotion_tier = 'none' THEN NULL
      ELSE v_next_promotion_expires_at
    END,
    is_top_ad = v_next_top,
    top_expires_at = CASE
      WHEN v_next_top THEN v_next_promotion_expires_at
      ELSE NULL
    END,
    is_highlighted = v_next_highlight,
    highlight_expires_at = CASE
      WHEN v_next_highlight THEN v_next_promotion_expires_at
      ELSE NULL
    END,
    moderation_submitted_at = v_next_moderation_submitted_at,
    moderation_reviewed_at = NULL,
    moderation_reviewed_by = NULL,
    moderation_rejection_note = NULL,
    updated_at = v_now
  WHERE id = p_ad_id;

  IF p_transaction_id IS NOT NULL THEN
    UPDATE public.billing_transactions
    SET ad_id = p_ad_id
    WHERE id = p_transaction_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'ad_id', p_ad_id,
    'status', v_next_status::TEXT,
    'auto_published', v_auto_publish,
    'promotion_tier', v_next_promotion_tier,
    'expires_at', v_next_expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_billing_checkout_session(
  p_checkout_session_id UUID,
  p_stripe_session_id TEXT,
  p_stripe_payment_id TEXT DEFAULT NULL,
  p_invoice_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_checkout public.billing_checkout_sessions%ROWTYPE;
  v_transaction_id UUID;
  v_apply_result JSONB;
BEGIN
  SELECT *
  INTO v_checkout
  FROM public.billing_checkout_sessions
  WHERE id = p_checkout_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Checkout session not found'
    );
  END IF;

  IF v_checkout.status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true,
      'checkout_session_id', v_checkout.id
    );
  END IF;

  IF v_checkout.checkout_kind = 'dealer_topup' THEN
    UPDATE public.dealers
    SET prepaid_balance_cents = COALESCE(prepaid_balance_cents, 0) + v_checkout.resolved_price_cents + v_checkout.bonus_cents
    WHERE id = v_checkout.dealer_id;

    INSERT INTO public.billing_transactions (
      actor_user_id,
      dealer_id,
      actor_type,
      transaction_kind,
      operation_type,
      amount_cents,
      bonus_cents,
      description,
      stripe_session_id,
      stripe_payment_id,
      invoice_url,
      metadata,
      created_at
    ) VALUES (
      v_checkout.actor_user_id,
      v_checkout.dealer_id,
      v_checkout.actor_type,
      'dealer_topup',
      v_checkout.operation_type,
      v_checkout.resolved_price_cents,
      v_checkout.bonus_cents,
      'Dealer prepaid balance top-up',
      p_stripe_session_id,
      p_stripe_payment_id,
      p_invoice_url,
      v_checkout.metadata,
      NOW()
    )
    RETURNING id INTO v_transaction_id;
  ELSE
    INSERT INTO public.billing_transactions (
      actor_user_id,
      dealer_id,
      ad_id,
      actor_type,
      transaction_kind,
      operation_type,
      amount_cents,
      bonus_cents,
      description,
      stripe_session_id,
      stripe_payment_id,
      invoice_url,
      metadata,
      created_at
    ) VALUES (
      v_checkout.actor_user_id,
      v_checkout.dealer_id,
      v_checkout.target_ad_id,
      v_checkout.actor_type,
      'private_listing_purchase',
      v_checkout.operation_type,
      v_checkout.resolved_price_cents,
      0,
      'Private listing purchase',
      p_stripe_session_id,
      p_stripe_payment_id,
      p_invoice_url,
      v_checkout.metadata,
      NOW()
    )
    RETURNING id INTO v_transaction_id;

    SELECT public.apply_private_listing_action(
      v_checkout.actor_user_id,
      v_checkout.target_ad_id,
      v_checkout.operation_type,
      v_transaction_id
    )
    INTO v_apply_result;

    IF COALESCE((v_apply_result->>'success')::BOOLEAN, FALSE) = FALSE THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', COALESCE(v_apply_result->>'error', 'Could not apply listing purchase')
      );
    END IF;
  END IF;

  UPDATE public.billing_checkout_sessions
  SET
    status = 'paid',
    stripe_session_id = COALESCE(p_stripe_session_id, stripe_session_id),
    stripe_payment_id = COALESCE(p_stripe_payment_id, stripe_payment_id),
    invoice_url = COALESCE(p_invoice_url, invoice_url),
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = v_checkout.id;

  RETURN jsonb_build_object(
    'success', true,
    'duplicate', false,
    'checkout_session_id', v_checkout.id,
    'transaction_id', v_transaction_id,
    'kind', v_checkout.checkout_kind,
    'apply_result', v_apply_result
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_dealer_balance_action(
  p_actor_user_id UUID,
  p_operation TEXT,
  p_ad_ids UUID[],
  p_price_cents INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operation TEXT := LOWER(TRIM(COALESCE(p_operation, '')));
  v_dealer_id UUID;
  v_current_balance BIGINT := 0;
  v_selected_ids UUID[];
  v_total_count INTEGER := 0;
  v_total_cost INTEGER := 0;
  v_transaction_id UUID;
  v_ad_id UUID;
  v_apply_result JSONB;
  v_failed_count INTEGER := 0;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Actor is required'
    );
  END IF;

  IF v_operation NOT IN ('prolong_basic', 'prolong_premium', 'prolong_top') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unsupported dealer action'
    );
  END IF;

  IF p_price_cents IS NULL OR p_price_cents < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid price'
    );
  END IF;

  IF p_ad_ids IS NULL OR COALESCE(array_length(p_ad_ids, 1), 0) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No ads selected'
    );
  END IF;

  SELECT id, prepaid_balance_cents
  INTO v_dealer_id, v_current_balance
  FROM public.dealers
  WHERE owner_id = p_actor_user_id
  ORDER BY created_at ASC, id ASC
  LIMIT 1
  FOR UPDATE;

  IF v_dealer_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Dealer account not found'
    );
  END IF;

  SELECT ARRAY_AGG(a.id ORDER BY a.id), COUNT(*)
  INTO v_selected_ids, v_total_count
  FROM public.ads AS a
  WHERE a.id = ANY(p_ad_ids)
    AND a.seller_id = p_actor_user_id
    AND a.dealer_id = v_dealer_id
    AND a.status = 'active';

  IF v_total_count <> COALESCE(array_length(p_ad_ids, 1), 0) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'One or more ads are not eligible for this action'
    );
  END IF;

  v_total_cost := v_total_count * p_price_cents;

  IF v_current_balance < v_total_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient prepaid balance',
      'required_cents', v_total_cost,
      'current_balance_cents', v_current_balance
    );
  END IF;

  UPDATE public.dealers
  SET prepaid_balance_cents = v_current_balance - v_total_cost
  WHERE id = v_dealer_id;

  INSERT INTO public.billing_transactions (
    actor_user_id,
    dealer_id,
    actor_type,
    transaction_kind,
    operation_type,
    amount_cents,
    description,
    metadata,
    created_at
  ) VALUES (
    p_actor_user_id,
    v_dealer_id,
    'dealer',
    'dealer_debit',
    v_operation,
    -v_total_cost,
    FORMAT('Dealer action %s on %s ads', v_operation, v_total_count),
    jsonb_build_object('ad_ids', v_selected_ids),
    NOW()
  )
  RETURNING id INTO v_transaction_id;

  FOREACH v_ad_id IN ARRAY v_selected_ids LOOP
    SELECT public.apply_private_listing_action(
      p_actor_user_id,
      v_ad_id,
      v_operation,
      v_transaction_id
    )
    INTO v_apply_result;

    IF COALESCE((v_apply_result->>'success')::BOOLEAN, FALSE) = FALSE THEN
      v_failed_count := v_failed_count + 1;
    END IF;
  END LOOP;

  IF v_failed_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'One or more dealer actions failed',
      'failed_count', v_failed_count
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'applied_count', v_total_count,
    'amount_cents', v_total_cost,
    'new_balance_cents', v_current_balance - v_total_cost,
    'transaction_id', v_transaction_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_private_listing_action(UUID, UUID, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_private_listing_action(UUID, UUID, TEXT, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.apply_private_listing_action(UUID, UUID, TEXT, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_private_listing_action(UUID, UUID, TEXT, UUID) TO service_role;

REVOKE ALL ON FUNCTION public.apply_billing_checkout_session(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_billing_checkout_session(UUID, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.apply_billing_checkout_session(UUID, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_billing_checkout_session(UUID, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.apply_dealer_balance_action(UUID, TEXT, UUID[], INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_dealer_balance_action(UUID, TEXT, UUID[], INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.apply_dealer_balance_action(UUID, TEXT, UUID[], INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_dealer_balance_action(UUID, TEXT, UUID[], INTEGER) TO service_role;

COMMIT;
