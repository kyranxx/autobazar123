# CRITICAL ACTIONS - Do These First

## 🚨 BLOCKERS PREVENTING LAUNCH (URGENT)

### 1. SELLER DASHBOARD USING MOCK DATA (IMMEDIATE - 1 hour)
**File:** `/src/app/dealer/DealerDashboardClient.tsx`

**Problem:** 659+ lines of HARDCODED mock data, no real database connection

**Quick Fix:**
```typescript
// REMOVE THIS (lines 13-100+):
const MOCK_DEALER = {
    id: "dealer1",
    business_name: "AutoMax Slovakia s.r.o.",
    // ... 25 lines of hardcoded data
};

const MOCK_DEALER_ADS = [
    { id: "d1", brand: "Mercedes-Benz", ... },
    // ... 5 hardcoded ads
];

// REPLACE WITH:
const [isLoading, setIsLoading] = useState(true);
const [dealer, setDealer] = useState(null);
const [ads, setAds] = useState([]);

useEffect(() => {
    // TODO: Load real dealer data from Supabase
    // const { data, error } = await supabase
    //   .from('dealers')
    //   .select('*')
    //   .eq('id', dealerId)
    //   .single();
    setIsLoading(false);
}, []);

if (isLoading) return <Skeleton />;
```

**Why:** Users clicking "Seller Dashboard" see fake data. This destroys trust.

**Deadline:** TODAY

---

### 2. NO ERROR BOUNDARIES (IMMEDIATE - 2 hours)
**Impact:** Any component crash takes down entire page

**Action Items:**

1. **Create Error Boundary component** (`/src/components/ui/ErrorBoundary.tsx`):
```typescript
'use client'

import React from 'react'
import { Button } from './Button'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<Props> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-secondary mb-6">{this.state.error?.message}</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

2. **Wrap root layout:**
```typescript
// /src/app/layout.tsx
<ErrorBoundary>
  {children}
</ErrorBoundary>
```

3. **Add error.tsx in key directories:**
```
/src/app/auto/error.tsx
/src/app/vysledky/error.tsx
/src/app/dealer/error.tsx
/src/app/moj-ucet/error.tsx
/src/app/admin/error.tsx
```

**Content for error.tsx:**
```typescript
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-accent text-white rounded"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
```

**Deadline:** TODAY - Makes app production-ready

---

### 3. NO TRANSACTIONAL EMAIL SYSTEM (THIS WEEK - 2-3 days)
**Impact:** No payment confirmations, password resets, or notifications

**Action Items:**

1. **Choose email provider** (pick ONE):
   - ✅ **Resend** (recommended for Next.js) - Free tier available
   - SendGrid - Popular, good for scale
   - Mailgun - Reliable, good for high volume

2. **Install Resend** (fastest option):
```bash
npm install resend
```

3. **Create email service** (`/src/lib/email/index.ts`):
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPaymentConfirmation(
  email: string,
  amount: number,
  credits: number
) {
  return resend.emails.send({
    from: 'noreply@autobazar123.sk',
    to: email,
    subject: 'Platba potvrdená - Autobazar123',
    html: `
      <h2>Ďakujeme za vašu platbu!</h2>
      <p>Suma: €${amount}</p>
      <p>Kredity: ${credits}</p>
    `,
  })
}

export async function sendPasswordReset(email: string, resetUrl: string) {
  return resend.emails.send({
    from: 'noreply@autobazar123.sk',
    to: email,
    subject: 'Obnovte si heslo - Autobazar123',
    html: `
      <p>Kliknite na odkaz nižšie na obnovenie hesla:</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `,
  })
}
```

4. **Setup environment variables**:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

5. **Integrate with Stripe webhook** (`/src/app/api/stripe/webhook/route.ts`):
```typescript
// When payment succeeds:
await sendPaymentConfirmation(userEmail, amount, creditsAwarded)
```

**Deadline:** BEFORE launching payments (end of week 1)

---

### 4. PERFORMANCE NOT OPTIMIZED (WEEK 1 - 5-8 days)
**Status:** 0% complete, BLOCKS SEO & production deployment

**Quick Baseline (today):**
```bash
npm run analyze
# This will show bundle size issues
```

**Must-do items:**

1. **Image Optimization:**
   - Verify Cloudflare Images integration
   - Add next/image for all car photos
   - Generate AVIF/WebP variants
   - Set proper cache headers

2. **Database Query Optimization:**
   - Add missing indexes (check migrations)
   - Optimize Algolia search queries
   - Add query result caching

3. **JavaScript Reduction:**
   - Remove unused dependencies
   - Enable dynamic imports where possible
   - Defer non-critical scripts

4. **Caching Strategy:**
   - Add service worker
   - Setup static asset caching (1 year)
   - Setup API response caching (5 minutes)

**Deadline:** End of Week 1 (CRITICAL for SEO)

---

### 5. STRIPE PAYMENT FLOW BROKEN (WEEK 2 - 6-10 days)
**Status:** Endpoints exist but workflow incomplete

**What's Missing:**

1. **No credit provisioning on success:**
   - Webhook receives payment_intent.succeeded
   - Should add credits to user
   - Currently: Just logs event, no action taken

2. **No invoice generation:**
   - No PDF invoice created
   - No invoice record in database
   - Cannot send via email

3. **No Stripe↔DB sync:**
   - No verification that payment matches user
   - No idempotency beyond duplicate check
   - No transaction rollback on error

**Fix Priority:**

1. **Add credit provisioning** (day 1-2):
```typescript
// /src/app/api/stripe/webhook/route.ts
if (event.type === 'charge.succeeded') {
  const session = event.data.object as Stripe.Charge
  
  // Get user who made payment
  const { data: payment } = await supabase
    .from('credit_transactions')
    .select('user_id, credits_awarded')
    .eq('stripe_payment_id', session.id)
    .single()
  
  // Update user credits
  await supabase
    .from('profiles')
    .update({
      credit_balance: user.credit_balance + payment.credits_awarded
    })
    .eq('id', payment.user_id)
}
```

2. **Add invoice generation** (day 3-4):
```typescript
// Create invoice record
const invoice = {
  user_id: userId,
  stripe_payment_id: session.id,
  amount: session.amount_total / 100,
  credits: creditsAwarded,
  created_at: new Date(),
  status: 'pending'
}

await supabase.from('invoices').insert(invoice)
```

3. **Add email notification** (day 4-5):
```typescript
// Send confirmation email
await sendPaymentConfirmation(userEmail, amount, credits)
```

**Deadline:** End of Week 2 (CRITICAL for revenue)

---

## 📋 THIS WEEK'S ACTION CHECKLIST

- [ ] **TODAY** - Remove mock data from DealerDashboardClient.tsx (1 hour)
- [ ] **TODAY** - Create Error Boundary component (2 hours)
- [ ] **TODAY** - Add error.tsx files to key pages (1 hour)
- [ ] **TODAY** - Choose email provider (Resend recommended) (30 min)
- [ ] **TUESDAY** - Install & setup Resend (1 hour)
- [ ] **TUESDAY** - Create email service wrapper (1 hour)
- [ ] **TUESDAY** - Run Lighthouse audit baseline (1 hour)
- [ ] **WEDNESDAY** - Start image optimization pipeline (2-3 hours)
- [ ] **WEDNESDAY** - Database index review (1 hour)
- [ ] **THURSDAY-FRIDAY** - Performance optimization (5-8 hours)
- [ ] **NEXT WEEK** - Start Stripe payment integration

---

## ⚠️ CODE REVIEW NOTES

### Critical Issues Found:

1. **DealerDashboardClient.tsx (lines 13-100+)**
   - Status: MOCK DATA HARDCODED
   - Risk: HIGH - Users see fake statistics
   - Fix Time: 1 hour
   - Action: Remove mock data, add loading state, connect to real DB

2. **No Error Boundaries**
   - Status: MISSING
   - Risk: CRITICAL - Any crash breaks entire page
   - Fix Time: 2-3 hours
   - Action: Create ErrorBoundary component, wrap layouts, add error.tsx files

3. **No Transactional Emails**
   - Status: MISSING
   - Risk: HIGH - No payment confirmations, resets fail
   - Fix Time: 2-3 days
   - Action: Install Resend, create email service, integrate with flows

4. **No PageSpeed Optimization**
   - Status: NOT STARTED
   - Risk: CRITICAL - SEO will suffer, users frustrated
   - Fix Time: 5-8 days
   - Action: Images, caching, database optimization

5. **No Stripe Payment Success Handler**
   - Status: PARTIALLY DONE
   - Risk: CRITICAL - Users pay but don't get credits
   - Fix Time: 3-5 days
   - Action: Webhook handler → credit provisioning → invoice → email

---

## 🎯 SUCCESS CRITERIA

### By End of This Week:
- [ ] No mock data in DealerDashboard
- [ ] Error boundaries catching component crashes
- [ ] Email system working (at least for test emails)
- [ ] Lighthouse score >80 on all metrics
- [ ] No critical TypeScript errors

### By End of Next Week:
- [ ] Stripe payments giving credits to users
- [ ] Invoice records created
- [ ] Payment confirmation emails sent
- [ ] Seller dashboard connected to real database
- [ ] Lighthouse score >90 on all metrics

### By End of Month:
- [ ] All 4 critical blockers resolved
- [ ] Production-ready error handling
- [ ] 95%+ Lighthouse scores
- [ ] Backup/restore procedures documented
- [ ] Ready for UAT

---

## 📞 QUESTIONS TO ANSWER

Before proceeding:

1. What email provider to use? (Resend recommended)
2. When is the hard launch deadline?
3. How many dealers will launch with?
4. What's the expected payment volume?
5. Do we need GDPR/compliance audit?
6. Should we do load testing before launch?

---

**This document is your action plan. Print it. Pin it. Complete it.**

Last Updated: February 6, 2026
