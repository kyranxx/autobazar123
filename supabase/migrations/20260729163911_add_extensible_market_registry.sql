CREATE TABLE IF NOT EXISTS public.markets (
  code TEXT PRIMARY KEY,
  canonical_domain TEXT NOT NULL UNIQUE,
  locale TEXT NOT NULL,
  currency TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT markets_code_format_check
    CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{1,7}$'),
  CONSTRAINT markets_canonical_domain_not_blank_check
    CHECK (btrim(canonical_domain) <> ''),
  CONSTRAINT markets_locale_not_blank_check
    CHECK (btrim(locale) <> ''),
  CONSTRAINT markets_currency_format_check
    CHECK (currency ~ '^[A-Z]{3}$')
);

ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.markets FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.markets TO service_role;

INSERT INTO public.markets (code, canonical_domain, locale, currency)
VALUES
  ('SK', 'www.autoninja.sk', 'sk', 'EUR'),
  ('RO', 'www.autoninja.ro', 'ro', 'EUR')
ON CONFLICT (code) DO UPDATE
SET
  canonical_domain = EXCLUDED.canonical_domain,
  locale = EXCLUDED.locale,
  currency = EXCLUDED.currency,
  is_active = true;

ALTER TABLE public.ads
  DROP CONSTRAINT IF EXISTS ads_market_code_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ads_market_code_fkey'
      AND conrelid = 'public.ads'::regclass
  ) THEN
    ALTER TABLE public.ads
      ADD CONSTRAINT ads_market_code_fkey
      FOREIGN KEY (market_code)
      REFERENCES public.markets(code)
      ON UPDATE CASCADE
      ON DELETE RESTRICT
      NOT VALID;
  END IF;
END
$$;

ALTER TABLE public.ads
  VALIDATE CONSTRAINT ads_market_code_fkey;

COMMENT ON TABLE public.markets IS
  'Server-managed registry of deployable marketplace TLD markets.';
COMMENT ON COLUMN public.ads.market_code IS
  'Inventory partition key referencing public.markets(code).';
