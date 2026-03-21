ALTER TABLE public.ads
ADD COLUMN IF NOT EXISTS sale_confirmed_at TIMESTAMPTZ;

ALTER TABLE public.ads
ADD COLUMN IF NOT EXISTS sale_confirmation_method TEXT;

ALTER TABLE public.ads
ADD COLUMN IF NOT EXISTS sale_confirmed_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.ads
DROP CONSTRAINT IF EXISTS ads_sale_confirmation_consistency;

ALTER TABLE public.ads
ADD CONSTRAINT ads_sale_confirmation_consistency CHECK (
  (
    sale_confirmed_at IS NULL
    AND sale_confirmation_method IS NULL
    AND sale_confirmed_by IS NULL
  ) OR (
    sale_confirmed_at IS NOT NULL
    AND sale_confirmation_method IS NOT NULL
    AND sale_confirmed_by IS NOT NULL
  )
);

ALTER TABLE public.ads
DROP CONSTRAINT IF EXISTS ads_sale_confirmation_method_known;

ALTER TABLE public.ads
ADD CONSTRAINT ads_sale_confirmation_method_known CHECK (
  sale_confirmation_method IS NULL
  OR sale_confirmation_method IN ('seller_dashboard_manual')
);

CREATE INDEX IF NOT EXISTS idx_ads_sale_confirmed_at
ON public.ads(sale_confirmed_at DESC)
WHERE sale_confirmed_at IS NOT NULL;
