-- Migration: Fix credit system race condition and add security improvements
-- Date: 2026-01-29

-- 0. Add missing columns for cron jobs (if they don't exist)
-- These columns are needed for cleanup-sold and ad-expiration cron jobs
ALTER TABLE ads ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS top_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS highlight_expires_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better cron job performance
CREATE INDEX IF NOT EXISTS idx_ads_status_sold_at ON ads(status, sold_at) WHERE status = 'sold';
CREATE INDEX IF NOT EXISTS idx_ads_is_hidden ON ads(is_hidden) WHERE is_hidden = false;
CREATE INDEX IF NOT EXISTS idx_ads_top_expires ON ads(is_top_ad, top_expires_at) WHERE is_top_ad = true;
CREATE INDEX IF NOT EXISTS idx_ads_highlight_expires ON ads(is_highlighted, highlight_expires_at) WHERE is_highlighted = true;

-- 1. Create RPC function for atomic credit deduction (prevents race conditions)
CREATE OR REPLACE FUNCTION deduct_and_boost_ad(
    p_user_id UUID,
    p_ad_id UUID,
    p_credits_needed INTEGER DEFAULT 3
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_credits INTEGER;
    v_top_until TIMESTAMP;
BEGIN
    -- Lock the user profile row for update (prevents race conditions)
    SELECT credit_balance INTO v_current_credits
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;
    
    -- Check if user has enough credits
    IF v_current_credits IS NULL OR v_current_credits < p_credits_needed THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'current_balance', COALESCE(v_current_credits, 0)
        );
    END IF;
    
    -- Calculate new balance
    v_new_credits := v_current_credits - p_credits_needed;
    v_top_until := NOW() + INTERVAL '7 days';
    
    -- Update profile with new credit balance
    UPDATE profiles
    SET credit_balance = v_new_credits,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Set ad as TOP
    UPDATE ads
    SET is_top_ad = true,
        top_expires_at = v_top_until,
        updated_at = NOW()
    WHERE id = p_ad_id;
    
    -- Record the transaction
    INSERT INTO credit_transactions (
        user_id,
        action_type,
        amount,
        description,
        created_at
    ) VALUES (
        p_user_id,
        'boost',
        -p_credits_needed,
        'Top ad boost for ad: ' || p_ad_id,
        NOW()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_credits,
        'top_until', v_top_until
    );
END;
$$;

-- 2. Create RPC function for publishing ad with credit deduction
CREATE OR REPLACE FUNCTION publish_ad_with_credits(
    p_user_id UUID,
    p_ad_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_credits INTEGER;
    v_ad_id UUID;
    v_credits_needed INTEGER := 1;
BEGIN
    -- Lock the user profile row for update
    SELECT credit_balance INTO v_current_credits
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;
    
    -- Check credits
    IF v_current_credits IS NULL OR v_current_credits < v_credits_needed THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'required', v_credits_needed,
            'current_balance', COALESCE(v_current_credits, 0)
        );
    END IF;
    
    -- Calculate new balance
    v_new_credits := v_current_credits - v_credits_needed;
    
    -- Insert the ad
    INSERT INTO ads (
        seller_id,
        brand_id,
        model_id,
        year,
        price_eur,
        mileage_km,
        fuel,
        transmission,
        body_style,
        power_kw,
        engine_volume_cm3,
        drive_type,
        color,
        location_city,
        location_district,
        description,
        vin,
        is_bought_in_sk,
        is_vat_deductible,
        has_service_book,
        full_service_history,
        originality_check,
        garage_kept,
        not_crashed,
        stk_valid_until,
        photos_json,
        equipment_json,
        status,
        expires_at,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        (p_ad_data->>'brand_id')::UUID,
        (p_ad_data->>'model_id')::UUID,
        (p_ad_data->>'year')::INTEGER,
        (p_ad_data->>'price_eur')::INTEGER,
        (p_ad_data->>'mileage_km')::INTEGER,
        p_ad_data->>'fuel',
        p_ad_data->>'transmission',
        p_ad_data->>'body_style',
        (p_ad_data->>'power_kw')::INTEGER,
        (p_ad_data->>'engine_volume_cm3')::INTEGER,
        p_ad_data->>'drive_type',
        p_ad_data->>'color',
        p_ad_data->>'location_city',
        p_ad_data->>'location_district',
        p_ad_data->>'description',
        p_ad_data->>'vin',
        (p_ad_data->>'is_bought_in_sk')::BOOLEAN,
        (p_ad_data->>'is_vat_deductible')::BOOLEAN,
        (p_ad_data->>'has_service_book')::BOOLEAN,
        (p_ad_data->>'full_service_history')::BOOLEAN,
        (p_ad_data->>'originality_check')::BOOLEAN,
        (p_ad_data->>'garage_kept')::BOOLEAN,
        (p_ad_data->>'not_crashed')::BOOLEAN,
        (p_ad_data->>'stk_valid_until')::DATE,
        (p_ad_data->'photos_json')::TEXT[],
        (p_ad_data->'equipment_json')::TEXT[],
        'active',
        NOW() + INTERVAL '30 days',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_ad_id;
    
    -- Update profile with new credit balance
    UPDATE profiles
    SET credit_balance = v_new_credits,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Record the transaction
    INSERT INTO credit_transactions (
        user_id,
        action_type,
        amount,
        description,
        ad_id,
        created_at
    ) VALUES (
        p_user_id,
        'publish',
        -v_credits_needed,
        'Published ad',
        v_ad_id,
        NOW()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'ad_id', v_ad_id,
        'new_balance', v_new_credits
    );
END;
$$;

-- 3. Add unique constraint to prevent duplicate stripe transactions
ALTER TABLE credit_transactions 
ADD CONSTRAINT unique_stripe_payment UNIQUE (stripe_payment_id);

-- 4. Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe_payment 
ON credit_transactions(stripe_payment_id) 
WHERE stripe_payment_id IS NOT NULL;

-- 5. Ensure proper RLS policies exist
-- (These should already exist from initial setup, but adding for completeness)

-- Enable RLS on all tables if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_ads ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Ads: Public can view active ads, sellers can manage their own
DROP POLICY IF EXISTS "Public can view active ads" ON ads;
CREATE POLICY "Public can view active ads" ON ads
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Sellers can manage own ads" ON ads;
CREATE POLICY "Sellers can manage own ads" ON ads
    FOR ALL USING (seller_id = auth.uid());

-- Credit transactions: Users can only see their own
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT USING (user_id = auth.uid());

-- Saved ads: Users can manage their own saved ads
DROP POLICY IF EXISTS "Users can manage own saved ads" ON saved_ads;
CREATE POLICY "Users can manage own saved ads" ON saved_ads
    FOR ALL USING (user_id = auth.uid());

-- 6. Add function to check if stripe transaction already processed
CREATE OR REPLACE FUNCTION is_stripe_transaction_processed(p_payment_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM credit_transactions 
        WHERE stripe_payment_id = p_payment_id
    );
END;
$$;
