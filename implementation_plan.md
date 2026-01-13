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
| **Credit System** | **Unified for All** | Both private sellers AND dealers use the **same credit wallet** (`profiles.credit_balance`). Dealers get extra features (public page, bulk ops). Simplifies codebase. |
| **Credit Pricing** | **1 Credit = 1€** | Clean mental model. Rounded prices. Packs offer bulk discounts (5cr/€5, 25cr/€20). See Monetization section. |
| **Credit Refunds** | **Non-refundable** | Credits are non-refundable once spent. If user marks car as SOLD, auto-prolong stops immediately (no future deductions). Industry standard. |
| **First Ad Free** | **REJECTED** | Private sellers sell 1 car every 5-10 years. We need to monetize that single transaction. No freebies. |
| **Sold Ads** | **4-Day Rule** | Sold ads stay visible for **4 days** (greyed out) to create "FOMO" (Fear Of Missing Out) and show site activity. |
| **Privacy** | **User-Led** | We do **not** auto-blur license plates (complex/costly). Users must edit photos themselves before uploading. |
| **SEO Strategy** | **Intent-Based** | We target "Long-tail" keywords (e.g., *"Lacná Škoda Octavia Žilina"*) programmatically. |
| **Expiration System** | **Vercel Cron** | Automated hourly cron jobs expire ads/premiums. No manual intervention needed. |
| **VIN Decoder** | **VINdecoder.eu** | API integration. Auto-fill brand, model, year from VIN. Reduces form friction. |
| **Search Service** | **Algolia or Typesense** | *Added Jan 13, 2026*: Instant search with typo tolerance, AI ranking. Premium UX upgrade. |
| **Maps** | **OpenStreetMap** | *Added Jan 13, 2026*: Free, sufficient for car location display. No Google Maps needed. |
| **Analytics** | **Microsoft Clarity** | *Added Jan 13, 2026*: Free heatmaps & session recordings. Replaces Hotjar. |
| **Push Notifications** | **REJECTED** | *Added Jan 13, 2026*: Browser notifications have low adoption. Email via Resend is sufficient for car classifieds. |
| **Phone/ID Verification** | **REJECTED** | *Added Jan 13, 2026*: Overkill for car classifieds. Email verification is sufficient. |
| **AI Ad Writing** | **REJECTED** | *Added Jan 13, 2026*: Users should write truth themselves. May add AI price suggestion later. |
| **Watermarking** | **REJECTED** | *Added Jan 13, 2026*: Not industry standard for car ads. Skip. |

---

## 3. 🔐 Security & Tech Stack (Non-Negotiable)
- **Framework:** Next.js (App Router), TailwindCSS (v4), TypeScript.
- **Hosting:** **Vercel** (UI) + **Supabase** (DB) + **GitHub** (Repo). This stack scales to millions of users.
- **Database:** Supabase (PostgreSQL).
    - **Security:** "Unhackable" standard. Strict Row Level Security (RLS).
    - **Validation:** All inputs must be sanitized via **Zod** (prevent SQLi/XSS).
- **Images:** **Cloudflare Images** (Pro Plan €5/mo).
    - **Reasoning:** Essential for hitting the **4x100 PageSpeed** target via auto-WebP/AVIF conversion.
- **Search:** **Algolia** or **Typesense** (~€10-50/mo).
    - **Reasoning:** Instant search, typo tolerance, AI ranking for premium UX.
- **Testing:** **Puppeteer** for E2E tests, **OWASP ZAP** for security scans.

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
        - `is_imported` (Dovoz) -> Triggers "Registration Calculator".
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
    - **Instant Search:** Algolia/Typesense for typo-tolerant, instant results.
    - **AI Equipment Search:** User types "LED" -> System highlights "Matrix LED", "LED Fog lights" checkboxes automatically.
- **Listing Tooling:**
    - **Comparison:** Side-by-side view (Heart icon).
    - **Leasing Calculator:**
        - Sliders: Down Payment (%), Term (Months), **Interest Rate (% p.a.)**.
        - Disclaimer: "Informačný výpočet".
    - **Contract Generator:** "Stiahnuť Kúpno-predajnú zmluvu" button (Free PDF generation).
    - **Price Drop Alerts:** If seller lowers price, notify users who saved the ad. Drives engagement.
    - **Map View:** OpenStreetMap + Leaflet.js for car location.
- **Dealer Profiles:**
    - URL: `autobazar123.sk/predajca/[slug]`.
    - Content: Logo, Address, Website, Simple Grid of Ads.
- **Seller Insights Dashboard (FREE for all):**
    - Views, Clicks, Saves, Inquiries per ad.
    - Comparison to similar listings (benchmark).
    - "Your ad is in top 20% for this model!" type messaging.
- **Notifications (Email + Push):**
    - **Expiring Soon:** 3 days before ad expires -> "Predĺžte za 1 kredit!"
    - **New Inquiry:** Instant email when buyer contacts.
    - **Price Drop:** Users notified when saved ads become cheaper.
    - **Email Notifications:** Via Resend (new inquiry, expiring soon, price drop).

### D. Ad Creation Wizard (The "Game" Flow)
- **Structure:** 5 Steps to prevent fatigue.
    1. **Category:** Big icons (Personal, Commercial, Moto).
    2. **Vehicle Data:** Brand/Model selectors + VIN decoder (VINdecoder.eu).
    3. **Equipment:** Searchable list + "Select All" groups (Safety/Comfort).
    4. **Photos:**
        - **Limits:** 10 (Basic) vs 30 (Top/Premium).
        - **Validation:** Check file size/type.
        - **Upload:** Cloudflare Images direct upload.
    5. **Monetization/Posting:** Preview Card (Draft Mode) -> Pay.

---

## 5. 🛠️ External Services & Integrations

### Current Services (Already Using)
| Service | Purpose | Cost | Status |
|---------|---------|------|--------|
| **Vercel** | Hosting, serverless | Free tier | ✅ Active |
| **Supabase** | Database, Auth, Realtime | Free tier | ✅ Active |
| **Cloudflare Images** | Image hosting, optimization | €5/mo | ✅ Active |
| **Stripe** | Payments | 2.9% + €0.25/tx | ✅ Active |
| **Resend** | Transactional emails | Free tier | ✅ Active |
| **GitHub** | Version control | Free | ✅ Active |

### Planned Services (To Implement)
| Service | Purpose | Cost | Priority |
|---------|---------|------|----------|
| **Algolia or Typesense** | Instant search | €10-50/mo | 🔴 High |
| **VINdecoder.eu** | VIN lookup | €0.10-0.50/check | 🔴 High |
| **Microsoft Clarity** | Heatmaps, recordings | **Free** | 🔴 High |

| **OpenStreetMap + Leaflet** | Maps | **Free** | 🟡 Medium |

### Rejected Services (With Reasoning)
| Service | Why Rejected |
|---------|--------------|
| Google Maps | OpenStreetMap is sufficient and free |
| Hotjar | Microsoft Clarity is same features, free |
| Twilio (Phone verification) | Email verification enough for classifieds |
| Veriff/Jumio (ID verification) | Overkill, adds friction |
| OpenAI (AI ad writing) | Users should write truth themselves |
| Image watermarking | Not industry standard for car ads |
| OneSignal (Push notifications) | Low adoption rate, email notifications sufficient |

---

## 6. 📝 Roadmap & Remaining Tasks

### ✅ COMPLETED (Phases 1-6)
All core features have been implemented:
- ✅ Project setup (Next.js, Tailwind, TypeScript)
- ✅ Database schema (Supabase with RLS)
- ✅ Auth (Email, Google, Facebook OAuth)
- ✅ Landing page (Hero, Lifestyle Grid, Sold Feed)
- ✅ Search page with filters
- ✅ Car detail page (STK badges, Leasing calc, Contract generator)
- ✅ Ad wizard (5-step flow)
- ✅ User dashboard (Credits, My Ads, Saved, Messages)
- ✅ Dealer dashboard (Bulk actions, Storefront)
- ✅ Stripe integration (Credit packs, Webhooks)
- ✅ Cron jobs (Ad expiration, Premium expiration)
- ✅ Email notifications (Resend integration)
- ✅ Admin panel (Moderation, Users, Revenue)
- ✅ Legal pages (Terms, Privacy, Cookie banner)
- ✅ SEO (Programmatic pages, Sitemap)
- ✅ i18n (Slovak, English, Hungarian)
- ✅ E2E tests (Puppeteer)
---

### 🎯 TOP 10 PRIORITY TASKS (Updated Jan 13, 2026)

| # | Task | Status | Time | Notes |
|---|------|--------|------|-------|
| 1 | npm audit | ✅ Done | - | 0 vulnerabilities |
| 2 | Security Headers | ✅ Done | - | 7 headers added to next.config.ts |
| 3 | Microsoft Clarity | ✅ Done | - | Script added, needs CLARITY_ID |
| 4 | **Stripe Webhook** | 🔴 TODO | 30 min | Configure in Stripe Dashboard |
| 5 | **Cloudflare Images** | 🔴 TODO | 1-2 hrs | Fix upload 500 error |
| 6 | **Configure DNS** | 🟡 User | 30 min | Point autobazar123.sk to Vercel |
| 7 | **OWASP ZAP Scan** | 🔴 TODO | 1 hr | Run vulnerability scan |
| 8 | SSL Labs Test | 🟢 Easy | 5 min | Verify A+ rating |
| 9 | **Algolia Integration** | 🟡 TODO | 3-4 hrs | Decision: Algolia ✅ |
| 10 | **VIN Decoder** | 🟡 TODO | 1-2 hrs | VINdecoder.eu integration |

**Legend:** 🔴 Critical | 🟡 Important | 🟢 Nice to have | ✅ Complete

---

### 🔴 Phase 7: Pre-Launch Essentials

#### 7.1 Search Service Integration (Algolia Chosen ✅)
- [x] **Choose provider:** Algolia ✅ (Jan 13, 2026)
- [ ] **Implement search index:** Sync ads to search service
- [ ] **Build instant search UI:** Autocomplete, typo tolerance
- [ ] **Add faceted filters:** Price, year, fuel via search API
- [ ] **Test performance:** <100ms response time

#### 7.2 VIN Decoder Integration
- [ ] **Sign up:** VINdecoder.eu API account
- [ ] **Build API route:** `/api/vin/decode`
- [ ] **Integrate in wizard:** Auto-fill brand, model, year from VIN
- [ ] **Error handling:** Invalid VIN, unknown VIN
- [ ] **Cost tracking:** Monitor API usage

#### 7.3 Analytics Setup
- [x] **Microsoft Clarity:** Script added ✅ (Jan 13, 2026) — Set `NEXT_PUBLIC_CLARITY_ID` in env
- [x] **Vercel Analytics:** Enabled (built-in)
- [ ] **Custom events:** Track key actions (search, save, contact)

#### 7.4 Production Configuration
- [x] **Domain:** `autobazar123.sk` purchased ✅ (Jan 13, 2026)
- [ ] **DNS:** Configure in Cloudflare
- [ ] **Environment variables:** Set production values
- [ ] **Stripe webhook:** Configure production endpoint
- [ ] **Supabase:** Update redirect URLs to production domain
- [ ] **Cloudflare Images:** Verify delivery domain

---

### 🔴 Phase 8: Security Testing (PRE-LAUNCH CRITICAL)

#### 8.1 Automated Security Scans
| Tool | Purpose | Cost | Priority |
|------|---------|------|----------|
| **OWASP ZAP** | Web app vulnerability scan | Free | 🔴 Must |
| **npm audit** | Dependency vulnerabilities | Free | ✅ Done (0 vulnerabilities) |
| **Snyk** | Deep dependency scan | Free tier | 🔴 Must |
| **SSL Labs** | SSL/TLS configuration | Free | 🔴 Must |
| **Security Headers** | HTTP security headers | Free | ✅ Done (added to next.config.ts) |

#### 8.2 Security Checklist
- [ ] **OWASP ZAP scan:** Run full spider + active scan
    - Test for: XSS, SQL injection, CSRF, broken auth
    - Fix all HIGH and MEDIUM findings
- [ ] **npm audit:** `npm audit --audit-level=high`
    - Fix or justify all vulnerabilities
- [ ] **Snyk scan:** `npx snyk test`
    - Deep scan of dependencies
- [ ] **SSL Labs test:** https://www.ssllabs.com/ssltest/
    - Target: A+ rating
- [ ] **Security Headers:** https://securityheaders.com/
    - Target: A rating
    - Headers to add: CSP, X-Frame-Options, X-Content-Type-Options, etc.

#### 8.3 Manual Security Review
- [ ] **RLS policies:** Verify all Supabase tables have proper RLS
- [ ] **API routes:** Check authentication on all protected routes
- [ ] **Input validation:** Confirm Zod validation on all forms
- [ ] **CSRF protection:** Verify tokens on state-changing actions
- [ ] **Rate limiting:** Confirm rate limits on sensitive endpoints
- [ ] **File upload:** Verify size limits and type restrictions
- [ ] **Admin access:** Confirm admin routes are protected

#### 8.4 GDPR Compliance
- [ ] **Cookie consent:** Working cookie banner
- [ ] **Privacy policy:** Complete and accessible
- [ ] **Data deletion:** User can delete account and data
- [ ] **Data export:** User can export their data
- [ ] **Consent records:** Store proof of consent

---

### 🟡 Phase 9: Post-Launch Enhancements

#### 9.1 Push Notifications (OneSignal)
- [ ] **Setup:** OneSignal account + SDK integration
- [ ] **Permission prompt:** Slovak-friendly prompt
- [ ] **Notification types:**
    - New message from buyer
    - Price drop on saved car
    - Ad expiring soon
    - New car matching saved search

#### 9.2 Maps Integration
- [ ] **Leaflet.js:** Add to car detail page
- [ ] **OpenStreetMap tiles:** Configure provider
- [ ] **Car location pin:** Show on map
- [ ] **Directions link:** "Zobraziť cestu" external link

#### 9.3 Enhanced Analytics
- [ ] **Conversion funnels:** Track wizard completion
- [ ] **Search analytics:** What do users search for?
- [ ] **A/B testing:** Test pricing, layouts

#### 9.4 Performance Optimization
- [ ] **Lighthouse audit:** Target 90+ on all metrics
- [ ] **Core Web Vitals:** LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] **Image optimization:** Verify Cloudflare Images working
- [ ] **Bundle size:** Analyze and reduce

---

## 7. 🔒 Security Testing Tools Guide

### OWASP ZAP (Recommended - Free)
```bash
# Install via Docker (easiest)
docker pull zaproxy/zap-stable

# Run baseline scan
docker run -t zaproxy/zap-stable zap-baseline.py -t https://autobazar123.sk

# Run full scan (more thorough)
docker run -t zaproxy/zap-stable zap-full-scan.py -t https://autobazar123.sk
```

**What it tests:**
- SQL Injection
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Broken Authentication
- Security Misconfigurations
- Sensitive Data Exposure

### npm audit (Built-in)
```bash
# Check for vulnerabilities
npm audit

# Auto-fix where possible
npm audit fix

# Force fix (may break things)
npm audit fix --force
```

### Snyk (Free Tier)
```bash
# Install
npm install -g snyk

# Authenticate
snyk auth

# Test project
snyk test

# Monitor for new vulnerabilities
snyk monitor
```

### SSL Labs (Online - Free)
1. Go to: https://www.ssllabs.com/ssltest/
2. Enter: `autobazar123.sk`
3. Wait for results
4. Target: **A+** rating

### Security Headers (Online - Free)
1. Go to: https://securityheaders.com/
2. Enter: `https://autobazar123.sk`
3. Check results
4. Target: **A** rating

**Headers to add in `next.config.ts`:**
```javascript
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  },
]
```

### Nuclei (Advanced - Free)
```bash
# Install
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# Run with default templates
nuclei -u https://autobazar123.sk -t cves/

# Run web-specific templates
nuclei -u https://autobazar123.sk -t http/
```

---

## 8. 💰 Monthly Cost Summary

| Service | Cost | Notes |
|---------|------|-------|
| **Vercel** | €0 | Free tier (hobby) |
| **Supabase** | €0 | Free tier |
| **Cloudflare Images** | €5 | Pro plan |
| **Algolia/Typesense** | €10-30 | Based on usage |
| **VINdecoder.eu** | €5-20 | Based on checks |
| **Stripe fees** | ~3% | Per transaction |
| **Domain** | €10/year | .sk domain |
| **Total** | **~€25-60/mo** | At launch |

---

## 9. 🚀 Launch Checklist

### 1 Week Before Launch
- [ ] Complete security testing (Phase 8)
- [ ] Fix all HIGH/MEDIUM security issues
- [ ] Final performance audit
- [ ] Test payment flow end-to-end
- [ ] Verify email delivery
- [ ] Test on mobile devices

### Launch Day
- [ ] Switch DNS to production
- [ ] Verify SSL certificate
- [ ] Test all critical paths
- [ ] Monitor error logs
- [ ] Have rollback plan ready

### Post-Launch (Week 1)
- [ ] Monitor Microsoft Clarity for UX issues
- [ ] Check Vercel Analytics for errors
- [ ] Respond to user feedback
- [ ] Fix any critical bugs immediately

---

*Last updated: January 13, 2026*
