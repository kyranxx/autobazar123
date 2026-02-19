-- =====================================================
-- Autobazar123 - Add increment_ad_views RPC function
-- =====================================================

-- Create increment_ad_views RPC function
CREATE OR REPLACE FUNCTION increment_ad_views(ad_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.ads
  SET views_count = views_count + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION increment_ad_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_ad_views(UUID) TO anon;
