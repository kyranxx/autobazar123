# Playwright CLI (Local Debugging)

This project uses **Puppeteer** scripts for CI checks. Use **Playwright CLI** for fast local UI debugging (console/network inspection, hydration mismatch repros, quick journeys) without writing scripts.

## Install

Recommended (global install):

```bash
npm install -g @playwright/cli@latest
playwright-cli --help
```

Alternative (no global install):

```bash
npx -y @playwright/cli@latest --help
```

If the CLI asks for a browser:

```bash
playwright-cli install-browser
```

## Quick Start

1. Start the app:

```bash
npm run dev
```

2. Open a headed browser (adjust the port if needed, e.g. `3001`):

```bash
playwright-cli open http://localhost:3000 --headed
```

3. Snapshot and interact using element refs:

```bash
playwright-cli snapshot
playwright-cli click e12
playwright-cli snapshot
```

4. Inspect problems:

```bash
playwright-cli console warning
playwright-cli network
```

## Hydration Mismatch Checklist (Extension vs App Code)

Hydration mismatches can be caused by browser extensions injecting attributes into the DOM before React hydrates.

To quickly check whether the issue is extension-related:

1. Reproduce in your normal Chrome profile (as usual).
2. Reproduce in Playwright:

```bash
playwright-cli open http://localhost:3000 --headed
```

If the mismatch **only happens in your normal browser** and **does not happen in Playwright**, an extension is a strong suspect.

## Sessions (Recommended)

Use a named session so the CLI keeps state (cookies/localStorage) isolated:

```bash
playwright-cli -s=ab123 open http://localhost:3000 --headed
playwright-cli -s=ab123 snapshot
```

Reset the session data:

```bash
playwright-cli -s=ab123 delete-data
```

List sessions:

```bash
playwright-cli list
```

## Save Artifacts

Use `output/playwright/<label>/...` for any saved screenshots/traces (this repo already ignores `output/`).

```bash
playwright-cli screenshot
playwright-cli tracing-start
# reproduce the issue
playwright-cli tracing-stop
```

