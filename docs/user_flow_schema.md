# 🧭 Autobazar123 - User Flow & Database Schema

> Complete mapping of user journeys to database operations

---

## 👥 User Types

| Type | Description | Auth Required | Tables Used |
|------|-------------|---------------|-------------|
| **Visitor** | Anonymous browser | ❌ No | `ads`, `brands`, `models` (READ) |
| **Registered User** | Can buy/sell, has credit wallet | ✅ Yes | `profiles`, `ads`, `credit_transactions` |
| **Dealer** | User + Public profile page | ✅ Yes | `profiles`, `dealers`, `ads`, `credit_transactions` |

> **💡 KEY DECISION:** Everyone uses the **same Credit Wallet system**. 
> - The difference: **Dealers** get a public storefront page (`/predajca/[slug]`) with logo, address, all their listings.
> - Regular users just have a private profile with their credit balance.

*\* Some tables below need to be created - see "Missing Tables" section*

---

## 🗺️ User Journey Flows

### Flow 1: Anonymous Visitor (Browsing)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ANONYMOUS VISITOR FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────────┐  │
│  │ Landing │───▶│ Search/Filter│───▶│ View Ad     │───▶│ Contact Seller │  │
│  │ Page    │    │ Page         │    │ Detail      │    │ (Login Wall)   │  │
│  └─────────┘    └──────────────┘    └─────────────┘    └────────────────┘  │
│       │                │                   │                   │            │
│       ▼                ▼                   ▼                   ▼            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      DATABASE OPERATIONS                            │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ • SELECT FROM ads WHERE status='active' ORDER BY is_top_ad DESC     │   │
│  │ • SELECT FROM brands WHERE is_popular=true                          │   │
│  │ • SELECT FROM models WHERE brand_id=?                               │   │
│  │ • UPDATE ads SET views_count = views_count + 1 WHERE id=?           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Step-by-Step:**

| Step | User Action | Page | Database Query | Table |
|------|-------------|------|----------------|-------|
| 1 | Opens site | `/` (Landing) | `SELECT * FROM ads WHERE status='active' AND is_top_ad=true LIMIT 8` | `ads` |
| 2 | Clicks lifestyle category (e.g., "SUV") | `/hladat?body=suv` | `SELECT * FROM ads WHERE body_style='suv' AND status='active'` | `ads` |
| 3 | Applies filters (Brand, Price, Year) | `/hladat?...` | Complex WHERE with brand_id, price range, year range | `ads`, `brands`, `models` |
| 4 | Clicks on car listing | `/inzerat/[id]` | `SELECT * FROM ads WHERE id=?` + `UPDATE views_count` | `ads` |
| 5 | Clicks "Contact Seller" | Modal/Redirect | **BLOCKED → Redirect to Login** | - |
| 6 | Views "Recently Sold" feed | `/` (Landing) | `SELECT * FROM ads WHERE status='sold' AND sold_at > NOW() - INTERVAL '4 days'` | `ads` |

---

### Flow 2: User Registration & Login

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REGISTRATION / LOGIN FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │ Click Login │───▶│ Supabase Auth   │───▶│ Trigger: on_auth_user_created│ │
│  │ / Register  │    │ (Email/Phone)   │    │ → Creates profile row        │ │
│  └─────────────┘    └─────────────────┘    └─────────────────────────────┘ │
│                            │                              │                 │
│                            ▼                              ▼                 │
│                     ┌─────────────┐              ┌───────────────┐         │
│                     │ auth.users  │──────────────│ profiles      │         │
│                     │ (Supabase)  │   FK: id     │ (our table)   │         │
│                     └─────────────┘              └───────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Database Trigger (Already Implemented):**
```sql
-- When user registers in Supabase Auth, automatically create profile row
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- The function:
INSERT INTO public.profiles (id, email, full_name)
VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
```

**Tables Involved:**

| Table | Operation | Data |
|-------|-----------|------|
| `auth.users` | INSERT (by Supabase) | `id`, `email`, `encrypted_password`, `phone` |
| `profiles` | INSERT (by trigger) | `id` (FK), `email`, `full_name`, `phone`, `is_verified` |

---

### Flow 3: Private Seller - Publishing an Ad

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PRIVATE SELLER - PUBLISH AD FLOW                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1         STEP 2          STEP 3         STEP 4         STEP 5       │
│  ┌──────┐      ┌───────┐       ┌──────┐       ┌──────┐       ┌──────────┐  │
│  │Choose│─────▶│Vehicle│──────▶│Equip-│──────▶│Photos│──────▶│Pay &     │  │
│  │Type  │      │Data   │       │ment  │       │Upload│       │Publish   │  │
│  └──────┘      └───────┘       └──────┘       └──────┘       └──────────┘  │
│     │              │               │              │               │         │
│     ▼              ▼               ▼              ▼               ▼         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      DATABASE OPERATIONS                            │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Step 1: No DB (UI only)                                             │   │
│  │ Step 2: SELECT brands, SELECT models WHERE brand_id=?               │   │
│  │ Step 3: Store in session/state (equipment_json)                     │   │
│  │ Step 4: Upload to Cloudflare Images → Store URLs in photos_json     │   │
│  │ Step 5: INSERT INTO ads (...) + Stripe Checkout                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Step-by-Step with Database:**

| Step | Wizard Step | User Input | Database Table | Operation |
|------|-------------|------------|----------------|-----------|
| 1 | Category Selection | "Osobné auto" / "Úžitkové" / "Moto" | - | UI state only |
| 2 | Vehicle Data | Brand, Model, Year, Mileage, Price | `brands`, `models` | SELECT (for dropdowns) |
| 3 | Technical Specs | Fuel, Transmission, Power, Color | - | Stored in form state |
| 4 | Trust Signals | Checkboxes (Kúpené v SR, Servisná knižka, etc.) | - | Stored in form state |
| 5 | Equipment | Multi-select (ABS, ESP, LED, etc.) | - | `equipment_json` array |
| 6 | Photos | Upload 1-10 images | External: Cloudflare | URLs stored in `photos_json` |
| 7 | Description | Free text | - | Stored in form state |
| 8 | Location | City, District | - | Stored in form state |
| 9 | Preview | Review draft | `ads` | INSERT with `status='draft'` |
| 10 | Payment | Stripe Checkout | External: Stripe | On success → UPDATE `status='active'` |

**Final INSERT Query:**
```sql
INSERT INTO ads (
  seller_id,           -- From auth session
  brand_id, model_id,  -- Selected from dropdowns
  brand, model,        -- Text fallback
  year, mileage_km, price_eur,
  fuel, transmission, body_style,
  power_kw, engine_volume_cm3, color,
  -- Trust signals
  is_bought_in_sk, is_vat_deductible, has_service_book,
  full_service_history, originality_check, warranty_expiration,
  garage_kept, not_crashed, is_imported,
  -- Media
  photos_json, equipment_json,
  description, location_city, location_district,
  -- Status
  status,           -- 'draft' initially, 'active' after payment
  published_at,     -- NULL until payment
  expires_at        -- NOW() + 30 days after payment
) VALUES (...);
```

---

### Flow 4: Unified Credit System (All Users)

> **💡 KEY DECISION:** Both private sellers AND dealers use the **same credit wallet** stored in `profiles.credit_balance`.
> Dealers just have additional features (public profile page, bulk operations).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      UNIFIED CREDIT WALLET FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────────┐    ┌───────────────────────────┐   │
│  │ Buy Credits │───▶│ Stripe Payment  │───▶│ Webhook: payment_success  │   │
│  │ (5, 20, 50) │    │ Checkout        │    │                           │   │
│  └─────────────┘    └─────────────────┘    └───────────────────────────┘   │
│        │                                              │                     │
│        │ Packs:                                       ▼                     │
│        │ • 5 credits = 4.99€                 ┌─────────────────────────┐   │
│        │ • 20 credits = 14.99€ (25% off)     │ INSERT credit_transactions│   │
│        │ • 50 credits = 29.99€ (40% off)     │ UPDATE profiles.credit_bal│   │
│        │ • 100 credits = 49.99€ (50% off)    └─────────────────────────┘   │
│        │                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SPENDING CREDITS (Actions)                       │   │
│  ├──────────────────┬──────────────────┬───────────────────────────────┤   │
│  │ Action           │ Credit Cost      │ Database Operation            │   │
│  ├──────────────────┼──────────────────┼───────────────────────────────┤   │
│  │ Publish Ad (30d) │ 1 credit         │ INSERT ads + UPDATE balance   │   │
│  │ Prolong Ad (+30d)│ 1 credit         │ UPDATE ads.expires_at + bal   │   │
│  │ Top Ad (7 days)  │ 3 credits        │ UPDATE is_top_ad, top_expires │   │
│  │ Highlight (7 days)│ 2 credits       │ UPDATE is_highlighted, hl_exp │   │
│  │ Bump to Top      │ 1 credit         │ UPDATE published_at = NOW()   │   │
│  └──────────────────┴──────────────────┴───────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DEALER-ONLY FEATURES                             │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ • Bulk Prolong (10 ads) = 8 credits (20% discount)                  │   │
│  │ • Bulk Top (5 ads) = 12 credits (20% discount)                      │   │
│  │ • Public Storefront: /predajca/[slug]                               │   │
│  │ • Verified Dealer Badge                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Credit Transaction Record:**
```sql
-- When ANY user spends credits (private seller or dealer)
INSERT INTO credit_transactions (user_id, amount, description, action_type, ad_id)
VALUES (
  'user-uuid',
  -3,  -- Negative = spending
  'Top Ad: Škoda Octavia 2021',
  'top_ad',
  'ad-uuid'
);

UPDATE profiles 
SET credit_balance = credit_balance - 3 
WHERE id = 'user-uuid';
```

---

### Flow 5: Buyer Journey (Registered User)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BUYER USER JOURNEY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────┐ │
│  │ Search & │───▶│ Save to  │───▶│ Compare  │───▶│ Contact  │───▶│ Mark  │ │
│  │ Filter   │    │ Favorites│    │ Cars     │    │ Seller   │    │ Bought│ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └───────┘ │
│       │               │               │               │              │      │
│       ▼               ▼               ▼               ▼              ▼      │
│  ┌─────────┐    ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────┐  │
│  │ ads     │    │saved_ads* │   │ UI only   │   │inquiries* │   │  ads  │  │
│  │ SELECT  │    │ INSERT    │   │(session)  │   │ INSERT    │   │UPDATE │  │
│  └─────────┘    └───────────┘   └───────────┘   └───────────┘   └───────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

* Tables need to be created (see "Missing Tables" section below)
```

---

## 📊 Complete Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE RELATIONSHIPS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        ┌──────────────┐                                     │
│                        │  auth.users  │  (Supabase managed)                 │
│                        │──────────────│                                     │
│                        │ id (PK)      │                                     │
│                        │ email        │                                     │
│                        │ phone        │                                     │
│                        └──────┬───────┘                                     │
│                               │                                             │
│                               │ 1:1 (trigger creates)                       │
│                               ▼                                             │
│                        ┌──────────────┐                                     │
│                        │   profiles   │                                     │
│                        │──────────────│                                     │
│                        │ id (PK, FK)  │◀────────────────────────┐           │
│                        │ email        │                         │           │
│                        │ full_name    │                         │           │
│                        │ phone        │                         │           │
│                        │ is_verified  │                         │           │
│                        │ avatar_url   │                         │           │
│                        └──────┬───────┘                         │           │
│                               │                                 │           │
│              ┌────────────────┼────────────────┐                │           │
│              │ 1:N (optional) │                │ 1:N            │           │
│              ▼                │                ▼                │           │
│       ┌──────────────┐        │         ┌─────────────┐         │           │
│       │   dealers    │        │         │ saved_ads*  │         │           │
│       │──────────────│        │         │─────────────│         │           │
│       │ id (PK)      │        │         │ user_id(FK) │─────────┘           │
│       │ owner_id(FK) │────────┘         │ ad_id (FK)  │───────┐             │
│       │ slug         │                  │ created_at  │       │             │
│       │ name         │                  └─────────────┘       │             │
│       │ credit_bal   │                                        │             │
│       │ is_verified  │                                        │             │
│       └──────┬───────┘                                        │             │
│              │                                                │             │
│              │ 1:N                                            │             │
│              ▼                                                │             │
│    ┌───────────────────┐                                      │             │
│    │credit_transactions│                                      │             │
│    │───────────────────│                                      │             │
│    │ id (PK)           │                                      │             │
│    │ dealer_id (FK)    │                                      │             │
│    │ amount (+/-)      │                                      │             │
│    │ description       │                                      │             │
│    │ stripe_payment_id │                                      │             │
│    └───────────────────┘                                      │             │
│                                                               │             │
│    ┌──────────────┐      ┌──────────────┐                     │             │
│    │   brands     │      │   models     │                     │             │
│    │──────────────│      │──────────────│                     │             │
│    │ id (PK)      │◀─────│ brand_id(FK) │                     │             │
│    │ name         │      │ id (PK)      │                     │             │
│    │ slug         │      │ name         │                     │             │
│    │ is_popular   │      │ slug         │                     │             │
│    └──────┬───────┘      └──────┬───────┘                     │             │
│           │                     │                             │             │
│           │                     │                             │             │
│           │     ┌───────────────┘                             │             │
│           │     │                                             │             │
│           ▼     ▼                                             │             │
│    ┌─────────────────────────────────────────────┐            │             │
│    │                    ads                      │◀───────────┘             │
│    │─────────────────────────────────────────────│                          │
│    │ id (PK)                                     │                          │
│    │ seller_id (FK → profiles)                   │                          │
│    │ dealer_id (FK → dealers, nullable)          │                          │
│    │ brand_id (FK → brands)                      │                          │
│    │ model_id (FK → models)                      │                          │
│    │ brand, model (text fallback)                │                          │
│    │ year, price_eur, mileage_km                 │                          │
│    │ fuel, transmission, body_style (ENUMS)      │                          │
│    │ power_kw, engine_volume_cm3, color          │                          │
│    │ ─────────── Trust Signals ───────────       │                          │
│    │ is_bought_in_sk, is_vat_deductible          │                          │
│    │ has_service_book, full_service_history      │                          │
│    │ originality_check, warranty_expiration      │                          │
│    │ garage_kept, not_crashed, is_imported       │                          │
│    │ ─────────── Ad Status ───────────           │                          │
│    │ status (ENUM: draft/active/sold/expired)    │                          │
│    │ views_count, click_count                    │                          │
│    │ is_top_ad, is_highlighted                   │                          │
│    │ published_at, expires_at, sold_at           │                          │
│    │ ─────────── Content ───────────             │                          │
│    │ photos_json, equipment_json (JSONB)         │                          │
│    │ description, location_city, location_district│                         │
│    └─────────────────────────────────────────────┘                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🆕 Missing Tables (Need to Create)

Based on the user flows above, we need these additional tables:

### 1. `saved_ads` (Favorites/Wishlist)

```sql
CREATE TABLE public.saved_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ad_id)  -- Prevent duplicates
);

ALTER TABLE public.saved_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved ads" 
ON public.saved_ads FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save ads" 
ON public.saved_ads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave ads" 
ON public.saved_ads FOR DELETE USING (auth.uid() = user_id);
```

### 2. `inquiries` (Contact Messages)

```sql
CREATE TABLE public.inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  phone TEXT,  -- Optional, if buyer provides
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
```

### 3. `search_alerts` (Optional - Email notifications for new listings)

```sql
CREATE TABLE public.search_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT,  -- "My SUV Search"
  filters_json JSONB NOT NULL,  -- Stored search criteria
  is_active BOOLEAN DEFAULT TRUE,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.search_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alerts" 
ON public.search_alerts FOR ALL USING (auth.uid() = user_id);
```

---

## ⚙️ Business Logic Rules

### Ad Lifecycle State Machine

```
                    ┌─────────────────────────────────┐
                    │                                 │
                    ▼                                 │
 ┌──────────┐    ┌────────┐    ┌────────┐         ┌──────┐
 │  DRAFT   │───▶│ ACTIVE │───▶│ EXPIRED│         │BANNED│
 │(not paid)│pay │(live)  │30d │        │         │      │
 └──────────┘    └────────┘    └────────┘         └──────┘
                    │  ▲                              ▲
                    │  │ prolong                      │
                    │  └──────┐                       │
                    │         │                       │
                    ▼         │                       │
              ┌──────────┐    │                       │
              │   SOLD   │────┴───────────────────────┘
              │ (4 days) │         admin action
              └──────────┘
```

### Key Rules:

| Rule | Logic | Database Operation |
|------|-------|-------------------|
| **Immediate Publishing** | After payment, ad goes live instantly | `UPDATE status='active', published_at=NOW()` |
| **30-Day Expiration** | Ads expire after 30 days | `expires_at = published_at + INTERVAL '30 days'` |
| **4-Day Sold Window** | Sold ads visible for 4 days with "Sold" badge | `WHERE status='sold' AND sold_at > NOW() - INTERVAL '4 days'` |
| **Top Ad Ordering** | Top ads shown first, then by published_at | `ORDER BY is_top_ad DESC, published_at DESC` |
| **Highlight Style** | Highlighted ads get gold border | `WHERE is_highlighted = true` → Apply CSS class |
| **VAT Display** | If `is_vat_deductible`, show net price | `price_eur / 1.23` for net calculation |
| **Photo Limits** | Basic: 10, Premium: 30 | Validate `jsonb_array_length(photos_json)` |

---

## 🔐 Row Level Security Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | Everyone | Own only | Own only | ❌ |
| `dealers` | Everyone | ❌ (admin) | Own only | ❌ |
| `ads` | Active/Sold only | Own only | Own only | Own only |
| `brands` | Everyone | ❌ (admin) | ❌ (admin) | ❌ |
| `models` | Everyone | ❌ (admin) | ❌ (admin) | ❌ |
| `credit_transactions` | Own dealer only | ❌ (system) | ❌ | ❌ |
| `saved_ads` | Own only | Own only | ❌ | Own only |
| `inquiries` | Sender OR Seller | Own only | Seller only | ❌ |


## 📱 API Endpoints Mapping

| Endpoint | Method | Auth | Tables | Description |
|----------|--------|------|--------|-------------|
| `/api/ads` | GET | ❌ | `ads`, `brands`, `models` | List active ads with filters |
| `/api/ads/[id]` | GET | ❌ | `ads` | Get single ad + increment views |
| `/api/ads` | POST | ✅ | `ads` | Create new ad (draft) |
| `/api/ads/[id]` | PATCH | ✅ | `ads` | Update own ad |
| `/api/ads/[id]/sold` | POST | ✅ | `ads` | Mark as sold |
| `/api/saved` | GET | ✅ | `saved_ads`, `ads` | Get user's favorites |
| `/api/saved/[adId]` | POST/DELETE | ✅ | `saved_ads` | Save/unsave ad |
| `/api/inquiries` | POST | ✅ | `inquiries` | Send message to seller |
| `/api/inquiries` | GET | ✅ | `inquiries` | Get received/sent messages |
| `/api/dealers/[slug]` | GET | ❌ | `dealers`, `ads` | Get dealer profile + their ads |
| `/api/credits/checkout` | POST | ✅ | Stripe | Buy credit pack |
| `/api/credits/balance` | GET | ✅ | `profiles` | Get current credit balance |
| `/api/cron/expire-ads` | POST | 🔒 Cron Secret | `ads` | Automated expiration (Vercel Cron) |
| `/api/cron/expire-premiums` | POST | 🔒 Cron Secret | `ads` | Expire Top/Highlight features |

---

## ⏰ Automated Cron Jobs (Expiration System)

> **Requirement:** We need automated tasks to expire ads and premium features.
> Using **Vercel Cron Jobs** (free tier includes cron) with a secret token for security.

### Cron Job Configuration (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-ads",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/expire-premiums",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/cleanup-sold",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### Cron Job Details

| Cron Job | Schedule | Logic | SQL Query |
|----------|----------|-------|-----------|
| **Expire Ads** | Every hour (`0 * * * *`) | Active ads past expiration → Expired | See below |
| **Expire Premiums** | Every hour (`0 * * * *`) | Top/Highlight features past expiration → Disabled | See below |
| **Cleanup Sold** | Daily at 6am (`0 6 * * *`) | Sold ads older than 4 days → Hidden | See below |

### SQL Operations

```sql
-- 1. EXPIRE ADS (every hour)
-- Move active ads past their expiration date to 'expired' status
UPDATE public.ads 
SET status = 'expired', 
    updated_at = NOW()
WHERE status = 'active' 
  AND expires_at < NOW();

-- 2. EXPIRE TOP ADS (every hour)  
-- Disable Top Ad feature when its duration expires
UPDATE public.ads 
SET is_top_ad = false,
    updated_at = NOW()
WHERE is_top_ad = true 
  AND top_expires_at < NOW();

-- 3. EXPIRE HIGHLIGHTS (every hour)
-- Disable Highlight feature when its duration expires
UPDATE public.ads 
SET is_highlighted = false,
    updated_at = NOW()
WHERE is_highlighted = true 
  AND highlight_expires_at < NOW();

-- 4. CLEANUP SOLD ADS (daily)
-- Hide sold ads that have been visible for more than 4 days
UPDATE public.ads 
SET status = 'expired',
    updated_at = NOW()
WHERE status = 'sold' 
  AND sold_at < NOW() - INTERVAL '4 days';
```

### API Route Implementation (`/api/cron/expire-ads`)

```typescript
// app/api/cron/expire-ads/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin operations
  );

  // Expire ads
  const { data: expiredAds, error: adsError } = await supabase
    .from('ads')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())
    .select('id');

  // Expire top ads
  const { data: expiredTop, error: topError } = await supabase
    .from('ads')
    .update({ is_top_ad: false, updated_at: new Date().toISOString() })
    .eq('is_top_ad', true)
    .lt('top_expires_at', new Date().toISOString())
    .select('id');

  // Expire highlights
  const { data: expiredHighlight, error: hlError } = await supabase
    .from('ads')
    .update({ is_highlighted: false, updated_at: new Date().toISOString() })
    .eq('is_highlighted', true)
    .lt('highlight_expires_at', new Date().toISOString())
    .select('id');

  return NextResponse.json({
    success: true,
    expired: {
      ads: expiredAds?.length || 0,
      topAds: expiredTop?.length || 0,
      highlights: expiredHighlight?.length || 0
    }
  });
}
```

### New Columns Needed in `ads` Table

```sql
-- Add expiration columns for premium features
ALTER TABLE public.ads ADD COLUMN top_expires_at TIMESTAMPTZ;
ALTER TABLE public.ads ADD COLUMN highlight_expires_at TIMESTAMPTZ;

-- Example: When user buys "Top Ad" for 7 days
UPDATE ads 
SET is_top_ad = true, 
    top_expires_at = NOW() + INTERVAL '7 days'
WHERE id = 'ad-uuid';
```

---

## 🗄️ Database Schema Updates Required

Based on this document, we need a new migration with:

### 1. Add `credit_balance` to `profiles` (unified credits)
```sql
ALTER TABLE public.profiles ADD COLUMN credit_balance INTEGER DEFAULT 0;
```

### 2. Update `credit_transactions` to reference `profiles` instead of `dealers`
```sql
ALTER TABLE public.credit_transactions ADD COLUMN user_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.credit_transactions ADD COLUMN action_type TEXT; -- 'top_up', 'publish', 'top_ad', etc.
ALTER TABLE public.credit_transactions ADD COLUMN ad_id UUID REFERENCES public.ads(id);
```

### 3. Add premium expiration columns to `ads`
```sql
ALTER TABLE public.ads ADD COLUMN top_expires_at TIMESTAMPTZ;
ALTER TABLE public.ads ADD COLUMN highlight_expires_at TIMESTAMPTZ;
```

### 4. Create `saved_ads` and `inquiries` tables (as documented above)

---

## 🎯 Next Steps

1. **Create new migration** with schema updates (credit_balance, expiration columns, saved_ads, inquiries)
2. **Push migration to Supabase**
3. **Implement Auth flow** (Supabase Auth UI or custom)
4. **Create Vercel Cron Jobs** for automatic expiration
5. **Build Search Page** with filters
6. **Create Ad Wizard** (5-step form)
7. **Integrate Stripe** for credit purchases

---

*Last Updated: January 4, 2026*
