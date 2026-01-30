# 🚀 Deploy Cloudflare Worker - Step by Step

## You Need to Run These 3 Commands:

### 1. Login to Cloudflare
```bash
cd cloudflare-worker
npx wrangler login
```
**This will open your browser** - just click "Authorize".

### 2. Deploy the Worker
```bash
npx wrangler deploy --var SITE_URL:https://autobazar123.vercel.app
```
**Replace the URL** with your actual Vercel domain!

### 3. Set the Secret
```bash
echo "7VJMyot5D7HKxcWm+bXq8BuvEL6rfJtvpS/dwOGNzHo=" | npx wrangler secret put CRON_SECRET
```

---

## ✅ That's It!

After these 3 commands, your cron jobs will be running!

---

## 🧪 Test Everything

After deployment, run:
```bash
npm run test:security
```

This will test:
- ✅ Cron endpoints are protected
- ✅ Image upload requires auth
- ✅ All environment variables are set
- ✅ Database functions exist

---

## 📋 What Gets Deployed?

The Cloudflare Worker will:
1. Run every day at 6:00 AM (free)
2. Call your 3 cron endpoints:
   - `/api/cron/expire-ads` - Expire old ads
   - `/api/cron/cleanup-sold` - Hide sold ads after 4 days
   - `/api/cron/expire-premiums` - Remove TOP/highlight status

---

## 🆘 Troubleshooting

**"wrangler command not found"?**
```bash
npm install -g wrangler
```

**"Not authorized"?**
- Make sure you ran `npx wrangler login` first

**"CRON_SECRET missing"?**
- The secret is already in your `.env.local`
- Run the echo command in step 3 above

---

## 📊 After Deployment

Check that everything works:
1. Go to https://dash.cloudflare.com
2. Click "Workers & Pages"
3. Click "autobazar123-cron"
4. Click "Triggers" tab - you should see the cron schedule

**To manually trigger:**
```bash
curl -X POST "https://autobazar123-cron.YOUR_ACCOUNT.workers.dev?secret=7VJMyot5D7HKxcWm+bXq8BuvEL6rfJtvpS/dwOGNzHo="
```

(Replace with your actual worker URL from the Cloudflare dashboard)
