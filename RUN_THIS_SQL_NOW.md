# ⚠️ IMPORTANT: Run This SQL in Supabase

The test found that some database columns are missing. Run this SQL in your Supabase dashboard:

## How to Run:
1. Go to https://app.supabase.com
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Copy the SQL below
6. Click "Run"

## SQL to Run:

```sql
-- Add missing columns for cron jobs
ALTER TABLE ads ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS top_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS highlight_expires_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ads_status_sold_at ON ads(status, sold_at) WHERE status = 'sold';
CREATE INDEX IF NOT EXISTS idx_ads_is_hidden ON ads(is_hidden) WHERE is_hidden = false;
CREATE INDEX IF NOT EXISTS idx_ads_top_expires ON ads(is_top_ad, top_expires_at) WHERE is_top_ad = true;
CREATE INDEX IF NOT EXISTS idx_ads_highlight_expires ON ads(is_highlighted, highlight_expires_at) WHERE is_highlighted = true;
```

## After Running:

Test the endpoint again:
```bash
curl -X GET "http://localhost:3000/api/cron/cleanup-sold" -H "x-cron-secret: 7VJMyot5D7HKxcWm+bXq8BuvEL6rfJtvpS/dwOGNzHo="
```

Expected result:
```json
{"message":"No old sold ads to hide","count":0,"timestamp":"2026-01-29T..."}
```

---

## Full Migration File

For all the security fixes (RPC functions, RLS policies, etc.), also run:
`supabase/migrations/20260129_fix_credits_and_security.sql`
