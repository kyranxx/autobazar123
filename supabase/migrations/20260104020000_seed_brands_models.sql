-- Seed popular Slovak car brands
INSERT INTO public.brands (name, slug, is_popular) VALUES
  ('Škoda', 'skoda', TRUE),
  ('Volkswagen', 'volkswagen', TRUE),
  ('BMW', 'bmw', TRUE),
  ('Audi', 'audi', TRUE),
  ('Mercedes-Benz', 'mercedes-benz', TRUE),
  ('Toyota', 'toyota', FALSE),
  ('Ford', 'ford', FALSE);

-- Seed models for Škoda
INSERT INTO public.models (brand_id, name, slug, category)
SELECT id, 'Octavia', 'octavia', 'combi' FROM public.brands WHERE slug = 'skoda'
UNION ALL
SELECT id, 'Fabia', 'fabia', 'hatchback' FROM public.brands WHERE slug = 'skoda'
UNION ALL
SELECT id, 'Superb', 'superb', 'sedan' FROM public.brands WHERE slug = 'skoda'
UNION ALL
SELECT id, 'Kodiaq', 'kodiaq', 'suv' FROM public.brands WHERE slug = 'skoda';

-- Seed models for Volkswagen
INSERT INTO public.models (brand_id, name, slug, category)
SELECT id, 'Golf', 'golf', 'hatchback' FROM public.brands WHERE slug = 'volkswagen'
UNION ALL
SELECT id, 'Passat', 'passat', 'combi' FROM public.brands WHERE slug = 'volkswagen'
UNION ALL
SELECT id, 'Tiguan', 'tiguan', 'suv' FROM public.brands WHERE slug = 'volkswagen';

-- Seed models for BMW
INSERT INTO public.models (brand_id, name, slug, category)
SELECT id, '3 Series', '3-series', 'sedan' FROM public.brands WHERE slug = 'bmw'
UNION ALL
SELECT id, '5 Series', '5-series', 'sedan' FROM public.brands WHERE slug = 'bmw'
UNION ALL
SELECT id, 'X5', 'x5', 'suv' FROM public.brands WHERE slug = 'bmw';

-- Seed models for Audi
INSERT INTO public.models (brand_id, name, slug, category)
SELECT id, 'A4', 'a4', 'sedan' FROM public.brands WHERE slug = 'audi'
UNION ALL
SELECT id, 'A6', 'a6', 'sedan' FROM public.brands WHERE slug = 'audi'
UNION ALL
SELECT id, 'Q5', 'q5', 'suv' FROM public.brands WHERE slug = 'audi';

-- Seed models for Mercedes-Benz
INSERT INTO public.models (brand_id, name, slug, category)
SELECT id, 'C-Class', 'c-class', 'sedan' FROM public.brands WHERE slug = 'mercedes-benz'
UNION ALL
SELECT id, 'E-Class', 'e-class', 'sedan' FROM public.brands WHERE slug = 'mercedes-benz'
UNION ALL
SELECT id, 'GLC', 'glc', 'suv' FROM public.brands WHERE slug = 'mercedes-benz';
