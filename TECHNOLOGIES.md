# Technologies Used in autobazar123

## Language Composition (by codebase %)

| Language | Percentage | Usage |
|---|---|---|
| **TypeScript** | 94.7% | Primary application language for frontend, backend, tests, and scripts |
| **PLpgSQL** | 3.1% | Supabase/PostgreSQL database functions and migrations |
| **CSS** | 1.2% | Styling (with Tailwind CSS utilities) |
| **Shell** | 0.3% | Deployment and automation scripts |
| **JavaScript** | 0.3% | Config files and auxiliary scripts |
| **HTML** | 0.3% | Static markup and templates |

---

## Frameworks and Libraries

### Core Framework

| Technology | Version | Role |
|---|---|---|
| **Next.js** | ^16.1.6 | Full-stack React framework (App Router) |
| **React** | 19.2.3 | UI rendering |
| **React DOM** | 19.2.3 | Browser DOM bindings |
| **TypeScript** | ^5 | Static typing across the codebase |

### Backend and Data

| Technology | Version | Role |
|---|---|---|
| **Supabase** (`@supabase/supabase-js`) | ^2.89.0 | PostgreSQL database, auth, storage |
| **Supabase SSR** (`@supabase/ssr`) | ^0.8.0 | Server-side Supabase client for Next.js |
| **Stripe** | ^20.1.1 | Payment processing |
| **Zod** | ^4.3.5 | Schema validation |

### Search

| Technology | Version | Role |
|---|---|---|
| **Algolia** (`algoliasearch`) | ^5.46.3 | Search engine |
| **Algolia Autocomplete** (`@algolia/autocomplete-js`) | ^1.19.4 | Autocomplete UI |
| **Algolia Query Suggestions** | ^1.19.4 | Search suggestions |
| **React InstantSearch** | ^7.22.1 | React search components |
| **React InstantSearch Next.js** | ^1.0.11 | Next.js integration for search |

### UI and Styling

| Technology | Version | Role |
|---|---|---|
| **Tailwind CSS** | ^4 | Utility-first CSS framework |
| **Radix UI** | ^1.4.3 | Accessible headless UI primitives |
| **shadcn/ui** | ^3.8.4 | Pre-built Radix + Tailwind components |
| **Lucide React** | ^0.564.0 | Icon library |
| **cmdk** | ^1.1.1 | Command palette component |
| **Sonner** | ^2.0.7 | Toast notifications |
| **CVA** (`class-variance-authority`) | ^0.7.1 | Component variant styling |
| **clsx** | ^2.1.1 | Conditional class names |
| **tailwind-merge** | ^3.4.0 | Tailwind class merging |
| **tw-animate-css** | ^1.4.0 | Tailwind animation utilities |

### Maps

| Technology | Version | Role |
|---|---|---|
| **Leaflet** | ^1.9.4 | Interactive maps |

### Internationalization

| Technology | Version | Role |
|---|---|---|
| **next-intl** | ^4.7.0 | i18n/translations for Next.js |

### Rate Limiting and Caching

| Technology | Version | Role |
|---|---|---|
| **Upstash Redis** (`@upstash/redis`) | ^1.36.1 | Serverless Redis |
| **Upstash Rate Limit** (`@upstash/ratelimit`) | ^2.0.8 | API rate limiting |

### Infrastructure and Edge

| Technology | Version | Role |
|---|---|---|
| **Cloudflare Workers** (`wrangler`) | ^3 | Edge cron worker tooling |
| **Cloudflare Workers Types** (`@cloudflare/workers-types`) | ^4 | TypeScript types for Workers |

### Testing and Dev Tools

| Technology | Version | Role |
|---|---|---|
| **Playwright Test** (`@playwright/test`) | ^1.57.0 | E2E/browser automation testing (Chromium) |
| **Vitest** | ^4.0.0 | Unit and integration testing framework |
| **Testing Library React** (`@testing-library/react`) | ^16.3.0 | React component testing utilities |
| **Testing Library jest-dom** (`@testing-library/jest-dom`) | ^6.9.1 | DOM assertions for tests |
| **jsdom** | ^27.2.0 | Browser-like test environment for unit tests |
| **tsx** | ^4.21.0 | TypeScript script execution |
| **ESLint** | ^9.39.2 | Code linting |
| **eslint-config-next** | 16.1.1 | Next.js-specific lint rules |
| **cross-env** | ^10.1.0 | Cross-platform env variables |
| **dotenv** | ^17.2.4 | Environment variable loading |
| **@next/bundle-analyzer** | ^16.1.6 | Bundle size analysis |

---

## Architecture Summary

This repository is a full-stack **Next.js 16** application built in TypeScript, backed by **Supabase** (PostgreSQL + Auth) and **Stripe** for payments. It uses **Algolia** for search, **Leaflet** for maps, **Tailwind CSS + Radix/shadcn** for UI, and **Upstash Redis** for rate limiting. A separate **Cloudflare Worker** handles background cron jobs. Testing now uses **Playwright** for E2E/browser automation and **Vitest + Testing Library** for unit and component coverage.
