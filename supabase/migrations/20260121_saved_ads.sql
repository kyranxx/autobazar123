-- Ensure saved_ads table exists for wishlist functionality
CREATE TABLE IF NOT EXISTS public.saved_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ad_id)
);

ALTER TABLE public.saved_ads ENABLE ROW LEVEL SECURITY;

-- Create policies with exception handling for duplicates
DO $$ BEGIN
  CREATE POLICY "Users can view own saved ads" 
  ON public.saved_ads FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can save ads" 
  ON public.saved_ads FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can unsave ads" 
  ON public.saved_ads FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_ads_user_id ON public.saved_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_ads_ad_id ON public.saved_ads(ad_id);
