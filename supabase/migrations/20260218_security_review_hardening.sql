-- =====================================================
-- Security review hardening fixes
-- - Atomic Stripe credit top-ups (no TOCTOU balance updates)
-- - Explicit site_admins RLS protections
-- =====================================================

CREATE OR REPLACE FUNCTION public.process_stripe_credit_topup(
  p_user_id UUID,
  p_stripe_session_id TEXT,
  p_stripe_payment_id TEXT,
  p_pack_id TEXT,
  p_credits INTEGER,
  p_invoice_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_new_balance INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_stripe_session_id IS NULL OR p_credits IS NULL OR p_credits <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'duplicate', false,
      'error', 'Invalid top-up parameters'
    );
  END IF;

  INSERT INTO public.credit_transactions (
    user_id,
    action_type,
    amount,
    description,
    stripe_payment_id,
    stripe_session_id,
    invoice_url,
    payment_status
  ) VALUES (
    p_user_id,
    'top_up',
    p_credits,
    'Kupa kreditov - ' || COALESCE(p_pack_id, 'unknown'),
    p_stripe_payment_id,
    p_stripe_session_id,
    p_invoice_url,
    'succeeded'
  )
  ON CONFLICT (stripe_session_id) DO NOTHING
  RETURNING id INTO v_transaction_id;

  IF v_transaction_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true
    );
  END IF;

  UPDATE public.profiles
  SET credit_balance = COALESCE(credit_balance, 0) + p_credits,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credit_balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'duplicate', false,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'duplicate', false,
      'error', SQLERRM
    );
END;
$$;

REVOKE ALL ON FUNCTION public.process_stripe_credit_topup(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.process_stripe_credit_topup(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  TEXT
) TO service_role;

DO $$
DECLARE
  policy_name TEXT;
BEGIN
  IF to_regclass('public.site_admins') IS NULL THEN
    RAISE NOTICE 'Table public.site_admins does not exist; skipping site_admins policy hardening.';
    RETURN;
  END IF;

  ALTER TABLE public.site_admins ENABLE ROW LEVEL SECURITY;

  FOR policy_name IN
    SELECT pol.polname
    FROM pg_policy pol
    JOIN pg_class cls ON cls.oid = pol.polrelid
    JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
    WHERE nsp.nspname = 'public'
      AND cls.relname = 'site_admins'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.site_admins', policy_name);
  END LOOP;

  CREATE POLICY "Users can read own admin row"
    ON public.site_admins
    FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Service role full access to site_admins"
    ON public.site_admins
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
END;
$$;
