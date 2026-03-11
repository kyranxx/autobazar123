-- Explicitly scope critical table policies to intended roles.
BEGIN;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access to profiles" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access to profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ads
DROP POLICY IF EXISTS "Active ads viewable" ON public.ads;
DROP POLICY IF EXISTS "Insert own ads" ON public.ads;
DROP POLICY IF EXISTS "Update own ads" ON public.ads;
DROP POLICY IF EXISTS "Delete own ads" ON public.ads;
DROP POLICY IF EXISTS "Public can view active ads" ON public.ads;
DROP POLICY IF EXISTS "Sellers can manage own ads" ON public.ads;
DROP POLICY IF EXISTS "Service role full access to ads" ON public.ads;

CREATE POLICY "Public can view active ads"
ON public.ads
FOR SELECT
TO anon, authenticated
USING (status = 'active' AND COALESCE(is_hidden, false) = false);

CREATE POLICY "Sellers can manage own ads"
ON public.ads
FOR ALL
TO authenticated
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Service role full access to ads"
ON public.ads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Credit transactions
DROP POLICY IF EXISTS "Dealers see own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users see own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "System can process payment transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Service role full access to credit transactions" ON public.credit_transactions;

CREATE POLICY "Users can view own transactions"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR dealer_id IN (
    SELECT id
    FROM public.dealers
    WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "System can process payment transactions"
ON public.credit_transactions
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to credit transactions"
ON public.credit_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;
