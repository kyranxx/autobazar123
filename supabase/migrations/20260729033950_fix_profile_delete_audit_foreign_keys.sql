-- Keep historical financial, webhook, and qualification records while allowing
-- the referenced account/profile to be deleted.

ALTER TABLE public.credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;

ALTER TABLE public.credit_transactions
  ADD CONSTRAINT credit_transactions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

ALTER TABLE public.stripe_webhook_logs
  DROP CONSTRAINT IF EXISTS stripe_webhook_logs_user_id_fkey;

ALTER TABLE public.stripe_webhook_logs
  ADD CONSTRAINT stripe_webhook_logs_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

ALTER TABLE public.inquiries
  DROP CONSTRAINT IF EXISTS inquiries_qualified_by_fkey;

ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_qualified_by_fkey
  FOREIGN KEY (qualified_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

ALTER TABLE public.inquiries
  DROP CONSTRAINT IF EXISTS inquiries_qualification_consistency;

ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_qualification_consistency
  CHECK (
    (
      is_qualified = false
      AND qualified_at IS NULL
      AND qualified_by IS NULL
    )
    OR
    (
      is_qualified = true
      AND qualified_at IS NOT NULL
    )
  );
