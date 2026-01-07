# 📖 Autobazar123 Project Bible & Master Plan

> **CRITICAL CONTEXT FOR AI AGENTS:** This document constitutes the "Brain" of the project. It contains strict decisions made by the CEO (User) and the CTO (Assistant). **Do not deviate** from these specifications without strict permission. New chats usually lack context—READ THIS FIRST.

---

## 1. 💎 Project Identity & "The Vibe"
- **Name:** Autobazar123
- **Core Philosophy:** "The Apple of Car Classifieds."
    - **Visuals:** Massive usage of white space, subtle gray borders (`#e5e7eb`), high-end typography (Inter/San Francisco), minimal shadows. **NO** clutter.
    - **Tone:** **Professional, Corporate, Trustworthy (Option A).** We sound like a bank, not a buddy. This builds trust for high-value transactions.
- **Competitor Target:** We are building a *premium* alternative to `Autobazar.eu`. We don't copy their design (which is outdated); we copy their **data structure** but present it like **Airbnb**.

---

## 2. 🧠 Strategic Decision Log (The "Why")
*This section prevents future changes to core decisions.*

| Decision | Verdict | Rationale (The "Why") |
| :--- | :--- | :--- |
| **Publishing Speed** | **Immediate** | Speed is our wedge against competitors. We accept the risk vs Premium feel and mitigate it with AI moderation + Community Reporting using "Report Ad" buttons. |
| **Reviews** | **REJECTED** | Public reviews on sellers lead to "Review Wars" and sabotage by competitors. We rely on **Verified Identity** badges instead. |
| **Data Source** | **External DB** | **No scraping competitors.** We will actively search for open-source or paid car databases (trims/specs) to avoid manual entry hell. |
| **Payments** | **Stripe First** | We start with Stripe for speed. **Only after hitting ~5k€/mo revenue** do we consider switching to local providers (TrustPay) to save fees. |
| **Credit System** | **Unified for All** | ✅ *Updated Jan 4*: Both private sellers AND dealers use the **same credit wallet** (`profiles.credit_balance`). Dealers get extra features (public page, bulk ops). Simplifies codebase. |
| **Credit Pricing** | **1 Credit = 1€** | Clean mental model. Rounded prices. Packs offer bulk discounts (5cr/€5, 25cr/€20). See Monetization section. |
| **Credit Refunds** | **Non-refundable** | Credits are non-refundable once spent. If user marks car as SOLD, auto-prolong stops immediately (no future deductions). Industry standard. |
| **First Ad Free** | **REJECTED** | Private sellers sell 1 car every 5-10 years. We need to monetize that single transaction. No freebies. |
| **Sold Ads** | **4-Day Rule** | Sold ads stay visible for **4 days** (greyed out) to create "FOMO" (Fear Of Missing Out) and show site activity. |
| **Privacy** | **User-Led** | We do **not** auto-blur license plates (complex/costly). Users must edit photos themselves before uploading. |
| **SEO Strategy** | **Intent-Based** | We target "Long-tail" keywords (e.g., *"Lacná Škoda Octavia Žilina"*) programmatically. |
| **Expiration System** | **Vercel Cron** | ✅ *Added Jan 4*: Automated hourly cron jobs expire ads/premiums. No manual intervention needed. |
| **VIN Decoder** | **Planned** | VINdecoder.eu API integration. Auto-fill brand, model, year from VIN. Reduces form friction. |

---

## 3. 🔐 Security & Tech Stack (Non-Negotiable)
- **Framework:** Next.js (App Router), TailwindCSS (v4), TypeScript.
- **Hosting:** **Vercel** (UI) + **Supabase** (DB) + **GitHub** (Repo). This stack scales to millions of users.
- **Database:** Supabase (PostgreSQL).
    - **Security:** "Unhackable" standard. Strict Row Level Security (RLS).
    - **Validation:** All inputs must be sanitized via **Zod** (prevent SQLi/XSS).
- **Images:** **Cloudflare Images** (Pro Plan $5/mo).
    - **Reasoning:** Essential for hitting the **4x100 PageSpeed** target via auto-WebP/AVIF conversion.
- **Testing:** **Puppeteer** must be used to scan for console errors and visual bugs (Testing ONLY, no scraping).

---

## 4. 🧠 Detailed Feature Specifications

### A. The "Smart" Database Logic
- **Car Schema:**
    - Must use **Enums** for: Fuel, Gearbox, Body Type.
    - **Smart Dependency:** Selecting "Electric" hides irrelevant filters (Clutch/Manual Gearbox).
    - **Slovak Filters (Trust Signals - CRITICAL):**
        - `is_bought_in_sk` (Kúpené v SR)
        - `is_vat_deductible` (Možný odpočet DPH)
        - `has_service_book` (Servisná knižka)
        - `full_service_history` (Úplná servisná história)
        - `originality_check` (KO - Kontrola originality)
        - `warranty` (V záruke) + Expiration Date logic.
        - `garage_kept` (Garážované)
        - `not_crashed` (Nehavarované)
        - `is_imported` (Dovoz) -> Triggers "Registration Calcluator".
- **Visual Badges (Logic):**
    - **STK/EK:**
        - 🟢 **Green:** Valid > 18 months.
        - 🟡 **Yellow:** Valid 6-18 months.
        - 🔴 **Red:** Expiring < 3 months.

### B. Monetization & Pricing (The "Disruptor" Model)

#### Credit Packs (1 Credit = 1€)
| Pack Name | Credits | Price | Discount |
|-----------|---------|-------|----------|
| Štart | 5 | €5 | 0% |
| Základ | 10 | €9 | 10% |
| Predajca | 25 | €20 | 20% ⭐ |
| Profi | 50 | €35 | 30% |
| Dealer | 100 | €60 | 40% |

#### Action Costs
| Action | Credits | Duration |
|--------|---------|----------|
| Publish Ad | 1 | 30 days |
| Prolong Ad | 1 | +30 days |
| Top Ad (Topovanie) | 3 | 7 days |
| Highlight (Zvýraznenie) | 2 | 7 days |
| Bump to Top | 1 | Instant |

- **Top Ad:** Moves to #1 position group. Gold border.
- **Highlight:** Bigger thumbnail, golden glow effect.
- **Bump:** Resets `published_at` to NOW() (appears as fresh listing).
- **Auto-Prolong:** Toggle per ad. Auto-deducts 1 credit when expiring (if balance > 0). Stops on SOLD.

#### Dealer-Only Perks
- Bulk Prolong (10 ads) = 8 credits (20% off)
- Bulk Top (5 ads) = 12 credits (20% off)
- Public storefront at `/predajca/[slug]`
- Verified Dealer badge

#### 23% VAT Logic (Critical for 2026)
- Standard SK VAT is **23%**.
- If `is_vat_deductible` is TRUE → Show **Gross Price** big, and **(Net Price bez DPH)** small/grey below it.

### C. UX/UI "Special Features"
- **Landing Page:**
    - **Lifestyle Categories:** Icons for City, Family, SUV, Luxury, Electric (Replaces standard body types).
    - **Recently Sold Feed:**
        - Logic: User marks as sold -> Popup "Why?" -> "Sold" -> Moves to Feed with badge: *"Toto auto si už našlo nového majiteľa na Autobazar123"*.
- **Search Filters:**
    - **AI Equipment Search:** User types "LED" -> System highlights "Matrix LED", "LED Fog lights" checkboxes automatically.
- **Listing Tooling:**
    - **Comparison:** Side-by-side view (Heart icon).
    - **Leasing Calculator:**
        - Sliders: Down Payment (%), Term (Months), **Interest Rate (% p.a.)**.
        - Disclaimer: "Informačný výpočet".
    - **Contract Generator:** "Stiahnuť Kúpno-predajnú zmluvu" button (Free PDF generation).
    - **Price Drop Alerts:** If seller lowers price, notify users who saved the ad. Drives engagement.
- **Dealer Profiles:**
    - URL: `autobazar123.sk/predajca/[slug]`.
    - Content: Logo, Address, Website, Simple Grid of Ads.
- **Seller Insights Dashboard (FREE for all):**
    - Views, Clicks, Saves, Inquiries per ad.
    - Comparison to similar listings (benchmark).
    - "Your ad is in top 20% for this model!" type messaging.
- **Notifications (Email):**
    - **Expiring Soon:** 3 days before ad expires -> "Predĺžte za 1 kredit!"
    - **New Inquiry:** Instant email when buyer contacts.
    - **Price Drop:** Users notified when saved ads become cheaper.

### D. Ad Creation Wizard (The "Game" Flow)
- **Structure:** 5 Steps to prevent fatigue.
    1. **Category:** Big icons (Personal, Commercial, Moto).
    2. **Vehicle Data:** Brand/Model selectors.
    3. **Equipment:** Searchable list + "Select All" groups (Safety/Comfort).
    4. **Photos:**
        - **Limits:** 10 (Basic) vs 30 (Top/Premium).
        - **Validation:** Check file size/type.
    5. **Monetization/Posting:** Preview Card (Draft Mode) -> Pay.

---

## 5. 📝 Roadmap & Checklist

### Phase 1: The Invisible Foundation
- [x] **Project Initialization:** Next.js + Tailwind + Typescript + ESLint.
- [x] **Infrastructure:** GitHub Repo (kyranxx/autobazar123) + Vercel Deployment (Live).
- [x] **Database Schema v1 (Supabase):**
    - *Status:* ✅ Complete (Jan 4, 2026)
    - *Project:* `vxwbbzjlctjpzivfkdou` (linked via CLI)
    - *Tables Created:* `profiles`, `dealers`, `credit_transactions`, `brands`, `models`, `ads`
    - *Seed Data:* 20 popular car brands + models (Škoda, VW, BMW, Audi, etc.)
    - *RLS Policies:* All implemented (seller-only edit, public read for active ads)
- [x] **Database Schema v2 (Unified Credits):**
    - *Status:* ✅ Complete (Jan 4, 2026)
    - *New Tables:* `saved_ads`, `inquiries`, `credit_packages`
    - *New Columns:* `profiles.credit_balance`, `ads.top_expires_at`, `ads.highlight_expires_at`
    - *Indexes:* Performance indexes on status, expires_at, seller_id, brand_id
- [x] **Auth Setup (Supabase Auth):**
    - *Status:* ✅ Complete (Jan 4, 2026)
    - *Pages:* `/auth/login`, `/auth/register`, `/auth/callback`
    - *Features:* Email/Password, Google OAuth, Facebook OAuth, Password Reset
    - *Context:* `AuthContext` with user + profile + credit_balance
    - *Navbar:* Shows login/register or user dropdown with credits
    - *Slovak UI:* All auth pages in Slovak

### Phase 2: Core Data Engine
- [x] **Vehicle Database:** 20 brands + 27 models seeded. More to be imported.
- [x] **VAT Engine:** Global config `VAT_RATE = 0.23`.
    - *Status:* ✅ Complete (Jan 6, 2026)
    - *Location:* `src/config/vat.ts`, `src/config/credits.ts`
    - *Features:* VAT calculations (gross/net), currency formatting, credit pack configs
- [x] **Data Validation:** Zod schemas for all forms.
    - *Status:* ✅ Complete (Jan 6, 2026)
    - *Location:* `src/schemas/index.ts`, `src/types/database.ts`
    - *Schemas:* Ads (5-step wizard), Profiles, Dealers, Auth, Inquiries, Search filters, Credit transactions
    - *Features:* Slovak error messages, XSS sanitization, UUID/phone/email validation

### Phase 3: Premium UI/UX
- [x] **Landing Page:** Hero + Lifestyle Grid + Sold Feed.
    - *Status:* ✅ Complete
    - *Components Built:* Navbar, SearchBar, LifestyleCategories, FeaturedCars, RecentlySoldFeed, Footer
    - *Features:* Apple-style design, Inter font, gradient hero, trust signals, animations
- [x] **Search Page:** "Smart" filters + AI Equipment Search.
    - *Status:* ✅ Complete (Jan 6, 2026)
    - *Route:* `/auta`
    - *Components:* FilterSidebar, CarCard, SearchPageClient
    - *Features:* 
        - Brand/model dependent dropdown filters
        - Price, year, mileage range selectors
        - Fuel, transmission, body type chip selectors
        - Trust signal checkboxes (Kúpené v SR, Servisná knižka, Nehavarované)
        - Mobile slide-out filter panel
        - Grid/list view toggle
        - Sorting (newest, price, mileage, year) - TOP ads always first
        - Save/favorite functionality
        - Pagination UI
- [x] **Detail Page:** STK Badges + Leasing Calc + Contract Generator.
    - *Status:* ✅ Complete (Jan 6, 2026)
    - *Route:* `/auto/[id]`
    - *Components:* CarDetailClient, LeasingCalculator
    - *Features:*
        - Image gallery with thumbnails and navigation
        - STK/EK badges (🟢 green >18mo, 🟡 yellow 6-18mo, 🔴 red <6mo)
        - Technical specs grid
        - Trust signals section
        - Equipment tags
        - Leasing calculator (down payment, term, interest rate sliders)
        - Contact form with phone reveal
        - Seller info with verified badge
        - Contract generator button (PDF)
        - Share and save buttons
        - VAT price display for deductible vehicles

### Phase 4: Publishing & Monetization
- [x] **Ad Wizard:** 5-Step Flow.
    - *Status:* ✅ Complete (Jan 7, 2026)
    - *Route:* `/pridat-inzerat`
    - *Components:* AdWizardClient with Step1-5 components
    - *Features:*
        - Step 1: Category selection (Personal, Commercial, Moto)
        - Step 2: Vehicle data (brand/model dependency, VIN input)
        - Step 3: Technical specs (smart hiding for electric vehicles)
        - Step 4: Trust signals checkboxes, STK date, location, description
        - Step 5: Photo upload with preview, equipment tags, pricing summary
        - Progress indicator, form validation, auth protection
- [ ] **Stripe Integration:** Checkout sessions for credit packs.
- [x] **User Dashboard:** Credit Wallet, Transaction History, My Ads.
    - *Status:* ✅ Complete (Jan 7, 2026)
    - *Route:* `/moj-ucet`
    - *Features:*
        - Stats cards (credits, active ads, views, inquiries)
        - My Ads tab (status badges, expiry countdown, actions)
        - Credits tab (credit packs, action costs, transaction history)
        - Saved/Messages tabs (placeholders)
        - Settings tab (profile edit, sign out)
- [x] **Stripe Integration:** Checkout sessions for credit packs.
    - *Status:* ✅ Complete (Jan 7, 2026)
    - *Routes:* `/api/stripe/checkout`, `/api/stripe/webhook`
    - *Features:*
        - Checkout session creation with credit pack metadata
        - Webhook handler for checkout.session.completed
        - Credit balance update and transaction recording
        - Credits page at `/kredity` with pack selection and FAQ
        - Success page at `/kredity/uspech`
- [x] **Dealer Dashboard:** Bulk Prolong, Public Storefront.
    - *Status:* ✅ Complete (Jan 7, 2026)
    - *Route:* `/dealer`
    - *Features:*
        - Multi-select ads with checkboxes
        - Bulk actions (prolong, top, highlight, bump)
        - Tier-based dealer discounts (5-9: 10%, 10-24: 15%, 25-49: 20%, 50+: 25%)
        - Storefront preview tab
        - Analytics tab (views, inquiries, conversion rate)
        - Settings tab (business info edit)

### Phase 5: Automation & Cron Jobs
- [x] **Vercel Cron Jobs:**
    - *Status:* ✅ Complete (Jan 7, 2026)
    - `/api/cron/expire-ads` — Hourly, expires active ads past 30 days
    - `/api/cron/expire-premiums` — Hourly, disables Top/Highlight after 7 days
    - `/api/cron/cleanup-sold` — Daily 6am, hides sold ads after 4 days
    - *Config:* `vercel.json` with cron schedules
- [x] **Email Notifications:**
    - *Status:* ✅ Complete (Jan 7, 2026)
    - *File:* `src/lib/email.ts`
    - *Templates:* New inquiry, Ad expiring soon, Credit low, Price drop alert
    - *Provider:* Resend.com API ready

### Additional Features Implemented (Jan 7, 2026)
- [x] **VIN Decoder:** `src/lib/vin-decoder.ts`
    - Local WMI code lookup for 20+ brands
    - Year extraction from VIN position 10
    - Validation and formatting
- [x] **Comparison Tool:** `src/components/Comparison.tsx`
    - Side-by-side specs comparison (up to 3 cars)
    - Floating button and modal
    - localStorage persistence
- [x] **Dealer Public Storefront:** `/predajca/[slug]`
    - Dealer info header with verified badge
    - Contact card with address, phone, hours
    - Car grid with TOP/Highlight badges
- [x] **Saved Ads Tab:** Functional in user dashboard
    - Car cards with unsave button
    - Price drop badges
    - Notification toggle
- [x] **Messages Tab:** Functional in user dashboard
    - Conversation list with unread counts
    - Message thread view
    - Reply functionality
- [x] **Price Drop Alerts:** Email template ready

### Phase 6: Admin & Legal
- [x] **Admin Panel:**
    - *Status:* ✅ Complete (Jan 7, 2026)
    - *Route:* `/admin`
    - *Features:*
        - Overview tab with quick stats and activity feed
        - Moderation tab with bulk approve/reject
        - Users tab with search and user table
        - Revenue tab with daily/weekly/monthly stats
        - Settings tab for maintenance mode and auto-moderation
- [x] **Legal:**
    - *Status:* ✅ Complete (Jan 7, 2026)
    - *Routes:*
        - `/obchodne-podmienky` - Terms of Service
        - `/ochrana-udajov` - Privacy Policy (GDPR compliant)
    - *Cookie Banner:* Component added to root layout with:
        - Necessary cookies (always on)
        - Analytics cookies (optional)
        - Marketing cookies (optional)
        - Settings panel with granular control

### Phase 7: Testing & Launch
- [x] **Puppeteer Suite:** Automated navigation & error checking.
    - *Status:* ✅ Complete (Jan 7, 2026)
    - *File:* `tests/e2e.test.ts`
    - *Tests:*
        - Homepage loads correctly
        - Cars listing page
        - Login/Register pages
        - Credits page
        - Terms & Privacy pages
        - Navigation works
        - Cookie banner
        - No console errors
        - Performance (LCP measurement)
    - *Run:* `npm run test:e2e`
- [x] **SEO:** Programmatic pages.
    - *Status:* ✅ Complete (Jan 7, 2026)
    - *Routes:*
        - `/[brand]` - Brand pages (9 brands)
        - `/[brand]/[model]` - Brand + Model pages (70+ combinations)
        - `/[brand]/[model]/[city]` - Ultra-local pages (top combinations)
    - *Examples:* `/skoda/octavia`, `/skoda/octavia/zilina`
    - *Features:* Static generation, SEO metadata, breadcrumbs, related links
    - *Sitemap:* Updated with all programmatic pages
- [ ] **Performance:** Cloudflare Image Optimization.

### 🎉 LAUNCH READY
All core features implemented. Remaining items:
- Configure production environment variables (Stripe, Supabase)
- Set up Cloudflare for CDN and image optimization
- Connect custom domain
- Monitor with Vercel Analytics
