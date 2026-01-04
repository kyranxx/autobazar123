-- 1. Rename 'cars' to 'ads' (The generic Listing entity)
ALTER TABLE IF EXISTS cars RENAME TO ads;

-- 2. Create 'brands' table (Source of Truth)
CREATE TABLE public.brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- "Škoda"
  slug TEXT NOT NULL UNIQUE, -- "skoda"
  logo_url TEXT,
  is_popular BOOLEAN DEFAULT FALSE, -- To show at top of lists
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Read-only for public)
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brands viewable by everyone" ON public.brands FOR SELECT USING (true);

-- 3. Create 'models' table
CREATE TABLE public.models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- "Octavia"
  slug TEXT NOT NULL, -- "octavia"
  category TEXT, -- "sedan", "suv" (Optional hint)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Read-only for public)
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Models viewable by everyone" ON public.models FOR SELECT USING (true);

-- 4. Update 'ads' table to use Relations instead of Text
-- (We keep text columns temporarily as a cache/fallback, but add IDs)
ALTER TABLE public.ads ADD COLUMN brand_id UUID REFERENCES public.brands(id);
ALTER TABLE public.ads ADD COLUMN model_id UUID REFERENCES public.models(id);

-- Update RLS policies for the new table name 'ads'
-- (Note: Renaming the table usually preserves policies, but we ensure naming consistency)
ALTER POLICY "Active ads are viewable by everyone" ON public.ads RENAME TO "Active ads viewable";
ALTER POLICY "Users can insert own ads" ON public.ads RENAME TO "Insert own ads";
ALTER POLICY "Users can update own ads" ON public.ads RENAME TO "Update own ads";
ALTER POLICY "Users can delete own ads" ON public.ads RENAME TO "Delete own ads";
