BEGIN;

DROP POLICY IF EXISTS "Service role full access to idempotency keys" ON public.idempotency_keys;
CREATE POLICY "Service role full access to idempotency keys"
ON public.idempotency_keys
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_dealer_verification_requests_dealer_id
ON public.dealer_verification_requests(dealer_id);

CREATE INDEX IF NOT EXISTS idx_inquiries_recipient_id
ON public.inquiries(recipient_id);

CREATE INDEX IF NOT EXISTS idx_listing_reports_reporter_id
ON public.listing_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_payment_notifications_transaction_id
ON public.payment_notifications(transaction_id);

CREATE INDEX IF NOT EXISTS idx_saved_ad_alert_preferences_ad_id
ON public.saved_ad_alert_preferences(ad_id);

CREATE INDEX IF NOT EXISTS idx_saved_ads_ad_id
ON public.saved_ads(ad_id);

COMMIT;
