-- Feature Flags Table
-- Allows toggling features without redeployment

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT false,
    rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_users JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER trigger_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_flags_updated_at();

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to feature_flags"
    ON feature_flags
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow service role full access to feature_flags"
    ON feature_flags
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

INSERT INTO feature_flags (key, name, description, enabled, rollout_percentage, target_users)
VALUES 
    ('new_search_ui', 'New Search UI', 'Enable the redesigned search interface', false, 0, '[]'),
    ('dark_mode', 'Dark Mode', 'Enable dark mode theme support', false, 0, '[]'),
    ('premium_features', 'Premium Features', 'Enable premium features for selected users', false, 0, '[]'),
    ('advanced_filters', 'Advanced Filters', 'Enable advanced search filters', true, 100, '[]'),
    ('ai_recommendations', 'AI Recommendations', 'Enable AI-powered car recommendations', false, 0, '[]'),
    ('social_sharing', 'Social Sharing', 'Enable social media sharing features', true, 100, '[]')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE feature_flags IS 'Feature flags for toggling features without redeployment';
COMMENT ON COLUMN feature_flags.key IS 'Unique identifier for the flag, used in code';
COMMENT ON COLUMN feature_flags.rollout_percentage IS 'Percentage of users (0-100) that should see this feature';
COMMENT ON COLUMN feature_flags.target_users IS 'JSON array of user IDs that should always see this feature';
