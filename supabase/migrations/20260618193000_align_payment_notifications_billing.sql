BEGIN;

ALTER TABLE public.payment_notifications
  DROP CONSTRAINT IF EXISTS payment_notifications_transaction_id_fkey;

ALTER TABLE public.payment_notifications
  ADD COLUMN IF NOT EXISTS billing_transaction_id UUID;

ALTER TABLE public.payment_notifications
  DROP CONSTRAINT IF EXISTS payment_notifications_billing_transaction_id_fkey;

ALTER TABLE public.payment_notifications
  ADD CONSTRAINT payment_notifications_billing_transaction_id_fkey
  FOREIGN KEY (billing_transaction_id)
  REFERENCES public.billing_transactions(id)
  ON DELETE CASCADE;

ALTER TABLE public.payment_notifications
  ALTER COLUMN transaction_id DROP NOT NULL;

DROP POLICY IF EXISTS "Users can see their payment notifications" ON public.payment_notifications;
CREATE POLICY "Users can see their payment notifications"
ON public.payment_notifications
FOR SELECT
TO authenticated
USING (
  billing_transaction_id IN (
    SELECT id
    FROM public.billing_transactions
    WHERE actor_user_id = (SELECT auth.uid())
       OR dealer_id IN (
         SELECT id FROM public.dealers WHERE owner_id = (SELECT auth.uid())
       )
  )
  OR transaction_id IN (
    SELECT id
    FROM public.credit_transactions
    WHERE user_id = (SELECT auth.uid())
       OR dealer_id IN (
         SELECT id FROM public.dealers WHERE owner_id = (SELECT auth.uid())
       )
  )
  OR EXISTS (
    SELECT 1
    FROM public.site_admins
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE INDEX IF NOT EXISTS idx_payment_notifications_billing_transaction_id
ON public.payment_notifications(billing_transaction_id);

COMMIT;
