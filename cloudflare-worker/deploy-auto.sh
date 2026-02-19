#!/bin/bash
# Automated Cloudflare Worker Deployment for Autobazar123
set -e

echo "=========================================="
echo "Autobazar123 Cron Worker Auto-Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Read CRON_SECRET from parent .env.local
CRON_SECRET=$(grep CRON_SECRET ../.env.local | cut -d '=' -f2)

if [ -z "$CRON_SECRET" ]; then
    echo -e "${RED}Error: CRON_SECRET not found in ../.env.local${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found CRON_SECRET${NC}"

# Ask for site URL
if [ -z "$1" ]; then
    echo ""
    echo "Enter your Vercel site URL:"
    echo "Example: https://autobazar123.vercel.app"
    read -p "> " SITE_URL
else
    SITE_URL=$1
fi

if [ -z "$SITE_URL" ]; then
    echo -e "${RED}Error: Site URL is required${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Site URL: $SITE_URL${NC}"
echo ""

# Check if logged in
echo "Checking Cloudflare login..."
if ! npx wrangler whoami 2>/dev/null; then
    echo -e "${YELLOW}Not logged in. Opening browser...${NC}"
    npx wrangler login
fi

echo -e "${GREEN}✓ Logged in to Cloudflare${NC}"

# Set secret
echo ""
echo "Setting CRON_SECRET..."
echo "$CRON_SECRET" | npx wrangler secret put CRON_SECRET --name autobazar123-cron 2>/dev/null || true

# Deploy
echo ""
echo "Deploying worker..."
npx wrangler deploy --var SITE_URL:$SITE_URL

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "Your cron jobs will run daily at 6:00 AM"
echo ""
echo "To test manually, run:"
echo "  curl -X POST \"https://autobazar123-cron.YOUR_ACCOUNT.workers.dev\" -H \"Authorization: Bearer YOUR_CRON_SECRET\""
echo ""
