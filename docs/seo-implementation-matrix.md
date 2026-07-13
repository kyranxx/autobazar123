# SEO Implementation Matrix (Gate 6)

This matrix converts the SEO map into concrete execution for Autobazar123.

## Technical SEO

| Item | Current State | This Tranche | Next Step |
| --- | --- | --- | --- |
| Site Structure | Brand/model/city route hierarchy exists. | Reinforced internal links from `vysledky` hub to high-value routes. | Expand contextual links from detail pages to related inventory clusters. |
| Crawlability | `robots.ts` and dynamic `sitemap.ts` are in place. | Added canonical metadata on `vysledky` and dealer detail page. | Add query-param canonical policy and monitor in Search Console. |
| Core Web Vitals | Existing audit scripts cover performance snapshots. | No regression changes in this tranche. | Add explicit CWV budget gates to CI reporting output. |
| Structured Data | Organization and website JSON-LD exists globally; vehicle schema exists on detail page. | Added breadcrumb JSON-LD to brand/model/city/dealer route templates and `ItemList` JSON-LD to brand/model/city listing pages. | Validate listing schemas in Rich Results Test and expand `ItemList` to search hub variants when stable. |

## On-Page SEO

| Item | Current State | This Tranche | Next Step |
| --- | --- | --- | --- |
| Keyword Research | Baseline metadata is present on major pages. | Refined search hub metadata to stronger, route-specific intent. | Build search-demand-led title/description variants per segment page. |
| Search Intent | Search UX supports granular filters. | Added internal quick-link blocks on `vysledky` for top intent paths. | Add intent blocks by fuel, price, and body type. |
| Title Tags | Dynamic pages already generate titles. | Added canonical + OpenGraph URL alignment on search/dealer routes. | Audit for title collisions and missing unique value proposition. |
| Internal Linking | Cross-links existed on brand/model pages. | Added a dedicated high-value internal link cluster on `vysledky`. | Add breadcrumb UI links on all key templates for stronger crawl paths. |

## Evidence (Gate 6)

- Search metadata and link cluster: `src/app/(site)/vysledky/page.tsx`
- Search semantic heading: `src/app/(site)/vysledky/AlgoliaSearchPageClient.tsx`
- Breadcrumb JSON-LD:
  - `src/app/(site)/[brand]/page.tsx`
  - `src/app/(site)/[brand]/[model]/page.tsx`
  - `src/app/(site)/[brand]/[model]/[city]/page.tsx`
  - `src/app/(site)/predajca/[slug]/page.tsx`
- ItemList JSON-LD:
  - `src/app/(site)/[brand]/page.tsx`
  - `src/app/(site)/[brand]/[model]/page.tsx`
  - `src/app/(site)/[brand]/[model]/[city]/page.tsx`
