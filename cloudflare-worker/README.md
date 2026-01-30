# Autobazar123 Cloudflare Cron Worker

This Cloudflare Worker handles scheduled cron jobs for the Autobazar123 application.

## Setup

1. **Install dependencies:**
```bash
cd cloudflare-worker
npm install
```

2. **Login to Cloudflare:**
```bash
npx wrangler login
```

3. **Set secrets:**
```bash
# Set the cron secret (same as your VERCEL_CRON_SECRET)
npx wrangler secret put CRON_SECRET
# Enter your secret when prompted

# Set the site URL
npx wrangler deploy --var SITE_URL:https://your-domain.vercel.app
```

4. **Deploy:**
```bash
npm run deploy
```

## Manual Trigger (for testing)

```bash
curl -X POST "https://autobazar123-cron.your-account.workers.dev?secret=YOUR_CRON_SECRET"
```

## Cron Schedule

The worker runs every hour by default. Edit `wrangler.toml` to change:
```toml
[[triggers]]
crons = ["0 * * * *"]  # Every hour
crons = ["0 6 * * *"]  # Daily at 6 AM (recommended)
```

## Free Tier Limits

- 100,000 requests/day
- Unlimited cron triggers
- More than enough for this use case
