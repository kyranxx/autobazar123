# Cleanup & Improvement Tasks for kyranxx/autobazar123

## Repository
`kyranxx/autobazar123` — Next.js 16 + React 19 + TypeScript app

## Tasks to Complete

### 1. Remove `@heroicons/react` and migrate to `lucide-react`
- Remove `@heroicons/react` from `package.json` dependencies
- Search entire codebase for any imports from `@heroicons/react` (e.g. `import { XIcon } from '@heroicons/react/24/outline'`)
- Replace each Heroicon usage with the equivalent `lucide-react` icon (e.g. `XIcon` → `X`, `MagnifyingGlassIcon` → `Search`, `ChevronDownIcon` → `ChevronDown`)
- `lucide-react` is already installed — do NOT add it again
- Verify no remaining `@heroicons` imports exist after migration

### 2. Remove deprecated `@types/dotenv`
- Remove `@types/dotenv` from `devDependencies` in `package.json`
- `dotenv` ships its own types — this package is deprecated and unnecessary

### 3. Replace Puppeteer with Playwright for E2E testing
- Remove `puppeteer` and `@types/puppeteer` (if exists) from `devDependencies`
- Add `@playwright/test` to `devDependencies`
- Rewrite the following test files to use Playwright instead of Puppeteer:
  - `tests/e2e.test.ts` — convert to Playwright test format using `import { test, expect } from '@playwright/test'`
  - `tests/smoke-test.ts` — keep as a simple fetch-based smoke test (no Puppeteer dependency), this one is fine as-is since it only uses `fetch()`
  - `tests/link-and-mobile-test.ts` — convert Puppeteer browser automation to Playwright
  - `tests/webapp-audit.ts` — convert Puppeteer browser automation to Playwright
- Create a `playwright.config.ts` at the root with:
  - baseURL: `process.env.TEST_URL || 'http://localhost:3000'`
  - Use Chromium only (to match current Puppeteer behavior)
  - Output directory: `test-results/`
- Update `package.json` scripts:
  - `"test:e2e": "npx playwright test tests/e2e.test.ts"`
  - `"test:links": "npx playwright test tests/link-and-mobile-test.ts"`
  - `"audit:webapp": "npx playwright test tests/webapp-audit.ts"`
  - Keep `"test:smoke": "npx tsx tests/smoke-test.ts"` (it's fetch-only, no browser needed)
- Preserve ALL existing test logic/assertions — just migrate the API from Puppeteer to Playwright

### 4. Add Vitest for unit/integration testing
- Add `vitest` and `@testing-library/react` and `@testing-library/jest-dom` and `jsdom` to `devDependencies`
- Create `vitest.config.ts` at root with:
  - Environment: `jsdom` (for React component testing)
  - Include pattern: `src/**/*.test.ts`, `src/**/*.test.tsx`
  - Exclude: `node_modules`, `.next`, `tests/` (those are E2E/Playwright)
  - Setup file: `src/test-setup.ts`
- Create `src/test-setup.ts` that imports `@testing-library/jest-dom`
- Add `package.json` scripts:
  - `"test": "vitest"`
  - `"test:unit": "vitest run"`
  - `"test:unit:watch": "vitest --watch"`
  - `"test:coverage": "vitest run --coverage"`

#### Write real unit tests for the following:

**Utility functions** — find all utility/helper files (e.g. `lib/utils.ts`, `lib/format.ts`, `lib/helpers.ts`, etc.) and write tests for every exported function:
  - Test normal inputs, edge cases, empty/null/undefined inputs
  - File naming: colocate as `<filename>.test.ts` next to the source file

**React components** — pick the 5–10 most important/reusable UI components (e.g. buttons, cards, navigation, forms, search) and write tests that:
  - Verify they render without crashing
  - Verify key props change the output (e.g. variant, disabled, size)
  - Verify user interactions (clicks, input changes) trigger expected behavior
  - Verify conditional rendering (loading states, error states, empty states)
  - File naming: colocate as `<ComponentName>.test.tsx` next to the component file

**API/data functions** — if there are data-fetching utilities, validation schemas (Zod), or API route handlers, write tests for:
  - Zod schema validation: valid input passes, invalid input fails with correct errors
  - Data transformation functions: correct output for given input
  - Edge cases: missing fields, wrong types, boundary values

**Goal**: When running `npm run test:unit`, there should be **real, meaningful, passing tests** that demonstrate the framework works and provide actual coverage. Aim for at least **30+ test cases** across the codebase.

### 5. Update Cloudflare Worker dependencies
- In `cloudflare-worker/package.json`:
  - Update `@cloudflare/workers-types` from `^4.20240117.0` to `^4` (latest)
  - Update `wrangler` from `^3.0.0` to `^3` (latest within v3)

### 6. Remove Batchfile(s) if they exist
- Search for any `.bat` or `.cmd` files in the repository
- If they are deployment or build scripts that duplicate existing `.sh` scripts, delete them
- If they serve a unique purpose that no `.sh` file covers, leave them

### 7. Update TECHNOLOGIES.md
- If `TECHNOLOGIES.md` exists at root, update it to reflect all the changes made above:
  - Remove `@heroicons/react` from the listed technologies
  - Remove `@types/dotenv`
  - Replace Puppeteer with Playwright in the testing section
  - Add Vitest to the testing section
  - Note updated Cloudflare Worker versions

## Important Rules
- Do NOT change any application/business logic code
- Do NOT upgrade Next.js, React, Zod, or any other dependency versions beyond what's specified above
- Do NOT modify the `radix-ui`, `class-variance-authority`, `clsx`, or `tailwind-merge` packages — they are correct as-is
- Run `npm run lint` after all changes to verify no lint errors
- Run `npm run build` to verify the project still builds
- Commit with clear, conventional commit messages (e.g. `refactor: migrate from Puppeteer to Playwright`)