-- =====================================================
-- Autobazar123 - Enhanced Stripe Payment Flow
-- Features: Invoice tracking, Payment status, Email notifications
-- =====================================================

-- 1. Add missing columns to credit_transactions table
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'; -- pending, succeeded, failed
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS invoice_url TEXT;
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- 2. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_payment_status 
ON credit_transactions(payment_status) 
WHERE payment_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe_session 
ON credit_transactions(stripe_session_id) 
WHERE stripe_session_id IS NOT NULL;

-- 3. Create payment_notifications table for email tracking
CREATE TABLE IF NOT EXISTS public.payment_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.credit_transactions(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL, -- 'confirmation', 'failure', 'invoice'
  user_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  email_status TEXT DEFAULT 'pending', -- pending, sent, failed
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their payment notifications" 
ON public.payment_notifications FOR SELECT USING (
  transaction_id IN (
    SELECT id FROM credit_transactions WHERE user_id = auth.uid()
  )
);

-- 4. Create indexes for payment notifications
CREATE INDEX IF NOT EXISTS idx_payment_notifications_transaction_id 
ON payment_notifications(transaction_id);

CREATE INDEX IF NOT EXISTS idx_payment_notifications_email_status 
ON payment_notifications(email_status);

CREATE INDEX IF NOT EXISTS idx_payment_notifications_user_email 
ON payment_notifications(user_email);

-- 5. Update RLS policy for credit_transactions to allow system writes
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;

CREATE POLICY "Users can view own transactions" 
ON credit_transactions FOR SELECT USING (
  user_id = auth.uid() OR 
  dealer_id IN (SELECT id FROM public.dealers WHERE owner_id = auth.uid())
);

-- Allow system (service role) to update transactions for payment processing
DROP POLICY IF EXISTS "System can process payment transactions" ON credit_transactions;
CREATE POLICY "System can process payment transactions"
ON credit_transactions
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Unique constraint on stripe session ID (idempotency)
ALTER TABLE credit_transactions 
DROP CONSTRAINT IF EXISTS unique_stripe_payment;

ALTER TABLE credit_transactions 
ADD CONSTRAINT unique_stripe_session UNIQUE (stripe_session_id);

-- Keep payment_id unique too if it exists, but session is primary
CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_payment_id_unique 
ON credit_transactions(stripe_payment_id) 
WHERE stripe_payment_id IS NOT NULL;

-- 7. Create audit log table for payment debugging
CREATE TABLE IF NOT EXISTS public.stripe_webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL, -- Stripe event ID
  event_type TEXT NOT NULL, -- checkout.session.completed, payment_intent.succeeded, etc.
  session_id TEXT,
  user_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL, -- processed, failed, skipped
  error_message TEXT,
  metadata JSONB, -- Full event data for debugging
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stripe_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs" 
ON public.stripe_webhook_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.site_admins
    WHERE user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_event_id 
ON stripe_webhook_logs(event_id);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_session_id 
ON stripe_webhook_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_processed_at 
ON stripe_webhook_logs(processed_at DESC);

-- 8. Enhanced RPC function for safe credit deduction with proper blocking
-- Prevents over-spending and records transaction atomically
CREATE OR REPLACE FUNCTION deduct_credits_with_transaction(
    p_user_id UUID,
    p_credits_needed INTEGER,
    p_action_type TEXT DEFAULT 'usage',
    p_description TEXT DEFAULT NULL,
    p_ad_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_credits INTEGER;
    v_transaction_id UUID;
BEGIN
    -- Lock the user profile row for update (prevents race conditions)
    SELECT credit_balance INTO v_current_credits
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;
    
    -- Check if user has enough credits (blocking condition)
    IF v_current_credits IS NULL OR v_current_credits < p_credits_needed THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'current_balance', COALESCE(v_current_credits, 0),
            'credits_needed', p_credits_needed,
            'shortage', p_credits_needed - COALESCE(v_current_credits, 0)
        );
    END IF;
    
    -- Calculate new balance
    v_new_credits := v_current_credits - p_credits_needed;
    
    -- Update profile with new credit balance
    UPDATE profiles
    SET credit_balance = v_new_credits,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Record the transaction with status
    INSERT INTO credit_transactions (
        user_id,
        action_type,
        amount,
        description,
        ad_id,
        payment_status,
        created_at
    ) VALUES (
        p_user_id,
        p_action_type,
        -p_credits_needed,
        COALESCE(p_description, 'Credit deduction for ' || p_action_type),
        p_ad_id,
        'succeeded',
        NOW()
    )
    RETURNING id INTO v_transaction_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_credits,
        'transaction_id', v_transaction_id,
        'credits_deducted', p_credits_needed
    );
END;
$$;
