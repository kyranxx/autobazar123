@echo off
REM Deploy Cloudflare Worker for Autobazar123 Cron Jobs

echo ==========================================
echo Autobazar123 Cron Worker Deployment
echo ==========================================
echo.

REM Check if wrangler is installed
where wrangler >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing wrangler...
    npm install -g wrangler
)

echo.
echo Step 1: Checking login status...
npx wrangler whoami
if %errorlevel% neq 0 (
    echo.
    echo Please login first:
    npx wrangler login
)

echo.
echo Step 2: Setting secrets...
echo Make sure your .env.local has CRON_SECRET set!

REM Read from parent .env.local
for /f "tokens=2 delims==" %%a in ('findstr "CRON_SECRET" ..\.env.local') do set CRON_SECRET=%%a
if defined CRON_SECRET (
    echo Found CRON_SECRET in .env.local
    echo %CRON_SECRET% | npx wrangler secret put CRON_SECRET
) else (
    echo WARNING: CRON_SECRET not found in .env.local
    echo Please enter CRON_SECRET manually:
    npx wrangler secret put CRON_SECRET
)

echo.
echo Step 3: Deploying worker...
set /p SITE_URL="Enter your site URL (e.g., https://autobazar123.vercel.app): "
npx wrangler deploy --var SITE_URL:%SITE_URL%

echo.
echo ==========================================
echo Deployment complete!
echo ==========================================
echo.
echo To test the worker manually:
echo curl -X POST "https://autobazar123-cron.YOUR_ACCOUNT.workers.dev?secret=YOUR_CRON_SECRET"
echo.
pause
