-- Account deletion cascades from profiles to ads. Keep the financial ledger
-- entry while removing its reference to the deleted listing.

ALTER TABLE public.credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_ad_id_fkey;

ALTER TABLE public.credit_transactions
  ADD CONSTRAINT credit_transactions_ad_id_fkey
  FOREIGN KEY (ad_id)
  REFERENCES public.ads(id)
  ON DELETE SET NULL;
