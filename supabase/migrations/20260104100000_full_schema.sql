-- =====================================================
-- Autobazar123 - Complete Database Schema
-- =====================================================

-- 1. Create Enums for standardized data
CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid', 'lpg', 'cng', 'hydrogen');
CREATE TYPE transmission_type AS ENUM ('manual', 'automatic');
CREATE TYPE body_type AS ENUM ('sedan', 'combi', 'suv', 'hatchback', 'coupe', 'cabriolet', 'mpv', 'pickup', 'commercial');
CREATE TYPE ad_status AS ENUM ('draft', 'active', 'sold', 'expired', 'banned');

-- 2. Create Profiles table (extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Create Dealers table (B2B Profiles)
CREATE TABLE public.dealers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
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

ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers are viewable by everyone" 
ON public.dealers FOR SELECT USING (true);

CREATE POLICY "Dealers can update own info" 
ON public.dealers FOR UPDATE USING (auth.uid() = owner_id);

-- 4. Create Credits Ledger (Transaction History)
CREATE TABLE public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers see own transactions" 
ON public.credit_transactions FOR SELECT USING (
  dealer_id IN (SELECT id FROM public.dealers WHERE owner_id = auth.uid())
);

-- 5. Create Brands table (Source of Truth)
CREATE TABLE public.brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brands viewable by everyone" ON public.brands FOR SELECT USING (true);

-- 6. Create Models table
CREATE TABLE public.models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Models viewable by everyone" ON public.models FOR SELECT USING (true);

-- 7. Create Ads table (The Core Product - formerly 'cars')
CREATE TABLE public.ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE,
  
  -- Brand/Model Relations
  brand_id UUID REFERENCES public.brands(id),
  model_id UUID REFERENCES public.models(id),
  brand TEXT NOT NULL, -- Text fallback
  model TEXT NOT NULL, -- Text fallback
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
  drive_type TEXT,
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
  is_top_ad BOOLEAN DEFAULT FALSE,
  is_highlighted BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  
  -- Media
  photos_json JSONB DEFAULT '[]'::jsonb,
  equipment_json JSONB DEFAULT '[]'::jsonb,
  
  description TEXT,
  location_city TEXT NOT NULL,
  location_district TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active ads viewable" 
ON public.ads FOR SELECT USING (status = 'active' OR status = 'sold');

CREATE POLICY "Insert own ads" 
ON public.ads FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Update own ads" 
ON public.ads FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Delete own ads" 
ON public.ads FOR DELETE USING (auth.uid() = seller_id);

-- 8. Function to handle New User Signups automatically
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 9. Seed Popular Car Brands
INSERT INTO public.brands (name, slug, is_popular) VALUES
  ('Škoda', 'skoda', true),
  ('Volkswagen', 'volkswagen', true),
  ('BMW', 'bmw', true),
  ('Audi', 'audi', true),
  ('Mercedes-Benz', 'mercedes-benz', true),
  ('Toyota', 'toyota', true),
  ('Ford', 'ford', true),
  ('Opel', 'opel', true),
  ('Peugeot', 'peugeot', true),
  ('Renault', 'renault', true),
  ('Hyundai', 'hyundai', true),
  ('Kia', 'kia', true),
  ('Honda', 'honda', false),
  ('Mazda', 'mazda', false),
  ('Volvo', 'volvo', false),
  ('Seat', 'seat', false),
  ('Citroën', 'citroen', false),
  ('Fiat', 'fiat', false),
  ('Nissan', 'nissan', false),
  ('Dacia', 'dacia', true);

-- 10. Seed Popular Models (Škoda)
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Octavia', 'octavia', 'combi' FROM public.brands WHERE slug = 'skoda';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Fabia', 'fabia', 'hatchback' FROM public.brands WHERE slug = 'skoda';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Superb', 'superb', 'sedan' FROM public.brands WHERE slug = 'skoda';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Kodiaq', 'kodiaq', 'suv' FROM public.brands WHERE slug = 'skoda';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Karoq', 'karoq', 'suv' FROM public.brands WHERE slug = 'skoda';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Scala', 'scala', 'hatchback' FROM public.brands WHERE slug = 'skoda';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Kamiq', 'kamiq', 'suv' FROM public.brands WHERE slug = 'skoda';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Enyaq', 'enyaq', 'suv' FROM public.brands WHERE slug = 'skoda';

-- Seed Popular Models (Volkswagen)
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Golf', 'golf', 'hatchback' FROM public.brands WHERE slug = 'volkswagen';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Passat', 'passat', 'combi' FROM public.brands WHERE slug = 'volkswagen';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Tiguan', 'tiguan', 'suv' FROM public.brands WHERE slug = 'volkswagen';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Polo', 'polo', 'hatchback' FROM public.brands WHERE slug = 'volkswagen';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Touran', 'touran', 'mpv' FROM public.brands WHERE slug = 'volkswagen';

-- Seed Popular Models (BMW)
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Rad 3', 'rad-3', 'sedan' FROM public.brands WHERE slug = 'bmw';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Rad 5', 'rad-5', 'sedan' FROM public.brands WHERE slug = 'bmw';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'X3', 'x3', 'suv' FROM public.brands WHERE slug = 'bmw';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'X5', 'x5', 'suv' FROM public.brands WHERE slug = 'bmw';

-- Seed Popular Models (Audi)
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'A4', 'a4', 'combi' FROM public.brands WHERE slug = 'audi';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'A6', 'a6', 'combi' FROM public.brands WHERE slug = 'audi';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Q5', 'q5', 'suv' FROM public.brands WHERE slug = 'audi';
INSERT INTO public.models (brand_id, name, slug, category) 
SELECT id, 'Q7', 'q7', 'suv' FROM public.brands WHERE slug = 'audi';
