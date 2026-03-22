BEGIN;

ALTER TABLE public.ads
  DROP CONSTRAINT IF EXISTS ads_brand_text_length,
  DROP CONSTRAINT IF EXISTS ads_model_text_length,
  DROP CONSTRAINT IF EXISTS ads_generation_length,
  DROP CONSTRAINT IF EXISTS ads_year_range,
  DROP CONSTRAINT IF EXISTS ads_price_range,
  DROP CONSTRAINT IF EXISTS ads_mileage_range,
  DROP CONSTRAINT IF EXISTS ads_power_kw_range,
  DROP CONSTRAINT IF EXISTS ads_engine_volume_range,
  DROP CONSTRAINT IF EXISTS ads_drive_type_length,
  DROP CONSTRAINT IF EXISTS ads_color_length,
  DROP CONSTRAINT IF EXISTS ads_description_length,
  DROP CONSTRAINT IF EXISTS ads_location_city_length,
  DROP CONSTRAINT IF EXISTS ads_location_district_length,
  DROP CONSTRAINT IF EXISTS ads_photos_json_shape,
  DROP CONSTRAINT IF EXISTS ads_equipment_json_shape;

ALTER TABLE public.ads
  ADD CONSTRAINT ads_brand_text_length CHECK (char_length(btrim(brand)) BETWEEN 1 AND 100),
  ADD CONSTRAINT ads_model_text_length CHECK (char_length(btrim(model)) BETWEEN 1 AND 100),
  ADD CONSTRAINT ads_generation_length CHECK (
    generation IS NULL
    OR char_length(btrim(generation)) <= 120
  ),
  ADD CONSTRAINT ads_year_range CHECK (year BETWEEN 1886 AND 2100),
  ADD CONSTRAINT ads_price_range CHECK (price_eur > 0 AND price_eur <= 100000000),
  ADD CONSTRAINT ads_mileage_range CHECK (mileage_km >= 0 AND mileage_km <= 5000000),
  ADD CONSTRAINT ads_power_kw_range CHECK (
    power_kw IS NULL
    OR power_kw BETWEEN 1 AND 5000
  ),
  ADD CONSTRAINT ads_engine_volume_range CHECK (
    engine_volume_cm3 IS NULL
    OR engine_volume_cm3 BETWEEN 50 AND 20000
  ),
  ADD CONSTRAINT ads_drive_type_length CHECK (
    drive_type IS NULL
    OR char_length(btrim(drive_type)) BETWEEN 1 AND 60
  ),
  ADD CONSTRAINT ads_color_length CHECK (
    color IS NULL
    OR char_length(btrim(color)) BETWEEN 1 AND 60
  ),
  ADD CONSTRAINT ads_description_length CHECK (
    description IS NULL
    OR char_length(btrim(description)) BETWEEN 1 AND 4000
  ),
  ADD CONSTRAINT ads_location_city_length CHECK (
    char_length(btrim(location_city)) BETWEEN 1 AND 120
  ),
  ADD CONSTRAINT ads_location_district_length CHECK (
    location_district IS NULL
    OR char_length(btrim(location_district)) BETWEEN 1 AND 120
  ),
  ADD CONSTRAINT ads_photos_json_shape CHECK (
    photos_json IS NOT NULL
    AND jsonb_typeof(photos_json) = 'array'
    AND CASE
      WHEN jsonb_typeof(photos_json) = 'array' THEN jsonb_array_length(photos_json) <= 10
      ELSE FALSE
    END
  ),
  ADD CONSTRAINT ads_equipment_json_shape CHECK (
    equipment_json IS NOT NULL
    AND jsonb_typeof(equipment_json) = 'array'
    AND CASE
      WHEN jsonb_typeof(equipment_json) = 'array' THEN jsonb_array_length(equipment_json) <= 128
      ELSE FALSE
    END
  );

DROP POLICY IF EXISTS "Users can insert own ads" ON public.ads;
DROP POLICY IF EXISTS "Sellers and admins can update ads" ON public.ads;
DROP POLICY IF EXISTS "Sellers can delete own ads" ON public.ads;
DROP POLICY IF EXISTS "Admins can update ads" ON public.ads;
DROP POLICY IF EXISTS "Admins can delete ads" ON public.ads;

CREATE POLICY "Admins can update ads"
ON public.ads
FOR UPDATE
TO authenticated
USING ((SELECT public.is_current_user_site_admin()))
WITH CHECK ((SELECT public.is_current_user_site_admin()));

CREATE POLICY "Admins can delete ads"
ON public.ads
FOR DELETE
TO authenticated
USING ((SELECT public.is_current_user_site_admin()));

COMMIT;
