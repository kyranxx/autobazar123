#!/bin/bash
# Deploy Cloudflare Worker for Autobazar123 Cron Jobs

set -e

echo "=========================================="
echo "Autobazar123 Cron Worker Deployment"
echo "=========================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Installing wrangler..."
    npm install -g wrangler
fi

echo "Step 1: Checking login status..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login first:"
    wrangler login
fi

echo ""
echo "Step 2: Setting secrets..."
# Read CRON_SECRET from parent .env.local
if [ -f ../.env.local ]; then
    CRON_SECRET=$(grep CRON_SECRET ../.env.local | cut -d '=' -f2)
    if [ -n "$CRON_SECRET" ]; then
        echo "Found CRON_SECRET in .env.local"
        echo "$CRON_SECRET" | wrangler secret put CRON_SECRET
    else
        echo "CRON_SECRET not found in .env.local, please enter manually:"
        wrangler secret put CRON_SECRET
    fi
else
    echo "WARNING: .env.local not found"
    echo "Please enter CRON_SECRET manually:"
    wrangler secret put CRON_SECRET
fi

echo ""
echo "Step 3: Deploying worker..."
read -p "Enter your site URL (e.g., https://autobazar123.vercel.app): " SITE_URL
wrangler deploy --var SITE_URL:$SITE_URL

echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
echo ""
echo "To test the worker manually:"
echo "curl -X POST \"https://autobazar123-cron.YOUR_ACCOUNT.workers.dev\" -H \"Authorization: Bearer YOUR_CRON_SECRET\""
echo ""
