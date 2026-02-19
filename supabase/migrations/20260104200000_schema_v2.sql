-- =====================================================
-- Autobazar123 - Schema Update v2
-- Unified Credit System + Expiration Tracking + New Tables
-- =====================================================

-- 1. Add credit_balance to profiles (unified credits for all users)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credit_balance INTEGER DEFAULT 0;
-- 2. Add premium feature expiration columns to ads
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS top_expires_at TIMESTAMPTZ;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS highlight_expires_at TIMESTAMPTZ;
-- 3. Update credit_transactions to support all users (not just dealers)
ALTER TABLE public.credit_transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.credit_transactions ADD COLUMN IF NOT EXISTS action_type TEXT;
-- 'top_up', 'publish', 'top_ad', 'highlight', 'prolong', 'bump'
ALTER TABLE public.credit_transactions ADD COLUMN IF NOT EXISTS ad_id UUID REFERENCES public.ads(id);
-- Update RLS for credit_transactions to work with user_id
DROP POLICY IF EXISTS "Dealers see own transactions" ON public.credit_transactions;
CREATE POLICY "Users see own transactions" 
ON public.credit_transactions FOR SELECT USING (
  user_id = auth.uid() OR 
  dealer_id IN (SELECT id FROM public.dealers WHERE owner_id = auth.uid())
);
-- 4. Create saved_ads table (Favorites/Wishlist)
CREATE TABLE IF NOT EXISTS public.saved_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ad_id)
);
ALTER TABLE public.saved_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved ads" 
ON public.saved_ads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save ads" 
ON public.saved_ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave ads" 
ON public.saved_ads FOR DELETE USING (auth.uid() = user_id);
-- 5. Create inquiries table (Contact Messages)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  phone TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
-- Sender can see their sent inquiries
CREATE POLICY "Senders see own inquiries" 
ON public.inquiries FOR SELECT USING (auth.uid() = sender_id);
-- Seller can see inquiries for their ads
CREATE POLICY "Sellers see inquiries for their ads" 
ON public.inquiries FOR SELECT USING (
  ad_id IN (SELECT id FROM public.ads WHERE seller_id = auth.uid())
);
-- Anyone logged in can send inquiry
CREATE POLICY "Users can send inquiries" 
ON public.inquiries FOR INSERT WITH CHECK (auth.uid() = sender_id);
-- Seller can mark as read
CREATE POLICY "Sellers can update inquiry status" 
ON public.inquiries FOR UPDATE USING (
  ad_id IN (SELECT id FROM public.ads WHERE seller_id = auth.uid())
);
-- 6. Create credit_packages table (Available credit packs for purchase)
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,              -- "Starter Pack", "Pro Pack", etc.
  credits INTEGER NOT NULL,        -- Number of credits
  price_eur DECIMAL(10, 2) NOT NULL, -- Price in EUR
  stripe_price_id TEXT,            -- Stripe Price ID for checkout
  is_active BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE, -- Show "Most Popular" badge
  discount_percent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Credit packages viewable by everyone" 
ON public.credit_packages FOR SELECT USING (is_active = true);
-- Seed default credit packages (1 credit = 1€, rounded prices, bulk discounts)
INSERT INTO public.credit_packages (name, credits, price_eur, discount_percent, is_popular) VALUES
  ('Štart', 5, 5.00, 0, false),
  ('Základ', 10, 9.00, 10, false),
  ('Predajca', 25, 20.00, 20, true),
  ('Profi', 50, 35.00, 30, false),
  ('Dealer', 100, 60.00, 40, false);
-- 7. Add auto_prolong feature to ads
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS auto_prolong BOOLEAN DEFAULT FALSE;
-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_expires_at ON public.ads(expires_at);
CREATE INDEX IF NOT EXISTS idx_ads_top_expires_at ON public.ads(top_expires_at);
CREATE INDEX IF NOT EXISTS idx_ads_highlight_expires_at ON public.ads(highlight_expires_at);
CREATE INDEX IF NOT EXISTS idx_ads_seller_id ON public.ads(seller_id);
CREATE INDEX IF NOT EXISTS idx_ads_brand_id ON public.ads(brand_id);
CREATE INDEX IF NOT EXISTS idx_saved_ads_user_id ON public.saved_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_ad_id ON public.inquiries(ad_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_sender_id ON public.inquiries(sender_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
