# Database Migrations

## How to Apply

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to "SQL Editor" in the left sidebar
4. Create a "New query"
5. Copy the contents of the migration file
6. Click "Run"

## Migrations

### 20260129_fix_credits_and_security.sql
**Date:** 2026-01-29

**Changes:**
- Creates atomic RPC function `deduct_and_boost_ad()` - prevents race conditions when boosting ads
- Creates atomic RPC function `publish_ad_with_credits()` - prevents race conditions when publishing ads
- Adds unique constraint on `stripe_payment_id` to prevent duplicate credit additions
- Adds index for faster stripe payment lookups
- Ensures RLS policies are properly configured

**Required for:**
- Credit system security
- Stripe webhook idempotency
- Admin panel moderation features

## Verification

After running the migration, verify it worked:

```sql
-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname IN ('deduct_and_boost_ad', 'publish_ad_with_credits');

-- Check if constraint exists
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'credit_transactions' AND constraint_name = 'credit_transactions_stripe_payment_id_key';
```
