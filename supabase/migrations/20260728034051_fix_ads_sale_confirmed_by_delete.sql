-- A sale confirmation records who performed the action, but that audit
-- reference must not prevent the confirming user from deleting their account.
ALTER TABLE public.ads
  DROP CONSTRAINT IF EXISTS ads_sale_confirmed_by_fkey;

ALTER TABLE public.ads
  ADD CONSTRAINT ads_sale_confirmed_by_fkey
  FOREIGN KEY (sale_confirmed_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- Keep the sale timestamp and confirmation method after the confirming
-- account is deleted. Only the optional actor reference is anonymized.
ALTER TABLE public.ads
  DROP CONSTRAINT IF EXISTS ads_sale_confirmation_consistency;

ALTER TABLE public.ads
  ADD CONSTRAINT ads_sale_confirmation_consistency
  CHECK (
    (
      sale_confirmed_at IS NULL
      AND sale_confirmation_method IS NULL
      AND sale_confirmed_by IS NULL
    )
    OR (
      sale_confirmed_at IS NOT NULL
      AND sale_confirmation_method IS NOT NULL
    )
  );
