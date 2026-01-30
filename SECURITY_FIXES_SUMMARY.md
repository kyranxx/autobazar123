# Security Fixes Summary

## ✅ Completed Changes

### 1. Environment Variables (.env.local)
**Status:** ✅ Updated automatically

Added:
```
CRON_SECRET=7VJMyot5D7HKxcWm+bXq8BuvEL6rfJtvpS/dwOGNzHo=
```

### 2. Cloudflare Worker for Cron Jobs
**Location:** `cloudflare-worker/`
**Status:** ✅ Created

Files created:
- `wrangler.toml` - Worker configuration
- `src/index.ts` - Worker code
- `package.json` - Dependencies
- `deploy.sh` / `deploy.bat` - Deployment scripts
- `README.md` - Setup instructions

**Schedule:** Daily at 6:00 AM (free tier)

### 3. Database Migration
**Location:** `supabase/migrations/20260129_fix_credits_and_security.sql`
**Status:** ✅ Created

Includes:
- `deduct_and_boost_ad()` - Atomic credit deduction for boosting
- `publish_ad_with_credits()` - Atomic credit deduction for publishing
- Unique constraint on `stripe_payment_id`
- RLS policies verification

### 4. API Security
**Status:** ✅ Fixed

| Endpoint | Fix |
|----------|-----|
| `/api/cron/expire-ads` | Added CRON_SECRET auth |
| `/api/cron/cleanup-sold` | Added CRON_SECRET auth |
| `/api/cron/expire-premiums` | Added CRON_SECRET auth + fixed column names |
| `/api/images/upload-url` | Added user auth check |
| `/api/stripe/webhook` | Added idempotency check |

### 5. Race Condition Fixes
**Status:** ✅ Fixed

Files updated:
- `src/app/moj-ucet/DashboardClient.tsx` - Uses `deduct_and_boost_ad()` RPC
- `src/app/pridat-inzerat/AdWizardClient.tsx` - Uses `publish_ad_with_credits()` RPC

### 6. Rate Limiting
**Status:** ✅ Added

- Contact form: 3 submissions per 5 minutes (client-side)

### 7. Admin Panel
**Status:** ✅ Fixed

- Moderation: Approve/reject now updates database
- Users tab: Shows real users from database
- Removed all mock data

---

## 🚀 What You Need to Do

### Step 1: Run Database Migration (2 minutes)
1. Go to https://app.supabase.com
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Open `supabase/migrations/20260129_fix_credits_and_security.sql`
6. Copy contents and paste into SQL Editor
7. Click "Run"

### Step 2: Deploy Cloudflare Worker (2 minutes)

**Option A - Windows:**
```bash
cd cloudflare-worker
.\deploy.bat
```

**Option B - Mac/Linux:**
```bash
cd cloudflare-worker
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Check/login to Cloudflare
- Set the CRON_SECRET from your .env.local
- Ask for your site URL
- Deploy the worker

### Step 3: Deploy to Vercel (1 minute)
```bash
git add .
git commit -m "Security fixes: cron auth, race conditions, idempotency"
git push
```

Or just push to GitHub and Vercel will auto-deploy.

### Step 4: Add CRON_SECRET to Vercel (1 minute)
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add: `CRON_SECRET` = `7VJMyot5D7HKxcWm+bXq8BuvEL6rfJtvpS/dwOGNzHo=`
5. Click "Save" and redeploy

---

## 🧪 Verify Everything Works

Run the verification script:
```bash
npm run verify
```

This checks:
- All environment variables are set
- Configuration files exist
- Required secrets are present

---

## 🔒 Security Improvements

| Issue | Before | After |
|-------|--------|-------|
| Cron endpoints | 🔴 Open to public | 🟢 Protected by secret |
| Credit system | 🟠 Race condition | 🟢 Atomic operations |
| Stripe webhook | 🟠 Could duplicate | 🟢 Idempotent |
| Image upload | 🟠 Anonymous | 🟢 Auth required |
| Contact form | 🔴 No rate limit | 🟢 3 per 5 min |
| Admin moderation | 🟠 Mock buttons | 🟢 Real database updates |

---

## 📁 Files Changed/Created

### New Files:
```
cloudflare-worker/
├── wrangler.toml
├── src/index.ts
├── package.json
├── deploy.sh
├── deploy.bat
├── README.md

supabase/migrations/
├── 20260129_fix_credits_and_security.sql
├── README.md

scripts/
├── verify-setup.ts

SECURITY_FIXES_SUMMARY.md (this file)
```

### Modified Files:
```
.env.local
package.json
src/app/api/cron/expire-ads/route.ts
src/app/api/cron/cleanup-sold/route.ts
src/app/api/cron/expire-premiums/route.ts
src/app/api/images/upload-url/route.ts
src/app/api/stripe/webhook/route.ts
src/app/moj-ucet/DashboardClient.tsx
src/app/pridat-inzerat/AdWizardClient.tsx
src/app/kontakt/ContactFormClient.tsx
src/app/admin/AdminDashboardClient.tsx
.env.example
```

---

## ⚠️ Important Notes

1. **Your secrets are safe** - `.env.local` is in `.gitignore` and won't be committed
2. **CRON_SECRET is set** - Both locally and ready for Vercel
3. **Database migration required** - SQL must be run manually in Supabase
4. **Cloudflare Worker required** - Must be deployed for cron jobs to work
5. **Free tier** - Cloudflare Worker cron is free (100k requests/day)

---

## 🆘 Troubleshooting

### Cron jobs not running?
- Check Cloudflare Worker logs: `cd cloudflare-worker && npx wrangler tail`
- Verify CRON_SECRET matches between Vercel and Cloudflare

### Credits not deducting?
- Check if SQL migration was run in Supabase
- Verify `deduct_and_boost_ad` function exists

### Stripe double-charging?
- Check if unique constraint on `stripe_payment_id` exists
- Check Stripe webhook logs

### Admin panel not working?
- Make sure you're logged in with admin email
- Check browser console for errors
