-- Unified email delivery history for admin observability.

CREATE TABLE IF NOT EXISTS public.email_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type TEXT NOT NULL,
  template_key TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  error_message TEXT,
  metadata JSONB,
  html_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_created_at
ON public.email_deliveries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_email_type
ON public.email_deliveries(email_type);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_status
ON public.email_deliveries(status);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_recipient
ON public.email_deliveries(recipient_email);

ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read email deliveries" ON public.email_deliveries;
CREATE POLICY "Admins can read email deliveries"
ON public.email_deliveries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role can insert email deliveries" ON public.email_deliveries;
CREATE POLICY "Service role can insert email deliveries"
ON public.email_deliveries
FOR INSERT
TO service_role
WITH CHECK (true);

INSERT INTO public.email_deliveries (
  email_type,
  template_key,
  recipient_email,
  subject,
  status,
  provider,
  metadata,
  created_at
)
SELECT
  CASE notification_type
    WHEN 'confirmation' THEN 'payment-confirmation'
    WHEN 'failure' THEN 'payment-failure'
    WHEN 'invoice' THEN 'invoice'
    ELSE 'payment-other'
  END AS email_type,
  CASE notification_type
    WHEN 'confirmation' THEN 'payment_confirmation'
    WHEN 'failure' THEN 'payment_failure'
    WHEN 'invoice' THEN 'invoice'
    ELSE 'payment_other'
  END AS template_key,
  user_email,
  CASE notification_type
    WHEN 'confirmation' THEN 'Platba potvrdena'
    WHEN 'failure' THEN 'Platba sa nepodarila'
    WHEN 'invoice' THEN 'Vasa faktura'
    ELSE 'Platobna notifikacia'
  END AS subject,
  CASE WHEN email_status = 'sent' THEN 'sent' ELSE 'failed' END AS status,
  'legacy-import' AS provider,
  jsonb_build_object(
    'transaction_id', transaction_id,
    'notification_type', notification_type,
    'legacy', true
  ) AS metadata,
  COALESCE(sent_at, created_at, NOW()) AS created_at
FROM public.payment_notifications
WHERE NOT EXISTS (
  SELECT 1
  FROM public.email_deliveries AS deliveries
  WHERE deliveries.metadata ->> 'transaction_id' = public.payment_notifications.transaction_id::text
    AND deliveries.template_key = CASE notification_type
      WHEN 'confirmation' THEN 'payment_confirmation'
      WHEN 'failure' THEN 'payment_failure'
      WHEN 'invoice' THEN 'invoice'
      ELSE 'payment_other'
    END
);
