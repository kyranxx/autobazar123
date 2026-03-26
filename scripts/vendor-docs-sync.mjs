#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_ROOT = path.join(ROOT, "docs", "vendor");
const GENERATED_AT = new Date().toISOString();

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function slugFromUrl(url) {
  const parsed = new URL(url);
  const raw = parsed.pathname.replace(/^\/+|\/+$/g, "") || "home";
  const slug = raw
    .replace(/\.(html?|md)$/i, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 120);
  return slug || "home";
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

async function fetchWithRetry(url, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "autobazar123-doc-sync/1.0 (+local-curated-doc-pack)",
          "accept-language": "en-US,en;q=0.9",
          accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8"
        }
      });
      const body = await response.text();
      clearTimeout(timeout);
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
      } else {
        return {
          ok: true,
          status: response.status,
          finalUrl: response.url,
          body
        };
      }
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
    }
  }

  return {
    ok: false,
    status: null,
    finalUrl: url,
    error: lastError ? String(lastError.message || lastError) : "Unknown fetch error"
  };
}

function markdownEscape(value) {
  return String(value).replace(/\|/g, "\\|");
}

async function main() {
  const pkg = await readJson(path.join(ROOT, "package.json"));
  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  };

  const services = [
    {
      id: "supabase",
      name: "Supabase",
      category: "External Service",
      packages: ["@supabase/supabase-js", "@supabase/ssr"],
      evidence: ["src/lib/supabase/client.ts", "src/lib/supabase/server.ts", "supabase/config.toml"],
      docs: [
        { title: "Getting started", url: "https://supabase.com/docs/guides/getting-started" },
        { title: "Auth guides", url: "https://supabase.com/docs/guides/auth" },
        { title: "RLS guide", url: "https://supabase.com/docs/guides/database/postgres/row-level-security" },
        { title: "JavaScript client", url: "https://supabase.com/docs/reference/javascript/introduction" }
      ]
    },
    {
      id: "algolia",
      name: "Algolia",
      category: "External Service",
      packages: ["algoliasearch", "react-instantsearch"],
      evidence: ["src/lib/algolia/index.ts", "src/app/vysledky/AlgoliaSearchPageClient.tsx", "scripts/setup-algolia.ts"],
      docs: [
        { title: "What is Algolia", url: "https://www.algolia.com/doc/guides/getting-started/what-is-algolia/" },
        { title: "JavaScript API client", url: "https://www.algolia.com/doc/libraries/javascript/v5/getting-started/install/" },
        { title: "React InstantSearch", url: "https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/react/" },
        { title: "API key security", url: "https://www.algolia.com/doc/guides/security/api-keys/" }
      ]
    },
    {
      id: "stripe",
      name: "Stripe",
      category: "External Service",
      packages: ["stripe"],
      evidence: ["src/app/api/stripe/checkout/route.ts", "src/app/api/stripe/webhook/route.ts"],
      docs: [
        { title: "Checkout", url: "https://docs.stripe.com/payments/checkout" },
        { title: "Checkout session API", url: "https://docs.stripe.com/api/checkout/sessions/create" },
        { title: "Webhooks overview", url: "https://docs.stripe.com/webhooks" },
        { title: "Webhook signatures", url: "https://docs.stripe.com/webhooks/signature" }
      ]
    },
    {
      id: "cloudflare-images",
      name: "Cloudflare Images",
      category: "External Service",
      packages: [],
      evidence: ["src/app/api/images/upload-url/route.ts", "src/lib/image-optimizer.ts"],
      docs: [
        { title: "Images docs", url: "https://developers.cloudflare.com/images/" },
        { title: "Direct creator upload", url: "https://developers.cloudflare.com/images/upload-images/direct-creator-upload/" },
        { title: "Image transformations", url: "https://developers.cloudflare.com/images/transform-images/" }
      ]
    },
    {
      id: "vercel",
      name: "Vercel",
      category: "Infrastructure",
      packages: [],
      evidence: ["vercel.json", "README.md"],
      docs: [
        { title: "Vercel docs", url: "https://vercel.com/docs" },
        { title: "Cron jobs", url: "https://vercel.com/docs/cron-jobs" },
        { title: "Functions", url: "https://vercel.com/docs/functions" }
      ]
    },
    {
      id: "upstash",
      name: "Upstash Redis/Ratelimit",
      category: "External Service",
      packages: ["@upstash/redis", "@upstash/ratelimit"],
      evidence: ["src/lib/ratelimit.ts"],
      docs: [
        { title: "Redis getting started", url: "https://upstash.com/docs/redis/overall/getstarted" },
        { title: "TypeScript SDK", url: "https://upstash.com/docs/redis/sdks/ts/gettingstarted" },
        { title: "Ratelimit SDK", url: "https://upstash.com/docs/redis/sdks/ratelimit-ts/overview" }
      ]
    },
    {
      id: "resend",
      name: "Resend",
      category: "External Service",
      packages: [],
      evidence: ["src/lib/email/transactional-email.ts"],
      docs: [
        { title: "Introduction", url: "https://resend.com/docs/introduction" },
        { title: "Node.js sending", url: "https://resend.com/docs/send-with-nodejs" },
        { title: "Emails API", url: "https://resend.com/docs/api-reference/emails/send-email" }
      ]
    },
    {
      id: "google-identity-services",
      name: "Google Identity Services",
      category: "External Service",
      packages: [],
      evidence: ["src/components/GoogleOneTap.tsx", "src/lib/security/csp.ts"],
      docs: [
        { title: "Overview", url: "https://developers.google.com/identity/gsi/web/guides/overview" },
        { title: "Display button", url: "https://developers.google.com/identity/gsi/web/guides/display-button" },
        { title: "Verify ID token", url: "https://developers.google.com/identity/gsi/web/guides/verify-google-id-token" }
      ]
    },
    {
      id: "nextjs",
      name: "Next.js",
      category: "Framework",
      packages: ["next"],
      evidence: ["next.config.ts", "src/app"],
      docs: [
        { title: "Next.js docs", url: "https://nextjs.org/docs" },
        { title: "App Router", url: "https://nextjs.org/docs/app" },
        { title: "Route handlers", url: "https://nextjs.org/docs/app/building-your-application/routing/route-handlers" },
        { title: "Authentication", url: "https://nextjs.org/docs/app/guides/authentication" }
      ]
    },
    {
      id: "react",
      name: "React",
      category: "Framework",
      packages: ["react", "react-dom"],
      evidence: ["src/app", "src/components"],
      docs: [
        { title: "Learn React", url: "https://react.dev/learn" },
        { title: "React reference", url: "https://react.dev/reference/react" },
        { title: "React DOM reference", url: "https://react.dev/reference/react-dom" }
      ]
    },
    {
      id: "typescript",
      name: "TypeScript",
      category: "Language Tooling",
      packages: ["typescript"],
      evidence: ["tsconfig.json", "src"],
      docs: [
        { title: "Handbook intro", url: "https://www.typescriptlang.org/docs/handbook/intro.html" },
        { title: "Everyday types", url: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html" },
        { title: "Modules", url: "https://www.typescriptlang.org/docs/handbook/modules.html" }
      ]
    },
    {
      id: "tailwindcss",
      name: "Tailwind CSS",
      category: "Framework Tooling",
      packages: ["tailwindcss", "@tailwindcss/postcss"],
      evidence: ["postcss.config.mjs", "src/app/globals.css"],
      docs: [
        { title: "Next.js setup", url: "https://tailwindcss.com/docs/installation/framework-guides/nextjs" },
        { title: "Utility classes", url: "https://tailwindcss.com/docs/styling-with-utility-classes" },
        { title: "Theme variables", url: "https://tailwindcss.com/docs/theme" }
      ]
    },
    {
      id: "next-intl",
      name: "next-intl",
      category: "Framework Tooling",
      packages: ["next-intl"],
      evidence: ["src/i18n", "src/app/[locale]"],
      docs: [
        { title: "App Router setup", url: "https://next-intl.dev/docs/getting-started/app-router" },
        { title: "Translations usage", url: "https://next-intl.dev/docs/usage/translations" },
        { title: "Configuration", url: "https://next-intl.dev/docs/usage/configuration" }
      ]
    },
    {
      id: "playwright",
      name: "Playwright",
      category: "Testing Tooling",
      packages: ["@playwright/test"],
      evidence: ["playwright.config.ts", "tests"],
      docs: [
        { title: "Playwright intro", url: "https://playwright.dev/docs/intro" },
        { title: "Assertions", url: "https://playwright.dev/docs/test-assertions" },
        { title: "Trace viewer", url: "https://playwright.dev/docs/trace-viewer" }
      ]
    },
    {
      id: "vitest",
      name: "Vitest",
      category: "Testing Tooling",
      packages: ["vitest"],
      evidence: ["vitest.config.ts", "src/**/*.test.ts*"],
      docs: [
        { title: "Vitest guide", url: "https://vitest.dev/guide/" },
        { title: "Vitest features", url: "https://vitest.dev/guide/features" },
        { title: "Mocking", url: "https://vitest.dev/guide/mocking" }
      ]
    }
  ];

  await mkdir(OUTPUT_ROOT, { recursive: true });

  const serviceResults = [];
  for (const service of services) {
    const serviceDir = path.join(OUTPUT_ROOT, service.id);
    await mkdir(serviceDir, { recursive: true });

    const docs = [];
    for (let i = 0; i < service.docs.length; i += 1) {
      const doc = service.docs[i];
      const slug = slugFromUrl(doc.url);
      const fileName = `${String(i + 1).padStart(2, "0")}-${slug}.html`;
      const localPath = path.join(serviceDir, fileName);
      const fetchResult = await fetchWithRetry(doc.url);

      if (fetchResult.ok) {
        await writeFile(localPath, fetchResult.body, "utf8");
      }

      docs.push({
        title: doc.title,
        sourceUrl: doc.url,
        status: fetchResult.ok ? "ok" : "failed",
        httpStatus: fetchResult.status,
        finalUrl: fetchResult.finalUrl,
        localFile: fetchResult.ok ? toPosix(path.relative(ROOT, localPath)) : null,
        error: fetchResult.ok ? null : fetchResult.error
      });
    }

    const manifest = {
      generatedAt: GENERATED_AT,
      service: {
        id: service.id,
        name: service.name,
        category: service.category,
        packages: service.packages.map((pkgName) => ({
          name: pkgName,
          version: deps[pkgName] || "not-from-package-json"
        })),
        evidence: service.evidence
      },
      docs
    };

    await writeFile(path.join(serviceDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
    serviceResults.push(manifest);
  }

  const topManifest = {
    generatedAt: GENERATED_AT,
    totals: {
      services: serviceResults.length,
      docsPlanned: serviceResults.reduce((sum, svc) => sum + svc.docs.length, 0),
      docsDownloaded: serviceResults.reduce(
        (sum, svc) => sum + svc.docs.filter((doc) => doc.status === "ok").length,
        0
      )
    },
    services: serviceResults
  };

  await writeFile(path.join(OUTPUT_ROOT, "manifest.json"), JSON.stringify(topManifest, null, 2), "utf8");

  const lines = [];
  lines.push("# Vendor Docs Pack");
  lines.push("");
  lines.push(`Generated: ${GENERATED_AT}`);
  lines.push("");
  lines.push("This folder contains a curated local docs pack for technologies and services used in this repository.");
  lines.push("");
  lines.push("## Stack Inventory");
  lines.push("");
  lines.push("| Technology/Service | Category | Packages | Repo Evidence |");
  lines.push("|---|---|---|---|");
  for (const svc of serviceResults) {
    const packageText = svc.service.packages.length
      ? svc.service.packages.map((pkgInfo) => `${pkgInfo.name} (${pkgInfo.version})`).join(", ")
      : "-";
    lines.push(
      `| ${markdownEscape(svc.service.name)} | ${markdownEscape(svc.service.category)} | ${markdownEscape(packageText)} | ${markdownEscape(svc.service.evidence.join(", "))} |`
    );
  }

  lines.push("");
  lines.push("## Download Status");
  lines.push("");
  lines.push("| Technology/Service | Downloaded | Planned | Folder |");
  lines.push("|---|---:|---:|---|");
  for (const svc of serviceResults) {
    const downloaded = svc.docs.filter((doc) => doc.status === "ok").length;
    const planned = svc.docs.length;
    const folder = `docs/vendor/${svc.service.id}/`;
    lines.push(`| ${markdownEscape(svc.service.name)} | ${downloaded} | ${planned} | ${folder} |`);
  }

  lines.push("");
  lines.push("## Source Index");
  lines.push("");
  for (const svc of serviceResults) {
    lines.push(`### ${svc.service.name}`);
    lines.push("");
    for (const doc of svc.docs) {
      if (doc.status === "ok") {
        lines.push(
          `- ${doc.title}: [source](${doc.sourceUrl}) -> [local](${doc.localFile}) (HTTP ${doc.httpStatus})`
        );
      } else {
        lines.push(`- ${doc.title}: [source](${doc.sourceUrl}) -> FAILED (${doc.error || "unknown"})`);
      }
    }
    lines.push("");
  }

  await writeFile(path.join(OUTPUT_ROOT, "index.md"), `${lines.join("\n")}\n`, "utf8");

  console.log("Vendor docs sync complete.");
  console.log(JSON.stringify(topManifest.totals, null, 2));
}

main().catch((error) => {
  console.error("Vendor docs sync failed.");
  console.error(error);
  process.exitCode = 1;
});
