# 🚀 Autobazar123 Production Deployment Guide

## Step 1: Supabase Setup

### 1.1 Get API Keys
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `vxwbbzjlctjpzivfkdou`
3. Go to **Settings > API**
4. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 1.2 Configure Auth
1. Go to **Authentication > URL Configuration**
2. Set **Site URL**: `https://autobazar123.vercel.app`
3. Add **Redirect URLs**:
   - `https://autobazar123.vercel.app/auth/callback`
   - `https://autobazar123.vercel.app/**`

### 1.3 Enable OAuth Providers (Optional)
1. Go to **Authentication > Providers**
2. Enable **Google**:
   - Get OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
3. Enable **Facebook**:
   - Get App ID/Secret from [Facebook Developers](https://developers.facebook.com/)

---

## Step 2: Stripe Setup

### 2.1 Get API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy **Secret key** → `STRIPE_SECRET_KEY`
   - Use `sk_test_...` for testing
   - Use `sk_live_...` for production

### 2.2 Create Webhook
1. Go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Set **Endpoint URL**: `https://autobazar123.vercel.app/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
5. Click **Add endpoint**
6. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 2.3 Create Products (Optional)
Credit packs are handled via metadata, but you can create products in Stripe for better tracking.

---

## Step 3: Vercel Setup

### 3.1 Add Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project **autobazar123**
3. Go to **Settings > Environment Variables**
4. Add each variable:

| Variable | Environment | Value |
|----------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | `https://vxwbbzjlctjpzivfkdou.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | All | Your service role key |
| `STRIPE_SECRET_KEY` | Production | `sk_live_...` |
| `STRIPE_SECRET_KEY` | Preview/Development | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | All | `whsec_...` |
| `NEXT_PUBLIC_APP_URL` | Production | `https://autobazar123.vercel.app` |
| `RESEND_API_KEY` | All | `re_...` (optional) |

### 3.2 Redeploy
After adding variables, redeploy:
1. Go to **Deployments**
2. Click **...** on latest deployment
3. Click **Redeploy**

---

## Step 4: Email Setup (Optional)

### 4.1 Resend.com
1. Create account at [resend.com](https://resend.com)
2. Go to **API Keys**
3. Create new key → `RESEND_API_KEY`
4. Verify your domain for production emails

---

## Step 5: Custom Domain (Optional)

### 5.1 Add Domain in Vercel
1. Go to **Settings > Domains**
2. Add `autobazar123.sk` (or your domain)
3. Configure DNS as shown

### 5.2 Update App URL
1. Update `NEXT_PUBLIC_APP_URL` to your domain
2. Update Supabase Site URL
3. Update Stripe webhook URL

---

## Step 6: Final Checklist

- [ ] Supabase API keys added to Vercel
- [ ] Supabase Auth redirect URLs configured
- [ ] Stripe API keys added to Vercel
- [ ] Stripe webhook created and tested
- [ ] App redeployed with new variables
- [ ] Test login/register flow
- [ ] Test credit purchase flow
- [ ] Test ad creation flow

---

## Testing Payment Flow

1. Use Stripe test card: `4242 4242 4242 4242`
2. Any future expiry date
3. Any CVC
4. Complete checkout
5. Verify credits added to user account

---

## Monitoring

- **Vercel Analytics**: Auto-enabled
- **Stripe Dashboard**: Payment monitoring
- **Supabase Dashboard**: Database and auth logs

---

## Support Links

- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
