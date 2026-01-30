# Create Cloudflare API Token for Wrangler

## Step 1: Go to Cloudflare API Tokens
1. Open: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**

## Step 2: Use Template
1. Find **"Edit Cloudflare Workers"** template
2. Click **"Use template"**

## Step 3: Configure Token
- **Token name**: `Autobazar123 Worker Deploy`
- **Account**: Select your account (Blanarikdaniel@gmail.com)
- **Zone**: Select your domain OR "All zones"

## Step 4: Permissions (should be auto-selected)
Make sure these are included:
- ✅ `Cloudflare Pages:Edit`
- ✅ `Workers Scripts:Edit`
- ✅ `Account Settings:Read`
- ✅ `User Details:Read`

## Step 5: Create Token
1. Click **"Continue to summary"**
2. Click **"Create token"**
3. **COPY THE TOKEN** (you won't see it again!)

## Step 6: Update .env.local
Replace the old token in your `.env.local`:
```bash
CLOUDFLARE_API_TOKEN=your-new-token-here
```

## Step 7: Deploy Again
```bash
cd cloudflare-worker
npx wrangler deploy --var SITE_URL:https://autobazar123.vercel.app
```

---

## Alternative: Use wrangler login (Interactive)

If you prefer, you can login interactively:
```bash
cd cloudflare-worker
npx wrangler login
# Then in your terminal (not here), run:
npx wrangler deploy --var SITE_URL:https://autobazar123.vercel.app
```

This will use your browser session instead of API tokens.
