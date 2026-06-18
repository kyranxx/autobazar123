# Front / Results / Ad / Dashboard Redesign Audit

Branch: `codex/front-results-ad-dashboard-redesign`

## Purpose

Create one consistent marketplace UI system for the homepage, results page, ad detail page, and account dashboard. The redesign is built around fast product finding, trustworthy listing evaluation, clear actions, and accessible controls.

## Research Inputs

- Baymard, [Homepage & Category Navigation UX](https://baymard.com/research/homepage-and-category-usability): homepage must make product-finding paths obvious: search, category/navigation, and curated paths.
- Baymard, [Homepage design examples](https://baymard.com/homepage-and-category-usability/benchmark/page-types/homepage): homepage is still a front door, navigational anchor, and fallback even when users land on deeper pages.
- Baymard, [Product Lists & Filtering UX](https://baymard.com/research/ecommerce-product-lists): listing pages live or die on scanning, filtering, and sorting quality.
- Baymard, [Product List UX 2025](https://baymard.com/blog/current-state-product-list-and-filtering): most ecommerce list pages underperform, so filters, sorting, result cards, and mobile behavior are high-leverage.
- Baymard, [Ecommerce filter UI](https://baymard.com/learn/ecommerce-filter-ui): search finds candidates, filters remove irrelevant options, and sorting prioritizes remaining results.
- Baymard, [Product Page design examples](https://baymard.com/ecommerce-design-examples/41-product-page): product detail pages are where users decide, so small template issues can cause abandonment.
- Baymard, [Automotive Parts & Specialty UX](https://baymard.com/research/automotive-parts): automotive ecommerce needs strong product list, search, product page, account, accessibility, and mobile UX.
- NN/g, [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/): system status, real-world language, user control, consistency, error prevention, recognition over recall, efficiency, and minimalist design.
- NN/g, [Placeholders in Form Fields Are Harmful](https://www.nngroup.com/articles/form-design-placeholders/): visible labels and persistent hints beat placeholder-only form design.
- W3C WAI, [WCAG 2.2](https://www.w3.org/TR/WCAG22/): controls need programmatic name/role/value, label-in-name, visible focus behavior, and touch target discipline.
- GOV.UK Design System, [Button](https://design-system.service.gov.uk/components/button/): buttons need clear text, correct submit/button behavior, disabled state handling, and duplicate-submit protection where needed.
- GOV.UK Design System, [Error message](https://design-system.service.gov.uk/components/error-message/): errors should be tied to labels and explain what to fix.
- Material Design, [Accessibility touch targets](https://m1.material.io/usability/accessibility.html): touch targets should be large enough and spaced enough for touch and motor accessibility.
- Material Design, [Text fields](https://m1.material.io/components/text-fields.html): fields should expose label, state, helper text, error text, and input affordance.
- Material Web, [Chips](https://material-web.dev/components/chip/): chips should match intent: filter, input, assist, or suggestion.
- Tableau, [Visual best practices](https://help.tableau.com/current/blueprint/en-gb/bp_visual_best_practices.htm): dashboard typography, color, whitespace, hierarchy, and interactivity must support decisions.
- Tableau, [10 Best Practices for Building Effective Dashboards](https://www.tableau.com/sites/default/files/2021-09/10%20Best%20Practices%20for%20Building%20Effective%20DashboardsWP.pdf): dashboards should know the audience, fit display size, surface important KPIs, reduce clutter, and be usability-tested.

## Element Decisions

### Shared System

- Page shell: full-width calm marketplace background with constrained content. This supports scan paths without nesting cards inside cards.
- Cards: compact radius and restrained border/shadow treatment. Cards are used only for repeated items, tools, and framed content.
- Typography: hierarchy is page-level first, then section and control labels. Dashboard rules follow the Tableau guidance to make KPI/action content pop without decorative overload.
- Color: primary actions use the brand action color; secondary actions are outlined or subdued. Status colors are reserved for meaning.
- Focus and targets: controls keep accessible names, visible focus, and mobile-friendly hit areas. Verified by web-interface, axe/reflow, keyboard, and mobile matrix gates.

### Homepage

- Hero: product-finding comes first, not marketing filler. The search module, primary CTA, curated chips, and trust cues answer what the site does and how to begin.
- Search field: visible label and persistent structure, following NN/g and Material guidance against placeholder-only meaning.
- Quick chips: treated as suggestion/filter chips, not decorative pills. They map to high-intent browse paths.
- CTA hierarchy: one dominant search/start action, with lower-emphasis secondary paths for sellers/dealers.
- Featured ads: listing cards use image, key facts, price, and route to detail, aligned with Baymard product-finding research.

### Results Page

- Filter sidebar: facets are grouped by car-shopping criteria so users can remove irrelevant inventory quickly.
- Sort control: kept near result context because sorting prioritizes within the filtered set.
- Active filters/chips: visible state supports recognition over recall and user control.
- Result cards: image, make/model, price, year, mileage, fuel/transmission, location, and CTA are arranged for quick comparison.
- Mobile: filters collapse into a workflow that preserves result visibility and avoids horizontal overflow.

### Ad Detail Page

- Hero and gallery: vehicle identity, price, core specs, and visual evidence are surfaced early because the detail page is the decision point.
- Specs: grouped facts reduce hunting and make cross-car comparison easier.
- Seller/contact actions: primary contact path stays prominent; secondary actions remain available without competing.
- Trust cues: ownership, listing quality, and practical details are placed close to decision areas rather than buried.
- Error/empty states: missing data is handled honestly and visually consistently.

### Dashboard

- First viewport: account status, key actions, and listing-management paths come before lower-priority account detail.
- KPI/action cards: designed as operational controls, not decorative metrics.
- Tabs/navigation: account tasks are grouped by user intent: ads, saved, messages, settings, create.
- Empty states: each empty panel points to the next real action rather than only explaining emptiness.
- Mobile dashboard: vertical layout and limited simultaneous interaction follow dashboard display-size guidance.

## Verification Evidence

- `npm run lint` passed with 0 errors and 1 existing Stripe webhook unused-type warning.
- `npm run typecheck` passed.
- Hydration/browser probe passed for `/`, `/vysledky`, one `/auto/...` detail page, and authenticated `/moj-ucet`.
- `npm run test:web-interface` passed: 18/18.
- `npm run test:a11y` passed: 63/63.
- `npm run test:keyboard` passed: 9/9.
- `npm run test:mobile-matrix` passed: 42/42.
- `npm run test:ui-quality-gate` passed, including 18/18 Playwright checks and 19/19 UI unit tests.
