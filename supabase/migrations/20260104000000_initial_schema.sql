-- Create Enums for standardized data
CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid', 'lpg', 'cng', 'hydrogen');
CREATE TYPE transmission_type AS ENUM ('manual', 'automatic');
CREATE TYPE body_type AS ENUM ('sedan', 'combi', 'suv', 'hatchback', 'coupe', 'cabriolet', 'mpv', 'pickup', 'commercial');
CREATE TYPE ad_status AS ENUM ('draft', 'active', 'sold', 'expired', 'banned');

-- Create Profiles table (extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create Dealers table (B2B Profiles)
CREATE TABLE public.dealers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- autobazar123.sk/predajca/[slug]
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  credit_balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Dealers
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers are viewable by everyone" 
ON public.dealers FOR SELECT USING (true);

CREATE POLICY "Dealers can update own info" 
ON public.dealers FOR UPDATE USING (auth.uid() = owner_id);

-- Create Credits Ledger (Transaction History)
CREATE TABLE public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- Negative for spend, Positive for top-up
  description TEXT NOT NULL, -- "Published Ad XYZ", "Top-up Pack A"
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Transactions (Private)
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers see own transactions" 
ON public.credit_transactions FOR SELECT USING (
  dealer_id IN (SELECT id FROM public.dealers WHERE owner_id = auth.uid())
);

-- Create Cars table (The Core Product)
CREATE TABLE public.cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Private seller ID
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE, -- Optional, if sold by dealer
  
  -- Basic Info
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  generation TEXT,
  year INTEGER NOT NULL,
  price_eur DECIMAL(10, 2) NOT NULL,
  mileage_km INTEGER NOT NULL,
  
  -- Technical Specs
  fuel fuel_type NOT NULL,
  transmission transmission_type NOT NULL,
  body_style body_type NOT NULL,
  power_kw INTEGER,
  engine_volume_cm3 INTEGER,
  drive_type TEXT, -- FWD, RWD, 4x4
  color TEXT,
  
  -- Trust Signals (Slovak Specifics)
  is_bought_in_sk BOOLEAN DEFAULT FALSE,
  is_vat_deductible BOOLEAN DEFAULT FALSE,
  has_service_book BOOLEAN DEFAULT FALSE,
  full_service_history BOOLEAN DEFAULT FALSE,
  originality_check BOOLEAN DEFAULT FALSE,
  warranty_expiration TIMESTAMPTZ,
  garage_kept BOOLEAN DEFAULT FALSE,
  not_crashed BOOLEAN DEFAULT FALSE,
  is_imported BOOLEAN DEFAULT FALSE,
  
  -- Ad Status & Logic
  status ad_status DEFAULT 'draft',
  views_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Monetization Logic
  is_top_ad BOOLEAN DEFAULT FALSE, -- Topovanie
  is_highlighted BOOLEAN DEFAULT FALSE, -- Zvýraznenie
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ, -- For "4-Day Rule"
  
  -- Media
  photos_json JSONB DEFAULT '[]'::jsonb, -- Array of Cloudflare Image URLs
  equipment_json JSONB DEFAULT '[]'::jsonb, -- Array of strings ["ABS", "ESP"]
  
  description TEXT,
  location_city TEXT NOT NULL,
  location_district TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Cars
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active ads are viewable by everyone" 
ON public.cars FOR SELECT USING (status = 'active' OR status = 'sold');

CREATE POLICY "Users can insert own ads" 
ON public.cars FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update own ads" 
ON public.cars FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete own ads" 
ON public.cars FOR DELETE USING (auth.uid() = seller_id);

-- Function to handle New User Signups automatically
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for New User
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
