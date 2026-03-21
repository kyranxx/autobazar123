ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_external_id TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_seo_indexable BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS seo_slug TEXT;

UPDATE public.brands
SET source = 'seed'
WHERE source IS NULL;

ALTER TABLE public.brands
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN source SET DEFAULT 'manual';

ALTER TABLE public.models
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_external_id TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_seo_indexable BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_city_seo_indexable BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS seo_slug TEXT;

UPDATE public.models
SET source = 'seed'
WHERE source IS NULL;

UPDATE public.models
SET is_popular = TRUE
WHERE is_popular = FALSE
  AND source = 'seed';

ALTER TABLE public.models
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN source SET DEFAULT 'manual';

UPDATE public.brands
SET
  is_seo_indexable = TRUE,
  seo_slug = CASE
    WHEN slug = 'mercedes-benz' THEN 'mercedes'
    ELSE slug
  END
WHERE slug IN (
  'skoda',
  'volkswagen',
  'audi',
  'bmw',
  'mercedes-benz',
  'ford',
  'toyota',
  'hyundai',
  'kia'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_seo_slug
  ON public.brands(seo_slug)
  WHERE seo_slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_source_external_id
  ON public.brands(source, source_external_id)
  WHERE source_external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_brands_is_active_name
  ON public.brands(is_active, name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_models_source_external_id
  ON public.models(source, source_external_id)
  WHERE source_external_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_models_brand_slug
  ON public.models(brand_id, slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_models_brand_seo_slug
  ON public.models(brand_id, seo_slug)
  WHERE seo_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_models_brand_active_name
  ON public.models(brand_id, is_active, name);

CREATE INDEX IF NOT EXISTS idx_models_seo_indexable
  ON public.models(is_seo_indexable, is_city_seo_indexable, brand_id);

INSERT INTO public.models (
  brand_id,
  name,
  slug,
  seo_slug,
  source,
  is_popular,
  is_active,
  is_seo_indexable,
  is_city_seo_indexable
)
SELECT
  b.id,
  v.name,
  v.slug,
  v.seo_slug,
  'seed',
  TRUE,
  TRUE,
  TRUE,
  v.is_city
FROM public.brands b
JOIN (
  VALUES
    ('skoda', 'Octavia', 'octavia', 'octavia', TRUE),
    ('skoda', 'Fabia', 'fabia', 'fabia', TRUE),
    ('skoda', 'Superb', 'superb', 'superb', TRUE),
    ('skoda', 'Kodiaq', 'kodiaq', 'kodiaq', FALSE),
    ('skoda', 'Karoq', 'karoq', 'karoq', FALSE),
    ('skoda', 'Scala', 'scala', 'scala', FALSE),
    ('skoda', 'Kamiq', 'kamiq', 'kamiq', FALSE),
    ('skoda', 'Enyaq', 'enyaq', 'enyaq', FALSE),
    ('volkswagen', 'Golf', 'golf', 'golf', TRUE),
    ('volkswagen', 'Passat', 'passat', 'passat', TRUE),
    ('volkswagen', 'Tiguan', 'tiguan', 'tiguan', TRUE),
    ('volkswagen', 'Polo', 'polo', 'polo', FALSE),
    ('volkswagen', 'Arteon', 'arteon', 'arteon', FALSE),
    ('volkswagen', 'Touareg', 'touareg', 'touareg', FALSE),
    ('volkswagen', 'T-Roc', 't-roc', 't-roc', FALSE),
    ('volkswagen', 'ID.4', 'id4', 'id4', FALSE),
    ('audi', 'A3', 'a3', 'a3', FALSE),
    ('audi', 'A4', 'a4', 'a4', TRUE),
    ('audi', 'A6', 'a6', 'a6', TRUE),
    ('audi', 'Q3', 'q3', 'q3', FALSE),
    ('audi', 'Q5', 'q5', 'q5', TRUE),
    ('audi', 'Q7', 'q7', 'q7', FALSE),
    ('audi', 'Q8', 'q8', 'q8', FALSE),
    ('audi', 'e-tron', 'e-tron', 'e-tron', FALSE),
    ('bmw', '3 Series', '3-series', '3-series', TRUE),
    ('bmw', '5 Series', '5-series', '5-series', TRUE),
    ('bmw', 'X1', 'x1', 'x1', FALSE),
    ('bmw', 'X3', 'x3', 'x3', FALSE),
    ('bmw', 'X5', 'x5', 'x5', TRUE),
    ('bmw', 'X6', 'x6', 'x6', FALSE),
    ('bmw', 'i4', 'i4', 'i4', FALSE),
    ('bmw', 'iX', 'ix', 'ix', FALSE),
    ('mercedes-benz', 'C-Class', 'c-class', 'c-class', TRUE),
    ('mercedes-benz', 'E-Class', 'e-class', 'e-class', TRUE),
    ('mercedes-benz', 'S-Class', 's-class', 's-class', FALSE),
    ('mercedes-benz', 'GLC', 'glc', 'glc', TRUE),
    ('mercedes-benz', 'GLE', 'gle', 'gle', FALSE),
    ('mercedes-benz', 'GLA', 'gla', 'gla', FALSE),
    ('mercedes-benz', 'EQC', 'eqc', 'eqc', FALSE),
    ('mercedes-benz', 'EQS', 'eqs', 'eqs', FALSE),
    ('ford', 'Focus', 'focus', 'focus', FALSE),
    ('ford', 'Fiesta', 'fiesta', 'fiesta', FALSE),
    ('ford', 'Mondeo', 'mondeo', 'mondeo', FALSE),
    ('ford', 'Kuga', 'kuga', 'kuga', FALSE),
    ('ford', 'Puma', 'puma', 'puma', FALSE),
    ('ford', 'Mustang', 'mustang', 'mustang', FALSE),
    ('toyota', 'Corolla', 'corolla', 'corolla', FALSE),
    ('toyota', 'Yaris', 'yaris', 'yaris', FALSE),
    ('toyota', 'Camry', 'camry', 'camry', FALSE),
    ('toyota', 'RAV4', 'rav4', 'rav4', FALSE),
    ('toyota', 'C-HR', 'c-hr', 'c-hr', FALSE),
    ('toyota', 'Land Cruiser', 'land-cruiser', 'land-cruiser', FALSE),
    ('hyundai', 'i20', 'i20', 'i20', FALSE),
    ('hyundai', 'i30', 'i30', 'i30', FALSE),
    ('hyundai', 'Tucson', 'tucson', 'tucson', FALSE),
    ('hyundai', 'Kona', 'kona', 'kona', FALSE),
    ('hyundai', 'Ioniq', 'ioniq', 'ioniq', FALSE),
    ('hyundai', 'Santa Fe', 'santa-fe', 'santa-fe', FALSE),
    ('kia', 'Ceed', 'ceed', 'ceed', FALSE),
    ('kia', 'Sportage', 'sportage', 'sportage', FALSE),
    ('kia', 'Sorento', 'sorento', 'sorento', FALSE),
    ('kia', 'Niro', 'niro', 'niro', FALSE),
    ('kia', 'Stonic', 'stonic', 'stonic', FALSE),
    ('kia', 'EV6', 'ev6', 'ev6', FALSE)
) AS v(brand_slug, name, slug, seo_slug, is_city)
  ON b.slug = v.brand_slug
WHERE NOT EXISTS (
  SELECT 1
  FROM public.models m
  WHERE m.brand_id = b.id
    AND COALESCE(m.seo_slug, m.slug) = v.seo_slug
);

UPDATE public.models m
SET
  is_popular = TRUE,
  is_seo_indexable = TRUE,
  seo_slug = COALESCE(m.seo_slug, m.slug)
FROM public.brands b
WHERE m.brand_id = b.id
  AND (
    (b.slug = 'skoda' AND m.slug IN ('octavia', 'fabia', 'superb', 'kodiaq', 'karoq', 'scala', 'kamiq', 'enyaq')) OR
    (b.slug = 'volkswagen' AND m.slug IN ('golf', 'passat', 'tiguan', 'polo', 'arteon', 'touareg', 't-roc', 'id4')) OR
    (b.slug = 'audi' AND m.slug IN ('a3', 'a4', 'a6', 'q3', 'q5', 'q7', 'q8', 'e-tron')) OR
    (b.slug = 'bmw' AND COALESCE(m.seo_slug, m.slug) IN ('3-series', '5-series', 'x1', 'x3', 'x5', 'x6', 'i4', 'ix')) OR
    (b.slug = 'mercedes-benz' AND COALESCE(m.seo_slug, m.slug) IN ('c-class', 'e-class', 's-class', 'glc', 'gle', 'gla', 'eqc', 'eqs')) OR
    (b.slug = 'ford' AND m.slug IN ('focus', 'fiesta', 'mondeo', 'kuga', 'puma', 'mustang')) OR
    (b.slug = 'toyota' AND m.slug IN ('corolla', 'yaris', 'camry', 'rav4', 'c-hr', 'land-cruiser')) OR
    (b.slug = 'hyundai' AND m.slug IN ('i20', 'i30', 'tucson', 'kona', 'ioniq', 'santa-fe')) OR
    (b.slug = 'kia' AND m.slug IN ('ceed', 'sportage', 'sorento', 'niro', 'stonic', 'ev6'))
  );

UPDATE public.models m
SET is_city_seo_indexable = TRUE
FROM public.brands b
WHERE m.brand_id = b.id
  AND (
    (b.slug = 'skoda' AND COALESCE(m.seo_slug, m.slug) IN ('octavia', 'fabia', 'superb')) OR
    (b.slug = 'volkswagen' AND COALESCE(m.seo_slug, m.slug) IN ('golf', 'passat', 'tiguan')) OR
    (b.slug = 'audi' AND COALESCE(m.seo_slug, m.slug) IN ('a4', 'a6', 'q5')) OR
    (b.slug = 'bmw' AND COALESCE(m.seo_slug, m.slug) IN ('3-series', '5-series', 'x5')) OR
    (b.slug = 'mercedes-benz' AND COALESCE(m.seo_slug, m.slug) IN ('c-class', 'e-class', 'glc'))
  );

CREATE TABLE IF NOT EXISTS public.taxonomy_sync_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  brands_processed INTEGER NOT NULL DEFAULT 0,
  models_processed INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT taxonomy_sync_runs_status_check
    CHECK (status IN ('running', 'succeeded', 'failed'))
);

ALTER TABLE public.taxonomy_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_taxonomy_sync_runs_provider_started_at
  ON public.taxonomy_sync_runs(provider, started_at DESC);
