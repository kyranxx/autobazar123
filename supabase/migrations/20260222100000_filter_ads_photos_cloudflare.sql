-- One-time cleanup migration:
-- Keep only Cloudflare Images delivery URLs in public.ads.photos_json.
-- Any non-Cloudflare URL (legacy Unsplash, external host, invalid URL) is removed.
--
-- Verification before/after running migration:
-- SELECT id
-- FROM public.ads
-- WHERE jsonb_typeof(photos_json) = 'array'
--   AND EXISTS (
--     SELECT 1
--     FROM jsonb_array_elements_text(photos_json) AS photo(url)
--     WHERE photo.url !~ '^https://imagedelivery\\.net/'
--   );

WITH normalized_photos AS (
  SELECT
    ads.id,
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(kept.url) ORDER BY kept.ord)
        FROM (
          SELECT
            photo.url,
            photo.ord
          FROM jsonb_array_elements_text(ads.photos_json) WITH ORDINALITY AS photo(url, ord)
          WHERE photo.url ~ '^https://imagedelivery\\.net/'
        ) AS kept
      ),
      '[]'::jsonb
    ) AS filtered_photos
  FROM public.ads AS ads
  WHERE jsonb_typeof(ads.photos_json) = 'array'
),
updated_ads AS (
  UPDATE public.ads AS ads
  SET photos_json = normalized_photos.filtered_photos
  FROM normalized_photos
  WHERE ads.id = normalized_photos.id
    AND ads.photos_json IS DISTINCT FROM normalized_photos.filtered_photos
  RETURNING ads.id
)
SELECT COUNT(*) AS updated_rows
FROM updated_ads;
