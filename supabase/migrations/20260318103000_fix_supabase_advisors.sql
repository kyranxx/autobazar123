BEGIN;

CREATE OR REPLACE FUNCTION public.is_current_user_site_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.site_admins
    WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_site_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_site_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_site_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_site_admin() TO service_role;

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

ALTER FUNCTION public.set_saved_ad_alert_preferences_updated_at() SET search_path = public;
ALTER FUNCTION public.deduct_credit(INTEGER) SET search_path = public;
ALTER FUNCTION public.sync_saved_alert_preferences_on_saved_ads_insert() SET search_path = public;
ALTER FUNCTION public.cleanup_saved_alert_preferences_on_saved_ads_delete() SET search_path = public;
ALTER FUNCTION public.increment_ad_views(UUID) SET search_path = public;
ALTER FUNCTION public.set_table_updated_at() SET search_path = public;
ALTER FUNCTION public.is_stripe_transaction_processed(TEXT) SET search_path = public;
ALTER FUNCTION public.deduct_credits_with_transaction(UUID, INTEGER, TEXT, TEXT, UUID) SET search_path = public;
ALTER FUNCTION public.update_feature_flags_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.enforce_inquiry_rate_limit() SET search_path = public;
ALTER FUNCTION public.cleanup_old_logs() SET search_path = public;
ALTER FUNCTION public.process_stripe_credit_topup(UUID, TEXT, TEXT, TEXT, INTEGER, TEXT) SET search_path = public;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can read own admin row" ON public.site_admins;
CREATE POLICY "Users can read own admin row"
ON public.site_admins
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Public can view active ads" ON public.ads;
DROP POLICY IF EXISTS "Admins can read all ads" ON public.ads;
CREATE POLICY "Public can view active ads"
ON public.ads
FOR SELECT
TO anon, authenticated
USING (
  (status = 'active' AND COALESCE(is_hidden, false) = false)
  OR seller_id = (SELECT auth.uid())
  OR (SELECT public.is_current_user_site_admin())
);

DROP POLICY IF EXISTS "Sellers can manage own ads" ON public.ads;
DROP POLICY IF EXISTS "Admins can update all ads" ON public.ads;
CREATE POLICY "Users can insert own ads"
ON public.ads
FOR INSERT
TO authenticated
WITH CHECK (seller_id = (SELECT auth.uid()));

CREATE POLICY "Sellers and admins can update ads"
ON public.ads
FOR UPDATE
TO authenticated
USING (
  seller_id = (SELECT auth.uid())
  OR (SELECT public.is_current_user_site_admin())
)
WITH CHECK (
  seller_id = (SELECT auth.uid())
  OR (SELECT public.is_current_user_site_admin())
);

CREATE POLICY "Sellers can delete own ads"
ON public.ads
FOR DELETE
TO authenticated
USING (seller_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own transactions"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR dealer_id IN (
    SELECT id
    FROM public.dealers
    WHERE owner_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Dealers can update own info" ON public.dealers;
CREATE POLICY "Dealers can update own info"
ON public.dealers
FOR UPDATE
TO authenticated
USING (owner_id = (SELECT auth.uid()))
WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own saved ads" ON public.saved_ads;
DROP POLICY IF EXISTS "Users can save ads" ON public.saved_ads;
DROP POLICY IF EXISTS "Users can unsave ads" ON public.saved_ads;
DROP POLICY IF EXISTS "Users can manage own saved ads" ON public.saved_ads;

CREATE POLICY "Users can view own saved ads"
ON public.saved_ads
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can save ads"
ON public.saved_ads
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can unsave ads"
ON public.saved_ads
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own saved alert preferences" ON public.saved_ad_alert_preferences;
DROP POLICY IF EXISTS "Users can create own saved alert preferences" ON public.saved_ad_alert_preferences;
DROP POLICY IF EXISTS "Users can update own saved alert preferences" ON public.saved_ad_alert_preferences;
DROP POLICY IF EXISTS "Users can delete own saved alert preferences" ON public.saved_ad_alert_preferences;

CREATE POLICY "Users can view own saved alert preferences"
ON public.saved_ad_alert_preferences
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own saved alert preferences"
ON public.saved_ad_alert_preferences
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own saved alert preferences"
ON public.saved_ad_alert_preferences
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own saved alert preferences"
ON public.saved_ad_alert_preferences
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can see their payment notifications" ON public.payment_notifications;
CREATE POLICY "Users can see their payment notifications"
ON public.payment_notifications
FOR SELECT
TO authenticated
USING (
  transaction_id IN (
    SELECT id
    FROM public.credit_transactions
    WHERE user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.stripe_webhook_logs;
CREATE POLICY "Admins can view webhook logs"
ON public.stripe_webhook_logs
FOR SELECT
TO authenticated
USING ((SELECT public.is_current_user_site_admin()));

DROP POLICY IF EXISTS "Admins can read system logs" ON public.system_logs;
CREATE POLICY "Admins can read system logs"
ON public.system_logs
FOR SELECT
TO authenticated
USING ((SELECT public.is_current_user_site_admin()));

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can read audit logs"
ON public.admin_audit_logs
FOR SELECT
TO authenticated
USING ((SELECT public.is_current_user_site_admin()));

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_current_user_site_admin()));

DROP POLICY IF EXISTS "Users can read own saved searches" ON public.saved_searches;
CREATE POLICY "Users can read own saved searches"
ON public.saved_searches
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own saved searches" ON public.saved_searches;
CREATE POLICY "Users can insert own saved searches"
ON public.saved_searches
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own saved searches" ON public.saved_searches;
CREATE POLICY "Users can update own saved searches"
ON public.saved_searches
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own saved searches" ON public.saved_searches;
CREATE POLICY "Users can delete own saved searches"
ON public.saved_searches
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Reporters can read own listing reports" ON public.listing_reports;
DROP POLICY IF EXISTS "Users can read own listing reports" ON public.listing_reports;
DROP POLICY IF EXISTS "Admins can read listing reports" ON public.listing_reports;
CREATE POLICY "Users can read accessible listing reports"
ON public.listing_reports
FOR SELECT
TO authenticated
USING (
  reporter_id = (SELECT auth.uid())
  OR (SELECT public.is_current_user_site_admin())
);

DROP POLICY IF EXISTS "Users can insert own listing reports" ON public.listing_reports;
CREATE POLICY "Users can insert own listing reports"
ON public.listing_reports
FOR INSERT
TO authenticated
WITH CHECK (reporter_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can update listing reports" ON public.listing_reports;
CREATE POLICY "Admins can update listing reports"
ON public.listing_reports
FOR UPDATE
TO authenticated
USING ((SELECT public.is_current_user_site_admin()))
WITH CHECK ((SELECT public.is_current_user_site_admin()));

DROP POLICY IF EXISTS "Dealers can read own verification requests" ON public.dealer_verification_requests;
DROP POLICY IF EXISTS "Admins can read dealer verification requests" ON public.dealer_verification_requests;
CREATE POLICY "Users can read accessible dealer verification requests"
ON public.dealer_verification_requests
FOR SELECT
TO authenticated
USING (
  requester_user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.dealers
    WHERE dealers.id = dealer_id
      AND dealers.owner_id = (SELECT auth.uid())
  )
  OR (SELECT public.is_current_user_site_admin())
);

DROP POLICY IF EXISTS "Dealers can create own verification requests" ON public.dealer_verification_requests;
CREATE POLICY "Dealers can create own verification requests"
ON public.dealer_verification_requests
FOR INSERT
TO authenticated
WITH CHECK (
  requester_user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.dealers
    WHERE dealers.id = dealer_id
      AND dealers.owner_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Admins can update dealer verification requests" ON public.dealer_verification_requests;
CREATE POLICY "Admins can update dealer verification requests"
ON public.dealer_verification_requests
FOR UPDATE
TO authenticated
USING ((SELECT public.is_current_user_site_admin()))
WITH CHECK ((SELECT public.is_current_user_site_admin()));

DROP POLICY IF EXISTS "Public can read maintenance mode setting" ON public.site_settings;
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can modify site settings" ON public.site_settings;

CREATE POLICY "Users can read allowed site settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (
  key = 'maintenance_mode'
  OR (SELECT public.is_current_user_site_admin())
);

CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_current_user_site_admin()));

CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING ((SELECT public.is_current_user_site_admin()))
WITH CHECK ((SELECT public.is_current_user_site_admin()));

CREATE POLICY "Admins can delete site settings"
ON public.site_settings
FOR DELETE
TO authenticated
USING ((SELECT public.is_current_user_site_admin()));

DROP POLICY IF EXISTS "Participants see own inquiries" ON public.inquiries;
CREATE POLICY "Participants see own inquiries"
ON public.inquiries
FOR SELECT
TO authenticated
USING (
  sender_id = (SELECT auth.uid())
  OR recipient_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Users can send inquiries" ON public.inquiries;
CREATE POLICY "Users can send inquiries"
ON public.inquiries
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = (SELECT auth.uid())
  AND sender_id <> recipient_id
);

DROP POLICY IF EXISTS "Recipients can update inquiry status" ON public.inquiries;
CREATE POLICY "Recipients can update inquiry status"
ON public.inquiries
FOR UPDATE
TO authenticated
USING (recipient_id = (SELECT auth.uid()))
WITH CHECK (recipient_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Participants can delete inquiries" ON public.inquiries;
CREATE POLICY "Participants can delete inquiries"
ON public.inquiries
FOR DELETE
TO authenticated
USING (
  sender_id = (SELECT auth.uid())
  OR recipient_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins can read email deliveries" ON public.email_deliveries;
CREATE POLICY "Admins can read email deliveries"
ON public.email_deliveries
FOR SELECT
TO authenticated
USING ((SELECT public.is_current_user_site_admin()));

DROP POLICY IF EXISTS "Admins can read contact messages" ON public.contact_messages;
CREATE POLICY "Admins can read contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING ((SELECT public.is_current_user_site_admin()));

DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
CREATE POLICY "Admins can update contact messages"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING ((SELECT public.is_current_user_site_admin()))
WITH CHECK ((SELECT public.is_current_user_site_admin()));

CREATE INDEX IF NOT EXISTS idx_ads_dealer_id
ON public.ads(dealer_id);

CREATE INDEX IF NOT EXISTS idx_ads_model_id
ON public.ads(model_id);

CREATE INDEX IF NOT EXISTS idx_ads_moderation_reviewed_by
ON public.ads(moderation_reviewed_by);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_ad_id
ON public.credit_transactions(ad_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_dealer_id
ON public.credit_transactions(dealer_id);

CREATE INDEX IF NOT EXISTS idx_dealer_verification_requests_requester_user_id
ON public.dealer_verification_requests(requester_user_id);

CREATE INDEX IF NOT EXISTS idx_dealer_verification_requests_reviewed_by
ON public.dealer_verification_requests(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_dealers_owner_id
ON public.dealers(owner_id);

CREATE INDEX IF NOT EXISTS idx_listing_reports_resolved_by
ON public.listing_reports(resolved_by);

CREATE INDEX IF NOT EXISTS idx_listing_reports_reviewed_by
ON public.listing_reports(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_listing_reports_seller_id
ON public.listing_reports(seller_id);

CREATE INDEX IF NOT EXISTS idx_models_brand_id
ON public.models(brand_id);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_user_id
ON public.stripe_webhook_logs(user_id);

DROP INDEX IF EXISTS public.idx_idempotency_expires;
DROP INDEX IF EXISTS public.idx_saved_ads_ad_id;
DROP INDEX IF EXISTS public.idx_admin_audit_logs_action;
DROP INDEX IF EXISTS public.idx_admin_audit_logs_target_type;
DROP INDEX IF EXISTS public.idx_admin_audit_logs_target_id;
DROP INDEX IF EXISTS public.idx_inquiries_recipient_id;
DROP INDEX IF EXISTS public.idx_email_deliveries_email_type;
DROP INDEX IF EXISTS public.idx_email_deliveries_status;
DROP INDEX IF EXISTS public.idx_email_deliveries_recipient;
DROP INDEX IF EXISTS public.idx_saved_ad_alert_preferences_ad_id;
DROP INDEX IF EXISTS public.idx_feature_flags_enabled;
DROP INDEX IF EXISTS public.idx_listing_reports_ad_id;
DROP INDEX IF EXISTS public.idx_contact_messages_created_at;
DROP INDEX IF EXISTS public.idx_contact_messages_status;
DROP INDEX IF EXISTS public.idx_contact_messages_email;
DROP INDEX IF EXISTS public.idx_listing_reports_reporter_id;
DROP INDEX IF EXISTS public.idx_saved_searches_user_id;
DROP INDEX IF EXISTS public.idx_listing_reports_ad_status;
DROP INDEX IF EXISTS public.idx_listing_reports_status_created_at;
DROP INDEX IF EXISTS public.idx_dealer_verification_requests_status_created_at;
DROP INDEX IF EXISTS public.idx_dealer_verification_requests_dealer_id;
DROP INDEX IF EXISTS public.idx_credit_transactions_stripe_payment;
DROP INDEX IF EXISTS public.idx_stripe_webhook_logs_event_id;
DROP INDEX IF EXISTS public.idx_system_logs_level;
DROP INDEX IF EXISTS public.idx_stripe_webhook_logs_session_id;
DROP INDEX IF EXISTS public.idx_credit_transactions_payment_status;
DROP INDEX IF EXISTS public.idx_credit_transactions_stripe_session;
DROP INDEX IF EXISTS public.idx_payment_notifications_transaction_id;
DROP INDEX IF EXISTS public.idx_payment_notifications_email_status;
DROP INDEX IF EXISTS public.idx_payment_notifications_user_email;

COMMIT;
