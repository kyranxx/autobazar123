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
      RAISE EXCEPTION 'Could not apply listing purchase: %',
        COALESCE(v_apply_result->>'error', 'Could not apply listing purchase');
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

REVOKE ALL ON FUNCTION public.apply_billing_checkout_session(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_billing_checkout_session(UUID, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.apply_billing_checkout_session(UUID, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_billing_checkout_session(UUID, TEXT, TEXT, TEXT) TO service_role;
