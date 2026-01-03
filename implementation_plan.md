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
| **Dealer Model** | **Credit System** | We pivot back to **Credits (Wallet)**. Subscriptions are too rigid for dealers with fluctuating stock. Credits allow flexible "Bulk Prolonging" and "Pay-as-you-go" control. |
| **Sold Ads** | **4-Day Rule** | Sold ads stay visible for **4 days** (greyed out) to create "FOMO" (Fear Of Missing Out) and show site activity. 7 days was too long. |
| **Privacy** | **User-Led** | We do **not** auto-blur license plates (complex/costly). Users must edit photos themselves before uploading. |
| **SEO Strategy** | **Intent-Based** | We target "Long-tail" keywords (e.g., *"Lacná Škoda Octavia Žilina"*) programmatically, rather than fighting for generic *"Autobazar"* terms we can't win. |

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
- **Pricing:**
    - **Basic Ad (Private):** ~0.99€ - 1.99€ (Cheaper than competition start).
    - **Topovanie (Top):** Moves ad to #1 position group.
        - *Fairness Logic:* If bought mid-cycle (e.g., Day 20), it extends the *total* duration by 30 days immediately.
    - **Zvýraznenie (Highlight):** "Gold" border + bigger photos. Applies on top of Basic or Top status.
- **Payment Flow:**
    - **B2C (Private Sellers):** Direct Stripe Checkout (Single Payment).
    - **B2B (Dealers):** **Credit Wallet System**.
        - Dealers buy **Credit Packs** (e.g., 50 Credits, 100 Credits).
        - Actions (Publish, Prolong, Top) deduct credits from their Wallet.
        - Allows "Bulk Prolong" actions.
- **23% VAT Logic (Critical for 2026):**
    - Standard SK VAT is **23%**.
    - If `is_vat_deductible` is TRUE -> Show **Gross Price** big, and **(Net Price bez DPH)** small/grey below it.

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
- **Dealer Profiles:**
    - URL: `autobazar123.sk/predajca/[slug]`.
    - Content: Logo, Address, Website, Simple Grid of Ads.

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
- [ ] **Database Schema (Supabase):**
    - Tables: `users`, `cars`, `dealers`, `credits_ledger`, `credit_packages`.
    - RLS Policies: "Only seller can edit their ad."
- [ ] **Auth Setup:** Supabase Auth (Email + Phone number field).

### Phase 2: Core Data Engine
- [ ] **Vehicle Database:** Research & Import External DB (Brands/Models).
- [ ] **VAT Engine:** Global config `VAT_RATE = 0.23`.
- [ ] **Data Validation:** Zod schemas for all forms.

### Phase 3: Premium UI/UX
- [ ] **Landing Page:** Hero + Lifestyle Grid + Sold Feed.
- [ ] **Search Page:** "Smart" filters + AI Equipment Search.
- [ ] **Detail Page:** STK Badges + Leasing Calc + Contract Generator.

### Phase 4: Publishing & Monetization
- [ ] **Ad Wizard:** 5-Step Flow.
- [ ] **Stripe Integration:** Checkout sessions + B2B Credit Packages.
- [ ] **Dealer Dashboard:** Credit Wallet, Transaction History, Bulk Prolong.

### Phase 5: Admin & Legal
- [ ] **Admin Panel:**
    - **Bulk Action:** Moderation grid (50 photos).
    - **Revenue Audit:** Stripe + Credit Consumption.
- [ ] **Legal:** Cookie Banner (Strict), ToS Page, Privacy Policy.

### Phase 6: Testing & Launch
- [ ] **Puppeteer Suite:** Automated navigation & error checking.
- [ ] **SEO:** Programmatic pages (`/skoda/octavia/zilina`).
- [ ] **Performance:** Cloudflare Image Optimization.
