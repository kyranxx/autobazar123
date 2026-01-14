-- =====================================================
-- Autobazar123 - Credits Function
-- Helper to safely deduct credits from users
-- =====================================================

CREATE OR REPLACE FUNCTION public.deduct_credit(amount INTEGER) 
RETURNS void AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- 1. Get current balance
    SELECT credit_balance INTO current_balance 
    FROM public.profiles 
    WHERE id = auth.uid();

    -- 2. Check if enough credits
    IF current_balance < amount THEN
        RAISE EXCEPTION 'Nedostatok kreditov (Balance: %, Required: %)', current_balance, amount;
    END IF;

    -- 3. Deduct credits
    UPDATE public.profiles 
    SET credit_balance = credit_balance - amount 
    WHERE id = auth.uid();

    -- 4. Record transaction (optional but better)
    INSERT INTO public.credit_transactions (user_id, amount, description, action_type)
    VALUES (auth.uid(), -amount, 'Zverejnenie inzerátu', 'publish');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
