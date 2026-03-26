export const PRODUCT_SUMMARY =
  "Autobazar123 is a Slovak car marketplace. The app combines discovery, listing detail, seller contact, account flows, dealer/admin operations, and credit-backed paid actions.";

export const READING_ORDER = [
  "Start with Product, Roles, and Glossary if you want the non-technical view first.",
  "Use Architecture, Feature Atlas, and Coverage Matrix to understand how the app is assembled.",
  "Use Routes, Services, Data, and Security when you need implementation detail.",
  "Use Change Guides, Tests, Troubleshooting, and Change Impact when you are debugging or planning work.",
];

export const ROLES = [
  {
    title: "Guest",
    summary:
      "Can browse inventory, view detail pages, use search, read legal pages, and start auth or inquiry flows.",
    routes: ["/", "/vysledky", "/auto/[id]", "/auth/login", "/auth/register", "/kontakt"],
  },
  {
    title: "Authenticated User",
    summary:
      "Can manage account details, save searches or ads, send inquiries, add listings, and spend credits.",
    routes: ["/moj-ucet", "/ulozene", "/spravy", "/pridat-inzerat", "/kredity"],
  },
  {
    title: "Dealer",
    summary:
      "Gets dealer-specific listing management, verification, profile pages, and bulk actions on ads.",
    routes: ["/dealer", "/predajca/[slug]", "/predajcovia"],
  },
  {
    title: "Admin",
    summary:
      "Can access moderation, logs, settings, analytics, revenue, quality gates, email center, and feature flags.",
    routes: ["/admin", "/nastavenia"],
  },
];

export const GLOSSARY = [
  ["Next.js", "The web framework running the app pages, layouts, API routes, and server rendering."],
  ["Route", "A URL path such as `/vysledky` or `/api/stripe/checkout`."],
  ["API route", "A server endpoint inside the app that browser code or background jobs call."],
  ["Component", "A reusable UI building block, usually a React function under `src/components`."],
  ["Supabase", "The backend service used for auth, database access, and row-level security."],
  ["RLS", "Row-level security. Database rules that decide who can read or modify each row."],
  ["Algolia", "The search engine used for fast listing discovery, filtering, and search suggestions."],
  ["Webhook", "A server-to-server callback. Stripe uses this to confirm payment events."],
  ["Cron", "A scheduled background job. Vercel Cron hits protected API routes on a timer."],
  ["Idempotency", "Protection against applying the same action twice, especially around payments."],
  ["Fallback", "A degraded path used when a primary service is unavailable. In this repo, fallbacks are tracked and monitored."],
  ["Env var", "A configuration value like an API key or service URL that is supplied outside the codebase."],
  ["Proxy", "A request gate in `src/proxy.ts` that applies guardrails like maintenance mode, auth checks, and route handling rules."],
];

export const JOURNEYS = [
  {
    title: "Search and browse inventory",
    audience: "Guest or buyer",
    confidence: "Confirmed from code",
    steps: [
      "User starts on the homepage or results page.",
      "Search UI builds URL state and sends search queries through Algolia clients.",
      "If Algolia is unavailable, the app can degrade to a fallback catalog API path.",
      "User opens a listing detail page and can view photos, seller info, and contact actions.",
    ],
    routes: ["/", "/vysledky", "/auto/[id]", "/api/search/catalog", "/api/search/count"],
    services: ["Algolia", "Supabase", "Cloudflare Images"],
    tests: [
      "tests/e2e.test.ts",
      "tests/release-gauntlet.test.ts",
      "src/lib/algolia/fallback-search.test.ts",
    ],
  },
  {
    title: "Register, login, and recover access",
    audience: "User",
    confidence: "Confirmed from code",
    steps: [
      "User opens auth pages or the auth modal.",
      "Supabase handles auth state and sessions, including callback and password reset routes.",
      "The app can resend confirmation emails through app API routes and React Email templates.",
      "Google OAuth and optional One Tap can supplement password login.",
    ],
    routes: [
      "/auth/login",
      "/auth/register",
      "/auth/reset-password",
      "/auth/callback",
      "/api/auth/register",
      "/api/auth/password-reset",
    ],
    services: ["Supabase", "Resend", "Google Identity Services"],
    tests: [
      "src/components/AuthModal.email-flow.test.tsx",
      "src/lib/auth/password-flow.test.ts",
      "src/app/api/auth/password-reset/route.security.test.ts",
    ],
  },
  {
    title: "Create, publish, and manage a listing",
    audience: "User or dealer",
    confidence: "Confirmed from code",
    steps: [
      "User enters the add-listing wizard and provides vehicle details, photos, and price.",
      "Photo upload uses Cloudflare direct upload and Cloudflare delivery URLs.",
      "Publishing and paid actions rely on Supabase RPCs and credit deductions.",
      "Dashboard and dealer screens let the seller edit, resubmit, top, or mark an ad as sold.",
    ],
    routes: [
      "/pridat-inzerat",
      "/upravit-inzerat/[id]",
      "/moje-inzeraty",
      "/dealer",
      "/api/images/upload-url",
      "/api/account/ads",
    ],
    services: ["Supabase", "Cloudflare Images"],
    tests: [
      "src/lib/dealer/bulk-actions.test.ts",
      "src/app/api/account/ads/mark-sold/route.test.ts",
      "src/app/api/account/ads/resubmit/route.test.ts",
    ],
  },
  {
    title: "Buy credits and confirm payment",
    audience: "Authenticated user",
    confidence: "Confirmed from code",
    steps: [
      "User selects a credit pack on `/kredity`.",
      "The app creates a Stripe Checkout session through a protected API route.",
      "Stripe sends a webhook back to the app after payment completion.",
      "Supabase credit transactions and email notifications are updated server-side.",
    ],
    routes: ["/kredity", "/kredity/uspech", "/api/stripe/checkout", "/api/stripe/webhook"],
    services: ["Stripe", "Supabase", "Resend"],
    tests: [
      "tests/release-gauntlet.test.ts",
      "src/app/api/stripe/webhook/route.test.ts",
      "src/app/api/stripe/checkout/route.idempotency.test.ts",
    ],
  },
  {
    title: "Send inquiries and saved alerts",
    audience: "Buyer and seller",
    confidence: "Confirmed from code",
    steps: [
      "Buyer submits an inquiry or saves a search/ad.",
      "Supabase stores the inquiry, saved item, or saved-search preference.",
      "Cron jobs can process alerts and queued email jobs.",
      "Admins can inspect email delivery history and quality-gate feeds.",
    ],
    routes: [
      "/spravy",
      "/ulozene",
      "/api/inquiries",
      "/api/account/saved-searches",
      "/api/cron/send-alerts",
      "/api/cron/process-email-jobs",
    ],
    services: ["Supabase", "Resend", "Vercel Cron"],
    tests: [
      "src/lib/inquiries/submit-inquiry.test.ts",
      "src/lib/search/saved-searches.test.ts",
      "src/app/api/inquiries/route.test.ts",
    ],
  },
];

export const FEATURE_ATLAS = [
  {
    id: "marketplace-discovery",
    title: "Marketplace discovery",
    confidence: "Confirmed from code",
    summary: "Homepage search, results browsing, and SEO listing pages.",
    routes: ["/", "/vysledky", "/[brand]", "/[brand]/[model]", "/[brand]/[model]/[city]"],
    components: [
      "src/components/home/HomePageShell.tsx",
      "src/components/home/HomeSearchFormClient.tsx",
      "src/app/(site)/vysledky/AlgoliaSearchPageClient.tsx",
      "src/components/search/CarHit.tsx",
    ],
    server: [
      "src/lib/algolia/index.ts",
      "src/lib/algolia/url-state.ts",
      "src/lib/seo/inventory.ts",
      "src/app/api/search/catalog/route.ts",
    ],
    data: ["ads", "brands", "models", "analytics_events"],
    services: ["Algolia", "Supabase", "Cloudflare Images"],
    tests: [
      "tests/e2e.test.ts",
      "tests/release-gauntlet.test.ts",
      "src/lib/algolia/url-state.test.ts",
      "src/lib/algolia/fallback-search.test.ts",
    ],
    risk: "Search depends on Algolia, URL-state consistency, and a controlled fallback path.",
    gapLevel: "Medium",
    gapNote: "Good breadth, but `/vysledky` instability and fallback complexity keep this from low-risk coverage.",
  },
  {
    id: "listing-detail-trust",
    title: "Listing detail and seller trust",
    confidence: "Confirmed from code",
    summary: "Car detail pages, media, trust signals, and seller pages.",
    routes: ["/auto/[id]", "/predajca/[slug]", "/predajcovia"],
    components: [
      "src/app/(site)/auto/[id]/CarDetailClient.tsx",
      "src/components/ui/TrustSignal.tsx",
      "src/components/ui/TrustBadge.tsx",
    ],
    server: [
      "src/lib/cars/car-detail.ts",
      "src/lib/cars/ad-path.ts",
      "src/lib/image-optimizer.ts",
    ],
    data: ["ads", "dealers", "profiles"],
    services: ["Supabase", "Cloudflare Images"],
    tests: [
      "src/lib/cars/ad-path.test.ts",
      "src/components/ui/TrustSignal.test.tsx",
      "src/components/ui/TrustBadge.test.tsx",
    ],
    risk: "Detail quality depends on correct photo URLs, seller identity data, and page rendering stability.",
    gapLevel: "Medium",
    gapNote: "Core rendering and trust components are covered, but the full detail-page journey has lighter browser depth than search or auth.",
  },
  {
    id: "auth-account",
    title: "Authentication and account",
    confidence: "Confirmed from code",
    summary: "Password auth, Google auth, account recovery, password policies, and session-aware UI.",
    routes: ["/auth/login", "/auth/register", "/auth/reset-password", "/moj-ucet"],
    components: [
      "src/components/AuthModal/index.tsx",
      "src/components/auth/AuthEntryPage.tsx",
      "src/context/AuthContext.tsx",
    ],
    server: [
      "src/lib/auth/password-flow.ts",
      "src/lib/auth/oauth-redirect.ts",
      "src/app/auth/callback/route.ts",
      "src/app/api/account/password/route.ts",
    ],
    data: ["profiles", "site_admins"],
    services: ["Supabase", "Resend", "Google Identity Services"],
    tests: [
      "src/components/AuthModal.email-flow.test.tsx",
      "src/components/AuthModal.password-strength.test.tsx",
      "src/lib/auth/oauth-redirect.test.ts",
      "src/lib/auth/admin-mfa.test.ts",
    ],
    risk: "Auth touches redirects, email delivery, MFA posture, and multiple protected routes.",
    gapLevel: "Low",
    gapNote: "This area has strong unit and security-focused coverage across auth logic and protected-route behavior.",
  },
  {
    id: "listing-ops",
    title: "Listing creation and seller operations",
    confidence: "Confirmed from code",
    summary: "Wizard-driven listing creation, photo handling, and dashboard management for ads.",
    routes: ["/pridat-inzerat", "/upravit-inzerat/[id]", "/moje-inzeraty", "/dealer"],
    components: [
      "src/app/(site)/pridat-inzerat/AdWizardClient.tsx",
      "src/components/wizard/steps/Step1Category.tsx",
      "src/components/wizard/steps/Step5PhotosPrice.tsx",
      "src/app/(site)/dealer/DealerDashboardClient.tsx",
    ],
    server: [
      "src/app/api/images/upload-url/route.ts",
      "src/lib/upload/image-validation.ts",
      "src/lib/dealer/bulk-actions.ts",
      "src/lib/validation/listings.ts",
    ],
    data: ["ads", "dealers", "credit_transactions"],
    services: ["Supabase", "Cloudflare Images"],
    tests: [
      "src/utils/upload.test.ts",
      "src/lib/dealer/bulk-actions.test.ts",
      "src/app/api/account/ads/mark-sold/route.test.ts",
    ],
    risk: "This flow mixes media, form validation, credits, and seller authorization.",
    gapLevel: "High",
    gapNote: "Pieces are covered, but there is still no single browser storyline for create -> publish/spend -> sell lifecycle.",
  },
  {
    id: "credits-payments",
    title: "Credits and payments",
    confidence: "Confirmed from code",
    summary: "Credit packs, Stripe checkout, webhook verification, and revenue visibility in admin.",
    routes: ["/kredity", "/kredity/uspech", "/api/stripe/checkout", "/api/stripe/webhook", "/admin"],
    components: [
      "src/app/(site)/kredity/CreditsPageClient.tsx",
      "src/components/payments/AcceptedPaymentMethods.tsx",
      "src/app/(site)/admin/components/AdminRevenue.tsx",
    ],
    server: [
      "src/lib/stripe/client.ts",
      "src/app/api/stripe/checkout/route.ts",
      "src/app/api/stripe/webhook/route.ts",
      "src/lib/admin/revenue.ts",
    ],
    data: ["credit_transactions", "credit_packages", "stripe_webhook_logs", "payment_notifications"],
    services: ["Stripe", "Supabase", "Resend"],
    tests: [
      "src/app/api/stripe/webhook/route.test.ts",
      "src/app/api/stripe/checkout/route.rate-limit.test.ts",
      "src/app/api/stripe/checkout/route.idempotency.test.ts",
    ],
    risk: "Payment correctness depends on webhook verification, idempotency, and server-side credit updates.",
    gapLevel: "Low",
    gapNote: "High-risk area, but direct checkout/webhook/idempotency coverage is already strong.",
  },
  {
    id: "inquiries-alerts",
    title: "Inquiries, saved items, and alerts",
    confidence: "Confirmed from code",
    summary: "Buyer-seller contact, saved searches, saved ads, and outbound alert delivery.",
    routes: ["/spravy", "/ulozene", "/api/inquiries", "/api/account/saved-searches", "/api/cron/send-alerts"],
    components: [
      "src/components/account/SavedSearchesPanel.tsx",
      "src/components/search/SaveSearchButton.tsx",
    ],
    server: [
      "src/lib/inquiries/submit-inquiry.ts",
      "src/lib/inquiries/conversations.ts",
      "src/lib/search/saved-searches.ts",
      "src/lib/email/send-marketplace-alerts.ts",
    ],
    data: ["inquiries", "saved_ads", "saved_searches", "saved_ad_alert_preferences", "email_jobs"],
    services: ["Supabase", "Resend", "Vercel Cron"],
    tests: [
      "src/lib/inquiries/submit-inquiry.test.ts",
      "src/lib/inquiries/conversations.test.ts",
      "src/lib/search/saved-searches.test.ts",
    ],
    risk: "These flows combine user data ownership, rate limiting, email queues, and seller messaging.",
    gapLevel: "Medium",
    gapNote: "Core messaging logic is covered well, but cron-driven alert delivery still has lighter direct route coverage.",
  },
  {
    id: "admin-monitoring",
    title: "Admin, moderation, and monitoring",
    confidence: "Confirmed from code",
    summary: "Internal operations console for settings, moderation, logs, analytics, quality gates, and email delivery.",
    routes: ["/admin", "/nastavenia", "/api/admin/quality-gates", "/api/monitoring/quality-gates"],
    components: [
      "src/app/(site)/admin/AdminDashboardClient.tsx",
      "src/app/(site)/admin/components/AdminModeration.tsx",
      "src/app/(site)/admin/components/AdminEmails.tsx",
      "src/app/(site)/admin/components/AdminQualityGates.tsx",
    ],
    server: [
      "src/app/(site)/admin/actions.ts",
      "src/app/api/admin/quality-gates/route.ts",
      "src/app/api/monitoring/quality-gates/route.ts",
    ],
    data: ["listing_reports", "dealer_verification_requests", "system_logs", "admin_audit_logs", "email_deliveries"],
    services: ["Supabase", "Stripe", "Resend"],
    tests: [
      "tests/release-gauntlet.test.ts",
      "src/app/api/admin/quality-gates/route.test.ts",
      "src/app/api/monitoring/quality-gates/route.test.ts",
    ],
    risk: "Admin routes require strict RBAC and are the main operational surface for high-impact actions.",
    gapLevel: "Medium",
    gapNote: "Important admin routes are covered, but some dashboard truth still depends on external system state and ops wiring.",
  },
];

export const CHANGE_GUIDES = [
  {
    id: "search",
    title: "Search",
    whatChanges:
      "Results behavior, URL-state mapping, Algolia config, fallback search, and SEO inventory pages usually move together.",
    startHere: [
      "src/app/(site)/vysledky/AlgoliaSearchPageClient.tsx",
      "src/lib/algolia/index.ts",
      "src/app/api/search/catalog/route.ts",
    ],
    routes: ["/", "/vysledky", "/api/search/catalog", "/api/search/count"],
    services: ["Algolia", "Supabase", "Cloudflare Images"],
    tables: ["ads", "brands", "models"],
    tests: [
      "tests/e2e.test.ts",
      "tests/release-gauntlet.test.ts",
      "src/lib/algolia/fallback-search.test.ts",
    ],
    risk: "Search regressions can break both buyer UX and SEO-facing discovery paths.",
    featureIds: ["marketplace-discovery"],
  },
  {
    id: "auth",
    title: "Auth",
    whatChanges:
      "Auth work usually touches entry UI, Supabase session flow, redirects, recovery/reset, and permission-sensitive routes.",
    startHere: [
      "src/components/AuthModal/index.tsx",
      "src/lib/auth/password-flow.ts",
      "src/app/api/account/password/route.ts",
    ],
    routes: ["/auth/login", "/auth/register", "/auth/reset-password", "/api/auth/password-reset"],
    services: ["Supabase", "Resend", "Google Identity Services"],
    tables: ["profiles", "site_admins"],
    tests: [
      "src/components/AuthModal.email-flow.test.tsx",
      "src/lib/auth/password-flow.test.ts",
      "src/app/api/auth/password-reset/route.security.test.ts",
    ],
    risk: "Small redirect or session mistakes can lock users out or weaken protected flows.",
    featureIds: ["auth-account"],
  },
  {
    id: "payments",
    title: "Payments",
    whatChanges:
      "Credit-pack UI, checkout metadata, webhook verification, balance mutation, and payment emails all need to stay aligned.",
    startHere: [
      "src/app/(site)/kredity/CreditsPageClient.tsx",
      "src/app/api/stripe/checkout/route.ts",
      "src/app/api/stripe/webhook/route.ts",
    ],
    routes: ["/kredity", "/kredity/uspech", "/api/stripe/checkout", "/api/stripe/webhook"],
    services: ["Stripe", "Supabase", "Resend"],
    tables: ["profiles", "credit_transactions", "stripe_webhook_logs", "payment_notifications"],
    tests: [
      "src/app/api/stripe/webhook/route.test.ts",
      "src/app/api/stripe/checkout/route.idempotency.test.ts",
      "src/app/api/stripe/checkout/route.rate-limit.test.ts",
    ],
    risk: "This is release-critical. A regression can mis-credit users or break paid seller actions.",
    featureIds: ["credits-payments"],
  },
  {
    id: "listing-wizard",
    title: "Listing wizard",
    whatChanges:
      "Seller flow work usually spans wizard UI, validation, photo upload, credit-backed actions, and downstream ad state.",
    startHere: [
      "src/app/(site)/pridat-inzerat/AdWizardClient.tsx",
      "src/app/api/images/upload-url/route.ts",
      "src/lib/validation/listings.ts",
    ],
    routes: ["/pridat-inzerat", "/upravit-inzerat/[id]", "/api/images/upload-url", "/api/account/ads"],
    services: ["Supabase", "Cloudflare Images"],
    tables: ["ads", "dealers", "credit_transactions"],
    tests: [
      "src/utils/upload.test.ts",
      "src/lib/dealer/bulk-actions.test.ts",
      "src/app/api/account/ads/mark-sold/route.test.ts",
    ],
    risk: "This area is still the easiest place to create multi-step seller regressions.",
    featureIds: ["listing-ops"],
  },
  {
    id: "admin",
    title: "Admin",
    whatChanges:
      "Admin work usually touches dashboard UI, server actions, RBAC checks, moderation data, and quality-gate ingestion.",
    startHere: [
      "src/app/(site)/admin/AdminDashboardClient.tsx",
      "src/app/(site)/admin/actions.ts",
      "src/app/api/admin/quality-gates/route.ts",
    ],
    routes: ["/admin", "/nastavenia", "/api/admin/quality-gates", "/api/monitoring/quality-gates"],
    services: ["Supabase", "Stripe", "Resend"],
    tables: ["listing_reports", "dealer_verification_requests", "system_logs", "admin_audit_logs"],
    tests: [
      "tests/release-gauntlet.test.ts",
      "src/app/api/admin/quality-gates/route.test.ts",
      "src/app/api/monitoring/quality-gates/route.test.ts",
    ],
    risk: "Admin mistakes have a high blast radius because they combine privilege, ops visibility, and moderation actions.",
    featureIds: ["admin-monitoring"],
  },
];

export const SERVICE_ATLAS = [
  {
    name: "Next.js App Router",
    category: "App core",
    why: "Drives pages, layouts, route handlers, server rendering, and metadata files.",
    usedBy: "All user-facing and API surfaces.",
    env: ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL"],
    files: ["src/app", "src/components", "src/proxy.ts"],
    tests: ["tests/e2e.test.ts", "tests/web-interface-guidelines.test.ts"],
    risk: "If page rendering or route handlers fail, the whole product is directly affected.",
    truth: "Confirmed from code",
  },
  {
    name: "Supabase",
    category: "Data, auth, RBAC",
    why: "Handles auth, database persistence, row-level security, server/admin clients, and many seller/admin flows.",
    usedBy: "Auth, listings, credits, inquiries, saved items, admin, emails, analytics.",
    env: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN",
    ],
    files: [
      "src/lib/supabase/server.ts",
      "src/lib/supabase/client.ts",
      "src/lib/auth/rbac.ts",
      "supabase/migrations",
    ],
    tests: [
      "supabase/tests/rls-critical-policy-posture.test.sql",
      "src/app/api/account/phone/route.security.test.ts",
      "src/lib/auth/admin-mfa.test.ts",
    ],
    risk: "Supabase is the most central dependency. Auth, persistence, and protected reads or writes all depend on it.",
    truth: "Confirmed from code and docs",
  },
  {
    name: "Algolia",
    category: "Search",
    why: "Provides low-latency listing search, faceting, sorting, and query-driven results pages.",
    usedBy: "Homepage suggestions, results page, SEO inventory logic, search sync jobs.",
    env: [
      "NEXT_PUBLIC_ALGOLIA_APP_ID",
      "NEXT_PUBLIC_ALGOLIA_SEARCH_KEY",
      "ALGOLIA_ADMIN_KEY",
      "ALGOLIA_SYNC_SECRET",
    ],
    files: [
      "src/lib/algolia/index.ts",
      "src/app/(site)/vysledky/AlgoliaSearchPageClient.tsx",
      "src/app/api/algolia/sync/route.ts",
    ],
    tests: [
      "src/lib/algolia/route-sync.test.ts",
      "src/lib/algolia/fallback-search.test.ts",
      "tests/release-gauntlet.test.ts",
    ],
    risk: "Search quality depends on Algolia configuration, index sync, and the monitored fallback path.",
    truth: "Confirmed from code and docs",
  },
  {
    name: "Stripe",
    category: "Payments",
    why: "Creates checkout sessions and confirms payment completion through webhook events.",
    usedBy: "Credit purchases, admin revenue reporting, payment notifications.",
    env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    files: [
      "src/lib/stripe/client.ts",
      "src/app/api/stripe/checkout/route.ts",
      "src/app/api/stripe/webhook/route.ts",
    ],
    tests: [
      "src/app/api/stripe/webhook/route.test.ts",
      "src/app/api/stripe/checkout/route.idempotency.test.ts",
      "src/app/api/stripe/checkout/route.rate-limit.test.ts",
    ],
    risk: "Payment correctness, credit balances, and confirmation emails depend on this flow staying exact.",
    truth: "Confirmed from code and docs",
  },
  {
    name: "Resend + React Email",
    category: "Outbound email",
    why: "Sends auth emails, payment emails, moderation emails, saved-search alerts, and queued jobs.",
    usedBy: "Auth, payment confirmation, alerts, moderation, admin email center.",
    env: ["RESEND_API_KEY", "EMAIL_FROM", "EMAIL_REPLY_TO"],
    files: [
      "src/lib/email/transactional-email.ts",
      "src/lib/email/react-email-templates.tsx",
      "src/lib/email/jobs.ts",
    ],
    tests: [
      "src/lib/email/react-email-templates.test.ts",
      "src/components/AuthModal.email-flow.test.tsx",
    ],
    risk: "Email delivery is operationally important for auth and alerts, but failures should stay visible rather than silent.",
    truth: "Confirmed from code and docs",
  },
  {
    name: "Cloudflare Images",
    category: "Media",
    why: "Handles direct upload URLs, image delivery, and transform-based optimization for listing photos.",
    usedBy: "Listing wizard, detail pages, dashboards, dealer pages, homepage cards.",
    env: [
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_API_TOKEN",
      "CLOUDFLARE_IMAGES_REQUIRE_SIGNED_URLS",
    ],
    files: [
      "src/app/api/images/upload-url/route.ts",
      "src/utils/upload.ts",
      "src/lib/image-optimizer.ts",
    ],
    tests: ["src/utils/upload.test.ts", "src/lib/image-optimizer.test.ts"],
    risk: "Photo upload and quality are critical for marketplace trust and listing conversion.",
    truth: "Confirmed from code and docs",
  },
  {
    name: "Upstash Redis",
    category: "Rate limiting",
    why: "Provides infrastructure for rate limiting and strict route protection.",
    usedBy: "Sensitive auth, contact, and checkout flows.",
    env: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    files: ["src/lib/ratelimit.ts", "scripts/check-prod-rate-limit-env.mjs"],
    tests: ["src/lib/ratelimit.test.ts", "scripts/check-prod-rate-limit-env.test.mjs"],
    risk: "Missing production credentials are treated as release-blocking because strict routes fail closed.",
    truth: "Confirmed from code and docs",
  },
  {
    name: "Analytics transports",
    category: "Measurement",
    why: "Captures first-party analytics events and can forward to GA4 or PostHog when configured and consent allows it.",
    usedBy: "Core product analytics, operator dashboards, quality and KPI reporting.",
    env: [
      "NEXT_PUBLIC_GA_MEASUREMENT_ID",
      "NEXT_PUBLIC_POSTHOG_KEY",
      "NEXT_PUBLIC_POSTHOG_HOST",
    ],
    files: [
      "src/lib/analytics/events.ts",
      "src/lib/analytics/client.ts",
      "src/app/api/analytics/events/route.ts",
    ],
    tests: ["src/lib/analytics/events.test.ts", "src/lib/analytics/client.test.ts"],
    risk: "Analytics is less critical than auth or payments, but still important for product visibility and experimentation.",
    truth: "Confirmed from code and docs",
  },
  {
    name: "Vercel Cron + deployment",
    category: "Operations",
    why: "Runs scheduled API routes and hosts the production app build and env configuration.",
    usedBy: "Alert sending, email job processing, sold cleanup, ad expiration, deployment gates.",
    env: ["CRON_SECRET", "QUALITY_GATE_ALERT_ALLOWED_REPOSITORIES", "QUALITY_GATE_ALERT_OIDC_AUDIENCE"],
    files: [
      "src/app/api/cron/send-alerts/route.ts",
      "src/app/api/cron/process-email-jobs/route.ts",
      ".github/workflows",
    ],
    tests: ["tests/release-gauntlet.test.ts", "scripts/security-release-gate.test.mjs"],
    risk: "Misconfigured secrets or failed jobs can silently degrade alerts, cleanup, or monitoring unless surfaced.",
    truth: "Confirmed from code and docs",
  },
  {
    name: "Google Identity Services",
    category: "Auth convenience",
    why: "Supports Google OAuth and optional One Tap user entry points.",
    usedBy: "Auth modal and provider initialization.",
    env: ["NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN"],
    files: ["src/components/GoogleOneTap.tsx", "src/components/AuthModal/useAuthModal.ts"],
    tests: ["src/components/AuthModal.email-flow.test.tsx", "src/lib/security/csp.test.ts"],
    risk: "Helpful but secondary. Misconfiguration mainly affects sign-in convenience and redirect correctness.",
    truth: "Confirmed from code and docs",
  },
];

export const DATA_ATLAS = {
  profiles: "User profile records, credits, contact data, and account-level flags.",
  dealers: "Dealer profile and public seller identity data.",
  ads: "Primary vehicle listing records and publication state.",
  brands: "Brand taxonomy used in search and SEO routes.",
  models: "Vehicle models tied to brands.",
  credit_transactions: "Credit balance history and paid action accounting.",
  credit_packages: "Available credit bundles for purchase.",
  saved_ads: "User-saved listings.",
  saved_searches: "Saved result filters for alerts and return visits.",
  saved_ad_alert_preferences: "Per-user alert preferences linked to saved items.",
  inquiries: "Buyer-seller messages and conversation state.",
  listing_reports: "Reports and moderation inputs on listings.",
  dealer_verification_requests: "Dealer trust and verification workflow records.",
  stripe_webhook_logs: "Webhook dedupe, audit, and operational review data.",
  payment_notifications: "Payment-related user notifications.",
  email_deliveries: "Admin-visible log of delivery attempts or outcomes.",
  email_jobs: "Queued email jobs for cron processing.",
  contact_messages: "Inbound contact form submissions.",
  system_logs: "Operator-facing system diagnostics.",
  admin_audit_logs: "Admin action traceability.",
  analytics_events: "First-party event stream for analytics.",
  site_settings: "Config rows such as maintenance-related settings.",
  site_admins: "Admin entitlement rows.",
  feature_flags: "Runtime feature switches.",
  taxonomy_sync_runs: "Tracking rows for taxonomy import or sync operations.",
  idempotency_keys: "Replay protection records for critical actions.",
};

export const SECURITY_CONTROLS = [
  {
    title: "RLS and server-side RBAC",
    text: "Protected reads and writes rely on Supabase row-level policies plus explicit site-admin checks in server code.",
    files: ["supabase/migrations", "src/lib/auth/rbac.ts", "src/lib/auth/site-admin.ts"],
    truth: "Confirmed from code and docs",
  },
  {
    title: "Stripe signature verification and idempotency",
    text: "Webhooks are verified and payment side effects are guarded against duplicates or replay.",
    files: [
      "src/app/api/stripe/webhook/route.ts",
      "src/app/api/stripe/checkout/route.idempotency.test.ts",
      "supabase/migrations/20260213000200_idempotency_keys.sql",
    ],
    truth: "Confirmed from code and docs",
  },
  {
    title: "Rate limiting and fail-closed posture",
    text: "Sensitive routes use strict limiter behavior and production env guards to avoid shipping without required Redis credentials.",
    files: ["src/lib/ratelimit.ts", "scripts/check-prod-rate-limit-env.mjs"],
    truth: "Confirmed from code and docs",
  },
  {
    title: "CSRF, CSP, maintenance unlock, and request origin checks",
    text: "The app includes request hardening utilities to reduce token misuse, unsafe embeds, and untrusted maintenance access.",
    files: [
      "src/lib/security/csrf.ts",
      "src/lib/security/csp.ts",
      "src/lib/security/maintenance-bypass.ts",
      "src/lib/auth/request-origin.ts",
    ],
    truth: "Confirmed from code",
  },
  {
    title: "Fallback governance",
    text: "Fallbacks are treated as degraded operation, not success. They carry owners, thresholds, and review dates.",
    files: ["src/lib/fallbacks/registry.ts", "src/lib/fallbacks/monitor.ts"],
    truth: "Confirmed from code and docs",
  },
  {
    title: "Cron secret enforcement and CI posture checks",
    text: "Scheduled routes and GitHub-driven monitoring use explicit secret or OIDC checks before doing work.",
    files: [
      "src/lib/cron/route-helpers.ts",
      ".github/workflows/release-security-gate.yml",
      "scripts/github-actions-oidc-posture.mjs",
    ],
    truth: "Confirmed from code and docs",
  },
];

export const TROUBLESHOOTING = [
  {
    title: "Search looks broken or empty",
    check: [
      "Check Algolia keys and the results page runtime.",
      "Inspect `src/lib/algolia/index.ts` and fallback monitoring entries.",
      "Run `npm run test:e2e`, `npm run test:release-gauntlet`, and `npm run test:unit` for Algolia-related modules.",
    ],
  },
  {
    title: "Login or registration is failing",
    check: [
      "Check Supabase auth configuration and redirect allow-list.",
      "Inspect auth modal flow, callback route, and password reset endpoints.",
      "Run auth-focused unit tests plus `npm run test:release-gauntlet`.",
    ],
  },
  {
    title: "Credits or checkout are wrong",
    check: [
      "Inspect Stripe checkout route, webhook route, and credit transaction data.",
      "Confirm webhook secret and session metadata.",
      "Run Stripe unit tests and the release gauntlet.",
    ],
  },
  {
    title: "Photos fail to upload or look wrong",
    check: [
      "Check Cloudflare credentials and upload URL route behavior.",
      "Inspect image validation rules and optimizer usage.",
      "Run upload and image-optimizer unit tests.",
    ],
  },
  {
    title: "Alerts or transactional emails are missing",
    check: [
      "Inspect queued jobs, Resend config, and email-delivery tables.",
      "Check cron routes for alert or email job processing.",
      "Run email template tests and verify cron secrets.",
    ],
  },
  {
    title: "Admin page or moderation tools are inaccessible",
    check: [
      "Verify site-admin entitlements and RBAC checks.",
      "Inspect `/admin` redirect behavior and admin quality-gate routes.",
      "Run release gauntlet and admin route tests.",
    ],
  },
];

export const CHANGE_IMPACT = [
  {
    area: "Search",
    impact:
      "Touches results UI, Algolia client config, URL state mapping, fallback search, SEO inventory pages, sync jobs, and multiple browser suites.",
  },
  {
    area: "Auth",
    impact:
      "Touches Supabase session flows, callback redirects, auth UI, email delivery, security helpers, and protected-route tests.",
  },
  {
    area: "Payments",
    impact:
      "Touches checkout route, webhook processing, Supabase credit RPCs, email confirmations, admin revenue reporting, and release-critical tests.",
  },
  {
    area: "Listing wizard and photos",
    impact:
      "Touches validation, upload URLs, Cloudflare media behavior, dashboard edit flows, and seller-side controls.",
  },
  {
    area: "Admin and moderation",
    impact:
      "Touches RBAC, quality-gate ingestion, moderation tables, logs, feature flags, and protected route behavior.",
  },
  {
    area: "Emails and alerts",
    impact:
      "Touches templates, delivery adapters, cron processing, saved-search logic, and admin email center visibility.",
  },
];

export const DB_RELATIONSHIPS = [
  {
    table: "profiles",
    related: [
      "ads",
      "dealers",
      "saved_ads",
      "saved_searches",
      "inquiries",
      "credit_transactions",
      "dealer_verification_requests",
    ],
    story:
      "Profiles is the account anchor. Most user-owned rows attach here before they branch into listings, messages, saved state, or credits.",
    truth: "Confirmed from code and docs",
  },
  {
    table: "dealers",
    related: ["profiles", "ads", "dealer_verification_requests"],
    story:
      "Dealer records extend an account into a public seller identity with verification and dashboard behavior layered on top.",
    truth: "Confirmed from code and docs",
  },
  {
    table: "ads",
    related: [
      "profiles",
      "dealers",
      "brands",
      "models",
      "saved_ads",
      "saved_searches",
      "inquiries",
      "listing_reports",
      "credit_transactions",
    ],
    story:
      "Ads is the marketplace center. Discovery, detail pages, alerts, inquiries, moderation, and paid seller actions all orbit this table.",
    truth: "Confirmed from code and docs",
  },
  {
    table: "saved_searches",
    related: ["profiles", "ads", "saved_ad_alert_preferences", "email_jobs"],
    story:
      "Saved searches capture buyer intent. Cron compares these filters against newer ads and can trigger alert delivery.",
    truth: "Confirmed from code",
  },
  {
    table: "credit_transactions",
    related: ["profiles", "credit_packages", "ads", "stripe_webhook_logs", "payment_notifications"],
    story:
      "Credit history ties payment confirmation to spendable balance and paid listing actions such as publishing or featuring.",
    truth: "Confirmed from code and docs",
  },
  {
    table: "inquiries",
    related: ["profiles", "ads"],
    story:
      "Inquiry rows connect buyers and sellers around one listing and power the messaging surface.",
    truth: "Confirmed from code",
  },
  {
    table: "listing_reports",
    related: ["profiles", "ads", "admin_audit_logs"],
    story:
      "Listing reports create the moderation trail from community input into admin review and action history.",
    truth: "Confirmed from code",
  },
  {
    table: "email_jobs",
    related: ["profiles", "saved_searches", "payment_notifications", "email_deliveries"],
    story:
      "Queued email jobs hold deferred outbound work so alerts and transactional sends can be retried and inspected operationally.",
    truth: "Confirmed from code",
  },
];

export const STATE_LIFECYCLES = [
  {
    title: "Listing lifecycle",
    summary: "How a seller listing moves from creation into its visible marketplace states.",
    stages: ["Draft", "Pending review", "Active", "Sold or expired"],
    routes: [
      "/pridat-inzerat",
      "/upravit-inzerat/[id]",
      "/api/account/ads",
      "/api/account/ads/resubmit",
      "/api/account/ads/mark-sold",
      "/api/cron/expire-ads",
    ],
    tables: ["ads", "credit_transactions"],
    tests: [
      "src/app/api/account/ads/mark-sold/route.test.ts",
      "src/app/api/account/ads/resubmit/route.test.ts",
      "tests/release-gauntlet.test.ts",
    ],
    truth: "Confirmed from code",
  },
  {
    title: "Credit purchase lifecycle",
    summary: "How a user buys credits and how the balance is updated only after verified server-side confirmation.",
    stages: [
      "Pack selected",
      "Checkout session created",
      "Stripe payment completed",
      "Webhook verified",
      "Credits + notifications recorded",
    ],
    routes: ["/kredity", "/api/stripe/checkout", "/api/stripe/webhook", "/kredity/uspech"],
    tables: ["profiles", "credit_transactions", "stripe_webhook_logs", "payment_notifications"],
    tests: [
      "src/app/api/stripe/webhook/route.test.ts",
      "src/app/api/stripe/checkout/route.idempotency.test.ts",
      "tests/release-gauntlet.test.ts",
    ],
    truth: "Confirmed from code and docs",
  },
  {
    title: "Inquiry lifecycle",
    summary: "How a buyer message is created, stored, and updated through the messaging flow.",
    stages: ["Submitted", "Visible in conversation", "Seen or updated", "Closed in practice"],
    routes: ["/spravy", "/api/inquiries", "/auto/[id]"],
    tables: ["inquiries", "ads", "profiles"],
    tests: [
      "src/app/api/inquiries/route.test.ts",
      "src/lib/inquiries/submit-inquiry.test.ts",
      "src/lib/inquiries/conversations.test.ts",
    ],
    truth: "Confirmed from code",
  },
  {
    title: "Saved-search alert lifecycle",
    summary: "How discovery preferences turn into later reminder or alert behavior.",
    stages: [
      "Search saved",
      "Preference stored",
      "Cron scans fresh ads",
      "Alert sent or queued",
      "Last notified pointer updated",
    ],
    routes: [
      "/ulozene",
      "/api/account/saved-searches",
      "/api/cron/send-alerts",
      "/api/cron/process-email-jobs",
    ],
    tables: ["saved_searches", "saved_ad_alert_preferences", "ads", "email_jobs", "email_deliveries"],
    tests: [
      "src/lib/search/saved-searches.test.ts",
      "src/lib/email/react-email-templates.test.ts",
      "tests/release-gauntlet.test.ts",
    ],
    truth: "Confirmed from code",
  },
  {
    title: "Email job lifecycle",
    summary: "How deferred outbound email work is queued, claimed, and resolved.",
    stages: ["Queued", "Claimed by cron", "Sent", "Failed and visible to operators"],
    routes: ["/api/cron/process-email-jobs", "/admin"],
    tables: ["email_jobs", "email_deliveries"],
    tests: [
      "src/lib/email/react-email-templates.test.ts",
      "tests/release-gauntlet.test.ts",
    ],
    truth: "Confirmed from code",
  },
];

export const EXTERNAL_SETUP_ATLAS = [
  {
    name: "Supabase project and Auth console",
    livesIn: "Supabase dashboard",
    neededFor: "Database, auth sessions, redirect allow-list, RLS-backed product data.",
    outsideRepo: [
      "Redirect allow-list for local and production auth callbacks.",
      "Project URL, anon key, and service-role key management.",
      "Storage/auth console settings that are not fully represented in Git.",
    ],
    env: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN",
    ],
    truth: "Confirmed from code and docs",
  },
  {
    name: "Stripe dashboard and webhook endpoint",
    livesIn: "Stripe dashboard",
    neededFor: "Credit-pack checkout, webhook delivery, and revenue visibility.",
    outsideRepo: [
      "Live products/prices and the checkout configuration they imply.",
      "Webhook registration pointed at `/api/stripe/webhook`.",
      "Webhook signing secret rotation and monitoring.",
    ],
    env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    truth: "Confirmed from code and docs",
  },
  {
    name: "Vercel project and cron scheduler",
    livesIn: "Vercel dashboard",
    neededFor: "Production hosting, env vars, domain wiring, and scheduled route execution.",
    outsideRepo: [
      "Project-level env vars for all services.",
      "Cron schedule wiring for `/api/cron/*` routes.",
      "Deployment state, domains, and preview/production separation.",
    ],
    env: ["CRON_SECRET", "QUALITY_GATE_ALERT_ALLOWED_REPOSITORIES", "QUALITY_GATE_ALERT_OIDC_AUDIENCE"],
    truth: "Confirmed from code and docs",
  },
  {
    name: "Resend sender domain",
    livesIn: "Resend dashboard + DNS",
    neededFor: "Auth, alert, and payment email delivery.",
    outsideRepo: [
      "Verified sending domain and DNS records.",
      "Sender identity and reply-to behavior.",
      "Operational deliverability outside the codebase.",
    ],
    env: ["RESEND_API_KEY", "EMAIL_FROM", "EMAIL_REPLY_TO"],
    truth: "Confirmed from code and docs",
  },
  {
    name: "Algolia application and indices",
    livesIn: "Algolia dashboard",
    neededFor: "Fast results pages, filtering, ranking, and search sync.",
    outsideRepo: [
      "Application credentials and per-environment indices.",
      "Ranking/faceting settings that influence results quality.",
      "Sync expectations between Supabase ads and Algolia records.",
    ],
    env: [
      "NEXT_PUBLIC_ALGOLIA_APP_ID",
      "NEXT_PUBLIC_ALGOLIA_SEARCH_KEY",
      "ALGOLIA_ADMIN_KEY",
      "ALGOLIA_SYNC_SECRET",
    ],
    truth: "Confirmed from code and docs",
  },
  {
    name: "Upstash Redis instance",
    livesIn: "Upstash dashboard",
    neededFor: "Strict rate limiting on sensitive endpoints.",
    outsideRepo: [
      "REST URL and token lifecycle.",
      "Environment-specific Redis instances.",
      "Operational visibility when strict routes fail closed.",
    ],
    env: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    truth: "Confirmed from code and docs",
  },
  {
    name: "Cloudflare Images delivery config",
    livesIn: "Cloudflare dashboard",
    neededFor: "Listing photo upload and optimized delivery.",
    outsideRepo: [
      "Account permissions and API token scope.",
      "Image delivery/signing posture.",
      "Any custom delivery-domain decisions.",
    ],
    env: ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_IMAGES_REQUIRE_SIGNED_URLS"],
    truth: "Confirmed from code and docs",
  },
  {
    name: "Cloudflare Turnstile",
    livesIn: "Cloudflare dashboard",
    neededFor: "Public abuse protection on inquiry and report-style forms.",
    outsideRepo: [
      "Site key and secret registration.",
      "Allowed domains and challenge posture.",
      "Monitoring on public anti-abuse flow.",
    ],
    env: ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
    truth: "Inferred / needs external verification",
  },
  {
    name: "VINCARIO VIN decode account",
    livesIn: "VINCARIO dashboard",
    neededFor: "VIN decode assistance in seller flows.",
    outsideRepo: [
      "API credential issuance and quota.",
      "Provider-side response and rate-limit behavior.",
      "Any production allow-listing outside the repo.",
    ],
    env: ["VINCARIO_API_KEY"],
    truth: "Confirmed from code and docs",
  },
  {
    name: "Google identity / OAuth configuration",
    livesIn: "Supabase Auth + Google Cloud console",
    neededFor: "Google login and optional One Tap convenience.",
    outsideRepo: [
      "Google OAuth app registration.",
      "Allowed origins and callback setup.",
      "Any One Tap domain and consent behavior.",
    ],
    env: ["NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN"],
    truth: "Confirmed from code and docs",
  },
];

export const FRAGILITY_AREAS = [
  {
    title: "Results page browser instability",
    summary:
      "The results page remains one of the most behavior-heavy surfaces: search state, routing, filters, and async rendering all meet there.",
    evidence:
      "Observed in local verification on 25 March 2026: `npm run test:web-interface` timed out on `/vysledky`, and `npm run test:mobile-matrix` hit one related landmark wait failure there.",
    tests: ["tests/web-interface-guidelines.test.ts", "tests/release-gauntlet.test.ts"],
    truth: "Observed in local verification on 25 March 2026",
  },
  {
    title: "Accessibility contrast debt across key pages",
    summary:
      "Several core routes still fail automated color-contrast checks, which means UI polish and accessibility debt are overlapping today.",
    evidence:
      "Observed in local verification on 25 March 2026: `npm run test:a11y` and `npm run test:mobile-matrix` flagged contrast failures on `/`, `/vysledky`, `/auth/login`, `/auth/register`, `/kredity`, `/zmluva`, and `/kontakt`.",
    tests: ["tests/accessibility-gate.test.ts", "tests/reflow-zoom.test.ts"],
    truth: "Observed in local verification on 25 March 2026",
  },
  {
    title: "Search depends on coordinated fallback behavior",
    summary:
      "Search is fast because Algolia is central, but that also means search correctness depends on index sync, client config, URL-state mapping, and monitored fallback behavior staying aligned.",
    evidence:
      "Confirmed from code and docs: search uses Algolia, an API fallback catalog route, and fallback governance telemetry.",
    tests: [
      "src/lib/algolia/fallback-search.test.ts",
      "src/lib/algolia/route-sync.test.ts",
      "tests/release-gauntlet.test.ts",
    ],
    truth: "Confirmed from code and docs",
  },
  {
    title: "Credits and payments have high blast radius",
    summary:
      "The Stripe flow is well protected, but if it regresses the impact is immediate: credit balances, paid actions, and user trust all suffer together.",
    evidence:
      "Confirmed from code and docs: checkout, webhook verification, idempotency, and credit mutation are tightly coupled.",
    tests: [
      "src/app/api/stripe/webhook/route.test.ts",
      "src/app/api/stripe/checkout/route.idempotency.test.ts",
      "src/app/api/stripe/checkout/route.rate-limit.test.ts",
    ],
    truth: "Confirmed from code and docs",
  },
  {
    title: "External dashboard truth is still partly outside Git",
    summary:
      "Some runtime behavior depends on dashboard state we cannot fully diff or review in the repo alone.",
    evidence:
      "Known repo gap: Stripe products/webhooks, Resend domain status, some Supabase console settings, and final Vercel cron timing require external confirmation.",
    tests: ["scripts/check-prod-rate-limit-env.test.mjs", "scripts/security-release-gate.test.mjs"],
    truth: "Inferred / needs external verification",
  },
];

export const TEST_GAPS = [
  {
    area: "Cron routes",
    summary:
      "The cron handlers are important, but the repo currently shows much stronger indirect coverage than direct route-level tests for send-alerts, process-email-jobs, expire-ads, and cleanup-sold.",
    whyItMatters:
      "Background failures are easy to miss because the user does not trigger them manually in the UI.",
    truth: "Confirmed from code",
  },
  {
    area: "VIN decode and taxonomy APIs",
    summary:
      "The repo currently shows little or no direct automated coverage for the VIN decode path and public vehicle taxonomy route.",
    whyItMatters:
      "These integrations depend on external data contracts and are easier to break silently.",
    truth: "Confirmed from code",
  },
  {
    area: "End-to-end seller lifecycle",
    summary:
      "There is coverage around pieces of listing management, but not one obvious browser storyline that follows create listing -> publish/spend credits -> resubmit or mark sold.",
    whyItMatters:
      "The seller journey crosses UI, media, auth, credits, and listing-state changes.",
    truth: "Inferred from code structure",
  },
  {
    area: "External configuration verification",
    summary:
      "Repo tests can assert code posture and env presence, but they cannot fully prove third-party dashboard state such as webhook registration, DNS verification, or provider quotas.",
    whyItMatters:
      "Production can still fail even when local code and unit tests are green.",
    truth: "Confirmed from code and docs",
  },
];

export const REPO_SECTIONS = [
  ["src/app", "Next.js pages, layouts, route handlers, metadata routes, and top-level app behavior."],
  ["src/components", "UI components, client flows, and route-level interaction building blocks."],
  ["src/lib", "Domain logic and adapters grouped by concern such as auth, search, email, or security."],
  ["src/config", "Business constants and site configuration values."],
  ["src/context", "React contexts such as auth/session state."],
  ["src/i18n", "Locale config and translation catalogs."],
  ["supabase", "Migrations, database posture, and SQL tests."],
  ["tests", "Browser-level Playwright suites and smoke-style checks."],
  ["scripts", "Repo tooling, audits, guards, imports, and maintenance helpers."],
  ["docs", "Project playbooks, checklists, and generated atlas output."],
];

export const COMMAND_ORDER = [
  "dev",
  "build",
  "lint",
  "test:unit",
  "test:e2e",
  "test:web-interface",
  "test:a11y",
  "test:keyboard",
  "test:mobile-matrix",
  "test:release-gauntlet",
  "test:db:rls",
  "audit:chrome-console",
  "check:prod-rate-limit-env",
  "test:security:release-gate",
  "links:ingest",
];

export const KNOWN_UNKNOWNS = [
  "Third-party console configuration is only partially visible from the repo. Stripe dashboard products, webhook registrations, Resend domain setup, and some Supabase console settings still need external verification.",
  "Cron schedules are partly documented in code and docs, but final production timing belongs to Vercel configuration outside this file.",
  "Some route-purpose descriptions are inferred from file names when the route is not described in docs.",
];
