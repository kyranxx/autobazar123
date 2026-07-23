BEGIN;

-- Views run with the caller's RLS context on Postgres 15+.
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Internal privileged helpers live outside the exposed API schema. Public
-- wrappers remain invoker functions so PostgREST does not expose a definer.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_current_user_site_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.site_admins WHERE user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION private.is_current_user_site_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_current_user_site_admin()
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_current_user_site_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$ SELECT private.is_current_user_site_admin(); $$;

REVOKE ALL ON FUNCTION public.is_current_user_site_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_site_admin()
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.increment_ad_views(p_ad_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.ads
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_ad_id
    AND status = 'active'::public.ad_status
    AND COALESCE(is_hidden, false) = false;
$$;

REVOKE ALL ON FUNCTION private.increment_ad_views(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.increment_ad_views(UUID)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.increment_ad_views(ad_id UUID)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$ SELECT private.increment_ad_views(ad_id); $$;

REVOKE ALL ON FUNCTION public.increment_ad_views(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_ad_views(UUID)
  TO anon, authenticated, service_role;

-- These functions are trigger/internal/server-only. None is called by the
-- current browser client, so remove inherited Data API execution privileges.
REVOKE ALL ON FUNCTION public.cleanup_old_logs() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deduct_credit(INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deduct_credits_with_transaction(UUID, INTEGER, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_seller_auto_publish_eligible(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_stripe_transaction_processed(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dealer_apply_bulk_action(TEXT, UUID[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.publish_ad_with_credits(JSONB) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.cleanup_old_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_credit(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_credits_with_transaction(UUID, INTEGER, TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_seller_auto_publish_eligible(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_stripe_transaction_processed(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.dealer_apply_bulk_action(TEXT, UUID[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.publish_ad_with_credits(JSONB) TO service_role;

-- Cache auth.uid() once per statement and scope policies explicitly.
DROP POLICY IF EXISTS "Admins can read email jobs" ON public.email_jobs;
CREATE POLICY "Admins can read email jobs"
ON public.email_jobs FOR SELECT TO authenticated
USING ((SELECT public.is_current_user_site_admin()));

DROP POLICY IF EXISTS "Users can view own billing transactions" ON public.billing_transactions;
CREATE POLICY "Users can view own billing transactions"
ON public.billing_transactions FOR SELECT TO authenticated
USING (
  actor_user_id = (SELECT auth.uid())
  OR dealer_id IN (
    SELECT id FROM public.dealers WHERE owner_id = (SELECT auth.uid())
  )
  OR (SELECT public.is_current_user_site_admin())
);

DROP POLICY IF EXISTS "Users can view own billing checkout sessions" ON public.billing_checkout_sessions;
CREATE POLICY "Users can view own billing checkout sessions"
ON public.billing_checkout_sessions FOR SELECT TO authenticated
USING (
  actor_user_id = (SELECT auth.uid())
  OR dealer_id IN (
    SELECT id FROM public.dealers WHERE owner_id = (SELECT auth.uid())
  )
  OR (SELECT public.is_current_user_site_admin())
);

-- The combined seller/admin policies already cover these actions.
DROP POLICY IF EXISTS "Admins can delete ads" ON public.ads;
DROP POLICY IF EXISTS "Admins can update ads" ON public.ads;

-- Internal sync state is service-only but retains RLS defense in depth.
REVOKE ALL ON public.taxonomy_sync_runs FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "Service role full access to taxonomy sync runs" ON public.taxonomy_sync_runs;
CREATE POLICY "Service role full access to taxonomy sync runs"
ON public.taxonomy_sync_runs FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ads_sale_confirmed_by
  ON public.ads(sale_confirmed_by);
CREATE INDEX IF NOT EXISTS idx_inquiries_qualified_by
  ON public.inquiries(qualified_by);
CREATE INDEX IF NOT EXISTS idx_taxonomy_candidates_reviewed_by
  ON public.taxonomy_candidates(reviewed_by);

-- Repair three existing PL/pgSQL bodies without changing their signatures.
DO $repair$
DECLARE
  fn REGPROCEDURE;
  old_ddl TEXT;
  new_ddl TEXT;
BEGIN
  fn := 'public.deduct_credits_with_transaction(uuid,integer,text,text,uuid)'::regprocedure;
  old_ddl := pg_get_functiondef(fn);
  new_ddl := regexp_replace(
    old_ddl,
    'SET credit_balance = v_new_credits,\s+updated_at = NOW\(\)',
    'SET credit_balance = v_new_credits',
    'i'
  );
  IF new_ddl = old_ddl THEN RAISE EXCEPTION 'Could not repair %', fn; END IF;
  EXECUTE new_ddl;

  fn := 'public.process_stripe_credit_topup(uuid,text,text,text,integer,text)'::regprocedure;
  old_ddl := pg_get_functiondef(fn);
  new_ddl := regexp_replace(
    old_ddl,
    'SET credit_balance = COALESCE\(credit_balance, 0\) \+ p_credits,\s+updated_at = NOW\(\)',
    'SET credit_balance = COALESCE(credit_balance, 0) + p_credits',
    'i'
  );
  IF new_ddl = old_ddl THEN RAISE EXCEPTION 'Could not repair %', fn; END IF;
  EXECUTE new_ddl;

  fn := 'public.dealer_apply_bulk_action(text,uuid[])'::regprocedure;
  old_ddl := pg_get_functiondef(fn);
  new_ddl := replace(old_ddl, 'SELECT COUNT(*), MIN(id)',
    'SELECT COUNT(*), (ARRAY_AGG(id ORDER BY id))[1]');
  IF new_ddl = old_ddl THEN RAISE EXCEPTION 'Could not repair %', fn; END IF;
  EXECUTE new_ddl;

  fn := 'public.publish_ad_with_credits(jsonb)'::regprocedure;
  old_ddl := pg_get_functiondef(fn);
  new_ddl := replace(old_ddl,
    'v_ad_status public.ad_status := ''pending'';',
    'v_ad_status public.ad_status := ''pending''::public.ad_status;');
  IF new_ddl <> old_ddl THEN EXECUTE new_ddl; END IF;
END;
$repair$;

-- CREATE OR REPLACE resets no ACLs, but repeat the intended restrictions after
-- body repairs for clarity and protection against future default grants.
REVOKE ALL ON FUNCTION public.deduct_credits_with_transaction(UUID, INTEGER, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_stripe_credit_topup(UUID, TEXT, TEXT, TEXT, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dealer_apply_bulk_action(TEXT, UUID[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.publish_ad_with_credits(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_stripe_credit_topup(UUID, TEXT, TEXT, TEXT, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.dealer_apply_bulk_action(TEXT, UUID[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.publish_ad_with_credits(JSONB) TO service_role;

COMMIT;
