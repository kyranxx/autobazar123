# Algolia Search Integration

This project uses Algolia for high-performance, instant search experiences.

## Setup Instructions

### 1. Create Algolia Account
1. Go to [Algolia](https://www.algolia.com/) and create an account.
2. Create a new Application.
3. Keep the default region or select one close to your users (e.g., Europe).

### 2. Get API Keys
1. Go to **Settings > API Keys**.
2. Copy the **Application ID**.
3. Copy the **Search-Only API Key**.
4. Copy the **Admin API Key** (keep this secret!).

### 3. Configure Environment Variables
Add the following to your `.env.local` file:

```env
NEXT_PUBLIC_ALGOLIA_APP_ID=your_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_search_only_key
ALGOLIA_ADMIN_KEY=your_admin_key
```

### 4. Configure Index & Settings (Automated)
We have provided a script to automatically configure the index settings (facets, sorting, replicas).

Run the following command:
```bash
npx tsx scripts/setup-algolia.ts
```

*Note: This requires `dotenv` to load environment variables. If it fails to load `.env.local`, ensure you have the variables set in your shell or install dotenv.*

### 5. Index Data
To populate the Algolia index with your initial data from Supabase, call the sync API endpoint:

**Method:** POST  
**URL:** `/api/algolia/sync`  
**Header:** `Authorization: Bearer YOUR_ALGOLIA_ADMIN_KEY`

You can use Postman, curl, or a simple script to trigger this.

Example with curl:
```bash
curl -X POST http://localhost:3000/api/algolia/sync \
  -H "Authorization: Bearer YOUR_ALGOLIA_ADMIN_KEY"
```

## Features Implemented
- **Instant Search:** As you type, results appear immediately.
- **Faceted Filters:** Filter by Brand, Model, Price, Year, Fuel, Transmission, etc.
- **Sorting:** Sort by Price (asc/desc), Year (desc), Mileage (asc).
- **Mobile Optimized:** Includes a mobile-friendly filter drawer.
- **SEO Friendly:** Fallback to standard search if JS fails or for bots (partially).

## Files Overview
- `src/lib/algolia`: Client configuration and type definitions.
- `src/components/AlgoliaInstantSearch.tsx`: UI components (Search bar, Hits, Filters).
- `src/app/auta/AlgoliaSearchPageClient.tsx`: The main search results page.
- `src/app/api/algolia/sync/route.ts`: API route to sync Supabase data to Algolia.
- `scripts/sync-algolia-manual.ts`: Script to manually sync data from CLI.

### 6. Manual Sync Script
You can also run a manual sync script from the command line:
```bash
npx tsx scripts/sync-algolia-manual.ts
```
