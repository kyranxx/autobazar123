-- Keep immutable transaction/audit history while allowing users to delete
-- listings and accounts. Historical rows retain their own metadata; only the
-- nullable reference to the deleted entity is cleared.

ALTER TABLE public.credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_ad_id_fkey,
  ADD CONSTRAINT credit_transactions_ad_id_fkey
    FOREIGN KEY (ad_id)
    REFERENCES public.ads(id)
    ON DELETE SET NULL;

ALTER TABLE public.credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey,
  ADD CONSTRAINT credit_transactions_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

ALTER TABLE public.stripe_webhook_logs
  DROP CONSTRAINT IF EXISTS stripe_webhook_logs_user_id_fkey,
  ADD CONSTRAINT stripe_webhook_logs_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

ALTER TABLE public.inquiries
  DROP CONSTRAINT IF EXISTS inquiries_qualified_by_fkey,
  ADD CONSTRAINT inquiries_qualified_by_fkey
    FOREIGN KEY (qualified_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

ALTER TABLE public.ads
  DROP CONSTRAINT IF EXISTS ads_sale_confirmed_by_fkey,
  ADD CONSTRAINT ads_sale_confirmed_by_fkey
    FOREIGN KEY (sale_confirmed_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
