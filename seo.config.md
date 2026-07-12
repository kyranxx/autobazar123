# SEO Config

Project: autobazar123
Primary domain: https://www.autobazar123.sk
Local URL: http://localhost:3000
Preview URL:
Framework/CMS: Next.js

Important page types:
- Home
- Car listing pages
- Search/results pages
- Dealer/profile pages
- Static content pages

Known intentional noindex/block rules:
- Public SEO indexing is open on Production when `NEXT_PUBLIC_SITE_INDEXING_ENABLED=true`.
- Account, auth, checkout, admin, preview, and API routes may be intentionally blocked.
- If a future maintenance/prelaunch gate closes indexing again, update `PROJECT_STATUS.md` and this file in the same change.

Known canonical rules:
- Filtered/search/tracking URLs should canonicalize to the preferred clean URL when appropriate.

Sitemaps:
- /sitemap.xml

Robots:
- /robots.txt
