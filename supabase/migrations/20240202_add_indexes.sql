-- Performance indexes for common queries

CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_brand_model ON ads(brand_id, model_id);
CREATE INDEX IF NOT EXISTS idx_ads_price ON ads(price_eur);
CREATE INDEX IF NOT EXISTS idx_ads_created ON ads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_seller ON ads(seller_id);
CREATE INDEX IF NOT EXISTS idx_ads_active_recent ON ads(status, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ads_featured ON ads(is_top_ad, is_highlighted, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_ads_user ON saved_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
